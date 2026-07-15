/**
 * The fixed set of artifacts every investigation can produce. Naming them in one place keeps
 * the CLI, the packages, and the (future) web UI in agreement about what a well-formed
 * investigation directory contains.
 */

import type { Concept } from "./model.ts";
import type { Investigation } from "./investigation.ts";

/** Canonical artifact filenames, keyed by a stable logical name. */
export const ARTIFACTS = {
  architecture: "architecture.md",
  executionFlow: "execution-flow.md",
  concepts: "concepts.json",
  graph: "graph.json",
  runtimeTrace: "runtime-trace.jsonl",
  unknowns: "unknowns.md",
  reusablePatterns: "reusable-patterns.md",
} as const;

export type ArtifactName = keyof typeof ARTIFACTS;
export type ArtifactFile = (typeof ARTIFACTS)[ArtifactName];

/** The shape of `concepts.json`. */
export interface ConceptsFile {
  investigation: Investigation;
  concepts: Concept[];
}

/** One recorded unknown — something we could not determine and refuse to guess. */
export interface Unknown {
  question: string;
  /** Why it is open: what we tried, what blocked us. */
  context?: string;
}
