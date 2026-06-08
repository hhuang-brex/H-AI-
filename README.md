# H-AI-

> Hai's knowledge graph. Every file is one node. Every link is one edge.

A working knowledge base that is **readable for humans** (browse the markdown on github.com or any renderer) and **parseable for agents** (YAML frontmatter, stable IDs, predictable folders). Designed to grow into a navigable graph rather than a pile of notes.

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
  - [[other-node-id]]         # wiki-link form: machine-readable edge list
status: living | snapshot | proposal | archived
created: YYYY-MM-DD
---
```

The body is human-readable markdown. Frontmatter `related:` keeps the wiki-link form (`[[id]]`) for graph indexers; **the body uses standard markdown links** (`[id](relative/path.md)`) so navigation works on github.com without extensions. Dangling links are fine — they mark intent.

## Current entry points

### Topics
- [llm-evaluation](nodes/topics/llm-evaluation.md) — measuring whether LLM systems do what they should without bankrupting the team.
- [llm-output-design](nodes/topics/llm-output-design.md) — how an LLM emits to the world; per-surface decisions.
- [domain-chatbot-design](nodes/topics/domain-chatbot-design.md) — how a chatbot converses inside a specific domain.
- [sms-multi-thread-chatbot](nodes/topics/sms-multi-thread-chatbot.md) — multi-thread chatbot design when the only channel is flat SMS.

### Concepts — Eval
- [test-pyramid-llm](nodes/concepts/test-pyramid-llm.md) — porting the classic pyramid to LLM apps.
- [llm-as-judge](nodes/concepts/llm-as-judge.md) — calibration, bias, multi-vote, cascading.
- [prod-shadow-replay](nodes/concepts/prod-shadow-replay.md) — closing the gap between frozen datasets and live traffic.
- [cost-aware-eval](nodes/concepts/cost-aware-eval.md) — sample-size math and budget assertions.
- [agent-trajectory-eval](nodes/concepts/agent-trajectory-eval.md) — multi-turn, tool sequences, end-state.
- [golden-snapshot-eval](nodes/concepts/golden-snapshot-eval.md) — pre-LLM deterministic checks.
- [adversarial-eval](nodes/concepts/adversarial-eval.md) — red-team / safety / prompt injection.

### Concepts — Output Design
- [forced-tool-call-output](nodes/concepts/forced-tool-call-output.md) — when to force schema vs. let the model write free-text.
- [output-surface-taxonomy](nodes/concepts/output-surface-taxonomy.md) — classify each surface explicitly; per-surface decisions.
- [schema-vs-validator](nodes/concepts/schema-vs-validator.md) — schema-enforced output vs. free-text + post-hoc validator.
- [streaming-vs-structured](nodes/concepts/streaming-vs-structured.md) — token-by-token UX vs. structured output trade-off.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.

### Concepts — Domain Chatbot Conversation Design
- [intent-and-disambiguation](nodes/concepts/intent-and-disambiguation.md) — turning ambiguous input into actionable intent; clarification vs. assumption.
- [grounding-and-citation](nodes/concepts/grounding-and-citation.md) — anchoring claims in domain sources; refusal as the right answer.
- [action-authority](nodes/concepts/action-authority.md) — what the bot can *do*; tiered authority enforced at the tool layer.
- [escalation-handoff](nodes/concepts/escalation-handoff.md) — when and how to hand off to a human; preserving context.
- [scope-and-refusal](nodes/concepts/scope-and-refusal.md) — in-domain vs. out-of-domain; three kinds of refusal.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [domain-knowledge-injection](nodes/concepts/domain-knowledge-injection.md) — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [persona-tone-compliance](nodes/concepts/persona-tone-compliance.md) — voice as a constraint set, not a style preference.
- [repair-and-clarification](nodes/concepts/repair-and-clarification.md) — recovery turns are not initial turns.
- [turn-taking-and-proactivity](nodes/concepts/turn-taking-and-proactivity.md) — initiative, long operations, closing.
- [safety-rails-domain-specific](nodes/concepts/safety-rails-domain-specific.md) — generic safety is the baseline, not the answer.

### Concepts — SMS Multi-Thread Chatbot
- [flat-channel-thread-tracking](nodes/concepts/flat-channel-thread-tracking.md) — picking the right thread without thread metadata; cheap-to-expensive detection ladder.
- [async-conversation-pacing](nodes/concepts/async-conversation-pacing.md) — gaps measured in days; re-anchoring; expiry; nudge policy.
- [message-segmentation-160](nodes/concepts/message-segmentation-160.md) — character limits, encoding switches, MMS/RCS fallback.
- [thread-disambiguation-prompts](nodes/concepts/thread-disambiguation-prompts.md) — how to ask "which thread?" in 160 chars.
- [sms-context-windowing](nodes/concepts/sms-context-windowing.md) — what's in the prompt: per-thread, structured, bounded.
- [sms-state-machine](nodes/concepts/sms-state-machine.md) — five states per thread; the durable substrate.
- [sms-recovery-and-reentry](nodes/concepts/sms-recovery-and-reentry.md) — five recovery scenarios; not "sorry, could you clarify?"

### Projects
- [agent-eval-case-study](nodes/projects/agent-eval-case-study.md) — generalized agent platform eval system (2026-06-05 snapshot).
- [agent-eval-improvement-tiers](nodes/projects/agent-eval-improvement-tiers.md) — ranked improvement plan for the case study above.

### References
- [references-eval-reading-list](nodes/references/references-eval-reading-list.md) — frontier-lab + practitioner posts (Anthropic, OpenAI, Husain, Yan, Carter, Shankar, …).

### Threads
- [2026-06-05-eval-analysis](threads/2026-06-05-eval-analysis.md) — origin of the eval nodes.
- [2026-06-07-forced-tool-call-fan-out](threads/2026-06-07-forced-tool-call-fan-out.md) — origin of the output-design nodes.
- [2026-06-08-domain-chatbot-fan-out](threads/2026-06-08-domain-chatbot-fan-out.md) — origin of the conversation-design nodes.
- [2026-06-08-sms-multi-thread-fan-out](threads/2026-06-08-sms-multi-thread-fan-out.md) — origin of the SMS multi-thread nodes.

## Why this shape

- **One concept per file** — cheap to link, cheap to refactor.
- **Frontmatter** — agents can index without parsing prose; `related:` is the machine-readable edge list.
- **Markdown links in body** — navigable on github.com directly; no Obsidian/Foam required.
- **Folder = type, not topic** — topics are themselves nodes; folders prevent the "where does this live?" debate.

## Adding to the graph

Read [`AGENTS.md`](./AGENTS.md). The short version:

1. Pick the right folder by *type* (topic/concept/project/reference/thread).
2. Use `kebab-case-slug.md`. The filename is the `id`.
3. Frontmatter required. `related:` keeps `[[id]]` form for the edge list.
4. Body is markdown; complete sentences; link with `[id](relative/path.md)`.
5. Update this README's index when adding a new node.
