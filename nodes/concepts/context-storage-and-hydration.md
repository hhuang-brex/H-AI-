---
id: context-storage-and-hydration
type: concept
tags: [agent, context, state, storage, stateless, hydration, cache, engineering-excellence]
summary: "where conversational context lives and how it's loaded per request — the stateless-compute / stateful-store split, keyed per user/conversation, with a DB-of-record plus optional cache tier."
related:
  - [[agent-state-persistence]]
  - [[context-engineering]]
  - [[context-assembly-per-turn]]
  - [[run-state-model]]
  - [[agent-memory]]
  - [[agent-native-memory-framework]]
  - [[checkpoint-and-replay]]
status: living
created: 2026-06-12
---

# Context Storage & Hydration

The agent *process* is almost always stateless — a request handler or a function invocation that holds nothing between calls. The *context* is stateful and scoped per user / per conversation. Bridging that gap is the question this node answers: where does context live between turns, and how is it loaded ("hydrated") into a request that starts with nothing? The other context nodes assume the context is *there*; this one is about putting it there and getting it back.

## The split: stateless compute, stateful store

The load-bearing architectural fact: in production, the thing serving turn N is usually not the thing that served turn N−1 — a different worker, lambda, or pod, possibly on a different machine, after an idle gap of seconds or days. So **nothing durable can live in process memory.** Each turn:

```
request arrives (carries only an identity: user_id / conversation_id)
   ↓
HYDRATE: load context for that key from the store
   ↓
assemble prompt (context-assembly-per-turn) → call model → act
   ↓
PERSIST: write the updated context back to the store
   ↓
process forgets everything; next turn re-hydrates
```

Process memory is a *cache at most*, never the source of truth. Designing as if the process persists ("I'll keep the conversation in a dict keyed by user") works in a single-process demo and breaks the moment you scale horizontally or the worker recycles.

## Keying: per user vs. per conversation

The store is keyed by the identity the request carries. Pick the grain deliberately:

| Key | Scope | Use when |
|---|---|---|
| `conversation_id` | One thread/session | Most chat agents — context is the running thread |
| `user_id` | All of a user's interactions | Cross-conversation memory ([agent-memory](agent-memory.md)) — preferences, history |
| `user_id + conversation_id` | Both layers, loaded together | A talking agent that needs durable user facts AND this thread's state |

The two layers map onto the cluster: `conversation_id` state is the run/thread context; `user_id` state is durable [agent-memory](agent-memory.md). A real chatting agent hydrates *both* — this thread's history plus what we know about this user.

## The storage tiers

| Tier | Role | Trade-off |
|---|---|---|
| **Process memory** | Per-request scratch; never durable | Free, fast, lost on every dispatch |
| **In-memory store (Redis/Memcached)** | Hot cache for active conversations; low-latency hydrate | Fast, but evictable — must be backed by a DB, not trusted as the record |
| **Database (DB of record)** | Durable source of truth | Authoritative; higher latency, so often fronted by cache |

The common production shape is **DB of record + cache tier**: write-through to the DB, read from cache on hot path, fall back to DB on cache miss. The invariant from [agent-state-persistence](agent-state-persistence.md) holds — the cache may vanish; the DB must not. Treat Redis as a hydration accelerator, not as where state "lives."

## Productized primitive: the memory tool

Anthropic's **memory tool** (`memory_20250818`) is this split shipped as an API: the model issues `view`/`create`/`str_replace`/`insert`/`delete`/`rename` commands against a `/memories` directory, but the tool is **client-side** — *you* execute the file operations on your own infrastructure (file, DB, object store, encrypted blob), so you still own the stateful store, its keying, and its eviction. It's the routing layer (module Q of [agent-native-memory-framework](agent-native-memory-framework.md)) over a developer-owned store (R/S); the durability discipline of this node is unchanged — the model deciding *what* to write doesn't relieve you of *where it lives and how it hydrates*. Two caveats (docs verified 2026-07-02; the memory tool does not itself require the `context-management` beta header, while context editing and server-side compaction are beta):

- **Path-traversal is your problem.** Because you execute the ops, a malicious or injected path (`../`, URL-encoded `%2e%2e%2f`) can escape `/memories`; the docs make path validation a hard **MUST**. This is the [action-execution-safety](../topics/action-execution-safety.md) boundary surfacing in the storage layer.
- **Still a keyed, bounded store.** Scope `/memories` per `user_id`/`conversation_id` as above, and cap size — a model-written store bloats exactly like a hand-written one.

## What you store is the structured state, not the transcript

This is where storage meets the rest of the cluster. You persist the typed [run-state-model](run-state-model.md) / compacted state — goal, established facts, open commitments — **not** the raw token transcript. Reasons compound: the transcript is large (storage + hydration latency cost), brittle across prompt/model changes, and redundant with the structured state. On hydrate you load the compact state and *rebuild* the prompt via [context-assembly-per-turn](context-assembly-per-turn.md). Storage and assembly are the two ends of the same discipline: store the seed, regrow the window.

## Latency: hydration is on the critical path

Every turn pays a hydrate read before the model can even start. That read is in the user-visible latency budget, so:

- **Cache the hot path** — active conversations served from in-memory, not a cold DB round-trip per turn.
- **Load only what this turn needs** — hydrate the structured state, not a full memory dump; over-fetching here is the storage-side mirror of over-stuffing the context window.
- **Bound the payload** — the same compaction that fits the window also keeps the hydrate read small.

## Pitfalls

- **State in process memory.** Works in one process; corrupts or vanishes under horizontal scale, recycling, or idle gaps.
- **Cache as source of truth.** Treating Redis as the store; an eviction silently drops a conversation.
- **Storing the raw transcript.** Expensive to store and hydrate, brittle across changes — persist structured state instead.
- **Unkeyed or wrongly-keyed state.** `user_id` where you meant `conversation_id` cross-contaminates a user's parallel threads (this is the SMS [flat-channel-thread-tracking](flat-channel-thread-tracking.md) problem at the storage layer).
- **Ignoring hydrate latency.** A cold DB read every turn, on the critical path, with no cache.

## References

[agent-state-persistence](agent-state-persistence.md) is the durability/crash-semantics parent (this node is its *where it lives / how it loads* complement); [run-state-model](run-state-model.md) is *what* you store; [context-assembly-per-turn](context-assembly-per-turn.md) is what consumes the hydrated state; [agent-memory](agent-memory.md) is the per-user durable layer one of the keys addresses.
