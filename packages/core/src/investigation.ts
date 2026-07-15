/** Metadata describing a single investigation run. */

import type { Target } from "./target.ts";

export interface Investigation {
  target: Target;
  /** ISO timestamp when the investigation was created. */
  createdAt: string;
  /** The Blacklight version that produced it, for reproducibility. */
  blacklightVersion: string;
}

/** The Blacklight version stamped onto artifacts. Kept in one place. */
export const BLACKLIGHT_VERSION = "0.1.0";
