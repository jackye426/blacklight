# Codex Static Structure

**Kind:** inference
**Evidence:** `investigations/openai-codex/architecture.md`,
`investigations/openai-codex/concepts.json`, and
`investigations/openai-codex/unknowns.md`.

Blacklight's V1 ingest of `github:openai/codex` produced a useful but intentionally partial
map. The generated architecture skeleton records 5,480 scanned files, 1,140 graph nodes,
2,713 edges, and 660 extracted concepts. The mapped components are mostly the TypeScript and
JavaScript-facing surfaces: `codex-cli`, `sdk/typescript`, and generated TypeScript schema
files under `codex-rs`.

The most important finding is negative: this is not a complete Codex architecture map. The
cached source tree contains 2,604 `.rs` files and 632 `.ts` files, while V1 semantic analysis
is TS/JS-only. That means Rust files are present in the file inventory but their imports,
types, calls, and module boundaries are not structurally understood. Any statement about the
Rust core belongs in `unknowns.md` until a Rust/tree-sitter adapter exists.

The static result still has value. It identifies the TypeScript SDK entry surface, including
the observed `Codex` class in `sdk/typescript/src/codex.ts`, and it shows where generated
TypeScript protocol/schema artifacts sit under the broader repository. For the Step 10 case
study, Codex is therefore best treated as the example that proves Blacklight's coverage
accounting matters: the tool can ingest the repository, but it must also say plainly what it
does not yet understand.
