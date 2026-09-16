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
    thread:    "#64748b", // slate — provenance (hidden by default)
  };
  const DEFAULT_HIDDEN_TYPES = ["thread"];

  const MAX_NEIGHBORS_SHOWN = 14;
  const ZOOM_STEP = 1.45;

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
    for (const n of nodes) { n.data.deg = deg[n.data.id] || 0; }
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
    console.log("graph.js self-check OK");
  }

  let cy = null;
  let hiddenTypes = new Set(DEFAULT_HIDDEN_TYPES);
  let selectedId = null;
  let labelFrame = 0;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function typeColor(t) { return TYPE_COLORS[t] || TYPE_COLORS.concept; }

  function cytoStyle() {
    const typeSelectors = Object.keys(TYPE_COLORS).map(function (t) {
      return { selector: 'node[type = "' + t + '"]', style: {
        "background-color": TYPE_COLORS[t], "border-color": TYPE_COLORS[t] } };
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
          // the halo: one underlay ring, sized by degree
          "underlay-color": function (ele) { return typeColor(ele.data("type")); },
          "underlay-opacity": 0.13,
          "underlay-padding": function (ele) { return glowPad(ele.data("deg")); },
          "underlay-shape": "ellipse",
          "width": function (ele) { return 9 + Math.min(ele.data("deg") || 0, 18); },
          "height": function (ele) { return 9 + Math.min(ele.data("deg") || 0, 18); } } },
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
    ];
  }

  function visibleElements(all) {
    const nodes = all.nodes.filter(function (n) { return !hiddenTypes.has(n.data.type); });
    const ids = new Set(nodes.map(function (n) { return n.data.id; }));
    const edges = all.edges.filter(function (e) { return ids.has(e.data.source) && ids.has(e.data.target); });
    return nodes.concat(edges);
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

  function applyLabelPolicy() {
    if (!cy) return;
    const floor = labelFloor(cy.zoom());
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
  function detailHtml(d, all) {
    const nbrs = Array.from(neighborIds(all, d.id))
      .map(function (id) { return all.nodes.find(function (n) { return n.data.id === id; }); })
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
    card.innerHTML = detailHtml(node.data(), all);
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
        else { deselect(); cy.animate({ fit: { padding: 40 } }, { duration: reduceMotion ? 0 : 300 }); }
      });
    }
  }

  function render(all) {
    cy = cytoscape({
      container: document.getElementById("cy"),
      elements: visibleElements(all),
      style: cytoStyle(),
      layout: { name: "fcose", quality: "default", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 },
      wheelSensitivity: 0.2,
    });

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
      if (!oe) return;
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

  function rerender(all) {
    deselect();
    cy.json({ elements: visibleElements(all) });
    cy.layout({ name: "fcose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 }).run();
    applyLabelPolicy();
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
    bar.innerHTML =
      '<div class="cy-panel-head">the graph</div>' +
      '<div class="cy-legend">' + chips + '</div>' +
      '<input id="cy-search" class="cy-search" type="search" placeholder="search nodes…" aria-label="search nodes">' +
      '<div class="cy-stats">' + all.nodes.length + ' nodes · ' + all.edges.length + ' links</div>' +
      '<div class="cy-hint">click a node for details · ⌘-click opens it</div>';

    bar.querySelectorAll(".cy-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const t = chip.dataset.type;
        const nowOn = hiddenTypes.has(t);
        if (nowOn) hiddenTypes.delete(t); else hiddenTypes.add(t);
        chip.classList.toggle("off", !nowOn);
        chip.setAttribute("aria-pressed", String(nowOn));
        rerender(all);
      });
    });

    const search = bar.querySelector("#cy-search");
    function applySearch() {
      const q = search.value.trim().toLowerCase();
      if (!q) { restoreEmphasis(); return; }
      cy.batch(function () {
        cy.elements().addClass("dim").removeClass("hi");
        const match = cy.nodes().filter(function (n) {
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
        const m = cy.nodes(".hi");
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
      buildToolbar(all);
      render(all);
      buildChrome(all);
    }).catch(function (err) {
      console.error("graph: load failed", err);
      mount.innerHTML = '<p style="padding:1rem">Graph couldn\'t load. ' +
        '<a href="' + (baseurl || "") + '/overview/">Browse as a list →</a></p>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }

  // expose for harness/console
  window.__graph = {
    nodeUrl, esc, clip, glowPad, labelFloor, neighborIds, buildElements, selfCheck,
    render, init, TYPE_COLORS, DEFAULT_HIDDEN_TYPES,
    select: function (id, center) { return select(window.__graphAll, id, center); },
    deselect,
    get cy(){return cy;},
  };
})();
