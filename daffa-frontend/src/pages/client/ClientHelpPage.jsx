// ClientHelpPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Btn, Card, GenericPage, Input } from '../../components/ui/kit';
import RoleGuide from '../shared/RoleGuide';
import { colors } from '../../theme/tokens';
import { asObject } from '../../utils/apiData';
import { chatApi } from '../../api/chat';
import { useSiteContent } from '../auth/AuthShell';

// «تواصل معنا»: يفتح المحادثة مع المستشار المعيّن، وإن تعذّر ذلك تظهر وسائل تواصل بديلة مع فريق الدعم
const ClientHelpPage = ({ onOpenChat, onOpenPolicies }) => {
  const sc = useSiteContent();
  const [contacting, setContacting] = React.useState(false);
  const [fallback, setFallback] = React.useState(null);
  const [faqs, setFaqs] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    api.get('/faqs').then(r => setFaqs(asObject(r.data, {}))).catch(() => setFaqs({}));
  }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const contactSupport = async () => {
    setContacting(true); setFallback(null);
    try {
      const r = await chatApi.startWith();
      if (r.data?.conversation_id && onOpenChat) { onOpenChat(r.data.conversation_id); return; }
      setFallback('تعذّر فتح المحادثة الآن.');
    } catch (e) {
      setFallback(e.response?.data?.message || 'تعذّر فتح المحادثة الآن.');
    } finally { setContacting(false); }
  };
  const email = sc.contact_email || sc.email_reply_to || '';
  const phone = /\d{4}/.test(sc.contact_phone || '') ? sc.contact_phone : '';

  const filtered = React.useMemo(() => {
    if (!faqs) return null;
    if (!search.trim()) return faqs;
    const q = search.trim();
    const result = {};
    for (const [cat, items] of Object.entries(faqs)) {
      const matches = items.filter(f =>
        f.question.includes(q) || f.answer.includes(q) || cat.includes(q)
      );
      if (matches.length) result[cat] = matches;
    }
    return result;
  }, [faqs, search]);

  return (
    <GenericPage title="المساعدة والدعم">
      <RoleGuide role="client" />
      <div style={{ marginBottom: 20 }}>
        <Input placeholder="ابحث عن سؤالك..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {!filtered ? (
        <Card><div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>جاري التحميل...</div></Card>
      ) : Object.keys(filtered).length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>لا توجد نتائج للبحث عن "{search}"</div></Card>
      ) : (
        Object.entries(filtered).map(([cat, items]) => (
          <Card key={cat} style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>{cat}</h3>
            {items.map((faq, qi) => (
              <div key={faq.id} style={{ borderTop: qi > 0 ? `1px solid ${colors.grayLight}` : 'none' }}>
                <div
                  onClick={() => toggle(faq.id)}
                  style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 8 }}
                >
                  <span style={{ fontSize: 13, color: colors.ink, fontWeight: 600 }}>{faq.question}</span>
                  <span style={{ color: colors.gray, flexShrink: 0, transition: 'transform 0.2s', display: 'inline-block', transform: expanded[faq.id] ? 'rotate(-90deg)' : 'rotate(90deg)' }}>›</span>
                </div>
                {expanded[faq.id] && (
                  <div style={{ paddingBottom: 12, fontSize: 13, color: colors.gray, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {faq.answer}
                    {cat === 'السياسات واللوائح' && onOpenPolicies && (
                      <div style={{ marginTop: 8 }}><Btn small variant="secondary" onClick={onOpenPolicies}>فتح السياسات واللوائح</Btn></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>
        ))
      )}
      <Card style={{ marginTop: 16, textAlign: 'center', padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>لم تجد إجابتك؟</h3>
        <p style={{ fontSize: 13, color: colors.gray, marginBottom: 12 }}>تواصل مع فريق الدعم عبر المحادثة المباشرة</p>
        <Btn small onClick={contactSupport} disabled={contacting}>{contacting ? 'جارٍ فتح المحادثة…' : 'تواصل معنا'}</Btn>
        {fallback && (
          <div role="status" data-support-fallback style={{ marginTop: 14, textAlign: 'right', background: '#FEF3EC', border: '1px solid #FBC3A3', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#7F310E', lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{fallback}</div>
            <div>يمكنك التواصل مع فريق الدعم مباشرة:</div>
            {email && <div>البريد الإلكتروني: <a href={`mailto:${email}`} style={{ color: colors.primary, fontWeight: 700 }} dir="ltr">{email}</a></div>}
            {phone && <div>الهاتف: <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ color: colors.primary, fontWeight: 700 }} dir="ltr">{phone}</a></div>}
            {sc.contact_hours && <div>ساعات العمل: {sc.contact_hours}</div>}
          </div>
        )}
      </Card>
    </GenericPage>
  );
};

export default ClientHelpPage;
