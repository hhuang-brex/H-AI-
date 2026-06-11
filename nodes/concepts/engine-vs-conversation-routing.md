---
id: engine-vs-conversation-routing
type: concept
tags: [task-agent, routing, decision-engine, intent, agents]
related:
  - [[multi-agent-delegation]]
  - [[task-agent-pattern]]
  - [[decision-engine-contract]]
  - [[intent-and-disambiguation]]
  - [[escalation-handoff]]
  - [[output-surface-taxonomy]]
  - [[scope-and-refusal]]
status: living
created: 2026-06-09
summary: "when the engine handles vs. when the chat layer handles; the bridge between them."
---

# Engine-vs-Conversation Routing

The bridge between the decision engine and the chat surface. Without it, every team conflates "the bot decided" with "the bot replied." Either always-decides (when it shouldn't) or never-decides (when the engine should be invoked).

## The two routing decisions

A task-agent system has to make two distinct routing calls. Both small, both explicit.

### 1. Inbound → engine or chat?

When a user message arrives, classify it before the engine sees it:

| Inbound class | Example | Route to |
|---|---|---|
| **Engine-shaped** | New transaction; new info on a pending decision ("the dinner was customer-facing, btw") | Engine |
| **Chat-shaped** | FAQ ("how does this work?"); navigation ("where do I see all my receipts?"); status query ("did my last submission go through?") | Chat layer |
| **Mixed** | "I think this is Software charge by the way also how do I export?" | Both: engine handles the engine-shaped part; chat layer answers the rest as a follow-up turn |

The classifier should be small, explicit, and itself testable. It does NOT have to be an LLM call — for many domains a list of patterns + a fallback LLM call is enough.

### 2. Engine output → which surface treatment?

Once the engine emits a [decision-engine-contract](decision-engine-contract.md), the `next_action` field selects:

| `next_action` | Surface treatment |
|---|---|
| `classify` | Silent commit + (optional) brief confirmation message |
| `approve` | Silent commit + (optional) brief confirmation message |
| `ask_user` | Chat surface drives a clarification turn; uses `next_action_payload` as the question |
| `escalate` | Handoff (see [escalation-handoff](escalation-handoff.md)) |
| `abstain` | Human-review queue; no chat reply |

Each next-action maps to a *templated* surface treatment ([template-rendered-output](template-rendered-output.md)). The engine never writes the user-facing prose.

## Why this is its own node

Without an explicit router:
- Every inbound goes through the LLM "to be safe" — engine cost compounds
- Or every inbound is treated as engine-shaped, and chat-shaped messages get nonsensical decision outputs
- Engine and chat surface get tangled — you can't change one without touching the other

With an explicit router:
- The engine's surface area is clearly defined (only engine-shaped inbounds)
- Chat layer can evolve independently (FAQ updates, navigation help, status display)
- Mixed inbounds get the dual handling that conflated systems silently drop

## The router IS architecture

This is the under-discussed part. The router determines which subsystem handles a turn. That's an architectural decision, not a configuration. Treat it as such:

- The router has its own eval (precision/recall per inbound class)
- The router has its own logs (which class did it pick, with what confidence)
- The router's failure modes are visible in metrics, not buried in the engine

## Anti-patterns

- **Always invoking the engine.** Burns cost on chat-shaped inbounds; produces meaningless decisions for "how does this work?"
- **Always handling in chat layer.** Engine-shaped inbounds lose the typed-decision audit trail; the chat layer effectively becomes a free-text engine.
- **Mixed-intent silent drop.** User asks two things; bot answers one; the other is lost without acknowledgment. Either acknowledge "I'll handle X first, coming back to Y" or split into two turns.
- **Router as LLM judgment with no eval.** A black-box "should we engine this?" classifier degrades silently. Test it like any other classifier.

## Eval

- **Routing accuracy.** Labeled inbounds → expected class (engine / chat / mixed); per-class precision/recall.
- **Per-next-action surface treatment correctness.** For each `next_action` value, assert the expected surface treatment fires.
- **Mixed-intent dual-handling.** Adversarial cases with both engine-shaped and chat-shaped content; assert both are addressed (engine acts; chat acknowledges or follows up).
- **Router cost vs. always-engine.** Track the cost difference; if router is more expensive than always-invoking-engine, the router needs work.

## See also

- [decision-engine-contract](decision-engine-contract.md) — the engine output the router consumes.
- [intent-and-disambiguation](intent-and-disambiguation.md) — engine-vs-chat routing is a higher-altitude intent classifier; that node is about *within-engine* intent disambiguation.
- [escalation-handoff](escalation-handoff.md) — `escalate` is one of the next-action values that lands here.
- [output-surface-taxonomy](output-surface-taxonomy.md) — the surfaces this node routes to.
- [scope-and-refusal](scope-and-refusal.md) — chat-shaped inbounds that fall outside scope land here.
