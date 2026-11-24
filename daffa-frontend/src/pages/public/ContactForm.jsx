// نموذج «تواصل معنا» — يرسل الرسالة إلى بريد المنصة (كان الزر لا يفعل شيئًا).
// المسودة تُحفظ في sessionStorage فلا تضيع إن أُعيد رسم الصفحة.
import { useState } from 'react';
import api from '../../api/axios';
import { colors } from '../../theme/tokens';
import { Btn, Input } from '../../components/ui/kit';

const SUBJECTS = ['استفسار عام', 'استفسار عن الأسعار', 'طلب عرض تقديمي', 'مشكلة تقنية', 'اقتراح تطوير', 'أخرى'];
const KEY = 'df_contact_draft';
const EMPTY = { name: '', org: '', email: '', phone: '', subject: SUBJECTS[0], message: '', website: '' };
const load = () => { try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch { return EMPTY; } };

export default function ContactForm() {
  const [f, setF] = useState(load);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState('');
  const [fail, setFail] = useState('');
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((p) => { const n = { ...p, [k]: v }; try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* تجاهل */ } return n; });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };
  const submit = async (e) => {
    e.preventDefault();
    setFail(''); setDone('');
    const local = {};
    if (f.name.trim().length < 2) local.name = 'اكتب اسمك.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) local.email = 'اكتب بريدًا إلكترونيًا صحيحًا حتى نتمكن من الرد عليك.';
    if (f.message.trim().length < 10) local.message = 'اكتب رسالتك (جملة على الأقل).';
    if (Object.keys(local).length) { setErrors(local); return; }
    setBusy(true);
    try {
      const r = await api.post('/contact', { ...f, name: f.name.trim(), email: f.email.trim(), message: f.message.trim() });
      setDone(r.data?.message || 'وصلتنا رسالتك.');
      setF(EMPTY);
      try { sessionStorage.removeItem(KEY); } catch { /* تجاهل */ }
    } catch (err) {
      const d = err.response?.data;
      if (d?.errors) setErrors(Object.fromEntries(Object.entries(d.errors).map(([k, v]) => [k, v[0]])));
      setFail(err.response?.status === 429 ? 'أرسلت عدة رسائل خلال وقت قصير؛ حاول بعد قليل.' : d?.message || 'تعذّر إرسال الرسالة. حاول مرة أخرى.');
    } finally { setBusy(false); }
  };
  const err = (k) => errors[k] && <div role="alert" style={{ color: colors.red, fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{errors[k]}</div>;

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-label="نموذج تواصل معنا">
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 14 }}>
        <div><Input label="الاسم" placeholder="اسمك الكامل" value={f.name} onChange={set('name')} autoComplete="name" />{err('name')}</div>
        <Input label="المنظمة" placeholder="اسم المنظمة" value={f.org} onChange={set('org')} autoComplete="organization" />
      </div>
      <div><Input label="البريد الإلكتروني" placeholder="name@example.com" type="email" value={f.email} onChange={set('email')} autoComplete="email" dir="ltr" />{err('email')}</div>
      <Input label="رقم الجوال (اختياري)" placeholder="05XXXXXXXX" value={f.phone} onChange={set('phone')} autoComplete="tel" dir="ltr" />
      <div>
        <label htmlFor="contact-subject" style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>الموضوع</label>
        <select id="contact-subject" value={f.subject} onChange={set('subject')} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: 'inherit', background: '#fff' }}>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div><Input label="الرسالة" textarea placeholder="اكتب رسالتك هنا بالتفصيل..." value={f.message} onChange={set('message')} />{err('message')}</div>
      {/* حقل خفي للحماية من الرسائل الآلية */}
      <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      {done && <div role="status" data-contact-done style={{ background: colors.greenLight, color: '#086449', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 14 }}>{done}</div>}
      {fail && <div role="alert" style={{ background: colors.redLight, color: colors.red, borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 14 }}>{fail}</div>}
      <Btn full type="submit" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إرسال الرسالة'}</Btn>
    </form>
  );
}
