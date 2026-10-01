// Deterministic visual gallery for Playwright snapshots. Every bar is built with
// trickle:false and a fixed value (no timers/animation under reduced-motion), so
// the page renders identical pixels on every load. ONE fixture covers everything,
// including fixed/center positions — those are rendered inside a contained
// "viewport frame" (a `transform` ancestor scopes `position: fixed` to the box).
import { Tabar } from '../../../src/tabar.js';

const pctLabel = (p) => `${Math.round(p)}%`;
const grid = document.getElementById('grid');

// type: 'inline' (default) | 'ring' | 'frame' (fixed-position, mounted in a frame).
const TILES = [
  { key: 'default', title: 'default · linear', opts: { height: 16, radius: 8, color: '#2299dd' }, value: 0.6 },
  { key: 'gradient', title: 'gradient', opts: { height: 16, radius: 8, theme: 'gradient', color: '#f12711', color2: '#f5af19' }, value: 0.6 },
  { key: 'rainbow', title: 'rainbow', opts: { height: 16, radius: 8, theme: 'rainbow' }, value: 0.6 },
  { key: 'stripes', title: 'stripes (static)', opts: { height: 16, radius: 8, color: '#2299dd', striped: true, stripeAnimate: false }, value: 0.6 },
  { key: 'glow', title: 'glow · rounded halo', opts: { height: 16, radius: 8, theme: 'glow', color: '#34c759' }, value: 0.6 },
  { key: 'glow-strong', title: 'glow · large halo', opts: { height: 16, radius: 8, theme: 'glow', color: '#ff375f', glowSize: 18 }, value: 0.6 },
  { key: 'border', title: 'border · dashed', opts: { height: 18, radius: 8, color: '#2299dd', borderWidth: 2, borderStyle: 'dashed', borderColor: '#2299dd' }, value: 0.6 },
  { key: 'minimal', title: 'minimal', opts: { height: 16, radius: 8, theme: 'minimal', color: '#2299dd' }, value: 0.6 },
  { key: 'rtl', title: 'rtl · gradient', opts: { height: 16, radius: 8, direction: 'rtl', theme: 'gradient', color: '#2299dd', color2: '#7c4dff' }, value: 0.6 },
  { key: 'thick', title: 'tall · pill radius', opts: { height: 28, radius: 9999, color: '#bf5af2' }, value: 0.6 },
  { key: 'error', title: 'state · error (keeps value)', opts: { height: 16, radius: 8 }, setup: (b) => { b.set(0.5, { animate: false }); b.error('failed'); } },
  { key: 'warning', title: 'state · warning (keeps value)', opts: { height: 16, radius: 8 }, setup: (b) => { b.set(0.5, { animate: false }); b.warn('slow'); } },
  { key: 'success', title: 'state · success (→100%)', opts: { height: 16, radius: 8 }, setup: (b) => b.succeed('done') },
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
  { key: 'bands', title: 'multicolor · bands (3+)', opts: { height: 16, radius: 8, colors: ['#2299dd', '#30d158', '#ff9f0a', '#bf5af2'], colorMode: 'bands' }, value: 0.85 },
  { key: 'multicolor', title: 'multicolor · gradient', opts: { height: 16, radius: 8, colors: ['#2299dd', '#7c4dff', '#30d158', '#ff9f0a'] }, value: 0.85 },
  { key: 'tooltip', title: 'tooltip · always', opts: { height: 16, radius: 8, color: '#2299dd', tooltip: true, tooltipAlways: true }, value: 0.6 },
  { key: 'ring-default', title: 'circular · default', type: 'ring', opts: { shape: 'circular', size: 100, height: 9, color: '#2299dd', showLabel: true, labelFormat: pctLabel }, value: 0.66 },
  { key: 'ring-gradient', title: 'circular · gradient', type: 'ring', opts: { shape: 'circular', size: 100, height: 9, theme: 'gradient', color: '#2299dd', color2: '#7c4dff', showLabel: true, labelFormat: pctLabel }, value: 0.4 },
  { key: 'ring-butt', title: 'circular · butt cap', type: 'ring', opts: { shape: 'circular', size: 100, height: 12, color: '#2299dd', lineCap: 'butt' }, value: 0.6 },
  { key: 'ring-start', title: 'circular · start 90°', type: 'ring', opts: { shape: 'circular', size: 100, height: 9, color: '#30d158', startAngle: 90 }, value: 0.5 },
];

// Fixed/center positions, each shown inside its own contained mini-viewport frame.
for (const position of ['top', 'bottom', 'left', 'right', 'top-center', 'bottom-center', 'left-center', 'right-center']) {
  TILES.push({
    key: `pos-${position}`,
    title: `position · ${position}`,
    type: 'frame',
    opts: { position, length: '60%', height: 8, radius: 4, color: '#2299dd' },
    value: 0.7,
  });
}

for (const tile of TILES) {
  const cell = document.createElement('div');
  cell.className = tile.type === 'frame' ? 'vtile vtile--wide' : 'vtile';
  const h = document.createElement('h3');
  h.textContent = tile.title;
  const host = document.createElement('div');
  host.className = `host${tile.type === 'ring' ? ' ring' : ''}${tile.type === 'frame' ? ' frame' : ''}`;
  host.setAttribute('data-testid', `tile-${tile.key}`);
  cell.append(h, host);
  grid.appendChild(cell);

  // Frame tiles use a fixed-position bar mounted into the (transform-contained) host.
  const opts = tile.type === 'frame'
    ? { mountTo: host, trickle: false, ...tile.opts }
    : { position: 'inline', mountTo: host, trickle: false, autoShow: true, ...tile.opts };
  const bar = new Tabar(opts);
  if (tile.setup) tile.setup(bar);
  else bar.set(tile.value, { animate: false });
  bar.show();
}
