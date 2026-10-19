// assets/js/graph.js — interactive knowledge-graph homepage
//
// Interaction model borrowed from a 3D force-graph reference (x.mitbunny.ai,
// react-force-graph-3d) and re-implemented in 2D cytoscape, because the useful
// idea there was not the third dimension: it was hiding the hairball. With 190+
// nodes and 1100+ deduped edges, every edge drawn at readable opacity is noise. So
// edges sit at constellation strength by default and only the selected node's
// ego-network lights up. Selection is sticky and opens a detail card, so a node
// can be inspected without leaving the page.
(function () {
  "use strict";

  const TYPE_COLORS = {
    topic:     "#5eead4", // teal — entry points
    concept:   "#a5b4fc", // indigo — the body of the graph
    project:   "#fbbf24", // amber — built things
    reference: "#f472b6", // pink — external pointers
  };
  const DEFAULT_HIDDEN_TYPES = [];

  const MAX_NEIGHBORS_SHOWN = 14;
  const ZOOM_STEP = 1.45;
  const LAYOUT = { name: "fcose", quality: "default", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 };
  // Positions are cached per browser, keyed by the graph's signature. fcose is
  // randomised, so without this the map reshuffled on every visit, and the
  // layout was also the single longest task on page load.
  const POS_KEY = "hai-graph-layout-v1";
  // fcose settles into a roughly round cluster; a wide viewport then shows it as a
  // disc with empty bands either side. The layout is stretched along one axis to
  // the viewport's shape, capped so edges don't visibly skew.
  const MAX_STRETCH = 1.7;
  const FIT_PAD = 24;

  // pure: node `path` (e.g. nodes/concepts/x.md) -> site URL (/baseurl/nodes/concepts/x.html)
  function nodeUrl(path, baseurl) {
    if (!path || typeof path !== "string") return null;
    return (baseurl || "") + "/" + path.replace(/\.md$/, ".html");
  }

  // pure: text -> HTML-safe text. Summaries are ours, but they contain quotes and
  // angle brackets often enough that interpolating them raw is a latent bug.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // pure: long node titles -> a chip-sized label. CSS ellipsis alone let a title
  // outgrow the detail card, so the truncation is done in content, with the full
  // title kept on the element's title attribute.
  function clip(s, max) {
    s = String(s == null ? "" : s);
    return s.length <= max ? s : s.slice(0, max - 1).replace(/[\s\u2014-]+$/, "") + "…";
  }

  // pure: zoom -> the minimum degree a node needs to keep its label. The 2D
  // equivalent of the reference's distance-based label fade: zoomed out, only hubs
  // are named (193 nodes' labels at once is a smear); zoom in and the rest appear.
  // Thresholds picked against this graph's degree distribution and checked against
  // rendered screenshots — 24+ is ~12 nodes, 18+ is ~30, 12+ is ~77, and ~77 labels
  // is already a smear in the dense core.
  function labelFloor(zoom) {
    if (zoom >= 1.7) return 0;
    if (zoom >= 1.15) return 12;
    if (zoom >= 0.8) return 18;
    return 24;
  }

  // pure: degree -> halo padding. The reference stacks 20 transparent spheres for
  // a bloom; cytoscape gives one underlay, so the size carries the emphasis.
  function glowPad(deg) {
    return 3 + Math.min(Math.max(deg || 0, 0), 24) * 0.42;
  }

  // pure: degree -> node diameter. Precomputed into data() so the stylesheet
  // uses plain data mappers; function mappers defeat cytoscape's style cache.
  function sizeFor(deg) {
    return 9 + Math.min(Math.max(deg || 0, 0), 18);
  }

  // pure: {nodes, edges} -> short signature of the exact graph. A cached layout
  // is only reused for the graph it was computed on.
  function graphSig(all) {
    const s = all.nodes.map(function (n) { return n.data.id; }).sort().join("\n") + "\n#\n" +
              all.edges.map(function (e) { return e.data.id; }).sort().join("\n");
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + "." + all.nodes.length + "." + all.edges.length;
  }

  // pure: neighbour positions + index -> a start point for a node that is being
  // shown for the first time: the neighbours' centroid, fanned out on a golden
  // angle so siblings seeded at the same centroid don't stack. null if no neighbours.
  function seedPosition(pts, i) {
    if (!pts || !pts.length) return null;
    let x = 0, y = 0;
    for (const p of pts) { x += p.x; y += p.y; }
    const a = (i || 0) * 2.39996, r = 16;
    return { x: x / pts.length + r * Math.cos(a), y: y / pts.length + r * Math.sin(a) };
  }

  // pure: layout box + viewport box -> horizontal scale factor that brings the
  // layout's aspect ratio to the viewport's, clamped to [1/max, max]. Below 1 it
  // narrows x, which after a uniform fit reads as stretching y (portrait screens).
  function aspectScale(bw, bh, vw, vh, max) {
    if (!(bw > 0 && bh > 0 && vw > 0 && vh > 0)) return 1;
    const k = (vw / vh) / (bw / bh);
    return Math.min(max, Math.max(1 / max, k));
  }

  // pure: layout box + target area + zoom limits -> {zoom, pan} that centres the
  // box in the area. cy.fit only takes a uniform padding, so it can't keep the
  // graph out from under the floating panel.
  function fitViewport(bb, area, minZ, maxZ) {
    const z = Math.min(maxZ, Math.max(minZ, Math.min(area.w / bb.w, area.h / bb.h)));
    return { zoom: z, pan: {
      x: area.x + (area.w - bb.w * z) / 2 - bb.x1 * z,
      y: area.y + (area.h - bb.h * z) / 2 - bb.y1 * z } };
  }

  // pure: {nodes, edges} -> Map id -> Set of neighbour ids, in one pass. The
  // detail card used to rescan every edge and node per click.
  function adjacency(all) {
    const m = new Map();
    for (const n of (all.nodes || [])) m.set(n.data.id, new Set());
    for (const e of (all.edges || [])) {
      const a = e.data.source, b = e.data.target;
      if (a === b) continue;
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a).add(b); m.get(b).add(a);
    }
    return m;
  }

  // pure: {nodes, edges} + id -> Set of adjacent node ids. Kept out of cytoscape
  // so the detail card's neighbour list is testable without a renderer.
  function neighborIds(all, id) {
    const out = new Set();
    for (const e of (all.edges || [])) {
      if (e.data.source === id) out.add(e.data.target);
      else if (e.data.target === id) out.add(e.data.source);
    }
    out.delete(id);
    return out;
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
    const deg = {};
    for (const e of edges) {
      deg[e.data.source] = (deg[e.data.source] || 0) + 1;
      deg[e.data.target] = (deg[e.data.target] || 0) + 1;
    }
    for (const n of nodes) {
      const d = deg[n.data.id] || 0;
      n.data.deg = d;
      n.data.size = sizeFor(d);
      n.data.glow = glowPad(d);
    }
    return { nodes, edges };
  }

  // --- inline self-checks (run in browser console; visible to the verification MCP) ---
  function selfCheck() {
    console.assert(nodeUrl("nodes/concepts/x.md", "/H-AI-") === "/H-AI-/nodes/concepts/x.html", "nodeUrl basic");
    console.assert(nodeUrl(null, "/H-AI-") === null, "nodeUrl null path");
    console.assert(esc('a<b & "c"') === "a&lt;b &amp; &quot;c&quot;", "esc escapes");
    console.assert(clip("short", 30) === "short", "clip passes short strings");
    console.assert(clip("x".repeat(40), 30).length === 30, "clip caps length");
    console.assert(clip("abcdef", 4).endsWith("…"), "clip marks truncation");
    console.assert(glowPad(0) === 3, "glowPad floor");
    console.assert(glowPad(1000) === glowPad(24), "glowPad clamps");
    console.assert(glowPad(10) > glowPad(2), "glowPad monotonic");
    console.assert(labelFloor(2) === 0, "labelFloor: zoomed in names everything");
    console.assert(labelFloor(1.2) === 12 && labelFloor(1.0) === 18 && labelFloor(0.4) === 24, "labelFloor tiers");
    console.assert(labelFloor(2) < labelFloor(1.2) && labelFloor(1.2) < labelFloor(0.4), "labelFloor monotonic in zoom");
    const g = { nodes: [{id:"a",path:"a.md",type:"topic",title:"A"},{id:"b",path:"b.md",type:"concept",title:"B"},{id:"c"}],
                edges: [{from:"a",to:"b"},{from:"a",to:"b"},{from:"a",to:"z"}] };
    const el = buildElements(g, "/H-AI-");
    console.assert(el.nodes.length === 2, "buildElements drops node c (no path), got " + el.nodes.length);
    console.assert(el.edges.length === 1, "buildElements dedupes + drops dangling a->z, got " + el.edges.length);
    const nb = neighborIds(el, "a");
    console.assert(nb.size === 1 && nb.has("b"), "neighborIds finds b");
    console.assert(neighborIds(el, "zz").size === 0, "neighborIds unknown id is empty");
    const adj = adjacency(el);
    console.assert(adj.get("a").has("b") && adj.get("b").has("a") && adj.get("a").size === 1, "adjacency is symmetric");
    console.assert(el.nodes[0].data.size === sizeFor(1) && el.nodes[0].data.glow === glowPad(1), "buildElements precomputes size/glow");
    console.assert(sizeFor(0) === 9 && sizeFor(1000) === sizeFor(18), "sizeFor clamps");
    const rev = { nodes: el.nodes.slice().reverse(), edges: el.edges.slice().reverse() };
    console.assert(graphSig(el) === graphSig(rev), "graphSig ignores order");
    const more = { nodes: el.nodes, edges: el.edges.concat([{ data: { id: "e_a|a2" } }]) };
    console.assert(graphSig(el) !== graphSig(more), "graphSig changes with the graph");
    const sp = seedPosition([{ x: 0, y: 0 }, { x: 10, y: 20 }], 0);
    console.assert(Math.abs(sp.x - 21) < 1e-9 && Math.abs(sp.y - 10) < 1e-9, "seedPosition centroid + offset");
    console.assert(seedPosition([], 0) === null, "seedPosition with no neighbours is null");
    const s0 = seedPosition([{ x: 0, y: 0 }], 0), s1 = seedPosition([{ x: 0, y: 0 }], 1);
    console.assert(s0.x !== s1.x || s0.y !== s1.y, "seedPosition fans siblings out");
    console.assert(aspectScale(100, 100, 200, 100, 3) === 2, "aspectScale widens for a wide viewport");
    console.assert(aspectScale(100, 100, 100, 200, 3) === 0.5, "aspectScale narrows for a tall viewport");
    console.assert(aspectScale(100, 100, 1000, 100, 1.7) === 1.7, "aspectScale clamps");
    console.assert(aspectScale(0, 100, 200, 100, 3) === 1, "aspectScale degenerate box is identity");
    const fv = fitViewport({ x1: 0, y1: 0, w: 100, h: 50 }, { x: 10, y: 10, w: 200, h: 200 }, 0.1, 10);
    console.assert(fv.zoom === 2 && fv.pan.x === 10 && fv.pan.y === 60, "fitViewport centres the box in the area");
    console.assert(fitViewport({ x1: 0, y1: 0, w: 100, h: 50 }, { x: 0, y: 0, w: 200, h: 200 }, 0.1, 1.5).zoom === 1.5, "fitViewport respects maxZoom");
    console.log("graph.js self-check OK");
  }

  let cy = null;
  let hiddenTypes = new Set(DEFAULT_HIDDEN_TYPES);
  let selectedId = null;
  let labelFrame = 0;
  let lastFloor = -1;
  let adj = new Map();      // id -> Set(neighbour id), built once per load
  let byId = new Map();     // id -> element definition
  let sig = "";             // graphSig of the loaded graph
  const placed = new Set(); // ids that have a real position (laid out or cached)

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function typeColor(t) { return TYPE_COLORS[t] || TYPE_COLORS.concept; }

  function cytoStyle() {
    const typeSelectors = Object.keys(TYPE_COLORS).map(function (t) {
      return { selector: 'node[type = "' + t + '"]', style: {
        "background-color": TYPE_COLORS[t], "border-color": TYPE_COLORS[t], "underlay-color": TYPE_COLORS[t] } };
    });
    return [
      { selector: "node", style: {
          "label": "data(label)",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": 5.5, "color": "#aeb9c9",
          "text-valign": "bottom", "text-halign": "center", "text-margin-y": 4,
          "text-outline-color": "#05060a", "text-outline-width": 2.2,
          "min-zoomed-font-size": 9,
          "border-width": 4, "border-opacity": 0.14,
          // the halo: one underlay ring, sized by degree (colour set per type below)
          "underlay-opacity": 0.13,
          "underlay-padding": "data(glow)",
          "underlay-shape": "ellipse",
          "width": "data(size)",
          "height": "data(size)" } },
      { selector: "edge", style: {
          "width": 0.5, "line-color": "#94a3b8", "curve-style": "straight", "opacity": 0.12 } },
      ...typeSelectors,
      { selector: "node.lbl-off", style: { "text-opacity": 0 } },
      { selector: ".dim", style: { "opacity": 0.06, "text-opacity": 0, "underlay-opacity": 0 } },
      // An emphasised node is always named, at any zoom — the label policy and
      // cytoscape's own min-zoomed-font-size both have to yield to it.
      { selector: "node.hi", style: {
          "opacity": 1, "text-opacity": 1, "z-index": 10, "min-zoomed-font-size": 0,
          "border-opacity": 0.5, "underlay-opacity": 0.3 } },
      { selector: "edge.hi", style: { "opacity": 0.55, "width": 1, "line-color": "#cbd5e1" } },
      { selector: "node.sel", style: {
          "z-index": 20, "text-opacity": 1, "min-zoomed-font-size": 0,
          "border-width": 2.5, "border-opacity": 0.95, "border-color": "#f8fafc",
          "underlay-opacity": 0.5 } },
      { selector: 'node[status = "archived"]', style: { "opacity": 0.55 } },
      // filtered-out types stay in the graph (and keep their positions) but aren't
      // drawn; cytoscape hides their edges with them
      { selector: "node.gone", style: { "display": "none" } },
    ];
  }

  // --- layout -----------------------------------------------------------------
  function shownNodes() { return cy.nodes().not(".gone"); }
  function shownElements() { const ns = shownNodes(); return ns.union(ns.edgesWith(ns)); }

  // Stretch the shown layout along x to the viewport's shape (see MAX_STRETCH).
  // Applied to every placed node, hidden ones included, so a type toggled back on
  // lands in the same frame. Idempotent: a layout already matching is left alone.
  function shownBox() { return shownNodes().boundingBox({ includeLabels: false }); }

  // The part of the viewport the graph should occupy: all of it, minus the
  // floating panel's column when the screen is wide enough for both side by side.
  // On narrow screens the panel overlays the map instead (and starts collapsed).
  function fitArea() {
    const w = cy.width(), h = cy.height();
    const bar = document.getElementById("graph-toolbar");
    let left = 0;
    if (bar && w >= 900 && !bar.classList.contains("collapsed")) {
      left = Math.max(0, bar.getBoundingClientRect().right - cy.container().getBoundingClientRect().left);
    }
    // and keep the bottom strip clear for the zoom pill (32px tall, 10-16px up)
    const pill = 44;
    return { x: left + FIT_PAD, y: FIT_PAD, w: Math.max(1, w - left - 2 * FIT_PAD), h: Math.max(1, h - 2 * FIT_PAD - pill) };
  }

  function fitShown(animate) {
    const bb = shownBox();
    if (!(bb.w > 0 && bb.h > 0)) { cy.fit(shownNodes(), FIT_PAD); return; }
    const v = fitViewport(bb, fitArea(), cy.minZoom(), cy.maxZoom());
    if (animate && !reduceMotion) cy.animate(v, { duration: 300 }); else cy.viewport(v);
  }

  // fcose leaves disconnected components wherever repulsion pushed them (its
  // packing needs another extension), so a two-node island could sit a screen
  // away and shrink the whole fit. Stack the small ones down the main cluster's
  // right edge, starting a new column when one runs past its bottom.
  function tuckComponents() {
    const comps = shownElements().components().sort(function (a, b) { return b.nodes().length - a.nodes().length; });
    if (comps.length < 2) return;
    const main = comps[0].nodes().boundingBox({ includeLabels: false });
    const gap = 36;
    let x = main.x2 + gap, y = main.y1, colW = 0;
    comps.slice(1).forEach(function (c) {
      const b = c.nodes().boundingBox({ includeLabels: false });
      if (y > main.y1 && y + b.h > main.y2) { x += colW + gap; y = main.y1; colW = 0; }
      const dx = x - b.x1, dy = y - b.y1;
      c.nodes().forEach(function (n) { n.position({ x: n.position("x") + dx, y: n.position("y") + dy }); });
      y += b.h + gap;
      colW = Math.max(colW, b.w);
    });
  }

  function stretchToViewport() {
    const bb = shownBox();
    const area = fitArea();
    const k = aspectScale(bb.w, bb.h, area.w, area.h, MAX_STRETCH);
    if (Math.abs(k - 1) < 0.04) return false;
    const cx = (bb.x1 + bb.x2) / 2;
    cy.batch(function () {
      cy.nodes().forEach(function (n) {
        if (!placed.has(n.id())) return;
        n.position("x", cx + (n.position("x") - cx) * k);
      });
    });
    return true;
  }

  function loadPositions() {
    try {
      const v = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      return v && v.sig === sig && v.pos ? v.pos : null;
    } catch (e) { return null; }
  }

  function savePositions() {
    try {
      const pos = {};
      cy.nodes().forEach(function (n) {
        if (!placed.has(n.id())) return;
        const p = n.position();
        pos[n.id()] = [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
      });
      localStorage.setItem(POS_KEY, JSON.stringify({ sig: sig, pos: pos }));
    } catch (e) { /* storage full or blocked: the layout just isn't remembered */ }
  }

  // Show or hide one node type. Hiding is a class flip, so the map doesn't move.
  // Showing a type for the first time seeds each newcomer beside its neighbours
  // and lets fcose fit them in with every already-placed node pinned, instead of
  // re-laying out (and reshuffling) the whole graph.
  function setTypeHidden(t, hide) {
    deselect();
    const ns = cy.nodes('[type = "' + t + '"]');
    if (hide) { ns.addClass("gone"); return; }
    ns.removeClass("gone");
    const fresh = ns.filter(function (n) { return !placed.has(n.id()); });
    if (!fresh.length) return;
    const bb = shownNodes().difference(fresh).boundingBox();
    const mid = { x: (bb.x1 + bb.x2) / 2 || 0, y: (bb.y1 + bb.y2) / 2 || 0 };
    const pinned = [];
    cy.batch(function () {
      fresh.forEach(function (n, i) {
        const pts = n.neighborhood("node").filter(function (m) { return placed.has(m.id()) && !m.hasClass("gone"); })
          .map(function (m) { return m.position(); });
        n.position(seedPosition(pts, i) || seedPosition([mid], i));
      });
    });
    shownNodes().forEach(function (n) {
      if (placed.has(n.id())) pinned.push({ nodeId: n.id(), position: { x: n.position("x"), y: n.position("y") } });
    });
    fresh.forEach(function (n) { placed.add(n.id()); });
    const lay = shownElements().layout(Object.assign({}, LAYOUT, {
      randomize: false, fit: false, fixedNodeConstraint: pinned,
      animate: !reduceMotion, animationDuration: 450,
    }));
    lay.one("layoutstop", savePositions);
    lay.run();
  }

  // --- emphasis -------------------------------------------------------------
  // One code path for hover-preview and sticky selection: light the closed
  // neighbourhood, dim the rest.
  function spotlight(node, sticky) {
    cy.batch(function () {
      cy.elements().addClass("dim").removeClass("hi");
      node.closedNeighborhood().removeClass("dim").addClass("hi");
      cy.nodes().removeClass("sel");
      if (sticky) node.addClass("sel");
    });
  }

  function clearEmphasis() {
    cy.batch(function () {
      cy.elements().removeClass("dim").removeClass("hi").removeClass("sel");
    });
    applyLabelPolicy();
  }

  // Restore whatever emphasis the *persistent* state calls for — used when a
  // hover preview ends while a node is still selected.
  function restoreEmphasis() {
    if (!selectedId) { clearEmphasis(); return; }
    const n = cy.getElementById(selectedId);
    if (n && n.length) spotlight(n, true); else { selectedId = null; clearEmphasis(); }
  }

  // Labels depend only on zoom tier and degree, so the pass over every node runs
  // when the tier changes, not on every zoom frame.
  function applyLabelPolicy() {
    if (!cy) return;
    const floor = labelFloor(cy.zoom());
    if (floor === lastFloor) return;
    lastFloor = floor;
    cy.batch(function () {
      cy.nodes().forEach(function (n) {
        n.toggleClass("lbl-off", (n.data("deg") || 0) < floor);
      });
    });
  }

  function scheduleLabelPolicy() {
    if (labelFrame) return;
    labelFrame = requestAnimationFrame(function () { labelFrame = 0; applyLabelPolicy(); });
  }

  // --- detail card ----------------------------------------------------------
  function detailHtml(d) {
    const nbrs = Array.from(adj.get(d.id) || [])
      .map(function (id) { return byId.get(id); })
      .filter(Boolean)
      .filter(function (n) { return !hiddenTypes.has(n.data.type); })
      .sort(function (a, b) { return (b.data.deg || 0) - (a.data.deg || 0); });
    const shown = nbrs.slice(0, MAX_NEIGHBORS_SHOWN);
    const rest = nbrs.length - shown.length;
    const chips = shown.map(function (n) {
      return '<button class="cy-nbr" type="button" data-id="' + esc(n.data.id) + '"' +
        ' title="' + esc(n.data.label) + '">' +
        '<span class="cy-dot" style="background:' + typeColor(n.data.type) + '"></span>' +
        esc(clip(n.data.label, 30)) + "</button>";
    }).join("");
    const meta = [d.type, d.status, d.deg + (d.deg === 1 ? " link" : " links")]
      .filter(Boolean).map(esc).join(" · ");
    return '<div class="cy-detail-band" style="--band:' + typeColor(d.type) + '"></div>' +
      '<button class="cy-detail-close" type="button" aria-label="Close details">×</button>' +
      '<div class="cy-detail-body">' +
        '<div class="cy-detail-kicker">' + meta + "</div>" +
        '<h2 class="cy-detail-title">' + esc(d.label) + "</h2>" +
        (d.summary ? '<p class="cy-detail-summary">' + esc(d.summary) + "</p>" : "") +
        (shown.length
          ? '<div class="cy-detail-sub">connects to</div><div class="cy-detail-nbrs">' + chips +
            (rest > 0 ? '<span class="cy-nbr-more">+' + rest + " more</span>" : "") + "</div>"
          : '<div class="cy-detail-sub">no links yet</div>') +
        '<a class="cy-detail-open" href="' + esc(d.url) + '">Open page →</a>' +
      "</div>";
  }

  function showDetail(all, node) {
    const card = document.getElementById("cy-detail");
    if (!card) return;
    card.innerHTML = detailHtml(node.data());
    card.hidden = false;
    card.querySelector(".cy-detail-close").addEventListener("click", function () { deselect(); });
    card.querySelectorAll(".cy-nbr").forEach(function (b) {
      b.addEventListener("click", function () { select(all, b.dataset.id, true); });
    });
  }

  function hideDetail() {
    const card = document.getElementById("cy-detail");
    if (card) { card.hidden = true; card.innerHTML = ""; }
  }

  function select(all, id, center) {
    const n = cy.getElementById(id);
    if (!n || !n.length) return;
    selectedId = id;
    spotlight(n, true);
    showDetail(all, n);
    if (center) {
      if (reduceMotion) cy.center(n);
      else cy.animate({ center: { eles: n } }, { duration: 240 });
    }
  }

  function deselect() {
    selectedId = null;
    hideDetail();
    if (cy) clearEmphasis();
  }

  // --- chrome ---------------------------------------------------------------
  function zoomBy(factor) {
    const z = Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor));
    const center = { x: cy.width() / 2, y: cy.height() / 2 };
    if (reduceMotion) cy.zoom({ level: z, renderedPosition: center });
    else cy.animate({ zoom: { level: z, renderedPosition: center } }, { duration: 160 });
    scheduleLabelPolicy();
  }

  function buildChrome(all) {
    const mount = document.getElementById("cy");
    const host = mount.parentElement || document.body;

    if (!document.getElementById("cy-detail")) {
      const card = document.createElement("aside");
      card.id = "cy-detail";
      card.className = "cy-detail";
      card.setAttribute("role", "complementary");
      card.setAttribute("aria-label", "Selected node");
      card.hidden = true;
      host.appendChild(card);
    }

    if (!document.getElementById("cy-zoom")) {
      const pill = document.createElement("div");
      pill.id = "cy-zoom";
      pill.className = "cy-zoom";
      pill.innerHTML =
        '<button type="button" data-act="out" title="Zoom out" aria-label="Zoom out">−</button>' +
        '<button type="button" data-act="fit" title="Reset view" aria-label="Reset view">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>' +
        '<button type="button" data-act="in" title="Zoom in" aria-label="Zoom in">+</button>';
      host.appendChild(pill);
      pill.addEventListener("click", function (e) {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.act === "in") zoomBy(ZOOM_STEP);
        else if (b.dataset.act === "out") zoomBy(1 / ZOOM_STEP);
        else {
          deselect();
          if (stretchToViewport()) savePositions();
          fitShown(true);
        }
      });
    }
  }

  function render(all) {
    sig = graphSig(all);
    adj = adjacency(all);
    byId = new Map(all.nodes.map(function (n) { return [n.data.id, n]; }));
    placed.clear();
    lastFloor = -1;
    const cached = loadPositions() || {};
    const nodes = all.nodes.map(function (n) {
      const el = { data: n.data, classes: hiddenTypes.has(n.data.type) ? "gone" : "" };
      const p = cached[n.data.id];
      if (p) { el.position = { x: p[0], y: p[1] }; placed.add(n.data.id); }
      return el;
    });
    cy = cytoscape({
      container: document.getElementById("cy"),
      elements: nodes.concat(all.edges),
      style: cytoStyle(),
      layout: { name: "preset", fit: false },
      wheelSensitivity: 0.2,
    });
    const shown = shownNodes();
    const cachedAll = shown.length && shown.every(function (n) { return placed.has(n.id()); });
    if (!cachedAll) {
      placed.clear();
      shownElements().layout(Object.assign({}, LAYOUT, { fit: false })).run();
      tuckComponents();
      shown.forEach(function (n) { placed.add(n.id()); });
    }
    // A cached layout may have been stretched for a different window; restretch
    // to this one (cheap, and a no-op when the shape already matches).
    if (stretchToViewport() || !cachedAll) savePositions();
    fitShown(false);

    // tooltip (plain div — no extra dependency)
    let tip = document.getElementById("cy-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "cy-tip";
      document.body.appendChild(tip);
    }
    cy.on("mouseover", "node", function (e) {
      const n = e.target;
      tip.innerHTML = "<strong>" + esc(n.data("label")) + "</strong><br>" +
        '<span class="cy-tip-type">' + esc(n.data("type")) + "</span> " + esc(n.data("summary"));
      tip.style.display = "block";
      spotlight(n, n.id() === selectedId);
    });
    cy.on("mousemove", function (e) {
      var oe = e.originalEvent;
      if (!oe || tip.style.display !== "block") return;
      tip.style.left = (oe.clientX + 14) + "px";
      tip.style.top = (oe.clientY + 14) + "px";
    });
    cy.on("mouseout", "node", function () {
      tip.style.display = "none";
      restoreEmphasis();
    });

    // Click selects (and opens the card) rather than navigating — a node can be
    // read without losing your place in the map. Cmd/ctrl-click and double-click
    // still go straight to the page.
    cy.on("tap", "node", function (e) {
      const oe = e.originalEvent;
      if (oe && (oe.metaKey || oe.ctrlKey)) {
        window.open(e.target.data("url"), "_blank", "noopener");
        return;
      }
      select(all, e.target.id(), false);
    });
    cy.on("dbltap", "node", function (e) {
      const u = e.target.data("url");
      if (u) window.location.assign(u);
    });
    cy.on("tap", function (e) { if (e.target === cy) deselect(); });
    cy.on("zoom", scheduleLabelPolicy);

    applyLabelPolicy();
    return cy;
  }

  function buildToolbar(all) {
    const bar = document.getElementById("graph-toolbar");
    if (!bar) return;
    const counts = {};
    all.nodes.forEach(function (n) { counts[n.data.type] = (counts[n.data.type] || 0) + 1; });
    const types = Object.keys(TYPE_COLORS);
    const chips = types.map(function (t) {
      const off = hiddenTypes.has(t) ? " off" : "";
      return '<button class="cy-chip' + off + '" data-type="' + t + '" type="button" ' +
        'aria-pressed="' + (!hiddenTypes.has(t)) + '">' +
        '<span class="cy-dot" style="background:' + TYPE_COLORS[t] + '"></span>' +
        '<span class="cy-chip-label">' + t + '</span>' +
        '<span class="cy-chip-count">' + (counts[t] || 0) + '</span></button>';
    }).join("");
    // Collapsible: on a phone the open panel covers a third of the map.
    const collapsed = !!(window.matchMedia && window.matchMedia("(max-width: 640px)").matches);
    bar.classList.toggle("collapsed", collapsed);
    bar.innerHTML =
      '<button class="cy-panel-head" type="button" aria-expanded="' + !collapsed + '" aria-controls="cy-panel-body">' +
        'the graph<span class="cy-caret" aria-hidden="true"></span></button>' +
      '<div class="cy-panel-body" id="cy-panel-body">' +
      '<div class="cy-legend">' + chips + '</div>' +
      '<input id="cy-search" class="cy-search" type="search" placeholder="search nodes…" aria-label="search nodes">' +
      '<div class="cy-stats">' + all.nodes.length + ' nodes · ' + all.edges.length + ' links</div>' +
      '<div class="cy-hint">click a node for details · ⌘-click opens it</div>' +
      '</div>';

    bar.querySelector(".cy-panel-head").addEventListener("click", function (e) {
      const nowCollapsed = bar.classList.toggle("collapsed");
      e.currentTarget.setAttribute("aria-expanded", String(!nowCollapsed));
      if (cy) fitShown(true); // the panel's column is reclaimed or given back
    });

    bar.querySelectorAll(".cy-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const t = chip.dataset.type;
        const nowOn = hiddenTypes.has(t);
        if (nowOn) hiddenTypes.delete(t); else hiddenTypes.add(t);
        chip.classList.toggle("off", !nowOn);
        chip.setAttribute("aria-pressed", String(nowOn));
        setTypeHidden(t, !nowOn);
        if (search.value.trim()) applySearch();
      });
    });

    const search = bar.querySelector("#cy-search");
    function applySearch() {
      const q = search.value.trim().toLowerCase();
      if (!q) { restoreEmphasis(); return; }
      cy.batch(function () {
        cy.elements().addClass("dim").removeClass("hi");
        const match = shownNodes().filter(function (n) {
          return (n.data("label") || "").toLowerCase().indexOf(q) !== -1 ||
                 (n.data("id") || "").toLowerCase().indexOf(q) !== -1;
        });
        match.removeClass("dim").addClass("hi");
        match.connectedEdges().removeClass("dim");
      });
    }
    search.addEventListener("input", applySearch);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const m = cy.nodes(".hi").not(".gone");
        if (m.length === 1) select(all, m[0].id(), true);
        else if (m.length) cy.fit(m, 50);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (document.activeElement === search && search.value) { search.value = ""; applySearch(); return; }
      deselect();
    });
  }

  function doneLoading() {
    const el = document.querySelector(".cy-loading");
    if (el) el.remove();
  }

  function init() {
    try { if (window.cytoscapeFcose) cytoscape.use(window.cytoscapeFcose); } catch (e) {}
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
      buildToolbar(all); // before render: the fit reads the panel's size and state
      render(all);
      buildChrome(all);
      doneLoading();
    }).catch(function (err) {
      console.error("graph: load failed", err);
      doneLoading();
      mount.innerHTML = '<p style="padding:1rem">Graph couldn\'t load. ' +
        '<a href="' + (baseurl || "") + '/overview/">Browse as a list →</a></p>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }

  // expose for harness/console
  window.__graph = {
    nodeUrl, esc, clip, glowPad, sizeFor, labelFloor, neighborIds, adjacency, graphSig, seedPosition, aspectScale, fitViewport,
    buildElements, selfCheck,
    render, init, TYPE_COLORS, DEFAULT_HIDDEN_TYPES,
    select: function (id, center) { return select(window.__graphAll, id, center); },
    deselect,
    get cy(){return cy;},
  };
})();
