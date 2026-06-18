// assets/js/graph.js — interactive knowledge-graph homepage
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
    const g = { nodes: [{id:"a",path:"a.md",type:"topic",title:"A"},{id:"b",path:"b.md",type:"concept",title:"B"},{id:"c"}],
                edges: [{from:"a",to:"b"},{from:"a",to:"b"},{from:"a",to:"z"}] };
    const el = buildElements(g, "/H-AI-");
    console.assert(el.nodes.length === 2, "buildElements drops node c (no path), got " + el.nodes.length);
    console.assert(el.edges.length === 1, "buildElements dedupes + drops dangling a->z, got " + el.edges.length);
    console.log("graph.js self-check OK");
  }

  let cy = null;
  let hiddenTypes = new Set(DEFAULT_HIDDEN_TYPES);

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
          "text-valign": "bottom", "text-halign": "center", "text-margin-y": 3,
          "text-outline-color": "#0b0f14", "text-outline-width": 2,
          "min-zoomed-font-size": 9,
          "border-width": 5, "border-opacity": 0.16,
          "width": function (ele) { return 9 + Math.min(ele.data("deg") || 0, 18); },
          "height": function (ele) { return 9 + Math.min(ele.data("deg") || 0, 18); } } },
      { selector: "edge", style: {
          "width": 0.5, "line-color": "#3a4658", "curve-style": "straight", "opacity": 0.32 } },
      ...typeSelectors,
      { selector: ".dim", style: { "opacity": 0.07, "text-opacity": 0 } },
      { selector: "node.hi", style: { "opacity": 1, "z-index": 10, "border-opacity": 0.55 } },
      { selector: "edge.hi", style: { "opacity": 0.9, "width": 1, "line-color": "#8ea0b8" } },
      { selector: 'node[status = "archived"]', style: { "opacity": 0.55 } },
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
      var oe = e.originalEvent;
      if (!oe) return;
      tip.style.left = (oe.clientX + 14) + "px";
      tip.style.top = (oe.clientY + 14) + "px";
    });
    cy.on("mouseout", "node", function () {
      tip.style.display = "none";
      cy.elements().removeClass("dim").removeClass("hi");
    });
    cy.on("tap", "node", function (e) {
      const u = e.target.data("url");
      if (u) window.location.assign(u);
    });

    return cy;
  }

  function rerender(all) {
    cy.json({ elements: visibleElements(all) });
    cy.layout({ name: "fcose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60 }).run();
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
      '<div class="cy-stats">' + all.nodes.length + ' nodes · ' + all.edges.length + ' links</div>';

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
  window.__graph = { nodeUrl, buildElements, selfCheck, render, init, TYPE_COLORS, DEFAULT_HIDDEN_TYPES, get cy(){return cy;} };
})();
