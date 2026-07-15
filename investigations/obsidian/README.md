# Investigation: Obsidian (local data + plugin + graph case study)

Exercises the parts of Blacklight the code-only targets don't: local application data, a plugin
integration surface, and an inherently graph-shaped domain. See
[`adapters/obsidian`](../../adapters/obsidian) for scope.

## Status

- ⏳ **Not yet analysed.** Two complementary angles, below.

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
