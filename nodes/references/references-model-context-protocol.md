---
id: references-model-context-protocol
type: reference
tags: [agent, tool-use, mcp, protocol, interop, standards, reading-list, science-excellence]
summary: "verified primary sources grounding mcp-tool-layer, fanned out by category — projects (reference servers, FastMCP, mcp-agent, LangChain adapters), papers (landscape survey, RAG-MCP, two security audits), and blogs (launch, code-execution, Cloudflare Code Mode, writing tools for agents)."
related:
  - [[mcp-tool-layer]]
  - [[tool-use-design]]
  - [[prompt-injection-and-isolation]]
  - [[managed-agent-apis]]
status: living
created: 2026-08-02
---

# References — Model Context Protocol

Primary sources behind [mcp-tool-layer](../concepts/mcp-tool-layer.md). That node is an *engineering distillation* — what MCP standardizes on the wire, the current spec version, and the client-side MUSTs a consuming agent must enforce; this list grounds it in the protocol's own projects, the scholarship, and the practitioner writing. Fanned out into **projects / papers / blogs**, each entry fetched and its title/author/date confirmed on 2026-08-02 — not recalled from memory.

## Projects — the shipping code

- **modelcontextprotocol/servers** — Anthropic + community (Apache-2.0; ~89k★ as of 2026-08-02). https://github.com/modelcontextprotocol/servers — The official collection of **reference server implementations** (Everything, Fetch, Filesystem, Git, Memory, Sequential Thinking, Time; older GitHub/Slack/Postgres/etc. moved to `servers-archived`), and the jumping-off point to the SDKs (TypeScript, Python, Go, Rust, Java, C#, …) and the spec. README is explicit that these are **educational examples, not production-ready** — read that as the intended posture when [mcp-tool-layer](../concepts/mcp-tool-layer.md) treats an external server as a trust boundary. Pin a commit if citing a specific server list or star count; this is a moving artifact.

- **PrefectHQ/fastmcp** — Jeremiah Lowin / Prefect (Apache-2.0, ~27k★). https://github.com/jlowin/fastmcp — The Pythonic framework for **building** MCP servers and clients; FastMCP 1.0 was folded into the official MCP Python SDK (2024) and the standalone line continued from there. The concrete authoring surface beneath [tool-schema-design](../concepts/tool-schema-design.md) when the tool lives in an MCP server.

- **lastmile-ai/mcp-agent** — lastmile-ai (Apache-2.0, ~8.5k★). https://github.com/lastmile-ai/mcp-agent — A composable framework for building agents *on* MCP: manages server-connection lifecycle and implements the *Building Effective Agents* patterns (router, orchestrator, evaluator-optimizer, parallel map-reduce, swarm), with durable execution via Temporal (pause/resume/recovery). The client-side counterpart to the server projects — shows MCP as the substrate under [multi-agent-delegation](../topics/multi-agent-delegation.md) and [tool-selection-and-routing](../concepts/tool-selection-and-routing.md).

- **langchain-ai/langchain-mcp-adapters** — langchain-ai (MIT, ~3.6k★). https://github.com/langchain-ai/langchain-mcp-adapters — A lightweight adapter converting MCP tools into LangChain/LangGraph tools, with a `MultiServerMCPClient` that loads tools across many servers. Notable detail for [tool-result-grounding](../concepts/tool-result-grounding.md): tool errors return to the model as a `ToolMessage` with `status="error"` — the errors-as-correctable-signal pattern instantiated in a second ecosystem. Evidence for MCP's interop claim — the protocol crossing framework boundaries.

## Papers — landscape and security scholarship

- **Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions** — Xinyi Hou, Yanjie Zhao, Shenao Wang, Haoyu Wang (2025-03-30, rev. 2025-10-07). https://arxiv.org/abs/2503.23278 — The systematic survey behind the node's trust-boundary framing: maps the **server lifecycle** across four phases (creation, deployment, operation, maintenance) into 16 activities, then builds a threat taxonomy over four attacker types ("malicious developers, external attackers, malicious users, and security flaws") with 16 scenarios and per-phase safeguards. The scholarly grounding for why "server selection is the consuming agent's leverage" and for the attack taxonomy [mcp-tool-layer](../concepts/mcp-tool-layer.md) defers to [prompt-injection-and-isolation](../concepts/prompt-injection-and-isolation.md).

- **RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation** — Tiantian Gan & Qiyao Sun (2025-05-06). https://arxiv.org/abs/2505.03275 — The scholarly datapoint for the node's "MCP standardizes discovery but **not** which-of-N-tools-to-fire" claim: move tool selection *outside* the model via semantic retrieval over an external index, passing only the top tools' descriptions. Author-reported >50% prompt-token reduction and tool-selection accuracy 43.13% vs 13.62% baseline. Grounds [tool-selection-and-routing](../concepts/tool-selection-and-routing.md) — the many-tools problem that "stays a client concern above MCP."

- **MCP Safety Audit: LLMs with the Model Context Protocol Allow Major Security Exploits** — Brandon Radosevich & John Halloran (2025-04-02, rev. 2025-04-11). https://arxiv.org/abs/2504.03767 — Demonstrates LLMs manipulated via MCP tools into "malicious code execution, remote access control, and credential theft," and ships **MCPSafetyScanner**, "the first agentic tool to assess the security of an arbitrary MCP server." The concrete exploit demonstration behind the node's insistence that tool descriptions from an untrusted server are attack surface.

- **Enterprise-Grade Security for the Model Context Protocol (MCP): Frameworks and Mitigation Strategies** — Vineeth Sai Narajala & Idan Habler (2025-04-11, rev. 2025-05-02). https://arxiv.org/abs/2504.08623 — Moves from threat theory to **actionable controls**: systematic threat modeling of vectors like tool poisoning, with implementable security patterns for enterprise adopters. Pairs with the survey above as the "what to *do* about it" — the governance layer behind the node's client-side MUST checklist.

## Blogs — announcement and practitioner engineering

- **Introducing the Model Context Protocol** — Anthropic (2024-11-25; protocol by David Soria Parra & Justin Spahr-Summers). https://www.anthropic.com/news/model-context-protocol — The launch that open-sourced MCP as "a new standard for connecting AI assistants to the systems where data lives," replacing fragmented custom integrations with one protocol. Open-sourced three things at once: the **spec + SDKs**, local server support in Claude Desktop, and the pre-built server repo above. The origin datum for the node's "de-facto tool-interop standard" claim — cite it for *provenance and intent*, and the spec/changelog (not this post) for anything version-specific, since the node's current protocol version (2025-11-25) is several revisions past this announcement.

- **Writing effective tools for agents — with agents** — Ken Aizawa, Anthropic (2025-09-11). https://www.anthropic.com/engineering/writing-tools-for-agents — Practitioner guidance framing tools as "a contract between deterministic systems and non-deterministic agents." The evaluation-driven workflow (prototype → eval → let Claude Code refactor the tools) plus principles — fewer purpose-built tools, namespacing (`asana_search`), natural-language IDs over UUIDs, `response_format` enums, token caps (~25k in Claude Code). The direct source for [tool-schema-design](../concepts/tool-schema-design.md) and the pagination/token-budget concerns in [paginated-tool-contract](../concepts/paginated-tool-contract.md).

- **Code execution with MCP: Building more efficient agents** — Adam Jones & Conor Kelly, Anthropic (2025-11-04). https://www.anthropic.com/engineering/code-execution-with-mcp — The engineering case that **direct tool-calling doesn't scale**: loading every definition floods context and every result round-trips the model. Fix — expose servers as a *code API* (tools as files, loaded on demand), reporting one example cut from 150k→2k tokens (98.7%), plus in-sandbox filtering, native control flow, and privacy. The primary source for [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) and [agent-skills-progressive-disclosure](../concepts/agent-skills-progressive-disclosure.md). (Note the node's own caveat: MCP's *security* sandbox ≠ this *context-saving* sandbox.)

- **Code Mode: the better way to use MCP** — Kenton Varda & Sunil Pai, Cloudflare (2025-09-26). https://blog.cloudflare.com/code-mode/ — The independent convergence on the code-execution thesis, from a different vendor and mechanism: convert MCP tools into a **TypeScript API** the LLM writes code against, because models are "better at writing code to call MCP, than at calling MCP directly." Runs generated code in **V8-isolate sandboxes** (via a Worker Loader API) with bindings replacing network access so "the AI cannot possibly write code that leaks any keys." Cite alongside the Anthropic code-execution post as *two vendors reaching the same conclusion independently* — MCP's residual value reduced to "a uniform way to connect to and learn about an API."

## How to read this list against the node

The node tracks the **live spec** (2025-11-25, draft stateless work in SEP-2575/2322) and normative client MUSTs; these references are the *stable substrate under it*. **Projects** show MCP shipping across server and client sides and multiple ecosystems (and the reference servers signal their own "educational, not production" caveat); **papers** supply the lifecycle + threat taxonomy and the exploit demonstrations the node's trust-boundary treatment compresses; **blogs** run from provenance (the launch) through practitioner tool-design to the code-execution turn — where two vendors (Anthropic, Cloudflare) independently conclude that at scale the model should *write code against* MCP rather than call it directly. Where node and sources diverge, the node is newer by design — it deliberately corrects the "2025-06-18 is current" and "there's an RC tier" errors that predate or postdate these sources.

## Verification note

All GitHub repos and Anthropic/Cloudflare pages are living artifacts and will evolve (pin a commit for any star-count or line-count claim); the arXiv IDs are stable (2503.23278 v3 2025-10-07; 2505.03275 v1 2025-05-06; 2504.03767 v2 2025-04-11; 2504.08623 v2 2025-05-02). All ten sources were fetched and confirmed on 2026-08-02. Re-verify before citing externally; for any protocol-version claim, go to the MCP spec changelog, not these entries.
