---
id: llm-as-autoformalizer-plus-solver
type: concept
tags: [neuro-symbolic, planning, solver, reasoning, agents, science-excellence]
summary: "LLM translates the problem into a formal spec (PDDL/ASP/FOL/constraints), a sound solver decides, errors feed back for repair — the guarantee lives in the solver, not the weights; the load-bearing weakness is the translation."
related:
  - [[task-planning]]
  - [[ontology-grounded-agent]]
  - [[decision-engine-contract]]
  - [[plan-execute-replan]]
  - [[tool-use-design]]
  - [[references-ontology-llm-agents]]
status: living
created: 2026-07-03
---

# LLM as Autoformalizer + Solver

When a domain agent needs a *sound* guarantee — a valid plan, a satisfied set of constraints, a correct logical entailment — the reliable pattern is **not** to ask the LLM to reason it out in-weights. It is: the **LLM translates** the natural-language problem into a formal spec (PDDL for planning, ASP/answer-set for constraints, FOL for entailment), a **sound solver decides**, and solver errors **feed back** for the LLM to repair the spec. LLM proposes; solver disposes. The correctness guarantee lives in the solver, not the model.

## Why this beats "LLM reasons symbolically itself"

Verified results ([references-ontology-llm-agents](../references/references-ontology-llm-agents.md)):

- **Logic-LM** (EMNLP 2023, [arXiv:2305.12295](https://arxiv.org/abs/2305.12295)): +39.2% over standard prompting, +18.4% over CoT, via translate → solver → error-feedback repair.
- **LINC** ([arXiv:2310.15164](https://arxiv.org/abs/2310.15164)): a 15.5B model + FOL prover beats GPT-4 CoT by 10% absolute.
- **PlanBench / o1** ([arXiv:2409.13373](https://arxiv.org/abs/2409.13373)): o1-preview 97.8% on standard Blocksworld collapses to **37.3% obfuscated** and 23.6% at 20–40 steps; the classical planner **Fast Downward gets 100% at ~0.265s/instance with guarantees** vs o1 at ~$42/100 instances. For a modelable domain, the solver wins on accuracy, cost, *and* soundness simultaneously.

This is the "engine, not the turn" instinct of [decision-engine-contract](decision-engine-contract.md) applied to reasoning, and the natural executor for a typed [domain-event-task-ontology](domain-event-task-ontology.md) (typed tasks + dependencies → a planning/constraint problem). It slots into [plan-execute-replan](plan-execute-replan.md) as the "produce a sound plan" step and is invoked as a [tool-use-design](../topics/tool-use-design.md) tool (the solver is a tool the agent calls).

## The load-bearing weakness: autoformalization

The whole pattern is only as sound as the **NL→formal translation**, and translation errors are *silent* — a well-formed spec that means the wrong thing yields a confidently wrong "guaranteed" answer. Whether this is a fundamental ceiling or a fixable measurement artifact is **genuinely contested**: one line (Thatikonda; Ryu) treats it as the dominant failure requiring verification; Brunello et al. (AAAI 2026, [arXiv:2511.11816](https://arxiv.org/abs/2511.11816)) argue prior negatives were contamination/protocol artifacts and modern chat LLMs translate well. Until settled, **verify the formalization** (round-trip paraphrase, human check on high-stakes specs, solver-side sanity constraints).

## When it earns its cost

- **Yes:** the domain is formally modelable *and* a sound guarantee is required (scheduling under constraints, policy/eligibility entailment, multi-step plans that must be valid). And you can maintain the formal model (PDDL/ASP domain) as things drift — an unstudied but real TCO.
- **No:** approximate answers are acceptable, or the domain resists clean formalization — the modeling + maintenance cost isn't repaid.

## Pitfalls

- **Trusting the guarantee through a bad translation.** The solver is sound about *the spec it was given*; guard the autoformalization step.
- **Formalizing an unmodelable domain.** Forcing fuzzy real-world judgment into logic yields brittle specs; keep the LLM for the fuzzy parts, the solver for the crisp core.
- **No repair loop.** Single-shot translate-then-solve wastes the biggest lever — solver error messages are excellent repair signal.
- **Maintenance drift.** A stale domain model silently mis-plans; version it like code.

## References

Sits under [task-planning](../topics/task-planning.md); the sound-reasoning arm of [ontology-grounded-agent](ontology-grounded-agent.md). Sources in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
