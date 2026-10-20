import { useEffect, useState } from 'react'; import { errT } from './i18n';
// The session is an HttpOnly cookie the browser keeps (JS cannot read it). 'admin' below is only a UI hint for showing the Dashboard link.
const HINT = 'admin'; export const hint = () => { try { return localStorage.getItem(HINT) === '1'; } catch { return false; } };
// Shrink photos in the browser (max 1600px, WebP) so uploads stay small; the server no longer needs an image library.
async function shrink(fd: FormData) {
  const f = fd.get('file'); if (!(f instanceof File) || !/^image\/(jpeg|png|webp)$/.test(f.type)) return fd;
  try { const bmp = await createImageBitmap(f), k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); const enc = (t: string, q?: number) => new Promise<Blob | null>(r => c.toBlob(r, t, q));
    let b = await enc('image/webp', 0.82); if (b?.type !== 'image/webp') b = await enc(f.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85); // e.g. Safari cannot encode WebP
    if (b && b.size < f.size) { const n = new FormData(); n.append('file', b, f.name.replace(/\.\w+$/, '') + (({ 'image/webp': '.webp', 'image/png': '.png' } as any)[b.type] || '.jpg')); return n; } } catch {}
  return fd;
}
export async function api(p: string, o: any = {}) {
  if (o.body instanceof FormData && p === '/admin/upload') o = { ...o, body: await shrink(o.body) };
  const fd = o.body instanceof FormData, h: any = fd ? {} : { 'Content-Type': 'application/json' }; if ((o.method || 'GET') !== 'GET') h['X-Requested-With'] = 'studio'; // CSRF guard: the server refuses writes without it
  const r = await fetch('/api' + p, { ...o, headers: h, credentials: 'same-origin', body: o.body && !fd ? JSON.stringify(o.body) : o.body });
  if (r.status === 401 && p.startsWith('/admin')) { try { localStorage.removeItem(HINT); } catch {} dispatchEvent(new Event('auth-expired')); }
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(errT(j.error || 'Request failed')); return j;
}
export const login = async (email: string, password: string) => { await api('/auth/login', { method: 'POST', body: { email, password } }); try { localStorage.setItem(HINT, '1'); } catch {} };
export const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} try { localStorage.removeItem(HINT); } catch {} };
export const useGet = (p: string) => { const [d, s] = useState<any>(null); useEffect(() => { let on = true; s(null); api(p).then(x => on && s(x)).catch(e => on && s({ error: e.message })); return () => { on = false; }; }, [p]); return d; };
