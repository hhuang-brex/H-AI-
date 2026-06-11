---
title: Home
nav_order: 1
permalink: /
---

# H-AI-

> Hai's knowledge graph. Every file is one node. Every link is one edge.

A working knowledge base that is **readable for humans** (browse the markdown on github.com or any renderer) and **parseable for agents** (YAML frontmatter, stable IDs, predictable folders). Designed to grow into a navigable graph rather than a pile of notes.

**Browse the rendered site:** [hhuang-brex.github.io/H-AI-](https://hhuang-brex.github.io/H-AI-/)

## Layout

```
H-AI-/
├── README.md              ← you are here (and the site homepage)
├── AGENTS.md              ← contract for agents adding/editing nodes
├── _config.yml            ← Jekyll config (powers the rendered site)
├── nodes/
│   ├── topics/            ← broad areas; entry points (e.g. llm-evaluation)
│   ├── concepts/          ← reusable patterns/ideas (e.g. llm-as-judge)
│   ├── projects/          ← project-specific snapshots (e.g. agent-eval-case-study)
│   └── references/        ← external posts/papers reading lists
├── product/               ← end-to-end product specs synthesized from threads
└── threads/               ← time-stamped conversation summaries
```

Frontmatter `related:` is the machine-readable edge list (uses `[[id]]` form). Body prose uses standard markdown links so navigation works on github.com and on the rendered site. Schema reference and editing rules: [`AGENTS.md`](./AGENTS.md).

## Current entry points

### Topics
- [llm-evaluation](nodes/topics/llm-evaluation.md) — measuring whether LLM systems do what they should without bankrupting the team.
- [llm-output-design](nodes/topics/llm-output-design.md) — how an LLM emits to the world; per-surface decisions.
- [domain-chatbot-design](nodes/topics/domain-chatbot-design.md) — how a chatbot converses inside a specific domain.
- [sms-multi-thread-chatbot](nodes/topics/sms-multi-thread-chatbot.md) — multi-thread chatbot design when the only channel is flat SMS.
- [chatbot-pagination](nodes/topics/chatbot-pagination.md) — handling large result sets in a chatbot; UX shape and tool shape chosen jointly.
- [task-agent-pattern](nodes/topics/task-agent-pattern.md) — engine-primary framing where chat is one surface among several.

### Concepts — Task-Agent Pattern
- [decision-engine-contract](nodes/concepts/decision-engine-contract.md) — layered output (decision + confidence + next-action) as the wire format every surface consumes.
- [engine-vs-conversation-routing](nodes/concepts/engine-vs-conversation-routing.md) — when the engine handles vs. when the chat layer handles; the bridge between them.
- [decision-audit-trail](nodes/concepts/decision-audit-trail.md) — durable per-decision record (fingerprint + version + reasoning + override history); the substrate replay/drift run on.

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
- [template-rendered-output](nodes/concepts/template-rendered-output.md) — stricter sibling: classifier picks a tool, code-owned templates render the reply.
- [layered-defense-pipeline](nodes/concepts/layered-defense-pipeline.md) — regex gate → forced tool → templates → heterogeneous-model recheck.
- [output-surface-taxonomy](nodes/concepts/output-surface-taxonomy.md) — classify each surface explicitly; per-surface decisions.
- [schema-vs-validator](nodes/concepts/schema-vs-validator.md) — schema-enforced output vs. free-text + post-hoc validator.
- [streaming-vs-structured](nodes/concepts/streaming-vs-structured.md) — token-by-token UX vs. structured output trade-off.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.
- [native-thinking-vs-prompted-reasoning](nodes/concepts/native-thinking-vs-prompted-reasoning.md) — frontier labs have moved away from prompted `<reasoning>` tags; native thinking APIs are the default.
- [llm-observability](nodes/concepts/llm-observability.md) — debugging "why did the model respond this way?" — what frontier APIs actually return (mostly summaries), platform feature reality, OTel state.
- [cot-as-forensic-artifact](nodes/concepts/cot-as-forensic-artifact.md) — the *why* behind reasoning instrumentation: CoT is forensic, not explanatory; unfaithful 60–75% of the time yet uniquely surfaces alignment-faking, scheming, situational awareness.

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

### Concepts — Chatbot Pagination
- [truncated-pyramid-results](nodes/concepts/truncated-pyramid-results.md) — summary first, select-N exemplars, refinement buttons (NN/g).
- [paginated-tool-contract](nodes/concepts/paginated-tool-contract.md) — opaque cursors, verbosity enum, filter parameters; ~3× token savings.
- [code-execution-sandbox-pattern](nodes/concepts/code-execution-sandbox-pattern.md) — keep large rows out of model context entirely.

### Concepts — Operator / Trust
- [operator-trust-injection](nodes/concepts/operator-trust-injection.md) — mid-conversation operator-only messages without a developer role; self-describing wrapper + recency reinforcement + output hygiene + reply envelope.
- [recency-bias-prompt-design](nodes/concepts/recency-bias-prompt-design.md) — placement matters; rules near the end and reinforcements near the injection point earn more weight.

### Projects
- [agent-eval-case-study](nodes/projects/agent-eval-case-study.md) — generalized agent platform eval system (2026-06-05 snapshot).
- [agent-eval-improvement-tiers](nodes/projects/agent-eval-improvement-tiers.md) — ranked improvement plan for the case study above.
- [dspy-domain-chatbot-cases](nodes/projects/dspy-domain-chatbot-cases.md) — verified DSPy domain-chatbot success examples (JetBlue, Dr.Copilot, etc.; 2026-06-09 snapshot).
- [worked-example-anthropic-thinking](nodes/projects/worked-example-anthropic-thinking.md) — Python code: capturing reasoning, signature continuity, forced-tool-call constraint, hidden billing.
- [worked-example-openai-responses](nodes/projects/worked-example-openai-responses.md) — Python code: Responses API, server-stateful + stateless multi-turn, `incomplete:max_output_tokens` handling.
- [sms-message-buffering-spec](nodes/projects/sms-message-buffering-spec.md) — handle users splitting one thought across multiple SMS messages; 3-layer detection (regex / Haiku classifier / dynamic timeout) with 10 edge cases.
- [sms-message-buffering-plan](nodes/projects/sms-message-buffering-plan.md) — 7-piece implementation plan for the spec above.
- [task-agent-pattern-fanout](nodes/projects/task-agent-pattern-fanout.md) — engine-primary framing where chat is one surface among several.
- [knowledge-graph-index-builder-spec](nodes/projects/knowledge-graph-index-builder-spec.md) — `tools/build-graph.py` derives the README index, threads rollup, and `graph.json` from frontmatter; ends index drift permanently.

### Products
End-to-end design specs for systems we'd build (synthesized from threads). See [`product/`](product/).
- [spender-agent](product/spender-agent.md) — task agent that documents transactions by maintaining an EA-grade model of the principal's economic life. Two-loop architecture (slow context model + fast event handling) over a universal-context primitive; AI-proposes / user-corrects authority.

### Product specs
- [spender-agent](product/spender-agent.md) — task agent that documents transactions by maintaining an EA-grade model of the principal's economic life. Two-loop workflow over universal-context primitive, AI-proposes / user-corrects authority. (2026-06-09 proposal.)

### References
- [references-eval-reading-list](nodes/references/references-eval-reading-list.md) — frontier-lab + practitioner posts on LLM eval (Anthropic, OpenAI, Husain, Yan, Carter, Shankar, …).
- [references-domain-chatbot-design](nodes/references/references-domain-chatbot-design.md) — chatbot design reading list (Anthropic, OpenAI, Microsoft Bot Service, Google CDS, Rasa, Voiceflow, Husain, Yan, Hall, Intercom Fin).
- [references-chatbot-pagination](nodes/references/references-chatbot-pagination.md) — pagination reading list (Anthropic Writing Tools / Code Execution, MCP cursor spec, NN/g UX patterns).

### Threads
- [2026-06-05-eval-analysis](threads/2026-06-05-eval-analysis.md) — origin of the eval nodes.
- [2026-06-07-forced-tool-call-fan-out](threads/2026-06-07-forced-tool-call-fan-out.md) — origin of the output-design nodes.
- [2026-06-08-domain-chatbot-fan-out](threads/2026-06-08-domain-chatbot-fan-out.md) — origin of the conversation-design nodes.
- [2026-06-08-sms-multi-thread-fan-out](threads/2026-06-08-sms-multi-thread-fan-out.md) — origin of the SMS multi-thread nodes.
- [2026-06-08-domain-chatbot-research](threads/2026-06-08-domain-chatbot-research.md) — verified reading-list research thread.
- [2026-06-09-dspy-domain-chatbot-research](threads/2026-06-09-dspy-domain-chatbot-research.md) — deep-research on documented DSPy chatbot case studies.
- [2026-06-09-chatbot-pagination-research](threads/2026-06-09-chatbot-pagination-research.md) — deep-research on chatbot pagination UX + technical patterns.
- [2026-06-09-ikki-forced-tool-calling](threads/2026-06-09-ikki-forced-tool-calling.md) — audit against Ikki's "Forced Tool Calling in Production Chatbots" post.
- [2026-06-09-operator-trust-injection](threads/2026-06-09-operator-trust-injection.md) — adding operator-trust-injection + recency-bias-prompt-design from Anthropic-engineer-recommended patterns.
- [2026-06-09-task-agent-pattern](threads/2026-06-09-task-agent-pattern.md) — origin of the task-agent-pattern cluster.
- [2026-06-09-spender-agent-ea-workflow](threads/2026-06-09-spender-agent-ea-workflow.md) — origin of the spender-agent product spec.
- [2026-06-09-reasoning-mode-research](threads/2026-06-09-reasoning-mode-research.md) — deep-research on prompted `<reasoning>` vs. native thinking APIs.
- [2026-06-10-llm-observability-research](threads/2026-06-10-llm-observability-research.md) — deep-research on "why did the model respond this way?" debugging workflow.
- [2026-06-10-reasoning-rationale-research](threads/2026-06-10-reasoning-rationale-research.md) — deep-research on faithfulness, alignment-faking, scheming evaluations — the *why* for instrumenting reasoning.
- [2026-06-10-sms-message-buffering-research](threads/2026-06-10-sms-message-buffering-research.md) — origin of the SMS message buffering spec; voice-AI EOT pattern as architectural reference.
- [2026-06-10-github-buffering-references](threads/2026-06-10-github-buffering-references.md) — GitHub prior art for chatbot message buffering (clawbolt, Chatwoot, LiveKit).
- [2026-06-11-text-eot-classifier-salvage](threads/2026-06-11-text-eot-classifier-salvage.md) — text-EOT classifier salvage from a stalled deep-research workflow; TurnGPT verified, HF entries blocked by Brex SSO.
- [2026-06-11-knowledge-graph-organization-review](threads/2026-06-11-knowledge-graph-organization-review.md) — audit of this repo as a knowledge graph; origin of the index-builder spec.
- [2026-06-09-spender-agent-ea-workflow](threads/2026-06-09-spender-agent-ea-workflow.md) — first-principles synthesis from IAF-1611 root-cause to spender-agent product spec.

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
