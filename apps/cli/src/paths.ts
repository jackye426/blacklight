/**
 * Locate where investigations are written. Blacklight is the tool, so investigations live in
 * the Blacklight repo's `investigations/` directory regardless of the current working
 * directory — anchored to the repo root (the nearest ancestor with a pnpm workspace file).
 */

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";

export function findRepoRoot(startDir = dirname(fileURLToPath(import.meta.url))): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd(); // no workspace root found — fall back to cwd
    dir = parent;
  }
}

/** The `investigations/` directory, or an explicit override. */
export function investigationsDir(override?: string): string {
  return override ? resolve(override) : join(findRepoRoot(), "investigations");
}

/** The `findings/` directory — where conclusions (including comparison reports) live. */
export function findingsDir(): string {
  return join(findRepoRoot(), "findings");
}
