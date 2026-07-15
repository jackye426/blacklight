# Investigation: Codex (static case study)

The second harness in the comparison, and a legitimate open implementation to contrast with
Claude Code. See [`adapters/codex`](../../adapters/codex) for scope.

## Status

- ⏳ **Not yet ingested.** External repo → source stays in the git-ignored `vendor/` cache.
- ⚠️ **Known coverage gap:** V1 static analysis is TS/JS only. Codex's Rust core will **not**
  be mapped by the current pipeline — that gap is the motivating case for a future tree-sitter
  multi-language adapter and must be recorded in `unknowns.md`, not glossed over.

## How to run it

```bash
pnpm atlas ingest github:openai/codex
pnpm atlas map    github:openai/codex
```

Then, in this investigation's `unknowns.md`, record explicitly which subtrees are Rust (and thus
unmapped) versus TypeScript (mapped). Honesty about coverage is the point.

## Pairs with

The behavioural side of Codex is captured through the
[harness comparison](../harness-comparison/README.md); this static study covers structure.
