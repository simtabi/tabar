/**
 * <tabar-bar> — a Web Component wrapper around Tabar.
 *
 *   import '@simtabi/tabar/element';
 *   <tabar-bar value="0.4" color="#e91e63" theme="gradient" height="8"></tabar-bar>
 *
 * Config is read from attributes (kebab-case → camelCase). The full instance is
 * available as `el.bar`, and Tabar's `tabar:*` events bubble out of the element.
 */
import Tabar from './tabar.js';

const NUMERIC = new Set([
  'value', 'height', 'size', 'speed', 'min', 'max', 'gradientAngle', 'trickleSpeed',
  'stallTimeout', 'errorTimeout',
]);
const BOOLEAN = new Set(['glow', 'striped', 'trickle', 'showPeg', 'showLabel', 'persist', 'announce']);

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const coerceAttr = (key, value) => {
  if (value == null) return undefined;
  if (BOOLEAN.has(key)) return value !== 'false';
  if (NUMERIC.has(key)) return Number(value);
  if (key === 'gradient') return value.split(',').map((c) => c.trim()); // "a,b,c"
  if (key === 'segments') {
    try {
      return JSON.parse(value); // '[{"value":0.5,"color":"#f00"}, ...]'
    } catch {
      return undefined;
    }
  }
  return value;
};

export class TabarElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'value', 'color', 'color2', 'background', 'theme', 'position', 'shape', 'size', 'height',
      'radius', 'inner-radius', 'speed', 'glow', 'striped', 'gradient',
      'gradient-type', 'gradient-angle', 'gradient-shape', 'gradient-position', 'label',
      'direction', 'locale', 'persist', 'config-url', 'report-url',
      'segments', 'segment-mode', 'aggregate', 'announce', 'stall-timeout', 'error-timeout',
    ];
  }

  /** Build a config object from the current attributes. */
  _config() {
    const cfg = {};
    for (const name of this.getAttributeNames()) {
      const key = toCamel(name);
      const v = coerceAttr(key, this.getAttribute(name));
      if (v !== undefined) cfg[key] = v;
    }
    return cfg;
  }

  connectedCallback() {
    if (this._bar) return;
    const cfg = this._config();
    const { value, ...rest } = cfg;
    this._bar = new Tabar({ ...rest, position: rest.position || 'inline', mountTo: this });
    if (value != null) this._bar.set(value);
    else this._bar.show();
  }

  disconnectedCallback() {
    this._bar?.destroy();
    this._bar = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._bar || oldValue === newValue) return;
    const key = toCamel(name);
    const coerced = coerceAttr(key, newValue);
    if (key === 'value') this._bar.set(coerced);
    else if (key === 'segments') this._bar.setSegments(coerced || []);
    else this._bar.configure({ [key]: coerced });
  }

  /** The underlying Tabar instance (full API). */
  get bar() {
    return this._bar;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('tabar-bar')) {
  customElements.define('tabar-bar', TabarElement);
}

export default TabarElement;
