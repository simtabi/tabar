# Integration — JSON, AJAX/API & frameworks

Tabar can be configured from a JSON object or string, fetched from an API, report its state
back to an endpoint, and drop into Web Components or React.

## JSON configuration

The constructor and `configure()` accept either an options object or a JSON **string**:

```js
new Tabar('{ "color": "#e91e63", "theme": "gradient", "height": 6 }');
bar.configure('{ "striped": true }');

const bar = Tabar.fromJSON(jsonStringOrObject);   // explicit factory
const snapshot = bar.toJSON();                     // serialize config + state (no callbacks)
```

`toJSON()` returns a plain, JSON-safe object (current options plus `value` and `state`), so
you can persist, transmit, or round-trip a bar's configuration.

## Load config from an API

```js
// Fetch a JSON config and build a bar from it:
const bar = await Tabar.fromURL('/api/progress-bar.json');

// Or load/refresh config into an existing bar (applies options + an optional `value`):
await bar.loadConfig('/api/progress-bar.json');

// Or declaratively — fetched once on construct:
new Tabar({ configUrl: '/api/progress-bar.json' });
```

A `config` event fires when a config resolves (payload is the applied config, or `null` on
failure). `fetch` errors are swallowed and logged under `debug`.

## Report state back to an endpoint

```js
// Manual POST of { id, value, state, ts }:
await bar.report('/api/progress');

// Or automatically, debounced, on chosen events:
new Tabar({ reportUrl: '/api/progress', reportOn: ['change', 'done'] });
```

A `report` event fires with the body each time. Combine `configUrl` + `reportUrl` for a bar
that pulls its setup from a service and streams progress back to it.

Pass `fetchOptions` (a `fetch` `RequestInit`) to add headers, credentials, etc.:

```js
new Tabar({ reportUrl: '/api/progress', fetchOptions: { headers: { Authorization: `Bearer ${t}` } } });
```

> All of the above no-op gracefully when `fetch` is unavailable (e.g. SSR).

## Web Component — `<tabar-bar>`

```html
<script type="module">import '@simtabi/tabar/element';</script>

<tabar-bar value="0.4" color="#e91e63" theme="gradient" height="8"></tabar-bar>
```

Attributes map to options (kebab-case → camelCase); `gradient` accepts a comma-separated list
(`gradient="#f00,#00f"`). The full instance is `el.bar`, and Tabar's `tabar:*` events bubble
out of the element. The bar is created on connect and destroyed on disconnect.

## React — `useTabar`

```jsx
import { useTabar } from '@simtabi/tabar/react';

function Loader() {
  const { ref, bar } = useTabar({ color: '#e91e63', height: 6, trickle: true });
  return (
    <>
      <div ref={ref} />
      <button onClick={() => bar()?.start()}>Start</button>
      <button onClick={() => bar()?.done()}>Done</button>
    </>
  );
}
```

`react` is an optional peer dependency — only pulled in when you import this entry point. The
hook mounts one inline bar into the `ref` element and destroys it on unmount; `bar()` returns
the live instance for the full imperative API.

---

[← Docs index](../../README.md#documentation)
