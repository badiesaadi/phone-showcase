import { useEffect, useState } from 'react';
const K = 'tok'; export const tok = () => localStorage.getItem(K);
// Shrink photos in the browser (max 1600px, WebP) so uploads stay small; the server no longer needs an image library.
async function shrink(fd: FormData) {
  const f = fd.get('file'); if (!(f instanceof File) || !/^image\/(jpeg|png|webp)$/.test(f.type)) return fd;
  try { const bmp = await createImageBitmap(f), k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); const b = await new Promise<Blob | null>(r => c.toBlob(r, 'image/webp', 0.82));
    if (b && b.type === 'image/webp' && b.size < f.size) { const n = new FormData(); n.append('file', b, f.name.replace(/\.\w+$/, '') + '.webp'); return n; } } catch {}
  return fd;
}
export async function api(p: string, o: any = {}) {
  if (o.body instanceof FormData && p === '/admin/upload') o = { ...o, body: await shrink(o.body) };
  const fd = o.body instanceof FormData, h: any = fd ? {} : { 'Content-Type': 'application/json' }; if (tok()) h.Authorization = 'Bearer ' + tok();
  const r = await fetch('/api' + p, { ...o, headers: h, body: o.body && !fd ? JSON.stringify(o.body) : o.body });
  if (r.status === 401 && p.startsWith('/admin')) { localStorage.removeItem(K); location.href = '/admin/login'; }
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}
export const login = async (email: string, password: string) => { localStorage.setItem(K, (await api('/auth/login', { method: 'POST', body: { email, password } })).token); };
export const logout = () => localStorage.removeItem(K);
export const useGet = (p: string) => { const [d, s] = useState<any>(null); useEffect(() => { s(null); api(p).then(s).catch(e => s({ error: e.message })); }, [p]); return d; };
