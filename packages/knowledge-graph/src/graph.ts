/**
 * {@link KnowledgeGraph} — the in-memory builder and query surface over the graph model.
 *
 * Analysis packages construct a graph by adding nodes and edges; the CLI serialises it to
 * `graph.json` and renders views from it. Adds are idempotent: repeating an add merges rather
 * than duplicates, and an observation always wins over an inference for the same fact.
 */

import type { Investigation, Provenance } from "@blacklight/core";
import {
  edgeId,
  type EdgeType,
  type GraphDocument,
  type GraphEdge,
  type GraphNode,
  type NodeType,
} from "./schema.ts";

/** An observation is stronger evidence than an inference for the same fact. */
function strongerProvenance(a: Provenance, b: Provenance): Provenance {
  if (a.kind === "observation" && b.kind === "inference") return a;
  if (b.kind === "observation" && a.kind === "inference") return b;
  return a;
}

export class KnowledgeGraph {
  private readonly nodes = new Map<string, GraphNode>();
  private readonly edges = new Map<string, GraphEdge>();

  /** Add a node, merging attrs and keeping the stronger provenance if it already exists. */
  addNode(node: GraphNode): this {
    const existing = this.nodes.get(node.id);
    if (existing) {
      existing.attrs = { ...existing.attrs, ...node.attrs };
      existing.label ||= node.label;
      existing.provenance = strongerProvenance(existing.provenance, node.provenance);
    } else {
      this.nodes.set(node.id, { ...node });
    }
    return this;
  }

  /** Add a directed edge, deduped by (from, type, to). */
  addEdge(
    from: string,
    to: string,
    type: EdgeType,
    provenance: Provenance,
    attrs?: Record<string, unknown>,
  ): this {
    const id = edgeId(from, type, to);
    const existing = this.edges.get(id);
    if (existing) {
      existing.attrs = { ...existing.attrs, ...attrs };
      existing.provenance = strongerProvenance(existing.provenance, provenance);
    } else {
      this.edges.set(id, { id, from, to, type, provenance, attrs });
    }
    return this;
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  allNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  allEdges(): GraphEdge[] {
    return [...this.edges.values()];
  }

  nodesOfType(type: NodeType): GraphNode[] {
    return this.allNodes().filter((n) => n.type === type);
  }

  /** Nodes directly connected to `id`. `direction` filters by edge orientation. */
  neighbors(id: string, direction: "out" | "in" | "both" = "both"): GraphNode[] {
    const ids = new Set<string>();
    for (const edge of this.edges.values()) {
      if ((direction === "out" || direction === "both") && edge.from === id) ids.add(edge.to);
      if ((direction === "in" || direction === "both") && edge.to === id) ids.add(edge.from);
    }
    return [...ids].map((n) => this.nodes.get(n)).filter((n): n is GraphNode => n != null);
  }

  /** The subgraph induced by all nodes of a given type (and edges between them). */
  subgraphByType(type: NodeType): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = this.nodesOfType(type);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = this.allEdges().filter((e) => ids.has(e.from) && ids.has(e.to));
    return { nodes, edges };
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  /** Count nodes and edges by epistemic status — used for the provenance summary. */
  provenanceTally(): { observations: number; inferences: number } {
    let observations = 0;
    let inferences = 0;
    for (const item of [...this.nodes.values(), ...this.edges.values()]) {
      if (item.provenance.kind === "observation") observations++;
      else inferences++;
    }
    return { observations, inferences };
  }

  /** Serialise to the on-disk `graph.json` shape. */
  toDocument(investigation: Investigation): GraphDocument {
    return { investigation, nodes: this.allNodes(), edges: this.allEdges() };
  }

  /** Rebuild a graph from a serialised document. */
  static fromDocument(doc: GraphDocument): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const node of doc.nodes) graph.nodes.set(node.id, node);
    for (const edge of doc.edges) graph.edges.set(edge.id, edge);
    return graph;
  }
}
