/**
 * Generate the comparison report from recorded runs. The per-task tables are **observations**
 * (transcribed from the runs); the closing questions are **inferences** to be argued from that
 * evidence. The report keeps the two visibly separate — it never answers the questions for you.
 */

import type { InvestigationSpec } from "./schema.ts";
import type { RecordedRun } from "./scaffold.ts";
import { isNumeric, resolveMetrics, type MetricValue } from "./metrics.ts";

/** The design questions this comparison exists to inform (answered as findings, not here). */
const OPEN_QUESTIONS = [
  "Does explicit planning materially improve execution?",
  "How does each harness recover from failure?",
  "Which system verifies completion rather than merely claiming it?",
  "Which context-selection strategy works best?",
  "What does TaskGraph OS provide that the major harnesses still lack?",
  "Which TaskGraph mechanisms should be removed because the harness already handles them?",
];

function fmt(value: MetricValue): string {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function runFor(runs: RecordedRun[], taskId: string, subjectId: string): RecordedRun | undefined {
  return runs.find((r) => r.taskId === taskId && r.subjectId === subjectId);
}

function taskTable(spec: InvestigationSpec, runs: RecordedRun[], taskId: string): string {
  const metrics = resolveMetrics(spec.metrics);
  const header = `| Metric | ${spec.subjects.map((s) => s.name).join(" | ")} |`;
  const divider = `| --- | ${spec.subjects.map(() => "---").join(" | ")} |`;
  const rows = metrics.map((m) => {
    const cells = spec.subjects.map((s) => fmt(runFor(runs, taskId, s.id)?.metrics[m.key] ?? null));
    return `| ${m.label} | ${cells.join(" | ")} |`;
  });
  return [header, divider, ...rows].join("\n");
}

function crossTaskSummary(spec: InvestigationSpec, runs: RecordedRun[]): string {
  const numeric = resolveMetrics(spec.metrics).filter(isNumeric);
  if (numeric.length === 0) return "_No numeric metrics to aggregate._";

  const header = `| Metric (totals) | ${spec.subjects.map((s) => s.name).join(" | ")} |`;
  const divider = `| --- | ${spec.subjects.map(() => "---").join(" | ")} |`;
  const rows = numeric.map((m) => {
    const cells = spec.subjects.map((s) => {
      let total = 0;
      let any = false;
      for (const task of spec.tasks) {
        const v = runFor(runs, task.id, s.id)?.metrics[m.key];
        if (typeof v === "number") {
          total += v;
          any = true;
        }
      }
      return any ? String(total) : "—";
    });
    return `| ${m.label} | ${cells.join(" | ")} |`;
  });
  return [header, divider, ...rows].join("\n");
}

export function generateComparisonReport(spec: InvestigationSpec, runs: RecordedRun[]): string {
  const recorded = runs.filter((r) => r.recorded).length;
  const total = runs.length;

  const taskSections = spec.tasks
    .map((task) => {
      return `### ${task.title}  \`${task.id}\`

> ${task.prompt.replace(/\n/g, "\n> ")}

${taskTable(spec, runs, task.id)}`;
    })
    .join("\n\n");

  return `# Comparison — ${spec.name}

${spec.description ?? ""}

> **Recording status:** ${recorded}/${total} runs recorded.
>
> The per-task tables below are **observations** transcribed from the runs. The **Open
> questions** at the end are **inferences** — answer them from this evidence in prose or in
> \`findings/reusable-patterns/\`, and cite the tables. Do not treat an unfilled cell (—) as a
> zero. See RESEARCH-POLICY.md.

## Per-task results

${taskSections}

## Cross-task summary

${crossTaskSummary(spec, runs)}

## Open questions (answer as findings, with citations)

${OPEN_QUESTIONS.map((q) => `- [ ] ${q}`).join("\n")}
`;
}
