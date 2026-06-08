---
id: agent-eval-improvement-tiers
type: project
tags: [eval, plan, agents]
related:
  - [[agent-eval-case-study]]
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[golden-snapshot-eval]]
  - [[adversarial-eval]]
status: proposal
created: 2026-06-05
source-thread: [[2026-06-05-eval-analysis]]
---

# Agent Eval — Improvement Tiers

Ranked by leverage. Each tier independently shippable. Diagnoses [agent-eval-case-study](agent-eval-case-study.md).

## Diagnostic in one sentence

The eval pyramid is **inverted**: the cheap deterministic layer is one file, and 50× nightly repetition is allocated to the cheapest cases while the expensive fixture-backed cases run once.

## Tier 1 — Widen the cheap bottom

1. Pre-LLM unit tests for tool-catalog rendering, skill loader, system reminders, redaction. See [golden-snapshot-eval](../concepts/golden-snapshot-eval.md).
2. Token-budget snapshot tests (`assert tokens(systemPrompt) ≤ N`) — bloat becomes a CI fail, not a customer report.
3. Schema-validity scorer — every emitted tool call parses against its operation's schema.

## Tier 2 — Strengthen the middle

1. Promote argument-equality (`input.equals`) from opportunistic to default; demote LLM-judged datasets to mechanical wherever assertions are equality-checkable.
2. Differential / golden trajectory: hash `(toolCalls, finalMessage)`; only invoke judge on mechanical fail.
3. Lint rule: new dataset with no mechanical scorer must reference a tracking ticket.

## Tier 3 — Tame the expensive top

1. **Cascading judge**: cheap model first, escalate to frontier model on fail/low-confidence — typically ~5–10× cost reduction.
2. **N-of-3 cheap-model majority** instead of 1× frontier — catches single-judge variance, ~cost-neutral. See [llm-as-judge](../concepts/llm-as-judge.md).
3. Pin judge + agent model in dataset metadata. Model upgrades become deliberate rebaselines.
4. Reallocate nightly reps: plain 50 → 10–15, fixture-backed 1 → 3–5. See [cost-aware-eval](../concepts/cost-aware-eval.md).

## Tier 4 — Online signal

1. Daily prod-replay shadow. See [prod-shadow-replay](../concepts/prod-shadow-replay.md).
2. Feedback → eval pipeline: every customer-reported bug auto-creates a redacted regression case.
3. 20–30 case adversarial dataset. See [adversarial-eval](../concepts/adversarial-eval.md).

## Tier 5 — Operational hygiene

1. Fix fixture-seed idempotency — content-hash the fixture spec; unblocks higher fixture parallelism.
2. Cost/latency dashboard surfaced from token data already collected.
3. Bounded retry on transient infra errors; gate retries with a per-case `idempotent: true` for mutating tools.
4. Run-id unification across lanes for consistent dashboard grouping.

## If only three things land

1. Tier 1.1 + 1.3 (pre-LLM unit + schema-validity scorer).
2. Tier 3.2 (multi-vote cheap-model judge).
3. Tier 4.1 (prod-replay shadow).
