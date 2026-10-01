/** Type declarations for the `@simtabi/tabar/react` entry point. */
import type { Tabar, TabarOptions, TabarState, TabarStats } from './tabar';

/** A minimal React ref shape (compatible with React's `RefObject`). */
export interface TabarRef {
  current: HTMLElement | null;
}

/**
 * Mount one inline Tabar into a ref'd element. `value`/`state`/`stats` update
 * reactively; `bar()` returns the live instance for the full imperative API.
 * The bar is destroyed on unmount.
 */
export declare function useTabar(options?: TabarOptions): {
  ref: TabarRef;
  bar: () => Tabar | null;
  value: number;
  state: TabarState;
  stats: TabarStats | null;
  complete: boolean;
};

export default useTabar;
