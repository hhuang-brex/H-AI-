---
id: turn-outcome-signal
type: concept
tags: [conversation, instrumentation, telemetry, output-contract, eval, agents]
summary: "downstream hooks fire on 'the conversation ended and nothing is owed' — a predicate no transcript stores; name a deterministic action class per turn (recovered from cues to bootstrap, emitted as a required enum to ship) instead of asking a judge whether it was resolved."
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

## The named proxy: an action class per turn

The vocabulary to borrow is the four-class action space from the multi-turn tool-calling diagnostic — **TOOL_CALL / ASK / REFUSE / CONFIRM**, plus a residual **OTHER** — from [arXiv:2609.00949](https://arxiv.org/abs/2609.00949) (Findings of EMNLP 2026). Its purpose there is evaluation, but the shape is what a hook needs: small, closed, mutually exclusive, one label per emission.

Two of its findings argue for having the label at all:

- Its self-revealing bound **Acc ≤ GAR** (gold action recall) is not computable without it. No stored class, no bound, no way to see the failure.
- Aggregate outcome metrics **mask action-class miscalibration** the state grader cannot see — a run scores as successful while the agent asked when it should have acted. A store that keeps outcomes but not action classes inherits that blind spot by construction, and a later "resolved?" pass over the same records cannot recover what was never distinguished.

**Read the class names against the released classifier, not against intuition** (`action_classifier.py`, Apache-2.0, read 2026-09-12). Their meanings are not the obvious ones:

| Class | What it actually means there | Terminal? |
|---|---|---|
| `TOOL_CALL` | emission parses as a function call (syntax, not cues) | no — work in flight |
| `REFUSE` | states the action is impossible/unauthorized (`"cannot"`, `"not available"`, `"not authorized"`) | yes, and **unsatisfied** |
| `ASK` | a question mark **anywhere**, or an asking phrase — and the consent-seeking phrases `"please confirm"` / `"could you confirm"` land here | no |
| `CONFIRM` | asserts the task is **done** (`"all set"`, `"task complete"`, `"no further actions"`) | **yes — this is the signal** |
| `OTHER` | no decision signalled; GAR ignores it | undefined |

So `CONFIRM` is a *completion assertion*, not a pending confirmation — and a request for consent is an `ASK`. The paper uses "confirm" in a second, consent sense in its τ²-bench experiment (§Confirmation before consequential actions), and that sense is **not** the cue-list class: it is judged per database write by an LLM judge (gpt-5.4). Do not mix the two.

The gate is then a field lookup, using the classifier's per-turn *terminal* view (the class of the last emission in the turn):

```
nothing_owed  ⟺  turn.terminal == CONFIRM
                 ∧ turn.pending_work == ∅
```

with `ASK` and `TOOL_CALL`-in-flight excluded by construction, and **`REFUSE` given its own bucket** — *this graph's reasoning, not the paper's*: a refusal is terminal **and** action-free, so it passes a naive "nothing owed" test at one of the worst moments to ask for a rating. *Terminal* and *satisfied* are different predicates, and only the first is cheap.

## Emit it, don't infer it — but the classifier is a legitimate bootstrap

**The paper does not emit the class; it recovers it.** `TOOL_CALL` comes from emission syntax and the other three from **cue phrases matched anywhere in the text**, under a fixed priority `TOOL_CALL > REFUSE > ASK > CONFIRM > OTHER`. That is a deterministic, auditable, judge-free classifier — which is exactly what a store lacking the field needs in order to backfill history and validate a design before shipping a contract change.

It is also brittle in ways a production gate feels immediately: the phrase tables are English-only and tuned on a benchmark; **any question mark makes the turn an `ASK`**; and the released code carries a typographic-quote normalization step *specifically* because RLHF-tuned models emit `’` in `can't`, and without it `REFUSE` silently stops matching. A cue table is a bootstrap, not a contract.

The contract version — *this graph's recommendation, not the paper's finding* — is to make the outcome a **required enum field of the response**, the same structural move as [forced-tool-call-output](forced-tool-call-output.md): the property stops being something the model might comply with and becomes something the output *cannot omit*. Validate the enum at the boundary ([schema-vs-validator](schema-vs-validator.md)) — an absent or unparseable outcome is a failed turn, not a defaulted one. Run the classifier alongside it for a while: disagreement between the emitted enum and the recovered label is a free monitor on both.

Three practical constraints:

- **No catch-all on the emitting side.** The paper can afford a residual `OTHER` because GAR ignores it; a contract cannot — an optional escape value becomes the majority class within a quarter and the gate silently degrades to "always fire." If the model must be able to say "no decision," make that value *block* the gate and alarm on its rate.
- **One outcome per delivered turn**, attached to the turn, not the session. Sessions get their state by folding turn outcomes, never the reverse.
- **Version the enum** and treat a change as an instrument change — historical gate decisions were made under the old set and are not comparable ([eval-dataset-quality](eval-dataset-quality.md), [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)).

The closing taxonomy in [turn-taking-and-proactivity](turn-taking-and-proactivity.md) is a better starting vocabulary than the paper's four classes, because it splits the terminal side the way a product hook needs — action completed, handoff completed, user ended it — where the classifier has only the single `CONFIRM`. Keep `ASK` (including consent requests) and in-flight `TOOL_CALL` as the non-terminal values and `REFUSE` as terminal-but-unsatisfied.

## Backtest the proxy without a judge

Any named proxy is a hypothesis; the next user turn scores it. Mining production trajectories for **implicit dissatisfaction — corrections, rephrasing, abandonment** — needs no explicit feedback collection and no labels ([arXiv:2608.09153](https://arxiv.org/abs/2608.09153); see [live-traffic-eval](live-traffic-eval.md)). Applied here: a turn the proxy called terminal that is followed by a correction or a rephrase inside the session window was a **false positive**, and the rate is computable from logs you already have.

Two honest limits. Those signals are noisy proxies for dissatisfaction, so the result bounds the gate's precision rather than establishing ground truth. And the label's meaning is **not portable across model families** — in the same action-class study one intervention moved task accuracy **+11.5 pp on one family and −21.0 pp on another** — so re-measure after a model swap instead of carrying the old precision number forward. The mechanism matters for reading that number: on the losing family the emitted-class rate was already at ceiling *before and after*, so the loss was entirely in what the re-decoded trajectory then did, not in which class it named. A signal can stay correct while everything downstream of it changes.

## Pitfalls

- **Treating "no question asked" as resolution.** An agent that silently drops a request also asks nothing. Terminal needs a positive assertion of completion, not the absence of an ASK.
- **Firing on a mid-flight turn.** A tool call in progress is action-free from the user's side and not terminal. Pending work must be part of the predicate.
- **Mixing recovered and emitted labels in one column.** A cue-classified backfill and a model-emitted enum can disagree on the same turn and neither is wrong; storing them under one name destroys the disagreement, which was the useful part. Separate provenance, always.
- **Reading a case-level rate as a per-turn rate.** The paper's headline GAR is case-level *any-turn* ("did it ever emit the gold class"). Recomputed at the turn level on 14 cells, the median case/turn ratio is **1.23×** and one cell reaches **2.22×** — so a case-level number overstates per-turn behaviour by roughly a quarter, and the gate is a per-turn object.
- **Letting `OTHER` sit in the gate's path.** GAR simply ignores the residual class; a production gate cannot. Decide explicitly whether an undecidable turn blocks or passes, and alarm on its rate.
- **Letting the product gate own the enum.** If the values are named after the hooks that consume them (`SHOULD_SHOW_SURVEY`), the next hook needs a new enum. Name them after what the agent did.
- **Assuming one threshold fits every hook.** Suppressing a nudge tolerates false positives; asking for a rating does not. Same signal, different acceptable error direction.
