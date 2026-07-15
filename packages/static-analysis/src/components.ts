/**
 * Group files into components. Components are an *inference*: we don't observe them, we derive
 * them from structure. Two heuristics, in priority order:
 *
 *  1. **Package boundaries** — if the target has multiple `package.json` manifests (a
 *     monorepo), each manifest's directory is a component, and every file belongs to the
 *     deepest package containing it.
 *  2. **Top-level directories** — otherwise, group by the first path segment (after an
 *     optional leading `src/`), with top-level files landing in a `(root)` component.
 *
 * Component-to-component dependencies are derived from the file-level import edges.
 */

import { slugify } from "@blacklight/core";
import type { FileEntry } from "./walk.ts";
import type { ImportEdge } from "./imports.ts";

export interface ComponentInfo {
  id: string;
  name: string;
  /** Anchoring directory, relative to root ("" for the root component). */
  path: string;
  files: string[];
  /** How this grouping was decided — recorded on the node as an inference note. */
  boundary: string;
}

export interface ComponentAnalysis {
  components: ComponentInfo[];
  fileToComponent: Map<string, string>;
  dependencies: { from: string; to: string }[];
}

function posixDirname(relPath: string): string {
  const i = relPath.lastIndexOf("/");
  return i === -1 ? "" : relPath.slice(0, i);
}

/** Directories containing a package.json, "" meaning the root. */
function packageBoundaries(files: FileEntry[]): string[] {
  return files
    .filter((f) => f.relPath === "package.json" || f.relPath.endsWith("/package.json"))
    .map((f) => posixDirname(f.relPath));
}

function labelFor(boundary: string): { id: string; name: string } {
  if (boundary === "") return { id: "root", name: "(root)" };
  return { id: slugify(boundary), name: boundary };
}

/** Deepest boundary that contains `dir`. Assumes boundaries includes "" (root). */
function deepestBoundary(dir: string, boundaries: string[]): string {
  let best = "";
  for (const b of boundaries) {
    if (b === "") continue;
    if (dir === b || dir.startsWith(b + "/")) {
      if (b.length > best.length) best = b;
    }
  }
  return best;
}

function segmentKey(relPath: string): string {
  const segs = relPath.split("/");
  if (segs[0] === "src") segs.shift();
  return segs.length <= 1 ? "" : segs[0]!;
}

export function deriveComponents(files: FileEntry[], importEdges: ImportEdge[]): ComponentAnalysis {
  const boundaries = packageBoundaries(files);
  const usePackages = boundaries.filter((b) => b !== "").length >= 2;

  const components = new Map<string, ComponentInfo>();
  const fileToComponent = new Map<string, string>();

  const ensure = (id: string, name: string, path: string, boundary: string): ComponentInfo => {
    let c = components.get(id);
    if (!c) {
      c = { id, name, path, files: [], boundary };
      components.set(id, c);
    }
    return c;
  };

  for (const file of files) {
    let id: string;
    let name: string;
    let path: string;
    let boundary: string;

    if (usePackages) {
      const b = deepestBoundary(posixDirname(file.relPath), boundaries);
      ({ id, name } = labelFor(b));
      path = b;
      boundary = b === "" ? "root package" : `package boundary: ${b}`;
    } else {
      const key = segmentKey(file.relPath);
      ({ id, name } = labelFor(key === "" ? "" : key));
      path = key;
      boundary = key === "" ? "top-level files" : `top-level directory: ${key}`;
    }

    ensure(id, name, path, boundary).files.push(file.relPath);
    fileToComponent.set(file.relPath, id);
  }

  // Lift file-level imports to component-level dependencies.
  const depSet = new Set<string>();
  const dependencies: { from: string; to: string }[] = [];
  for (const edge of importEdges) {
    const from = fileToComponent.get(edge.from);
    const to = fileToComponent.get(edge.to);
    if (!from || !to || from === to) continue;
    const key = `${from}->${to}`;
    if (!depSet.has(key)) {
      depSet.add(key);
      dependencies.push({ from, to });
    }
  }

  return { components: [...components.values()], fileToComponent, dependencies };
}
