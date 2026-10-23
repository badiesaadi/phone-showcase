import { lazy, ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { hint, logout, useGet } from './api'; import { setSound, soundOn, tick } from './sound'; import { Home, PhonePage, Compare, Brands, BrandPage } from './pages'; import { LANGS, useI18n } from './i18n';
const adm = (k: string) => lazy(() => import('./admin').then(x => ({ default: (x as any)[k] })));
const Login = adm('Login'), AdminList = adm('AdminList'), AdminEdit = adm('AdminEdit'), AdminBrands = adm('AdminBrands');
const NAV: [string, string][] = [['/', 'nav.explore'], ['/brands', 'nav.brands'], ['/compare', 'nav.versus']];
const Skel = () => <div className="sk h-96 rounded-3xl mt-6" />;

function LangSwitch() {
  const { t, lang, setLang } = useI18n();
  return <div role="group" aria-label={t('lang.label')} className="glass rounded-full p-0.5 flex">{LANGS.map(([l, n]) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={'px-2 sm:px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold active:scale-95 transition ' + (lang === l ? 'bg-white/15' : 'text-slate-400')}>{n}</button>)}</div>;
}
function SoundBtn() {
  const { t } = useI18n(), [snd, setSnd] = useState(soundOn());
  return <button className="btn" aria-label={snd ? t('sound.on') : t('sound.off')} onClick={() => { setSound(!snd); setSnd(!snd); }}><span className="sm:hidden">{snd ? '🔊' : '🔇'}</span><span className="hidden sm:inline">{snd ? t('sound.on') : t('sound.off')}</span></button>;
}
const Logo = ({ to, children }: { to: string; children?: ReactNode }) => <Link to={to} className="font-extrabold tracking-tighter text-[15px] sm:text-xl">OBSIDIAN<span style={{ color: 'var(--a,#94a3b8)' }}>.</span>STUDIO{children}</Link>;

// Background effects shared by every layout (progress bar, cursor glow, dot grid)
function Backdrop({ children }: { children: ReactNode }) {
  const loc = useLocation(), glow = useRef<HTMLDivElement>(null), bar = useRef<HTMLDivElement>(null), raf = useRef(0);
  useEffect(() => { scrollTo(0, 0); }, [loc.pathname]); // a new page starts at the top
  useEffect(() => { // scroll progress bar: one composited transform, updated at most once per frame
    let r = 0; const f = () => { r = 0; const d = document.documentElement; if (bar.current) bar.current.style.transform = `scaleX(${d.scrollTop / Math.max(1, d.scrollHeight - innerHeight)})`; };
    const on = () => { if (!r) r = requestAnimationFrame(f); }; addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on);
  }, []);
  return <div className="min-h-screen" onPointerDown={e => { if ((e.target as HTMLElement).closest('.btn,button,a')) tick(); }}
    onPointerMove={e => { if (e.pointerType !== 'mouse' || raf.current) return; const { clientX: x, clientY: y } = e; raf.current = requestAnimationFrame(() => { raf.current = 0; if (glow.current) glow.current.style.transform = `translate3d(${x - 320}px,${y - 320}px,0)`; }); }}>
    <div ref={bar} className="fixed top-0 inset-x-0 h-0.5 origin-left rtl:origin-right z-50" style={{ transform: 'scaleX(0)', background: 'var(--a,#94a3b8)' }} />
    <div ref={glow} className="fixed top-0 left-0 w-[640px] h-[640px] pointer-events-none will-change-transform" style={{ background: 'radial-gradient(circle,color-mix(in srgb,var(--a,#94a3b8) 20%,transparent),transparent 65%)', transform: 'translate3d(calc(50vw - 320px),40px,0)' }} />
    <div className="fixed inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
    {children}
  </div>;
}

// ---- public site: what visitors see. The Dashboard link only appears for a signed-in admin.
function PublicShell() {
  const { t } = useI18n(), loc = useLocation(), items: [string, string][] = hint() ? [...NAV, ['/admin', 'a.dashboard']] : NAV;
  return <Backdrop>
    <header className="relative max-w-6xl mx-auto px-5 pt-5 flex items-center justify-between"><Logo to="/" />
      <nav className="hidden md:flex gap-2">{items.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'btn ' + (isActive ? 'bg-white/10' : '')}>{t(l)}</NavLink>)}</nav>
      <div className="flex items-center gap-2"><LangSwitch /><SoundBtn /></div></header>
    <main className="relative max-w-6xl mx-auto px-5 pt-4 pb-32"><div key={loc.pathname} className="page-in"><Outlet /></div></main>
    <nav className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-3 z-40 glass backdrop-blur-xl bg-slate-950/70 rounded-full flex gap-1 p-1.5 w-[min(92vw,420px)] shadow-2xl">{items.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'flex-1 text-center py-2.5 rounded-full text-xs font-semibold active:scale-95 transition ' + (isActive ? 'bg-white/10' : 'text-slate-400')}>{t(l)}</NavLink>)}</nav>
  </Backdrop>;
}

// ---- admin area: its own header and menu, protected by the session cookie (checked with the server on every visit)
function AdminShell() {
  const { t } = useI18n(), nav = useNavigate(), loc = useLocation(), me = useGet('/admin/me');
  useEffect(() => { const f = () => nav('/admin/login', { replace: true }); addEventListener('auth-expired', f); return () => removeEventListener('auth-expired', f); }, [nav]);
  useEffect(() => { if (me?.error) nav('/admin/login', { replace: true }); }, [me, nav]);
  const tab = ({ isActive }: any) => 'btn ' + (isActive ? 'bg-white/10' : '');
  return <Backdrop>
    <header className="relative max-w-6xl mx-auto px-5 pt-5">
      <div className="flex items-center justify-between gap-3"><Logo to="/admin"><span className="ms-2 align-middle text-[10px] font-semibold tracking-widest uppercase rounded-full border border-white/15 px-2 py-0.5 text-slate-300">{t('a.admin')}</span></Logo>
        <div className="flex items-center gap-2"><LangSwitch /><button className="btn" onClick={async () => { await logout(); nav('/admin/login', { replace: true }); }}>{t('a.logout')}</button></div></div>
      <nav className="mt-4 flex flex-wrap items-center gap-2"><NavLink to="/admin" end className={tab}>{t('a.dashboard')}</NavLink><NavLink to="/admin/brands" className={tab}>{t('a.managebrands')}</NavLink>
        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden /><span className="text-sm text-slate-400">{t('a.viewsite')}</span>{NAV.map(([to, l]) => <Link key={to} to={to} className="btn">{t(l)}</Link>)}</nav></header>
    <main className="relative max-w-6xl mx-auto px-5 pt-2 pb-24">{me?.ok ? <div key={loc.pathname} className="page-in"><Suspense fallback={<Skel />}><Outlet /></Suspense></div> : <Skel />}</main>
  </Backdrop>;
}

// ---- sign-in screen: no menus at all
function AuthShell() {
  return <Backdrop><header className="relative max-w-6xl mx-auto px-5 pt-5 flex items-center justify-between"><Logo to="/" /><LangSwitch /></header>
    <main className="relative max-w-6xl mx-auto px-5 pt-4 pb-24"><Suspense fallback={<Skel />}><Outlet /></Suspense></main></Backdrop>;
}

function NotFound() {
  const { t } = useI18n();
  return <div className="mt-24 text-center"><p className="text-6xl font-extrabold tracking-tighter">404</p><p className="mt-3 text-slate-400">{t('nf.title')}</p><Link to="/" className="btn mt-6 inline-block">{t('nf.home')}</Link></div>;
}

export default function App() {
  return <Routes>
    <Route element={<PublicShell />}><Route path="/" element={<Home />} /><Route path="/phones/:slug" element={<PhonePage />} /><Route path="/compare" element={<Compare />} /><Route path="/brands" element={<Brands />} /><Route path="/brands/:slug" element={<BrandPage />} /><Route path="*" element={<NotFound />} /></Route>
    <Route element={<AuthShell />}><Route path="/admin/login" element={<Login />} /></Route>
    <Route path="/admin" element={<AdminShell />}><Route index element={<AdminList />} /><Route path="brands" element={<AdminBrands />} /><Route path="phones/:id" element={<AdminEdit />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Route>
  </Routes>;
}
