// Playground behavior. Bundled by scripts/build-site.js (Tabar is inlined).
import { Tabar } from '../src/tabar.js';
import { TabarGroup } from '../src/group.js';

const pct = (p) => `${Math.round(p)}%`;
const $ = (sel) => document.querySelector(sel);

/* --- Theme toggle (persisted) --------------------------------------------- */
const root = document.documentElement;
const savedTheme = localStorage.getItem('tabar-theme');
if (savedTheme) root.dataset.theme = savedTheme;
$('#theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('tabar-theme', root.dataset.theme);
});

/* --- Event log FIRST (captures page-load construction) -------------------- */
const GLYPH = {
  start: '▶', change: '→', done: '✓', reset: '↺', resume: '⏯', show: '◉', hide: '○',
  indeterminate: '∞', theme: '✦', destroy: '✕', config: '⬇', report: '⬆', progress: '⇡',
  error: '✗', warning: '⚠', success: '★', retry: '↻', stall: '⏳',
};
const logEl = $('#event-log');
const logCountEl = $('#log-count');
let logCount = 0;
const log = (name, value, bar) => {
  let v = '';
  if (typeof value === 'number') v = ` ${Math.round(value)}`;
  const id = bar?.id ? ` #${bar.id}` : '';
  const line = `${GLYPH[name] || '·'} ${name}${v}${id}\n`;
  logEl.textContent = line + logEl.textContent;
  logCount += 1;
  logCountEl.textContent = `${logCount} event${logCount === 1 ? '' : 's'}`;
};
Tabar.events.forEach((name) => Tabar.on(name, (value, bar) => log(name, value, bar)));

/* --- Basics: top bar ------------------------------------------------------ */
const page = new Tabar({ id: 'page', color: 'var(--accent)', height: 4, trickleSpeed: 240 });

/* --- Inline + swatches + slider ------------------------------------------- */
const inline = new Tabar({
  id: 'inline', position: 'inline', mountTo: '#inline-host', height: 16, radius: 8,
  color: '#1abc9c', trickle: false, showPeg: false, showLabel: true, labelFormat: pct, value: 0.4,
});
const swatchHost = $('#swatches');
['#1abc9c', '#2299dd', '#7c4dff', '#e91e63', '#f5a623', '#30d158'].forEach((c) => {
  const b = document.createElement('button');
  b.className = 'swatch';
  b.style.background = c;
  b.style.borderColor = c;
  b.setAttribute('aria-label', `Use ${c}`);
  b.addEventListener('click', () => inline.setColor(c));
  swatchHost.appendChild(b);
});
const inlineSlider = $('#inline-slider');
const inlineVal = $('#inline-val');
inlineSlider.addEventListener('input', () => {
  inline.set(Number(inlineSlider.value) / 100);
  inlineVal.textContent = `${inlineSlider.value}%`;
});

/* --- Circular rings ------------------------------------------------------- */
const ringRow = $('#ring-row');
const RINGS = [
  { color: '#2299dd', value: 0.66 },
  { theme: 'gradient', color: '#2299dd', color2: '#7c4dff', value: 0.4 },
  { color: '#30d158', value: 0.85 },
];
const rings = RINGS.map((cfg) => {
  const host = document.createElement('div');
  ringRow.appendChild(host);
  return new Tabar({
    position: 'inline', mountTo: host, shape: 'circular', size: 96, height: 8, trickle: false,
    showLabel: true, labelFormat: pct, ...cfg,
  });
});

/* --- Themes + gradient editor --------------------------------------------- */
const themed = new Tabar({
  id: 'themed', position: 'inline', mountTo: '#theme-host', height: 28, radius: 10,
  theme: 'gradient', color: '#f12711', color2: '#f5af19', trickle: false, value: 0.7,
});
const gradA = $('#grad-a');
const gradB = $('#grad-b');
const gradAngle = $('#grad-angle');
const angleVal = $('#angle-val');
const gradType = $('#grad-type');
const applyGrad = () => {
  themed.setColor(gradA.value).setColor2(gradB.value).setGradientAngle(Number(gradAngle.value)).setGradientType(gradType.value);
  angleVal.textContent = `${gradAngle.value}°`;
};
[gradA, gradB, gradAngle, gradType].forEach((el) => el.addEventListener('input', applyGrad));
$('#glow-toggle').addEventListener('change', (e) => themed.setGlow(e.target.checked));
$('#stripe-toggle').addEventListener('change', (e) => themed.setStriped(e.target.checked));
$('#tooltip-toggle').addEventListener('change', (e) => themed.setTooltip(e.target.checked ? pct : false));

/* --- Transfer / ETA ------------------------------------------------------- */
const XFER_TOTAL = 24 * 1024 * 1024;
const xfer = new Tabar({
  id: 'xfer', position: 'inline', mountTo: '#xfer-host', height: 28, radius: 10, trickle: false,
  showLabel: true, color: '#2299dd',
  labelFormat: (p, bar) => {
    const s = bar.stats;
    if (s.speed > 0 && p < 100) return `${pct(p)} · ${Tabar.formatBytes(s.speed)}/s · ${Tabar.formatDuration(s.eta)}`;
    return pct(p);
  },
});
let xferTimer = null;
let xferLoaded = 0;
let xferChunk = 900 * 1024;
const stopXfer = () => { if (xferTimer) { clearInterval(xferTimer); xferTimer = null; } };

/* --- Reactivity ----------------------------------------------------------- */
const react = new Tabar({
  id: 'react', position: 'inline', mountTo: '#react-host', height: 28, radius: 10,
  color: '#9b59b6', trickle: false, showPeg: false, showLabel: true, labelFormat: pct,
});
const reactSlider = $('#react-slider');
const reactVal = $('#react-val');
react.bind(() => Number(reactSlider.value) / 100, { event: 'input', target: reactSlider });
reactSlider.addEventListener('input', () => { reactVal.textContent = `${reactSlider.value}%`; });

/* --- JSON config ---------------------------------------------------------- */
const jsonBar = new Tabar({ id: 'json', position: 'inline', mountTo: '#json-host', height: 16, radius: 8, trickle: false, value: 0.3 });
const jsonEl = $('#json-config');
jsonEl.value = JSON.stringify({ color: '#e91e63', height: 16, radius: 9999, theme: 'gradient', color2: '#7c4dff', value: 0.55 }, null, 2);

/* --- Segments ------------------------------------------------------------- */
const segChunks = [
  { id: 'fonts', value: 1, color: '#2299dd', weight: 1 },
  { id: 'images', value: 0.4, color: '#30d158', weight: 3 },
  { id: 'video', value: 0, color: '#ff9f0a', weight: 6 },
];
let segNext = 1;
const segStacked = new Tabar({ position: 'inline', mountTo: '#seg-stacked', height: 16, radius: 8 });
segStacked.setSegments(segChunks.map((c) => ({ ...c })));
const segOverlay = new Tabar({ position: 'inline', mountTo: '#seg-overlay', height: 16, radius: 8, segmentMode: 'overlay' });
segOverlay.setSegments([{ id: 'buffered', value: 0.8, color: '#c7c7cc' }, { id: 'played', value: 0.35, color: '#2299dd' }]);

/* --- Group ---------------------------------------------------------------- */
const group = new TabarGroup({ mountTo: '#group-host' });
let groupN = 0;
const addGroupChild = () => {
  const bar = group.add({ label: `file-${(groupN += 1)}.zip`, height: 14, radius: 7 });
  const total = 1e6 + Math.random() * 4e6;
  let loaded = 0;
  const t = setInterval(() => {
    loaded = Math.min(total, loaded + total * (0.04 + Math.random() * 0.06));
    bar.setProgress(loaded, total);
    if (loaded >= total) { clearInterval(t); bar.done(true); }
  }, 220);
};
addGroupChild();
addGroupChild();

/* --- Feedback ------------------------------------------------------------- */
const feedback = new Tabar({ id: 'feedback', position: 'inline', mountTo: '#feedback-host', height: 16, radius: 8, showLabel: true, labelFormat: pct, trickle: false });
feedback.set(0.45, { animate: false });
feedback.retryWith(() => feedback.set(0.7));
const fbAttempts = $('#fb-attempts');
feedback.on('retry', (n) => { fbAttempts.textContent = String(n); });

/* --- Concurrency ---------------------------------------------------------- */
const conc = ['#2299dd', '#30d158', '#ff9f0a'].map((c, i) =>
  new Tabar({ position: 'inline', mountTo: `#c${i + 1}`, height: 12, radius: 6, color: c, trickle: false, showPeg: false }),
);

/* --- Persistence ---------------------------------------------------------- */
const persist = new Tabar({ id: 'persist', position: 'inline', mountTo: '#persist-host', height: 16, radius: 8, trickle: false, color: '#e67e22', persist: { storage: 'local', debounce: 0 } });

/* --- Actions -------------------------------------------------------------- */
const actions = {
  'top-start': () => page.start(),
  'top-inc': () => page.inc(),
  'top-done': () => page.done(),
  'top-ind': () => page.indeterminate(true),
  'ring-go': () => rings.forEach((r) => r.set(Math.random() * 0.8 + 0.2)),
  'ring-ind': () => rings.forEach((r) => r.indeterminate(true)),
  'ring-reset': () => rings.forEach((r) => r.set(0, { animate: false })),
  'xfer-start': () => {
    stopXfer(); xfer.reset(); xfer.show(); xferLoaded = 0; xferChunk = 900 * 1024;
    xferTimer = setInterval(() => {
      xferLoaded = Math.min(XFER_TOTAL, xferLoaded + xferChunk * (0.5 + Math.random()));
      xfer.setProgress(xferLoaded, XFER_TOTAL);
      if (xferLoaded >= XFER_TOTAL) stopXfer();
    }, 120);
  },
  'xfer-stall': () => { xferChunk = xferChunk > 300 * 1024 ? 120 * 1024 : 900 * 1024; },
  'xfer-fail': () => { stopXfer(); xfer.error('network error'); },
  'xfer-reset': () => { stopXfer(); xfer.reset(); xfer.show(); },
  'json-apply': () => { try { jsonBar.configure(jsonEl.value); } catch { /* invalid JSON */ } },
  'seg-advance': () => {
    const c = segChunks[segNext % segChunks.length];
    segStacked.updateSegment(c.id, { value: Math.min(1, (c.value += 0.25)) });
    segNext += 1;
  },
  'group-add': addGroupChild,
  'fb-warn': () => feedback.warn('slow connection'),
  'fb-error': () => feedback.error('upload failed'),
  'fb-retry': () => feedback.retry(),
  'fb-succeed': () => feedback.succeed('verified'),
  'conc-go': () => conc.forEach((b, i) => setTimeout(() => b.set(Math.random() * 0.7 + 0.3), i * 150)),
  'persist-set': () => persist.set(0.6),
  'persist-clear': () => persist.reset(),
  'evt-clear': () => { logEl.textContent = ''; logCount = 0; logCountEl.textContent = '0 events'; },
  reload: () => location.reload(),
};
document.body.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act && actions[act]) actions[act]();
});

/* --- Debug, language, version -------------------------------------------- */
$('#debug-toggle').addEventListener('change', (e) => { Tabar.debug = e.target.checked; });
$('#lang').addEventListener('change', (e) => {
  Tabar.locale = e.target.value;
  if (xferLoaded > 0) xfer.setProgress(xferLoaded, XFER_TOTAL); // re-render localized label
});
$('#version').textContent = `Tabar v${Tabar.version}`;
