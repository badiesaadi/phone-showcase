import { lazy, Suspense, useEffect, useRef, useState } from 'react'; import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { tok } from './api'; import { setSound, soundOn, tick } from './sound'; import { Home, PhonePage, Compare, Brands, BrandPage } from './pages';
const adm = (k: string) => lazy(() => import('./admin').then(x => ({ default: (x as any)[k] })));
const Login = adm('Login'), AdminList = adm('AdminList'), AdminEdit = adm('AdminEdit'), AdminBrands = adm('AdminBrands');
const NAV: [string, string][] = [['/', 'Explore'], ['/brands', 'Brands'], ['/compare', 'Versus'], ['/admin', 'Admin']];
const guard = (el: any) => tok() ? el : <Navigate to="/admin/login" replace />;
export default function App() {
  const loc = useLocation(), [snd, setSnd] = useState(soundOn()), glow = useRef<HTMLDivElement>(null), bar = useRef<HTMLDivElement>(null), raf = useRef(0);
  useEffect(() => { // scroll progress bar: one composited transform, updated at most once per frame
    let r = 0; const f = () => { r = 0; const d = document.documentElement; if (bar.current) bar.current.style.transform = `scaleX(${d.scrollTop / Math.max(1, d.scrollHeight - innerHeight)})`; };
    const on = () => { if (!r) r = requestAnimationFrame(f); }; addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on);
  }, []);
  return <div className="min-h-screen" onPointerDown={e => { if ((e.target as HTMLElement).closest('.btn,button,a')) tick(); }}
    onPointerMove={e => { if (e.pointerType !== 'mouse' || raf.current) return; const { clientX: x, clientY: y } = e; raf.current = requestAnimationFrame(() => { raf.current = 0; if (glow.current) glow.current.style.transform = `translate3d(${x - 320}px,${y - 320}px,0)`; }); }}>
    <div ref={bar} className="fixed top-0 inset-x-0 h-0.5 origin-left z-50" style={{ transform: 'scaleX(0)', background: 'var(--a,#94a3b8)' }} />
    <div ref={glow} className="fixed top-0 left-0 w-[640px] h-[640px] pointer-events-none will-change-transform" style={{ background: 'radial-gradient(circle,color-mix(in srgb,var(--a,#94a3b8) 20%,transparent),transparent 65%)', transform: 'translate3d(calc(50vw - 320px),40px,0)' }} />
    <div className="fixed inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
    <header className="relative max-w-6xl mx-auto px-5 pt-5 flex items-center justify-between"><Link to="/" className="font-extrabold tracking-tighter text-xl">OBSIDIAN<span style={{ color: 'var(--a,#94a3b8)' }}>.</span>STUDIO</Link>
      <nav className="hidden md:flex gap-2">{NAV.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'btn ' + (isActive ? 'bg-white/10' : '')}>{l}</NavLink>)}</nav>
      <button className="btn" onClick={() => { setSound(!snd); setSnd(!snd); }}>{snd ? 'Sound on' : 'Sound off'}</button></header>
    <main className="relative max-w-6xl mx-auto px-5 pt-4 pb-32"><div key={loc.pathname} className="page-in"><Suspense fallback={<div className="sk h-96 rounded-3xl mt-6" />}>
      <Routes location={loc}><Route path="/" element={<Home />} /><Route path="/phones/:slug" element={<PhonePage />} /><Route path="/compare" element={<Compare />} /><Route path="/brands" element={<Brands />} /><Route path="/brands/:slug" element={<BrandPage />} />
        <Route path="/admin/login" element={<Login />} /><Route path="/admin" element={guard(<AdminList />)} /><Route path="/admin/brands" element={guard(<AdminBrands />)} /><Route path="/admin/phones/:id" element={guard(<AdminEdit />)} /></Routes></Suspense></div></main>
    <nav className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-3 z-40 glass backdrop-blur-xl bg-slate-950/70 rounded-full flex gap-1 p-1.5 w-[min(92vw,420px)] shadow-2xl">{NAV.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'flex-1 text-center py-2.5 rounded-full text-xs font-semibold active:scale-95 transition ' + (isActive ? 'bg-white/10' : 'text-slate-400')}>{l}</NavLink>)}</nav>
  </div>;
}
