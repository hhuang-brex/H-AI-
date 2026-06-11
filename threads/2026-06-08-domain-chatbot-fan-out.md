---
id: 2026-06-08-domain-chatbot-fan-out
type: thread
tags: [chatbot, conversation-design, thread]
related:
  - [[domain-chatbot-design]]
  - [[intent-and-disambiguation]]
  - [[grounding-and-citation]]
  - [[action-authority]]
  - [[escalation-handoff]]
  - [[scope-and-refusal]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[persona-tone-compliance]]
  - [[repair-and-clarification]]
  - [[turn-taking-and-proactivity]]
  - [[safety-rails-domain-specific]]
status: archived
created: 2026-06-08
summary: "origin of the conversation-design nodes."
---

# Thread — Domain Chatbot Conversation Design Fan-Out (2026-06-08)

Conversation goal: extend the graph from "how an LLM emits" ([llm-output-design](../nodes/topics/llm-output-design.md)) to "how a chatbot converses in a specific domain" — a separate discipline with its own decision surface and failure modes.

## Outputs

- [domain-chatbot-design](../nodes/topics/domain-chatbot-design.md) — new umbrella topic.
- 11 concept nodes, each isolating one decision a designer makes:
  - [intent-and-disambiguation](../nodes/concepts/intent-and-disambiguation.md)
  - [grounding-and-citation](../nodes/concepts/grounding-and-citation.md)
  - [action-authority](../nodes/concepts/action-authority.md)
  - [escalation-handoff](../nodes/concepts/escalation-handoff.md)
  - [scope-and-refusal](../nodes/concepts/scope-and-refusal.md)
  - [conversation-memory](../nodes/concepts/conversation-memory.md)
  - [domain-knowledge-injection](../nodes/concepts/domain-knowledge-injection.md)
  - [persona-tone-compliance](../nodes/concepts/persona-tone-compliance.md)
  - [repair-and-clarification](../nodes/concepts/repair-and-clarification.md)
  - [turn-taking-and-proactivity](../nodes/concepts/turn-taking-and-proactivity.md)
  - [safety-rails-domain-specific](../nodes/concepts/safety-rails-domain-specific.md)

## Key insights captured

- Domain is not decoration. It constrains every decision: refusal scope, citation requirements, action authority, memory rules, persona constraints.
- Conversation design (how the dialogue progresses) is distinct from output design (how bytes leave the system). Both compose; neither replaces the other.
- The strongest discipline: **classify each decision explicitly** — same shape as the output-surface taxonomy, applied to conversation-design decisions.
- **Authority must be designed in at the tool layer**, not prompted in. Same principle as forced-tool-call output: shift constraint from "I asked the model to" to "the surface refuses malformed actions."
- **Compliance is a hard contract; persona and tone are quality dials.** Mixing them in one prompt block is a frequent design mistake.
- **Memory is three horizons** (turn-local / session / cross-session) with different storage, invalidation, and privacy implications. Conflating them causes session-boundary bugs.
- **Knowledge injection has four mechanisms** (system prompt, RAG, structured state, fine-tuning) — production systems use all four; the skill is per-knowledge-type assignment.
- **Repair turns are not initial turns.** Three distinct repair causes (misclassified, missed info, re-scope), each needing a different shape.
- **Proactivity is earned by relevance.** The default chatbot is too reactive; over-correction is upselling. Domain rules govern.
- **Domain-specific safety rails** are narrower and broader than generic LLM safety — generic safety is the baseline, not the answer.

## Connections to existing graph

Each concept is also tagged with eval implications, linking back into the eval cluster ([agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md), [llm-as-judge](../nodes/concepts/llm-as-judge.md), [adversarial-eval](../nodes/concepts/adversarial-eval.md), [golden-snapshot-eval](../nodes/concepts/golden-snapshot-eval.md), [cost-aware-eval](../nodes/concepts/cost-aware-eval.md)). The graph now has three loosely-coupled clusters (eval / output design / conversation design) joined by cross-cluster edges where the disciplines actually interact.
