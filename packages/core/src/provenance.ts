/**
 * Provenance is the heart of Blacklight's research policy.
 *
 * Every fact the engine records — a graph node, an edge, a concept, a finding — must declare
 * whether it was *observed* (captured directly from the target) or *inferred* (reasoned to,
 * and therefore fallible), and must point at where it came from. If a fact cannot cite a
 * source, it is an inference by definition. See RESEARCH-POLICY.md.
 */

/** Whether a fact was captured directly, or derived by reasoning. */
export type EvidenceKind = "observation" | "inference";

/** Where a fact came from. The shape encodes what kind of source it is. */
export type SourceRef =
  /** A location in the target's own source tree. */
  | { type: "file"; path: string; startLine?: number; endLine?: number }
  /** A single event in a captured runtime trace. */
  | { type: "trace"; eventId: string }
  /** An external document we cite but do not copy (a paper, official docs). */
  | { type: "external"; citation: string; url?: string }
  /** An inference derived from other facts, referenced by their ids. */
  | { type: "derived"; from: string[] };

/** Ties a recorded fact to its origin and its epistemic status. */
export interface Provenance {
  kind: EvidenceKind;
  source: SourceRef;
  /** Optional human note explaining the capture or the reasoning. */
  note?: string;
}

/** Convenience: an observation sourced from a file location. */
export function observedInFile(
  path: string,
  range?: { startLine?: number; endLine?: number },
  note?: string,
): Provenance {
  return {
    kind: "observation",
    source: { type: "file", path, ...range },
    note,
  };
}

/** Convenience: an observation sourced from a trace event. */
export function observedInTrace(eventId: string, note?: string): Provenance {
  return { kind: "observation", source: { type: "trace", eventId }, note };
}

/** Convenience: an inference derived from other facts (by id). */
export function inferredFrom(fromIds: string[], note?: string): Provenance {
  return { kind: "inference", source: { type: "derived", from: fromIds }, note };
}

/** Convenience: a fact grounded in an external, cited source. */
export function citedFrom(citation: string, url?: string, note?: string): Provenance {
  return { kind: "inference", source: { type: "external", citation, url }, note };
}
