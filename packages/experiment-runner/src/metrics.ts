/**
 * The standard metric vocabulary recorded for every (task × subject) run. These describe how a
 * harness actually behaved — the raw material of a harness comparison. Values are recorded by a
 * human observing the run (or extracted from a captured trace); Blacklight scaffolds the
 * template and aggregates the results, but never fabricates a value.
 */

export type MetricKind = "number" | "boolean" | "enum" | "text";

export interface MetricDef {
  key: string;
  label: string;
  kind: MetricKind;
  /** Allowed values for an enum metric. */
  options?: string[];
}

/** The full standard set, in a sensible recording order. */
export const DEFAULT_METRICS: MetricDef[] = [
  { key: "files-searched", label: "Files searched", kind: "number" },
  { key: "files-read", label: "Files read", kind: "number" },
  { key: "context-selected", label: "Context selected", kind: "text" },
  { key: "plans-produced", label: "Plans produced", kind: "number" },
  { key: "commands-executed", label: "Commands executed", kind: "number" },
  { key: "edits-made", label: "Edits made", kind: "number" },
  { key: "permission-requests", label: "Permission requests", kind: "number" },
  { key: "subagents-used", label: "Subagents used", kind: "number" },
  { key: "tests-run", label: "Tests run", kind: "number" },
  { key: "failures-encountered", label: "Failures encountered", kind: "number" },
  { key: "retries-attempted", label: "Retries attempted", kind: "number" },
  { key: "scope-violations", label: "Scope violations", kind: "number" },
  { key: "context-compactions", label: "Context compactions", kind: "number" },
  { key: "completion-claimed", label: "Completion claimed", kind: "boolean" },
  {
    key: "actual-correctness",
    label: "Actual correctness",
    kind: "enum",
    options: ["correct", "partial", "incorrect", "unknown"],
  },
];

export type MetricValue = string | number | boolean | null;

/** Resolve a spec's metric keys to their definitions, defaulting to the full set. */
export function resolveMetrics(keys?: string[]): MetricDef[] {
  if (!keys || keys.length === 0) return DEFAULT_METRICS;
  const byKey = new Map(DEFAULT_METRICS.map((m) => [m.key, m]));
  return keys.map((k) => byKey.get(k) ?? { key: k, label: k, kind: "text" as const });
}

/** Numeric metrics are the ones we can meaningfully aggregate across tasks. */
export function isNumeric(def: MetricDef): boolean {
  return def.kind === "number";
}
