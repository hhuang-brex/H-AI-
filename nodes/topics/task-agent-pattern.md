---
id: task-agent-pattern
type: topic
tags: [task-agent, decision-engine, agents, architecture]
related:
  - [[domain-chatbot-design]]
  - [[llm-output-design]]
  - [[llm-evaluation]]
  - [[decision-engine-contract]]
  - [[engine-vs-conversation-routing]]
  - [[decision-audit-trail]]
  - [[output-surface-taxonomy]]
  - [[forced-tool-call-output]]
status: living
created: 2026-06-09
source-thread: [[2026-06-09-task-agent-pattern]]
---

# Task-Agent Pattern

It's a task agent that happens to chat. The chat is one surface; the underlying engine is "given a transaction → produce a layered decision." Other surfaces — API, batch, draft UI, audit interface — consume the same engine output. The engine doesn't know which surface consumed it.

This topic is a reframing of [domain-chatbot-design](domain-chatbot-design.md) for systems where the **decision is the unit of value**, not the turn.

## Why this is a different pattern

Chat-centric design optimizes the turn: was this reply helpful, on-tone, on-time. Task-agent design optimizes the decision: was the right category chosen, was confidence calibrated, did we abstain when we should have. The two are not opposed, but the unit of value, audit, and evaluation all shift:

| | Chat-centric | Task-agent |
|---|---|---|
| Unit of value | The reply | The decision |
| Unit of audit | The transcript | The decision record (input + version + output) |
| Unit of evaluation | LLM-judged or trajectory | Decision against ground truth + confidence calibration |
| Failure mode | Wrong reply, bad tone | Wrong decision, miscalibrated confidence, missing abstain |

A real production system has both. The point isn't to pick one; it's to recognize that some concepts apply to the engine regardless of surface, and others are surface polish that doesn't generalize.

## The layered output

A decision-engine contract has the shape:

```
{
  decision_id, input_fingerprint, model_version, timestamp,
  decision: {...} | null,
  confidence: number,
  next_action: classify | ask_user | escalate | approve | abstain,
  next_action_payload: {...},
  reasoning: string  // audit-only, never user-facing
}
```

When confident: `decision` populated, `next_action ∈ {classify, approve}`. When unsure: `decision = null`, `next_action ∈ {ask_user, escalate, abstain}`. See [decision-engine-contract](../concepts/decision-engine-contract.md).

## Surfaces are downstream

The engine emits one layered decision. The surface decides how to consume it:

- **Chat** — renders `ask_user` as a question turn; renders `classify` as a brief confirmation
- **API** — returns the typed decision; caller acts on it programmatically
- **Batch** — writes the decision to a queue or table for downstream processing
- **Draft UI** — shows a human-confirmable preview; human commits or overrides
- **Audit interface** — surfaces the decision + reasoning + override history

The engine doesn't know which surface consumed it. A surface change should never require a contract change.

## Reframing audit

Which existing concepts in the graph are engine-relevant (apply regardless of surface), surface-specific (chat / SMS only), or cross-cutting (apply to both)?

| Engine-relevant | Surface-specific | Cross-cutting |
|---|---|---|
| [forced-tool-call-output](../concepts/forced-tool-call-output.md) | [truncated-pyramid-results](../concepts/truncated-pyramid-results.md) | [output-surface-taxonomy](../concepts/output-surface-taxonomy.md) |
| [template-rendered-output](../concepts/template-rendered-output.md) | [intent-and-disambiguation](../concepts/intent-and-disambiguation.md) | [hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md) |
| [paginated-tool-contract](../concepts/paginated-tool-contract.md) | [repair-and-clarification](../concepts/repair-and-clarification.md) | [schema-vs-validator](../concepts/schema-vs-validator.md) |
| [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) | [turn-taking-and-proactivity](../concepts/turn-taking-and-proactivity.md) | [escalation-handoff](../concepts/escalation-handoff.md) |
| [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) | [streaming-vs-structured](../concepts/streaming-vs-structured.md) | [scope-and-refusal](../concepts/scope-and-refusal.md) |
| [grounding-and-citation](../concepts/grounding-and-citation.md) | [message-segmentation-160](../concepts/message-segmentation-160.md) | [recency-bias-prompt-design](../concepts/recency-bias-prompt-design.md) |
| [action-authority](../concepts/action-authority.md) | All sms-* concepts | |
| [safety-rails-domain-specific](../concepts/safety-rails-domain-specific.md) | [thread-disambiguation-prompts](../concepts/thread-disambiguation-prompts.md) | |
| [llm-as-judge](../concepts/llm-as-judge.md) | [flat-channel-thread-tracking](../concepts/flat-channel-thread-tracking.md) | |
| [agent-trajectory-eval](../concepts/agent-trajectory-eval.md) | [async-conversation-pacing](../concepts/async-conversation-pacing.md) | |
| [golden-snapshot-eval](../concepts/golden-snapshot-eval.md) | [persona-tone-compliance](../concepts/persona-tone-compliance.md) | |
| [adversarial-eval](../concepts/adversarial-eval.md) | [operator-trust-injection](../concepts/operator-trust-injection.md) | |
| [cost-aware-eval](../concepts/cost-aware-eval.md) | [conversation-memory](../concepts/conversation-memory.md) | |
| [layered-defense-pipeline](../concepts/layered-defense-pipeline.md) | | |

Notes on borderline calls:
- [conversation-memory](../concepts/conversation-memory.md) is in surface-specific because the engine's "memory" is durable transaction state, not session memory
- [operator-trust-injection](../concepts/operator-trust-injection.md) is in surface-specific because it assumes a free-text-emitting surface
- [layered-defense-pipeline](../concepts/layered-defense-pipeline.md) is in engine-relevant because the regex→tool→template→recheck stack applies to the engine even when a non-chat surface consumes the output

## Sub-topics

- [decision-engine-contract](../concepts/decision-engine-contract.md) — the layered wire format every surface consumes
- [engine-vs-conversation-routing](../concepts/engine-vs-conversation-routing.md) — when the engine handles vs. when chat handles; the bridge
- [decision-audit-trail](../concepts/decision-audit-trail.md) — durable per-decision record; the substrate replay/drift run on

## How this connects to the rest of the graph

[domain-chatbot-design](domain-chatbot-design.md) is the chat-centric umbrella; this topic sits at a higher altitude where chat is one option. [llm-output-design](llm-output-design.md) is consistent — the engine's contract IS a forced-tool-call output by another name, and the surface taxonomy is what the engine routes to. [llm-evaluation](llm-evaluation.md) applies to engine outputs directly: ground-truth-labeled decisions are easier to evaluate than free-text replies, and confidence calibration is its own eval shape.
