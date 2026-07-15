/** Load and validate an `investigation.yaml` into an {@link InvestigationSpec}. */

import { readFileSync } from "node:fs";
import { parse } from "yaml";
import type { InvestigationSpec, Subject, Task } from "./schema.ts";

function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`investigation.yaml: "${field}" must be a non-empty list`);
  }
  return value;
}

function validateSubject(raw: unknown, i: number): Subject {
  const s = raw as Partial<Subject>;
  if (!s.id || !s.name) throw new Error(`investigation.yaml: subjects[${i}] needs "id" and "name"`);
  return { id: s.id, name: s.name, ...(s.notes ? { notes: s.notes } : {}) };
}

function validateTask(raw: unknown, i: number): Task {
  const t = raw as Partial<Task>;
  if (!t.id || !t.title || !t.prompt) {
    throw new Error(`investigation.yaml: tasks[${i}] needs "id", "title", and "prompt"`);
  }
  return {
    id: t.id,
    title: t.title,
    prompt: t.prompt,
    ...(t.fixture ? { fixture: t.fixture } : {}),
    ...(t.category ? { category: t.category } : {}),
  };
}

export function parseInvestigationSpec(yamlText: string): InvestigationSpec {
  const doc = parse(yamlText) as Partial<InvestigationSpec>;
  if (!doc || typeof doc !== "object") throw new Error("investigation.yaml: not a valid document");
  if (!doc.name) throw new Error('investigation.yaml: "name" is required');

  const subjects = requireArray(doc.subjects, "subjects").map(validateSubject);
  const tasks = requireArray(doc.tasks, "tasks").map(validateTask);

  return {
    name: doc.name,
    ...(doc.description ? { description: doc.description } : {}),
    subjects,
    tasks,
    ...(doc.fixtures ? { fixtures: doc.fixtures } : {}),
    ...(doc.metrics ? { metrics: doc.metrics } : {}),
  };
}

export function loadInvestigationSpec(path: string): InvestigationSpec {
  return parseInvestigationSpec(readFileSync(path, "utf8"));
}
