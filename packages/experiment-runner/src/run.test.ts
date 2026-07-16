import { describe, expect, it } from "vitest";
import { fillMetricsYaml } from "./run.ts";

const TEMPLATE = `# Task: t1 — demo
task: t1
subject: s1
metrics:
  files-read: null
  edits-made: 7
  scope-violations: null
  completion-claimed: null
  actual-correctness: null  # correct | partial | incorrect | unknown
notes: ""
`;

describe("fillMetricsYaml", () => {
  it("fills null fields, preserving trailing comments", () => {
    const { text, updated } = fillMetricsYaml(TEMPLATE, {
      "files-read": 4,
      "actual-correctness": "correct",
      "completion-claimed": true,
    });
    expect(updated.sort()).toEqual(["actual-correctness", "completion-claimed", "files-read"]);
    expect(text).toContain("files-read: 4");
    expect(text).toContain("completion-claimed: true");
    expect(text).toContain("actual-correctness: correct  # correct | partial | incorrect | unknown");
  });

  it("never overwrites a value a human already recorded", () => {
    const { text, skippedExisting } = fillMetricsYaml(TEMPLATE, { "edits-made": 99 });
    expect(skippedExisting).toEqual(["edits-made"]);
    expect(text).toContain("edits-made: 7");
    expect(text).not.toContain("edits-made: 99");
  });

  it("fills empty notes but leaves existing notes alone", () => {
    const filled = fillMetricsYaml(TEMPLATE, {}, "grader: ok");
    expect(filled.text).toContain('notes: "grader: ok"');
    const again = fillMetricsYaml(filled.text, {}, "something else");
    expect(again.text).toContain('notes: "grader: ok"');
  });

  it("ignores null/undefined computed values", () => {
    const { text, updated } = fillMetricsYaml(TEMPLATE, { "scope-violations": null });
    expect(updated).toEqual([]);
    expect(text).toContain("scope-violations: null");
  });
});
