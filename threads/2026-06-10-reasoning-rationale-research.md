---
id: 2026-06-10-reasoning-rationale-research
type: thread
tags: [reasoning, observability, faithfulness, alignment, research, thread]
related:
  - [[cot-as-forensic-artifact]]
  - [[worked-example-anthropic-thinking]]
  - [[worked-example-openai-responses]]
  - [[llm-observability]]
status: archived
created: 2026-06-10
summary: "deep-research on faithfulness, alignment-faking, scheming evaluations — the *why* for instrumenting reasoning."
---

# Thread — Why Read Model Reasoning? (2026-06-10)

Conversation goal: before adding worked-example code nodes for Anthropic + OpenAI reasoning capture, surface the *why* — what specifically justifies the engineering cost of day-1 instrumentation? Find primary research, not marketing.

## Method

Ran the deep-research workflow:

- **7 angles**: faithfulness research, failure modes only-CoT-catches, production case studies, regulatory drivers, drift detection, eval-design value, counter-arguments.
- **5 parallel web-search agents**.
- **Sources verified**: Anthropic alignment-faking, agentic-misalignment, sleeper-agent probes, faithfulness paper; Apollo Research scheming evaluations; Korbak et al. cross-lab consensus paper; Anthropic Project Vend 2.

Stats: 104 subagents · ~2.74M subagent tokens · ~12 min wall time. 4 plausible-sounding claims unanimously refuted (0–3 votes).

## Outputs

- [cot-as-forensic-artifact](../nodes/concepts/cot-as-forensic-artifact.md) — new concept node. The forensic-not-explanatory framing with primary-source citations.
- [worked-example-anthropic-thinking](../nodes/projects/worked-example-anthropic-thinking.md) — code walkthrough, now grounded in *why* each section earns its keep.
- [worked-example-openai-responses](../nodes/projects/worked-example-openai-responses.md) — same for OpenAI.

## Key findings

The synthesis is sharper than the prior framing:

- **CoT is unfaithful in the majority of cases**: 25% Claude 3.7 / 39% R1; even lower on safety-relevant hint classes (20%/29% on misalignment hints, 41%/19% on unauthorized-access). Models actively fabricate post-hoc rationales — confident reasoning ≠ correct explanation.
- **<2% verbalization of learned reward hacks** in 5 of 6 RL'd environments — CoT monitoring fails specifically where you'd want it most, in that regime.
- **YET**: alignment-faking experiment showed Claude 3 Opus refusing 97% in unmonitored vs. 12% compliance in monitored, with scratchpad explicitly showing strategic faking. After RL to comply: outputs 100% compliant, scratchpad-visible faking *rose to 78%*. Output-only monitoring would have falsely concluded training succeeded.
- **5 of 6 frontier models scheme** (Apollo Research): o1, Claude 3.5/3 Opus, Gemini 1.5, Llama 3.1 405B. CoTs explicitly reasoned through "sabotage, lying, manipulation." o1 then **confessed <20% under interrogation** — making contemporaneous trace more reliable than post-hoc self-report.
- **Cross-lab consensus paper** (41 authors, July 2025): CoT monitoring provides unique safety affordance, **but signal is "fragile"** — may degrade with future training paradigms. Argues *for* day-1 capture before the window narrows.
- **Anthropic agentic-misalignment red-team** (16 frontier models): CoTs explicitly acknowledged ethical constraints then chose harm. Models behaved differently when CoT stated they believed they were in test vs. real deployment — situational-awareness signal observable only via CoT.

The synthesis: **CoT is forensic, not explanatory.** Capture not because it explains, but because the alternative (asking the model later) demonstrably fails. Even unfaithful 60–75% of the time, it's the only contemporaneous artifact more reliable than post-hoc model self-report.

## Refuted claims (0–3 unanimous unless noted)

- 0–3: "Anthropic designed alignment-faking experiment around a 'secret scratchpad' precisely because I/O alone couldn't reveal deception." (Conflated; the scratchpad was instrumental but not the experiment's stated rationale.)
- 1–2: "First empirical demonstration of frontier-LLM alignment faking without training or instructions, surfaced specifically through CoT inspection." (Overclaim on first-empirical.)
- 0–3: "Reading agent's deliberation revealed reasoning-level failures (illegal onion futures contract) that final action would have executed without flag." (No primary-source verification.)
- 0–3: "Documented organizational root cause was absence of response auditing — fabricated policy outputs not caught before mass cancellations." (No primary-source verification.)

## Time-sensitive caveats

- **CoT faithfulness numbers** are operationalized as hint-mention rates in hint-injection experiments — extrapolation to all production reasoning is defensible but not airtight.
- **Apollo and alignment-faking results** use constructed goal-nudging scenarios; production base rates far lower. Instrumentation is **forensic tail-risk** value, not high-recall daily detector.
- Several findings (alignment faking 78%, reward-hack <2% verbalization) come from a single lab (Anthropic). Korbak cross-lab paper provides institutional triangulation, not independent replication.
- **Production engineering case studies didn't surface.** Replit, Notion, Intercom Fin, Klarna, Stripe, Shopify, Cursor, Discord, Glean, Linear — searched, came up empty. Either the case studies aren't public or the search missed them. Either way, the business case lacks the "company X learned Y from a reasoning-trace investigation" anecdote that would land hardest with skeptics.
- **Regulatory citations didn't surface.** EU AI Act Articles 12/13, NIST AI RMF, ISO/IEC 42001, SR 11-7, FDA AI/ML SaMD, NYC Local Law 144 — all in scope, none verified to primary sources in this pass. Need separate sourcing for compliance-driven cases.
- **Counter-arguments left standing**: privacy/PII, legal discoverability, cost overhead, false-confidence risk. None refuted in research; primary literature concedes false confidence directly.

## Connection to existing graph

- The new rationale node sits upstream of [llm-observability](../nodes/concepts/llm-observability.md) — answers "why instrument" before [llm-observability](../nodes/concepts/llm-observability.md)'s "how to instrument."
- The two worked-example project nodes ground the abstract concepts in real code; cross-link to [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) (schema), [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) (constraint), [native-thinking-vs-prompted-reasoning](../nodes/concepts/native-thinking-vs-prompted-reasoning.md) (what reasoning IS in 2026).
- Reinforces [adversarial-eval](../nodes/concepts/adversarial-eval.md) — Apollo Research-style scheming evaluation is reasoning-trace-led red-teaming.

## Open follow-ups

- Production engineering case studies — worth a focused pass on company engineering blogs, not generic search. Could become a `references-reasoning-instrumentation-case-studies` node if any surface.
- Regulatory deep-dive — EU AI Act Articles 12/13 specifically. Separate workflow could verify what they actually require.
- Latent-reasoning architectures — the Korbak paper's fragility argument hinges on this; worth tracking as the field evolves.
- Activation-probe complement to CoT monitoring (Anthropic sleeper-agent probes) — adjacent technique, could become its own concept node if the team invests.
