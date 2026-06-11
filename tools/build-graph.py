#!/usr/bin/env python3
"""Build the knowledge-graph index for the H-AI- repo.

Reads frontmatter from every node, emits ``graph.json``, regenerates the
README index between ``BEGIN GENERATED`` / ``END GENERATED`` markers, and
writes ``threads/INDEX.md``. Warnings go to stderr; exit code is always 0.

Run from anywhere::

    python3 tools/build-graph.py
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
NODE_ROOTS = ["nodes/topics", "nodes/concepts", "nodes/projects", "nodes/references", "threads"]
SKIP_FILES = {"README.md", "AGENTS.md", "INDEX.md"}

WIKI_RE = re.compile(r"\[\[([a-z0-9][a-z0-9-]*)\]\]")
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)

ALLOWED_KINDS = {"spec", "plan", "snapshot", "worked-example", "product"}
KIND_ORDER = ["spec", "plan", "snapshot", "worked-example", "product"]
KIND_LABEL = {
    "spec": "Specs",
    "plan": "Plans",
    "snapshot": "Snapshots",
    "worked-example": "Worked examples",
    "product": "Products",
}

CLUSTER_TAGS = [
    "sms", "eval", "output-design", "domain-chatbot", "task-agent",
    "reasoning", "observability", "pagination", "meta", "text-eot",
    "operator-trust", "knowledge-graph",
]

BEGIN_MARK = "<!-- BEGIN GENERATED: rebuilt by `python tools/build-graph.py`. Do not edit by hand. -->"
END_MARK = "<!-- END GENERATED -->"


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


def warn(msg: str) -> None:
    print(f"WARN {msg}", file=sys.stderr)


def discover() -> list[Path]:
    out: list[Path] = []
    for root in NODE_ROOTS:
        rdir = REPO / root
        if not rdir.is_dir():
            continue
        for p in sorted(rdir.iterdir()):
            if p.is_file() and p.suffix == ".md" and p.name not in SKIP_FILES:
                out.append(p)
    return out


def _extract_id(value: object) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    m = WIKI_RE.search(s)
    if m:
        return m.group(1)
    return s.strip("[]") or None


def parse_node(p: Path) -> Node | None:
    text = p.read_text()
    if not text.startswith("---\n"):
        warn(f"no-frontmatter: {p.relative_to(REPO)}")
        return None
    end = text.find("\n---", 4)
    if end < 0:
        warn(f"unterminated-frontmatter: {p.relative_to(REPO)}")
        return None
    fm_raw = text[4:end]
    body = text[end + 4 :]
    fm = parse_frontmatter(fm_raw)
    h1 = H1_RE.search(body)
    title = h1.group(1) if h1 else str(fm.get("id", p.stem))
    related: list[str] = []
    for r in fm.get("related") or []:
        rid = _extract_id(r)
        if rid:
            related.append(rid)
    tags_raw = fm.get("tags") or []
    if isinstance(tags_raw, str):
        # tags can be inline: [a, b, c]
        tags_raw = [t.strip() for t in tags_raw.strip("[]").split(",") if t.strip()]
    return Node(
        id=str(fm.get("id", p.stem)),
        type=str(fm.get("type", "")),
        path=str(p.relative_to(REPO)),
        title=title,
        summary=fm.get("summary"),
        tags=list(tags_raw),
        status=fm.get("status"),
        created=str(fm.get("created")) if fm.get("created") else None,
        kind=fm.get("kind"),
        related=related,
        source_thread=_extract_id(fm.get("source-thread")),
    )


def parse_frontmatter(fm: str) -> dict[str, object]:
    """Tiny YAML-frontmatter parser scoped to this repo's schema.

    Handles: scalar fields (`key: value`), inline list (`tags: [a, b, c]`),
    block list (`related:` followed by `  - item` lines), and quoted strings.
    Does NOT handle nested maps or multi-line scalars — they aren't used here.
    """
    out: dict[str, object] = {}
    cur_key: str | None = None
    cur_list: list[str] | None = None
    for raw in fm.split("\n"):
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.startswith("  - ") or raw.startswith("- "):
            if cur_list is None:
                continue  # malformed; skip
            cur_list.append(raw.lstrip()[2:].strip())
            continue
        # New key
        if cur_list is not None and cur_key is not None:
            out[cur_key] = cur_list
            cur_list = None
        if ":" not in raw:
            continue
        k, _, v = raw.partition(":")
        k = k.strip()
        v = v.strip()
        if v == "":
            cur_key = k
            cur_list = []
        elif v.startswith("[[") and v.endswith("]]"):
            # Wiki-link scalar (e.g., source-thread: [[2026-06-09-foo]]) — keep as string.
            out[k] = v
            cur_key = None
            cur_list = None
        elif v.startswith("[") and v.endswith("]"):
            inner = v[1:-1]
            out[k] = [x.strip() for x in inner.split(",") if x.strip()]
            cur_key = None
            cur_list = None
        else:
            # Strip surrounding quotes (single or double)
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            out[k] = v
            cur_key = None
            cur_list = None
    if cur_list is not None and cur_key is not None:
        out[cur_key] = cur_list
    return out


def compute_clusters(nodes: list[Node]) -> None:
    topics = [n for n in nodes if n.type == "topic"]
    for c in nodes:
        if c.type != "concept":
            continue
        c.clusters = sorted({t.id for t in topics if c.id in t.related})


def validate(nodes: list[Node]) -> None:
    by_id = {n.id: n for n in nodes}
    today = date.today()
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
        if n.type == "concept":
            for cluster in n.clusters:
                if cluster not in n.related:
                    warn(f"bidirectional-mismatch: {n.id} cluster {cluster} not in own related")
        if n.type == "topic":
            for r in n.related:
                t = by_id.get(r)
                if t and t.type == "concept" and n.id not in t.related:
                    warn(f"bidirectional-mismatch: topic {n.id} lists {r} but {r} doesn't list back")
        if n.status == "snapshot" and n.created:
            try:
                age = (today - date.fromisoformat(n.created)).days
                if age > 365:
                    warn(f"stale-snapshot: {n.id} ({age}d old)")
            except ValueError:
                pass


def emit_graph_json(nodes: list[Node]) -> tuple[int, int]:
    edges: list[dict[str, str]] = []
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
    return len(nodes), len(edges)


def primary_tag(tags: list[str]) -> str:
    for c in CLUSTER_TAGS:
        if c in tags:
            return c
    return tags[0] if tags else "other"


def render_index(nodes: list[Node]) -> str:
    by_id = {n.id: n for n in nodes}
    out: list[str] = ["", "## Current entry points", ""]

    out.append("### Topics")
    for n in sorted([x for x in nodes if x.type == "topic"], key=lambda x: x.id):
        out.append(f"- [{n.id}]({n.path}) — {n.summary or ''}")
    out.append("")

    out.append("### Concepts — by topic cluster")
    out.append("")
    for t in sorted([x for x in nodes if x.type == "topic"], key=lambda x: x.id):
        out.append(f"**[{t.id}]({t.path})**")
        members = sorted(
            [by_id[c] for c in t.related if c in by_id and by_id[c].type == "concept"],
            key=lambda x: x.id,
        )
        for c in members:
            out.append(f"- [{c.id}]({c.path}) — {c.summary or ''}")
        out.append("")
    orphans = sorted(
        [n for n in nodes if n.type == "concept" and not n.clusters],
        key=lambda x: x.id,
    )
    if orphans:
        out.append("**Concepts — unclustered**")
        for c in orphans:
            out.append(f"- [{c.id}]({c.path}) — {c.summary or ''}")
        out.append("")

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

    refs = sorted([n for n in nodes if n.type == "reference"], key=lambda x: x.id)
    if refs:
        out.append("### References")
        for n in refs:
            out.append(f"- [{n.id}]({n.path}) — {n.summary or ''}")
        out.append("")

    threads = sorted(
        [n for n in nodes if n.type == "thread"],
        key=lambda x: x.created or "",
        reverse=True,
    )
    out.append("### Recent threads (10 most recent)")
    for n in threads[:10]:
        prefix = primary_tag(n.tags)
        out.append(f"- {n.created} · [{prefix}] [{n.id}]({n.path}) — {n.summary or ''}")
    out.append("")
    out.append("See [`threads/INDEX.md`](threads/INDEX.md) for the full archive.")
    out.append("")
    return "\n".join(out)


def regenerate_readme(nodes: list[Node]) -> None:
    readme = REPO / "README.md"
    text = readme.read_text()
    if BEGIN_MARK not in text or END_MARK not in text:
        warn("readme-markers-missing: cannot regenerate index")
        return
    pre, _, rest = text.partition(BEGIN_MARK)
    _, _, post = rest.partition(END_MARK)
    body = render_index(nodes)
    readme.write_text(f"{pre}{BEGIN_MARK}\n{body}\n{END_MARK}{post}")


def emit_threads_index(nodes: list[Node]) -> int:
    threads = sorted(
        [n for n in nodes if n.type == "thread"],
        key=lambda x: x.created or "",
        reverse=True,
    )
    out = [
        "---",
        "title: Threads index",
        "nav_order: 5",
        "---",
        "",
        "# Threads — chronological",
        "",
        "> Auto-generated by `tools/build-graph.py`. Do not edit by hand.",
        "",
    ]
    for n in threads:
        prefix = primary_tag(n.tags)
        fname = Path(n.path).name
        out.append(f"- {n.created} · [{prefix}] [{n.id}]({fname}) — {n.summary or ''}")
    out.append("")
    (REPO / "threads/INDEX.md").write_text("\n".join(out))
    return len(threads)


def main() -> int:
    paths = discover()
    nodes = [n for n in (parse_node(p) for p in paths) if n is not None]
    compute_clusters(nodes)
    validate(nodes)
    n_nodes, n_edges = emit_graph_json(nodes)
    regenerate_readme(nodes)
    n_threads = emit_threads_index(nodes)
    print(
        f"built graph.json ({n_nodes} nodes, {n_edges} edges); "
        f"regenerated README index; wrote threads/INDEX.md ({n_threads} threads)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
