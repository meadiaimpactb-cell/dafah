// AdminFaqsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Btn, Card, GenericPage, Input, Modal } from '../../components/ui/kit';
import { colors } from '../../theme/tokens';

const AdminFaqsPage = () => {
  const [faqs, setFaqs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ category: '', question: '', answer: '', sort_order: 0 });

  const load = () => {
    setLoading(true);
    api.get('/admin/faqs').then(r => setFaqs(Array.isArray(r.data) ? r.data : [])).catch(() => setFaqs([])).finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ category: '', question: '', answer: '', sort_order: 0 });
    setModal({ type: 'add' });
  };

  const openEdit = (faq) => {
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, sort_order: faq.sort_order });
    setModal({ type: 'edit', id: faq.id });
  };

  const save = async () => {
    if (!form.category || !form.question || !form.answer) return;
    setSaving(true);
    try {
      if (modal.type === 'add') {
        await api.post('/admin/faqs', form);
      } else {
        await api.put(`/admin/faqs/${modal.id}`, form);
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleFaq = async (faq) => {
    await api.post(`/admin/faqs/${faq.id}/toggle`);
    load();
  };

  const deleteFaq = async (faq) => {
    if (!window.confirm(`هل تريد حذف هذا السؤال نهائياً؟`)) return;
    await api.delete(`/admin/faqs/${faq.id}`);
    load();
  };

  const cats = [...new Set((faqs || []).map(f => f.category))];
  const filtered = (faqs || []).filter(f =>
    !search.trim() || f.question.includes(search) || f.category.includes(search) || f.answer.includes(search)
  );

  return (
    <GenericPage title="إدارة الأسئلة الشائعة">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Input placeholder="بحث في الأسئلة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn small onClick={openAdd}>+ إضافة سؤال</Btn>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>جاري التحميل...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.grayLight}` }}>
                  {['الفئة', 'السؤال', 'ترتيب', 'الحالة', 'إجراءات'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: i < 2 ? 'right' : 'center', color: colors.gray, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: colors.gray }}>لا توجد أسئلة</td></tr>
                ) : filtered.map(faq => (
                  <tr key={faq.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '12px', color: colors.ink, fontWeight: 600, whiteSpace: 'nowrap' }}>{faq.category}</td>
                    <td style={{ padding: '12px', color: colors.dark, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: colors.gray }}>{faq.sort_order}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: faq.is_active ? '#E8F8F2' : '#FCEBEB',
                        color: faq.is_active ? '#0B7F5D' : colors.red }}>
                        {faq.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.primary}`, background: 'transparent', color: colors.primary, cursor: 'pointer', fontSize: 12 }}>تعديل</button>
                        <button onClick={() => toggleFaq(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.gray}`, background: 'transparent', color: colors.gray, cursor: 'pointer', fontSize: 12 }}>
                          {faq.is_active ? 'إيقاف' : 'تفعيل'}</button>
                        <button onClick={() => deleteFaq(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.red}`, background: 'transparent', color: colors.red, cursor: 'pointer', fontSize: 12 }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <Modal open title={modal.type === 'add' ? 'إضافة سؤال جديد' : 'تعديل السؤال'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>الفئة</label>
              <input list="admin-faq-cats" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="مثال: أسئلة عامة"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit", boxSizing: 'border-box' }} />
              <datalist id="admin-faq-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>السؤال</label>
              <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                placeholder="اكتب السؤال هنا..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit", boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>الإجابة</label>
              <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                placeholder="اكتب الإجابة هنا..." rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit", resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>رقم الترتيب</label>
              <input type="number" min="0" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit", boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn outline small onClick={() => setModal(null)}>إلغاء</Btn>
              <Btn small onClick={save} disabled={saving || !form.category || !form.question || !form.answer}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </GenericPage>
  );
};

export default AdminFaqsPage;
