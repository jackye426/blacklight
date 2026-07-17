# Obsidian Plugin Static Structure

**Kind:** inference
**Evidence:** `investigations/obsidianmd-obsidian-sample-plugin/architecture.md` and
`investigations/obsidianmd-obsidian-sample-plugin/concepts.json`.

Blacklight's V1 ingest of `github:obsidianmd/obsidian-sample-plugin` confirms that Obsidian
plugin source is a good fit for the current TypeScript pipeline. The sample plugin scan
recorded 19 files, 10 graph nodes, 10 edges, and 3 concepts.

The extracted concepts match the expected plugin shape: `MyPlugin` in `src/main.ts`,
`MyPluginSettings` in `src/settings.ts`, and `SampleSettingTab` in `src/settings.ts`. That is
enough for V1 to identify the plugin class and settings surface, even though the generated
component graph is intentionally small.

This does not cover installed vault analysis. A real vault needs an Obsidian-specific adapter
that inventories `.obsidian/` configuration, community plugin state, per-plugin data files,
and markdown note links. The plugin-source case study proves the code side is reachable now;
the vault graph remains a separate Phase 2-style adapter problem.
