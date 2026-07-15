/**
 * Walk a target's directory tree into a flat, analysable {@link WorkspaceScan}: every file
 * with its size and inferred language, plus aggregate stats. Directories that never contain
 * source worth analysing (dependencies, build output, VCS metadata) are skipped.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";

/** Directories we never descend into. */
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  "coverage",
  "vendor",
  "target", // Rust/Java build output
  ".turbo",
  ".cache",
  ".pnpm-store",
  ".venv",
  "__pycache__",
]);

/** File extension → language name, used for stats and node attributes. */
const LANGUAGE_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".json": "JSON",
  ".md": "Markdown",
  ".css": "CSS",
  ".scss": "CSS",
  ".html": "HTML",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".rb": "Ruby",
  ".sh": "Shell",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".toml": "TOML",
};

export interface FileEntry {
  /** Path relative to the scan root, using POSIX separators. */
  relPath: string;
  absPath: string;
  ext: string;
  size: number;
  language: string;
}

export interface WorkspaceScan {
  root: string;
  files: FileEntry[];
  stats: {
    fileCount: number;
    totalBytes: number;
    byLanguage: Record<string, { files: number; bytes: number }>;
  };
}

/** Languages Blacklight's static analysis can parse for imports/concepts in V1. */
export const ANALYSABLE_EXTS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function languageFor(ext: string): string {
  return LANGUAGE_BY_EXT[ext] ?? (ext ? ext.slice(1).toUpperCase() : "other");
}

/** Recursively collect files under `dir`, honouring the ignore list. */
function collect(root: string, dir: string, out: FileEntry[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable directory — skip rather than crash the whole scan
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      collect(root, abs, out);
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = statSync(abs).size;
      } catch {
        continue;
      }
      const ext = extname(entry.name).toLowerCase();
      out.push({
        relPath: toPosix(relative(root, abs)),
        absPath: abs,
        ext,
        size,
        language: languageFor(ext),
      });
    }
  }
}

/** Scan a workspace rooted at `root` into a {@link WorkspaceScan}. */
export function walkWorkspace(root: string): WorkspaceScan {
  const files: FileEntry[] = [];
  collect(root, root, files);
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const byLanguage: Record<string, { files: number; bytes: number }> = {};
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += f.size;
    const bucket = (byLanguage[f.language] ??= { files: 0, bytes: 0 });
    bucket.files++;
    bucket.bytes += f.size;
  }

  return {
    root,
    files,
    stats: { fileCount: files.length, totalBytes, byLanguage },
  };
}
