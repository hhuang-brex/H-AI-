---
id: references-context-and-memory
type: reference
tags: [context, memory, reading-list, retrieval, long-context, science-excellence]
summary: "verified empirical sources behind the context and memory clusters — lost-in-the-middle, context rot, RAG, MemGPT, and generative agents."
related:
  - [[context-engineering]]
  - [[agent-memory]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[memory-types-taxonomy]]
  - [[just-in-time-context]]
  - [[references-just-in-time-context]]
status: living
created: 2026-06-12
---

# References — Context & Memory

The scientific grounding for the context cluster ([context-engineering](../topics/context-engineering.md)) and the memory cluster ([agent-memory](../topics/agent-memory.md)). These concepts were written as engineering distillations; this list ties their empirical claims to primary sources. Every entry was fetched and verified (title/authors/year confirmed) on 2026-06-12 — not recalled from memory (survey entry added and verified 2026-07-02).

## The field's formal survey

- **A Survey of Context Engineering for Large Language Models** — Mei, Yao, Ge, Wang, Bi, Cai, Liu, Li, Li, Zhang, Zhou, Mao, Xia, Guo, Liu (15 authors) (2025, v2 2025-07-21). https://arxiv.org/abs/2507.13334 — Verified 2026-07-02. The field's reference survey (ongoing work; **166 pages, 1,411 citations**). Formalizes context engineering "beyond prompt design" with a taxonomy — *context retrieval & generation*, *context processing*, *context management* → system implementations *RAG*, *memory systems*, *tool-integrated reasoning*, *multi-agent* — that maps almost 1:1 onto this graph's context + memory clusters. Its distinctive scientific claim is a **"fundamental asymmetry"**: models understand complex context far better than they can *generate* equally sophisticated long-form output, named a defining priority for future work. This is an *output-side* limit, complementary to the *input-side* degradation (lost-in-the-middle / context rot) below.

## Why retrieval beats a bigger window (attention limits)

- **Lost in the Middle: How Language Models Use Long Contexts** — Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang (2023, TACL). https://arxiv.org/abs/2307.03172 — Verified finding: models perform best when relevant information is at the *start or end* of the input and degrade significantly when it sits in the *middle* of a long context. This is the empirical backbone of [memory-retrieval](../concepts/memory-retrieval.md)'s "a bigger window does not replace retrieval" and of [context-budget-allocation](../concepts/context-budget-allocation.md)'s placement reasoning.

- **Context Rot: How Increasing Input Tokens Impacts LLM Performance** — Hong, Troynikov, Huber, Chroma (2025-07-14). https://www.trychroma.com/research/context-rot — Verified: across 18 models (GPT-4.1, Claude 4, Gemini 2.5, Qwen3), performance "grows increasingly unreliable as input length grows," even on simple needle-in-a-haystack / conversational-QA / word-repetition tasks. The newer, broader corroboration of lost-in-the-middle: long-context capability is not "solved," which is the whole justification for [context-engineering](../topics/context-engineering.md) as a discipline. Practitioner report, not peer-reviewed — weight accordingly.

## Retrieval machinery

- **Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks** — Lewis, Perez, Piktus, Petroni, Karpukhin, Goyal, Küttler, M. Lewis, Yih, Rocktäschel, Riedel, Kiela (2020, NeurIPS). https://arxiv.org/abs/2005.11401 — The foundational RAG paper: pair a parametric generator with a non-parametric retrievable index (dense vector index over Wikipedia). Grounds [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) and the "memory retrieval is the same machinery as RAG, different source" claim in [memory-retrieval](../concepts/memory-retrieval.md).

## Memory architectures

- **MemGPT: Towards LLMs as Operating Systems** — Packer, Wooders, Lin, Fang, Patil, Stoica, Gonzalez (2023, rev. 2024). https://arxiv.org/abs/2310.08560 — Verified: "virtual context management" inspired by hierarchical memory in operating systems — shuttling data between an in-context "main memory" and an external store. The direct precedent for the tiered-memory / OS-style eviction framing in [agent-memory](../topics/agent-memory.md) and [memory-consolidation-and-forgetting](../concepts/memory-consolidation-and-forgetting.md).

- **Generative Agents: Interactive Simulacra of Human Behavior** — Park, O'Brien, Cai, Morris, Liang, Bernstein (2023). https://arxiv.org/abs/2304.03442 — Verified from the abstract: an architecture that stores a complete experience record in natural language, *synthesizes memories into higher-level reflections over time*, and *retrieves them dynamically* to plan behavior. This grounds the consolidation/reflection idea in [memory-consolidation-and-forgetting](../concepts/memory-consolidation-and-forgetting.md) and the memory-stream framing in [agent-memory](../topics/agent-memory.md).
  - **Caveat (honest sourcing):** the specific recency × importance × relevance retrieval-scoring formula that [memory-retrieval](../concepts/memory-retrieval.md) attributes to "the generative-agents line of work" is widely associated with this paper but I could **not** confirm it from the abstract this session (the full-text PDF exceeded the fetch limit; no HTML mirror resolved). Treat the three-factor formula as community-attributed-to-this-paper, pending full-text verification — verify against §"Memory and Retrieval" of the PDF before citing the formula externally.

## Just-in-time context — added 2026-10-15

Backs [just-in-time-context](../concepts/just-in-time-context.md). Every source below was fetched on 2026-10-15; arXiv entries were confirmed at the abstract page only, and their numbers are author-reported.

- **Effective context engineering for AI agents** — Rajasekaran, Dixon, Ryan, Hadfield, Anthropic Applied AI (2025-09-29). https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — Names the just-in-time strategy: hold lightweight identifiers and load data at runtime with tools, in contrast to embedding-based pre-inference retrieval. Gives the Claude Code hybrid (`CLAUDE.md` up front, `glob`/`grep` just in time) and states the cost: runtime exploration is slower than precomputed retrieval. Vendor engineering post; mechanism, not measurement.
- **General Agentic Memory via Deep Research (GAM)** — Yan, Li, Qian, Lu, Liu (2025-11-23). https://arxiv.org/abs/2511.18423 — Frames memory as just-in-time compilation: a lightweight memory plus a complete page-store, and a researcher that builds context per request.
- **Just-In-Time Agent Memory with Runtime Agentic Research (JAM)** — Yan, Li, Qian, Lu, Li, Liu (2026-09-28). https://arxiv.org/abs/2609.34385 — Names the ahead-of-time vs just-in-time split and trains the researcher; beats AOT memory systems on the reported benchmarks.
- **Beyond Semantic Similarity: Direct Corpus Interaction** — Li, Zhang, Wei, Lu, Nie + others (2026-05-03). https://arxiv.org/abs/2605.05242 — Raw-corpus search with terminal tools and no index beat sparse, dense, and reranking baselines on several BRIGHT and BEIR sets.
- **Is Grep All You Need? How Agent Harnesses Reshape Agentic Search** — Sen, Kasturi, Lumer, Gulati, Subbiah (2026-05-14). https://arxiv.org/abs/2605.15184 — `grep` generally beat vector retrieval on 116 LongMemEval questions, but harness and result format moved the score as much.
- **BM25 Wins at Scale** — Wang, Xu, Wang, Du, Zeng + others (v3 2026-07-31). https://arxiv.org/abs/2607.26497 — Across 28 nested corpus tiers, a file-system agent led only at small sizes, spent 39× the query tokens, and lost to BM25 past about 10 million corpus tokens.
- **Deep Agentic Search for Repository-Level Code QA** — Oskooei, Ilci, Kayim, Uzun + others (2026-08-02). https://arxiv.org/abs/2608.01507 — Semantic search 65.2% vs grep-by-subagent 46.2% on SWE-QA; 41.8% of agentic failures occurred at the planner–subagent hand-off.
- **SEEDS: Preview-Guided Evidence Admission for Search Agents** — Liu, Xu, Fan, Sun, Tan (2026-10-09). https://arxiv.org/abs/2610.12932 — Separates retrieving a candidate from admitting it to the reasoning context.
- **DTOC: Dynamic Tool Output Compression** — Chaturvedi, Bhattacharya, Gopalkrishnan + others (2026-08-06; Discovery Science 2026). https://arxiv.org/abs/2609.26121 — Placeholders with on-demand restoration; disable-only compression degraded performance, reversible compression did not.
- **CADOC: Cache-Aware Dynamic Object Context** — Yao, Zhou, Xu (2026-09-29). https://arxiv.org/abs/2609.37012 — Batches replacements to preserve prefix-cache reuse; about 40% lower input cost near full-context performance.
- **FlowState: Execution State as Memory** — Li, Li, Wang + others (v2 2026-10-08). https://arxiv.org/abs/2609.34565 — Typed state nodes with references to raw observations, revealed progressively; 40–43% fewer tokens with higher success than full context.
- **TipsWarm: Retaining Helpful Warm Tips in Agent Context** — Liang, Li, Zeng, Lau, Hu (2026-09-26). https://arxiv.org/abs/2609.32339 — Load-on-demand skills arrive too late; a small budgeted always-present pool won on three benchmarks.
- **An Empirical Cost Attribution of Context-Compression Gateways** — Chen, Shi (2026-08-19). https://arxiv.org/abs/2609.22114 — In a production gateway, each on-demand recall re-sends exactly the segment compressed away, so heavy recall spends the saving back.

The wider fan-out — vendor posts, docs, tool retrieval, progressive disclosure, and restorable eviction — is in [references-just-in-time-context](references-just-in-time-context.md).

## How to read this list against the clusters

The cluster nodes are engineering distillations that add production concerns the research mostly doesn't cover (token budgets, eviction policy, never-forget-constraints, the consolidator-as-testable-component). The papers establish the *phenomena and mechanisms*; the clusters add the *production discipline*. Where I could only partially verify a claim (the generative-agents scoring formula), the node says so rather than overstating.

## Verification note

All five URLs fetched and confirmed on 2026-06-12 (per the repo's never-guess-URLs rule). arXiv IDs are stable; the Chroma URL is a living page (redirected from `research.trychroma.com` → `www.trychroma.com/research/context-rot`). The one unverified detail (generative-agents scoring formula) is flagged inline above rather than asserted.
