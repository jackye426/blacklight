/**
 * @blacklight/experiment-runner — controlled comparative experiments.
 *
 * Load an `investigation.yaml` ({@link loadInvestigationSpec}), scaffold a metrics template for
 * every (task × subject) run ({@link scaffoldRuns}), then generate a comparison report from the
 * recorded results ({@link generateComparisonReport}). The runner scaffolds and aggregates; a
 * human records what each subject actually did.
 */

export * from "./schema.ts";
export * from "./metrics.ts";
export * from "./load.ts";
export * from "./scaffold.ts";
export * from "./report.ts";
