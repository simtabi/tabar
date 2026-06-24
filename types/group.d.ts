/** Type declarations for `@simtabi/tabar/group`. */
import type { Tabar, TabarOptions, TabarAggregate } from './tabar';

export interface TabarGroupOptions {
  id?: string;
  mountTo?: string | Element | null;
  /** Overall aggregation strategy. Default: 'weighted'. */
  aggregate?: Exclude<TabarAggregate, 'primary'>;
  /** Options for the aggregated overall bar. */
  overall?: TabarOptions;
  /** Default options merged into every child. */
  child?: TabarOptions;
}

/** A parent task holding many child bars + an auto-aggregated overall bar. */
export declare class TabarGroup {
  constructor(options?: TabarGroupOptions);
  readonly id: string;
  /** The aggregated overall bar. */
  readonly overall: Tabar;
  /** All child bars. */
  readonly children: Tabar[];
  /** Aggregate percentage [0,100]. */
  readonly value: number;

  add(childOptions?: TabarOptions): Tabar;
  remove(id: string): this;
  child(id: string): Tabar | undefined;
  /** Merge default options applied to future child bars. */
  setChildDefaults(opts: TabarOptions): this;
  /** Update the overall bar's options live. */
  setOverallDefaults(opts: TabarOptions): this;
  on(name: string, handler: (payload: unknown, child?: Tabar) => void): this;
  off(name: string, handler?: (payload: unknown, child?: Tabar) => void): this;
  destroy(): void;
}

export default TabarGroup;
