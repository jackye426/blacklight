/**
 * Read a Claude Code session transcript (append-only JSONL) into {@link TraceEvent}s.
 *
 * The transcript schema varies across versions, so this reader is deliberately tolerant: it
 * recognises the stable shape (entries with a role/type, a `message.content` array that may
 * hold `tool_use` / `tool_result` items, and optional `uuid`/`parentUuid` links) and maps what
 * it can, silently skipping lines it does not understand.
 */

import { createIdFactory, type TraceEvent } from "@blacklight/runtime-tracing";

interface ContentItem {
  type?: string;
  name?: string;
  id?: string;
  tool_use_id?: string;
}

interface SessionEntry {
  type?: string;
  role?: string;
  uuid?: string;
  parentUuid?: string;
  timestamp?: string;
  message?: { role?: string; content?: ContentItem[] | string };
}

function roleOf(entry: SessionEntry): string | undefined {
  return entry.message?.role ?? entry.role ?? entry.type;
}

function contentItems(entry: SessionEntry): ContentItem[] {
  const content = entry.message?.content;
  return Array.isArray(content) ? content : [];
}

export function readClaudeSession(jsonlText: string): TraceEvent[] {
  const nextId = createIdFactory("s");
  const events: TraceEvent[] = [];
  const idByUuid = new Map<string, string>();
  let startMs: number | undefined;
  let currentInteraction: string | undefined;

  const push = (event: TraceEvent, uuid?: string): void => {
    events.push(event);
    if (uuid) idByUuid.set(uuid, event.id);
  };

  for (const raw of jsonlText.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let entry: SessionEntry;
    try {
      entry = JSON.parse(raw) as SessionEntry;
    } catch {
      continue;
    }

    const at = entry.timestamp ? Date.parse(entry.timestamp) : Date.now();
    startMs ??= at;
    const atMs = Number.isNaN(at) ? 0 : at - (startMs ?? at);
    const parentFromUuid = entry.parentUuid ? idByUuid.get(entry.parentUuid) : undefined;
    const role = roleOf(entry);

    if (role === "user") {
      // A user turn opens an interaction (unless it's just a tool_result carrier).
      const isToolResult = contentItems(entry).some((c) => c.type === "tool_result");
      if (isToolResult) continue;
      const event: TraceEvent = { id: nextId(), type: "interaction", ts: entry.timestamp ?? "", atMs };
      currentInteraction = event.id;
      push(event, entry.uuid);
    } else if (role === "assistant") {
      const modelEvent: TraceEvent = {
        id: nextId(),
        type: "model.request",
        ts: entry.timestamp ?? "",
        atMs,
        ...(parentFromUuid ?? currentInteraction ? { parentId: parentFromUuid ?? currentInteraction } : {}),
      };
      push(modelEvent, entry.uuid);
      // Tool calls requested within this assistant turn.
      for (const item of contentItems(entry)) {
        if (item.type === "tool_use") {
          push({
            id: nextId(),
            type: "tool.call",
            ts: entry.timestamp ?? "",
            atMs,
            parentId: modelEvent.id,
            data: { tool: item.name, toolUseId: item.id },
          });
        }
      }
    }
  }

  return events;
}
