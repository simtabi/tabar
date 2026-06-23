/**
 * Compile-time check that the hand-written declarations describe a usable,
 * self-consistent public API. Run with `npm run typecheck` (tsc --noEmit).
 * This file is type-checked, never executed or shipped.
 */
import Tabar, {
  createTabar,
  Emitter,
  type TabarOptions,
  type TabarTheme,
  type TabarGradientType,
  type TabarGradientStop,
  type TabarEventName,
  type TabarUnsubscribe,
} from './tabar';

const opts: TabarOptions = {
  color: '#f00',
  theme: 'gradient',
  gradient: ['#f00', { color: '#00f', at: 80 }],
  gradientType: 'repeating-radial',
  position: 'left',
  persist: { storage: 'session', mode: 'both', ttl: 1000 },
  configUrl: '/api/tabar.json',
  reportUrl: '/api/progress',
  reportOn: ['change', 'done'],
  onChange: (value, bar) => bar.set(value as number),
};

const bar = new Tabar(opts);

// chainable setters return the instance
bar.setColor('#0f0').setGradient(['#000', '#fff'], { type: 'conic', angle: 45 }).setGlow(true);
bar.setGradientShape('ellipse').setGradientPosition('center').setColorAt(0, '#abc');
bar.setGlow(true, '#0ff').setGlowColor('#f00').setStriped(true);
bar.setTooltip((p) => `${p}%`, { always: true }).pause().resume();
const isVisible: boolean = bar.visible;
const ver: string = Tabar.version;
void isVisible;
void ver;

// circular + transfer + ETA + reactivity
const ring = new Tabar({ shape: 'circular', size: 80 });
ring.setProgress(500, 1000);
const eta: number | null = ring.stats.eta;
void eta;
void Tabar.formatBytes(1536);
void Tabar.formatDuration(75);
declare const xhr: XMLHttpRequest;
ring.trackXHR(xhr, { direction: 'upload' });
declare const resp: Response;
const tracked: Response = ring.trackResponse(resp);
void tracked;
const off2: () => void = ring.bind(() => 0.5, { interval: 200 });
off2();
ring.on('progress', (stats) => void stats);

// error state + i18n
ring.error('failed').on('error', (info) => void info);
Tabar.addLocale('de', { min: 'Min', sec: 'Sek' });
Tabar.locale = 'de';
const dict = Tabar.getLocale('de');
void dict.bytes;
void Tabar.formatBytes(1024, 'de');

// promises
bar.goto(0.5).then((b) => b.done());
void bar.set(50, { duration: 100, animate: true });

// events (instance + global) and unsubscribe
bar.on('change', (v, b) => void b.id).once('done', () => {});
const off: TabarUnsubscribe = Tabar.on('change', (v, b) => void b.value);
off();
Tabar.off('change');

// JSON / AJAX / API
const json: object = bar.toJSON();
void json;
void Tabar.fromJSON('{"color":"#abc"}');
void Tabar.fromURL('/api/tabar.json').then((b) => b.report());
void bar.loadConfig('/api/tabar.json');
void bar.report('/api/progress');

// registry, debug, factory, emitter
const found: Tabar | undefined = Tabar.get('x');
void found;
const names: TabarEventName[] = Tabar.events;
void names;
Tabar.debug = true;
void createTabar({ theme: 'rainbow' satisfies TabarTheme });
const e = new Emitter();
e.on('x', () => {});
e.emit('x');

const t: TabarGradientType = 'repeating-conic';
const stop: TabarGradientStop = { color: '#fff', at: 50 };
void t;
void stop;
