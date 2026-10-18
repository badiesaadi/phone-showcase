// Same REST API as server/index.js, but stateless: data lives in one JSON document and images in a blob store (Netlify Blobs).
import jwt from 'jsonwebtoken'; import crypto from 'crypto'; import { makeSeed } from './seed.mjs';
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const json = (d, status = 200, headers = {}) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const err = (status, error) => json({ error }, status);
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const KEY = 'db', MAX = 5 * 1024 * 1024, EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };

const load = async store => (await store.get(KEY, { type: 'json' })) || (async () => { const d = makeSeed(); await store.setJSON(KEY, d); return d; })();
const hyd = (d, p) => p && ({ ...p, featured: !!p.featured, brand: d.brands.find(b => b.id === p.brand_id) || null, colors: p.colors.map(c => ({ ...c, phone_id: p.id })), images: [...p.images].sort((a, b) => a.sort - b.sort).map(i => ({ ...i, phone_id: p.id })), links: p.links.map(l => ({ ...l, phone_id: p.id })) });
const ORDER = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id, price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
  battery: (a, b) => (b.specs.battery ?? -1) - (a.specs.battery ?? -1), camera: (a, b) => (b.specs.mainMp ?? -1) - (a.specs.mainMp ?? -1)
};
function list(d, q, admin) {
  const s = (q.q || '').toLowerCase(), lim = Math.min(+q.limit || 12, 100), page = Math.max(+q.page || 1, 1);
  let r = d.phones.filter(p => (admin || p.status === 'published') && d.brands.some(b => b.id === p.brand_id));
  if (s) r = r.filter(p => (p.name || '').toLowerCase().includes(s) || (p.tagline || '').toLowerCase().includes(s));
  if (q.brand) r = r.filter(p => d.brands.find(b => b.id === p.brand_id)?.slug === q.brand);
  if (q.min) r = r.filter(p => p.price >= +q.min); if (q.max) r = r.filter(p => p.price <= +q.max);
  if (q.featured) r = r.filter(p => p.featured);
  r = [...r].sort(ORDER[q.sort] || ORDER.newest);
  return { total: r.length, page, items: r.slice((page - 1) * lim, page * lim).map(p => hyd(d, p)) };
}
function save(d, id, b) {
  const slug = b.slug || slugify(b.name), now = new Date().toISOString();
  if (!d.brands.some(x => x.id === +b.brand_id)) return 'Unknown brand';
  if (d.phones.some(p => p.slug === slug && p.id !== id)) return 'Slug already used by another phone';
  const old = id && d.phones.find(p => p.id === id);
  const p = {
    id: old ? old.id : ++d.seq.phone, brand_id: +b.brand_id, name: b.name, slug, tagline: b.tagline || '', description: b.description || '', release_date: b.release_date || '', price: +b.price || 0,
    status: b.status === 'published' ? 'published' : 'draft', featured: !!b.featured, main_image: b.main_image || '', model_url: b.model_url || '', specs: b.specs || {}, highlights: b.highlights || [],
    created_at: old ? old.created_at : now, updated_at: now,
    colors: (b.colors || []).map(c => ({ id: ++d.seq.color, name: c.name, hex: c.hex, image: c.image || '' })),
    images: (b.images || []).map((m, i) => ({ id: ++d.seq.image, url: m.url, type: m.type || 'gallery', lens: m.lens || '', sort: i })),
    links: (b.links || []).map(l => ({ id: ++d.seq.link, store: l.store, url: l.url }))
  };
  old ? d.phones[d.phones.indexOf(old)] = p : d.phones.push(p);
  return p;
}
function sniff(u8) { // check real file type, not just the extension
  const a = i => String.fromCharCode(...u8.slice(i, i + 4));
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return ['.jpg', '.jpeg'];
  if (u8[0] === 0x89 && a(1).startsWith('PNG')) return ['.png'];
  if (a(0) === 'RIFF' && a(8) === 'WEBP') return ['.webp'];
  if (a(4) === 'ftyp' && /^avi[fs]$/.test(a(8))) return ['.avif'];
  return null;
}

export async function handle(req, { db, files, env }) {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, ''), m = req.method, q = Object.fromEntries(url.searchParams);
  try {
    // uploaded images
    let x = path.match(/^\/uploads\/([\w.-]+)$/);
    if (x && m === 'GET') {
      const f = await files.getWithMetadata(x[1], { type: 'arrayBuffer' });
      return f ? new Response(f.data, { headers: { 'Content-Type': f.metadata?.type || EXT[x[1].slice(x[1].lastIndexOf('.'))] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } }) : new Response('Not found', { status: 404 });
    }
    if (!path.startsWith('/api')) return err(404, 'Not found');
    const SECRET = env.JWT_SECRET;
    if (path === '/api/auth/login' && m === 'POST') {
      if (!SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return err(500, 'Server not configured: set JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD in the Netlify environment variables');
      const b = await req.json().catch(() => ({}));
      if (!same(b.email || '', env.ADMIN_EMAIL) | !same(b.password || '', env.ADMIN_PASSWORD)) return err(401, 'Invalid credentials');
      return json({ token: jwt.sign({ email: env.ADMIN_EMAIL }, SECRET, { expiresIn: '8h' }) });
    }
    const d = await load(db);
    // public
    if (path === '/api/brands' && m === 'GET') return json([...d.brands].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)).map(b => ({ ...b, count: d.phones.filter(p => p.brand_id === b.id && p.status === 'published').length })));
    if (path === '/api/phones' && m === 'GET') return json(list(d, q, false));
    if ((x = path.match(/^\/api\/phones\/([^/]+)$/)) && m === 'GET') { const p = d.phones.find(p => p.slug === decodeURIComponent(x[1]) && p.status === 'published'); return p ? json(hyd(d, p)) : err(404, 'Not found'); }
    if (path === '/api/compare' && m === 'GET') { const g = s => d.phones.find(p => p.slug === s && p.status === 'published'), a = g(q.a), b = g(q.b); return a && b ? json({ a: hyd(d, a), b: hyd(d, b) }) : err(404, 'Phone not found'); }
    if (!path.startsWith('/api/admin')) return err(404, 'Not found');
    // admin (JWT)
    try { jwt.verify((req.headers.get('authorization') || '').slice(7), SECRET || ''); } catch { return err(401, 'Unauthorized'); }
    const commit = () => db.setJSON(KEY, d), a = path.slice('/api/admin'.length);
    if (a === '/stats' && m === 'GET') return json({ total: d.phones.length, published: d.phones.filter(p => p.status === 'published').length, byBrand: d.brands.map(b => ({ name: b.name, count: d.phones.filter(p => p.brand_id === b.id).length })), recent: [...d.phones].sort(ORDER.newest).slice(0, 5).map(p => ({ id: p.id, name: p.name })) });
    if (a === '/phones' && m === 'GET') return json(list(d, { ...q, limit: q.limit || 100 }, true));
    if (a === '/phones' && m === 'POST') {
      const b = await req.json(); if (!b.name || !b.brand_id) return err(400, 'name and brand_id are required');
      const p = save(d, 0, b); if (typeof p === 'string') return err(409, p); await commit(); return json(hyd(d, p), 201);
    }
    if ((x = a.match(/^\/phones\/(\d+)$/))) {
      const id = +x[1], p = d.phones.find(p => p.id === id);
      if (m === 'GET') return p ? json(hyd(d, p)) : err(404, 'Not found');
      if (m === 'PUT') { const b = await req.json(); if (!b.name || !b.brand_id) return err(400, 'name and brand_id are required'); if (!p) return err(404, 'Not found'); const r = save(d, id, b); if (typeof r === 'string') return err(409, r); await commit(); return json(hyd(d, r)); }
      if (m === 'DELETE') { d.phones = d.phones.filter(p => p.id !== id); await commit(); return json({ ok: true }); }
    }
    if ((x = a.match(/^\/phones\/(\d+)\/duplicate$/)) && m === 'POST') {
      const p = d.phones.find(p => p.id === +x[1]); if (!p) return err(404, 'Not found');
      const r = save(d, 0, { ...p, name: p.name + ' (copy)', slug: p.slug + '-copy-' + Date.now().toString(36), status: 'draft' }); await commit(); return json(hyd(d, r), 201);
    }
    if (a === '/brands' && m === 'GET') return json([...d.brands].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
    if (a === '/brands' && m === 'POST') {
      const b = await req.json(); if (!b.name) return err(400, 'name required'); const slug = slugify(b.name);
      if (d.brands.some(x => x.slug === slug)) return err(409, 'Brand already exists');
      const r = { id: ++d.seq.brand, name: b.name, slug, logo: b.logo || '', accent: b.accent || '#cbd5e1', sort: +b.sort || 0 }; d.brands.push(r); await commit(); return json(r, 201);
    }
    if ((x = a.match(/^\/brands\/(\d+)$/))) {
      const id = +x[1], r = d.brands.find(b => b.id === id);
      if (m === 'PUT') { const b = await req.json(); if (!r) return err(404, 'Not found'); const slug = slugify(b.name); if (d.brands.some(x => x.slug === slug && x.id !== id)) return err(409, 'Brand already exists'); Object.assign(r, { name: b.name, slug, logo: b.logo || '', accent: b.accent || '#cbd5e1', sort: +b.sort || 0 }); await commit(); return json(r); }
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
  } catch (e) { return err(500, e.message); }
}
