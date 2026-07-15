/**
 * Scaffold and read experiment runs. For every (task × subject) pair the runner creates a run
 * directory with a `metrics.yaml` template a human fills in from the observed run. Scaffolding
 * is idempotent — it never overwrites a template that already has recorded data.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import type { InvestigationSpec, Subject, Task } from "./schema.ts";
import { resolveMetrics, type MetricDef, type MetricValue } from "./metrics.ts";

export interface RecordedRun {
  taskId: string;
  subjectId: string;
  metrics: Record<string, MetricValue>;
  notes?: string;
  /** True once at least one metric has been filled in. */
  recorded: boolean;
  path: string;
}

export interface ScaffoldResult {
  created: string[];
  existing: string[];
}

function runPath(runsDir: string, task: Task, subject: Subject): string {
  return join(runsDir, task.id, subject.id, "metrics.yaml");
}

function commentBlock(text: string, indent = "#   "): string {
  return text
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

/** Render a fresh `metrics.yaml` template for one run. */
export function renderMetricsTemplate(task: Task, subject: Subject, metrics: MetricDef[]): string {
  const metricLines = metrics
    .map((m) => {
      const hint = m.kind === "enum" && m.options ? `  # ${m.options.join(" | ")}` : "";
      return `  ${m.key}: null${hint}`;
    })
    .join("\n");

  return `# Blacklight run metrics — do not guess; leave null if not observed (see RESEARCH-POLICY.md).
# Task: ${task.id} — ${task.title}
# Subject: ${subject.name}
# Prompt:
${commentBlock(task.prompt)}
task: ${task.id}
subject: ${subject.id}
metrics:
${metricLines}
notes: ""
`;
}

/** Create run directories and metric templates for every (task × subject). Idempotent. */
export function scaffoldRuns(spec: InvestigationSpec, runsDir: string): ScaffoldResult {
  const metrics = resolveMetrics(spec.metrics);
  const created: string[] = [];
  const existing: string[] = [];

  for (const task of spec.tasks) {
    for (const subject of spec.subjects) {
      const path = runPath(runsDir, task, subject);
      if (existsSync(path)) {
        existing.push(path);
        continue;
      }
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, renderMetricsTemplate(task, subject, metrics), "utf8");
      created.push(path);
    }
  }

  return { created, existing };
}

interface RawRun {
  metrics?: Record<string, MetricValue>;
  notes?: string;
}

function isFilled(value: MetricValue): boolean {
  return value !== null && value !== "";
}

/** Read the recorded run for every (task × subject), whether filled in or not. */
export function readRuns(spec: InvestigationSpec, runsDir: string): RecordedRun[] {
  const metrics = resolveMetrics(spec.metrics);
  const runs: RecordedRun[] = [];

  for (const task of spec.tasks) {
    for (const subject of spec.subjects) {
      const path = runPath(runsDir, task, subject);
      const values: Record<string, MetricValue> = Object.fromEntries(metrics.map((m) => [m.key, null]));
      let notes: string | undefined;

      if (existsSync(path)) {
        try {
          const raw = parse(readFileSync(path, "utf8")) as RawRun;
          for (const m of metrics) {
            const v = raw.metrics?.[m.key];
            values[m.key] = v === undefined ? null : v;
          }
          notes = raw.notes || undefined;
        } catch {
          // Malformed template — treat as unrecorded rather than crashing the report.
        }
      }

      runs.push({
        taskId: task.id,
        subjectId: subject.id,
        metrics: values,
        ...(notes ? { notes } : {}),
        recorded: Object.values(values).some(isFilled),
        path,
      });
    }
  }

  return runs;
}
