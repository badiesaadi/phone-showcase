// English / French / Arabic (RTL). Every visible string lives in D as [en, fr, ar]; use t('key', { vars }).
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
export type Lang = 'en' | 'fr' | 'ar';
export const LANGS: [Lang, string][] = [['en', 'EN'], ['fr', 'FR'], ['ar', 'عربي']];
const IDX: Record<Lang, number> = { en: 0, fr: 1, ar: 2 };
type Row = [string, string, string];
export const D: Record<string, Row> = {
  // general
  'meta.desc': ['Explore and compare flagship smartphones.', 'Découvrez et comparez les smartphones haut de gamme.', 'اكتشف وقارن أفضل الهواتف الذكية.'],
  'cur': ['DA', 'DA', 'دج'],
  'price.ask': ['Price on request', 'Prix sur demande', 'السعر عند الطلب'],
  'common.back': ['Back', 'Retour', 'رجوع'],
  'nav.explore': ['Explore', 'Explorer', 'استكشف'],
  'nav.brands': ['Brands', 'Marques', 'العلامات التجارية'],
  'nav.versus': ['Versus', 'Comparer', 'مقارنة'],
  'lang.label': ['Language', 'Langue', 'اللغة'],
  'sound.on': ['Sound on', 'Son activé', 'الصوت مفعّل'],
  'sound.off': ['Sound off', 'Son coupé', 'الصوت متوقف'],
  // home
  'home.doc': ['Obsidian Studio | Flagship phones', 'Obsidian Studio | Smartphones haut de gamme', 'Obsidian Studio | هواتف رائدة'],
  'home.h1a': ['Flagships,', 'Les flagships,', 'الهواتف الرائدة،'],
  'home.h1b': ['in full dimension.', 'en pleine lumière.', 'في أبهى حلّة.'],
  'home.sub': ['Explore and compare today’s top smartphones.', 'Découvrez et comparez les meilleurs smartphones du moment.', 'اكتشف وقارن أفضل الهواتف الذكية اليوم.'],
  'home.explore': ['Explore {name}', 'Découvrir {name}', 'اكتشف {name}'],
  'home.search': ['Search phones', 'Rechercher un téléphone', 'ابحث عن هاتف'],
  'home.all': ['All', 'Tous', 'الكل'],
  'home.stats': ['{n} phones · {b} brands · prices in DA', '{n} téléphones · {b} marques · prix en DA', '{n} هاتفًا · {b} علامة · الأسعار بالدينار الجزائري'],
  'home.more': ['Show more ({n})', 'Voir plus ({n})', 'عرض المزيد ({n})'],
  'bud.all': ['Any budget', 'Tous les budgets', 'أي ميزانية'],
  'bud.u50': ['Under 50 000 DA', 'Moins de 50 000 DA', 'أقل من 50 000 دج'],
  'bud.50_100': ['50 000 – 100 000 DA', '50 000 – 100 000 DA', '50 000 – 100 000 دج'],
  'bud.100_200': ['100 000 – 200 000 DA', '100 000 – 200 000 DA', '100 000 – 200 000 دج'],
  'bud.o200': ['Over 200 000 DA', 'Plus de 200 000 DA', 'أكثر من 200 000 دج'],
  'sec.specs': ['Full specifications', 'Fiche technique', 'المواصفات الكاملة'],
  'home.none': ['No phones match.', 'Aucun téléphone trouvé.', 'لا توجد هواتف مطابقة.'],
  'sort.newest': ['Newest', 'Plus récents', 'الأحدث'],
  'sort.price_asc': ['Price ↑', 'Prix ↑', 'السعر ↑'],
  'sort.price_desc': ['Price ↓', 'Prix ↓', 'السعر ↓'],
  'sort.battery': ['Battery', 'Batterie', 'البطارية'],
  'sort.camera': ['Camera MP', 'Caméra (MP)', 'الكاميرا (MP)'],
  // brands
  'brands.title': ['Brands', 'Marques', 'العلامات التجارية'],
  'brand.sub': ['Every {name} flagship in the studio.', 'Tous les flagships {name} du studio.', 'جميع هواتف {name} الرائدة في الاستوديو.'],
  'brand.none': ['No phones yet.', 'Aucun téléphone pour le moment.', 'لا توجد هواتف بعد.'],
  // phone page
  'phone.notfound': ['Phone not found.', 'Téléphone introuvable.', 'الهاتف غير موجود.'],
  'row.nits': ['Peak brightness', 'Luminosité max.', 'أقصى سطوع'],
  'row.benchmark': ['Benchmark', 'Benchmark', 'اختبار الأداء'],
  'row.battery': ['Battery', 'Batterie', 'البطارية'],
  'row.wired': ['Wired charging', 'Charge filaire', 'الشحن السلكي'],
  'row.mainMp': ['Main camera', 'Caméra principale', 'الكاميرا الرئيسية'],
  'row.weight': ['Weight', 'Poids', 'الوزن'],
  'sec.camera': ['Camera samples', 'Échantillons photo', 'عيّنات الكاميرا'],
  'sec.highlights': ['Highlights', 'Points forts', 'أبرز المزايا'],
  'sec.gallery': ['Gallery', 'Galerie', 'المعرض'],
  'camera.alt': ['{name} {lens} sample', '{name} échantillon {lens}', '{name} عيّنة {lens}'],
  'lens.Ultrawide': ['Ultrawide', 'Ultra grand-angle', 'واسعة جدًا'],
  'lens.Wide': ['Wide', 'Grand-angle', 'واسعة'],
  'lens.Telephoto': ['Telephoto', 'Téléobjectif', 'تقريب'],
  'lens.Night': ['Night', 'Nuit', 'ليلي'],
  // versus
  'cmp.title': ['Versus mode', 'Mode comparaison', 'وضع المقارنة'],
  'cmp.pick': ['Pick two different phones.', 'Choisissez deux téléphones différents.', 'اختر هاتفين مختلفين.'],
  'cmp.nothing': ['Nothing to compare yet: these phones have no price or specs.', 'Rien à comparer pour l’instant : ces téléphones n’ont ni prix ni caractéristiques.', 'لا شيء للمقارنة بعد: لا يوجد سعر أو مواصفات لهذين الهاتفين.'],
  'cmp.price': ['Price (lower wins)', 'Prix (le moins cher gagne)', 'السعر (الأقل يفوز)'],
  'cmp.benchmark': ['Benchmark', 'Benchmark', 'اختبار الأداء'],
  'cmp.battery': ['Battery', 'Batterie', 'البطارية'],
  'cmp.wired': ['Charging', 'Charge', 'الشحن'],
  'cmp.mainMp': ['Main camera', 'Caméra principale', 'الكاميرا الرئيسية'],
  'cmp.nits': ['Brightness', 'Luminosité', 'السطوع'],
  'cmp.weight': ['Weight (lighter wins)', 'Poids (le plus léger gagne)', 'الوزن (الأخف يفوز)'],
  // admin: general
  'a.admin': ['Admin', 'Admin', 'الإدارة'],
  'nf.title': ['Page not found.', 'Page introuvable.', 'الصفحة غير موجودة.'],
  'nf.home': ['Back to home', 'Retour à l’accueil', 'العودة إلى الرئيسية'],
  'a.login': ['Admin login', 'Connexion admin', 'دخول المشرف'],
  'a.email': ['Email', 'E-mail', 'البريد الإلكتروني'],
  'a.password': ['Password', 'Mot de passe', 'كلمة المرور'],
  'a.signin': ['Sign in', 'Se connecter', 'تسجيل الدخول'],
  'a.dashboard': ['Dashboard', 'Tableau de bord', 'لوحة التحكم'],
  'a.backdash': ['← Dashboard', '← Tableau de bord', '→ لوحة التحكم'],
  'a.newphone': ['+ New phone', '+ Nouveau téléphone', '+ هاتف جديد'],
  'a.managebrands': ['Manage brands', 'Gérer les marques', 'إدارة العلامات'],
  'a.logout': ['Log out', 'Déconnexion', 'تسجيل الخروج'],
  'a.viewsite': ['View site', 'Voir le site', 'عرض الموقع'],
  'a.phones': ['Phones', 'Téléphones', 'الهواتف'],
  'a.pubdraft': ['Published / draft', 'Publiés / brouillons', 'منشور / مسودة'],
  'a.perbrand': ['Per brand', 'Par marque', 'حسب العلامة'],
  'a.search': ['Search', 'Rechercher', 'بحث'],
  'a.th.phone': ['Phone', 'Téléphone', 'الهاتف'],
  'a.th.brand': ['Brand', 'Marque', 'العلامة'],
  'a.th.price': ['Price', 'Prix', 'السعر'],
  'a.th.status': ['Status', 'Statut', 'الحالة'],
  'a.th.featured': ['Featured', 'Vedette', 'مميّز'],
  'status.published': ['Published', 'Publié', 'منشور'],
  'status.draft': ['Draft', 'Brouillon', 'مسودة'],
  'a.edit': ['Edit', 'Modifier', 'تعديل'],
  'a.duplicate': ['Duplicate', 'Dupliquer', 'نسخ'],
  'a.delete': ['Delete', 'Supprimer', 'حذف'],
  'a.remove': ['Remove', 'Retirer', 'إزالة'],
  'a.updated': ['Updated', 'Mis à jour', 'تم التحديث'],
  'a.duplicated': ['Duplicated', 'Dupliqué', 'تم النسخ'],
  'a.deleted': ['Deleted', 'Supprimé', 'تم الحذف'],
  'a.saved': ['Saved', 'Enregistré', 'تم الحفظ'],
  'a.brandadded': ['Brand added', 'Marque ajoutée', 'تمت إضافة العلامة'],
  'a.confirmdel': ['Delete {name}?', 'Supprimer {name} ?', 'هل تريد حذف {name}؟'],
  // admin: phone form
  'a.new': ['New phone', 'Nouveau téléphone', 'هاتف جديد'],
  'a.editname': ['Edit {name}', 'Modifier {name}', 'تعديل {name}'],
  'f.brand': ['Brand *', 'Marque *', 'العلامة *'],
  'f.newbrandopt': ['+ New brand…', '+ Nouvelle marque…', '+ علامة جديدة…'],
  'f.newbrand': ['New brand name *', 'Nom de la nouvelle marque *', 'اسم العلامة الجديدة *'],
  'f.name': ['Phone name *', 'Nom du téléphone *', 'اسم الهاتف *'],
  'f.price': ['Price in DA (optional)', 'Prix en DA (facultatif)', 'السعر بالدينار (اختياري)'],
  'f.desc': ['Brief description: a few lines about the phone', 'Brève description : quelques lignes sur le téléphone', 'وصف مختصر: بضعة أسطر عن الهاتف'],
  'f.mainimg': ['Main image (optional)', 'Image principale (facultatif)', 'الصورة الرئيسية (اختياري)'],
  'f.published': ['Published (visible on the site)', 'Publié (visible sur le site)', 'منشور (ظاهر في الموقع)'],
  'f.more': ['More details (optional)', 'Plus de détails (facultatif)', 'تفاصيل إضافية (اختياري)'],
  'f.extra': ['Extra info', 'Infos supplémentaires', 'معلومات إضافية'],
  'f.tagline': ['Tagline (short line under the name)', 'Slogan (courte ligne sous le nom)', 'عبارة قصيرة تحت الاسم'],
  'f.slug': ['Slug (auto)', 'Slug (auto)', 'المعرّف (تلقائي)'],
  'f.featured': ['Featured on the home page', 'En vedette sur l’accueil', 'مميّز في الصفحة الرئيسية'],
  'f.photos': ['More photos', 'Plus de photos', 'المزيد من الصور'],
  'f.addgallery': ['Add gallery / camera sample images', 'Ajouter des images (galerie / échantillons photo)', 'أضف صورًا (معرض / عيّنات الكاميرا)'],
  'f.colors': ['Colors', 'Couleurs', 'الألوان'],
  'f.colorname': ['Name', 'Nom', 'الاسم'],
  'f.addcolor': ['+ Color', '+ Couleur', '+ لون'],
  'f.specs': ['Specs', 'Caractéristiques', 'المواصفات'],
  'f.hl': ['Highlights & buy links', 'Points forts et liens d’achat', 'أبرز المزايا وروابط الشراء'],
  'f.hlph': ['One highlight per line', 'Un point fort par ligne', 'ميزة واحدة في كل سطر'],
  'f.store': ['Store', 'Boutique', 'المتجر'],
  'f.addlink': ['+ Link', '+ Lien', '+ رابط'],
  'f.preview': ['Live preview', 'Aperçu en direct', 'معاينة مباشرة'],
  'f.prevbrand': ['Brand', 'Marque', 'العلامة'],
  'f.prevname': ['Phone name', 'Nom du téléphone', 'اسم الهاتف'],
  'f.saving': ['Saving…', 'Enregistrement…', 'جارٍ الحفظ…'],
  'f.save': ['Save phone', 'Enregistrer', 'حفظ الهاتف'],
  'f.cancel': ['Cancel', 'Annuler', 'إلغاء'],
  'f.draftnote': ['Draft autosaves in this browser.', 'Le brouillon est enregistré automatiquement dans ce navigateur.', 'تُحفظ المسودة تلقائيًا في هذا المتصفح.'],
  'f.need': ['Name and brand are required', 'Le nom et la marque sont obligatoires', 'الاسم والعلامة مطلوبان'],
  'f.needbrand': ['Type the new brand name', 'Saisissez le nom de la nouvelle marque', 'اكتب اسم العلامة الجديدة'],
  // admin: brands
  'b.name': ['Brand name', 'Nom de la marque', 'اسم العلامة'],
  'b.accent': ['Accent colour', 'Couleur d’accent', 'لون العلامة'],
  'b.order': ['Order', 'Ordre', 'الترتيب'],
  'b.add': ['Add', 'Ajouter', 'إضافة'],
  'b.save': ['Save', 'Enregistrer', 'حفظ'],
  'b.addtitle': ['Add a brand', 'Ajouter une marque', 'إضافة علامة'],
  // admin: spec field labels
  'sp.displaySize': ['Display size (in)', 'Taille de l’écran (po)', 'حجم الشاشة (بوصة)'],
  'sp.displayType': ['Display type', 'Type d’écran', 'نوع الشاشة'],
  'sp.refresh': ['Refresh rate (Hz)', 'Taux de rafraîchissement (Hz)', 'معدل التحديث (Hz)'],
  'sp.nits': ['Peak nits', 'Luminosité max. (nits)', 'أقصى سطوع (nits)'],
  'sp.chipset': ['Chipset', 'Processeur', 'المعالج'],
  'sp.benchmark': ['Benchmark score', 'Score benchmark', 'نتيجة اختبار الأداء'],
  'sp.ram': ['RAM options', 'Options de RAM', 'خيارات الذاكرة العشوائية'],
  'sp.storage': ['Storage options', 'Options de stockage', 'خيارات التخزين'],
  'sp.battery': ['Battery (mAh)', 'Batterie (mAh)', 'البطارية (mAh)'],
  'sp.wired': ['Wired charging (W)', 'Charge filaire (W)', 'الشحن السلكي (W)'],
  'sp.wireless': ['Wireless charging (W)', 'Charge sans fil (W)', 'الشحن اللاسلكي (W)'],
  'sp.mainMp': ['Main camera (MP)', 'Caméra principale (MP)', 'الكاميرا الرئيسية (MP)'],
  'sp.uwMp': ['Ultrawide (MP)', 'Ultra grand-angle (MP)', 'واسعة جدًا (MP)'],
  'sp.teleMp': ['Telephoto (MP)', 'Téléobjectif (MP)', 'تقريب (MP)'],
  'sp.frontMp': ['Front camera (MP)', 'Caméra frontale (MP)', 'الكاميرا الأمامية (MP)'],
  'sp.weight': ['Weight (g)', 'Poids (g)', 'الوزن (غ)'],
  'sp.os': ['OS', 'Système', 'نظام التشغيل'],
  'sp.ip': ['IP rating', 'Indice IP', 'مقاومة الماء (IP)'],
  'sp.frame': ['Frame material', 'Matériau du cadre', 'مادة الإطار'],
  'sp.back': ['Back material', 'Matériau du dos', 'مادة الخلفية'],
  'sp.connectivity': ['Connectivity', 'Connectivité', 'الاتصال'],
};
// messages the server sends (English) -> [fr, ar]
export const ERR: Record<string, [string, string]> = {
  'Invalid credentials': ['Identifiants incorrects', 'بيانات الدخول غير صحيحة'],
  'Unauthorized': ['Non autorisé', 'غير مصرّح'],
  'name and brand_id are required': ['Le nom et la marque sont obligatoires', 'الاسم والعلامة مطلوبان'],
  'name required': ['Le nom est obligatoire', 'الاسم مطلوب'],
  'Slug already used by another phone': ['Ce slug est déjà utilisé par un autre téléphone', 'هذا المعرّف مستخدم لهاتف آخر'],
  'Unknown brand': ['Marque inconnue', 'علامة غير معروفة'],
  'Brand already exists': ['Cette marque existe déjà', 'هذه العلامة موجودة بالفعل'],
  'Move or delete this brand\u2019s phones first': ['Déplacez ou supprimez d’abord les téléphones de cette marque', 'انقل هواتف هذه العلامة أو احذفها أولًا'],
  'Image too large (5 MB max)': ['Image trop lourde (5 Mo max)', 'الصورة كبيرة جدًا (5 ميغابايت كحد أقصى)'],
  'Only images (jpg, png, webp, avif) are allowed': ['Seules les images (jpg, png, webp, avif) sont acceptées', 'يُسمح بالصور فقط (jpg, png, webp, avif)'],
  'No file': ['Aucun fichier', 'لا يوجد ملف'],
  'Not found': ['Introuvable', 'غير موجود'],
  'Phone not found': ['Téléphone introuvable', 'الهاتف غير موجود'],
  'Too many attempts. Try again later.': ['Trop de tentatives. Réessayez plus tard.', 'محاولات كثيرة. حاول لاحقًا.'],
  'Forbidden': ['Action refusée', 'تم رفض العملية'],
  'Invalid link URL': ['Lien d’achat invalide (http ou https requis)', 'رابط شراء غير صالح (يجب أن يبدأ بـ http أو https)'],
  'Request too large': ['Requête trop volumineuse', 'الطلب كبير جدًا'],
  'Invalid request': ['Requête invalide', 'طلب غير صالح'],
  'Request failed': ['La requête a échoué', 'فشل الطلب'],
  'Server not configured': ['Serveur non configuré : définissez JWT_SECRET, ADMIN_EMAIL et ADMIN_PASSWORD dans les variables d’environnement', 'الخادم غير مهيّأ: عيّن JWT_SECRET و ADMIN_EMAIL و ADMIN_PASSWORD في متغيرات البيئة'],
};
const detect = (): Lang => {
  try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'fr' || s === 'ar') return s; } catch {}
  const n = (typeof navigator !== 'undefined' && navigator.language || '').slice(0, 2).toLowerCase();
  return n === 'ar' || n === 'fr' || n === 'en' ? n : 'fr';
};
let cur: Lang = detect();
const fill = (s: string, v?: Record<string, any>) => v ? s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? '')) : s;
export const tr = (key: string, v?: Record<string, any>, lang: Lang = cur) => { const e = D[key]; return e ? fill(e[IDX[lang]] || e[0], v) : key; };
export const errT = (m: string) => { if (cur === 'en') return m; const e = ERR[m] || (m.startsWith('Server not configured') ? ERR['Server not configured'] : null); return e ? e[cur === 'fr' ? 0 : 1] : m; };
// 250000 -> "250 000" (same grouping in every language; Western digits, as used in Algeria)
export const num = (n: any) => { const [i, d] = String(Number(n)).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + (d ? '.' + d : ''); };
export const da = (n: any, lang: Lang = cur) => Number(n) > 0 ? num(Math.round(Number(n))) + '\u00a0' + tr('cur', undefined, lang) : '';
export const phonesN = (n: number, lang: Lang = cur) => lang === 'ar' ? (n === 0 ? 'لا هواتف' : n === 1 ? 'هاتف واحد' : n === 2 ? 'هاتفان' : n <= 10 ? n + ' هواتف' : n + ' هاتفًا') : lang === 'fr' ? n + (n > 1 ? ' téléphones' : ' téléphone') : n + (n === 1 ? ' phone' : ' phones');
type Ctx = { lang: Lang; setLang: (l: Lang) => void; dir: 'ltr' | 'rtl'; t: (k: string, v?: Record<string, any>) => string; da: (n: any) => string; phones: (n: number) => string };
const mk = (lang: Lang, setLang: (l: Lang) => void): Ctx => ({ lang, setLang, dir: lang === 'ar' ? 'rtl' : 'ltr', t: (k, v) => tr(k, v, lang), da: n => da(n, lang), phones: n => phonesN(n, lang) });
const C = createContext<Ctx>(mk(cur, () => {}));
export const useI18n = () => useContext(C);
export function LangProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, set] = useState<Lang>(initial ?? cur);
  const setLang = useCallback((l: Lang) => { cur = l; try { localStorage.setItem('lang', l); } catch {} set(l); }, []);
  useEffect(() => { cur = lang; const h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.querySelector('meta[name=description]')?.setAttribute('content', tr('meta.desc', undefined, lang)); }, [lang]);
  const v = useMemo(() => mk(lang, setLang), [lang, setLang]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
