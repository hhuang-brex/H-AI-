---
id: decision-engine-contract
type: concept
tags: [task-agent, decision-engine, contract, schema, output]
related:
  - [[task-agent-pattern]]
  - [[forced-tool-call-output]]
  - [[template-rendered-output]]
  - [[engine-vs-conversation-routing]]
  - [[decision-audit-trail]]
  - [[output-surface-taxonomy]]
status: living
created: 2026-06-09
summary: "layered output (decision + confidence + next-action) as the wire format every surface consumes."
---

# Decision-Engine Contract

The wire format the engine produces and every surface consumes. Layered, typed, audit-ready.

## The shape

```json
{
  "decision_id":         "uuid",
  "input_fingerprint":   "hash of canonical input",
  "model_version":       "pinned string",
  "timestamp":           "iso8601",
  "decision":            { /* category, memo, missing_fields[], ... */ } ,
  "confidence":          0.87,
  "next_action":         "classify | ask_user | escalate | approve | abstain",
  "next_action_payload": { /* params for the next-action surface */ },
  "reasoning":           "audit-only string; never user-facing"
}
```

## Key claims

**Same shape across all surfaces.** A surface change should never require a contract change. Chat, API, batch, draft UI all consume the identical shape.

**`decision` is null when the next-action is unsure.** Confident classification produces both: `decision: {...}` AND `next_action ∈ {classify, approve}`. Unsure paths produce only the next-action: `decision: null` AND `next_action ∈ {ask_user, escalate, abstain}`.

**Confidence is a field, not a separate branch.** Surfaces apply their own thresholds. A draft UI might require confidence > 0.9 before auto-confirming; a batch process might accept > 0.7. The contract carries the number; surfaces carry the policy.

**Reasoning is audit-only.** Never crosses to user-facing output. Same hard line as [operator-trust-injection](operator-trust-injection.md) — once the engine commits to "this prose is for audit," it must structurally never be rendered to the user.

**Abstain is a first-class value, not an error.** Coding it as an exception or null fallback turns a known-unknown into a fallout. Make it a named outcome the engine can produce intentionally.

**`model_version` and `input_fingerprint` are mandatory.** They make the decision replayable — replay the same fingerprint with the same model_version and you should get the same decision (modulo nondeterminism). They also make drift detection possible: replay the same fingerprint with a NEW model_version and diff. Both consumed by [decision-audit-trail](decision-audit-trail.md).

## Why "layered" instead of single-decision

A single-decision contract collapses two questions into one: "what's the answer?" AND "what should we do next?" These have different right answers. A confident "Software" classification *and* an "ask_user" next-action can coexist when the engine wants confirmation before committing a high-stakes action. A null decision *and* an "ask_user" next-action represents the engine genuinely not knowing.

## Anti-patterns

- **Dynamically-shaped output per surface.** "The chat surface gets prose; the API gets JSON" — now contract changes ripple through every surface. Pick one shape.
- **Reasoning crossing into user reply.** The string is for the audit log. If it ever ends up in the user's chat, you've lost the audit trail's confidentiality and probably leaked engine internals.
- **Abstain modeled as exception or error.** Engines that throw on unsure are engines that lie about confidence somewhere else.
- **Missing model_version.** Replay impossible. Drift detection impossible. The audit record is now a fingerprint without a referent.
- **Confidence as a categorical (high/med/low) instead of a number.** Loses information; surfaces can't apply their own thresholds.

## Eval

- **Schema-validity scorer.** Every emitted contract parses against a zod / pydantic schema. Mechanical, $0 per check.
- **Confidence calibration.** Bucket decisions by confidence; measure accuracy per bucket. A well-calibrated engine has accuracy ≈ confidence.
- **Abstain recall.** Labeled "should-have-abstained" cases (genuinely ambiguous, missing data, out of scope); assert the engine abstained instead of guessing.
- **Reasoning containment.** Adversarial: assert the `reasoning` field never appears in the surface-rendered output for any surface treatment.

## See also

- [forced-tool-call-output](forced-tool-call-output.md) — the contract IS a forced-tool-call output. This node names the specific shape decision engines need.
- [template-rendered-output](template-rendered-output.md) — surfaces render the contract via templates; the contract is what the templates consume.
- [engine-vs-conversation-routing](engine-vs-conversation-routing.md) — consumes the `next_action` field to choose surface treatment.
- [decision-audit-trail](decision-audit-trail.md) — consumes `input_fingerprint`, `model_version`, `reasoning` for the durable record.
