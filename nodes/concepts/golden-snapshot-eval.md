---
id: golden-snapshot-eval
type: concept
tags: [eval, snapshot, golden, deterministic]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[agent-trajectory-eval]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-05
summary: "pre-LLM deterministic checks."
---

# Golden / Snapshot Eval

A pre-LLM, deterministic check on layers below the model: prompt assembly, tool catalog, skill loader, redaction, system reminders.

## What to snapshot

- **System prompt per surface** (channel × agent × feature flags). Bytes-equal or token-bounded.
- **Tool catalog** for a given context. Catches tool-description drift and accidental tool exposure.
- **Skill loader** decisions for `(skills enabled, channel, account features)` → expected skill list.
- **Redaction** round-trips on a corpus.

## Why it matters

A wrong tool description that always makes the agent pick the wrong tool burns one LLM call per case to detect inside a trajectory eval. A snapshot test catches it in milliseconds with a precise file diff.

## Discipline

- Snapshots are intentional contracts; an agent updating a snapshot must explain why in the PR.
- Pair with **token-budget snapshots** so bloat fails CI rather than waiting for a customer.

## References

- See [test-pyramid-llm](test-pyramid-llm.md) and [cost-aware-eval](cost-aware-eval.md).
