/**
 * Type declarations for Tabar.
 * @see https://opensource.simtabi.com/documentation/tabar
 */

export type TabarShape = 'linear' | 'circular';
export type TabarPosition =
  | 'top' | 'bottom' | 'left' | 'right' | 'inline'
  | 'top-center' | 'bottom-center' | 'left-center' | 'right-center';

export type TabarColorMode = 'gradient' | 'bands';
export type TabarLineCap = 'round' | 'butt' | 'square';
export type TabarDirection = 'ltr' | 'rtl';
export type TabarOrientation = 'horizontal' | 'vertical';
export type TabarState =
  | 'idle'
  | 'active'
  | 'done'
  | 'indeterminate'
  | 'error'
  | 'warning'
  | 'success';

/** A locale dictionary for built-in strings. */
export interface TabarLocaleDict {
  bytes: string[];
  hour: string;
  min: string;
  sec: string;
  lessThan: string;
  progress: string;
  complete?: string;
  error?: string;
  stalled?: string;
  loading?: string;
  /** Marks a right-to-left locale (mirrors fills + circular sweep). */
  rtl?: boolean;
}

/** A segment in multi-progress (chunked/overlay) mode. */
export interface TabarSegment {
  id?: string;
  value: number;
  color?: string;
  label?: string;
  weight?: number;
  status?: string;
}
export type TabarSegmentMode = 'stacked' | 'overlay';
export type TabarAggregate = 'weighted' | 'sum' | 'avg' | 'max' | 'primary';
export type TabarTheme = 'default' | 'gradient' | 'rainbow' | 'stripes' | 'glow' | 'minimal';
export type TabarStorage = 'local' | 'session';
export type TabarPersistMode = 'value' | 'task' | 'both';

/** A corner radius: one number (all corners), a `[tl, tr, bl, br]` tuple, or an object. */
export type TabarCorners =
  | number
  | [number, number, number, number]
  | {
      topLeft?: number;
      topRight?: number;
      bottomLeft?: number;
      bottomRight?: number;
    };

export interface TabarPersistOptions {
  /** Storage key suffix. Defaults to the instance id. Sanitized to [A-Za-z0-9_-]. */
  key?: string;
  /** Which Web Storage to use. Default: 'local'. */
  storage?: TabarStorage;
  /** 'value' auto-restores the last percentage; 'task' resumes a named task; 'both' does both. */
  mode?: TabarPersistMode;
  /** Expire stored state after this many milliseconds. 0 = never. */
  ttl?: number;
  /** Debounce window (ms) for value-mode writes. Default: 200. */
  debounce?: number;
  /** Keep the saved value after `done()` instead of clearing it. */
  keepOnDone?: boolean;
}

/** State returned to the `resume` event / `onResume` callback in task mode. */
export interface TabarResumeState {
  value: number;
  meta?: unknown;
  ts?: number;
}

/** Handle for reading/writing a named long-running task's progress. */
export interface TabarTask {
  save(progress: number, meta?: unknown): Tabar;
  load(): TabarResumeState | null;
  clear(): void;
}

/** Live transfer statistics from `setProgress` / `trackXHR` / `trackResponse`. */
export interface TabarStats {
  loaded: number;
  total: number;
  percent: number;
  /** Smoothed speed in bytes/second. */
  speed: number;
  /** Estimated seconds remaining, `0` at completion, or `null` when unknown. */
  eta: number | null;
  /** Seconds since tracking started. */
  elapsed: number;
}

export type TabarEventName =
  | 'start'
  | 'change'
  | 'done'
  | 'reset'
  | 'resume'
  | 'show'
  | 'hide'
  | 'indeterminate'
  | 'theme'
  | 'destroy'
  | 'config'
  | 'report'
  | 'progress'
  | 'error'
  | 'warning'
  | 'success'
  | 'retry'
  | 'stall';
export type TabarHandler = (payload: unknown, bar: Tabar) => void;
/** Unsubscribe function returned by the static bus `Tabar.on`/`Tabar.once`. */
export type TabarUnsubscribe = () => void;

export type TabarGradientStop = string | { color: string; at?: number };
export type TabarGradientType =
  | 'linear'
  | 'radial'
  | 'conic'
  | 'repeating-linear'
  | 'repeating-radial'
  | 'repeating-conic';

/** A tiny event bus (also exported standalone). */
export declare class Emitter {
  on(name: string, handler: (...args: unknown[]) => void): TabarUnsubscribe;
  once(name: string, handler: (...args: unknown[]) => void): TabarUnsubscribe;
  off(name?: string, handler?: (...args: unknown[]) => void): void;
  emit(name: string, ...args: unknown[]): void;
  clear(): void;
}

export interface TabarOptions {
  /** Unique id. Auto-generated when omitted. Sanitized to [A-Za-z0-9_-]. */
  id?: string;
  /** Class/attribute namespace. Default: 'tabar'. Sanitized to [A-Za-z0-9_-]. */
  classPrefix?: string;
  /** Where to mount: a CSS selector or Element. Default: document.body. */
  mountTo?: string | Element | null;
  /** Linear bar or circular ring. Default: 'linear'. */
  shape?: TabarShape;
  /** Circular ring diameter in px (ignored for linear). Default: 64. */
  size?: number;
  /**
   * Edge dock for fixed bars: `top`/`bottom`/`left`/`right`, their centered
   * `*-center` variants, or `inline`. Default: 'top'.
   */
  position?: TabarPosition;
  /** Length of a fixed bar along its edge (number → px, string passthrough). Default: '100%'. */
  length?: number | string;
  /** Inset (px) of a fixed bar from its docked edge. Default: 0. */
  offset?: number;
  /** Fill direction for horizontal bars. Default: 'ltr'. */
  direction?: TabarDirection;

  /** Circular track ring color. Defaults to a faint neutral. */
  trackColor?: string | null;
  /** Circular arc stroke-linecap. Default: 'round'. */
  lineCap?: TabarLineCap;
  /** Circular arc start angle in degrees (-90 = 12 o'clock). Default: -90. */
  startAngle?: number;
  /** Circular sweep direction (false = counter-clockwise). Default: true. */
  clockwise?: boolean;

  /** Bar fill color (any CSS color). Default: '#29d'. */
  color?: string;
  /** Secondary color used by the `gradient` theme. Default: '#7c4dff'. */
  color2?: string;
  /** Track background. Default: 'transparent'. */
  background?: string;
  /**
   * Bar thickness — height for horizontal bars, width for vertical. A number is
   * px; a CSS length string (`'0.5rem'`, `'100%'`, `'2vh'`, `calc(...)`) is
   * honored verbatim, so a linear bar can scale with type (`rem`/`em`) or fill
   * its host (`'100%'`). For circular bars this is the ring stroke thickness
   * (numeric px). Default: 6.
   */
  height?: number | string;
  /** Outer (track) corner radius. */
  radius?: TabarCorners;
  /** Inner (bar) corner radius. */
  innerRadius?: TabarCorners;
  /** Transition duration in ms. Default: 300. */
  speed?: number;
  /** z-index for fixed bars. Default: 1031. */
  zIndex?: number;

  /** Preset look. Default: 'default'. */
  theme?: TabarTheme;
  /** Multi-color stops (alias of `gradient`, takes precedence). Strings or `{ color, at }`. */
  colors?: TabarGradientStop[] | null;
  /** Multi-color render mode: 'gradient' (blended) or 'bands' (hard blocks). Default: 'gradient'. */
  colorMode?: TabarColorMode;
  /** Animate the multicolor fill (scrolling). Default: false. */
  colorAnimate?: boolean;
  /** Color stops → a gradient (multicolor) fill. Strings or `{ color, at }` stops. */
  gradient?: TabarGradientStop[] | null;
  /** Gradient type. Default: 'linear'. */
  gradientType?: TabarGradientType;
  /** Gradient angle in degrees (linear/conic); auto by orientation when omitted. */
  gradientAngle?: number | null;
  /** Radial gradient shape/size, e.g. 'circle' | 'ellipse' | 'circle 60px'. */
  gradientShape?: string | null;
  /** Radial/conic gradient center, e.g. 'center' | '50% 50%' | 'left top'. */
  gradientPosition?: string | null;
  /** Explicit CSS background for the bar (wins over `gradient`). */
  fill?: string | null;
  /** Soft glow around the bar (composes with any theme). Default: false. */
  glow?: boolean;
  /** Glow color; defaults to the bar color when omitted. */
  glowColor?: string | null;
  /** Glow radius in px (how far the halo bleeds). Default: 8. */
  glowSize?: number;
  /** Diagonal stripe overlay. Default: false. */
  striped?: boolean;
  /** Animate the stripes when `striped`. Default: true. */
  stripeAnimate?: boolean;
  /** Initial value to show on construct (fraction or absolute). */
  value?: number | null;

  /** Multi-progress segments (chunked upload/download, multi-stage, buffered/played). */
  segments?: TabarSegment[] | null;
  /** Segment layout. Default: 'stacked'. */
  segmentMode?: TabarSegmentMode;
  /** How segments aggregate into the bar's value. Default by mode. */
  aggregate?: TabarAggregate;

  /**
   * Inline status messages shown ON the bar, keyed by state (`active`, `done`,
   * `error`, `warning`, `success`, `indeterminate`, `idle`). Each value is a
   * string or `(percent, bar) => string`; a `default` key covers any state
   * without its own entry.
   */
  messages?: Record<string, string | ((percent: number, bar: Tabar) => string)> | null;
  /** Inline message alignment. Default: 'center'. */
  messageAlign?: 'start' | 'center' | 'end';
  /** CSS color for the inline message (defaults to white + shadow). */
  messageColor?: string | null;

  /** Announce state changes to screen readers (shared aria-live region). Default: true. */
  announce?: boolean;
  /** Ms with no progress while active before `stall` + warning. 0 = off. */
  stallTimeout?: number;
  /** Ms after which an error auto-clears. 0 = off. */
  errorTimeout?: number;

  /** Value scale; `set(max)` === 100%. Default: 100. */
  max?: number;
  /** Floor fraction applied by `start()`. Default: 0.08. */
  minimum?: number;
  /** Auto-increment while pending. Default: true. */
  trickle?: boolean;
  /** Milliseconds between trickle ticks. Default: 200. */
  trickleSpeed?: number;

  /** Render a text label. Default: false. */
  showLabel?: boolean;
  /** Static label text (rendered as plain text). */
  label?: string;
  /** Live label: `(percent, bar) => string`, updated on every change. */
  labelFormat?: ((percent: number, bar: Tabar) => string) | null;
  /** Auto-show the bar when its value goes above 0. Default: true. */
  autoShow?: boolean;
  /** Tooltip: `true` for live %, a string, or `(percent, bar) => string`. Default: false. */
  tooltip?: boolean | string | ((percent: number, bar: Tabar) => string);
  /** Keep the tooltip visible instead of on hover/focus. Default: false. */
  tooltipAlways?: boolean;

  /** Hide + reset after `done()`. Default: true. */
  autoHide?: boolean;
  /** Linger at 100% for this many ms before hiding. Default: 350. */
  autoHideDelay?: number;

  /** Override the global `Tabar.locale` for this instance. */
  locale?: string | null;
  /** Accessible name. Defaults to the locale's "progress" string. */
  ariaLabel?: string | null;
  /** Id of an element labelling the bar (takes precedence over ariaLabel). */
  ariaLabelledBy?: string | null;

  /** State persistence. `true` enables value mode with defaults. */
  persist?: boolean | TabarPersistOptions;

  /** GET a JSON config from this URL on construct. */
  configUrl?: string | null;
  /** POST `{ id, value, state }` to this URL. */
  reportUrl?: string | null;
  /** Events that trigger a report (default `['change','done']`). */
  reportOn?: TabarEventName[] | null;
  /** Extra options forwarded to `fetch()` for config/report. */
  fetchOptions?: RequestInit | null;

  /** Log warnings/errors to the console. Default: false. */
  debug?: boolean;

  onStart?: TabarHandler | null;
  onChange?: TabarHandler | null;
  onDone?: TabarHandler | null;
  onReset?: TabarHandler | null;
  onResume?: TabarHandler | null;
  onShow?: TabarHandler | null;
  onHide?: TabarHandler | null;
  onIndeterminate?: TabarHandler | null;
  onTheme?: TabarHandler | null;
  onDestroy?: TabarHandler | null;
  onConfig?: TabarHandler | null;
  onReport?: TabarHandler | null;
  onProgress?: TabarHandler | null;
  onError?: TabarHandler | null;
  onWarning?: TabarHandler | null;
  onSuccess?: TabarHandler | null;
  onStall?: TabarHandler | null;
  onRetry?: TabarHandler | null;
}

export interface TabarGotoOptions {
  /** Override the transition duration (ms) for this move only. */
  duration?: number;
  /** Set to false to jump without animating. Default: true. */
  animate?: boolean;
}

export declare class Tabar {
  constructor(options?: TabarOptions);

  readonly id: string;
  readonly options: Required<TabarOptions>;
  /** Current progress as a percentage [0,100]. */
  readonly value: number;
  readonly state: TabarState;
  /** Whether the bar is currently visible. */
  readonly visible: boolean;
  /** Whether the bar has reached 100%. */
  readonly complete: boolean;
  /** Number of times retry() has run. */
  readonly attempts: number;
  /** Live transfer statistics (loaded/total/percent/speed/eta/elapsed). */
  readonly stats: TabarStats;
  /** Current segments (empty when not in segment mode). */
  readonly segments: TabarSegment[];
  /** The inline message currently shown for this state (`''` when none). */
  readonly message: string;

  // Read-only getters for every option (current configured value).
  readonly color: string;
  readonly color2: string;
  readonly background: string;
  readonly height: number | string;
  readonly size: number;
  readonly radius: TabarCorners;
  readonly innerRadius: TabarCorners;
  readonly speed: number;
  readonly zIndex: number;
  readonly position: TabarPosition;
  readonly shape: TabarShape;
  readonly direction: TabarDirection;
  readonly length: number | string;
  readonly offset: number;
  readonly theme: TabarTheme;
  readonly colors: TabarGradientStop[] | null;
  readonly colorMode: TabarColorMode;
  readonly colorAnimate: boolean;
  readonly gradient: TabarGradientStop[] | null;
  readonly gradientType: TabarGradientType;
  readonly fill: string | null;
  readonly glow: boolean;
  readonly glowColor: string | null;
  readonly glowSize: number;
  readonly striped: boolean;
  readonly trackColor: string | null;
  readonly lineCap: TabarLineCap;
  readonly startAngle: number;
  readonly clockwise: boolean;
  readonly max: number;
  readonly minimum: number;
  readonly segmentMode: TabarSegmentMode;
  readonly tooltip: boolean | string | ((percent: number, bar: Tabar) => string);
  readonly label: string;

  static get(id: string): Tabar | undefined;
  static readonly instances: Tabar[];
  static readonly events: TabarEventName[];
  /** Library version. */
  static readonly version: string;
  /** Verbose logging for every instance. */
  static debug: boolean;
  /** Format a byte count, e.g. 1536 -> "1.5 KB" (localized). */
  static formatBytes(bytes: number, locale?: string): string;
  /** Format a duration in seconds, e.g. 75 -> "1m 15s" (localized). */
  static formatDuration(seconds: number, locale?: string): string;
  /** The active locale code (assigning an unknown code is ignored). */
  static locale: string;
  /** Register or extend a locale. */
  static addLocale(code: string, dict: Partial<TabarLocaleDict>): typeof Tabar;
  /** Read a locale's dictionary (defaults to the active locale). */
  static getLocale(code?: string): TabarLocaleDict;
  /** Subscribe to an event across ALL instances; handler gets `(payload, bar)`. */
  static on(name: TabarEventName, handler: TabarHandler): TabarUnsubscribe;
  static once(name: TabarEventName, handler: TabarHandler): TabarUnsubscribe;
  static off(name?: TabarEventName, handler?: TabarHandler): typeof Tabar;
  /** Construct from a JSON string or plain config object. */
  static fromJSON(input: string | TabarOptions): Tabar;
  /** Fetch a JSON config from a URL and construct from it. */
  static fromURL(
    url: string,
    opts?: { fetchOptions?: RequestInit; overrides?: Partial<TabarOptions> },
  ): Promise<Tabar>;

  start(): this;
  /** Animate to a value (fraction [0,1] or absolute on the `max` scale). */
  goto(n: number, opts?: TabarGotoOptions): Promise<this>;
  /** Alias of {@link goto}. */
  set(n: number, opts?: TabarGotoOptions): Promise<this>;
  inc(amount?: number): this;
  indeterminate(on?: boolean): this;
  done(force?: boolean): Promise<this>;
  reset(): this;
  /** Enter the error state (red) and emit `error`. */
  error(info?: unknown): this;
  /** Enter the warning state (amber) and emit `warning`. */
  warn(info?: unknown): this;
  /** Mark successful (green) and emit `success`. */
  succeed(info?: unknown): this;
  /** Register a handler for retry(). */
  retryWith(fn: (bar: Tabar, attempt: number) => void): this;
  /** Clear an error and re-attempt via the registered handler. Emits `retry`. */
  retry(): this;
  pause(): this;
  resume(): this;

  /** Drive the bar with multiple segments (enters segment mode). */
  setSegments(segments: TabarSegment[]): this;
  addSegment(segment: TabarSegment): this;
  updateSegment(id: string, patch: Partial<TabarSegment>): this;
  removeSegment(id: string): this;
  show(): this;
  hide(): this;
  destroy(): void;

  setColor(color: string): this;
  setColor2(color: string): this;
  setBackground(color: string): this;
  setHeight(px: number | string): this;
  setSpeed(ms: number): this;
  setRadius(...args: Array<number | number[] | object>): this;
  setInnerRadius(...args: Array<number | number[] | object>): this;
  setLabel(text: string): this;
  /** Replace the inline status messages map (`null` clears it). */
  setMessages(
    map: Record<string, string | ((percent: number, bar: Tabar) => string)> | null,
  ): this;
  /** Set (or clear, with `null`) the inline message for a single state. */
  setMessage(
    state: string,
    value: string | ((percent: number, bar: Tabar) => string) | null,
  ): this;
  setTooltip(
    value: boolean | string | ((percent: number, bar: Tabar) => string),
    opts?: { always?: boolean },
  ): this;
  setTheme(name: TabarTheme): this;
  setGradient(
    stops: TabarGradientStop[] | null,
    angleOrOpts?: number | { angle?: number; type?: TabarGradientType },
  ): this;
  setGradientStops(stops: TabarGradientStop[] | null): this;
  setColorAt(index: number, color: string): this;
  setGradientAngle(deg: number): this;
  setGradientType(type: TabarGradientType): this;
  setGradientShape(shape: string | null): this;
  setGradientPosition(position: string | null): this;
  setFill(css: string | null): this;
  setColors(colors: TabarGradientStop[] | null): this;
  addColorStop(color: string, at?: number): this;
  removeColorStop(index: number): this;
  setColorMode(mode: TabarColorMode): this;
  setColorAnimate(on?: boolean): this;
  setGlow(on?: boolean, color?: string): this;
  setGlowColor(color: string | null): this;
  setGlowSize(px: number): this;
  setStriped(on?: boolean): this;
  setLength(length: number | string): this;
  setOffset(px: number): this;
  setTrackColor(color: string | null): this;
  setLineCap(cap: TabarLineCap): this;
  setStartAngle(deg: number): this;
  setClockwise(on?: boolean): this;
  /** Set the circular ring diameter in px (no-op for linear bars). */
  setSize(px: number): this;
  /** Switch between 'linear' and 'circular' (rebuilds, preserving state). */
  setShape(shape: TabarShape): this;
  /** Move the bar to a new position. */
  setPosition(pos: TabarPosition): this;
  /** Set the text/fill direction. */
  setDirection(dir: TabarDirection): this;
  /** Set the value scale (`set(max)` === 100%). */
  setMax(n: number): this;
  /** Set the floor fraction applied by `start()`. */
  setMinimum(n: number): this;
  /** Set the segment layout when in segment mode. */
  setSegmentMode(mode: TabarSegmentMode): this;
  /** Set the z-index for fixed bars. */
  setZIndex(z: number): this;
  setDebug(on?: boolean): this;
  configure(partial: Partial<TabarOptions> | string): this;

  /** Serialize the current config + state to a plain, JSON-safe object. */
  toJSON(): Record<string, unknown>;
  /** Fetch a JSON config from a URL and apply it. */
  loadConfig(url?: string, opts?: RequestInit): Promise<Record<string, unknown> | null>;
  /** POST the current state to an endpoint. */
  report(url?: string, opts?: RequestInit): Promise<unknown>;

  /** Drive the bar from a byte transfer and track speed/ETA. Emits `progress`. */
  setProgress(loaded: number, total?: number): this;
  /** Track an XMLHttpRequest upload or download, incl. start/done/reset. */
  trackXHR(
    xhr: XMLHttpRequest,
    opts?: { direction?: 'upload' | 'download'; retry?: () => void },
  ): this;
  /** Track a fetch download; returns a Response whose body streams through the bar. */
  trackResponse(response: Response, opts?: { retry?: () => void }): Response;
  /** Bind the bar to a value source (event or interval). Returns an unbind function. */
  bind(
    getter: () => number,
    opts?: { event?: string; target?: EventTarget; interval?: number },
  ): () => void;

  on(name: TabarEventName, handler: TabarHandler): this;
  once(name: TabarEventName, handler: TabarHandler): this;
  off(name?: TabarEventName, handler?: TabarHandler): this;

  task(name: string): TabarTask;
}

export declare function createTabar(options?: TabarOptions): Tabar;

export default Tabar;
