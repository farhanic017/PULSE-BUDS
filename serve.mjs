// Diet Soda dev server — LAN-friendly (binds all interfaces, no admin needed).
// Replaces serve.ps1's localhost-only HttpListener for on-device testing.
// Usage: node serve.mjs   (then open http://<PC-LAN-IP>:8000/ from any device)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8000;
const ROOT = 'C:\\Users\\Farhan\\Documents\\Default Project';
// Minted per restart: the bare-URL redirect below points here, so every
// server restart transparently busts any cached document on test devices.
const BOOT = Date.now();

const mimes = {
  '.html': 'text/html', '.htm': 'text/html', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const rootResolved = path.resolve(ROOT);

const server = http.createServer((req, res) => {
  let status = 200;
  try {
    // Cache-killer: a bare top-level navigation (no query) may be satisfied
    // by the browser from an old cached copy without ever hitting us. Bounce
    // it to a boot-unique URL once — unseen URLs always fetch fresh from us.
    // Gated on Sec-Fetch-Mode: navigate so subresource fetches (old pages
    // poll ./build.txt with no query — a redirect there would follow into
    // HTML and wedge them in a reload loop) are served normally.
    const sfm = (req.headers['sec-fetch-mode'] || '').toLowerCase();
    if (!req.url.includes('?') && sfm === 'navigate') {
      const sep = '/index.html?boot=' + BOOT;
      res.writeHead(302, { 'Location': sep, 'Cache-Control': 'no-store', 'Connection': 'close' });
      res.end();
      console.log(`${req.method} ${req.url} -> 302 ${sep}`);
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { pathname = '/'; }
    if (pathname === '/') pathname = '/index.html';
    const full = path.resolve(path.join(rootResolved, pathname));
    // Path-traversal guard: never serve outside the project folder.
    if (!full.startsWith(rootResolved)) {
      status = 403;
      res.writeHead(403, { 'Content-Type': 'text/plain', 'Content-Length': 4, 'Connection': 'close' });
      res.end('403');
      console.log(`${req.method} ${pathname} -> 403`);
      return;
    }
    let st = null;
    try { st = fs.statSync(full); } catch {}
    if (!st || !st.isFile()) {
      status = 404;
      const msg = `404 Not Found: ${pathname}`;
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(msg), 'Connection': 'close' });
      res.end(msg);
      console.log(`${req.method} ${pathname} -> 404`);
      return;
    }
    const ext = path.extname(full).toLowerCase();
    // TOTAL no-store: every byte is dev-only. Browsers (esp. mobile Brave)
    // cached index.html/GLBs across builds and silently pinned test devices
    // to stale code — including build.txt, the auto-update poll's file.
    // Freshness is enforced three ways: these headers, meta tags in <head>,
    // and a timestamp query on the poll itself.
    const headers = {
      'Content-Type': mimes[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'close',
    };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); }
    else { fs.createReadStream(full).pipe(res); }
    console.log(`${req.method} ${pathname} -> 200`);
  } catch (err) {
    try {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500');
    } catch {}
    console.log(`${req.method} -> 500 (${err.message})`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://192.168.0.107:${PORT}/  (LAN)`);
});
