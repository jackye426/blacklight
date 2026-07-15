/**
 * @blacklight/adapter-github — resolve a target by shallow-cloning a GitHub repo into the
 * git-ignored `vendor/` cache, then treating it as a local repo.
 *
 * Per RESEARCH-POLICY.md, third-party source lives only in `vendor/` and is never committed.
 * This adapter fetches into that cache and hands the on-disk path to the local-repo resolver's
 * model, tagging the result with its GitHub origin.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify, type Target, type TargetResolver } from "@blacklight/core";

const GITHUB_PATTERNS: RegExp[] = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i,
  /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  /^github:([^/]+)\/([^/]+?)(?:\.git)?$/i,
];

function parseRepo(reference: string): { owner: string; repo: string } | undefined {
  for (const pattern of GITHUB_PATTERNS) {
    const m = reference.match(pattern);
    if (m) return { owner: m[1]!, repo: m[2]! };
  }
  return undefined;
}

/** Walk up from this file to the Blacklight repo root (holds the vendor/ cache). */
function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

export class GithubResolver implements TargetResolver {
  canResolve(reference: string): boolean {
    return parseRepo(reference) !== undefined;
  }

  async resolve(reference: string): Promise<Target> {
    const parsed = parseRepo(reference);
    if (!parsed) throw new Error(`Not a GitHub reference: ${reference}`);
    const { owner, repo } = parsed;

    const cacheDir = join(repoRoot(), "vendor", "github", `${owner}__${repo}`);
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;

    if (!existsSync(cacheDir)) {
      // Shallow clone: we analyse the tree, we don't need history.
      execFileSync("git", ["clone", "--depth", "1", cloneUrl, cacheDir], { stdio: "inherit" });
    }

    return {
      id: slugify(`${owner}-${repo}`),
      name: `${owner}/${repo}`,
      kind: "github",
      rootPath: cacheDir,
      origin: cloneUrl,
      resolvedAt: new Date().toISOString(),
    };
  }
}

export const githubResolver = new GithubResolver();
