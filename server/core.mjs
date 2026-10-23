// REST API used by server/index.mjs (and by the Vite dev server): stateless, data lives in one JSON document and images in a key-value store.
// Security: HttpOnly + SameSite=Strict session cookie (7-day sliding), login rate limit, CSRF header, strict input validation, no secrets in responses.
import jwt from 'jsonwebtoken'; import crypto from 'crypto'; import { makeSeed, addCatalog, PRICE_MIGRATION } from './seed.mjs';

const slugify = s => String(s).toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const json = (d, status = 200, headers = {}) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...SEC, ...headers } });
const err = (status, error, headers) => json({ error }, status, headers);
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (status, msg) => new HttpError(status, msg);
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const KEY = 'db', MAX = 5 * 1024 * 1024, EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };
const COOKIE = 'sid', TTL = 7 * 24 * 3600, REFRESH_AFTER = 12 * 3600, LIMIT = 5, GLOBAL_LIMIT = 60, WINDOW = 15 * 60 * 1000;
const LENSES = ['Ultrawide', 'Wide', 'Telephoto', 'Night'];
const SPEC_KEYS = ['displaySize', 'displayType', 'refresh', 'nits', 'chipset', 'benchmark', 'ram', 'storage', 'battery', 'wired', 'wireless', 'mainMp', 'uwMp', 'teleMp', 'frontMp', 'weight', 'os', 'ip', 'frame', 'back', 'connectivity'];

// ---------- validation helpers
const T = (v, n) => String(v ?? '').trim().slice(0, n);
const hex = (h, d = '#888888') => /^#[0-9a-f]{3,8}$/i.test(String(h)) ? String(h) : d;
const imgUrl = u => { u = String(u ?? ''); return u.length <= 500 && /^(\/uploads\/[\w.-]+|https?:\/\/[^\s"'<>]+)$/i.test(u) ? u : ''; };
const linkUrl = u => { u = String(u ?? '').trim(); return u.length <= 500 && /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : null; }; // never javascript: or data:
const specs = s => { const o = {}; for (const k of SPEC_KEYS) { const v = s?.[k]; if (v === undefined || v === null || v === '') continue; o[k] = typeof v === 'number' ? (Number.isFinite(v) ? v : 0) : T(v, 100); } return o; };
const readJson = async req => {
  const t = await req.text(); if (t.length > 1_000_000) throw bad(413, 'Request too large');
  try { const v = JSON.parse(t || '{}'); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; return v; } catch { throw bad(400, 'Invalid request'); }
};

// ---------- sessions
const configured = env => (env.JWT_SECRET || '').length >= 16 && !!env.ADMIN_EMAIL && (env.ADMIN_PASSWORD || '').length >= 8;
const stamp = env => crypto.createHash('sha256').update('v1|' + env.ADMIN_EMAIL + '|' + env.ADMIN_PASSWORD).digest('hex').slice(0, 16); // changing the admin email/password signs everyone out
const sign = env => jwt.sign({ sub: 'admin', pv: stamp(env) }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: TTL });
const readCookie = (req, name) => (req.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1) || '';
const session = (req, env) => { if (!configured(env)) return null; try { const p = jwt.verify(readCookie(req, COOKIE), env.JWT_SECRET, { algorithms: ['HS256'] }); return p.pv === stamp(env) ? p : null; } catch { return null; } };
const setCookie = (value, maxAge, secure) => `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` + (secure ? '; Secure' : '');
const isHttps = (req, url) => url.protocol === 'https:' || (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim() === 'https';
const clientIp = req => req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',').pop().trim() || 'unknown';

// ---------- login rate limit (5 wrong tries per IP per 15 min, 60 overall), kept in the same store as the data
const rlKey = id => 'rl:' + sha(id).toString('hex').slice(0, 24);
async function waitSeconds(db, id, limit) {
  const r = await db.get(rlKey(id), { type: 'json' }), now = Date.now();
  return r && now - r.t0 < WINDOW && r.n >= limit ? Math.ceil((r.t0 + WINDOW - now) / 1000) : 0;
}
async function addFailure(db, id) { const r = await db.get(rlKey(id), { type: 'json' }), now = Date.now(); await db.setJSON(rlKey(id), r && now - r.t0 < WINDOW ? { n: r.n + 1, t0: r.t0 } : { n: 1, t0: now }); }

// ---------- data
async function load(store) {
  const d = await store.get(KEY, { type: 'json' });
  if (!d) { const s = makeSeed(); await store.setJSON(KEY, s); return s; }
  if ((d.v || 0) < 3) { // one-time upgrades of older data
    if (!d.v) for (const p of d.phones) { const m = PRICE_MIGRATION[p.slug]; if (m && p.price === m[0]) p.price = m[1]; } // v1 sample prices were in US dollars
    addCatalog(d); d.v = 3; await store.setJSON(KEY, d); // v3: the large sample catalogue
  }
  return d;
}
const hyd = (d, p) => p && ({ ...p, featured: !!p.featured, brand: d.brands.find(b => b.id === p.brand_id) || null, colors: p.colors.map(c => ({ ...c, phone_id: p.id })), images: [...p.images].sort((a, b) => a.sort - b.sort).map(i => ({ ...i, phone_id: p.id })), links: p.links.map(l => ({ ...l, phone_id: p.id })) });
const ORDER = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id, price_asc: (a, b) => (a.price || 1e15) - (b.price || 1e15), price_desc: (a, b) => b.price - a.price,
  battery: (a, b) => (b.specs.battery ?? -1) - (a.specs.battery ?? -1), camera: (a, b) => (b.specs.mainMp ?? -1) - (a.specs.mainMp ?? -1)
};
function list(d, q, admin) {
  const s = String(q.q || '').slice(0, 100).toLowerCase(), lim = Math.min(+q.limit || 12, 100), page = Math.max(+q.page || 1, 1);
  let r = d.phones.filter(p => (admin || p.status === 'published') && d.brands.some(b => b.id === p.brand_id));
  if (s) r = r.filter(p => (p.name || '').toLowerCase().includes(s) || (p.tagline || '').toLowerCase().includes(s));
  if (q.brand) r = r.filter(p => d.brands.find(b => b.id === p.brand_id)?.slug === q.brand);
  if (q.min || q.max) r = r.filter(p => p.price > 0); // a budget filter leaves out phones without a price
  if (q.min) r = r.filter(p => p.price >= +q.min); if (q.max) r = r.filter(p => p.price <= +q.max);
  if (q.featured) r = r.filter(p => p.featured);
  r = [...r].sort(ORDER[q.sort] || ORDER.newest);
  return { total: r.length, page, items: r.slice((page - 1) * lim, page * lim).map(p => hyd(d, p)) };
}
function save(d, id, b) {
  const name = T(b.name, 120); if (!name || !b.brand_id) throw bad(400, 'name and brand_id are required');
  const slug = slugify(T(b.slug, 120)) || slugify(name) || 'phone-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), now = new Date().toISOString();
  if (!d.brands.some(x => x.id === +b.brand_id)) return 'Unknown brand';
  if (d.phones.some(p => p.slug === slug && p.id !== id)) return 'Slug already used by another phone';
  const old = id && d.phones.find(p => p.id === id);
  const p = {
    id: old ? old.id : ++d.seq.phone, brand_id: +b.brand_id, name, slug, tagline: T(b.tagline, 200), description: T(b.description, 5000), release_date: /^\d{4}-\d{2}-\d{2}$/.test(b.release_date || '') ? b.release_date : '',
    price: Math.min(Math.max(Math.round(+b.price) || 0, 0), 1e9), status: b.status === 'published' ? 'published' : 'draft', featured: !!b.featured, main_image: imgUrl(b.main_image), model_url: '', specs: specs(b.specs),
    highlights: (Array.isArray(b.highlights) ? b.highlights : []).map(h => T(h, 200)).filter(Boolean).slice(0, 30), created_at: old ? old.created_at : now, updated_at: now,
    colors: (Array.isArray(b.colors) ? b.colors : []).slice(0, 20).filter(c => c && T(c.name, 40)).map(c => ({ id: ++d.seq.color, name: T(c.name, 40), hex: hex(c.hex), image: imgUrl(c.image) })),
    images: (Array.isArray(b.images) ? b.images : []).slice(0, 60).filter(m => m && imgUrl(m.url)).map((m, i) => ({ id: ++d.seq.image, url: imgUrl(m.url), type: m.type === 'camera' ? 'camera' : 'gallery', lens: LENSES.includes(m.lens) ? m.lens : '', sort: i })),
    links: (Array.isArray(b.links) ? b.links : []).slice(0, 10).filter(l => l && (T(l.store, 60) || T(l.url, 500))).map(l => { const u = linkUrl(l.url); if (!u) throw bad(400, 'Invalid link URL'); return { id: ++d.seq.link, store: T(l.store, 60), url: u }; })
  };
  old ? d.phones[d.phones.indexOf(old)] = p : d.phones.push(p);
  return p;
}
const brandData = b => ({ name: T(b.name, 60), logo: imgUrl(b.logo), accent: hex(b.accent, '#cbd5e1'), sort: Math.max(-1000, Math.min(1000, parseInt(b.sort) || 0)) });
function sniff(u8) { // check the real file type, not the extension
  const a = i => String.fromCharCode(...u8.slice(i, i + 4));
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return ['.jpg', '.jpeg'];
  if (u8[0] === 0x89 && a(1).startsWith('PNG')) return ['.png'];
  if (a(0) === 'RIFF' && a(8) === 'WEBP') return ['.webp'];
  if (a(4) === 'ftyp' && /^avi[fs]$/.test(a(8))) return ['.avif'];
  return null;
}

export async function handle(req, ctx) {
  const st = { cookie: '' }; let res;
  try { res = await route(req, ctx, st); } catch (e) { if (e instanceof HttpError) res = err(e.status, e.message); else { console.error(e); res = err(500, 'Server error'); } } // never leak internals
  if (st.cookie) res.headers.append('Set-Cookie', st.cookie);
  return res;
}

async function route(req, { db, files, env }, st) {
  const url = new URL(req.url), m = req.method, q = Object.fromEntries(url.searchParams), secure = isHttps(req, url);
  // Accept the original path (/api/x) or the rewritten one (/.netlify/functions/api/x), whichever the host passes
  let path = url.pathname.replace(/\/+$/, '').replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '');
  if (!/^\/(api|uploads)(\/|$)/.test(path)) path = '/api' + path;
  // uploaded images
  let x = path.match(/^\/uploads\/([\w.-]+)$/);
  if (x && m === 'GET') {
    const f = await files.getWithMetadata(x[1], { type: 'arrayBuffer' });
    return f ? new Response(f.data, { headers: { 'Content-Type': f.metadata?.type || EXT[x[1].slice(x[1].lastIndexOf('.'))] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Security-Policy': "default-src 'none'; sandbox", ...SEC } }) : new Response('Not found', { status: 404, headers: SEC });
  }
  if (!path.startsWith('/api')) return err(404, 'Not found');
  // CSRF: browsers cannot add this header cross-site without a CORS preflight, which this API never allows
  if (m !== 'GET' && m !== 'HEAD' && req.headers.get('x-requested-with') !== 'studio') return err(403, 'Forbidden');

  if (path === '/api/auth/login' && m === 'POST') {
    if (!configured(env)) return err(500, 'Server not configured: set JWT_SECRET (16+ characters), ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in the environment variables');
    const ip = clientIp(req), wait = Math.max(await waitSeconds(db, ip, LIMIT), await waitSeconds(db, 'all', GLOBAL_LIMIT));
    if (wait) return err(429, 'Too many attempts. Try again later.', { 'Retry-After': String(wait) });
    const b = await readJson(req);
    if (!(same(T(b.email, 256), env.ADMIN_EMAIL) & same(String(b.password ?? '').slice(0, 256), env.ADMIN_PASSWORD))) { await addFailure(db, ip); await addFailure(db, 'all'); return err(401, 'Invalid credentials'); }
    await db.setJSON(rlKey(ip), { n: 0, t0: 0 });
    st.cookie = setCookie(sign(env), TTL, secure); return json({ ok: true });
  }
  if (path === '/api/auth/logout' && m === 'POST') { st.cookie = setCookie('', 0, secure); return json({ ok: true }); }

  const d = await load(db);
  // public
  if (path === '/api/brands' && m === 'GET') return json([...d.brands].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)).map(b => ({ ...b, count: d.phones.filter(p => p.brand_id === b.id && p.status === 'published').length })));
  if (path === '/api/phones' && m === 'GET') return json(list(d, q, false));
  if ((x = path.match(/^\/api\/phones\/([^/]+)$/)) && m === 'GET') { let s; try { s = decodeURIComponent(x[1]); } catch { return err(404, 'Not found'); } const p = d.phones.find(p => p.slug === s && p.status === 'published'); return p ? json(hyd(d, p)) : err(404, 'Not found'); }
  if (path === '/api/compare' && m === 'GET') { const g = s => d.phones.find(p => p.slug === s && p.status === 'published'), a = g(q.a), b = g(q.b); return a && b ? json({ a: hyd(d, a), b: hyd(d, b) }) : err(404, 'Phone not found'); }
  if (!path.startsWith('/api/admin')) return err(404, 'Not found');

  // admin: needs a valid session cookie
  const s = session(req, env); if (!s) return err(401, 'Unauthorized');
  if (Date.now() / 1000 - s.iat > REFRESH_AFTER) st.cookie = setCookie(sign(env), TTL, secure); // sliding session: stay signed in while you keep using it
  const commit = () => db.setJSON(KEY, d), a = path.slice('/api/admin'.length);
  if (a === '/me' && m === 'GET') return json({ ok: true });
  if (a === '/stats' && m === 'GET') return json({ total: d.phones.length, published: d.phones.filter(p => p.status === 'published').length, byBrand: d.brands.map(b => ({ name: b.name, count: d.phones.filter(p => p.brand_id === b.id).length })), recent: [...d.phones].sort(ORDER.newest).slice(0, 5).map(p => ({ id: p.id, name: p.name })) });
  if (a === '/phones' && m === 'GET') return json(list(d, { ...q, limit: q.limit || 100 }, true));
  if (a === '/phones' && m === 'POST') { const p = save(d, 0, await readJson(req)); if (typeof p === 'string') return err(409, p); await commit(); return json(hyd(d, p), 201); }
  if ((x = a.match(/^\/phones\/(\d+)$/))) {
    const id = +x[1], p = d.phones.find(p => p.id === id);
    if (m === 'GET') return p ? json(hyd(d, p)) : err(404, 'Not found');
    if (m === 'PUT') { const b = await readJson(req); if (!p) return err(404, 'Not found'); const r = save(d, id, b); if (typeof r === 'string') return err(409, r); await commit(); return json(hyd(d, r)); }
    if (m === 'DELETE') { d.phones = d.phones.filter(p => p.id !== id); await commit(); return json({ ok: true }); }
  }
  if ((x = a.match(/^\/phones\/(\d+)\/duplicate$/)) && m === 'POST') {
    const p = d.phones.find(p => p.id === +x[1]); if (!p) return err(404, 'Not found');
    const r = save(d, 0, { ...p, name: T(p.name, 105) + ' (copy)', slug: p.slug + '-copy-' + Date.now().toString(36), status: 'draft' }); if (typeof r === 'string') return err(409, r); await commit(); return json(hyd(d, r), 201);
  }
  if (a === '/brands' && m === 'GET') return json([...d.brands].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
  if (a === '/brands' && m === 'POST') {
    const b = brandData(await readJson(req)); if (!b.name) return err(400, 'name required'); const slug = slugify(b.name) || 'brand-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    if (d.brands.some(x => x.slug === slug)) return err(409, 'Brand already exists');
    const r = { id: ++d.seq.brand, ...b, slug }; d.brands.push(r); await commit(); return json(r, 201);
  }
  if ((x = a.match(/^\/brands\/(\d+)$/))) {
    const id = +x[1], r = d.brands.find(b => b.id === id);
    if (m === 'PUT') { const b = brandData(await readJson(req)); if (!b.name) return err(400, 'name required'); if (!r) return err(404, 'Not found'); const slug = slugify(b.name) || r.slug; if (d.brands.some(x => x.slug === slug && x.id !== id)) return err(409, 'Brand already exists'); Object.assign(r, { ...b, slug }); await commit(); return json(r); }
    if (m === 'DELETE') { if (d.phones.some(p => p.brand_id === id)) return err(409, 'Move or delete this brand\u2019s phones first'); d.brands = d.brands.filter(b => b.id !== id); await commit(); return json({ ok: true }); }
  }
  if (a === '/upload' && m === 'POST') {
    const f = (await req.formData().catch(() => null))?.get('file');
    if (!f || typeof f === 'string') return err(400, 'No file');
    if (f.size > MAX) return err(400, 'Image too large (5 MB max)');
    const buf = await f.arrayBuffer(), kind = sniff(new Uint8Array(buf));
    if (!kind) return err(400, 'Only images (jpg, png, webp, avif) are allowed');
    const ext = kind[0], key = crypto.randomBytes(10).toString('hex') + ext;
    await files.set(key, buf, { metadata: { type: EXT[ext] } }); return json({ url: '/uploads/' + key });
  }
  return err(404, 'Not found');
}
