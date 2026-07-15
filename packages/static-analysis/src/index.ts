/**
 * @blacklight/static-analysis — turn a target into observed structure.
 *
 * The entry point is {@link ingestTarget}, which walks the tree, resolves TS/JS imports via
 * ts-morph, groups files into components, and extracts concepts — assembling a knowledge graph
 * plus a concepts list and a record of unknowns.
 */

export * from "./walk.ts";
export * from "./entrypoints.ts";
export * from "./project.ts";
export * from "./imports.ts";
export * from "./components.ts";
export * from "./concepts.ts";
export * from "./analyze.ts";
export * from "./render.ts";
