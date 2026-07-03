---
title: Dark mode design
---

# Dark Mode for the H-AI- Site — Design

**Date:** 2026-07-02
**Status:** approved design, pre-implementation

## Goal

Let visitors view the H-AI- knowledge-graph site (just-the-docs, `remote_theme`) in a dark palette. Default to the visitor's OS preference; provide a persisted manual toggle to override. Keep one visual identity with the already-dark graph homepage viewport.

## Non-goals

- Reworking the light `hai` scheme (unchanged).
- Turning the graph viewport light in light mode — the dark "observatory" viewport is the brand and stays dark in both modes.
- Any change to node content, `build-graph.py`, or graph data.

## Current state (explored 2026-07-02)

- `_config.yml`: `remote_theme: just-the-docs/just-the-docs`, `color_scheme: hai`.
- `_sass/color_schemes/hai.scss`: light-only custom scheme (ink text `#1f2937`, headings `#0f172a`, teal link `#0f766e`, slate borders `#e2e8f0`, code bg `#f1f5f9`).
- `assets/css/graph.css`: graph viewport is already dark via `:root` vars (`--cy-ink-0 #0b0f14`, `--cy-ink-1 #131b24`, `--cy-text #e2e8f0`, `--cy-accent #5eead4`). Graph-page **prose** (`.graph-intro`, `.graph-intro b`, `.gi-num`) is hard-coded light-friendly (slate on white).
- No `_includes/` directory yet. Only `_layouts/graph.html`.

## Approach

just-the-docs-native dual color scheme + a small JS layer for OS-detection, persistence, and a toggle. No framework fighting.

### Component 1 — `_sass/color_schemes/hai-dark.scss` (new)

Dark scheme built on the theme's `dark` base, then overridden with the graph's observatory palette for a single identity:

```scss
@import "./color_schemes/dark";

$body-background-color: #0b0f14;   // --cy-ink-0
$sidebar-color: #0e141b;           // slightly lifted from body
$search-background-color: #131b24; // --cy-ink-1
$table-background-color: #0e141b;

$body-text-color: #e2e8f0;         // --cy-text
$body-heading-color: #f1f5f9;
$nav-child-link-color: #cbd5e1;
$search-result-preview-color: #94a3b8;

$link-color: #5eead4;              // --cy-accent (teal)
$btn-primary-color: #5eead4;
$base-button-color: #1e2935;

$border-color: #1e2935;            // graph frame border
$code-background-color: #131b24;   // --cy-ink-1

$body-link-color: #5eead4;
```

(Exact variable set to be reconciled against the current just-the-docs `dark` scheme during implementation — override only what the observatory identity needs; let the rest fall back.)

### Component 2 — runtime scheme availability

Two passthrough stylesheets so both schemes are compiled and switchable at runtime:

- `assets/css/just-the-docs-hai.scss` → `{% include css/just-the-docs.scss.liquid color_scheme="hai" %}`
- `assets/css/just-the-docs-hai-dark.scss` → `{% include css/just-the-docs.scss.liquid color_scheme="hai-dark" %}`

(Both files carry the empty `---`/`---` front-matter so Jekyll processes them.)

### Component 3 — `_includes/head_custom.html` (new): no-flash boot

Inline, render-blocking script inserted before `</head>`. Runs before first paint:

1. Resolve target theme: `localStorage["hai-theme"]` if set, else `matchMedia("(prefers-color-scheme: dark)").matches ? "hai-dark" : "hai"`.
2. If target is dark, swap the active just-the-docs scheme `<link>`'s `href` to the dark stylesheet immediately (direct DOM, not `jtd.setTheme`, which isn't defined this early). The exact link selector/id is confirmed during implementation by inspecting the rendered `<head>`.

This avoids the flash-of-light because the swap happens before body render.

### Component 4 — `_includes/header_custom.html` (new): the toggle

A small button (☾ / ☀, `aria-label`, `aria-pressed`) in the header. On click:

1. Compute next theme from current state.
2. `jtd.setTheme(next)` (defined by the time the user can click).
3. Persist to `localStorage["hai-theme"]`, update the icon + `aria`.

Plus a `matchMedia` `change` listener: if the visitor has **not** set an explicit choice (`localStorage` empty), follow OS changes live.

### Component 5 — `assets/css/graph.css` (edit): theme-aware graph prose

The graph viewport stays dark in both modes. Make only the surrounding prose theme-aware so it's legible on a dark page — drive `.graph-intro`, `.graph-intro b`, `.gi-num` off CSS custom properties that resolve per scheme (e.g. a `[data-theme]` / scheme-scoped rule, or `prefers-color-scheme` fallback consistent with the JS state). Keep light-mode appearance identical to today.

## Data flow

```
page load
  → head_custom boot script: localStorage ?? prefers-color-scheme → set scheme link (pre-paint)
  → user clicks toggle → jtd.setTheme(next) + localStorage persist + icon/aria update
  → OS scheme changes + no explicit choice → matchMedia listener re-applies
```

State lives in one place: `localStorage["hai-theme"]` (values `"hai"` | `"hai-dark"`; absent = follow OS).

## Testing / verification

- **Build:** local Jekyll build succeeds with both schemes compiled (`assets/css/just-the-docs-hai*.css` produced).
- **Browser (Chrome DevTools MCP, loaded this session):** on a doc/node page and on the graph homepage, in both modes — check text/border/link contrast is legible, the toggle flips and persists across reload, and there is **no theme-flash** on reload when dark is active.
- **Regression:** light mode is pixel-consistent with today; graph viewport unchanged in both modes.

## Risks

- **`jtd.setTheme` link mechanism under `remote_theme`:** the exact `<link>` the boot script must swap is confirmed by inspecting the rendered head during implementation (documented API is `jtd.setTheme("<scheme>")`; `getTheme` is undocumented, so state is tracked in `localStorage`, not read back from the theme).
- **Flash-of-wrong-theme:** mitigated by the render-blocking pre-paint swap in `head_custom.html`; verified in-browser.
- **just-the-docs `dark` variable drift:** override only what's needed and let the rest inherit, so a theme update doesn't silently break the palette.
