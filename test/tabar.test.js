import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Tabar, createTabar } from '../src/tabar.js';

const BASE_STYLE = '#tabar-base';

function destroyAll() {
  for (const bar of Tabar.instances) bar.destroy();
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(destroyAll);

describe('circular shape', () => {
  it('renders an SVG ring and maps value to stroke-dashoffset', async () => {
    const bar = new Tabar({ shape: 'circular', size: 80, height: 8, trickle: false });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-shape-tabar')).toBe('circular');
    expect(el.querySelectorAll('circle')).toHaveLength(2);
    const arc = el.querySelector('[data-bar-tabar]');
    const circumference = 2 * Math.PI * ((80 - 8) / 2);
    expect(Number(arc.style.strokeDasharray)).toBeCloseTo(circumference, 1);
    await bar.set(0.25, { animate: false });
    expect(Number(arc.style.strokeDashoffset)).toBeCloseTo(circumference * 0.75, 1);
  });

  it('does not get a fixed position attribute', () => {
    const bar = new Tabar({ shape: 'circular' });
    expect(bar._wrapper.hasAttribute('data-position-tabar')).toBe(false);
  });

  it('builds an SVG gradient for circular gradient fills', () => {
    const bar = new Tabar({ shape: 'circular', gradient: ['#f00', '#00f'] });
    expect(bar._wrapper.querySelector('defs linearGradient')).toBeTruthy();
    expect(bar._bar.style.stroke).toContain('url(#tabar-grad-');
  });
});

describe('transfer, ETA & stats', () => {
  it('tracks loaded/total/percent/speed/eta via setProgress', async () => {
    const bar = new Tabar({ trickle: false });
    bar.setProgress(0, 1000);
    await new Promise((r) => setTimeout(r, 40));
    let progressed = false;
    bar.on('progress', () => { progressed = true; });
    bar.setProgress(500, 1000);
    const s = bar.stats;
    expect(s.loaded).toBe(500);
    expect(s.total).toBe(1000);
    expect(s.percent).toBe(50);
    expect(s.speed).toBeGreaterThan(0);
    expect(s.eta).toBeGreaterThan(0);
    expect(progressed).toBe(true);
    bar.setProgress(1000, 1000);
    expect(bar.stats.eta).toBe(0);
  });

  it('formats bytes and durations', () => {
    expect(Tabar.formatBytes(1536)).toBe('1.5 KB');
    expect(Tabar.formatBytes(512)).toBe('512 B');
    expect(Tabar.formatDuration(75)).toBe('1m 15s');
    expect(Tabar.formatDuration(3)).toBe('3s');
  });

  it('trackXHR drives the bar from progress events', () => {
    const handlers = {};
    const add = (store) => (e, h) => { (store[e] = store[e] || []).push(h); };
    const up = {};
    const xhr = { addEventListener: add(handlers), upload: { addEventListener: add(up) } };
    const bar = new Tabar({ trickle: false });
    bar.trackXHR(xhr, { direction: 'upload' });
    up.progress.forEach((h) => h({ lengthComputable: true, loaded: 200, total: 800 }));
    expect(bar.value).toBe(25);
  });
});

describe('error state', () => {
  it('enters the error state and emits error', () => {
    let info = null;
    const bar = new Tabar({ trickle: false });
    bar.on('error', (i) => { info = i; });
    bar.set(0.5, { animate: false });
    bar.error('upload failed');
    expect(bar.state).toBe('error');
    expect(bar._wrapper.getAttribute('data-state-tabar')).toBe('error');
    expect(info).toBe('upload failed');
    expect(bar.value).toBe(50); // keeps the value, not reset
  });

  it('recovers when set() or reset() is called after an error', async () => {
    const bar = new Tabar({ trickle: false });
    bar.error();
    await bar.set(0.6, { animate: false });
    expect(bar.state).toBe('active'); // set clears the error state
    bar.error();
    bar.reset();
    expect(bar.state).toBe('idle'); // reset clears the error state
  });
});

describe('i18n', () => {
  afterEach(() => { Tabar.locale = 'en'; });

  it('localizes byte/duration units and the aria label', () => {
    Tabar.addLocale('xx', { bytes: ['o', 'Ko', 'Mo', 'Go', 'To'], min: 'min', sec: 's', hour: 'h', lessThan: '<1s', progress: 'Progression' });
    Tabar.locale = 'xx';
    expect(Tabar.formatBytes(1536)).toBe('1.5 Ko');
    expect(Tabar.formatDuration(90)).toBe('1min 30s');
    const bar = new Tabar();
    expect(bar._wrapper.getAttribute('aria-label')).toBe('Progression');
  });

  it('ignores an unknown locale and supports a per-instance locale', () => {
    Tabar.locale = 'nope';
    expect(Tabar.locale).toBe('en');
    Tabar.addLocale('yy', { progress: 'Carga' });
    const bar = new Tabar({ locale: 'yy' });
    expect(bar._wrapper.getAttribute('aria-label')).toBe('Carga');
  });
});

describe('reactivity', () => {
  it('bind() drives the bar and unbinds cleanly', async () => {
    let v = 0;
    const bar = new Tabar({ trickle: false });
    const off = bar.bind(() => v, { interval: 10 });
    v = 0.6;
    await new Promise((r) => setTimeout(r, 30));
    expect(bar.value).toBe(60);
    off();
    v = 0.9;
    await new Promise((r) => setTimeout(r, 30));
    expect(bar.value).toBe(60); // no further updates after unbind
  });
});

describe('construction & registry', () => {
  it('mounts DOM with a11y attributes and a single shared stylesheet', () => {
    const bar = new Tabar();
    const el = document.querySelector('[data-tabar]');
    expect(el).toBeTruthy();
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('data-state-tabar')).toBe('idle');
    expect(document.querySelectorAll(BASE_STYLE)).toHaveLength(1);
    expect(Tabar.get(bar.id)).toBe(bar);
  });

  it('renders a linear bar as a single fill with no leading-edge peg', () => {
    new Tabar({ position: 'inline' });
    const el = document.querySelector('[data-tabar]');
    expect(el.querySelector('[data-bar-tabar]')).toBeTruthy();
    // The "peg" leading shine was removed — it must never come back.
    expect(el.querySelector('[data-peg-tabar]')).toBeNull();
    expect(el.querySelectorAll('.tabar__peg')).toHaveLength(0);
  });

  it('runs many default-option instances without id/class collision', () => {
    const a = new Tabar();
    const b = new Tabar();
    const c = createTabar();
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect(document.querySelectorAll('[data-tabar]')).toHaveLength(3);
    // still exactly one shared stylesheet
    expect(document.querySelectorAll(BASE_STYLE)).toHaveLength(1);
  });

  it('reuses the existing instance when an id is taken', () => {
    const a = new Tabar({ id: 'dup' });
    const b = new Tabar({ id: 'dup' });
    expect(b).toBe(a);
    expect(document.querySelectorAll('[data-id-tabar="dup"]')).toHaveLength(1);
  });

  it('sanitizes ids and class prefixes to safe characters', () => {
    const bar = new Tabar({ id: 'a b<script>', classPrefix: 'pb!!x' });
    expect(bar.id).toBe('abscript'); // only [A-Za-z0-9_-] survive
    expect(bar.id).not.toMatch(/[<>\s]/);
    expect(document.querySelector('.pbx')).toBeTruthy();
  });
});

describe('value normalization & clamping', () => {
  it('treats [0,1] as a fraction and >1 as absolute on the scale', async () => {
    const bar = new Tabar();
    await bar.goto(0.5, { animate: false });
    expect(bar.value).toBe(50);
    await bar.goto(75, { animate: false });
    expect(bar.value).toBe(75);
  });

  it('clamps out-of-range and ignores non-finite input', async () => {
    const bar = new Tabar();
    await bar.goto(150, { animate: false });
    expect(bar.value).toBe(100);
    await bar.goto(-20, { animate: false });
    expect(bar.value).toBe(0);
    await bar.goto(Number.NaN, { animate: false });
    expect(bar.value).toBe(0);
  });

  it('honors a custom max scale', async () => {
    const bar = new Tabar({ max: 200 });
    await bar.goto(100, { animate: false });
    expect(bar.value).toBe(50);
  });

  it('updates aria-valuenow on change', async () => {
    const bar = new Tabar();
    await bar.goto(40, { animate: false });
    expect(document.querySelector('[data-tabar]').getAttribute('aria-valuenow')).toBe('40');
  });
});

describe('promise resolution', () => {
  it('resolves goto() immediately when not animating', async () => {
    const bar = new Tabar();
    await expect(bar.goto(50, { animate: false })).resolves.toBe(bar);
  });

  it('resolves goto() via the fallback timer for short durations', async () => {
    const bar = new Tabar();
    await expect(bar.goto(50, { duration: 1 })).resolves.toBe(bar);
  });
});

describe('state transitions', () => {
  it('moves idle -> active -> done', async () => {
    const bar = new Tabar({ trickle: false, autoHide: false });
    const el = () => document.querySelector('[data-tabar]').getAttribute('data-state-tabar');
    expect(el()).toBe('idle');
    bar.start();
    expect(el()).toBe('active');
    await bar.done();
    expect(el()).toBe('done');
  });

  it('drops aria-valuenow in indeterminate mode and restores it', () => {
    const bar = new Tabar();
    bar.indeterminate(true);
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-state-tabar')).toBe('indeterminate');
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    bar.indeterminate(false);
    expect(el.hasAttribute('aria-valuenow')).toBe(true);
  });
});

describe('events', () => {
  it('fires start/change/done callbacks and .on() listeners', async () => {
    const seen = [];
    const bar = new Tabar({
      trickle: false,
      autoHide: false,
      onStart: () => seen.push('start'),
      onDone: () => seen.push('done'),
    });
    bar.on('change', (v) => seen.push(`change:${v}`));
    bar.start();
    await bar.goto(50, { animate: false });
    await bar.done();
    expect(seen).toContain('start');
    expect(seen).toContain('change:50');
    expect(seen).toContain('done');
  });
});

describe('teardown', () => {
  it('removes DOM and the base stylesheet only with the last instance', () => {
    const a = new Tabar();
    const b = new Tabar();
    a.destroy();
    expect(document.querySelectorAll('[data-tabar]')).toHaveLength(1);
    expect(document.querySelectorAll(BASE_STYLE)).toHaveLength(1);
    b.destroy();
    expect(document.querySelectorAll('[data-tabar]')).toHaveLength(0);
    expect(document.querySelectorAll(BASE_STYLE)).toHaveLength(0);
    expect(Tabar.instances).toHaveLength(0);
  });

  it('is idempotent and clears the registry entry', () => {
    const bar = new Tabar({ id: 'gone' });
    bar.destroy();
    bar.destroy();
    expect(Tabar.get('gone')).toBeUndefined();
  });
});

describe('persistence — value mode', () => {
  it('saves and restores the last value across instances', async () => {
    const a = new Tabar({ id: 'persisted', persist: { debounce: 0 } });
    await a.goto(60, { animate: false });
    a.destroy();

    const b = new Tabar({ id: 'persisted', persist: { debounce: 0 } });
    expect(b.value).toBe(60);
    expect(b.state).toBe('active');
  });

  it('clears stored value on reset', async () => {
    const bar = new Tabar({ id: 'clearme', persist: { debounce: 0 } });
    await bar.goto(40, { animate: false });
    bar.reset();
    expect(localStorage.getItem('tabar:clearme')).toBeNull();
  });

  it('rejects malformed stored data', () => {
    localStorage.setItem('tabar:bad', '{ not json');
    const bar = new Tabar({ id: 'bad', persist: true });
    expect(bar.value).toBe(0);
  });

  it('rejects data with a mismatched schema version', () => {
    localStorage.setItem('tabar:stale', JSON.stringify({ v: 999, value: 80 }));
    const bar = new Tabar({ id: 'stale', persist: true });
    expect(bar.value).toBe(0);
  });

  it('expires data past its ttl', () => {
    localStorage.setItem(
      'tabar:old',
      JSON.stringify({ v: 1, value: 50, ts: Date.now() - 10000 }),
    );
    const bar = new Tabar({ id: 'old', persist: { ttl: 1000 } });
    expect(bar.value).toBe(0);
    expect(localStorage.getItem('tabar:old')).toBeNull();
  });

  it('clamps tampered out-of-range stored values', () => {
    localStorage.setItem('tabar:hi', JSON.stringify({ v: 1, value: 9999, ts: Date.now() }));
    const bar = new Tabar({ id: 'hi', persist: true });
    expect(bar.value).toBe(100);
  });
});

describe('persistence — task mode', () => {
  it('saves, loads and clears a named task', () => {
    const bar = new Tabar({ id: 'taskbar', persist: { mode: 'task' } });
    const task = bar.task('upload');
    task.save(0.3, { file: 'a.zip' });
    const loaded = task.load();
    expect(loaded.value).toBe(30);
    expect(loaded.meta).toEqual({ file: 'a.zip' });
    task.clear();
    expect(task.load()).toBeNull();
  });

  it('emits resume when a saved task exists on construct', () => {
    sessionStorage.setItem(
      'tabar:task:resume',
      JSON.stringify({ v: 1, value: 45, meta: { step: 2 }, ts: Date.now() }),
    );
    let resumed = null;
    const bar = new Tabar({
      persist: { mode: 'task', key: 'resume', storage: 'session' },
      onResume: (state) => {
        resumed = state;
      },
    });
    expect(bar).toBeTruthy();
    expect(resumed).toEqual({ value: 45, meta: { step: 2 } });
  });
});

describe('security', () => {
  it('renders a label as inert text, never as HTML', () => {
    const bar = new Tabar({ showLabel: true, label: '<img src=x onerror=alert(1)>' });
    const label = document.querySelector('[data-label-tabar]');
    expect(label.querySelector('img')).toBeNull();
    expect(label.textContent).toContain('<img');
    bar.setLabel('<b>bold</b>');
    expect(label.querySelector('b')).toBeNull();
  });
});

describe('theming', () => {
  it('applies theme via CSS custom properties', () => {
    const bar = new Tabar({ color: '#e11', height: 6 });
    const el = document.querySelector('[data-tabar]');
    expect(el.style.getPropertyValue('--tabar-color')).toBe('#e11');
    expect(el.style.getPropertyValue('--tabar-height')).toBe('6px');
    bar.setColor('#0a0').setHeight(10);
    expect(el.style.getPropertyValue('--tabar-color')).toBe('#0a0');
    expect(el.style.getPropertyValue('--tabar-height')).toBe('10px');
  });

  it('builds a border-radius shorthand from numbers, arrays and objects', () => {
    const bar = new Tabar();
    const el = document.querySelector('[data-tabar]');
    bar.setRadius(8);
    expect(el.style.getPropertyValue('--tabar-radius')).toBe('8px');
    bar.setRadius(1, 2, 3, 4);
    expect(el.style.getPropertyValue('--tabar-radius')).toBe('1px 2px 4px 3px');
    bar.setInnerRadius({ topLeft: 5, topRight: 6, bottomLeft: 7, bottomRight: 8 });
    expect(el.style.getPropertyValue('--tabar-inner-radius')).toBe('5px 6px 8px 7px');
  });
});

describe('orientation & positions', () => {
  it('marks left/right positions as vertical and fills via height', async () => {
    const bar = new Tabar({ position: 'left' });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-orientation-tabar')).toBe('vertical');
    expect(el.getAttribute('data-position-tabar')).toBe('left');
    await bar.goto(0.5, { animate: false });
    expect(bar._bar.style.height).toBe('50%');
    expect(bar._bar.style.width).toBe('');
  });

  it('keeps top/bottom/inline horizontal and fills via width', async () => {
    const bar = new Tabar({ position: 'bottom' });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-orientation-tabar')).toBe('horizontal');
    await bar.goto(0.5, { animate: false });
    expect(bar._bar.style.width).toBe('50%');
    expect(bar._bar.style.height).toBe('');
  });
});

describe('themes, gradient & multicolor', () => {
  it('reflects the preset theme on a data attribute', () => {
    const bar = new Tabar({ theme: 'rainbow' });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-theme-tabar')).toBe('rainbow');
    bar.setTheme('default');
    expect(el.hasAttribute('data-theme-tabar')).toBe(false);
  });

  it('builds a linear-gradient fill from a color array', () => {
    const bar = new Tabar({ gradient: ['#f00', '#0f0', '#00f'] });
    const el = document.querySelector('[data-tabar]');
    expect(el.style.getPropertyValue('--tabar-fill')).toBe(
      'linear-gradient(90deg, #f00, #0f0, #00f)',
    );
    bar.setGradient(null);
    expect(el.style.getPropertyValue('--tabar-fill')).toBe('');
  });

  it('uses a 0deg gradient for vertical bars and honors an explicit angle', () => {
    const v = new Tabar({ position: 'right', gradient: ['#000', '#fff'] });
    expect(document.querySelector('[data-position-tabar="right"]').style.getPropertyValue('--tabar-fill'))
      .toBe('linear-gradient(0deg, #000, #fff)');
    const bar = new Tabar({ gradient: ['#000', '#fff'], gradientAngle: 45 });
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe('linear-gradient(45deg, #000, #fff)');
    v.destroy();
  });

  it('an explicit fill wins over a gradient', () => {
    const bar = new Tabar({ gradient: ['#f00', '#00f'], fill: 'url(#x) red' });
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe('url(#x) red');
  });

  it('toggles glow and striped data attributes', () => {
    const bar = new Tabar({ glow: true, striped: true });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-glow-tabar')).toBe('true');
    expect(el.getAttribute('data-striped-tabar')).toBe('true');
    expect(el.getAttribute('data-stripe-anim-tabar')).toBe('true');
    bar.setGlow(false).setStriped(false);
    expect(el.hasAttribute('data-glow-tabar')).toBe(false);
    expect(el.hasAttribute('data-striped-tabar')).toBe(false);
  });

  it("the 'stripes' theme implies the stripe overlay", () => {
    new Tabar({ theme: 'stripes' });
    const el = document.querySelector('[data-tabar]');
    expect(el.getAttribute('data-striped-tabar')).toBe('true');
  });

  it('glow composes with any theme and supports an independent color', () => {
    const bar = new Tabar({ theme: 'rainbow' });
    const el = document.querySelector('[data-tabar]');
    bar.setGlow(true, '#0ff');
    // both the theme and the glow modifier are active at once
    expect(el.getAttribute('data-theme-tabar')).toBe('rainbow');
    expect(el.getAttribute('data-glow-tabar')).toBe('true');
    expect(el.style.getPropertyValue('--tabar-glow')).toBe('#0ff');
    bar.setGlowColor(null);
    expect(el.style.getPropertyValue('--tabar-glow')).toBe('');
    bar.setGlow(false);
    expect(el.hasAttribute('data-glow-tabar')).toBe(false);
  });
});

describe('initial value', () => {
  it('seeds a starting value on construct', () => {
    const bar = new Tabar({ value: 0.3 });
    expect(bar.value).toBe(30);
    expect(bar.state).toBe('active');
  });

  it('persistence restore takes precedence over the value option', () => {
    localStorage.setItem('tabar:seeded', JSON.stringify({ v: 1, value: 70, ts: Date.now() }));
    const bar = new Tabar({ id: 'seeded', value: 0.2, persist: true });
    expect(bar.value).toBe(70);
  });
});

describe('events — instance, once, off, global, DOM', () => {
  it('supports on/once/off and is chainable', async () => {
    const bar = new Tabar({ trickle: false });
    let calls = 0;
    let onceCalls = 0;
    const ret = bar.on('change', () => { calls += 1; }).once('change', () => { onceCalls += 1; });
    expect(ret).toBe(bar);
    await bar.set(0.2, { animate: false });
    await bar.set(0.4, { animate: false });
    expect(calls).toBe(2);
    expect(onceCalls).toBe(1); // once fired a single time
    bar.off('change');
    await bar.set(0.6, { animate: false });
    expect(calls).toBe(2); // no further calls after off
  });

  it('re-emits every instance event on the global bus with the instance', async () => {
    const seen = [];
    const unsub = Tabar.on('change', (value, bar) => seen.push([value, bar.id]));
    const a = new Tabar({ id: 'g1', trickle: false });
    await a.set(0.5, { animate: false });
    expect(seen).toEqual([[50, 'g1']]);
    unsub();
    await a.set(0.6, { animate: false });
    expect(seen).toHaveLength(1);
  });

  it('dispatches a DOM CustomEvent on the wrapper', async () => {
    const bar = new Tabar({ trickle: false });
    let detail = null;
    bar._wrapper.addEventListener('tabar:change', (e) => { detail = e.detail; });
    await bar.set(0.3, { animate: false });
    expect(detail.value).toBe(30);
    expect(detail.bar).toBe(bar);
  });

  it('emits show/hide/indeterminate/theme/destroy', async () => {
    const seen = [];
    const bar = new Tabar({ trickle: false, autoHide: false });
    ['show', 'hide', 'indeterminate', 'theme', 'destroy'].forEach((n) =>
      bar.on(n, () => seen.push(n)),
    );
    bar.hide();
    bar.show();
    bar.indeterminate(true);
    bar.setTheme('rainbow');
    bar.destroy();
    expect(seen).toEqual(expect.arrayContaining(['hide', 'show', 'indeterminate', 'theme', 'destroy']));
  });

  it('exposes the event name list', () => {
    expect(Tabar.events).toContain('change');
    expect(Tabar.events).toContain('destroy');
  });
});

describe('debug', () => {
  it('logs via console.debug when debug is enabled', async () => {
    const orig = console.debug;
    const logs = [];
    console.debug = (...a) => logs.push(a);
    try {
      const bar = new Tabar({ debug: true, trickle: false });
      await bar.set(0.5, { animate: false });
      expect(logs.some((a) => String(a[0]).includes('tabar:'))).toBe(true);
      bar.setDebug(false); // avoid logging on teardown after console.debug is restored
    } finally {
      console.debug = orig;
    }
  });
});

describe('gradient editing', () => {
  it('edits a single stop by index and rebuilds the fill', () => {
    const bar = new Tabar({ gradient: ['#f00', '#0f0'] });
    bar.setColorAt(1, '#00f');
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe('linear-gradient(90deg, #f00, #00f)');
  });

  it('supports stops with positions and conic/radial types', () => {
    const bar = new Tabar();
    bar.setGradient([{ color: '#f00', at: 0 }, { color: '#00f', at: 80 }]);
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe(
      'linear-gradient(90deg, #f00 0%, #00f 80%)',
    );
    bar.setGradientType('conic').setGradientAngle(45);
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe(
      'conic-gradient(from 45deg, #f00 0%, #00f 80%)',
    );
    bar.setGradientType('radial');
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toContain('radial-gradient(circle,');
  });

  it('setColor2 sets the secondary gradient color variable', () => {
    const bar = new Tabar();
    bar.setColor2('#abc');
    expect(bar._wrapper.style.getPropertyValue('--tabar-color2')).toBe('#abc');
  });

  it('supports repeating gradient types and radial shape/position', () => {
    const bar = new Tabar();
    bar.setGradient(['#000', '#fff']).setGradientType('repeating-linear').setGradientAngle(30);
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe(
      'repeating-linear-gradient(30deg, #000, #fff)',
    );
    bar.setGradientType('radial').setGradientShape('ellipse').setGradientPosition('top left');
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toBe(
      'radial-gradient(ellipse at top left, #000, #fff)',
    );
  });
});

describe('tooltips, pause/resume, visible, version', () => {
  it('renders a configurable tooltip safely', () => {
    const bar = new Tabar({ tooltip: (p) => `at ${Math.round(p)}`, trickle: false });
    const tip = document.querySelector('[data-tooltip-tabar]');
    expect(tip).toBeTruthy();
    expect(bar._wrapper.getAttribute('data-tooltip-tabar-on')).toBe('hover');
    bar.setTooltip('<b>x</b>'); // string is rendered as text, not HTML
    expect(tip.querySelector('b')).toBeNull();
    expect(tip.textContent).toBe('<b>x</b>');
    bar.setTooltip(true, { always: true });
    expect(bar._wrapper.getAttribute('data-tooltip-tabar-on')).toBe('always');
    bar.setTooltip(false);
    expect(document.querySelector('[data-tooltip-tabar]')).toBeNull();
  });

  it('pause()/resume() halt and restart trickling', async () => {
    const bar = new Tabar({ trickle: true, trickleSpeed: 10 });
    bar.start().pause();
    const paused = bar.value;
    await new Promise((r) => setTimeout(r, 50));
    expect(bar.value).toBe(paused); // no trickle while paused
    bar.resume();
    await new Promise((r) => setTimeout(r, 60));
    expect(bar.value).toBeGreaterThan(paused); // trickle resumed
  });

  it('exposes a visible getter and a version', () => {
    const bar = new Tabar({ trickle: false });
    expect(bar.visible).toBe(true);
    bar.hide();
    expect(bar.visible).toBe(false);
    expect(typeof Tabar.version).toBe('string');
  });
});

describe('labels & auto-show', () => {
  it('renders a live percentage label via labelFormat', async () => {
    const bar = new Tabar({ showLabel: true, labelFormat: (p) => `${Math.round(p)}%`, trickle: false });
    const label = document.querySelector('[data-label-tabar]');
    expect(label.textContent).toBe('0%');
    await bar.set(0.42, { animate: false });
    expect(label.textContent).toBe('42%');
  });

  it('auto-shows when set to a positive value, and can opt out', async () => {
    const bar = new Tabar({ trickle: false });
    bar.hide();
    await bar.set(0.3, { animate: false });
    expect(bar._wrapper.hidden).toBe(false); // auto-shown

    const quiet = new Tabar({ trickle: false, autoShow: false });
    quiet.hide();
    await quiet.set(0.3, { animate: false });
    expect(quiet._wrapper.hidden).toBe(true); // stayed hidden
  });
});

describe('inline track & scheme defaults', () => {
  it('does not pin color/background unless the user provides them', () => {
    const bar = new Tabar({ position: 'inline' });
    expect(bar._wrapper.style.getPropertyValue('--tabar-color')).toBe('');
    expect(bar._wrapper.style.getPropertyValue('--tabar-bg')).toBe('');
  });

  it('pins color/background when explicitly set', () => {
    const bar = new Tabar({ position: 'inline', color: '#123', background: '#eee' });
    expect(bar._wrapper.style.getPropertyValue('--tabar-color')).toBe('#123');
    expect(bar._wrapper.style.getPropertyValue('--tabar-bg')).toBe('#eee');
  });
});

describe('JSON config', () => {
  it('accepts a JSON string in the constructor and configure()', () => {
    const bar = new Tabar('{"id":"jsonbar","color":"#abc","theme":"glow"}');
    expect(bar.id).toBe('jsonbar');
    expect(bar._wrapper.getAttribute('data-theme-tabar')).toBe('glow');
    bar.configure('{"theme":"rainbow"}');
    expect(bar._wrapper.getAttribute('data-theme-tabar')).toBe('rainbow');
  });

  it('round-trips via toJSON / fromJSON', async () => {
    const bar = new Tabar({ id: 'rt', color: '#0f0', theme: 'stripes' });
    await bar.set(0.4, { animate: false });
    const json = bar.toJSON();
    expect(json.color).toBe('#0f0');
    expect(json.value).toBe(40);
    expect(typeof json.onChange).toBe('undefined'); // callbacks dropped
    bar.destroy();
    const clone = Tabar.fromJSON({ ...json, id: 'rt2' });
    expect(clone.options.theme).toBe('stripes');
  });
});

describe('AJAX / API', () => {
  it('loads a config from a URL and applies it', async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ color: '#f0f', value: 0.6 }) });
    let configured = null;
    const bar = new Tabar({ id: 'api', onConfig: (cfg) => { configured = cfg; } });
    const cfg = await bar.loadConfig('/api/cfg');
    expect(cfg.color).toBe('#f0f');
    expect(bar.value).toBe(60);
    expect(configured.color).toBe('#f0f');
    delete globalThis.fetch;
  });

  it('reports state to an endpoint and auto-reports on change', async () => {
    const posts = [];
    globalThis.fetch = async (url, opts) => { posts.push({ url, body: JSON.parse(opts.body) }); return { ok: true }; };
    const bar = new Tabar({ id: 'rep', reportUrl: '/api/progress', trickle: false });
    await bar.report();
    expect(posts[0].url).toBe('/api/progress');
    expect(posts[0].body).toMatchObject({ id: 'rep', state: expect.any(String) });
    delete globalThis.fetch;
  });

  it('fromURL constructs from fetched config', async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: 'fromurl', color: '#abc' }) });
    const bar = await Tabar.fromURL('/api/cfg');
    expect(bar.id).toBe('fromurl');
    delete globalThis.fetch;
  });
});

describe('web component <tabar-bar>', () => {
  it('mounts a bar from attributes and exposes .bar', async () => {
    await import('../src/element.js'); // registers the element
    const el = document.createElement('tabar-bar');
    el.setAttribute('value', '0.5');
    el.setAttribute('color', '#abc');
    el.setAttribute('theme', 'gradient');
    document.body.appendChild(el);
    expect(el.bar).toBeInstanceOf(Tabar);
    expect(el.bar.value).toBe(50);
    expect(el.querySelector('[data-tabar]')).toBeTruthy();
    el.remove(); // disconnectedCallback destroys the bar
    expect(el.bar).toBeNull();
  });

  it('accepts segments as a JSON attribute', async () => {
    await import('../src/element.js');
    const el = document.createElement('tabar-bar');
    el.setAttribute('segments', JSON.stringify([{ value: 0.2 }, { value: 0.8 }]));
    document.body.appendChild(el);
    expect(el.bar.segments).toHaveLength(2);
    expect(el.querySelectorAll('[data-seg-tabar]')).toHaveLength(2);
    el.remove();
  });

  it('treats an empty numeric attribute as unset (no forced 0)', async () => {
    await import('../src/element.js');
    const el = document.createElement('tabar-bar');
    el.setAttribute('height', ''); // empty → should NOT collapse the bar to 0px
    document.body.appendChild(el);
    expect(el.bar._wrapper.style.getPropertyValue('--tabar-height')).not.toBe('0px');
    el.remove();
  });
});

describe('segments', () => {
  it('stacked: tiles slots and aggregates weighted', () => {
    const bar = new Tabar({ trickle: false });
    bar.setSegments([
      { id: 'a', value: 1, weight: 1 },
      { id: 'b', value: 0.5, weight: 1 },
      { id: 'c', value: 0, weight: 2 },
    ]);
    expect(bar._wrapper.getAttribute('data-segmented-tabar')).toBe('stacked');
    expect(bar._wrapper.querySelectorAll('[data-seg-tabar]')).toHaveLength(3);
    expect(bar.value).toBeCloseTo(37.5, 1); // (100+50+0)/4
    bar.updateSegment('c', { value: 1 });
    expect(bar.value).toBeCloseTo(87.5, 1);
    bar.removeSegment('c');
    expect(bar.segments).toHaveLength(2);
  });

  it('overlay: aggregate defaults to the primary (last) segment', () => {
    const bar = new Tabar({ trickle: false, segmentMode: 'overlay' });
    bar.setSegments([{ id: 'buffered', value: 0.8 }, { id: 'played', value: 0.4 }]);
    expect(bar._wrapper.getAttribute('data-segmented-tabar')).toBe('overlay');
    expect(bar.value).toBe(40);
  });

  it('honors an aggregate override and exits on set()', async () => {
    const bar = new Tabar({ trickle: false, aggregate: 'max' });
    bar.setSegments([{ value: 0.3 }, { value: 0.9 }, { value: 0.5 }]);
    expect(bar.value).toBe(90);
    await bar.set(0.4, { animate: false });
    expect(bar.segments).toHaveLength(0);
    expect(bar._wrapper.hasAttribute('data-segmented-tabar')).toBe(false);
  });
});

describe('error UX', () => {
  it('warn/succeed states and set() clears them', async () => {
    const bar = new Tabar({ trickle: false });
    bar.set(0.5, { animate: false });
    bar.warn('slow');
    expect(bar.state).toBe('warning');
    bar.succeed();
    expect(bar.state).toBe('success');
    await bar.set(0.6, { animate: false });
    expect(bar.state).toBe('active');
  });

  it('retry invokes the handler once, clears error, counts attempts', () => {
    let got = 0;
    const bar = new Tabar({ trickle: false });
    bar.retryWith((b, n) => { got = n; });
    bar.error('x');
    let fired = 0;
    bar.on('retry', () => { fired += 1; });
    bar.retry();
    expect(bar.attempts).toBe(1);
    expect(got).toBe(1);
    expect(fired).toBe(1);
    expect(bar.state).toBe('active');
  });

  it('retry without a handler is a no-op', () => {
    const bar = new Tabar({ trickle: false });
    bar.error();
    bar.retry();
    expect(bar.attempts).toBe(0);
  });

  it('announces to the shared aria-live region; complete getter', async () => {
    const bar = new Tabar({ trickle: false });
    await bar.done(true);
    expect(bar.complete).toBe(true);
    const region = document.getElementById('tabar-live');
    expect(region).toBeTruthy();
    expect(region.textContent).toContain('Complete');
  });

  it('stall fires + warning after stallTimeout of no progress', async () => {
    const bar = new Tabar({ trickle: false, stallTimeout: 30 });
    let stalled = false;
    bar.on('stall', () => { stalled = true; });
    bar.setProgress(100, 1000);
    await new Promise((r) => setTimeout(r, 60));
    expect(stalled).toBe(true);
    expect(bar.state).toBe('warning');
  });
});

describe('gradients', () => {
  it("theme:'gradient' builds a fill so type/shape/position apply", () => {
    const bar = new Tabar({ theme: 'gradient', color: '#f00', color2: '#00f', trickle: false });
    const fill = () => bar._wrapper.style.getPropertyValue('--tabar-fill');
    expect(fill()).toMatch(/^linear-gradient\(/);
    bar.setGradientType('radial');
    expect(fill()).toMatch(/^radial-gradient\(/);
    bar.setGradientType('conic');
    expect(fill()).toMatch(/^conic-gradient\(/);
  });

  it('anchors the gradient to the track via --tabar-fill-scale', () => {
    const bar = new Tabar({ theme: 'gradient', color: '#f00', color2: '#00f', trickle: false });
    bar.set(0.5, { animate: false });
    expect(bar._bar.style.getPropertyValue('--tabar-fill-scale')).toBe('0.5');
  });

  it('renders a real SVG gradient stroke for a circular gradient ring', () => {
    const ring = new Tabar({ shape: 'circular', theme: 'gradient', color: '#0f0', color2: '#00f', trickle: false });
    expect(ring._wrapper.querySelector('linearGradient')).toBeTruthy();
    expect(ring._wrapper.querySelectorAll('linearGradient stop')).toHaveLength(2);
    expect(ring._bar.style.stroke).toContain('url(#');
  });

  it('still honors an explicit gradient stops array', () => {
    const bar = new Tabar({ gradient: ['#f00', '#0f0', '#00f'], trickle: false });
    expect(bar._wrapper.style.getPropertyValue('--tabar-fill')).toMatch(/^linear-gradient\(/);
  });
});

describe('audit fixes', () => {
  it('mints unique segment ids (no collision after remove + add)', () => {
    const bar = new Tabar({ trickle: false });
    bar.setSegments([{ value: 0 }, { value: 0 }, { value: 0 }]);
    const first = bar.segments.map((s) => s.id);
    bar.removeSegment(first[1]);
    bar.addSegment({ value: 0.5 });
    const ids = bar.segments.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length); // all unique
  });

  it('removes the shared aria-live region when the last bar is destroyed', async () => {
    destroyAll(); // start from a clean ref-count
    const bar = new Tabar({ trickle: false });
    await bar.done(true); // creates #tabar-live
    expect(document.getElementById('tabar-live')).toBeTruthy();
    bar.destroy();
    expect(document.getElementById('tabar-live')).toBeNull();
  });

  it('restores a completed (100%) persisted bar as done, not active', () => {
    localStorage.setItem(
      'tabar:keepme',
      JSON.stringify({ v: 1, ts: Date.now(), value: 100 }),
    );
    const bar = new Tabar({ id: 'keepme', persist: { storage: 'local' }, trickle: false });
    expect(bar.value).toBe(100);
    expect(bar.state).toBe('done');
  });
});

describe('inline messages', () => {
  const msgEl = (bar) => bar._wrapper.querySelector('[data-message-tabar]');

  it('shows a state-specific message, falling back to default', async () => {
    const bar = new Tabar({
      trickle: false,
      messages: { error: 'Failed', done: 'Complete', default: (p) => `${Math.round(p)}%` },
    });
    bar.setProgress(40, 100); // active -> no 'active' key -> default
    expect(msgEl(bar).textContent).toBe('40%');
    expect(bar.message).toBe('40%');
    bar.error('x');
    expect(msgEl(bar).textContent).toBe('Failed');
    bar.warn('y'); // no 'warning' key -> default (uses current progress)
    expect(msgEl(bar).textContent).toBe('40%');
    await bar.done(true);
    expect(msgEl(bar).textContent).toBe('Complete');
  });

  it('updates live via setMessages/setMessage and clears with null', () => {
    const bar = new Tabar({ trickle: false });
    expect(msgEl(bar)).toBeNull(); // no element until a message resolves
    bar.setMessages({ default: 'Ready' });
    expect(msgEl(bar).hidden).toBe(false);
    expect(msgEl(bar).textContent).toBe('Ready');
    bar.setMessage('error', 'Boom');
    bar.error('x');
    expect(msgEl(bar).textContent).toBe('Boom');
    bar.setMessages(null);
    expect(msgEl(bar).hidden).toBe(true);
  });

  it('applies alignment and color options', () => {
    const bar = new Tabar({ trickle: false, messages: { default: 'Hi' }, messageAlign: 'start', messageColor: '#123456' });
    const el = msgEl(bar);
    expect(el.style.getPropertyValue('--tabar-message-align')).toBe('flex-start');
    expect(el.style.getPropertyValue('--tabar-message-color')).toBe('#123456');
  });

  it('escapes message content (textContent, no HTML injection)', () => {
    const bar = new Tabar({ trickle: false, messages: { default: '<img src=x onerror=alert(1)>' } });
    const el = msgEl(bar);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain('<img');
  });
});

describe('i18n: shipped locales + RTL', () => {
  afterEach(() => { Tabar.locale = 'en'; });

  it('ships a full set with localized units', () => {
    for (const code of ['es', 'fr', 'de', 'pt', 'it', 'ja', 'zh', 'ko', 'ar']) {
      expect(typeof Tabar.getLocale(code).progress).toBe('string');
    }
    Tabar.locale = 'fr';
    expect(Tabar.formatBytes(1536)).toBe('1.5 Ko');
  });

  it('marks a bar RTL from an RTL locale (incl. circular)', () => {
    Tabar.locale = 'ar';
    const ring = new Tabar({ shape: 'circular', trickle: false });
    expect(ring._wrapper.getAttribute('data-rtl-tabar')).toBe('true');
  });
});

describe('tooltip', () => {
  it('creates the tip via setTooltip and flags the wrapper', () => {
    const bar = new Tabar({ position: 'inline', trickle: false });
    expect(bar._wrapper.querySelector('[data-tooltip-tabar]')).toBeNull();
    bar.setTooltip(true);
    const el = bar._wrapper;
    expect(el.querySelector('[data-tooltip-tabar]')).toBeTruthy();
    expect(el.getAttribute('data-tooltip-tabar-on')).toBe('hover');
    bar.setTooltip('Fixed', { always: true });
    expect(el.getAttribute('data-tooltip-tabar-on')).toBe('always');
    bar.setTooltip(false);
    expect(el.querySelector('[data-tooltip-tabar]')).toBeNull();
  });

  it('attaches a circular tooltip to the wrapper, not the SVG arc', () => {
    const bar = new Tabar({ shape: 'circular', trickle: false });
    bar.setTooltip(true);
    const tip = bar._wrapper.querySelector('[data-tooltip-tabar]');
    expect(tip).toBeTruthy();
    expect(tip.parentNode).toBe(bar._wrapper); // not inside the <svg> bar
  });
});

describe('positions & length', () => {
  it('supports centered edge positions and sets orientation', () => {
    const top = new Tabar({ position: 'top-center', trickle: false });
    expect(top._wrapper.getAttribute('data-position-tabar')).toBe('top-center');
    expect(top._wrapper.getAttribute('data-orientation-tabar')).toBe('horizontal');
    const left = new Tabar({ position: 'left-center', trickle: false });
    expect(left._wrapper.getAttribute('data-orientation-tabar')).toBe('vertical');
  });

  it('reflects length as --tabar-length (number → px, string passthrough)', () => {
    const a = new Tabar({ position: 'top', length: 320, trickle: false });
    expect(a._wrapper.style.getPropertyValue('--tabar-length')).toBe('320px');
    const b = new Tabar({ position: 'top', length: '60%', trickle: false });
    expect(b._wrapper.style.getPropertyValue('--tabar-length')).toBe('60%');
    a.setLength('75%');
    expect(a._wrapper.style.getPropertyValue('--tabar-length')).toBe('75%');
  });

  it('falls back to top for an unknown position', () => {
    const bar = new Tabar({ position: 'nope', trickle: false });
    expect(bar._wrapper.getAttribute('data-position-tabar')).toBe('top');
  });
});

describe('multiple colors', () => {
  it('uses `colors` as a gradient fill (precedence over gradient)', () => {
    const bar = new Tabar({ position: 'inline', colors: ['#f00', '#0f0', '#00f'], trickle: false });
    const fill = bar._wrapper.style.getPropertyValue('--tabar-fill');
    expect(fill).toContain('linear-gradient');
    expect(fill).toContain('#00f');
  });

  it('renders hard color bands in bands mode (doubled boundaries)', () => {
    const bar = new Tabar({ position: 'inline', colors: ['#f00', '#0f0'], colorMode: 'bands', trickle: false });
    const fill = bar._wrapper.style.getPropertyValue('--tabar-fill');
    // Each color spans an explicit start% end% block — no smooth interpolation.
    expect(fill).toContain('#f00 0% 50%');
    expect(fill).toContain('#0f0 50% 100%');
  });

  it('flags the animated-multicolor attribute', () => {
    const bar = new Tabar({ position: 'inline', colors: ['#f00', '#00f'], colorAnimate: true, trickle: false });
    expect(bar._wrapper.getAttribute('data-multicolor-anim-tabar')).toBe('true');
    bar.setColorAnimate(false);
    expect(bar._wrapper.getAttribute('data-multicolor-anim-tabar')).toBeNull();
  });

  it('addColorStop / removeColorStop edit the stops', () => {
    const bar = new Tabar({ position: 'inline', colors: ['#f00', '#0f0'], trickle: false });
    bar.addColorStop('#00f');
    expect(bar.options.colors).toHaveLength(3);
    bar.removeColorStop(0);
    expect(bar.options.colors).toEqual(['#0f0', '#00f']);
  });
});

describe('circular config', () => {
  it('applies trackColor, lineCap, startAngle and clockwise', () => {
    const bar = new Tabar({ shape: 'circular', trackColor: '#eee', lineCap: 'butt', startAngle: 0, clockwise: false, trickle: false });
    const el = bar._wrapper;
    expect(el.style.getPropertyValue('--tabar-track-color')).toBe('#eee');
    expect(el.style.getPropertyValue('--tabar-start-angle')).toBe('0deg');
    expect(el.style.getPropertyValue('--tabar-flip')).toBe('-1'); // counter-clockwise
    expect(bar._bar.getAttribute('stroke-linecap')).toBe('butt');
    bar.setLineCap('round');
    expect(bar._bar.getAttribute('stroke-linecap')).toBe('round');
  });
});

describe('segments advance (any count)', () => {
  it('advances added segments beyond the initial three', () => {
    const bar = new Tabar({ position: 'inline', trickle: false });
    bar.setSegments([{ id: 'a', value: 0.2 }, { id: 'b', value: 0.2 }, { id: 'c', value: 0.2 }]);
    bar.addSegment({ id: 'd', value: 0.2 });
    bar.addSegment({ id: 'e', value: 0.2 });
    expect(bar.segments).toHaveLength(5);
    bar.updateSegment('e', { value: 90 }); // absolute on the 0–100 scale
    expect(bar.segments.find((s) => s.id === 'e').value).toBe(90);
  });
});

describe('data-attribute config (plain mount)', () => {
  it('reads data-tabar-* off the mount element', () => {
    const host = document.createElement('div');
    host.id = 'dh';
    host.setAttribute('data-tabar-tooltip', 'true');
    host.setAttribute('data-tabar-length', '50%');
    host.setAttribute('data-tabar-glow', 'true');
    document.body.appendChild(host);
    const bar = new Tabar({ position: 'inline', mountTo: host, trickle: false });
    expect(bar.options.tooltip).toBe(true);
    expect(bar.options.length).toBe('50%');
    expect(bar.options.glow).toBe(true);
  });

  it('lets an explicit JS option win over a data attribute', () => {
    const host = document.createElement('div');
    host.setAttribute('data-tabar-color', '#ff0000');
    document.body.appendChild(host);
    const bar = new Tabar({ position: 'inline', mountTo: host, color: '#00ff00', trickle: false });
    expect(bar.options.color).toBe('#00ff00');
  });

  it('ignores unknown data-tabar-* attributes', () => {
    const host = document.createElement('div');
    host.setAttribute('data-tabar-bogus', 'x');
    document.body.appendChild(host);
    const bar = new Tabar({ position: 'inline', mountTo: host, trickle: false });
    expect('bogus' in bar.options).toBe(false);
  });
});
