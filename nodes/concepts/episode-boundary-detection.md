---
id: episode-boundary-detection
type: concept
tags: [conversation, segmentation, episode, boundary, memory, turn-taking, task-agent]
summary: "deciding where a unit of work starts and ends inside a continuous conversation — at turn, topic, task, and session scale — and why the boundary signal should come from state changes, not text similarity alone."
related:
  - [[references-episode-boundary-detection]]
  - [[turn-outcome-signal]]
  - [[flat-channel-thread-tracking]]
  - [[thread-disambiguation-prompts]]
  - [[sms-multi-thread-chatbot]]
  - [[turn-taking-and-proactivity]]
  - [[conversation-memory]]
  - [[memory-consolidation-and-forgetting]]
  - [[context-compaction]]
  - [[run-state-model]]
  - [[sms-state-machine]]
  - [[stop-and-yield-conditions]]
  - [[intent-and-disambiguation]]
  - [[sms-message-buffering-spec]]
status: living
created: 2026-11-04
---

# Episode Boundary Detection

A conversing task agent sees one continuous stream of messages, but its work comes in units: a task that starts, runs, and finishes. **Episode boundary detection** is deciding where those units begin and end. Get it wrong and the agent merges two tasks into one, splits one task across two memories, closes a task the user hadn't finished, or never closes one at all.

## Four scales, four literatures

The problem is studied under different names depending on the size of the unit. All papers are in [references-episode-boundary-detection](../references/references-episode-boundary-detection.md).

| Scale | Question | Research name | Where the graph covers it |
|---|---|---|---|
| **Turn** | Has the user finished this message? | End-of-turn detection, turn-taking | [turn-taking-and-proactivity](turn-taking-and-proactivity.md), [sms-message-buffering-spec](../projects/sms-message-buffering-spec.md) |
| **Topic** | Has the conversation moved to something new? | Dialogue topic segmentation | this node |
| **Task / thread** | Which task does this message belong to, and is that task done? | Disentanglement, segmentation with state tracking | [flat-channel-thread-tracking](flat-channel-thread-tracking.md), [turn-outcome-signal](turn-outcome-signal.md) |
| **Episode in memory** | Where should one stored memory end and the next begin? | Event segmentation for memory | this node, [conversation-memory](conversation-memory.md) |

## What the boundary signal should be

The research converges on three kinds of signal, from weakest to strongest for a task agent:

1. **Text similarity.** Classic topic segmenters mark a boundary where adjacent utterances stop resembling each other ([SuperDialseg](https://arxiv.org/abs/2305.08371), [CobSeg](https://arxiv.org/abs/2605.30668)). Cheap, but a user can change task without changing vocabulary.
2. **Surprise.** Borrowed from Event Segmentation Theory in psychology: a boundary falls where prediction fails. EM-LLM places episode boundaries at spikes of Bayesian surprise in the token stream ([2407.09450](https://arxiv.org/abs/2407.09450)), and HiMem combines topic and surprise channels ([2601.06377](https://arxiv.org/abs/2601.06377)).
3. **State change.** A boundary falls when something the task depends on changes. HingeMem draws one whenever the person, time, location, or topic changes ([2604.06845](https://arxiv.org/abs/2604.06845)); S3-DST segments and tracks dialogue state jointly, so each segment carries its own state ([2309.08827](https://arxiv.org/abs/2309.08827)).

The graph's reading: **for a task agent, the strongest end-of-episode signal is the task's own state, not the text.** A task ends when its goal is met, cancelled, or superseded — which the agent can record directly as a typed outcome ([turn-outcome-signal](turn-outcome-signal.md)) instead of inferring it later from language. Text and surprise signals are best used to *propose* a boundary, with state deciding.

## Start and end are different problems

- **Start** is usually detectable: a new intent, a new entity, or an explicit opener. Multi-intent messages are the hard case — one message can start two tasks.
- **End** is the hard one, because users rarely announce it. A task can end by completion, by a quiet abandonment, by being replaced, or by a "never mind" ([sms-state-machine](sms-state-machine.md) names these states). Silence is ambiguous: it may mean done or away.
- **Real work crosses sessions.** SessionFarmer, which mined real coding-agent sessions, had to filter unrelated sessions and group "multi-turn, potentially multi-session interactions into work episodes centered on one engineering goal" ([2611.02440](https://arxiv.org/abs/2611.02440)). A session boundary is not an episode boundary.

## Pitfalls

- **Training on the wrong genre.** An end-of-turn detector trained on single-turn speech scored up to 0.45 F1 lower on real conversation, because mid-turn pauses look like endings ([2610.39742](https://arxiv.org/abs/2610.39742)). Train boundary detectors on conversations shaped like yours.
- **Judging by boundary F1 alone.** Reported differences between segmenters "often reflect annotation granularity mismatch rather than boundary placement quality" ([2512.17083](https://arxiv.org/abs/2512.17083)). Check that your labels and the detector agree on how big a unit is.
- **Fixed-size memory chunks.** Rigid chunking "often disrupts semantic integrity" ([ES-Mem, 2601.07582](https://arxiv.org/abs/2601.07582)); a memory that splits mid-task loses the link between a request and its result.
- **Organizing too early.** Boundaries written at storage time cannot anticipate future questions; one memory system defers organization to query time and keeps raw turns unchanged ([2611.02480](https://arxiv.org/abs/2611.02480)). Keep the raw record so a bad boundary can be redrawn.
- **Treating "session ended" as "task ended."** Persist open tasks across sessions in the [run-state-model](run-state-model.md).
