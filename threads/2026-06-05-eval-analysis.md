---
id: 2026-06-05-eval-analysis
type: thread
tags: [eval, thread]
related:
  - [[agent-eval-case-study]]
  - [[agent-eval-improvement-tiers]]
  - [[references-eval-reading-list]]
status: archived
created: 2026-06-05
---

# Thread — Agent Eval Analysis (2026-06-05)

Conversation goal: understand a representative agent platform's eval logic from first principles, framed against the test pyramid, and surface improvements that balance coverage against operational efficiency.

## Outputs from this thread

- [agent-eval-case-study](../nodes/projects/agent-eval-case-study.md) — generalized map of how the system evaluates agents today.
- [agent-eval-improvement-tiers](../nodes/projects/agent-eval-improvement-tiers.md) — five-tier ranked plan with a "if only three" shortlist.
- [references-eval-reading-list](../nodes/references/references-eval-reading-list.md) — frontier-lab + practitioner reading list, Anthropic + OpenAI prioritized.

## Key insights captured

- The eval pyramid is **inverted** — most signal comes from the most expensive layer; the cheapest layer is one test file.
- 50× nightly repetition is allocated to the **cheapest** layer (mechanical), while fixture-backed cases that need flake detection run **once**.
- Single-vote frontier-model judge variance can exceed common alarm thresholds — multi-vote with a cheaper model is roughly cost-neutral and reduces noise.
- No prod replay, no adversarial dataset, no token-budget assertions despite token data being collected.
- "If only three": pre-LLM unit + schema scorer; multi-vote cheap-model judge; prod-replay shadow.
