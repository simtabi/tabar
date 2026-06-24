# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Broader, consistent API.** New chainable setters — `setSize`, `setShape`
  (rebuilds linear↔circular, preserving state), `setPosition`, `setDirection`,
  `setMax`, `setMinimum`, `setSegmentMode`, `setZIndex` — plus read-only **getters
  for every option** (`bar.color`, `bar.height`, `bar.theme`, …). `TabarGroup` gains
  `setChildDefaults`/`setOverallDefaults`.
- **Design-system pass on the demo site**: a tokenized 4/8px spacing grid + type/
  radius scales, unified buttons/inputs, `:focus-visible` rings on every control,
  fixed dark-mode muted-text contrast, full `prefers-reduced-motion` coverage, an
  `aria-pressed` theme toggle and `aria-live` event log, plus a favicon and
  Open Graph/Twitter cards.
- **Types for every export** (`./terminal`, `./element` were missing), a coverage
  script (`npm run test:coverage`), a license banner on the minified bundles, and the
  demo JS is now linted.

### Fixed
- **Circular `setHeight`/`setSize` are now live.** The ring's radius/circumference are
  recomputed (and the arc repainted) when the stroke or diameter changes — previously
  a live `setHeight` left the fill mis-scaled.
- A bare-number `data-tabar-length` (e.g. `"240"`) is read as `240px` instead of the
  invalid CSS `240`.
- The React `useTabar` hook now re-renders on `start`/`resume`/`show`/`hide`/`stall`/
  `retry` too (previously only a subset of events).
- The `tabar` CLI no longer reads past the end of argv when a value flag is last.
- **Tooltips now show.** The wrapper opened `overflow` only for the glow, so the
  tooltip (rendered above the bar) was clipped — `[data-tooltip-tabar-on]` now opens
  overflow too, and `setTooltip()` attaches the tip to the wrapper for circular rings
  (it was wrongly appended to the SVG arc).
- **Glow actually bleeds** onto surrounding elements — a layered, `--tabar-glow-size`
  driven halo instead of a faint fixed shadow.
- **Segments advance past three chunks** — the playground's "Advance" now operates on
  the bar's live segments (0–100 scale) instead of three hardcoded ones. (The core
  segment API was already correct.)
- An invalid `mountTo` selector no longer throws from the constructor — it falls back
  to the default mount.
- Attribute consistency: `max` and `debug` are now settable via the `<tabar-bar>`
  element and `data-tabar-*`; dropped a dead `min` coercion key.
- The demo "bottom border" is gone — playground bars now **fill their track** so no
  grey strip shows below a shorter bar; the configurator section and its action
  buttons were redesigned into grouped clusters with a cleaner layout.
- **`TabarGroup` children no longer auto-hide/reset.** A completed child kept its
  reserved row but hid its bar — leaving a growing stack of empty white rows — and
  the auto-reset dropped the aggregate. Children now default to `autoHide: false`,
  so they persist at their final value (opt back in per-child with `autoHide: true`).

### Added
- **`*-center` positions + configurable `length`** — `top-center`/`bottom-center`/
  `left-center`/`right-center` dock a bar centered along an edge; `length` (default
  `100%`; number → px) sizes it and `offset` insets it. New `--tabar-length`/
  `--tabar-offset` vars and `setLength`/`setOffset`.
- **Multiple-color modes** — a `colors` multi-stop alias plus `colorMode: 'gradient' |
  'bands'` (hard, non-interpolated color blocks) and `colorAnimate` (scrolling), with
  `setColors`/`addColorStop`/`removeColorStop`/`setColorMode`/`setColorAnimate`.
- **Flexible `height`** — a linear bar's `height` now accepts any CSS length
  (`'0.5rem'`, `'100%'`, `'2vh'`, `calc(...)`), so it can scale with type or fill its
  host; number values stay px. Circular `height` remains the ring stroke thickness.

### Changed
- The default `height` is now **6px** (was 3px) for a more visible bar out of the box.
- **More circular options** — `trackColor`, `lineCap`, `startAngle`, `clockwise`
  (`--tabar-track-color`/`--tabar-start-angle`/`--tabar-flip`) and a configurable
  `glowSize`.
- **Data-attribute configuration** — the `<tabar-bar>` Web Component now covers the
  full option surface, and plain `new Tabar({ mountTo })` reads `data-tabar-*` off the
  mount element as a fallback (explicit JS options win). Coercion is shared via
  `src/attrs.js` so the two paths can't drift.
- **Playground**: a live multi-color stop editor, color-mode/animate/glow-size/circular
  controls, all eight positions with a length picker; demo stages no longer clip glow
  or tooltips. Site assets are grouped under `assets/{css,js,img}`.
- **Tests**: unit coverage for the above plus Playwright tiles for glow-bleed, tooltip,
  bands, animated multicolor and circular variants, and a fixed-position fixture for
  the centered positions.

### Removed
- **The leading-edge "peg" shine is gone.** The `showPeg` option, the `__peg`
  element (`data-peg-tabar`), the `--tabar-peg` variable and the related SCSS were
  removed — bars now end in a clean, crisp edge. The `minimal` theme (whose only
  job was hiding the peg) remains a recognized value, rendering identically to
  `default`.

### Added
- **Full live configurator in the playground** — a schema-driven panel that drives
  one preview bar across the entire option surface (geometry, color, gradients,
  themes, labels/messages, behavior, segments, i18n, persistence) and generates the
  matching `new Tabar({…})` snippet. The demo sections gained the missing controls
  (gradient types, segment add/remove, fixed-position overlays, state-color
  variables, `localStorage`/`sessionStorage` choice, `trackResponse` demo) and every
  button is now exercised by tests.
- **Playwright browser tests** — a deterministic visual-regression gallery
  (`site/visual.html`) plus a functional click-through of every playground control,
  run on both light and dark schemes (`npm run test:e2e`). A CI job runs them in the
  official Playwright Linux container against committed baselines.

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
- **Inline status messages** — `messages` maps each state (and a `default`) to a string or
  `(percent, bar) => string` shown on the bar; `setMessages`/`setMessage`, a `message` getter,
  and `messageAlign`/`messageColor` (plus `--tabar-message-*` CSS vars).
- A redesigned marketing site — an Apple-style landing page plus an interactive playground —
  built from `site/` to `site/dist/` (`npm run demo`); new `cli.js` and `multi-progress.html`
  examples.

### Fixed
- The leading **peg** is redesigned as a soft, color-agnostic leading-edge shine (clipped to
  the fill) instead of a fixed-width colored box-shadow with a `rotate(2deg)` tilt — it no
  longer renders as a clashing, offset rectangle on tall or gradient bars (`--tabar-peg`).
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
- `toJSON()` (and config export/`fromJSON` round-trips) works in Node — it no longer references
  the browser-only `Element` global unguarded. `TabarGroup` emits `done` exactly once per
  completion (re-arming when a new child is added), and `bind({ interval })` is cleaned up with
  `clearInterval` on `destroy()`.

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
