---
id: knowledge-graph-index-builder-plan
type: project
kind: plan
tags: [meta, knowledge-graph, tooling, build, index, automation, plan]
related:
  - [[knowledge-graph-index-builder-spec]]
  - [[2026-06-11-knowledge-graph-organization-review]]
status: proposal
created: 2026-06-11
summary: 13-task implementation plan for `tools/build-graph.py`; sequenced as schema backfill → orphan-fix → script build → regeneration.
---

# Knowledge Graph Index Builder — Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `tools/build-graph.py` and migrate the repo to its conventions so README index drift becomes structurally impossible.

**Architecture:** Five sequential phases — Schema (1–3), Content backfill (4–6), Script (7–11), Regeneration (12), Verification (13). Each phase ends in a commit. The script reads frontmatter and emits three artifacts (`graph.json`, regenerated README index section, `threads/INDEX.md`); warnings go to stderr; exit code is always 0.

**Tech stack:** Python 3 + `PyYAML` (already implicitly in use). No new dependencies. Repo: `/Users/hhuang/Documents/Dev/H-AI-`.

---

## Phase A — Schema (Tasks 1–3)

### Task 1: Add `kind` and `summary` fields to AGENTS.md

**Files:**
- Modify: `AGENTS.md` (frontmatter schema block + type guide table)

- [ ] **Step 1: Update the schema YAML block in `AGENTS.md`**

Replace the current schema block to add `kind` (project-only) and `summary` (all node types):

```yaml
---
id: kebab-case-slug                    # required; matches filename
type: topic | concept | project | reference | thread   # required
kind: spec | plan | snapshot | worked-example | product   # required when type: project
tags: [string, ...]                    # required; lowercase, kebab-case
summary: <one-line ≤200 chars>         # required; the index entry's description
related:                               # required (may be empty)
  - [[other-node-id]]
status: living | snapshot | proposal | archived  # required
created: YYYY-MM-DD                    # required
source-thread: [[thread-id]]           # optional; for nodes derived from a thread
---
```

- [ ] **Step 2: Update the type guide table**

Add a `kind` column (only project rows non-blank) and a paragraph below the table:

> **`kind` (projects only).** Distinguishes the four shapes of project nodes: `spec` (design intent), `plan` (sequenced implementation), `snapshot` (point-in-time state of a real system), `worked-example` (code walkthrough), `product` (end-to-end product spec). Surfaced in the regenerated README as group headers.

- [ ] **Step 3: Add a "summary" subsection below the schema**

> **`summary`.** A single line ≤200 characters. Appears next to the node's link in every index entry. Keep it concrete: what is this node *for*? Avoid restating the title.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "Add kind and summary fields to AGENTS.md schema"
```

---

### Task 2: Backfill `kind` on the 8 existing project nodes

**Files:**
- Modify: `nodes/projects/agent-eval-case-study.md` → `kind: snapshot`
- Modify: `nodes/projects/agent-eval-improvement-tiers.md` → `kind: plan`
- Modify: `nodes/projects/dspy-domain-chatbot-cases.md` → `kind: snapshot`
- Modify: `nodes/projects/sms-message-buffering-plan.md` → `kind: plan`
- Modify: `nodes/projects/sms-message-buffering-spec.md` → `kind: spec`
- Modify: `nodes/projects/task-agent-pattern-fanout.md` → `kind: spec`
- Modify: `nodes/projects/worked-example-anthropic-thinking.md` → `kind: worked-example`
- Modify: `nodes/projects/worked-example-openai-responses.md` → `kind: worked-example`

- [ ] **Step 1: Add a `kind:` line to each project's frontmatter** between `type: project` and `tags:`

- [ ] **Step 2: Verify**

```bash
grep -L "^kind:" nodes/projects/*.md
```

Expected: only `nodes/projects/spender-agent.md` (which doesn't exist yet — that's Task 3) and `nodes/projects/knowledge-graph-index-builder-{spec,plan}.md` (already have `kind`).

- [ ] **Step 3: Commit**

```bash
git add nodes/projects/
git commit -m "Backfill kind on existing project nodes"
```

---

### Task 3: Fold `product/` into `nodes/projects/`

**Files:**
- Move: `product/spender-agent.md` → `nodes/projects/spender-agent.md`
- Modify: the moved file's frontmatter (add `kind: product`)
- Delete: `product/README.md`, `product/` directory
- Modify: `README.md` (deduplicate spender-agent entries; update path)
- Modify: any other node whose body links to `product/spender-agent.md`

- [ ] **Step 1: Identify cross-references**

```bash
grep -rln "product/spender-agent" --include="*.md"
```

- [ ] **Step 2: `git mv` the file**

```bash
git mv product/spender-agent.md nodes/projects/spender-agent.md
```

- [ ] **Step 3: Add `kind: product` to the moved file's frontmatter**

- [ ] **Step 4: Update every body link from `product/spender-agent.md` to the new path**

Each link needs its relative path adjusted based on the source file's location. Use the cross-reference list from Step 1.

- [ ] **Step 5: Delete `product/README.md` and the empty directory**

```bash
git rm product/README.md
rmdir product
```

- [ ] **Step 6: Deduplicate spender-agent in README**

The README currently has both a "Products" section and a "Product specs" section listing spender-agent. Merge into a single "Products" entry under the existing `### Projects` section (or its own `### Product specs` if preferred). Remove the duplicate.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Fold product/ into nodes/projects/, deduplicate spender-agent in README"
```

---

## Phase B — Content backfill (Tasks 4–6)

### Task 4: Backfill `summary:` on every existing node

**Files:**
- Modify: every `*.md` under `nodes/` and `threads/` that lacks a `summary:` line.

- [ ] **Step 1: List nodes missing `summary:`**

```bash
grep -L "^summary:" nodes/topics/*.md nodes/concepts/*.md nodes/projects/*.md nodes/references/*.md threads/*.md
```

Expected: most existing nodes (the new spec/plan/thread already have `summary`).

- [ ] **Step 2: For each node, add a `summary:` line in the frontmatter**

Source priority:
1. If the node is referenced in the current `README.md`, lift the dash-suffix description from there.
2. Otherwise, derive from the body's first sentence and tighten to ≤200 chars.

Place the `summary:` line between `created:` and `source-thread:` (or after `created:` if no `source-thread:`).

- [ ] **Step 3: Verify all nodes have `summary:`**

```bash
grep -L "^summary:" nodes/topics/*.md nodes/concepts/*.md nodes/projects/*.md nodes/references/*.md threads/*.md
```

Expected: empty.

- [ ] **Step 4: Verify ≤200 chars**

```bash
awk '/^summary:/ {if (length($0) > 210) print FILENAME": "length($0)" chars"}' nodes/**/*.md threads/*.md
```

Expected: empty (allowance: ≤210 to account for `summary: ` prefix).

- [ ] **Step 5: Commit**

```bash
git add nodes/ threads/
git commit -m "Backfill summary on all existing nodes"
```

---

### Task 5: Wire the 6 topic-orphan concepts into their topic node

**Files:**
- Modify: `nodes/topics/llm-output-design.md` — add `cot-as-forensic-artifact`, `layered-defense-pipeline`, `llm-observability`, `template-rendered-output` to `related:`
- Modify: `nodes/topics/llm-evaluation.md` — add `golden-snapshot-eval` to `related:`
- Modify: `nodes/topics/domain-chatbot-design.md` — add `recency-bias-prompt-design` to `related:`
- Modify: each of those 6 concept nodes — add the parent topic to its own `related:` if missing (back-edge for `bidirectional-mismatch`)

- [ ] **Step 1: Edit topic frontmatter for each of the 3 topics**

Add `[[concept-id]]` entries to the topic's `related:` block.

- [ ] **Step 2: Edit each of the 6 orphan concepts**

Verify each concept's `related:` includes the parent topic's `[[id]]`. Add if missing.

- [ ] **Step 3: Edit the topic node body**

If the topic body has a "Sub-topics" section, add a bullet for each newly-related concept there too. Body and frontmatter should agree.

- [ ] **Step 4: Verify**

For each topic, check both directions:

```bash
for c in cot-as-forensic-artifact golden-snapshot-eval layered-defense-pipeline llm-observability recency-bias-prompt-design template-rendered-output; do
  echo "=== $c ==="
  grep -l "\[\[$c\]\]" nodes/topics/*.md
done
```

Expected: each concept matched by at least one topic.

- [ ] **Step 5: Commit**

```bash
git add nodes/topics/ nodes/concepts/
git commit -m "Wire 6 topic-orphan concepts into their topic nodes"
```

---

### Task 6: Add `<!-- BEGIN GENERATED -->` / `<!-- END GENERATED -->` markers to README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Locate the "Current entry points" section** (currently around line 33).

- [ ] **Step 2: Insert markers**

Immediately before `## Current entry points`:

```html
<!-- BEGIN GENERATED: rebuilt by `python tools/build-graph.py`. Do not edit by hand. -->
```

Immediately after the last "Threads" bullet (just before `## Why this shape`):

```html
<!-- END GENERATED -->
```

- [ ] **Step 3: Verify the markers wrap exactly the auto-managed content**

```bash
awk '/<!-- BEGIN GENERATED/,/<!-- END GENERATED/' README.md | head -5
awk '/<!-- BEGIN GENERATED/,/<!-- END GENERATED/' README.md | tail -5
```

Expected: prints the bracketed section start and end correctly.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add BEGIN/END GENERATED markers around README index"
```

---

## Phase C — Build the script (Tasks 7–11)

### Task 7: Scaffold `tools/build-graph.py` — discover + parse phase

**Files:**
- Create: `tools/build-graph.py`

- [ ] **Step 1: Verify `tools/` does not exist yet**

```bash
ls tools 2>&1
```

Expected: `ls: tools: No such file or directory`. (If it does exist, decide whether to add to it or err.)

- [ ] **Step 2: Create `tools/build-graph.py` with the discover + parse phase**

```python
#!/usr/bin/env python3
"""Build the knowledge-graph index. Reads frontmatter from every node, emits
graph.json, regenerates the README index, and writes threads/INDEX.md."""

from __future__ import annotations
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

REPO = Path(__file__).resolve().parent.parent
NODE_ROOTS = ["nodes/topics", "nodes/concepts", "nodes/projects", "nodes/references", "threads"]
SKIP_FILES = {"README.md", "AGENTS.md"}

WIKI_RE = re.compile(r"\[\[([a-z0-9][a-z0-9-]*)\]\]")
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)


@dataclass
class Node:
    id: str
    type: str
    path: str
    title: str
    summary: str | None
    tags: list[str]
    status: str | None
    created: str | None
    kind: str | None
    related: list[str]
    source_thread: str | None
    clusters: list[str] = field(default_factory=list)


def discover() -> list[Path]:
    out: list[Path] = []
    for root in NODE_ROOTS:
        rdir = REPO / root
        if not rdir.is_dir():
            continue
        for p in rdir.iterdir():
            if p.is_file() and p.suffix == ".md" and p.name not in SKIP_FILES:
                out.append(p)
    return sorted(out)


def parse_node(p: Path) -> Node | None:
    text = p.read_text()
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end < 0:
        return None
    fm_raw = text[4:end]
    body = text[end + 4 :]
    try:
        fm = yaml.safe_load(fm_raw) or {}
    except yaml.YAMLError as e:
        print(f"WARN parse-error: {p}: {e}", file=sys.stderr)
        return None
    h1 = H1_RE.search(body)
    title = h1.group(1) if h1 else fm.get("id", p.stem)
    related = [m.group(1) if hasattr(m, "group") else m for m in [WIKI_RE.match(str(r)) or str(r).strip("[]") for r in (fm.get("related") or [])]]
    related = [r for r in related if r]
    src = fm.get("source-thread")
    if isinstance(src, str):
        m = WIKI_RE.search(src)
        src = m.group(1) if m else src.strip("[]")
    return Node(
        id=str(fm.get("id", p.stem)),
        type=str(fm.get("type", "")),
        path=str(p.relative_to(REPO)),
        title=title,
        summary=fm.get("summary"),
        tags=list(fm.get("tags") or []),
        status=fm.get("status"),
        created=str(fm.get("created")) if fm.get("created") else None,
        kind=fm.get("kind"),
        related=related,
        source_thread=src,
    )


def main() -> int:
    paths = discover()
    nodes = [n for n in (parse_node(p) for p in paths) if n is not None]
    print(f"discovered {len(paths)} files, parsed {len(nodes)} nodes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Run the scaffolded script**

```bash
python3 tools/build-graph.py
```

Expected: `discovered N files, parsed N nodes` where N matches `find nodes threads -name '*.md' | wc -l`.

- [ ] **Step 4: Commit**

```bash
git add tools/build-graph.py
git commit -m "Scaffold tools/build-graph.py with discover + parse phase"
```

---

### Task 8: Add cluster computation + warnings phase

**Files:**
- Modify: `tools/build-graph.py`

- [ ] **Step 1: Add cluster computation**

After parsing all nodes, compute each concept's clusters:

```python
def compute_clusters(nodes: list[Node]) -> None:
    by_id = {n.id: n for n in nodes}
    topics = [n for n in nodes if n.type == "topic"]
    for c in nodes:
        if c.type != "concept":
            continue
        c.clusters = sorted({t.id for t in topics if c.id in t.related})
```

- [ ] **Step 2: Add the warnings phase**

```python
ALLOWED_KINDS = {"spec", "plan", "snapshot", "worked-example", "product"}

def warn(msg: str) -> None:
    print(f"WARN {msg}", file=sys.stderr)

def validate(nodes: list[Node]) -> None:
    by_id = {n.id: n for n in nodes}
    for n in nodes:
        if not n.summary:
            warn(f"missing-summary: {n.id}")
        if n.type == "project":
            if not n.kind:
                warn(f"missing-kind: {n.id}")
            elif n.kind not in ALLOWED_KINDS:
                warn(f"unknown-kind: {n.id} ({n.kind!r})")
        if n.type == "concept" and not n.clusters:
            warn(f"orphan-concept: {n.id}")
        for r in n.related:
            if r not in by_id:
                warn(f"dangling-edge: {n.id} -> [[{r}]]")
        if n.source_thread and n.source_thread not in by_id:
            warn(f"dangling-source-thread: {n.id} -> [[{n.source_thread}]]")
        # bidirectional check (concept <-> topic)
        if n.type == "concept":
            for cluster in n.clusters:
                if cluster not in n.related:
                    warn(f"bidirectional-mismatch: {n.id} in cluster {cluster} but {cluster} not in its own related:")
        if n.type == "topic":
            for r in n.related:
                t = by_id.get(r)
                if t and t.type == "concept" and n.id not in t.related:
                    warn(f"bidirectional-mismatch: topic {n.id} lists {r} but {r} doesn't list {n.id}")
        # stale-snapshot
        if n.status == "snapshot" and n.created:
            from datetime import date
            try:
                age = (date.today() - date.fromisoformat(n.created)).days
                if age > 365:
                    warn(f"stale-snapshot: {n.id} ({age}d old)")
            except ValueError:
                pass
```

Wire `compute_clusters(nodes)` and `validate(nodes)` into `main()` between parse and emit.

- [ ] **Step 3: Run the script**

```bash
python3 tools/build-graph.py
```

Expected: warnings to stderr corresponding to whatever drift remains. After Phases A and B complete cleanly, expect only `missing-summary` warnings if any nodes were missed, or zero warnings.

- [ ] **Step 4: Fix any warnings the script surfaces**

Iterate: warning → root cause → repo fix → re-run.

- [ ] **Step 5: Commit**

```bash
git add tools/build-graph.py
git commit -m "Add cluster computation and warnings phase to build-graph"
```

---

### Task 9: Add `graph.json` emission

**Files:**
- Modify: `tools/build-graph.py`

- [ ] **Step 1: Add `emit_graph_json`**

```python
from datetime import date

def emit_graph_json(nodes: list[Node]) -> None:
    edges = []
    for n in nodes:
        for r in n.related:
            edges.append({"from": n.id, "to": r, "kind": "related"})
        if n.source_thread:
            edges.append({"from": n.id, "to": n.source_thread, "kind": "source-thread"})
    out = {
        "generated": date.today().isoformat(),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": [
            {
                "id": n.id, "type": n.type, "kind": n.kind, "path": n.path,
                "title": n.title, "summary": n.summary, "tags": n.tags,
                "status": n.status, "created": n.created,
                "clusters": n.clusters, "source_thread": n.source_thread,
                "related": n.related,
            }
            for n in sorted(nodes, key=lambda x: x.id)
        ],
        "edges": sorted(edges, key=lambda e: (e["from"], e["to"], e["kind"])),
    }
    (REPO / "graph.json").write_text(json.dumps(out, indent=2) + "\n")
```

Wire into `main()`. Print `wrote graph.json (N nodes, M edges)`.

- [ ] **Step 2: Run and inspect**

```bash
python3 tools/build-graph.py
jq '.node_count, .edge_count' graph.json
jq '.nodes[0]' graph.json
```

- [ ] **Step 3: Commit**

```bash
git add tools/build-graph.py graph.json
git commit -m "Emit graph.json from build-graph"
```

---

### Task 10: Add README index regeneration

**Files:**
- Modify: `tools/build-graph.py`

- [ ] **Step 1: Add `regenerate_readme`**

```python
BEGIN = "<!-- BEGIN GENERATED: rebuilt by `python tools/build-graph.py`. Do not edit by hand. -->"
END = "<!-- END GENERATED -->"
KIND_ORDER = ["spec", "plan", "snapshot", "worked-example", "product"]
KIND_LABEL = {"spec": "Specs", "plan": "Plans", "snapshot": "Snapshots", "worked-example": "Worked examples", "product": "Products"}

def regenerate_readme(nodes: list[Node]) -> None:
    readme = REPO / "README.md"
    text = readme.read_text()
    if BEGIN not in text or END not in text:
        warn("readme-markers-missing: cannot regenerate index")
        return
    pre = text.split(BEGIN)[0]
    post = text.split(END)[1]
    body = render_index(nodes)
    readme.write_text(f"{pre}{BEGIN}\n\n{body}\n{END}{post}")

def render_index(nodes: list[Node]) -> str:
    by_id = {n.id: n for n in nodes}
    out: list[str] = ["## Current entry points", ""]

    # Topics
    out.append("### Topics")
    for n in sorted([x for x in nodes if x.type == "topic"], key=lambda x: x.id):
        out.append(f"- [{n.id}]({n.path}) — {n.summary or ''}")
    out.append("")

    # Concepts by cluster
    out.append("### Concepts — by topic cluster")
    out.append("")
    topics = sorted([x for x in nodes if x.type == "topic"], key=lambda x: x.id)
    for t in topics:
        out.append(f"**[{t.id}]({t.path})**")
        members = sorted([by_id[c] for c in t.related if c in by_id and by_id[c].type == "concept"], key=lambda x: x.id)
        for c in members:
            out.append(f"- [{c.id}]({c.path}) — {c.summary or ''}")
        out.append("")
    orphans = sorted([n for n in nodes if n.type == "concept" and not n.clusters], key=lambda x: x.id)
    if orphans:
        out.append("**Concepts — unclustered**")
        for c in orphans:
            out.append(f"- [{c.id}]({c.path}) — {c.summary or ''}")
        out.append("")

    # Projects by kind
    out.append("### Projects — by kind")
    out.append("")
    by_kind: dict[str, list[Node]] = {}
    for n in nodes:
        if n.type == "project":
            by_kind.setdefault(n.kind or "(unset)", []).append(n)
    for kind in KIND_ORDER:
        members = sorted(by_kind.get(kind, []), key=lambda x: x.id)
        if not members:
            continue
        out.append(f"**{KIND_LABEL[kind]}**")
        for n in members:
            out.append(f"- [{n.id}]({n.path}) — {n.summary or ''}")
        out.append("")

    # References
    refs = sorted([n for n in nodes if n.type == "reference"], key=lambda x: x.id)
    if refs:
        out.append("### References")
        for n in refs:
            out.append(f"- [{n.id}]({n.path}) — {n.summary or ''}")
        out.append("")

    # Recent threads (10 most recent)
    threads = sorted([n for n in nodes if n.type == "thread"], key=lambda x: x.created or "", reverse=True)[:10]
    out.append("### Recent threads (10 most recent)")
    for n in threads:
        prefix = primary_tag(n.tags)
        out.append(f"- {n.created} · [{prefix}] [{n.id}]({n.path}) — {n.summary or ''}")
    out.append("")
    out.append("See [`threads/INDEX.md`](threads/INDEX.md) for the full archive.")
    out.append("")
    return "\n".join(out)

CLUSTER_TAGS = ["sms", "eval", "output-design", "domain-chatbot", "task-agent", "reasoning", "observability", "pagination", "meta", "text-eot"]

def primary_tag(tags: list[str]) -> str:
    for c in CLUSTER_TAGS:
        if c in tags:
            return c
    return tags[0] if tags else "other"
```

Wire into `main()` after `emit_graph_json`.

- [ ] **Step 2: Run and review the diff**

```bash
python3 tools/build-graph.py
git diff README.md | head -100
```

The bracketed section should be replaced; the rest of README should be untouched.

- [ ] **Step 3: Commit**

```bash
git add tools/build-graph.py README.md
git commit -m "Regenerate README index from build-graph"
```

---

### Task 11: Add `threads/INDEX.md` generation

**Files:**
- Modify: `tools/build-graph.py`

- [ ] **Step 1: Add `emit_threads_index`**

```python
def emit_threads_index(nodes: list[Node]) -> None:
    threads = sorted([n for n in nodes if n.type == "thread"], key=lambda x: x.created or "", reverse=True)
    out = ["---", "title: Threads index", "nav_order: 5", "---", "",
           "# Threads — chronological", "",
           "> Auto-generated by `tools/build-graph.py`. Do not edit by hand.", ""]
    for n in threads:
        prefix = primary_tag(n.tags)
        out.append(f"- {n.created} · [{prefix}] [{n.id}]({Path(n.path).name}) — {n.summary or ''}")
    out.append("")
    (REPO / "threads/INDEX.md").write_text("\n".join(out))
```

Wire into `main()`.

- [ ] **Step 2: Run and inspect**

```bash
python3 tools/build-graph.py
head -20 threads/INDEX.md
```

- [ ] **Step 3: Commit**

```bash
git add tools/build-graph.py threads/INDEX.md
git commit -m "Generate threads/INDEX.md from build-graph"
```

---

## Phase D — Final regeneration (Task 12)

### Task 12: Run end-to-end and commit clean artifacts

**Files:**
- Generated: `graph.json`, `README.md` (between markers), `threads/INDEX.md`

- [ ] **Step 1: Run the full pipeline**

```bash
python3 tools/build-graph.py
```

Expected: zero warnings on stderr; one-line success summary on stdout.

- [ ] **Step 2: If any warnings remain, fix them and re-run** until stderr is empty.

- [ ] **Step 3: Inspect the diff**

```bash
git diff README.md graph.json threads/INDEX.md
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Regenerate index artifacts after script lands"
```

---

## Phase E — Verification (Task 13)

### Task 13: Verify success criteria from the spec

**Files:** none (verification only)

- [ ] **Step 1: Verify `node_count` matches `find` output**

```bash
test "$(jq -r '.node_count' graph.json)" = "$(find nodes threads -name '*.md' | grep -v '^threads/INDEX.md$' | wc -l | tr -d ' ')"
```

(Note: subtract 1 if `threads/INDEX.md` is counted by `find`; adjust the comparison.)

- [ ] **Step 2: Confirm the 8 README drift findings are resolved**

```bash
grep -c "sms-message-buffering-spec" README.md
grep -c "sms-message-buffering-plan" README.md
grep -c "task-agent-pattern-fanout" README.md
grep -c "2026-06-10-github-buffering-references" README.md
grep -c "2026-06-10-sms-message-buffering-research" README.md
grep -c "2026-06-11-text-eot-classifier-salvage" README.md
```

Expected: each ≥1.

- [ ] **Step 3: Confirm spender-agent appears exactly once**

```bash
grep -c "spender-agent" README.md
```

Expected: 1 (or 2 if linked from prose; main list should have exactly one entry).

- [ ] **Step 4: End-to-end smoke test — add a throwaway concept**

Create `nodes/concepts/test-smoke.md` with valid frontmatter (including `summary` and adding the topic back-edge), run the script, verify it appears in the regenerated README under the right cluster, then `git rm` it and re-run.

- [ ] **Step 5: Push**

```bash
SKIP_ORIGIN_CHECK=1 git push
```

---

## Order summary

| Phase | Tasks | Commits |
|---|---|---|
| A — Schema | 1, 2, 3 | 3 |
| B — Content | 4, 5, 6 | 3 |
| C — Script | 7, 8, 9, 10, 11 | 5 |
| D — Regenerate | 12 | 1 |
| E — Verify | 13 | 1 (push) |

13 tasks, 12 commits, one push. Each task is independently reviewable. The script gains capability one phase at a time so any regression is easy to bisect.

## Self-review notes

- **Spec coverage:** all 5 spec deliverables (script, schema update, content migration, README regen, threads/INDEX.md, graph.json) are mapped to tasks.
- **Type consistency:** `Node` dataclass field names match the JSON keys emitted in `emit_graph_json`. Function names referenced across tasks (`compute_clusters`, `validate`, `emit_graph_json`, `regenerate_readme`, `emit_threads_index`, `primary_tag`) are consistent throughout.
- **Risk:** Task 4 (summary backfill) is the largest manual step (~80 nodes). It's mechanical but tedious. Splitting into per-folder commits is acceptable if the diff feels too large to review in one go.
- **Risk:** the inline Python in Tasks 7–11 builds incrementally. If a later task needs to amend an earlier function (e.g., for an edge case), do it inline and re-commit; don't amend prior commits.
