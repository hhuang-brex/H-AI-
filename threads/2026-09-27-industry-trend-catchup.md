---
id: 2026-09-27-industry-trend-catchup
type: thread
tags: [meta, research, trend-scan, eval, judge, execution-safety, audit, idempotency, memory, state]
related:
  - [[2026-09-18-industry-trend-catchup]]
  - [[llm-as-judge]]
  - [[idempotency-keys]]
  - [[decision-audit-trail]]
  - [[confirm-before-act]]
  - [[agent-trajectory-eval]]
  - [[checkpoint-and-replay]]
  - [[adaptive-eval-budget]]
  - [[run-state-model]]
  - [[self-improving-harness]]
  - [[memory-poisoning]]
  - [[step-budget-and-runaway-control]]
  - [[references-multi-turn-agent-eval]]
  - [[references-eval-reading-list]]
  - [[references-agent-skill-authoring]]
status: snapshot
created: 2026-09-27
summary: "9-day arXiv scan (2026-09-17 → 09-26): fourteen nodes edited. The week's theme is self-written evidence — judges read the agent's log, agents delete their traces, and duplicating agents report success."
---

# Thread — Industry Trend Catch-Up (2026-09-17 → 2026-09-26)

## Goal

Catch up on the nine days since the [previous sweep](2026-09-18-industry-trend-catchup.md) and land only what changes an existing claim. Listings covered 2026-09-17 → 09-26 with already-cited ids excluded; volume used settled windows ending 2026-09-23.

## Method

The sweep ran on `tools/arxiv-sweep.py` (arXiv HTML advanced search, as in 09-18). No throttling across ~70 requests. Every paper cited below had its abstract page fetched on 2026-09-27; numbers are taken from those abstracts, not from full texts.

Two new method findings, both now encoded as warnings in the tool:

1. **Settled counts still drift.** The 09-12 → 09-15 window, "settled" when measured on 09-18, came back lower nine days later with identical queries:

| Cluster | on 09-18 | on 09-27 |
|---|---|---|
| LLM agent + benchmark/evaluation | 37 | 34 |
| tool use / MCP / tool calling | 51 | 47 |
| multi-turn dialogue | 21 | 20 |
| agent skills / skill library | 4 | 3 |

   Settling removes the large upward bias from announcement lag but leaves roughly ±10% of search-index noise.

2. **Windows differ in weekday count.** Four-day windows hold two or three weekdays depending on where they start, and submissions dip on weekends. The 09-12 → 09-15 window has two weekdays; the next two have three each.

| Cluster | 09-12→09-15 (2 wkdy) | 09-16→09-19 (3) | 09-20→09-23 (3) |
|---|---|---|---|
| LLM agent + benchmark/evaluation | 34 | 40 | 50 |
| tool use / MCP / tool calling | 47 | 46 | 56 |
| prompt injection / agent security | 10 | 13 | 8 |
| multi-turn dialogue | 20 | 23 | 24 |
| agent skills / skill library | 3 | 4 | 4 |
| agent memory / long-term memory | 5 | 9 | 13 |
| prompt optimization | 2 | 4 | 4 |
| LLM-as-judge / evaluator | 31 | 27 | 18 |

**No volume trend is claimed.** The only movements larger than the noise floor between the two comparable windows are agent + evaluation and tool use rising by about a fifth, and LLM-as-judge falling by a third. The newest window ends exactly four days before the run date, the minimum, so it may still be filling in.

## Landed

Fourteen nodes edited, no new nodes.

| Change | Node | Source |
|---|---|---|
| New section: **the verifier's evidence channel must be one the subject cannot write** — trace text flips judges from 7–19% to 78–90% false accepts; forgeability predicted by reading attacker-controlled data, 97% → 0% when evidence moves channel; ten judges ≈ 3.5 independent; cascades buy cost, not accuracy | [llm-as-judge](../nodes/concepts/llm-as-judge.md) | [2609.28564](https://arxiv.org/abs/2609.28564), [2609.24200](https://arxiv.org/abs/2609.24200), [2609.22512](https://arxiv.org/abs/2609.22512), [2609.29769](https://arxiv.org/abs/2609.29769), [2609.26550](https://arxiv.org/abs/2609.26550) |
| New section + 2 pitfalls: **exactly-once lives in the contract** — read-back cannot see in-flight requests (56%/74% duplicates); a key on every write cuts 28% → 4%; duplicating agents report success 90% of the time | [idempotency-keys](../nodes/concepts/idempotency-keys.md) | [2609.29095](https://arxiv.org/abs/2609.29095) |
| New section + anti-pattern: **the agent must not be able to write its own trail** — all but one tested harness let agents delete traces | [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) | [2609.30266](https://arxiv.org/abs/2609.30266) |
| New section + pitfall: **approval covers the invocation, not its closure** — residual unrecorded effects 40 → 13 with metadata, 10 → 3 with a bound effect prediction | [confirm-before-act](../nodes/concepts/confirm-before-act.md) | [2609.28586](https://arxiv.org/abs/2609.28586) |
| New section: **next-turn scores do not predict workflow success** (≤ 10.4% strict completion after SFT) | [agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md) | [2609.21187](https://arxiv.org/abs/2609.21187) |
| New subsection: **cut-point replay** as a third meaning of replay | [checkpoint-and-replay](../nodes/concepts/checkpoint-and-replay.md) | [2609.20625](https://arxiv.org/abs/2609.20625) |
| New section: **production chose fixed stratified subsets over IRT** | [adaptive-eval-budget](../nodes/concepts/adaptive-eval-budget.md) | [2609.21267](https://arxiv.org/abs/2609.21267) |
| New section: **shown, told, or enforced** — a self-kept ledger beats a shown checklist; enforce only state-decidable failures | [run-state-model](../nodes/concepts/run-state-model.md) | [2609.25686](https://arxiv.org/abs/2609.25686) |
| Two pitfalls: 55% of rejected self-edits fixed their trigger and broke something else; scope retrieval to the certifying family | [self-improving-harness](../nodes/concepts/self-improving-harness.md) | [2609.24130](https://arxiv.org/abs/2609.24130), [2609.29144](https://arxiv.org/abs/2609.29144) |
| New section: copies are not corroboration (false belief asserted 0.97–0.99); read-time defenses carry the benign-case cost | [memory-poisoning](../nodes/concepts/memory-poisoning.md) | [2609.30813](https://arxiv.org/abs/2609.30813), [2609.22818](https://arxiv.org/abs/2609.22818) |
| New section + pitfall: **spend is an attack surface** — check budget before re-ingestion; progress-authorized 22/24 vs fixed cap 13/24 | [step-budget-and-runaway-control](../nodes/concepts/step-budget-and-runaway-control.md) | [2609.28585](https://arxiv.org/abs/2609.28585) |
| Four entries: next-turn gap, ECHO pair accuracy, TRACER, Conduct Under Pressure | [references-multi-turn-agent-eval](../nodes/references/references-multi-turn-agent-eval.md) | 2609.21187, [2609.17360](https://arxiv.org/abs/2609.17360), [2609.28690](https://arxiv.org/abs/2609.28690), [2609.25447](https://arxiv.org/abs/2609.25447) |
| New section (h) measurement validity: ASR meta-analysis, serving-stack confounds, judge dependence, LLJ Cards | [references-eval-reading-list](../nodes/references/references-eval-reading-list.md) | [2609.25173](https://arxiv.org/abs/2609.25173), [2609.26693](https://arxiv.org/abs/2609.26693), 2609.22512, [2609.24516](https://arxiv.org/abs/2609.24516) |
| Two entries: a skill's lift inside judge variance; HEXIS compiles skills to state machines | [references-agent-skill-authoring](../nodes/references/references-agent-skill-authoring.md) | [2609.30120](https://arxiv.org/abs/2609.30120), [2609.30123](https://arxiv.org/abs/2609.30123) |

## The one finding worth reading twice

The week's papers are independent but describe one failure: **a check that reads what the checked system wrote**. A multimodal judge shown the agent's log accepts failed clips it would otherwise reject. A security scanner's confirmation is forgeable exactly when it reads attacker-controlled bytes. Agents delete their own traces. Agents that duplicated a charge report success nine times in ten. The 09-18 sweep established that an auditor reading agents' conclusions lands below chance; this week generalizes it from judges to logs, ledgers, and approvals.

The fix is also shared, and it is structural: move the decisive evidence to a channel the subject cannot write. That means a downstream ledger for effects, harness-side interception for traces, frames rather than narration for the judge, and a predicted effect set bound before approval.

## Reasoning the graph owns, not the sources

- **"List a verifier's inputs by who can write them"** is the graph's generalization across 2609.28564, 2609.24200, and 2609.30266. No single paper states it for all three settings.
- **Gold-history next-turn evaluation is teacher forcing.** 2609.21187 reports the gap; naming it as the reason early errors never compound is the graph's reading.
- **A self-kept ledger helps the model but is not the record.** 2609.25686 finds the ledger beats a shown checklist; keeping it out of the audit role, given 2609.30266, is this graph's step.
- **Paired contrasts apply beyond speech.** ECHO's pair accuracy is for turn-taking; applying it to ask-vs-act and confirm-vs-proceed decisions is the graph's extension.

## Seen, not landed

- **Harness growth as code** — Growing Harness ([2609.26760](https://arxiv.org/abs/2609.26760)) cut LLM calls 76.0–91.8% by moving recurring control into learned code. Relevant to [self-improving-harness](../nodes/concepts/self-improving-harness.md), but it overlaps the existing propose-validate-accept section without changing a claim.
- **TwinCheck** ([2609.26911](https://arxiv.org/abs/2609.26911)), **EdgeGen** ([2609.24115](https://arxiv.org/abs/2609.24115)), **CIGAsk** ([2609.24290](https://arxiv.org/abs/2609.24290)), **State-Grounded Conditioning** ([2609.27606](https://arxiv.org/abs/2609.27606)), **ICLR context compression** ([2609.29875](https://arxiv.org/abs/2609.29875)), **ActGov** ([2609.24446](https://arxiv.org/abs/2609.24446)), and the **leaked system prompts corpus study** ([2609.31575](https://arxiv.org/abs/2609.31575)) were read at the abstract and are candidates for a later pass.
- **"Jev"** appears as a typed decision classifier in four papers this week. The graph has not verified what system it is beyond those abstracts, so it is cited only by result.

## What failed to verify

- Nothing was refuted. Every cited abstract page resolved on 2026-09-27.
- **Full texts were not read.** All numbers above are abstract-level and author-reported; several papers are single-author (2609.29095, 2609.28564, 2609.22818, 2609.30123, 2609.25447).
- **The volume noise floor is estimated from one re-measurement.** Treat "±10%" as an order of magnitude, not a measured interval.

## Process notes

- **Re-measure one old settled window every sweep.** It is the only way to see index drift, and it costs eight requests.
- **Compare windows with equal weekday counts.** The tool now prints the count.
- **Abstract-first triage worked.** Thirty-seven abstracts were enough to pick fourteen landings; the remaining ~390 listings were title-screened.
