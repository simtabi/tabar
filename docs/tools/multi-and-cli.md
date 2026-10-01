# Multi-progress, terminal/CLI & error feedback

Tabar models a task with **many progresses**, renders in the **terminal** as well as the web,
and gives rich **feedback** (states, retry, stall, screen-reader announcements).

## Segments — one bar, many progresses

Drive a single bar with multiple segments. Two layouts:

```js
// Stacked — chunks tile the bar (multi-file upload, multi-stage pipeline):
const bar = new Tabar({ segmentMode: 'stacked' });
bar.setSegments([
  { id: 'fonts',  value: 1,    color: '#29d', weight: 1 },
  { id: 'images', value: 0.6,  color: '#2ecc71', weight: 3 },
  { id: 'video',  value: 0,    color: '#e67e22', weight: 6 },
]);
bar.updateSegment('video', { value: 0.2 });

// Overlay — layered values (e.g. a video player's buffered vs played):
const player = new Tabar({ segmentMode: 'overlay' });
player.setSegments([{ id: 'buffered', value: 0.8 }, { id: 'played', value: 0.35 }]);
```

The bar's `value` is the **aggregate** of its segments — `aggregate: 'weighted'` (default for
stacked), `'primary'` (default for overlay — the foremost layer), or `'sum'`/`'avg'`/`'max'`.
`addSegment`/`updateSegment`/`removeSegment` mutate live; `set()`/`goto()` returns to
single-value mode. `bar.segments` returns a copy.

## TabarGroup — a parent task with child bars

For *parallel* sub-tasks (each its own progress/status), use a group: it renders one overall
bar plus a child bar per task and aggregates automatically.

```js
import { TabarGroup } from '@simtabi/tabar/group';

const group = new TabarGroup({ mountTo: '#downloads' });
files.forEach((f) => {
  const bar = group.add({ label: f.name });
  download(f, (loaded, total) => bar.setProgress(loaded, total));
});
group.on('done', () => toast('All downloads finished'));
```

`group.overall`, `group.children`, `group.add/remove/child`, and bubbling `child:change` /
`child:done` events. The overall is weighted by each child's byte total when known.

## Terminal & CLI

The same API renders a live bar in Node — no DOM:

```js
import { terminalBar } from '@simtabi/tabar/node';

const bar = terminalBar({ label: 'Downloading' });
bar.trackResponse(await fetch(url));   // or setProgress(loaded, total)
```

TTY streams redraw in place with color and a spinner for indeterminate; non-TTY streams (CI,
pipes) print throttled lines. Options: `stream`, `width`, `label`, `colors`, `chars`,
`clearOnDone`.

A `tabar` **CLI** renders progress piped on stdin:

```bash
printf '30 100\n80 100\n100 100\n' | tabar --total 100 --label Build
some-job | awk '{ print $1, $2 }' | tabar --total 1000
tabar --demo
```

## Error feedback

```js
bar.error('Upload failed');     // red error state + 'error' event + aria announcement
bar.warn('Slow connection');    // amber warning
bar.succeed('Verified');        // green success

bar.retryWith(() => upload());  // register how to retry
bar.on('error', () => showRetryButton());
bar.retry();                    // clears the error, increments bar.attempts, re-runs the handler

new Tabar({ stallTimeout: 8000, errorTimeout: 4000 }); // flag stalls; auto-clear errors
```

`trackXHR`/`trackResponse` flip to the error state on failure automatically and accept
`{ retry }`. State changes are announced (localized) through a shared `aria-live` region
(disable with `announce: false`).

## Inline status messages

Show text **on** the bar that changes with the state — and anything else you want — via
`messages`. Each value is a string or `(percent, bar) => string`; a `default` key covers any
state without its own entry:

```js
const bar = new Tabar({
  height: 24,
  messageAlign: 'start',         // 'start' | 'center' | 'end'
  messages: {
    active:        (p, b) => `${Math.round(p)}% · ${Tabar.formatBytes(b.stats.speed)}/s`,
    indeterminate: 'Connecting…',
    warning:       'Slow connection',
    error:         'Upload failed — retry?',
    success:       'Verified ✓',
    done:          'Complete',
    default:       (p) => `${Math.round(p)}%`,
  },
});

bar.setMessage('error', 'Network error');  // set one state's message
bar.setMessages({ done: 'All set' });       // replace the whole map (null clears it)
bar.message;                                 // the message currently shown
```

The message overlays the bar (above the fill). Style it with `messageColor` (or the
`--tabar-message-color` / `--tabar-message-align` CSS variables); the text is rendered with
`textContent`, so user/locale strings are never interpreted as HTML.

## i18n & RTL

Ten locales ship built-in (EN, ES, FR, DE, PT, IT, JA, ZH, KO, AR). `Tabar.locale = 'ja'`
switches units/announcements globally; per-instance `locale` overrides. RTL locales (e.g.
Arabic) mirror the linear fill and the circular ring sweep. Add your own with
`Tabar.addLocale(code, dict)`.

---

[← Docs index](../../README.md#documentation)
