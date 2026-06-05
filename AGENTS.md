# AGENTS.md

Contract for any agent (or human) adding to this knowledge graph. Following this keeps the repo machine-parseable and the graph navigable.

## Core invariants

1. **One concept per file.** If a node tries to explain two things, split it.
2. **Frontmatter is mandatory** and must validate against the schema below.
3. **`id` equals the filename** (without `.md`). Both are `kebab-case`.
4. **Folder is determined by `type`**, not by topic.
5. **`related:` links liberally.** A `[[name]]` that doesn't yet resolve is fine — it marks intent for a future node, not an error.

## Frontmatter schema

```yaml
---
id: kebab-case-slug                    # required; matches filename
type: topic | concept | project | reference | thread   # required
tags: [string, ...]                    # required; lowercase, kebab-case
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
| `project` | `nodes/projects/` | Project-specific snapshot or plan | What it is → current state → known issues → see-also. |
| `reference` | `nodes/references/` | External posts/papers reading list | Annotated link list. |
| `thread` | `threads/` | Conversation summary, dated `YYYY-MM-DD-slug.md` | Goal → outputs → key insights. |

### Status guide

- `living` — actively maintained; expected to evolve.
- `snapshot` — accurate as of `created`; future readers should treat it as point-in-time.
- `proposal` — recommendation/plan, not yet decided.
- `archived` — historical; do not edit.

## Linking conventions

- Use `[[id]]` for internal links. The renderer (Obsidian/Foam/static-site) resolves them.
- Prefer many small links over one mega-link. The graph is more useful when edges are specific.
- Do **not** use absolute paths (`./nodes/...`) — that breaks portability between renderers.
- External URLs go inline in the body or in a `references` node.

## Style

- Complete sentences. Skip hedging.
- Tables, not bullet-lists, when comparing > 2 dimensions.
- Code blocks for any structure (YAML, ASCII diagrams, command output).
- Keep nodes under ~150 lines; if longer, split.
- Convert relative dates to absolute (`2026-06-05`, not "yesterday").

## Workflow for adding a node

1. Decide `type`. Pick the folder.
2. Choose `id` — kebab-case, distinctive enough to be globally unique.
3. Write frontmatter first; let it force you to commit to type/tags/relations.
4. Draft body. Cross-link aggressively, including to nodes you intend to write later.
5. Update `README.md`'s index.
6. If the node was derived from a conversation, also create or update a `thread` node and set `source-thread:`.

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
