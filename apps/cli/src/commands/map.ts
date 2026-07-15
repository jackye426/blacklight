/**
 * `atlas map <path>` — render `architecture.md` from an ingested graph. If the target has not
 * been ingested yet, ingest it first so `map` works as a one-shot command.
 */

import { InvestigationWorkspace } from "@blacklight/core";
import { KnowledgeGraph, renderArchitectureMarkdown, type GraphDocument } from "@blacklight/knowledge-graph";
import { parseArgs, stringFlag } from "../args.ts";
import { investigationsDir } from "../paths.ts";
import { resolveTarget } from "../resolve.ts";
import { ingestToWorkspace } from "./ingest.ts";
import { dim, fail, heading, ok, step } from "../ui.ts";

export async function runMap(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv);
  const reference = positionals[0];
  if (!reference) {
    fail("Usage: atlas map <path|github-url> [--out <dir>]");
    process.exitCode = 1;
    return;
  }

  heading(`Mapping ${reference}`);
  step("Resolving target…");
  const target = await resolveTarget(reference);
  ok(`Target: ${target.name} (${target.kind})`);

  const ws = InvestigationWorkspace.forTarget(investigationsDir(stringFlag(flags, "out")), target.id);

  let doc: GraphDocument;
  if (ws.has("graph")) {
    doc = await ws.readJson<GraphDocument>("graph");
    ok("Loaded existing graph.json");
  } else {
    step("No graph yet — ingesting first…");
    const result = await ingestToWorkspace(target, ws);
    doc = result.graph.toDocument(result.investigation);
  }

  const graph = KnowledgeGraph.fromDocument(doc);
  await ws.writeText("architecture", renderArchitectureMarkdown(graph, doc.investigation));

  ok(`architecture.md rendered (${graph.nodesOfType("component").length} components)`);
  console.log(dim(`Written to ${ws.pathTo("architecture")}`));
}
