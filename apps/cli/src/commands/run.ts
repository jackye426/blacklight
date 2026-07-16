/**
 * `atlas run` — self-recording experiment runs for any harness, CLI or GUI.
 *
 *   atlas run start  <yaml> <task> <subject>   Fresh workspace + git baseline (+ CC hooks)
 *   atlas run finish <yaml> <task> <subject>   Measure the run and fill metrics.yaml
 *
 * Between the two commands the human drives the harness inside the printed workspace — open it
 * in Cursor / VS Code (Codex extension) or run `claude` in it. `finish` records only what was
 * observed: git diff, grader verdict, and (for Claude Code) hook-trace counts.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { hookTraceToMetrics, readHookTrace, writeHookHarness } from "@blacklight/adapter-claude-code";
import {
  finishRun,
  loadInvestigationSpec,
  prepareRun,
  type MetricValue,
} from "@blacklight/experiment-runner";
import { parseArgs, stringFlag } from "../args.ts";
import { investigationsDir } from "../paths.ts";
import { bold, dim, fail, heading, ok, step, warn } from "../ui.ts";

const USAGE =
  "Usage: atlas run <start|finish> <investigation.yaml> <task-id> <subject-id>\n" +
  "         finish flags: [--completion-claimed true|false] [--notes <text>] [--out <dir>]";

function claudeTraceFile(workspace: string): string {
  return join(workspace, ".claude", "blacklight-cc-trace.jsonl");
}

export async function runRun(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv);
  const [action, specPath, taskId, subjectId] = positionals;
  if (!action || !specPath || !taskId || !subjectId || (action !== "start" && action !== "finish")) {
    fail(USAGE);
    process.exitCode = 1;
    return;
  }

  const spec = loadInvestigationSpec(specPath);
  const yamlDir = dirname(resolve(specPath));
  const runsDir = join(investigationsDir(stringFlag(flags, "out")), spec.name, "runs");
  const isClaude = subjectId.includes("claude");

  if (action === "start") {
    heading(`Run start — ${taskId} × ${subjectId}`);
    const { task, paths } = prepareRun(spec, yamlDir, runsDir, taskId, subjectId);
    ok("Workspace reset to a clean fixture copy (git baseline committed)");

    if (isClaude) {
      writeHookHarness(paths.workspace);
      ok("Claude Code hook harness installed (.claude/settings.json)");
    }

    console.log(`\n${bold("Workspace:")} ${paths.workspace}`);
    console.log(
      isClaude
        ? dim("Open a terminal there and run `claude`, then paste the prompt below.")
        : dim("Open that folder in the harness (Cursor / VS Code with the agent extension) and paste the prompt below."),
    );
    console.log(`\n${bold("Prompt (give it verbatim):")}\n${"─".repeat(60)}\n${task.prompt.trim()}\n${"─".repeat(60)}`);
    console.log(dim(`\nWhen the harness is done:  pnpm atlas run finish ${specPath} ${taskId} ${subjectId}`));
    return;
  }

  heading(`Run finish — ${taskId} × ${subjectId}`);

  // For Claude Code runs, derive tool/permission/compaction counts from the hook trace.
  let extraMetrics: Record<string, MetricValue> | undefined;
  const traceFile = claudeTraceFile(join(runsDir, taskId, subjectId, "workspace"));
  if (isClaude && existsSync(traceFile)) {
    const events = readHookTrace(readFileSync(traceFile, "utf8"));
    extraMetrics = hookTraceToMetrics(events);
    ok(`Hook trace parsed: ${events.length} events`);
  } else if (isClaude) {
    warn("No hook trace found — was the run driven inside the workspace?");
  }

  const claimedFlag = stringFlag(flags, "completion-claimed");
  const summary = finishRun(spec, yamlDir, runsDir, taskId, subjectId, {
    ...(extraMetrics ? { extraMetrics } : {}),
    ...(claimedFlag !== undefined ? { completionClaimed: claimedFlag === "true" } : {}),
    ...(stringFlag(flags, "notes") ? { notes: stringFlag(flags, "notes")! } : {}),
  });

  step(`Files changed vs baseline: ${summary.editsMade}`);
  step(`Scope violations: ${summary.scopeViolations}`);
  if (summary.correctness) ok(`Grader verdict: ${summary.correctness} — ${summary.graderOutput ?? ""}`);
  else warn("No grader verdict (task ungraded or grader inconclusive) — record actual-correctness by hand if judged");
  ok(`Recorded: ${summary.updated.join(", ") || "nothing new"}`);
  if (summary.skippedExisting.length) {
    console.log(dim(`Kept existing (human-recorded) values: ${summary.skippedExisting.join(", ")}`));
  }
  console.log(dim(`Metrics file: ${summary.metricsFile}`));
  console.log(dim(`Regenerate the report anytime: pnpm atlas compare ${specPath} --report`));
}
