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
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline'` | `'top'` | Fixed top/bottom (horizontal), left/right (vertical), or inline in a container. |
| `direction` | `'ltr' \| 'rtl'` | `'ltr'` | Fill direction (horizontal bars). |
| `color` | `string` | `'#29d'` | Bar fill (any CSS color). |
| `color2` | `string` | `'#7c4dff'` | Secondary color for the `gradient` theme. |
| `background` | `string` | `'transparent'` | Track background. |
| `height` | `number` | `3` | Bar thickness in px (height for horizontal, width for vertical). |
| `radius` | `number \| [tl,tr,bl,br] \| {topLeft,…}` | `0` | Outer (track) corner radius. |
| `innerRadius` | same as `radius` | `0` | Inner (bar) corner radius. |
| `speed` | `number` | `300` | Transition duration in ms. |
| `zIndex` | `number` | `1031` | z-index for fixed bars. |
| `theme` | `'default' \| 'gradient' \| 'rainbow' \| 'stripes' \| 'glow' \| 'minimal'` | `'default'` | Preset look — see [theming](tools/theming.md). |
| `gradient` | `Array<string \| {color, at}>` | `null` | Color stops → a multicolor gradient fill. Strings or `{color, at}` (position %). |
| `gradientType` | `linear \| radial \| conic \| repeating-linear \| repeating-radial \| repeating-conic` | `'linear'` | Gradient kind. |
| `gradientAngle` | `number` | `null` | Angle in degrees (linear/conic); auto by orientation when unset. |
| `gradientShape` | `string` | `null` | Radial shape/size, e.g. `circle` / `ellipse` / `circle 60px`. |
| `gradientPosition` | `string` | `null` | Radial/conic center, e.g. `center` / `50% 50%` / `left top`. |
| `fill` | `string` | `null` | Explicit CSS background for the bar (wins over `gradient`). |
| `glow` | `boolean` | `false` | Soft glow around the bar (composes with any theme). |
| `glowColor` | `string` | `null` | Glow color; defaults to the bar color when unset. |
| `striped` | `boolean` | `false` | Diagonal stripe overlay. |
| `stripeAnimate` | `boolean` | `true` | Animate the stripes when `striped`. |
| `value` | `number` | `null` | Initial value to show on construct (fraction or absolute). |
| `max` | `number` | `100` | Value scale; `set(max)` = 100%. |
| `minimum` | `number` | `0.08` | Floor fraction applied by `start()`. |
| `trickle` | `boolean` | `true` | Auto-increment while pending. |
| `trickleSpeed` | `number` | `200` | Ms between trickle ticks. |
| `showPeg` | `boolean` | `true` | Leading glow at the bar's edge. |
| `showLabel` | `boolean` | `false` | Render a text label. |
| `label` | `string` | `''` | Static label text (rendered as plain text). |
| `labelFormat` | `(percent, bar) => string` | `null` | Live label, recomputed on every change (e.g. `(p) => \`${Math.round(p)}%\``). |
| `autoShow` | `boolean` | `true` | Show the bar automatically when its value goes above 0. |
| `tooltip` | `boolean \| string \| (percent, bar) => string` | `false` | Tooltip at the leading edge — `true` for live %, a string, or a formatter. |
| `tooltipAlways` | `boolean` | `false` | Keep the tooltip visible instead of showing on hover/focus. |
| `autoHide` | `boolean` | `true` | Hide + reset after `done()`. |
| `autoHideDelay` | `number` | `350` | Ms to linger at 100% before hiding. |
| `locale` | `string` | `null` | Override the global `Tabar.locale` for this instance — see [i18n](tools/events.md#localization-i18n). |
| `ariaLabel` | `string` | `null` | Accessible name; defaults to the locale's "progress" string. |
| `ariaLabelledBy` | `string` | `null` | Id of a labelling element (wins over `ariaLabel`). |
| `persist` | `boolean \| object` | `false` | State persistence — see [persistence](tools/persistence.md). |
| `configUrl` | `string` | `null` | GET a JSON config from this URL on construct — see [integration](tools/integration.md). |
| `reportUrl` | `string` | `null` | POST `{ id, value, state }` to this URL. |
| `reportOn` | `string[]` | `['change','done']` | Events that trigger an auto-report. |
| `fetchOptions` | `object` | `null` | Extra `fetch` options for config/report (headers, credentials…). |
| `debug` | `boolean` | `false` | Verbose `console.debug` logging (also `Tabar.debug` for all bars). |
| `onStart` `onChange` `onDone` `onReset` `onResume` `onShow` `onHide` `onIndeterminate` `onTheme` `onDestroy` `onConfig` `onReport` `onProgress` `onError` | `function` | `null` | Lifecycle callbacks — see [events](tools/events.md). |

> **Defaults note:** inline bars (`position: 'inline'`) show a subtle, scheme-aware track by
> default so they're always visible on load. When you don't set `color`/`background`, the bar
> follows a `prefers-color-scheme` aware palette; set them explicitly to pin a fixed look.

## Value units

`goto`/`set`/`inc` accept either a **fraction** in `[0, 1]` (e.g. `0.5` → 50%) or an
**absolute value** on the `max` scale (e.g. `75` with default `max: 100` → 75%). Values are
clamped to the valid range; non-finite input is ignored.

## CSS variables

All visuals are driven by custom properties, set per instance on the wrapper. Override them
anywhere in your cascade:

| Variable | Backs |
|----------|-------|
| `--tabar-color` | Bar fill + peg glow + label color |
| `--tabar-color2` | Secondary color for the `gradient` theme |
| `--tabar-fill` | Bar background (set by `gradient`/`fill`; overrides `--tabar-color`) |
| `--tabar-angle` | Gradient angle |
| `--tabar-bg` | Track background |
| `--tabar-height` | Bar thickness |
| `--tabar-radius` | Outer corner radius |
| `--tabar-inner-radius` | Inner corner radius |
| `--tabar-speed` | Transition duration |
| `--tabar-z` | z-index of fixed bars |

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
| `data-state-tabar` | `idle` \| `active` \| `done` \| `indeterminate` |
| `data-position-tabar` | `top` \| `bottom` \| `left` \| `right` \| `inline` |
| `data-orientation-tabar` | `horizontal` \| `vertical` |
| `data-theme-tabar` | the active preset (absent when `default`) |
| `data-glow-tabar` / `data-striped-tabar` / `data-stripe-anim-tabar` | `true` when enabled |
| `data-rtl-tabar` | `true` when `direction: 'rtl'` |
| `data-bar-tabar` / `data-peg-tabar` / `data-label-tabar` | the inner parts |

```css
[data-state-tabar="indeterminate"] .tabar__bar { opacity: .8; }
```

---

[← Docs index](../README.md#documentation)
