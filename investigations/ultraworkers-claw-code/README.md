# Investigation: ultraworkers/claw-code

Public Claw Code / `claw` harness artifact related to the Claude Code leak-era ecosystem.
Blacklight treats this as a public reimplementation/reference case study, not as canonical
Anthropic Claude Code source.

## Status

- ✅ **Cached locally in `vendor/` and ingested.** Third-party source remains git-ignored.
- ✅ **Mapped to an observation skeleton.** The rendered map is
  [`architecture.md`](./architecture.md).
- ⚠️ **Known coverage gap:** the useful implementation surface is mostly Rust, with some
  Python/reference code. V1 static analysis is TS/JS-only, so the current result is a
  component/directory inventory, not a semantic map.
- **Manual source study complete.** The canonical Rust runtime was traced directly to recover the
  architecture that V1 cannot yet infer automatically.

## Commands

```bash
pnpm atlas ingest github:ultraworkers/claw-code
pnpm atlas map    github:ultraworkers/claw-code
```

## Result

- Files scanned: 386
- Graph: 40 nodes, 0 edges
- Concepts: 0
- Key coverage note: [`unknowns.md`](./unknowns.md)
- Direct observation ledger: [`source-study.md`](./source-study.md)
- Finding: [`../../findings/architecture/claw-code-structure.md`](../../findings/architecture/claw-code-structure.md)

## Research boundary

Do not commit the source tree or represent it as Anthropic-owned source. The safe use here is
to study the public repository's declared structure, compare its harness ideas with the
Claude Code dossier, and use it as a motivating target for Rust/Python static analysis.
