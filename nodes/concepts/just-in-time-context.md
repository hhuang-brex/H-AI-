---
id: just-in-time-context
type: concept
tags: [agent, context, retrieval, progressive-disclosure, agentic-search, token-budget, engineering-excellence]
summary: "keep lightweight references in the window and load the data behind them with tools only when a turn needs it; when that beats precomputed retrieval, when it loses, and how to make it reversible."
related:
  - [[context-engineering]]
  - [[context-assembly-per-turn]]
  - [[context-budget-allocation]]
  - [[context-compaction]]
  - [[context-storage-and-hydration]]
  - [[domain-knowledge-injection]]
  - [[memory-retrieval]]
  - [[agent-skills-progressive-disclosure]]
  - [[skill-injection-decision]]
  - [[subagent-context-isolation]]
  - [[tool-result-grounding]]
  - [[harness-token-economics]]
  - [[text-to-sql-retrieval]]
  - [[references-context-and-memory]]
  - [[references-just-in-time-context]]
  - [[mcp-tool-layer]]
  - [[code-execution-sandbox-pattern]]
  - [[run-state-model]]
status: living
created: 2026-10-15
---

# Just-in-Time Context

**Definition.** Instead of loading everything a task might need before the model runs, the agent holds **lightweight identifiers** — file paths, record ids, stored queries, links — and uses tools to pull the data behind them into the window at the moment a step needs it. Anthropic's applied-AI team names the pattern and contrasts it with "embedding-based pre-inference time retrieval," the default in most AI-native applications ([Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 2025-09-29, fetched 2026-10-15).

The memory literature calls the two poles **ahead-of-time (AOT)** and **just-in-time (JIT)**. AOT builds a compact memory before any request arrives, which is cheap to serve but "can discard fine-grained information that later becomes important." JIT keeps the raw history and constructs context per request ([2609.34385](https://arxiv.org/abs/2609.34385); its predecessor GAM frames this as "just-in-time compilation," [2511.18423](https://arxiv.org/abs/2511.18423)).

## Mechanics

| Piece | What it does | Source |
|---|---|---|
| **Reference, not payload** | The window holds an id plus enough description to decide whether to open it. `head`/`tail` over a large file inspects it "without ever loading the full data objects into context." | Anthropic post |
| **Metadata as signal** | Folder hierarchy, naming, file size, and timestamps tell the agent what to open before it opens anything. | Anthropic post |
| **Progressive disclosure** | The agent discovers context incrementally, each read informing the next. Skills apply the same idea to capability — see [agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md). | Anthropic post |
| **Preview, then admit** | Show short previews of retrieved candidates and let the agent choose which, and how many, to read in full. Separates what is *retrieved* from what is *allowed to shape reasoning*. | SEEDS, [2610.12932](https://arxiv.org/abs/2610.12932) |
| **Reversible eviction** | Replace a large tool output with a placeholder and keep the original retrievable. | DTOC, [2609.26121](https://arxiv.org/abs/2609.26121); CADOC, [2609.37012](https://arxiv.org/abs/2609.37012) |
| **State as an index** | Keep typed state nodes with references to raw observations, and reveal history progressively as reasoning needs it. | FlowState, [2609.34565](https://arxiv.org/abs/2609.34565) |

The hybrid is the production default. Claude Code drops `CLAUDE.md` into context up front and uses `glob` and `grep` to fetch files just in time, which the post says sidesteps "stale indexing and complex syntax trees." The post's own guidance is that the right balance depends on the task, and to "do the simplest thing that works."

## Three things you can load just in time

The 2026-10-16 fan-out ([references-just-in-time-context](../references/references-just-in-time-context.md)) shows the pattern applies to three different payloads, each with its own shipped mechanism.

| Payload | Mechanism | Example numbers (self-reported) |
|---|---|---|
| **Data** | Hold ids and paths; read with tools; filter large results in code before they reach the model | A 10,000-row sheet filtered to five rows in a sandbox (Anthropic, *Code execution with MCP*) |
| **Tool definitions** | `defer_loading` plus a search tool; keep 3–5 hot tools loaded | ~77K → ~8.7K tokens before work begins, and MCP-eval accuracy 49% → 74% (Anthropic, *Advanced tool use*). Retrieved descriptions: 43.13% vs 13.62% selection accuracy ([2505.03275](https://arxiv.org/abs/2505.03275)) |
| **The agent's own history** | Evict with a restorable stub; fault back in on demand | 21.8% of 4.45M production input tokens was structural waste; a paging proxy cut live context up to 93% ([2603.09023](https://arxiv.org/abs/2603.09023)) |

Tool definitions are the cheapest place to start, because the mechanism is shipped and the definitions are pure overhead until a tool is chosen — see [tool-selection-and-routing](tool-selection-and-routing.md).

## When it wins, and when it loses

The evidence is two-sided. All numbers are author-reported.

| Result | Favors | Source |
|---|---|---|
| An agent searching the raw corpus with `grep`, file reads, and scripts beat strong sparse, dense, and reranking baselines on several BRIGHT and BEIR sets, with no index. | JIT | Direct corpus interaction, [2605.05242](https://arxiv.org/abs/2605.05242) |
| On a 116-question LongMemEval sample, `grep` generally beat vector retrieval, but the score depended strongly on the harness and on whether results came inline or as files. | JIT, harness-dependent | [2605.15184](https://arxiv.org/abs/2605.15184) |
| A file-system agent led only at small corpus sizes, spent **39×** more query tokens, and was overtaken by BM25 around **10 million** corpus tokens, trailing by nearly 20 points at full scale. | AOT at scale | [2607.26497](https://arxiv.org/abs/2607.26497) |
| On repository QA, semantic search answered **65.2%** correctly against **46.2%** for grep-by-subagent, at under half the cost per correct answer. **41.8%** of the agentic failures happened at the planner–subagent hand-off, usually as a confident wrong answer. | AOT for read-only, indexable corpora | [2608.01507](https://arxiv.org/abs/2608.01507) |
| JIT memory beat AOT memory systems on agent-memory and long-context benchmarks while staying cheaper than prior trained agentic memory. | JIT for memory | JAM, [2609.34385](https://arxiv.org/abs/2609.34385) |
| Keeping typed state with references cut tokens **43.2%** and **40.6%** while raising success **+4.55** and **+13.95** points against full context. | JIT over full history | FlowState |
| Compression without the ability to restore degraded performance; reversible compression recovered baseline accuracy at lower cost. Effects varied by model. | Reversibility, not JIT alone | DTOC |
| Load-on-demand skills leave guidance unavailable until the agent thinks to ask, often after it has committed to a bad approach. A small budgeted pool of always-present tips won. | A little AOT | TipsWarm, [2609.32339](https://arxiv.org/abs/2609.32339) |

The graph's reading of the table: **JIT wins when the corpus is small or changing, when exact matches matter, and when the relevant slice cannot be predicted before the turn. Ranked retrieval wins when the corpus is large and stable and the question is read-only.** The strongest combination in the scaling study was ranked discovery first, agentic reasoning after — "agentic reasoning works best after ranked discovery rather than in place of it."

**Progressive disclosure has measured limits.** A controlled study found the gain near zero when a strong harness already navigates well, decisive only once the corpus spans many documents, and **a second routing level never helped** ([2607.17598](https://arxiv.org/abs/2607.17598)). A preregistered wiki ablation found a capable agent skipped the catalog entirely and read the right page directly ([2607.04576](https://arxiv.org/abs/2607.04576)). Use one level of summaries, not a tree.

## For a conversing task agent

The canonical agent here has three kinds of context, and they want different policies. This split is the graph's synthesis, not any one source's.

| Context | Policy | Why |
|---|---|---|
| Operating rules, persona, the few constraints that must never be missed | **Up front, every turn** | A rule the model must ask for is a rule it will skip. TipsWarm's finding is the general case. |
| The user's records — transactions, calendar, documents, prior threads | **Just in time, by id** | Large, changing, and only a slice is relevant per turn. Hold ids and summaries; fetch on need. |
| Large reference corpora — policy manuals, product catalogs | **Ranked retrieval first, then JIT reads** | Past millions of tokens, agentic exploration alone loses to BM25. |

**Greedy fetching is the failure mode of unguided exploration.** A study comparing human and agent analysts on large codebases found that humans revisit functions and follow local structure, while strong agents "jump across the binary, retrieve information broadly, and rarely return to inspected code" — a behavior the authors call *greedy fetching* ([2610.14960](https://arxiv.org/abs/2610.14960), fetched 2026-10-19). Across 4,000 real programs it saturated the context window on larger targets. Two details carry over to any agent that explores by reading: agents given richer, higher-level representations "fetch less without losing understanding," and the authors conclude that scaling needs "better navigation, selective retrieval, and persistent analysis state, not merely larger context windows." Give an exploring agent a summary layer to navigate by and a place to write what it has already learned — see [run-state-model](run-state-model.md).

## Pitfalls

- **Exploration as the default for everything.** Runtime exploration is slower than reading precomputed results, and an agent without good guidance "can waste context by misusing tools, chasing dead-ends." Measure tokens per correct answer, not tokens per turn.
- **Irreversible eviction.** If a placeholder cannot be expanded back to the original, compression becomes data loss. Keep the original addressable.
- **Silent hand-off failure.** Delegating the search to a subagent protects the main window but adds a lossy summary step; that was the single largest failure class on repository QA. Check the subagent's return against the question — see [subagent-context-isolation](subagent-context-isolation.md).
- **Swapping tools mid-session.** Adding or removing tool definitions changes the cached prefix and leaves stale references in history; Manus masks tool logits instead, and Anthropic's tool search appends discovered tools inline so the prefix is untouched.
- **Breaking the prompt cache.** Every edit to earlier history invalidates the cached prefix. Batch evictions instead of editing every turn (CADOC), and keep volatile JIT reads in the tail — see [harness-token-economics](harness-token-economics.md).
- **Recall that spends the saving back.** In a production gateway, each recall re-sends exactly the segment just compressed away, so heavy recall erodes the cumulative saving one segment at a time ([2609.22114](https://arxiv.org/abs/2609.22114)).
- **Unaudited identifiers.** A model-chosen path or id is untrusted input to a tool. Validate it like any other argument — see [tool-result-grounding](tool-result-grounding.md).

## References

Primary framing: Anthropic, *Effective context engineering for AI agents* (2025-09-29). The fan-out of posts, docs, and papers is in [references-just-in-time-context](../references/references-just-in-time-context.md), with the first sources in [references-context-and-memory](../references/references-context-and-memory.md). All arXiv ids were fetch-confirmed at the abstract page on 2026-10-15 and 2026-10-16; no full texts were read. Siblings: [context-assembly-per-turn](context-assembly-per-turn.md) decides what goes in, [context-compaction](context-compaction.md) shrinks what stays, and [domain-knowledge-injection](domain-knowledge-injection.md) covers the other ways knowledge enters the prompt.
