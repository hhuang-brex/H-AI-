---
id: domain-knowledge-injection
type: concept
tags: [chatbot, conversation-design, rag, knowledge, context, fine-tuning]
related:
  - [[domain-chatbot-design]]
  - [[grounding-and-citation]]
  - [[conversation-memory]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-08
---

# Domain Knowledge Injection

How domain knowledge enters the prompt. Not a single technique — four mechanisms with different cost / freshness / accuracy / reach trade-offs, used in combination.

## The four mechanisms

| Mechanism | Refresh latency | Cost per request | Reach | Best for |
|---|---|---|---|---|
| **System prompt / catalog** | Deploy time | Token cost only | Small, every call | Stable rules, persona, tool list |
| **Retrieval (RAG)** | Index update | Retrieval + token cost | Large corpus, scoped per call | Documents, policies, FAQs, large knowledge bases |
| **Structured state injection** | Real-time | Token cost only | Specific to user/account | Account state, balances, preferences, current values |
| **Fine-tuning / continued pretraining** | Training cycle | Training + slightly cheaper inference | Implicit, baked-in | Style, vocabulary, taxonomy familiarity |

Most production domain bots use **all four** together. The skill is choosing per knowledge-type.

## Decision per knowledge type

- **Company policies** → RAG with version-pinned index. Updates are real; copy-paste into system prompt grows unbounded.
- **User account state (balances, plan, status)** → Structured injection at request time. RAG would be wrong (semantically searching for the user's balance is silly).
- **Domain vocabulary, common abbreviations, formatting conventions** → System prompt or fine-tune. Stable, small, every call.
- **Long-tail facts the model could reasonably know** → Parametric memory + grounding check. Don't pay retrieval cost on every "what's APR?" — but verify before quoting numbers.
- **Tool list and capabilities** → System prompt / catalog. Tied to [golden-snapshot-eval](golden-snapshot-eval.md) for drift control.

## Anti-patterns

- **System prompt as a knowledge dump.** Every request pays the token cost; updates require deploys. RAG exists for this reason.
- **RAG for everything.** Retrieval has latency and miss rate; using it for "what's the user's name" when it's in the request payload is wasteful and risks miss.
- **Fine-tune to fix wrong facts.** Fine-tuning is for style and behavior, not for factual updates. Facts move; weights don't.
- **No version pinning.** Index changes silently; eval cases pass on stale data; production answers from new data; gap goes undetected.

## Cost dimension

Knowledge injection is where token budgets blow up. Every retrieved chunk, every line of system prompt, every structured state field is paid on every request × every user × every turn. See [cost-aware-eval](cost-aware-eval.md).

A useful audit: snapshot the actual prompt for a representative production call. Look at what's in there. Most teams find 30-50% of tokens are knowledge that's stale, redundant, or never referenced by the model.

## Eval

- **Retrieval recall** — for labeled questions, assert the right passage is in top-K.
- **Faithfulness** — covered in [grounding-and-citation](grounding-and-citation.md), but tied here because the eval depends on retrieval being right.
- **State injection correctness** — assert the right user/account state is in the prompt for each request type.
- **Token-budget snapshot** — assert system prompt + injected context stays under a budget.

## See also

- [grounding-and-citation](grounding-and-citation.md) — the consumer of injected knowledge; why it must be cited.
- [conversation-memory](conversation-memory.md) — internal counterpart; memory is what the bot remembers, injection is what it's told.
- [cost-aware-eval](cost-aware-eval.md) — the ceiling on how much you can inject.
