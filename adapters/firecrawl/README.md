# adapter-firecrawl (stub)

**Status:** planned. No code in V1 — this file records scope and approach.

## Why Firecrawl

Firecrawl is a highly practical **non-agent** system: queues, workers, crawling, and real
performance concerns. It tests whether Blacklight's model generalises past AI harnesses to
ordinary production software — and it is a strong early static-analysis case study because it
is TypeScript-heavy.

## Planned approach

1. **Static (works today).** Resolve with `adapter-github`, then `atlas ingest` + `atlas map`.
   The ts-morph pipeline recovers modules, the queue/worker/crawler components, and their
   dependencies with no new code. This is the first non-Blacklight static case study
   (`investigations/firecrawl/`).
2. **Runtime.** Wrap a worker or the API with `atlas trace` to capture process behaviour, and
   study how work moves through the queues under load.

## What this adapter will add

Convenience for locating Firecrawl's services (API, worker, queue) as named components, and any
queue/worker telemetry normalisation into the shared `TraceEvent` shape for the runtime view.
