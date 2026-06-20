---
id: parametric-memory-and-editing
type: concept
tags: [memory, model-editing, rome, knowledge, interpretability, science-excellence]
summary: "facts live in the weights as a key-value store you can surgically edit (ROME/MEMIT) — and why sequential editing inherits catastrophic forgetting, making external memory the safer choice for mutable facts."
related:
  - [[agent-memory]]
  - [[associative-memory-and-attention]]
  - [[interference-and-catastrophic-forgetting]]
  - [[memory-retrieval]]
  - [[references-memory-theory]]
status: living
created: 2026-06-19
---

# Parametric Memory & Editing

A talking agent's facts live in two places: the **weights** (what the base model knows) and **external memory** (what you store and retrieve). This node covers the weights side — how factual memory is organized inside a transformer, whether you can surgically edit it, and why the verified answer is "yes, but it's fragile enough that you usually shouldn't for anything that changes."

## Facts as a key-value store in the MLP

The mechanistic picture (Geva et al. 2021): a transformer **feed-forward layer is an unnormalized key-value memory** — `FF(x) = f(x·Kᵀ)·V`, where keys detect input patterns and values write next-token distributions. Factual recall reads from this store. **ROME** (Meng et al. 2022) made it actionable: *causal tracing* localizes a fact to mid-layer MLPs over the last subject token, and a **rank-one edit** of that projection matrix can change the stored association. **MEMIT** scales this to thousands of edits at once across a band of layers.

This connects directly to [associative-memory-and-attention](associative-memory-and-attention.md): editing the weights is *writing a new pattern into a content-addressable store* — which is precisely why it interferes.

## Where it gets contested

The clean "facts live in editable mid-layer cells" story does not fully survive scrutiny — flag these as live debates, not settled fact:

- **Localization doesn't predict editability.** Hase et al. (2023) show the layer causal tracing fingers is *not* the best layer to edit ("which layer we edit is a far better predictor"). *Where a fact is read* ≠ *where it is stored/editable*.
- **Storage is partly distributed.** A token fires hundreds of cells, and the layer output differs from any single cell's top prediction ~68% of the time (Geva). Rank-one editability shows *sufficiency to change the output*, not that the fact lives *only* there.
- **Recall may be MLP-enrichment + attention-extraction** (Geva 2023), relocating part of "memory" into attention parameters.
- **Relations are only partly linear** (Hernandez et al. 2024) — many decode as an affine map, many don't; no universal mechanism.

(Supported/contested split in [references-memory-theory](../references/references-memory-theory.md).)

## The decisive failure mode: sequential editing forgets

The reason this matters for agent-building: **sequential edits accumulate destructively, exactly as [interference-and-catastrophic-forgetting](interference-and-catastrophic-forgetting.md) predicts.** Because each edit is a non-orthogonal perturbation of the *same* shared MLP subspace, repeated ROME/MEMIT edits cause **gradual-then-catastrophic forgetting** of both the edited facts and general ability (Gupta et al. 2024); editing degrades broad capability via excessive weight change, and the proposed fix — RECT (Gu et al. 2024) — is an **EWC-style importance constraint transplanted into editing**. The continual-learning theory and the editing empirics close into one loop.

## The engineering payoff

For a domain task agent, the decision is **edit the weights vs. store the fact externally**:

| | Weight editing (ROME/MEMIT) | External memory (retrieval) |
|---|---|---|
| Update cost | Per-edit optimization; offline | Append a record |
| Mutable facts | Fragile under sequential edits | Natural — supersede the record |
| Interference | Shared subspace → accumulates | Disjoint items → none |
| Auditability | Opaque weight delta | Inspectable, revertible |

The verdict the theory supports: **keep changing facts in external memory** ([memory-retrieval](memory-retrieval.md)) — it is parameter-isolation by construction and dodges the interference wall. Reserve weight editing for rare, static corrections where retrieval can't reach (e.g. a pervasive base-model error), and never run long sequential-edit chains on a production model without measuring downstream degradation.

## Pitfalls

- **Treating model editing as a memory API.** Sequential edits degrade the model; it is not a durable write path for evolving facts.
- **Trusting causal-tracing localization to pick the edit site.** It doesn't (Hase et al.).
- **Assuming the edit is local.** Distributed storage and attention-side recall mean a "surgical" rank-one edit can have non-local effects.

## References

Sits under [agent-memory](../topics/agent-memory.md). Builds on [associative-memory-and-attention](associative-memory-and-attention.md) (editing = writing patterns into an associative store) and is governed by [interference-and-catastrophic-forgetting](interference-and-catastrophic-forgetting.md). Sources in [references-memory-theory](../references/references-memory-theory.md).
