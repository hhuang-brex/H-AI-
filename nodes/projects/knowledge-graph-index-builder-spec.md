---
id: knowledge-graph-index-builder-spec
type: project
kind: spec
tags: [meta, knowledge-graph, tooling, build, index, automation, spec]
related:
  - [[2026-06-11-knowledge-graph-organization-review]]
status: proposal
created: 2026-06-11
summary: Eliminate README index drift by deriving the index, threads rollup, and a graph.json artifact from frontmatter via `tools/build-graph.py`.
---

# Knowledge Graph Index Builder — Spec

## Goal

End README index drift permanently. Every node, every edge, every cluster grouping, and the threads rollup is derived from frontmatter by a single Python script (`tools/build-graph.py`). The frontmatter becomes the single source of truth for the graph structure; the README and `threads/INDEX.md` become regenerated artifacts; `graph.json` lands as a first-class machine-readable export of the graph.

## Non-goals

- No interactive graph viewer. (Possible follow-up; out of scope here.)
- No CI enforcement, no pre-commit hook. The script is run manually (`python tools/build-graph.py`) and prints warnings to stderr without exiting non-zero. Rationale: matches the user's chosen enforcement level; keeps the repo zero-tooling for casual readers.
- No restructuring of the existing folder taxonomy beyond folding `product/` into `nodes/projects/` (covered in Migration).
- No rewrite of body prose. Only frontmatter is normative; bodies stay author-owned.

## Out of scope

- Thread `summary` extraction from body when `summary:` is missing. (Warn-only; do not auto-fill.)
- Multi-language tooling. Python only.
- Rendering on the Jekyll site beyond the regenerated README. The Jekyll build is unchanged.

## What ships

1. `tools/build-graph.py` — the index builder.
2. Updated `AGENTS.md` schema — adds two fields (`kind` for projects, `summary` for all nodes).
3. Migrated content — every project node has `kind`, every node has `summary`, `product/` is folded into `nodes/projects/`, the 6 topic-orphan concepts are linked from their topic.
4. Regenerated `README.md` — generated section between `<!-- BEGIN GENERATED -->` / `<!-- END GENERATED -->` markers.
5. New `threads/INDEX.md` — auto-generated rollup.
6. New `graph.json` at repo root — committed; rebuilt on each script run.

## Architecture

`tools/build-graph.py` is a single-file Python 3 script with no third-party dependencies beyond `PyYAML` (already implicitly used by the inline scripts). Reads from disk, writes to disk, prints warnings to stderr. Exits 0 unconditionally.

### Phases

1. **Discover** — walk `nodes/`, `threads/`, and (during transition) `product/`. Skip `_site/`, `.git/`, files not ending in `.md`, and `README.md` / `AGENTS.md` themselves.
2. **Parse** — split YAML frontmatter from body. Validate required fields per type. Capture `id`, `type`, `kind`, `tags`, `status`, `created`, `summary`, `related`, `source-thread`, plus the H1 title from the body.
3. **Compute clusters** — for each concept node, `clusters = [topic.id for topic in topics if concept.id in topic.related]`. A concept can be multi-cluster.
4. **Validate** — emit warnings (see Warnings section). Never throw or exit non-zero.
5. **Emit** — write `graph.json`, regenerate the README's bracketed section, regenerate `threads/INDEX.md`.

### Schema additions

| Field | Required | Applies to | Purpose |
|---|---|---|---|
| `kind` | yes | `type: project` | One of `spec`, `plan`, `snapshot`, `worked-example`, `product`. Distinguishes the four shapes currently mixed in `nodes/projects/`. Surfaced as group headers in the regenerated README. |
| `summary` | yes (warn-only when missing) | all node types | A `≤200`-character one-line description that appears in every index entry. Stops the README's hand-written taglines from drifting away from the node body. |

`AGENTS.md` is updated to describe both fields and to add `kind` to the type guide table.

### Cluster source of truth

Concepts have no `cluster:` field. A concept's cluster is derived from "which topic nodes list this concept in their `related:`". This means:

- **Topics own their clusters.** Editing a topic's `related:` is how you add/remove concepts from a cluster.
- **Multi-cluster works for free.** A concept linked from two topics appears under both clusters in the regenerated README.
- **Topic-orphan concepts** (in no topic's `related:`) get a stderr warning and appear under a "Concepts — unclustered" tail group so they stay visible.
- **Bidirectional consistency** is checked: if a concept's `related:` lists `topic-X` but `topic-X.related` does not list the concept, that's a `bidirectional-mismatch` warning. Authors can choose whether to add the back-edge or remove the forward one — the script does not auto-fix either side.

### `graph.json` shape

```json
{
  "generated": "2026-06-11",
  "node_count": 79,
  "edge_count": 312,
  "nodes": [
    {
      "id": "forced-tool-call-output",
      "type": "concept",
      "kind": null,
      "path": "nodes/concepts/forced-tool-call-output.md",
      "title": "Forced Tool-Call as Output Channel",
      "summary": "When to force schema vs. let the model write free-text.",
      "tags": ["llm", "output", "schema", "structured-output", "tool-use"],
      "status": "living",
      "created": "2026-06-07",
      "clusters": ["llm-output-design"],
      "source_thread": "2026-06-07-forced-tool-call-fan-out",
      "related": ["llm-output-design", "output-surface-taxonomy", "schema-vs-validator"]
    }
  ],
  "edges": [
    {"from": "forced-tool-call-output", "to": "llm-output-design", "kind": "related"},
    {"from": "sms-message-buffering-spec", "to": "2026-06-10-sms-message-buffering-research", "kind": "source-thread"}
  ]
}
```

`edges[]` carries both `related` and `source-thread` edges with the `kind` field disambiguating. Dangling edges (target id not in `nodes[]`) are still written to the JSON but emit a `dangling-edge` warning.

### Regenerated `README.md` shape

Hand-edited prose at the top (`# H-AI-`, intro paragraph, "Layout") stays untouched. The script regenerates exactly the block between the markers:

```markdown
<!-- BEGIN GENERATED: rebuilt by `python tools/build-graph.py` -->

## Current entry points

### Topics
- [<id>](<path>) — <summary>
…

### Concepts — by topic cluster
**[topic-id](<path>)**
- [<concept-id>](<path>) — <summary>
…

**Concepts — unclustered**
- …  (only if any orphans exist)

### Projects — by kind
**Specs**
- [<id>](<path>) — <summary>
**Plans** … **Snapshots** … **Worked examples** … **Products** …

### References
- [<id>](<path>) — <summary>
…

### Recent threads (10 most recent)
- YYYY-MM-DD · [tag-prefix] [<id>](<path>) — <summary>
See [`threads/INDEX.md`](threads/INDEX.md) for the full archive.

<!-- END GENERATED -->
```

The hand-edited "Why this shape" and "Adding to the graph" sections live below the END marker and are not touched.

### `threads/INDEX.md` shape

Auto-generated. Newest-first chronological list, all threads, with primary-tag prefix:

```markdown
---
title: Threads index
nav_order: 5
---

# Threads — chronological

> Auto-generated by `tools/build-graph.py`. Do not edit by hand.

- 2026-06-11 · [text-eot] [2026-06-11-text-eot-classifier-salvage](2026-06-11-text-eot-classifier-salvage.md) — Text-EOT classifier salvage from a stalled deep-research workflow.
- 2026-06-10 · [sms] [2026-06-10-sms-message-buffering-research](2026-06-10-sms-message-buffering-research.md) — …
…
```

Primary tag selection: first tag that matches a known cluster keyword (`sms`, `eval`, `output-design`, `domain-chatbot`, `task-agent`, `reasoning`, `observability`, `pagination`, `meta`); else `other`. The cluster-keyword list lives in the script as a constant — easy to extend.

## Warnings

All printed to stderr; exit code is always 0. Each warning has a stable token at the front for grep:

| Token | When |
|---|---|
| `WARN orphan-concept` | A `type: concept` node is not in any topic's `related:`. |
| `WARN dangling-edge` | A `[[id]]` reference resolves to no file. |
| `WARN missing-summary` | A node has no `summary:` field. |
| `WARN missing-kind` | A `type: project` node has no `kind:` field. |
| `WARN bidirectional-mismatch` | A `related:` edge appears in only one direction (concept→topic but not topic→concept, or vice versa). |
| `WARN stale-snapshot` | A `status: snapshot` node is older than 365 days. |
| `WARN unknown-kind` | A `type: project` node has a `kind` value outside the allowed set. |
| `WARN unreachable-from-topics` | A non-thread node has no path-of-edges back to any topic. (Topology check; threads are exempt.) |

A successful run with zero warnings prints nothing on stderr and a one-line summary on stdout: `built graph.json (79 nodes, 312 edges); regenerated README.md; regenerated threads/INDEX.md`.

## Migration (one-time)

Performed by hand (with script assistance) before the script is wired into the workflow.

| Step | Detail |
|---|---|
| 1. Add `kind` to `AGENTS.md` schema and type guide | Document the five values; require for `type: project`. |
| 2. Add `summary` to `AGENTS.md` schema | Document the `≤200` char convention; required for all types. |
| 3. Add `kind:` to the 8 existing project nodes | `agent-eval-case-study` → `snapshot`. `agent-eval-improvement-tiers` → `plan`. `dspy-domain-chatbot-cases` → `snapshot`. `sms-message-buffering-plan` → `plan`. `sms-message-buffering-spec` → `spec`. `task-agent-pattern-fanout` → `spec`. `worked-example-anthropic-thinking` → `worked-example`. `worked-example-openai-responses` → `worked-example`. |
| 4. Move `product/spender-agent.md` → `nodes/projects/spender-agent.md` with `kind: product` | Update the file's own `id` if needed (it stays `spender-agent`). Update every relative path in body links of other files that point at `product/spender-agent.md` to point at `nodes/projects/spender-agent.md`. Delete `product/README.md` and the `product/` directory. |
| 5. Backfill `summary:` on every existing node | ~79 nodes. Take from current README description where one exists; otherwise from the first sentence of the body, manually polished. |
| 6. Add 6 orphan concepts to their topic's `related:` | `cot-as-forensic-artifact` → `llm-output-design`. `golden-snapshot-eval` → `llm-evaluation`. `layered-defense-pipeline` → `llm-output-design`. `llm-observability` → `llm-output-design`. `recency-bias-prompt-design` → `domain-chatbot-design`. `template-rendered-output` → `llm-output-design`. Each concept's `related:` also gets the back-edge to keep `bidirectional-mismatch` clean. |
| 7. Add `<!-- BEGIN GENERATED -->` / `<!-- END GENERATED -->` markers to `README.md` | Wrap the existing "Current entry points" section with markers. Initial regeneration replaces this section. |
| 8. Run `python tools/build-graph.py` | Verify zero warnings (or only expected ones). Inspect `graph.json` and the regenerated `README.md`. |

After migration: `nodes/projects/` has 9 nodes (8 existing + spender-agent), `product/` is gone, every node has `summary`, every project has `kind`, no topic-orphan concepts, README index is regenerated.

## Workflow change

When adding or editing a node:

1. Edit the node file (frontmatter + body).
2. Run `python tools/build-graph.py`.
3. Read warnings on stderr; fix anything that surprises you.
4. `git add` the node + `README.md` + `graph.json` + `threads/INDEX.md` + any topic node you also edited.
5. Commit.

The wiki-link-to-markdown body converter (currently inline in commit scripts) stays separate and is run before the index builder. A possible follow-up extracts that converter into `tools/wikilink-to-md.py` for symmetry, but that move is not part of this spec.

## Risks

- **Hand-edits inside the GENERATED block silently lost on next run.** Mitigation: the marker comment explicitly says "rebuilt by `tools/build-graph.py`"; warnings include a final-line summary so the author sees the diff.
- **`summary:` backfill is tedious.** ~79 nodes, but only a one-line edit each. Doable in one sitting.
- **`kind` taxonomy may need a sixth value later.** When it does, add it to the allowed set and the README group order in one commit. Cheap.
- **Cluster-derivation surprises authors who edited a concept but not the topic.** The `bidirectional-mismatch` warning catches the common case (concept claims topic in `related` but topic doesn't list concept). The reverse case (topic lists concept in `related` but concept doesn't list topic) is also flagged.
- **`graph.json` churn in commits.** Every node edit will dirty `graph.json`. This is a feature: the commit log preserves the graph evolution. Reviewers can `git log -p graph.json` to see the structural delta separately from prose changes.

## Success criteria

- `python tools/build-graph.py` produces a `graph.json` whose `node_count` matches `find nodes threads -name '*.md' | wc -l`.
- The 8 README drift findings (3 missing projects, 3 missing threads, 2 duplicates) are gone after a single script run.
- A new node added to `nodes/concepts/foo.md` with proper frontmatter appears in the regenerated README under the right cluster after one script run, with no manual README edit.
- The script's stderr is empty in a clean state, and any warning the script does emit corresponds to a real, fixable issue in the repo.

## Cross-links

- [2026-06-11-knowledge-graph-organization-review](../../threads/2026-06-11-knowledge-graph-organization-review.md) — the review thread that surfaced the audit findings driving this spec.
- The script reads node files of every existing type; see `AGENTS.md` for the canonical schema.
