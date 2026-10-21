// One Node process: serves the built React app (dist/) and the REST API (/api, /uploads).
import http from 'http'; import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import { fileURLToPath } from 'url';
try { process.loadEnvFile('.env'); } catch {}
import { handle } from './core.mjs'; import { fileStore, pgStores } from './stores.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist'), PORT = process.env.PORT || 4000;
const dataDir = process.env.DATA_DIR || '.data';
const { db, files } = process.env.DATABASE_URL ? await pgStores(process.env.DATABASE_URL) : { db: fileStore(dataDir + '/db'), files: fileStore(dataDir + '/uploads') };
if (!process.env.DATABASE_URL) console.warn('No DATABASE_URL: saving to ' + dataDir + ' (lost on redeploy/spin-down on free hosting).');
const env = process.env, ctx = { db, files, env };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const SECH = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()', 'Content-Security-Policy': CSP };
const secHeaders = req => ({ ...SECH, ...(/https/.test(req.headers['x-forwarded-proto'] || '') ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}) });
const ZIP = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt']), gz = new Map();
function send(req, res, file, ext, headers) {
  let body = fs.readFileSync(file); const h = { 'Content-Type': MIME[ext] || 'application/octet-stream', ...secHeaders(req), ...headers };
  if (ZIP.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { const k = file + fs.statSync(file).mtimeMs; if (!gz.has(k)) gz.set(k, zlib.gzipSync(body)); body = gz.get(k); h['Content-Encoding'] = 'gzip'; h.Vary = 'Accept-Encoding'; }
  res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
}
function serveStatic(req, res, pathname) {
  const f = path.join(root, decodeURIComponent(pathname)), ext = path.extname(f);
  if (f !== root && !f.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return send(req, res, f, ext, { 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600' });
  if (ext) { res.writeHead(404); return res.end('Not found'); }
  send(req, res, path.join(root, 'index.html'), '.html', { 'Cache-Control': 'no-cache' }); // single-page app: every route serves index.html
}
http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname === '/healthz') { res.writeHead(200); return res.end('ok'); }
    if (/^\/(api|uploads)\//.test(pathname)) {
      const chunks = []; let n = 0; for await (const c of req) { n += c.length; if (n > 8 * 1024 * 1024) { res.writeHead(413); return res.end('Too large'); } chunks.push(c); }
      const r = await handle(new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), ctx);
      res.statusCode = r.status; for (const [k, v] of Object.entries(secHeaders(req))) res.setHeader(k, v); r.headers.forEach((v, k) => { if (k !== 'set-cookie') res.setHeader(k, v); }); const sc = r.headers.getSetCookie(); if (sc.length) res.setHeader('Set-Cookie', sc); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    if (!fs.existsSync(path.join(root, 'index.html'))) { res.writeHead(500); return res.end('Run "npm run build" first'); }
    serveStatic(req, res, pathname);
  } catch (e) { console.error(e); res.writeHead(500); res.end('Server error'); }
}).listen(PORT, '0.0.0.0', () => console.log('Listening on :' + PORT));
