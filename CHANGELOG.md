# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/simtabi/tabar/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/simtabi/tabar/releases/tag/v0.5.0
