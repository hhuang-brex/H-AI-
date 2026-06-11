---
id: agent-eval-case-study
type: project
kind: snapshot
tags: [eval, case-study, agents]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[agent-trajectory-eval]]
  - [[adversarial-eval]]
  - [[agent-eval-improvement-tiers]]
status: snapshot
created: 2026-06-05
summary: "generalized agent platform eval system (2026-06-05 snapshot)."
source-thread: [[2026-06-05-eval-analysis]]
---

# Agent Eval Case Study — Snapshot

A representative agent platform's eval system, captured for cross-team comparison. Names and paths generalized; the *shape* of the system is what's instructive.

## System under evaluation

A multi-channel agent platform: a CLI/operations harness with a kernel that routes to LLM-backed agents, with operations exposed as tools. Datasets live next to operation specs.

## Eval unit (executor types)

| Executor | What runs | LLM calls | Backend |
|---|---|---|---|
| Trajectory | Real agent loop end-to-end | 1× agent + optional 1× judge | sandbox tenant when fixture-backed |
| Operation | Direct invocation of a single operation | 0 (op is pure code); scorers may call LLM | none / mocked |

## Scorers

- **Deterministic** — pure-code checks (e.g. expected ID match).
- **Tool-call checker** — `none/count/required/forbidden/sequence`, `input.exists`, `input.equals` (argument equality).
- **LLM-judged** — single-vote frontier model with a prompt template.

## Triggers (three lanes)

| Lane | Trigger | Plain reps | Fixture reps | Notes |
|---|---|---|---|---|
| Merge queue | every PR added to queue | 1 | n/a | hard gate; mechanical only |
| Main | every push to main | 1 | 1 | fire-and-forget; persists to dashboard |
| Nightly | daily cron | 50 | 1 | flake detection; alarms a few hours later |

Routing: presence of a fixtures manifest in a dataset folder ⇒ run a "seed-and-run" orchestrator that provisions a sandbox tenant; else plain run.

## Storage / observability

- Local JSON results per run.
- Persisted to a results database with a UI for browsing.
- Slack alarm on aggregate pass-rate drop or per-case multi-night zero passes.

## Known issues at snapshot time

- Idempotency of fixture seeds is name-based; in-place edits don't propagate (workaround: rename).
- Token usage tracked but not asserted.
- Single-vote judge variance can approach the alarm threshold.
- No production replay, no adversarial dataset, no token-budget assertions.
- Repetition budget allocated to the cheapest layer, not the layer where flakes are likely.

## See also

- [agent-eval-improvement-tiers](agent-eval-improvement-tiers.md) — ranked plan to address the issues above.
- [2026-06-05-eval-analysis](../../threads/2026-06-05-eval-analysis.md) — origin thread.
