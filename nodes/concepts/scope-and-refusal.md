---
id: scope-and-refusal
type: concept
tags: [chatbot, conversation-design, scope, refusal, off-topic]
related:
  - [[domain-chatbot-design]]
  - [[grounding-and-citation]]
  - [[escalation-handoff]]
  - [[safety-rails-domain-specific]]
status: living
created: 2026-06-08
---

# Scope & Refusal

What's in-domain vs. out-of-domain, and how to refuse without hostility. A domain bot that can't refuse is not a domain bot — it's a general assistant in a costume.

## The three categories

Every incoming user message falls into one of three buckets:

1. **In scope** — answerable by the bot using domain capabilities.
2. **Adjacent** — not core domain but reasonable to handle (small talk, meta questions about the bot, basic clarifications about scope itself).
3. **Out of scope** — should be refused.

Designing the boundaries of (1)/(2)/(3) is upstream work. A clear scope document is the prerequisite — without it, every refusal is ad-hoc and the bot drifts.

## Three kinds of refusal — and they sound different

| Kind | Trigger | Tone | Next move |
|---|---|---|---|
| **Out-of-domain** | "What's the weather?" to a fintech bot | Friendly, brief | Suggest where to go instead |
| **Capability gap** | In-domain but unsupported | Apologetic, useful | Offer escalation or alternative |
| **Policy refusal** | Disallowed action (regulated advice, etc.) | Neutral, firm | Disclaimer, no offer to "try anyway" |

Generic chatbots use one tone for all three and sound either rude (firm-everywhere) or untrustworthy (apologetic-everywhere). Domain bots need three.

## "Refuse without hostility"

The dominant failure mode: refusal language that sounds like accusation or stonewalling. Patterns that work:

- **Acknowledge** what the user wanted, in their words.
- **State** the limit clearly, without preamble or hedging.
- **Offer** a path — escalation, related capability, external resource.

Anti-pattern: "I cannot help with that. Is there anything else I can help with?" — three failures in two sentences (no acknowledgment, no reason, dead-end offer).

## The "try anyway" trap

Users often push back on refusals. The bot must hold the line on policy refusals; it can soften on capability refusals if the user's restated request reveals new context. Distinguishing these requires knowing which kind the original refusal was — another reason the three kinds need separate paths.

## Eval

- **Scope classification** — labeled in/adjacent/out cases; measure precision/recall.
- **Refusal-tone evaluator** — LLM-judge with a rubric specific to each refusal kind.
- **Persistence under push-back** — multi-turn cases where the user restates; assert policy refusals hold and capability refusals can soften appropriately.
- **No-bluff** — out-of-scope cases must not produce confident in-domain-shaped answers. Tied to [grounding-and-citation](grounding-and-citation.md).

## See also

- [grounding-and-citation](grounding-and-citation.md) — refusal is the right answer when the corpus doesn't cover it.
- [escalation-handoff](escalation-handoff.md) — capability refusals often route to escalation.
- [safety-rails-domain-specific](safety-rails-domain-specific.md) — some refusals are legally mandated.
