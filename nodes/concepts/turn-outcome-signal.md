---
id: turn-outcome-signal
type: concept
tags: [conversation, instrumentation, telemetry, output-contract, eval, agents]
summary: "downstream hooks fire on 'the conversation ended and nothing is owed' — a predicate no transcript stores; emit a required turn-outcome enum at generation time instead of inferring resolution after the fact."
related:
  - [[domain-chatbot-design]]
  - [[llm-output-design]]
  - [[turn-taking-and-proactivity]]
  - [[confirm-before-act]]
  - [[escalation-handoff]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
  - [[live-traffic-eval]]
  - [[agent-trajectory-eval]]
  - [[llm-observability]]
  - [[llm-as-judge]]
  - [[references-multi-turn-agent-eval]]
status: living
created: 2026-09-12
source-thread: [[2026-09-12-turn-outcome-signal]]
---

# Turn-Outcome Signal

Plenty of product decisions hang off one predicate: **the exchange reached a terminal state and the user owes nothing.** Fire a satisfaction prompt. Offer the next action. Close the thread. Suppress a follow-up nudge. Stop the retention timer.

The predicate is easy to state and almost never stored. A transcript records *what was said*; the hook needs to know *whether anything is still open* — and that is a property of the turn the agent just took, decided at the moment it took it and then thrown away.

## Why a post-hoc resolver is the wrong instrument

The tempting fix is to ask a model, per conversation, "is this resolved?" Three reasons not to:

1. **It re-derives what the generator already knew.** The agent chose to ask a question, or not; to request confirmation, or not. That choice was made with full state. A later reader reconstructs it from prose, with less.
2. **It makes a product gate non-deterministic.** The same transcript can resolve differently across runs, model versions, and prompt edits. Anything that fires an outward-facing action needs to be replayable — you must be able to say *why* a prompt fired for a specific conversation six weeks ago.
3. **It puts a judge in the load-bearing position** the graph already argues against ([llm-as-judge](llm-as-judge.md)): a judge whose verdict *decides what happens* rather than annotating what happened, with no deterministic layer above it.

Cost is the least of it, but per-turn judge calls on every conversation in production is a real line item ([cost-aware-eval](cost-aware-eval.md)).

## The named proxy: an action class, recorded per turn

The instrument to borrow is the four-class action space from the multi-turn tool-calling diagnostic — **TOOL_CALL / ASK / REFUSE / CONFIRM** ([arXiv:2609.00949](https://arxiv.org/abs/2609.00949), Findings of EMNLP 2026). Its purpose there is evaluation, but the shape is what a hook needs: a small, closed, mutually exclusive label for *what the agent did this turn*.

Two of its findings argue for storing the label rather than inferring it:

- Its self-revealing bound **Acc ≤ GAR** (gold action recall) only computes if the action class exists per turn. Without it, there is nothing to compare against.
- Aggregate outcome metrics **mask action-class miscalibration** that, in the paper's terms, the state grader cannot see — a run can be scored as successful while the agent asked when it should have acted. A pipeline that stores outcomes but not action classes inherits exactly that blind spot, and a "resolved?" resolver reading the same records cannot recover the missing distinction.

The gate then becomes a field lookup:

```
nothing_owed  ⟺  turn.action ∈ terminal_classes
                 ∧ turn.action ∉ {ASK, CONFIRM_pending}
                 ∧ turn.pending_work == ∅
```

**REFUSE is the edge case worth deciding explicitly** — *this graph's reasoning, not the paper's*: a refusal is terminal **and** action-free, so it satisfies a naive "nothing owed" gate while being among the worst moments to ask for a rating or offer an upsell. Give it its own bucket. The general rule: *terminal* and *satisfied* are different predicates, and only the first is cheap.

## Emit it, don't infer it

Make the outcome a **required enum field of the response contract**, not a comment in the prose. This is the same structural move as [forced-tool-call-output](forced-tool-call-output.md): the desired property stops being something the model might comply with and becomes something the output *cannot omit*. Validate the enum at the boundary ([schema-vs-validator](schema-vs-validator.md)) — an unparseable or absent outcome is a failed turn, not a defaulted one.

Three practical constraints:

- **Closed set, no catch-all.** An `OTHER` bucket becomes the majority class within a quarter and the gate silently degrades to "always fire."
- **One outcome per delivered turn**, attached to the turn, not the session. Sessions get their state by folding turn outcomes, never the reverse.
- **Version the enum** and treat a change as an instrument change — historical gate decisions were made under the old set and are not comparable ([eval-dataset-quality](eval-dataset-quality.md), [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)).

The closing taxonomy in [turn-taking-and-proactivity](turn-taking-and-proactivity.md) is a good starting vocabulary — action completed, handoff completed, user ended it — with `ASK`, `CONFIRM_pending` and `REFUSE` as the non-terminal and terminal-but-unsatisfied cases.

## Backtest the proxy without a judge

Any named proxy is a hypothesis; the next user turn scores it. Mining production trajectories for **implicit dissatisfaction — corrections, rephrasing, abandonment** — needs no explicit feedback collection and no labels ([arXiv:2608.09153](https://arxiv.org/abs/2608.09153); see [live-traffic-eval](live-traffic-eval.md)). Applied here: a turn the proxy called terminal that is followed by a correction or a rephrase inside the session window was a **false positive**, and the rate is computable from logs you already have.

Two honest limits. Those signals are noisy proxies for dissatisfaction, so the result bounds the gate's precision rather than establishing ground truth. And the label's meaning is **not portable across model families** — in the same action-class study, a single context perturbation moved accuracy **+11.5 vs −21.0 pp** across families — so re-measure after a model swap instead of carrying the old precision number forward.

## Pitfalls

- **Treating "no question asked" as resolution.** An agent that silently drops a request also asks nothing. Terminal needs a positive assertion of completion, not the absence of an ASK.
- **Firing on a mid-flight turn.** A tool call in progress is action-free from the user's side and not terminal. Pending work must be part of the predicate.
- **Retro-fitting the label from text.** Backfilling historical turns with a model produces a column that looks like the emitted one and does not mean the same thing. Mark backfilled rows as a different provenance, or leave them null.
- **Letting the product gate own the enum.** If the values are named after the hooks that consume them (`SHOULD_SHOW_SURVEY`), the next hook needs a new enum. Name them after what the agent did.
- **Assuming one threshold fits every hook.** Suppressing a nudge tolerates false positives; asking for a rating does not. Same signal, different acceptable error direction.
