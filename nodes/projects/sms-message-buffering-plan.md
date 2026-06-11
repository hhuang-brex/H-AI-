---
id: sms-message-buffering-plan
type: project
tags: [sms, message-buffering, end-of-turn, plan, proposal]
related:
  - [[sms-message-buffering-spec]]
  - [[sms-state-machine]]
  - [[flat-channel-thread-tracking]]
  - [[decision-audit-trail]]
  - [[forced-tool-call-output]]
status: proposal
created: 2026-06-10
source-thread: [[2026-06-10-sms-message-buffering-research]]
---

# SMS Message Buffering — Implementation Plan

Sequenced delivery plan for [sms-message-buffering-spec](sms-message-buffering-spec.md). Deliberately abstract (no specific codebase paths) so it ports to any production SMS chatbot stack.

The 7 pieces are **independently shippable behind a feature flag**. Each piece adds value on its own; later pieces refine what earlier pieces shipped without throwing away.

## Sequencing logic

The order is chosen so that:

- **Foundations ship first** — buffer state + per-user lock unlock everything else, but on their own produce zero behavior change (every "burst" is one message at the start, until detection layers exist).
- **Cheap wins second** — L1 regex catches the easiest cases at near-zero cost before paying for an LLM call.
- **The marquee feature lands at v1 cutoff** — items 1–4 collectively close the announced-content scenario the user actually has. Stop here if budget is constrained.
- **Quality and ops layers come last** — E10 (intent edits) refines, eval locks in regression safety, drift dashboard makes operations sustainable.

```
Items 1 → 2 → 3 → 4   = v1, ~10 days, closes the announced-content scenario
                   ↓
Items 5 → 6 → 7      = quality + ops, ~7 days, refines + makes operable
```

## Tech stack assumptions

The plan assumes the stack has:

- **A persistent low-latency key-value store** (Redis is the default; a Postgres table with `LISTEN/NOTIFY` is a documented alternative).
- **A scheduled-job mechanism** that can fire timer events at second-resolution (Redis sorted-set + worker; a job queue like Sidekiq/Celery; or app-level setTimeout with persistence).
- **An LLM with a forced-tool-call API** (Anthropic Haiku 4.5 in the spec's worked example; OpenAI GPT-5 with structured outputs is an equivalent).
- **An existing per-user message intake** (your current SMS webhook handler).
- **An existing audit-trail or decision-log store** (per [decision-audit-trail](../concepts/decision-audit-trail.md); can be the same store as the message log if you don't have a separate one yet).

If any of these are missing, the relevant piece's effort estimate goes up. Flag during sprint planning.

## Per-piece structure

Each of the 7 pieces below specifies:

- **Scope** — one-line summary of what the piece does
- **Deliverables** — components to add (abstract names, not file paths)
- **Dependencies** — earlier pieces this depends on, plus external (the stack assumptions)
- **Acceptance criteria** — testable definitions of "done"
- **Risks** — what could go wrong, with mitigations

---

### Piece 1 — Buffer state + per-user lock

**Scope.** Foundation. Every inbound transitions through a `buffering` state before processing. Per-user × thread lock during the `buffering → processing` transition to prevent races. Zero user-visible behavior change initially (everything flushes at floor with no real classifier yet).

**Reference implementation.** [mozilla-ai/clawbolt's `MessageBatcher`](https://github.com/mozilla-ai/clawbolt/blob/main/backend/app/agent/ingestion.py) (Apache-2.0) is the cleanest open-source prior art for this layer — per-user asyncio debounce, cancel-and-recreate `_flush_after`, text + media merging. Borrow the skeleton; add the L1/L2/L3 detection layers on top in later pieces.

**Deliverables**
- New state `buffering` added to the SMS turn state machine (per [sms-state-machine](../concepts/sms-state-machine.md)).
- Buffer record schema in the chosen store (Redis hash or Postgres row), with TTL = `CEILING_S + ANNOUNCED_EXTENSION_S + buffer_seconds` (default 90s).
- Atomic SET-NX based per-user × thread lock with a 60s max-hold and force-release on stuck-lock alert.
- Scheduled-flush worker that wakes on TTL expiry and triggers `processing`.
- Crash-recovery sweep on app startup: scan for buffer records past their `scheduled_flush_at` and force-flush them.
- Feature flag `sms_message_buffering` defaulted off; routes inbounds through the new state when on.

**Dependencies.** Stack assumptions: KV store, scheduled-job mechanism. No prior pieces.

**Acceptance criteria**
- Single-message turns (the common case) still process correctly when feature flag is on. Latency-to-reply increases by exactly `FLOOR_S` seconds (no other changes).
- Concurrent multi-message bursts no longer fire two parallel processing runs for the same logical turn.
- Server restart mid-buffer recovers via TTL sweep within 60s of restart.
- Stuck lock past 60s emits an alert (does not silently retry forever).

**Risks**
- *Lock contention on bursty users*: granularity is user × thread, not just user, to avoid this. If a user has only one thread, contention is the same as user-level — accept and monitor.
- *Hot-key TTL pressure on the KV store*: for users with persistent buffer churn, TTL writes become noisy. Mitigation: extend TTL on each new message rather than recreate the record.

**Effort.** ~3 dev-days. The lock + recovery are usually the time sinks, not the state itself. **Borrowing the clawbolt skeleton can reduce this to ~2 days** if licensing and architecture fit.

---

### Piece 2 — L1 regex fast-path

**Scope.** Cheap pattern detection that handles the easy cases (announced-content, continuations, explicit completion) without paying for an LLM call.

**Deliverables**
- Four compiled regexes per the spec's L1 section: `FORWARD_REF`, `CONTINUATION`, `EXPLICIT_DONE`, `EDIT_MARKERS`. (EDIT_MARKERS shipped here as a no-op slot until Piece 5 wires up the L2 edit-classifier prompt.)
- Pattern-match-and-route function: takes an inbound, returns an action (`{set_mode_announced, extend_buffer, flush_at_floor, route_to_edit_l2, no_match}`).
- False-positive guard for FORWARD_REF: skip when the message ends with terminal punctuation (`.`, `!`, `?`).
- Unit tests for each pattern with positive + negative cases (including the FP guard).

**Dependencies.** Piece 1.

**Acceptance criteria**
- For canonical inputs ("this is receipt", "and also X", "thanks?", "actually scratch that"), L1 returns the expected action.
- "This is helpful, thanks." (terminal-punctuated FP) does NOT trigger AWAITING_ANNOUNCED_CONTENT.
- L1 latency is sub-millisecond per inbound.
- L1 short-circuits L2 when it has a high-confidence match (no LLM call made).

**Risks**
- *Locale coverage*: patterns are English-first. Non-English inbounds fall through to L2 entirely, which still works but at LLM cost. Out-of-scope for v1; flagged as follow-up.
- *Regex drift*: as production traffic surfaces new patterns, the pattern set grows. Track misses (no L1 match → L2 says "wait" → buffer was right thing to do) — these are candidates for new patterns.

**Effort.** ~2 dev-days.

---

### Piece 3 — L2 default classifier + dynamic timeout + abort-on-newer checkpoints

**Scope.** Semantic-aware turn-completeness detection for inbounds that L1 doesn't short-circuit. Plus the dynamic-timeout math that converts classifier confidence into a wait window. Plus the two abort-on-newer checkpoints from [Chatwoot issue #14545](https://github.com/chatwoot/chatwoot/issues/14545) that protect against the "user types during LLM call" race.

**Deliverables**
- `classify_turn_completeness` tool definition (per spec's L2 section) with `{is_complete, confidence, expected_continuation}` output.
- LLM client wrapper that invokes the classifier via forced tool-call (per [forced-tool-call-output](../concepts/forced-tool-call-output.md)), returns the structured result, and persists the full call to the audit trail per [decision-audit-trail](../concepts/decision-audit-trail.md).
- Dynamic-timeout calculator: `flush_at = max(last_arrival + (FLOOR_S + (1 - confidence) × (CEILING_S - FLOOR_S)), hard_ceiling)`.
- Constants `FLOOR_S=8`, `CEILING_S=30` exposed as configuration.
- Re-arming logic: each new inbound recomputes `flush_at` based on the latest classifier decision.
- **Checkpoint A** — pre-LLM tail check. Before invoking the action LLM, re-read the user's buffer state. If a newer message arrived since processing started, abort this run and return the lock; the new buffer's eventual flush handles the conversation. One Redis read.
- **Checkpoint B** — post-LLM pre-send tail check. After the action LLM returns, before sending to the user, re-read buffer state again. If newer messages arrived during the LLM call, do *not* send the (now-stale) response. Either discard or stash for audit. One Redis read.
- Audit fields: `classifier_decisions` populated on every classifier call; `aborted_by_checkpoint_a` / `aborted_by_checkpoint_b` counters in the audit trail.

**Dependencies.** Pieces 1, 2. Stack: LLM with forced-tool-call API.

**Acceptance criteria**
- For test inputs labeled complete, classifier returns `is_complete=true` with confidence > 0.7 in ≥80% of cases (calibration baseline; tighten over time).
- Dynamic-timeout produces values in `[FLOOR_S, hard_ceiling]` for all valid inputs.
- Audit trail has one row per classifier call with `confidence`, `expected_continuation`, `model_version`, `latency_ms`.
- Per-inbound cost ≤ \$0.0002 at the chosen model tier.
- Checkpoint A: test scenario where new inbound arrives between buffer flush and LLM call → assert processing aborts, lock released, new buffer continues.
- Checkpoint B: test scenario where new inbound arrives during LLM call → assert response is NOT sent to user; new turn handles the conversation.
- Checkpoint B firing rate < 5% in steady state (above this signals the LLM is too slow or users are too bursty).

**Risks**
- *Classifier calibration drift on model upgrades*: pin model version in the audit; dashboard alerts on confidence-distribution shift past a threshold.
- *Latency on the classifier*: p99 ≤ 600ms is the target; alert if p99 exceeds 1s.
- *Cost*: at high inbound volume, the L2 cost is the dominant new spend. Track per-call cost in the audit; reconcile against vendor bill monthly.
- *Checkpoint B wasted-LLM-call cost*: Checkpoint B aborts mean we paid for an LLM call we didn't use. Track in audit; accept as the cost of preventing fragmentation. If rate exceeds 5%, investigate.

**Effort.** ~3 dev-days (includes the two checkpoints; without them ~2 days).

---

### Piece 4 — AWAITING_ANNOUNCED_CONTENT mode + image-arrival flush

**Scope.** The marquee feature: text "this is receipt" arms the announced-content mode; image arrival flushes the buffer immediately, processed as one turn including both the text and the image.

**Deliverables**
- Mode field on the buffer record: `DEFAULT | AWAITING_ANNOUNCED_CONTENT | INTENT_EDITED`.
- L1's FORWARD_REF match arms the mode and extends the hard ceiling by `ANNOUNCED_EXTENSION_S` (default 30s).
- Image-arrival detection: when buffer is in announced mode and an MMS / image / document arrives, fire `announced_content_arrived` flush event immediately (skip the timeout wait).
- Multi-image handling: while in announced mode, additional images don't flush — they re-arm the timer; the buffer stays open until silence elapses or hard ceiling is reached.
- Liveness fallback at hard ceiling: if announced mode is still active when the hard ceiling fires (no image arrived), the bot's reply includes the status text "Got the text but no [receipt|document|image] yet — go ahead and send it whenever ready."

**Dependencies.** Pieces 1, 2, 3.

**Acceptance criteria**
- Test scenario: "this is receipt" + 8s gap + [image] → exactly one bot reply, referencing both the text and the image.
- Test scenario: "this is receipt" + 35s of silence → bot replies with the announced-content liveness fallback.
- Test scenario: "here are receipts" + image1 + 5s + image2 + 5s + image3 → exactly one bot reply, all three images included.
- Cumulative latency from first inbound to bot reply ≤ `CEILING_S + ANNOUNCED_EXTENSION_S` (60s default) at p99.

**Risks**
- *FP from FORWARD_REF on completed sentences*: the terminal-punctuation guard from Piece 2 is the mitigation; track FP rate via labeled production samples.
- *Silent image-delivery failures*: liveness fallback covers this. If image delivery fails entirely (carrier issue), user retries the burst.
- *Multi-image bursts where one image fails*: bot processes the partial set after silence; user sees a partial reply. Acceptable; user can resend the missing one.

**Effort.** ~2 dev-days.

---

> **v1 cutoff at end of Piece 4.** ~10 dev-days; closes the announced-content scenario. Stop here if budget is constrained; ship to a small cohort, gather production data, then proceed with quality layers.

---

### Piece 5 — Intent-edit handling (E10)

**Scope.** When a user sends an edit marker mid-buffer ("actually scratch that, I meant the Tuesday one"), classify the edit kind (add / cancel / replace) and mutate the buffer accordingly. Superseded content kept in audit, never sent to the action LLM.

**Deliverables**
- `classify_intent_edit` tool definition per spec — output `{edit_kind, confidence, superseded_content_summary}`.
- Routing in Piece 2's pattern dispatcher: when EDIT_MARKERS matches in `buffering` state, invoke L2 with the edit-classifier prompt instead of the default completeness one.
- Handler logic per spec's E10 section: `add` keeps buffer + waits; `cancel` clears buffer + sends brief ack; `replace` marks prior superseded + treats edit as fresh content.
- New buffer fields: `superseded_messages: list` and `mode: INTENT_EDITED` for the audit trail.
- Conservative default: when edit-kind classifier returns confidence < 0.6, treat as `add` (the safer fallback).

**Dependencies.** Pieces 1, 2, 3.

**Acceptance criteria**
- Test scenario: "this is receipt" + 5s + "actually I meant the Tuesday one" → classifier returns `replace`; the bot acts on "Tuesday one" intent, NOT on "this is receipt"; image-wait extension cleared.
- Test scenario: "here's the receipt" + image + 3s + "and one for Wednesday" → classifier returns `add`; bot waits for the second image; processes both images.
- Test scenario: "this is receipt" + 2s + "never mind, ignore that" → classifier returns `cancel`; bot sends brief ack; buffer cleared; no LLM action call fires.
- Superseded content appears in the audit trail for every cancel + replace; not in the prompt to the action-deciding LLM.
- Adversarial: 10 rapid edit-markers in a row → no infinite loop, processing eventually completes.

**Risks**
- *Classifier hallucinates `replace` when user just added information*: 0.6 confidence threshold + conservative `add` fallback mitigate. Track add-vs-replace flip rate against labeled samples.
- *Edit invalidates announced-mode but image still in flight*: when classifier returns `replace` or `cancel` in announced mode, drop the mode and the extension. If image arrives later, treat as a new turn (doesn't merge into the cancelled buffer).

**Effort.** ~2 dev-days.

---

### Piece 6 — Eval suite

**Scope.** Lock in regression safety. Three layers: mechanical assertions on every PR, labeled dataset for calibration, adversarial regression tests for E1–E10.

**Deliverables**
- *Mechanical assertions* runnable in CI: no-fragmentation, floor-honored, ceiling-honored, race-safe, buffer-cleanup. Each assertion has a deterministic test case.
- *Labeled dataset* — initial seed of ~100 representative bursts, hand-labeled with expected behavior (turn boundary, classifier expected output, expected flush event). Stored as fixtures alongside code.
- Per-bucket calibration metric: bucket L2 decisions by reported confidence; measure actual completion accuracy per bucket. Target: accuracy ≈ confidence ± 10%.
- Forward-reference precision/recall: labeled inbounds with FORWARD_REF expected/not; assert L1 catches at >90% recall, <5% FP.
- Edit-kind disambiguation precision/recall (per add/cancel/replace).
- *Adversarial regression scenarios* for E1–E10: each becomes a runnable test producing expected behavior on the buffer state machine.

**Dependencies.** Pieces 1–5.

**Acceptance criteria**
- All mechanical assertions pass in CI.
- Calibration metric available as a dashboard; baseline measured.
- E1–E10 each have a regression test.
- Coverage of buffering subsystem ≥90% line coverage.

**Risks**
- *Test brittleness*: tests that depend on actual LLM calls flake; use fixture-based replay (the audit trail is the substrate).
- *Labeled dataset stale*: production traffic patterns drift; refresh quarterly.

**Effort.** ~3 dev-days.

---

### Piece 7 — Drift dashboard + cost reconciliation

**Scope.** Operational visibility. The buffering system has many tunable knobs (FLOOR/CEILING/EXTENSION constants, classifier calibration, lock-wait p99); without dashboards, drift goes silent until a customer-visible failure surfaces it.

**Deliverables**
- *Buffer-flush histogram* by reason (`timeout`, `announced_content_arrived`, `confidence_high`, `ceiling_exceeded`, `explicit_done`, `edit_cancel`) — segmented by user cohort if applicable.
- *L2 classifier confidence-distribution* dashboard with calibration overlay.
- *Lock-wait time p50/p95/p99* alarm; alert if p99 exceeds 5s.
- *Per-decision cost reconciliation*: weekly job sums `output_tokens_billed` from the audit, compares to the vendor invoice. Drift > 10% flags an instrumentation gap.
- *Edit-kind frequency* dashboard (add vs cancel vs replace ratios). Useful both for traffic understanding and for catching classifier degradation.
- *AWAITING_ANNOUNCED_CONTENT timeout-without-image rate* — directly tracks the announced-content failure mode; should be low.

**Dependencies.** Pieces 1–6 (audit-trail data flowing).

**Acceptance criteria**
- All six dashboards render with non-trivial data within one week of v1 deploy.
- Cost reconciliation runs weekly without manual intervention.
- Alerts page on-call (not just Slack) for the lock-wait p99 and the cost-drift triggers.

**Risks**
- *Data-volume on the audit table*: at 10k inbounds/day with full audit, the table grows ~3M rows/year. Plan retention (90 days hot, archive older) before this becomes a problem.
- *False alarms* on classifier confidence drift after benign model upgrades: pin model version in alert filter; require sustained drift over multiple days.

**Effort.** ~2 dev-days.

---

## Definition of done (cluster-level)

- All 7 pieces deployed to production behind the `sms_message_buffering` flag, flag rolled to 100% over a one-week ramp.
- Mechanical eval assertions pass in CI on `main`.
- Buffer-flush histogram and calibration dashboard live and reviewed at the next operational review.
- One labeled production-traffic sample (≥100 cases, hand-reviewed) confirms classifier calibration within ±10% of confidence at every bucket.
- The success criteria from [sms-message-buffering-spec](sms-message-buffering-spec.md) hold:
  - Zero "What receipt?"-class replies on text-then-image bursts.
  - Multi-image bursts processed as one coherent turn.
  - Intent edits processed correctly per their kind.
  - Bot reply latency under hard ceiling at p99.
  - Classifier calibration accuracy within ±10% of confidence at every bucket.

## Test rollout

The recommended cohort sequence for v1 (Pieces 1–4):

1. **Internal test cohort** (1 week): team members + opt-in alpha users. Look for fragmentation regressions and announced-content-failure-mode disappearance.
2. **5% production traffic** (1 week): broad sample. Watch buffer-flush histogram for distribution shape (most flushes should be `timeout` or `confidence_high`; high `ceiling_exceeded` rate signals classifier under-confidence).
3. **25%** (3 days), **50%** (3 days), **100%** (after green metrics).

Items 5–7 ship continuously after v1 lands at 100%.

## What lives outside this plan

Per [sms-message-buffering-spec](sms-message-buffering-spec.md)'s out-of-scope section:

- **Out-of-order carrier delivery, message dedup, bot-mid-tool-call** — three real edge cases not addressed. Revisit if production traffic surfaces them.
- **Multi-locale L1 regex** — English-first; per-locale follow-up.
- **Streaming responses while buffering** — applies to rich chat, not SMS.
- **Empirical tuning of FLOOR/CEILING/EXTENSION constants** — first 30 days of production data should drive a tuning pass before declaring v1 done.

## Cross-links

- [sms-message-buffering-spec](sms-message-buffering-spec.md) — the design this plan implements.
- [sms-state-machine](../concepts/sms-state-machine.md) — the existing state machine Piece 1 extends.
- [forced-tool-call-output](../concepts/forced-tool-call-output.md) — Piece 3 and Piece 5 both use this discipline.
- [decision-audit-trail](../concepts/decision-audit-trail.md) — the substrate Piece 3, 5, 6, 7 all depend on.
- [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md) — the framing for why Piece 6's calibration tracking matters.
