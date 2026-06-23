/**
 * Terminal (ANSI) rendering for Tabar.
 *
 * The same Tabar API drives a live progress bar in a stream (default
 * `process.stdout`). TTY streams redraw in place; non-TTY streams (CI/pipes)
 * emit throttled, newline-terminated lines with no control codes.
 *
 *   import { terminalBar } from '@simtabi/tabar/node';
 *   const bar = terminalBar({ label: 'Downloading' });
 *   bar.setProgress(loaded, total);
 */
import { Tabar } from './tabar.js';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  clearLine: '\x1b[2K',
};
const noColorEnv = () =>
  typeof process !== 'undefined' && process.env && process.env.NO_COLOR != null;

/**
 * Attach terminal rendering to a (headless) Tabar instance.
 * @param {Tabar} bar
 * @param {{stream?, width?, label?, color?, chars?, clearOnDone?}} [options]
 * @returns {{ stop: () => void, paint: () => void }}
 */
export function renderTerminal(bar, options = {}) {
  const stream = options.stream || (typeof process !== 'undefined' ? process.stdout : null);
  if (!stream || typeof stream.write !== 'function') return { stop() {}, paint() {} };

  const chars = { full: '█', empty: '░', ...(options.chars || {}) };
  const isTTY = !!stream.isTTY;
  const color = options.colors !== false && isTTY && !noColorEnv();
  let frame = 0;
  let lastWrite = 0;
  let stopped = false;
  let finished = false;
  let spinTimer = null;

  const tint = (state) => {
    if (!color) return '';
    if (state === 'error') return ANSI.red;
    if (state === 'warning') return ANSI.yellow;
    if (state === 'success' || state === 'done') return ANSI.green;
    return ANSI.cyan;
  };

  const buildLine = () => {
    const label = options.label != null ? options.label : bar.options.label || '';
    const totalWidth = Math.max(20, Math.min(toNum(options.width) || stream.columns || 80, 120));
    const indeterminate = bar.state === 'indeterminate';
    const stats = bar.stats;
    const extra =
      stats.total > 0 && stats.speed > 0 && bar.state === 'active'
        ? `${Tabar.formatBytes(stats.speed)}/s${stats.eta != null && stats.eta > 0 ? ` · ${Tabar.formatDuration(stats.eta)}` : ''}`
        : '';
    const prefix = label ? `${label} ` : '';
    const suffixLen = 6 + (extra ? extra.length + 2 : 0); // " 100% " + extra
    const barWidth = Math.max(6, totalWidth - prefix.length - suffixLen - 2);

    let body;
    if (indeterminate) {
      const dot = SPINNER[frame % SPINNER.length];
      const head = ((frame * 2) % barWidth);
      body = chars.empty.repeat(head) + dot + chars.empty.repeat(Math.max(0, barWidth - head - 1));
    } else {
      const filled = Math.round((bar.value / 100) * barWidth);
      body = chars.full.repeat(filled) + chars.empty.repeat(Math.max(0, barWidth - filled));
    }
    const c = tint(bar.state);
    const r = color ? ANSI.reset : '';
    const pct = indeterminate ? '    ' : `${String(Math.round(bar.value)).padStart(3)}%`;
    const dim = color ? ANSI.dim : '';
    return `${prefix}${c}▕${body}▏${r} ${pct}${extra ? ` ${dim}${extra}${r}` : ''}`.replace(/\s+$/, '');
  };

  const paint = () => {
    if (stopped) return;
    const line = buildLine();
    if (isTTY) {
      stream.write(`\r${color ? ANSI.clearLine : ''}${line}`);
    } else {
      // Non-TTY (CI/pipe): throttle everything but the final 100% so an active
      // OR indeterminate bar can't flood the log with thousands of lines.
      const now = Date.now();
      const ongoing = bar.value < 100 && bar.state !== 'done';
      if (now - lastWrite < 200 && ongoing) return;
      lastWrite = now;
      stream.write(`${line}\n`);
    }
  };

  const stopSpinner = () => {
    if (spinTimer) {
      clearTimeout(spinTimer);
      spinTimer = null;
    }
  };
  const spin = () => {
    if (stopped || !isTTY || bar.state !== 'indeterminate') return stopSpinner();
    frame += 1;
    paint();
    spinTimer = setTimeout(spin, 90);
    if (spinTimer && typeof spinTimer.unref === 'function') spinTimer.unref(); // don't hold the event loop open
  };

  const onUpdate = () => {
    paint();
    if (bar.state === 'indeterminate' && isTTY && !spinTimer) spin();
    else if (bar.state !== 'indeterminate') stopSpinner();
  };
  const onDone = () => {
    if (finished) return;
    finished = true;
    stopSpinner();
    paint();
    if (isTTY) stream.write(options.clearOnDone ? `\r${ANSI.clearLine}` : '\n');
  };

  const updateEvents = ['change', 'progress', 'indeterminate', 'reset', 'error', 'warning', 'success'];
  updateEvents.forEach((e) => bar.on(e, onUpdate));
  bar.on('done', onDone);
  bar.on('destroy', () => stop());
  paint();
  if (bar.state === 'indeterminate' && isTTY) spin();

  function stop() {
    if (stopped) return;
    stopped = true;
    stopSpinner();
    updateEvents.forEach((e) => bar.off(e, onUpdate));
    bar.off('done', onDone);
  }

  return { stop, paint };
}

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Create a headless Tabar already wired to terminal output. */
export function terminalBar(options = {}) {
  const { stream, width, label, colors, chars, clearOnDone, ...barOpts } = options;
  const bar = new Tabar(barOpts);
  renderTerminal(bar, { stream, width, label, colors, chars, clearOnDone });
  return bar;
}

export default terminalBar;
