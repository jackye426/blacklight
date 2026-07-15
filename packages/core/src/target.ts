/** A target is whatever Blacklight is investigating: a repo, an app, or a workspace. */

export type TargetKind = "local-repo" | "github" | "installed-app" | "workspace";

export interface Target {
  /** Stable slug used as the investigation directory name. */
  id: string;
  /** Human-readable name. */
  name: string;
  kind: TargetKind;
  /** Absolute path to the resolved source on disk (may be under vendor/). */
  rootPath: string;
  /** Where it came from, e.g. a GitHub URL. Absent for plain local targets. */
  origin?: string;
  /** ISO timestamp of when the source was resolved. */
  resolvedAt: string;
}

/**
 * An adapter resolves some reference (a path, a URL, an install location) into a concrete
 * {@link Target} whose `rootPath` is a real directory on disk that the analysis packages can
 * read. Every source integration implements this one small contract.
 */
export interface TargetResolver {
  /** True if this adapter can handle the given reference. */
  canResolve(reference: string): boolean;
  /** Resolve the reference to a concrete, on-disk target. */
  resolve(reference: string): Promise<Target>;
}
