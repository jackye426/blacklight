# adapter-codex (stub)

**Status:** planned. No code in V1 — this file records scope and approach.

## Why Codex

Codex has an open implementation, which makes it a legitimate comparison point for the harness
study (unlike Cursor, which is mostly behavioural). It lets us contrast an explicit,
inspectable agent loop with Claude Code's.

## Planned approach

1. **Static (partial today).** Resolve the repo with `adapter-github`, then `atlas ingest`. The
   TypeScript CLI surface analyses immediately with the existing ts-morph pipeline. The Rust
   core does **not** — V1 static analysis is TS/JS only. That gap is recorded in the target's
   `unknowns.md` and is the motivating case for a future tree-sitter multi-language adapter.
2. **Behavioural.** Run Codex through the `experiment-runner` protocol on the shared
   harness-comparison tasks, capturing process-level traces via `atlas trace` where the run can
   be wrapped.

## What this adapter will add

A resolver that pins a Codex version and tags which subtrees are TS-analysable vs Rust (so the
graph and `unknowns.md` are honest about coverage), plus any Codex-specific log/telemetry
normalisation into the shared `TraceEvent` shape.
