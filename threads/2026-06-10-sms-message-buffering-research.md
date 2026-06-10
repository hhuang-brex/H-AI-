---
id: 2026-06-10-sms-message-buffering-research
type: thread
tags: [sms, message-buffering, end-of-turn, research, thread]
related:
  - [[sms-message-buffering-spec]]
  - [[sms-multi-thread-chatbot]]
  - [[sms-state-machine]]
  - [[forced-tool-call-output]]
status: archived
created: 2026-06-10
---

# Thread — SMS Message Buffering Research (2026-06-10)

Conversation goal: an SMS chatbot needs to handle the case where a user splits one thought across multiple messages — specifically the **announced-content** pattern ("this is receipt" → image arrives separately) and intent-edit-mid-buffer ("actually I meant the Tuesday one"). What's the production best practice from companies that have solved this?

## Method

Used the superpowers:brainstorming skill end-to-end:

1. Two clarifying questions:
   - Surface → SMS (no typing indicators, only text + timestamps).
   - Failure mode → user gave a concrete example: "user says 'this is receipt' then another message to send receipt image" — the announced-content pattern.
2. Three approaches proposed (time-buffer, forward-reference detection, LLM classifier); user asked for the published best practice from companies that solve this perfectly rather than picking from hypothetical options.
3. Ran the deep-research workflow to find primary sources.
4. Three-section design walkthrough; user pushed back on edge cases (added E10 intent-edit-mid-buffer, dropped 3 cases as not production-real).
5. Spec written; references added on user request.
6. Plan to follow.

## Research workflow stats

- **104 subagents · ~2.46M subagent tokens · ~13 min wall time**
- **3-vote adversarial verification** on every claim
- **7 plausible-sounding claims unanimously refuted (0–3)**

## Outputs

- [sms-message-buffering-spec](../nodes/projects/sms-message-buffering-spec.md) — full design spec.
- This thread (research origin + key findings).

## The honest result

**No major chatbot team has published canonical guidance** on SMS split-message handling. The research surveyed Intercom Fin, Klarna AI, ChatGPT mobile, Slack AI, Discord, Notion AI, Glean, Stripe, Cursor, Replit, Linear, WhatsApp Business — none have public engineering posts documenting specific buffer windows, debounce timers, or end-of-turn classifiers for SMS.

**Where the answer exists**: voice-AI infrastructure. LiveKit and Pipecat have both shipped semantic-aware end-of-turn classifiers with primary-source docs. The architecture ports cleanly to SMS; the timing constants don't (need scaling).

## Key findings (verified)

- **Semantic-aware end-of-turn classification** is the documented production pattern. LiveKit ships a 0.5B Qwen2.5-Instruct model (distilled from Qwen2.5-7B); Pipecat ships an 8M-param Whisper Tiny + linear head. Both run on CPU at 25–160 ms per call.
- **Confidence-scaled dynamic timeouts** outperform fixed thresholds. LiveKit defaults: `min_delay=0.5s`, `max_delay=3.0s`. Vendor benchmark: 39% reduction in false interruptions at fixed 99.3% true-positive rate.
- **Asymmetric error tuning** — favor over-waiting. The 135M model reports 85% reduction in unintentional interruptions while only 3% false-negative on "turn not over." Cost-of-acting-on-incomplete-intent ≫ cost-of-extra-wait.
- **No platform-level SMS buffering exists**. Twilio fires one synchronous webhook per inbound. Bandwidth `segmentCount` only handles single-message carrier segmentation. Application code must do the buffering.
- **Deepgram's "buffer-and-stitch"** principle ports cleanly: *"Do not use `speech_final: true` alone — concatenate `is_final: true` responses until `speech_final: true`."* In SMS terms: don't trust a single message-arrival as the turn boundary; buffer until a confidence-scaled flush event fires.
- **The announced-content pattern itself has no dedicated documented solution**. Practitioners infer it from general split-message handling. The forward-reference regex + AWAITING_ANNOUNCED_CONTENT mode + image-arrival flush is novel-but-defensible synthesis.

## Refuted claims (do not cite)

- 0–3: "BuilderBot's documented production pattern uses a 1500ms debounce window."
- 0–3: "OpenClaw WeCom plugin uses a 2-second debounce window."
- 0–3: "The debounce timer resets on each new message arrival, so the buffer only flushes after a full 2-second silence."
- 0–3: "Recommended approach for multi-image burst is to queue media into a shared array and debounce the final response — only the last invocation fires after debounce window."
- 1–2: "Twilio reassembles multi-segment SMS into a single webhook supporting up to 1600 characters via NumSegments." (Conflates per-message segmentation with per-burst.)
- 1–2: "End-of-turn detector requires a text transcript (STT output), making it portable to text-only channels." (True but oversells the porting story.)
- 0–3: "Failure mode of structured data (phone numbers, emails) where intonation stays flat applies analogously to text chatbots receiving structured data."

## Time-sensitive caveats

- All EOT/turn-detector benchmark numbers (39%, 85%, 25–160 ms) are vendor self-reported by LiveKit and Pipecat; no third-party reproduction.
- The voice-to-text porting argument is structural reasoning, not a documented port. LiveKit/Pipecat docs do not discuss SMS.
- FLOOR_S=8 / CEILING_S=30 / EXTENSION_S=30 in the spec are extrapolated from voice's 0.5/3 — not empirically validated for SMS users. Tune in production.
- Twilio and Bandwidth specifics current as of 2026; verify before final implementation.
- The handful of secondary-source patterns (BuilderBot, OpenClaw) that surfaced in initial search did not survive verification — the public production-chatbot literature on this specific problem is genuinely thin.

## Connection to existing graph

- New project node [sms-message-buffering-spec](../nodes/projects/sms-message-buffering-spec.md) joins the SMS cluster alongside [sms-state-machine](../nodes/concepts/sms-state-machine.md) (which gains a new `buffering` state), [flat-channel-thread-tracking](../nodes/concepts/flat-channel-thread-tracking.md) (which runs *after* buffer flush), [async-conversation-pacing](../nodes/concepts/async-conversation-pacing.md) (second-scale companion to its day-scale pacing).
- The L2 classifier discipline reinforces [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) (structured tool-calls for both prompt modes) and [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) (every classifier decision logged with confidence, expected_continuation, model_version).
- The forensic-not-explanatory framing from [cot-as-forensic-artifact](../nodes/concepts/cot-as-forensic-artifact.md) applies: the classifier's `reasoning_summary` is for audit and calibration, never for user display.

## Open follow-ups

- **Empirical tuning of FLOOR/CEILING/EXTENSION** — log full distribution of buffer-close times for first 30 days of production; tune per user cohort.
- **Per-locale L1 regex** — patterns are English-first; non-English users currently fall through entirely to L2. Per-locale pattern lists are a follow-up.
- **Out-of-order delivery, message dedup, bot-mid-tool-call** — three real edge cases dropped from the spec scope; revisit if production traffic surfaces them.
- **Replay-with-newer-model for classifier** — once production audit data exists, periodically re-run the L2 classifier prompt against the newest Haiku to detect calibration drift.
- **Production case study from Brex** — once this ships and runs for a quarter, the team would have published-able primary-source guidance that the broader community currently lacks. Worth writing up.
