/**
 * Render a flat {@link TraceEvent} stream into `execution-flow.md`: a summary, an optional
 * process section, and the reconstructed execution hierarchy (interaction → model request /
 * hook execution / tool call → permission wait / subagent). High-volume output lines are
 * summarised, not listed — they live in `runtime-trace.jsonl`.
 */

import type { TraceEvent, TraceEventType } from "./events.ts";

export interface ExecutionFlowMeta {
  title: string;
  subtitle?: string;
  generatedAt?: string;
  blacklightVersion?: string;
}

const OUTPUT_TYPES = new Set<TraceEventType>(["process.stdout", "process.stderr"]);

function labelFor(e: TraceEvent): string {
  const d = e.data ?? {};
  switch (e.type) {
    case "process.spawn": {
      const args = (d["args"] as string[] | undefined)?.join(" ") ?? "";
      return `spawn \`${`${d["command"]} ${args}`.trim()}\``;
    }
    case "process.exit":
      return `exit — code=${d["exitCode"]}, ${d["durationMs"]}ms`;
    case "interaction":
      return `interaction${d["summary"] ? `: ${d["summary"]}` : ""}`;
    case "model.request":
      return `model request${d["model"] ? ` (${d["model"]})` : ""}`;
    case "hook.execution":
      return `hook: ${d["hook"] ?? d["name"] ?? "?"}`;
    case "tool.call":
      return `tool: ${d["tool"] ?? d["name"] ?? "?"}`;
    case "permission.wait":
      return `permission wait${d["tool"] ? ` (${d["tool"]})` : ""}`;
    case "subagent.call":
      return `subagent: ${d["name"] ?? "?"}`;
    default:
      return e.type;
  }
}

function countByType(events: TraceEvent[]): Map<TraceEventType, number> {
  const counts = new Map<TraceEventType, number>();
  for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  return counts;
}

/** Render the structural events (excluding raw output) as a nested tree. */
function renderTree(events: TraceEvent[]): string {
  const structural = events.filter((e) => !OUTPUT_TYPES.has(e.type));
  const byParent = new Map<string | undefined, TraceEvent[]>();
  const ids = new Set(structural.map((e) => e.id));
  for (const e of structural) {
    // Treat a parent that was filtered out (e.g. an output line) as a root.
    const parent = e.parentId && ids.has(e.parentId) ? e.parentId : undefined;
    (byParent.get(parent) ?? byParent.set(parent, []).get(parent)!).push(e);
  }

  const lines: string[] = [];
  const walk = (parent: string | undefined, depth: number): void => {
    for (const e of byParent.get(parent) ?? []) {
      lines.push(`${"  ".repeat(depth)}- ${labelFor(e)} _(+${e.atMs}ms)_`);
      walk(e.id, depth + 1);
    }
  };
  walk(undefined, 0);
  return lines.length ? lines.join("\n") : "_No structural events captured._";
}

function renderProcessSection(events: TraceEvent[]): string | undefined {
  const spawn = events.find((e) => e.type === "process.spawn");
  const exit = events.find((e) => e.type === "process.exit");
  if (!spawn) return undefined;
  const d = spawn.data ?? {};
  const x = exit?.data ?? {};
  return `## Process

- Command: \`${d["command"]} ${(d["args"] as string[] | undefined)?.join(" ") ?? ""}\`
- Working directory: \`${d["cwd"]}\`
- Exit code: ${x["exitCode"] ?? "?"}${x["signal"] ? ` (signal ${x["signal"]})` : ""}
- Duration: ${x["durationMs"] ?? "?"}ms
- Output: ${x["stdoutLines"] ?? 0} stdout / ${x["stderrLines"] ?? 0} stderr lines${x["truncated"] ? " _(truncated)_" : ""}`;
}

export function renderExecutionFlowMarkdown(events: TraceEvent[], meta: ExecutionFlowMeta): string {
  const durationMs = events.reduce((m, e) => Math.max(m, e.atMs), 0);
  const counts = [...countByType(events).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => `\`${type}\`: ${n}`)
    .join(", ");

  const sections: string[] = [
    `# Execution flow — ${meta.title}`,
    `> ${meta.subtitle ?? "Captured runtime trace."}${
      meta.generatedAt ? ` Generated ${meta.generatedAt}.` : ""
    }`,
    `## Summary\n\n- Events: ${events.length}\n- Span: ${durationMs}ms\n- By type: ${counts || "none"}`,
  ];

  const proc = renderProcessSection(events);
  if (proc) sections.push(proc);

  sections.push(`## Hierarchy\n\n${renderTree(events)}`);

  return sections.join("\n\n") + "\n";
}
