# Investigation: Obsidian (local data + plugin + graph case study)

Exercises the parts of Blacklight the code-only targets don't: local application data, a plugin
integration surface, and an inherently graph-shaped domain. See
[`adapters/obsidian`](../../adapters/obsidian) for scope.

## Status

- ✅ **Plugin source analysed.** The official sample plugin was ingested as the V1-compatible
  TypeScript plugin case study and writes to
  [`../obsidianmd-obsidian-sample-plugin`](../obsidianmd-obsidian-sample-plugin).
- ⏳ **Installed vault analysis remains future work.** It needs the planned Obsidian adapter
  rather than the generic TS/JS static pipeline.

## How to run it

**Plugin source (works with the V1 pipeline today):**

```bash
# Any Obsidian plugin is TypeScript — ingest it directly:
pnpm atlas ingest github:<owner>/<obsidian-plugin>
pnpm atlas map    github:<owner>/<obsidian-plugin>
```

**Installed vault (needs the planned obsidian adapter):**

- Point at a real vault directory and inventory `.obsidian/` config,
  `community-plugins.json`, and per-plugin `data.json`.
- Map the note-link graph onto Blacklight's `knowledge-graph` (notes as nodes, links as edges).

## What to look for

- The plugin API surface (which Obsidian APIs a plugin actually touches).
- How vault data is laid out and versioned.
- Whether the note-link graph reuses the existing graph renderer cleanly.

## From evidence to findings

Plugin structure and vault layout are observations; the story of "how Obsidian represents
knowledge" is a finding — write it in `findings/architecture/` with citations.

## Result

- Plugin source: `github:obsidianmd/obsidian-sample-plugin`
- Files scanned: 19
- Graph: 10 nodes, 10 edges
- Concepts: 3
- Architecture skeleton:
  [`../obsidianmd-obsidian-sample-plugin/architecture.md`](../obsidianmd-obsidian-sample-plugin/architecture.md)
- Finding:
  [`../../findings/architecture/obsidian-plugin-structure.md`](../../findings/architecture/obsidian-plugin-structure.md)
