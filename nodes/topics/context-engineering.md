---
id: context-engineering
type: topic
tags: [agent, context, prompt-assembly, token-budget, engineering-excellence]
summary: "the discipline of deciding what the model sees each turn — assembly, budget, and compaction — the master lever for agent cost, latency, and accuracy."
related:
  - [[references-context-and-memory]]
  - [[context-storage-and-hydration]]
  - [[agent-memory]]
  - [[worked-example-chatting-task-agent]]
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[context-assembly-per-turn]]
  - [[context-budget-allocation]]
  - [[context-compaction]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[sms-context-windowing]]
  - [[agentic-context-engineering-ace]]
  - [[agent-skills-progressive-disclosure]]
  - [[prompt-component-attribution]]
  - [[text-to-sql-retrieval]]
status: living
created: 2026-06-11
---

# Context Engineering

Every turn of an agent loop re-decides what the model sees: the system instructions, the goal, relevant history, tool definitions, the last tool result, retrieved knowledge. Context engineering is the discipline of making that assembly deliberate instead of accidental. It is the single highest-leverage engineering practice for a production agent — it dominates cost (tokens are the bill), latency (tokens are the clock), and accuracy (the model can only reason over what's in the window).

## Why it's a discipline, not a detail

The naive agent appends everything to a growing transcript and resends it every turn. This works in a demo and fails in production three ways at once: the bill grows quadratically with conversation length, latency creeps up turn over turn, and accuracy *drops* as the relevant facts get buried in middle-of-context noise. None of these are model problems — they are assembly problems, and they're fixable with explicit policy.

That accuracy drop is empirically documented, not folklore: models recall information at the *start or end* of a long context far better than the *middle* (Liu et al., "Lost in the Middle," 2023), and degrade with raw input length generally. Chroma's *Context Rot* (2025-07-14) quantified the latter across 18 models (GPT-4.1, Claude 4, Gemini 2.5, Qwen3, …): shrinking an input from ~113k tokens to the ~300 relevant tokens — same answer available in both — reliably *improved* accuracy, isolating input **length itself**, not task difficulty, as the cause. See [references-context-and-memory](../references/references-context-and-memory.md) for the verified sources — a bigger window is not a substitute for this discipline.

The field now has a formal survey — *A Survey of Context Engineering for Large Language Models* (Mei et al., [arXiv:2507.13334](https://arxiv.org/abs/2507.13334); 166 pp, 1,411 citations) — whose taxonomy (context retrieval & generation / processing / management) maps closely onto this cluster. It also names a second, *output-side* axis distinct from the input-side degradation above: a **"fundamental asymmetry"** — models understand rich context far better than they can *generate* equally sophisticated long-form output. Context engineering optimizes what goes *in*; that asymmetry is a standing limit on what reliably comes *out*.

The frame: treat the context window as a **managed budget**, not an append log. Each turn, you *construct* the prompt from parts, each part earning its place.

## The three decisions

| Decision | Failure if wrong | Concept |
|---|---|---|
| What goes into this turn's prompt? | Missing the fact the model needed; or drowning it in noise | [context-assembly-per-turn](../concepts/context-assembly-per-turn.md) |
| How is the token budget split and what gets evicted? | OOM the window; or evict the one thing that mattered | [context-budget-allocation](../concepts/context-budget-allocation.md) |
| How do you fit a long history into a short window? | Lose earlier decisions; or pay to resend everything | [context-compaction](../concepts/context-compaction.md) |

## Connections

- **Loop:** context assembly *is* the "perceive" step of [perceive-reason-act-loop](../concepts/perceive-reason-act-loop.md). A loop that doesn't re-assemble context each turn acts on stale perception.
- **Tools:** tool results are the fastest way to blow the budget; [tool-result-grounding](../concepts/tool-result-grounding.md) and [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) keep large results out of the window.
- **Memory:** [conversation-memory](../concepts/conversation-memory.md) is *what* to remember across turns/sessions; context-engineering is *how* that memory is selected into a given prompt. They compose.
- **Knowledge:** [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) covers RAG / prompt-stuffing / structured-state as ways to get domain facts in; this topic is the budget and assembly logic around them.
- **SMS slice:** [sms-context-windowing](../concepts/sms-context-windowing.md) is the channel-specific instance of these decisions.
- **Optimizing the context itself:** [agentic-context-engineering-ace](../concepts/agentic-context-engineering-ace.md) treats the assembled context as an evolving playbook (generate/reflect/curate) — the structural counterpart to optimizing instruction prose ([offline-prompt-optimization](../concepts/offline-prompt-optimization.md)).
- **Loading capability lazily:** [agent-skills-progressive-disclosure](../concepts/agent-skills-progressive-disclosure.md) packages domain procedure as a SKILL.md folder loaded in three stages (metadata always, instructions on match, files on demand) — progressive disclosure applied to *capability*, so many skills cost almost no base-prompt budget.

## The one rule

**You should be able to print, for any turn, exactly why each token is in the window.** If the prompt is "whatever accumulated," you've given up the lever. Construct it; account for it; evict deliberately.
