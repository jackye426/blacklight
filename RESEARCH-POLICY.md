# Research Policy

Blacklight examines other people's software. Two rules keep that honest and lawful.

## 1. Observation vs. inference

Blacklight must never treat an inference as an observed fact. This is enforced structurally,
not by convention alone:

- **`investigations/`** holds experiments and **evidence** — things we directly observed:
  files that exist, imports that resolve, commands that ran, exit codes, trace events.
- **`findings/`** holds **conclusions** — things we inferred, argued, or generalised.

Every node and edge in a knowledge graph, and every finding, carries an explicit tag:

| Tag           | Meaning                                                        |
| ------------- | ------------------------------------------------------------- |
| `observation` | Directly captured from the target (AST, filesystem, a trace). |
| `inference`   | Derived by reasoning; may be wrong.                           |

Each also carries **provenance** — where it came from (a file path + range, a trace event id,
or a cited external document). If we cannot point at a source, it is an `inference`, and it
belongs in `findings/`, never in `investigations/`.

When the truth is unknown, it goes in `unknowns.md`. Guessing to fill a gap is a policy
violation; recording the gap is the correct behaviour.

## 2. Intellectual property

We study systems; we do not redistribute them.

- **Do not commit third-party source code** into this repository — not vendored copies, not
  leaked snapshots, not mirrors. Anthropic (and every other vendor) retains the IP in their
  code.
- Source we need to analyse is fetched into `vendor/`, which is **git-ignored**. It is a local
  cache, never part of our history.
- What we *do* commit: our own **observations** (with file-path references, not the files
  themselves), diagrams, measurements, experiment configurations, runtime traces we generated,
  and **independently written explanations**.
- External sources (papers, official docs) are **cited**, not copied.

### Specifically re: Claude Code

Publicly discussed snapshots and academic analyses of specific Claude Code versions exist. We
may reference and cite them, and we may reason about them. We may **not** copy their source
into this repo. Our Claude Code architecture dossier is built from:

1. Official documentation (hooks, Agent SDK, OpenTelemetry monitoring),
2. Runtime traces **we** generate against a locally installed Claude Code, and
3. Our own independently written analysis, citing external work where it informs us.

We can get close to a comprehensive understanding of the Claude Code *local harness*. We do
not, and cannot, obtain Claude's weights, training data, or Anthropic's production stack — and
we will not represent otherwise.
