/**
 * A finding is a conclusion — always an inference. Findings live in `findings/`, never in
 * `investigations/`, and every finding cites the evidence that supports it.
 */

import type { Provenance } from "./provenance.ts";

export type FindingCategory =
  | "architecture"
  | "mechanism"
  | "comparison"
  | "reusable-pattern";

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  /** The conclusion, written as markdown. */
  body: string;
  /**
   * Ids of the observations/nodes/traces this conclusion rests on. A finding with an empty
   * `supports` list is unsupported and should not be published.
   */
  supports: string[];
  /** Always `kind: "inference"` for a finding. */
  provenance: Provenance;
}

/** Maps a finding to the directory under `findings/` where it belongs. */
export const FINDING_DIRS: Record<FindingCategory, string> = {
  architecture: "architecture",
  mechanism: "mechanisms",
  comparison: "comparisons",
  "reusable-pattern": "reusable-patterns",
};
