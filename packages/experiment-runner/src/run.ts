/**
 * Self-recording runs. `prepareRun` copies the task's fixture into an isolated workspace and
 * commits a git baseline; the human then drives any harness (CLI or GUI) inside that workspace.
 * `finishRun` measures what is honestly observable from the outside:
 *
 *   - git diff vs baseline  → edits-made, scope-violations (fixture-declared protected paths)
 *   - the task's grader     → actual-correctness, judged against the fixture's known answers
 *   - caller-supplied extras (e.g. Claude Code hook-trace counts) → richer metrics
 *
 * Everything else stays null. Metric values already recorded by a human are never overwritten.
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { InvestigationSpec, Subject, Task } from "./schema.ts";
import { resolveMetrics, type MetricValue } from "./metrics.ts";
import { renderMetricsTemplate } from "./scaffold.ts";

export interface RunPaths {
  runDir: string;
  workspace: string;
  metricsFile: string;
  runMeta: string;
}

export interface PreparedRun {
  task: Task;
  subject: Subject;
  paths: RunPaths;
}

export interface FinishSummary {
  editsMade: number;
  scopeViolations: number;
  /** Grader verdict, if the task has a grader and it produced one. */
  correctness?: "correct" | "partial" | "incorrect";
  graderOutput?: string;
  /** Metric keys written into metrics.yaml this pass. */
  updated: string[];
  /** Metric keys skipped because a (human-recorded) value was already present. */
  skippedExisting: string[];
  metricsFile: string;
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

export function runPaths(runsDir: string, taskId: string, subjectId: string): RunPaths {
  const runDir = join(runsDir, taskId, subjectId);
  return {
    runDir,
    workspace: join(runDir, "workspace"),
    metricsFile: join(runDir, "metrics.yaml"),
    runMeta: join(runDir, "run.json"),
  };
}

function findTask(spec: InvestigationSpec, taskId: string): Task {
  const task = spec.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Unknown task '${taskId}'. Tasks: ${spec.tasks.map((t) => t.id).join(", ")}`);
  return task;
}

function findSubject(spec: InvestigationSpec, subjectId: string): Subject {
  const subject = spec.subjects.find((s) => s.id === subjectId);
  if (!subject) {
    throw new Error(`Unknown subject '${subjectId}'. Subjects: ${spec.subjects.map((s) => s.id).join(", ")}`);
  }
  return subject;
}

function fixtureFor(spec: InvestigationSpec, task: Task, yamlDir: string): { abs: string; protected: string[] } {
  const fixture = spec.fixtures?.find((f) => f.id === task.fixture);
  if (!fixture) throw new Error(`Task '${task.id}' has no resolvable fixture ('${task.fixture ?? "none"}')`);
  const abs = isAbsolute(fixture.path) ? fixture.path : resolve(yamlDir, fixture.path);
  if (!existsSync(abs)) throw new Error(`Fixture path does not exist: ${abs}`);
  return { abs, protected: fixture.protected ?? [] };
}

/**
 * Create (or reset) the isolated workspace for one (task × subject) run: copy the fixture,
 * `git init`, and commit the baseline everything later diffs against.
 */
export function prepareRun(
  spec: InvestigationSpec,
  yamlDir: string,
  runsDir: string,
  taskId: string,
  subjectId: string,
): PreparedRun {
  const task = findTask(spec, taskId);
  const subject = findSubject(spec, subjectId);
  const { abs: fixtureAbs } = fixtureFor(spec, task, yamlDir);
  const paths = runPaths(runsDir, taskId, subjectId);

  // `start` means "fresh run": a stale workspace is discarded so every run begins identically.
  if (existsSync(paths.workspace)) rmSync(paths.workspace, { recursive: true, force: true });
  cpSync(fixtureAbs, paths.workspace, { recursive: true });

  git(paths.workspace, "init", "-q");
  git(paths.workspace, "add", "-A");
  git(
    paths.workspace,
    "-c", "user.name=blacklight",
    "-c", "user.email=blacklight@local",
    "commit", "-q", "-m", "blacklight baseline",
  );

  writeFileSync(
    paths.runMeta,
    JSON.stringify({ taskId, subjectId, startedAt: new Date().toISOString() }, null, 2) + "\n",
    "utf8",
  );

  // Make sure the metrics template exists so `finish` always has a file to fill.
  if (!existsSync(paths.metricsFile)) {
    writeFileSync(paths.metricsFile, renderMetricsTemplate(task, subject, resolveMetrics(spec.metrics)), "utf8");
  }

  return { task, subject, paths };
}

/** Working-tree changes vs baseline, as repo-relative paths (renames report the new path). */
function changedPaths(workspace: string): string[] {
  const out = git(workspace, "status", "--porcelain", "--", ".", ":(exclude).claude");
  return out
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      let p = line.slice(3);
      const arrow = p.indexOf(" -> ");
      if (arrow !== -1) p = p.slice(arrow + 4);
      return p.replace(/^"|"$/g, "");
    });
}

type Verdict = "correct" | "partial" | "incorrect";

/** Run the task's grader (if any) against the workspace. Non-verdict exits mean "ungraded". */
function grade(task: Task, yamlDir: string, workspace: string): { verdict?: Verdict; output: string } {
  if (!task.grader) return { output: "" };
  const graderAbs = isAbsolute(task.grader) ? task.grader : resolve(yamlDir, task.grader);
  if (!existsSync(graderAbs)) return { output: `grader not found: ${graderAbs}` };

  try {
    const output = execFileSync(process.execPath, [graderAbs, workspace], {
      cwd: workspace,
      encoding: "utf8",
      timeout: 30_000,
    });
    return { verdict: "correct", output: output.trim() };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    const output = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    if (e.status === 3) return { verdict: "partial", output };
    if (e.status === 1) return { verdict: "incorrect", output };
    return { output: output || `grader exited with unexpected status ${e.status}` };
  }
}

function formatYamlValue(value: MetricValue): string {
  if (typeof value === "string") return /^[a-zA-Z0-9_-]+$/.test(value) ? value : JSON.stringify(value);
  return String(value);
}

/**
 * Fill `null` metric fields in a metrics.yaml text with computed values, preserving all
 * comments and any values a human already recorded (non-null fields are never touched).
 */
export function fillMetricsYaml(
  text: string,
  values: Record<string, MetricValue>,
  notes?: string,
): { text: string; updated: string[]; skippedExisting: string[] } {
  const updated: string[] = [];
  const skippedExisting: string[] = [];
  let out = text;

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    const nullLine = new RegExp(`^(\\s*${key}): null(\\s*(?:#.*)?)$`, "m");
    if (nullLine.test(out)) {
      out = out.replace(nullLine, `$1: ${formatYamlValue(value)}$2`);
      updated.push(key);
    } else if (new RegExp(`^\\s*${key}:`, "m").test(out)) {
      skippedExisting.push(key);
    }
  }

  if (notes && /^notes: ""$/m.test(out)) {
    out = out.replace(/^notes: ""$/m, `notes: ${JSON.stringify(notes)}`);
    updated.push("notes");
  }

  return { text: out, updated, skippedExisting };
}

export interface FinishOptions {
  /** Extra observed metrics (e.g. counts derived from a Claude Code hook trace). */
  extraMetrics?: Record<string, MetricValue>;
  /** Whether the harness claimed completion — observed by the human driving it. */
  completionClaimed?: boolean;
  notes?: string;
}

/** Measure a finished run and fill its metrics.yaml. */
export function finishRun(
  spec: InvestigationSpec,
  yamlDir: string,
  runsDir: string,
  taskId: string,
  subjectId: string,
  options: FinishOptions = {},
): FinishSummary {
  const task = findTask(spec, taskId);
  findSubject(spec, subjectId);
  const { protected: protectedPaths } = fixtureFor(spec, task, yamlDir);
  const paths = runPaths(runsDir, taskId, subjectId);

  if (!existsSync(paths.workspace)) {
    throw new Error(`No workspace for ${taskId}/${subjectId} — run \`atlas run start\` first.`);
  }

  const changed = changedPaths(paths.workspace);
  const violations = changed.filter((p) =>
    protectedPaths.some((prot) => p === prot || p.startsWith(prot.replace(/\/?$/, "/"))),
  );
  const { verdict, output: graderOutput } = grade(task, yamlDir, paths.workspace);

  // Observed values only; trace-derived extras override git-derived where both exist (a hook
  // trace counts edit operations more precisely than a file-level diff).
  const values: Record<string, MetricValue> = {
    "edits-made": changed.length,
    "scope-violations": violations.length,
    ...(verdict ? { "actual-correctness": verdict } : {}),
    ...(options.completionClaimed !== undefined ? { "completion-claimed": options.completionClaimed } : {}),
    ...(options.extraMetrics ?? {}),
  };

  const noteParts = [
    options.notes,
    graderOutput ? `grader: ${graderOutput}` : undefined,
    violations.length ? `protected paths touched: ${violations.join(", ")}` : undefined,
  ].filter((s): s is string => Boolean(s));

  const before = readFileSync(paths.metricsFile, "utf8");
  const { text, updated, skippedExisting } = fillMetricsYaml(before, values, noteParts.join(" | ") || undefined);
  writeFileSync(paths.metricsFile, text, "utf8");

  return {
    editsMade: changed.length,
    scopeViolations: violations.length,
    ...(verdict ? { correctness: verdict } : {}),
    ...(graderOutput ? { graderOutput } : {}),
    updated,
    skippedExisting,
    metricsFile: paths.metricsFile,
  };
}
