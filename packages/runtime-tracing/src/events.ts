/**
 * The normalized runtime-trace event. Every source of runtime behaviour — a wrapped process,
 * Claude Code hooks, a Claude Code session transcript, an OpenTelemetry export — is mapped into
 * this one shape, written to `runtime-trace.jsonl`, and rendered from it.
 *
 * The `parentId` field is what lets a flat event stream reconstruct the execution hierarchy
 * (interaction → model request / hook execution / tool call → permission wait / subagent).
 */

export type TraceEventType =
  // Process-wrapper events.
  | "process.spawn"
  | "process.stdout"
  | "process.stderr"
  | "process.exit"
  // Agent-harness events (Claude Code hooks / session / OTel).
  | "interaction"
  | "model.request"
  | "hook.execution"
  | "tool.call"
  | "permission.wait"
  | "subagent.call";

export interface TraceEvent {
  /** Unique within a trace; also the anchor for `parentId` links. */
  id: string;
  type: TraceEventType;
  /** Wall-clock time, ISO 8601. */
  ts: string;
  /** Milliseconds since the trace started — for ordering and duration. */
  atMs: number;
  /** Parent event id, forming the execution hierarchy. */
  parentId?: string;
  /** Event-specific payload (command, text, tool name, span attributes…). */
  data?: Record<string, unknown>;
}

/** Monotonic id generator for a single trace. */
export function createIdFactory(prefix = "e"): () => string {
  let n = 0;
  return () => `${prefix}${n++}`;
}
