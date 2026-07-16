/**
 * @blacklight/adapter-claude-code — capture Claude Code runtime behaviour through official
 * surfaces only:
 *
 *   - {@link writeHookHarness} / {@link readHookTrace} — lifecycle hooks → trace events
 *   - {@link readClaudeSession} — the append-only session transcript → trace events
 *   - {@link readOtlpSpans} — an OpenTelemetry export → trace events
 *
 * All three normalise into the shared {@link TraceEvent} shape, so a Claude Code run renders
 * with the same `execution-flow.md` pipeline as any other traced process.
 */

export * from "./hooks.ts";
export * from "./session.ts";
export * from "./otel.ts";
export * from "./metrics.ts";
