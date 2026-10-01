/**
 * Terminal example — run with: node examples/cli.js
 *
 * Drives a headless Tabar and renders a live ANSI bar to stdout, exactly the
 * same API you'd use in the browser. Also shows a multi-bar group.
 */
import { terminalBar, TabarGroup } from '../src/node.js';

// 1) A single transfer bar with speed + ETA.
const bar = terminalBar({ label: 'Downloading' });
let loaded = 0;
const total = 5_000_000;
const step = () => {
  loaded = Math.min(total, loaded + 220_000 + Math.random() * 180_000);
  bar.setProgress(loaded, total);
  if (loaded >= total) bar.done();
  else setTimeout(step, 80);
};
step();

// 2) After it finishes, render three parallel jobs as a group.
setTimeout(() => {
  process.stdout.write('\nProcessing 3 files:\n');
  const group = new TabarGroup({});
  const jobs = ['a.zip', 'b.zip', 'c.zip'].map((name) => group.add({ label: name }));
  jobs.forEach((job, i) => {
    let v = 0;
    const t = () => {
      v = Math.min(1, v + 0.05 + Math.random() * 0.08);
      job.set(v);
      if (v < 1) setTimeout(t, 120 + i * 40);
      else job.done(true);
    };
    setTimeout(t, i * 200);
  });
}, 2600);
