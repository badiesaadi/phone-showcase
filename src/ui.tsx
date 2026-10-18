import { useEffect, useRef } from 'react';
// Fade/slide in once when scrolled into view (CSS only, no animation library)
export function Reveal({ as: T = 'div', delay = 0, className = '', children, ...p }: any) {
  const r = useRef<any>(null);
  useEffect(() => { const e = r.current; if (!e) return; const io = new IntersectionObserver(([x]) => { if (x.isIntersecting) { e.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -60px' }); io.observe(e); return () => io.disconnect(); }, []);
  return <T ref={r} className={'rv ' + className} style={delay ? { transitionDelay: delay + 's' } : undefined} {...p}>{children}</T>;
}
// Lightweight CSS phone shown when a phone has no image yet; the colour follows the swatch
export function PhoneMock({ color = '#888', accent = '#cbd5e1', name = '' }: any) {
  return <div role="img" aria-label={name} className="relative h-full max-h-[420px] aspect-[9/19] transition-colors duration-500">
    <div className="absolute inset-0 rounded-[2.4rem] p-[3%]" style={{ background: `linear-gradient(145deg,${color},#0b1020)`, boxShadow: `0 40px 90px -30px ${accent},inset 0 0 0 2px rgba(255,255,255,.12)` }}>
      <div className="w-full h-full rounded-[2rem] relative overflow-hidden" style={{ background: `linear-gradient(160deg,#050914,${accent}88 60%,#050914)` }}>
        <span className="absolute top-3 left-1/2 -translate-x-1/2 w-[28%] h-3 rounded-full bg-black" /><div className="absolute inset-x-0 top-[24%] text-center text-4xl font-bold">9:41</div></div></div></div>;
}
export function Visual({ p, color, img }: any) {
  const src = img || p.main_image;
  return src ? <img key={src} src={src} alt={p.name} decoding="async" className="w-full h-full object-contain p-6 rv in" /> : <div className="h-full grid place-items-center p-6"><PhoneMock color={color} accent={p.brand?.accent} name={p.name} /></div>;
}
