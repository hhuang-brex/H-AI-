---
id: references-just-in-time-context
type: reference
tags: [context, just-in-time, retrieval, tool-search, progressive-disclosure, agentic-search, reading-list]
summary: "verified fan-out on just-in-time context: the vendor posts and docs that define it, the retrieval lineage it descends from, and the papers that measure where it beats or loses to loading up front."
related:
  - [[just-in-time-context]]
  - [[references-context-and-memory]]
  - [[tool-selection-and-routing]]
  - [[agent-skills-progressive-disclosure]]
  - [[context-compaction]]
  - [[subagent-context-isolation]]
  - [[code-execution-sandbox-pattern]]
  - [[harness-token-economics]]
  - [[mcp-tool-layer]]
  - [[references-model-context-protocol]]
status: living
created: 2026-10-16
---

# References — Just-in-Time Context

Fan-out from [just-in-time-context](../concepts/just-in-time-context.md). Every page below was fetched on **2026-10-16**. Vendor posts and docs are living pages and describe mechanism; their numbers are self-reported. arXiv entries were read at the abstract page only. Sources already listed in [references-context-and-memory](references-context-and-memory.md) are not repeated.

## 1. Definitions and vendor practice

| Source | What it contributes |
|---|---|
| **Effective context engineering for AI agents** — Rajasekaran, Dixon, Ryan, Hadfield (Anthropic, 2025-09-29). [link](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Names the strategy: lightweight identifiers, loaded at runtime with tools. Gives the hybrid (`CLAUDE.md` up front, `glob`/`grep` on demand) and the cost: exploration is slower than precomputed retrieval. |
| **Code execution with MCP** — Jones, Kelly (Anthropic, 2025-11-04). [link](https://www.anthropic.com/engineering/code-execution-with-mcp) | Tools exposed as a file tree the agent lists and opens on demand. Example cut "from 150,000 tokens to 2,000 tokens," and a 10,000-row sheet filtered in code so "the agent sees five rows." States the cost: a sandbox with "operational overhead and security concerns that direct tool calls avoid." |
| **Introducing advanced tool use** — Bin Wu + team (Anthropic, 2025-11-24). [link](https://www.anthropic.com/engineering/advanced-tool-use) | Tool Search with `defer_loading`: ~77K → ~8.7K tokens before work begins, and MCP-eval accuracy "Opus 4 improved from 49% to 74%." Use it at 10+ tools or >10K tokens of definitions; "keep your three to five most-used tools always loaded." Programmatic tool calling: "200KB of raw expense data to just 1KB of results," 43,588 → 27,297 average tokens. |
| **Context Engineering for AI Agents: Lessons from Building Manus** — Yichao 'Peak' Ji (2025-07-18). [link](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) | The cache constraint on JIT. KV-cache hit rate is "the single most important metric"; avoid "dynamically adding or removing tools mid-iteration" and mask logits instead. Treats the file system as "the ultimate context" and makes compression "always restorable" — drop a page's content "as long as the URL is preserved." |
| **Context Engineering** — LangChain team (2025-07-02). [link](https://www.langchain.com/blog/context-engineering-for-agents) | The write / select / compress / isolate taxonomy; JIT is "select." Quotes Windsurf: "Indexing code ≠ context retrieval," and embedding search "becomes unreliable … as the size of the codebase grows," so they combine grep, a knowledge graph, and re-ranking. |
| **How Long Contexts Fail** (2025-06-22) and **How to Fix Your Context** (2025-06-26) — dbreunig.com, no byline on the page. [fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html) · [fix](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html) | Names poisoning, distraction, confusion, and clash — "if you put something in the context the model has to pay attention to it." The fix post calls tool selection "tool loadout" and cites RAG-MCP's ~3× accuracy at under 30 tools. |
| **Why Cline Doesn't Index Your Codebase** — Nick Baumann (2025-05-27). [link](https://cline.bot/blog/why-cline-doesnt-index-your-codebase-and-why-thats-a-good-thing) | The anti-index case for code: chunking "tearing apart its logic," indexes as "a snapshot frozen in time," and embeddings that "doubled your security surface." Concedes file reading is slower for simple lookups. Vendor argument, no measurement. |
| **Code Mode: the better way to use MCP** — Kenton Varda, Sunil Pai (Cloudflare, 2025-09-26). [link](https://blog.cloudflare.com/code-mode/) | MCP tools become a TypeScript API the model writes code against; intermediate results never reach the model. Admits "Currently, the entire API is loaded" — results are JIT, definitions are not yet. No benchmark numbers. |

## 2. Shipped mechanisms (docs)

| Doc | Mechanism |
|---|---|
| **Tool search tool** — Claude Platform docs. [link](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) | Calls itself "an instance of the broader just-in-time retrieval principle." Deferred tools stay out of the system-prompt prefix and expand inline, so "prompt caching is preserved." Up to 10,000 deferred tools; 5 results per search by default. Summarized in [tool-selection-and-routing](../concepts/tool-selection-and-routing.md). |
| **Connect Claude Code to tools via MCP** — Claude Code docs. [link](https://code.claude.com/docs/en/mcp) | Tool search is on by default: "only tool names and server instructions load at session start." `ENABLE_TOOL_SEARCH=auto` loads upfront until definitions reach 10% of the window. Results past the token limit (25,000 by default) or 50,000 characters are "saved to a file" and replaced by the path, "so Claude reads the file when it needs the content." |

## 3. Lineage — retrieval that decides when to fetch

| Paper | Step it adds |
|---|---|
| **ReAct** — Yao et al. (2022). [2210.03629](https://arxiv.org/abs/2210.03629) | Interleaves reasoning with tool calls, so retrieval happens mid-trajectory. |
| **Active Retrieval Augmented Generation (FLARE)** — Jiang et al. (EMNLP 2023). [2305.06983](https://arxiv.org/abs/2305.06983) | "Actively decide when and what to retrieve" during generation, instead of once from the input. |
| **Self-RAG** — Asai et al. (2023-10-17). [2310.11511](https://arxiv.org/abs/2310.11511) | Retrieves "on-demand," arguing that a fixed number of passages "regardless of whether retrieval is necessary" hurts. |
| **Adaptive-RAG** — Jeong et al. (NAACL 2024). [2403.14403](https://arxiv.org/abs/2403.14403) | A small classifier routes each query to no retrieval, one step, or multi-step by complexity. |
| **Search-R1** — Jin et al. (v5 2025-08-05). [2503.09516](https://arxiv.org/abs/2503.09516) | RL teaches the model to issue its own search queries during reasoning. |
| **MemGPT** — Packer et al. | Virtual context paging; listed in [references-context-and-memory](references-context-and-memory.md). |

## 4. Tools loaded on demand

| Paper | Finding |
|---|---|
| **Toolshed** — Lumer et al. (2024-10-18). [2410.14594](https://arxiv.org/abs/2410.14594) | A tool knowledge base with pre-, intra-, and post-retrieval steps; +46, +56, +47 points Recall@5 on three benchmarks. |
| **ToolRet: Retrieval Models Aren't Tool-Savvy** — Shi et al. (ACL 2025). [2503.01763](https://arxiv.org/abs/2503.01763) | Strong conventional retrievers "exhibit poor performance" on 43k tools, and that drags down task pass rate. |
| **RAG-MCP** — Gan, Sun (2025-05-06). [2505.03275](https://arxiv.org/abs/2505.03275) | Retrieving MCP descriptions before the call: **43.13% vs 13.62%** selection accuracy, prompt tokens down over 50%. |
| **MCP-Zero** — Fei, Zheng, Feng (v4 2025-06-24). [2506.01056](https://arxiv.org/abs/2506.01056) | The model writes its own structured tool request instead of receiving retrieved candidates; 308 servers, 2,797 tools. |
| **Efficient On-Device Agents via Adaptive Context Management** — Vijayvargiya, Lokesh (v2 2026-09-13). [2511.03728](https://arxiv.org/abs/2511.03728) | "Just-in-time schema-passing" loads a full definition only on selection; initial tool context down over 6× on 3B on-device models. |
| **Dynamic System Instructions and Tool Exposure (ITR)** — Franko, single author (2025-12-01). [2602.17046](https://arxiv.org/abs/2602.17046) | Retrieves prompt fragments as well as tools per step: 95% fewer tokens per step, 70% lower episode cost. Self-described "controlled benchmark with internally consistent numbers." |
| **Plan or Retrieve First?** — Zhang et al. (2026-10-13). [2610.19068](https://arxiv.org/abs/2610.19068) | Over 46,984 APIs, retrieving by query wins on single-tool tasks; having the model first write hypothetical tool stubs and retrieving by those wins on multi-tool tasks, at every k and registry size tested. |
| **Tool-Schema Compression** — Sakizli, single author (2026-05-24). [2605.26165](https://arxiv.org/abs/2605.26165) | At an 8K budget, 28 full schemas crowd out RAG (2.6% EM); compressed schemas restore +20.5 pp. At 32K the effect vanishes, so it is purely budget-driven. |

## 5. Progressive disclosure, measured

| Paper | Finding |
|---|---|
| **Is Progressive Disclosure All You Need for Long-Context Agents?** — He, Zhao, Wang, Chen (2026-07-20). [2607.17598](https://arxiv.org/abs/2607.17598) | On one book the gain depends on the harness and is near zero for a strong one. Across many books raw navigation "collapses" while one level of disclosure pulls ahead. **A second routing level never helps.** "Progressive disclosure buys context, not intelligence." |
| **Progressive Disclosure for LLM-Maintained Wiki Knowledge Bases** — Cochran, single author, preregistered (v2 2026-10-07). [2607.04576](https://arxiv.org/abs/2607.04576) | A capable agent never loaded the catalog; it inferred the page and read it. Cost fell in every condition; quality held only within limits the author states — weak human–judge agreement, and no evidence when the agent was forced to load the catalog first. |
| **APDMem** — Fu, Kulkarni, Ni, Madahian (EMNLP 2026 Industry). [2610.02472](https://arxiv.org/abs/2610.02472) | Four memory layers from summaries to raw messages, drilled into only as needed; reads **8%** of conversations on LongMemEval. |

## 6. Restorable eviction — JIT for the agent's own history

| Paper | Finding |
|---|---|
| **The Missing Memory Hierarchy: Demand Paging for LLM Context Windows** — Tony Mason, single author (2026-03-09). [2603.09023](https://arxiv.org/abs/2603.09023) | **21.8%** of 4.45M production input tokens was structural waste. A paging proxy evicts stale content and faults it back in: 0.0254% fault rate in replay, up to 93% less context live, and thrashing under sustained pressure. |
| **Recursive Language Models** — Zhang, Kraska, Khattab (v3 2026-05-11). [2512.24601](https://arxiv.org/abs/2512.24601) | Treats the prompt as an environment the model inspects programmatically and recurses over; inputs two orders of magnitude past the window. |
| **Scaling Long-Horizon LLM Agent via Context-Folding** — Sun et al. (2025-10-13). [2510.11967](https://arxiv.org/abs/2510.11967) · **AgentFold** — Ye et al. (2025-10-28). [2510.24699](https://arxiv.org/abs/2510.24699) | Branch into a sub-trajectory and fold it to a summary: matches ReAct with an active context 10× smaller. |
| **Scroll: Context as an Environment** — Lin et al. (2026-08-21). [2608.21690](https://arxiv.org/abs/2608.21690) | Tool outputs live as variables in a persistent kernel over an append-only event log; only printed projections enter the window. |
| **ReFold** — Su, Tian, Zhang, Kundu (2026-10-06). [2610.07863](https://arxiv.org/abs/2610.07863) | Training-free, cache-aware folding where "every removal is strictly reversible." |
| **MemAgent** — Yu et al. (ICLR 2026 oral). [2507.02259](https://arxiv.org/abs/2507.02259) · **Sleep-time Compute** — Lin et al. (2025-04-17). [2504.13171](https://arxiv.org/abs/2504.13171) | The ahead-of-time counterpoints: overwrite a fixed memory while reading, or precompute about a context before queries arrive (~5× less test-time compute at equal accuracy). |

## What failed to verify, and discrepancies

- **The dbreunig posts carry no byline.** The site suggests Drew Breunig, but the name does not appear on the pages; they are cited by domain.
- **Two programmatic-tool-calling figures disagree.** The Anthropic post reports 43,588 → 27,297 average tokens (37%). [tool-selection-and-routing](../concepts/tool-selection-and-routing.md) cites the docs page at 24% fewer input tokens. They may measure different workloads; neither was re-derived here.
- **The advanced-tool-use post shows two token figures** for tool search: ~77K → ~8.7K in the text, and a caption contrasting 191,300 with 122,800 tokens preserved.
- **Several arXiv titles were mistaken in search** ("ReSum" matched dozens of résumé-screening papers). Only ids listed here were opened.
