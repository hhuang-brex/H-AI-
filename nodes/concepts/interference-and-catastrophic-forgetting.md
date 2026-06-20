---
id: interference-and-catastrophic-forgetting
type: concept
tags: [memory, forgetting, interference, continual-learning, ewc, science-excellence]
summary: "why any shared-parameter store forgets when updated sequentially — the NTK-overlap law — and the three verified mitigation families (importance regularization, replay, parameter isolation)."
related:
  - [[agent-memory]]
  - [[complementary-learning-systems]]
  - [[parametric-memory-and-editing]]
  - [[memory-consolidation-and-forgetting]]
  - [[references-memory-theory]]
status: living
created: 2026-06-19
---

# Interference & Catastrophic Forgetting

The single most predictive piece of theory for agent memory: **a distributed store that updates shared parameters sequentially will forget — and the amount of forgetting is governed by how much the new update overlaps the old.** This is the problem [complementary-learning-systems](complementary-learning-systems.md) is an architectural answer to, and the reason [parametric-memory-and-editing](parametric-memory-and-editing.md) is fragile.

## The phenomenon and the law

Training a network on task B after task A *abruptly* overwrites A — not graceful decay but collapse (McCloskey & Cohen 1989; even a single new trial causes major loss, Ratcliff 1990). The root cause: the representational overlap that lets a distributed store *generalize* is exactly what lets a new update *clobber* an old one (French 1999).

The unifying theoretical result makes this quantitative: in the neural-tangent-kernel regime, **forgetting is governed by the NTK overlap matrix — interference rises as tasks become more aligned**, and *orthogonal* representations provably minimize first-order interference (Doan et al. 2021). Forgetting is not a mystery; it is the inner product between what you're writing and what's already there.

> **Contested (flagged).** The crisp "stability–plasticity dilemma" framing predates McCloskey & Cohen (it is Grossberg/ART), and the "representational overlap" account is more properly French than M&C. M&C 1989 is an *empirical* demonstration, not the unified theory the popular framing implies. (Provenance in [references-memory-theory](../references/references-memory-theory.md).)

## The three mitigation families

Every continual-learning method — and every durable-memory design — is one of three responses to the overlap law:

| Family | Mechanism | Canonical | Cost |
|---|---|---|---|
| **Importance regularization** | Pin the parameters that mattered for old tasks; let the rest move | **EWC** — quadratic anchor weighted by diagonal Fisher information (Kirkpatrick 2017); Synaptic Intelligence (online variant) | Diagonal Fisher ignores correlations; fails class-incrementally |
| **Replay** | Interleave old examples (or gradients) with new | GEM (gradient-projection); the CLS hippocampal-replay story | Needs a buffer; storage + privacy cost |
| **Parameter isolation** | Give each task disjoint weights → updates are *trivially* orthogonal | Progressive Networks, PackNet | Zero forgetting, but capacity grows or is partitioned away |

EWC's Fisher term is worth internalizing as a mental model: it is a **per-weight stiffness** — high-importance weights are pinned, low-importance weights stay plastic. Orthogonal Gradient Descent (Farajtabar 2020) makes the overlap-law literal: it projects each new-task gradient orthogonal to stored past-task gradients so, to first order, old predictions don't change.

## The engineering payoff

- **Prefer external/retrieval memory for mutable facts.** External memory ([memory-retrieval](memory-retrieval.md)) is *parameter-isolation taken to the limit* — each memory is a disjoint addressable item, so writing one cannot clobber another. This is the cheapest way to dodge interference, and a first-principles argument for why production agents keep changing facts *out* of the weights.
- **Sequential weight edits will degrade — predictably.** Any scheme that writes non-orthogonal updates into a shared subspace (sequential model editing) inherits gradual-then-catastrophic forgetting; see [parametric-memory-and-editing](parametric-memory-and-editing.md).
- **Consolidation needs interleaving, not overwriting.** [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md)'s promotion step must interleave (replay) rather than monolithically rewrite, or it reproduces catastrophic interference at the text layer (context collapse — [experiential-memory-substrates](experiential-memory-substrates.md)).

## Pitfalls

- **Assuming forgetting is gradual.** It is abrupt past a threshold; a memory system that looks fine can collapse with one more conflicting write.
- **Reaching for weight updates to "remember" a new fact.** That is the highest-interference option; retrieval is lower-risk for anything that changes.
- **Diagonal-Fisher overconfidence.** EWC ignores parameter correlations and fails in the class-incremental setting — regularization alone is not a complete answer; replay is often required.

## References

Sits under [agent-memory](../topics/agent-memory.md). The problem [complementary-learning-systems](complementary-learning-systems.md) answers and the mechanism behind [parametric-memory-and-editing](parametric-memory-and-editing.md)'s fragility. Sources in [references-memory-theory](../references/references-memory-theory.md).
