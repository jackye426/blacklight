/**
 * Wrap a child process and capture its execution as {@link TraceEvent}s: the spawn, each line
 * of stdout/stderr, and the exit (with code, signal, and duration). Output capture is capped so
 * a chatty process cannot produce an unbounded trace.
 */

import { spawn } from "node:child_process";
import { createIdFactory, type TraceEvent } from "./events.ts";

export interface TraceProcessOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Called for every captured event, in order — used to stream to `runtime-trace.jsonl`. */
  onEvent?: (event: TraceEvent) => void;
  /** Also echo the child's output to this process's stdio. Default true. */
  inherit?: boolean;
  /** Max output lines captured per stream before truncating. Default 5000. */
  maxOutputLines?: number;
}

export interface TraceProcessResult {
  command: string;
  args: string[];
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  events: TraceEvent[];
}

/** Split a growing buffer into complete lines, returning [lines, remainder]. */
function drainLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split(/\r?\n/);
  const rest = parts.pop() ?? "";
  return { lines: parts, rest };
}

export function traceProcess(
  command: string,
  args: string[],
  options: TraceProcessOptions = {},
): Promise<TraceProcessResult> {
  const { cwd, env, onEvent, inherit = true, maxOutputLines = 5000 } = options;
  const nextId = createIdFactory();
  const events: TraceEvent[] = [];
  const start = Date.now();

  const emit = (
    type: TraceEvent["type"],
    data?: Record<string, unknown>,
    parentId?: string,
  ): TraceEvent => {
    const event: TraceEvent = {
      id: nextId(),
      type,
      ts: new Date().toISOString(),
      atMs: Date.now() - start,
      ...(parentId ? { parentId } : {}),
      ...(data ? { data } : {}),
    };
    events.push(event);
    onEvent?.(event);
    return event;
  };

  const spawnEvent = emit("process.spawn", { command, args, cwd: cwd ?? process.cwd() });

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const counts = { stdout: 0, stderr: 0 };
    const buffers = { stdout: "", stderr: "" };

    const handle = (stream: "stdout" | "stderr", chunk: Buffer): void => {
      if (inherit) process[stream].write(chunk);
      buffers[stream] += chunk.toString("utf8");
      const { lines, rest } = drainLines(buffers[stream]);
      buffers[stream] = rest;
      for (const line of lines) {
        if (counts[stream] < maxOutputLines) {
          emit(stream === "stdout" ? "process.stdout" : "process.stderr", { text: line }, spawnEvent.id);
        }
        counts[stream]++;
      }
    };

    child.stdout.on("data", (c: Buffer) => handle("stdout", c));
    child.stderr.on("data", (c: Buffer) => handle("stderr", c));

    child.on("error", (err) => reject(err));

    child.on("close", (code, signal) => {
      // Flush any trailing partial line.
      for (const stream of ["stdout", "stderr"] as const) {
        if (buffers[stream] && counts[stream] < maxOutputLines) {
          emit(stream === "stdout" ? "process.stdout" : "process.stderr", { text: buffers[stream] }, spawnEvent.id);
        }
      }
      const durationMs = Date.now() - start;
      emit("process.exit", {
        exitCode: code,
        signal,
        durationMs,
        stdoutLines: counts.stdout,
        stderrLines: counts.stderr,
        truncated: counts.stdout > maxOutputLines || counts.stderr > maxOutputLines,
      });
      resolve({ command, args, exitCode: code, signal, durationMs, events });
    });
  });
}
