---
id: memory-poisoning
type: concept
tags: [agent, memory, security, prompt-injection, poisoning, persistence, threat-model, safety, science-excellence]
related:
  - [[agent-memory]]
  - [[action-execution-safety]]
  - [[prompt-injection-and-isolation]]
  - [[prompt-time-knowledge-capture]]
  - [[memory-consolidation-and-forgetting]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[memory-retrieval]]
  - [[action-authority]]
  - [[tool-result-grounding]]
  - [[adversarial-eval]]
  - [[multi-agent-delegation]]
  - [[agent-native-memory-framework]]
status: living
created: 2026-07-12
summary: "the persisted/delayed attack on agent memory — untrusted content is WRITTEN into a durable store in one turn and TRIGGERS a harmful action on a later turn or for a different reader; persistence amplifies blast radius across time/sessions/readers, and self-attested provenance is launderable, so authority must be bound at write time."
---

# Memory Poisoning

[prompt-injection-and-isolation](prompt-injection-and-isolation.md) owns the *live-turn* attack: untrusted text in **this** context steers **this** turn. Memory poisoning is its **stored/delayed sibling**: an attacker plants content that **persists** into the agent's long-term memory / RAG store on one turn, and on a **later** turn, session, or for a **different** user/agent that content is retrieved and steers a harmful reasoning step or action (payment, setting change, exfiltration).

The load-bearing distinction: **the write and the trigger are decoupled in time.** The attacker's turn looks benign and does nothing observable; harm fires later. Both attacks share the root cause the sibling node argues — *data and instructions share one channel* — but poisoning inserts a **persistence step** live injection lacks, and that step is the amplifier. This node doesn't re-derive the injection taxonomy or re-argue *isolation-is-the-boundary*; it owns the **temporal-decoupling** dynamic and the **write-time-authority** defense.

## Persistence is the amplifier (three axes)

- **Across time** — the payload is dormant until a matching trigger query arrives; retrieval **is** the detonation ([memory-retrieval](memory-retrieval.md)).
- **Across sessions** — it survives fresh-context resets, which **defeats the "start a new session to reset the Rule-of-Two count" mitigation**: a poisoned store re-injects itself into the fresh session, so per-session capability scoping doesn't clear it.
- **Across users/agents** — in shared/fleet memory, one write is retrieved by *every* future reader; blast radius scales from one conversation to the whole store's reader population.

## The two established attacks

- **AgentPoison** — [arXiv:2407.12784](https://arxiv.org/abs/2407.12784) (Chen, Xiang, Xiao, Song, Li; Jul 2024). "The first backdoor attack targeting generic and RAG-based LLM agents by poisoning their long-term memory or RAG knowledge base." Constrained trigger-optimization maps triggered instances into a *unique embedding region* so malicious demos are retrieved **only** with the trigger; benign inputs behave normally; **no fine-tuning**. Measured: avg ASR **>80%**, poison rate **<0.1%**, benign impact **<1%**.
- **MINJA** — [arXiv:2503.03704](https://arxiv.org/abs/2503.03704) (Dong, Xu, He, Li, Tang, Liu, Liu, Xiang; 2025). The **query-only / any-user** vector: the attacker has **no write access** — malicious records are injected via normal queries + observed outputs (bridging steps + indication prompt + progressive-shortening), leaving a clean-looking record retrieved for a later *victim's* query. **Any ordinary user** of a shared agent can poison memory read by others.

## What is genuinely new (2026)

- **Provenance is launderable → bind authority at write time.** *Non-Malleable, Origin-Bound Authority with Machine-Checked Guarantees* — [arXiv:2606.24322](https://arxiv.org/abs/2606.24322) (Louck; Jun 2026, cs.CR). Proves both content-based (detection/trust-scoring) **and** lineage-based defenses are *malleable*: an attacker launders an untrusted origin into apparent trust through three channels — **the agent's own summarization, a trusted-tool echo, and manufactured corroboration.** TLA+-checked separation theorem: (T1) no content/lineage defense is sound under laundering; (T2) write-time origin binding is *necessary*; (T3) non-malleable origin-bound authority + Sybil-resistant corroboration-gated elevation is *sufficient*. Prior defenses up to **68% laundering ASR**; their **TMA-NM** construction **0%** at full utility. *Sharpens [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md)'s "tag provenance at write time" — a tag is insufficient unless **non-malleable**.*
- **Memory contagion (non-adversarial spread).** [arXiv:2606.23195](https://arxiv.org/abs/2606.23195) (Liu; Jun 2026): stored **evaluator bias** propagates to future agents reading the same store **even under perfect ("oracle") consolidation** — not a hygiene artifact. Contingent — length-bias propagated on an older model but newer ones were reported immune; authority-bias didn't propagate. Framed "critical but contingent."
- **Fleet / shared-memory failure modes.** *Governed Shared Memory* — [arXiv:2606.24535](https://arxiv.org/abs/2606.24535) (Margalit et al.; Jun 2026): four failure modes (unauthorized leakage, stale propagation, contradiction persistence, provenance collapse) + governance primitives (scoped retrieval, temporal supersession, provenance tracking, policy-governed propagation).

## Consolidation is not provenance-neutral

A persistence-specific twist absent from live injection: **the memory pipeline itself launders origin.** TMA-NM's self-summarization channel means [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md)'s episodic→semantic promotion can strip the *untrusted* tag off poisoned content between write and retrieval, elevating it into a durable, provenance-collapsed semantic fact. Consolidation is thus simultaneously a **partial defense** (salience gates drop low-value poison) **and** a laundering vector — it must *preserve* origin binding, not collapse it.

## Remediation: the gap live injection doesn't have

A fresh session clears live injection; it does **not** clear a poisoned store — poisoning uniquely requires **expungement**. [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) is a **partial** remedy: *invalidate-not-delete* can retroactively close a poisoned fact's valid-time with an audit trail *once detected*, but it reasons over **recency, not provenance** (can't tell a maliciously-crafted "newer" fact from a legit update), doesn't prevent the write, and inherits detection as its weak link. Write-time origin binding acts at the commit boundary *before* the fact enters the store; **no verified source reliably expunges a poisoned item *plus* its consolidation-derived descendants** — an open gap.

## Builder synthesis

1. **Bind provenance/authority at write time**, not as a mutable after-the-fact tag — lineage is launderable.
2. **Gate what untrusted content may become *durable*** — never let untrusted spans write privileged/actionable memory (extends [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md)'s TRUST axis).
3. **Require Sybil-resistant corroboration before elevating** a memory to "actionable," and keep elevation out of the summarizer's reach.
4. **Bound blast radius at trigger time** with least-privilege + confirm-before-act — harm fires in a *future* session ([action-authority](action-authority.md) / [action-execution-safety](../topics/action-execution-safety.md)). Non-malleable *write* authority is the memory analogue of the *action*-authority tier ladder.
5. **Eval with delayed-trigger, poison-rate-vs-ASR, and laundering-channel shapes**, not static single-string probes ([adversarial-eval](adversarial-eval.md) — "the attacker moves second").

## Evidence tiers

**Established (empirical, code released):** AgentPoison (2024), MINJA (2025). **Fresh single-study preprints (Jun 2026, some single-author, unreplicated — directional, self-reported on custom benchmarks):** TMA-NM (2606.24322), Memory Contagion (2606.23195), Governed Shared Memory (2606.24535). All five arXiv IDs confirmed to resolve via the arXiv API (a control invalid ID returned empty); WebFetch "future-dated" warnings are its stale-cutoff artifact, not fabrication.

## See also

[agent-memory](../topics/agent-memory.md) (home), [prompt-injection-and-isolation](prompt-injection-and-isolation.md) (live-turn sibling), [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md) (the write step is the vector), [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) (consolidation launders provenance), [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) (partial remediation), [memory-retrieval](memory-retrieval.md) (retrieval = trigger), [action-authority](action-authority.md) / [action-execution-safety](../topics/action-execution-safety.md) (trigger-time blast radius), [adversarial-eval](adversarial-eval.md), [multi-agent-delegation](../topics/multi-agent-delegation.md) (fleet spread).
