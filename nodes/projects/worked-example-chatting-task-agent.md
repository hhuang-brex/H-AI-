---
id: worked-example-chatting-task-agent
type: project
kind: worked-example
tags: [worked-example, agent, control-loop, code, chat, engineering-excellence]
summary: "annotated code for one end-to-end chatting task agent — control loop, tools, planning, context, HITL, execution safety, persistence — threading the agent concept cluster into a single runnable shape."
related:
  - [[simulated-user-eval]]
  - [[execution-invariant-testing]]
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[task-planning]]
  - [[context-engineering]]
  - [[human-in-the-loop-control]]
  - [[action-execution-safety]]
  - [[agent-state-persistence]]
  - [[multi-agent-delegation]]
  - [[perceive-reason-act-loop]]
  - [[idempotency-keys]]
status: snapshot
created: 2026-06-11
source-thread: [[2026-06-11-chatting-task-agent-buildout]]
---

# Worked Example — A Chatting Task Agent

The agent topics ([agent-control-loop](../topics/agent-control-loop.md), [tool-use-design](../topics/tool-use-design.md), [task-planning](../topics/task-planning.md), [context-engineering](../topics/context-engineering.md), [human-in-the-loop-control](../topics/human-in-the-loop-control.md), [action-execution-safety](../topics/action-execution-safety.md), [agent-state-persistence](../topics/agent-state-persistence.md), [multi-agent-delegation](../topics/multi-agent-delegation.md)) each define a slice in isolation. This node threads them into **one** concrete agent so the seams are visible: a *card-dispute triage agent* that chats with a cardholder over SMS, investigates a disputed charge, and either resolves it or files a dispute (an irreversible action).

It is deliberately small but exercises every topic. Pseudocode is Python-flavored; the point is the *structure*, not a runnable repo.

## The task

> A cardholder texts "I didn't make this $240 charge at SHELL #4471." The agent investigates (pulls the transaction, checks for duplicates, checks the merchant), then either explains it away (resolve) or files a formal dispute (irreversible, money-moving). The cardholder can interrupt, correct, or abandon mid-flow.

This shape hits all eight topics: it loops, calls tools, plans multi-step, manages context across an async SMS gap, confirms before the irreversible file, must not double-file, and resumes if the cardholder replies hours later.

## The control loop (the spine)

[agent-control-loop](../topics/agent-control-loop.md) + [perceive-reason-act-loop](../concepts/perceive-reason-act-loop.md). One action per turn; re-perceive each iteration; explicit stop/yield/budget.

```python
def run(run_id):
    state = load_or_init(run_id)            # agent-state-persistence
    while True:
        if budget.exhausted(state):          # step-budget-and-runaway-control
            return halt(state, "budget")
        if (sig := check_interrupt(run_id)): # interrupt-and-resume
            return handle_interrupt(state, sig)

        ctx = assemble_context(state)        # context-engineering — built, not accumulated
        step = decide_next(ctx)              # perceive-reason-act: ONE action

        match step.kind:
            case "done":   return finish(state, step)
            case "ask":    return yield_to_user(state, step)   # stop-and-yield: blocked
            case "act":    state = execute(state, step)        # tool-use + action-safety
        checkpoint(state)                    # checkpoint-and-replay — after each step
```

The `while True` is not naive: every iteration first checks budget and interrupt, then re-perceives. The three `match` arms are exactly the three terminal/suspension outcomes of [stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md) plus "keep acting."

## Context assembly (every turn)

[context-engineering](../topics/context-engineering.md). The prompt is *constructed* from typed parts ([context-assembly-per-turn](../concepts/context-assembly-per-turn.md)), budgeted ([context-budget-allocation](../concepts/context-budget-allocation.md)), and the long async history is compacted to structured state ([context-compaction](../concepts/context-compaction.md)).

```python
def assemble_context(state):
    return Prompt(
        system   = TRIAGE_SYSTEM,                  # static, top (recency: stable up high)
        goal     = state.goal,                     # "triage dispute on txn T"
        facts    = state.established_facts,        # compacted, not raw transcript
        tools    = relevant_tools(state.phase),    # tool-selection: subset by phase
        last_obs = state.last_tool_result,         # reserved slot, never evicted
        recent   = last_n_turns(state, n=3),       # raw recent; older is in facts
    )                                              # output headroom reserved by builder
```

Note what is *not* here: the full SMS history. After an investigation step, "transaction T is $240 at SHELL #4471, no duplicate found" is a *fact* in structured state — the raw tool JSON and the model's prose that produced it are gone. This is [context-compaction](../concepts/context-compaction.md) as the same artifact as the persisted [run-state-model](../concepts/run-state-model.md).

## Planning (multi-step, replanned)

[task-planning](../topics/task-planning.md). Triage is genuinely multi-step with dependencies, so it earns an explicit plan ([goal-decomposition](../concepts/goal-decomposition.md)) that gets revised on findings ([plan-execute-replan](../concepts/plan-execute-replan.md)).

```python
plan = [
  Step("fetch_txn",        deps=[]),
  Step("check_duplicate",  deps=["fetch_txn"]),
  Step("check_merchant",   deps=["fetch_txn"]),    # parallel-eligible with check_duplicate
  Step("decide_outcome",   deps=["check_duplicate","check_merchant"]),
  Step("file_or_resolve",  deps=["decide_outcome"]),  # irreversible — ordered LAST
]
```

Two design choices straight from the concepts: `check_duplicate` and `check_merchant` are dependency-independent (fan-out eligible), and the irreversible `file_or_resolve` is **ordered last** — [rollback-and-compensation](../concepts/rollback-and-compensation.md)'s "irreversible steps last" rule, so a mid-plan failure never leaves a dispute half-filed. If `check_duplicate` finds the charge was a known recurring one, the agent *replans* — drops `file`, jumps to a "resolve + explain" path.

## Tools (the hands)

[tool-use-design](../topics/tool-use-design.md). Each tool has a sharp schema ([tool-schema-design](../concepts/tool-schema-design.md)); the dispute tool is the dangerous one.

```python
@tool  # read — no gate, idempotent by nature
def fetch_txn(txn_id: str) -> Txn: ...

@tool  # read
def check_duplicate(txn_id: str) -> list[Txn]: ...

@tool  # IRREVERSIBLE, money-adjacent — every safety mechanism applies
def file_dispute(txn_id: str, reason: Reason, idempotency_key: str) -> DisputeRef: ...
```

`file_dispute` carries an [idempotency-keys](../concepts/idempotency-keys.md) parameter; reads don't. Tool results re-enter the loop as compact facts, not raw dumps ([tool-result-grounding](../concepts/tool-result-grounding.md)) — `check_duplicate` returns "0 duplicates" as a fact, not 200 rows of account history.

## The irreversible action (where everything converges)

`file_or_resolve` is the step where [human-in-the-loop-control](../topics/human-in-the-loop-control.md) and [action-execution-safety](../topics/action-execution-safety.md) both fire.

```python
def execute_file(state):
    preview = file_dispute.dry_run(state.txn, state.reason)   # dry-run-and-preview
    if not confirmed(ask_user(preview)):                       # confirm-before-act
        return yield_to_user(state, "awaiting dispute confirmation")

    key = state.idempotency_key_for("file_dispute")            # stable across retries
    persist_intent(state, "about to file_dispute", key)        # write-ahead (checkpoint)
    ref = file_dispute(state.txn.id, state.reason, key)        # at-least-once call
    persist_result(state, ref)                                 # completion record
    return state.with_fact("dispute_filed", ref)
```

Every line maps to a concept: dry-run produces the preview, the confirm gate is a *blocked→yield* ([stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md)), the write-ahead intent+key makes the crash window safe ([crash-recovery-consistency](../concepts/crash-recovery-consistency.md)), and the idempotency key means a retry-after-crash files one dispute, not two.

## Persistence & resume (the async-SMS reality)

[agent-state-persistence](../topics/agent-state-persistence.md). The cardholder may reply hours later; the process will have died. `load_or_init` rehydrates [run-state-model](../concepts/run-state-model.md); the loop continues from the first pending step ([checkpoint-and-replay](../concepts/checkpoint-and-replay.md)). On resume, if state shows "about to file_dispute, key K" with no result, recovery queries the dispute system for K before re-filing ([crash-recovery-consistency](../concepts/crash-recovery-consistency.md)) — reconcile, don't restart.

## Mid-flow steering

[mid-task-steering](../concepts/mid-task-steering.md). Mid-investigation the cardholder texts "actually it was me, ignore it." The loop checks for input between steps, classifies it as an **abort**, and halts *before* `file_or_resolve` ever runs — the steer is honored before the irreversible step, exactly as the concept prescribes.

## Where delegation would (and wouldn't) enter

[multi-agent-delegation](../topics/multi-agent-delegation.md). This agent is single-loop by design — the steps share state and mostly serialize, so they're functions, not agents ([when-to-delegate](../concepts/when-to-delegate.md)). The *one* place delegation could pay: `check_duplicate` and `check_merchant` are independent and could fan out as isolated sub-tasks ([subagent-context-isolation](../concepts/subagent-context-isolation.md)). For two cheap reads it's not worth the spawn cost — a deliberate "don't delegate" call, which is the concept doing its job.

## What this grounds

| Topic | Where it shows up here |
|---|---|
| [agent-control-loop](../topics/agent-control-loop.md) | the `while` loop with budget/interrupt/perceive/act |
| [context-engineering](../topics/context-engineering.md) | `assemble_context`; facts-not-transcript |
| [task-planning](../topics/task-planning.md) | the 5-step plan with deps + irreversible-last + replan |
| [tool-use-design](../topics/tool-use-design.md) | sharp schemas; key on the dangerous tool only |
| [human-in-the-loop-control](../topics/human-in-the-loop-control.md) | confirm gate; mid-flow abort |
| [action-execution-safety](../topics/action-execution-safety.md) | dry-run, idempotency, write-ahead |
| [agent-state-persistence](../topics/agent-state-persistence.md) | load/checkpoint/resume across the SMS gap |
| [multi-agent-delegation](../topics/multi-agent-delegation.md) | the deliberate single-loop choice |

## Open follow-ups

- **Eval coverage** for this agent is its own gap — trajectory scoring of the plan path, a crash-injection test asserting one-dispute-per-run, an idempotency invariant test. A companion node connecting these to [llm-evaluation](../topics/llm-evaluation.md) is the natural next deepening pass.
- This is pseudocode; a runnable reference implementation (the way [spender-agent](spender-agent.md) could be built out) would be a separate project.
