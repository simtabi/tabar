// Demo behavior — external module so the page can run under a strict
// `script-src 'self'` CSP (no inline scripts). Serve over HTTP (`npm run demo`).
import { Tabar } from '../src/tabar.js';

const pct = (p) => `${Math.round(p)}%`;

// ---------------------------------------------------------------------------
// Event log FIRST — registered before any bar is created, so the global bus
// captures even the bars' construction (initial values, auto-show) at page load.
// ---------------------------------------------------------------------------
const GLYPH = {
  start: '▶', change: '→', done: '✓', reset: '↺', resume: '⏯', show: '◉',
  hide: '○', indeterminate: '∞', theme: '✦', destroy: '✕', config: '⬇', report: '⬆',
};
const logEl = document.getElementById('event-log');
const logCountEl = document.getElementById('log-count');
let logCount = 0;
const log = (name, value, bar) => {
  let v = '';
  if (typeof value === 'number') v = ` ${Math.round(value)}`;
  else if (typeof value === 'string') v = ` ${value}`;
  logEl.textContent = `${GLYPH[name] || '·'} ${bar.id} · ${name}${v}\n` + logEl.textContent;
  logCount += 1;
  logCountEl.textContent = `${logCount} event${logCount === 1 ? '' : 's'}`;
  const lines = logEl.textContent.split('\n');
  if (lines.length > 60) logEl.textContent = lines.slice(0, 60).join('\n');
};
Tabar.events.forEach((name) => Tabar.on(name, (value, bar) => log(name, value, bar)));

// ---------------------------------------------------------------------------
// Bars
// ---------------------------------------------------------------------------

// 1 · Top page bar
const page = new Tabar({ color: 'var(--accent, #29d)', height: 4, trickleSpeed: 240 });

// 2 · Inline & themeable
const inline = new Tabar({
  position: 'inline', mountTo: '#inline-host', height: 10, radius: 6, innerRadius: 6,
  trickle: false, showPeg: false, showLabel: true, labelFormat: pct, value: 0.4,
});
const COLORS = ['#29d', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22'];
const swatches = document.getElementById('swatches');
COLORS.forEach((c) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.style.background = c;
  b.setAttribute('aria-label', `Set color ${c}`);
  b.addEventListener('click', () => inline.setColor(c));
  swatches.appendChild(b);
});
let rounded = true;

// 3 · Themes, gradients & shapes
const themed = new Tabar({
  position: 'inline', mountTo: '#theme-host', height: 14, radius: 8, innerRadius: 8,
  trickle: false, showPeg: false, showLabel: true, labelFormat: pct, value: 0.7,
});

// 6 · Many at once — initial values + persistence so content always shows and survives reloads
const CONC = [{ color: '#e74c3c' }, { color: '#2ecc71' }, { color: '#9b59b6' }];
const INITIAL = [0.9, 0.6, 0.75];
const bars = CONC.map((c, i) => new Tabar({
  id: `conc-${i + 1}`, position: 'inline', mountTo: `#c${i + 1}`,
  color: c.color, height: 10, radius: 5, innerRadius: 5, trickle: false, showPeg: false,
  showLabel: true, labelFormat: pct, value: INITIAL[i], persist: { key: `conc-${i + 1}`, debounce: 0 },
}));

// 7 · Survives a refresh
const persist = new Tabar({
  id: 'demo-persist', position: 'inline', mountTo: '#persist-host',
  color: '#1abc9c', height: 12, radius: 6, innerRadius: 6, trickle: false, showPeg: false,
  showLabel: true, labelFormat: pct, value: 0.5, persist: { storage: 'local', debounce: 0 },
});

// 8 · Scroll progress (rAF-throttled so it updates at most once per frame)
const scroll = new Tabar({ position: 'bottom', color: '#e67e22', height: 4, trickle: false, showPeg: false });
scroll.show();
let scrollTick = false;
const onScroll = () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scroll.set(max > 0 ? scrollY / max : 0, { animate: false });
    scrollTick = false;
  });
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 5 · Vertical bar (created on demand)
let vbar = null;

// 9 · Circular rings
const RINGS = [
  { color: '#29d', value: 0.66 },
  { theme: 'gradient', gradient: ['#f12711', '#f5af19'], value: 0.4 },
  { color: '#2ecc71', glow: true, value: 0.85 },
];
const rings = RINGS.map((cfg) => new Tabar({
  shape: 'circular', size: 96, height: 9, mountTo: '#ring-row',
  showLabel: true, labelFormat: pct, ...cfg,
}));

// 10 · Upload / download with ETA — the label reads live speed + ETA from bar.stats
const xfer = new Tabar({
  position: 'inline', mountTo: '#xfer-host', height: 14, radius: 7, innerRadius: 7,
  color: '#3498db', trickle: false, showPeg: false, showLabel: true,
  labelFormat: (p, bar) => {
    const s = bar.stats;
    const speed = s.speed ? `${Tabar.formatBytes(s.speed)}/s` : '';
    const eta = s.eta != null && s.eta > 0 ? `· ${Tabar.formatDuration(s.eta)} left` : '';
    return `${Math.round(p)}%  ${speed} ${eta}`.replace(/\s+/g, ' ').trim();
  },
});
let xferTimer = null;
let xferLoaded = 0;
let xferChunk = 900 * 1024;
const XFER_TOTAL = 24 * 1024 * 1024;
const stopXfer = () => { if (xferTimer) { clearInterval(xferTimer); xferTimer = null; } };

// 11 · Reactivity — bind a bar to the slider
const react = new Tabar({
  position: 'inline', mountTo: '#react-host', height: 14, radius: 7, innerRadius: 7,
  color: '#9b59b6', trickle: false, showPeg: false, showLabel: true, labelFormat: pct,
});
const reactSlider = document.getElementById('react-slider');
const reactVal = document.getElementById('react-val');
react.bind(() => Number(reactSlider.value) / 100, { event: 'input', target: reactSlider });
reactSlider.addEventListener('input', () => { reactVal.textContent = `${reactSlider.value}%`; });

// ---------------------------------------------------------------------------
// Gradient editor + modifiers (section 3)
// ---------------------------------------------------------------------------
const gradA = document.getElementById('grad-a');
const gradB = document.getElementById('grad-b');
const gradAngle = document.getElementById('grad-angle');
const gradType = document.getElementById('grad-type');
const gradShape = document.getElementById('grad-shape');
const gradPosition = document.getElementById('grad-position');
const gradRadialRow = document.getElementById('grad-radial');
const angleVal = document.getElementById('angle-val');
const applyGradient = () => {
  const type = gradType.value;
  const isRadialOrConic = type.includes('radial') || type.includes('conic');
  gradRadialRow.style.display = isRadialOrConic ? 'flex' : 'none';
  angleVal.textContent = `${gradAngle.value}°`;
  themed.setTheme('default').setGradient([gradA.value, gradB.value], { angle: Number(gradAngle.value), type });
  themed.setGradientShape(type.includes('radial') ? gradShape.value : null);
  themed.setGradientPosition(isRadialOrConic ? gradPosition.value : null);
};
[gradA, gradB, gradAngle].forEach((el) => el.addEventListener('input', applyGradient));
[gradType, gradShape, gradPosition].forEach((el) => el.addEventListener('change', applyGradient));

const glowToggle = document.getElementById('glow-toggle');
const glowColor = document.getElementById('glow-color');
const stripeToggle = document.getElementById('stripe-toggle');
const tooltipToggle = document.getElementById('tooltip-toggle');
glowToggle.addEventListener('change', () => themed.setGlow(glowToggle.checked, glowColor.value));
glowColor.addEventListener('input', () => themed.setGlowColor(glowColor.value));
stripeToggle.addEventListener('change', () => themed.setStriped(stripeToggle.checked));
tooltipToggle.addEventListener('change', () => themed.setTooltip(tooltipToggle.checked));

// ---------------------------------------------------------------------------
// JSON config (section 4)
// ---------------------------------------------------------------------------
const jsonBox = document.getElementById('json-config');
jsonBox.value = JSON.stringify(
  { theme: 'gradient', color: '#11998e', color2: '#38ef7d', height: 14, glow: true },
  null,
  2,
);

// ---------------------------------------------------------------------------
// Controls (event delegation; no inline handlers)
// ---------------------------------------------------------------------------
const actions = {
  'page-start': () => page.start(),
  'page-inc': () => page.inc(),
  'page-set': () => page.set(0.6),
  'page-pause': () => page.pause(),
  'page-resume': () => page.resume(),
  'page-indeterminate': () => page.indeterminate(true),
  'page-done': () => page.done(),

  'inline-25': () => inline.set(0.25),
  'inline-50': () => inline.set(0.5),
  'inline-100': () => inline.set(1),
  'inline-round': () => { rounded = !rounded; const r = rounded ? 6 : 0; inline.setRadius(r).setInnerRadius(r); },

  'theme-default': () => themed.setTheme('default').setGradient(null),
  'theme-gradient': () => themed.setTheme('gradient'),
  'theme-rainbow': () => themed.setTheme('rainbow'),
  'theme-stripes': () => themed.setTheme('stripes'),
  'theme-multicolor': () => themed.setTheme('default').setGradient(['#f12711', '#f5af19', '#00b09b', '#2980b9']),

  'json-apply': () => { try { themed.configure(jsonBox.value); } catch { /* ignore */ } },
  'json-dump': () => { jsonBox.value = JSON.stringify(themed.toJSON(), null, 2); },

  'vert-toggle': () => {
    if (vbar) { vbar.destroy(); vbar = null; return; }
    vbar = new Tabar({ position: 'right', height: 8, theme: 'gradient', color: '#16a34a', color2: '#0ea5e9', trickle: false });
    vbar.set(0.6);
  },
  'vert-go': () => { if (vbar) vbar.set(0.1 + Math.random() * 0.9); },

  // Reset to 0 (no animation) then animate to a fresh value next frame, so it always
  // visibly animates — even though the bars load already at a value.
  'conc-go': () => bars.forEach((b) => {
    b.set(0, { animate: false });
    requestAnimationFrame(() => b.set(0.25 + Math.random() * 0.75));
  }),
  'conc-reset': () => bars.forEach((b) => b.set(0, { animate: false }).show()),

  'persist-inc': () => persist.set(Math.min(1, persist.value / 100 + 0.15)),
  'persist-clear': () => { persist.reset(); persist.show(); },

  'ring-go': () => rings.forEach((r) => {
    r.set(0, { animate: false });
    requestAnimationFrame(() => r.set(0.2 + Math.random() * 0.8));
  }),
  'ring-indeterminate': () => rings.forEach((r) => r.indeterminate(true)),
  'ring-reset': () => rings.forEach((r) => r.set(0, { animate: false })),

  'xfer-start': () => {
    stopXfer();
    xfer.reset();
    xfer.show();
    xferLoaded = 0;
    xferChunk = 900 * 1024;
    xferTimer = setInterval(() => {
      xferLoaded = Math.min(XFER_TOTAL, xferLoaded + xferChunk * (0.5 + Math.random()));
      xfer.setProgress(xferLoaded, XFER_TOTAL);
      if (xferLoaded >= XFER_TOTAL) stopXfer();
    }, 120);
  },
  'xfer-stall': () => { xferChunk = xferChunk > 300 * 1024 ? 120 * 1024 : 900 * 1024; },
  'xfer-fail': () => { stopXfer(); xfer.error('network error'); },
  'xfer-reset': () => { stopXfer(); xfer.reset(); xfer.show(); },
  'evt-clear': () => { logEl.textContent = ''; logCount = 0; logCountEl.textContent = '0 events'; },
  reload: () => location.reload(),
};
document.body.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act && actions[act]) actions[act]();
});

// Debug toggle
document.getElementById('debug-toggle').addEventListener('change', (e) => {
  Tabar.debug = e.target.checked;
});

// Theme toggle
document.getElementById('theme').addEventListener('click', () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
});

// Language switcher — demonstrates i18n (localized byte/duration units in the transfer label)
Tabar.addLocale('de', { bytes: ['B', 'KB', 'MB', 'GB', 'TB'], hour: 'Std', min: 'Min', sec: 'Sek', lessThan: '<1Sek', progress: 'Fortschritt' });
Tabar.addLocale('fr', { bytes: ['o', 'Ko', 'Mo', 'Go', 'To'], hour: 'h', min: 'min', sec: 's', lessThan: '<1s', progress: 'Progression' });
Tabar.addLocale('es', { bytes: ['B', 'KB', 'MB', 'GB', 'TB'], hour: 'h', min: 'm', sec: 's', lessThan: '<1s', progress: 'Progreso' });
document.getElementById('lang').addEventListener('change', (e) => {
  Tabar.locale = e.target.value;
  if (xferLoaded > 0) xfer.setProgress(xferLoaded, XFER_TOTAL); // re-render the localized label
});

// Version badge in the footer
document.getElementById('version').textContent = `Tabar v${Tabar.version}`;
