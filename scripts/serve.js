/**
 * Minimal static file server (Node built-ins only) for the site and examples.
 * ES modules can't load over file://, so run `npm run demo` and open the URL.
 *
 * Serves the built site (site/dist) at `/`, falling back to the repo root so
 * `/examples/*`, `/dist/*` and `/src/*` resolve too.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..');
const siteRoot = join(repoRoot, 'site/dist');
const port = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** Read `pathname` from `base`, guarding against path traversal. */
async function tryRead(base, pathname) {
  const filePath = normalize(join(base, pathname));
  if (!filePath.startsWith(base)) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') pathname = '/index.html';
  // site/dist first, then the repo root (examples/, dist/, src/).
  const body = (await tryRead(siteRoot, pathname)) || (await tryRead(repoRoot, pathname));
  if (!body) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(pathname)] || 'application/octet-stream' });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Tabar site running at http://localhost:${port}/`);
  console.log(`Playground:  http://localhost:${port}/playground.html`);
  console.log(`Examples:    http://localhost:${port}/examples/no-framework.html`);
});
