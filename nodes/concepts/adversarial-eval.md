---
id: adversarial-eval
type: concept
tags: [eval, red-team, safety, adversarial]
related:
  - [[llm-evaluation]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
---

# Adversarial / Red-Team Eval

A small permanent dataset of prompt-injection, jailbreak, out-of-scope, and abuse-intent cases. Cheap to run, irreplaceable insurance.

## Minimum viable

- 20–30 cases covering: prompt injection through tool output, system-prompt extraction attempts, role confusion, scope evasion, PII probing, financial action manipulation (fintech-specific).
- Run on the same cadence as regression evals; alarm on any new pass→fail.

## Why this is separate from regression

Regression cases assume cooperative users. Adversarial cases assume the user is the attacker. Different threat model, different rubrics.

## Scaling

- Once mechanical adversarial cases are stable, layer in **automated attack generation** (Anthropic + OpenAI red-team posts).
- Domain experts catch what generic red-team misses; for IAF that's spend-policy / accounting context.

## References

- Anthropic, *Challenges in Red Teaming AI Systems* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- OpenAI, *Advancing Red Teaming with People and AI* — [references-eval-reading-list](../references/references-eval-reading-list.md)
