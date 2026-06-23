// One fixed/center-positioned bar, configured from URL params, for deterministic
// full-viewport Playwright shots (fixed overlays can't live in the inline gallery).
//   /visual-fixed.html?pos=top-center&len=60%&val=0.7&h=10
import { Tabar } from '../../../src/tabar.js';

const params = new URLSearchParams(location.search);
const position = params.get('pos') || 'top-center';
const length = params.get('len') || '60%';
const value = Number(params.get('val') || '0.7');
const height = Number(params.get('h') || '10');

const bar = new Tabar({ position, length, height, radius: 6, color: '#2299dd', trickle: false });
bar.set(value, { animate: false });
bar.show();

const label = document.getElementById('label');
if (label) label.textContent = `${position} · ${length}`;
