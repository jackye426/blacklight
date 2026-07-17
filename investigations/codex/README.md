# Investigation: Codex (static case study)

The second harness in the comparison, and a legitimate open implementation to contrast with
Claude Code. See [`adapters/codex`](../../adapters/codex) for scope.

## Status

- ✅ **Ingested and mapped.** The live run writes to
  [`../openai-codex`](../openai-codex) because the GitHub target id is `openai-codex`.
  External source stays in the git-ignored `vendor/` cache.
- ⚠️ **Known coverage gap:** V1 static analysis is TS/JS only. Codex's Rust core is present
  in the source tree but not semantically mapped by the current pipeline — that gap is the
  motivating case for a future tree-sitter multi-language adapter and is recorded in
  `../openai-codex/unknowns.md`.

## How to run it

```bash
pnpm atlas ingest github:openai/codex
pnpm atlas map    github:openai/codex
```

Then, in this investigation's `unknowns.md`, record explicitly which subtrees are Rust (and thus
unmapped) versus TypeScript (mapped). Honesty about coverage is the point.

## Result

- Files scanned: 5,480
- Graph: 1,140 nodes, 2,713 edges
- Concepts: 660
- Architecture skeleton: [`../openai-codex/architecture.md`](../openai-codex/architecture.md)
- Finding: [`../../findings/architecture/codex-structure.md`](../../findings/architecture/codex-structure.md)

## Pairs with

The behavioural side of Codex is captured through the
[harness comparison](../harness-comparison/README.md); this static study covers structure.
