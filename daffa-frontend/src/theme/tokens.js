// ─────────────────────────────────────────────────────────────────────────────
// هوية دفة — رموز التصميم (Design Tokens)
// المصدر الوحيد للألوان والخطوط والمقاسات في الواجهة.
// الألوان مشتقة من الشعار الأصلي: أزرق الدفّة للهيكل والتنقل، والبرتقالي لـ«خطوتك التالية» دائمًا مع نص كحلي.
// (أسماء المفاتيح الدلالية مثل amber/primary بقيت كما هي للتوافق مع الكود القائم.)
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  navy:     { 700: '#1C4D6A', 800: '#15354B', 900: '#0E2A3D', 950: '#0A1F2E' },
  blue:  { 50: '#EEF5F9', 100: '#D9E8F1', 200: '#B5D2E3', 300: '#86B5D0', 400: '#5592B6', 500: '#33769C', 600: '#235D7F', 700: '#1C4D6A', 800: '#173F57', 900: '#123247' },
  orange:   { 50: '#FEF3EC', 100: '#FDE2D2', 200: '#FBC3A3', 300: '#F79D6C', 400: '#EF6A2C', 500: '#E05A1F', 600: '#C24C17', 700: '#A33F12', 800: '#7F310E' },
  emerald: { 50: '#E8F8F2', 100: '#C9EFE1', 200: '#A9E4CF', 300: '#7FD3B5', 400: '#2DBE92', 500: '#0E9F74', 600: '#0B7F5D', 700: '#086449', 800: '#064B37' },
  red:   { 50: '#FCEBEB', 100: '#F8D3D3', 200: '#F1B2B2', 300: '#E88E8E', 500: '#DC4A4A', 600: '#C53A3A', 700: '#A52F2F', 800: '#842525' },
  sky:     { 50: '#EAF4FD', 100: '#CFE5FA', 200: '#A9D2F5', 300: '#7DBBF0', 500: '#2E8FE6', 600: '#1F74C4', 700: '#1A65AD', 800: '#164F8A' },
  sand:    { 0: '#FFFFFF', 50: '#FBF9F5', 100: '#F3EFE8', 200: '#E8E3DA', 300: '#D9D3C7' },
  slate:   { 400: '#B4BDC6', 500: '#8C97A3', 600: '#5E6B78', 700: '#465564', 800: '#334452' },
};

const p = palette;

// الأسماء الدلالية المستخدمة في المكوّنات
export const colors = {
  // العلامة
  primary:     p.blue[600],
  primaryHover: p.blue[700],
  primaryDeep: p.blue[900],
  primarySoft: p.blue[100],
  primaryTint: p.blue[50],
  ink:         p.navy[900],   // الكحلي
  navy:        p.navy[900],
  inkSoft:     p.navy[800],

  // البرتقالي (لون وصف الشعار): خلفية الإجراء الرئيس (بنص داكن دائمًا) + نص/خط آمن التباين
  amber:       p.orange[400],   // البرتقالي (اسم المفتاح قديم للتوافق)
  amberHover:  p.orange[300],
  amberText:   p.orange[700],
  amberLine:   p.orange[500],
  amberSoft:   p.orange[50],
  orange:      p.orange[400],   // اسم قديم — يُبقى للتوافق
  orangeLight: p.orange[50],

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
  yellow:      p.orange[400],
  yellowText:  p.orange[700],
  yellowLight: p.orange[50],
  red:         p.red[600],
  redText:     p.red[700],
  redLight:    p.red[50],
};

// الأنظمة الثلاثة مستقلة تمامًا، ولكلٍّ منها لون يميّزه في كل الواجهات
export const systems = {
  strategic: {
    key: 'strategic', view: 'strategic-roadmap',
    label: 'التخطيط الاستراتيجي', short: 'الاستراتيجي',
    color: p.blue[600], strong: p.blue[700], soft: p.blue[50], tint: p.blue[100], text: p.blue[700],
  },
  operational: {
    key: 'operational', view: 'operational-roadmap',
    label: 'التخطيط التشغيلي', short: 'التشغيلي',
    color: p.emerald[500], strong: p.emerald[600], soft: p.emerald[50], tint: p.emerald[100], text: p.emerald[700],
  },
  policies: {
    key: 'policies', view: 'policies-select',
    label: 'السياسات واللوائح', short: 'السياسات',
    color: p.orange[400], strong: p.orange[600], soft: p.orange[50], tint: p.orange[100], text: p.orange[700],
  },
};

export const font = {
  display: "'Alexandria', 'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
  body:    "'IBM Plex Sans Arabic', 'Alexandria', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const shadow = {
  xs: '0 1px 2px rgba(14,42,61,0.06)',
  sm: '0 2px 8px rgba(14,42,61,0.06)',
  md: '0 8px 24px rgba(14,42,61,0.08)',
  lg: '0 18px 48px rgba(14,42,61,0.14)',
  focus: '0 0 0 3px rgba(35,93,127,0.28)',
};

// نقاط الانكسار — مطابقة لما في index.css
export const breakpoints = { phone: 640, tablet: 1024 };

// ألوان الحالات الموحّدة لكل الشارات
export const tones = {
  primary: { bg: p.blue[100],  text: p.blue[700],  dot: p.blue[600] },
  teal:    { bg: p.blue[100],  text: p.blue[700],  dot: p.blue[600] }, // اسم قديم
  green:   { bg: p.emerald[100], text: p.emerald[700], dot: p.emerald[500] },
  orange:  { bg: p.orange[100],   text: p.orange[800],   dot: p.orange[400] },
  yellow:  { bg: p.orange[100],   text: p.orange[800],   dot: p.orange[400] },
  amber:   { bg: p.orange[100],   text: p.orange[800],   dot: p.orange[400] },
  blue:    { bg: p.sky[100],     text: p.sky[800],     dot: p.sky[600] },
  red:     { bg: p.red[100],   text: p.red[800],   dot: p.red[600] },
  gray:    { bg: p.sand[100],    text: p.slate[700],   dot: p.slate[500] },
};

export default { palette, colors, systems, font, radius, shadow, breakpoints, tones };
