# Firecrawl — first-pass structure

> **`findings/` document: contains inferences.** Grounded in observations from
> `investigations/firecrawl-firecrawl/` (`graph.json`, `architecture.md`), produced by
> `atlas ingest github:firecrawl/firecrawl`. No Firecrawl source is copied here.

## What we observed

`[observation]` (graph.json) — Firecrawl is a monorepo of 10 components. The dominant one is
`apps/api` (~700 files); the rest are satellites: `apps/js-sdk`, `apps/playwright-service-ts`,
`apps/test-suite`, `apps/test-site`, `apps/ui/ingestion-ui`, plus a native subtree and examples.

`[observation]` (import in-degree, graph.json) — the most-imported modules inside `apps/api`:

| In-degree | Module |
| --- | --- |
| 211 | `apps/api/src/config.ts` |
| 193 | `apps/api/src/lib/logger.ts` |
| 111 | `apps/api/src/controllers/v2/types.ts` |
| 75 | `apps/api/src/controllers/v1/types.ts` |
| 54 | `apps/api/src/scraper/scrapeURL/index.ts` |
| 48 | `apps/api/src/db/connection.ts` |
| 48 | `apps/api/src/db/schema/index.ts` |

## What we infer

`[infer]` The API service is the system's centre of gravity; the SDK, browser (playwright)
service, and test harnesses orbit it. The hubs are the expected cross-cutting concerns —
configuration and logging are imported almost everywhere — with `controllers/v{1,2}/types.ts`
indicating a **versioned API surface** where shared request/response types are a load-bearing
dependency. The `scraper/scrapeURL` index and the `db/` connection+schema being top hubs point
to the two core domains: **scraping** and **persistence**.

`[infer]` This matches the "queues, workers, crawling" description from the adapter scope, but
we have **not** yet confirmed the queue/worker runtime shape statically — that needs a runtime
trace (wrap a worker with `atlas trace`). Recorded as pending.

## Open questions

- Where do the queue and worker entry points live, and how does work flow API → queue → worker?
  (Needs runtime tracing, not just imports.)
- One unresolved import was recorded (`./index.css` in the ingestion UI) — a CSS asset ts-morph
  does not resolve; harmless, but see `unknowns.md`.

_Evidence: [`../../investigations/firecrawl-firecrawl/`](../../investigations/firecrawl-firecrawl)._
