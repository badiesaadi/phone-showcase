// Dev only: runs the same API inside `vite`, saving to ./.data, so `npm run dev` needs no second process.
import { loadEnv } from 'vite'; import { handle } from '../server/core.mjs'; import { fileStore } from '../server/stores.mjs';
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
