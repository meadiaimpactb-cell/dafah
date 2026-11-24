// قواعد «الظهور والقياس» في الواجهة — نظيرتها في الخادم: app/Support/SeoRules.php (عدّلهما معًا).

/** ما يعرضه جوجل قبل أن يقصّ النص */
export const SEO_LIMITS = { title: { min: 30, max: 60 }, description: { min: 70, max: 160 } };

export function meterLevel(text, limit) {
  const n = String(text || '').trim().length;
  if (!n) return 'empty';
  if (n < limit.min) return 'short';
  return n > limit.max ? 'long' : 'good';
}

/* ── أدوات القياس ورموز التوثيق ───────────────────────────────────────── */
export const TRACKING_KEYS = ['track_gtm', 'track_ga4', 'track_meta_pixel', 'track_clarity', 'track_tiktok', 'track_snap'];
export const VERIFY_KEYS = ['seo_verify_google', 'seo_verify_bing'];

const FORMATS = {
  track_gtm: { valid: /^GTM-[A-Z0-9]{4,12}$/, extract: [/\b(GTM-[A-Z0-9]{4,12})\b/i] },
  track_ga4: { valid: /^G-[A-Z0-9]{4,16}$/, extract: [/\b(G-[A-Z0-9]{4,16})\b/i] },
  track_meta_pixel: { valid: /^\d{6,20}$/, extract: [/fbq\(\s*['"]init['"]\s*,\s*['"](\d{6,20})['"]/i, /[?&]id=(\d{6,20})/] },
  track_clarity: { valid: /^[a-z0-9]{6,20}$/, extract: [/clarity\.ms\/tag\/([a-z0-9]{6,20})/i, /["']script["']\s*,\s*["']([a-z0-9]{6,20})["']/i] },
  track_tiktok: { valid: /^[A-Z0-9]{10,30}$/, extract: [/ttq\.load\(\s*['"]([A-Z0-9]{10,30})['"]/i] },
  track_snap: { valid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, extract: [/snaptr\(\s*['"]init['"]\s*,\s*['"]([a-f0-9-]{36})['"]/i] },
  seo_verify_google: { valid: /^[A-Za-z0-9_-]{20,100}$/, extract: [/content\s*=\s*["']([A-Za-z0-9_-]{20,100})["']/i] },
  seo_verify_bing: { valid: /^[A-Za-z0-9]{16,64}$/, extract: [/content\s*=\s*["']([A-Za-z0-9]{16,64})["']/i] },
};
const UPPER = ['track_gtm', 'track_ga4', 'track_tiktok'];
const LOWER = ['track_clarity', 'track_snap'];
const fixCase = (k, v) => (UPPER.includes(k) ? v.toUpperCase() : LOWER.includes(k) ? v.toLowerCase() : v);

export const isValidTracking = (key, value) => !!FORMATS[key] && FORMATS[key].valid.test(String(value || '').trim());

/** يقبل المعرّف أو الوسم/الكود كاملًا، ويرجع المعرّف وحده */
export function normalizeTracking(key, raw) {
  const f = FORMATS[key];
  const v = String(raw || '').trim();
  if (!f || !v) return v;
  if (f.valid.test(fixCase(key, v))) return fixCase(key, v);
  for (const re of f.extract) {
    const m = re.exec(v);
    if (m && f.valid.test(fixCase(key, m[1]))) return fixCase(key, m[1]);
  }
  return v;
}

export const hasTrackers = (settings) => TRACKING_KEYS.some((k) => isValidTracking(k, settings?.[k]));

/* ── قوة الكلمة المفتاحية ─────────────────────────────────────────────────
 * ليست رقمًا من جوجل، بل قياس لاتساق الصفحة مع الكلمة: العنوان والوصف والعناوين الفرعية والنص والتكرار.
 * المطابقة تتجاوز السوابق العربية («للجمعيات» تطابق «جمعيات») وتحسب التطابق الجزئي بنسبة ما ورد من الكلمات. */
export function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const PREFIXES = ['وبال', 'فبال', 'بال', 'كال', 'فال', 'وال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل'];
function stem(word) {
  let out = word;
  for (const p of PREFIXES) {
    if (out.length > p.length + 2 && out.startsWith(p)) { out = out.slice(p.length); break; }
  }
  out = out.replace(/(ات|ون|ين|يه|ها|هم|كم)$/, '');
  return out.length > 3 ? out.replace(/ك$/, '') : out;
}
const words = (t) => normalizeText(t).split(' ').filter(Boolean);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function phraseCount(hay, terms) {
  if (!terms.length) return 0;
  const re = new RegExp(`(^|\\s)${terms.map(escapeRe).join('\\s+')}(?=\\s|$)`, 'g');
  return (hay.match(re) || []).length;
}
function coverage(text, terms) {
  if (!terms.length) return 0;
  const norm = normalizeText(text);
  if (!norm) return 0;
  if (phraseCount(norm, terms) > 0) return 1;
  const pool = new Set(words(norm).map(stem));
  return terms.filter((t) => pool.has(stem(t))).length / terms.length;
}
const CRITERIA = [
  { key: 'title', weight: 30 },
  { key: 'description', weight: 20 },
  { key: 'heading', weight: 20 },
  { key: 'body', weight: 20 },
  { key: 'density', weight: 10 },
];
export function analyzeKeyword(keyword, content) {
  const terms = words(keyword);
  if (!terms.length || !content) return { score: 0, level: 'weak', checks: [], occurrences: 0, density: 0 };
  const body = normalizeText(content.body);
  const ratios = {
    title: coverage(content.title, terms),
    description: coverage(content.description, terms),
    heading: coverage((content.headings || []).join(' '), terms),
    body: coverage(body, terms),
    density: 0,
  };
  const exact = phraseCount(body, terms);
  const pool = words(body).map(stem);
  const occurrences = exact > 0 ? exact : Math.min(...terms.map((t) => pool.filter((w) => w === stem(t)).length));
  const density = pool.length ? (occurrences * terms.length * 100) / pool.length : 0;
  ratios.density = density >= 0.3 && density <= 4 ? 1 : 0;
  const score = Math.round(CRITERIA.reduce((sum, c) => sum + ratios[c.key] * c.weight, 0));
  return {
    score,
    level: score >= 70 ? 'strong' : score >= 40 ? 'medium' : 'weak',
    checks: CRITERIA.map((c) => ({ key: c.key, ok: ratios[c.key] >= 0.7, partial: ratios[c.key] >= 0.4 && ratios[c.key] < 0.7 })),
    occurrences,
    density: Math.round(density * 100) / 100,
  };
}

/** من نص ملصوق (أسطر أو فواصل) إلى قائمة نظيفة بلا تكرار */
export function parseKeywords(text) {
  const seen = new Set();
  return String(text ?? '')
    .split(/[\n,،;؛]+/)
    .map((w) => w.trim().replace(/\s+/g, ' '))
    .filter((w) => {
      if (w.length < 2 || w.length > 80) return false;
      const k = normalizeText(w);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
