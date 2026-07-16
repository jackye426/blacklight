# Investigation: Claude Code vs Codex vs Cursor

The first Blacklight investigation. Seven controlled tasks, three harnesses, one fixture. See
[`investigation.yaml`](./investigation.yaml) for the protocol and
[`fixtures/sample-app`](./fixtures/sample-app) for the shared substrate.

## Status

- ✅ Protocol authored (`investigation.yaml`)
- ✅ Fixture built (`fixtures/sample-app`, with intentional bugs and a declared scope)
- ✅ Runs scaffolded — 21 `metrics.yaml` templates under `runs/<task>/<subject>/`
- ✅ Report skeleton generated → [`../../findings/comparisons/harness-comparison.md`](../../findings/comparisons/harness-comparison.md)
- ⏳ **Runs not yet executed.** The runner is protocol-driven by design: a human drives each
  harness through the tasks and records what actually happened. This is that step.

## How to run it (self-recording — works with GUI harnesses)

Each run is three commands plus driving the harness. Works the same whether the harness is a
CLI (Claude Code), a VS Code extension (Codex via the ChatGPT extension), or a GUI (Cursor).

```bash
# 1. Prepare an isolated, self-recording workspace (fresh fixture copy + git baseline;
#    Claude Code runs also get the hook harness auto-installed):
pnpm atlas run start investigations/harness-comparison/investigation.yaml obvious-bug cursor

# 2. Drive the harness IN THAT WORKSPACE (the command prints the path and the exact prompt):
#    - claude-code → open a terminal there, run `claude`, paste the prompt
#    - codex       → open the folder in VS Code, paste the prompt into the Codex extension
#    - cursor      → open the folder in Cursor, paste the prompt into the agent
#    Give the prompt verbatim — no rewording between subjects.

# 3. Measure and record (git diff vs baseline, grader verdict, hook-trace counts for CC):
pnpm atlas run finish investigations/harness-comparison/investigation.yaml obvious-bug cursor \
  --completion-claimed true   # did the harness claim it was done? (you observed this)
```

What gets auto-recorded, honestly:

| Metric | How | Which subjects |
| --- | --- | --- |
| edits-made | git diff vs baseline (or hook trace for CC) | all |
| scope-violations | protected paths (`legacy/`) touched vs baseline | all |
| actual-correctness | task grader vs the fixture's known answers | 5 of 7 tasks |
| files-read/searched, commands, permissions, subagents, compactions | hook trace | claude-code only |

Everything unobservable for a GUI harness stays `null` — the report shows `—`, never a guessed
zero. Values you record by hand in `metrics.yaml` are never overwritten by `finish`.
`vague-feature` and `long-compaction` have no grader: judge those two by hand.

Then regenerate the report:

```bash
pnpm atlas compare investigations/harness-comparison/investigation.yaml --report
```

## From evidence to findings

The report's per-task tables are **observations**. Answer the report's open questions in prose —
in `findings/comparisons/` or `findings/reusable-patterns/` — and **cite the runs**. Keep the
line between what you measured and what you concluded visible at all times.
