---
id: result-aggregation-and-trust
type: concept
tags: [agent, multi-agent, aggregation, verification, trust, engineering-excellence]
summary: "merging sub-agent outputs without trusting them blindly — dedup, conflict resolution, and adversarial verification of confident-but-wrong children."
related:
  - [[multi-agent-delegation]]
  - [[subagent-context-isolation]]
  - [[adversarial-eval]]
  - [[llm-as-judge]]
  - [[grounding-and-citation]]
status: living
created: 2026-06-11
---

# Result Aggregation & Trust

Children return results; the coordinator must combine them into one coherent answer — and a sub-agent's confidence is not evidence of its correctness. Aggregation is the merge logic (dedup, resolve conflicts, synthesize); trust is the discipline of not letting a fluent-but-wrong child poison the whole. The coordinator's hardest job is the second.

## A child's confidence is not correctness

A sub-agent returns its answer in the same assured tone whether it's right or hallucinating — it has no more insight into its own errors than any single model call. So the coordinator cannot treat "the child said so" as ground truth. This is the same trap as accepting an LLM's self-report; the defense is the same as [adversarial-eval](adversarial-eval.md) and [llm-as-judge](llm-as-judge.md): verify, especially the confident claims, especially the load-bearing ones.

## Merge mechanics

| Situation | Handling |
|---|---|
| **Disjoint results** (each child a different piece) | Concatenate; check for gaps the fan-out missed |
| **Overlapping results** (children cover same ground) | Dedup by identity, not surface form |
| **Conflicting results** (children disagree) | Resolve explicitly — don't silently pick first |
| **Confident outliers** | Verify before trusting; a lone strong claim is a flag, not a fact |

The conflict case is where naive aggregation fails: two children return different answers and the coordinator picks whichever came first, or averages them into nonsense. Conflicts are signal — they mark exactly the spots that need a tie-breaking verification pass.

## Verify with independence

When you verify a child's claim, the verifier must be *independent* — it must not have seen the child's reasoning, or it will rationalize the same error ([subagent-context-isolation](subagent-context-isolation.md)). For high-stakes merges, a panel of independent verifiers (majority-refutes-kills) beats a single check. This is adversarial verification applied to your own sub-agents, not just to external claims.

## Aggregated claims still need grounding

When the merged result asserts facts, those assertions must trace to what children actually found — not to the coordinator's synthesis drifting beyond the evidence. [grounding-and-citation](grounding-and-citation.md) applies to the merge: cite which child / which source each claim came from, so the synthesis stays anchored.

## Completeness is the silent failure

Fan-out can *miss* as easily as it can err: a search angle not run, a file not assigned. After merging, ask "what's missing?" — gaps don't announce themselves, and a confident merge of incomplete coverage reads as complete. A completeness check is the cheap insurance.

## Pitfalls

- **Trusting confident children.** Fluency mistaken for correctness.
- **Silent conflict resolution.** Picking first / averaging instead of tie-breaking.
- **Non-independent verification.** The verifier saw the reasoning it's checking.
- **Unflagged incompleteness.** A tidy merge of partial coverage looks whole.

## References

[adversarial-eval](adversarial-eval.md) and [llm-as-judge](llm-as-judge.md) are the verification machinery; [subagent-context-isolation](subagent-context-isolation.md) is what keeps the verifier genuinely independent.
