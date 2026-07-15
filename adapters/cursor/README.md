# adapter-cursor (stub)

**Status:** planned. No code in V1 — this file records scope and approach.

## Why Cursor

Cursor is the third harness in the comparison, but it is the least source-accessible of the
three. It is therefore studied **behaviourally** rather than by source analysis, and comes
after Claude Code and Codex for exactly that reason.

## Planned approach

1. **Behavioural first.** Drive Cursor through the `experiment-runner` protocol on the shared
   harness-comparison tasks and record `metrics.yaml` per run from observation.
2. **Trace what is exposed.** Capture whatever official surfaces exist (logs, any telemetry the
   user can enable) and normalise them into the shared `TraceEvent` shape, mirroring the
   Claude Code adapter's hook/session/OTel readers.

## What this adapter will add

Normalisers for Cursor's observable outputs and any convenience for pointing the experiment
runner at a Cursor run. No claim of source-level architectural coverage — its findings will be
tagged as behavioural inferences, cited to the runs that produced them.
