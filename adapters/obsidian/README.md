# adapter-obsidian (stub)

**Status:** planned. No code in V1 — this file records scope and approach.

## Why Obsidian

Obsidian exercises parts of Blacklight the code-only targets don't: **local application data**,
a **plugin integration surface**, and an inherently **graph-shaped** domain. It is a good test
of the engine beyond "chat with a repo".

## Planned approach

1. **Plugin source.** Obsidian plugins are TypeScript — resolve one with `adapter-local-repo`
   or `adapter-github` and `atlas ingest` it directly. This maps the plugin API surface with
   the existing pipeline, no new code required.
2. **Installed workspace.** Point at an actual vault and analyse its data layout: `.obsidian/`
   config, `community-plugins.json`, per-plugin `data.json`, and the note/link structure.
3. **Graph mapping.** Obsidian's note-link graph maps naturally onto Blacklight's
   `knowledge-graph` (notes as nodes, links as edges), letting us reuse the graph renderer.

## What this adapter will add

A resolver/reader for a vault directory that emits notes-and-links as graph nodes/edges (all
observations, with each note/link citing its file), plus config/plugin inventory extraction.
