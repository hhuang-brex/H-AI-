---
id: dry-run-and-preview
type: concept
tags: [agent, execution, dry-run, preview, confirmation, engineering-excellence]
summary: "computing the full effect of an action without committing it, so the user (or the agent) can inspect exactly what will happen before it does."
related:
  - [[action-execution-safety]]
  - [[confirm-before-act]]
  - [[hard-surface-irrevocability]]
  - [[tool-use-design]]
  - [[mid-task-steering]]
status: living
created: 2026-06-11
---

# Dry-Run & Preview

A dry-run computes everything an action *would* do — the rows it would change, the message it would send, the total it would charge — and returns that as data without committing it. Preview is showing that computed effect to a human before they approve. Together they turn "trust me, I'll do the right thing" into "here is exactly what I'm about to do."

## Dry-run is a first-class tool mode, not an afterthought

A side-effecting tool should be able to run in two modes: *compute the effect* and *commit the effect*. The dry-run mode returns the same plan the commit mode would execute — the literal SMS text and recipient, the exact list of 200 transactions about to be re-tagged, the precise refund amounts — so nothing is recomputed between preview and commit. The dangerous bug is a preview that *describes* the action in prose while the commit *recomputes* it: the user approves one thing and a subtly different thing fires.

## Preview powers the confirm gate

[confirm-before-act](confirm-before-act.md) is only as good as what it shows. "Proceed? (y/n)" with no preview is approval theater; "Send this exact SMS to +1-555-0142, and 2 others — preview attached?" lets the user actually catch the error. The preview *is* the content of a meaningful confirm gate — especially for wide-blast-radius or irreversible actions ([hard-surface-irrevocability](hard-surface-irrevocability.md)).

## The agent should preview to itself, too

Preview isn't only for humans. The agent can dry-run an action and check the computed effect against its own constraints before committing — "this re-tag would touch 200 rows; my plan expected ~10; halt and reconsider." A dry-run that diverges sharply from the plan's assumption is a strong replan/steer signal ([mid-task-steering](mid-task-steering.md)).

## Preview must match commit — or it's worse than nothing

The invariant: *what the preview shows is byte-for-byte what commit does.* If they can diverge, the preview actively misleads — the user vets a safe-looking plan and an unsafe one executes. Compute once (dry-run), show that, then commit *that same computed plan* — don't recompute at commit time from possibly-changed inputs.

## Pitfalls

- **Prose preview, recomputed commit.** The two drift; the user approved a fiction.
- **Preview that mutates.** A "dry-run" that actually writes (e.g. creates a draft that auto-sends) — it must have zero side effects.
- **No preview on wide-blast actions.** Bulk operations with only a count ("update 200 records?") and no sample of *which*.
- **Stale preview committed.** Time passes between preview and approve; inputs changed; commit acts on the old plan without flagging the drift.

## References

[confirm-before-act](confirm-before-act.md) is the gate that consumes a preview; [idempotency-keys](idempotency-keys.md) ensures the committed plan fires exactly once.
