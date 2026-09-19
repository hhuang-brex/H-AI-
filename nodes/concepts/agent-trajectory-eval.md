---
id: agent-trajectory-eval
type: concept
tags: [eval, agent, trajectory, multi-turn]
related:
  - [[task-planning]]
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[golden-snapshot-eval]]
  - [[agent-eval-case-study]]
  - [[collaborative-agent-eval]]
  - [[flat-channel-thread-tracking]]
  - [[llm-as-judge]]
  - [[skill-injection-decision]]
  - [[references-multi-turn-agent-eval]]
status: living
created: 2026-06-05
summary: "multi-turn, tool sequences, end-state."
---

# Agent Trajectory Eval

Evaluating an agent — not just an LLM — means evaluating the *trajectory*: the full sequence of tool calls, observations, and messages that produced an outcome.

## Three eval shapes (LangSmith framing)

1. **Final-response** — only the last message matters. Easiest, weakest signal for tool-using agents.
2. **Trajectory** — assert on tool-call sequence (with partial credit). Catches "wrong tool" bugs final-response misses.
3. **Single-step / component** — pin one decision (router, tool selection, parameter extraction) and test it in isolation. Cheapest, most actionable when something breaks.

## Mechanical assertions worth having

- **Tool existence/forbidden** — required tool present, banned tool absent.
- **Tool count bounds** — `min/max` calls per case (catches loops + missed work).
- **`input.exists` / `input.equals`** — argument-level checks. `input.equals` is underused; promote it whenever the value is verifiable.
- **Sequence with wildcards** — partial-order assertions on tool calls.
- **Schema validity** — every emitted tool call parses against its operation's schema.

## End-state evaluation (Anthropic multi-agent post)

For genuinely nondeterministic agents, judging "did the final state satisfy the rubric?" is more tractable than judging every step. Pair with [llm-as-judge](llm-as-judge.md) rubrics: factual accuracy, citation accuracy, completeness, tool efficiency.

## Multi-turn drift

Single-turn cases miss the failure mode where state from turn N contaminates turn N+1 (system-reminder leakage, tool-output framing, premature tool use). Cover at least a handful of 3+ turn trajectories per surface.

## Interleaving, not length, is the variable

The stronger version of drift: what breaks a conversational agent is **concurrent tasks with context switching**, not a long single-task dialogue. Benchmarking agents through one long conversation carrying several simultaneous tasks found models "in general perform well on single-task interactions" but **degrade on the same tasks once interleaved** — and that short-context models with a long-term memory system matched or exceeded larger-context models ([arXiv:2409.20222](https://arxiv.org/abs/2409.20222), NeurIPS D&B 2024). Two consequences for case design:

- A suite of long *single-task* trajectories will pass while production fails. Build cases that **interleave two or three tasks and switch between them**, which is the real shape of [sms-multi-thread-chatbot](../topics/sms-multi-thread-chatbot.md) traffic and what [flat-channel-thread-tracking](flat-channel-thread-tracking.md) exists to handle.
- Do not treat "bigger context window" as the fix you're measuring against; memory architecture beat window size on this benchmark.

A survey of ~250 sources on multi-turn agent evaluation names the same failure at the field level: current methods "tend to assess conversation turns in isolation rather than holistically, which limits the ability to capture the dynamic interplay among successive turns." Its component decomposition — end-to-end experience, action/tool use, memory, planner — is a usable coverage checklist for a trajectory suite; see [references-multi-turn-agent-eval](../references/references-multi-turn-agent-eval.md).

## Frontier (2026): reward models, failure attribution, dual-control

The eval frontier is moving from scoring a final state to scoring and *diagnosing* the whole trajectory:

- **Trajectory-level reward modeling.** Plan-RewardBench (Wang et al., *Aligning Agents via Planning*, [arXiv:2604.08178](https://arxiv.org/abs/2604.08178), ACL 2026) tests whether judges/reward models can tell a preferred trajectory from a confusable distractor across safety-refusal, tool-irrelevance, complex-planning, and error-recovery families. Finding: generative, discriminative, *and* LLM-judge evaluators all **degrade sharply on long-horizon trajectories** — a scorer calibrated on short tasks is not trustworthy on long ones.
- **Automated failure attribution.** AgentRx (Barke et al., *Diagnosing AI Agent Failures from Execution Trajectories*, [arXiv:2602.02475](https://arxiv.org/abs/2602.02475), Feb 2026) synthesizes constraints, checks them step-by-step, and pinpoints the **critical failure step + category** with an auditable validation log — moving trajectory eval from "did it fail?" to "where, and why." Built on 115 hand-annotated failed runs across API workflows, incident management, and web/file tasks.
- **Dual-control conversational eval.** τ²-Bench (Barres et al., [arXiv:2506.07982](https://arxiv.org/abs/2506.07982), Jun 2025) models a domain where **both agent and user act with tools** (a Dec-POMDP); agents show large performance drops moving from no-user to dual-control, separating reasoning errors from communication/coordination errors. Directly relevant to a conversing task agent that must *guide* a user who also acts.

## Two instruments that see what pass/fail hides

Aggregate task success is not just coarse — it is *structurally blind* to two things, and both have a cheap fix.

**Partial credit, governed by humans and grounded in evidence.** A binary verifier reduces a trajectory to whether the official check passed, so "a skill can alter execution without changing the final outcome." GCPC ([arXiv:2608.27487](https://arxiv.org/abs/2608.27487)) keeps checklists trustworthy at scale by splitting the roles: **humans define reusable rules once**, an LLM instantiates a task-specific checklist grounded in the task instruction and the official verifier, a judge scores each item **from execution-log evidence alone and abstains when evidence is missing**, and a separate scripted step applies the official verifier outcome. It discriminates official PASS from FAIL better than holistic judging (AUC **0.689 vs 0.619**) on 4,455 deduplicated SkillsBench trajectories, and transfers to Terminal-Bench and SWE-bench. The number that shows what binary scoring loses: among 879 with/without-skill pairs whose **binary outcome did not change**, **20.9% improved by >0.10 and 18.7% regressed by the same margin**. Two design details worth copying regardless of the framework — *abstain on missing evidence* (a judge that guesses from absence manufactures signal), and *keep the deterministic verdict out of the judge's hands*.

**Action-class calibration, separated from execution.** Aggregate multi-turn tool-calling accuracy averages over situations that call for different *kinds* of action. Decomposing a four-class action space (`TOOL_CALL` / `ASK` / `REFUSE` / `CONFIRM`) yields a self-revealing bound, **Acc ≤ GAR** (Gold Action Recall): a violation (Acc > GAR) exposes a **state grader masking miscalibration**, while large slack (GAR ≫ Acc) localizes the failure *inside* `TOOL_CALL` ([arXiv:2609.00949](https://arxiv.org/abs/2609.00949), Findings of EMNLP 2026). Two mechanics matter before quoting its numbers (source-level read, 2026-09-12): the classes are recovered **post-hoc** — `TOOL_CALL` from emission syntax, the other three from cue phrases matched anywhere in the text under a fixed priority — and GAR is **case-level any-turn**, which the appendix's turn-level recomputation inflates by a median **1.23×** (up to 2.22× in one cell) over the per-turn rate.

Calibration is reshapable by context-only perturbations, but not portably: injecting a state-reporting instruction moved task accuracy **+11.5 pp for one model family and −21.0 pp for another on the same scenario**. The mechanism is the interesting half — on the losing family GAR sat at the **100% ceiling both before and after**, so the entire loss came from what the re-decoded trajectory then executed, not from which action class it chose. An intervention can leave the decision policy correct and still wreck the run; separating the two is the whole point of the decomposition. For a confirm-before-act agent this is the diagnostic that separates "chose to act when it should have asked" from "asked correctly, then called the wrong tool" — see [confirm-before-act](confirm-before-act.md), and [turn-outcome-signal](turn-outcome-signal.md) for the action class read as a production instrument rather than an eval one.

## The granularity question, answered by staging

Both instruments above still assume you picked a unit. *DynSTEER* ([arXiv:2609.14637](https://arxiv.org/abs/2609.14637), v2 2026-09-15) states the tradeoff plainly: whole-trajectory verification is **too coarse** to locate a concrete failure and its evidence in a long run, while atomic-step scoring is **too fine-grained, noise-sensitive, and expensive**. Its answer is to segment a rollout at **key execution nodes** and adapt the review tier to what each stage returned — cheap checks where a stage looks clean, expensive ones where it does not.

Two design details are worth copying independently of the framework:

- **A path-tolerant milestone graph compiled from *public* task views.** Many valid trajectories reach the same milestones; grading against a single reference trajectory penalizes legal paths. Compiling from public views is what keeps the reference from leaking the answer — the same discipline as a frozen holdout.
- **Terminate unrecoverable runs.** Reported at **45.41% of execution steps saved on failed rollouts**, with evaluation discriminability up **85.2%** over native evaluation and all model pairs separated at statistical significance. Early stopping is not just a cost lever; on a failed run the remaining steps carry almost no signal. See [adaptive-eval-budget](adaptive-eval-budget.md) and [eval-statistical-significance](eval-statistical-significance.md).

## Reliability is a separate family from correctness

A trace-backed methodology for enterprise analytics agents ([arXiv:2609.09182](https://arxiv.org/abs/2609.09182), submitted 2026-08-28) grades three families — **semantic understanding, execution quality, and reliability** — using question banks with human golden answers, **repeated runs**, and runtime traces, with a run-validity check before any scoring and abstention-aware tiered scores that "feed a decision framework rather than a release gate."

Its case study is the useful part, because the headline improvement hid three regressions. On 50 questions, two model configurations, three randomized repetitions (300 traces), the higher-capability configuration cut early refusal from **73% to 0%** and raised real-data answers from **21% to 73%** — while **exhausting the tool-round budget on 16% of runs**, **overrunning the schema-exploration budget on 77% of traces**, and **changing its table interpretation on 41 of 50 questions**. That last number is the one to keep: a metric averaged over one run per question cannot see it at all, and it is the difference between an agent that is right and an agent you can trust twice. Repeated runs are how instability becomes visible ([golden-snapshot-eval](golden-snapshot-eval.md), [text-to-sql-retrieval](text-to-sql-retrieval.md)).

*Scope:* one controlled internal agent at one marketplace, anonymous model configurations, 50 questions. Cite the methodology and the failure shape, not the percentages as benchmarks.

## References

- Anthropic, *Building Effective Agents* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Anthropic, *How We Built Our Multi-Agent Research System* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- LangSmith, *Evaluate a Complex Agent* — [references-eval-reading-list](../references/references-eval-reading-list.md)
