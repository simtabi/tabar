/** Type declarations for `@simtabi/tabar/element` (the `<tabar-bar>` Web Component). */
import type { Tabar } from './tabar';

/**
 * `<tabar-bar>` — a Web Component wrapper around Tabar. Config is read from
 * attributes (kebab-case → camelCase); the live instance is `el.bar`.
 */
export declare class TabarElement extends HTMLElement {
  static get observedAttributes(): string[];
  /** The underlying Tabar instance (the full imperative API), or null pre-connect. */
  readonly bar: Tabar | null;
}

export default TabarElement;
