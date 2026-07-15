/**
 * `atlas trace -- <command>` — run a command under Blacklight, capturing its execution into
 * `runtime-trace.jsonl` and rendering `execution-flow.md`.
 */

import { BLACKLIGHT_VERSION, InvestigationWorkspace, slugify } from "@blacklight/core";
import { renderExecutionFlowMarkdown, traceProcess } from "@blacklight/runtime-tracing";
import { parseArgs, stringFlag } from "../args.ts";
import { investigationsDir } from "../paths.ts";
import { dim, fail, heading, ok, step } from "../ui.ts";

export async function runTrace(argv: string[]): Promise<void> {
  const { flags, passthrough } = parseArgs(argv);
  if (passthrough.length === 0) {
    fail("Usage: atlas trace [--target <name>] [--out <dir>] -- <command> [args…]");
    process.exitCode = 1;
    return;
  }

  const [command, ...args] = passthrough;
  const targetName = stringFlag(flags, "target") ?? command!;
  const ws = InvestigationWorkspace.forTarget(investigationsDir(stringFlag(flags, "out")), slugify(targetName));
  await ws.ensure();

  heading(`Tracing: ${passthrough.join(" ")}`);
  step("Running under trace…");

  const result = await traceProcess(command!, args, { cwd: process.cwd() });

  // Write the raw event stream (one JSON object per line) and the rendered flow.
  await ws.writeText("runtimeTrace", result.events.map((e) => JSON.stringify(e)).join("\n") + "\n");
  await ws.writeText(
    "executionFlow",
    renderExecutionFlowMarkdown(result.events, {
      title: targetName,
      subtitle: `Traced \`${passthrough.join(" ")}\`.`,
      generatedAt: new Date().toISOString(),
      blacklightVersion: BLACKLIGHT_VERSION,
    }),
  );

  console.log("");
  ok(`Exit code: ${result.exitCode ?? "null"}${result.signal ? ` (signal ${result.signal})` : ""}`);
  ok(`Duration: ${result.durationMs}ms`);
  ok(`Events captured: ${result.events.length}`);
  console.log(dim(`Written to ${ws.root}`));
}
