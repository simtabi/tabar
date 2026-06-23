/**
 * Tabar — a dependency-free, framework-agnostic progress bar.
 *
 * Run any number of instances concurrently in any position. Theme each one
 * through CSS custom properties and `data-*-tabar` attributes.
 *
 * @license MIT
 * @see https://opensource.simtabi.com/documentation/tabar
 */

// Compiled from src/tabar.scss by `npm run styles`.
import { BASE_CSS } from './styles.js';
// Shared declarative-config plumbing (also used by the <tabar-bar> element).
import { readDataAttrs } from './attrs.js';

/* -- Constants ------------------------------------------------------------- */

// Library version. The build replaces __TABAR_VERSION__ with package.json's
// version; the fallback applies when running the source directly (tests/demo).
const VERSION = typeof __TABAR_VERSION__ === 'string' ? __TABAR_VERSION__ : '0.5.0';

// Persisted-state schema version. Stored entries with a different value are dropped.
const SCHEMA_VERSION = 1;

/** Id of the single, shared, static base stylesheet. */
const BASE_STYLE_ID = 'tabar-base';

/** Monotonic counter used to mint unique instance ids. */
let uid = 0;

/** Ref-count for the shared base stylesheet so it is removed with the last bar. */
let styleRefCount = 0;

/** Default configuration. Every key here is a public, documented option. */
const DEFAULTS = Object.freeze({
  id: null, // auto-generated when null
  classPrefix: 'tabar', // sanitized to [A-Za-z0-9_-]
  mountTo: null, // CSS selector or Element; defaults to <body> for fixed bars
  shape: 'linear', // 'linear' | 'circular'
  size: 64, // circular diameter in px (ignored for linear bars)
  // 'top'|'bottom'|'left'|'right'|'inline' plus the centered edge variants
  // 'top-center'|'bottom-center'|'left-center'|'right-center'.
  position: 'top',
  length: '100%', // length of a fixed bar along its edge (number → px, string passthrough)
  offset: 0, // inset (px) from the docked edge for fixed bars
  direction: 'ltr', // 'ltr' | 'rtl' (horizontal bars only)

  // Circular-only geometry/appearance.
  trackColor: null, // circular track ring color (defaults to a faint neutral)
  lineCap: 'round', // circular arc stroke-linecap: 'round' | 'butt' | 'square'
  startAngle: -90, // circular arc start angle in deg (-90 = 12 o'clock)
  clockwise: true, // circular sweep direction (false = counter-clockwise)

  color: '#29d', // bar fill (solid)
  color2: '#7c4dff', // secondary color used by the 'gradient' theme
  background: 'transparent', // track background
  height: 3, // px — bar thickness (height for horizontal, width for vertical)
  radius: 0, // outer radius: number | [tl,tr,bl,br] | {topLeft,...}
  innerRadius: 0, // bar radius: same shapes as `radius`
  speed: 300, // transition duration in ms
  zIndex: 1031,

  theme: 'default', // 'default' | 'gradient' | 'rainbow' | 'stripes' | 'glow' | 'minimal'
  colors: null, // multi-color stops: ['#f00','#0f0','#00f'] or [{color,at}] (alias for `gradient`)
  colorMode: 'gradient', // 'gradient' (blended) | 'bands' (hard, non-interpolated color blocks)
  colorAnimate: false, // animate the multicolor fill (scrolling, like the rainbow theme)
  gradient: null, // color stops -> a gradient fill: ['#f00','#00f'] or [{color,at}]
  gradientType: 'linear', // linear|radial|conic|repeating-linear|repeating-radial|repeating-conic
  gradientAngle: null, // angle (linear/conic) in deg; auto by orientation when null
  gradientShape: null, // radial shape/size, e.g. 'circle' | 'ellipse' | 'circle 40px'
  gradientPosition: null, // radial/conic center, e.g. 'center' | '50% 50%' | 'left top'
  fill: null, // explicit CSS background for the bar (escape hatch; wins over gradient)
  glow: false, // soft glow around the bar (composes with any theme)
  glowColor: null, // glow color; defaults to the bar color when null
  glowSize: 8, // glow radius in px (how far the halo bleeds onto surroundings)
  striped: false, // diagonal stripe overlay
  stripeAnimate: true, // animate the stripes when striped
  value: null, // initial value to show on construct (fraction or absolute)

  segments: null, // [{ id?, value, color?, label?, weight?, status? }] -> multi-progress bar
  segmentMode: 'stacked', // 'stacked' (chunks tile the bar) | 'overlay' (layered, e.g. buffered/played)
  aggregate: null, // 'weighted'|'sum'|'avg'|'max'|'primary'; default by mode (stacked=weighted, overlay=primary)

  max: 100, // value scale; `set(max)` === 100%
  minimum: 0.08, // floor (fraction) applied by start()
  trickle: true, // auto-increment while pending
  trickleSpeed: 200, // ms between trickle ticks

  showLabel: false,
  label: '', // static label text
  labelFormat: null, // (percent, bar) => string — live label, updated on every change
  autoShow: true, // show the bar automatically when its value goes above 0

  // Inline status messages shown ON the bar, keyed by state. Each value is a
  // string or (percent, bar) => string; `default` covers states without a key.
  // e.g. { active: 'Uploading…', error: 'Failed', done: 'Complete', default: p => `${p|0}%` }
  messages: null,
  messageAlign: 'center', // 'start' | 'center' | 'end'
  messageColor: null, // CSS color for the inline message (defaults to white + shadow)

  tooltip: false, // false | true | string | (percent, bar) => string
  tooltipAlways: false, // keep the tooltip visible instead of showing it on hover/focus

  autoHide: true, // hide + reset after done()
  autoHideDelay: 350, // ms to linger at 100% before hiding

  announce: true, // announce state changes to screen readers via a shared aria-live region
  stallTimeout: 0, // ms with no progress while active -> 'stall' event + warning state (0 = off)
  errorTimeout: 0, // ms after which an error auto-clears (0 = off)

  locale: null, // override the global Tabar.locale for this instance
  ariaLabel: null, // accessible name; defaults to the locale's "progress" string
  ariaLabelledBy: null,

  persist: false, // false | true | { key, storage, mode, ttl, debounce, keepOnDone }

  configUrl: null, // GET a JSON config from this URL on construct
  reportUrl: null, // POST { id, value, state } to this URL
  reportOn: null, // events that trigger a report (default: ['change','done'])
  fetchOptions: null, // extra options forwarded to fetch() for config/report

  debug: false, // log lifecycle to the console (also via Tabar.debug for all bars)

  // Lifecycle callbacks. Each maps to an event of the same name (see .on()).
  onStart: null,
  onChange: null,
  onDone: null,
  onReset: null,
  onResume: null,
  onShow: null,
  onHide: null,
  onIndeterminate: null,
  onTheme: null,
  onDestroy: null,
  onConfig: null,
  onReport: null,
  onProgress: null,
  onError: null,
  onWarning: null,
  onSuccess: null,
  onStall: null,
  onRetry: null, // fired when retry() runs (the retry HANDLER is set via retryWith()/{retry})
});

/** Events Tabar emits. Each has a matching `on<Name>` option callback. */
const EVENTS = Object.freeze([
  'start',
  'change',
  'done',
  'reset',
  'resume',
  'show',
  'hide',
  'indeterminate',
  'theme',
  'destroy',
  'config',
  'report',
  'progress',
  'error',
  'warning',
  'success',
  'retry',
  'stall',
]);

/* --------------------------------------------------------------------------
 * Small utilities
 * ------------------------------------------------------------------------ */

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const toNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

/** Restrict a string to characters safe inside a class name / attribute / selector. */
const sanitizeIdent = (value, fallback) => {
  const cleaned = String(value == null ? '' : value).replace(/[^A-Za-z0-9_-]/g, '');
  return cleaned || fallback;
};

const prefersReducedMotion = () =>
  isBrowser &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Every recognized `position` value. Unknown input falls back to 'top'. */
const POSITIONS = new Set([
  'top', 'bottom', 'left', 'right', 'inline',
  'top-center', 'bottom-center', 'left-center', 'right-center',
]);

/** Positions whose bar fills along the vertical axis. */
const VERTICAL_POSITIONS = new Set(['left', 'right', 'left-center', 'right-center']);

/** Coerce a `length`-style value: a number → `${n}px`, a string passes through. */
const toLength = (v) => {
  if (v == null || v === '') return '100%';
  if (typeof v === 'number') return Number.isFinite(v) ? `${Math.max(0, v)}px` : '100%';
  return String(v);
};

/** Restrict a circular `stroke-linecap` to the valid SVG values. */
const toLinecap = (v) => (v === 'butt' || v === 'square' ? v : 'round');

/** Resolve a `mountTo` (element or selector) to an Element, or null. */
const resolveMountEl = (mountTo) => {
  if (mountTo instanceof Element) return mountTo;
  if (typeof mountTo === 'string' && mountTo) return document.querySelector(mountTo);
  return null;
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* -- Localization ---------------------------------------------------------- */

// Built-in strings; extend with Tabar.addLocale(code, {...}) and switch via Tabar.locale.
// `rtl: true` marks right-to-left locales (mirrors fills + circular sweep).
const KB = ['B', 'KB', 'MB', 'GB', 'TB'];
const locales = {
  en: { bytes: KB, hour: 'h', min: 'm', sec: 's', lessThan: '<1s', progress: 'Progress', complete: 'Complete', error: 'Error', stalled: 'Stalled', loading: 'Loading' },
  es: { bytes: KB, hour: 'h', min: 'm', sec: 's', lessThan: '<1s', progress: 'Progreso', complete: 'Completado', error: 'Error', stalled: 'Estancado', loading: 'Cargando' },
  fr: { bytes: ['o', 'Ko', 'Mo', 'Go', 'To'], hour: 'h', min: 'min', sec: 's', lessThan: '<1s', progress: 'Progression', complete: 'Terminé', error: 'Erreur', stalled: 'Bloqué', loading: 'Chargement' },
  de: { bytes: KB, hour: 'Std', min: 'Min', sec: 'Sek', lessThan: '<1Sek', progress: 'Fortschritt', complete: 'Fertig', error: 'Fehler', stalled: 'Angehalten', loading: 'Lädt' },
  pt: { bytes: KB, hour: 'h', min: 'm', sec: 's', lessThan: '<1s', progress: 'Progresso', complete: 'Concluído', error: 'Erro', stalled: 'Parado', loading: 'Carregando' },
  it: { bytes: KB, hour: 'h', min: 'm', sec: 's', lessThan: '<1s', progress: 'Avanzamento', complete: 'Completato', error: 'Errore', stalled: 'Bloccato', loading: 'Caricamento' },
  ja: { bytes: KB, hour: '時間', min: '分', sec: '秒', lessThan: '1秒未満', progress: '進捗', complete: '完了', error: 'エラー', stalled: '停止', loading: '読み込み中' },
  zh: { bytes: KB, hour: '小时', min: '分', sec: '秒', lessThan: '<1秒', progress: '进度', complete: '完成', error: '错误', stalled: '已停滞', loading: '加载中' },
  ko: { bytes: KB, hour: '시간', min: '분', sec: '초', lessThan: '1초 미만', progress: '진행', complete: '완료', error: '오류', stalled: '정체됨', loading: '로딩 중' },
  ar: { rtl: true, bytes: ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب'], hour: 'س', min: 'د', sec: 'ث', lessThan: '<1ث', progress: 'التقدم', complete: 'اكتمل', error: 'خطأ', stalled: 'متوقف', loading: 'جارٍ التحميل' },
};
let activeLocale = 'en';

const localeDict = (code) => locales[code] || locales[activeLocale] || locales.en;

/** Format a byte count as a localized human string, e.g. 1536 -> "1.5 KB". */
const formatBytes = (bytes, code) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  const units = localeDict(code).bytes;
  if (n < 1024) return `${n} ${units[0]}`;
  let v = n / 1024;
  let i = 1;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
};

/** Format a duration in seconds as a localized short string, e.g. 75 -> "1m 15s". */
const formatDuration = (seconds, code) => {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) return '';
  const d = localeDict(code);
  if (s < 1) return d.lessThan;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h) return `${h}${d.hour} ${m}${d.min}`;
  if (m) return `${m}${d.min} ${sec}${d.sec}`;
  return `${sec}${d.sec}`;
};

/**
 * Normalize a user-supplied value to a percentage in [0, 100] of `max`.
 * Values in [0, 1] are treated as fractions (0.5 -> 50%); values > 1 are
 * treated as absolute units on the `max` scale. Returns null when not finite.
 */
const normalizeValue = (n, max) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const onScale = v >= 0 && v <= 1 ? v * 100 : (v / max) * 100;
  return clamp(onScale, 0, 100);
};

let segUid = 0;

/** Normalize a segment descriptor; `value` is stored as a percentage [0,100]. */
const normalizeSegment = (seg, max) => {
  const s = seg && typeof seg === 'object' ? seg : { value: seg };
  return {
    // A monotonic id (not the array index) so auto-ids never collide across
    // add/remove cycles. Existing segments keep their already-assigned id.
    id: s.id != null ? String(s.id) : `seg-${(segUid += 1)}`,
    value: normalizeValue(s.value, max) ?? 0,
    color: s.color != null ? String(s.color) : null,
    label: s.label != null ? String(s.label) : null,
    weight: Number.isFinite(s.weight) && s.weight > 0 ? s.weight : 1,
    status: s.status != null ? String(s.status) : null,
  };
};

/** Build a `border-radius` shorthand string from number | array | object. */
const cornersToCss = (value) => {
  if (value == null) return '0';
  if (typeof value === 'number') return `${toNum(value)}px`;
  if (Array.isArray(value)) {
    const [tl = 0, tr = 0, bl = 0, br = 0] = value.map(toNum);
    return `${tl}px ${tr}px ${br}px ${bl}px`;
  }
  if (typeof value === 'object') {
    const tl = toNum(value.topLeft);
    const tr = toNum(value.topRight);
    const bl = toNum(value.bottomLeft);
    const br = toNum(value.bottomRight);
    return `${tl}px ${tr}px ${br}px ${bl}px`;
  }
  return '0';
};

/** Normalize a single gradient stop to a `color [position%]` string. */
const stopToCss = (stop) => {
  if (stop == null) return '';
  if (typeof stop === 'string') return stop.trim();
  // { color, at } / { color, stop } — `at`/`stop` is an optional percentage.
  const color = String(stop.color || '').trim();
  const at = stop.at != null ? stop.at : stop.stop;
  return at != null ? `${color} ${toNum(at)}%` : color;
};

/** Supported gradient types -> their CSS function name. */
const GRADIENT_FNS = {
  linear: 'linear-gradient',
  radial: 'radial-gradient',
  conic: 'conic-gradient',
  'repeating-linear': 'repeating-linear-gradient',
  'repeating-radial': 'repeating-radial-gradient',
  'repeating-conic': 'repeating-conic-gradient',
};

/**
 * Build a CSS gradient string from color stops, or null when there are none.
 * @param {Array<string|{color:string,at?:number}>} stops
 * @param {{type?:string, angle?:string, shape?:string, position?:string}} [opts]
 */
const buildGradient = (stops, { type = 'linear', angle = '90deg', shape, position } = {}) => {
  if (!Array.isArray(stops) || !stops.length) return null;
  const css = stops.map(stopToCss).filter(Boolean).join(', ');
  if (!css) return null;
  const fn = GRADIENT_FNS[type] || GRADIENT_FNS.linear;
  const at = position ? ` at ${position}` : '';
  if (type.includes('radial')) return `${fn}(${shape || 'circle'}${at}, ${css})`;
  if (type.includes('conic')) return `${fn}(from ${angle}${at}, ${css})`;
  return `${fn}(${angle}, ${css})`;
};

/**
 * Build a hard-stop ("bands") gradient — each color a solid block with no
 * blending — by doubling each stop's boundary. Equal-width unless a stop carries
 * an explicit `at`. Always a `linear-gradient` (bands across the bar).
 * @param {Array<string|{color:string,at?:number}>} stops
 * @param {{angle?:string}} [opts]
 */
const buildBands = (stops, { angle = '90deg' } = {}) => {
  if (!Array.isArray(stops) || !stops.length) return null;
  const colors = stops
    .map((s) => (s && typeof s === 'object' ? { color: String(s.color || '').trim(), at: s.at } : { color: String(s).trim(), at: null }))
    .filter((s) => s.color);
  if (!colors.length) return null;
  if (colors.length === 1) return colors[0].color; // a single band is just a solid fill
  const n = colors.length;
  const parts = [];
  colors.forEach((c, i) => {
    const start = c.at != null ? toNum(c.at) : (i / n) * 100;
    const end = colors[i + 1] && colors[i + 1].at != null ? toNum(colors[i + 1].at) : ((i + 1) / n) * 100;
    parts.push(`${c.color} ${start}% ${end}%`);
  });
  return `linear-gradient(${angle}, ${parts.join(', ')})`;
};

/** Coerce a config input (object or JSON string) into a plain object. */
const coerceConfig = (input) => {
  if (input == null) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof input === 'object' ? input : {};
};

/** GET JSON from a URL. Throws when `fetch` is unavailable or the response is not ok. */
async function fetchJSON(url, opts) {
  if (typeof fetch !== 'function') throw new Error('fetch is unavailable');
  const res = await fetch(url, { headers: { Accept: 'application/json' }, ...(opts || {}) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** POST a JSON body to a URL. No-op (returns null) when `fetch` is unavailable. */
function postJSON(url, body, opts) {
  if (typeof fetch !== 'function') return Promise.resolve(null);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(opts || {}),
  });
}

/* --------------------------------------------------------------------------
 * Emitter — tiny event bus (instance events + a shared global bus)
 * ------------------------------------------------------------------------ */

class Emitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._handlers = new Map();
  }

  on(name, handler) {
    if (typeof handler !== 'function') return () => {};
    if (!this._handlers.has(name)) this._handlers.set(name, new Set());
    this._handlers.get(name).add(handler);
    return () => this.off(name, handler);
  }

  once(name, handler) {
    if (typeof handler !== 'function') return () => {};
    const wrapper = (...args) => {
      this.off(name, wrapper);
      handler(...args);
    };
    return this.on(name, wrapper);
  }

  off(name, handler) {
    if (name == null) {
      this._handlers.clear();
      return;
    }
    const set = this._handlers.get(name);
    if (!set) return;
    if (handler) {
      set.delete(handler);
      if (!set.size) this._handlers.delete(name);
    } else {
      this._handlers.delete(name); // no handler -> clear this event
    }
  }

  emit(name, ...args) {
    const set = this._handlers.get(name);
    if (!set) return;
    for (const handler of [...set]) handler(...args);
  }

  clear() {
    this._handlers.clear();
  }
}

function acquireBaseStyle() {
  styleRefCount += 1;
  if (!isBrowser) return;
  if (document.getElementById(BASE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BASE_STYLE_ID;
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
}

function releaseBaseStyle() {
  styleRefCount = Math.max(0, styleRefCount - 1);
  if (styleRefCount === 0 && isBrowser) {
    const style = document.getElementById(BASE_STYLE_ID);
    if (style) style.remove();
    // The shared aria-live region is created lazily; drop it with the last bar
    // so nothing is orphaned in the DOM (matches the stylesheet's lifecycle).
    const live = document.getElementById(LIVE_REGION_ID);
    if (live) live.remove();
  }
}

/** A single shared, off-screen polite aria-live region for all bars. */
const LIVE_REGION_ID = 'tabar-live';
function announceMessage(text) {
  if (!isBrowser || !text) return;
  let region = document.getElementById(LIVE_REGION_ID);
  if (!region) {
    region = document.createElement('div');
    region.id = LIVE_REGION_ID;
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    // visually hidden but available to assistive tech
    region.style.cssText =
      'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
    document.body.appendChild(region);
  }
  region.textContent = String(text);
}

/* --------------------------------------------------------------------------
 * Guarded storage access (treats all stored data as untrusted)
 * ------------------------------------------------------------------------ */

function getStorage(kind) {
  if (!isBrowser) return null;
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage;
    const probe = '__tabar_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null; // private mode, disabled storage, SSR, quota, etc.
  }
}

function readState(store, key, ttl) {
  if (!store) return null;
  let raw;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // malformed / tampered
  }
  if (!parsed || typeof parsed !== 'object' || parsed.v !== SCHEMA_VERSION) {
    return null; // wrong shape or stale schema
  }
  if (ttl && typeof parsed.ts === 'number' && Date.now() - parsed.ts > ttl) {
    try {
      store.removeItem(key);
    } catch {
      /* ignore */
    }
    return null; // expired
  }
  const value = Number(parsed.value);
  if (!Number.isFinite(value)) return null;
  return { value: clamp(value, 0, 100), meta: parsed.meta, ts: parsed.ts };
}

function writeState(store, key, payload) {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify({ v: SCHEMA_VERSION, ts: Date.now(), ...payload }));
  } catch {
    /* quota / disabled — silent no-op */
  }
}

function removeState(store, key) {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* --------------------------------------------------------------------------
 * Tabar
 * ------------------------------------------------------------------------ */

/** @type {Map<string, Tabar>} live instances keyed by id */
const registry = new Map();

/** Shared bus: every instance event is re-emitted here as `(payload, bar)`. */
const globalBus = new Emitter();

class Tabar {
  /**
   * @param {Partial<typeof DEFAULTS>} [options]
   */
  constructor(options = {}) {
    const raw = coerceConfig(options); // accepts an object or a JSON string
    // Declarative config: when mounting onto an element, read `data-tabar-*`
    // attributes off it as a fallback — present data-attrs apply, but an
    // explicit JS option always wins. Skipped for the default <body> mount.
    const mountEl = isBrowser ? resolveMountEl(raw.mountTo) : null;
    const dataAttrs = mountEl ? readDataAttrs(mountEl) : {};
    const opts = { ...DEFAULTS, ...dataAttrs, ...raw };
    opts.classPrefix = sanitizeIdent(opts.classPrefix, 'tabar');
    opts.id = sanitizeIdent(opts.id, `${opts.classPrefix}-${(uid += 1)}`);

    // Track which visual options the user actually set, so unset color/background
    // fall back to the scheme-aware stylesheet defaults (and inline bars get a
    // visible track) instead of being pinned to a fixed value.
    const provided = new Set([...Object.keys(dataAttrs), ...Object.keys(raw)]);

    // Re-using an id returns the existing instance rather than colliding.
    const existing = registry.get(opts.id);
    if (existing) {
      if (opts.debug) console.warn(`[tabar] id "${opts.id}" already exists; reusing instance.`);
      return existing;
    }

    this.options = opts;
    this.id = opts.id;
    /** @type {Set<string>} option keys the user explicitly provided */
    this._provided = provided;

    /** @type {number} current progress as a percentage [0,100] */
    this._progress = 0;
    /** @type {'idle'|'active'|'done'|'indeterminate'} */
    this._state = 'idle';
    /** @type {Set<number>} pending timers, cleared on destroy */
    this._timers = new Set();
    /** Per-instance event bus. */
    this._emitter = new Emitter();
    this._trickleTimer = null;
    this._saveTimer = null;
    this._reportTimer = null;
    this._destroyed = false;
    this._paused = false;
    this._attempts = 0;
    this._retryFn = null; // set via retryWith() or the {retry} option on trackXHR/trackResponse
    this._stallTimer = null;
    /** Transfer stats for upload/download tracking (loaded/total/speed/eta). */
    this._xfer = { loaded: 0, total: 0, startedAt: null, last: null, speed: 0 };
    /** Normalized segments when in multi-progress mode, else null. */
    this._segments = null;
    /** Cleanup callbacks registered by bind(). */
    this._unbinds = [];

    this._persist = this._resolvePersist(opts.persist);
    this._store = this._persist ? getStorage(this._persist.storage) : null;

    registry.set(this.id, this);

    if (isBrowser) {
      acquireBaseStyle();
      this._build();
      this._applyTheme();
      this._restore();
      // Seed an explicit starting value (unless persistence already restored one).
      if (opts.value != null && this._progress === 0) {
        this.show();
        this._setState('active');
        this.goto(opts.value, { animate: false });
      }
      this._setupReporting();
      if (opts.segments) this.setSegments(opts.segments);
      if (opts.configUrl) this.loadConfig(opts.configUrl);
    }
  }

  /* ----- static registry & global bus ----------------------------------- */

  /** @returns {Tabar | undefined} */
  static get(id) {
    return registry.get(sanitizeIdent(id, ''));
  }

  /** @returns {Tabar[]} */
  static get instances() {
    return [...registry.values()];
  }

  /** The set of event names every instance emits. */
  static get events() {
    return [...EVENTS];
  }

  /** Subscribe to an event across ALL instances. Handler gets `(payload, bar)`. */
  static on(name, handler) {
    return globalBus.on(name, handler);
  }

  /** Subscribe once across all instances. */
  static once(name, handler) {
    return globalBus.once(name, handler);
  }

  /** Unsubscribe a global listener (or all for `name`, or everything). */
  static off(name, handler) {
    globalBus.off(name, handler);
    return Tabar;
  }

  /** Construct from a JSON string or plain config object. */
  static fromJSON(input) {
    return new Tabar(coerceConfig(input));
  }

  /**
   * Fetch a JSON config from a URL and construct from it.
   * @param {string} url
   * @param {{fetchOptions?:object, overrides?:object}} [opts]
   * @returns {Promise<Tabar>}
   */
  static async fromURL(url, opts = {}) {
    const cfg = await fetchJSON(url, opts.fetchOptions);
    return new Tabar({ ...coerceConfig(cfg), ...(opts.overrides || {}) });
  }

  /* ----- DOM construction ----------------------------------------------- */

  _build() {
    const p = this.options.classPrefix;
    const circular = this.options.shape === 'circular';
    const wrapper = document.createElement('div');
    wrapper.className = p;
    wrapper.setAttribute('data-tabar', '');
    wrapper.setAttribute('data-id-tabar', this.id);
    wrapper.setAttribute('data-shape-tabar', circular ? 'circular' : 'linear');
    if (!circular) wrapper.setAttribute('data-position-tabar', this._position());
    if (this._isRtl()) wrapper.setAttribute('data-rtl-tabar', 'true'); // mirrors fill + circular sweep
    wrapper.setAttribute('role', 'progressbar');
    wrapper.setAttribute('aria-valuemin', '0');
    wrapper.setAttribute('aria-valuemax', '100');
    wrapper.setAttribute('aria-valuenow', '0');
    if (this.options.ariaLabelledBy) {
      wrapper.setAttribute('aria-labelledby', sanitizeIdent(this.options.ariaLabelledBy, ''));
    } else {
      wrapper.setAttribute('aria-label', String(this.options.ariaLabel || localeDict(this.options.locale).progress));
    }
    this._setState('idle', wrapper);

    this._wrapper = wrapper;
    this._bar = circular ? this._buildCircular(wrapper, p) : this._buildLinear(wrapper, p);

    if (this.options.showLabel) {
      const label = document.createElement('div');
      label.className = `${p}__label`;
      label.setAttribute('data-label-tabar', '');
      label.textContent = String(this.options.label || ''); // textContent only: no HTML injection
      wrapper.appendChild(label);
      this._label = label;
      this._renderLabel(this._progress);
    }

    if (this.options.tooltip) {
      const tip = document.createElement('div');
      tip.className = `${p}__tooltip`;
      tip.setAttribute('data-tooltip-tabar', '');
      tip.setAttribute('role', 'tooltip');
      (circular ? wrapper : this._bar).appendChild(tip);
      this._tooltip = tip;
    }

    this._applyTooltipState();
    this._renderTooltip(this._progress);
    this._renderMessage();

    const host = this._resolveHost();
    if (host) host.appendChild(wrapper);
  }

  /** Build the linear bar element (a single `<div>` fill). */
  _buildLinear(wrapper, p) {
    const bar = document.createElement('div');
    bar.className = `${p}__bar`;
    bar.setAttribute('data-bar-tabar', '');
    wrapper.appendChild(bar);
    return bar;
  }

  /** Build the circular ring (an SVG track + progress arc) and return the arc. */
  _buildCircular(wrapper, p) {
    const size = toNum(this.options.size) || 64;
    const stroke = toNum(this.options.height) || 6;
    const r = (size - stroke) / 2;
    this._circumference = 2 * Math.PI * r;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `${p}__svg`);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', `${size}`);
    svg.setAttribute('height', `${size}`);

    const circle = (cls) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', `${size / 2}`);
      c.setAttribute('cy', `${size / 2}`);
      c.setAttribute('r', `${r}`);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke-width', `${stroke}`);
      return c;
    };

    const track = circle(`${p}__track`);
    track.setAttribute('data-track-tabar', '');
    const bar = circle(`${p}__bar`);
    bar.setAttribute('data-bar-tabar', '');
    bar.setAttribute('stroke-linecap', toLinecap(this.options.lineCap));
    bar.style.strokeDasharray = `${this._circumference}`;
    bar.style.strokeDashoffset = `${this._circumference}`;

    svg.append(track, bar);
    wrapper.appendChild(svg);
    return bar;
  }

  _resolveHost() {
    const { mountTo } = this.options;
    if (mountTo instanceof Element) return mountTo;
    if (typeof mountTo === 'string' && mountTo) {
      const el = document.querySelector(mountTo);
      if (el) return el;
      if (this.options.debug) console.warn(`[tabar] mountTo "${mountTo}" not found; using <body>.`);
    }
    // Fixed (top/bottom/left/right) overlays and unmatched mounts default to <body>.
    return document.body;
  }

  _applyTheme() {
    if (!this._wrapper) return;
    const o = this.options;
    const el = this._wrapper;
    const set = (name, value) => el.style.setProperty(name, value);
    // Only pin color/background when the user set them — otherwise let the
    // scheme-aware stylesheet defaults (and the inline-bar track) take over.
    if (this._provided.has('color')) set('--tabar-color', String(o.color));
    else el.style.removeProperty('--tabar-color');
    if (this._provided.has('background')) set('--tabar-bg', String(o.background));
    else el.style.removeProperty('--tabar-bg');
    set('--tabar-color2', String(o.color2));
    set('--tabar-height', `${toNum(o.height)}px`);
    set('--tabar-radius', cornersToCss(o.radius));
    set('--tabar-inner-radius', cornersToCss(o.innerRadius));
    set('--tabar-speed', `${toNum(o.speed)}ms`);
    set('--tabar-z', String(toNum(o.zIndex)));
    set('--tabar-length', toLength(o.length));
    set('--tabar-offset', `${toNum(o.offset)}px`);
    set('--tabar-glow-size', `${toNum(o.glowSize)}px`);
    // Circular sweep: rotate to the start angle, and flip when the bar should run
    // counter-clockwise (clockwise:false XOR RTL) — drives the single SVG transform.
    set('--tabar-start-angle', `${toNum(o.startAngle)}deg`);
    set('--tabar-flip', (o.clockwise === false) !== this._isRtl() ? '-1' : '1');
    if (o.trackColor != null) set('--tabar-track-color', String(o.trackColor));
    else el.style.removeProperty('--tabar-track-color');

    if (o.shape !== 'circular') {
      el.setAttribute('data-position-tabar', this._position());
      el.setAttribute('data-orientation-tabar', this._orientation());
    } else if (this._bar) {
      this._bar.setAttribute('stroke-linecap', toLinecap(o.lineCap));
    }

    const theme = sanitizeIdent(o.theme, 'default');
    if (theme && theme !== 'default') el.setAttribute('data-theme-tabar', theme);
    else el.removeAttribute('data-theme-tabar');

    if (o.glow) el.setAttribute('data-glow-tabar', 'true');
    else el.removeAttribute('data-glow-tabar');
    if (o.glowColor) set('--tabar-glow', String(o.glowColor));
    else el.style.removeProperty('--tabar-glow');

    if (o.colorAnimate) el.setAttribute('data-multicolor-anim-tabar', 'true');
    else el.removeAttribute('data-multicolor-anim-tabar');

    this._applyStripes();
    this._applyFillVar();
    this._applyMessageStyle();
    this._renderMessage();
  }

  /** The validated position (unknown values fall back to 'top'). */
  _position() {
    return POSITIONS.has(this.options.position) ? this.options.position : 'top';
  }

  /** @returns {'horizontal'|'vertical'} */
  _orientation() {
    return VERTICAL_POSITIONS.has(this._position()) ? 'vertical' : 'horizontal';
  }

  /** True when the bar should render right-to-left (explicit option or RTL locale). */
  _isRtl() {
    return this.options.direction === 'rtl' || localeDict(this.options.locale).rtl === true;
  }

  /** Default gradient angle for the current orientation. */
  _gradientAngle() {
    const { gradientAngle } = this.options;
    if (gradientAngle != null) return `${toNum(gradientAngle)}deg`;
    return this._orientation() === 'vertical' ? '0deg' : '90deg';
  }

  /**
   * The gradient stops actually in effect: an explicit `gradient` array, or the
   * two-stop `[color, color2]` of the 'gradient' theme, else null. This lets the
   * gradient TYPE/shape/position (and the circular SVG gradient) honor the theme
   * preset, not only an explicit stops array.
   */
  _effectiveStops() {
    const o = this.options;
    if (Array.isArray(o.colors) && o.colors.length > 1) return o.colors;
    if (Array.isArray(o.gradient) && o.gradient.length > 1) return o.gradient;
    if (o.theme === 'gradient') return [String(o.color), String(o.color2)];
    return null;
  }

  /** Build the bar's CSS background (gradient/bands/explicit), or null. */
  _computeFill() {
    const o = this.options;
    if (o.fill) return String(o.fill);
    const stops = this._effectiveStops();
    if (o.colorMode === 'bands') return buildBands(stops, { angle: this._gradientAngle() });
    return buildGradient(stops, {
      type: o.gradientType,
      angle: this._gradientAngle(),
      shape: o.gradientShape,
      position: o.gradientPosition,
    });
  }

  /** Apply the computed fill + gradient angle (CSS var for linear, SVG stroke for circular). */
  _applyFillVar() {
    if (!this._wrapper) return;
    this._wrapper.style.setProperty('--tabar-angle', this._gradientAngle());
    if (this.options.shape === 'circular') {
      this._applyCircularStroke();
      return;
    }
    const fill = this._computeFill();
    if (fill) this._wrapper.style.setProperty('--tabar-fill', fill);
    else this._wrapper.style.removeProperty('--tabar-fill');
  }

  /** Paint the ring stroke — an SVG `<linearGradient>` for gradients, else the CSS color. */
  _applyCircularStroke() {
    const bar = this._bar;
    if (!bar) return;
    const svg = bar.ownerSVGElement;
    if (this._gradDef) {
      this._gradDef.remove();
      this._gradDef = null;
    }
    const stops = this._effectiveStops();
    if (svg && Array.isArray(stops) && stops.length > 1) {
      const id = `tabar-grad-${this.id}`;
      const defs = document.createElementNS(SVG_NS, 'defs');
      const grad = document.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', id);
      // Map the gradient angle to a vector across the bounding box.
      const rad = ((toNum(this.options.gradientAngle ?? 90) - 90) * Math.PI) / 180;
      const dx = Math.cos(rad) / 2;
      const dy = Math.sin(rad) / 2;
      grad.setAttribute('x1', `${(0.5 - dx) * 100}%`);
      grad.setAttribute('y1', `${(0.5 - dy) * 100}%`);
      grad.setAttribute('x2', `${(0.5 + dx) * 100}%`);
      grad.setAttribute('y2', `${(0.5 + dy) * 100}%`);
      const bands = this.options.colorMode === 'bands';
      const addStop = (offset, color) => {
        const stop = document.createElementNS(SVG_NS, 'stop');
        stop.setAttribute('offset', `${offset}%`);
        stop.setAttribute('stop-color', String(color));
        grad.appendChild(stop);
      };
      const n = stops.length;
      stops.forEach((s, i) => {
        const color = typeof s === 'object' ? s.color : s;
        const at = typeof s === 'object' ? s.at : null;
        if (bands) {
          // Doubled boundaries → hard color blocks (no blending).
          addStop((i / n) * 100, color);
          addStop(((i + 1) / n) * 100, color);
        } else {
          addStop(at != null ? toNum(at) : (i / (n - 1)) * 100, color);
        }
      });
      defs.appendChild(grad);
      svg.insertBefore(defs, svg.firstChild);
      this._gradDef = defs;
      bar.style.stroke = `url(#${id})`;
    } else {
      bar.style.removeProperty('stroke'); // fall back to the CSS `--tabar-color` stroke
    }
  }

  /** Reflect the striped state (option or 'stripes' theme) onto data attributes. */
  _applyStripes() {
    if (!this._wrapper) return;
    const striped = this.options.striped || this.options.theme === 'stripes';
    if (striped) {
      this._wrapper.setAttribute('data-striped-tabar', 'true');
      if (this.options.stripeAnimate) this._wrapper.setAttribute('data-stripe-anim-tabar', 'true');
      else this._wrapper.removeAttribute('data-stripe-anim-tabar');
    } else {
      this._wrapper.removeAttribute('data-striped-tabar');
      this._wrapper.removeAttribute('data-stripe-anim-tabar');
    }
  }

  /* ----- state helpers -------------------------------------------------- */

  _setState(state, el = this._wrapper) {
    this._state = state;
    if (el) el.setAttribute('data-state-tabar', state);
    this._renderMessage(); // inline status text can depend on the state
  }

  /** Paint the fill to `pct` (linear width/height or circular dash offset). */
  _setWidth(pct, durationMs) {
    if (!this._bar) return;
    if (durationMs != null) this._bar.style.transitionDuration = `${toNum(durationMs)}ms`;
    if (this.options.shape === 'circular') {
      this._bar.style.strokeDashoffset = `${this._circumference * (1 - pct / 100)}`;
    } else {
      // Anchor any gradient fill to the full track (not the fill box) so its
      // colors don't shift/compress as the bar grows. SCSS reads this scale.
      this._bar.style.setProperty('--tabar-fill-scale', String(pct / 100));
      if (this._orientation() === 'vertical') {
        this._bar.style.removeProperty('width');
        this._bar.style.height = `${pct}%`;
      } else {
        this._bar.style.removeProperty('height');
        this._bar.style.width = `${pct}%`;
      }
    }
    if (this._wrapper && this._state !== 'indeterminate') {
      this._wrapper.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
    this._renderLabel(pct);
    this._renderTooltip(pct);
    this._renderMessage();
  }

  /** Resolve the inline message for the current state (string, or '' when none). */
  _resolveMessage() {
    const m = this.options.messages;
    if (!m || typeof m !== 'object') return '';
    const entry = m[this._state] != null ? m[this._state] : m.default;
    if (entry == null) return '';
    try {
      return String(typeof entry === 'function' ? entry(this._progress, this) : entry);
    } catch (err) {
      if (this._debugEnabled()) console.error(`[tabar:${this.id}] message threw`, err);
      return '';
    }
  }

  /** Render the inline status message overlay (created lazily; hidden when empty). */
  _renderMessage() {
    if (!this._wrapper) return;
    const text = this._resolveMessage();
    if (!text) {
      if (this._messageEl) this._messageEl.hidden = true;
      return;
    }
    if (!this._messageEl) {
      const el = document.createElement('div');
      el.className = `${this.options.classPrefix}__message`;
      el.setAttribute('data-message-tabar', '');
      this._wrapper.appendChild(el); // overlays the fill; circular shares the centered grid cell
      this._messageEl = el;
      this._applyMessageStyle();
    }
    this._messageEl.hidden = false;
    this._messageEl.textContent = text; // textContent only: no HTML injection
  }

  /** Apply message alignment/color CSS from options. */
  _applyMessageStyle() {
    if (!this._messageEl) return;
    const align = { start: 'flex-start', end: 'flex-end' }[this.options.messageAlign] || 'center';
    this._messageEl.style.setProperty('--tabar-message-align', align);
    if (this.options.messageColor) this._messageEl.style.setProperty('--tabar-message-color', String(this.options.messageColor));
    else this._messageEl.style.removeProperty('--tabar-message-color');
  }

  /** Refresh a live label from `labelFormat`, if both are configured. */
  _renderLabel(pct) {
    if (!this._label || typeof this.options.labelFormat !== 'function') return;
    try {
      this._label.textContent = String(this.options.labelFormat(pct, this));
    } catch (err) {
      if (this._debugEnabled()) console.error(`[tabar:${this.id}] labelFormat threw`, err);
    }
  }

  /** Refresh the tooltip text. `true` shows the percentage; a function gets (pct, bar). */
  _renderTooltip(pct) {
    if (!this._tooltip) return;
    const t = this.options.tooltip;
    let text = '';
    try {
      if (typeof t === 'function') text = t(pct, this);
      else if (typeof t === 'string') text = t;
      else if (t) text = `${Math.round(pct)}%`;
    } catch (err) {
      if (this._debugEnabled()) console.error(`[tabar:${this.id}] tooltip threw`, err);
    }
    this._tooltip.textContent = String(text); // textContent only: no HTML injection
  }

  /** Reflect tooltip enablement onto the wrapper (enables hover + visibility mode). */
  _applyTooltipState() {
    if (!this._wrapper) return;
    if (this.options.tooltip) {
      this._wrapper.setAttribute('data-tooltip-tabar-on', this.options.tooltipAlways ? 'always' : 'hover');
    } else {
      this._wrapper.removeAttribute('data-tooltip-tabar-on');
    }
  }

  _track(timer) {
    this._timers.add(timer);
    return timer;
  }

  /* ----- events & debug ------------------------------------------------- */

  /**
   * Subscribe to an event: `start`, `change`, `done`, `reset`, `resume`,
   * `show`, `hide`, `indeterminate`, `theme`, `destroy`. Chainable.
   */
  on(name, handler) {
    this._emitter.on(name, handler);
    return this;
  }

  /** Subscribe to an event for a single firing. Chainable. */
  once(name, handler) {
    this._emitter.once(name, handler);
    return this;
  }

  /** Remove a listener (or all listeners for `name`, or every listener). Chainable. */
  off(name, handler) {
    this._emitter.off(name, handler);
    return this;
  }

  /** Enable/disable verbose logging for this instance. Chainable. */
  setDebug(on = true) {
    this.options.debug = !!on;
    return this;
  }

  _debugEnabled() {
    return this.options.debug || Tabar.debug;
  }

  _log(...args) {
    if (this._debugEnabled()) console.debug(`[tabar:${this.id}]`, ...args);
  }

  /**
   * Fire an event everywhere: the matching `on<Name>` option callback, instance
   * listeners, the global bus, a DOM `tabar:<name>` CustomEvent on the wrapper,
   * and the debug log. Errors in one handler never break the others.
   */
  _emit(name, payload) {
    this._log(name, payload);
    const safe = (fn) => {
      try {
        fn();
      } catch (err) {
        if (this._debugEnabled()) console.error(`[tabar:${this.id}] "${name}" handler threw`, err);
      }
    };
    const cb = this.options[`on${name[0].toUpperCase()}${name.slice(1)}`];
    if (typeof cb === 'function') safe(() => cb.call(this, payload, this));
    safe(() => this._emitter.emit(name, payload, this));
    safe(() => globalBus.emit(name, payload, this));
    if (this._wrapper && typeof CustomEvent === 'function') {
      safe(() =>
        this._wrapper.dispatchEvent(
          new CustomEvent(`tabar:${name}`, { detail: { bar: this, value: payload }, bubbles: true }),
        ),
      );
    }
  }

  /* ----- core lifecycle ------------------------------------------------- */

  /** Show the bar, seed it to `minimum`, and (optionally) begin trickling. */
  start() {
    if (this._destroyed) return this;
    this._resetXfer();
    this.show();
    this._setState('active');
    if (this._progress < this.options.minimum * 100) {
      this.set(this.options.minimum);
    }
    this._startTrickle();
    this._emit('start', this._progress);
    return this;
  }

  /**
   * Animate to a value. Accepts a fraction [0,1] or an absolute value on the
   * `max` scale. Returns a Promise that resolves when the transition settles.
   * @param {number} n
   * @param {{duration?: number, animate?: boolean}} [opts]
   * @returns {Promise<Tabar>}
   */
  goto(n, opts = {}) {
    const pct = normalizeValue(n, this.options.max);
    if (this._destroyed || pct == null) return Promise.resolve(this);

    if (this._segments) this._exitSegmentMode(); // a direct value returns to single mode

    // Setting a value clears a transient error/indeterminate state; a sub-100 value
    // also re-activates a completed bar. (done()'s own goto(1) keeps the 'done' state.)
    if (this._state === 'indeterminate' || this._state === 'error' || this._state === 'warning' || this._state === 'success') this._setState('active');
    else if (this._state === 'done' && pct < 100) this._setState('active');

    // A positive value should be visible — auto-show unless opted out.
    if (pct > 0 && this.options.autoShow) this.show();

    const previous = this._progress;
    this._progress = pct;
    const animate = opts.animate !== false;
    const duration = opts.duration != null ? toNum(opts.duration) : this.options.speed;

    this._setWidth(pct, animate ? duration : 0);
    // Only persist/emit on a real change — avoids redundant writes and event spam.
    if (pct !== previous) {
      this._save();
      this._emit('change', pct);
    }

    if (pct >= 100) this._scheduleAutoDone();

    const noTransition =
      !animate || duration <= 0 || pct === previous || prefersReducedMotion() || !this._bar;
    if (noTransition) return Promise.resolve(this);

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this._timers.delete(timer);
        this._bar.removeEventListener('transitionend', onEnd);
        resolve(this);
      };
      const dim =
        this.options.shape === 'circular'
          ? 'stroke-dashoffset'
          : this._orientation() === 'vertical'
            ? 'height'
            : 'width';
      const onEnd = (e) => {
        if (e.propertyName && e.propertyName !== dim) return;
        finish();
      };
      // Fallback timer: transitionend never fires for no-op/reduced-motion.
      const timer = this._track(setTimeout(finish, duration + 60));
      this._bar.addEventListener('transitionend', onEnd);
    });
  }

  /** Alias of {@link goto}. */
  set(n, opts) {
    return this.goto(n, opts);
  }

  /* ----- segments (one bar, many progresses) ---------------------------- */

  /**
   * Drive the bar with multiple segments (chunked upload/download, multi-stage,
   * buffered-vs-played). Enters segment mode; `set()/goto()` returns to single mode.
   * @param {Array<string|{id?,value,color?,label?,weight?,status?}>} arr
   */
  setSegments(arr) {
    if (this._destroyed) return this;
    if (!Array.isArray(arr) || !arr.length) return this._exitSegmentMode();
    this._segments = arr.map((s) => normalizeSegment(s, this.options.max));
    if (this._wrapper) this._wrapper.setAttribute('data-segmented-tabar', this._segmentMode());
    this.show();
    if (this._state === 'idle') this._setState('active');
    this._paintSegments();
    return this;
  }

  /** Add a segment. Chainable. */
  addSegment(seg) {
    const next = this._segments ? this._segments.slice() : [];
    next.push(normalizeSegment(seg, this.options.max));
    return this.setSegments(next);
  }

  /** Patch a segment by id (value/color/label/weight/status). Chainable. */
  updateSegment(id, patch) {
    if (!this._segments) return this;
    const key = String(id);
    this._segments = this._segments.map((s) => {
      if (s.id !== key) return s;
      const out = { ...s };
      if (patch.value != null) out.value = normalizeValue(patch.value, this.options.max) ?? s.value;
      if (patch.color !== undefined) out.color = patch.color == null ? null : String(patch.color);
      if (patch.label !== undefined) out.label = patch.label == null ? null : String(patch.label);
      if (Number.isFinite(patch.weight) && patch.weight > 0) out.weight = patch.weight;
      if (patch.status !== undefined) out.status = patch.status == null ? null : String(patch.status);
      return out;
    });
    this._paintSegments();
    return this;
  }

  /** Remove a segment by id. Chainable. */
  removeSegment(id) {
    if (!this._segments) return this;
    const next = this._segments.filter((s) => s.id !== String(id));
    return next.length ? this.setSegments(next) : this._exitSegmentMode();
  }

  /** A copy of the current segments (empty array when not in segment mode). */
  get segments() {
    return this._segments ? this._segments.map((s) => ({ ...s })) : [];
  }

  _segmentMode() {
    return this.options.segmentMode === 'overlay' ? 'overlay' : 'stacked';
  }

  /** Aggregate the segments into a single [0,100] value per the active strategy. */
  _aggregateSegments() {
    const segs = this._segments || [];
    if (!segs.length) return 0;
    const mode = this._segmentMode();
    const strategy = this.options.aggregate || (mode === 'overlay' ? 'primary' : 'weighted');
    if (strategy === 'primary') return segs[segs.length - 1].value;
    if (strategy === 'max') return Math.max(...segs.map((s) => s.value));
    if (strategy === 'avg') return segs.reduce((a, s) => a + s.value, 0) / segs.length;
    if (strategy === 'sum') return clamp(segs.reduce((a, s) => a + s.value, 0), 0, 100);
    const totalW = segs.reduce((a, s) => a + s.weight, 0) || 1; // weighted (default)
    return segs.reduce((a, s) => a + s.weight * s.value, 0) / totalW;
  }

  /** Render the segment DOM and sync the aggregate value (aria/label/stats/event). */
  _paintSegments() {
    this._renderSegmentDom();
    const pct = this._aggregateSegments();
    const previous = this._progress;
    this._progress = pct;
    if (this._wrapper) this._wrapper.setAttribute('aria-valuenow', String(Math.round(pct)));
    this._renderLabel(pct);
    this._renderTooltip(pct);
    this._renderMessage();
    if (pct !== previous) {
      this._save();
      this._emit('change', pct);
    }
    return this;
  }

  /** Build/update the segment elements inside the bar (DOM renderer only). */
  _renderSegmentDom() {
    if (!this._wrapper || this.options.shape === 'circular') return; // segments are linear-only
    const p = this.options.classPrefix;
    let layer = this._segLayer;
    if (!layer) {
      layer = document.createElement('div');
      layer.className = `${p}__segments`;
      layer.setAttribute('data-segments-tabar', '');
      this._wrapper.appendChild(layer);
      this._segLayer = layer;
      if (this._bar) this._bar.style.display = 'none'; // hide the single fill in segment mode
    }
    const mode = this._segmentMode();
    layer.setAttribute('data-segments-tabar', mode);
    const segs = this._segments;
    // reconcile child count (each segment = a slot containing a colored fill)
    while (layer.children.length > segs.length) layer.lastChild.remove();
    while (layer.children.length < segs.length) {
      const slot = document.createElement('div');
      slot.className = `${p}__segment`;
      slot.setAttribute('data-seg-tabar', '');
      const fill = document.createElement('div');
      fill.className = `${p}__segment-fill`;
      slot.appendChild(fill);
      layer.appendChild(slot);
    }
    segs.forEach((s, i) => {
      const slot = layer.children[i];
      const fill = slot.firstChild;
      slot.setAttribute('data-seg-id-tabar', s.id);
      if (s.status) slot.setAttribute('data-seg-status-tabar', s.status);
      else slot.removeAttribute('data-seg-status-tabar');
      if (s.color) fill.style.setProperty('--tabar-seg-color', s.color);
      else fill.style.removeProperty('--tabar-seg-color');
      if (mode === 'overlay') {
        slot.style.flex = '';
        slot.style.zIndex = String(i + 1);
        slot.style.width = `${s.value}%`; // the layer width
        fill.style.width = '100%';
      } else {
        slot.style.zIndex = '';
        slot.style.width = '';
        slot.style.flex = `${s.weight}`; // slot occupies its weight share
        fill.style.width = `${s.value}%`; // fills its slot by its value
      }
    });
  }

  /** Leave segment mode and restore the single fill. */
  _exitSegmentMode() {
    this._segments = null;
    if (this._segLayer) {
      this._segLayer.remove();
      this._segLayer = null;
    }
    if (this._wrapper) this._wrapper.removeAttribute('data-segmented-tabar');
    if (this._bar) this._bar.style.removeProperty('display');
    return this;
  }

  /** Increment by `amount` (fraction). With no argument, uses NProgress-style steps. */
  inc(amount) {
    if (this._destroyed) return this;
    const n = this._progress / 100;
    let delta = amount;
    if (delta == null) {
      if (n < 0.2) delta = 0.1;
      else if (n < 0.5) delta = 0.04;
      else if (n < 0.8) delta = 0.02;
      else if (n < 0.99) delta = 0.005;
      else delta = 0;
    }
    this.goto(clamp(n + delta, 0, 0.994));
    return this;
  }

  /** Toggle indeterminate mode. Drops `aria-valuenow` while active. */
  indeterminate(on = true) {
    if (this._destroyed) return this;
    this.show();
    if (on) {
      this._stopTrickle();
      this._setState('indeterminate');
      if (this._wrapper) this._wrapper.removeAttribute('aria-valuenow');
      if (this._bar) {
        this._bar.style.transitionDuration = '0ms';
        // Clear inline sizing so the stylesheet's indeterminate animation takes effect.
        this._bar.style.removeProperty('width');
        this._bar.style.removeProperty('height');
        this._bar.style.removeProperty('stroke-dashoffset');
      }
    } else {
      this._setState('active');
      if (this._wrapper) {
        this._wrapper.setAttribute('aria-valuenow', String(Math.round(this._progress)));
      }
      this._setWidth(this._progress, 0);
    }
    this._emit('indeterminate', !!on);
    return this;
  }

  /** Animate to 100% then (unless disabled) hide and reset. */
  done(force = false) {
    if (this._destroyed) return Promise.resolve(this);
    if (!force && this._state === 'idle' && this._progress === 0) {
      return Promise.resolve(this);
    }
    this._stopTrickle();
    this._clearStall();
    this._setState('done');
    const finished = this.goto(1).then(() => {
      this._announce('complete');
      this._emit('done', 100);
      if (this._persist && !this._persist.keepOnDone) this._clearSaved();
      if (this.options.autoHide) {
        this._track(
          setTimeout(() => {
            if (!this._destroyed) this.reset();
          }, this.options.autoHideDelay),
        );
      }
      return this;
    });
    return finished;
  }

  /** Snap back to 0% and hide, without animating. */
  reset() {
    if (this._destroyed) return this;
    this._stopTrickle();
    this._clearStall();
    this._resetXfer();
    this._progress = 0;
    this._setState('idle');
    this._setWidth(0, 0);
    this.hide();
    this._clearSaved();
    this._emit('reset', 0);
    return this;
  }

  /**
   * Put the bar into the error state (red), e.g. when a transfer fails. Stops
   * trickling, keeps the current value visible, announces, and emits `error`.
   * Auto-clears after `errorTimeout` ms when configured.
   * @param {*} [info] message or detail forwarded to listeners
   */
  error(info) {
    if (this._destroyed) return this;
    this._stopTrickle();
    this._clearStall();
    this.show();
    this._setState('error');
    this._announce('error', info);
    this._emit('error', info != null ? info : null);
    if (toNum(this.options.errorTimeout) > 0) {
      this._track(
        setTimeout(() => {
          if (!this._destroyed && this._state === 'error') this.reset();
        }, toNum(this.options.errorTimeout)),
      );
    }
    return this;
  }

  /** Put the bar into the warning state (amber). Emits `warning`. */
  warn(info) {
    if (this._destroyed) return this;
    this.show();
    this._setState('warning');
    this._announce('warning', info);
    this._emit('warning', info != null ? info : null);
    return this;
  }

  /** Mark the bar successful (green) at its current value. Emits `success`. */
  succeed(info) {
    if (this._destroyed) return this;
    this._stopTrickle();
    this._clearStall();
    this.show();
    this._setState('success');
    this._announce('complete', info);
    this._emit('success', info != null ? info : null);
    return this;
  }

  /** Register a handler that {@link retry} will invoke. Chainable. */
  retryWith(fn) {
    this._retryFn = typeof fn === 'function' ? fn : null;
    return this;
  }

  /**
   * Clear an error and re-attempt via the registered retry handler (`retryWith`
   * / `onRetry`). Increments `attempts`. No-ops (with a debug warning) when no
   * handler is set. Emits `retry`.
   */
  retry() {
    if (this._destroyed) return this;
    if (typeof this._retryFn !== 'function') {
      this._log('retry() called but no retry handler is set');
      return this;
    }
    this._attempts += 1;
    if (this._state === 'error' || this._state === 'warning') this._setState('active');
    this._emit('retry', this._attempts);
    try {
      this._retryFn(this, this._attempts);
    } catch (err) {
      if (this._debugEnabled()) console.error(`[tabar:${this.id}] retry handler threw`, err);
    }
    return this;
  }

  /** Announce a localized state change to the shared aria-live region. */
  _announce(key, info) {
    if (!this.options.announce) return;
    const dict = localeDict(this.options.locale);
    const phrase = dict[key] || key;
    const label = this.options.ariaLabel || dict.progress;
    announceMessage(info ? `${label}: ${phrase} — ${info}` : `${label}: ${phrase}`);
  }

  _clearStall() {
    if (this._stallTimer) {
      clearTimeout(this._stallTimer);
      this._timers.delete(this._stallTimer);
      this._stallTimer = null;
    }
  }

  /** (Re)arm the stall detector; fires `stall` + warning after `stallTimeout` of no progress. */
  _scheduleStall() {
    this._clearStall();
    const t = toNum(this.options.stallTimeout);
    if (t <= 0) return;
    this._stallTimer = this._track(
      setTimeout(() => {
        if (this._destroyed || this._state !== 'active') return;
        this._emit('stall', this.stats);
        this.warn(localeDict(this.options.locale).stalled);
      }, t),
    );
  }

  show() {
    if (this._wrapper && this._wrapper.hidden !== false) {
      this._wrapper.hidden = false;
      this._emit('show', true);
    }
    return this;
  }

  hide() {
    if (this._wrapper && this._wrapper.hidden !== true) {
      this._wrapper.hidden = true;
      this._emit('hide', false);
    }
    return this;
  }

  /** Remove DOM, clear timers/listeners, drop from registry, release styles. */
  destroy() {
    if (this._destroyed) return;
    this._flushSave();
    this._emit('destroy', this.id); // fire while the DOM and listeners are still live
    this._destroyed = true;
    this._stopTrickle();
    for (const unbind of this._unbinds.slice()) unbind();
    this._unbinds = [];
    for (const timer of this._timers) clearTimeout(timer);
    this._timers.clear();
    clearTimeout(this._saveTimer);
    this._emitter.clear();
    if (this._wrapper && this._wrapper.parentNode) this._wrapper.parentNode.removeChild(this._wrapper);
    this._wrapper = null;
    this._bar = null;
    this._label = null;
    this._tooltip = null;
    this._messageEl = null;
    this._gradDef = null;
    this._segLayer = null;
    registry.delete(this.id);
    if (isBrowser) releaseBaseStyle();
  }

  /** Pause auto-trickling (the value stays put). Chainable. */
  pause() {
    this._paused = true;
    this._stopTrickle();
    return this;
  }

  /** Resume auto-trickling after {@link pause}. Chainable. */
  resume() {
    this._paused = false;
    if (this._state === 'active') this._startTrickle();
    return this;
  }

  /* ----- trickle -------------------------------------------------------- */

  _startTrickle() {
    if (!this.options.trickle || this._paused || prefersReducedMotion()) return;
    this._stopTrickle();
    const tick = () => {
      if (this._destroyed || this._paused || this._state !== 'active' || this._progress >= 99.4) return;
      this.inc();
      this._trickleTimer = this._track(setTimeout(tick, this.options.trickleSpeed));
    };
    this._trickleTimer = this._track(setTimeout(tick, this.options.trickleSpeed));
  }

  _stopTrickle() {
    if (this._trickleTimer) {
      clearTimeout(this._trickleTimer);
      this._timers.delete(this._trickleTimer);
      this._trickleTimer = null;
    }
  }

  _scheduleAutoDone() {
    if (this._state === 'active') this._stopTrickle();
  }

  /* ----- chainable setters --------------------------------------------- */

  setColor(color) {
    this.options.color = color;
    this._provided.add('color');
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-color', String(color));
    return this;
  }

  setBackground(color) {
    this.options.background = color;
    this._provided.add('background');
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-bg', String(color));
    return this;
  }

  setHeight(px) {
    this.options.height = px;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-height', `${toNum(px)}px`);
    return this;
  }

  setSpeed(ms) {
    this.options.speed = ms;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-speed', `${toNum(ms)}ms`);
    return this;
  }

  /**
   * Set the outer (track) corner radius.
   * @param {...(number|number[]|object)} args one number = all corners;
   *   four numbers = (topLeft, topRight, bottomLeft, bottomRight); or an
   *   array / `{topLeft,...}` object.
   */
  setRadius(...args) {
    this.options.radius = args.length === 1 ? args[0] : args;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-radius', cornersToCss(this.options.radius));
    return this;
  }

  /** Set the inner (bar) corner radius. Same argument shapes as {@link setRadius}. */
  setInnerRadius(...args) {
    this.options.innerRadius = args.length === 1 ? args[0] : args;
    if (this._wrapper) {
      this._wrapper.style.setProperty('--tabar-inner-radius', cornersToCss(this.options.innerRadius));
    }
    return this;
  }

  setLabel(text) {
    this.options.label = text;
    if (this._label) this._label.textContent = String(text == null ? '' : text); // no HTML injection
    return this;
  }

  /**
   * Set the inline status messages map (replaces the current one). Each value is
   * a string or `(percent, bar) => string`; a `default` key covers any state
   * without its own entry. Chainable.
   * @param {Object<string, string|((p:number,bar:Tabar)=>string)>|null} map
   */
  setMessages(map) {
    this.options.messages = map && typeof map === 'object' ? { ...map } : null;
    this._applyMessageStyle();
    this._renderMessage();
    return this;
  }

  /** Set (or clear, with `null`) the message for a single state. Chainable. */
  setMessage(state, value) {
    const map = { ...(this.options.messages || {}) };
    if (value == null) delete map[state];
    else map[state] = value;
    return this.setMessages(map);
  }

  /** The currently-displayed inline message for this state (`''` when none). */
  get message() {
    return this._resolveMessage();
  }

  /**
   * Set the tooltip. Pass `false` to remove it, `true` for a live percentage, a
   * string for fixed text, or `(percent, bar) => string` for custom content.
   * @param {boolean|string|((p:number,bar:Tabar)=>string)} value
   * @param {{always?: boolean}} [opts]
   */
  setTooltip(value, opts = {}) {
    this.options.tooltip = value;
    if (opts.always != null) this.options.tooltipAlways = !!opts.always;
    if (this._wrapper) {
      if (value && !this._tooltip) {
        const tip = document.createElement('div');
        tip.className = `${this.options.classPrefix}__tooltip`;
        tip.setAttribute('data-tooltip-tabar', '');
        tip.setAttribute('role', 'tooltip');
        // Match _build(): circular tips ride the wrapper, linear tips the fill.
        (this.options.shape === 'circular' ? this._wrapper : this._bar).appendChild(tip);
        this._tooltip = tip;
      } else if (!value && this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
      }
      this._applyTooltipState();
      this._renderTooltip(this._progress);
    }
    return this;
  }

  /** Set the secondary color used by the `gradient` theme. */
  setColor2(color) {
    this.options.color2 = color;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-color2', String(color));
    return this;
  }

  /** Switch the preset theme: 'default'|'gradient'|'rainbow'|'stripes'|'glow'|'minimal'. */
  setTheme(name) {
    this.options.theme = name;
    if (this._wrapper) {
      const theme = sanitizeIdent(name, 'default');
      if (theme && theme !== 'default') this._wrapper.setAttribute('data-theme-tabar', theme);
      else this._wrapper.removeAttribute('data-theme-tabar');
      this._applyStripes();
      this._applyFillVar();
    }
    this._emit('theme', this.options.theme);
    return this;
  }

  /**
   * Set a gradient / multicolor fill.
   * @param {Array<string|{color:string,at?:number}>|null} stops colors (or
   *   `{color, at}` stops with positions); `null` clears it.
   * @param {number|{angle?:number,type?:string}} [angleOrOpts] angle in degrees,
   *   or `{ angle, type }` where type is 'linear' | 'radial' | 'conic'.
   */
  setGradient(stops, angleOrOpts) {
    this.options.gradient = Array.isArray(stops) ? stops : null;
    if (typeof angleOrOpts === 'number') {
      this.options.gradientAngle = angleOrOpts;
    } else if (angleOrOpts && typeof angleOrOpts === 'object') {
      if (angleOrOpts.angle != null) this.options.gradientAngle = angleOrOpts.angle;
      if (angleOrOpts.type) this.options.gradientType = angleOrOpts.type;
    }
    this._applyFillVar();
    return this;
  }

  /** Alias of {@link setGradient} for readability. */
  setGradientStops(stops) {
    return this.setGradient(stops);
  }

  /** Edit a single gradient stop's color by index. */
  setColorAt(index, color) {
    if (!Array.isArray(this.options.gradient)) return this;
    const stops = this.options.gradient.slice();
    const cur = stops[index];
    if (cur == null) return this;
    stops[index] = typeof cur === 'object' ? { ...cur, color } : color;
    this.options.gradient = stops;
    this._applyFillVar();
    return this;
  }

  /** Set the gradient angle in degrees. */
  setGradientAngle(deg) {
    this.options.gradientAngle = toNum(deg);
    this._applyFillVar();
    return this;
  }

  /** Set the gradient type: linear|radial|conic|repeating-linear|repeating-radial|repeating-conic. */
  setGradientType(type) {
    this.options.gradientType = type;
    this._applyFillVar();
    return this;
  }

  /** Set the radial gradient shape/size, e.g. 'circle' | 'ellipse' | 'circle 60px'. */
  setGradientShape(shape) {
    this.options.gradientShape = shape || null;
    this._applyFillVar();
    return this;
  }

  /** Set the radial/conic gradient center, e.g. 'center' | '50% 50%' | 'left top'. */
  setGradientPosition(position) {
    this.options.gradientPosition = position || null;
    this._applyFillVar();
    return this;
  }

  /** Set an explicit CSS background for the bar (wins over gradient). `null` clears it. */
  setFill(css) {
    this.options.fill = css || null;
    this._applyFillVar();
    return this;
  }

  /**
   * Set the multi-color stops (alias of `gradient`, takes precedence over it).
   * @param {Array<string|{color:string,at?:number}>|null} colors
   */
  setColors(colors) {
    this.options.colors = Array.isArray(colors) ? colors : null;
    this._applyFillVar();
    return this;
  }

  /** Append a color stop to `colors` (seeded from the effective stops if unset). */
  addColorStop(color, at) {
    const base = Array.isArray(this.options.colors) ? this.options.colors : this._effectiveStops() || [];
    this.options.colors = [...base, at != null ? { color, at } : color];
    this._applyFillVar();
    return this;
  }

  /** Remove the color stop at `index` from `colors`. */
  removeColorStop(index) {
    if (!Array.isArray(this.options.colors)) return this;
    this.options.colors = this.options.colors.filter((_, i) => i !== index);
    this._applyFillVar();
    return this;
  }

  /** Set the multi-color render mode: 'gradient' (blended) | 'bands' (hard blocks). */
  setColorMode(mode) {
    this.options.colorMode = mode === 'bands' ? 'bands' : 'gradient';
    this._applyFillVar();
    return this;
  }

  /** Toggle the scrolling multicolor animation. */
  setColorAnimate(on = true) {
    this.options.colorAnimate = !!on;
    if (this._wrapper) {
      if (on) this._wrapper.setAttribute('data-multicolor-anim-tabar', 'true');
      else this._wrapper.removeAttribute('data-multicolor-anim-tabar');
    }
    return this;
  }

  /** Set the length of a fixed bar along its edge (number → px, string passthrough). */
  setLength(length) {
    this.options.length = length;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-length', toLength(length));
    return this;
  }

  /** Set the inset (px) of a fixed bar from its docked edge. */
  setOffset(px) {
    this.options.offset = toNum(px);
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-offset', `${toNum(px)}px`);
    return this;
  }

  /** Set the circular track ring color. `null` reverts to the faint default. */
  setTrackColor(color) {
    this.options.trackColor = color || null;
    if (this._wrapper) {
      if (color) this._wrapper.style.setProperty('--tabar-track-color', String(color));
      else this._wrapper.style.removeProperty('--tabar-track-color');
    }
    return this;
  }

  /** Set the circular arc stroke-linecap: 'round' | 'butt' | 'square'. */
  setLineCap(cap) {
    this.options.lineCap = cap;
    if (this._bar && this.options.shape === 'circular') this._bar.setAttribute('stroke-linecap', toLinecap(cap));
    return this;
  }

  /** Set the circular arc start angle in degrees (-90 = 12 o'clock). */
  setStartAngle(deg) {
    this.options.startAngle = toNum(deg);
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-start-angle', `${toNum(deg)}deg`);
    return this;
  }

  /** Set the circular sweep direction (false = counter-clockwise). */
  setClockwise(on = true) {
    this.options.clockwise = !!on;
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-flip', (!on) !== this._isRtl() ? '-1' : '1');
    return this;
  }

  /**
   * Toggle the soft glow. Composes with any theme/style. Optionally set the glow
   * color in the same call.
   * @param {boolean} [on]
   * @param {string} [color]
   */
  setGlow(on = true, color) {
    this.options.glow = !!on;
    if (this._wrapper) {
      if (on) this._wrapper.setAttribute('data-glow-tabar', 'true');
      else this._wrapper.removeAttribute('data-glow-tabar');
    }
    if (color != null) this.setGlowColor(color);
    return this;
  }

  /** Set the glow color (independent of the bar color). `null` reverts to the bar color. */
  setGlowColor(color) {
    this.options.glowColor = color || null;
    if (this._wrapper) {
      if (color) this._wrapper.style.setProperty('--tabar-glow', String(color));
      else this._wrapper.style.removeProperty('--tabar-glow');
    }
    return this;
  }

  /** Set the glow radius in px (how far the halo bleeds onto surroundings). */
  setGlowSize(px) {
    this.options.glowSize = toNum(px);
    if (this._wrapper) this._wrapper.style.setProperty('--tabar-glow-size', `${toNum(px)}px`);
    return this;
  }

  /** Toggle the diagonal stripe overlay. */
  setStriped(on = true) {
    this.options.striped = !!on;
    this._applyStripes();
    return this;
  }

  /** Merge new options (object or JSON string) and re-apply theme. Chainable. */
  configure(partial = {}) {
    const cfg = coerceConfig(partial);
    Object.keys(cfg).forEach((k) => this._provided.add(k));
    Object.assign(this.options, cfg);
    this._applyTheme();
    return this;
  }

  /* ----- JSON / AJAX / API ---------------------------------------------- */

  /** Serialize the current config + state to a plain, JSON-safe object. */
  toJSON() {
    const out = {};
    for (const [key, val] of Object.entries(this.options)) {
      if (typeof val === 'function') continue; // drop callbacks
      if (/^on[A-Z]/.test(key)) continue; // drop event-handler slots (even when null)
      // Drop a non-serializable mount target. Guard `Element` — it doesn't exist in Node.
      if (key === 'mountTo' && (val == null || (typeof Element !== 'undefined' && val instanceof Element))) continue;
      out[key] = val;
    }
    out.value = this._progress;
    out.state = this._state;
    return out;
  }

  /** Apply a fetched config object: visual options via configure, then value. */
  _applyConfig(cfg) {
    const config = coerceConfig(cfg);
    const { value } = config;
    this.configure(config);
    if (value != null) {
      this.show();
      this._setState('active');
      this.goto(value, { animate: false });
    }
    return config;
  }

  /**
   * Fetch a JSON config from a URL and apply it. Emits `config`.
   * @returns {Promise<object|null>}
   */
  async loadConfig(url = this.options.configUrl, opts) {
    if (!url) return null;
    try {
      const cfg = await fetchJSON(url, opts || this.options.fetchOptions);
      const applied = this._applyConfig(cfg);
      this._emit('config', applied);
      return applied;
    } catch (err) {
      this._log('config load failed', err);
      this._emit('config', null);
      return null;
    }
  }

  /**
   * POST the current state `{ id, value, state, ts }` to an endpoint. Emits `report`.
   * @returns {Promise<unknown>}
   */
  report(url = this.options.reportUrl, opts) {
    if (!url) return Promise.resolve(null);
    const body = { id: this.id, value: this._progress, state: this._state, ts: Date.now() };
    this._emit('report', body);
    return Promise.resolve(postJSON(url, body, opts || this.options.fetchOptions)).catch((err) => {
      this._log('report failed', err);
      return null;
    });
  }

  /** Wire auto-reporting to the configured endpoint on the chosen events. */
  _setupReporting() {
    if (!this.options.reportUrl) return;
    const events = Array.isArray(this.options.reportOn) && this.options.reportOn.length
      ? this.options.reportOn
      : ['change', 'done'];
    events.forEach((name) => this.on(name, () => this._scheduleReport()));
  }

  /** Debounced report so rapid changes collapse into one request. */
  _scheduleReport() {
    clearTimeout(this._reportTimer);
    this._reportTimer = this._track(setTimeout(() => this.report(), 250));
  }

  /* ----- transfer (upload / download) + ETA ----------------------------- */

  /**
   * Drive the bar from a byte transfer and track speed/ETA. Emits `progress`.
   * @param {number} loaded bytes transferred so far
   * @param {number} [total] total bytes (keeps the previous total when omitted)
   */
  setProgress(loaded, total) {
    if (this._state === 'idle') this._setState('active'); // a transfer is active
    const x = this._xfer;
    x.loaded = Math.max(0, toNum(loaded));
    if (total != null) x.total = Math.max(0, toNum(total));
    const t = Date.now();
    if (x.startedAt == null) x.startedAt = t;
    if (x.last) {
      const dt = (t - x.last.t) / 1000;
      if (dt > 0) {
        const inst = (x.loaded - x.last.loaded) / dt; // bytes/sec
        x.speed = x.speed > 0 ? x.speed * 0.7 + inst * 0.3 : inst; // EMA smoothing
      }
    }
    x.last = { t, loaded: x.loaded };
    this.goto(x.total > 0 ? x.loaded / x.total : 0);
    this._scheduleStall(); // reset the stall timer on every byte of progress
    this._emit('progress', this.stats);
    return this;
  }

  /** Reset transfer tracking (speed/ETA/elapsed). */
  _resetXfer() {
    this._xfer = { loaded: 0, total: 0, startedAt: null, last: null, speed: 0 };
  }

  /**
   * Track an XMLHttpRequest's progress (upload or download), incl. start/done/reset.
   * @param {XMLHttpRequest} xhr
   * @param {{direction?: 'upload'|'download', retry?: Function}} [opts]
   */
  trackXHR(xhr, { direction = 'download', retry } = {}) {
    if (typeof retry === 'function') this.retryWith(retry);
    const source = direction === 'upload' ? xhr.upload : xhr;
    this.start();
    source.addEventListener('progress', (e) => {
      if (e.lengthComputable) this.setProgress(e.loaded, e.total);
      else if (this._state !== 'indeterminate') this.indeterminate(true);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 400) this.error(`HTTP ${xhr.status}`);
      else this.done();
    });
    xhr.addEventListener('error', () => this.error('network error'));
    xhr.addEventListener('abort', () => this.reset());
    return this;
  }

  /**
   * Track a fetch download. Returns a clone of the Response whose body streams
   * through the bar; consume the clone (`.blob()`, `.json()`, …) as usual.
   * @param {Response} response
   * @param {{retry?: Function}} [opts]
   * @returns {Response}
   */
  trackResponse(response, { retry } = {}) {
    if (typeof retry === 'function') this.retryWith(retry);
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body || typeof ReadableStream !== 'function') return response;
    this.start();
    if (!total) this.indeterminate(true);
    const reader = response.body.getReader();
    let loaded = 0;
    const bar = this;
    const stream = new ReadableStream({
      start(controller) {
        const pump = () =>
          reader.read().then(({ done, value }) => {
            if (done) {
              bar.done();
              controller.close();
              return;
            }
            loaded += value.length;
            if (total) bar.setProgress(loaded, total);
            controller.enqueue(value);
            pump();
          }).catch((err) => {
            bar._log('download stream failed', err);
            bar.error(err && err.message);
            controller.error(err);
          });
        pump();
      },
    });
    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  /* ----- reactivity ----------------------------------------------------- */

  /**
   * Bind the bar to an external value source so it updates reactively. Returns
   * an unbind function (also auto-cleaned on destroy).
   * @param {() => number} getter returns a value (fraction or absolute)
   * @param {{event?: string, target?: EventTarget, interval?: number}} [opts]
   * @returns {() => void}
   */
  bind(getter, opts = {}) {
    if (typeof getter !== 'function') return () => {};
    const apply = () => {
      const v = getter();
      if (v != null) this.set(v);
    };
    let teardown = () => {};
    if (opts.target && opts.event) {
      opts.target.addEventListener(opts.event, apply);
      teardown = () => opts.target.removeEventListener(opts.event, apply);
    } else if (opts.interval) {
      // Not _track()ed: destroy() runs the unbinds (below) first, which clears
      // this interval with clearInterval — the correct clearer for an interval.
      const id = setInterval(apply, opts.interval);
      teardown = () => clearInterval(id);
    }
    apply();
    const unbind = () => {
      teardown();
      this._unbinds = this._unbinds.filter((u) => u !== unbind);
    };
    this._unbinds.push(unbind);
    return unbind;
  }

  /* ----- value accessors ------------------------------------------------ */

  /** Live transfer stats: loaded, total, percent, speed (B/s), eta (s|null), elapsed (s). */
  get stats() {
    const x = this._xfer;
    const remaining = x.total - x.loaded;
    let eta = null;
    if (x.total > 0 && x.loaded >= x.total) eta = 0;
    else if (x.speed > 0 && remaining > 0) eta = remaining / x.speed;
    return {
      loaded: x.loaded,
      total: x.total,
      percent: this._progress,
      speed: x.speed,
      eta,
      elapsed: x.startedAt != null ? (Date.now() - x.startedAt) / 1000 : 0,
    };
  }

  /** Current progress as a percentage [0,100]. */
  get value() {
    return this._progress;
  }

  /** Current state: 'idle' | 'active' | 'done' | 'indeterminate'. */
  get state() {
    return this._state;
  }

  /** Whether the bar is currently visible. */
  get visible() {
    return !!this._wrapper && this._wrapper.hidden === false;
  }

  /** Whether the bar has reached 100%. */
  get complete() {
    return this._progress >= 100;
  }

  /** Number of times {@link retry} has been invoked. */
  get attempts() {
    return this._attempts || 0;
  }

  /* ----- persistence ---------------------------------------------------- */

  _resolvePersist(persist) {
    if (!persist) return null;
    const cfg = persist === true ? {} : persist;
    return {
      key: sanitizeIdent(cfg.key, '') || this.options.id,
      storage: cfg.storage === 'session' ? 'session' : 'local',
      mode: ['value', 'task', 'both'].includes(cfg.mode) ? cfg.mode : 'value',
      ttl: Number.isFinite(cfg.ttl) ? cfg.ttl : 0,
      debounce: Number.isFinite(cfg.debounce) ? cfg.debounce : 200,
      keepOnDone: !!cfg.keepOnDone,
    };
  }

  _valueKey() {
    return `tabar:${this._persist.key}`;
  }

  _save() {
    if (!this._persist || !this._store) return;
    if (this._persist.mode === 'task') return; // task mode persists explicitly
    clearTimeout(this._saveTimer);
    if (this._persist.debounce <= 0) {
      writeState(this._store, this._valueKey(), { value: this._progress });
      return;
    }
    this._saveTimer = this._track(
      setTimeout(() => {
        if (this._destroyed) return; // don't write after teardown
        writeState(this._store, this._valueKey(), { value: this._progress });
      }, this._persist.debounce),
    );
  }

  /** Flush any pending debounced value write immediately. */
  _flushSave() {
    if (!this._persist || !this._store || this._persist.mode === 'task') return;
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      writeState(this._store, this._valueKey(), { value: this._progress });
    }
  }

  _clearSaved() {
    if (!this._persist || !this._store) return;
    clearTimeout(this._saveTimer);
    if (this._persist.mode !== 'task') removeState(this._store, this._valueKey());
  }

  _restore() {
    if (!this._persist || !this._store) return;
    const { mode, key, ttl } = this._persist;

    if (mode === 'value' || mode === 'both') {
      const saved = readState(this._store, this._valueKey(), ttl);
      if (saved && saved.value > 0) {
        this.show();
        this._setState(saved.value >= 100 ? 'done' : 'active'); // keep a completed bar's state
        this.goto(saved.value / 100, { animate: false });
      }
    }

    if (mode === 'task' || mode === 'both') {
      const saved = readState(this._store, `tabar:task:${key}`, ttl);
      if (saved) this._emit('resume', { value: saved.value, meta: saved.meta });
    }
  }

  /**
   * Named long-running task helper for resuming across reloads.
   * @param {string} name
   */
  task(name) {
    const store = this._store || getStorage(this._persist ? this._persist.storage : 'local');
    const ttl = this._persist ? this._persist.ttl : 0;
    const key = `tabar:task:${sanitizeIdent(name, 'default')}`;
    return {
      save: (progress, meta) => {
        const value = normalizeValue(progress, this.options.max);
        writeState(store, key, { value: value == null ? 0 : value, meta });
        return this;
      },
      load: () => readState(store, key, ttl),
      clear: () => removeState(store, key),
    };
  }
}

/** Global debug switch — logs lifecycle for every instance when true. */
Tabar.debug = false;

/** Library version (replaced at build time). */
Tabar.version = VERSION;

/** Format a byte count, e.g. `Tabar.formatBytes(1536)` -> "1.5 KB". */
Tabar.formatBytes = formatBytes;

/** Format a duration in seconds, e.g. `Tabar.formatDuration(75)` -> "1m 15s". */
Tabar.formatDuration = formatDuration;

/** Register or extend a locale: `Tabar.addLocale('de', { bytes:[…], min:'Min', … })`. */
Tabar.addLocale = (code, dict) => {
  locales[code] = { ...locales.en, ...(locales[code] || {}), ...(dict || {}) };
  return Tabar;
};

/** Read a locale's dictionary (defaults to the active locale). */
Tabar.getLocale = (code) => ({ ...localeDict(code) });

/** The active locale code. Assigning an unknown code is ignored. */
Object.defineProperty(Tabar, 'locale', {
  get: () => activeLocale,
  set: (code) => {
    if (locales[code]) activeLocale = code;
  },
});

/** Factory helper. Equivalent to `new Tabar(options)`. */
export function createTabar(options) {
  return new Tabar(options);
}

export { Tabar, Emitter };
export default Tabar;
