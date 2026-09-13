---
id: 2026-09-12-turn-outcome-signal
type: thread
tags: [meta, research, conversation, instrumentation, output-contract]
related:
  - [[turn-outcome-signal]]
  - [[turn-taking-and-proactivity]]
  - [[confirm-before-act]]
  - [[escalation-handoff]]
  - [[live-traffic-eval]]
  - [[forced-tool-call-output]]
status: snapshot
created: 2026-09-12
summary: "a product gate defined as 'terminal outcome, no user action' has no stored field to key on — landing the action-class enum as the named deterministic proxy, with the next user turn as its backtest."
---

# Thread — The No-Action Gate Needs a Stored Field

## The question

A hook wants to fire only when an exchange reached a **terminal outcome with no user action outstanding**. The conversation store holds outcomes but no per-turn record of *what the agent did* — asked, confirmed, refused, acted — so the predicate has nothing to evaluate. An LLM "is this resolved?" pass was ruled out up front: it is non-deterministic in a position that must be replayable, and it re-derives a decision the generator already made with better state.

So the question was narrow: **is there a named, deterministic proxy in the literature**, or does this have to be invented locally?

*(Written generically. The originating case is internal and its identifiers are not citable externally, per the repo's own rule on what may enter the graph.)*

## What was found

One paper is directly on point, and it was already verified at the primary source in the [2026-09-11 sweep](2026-09-11-industry-trend-catchup.md) — the action-class diagnostic, [arXiv:2609.00949](https://arxiv.org/abs/2609.00949) (Findings of EMNLP 2026). Its **TOOL_CALL / ASK / REFUSE / CONFIRM** space was built for evaluation, but it is exactly the shape a hook needs: small, closed, mutually exclusive, and decided at generation time.

Two of its results argue for *storing* the label rather than inferring it later:

- **`Acc ≤ GAR` only computes if the class exists per turn.** No stored class, no bound, no way to detect the failure.
- **Aggregate outcome metrics mask action-class miscalibration** the state grader cannot see. A store that keeps outcomes but not action classes inherits that blind spot by construction — which is the same gap as the one that prompted this thread, one layer down.

The second source is the backtest rather than the signal: TRACE ([arXiv:2608.09153](https://arxiv.org/abs/2608.09153), already in [live-traffic-eval](../nodes/concepts/live-traffic-eval.md)) mines **corrections, rephrasing, abandonment** from production trajectories with no labels and no feedback collection. Applied to a stored outcome label, a turn marked terminal that is followed by a correction is a labelled false positive — so the gate's precision becomes a log query, not a judge call.

## Landed

| Change | Node |
|---|---|
| **New node** — the predicate, why a post-hoc resolver is the wrong instrument, the action-class enum as the proxy, emit-don't-infer, the log-only backtest, five pitfalls | [turn-outcome-signal](../nodes/concepts/turn-outcome-signal.md) |
| Closing taxonomy now says the closing state must be *recorded* once anything fires off it; terminal ≠ satisfied | [turn-taking-and-proactivity](../nodes/concepts/turn-taking-and-proactivity.md) |
| A confirm is also a **non-terminal** turn, and downstream must see that without re-reading prose | [confirm-before-act](../nodes/concepts/confirm-before-act.md) |
| A completed handoff is terminal *for the bot* while the user's problem is still open | [escalation-handoff](../nodes/concepts/escalation-handoff.md) |
| Second use for mined dissatisfaction signals: scoring a deterministic proxy you already emit | [live-traffic-eval](../nodes/concepts/live-traffic-eval.md) |

## Reasoning the graph owns, not the sources

- **REFUSE needs its own bucket.** A refusal is terminal *and* action-free, so it passes a naive "nothing owed" gate at the worst possible moment to ask for a rating. Neither cited paper says this; it follows from applying an eval taxonomy to a product trigger.
- **Name the values after what the agent did, not after the hook that consumes them.** An enum called `SHOULD_SHOW_SURVEY` needs a new enum for the next consumer.
- **The acceptable error direction differs per hook** — suppressing a nudge tolerates false positives, asking for a rating does not — so one label can serve several gates at different thresholds, but not one shared threshold.

## What failed to verify

A fresh targeted sweep (dialogue-act labelling, resolution/unresolved detection, escalation triggers, implicit-satisfaction mining) **did not run**: arXiv returned sustained 429s and one 503 across three attempts, including a run with a 120 s cooldown and 25 s spacing after the previous day's volume queries. So this thread does **not** claim the literature was surveyed — only that the two sources it cites were verified at the primary source. The open question stands: whether a paper exists that treats turn-outcome labelling as an instrumentation contract rather than an eval taxonomy.

## Process notes

- The arXiv API throttles per client over a longer horizon than a single session's spacing suggests: 6 s spacing worked for ten queries on 09-11 and a burst on 09-12 was refused for the rest of the day. Budget sweeps a day apart, not an hour.
- Redirect Python output through `-u` when a long-running query script runs in the background, or the log stays empty until exit and interim progress is invisible.
