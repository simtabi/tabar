/**
 * Node entry — everything from the core plus terminal rendering and the group.
 *
 *   import { Tabar, terminalBar, TabarGroup } from '@simtabi/tabar/node';
 */
export * from './tabar.js';
export { renderTerminal, terminalBar } from './terminal.js';
export { TabarGroup } from './group.js';

import Tabar from './tabar.js';
export default Tabar;
