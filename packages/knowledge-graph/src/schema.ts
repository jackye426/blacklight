/**
 * The `graph.json` schema — Blacklight's persistent architectural model.
 *
 * A graph is a set of nodes and directed edges. Every node and edge carries {@link Provenance},
 * so the observation/inference distinction is part of the data, not a convention layered on top.
 */

import type { Investigation, Provenance, RelationshipKind } from "@blacklight/core";

/** The kinds of things a node can represent. */
export type NodeType = "file" | "component" | "concept" | "flow";

/** Edges reuse the core relationship vocabulary so there is one shared language. */
export type EdgeType = RelationshipKind;

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  /** Free-form attributes: path, size, language, concept kind, etc. */
  attrs?: Record<string, unknown>;
  provenance: Provenance;
}

export interface GraphEdge {
  /** Deterministic id: `${from}--${type}-->${to}`. Makes dedupe trivial. */
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  attrs?: Record<string, unknown>;
  provenance: Provenance;
}

/** The serialised form written to `graph.json`. */
export interface GraphDocument {
  investigation: Investigation;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Deterministic edge id, so the same relationship never appears twice. */
export function edgeId(from: string, type: EdgeType, to: string): string {
  return `${from}--${type}-->${to}`;
}
