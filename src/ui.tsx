import { useEffect, useId, useRef } from 'react';
// Fade/slide in once when scrolled into view (CSS only, no animation library)
export function Reveal({ as: T = 'div', delay = 0, className = '', children, ...p }: any) {
  const r = useRef<any>(null);
  useEffect(() => { const e = r.current; if (!e) return; const io = new IntersectionObserver(([x]) => { if (x.isIntersecting) { e.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -60px' }); io.observe(e); return () => io.disconnect(); }, []);
  return <T ref={r} className={'rv ' + className} style={delay ? { transitionDelay: delay + 's' } : undefined} {...p}>{children}</T>;
}
// Phone illustration shown when a phone has no photo: back view (colour swatch + the brand's camera layout) and front view
const hx = (h: string) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h || ''); if (!m) return [90, 96, 110]; let s = m[1]; if (s.length === 3) s = s.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
const mixc = (h: string, to: number[], k: number) => { const c = hx(h); return `rgb(${c.map((v, i) => Math.round(v + (to[i] - v) * k)).join(',')})`; };
const LAYOUT: Record<string, string> = { apple: 'plate', vivo: 'plate', samsung: 'trio', 'google-pixel': 'bar', xiaomi: 'circle', oneplus: 'circle', honor: 'circle', huawei: 'circle', 'asus-rog': 'rog' };
export function PhoneMock({ color = '#5a606e', accent = '#cbd5e1', name = '', brand = '' }: any) {
  const id = useId().replace(/:/g, ''), kind = LAYOUT[brand] || 'pill', x = 28, y = 40;
  const lens = (cx: number, cy: number, r: number) => <g key={cx + '-' + cy}><circle cx={cx} cy={cy} r={r} fill="#07090f" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><circle cx={cx} cy={cy} r={r * .55} fill="#12182c" /><circle cx={cx - r * .28} cy={cy - r * .3} r={r * .16} fill="rgba(255,255,255,.6)" /></g>;
  const flash = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="3.2" fill="#f4e7c3" opacity=".85" />;
  const cam = kind === 'plate' ? <><rect x={x + 10} y={y + 10} width="64" height="64" rx="16" fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.22)" />{lens(x + 28, y + 28, 11)}{lens(x + 28, y + 56, 11)}{lens(x + 54, y + 42, 11)}{flash(x + 55, y + 21)}</>
    : kind === 'trio' ? <>{lens(x + 26, y + 28, 11)}{lens(x + 26, y + 58, 11)}{lens(x + 26, y + 88, 11)}{flash(x + 52, y + 30)}</>
    : kind === 'bar' ? <><rect x={x} y={y + 56} width="140" height="36" fill="#0a0c12" opacity=".92" />{lens(x + 44, y + 74, 10)}{lens(x + 72, y + 74, 10)}{flash(x + 98, y + 68)}</>
    : kind === 'circle' ? <><circle cx={x + 48} cy={y + 48} r="36" fill="rgba(0,0,0,.35)" stroke={accent} strokeWidth="2" />{lens(x + 37, y + 37, 9)}{lens(x + 59, y + 37, 9)}{lens(x + 37, y + 59, 9)}{flash(x + 60, y + 60)}</>
    : kind === 'rog' ? <><rect x={x + 10} y={y + 10} width="76" height="70" rx="10" fill="rgba(0,0,0,.4)" stroke={accent} strokeWidth="2" />{lens(x + 34, y + 34, 11)}{lens(x + 34, y + 62, 9)}<rect x={x + 58} y={y + 22} width="20" height="3" fill={accent} /><rect x={x + 58} y={y + 30} width="14" height="3" fill={accent} opacity=".6" /></>
    : <><rect x={x + 12} y={y + 12} width="40" height="92" rx="20" fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.22)" />{lens(x + 32, y + 34, 10)}{lens(x + 32, y + 62, 10)}{flash(x + 32, y + 88)}</>;
  return <svg viewBox="0 0 320 370" role="img" aria-label={name} preserveAspectRatio="xMidYMid meet" className="w-full h-full transition-all duration-500" style={{ filter: 'drop-shadow(0 22px 26px rgba(0,0,0,.5))' }}>
    <defs>
      <linearGradient id={id + 'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mixc(color, [255, 255, 255], .22)} /><stop offset=".5" stopColor={color} /><stop offset="1" stopColor={mixc(color, [0, 0, 0], .55)} /></linearGradient>
      <linearGradient id={id + 'g'} x1="0" y1="0" x2="1" y2=".8"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <linearGradient id={id + 's'} x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#0b1226" /><stop offset=".55" stopColor={accent} stopOpacity=".5" /><stop offset="1" stopColor="#05070f" /></linearGradient>
      <filter id={id + 'f'}><feGaussianBlur stdDeviation="10" /></filter>
    </defs>
    <ellipse cx="170" cy="352" rx="112" ry="13" fill={accent} opacity=".4" filter={`url(#${id}f)`} />
    <g transform="rotate(-7 98 185)"><rect x={x - 3} y="120" width="3" height="46" rx="1.5" fill={mixc(color, [0, 0, 0], .35)} />
      <rect x={x} y={y} width="140" height="290" rx="26" fill={`url(#${id}b)`} stroke="rgba(255,255,255,.22)" strokeWidth="1.5" /><rect x={x} y={y} width="140" height="290" rx="26" fill={`url(#${id}g)`} />{cam}</g>
    <g transform="rotate(5 220 180)"><rect x="290" y="110" width="3" height="44" rx="1.5" fill={mixc(color, [0, 0, 0], .35)} />
      <rect x="150" y="30" width="140" height="300" rx="27" fill={mixc(color, [0, 0, 0], .4)} stroke="rgba(255,255,255,.25)" strokeWidth="1.5" /><rect x="156" y="36" width="128" height="288" rx="21" fill="#04060d" /><rect x="156" y="36" width="128" height="288" rx="21" fill={`url(#${id}s)`} />
      {kind === 'plate' ? <rect x="200" y="46" width="40" height="11" rx="5.5" fill="#000" /> : <circle cx="220" cy="52" r="4.6" fill="#000" />}
      <text x="220" y="118" textAnchor="middle" fill="#fff" fontSize="40" fontWeight="700" fontFamily="system-ui,sans-serif">9:41</text><rect x="196" y="130" width="48" height="4" rx="2" fill="#fff" opacity=".35" />
      <rect x="170" y="180" width="100" height="42" rx="12" fill={accent} opacity=".25" /><rect x="170" y="230" width="46" height="46" rx="12" fill="#fff" opacity=".09" /><rect x="224" y="230" width="46" height="46" rx="12" fill="#fff" opacity=".09" /></g>
  </svg>;
}
export function Visual({ p, color, img }: any) {
  const src = img || p.main_image;
  return src ? <img key={src} src={src} alt={p.name} decoding="async" className="w-full h-full object-contain p-6 rv in" /> : <div className="h-full p-3"><PhoneMock color={color} accent={p.brand?.accent} name={p.name} brand={p.brand?.slug} /></div>;
}
