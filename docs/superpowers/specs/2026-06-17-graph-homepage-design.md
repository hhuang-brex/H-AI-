# Interactive Graph Homepage — Design

**Date:** 2026-06-17
**Status:** Approved design, pending implementation plan

## Problem

The site (Jekyll + `just-the-docs` remote theme) presents its index as the theme's **nested sidebar list**. For a repo whose whole identity is "every file is a node, every link is an edge," the index should *look* like a knowledge graph, not a list. The data already exists — `tools/build-graph.py` emits `graph.json` (129 nodes, 836 edges) — but nothing renders it visually.

## Goal

Make the **homepage an interactive, force-directed knowledge graph** of all nodes, color-coded by type, with click-to-navigate, filtering, and search. Keep the just-the-docs sidebar and search for linear browsing. Purely additive to the build — no changes to `build-graph.py`.

## Non-goals

- No change to the build pipeline or `graph.json` schema (it already has every field needed).
- Not replacing the sidebar (kept for linear browsing).
- Not a per-page mini-graph, clustering layout, or progressive topic-expand view (considered and declined in favor of "full graph + filters").
- No server-side/runtime component — the graph is static-site client-side only.

## Decisions (from brainstorm)

| Decision | Choice |
|---|---|
| What | Dedicated interactive force-directed graph view |
| Where | **The homepage** (`/`) |
| Density | **Full graph + filters** (all 129 nodes, color by type, filter checkboxes, search-highlight, zoom/drag) |
| Renderer | **Cytoscape.js + fcose layout** (CDN) |
| Sidebar | Kept (layout extends just-the-docs `default`) |
| README | Stays the GitHub repo readme; demoted from site home to the **Overview** page (`/overview/`) |

## Architecture

Client-side view layered onto the existing site. No build changes.

```
Browser (homepage /)
  └─ _layouts/graph.html   (layout: default → keeps sidebar + top search)
       ├─ filter/search toolbar  +  type legend
       ├─ <div id="cy">   ← graph fills the main content area
       ├─ "Browse as a list →"  link to /overview/  (always present)
       └─ loads (this page only): cytoscape + cytoscape-fcose (CDN),
          assets/js/graph.js, assets/css/graph.css
                   │
                   └─ fetch('{{ "/graph.json" | relative_url }}') → elements → fcose → events
```

## Components

| File | Role | Notes |
|---|---|---|
| `index.html` | Homepage | Frontmatter: `permalink: /`, `layout: graph`, `title: Graph`, `nav_order: 1`. Body: intro line, toolbar, `<div id="cy">`, `<noscript>` + "Browse as a list →" link. |
| `_layouts/graph.html` | Page layout | `layout: default`; renders `{{ content }}`, then the two CDN `<script>`s + `graph.js` + `graph.css`. Scoped to this page so other pages are unaffected. |
| `assets/js/graph.js` | The logic unit | fetch → transform → render → wire events. The only nontrivial code. |
| `assets/css/graph.css` | Styling | `#cy` height (viewport minus header), toolbar, legend swatches, dimmed/highlight states. |
| `README.md` | GitHub readme + Overview page | Frontmatter change only: drop `permalink: /` and `nav_order: 1`; add `permalink: /overview/`, `nav_order: 2`, and change `title: Home` → `title: Overview`. Body untouched. |

## Data flow (`graph.js`)

1. `fetch('{{ "/graph.json" | relative_url }}')` → `{ nodes, edges }`.
2. **Nodes** → `{ data: { id, label: title, type, summary, status, url } }`.
   `url` = node `path` with `.md`→`.html`, prefixed with `baseurl` (passed in from the layout via a `data-baseurl` attribute or a JS var). Example: `nodes/concepts/llm-as-judge.md` → `/H-AI-/nodes/concepts/llm-as-judge.html`.
3. **Edges** → `{ data: { source: from, target: to } }` directly from the `edges` array (`{from, to, kind}`).
4. **Dangling-edge guard:** keep only edges whose `from` *and* `to` are in the currently-visible node set. Recompute on every type-toggle. (The one correctness trap — an edge to a missing/filtered node crashes Cytoscape.)
5. `cytoscape({ container: #cy, elements, layout: { name: 'fcose' }, style: [...] })`.

## Style & interactions

- **Color by type** — 5 colors: topic / concept / project / reference / thread. Small legend. Node size scales mildly with degree.
- **Hover** node → tooltip (title + summary); highlight its edges + immediate neighbors; dim the rest.
- **Click** node → `window.location = url`.
- **Zoom / pan / drag** — Cytoscape built-ins.
- **Filter toolbar** — a checkbox per type; **thread OFF by default** (20 provenance nodes), the other four ON. Optional "dim archived" status treatment.
- **Search box** — substring match on title + tags → matches highlighted, non-matches dimmed; "fit to matches" on Enter.

## Error handling & edge cases

- **`graph.json` fetch fails** → inline message + "Browse as a list →" link to `/overview/`. Never dead-ends.
- **No-JS / JS disabled** → `<noscript>` block + the always-present Overview link; the just-the-docs **sidebar renders server-side**, so navigation never depends on the graph.
- **Bad/missing node `path`** → skip that node (and its edges) with a `console.warn`; don't break the render.
- **Mobile / small screens** → responsive canvas; the "Browse as a list →" link is prominent because a force graph is awkward on phones.
- **Scale** — 129 nodes / 836 edges is small for Cytoscape; no perf work needed.

## Verification

**Chosen path:** a browser MCP drives the verification.

- *Prerequisite (user action):* add a browser MCP to the session — Chrome DevTools MCP or Playwright MCP (`claude mcp add ...`).
- **Harness:** a standalone `graph.html` (plain HTML, CDN Cytoscape + `graph.js` + `graph.json`, **no Liquid**) served via `python3 -m http.server` at repo root. This exercises the real render/interaction logic without needing Jekyll. (`graph.html` is a dev harness — gitignored or kept out of `_site`.)
- **Driven assertions (via the MCP, with screenshots):**
  1. Nodes render; colored by type; legend visible.
  2. Threads hidden by default; toggling a type adds/removes its nodes with **no dangling-edge crash**.
  3. Hover highlights neighbors; search highlights matches.
  4. Clicking a node navigates to the correct `.html` URL (URL-mapping check).
- **Jekyll integration** (layout, `permalink`, sidebar intact, README→Overview): verified by a local `bundle exec jekyll serve` **if Ruby is available**, else by code review + the GitHub Pages deploy.

## Acceptance criteria

- Homepage `/` shows the interactive graph with the sidebar still present.
- All non-thread nodes visible by default, colored by type, with a legend and working type filters + search.
- Clicking any node lands on its rendered page.
- Graph degrades gracefully (fetch failure / no-JS / mobile) to the Overview list.
- `README.md` content unchanged; reachable at `/overview/`; still renders as the repo readme on github.com.
- No changes to `build-graph.py` or `graph.json`.

## Open questions for the implementation plan

- Exact 5-color palette (accessibility/contrast in just-the-docs light scheme).
- Whether `graph.html` dev harness is gitignored vs committed under a `dev/` path.
- Tooltip implementation: Cytoscape popper plugin vs. a plain absolutely-positioned div (lean toward the plain div — one fewer dependency).
