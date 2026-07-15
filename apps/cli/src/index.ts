/**
 * `atlas` — Blacklight's command-line interface.
 *
 *   atlas ingest <path>          Static analysis → graph.json, concepts.json, unknowns.md
 *   atlas map <path>             Render architecture.md from the ingested graph
 *   atlas trace -- <command>     Capture a process run → runtime-trace.jsonl, execution-flow.md
 *   atlas compare <yaml>         Scaffold and report a comparative experiment
 */

import { runIngest } from "./commands/ingest.ts";
import { runMap } from "./commands/map.ts";
import { runTrace } from "./commands/trace.ts";
import { runCompare } from "./commands/compare.ts";
import { bold, dim, fail } from "./ui.ts";

const HELP = `${bold("atlas")} — Blacklight software intelligence laboratory

${bold("Usage")}
  atlas ingest  <path|github-url>   Analyse a target: graph.json, concepts.json, unknowns.md
  atlas map     <path|github-url>   Render architecture.md from the ingested graph
  atlas trace   -- <command>        Capture a process run: runtime-trace.jsonl, execution-flow.md
  atlas compare <investigation.yaml> Scaffold runs, or --report to generate the comparison

${bold("Options")}
  --out <dir>       Write investigations under <dir> instead of the repo's investigations/
  --target <name>   (trace) name the investigation for the captured run
  --report          (compare) generate the comparison report from recorded runs

${dim("Run `atlas <command>` with no arguments for command-specific usage.")}`;

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  switch (command) {
    case "ingest":
      return runIngest(rest);
    case "map":
      return runMap(rest);
    case "trace":
      return runTrace(rest);
    case "compare":
      return runCompare(rest);
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return;
    default:
      fail(`Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main(process.argv.slice(2)).catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
