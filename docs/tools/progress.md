# Uploads, downloads, ETA & reactivity

Tabar can be driven directly from a byte transfer and compute a smoothed speed and ETA, or
bound to any reactive value source.

## From a byte transfer

`setProgress(loaded, total)` sets the value and records a sample for speed/ETA:

```js
const bar = new Tabar({ showLabel: true, labelFormat: (p, b) =>
  `${Math.round(p)}% · ${Tabar.formatBytes(b.stats.speed)}/s · ${Tabar.formatDuration(b.stats.eta)} left`,
});

bar.setProgress(loadedBytes, totalBytes);   // call repeatedly as bytes arrive
```

`bar.stats` returns live figures:

| Field | Meaning |
|-------|---------|
| `loaded` / `total` | bytes |
| `percent` | 0–100 |
| `speed` | bytes/second, **EMA-smoothed** so it doesn't jitter |
| `eta` | seconds remaining, `0` at completion, or `null` when unknown |
| `elapsed` | seconds since tracking started |

A `progress` event fires on each `setProgress` with the stats object.

## XMLHttpRequest (upload or download)

`trackXHR` wires `start`/`progress`/`done`/`reset` for you:

```js
const xhr = new XMLHttpRequest();
xhr.open('POST', '/upload');
bar.trackXHR(xhr, { direction: 'upload' });   // or 'download'
xhr.send(formData);
```

## fetch download

`trackResponse` streams a download through the bar and returns a Response you consume as
usual (it reads `Content-Length` for the total):

```js
const res = bar.trackResponse(await fetch('/big-file.zip'));
const blob = await res.blob();   // bar fills as the body streams in
```

If the length is unknown, the bar shows the indeterminate animation instead.

## Reactivity

`bind` follows an external value source and returns an unbind function (also auto-cleaned on
`destroy()`):

```js
// Follow an <input type="range">:
bar.bind(() => slider.value / 100, { event: 'input', target: slider });

// Or poll a getter:
bar.bind(() => store.progress, { interval: 250 });
```

In React, the `useTabar` hook is reactive out of the box — `value`, `state` and `stats`
update on every change:

```jsx
const { ref, value, stats } = useTabar({ showLabel: true });
// re-renders as the bar progresses; read stats.eta, stats.speed, …
```

---

[← Docs index](../../README.md#documentation)
