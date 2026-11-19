import { useEffect, useState } from 'react';
import api from '../../api/axios';
import UnitVideo from './UnitVideo';

/*
 * دليل الاستخدام لكل دور (العميل، المستشار، مدير النظام): فيديو الشرح + ملف الدليل PDF.
 * الروابط من «محتوى الموقع ← الأدلة والفيديوهات» في لوحة التحكم (guide_{role}_video / guide_{role}_pdf).
 */

const C = { primary: '#235D7F', ink: '#0E2A3D', gray: '#5E6B78', border: '#E8E3DA', soft: '#EAF4FD', softLine: '#A9D2F5', amber: '#EF6A2C' };

const ROLE = {
  client:     { title: 'دليل استخدام المنصة للعميل', text: 'شرح مختصر لرحلتك في دفة: إنشاء الخطة، والدفع، وتعبئة الوحدات، والتواصل مع المستشار، وتنزيل المخرجات.' },
  consultant: { title: 'دليل المستشار', text: 'كيف تراجع وحدات العملاء، وتعتمدها أو تطلب تعديلها بملاحظات واضحة، وتتابع عملاءك وأرباحك.' },
  admin:      { title: 'دليل مدير النظام', text: 'إدارة المنظمات والمستشارين والخدمات والأسعار، وتعديل محتوى الوحدات والموقع، ومتابعة المخرجات والمدفوعات.' },
};

let cache = null; // محتوى الموقع يُجلب مرة واحدة لكل جلسة

export default function RoleGuide({ role = 'client', compact }) {
  const [sc, setSc] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api.get('/site-content').then(r => { cache = r.data || {}; setSc(cache); }).catch(() => setSc({}));
  }, []);

  const info = ROLE[role] || ROLE.client;
  const video = sc?.[`guide_${role}_video`];
  const pdf = sc?.[`guide_${role}_pdf`];
  if (sc && !video && !pdf) return null;

  return (
    <section aria-label={info.title} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: compact ? 16 : 22, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.ink }}>{info.title}</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: C.gray, lineHeight: 1.9 }}>{info.text}</p>
        </div>
        {pdf && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={pdf} target="_blank" rel="noopener noreferrer"
              style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.primary}`, color: C.primary, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              قراءة الدليل
            </a>
            <a href={pdf} download
              style={{ padding: '9px 16px', borderRadius: 10, background: C.amber, color: C.ink, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              تنزيل الدليل (PDF)
            </a>
          </div>
        )}
      </div>
      {!sc && <div style={{ fontSize: 13, color: C.gray }}>جارٍ التحميل…</div>}
      {video && <UnitVideo url={video} title={info.title} />}
    </section>
  );
}
