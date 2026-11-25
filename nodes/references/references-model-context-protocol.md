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
  - [[tool-selection-and-routing]]
  - [[confirm-before-act]]
  - [[run-state-model]]
  - [[mcp-vs-direct-api]]
  - [[mcp-tasks-long-running-tools]]
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

## Papers — late October 2026 (verified 2026-11-01)

From an arXiv sweep of 2026-10-15 → 10-31 (about 55 MCP-related titles; 16 opened). Abstract-level only; numbers author-reported.

**Reliability and interface design**

- **Tool-Calling LLM Agents Under Realistic MCP Faults** — Iannillo et al. (NeurIPS 2026 poster). https://arxiv.org/abs/2610.32555 — A fault-injection middleware calibrated on 57,240 issue and PR threads from 1,774 MCP repos. Faults cut task completion from 8.08 to 3.23 out of 10, and "scale does not purchase fault tolerance": the 120B model fared no better than the 20B.
- **Matched Capabilities, Different Behaviors: MCP and CLI Interfaces** — Shi, Pang, Li (2026-10-25). https://arxiv.org/abs/2610.34298 — Same operations, two interfaces, same runtime: structured divergence in 94.3% of 2,004 paired episodes, propagating through later steps.
- **GatewayBench** — Zheng, Chen, Li, Li (2026-10-16). https://arxiv.org/abs/2610.23449 — The first benchmark for MCP gateways: 524 tasks, 11,118 real tools from 251 servers, flattened vs hierarchical gateway designs.
- **AT-AT: Automatic Tool Optimization from Agent Traces** — Ravichandran et al. (2026-10-26). https://arxiv.org/abs/2610.34679 — Improve shared tool descriptions and implementations offline from agents' traces, holding the agents fixed; lowered cost or error rates on three production MCP servers.
- **Completeness and Cost of Retrieval Structures for Multi-Tool Requests** — Zhang, single author (2026-10-30). https://arxiv.org/abs/2610.41905 — Completeness@10 drops from 0.58–0.67 on single-tool queries to 0.08–0.17 with four or more tools, and retriever rankings reverse between the two.
- **BRIA: Explore Separately, Adopt Selectively** — Mazhar, Maekawa, Bhutani (2026-10-15). https://arxiv.org/abs/2610.22688 — Investigate candidate tools in isolated branches and adopt only useful results: +14.37 points over MCP-Zero on MCP-Atlas.
- **MS-Eval** — Ding et al. (2026-10-16). https://arxiv.org/abs/2610.22869 — Delegating to sub-agents in MCP-heavy work "generally raises cost with contingent payoff"; specialized sub-agents work best.

**Security and privacy**

- **My Credentials, Please: Filesystem Capability Laundering** — Huang et al. (2026-10-15). https://arxiv.org/abs/2610.22301 — Across 21,097 servers from nine registries, 787 of 4,806 triaged (16.4%) had filesystem capabilities despite non-filesystem roles; 150 confirmed vulnerable, 13 advisories.
- **ProbeID: Verifying MCP Tool Identity under Registry Drift** — Chen et al. (2026-10-24). https://arxiv.org/abs/2610.33633 — Copyable descriptions cannot establish which implementation runs; behavioral probes reach 0.956 hit@1 where description routers sit near chance. 7 of 59 real tools changed despite version pins.
- **Log-To-Leak** — Hu et al. (2026-10-26). https://arxiv.org/abs/2610.36108 — A logging directive in tool metadata: attack success 62.64–100% with task completion largely intact; three defenses left over 55% residual success.
- **Decode-Time Provenance Binding for MCP** — Yocam et al. (2026-10-22). https://arxiv.org/abs/2610.31974 — Instructions hidden in an image bypass text scanners once a tool decodes them; authenticated trust labels plus taint tracking blocked all 24 adaptive payloads.
- **Privacy Leakage from Tool-Call Traces** — Duan et al. (2026-10-30). https://arxiv.org/abs/2610.41885 — Tool-call traces alone gave 26.25% profile-inference success against 17.97% from priors; linking sessions raised it further.
- **Cross-Interface Authorization for Computer-Use Agents** — Zhu, Wang (2026-10-30). https://arxiv.org/abs/2610.41397 — A policy can be the same across interfaces while its enforcement is not; another route can bypass it. Re-verify at commit time.
- **From Prompt Injection to Persistent Compromise** — Barcha Correia et al. (2026-10-20). https://arxiv.org/abs/2610.28810 — Memory injection persists across sessions on three major assistants, including through MCP-connected resources.

**Governance**

- **From TCP/IP to MCP** — Bucknall, Byrley, Hammond (2026-10-19). https://arxiv.org/abs/2610.26624 — Protocols that defer security accumulate a "security deficit"; MCP and A2A governance is concentrated in few hands. Argument, not measurement.

## The 2026-07-28 specification and release cycle (verified 2026-11-20)

- **2026-07-28 changelog** — modelcontextprotocol.io. https://modelcontextprotocol.io/specification/2026-07-28/changelog — The stateless revision: no handshake, no protocol sessions, multi round-trip requests, tasks as an extension, cacheable list results, issuer-bound credentials, and a deprecation policy with a 12-month window.
- **Versioning** — modelcontextprotocol.io. https://modelcontextprotocol.io/specification/versioning — Names 2026-07-28 as current; versions are declared per request in `_meta`.
- **GitHub releases** — https://github.com/modelcontextprotocol/modelcontextprotocol/releases — `2026-07-28 RC` (pre-release, 2026-05-29) and `2026-07-28` (stable, 2026-07-28).
- **A More Predictable Release Cycle for MCP** — Delimarsky, Soria Parra (2026-11-11). https://blog.modelcontextprotocol.io/posts/mcp-release-cycle/ — Six-month cadence; next version 2027-03-30. The process is SEP-3398, not read here.
- **Exploring File Uploads and Downloads in MCP** — Delimarsky, St. Charles (2026-11-10), on https://blog.modelcontextprotocol.io/ — An early extension for moving files between clients and tools.

## Papers — November 2026 (verified 2026-11-20)

From an arXiv sweep of 2026-10-31 → 11-19 (about 75 MCP-related titles; 12 opened). Abstract-level only.

- **When Neither Side Confirms: Destructive Tool Approval Across MCP Servers and Hosts** — Yao et al. (2026-11-02). https://arxiv.org/abs/2611.02527 — About 90% of destructive tools in a registry sample lack server-side confirmation; 32 of 41 hosts and SDKs have no default approval step; four of five low-cost models executed an injected deletion in 479 of 960 runs.
- **Beyond Plain MCP: Do Decision Models and Code Mode Make Tool Use Cheaper and Faster?** — Rai, single author, preregistered (2026-11-14). https://arxiv.org/abs/2611.19123 — Code mode cut tokens 70–90%; return-shape hints in stubs swung success up to 39.5 points; a decision-model router in front added nothing significant.
- **MCP Tool Poisoning in Agentic AI Frameworks** — Shaikh, Montaruli (v2 2026-11-09). https://arxiv.org/abs/2611.03555 — 9,720 cells across 12 frameworks and 18 models: 22.9% attack success, 12.1% of those confirmed exfiltration; "no framework implements intentional defense."
- **When Tool Names Are Not Identities: Provider Misbinding** — Anbiaee, Dadkhah, Ghorbani (2026-11-16). https://arxiv.org/abs/2611.21577 — An attacker running only another MCP server can capture requests through name collisions plus matching descriptions and schemas.
- **Signed, Sealed, Leaked** — Aun et al. (2026-11-04). https://arxiv.org/abs/2611.06585 — A legitimately signed tool leaked data to an allowed destination past a runtime defense in every trial; signing proves the publisher, not the behavior.
- **Reversibility Classes for AI Agent Actions** — Waghmare, Sufi (2026-11-17). https://arxiv.org/abs/2611.22075 — A five-level undo vocabulary over 536 tools on 20 servers; native annotations disagreed with the registry for 118 of 481 tools.
- **Checking Retry Transparency in Agent Tools** — Jiapeng Li, Microsoft (2026-11-11). https://arxiv.org/abs/2611.23307 — A successful retry does not guarantee the earlier attempt is harmless; checks tools' idempotence claims against effect contracts.
- **MCPHallu** — Jiang et al. (2026-11-05). https://arxiv.org/abs/2611.07689 — 358 tasks on 36 production servers, each built to trigger one failure type: branch collapse, unreachable goal, tool misuse, or context forgetting.
- **ShadowBench-MCP** — Al-Masri, Yang (2026-11-09). https://arxiv.org/abs/2611.11720 — Efficiency-first routing skipped safety tools 26.7% of the time; policy-aware routing cut shadow invocations 85.7%.
- **Tracing MCP Security Vulnerabilities** — He, Patel, Wang (2026-11-08). https://arxiv.org/abs/2611.11104 — Of 24 validated MCP CVEs, 87.5% were Critical or High; injection and path traversal dominate.
- **MCP-Eco** — Tounoussi et al. (2026-11-04). https://arxiv.org/abs/2611.06897 — A linked dataset of 78,302 server projects and 16,165 consuming repositories.
- **Where Does MCP Security End?** — Krakauer, Schaad (2026-11-02). https://arxiv.org/abs/2611.02611 — Maps the OWASP MCP Top 10 to server, gateway, and protocol tiers.

## MCP versus direct REST APIs (verified 2026-11-24)

Backs [mcp-vs-direct-api](../concepts/mcp-vs-direct-api.md). Abstract-level only; numbers author-reported.

- **MCP architecture overview** — modelcontextprotocol.io. https://modelcontextprotocol.io/docs/learn/architecture — Hosts, clients, and servers; a JSON-RPC data layer over stdio or Streamable HTTP; tools, resources, prompts, and elicitation. "MCP is a stateless protocol."
- **From REST to MCP: An Empirical Study of API Wrapping** — Mastouri et al. (v4 2026-04-06). https://arxiv.org/abs/2507.16044 — 88.6% of 116 official servers are REST-backed; 92% are bare wrappers; a median of 19% of operations exposed.
- **Making OpenAPI Documentation Agent-Ready** — Rocha Lima et al. (EASE 2026). https://arxiv.org/abs/2605.14312 — 2,450 documentation and REST smells across 600 production endpoints exposed through MCP.
- **MCP Error Messages Written for Developers Hurt the Most Capable Agents Most** — Xu, Wu (v2 2026-09-29). https://arxiv.org/abs/2609.35381 — Developer-facing error steps cut recovery; naming a server tool raised it from 45% to 84%.
- **The Scaffolding Matters More Than the Interface** — Alier Forment et al. (2026-08-09). https://arxiv.org/abs/2608.08654 — CLI-only scaffoldings were 5–28× cheaper than MCP-supporting ones on one git task.
- **DADL** — Dunkel, single author (2026-05-04). https://arxiv.org/abs/2605.05247 — One YAML file per REST API interpreted at runtime instead of a server per integration.
- **LAPIS** — Garcia, single author (2026-02-20). https://arxiv.org/abs/2602.18541 — An API spec format for models: 85.5% fewer tokens than OpenAPI YAML.
- **Scaling LLM Agent Tool Access: The MCP Gateway** — Li et al. (ACM SIGOPS 2026). https://arxiv.org/abs/2607.15593 — A cloud gateway that converts 315 OpenAPI services and handles access control and routing.
- **DeltaMCP** — Pujara, Zhu, Chen (2026-05-27). https://arxiv.org/abs/2605.28148 — Regenerates only the affected tools when an OpenAPI spec changes.
- **ToolContractGate** — Gupta, single author (2026-10-22). https://arxiv.org/abs/2610.33108 — Binds each OpenAPI-derived tool to a versioned contract and blocks drift.
- **Comparative Vulnerability Assessment of LLM Agent Deployment Paradigms** — Gasmi et al. (2025-07-08). https://arxiv.org/abs/2507.06323 — 73.5% attack success for function calling vs 62.6% for MCP, with different risk profiles.
- **MCP Bridge** — Ahmadi, Sharif, Banad (v3 2026-03-10). https://arxiv.org/abs/2504.08999 — A REST proxy in front of MCP servers, for clients that can't run stdio.
- **A Survey of Agent Interoperability Protocols** — Ehtesham et al. (v2 2025-05-23). https://arxiv.org/abs/2505.02279 — MCP, ACP, A2A, and ANP compared.

## Blogs — announcement and practitioner engineering

- **Introducing the Model Context Protocol** — Anthropic (2024-11-25; protocol by David Soria Parra & Justin Spahr-Summers). https://www.anthropic.com/news/model-context-protocol — The launch that open-sourced MCP as "a new standard for connecting AI assistants to the systems where data lives," replacing fragmented custom integrations with one protocol. Open-sourced three things at once: the **spec + SDKs**, local server support in Claude Desktop, and the pre-built server repo above. The origin datum for the node's "de-facto tool-interop standard" claim — cite it for *provenance and intent*, and the spec/changelog (not this post) for anything version-specific, since the node's current protocol version (2025-11-25) is several revisions past this announcement.

- **Writing effective tools for agents — with agents** — Ken Aizawa, Anthropic (2025-09-11). https://www.anthropic.com/engineering/writing-tools-for-agents — Practitioner guidance framing tools as "a contract between deterministic systems and non-deterministic agents." The evaluation-driven workflow (prototype → eval → let Claude Code refactor the tools) plus principles — fewer purpose-built tools, namespacing (`asana_search`), natural-language IDs over UUIDs, `response_format` enums, token caps (~25k in Claude Code). The direct source for [tool-schema-design](../concepts/tool-schema-design.md) and the pagination/token-budget concerns in [paginated-tool-contract](../concepts/paginated-tool-contract.md).

- **Code execution with MCP: Building more efficient agents** — Adam Jones & Conor Kelly, Anthropic (2025-11-04). https://www.anthropic.com/engineering/code-execution-with-mcp — The engineering case that **direct tool-calling doesn't scale**: loading every definition floods context and every result round-trips the model. Fix — expose servers as a *code API* (tools as files, loaded on demand), reporting one example cut from 150k→2k tokens (98.7%), plus in-sandbox filtering, native control flow, and privacy. The primary source for [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) and [agent-skills-progressive-disclosure](../concepts/agent-skills-progressive-disclosure.md). (Note the node's own caveat: MCP's *security* sandbox ≠ this *context-saving* sandbox.)

- **Code Mode: the better way to use MCP** — Kenton Varda & Sunil Pai, Cloudflare (2025-09-26). https://blog.cloudflare.com/code-mode/ — The independent convergence on the code-execution thesis, from a different vendor and mechanism: convert MCP tools into a **TypeScript API** the LLM writes code against, because models are "better at writing code to call MCP, than at calling MCP directly." Runs generated code in **V8-isolate sandboxes** (via a Worker Loader API) with bindings replacing network access so "the AI cannot possibly write code that leaks any keys." Cite alongside the Anthropic code-execution post as *two vendors reaching the same conclusion independently* — MCP's residual value reduced to "a uniform way to connect to and learn about an API."

## How to read this list against the node

The node tracks the **live spec** (2026-07-28, stateless since SEP-2575/2322) and normative client MUSTs; these references are the *stable substrate under it*. **Projects** show MCP shipping across server and client sides and multiple ecosystems (and the reference servers signal their own "educational, not production" caveat); **papers** supply the lifecycle + threat taxonomy and the exploit demonstrations the node's trust-boundary treatment compresses; **blogs** run from provenance (the launch) through practitioner tool-design to the code-execution turn — where two vendors (Anthropic, Cloudflare) independently conclude that at scale the model should *write code against* MCP rather than call it directly. Where node and sources diverge, the node is newer by design — it deliberately corrects the "2025-06-18 is current" and "there's an RC tier" errors that predate or postdate these sources.

## Verification note

All GitHub repos and Anthropic/Cloudflare pages are living artifacts and will evolve (pin a commit for any star-count or line-count claim); the arXiv IDs are stable (2503.23278 v3 2025-10-07; 2505.03275 v1 2025-05-06; 2504.03767 v2 2025-04-11; 2504.08623 v2 2025-05-02). All ten sources were fetched and confirmed on 2026-08-02. Re-verify before citing externally; for any protocol-version claim, go to the MCP spec changelog, not these entries.

## Tasks extension (verified 2026-11-24)

- [Tasks overview](https://modelcontextprotocol.io/extensions/tasks/overview), [ext-tasks repo and 2026-07-28 schema](https://github.com/modelcontextprotocol/ext-tasks), and [spec site](https://tasks.extensions.modelcontextprotocol.io) — the handle-and-poll contract; distilled in [mcp-tasks-long-running-tools](../concepts/mcp-tasks-long-running-tools.md).
- Async-agent research, abstracts only, author-reported: AsyncTool [2605.27995](https://arxiv.org/abs/2605.27995), SentinelBench [2606.05342](https://arxiv.org/abs/2606.05342), PASTE [2603.18897](https://arxiv.org/abs/2603.18897), TomasuLLM [2609.38201](https://arxiv.org/abs/2609.38201), FaaS MCP orchestration [2601.14735](https://arxiv.org/abs/2601.14735).
