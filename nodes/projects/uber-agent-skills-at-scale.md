---
id: uber-agent-skills-at-scale
type: project
kind: snapshot
tags: [skills, eval, telemetry, cost, production, case-study, agents]
summary: "Uber's account of running 5,000+ agent skills at 1M invocations a month: tiered review, per-skill telemetry, with-and-without ablation evals, an agent-filed friction log, and where the cost savings came from."
related:
  - [[agent-skills-progressive-disclosure]]
  - [[skill-injection-decision]]
  - [[skill-lifecycle-and-drift]]
  - [[skill-text-authoring]]
  - [[llm-as-judge]]
  - [[llm-observability]]
  - [[cost-aware-eval]]
  - [[harness-token-economics]]
  - [[mcp-tool-layer]]
  - [[background-agent-execution]]
  - [[references-agent-skill-authoring]]
status: snapshot
created: 2026-11-24
---

# Uber Agent Skills at Scale

**Source:** Andrew Mager, Jason Varbedain, and Uday Kiran Medisetty, *How Uber Evals 1 Million Agent Skill Invocations a Month* ([Uber engineering blog](https://www.uber.com/us/en/blog/optimizing-ubers-agent-skills/), 2026-11-23, fetched 2026-11-24). This is a company's report on its own system. Every number below is self-reported, and none is independently reproduced.

## What it is

Uber runs an internal marketplace of agent skills — Markdown `SKILL.md` folders in the [agent-skills-progressive-disclosure](../concepts/agent-skills-progressive-disclosure.md) format — used across Claude Code, OpenCode, Codex, and Uber's own agent.

| Measure | Reported value |
|---|---|
| Skills in the marketplace | 1 in October 2025 → more than 5,000 by November 2026 |
| Invocations | more than 1 million in one month |
| Always-on skills enabled for everyone | about 100 |

## How they govern it

- **Three review tiers in one git repo.** *Domain* skills need one peer approval plus CI; *core* skills are tested and reviewed by the platform team; *always-on* skills are the small set everyone loads.
- **One installer across agents.** An internal CLI installs a skill or a bundle of skills into every agent, merging six configuration layers. Uber now **blocks `.mcp.json` files inside skills**.
- **Telemetry without content.** OpenTelemetry hooks record which skill ran, its version, and how it was invoked, with "no prompt text and no file contents." From this they compute 12 measures per skill, including users, retention, cost, latency, and errors.
- **A linter for skill text.** Pass/fail checks such as numbered steps, verifying each result, and an error-recovery table — "'Try again' doesn't count." See [skill-text-authoring](../concepts/skill-text-authoring.md).
- **Agents report their own friction.** An always-on skill lets agents file a "papercut" when something gets in their way. They filed thousands in three months, and hundreds were fixed — such as a deployment skill passing seconds where an API expected milliseconds.

## How they evaluate

- **Mixed suite:** about 5% golden cases, 80% real prompts graded on the agent's trajectory, and 15% judged by the skill's author.
- **Clean-room runs** in three environments exposed hidden dependencies on file paths, cached documents, and operating-system tools — the undeclared closure that [skill-lifecycle-and-drift](../concepts/skill-lifecycle-and-drift.md) warns about.
- **With-and-without ablation.** Each skill is replayed with and without it, and a blind judge picks the better answer. This is the same test [skill-injection-decision](../concepts/skill-injection-decision.md) recommends.
- **Blocked pull requests become eval cases** — human rejections feed the suite.

On a warehouse-query skill, sessions *without* it made 13% more tool calls, had six times as many tool errors, took 31% longer, and lost 87% of blind comparisons.

## Where the savings came from

| Change | Reported effect |
|---|---|
| Run a cheaper model as the skill's worker | Tracing skill cost per invocation down 46%; a deployment skill showed no change in its first week |
| Run the skill's script when it loads, instead of on a later turn | Search skill from four turns to three; mean cost down 32% |
| Move polling to a cheaper background agent | Notification turns were about a third of spend in the 20 most expensive sessions — see [background-agent-execution](../concepts/background-agent-execution.md) |
| Code mode instead of loaded MCP tools | With 100+ MCP tools installed, definitions cost 50,000–70,000 tokens before any input; a 50-row query was estimated at 1.4M tokens via tools versus 900 via code — see [mcp-tool-layer](../concepts/mcp-tool-layer.md) |

Cost per invocation is measured as the session's total cost just after the skill call minus the total just before, averaged. The authors note this window includes other tool calls.

## Lessons worth keeping

- **An eval that always passes is suspect.** Evals passing 70–90% of runs "can be more useful than those that pass 100%," because a perfect score may mean the eval cannot detect change.
- **An LLM judge needs a human-labeled set** to calibrate against — consistent with [llm-as-judge](../concepts/llm-as-judge.md).
- **More words can hurt as models improve.** Some skills should be retired, not refined.
- **The biggest wins give the agent access**, to internal documents or warehouse queries, rather than describing what it could already do.

## Known gaps

The post reports no trigger-accuracy numbers and does not describe rewriting descriptions or consolidating skills. It names the open problem as evaluating workflows that "run rarely, matter a lot, and are hard to judge." Planned work includes A/B testing, compiling skills per model, and a task router.
