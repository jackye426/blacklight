# Blacklight

**A local-first software intelligence laboratory.**

Give Blacklight a repository, an installed application, or a local workspace and it will:

```text
→ map its components
→ trace how it executes
→ identify its core abstractions
→ run controlled experiments
→ compare it against other systems
→ preserve everything as a navigable knowledge graph
```

Blacklight is a general-purpose engine for examining software, building an architectural
model of it, running experiments, and extracting reusable design patterns. It is standalone
and local-first — a normal web app cannot freely inspect local files, processes, application
data, or execution logs, so Blacklight runs where the software lives.

Its first major case study is a comparison of AI coding harnesses — **Claude Code vs Codex
vs Cursor** — but the engine is not a one-off analysis of any single system.

---

## Architecture

```text
┌──────────────────────────────────────┐
│ Web interface  (Phase 2)             │
│ Graphs, traces, comparisons, queries │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ atlas CLI  (V1)                      │
│ Reads repositories and runs tests    │
└─────────┬────────────┬───────────────┘
          │            │
   Static analysis  Runtime analysis
          │            │
      AST/imports   processes/logs/hooks
          │            │
┌─────────▼────────────▼───────────────┐
│ Persistent architectural model       │
│ Files, components, flows, concepts   │
└──────────────────────────────────────┘
```

## Repository layout

```text
blacklight/
├── apps/
│   ├── web/                    # Next.js graph & exploration UI (Phase 2)
│   └── cli/                    # The `atlas` command
│
├── packages/
│   ├── core/                   # Shared investigation model & artifact contracts
│   ├── static-analysis/        # AST, imports, dependencies (TS/JS via ts-morph)
│   ├── runtime-tracing/        # Processes, hooks, telemetry
│   ├── knowledge-graph/        # Components and relationships
│   └── experiment-runner/      # Controlled comparative tasks
│
├── adapters/                   # Source resolvers: github, local-repo, obsidian,
│   │                           # claude-code, codex, cursor, firecrawl
│
├── investigations/            # Experiments and EVIDENCE (observations)
│
└── findings/                  # CONCLUSIONS (inferences)
    ├── architecture/
    ├── mechanisms/
    ├── comparisons/
    └── reusable-patterns/
```

The split between `investigations/` and `findings/` is deliberate: we never want the engine
to treat an inference as an observed fact. See [RESEARCH-POLICY.md](./RESEARCH-POLICY.md).

## V1 commands

```bash
atlas ingest ./repo          # Static analysis → graph.json, concepts.json, unknowns.md
atlas map ./repo             # Render architecture.md from the ingested graph
atlas trace -- <command>     # Wrap a process, capture execution → runtime-trace.jsonl
atlas compare investigation.yaml   # Run a comparative experiment → comparison report
```

Each investigation produces a fixed set of artifacts:

```text
architecture.md        execution-flow.md      concepts.json
graph.json             runtime-trace.jsonl    unknowns.md
reusable-patterns.md
```

## Getting started

```bash
pnpm install
pnpm atlas ingest .          # Blacklight ingesting itself — the V1 smoke test
pnpm atlas map .
```

## Status

V1 (the `atlas` CLI and its packages) is under active construction. The web UI is Phase 2.
See [PLAN.md](./PLAN.md) for the live implementation plan and progress.
