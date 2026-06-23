# Architecture

Tabar is a single class in `src/tabar.js` with no runtime dependencies. This page explains
the design decisions that make it concurrent, themeable and secure.

## One stylesheet, many instances

Each instance owns its own DOM subtree:

```html
<div class="tabar" data-tabar data-id-tabar="tabar-1" role="progressbar" …>
  <div class="tabar__bar" data-bar-tabar>
    <div class="tabar__peg" data-peg-tabar></div>
  </div>
</div>
```

A **single, static** base stylesheet (`#tabar-base`) is injected once and **ref-counted**:
each construction increments the count, each `destroy()` decrements it, and the stylesheet is
removed when the last bar goes away. The base CSS contains **no interpolation** — it's a
constant string — so there is no CSS-injection surface.

Per-instance theming is applied with `element.style.setProperty('--tabar-…', value)` (the
DOM API), never by building CSS strings. The browser validates each property and silently
drops invalid values, so user-supplied colors and sizes can't escape the property.

Because the stylesheet is shared and theming is per-element, instances never collide on a
shared id/class and the `<head>` does not grow as bars are created and destroyed.

## Registry

Live instances are tracked in a module-level `Map` keyed by id. `Tabar.get(id)` and
`Tabar.instances` read from it. Constructing with an id that already exists returns the
existing instance instead of creating a conflicting one.

## State machine

`data-state-tabar` reflects the lifecycle: `idle → active → done`, plus `indeterminate`.
Styling and queries hook onto these attributes rather than toggled class flags.

`goto()` returns a Promise that resolves on the bar's `transitionend` (filtered to the
`width`/`height` property) **with a fallback timer**, so it still resolves for zero-duration,
no-op, or `prefers-reduced-motion` changes where `transitionend` never fires.

## Events

A small `Emitter` class powers events. Each instance owns one; a module-level `globalBus` is
a second `Emitter` that every instance re-emits to. `_emit()` fans a single event out to: the
matching `on<Name>` option callback, instance listeners, the global bus (`Tabar.on`), and a
DOM `tabar:<name>` CustomEvent on the wrapper — each in its own `try/catch` so one bad handler
can't break the rest. This is what lets external tools both drive (via the registry) and
observe (via any of those channels) a bar. See [events](tools/events.md).

## Timers and teardown

Trickle ticks, auto-hide and the persistence debounce are all tracked. `destroy()` flushes
any pending save, clears every timer, removes all listeners, detaches the DOM, drops the
registry entry, and releases the shared stylesheet — no leaked intervals or nodes.

## Accessibility

The wrapper is a real `role="progressbar"` with `aria-valuemin/max` and a live
`aria-valuenow` (removed while indeterminate). Animations respect
`prefers-reduced-motion`, and `direction: 'rtl'` flips the fill.

## Persistence

Persistence is opt-in and guarded: storage access is wrapped in `try/catch` with
availability probes (private mode, SSR, quota). Reads validate JSON, a schema-version field
and a TTL, and clamp the value — stored data is always treated as untrusted. See
[persistence](tools/persistence.md).

## Styles (SCSS → CSS)

Styles live in `src/tabar.scss` (the single source). `scripts/build-css.js` compiles it with
Dart Sass into two outputs: `dist/tabar.css` (expanded, the optional standalone stylesheet)
and `src/styles.js` (a minified string `BASE_CSS` that the module injects once at runtime).
`src/styles.js` is generated — never edited by hand — and is produced by `npm run styles`
(also run automatically before `build` and `test`). Every value is a CSS custom property and
every state hook is a `data-*-tabar` attribute, so the stylesheet stays static (no
interpolation, no injection surface) while instances remain individually themeable. The
stylesheet is responsive: thin bars get a minimum thickness on coarse-pointer/small screens.

## Build

`scripts/build.js` uses esbuild to emit `dist/tabar.esm.js`, `dist/tabar.umd.cjs` and a
minified IIFE `dist/tabar.min.js` (which assigns the `Tabar` global). `npm run build` compiles
the SCSS first. The source module is shipped too, so the demo and examples can import it
directly without a build.

---

[← Docs index](../README.md#documentation)
