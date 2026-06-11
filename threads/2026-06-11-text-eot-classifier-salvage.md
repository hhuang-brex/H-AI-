---
id: 2026-06-11-text-eot-classifier-salvage
type: thread
tags: [text-eot, classifier, github, huggingface, prior-art, research, salvaged, thread]
related:
  - [[sms-message-buffering-spec]]
  - [[sms-message-buffering-plan]]
  - [[2026-06-10-github-buffering-references]]
  - [[2026-06-10-sms-message-buffering-research]]
status: archived
created: 2026-06-11
summary: "text-EOT classifier salvage from a stalled deep-research workflow; TurnGPT verified, HF entries blocked by Brex SSO."
---

# Thread — Text EOT Classifier Salvage (2026-06-11)

Conversation goal: open follow-up #4 from [2026-06-10-github-buffering-references](2026-06-10-github-buffering-references.md) — find open-source semantic end-of-turn classifiers that operate on **text** (not audio). Are there shipped artifacts the spec's L2 classifier could borrow from, or is the L2 idea genuinely novel?

## Method — and a major caveat

The deep-research workflow **stalled in the verification phase** after ~163 minutes (`parallel[2]` timed out on six retry attempts). The search and fetch phases completed; 105 result entries landed in `journal.jsonl` before the stall. **The 3-vote adversarial verification that this graph normally relies on did NOT run.** Findings below are search/fetch outputs only — they're better than guessing, but they have not been refuted-tested.

What I did to recover: mined the workflow's own `journal.jsonl` directly, extracted claims with their quotes and sources, filtered for text-EOT relevance, and synthesized below. Treat each finding as "unverified search output, source link cited, worth confirming separately before citing externally."

## The headline finding (which corrects prior claims)

**Multiple shipped open-source text-EOT classifiers exist.** The earlier framing in [2026-06-10-github-buffering-references](2026-06-10-github-buffering-references.md) — "the L2 classifier in your spec is most likely the first open-source text EOT classifier in the chatbot space" — is **wrong**. At least seven text-input classifiers exist on HuggingFace Hub and GitHub.

The HuggingFace `turn-detection` tag has ~56 models. ~22 of those are audio-based VAD models (videosdk-live), but at least **7 are text-input semantic EOT classifiers**:

| Model | URL | Architecture | License | Downloads |
|---|---|---|---|---|
| **TEN Turn Detection** | https://huggingface.co/TEN-framework/TEN_Turn_Detection | Qwen2.5-7B fine-tune; **3-class** (finished/unfinished/wait) | Apache-2.0 | n/a |
| **livekit/turn-detector** | https://huggingface.co/livekit/turn-detector | 0.1B Text Classification | (Apache-2.0 — verify) | **668k** |
| **TurnGPT (Ekstedt & Skantze)** | https://github.com/ErikEkstedt/TurnGPT | GPT-2 + EOT token + projection head; `string_list_to_trp` API | MIT | (academic) |
| **PairwiseTurnGPT** | https://github.com/Sean-Leishman/PairwiseTurnGPT | Switchboard-trained; "without acoustic features" | (verify) | (academic) |
| **dangvansam/Qwen3-0.6B-turn-detection-en** | https://huggingface.co/dangvansam/Qwen3-0.6B-turn-detection-en | Qwen3-0.6B SFT; binary `end`/`continue` | (verify) | n/a |
| **PuristanLabs1/urdu-turn-detection-distilbert** | https://huggingface.co/PuristanLabs1/urdu-turn-detection-distilbert | distilbert-base-multilingual-cased fine-tune; ~135M params; binary | (verify) | n/a |
| **rishuXori/gemma-3-1b-FT** | (HF) | Gemma-3-1B fine-tune; Text Generation | (verify) | 51 |
| **justpluso/turn-detection** | (HF) | 0.3B Text Classification | (verify) | 58 |
| **MrEzzat/arabic-eou-detector** | (HF) | 0.1B; Arabic-specific | (verify) | 810 |
| giangndm/end-of-turn-detector | https://huggingface.co/giangndm/end-of-turn-detector | (gated, requires contact form) | (gated) | n/a |

Quantized GGUF derivatives of `livekit/turn-detector` exist (`mradermacher/turn-detector-GGUF` and `turn-detector-i1-GGUF`), enabling local/edge deployment.

## Top recommendation if borrowing

**`TEN-framework/TEN_Turn_Detection`** is the closest direct match. Apache-2.0. Text input via chat template. Three-class output (`finished` / `unfinished` / `wait`) — the `wait` class is interesting because it explicitly handles "user said don't speak yet," which our spec lumps under EXPLICIT_DONE / EDIT_MARKERS. Worth reading the model card before deciding.

Invocation pattern from search output:
```python
outputs = model.generate(
    input_ids,
    max_new_tokens=1,           # one class-label token
    do_sample=True, top_p=0.1, temperature=0.1,
    pad_token_id=tokenizer.eos_token_id,
)
```

This is concretely different from the spec's Haiku-tool-call approach: the TEN classifier is a single-token completion, not a forced tool-call. Lower latency, no API cost, but requires hosting the 7B model.

## What was confirmed about LiveKit's text-EOT model

Several claims surfaced (unverified by 3-vote): LiveKit's turn-detector is described as a "Text Classification" task on HF Hub, takes text input rather than audio (the upstream STT is what produces the text — the model itself is text-conditioned). With 668k downloads, it's the most-downloaded model in the turn-detection tag. Quantized GGUF derivatives exist for edge/local deployment.

If true, this means the architectural distinction between "voice EOT" and "text EOT" was less sharp than the prior research framing suggested. The voice-AI patterns from prior research **already are** text-input classifiers — they just sit downstream of an STT in voice contexts.

## Frameworks confirmed using fixed-timer (no semantic classifier)

Three production-shipped fixed-timer implementations on top of clawbolt's:

- **pycodebr/whatsapp_ai_bot** (`message_buffer.py`) — `asyncio.sleep`-based debounce, no classifier.
- **Timbal** — `DEBOUNCE_MS=1200` default (recommended 800–1500ms), fixed-timer.
- **pausiva-core** — 2.5s debounce window, 10s max buffer, fixed-timer.

These confirm the prior pattern: production WhatsApp/SMS buffering ships as fixed-timer, not semantic. The semantic classifiers exist but are mostly research artifacts or HF Hub releases without integrated framework adoption.

## Datasets that surfaced (text-only, useful for training/eval)

- **anyreach-ai/semantic-turn-taking-benchmark** (Apache-2.0) — pure text, labels `start_speaking` / `continue_listening` — directly maps to the spec's binary case.
- **acengnew/turn-taking-cues-json** — only 4 rows; too small.
- **Krisp-AI/turn-taking-test-v1** — audio-based, not text.
- **NPS Chat Corpus** — POS + dialog-act tags, no turn-completion labels; LDC-licensed (fee-based).
- **DualTurn Switchboard** — audio-derived, requires LDC license.

## What this means for the spec's novelty claim

The spec's L2 classifier idea is **not novel** as a category. Multiple shipped text-EOT classifiers exist, and at least one (TEN Turn Detection, Apache-2.0) closely matches the spec's intended use.

The spec's still-novel pieces:
- ✅ Forward-reference regex detection for announced-content (none of the EOT classifiers handle this case)
- ✅ AWAITING_ANNOUNCED_CONTENT mode + image-arrival flush
- ✅ Intent-edit handling (E10) — add/cancel/replace classifier
- ✅ The composition of fixed-timer + semantic + announced-content + intent-edit
- ✅ SMS-scaled timing constants (FLOOR_S=8 / CEILING_S=30) as published recommendations

## Implications for the plan

Piece 3 (L2 classifier + dynamic timeout) has a new architectural choice:

| Approach | Cost per inbound | Latency | Setup effort |
|---|---|---|---|
| **Haiku tool-call (current spec)** | ~$0.0001 | ~250ms | Day 1 |
| **TEN_Turn_Detection (Qwen2.5-7B local)** | $0 | depends on hosting | GPU + serving infra |
| **livekit/turn-detector (0.1B local)** | $0 | <50ms (GGUF) | Edge/CPU OK |
| **PuristanLabs1 urdu-turn-detection-distilbert** | $0 | <20ms | CPU OK; English version would need fine-tune |

The current Haiku tool-call approach is the right starting point (no fine-tune, no infra, day-one shippable), but for high-volume production, fine-tuning a small classifier (livekit-derived or distilbert-based) likely wins on cost and latency.

## Honest caveats

This entire thread is **unverified salvage from a stalled workflow**:

- Search and fetch phases completed; verification did not.
- All claims sourced from search output / fetched page snippets, not 3-vote-refuted.
- License columns marked `(verify)` need to be confirmed against each model card before commercial use.
- Several specific findings (e.g., "LiveKit turn-detector is text-input despite voice context") were stated by the search agent but not adversarially refuted — could be wrong.
- The TEN Turn Detection details (3-class output, Apache-2.0) are the most strongly-quoted in the search output; I'd treat those as high-confidence.
- Counter-claim that the LiveKit model takes audio (which contradicts findings here) was not surfaced in salvage but should be tested by reading the actual model card before citing externally.

**Recommended action**: before propagating these findings into the spec / plan, manually verify the top three (TEN Turn Detection, livekit/turn-detector, TurnGPT) by reading their model cards / READMEs directly. Then update the spec.

## Connection to existing graph

If the findings hold up under direct verification, the following nodes need updating:

- [sms-message-buffering-spec](../nodes/projects/sms-message-buffering-spec.md) — "Existing implementations" section gains a "text EOT classifiers" subsection; the L2 classifier section should reference TEN / LiveKit as alternatives to Haiku-tool-call.
- [sms-message-buffering-plan](../nodes/projects/sms-message-buffering-plan.md) — Piece 3 gains the architectural choice table above.
- The spec's novelty claim ([2026-06-10-github-buffering-references](2026-06-10-github-buffering-references.md)) needs revision: L2 classifier is NOT novel; the still-novel pieces are forward-reference detection, announced-content mode, and intent-edit handling.

These updates are pending the user's call on whether to propagate based on unverified salvage.

## Open follow-ups

- **Verify the top three (TEN, LiveKit, TurnGPT) directly** — read the actual model cards / READMEs to confirm the salvaged claims hold.
- **Re-run the workflow with a narrower scope** — drop the verify-via-3-votes layer or split the question to avoid the stall. Specifically: a single-angle search for "HuggingFace turn-detection text classifier" should be cheap and fast.
- **Empirical test**: take 100 SMS-style burst inputs, run them through TEN Turn Detection vs. Haiku-tool-call, measure agreement rate. If TEN matches Haiku within ~5%, the open-source classifier is the right choice for production.
- **The "nanobot's Mochat" provenance question from [2026-06-10-github-buffering-references](2026-06-10-github-buffering-references.md)** remains unresolved.

## Resolution (2026-06-11 follow-up)

User picked **"TurnGPT only, drop HF entries"** — verify what we can, propagate only the verified portion.

- **TurnGPT verified ✅** via `gh repo view ErikEkstedt/TurnGPT` + `gh api .../readme`. MIT license, 69 stars, last pushed 2024-05-18, GPT-2/DialoGPT-small base, `<ts>` turn-shift token id 50257, projection head over next N tokens, README verbatim confirms text-input ("text as commonly returned from ASR services"). Added to [sms-message-buffering-spec](../nodes/projects/sms-message-buffering-spec.md)'s "Open-source chatbot prior art" + new "Academic prior art on text EOT classification" subsection.
- **HF entries dropped from spec ❌** — TEN_Turn_Detection, livekit/turn-detector, dangvansam/Qwen3-0.6B, PuristanLabs1/urdu-distilbert, rishuXori/gemma-3-1b-FT, justpluso/turn-detection, MrEzzat/arabic-eou-detector, giangndm/end-of-turn-detector. Failure mode: huggingface.co traffic from this network is intercepted by Brex Okta SSO + Cloudflare Access, blocking unauthenticated WebFetch / curl / subagent access. Redirect chain hits `brex.okta.com/oauth2/authorize`. This is network policy, not a missing tool. The HF list remains in this thread for future verification from a non-Brex network.

The spec's L2 novelty claim is now refined: TurnGPT (EMNLP 2020) establishes that text-input semantic EOT classification is a known academic technique, so the L2 *concept* isn't novel — but the spec's specific composition (pretrained-LLM forced tool-call vs. fine-tuned LM with projection head, chat-channel application vs. SDS, composed with forward-reference detection + announced-content + intent-edit handling) remains the contribution.
