// جولة تعريفية قصيرة لكل دور — تظهر مرة واحدة تلقائيًا، ويمكن إعادتها من القائمة.
import React, { useEffect, useState } from 'react';
import { colors, font } from '../../theme/tokens';
import { LogoMark } from '../brand/Logo';

const STEPS = {
  client: [
    { title: 'أهلًا بك في دفة', text: 'هنا تبني خطط منظمتك وسياساتها خطوة بخطوة — حتى لو لم تكتب خطة من قبل. في كل خطوة شرح بسيط وفيديو ونموذج جاهز، ومستشار متخصص يراجع عملك.' },
    { title: 'ثلاث خدمات مستقلة', text: 'التخطيط الاستراتيجي، والتخطيط التشغيلي، والسياسات واللوائح. كل خدمة مستقلة تمامًا: ابدأ بأيٍّ منها، ولا يشترط إنهاء واحدة قبل الأخرى.', dots: true },
    { title: 'كيف تسير كل خدمة؟', text: '١) اختر الخدمة  ٢) ادفع واختر مستشارك  ٣) أنجز الوحدات واحدة تلو الأخرى  ٤) يعتمدها المستشار، ثم تنزّل وثيقتك جاهزة بصيغة PDF.' },
    { title: 'لا تعرف معنى مصطلح؟', text: 'اضغط علامة «؟» بجانب أي عنوان لترى شرحًا مبسطًا ومثالًا. ومن زر «؟» أعلى الشاشة شغّل «وضع الشرح» ليعرّفك بوظيفة كل زر وأيقونة.', help: true },
    { title: 'خطوتك التالية دائمًا أمامك', text: 'في لوحة التحكم بطاقة «خطوتك التالية» تخبرك بالضبط بما عليك فعله الآن. والأزرار الكهرمانية هي الإجراء الأهم في كل صفحة.', go: 'client-dash' },
  ],
  consultant: [
    { title: 'مرحبًا بك مستشارًا في دفة', text: 'دورك مراجعة ما يرسله العملاء: تعتمد الوحدة، أو تطلب تعديلًا بملاحظات واضحة.' },
    { title: 'المراجعات المعلقة', text: 'كل إرسال جديد يظهر في «المراجعات المعلقة» مرتبًا حسب الأقدم. افتحه لترى ما كتبه العميل كاملًا ثم اتخذ قرارك.', go: 'con-pending' },
    { title: 'ملاحظات تصنع الفرق', text: 'عند طلب التعديل اكتب ما المطلوب تحديدًا ولماذا — عملاؤنا غالبًا غير متخصصين، والملاحظة الواضحة تختصر أيامًا.' },
    { title: 'تابع عملاءك وأرباحك', text: 'من «العملاء والمهام» ترى تقدم كل عميل، ومن «الأرباح» مستحقاتك. وزر «؟» أعلى الشاشة يشرح أي عنصر.', help: true },
  ],
  admin: [
    { title: 'لوحة إدارة دفة', text: 'من هنا تدير المنصة كاملة: العملاء والمستشارين والخدمات والمحتوى والمدفوعات.' },
    { title: 'مركز المخرجات', text: 'كل ما كتبه العملاء في الأنظمة الثلاثة، وكل قرارات المستشارين وملاحظاتهم، في مكان واحد مع إمكانية فتح أي مخرج وتنزيله.', go: 'admin-outputs' },
    { title: 'ما يحتاج انتباهك', text: 'لوحة التحكم تعرض التحويلات البنكية المعلّقة والمراجعات المتأخرة والعملاء المتوقفين — ابدأ يومك منها.', go: 'admin-dash' },
    { title: 'شرح كل أيقونة', text: 'زر «؟» أعلى الشاشة يفعّل وضع الشرح، ومرّر المؤشر فوق أي أيقونة لترى وظيفتها.', help: true },
  ],
};

export default function OnboardingTour({ role, force, navigate }) {
  const key = `df_tour_${role}_v1`;
  const steps = STEPS[role] || STEPS.client;
  const [open, setOpen] = useState(() => force || !localStorage.getItem(key));
  const [i, setI] = useState(0);

  useEffect(() => { if (force) { setOpen(true); setI(0); } }, [force]);

  if (!open) return null;
  const done = () => { localStorage.setItem(key, '1'); setOpen(false); };
  const s = steps[i];
  const last = i === steps.length - 1;
  const next = () => {
    if (s.go && navigate) navigate(s.go);
    if (last) done(); else setI(i + 1);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={done} style={{ position: 'absolute', inset: 0, background: 'rgba(18,15,51,0.55)', backdropFilter: 'blur(3px)' }} />
      <div role="dialog" aria-label="جولة تعريفية" style={{ position: 'relative', width: 'min(480px, 100%)', background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(18,15,51,0.35)', animation: 'modalIn 0.25s ease' }}>
        <div style={{ background: `linear-gradient(135deg, ${colors.ink}, ${colors.primaryDeep})`, padding: '26px 26px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 22, top: 18, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            {[8, 11, 15].map((d, k) => <span key={k} style={{ width: d, height: d, borderRadius: '50%', background: k <= i % 3 ? colors.amber : 'rgba(255,255,255,0.25)', marginBottom: k * 6 }} />)}
          </div>
          <LogoMark size={44} tone="dark" />
          <div style={{ fontFamily: font.display, fontSize: 21, fontWeight: 700, marginTop: 14 }}>{s.title}</div>
        </div>
        <div style={{ padding: '20px 26px 8px', fontSize: 15, lineHeight: 2, color: colors.text, minHeight: 120 }}>
          {s.text}
          {s.dots && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {[['الاستراتيجي', colors.primary], ['التشغيلي', '#0E9F74'], ['السياسات', colors.amber]].map(([t, c]) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${c}1A`, fontSize: 13, fontWeight: 600, color: colors.ink }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{t}</span>
              ))}
            </div>
          )}
          {s.help && <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.gray }}><span className="df-help" style={{ margin: 0 }}>؟</span> هذه هي العلامة التي تبحث عنها</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px 22px', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, k) => <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 8, background: k === i ? colors.primary : colors.grayBorder, transition: 'width 0.2s' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!last && <button onClick={done} style={{ border: 'none', background: 'none', color: colors.gray, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', padding: '10px 8px' }}>تخطَّ</button>}
            {i > 0 && <button onClick={() => setI(i - 1)} style={{ border: `1.5px solid ${colors.grayBorder}`, background: '#fff', color: colors.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, borderRadius: 12, padding: '10px 16px', cursor: 'pointer' }}>السابق</button>}
            <button onClick={next} style={{ border: 'none', background: colors.amber, color: colors.ink, fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, borderRadius: 12, padding: '10px 22px', cursor: 'pointer' }}>{last ? 'لنبدأ' : 'التالي'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
