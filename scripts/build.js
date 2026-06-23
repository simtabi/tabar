/**
 * Bundle the library with esbuild.
 *
 * Outputs (styles are produced separately by scripts/build-css.js):
 *   dist/tabar.esm.js        ESM, for bundlers / native imports
 *   dist/tabar.umd.cjs       CommonJS, for require()
 *   dist/tabar.min.js        minified IIFE — drop-in <script>, exposes window.Tabar
 *   dist/tabar-element.*     <tabar-bar> Web Component (ESM + minified IIFE)
 *   dist/tabar-react.js      useTabar hook (ESM, react kept external)
 *
 * The build replaces __TABAR_VERSION__ with package.json's version.
 */
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const define = { __TABAR_VERSION__: JSON.stringify(version) };

const targets = [
  { entry: 'src/tabar.js', outfile: 'dist/tabar.esm.js', format: 'esm' },
  { entry: 'src/tabar.js', outfile: 'dist/tabar.umd.cjs', format: 'cjs' },
  {
    entry: 'src/tabar.js', outfile: 'dist/tabar.min.js', format: 'iife',
    globalName: 'TabarModule', minify: true, footer: { js: 'window.Tabar=TabarModule.default;' },
  },
  { entry: 'src/group.js', outfile: 'dist/tabar-group.js', format: 'esm' },
  { entry: 'src/node.js', outfile: 'dist/tabar-node.js', format: 'esm', platform: 'node' },
  { entry: 'src/terminal.js', outfile: 'dist/tabar-terminal.js', format: 'esm', platform: 'node' },
  { entry: 'src/element.js', outfile: 'dist/tabar-element.js', format: 'esm' },
  {
    entry: 'src/element.js', outfile: 'dist/tabar-element.min.js', format: 'iife',
    globalName: 'TabarElement', minify: true,
  },
  { entry: 'src/react.js', outfile: 'dist/tabar-react.js', format: 'esm', external: ['react'] },
];

await mkdir(resolve(root, 'dist'), { recursive: true });

await Promise.all(
  targets.map((t) =>
    build({
      entryPoints: [resolve(root, t.entry)],
      outfile: resolve(root, t.outfile),
      bundle: true,
      sourcemap: true,
      target: ['es2019'],
      define,
      format: t.format,
      platform: t.platform || 'browser',
      globalName: t.globalName,
      minify: t.minify,
      footer: t.footer,
      external: t.external,
    }),
  ),
);

// Report sizes for the drop-in bundle.
for (const file of ['dist/tabar.min.js', 'dist/tabar-element.min.js']) {
  const path = resolve(root, file);
  const bytes = (await stat(path)).size;
  const gz = gzipSync(await readFile(path)).length;
  console.log(`  ${file}  ${(bytes / 1024).toFixed(1)} KB  (${(gz / 1024).toFixed(1)} KB gzip)`);
}

console.log(`✓ built v${version} -> dist/{tabar.esm.js, tabar.umd.cjs, tabar.min.js, tabar-element.*, tabar-react.js}`);
