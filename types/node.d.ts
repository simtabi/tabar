/** Type declarations for `@simtabi/tabar/node` (core + terminal rendering + group). */
export * from './tabar';
export { default } from './tabar';
export { TabarGroup } from './group';

import type { Tabar, TabarOptions } from './tabar';

export interface TerminalOptions {
  /** Writable stream. Default: process.stdout. */
  stream?: { write(s: string): unknown; isTTY?: boolean; columns?: number };
  /** Bar width in columns (auto from the stream, fallback 80). */
  width?: number;
  /** Prefix label. */
  label?: string;
  /** Enable ANSI color (auto-off when not a TTY / NO_COLOR). Default: true. */
  colors?: boolean;
  /** Bar glyphs. */
  chars?: { full?: string; empty?: string };
  /** Clear the line instead of leaving the final bar on done(). */
  clearOnDone?: boolean;
}

/** Attach terminal (ANSI) rendering to a Tabar instance. */
export declare function renderTerminal(
  bar: Tabar,
  options?: TerminalOptions,
): { stop: () => void; paint: () => void };

/** Create a headless Tabar already wired to terminal output. */
export declare function terminalBar(options?: TabarOptions & TerminalOptions): Tabar;
