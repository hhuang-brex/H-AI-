---
id: test-pyramid-llm
type: concept
tags: [eval, testing, pyramid]
related:
  - [[llm-evaluation]]
  - [[llm-as-judge]]
  - [[cost-aware-eval]]
  - [[golden-snapshot-eval]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
---

# Test Pyramid for LLM Apps

The classic test pyramid (lots of unit, fewer integration, very few E2E) ports directly to LLM products — but most teams ship it upside-down.

```
       /\  E2E ............. LLM-judged trajectory evals
      /  \ integration ..... mechanical tool-call assertions
     /    \ unit ........... prompt/catalog/schema snapshot tests
    /------\
```

## Layer cost/signal

| Layer | Determinism | $/run | Speed | What it catches |
|---|---|---|---|---|
| Unit (snapshot) | 100% | $0 | ms | prompt bloat, tool-catalog drift, redaction bugs |
| Mechanical trajectory | 100% on assertion | 1 LLM call | seconds | wrong-tool, missing-tool, schema-invalid args |
| LLM-judged trajectory | judge variance | 2+ LLM calls | seconds–min | quality, tone, factuality, edge cases |
| Online shadow | live traffic | sampling cost | continuous | distribution drift, novel intents |

## Heuristic

If a regression can be caught one layer down for an order of magnitude less money, move it down. The expensive layer should only adjudicate things truly subjective.

## Anti-patterns

- **Repetition allocated to the wrong layer.** Running mechanical assertions 50× nightly while running expensive fixture-backed cases 1× — flake budget is in the wrong place. See [[agent-eval-case-study]].
- **No bottom layer at all.** Without snapshot tests for prompt/catalog assembly, every catalog regression burns an LLM call to find.
- **Single-vote LLM judge as the gate.** A single judge's variance can exceed your alarm threshold. See [[llm-as-judge]].

## References

- Hamel Husain, *Your AI Product Needs Evals* — [[references-eval-reading-list]]
- Eugene Yan, *Patterns for LLM Systems* — [[references-eval-reading-list]]
