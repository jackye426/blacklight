/**
 * `atlas compare <investigation.yaml>` — scaffold and report a comparative experiment.
 *
 *   atlas compare <yaml>            Scaffold a metrics template per (task × subject) run
 *   atlas compare <yaml> --report   Generate the comparison report from recorded runs
 */

import { writeText } from "@blacklight/core";
import {
  generateComparisonReport,
  loadInvestigationSpec,
  readRuns,
  scaffoldRuns,
} from "@blacklight/experiment-runner";
import { join } from "node:path";
import { parseArgs, stringFlag } from "../args.ts";
import { findingsDir, investigationsDir } from "../paths.ts";
import { dim, fail, heading, ok, step, warn } from "../ui.ts";

export async function runCompare(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv);
  const specPath = positionals[0];
  if (!specPath) {
    fail("Usage: atlas compare <investigation.yaml> [--report] [--out <dir>]");
    process.exitCode = 1;
    return;
  }

  const spec = loadInvestigationSpec(specPath);
  const runsDir = join(investigationsDir(stringFlag(flags, "out")), spec.name, "runs");

  if (flags["report"]) {
    heading(`Reporting ${spec.name}`);
    const runs = readRuns(spec, runsDir);
    const recorded = runs.filter((r) => r.recorded).length;
    const reportPath = join(findingsDir(), "comparisons", `${spec.name}.md`);
    await writeText(reportPath, generateComparisonReport(spec, runs));
    ok(`Report written for ${recorded}/${runs.length} recorded runs`);
    if (recorded < runs.length) warn(`${runs.length - recorded} run(s) still unrecorded (shown as —)`);
    console.log(dim(`Written to ${reportPath}`));
    return;
  }

  heading(`Scaffolding ${spec.name}`);
  step(`${spec.tasks.length} tasks × ${spec.subjects.length} subjects = ${spec.tasks.length * spec.subjects.length} runs`);
  const { created, existing } = scaffoldRuns(spec, runsDir);
  ok(`Created ${created.length} run template(s)`);
  if (existing.length) ok(`Kept ${existing.length} existing run(s) (not overwritten)`);
  console.log(dim(`Runs under ${runsDir}`));
  console.log(dim("Fill each metrics.yaml from the observed run, then: atlas compare <yaml> --report"));
}
