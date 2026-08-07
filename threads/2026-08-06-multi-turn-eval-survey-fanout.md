---
id: 2026-08-06-multi-turn-eval-survey-fanout
type: thread
tags: [meta, research, fan-out, eval, multi-turn, memory, planner]
related:
  - [[references-multi-turn-agent-eval]]
  - [[agent-trajectory-eval]]
  - [[memory-types-taxonomy]]
  - [[reflection-loop-taxonomy]]
  - [[llm-evaluation]]
  - [[agent-memory]]
status: snapshot
created: 2026-08-06
summary: "fan-out of the ~250-source multi-turn agent evaluation survey (arXiv:2503.22458 v2): taxonomies extracted from LaTeX source, 8 anchors verified, 3 concept deepenings, 5 citation defects recorded."
---

# Thread — Multi-Turn Agent Eval Survey Fan-Out (2026-08-06)

## Goal

Fan out one seed paper — *Evaluating LLM-based Agents for Multi-Turn Conversations: A Survey* ([arXiv:2503.22458](https://arxiv.org/abs/2503.22458), Guan, Wang, Bian, Zhu, Lou, Xiong; v1 2025-03-28, v2 2026-01-05) — into the graph: extract what is reusable, verify its anchors independently, and deepen the nodes it touches.

## Method

Read the survey from its **arXiv LaTeX source** (`arxiv.org/src/2503.22458`) rather than a PDF summary — no local PDF text extraction was available (`pdftotext`/pymupdf/pdfminer all absent), and the TeX source turned out strictly better: the taxonomy figures are `forest` trees with per-leaf citations, and `sample-base.bib` gives exact arXiv ids for every claim. Then verified 8 anchors at their own primary source (arXiv abstract pages + ACL Anthology).

## Outputs

- New: [references-multi-turn-agent-eval](../nodes/references/references-multi-turn-agent-eval.md) — survey mapped to graph clusters as a table, 8 verified anchors, defect list.
- Deepened [agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md) — new section "Interleaving, not length, is the variable."
- Deepened [memory-types-taxonomy](../nodes/concepts/memory-types-taxonomy.md) — new section on the orthogonal **span × form** decomposition, read as a matrix.
- Deepened [reflection-loop-taxonomy](../nodes/concepts/reflection-loop-taxonomy.md) — new section splitting process reflection into **plan verification** (a gate) vs **plan selection** (a search, in-generation or post-generation).

## Key insights

- **Interleaving is the load-bearing variable, not conversation length.** Models "perform well on single-task interactions" but degrade on the *same* tasks once interleaved with context switching, and short-context models with long-term memory matched or beat larger-context models ([arXiv:2409.20222](https://arxiv.org/abs/2409.20222), NeurIPS D&B 2024). A suite of long single-task trajectories will pass while production fails.
- **Span × form beats type alone for memory design.** "Permanent × parametric" and "permanent × textual-retrieved" are the same *type* (semantic) with completely different write cost, auditability, and unlearning story. Pick a cell, not a type.
- **Verification and selection are different reflection jobs.** Verification is a pass/fail gate on one plan and is where confirm-before-act attaches; selection is a search over candidates and costs a multiple of the plan budget. "Add a reflection step" fails when it's selection that was needed, or vice versa.
- **The survey's best contribution is a critique**: evaluation "tend[s] to assess conversation turns in isolation rather than holistically." Its future-work list doubles as a gap checklist (test-time self-assessment, error propagation across turns, cumulative tool use, privacy-preserving evaluation via TEE/federated learning).

## What failed to verify

Reading the v2 source surfaced five defects, all recorded in the reference node:

1. **LoCoMo mis-cited** — survey says "600 turns and 16K tokens"; LoCoMo's own abstract says **300 turns / 9K tokens on average, up to 35 sessions** ([arXiv:2402.17753](https://arxiv.org/abs/2402.17753)). Not reconcilable from the abstract.
2. Two literal `https://example.com/...` placeholder `\href`s survive in the published v2 source.
3. An unresolved `\cite{cite-key}` placeholder in the data-generation section.
4. The "Philosophical and Ethical Dimensions" future-work bullet appears **twice**, near-verbatim.
5. "LongEval" attributed to a paper whose verified title is *Long Context RAG Performance of Large Language Models* — left flagged, not resolved.

Verdict recorded in the node: use it as a bibliography and a taxonomy, not as a source of numbers. No venue is stated on its abstract page, so treat it as an unrefereed preprint.

## Process notes

- The arXiv API 429s hard after repeated `id_list` batches and can return **HTTP 200 with an empty body**; per-paper WebFetch on `arxiv.org/abs/` pages is the reliable fallback. Space API calls ≥3s and expect to switch.
- `arxiv.org/html/<id>v2` 404s for this paper — the `/src/` tarball is the general-purpose route for reading a paper properly.

## Open gaps

- Several survey anchors remain unverified and therefore uncited here: LongEval, MemSim, API-Bank, Factcheck-Bench, MMDU, ConvBench, HUMOD, BotChat, DialFact. Worth a second pass if the tool-use or fact-checking clusters need grounding.
- The survey's privacy-preserving-evaluation direction (TEE, federated learning) has no node in this graph and no verified source yet.
