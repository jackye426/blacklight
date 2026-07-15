# Claude Code — the local harness (architecture dossier)

> **This is a `findings/` document: it contains inferences.** Every claim is tagged with how we
> know it. It is written independently and cites external sources; it copies no third-party
> source code (see [RESEARCH-POLICY.md](../../RESEARCH-POLICY.md)).

**Provenance legend**

- `[docs]` — grounded in official Claude Code documentation (cited below).
- `[trace]` — confirmable by a runtime trace **we** capture via `adapter-claude-code`; where we
  have not yet captured it, the claim is marked _pending_ and mirrored in `unknowns`.
- `[infer]` — our reasoning; may be wrong.

## Scope and limits

We can approach a comprehensive understanding of the Claude Code **local harness** — the client
that runs in the terminal, manages context, executes tools, and persists sessions. We cannot,
and do not, obtain Claude's weights, training data, or Anthropic's production/inference stack,
and we do not represent otherwise. `[infer]`

## The harness at a glance

At its core the harness is a loop: call the model, receive tool-use requests, execute the
approved tools, feed results back, repeat until the turn is done. `[infer]` The Agent SDK
exposes exactly these seams — tools, subagents, permission settings, and lifecycle callbacks —
which is consistent with a thin-orchestration / heavy-harness design. `[docs]`

A useful lens is that most of the *complexity* lives around the loop, not inside an explicit
planning graph: the harness invests in the operational surface (permissions, context handling,
extension layers, persistence) while leaving the model substantial reasoning freedom. `[infer]`
This is the specific claim the harness comparison is designed to test empirically.

## Mechanisms

### Agent loop
Model request → tool request → tool execution → result, iterated. `[infer]` Blacklight models a
run as `interaction → model.request → tool.call → (permission.wait | subagent.call)`, which is
the hierarchy our OTel and session readers reconstruct. `[trace]` _(pending our capture)_

### Permission system
Tool execution passes through a permission layer; hooks can run at the permission point, and the
SDK exposes permission settings. `[docs]` Depth of the layering (per-tool, per-path, modes) is
_pending_ our own trace. `[trace]`

### Context management
The harness applies progressive context-reduction as sessions grow (compaction). `[infer]` Our
`long-compaction` task exists specifically to observe behaviour across a compaction boundary.
`[trace]` _(pending)_

### Extension layers — MCP, plugins, skills, hooks
These are **distinct** extension points, not one mechanism: MCP servers add tools/resources;
plugins/skills package capabilities; hooks run commands at lifecycle points (tool use,
permission, session start/stop). `[docs]` The hook surface is what `adapter-claude-code` uses to
capture lifecycle events — official observability, no internals. `[docs]`

### Subagents
The harness can dispatch subagents; the SDK exposes them as a first-class concept. `[docs]`
Blacklight represents each as a `subagent.call` under the interaction that spawned it. `[trace]`

### Session persistence
Sessions are stored with an append-oriented model (an append-only transcript). `[infer]` Our
session reader consumes that transcript as JSONL and normalises it to trace events. `[trace]`

## Open questions (see also each target's `unknowns.md`)

- Exact shape of the permission layering, from our own traces rather than docs alone.
- What compaction actually drops/keeps, observed across the `long-compaction` task.
- Whether explicit planning would measurably improve execution vs the current thin orchestration
  — the central question of the harness comparison.

## Sources (cited, not copied)

- Claude Code — Hooks guide: <https://docs.anthropic.com/en/docs/claude-code/hooks-guide>
- Claude Agent SDK overview: <https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview>
- Claude Code — Monitoring (OpenTelemetry): <https://docs.anthropic.com/en/docs/claude-code/monitoring-usage>
- Anthropic Claude Code repository: <https://github.com/anthropics/claude-code>
- Academic analysis of a specific Claude Code version (external work, to cross-check against —
  not treated as established fact here): "Dive into Claude Code", arXiv:2604.14228.

## Method note

The strongest methodology combines: historical source-level architecture (external, cited) +
current official documentation + current runtime tracing (ours) + controlled behavioural
experiments (the harness comparison). No single source is treated as ground truth.
