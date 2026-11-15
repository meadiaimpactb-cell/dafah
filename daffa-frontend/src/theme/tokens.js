// ─────────────────────────────────────────────────────────────────────────────
// هوية دفة — رموز التصميم (Design Tokens)
// المصدر الوحيد للألوان والخطوط والمقاسات في الواجهة.
// القاعدة: النيلي للهيكل والتنقل، والكهرماني «خطوتك التالية» دائمًا مع نص داكن.
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  ink:     { 700: '#322C6E', 800: '#262159', 900: '#1B1746', 950: '#120F33' },
  indigo:  { 50: '#F3F2FE', 100: '#E7E5FD', 200: '#D0CCFA', 300: '#B0A9F6', 400: '#8D82EF', 500: '#6C5EE6', 600: '#5546D6', 700: '#4537B4', 800: '#382D90', 900: '#2B2470' },
  amber:   { 50: '#FFF8EA', 100: '#FEEDC6', 200: '#FCD98B', 300: '#F9C152', 400: '#F5A524', 500: '#E0920F', 600: '#B9740A', 700: '#9A5B07', 800: '#7A4706' },
  emerald: { 50: '#E8F8F2', 100: '#C9EFE1', 200: '#A9E4CF', 300: '#7FD3B5', 400: '#2DBE92', 500: '#0E9F74', 600: '#0B7F5D', 700: '#086449', 800: '#064B37' },
  coral:   { 50: '#FDECE9', 100: '#FAD4CE', 200: '#F5B8AE', 300: '#EE9A8C', 500: '#E5533D', 600: '#D03F2A', 700: '#B5301D', 800: '#8F2415' },
  sky:     { 50: '#EAF4FD', 100: '#CFE5FA', 200: '#A9D2F5', 300: '#7DBBF0', 500: '#2E8FE6', 600: '#1F74C4', 700: '#1A65AD', 800: '#164F8A' },
  sand:    { 0: '#FFFFFF', 50: '#FBF9F5', 100: '#F3EFE8', 200: '#E8E3DA', 300: '#D9D3C7' },
  slate:   { 400: '#B5B1C4', 500: '#8F8BA3', 600: '#67637A', 700: '#4A4660', 800: '#34314A' },
};

const p = palette;

// الأسماء الدلالية المستخدمة في المكوّنات
export const colors = {
  // العلامة
  primary:     p.indigo[600],
  primaryHover: p.indigo[700],
  primaryDeep: p.indigo[900],
  primarySoft: p.indigo[100],
  primaryTint: p.indigo[50],
  ink:         p.ink[900],
  inkSoft:     p.ink[800],

  // الكهرماني: خلفية الإجراء الرئيس (بنص داكن دائمًا) + نص/خط آمن التباين
  amber:       p.amber[400],
  amberHover:  p.amber[300],
  amberText:   p.amber[700],
  amberLine:   p.amber[500],
  amberSoft:   p.amber[50],
  orange:      p.amber[400],   // اسم قديم — يُبقى للتوافق
  orangeLight: p.amber[50],

  // الأسطح والنصوص
  bg:          p.sand[50],
  white:       p.sand[0],
  surface:     p.sand[0],
  sunken:      p.sand[100],
  text:        p.slate[800],
  gray:        p.slate[600],
  subtle:      p.slate[500],
  grayLight:   p.sand[100],
  grayBorder:  p.sand[200],
  borderStrong: p.sand[300],

  // الحالات
  green:       p.emerald[600],
  greenBright: p.emerald[500],
  greenText:   p.emerald[700],
  greenLight:  p.emerald[50],
  blue:        p.sky[600],
  blueText:    p.sky[700],
  blueLight:   p.sky[50],
  yellow:      p.amber[400],
  yellowText:  p.amber[700],
  yellowLight: p.amber[50],
  red:         p.coral[600],
  redText:     p.coral[700],
  redLight:    p.coral[50],
};

// الأنظمة الثلاثة مستقلة تمامًا، ولكلٍّ منها لون يميّزه في كل الواجهات
export const systems = {
  strategic: {
    key: 'strategic', view: 'strategic-roadmap',
    label: 'التخطيط الاستراتيجي', short: 'الاستراتيجي',
    color: p.indigo[600], strong: p.indigo[700], soft: p.indigo[50], tint: p.indigo[100], text: p.indigo[700],
  },
  operational: {
    key: 'operational', view: 'operational-roadmap',
    label: 'التخطيط التشغيلي', short: 'التشغيلي',
    color: p.emerald[500], strong: p.emerald[600], soft: p.emerald[50], tint: p.emerald[100], text: p.emerald[700],
  },
  policies: {
    key: 'policies', view: 'policies-select',
    label: 'السياسات واللوائح', short: 'السياسات',
    color: p.amber[400], strong: p.amber[600], soft: p.amber[50], tint: p.amber[100], text: p.amber[700],
  },
};

export const font = {
  display: "'Alexandria', 'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
  body:    "'IBM Plex Sans Arabic', 'Alexandria', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const shadow = {
  xs: '0 1px 2px rgba(27,23,70,0.06)',
  sm: '0 2px 8px rgba(27,23,70,0.06)',
  md: '0 8px 24px rgba(27,23,70,0.08)',
  lg: '0 18px 48px rgba(27,23,70,0.14)',
  focus: '0 0 0 3px rgba(85,70,214,0.28)',
};

// نقاط الانكسار — مطابقة لما في index.css
export const breakpoints = { phone: 640, tablet: 1024 };

// ألوان الحالات الموحّدة لكل الشارات
export const tones = {
  primary: { bg: p.indigo[100],  text: p.indigo[700],  dot: p.indigo[600] },
  teal:    { bg: p.indigo[100],  text: p.indigo[700],  dot: p.indigo[600] }, // اسم قديم
  green:   { bg: p.emerald[100], text: p.emerald[700], dot: p.emerald[500] },
  orange:  { bg: p.amber[100],   text: p.amber[800],   dot: p.amber[400] },
  yellow:  { bg: p.amber[100],   text: p.amber[800],   dot: p.amber[400] },
  amber:   { bg: p.amber[100],   text: p.amber[800],   dot: p.amber[400] },
  blue:    { bg: p.sky[100],     text: p.sky[800],     dot: p.sky[600] },
  red:     { bg: p.coral[100],   text: p.coral[800],   dot: p.coral[600] },
  gray:    { bg: p.sand[100],    text: p.slate[700],   dot: p.slate[500] },
};

export default { palette, colors, systems, font, radius, shadow, breakpoints, tones };
