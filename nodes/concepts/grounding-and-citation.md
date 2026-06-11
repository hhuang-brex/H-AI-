---
id: grounding-and-citation
type: concept
tags: [chatbot, conversation-design, grounding, citation, rag, hallucination]
related:
  - [[domain-chatbot-design]]
  - [[domain-knowledge-injection]]
  - [[scope-and-refusal]]
  - [[safety-rails-domain-specific]]
status: living
created: 2026-06-08
summary: "anchoring claims in domain sources; refusal as the right answer."
---

# Grounding & Citation

In a domain bot, every factual claim must be traceable to a source. "I don't know" is a correct answer; a fluent guess is a failure mode.

## Why grounding is non-negotiable in domains

Generic bots are evaluated on plausibility. Domain bots are evaluated on **truth in a specific corpus** — the company's policies, the user's account, the regulatory framework, the documented API. A plausible-sounding answer that doesn't match the corpus is worse than an honest "I'm not sure" — it erodes trust the moment a customer notices.

## What "grounded" actually means

Three increasingly strong properties:

1. **Grounded in retrieval** — the answer was generated with relevant context in scope (RAG / search results / structured data).
2. **Faithful to retrieval** — the answer doesn't claim things the context didn't say.
3. **Cited** — the answer points at *which* part of the context supports each claim.

Most teams stop at (1) and assume (2) and (3) follow. They don't. The model can ignore retrieved context and confabulate; it can also extrapolate beyond what context says without flagging the leap.

## Citation patterns

| Pattern | When |
|---|---|
| **Inline citations** ([1], [2]) with source list | High-stakes factual surfaces; users may verify |
| **Source preview cards** (chat UI) | Conversational; user can click through |
| **"According to your policy …"** prose | Conversational, source identity matters |
| **Confidence-only** ("I'm fairly sure but verify") | When sources are paraphrased and direct citation hurts UX |
| **No citation, refuse instead** | When the corpus didn't cover the question — see [scope-and-refusal](scope-and-refusal.md) |

## "I don't know" as a first-class behavior

The hardest discipline in domain bots: training (or prompting) the bot to refuse when retrieval came back empty or low-confidence, instead of generating a plausible-sounding answer from parametric memory.

Symptoms that the bot is bluffing:

- It answers questions for which retrieval returned nothing.
- Its answers are detailed even when the source is generic.
- It cites confidently when retrieval similarity scores are low.

## Eval

- **Faithfulness scorer** — LLM-judge or NLI model checks each claim against retrieved context.
- **Citation correctness** — for inline-cited answers, verify each [N] points at a passage that supports it.
- **Refusal correctness on empty retrieval** — assert the bot refuses (or asks for clarification) when retrieval returned nothing relevant.
- **Hallucination canaries** — questions whose answers are *not* in the corpus; assert the bot doesn't fabricate.

## See also

- [domain-knowledge-injection](domain-knowledge-injection.md) — how knowledge enters the prompt in the first place.
- [scope-and-refusal](scope-and-refusal.md) — refusal as the correct grounded answer.
- [safety-rails-domain-specific](safety-rails-domain-specific.md) — some claims are forbidden regardless of grounding.
