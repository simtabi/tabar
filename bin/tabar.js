#!/usr/bin/env node
/**
 * tabar — render a progress bar in the terminal.
 *
 *   # pipe "loaded total" pairs (or percentages) on stdin:
 *   printf '30 100\n80 100\n100 100\n' | tabar --total 100 --label Build
 *   some-command | awk '...' | tabar --total 1000
 *
 *   tabar --demo            # sample animation
 *   tabar --help
 */
import { createInterface } from 'node:readline';
import { terminalBar } from '../src/node.js';

const argv = process.argv.slice(2);
const opts = { colors: true };
let demo = false;
let help = false;
// Consume the value after a flag, guarding against a missing trailing argument.
const next = (i) => (i + 1 < argv.length ? argv[i + 1] : undefined);
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--demo') demo = true;
  else if (a === '--help' || a === '-h') help = true;
  else if (a === '--no-color') opts.colors = false;
  else if (a === '--total') { opts.total = Number(next(i)); i += 1; }
  else if (a === '--label') { opts.label = next(i); i += 1; }
  else if (a === '--width') { opts.width = Number(next(i)); i += 1; }
}

if (help) {
  process.stdout.write(`tabar — terminal progress bar

Usage:
  <stream> | tabar [--total N] [--label TEXT] [--width N] [--no-color]
  tabar --demo

Stdin: one update per line — "loaded total", "loaded" (with --total), "NN%",
or a bare number (0-100) treated as a percentage when no --total is given.
`);
  process.exit(0);
}

const bar = terminalBar({ label: opts.label, width: opts.width, colors: opts.colors });

if (demo) {
  let v = 0;
  const tick = () => {
    v = Math.min(100, v + 4 + Math.random() * 6);
    bar.setProgress(v, 100);
    if (v >= 100) bar.done();
    else setTimeout(tick, 90);
  };
  tick();
} else {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    const text = line.trim();
    if (!text) return;
    const pctMatch = text.match(/^(\d+(?:\.\d+)?)%$/);
    if (pctMatch) {
      bar.set(Number(pctMatch[1]) / 100);
      return;
    }
    const [loaded, total] = text.split(/\s+/).map(Number);
    if (Number.isFinite(loaded)) {
      const tot = Number.isFinite(total) ? total : opts.total;
      if (Number.isFinite(tot) && tot > 0) bar.setProgress(loaded, tot);
      else bar.set(loaded / 100); // no total -> treat the number as a percentage (0-100)
    }
  });
  rl.on('close', () => {
    if (!bar.complete) bar.done();
  });
}
