---
id: 2026-06-08-domain-chatbot-research
type: thread
tags: [chatbot, research, reading-list, thread]
related:
  - [[references-domain-chatbot-design]]
  - [[domain-chatbot-design]]
  - [[references-eval-reading-list]]
status: archived
created: 2026-06-08
summary: "verified reading-list research thread."
---

# Thread — Domain Chatbot Design Research (2026-06-08)

Conversation goal: search online for canonical articles on designing domain-specific chatbots, distill into a verified reading list, and add it to the graph.

## Method

- Web-fetched candidate URLs across frontier-lab blogs, platform-vendor docs (Microsoft Bot Service, Google Conversation Design, AWS Lex, Rasa, Voiceflow), practitioner blogs (Husain, Yan), and product engineering write-ups (Intercom Fin).
- Verified each URL resolves to live content, not redirects to elsewhere or 404s. Followed redirects to canonical destinations where they pointed somewhere coherent.
- Some practitioner-blog domains (anthropic.com, hamel.dev, eugeneyan.com) were unreachable from this environment's WebFetch, so those entries were re-cited from the prior [references-eval-reading-list](../nodes/references/references-eval-reading-list.md) verification (marked † in the new node).
- Strict no-fabrication rule: any URL I couldn't either fetch live now or trace to a prior verification was dropped.

## Outputs

- [references-domain-chatbot-design](../nodes/references/references-domain-chatbot-design.md) — eight-bucket reading list (conversation-design fundamentals; intent / NLU; RAG; escalation; UX writing; safety; eval; voice/SMS).

## Key observations from the research

- **Microsoft Bot Service docs are surprisingly underrated.** They're written for an SDK that pre-dates LLM chatbots, but the pattern vocabulary (procedural flow, interruption handling, handoff initiation event protocol) ports cleanly and is more concrete than most LLM-era posts.
- **Google's Conversation Design hub remains the canonical "fundamentals" reference**, though it ostensibly targets Assistant Actions (deprecated 2023). The persona / sample-dialog / error-handling sections are channel-agnostic.
- **Voice/IVR/SMS-specific writing is thin.** Most public content is vendor-promotional. The first-principles framing in [sms-multi-thread-chatbot](../nodes/topics/sms-multi-thread-chatbot.md) fills a gap the public literature does not address well.
- **The eval reading list overlaps significantly** with the chatbot reading list — chatbot quality is mostly a measurement problem, and the canonical eval references apply directly. Cross-linked rather than duplicated.
- **Cross-session conversation memory has no canonical public reference.** The [conversation-memory](../nodes/concepts/conversation-memory.md) node is doing standalone work. Worth keeping an eye out for emerging posts.

## What didn't make it

- Posts I couldn't verify and couldn't trace to a prior verification — dropped to maintain the strict no-fabrication rule.
- Vendor-promotional blog posts that don't document patterns vendor-neutrally — skipped on quality grounds.
- Pre-LLM NLU literature beyond Erika Hall — most is obsolete in light of modern instruction-tuned models.
