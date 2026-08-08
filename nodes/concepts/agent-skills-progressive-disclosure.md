---
id: agent-skills-progressive-disclosure
type: concept
tags: [agent, skills, context-engineering, progressive-disclosure, tool-use]
summary: "package domain capability as a SKILL.md folder the agent loads in three stages — metadata always, instructions on match, bundled files on demand — so many capabilities cost almost no base-prompt tokens."
related:
  - [[context-engineering]]
  - [[tool-use-design]]
  - [[domain-knowledge-injection]]
  - [[experiential-memory-substrates]]
  - [[tool-selection-and-routing]]
  - [[context-budget-allocation]]
  - [[action-execution-safety]]
  - [[skill-text-authoring]]
  - [[references-agent-skill-authoring]]
status: living
created: 2026-06-21
---

# Agent Skills & Progressive Disclosure

A domain task agent accumulates capability: the dispute-resolution playbook, the invoice-formatting rules, the escalation procedure. Stuff all of it into the base system prompt and you pay for every token on every turn, on every request, whether relevant or not — and bury the model in instructions it mostly doesn't need ([context-budget-allocation](context-budget-allocation.md)). **Agent Skills** are the packaging discipline that fixes this: capability lives in a folder the agent loads *progressively*, so a hundred skills cost almost nothing until one is actually needed.

## What a Skill is

A skill is a folder whose only required file is `SKILL.md`: YAML frontmatter (minimally `name` and `description`) followed by a Markdown body of instructions. It can bundle optional resources the body links to by name.

```
my-skill/
├── SKILL.md          # required: metadata (name, description) + instructions
├── scripts/          # optional: executable code the agent can run
├── references/       # optional: deeper docs loaded only when needed
└── assets/           # optional: templates, schemas, examples
```

The format was developed by Anthropic, launched 2025-10-16, and released as an open cross-vendor standard (2025-12-18) now adopted across many agent products (Claude Code, Cursor, GitHub Copilot, VS Code, Gemini CLI, OpenAI Codex, Goose, and others). A skill written once is portable across any skills-compatible agent.

## The mechanism: three-stage progressive disclosure

The load-bearing idea. Instructions enter the window in stages, each gated on need:

| Stage | What loads | When |
|---|---|---|
| **1. Discovery** | Only each skill's `name` + `description` (a line or two) | At startup, into the system prompt — "just enough to know when this skill is relevant" |
| **2. Activation** | The full `SKILL.md` body | When the task matches the description |
| **3. Execution** | Bundled files / scripts referenced by the body | On demand, as the instructions call for them — and code can *run* without its source ever entering context |

Because only the tiny metadata is always-resident, an agent can keep many skills "on hand with only a small context footprint," and bundled context that the agent reads-or-executes lazily is effectively unbounded. (Verified 2026-06-21: [Anthropic — Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills); [agentskills.io](https://agentskills.io).)

## Why this is a context-engineering pattern, not a packaging detail

Progressive disclosure is the same lever as the rest of [context-engineering](../topics/context-engineering.md), applied to *capability* rather than history:

- **It's the capability-side analogue of deferred tool loading.** [tool-selection-and-routing](tool-selection-and-routing.md) faces the same "40 definitions drown the model" problem; the tool-search mechanism defers loading tool *schemas* exactly as skills defer loading *instructions*. Both trade an always-resident catalog for a load-on-match index.
- **A SKILL.md is curated-text capability.** It is the durable, portable instance of the "curated text" substrate in [experiential-memory-substrates](experiential-memory-substrates.md) and a structured form of [domain-knowledge-injection](domain-knowledge-injection.md) — domain procedure as a version-controlled artifact rather than prose baked into the prompt. The `description` is the retrieval key; the body is the retrieved payload.
- **The description *is* the routing function.** Discovery works only if `description` states *when to use this* precisely. A vague description means the skill is never surfaced (under-recall) or fires on everything (over-recall) — the same precision problem as [memory-retrieval](memory-retrieval.md), now at the capability layer.

## The format's hard constraints

Packaging discipline has actual limits, not just conventions (Anthropic authoring guidance, verified 2026-08-08):

| Field / file | Constraint |
|---|---|
| `name` | ≤ 64 chars, lowercase letters/numbers/hyphens only, no XML tags, no reserved words ("anthropic", "claude") |
| `description` | ≤ 1,024 chars, non-empty, no XML tags; **third person** (it is injected into the system prompt) |
| `SKILL.md` body | under **500 lines** "for optimal performance"; split beyond that |
| Bundled references | **one level deep from SKILL.md** — with nested references the agent may `head -100` a file instead of reading it, silently losing content |
| Reference file > 100 lines | add a table of contents, so a partial read still shows the full scope |

What to *write* inside those limits is [skill-text-authoring](skill-text-authoring.md).

## Pitfalls

- **Weak descriptions.** The whole mechanism rests on stage-1 matching. "Helps with documents" won't route; "Fill PDF AcroForm fields from a JSON record" will. Treat the description as a routing contract, not a label. The stronger 2026 formulation: a skill's capability is its **executable region** (the set of queries it can solve) and its document is a *lossy observation* of that region, which creates "a document-imposed component of retrieval error that cannot be removed by improving the retriever alone" ([arXiv:2608.04482](https://arxiv.org/abs/2608.04482)). So also state the **negative boundary** — which similar-looking requests should route elsewhere.
- **Skill sprawl.** Many overlapping skills make discovery ambiguous and inflate the always-resident metadata. Consolidate; keep descriptions disjoint. Measured ceiling worth knowing: over **690 skills / 117 queries**, a hybrid lexical+dense ranker put the right skill in the top five **73.5% ± 8.0** of the time — about a quarter of queries unserved — and a typed workflow knowledge graph was **11.2 points worse** at matched token budget ([arXiv:2608.06196](https://arxiv.org/abs/2608.06196), 2026 preprint). Past a few hundred skills, discovery, not authoring, is the binding constraint.
- **Instructions that assume unloaded context.** The body must be self-contained at activation; don't reference an `assets/` file's contents as if already in the window — link it so stage 3 can fetch it.
- **Skills are an action surface.** A skill that ships executable scripts is a path to running code — squarely an [action-execution-safety](../topics/action-execution-safety.md) concern. An untrusted or injected skill is a real attack vector (the still-open `prompt-injection-and-isolation` gap); load skills only from trusted sources and sandbox bundled code. The threat is now demonstrated at scale: **471 real-world shell commands were transformed into 2,826 benign-appearing skills mapped to 11 MITRE ATT&CK tactics**, exploiting the fact that malicious commands hide inside natural-language skill files ([arXiv:2608.05223](https://arxiv.org/abs/2608.05223), 2026 preprint under review).
- **No versioning discipline.** Skills evolve; an unversioned skill silently changes agent behavior across runs. Version and pin like any dependency.

## References

Sits under [context-engineering](../topics/context-engineering.md); pairs with [tool-use-design](../topics/tool-use-design.md) (the deferred-loading analogue) and [domain-knowledge-injection](domain-knowledge-injection.md) (the other way domain facts enter). Primary sources verified 2026-06-21: the Anthropic engineering post and [agentskills.io](https://agentskills.io) (open-standard spec + client showcase).
