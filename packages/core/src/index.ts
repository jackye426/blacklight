/**
 * @blacklight/core — the shared investigation model.
 *
 * Everything Blacklight knows about a target is expressed with these types, and every fact
 * carries {@link Provenance} declaring whether it was observed or inferred. Analysis packages
 * populate the model; the CLI and (future) web UI read it back through the same contracts.
 */

export * from "./provenance.ts";
export * from "./target.ts";
export * from "./model.ts";
export * from "./findings.ts";
export * from "./investigation.ts";
export * from "./artifacts.ts";
export * from "./workspace.ts";
export * from "./util.ts";
