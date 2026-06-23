# Persistence

Tabar can save its progress to the browser's Web Storage and restore it on the next page
load. Two modes are available — auto-restore a value, and resume a named task — and they can
be combined.

Enable persistence with the `persist` option:

```js
new Tabar({ persist: true });               // value mode, localStorage, defaults
new Tabar({ persist: { storage: 'session', mode: 'both', ttl: 3600000 } });
```

## Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `key` | `string` | the instance id | Storage key suffix. Sanitized to `[A-Za-z0-9_-]`. |
| `storage` | `'local' \| 'session'` | `'local'` | Which Web Storage to use. |
| `mode` | `'value' \| 'task' \| 'both'` | `'value'` | What to persist (see below). |
| `ttl` | `number` | `0` | Expire stored state after N ms. `0` = never. |
| `debounce` | `number` | `200` | Debounce (ms) for value writes. `0` writes synchronously. |
| `keepOnDone` | `boolean` | `false` | Keep the saved value after `done()` instead of clearing it. |

Passing `persist: true` is shorthand for value mode with the defaults.

## Value mode — restore the last position

The bar's current percentage is written (debounced) on every change and restored on the next
construction with the same `key`/`id`.

```js
const bar = new Tabar({ id: 'reading', persist: true });
// user scrolls; bar.set(...) is called repeatedly
// → reload the page; the bar comes back at its last value automatically
```

The saved value is cleared on `reset()` and on `done()` (unless `keepOnDone: true`).

## Task mode — resume a long-running job

For multi-step work (uploads, wizards, imports) you usually want to resume the *operation*,
not just repaint the bar. In task mode Tabar stores a named task's progress plus arbitrary
`meta`, and fires `resume` on construct if a saved task exists.

```js
const bar = new Tabar({
  persist: { mode: 'task', key: 'upload' },
  onResume: (state) => {
    // state = { value: 60, meta: { fileId: 42 } }
    resumeUploadFrom(state.meta.fileId, state.value);
  },
});

// during the upload:
const task = bar.task('upload');
task.save(0.6, { fileId: 42 });   // 60% + your own metadata

// when finished:
task.clear();
```

`bar.task(name)` returns `{ save(progress, meta?), load(), clear() }`. `load()` returns
`{ value, meta, ts }` or `null`.

## `both`

`mode: 'both'` auto-restores the value *and* emits `resume` for the named task — useful when
you want the bar to repaint immediately and also hand your code the metadata to continue.

## Safety

- All storage access is wrapped in `try/catch` with an availability probe, so private mode,
  disabled storage, quota errors and SSR degrade to a silent no-op.
- Reads validate the JSON, a schema-version field and the TTL, and clamp the value to a
  valid range. Tampered or stale entries are discarded — stored data is never trusted.

---

[← Docs index](../../README.md#documentation)
