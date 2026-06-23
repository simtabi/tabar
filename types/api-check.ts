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
  type TabarSegment,
} from './tabar';
import { TabarGroup } from './group';
import { terminalBar, renderTerminal } from './node';

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
ring.error('failed').warn('slow').succeed('ok').on('error', (info) => void info);
ring.retryWith((b, n) => void (b.id + n)).retry();
const done: boolean = ring.complete;
const tries: number = ring.attempts;
void done;
void tries;
Tabar.addLocale('de', { min: 'Min', sec: 'Sek' });
Tabar.locale = 'de';
const dict = Tabar.getLocale('de');
void dict.bytes;
void Tabar.formatBytes(1024, 'de');

// segments
const seg = new Tabar({ segments: [{ id: 'a', value: 0.5 }], segmentMode: 'stacked', aggregate: 'weighted' });
seg.setSegments([{ value: 0.2, color: '#f00' }, { value: 0.8 }]);
seg.addSegment({ id: 'c', value: 0.3, weight: 2 });
seg.updateSegment('c', { value: 0.9 });
seg.removeSegment('c');
const list: TabarSegment[] = seg.segments;
void list;

// transfer retry option + new states
declare const xhr2: XMLHttpRequest;
new Tabar().trackXHR(xhr2, { direction: 'download', retry: () => {} });

// group + terminal
const group = new TabarGroup({ aggregate: 'weighted' });
const childBar = group.add({ label: 'file' });
childBar.setProgress(1, 2);
void group.overall.value;
void group.children.length;
const tbar = terminalBar({ label: 'DL', colors: false });
renderTerminal(tbar, { width: 40 }).stop();

// inline messages
const msgBar = new Tabar({
  messages: { active: 'Uploading…', error: 'Failed', default: (p) => `${Math.round(p)}%` },
  messageAlign: 'center',
  messageColor: '#fff',
});
msgBar.setMessages({ done: 'Complete' });
msgBar.setMessage('warning', (p, b) => `${p} on ${b.id}`);
msgBar.setMessage('warning', null);
const currentMsg: string = msgBar.message;
void currentMsg;

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
