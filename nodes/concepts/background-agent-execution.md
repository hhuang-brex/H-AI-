---
id: background-agent-execution
type: concept
tags: [agent, harness, background, async, detached, supervisor, scheduling, lifecycle, engineering-excellence]
summary: "the detached execution lifecycle: a run that keeps going after the launching client leaves, whose lifecycle a supervisor or managed service owns — covering fleet registry + per-run addressability, workspace/concurrency isolation, session-independent triggers (schedule/webhook/VCS), zero-token waiting, and out-of-band completion/needs-input signaling for jobs nobody is watching."
related:
  - [[agent-harness]]
  - [[managed-agent-apis]]
  - [[multi-agent-delegation]]
  - [[subagent-context-isolation]]
  - [[interrupt-and-resume]]
  - [[run-state-model]]
  - [[agent-state-persistence]]
  - [[crash-recovery-consistency]]
  - [[step-budget-and-runaway-control]]
  - [[harness-token-economics]]
  - [[llm-observability]]
  - [[when-to-delegate]]
status: living
created: 2026-07-12
---

# Background Agent Execution

A **background** (or **detached**) agent run keeps executing after the terminal, browser, or client that launched it goes away. Its lifecycle is owned by something *other than the launcher* — a local **supervisor** process or a managed cloud/CI service — the launcher does not block, and because **no one is watching the token stream**, the run must signal completion / failure / needs-input **out-of-band** (a notification, a Slack message, an opened PR, a webhook, a pollable status) rather than by returning inline. This node owns that detached lifecycle: who owns the run when the launcher leaves, how the run signals back, how many run in parallel without colliding, and what wakes them up.

The shared four-part definition is doc-verifiable across six shipping systems (Claude Code background agents, Claude Code Routines, Claude Code on the web, Anthropic Managed Agents, OpenAI Codex cloud, Cursor Cloud Agents, GitHub Copilot coding agent): (1) executes without an attached client; (2) lifecycle owned by supervisor/service, not launcher; (3) launch-and-walk-away; (4) out-of-band async signaling, not inline return.

## What this is NOT — three hard boundaries

Detachment is orthogonal to the neighbors it is easily confused with. Draw the lines precisely:

- **Not [multi-agent-delegation](../topics/multi-agent-delegation.md) / [subagent-context-isolation](subagent-context-isolation.md).** Delegation is the *decision* to spawn a scoped child; detachment is the *relationship* between a run and the session that launched it. Claude Code's own docs enforce the split: subagents "run in their own context window" but "work within a single session" and **return results inline** to the parent (attached, synchronous), whereas a background agent is "a full Claude Code conversation that keeps running without a terminal attached." A boxed note: *"Subagents work within a single session. To run many independent sessions in parallel and monitor them from one place, see background agents."* A subagent is never detached; a background agent is a top-level session, not a subagent. They **compose** — a detached top-level agent may use subagents internally — but neither subsumes the other.
- **Not [run-state-model](run-state-model.md) / [agent-state-persistence](../topics/agent-state-persistence.md).** Durable state is the *necessary substrate* for detachment but not *sufficient*: a fully attached synchronous run can be durable too. Persistence answers "what state survives a crash"; detachment adds attachment topology, fleet monitoring, and out-of-band signaling **on top of** persistence.
- **Not [interrupt-and-resume](interrupt-and-resume.md), but its inverse and complement.** Interrupt-and-resume is human→run (a person pauses/resumes a live run). Detachment adds (a) the run-continues-with-no-human-attached case and (b) the inverse run→human async signal.
- **Not [managed-agent-apis](managed-agent-apis.md), which is one delivery vehicle.** That node is the build-vs-buy *tier* decision (Messages call → self-hosted loop → hosted harness). A hosted harness is *one* way to get detached execution — but detached execution also lives in a **local supervisor** and in **CI**, so it is the execution-topology *property*, not a synonym for "buy the hosted harness."

## Attached vs. detached — the topology axis

The genuinely new axis: does a run need a live session attached? An **attached** run dies when its client disconnects and returns its result inline. A **detached** run outlives the client and is addressable by a stable handle (session ID) for later attach / logs / stop. `Detach ≠ stop` is an explicit design rule — leaving never kills the run; on re-attach the harness posts a recap of what happened while you were away, and **peek** (read latest output without attaching) is a distinct read-only primitive from **attach** (take over the interactive session).

## Lifecycle ownership & where-it-runs (durability tradeoff)

Who owns a detached run determines its durability:

| Owner | Example | Survives | Durability limit |
|---|---|---|---|
| **Local supervisor** | Claude Code background agents (per-user supervisor process) | sleep, shell close, agent-view close, supervisor restart | **stops on machine shutdown** (shows as `failed`); idle process reaped after ~1h, restarts from checkpoint on next access |
| **Cloud managed** | Claude Code on the web / Routines, Managed Agents, Codex cloud, Cursor Cloud Agents | client disconnect, laptop closed | data-residency: Managed Agents is stateful server-side → **not ZDR / HIPAA-BAA eligible** |
| **CI runner** | GitHub Copilot coding agent (GitHub Actions) | — | hard **59-minute** execution cap, "cannot be extended or bypassed" |

Claude Code's supervisor is the canonical DIY instance: a per-user daemon separate from the terminal, with an on-disk registry — `~/.claude/daemon/roster.json` (running-session list, "used to reconnect after a restart") and `~/.claude/jobs/<id>/state.json` (per-session state). Only durably-recorded progress survives a supervisor restart: a finished background shell command "is reported as completed," a dynamic workflow "resumes from where it left off," a background subagent "resumes from its own transcript" — but state that "lives only inside the process itself stops with it."

Making that checkpoint/restore *efficient* is an emerging systems problem: **Crab** ([arXiv:2604.28138](https://arxiv.org/abs/2604.28138), 2026-04-30) is a semantics-aware host-side runtime that bridges the "agent-OS semantic gap" — turn-aware selective checkpoint/restore of sandbox state, skipping the >75% of turns with nothing recoverable. Self-reported: recovery correctness →100%, up to 87% less checkpoint traffic, within 1.9% of fault-free execution time. It is the durability layer under "resumes from checkpoint," distinct from the run-state a harness persists itself.

## The fleet registry & per-run addressability

Running many detached runs needs a **monitoring surface** and **stable per-run handles** — state *about the fleet*, distinct from state *within a run* ([run-state-model](run-state-model.md)). Claude Code agent view (`claude agents`) is "one screen for all your background sessions: what's running, what needs your input, and what's done," with a **six-value status model on two orthogonal axes**: task-status (Working / Needs-input / Idle / Completed / Failed / Stopped) × process-liveness (alive vs. exited-but-restartable). CLI handles: `claude attach/logs/stop/respawn/rm <id>`, `claude agents --json` (machine-readable roster with `state` + a `waitingFor` field). Cursor's REST API is the hosted analog — `GET /v1/agents` (paginated), `POST /v1/agents/{id}/runs`, run states `CREATING/RUNNING/FINISHED/ERROR/CANCELLED/EXPIRED`, with a **concurrency guard** (`409 agent_busy` — one active run per agent) and **idempotent create** (client-supplied `agentId`, `409 agent_id_conflict`) — the fleet-level application of [idempotency-keys](idempotency-keys.md). Managed Agents exposes the same via server-side Session objects.

## Out-of-band signaling — the run→human channel (genuinely new)

The graph owns human→run (interrupt-and-resume) but nothing owned the inverse: a detached run **actively telling the human it is done / failed / blocked** when no one is watching. This is a first-class harness output a detaching agent MUST build. **Poll and push are a dual mechanism** — build both, because push can be missed and polling N jobs doesn't scale:

- **Push:** Claude Code fires the `Notification` hook with `agent_completed` / `agent_needs_input`; Managed Agents webhooks emit `session.status_run_started` / `session.status_idled` (awaiting input) / `session.status_rescheduled` (auto-retrying transient error) / `session.status_terminated`, signed, at-least-once, unordered (sort by `created_at`). Cursor/Codex ship Slack/push notifications.
- **Poll:** status GET, terminal tab-title count ("2 awaiting input"), `--json` roster.
- **Deliverable-as-signal:** Copilot/Cursor/Codex use an **opened PR + diff** as the completion signal.

## Needs-input parking & pre-authorization

A detached run **cannot block on an interactive permission or clarification prompt** because no client is attached. Two resolutions: **pre-authorize scope** (Routines run with "no permission-mode picker and no approval prompts during a run," scoped by environment / connectors / branch-push settings) or **park in a needs-input state and notify** (agent view's yellow "Needs input" + `agent_needs_input`; Managed Agents `session.status_idled`, resumed by an ingress event such as an approval). This raises the stakes for action-execution-safety: pre-authorizing an unattended run widens blast radius, and a parked run must persist *what it is blocked on* so a human can answer later.

## Triggers decoupled from a live human session (genuinely new)

Detached runs launch not just from a person but from session-independent triggers — the wakeup surface no existing node owned:

- **Time-based:** Managed Agents **Deployments API** (POSIX 5-field cron + IANA timezone, minute granularity, ≤10s jitter, no backfill of missed triggers after unpause, auto-pause on unrecoverable error); Codex **Scheduled tasks** use RRULE/RFC-5545 (not cron); Copilot automations "on a schedule." *Same capability, three schedule dialects — a portability caveat.*
- **Event/ingress:** Routines `/fire` HTTP POST; Codex/Cursor APIs; Claude Code `asyncRewake` / `FileChanged` hooks; `@mention`, issue-opened.
- **VCS event:** Routines & Copilot on `pull_request`/`release`; Cursor on GitHub comments.

Each scheduled fire typically **starts a new session** (carrying an initial message) rather than resuming a suspended one — "scheduled run" and "resume a paused session" are distinct mechanisms.

## Workspace & concurrency isolation

Parallel detached runs need isolation of *where their file writes and process live* — a separate axis from [subagent-context-isolation](subagent-context-isolation.md) (which governs what a child reads/returns). Two grains dominate: **git worktree-per-job** for local parallelism (Claude Code moves a background session into an isolated worktree under `.claude/worktrees/` before its first edit, holding a `git worktree lock`; each also gets `CLAUDE_JOB_DIR` scratch) and **container/VM sandbox-per-task** for cloud (fresh isolated VM, scoped/proxied credentials, tiered network egress). Both reconcile via **branch-per-agent + pull request**. Failure mode is vendor-acknowledged: in a **non-git directory**, Claude Code background sessions "write to the working directory directly and aren't isolated from each other" — parallel edits to the same files collide. Note also the **ephemeral sandbox is a second durability layer separate from run-state**: Codex caches container state ~12h, Devin/Cursor snapshots are discarded on session end — any artifact not pushed to a durable store (git/PR) is lost.

## What a detached job must persist that an interactive one needn't

An interactive run offloads these to the human and the live chat window. A detached job must own: (a) a **liveness/registry entry** so a supervisor can find and restart it; (b) a **self-describing status + what-it's-blocked-on** field, legible without the transcript; (c) durable **per-job logs** as the only inspection surface; (d) a **notification/callback target** for terminal states; (e) an explicit **routing/handle** so a detached observer can reattach.

## Connections that amplify existing nodes

Detachment doesn't just consume [agent-state-persistence](../topics/agent-state-persistence.md) as substrate — it *amplifies* two cost nodes. [step-budget-and-runaway-control](step-budget-and-runaway-control.md): an unwatched runaway is worse because nobody notices, so ceilings/depth-caps matter more (Copilot enforces a 59-min cap). [harness-token-economics](harness-token-economics.md): fleets multiply spend — agent view warns "running ten agents in parallel uses quota roughly ten times as fast." The **zero-token-waiting** principle (suspend at ~no cost, resume on ingress rather than holding an expensive live poll loop) is the architectural motive for the trigger surface — though note this is the economics *principle*, **not** a confirmed vendor zero-idle-billing guarantee.

## Builder guidance

Detach a task when it runs minutes-to-hours or should proceed without a human watching. Detaching forces, on top of persistence: (1) a completion/failure **notification channel** (poll *and* push); (2) a **monitoring/roster surface** with per-run handles (list/attach/logs/stop); (3) a **needs-input parking state** — pre-authorize a safe tool/action scope or park+notify, never deadlock on a prompt; (4) a **where-it-runs decision** (local = simple but dies on shutdown; cloud = durable but data-residency tradeoffs; CI = time-capped); then pick a **trigger model** (human / schedule / webhook / VCS event) and **budget the fleet, not just the single run**. For write fan-out, give each job a worktree/sandbox + a parent-owned merge step; read-only fan-out needs no workspace isolation.

## Pitfalls

- **Blocking on a permission prompt** when nobody is attached — the run deadlocks silently. Pre-authorize or park+notify.
- **No out-of-band channel** — the job finishes/fails and no one ever finds out.
- **Push-only signaling** — notifications missed (e.g. fire only while the view is open); add a pollable status.
- **Parallel writes with no workspace isolation** — N agents race on shared files (esp. non-git dirs).
- **Treating the sandbox as durable** — artifacts not pushed to git/PR vanish on session end.
- **Budgeting one run, not the fleet** — ten parallel agents burn quota ~10×.
- **Assuming a scheduled fire resumes a session** — it usually starts a fresh one; state must be seeded or re-derived.

## References

The clearest single primary doc is Claude Code's **agent view** (`claude agents`, research preview v2.1.139+), which hits all four definitional attributes plus the supervisor, on-disk registry, six-value status model, and completion/needs-input notifications. Corroborated by Managed Agents **webhooks** + **scheduled deployments** (the hosted registry + cron surface), Cursor **Cloud Agents API** (formerly "Background Agents"), OpenAI **Codex cloud**, and **GitHub Copilot coding agent** (CI-runner variant, 59-min cap). *Unconfirmed against primary docs:* Devin's detached lifecycle/session model (intro page under-specifies; treat vendor "autonomous" framing as unverified); explicit completion-notification channels for Codex cloud and Copilot; Managed Agents zero-idle-token billing.
