---
id: task-agent-pattern-fanout
type: project
tags: [task-agent, decision-engine, fan-out, design, proposal]
related:
  - [[domain-chatbot-design]]
  - [[llm-output-design]]
  - [[llm-evaluation]]
  - [[forced-tool-call-output]]
  - [[output-surface-taxonomy]]
status: archived
created: 2026-06-09
---

# Task-Agent Pattern Fan-Out — Design Spec

Spec for adding a **task-agent / decision-engine** cluster to the H-AI- graph. Captures the framing "it's a task agent that happens to chat — the engine is given-X-produce-Y; chat is one surface among several."

## Goal

The graph is currently chat-centric. A read of any topic optimizes for *the turn*. But many production systems — including the one motivating this spec — are actually **decision engines** with chat as one rendering surface. The unit of value is the decision, not the turn. The unit of audit is the decision, not the transcript. The unit of evaluation is the decision against ground truth, not chat-quality.

This fan-out adds the missing framing without invalidating existing nodes. Chat-centric concepts stay correct *for chat surfaces*; engine-centric concepts get their own home.

## Non-goals

- **Not** a global reframe of existing nodes. Chat concepts remain valid for chat surfaces; we don't rewrite them.
- **Not** a per-node frontmatter `applies-to:` tag. Tagging every node is brittle; we centralize the reframing in one audit table.
- **Not** a domain-specific (Brex / fintech) artifact. The engine framing is generic; the worked example (transactions → documentation decisions) is illustrative, not the topic name.

## Out of scope (might land later)

- `confidence-abstain-escalate` as a separate node — folded into `decision-engine-contract` for now.
- `decision-idempotency-replay` — partially covered by `conversation-memory` and `prod-shadow-replay`; revisit if needed.
- Per-node frontmatter tag for engine vs. surface — not done; centralized audit table is the source of truth.
- Worked code samples (typed contract example, router pseudocode) — kept abstract; concrete examples can come as a follow-up project node.

## What ships

### 1 new topic + 3 new concepts + 1 thread + 8 See-also additions

```
NEW
  nodes/topics/task-agent-pattern.md
  nodes/concepts/decision-engine-contract.md
  nodes/concepts/engine-vs-conversation-routing.md
  nodes/concepts/decision-audit-trail.md
  threads/2026-06-09-task-agent-pattern.md

EDITED (one See-also bullet each)
  nodes/topics/domain-chatbot-design.md
  nodes/concepts/output-surface-taxonomy.md
  nodes/concepts/forced-tool-call-output.md
  nodes/concepts/template-rendered-output.md
  nodes/concepts/prod-shadow-replay.md
  nodes/concepts/escalation-handoff.md
  nodes/concepts/intent-and-disambiguation.md
  nodes/projects/agent-eval-improvement-tiers.md
  README.md  (new "Task-Agent Pattern" section + topic entry)
```

## Node specs

### `task-agent-pattern` (topic)

**Front-matter:** `type: topic`, `status: living`, related to [domain-chatbot-design](../topics/domain-chatbot-design.md), [llm-output-design](../topics/llm-output-design.md), [llm-evaluation](../topics/llm-evaluation.md), the three new concepts.

**Body sections:**

1. **Why this is a different pattern.** Chat-centric design optimizes the turn; task-agent design optimizes the decision. Unit of value, audit, eval all shift.
2. **The layered output.** Typed `decision` + `confidence` + `next_action ∈ {classify, ask_user, escalate, approve, abstain}` + reasoning + model_version + input_fingerprint. Same shape across surfaces.
3. **Surfaces are downstream.** Chat renders `ask_user` as a question; API returns the typed decision; batch writes to a queue; draft UI shows a confirmable preview. Engine doesn't know which surface consumed.
4. **Reframing audit table** (inline; three columns):

| Engine-relevant (apply regardless of surface) | Surface-specific (chat / SMS) | Cross-cutting (both) |
|---|---|---|
| forced-tool-call-output, template-rendered-output, paginated-tool-contract, code-execution-sandbox-pattern, domain-knowledge-injection, grounding-and-citation, action-authority, safety-rails-domain-specific, llm-as-judge, agent-trajectory-eval, golden-snapshot-eval, adversarial-eval, cost-aware-eval, layered-defense-pipeline | truncated-pyramid-results, intent-and-disambiguation, repair-and-clarification, turn-taking-and-proactivity, streaming-vs-structured, message-segmentation-160, all sms-*, thread-disambiguation-prompts, flat-channel-thread-tracking, async-conversation-pacing, persona-tone-compliance, operator-trust-injection, conversation-memory | output-surface-taxonomy, hard-surface-irrevocability, schema-vs-validator, escalation-handoff, scope-and-refusal, recency-bias-prompt-design |

5. **Sub-topics** — links to the three new concepts.
6. **How this connects to the rest of the graph** — short paragraph pointing to existing eval / output-design / conversation-design topics with the engine-vs-surface distinction.

### `decision-engine-contract` (concept)

**Front-matter:** related to [task-agent-pattern](../topics/task-agent-pattern.md), [forced-tool-call-output](../concepts/forced-tool-call-output.md), [template-rendered-output](../concepts/template-rendered-output.md), [engine-vs-conversation-routing](../concepts/engine-vs-conversation-routing.md), [decision-audit-trail](../concepts/decision-audit-trail.md).

**Body sections:**

1. **The wire format.** Code block showing the layered shape (`decision_id`, `input_fingerprint`, `model_version`, `decision | null`, `confidence`, `next_action`, `next_action_payload`, `reasoning`, `timestamp`).
2. **Same shape across surfaces.** A surface change should never require a contract change.
3. **`decision` is null when the next-action is unsure.** Confident classification produces both decision + classify/approve. Unsure paths produce only the next-action.
4. **Confidence is a field, not a separate branch.** Surfaces apply their own thresholds.
5. **Reasoning is audit-only.** Never crosses to user-facing output. Same hard line as [operator-trust-injection](../concepts/operator-trust-injection.md).
6. **Abstain is a first-class value, not an error.**
7. **`model_version` and `input_fingerprint` are mandatory.** They make the decision replayable and auditable. Tied to [decision-audit-trail](../concepts/decision-audit-trail.md).
8. **Anti-patterns.** Dynamically-shaped output per surface; reasoning crossing into user reply; abstain modeled as exception/error; missing model_version.
9. **Eval.** Schema-validity scorer over every emitted contract; confidence calibration; abstain-recall against labeled "should-have-abstained" cases.

### `engine-vs-conversation-routing` (concept)

**Front-matter:** related to [task-agent-pattern](../topics/task-agent-pattern.md), [decision-engine-contract](../concepts/decision-engine-contract.md), [intent-and-disambiguation](../concepts/intent-and-disambiguation.md), [escalation-handoff](../concepts/escalation-handoff.md), [output-surface-taxonomy](../concepts/output-surface-taxonomy.md).

**Body sections:**

1. **The two routing decisions.**
   - **Inbound → engine or chat?** Engine-shaped (a transaction or new info on a pending decision) vs. chat-shaped (FAQ, navigation, status, "how does this work") vs. mixed (handle the engine part as the action; chat layer answers the rest as follow-up).
   - **Engine output → which surface treatment?** `next_action` selects: `classify`/`approve` → silent commit + optional confirm; `ask_user` → chat-driven clarification turn with `next_action_payload` as the question; `escalate` → handoff; `abstain` → human-review queue, no chat reply.
2. **Why this is its own node.** Without it, every team conflates "the bot decided" with "the bot replied." Either always-decides (when it shouldn't) or never-decides (when the engine should be invoked).
3. **The router as architecture.** A small, explicit classifier — not a free-text intent guess — gates the engine call.
4. **Anti-patterns.** Calling the engine on every inbound; calling the chat layer on every inbound; "mixed" intent silently dropping the chat-shaped half; the router itself being an LLM judgment with no eval.
5. **Eval.** Labeled inbounds → routing class precision/recall; per-next-action surface treatment correctness; mixed-intent dual-handling assertion.

### `decision-audit-trail` (concept)

**Front-matter:** related to [task-agent-pattern](../topics/task-agent-pattern.md), [decision-engine-contract](../concepts/decision-engine-contract.md), [prod-shadow-replay](../concepts/prod-shadow-replay.md), [cost-aware-eval](../concepts/cost-aware-eval.md), [agent-eval-improvement-tiers](agent-eval-improvement-tiers.md).

**Body sections:**

1. **The unit of audit is the decision, not the turn.** Differs from chat logging.
2. **Required fields.** `decision_id`, `input_fingerprint`, `model_version`, `decision` (full layered output), `reasoning`, `consumer_surface`, `override_history[]` (with timestamp + reason), `replay_decision[]` (diff vs. newer model).
3. **Why this earns its own node.**
   - Different consumers (compliance review, drift detection) from chat audit.
   - Different retention (decisions outlive conversations).
   - Drives drift detection — monthly diff of replay_decision against historical decision is the highest-leverage drift signal.
   - Drives prod-replay shadow at the engine level — replay decisions, not trajectories.
4. **Storage shape.** Append-only; decision_id-keyed; consumer_surface as a column for slicing.
5. **Anti-patterns.** Audit only when something goes wrong; reasoning omitted from audit; override_history not tracked; conflating chat transcript with decision audit.
6. **Eval.** Audit-completeness assertion (every decision has all required fields); replay coverage (newer-model diff exists for at least N% of decisions); override-rate trend (drift signal).

### `2026-06-09-task-agent-pattern` (thread)

Standard thread node anchoring this fan-out. Sections: source (this brainstorming session), method (skill-driven design with three clarifying questions), outputs (links to all four new nodes), key insights captured, connection to existing graph.

## See-also additions to existing nodes

Each is a single bullet appended to the target node's "See also" section:

- `domain-chatbot-design` → "[task-agent-pattern](../topics/task-agent-pattern.md) — higher-altitude framing where chat is one surface of a decision engine"
- `output-surface-taxonomy` → "[task-agent-pattern](../topics/task-agent-pattern.md) and [decision-engine-contract](decision-engine-contract.md) — what the surface taxonomy routes to"
- `forced-tool-call-output` → "[decision-engine-contract](decision-engine-contract.md) — the contract IS a forced-tool-call output"
- `template-rendered-output` → "[decision-engine-contract](decision-engine-contract.md), [engine-vs-conversation-routing](engine-vs-conversation-routing.md) — templates render decisions and next-actions"
- `prod-shadow-replay` → "[decision-audit-trail](decision-audit-trail.md) — the substrate engine-level replay runs on; replay decisions, not trajectories"
- `escalation-handoff` → "[engine-vs-conversation-routing](engine-vs-conversation-routing.md) — escalate is one of the engine's next-action values"
- `intent-and-disambiguation` → "[engine-vs-conversation-routing](engine-vs-conversation-routing.md) — engine-vs-chat is a higher-altitude intent classifier"
- `agent-eval-improvement-tiers` → "[decision-audit-trail](decision-audit-trail.md) — audit-driven drift detection slots into Tier 4 (online signal)"

## README change

Two edits:

1. **Add to topics list** (alphabetical-ish under the others):
   `- [task-agent-pattern](nodes/topics/task-agent-pattern.md) — engine-primary framing where chat is one surface among several.`

2. **New section after Topics, before existing concept sections:**

```
### Concepts — Task-Agent Pattern
- [decision-engine-contract](nodes/concepts/decision-engine-contract.md) — layered output (decision + confidence + next-action) as the wire format every surface consumes.
- [engine-vs-conversation-routing](nodes/concepts/engine-vs-conversation-routing.md) — when the engine handles vs. when the chat layer handles; the bridge between them.
- [decision-audit-trail](nodes/concepts/decision-audit-trail.md) — durable per-decision record (fingerprint + version + reasoning + override history); the substrate replay/drift run on.
```

3. **Add thread to the Threads list:**
   `- [2026-06-09-task-agent-pattern](threads/2026-06-09-task-agent-pattern.md) — origin of the task-agent-pattern cluster.`

## Risks & open questions

- **Risk: `decision-audit-trail` overlaps `prod-shadow-replay`.** Mitigation: the spec frames audit as the *substrate* replay runs on, not a competing pattern. If the overlap proves too large in practice, fold audit into prod-shadow-replay's body and demote to a section.
- **Risk: the audit table goes stale.** New nodes added without updating the `task-agent-pattern` table will silently drift. Mitigation: AGENTS.md gets a one-line addition saying "if the new node is task-agent-relevant, also update the audit table in `task-agent-pattern.md`."
- **Open: should `intent-and-disambiguation` move to "cross-cutting" instead of "surface-specific"?** It's *also* doing engine-side work (engine-vs-chat routing is a higher-altitude intent classifier). The new `engine-vs-conversation-routing` node carries that part, so I'm leaving `intent-and-disambiguation` as surface-specific — but flag for review.
- **Open: copy-pastable typed contract example.** Skipped to keep the node generic. If readers find the spec too abstract, a follow-up `task-agent-pattern-worked-example` project node can show a real schema.

## Success criteria

- A reader landing on `task-agent-pattern` understands within 60 seconds that this is a different framing from `domain-chatbot-design` and which existing concepts apply to their engine.
- A team building a new task agent uses `decision-engine-contract` as their wire-format checklist on day 1.
- An engineer reading `engine-vs-conversation-routing` can name the four next-action surface treatments without re-reading.
- `decision-audit-trail` is the node someone cites when asked "how do you do drift detection at the decision level?"

## Implementation steps

1. Write the four new nodes + thread node.
2. Apply the eight See-also edits.
3. Update README.
4. Run wiki-to-markdown converter.
5. Commit (no push) — pause for user review.
6. After user approval, push with `SKIP_ORIGIN_CHECK=1`.
