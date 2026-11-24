// سياسة الخصوصية وشروط الاستخدام — النص من «محتوى الموقع» (مجموعة الخصوصية والشروط) في لوحة الأدمن.
// التنسيق: سطر فارغ بين الفقرات، و«## » لعنوان فرعي، وأسطر تبدأ بـ«- » لقائمة.
import { colors } from '../../theme/tokens';
import { Breadcrumbs } from './PublicLayout';
import { MeasureChoice } from './Measurement';

function Blocks({ text }) {
  const blocks = String(text || '').trim().split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    if (b.startsWith('## ')) return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, color: colors.ink, margin: '28px 0 10px' }}>{b.slice(3)}</h2>;
    const lines = b.split('\n');
    if (lines.length > 1 && lines.every((l) => l.trim().startsWith('- '))) {
      return <ul key={i} style={{ paddingInlineStart: 22, margin: '0 0 12px', lineHeight: 2, color: colors.text }}>{lines.map((l, j) => <li key={j}>{l.trim().slice(2)}</li>)}</ul>;
    }
    return <p key={i} style={{ lineHeight: 2, color: colors.text, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{b}</p>;
  });
}

export default function LegalPage({ kind, sc, settings, navigate, PublicNav, PublicFooter }) {
  const isPrivacy = kind === 'privacy';
  const text = sc(isPrivacy ? 'privacy_policy' : 'terms_of_use', '');
  return (
    <div style={{ width: '100%', minHeight: '100vh' }} className="geo-bg">
      <PublicNav />
      <Breadcrumbs current={kind} navigate={navigate} />
      <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #123247)`, padding: '50px clamp(16px, 4vw, 40px)', textAlign: 'center', marginTop: 12 }}>
        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800 }}>{isPrivacy ? 'سياسة الخصوصية' : 'شروط الاستخدام'}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 10 }}>{isPrivacy ? 'كيف نجمع بياناتك ونستخدمها ونحميها' : 'الشروط التي تنظّم استخدام منصة دفة'}</p>
      </div>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px clamp(16px, 4vw, 40px) 60px', fontSize: 15.5 }}>
        {text ? <Blocks text={text} /> : <p style={{ color: colors.gray }}>جارٍ تحميل المحتوى…</p>}
        {isPrivacy && <MeasureChoice settings={settings} />}
      </main>
      <PublicFooter />
    </div>
  );
}
