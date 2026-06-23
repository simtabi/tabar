/**
 * Shared attribute plumbing for the two declarative-config paths:
 *   • the <tabar-bar> Web Component (bare attributes), and
 *   • plain `new Tabar({ mountTo })` reading `data-tabar-*` off the mount element.
 *
 * Keeping the coercion + the attribute list here is the single source of truth,
 * so the two paths can never drift. All names are kebab-case (HTML attributes);
 * `toCamel` maps them to the camelCase Tabar option keys.
 */

/** Option keys whose attribute value is parsed as a Number (empty → unset). */
export const NUMERIC = new Set([
  'value', 'size', 'speed', 'zIndex', 'max', 'minimum',
  'gradientAngle', 'trickleSpeed', 'stallTimeout', 'errorTimeout', 'autoHideDelay',
  'offset', 'glowSize', 'startAngle',
]);

// Dimensions that accept a number (→ px) OR a CSS length string (e.g. '100%').
const DIMENSION = new Set(['height']);

/** Option keys treated as booleans (any value except the string `"false"` → true). */
export const BOOLEAN = new Set([
  'glow', 'striped', 'stripeAnimate', 'trickle', 'showLabel', 'announce',
  'autoShow', 'autoHide', 'tooltipAlways', 'colorAnimate', 'clockwise', 'debug',
]);

export const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Coerce a raw attribute string into the right JS type for its option.
 * Returns `undefined` to mean "leave unset" (so the option's default stands).
 */
export const coerceAttr = (key, value) => {
  if (value == null) return undefined;
  // persist / tooltip: a bare or "true" attribute enables it; "false" disables;
  // persist additionally accepts a JSON object, tooltip a fixed string.
  if (key === 'persist') {
    if (value === '' || value === 'true') return true;
    if (value === 'false') return false;
    try {
      return JSON.parse(value); // '{"storage":"session","ttl":3600000}'
    } catch {
      return true;
    }
  }
  if (key === 'tooltip') {
    if (value === '' || value === 'true') return true;
    if (value === 'false') return false;
    return value; // a fixed tooltip string
  }
  if (BOOLEAN.has(key)) return value !== 'false';
  if (DIMENSION.has(key)) {
    // A bare number is px; anything else (e.g. '100%', '2rem') passes through.
    const n = Number(value);
    return value.trim() !== '' && Number.isFinite(n) ? n : value;
  }
  if (NUMERIC.has(key)) return value === '' ? undefined : Number(value); // empty numeric → unset
  if (key === 'gradient' || key === 'colors') return value.split(',').map((c) => c.trim()).filter(Boolean);
  if (key === 'segments' || key === 'messages') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
};

/**
 * Every recognized attribute (kebab-case). Drives the Web Component's
 * `observedAttributes` AND the `data-tabar-*` allowlist for plain mounts, so a
 * typo'd or unrelated `data-*` attribute is ignored rather than misread.
 * Note: function-valued options (`labelFormat`, function `tooltip`/`messages`)
 * can't be expressed as attributes — booleans/numbers/strings/CSV/JSON only.
 */
export const ATTR_NAMES = [
  'value', 'color', 'color2', 'background', 'theme', 'position', 'shape', 'size', 'height',
  'radius', 'inner-radius', 'speed', 'z-index',
  'glow', 'glow-color', 'glow-size', 'striped', 'stripe-animate',
  'gradient', 'gradient-type', 'gradient-angle', 'gradient-shape', 'gradient-position', 'fill',
  'colors', 'color-mode', 'color-animate', 'track-color', 'line-cap', 'start-angle', 'clockwise',
  'length', 'offset', 'label', 'show-label', 'direction', 'locale', 'aria-label',
  'max', 'minimum', 'trickle', 'trickle-speed', 'auto-show', 'auto-hide', 'auto-hide-delay',
  'tooltip', 'tooltip-always', 'message-align', 'message-color', 'messages',
  'persist', 'config-url', 'report-url', 'segments', 'segment-mode', 'aggregate',
  'announce', 'stall-timeout', 'error-timeout', 'debug',
];

/** camelCase option keys that may be set via attribute / data-attribute. */
const KNOWN_KEYS = new Set(ATTR_NAMES.map(toCamel));

/**
 * Read `data-tabar-*` configuration off a mount element for plain
 * `new Tabar({ mountTo })`. Only recognized keys are accepted; unknown
 * `data-tabar-*` attributes are ignored. Returns a partial options object.
 */
export const readDataAttrs = (el) => {
  const cfg = {};
  if (!el || typeof el.getAttributeNames !== 'function') return cfg;
  const PREFIX = 'data-tabar-';
  for (const name of el.getAttributeNames()) {
    if (!name.startsWith(PREFIX)) continue;
    const key = toCamel(name.slice(PREFIX.length));
    if (!KNOWN_KEYS.has(key)) continue;
    const v = coerceAttr(key, el.getAttribute(name));
    if (v !== undefined) cfg[key] = v;
  }
  return cfg;
};
