/**
 * Extract the target's core abstractions: exported interfaces, type aliases, classes, and
 * enums. These are the type-level shapes the system is built around. Each concept is an
 * observation — we point at the exact file and line where it is defined.
 *
 * Implementation-level exports (functions, constants) are intentionally excluded: `concepts`
 * is meant to capture the vocabulary of a system, not its every symbol.
 */

import { relative, sep } from "node:path";
import type { JSDoc, Project, SourceFile } from "ts-morph";
import { observedInFile, slugify, type Concept, type ConceptKind } from "@blacklight/core";

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function firstDocLine(docs: JSDoc[]): string | undefined {
  const text = docs.at(0)?.getDescription().trim();
  if (!text) return undefined;
  const line = text.split("\n")[0]!.trim();
  return line.length > 200 ? line.slice(0, 197) + "…" : line;
}

/** A named, exported declaration with JSDoc — the shared surface of the node kinds we read. */
interface NamedExport {
  getName(): string | undefined;
  isExported(): boolean;
  getStartLineNumber(): number;
  getJsDocs(): JSDoc[];
}

function collect(
  root: string,
  sf: SourceFile,
  nodes: NamedExport[],
  kind: ConceptKind,
  out: Concept[],
): void {
  const relPath = toPosix(relative(root, sf.getFilePath()));
  for (const node of nodes) {
    const name = node.getName();
    if (!name || !node.isExported()) continue;
    const line = node.getStartLineNumber();
    out.push({
      id: slugify(`${relPath}-${name}`),
      name,
      kind,
      definedIn: relPath,
      summary: firstDocLine(node.getJsDocs()),
      provenance: observedInFile(relPath, { startLine: line }),
    });
  }
}

/** Extract concepts from every source file in a loaded project. */
export function extractConcepts(root: string, project: Project): Concept[] {
  const concepts: Concept[] = [];
  for (const sf of project.getSourceFiles()) {
    // ts-morph node kinds share the NamedExport shape; the cast keeps the call sites tidy.
    collect(root, sf, sf.getInterfaces() as unknown as NamedExport[], "interface", concepts);
    collect(root, sf, sf.getTypeAliases() as unknown as NamedExport[], "type", concepts);
    collect(root, sf, sf.getClasses() as unknown as NamedExport[], "class", concepts);
    collect(root, sf, sf.getEnums() as unknown as NamedExport[], "type", concepts);
  }
  return concepts;
}
