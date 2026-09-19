---
id: 2026-09-18-industry-trend-catchup
type: thread
tags: [meta, research, trend-scan, eval, judge, skills, multi-turn, instrumentation]
related:
  - [[llm-as-judge]]
  - [[turn-outcome-signal]]
  - [[agent-trajectory-eval]]
  - [[cost-aware-eval]]
  - [[skill-lifecycle-and-drift]]
  - [[decision-audit-trail]]
  - [[escalation-handoff]]
  - [[adaptive-eval-budget]]
  - [[references-agent-skill-authoring]]
  - [[references-multi-turn-agent-eval]]
status: snapshot
created: 2026-09-18
summary: "7-day arXiv scan (2026-09-12 → 09-18): six nodes edited. A judge reading agents' own conclusions lands below chance; the prose channel under-reports state the structured channel records; and the volume method itself turned out to be biased by announcement lag."
---

# Thread — Industry Trend Catch-Up (2026-09-12 → 2026-09-18)

## Goal

Catch up on the week since the [previous sweep](2026-09-11-industry-trend-catchup.md), and land only what changes an existing claim. Secondary goal: close the [open question left by the 09-12 thread](2026-09-12-turn-outcome-signal.md) — does a paper exist that treats turn-outcome labelling as an instrumentation contract?

## Method, and why it changed

The Atom API (`export.arxiv.org`) has now refused this client across **four** attempts on three separate days, with cooldowns up to 120 s and spacing up to 25 s. So this sweep ran against **arXiv's HTML advanced search** instead, reading the exact total from the result headline rather than counting rows. It worked on the first try and has not throttled once.

Two method improvements over 09-11, both prompted by that thread's own caveats:

1. **The query strings are saved this time** (in `/tmp/hsweep.py`, reproduced by cluster in the volume table's construction). The 09-11 sweep lost its verbatim queries and had to reconstruct them, which made its comparison indicative only.
2. **The prior window was re-measured with the identical queries** rather than compared against the old backend's numbers. Cross-backend comparison would have been meaningless — the HTML search returns systematically different totals than the API for the same intent.

### The method bug this surfaced

The first pass reported **every cluster falling**, some by half. That was an artifact. Re-running the *same query over the same date window* about an hour later returned materially higher counts:

| Cluster | first pass | ~1 h later |
|---|---|---|
| LLM agent + benchmark/evaluation | 29 | **37** |
| tool use / MCP / tool calling | 41 | **51** |
| agent memory / long-term memory | 2 | **5** |

**A trailing window undercounts, because submission date is not announcement date.** Papers submitted in the last few days are not all indexed yet, so a window that ends today is still filling in. Three consecutive settled 4-day windows show no trend at all where the first pass showed collapse:

| Cluster | 09-04→09-07 | 09-08→09-11 | 09-12→09-15 |
|---|---|---|---|
| LLM agent + benchmark/evaluation | 36 | 50 | 37 |
| tool use / MCP / tool calling | 37 | 41 | 51 |
| prompt injection / agent security | 10 | 5 | 10 |
| multi-turn dialogue / conversational | 14 | 25 | 21 |
| agent skills / skill library | 5 | 8 | 4 |
| agent memory / long-term memory | 4 | 14 | 5 |
| prompt optimization | 3 | 5 | 2 |

**This retroactively weakens the 09-11 volume table**, whose newest window was fresh when measured. Its two headline movements — multi-turn nearly doubling, agent memory halving — were both computed against a window still filling in, which biases *downward* for the new window: multi-turn's rise may be understated and memory's fall may be partly artifact. Treat that table's per-day deltas as unreliable in the direction of the newest window, and **end future volume windows at least 4 days before the run date.**

So this thread publishes **no volume trend claim**. Week-scale cluster counts at this corpus size are dominated by announcement timing and by 4-day windows of 2–50 papers; the listings, not the counts, were the useful output.

## Landed

Six nodes edited, no new nodes — every finding sharpened a claim the graph already made.

| Change | Node | Source |
|---|---|---|
| New section: **a judge inherits the conclusions it reads** — 4.1% vs 60.3%, deleting the conclusion field is +41.2 pp, adherence 94.4% → 3.4%, and the conditional cost when upstream was right | [llm-as-judge](../nodes/concepts/llm-as-judge.md) | [2609.07680](https://arxiv.org/abs/2609.07680) |
| New section: **the prose channel under-reports** — structured reports carried rising workload/negative affect the textual responses seldom expressed; plus "state disclosure" and "escalation" named as specification dilemmas | [turn-outcome-signal](../nodes/concepts/turn-outcome-signal.md) | [2609.10724](https://arxiv.org/abs/2609.10724) |
| New section: **what the literature does not have** — the open question answered in the negative, with dialogue-act prediction named as the nearest neighbour and transition priors adopted as a validity check | same | [2604.18539](https://arxiv.org/abs/2604.18539) |
| New pitfall: **counting a restatement as progress** (redundant recovery passes a terminal gate cleanly) | same | [2604.27093](https://arxiv.org/abs/2604.27093) |
| New section: **the granularity question, answered by staging** — stage-wise between whole-trajectory and atomic-step, path-tolerant milestone graph from public views, terminate unrecoverable runs (45.41% of steps saved) | [agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md) | [2609.14637](https://arxiv.org/abs/2609.14637) |
| New section: **reliability is a separate family from correctness** — refusal 73% → 0% while table interpretation changed on 41 of 50 questions | same | [2609.09182](https://arxiv.org/abs/2609.09182) |
| New section: **marginal return, not total spend** — the scaling inflection point; splitting at it beat one long session by +264 Elo and ten short ones by +355 | [cost-aware-eval](../nodes/concepts/cost-aware-eval.md) | [2609.15309](https://arxiv.org/abs/2609.15309) |
| New section + pitfall: **repair needs state across rounds** — explicit attribution alone is insufficient | [skill-lifecycle-and-drift](../nodes/concepts/skill-lifecycle-and-drift.md) | [2609.15684](https://arxiv.org/abs/2609.15684) |
| New entry: **SkillSecurer** — >17% of popular published skills carry latent vulnerabilities; injection recorded at generation time so patches are checkable | [references-agent-skill-authoring](../nodes/references/references-agent-skill-authoring.md) | [2609.14079](https://arxiv.org/abs/2609.14079) |
| Two new entries: **CarryOnBench** (recovery after refusal; unsafe vs redundant recovery) and **MTAC-IFBench** (process-constraint compliance over 7-turn sessions) | [references-multi-turn-agent-eval](../nodes/references/references-multi-turn-agent-eval.md) | 2604.27093, [2609.14992](https://arxiv.org/abs/2609.14992) |

## The one finding worth reading twice

*Audit Without Verification* is the most load-bearing paper of the week, because it converts the graph's "demote the judge" advice from a stance into a mechanism with a measured effect size. An auditor asked to locate a fault from the **reports six agents filed** recovered the true origin in **4.1%** of cases — worse than a uniform guess (20%) and worse than always blaming the same link (31.0%) — while reaching **60.3%** from the raw documentation of the *same episodes*. Deleting one clause, the field carrying each agent's own conclusion, moved accuracy to **45.2% (+41.2 pp)** and collapsed adherence to the suggested culprit from **94.4% to 3.4%**.

The generalization: **an accountability layer needs evidence sufficiently independent of the conclusions it verifies.** "Verification layer the judge cannot override" was already in the graph; what was missing is that the layer must read *different bytes*, not the same bytes more carefully.

Worth noting for provenance hygiene: the paper's own pre-registered hypothesis (collective-responsibility framing degrades escalation with chain length) was **not supported**, and it says so. It also reports the honest counter-case — where the upstream suggestion was correct, deleting it *costs* accuracy (70.5% → 55.7%) — so the rule is conditional on upstream reliability. Both are recorded in the node.

## Reasoning the graph owns, not the sources

- **Empirical transition priors are a cheap validity check on an emitted enum.** 2604.18539 uses corpus-derived act transitions as a training regularizer; the graph borrows the observation, not the method — an outcome sequence your own logs say never occurs is more likely a labelling bug than a rare event. No cited paper proposes this use.
- **A redundant recovery defeats a terminal-class gate specifically.** CarryOnBench names the failure mode for safety evaluation; connecting it to a product gate that fires on completion is this graph's step.
- **Early termination is an evidence argument, not only a cost argument.** DynSTEER reports the saving; the reading that the remaining steps of a failed rollout carry almost no signal is the graph's.

## What failed to verify

- **The Atom API, again** — four attempts across three days, now consistently 429 with occasional 503. Treat it as unavailable for this client and use the HTML search route. This is no longer a transient to retry.
- **Two targeted queries returned mostly noise and were abandoned**, not merely unproductive: "conversation + resolution + detect" matched image super-resolution and object detection; "escalation + agent" returned 375 hits that are overwhelmingly *privilege* escalation. Recorded because the vocabulary collision will recur for anyone searching this area.
- **No volume trend is claimed** for this window, for the announcement-lag reason above.

## Process notes

- **arXiv's HTML advanced search is the working route while the API throttles.** Read the exact total from the `<h1 class="title is-clearfix">` headline (`Showing 1–20 of 20 results`) rather than counting result rows, so a size-capped page still reports its true total. Same corpus, no throttle observed across ~40 requests at 3–4 s spacing.
- **Measure both windows with the same backend and the same query strings, and save the strings.** Two of the 09-11 thread's caveats were avoidable and are now avoided.
- **End a volume window several days before the run date.** The lag is large enough to invert the sign of a week-scale comparison.
