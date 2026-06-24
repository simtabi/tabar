# Tabar

A dependency-free, framework-agnostic progress bar for the web. One small ES module —
no build step required, safe to run many bars at once, accessible by default, themeable
entirely with CSS variables, and able to **persist and restore its state across page
reloads**.

```js
import { Tabar } from '@simtabi/tabar';

const bar = new Tabar();   // a fixed bar at the top of the page
bar.start();                // show + auto-trickle
// ...later, when your work finishes
bar.done();                 // glide to 100%, then hide
```

- **Zero runtime dependencies** — pure DOM, under 5 KB min+gzip.
- **Concurrent by design** — unlimited independent instances, no id/class collisions,
  one shared stylesheet.
- **Style it anywhere** — every visual is a CSS custom property; works with Tailwind,
  Bootstrap, or no framework at all.
- **Web *and* CLI** — the same API renders in the browser (DOM/SVG) and in the **terminal**
  (ANSI via `@simtabi/tabar/node` + a `tabar` CLI), all from one headless core.
- **Shapes & themes** — linear bars (top/bottom/left/right + centered variants, inline) with a
  configurable `length`, *and* circular SVG rings (track color, line cap, start angle,
  direction); preset themes (`gradient`, `rainbow`, `stripes`, `glow`, `minimal`), multi-color
  fills (blended, hard **bands**, or animated), a glow that bleeds onto its surroundings,
  stripes and tooltips. `height` takes px or any CSS length (`rem`/`em`/`%`).
- **One task, many progresses** — multi-segment bars (stacked chunks or overlay layers) and a
  `TabarGroup` of child bars with an auto-aggregated overall.
- **Transfers & feedback** — drive from uploads/downloads (`setProgress`, `trackXHR`,
  `trackResponse`) with smoothed **speed & ETA**; error/warning/success states, `retry()`,
  stall detection and screen-reader announcements; bind reactively to any value source.
- **Stateful** — optionally save progress to `localStorage`/`sessionStorage` and restore
  on load; resume named long-running tasks.
- **Controllable** — events, an instance registry, a global bus and DOM `tabar:*` events
  let any tool or service drive and observe a bar both ways. Built-in debug logging, an
  `error()` state, and **localizable** strings (`Tabar.locale` / `addLocale`).
- **Integrable** — configure from a JSON object/string, load config from an API
  (`configUrl`), report progress back (`reportUrl`), drive it declaratively via the
  `<tabar-bar>` Web Component or `data-tabar-*` attributes on a mount element, and use the
  `useTabar` React hook.
- **Accessible & responsive** — real `role="progressbar"` with live `aria-valuenow`, honors
  `prefers-reduced-motion`, RTL-aware, and stays visible on small/touch screens.
- **Secure** — no `innerHTML`, no string-built CSS, no inline handlers; stored state is
  validated and clamped.

## Install

```bash
npm install @simtabi/tabar
```

Or drop in the ready-to-use script from a CDN — exposes a global `Tabar`, no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/@simtabi/tabar/dist/tabar.min.js"></script>
<script>
  const bar = new Tabar({ color: '#e91e63' });
  bar.start();
</script>
```

There's also a drop-in Web Component build (`<tabar-bar>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@simtabi/tabar/dist/tabar-element.min.js"></script>
<tabar-bar value="0.4" color="#e91e63" theme="gradient"></tabar-bar>
```

In the terminal (Node):

```js
import { terminalBar } from '@simtabi/tabar/node';
const bar = terminalBar({ label: 'Downloading' });
bar.trackResponse(await fetch(url)); // live ANSI bar with speed + ETA
```

```bash
printf '30 100\n80 100\n100 100\n' | npx tabar --total 100 --label Build
```

See [docs/installation.md](docs/installation.md) for ESM, CJS, CDN (pinning + SRI) and CSP setups.

## Quick start

```js
import { Tabar } from '@simtabi/tabar';

// A top page bar you start and finish around async work:
const page = new Tabar({ color: '#29d', height: 4 });
page.start();
await fetchData();
page.done();

// An inline, themed, persisted bar mounted into your own container:
const upload = new Tabar({
  position: 'inline',
  mountTo: '#upload-progress',
  color: '#1abc9c',
  radius: 6,
  persist: { storage: 'session', debounce: 0 },
});
upload.set(0.4);   // 40% — accepts a 0–1 fraction or a 0–100 value
```

## Styling

Theme any instance by setting CSS custom properties — no `!important`, no overrides:

```css
[data-id-tabar="upload"] {
  --tabar-color: #e91e63;
  --tabar-height: 6px;
  --tabar-radius: 9999px;
}
[data-state-tabar="indeterminate"] .tabar__bar { opacity: .8; }
```

Full list in [docs/configuration.md](docs/configuration.md) and
[docs/tools/theming.md](docs/tools/theming.md).

## State across reloads

```js
// Auto-restore the last value on next load:
new Tabar({ persist: true });

// Resume a named long-running task:
const bar = new Tabar({ persist: { mode: 'task', key: 'upload' }, onResume: (s) => {
  resumeUploadFrom(s.value);   // continue where the user left off
}});
bar.task('upload').save(0.6, { fileId: 42 });
```

Details in [docs/tools/persistence.md](docs/tools/persistence.md).

## Events & two-way control

Drive and observe a bar from anywhere — events fire on the instance, on a global bus, and as
DOM `tabar:*` CustomEvents; the registry makes every bar reachable by id.

```js
const bar = new Tabar({ id: 'upload' });
bar.on('change', (v) => render(v)).once('done', () => toast('Done'));

// one service observing every bar:
Tabar.on('change', (value, bar) => bridge.send({ id: bar.id, value }));

// drive a bar from another module / a message handler:
Tabar.get('upload')?.set(0.5);

// or listen on the DOM, without importing Tabar:
document.addEventListener('tabar:done', (e) => console.log(e.detail.bar.id));
```

More in [docs/tools/events.md](docs/tools/events.md).

## API at a glance

| Method | Description |
|--------|-------------|
| `start()` | Show, seed to `minimum`, begin trickling. |
| `goto(n, opts)` / `set(n)` | Animate to a value (0–1 fraction or 0–`max`). Returns a `Promise`. |
| `inc(amount?)` | Increment (NProgress-style diminishing steps by default). |
| `indeterminate(on?)` | Toggle the indeterminate stripe. |
| `pause()` / `resume()` | Pause and resume the auto-trickle loop. |
| `setProgress(loaded, total)` | Drive from a byte transfer; tracks speed/ETA (`bar.stats`). |
| `trackXHR(xhr)` / `trackResponse(res)` | Track an upload/download automatically. |
| `bind(getter, opts)` | Bind to a value source (event/interval); returns an unbind fn. |
| `done(force?)` | Animate to 100%, then auto-hide/reset. Returns a `Promise`. |
| `reset()` / `error(info?)` | Reset to 0, or flip to the red error state (emits `error`). |
| `show()` / `hide()` | Toggle visibility (`bar.visible`). |
| `destroy()` | Remove DOM, timers and listeners; release the shared stylesheet. |
| `setColor/​setColor2/​setBackground/​setHeight/​setSpeed/​setRadius/​setInnerRadius/​setLabel/​setTooltip` | Chainable live setters (`setHeight` accepts px or any CSS length). |
| `setLength/​setOffset/​setTrackColor/​setLineCap/​setStartAngle/​setClockwise` | Fixed-bar length/inset and circular ring geometry. |
| `setSize/​setShape/​setPosition/​setDirection/​setMax/​setMinimum/​setSegmentMode/​setZIndex` | Resize/restructure live (`setShape` rebuilds, preserving state). |
| getters: `bar.color/​height/​size/​theme/​position/​shape/​colors/​…` | Read any option back (read-only; one per option). |
| `setTheme/​setGradient/​setGradientStops/​setColorAt/​setGradientAngle/​setGradientType/​setGradientShape/​setGradientPosition/​setFill` | Edit look, gradient colors/stops/angle/type/shape/center, or any CSS fill. |
| `setColors/​addColorStop/​removeColorStop/​setColorMode/​setColorAnimate` | Multi-color stops, `gradient` vs hard `bands`, and the scrolling animation. |
| `setGlow(on, color?)/​setGlowColor/​setGlowSize/​setStriped` | Glow (with bleed size) & stripe modifiers that compose with any theme. |
| `configure(opts)` | Merge options (object or JSON string) and re-apply theme. |
| `toJSON()` / `loadConfig(url)` / `report(url)` | Serialize config, fetch config from an API, POST state back. |
| `on(name, fn)` / `once(name, fn)` / `off(name?, fn?)` | Subscribe to events (chainable). |
| `setDebug(on?)` | Toggle verbose logging for this instance. |
| `task(name)` | `{ save, load, clear }` for persisted named tasks. |
| `Tabar.get(id)` / `Tabar.instances` / `Tabar.events` | Registry & event-name lookup. |
| `Tabar.on/once/off(name, fn)` | Global bus across all instances. `Tabar.debug = true` for all. |
| `Tabar.fromJSON(input)` / `Tabar.fromURL(url)` | Build from a JSON config or an API endpoint. |

<a id="documentation"></a>
## Documentation

| Page | What's inside |
|------|---------------|
| [Installation](docs/installation.md) | ESM, UMD, CDN, CSP, framework setup. |
| [Configuration](docs/configuration.md) | Every option + CSS-variable reference. |
| [Architecture](docs/architecture.md) | How instances, styling and persistence work. |
| [Release](docs/release.md) | Versioning and publishing. |
| [Theming](docs/tools/theming.md) | Themes, gradients, positions, circular rings, recipes. |
| [Uploads, downloads, ETA & reactivity](docs/tools/progress.md) | Transfers, speed/ETA, `bind`. |
| [Multi-progress, CLI & feedback](docs/tools/multi-and-cli.md) | Segments, groups, terminal/CLI, error states, i18n/RTL. |
| [Events & control](docs/tools/events.md) | Listeners, global bus, DOM events, two-way control, debug. |
| [Integration](docs/tools/integration.md) | JSON config, AJAX/API load & report, Web Component, React hook. |
| [Persistence](docs/tools/persistence.md) | Value-restore and task-resume modes. |
| [Concurrency](docs/tools/concurrency.md) | Running many bars safely. |

## Demo

Run `npm run demo` to build and serve the site — an Apple-style **landing page** plus an
interactive **playground** (`/playground.html`). The playground opens with a live
**configurator** that drives one bar across the whole option surface and shows the matching
`new Tabar({…})` code, followed by focused demos of shapes, positions, themes, transfers,
segments, groups, states and events. The [`examples/`](examples/) folder has copy-pasteable
no-framework, Tailwind, Bootstrap, multi-progress and Node CLI setups.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities per [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Simtabi LLC
