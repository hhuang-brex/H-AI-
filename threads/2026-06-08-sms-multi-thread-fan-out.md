---
id: 2026-06-08-sms-multi-thread-fan-out
type: thread
tags: [sms, chatbot, multi-thread, thread]
related:
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[async-conversation-pacing]]
  - [[message-segmentation-160]]
  - [[thread-disambiguation-prompts]]
  - [[sms-context-windowing]]
  - [[sms-state-machine]]
  - [[sms-recovery-and-reentry]]
status: archived
created: 2026-06-08
summary: "origin of the SMS multi-thread nodes."
---

# Thread — SMS Multi-Thread Chatbot Fan-Out (2026-06-08)

Conversation goal: extend the graph to cover the design of a chatbot that holds multiple concurrent threads with one user over SMS only — a flat channel with no thread metadata, no rich UI, async pace.

## Outputs

- [sms-multi-thread-chatbot](../nodes/topics/sms-multi-thread-chatbot.md) — new umbrella topic.
- 7 concept nodes, each isolating one decision the design forces:
  - [flat-channel-thread-tracking](../nodes/concepts/flat-channel-thread-tracking.md)
  - [async-conversation-pacing](../nodes/concepts/async-conversation-pacing.md)
  - [message-segmentation-160](../nodes/concepts/message-segmentation-160.md)
  - [thread-disambiguation-prompts](../nodes/concepts/thread-disambiguation-prompts.md)
  - [sms-context-windowing](../nodes/concepts/sms-context-windowing.md)
  - [sms-state-machine](../nodes/concepts/sms-state-machine.md)
  - [sms-recovery-and-reentry](../nodes/concepts/sms-recovery-and-reentry.md)

## Key insights captured

- The mismatch between flat channel and multi-thread workload **is** the entire design problem; every concept exists because removing a chat-UI affordance forces an explicit decision.
- **Thread tracking is a confidence-tiered detection ladder**, not a single classifier. Most inbounds resolve at cheap tiers (single-open, latest-prompt heuristic, explicit reference) before LLM is needed.
- **Time-since-last-turn matters.** Bot replies should change shape across gap brackets — re-anchoring becomes mandatory past a day.
- **160 chars is a real budget**, including the encoding-switch landmine (one emoji ⇒ entire message becomes UCS-2 ⇒ segment count doubles).
- **Disambiguation prompts have a small successful pattern**: 2 anchored options + escape hatch + one-token reply, fits in one segment.
- **Per-thread context windowing** — load this thread only, plus structured state, plus account context. Cross-thread leakage is a bug, not a feature.
- **Each thread is a small explicit state machine** with five states; every other concept consumes this state.
- **Recovery has five distinct scenarios**, each with a different fix; collapsing them into one "sorry, could you clarify?" path is the SMS bot's most common failure.

## Connections to existing graph

- SMS is the canonical hard surface in [output-surface-taxonomy](../nodes/concepts/output-surface-taxonomy.md); first-touch outbounds want [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md).
- The general patterns from [domain-chatbot-design](../nodes/topics/domain-chatbot-design.md) all apply but get reshaped — [turn-taking-and-proactivity](../nodes/concepts/turn-taking-and-proactivity.md) becomes nudge policy, [repair-and-clarification](../nodes/concepts/repair-and-clarification.md) becomes the five-scenario set.
- [conversation-memory](../nodes/concepts/conversation-memory.md)'s three horizons map onto turn-local context, per-thread session memory, and the cross-thread aggregate user record.
- Eval implications tie back to [agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md) (multi-turn drift), [golden-snapshot-eval](../nodes/concepts/golden-snapshot-eval.md) (segment-length, encoding assertions), [cost-aware-eval](../nodes/concepts/cost-aware-eval.md) (per-turn token budget).
