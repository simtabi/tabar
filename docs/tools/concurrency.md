# Concurrency

Tabar is built to run many bars at once. Each instance is fully isolated, so you can have a
top page bar, several inline bars and a scroll indicator on the same page without conflicts.

## Independent instances

```js
const page   = new Tabar({ position: 'top', color: '#29d' });
const upload  = new Tabar({ position: 'inline', mountTo: '#upload', color: '#1abc9c' });
const scroll = new Tabar({ position: 'bottom', color: '#e67e22', trickle: false });

page.start();
upload.set(0.4);
```

Each gets a unique auto-generated id, its own DOM subtree, and its own CSS variables. There
is still only **one** shared base stylesheet (`#tabar-base`) for the whole page, ref-counted
so it disappears when the last bar is destroyed.

Even two bars created with no options at all stay independent: each receives its own
auto-generated id and they share the single base stylesheet rather than appending their own.

## Looking up instances

```js
Tabar.get('upload');     // the instance with that id, or undefined
Tabar.instances;         // array of all live instances
```

Constructing with an id that already exists returns the existing instance instead of
creating a conflicting one:

```js
const a = new Tabar({ id: 'main' });
const b = new Tabar({ id: 'main' });
a === b; // true
```

## Giving each bar its own key

Set an explicit `id` (and persistence `key`) when you want stable, addressable bars — for
example one per row in a list of concurrent downloads:

```js
downloads.forEach((d) => {
  const bar = new Tabar({
    id: `dl-${d.id}`,
    position: 'inline',
    mountTo: `#row-${d.id} .progress`,
    persist: { key: `dl-${d.id}`, mode: 'task' },
  });
  bar.task(`dl-${d.id}`).save(d.progress);
});
```

## Cleaning up

Always `destroy()` a bar you no longer need (e.g. when a component unmounts). It clears all
timers and listeners, removes the DOM, drops the registry entry, and releases its hold on the
shared stylesheet.

```js
bar.destroy();
```

---

[← Docs index](../../README.md#documentation)
