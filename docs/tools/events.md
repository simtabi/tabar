# Events, control & debug

Tabar is built to be driven from anywhere — your app, another component, a browser
extension, or a remote service bridged through your own transport. Every state change is
observable four ways, and every instance is reachable through the registry.

## Events

| Event | Payload | Fires when |
|-------|---------|------------|
| `start` | current value | `start()` is called |
| `change` | value `[0,100]` | the value changes (`goto`/`set`/`inc`/trickle) |
| `done` | `100` | `done()` reaches 100% |
| `reset` | `0` | `reset()` runs |
| `resume` | `{ value, meta }` | a persisted task is found on construct |
| `show` / `hide` | `true` / `false` | visibility actually changes |
| `indeterminate` | `boolean` | indeterminate mode is toggled |
| `theme` | theme name | `setTheme()` runs |
| `progress` | `stats` object | `setProgress`/`trackXHR`/`trackResponse` updates |
| `error` | message/detail | `error()` runs (or a tracked transfer fails) |
| `warning` / `success` | message/detail | `warn()` / `succeed()` runs |
| `retry` | attempt number | `retry()` runs |
| `stall` | `stats` object | no progress for `stallTimeout` ms while active |
| `config` / `report` | config / posted body | `loadConfig` / `report` |
| `destroy` | the instance id | `destroy()` is called (before teardown) |

`Tabar.events` returns the full list.

> `succeed()` also completes the bar to **100%** (green) without hiding it; `error()`/`warn()`
> recolor at the current value. `set()`/`goto()`/`reset()` clear a transient error/warning/
> success/indeterminate state back to active/idle.

## Four ways to listen

### 1. Instance listeners (`on` / `once` / `off`) — chainable

```js
const bar = new Tabar();
bar
  .on('change', (value) => console.log('now at', value))
  .once('done', () => console.log('finished once'));

bar.off('change');        // remove all 'change' listeners
bar.off();                // remove everything
```

### 2. Option callbacks

```js
new Tabar({
  onChange: (value, bar) => sync(value),
  onDone: () => toast('Complete'),
  onResume: (state) => resumeFrom(state.value),
});
```

### 3. The global bus — listen across every instance

Ideal for a single service that wants to observe *all* bars on the page. Handlers receive
`(payload, bar)` and `Tabar.on` returns an unsubscribe function.

```js
const stop = Tabar.on('change', (value, bar) => {
  bridge.send({ id: bar.id, value }); // forward to any external tool/service
});
// later
stop();
```

### 4. DOM CustomEvents

Each event is also dispatched on the bar's wrapper element as `tabar:<name>` (bubbling), so
any code — even code that never imported Tabar — can listen on the DOM:

```js
document.addEventListener('tabar:change', (e) => {
  console.log(e.detail.bar.id, e.detail.value);
});
```

## Two-way control from any tool

Because instances live in a registry, anything holding an id can drive a bar:

```js
// elsewhere / another module / a message handler:
Tabar.get('upload')?.set(0.5);
Tabar.get('upload')?.indeterminate(true);
```

A minimal bridge that lets an external service both **drive** and **observe** a bar:

```js
// inbound: { id, method, args } messages control the bar
socket.on('message', ({ id, method, args }) => {
  const bar = Tabar.get(id);
  if (bar && typeof bar[method] === 'function') bar[method](...args);
});

// outbound: forward every change back to the service
Tabar.on('change', (value, bar) => socket.send({ id: bar.id, value }));
```

## Error state

`error(info)` flips the bar to a red error state and emits `error` — automatically wired into
`trackXHR`/`trackResponse` on failures:

```js
bar.on('error', (info) => toast(`Upload failed: ${info}`));
bar.error('network error'); // keeps the current value, turns red
```

## Localization (i18n)

**Ten locales ship built-in** — English (`en`), Spanish (`es`), French (`fr`), German (`de`),
Portuguese (`pt`), Italian (`it`), Japanese (`ja`), Chinese (`zh`), Korean (`ko`) and Arabic
(`ar`, right-to-left). They cover byte/duration units, the default `aria-label`, and the
screen-reader announcement strings (`complete`/`error`/`stalled`/`loading`). Switch globally
or per instance, and register your own:

```js
Tabar.locale = 'ja';                       // app-wide
new Tabar({ locale: 'fr' });               // one instance

Tabar.formatBytes(1536);                    // localized — e.g. "1.5 Ko" in French
Tabar.formatDuration(75, 'de');            // force a locale

// Add or override a locale:
Tabar.addLocale('sw', { bytes: ['B', 'KB', 'MB', 'GB', 'TB'], min: 'd', sec: 's', progress: 'Maendeleo' });
```

An RTL locale (like `ar`) mirrors the linear fill and the circular ring sweep automatically.
`Tabar.getLocale(code)` returns a locale's dictionary; assigning an unknown `Tabar.locale` is
ignored.

## Debug

Enable verbose `console.debug` logging — per instance or globally:

```js
new Tabar({ debug: true });   // one instance
bar.setDebug(true);            // toggle at runtime (chainable)
Tabar.debug = true;            // every instance, app-wide
```

Each log line is tagged `[tabar:<id>] <event> <payload>`, so you can trace the full
lifecycle of any bar.

---

[← Docs index](../../README.md#documentation)
