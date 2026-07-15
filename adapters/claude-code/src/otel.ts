/**
 * Read an OpenTelemetry (OTLP/JSON) trace export into {@link TraceEvent}s.
 *
 * Claude Code can emit OTel traces whose spans form the hierarchy: interaction → model request
 * / hook execution / tool call → permission wait / subagent. We map each span to a trace event
 * by name and reconstruct the hierarchy from `parentSpanId`.
 */

import type { TraceEvent, TraceEventType } from "@blacklight/runtime-tracing";

interface OtlpValue {
  stringValue?: string;
  intValue?: string | number;
  boolValue?: boolean;
  doubleValue?: number;
}

interface OtlpSpan {
  spanId?: string;
  parentSpanId?: string;
  name?: string;
  startTimeUnixNano?: string | number;
  attributes?: { key: string; value: OtlpValue }[];
}

interface OtlpExport {
  resourceSpans?: { scopeSpans?: { spans?: OtlpSpan[] }[] }[];
}

/** Classify a span name into one of our trace event types. */
function spanType(name: string): TraceEventType {
  const n = name.toLowerCase();
  if (n.includes("subagent")) return "subagent.call";
  if (n.includes("permission")) return "permission.wait";
  if (n.includes("hook")) return "hook.execution";
  if (n.includes("tool")) return "tool.call";
  if (n.includes("model") || n.includes("gen_ai") || n.includes("request")) return "model.request";
  return "interaction";
}

function flattenAttrs(span: OtlpSpan): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const attr of span.attributes ?? []) {
    const v = attr.value;
    out[attr.key] = v.stringValue ?? v.intValue ?? v.boolValue ?? v.doubleValue;
  }
  return out;
}

function allSpans(exportDoc: OtlpExport): OtlpSpan[] {
  const spans: OtlpSpan[] = [];
  for (const rs of exportDoc.resourceSpans ?? []) {
    for (const ss of rs.scopeSpans ?? []) {
      for (const span of ss.spans ?? []) spans.push(span);
    }
  }
  return spans;
}

export function readOtlpSpans(exportDoc: OtlpExport): TraceEvent[] {
  const spans = allSpans(exportDoc).filter((s) => s.spanId);
  const starts = spans.map((s) => Number(s.startTimeUnixNano ?? 0)).filter((n) => n > 0);
  const minStart = starts.length ? Math.min(...starts) : 0;

  return spans
    .map((span) => {
      const startNano = Number(span.startTimeUnixNano ?? 0);
      const event: TraceEvent = {
        id: span.spanId!,
        type: spanType(span.name ?? ""),
        ts: startNano ? new Date(startNano / 1e6).toISOString() : "",
        atMs: startNano ? Math.round((startNano - minStart) / 1e6) : 0,
        ...(span.parentSpanId ? { parentId: span.parentSpanId } : {}),
        data: { name: span.name, ...flattenAttrs(span) },
      };
      return event;
    })
    .sort((a, b) => a.atMs - b.atMs);
}
