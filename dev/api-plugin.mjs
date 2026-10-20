// Dev only: runs the same API as the Netlify function inside `vite`, storing data in ./.data, so `npm run dev` needs no second server.
import fs from 'fs'; import path from 'path'; import { loadEnv } from 'vite'; import { handle } from '../netlify/functions/lib/core.mjs';
const fileStore = dir => {
  fs.mkdirSync(dir, { recursive: true }); const f = k => path.join(dir, k.replace(/[^\w.-]/g, '_'));
  return {
    get: async (k, o) => fs.existsSync(f(k)) ? (o?.type === 'json' ? JSON.parse(fs.readFileSync(f(k), 'utf8')) : fs.readFileSync(f(k))) : null,
    setJSON: async (k, v) => fs.writeFileSync(f(k), JSON.stringify(v)),
    set: async (k, v, o) => { fs.writeFileSync(f(k), Buffer.from(v)); fs.writeFileSync(f(k) + '.meta', JSON.stringify(o?.metadata || {})); },
    getWithMetadata: async k => fs.existsSync(f(k)) ? { data: fs.readFileSync(f(k)), metadata: fs.existsSync(f(k) + '.meta') ? JSON.parse(fs.readFileSync(f(k) + '.meta', 'utf8')) : {} } : null
  };
};
export default function apiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      const env = { JWT_SECRET: 'dev-only-secret-change-me-0123456789', ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'admin12345', ...loadEnv('development', process.cwd(), '') };
      const ctx = { db: fileStore('.data/db'), files: fileStore('.data/uploads'), env };
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/(api|uploads)\//.test(req.url || '')) return next();
        const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
        const r = await handle(new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), ctx);
        res.statusCode = r.status; r.headers.forEach((v, k) => { if (k !== 'set-cookie') res.setHeader(k, v); }); const sc = r.headers.getSetCookie(); if (sc.length) res.setHeader('Set-Cookie', sc); res.end(Buffer.from(await r.arrayBuffer()));
      });
    }
  };
}
