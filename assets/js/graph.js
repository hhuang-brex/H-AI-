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

    return cy;
  }

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
