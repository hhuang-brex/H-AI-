---
id: references-episode-boundary-detection
type: reference
tags: [conversation, segmentation, episode, boundary, memory, turn-taking, reading-list]
summary: "verified papers on detecting where conversational units start and end: end-of-turn detection, dialogue topic segmentation, disentanglement, event-segmentation memory, and multi-session work episodes."
related:
  - [[episode-boundary-detection]]
  - [[turn-outcome-signal]]
  - [[flat-channel-thread-tracking]]
  - [[turn-taking-and-proactivity]]
  - [[conversation-memory]]
  - [[references-context-and-memory]]
status: living
created: 2026-11-04
---

# References — Episode Boundary Detection

Backs [episode-boundary-detection](../concepts/episode-boundary-detection.md). Every arXiv abstract below was fetched on **2026-11-04**; numbers are author-reported, abstract-level only. Grouped from the smallest unit to the largest.

## 1. Turn level — has the user finished?

| Paper | Finding |
|---|---|
| **The Importance of Speech Genre for End-of-Turn Detector Training** — Sharon, Hacioglu, Prakash, Stolcke (2026-10-29). [2610.39742](https://arxiv.org/abs/2610.39742) | Training on conversational rather than single-turn speech gave up to +0.45 F1, from fewer false alarms on mid-turn pauses. A 1.8M-parameter model beat open baselines on every test set. |
| **VoxTurn** — Yang Xiao, single author (2026-10-15). [2610.21150](https://arxiv.org/abs/2610.21150) | Asks several turn-taking questions in one pass. Open detectors cut users off in more than a quarter of mid-turn pauses; VoxTurn reached 11.5% false cut-offs in English at 300 ms. |
| **Using Semantic Uncertainty to Estimate Transition Relevance** — Umair, de Ruiter (Findings of ACL). [2609.10934](https://arxiv.org/abs/2609.10934) | Predicts where a listener may take the floor from how strongly the turn so far constrains what comes next. |
| **PACT-SLM: When Does a Spoken Agent Have Enough Evidence to Act?** — Geng, single author (v2 2026-10-07). [2609.38232](https://arxiv.org/abs/2609.38232) | Scores action timing as well as identity: an agent can pick the right final action after acting too early. |

## 2. Topic level — has the conversation moved on?

| Paper | Finding |
|---|---|
| **SuperDialseg** — Jiang, Dong, Kurohashi, Aizawa (EMNLP 2023). [2305.08371](https://arxiv.org/abs/2305.08371) | 9,478 dialogues with boundaries defined from grounding documents; supervised training "is extremely effective in-domain." |
| **S3-DST** — Das, Shah, Wan et al. (2023-09-16). [2309.08827](https://arxiv.org/abs/2309.08827) | Joint segmentation and state tracking per segment in open-domain chat, zero-shot with structured prompting. |
| **Def-DTS** — Lee, Yoo, Jung, Song (Findings of ACL 2025). [2505.21033](https://arxiv.org/abs/2505.21033) | LLM deductive reasoning: summarize context both ways, classify intent, then detect the shift. |
| **When F1 Fails** — Coen, single author (v3 2025-12-31). [2512.17083](https://arxiv.org/abs/2512.17083) | Across eight datasets, differences "often reflect annotation granularity mismatch rather than boundary placement quality." |
| **DASH-DTS** — Sun et al. (AAAI workshop 2026). [2512.15042](https://arxiv.org/abs/2512.15042) | Detects shifts from conversational handshakes, with confidence per segment. |
| **CobSeg** — Sun et al. (2026-05-29). [2605.30668](https://arxiv.org/abs/2605.30668) | Separates semantic continuity from lexical cues; runs without LLM calls at inference. |

## 3. Thread level — which conversation is this?

| Paper | Finding |
|---|---|
| **A Large-Scale Corpus for Conversation Disentanglement** — Kummerfeld et al. (ACL 2019). [1810.11118](https://arxiv.org/abs/1810.11118) | 77,563 annotated messages; found 80% of conversations in a widely used corpus "are either missing messages or contain extra messages." |
| **APO-DD** — Takada et al. (v2 2026-10-19). [2606.07894](https://arxiv.org/abs/2606.07894) | GEPA-optimized prompts for disentanglement: 68.7 vs 57.5 for the best hand-refined prompt on Ubuntu IRC. |

## 4. Episode level — boundaries in agent memory

| Paper | Finding |
|---|---|
| **EM-LLM: Human-inspired Episodic Memory for Infinite Context LLMs** — Fountas et al. (v3 2025-10-10). [2407.09450](https://arxiv.org/abs/2407.09450) | Segments the token stream into episodes at Bayesian-surprise spikes, refined with graph methods, online and without fine-tuning. |
| **ES-Mem** — Zou et al. (v2 2026-01-13). [2601.07582](https://arxiv.org/abs/2601.07582) | Event Segmentation Theory applied to dialogue memory: dynamic boundaries instead of fixed chunks. |
| **HiMem** — Zhang et al. (2026-01-10). [2601.06377](https://arxiv.org/abs/2601.06377) | Topic and surprise as two segmentation channels, with memory reconsolidation on conflict. |
| **HingeMem** — Zhong, Gao, Wang (TheWebConf 2026). [2604.06845](https://arxiv.org/abs/2604.06845) | Draws a boundary when person, time, location, or topic changes. |
| **Chain on Demand** — Lu, Li, Xue (2026-11-02). [2611.02480](https://arxiv.org/abs/2611.02480) | Organizes evidence at query time over unchanged turn-level memory: 82.2% on non-adversarial LoCoMo questions. |
| **Online Generic Event Boundary Detection** — Jung et al. (ICCV 2025). [2510.06855](https://arxiv.org/abs/2510.06855) · **Predictive Event Segmentation** — Basgol, Ayhan, Ugur (2022). [2210.05710](https://arxiv.org/abs/2210.05710) | The video and cognitive-science roots: boundaries where prediction fails, detected online. |

## 5. Work episodes across sessions

| Paper | Finding |
|---|---|
| **SessionFarmer: Harvesting SWE Benchmarks from Wild Vibe Coding Sessions** — Lu et al. (2026-11-02). [2611.02440](https://arxiv.org/abs/2611.02440) | Groups multi-turn, multi-session interactions "into work episodes centered on one engineering goal," filtering unrelated sessions. |
| **The Agent Board** — Hunt, Nguyen, Gill (2026-11-03). [2611.04100](https://arxiv.org/abs/2611.04100) | Durable shared tasks for work that "outlives any one model call"; agents block on a task and wake when it changes. |

## What failed to verify

- **No paper found treats task-end detection in an assistant conversation as its own problem.** The closest are state tracking per segment (S3-DST) and turn-level outcome labels, which this graph already covers in [turn-outcome-signal](../concepts/turn-outcome-signal.md). A targeted "task completion detection" search returned robotics and web-automation work, not dialogue.
- **Most memory-segmentation papers report retrieval accuracy, not boundary accuracy.** Their boundaries are judged only by whether downstream answers improve.
