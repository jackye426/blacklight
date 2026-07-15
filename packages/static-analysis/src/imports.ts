/**
 * Build the import/dependency graph for a TS/JS target using ts-morph.
 *
 * For every analysable file we read its static `import` and `export ... from` declarations and
 * resolve each specifier. Resolutions that land on a file inside the target are recorded as
 * internal edges (observations). Bare specifiers become external dependencies. A relative
 * specifier that fails to resolve is neither — it is a genuine unknown, recorded as such.
 */

import { relative, sep } from "node:path";
import type { Project } from "ts-morph";

export interface ImportEdge {
  from: string;
  to: string;
}

export interface ImportAnalysis {
  /** Internal file → file import edges (relative paths). */
  edges: ImportEdge[];
  /** Per-file set of external (bare) module specifiers. */
  externalDeps: Map<string, Set<string>>;
  /** Relative imports that should have resolved but didn't. */
  unresolved: { file: string; specifier: string }[];
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function isRelative(specifier: string): boolean {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

/** Extract internal import edges and external dependencies from a loaded project. */
export function analyzeImports(root: string, project: Project): ImportAnalysis {
  const edges: ImportEdge[] = [];
  const externalDeps = new Map<string, Set<string>>();
  const unresolved: { file: string; specifier: string }[] = [];

  const inRoot = (abs: string): boolean => {
    const rel = relative(root, abs);
    return !rel.startsWith("..") && !rel.includes("node_modules");
  };

  for (const sf of project.getSourceFiles()) {
    const fromRel = toPosix(relative(root, sf.getFilePath()));
    const decls = [...sf.getImportDeclarations(), ...sf.getExportDeclarations()];
    for (const decl of decls) {
      const specifier = decl.getModuleSpecifierValue();
      if (!specifier) continue; // e.g. a plain `export { x }` with no `from`

      const targetSf = decl.getModuleSpecifierSourceFile();
      if (targetSf && inRoot(targetSf.getFilePath())) {
        edges.push({ from: fromRel, to: toPosix(relative(root, targetSf.getFilePath())) });
      } else if (isRelative(specifier)) {
        unresolved.push({ file: fromRel, specifier });
      } else {
        // Bare specifier → external dependency (package name, not the deep path).
        const pkg = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0]!;
        (externalDeps.get(fromRel) ?? externalDeps.set(fromRel, new Set()).get(fromRel)!).add(pkg);
      }
    }
  }

  return { edges, externalDeps, unresolved };
}
