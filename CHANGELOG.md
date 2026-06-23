# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-06-23

A major capability release: Tabar now runs in the **terminal** as well as the web, models
**one task with many progresses**, and ships richer feedback and localization.

### Added
- **Terminal renderer + CLI** — the same Tabar API drives a live ANSI bar in Node via
  `terminalBar()`/`renderTerminal()` (TTY redraw, non-TTY lines for CI, spinner, color, width),
  and a `tabar` CLI bin that renders progress piped on stdin (`--total`, `--label`, `--demo`).
  New entries `@simtabi/tabar/node` and `@simtabi/tabar/terminal`.
- **Segments (one bar, many progresses)** — `segments` + `segmentMode` (`stacked` for chunked
  uploads/multi-stage, `overlay` for buffered-vs-played) with `setSegments`/`addSegment`/
  `updateSegment`/`removeSegment` and mode-aware aggregation (`weighted`/`sum`/`avg`/`max`/
  `primary`). `set()` returns to single-value mode.
- **TabarGroup** — a parent task holding many child bars with an auto-aggregated overall bar
  and bubbling `child:*` events (`@simtabi/tabar/group`). Ideal for parallel uploads/downloads.
- **Error UX** — `warn()`/`succeed()` states, `retry()`/`retryWith()` + `attempts`, a
  `stallTimeout` detector emitting `stall`, `errorTimeout` auto-clear, and a shared `aria-live`
  region announcing localized state changes. `trackXHR`/`trackResponse` accept `{ retry }`.
- **i18n + RTL** — ten built-in locales (EN, ES, FR, DE, PT, IT, JA, ZH, KO, AR) with localized
  units/announcements; RTL-aware linear fill and circular ring sweep (e.g. Arabic).
- A `complete` getter and the `warning`/`success`/`retry`/`stall` events.
- A redesigned marketing site — an Apple-style landing page plus an interactive playground —
  built from `site/` to `site/dist/` (`npm run demo`); new `cli.js` and `multi-progress.html`
  examples.

### Fixed
- `goto()`/`set()`/`setProgress()`/`indeterminate()` no longer require a DOM element, so the
  value/state machinery (and stats/ETA) works fully headless in Node.
- **Gradients**: the `gradient` theme now honors `setGradientType`/`setGradientShape`/
  `setGradientPosition` (previously a no-op); circular `gradient` rings render a real SVG
  gradient stroke instead of solid; and gradient fills are anchored to the track so their
  colors no longer shift/compress as the bar grows.
- The shared `aria-live` region is now removed with the last bar (no orphaned DOM node);
  debounced persistence can't write after `destroy()`; auto-segment ids are monotonic (no
  collision after remove + add); a completed (100%) persisted bar restores as `done`.
- Terminal: a non-TTY (CI/pipe) bar no longer floods the log when active or indeterminate, and
  the spinner timer no longer keeps the Node process alive. CLI: a bare number with no
  `--total` is treated as a percentage instead of snapping to 100%.
- `<tabar-bar>`: an empty numeric attribute is treated as unset (no forced `0`), and `persist`
  accepts a JSON object. `useTabar` re-renders on error/warning/success and exposes `complete`.

## [0.5.0] - 2026-06-23

First public release.

### Added
- Vanilla-JS ES module with zero runtime dependencies; ESM, CommonJS and minified IIFE
  bundles, plus hand-written TypeScript declarations.
- A drop-in `<script>` build (`dist/tabar.min.js`, exposes `window.Tabar`) and CDN usage via
  unpkg/jsdelivr; bundled `<tabar-bar>` element and `useTabar` React builds.
- Multiple concurrent instances with a registry (`Tabar.get`, `Tabar.instances`); unique
  per-instance ids and a single ref-counted base stylesheet (no collisions, no leaks).
- Lifecycle API: `start`, `goto`/`set` (Promise-returning), `inc`, `indeterminate`, `done`,
  `reset`, `pause`/`resume`, `show`/`hide`, `destroy`, plus a `visible` getter and chainable
  setters. Values accept a `0–1` fraction or an absolute value on a configurable `max` scale,
  clamped; an optional per-call `{ duration }` controls a single transition. `autoShow` reveals
  a bar as soon as its value goes above 0.
- Shapes: linear bars in `top`/`bottom`/`left`/`right`/`inline` positions (horizontal &
  vertical) **and** circular SVG rings (`shape: 'circular'`, `size`) — all fully configurable
  and themeable.
- Upload/download tracking: `setProgress(loaded, total)`, `trackXHR`, `trackResponse`, a live
  `stats` getter (loaded/total/percent/speed/ETA/elapsed) with EMA-smoothed speed & ETA, a
  `progress` event, and `Tabar.formatBytes`/`Tabar.formatDuration` helpers.
- Reactivity: `bind(getter, opts)` to drive a bar from any event/interval source, and a
  reactive `useTabar` React hook exposing live `value`/`state`/`stats`.
- An `error()` state (red, emits `error`) wired into transfer failures, and localization
  (`Tabar.locale`, `Tabar.addLocale`, per-instance `locale`) for byte/duration units and the
  default `aria-label`.
- Preset themes (`gradient`, `rainbow`, `stripes`, `glow`, `minimal`); editable gradient &
  multicolor fills — colors, stops/positions, angle, six kinds (linear/radial/conic and their
  `repeating-*` variants), plus radial/conic `shape` and `position`. Glow and stripes are
  composable modifiers that apply over any theme, with an independent `glowColor`.
- Labels: static `label`, live `labelFormat`, and configurable tooltips (`tooltip` /
  `setTooltip`, hover or always-on).
- JSON configuration (object or string), `toJSON()` / `Tabar.fromJSON()`; load config from an
  API (`configUrl`, `Tabar.fromURL`, `loadConfig`) and report state back (`reportUrl`,
  `report`) — for full two-way integration with any service.
- Events (`start`, `change`, `done`, `reset`, `resume`, `show`, `hide`, `indeterminate`,
  `theme`, `destroy`, `config`, `report`) via `on`/`once`/`off`, option callbacks, a global
  bus (`Tabar.on`) and DOM `tabar:*` CustomEvents. Built-in debug logging (`debug`,
  `setDebug()`, `Tabar.debug`) and a `Tabar.version` constant.
- State persistence: auto-restore last value and resume named long-running tasks via
  `localStorage`/`sessionStorage`, with TTL, debounce and schema-version validation.
- Theming via CSS custom properties and identifying `data-*-tabar` attributes; styles authored
  in SCSS, compiled to CSS, responsive on small/touch screens; a `prefers-color-scheme` aware
  default palette and a visible default track for inline bars. Optional standalone stylesheet
  for strict CSP.
- Accessibility: `role="progressbar"` with live `aria-valuenow`, `prefers-reduced-motion`
  support, and RTL awareness.

### Security
- No `innerHTML`, inline event handlers, or string-built CSS; identifiers are sanitized,
  labels/tooltips use `textContent`, and persisted state is validated and clamped before use.

[Unreleased]: https://github.com/simtabi/tabar/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/simtabi/tabar/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/simtabi/tabar/releases/tag/v0.5.0
