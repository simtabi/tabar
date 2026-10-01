# Installation

Tabar ships as an ES module with zero runtime dependencies, plus a UMD/IIFE bundle for
plain `<script>` use.

## npm (ESM / bundlers)

```bash
npm install @simtabi/tabar
```

```js
import { Tabar } from '@simtabi/tabar';

const bar = new Tabar();
bar.start();
```

`createTabar(options)` is a factory equivalent to `new Tabar(options)`.

### Entry points

The package exposes several subpath exports, each with its own types:

| Import | What you get |
|--------|--------------|
| `@simtabi/tabar` | `Tabar`, `createTabar`, `Emitter` (browser DOM/SVG renderer). |
| `@simtabi/tabar/node` | `Tabar` + `terminalBar`, `renderTerminal`, `TabarGroup` for Node. |
| `@simtabi/tabar/terminal` | Just the terminal renderer (`terminalBar`, `renderTerminal`). |
| `@simtabi/tabar/group` | `TabarGroup` — a parent task with child bars. |
| `@simtabi/tabar/element` | Registers the `<tabar-bar>` Web Component. |
| `@simtabi/tabar/react` | The `useTabar` React hook (React is a peer dep). |
| `@simtabi/tabar/css` | The standalone stylesheet (for strict CSP — see below). |

## Node / terminal / CLI

The same API drives a live bar in the terminal — no DOM required:

```js
import { terminalBar } from '@simtabi/tabar/node';

const bar = terminalBar({ label: 'Downloading' });
bar.trackResponse(await fetch(url)); // or bar.setProgress(loaded, total)
```

The package also installs a `tabar` CLI that renders progress piped on stdin:

```bash
printf '30 100\n80 100\n100 100\n' | npx tabar --total 100 --label Build
some-job | awk '{ print $1, $2 }' | npx tabar --total 1000
npx tabar --demo
```

See [Multi-progress, CLI & feedback](tools/multi-and-cli.md) for the full terminal API.

## CDN / drop-in `<script>`

The minified IIFE build is a single, ready-to-use file that exposes a global `Tabar` — no
build step, no bundler:

```html
<!-- unpkg -->
<script src="https://unpkg.com/@simtabi/tabar/dist/tabar.min.js"></script>
<!-- or jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@simtabi/tabar/dist/tabar.min.js"></script>
<script>
  const bar = new Tabar({ color: '#e91e63' });
  bar.start();
</script>
```

Pin a version (and add Subresource Integrity) in production, e.g.
`https://cdn.jsdelivr.net/npm/@simtabi/tabar@0.6.0/dist/tabar.min.js`.

The `<tabar-bar>` Web Component has its own drop-in build:

```html
<script src="https://unpkg.com/@simtabi/tabar/dist/tabar-element.min.js"></script>
<tabar-bar value="0.4" color="#e91e63" theme="gradient"></tabar-bar>
```

For native ESM without a bundler:

```html
<script type="module">
  import { Tabar } from 'https://unpkg.com/@simtabi/tabar/dist/tabar.esm.js';
  new Tabar().start();
</script>
```

## TypeScript

Type declarations ship in the package (`types/*.d.ts`, one per entry point) and are wired
through the `exports` map — no `@types` package needed.

```ts
import { Tabar, type TabarOptions } from '@simtabi/tabar';
```

## Content Security Policy

By default Tabar injects a small `<style>` element at runtime, which requires
`style-src 'unsafe-inline'`. To run under a stricter policy, include the standalone
stylesheet and add only `style-src 'self'`:

```html
<link rel="stylesheet" href="https://unpkg.com/@simtabi/tabar/dist/tabar.css" />
```

Tabar adds no inline event handlers and never uses `eval`, so `script-src 'self'` is
sufficient.

## Server-side rendering

Constructing a bar outside the browser never touches the DOM, so it's safe in SSR. Its
value/state/stats machinery still runs headlessly — that's exactly how the terminal renderer
drives it. For **DOM** rendering, create and use bars on the client (e.g. in `useEffect`,
`onMount`, etc.); for **terminal** output in Node, use `@simtabi/tabar/node`.

---

[← Docs index](../README.md#documentation)
