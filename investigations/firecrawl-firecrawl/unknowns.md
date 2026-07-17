# Unknowns - firecrawl/firecrawl

These are things Blacklight could not determine or has not yet observed. They are recorded,
never guessed. See `RESEARCH-POLICY.md`.

## Generated Static-Analysis Unknown

- Unresolved relative import `./index.css` in `apps/ui/ingestion-ui/src/main.tsx`.
  - The specifier looks internal but did not resolve to a file in the target. This appears to
    be a CSS asset resolver limitation, not an architecture gap.

## Remaining Manual-Study Unknowns

- Runtime behavior under load is still untraced.
  - The manual source study identified the API -> stored crawl -> NuQ group -> kickoff ->
    scrape jobs -> engine fallback -> crawl-finished flow, but did not measure timing,
    contention, lock renewal, backlog behavior, or worker resource gating in a live run.

- FoundationDB NuQ behavior was read from source but not exercised.
  - The source includes routing and FDB queue code, but no local FDB-backed worker run was
    performed.

- Hosted Fire Engine behavior remains partially opaque.
  - The source references Fire Engine CDP/TLS routes and hosted services. Self-host docs say
    advanced Fire Engine capabilities are limited outside hosted deployments.

- Cloud integrations were not validated.
  - Billing, Supabase/ACUC flags, GCS result storage, webhooks, and hosted index behavior were
    inspected from source paths only.
