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

## How to run it

For each subject (Claude Code, Codex, Cursor) and each of the seven tasks:

1. **Reset the fixture** to a clean copy so every run starts from the same state.
2. **Instrument** where possible:
   - Claude Code — install the hook harness and capture:
     ```ts
     import { writeHookHarness } from "@blacklight/adapter-claude-code";
     writeHookHarness("<fixture copy>");
     ```
     or trace a scripted invocation with `atlas trace -- <cmd>`.
   - Codex / Cursor — wrap with `atlas trace -- <cmd>` where the run can be scripted;
     otherwise record by observation.
3. **Give the harness the task's `prompt` verbatim** (fairness — no rewording between subjects).
4. **Record** the observed metrics into `runs/<task>/<subject>/metrics.yaml`. Fill only what you
   observed; leave anything you did not observe as `null`. Do not guess (see
   [RESEARCH-POLICY.md](../../RESEARCH-POLICY.md)).

Then regenerate the report:

```bash
pnpm atlas compare investigations/harness-comparison/investigation.yaml --report
```

## From evidence to findings

The report's per-task tables are **observations**. Answer the report's open questions in prose —
in `findings/comparisons/` or `findings/reusable-patterns/` — and **cite the runs**. Keep the
line between what you measured and what you concluded visible at all times.
