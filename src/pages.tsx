import { useEffect, useState } from 'react'; import { Link, useParams } from 'react-router-dom';  import { useGet } from './api'; import { Reveal, Visual } from './ui';
const accent = (p: any) => p?.brand?.accent || '#94a3b8';
const money = (n: number) => '$' + Math.round(n).toLocaleString();
export function Home() {
  const [q, setQ] = useState(''), [b, setB] = useState(''), [s, setS] = useState('newest'), brands = useGet('/brands'), feat = useGet('/phones?featured=1&limit=1'), d = useGet(`/phones?q=${encodeURIComponent(q)}&brand=${b}&sort=${s}&limit=24`);
  const hero = feat?.items?.[0]; useEffect(() => { document.title = 'Obsidian Studio | Flagship phones in 3D'; document.body.style.setProperty('--a', accent(hero)); }, [hero]);
  return <div>
    <section className="grid md:grid-cols-2 items-center gap-6 pt-6"><div><h1 className="text-[clamp(2.4rem,8vw,5rem)] font-extrabold tracking-tighter leading-[.95]">Flagships,<br /><span style={{ color: accent(hero) }}>in full dimension.</span></h1>
      <p className="mt-4 text-slate-400 max-w-md">Spin, explode and compare today’s top smartphones.</p>{hero && <Link to={'/phones/' + hero.slug} className="btn inline-block mt-6" style={{ background: accent(hero), color: '#020617' }}>Explore {hero.name}</Link>}</div>
      <div className="h-[420px] glass rounded-[2rem] overflow-hidden">{hero ? <Visual p={hero} color={hero.colors[0]?.hex} img={hero.colors[0]?.image} /> : <div className="sk h-full" />}</div></section>
    <div className="mt-10 flex flex-wrap gap-3"><input className="inp !w-56" placeholder="Search phones" value={q} onChange={e => setQ(e.target.value)} />
      <select className="inp !w-40" value={s} onChange={e => setS(e.target.value)}>{[['newest', 'Newest'], ['price_asc', 'Price ↑'], ['price_desc', 'Price ↓'], ['battery', 'Battery'], ['camera', 'Camera MP']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div className="mt-4 flex gap-2 overflow-x-auto">{[{ slug: '', name: 'All' }, ...(brands || [])].map((x: any) => <button key={x.slug} onClick={() => setB(x.slug)} className="btn shrink-0" style={b === x.slug ? { background: x.accent || '#e2e8f0', color: '#020617' } : {}}>{x.name}</button>)}</div>
    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{!d ? Array(6).fill(0).map((_, i) => <div key={i} className="sk h-60 rounded-3xl" />) : d.items?.length ? d.items.map((p: any) =>
      <Card key={p.id} p={p} />) : <p className="text-slate-400">No phones match.</p>}</div></div>;
}
export const Card = ({ p }: any) => (<Reveal><Link to={'/phones/' + p.slug} className="glass lift rounded-3xl p-5 block h-60 relative overflow-hidden" style={{ boxShadow: `0 30px 80px -45px ${accent(p)}` }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: accent(p) }} />{p.main_image && <img src={p.main_image} alt={p.name} loading="lazy" className="absolute right-3 top-3 h-32 object-contain" />}
        <p className="text-xs font-semibold" style={{ color: accent(p) }}>{p.brand.name}</p><h3 className="text-2xl font-extrabold tracking-tighter w-3/5 leading-tight">{p.name}</h3><p className="mt-2 text-sm text-slate-400 w-3/5">{p.tagline}</p>
        <div className="absolute left-5 bottom-5 flex gap-2"><span className="badge">{p.specs.chipset}</span><span className="badge">{money(p.price)}</span></div></Link></Reveal>);
const H2 = 'text-3xl font-extrabold tracking-tighter';
const LENS = ['Ultrawide', 'Wide', 'Telephoto', 'Night'];
function Samples({ p, a }: any) {
  const cam = p.images.filter((i: any) => i.type === 'camera'), tabs = LENS.filter(l => cam.some((i: any) => i.lens === l)), [t, setT] = useState(tabs[0]), cur = tabs.includes(t) ? t : tabs[0];
  if (!tabs.length) return null;
  return <section className="mt-16"><Reveal as="h2" className={H2}>Camera samples</Reveal><div className="mt-4 flex flex-wrap gap-2">{tabs.map(l => <button key={l} onClick={() => setT(l)} className="btn" style={cur === l ? { background: a, color: '#020617' } : {}}>{l}</button>)}</div>
    <Reveal key={cur} className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{cam.filter((i: any) => i.lens === cur).map((i: any) => <img key={i.id} src={i.url} alt={`${p.name} ${cur} sample`} loading="lazy" decoding="async" className="rounded-3xl w-full aspect-[4/3] object-cover" />)}</Reveal></section>;
}
function Highlights({ p, a }: any) {
  const g = p.images.filter((i: any) => i.type !== 'camera');
  return <>{!!p.highlights.length && <section className="mt-16"><Reveal as="h2" className={H2}>Highlights</Reveal><div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{p.highlights.map((x: string, i: number) =>
    <Reveal key={x} delay={(i % 3) * .1} className="glass rounded-3xl p-6 min-h-32 flex items-end"><p className="text-xl font-bold tracking-tight" style={{ color: i % 2 ? undefined : a }}>{x}</p></Reveal>)}</div></section>}
    {!!g.length && <section className="mt-16"><Reveal as="h2" className={H2}>Gallery</Reveal><div className="mt-4 flex gap-3 overflow-x-auto snap-x pb-2">{g.map((i: any) => <Reveal as="img" key={i.id} src={i.url} alt={p.name} loading="lazy" decoding="async" className="h-72 rounded-3xl snap-center shrink-0" />)}</div></section>}</>;
}
export function Brands() {
  const b = useGet('/brands'); useEffect(() => { document.title = 'Brands | Obsidian Studio'; }, []);
  return <div className="mt-6"><h1 className="text-[clamp(2rem,7vw,4rem)] font-extrabold tracking-tighter">Brands</h1><div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{!Array.isArray(b) ? Array(6).fill(0).map((_, i) => <div key={i} className="sk h-40 rounded-3xl" />) : b.map((x: any) =>
    <Reveal key={x.id}><Link to={'/brands/' + x.slug} className="glass lift rounded-3xl p-6 block h-40 relative overflow-hidden" style={{ boxShadow: `0 30px 80px -45px ${x.accent}` }}><div className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: x.accent }} />
      {x.logo && <img src={x.logo} alt="" className="h-9 mb-2 relative" />}<h3 className="relative text-2xl font-extrabold tracking-tighter">{x.name}</h3><p className="relative text-sm text-slate-400">{x.count} phone{x.count === 1 ? '' : 's'}</p></Link></Reveal>)}</div></div>;
}
export function BrandPage() {
  const { slug } = useParams(), brands = useGet('/brands'), d = useGet(`/phones?brand=${slug}&limit=50`), br = Array.isArray(brands) ? brands.find((x: any) => x.slug === slug) : null;
  useEffect(() => { if (br) { document.title = br.name + ' | Obsidian Studio'; document.body.style.setProperty('--a', br.accent); } }, [br]);
  return <div className="mt-6"><section className="glass rounded-[2rem] p-8 relative overflow-hidden"><div className="absolute -right-10 -top-10 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: br?.accent }} />{br?.logo && <img src={br.logo} alt="" className="h-12 mb-3 relative" />}
    <h1 className="relative text-[clamp(2.4rem,8vw,5rem)] font-extrabold tracking-tighter" style={{ color: br?.accent }}>{br?.name || '…'}</h1><p className="relative text-slate-400">Every {br?.name} flagship in the studio.</p></section>
    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{!d ? Array(3).fill(0).map((_, i) => <div key={i} className="sk h-60 rounded-3xl" />) : d.items?.length ? d.items.map((p: any) => <Card key={p.id} p={p} />) : <p className="text-slate-400">No phones yet.</p>}</div></div>;
}
const Bar = ({ v, max, c }: any) => { const [w, setW] = useState(0); useEffect(() => { const id = requestAnimationFrame(() => setW(Math.min(100, v / max * 100))); return () => cancelAnimationFrame(id); }, [v, max]); return <div className="h-2.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full origin-left" style={{ transform: `scaleX(${w / 100})`, background: c, transition: 'transform .9s cubic-bezier(.16,1,.3,1)' }} /></div>; };
export function PhonePage() {
  const { slug } = useParams(), p = useGet('/phones/' + slug), [ci, setCi] = useState(0);
  useEffect(() => { if (p?.name) { document.title = p.name + ' | Obsidian Studio'; document.body.style.setProperty('--a', accent(p)); document.querySelector('meta[name=description]')?.setAttribute('content', p.tagline); } }, [p]);
  if (!p) return <div className="sk h-96 rounded-3xl mt-6" />; if (p.error) return <p className="mt-10 text-slate-400">Phone not found. <Link to="/" className="underline">Back</Link></p>;
  const a = accent(p), c = p.colors[ci], s = p.specs, rows: [string, any, string, number][] = [['Peak brightness', s.nits, ' nits', 4500], ['Benchmark', s.benchmark, '', 9000], ['Battery', s.battery, ' mAh', 6000], ['Wired charging', s.wired, ' W', 100], ['Main camera', s.mainMp, ' MP', 200], ['Weight', s.weight, ' g', 260]];
  return <div><div className="grid lg:grid-cols-2 gap-6 mt-4"><div className="relative glass rounded-[2rem] overflow-hidden h-[460px] lg:h-[72vh]"><div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 55%,color-mix(in srgb,${c?.hex || a} 36%,transparent),transparent 70%)` }} />
    <Visual p={p} color={c?.hex} img={c?.image} /></div>
    <div><p className="text-sm font-semibold" style={{ color: a }}>{p.brand.name}</p><h1 className="text-4xl font-extrabold tracking-tighter">{p.name}</h1><p className="mt-2 text-slate-400">{p.tagline}</p><p className="mt-3 text-2xl font-bold">{money(p.price)}</p>
      <div className="mt-5 flex gap-3">{p.colors.map((k: any, i: number) => <button key={k.id} aria-label={k.name} onClick={() => setCi(i)} className="w-10 h-10 rounded-full active:scale-95 transition" style={{ background: k.hex, boxShadow: `0 0 0 2px #020617,0 0 0 ${i === ci ? 4 : 1}px ${i === ci ? a : 'rgba(255,255,255,.25)'}` }} />)}<span className="self-center text-sm text-slate-400">{c?.name}</span></div>
      <div className="mt-5 flex flex-wrap gap-2">{[s.chipset, s.displaySize && `${s.displaySize}" ${s.displayType} ${s.refresh}Hz`, s.ip, s.frame].filter(Boolean).map((t: string) => <span key={t} className="badge">{t}</span>)}</div>
      <div className="mt-6 glass rounded-3xl p-5 space-y-4">{rows.filter(r => r[1]).map(([l, v, u, m]) => <div key={l}><div className="flex justify-between text-sm"><span className="text-slate-400">{l}</span><b>{Number(v).toLocaleString()}{u}</b></div><Bar v={v} max={m} c={a} /></div>)}</div>
      {!!p.highlights.length && <ul className="mt-5 text-sm text-slate-300 list-disc pl-5 space-y-1">{p.highlights.map((h: string) => <li key={h}>{h}</li>)}</ul>}
      <div className="mt-6 flex flex-wrap gap-2">{p.links.map((l: any) => <a key={l.id} href={l.url} target="_blank" rel="noopener" className="btn" style={{ background: a, color: '#020617' }}>{l.store}</a>)}</div></div></div>
    <Samples p={p} a={a} /><Highlights p={p} a={a} /></div>;
}
const CM: [string, string, string, number][] = [['Benchmark', 'benchmark', '', 1], ['Battery', 'battery', ' mAh', 1], ['Charging', 'wired', ' W', 1], ['Main camera', 'mainMp', ' MP', 1], ['Brightness', 'nits', ' nits', 1], ['Weight (lighter wins)', 'weight', ' g', -1]];
export function Compare() {
  const all = useGet('/phones?limit=100'), [A, setA] = useState(''), [B, setB] = useState(''), r = useGet(A && B && A !== B ? `/compare?a=${A}&b=${B}` : '/brands');
  useEffect(() => { if (all?.items?.length > 1 && !A) { setA(all.items[0].slug); setB(all.items[1].slug); } }, [all]);
  const sel = (v: string, f: any) => <select className="inp" value={v} onChange={e => f(e.target.value)}>{all?.items?.map((p: any) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select>;
  const ok = r?.a && r?.b;
  return <div className="mt-6"><h1 className="text-[clamp(2rem,7vw,4rem)] font-extrabold tracking-tighter">Versus mode</h1><div className="mt-5 grid grid-cols-2 gap-3">{sel(A, setA)}{sel(B, setB)}</div>
    {ok ? <div className="mt-5 glass rounded-[2rem] p-5 space-y-5">{CM.map(([l, k, u, d]) => { const x = r.a.specs[k] || 0, y = r.b.specs[k] || 0, m = d > 0 ? Math.max(x, y) : Math.min(x, y) || 1, w = d * (x - y);
      return <div key={k}><p className="text-xs text-slate-400 text-center mb-2">{l}</p>{[[x, r.a, w > 0], [y, r.b, w < 0]].map(([v, p, win]: any) => <div key={p.slug} className="flex items-center gap-3 mb-1.5"><div className="flex-1" style={{ opacity: win ? 1 : .45 }}><Bar v={d > 0 ? v : m / (v || 1) * 100} max={d > 0 ? m : 100} c={accent(p)} /></div><span className="w-24 text-right text-xs font-bold">{Number(v).toLocaleString()}{u}</span></div>)}</div>; })}</div> : <p className="mt-5 text-slate-400">Pick two different phones.</p>}</div>;
}
