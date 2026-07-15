/**
 * The static-analysis orchestrator. Given a resolved {@link Target}, it walks the tree, builds
 * a ts-morph project once, and assembles a {@link KnowledgeGraph} plus concepts and unknowns.
 *
 * Provenance is applied honestly:
 *   - file nodes, import edges, and concepts are **observations** (we read them directly);
 *   - components and their contains/depends-on edges are **inferences** (grouping heuristics).
 */

import {
  BLACKLIGHT_VERSION,
  inferredFrom,
  observedInFile,
  type Concept,
  type Investigation,
  type Target,
  type Unknown,
} from "@blacklight/core";
import { KnowledgeGraph } from "@blacklight/knowledge-graph";
import { walkWorkspace, ANALYSABLE_EXTS, type WorkspaceScan } from "./walk.ts";
import { detectEntryPoints, type EntryPoint } from "./entrypoints.ts";
import { loadProject } from "./project.ts";
import { analyzeImports } from "./imports.ts";
import { deriveComponents } from "./components.ts";
import { extractConcepts } from "./concepts.ts";
import { readFileSync } from "node:fs";

export interface IngestResult {
  investigation: Investigation;
  graph: KnowledgeGraph;
  concepts: Concept[];
  unknowns: Unknown[];
  scan: WorkspaceScan;
  entrypoints: EntryPoint[];
}

const fileId = (relPath: string): string => `file:${relPath}`;
const componentId = (id: string): string => `component:${id}`;

function readManifest(absPath: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(absPath, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** Run the full static analysis for a target. */
export function ingestTarget(target: Target): IngestResult {
  const root = target.rootPath;
  const scan = walkWorkspace(root);
  const entrypoints = detectEntryPoints(root, scan.files, readManifest);
  const entryPaths = new Set(entrypoints.map((e) => e.relPath));

  const { project, parseFailures } = loadProject(scan.files);
  const imports = analyzeImports(root, project);
  const components = deriveComponents(scan.files, imports.edges);
  const concepts = extractConcepts(root, project);

  const investigation: Investigation = {
    target,
    createdAt: new Date().toISOString(),
    blacklightVersion: BLACKLIGHT_VERSION,
  };

  const graph = new KnowledgeGraph();

  // File nodes (observations) — one per analysable file.
  for (const file of scan.files) {
    if (!ANALYSABLE_EXTS.has(file.ext)) continue;
    graph.addNode({
      id: fileId(file.relPath),
      type: "file",
      label: file.relPath,
      attrs: {
        language: file.language,
        size: file.size,
        ...(entryPaths.has(file.relPath) ? { isEntryPoint: true } : {}),
      },
      provenance: observedInFile(file.relPath),
    });
  }

  // Import edges (observations).
  for (const edge of imports.edges) {
    if (!graph.hasNode(fileId(edge.from)) || !graph.hasNode(fileId(edge.to))) continue;
    graph.addEdge(fileId(edge.from), fileId(edge.to), "imports", observedInFile(edge.from));
  }

  // Component nodes and their contains edges (inferences — grouping heuristic).
  for (const c of components.components) {
    graph.addNode({
      id: componentId(c.id),
      type: "component",
      label: c.name,
      attrs: { path: c.path, files: c.files, fileCount: c.files.length },
      provenance: inferredFrom(c.files.slice(0, 50).map(fileId), c.boundary),
    });
    for (const relPath of c.files) {
      if (!graph.hasNode(fileId(relPath))) continue;
      graph.addEdge(componentId(c.id), fileId(relPath), "contains", inferredFrom([fileId(relPath)], c.boundary));
    }
  }

  // Component-to-component dependencies (inferences).
  for (const dep of components.dependencies) {
    graph.addEdge(
      componentId(dep.from),
      componentId(dep.to),
      "depends-on",
      inferredFrom([componentId(dep.from), componentId(dep.to)], "lifted from file imports"),
    );
  }

  // Concept nodes (observations) and the file that defines them.
  for (const concept of concepts) {
    const cid = `concept:${concept.id}`;
    graph.addNode({
      id: cid,
      type: "concept",
      label: concept.name,
      attrs: { kind: concept.kind, definedIn: concept.definedIn, summary: concept.summary },
      provenance: concept.provenance,
    });
    if (concept.definedIn && graph.hasNode(fileId(concept.definedIn))) {
      graph.addEdge(fileId(concept.definedIn), cid, "contains", observedInFile(concept.definedIn));
    }
  }

  // Unknowns — recorded, never guessed.
  const unknowns: Unknown[] = [];
  const seenUnknown = new Set<string>();
  for (const u of imports.unresolved) {
    const key = `${u.file}|${u.specifier}`;
    if (seenUnknown.has(key)) continue;
    seenUnknown.add(key);
    unknowns.push({
      question: `Unresolved relative import '${u.specifier}' in \`${u.file}\`.`,
      context: "The specifier looks internal but did not resolve to a file in the target.",
    });
  }
  for (const file of parseFailures) {
    unknowns.push({ question: `Could not parse \`${file}\`.`, context: "ts-morph failed to load the file." });
  }

  return { investigation, graph, concepts, unknowns, scan, entrypoints };
}
