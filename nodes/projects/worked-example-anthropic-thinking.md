---
id: worked-example-anthropic-thinking
type: project
kind: worked-example
tags: [worked-example, anthropic, code, thinking, observability]
related:
  - [[cot-as-forensic-artifact]]
  - [[llm-observability]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[decision-audit-trail]]
  - [[forced-tool-call-output]]
status: living
created: 2026-06-10
summary: "Python code: capturing reasoning, signature continuity, forced-tool-call constraint, hidden billing."
---

# Worked Example — Reading Reasoning from Anthropic Models

Concrete Python code for capturing reasoning, preserving multi-turn continuity, handling the forced-tool-call constraint, and reading hidden-billing tokens on Anthropic models. The why-it-matters framing comes from [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md); the workflow shape comes from [llm-observability](../concepts/llm-observability.md).

Uses `claude-opus-4-8` as the canonical example (adaptive-only). Sonnet 4.6 supports both modes; the code below uses adaptive throughout.

## 1. Basic adaptive thinking — read the reasoning summary

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},  # max | xhigh | high | medium | low
    messages=[
        {"role": "user", "content": "Walk me through how to debug an SMS leak."}
    ],
)

# response.content is a list of blocks: thinking first, text after.
for block in response.content:
    if block.type == "thinking":
        # IMPORTANT: on Claude 4 / Fable 5 / Mythos 5 this is a SUMMARY
        # produced by a separate summarizer model. Raw thinking is sales-gated.
        print("[reasoning summary]")
        print(block.thinking)
        print(f"[signature, opaque, preserve byte-exact]: "
              f"{block.signature[:80]}...")
    elif block.type == "text":
        print("[user-facing answer]")
        print(block.text)
```

**Why this matters**: per [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md), faithfulness is ~25% — the summary is best-effort signal, not ground truth. But it's the only contemporaneous artifact that surfaces alignment-faking, scheming, and acknowledged-then-violated ethics that I/O monitoring misses.

## 2. Multi-turn — preserve thinking blocks unchanged

The footgun: pass `response.content` (the full list) back as the assistant message — not just `block.text`. Strip the thinking blocks and reasoning continuity is lost on the next turn.

```python
messages = [
    {"role": "user", "content": "Walk me through how to debug an SMS leak."},
    # Pass the ENTIRE content list, including thinking blocks with signatures.
    {"role": "assistant", "content": response.content},
    {"role": "user", "content": "What's the most common root cause?"},
]

response2 = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    messages=messages,
)
```

## 3. `display: "omitted"` — when you don't want to render reasoning

Use when the surface is a deployed product and you don't want users (or your renderer) to see the reasoning summary. Thinking blocks come back with empty content, but the `signature` is preserved for multi-turn continuity.

```python
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=64000,
    thinking={"type": "adaptive", "display": "omitted"},
    messages=[{"role": "user", "content": "Classify this transaction: ..."}],
)

for block in response.content:
    if block.type == "thinking":
        # block.thinking is empty (omitted)
        # block.signature is the opaque encrypted reasoning — round-trip only
        print("thinking content:", repr(block.thinking))   # ''
        print("signature length:", len(block.signature))   # ~hundreds of bytes
    elif block.type == "text":
        print(block.text)
```

**Critical caveat**: `display: "omitted"` does **not** reduce cost. From Anthropic's docs: *"You're still charged for the full thinking tokens. Omitting reduces latency, not cost."*

## 4. The forced-tool-choice incompatibility

```python
# THIS RETURNS 400
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    tools=[{"name": "classify", "description": "...", "input_schema": {...}}],
    tool_choice={"type": "any"},   # ← incompatible with extended/adaptive thinking
    messages=[...],
)

# OK — only "auto" or "none" works
response = client.messages.create(
    ...
    tool_choice={"type": "auto"},
    ...
)
```

If your design needs both reasoning **and** forced tool-call output, split into a two-pass design: reasoning pass with `auto`, then a separate rendering pass with forced tool-call and no thinking. See [forced-tool-call-output](../concepts/forced-tool-call-output.md).

## 5. Read the hidden-billing tokens

```python
print(f"input tokens:           {response.usage.input_tokens}")
print(f"output tokens (billed): {response.usage.output_tokens}")
# `output_tokens` includes thinking tokens you DON'T see in content.
# A dashboard counting visible content under-attributes spend by 2–10×.

print(f"cache read tokens:    {response.usage.cache_read_input_tokens}")
print(f"cache create tokens:  {response.usage.cache_creation_input_tokens}")
```

This is the most under-instrumented metric. Token-budget assertions in eval should always read `response.usage`, never count from rendered content.

## 6. Older extended-thinking syntax (Sonnet 4.6, deprecated)

Works on Sonnet 4.6 / older models, but **returns 400 on Opus 4.7/4.8**:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[...],
)
```

Migration is mechanical: drop `budget_tokens`, switch to `thinking={"type": "adaptive"}`, control depth via `output_config={"effort": "..."}`.

## 7. End-to-end pattern with audit logging

The minimum-viable instrumentation that survives the forensic-not-explanatory framing — the reasoning summary is captured, the signature preserves continuity for replay, the usage object captures hidden billing.

```python
import json
from datetime import datetime
import anthropic

client = anthropic.Anthropic()

def call_with_audit(messages, decision_id):
    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=64000,
        thinking={"type": "adaptive", "display": "summarized"},
        output_config={"effort": "high"},
        messages=messages,
    )

    # Extract for audit (see decision-audit-trail node)
    thinking_blocks = [
        {"summary": b.thinking, "signature": b.signature}
        for b in response.content if b.type == "thinking"
    ]
    text = "".join(b.text for b in response.content if b.type == "text")

    audit_row = {
        "decision_id": decision_id,
        "timestamp": datetime.utcnow().isoformat(),
        "model_version": response.model,
        "stop_reason": response.stop_reason,
        "stop_details_category": getattr(response.stop_reason, "category", None),

        # Forensic substrate (cot-as-forensic-artifact)
        "reasoning_summary": json.dumps([b["summary"] for b in thinking_blocks]),
        "reasoning_continuity_payload": json.dumps([b["signature"] for b in thinking_blocks]),

        # User-facing artifact
        "content_text": text,

        # Hidden-billing instrumentation (cost-aware-eval)
        "input_tokens": response.usage.input_tokens,
        "output_tokens_billed": response.usage.output_tokens,
        "cache_read_tokens": response.usage.cache_read_input_tokens,
        "cache_create_tokens": response.usage.cache_creation_input_tokens,
    }
    # Persist audit_row to your store
    return response.content, audit_row
```

This is what "I can answer 'why did the model respond that way?' three months from now" looks like in code.

## Eval

- **No-leakage assertion**: reasoning summary should never appear in user-facing rendered output. Mechanical check on the audit row.
- **Continuity preservation**: round-trip multi-turn where the signature is preserved produces consistent model behavior under replay; stripping the signature should regress.
- **Cost reconciliation**: sum `output_tokens_billed` across decisions; compare to invoice. Drift means an instrumentation gap.

## See also

- [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md) — why this code earns its keep.
- [llm-observability](../concepts/llm-observability.md) — the broader workflow this code implements.
- [native-thinking-vs-prompted-reasoning](../concepts/native-thinking-vs-prompted-reasoning.md) — what each block actually contains in 2026.
- [decision-audit-trail](../concepts/decision-audit-trail.md) — the schema this audit_row populates.
- [forced-tool-call-output](../concepts/forced-tool-call-output.md) — the constraint section 4 documents.
- [worked-example-openai-responses](worked-example-openai-responses.md) — the parallel walkthrough for OpenAI.
