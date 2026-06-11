---
id: rollback-and-compensation
type: concept
tags: [agent, execution, rollback, compensation, saga, consistency, engineering-excellence]
summary: "undoing a multi-step action that failed halfway — true rollback where possible, compensating actions where not — to avoid leaving the world half-changed."
related:
  - [[action-execution-safety]]
  - [[idempotency-keys]]
  - [[plan-execute-replan]]
  - [[hard-surface-irrevocability]]
  - [[decision-audit-trail]]
status: living
created: 2026-06-11
---

# Rollback & Compensation

A multi-step action that fails partway leaves the world inconsistent: three of five refunds issued, the spend limit raised but the memo write failed. Rollback and compensation are how an agent restores consistency — undoing what was done so a half-completed task doesn't become corrupt state.

## Rollback vs. compensation

| Approach | Mechanism | When it applies |
|---|---|---|
| **Rollback** | A real transaction; nothing commits until all steps succeed | Steps share one transactional resource (one DB) |
| **Compensation** | Each completed step has an explicit "undo" action run in reverse | Steps span systems that can't share a transaction (the common agent case) |

Agents rarely get true rollback — their steps cross services (charge a card *and* send an SMS *and* write a record), none of which enrol in a shared transaction. So the workhorse is **compensation**: the saga pattern. Each forward action defines its inverse (refund compensates charge, retraction-message compensates send-where-possible), and on failure the agent runs the inverses for the steps that did complete, in reverse order.

## Some actions have no inverse — design around them

A sent SMS can't be unsent ([hard-surface-irrevocability](hard-surface-irrevocability.md)). When a step has no compensation, the safe design is to **order irreversible steps last**: do everything reversible first, get past the points that could fail, and fire the irreversible action only when the rest has succeeded. Then a mid-task failure leaves only undoable state behind. If two irreversible steps are unavoidable, that's a confirm-and-accept-risk situation, not a rollback situation.

## Compensation depends on idempotency

Running the inverses must itself be safe to retry — the rollback can crash too. So compensating actions need [idempotency-keys](idempotency-keys.md) just like forward ones: "refund for charge K" must produce one refund even if the compensation step replays. Rollback without idempotent compensation just moves the double-effect bug into the recovery path.

## The audit trail is the rollback ledger

You can only compensate steps you *know* completed. The [decision-audit-trail](decision-audit-trail.md) — "executed step S, key K, at T" — is exactly the record the rollback reads to decide which inverses to run. No durable record of what completed → no reliable compensation.

## Ties into replanning

A failed step that triggers compensation is a [plan-execute-replan](plan-execute-replan.md) event: undo the diverged work, then decide whether to retry a different path or yield. Compensation cleans up; replanning decides what to do next.

## Pitfalls

- **No compensation defined.** A bulk action fails at step 3 of 5 and leaves 2 done with no way back.
- **Irreversible step early.** Firing the un-undoable action before the steps that might fail.
- **Non-idempotent compensation.** The undo double-runs and over-corrects (two refunds).
- **Compensating without an audit ledger.** Guessing which steps completed; under- or over-compensating.

## References

[idempotency-keys](idempotency-keys.md) is required for safe compensation; [hard-surface-irrevocability](hard-surface-irrevocability.md) is the class of step that can't be compensated and must be ordered last.
