---
id: 2026-06-09-spender-agent-ea-workflow
type: thread
tags: [task-agent, expense-documentation, ea-workflow, spender-agent, thread]
related:
  - [[spender-agent]]
  - [[task-agent-pattern]]
  - [[decision-engine-contract]]
  - [[forced-tool-call-output]]
  - [[sms-multi-thread-chatbot]]
status: archived
created: 2026-06-09
---

# Thread — Spender Agent / EA Workflow Synthesis (2026-06-09)

Long research-and-design conversation that started as a root-cause investigation of an IAF chatbot bug (IAF-1611, "expense-automation sends bare memo text as SMS without merchant/amount context") and ended as a first-principles spec for the underlying product.

## Method

Iterative drilling. Each turn either drilled into a piece (`/fork dive deep`) or reframed at a higher altitude. The conversation found its own destination through user correction of premature framings.

## Trail

1. **IAF-1611 investigation.** Three hypotheses ranked; H2′ (model treats system-event as a user-authored message and answers it) confirmed by production chat export and team's own IAF-1489 ticket.
2. **PR #1875 + #1890 analysis.** Distinguished durable structural fixes (transport routing, tag rename) from bandit prompt edits. Forced tool-call (Option B) identified as the structurally-superior path.
3. **Option A exploration.** "How do you validate free text?" — surfaced the multi-tier guard pattern: deterministic anti-pattern checks block sends, async LLM judge feeds the deterministic list.
4. **Per-transaction reframing.** User reframed: "this is a task agent that happens to chat — given a transaction, produce a documentation decision." Decisions become the durable artifact; messages become renderings.
5. **Episode types explored, then collapsed.** Five typed episodes proposed (trip, project, event, recurring, ad-hoc); user pushed first-principles ("group is just a set of context?") and the type taxonomy collapsed into a single `Context` primitive with structured inheritance rules.
6. **AI-proposes / user-corrects.** Authority model added: user assertions are append-only, high-authority, layered on top of system inferences rather than overwriting them.
7. **First-principles EA workflow.** Stripped to two loops (slow context model + fast event handling) and five fast-loop steps (recognize / imply / check sufficiency / select action / execute & learn).
8. **Product spec.** Synthesized into [spender-agent](../nodes/projects/spender-agent.md) (`kind: product`).

## Key insights captured

- **Chat is a surface, not the architecture.** The product is "given a transaction, produce a documentation decision"; chat is one rendering surface. Other surfaces (BrexTrust, audit, batch) consume the same Decision struct.
- **Two loops, not one.** The slow loop maintains the principal's world model; the fast loop processes events against it. Most automation systems implement only the fast loop, which is why they feel automated rather than assistant-like.
- **Context is the primitive; types are descriptions.** A "trip" is just a context with temporal+spatial inheritance. A "recurring pattern" is a context with vendor-cadence inheritance. The architecture has one entity (Context) and a registry of inheritance rules — not a typed taxonomy.
- **AI proposes; user is editor of record.** Wrong groupings are routine. The system optimizes correction friction, not initial accuracy. User assertions append with high authority; system inferences are layered below.
- **The LLM/code split has a clean rule.** LLM proposes facts (recognition, intent, cold-start memo inference); code commits to actions (gate cascade, action selection, output rendering). Anything triggering customer-visible action without further user input must be decided by code.
- **Forced tool-call makes IAF-1611 structurally unrepresentable.** Merchant + amount + memo are deterministically inserted into rendered SMS; the LLM only chooses tone polish in bounded optional fields.
- **Decisions are the audit trail.** Replace chat-log archaeology with SQL queries against a `Decision` table. Every customer-visible action logs its inputs hash, gate path, evidence, agent version.

## Output

- [spender-agent](../nodes/projects/spender-agent.md) — full product spec, six-week build order, mapping to current IAF failure modes, scaling analysis.
- `README.md` updated: spender-agent entry under Projects.

## Connection to existing graph

This is the worked example the [task-agent-pattern](../nodes/topics/task-agent-pattern.md) cluster was missing. The fan-out spec [task-agent-pattern-fanout](../nodes/projects/task-agent-pattern-fanout.md) explicitly listed "a worked example with concrete schema" as an open follow-up. The spender-agent spec instantiates [decision-engine-contract](../nodes/concepts/decision-engine-contract.md), [engine-vs-conversation-routing](../nodes/concepts/engine-vs-conversation-routing.md), and [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) against a real domain.

## Open follow-ups

- Calibration curve infrastructure isn't yet a separate concept node; deserves one if more product specs land that depend on calibrated confidence.
- The two-loop workflow shape (slow context model + fast event handling) is general beyond this product; could promote to a concept node under [task-agent-pattern](../nodes/topics/task-agent-pattern.md) if reused.
- Universal-Context-as-primitive is also general; could become a concept node ("context-as-primitive" or similar) if it informs other product specs.
