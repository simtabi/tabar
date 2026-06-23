# Theming

Tabar is styled entirely through CSS custom properties and `data-*` attributes, so it drops
into any CSS framework — or none — without fighting the cascade.

## The basics

Every visual is a variable on the wrapper. Override per instance by id:

```css
[data-id-tabar="checkout"] {
  --tabar-color: #16a34a;
  --tabar-height: 6px;
  --tabar-radius: 9999px;
  --tabar-inner-radius: 9999px;
}
```

Or set them live from JS (chainable):

```js
bar.setColor('#16a34a').setHeight(6).setRadius(9999).setInnerRadius(9999);
```

`height` defaults to **6px** and accepts a number (px) or any CSS length — use `'0.5rem'` to
scale with type, or `'100%'` to fill a sized inline container. See
[height units](../configuration.md#height-units).

## Preset themes

Pick a ready-made look with the `theme` option (or `setTheme(...)` at runtime):

```js
new Tabar({ theme: 'gradient' }); // color → color2 gradient
new Tabar({ theme: 'rainbow' });  // animated multicolor
new Tabar({ theme: 'stripes' });  // animated diagonal stripes
new Tabar({ theme: 'glow' });     // soft neon glow
new Tabar({ theme: 'minimal' });  // flat solid bar (same as default)
```

| Theme | Effect |
|-------|--------|
| `default` | Solid `color` fill. |
| `gradient` | `linear-gradient(color → color2)`, or your own `gradient`/`fill`. |
| `rainbow` | Animated multicolor sweep. |
| `stripes` | Diagonal stripe overlay (animated unless `stripeAnimate: false`). |
| `glow` | Soft glow around the bar. |
| `minimal` | Flat solid bar with no embellishments (currently identical to `default`). |

`glow` and `striped` are **modifiers** — independent booleans that compose with *any* theme
or gradient (not just the `glow`/`stripes` presets):

```js
const bar = new Tabar({ theme: 'rainbow' });
bar.setGlow(true, '#00e5ff');   // glow on top of rainbow, with its own color
bar.setStriped(true);           // stripes too
```

`glowColor` (or `setGlowColor`) sets the glow color independently of the bar color, so it
reads well over gradients and multicolor fills; omit it to follow the bar color.

## Gradients & multicolor bars

Pass two or more colors for a gradient (or fully multicolored) fill, then edit any part of it
live — colors, individual stops, positions, angle and gradient type:

```js
const bar = new Tabar({ gradient: ['#f12711', '#f5af19'] });        // two-stop
bar.setGradient(['#f00', '#ff0', '#0f0', '#0ff', '#00f'], 120);      // multicolor + angle
bar.setColorAt(0, '#e91e63');                                        // edit one stop's color
bar.setGradientAngle(45).setGradientType('conic');                   // angle + type

// Stops with explicit positions, and radial/conic types:
bar.setGradient([{ color: '#f00', at: 0 }, { color: '#00f', at: 80 }], { type: 'radial' });

// Radial/conic center and shape:
bar.setGradientType('radial').setGradientShape('ellipse').setGradientPosition('center');

// Any CSS background works too:
bar.setFill('repeating-linear-gradient(45deg,#222 0 6px,#333 6px 12px)');
```

The fill is applied as the `--tabar-fill` variable, so it works with any theme and never
touches the solid `--tabar-color` used by the label.

`gradientType` accepts **six** kinds: `linear` (default), `radial`, `conic`,
`repeating-linear`, `repeating-radial`, `repeating-conic`. For radial/conic, `gradientShape`
sets the shape/size (`circle`, `ellipse`, `circle 60px`) and `gradientPosition` sets the
center (`center`, `50% 50%`, `left top`).

The **`gradient` theme** is a two-color shortcut driven by `color` + `color2` — and it honors
the same `setGradientType`/`setGradientShape`/`setGradientPosition`/`setGradientAngle` controls:

```js
const bar = new Tabar({ theme: 'gradient', color: '#2299dd', color2: '#7c4dff' });
bar.setGradientType('radial');   // switch the two-color theme to a radial fill
```

Two details Tabar handles for you:

- **The gradient is anchored to the track**, not the fill box — its colors stay put as the bar
  grows instead of compressing/shifting (Tabar sets `--tabar-fill-scale` for this).
- **Circular rings render real gradients** — a `gradient` theme (or a `gradient` stops array)
  on a `shape: 'circular'` bar paints an SVG `<linearGradient>` along the ring stroke.

## Multiple colors

`colors` is a friendly multi-stop alias for `gradient` (and takes precedence over it). Pick
how the colors render with `colorMode`, and optionally animate them:

```js
new Tabar({ colors: ['#2299dd', '#7c4dff', '#30d158', '#ff9f0a'] });          // blended gradient
new Tabar({ colors: ['#2299dd', '#30d158', '#ff9f0a'], colorMode: 'bands' }); // hard color blocks
new Tabar({ colors: ['#2299dd', '#7c4dff'], colorAnimate: true });            // scrolling animation

const bar = new Tabar({ colors: ['#f00', '#00f'] });
bar.addColorStop('#0f0').setColorMode('bands').setColorAnimate(true);
```

- **`gradient`** mode blends the stops smoothly.
- **`bands`** mode paints each color as a solid, non-interpolated block (great for
  multi-stage / phase bars). Distinct from `segments`, which track independent values.
- **`colorAnimate`** scrolls the fill (like `theme: 'rainbow'`, but with your colors); it
  respects `prefers-reduced-motion`.

## Glow

`glow` adds a soft halo that **bleeds onto surrounding elements**. `glowColor` sets its color
(defaults to the bar color) and `glowSize` (px) controls how far it spreads:

```js
new Tabar({ glow: true, glowColor: '#00e5ff', glowSize: 16 });
```

Note: a glowing (or tooltip-bearing) bar needs its container **not** to clip overflow — give
the wrapper room (`overflow: visible`) so the halo/tooltip can show.

## Positions, orientation & length

```js
new Tabar({ position: 'top' });            // fixed top (default)
new Tabar({ position: 'bottom' });         // fixed bottom
new Tabar({ position: 'left' });           // fixed vertical bar, fills bottom → top
new Tabar({ position: 'right' });          // fixed vertical bar
new Tabar({ position: 'top-center', length: '60%' });  // centered along the edge, 60% wide
new Tabar({ position: 'left-center', length: 320 });   // centered vertically, 320px tall
new Tabar({ position: 'inline', mountTo: '#here' });   // inside your container
```

`left`/`right` (and their `-center` variants) switch the bar to a vertical orientation
(`data-orientation-tabar="vertical"`); `height` then sets the bar's **thickness**. The
`*-center` positions center the bar along its edge, and `length` (default `100%`; a number
is px, a string passes through) sets how far it runs — with `offset` insetting it from the
edge. Style by orientation when needed:

```css
[data-orientation-tabar="vertical"] .tabar__bar { /* vertical-only tweaks */ }
```

## Circular rings

Set `shape: 'circular'` for an SVG ring instead of a linear bar:

```js
new Tabar({ shape: 'circular', size: 96, height: 9, color: '#29d',
  showLabel: true, labelFormat: (p) => `${Math.round(p)}%` });
```

`size` is the diameter and `height` is the ring thickness. Rings are fully themeable —
solid `color`, `gradient` (rendered as an SVG gradient), `glow`, and a centered live label.
Ring-specific options:

- **`trackColor`** — the unfilled ring color (falls back to `background`, then a faint default).
- **`lineCap`** — `'round'` (default), `'butt'` or `'square'` arc ends.
- **`startAngle`** — where the arc begins, in degrees (`-90` = 12 o'clock).
- **`clockwise`** — sweep direction (`false` runs counter-clockwise; composes with RTL).

`position`/`direction` don't apply to rings.

## State-based styling

Use the `data-state-tabar` attribute instead of guessing classes:

```css
[data-state-tabar="active"] .tabar__bar { box-shadow: 0 0 8px var(--tabar-color); }
[data-state-tabar="indeterminate"] .tabar__bar { opacity: .85; }
[data-state-tabar="done"] .tabar__bar { background: #16a34a; }
```

## No framework

```css
[data-id-tabar="demo"] { --tabar-color: #6c5ce7; --tabar-height: 8px; }
```

See [`examples/no-framework.html`](../../examples/no-framework.html).

## Tailwind

Set the variables with arbitrary-value classes or an inline style; Tabar's own classes
never collide with Tailwind utilities:

```html
<div id="host" style="--tabar-color:#0ea5e9; --tabar-height:10px; --tabar-radius:9999px"></div>
```

See [`examples/tailwind.html`](../../examples/tailwind.html).

## Bootstrap

Reuse Bootstrap's theme tokens:

```html
<div id="host" style="--tabar-color: var(--bs-danger); --tabar-height: 8px"></div>
```

Tabar lives in its own `.tabar` / `data-*-tabar` namespace, so it coexists with
Bootstrap's `.progress`. See [`examples/bootstrap.html`](../../examples/bootstrap.html).

## Custom class prefix

If even the `tabar` prefix is a concern, rename it:

```js
new Tabar({ classPrefix: 'loadbar' }); // → .loadbar, .loadbar__bar, …
```

## Reduced motion & RTL

Transitions and the indeterminate animation are disabled under
`prefers-reduced-motion: reduce` automatically. For right-to-left layouts pass
`direction: 'rtl'` and the bar fills from the trailing edge.

---

[← Docs index](../../README.md#documentation)
