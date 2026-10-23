import { CATALOG, CATALOG_BRANDS, FEATURED, OFFICIAL } from './catalog.mjs';
// Sample data written once, the first time the API runs with an empty store. Edit everything in /admin afterwards.
const slug = s => s.toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); // "S25+" -> s25-plus, so it differs from "S25"
const B = [['Apple', '#cbd5e1'], ['Samsung', '#8b5cf6'], ['Google Pixel', '#34d399'], ['Xiaomi', '#fb923c'], ['OnePlus', '#ef4444'], ['Asus ROG', '#ff2e63']];
const P = [
 ['Apple', 'iPhone 16 Pro Max', 'Titanium craft and pro-grade cameras.', 289000, { displaySize: 6.9, displayType: 'OLED', refresh: 120, nits: 2000, chipset: 'A18 Pro', benchmark: 8400, battery: 4685, wired: 33, mainMp: 48, uwMp: 48, teleMp: 12, frontMp: 12, weight: 227, os: 'iOS 18', ip: 'IP68', frame: 'Titanium', back: 'Glass' }, [['Desert Titanium', '#b8a089'], ['Natural Titanium', '#8b8680'], ['Black Titanium', '#2b2d31']], 'https://www.apple.com/iphone/'],
 ['Samsung', 'Galaxy S24 Ultra', 'S Pen, 200MP and a flat titanium frame.', 265000, { displaySize: 6.8, displayType: 'AMOLED', refresh: 120, nits: 2600, chipset: 'Snapdragon 8 Gen 3', benchmark: 6900, battery: 5000, wired: 45, mainMp: 200, uwMp: 12, teleMp: 50, frontMp: 12, weight: 232, os: 'Android 14', ip: 'IP68', frame: 'Titanium', back: 'Glass' }, [['Titanium Violet', '#7c6a9c'], ['Titanium Gray', '#8e8f93'], ['Titanium Black', '#26272b']], 'https://www.samsung.com/'],
 ['Google Pixel', 'Pixel 9 Pro XL', 'Clean Android, Gemini AI and the visor camera bar.', 235000, { displaySize: 6.8, displayType: 'LTPO OLED', refresh: 120, nits: 3000, chipset: 'Tensor G4', benchmark: 4400, battery: 5060, wired: 37, mainMp: 50, uwMp: 48, teleMp: 48, frontMp: 42, weight: 221, os: 'Android 14', ip: 'IP68', frame: 'Aluminium', back: 'Glass' }, [['Obsidian', '#1f2124'], ['Porcelain', '#e6dcd0'], ['Hazel', '#6f7f6c']], 'https://store.google.com/category/phones'],
 ['Xiaomi', 'Xiaomi 14 Ultra', 'Leica optics behind a giant circular module.', 235000, { displaySize: 6.73, displayType: 'AMOLED', refresh: 120, nits: 3000, chipset: 'Snapdragon 8 Gen 3', benchmark: 7000, battery: 5300, wired: 90, mainMp: 50, uwMp: 50, teleMp: 50, frontMp: 32, weight: 219.8, os: 'Android 14', ip: 'IP68', frame: 'Aluminium', back: 'Glass' }, [['Black', '#111214'], ['White', '#ececec']], 'https://www.mi.com/'],
 ['OnePlus', 'OnePlus 12', 'Flagship speed with 100W charging.', 165000, { displaySize: 6.82, displayType: 'LTPO AMOLED', refresh: 120, nits: 4500, chipset: 'Snapdragon 8 Gen 3', benchmark: 7000, battery: 5400, wired: 100, mainMp: 50, uwMp: 48, teleMp: 64, frontMp: 32, weight: 220, os: 'Android 14', ip: 'IP65', frame: 'Aluminium', back: 'Glass' }, [['Silky Black', '#1a1b1e'], ['Flowy Emerald', '#1f5d4e'], ['Glacial White', '#e9ecef']], 'https://www.oneplus.com/'],
 ['Asus ROG', 'ROG Phone 8 Pro', 'Built for gaming: active cooling and 165Hz.', 245000, { displaySize: 6.78, displayType: 'AMOLED', refresh: 165, nits: 2500, chipset: 'Snapdragon 8 Gen 3', benchmark: 7100, battery: 5500, wired: 65, mainMp: 50, uwMp: 13, teleMp: 32, frontMp: 32, weight: 225, os: 'Android 14', ip: 'IP68', frame: 'Aluminium', back: 'Glass' }, [['Phantom Black', '#16171a'], ['Storm White', '#e9e9ec']], 'https://rog.asus.com/phones/']];

// older seeds used US-dollar prices; map seed slug -> [old price, DA price] so untouched sample phones are converted once
export const PRICE_MIGRATION = { 'iphone-16-pro-max': [1199, 289000], 'galaxy-s24-ultra': [1299, 265000], 'pixel-9-pro-xl': [1099, 235000], 'xiaomi-14-ultra': [1299, 235000], 'oneplus-12': [799, 165000], 'rog-phone-8-pro': [1199, 245000] };
export function makeSeed() {
  const now = new Date().toISOString(), seq = { brand: 0, phone: 0, color: 0, image: 0, link: 0 };
  const brands = B.map(([name, accent], i) => ({ id: ++seq.brand, name, slug: slug(name), logo: '', accent, sort: i }));
  const phones = P.map(([b, name, tag, price, specs, cols, url], i) => ({
    id: ++seq.phone, brand_id: brands.find(x => x.name === b).id, name, slug: slug(name), tagline: tag, description: tag, release_date: '2024-09-20', price,
    status: 'published', featured: name.startsWith('iPhone'), main_image: '', model_url: '', specs,
    highlights: [specs.chipset, specs.displaySize + '" ' + specs.displayType, specs.refresh + 'Hz'],
    // created_at staggered so "newest" has a stable order
    created_at: new Date(Date.parse(now) - 120000 - (P.length - i) * 1000).toISOString(), updated_at: now,
    colors: cols.map(([n, hex]) => ({ id: ++seq.color, name: n, hex, image: '' })), images: [], links: [{ id: ++seq.link, store: 'Official store', url }]
  }));
  const d = { v: 3, brands, phones, seq }; addCatalog(d); return d;
}

// Adds the sample catalogue (and its brands) to a data document. Phones whose slug already exists are skipped.
export function addCatalog(d) {
  const now = Date.now(), have = new Set(d.phones.map(p => p.slug));
  for (const [name, accent] of CATALOG_BRANDS) if (!d.brands.some(b => b.slug === slug(name))) d.brands.push({ id: ++d.seq.brand, name, slug: slug(name), logo: '', accent, sort: d.brands.length });
  const list = [...CATALOG].sort((a, b) => a[3] - b[3]); // cheapest first, so the most expensive flagships are the newest
  list.forEach(([b, name, tag, price, specs, cols], i) => {
    if (have.has(slug(name))) return; have.add(slug(name)); const brand = d.brands.find(x => x.name === b); if (!brand) return;
    d.phones.push({
      id: ++d.seq.phone, brand_id: brand.id, name, slug: slug(name), tagline: tag, description: tag, release_date: '', price, status: 'published', featured: FEATURED.includes(name), main_image: '', model_url: '', specs,
      highlights: [specs.chipset, specs.displaySize && specs.displaySize + '" ' + specs.displayType + (specs.refresh ? ' ' + specs.refresh + 'Hz' : ''), specs.battery && specs.battery + ' mAh' + (specs.wired ? ' · ' + specs.wired + 'W' : ''), specs.mainMp && specs.mainMp + ' MP camera'].filter(Boolean),
      created_at: new Date(now - (list.length - i) * 400).toISOString(), updated_at: new Date(now).toISOString(),
      colors: cols.map(([n, hex]) => ({ id: ++d.seq.color, name: n, hex, image: '' })), images: [], links: [{ id: ++d.seq.link, store: 'Official store', url: OFFICIAL[b] }]
    });
  });
  return d;
}
