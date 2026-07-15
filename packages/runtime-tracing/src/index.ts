/**
 * @blacklight/runtime-tracing — capture and render runtime behaviour.
 *
 * {@link traceProcess} wraps a child process into {@link TraceEvent}s;
 * {@link renderExecutionFlowMarkdown} turns any event stream into `execution-flow.md`. Agent
 * harnesses (e.g. Claude Code) map their own lifecycle onto the same {@link TraceEvent} shape.
 */

export * from "./events.ts";
export * from "./process.ts";
export * from "./render.ts";
