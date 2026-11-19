// الصفحة الرئيسية — كل النصوص قابلة للتعديل من «محتوى الموقع» في لوحة الأدمن (sc).
import { colors, systems, font } from '../../theme/tokens';
import { RosetteShape } from '../../components/brand/Logo';
import { IcTarget, IcCog, IcClipboard, IcCheckCircle, IcLightbulb, IcChat, IcDocument } from '../../utils/icons';

const wrap = { maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' };

const Eyebrow = ({ children, dark }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: dark ? colors.amber : colors.primary, marginBottom: 10 }}>
    <RosetteShape size={16} color={colors.amber} />
    {children}
  </div>
);

function HeroPreview() {
  const rows = [
    { k: 'strategic', p: 64, s: '7 من 11 وحدة', st: 'قيد العمل' },
    { k: 'operational', p: 100, s: '5 من 5 وحدات', st: 'مكتمل' },
    { k: 'policies', p: 30, s: '2 من 7 سياسات', st: 'قيد العمل' },
  ];
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: '100%', maxWidth: 440, marginInline: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: 20, boxShadow: '0 30px 70px rgba(6,20,30,0.45)', transform: 'rotate(-2deg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, color: colors.ink, fontSize: 15 }}>رحلة جمعيتك</div>
          <span style={{ fontSize: 11.5, fontWeight: 700, background: colors.amber, color: colors.ink, borderRadius: 999, padding: '2px 10px' }}>خطوتك التالية</span>
        </div>
        {rows.map((r) => {
          const s = systems[r.k];
          return (
            <div key={r.k} style={{ border: `1px solid ${colors.grayBorder}`, borderRight: `4px solid ${s.color}`, borderRadius: 14, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>
                <span>{s.label}</span><span style={{ color: r.p === 100 ? colors.greenText : colors.gray, fontWeight: 600, fontSize: 12 }}>{r.st}</span>
              </div>
              <div style={{ height: 7, background: colors.sunken, borderRadius: 7, overflow: 'hidden' }}><div style={{ width: `${r.p}%`, height: '100%', background: s.color, borderRadius: 7 }} /></div>
              <div style={{ fontSize: 11.5, color: colors.gray, marginTop: 5 }}>{r.s}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: -18, left: -10, background: '#fff', borderRadius: 16, padding: '10px 14px', boxShadow: '0 16px 40px rgba(6,20,30,0.35)', display: 'flex', alignItems: 'center', gap: 10, transform: 'rotate(2deg)' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: colors.greenLight, color: colors.greenText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcCheckCircle width={20} height={20} /></span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.ink }}>اعتمد المستشار وحدتك</div>
          <div style={{ fontSize: 11, color: colors.gray }}>تحليل البيئة الداخلية</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ sc, navigate, onRegister, PublicNav, PublicFooter }) {
  const steps = [
    { t: sc('step1_title', 'اختر الخدمة'), d: sc('step1_desc', 'التخطيط الاستراتيجي أو التشغيلي أو السياسات') },
    { t: sc('step2_title', 'ادفع واختر المستشار'), d: sc('step2_desc', 'أسعار مناسبة مع اختيار المستشار المناسب') },
    { t: sc('step3_title', 'تعلّم ونفّذ'), d: sc('step3_desc', 'فيديوهات + شرح + إرشادات + نماذج عمل') },
    { t: sc('step4_title', 'المستشار يراجع ويعتمد'), d: sc('step4_desc', 'مراجعة واعتماد من مستشار متخصص عن بعد') },
  ];
  const comps = [
    { k: 'strategic', title: 'نظام التخطيط الاستراتيجي', desc: sc('comp_strategic_desc', '11 وحدة تخطيطية لبناء خطة استراتيجية متكاملة'), badge: sc('comp_strategic_badge', '11 وحدة'), icon: <IcTarget width={26} height={26} /> },
    { k: 'operational', title: 'نظام التخطيط التشغيلي', desc: sc('comp_operational_desc', '5 وحدات لتحويل الاستراتيجية إلى خطة تنفيذية'), badge: sc('comp_operational_badge', '5 وحدات'), icon: <IcCog width={26} height={26} /> },
    { k: 'policies', title: 'نظام بناء السياسات واللوائح', desc: sc('comp_policies_desc', '7 سياسات ولوائح تُبنى عبر استبيانات ذكية موجهة'), badge: sc('comp_policies_badge', '7 سياسات'), icon: <IcClipboard width={26} height={26} /> },
  ];
  const points = [1, 2, 3, 4, 5].map((i) => sc(`pricing_point${i}`, [
    'يتم وضع أسعار قليلة التكلفة وللجهة اختيار المستشار عن بعد من القائمة',
    'يتاح اعتماد الخطة من احدى الجهات في النظام بتكلفة إضافية',
    'يتم عرض أنظمة بناء السياسات واللوائح بأسعار مستقلة',
    'يتاح خيار تحكيم السياسات واللوائح من احد المستشارين بتكلفة إضافية',
    'يتم إتاحة تنزيل الملفات بشكل مصمم تلقائياً ويتاح خدمة التصميم بمقابل',
  ][i - 1]));
  const easy = [
    { icon: <IcLightbulb width={24} height={24} />, t: 'شرح بلغة بسيطة', d: 'كل مصطلح عليه علامة «؟» تشرحه بمثال من واقع الجمعيات — لا تحتاج خبرة سابقة.' },
    { icon: <IcDocument width={24} height={24} />, t: 'نماذج جاهزة للتعبئة', d: 'تعبّئ خانات واضحة خطوة بخطوة، وتخرج لك وثيقة مصمّمة جاهزة للاعتماد.' },
    { icon: <IcChat width={24} height={24} />, t: 'مستشار معك في كل خطوة', d: 'خبير يراجع كل وحدة ويعتمدها أو يوجّهك بملاحظات واضحة، وتراسله متى شئت.' },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: colors.bg }}>
      <PublicNav />

      {/* البطل */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `radial-gradient(1200px 500px at 85% -10%, ${colors.primaryDeep} 0%, transparent 60%), ${colors.ink}`, color: '#fff' }}>
        <RosetteShape size={760} color="#FFFFFF" opacity={0.06} style={{ position: 'absolute', right: '-12%', bottom: '-38%', animation: 'dfTurn 90s linear infinite' }} />
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center', padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 40px) clamp(64px, 9vw, 110px)', position: 'relative' }}>
          <div>
            <Eyebrow dark>للجمعيات والمؤسسات غير الربحية</Eyebrow>
            <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, lineHeight: 1.35 }}>{sc('hero_title', 'نظام البناء الاستراتيجي والتشغيلي للمنظمات غير الربحية')}</h1>
            <p style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', color: '#D6E4EE', marginTop: 18, lineHeight: 1.9, maxWidth: 560 }}>{sc('hero_subtitle', 'فكرة النظام وآلية العمل')}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
              <button onClick={onRegister} style={{ height: 54, padding: '0 30px', borderRadius: 14, border: 'none', background: colors.amber, color: colors.ink, fontSize: 16.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 3px 0 rgba(163,63,18,0.5)' }}>ابدأ مجانًا الآن ←</button>
              <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} style={{ height: 54, padding: '0 26px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>كيف تعمل دفة؟</button>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap', fontSize: 14, color: '#BFD6E5' }}>
              {['بدون خبرة سابقة', 'مستشار متخصص', 'وثائق جاهزة PDF'].map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcCheckCircle width={18} height={18} style={{ color: colors.amber }} />{t}</span>
              ))}
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* سهلة لغير المتخصص */}
      <section style={{ ...wrap, marginTop: -44, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
          {easy.map((e) => (
            <div key={e.t} style={{ background: '#fff', borderRadius: 20, padding: 22, border: `1px solid ${colors.grayBorder}`, boxShadow: '0 12px 30px rgba(14,42,61,0.07)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: colors.primaryTint, color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{e.icon}</div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{e.t}</h3>
              <p style={{ fontSize: 14.5, color: colors.gray, lineHeight: 1.9 }}>{e.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* كيف تعمل */}
      <section id="how" style={{ ...wrap, padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 40px) 0' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
          <Eyebrow>آلية العمل</Eyebrow>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}>أربع خطوات… وخطتك جاهزة</h2>
          <p style={{ fontSize: 16, color: colors.gray, marginTop: 12, lineHeight: 1.9 }}>{sc('how_it_works_desc', 'يعمل النظام بشكل شبه آلي، بحيث يوجد مستشار متخصص يراجع عن بعد مخرجات كل مرحلة.')}</p>
        </div>
        <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16, counterReset: 'step' }}>
          {steps.map((s, i) => (
            <li key={i} style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', border: `1px solid ${colors.grayBorder}`, position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: i === 3 ? colors.amber : colors.ink, color: i === 3 ? colors.ink : '#fff', fontFamily: font.display, fontWeight: 700, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{i + 1}</div>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{s.t}</h3>
              <p style={{ fontSize: 14.5, color: colors.gray, lineHeight: 1.85 }}>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* مكونات النظام */}
      <section style={{ ...wrap, padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 40px) 0' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
          <Eyebrow>مكونات النظام</Eyebrow>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}>ثلاث خدمات مستقلة… ابدأ بما تحتاجه</h2>
          <p style={{ fontSize: 16, color: colors.gray, marginTop: 12, lineHeight: 1.9 }}>كل خدمة قائمة بذاتها: لا يشترط إنهاء واحدة قبل البدء بالأخرى.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {comps.map((c) => {
            const s = systems[c.k];
            return (
              <div key={c.k} style={{ background: '#fff', borderRadius: 22, padding: 26, border: `1px solid ${colors.grayBorder}`, borderTop: `5px solid ${s.color}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: s.soft, color: s.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.text, background: s.soft, borderRadius: 999, padding: '4px 12px' }}>{c.badge}</span>
                </div>
                <h3 style={{ fontSize: 19 }}>{c.title}</h3>
                <p style={{ fontSize: 15, color: colors.gray, lineHeight: 1.85, flex: 1 }}>{c.desc}</p>
                <button onClick={() => navigate('services')} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', color: s.text, fontWeight: 700, fontSize: 14.5, fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}>تفاصيل أكثر ←</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* التسعير */}
      <section style={{ ...wrap, padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ background: '#fff', borderRadius: 28, border: `1px solid ${colors.grayBorder}`, padding: 'clamp(24px, 4vw, 48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <Eyebrow>آلية التسعير</Eyebrow>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginBottom: 12 }}>تكلفة في متناول كل جمعية</h2>
            <p style={{ fontSize: 15.5, color: colors.gray, lineHeight: 1.9, marginBottom: 22 }}>ادفع لما تحتاجه فقط، واختر مستشارك بنفسك.</p>
            <button onClick={() => navigate('pricing')} style={{ height: 50, padding: '0 26px', borderRadius: 14, border: 'none', background: colors.primary, color: '#fff', fontWeight: 700, fontSize: 15.5, fontFamily: 'inherit', cursor: 'pointer' }}>عرض الأسعار بالتفصيل</button>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {points.map((t, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 14, background: colors.bg, fontSize: 15, lineHeight: 1.8, color: colors.text }}>
                <IcCheckCircle width={22} height={22} style={{ color: colors.green, flexShrink: 0, marginTop: 2 }} />{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* دعوة */}
      <section style={{ background: colors.amber, position: 'relative', overflow: 'hidden' }}>
        <RosetteShape size={300} color={colors.ink} opacity={0.1} style={{ position: 'absolute', left: '3%', top: '-40%' }} />
        <div style={{ ...wrap, padding: 'clamp(40px, 6vw, 64px) clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: colors.ink, maxWidth: 680 }}>{sc('cta_title', 'ابدأ رحلة التخطيط الاستراتيجي لمنظمتك الآن')}</h2>
          <button onClick={onRegister} style={{ height: 56, padding: '0 34px', borderRadius: 16, border: 'none', background: colors.ink, color: '#fff', fontWeight: 700, fontSize: 17, fontFamily: 'inherit', cursor: 'pointer' }}>سجّل مجانًا</button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
