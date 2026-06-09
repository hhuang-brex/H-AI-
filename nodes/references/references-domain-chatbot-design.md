---
id: references-domain-chatbot-design
type: reference
tags: [reading-list, chatbot, conversation-design, anthropic, openai, microsoft, google]
related:
  - [[domain-chatbot-design]]
  - [[sms-multi-thread-chatbot]]
  - [[intent-and-disambiguation]]
  - [[grounding-and-citation]]
  - [[escalation-handoff]]
  - [[scope-and-refusal]]
  - [[persona-tone-compliance]]
  - [[safety-rails-domain-specific]]
  - [[references-eval-reading-list]]
status: living
created: 2026-06-08
---

# Domain Chatbot Design — Reading List

Curated for senior engineers building domain-specific chatbots over chat / SMS / voice. Frontier-lab and platform-vendor sources marked 🔑. URLs verified live as of 2026-06-08; sources marked † were verified during prior eval-reading-list work and re-cited here.

## (a) Conversation design fundamentals

- 🔑 **Conversation Design** — Google for Developers. https://developers.google.com/assistant/conversation-design/welcome — The canonical CDS hub: persona, sample dialogs, error handling, conversational components. Originally for Google Assistant; the principles port directly to LLM chatbots.
- **Conversational Design** — Erika Hall, A Book Apart, 2018. https://abookapart.com/products/conversational-design — Pre-LLM, but the chapter on what makes interactions feel like conversation (not transactions) is the most-cited reference in modern conversation-design work.
- 🔑 **Design and control conversation flow** — Microsoft Learn (Bot Service docs). https://learn.microsoft.com/en-us/azure/bot-service/bot-service-design-conversation-flow — Procedural flow vs. interruption handling vs. expiry; vocabulary every chatbot designer ends up needing.
- 🔑 **Design the user experience** — Microsoft Learn (Bot Service docs). https://learn.microsoft.com/en-us/azure/bot-service/bot-service-design-user-experience — Rich controls vs. text vs. speech; when natural language understanding is overkill ("ask specific questions" is the underrated advice).

## (b) Intent classification, NLU, slot-filling

- 🔑 **Building chatbots with Amazon Lex V2 (Automated Chatbot Designer)** — AWS. https://docs.aws.amazon.com/lexv2/latest/dg/designing.html — Mining intents and slots from conversation transcripts; the canonical "let real traffic shape your intent set" reference.
- **Rasa Documentation** — Rasa. https://rasa.com/docs/ — Conversation-driven development methodology; intent + slot patterns that hold up regardless of model backend.

## (c) RAG / grounding / retrieval for domain bots

- 🔑 **Patterns for Building LLM-based Systems & Products** † — Eugene Yan, 2023. https://eugeneyan.com/writing/llm-patterns/ — Eval-driven development, RAG, defensive UX; the canonical taxonomy practitioners reference.
- 🔑 **Building Effective Agents** † — Anthropic (Schluntz & Zhang), 2024. https://www.anthropic.com/engineering/building-effective-agents — Workflow vs. agent vocabulary; sandbox testing; ACI evals. Essential framing even when the bot is "just" a chatbot.

## (d) Escalation, human handoff, hybrid workflows

- 🔑 **Transition conversations from bot to human** — Microsoft Learn. https://learn.microsoft.com/en-us/azure/bot-service/bot-service-design-pattern-handoff-human — Bot-as-agent vs. bot-as-proxy; the handoff event protocol; what a real handoff payload contains. Maps directly to [escalation-handoff](../concepts/escalation-handoff.md)'s "handoff contract."
- 🔑 **Fin by Intercom** — Intercom / Fin AI. https://fin.ai/ — Production case study of a chatbot that hands off to humans across multiple channels; product-level treatment of when AI vs. human handles a turn.

## (e) Chatbot UX writing — persona, tone, voice

- **A Simple Guide to Conversation Design** — Voiceflow, 2024. https://www.voiceflow.com/blog/conversation-design — Persona-first design, sample-dialog discipline, common voice-UI mistakes that translate to chat.
- (Erika Hall's *Conversational Design* covers this thoroughly; cited above.)

## (f) Safety / guardrails / refusal / scope

- 🔑 **Challenges in Red Teaming AI Systems** † — Anthropic, 2024. https://www.anthropic.com/news/challenges-in-red-teaming-ai-systems — Domain-expert and automated red-teaming; the standardization gap; useful when scoping fintech-grade adversarial coverage.
- 🔑 **Advancing Red Teaming with People and AI** † — OpenAI, 2024. https://openai.com/index/advancing-red-teaming-with-people-and-ai/ — External human red-team campaign design + automated attack generation. Pairs human and automated coverage.

## (g) Eval / measuring chatbot quality

- 🔑 **Your AI Product Needs Evals** † — Hamel Husain, 2024. https://hamel.dev/blog/posts/evals/ — The canonical "stop whack-a-mole, build evals" post. Three-level pyramid (unit / human + LLM grading / A/B). Required reading.
- 🔑 **Creating an LLM-as-Judge That Drives Business Results** † — Hamel Husain, 2024. https://hamel.dev/blog/posts/llm-judge/ — Critique shadowing; binary pass/fail; iterative judge alignment. Most actionable post on judge calibration.
- 🔑 **A Statistical Approach to Model Evaluations** † — Anthropic, 2024. https://www.anthropic.com/research/statistical-approach-to-model-evals — Sample-size math; lets you stop running 10k-sample evals when 200 will do.
- 🔑 **A Field Guide to Rapidly Improving AI Products** † — Hamel Husain, 2025. https://hamel.dev/blog/posts/field-guide/ — Bottom-up error analysis from real traffic; custom data viewers as the highest-ROI investment. Closes the loop between prod traffic and eval datasets.

## (h) Voice / IVR / SMS-specific patterns

The literature here is thinner than for chat — most production know-how lives in vendor docs and proprietary case studies. Two solid public anchors:

- 🔑 **Conversation Design** (voice section) — Google for Developers. https://developers.google.com/assistant/conversation-design/welcome — Voice-specific patterns (no visual scaffolding; turn-taking; error recovery) that travel to SMS even though the channel differs.
- 🔑 **Microsoft Bot Service — Speech** — Microsoft Learn. https://learn.microsoft.com/en-us/azure/bot-service/bot-service-design-user-experience#speech — Brief but practical; pairs with the conversation-flow guide.

## If you only read four

For a fintech engineer building agentic chatbots over SMS/chat:

1. **Google's Conversation Design hub** — the principles; especially error handling and persona.
2. **Anthropic, *Building Effective Agents*** — workflow vs. agent vocabulary you'll write design docs in.
3. **Hamel Husain, *Creating an LLM-as-Judge That Drives Business Results*** — the judge-calibration post most directly applicable to your eval setup.
4. **Microsoft, *Transition conversations from bot to human*** — concrete handoff protocol; handoff is the most under-designed part of most chatbots.

## Notes on scope

- Posts from before 2023 (pre-LLM-chatbot era) are mostly omitted unless they're foundational on the *interaction* side (Erika Hall) — pre-LLM NLU advice is largely obsolete.
- Vendor blogs are cited only when they document patterns vendor-neutrally; promotional content is skipped.
- The verified-live filter is strict; posts that resolve via redirect have been listed at the canonical destination.
- The literature on **chatbot conversation memory across sessions** is thin; the [conversation-memory](../concepts/conversation-memory.md) node fills the gap with first-principles framing. If you find a strong public reference, add it to this list.
