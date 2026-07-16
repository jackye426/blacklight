/**
 * Generate a Claude Code hooks harness that emits lifecycle events to a trace file.
 *
 * Claude Code runs a command at lifecycle points (PreToolUse, PostToolUse, SessionStart, Stop,
 * Notification, UserPromptSubmit), passing a JSON payload on stdin. We install a tiny emitter
 * that appends each firing to a JSONL trace file; {@link readHookTrace} later normalises those
 * lines into {@link TraceEvent}s.
 *
 * This produces official-surface observability — no reliance on any leaked source.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createIdFactory, type TraceEvent, type TraceEventType } from "@blacklight/runtime-tracing";

/** The hook lifecycle points we instrument. */
export const HOOK_EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Notification",
  "PreCompact",
  "Stop",
] as const;

export type HookEvent = (typeof HOOK_EVENTS)[number];

/** The self-contained emitter script (plain Node ESM, so it runs without tsx). */
export const EMIT_HOOK_SCRIPT = `#!/usr/bin/env node
// Blacklight Claude Code hook emitter. Appends one normalised JSON line per hook firing.
import { appendFileSync } from "node:fs";

const hookEvent = process.argv[2] ?? "unknown";
const traceFile = process.env.BLACKLIGHT_TRACE_FILE;
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  let payload = {};
  try { payload = JSON.parse(input || "{}"); } catch {}
  const line = JSON.stringify({ source: "claude-code-hook", hookEvent, ts: new Date().toISOString(), payload });
  if (traceFile) { try { appendFileSync(traceFile, line + "\\n"); } catch {} }
});
`;

/** Build the Claude Code `settings.json` object that wires every hook to the emitter. */
export function claudeCodeHooksSettings(emitterPath: string, traceFile: string): Record<string, unknown> {
  const hooks: Record<string, unknown> = {};
  for (const event of HOOK_EVENTS) {
    hooks[event] = [
      { matcher: "*", hooks: [{ type: "command", command: `node "${emitterPath}" ${event}` }] },
    ];
  }
  return { env: { BLACKLIGHT_TRACE_FILE: traceFile }, hooks };
}

export interface HookHarness {
  settingsPath: string;
  emitterPath: string;
  traceFile: string;
}

/**
 * Write the harness into `targetDir/.claude/`: the emitter script and a `settings.json` that
 * enables the hooks. Run Claude Code with `targetDir` as its project directory to capture.
 */
export function writeHookHarness(targetDir: string, traceFile?: string): HookHarness {
  const claudeDir = join(targetDir, ".claude");
  mkdirSync(claudeDir, { recursive: true });

  const emitterPath = join(claudeDir, "blacklight-emit-hook.mjs");
  const resolvedTrace = traceFile ?? join(claudeDir, "blacklight-cc-trace.jsonl");
  const settingsPath = join(claudeDir, "settings.json");

  writeFileSync(emitterPath, EMIT_HOOK_SCRIPT, "utf8");
  writeFileSync(settingsPath, JSON.stringify(claudeCodeHooksSettings(emitterPath, resolvedTrace), null, 2) + "\n", "utf8");

  return { settingsPath, emitterPath, traceFile: resolvedTrace };
}

/** How each hook lifecycle point maps onto a normalised trace event type. */
const HOOK_TO_EVENT: Record<HookEvent, TraceEventType> = {
  SessionStart: "interaction",
  UserPromptSubmit: "interaction",
  PreToolUse: "tool.call",
  PostToolUse: "tool.call",
  Notification: "permission.wait",
  PreCompact: "hook.execution",
  Stop: "interaction",
};

interface HookLine {
  source: "claude-code-hook";
  hookEvent: HookEvent;
  ts: string;
  payload: Record<string, unknown>;
}

/**
 * Normalise emitted hook lines into {@link TraceEvent}s. Point-in-time hooks carry no explicit
 * hierarchy, so tool/permission events are parented to the most recent interaction.
 */
export function readHookTrace(jsonlText: string): TraceEvent[] {
  const nextId = createIdFactory("h");
  const events: TraceEvent[] = [];
  let startMs: number | undefined;
  let currentInteraction: string | undefined;

  for (const raw of jsonlText.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let line: HookLine;
    try {
      line = JSON.parse(raw) as HookLine;
    } catch {
      continue;
    }
    if (line.source !== "claude-code-hook") continue;

    const at = Date.parse(line.ts);
    startMs ??= at;
    const type = HOOK_TO_EVENT[line.hookEvent] ?? "hook.execution";
    const isInteraction = type === "interaction";

    const event: TraceEvent = {
      id: nextId(),
      type,
      ts: line.ts,
      atMs: Number.isNaN(at) ? 0 : at - (startMs ?? at),
      ...(isInteraction ? {} : currentInteraction ? { parentId: currentInteraction } : {}),
      data: { hook: line.hookEvent, tool: line.payload["tool_name"], ...line.payload },
    };
    if (isInteraction) currentInteraction = event.id;
    events.push(event);
  }

  return events;
}
