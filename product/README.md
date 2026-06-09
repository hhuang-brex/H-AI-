# product/

Product-shaped artifacts: end-to-end design specs for specific systems, synthesized from research-and-design conversations rather than the abstract concept graph in `nodes/`.

A product spec here is the *destination* of one or more threads — what we'd actually build — at enough fidelity that an engineering team could start work.

## Layout

Each spec is a single markdown file with the same frontmatter shape as a node, plus a `product:` field naming the system. Status is usually `proposal` or `living`.

## Current specs

- [spender-agent](spender-agent.md) — task agent that documents transactions by maintaining an EA-grade model of the principal's economic life. Two-loop workflow (slow context model + fast event handling) over a universal-context data primitive, with AI-proposes / user-corrects authority.

## Relationship to other folders

- `nodes/` holds the abstract concepts and patterns. A product spec here typically *uses* many of those concepts and links to them.
- `threads/` holds conversation summaries. A product spec is usually derived from one or more threads.
- A new product spec should add `source-thread:` for each thread that contributed.
