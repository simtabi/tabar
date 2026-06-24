/**
 * TabarGroup — a parent task that holds many child bars (one progress each) and
 * an auto-aggregated "overall" bar. Ideal for parallel uploads/downloads or a
 * multi-step pipeline where one task has many statuses.
 *
 *   import { TabarGroup } from '@simtabi/tabar/group';
 *   const group = new TabarGroup({ mountTo: '#downloads' });
 *   const a = group.add({ label: 'file-a.zip' });
 *   a.setProgress(loaded, total);   // overall updates automatically
 */
import { Tabar, Emitter } from './tabar.js';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let groupUid = 0;

export class TabarGroup {
  /**
   * @param {object} [options]
   * @param {string|Element} [options.mountTo] where to render (browser)
   * @param {'weighted'|'avg'|'sum'|'max'} [options.aggregate='weighted'] overall strategy
   * @param {object} [options.overall] options for the aggregated overall bar
   * @param {object} [options.child] default options merged into every child
   */
  constructor(options = {}) {
    this.id = options.id || `tabar-group-${(groupUid += 1)}`;
    this.options = { aggregate: 'weighted', ...options };
    this._children = new Map();
    this._emitter = new Emitter();
    this._childList = null;
    this._completed = false; // latch so 'done' fires once per completion

    if (isBrowser) {
      const host =
        options.mountTo instanceof Element
          ? options.mountTo
          : (typeof options.mountTo === 'string' && document.querySelector(options.mountTo)) || document.body;
      const wrapper = document.createElement('div');
      wrapper.className = 'tabar-group';
      wrapper.setAttribute('data-tabar-group', this.id);
      const overallHost = document.createElement('div');
      overallHost.className = 'tabar-group__overall';
      const list = document.createElement('div');
      list.className = 'tabar-group__children';
      wrapper.append(overallHost, list);
      host.appendChild(wrapper);
      this._wrapper = wrapper;
      this._childList = list;
      this._overall = new Tabar({
        showLabel: true,
        labelFormat: (p) => `${Math.round(p)}%`,
        ...(options.overall || {}),
        position: 'inline',
        mountTo: overallHost,
        trickle: false,
      });
      this._overall.show();
    } else {
      // Headless: still aggregate values for CLI/programmatic use.
      this._overall = new Tabar({ ...(options.overall || {}), trickle: false });
    }
  }

  /**
   * Add a child bar (its own progress/status). Returns the child Tabar.
   * `childOpts.weight` (a positive number) weights it in the overall aggregate;
   * otherwise children are weighted by their transfer `total`, else equally.
   */
  add(childOpts = {}) {
    let mount;
    if (isBrowser) {
      mount = document.createElement('div');
      mount.className = 'tabar-group__child';
      this._childList.appendChild(mount);
    }
    const { weight, ...rest } = childOpts;
    const child = new Tabar({
      showLabel: true,
      labelFormat: (p) => `${Math.round(p)}%`,
      // Group children persist at their final value: auto-hiding would reset a
      // completed child to 0 (dropping the aggregate) and leave an empty reserved
      // row. Opt back in per-child with `autoHide: true` if you really want that.
      autoHide: false,
      ...(this.options.child || {}),
      ...rest,
      position: 'inline',
      mountTo: mount,
      trickle: false,
    });
    if (Number.isFinite(weight) && weight > 0) child._groupWeight = weight;
    if (isBrowser) child.show();
    this._children.set(child.id, child);
    this._completed = false; // a fresh, incomplete child re-arms the 'done' latch
    // Re-aggregate and bubble child lifecycle as `child:<event>`.
    ['change', 'progress', 'done', 'error', 'reset'].forEach((e) =>
      child.on(e, (payload) => {
        this._sync();
        this._emitter.emit(`child:${e}`, payload, child);
        if (this._allDone()) {
          if (!this._completed) {
            this._completed = true;
            this._emitter.emit('done', 100, this); // fire exactly once per completion
          }
        } else {
          this._completed = false; // a child dropped below 100% — re-arm
        }
      }),
    );
    this._sync();
    return child;
  }

  /** Remove and destroy a child by id. */
  remove(id) {
    const child = this._children.get(id);
    if (!child) return this;
    const mount = child._wrapper && child._wrapper.parentNode;
    child.destroy();
    if (mount && mount.parentNode) mount.parentNode.removeChild(mount);
    this._children.delete(id);
    this._sync();
    return this;
  }

  /** @returns {Tabar | undefined} */
  child(id) {
    return this._children.get(id);
  }

  /** Merge default options applied to future child bars. Chainable. */
  setChildDefaults(opts) {
    this.options.child = { ...(this.options.child || {}), ...(opts || {}) };
    return this;
  }

  /** Update the overall bar's options live (e.g. color/theme). Chainable. */
  setOverallDefaults(opts) {
    this.options.overall = { ...(this.options.overall || {}), ...(opts || {}) };
    if (this._overall) this._overall.configure(opts || {});
    return this;
  }

  /** @returns {Tabar[]} */
  get children() {
    return [...this._children.values()];
  }

  /** The aggregated overall bar. */
  get overall() {
    return this._overall;
  }

  /** Aggregate percentage [0,100] across children. */
  get value() {
    return this._overall.value;
  }

  on(name, handler) {
    this._emitter.on(name, handler);
    return this;
  }

  off(name, handler) {
    this._emitter.off(name, handler);
    return this;
  }

  _allDone() {
    const kids = this.children;
    return kids.length > 0 && kids.every((c) => c.complete);
  }

  /** Recompute the overall value from the children. */
  _sync() {
    const kids = this.children;
    if (!kids.length) {
      this._overall.set(0, { animate: false });
      return;
    }
    const strategy = this.options.aggregate;
    const weight = (c) => c._groupWeight || c.stats.total || 1;
    let pct;
    if (strategy === 'max') pct = Math.max(...kids.map((c) => c.value));
    else if (strategy === 'sum') pct = Math.min(100, kids.reduce((a, c) => a + c.value, 0));
    else if (strategy === 'avg') pct = kids.reduce((a, c) => a + c.value, 0) / kids.length;
    else {
      const total = kids.reduce((a, c) => a + weight(c), 0) || 1; // weighted (default)
      pct = kids.reduce((a, c) => a + weight(c) * c.value, 0) / total;
    }
    this._overall.set(pct / 100);
    this._emitter.emit('change', this._overall.value, this);
  }

  destroy() {
    for (const child of this._children.values()) child.destroy();
    this._children.clear();
    this._overall.destroy();
    this._emitter.clear();
    if (this._wrapper && this._wrapper.parentNode) this._wrapper.parentNode.removeChild(this._wrapper);
    this._wrapper = null;
  }
}

export default TabarGroup;
