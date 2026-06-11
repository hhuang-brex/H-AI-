---
id: 2026-06-11-knowledge-graph-organization-review
type: thread
tags: [meta, knowledge-graph, organization, audit, tooling, build, thread]
related:
  - [[knowledge-graph-index-builder-spec]]
status: archived
created: 2026-06-11
summary: "audit of this repo as a knowledge graph; origin of the index-builder spec."
---

# Thread — Knowledge Graph Organization Review (2026-06-11)

Conversation goal: review the H-AI- repo and propose a better organization for both human readers and agent ingestion. Treat the repo as a knowledge graph and surface what's working and what's drifting.

## Method

Used the `superpowers:brainstorming` skill end-to-end:

1. Audit-style exploration first (the user asked for a third-party diagnosis, not a tweak).
2. One clarifying question per turn to pin down scope (cluster source, projects/ shape, enforcement).
3. Three approaches presented (Tighten / Automate / Visualize); user picked Automate.
4. Design walked section by section; user gave standing authorization to proceed without further gates.
5. Spec written to [knowledge-graph-index-builder-spec](../nodes/projects/knowledge-graph-index-builder-spec.md).

## Audit findings

Eight concrete issues, ranked by severity:

| # | Finding | Evidence |
|---|---|---|
| 1 | README index drift is real, not hypothetical | 3 project nodes (`sms-message-buffering-plan`, `sms-message-buffering-spec`, `task-agent-pattern-fanout`) and 3 thread nodes (the entire SMS-buffering + text-EOT arc) missing from README. `spender-agent` listed twice. One thread listed twice. |
| 2 | Topic-orphan concepts | 6 of 43 concepts have no topic linking to them in frontmatter `related:` — `cot-as-forensic-artifact`, `golden-snapshot-eval`, `layered-defense-pipeline`, `llm-observability`, `recency-bias-prompt-design`, `template-rendered-output`. Visible in README clusters but invisible to topic-frontmatter traversal. |
| 3 | `status:` field is decorative | 43/43 concepts = `living`. 17/17 threads = `archived`. Two of four allowed values cover 95% of nodes. Field can't filter for stale. |
| 4 | `projects/` is overloaded | 8 files mix snapshots, specs, plans, proposals, worked-examples with no convention to scan-distinguish them. |
| 5 | `product/` is off-pattern | 1 file in a top-level folder outside `nodes/`. Breaks the AGENTS.md "folder = type" rule. `spender-agent` listed in two README sections. |
| 6 | `references/` is underused | 3 entries. Most reading lists are inline inside spec bodies. |
| 7 | No machine graph index | Edge list exists in frontmatter but no `graph.json`. Every agent ingestion re-walks all files and re-parses YAML. |
| 8 | Concept clusters live only in README headers | 43 concepts in a flat folder; cluster grouping ("Eval", "Output Design", etc.) is README prose, not structured data. |

## Approaches considered

| Approach | What | Trade-off |
|---|---|---|
| **A — Tighten** | Hand-fix the drift, add `kind:`, move `product/`, manual ongoing maintenance. | Smallest change. Drift will recur in 2 months. |
| **B — Automate (chosen)** | `tools/build-graph.py` derives README index, `threads/INDEX.md`, and `graph.json` from frontmatter. Manual run, warnings only. | Adds one script. Cures drift permanently. Frontmatter becomes single source of truth. |
| **C — Visualize** | B + interactive Cytoscape/D3 graph viewer on the rendered Jekyll site. | Real value for browsing. Defer until B is in place and reliable. |

## Key design decisions (from clarifying questions)

- **Cluster source of truth: topic edges.** A concept's cluster is back-derived from "which topic nodes list this concept in their `related:`". No new `cluster:` field. Multi-cluster works for free.
- **`projects/` shape: add `kind:` field.** Values: `spec | plan | snapshot | worked-example | product`. Fold `product/spender-agent.md` into `nodes/projects/` with `kind: product`. Restores the folder-equals-type invariant.
- **Enforcement: manual, warnings only.** `python tools/build-graph.py` prints warnings to stderr and exits 0. No hooks, no CI. Matches user's preference for low-friction tooling.

## Outputs

- [knowledge-graph-index-builder-spec](../nodes/projects/knowledge-graph-index-builder-spec.md) — the full spec.
- An implementation plan to follow (writing-plans phase).

## Connection to existing graph

This is the first `meta`-tagged thread — the graph reflecting on its own structure. The spec it produced is itself a node in the graph it describes; the script, once built, will treat both files like any other.

## Open follow-ups

- **Approach C (interactive viewer)** — promote when B is shipped and the index is trusted. Cytoscape.js reading `graph.json`; deep-link from each node page.
- **Extract the inline wiki-link-to-markdown converter** into `tools/wikilink-to-md.py` for symmetry with `build-graph.py`. Not in this spec; cheap follow-up.
- **A `meta` topic node** — once meta-tagged threads accumulate, they could front a topic. Not warranted yet (one entry).
- **`status:` semantic refresh** — the field is currently decorative. A future spec could redefine it (e.g., `living` / `frozen` / `superseded` with concrete review cadences) and have `build-graph.py` enforce review intervals.
