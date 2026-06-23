/**
 * Compile src/tabar.scss into:
 *   • dist/tabar.css  — the optional standalone stylesheet (expanded)
 *   • src/styles.js   — the minified CSS string Tabar injects at runtime
 *
 * Run via `npm run styles`. The generated files are never edited by hand.
 */
import * as sass from 'sass';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = resolve(root, 'src/tabar.scss');

const expanded = sass.compile(entry, { style: 'expanded' }).css;
const compressed = sass.compile(entry, { style: 'compressed' }).css;

await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/tabar.css'), `${expanded}\n`);

const banner = '/* AUTO-GENERATED from src/tabar.scss by scripts/build-css.js — do not edit. */\n';
await writeFile(
  resolve(root, 'src/styles.js'),
  `${banner}export const BASE_CSS = ${JSON.stringify(compressed)};\n`,
);

console.log('✓ compiled src/tabar.scss -> dist/tabar.css + src/styles.js');
