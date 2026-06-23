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
`https://cdn.jsdelivr.net/npm/@simtabi/tabar@0.5.0/dist/tabar.min.js`.

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

Type declarations ship in the package (`types/tabar.d.ts`) and are wired through the
`exports` map — no `@types` package needed.

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

Constructing a bar in a non-browser environment is a safe no-op — it stores options without
touching the DOM. Create and use bars on the client (e.g. in `useEffect`, `onMount`, etc.).

---

[← Docs index](../README.md#documentation)
