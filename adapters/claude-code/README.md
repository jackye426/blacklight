# adapter-claude-code

Capture Claude Code runtime behaviour through **official surfaces only** — no leaked source,
no private internals. Three independent capture paths, all normalised into Blacklight's shared
`TraceEvent` shape and rendered by the same `execution-flow.md` pipeline as any traced process.

## 1. Lifecycle hooks (live capture)

Install the hook harness into a project directory, then run Claude Code there:

```ts
import { writeHookHarness } from "@blacklight/adapter-claude-code";
const { settingsPath, traceFile } = writeHookHarness("/path/to/project");
// → writes /path/to/project/.claude/settings.json + blacklight-emit-hook.mjs
```

Claude Code fires the emitter at `SessionStart`, `UserPromptSubmit`, `PreToolUse`,
`PostToolUse`, `Notification`, and `Stop`, appending one JSON line per firing to `traceFile`.
Normalise afterwards:

```ts
import { readHookTrace } from "@blacklight/adapter-claude-code";
const events = readHookTrace(await readFile(traceFile, "utf8"));
```

## 2. Session transcript (post-hoc)

Claude Code persists an append-only session transcript (JSONL). Point the reader at one:

```ts
import { readClaudeSession } from "@blacklight/adapter-claude-code";
const events = readClaudeSession(await readFile(sessionPath, "utf8"));
```

The reader is version-tolerant: it maps user turns → `interaction`, assistant turns →
`model.request`, and `tool_use` items → `tool.call`, using `uuid`/`parentUuid` when present.

## 3. OpenTelemetry export (post-hoc)

With OTel enabled, Claude Code emits spans forming the interaction → model request / hook /
tool call → permission wait / subagent hierarchy:

```ts
import { readOtlpSpans } from "@blacklight/adapter-claude-code";
const events = readOtlpSpans(JSON.parse(await readFile(otlpExportPath, "utf8")));
```

## Note on evidence

Every event these readers produce is an **observation**: the hook fired, the transcript line
exists, the span was recorded. The *interpretation* of those events (what a harness is "doing")
is a finding, and belongs in `findings/`, not here.
