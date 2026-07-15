# Investigations

**Evidence lives here.** Each subdirectory is one investigation into one target (or, for a
comparison, one experiment across several targets). Everything under `investigations/` should
be a direct **observation** — something Blacklight captured from the target:

- `graph.json` — the architectural model (nodes/edges with provenance) — _regenerable, git-ignored_
- `concepts.json` — extracted abstractions — _regenerable, git-ignored_
- `architecture.md` / `execution-flow.md` — rendered views of the above (tracked)
- `runtime-trace.jsonl` — captured execution events
- `unknowns.md` — things we could not determine (recorded, never guessed)
- `investigation.yaml` — for comparative experiments, the protocol definition
- `runs/<task>/<subject>/metrics.yaml` — recorded per-run metrics (tracked evidence)
- `*.trace.jsonl` / `runtime-trace.jsonl` — large raw captures (git-ignored; regenerable)

Conclusions we *reason to* from this evidence do not belong here — they belong in
[`../findings/`](../findings). See [../RESEARCH-POLICY.md](../RESEARCH-POLICY.md).
