/**
 * The architectural vocabulary. These are the things Blacklight discovers in a target and
 * that populate the knowledge graph. Each carries {@link Provenance} so its epistemic status
 * travels with it.
 */

import type { Provenance } from "./provenance.ts";

/** A cohesive unit of the system — a package, a directory, a module cluster. */
export interface Component {
  id: string;
  name: string;
  /** The directory or file that anchors the component, relative to the target root. */
  path: string;
  /** Files belonging to the component, relative to the target root. */
  files: string[];
  summary?: string;
  provenance: Provenance;
}

export type RelationshipKind =
  | "imports"
  | "contains"
  | "calls"
  | "implements"
  | "depends-on"
  | "relates-to";

/** A directed relationship between two nodes, identified by their ids. */
export interface Relationship {
  from: string;
  to: string;
  kind: RelationshipKind;
  provenance: Provenance;
}

export type ConceptKind =
  | "type"
  | "interface"
  | "class"
  | "function"
  | "module"
  | "idea";

/** A core abstraction the system is built around. */
export interface Concept {
  id: string;
  name: string;
  kind: ConceptKind;
  /** Where it is defined, relative to the target root. */
  definedIn?: string;
  summary?: string;
  provenance: Provenance;
}
