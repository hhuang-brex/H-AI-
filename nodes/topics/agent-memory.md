---
id: agent-memory
type: topic
tags: [agent, memory, retrieval, consolidation, context, science-excellence]
summary: "the semantic memory system that lets a talking agent recall across turns and sessions — memory types, retrieval, and consolidation/forgetting — distinct from the this-turn context window and the run-state for resume."
related:
  - [[context-storage-and-hydration]]
  - [[context-engineering]]
  - [[agent-state-persistence]]
  - [[conversation-memory]]
  - [[memory-types-taxonomy]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[agent-native-memory-framework]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[memory-graph-topology]]
  - [[associative-memory-and-attention]]
  - [[complementary-learning-systems]]
  - [[interference-and-catastrophic-forgetting]]
  - [[parametric-memory-and-editing]]
  - [[experiential-memory-substrates]]
  - [[domain-knowledge-injection]]
  - [[references-context-and-memory]]
  - [[references-memory-theory]]
  - [[proactive-memory-intervention]]
  - [[prompt-time-knowledge-capture]]
  - [[memory-poisoning]]
status: living
created: 2026-06-12
---

# Agent Memory

A talking task agent needs to remember — what the user said three turns ago, what they prefer across sessions, how a recurring task usually goes. Agent memory is the system that stores those things durably and surfaces the right ones at the right moment. It is the *substrate* that [context-engineering](context-engineering.md) draws from: memory decides what *could* be recalled; context-assembly decides what actually enters this turn's window.

## Three things that are NOT each other

The graph has three "remembering" ideas that are routinely conflated; keeping them distinct is the first engineering win:

| System | Holds | Lifespan | Node |
|---|---|---|---|
| **Context window** | What the model sees *this turn* | One inference call | [context-engineering](context-engineering.md) |
| **Run state** | Where an in-flight *task* is, for resume | One run (until done) | [agent-state-persistence](agent-state-persistence.md) |
| **Memory** (this topic) | What the agent *knows*, across turns & sessions | Indefinite; decays by policy | here |

Context is volatile and reconstructed every turn; run state is durable but task-scoped and discarded on completion; memory outlives both. A "fact the user told us last week" lives in memory, gets *retrieved* into run state when relevant, and is *assembled* into the context window for the turn that needs it.

## The three decisions

| Decision | Question | Concept |
|---|---|---|
| What kinds of memory exist? | Working vs. episodic vs. semantic vs. procedural — and do you need all four? | [memory-types-taxonomy](../concepts/memory-types-taxonomy.md) |
| How do you surface the right memory? | Out of thousands of stored items, which few enter the prompt? | [memory-retrieval](../concepts/memory-retrieval.md) |
| What gets kept, promoted, or forgotten? | Writing everything is as broken as remembering nothing | [memory-consolidation-and-forgetting](../concepts/memory-consolidation-and-forgetting.md) |

## Two lenses on the memory system

The taxonomy above sorts memory by *content type*. There is an orthogonal, complementary lens — the **data-management** decomposition of a memory *system* by *lifecycle phase*: [agent-native-memory-framework](../concepts/agent-native-memory-framework.md) (`R/S/Q/U` — representation+storage, extraction, retrieval+routing, maintenance; Zhou et al. 2026). The two compose: the taxonomy says *what* is stored; the four modules say *how* it is written, read, and maintained. Most cluster nodes are slices of `R/S/Q/U` — [memory-retrieval](../concepts/memory-retrieval.md) is **Q**, [memory-consolidation-and-forgetting](../concepts/memory-consolidation-and-forgetting.md) is **U** — and its headline result reframes the engineering question from "which memory system?" to "**which module is my workload's bottleneck?**"

## The science angle: memory is a cognitive-systems borrowing

The engineering here is unusually well-served by reaching to the empirical literature, because two bodies of work constrain the design:

- **Retrieval is bounded by attention limits.** Long-context models degrade on information buried mid-context (the widely-reported "lost in the middle" effect) and on raw context length generally ("context rot"). This is *why* memory exists as a separate retrieval layer rather than "just put everything in the context window" — a longer window does not rescue recall. See [memory-retrieval](../concepts/memory-retrieval.md) and the empirical grounding in [references-context-and-memory](../references/references-context-and-memory.md).
- **Human memory architecture is a tested design source.** The working/episodic/semantic/procedural split, consolidation (promoting episodic experiences into semantic knowledge), and decay/forgetting are borrowed from cognitive science and have been instantiated in LLM-agent systems (OS-style tiered memory, generative-agent memory streams). These are not metaphors for flavor — they are load-bearing architectural choices with published precedent.

## The governing principle: remembering is a precision problem, not a capacity problem

The naive instinct is "store more, recall more." Both halves are wrong. Storing everything fills retrieval with noise; recalling everything (or recalling by recency alone) surfaces the wrong items. A good memory system is *selective* on both write and read — it forgets deliberately and retrieves by relevance, not volume. Capacity is cheap; precision is the hard part.

## Scientific foundations

The three decisions above are the *systems* view. Beneath them sits a theory layer that explains **why** these architectures — not arbitrary ones — are what works. The throughline: *knowledge in a distributed associative store is a superposition of patterns over shared parameters, and the same overlap that buys generalization causes interference and forgetting.* Each foundation node extracts the build decision the theory forces:

| Foundation | The verified result | What it forces |
|---|---|---|
| [associative-memory-and-attention](../concepts/associative-memory-and-attention.md) | Attention *is* associative-memory retrieval, with a capacity wall (linear 0.14N → sub-linear N/log N) | Externalize memory; a bigger window has a ceiling, it doesn't replace retrieval |
| [complementary-learning-systems](../concepts/complementary-learning-systems.md) | Fast episodic + slow semantic + replay (CLS), with causal neuroscience evidence | The two-tier store and episodic→semantic consolidation are a tested blueprint, not a metaphor |
| [interference-and-catastrophic-forgetting](../concepts/interference-and-catastrophic-forgetting.md) | Forgetting tracks update overlap (NTK-overlap law); three mitigations: regularize / replay / isolate | Prefer external/retrieval memory (parameter-isolation by construction) for mutable facts |
| [parametric-memory-and-editing](../concepts/parametric-memory-and-editing.md) | Facts are an editable MLP key-value store (ROME/MEMIT) — but sequential edits forget catastrophically | Keep changing facts out of the weights; reserve editing for rare static fixes |
| [experiential-memory-substrates](../concepts/experiential-memory-substrates.md) | Learned experience stores as weights / text / transient activation; ICL is itself learning | Curate text with delta-merge discipline, gated by feedback verifiability |

Where the source theory is mean-field-heuristic or disputed by a later paper, the nodes mark it; full provenance is in [references-memory-theory](../references/references-memory-theory.md).

## Connections

- **Context:** memory is the store; [context-engineering](context-engineering.md) is the per-turn selection from it. [conversation-memory](../concepts/conversation-memory.md)'s "three horizons" is a special case of [memory-types-taxonomy](../concepts/memory-types-taxonomy.md).
- **Knowledge injection:** [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) (RAG, prompt-stuffing) is *external-knowledge* retrieval; memory is *experience* retrieval. Same machinery (embed + rank), different source and write path.
- **Persistence:** durable memory needs the same storage discipline as [agent-state-persistence](agent-state-persistence.md) — versioned, atomic, reconstructable.
