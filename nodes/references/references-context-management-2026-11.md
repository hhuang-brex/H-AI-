---
id: references-context-management-2026-11
type: reference
tags: [context, compaction, prompt-caching, kv-cache, context-rot, reading-list]
summary: "verified papers from 2026-10-15 to 11-19 on context management for agents: what compaction costs, why shorter context can cost more under caching, what context rot really is, and lossless alternatives to summarizing."
related:
  - [[context-engineering]]
  - [[context-compaction]]
  - [[context-budget-allocation]]
  - [[just-in-time-context]]
  - [[harness-token-economics]]
  - [[references-context-and-memory]]
  - [[references-just-in-time-context]]
status: living
created: 2026-11-20
---

# References — Context Management, November 2026

An arXiv sweep of 2026-10-15 → 11-19 returned about 270 new titles on context engineering, compaction, caching, and context rot; 22 were opened. Every abstract below was fetched on **2026-11-20**. Numbers are author-reported, abstract-level only.

## 1. What compaction actually costs

| Paper | Finding |
|---|---|
| **Compact-Bench** — Sun et al. (v2 2026-10-28). [2610.31710](https://arxiv.org/abs/2610.31710) | Pairs full-history and summary-only continuations from the same state. Across 14 summarizers, compaction damaged 5–64% of 22 tasks the full history solved. **LLM summaries kept at most 16.0% of recurring details, versus 79.1% for mechanical extraction**; production summaries kept 15.7%. |
| **Benchmarks Are Surprisingly Compaction-Friendly** — Salle et al. (2026-10-22). [2610.31778](https://arxiv.org/abs/2610.31778) | On three long-horizon benchmarks, the compaction threshold did not measurably matter for two 1M-context models; the smallest-window model got worse at lower thresholds. **No method beat default self-summarization.** Benchmarks may understate the damage Compact-Bench measures. |
| **KEEP-Bench** — Man et al. (2026-10-19). [2610.26827](https://arxiv.org/abs/2610.26827) | QA accuracy hides lost evidence, since a reader can answer correctly from an unfaithful compression. On inputs averaging 3.1K tokens, the best proprietary model kept all required evidence in only **61.6%** of cases. |
| **Does Context Compression Preserve Refusal Alignment?** — Nguyen, Lin (2026-11-04). [2611.06380](https://arxiv.org/abs/2611.06380) | Encoder-based compression "systematically weakens refusal behaviour" despite high reconstruction fidelity. Semantic preservation is not behavioral preservation. |
| **MEMENTO** — Zhang et al. (2026-10-30). [2611.00244](https://arxiv.org/abs/2611.00244) | Off-the-shelf models "often write ineffective notes" when compacting; a trained 8B note-taker went from 36.9% to 67.8% on book-length QA while holding under 20K tokens. |

## 2. Shorter context is not always cheaper

| Paper | Finding |
|---|---|
| **Context Has a Price** — Yang et al. (2026-11-17). [2611.22238](https://arxiv.org/abs/2611.22238) | Over 20,000 coding-agent runs. When cached input costs a tenth of uncached, **removing old observations raised cost 38–116%** — the same method saved 19–36% without a cache discount. Adding retrieved code cut searches 18–34% but raised cost 33–42% with no gain in resolution. Shorter prompts can also make agents take more steps. |
| **Silent and Costly: Prompt-Caching Mis-Integration** — Zhang et al. (v2 2026-10-27). [2610.34817](https://arxiv.org/abs/2610.34817) | 120 caching-related pull requests across 10 open-source agents: misconfiguration and miscounted cache reads, and **"most mis-integrations fail silently."** |
| **Bursts That Outlast Themselves** — Huang, Liu (2026-11-10). [2611.13412](https://arxiv.org/abs/2611.13412) · **Inside the Trap** — Valse, Jannesari (2026-11-06). [2611.08902](https://arxiv.org/abs/2611.08902) | A brief load burst can tip a prefix-cached server into a lasting state where nearly every turn misses the cache and throughput halves, at loads it handled before. A session cap prevented it in all 30 capped runs. |

## 3. What context rot actually is

| Paper | Finding |
|---|---|
| **Length Is Cheap, Competition Is Not** — Liu, single author (2026-11-03). [2611.04169](https://arxiv.org/abs/2611.04169) | On five small open models, neutral filler cost nothing up to 32K tokens. **Statements shaped like the evidence dropped accuracy to 0.16–0.33**, and one rival value multiplied the loss 9–110×. Attention left on the evidence explained up to 58% of the loss; length, at most 8%. |
| **PACE: Keeping the Right Tokens in the KV Cache Is Not Enough** — Chatterjee, single author (2026-11-06). [2611.10240](https://arxiv.org/abs/2611.10240) | With 99.6% of needed tokens still cached, late-step accuracy fell from 93% to 64% as the distance between a definition and its use grew. The tokens were present but unretrievable; renumbering positions fixed it. |

## 4. Context lost before the model sees it

| Paper | Finding |
|---|---|
| **Context Is a Pipeline, Not a Window** — Sehgal et al. (2026-10-26). [2610.36114](https://arxiv.org/abs/2610.36114) | The window was under 6% full, yet **a third of tool results were cut** before reaching the model, by slicing JSON at a fixed length. One field arrived in 4.7% of calls, another in 99.3%, and diagnosis accuracy tracked which one held the evidence. |
| **Same Simulation, Different Evidence** — Zhang et al. (v2 2026-11-16). [2610.26836](https://arxiv.org/abs/2610.26836) | Reading a long tool report through an index instead of in context cost two GPT models 7.9–11.3 points but not two Claude models; agents skipped the report and answered from the wrong source, which the authors call "evidence substitution." |
| **Stale Instruction Files Override the Code** — Xu, Wu (2026-10-22). [2610.30571](https://arxiv.org/abs/2610.30571) | When the instruction file disagreed with the code, 90.1% of agent choices followed the stale file, even after noticing the conflict. One sentence giving the code precedence raised code-following from 4.2% to 91.4%. |

## 5. Lossless alternatives to summarizing

| Paper | Finding |
|---|---|
| **Forget Freely, Grep Later (GrepMem)** — Yang, Shi, Zhao (2026-11-18). [2611.25123](https://arxiv.org/abs/2611.25123) | An append-only plain-text log of the full history plus regex search: **95–97% on ContextBench versus at most 21% for lossy baselines**, with no embeddings or index. |
| **Semantic Context Handoff** — Zheng et al. (2026-11-18). [2611.24357](https://arxiv.org/abs/2611.24357) | Separate a compact state from addressable evidence that can re-enter context: SWE-bench Pass@1 from 80.0% to 86.9% at unchanged token use. |
| **CarryOn** — Li et al. (2026-11-13). [2611.17808](https://arxiv.org/abs/2611.17808) | Compact state plus source-linked evidence chosen by a learned selector, with no extra LLM calls; reports cost per successful task. |
| **Folio** — Ruan et al. (2026-11-12). [2611.16627](https://arxiv.org/abs/2611.16627) | Records turn notes, an event manifest, and source records as three linked levels, so folding is programmatic and every fold keeps handles back to the evidence. |
| **WAAC** — Zhuang et al. (v2 2026-11-09). [2611.08865](https://arxiv.org/abs/2611.08865) | Decide what to keep from cross-step dependencies in the workflow, not text importance. |

## 6. Measurement caution

| Paper | Finding |
|---|---|
| **What Does a Harness Buy? Tokens, Mostly** — Liu, Han (v2 2026-11-18). [2610.04433](https://arxiv.org/abs/2610.04433) | Across seven models and three production harnesses, a harness swap changed about as many outcomes as a rerun of the same harness; the bounded difference was 2–5 points. |
| **Switch-SWE** — Chang et al. (2026-11-01). [2611.02017](https://arxiv.org/abs/2611.02017) | Matched sessions with and without interleaved unfinished tasks, to measure whether an agent can resume a task after switching away. |

## What failed to verify

- **The two compaction benchmarks disagree.** Compact-Bench finds large damage on real repairs; "Compaction-Friendly" finds little effect on public benchmarks. They measure different things — isolated continuations versus end-to-end scores — and neither was re-run here.
- **The context-rot result uses small models** (0.5B–3B) on retrieval; whether it holds for frontier models on agent tasks is untested.
