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

## Addendum — source-level read of 2609.00949 (same day)

The landing above was written from the abstract-level summary already in the graph. Reading the paper's LaTeX source and its released classifier (`action_classifier.py`, Apache-2.0, `fbj2333/tool-calling-calibration`) contradicted two things I had published, so both nodes were corrected in the follow-up commit.

**Correction 1 — `CONFIRM` means the opposite of what I assumed.** The released classifier's docstring: *"CONFIRM: text emission asserting task done / completed"*, with `CONFIRM_PHRASES` = `"task complete"`, `"all set"`, `"all done"`, `"no further actions"`, `"i have completed"`, … Consent-seeking is **not** `CONFIRM`: `ASK_PHRASES` contains `"please confirm"` and `"could you confirm"`. My first gate predicate excluded `CONFIRM` as a pending confirmation, which inverted the one class that actually carries the terminal signal. Corrected to `turn.terminal == CONFIRM ∧ turn.pending_work == ∅`.

The paper does use "confirm" in the consent sense — but in a *different* experiment (τ²-bench, confirmation before consequential writes), where gold comes from the benchmark's written policy that "the τ² reward never checks" and the per-write verdict comes from an **LLM judge (gpt-5.4)**. Two senses of one word, one deterministic and one judged; the node now says so explicitly.

**Correction 2 — the class is recovered, not emitted.** Method section: *"TOOL_CALL is decided from the emission's syntax, the other three from textual cues appearing anywhere in it,"* under the fixed priority `TOOL_CALL > REFUSE > ASK > CONFIRM > OTHER`, with `OTHER` ignored by GAR. My node presented the label as decided at generation time, which is the graph's *recommendation*, not the paper's finding — and it sat in direct tension with the node's own pitfall against "retro-fitting the label from text." Reframed: the cue classifier is a legitimate judge-free **bootstrap** (backfill history, validate the design before changing a response contract); the emitted enum is the contract version, and running both gives a free cross-check.

**Details worth having that the abstract does not carry:**

- Any `"?"` anywhere in an emission makes it `ASK`, checked *after* `REFUSE` precisely because refusals contain question marks.
- The code carries a typographic-quote normalization table with a comment saying RLHF-tuned models emit `’` in `can't`, and *"without this, REFUSE_PHRASES fails to match."* A cue table's failure mode is silent.
- `classify_turn` returns `terminal` (class of the last emission) and `has_tool_call` — the per-turn view a gate needs, distinct from the case-level `emit_set` the headline GAR uses.
- Case-level vs turn-level GAR: median ratio **1.23×**, four of fourteen cells above 1.5×, one at **2.22×**. Orderings are unchanged, so the paper's conclusions hold; a per-turn design that quotes the case-level number does not.
- The `+11.5 / −21.0 pp` split is **mechanism-mediated**: on the family that lost 21 pp, GAR was at the 100% ceiling before *and* after, so the damage was purely trajectory-level. Quoting the spread as "calibration is fragile" mis-states it.
- The authors' own limit: SRI and CRI *"are diagnostic instruments, not runtime interventions: they need the category-level gold action class … which is unknown in deployment."* That is exactly the split this thread needed — *what the agent did* is deterministic and borrowable; *what it should have done* is not, and the gate only needs the former.

**Process note.** The arXiv API was still returning 429s, but `https://arxiv.org/src/<id>` served the LaTeX tarball fine and GitHub raw served the classifier. When the API is throttled, the source route is both available and higher-fidelity — the two corrections above are only visible in the method section and the code, not in the abstract.
