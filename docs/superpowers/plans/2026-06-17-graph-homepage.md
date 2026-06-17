# Interactive Graph Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site homepage an interactive, force-directed knowledge graph of all `graph.json` nodes (color by type, filters, search, click-to-navigate) while keeping the just-the-docs sidebar.

**Architecture:** Purely additive client-side view on the existing Jekyll/just-the-docs site. A new `index.html` (custom `graph` layout that extends `default`) hosts a `<div id="cy">`; `assets/js/graph.js` fetches the already-generated `graph.json` and renders it with Cytoscape.js + fcose. `README.md` is demoted from site-home to `/overview/` (it stays the GitHub repo readme). No build-pipeline or `graph.json` changes.

**Tech Stack:** Jekyll + just-the-docs (remote theme), Cytoscape.js 3.x + cytoscape-fcose 2.x (CDN), vanilla JS/CSS. Verification via a browser MCP + `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-06-17-graph-homepage-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `assets/js/graph.js` | The only logic unit: fetch `graph.json` → transform → render → wire hover/click/filter/search. Pure helpers (`nodeUrl`, `buildElements`) kept separate from DOM wiring. |
| `assets/css/graph.css` | Canvas sizing, toolbar/legend, dim/highlight states. |
| `_layouts/graph.html` | Page layout extending just-the-docs `default`; injects CDN scripts + assets on this page only. |
| `index.html` | Homepage (`permalink: /`): toolbar + `#cy` + noscript fallback. |
| `dev/graph-harness.html` | Standalone, no-Liquid harness to verify `graph.js` against `graph.json` over http. Dev-only. |
| `README.md` | Frontmatter-only change: demote from `/` to `/overview/`. |

**Prerequisite (user action, one-time):** add a browser MCP to the session before the verification steps — Chrome DevTools MCP or Playwright MCP (`claude mcp add ...`). `python3` is already available; CDN access (unpkg) is required.

---

## Task 1: Core data transform in `graph.js` (pure helpers + self-checks)

**Files:**
- Create: `assets/js/graph.js`

- [ ] **Step 1: Write `graph.js` with pure helpers and inline self-checks**

```javascript
// assets/js/graph.js — interactive knowledge-graph homepage
(function () {
  "use strict";

  const TYPE_COLORS = {
    topic:     "#2563eb", // blue
    concept:   "#059669", // green
    project:   "#d97706", // amber
    reference: "#7c3aed", // violet
    thread:    "#9ca3af", // gray
  };
  const DEFAULT_HIDDEN_TYPES = ["thread"];

  // pure: node `path` (e.g. nodes/concepts/x.md) -> site URL (/baseurl/nodes/concepts/x.html)
  function nodeUrl(path, baseurl) {
    if (!path || typeof path !== "string") return null;
    return (baseurl || "") + "/" + path.replace(/\.md$/, ".html");
  }

  // pure: graph.json -> {nodes, edges} cytoscape elements.
  // Drops nodes without a usable path; drops edges whose endpoints aren't present (dangling guard); dedupes undirected edges.
  function buildElements(graph, baseurl) {
    const nodeIds = new Set();
    const nodes = [];
    for (const n of (graph.nodes || [])) {
      const url = nodeUrl(n.path, baseurl);
      if (!url) { console.warn("graph: skipping node without path:", n.id); continue; }
      nodeIds.add(n.id);
      nodes.push({ data: {
        id: n.id,
        label: n.title || n.id,
        type: n.type || "concept",
        summary: n.summary || "",
        status: n.status || "",
        url: url,
      }});
    }
    const edges = [];
    const seen = new Set();
    for (const e of (graph.edges || [])) {
      if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue; // dangling guard
      const key = e.from < e.to ? e.from + "|" + e.to : e.to + "|" + e.from;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ data: { id: "e_" + key, source: e.from, target: e.to } });
    }
    return { nodes, edges };
  }

  // --- inline self-checks (run in browser console; visible to the verification MCP) ---
  function selfCheck() {
    console.assert(nodeUrl("nodes/concepts/x.md", "/H-AI-") === "/H-AI-/nodes/concepts/x.html", "nodeUrl basic");
    console.assert(nodeUrl(null, "/H-AI-") === null, "nodeUrl null path");
    const g = { nodes: [{id:"a",path:"a.md",type:"topic",title:"A"},{id:"b",path:"b.md",type:"concept",title:"B"},{id:"c"}],
                edges: [{from:"a",to:"b"},{from:"a",to:"b"},{from:"a",to:"z"}] };
    const el = buildElements(g, "/H-AI-");
    console.assert(el.nodes.length === 2, "buildElements drops node c (no path), got " + el.nodes.length);
    console.assert(el.edges.length === 1, "buildElements dedupes + drops dangling a->z, got " + el.edges.length);
    console.log("graph.js self-check OK");
  }

  // expose for harness/console
  window.__graph = { nodeUrl, buildElements, selfCheck, TYPE_COLORS, DEFAULT_HIDDEN_TYPES };
})();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/graph.js
git commit -m "feat(graph): core data transform helpers for graph homepage"
```

---

## Task 2: Dev harness + serve + verify the transform

**Files:**
- Create: `dev/graph-harness.html`

- [ ] **Step 1: Write the standalone harness**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>graph harness</title>
  <script src="https://unpkg.com/cytoscape@3.30.2/dist/cytoscape.min.js"></script>
  <script src="https://unpkg.com/layout-base@2.0.1/layout-base.js"></script>
  <script src="https://unpkg.com/cose-base@2.2.0/cose-base.js"></script>
  <script src="https://unpkg.com/cytoscape-fcose@2.2.0/cytoscape-fcose.js"></script>
  <link rel="stylesheet" href="../assets/css/graph.css" />
  <style> html,body{margin:0;height:100%} </style>
</head>
<body>
  <div id="graph-toolbar"></div>
  <!-- baseurl empty in harness: graph.json lives at repo root, served at / -->
  <div id="cy" data-baseurl="" data-graph-url="../graph.json" style="position:absolute;top:40px;bottom:0;left:0;right:0"></div>
  <script src="../assets/js/graph.js"></script>
  <script> window.__graph.selfCheck(); </script>
</body>
</html>
```

- [ ] **Step 2: Serve the repo root**

Run (from repo root, background it):
```bash
python3 -m http.server 8099
```
Then the harness is at `http://localhost:8099/dev/graph-harness.html`.

- [ ] **Step 3: Verify the transform via the browser MCP**

Using the connected browser MCP: navigate to `http://localhost:8099/dev/graph-harness.html`, then read the console / evaluate.
Expected console output: `graph.js self-check OK` and **no failed `console.assert`**.
Also evaluate in the page: `__graph.buildElements(await (await fetch('../graph.json')).json(), '').nodes.length` → Expected: `129` (or 129 minus any pathless nodes).

- [ ] **Step 4: Commit**

```bash
git add dev/graph-harness.html
git commit -m "test(graph): standalone harness + transform self-check"
```

---

## Task 3: Render + style-by-type (extend `graph.js`)

**Files:**
- Modify: `assets/js/graph.js` (add the render/init block before the IIFE closes)

- [ ] **Step 1: Add render logic** — insert this block inside the IIFE, after `selfCheck` and before the `window.__graph` line:

```javascript
  let cy = null;
  let hiddenTypes = new Set(DEFAULT_HIDDEN_TYPES);

  function cytoStyle() {
    const typeSelectors = Object.keys(TYPE_COLORS).map(function (t) {
      return { selector: 'node[type = "' + t + '"]', style: { "background-color": TYPE_COLORS[t] } };
    });
    return [
      { selector: "node", style: {
          "label": "data(label)", "font-size": 6, "color": "#374151",
          "text-valign": "bottom", "text-halign": "center", "text-margin-y": 2,
          "width": 12, "height": 12, "min-zoomed-font-size": 8 } },
      { selector: "edge", style: {
          "width": 0.6, "line-color": "#d1d5db", "curve-style": "straight", "opacity": 0.6 } },
      ...typeSelectors,
      { selector: ".dim", style: { "opacity": 0.12 } },
      { selector: ".hi", style: { "opacity": 1, "z-index": 10 } },
      { selector: 'node[status = "archived"]', style: { "opacity": 0.5 } },
    ];
  }

  function visibleElements(all) {
    const nodes = all.nodes.filter(function (n) { return !hiddenTypes.has(n.data.type); });
    const ids = new Set(nodes.map(function (n) { return n.data.id; }));
    const edges = all.edges.filter(function (e) { return ids.has(e.data.source) && ids.has(e.data.target); });
    return nodes.concat(edges);
  }

  function render(all) {
    cy = cytoscape({
      container: document.getElementById("cy"),
      elements: visibleElements(all),
      style: cytoStyle(),
      layout: { name: "fcose", quality: "default", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 },
      wheelSensitivity: 0.2,
    });
    return cy;
  }

  function init() {
    const mount = document.getElementById("cy");
    if (!mount) return;
    const baseurl = mount.dataset.baseurl || "";
    const url = mount.dataset.graphUrl || (baseurl + "/graph.json");
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (graph) {
      const all = buildElements(graph, baseurl);
      window.__graphAll = all;
      render(all);
    }).catch(function (err) {
      console.error("graph: load failed", err);
      mount.innerHTML = '<p style="padding:1rem">Graph couldn\'t load. ' +
        '<a href="' + (baseurl || "") + '/overview/">Browse as a list →</a></p>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
```

- [ ] **Step 2: Update the `window.__graph` export line** to also expose render internals:

```javascript
  window.__graph = { nodeUrl, buildElements, selfCheck, render, init, TYPE_COLORS, DEFAULT_HIDDEN_TYPES, get cy(){return cy;} };
```

- [ ] **Step 3: Verify render via browser MCP**

Reload `http://localhost:8099/dev/graph-harness.html`. Screenshot.
Expected: a force-directed graph of ~109 visible nodes (129 minus 20 threads, hidden by default), nodes colored — blue/green/amber/violet — edges drawn, no console errors, no Cytoscape "element with nonexistant source/target" crash.

- [ ] **Step 4: Commit**

```bash
git add assets/js/graph.js
git commit -m "feat(graph): render + style-by-type with fcose layout"
```

---

## Task 4: Hover highlight + click-to-navigate (extend `graph.js`)

**Files:**
- Modify: `assets/js/graph.js`

- [ ] **Step 1: Add a tooltip element + interaction wiring** — add this inside `render(all)`, right before `return cy;`:

```javascript
    // tooltip (plain div — no extra dependency)
    let tip = document.getElementById("cy-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "cy-tip";
      document.body.appendChild(tip);
    }
    cy.on("mouseover", "node", function (e) {
      const n = e.target;
      tip.innerHTML = "<strong>" + n.data("label") + "</strong><br>" +
        '<span class="cy-tip-type">' + n.data("type") + "</span> " + (n.data("summary") || "");
      tip.style.display = "block";
      const nbr = n.closedNeighborhood();
      cy.elements().addClass("dim");
      nbr.removeClass("dim").addClass("hi");
    });
    cy.on("mousemove", function (e) {
      tip.style.left = (e.renderedPosition.x + 14) + "px";
      tip.style.top = (e.renderedPosition.y + 14) + "px";
    });
    cy.on("mouseout", "node", function () {
      tip.style.display = "none";
      cy.elements().removeClass("dim").removeClass("hi");
    });
    cy.on("tap", "node", function (e) {
      const u = e.target.data("url");
      if (u) window.location.assign(u);
    });
```

- [ ] **Step 2: Verify via browser MCP**

Reload the harness. Using the MCP: hover a node → screenshot shows tooltip + neighbors highlighted, rest dimmed. Then evaluate that a node has a `.html` url: `__graph.cy.nodes().first().data('url')` → Expected: a string ending in `.html`. (Don't actually click — the harness has no target pages; the URL value is the assertion.)

- [ ] **Step 3: Commit**

```bash
git add assets/js/graph.js
git commit -m "feat(graph): hover-highlight neighbors + click-to-navigate"
```

---

## Task 5: Filter toolbar + search (extend `graph.js`, build toolbar)

**Files:**
- Modify: `assets/js/graph.js`

- [ ] **Step 1: Add toolbar builder + search** — add this function inside the IIFE and call it from `init()` after a successful load (replace the `render(all)` call in `init` with `buildToolbar(all); render(all);`):

```javascript
  function rerender(all) {
    cy.json({ elements: visibleElements(all) });
    cy.layout({ name: "fcose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 }).run();
  }

  function buildToolbar(all) {
    const bar = document.getElementById("graph-toolbar");
    if (!bar) return;
    const types = Object.keys(TYPE_COLORS);
    const checks = types.map(function (t) {
      const on = !hiddenTypes.has(t) ? "checked" : "";
      return '<label class="cy-filter"><input type="checkbox" data-type="' + t + '" ' + on + '>' +
        '<span class="cy-swatch" style="background:' + TYPE_COLORS[t] + '"></span>' + t + "</label>";
    }).join("");
    bar.innerHTML = checks + '<input id="cy-search" class="cy-search" type="search" placeholder="search…">';

    bar.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        const t = cb.dataset.type;
        if (cb.checked) hiddenTypes.delete(t); else hiddenTypes.add(t);
        rerender(all);
      });
    });

    const search = bar.querySelector("#cy-search");
    function applySearch() {
      const q = search.value.trim().toLowerCase();
      if (!q) { cy.elements().removeClass("dim").removeClass("hi"); return; }
      cy.elements().addClass("dim");
      const match = cy.nodes().filter(function (n) {
        return (n.data("label") || "").toLowerCase().indexOf(q) !== -1 ||
               (n.data("id") || "").toLowerCase().indexOf(q) !== -1;
      });
      match.removeClass("dim").addClass("hi");
      match.connectedEdges().removeClass("dim");
    }
    search.addEventListener("input", applySearch);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { const m = cy.elements(".hi"); if (m.length) cy.fit(m, 50); }
    });
  }
```

- [ ] **Step 2: Verify via browser MCP**

Reload the harness. Screenshot the toolbar (5 colored checkboxes — thread unchecked — + search box).
- Check the **thread** box → screenshot shows ~20 gray nodes added, **no crash** (dangling-edge guard holds).
- Uncheck **concept** → those nodes disappear, edges to them gone, no error.
- Type a known token (e.g. `eval`) in search → matching nodes highlighted, rest dimmed.

- [ ] **Step 3: Commit**

```bash
git add assets/js/graph.js
git commit -m "feat(graph): type filters + search highlight"
```

---

## Task 6: `graph.css`

**Files:**
- Create: `assets/css/graph.css`

- [ ] **Step 1: Write the stylesheet**

```css
/* assets/css/graph.css */
#graph-toolbar {
  display: flex; flex-wrap: wrap; gap: .75rem; align-items: center;
  padding: .5rem .25rem; font-size: .8rem;
}
.cy-filter { display: inline-flex; align-items: center; gap: .3rem; cursor: pointer; user-select: none; }
.cy-swatch { display: inline-block; width: .7rem; height: .7rem; border-radius: 50%; }
.cy-search { margin-left: auto; padding: .25rem .5rem; border: 1px solid #d1d5db; border-radius: 4px; }
#cy {
  width: 100%; height: 72vh; min-height: 420px;
  border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;
}
#cy-tip {
  display: none; position: fixed; z-index: 1000; max-width: 280px;
  padding: .4rem .55rem; font-size: .75rem; line-height: 1.3;
  background: #111827; color: #f9fafb; border-radius: 5px; pointer-events: none;
}
#cy-tip .cy-tip-type { color: #93c5fd; text-transform: uppercase; font-size: .65rem; }
@media (max-width: 640px) { #cy { height: 60vh; } }
```

- [ ] **Step 2: Verify** — reload harness; screenshot confirms toolbar/legend styled, canvas bordered, tooltip dark.

- [ ] **Step 3: Commit**

```bash
git add assets/css/graph.css
git commit -m "feat(graph): stylesheet for canvas, toolbar, tooltip"
```

---

## Task 7: Jekyll integration — layout + homepage + README demotion

**Files:**
- Create: `_layouts/graph.html`
- Create: `index.html`
- Modify: `README.md` (frontmatter only)

- [ ] **Step 1: Create the layout**

```html
---
layout: default
---

{{ content }}

<script src="https://unpkg.com/cytoscape@3.30.2/dist/cytoscape.min.js"></script>
<script src="https://unpkg.com/layout-base@2.0.1/layout-base.js"></script>
<script src="https://unpkg.com/cose-base@2.2.0/cose-base.js"></script>
<script src="https://unpkg.com/cytoscape-fcose@2.2.0/cytoscape-fcose.js"></script>
<link rel="stylesheet" href="{{ '/assets/css/graph.css' | relative_url }}" />
<script src="{{ '/assets/js/graph.js' | relative_url }}"></script>
```

- [ ] **Step 2: Create the homepage**

```html
---
title: Graph
permalink: /
layout: graph
nav_order: 1
---

<p>Interactive map of the knowledge graph — {{ site.title }}. Click a node to open its page; toggle types and search above. <a href="{{ '/overview/' | relative_url }}">Browse as a list →</a></p>

<div id="graph-toolbar"></div>
<div id="cy" data-baseurl="{{ site.baseurl }}" data-graph-url="{{ '/graph.json' | relative_url }}"></div>

<noscript>
  <p>This view needs JavaScript. <a href="{{ '/overview/' | relative_url }}">Browse the index as a list →</a></p>
</noscript>
```

- [ ] **Step 3: Demote README to `/overview/`** — change ONLY the README frontmatter block at the very top of `README.md`:

Current:
```yaml
---
title: Home
nav_order: 1
permalink: /
---
```
Replace with:
```yaml
---
title: Overview
nav_order: 2
permalink: /overview/
---
```
Leave the entire README body unchanged.

- [ ] **Step 4: Commit**

```bash
git add _layouts/graph.html index.html README.md
git commit -m "feat(graph): graph homepage layout + page; demote README to /overview/"
```

---

## Task 8: Full-site verification

**Files:** none (verification only)

- [ ] **Step 1: If Ruby/Jekyll is available, build & serve the real site**

```bash
ruby -v && (bundle exec jekyll serve --port 8100 2>/dev/null || jekyll serve --port 8100)
```
If it serves: via the browser MCP, navigate to `http://localhost:8100/H-AI-/`. Screenshot.
Expected: homepage shows the graph **with the just-the-docs sidebar present**; toolbar + search work; `/H-AI-/overview/` shows the old README index; the sidebar nav still lists pages.

- [ ] **Step 2: If Ruby is NOT available, fall back to harness + code review**

Confirm `ruby -v` fails. Then rely on the Task 2–6 harness verification (already exercises the real `graph.js`/`graph.css` + `graph.json`), and code-review `_layouts/graph.html` / `index.html` / `README.md` against the spec's integration section. Note in the final report that live Jekyll integration is verified on the GitHub Pages deploy.

- [ ] **Step 3: Stop the dev server(s)**

```bash
# find and stop the python http.server / jekyll process started earlier
pkill -f "http.server 8099" 2>/dev/null; pkill -f "jekyll serve" 2>/dev/null; true
```

- [ ] **Step 4: Confirm acceptance criteria** (from the spec) and report which were verified live vs. by review:
  - Homepage `/` = interactive graph, sidebar present.
  - Non-thread nodes visible by default, colored, legend + filters + search work.
  - Node click → correct `.html` URL.
  - Graceful degradation (fetch-fail message / `<noscript>` / mobile) to `/overview/`.
  - `README.md` body unchanged; reachable at `/overview/`; renders on github.com.
  - No `build-graph.py` / `graph.json` changes.

---

## Notes

- **`dev/graph-harness.html`** is a dev artifact. It is committed (Task 2) for repeatable verification; it's harmless on the published site (not linked, and `dev/` isn't in nav). If you'd rather not ship it, add `dev/` to `_config.yml`'s `exclude` and `.gitignore` instead — decide during execution.
- **CDN pinning:** versions are pinned (`cytoscape@3.30.2`, `cytoscape-fcose@2.2.0`, `cose-base@2.2.0`, `layout-base@2.0.1`). fcose requires `layout-base` then `cose-base` loaded *before* it — keep the script order in both the layout and the harness.
- **fcose registration gotcha:** the browser UMD build of cytoscape-fcose self-registers when loaded after `cytoscape`. If Task 3 verification errors with `No such layout 'fcose'`, add one line at the top of `init()`: `try { if (window.cytoscapeFcose) cytoscape.use(window.cytoscapeFcose); } catch (e) {}`. The Task 3 screenshot/console check is what surfaces this.
- **Pushing** the result to `origin` is a separate, explicit step the user must request ("push") — see the repo's push policy.
