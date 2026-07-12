---
id: reflection-loop-taxonomy
type: concept
tags: [agents, reflection, self-correction, control-loop, pipeline, reliability]
related:
  - [[agent-control-loop]]
  - [[verbal-self-correction]]
  - [[plan-execute-replan]]
  - [[goal-decomposition]]
  - [[multi-agent-delegation]]
  - [[prince-reliable-agentic-case-study]]
status: living
created: 2026-07-10
summary: "classify self-correction loops by what-is-validated × pipeline-stage — process (planning) / data (evidence) / draft (output) reflection; the stage-bound structuring of verbal-self-correction's primitives."
---

# Reflection-Loop Taxonomy

[verbal-self-correction](verbal-self-correction.md) owns the *primitives* — Self-Refine (revise within a task), Reflexion (revise across trials). This node adds the orthogonal axis a multi-stage agent pipeline needs: **classify reflection loops by *what* is validated × *where* in the pipeline**, and place one at each stage boundary matched to that stage's failure mode.

## The three loops (stage × what-is-checked)

| Loop | Pipeline stage | Checks | Emits on failure |
|---|---|---|---|
| **Process reflection** | planning / control | is the *trajectory* right — right tool, right sequence, on-goal? | replan / re-route ([plan-execute-replan](plan-execute-replan.md)) |
| **Data reflection** | after retrieval / evaluation | is the *evidence sufficient* — coverage gaps, thin support? | follow-up queries, more retrieval |
| **Draft reflection** | after generation / writing | is the *output complete* — missing sections, incomplete tables, synthesis gaps? | revise/extend the draft |

The insight: a single "reflect and retry" is too coarse for a `planner → retriever → writer` pipeline — each stage fails differently, so each needs a reflection check tuned to its own failure mode. This generalizes beyond any one system (in [prince-reliable-agentic-case-study](../projects/prince-reliable-agentic-case-study.md) the three appear as Think&Plan / Reflection Agent / Writer checks).

## When to use

- Multi-stage agentic pipelines where a single end-of-run check can't localize *why* it failed.
- Place process-reflection early (cheap course-correction beats a wasted trajectory), data-reflection at the retrieval boundary, draft-reflection before you return output.
- Skip it on single-step tasks — reflection is overhead the task must earn.

## Pitfalls

- **Unbounded loops.** Each reflection can trigger rework; cap iterations ([step-budget-and-runaway-control](step-budget-and-runaway-control.md)) or a stuck stage spins.
- **Reflector-quality dependence.** A weak reflector emits wrong corrections and *poisons* the run — the check is only as good as the model doing it.
- **Over-reflection.** Reflecting on trivial stages adds latency/cost for no gain; match the loop to a real failure mode.
- **Reflection ≠ verification.** These loops check plausibility/completeness, not ground truth — pair draft-reflection with grounded citations and eval.

## References

Sits under [agent-control-loop](../topics/agent-control-loop.md); the stage-bound structuring of [verbal-self-correction](verbal-self-correction.md)'s primitives, bound to [goal-decomposition](goal-decomposition.md) / [multi-agent-delegation](../topics/multi-agent-delegation.md) stages. Production instance: [prince-reliable-agentic-case-study](../projects/prince-reliable-agentic-case-study.md).
