---
id: 2026-06-10-github-buffering-references
type: thread
tags: [sms, message-buffering, github, prior-art, research, thread]
related:
  - [[sms-message-buffering-spec]]
  - [[sms-message-buffering-plan]]
  - [[2026-06-10-sms-message-buffering-research]]
status: archived
created: 2026-06-10
summary: "GitHub prior art for chatbot message buffering (clawbolt, Chatwoot, LiveKit)."
---

# Thread — GitHub Prior Art for Message Buffering (2026-06-10)

Conversation goal: follow-up to the prior SMS message buffering research, narrowed to a specific question — *which open-source GitHub projects actually implement message buffering / debouncing / end-of-turn detection for chatbots, with verifiable code?* The prior research had found no major chatbot team has published canonical guidance, and identified voice-AI frameworks as the closest pattern. This thread closes the gap on whether any open-source chatbot project has working code we should borrow from or learn from.

## Method

Ran the deep-research workflow with adversarial verification specifically targeting:
- Confusing "buffer the LLM context" (memory) with "buffer multiple inbound messages before responding" (the actual problem).
- Cited debounce values that source code doesn't actually contain.
- Forks / abandoned repos.

5 search angles: chatbot frameworks (Rasa, Botpress, Microsoft Bot Framework, Chatwoot), WhatsApp/messenger libs (Baileys, whatsapp-web.js, BuilderBot), LLM agent frameworks (LangChain, LangGraph, Vocode, Pipecat), Twilio/Bandwidth sample apps, voice-AI references (LiveKit, Pipecat, Daily.co).

Stats: 102 subagents · ~2.66M subagent tokens · ~11.5 min wall time.

## The headline finding

**Exactly one clean reference exists**: [mozilla-ai/clawbolt's `MessageBatcher`](https://github.com/mozilla-ai/clawbolt/blob/main/backend/app/agent/ingestion.py).

| Aspect | What clawbolt has | What this spec adds |
|---|---|---|
| Per-user debounce | ✅ `MessageBatcher` class, asyncio task cancel/recreate | ✅ |
| Text + media merging on flush | ✅ lines 542–547 | ✅ matches Piece 4 |
| Configurable window | ✅ `MESSAGE_BATCH_WINDOW_MS` default 1500 | ✅ FLOOR_S=8/CEILING_S=30 (SMS-scaled) |
| Semantic EOT classifier | ❌ fixed timer only | ✅ L2 classifier (Piece 3) |
| Forward-reference detection | ❌ relies on timer alone | ✅ L1 regex (Piece 2) |
| Intent-edit handling (E10) | ❌ | ✅ Piece 5 |
| Two-checkpoint abort-on-newer | ❌ | ✅ added to Piece 3 from Chatwoot #14545 |

License: Apache-2.0. ~94 stars. Mozilla-affiliated. Last pushed 2026-06-10. Production-readiness should be evaluated, not assumed (the project is young) — but the design is sound.

## Outputs

The spec and plan were updated in place rather than creating new nodes:

- [sms-message-buffering-spec](../nodes/projects/sms-message-buffering-spec.md) — added an "Existing implementations" section describing clawbolt + Chatwoot #14545 + verified-not-implemented (Rasa, Botpress, Chatwoot core, Baileys, etc.) + voice-AI references that don't port directly. Also added Checkpoints A and B to the "Per-user serialization" section, adopting the Chatwoot #14545 hybrid design template explicitly. References section expanded to cite clawbolt's specific files + Chatwoot issue tracker.
- [sms-message-buffering-plan](../nodes/projects/sms-message-buffering-plan.md) — Piece 1 now cites clawbolt as a borrow-from skeleton (potentially saving ~1 dev-day). Piece 3 now includes Checkpoint A (pre-LLM tail check) and Checkpoint B (post-LLM pre-send tail check) as deliverables, with corresponding acceptance criteria and risks.

## Key findings (verified)

- **mozilla-ai/clawbolt is the only clean reference.** Apache-2.0, per-user asyncio debounce keyed by `user.id`, 1500ms default, merges text+media. Internal note in `ingestion.py` references "nanobot's Mochat _enqueue_delayed_entry/_flush_delayed_entries pattern" — possible deeper provenance worth tracing.
- **Chatwoot has no native buffering, and explicitly declined to add it.** Issue #13697 closed "not planned" by maintainer sojan-official: *"For now this can be handled at the client or integration layer."* The hybrid debounce + abort-on-newer proposal lives at issue #14545 (open, not merged).
- **Chatwoot's Captain LLM auto-responder fires once per inbound message.** Confirmed by reading `enterprise/app/services/enterprise/message_templates/hook_execution_service.rb`. The only delay (PR #11837) is a 1–5s ActiveStorage attachment-readiness wait, gated on `message.attachments.present?` — unrelated to burst coalescing.
- **Rasa and Botpress have no inbound-burst buffering** in their issue trackers or codebases. Closest semantic neighbor in Rasa is "Buffered Tracker Save" (TrackerStore I/O, not message coalescing).
- **WhatsApp libraries are pure protocol layers**, not turn-handlers. Baileys, whatsapp-web.js, wppconnect expose `messages.upsert` events; consumer must implement burst handling. By extension, this likely applies to similar low-level libraries.
- **LiveKit Agents `audio_recognition.py`** has the cleanest pluggable abstraction (`BaseEndpointing`, deque buffer, manual-commit at 0.5s, `stt_flush_duration: 2.0`). Apache-2.0. Voice-coupled but the abstraction shape is exactly what a `TextEndpointing` would look like.
- **Pipecat smart-turn is audio-only.** 16kHz mono PCM, ≤8s. Text conditioning is medium-term roadmap, not shipped. Don't attempt the artifact for SMS; only the pattern.

## Refuted claims (do not cite)

- 0–3: "Chatwoot #14545 recommends a 4-second default debounce window."
- 1–2: "Pipecat / LiveKit turn decisions come purely from ML backends, not fixed debounce timeouts." (Both use a baseline timer adjusted dynamically.)

## Time-sensitive caveats

- **clawbolt is young** (created Feb 2026, ~94 stars). Production-readiness should be evaluated rather than assumed. The design is sound but battle-testing is limited.
- **Chatwoot #14545 is design intent only**, not shipped code. Treat as design rationale.
- **LiveKit's audio_recognition.py constants** (0.5s, 2.0s, 200ms) are voice-domain — illustrative of pattern shape, not directly portable as text debounce values.
- **GitHub code-search has rate limits and indexing gaps.** Absence of hits in Rasa/Botpress is strong but not absolute evidence.
- **Verification snapshot is 2026-06-10**; clawbolt may evolve. Re-verify line numbers before borrowing code.

## Open questions for the next pass

- What is "nanobot's Mochat" referenced in clawbolt's comments? Possible deeper-provenance reference worth tracing.
- Do production WhatsApp BSPs (Twilio, MessageBird, 360dialog) have buffering in any sample apps not surfaced by these searches, or is the pattern universally pushed to the integration layer per Chatwoot's stance?
- Could LiveKit's `BaseEndpointing` abstraction be cleanly forked into a text-channel `TextEndpointing` preserving the deque-buffer + threshold-flush shape, or does the voice-coupling run too deep to extract?
- Beyond fixed-timer debounce, are there any open-source semantic EOT classifiers operating on text (LLM-based "is this message complete?") that this round didn't surface?

## Connection to existing graph

- The spec's novelty is now precisely characterized: **clawbolt's foundation + voice-AI's L2 classifier + Chatwoot #14545's two-checkpoint abort-on-newer + this spec's announced-content mode + intent-edit handling.**
- Reinforces [2026-06-10-sms-message-buffering-research](2026-06-10-sms-message-buffering-research.md)'s finding: the public production-chatbot literature on this specific problem is genuinely thin. The handful of open-source patterns surfaced are partial, not canonical.
- Strengthens the open-follow-up of *publishing this as a Brex case study after deployment* — that gap remains unfilled in the broader community.
