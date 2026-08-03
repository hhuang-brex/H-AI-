---
id: references-model-context-protocol
type: reference
tags: [agent, tool-use, mcp, protocol, interop, standards, reading-list, science-excellence]
summary: "verified primary sources grounding mcp-tool-layer — the official reference-server project, the landscape-and-security-threats survey paper, and Anthropic's original launch blog."
related:
  - [[mcp-tool-layer]]
  - [[tool-use-design]]
  - [[prompt-injection-and-isolation]]
  - [[managed-agent-apis]]
status: living
created: 2026-08-02
---

# References — Model Context Protocol

Primary sources behind [mcp-tool-layer](../concepts/mcp-tool-layer.md). That node is an *engineering distillation* — what MCP standardizes on the wire, the current spec version, and the client-side MUSTs a consuming agent must enforce; this list grounds it in the protocol's own project, the scholarship, and the launch that introduced it. Each entry was fetched and its title/author/date confirmed on 2026-08-02 — not recalled from memory.

## The project — the protocol and its reference servers

- **modelcontextprotocol/servers** — Anthropic + community (Apache-2.0; ~89k★ as of 2026-08-02). https://github.com/modelcontextprotocol/servers — The official collection of **reference server implementations** (Everything, Fetch, Filesystem, Git, Memory, Sequential Thinking, Time; older GitHub/Slack/Postgres/etc. moved to `servers-archived`), and the jumping-off point to the SDKs (TypeScript, Python, Go, Rust, Java, C#, …) and the spec. README is explicit that these are **educational examples, not production-ready** — read that as the intended posture when [mcp-tool-layer](../concepts/mcp-tool-layer.md) treats an external server as a trust boundary. Pin a commit if citing a specific server list or star count; this is a moving artifact.

## The paper — landscape and security threat model

- **Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions** — Xinyi Hou, Yanjie Zhao, Shenao Wang, Haoyu Wang (2025-03-30, rev. 2025-10-07). https://arxiv.org/abs/2503.23278 — The systematic survey behind the node's trust-boundary framing: maps the **server lifecycle** across four phases (creation, deployment, operation, maintenance) into 16 activities, then builds a threat taxonomy over four attacker types ("malicious developers, external attackers, malicious users, and security flaws") with 16 scenarios and per-phase safeguards. The scholarly grounding for why "server selection is the consuming agent's leverage" and for the attack taxonomy [mcp-tool-layer](../concepts/mcp-tool-layer.md) defers to [prompt-injection-and-isolation](../concepts/prompt-injection-and-isolation.md).

## The blog — the original announcement

- **Introducing the Model Context Protocol** — Anthropic (2024-11-25; protocol by David Soria Parra & Justin Spahr-Summers). https://www.anthropic.com/news/model-context-protocol — The launch that open-sourced MCP as "a new standard for connecting AI assistants to the systems where data lives," replacing fragmented custom integrations with one protocol. Open-sourced three things at once: the **spec + SDKs**, local server support in Claude Desktop, and the pre-built server repo above. The origin datum for the node's "de-facto tool-interop standard" claim — cite it for *provenance and intent*, and the spec/changelog (not this post) for anything version-specific, since the node's current protocol version (2025-11-25) is several revisions past this announcement.

## How to read this list against the node

The node tracks the **live spec** (2025-11-25, draft stateless work in SEP-2575/2322) and normative client MUSTs; these references are the *stable substrate under it*. The project shows MCP shipping (and signals its own "educational, not production" caveat); the paper supplies the lifecycle + threat taxonomy the node's trust-boundary treatment compresses; the blog fixes provenance and original intent. Where node and sources diverge, the node is newer by design — it deliberately corrects the "2025-06-18 is current" and "there's an RC tier" errors that predate or postdate these sources.

## Verification note

`github.com/.../servers` and the Anthropic news page are living pages and will evolve; the arXiv ID is stable (v3, 2025-10-07). All three were fetched and confirmed on 2026-08-02. Re-verify before citing externally; for any protocol-version claim, go to the MCP spec changelog, not these entries.
