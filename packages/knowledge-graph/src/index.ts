/**
 * @blacklight/knowledge-graph — the persistent architectural model.
 *
 * Build a graph with {@link KnowledgeGraph}, serialise it to `graph.json` via `toDocument`,
 * and render an `architecture.md` skeleton with {@link renderArchitectureMarkdown}.
 */

export * from "./schema.ts";
export * from "./graph.ts";
export * from "./render.ts";
