---
title: AGENTS contract
nav_order: 99
---

# AGENTS.md

Contract for any agent (or human) adding to this knowledge graph. Following this keeps the repo machine-parseable and the graph navigable.

## Scope

This graph captures the engineering and science of **building domain-specific task agents that converse** — systems that feel like a chatbot to the user (SMS, chat, voice) but are, underneath, a decision engine that takes actions in a domain. The canonical example is an executive-assistant-class agent: it talks, but its value is doing the work (scheduling, triage, documentation), not the conversation itself.

In scope: the agent runtime (control loop, tools, planning, context, memory, persistence), output discipline (forced tool-call, template rendering, validators), conversation design, evaluation, and the production concerns that make these shippable (execution safety, observability, human-in-the-loop). Out of scope: general ML training, model internals, and anything not in service of building such an agent.

Each node is an **engineering distillation** — a reusable decision with its failure modes and trade-offs — not a paper summary or a vendor explainer. When a node makes an empirical or product claim, it must be grounded per the evidence standard below.

## Core invariants

1. **One concept per file.** If a node tries to explain two things, split it.
2. **Frontmatter is mandatory** and must validate against the schema below.
3. **`id` equals the filename** (without `.md`). Both are `kebab-case`.
4. **Folder is determined by `type`**, not by topic.
5. **`related:` links liberally** in frontmatter using `[[id]]` form. A name that doesn't yet resolve is fine — it marks intent for a future node, not an error.
6. **Body links use standard markdown** — `[id](relative/path.md)` — so they navigate on github.com without an extension.

## Frontmatter schema

```yaml
---
id: kebab-case-slug                    # required; matches filename
type: topic | concept | project | reference | thread   # required
kind: spec | plan | snapshot | worked-example | product   # required when type: project
tags: [string, ...]                    # required; lowercase, kebab-case
summary: <one-line ≤200 chars>         # required; the index entry's description
related:                               # required (may be empty)
  - [[other-node-id]]
status: living | snapshot | proposal | archived  # required
created: YYYY-MM-DD                    # required
source-thread: [[thread-id]]           # optional; for nodes derived from a thread
---
```

### Type guide

| Type | Folder | Use for | Body shape |
|---|---|---|---|
| `topic` | `nodes/topics/` | Broad area; entry point that fans out | Short — links + one-paragraph framing. |
| `concept` | `nodes/concepts/` | Reusable pattern, idea, technique | Definition → mechanics → pitfalls → references. |
| `project` | `nodes/projects/` | Project-specific snapshot, spec, plan, worked example, or product spec | Distinguished by the `kind` field. Body shape varies by kind — see below. |
| `reference` | `nodes/references/` | External posts/papers reading list | Annotated link list. |
| `thread` | `threads/` | Conversation summary, dated `YYYY-MM-DD-slug.md` | Goal → outputs → key insights. |

### `kind` (projects only)

| Kind | Use for | Body shape |
|---|---|---|
| `spec` | Design intent for a specific system | Goal → non-goals → architecture → migration → success criteria. |
| `plan` | Sequenced implementation of a spec | Tasks with steps, files, commits. |
| `snapshot` | Point-in-time state of a real system | What it is → current state → known issues → see-also. |
| `worked-example` | Code walkthrough with primary-source fidelity | Setup → annotated code → why it works → caveats. |
| `product` | End-to-end product spec synthesized from threads | Problem → architecture → workflow → tradeoffs. |

### `summary`

A single line, ≤200 characters. Appears next to every node link in `README.md` and `threads/INDEX.md`. Keep it concrete: what is this node *for*? Avoid restating the title.

### Status guide

- `living` — actively maintained; expected to evolve.
- `snapshot` — accurate as of `created`; future readers should treat it as point-in-time.
- `proposal` — recommendation/plan, not yet decided.
- `archived` — historical; do not edit.

## Evidence standard

The graph's authority depends on every external claim being checkable. This is non-negotiable:

- **Never write a URL, paper title, author, or version from memory.** Fetch it first and confirm it resolves. An unverified citation is worse than none — it launders a guess as a fact.
- **Mark verification.** A `reference` node states when its links were last fetch-confirmed (e.g. "verified 2026-06-13"). Vendor docs are living pages; date them.
- **Separate mechanism from outcome.** "Architecture X works this way" (often verifiable from docs) is a different claim from "X delivered Y in production" (usually a vendor's self-report). Label self-reported metrics as such; don't present them as measured fact.
- **Record what failed to verify.** If a claim couldn't be confirmed — or was refuted — say so in the node. A documented negative result is a finding, not a gap to paper over.
- **Distinguish the graph's own reasoning from cited sources.** Engineering distillations are the author's synthesis; where they diverge from a cited paper, name the divergence rather than implying the source said it.

## Linking conventions

Two link forms with different purposes — both supported, used in different places:

| Where | Form | Purpose |
|---|---|---|
| Frontmatter `related:` | `[[id]]` (wiki-link) | Machine-readable edge list. Stable across folder moves; graph indexers consume this. |
| Frontmatter `source-thread:` | `[[id]]` | Same — edge list. |
| Body prose | `[id](relative/path.md)` (markdown link) | Navigable on github.com directly. No Obsidian/Foam extension required. |

Rules:

- **Prefer many small links over one mega-link.** The graph is more useful when edges are specific.
- **Use the visible label = the node `id`** in body links unless the surrounding sentence requires a different surface form. Keeps the graph readable.
- **Do not use absolute paths** (`/nodes/...`) — relative paths only.
- **External URLs** go inline in body, or in a `references`-type node.
- **Dangling links** are intentional in `related:` (mark intent for a future node). In the body, link only to nodes that exist; if you mean to point at a node you'll write later, add it to `related:` instead and revisit when the node lands.

## Style

- Complete sentences. Skip hedging.
- Tables, not bullet-lists, when comparing > 2 dimensions.
- Code blocks for any structure (YAML, ASCII diagrams, command output).
- Keep nodes under ~150 lines; if longer, split.
- Convert relative dates to absolute (`2026-06-05`, not "yesterday").

## Workflow for adding a node

1. Decide `type` (and `kind` if `type: project`). Pick the folder.
2. Choose `id` — kebab-case, distinctive enough to be globally unique.
3. Write frontmatter first (including `summary`); let it force you to commit to type/tags/relations. Use `[[id]]` form in `related:`.
4. Draft body. Cross-link aggressively to existing nodes using `[id](relative/path.md)` markdown links.
5. Run `/usr/bin/python3 tools/build-graph.py` — regenerates the README index, `threads/INDEX.md`, and `graph.json`. Read the warnings on stderr; fix anything surprising.
6. If the node was derived from a conversation, also create or update a `thread` node and set `source-thread:`.
7. `git add` your node + the regenerated artifacts (`README.md`, `graph.json`, `threads/INDEX.md`). Commit.

## Workflow for editing a node

- Bug-fix or expansion: edit in place; keep `created`.
- Significant scope change: archive the old (`status: archived`) and create a new node with a new `id`.
- Never silently change a `snapshot` — supersede it.

## What does **not** belong here

- Secrets, tokens, internal Brex IDs that can't be cited externally.
- Code snippets long enough to belong in a real repo — link instead.
- Conversational scaffolding ("as we discussed…"). Capture the conclusion, not the process.

## Optional: extending the schema

If a new field is needed across many nodes, add it here first. The frontmatter is the source of truth for what an agent can rely on.
