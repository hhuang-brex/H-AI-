---
id: prod-shadow-replay
type: concept
tags: [eval, production, shadow, replay]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
---

# Prod Shadow / Replay

Continuously sample real production traffic, replay it through the candidate agent at HEAD, and diff. The only eval mechanism that scales coverage with product growth without growing the dataset by hand.

## Shape

```
prod conversation ─► redact ─► replay through HEAD agent
       │                                │
       └─── prod tool calls / msgs ─────┴─► diff (tools, message hash, tokens)
                                            │
                                            └─► surface as eval rows
```

## Why this beats a frozen dataset

- **Coverage = traffic.** New intents enter the eval the moment users send them.
- **Drift detection.** Distribution shifts are visible in deltas, not silently absorbed.
- **Lower curation cost.** The "dataset" is a sampling policy, not a hand-written corpus.

## Pitfalls

- **PII** — redaction must be airtight before replay leaves a sandbox.
- **Side effects** — replays must run against a sandbox or read-only path; mutating tools have to be stubbed.
- **Non-determinism in scoring** — diffs against prod aren't pass/fail by themselves; they need a triage queue or a judge layer.

## Adjacent: feedback → eval

Every customer-reported bug should auto-create a redacted regression case. The trace is already pulled by the debug-chat flow; one more step writes a JSON case under the right dataset directory.

## References

- Hamel Husain, *A Field Guide to Rapidly Improving AI Products* — [[references-eval-reading-list]]
- Phillip Carter, *So We Shipped an AI Product. Did It Work?* — [[references-eval-reading-list]]
