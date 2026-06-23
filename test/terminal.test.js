// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Tabar } from '../src/tabar.js';
import { renderTerminal, terminalBar } from '../src/node.js';

/** A captured writable stream. */
const makeStream = (isTTY) => {
  const out = { text: '', isTTY, columns: 60, write(s) { this.text += s; } };
  return out;
};

describe('terminal renderer (Node env)', () => {
  it('auto-selects headless in Node and the value machinery still works', () => {
    const bar = new Tabar({ trickle: false });
    expect(bar._wrapper).toBeFalsy(); // no DOM in Node
    bar.set(0.5, { animate: false });
    expect(bar.value).toBe(50);
  });

  it('renders an ANSI bar to a TTY stream', () => {
    const stream = makeStream(true);
    const bar = new Tabar({ trickle: false });
    renderTerminal(bar, { stream, label: 'DL' });
    bar.setProgress(50, 100);
    expect(stream.text).toContain('DL');
    expect(stream.text).toContain('█');
    expect(stream.text).toContain('50%');
    expect(stream.text).toContain('\x1b['); // color codes on a TTY
  });

  it('emits plain, newline-terminated lines on a non-TTY stream', () => {
    const stream = makeStream(false);
    const bar = new Tabar({ trickle: false });
    renderTerminal(bar, { stream });
    bar.set(1, { animate: false });
    bar.done();
    expect(stream.text).not.toContain('\x1b[');
    expect(stream.text).toContain('\n');
  });

  it('terminalBar drives a headless bar', () => {
    const stream = makeStream(false);
    const bar = terminalBar({ stream, label: 'x' });
    bar.setProgress(25, 100);
    expect(bar.value).toBe(25);
  });
});
