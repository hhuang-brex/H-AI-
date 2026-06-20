---
id: experiential-memory-substrates
type: concept
tags: [memory, experiential-learning, in-context-learning, procedural, ace, science-excellence]
summary: "the substrate-choice decision for learned experience — store it as curated text, distilled weights, or transient activation — and why production agents keep weights frozen and curate text with delta-merge discipline."
related:
  - [[agent-memory]]
  - [[agentic-context-engineering-ace]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[memory-consolidation-and-forgetting]]
  - [[eval-dataset-quality]]
  - [[references-memory-theory]]
status: living
created: 2026-06-19
---

# Experiential Memory Substrates

[memory-types-taxonomy](memory-types-taxonomy.md) lists **procedural** memory — "how to do recurring tasks" — as the type agents rarely build. This node is about when they *should*, and the design question it forces: when an agent learns from experience, **where does that experience get stored?** The verified answer is three substrates with sharply different economics.

## The three substrates

| Substrate | What it is | Canonical work | Reversible? |
|---|---|---|---|
| **Weights** | Distill experience into parameters | Test-Time Training (Sun et al. 2020) | No — and inherits interference |
| **Curated text / context** | Accumulate a reusable playbook in natural language | Reflexion, Dynamic Cheatsheet, ACE, GEPA | Yes — edit or drop a line |
| **Transient activation** | The forward pass itself adapts in-context | ICL as implicit gradient descent (von Oswald et al. 2022) | N/A — vanishes after the turn |

The deep result tying them together: **in-context learning is itself a form of test-time learning** — von Oswald et al. give a *constructive proof* that one linear-self-attention layer implements one gradient-descent step. The line between "remembering a fact" and "learning a skill" dissolves; they are points on a storage-permanence spectrum. (Sources, with self-reported-metric flags, in [references-memory-theory](../references/references-memory-theory.md).)

## Why production agents pick text

The "verbal" branch ([verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md)) — Reflexion, Dynamic Cheatsheet, [agentic-context-engineering-ace](agentic-context-engineering-ace.md), GEPA — keeps weights frozen and curates text because text is **cheap, reversible, inspectable, and dodges weight-interference** ([interference-and-catastrophic-forgetting](interference-and-catastrophic-forgetting.md)). It is the same instinct as keeping mutable facts in external memory rather than editing them in ([parametric-memory-and-editing](parametric-memory-and-editing.md)).

But text-memory has its own two failure modes, both documented by ACE — and both are the catastrophic-interference lesson reappearing at the text layer:

- **Context collapse.** Letting the LLM *monolithically rewrite* its whole memory degenerates it: ACE measured a playbook fall from 18,282 tokens at 66.7 to 122 tokens at 57.1 in a single rewrite — *below* the no-memory baseline. The fix is **incremental itemized delta updates with embedding-based de-duplication**, never wholesale re-summarization. (This is why [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md)'s consolidator must interleave, not overwrite.)
- **Brevity bias.** Naive optimization collapses the playbook toward short, generic prompts that lose hard-won specifics.

## The feedback-verifiability bottleneck

The binding constraint on experiential text-learning is **not the storage mechanism — it is whether feedback is verifiable.** ACE degrades without ground-truth labels (−3.4 on one task) but gains sharply with them (+7.6). This makes the substrate question inseparable from evaluation: an agent can only safely learn from experience where it can *tell* good outcomes from bad ([eval-dataset-quality](eval-dataset-quality.md)'s discrimination and label-quality axes). Cheap, verifiable feedback → curate text aggressively; noisy/unverifiable feedback → learning from experience is net-negative, store less.

## The decision

| Store as… | When |
|---|---|
| **Transient activation** (just put it in context) | One-shot, this-task-only; no need to persist |
| **Curated text** (playbook / notes) | Feedback is cheap + verifiable; distribution is non-stationary; you want reversibility and audit — the default for talking agents |
| **Weights** | Stable, high-frequency, latency-bound skills where text retrieval is too slow — and you can afford to manage interference |

> **Frontier (flagged).** No settled theory governs this choice — the rule above is *economic*, not decision-theoretic or information-theoretic. Whether text→weights consolidation is lossy, and whether grow-and-refine text memory has provable capacity bounds, are open ([references-memory-theory](../references/references-memory-theory.md)).

## Pitfalls

- **Monolithic memory rewrite.** The context-collapse trap; use delta-merge.
- **Learning from unverifiable feedback.** Without a reliable signal, accumulated "experience" is accumulated noise.
- **Reaching for weight distillation first.** It is the least reversible, highest-interference substrate; justify it against frozen-weights + text before paying for it.

## References

Sits under [agent-memory](../topics/agent-memory.md). The procedural-memory substrate decision; pairs with [agentic-context-engineering-ace](agentic-context-engineering-ace.md) and [verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md), gated by [eval-dataset-quality](eval-dataset-quality.md). Sources in [references-memory-theory](../references/references-memory-theory.md).
