// Deterministic visual gallery for Playwright snapshots. Every bar is built
// with trickle:false and set with { animate:false } so there are no timers and
// no transitions — the page renders identical pixels on every load. This is
// also the guard that the removed leading-edge "peg" never returns.
import { Tabar } from '../../../src/tabar.js';

const pctLabel = (p) => `${Math.round(p)}%`;
const grid = document.getElementById('grid');

// Each tile: a heading, a mount host (with a stable data-testid), the Tabar
// options, and the fixed value (or a setup callback for richer states).
const TILES = [
  { key: 'default', title: 'default · linear', opts: { height: 16, radius: 8, color: '#2299dd' }, value: 0.6 },
  { key: 'gradient', title: 'gradient', opts: { height: 16, radius: 8, theme: 'gradient', color: '#f12711', color2: '#f5af19' }, value: 0.6 },
  { key: 'rainbow', title: 'rainbow', opts: { height: 16, radius: 8, theme: 'rainbow' }, value: 0.6 },
  { key: 'stripes', title: 'stripes (static)', opts: { height: 16, radius: 8, color: '#2299dd', striped: true, stripeAnimate: false }, value: 0.6 },
  { key: 'glow', title: 'glow', opts: { height: 16, radius: 8, theme: 'glow', color: '#34c759' }, value: 0.6 },
  { key: 'minimal', title: 'minimal', opts: { height: 16, radius: 8, theme: 'minimal', color: '#2299dd' }, value: 0.6 },
  { key: 'rtl', title: 'rtl · gradient', opts: { height: 16, radius: 8, direction: 'rtl', theme: 'gradient', color: '#2299dd', color2: '#7c4dff' }, value: 0.6 },
  { key: 'thick', title: 'tall · pill radius', opts: { height: 28, radius: 9999, color: '#bf5af2' }, value: 0.6 },
  { key: 'error', title: 'state · error', opts: { height: 16, radius: 8 }, setup: (b) => { b.set(0.5, { animate: false }); b.error('failed'); } },
  { key: 'warning', title: 'state · warning', opts: { height: 16, radius: 8 }, setup: (b) => { b.set(0.5, { animate: false }); b.warn('slow'); } },
  { key: 'success', title: 'state · success', opts: { height: 16, radius: 8 }, setup: (b) => { b.set(1, { animate: false }); b.succeed('done'); } },
  { key: 'indeterminate', title: 'state · indeterminate', opts: { height: 16, radius: 8, color: '#2299dd' }, setup: (b) => b.indeterminate(true) },
  { key: 'segments-stacked', title: 'segments · stacked', opts: { height: 16, radius: 8 }, setup: (b) => b.setSegments([
    { id: 'a', value: 1, color: '#2299dd', weight: 1 },
    { id: 'b', value: 0.7, color: '#30d158', weight: 2 },
    { id: 'c', value: 0.35, color: '#ff9f0a', weight: 3 },
  ]) },
  { key: 'segments-overlay', title: 'segments · overlay', opts: { height: 16, radius: 8, segmentMode: 'overlay' }, setup: (b) => b.setSegments([
    { id: 'buffered', value: 0.8, color: '#c7c7cc' },
    { id: 'played', value: 0.35, color: '#2299dd' },
  ]) },
  { key: 'bands', title: 'multicolor · bands', opts: { height: 16, radius: 8, colors: ['#2299dd', '#30d158', '#ff9f0a', '#bf5af2'], colorMode: 'bands' }, value: 0.85 },
  { key: 'multicolor', title: 'multicolor · gradient', opts: { height: 16, radius: 8, colors: ['#2299dd', '#7c4dff', '#30d158', '#ff9f0a'] }, value: 0.85 },
  { key: 'tooltip', title: 'tooltip · always', opts: { height: 16, radius: 8, color: '#2299dd', tooltip: true, tooltipAlways: true }, value: 0.6 },
  { key: 'glow-strong', title: 'glow · large halo', opts: { height: 16, radius: 8, theme: 'glow', color: '#ff375f', glowSize: 18 }, value: 0.6 },
  { key: 'ring-default', title: 'circular · default', ring: true, opts: { shape: 'circular', size: 100, height: 9, color: '#2299dd', showLabel: true, labelFormat: pctLabel }, value: 0.66 },
  { key: 'ring-gradient', title: 'circular · gradient', ring: true, opts: { shape: 'circular', size: 100, height: 9, theme: 'gradient', color: '#2299dd', color2: '#7c4dff', showLabel: true, labelFormat: pctLabel }, value: 0.4 },
  { key: 'ring-butt', title: 'circular · butt cap', ring: true, opts: { shape: 'circular', size: 100, height: 12, color: '#2299dd', lineCap: 'butt' }, value: 0.6 },
  { key: 'ring-start', title: 'circular · start 90°', ring: true, opts: { shape: 'circular', size: 100, height: 9, color: '#30d158', startAngle: 90 }, value: 0.5 },
];

for (const tile of TILES) {
  const cell = document.createElement('div');
  cell.className = 'vtile';
  const h = document.createElement('h3');
  h.textContent = tile.title;
  const host = document.createElement('div');
  host.className = tile.ring ? 'host ring' : 'host';
  host.setAttribute('data-testid', `tile-${tile.key}`);
  cell.append(h, host);
  grid.appendChild(cell);

  const bar = new Tabar({ position: 'inline', mountTo: host, trickle: false, autoShow: true, ...tile.opts });
  if (tile.setup) tile.setup(bar);
  else bar.set(tile.value, { animate: false });
  bar.show();
}
