# Configuration

Pass an options object to `new Tabar(options)`. Every option is optional.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto | Unique instance id. Sanitized to `[A-Za-z0-9_-]`. Reusing an id returns the existing instance. |
| `classPrefix` | `string` | `'tabar'` | Class/attribute namespace. Sanitized. |
| `mountTo` | `string \| Element` | `document.body` | Where to mount (selector or element). |
| `shape` | `'linear' \| 'circular'` | `'linear'` | Linear bar or circular SVG ring. |
| `size` | `number` | `64` | Circular ring diameter in px (ignored for linear). |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline'` + `'top-center' \| 'bottom-center' \| 'left-center' \| 'right-center'` | `'top'` | Fixed edge dock (horizontal/vertical), centered along the edge with the `-center` variants, or inline in a container. |
| `length` | `number \| string` | `'100%'` | Length of a fixed bar along its edge (number → px, string passthrough). |
| `offset` | `number` | `0` | Inset (px) of a fixed bar from its docked edge. |
| `direction` | `'ltr' \| 'rtl'` | `'ltr'` | Fill direction (horizontal bars). |
| `trackColor` | `string` | `null` | Circular track ring color (defaults to a faint neutral). |
| `lineCap` | `'round' \| 'butt' \| 'square'` | `'round'` | Circular arc stroke cap. |
| `startAngle` | `number` | `-90` | Circular arc start angle in degrees (-90 = 12 o'clock). |
| `clockwise` | `boolean` | `true` | Circular sweep direction (false = counter-clockwise). |
| `color` | `string` | `'#29d'` | Bar fill (any CSS color). |
| `color2` | `string` | `'#7c4dff'` | Secondary color for the `gradient` theme. |
| `background` | `string` | `'transparent'` | Track background. |
| `height` | `number \| string` | `6` | Bar thickness — px when a number; any CSS length string (`'0.5rem'`, `'100%'`, `'2vh'`, `calc(...)`) is honored for linear bars. Circular: ring stroke thickness (px). See [units](#height-units). |
| `radius` | `number \| [tl,tr,bl,br] \| {topLeft,…}` | `0` | Outer (track) corner radius. |
| `innerRadius` | same as `radius` | `0` | Inner (bar) corner radius. |
| `speed` | `number` | `300` | Transition duration in ms. |
| `zIndex` | `number` | `1031` | z-index for fixed bars. |
| `theme` | `'default' \| 'gradient' \| 'rainbow' \| 'stripes' \| 'glow' \| 'minimal'` | `'default'` | Preset look — see [theming](tools/theming.md). |
| `colors` | `Array<string \| {color, at}>` | `null` | Multi-color stops (alias of `gradient`, takes precedence). |
| `colorMode` | `'gradient' \| 'bands'` | `'gradient'` | Blended gradient, or hard non-interpolated color bands. |
| `colorAnimate` | `boolean` | `false` | Animate the multicolor fill (scrolling). |
| `gradient` | `Array<string \| {color, at}>` | `null` | Color stops → a multicolor gradient fill. Strings or `{color, at}` (position %). |
| `gradientType` | `linear \| radial \| conic \| repeating-linear \| repeating-radial \| repeating-conic` | `'linear'` | Gradient kind. |
| `gradientAngle` | `number` | `null` | Angle in degrees (linear/conic); auto by orientation when unset. |
| `gradientShape` | `string` | `null` | Radial shape/size, e.g. `circle` / `ellipse` / `circle 60px`. |
| `gradientPosition` | `string` | `null` | Radial/conic center, e.g. `center` / `50% 50%` / `left top`. |
| `fill` | `string` | `null` | Explicit CSS background for the bar (wins over `gradient`). |
| `glow` | `boolean` | `false` | Soft glow around the bar (composes with any theme). |
| `glowColor` | `string` | `null` | Glow color; defaults to the bar color when unset. |
| `glowSize` | `number` | `8` | Glow radius in px — how far the halo bleeds onto surroundings. |
| `striped` | `boolean` | `false` | Diagonal stripe overlay. |
| `stripeAnimate` | `boolean` | `true` | Animate the stripes when `striped`. |
| `value` | `number` | `null` | Initial value to show on construct (fraction or absolute). |
| `max` | `number` | `100` | Value scale; `set(max)` = 100%. |
| `minimum` | `number` | `0.08` | Floor fraction applied by `start()`. |
| `trickle` | `boolean` | `true` | Auto-increment while pending. |
| `trickleSpeed` | `number` | `200` | Ms between trickle ticks. |
| `showLabel` | `boolean` | `false` | Render a text label. |
| `label` | `string` | `''` | Static label text (rendered as plain text). |
| `labelFormat` | `(percent, bar) => string` | `null` | Live label, recomputed on every change (e.g. `(p) => \`${Math.round(p)}%\``). |
| `autoShow` | `boolean` | `true` | Show the bar automatically when its value goes above 0. |
| `tooltip` | `boolean \| string \| (percent, bar) => string` | `false` | Tooltip at the leading edge — `true` for live %, a string, or a formatter. |
| `tooltipAlways` | `boolean` | `false` | Keep the tooltip visible instead of showing on hover/focus. |
| `autoHide` | `boolean` | `true` | Hide + reset after `done()`. |
| `autoHideDelay` | `number` | `350` | Ms to linger at 100% before hiding. |
| `segments` | `Array<{id?,value,color?,label?,weight?,status?}>` | `null` | Multi-progress on one bar — see [multi-progress](tools/multi-and-cli.md). |
| `segmentMode` | `'stacked' \| 'overlay'` | `'stacked'` | Chunks tile the bar, or layered values (buffered/played). |
| `aggregate` | `'weighted' \| 'sum' \| 'avg' \| 'max' \| 'primary'` | by mode | How segments roll up into the bar's value. |
| `messages` | `Record<state, string \| (pct, bar) => string>` | `null` | Inline status text on the bar, keyed by state; a `default` key covers the rest. |
| `messageAlign` | `'start' \| 'center' \| 'end'` | `'center'` | Inline message alignment. |
| `messageColor` | `string` | `null` | Inline message color (defaults to white + a legibility shadow). |
| `announce` | `boolean` | `true` | Announce state changes to screen readers (shared `aria-live` region). |
| `stallTimeout` | `number` | `0` | Ms with no progress while active → `stall` event + warning. `0` = off. |
| `errorTimeout` | `number` | `0` | Ms after which an error auto-clears. `0` = off. |
| `locale` | `string` | `null` | Override the global `Tabar.locale` for this instance — see [i18n](tools/events.md#localization-i18n). |
| `ariaLabel` | `string` | `null` | Accessible name; defaults to the locale's "progress" string. |
| `ariaLabelledBy` | `string` | `null` | Id of a labelling element (wins over `ariaLabel`). |
| `persist` | `boolean \| object` | `false` | State persistence — see [persistence](tools/persistence.md). |
| `configUrl` | `string` | `null` | GET a JSON config from this URL on construct — see [integration](tools/integration.md). |
| `reportUrl` | `string` | `null` | POST `{ id, value, state }` to this URL. |
| `reportOn` | `string[]` | `['change','done']` | Events that trigger an auto-report. |
| `fetchOptions` | `object` | `null` | Extra `fetch` options for config/report (headers, credentials…). |
| `debug` | `boolean` | `false` | Verbose `console.debug` logging (also `Tabar.debug` for all bars). |
| `onStart` `onChange` `onDone` `onReset` `onResume` `onShow` `onHide` `onIndeterminate` `onTheme` `onDestroy` `onConfig` `onReport` `onProgress` `onError` `onWarning` `onSuccess` `onStall` `onRetry` | `function` | `null` | Lifecycle callbacks — see [events](tools/events.md). |

> The retry **handler** (what `retry()` runs) is set with `retryWith(fn)` or the `{ retry }`
> option on `trackXHR`/`trackResponse`; `onRetry` is the *event* fired when `retry()` runs.

> **Defaults note:** inline bars (`position: 'inline'`) show a subtle, scheme-aware track by
> default so they're always visible on load. When you don't set `color`/`background`, the bar
> follows a `prefers-color-scheme` aware palette; set them explicitly to pin a fixed look.

## Value units

`goto`/`set`/`inc` accept either a **fraction** in `[0, 1]` (e.g. `0.5` → 50%) or an
**absolute value** on the `max` scale (e.g. `75` with default `max: 100` → 75%). Values are
clamped to the valid range; non-finite input is ignored.

## Height units

The default `height` is **6px**. A linear bar's `height` accepts **any CSS length** — a
number is taken as px, and a string passes through verbatim:

```js
new Tabar({ height: 6 });        // 6px (default)
new Tabar({ height: '0.5rem' }); // scales with the root font size
new Tabar({ height: '100%' });   // fills a sized host (e.g. an inline container)
new Tabar({ height: '2vh' });    // viewport-relative
```

Which to use?

- **`px` (default)** — most predictable for fixed UI chrome like a top loading bar; it
  won't change if the user bumps their font size. This is why the default is a number.
- **`rem`** — best when you *want* the bar to scale with the user's typography (good for
  accessibility/zoom). `em` scales with the local font size instead of the root.
- **`%` / `vh`** — use `'100%'` to fill a container you've sized (see the inline demos), or
  viewport units for a thickness relative to the screen.

All are supported for **linear** bars. **Circular** rings use `height` as the ring stroke
and need a numeric px value — a non-px string falls back to the `6px` default there.

## CSS variables

All visuals are driven by custom properties, set per instance on the wrapper. Override them
anywhere in your cascade:

| Variable | Backs |
|----------|-------|
| `--tabar-color` | Bar fill + label color |
| `--tabar-color2` | Secondary color for the `gradient` theme |
| `--tabar-fill` | Bar background (set by `gradient`/`fill` **and the `gradient` theme**; overrides `--tabar-color`) |
| `--tabar-angle` | Gradient angle |
| `--tabar-fill-scale` | Set by Tabar to the fill fraction; anchors a gradient to the track (don't set by hand) |
| `--tabar-bg` | Track background |
| `--tabar-height` | Bar thickness |
| `--tabar-length` | Length of a fixed bar along its edge |
| `--tabar-offset` | Inset of a fixed bar from its docked edge |
| `--tabar-radius` | Outer corner radius |
| `--tabar-inner-radius` | Inner corner radius |
| `--tabar-speed` | Transition duration |
| `--tabar-z` | z-index of fixed bars |
| `--tabar-track-color` | Circular track ring color (falls back to `--tabar-bg`) |
| `--tabar-start-angle` | Circular arc start angle |
| `--tabar-error` / `--tabar-warning` / `--tabar-success` | State colors (error/warning/success) |
| `--tabar-seg-color` | Per-segment fill color (set on each segment) |
| `--tabar-glow` | Glow color (independent of the bar color) |
| `--tabar-glow-size` | Glow radius (how far the halo bleeds) |
| `--tabar-message-color` / `--tabar-message-align` | Inline message color and alignment |

```css
[data-id-tabar="my-bar"] {
  --tabar-color: #e91e63;
  --tabar-height: 6px;
  --tabar-radius: 9999px;
}
```

## Data attributes (styling & query hooks)

Every data attribute carries the identifying `-tabar` suffix so it can never collide with a
generic `data-state` / `data-id` / `data-position` attribute used elsewhere on your page.
The bare `data-tabar` marker anchors the namespace.

| Attribute | Values |
|-----------|--------|
| `data-tabar` | present on every wrapper (namespace marker) |
| `data-id-tabar` | the instance id |
| `data-state-tabar` | `idle` \| `active` \| `done` \| `indeterminate` \| `error` \| `warning` \| `success` |
| `data-position-tabar` | `top` \| `bottom` \| `left` \| `right` \| `inline` |
| `data-orientation-tabar` | `horizontal` \| `vertical` |
| `data-theme-tabar` | the active preset (absent when `default`) |
| `data-glow-tabar` / `data-striped-tabar` / `data-stripe-anim-tabar` / `data-multicolor-anim-tabar` | `true` when enabled |
| `data-tooltip-tabar-on` | `hover` \| `always` when a tooltip is enabled |
| `data-rtl-tabar` | `true` when right-to-left (`direction: 'rtl'` or an RTL locale) |
| `data-segmented-tabar` | `stacked` \| `overlay` when in segment mode |
| `data-seg-tabar` / `data-seg-id-tabar` / `data-seg-status-tabar` | per-segment hooks |
| `data-message-tabar` | the inline status-message overlay |
| `data-shape-tabar` | `linear` \| `circular` |
| `data-bar-tabar` / `data-label-tabar` / `data-tooltip-tabar` | the inner parts |

```css
[data-state-tabar="indeterminate"] .tabar__bar { opacity: .8; }
```

## Declarative configuration (attributes)

Every option above can be set declaratively, not just in JS. Two paths share one
coercion layer (`src/attrs.js`), so they never drift. Booleans, numbers, strings,
comma-separated lists (`gradient`/`colors`) and JSON (`segments`/`messages`/`persist`)
are all accepted; function options (`labelFormat`, function `tooltip`/`messages`) are
JS-only.

**Web Component** — bare kebab-case attributes on `<tabar-bar>`:

```html
<script type="module" src="https://unpkg.com/@simtabi/tabar/dist/tabar-element.js"></script>
<tabar-bar value="0.6" theme="gradient" tooltip length="60%" line-cap="butt"></tabar-bar>
```

**Plain mount** — `data-tabar-*` attributes on the element you mount into are read as
a fallback. An explicit JS option always wins; absent ones fall back to the
attribute, then the default:

```html
<div id="bar" data-tabar-color="#e91e63" data-tabar-length="50%" data-tabar-tooltip></div>
<script type="module">
  import { Tabar } from '@simtabi/tabar';
  new Tabar({ position: 'inline', mountTo: '#bar' }); // picks up the data-tabar-* config
</script>
```

---

[← Docs index](../README.md#documentation)
