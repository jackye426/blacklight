/**
 * @blacklight/adapter-local-repo — resolve a target from any local directory.
 *
 * This is the simplest resolver and the one every other adapter ultimately delegates to: once
 * source is on disk, it is "a local repo". It accepts any existing directory path.
 */

import { basename, resolve } from "node:path";
import { statSync } from "node:fs";
import { slugify, type Target, type TargetResolver } from "@blacklight/core";

export class LocalRepoResolver implements TargetResolver {
  canResolve(reference: string): boolean {
    try {
      return statSync(resolve(reference)).isDirectory();
    } catch {
      return false;
    }
  }

  async resolve(reference: string): Promise<Target> {
    const rootPath = resolve(reference);
    if (!statSync(rootPath).isDirectory()) {
      throw new Error(`Not a directory: ${rootPath}`);
    }
    const name = basename(rootPath);
    return {
      id: slugify(name),
      name,
      kind: "local-repo",
      rootPath,
      resolvedAt: new Date().toISOString(),
    };
  }
}

export const localRepoResolver = new LocalRepoResolver();
