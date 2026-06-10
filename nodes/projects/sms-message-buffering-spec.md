---
id: sms-message-buffering-spec
type: project
tags: [sms, message-buffering, end-of-turn, dynamic-timeout, design, proposal]
related:
  - [[sms-multi-thread-chatbot]]
  - [[sms-state-machine]]
  - [[flat-channel-thread-tracking]]
  - [[async-conversation-pacing]]
  - [[sms-recovery-and-reentry]]
  - [[decision-audit-trail]]
  - [[forced-tool-call-output]]
  - [[cot-as-forensic-artifact]]
status: proposal
created: 2026-06-10
source-thread: [[2026-06-10-sms-message-buffering-research]]
---

# SMS Message Buffering — Design Spec

How an SMS chatbot handles the case where a user splits one thought across multiple messages — including the **announced-content** pattern (text "this is receipt" → image arrives separately), broader split-sentence bursts, and intent edits mid-buffer. Ports the LiveKit/Pipecat voice-AI semantic-end-of-turn pattern to text, with SMS-scaled timing.

## Goal

Stop the bot from doing one of two failure modes:

1. **Acting on incomplete intent**: bot replies to message 1 of a burst before the user finishes; high-stakes actions executed against half a request.
2. **Fragmenting responses**: bot replies to each of N user messages individually, producing N partial responses where 1 coherent response was wanted.

Plus the announced-content case: bot replies "What receipt?" to a text that was *announcing* an image still in transit.

## Non-goals

- **Not** voice. Voice has solved this with VAD + EOT classifiers (LiveKit, Pipecat); text needs the architectural port, not the voice infrastructure.
- **Not** rich-chat (Slack, Intercom). Those have typing indicators that change the design space; out of scope here.
- **Not** full conversational repair. [sms-recovery-and-reentry](../concepts/sms-recovery-and-reentry.md) handles the broader "user is confused" cases. This spec only covers the intra-burst buffering window.
- **Not** carrier-level reassembly. Twilio `NumSegments` and Bandwidth `segmentCount` only handle single-message segmentation; user-intent-level bursts must be handled in app code.

## Out of scope (might land later)

- **Out-of-order carrier delivery** — message 2 arrives before message 1. Real on cross-carrier SMS but not flagged as a current pain point. Recovery via `sms-recovery-and-reentry` if it occurs.
- **Message deduplication** — carrier delivers the same inbound twice. Idempotency by carrier-supplied `MessageSid` deduped at ingest, not in this spec.
- **Bot mid-tool-call from prior turn** — new message arrives while the bot is in the middle of executing tools from a prior turn. Bigger architectural concern; treated as join-or-queue at the per-user lock layer; not designed here.
- **Multi-locale L1 regex coverage** — patterns are English-first; non-English locales fall through to L2 classifier. Per-locale pattern sets are a follow-up.
- **Streaming responses while buffering** — applies to rich chat, not SMS.

## What ships

A new `buffering` state in [sms-state-machine](../concepts/sms-state-machine.md) with three detection layers, dynamic timeout, per-user serialization, audit-trail integration, and eval coverage for edge cases E1–E10.

## Architecture

### State machine extension

```
                  inbound msg arrives
                          │
                          ▼
                ┌──────────────────┐
   open ──────► │  buffering       │ ◄──── inbound msg from same user
                │  (NEW state)     │
                │                  │
                │  modes:          │
                │   DEFAULT        │
                │   AWAITING_      │
                │   ANNOUNCED_     │
                │   CONTENT        │
                │   INTENT_EDITED  │
                └────────┬─────────┘
              flush event│
                         ▼
                ┌─────────────────┐
                │  processing     │
                │  (per-user      │
                │   locked)       │
                └─────────────────┘
```

### Three detection layers per inbound

```
inbound message
  ↓
[L1 regex fast-path] ~0.1ms
  - FORWARD_REF       → mode=AWAITING_ANNOUNCED_CONTENT, extend ceiling, skip L2
  - CONTINUATION      → extend buffer, skip L2
  - EXPLICIT_DONE     → flush at floor, skip L2
  - EDIT_MARKERS      → route L2 to edit-classifier prompt
  - no match          → run L2 with default prompt
  ↓
[L2 small classifier] ~250ms (Haiku tool-call)
  - default prompt:    classify_turn_completeness → {is_complete, confidence}
  - edit prompt:       classify_intent_edit       → {edit_kind: add|cancel|replace, confidence}
  ↓
[L3 dynamic timeout] ~0ms
  timeout = floor + (1 - confidence) × ceiling
  with announced-content extension when armed
  ↓
schedule flush_at = last_arrival_ts + timeout
```

### Per-buffer state record (Redis-backed)

```python
{
  "user_id": str,
  "thread_id": str,
  "messages": [
    {"timestamp": float, "type": "text|image|document", "content": ..., "msg_sid": str}
  ],
  "superseded_messages": [...],         # E10: edit history kept for audit
  "mode": "DEFAULT" | "AWAITING_ANNOUNCED_CONTENT" | "INTENT_EDITED",
  "first_arrival_ts": float,
  "last_arrival_ts": float,
  "classifier_decisions": [             # one entry per inbound classified
    {
      "msg_sid": str,
      "prompt_kind": "completeness" | "intent_edit",
      "result": dict,                   # full tool-call output
      "model_version": str,
      "latency_ms": float,
    }
  ],
  "scheduled_flush_at": float,
}
```

TTL on this record = `CEILING_S + ANNOUNCED_EXTENSION_S + buffer` (e.g., 90s) so a server crash mid-buffer doesn't lose forever.

## Detection layers in detail

### L1 — Regex fast-path

```python
import re

# 1. Forward-reference: announces content coming next
FORWARD_REF = re.compile(
    r"(?ix)\b("
    r"this\s+is\s+(the|my|a)?|"
    r"here(?:'s|\s+is)?\s*(?:the|my|a)?|"
    r"see\s+(below|attached|next)|"
    r"(?:i'?m\s+)?sending\s+(?:you\s+)?(?:the|my|a)?|"
    r"attached(?:\s+is)?|"
    r"check\s+(?:out|this)|"
    r"sending\s+(?:it|now|a\s+pic|the\s+receipt)|"
    r"hold\s+on|"
    r"one\s+(?:sec|moment|min)"
    r")\b"
)

# 2. Continuation: starts mid-sentence or trails into next
CONTINUATION = re.compile(
    r"^\s*(?:and|also|btw|plus|or|but|because|since|so)\b|"
    r"[,\-]\s*$"
)

# 3. Explicit completion
EXPLICIT_DONE = re.compile(
    r"(?ix)\b(done|that's\s+it|ok\s+send|go\s+ahead|please|thanks)\b|"
    r"\?\s*$"
)

# 4. Intent edit (E10)
EDIT_MARKERS = re.compile(
    r"(?ix)\b("
    r"actually(?!\s+yes|\s+yeah)|"
    r"scratch\s+that|"
    r"wait[,\s]|"
    r"never\s*mind|"
    r"forget\s+(?:that|it)|"
    r"i\s+meant\s+|"
    r"let\s+me\s+(?:restart|redo|try\s+again)|"
    r"hold\s+on[,\s]|"
    r"sorry[,\s]+(?:i\s+)?meant"
    r")\b"
)
```

**False-positive guard**: FORWARD_REF must NOT match when the sentence ends with terminal punctuation. "This is helpful, thanks." matches the regex but is a complete sentence; require absence of `.`, `!`, `?` at end-of-string before treating as forward-reference.

### L2 — Small semantic classifier

Two prompt modes, both implemented as forced tool-calls (per [forced-tool-call-output](../concepts/forced-tool-call-output.md)):

**Default — turn completeness:**

```python
classifier_tool = {
    "name": "classify_turn_completeness",
    "input_schema": {
        "type": "object",
        "required": ["is_complete", "confidence", "expected_continuation"],
        "properties": {
            "is_complete": {"type": "boolean"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "expected_continuation": {
                "type": "string",
                "enum": ["none", "more_text", "image", "document", "unsure"],
            },
        },
    },
}
```

**Edit kind (when EDIT_MARKERS matched):**

```python
edit_classifier_tool = {
    "name": "classify_intent_edit",
    "input_schema": {
        "type": "object",
        "required": ["edit_kind", "confidence", "superseded_content_summary"],
        "properties": {
            "edit_kind": {
                "type": "string",
                "enum": ["add", "cancel", "replace"],
            },
            "confidence": {"type": "number"},
            "superseded_content_summary": {"type": "string"},
        },
    },
}
```

Model: `claude-haiku-4-5-20251001` (start). Latency ~250ms p50, ~$0.0001/call. Promote to a fine-tuned head once labeled production data exists.

### L3 — Dynamic timeout

Pure math:

```python
FLOOR_S = 8                    # min wait — even high-confidence "done" inbounds wait this long
CEILING_S = 30                 # max default wait — past this, force-flush with liveness ack
ANNOUNCED_EXTENSION_S = 30     # additional ceiling when AWAITING_ANNOUNCED_CONTENT

def compute_flush_at(buffer):
    confidence = buffer.classifier_decisions[-1].get("confidence", 0.5)
    base = FLOOR_S + (1 - confidence) * (CEILING_S - FLOOR_S)
    if buffer.mode == "AWAITING_ANNOUNCED_CONTENT":
        base = max(base, ANNOUNCED_EXTENSION_S)
    hard_ceiling = buffer.first_arrival_ts + CEILING_S + (
        ANNOUNCED_EXTENSION_S if buffer.mode == "AWAITING_ANNOUNCED_CONTENT" else 0
    )
    return min(buffer.last_arrival_ts + base, hard_ceiling)
```

**Asymmetric tuning** (per voice-AI design principle): the cost of acting on incomplete intent ≫ the cost of an extra second of wait. The 8s floor enforces this universally. The L2 classifier prompt should err toward `is_complete: false` when uncertain.

**Caveat**: FLOOR_S=8 / CEILING_S=30 / EXTENSION_S=30 are extrapolated from voice's 0.5/3 — not empirically validated for SMS users. Tune per cohort once production traffic accumulates.

## Flush event types

| Event | Fires when | Resulting action |
|---|---|---|
| `timeout_reached` | `now >= scheduled_flush_at` | Flush + process |
| `announced_content_arrived` | In `AWAITING_ANNOUNCED_CONTENT`, MMS/image arrives | Flush + process; mode auto-clears |
| `confidence_high` | L2 returns `is_complete=true` with confidence > 0.85 AND no AWAITING_ANNOUNCED_CONTENT | Flush at floor (8s minimum) |
| `ceiling_exceeded` | `now >= hard_ceiling` | Flush + send liveness ack if no full reply ready ("Got the text — go ahead and send the rest when ready") |
| `user_explicit_signal` | EXPLICIT_DONE match | Flush at floor |
| `edit_cancel` | E10 edit_kind=`cancel` | Flush; brief acknowledgment ("OK, ignoring that"); buffer cleared |

## Edge cases (E1–E10)

| ID | Pattern | Handling |
|---|---|---|
| E1 | Multi-image burst (text + N images in one turn) | AWAITING_ANNOUNCED_CONTENT stays armed across burst; each image re-arms timer; flush when window closes with all images included |
| E2 | Mixed announce + new-thread ("here's receipt" + image + "also tell me my balance") | Image arrival closes mode; new question starts new buffer; L2 correctly flags as separate |
| E3 | Premature `?` while AWAITING_ANNOUNCED_CONTENT | Flush with status: "Got the text but no image yet — send when ready"; don't treat `?` as a question |
| E4 | "Never mind" mid-buffer | EDIT_MARKERS + L2 returns `cancel`; buffer cleared; brief ack sent |
| E5 | Race: bot starts processing as new message arrives | Per-user row-level lock during `buffering → processing`; new message joins in-flight if not locked, else new buffer |
| E6 | Crash mid-buffer | Redis TTL = `CEILING_S + ANNOUNCED_EXTENSION_S + buffer`; scheduled-flush worker scans for expired buffers on startup |
| E7 | Carrier delays a burst message past hard ceiling | Detect via carrier-supplied origin timestamp vs. arrival; route to existing turn if not yet processed; else start recovery flow ([sms-recovery-and-reentry](../concepts/sms-recovery-and-reentry.md)) |
| E8 | Adversarial spam (60 messages in 5 min) | Hard cap on buffer message count (default 20); past that, force-flush with "let me work with what you've sent" ack |
| E9 | Delivery-failed image while AWAITING_ANNOUNCED_CONTENT | Covered by E3 + ceiling fallback |
| E10 | Intent edit mid-buffer ("actually I meant the Tuesday one") | EDIT_MARKERS triggers edit-kind classifier (`add`/`cancel`/`replace`); buffer mutated accordingly; superseded content kept in audit |

## Per-user serialization

The `buffering → processing` transition acquires a per-user lock. Three behaviors when a new inbound arrives during processing:

1. **Lock acquired, processing not yet started**: new message joins the buffer, processing waits.
2. **Processing in flight**: new message starts a fresh buffer; serializes after current processing completes.
3. **Stuck lock (>60s)**: alert + force-release; treat as crash recovery.

Lock granularity: `user_id × thread_id`, not just `user_id`. A user with two open threads can have parallel buffers.

## Storage decisions

| Component | Where it lives | Why |
|---|---|---|
| Buffer state record | Redis | Low-latency lookups per inbound; TTL-based GC; durable enough for crash recovery |
| Per-user lock | Redis (Redlock or single-instance) | Same store as buffer; atomic SET-NX |
| Classifier audit | [decision-audit-trail](../concepts/decision-audit-trail.md) (Postgres) | Long-term audit, replay, drift detection |
| Final processed turn | Existing message store | No change to current schema |

If your stack is Postgres-only (no Redis), buffer state can live in a dedicated table with `LISTEN/NOTIFY` for flush-now triggers and a periodic worker for timeouts. Slightly higher latency, more familiar to debug.

## Eval surface

### Mechanical (cheap, every PR)

- **No-fragmentation**: N user messages within window → exactly 1 bot reply.
- **Floor honored**: time-from-first-inbound-to-bot-reply ≥ FLOOR_S.
- **Ceiling honored**: time-from-first-inbound-to-bot-reply ≤ hard_ceiling for that mode.
- **Race-safe**: concurrent inbound bursts → no two bot replies fire for the same logical turn.
- **Buffer cleanup**: every flushed buffer has `processed=true` and TTL respected.

### Labeled dataset (build over time)

- **Classifier calibration**: bucket L2 decisions by reported confidence; measure actual completion accuracy per bucket. Target: accuracy ≈ confidence.
- **Forward-reference precision/recall**: labeled inbounds with FORWARD_REF expected/not; assert L1 catches at >90% recall, <5% FP.
- **Announced-content end-to-end**: scenarios with text-then-image; assert reply references both, not just one.
- **Edit-kind disambiguation**: labeled add/cancel/replace; per-class precision/recall on L2 edit-classifier.

### Adversarial regression

E1–E10 each become a regression test. Once a real production failure surfaces a new edge case, a test case locks it in.

### Production drift

- **Buffer-flush histogram** by reason (timeout, announced-content, ceiling, explicit-done, edit-cancel) — track distribution shift over time.
- **L2 classifier confidence distribution** — drift after model upgrades signals recalibration needed.
- **Lock-wait time p99** — rising = contention; investigate.

## Cost / latency budget

| Per-inbound | Cost | p50 | p99 |
|---|---|---|---|
| L1 regex | $0 | <1ms | <1ms |
| L2 classifier (Haiku tool-call) | ~$0.0001 | ~250ms | ~600ms |
| L3 timeout math | $0 | <1ms | <1ms |
| Wait time (UX-visible) | $0 | min 8s, dynamic | up to 60s on AWAITING_ANNOUNCED_CONTENT |

At 10k SMS inbounds/day, ~$1/day in classifier cost. The wait time is the user-visible cost; everything else is rounding.

## Risks

1. **Extrapolated timing constants.** FLOOR/CEILING/EXTENSION numbers are inferred from voice. *Mitigation*: log full distribution of buffer-close times for first month; tune empirically.
2. **L2 calibration drift on model upgrades.** Pin model version in audit; alert on calibration drift.
3. **Lock contention on high-frequency users.** Granularity at user × thread; max-wait fallback.
4. **L1 regex false positives in non-English.** Per-locale pattern lists or fall through to L2 only.
5. **Asymmetric tuning skews user perception toward "slow bot".** Monitor latency-to-reply p50/p95; lower FLOOR if users complain.
6. **Edit-classifier hallucination**: model may report `replace` when user just added information. Conservative default: when confidence < 0.6, treat as `add` (safer).

## Implementation order

Each piece independently shippable behind a flag.

1. **Redis-backed buffer state + per-user lock** (~3 days). Foundation; zero behavior change yet (single-message turns just flush at floor).
2. **L1 regex fast-path** (~2 days). Forward-reference and continuation markers; simple timeout extension. Catches the easy cases.
3. **L2 default classifier (Haiku tool-call) + dynamic timeout** (~3 days). Confidence-scaled timeout for non-L1 cases.
4. **AWAITING_ANNOUNCED_CONTENT mode + image-arrival flush trigger** (~2 days). Closes the original announced-content scenario.
5. **E10 EDIT_MARKERS + edit-classifier prompt** (~2 days). Intent-edit handling; superseded-content audit logic.
6. **Eval suite (mechanical + labeled + adversarial)** (~3 days). Locks in regression safety.
7. **Drift dashboard + cost reconciliation** (~2 days). Buffer-flush histogram, classifier calibration drift alert.

Total: ~17 dev-days for the full surface. Items 1–4 alone (~10 days) handle the announced-content scenario; items 5–7 are quality and ops layers.

## Success criteria

- Zero "What receipt?"-class replies on text-then-image bursts (E2 + announced-content).
- Multi-image bursts (E1) processed as one coherent turn, with all images referenced in the reply.
- Intent edits (E10) processed correctly: `cancel` clears buffer cleanly; `replace` doesn't act on superseded content; `add` keeps waiting.
- Bot reply latency under hard ceiling at p99.
- Classifier calibration accuracy within ±10% of confidence at every bucket.

## Cross-links to existing graph

- [sms-state-machine](../concepts/sms-state-machine.md) — gains a new `buffering` state. Prior states (`open`, `awaiting-user`, `awaiting-system`, `dormant`, `expired`) unchanged in semantics.
- [flat-channel-thread-tracking](../concepts/flat-channel-thread-tracking.md) — runs *after* buffer flush. Operates on the merged turn, not individual messages.
- [async-conversation-pacing](../concepts/async-conversation-pacing.md) — second-scale buffering complements day-scale pacing. Same recency principle, different timescale.
- [sms-recovery-and-reentry](../concepts/sms-recovery-and-reentry.md) — E7 (carrier delay) is a new recovery scenario worth adding to that node.
- [decision-audit-trail](../concepts/decision-audit-trail.md) — L2 classifier decisions persisted; tunes thresholds and detects drift.
- [forced-tool-call-output](../concepts/forced-tool-call-output.md) — both L2 prompt modes use forced tool-calls.
- [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md) — classifier reasoning summary captured for audit; never user-facing.

## References (verified primary sources)

### Voice-AI semantic end-of-turn — the architectural pattern this spec ports

- **LiveKit Turn Detector — official docs**. https://docs.livekit.io/agents/build/turns/turn-detector/ — Documents the open-weights 0.5B Qwen2.5-Instruct (multilingual, 396 MB on disk) and 135M SmolLM v2 (English) classifiers, default `min_delay=0.5s` / `max_delay=3.0s` parameters, dynamic timeout scaled by classifier confidence.
- **LiveKit blog — "Improved end-of-turn model cuts voice AI interruptions 39%"**. https://livekit.com/blog/improved-end-of-turn-model-cuts-voice-ai-interruptions-39/ — Vendor benchmark: v0.4.1-intl achieves 39.23% relative reduction in false-positive interruptions vs v0.3.0-intl at fixed 99.3% true-positive rate (aggregate error 18.66% → 11.34%) with no latency increase.
- **LiveKit blog — "Using a transformer to improve end-of-turn detection"**. https://livekit.com/blog/using-a-transformer-to-improve-end-of-turn-detection/ — 135M SmolLM v2 model: 85% reduction in unintentional interruptions, only 3% false-negative rate on "turn not over" — the asymmetric error tuning principle this spec adopts.
- **LiveKit Agents — Turn Detector plugin (GitHub)**. https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-turn-detector — Plugin README documents the architecture: Qwen2.5-0.5B-Instruct distilled from a Qwen2.5-7B teacher.
- **Pipecat Smart Turn v3 (GitHub)**. https://github.com/pipecat-ai/smart-turn — Independent vendor implementation: 8M-param Whisper Tiny + linear classifier head, 23 languages, 16kHz mono PCM input up to 8s, 10–100 ms CPU inference (~65 ms on Pipecat Cloud).
- **Deepgram — Endpointing**. https://developers.deepgram.com/docs/endpointing — 10ms default, 300–500ms for conversational. Critical caveat: *"Do not use `speech_final: true` alone to capture full transcripts"* — long utterances produce multiple `is_final: true` responses before `speech_final: true`. The buffer-and-stitch principle.

### SMS platform docs — what the carriers do (and don't do) for you

- **Twilio Messaging — Receive an inbound message webhook**. https://www.twilio.com/docs/messaging/guides/webhook-request — Each inbound message triggers a single synchronous HTTP webhook with `Body`, `NumMedia`, `MediaUrl{N}`, `MediaContentType{N}` parameters. **No platform-level buffering across separate inbound messages.** This spec exists because the platform doesn't solve it.
- **Bandwidth — Messaging API: Inbound webhook event**. https://dev.bandwidth.com/docs/messaging/webhooks/incoming/ — `segmentCount` field reports carrier-level concatenation of a single oversized message, NOT user-intent-level multi-message bursts. For MMS, `segmentCount` is always 1. Refutes the common assumption that carrier reassembly is sufficient.

### Anthropic / OpenAI tooling that the classifier layer uses

- **Anthropic — Tool use overview**. https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview — Tool-call billing model and forced tool-call mechanics; underpins the L2 classifier's structured-output discipline.
- **Anthropic — Claude Haiku 4.5 model card**. https://docs.anthropic.com/en/docs/about-claude/models/all-models — Model id `claude-haiku-4-5-20251001`, latency and cost characteristics for the L2 classifier choice.

### Cross-lab consensus (the broader context for instrumenting reasoning)

- **Korbak et al. — "Chain of Thought Monitorability: A New and Fragile Opportunity for AI Safety"** (41 authors, July 2025). https://arxiv.org/abs/2507.11473 — While the spec's L2 classifier is not itself a safety monitor, the audit-trail discipline (every classifier decision logged, calibration drift tracked) follows the same forensic-not-explanatory framing established by this paper and detailed in [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md).

### Refuted patterns (worth knowing not to cite)

The deep-research workflow explicitly refuted these as production guidance — they appeared in secondary search results but did not survive 3-vote adversarial verification. **Do not cite as production patterns**:

- "BuilderBot 1.5s debounce window" — vote 0–3, no primary-source production deployment found.
- "OpenClaw WeCom 2-second debounce" — vote 0–3, plugin docs only, not production guidance.
- "Carrier-level concatenation handles split-thought bursts" — vote 1–2, conflates transport segmentation with user-intent splitting.

The honest finding from the research: **no major chatbot team (Intercom Fin, Klarna AI, ChatGPT mobile, Slack AI, Discord, Notion AI, Glean, Stripe, Cursor, Replit, Linear, WhatsApp Business) has published canonical guidance on SMS split-message handling.** This spec exists to fill that gap by porting the voice-AI pattern, not by following a documented chatbot-team precedent.
