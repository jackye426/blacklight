import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseInvestigationSpec } from "./load.ts";
import { readRuns, scaffoldRuns } from "./scaffold.ts";
import { generateComparisonReport } from "./report.ts";

const YAML = `
name: demo
description: A tiny demo comparison.
subjects:
  - id: a
    name: Harness A
  - id: b
    name: Harness B
tasks:
  - id: t1
    title: First task
    prompt: Do the thing.
metrics:
  - files-read
  - completion-claimed
  - actual-correctness
`;

describe("experiment-runner", () => {
  it("parses and validates an investigation spec", () => {
    const spec = parseInvestigationSpec(YAML);
    expect(spec.name).toBe("demo");
    expect(spec.subjects.map((s) => s.id)).toEqual(["a", "b"]);
    expect(spec.tasks).toHaveLength(1);
  });

  it("rejects a spec missing required fields", () => {
    expect(() => parseInvestigationSpec("name: x\nsubjects: []\n")).toThrow(/subjects/);
  });

  it("scaffolds one template per (task × subject) and reads them back", () => {
    const spec = parseInvestigationSpec(YAML);
    const dir = mkdtempSync(join(tmpdir(), "bl-runner-"));

    const { created } = scaffoldRuns(spec, dir);
    expect(created).toHaveLength(2); // 1 task × 2 subjects

    // Scaffolding again is idempotent.
    expect(scaffoldRuns(spec, dir).created).toHaveLength(0);

    // Record one run; leave the other untouched.
    const runA = join(dir, "t1", "a", "metrics.yaml");
    writeFileSync(
      runA,
      readFileSync(runA, "utf8")
        .replace("files-read: null", "files-read: 4")
        .replace("actual-correctness: null", "actual-correctness: correct"),
      "utf8",
    );

    const runs = readRuns(spec, dir);
    expect(runs.filter((r) => r.recorded)).toHaveLength(1);
    expect(runs.find((r) => r.subjectId === "a")?.metrics["files-read"]).toBe(4);
  });

  it("generates a report that separates observed tables from open questions", () => {
    const spec = parseInvestigationSpec(YAML);
    const runs = [
      { taskId: "t1", subjectId: "a", metrics: { "files-read": 4, "completion-claimed": true, "actual-correctness": "correct" }, recorded: true, path: "" },
      { taskId: "t1", subjectId: "b", metrics: { "files-read": null, "completion-claimed": null, "actual-correctness": null }, recorded: false, path: "" },
    ];
    const report = generateComparisonReport(spec, runs);
    expect(report).toContain("Harness A");
    expect(report).toContain("First task");
    expect(report).toContain("1/2 runs recorded");
    expect(report).toContain("Open questions");
    expect(report).toMatch(/\| Files read \| 4 \| — \|/);
  });
});
