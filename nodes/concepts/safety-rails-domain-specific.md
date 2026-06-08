---
id: safety-rails-domain-specific
type: concept
tags: [chatbot, conversation-design, safety, guardrails, domain]
related:
  - [[domain-chatbot-design]]
  - [[scope-and-refusal]]
  - [[escalation-handoff]]
  - [[persona-tone-compliance]]
  - [[adversarial-eval]]
  - [[action-authority]]
status: living
created: 2026-06-08
---

# Domain-Specific Safety Rails

Generic LLM safety (don't help build weapons, don't write hate speech) is a baseline. Domain bots need additional, narrower rails that generic safety doesn't cover and that generic eval doesn't surface.

## Why generic safety isn't enough

A model that's been RLHF'd to avoid toxicity won't, by default, know that:

- A fintech bot must not give specific investment recommendations on individual securities.
- A healthcare triage bot must direct chest-pain symptoms to emergency services regardless of context.
- A legal-info bot must not represent itself as creating an attorney-client relationship.
- A children's product bot must hold a higher bar on adult-content avoidance than the model's default.

Generic safety is *broader* than needed in most spots and *narrower* than needed in others.

## Categories of domain rails

1. **Action rails** — what the bot may not do. Tied to [[action-authority]] tiering.
2. **Speech rails** — what the bot may not claim or assert (regulated advice, prohibited categories).
3. **Disclosure rails** — what must be said when (mandatory disclaimers, identity disclosure as bot, citation requirements).
4. **Trigger rails** — situations that mandate a specific response path (distress signals → escalation; fraud signals → security flow; minor-suspected → halt + verify).
5. **Data rails** — what the bot may not echo back (PII surface limits; account-internal info that shouldn't go to a different surface).

Each category has different enforcement: some structural, some prompt-level, some at the tool boundary.

## Enforcement layering

A serious domain rail is usually enforced at multiple layers:

- **Pre-prompt classifier** flags the input (cheap intent / category model).
- **Prompt-level rule** instructs the model.
- **Output filter** scans the model's reply for forbidden patterns.
- **Tool-boundary refusal** — the action simply isn't possible.

Single-layer enforcement leaks. Don't rely solely on prompting for things that are legally mandatory.

## Distress and urgency

A subset of trigger rails worth calling out: distress signals override everything else.

- Self-harm language → immediate escalation + crisis resource, regardless of in-flight action.
- Domestic-violence indicators in some domains → similar.
- Acute medical symptoms in healthcare bots → directed to emergency services.
- Fraud-in-progress signals → halt the user's request, verify identity, escalate.

These can't be handled by the same "polite refusal" path used for out-of-scope. The bot must break frame.

## Adversarial coverage

Domain rails are exactly what a small, permanent adversarial dataset is for — see [[adversarial-eval]]. Each rail should have:

- Positive cases (rail must trigger).
- Near-miss cases (rail must not over-trigger).
- Adversarial-phrasing cases (user trying to get past the rail with creative wording).

## Eval

- **Rail-trigger correctness** — labeled set per rail; precision/recall.
- **No-bypass under push-back** — multi-turn cases where the user persists; assert rail holds.
- **Disclosure presence** — mechanical check for mandatory language in matched cases.
- **Distress-path correctness** — assert immediate escalation, no continuation of prior task, correct resource surfaced.

## See also

- [[scope-and-refusal]] — overlap; refusal is one rail mechanism among many.
- [[escalation-handoff]] — the relief valve for distress/urgency rails.
- [[persona-tone-compliance]] — overlap on disclosure and prohibited language.
- [[adversarial-eval]] — how to test rails systematically.
