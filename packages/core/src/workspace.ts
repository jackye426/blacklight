/**
 * An {@link InvestigationWorkspace} is the on-disk home of one investigation:
 * `investigations/<target-id>/`. It centralises the directory layout so every package reads
 * and writes artifacts through the same paths.
 */

import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { ARTIFACTS, type ArtifactName } from "./artifacts.ts";
import { appendJsonl, readJson, writeJson, writeText } from "./util.ts";

export class InvestigationWorkspace {
  /** Absolute path to `investigations/<target-id>/`. */
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  /** Build a workspace for a target id under a given `investigations/` directory. */
  static forTarget(investigationsDir: string, targetId: string): InvestigationWorkspace {
    return new InvestigationWorkspace(join(investigationsDir, targetId));
  }

  /** Create the workspace directory (and its `runs/` subdirectory). */
  async ensure(): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await mkdir(this.runsDir, { recursive: true });
  }

  /** Absolute path to a named artifact within this workspace. */
  pathTo(artifact: ArtifactName): string {
    return join(this.root, ARTIFACTS[artifact]);
  }

  /** Directory for captured per-run output (git-ignored). */
  get runsDir(): string {
    return join(this.root, "runs");
  }

  /** True if the named artifact already exists. */
  has(artifact: ArtifactName): boolean {
    return existsSync(this.pathTo(artifact));
  }

  writeJson(artifact: ArtifactName, data: unknown): Promise<void> {
    return writeJson(this.pathTo(artifact), data);
  }

  readJson<T>(artifact: ArtifactName): Promise<T> {
    return readJson<T>(this.pathTo(artifact));
  }

  writeText(artifact: ArtifactName, text: string): Promise<void> {
    return writeText(this.pathTo(artifact), text);
  }

  appendTrace(obj: unknown): Promise<void> {
    return appendJsonl(this.pathTo("runtimeTrace"), obj);
  }
}
