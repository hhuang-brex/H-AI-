---
title: Overview
nav_order: 2
permalink: /overview/
---

# H-AI-

> Hai's knowledge graph. Every file is one node. Every link is one edge.

A working knowledge base that is **readable for humans** (browse the markdown on github.com or any renderer) and **parseable for agents** (YAML frontmatter, stable IDs, predictable folders). Designed to grow into a navigable graph rather than a pile of notes.

**Browse the rendered site:** [hhuang-brex.github.io/H-AI-](https://hhuang-brex.github.io/H-AI-/)

## Layout

```
H-AI-/
├── README.md              ← you are here (and the site homepage)
├── AGENTS.md              ← contract for agents adding/editing nodes
├── _config.yml            ← Jekyll config (powers the rendered site)
├── graph.json             ← machine-readable graph export (auto-generated)
├── tools/
│   └── build-graph.py     ← regenerates README index, threads/INDEX.md, graph.json
├── nodes/
│   ├── topics/            ← broad areas; entry points (e.g. llm-evaluation)
│   ├── concepts/          ← reusable patterns/ideas (e.g. llm-as-judge)
│   ├── projects/          ← specs, plans, snapshots, worked-examples, products (`kind:` field)
│   └── references/        ← external posts/papers reading lists
└── threads/               ← time-stamped conversation summaries (rolled up in INDEX.md)
```

Frontmatter `related:` is the machine-readable edge list (uses `[[id]]` form). Body prose uses standard markdown links so navigation works on github.com and on the rendered site. Schema reference and editing rules: [`AGENTS.md`](./AGENTS.md).

<!-- BEGIN GENERATED: rebuilt by `python tools/build-graph.py`. Do not edit by hand. -->

## Current entry points

### Topics
- [action-execution-safety](nodes/topics/action-execution-safety.md) — executing side-effecting actions safely — idempotency, dry-run preview, and rollback — so retries, crashes, and replans don't double-charge or corrupt state.
- [agent-control-loop](nodes/topics/agent-control-loop.md) — the iteration that turns an LLM into an agent — perceive, reason, act, observe — plus when to stop, yield, and bound runaway.
- [agent-memory](nodes/topics/agent-memory.md) — the semantic memory system that lets a talking agent recall across turns and sessions — memory types, retrieval, and consolidation/forgetting — distinct from the this-turn context window and the run-state for resume.
- [agent-state-persistence](nodes/topics/agent-state-persistence.md) — the durable run state that lets an agent survive crashes, pause/resume across sessions, and recover to a consistent point — distinct from the audit log and conversation memory.
- [chatbot-pagination](nodes/topics/chatbot-pagination.md) — handling large result sets in a chatbot; UX shape and tool shape chosen jointly.
- [context-engineering](nodes/topics/context-engineering.md) — the discipline of deciding what the model sees each turn — assembly, budget, and compaction — the master lever for agent cost, latency, and accuracy.
- [domain-chatbot-design](nodes/topics/domain-chatbot-design.md) — how a chatbot converses inside a specific domain.
- [human-in-the-loop-control](nodes/topics/human-in-the-loop-control.md) — the interaction patterns that keep a human in an agent's action loop — confirm before acting, steer mid-task, interrupt and resume.
- [llm-evaluation](nodes/topics/llm-evaluation.md) — measuring whether LLM systems do what they should without bankrupting the team.
- [llm-output-design](nodes/topics/llm-output-design.md) — how an LLM emits to the world; per-surface decisions.
- [multi-agent-delegation](nodes/topics/multi-agent-delegation.md) — splitting work across sub-agents — when delegation earns its cost, how to isolate their context, and how to merge results without trusting them blindly.
- [sms-multi-thread-chatbot](nodes/topics/sms-multi-thread-chatbot.md) — multi-thread chatbot design when the only channel is flat SMS.
- [task-agent-pattern](nodes/topics/task-agent-pattern.md) — engine-primary framing where chat is one surface among several.
- [task-planning](nodes/topics/task-planning.md) — turning a goal into an ordered set of actions and adapting when reality diverges from the plan.
- [tool-use-design](nodes/topics/tool-use-design.md) — how an agent acts on the world through tools — schema design, selection, and grounding results back into the loop.

### Concepts — by topic cluster

**[action-execution-safety](nodes/topics/action-execution-safety.md)**
- [dry-run-and-preview](nodes/concepts/dry-run-and-preview.md) — computing the full effect of an action without committing it, so the user (or the agent) can inspect exactly what will happen before it does.
- [execution-invariant-testing](nodes/concepts/execution-invariant-testing.md) — asserting an agent's safety properties as tests — run-twice-equals-once, crash-anywhere-resumes-consistently, never-exceeds-budget — instead of hoping they hold.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.
- [idempotency-keys](nodes/concepts/idempotency-keys.md) — making a side-effecting action safe to call more than once by keying it on a stable client-generated token, so retries and replays produce one effect.
- [interrupt-and-resume](nodes/concepts/interrupt-and-resume.md) — stopping a run in flight — abort vs. pause — and resuming from durable state without redoing completed work or repeating side effects.
- [rollback-and-compensation](nodes/concepts/rollback-and-compensation.md) — undoing a multi-step action that failed halfway — true rollback where possible, compensating actions where not — to avoid leaving the world half-changed.
- [step-budget-and-runaway-control](nodes/concepts/step-budget-and-runaway-control.md) — hard ceilings on loop iterations, tokens, wall-clock, and tool calls so a stuck agent fails loudly instead of running forever.

**[agent-control-loop](nodes/topics/agent-control-loop.md)**
- [decision-engine-contract](nodes/concepts/decision-engine-contract.md) — layered output (decision + confidence + next-action) as the wire format every surface consumes.
- [llm-observability](nodes/concepts/llm-observability.md) — debugging \"why did the model respond this way?\" — what frontier APIs actually return (mostly summaries), platform feature reality, OTel state.
- [perceive-reason-act-loop](nodes/concepts/perceive-reason-act-loop.md) — the core agent iteration — observe state, decide one action, execute, observe result — and why each turn should commit to exactly one action.
- [step-budget-and-runaway-control](nodes/concepts/step-budget-and-runaway-control.md) — hard ceilings on loop iterations, tokens, wall-clock, and tool calls so a stuck agent fails loudly instead of running forever.
- [stop-and-yield-conditions](nodes/concepts/stop-and-yield-conditions.md) — the three ways a loop can end — done, blocked-needs-user, or failed — and why 'yield to user' is distinct from 'stop'.

**[agent-memory](nodes/topics/agent-memory.md)**
- [associative-memory-and-attention](nodes/concepts/associative-memory-and-attention.md) — why retrieval and in-context recall work at all — attention IS associative-memory retrieval — and the capacity wall that forces agents to externalize memory rather than enlarge the window.
- [complementary-learning-systems](nodes/concepts/complementary-learning-systems.md) — the dual-store blueprint behind two-tier agent memory — fast episodic + slow semantic, joined by replay/consolidation — and the verified cognitive-science theory the existing memory nodes only gesture at.
- [context-storage-and-hydration](nodes/concepts/context-storage-and-hydration.md) — where conversational context lives and how it's loaded per request — the stateless-compute / stateful-store split, keyed per user/conversation, with a DB-of-record plus optional cache tier.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [domain-knowledge-injection](nodes/concepts/domain-knowledge-injection.md) — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [experiential-memory-substrates](nodes/concepts/experiential-memory-substrates.md) — the substrate-choice decision for learned experience — store it as curated text, distilled weights, or transient activation — and why production agents keep weights frozen and curate text with delta-merge discipline.
- [interference-and-catastrophic-forgetting](nodes/concepts/interference-and-catastrophic-forgetting.md) — why any shared-parameter store forgets when updated sequentially — the NTK-overlap law — and the three verified mitigation families (importance regularization, replay, parameter isolation).
- [memory-consolidation-and-forgetting](nodes/concepts/memory-consolidation-and-forgetting.md) — deciding what to keep, promote from episodic to semantic, and deliberately forget — because storing everything degrades retrieval as surely as remembering nothing.
- [memory-retrieval](nodes/concepts/memory-retrieval.md) — surfacing the few relevant memories out of many — recency × relevance × importance scoring — and why a bigger context window doesn't replace it.
- [memory-types-taxonomy](nodes/concepts/memory-types-taxonomy.md) — the working / episodic / semantic / procedural split borrowed from cognitive science — what each holds, how they differ in write and decay, and when an agent needs more than one.
- [parametric-memory-and-editing](nodes/concepts/parametric-memory-and-editing.md) — facts live in the weights as a key-value store you can surgically edit (ROME/MEMIT) — and why sequential editing inherits catastrophic forgetting, making external memory the safer choice for mutable facts.

**[agent-state-persistence](nodes/topics/agent-state-persistence.md)**
- [checkpoint-and-replay](nodes/concepts/checkpoint-and-replay.md) — when to write durable state — before every risky step — and how to rebuild a live run from the last checkpoint.
- [context-storage-and-hydration](nodes/concepts/context-storage-and-hydration.md) — where conversational context lives and how it's loaded per request — the stateless-compute / stateful-store split, keyed per user/conversation, with a DB-of-record plus optional cache tier.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [crash-recovery-consistency](nodes/concepts/crash-recovery-consistency.md) — resuming after a crash that landed mid-action — using write-ahead markers to decide whether the in-flight side effect fired, and reconciling to a consistent state.
- [decision-audit-trail](nodes/concepts/decision-audit-trail.md) — durable per-decision record (fingerprint + version + reasoning + override history); the substrate replay/drift run on.
- [execution-invariant-testing](nodes/concepts/execution-invariant-testing.md) — asserting an agent's safety properties as tests — run-twice-equals-once, crash-anywhere-resumes-consistently, never-exceeds-budget — instead of hoping they hold.
- [interrupt-and-resume](nodes/concepts/interrupt-and-resume.md) — stopping a run in flight — abort vs. pause — and resuming from durable state without redoing completed work or repeating side effects.
- [run-state-model](nodes/concepts/run-state-model.md) — the minimal durable shape that lets a run resume — goal, plan with per-step status, established facts, open commitments, and in-flight markers.

**[chatbot-pagination](nodes/topics/chatbot-pagination.md)**
- [code-execution-sandbox-pattern](nodes/concepts/code-execution-sandbox-pattern.md) — keep large rows out of model context entirely.
- [cost-aware-eval](nodes/concepts/cost-aware-eval.md) — sample-size math and budget assertions.
- [domain-knowledge-injection](nodes/concepts/domain-knowledge-injection.md) — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [forced-tool-call-output](nodes/concepts/forced-tool-call-output.md) — when to force schema vs. let the model write free-text.
- [paginated-tool-contract](nodes/concepts/paginated-tool-contract.md) — opaque cursors, verbosity enum, filter parameters; ~3× token savings.
- [truncated-pyramid-results](nodes/concepts/truncated-pyramid-results.md) — summary first, select-N exemplars, refinement buttons (NN/g).

**[context-engineering](nodes/topics/context-engineering.md)**
- [agent-skills-progressive-disclosure](nodes/concepts/agent-skills-progressive-disclosure.md) — package domain capability as a SKILL.md folder the agent loads in three stages — metadata always, instructions on match, bundled files on demand — so many capabilities cost almost no base-prompt tokens.
- [agentic-context-engineering-ace](nodes/concepts/agentic-context-engineering-ace.md) — optimize the context-as-playbook itself (generate/reflect/curate, delta updates) — the structural counterpart to optimizing instruction prose.
- [context-assembly-per-turn](nodes/concepts/context-assembly-per-turn.md) — constructing each turn's prompt from typed parts — system, goal, history, tools, results — instead of resending a growing transcript.
- [context-budget-allocation](nodes/concepts/context-budget-allocation.md) — splitting a fixed token window across system, history, tools, and results — with an explicit eviction policy for when it overflows.
- [context-compaction](nodes/concepts/context-compaction.md) — shrinking a long history to fit the window without losing the decisions that matter — rolling summaries, structured state, and what never to compact.
- [context-storage-and-hydration](nodes/concepts/context-storage-and-hydration.md) — where conversational context lives and how it's loaded per request — the stateless-compute / stateful-store split, keyed per user/conversation, with a DB-of-record plus optional cache tier.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [domain-knowledge-injection](nodes/concepts/domain-knowledge-injection.md) — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [sms-context-windowing](nodes/concepts/sms-context-windowing.md) — what's in the prompt: per-thread, structured, bounded.

**[domain-chatbot-design](nodes/topics/domain-chatbot-design.md)**
- [action-authority](nodes/concepts/action-authority.md) — what the bot can *do*; tiered authority enforced at the tool layer.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [domain-knowledge-injection](nodes/concepts/domain-knowledge-injection.md) — RAG, prompt-stuffing, structured state, fine-tuning per knowledge type.
- [escalation-handoff](nodes/concepts/escalation-handoff.md) — when and how to hand off to a human; preserving context.
- [grounding-and-citation](nodes/concepts/grounding-and-citation.md) — anchoring claims in domain sources; refusal as the right answer.
- [intent-and-disambiguation](nodes/concepts/intent-and-disambiguation.md) — turning ambiguous input into actionable intent; clarification vs. assumption.
- [operator-trust-injection](nodes/concepts/operator-trust-injection.md) — mid-conversation operator-only messages without a developer role; self-describing wrapper + recency reinforcement + output hygiene + reply envelope.
- [persona-tone-compliance](nodes/concepts/persona-tone-compliance.md) — voice as a constraint set, not a style preference.
- [recency-bias-prompt-design](nodes/concepts/recency-bias-prompt-design.md) — placement matters; rules near the end and reinforcements near the injection point earn more weight.
- [repair-and-clarification](nodes/concepts/repair-and-clarification.md) — recovery turns are not initial turns.
- [safety-rails-domain-specific](nodes/concepts/safety-rails-domain-specific.md) — generic safety is the baseline, not the answer.
- [scope-and-refusal](nodes/concepts/scope-and-refusal.md) — in-domain vs. out-of-domain; three kinds of refusal.
- [turn-taking-and-proactivity](nodes/concepts/turn-taking-and-proactivity.md) — initiative, long operations, closing.

**[human-in-the-loop-control](nodes/topics/human-in-the-loop-control.md)**
- [action-authority](nodes/concepts/action-authority.md) — what the bot can *do*; tiered authority enforced at the tool layer.
- [confirm-before-act](nodes/concepts/confirm-before-act.md) — gating an action on explicit user approval, with the gate's strictness scaled to the action's reversibility and blast radius.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.
- [interrupt-and-resume](nodes/concepts/interrupt-and-resume.md) — stopping a run in flight — abort vs. pause — and resuming from durable state without redoing completed work or repeating side effects.
- [mid-task-steering](nodes/concepts/mid-task-steering.md) — handling a user message that arrives while the agent is working — classify it as redirect, refinement, abort, or chatter, then replan accordingly.
- [simulated-user-eval](nodes/concepts/simulated-user-eval.md) — evaluating a chatting agent by driving it with a scripted or LLM-played user across multi-turn scenarios — interruptions, corrections, abandonment — not just single-turn replies.
- [stop-and-yield-conditions](nodes/concepts/stop-and-yield-conditions.md) — the three ways a loop can end — done, blocked-needs-user, or failed — and why 'yield to user' is distinct from 'stop'.

**[llm-evaluation](nodes/topics/llm-evaluation.md)**
- [adversarial-eval](nodes/concepts/adversarial-eval.md) — red-team / safety / prompt injection.
- [agent-trajectory-eval](nodes/concepts/agent-trajectory-eval.md) — multi-turn, tool sequences, end-state.
- [cost-aware-eval](nodes/concepts/cost-aware-eval.md) — sample-size math and budget assertions.
- [eval-case-design](nodes/concepts/eval-case-design.md) — how to construct eval cases: design from the decision, a coverage matrix, scorable end-states, discrimination-piloting, held-out splits, and a failure flywheel.
- [eval-dataset-quality](nodes/concepts/eval-dataset-quality.md) — audit the eval set as an instrument — validity, label agreement, discrimination (negative-control), contamination, drift — not just the model's score.
- [execution-invariant-testing](nodes/concepts/execution-invariant-testing.md) — asserting an agent's safety properties as tests — run-twice-equals-once, crash-anywhere-resumes-consistently, never-exceeds-budget — instead of hoping they hold.
- [golden-snapshot-eval](nodes/concepts/golden-snapshot-eval.md) — pre-LLM deterministic checks.
- [llm-as-judge](nodes/concepts/llm-as-judge.md) — calibration, bias, multi-vote, cascading.
- [offline-prompt-optimization](nodes/concepts/offline-prompt-optimization.md) — improve an agent skill by searching prompt space offline, scored end-to-end by the real agent — not hand-tuning.
- [prod-shadow-replay](nodes/concepts/prod-shadow-replay.md) — closing the gap between frozen datasets and live traffic.
- [simulated-user-eval](nodes/concepts/simulated-user-eval.md) — evaluating a chatting agent by driving it with a scripted or LLM-played user across multi-turn scenarios — interruptions, corrections, abandonment — not just single-turn replies.
- [test-pyramid-llm](nodes/concepts/test-pyramid-llm.md) — porting the classic pyramid to LLM apps.
- [verbal-reinforcement-vs-gradient-rl](nodes/concepts/verbal-reinforcement-vs-gradient-rl.md) — the distinction between gradient RL (weights move) and verbal/in-context reinforcement (text moves) — and why eval-driven skill-rewriting is the latter.
- [verbal-self-correction](nodes/concepts/verbal-self-correction.md) — a model revises its own behaviour from natural-language self-feedback — Self-Refine (within a task) and Reflexion (across trials); the primitive the optimizers scale up.

**[llm-output-design](nodes/topics/llm-output-design.md)**
- [cot-as-forensic-artifact](nodes/concepts/cot-as-forensic-artifact.md) — the *why* behind reasoning instrumentation: CoT is forensic, not explanatory; unfaithful 60–75% of the time yet uniquely surfaces alignment-faking, scheming, situational awareness.
- [forced-tool-call-output](nodes/concepts/forced-tool-call-output.md) — when to force schema vs. let the model write free-text.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.
- [layered-defense-pipeline](nodes/concepts/layered-defense-pipeline.md) — regex gate → forced tool → templates → heterogeneous-model recheck.
- [llm-observability](nodes/concepts/llm-observability.md) — debugging \"why did the model respond this way?\" — what frontier APIs actually return (mostly summaries), platform feature reality, OTel state.
- [native-thinking-vs-prompted-reasoning](nodes/concepts/native-thinking-vs-prompted-reasoning.md) — frontier labs have moved away from prompted `<reasoning>` tags; native thinking APIs are the default.
- [output-surface-taxonomy](nodes/concepts/output-surface-taxonomy.md) — classify each surface explicitly; per-surface decisions.
- [schema-vs-validator](nodes/concepts/schema-vs-validator.md) — schema-enforced output vs. free-text + post-hoc validator.
- [streaming-vs-structured](nodes/concepts/streaming-vs-structured.md) — token-by-token UX vs. structured output trade-off.
- [template-rendered-output](nodes/concepts/template-rendered-output.md) — stricter sibling: classifier picks a tool, code-owned templates render the reply.

**[multi-agent-delegation](nodes/topics/multi-agent-delegation.md)**
- [engine-vs-conversation-routing](nodes/concepts/engine-vs-conversation-routing.md) — when the engine handles vs. when the chat layer handles; the bridge between them.
- [escalation-handoff](nodes/concepts/escalation-handoff.md) — when and how to hand off to a human; preserving context.
- [result-aggregation-and-trust](nodes/concepts/result-aggregation-and-trust.md) — merging sub-agent outputs without trusting them blindly — dedup, conflict resolution, and adversarial verification of confident-but-wrong children.
- [subagent-context-isolation](nodes/concepts/subagent-context-isolation.md) — giving a sub-agent exactly the scoped context it needs and a compact return contract — so children stay focused and don't leak state back to the parent.
- [when-to-delegate](nodes/concepts/when-to-delegate.md) — the test for spawning a sub-agent — independent parallelism, context isolation, or adversarial separation — and why most decomposition shouldn't be agents.

**[sms-multi-thread-chatbot](nodes/topics/sms-multi-thread-chatbot.md)**
- [async-conversation-pacing](nodes/concepts/async-conversation-pacing.md) — gaps measured in days; re-anchoring; expiry; nudge policy.
- [conversation-memory](nodes/concepts/conversation-memory.md) — three horizons; what to remember, what not to.
- [flat-channel-thread-tracking](nodes/concepts/flat-channel-thread-tracking.md) — picking the right thread without thread metadata; cheap-to-expensive detection ladder.
- [hard-surface-irrevocability](nodes/concepts/hard-surface-irrevocability.md) — irrevocable output channels as a first-class category.
- [message-segmentation-160](nodes/concepts/message-segmentation-160.md) — character limits, encoding switches, MMS/RCS fallback.
- [sms-context-windowing](nodes/concepts/sms-context-windowing.md) — what's in the prompt: per-thread, structured, bounded.
- [sms-recovery-and-reentry](nodes/concepts/sms-recovery-and-reentry.md) — five recovery scenarios; not \"sorry, could you clarify?\"
- [sms-state-machine](nodes/concepts/sms-state-machine.md) — five states per thread; the durable substrate.
- [thread-disambiguation-prompts](nodes/concepts/thread-disambiguation-prompts.md) — how to ask \"which thread?\" in 160 chars.

**[task-agent-pattern](nodes/topics/task-agent-pattern.md)**
- [decision-audit-trail](nodes/concepts/decision-audit-trail.md) — durable per-decision record (fingerprint + version + reasoning + override history); the substrate replay/drift run on.
- [decision-engine-contract](nodes/concepts/decision-engine-contract.md) — layered output (decision + confidence + next-action) as the wire format every surface consumes.
- [engine-vs-conversation-routing](nodes/concepts/engine-vs-conversation-routing.md) — when the engine handles vs. when the chat layer handles; the bridge between them.
- [forced-tool-call-output](nodes/concepts/forced-tool-call-output.md) — when to force schema vs. let the model write free-text.
- [output-surface-taxonomy](nodes/concepts/output-surface-taxonomy.md) — classify each surface explicitly; per-surface decisions.

**[task-planning](nodes/topics/task-planning.md)**
- [agent-trajectory-eval](nodes/concepts/agent-trajectory-eval.md) — multi-turn, tool sequences, end-state.
- [decision-engine-contract](nodes/concepts/decision-engine-contract.md) — layered output (decision + confidence + next-action) as the wire format every surface consumes.
- [goal-decomposition](nodes/concepts/goal-decomposition.md) — breaking a goal into steps at the right granularity — actionable but not brittle — with dependencies made explicit.
- [plan-execute-replan](nodes/concepts/plan-execute-replan.md) — executing a plan step by step and revising it when a step fails or reality diverges — the difference between an agent and a script.

**[tool-use-design](nodes/topics/tool-use-design.md)**
- [action-authority](nodes/concepts/action-authority.md) — what the bot can *do*; tiered authority enforced at the tool layer.
- [forced-tool-call-output](nodes/concepts/forced-tool-call-output.md) — when to force schema vs. let the model write free-text.
- [output-surface-taxonomy](nodes/concepts/output-surface-taxonomy.md) — classify each surface explicitly; per-surface decisions.
- [tool-result-grounding](nodes/concepts/tool-result-grounding.md) — feeding tool output back into the loop so the model can act on it — trimming, shaping, and distinguishing error from success.
- [tool-schema-design](nodes/concepts/tool-schema-design.md) — writing tool definitions the model can reliably pick and call — names, descriptions, parameter shapes, and the errors they return.
- [tool-selection-and-routing](nodes/concepts/tool-selection-and-routing.md) — helping the model pick the right tool when there are many — disambiguation, hierarchical routing, and keeping the active set small.

### Projects — by kind

**Specs**
- [knowledge-graph-index-builder-spec](nodes/projects/knowledge-graph-index-builder-spec.md) — Eliminate README index drift by deriving the index, threads rollup, and a graph.json artifact from frontmatter via `tools/build-graph.py`.
- [sms-message-buffering-spec](nodes/projects/sms-message-buffering-spec.md) — handle users splitting one thought across multiple SMS messages; 3-layer detection (regex / Haiku classifier / dynamic timeout) with 10 edge cases.
- [task-agent-pattern-fanout](nodes/projects/task-agent-pattern-fanout.md) — engine-primary framing where chat is one surface among several.

**Plans**
- [agent-eval-improvement-tiers](nodes/projects/agent-eval-improvement-tiers.md) — ranked improvement plan for the case study above.
- [knowledge-graph-index-builder-plan](nodes/projects/knowledge-graph-index-builder-plan.md) — 13-task implementation plan for `tools/build-graph.py`; sequenced as schema backfill → orphan-fix → script build → regeneration.
- [sms-message-buffering-plan](nodes/projects/sms-message-buffering-plan.md) — 7-piece implementation plan for the spec above.

**Snapshots**
- [agent-eval-case-study](nodes/projects/agent-eval-case-study.md) — generalized agent platform eval system (2026-06-05 snapshot).
- [dspy-domain-chatbot-cases](nodes/projects/dspy-domain-chatbot-cases.md) — verified DSPy domain-chatbot success examples (JetBlue, Dr.Copilot, etc.; 2026-06-09 snapshot).

**Worked examples**
- [worked-example-anthropic-thinking](nodes/projects/worked-example-anthropic-thinking.md) — Python code: capturing reasoning, signature continuity, forced-tool-call constraint, hidden billing.
- [worked-example-chatting-task-agent](nodes/projects/worked-example-chatting-task-agent.md) — annotated code for one end-to-end chatting task agent — control loop, tools, planning, context, HITL, execution safety, persistence — threading the agent concept cluster into a single runnable shape.
- [worked-example-openai-responses](nodes/projects/worked-example-openai-responses.md) — Python code: Responses API, server-stateful + stateless multi-turn, `incomplete:max_output_tokens` handling.

**Products**
- [spender-agent](nodes/projects/spender-agent.md) — task agent that documents transactions by maintaining an EA-grade model of the principal's economic life. Two-loop architecture (slow context model + fast event handling) over a universal-context primitive; AI-proposes / user-corrects authority. (`kind: product`.)

### References
- [references-chatbot-pagination](nodes/references/references-chatbot-pagination.md) — pagination reading list (Anthropic Writing Tools / Code Execution, MCP cursor spec, NN/g UX patterns).
- [references-context-and-memory](nodes/references/references-context-and-memory.md) — verified empirical sources behind the context and memory clusters — lost-in-the-middle, context rot, RAG, MemGPT, and generative agents.
- [references-domain-chatbot-design](nodes/references/references-domain-chatbot-design.md) — chatbot design reading list (Anthropic, OpenAI, Microsoft Bot Service, Google CDS, Rasa, Voiceflow, Husain, Yan, Hall, Intercom Fin).
- [references-eval-reading-list](nodes/references/references-eval-reading-list.md) — frontier-lab + practitioner posts on LLM eval (Anthropic, OpenAI, Husain, Yan, Carter, Shankar, …).
- [references-memory-theory](nodes/references/references-memory-theory.md) — verified primary sources behind the memory-theory cluster — Hopfield/attention, complementary learning systems, catastrophic forgetting, model editing, and experiential learning.
- [references-task-agent-design](nodes/references/references-task-agent-design.md) — verified primary sources grounding the agent cluster — ReAct, Reflexion, Toolformer, Tree of Thoughts, MetaGPT, and Anthropic's effective-agents guidance.
- [references-template-rendered-output](nodes/references/references-template-rendered-output.md) — what's verifiable about template-rendered output in production — Rasa (mechanism confirmed), Ikki (architecture confirmed, outcomes refuted), and why most 'structured output' systems don't qualify.

---
<sub>Provenance: 19 dated research/design threads record how these nodes came to be. They are process history, not a starting point — see [`threads/INDEX.md`](threads/INDEX.md) if you need to trace a decision.</sub>

<!-- END GENERATED -->

## Why this shape

- **One concept per file** — cheap to link, cheap to refactor.
- **Frontmatter** — agents can index without parsing prose; `related:` is the machine-readable edge list.
- **Markdown links in body** — navigable on github.com directly; no Obsidian/Foam required.
- **Folder = type, not topic** — topics are themselves nodes; folders prevent the "where does this live?" debate.

## Adding to the graph

Read [`AGENTS.md`](./AGENTS.md). The short version:

1. Pick the right folder by *type* (topic/concept/project/reference/thread).
2. Use `kebab-case-slug.md`. The filename is the `id`.
3. Frontmatter required. `related:` keeps `[[id]]` form for the edge list.
4. Body is markdown; complete sentences; link with `[id](relative/path.md)`.
5. Update this README's index when adding a new node.
