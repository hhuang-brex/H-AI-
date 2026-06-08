# H-AI-

> Hai's knowledge graph. Every file is one node. Every `[[wiki-link]]` is one edge.

A working knowledge base that is **readable for humans** (browse the markdown) and **parseable for agents** (YAML frontmatter, stable IDs, predictable folders). Designed to grow into a navigable graph rather than a pile of notes.

## Layout

```
H-AI-/
├── README.md              ← you are here
├── AGENTS.md              ← contract for agents adding/editing nodes
├── nodes/
│   ├── topics/            ← broad areas; entry points (e.g. llm-evaluation)
│   ├── concepts/          ← reusable patterns/ideas (e.g. llm-as-judge)
│   ├── projects/          ← project-specific snapshots (e.g. agent-eval-case-study)
│   └── references/        ← external posts/papers reading lists
└── threads/               ← time-stamped conversation summaries
```

## Node anatomy

Each node is one markdown file with this frontmatter:

```yaml
---
id: kebab-case-slug          # also the filename
type: topic | concept | project | reference | thread
tags: [...]
related:
  - [[other-node-id]]
status: living | snapshot | proposal | archived
created: YYYY-MM-DD
---
```

The body is human-readable markdown. Use `[[node-id]]` to link. Dangling links are fine — they mark intent.

## Current entry points

### Topics
- [[llm-evaluation]] — measuring whether LLM systems do what they should without bankrupting the team.
- [[llm-output-design]] — how an LLM emits to the world; per-surface decisions.
- [[domain-chatbot-design]] — how a chatbot converses inside a specific domain.

### Concepts — Eval
- [[test-pyramid-llm]] — porting the classic pyramid to LLM apps.
- [[llm-as-judge]] — calibration, bias, multi-vote, cascading.
- [[prod-shadow-replay]] — closing the gap between frozen datasets and live traffic.
- [[cost-aware-eval]] — sample-size math and budget assertions.
- [[agent-trajectory-eval]] — multi-turn, tool sequences, end-state.
- [[golden-snapshot-eval]] — pre-LLM deterministic checks.
- [[adversarial-eval]] — red-team / safety / prompt injection.

### Concepts — Output Design
- [[forced-tool-call-output]] — when to force schema vs. let the model write free-text.
- [[output-surface-taxonomy]] — classify each surface explicitly; per-surface decisions.
- [[schema-vs-validator]] — schema-enforced output vs. free-text + post-hoc validator.
- [[streaming-vs-structured]] — token-by-token UX vs. structured output trade-off.
- [[hard-surface-irrevocability]] — irrevocable output channels as a first-class category.

### Concepts — Domain Chatbot Conversation Design
- [[intent-and-disambiguation]] — turning ambiguous input into actionable intent; clarification vs. assumption.
- [[grounding-and-citation]] — anchoring claims in domain sources; refusal as the right answer.
- [[action-authority]] — what the bot can *do*; tiered authority enforced at the tool layer.
- [[escalation-handoff]] — when and how to hand off to a human; preserving context.
- [[scope-and-refusal]] — in-domain vs. out-of-domain; three kinds of refusal.
- [[conversation-memory]] — three horizons; what to remember, what not to.
- [[domain-knowledge-injection]] — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [[persona-tone-compliance]] — voice as a constraint set, not a style preference.
- [[repair-and-clarification]] — recovery turns are not initial turns.
- [[turn-taking-and-proactivity]] — initiative, long operations, closing.
- [[safety-rails-domain-specific]] — generic safety is the baseline, not the answer.

### Projects
- [[agent-eval-case-study]] — generalized agent platform eval system (2026-06-05 snapshot).
- [[agent-eval-improvement-tiers]] — ranked improvement plan for the case study above.

### References
- [[references-eval-reading-list]] — frontier-lab + practitioner posts (Anthropic, OpenAI, Husain, Yan, Carter, Shankar, …).

### Threads
- [[2026-06-05-eval-analysis]] — origin of the eval nodes.
- [[2026-06-07-forced-tool-call-fan-out]] — origin of the output-design nodes.
- [[2026-06-08-domain-chatbot-fan-out]] — origin of the conversation-design nodes.

## Why this shape

- **One concept per file** — cheap to link, cheap to refactor.
- **Frontmatter** — agents can index without parsing prose.
- **Wiki-links** — work in Obsidian, Foam, Logseq, GitHub preview (with extensions), and any custom static-site generator.
- **Folder = type, not topic** — topics are themselves nodes; folders prevent the "where does this live?" debate.

## Adding to the graph

Read [`AGENTS.md`](./AGENTS.md). The short version:

1. Pick the right folder by *type* (topic/concept/project/reference/thread).
2. Use `kebab-case-slug.md`. The filename is the `id`.
3. Frontmatter required. `related:` links liberally.
4. Body is markdown; complete sentences; link with `[[id]]`.
5. Update this README's index when adding a new node.
