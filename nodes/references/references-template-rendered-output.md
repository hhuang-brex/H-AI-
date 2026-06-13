---
id: references-template-rendered-output
type: reference
tags: [output, template-rendered, forced-tool-call, production, reading-list, science-excellence]
summary: "what's verifiable about template-rendered output in production — Rasa (mechanism confirmed), Ikki (architecture confirmed, outcomes refuted), and why most 'structured output' systems don't qualify."
related:
  - [[template-rendered-output]]
  - [[forced-tool-call-output]]
  - [[layered-defense-pipeline]]
  - [[schema-vs-validator]]
status: living
created: 2026-06-13
---

# References — Template-Rendered Output in Production

A deep-research pass (2026-06-13; 16 sources, 25 claims 3-vote-verified) on the question: *which real systems use true template-rendered output — the LLM picks a tool / emits structured args and deterministic **code** owns the user-facing string — versus merely constraining structure while the model still writes the prose?* Every entry below is fetch-verified; the refuted claims are recorded too, because the headline finding is partly a negative one.

## The headline finding (read this first)

The pattern's **mechanism is sound and verifiable**, but there is **no independently-verified, named production deployment with published great-UX / reliability outcomes.** If you adopt template-rendered output, do it because the *mechanism* fits your failure-cost (a wrong sentence is expensive on a hard surface), not because a famous company published proof it delights users — that proof does not exist in public sources as of mid-2026. Almost no candidate yielded primary-source outcome metrics at all.

## Category (a) — true template-rendered (code owns the string)

- **Rasa — default NLG / response templates** (verified 3-0). https://rasa.com/docs/reference/primitives/responses/ , https://rasa.com/docs/rasa/responses/ — Canonical docs: responses named `utter_*` live in `domain.yml`/`responses.yml`; "the response can directly be used as an action"; Rasa "automatically fills in the variable with the value found in the slot." Deterministic code owns the string; variations chosen by rule. This is the cleanest *mechanism* proof of category (a). **Caveats:** it's a framework capability, not a single named production deployment; and the optional **Contextual Response Rephraser** (off by default), if enabled, has the LLM rewrite the surface string — that path is no longer pure code-rendering, though the template still owns the meaning and dialogue logic stays deterministic (https://rasa.com/docs/reference/primitives/contextual-response-rephraser/).

- **Ikki — "Forced Tool Calling in Production Chatbots"** (mechanism verified 3-0; production outcomes **refuted 0-3**). https://www.ikki.io/blog/forced-tool-calling-production-chatbots — Architecture: `tool_choice: {type:'any'}` structurally disallows free text; the model picks one tool + structured args; "the code picks the template and fills it. Not the LLM." The **mechanism is independently corroborated by Anthropic's docs** (with `any`/`tool`, the API "will not emit a natural language response or explanation before tool_use content blocks" — https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools). **But:** the production-scale and outcome claims (tens of thousands of conversations, ~75–90% cache hit, 9–12 months, no "agent promised X" incident) were **refuted as unverifiable** — self-published vendor blog, small studio, no independent confirmation, no named client. Treat as a credible *architecture description*, not measured evidence. Minor imprecision: Anthropic `any` guarantees a tool *is* used, not strictly *exactly one* block — "exactly one" is Ikki's framing.

## Category (b) — structured but model still writes the prose (do NOT count)

These constrain or parse structure; the user-facing string is still model-authored. Included so the distinction is unmissable:

- **OpenAI Structured Outputs** (verified 3-0). https://developers.openai.com/api/docs/guides/structured-outputs — Guarantees the response adheres to a JSON Schema, but the model writes prose into string fields (`explanation`, etc.). Structure-only; code never owns the string.
- **LiveKit Agents** (verified 3-0). https://github.com/livekit/agents/blob/main/examples/voice_agents/structured_output.py — Typed results capture data; user-facing speech comes from a model-authored `response` field / `generate_reply(instructions=...)`. Code strips a TTS directive but the model authors the prose.
- **Intercom Fin** (verified 3-0). https://www.intercom.com/help/en/articles/9929230-the-fin-ai-engine — "Retrieval augmented generation"; "the generative model uses the augmented input to generate an answer." Free prose, not classifier+template.
- **Instructor / Outlines / BAML (constrained decoding)** (verified 3-0). https://www.boundaryml.com/blog/structured-output-from-llms — Force *syntactic* validity under a grammar/schema (or parse/repair JSON); the model still authors `reasoning`/`action`/`chain_of_thought` string content. BAML's only "templates" are Jinja *input*-prompt templates, not output rendering.

## What this means for the cluster

- [template-rendered-output](../concepts/template-rendered-output.md) — the pattern is real (Rasa is the existence proof; Anthropic's API is the enabling mechanism), but the node should not claim measured production UX wins, because none are publicly verified. Its Ikki-sourced production numbers are the author's self-report.
- The category (a) vs (b) line is the load-bearing distinction: most of the "structured output" ecosystem is (b). "We use structured outputs" is *not* evidence of template-rendering.

## Open questions (unanswered by this pass)

- Any independently-verifiable large-scale category-(a) deployment from a named company with published metrics? None found beyond Ikki's self-report.
- Any documented UX / reliability / latency / trust *outcomes* (not just mechanism)? None surfaced from primary sources for any candidate.

## Verification note

All URLs fetched and confirmed 2026-06-13. Three claims were killed (0-3): Ikki's two production-deployment/scale claims, and a stale claim that ikki.io's homepage hosts the article (the article is at the `/blog/` path; the homepage doesn't). Vendor docs (Rasa, OpenAI, LiveKit, Intercom) are living pages and may evolve.
