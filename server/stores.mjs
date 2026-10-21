// Two interchangeable key-value stores used by core.mjs: files on disk (default) or Postgres (when DATABASE_URL is set).
import fs from 'fs'; import path from 'path';
export const fileStore = dir => {
  fs.mkdirSync(dir, { recursive: true }); const f = k => path.join(dir, k.replace(/[^\w.-]/g, '_'));
  return {
    get: async (k, o) => fs.existsSync(f(k)) ? (o?.type === 'json' ? JSON.parse(fs.readFileSync(f(k), 'utf8')) : fs.readFileSync(f(k))) : null,
    setJSON: async (k, v) => fs.writeFileSync(f(k), JSON.stringify(v)),
    set: async (k, v, o) => { fs.writeFileSync(f(k), Buffer.from(v)); fs.writeFileSync(f(k) + '.meta', JSON.stringify(o?.metadata || {})); },
    getWithMetadata: async k => fs.existsSync(f(k)) ? { data: fs.readFileSync(f(k)), metadata: fs.existsSync(f(k) + '.meta') ? JSON.parse(fs.readFileSync(f(k) + '.meta', 'utf8')) : {} } : null
  };
};
export async function pgStores(url) {
  const { default: pg } = await import('pg');
  const noSsl = /localhost|127\.0\.0\.1/.test(url) || process.env.PGSSL === 'disable';
  const pool = new pg.Pool({ connectionString: url, max: 4, ssl: noSsl ? false : { rejectUnauthorized: false } });
  await pool.query("create table if not exists kv(store text not null, key text not null, data bytea not null, meta jsonb not null default '{}', primary key(store, key))");
  const put = (s, k, buf, meta) => pool.query('insert into kv(store,key,data,meta) values($1,$2,$3,$4) on conflict(store,key) do update set data=excluded.data, meta=excluded.meta', [s, k, buf, JSON.stringify(meta || {})]);
  const row = async (s, k) => (await pool.query('select data, meta from kv where store=$1 and key=$2', [s, k])).rows[0];
  const mk = s => ({
    get: async (k, o) => { const r = await row(s, k); return r ? (o?.type === 'json' ? JSON.parse(r.data.toString('utf8')) : r.data) : null; },
    setJSON: (k, v) => put(s, k, Buffer.from(JSON.stringify(v)), {}),
    set: (k, v, o) => put(s, k, Buffer.from(v), o?.metadata),
    getWithMetadata: async k => { const r = await row(s, k); return r ? { data: r.data, metadata: r.meta } : null; }
  });
  return { db: mk('db'), files: mk('files'), close: () => pool.end() };
}
