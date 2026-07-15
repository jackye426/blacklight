/**
 * Detect a target's entry points — the files execution actually starts from. We read every
 * `package.json` in the tree (a monorepo has many) and extract `bin`, `main`, `module`, and
 * `exports` targets, falling back to conventional entry files when a manifest is silent.
 */

import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { FileEntry } from "./walk.ts";

export interface EntryPoint {
  /** Path relative to the scan root, POSIX-separated. */
  relPath: string;
  /** Why we consider it an entry point, e.g. "bin:atlas" or "main". */
  reason: string;
  /** The package.json that declared it, relative to the scan root. */
  declaredIn?: string;
}

const CONVENTIONAL = ["src/index.ts", "src/main.ts", "src/index.js", "index.ts", "index.js"];

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

/** Collect string leaves from a package.json `exports`/`bin` value, which may be nested. */
function collectStringLeaves(value: unknown, out: string[]): void {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStringLeaves(v, out);
  }
}

function resolveManifestEntries(root: string, manifestRel: string, pkg: Record<string, unknown>): EntryPoint[] {
  const dir = manifestRel.replace(/package\.json$/, "").replace(/\/$/, "");
  const rel = (target: string): string => toPosix(join(dir, target.replace(/^\.\//, "")));
  const found: EntryPoint[] = [];

  const add = (target: unknown, reason: string): void => {
    if (typeof target !== "string") return;
    const relPath = rel(target);
    if (existsSync(join(root, relPath))) {
      found.push({ relPath, reason, declaredIn: manifestRel });
    }
  };

  if (pkg["bin"] && typeof pkg["bin"] === "object") {
    for (const [name, target] of Object.entries(pkg["bin"] as Record<string, unknown>)) {
      add(target, `bin:${name}`);
    }
  } else if (typeof pkg["bin"] === "string") {
    add(pkg["bin"], "bin");
  }
  add(pkg["main"], "main");
  add(pkg["module"], "module");

  const exportLeaves: string[] = [];
  collectStringLeaves(pkg["exports"], exportLeaves);
  for (const leaf of exportLeaves) add(leaf, "exports");

  return found;
}

/**
 * Detect entry points across the scanned files. `readManifest` is injected so this stays
 * testable and side-effect-light; the CLI passes a JSON reader.
 */
export function detectEntryPoints(
  root: string,
  files: FileEntry[],
  readManifest: (absPath: string) => Record<string, unknown> | undefined,
): EntryPoint[] {
  const manifests = files.filter((f) => f.relPath === "package.json" || f.relPath.endsWith("/package.json"));
  const entries: EntryPoint[] = [];
  const seen = new Set<string>();

  for (const manifest of manifests) {
    const pkg = readManifest(manifest.absPath);
    if (!pkg) continue;
    for (const ep of resolveManifestEntries(root, manifest.relPath, pkg)) {
      const key = ep.relPath + "|" + ep.reason;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push(ep);
      }
    }
  }

  // If nothing was declared anywhere, fall back to conventional entry files at the root.
  if (entries.length === 0) {
    for (const candidate of CONVENTIONAL) {
      if (existsSync(join(root, candidate))) {
        entries.push({ relPath: candidate, reason: "conventional" });
        break;
      }
    }
  }

  return entries;
}
