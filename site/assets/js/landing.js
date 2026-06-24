// Landing-page behavior. Bundled by scripts/build-site.js (Tabar is inlined).
import { Tabar } from '../../../src/tabar.js';
import { TabarGroup } from '../../../src/group.js';

/* --- Theme toggle (persisted) --------------------------------------------- */
const root = document.documentElement;
const themeBtn = document.getElementById('theme');
const isDark = () =>
  root.dataset.theme === 'dark' ||
  (!root.dataset.theme && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
const reflectTheme = () => themeBtn?.setAttribute('aria-pressed', String(isDark()));
const saved = localStorage.getItem('tabar-theme');
if (saved) root.dataset.theme = saved;
reflectTheme();
themeBtn?.addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  localStorage.setItem('tabar-theme', root.dataset.theme);
  reflectTheme();
});

/* --- Version stamps ------------------------------------------------------- */
for (const id of ['ver', 'ver-foot']) {
  const el = document.getElementById(id);
  if (el) el.textContent = Tabar.version;
}

/* --- Hero: a looping bar, a ring, and a segmented transfer ---------------- */
const heroBar = new Tabar({
  position: 'inline', mountTo: '#hero-bar', height: 16, radius: 8, theme: 'gradient',
  color: '#2299dd', color2: '#7c4dff', trickle: false,
});
const heroRing = new Tabar({
  position: 'inline', mountTo: '#hero-ring', shape: 'circular', size: 84, height: 8,
  theme: 'gradient', color: '#2299dd', color2: '#7c4dff', trickle: false,
  showLabel: true, labelFormat: (p) => `${Math.round(p)}%`,
});
const heroSeg = new Tabar({ position: 'inline', mountTo: '#hero-seg', height: 16, radius: 8 });
heroSeg.setSegments([
  { id: 'a', value: 1, color: '#2299dd', weight: 1 },
  { id: 'b', value: 0.7, color: '#30d158', weight: 2 },
  { id: 'c', value: 0.25, color: '#ff9f0a', weight: 3 },
]);

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let heroV = 0;
const loopHero = () => {
  heroV = heroV >= 1 ? 0 : Math.min(1, heroV + 0.07);
  heroBar.set(heroV);
  heroRing.set(heroV);
};
if (reduceMotion) {
  heroBar.set(0.66, { animate: false });
  heroRing.set(0.66, { animate: false });
} else {
  loopHero();
  setInterval(loopHero, 1400);
}

/* --- Shapes showcase ------------------------------------------------------ */
const scLinear = new Tabar({ position: 'inline', mountTo: '#sc-linear', height: 14, radius: 7, trickle: false });
const scRing = new Tabar({ position: 'inline', mountTo: '#sc-ring', shape: 'circular', size: 110, height: 9, trickle: false, showLabel: true, labelFormat: (p) => `${Math.round(p)}%`, color: '#2299dd' });

const scSegChunks = [
  { id: 'fonts', value: 1, color: '#2299dd', weight: 1 },
  { id: 'img', value: 0.4, color: '#30d158', weight: 3 },
  { id: 'video', value: 0, color: '#ff9f0a', weight: 6 },
];
let scSegNext = 1;
const scSeg = new Tabar({ position: 'inline', mountTo: '#sc-seg', height: 16, radius: 8 });
scSeg.setSegments(scSegChunks.map((c) => ({ ...c })));

const scGroup = new TabarGroup({ mountTo: '#sc-group' });
let scGroupN = 0;
const addGroupChild = () => {
  const bar = scGroup.add({ label: `file-${(scGroupN += 1)}.zip`, height: 13, radius: 7 });
  const total = 1e6 + Math.random() * 4e6;
  let loaded = 0;
  const t = setInterval(() => {
    loaded = Math.min(total, loaded + total * (0.05 + Math.random() * 0.07));
    bar.setProgress(loaded, total);
    if (loaded >= total) { clearInterval(t); bar.done(true); }
  }, 240);
};
addGroupChild();

const XFER_TOTAL = 12 * 1024 * 1024;
const scXfer = new Tabar({
  position: 'inline', mountTo: '#sc-xfer', height: 22, radius: 9, trickle: false, messageAlign: 'start',
  messages: {
    active: (p, bar) => (bar.stats.speed > 0 && p < 100 ? `${Math.round(p)}% · ${Tabar.formatBytes(bar.stats.speed)}/s` : `Downloading… ${Math.round(p)}%`),
    done: 'Complete', error: 'Failed — retry', default: (p) => `${Math.round(p)}%`,
  },
});
let xferTimer = null;
const stopXfer = () => { if (xferTimer) { clearInterval(xferTimer); xferTimer = null; } };

const scState = new Tabar({
  position: 'inline', mountTo: '#sc-state', height: 22, radius: 9, trickle: false,
  messages: { warning: 'Slow', error: 'Failed', success: 'Verified ✓', done: 'Done', default: (p) => `${Math.round(p)}%` },
});
scState.set(0.5, { animate: false });
scState.retryWith(() => scState.set(0.7));

const sc = {
  'linear-go': () => scLinear.set(Math.random() * 0.7 + 0.3),
  'linear-grad': () => scLinear.setTheme(scLinear.options.theme === 'gradient' ? 'default' : 'gradient'),
  'linear-stripe': () => scLinear.setStriped(!scLinear.options.striped),
  'ring-go': () => scRing.set(Math.random() * 0.7 + 0.3),
  'ring-ind': () => scRing.indeterminate(true),
  'seg-advance': () => {
    const c = scSegChunks[scSegNext % scSegChunks.length];
    scSeg.updateSegment(c.id, { value: Math.min(1, (c.value += 0.25)) });
    scSegNext += 1;
  },
  'group-add': addGroupChild,
  'xfer-go': () => {
    stopXfer(); scXfer.reset(); scXfer.show();
    let loaded = 0;
    xferTimer = setInterval(() => {
      loaded = Math.min(XFER_TOTAL, loaded + 700 * 1024 * (0.5 + Math.random()));
      scXfer.setProgress(loaded, XFER_TOTAL);
      if (loaded >= XFER_TOTAL) stopXfer();
    }, 130);
  },
  'xfer-fail': () => { stopXfer(); scXfer.error('network error'); },
  'st-warn': () => scState.warn('slow'),
  'st-error': () => scState.error('failed'),
  'st-retry': () => scState.retry(),
  'st-ok': () => scState.succeed('done'),
};
document.body.addEventListener('click', (e) => {
  const act = e.target.closest('[data-sc]')?.dataset.sc;
  if (act && sc[act]) sc[act]();
});
