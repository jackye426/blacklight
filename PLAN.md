# Blacklight — Implementation Plan

**Overall Progress:** `92%` _(V1 complete; live harness runs & extra external ingests are documented human-driven steps. Step 11 web UI is Phase 2.)_

## TLDR

Blacklight is a standalone, local-first **software intelligence laboratory**: give it a repository, installed application, or local workspace and it maps components, traces execution, identifies core abstractions, runs controlled experiments, compares systems, and preserves everything as a navigable knowledge graph. V1 is a CLI (`atlas`) with four commands — `ingest`, `map`, `trace`, `compare` — producing a fixed set of artifacts per target. The first major output is a harness comparison: **Claude Code vs Codex vs Cursor**. The web UI comes after the CLI proves the model.

## Critical Decisions

- **Project name: Blacklight** — taken from this directory's name ("Blacklight - system anatomy"); CLI binary stays `atlas` per the command spec (`atlas ingest`, etc.). Rename is a find-replace if you prefer otherwise.
- **Standalone repo, not part of Personal Operator** — the capability is general; Personal Operator can call it as a tool later.
- **TypeScript monorepo with pnpm workspaces** — all four initial targets are analyzable from a Node toolchain; single language keeps V1 small.
- **CLI-first, web UI deferred to Phase 2** — V1 is the four commands; the Next.js graph explorer reads the same `graph.json` later, so nothing is thrown away.
- **Knowledge graph persisted as plain JSON per investigation** (`graph.json`) — no database in V1; the schema carries provenance so a store can be swapped in later.
- **Every graph node/edge and finding is tagged `observation` or `inference`** — `investigations/` holds experiments and evidence; `findings/` holds conclusions; the schema enforces the distinction, not convention alone.
- **Static analysis V1 scope: TypeScript/JavaScript only** (ts-morph) — covers Claude Code harness, Firecrawl, Obsidian plugins. tree-sitter multi-language (Rust for Codex CLI) is a later adapter, not V1.
- **Runtime tracing V1 = process wrapper + Claude Code official observability** (hooks, OpenTelemetry, session JSONL) — no ptrace/dtrace-style instrumentation in V1.
- **Experiment runner V1 is protocol-driven, not fully automated** — `investigation.yaml` defines tasks/metrics; the runner scaffolds, records, and reports; a human drives the harnesses under test.
- **IP policy: no redistributed third-party source in this repo** — no leaked Claude Code snapshot, no mirrors. We commit our own observations, file references, diagrams, and independently written explanations only. Enforced via `RESEARCH-POLICY.md` + `.gitignore` rules for vendored source.

## Tasks:

- [x] 🟩 **Step 1: Repo foundation**
  - [x] 🟩 `git init`, `.gitignore` (node, build output, `vendor/`, any third-party source drops)
  - [x] 🟩 pnpm workspace (`pnpm-workspace.yaml`), root `package.json`, base `tsconfig.json`
  - [x] 🟩 Create monorepo skeleton: `apps/{web,cli}`, `packages/{core,static-analysis,runtime-tracing,knowledge-graph,experiment-runner}`, `adapters/{github,local-repo,obsidian,claude-code,codex,cursor,firecrawl}`, `investigations/`, `findings/{architecture,mechanisms,comparisons,reusable-patterns}`
  - [x] 🟩 `README.md` (what Blacklight is, architecture diagram, V1 commands) and `RESEARCH-POLICY.md` (evidence vs inference rule, IP rules, what may/may not be committed)

- [x] 🟩 **Step 2: `packages/core` — shared investigation model**
  - [x] 🟩 Types: `Target`, `Investigation`, `Evidence` (`Provenance` with `kind: observation | inference` and source reference), `Finding`, `Component`, `Relationship`, `Concept`
  - [x] 🟩 Output artifact contracts for the seven files: `architecture.md`, `execution-flow.md`, `concepts.json`, `graph.json`, `runtime-trace.jsonl`, `unknowns.md`, `reusable-patterns.md`
  - [x] 🟩 Investigation workspace helper: creates/reads `investigations/<target>/` layout

- [x] 🟩 **Step 3: `packages/knowledge-graph`**
  - [x] 🟩 `graph.json` schema: nodes (`file`, `component`, `concept`, `flow`), edges (`imports`, `contains`, `calls`, `implements`, `relates-to`), each with provenance + observation/inference tag
  - [x] 🟩 Graph builder API (add/merge nodes and edges, dedupe) and simple query helpers (neighbors, subgraph by node type) — plus unit tests
  - [x] 🟩 Markdown renderer: graph → `architecture.md` skeleton (component list, dependency summary, mermaid diagram)

- [x] 🟩 **Step 4: `packages/static-analysis`**
  - [x] 🟩 Workspace walker: file tree, language/size stats, entry-point detection (package.json bins, main, exports)
  - [x] 🟩 TS/JS import + dependency graph via ts-morph → knowledge-graph nodes/edges
  - [x] 🟩 Component heuristics: group files into components by directory/package boundaries and import clusters
  - [x] 🟩 Concept extraction: exported types/interfaces/classes/enums → `concepts.json`; unresolved imports/parse failures → `unknowns.md`

- [x] 🟩 **Step 5: `apps/cli` — `atlas ingest` + `atlas map`**
  - [x] 🟩 CLI scaffold (`atlas` bin, command router, argv parser, target resolution)
  - [x] 🟩 `atlas ingest ./repo`: runs walker + static analysis, writes `graph.json`, `concepts.json`, `unknowns.md` into `investigations/<target>/`
  - [x] 🟩 `atlas map ./repo`: renders `architecture.md` (and mermaid diagram) from the ingested graph; auto-ingests if needed
  - [x] 🟩 Smoke-test both commands against this repo itself — 60 files, 83 nodes, 149 edges, 37 concepts, 14 components recovered correctly

- [x] 🟩 **Step 6: `packages/runtime-tracing` + `atlas trace`**
  - [x] 🟩 Process wrapper: `atlas trace -- <command>` captures spawn, stdout/stderr, exit codes, timing → `runtime-trace.jsonl` (validated on a real subprocess)
  - [x] 🟩 `adapters/claude-code`: hook harness generator + emitter (`writeHookHarness`/`readHookTrace`), session JSONL reader, OTLP/JSON reader — all normalised to `TraceEvent`; unit-tested with synthetic input
  - [x] 🟩 Trace → `execution-flow.md` renderer (interaction → model request / hook execution / tool call hierarchy via `parentId`)

- [x] 🟩 **Step 7: `packages/experiment-runner` + `atlas compare`**
  - [x] 🟩 `investigation.yaml` schema + loader/validator: subjects, task list, fixtures, and the full standard metric set (files searched/read, plans, commands, edits, permission requests, subagents, tests, failures, retries, scope violations, compactions, completion claims, actual correctness)
  - [x] 🟩 Run protocol: `scaffoldRuns` creates one `metrics.yaml` template per (task × subject), idempotently; `readRuns` reads them back and flags recorded vs pending
  - [x] 🟩 Comparison report generator: per-task metric tables (subjects as columns) + cross-task numeric summary + open-questions section → `findings/comparisons/`; unit-tested

- [x] 🟩 **Step 8: V1 adapters**
  - [x] 🟩 `adapters/local-repo`: `LocalRepoResolver` for any local directory (built in Step 5, used by ingest/map)
  - [x] 🟩 `adapters/github`: `GithubResolver` shallow-clones into the gitignored `vendor/` cache, then delegates to the local-repo model (built in Step 5)
  - [x] 🟩 Stub READMEs for `codex`, `cursor`, `obsidian`, `firecrawl` (scope + planned approach, no code); `exports` removed from stub manifests

- [ ] 🟨 **Step 9: Investigation 1 — Claude Code vs Codex vs Cursor**
  - [x] 🟩 Author `investigations/harness-comparison/investigation.yaml` with the seven task types (obvious local bug, broad-exploration bug, vague feature, migration, misleading instructions, scope violation, long task crossing compaction) + `fixtures/sample-app` (intentional bugs, declared scope) + runbook README; 21 runs scaffolded
  - [ ] 🟨 Execute runs for all three harnesses, capturing traces — **human-driven by design** (runner is protocol-driven). Runbook in the investigation README; instrumentation ready (`atlas trace`, `adapter-claude-code`)
  - [ ] 🟨 Generate comparison report; write conclusions — report skeleton generated at `findings/comparisons/harness-comparison.md` (0/21 recorded); conclusions + `findings/reusable-patterns/` await recorded runs. The TaskGraph OS questions are embedded in the report's open-questions section

- [ ] 🟨 **Step 10: Static case studies — Codex, Firecrawl, Obsidian**
  - [x] 🟩 `atlas ingest` + `atlas map` on Firecrawl — **actually run**: 1631 files, 1339 nodes, 4087 edges, 592 concepts → `investigations/firecrawl-firecrawl/` + written finding `findings/architecture/firecrawl-structure.md` (cited to the graph)
  - [ ] 🟨 Codex: runbook + Rust-core coverage gap documented (`investigations/codex/README.md`); live ingest is a one-command human step (external repo)
  - [ ] 🟨 Obsidian: runbook for plugin-source ingest + planned vault analysis (`investigations/obsidian/README.md`)
  - [x] 🟩 Claude Code architecture dossier `findings/architecture/claude-code-harness.md` — independently written from official docs + our trace model, provenance-tagged, external work cited, no leaked source

- [ ] 🟥 **Step 11 (Phase 2): `apps/web` — graph explorer**
  - [ ] 🟥 Next.js app reading `investigations/*/graph.json`: graph view, component drill-down, trace timeline, comparison view
  - [ ] 🟥 Local daemon endpoint so the web UI can trigger ingest/trace against local targets
