---
id: worked-example-openai-responses
type: project
kind: worked-example
tags: [worked-example, openai, code, reasoning, observability]
related:
  - [[cot-as-forensic-artifact]]
  - [[llm-observability]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[decision-audit-trail]]
  - [[worked-example-anthropic-thinking]]
status: living
created: 2026-06-10
---

# Worked Example — Reading Reasoning from OpenAI Models

Concrete Python code for capturing reasoning, preserving multi-turn continuity (server-stateful and stateless), handling `incomplete` responses, and reading hidden-billing tokens on OpenAI Responses API. The why-it-matters framing comes from [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md); the workflow shape comes from [llm-observability](../concepts/llm-observability.md).

Uses GPT-5 as the canonical example. Same shape works on the o-series.

## Three things to know going in

- **Raw reasoning tokens are not exposed** — only opt-in summaries (`reasoning.summary = auto/concise/detailed`). Per OpenAI: *"we don't expose the raw reasoning tokens emitted by the model."*
- **Multi-turn has two paths**: server-stateful (`previous_response_id`) or stateless (round-trip an opaque encrypted blob via `include: ["reasoning.encrypted_content"]`).
- **Reasoning tokens count against `max_output_tokens`** and can produce paid-but-empty responses (`status: "incomplete"`). Reserve ≥25k tokens.

## 1. Basic Responses API — read the reasoning summary

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    input="Walk me through how to debug an SMS leak.",
    reasoning={
        "effort": "high",         # minimal | low | medium | high
        "summary": "detailed",    # auto | concise | detailed
    },
)

# response.output is a list of items: reasoning items + message items.
for item in response.output:
    if item.type == "reasoning":
        # IMPORTANT: this is a SUMMARY, not raw reasoning tokens.
        for part in item.summary:
            print(f"[reasoning summary, {part.type}]")
            print(part.text)
    elif item.type == "message":
        for content in item.content:
            if content.type == "output_text":
                print("[user-facing answer]")
                print(content.text)
```

**Why this matters**: same forensic-not-explanatory caveat as Anthropic ([cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md)). The OpenAI summary is even further abstracted — you don't see raw reasoning at all, only the model's derived summary of it. Treat it as best-effort signal.

## 2. Multi-turn — server-stateful (preferred default)

The simplest correct pattern. The server preserves all prior items (reasoning, function calls, function-call outputs) for you; you just point at the prior response by ID.

```python
# Turn 1
response = client.responses.create(
    model="gpt-5",
    input="Walk me through how to debug an SMS leak.",
    reasoning={"effort": "high", "summary": "detailed"},
)

# Turn 2 — reasoning continuity preserved server-side
response2 = client.responses.create(
    model="gpt-5",
    input="What's the most common root cause?",
    previous_response_id=response.id,
    reasoning={"effort": "high", "summary": "detailed"},
)
```

**Footgun**: `store=False` (zero-data-retention deployments) disables `previous_response_id`. For ZDR, you must do the stateless round-trip below.

## 3. Multi-turn — stateless (ZDR / `store=False`)

Pass the opaque encrypted-content blob explicitly. Per docs: *"Add `reasoning.encrypted_content` to the include array on each request."* Content is opaque — round-trip only, not human-readable.

```python
# Turn 1 — request the encrypted blob in the response
response = client.responses.create(
    model="gpt-5",
    input=[{"role": "user", "content": "Walk me through how to debug an SMS leak."}],
    store=False,
    include=["reasoning.encrypted_content"],
    reasoning={"effort": "high"},
)

# Turn 2 — pass back ALL items between the last user message and our next user message.
# Critically: every reasoning item, every function_call item, every function_call_output
# item between them. Drop one and reasoning ordering corrupts.
input_items = list(response.output) + [
    {"role": "user", "content": "What's the most common root cause?"}
]

response2 = client.responses.create(
    model="gpt-5",
    input=input_items,
    store=False,
    include=["reasoning.encrypted_content"],
    reasoning={"effort": "high"},
)
```

In your audit trail (see [decision-audit-trail](../concepts/decision-audit-trail.md)), the encrypted_content goes in the `reasoning_continuity_payload` column — preserve byte-exact, never display.

## 4. Read the hidden-billing tokens

```python
print(f"input tokens:                {response.usage.input_tokens}")
print(f"output tokens (billed):      {response.usage.output_tokens}")
print(f"  ↳ reasoning tokens:        "
      f"{response.usage.output_tokens_details.reasoning_tokens}")
print(f"  ↳ visible output (delta):  "
      f"{response.usage.output_tokens - response.usage.output_tokens_details.reasoning_tokens}")
```

OpenAI breaks reasoning out into `output_tokens_details.reasoning_tokens` — so you can tell exactly how much you paid for invisible reasoning. Cost dashboards built from rendered content under-attribute by 2–10×. Always read `response.usage`.

## 5. Handle `status: "incomplete"` — the paid-but-empty case

You can pay for input + reasoning and get nothing back if reasoning blows the output budget.

```python
response = client.responses.create(
    model="gpt-5",
    input="...",
    reasoning={"effort": "high"},
    max_output_tokens=8000,   # ← too low; reasoning will eat this
)

if response.status == "incomplete":
    if response.incomplete_details and response.incomplete_details.reason == "max_output_tokens":
        # Paid for input + reasoning. No visible answer.
        # Two recovery options:
        # (a) retry with higher max_output_tokens (≥25k recommended for hard tasks)
        # (b) lower reasoning.effort
        print(f"Incomplete: reasoning consumed budget. "
              f"Reasoning tokens used: "
              f"{response.usage.output_tokens_details.reasoning_tokens}")
```

OpenAI's own recommendation: reserve ≥25,000 tokens for reasoning + visible output on hard tasks. The bound is real — not a soft guideline.

## 6. `reasoning.effort = "minimal"` + prompted CoT summary

The one place OpenAI still recommends prompted reasoning, with a specific shape — at minimal reasoning effort the model has fewer reasoning tokens for internal planning, so a prompted summary at the start of the answer measurably improves quality.

```python
response = client.responses.create(
    model="gpt-5",
    input=[{"role": "user", "content": (
        "Classify this transaction as memo-required: $48 Salesforce on May 21.\n\n"
        "Begin your answer with a brief bulleted summary of your reasoning, "
        "then provide the classification."
    )}],
    reasoning={"effort": "minimal"},
)
```

This is the **exception** to the broader "avoid CoT prompts on reasoning models" rule from [native-thinking-vs-prompted-reasoning](../concepts/native-thinking-vs-prompted-reasoning.md).

## 7. End-to-end pattern with audit logging

```python
import json
from datetime import datetime
from openai import OpenAI

client = OpenAI()

def call_with_audit(input_items, decision_id, *, store=True, previous_response_id=None):
    request_kwargs = {
        "model": "gpt-5",
        "input": input_items,
        "reasoning": {"effort": "high", "summary": "detailed"},
        "max_output_tokens": 32000,    # reserve enough for reasoning + output
        "store": store,
    }
    if previous_response_id and store:
        request_kwargs["previous_response_id"] = previous_response_id
    if not store:
        request_kwargs["include"] = ["reasoning.encrypted_content"]

    response = client.responses.create(**request_kwargs)

    # Separate reasoning summaries from user-facing content for audit
    reasoning_summaries = []
    for item in response.output:
        if item.type == "reasoning":
            reasoning_summaries.append({
                "id": item.id,
                "summary": [p.text for p in (item.summary or [])],
                # encrypted_content is on the item only when included; opaque
                "encrypted_content": getattr(item, "encrypted_content", None),
            })

    text = "".join(
        c.text
        for it in response.output if it.type == "message"
        for c in it.content if c.type == "output_text"
    )

    audit_row = {
        "decision_id": decision_id,
        "timestamp": datetime.utcnow().isoformat(),
        "model_version": response.model,
        "response_id": response.id,
        "previous_response_id": previous_response_id,
        "status": response.status,
        "incomplete_reason": (
            response.incomplete_details.reason if response.incomplete_details else None
        ),

        # Forensic substrate (cot-as-forensic-artifact)
        "reasoning_summary": json.dumps([s["summary"] for s in reasoning_summaries]),
        "reasoning_continuity_payload": json.dumps([
            s["encrypted_content"] for s in reasoning_summaries
        ]),

        # User-facing artifact
        "content_text": text,

        # Hidden-billing instrumentation (cost-aware-eval)
        "input_tokens": response.usage.input_tokens,
        "output_tokens_billed": response.usage.output_tokens,
        "reasoning_tokens": response.usage.output_tokens_details.reasoning_tokens,

        # Full output items, opaque, for replay correlation
        "output_items_raw": json.dumps([item.model_dump() for item in response.output]),
    }

    return response, audit_row
```

The `output_items_raw` field is the OpenAI equivalent of preserving Anthropic's full `content` list — you need it intact for `previous_response_id`-less continuation, replay investigation, and any drift analysis later.

## Anthropic ↔ OpenAI cheat-sheet

| Concept | Anthropic | OpenAI Responses API |
|---|---|---|
| API call | `client.messages.create` | `client.responses.create` |
| Modern reasoning toggle | `thinking={"type": "adaptive"}` | `reasoning={"effort": "high"}` |
| What you read for reasoning | `block.thinking` (where `block.type == "thinking"`) | `item.summary[*].text` (where `item.type == "reasoning"`) |
| Multi-turn (default) | Pass `response.content` back as assistant message | `previous_response_id` (server-stateful) |
| Multi-turn (stateless) | Pass thinking blocks back unchanged with their `signature` | `include=["reasoning.encrypted_content"]` + manual round-trip of all items |
| Suppress rendering, keep continuity | `display: "omitted"` (signature still present) | Don't render `reasoning` items in your UI; they're separable |
| Hidden-billing field | `response.usage.output_tokens` (incl. thinking) | `response.usage.output_tokens_details.reasoning_tokens` (broken out) |
| Forced tool-call + thinking | **400** on `tool_choice: "any"` or named tool | No equivalent constraint documented; check current docs |
| Empty-paid response signal | (n/a — generally returns content) | `status == "incomplete"` + `incomplete_details.reason == "max_output_tokens"` |

## See also

- [cot-as-forensic-artifact](../concepts/cot-as-forensic-artifact.md) — why this code earns its keep.
- [llm-observability](../concepts/llm-observability.md) — the broader workflow this code implements.
- [native-thinking-vs-prompted-reasoning](../concepts/native-thinking-vs-prompted-reasoning.md) — what each item actually contains in 2026.
- [decision-audit-trail](../concepts/decision-audit-trail.md) — the schema the audit_row populates.
- [worked-example-anthropic-thinking](worked-example-anthropic-thinking.md) — the parallel walkthrough for Anthropic.
