// Playground behavior. Bundled by scripts/build-site.js (Tabar is inlined).
import { Tabar } from '../../../src/tabar.js';
import { TabarGroup } from '../../../src/group.js';

const pct = (p) => `${Math.round(p)}%`;
const $ = (sel) => document.querySelector(sel);

/* --- Theme toggle (persisted, drives Bootstrap's data-bs-theme) ------------ */
const root = document.documentElement;
const themeBtn = $('#theme');
const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('tabar-theme');
root.setAttribute('data-bs-theme', savedTheme || (prefersDark() ? 'dark' : 'light'));
const reflectTheme = () => themeBtn?.setAttribute('aria-pressed', String(root.getAttribute('data-bs-theme') === 'dark'));
reflectTheme();
themeBtn?.addEventListener('click', () => {
  const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-bs-theme', next);
  localStorage.setItem('tabar-theme', next);
  reflectTheme();
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

/* =========================================================================
 * Configurator — a single live bar driven by the whole option surface.
 * Controls are generated from a declarative schema so every option is wired
 * the same way; the matching `new Tabar({…})` snippet is regenerated on change.
 * ====================================================================== */
const CFG_SCHEMA = [
  { group: 'Shape & geometry', controls: [
    { key: 'shape', label: 'Shape', type: 'select', options: ['linear', 'circular'] },
    { key: 'direction', label: 'Direction', type: 'select', options: ['ltr', 'rtl'] },
    { key: 'height', label: 'Height (px)', type: 'number', min: 1, max: 64, step: 1 },
    { key: 'size', label: 'Circular size (px)', type: 'number', min: 24, max: 200, step: 2 },
    { key: 'radius', label: 'Radius (px)', type: 'number', min: 0, max: 9999, step: 1 },
    { key: 'innerRadius', label: 'Inner radius (px)', type: 'number', min: 0, max: 9999, step: 1 },
  ] },
  { group: 'Border (linear)', controls: [
    { key: 'borderWidth', label: 'Width', type: 'range', min: 0, max: 12, step: 1, unit: 'px' },
    { key: 'borderStyle', label: 'Style', type: 'select', options: ['solid', 'dashed', 'dotted', 'double', 'none'] },
    { key: 'borderColor', label: 'Color (CSS)', type: 'text', placeholder: 'faint neutral' },
  ] },
  { group: 'Color & theme', controls: [
    { key: 'theme', label: 'Theme', type: 'select', options: ['default', 'gradient', 'rainbow', 'stripes', 'glow', 'minimal'] },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'color2', label: 'Color 2 (gradient)', type: 'color' },
    { key: 'background', label: 'Track background (CSS)', type: 'text', placeholder: 'e.g. #eee / transparent' },
    { key: 'glow', label: 'Glow', type: 'bool' },
    { key: 'glowColor', label: 'Glow color (CSS)', type: 'text', placeholder: 'defaults to color' },
    { key: 'glowSize', label: 'Glow size', type: 'range', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'striped', label: 'Striped', type: 'bool' },
    { key: 'stripeAnimate', label: 'Animate stripes', type: 'bool' },
  ] },
  { group: 'Colors & gradient', controls: [
    { key: 'colorMode', label: 'Color mode', type: 'select', options: ['gradient', 'bands'] },
    { key: 'colorAnimate', label: 'Animate colors', type: 'bool' },
    { key: 'gradientType', label: 'Type', type: 'select', options: ['linear', 'radial', 'conic', 'repeating-linear', 'repeating-radial', 'repeating-conic'] },
    { key: 'gradientAngle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, unit: '°' },
    { key: 'gradientShape', label: 'Shape (radial)', type: 'text', placeholder: 'circle / ellipse' },
    { key: 'gradientPosition', label: 'Position', type: 'text', placeholder: 'center / 50% 50%' },
    { key: 'fill', label: 'Explicit fill (CSS)', type: 'text', placeholder: 'any CSS background' },
  ] },
  { group: 'Circular ring', controls: [
    { key: 'trackColor', label: 'Track color (CSS)', type: 'text', placeholder: 'faint default' },
    { key: 'lineCap', label: 'Line cap', type: 'select', options: ['round', 'butt', 'square'] },
    { key: 'startAngle', label: 'Start angle', type: 'range', min: -180, max: 180, step: 5, unit: '°' },
    { key: 'clockwise', label: 'Clockwise', type: 'bool' },
  ] },
  { group: 'Progress & timing', controls: [
    { key: 'value', label: 'Value', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
    { key: 'max', label: 'Max', type: 'number', min: 1, max: 1000, step: 1 },
    { key: 'minimum', label: 'Minimum (start floor)', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'speed', label: 'Speed (ms)', type: 'range', min: 0, max: 1200, step: 20 },
    { key: 'trickle', label: 'Trickle', type: 'bool' },
    { key: 'trickleSpeed', label: 'Trickle speed (ms)', type: 'number', min: 50, max: 2000, step: 10 },
  ] },
  { group: 'Labels & messages', controls: [
    { key: 'showLabel', label: 'Show label', type: 'bool' },
    { key: 'labelPct', label: 'Label shows %', type: 'bool' },
    { key: 'label', label: 'Static label', type: 'text' },
    { key: 'tooltip', label: 'Tooltip', type: 'select', options: ['off', 'live', 'custom'] },
    { key: 'tooltipAlways', label: 'Tooltip always', type: 'bool' },
    { key: 'message', label: 'Inline message', type: 'text' },
    { key: 'messageAlign', label: 'Message align', type: 'select', options: ['start', 'center', 'end'] },
    { key: 'messageColor', label: 'Message color (CSS)', type: 'text', placeholder: 'defaults to white' },
  ] },
  { group: 'Behavior', controls: [
    { key: 'autoShow', label: 'Auto show', type: 'bool' },
    { key: 'autoHide', label: 'Auto hide', type: 'bool' },
    { key: 'autoHideDelay', label: 'Auto-hide delay (ms)', type: 'number', min: 0, max: 3000, step: 50 },
    { key: 'announce', label: 'Announce (aria-live)', type: 'bool' },
    { key: 'stallTimeout', label: 'Stall timeout (ms)', type: 'number', min: 0, max: 10000, step: 100 },
    { key: 'errorTimeout', label: 'Error timeout (ms)', type: 'number', min: 0, max: 10000, step: 100 },
  ] },
  { group: 'Segments', controls: [
    { key: 'segmentsOn', label: 'Segment mode', type: 'bool' },
    { key: 'segmentMode', label: 'Layout', type: 'select', options: ['stacked', 'overlay'] },
  ] },
  { group: 'i18n & a11y', controls: [
    { key: 'locale', label: 'Locale', type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar'] },
    { key: 'ariaLabel', label: 'Aria label', type: 'text' },
  ] },
  { group: 'Persistence', controls: [
    { key: 'persistOn', label: 'Persist', type: 'bool' },
    { key: 'persistStorage', label: 'Storage', type: 'select', options: ['local', 'session'] },
  ] },
];

// Starting values for the configurator (a sensible, good-looking default bar).
const cfgState = {
  shape: 'linear', direction: 'ltr', height: 18, size: 96, radius: 9, innerRadius: 0,
  borderWidth: 0, borderStyle: 'solid', borderColor: '',
  theme: 'gradient', color: '#2299dd', color2: '#7c4dff', background: '', glow: false,
  glowColor: '', glowSize: 8, striped: false, stripeAnimate: true,
  colorMode: 'gradient', colorAnimate: false,
  gradientType: 'linear', gradientAngle: 90, gradientShape: '', gradientPosition: '', fill: '',
  trackColor: '', lineCap: 'round', startAngle: -90, clockwise: true,
  value: 62, max: 100, minimum: 0.08, speed: 300, trickle: false, trickleSpeed: 200,
  showLabel: true, labelPct: true, label: '', tooltip: 'off', tooltipAlways: false,
  message: '', messageAlign: 'center', messageColor: '',
  autoShow: true, autoHide: false, autoHideDelay: 350, announce: true,
  stallTimeout: 0, errorTimeout: 0,
  segmentsOn: false, segmentMode: 'stacked',
  locale: 'en', ariaLabel: '',
  persistOn: false, persistStorage: 'local',
  // Dynamic multi-color stops (managed by the colors editor below, not the schema).
  // Seeded with 3 so 'bands' mode has its recommended minimum out of the box.
  colorsList: ['#2299dd', '#7c4dff', '#30d158'],
};

// Translate the flat configurator state into Tabar construction options.
function cfgToOptions(s) {
  const o = { position: 'inline', mountTo: '#cfg-host', shape: s.shape, height: Number(s.height), trickle: !!s.trickle };
  if (s.shape === 'circular') o.size = Number(s.size);
  if (s.direction === 'rtl') o.direction = 'rtl';
  if (Number(s.radius)) o.radius = Number(s.radius);
  if (Number(s.innerRadius)) o.innerRadius = Number(s.innerRadius);
  if (Number(s.borderWidth)) {
    o.borderWidth = Number(s.borderWidth);
    if (s.borderStyle !== 'solid') o.borderStyle = s.borderStyle;
    if (s.borderColor) o.borderColor = s.borderColor;
  }
  if (s.theme !== 'default') o.theme = s.theme;
  o.color = s.color;
  if (s.theme === 'gradient') o.color2 = s.color2;
  if (s.background) o.background = s.background;
  if (s.glow) o.glow = true;
  if (s.glowColor) o.glowColor = s.glowColor;
  if (Number(s.glowSize) !== 8) o.glowSize = Number(s.glowSize);
  if (s.striped) o.striped = true;
  if (!s.stripeAnimate) o.stripeAnimate = false;

  if (Array.isArray(s.colorsList) && s.colorsList.length >= 2) o.colors = [...s.colorsList];
  if (s.colorMode === 'bands') o.colorMode = 'bands';
  if (s.colorAnimate) o.colorAnimate = true;
  if (s.gradientType !== 'linear') o.gradientType = s.gradientType;
  if (Number(s.gradientAngle) !== 90) o.gradientAngle = Number(s.gradientAngle);
  if (s.gradientShape) o.gradientShape = s.gradientShape;
  if (s.gradientPosition) o.gradientPosition = s.gradientPosition;
  if (s.fill) o.fill = s.fill;

  // Circular ring options.
  if (s.trackColor) o.trackColor = s.trackColor;
  if (s.lineCap !== 'round') o.lineCap = s.lineCap;
  if (Number(s.startAngle) !== -90) o.startAngle = Number(s.startAngle);
  if (s.clockwise === false) o.clockwise = false;

  if (Number(s.max) !== 100) o.max = Number(s.max);
  if (Number(s.minimum) !== 0.08) o.minimum = Number(s.minimum);
  if (Number(s.speed) !== 300) o.speed = Number(s.speed);
  if (Number(s.trickleSpeed) !== 200) o.trickleSpeed = Number(s.trickleSpeed);

  if (s.showLabel) o.showLabel = true;
  if (s.label) o.label = s.label;
  if (s.labelPct) o.labelFormat = pct;
  if (s.tooltip === 'live') o.tooltip = true;
  else if (s.tooltip === 'custom') o.tooltip = 'Custom tip';
  if (s.tooltipAlways) o.tooltipAlways = true;
  if (s.message) o.messages = { default: s.message };
  if (s.messageAlign !== 'center') o.messageAlign = s.messageAlign;
  if (s.messageColor) o.messageColor = s.messageColor;

  if (!s.autoShow) o.autoShow = false;
  if (s.autoHide) o.autoHide = true;
  if (Number(s.autoHideDelay) !== 350) o.autoHideDelay = Number(s.autoHideDelay);
  if (!s.announce) o.announce = false;
  if (Number(s.stallTimeout)) o.stallTimeout = Number(s.stallTimeout);
  if (Number(s.errorTimeout)) o.errorTimeout = Number(s.errorTimeout);

  if (s.segmentsOn) o.segmentMode = s.segmentMode;
  if (s.locale !== 'en') o.locale = s.locale;
  if (s.ariaLabel) o.ariaLabel = s.ariaLabel;
  if (s.persistOn) o.persist = { storage: s.persistStorage, key: 'cfg-preview', debounce: 0 };
  return o;
}

const CFG_SEGMENTS = [
  { id: 'a', value: 1, color: '#2299dd', weight: 1 },
  { id: 'b', value: 0.7, color: '#30d158', weight: 2 },
  { id: 'c', value: 0.35, color: '#ff9f0a', weight: 3 },
];

function cfgToCode(o) {
  const fmt = (k, v) => {
    if (k === 'labelFormat') return '(p) => `${Math.round(p)}%`';
    if (Array.isArray(v)) return `[${v.map((x) => `'${x}'`).join(', ')}]`;
    if (v && typeof v === 'object') return JSON.stringify(v);
    if (typeof v === 'string') return `'${v}'`;
    return String(v);
  };
  const lines = Object.entries(o).map(([k, v]) => `  ${k}: ${fmt(k, v)},`);
  return `new Tabar({\n${lines.join('\n')}\n});`;
}

let preview = null;
const cfgCode = $('#cfg-code');
const cfgHost = $('#cfg-host');
function cfgRebuild() {
  if (preview) preview.destroy();
  // Size the preview host so the bar fills it exactly (no leftover track strip):
  // a linear track equals the configured thickness; a ring drops the track box.
  if (cfgHost) {
    if (cfgState.shape === 'circular') {
      cfgHost.classList.add('cfg-host--ring');
      cfgHost.style.height = 'auto';
    } else {
      cfgHost.classList.remove('cfg-host--ring');
      cfgHost.style.height = `${Number(cfgState.height)}px`;
    }
  }
  const opts = cfgToOptions(cfgState);
  preview = new Tabar(opts);
  preview.retryWith((bar) => bar.set(0.75));
  if (cfgState.segmentsOn) {
    preview.setSegments(CFG_SEGMENTS.map((c) => ({ ...c })));
  } else {
    preview.set(Number(cfgState.value) / 100, { animate: false });
  }
  preview.show();
  if (cfgCode) cfgCode.textContent = cfgToCode(opts);
}

// Render one control from a schema descriptor (Bootstrap/Webpixels form classes).
function cfgControl(c) {
  const wrap = document.createElement('div');
  wrap.className = 'cfg-field';
  const val = cfgState[c.key];

  if (c.type === 'bool') {
    const check = document.createElement('div');
    check.className = 'form-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'form-check-input';
    input.checked = !!val;
    input.id = `cfg-${c.key}`;
    input.dataset.cfg = c.key;
    input.setAttribute('data-testid', `cfg-${c.key}`);
    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.setAttribute('for', `cfg-${c.key}`);
    label.textContent = c.label;
    check.append(input, label);
    wrap.appendChild(check);
    return wrap;
  }

  const label = document.createElement('label');
  label.className = 'form-label';
  label.setAttribute('for', `cfg-${c.key}`);
  label.textContent = c.label;
  let out;
  if (c.type === 'range') {
    out = document.createElement('output');
    out.textContent = `${val}${c.unit || ''}`;
    label.append(' ', out);
  }
  wrap.appendChild(label);

  let input;
  if (c.type === 'select') {
    input = document.createElement('select');
    input.className = 'form-select form-select-sm';
    for (const opt of c.options) {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt;
      if (String(opt) === String(val)) o.selected = true;
      input.appendChild(o);
    }
  } else {
    input = document.createElement('input');
    input.type = c.type === 'range' ? 'range' : c.type === 'number' ? 'number' : c.type === 'color' ? 'color' : 'text';
    input.className =
      c.type === 'range' ? 'form-range'
      : c.type === 'color' ? 'form-control form-control-color'
      : 'form-control form-control-sm';
    if (c.min != null) input.min = c.min;
    if (c.max != null) input.max = c.max;
    if (c.step != null) input.step = c.step;
    if (c.placeholder) input.placeholder = c.placeholder;
    input.value = val;
  }
  input.id = `cfg-${c.key}`;
  input.dataset.cfg = c.key;
  input.setAttribute('data-testid', `cfg-${c.key}`);
  if (c.unit && out) input._out = out;
  wrap.appendChild(input);
  return wrap;
}

const cfgControlsEl = $('#cfg-controls');
if (cfgControlsEl) {
  for (const section of CFG_SCHEMA) {
    const fs = document.createElement('fieldset');
    fs.className = 'cfg-fieldset border rounded p-3 mb-3';
    const legend = document.createElement('legend');
    legend.className = 'float-none w-auto px-2 small fw-semibold text-muted';
    legend.textContent = section.group;
    fs.appendChild(legend);
    const grid = document.createElement('div');
    grid.className = 'cfg-fieldset__grid';
    section.controls.forEach((c) => grid.appendChild(cfgControl(c)));
    fs.appendChild(grid);
    cfgControlsEl.appendChild(fs);
  }

  // Dynamic multi-color stop editor → cfgState.colorsList → the `colors` option.
  const PALETTE = ['#2299dd', '#7c4dff', '#30d158', '#ff9f0a', '#e5484d', '#64d2ff'];
  const colorsFs = document.createElement('fieldset');
  colorsFs.className = 'cfg-fieldset border rounded p-3 mb-3';
  const MIN_COLORS = 3; // bands need at least three distinct blocks
  const colorsLegend = document.createElement('legend');
  colorsLegend.className = 'float-none w-auto px-2 small fw-semibold text-muted';
  colorsLegend.textContent = 'Colors (multi-stop — 3+ for bands)';
  const colorsWrap = document.createElement('div');
  colorsWrap.className = 'cfg-colors';
  colorsWrap.setAttribute('data-testid', 'cfg-colors');
  colorsFs.append(colorsLegend, colorsWrap);
  cfgControlsEl.appendChild(colorsFs);

  const renderColorsEditor = () => {
    colorsWrap.textContent = '';
    cfgState.colorsList.forEach((hex, i) => {
      const item = document.createElement('div');
      item.className = 'cfg-colors__item';
      const input = document.createElement('input');
      input.type = 'color';
      input.className = 'form-control form-control-color';
      input.value = hex;
      input.setAttribute('data-testid', `cfg-color-${i}`);
      input.addEventListener('input', () => { cfgState.colorsList[i] = input.value; cfgRebuild(); });
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn-sm btn-neutral';
      rm.textContent = '×';
      rm.setAttribute('aria-label', `Remove color ${i + 1}`);
      rm.disabled = cfgState.colorsList.length <= MIN_COLORS; // keep the 3-color minimum
      rm.addEventListener('click', () => {
        if (cfgState.colorsList.length <= MIN_COLORS) return;
        cfgState.colorsList.splice(i, 1);
        renderColorsEditor();
        cfgRebuild();
      });
      item.append(input, rm);
      colorsWrap.appendChild(item);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn btn-sm btn-neutral';
    add.textContent = '+ Add color';
    add.setAttribute('data-testid', 'cfg-color-add');
    add.addEventListener('click', () => {
      cfgState.colorsList.push(PALETTE[cfgState.colorsList.length % PALETTE.length]);
      renderColorsEditor();
      cfgRebuild();
    });
    colorsWrap.appendChild(add);
  };
  renderColorsEditor();

  const onCfgInput = (e) => {
    const key = e.target.dataset.cfg;
    if (!key) return;
    const isBool = e.target.type === 'checkbox';
    cfgState[key] = isBool ? e.target.checked : e.target.value;
    const out = e.target._out;
    const desc = CFG_SCHEMA.flatMap((s) => s.controls).find((c) => c.key === key);
    if (out && desc) out.textContent = `${e.target.value}${desc.unit || ''}`;
    cfgRebuild();
  };
  cfgControlsEl.addEventListener('input', onCfgInput);
  cfgControlsEl.addEventListener('change', onCfgInput);
  cfgRebuild();
}

/* --- Basics: top bar ------------------------------------------------------ */
const page = new Tabar({ id: 'page', color: 'var(--x-primary)', height: 4, trickleSpeed: 240 });

/* --- Inline + swatches + slider ------------------------------------------- */
const inline = new Tabar({
  id: 'inline', position: 'inline', mountTo: '#inline-host', height: '100%', radius: 8,
  color: '#1abc9c', trickle: false, showLabel: true, labelFormat: pct, value: 0.4,
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

/* --- Positions: spawn a fixed overlay bar that clears itself -------------- */
let posBar = null;
const posLengthEl = $('#pos-length');
const spawnPosition = (position) => {
  if (posBar) posBar.destroy();
  const vertical = position.startsWith('left') || position.startsWith('right');
  const length = posLengthEl ? posLengthEl.value : '100%';
  posBar = new Tabar({ position, length, height: vertical ? 6 : 6, radius: 4, color: 'var(--x-primary)', trickle: false });
  posBar.set(0.8);
  setTimeout(() => { posBar?.done(); }, 1600);
};

/* --- Themes + gradient editor --------------------------------------------- */
const themed = new Tabar({
  id: 'themed', position: 'inline', mountTo: '#theme-host', height: '100%', radius: 10,
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
  id: 'xfer', position: 'inline', mountTo: '#xfer-host', height: '100%', radius: 10, trickle: false,
  color: '#2299dd', messageAlign: 'start',
  // Inline status text driven by the live transfer stats + state.
  messages: {
    active: (p, bar) => {
      const s = bar.stats;
      return s.speed > 0 && p < 100
        ? `${pct(p)} · ${Tabar.formatBytes(s.speed)}/s · ${Tabar.formatDuration(s.eta)} left`
        : `Downloading… ${pct(p)}`;
    },
    indeterminate: 'Connecting…',
    done: 'Download complete',
    error: 'Download failed — click Reset',
    default: (p) => `${pct(p)}`,
  },
});
let xferTimer = null;
let xferLoaded = 0;
let xferChunk = 900 * 1024;
const stopXfer = () => { if (xferTimer) { clearInterval(xferTimer); xferTimer = null; } };

// Build a streaming Response so trackResponse() can be demonstrated offline.
const fakeDownload = (total, chunk) => {
  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= total) { controller.close(); return; }
      const n = Math.min(chunk, total - sent);
      sent += n;
      controller.enqueue(new Uint8Array(n));
      return new Promise((r) => setTimeout(r, 90));
    },
  });
  return new Response(stream, { headers: { 'Content-Length': String(total) } });
};

/* --- Reactivity ----------------------------------------------------------- */
const react = new Tabar({
  id: 'react', position: 'inline', mountTo: '#react-host', height: '100%', radius: 10,
  color: '#9b59b6', trickle: false, showLabel: true, labelFormat: pct,
});
const reactSlider = $('#react-slider');
const reactVal = $('#react-val');
react.bind(() => Number(reactSlider.value) / 100, { event: 'input', target: reactSlider });
reactSlider.addEventListener('input', () => { reactVal.textContent = `${reactSlider.value}%`; });

/* --- JSON config ---------------------------------------------------------- */
const jsonBar = new Tabar({ id: 'json', position: 'inline', mountTo: '#json-host', height: '100%', radius: 8, trickle: false, value: 0.3 });
const jsonEl = $('#json-config');
const jsonStatus = $('#json-status');
jsonEl.value = JSON.stringify({ color: '#e91e63', height: 16, radius: 9999, theme: 'gradient', color2: '#7c4dff', value: 0.55 }, null, 2);

/* --- Segments ------------------------------------------------------------- */
const segChunks = [
  { id: 'fonts', value: 1, color: '#2299dd', weight: 1 },
  { id: 'images', value: 0.4, color: '#30d158', weight: 3 },
  { id: 'video', value: 0, color: '#ff9f0a', weight: 6 },
];
const SEG_PALETTE = ['#5e5ce6', '#ff375f', '#64d2ff', '#bf5af2', '#ffd60a'];
let segExtra = 0;
const segStacked = new Tabar({ position: 'inline', mountTo: '#seg-stacked', height: '100%', radius: 8 });
segStacked.setSegments(segChunks.map((c) => ({ ...c })));
const segOverlay = new Tabar({ position: 'inline', mountTo: '#seg-overlay', height: '100%', radius: 8, segmentMode: 'overlay' });
segOverlay.setSegments([{ id: 'buffered', value: 0.8, color: '#c7c7cc' }, { id: 'played', value: 0.35, color: '#2299dd' }]);

/* --- Group ---------------------------------------------------------------- */
const group = new TabarGroup({ mountTo: '#group-host' });
let groupN = 0;
const groupTimers = new Set();
const addGroupChild = () => {
  const bar = group.add({ label: `file-${(groupN += 1)}.zip`, height: 14, radius: 7 });
  const total = 1e6 + Math.random() * 4e6;
  let loaded = 0;
  const t = setInterval(() => {
    loaded = Math.min(total, loaded + total * (0.04 + Math.random() * 0.06));
    bar.setProgress(loaded, total);
    if (loaded >= total) { clearInterval(t); groupTimers.delete(t); bar.done(true); }
  }, 220);
  groupTimers.add(t);
};
addGroupChild();
addGroupChild();

/* --- Feedback ------------------------------------------------------------- */
const feedbackHost = $('#feedback-host');
const feedback = new Tabar({
  id: 'feedback', position: 'inline', mountTo: '#feedback-host', height: '100%', radius: 8, trickle: false,
  // Inline message that reflects the state/status.
  messages: {
    warning: 'Slow connection',
    error: 'Upload failed',
    success: 'Verified ✓',
    done: 'Complete',
    default: (p) => `${pct(p)}`,
  },
});
feedback.set(0.45, { animate: false });
feedback.retryWith(() => feedback.set(0.7));
const fbAttempts = $('#fb-attempts');
feedback.on('retry', (n) => { fbAttempts.textContent = String(n); });
// State colors are CSS custom properties — set them on the host so they cascade in.
const bindStateColor = (id, prop) => {
  const el = $(id);
  el?.addEventListener('input', () => feedbackHost.style.setProperty(prop, el.value));
};
bindStateColor('#fb-error-color', '--tabar-error');
bindStateColor('#fb-warning-color', '--tabar-warning');
bindStateColor('#fb-success-color', '--tabar-success');

/* --- Concurrency ---------------------------------------------------------- */
const conc = ['#2299dd', '#30d158', '#ff9f0a'].map((c, i) =>
  new Tabar({ position: 'inline', mountTo: `#c${i + 1}`, height: '100%', radius: 6, color: c, trickle: false }),
);

/* --- Persistence ---------------------------------------------------------- */
let persist = new Tabar({ id: 'persist', position: 'inline', mountTo: '#persist-host', height: '100%', radius: 8, trickle: false, color: '#e67e22', persist: { storage: 'local', debounce: 0 } });
const persistStorageEl = $('#persist-storage');
persistStorageEl?.addEventListener('change', () => {
  persist.destroy();
  persist = new Tabar({ id: 'persist', position: 'inline', mountTo: '#persist-host', height: '100%', radius: 8, trickle: false, color: '#e67e22', persist: { storage: persistStorageEl.value, debounce: 0 } });
});

/* --- Actions -------------------------------------------------------------- */
const actions = {
  // Configurator
  'cfg-start': () => preview?.start(),
  'cfg-inc': () => preview?.inc(),
  'cfg-set': () => preview?.set(0.5),
  'cfg-done': () => preview?.done(),
  'cfg-reset': () => preview?.reset(),
  'cfg-ind': () => preview?.indeterminate(true),
  'cfg-error': () => preview?.error('error'),
  'cfg-warn': () => preview?.warn('warning'),
  'cfg-succeed': () => preview?.succeed('done'),
  'cfg-retry': () => preview?.retry(),
  'cfg-show': () => preview?.show(),
  'cfg-hide': () => preview?.hide(),
  'cfg-rebuild': () => cfgRebuild(),
  'cfg-copy': () => navigator.clipboard?.writeText(cfgCode.textContent).catch(() => {}),
  // Basics
  'top-start': () => page.start(),
  'top-inc': () => page.inc(),
  'top-done': () => page.done(),
  'top-ind': () => page.indeterminate(true),
  'ring-go': () => rings.forEach((r) => r.set(Math.random() * 0.8 + 0.2)),
  'ring-ind': () => rings.forEach((r) => r.indeterminate(true)),
  'ring-reset': () => rings.forEach((r) => r.set(0, { animate: false })),
  'pos-top': () => spawnPosition('top'),
  'pos-bottom': () => spawnPosition('bottom'),
  'pos-left': () => spawnPosition('left'),
  'pos-right': () => spawnPosition('right'),
  'pos-top-center': () => spawnPosition('top-center'),
  'pos-bottom-center': () => spawnPosition('bottom-center'),
  'pos-left-center': () => spawnPosition('left-center'),
  'pos-right-center': () => spawnPosition('right-center'),
  'xfer-start': () => {
    stopXfer(); xfer.reset(); xfer.show(); xferLoaded = 0; xferChunk = 900 * 1024;
    xferTimer = setInterval(() => {
      xferLoaded = Math.min(XFER_TOTAL, xferLoaded + xferChunk * (0.5 + Math.random()));
      xfer.setProgress(xferLoaded, XFER_TOTAL);
      if (xferLoaded >= XFER_TOTAL) stopXfer();
    }, 120);
  },
  'xfer-stall': () => { xferChunk = xferChunk > 300 * 1024 ? 120 * 1024 : 900 * 1024; },
  'xfer-fetch': async () => {
    stopXfer(); xfer.reset(); xfer.show();
    const res = xfer.trackResponse(fakeDownload(8 * 1024 * 1024, 256 * 1024));
    await res.arrayBuffer().catch(() => {});
  },
  'xfer-fail': () => { stopXfer(); xfer.error('network error'); },
  'xfer-reset': () => { stopXfer(); xfer.reset(); xfer.show(); },
  'json-apply': () => {
    // Validate explicitly — configure() silently ignores malformed strings, so
    // we parse here to give real feedback on bad input.
    try {
      const parsed = JSON.parse(jsonEl.value);
      jsonBar.configure(parsed);
      if (jsonStatus) { jsonStatus.textContent = 'Applied ✓'; jsonStatus.style.color = 'var(--x-primary)'; }
    } catch (err) {
      if (jsonStatus) { jsonStatus.textContent = `Invalid config: ${err.message}`; jsonStatus.style.color = '#e5484d'; }
    }
  },
  'seg-advance': () => {
    // Operate on the bar's LIVE segments (values are 0–100), so this works for
    // any number of chunks — including ones added via "Add segment".
    const segs = segStacked.segments;
    if (!segs.length) return;
    const next = segs.find((s) => s.value < 100) || segs[0];
    segStacked.updateSegment(next.id, { value: Math.min(100, next.value + 25) });
  },
  'seg-add': () => {
    const id = `extra-${(segExtra += 1)}`;
    segStacked.addSegment({ id, value: Math.random() * 0.7 + 0.2, color: SEG_PALETTE[segExtra % SEG_PALETTE.length], weight: 2 });
  },
  'seg-remove': () => {
    const segs = segStacked.segments;
    if (segs.length) segStacked.removeSegment(segs[segs.length - 1].id);
  },
  'group-add': addGroupChild,
  'group-clear': () => { groupTimers.forEach(clearInterval); groupTimers.clear(); group.children.forEach((c) => group.remove(c.id)); groupN = 0; },
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
