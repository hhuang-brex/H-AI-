---
id: decision-audit-trail
type: concept
tags: [task-agent, audit, observability, decision-engine, replay]
related:
  - [[task-agent-pattern]]
  - [[decision-engine-contract]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[agent-eval-improvement-tiers]]
  - [[llm-observability]]
status: living
created: 2026-06-09
summary: "durable per-decision record (fingerprint + version + reasoning + override history); the substrate replay/drift run on."
---

# Decision Audit Trail

The durable record of every decision the engine made. Differs from chat logging because the unit is *the decision*, not *the turn*.

## Why this is its own concept

A chat-centric system logs transcripts. The unit of record is the conversation. Useful for support investigation; useless for "did the engine drift on Software-classification last month?"

A task-agent system has decisions, and the decision is what people will ask about — months later, in compliance review, in drift investigation, in "why did the engine pick X for this transaction?" The transcript may not exist (a batch decision has no chat). The decision must.

## Required fields

```
{
  decision_id:        "uuid",
  input_fingerprint:  "hash of canonical input",
  model_version:      "pinned at decision time",
  timestamp:          "iso8601",
  decision:           "full layered output from contract",
  reasoning:          "model's stated rationale; audit-only",
  reasoning_continuity_payload: "opaque; preserved verbatim for round-trip",
  consumer_surface:   "chat | api | batch | draft_ui",
  override_history:   [
    { timestamp, actor, original_decision, new_decision, reason }
  ],
  replay_decision:    [
    { timestamp, replay_model_version, replay_decision, diff_summary }
  ]
}
```

`override_history` captures humans correcting the engine. Empty when no override happened. `replay_decision` captures running the same `input_fingerprint` against a newer `model_version` later — the diff between original and replay is the drift signal.

`reasoning_continuity_payload` is the lab-specific opaque blob needed to round-trip reasoning across multi-turn agent loops: Anthropic's `signature` on thinking blocks (especially under `display: omitted`), OpenAI's `previous_response_id` or full reasoning-item list, DeepSeek's `reasoning_content` strip-before-resend marker. Store as opaque per-turn; never display; preserve exact bytes. Without it, multi-turn reasoning is lost across the loop. See [llm-observability](llm-observability.md) for the protocol per lab.

## Why this earns its own node

Four reasons it doesn't fold into [prod-shadow-replay](prod-shadow-replay.md) or any existing node:

**Different consumers.** Compliance review reads decision audit. Chat support reads transcripts. Same incident often needs both, but they're queries against different stores with different access patterns.

**Different retention.** Decisions outlive conversations. A transaction's decision history matters for years (regulatory review, customer dispute, accounting reclassification). The chat session that produced it usually doesn't.

**Drives drift detection.** A monthly diff of `replay_decision` against historical `decision` is the single highest-leverage drift signal — independent of any chat eval. Newer model produces different category 8% of the time on the same fingerprints? That's a real signal you only get if the audit trail exists.

**Drives engine-level prod-replay.** [prod-shadow-replay](prod-shadow-replay.md) for chat replays *trajectories*. The engine equivalent replays *decisions*. Same idea, different unit. The audit trail is the substrate the engine-level replay runs on.

## Storage shape

- **Append-only.** Override = new row, not mutation of original.
- **Keyed by `decision_id`.** Lookups by transaction or surface use indexes on those columns.
- **`consumer_surface` as a column.** Lets you slice "all chat-driven decisions last week" or "all batch-driven decisions" without joining.
- **Reasoning as text, not BLOB.** Searchable for postmortems.

## Anti-patterns

- **Audit only when something goes wrong.** Defeats the purpose. Log every decision; sample for analysis.
- **Reasoning omitted from audit.** "We didn't want to store all that text." Then drift investigation has to re-run the engine to recover the rationale, which may not even reproduce the original.
- **`override_history` not tracked.** Now you don't know which decisions humans corrected; can't measure engine accuracy from real overrides.
- **Conflating chat transcript with decision audit.** Different units, different retention, different consumers. Same store is fine; same row is wrong.
- **No `replay_decision` ever populated.** Drift detection requires periodic re-decision of historical fingerprints. Without it, the audit is read-only history with no learning loop.

## Eval

- **Audit completeness.** Sample N% of decisions; assert every required field is populated.
- **Replay coverage.** Assert at least M% of decisions have a `replay_decision` entry within K days. (Drift detection requires regular replay; if coverage drops, the loop is broken.)
- **Override-rate trend.** Track `override_history` length per decision over time. Trending up = engine accuracy degrading or new edge cases. Trending down = engine improving or humans giving up.
- **Reasoning-vs-decision consistency.** LLM-judged sample: does the reasoning text actually justify the decision? Catches "the engine wrote a confident rationale for the wrong category" cases.

## See also

- [decision-engine-contract](decision-engine-contract.md) — the source of the audited fields. Audit doesn't add fields; it persists the contract's fields with override + replay extensions.
- [prod-shadow-replay](prod-shadow-replay.md) — the chat-equivalent technique. The engine version replays decisions, not trajectories; this audit trail is the substrate.
- [cost-aware-eval](cost-aware-eval.md) — audit storage is paid. Plan retention.
- [agent-eval-improvement-tiers](../projects/agent-eval-improvement-tiers.md) — audit-driven drift detection slots into Tier 4 (online signal).
