// شعار دفة — يُرسم بالمتجهات مباشرة (لا يعتمد على تحميل خط أو صورة).
// الرمز: حرف «د» بخط واحد مستدير يحاكي محورَي مخطط، وثلاث نقاط كهرمانية صاعدة
// (الأنظمة الثلاثة + نقاط كلمة «دفة»).
import React from 'react';

const INK = '#1B1746';
const AMBER = '#F5A524';
const WHITE = '#FFFFFF';

const DAL = 'M60,32 C82,35 96,52 93,67 C91,79 83,85 70,85 L25,85';
const DOTS = [[61, 63, 5.625], [44.5, 46.5, 7.5], [25, 27, 10]];

// كلمة «دفة» محوّلة إلى مسارات من خط Alexandria ExtraBold (وحدات الخط، المحور Y للأعلى)
const WORD = 'M333 45Q275 45 222.0 60.0Q169 75 128.0 106.0Q87 137 63.5 183.0Q40 229 40 290Q40 359 71.5 412.5Q103 466 159.0 501.5Q215 537 290 556Q359 574 438 577V609H612V286Q612 253 619.5 235.0Q627 217 647.5 209.5Q668 202 706 202H741Q749 202 755.0 174.5Q761 147 761 102Q761 56 755.0 28.0Q749 0 741 0H706Q622 0 562 34Q530 52 506 79Q474 66 439 58Q386 45 333 45Z M440 237Q438 261 438 286V406Q392 405 354 398Q309 389 277.5 373.5Q246 358 230.0 336.5Q214 315 214 289Q214 266 227.0 249.0Q240 232 266.5 223.5Q293 215 331 215Q367 215 398 223Q420 229 440 237Z M741 0Q732 0 726.5 28.0Q721 56 721 102Q721 147 726.5 174.5Q732 202 741 202H849Q844 231 844 263Q844 349 883.5 413.0Q923 477 990.5 512.5Q1058 548 1138 548Q1199 548 1256.5 530.5Q1314 513 1358 493V0Z M1011 202H1184V352Q1154 358 1126 358Q1085 358 1056.0 345.0Q1027 332 1011.5 310.5Q996 289 996 262Q996 232 1011 202Z M1442 0V202H1773Q1739 275 1677 325Q1610 381 1513 404L1550 592Q1685 561 1782.5 478.5Q1880 396 1934.0 274.0Q1988 152 1989 0Z';
const WORD_DOTS = [[402.1, 770.9, 76.2], [228.5, 770.9, 76.2], [1139.3, 753.3, 96.0]];
const WORD_W = 1949;
const WORD_H = 849.2;

function MarkArt({ dal, dots }) {
  return (
    <g>
      <path d={DAL} fill="none" stroke={dal} strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
      {DOTS.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={dots} />)}
    </g>
  );
}

function WordArt({ fill, dots }) {
  return (
    <g transform={`translate(-40,${WORD_H}) scale(1,-1)`}>
      <path d={WORD} fill={fill} />
      {WORD_DOTS.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={dots} />)}
    </g>
  );
}

/** الرمز داخل مربع مستدير — أيقونة التطبيق والمساحات الصغيرة */
export function LogoMark({ size = 40, tone = 'light', title = 'دفة', style, ...rest }) {
  // light: مربع داكن على خلفية فاتحة — dark: مربع أبيض على خلفية داكنة
  const bg = tone === 'dark' ? WHITE : tone === 'amber' ? AMBER : tone === 'indigo' ? '#5546D6' : INK;
  const dal = tone === 'dark' || tone === 'amber' ? INK : WHITE;
  const dots = tone === 'amber' ? WHITE : AMBER;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={title} style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      <rect width="120" height="120" rx="31" fill={bg} />
      <g transform="translate(1.2,4.25)"><MarkArt dal={dal} dots={dots} /></g>
    </svg>
  );
}

/** الرمز دون مربع */
export function LogoGlyph({ size = 40, tone = 'light', title = 'دفة', style, ...rest }) {
  const dal = tone === 'dark' ? WHITE : INK;
  return (
    <svg height={size} viewBox="15 17 87.6 77.5" role="img" aria-label={title} style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      <MarkArt dal={dal} dots={AMBER} />
    </svg>
  );
}

/** الكلمة «دفة» وحدها */
export function LogoWord({ height = 28, tone = 'light', title = 'دفة', style, ...rest }) {
  const fill = tone === 'dark' ? WHITE : INK;
  return (
    <svg height={height} viewBox={`0 0 ${WORD_W} ${WORD_H}`} role="img" aria-label={title} style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      <WordArt fill={fill} dots={AMBER} />
    </svg>
  );
}

/**
 * الشعار الكامل.
 * variant: horizontal (الرمز يمين الكلمة) | stacked (الرمز فوق الكلمة) | mark | word
 * tone: light (على خلفية فاتحة) | dark (على خلفية داكنة)
 * size: ارتفاع الرمز بالبكسل
 * descriptor: إظهار الوصف «للتخطيط الاستراتيجي وصناعة السياسات»
 */
export default function Logo({ variant = 'horizontal', tone = 'light', size = 40, descriptor = false, style, onClick, title = 'دفة' }) {
  if (variant === 'mark') return <LogoMark size={size} tone={tone} style={style} onClick={onClick} title={title} />;
  if (variant === 'word') return <LogoWord height={size} tone={tone} style={style} onClick={onClick} title={title} />;

  const fill = tone === 'dark' ? WHITE : INK;
  const sub = tone === 'dark' ? '#DDDAF7' : '#55516F';
  const tileBg = tone === 'dark' ? WHITE : INK;
  const tileDal = tone === 'dark' ? INK : WHITE;
  const cursor = onClick ? 'pointer' : undefined;
  const descText = 'للتخطيط الاستراتيجي وصناعة السياسات';

  if (variant === 'stacked') {
    const ws = 0.105;
    const ww = WORD_W * ws;
    const wh = WORD_H * ws;
    const W = Math.max(120, ww);
    const H = 120 + 18 + wh;
    return (
      <span onClick={onClick} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.1, cursor, ...style }}>
        <svg height={size * (H / 120)} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} style={{ display: 'block' }}>
          <g transform={`translate(${(W - 120) / 2},0)`}>
            <rect width="120" height="120" rx="31" fill={tileBg} />
            <g transform="translate(1.2,4.25)"><MarkArt dal={tileDal} dots={AMBER} /></g>
          </g>
          <g transform={`translate(${(W - ww) / 2},${138}) scale(${ws})`}><WordArt fill={fill} dots={AMBER} /></g>
        </svg>
        {descriptor && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: Math.max(11, size * 0.2), color: sub, whiteSpace: 'nowrap', lineHeight: 1.4 }}>{descText}</span>}
      </span>
    );
  }

  if (descriptor) {
    return (
      <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.22, direction: 'rtl', cursor, ...style }}>
        <LogoMark size={size} tone={tone} title={title} />
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: size * 0.07 }}>
          <LogoWord height={size * 0.5} tone={tone} title="" aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: Math.max(10.5, size * 0.19), color: sub, whiteSpace: 'nowrap', lineHeight: 1.3 }}>{descText}</span>
        </span>
      </span>
    );
  }

  // horizontal — خط قاعدة الكلمة يطابق قاعدة حرف «د» في الرمز
  const ws = (0.56 * 120) / 592;
  const base = 98.75;
  const ww = WORD_W * ws;
  const wh = WORD_H * ws;
  const gap = 26;
  const W = ww + gap + 120;
  return (
    <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', cursor, direction: 'ltr', ...style }}>
      <svg height={size} viewBox={`0 0 ${W} 120`} role="img" aria-label={title} style={{ display: 'block' }}>
        <g transform={`translate(0,${base - wh}) scale(${ws})`}><WordArt fill={fill} dots={AMBER} /></g>
        <g transform={`translate(${ww + gap},0)`}>
          <rect width="120" height="120" rx="31" fill={tileBg} />
          <g transform="translate(1.2,4.25)"><MarkArt dal={tileDal} dots={AMBER} /></g>
        </g>
      </svg>
    </span>
  );
}
