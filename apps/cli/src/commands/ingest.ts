/**
 * `atlas ingest <path>` — run static analysis on a target and write the observation artifacts:
 * `graph.json`, `concepts.json`, and `unknowns.md`.
 */

import { InvestigationWorkspace, type Target } from "@blacklight/core";
import { ingestTarget, renderUnknownsMarkdown, type IngestResult } from "@blacklight/static-analysis";
import { parseArgs, stringFlag } from "../args.ts";
import { investigationsDir } from "../paths.ts";
import { resolveTarget } from "../resolve.ts";
import { dim, fail, heading, ok, step } from "../ui.ts";

/**
 * Analyse a resolved target and write its observation artifacts into `ws`. Shared by the
 * `ingest` command and by `map`'s auto-ingest fallback.
 */
export async function ingestToWorkspace(
  target: Target,
  ws: InvestigationWorkspace,
): Promise<IngestResult> {
  const result = ingestTarget(target);
  await ws.ensure();
  await ws.writeJson("graph", result.graph.toDocument(result.investigation));
  await ws.writeJson("concepts", {
    investigation: result.investigation,
    concepts: result.concepts,
  });
  await ws.writeText("unknowns", renderUnknownsMarkdown(result.unknowns, result.investigation));
  return result;
}

export async function runIngest(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv);
  const reference = positionals[0];
  if (!reference) {
    fail("Usage: atlas ingest <path|github-url> [--out <dir>]");
    process.exitCode = 1;
    return;
  }

  heading(`Ingesting ${reference}`);
  step("Resolving target…");
  const target = await resolveTarget(reference);
  ok(`Target: ${target.name} (${target.kind})`);
  console.log(dim(`  ${target.rootPath}`));

  step("Running static analysis…");
  const ws = InvestigationWorkspace.forTarget(investigationsDir(stringFlag(flags, "out")), target.id);
  const result = await ingestToWorkspace(target, ws);

  ok(`Files scanned: ${result.scan.stats.fileCount}`);
  ok(`Entry points: ${result.entrypoints.length}`);
  ok(`Graph: ${result.graph.nodeCount} nodes, ${result.graph.edgeCount} edges`);
  ok(`Concepts: ${result.concepts.length}`);
  ok(`Unknowns: ${result.unknowns.length}`);
  console.log(dim(`Written to ${ws.root}`));
}
