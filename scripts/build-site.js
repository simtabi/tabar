/**
 * Build the marketing site from `site/` into `site/dist/`:
 *   • bundle site/landing.js + site/playground.js (Tabar inlined, minified)
 *   • compile site/styles.scss -> site/dist/styles.css
 *   • copy the HTML pages
 *
 * Run via `npm run build:site` (also part of `npm run demo`). Output is
 * git-ignored. The library's own src/tabar.scss pipeline is untouched.
 */
import { build } from 'esbuild';
import * as sass from 'sass';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, 'site');
const out = resolve(site, 'dist');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

await mkdir(out, { recursive: true });

// 1) JS — bundle each page entry (Tabar is inlined; version injected).
await build({
  entryPoints: [resolve(site, 'landing.js'), resolve(site, 'playground.js')],
  outdir: out,
  bundle: true,
  format: 'esm',
  target: ['es2019'],
  minify: true,
  sourcemap: true,
  define: { __TABAR_VERSION__: JSON.stringify(version) },
});

// 2) CSS — compile the site stylesheet.
const css = sass.compile(resolve(site, 'styles.scss'), { style: 'compressed' }).css;
await writeFile(resolve(out, 'styles.css'), css);

// 3) HTML — copy the pages verbatim (they reference ./styles.css + ./*.js).
for (const page of ['index.html', 'playground.html']) {
  await copyFile(resolve(site, page), resolve(out, page));
}

console.log(`✓ built site -> site/dist (index.html, playground.html, styles.css, *.js) [v${version}]`);
