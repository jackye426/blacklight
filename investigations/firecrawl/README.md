# Investigation: Firecrawl (static case study)

A highly practical non-agent system: queues, workers, crawling, scraping engines, browser
isolation, and performance controls. See [`adapters/firecrawl`](../../adapters/firecrawl) for
scope.

## Status

- Complete: Ingested and mapped. Artifacts are in
  [`../firecrawl-firecrawl/`](../firecrawl-firecrawl) (the GitHub target slug): 1631 files,
  1339 graph nodes, 4087 edges, 592 concepts, 1 generated unknown. Source lives only in the
  git-ignored `vendor/` cache, never committed.
- Complete: Manual deep source study. See
  [`../firecrawl-firecrawl/source-study.md`](../firecrawl-firecrawl/source-study.md) and
  [`../../findings/architecture/firecrawl-structure.md`](../../findings/architecture/firecrawl-structure.md).
- Remaining: Runtime study under load. The source structure is understood, but worker timing,
  contention, and real queue behavior still need a trace.

## How it was run

```bash
# Clones into vendor/github/firecrawl__firecrawl (git-ignored), then analyses:
pnpm atlas ingest github:firecrawl/firecrawl
pnpm atlas map    github:firecrawl/firecrawl
```

This wrote `graph.json`, `concepts.json`, `unknowns.md`, and `architecture.md` into
`investigations/firecrawl-firecrawl/`. The manual study then traced the API, stored crawl,
NuQ group, kickoff, scrape job, engine fallback, and crawl-finished flow.

## What we learned

- The queue / worker / crawler responsibilities are distinct: API controllers create crawls and
  kickoff jobs; NuQ workers process kickoff, sitemap, and single-URL jobs; scrape engines and
  transformers live under `scraper/scrapeURL`.
- Firecrawl uses multiple queue mechanisms: BullMQ/Redis side queues, RabbitMQ extraction,
  custom NuQ on Postgres, and a FoundationDB migration path.
- Browser work is isolated in `apps/playwright-service-ts`, reached through
  `PLAYWRIGHT_MICROSERVICE_URL`.

## Next Runtime Question

Wrap a worker with `atlas trace -- <cmd>` to observe timings, contention, lock renewal, and
queue behavior under load. The static source study explains the architecture; runtime tracing
would show its actual operational profile.
