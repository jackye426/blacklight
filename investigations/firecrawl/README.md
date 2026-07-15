# Investigation: Firecrawl (static case study)

A highly practical **non-agent** system — queues, workers, crawling, performance — and a strong
TypeScript static-analysis target. See [`adapters/firecrawl`](../../adapters/firecrawl) for
scope.

## Status

- ✅ **Ingested + mapped.** Artifacts are in
  [`../firecrawl-firecrawl/`](../firecrawl-firecrawl) (the GitHub target's slug): 1631 files,
  1339 graph nodes, 4087 edges, 592 concepts, 1 recorded unknown. Source lives only in the
  git-ignored `vendor/` cache, never committed (RESEARCH-POLICY.md).
- ⏳ Runtime study (worker trace) and written architecture finding still to do.

## How it was run

```bash
# Clones into vendor/github/firecrawl__firecrawl (git-ignored), then analyses:
pnpm atlas ingest github:firecrawl/firecrawl
pnpm atlas map    github:firecrawl/firecrawl
```

This wrote `graph.json`, `concepts.json`, `unknowns.md`, and `architecture.md` into
`investigations/firecrawl-firecrawl/`. First pass cleanly separated the monorepo apps
(`apps/api` is the ~700-file core, plus `js-sdk`, `playwright-service`, `test-suite`).

## What to look for

- Do the queue / worker / crawler responsibilities show up as distinct components?
- Which modules are the hubs (high in-degree in the import graph)?
- Runtime: wrap a worker with `atlas trace -- <cmd>` to see how work moves under load.

## From evidence to findings

The graph and concepts are observations. Write the architectural story in
`findings/architecture/` and cite specific nodes/edges. Record anything the TS-only pipeline
can't resolve in this investigation's `unknowns.md`.
