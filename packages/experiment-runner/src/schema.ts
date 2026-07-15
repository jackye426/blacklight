/**
 * The `investigation.yaml` schema for a comparative experiment: the subjects under test, the
 * tasks they each perform, the fixtures they operate on, and the metrics to record.
 */

/** A system under test (a harness, a tool). */
export interface Subject {
  id: string;
  name: string;
  notes?: string;
}

/** A repository/workspace a task operates against. */
export interface Fixture {
  id: string;
  /** A local path or a github reference resolvable by the adapters. */
  path: string;
}

/** One task every subject performs. */
export interface Task {
  id: string;
  title: string;
  /** The instruction given to each subject, verbatim, for fairness. */
  prompt: string;
  /** Fixture id this task runs against. */
  fixture?: string;
  /** Free-form grouping, e.g. "recovery" or "scope". */
  category?: string;
}

export interface InvestigationSpec {
  name: string;
  description?: string;
  subjects: Subject[];
  tasks: Task[];
  fixtures?: Fixture[];
  /** Metric keys to record. Defaults to the full standard set when omitted. */
  metrics?: string[];
}
