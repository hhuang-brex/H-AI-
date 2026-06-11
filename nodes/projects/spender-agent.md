---
id: spender-agent
type: project
kind: product
tags: [task-agent, decision-engine, expense-documentation, ea-workflow, design]
related:
  - [[task-agent-pattern]]
  - [[decision-engine-contract]]
  - [[engine-vs-conversation-routing]]
  - [[decision-audit-trail]]
  - [[forced-tool-call-output]]
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[thread-disambiguation-prompts]]
  - [[hard-surface-irrevocability]]
  - [[operator-trust-injection]]
  - [[grounding-and-citation]]
status: proposal
created: 2026-06-09
source-thread: [[2026-06-09-spender-agent-ea-workflow]]
---

# Spender Agent — Product Spec

A task agent that documents card transactions by maintaining an EA-grade model of the principal's economic life and using that model to handle events as they arrive. Chat (SMS, BrexTrust) is one surface; the engine is "given a transaction → produce a documentation decision."

## Spec in one paragraph

A spender agent maintains an ongoing model of its principal's economic life — active narratives, stable patterns, preferences, open loops, emerging signals — and uses that model to handle events as they arrive. For each event it **recognizes** (fits into the model), **implies** (projects what the recognition means), **checks sufficiency** (verifies it has what it needs), **selects an action** (act / ask / defer / escalate), **executes**, and **learns from the outcome**. The slow loop runs continuously in the background, informed by every fast-loop outcome, every calendar change, every external event, and every principal communication. Decisions are the durable artifacts; messages are renderings of decisions; everything else — episodes, clusters, threads, scopes — is implementation detail of these two loops.

## What this is not

- Not a chatbot. Chat is one surface; the engine produces decisions consumed by chat, BrexTrust, audit, batch.
- Not per-transaction reasoning. The reasoning unit is *grouped context*; per-transaction is the projection.
- Not "ask the user about every charge." The default is silent or propose-and-dismiss when context is sufficient.
- Not free-text-driven. Customer-facing output is forced-tool-call rendering of structured decisions.

## The two loops

Great EAs run two loops at different cadences. Implementing both is the architectural commitment that distinguishes assistant-grade behavior from automation.

### Slow loop — maintain the model

Continuous, background. The agent's mental model of *what's happening in this principal's life right now*. Layered:

| Layer | Holds | Updated by |
|---|---|---|
| Active narratives | What's going on now (the LT offsite, the Henderson deal) | Calendar events, transaction clusters, principal messages |
| Stable patterns | What always happens (Tuesday WFH, Equinox membership, oat-milk lattes) | Recurring vendors, repeat answers, declared rules |
| Preferences | How principal wants to be served (silent under $50, never ask about coffee, flag international immediately) | Direct declarations, observed responses, undo signals |
| Open loops | What's outstanding (waiting on Aba attendees, missing Soho House receipt) | Fast-loop questions issued; closed when answered or expired |
| Emerging signals | What might become a pattern (third Lyft to same address this month) | Fast-loop recognition pass; promoted to stable patterns when confirmed |

The slow loop is invisible to anyone watching only the fast loop. Without it, the fast loop produces clerical-quality decisions; with it, the fast loop produces EA-grade ones.

### Fast loop — handle events

Reactive, per-event. Five steps in order:

```
Event arrives
   ↓
1. RECOGNIZE — fit the event into the slow-loop model
2. IMPLY     — project what the recognition means (memo, limit, policy)
3. CHECK SUFFICIENCY — do we have what we need to act?
4. SELECT ACTION — silent / propose / ask / defer / escalate
5. EXECUTE & LEARN — do the thing; feed the outcome back to the slow loop
```

Events include: card swipes, user SMS, calendar updates, receipt arrivals, BrexTrust edits, external system events. Card swipes are the most common, not the only.

### LLM density per step

The architectural rule "LLM proposes facts; code commits to actions" maps onto these steps:

| Step | LLM density | Why |
|---|---|---|
| Recognize | High | Pattern matching against world model; the LLM's natural job |
| Imply | Low | Mostly structured projection from recognition; lookup, not reasoning |
| Check sufficiency | Low | Pure code (required-field check) |
| Select action | Low | Deterministic gate cascade with calibrated thresholds |
| Execute | Low (only tone polish in the SMS case) | Forced-tool-call rendering |
| Learn | Mixed | Structured updates + LLM-driven pattern detection |

## The data primitive: context, not types

A "group" is just **a set of context that some transactions inherit.**

There is no Episode taxonomy (no `trip` vs. `recurring` vs. `event` types). There is one entity — `Context` — with structured shared content (purpose, attendees, location, span, suggested memo, policy) and an inheritance rule that defines which transactions partake of it. A trip is a context with temporal+spatial inheritance; a recurring pattern is a context with vendor+cadence inheritance; a user-declared scope is a context with rule-based inheritance. Same data structure; the polymorphism lives in the inheritance rule.

```typescript
type Context = {
  id: string;
  principal_id: string;

  inheritance: InheritanceRule;       // how transactions become subject
  shared: {                            // what the context carries
    purpose?: string;
    attendees?: Person[];
    location?: LocationDescriptor;
    temporal_span?: { start: Date; end: Date | null };
    suggested_memo?: string;
    suggested_spend_limit_id?: string;
    documentation_policy?: PolicyRef;
    user_label?: string;
  };

  authority: "user-declared" | "system-inferred" | "calendar-derived" | "policy";
  confidence: number;
  evidence: EvidenceRecord;
  state: "active" | "closed";
};
```

When a transaction arrives, the system computes its **applicable-context-set** — the union of all contexts whose inheritance rules match. The Decider projects this set onto a per-transaction Decision. Per-transaction is the unit of *accounting*; context is the unit of *reasoning*.

Why this collapses prior framings: typed episodes, clusters, scopes, threads, principal-model preferences, and org policies are all just contexts with different inheritance shapes and authority levels. New "types" become new inheritance shapes — configuration, not new code.

## AI proposes; user is editor of record

Wrong context assignments are routine, expected, and cheap to fix. The architecture treats user corrections as first-class data with high authority.

| Correction channel | How it works | Volume |
|---|---|---|
| Implicit via reply | User's natural answer reveals the right context ("Aba was offsite, Soho House was personal") | Highest |
| Implicit via undo | "no" reply to a propose-and-dismiss SMS; system asks one focused follow-up | High |
| Explicit BrexTrust edit | Direct manipulation in the web UI | Lower volume, highest fidelity |
| Explicit SMS declaration | "Tag everything from Austin May 18-22 as Q2 LT Offsite" | Rare, very high value |
| Silent revealed-preference | User systematically forwards receipts the system marked "no receipt needed" | Slow accumulation |

Authority precedence: **user-declared > user-confirmed > system-inferred**. Corrections are append-only assertions; they don't overwrite the system's view, they layer on top with higher authority. This preserves the audit trail and lets the system *learn from disagreements* rather than hide them.

## The four agent personas

The single agent decomposes into four personas with shared state. Each has its own prompt, eval cohort, and metrics.

| Persona | Job | Triggered by |
|---|---|---|
| **Decider** | Stage 1: recognize+imply over the applicable-context-set | Card swipes, context changes |
| **Listener** | Intent classification + structured assertion extraction | User messages |
| **Watcher** | Slow-loop maintenance from external events | Calendar changes, receipt arrivals, BrexTrust edits |
| **Communicator** | Render Decisions as user-facing messages via forced tool-call | Decider/Listener/Watcher outputs |

The personas share a single substrate: the Decision log + Context registry + Principal model. They communicate by reading and writing structured state, not by passing prose.

## Decision struct — the wire format

```typescript
type Decision = {
  decision_id: string;
  transaction_id: string;
  applicable_contexts: ContextRef[];     // what reasoning grounded this
  outcome:
    | { kind: "memo-applied"; memo: string; spend_limit_id: string; receipt_required: boolean }
    | { kind: "memo-proposed"; memo: string; spend_limit_id: string; can_silent: boolean }
    | { kind: "info-needed"; missing: ("memo" | "limit" | "receipt" | "attendees")[] }
    | { kind: "deferred"; reason: string; until: Date }
    | { kind: "no-action"; reason: string };
  confidence: number;
  next_action: "silent" | "propose" | "ask" | "defer" | "escalate";
  evidence: EvidenceRecord;
  upstream_inputs_hash: string;           // for replay
  agent_version: AgentVersion;
  decided_at: Date;
};
```

Same shape across surfaces. Reasoning text is audit-only; never crosses to user-facing output.

## Turn-type cascade — the action selector

A pure-code priority cascade. **No LLM in the gate logic itself.** Inputs are structured (applicable contexts, principal-model state, open loops). Output picks the lowest-friction safe action.

```
Priority 1: open-pending-thread (defer / merge / append-mention)
Priority 2: fully-inferable      (silent action, with hard guards)
Priority 3: propose-and-dismiss  (workhorse: act, undo affordance)
Priority 4: ask-once             (fallback; bundle siblings; one question)
```

Hard guards on `fully-inferable`: amount cap (default $100), no-first-time-merchant, receipt-policy doesn't require user, principal hasn't opted out of silent. The cascade is replayable, auditable, and tunable via experiments rather than debate. Every decision logs which gates fired and what their inputs were.

## Forced tool-call rendering

Customer-bound messages are rendered through a forced tool-call with structured slots:

```typescript
send_card_swipe_notification({
  merchant: string,        // pre-filled by Decider
  amount: number,           // pre-filled
  currency: string,         // pre-filled
  memo_applied?: string,    // pre-filled if outcome includes memo
  question?: string,        // pre-filled for ask-once
  trailing_phrase: string,  // model picks from a small set ("Reply 'no' to undo")
});
```

The Communicator LLM cannot emit free-text on these turns. Merchant + amount + memo are deterministically inserted. The model exists at this layer purely for tone polish on bounded optional fields.

This is what makes the IAF-1611 failure mode (bare memo SMS without merchant/amount preface) **structurally unrepresentable** rather than merely "less likely."

## Memory architecture — four tiers

Chat history is *not* the agent's memory. Decisions are.

| Tier | Stores | Used by |
|---|---|---|
| Working set | Current decision's applicable-context-set | Decider |
| Decision log | All historical decisions, indexed | Decider lookup, eval, replay, audit |
| Principal model | Learned preferences, recurring patterns, episode templates | Gate guards, turn-type selection, tone hints |
| Voice context | Last 5–10 chat messages, raw text | Communicator only — for tone continuity |

Each persona reads only the tiers it needs. The Decider sees zero raw chat. The Communicator sees voice context but no decision history. Strict separation.

## What scales and what doesn't

The architecture scales naturally on per-user volume (more transactions get cheaper because more match patterns), user count (per-principal partitioning), workflow breadth (each new outcome type is isolated), policy density (rules engine), and temporal depth (archive tiering).

It scales with engineering investment on calibration (per-model isotonic regression on confidence outputs), eval (per-transaction structured assertions), prompt-injection robustness (trusted/untrusted text separation), and versioning (every decision tagged with agent version for replay).

It does not scale to "infinitely capable EA." Two genuine limits: concurrent active contexts per user is bounded by what the LLM can reliably attend to (~10 candidates); behavioral diversity across users has a long tail where the system falls back to ask-the-user (which is fine, but the EA-grade illusion degrades on that tail).

## Build order — six weeks for ~70% of the value

Each piece is independently shippable behind a flag.

1. **Decision struct + audit log table** (~1 wk). Add columns; start logging current behavior. Zero behavior change. Buys observability immediately. Foundation for every later piece.
2. **Forced tool-call on first-touch SMS** (~2 wk). Decoupling Communicator from Decider; structural elimination of IAF-1611-class failures. Highest single-piece ROI.
3. **Per-principal serialization queue** (~1 wk). Prevents race conditions between concurrent inputs (card swipe + user reply on overlapping state). Foundational infrastructure.
4. **Same-merchant-burst context** (~1 wk). The simplest context shape — same merchant within 24h. ~50 lines. Open-pending-thread merge wins follow from this.
5. **Tier-1 deterministic anti-pattern checks** (~3 days). Move skill's banned phrases from prompt to deterministic check. Catches reasoning leaks immediately.
6. **Per-transaction eval cohort with structured assertions** (~1 wk). Regression safety for everything else.

Items 7+ (full thread state machine, principal model, intent classifier router, async resolution, additional context shapes) layer on incrementally as production data motivates each.

## What this fixes vs. today's IAF

| Failure mode | Today | This design |
|---|---|---|
| IAF-1611 (bare memo SMS) | Free-text generation under loose prompt rules | Structurally unrepresentable: forced tool-call slots require merchant+amount |
| IAF-1489 (reasoning preface) | Skill rules; intermittent leaks | Same forced tool-call removes the channel; tier-1 checks catch any residual |
| Repetitive asking | Each swipe asks fresh | Context bundling: one question can resolve N transactions |
| Cross-expense memo bleed | Possible because chat history is loaded raw | Context boundaries are explicit; bleed becomes an explicit propose |
| Stale open questions on new swipes | Two parallel threads | Open-pending-thread bundling merges into one |
| Postmortems | Chat-log archaeology | Decision log: SQL query against `turn_type_decision` |
| Model upgrades | Risk of regression on every Sonnet bump | Calibration curve per (model, prompt) tuple absorbs drift |

## Worked example — IAF-1611 under this design

```
Card swipe arrives: $40 mini-bar at Soho House Austin (06:08 May 21)

Watcher (background): already created LT-Offsite context from
  calendar event on May 17; principal had a pending question on the
  prior $115 Soho House charge from 23:57 May 20.

Fast loop:
  1. RECOGNIZE: matches LT-Offsite context (location, span);
                same-merchant-burst with prior charge (24h, same merchant).
  2. IMPLY: memo template "Q2 LT Offsite — Soho House"; spend limit
            "Travel-Leadership"; no receipt needed under threshold.
  3. SUFFICIENCY: prior thread on sibling charge is awaiting-user;
                  this is a structural duplicate ask if we open a new thread.
  4. SELECT: Gate 1 (open-pending-thread) fires. Strategy: append-mention.
  5. EXECUTE: forced tool-call:
              "Also a $40 mini-bar at Soho House — adding to the same memo."
              Thread now refs both transactions.
  6. LEARN: pattern reinforced — late-night same-hotel charges during trips
            consistently belong to the trip context.

Result: no bare memo SMS, no parallel thread, one user reply later
  resolves both transactions.
```

## Source threads

This spec synthesizes a long research-and-design conversation that traversed:

- IAF-1611 root-cause investigation
- PR #1875 + #1890 analysis (durable vs. bandit fix)
- Forced tool-call (Option B) when to use, when not
- Free-text validator design (Option A — multi-tier guards)
- Per-transaction reframing as the unit of work
- Episode types and the typed-vs-universal-context collapse
- AI-proposes / user-corrects authority model
- First-principles EA workflow derivation (slow loop + fast loop + five steps)

## See-also

- [task-agent-pattern](../nodes/topics/task-agent-pattern.md) — higher-altitude framing this spec instantiates
- [decision-engine-contract](../nodes/concepts/decision-engine-contract.md) — the Decision struct used here
- [engine-vs-conversation-routing](../nodes/concepts/engine-vs-conversation-routing.md) — the Listener's job
- [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) — the audit substrate
- [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) — the Communicator's mechanism
- [sms-multi-thread-chatbot](../nodes/topics/sms-multi-thread-chatbot.md) — flat-channel thread tracking concepts
- [hard-surface-irrevocability](../nodes/concepts/hard-surface-irrevocability.md) — why SMS justifies forced tool-call
- [grounding-and-citation](../nodes/concepts/grounding-and-citation.md) — context-set as grounding source
