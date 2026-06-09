---
id: 2026-06-09-task-agent-pattern
type: thread
tags: [task-agent, decision-engine, fan-out, thread]
related:
  - [[task-agent-pattern]]
  - [[decision-engine-contract]]
  - [[engine-vs-conversation-routing]]
  - [[decision-audit-trail]]
  - [[task-agent-pattern-fanout]]
status: archived
created: 2026-06-09
---

# Thread — Task-Agent Pattern Fan-Out (2026-06-09)

Conversation goal: reframe the H-AI- graph to support systems where the **decision is the unit of value**, not the chat turn — captured by the line "it's a task agent that happens to chat. The chat is one surface; the underlying engine is given-X-produce-Y."

## Method

Used the superpowers:brainstorming skill end-to-end:

1. Two clarifying questions:
   - Altitude → "Reframing audit + small adds" (3–5 new nodes; tag existing)
   - Decision shape → "Layered: decision + action" (typed decision when confident; next-action when unsure)
2. Three approaches proposed (lean / recommended / extras); user picked recommended (4 new nodes).
3. Three-section design walkthrough (topic + audit table; three concepts; README placement).
4. Spec written to [task-agent-pattern-fanout](../nodes/projects/task-agent-pattern-fanout.md) (graph-native proposal node).
5. Plan written, executed, committed for review.

## Outputs

- [task-agent-pattern](../nodes/topics/task-agent-pattern.md) — new umbrella topic with inline reframing audit table.
- [decision-engine-contract](../nodes/concepts/decision-engine-contract.md) — layered wire format every surface consumes.
- [engine-vs-conversation-routing](../nodes/concepts/engine-vs-conversation-routing.md) — bridge between engine and chat; two routing decisions.
- [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) — durable per-decision record; substrate for replay/drift.

## Key insights captured

- **Chat-centric design optimizes the turn; task-agent design optimizes the decision.** Unit of value, audit, and evaluation all shift.
- **The engine emits one shape; surfaces choose the treatment.** A surface change should never require a contract change.
- **Layered output is the realistic shape.** Single-decision contracts collapse "what's the answer?" into "what should we do next?" — these have different right answers.
- **The router IS architecture.** Engine-vs-conversation routing is its own subsystem with its own eval; not a configuration knob.
- **Audit trail is a substrate, not a feature.** Replay, drift detection, override tracking, and engine-level prod-shadow all run on the same audit substrate.

## Connection to existing graph

The new cluster sits alongside [domain-chatbot-design](../nodes/topics/domain-chatbot-design.md) at the topic level — neither replaces the other; they're two altitudes of the same problem space. The audit table inside [task-agent-pattern](../nodes/topics/task-agent-pattern.md) is the bridge: it categorizes every existing concept by whether it's engine-relevant, surface-specific, or cross-cutting.

## Open follow-ups

- A worked example (transactions → documentation decisions, with concrete schema) would anchor the abstract nodes. Skipped to keep the cluster generic; can land as a project node.
- [intent-and-disambiguation](../nodes/concepts/intent-and-disambiguation.md) currently sits in surface-specific in the audit table. Some of its content overlaps the higher-altitude [engine-vs-conversation-routing](../nodes/concepts/engine-vs-conversation-routing.md). Worth re-visiting if the overlap proves confusing in practice.
