// ClientHelpPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Btn, Card, GenericPage, Input } from '../../components/ui/kit';
import RoleGuide from '../shared/RoleGuide';
import { colors } from '../../theme/tokens';
import { asObject } from '../../utils/apiData';

const ClientHelpPage = () => {
  const [faqs, setFaqs] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    api.get('/faqs').then(r => setFaqs(asObject(r.data, {}))).catch(() => setFaqs({}));
  }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

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
                  <div style={{ paddingBottom: 12, fontSize: 13, color: colors.gray, lineHeight: 1.8 }}>
                    {faq.answer}
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
        <Btn small>تواصل معنا</Btn>
      </Card>
    </GenericPage>
  );
};

export default ClientHelpPage;
