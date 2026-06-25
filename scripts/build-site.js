/**
 * Build the marketing site from `site/` into `site/dist/`:
 *   • bundle site/assets/js/*.js (Tabar inlined, minified) -> site/dist/assets/js/
 *   • compile site/assets/scss/styles.scss -> site/dist/assets/css/styles.css
 *   • copy any site/assets/img/* -> site/dist/assets/img/
 *   • copy the HTML pages (which reference ./assets/{css,js}/…)
 *
 * Run via `npm run build:site` (also part of `npm run demo`). Output is
 * git-ignored. The library's own src/tabar.scss pipeline is untouched.
 */
import { build } from 'esbuild';
import * as sass from 'sass';
import { mkdir, readFile, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, 'site');
const out = resolve(site, 'dist');
const js = resolve(site, 'assets/js');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

await rm(out, { recursive: true, force: true }); // clean stale output before rebuilding
await mkdir(resolve(out, 'assets/js'), { recursive: true });
await mkdir(resolve(out, 'assets/css'), { recursive: true });
await mkdir(resolve(out, 'assets/img'), { recursive: true });

// Each page has a JS entry of the same name under site/assets/js/.
const ENTRIES = ['landing', 'playground', 'visual'];
const PAGES = ['index.html', 'playground.html', 'visual.html'];

// 1) JS — bundle each page entry (Tabar is inlined; version injected).
await build({
  entryPoints: ENTRIES.map((name) => resolve(js, `${name}.js`)),
  outdir: resolve(out, 'assets/js'),
  bundle: true,
  format: 'esm',
  target: ['es2019'],
  minify: true,
  sourcemap: true,
  define: { __TABAR_VERSION__: JSON.stringify(version) },
});

// 2) CSS — vendor Webpixels (the demo's framework) + the slim site glue stylesheet.
//    The library ships ZERO CSS-framework dependency; this is presentation only.
await copyFile(
  resolve(root, 'node_modules/@webpixels/css/dist/all.css'),
  resolve(out, 'assets/css/webpixels.css'),
);
const css = sass.compile(resolve(site, 'assets/scss/styles.scss'), { style: 'compressed' }).css;
await writeFile(resolve(out, 'assets/css/styles.css'), css);

// 3) Images — copy any static image assets verbatim.
const imgDir = resolve(site, 'assets/img');
for (const name of await readdir(imgDir)) {
  if (name.startsWith('.')) continue; // skip .gitkeep and dotfiles
  await copyFile(resolve(imgDir, name), resolve(out, 'assets/img', name));
}

// 4) HTML — copy the pages verbatim (they reference ./assets/{css,js}/…).
for (const page of PAGES) {
  await copyFile(resolve(site, page), resolve(out, page));
}

console.log(`✓ built site -> site/dist (${PAGES.join(', ')}; assets/{css,js,img}) [v${version}]`);
