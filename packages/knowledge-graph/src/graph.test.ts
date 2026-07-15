import { describe, expect, it } from "vitest";
import { inferredFrom, observedInFile } from "@blacklight/core";
import { KnowledgeGraph } from "./graph.ts";

describe("KnowledgeGraph", () => {
  it("dedupes nodes by id and merges attrs", () => {
    const g = new KnowledgeGraph();
    g.addNode({ id: "a", type: "file", label: "a.ts", attrs: { size: 10 }, provenance: observedInFile("a.ts") });
    g.addNode({ id: "a", type: "file", label: "a.ts", attrs: { lang: "ts" }, provenance: observedInFile("a.ts") });
    expect(g.nodeCount).toBe(1);
    expect(g.getNode("a")?.attrs).toEqual({ size: 10, lang: "ts" });
  });

  it("dedupes edges by (from, type, to)", () => {
    const g = new KnowledgeGraph();
    g.addEdge("a", "b", "imports", observedInFile("a.ts"));
    g.addEdge("a", "b", "imports", observedInFile("a.ts"));
    expect(g.edgeCount).toBe(1);
  });

  it("lets an observation override an inference for the same node", () => {
    const g = new KnowledgeGraph();
    g.addNode({ id: "c", type: "concept", label: "Loop", provenance: inferredFrom(["x"]) });
    g.addNode({ id: "c", type: "concept", label: "Loop", provenance: observedInFile("loop.ts", { startLine: 1 }) });
    expect(g.getNode("c")?.provenance.kind).toBe("observation");
  });

  it("finds neighbors by direction", () => {
    const g = new KnowledgeGraph();
    for (const id of ["a", "b", "c"]) g.addNode({ id, type: "file", label: id, provenance: observedInFile(id) });
    g.addEdge("a", "b", "imports", observedInFile("a"));
    g.addEdge("c", "a", "imports", observedInFile("c"));
    expect(g.neighbors("a", "out").map((n) => n.id)).toEqual(["b"]);
    expect(g.neighbors("a", "in").map((n) => n.id)).toEqual(["c"]);
    expect(g.neighbors("a", "both").map((n) => n.id).sort()).toEqual(["b", "c"]);
  });

  it("round-trips through a document", () => {
    const g = new KnowledgeGraph();
    g.addNode({ id: "a", type: "component", label: "core", provenance: observedInFile("core") });
    const doc = g.toDocument({
      target: { id: "t", name: "T", kind: "local-repo", rootPath: "/x", resolvedAt: "now" },
      createdAt: "now",
      blacklightVersion: "0.1.0",
    });
    const restored = KnowledgeGraph.fromDocument(doc);
    expect(restored.nodeCount).toBe(1);
    expect(restored.getNode("a")?.label).toBe("core");
  });
});
