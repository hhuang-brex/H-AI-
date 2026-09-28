---
id: 2026-09-28-rsi-fanout
type: thread
tags: [meta, research, fan-out, rsi, self-improvement, harness, safety]
related:
  - [[references-recursive-self-improvement]]
  - [[self-improving-harness]]
  - [[skill-lifecycle-and-drift]]
  - [[memory-poisoning]]
  - [[llm-as-judge]]
  - [[2026-09-27-industry-trend-catchup]]
status: snapshot
created: 2026-09-28
summary: "fan-out on recursive self-improvement for agents: ~45 papers verified at the abstract, one new reading list, and a new section in self-improving-harness — the acceptor, not the proposer, decides whether the loop improves."
---

# Thread — Recursive Self-Improvement Fan-Out (2026-09-28)

## Goal

Fan out the literature on recursive self-improvement (RSI) for agents, and land what changes how the graph tells a builder to run a self-editing loop.

## Method

Five arXiv HTML advanced-search queries over 2023-01-01 → 2026-09-27, run through `tools/arxiv-sweep.py`'s search function:

| Query (abstract field) | Hits |
|---|---|
| "recursive self-improvement" | 70 |
| "self-improving agent(s)" | 56 |
| "self-evolving agent(s)" | 133 |
| "Gödel agent" / "Gödel machine" / "Darwin Gödel" / "self-referential" | 132 |
| "harness" AND "self-improvement" | 58 |

Titles were screened, and 45 abstracts were fetched and read. The self-referential query was mostly noise from logic, complexity theory, and neuroscience, and was used only for its handful of Gödel-machine hits.

## Outputs

- New [references-recursive-self-improvement](../nodes/references/references-recursive-self-improvement.md), organized by the question each paper answers.
- New section in [self-improving-harness](../nodes/concepts/self-improving-harness.md): five claims the 2026 literature adds, and a deploy-style acceptance rule.
- `related:` links added from [skill-lifecycle-and-drift](../nodes/concepts/skill-lifecycle-and-drift.md) and [memory-poisoning](../nodes/concepts/memory-poisoning.md).

## Key insights

- **The acceptor, not the proposer, decides whether the loop improves.** Nearly all method papers innovate on proposal. The papers that measure acceptance find "keep it if the score went up" committing 30–42% false edits, and a strict held-out gate being the only thing that made one loop never worse than its base.
- **The acceptance signal has to sit outside the agent's reach.** Self-authored tests, self-graded memories, co-evolved metrics, and poisoned benchmarks all fail the same way. This is the RSI instance of the evidence-channel rule landed in [llm-as-judge](../nodes/concepts/llm-as-judge.md) the day before.
- **Persisted artifacts contaminate forward and resist rollback.** Skill pools degrade past a size threshold, extraction launders poisoned intent, and contamination survives deleting its source. Admission control is pre-commit or it is nothing.
- **Proposers fabricate failures, and add-only loops keep the fabrications.** A fix should be accepted only for a failure an oracle reproduces.

## Reasoning the graph owns

- **"Treat an accepted self-edit as a deploy"** is the graph's synthesis across PACE, SEAL, RSEA, and Phantom Guardrails. No single source proposes the full rule.
- **The overlap with the 09-27 sweep is not a coincidence.** Self-written evidence is the week's theme in production agents and in RSI loops alike; the graph now states it once, in llm-as-judge, and links to it from both.

## What failed to verify

- **Full texts were not read.** All numbers are abstract-level and author-reported.
- **Library Drift quotes SkillsBench figures** (+0.0 pp for LLM-authored skills, +16.2 pp for human-curated). They were not checked at SkillsBench's own page, and the reading list says so.
- **About 360 listed titles were not opened.** The listing is recall-oriented; treat the reading list as a curated slice, not a census.
