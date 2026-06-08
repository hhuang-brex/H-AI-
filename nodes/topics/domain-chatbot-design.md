---
id: domain-chatbot-design
type: topic
tags: [chatbot, conversation-design, domain, agents]
related:
  - [[llm-output-design]]
  - [[llm-evaluation]]
  - [[intent-and-disambiguation]]
  - [[grounding-and-citation]]
  - [[action-authority]]
  - [[escalation-handoff]]
  - [[scope-and-refusal]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[persona-tone-compliance]]
  - [[repair-and-clarification]]
  - [[turn-taking-and-proactivity]]
  - [[safety-rails-domain-specific]]
status: living
created: 2026-06-08
---

# Domain-Specific Chatbot Conversation Design

Designing a chatbot for a real domain — financial services, healthcare, developer tooling, customer support — is a different discipline from generic chat UX. The domain is not decoration; it constrains every design decision, from what the bot can refuse to how it must cite, from what it remembers to what it's allowed to do.

## Three axes that shape every decision

1. **What the bot is *for*** (the domain) — fintech assistant, medical triage, code assistant, support deflection. Determines vocabulary, knowledge sources, and failure cost.
2. **How the bot *talks*** (conversation design) — turn structure, clarification, repair, persona. The subject of this topic.
3. **How the bot *emits*** (output design) — see [[llm-output-design]]. Per-surface mechanism choices.

Conversation design (axis 2) is what happens between the model deciding "what to say" and the surface decision "how to say it on this channel." Domain (axis 1) sits above and reshapes both.

## Why generic chatbot patterns fail in domains

A generic chatbot tries to be helpful and fluent. A domain chatbot has stronger commitments:

- **It must refuse** when asked something out of scope, even if it could fluently bluff. See [[scope-and-refusal]].
- **It must cite** when stating a domain fact, because hallucination is a compliance event. See [[grounding-and-citation]].
- **It must escalate** when the user's situation crosses a risk line, even if the bot could plausibly continue. See [[escalation-handoff]].
- **Its "persona" is a constraint set**, not a style preference. Regulated language, prohibited claims, mandatory disclaimers. See [[persona-tone-compliance]].

A pattern that works for "general assistant" — be flexible, attempt every question, sound natural — is the wrong default in any domain where wrong answers have asymmetric cost.

## The decision surface

| Decision | Failure mode if wrong | Concept |
|---|---|---|
| Did we understand the user? | Acting on the wrong intent | [[intent-and-disambiguation]] |
| Where do facts come from? | Hallucinated authority | [[grounding-and-citation]] |
| What can the bot do, not just say? | Unauthorized action | [[action-authority]] |
| When does a human take over? | Trapped user, missed urgency | [[escalation-handoff]] |
| What's in / out of scope? | Bluffing past a refusal threshold | [[scope-and-refusal]] |
| What persists across turns and sessions? | Privacy leak / state contamination | [[conversation-memory]] |
| How does domain knowledge enter the prompt? | Stale / wrong / overflowed context | [[domain-knowledge-injection]] |
| What voice / tone / disclaimers? | Compliance violation | [[persona-tone-compliance]] |
| How does the bot recover when it misunderstood? | User repeats and gives up | [[repair-and-clarification]] |
| Who speaks when? | Robotic turn-taking; missed proactivity | [[turn-taking-and-proactivity]] |
| What domain-specific guardrails apply? | Generic safety isn't enough | [[safety-rails-domain-specific]] |

Every node above is a separable decision with its own failure mode and its own evaluation strategy ([[llm-evaluation]]).

## How this connects to the rest of the graph

- **Output side:** Conversation design produces *what* to say; [[llm-output-design]] decides *how* to emit it on each surface. The two compose; neither replaces the other.
- **Eval side:** Each conversation-design decision needs eval coverage. Mechanical checks on intent classification, grounded-fact citation, refusal correctness, escalation triggers; LLM-judged checks on tone and helpfulness. See [[agent-trajectory-eval]] and [[llm-as-judge]].
- **Per-surface:** A domain bot usually has multiple surfaces (chat UI, SMS notification, voice fallback). Conversation-design decisions are mostly surface-agnostic; output-design decisions are not.
