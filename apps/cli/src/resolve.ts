/**
 * Resolve a user-supplied reference (a path, later a URL) into a concrete {@link Target} by
 * trying each registered adapter in order. The first adapter that claims it wins.
 */

import type { Target, TargetResolver } from "@blacklight/core";
import { localRepoResolver } from "@blacklight/adapter-local-repo";
import { githubResolver } from "@blacklight/adapter-github";

// Ordered most-specific first: the GitHub resolver only claims URLs; local-repo claims any
// existing directory, so it must come last.
const resolvers: TargetResolver[] = [githubResolver, localRepoResolver];

export async function resolveTarget(reference: string): Promise<Target> {
  for (const resolver of resolvers) {
    if (resolver.canResolve(reference)) return resolver.resolve(reference);
  }
  throw new Error(`No adapter could resolve reference: ${reference}`);
}
