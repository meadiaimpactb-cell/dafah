// AdminFinancePage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Badge, Card, GenericPage, MetricCard } from '../../components/ui/kit';
import { IcStar } from '../../utils/icons';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const AdminFinancePage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState(0);

  React.useEffect(() => {
    api.get('/admin/finance')
      .then(r => setData(asObject(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل البيانات المالية</div>;

  const monthEntries = Object.entries(data.monthly_chart || {});
  const maxRev = Math.max(...monthEntries.map(([,v]) => v), 1);

  return (
    <GenericPage title="الإدارة المالية">
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي الإيرادات (ريال)" value={fmt(data.total_revenue)} icon={Icons.payments} />
        <MetricCard title="إيرادات هذا الشهر (ريال)" value={fmt(data.month_revenue)} icon={Icons.payments} color={colors.green} />
        <MetricCard title="مدفوعات معلقة (ريال)" value={fmt(data.pending_revenue)} icon={Icons.payments} color={colors.amberText} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['المدفوعات الواردة', 'أداء المستشارين', 'الرسم البياني'].map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: tab === i ? colors.primary : colors.grayLight, color: tab === i ? 'white' : colors.gray, fontSize: 13, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>

      <Card>
        {tab === 0 && (
          data.transactions?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد معاملات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['رقم الطلب', 'المنظمة', 'الخدمة', 'المبلغ (ريال)', 'التاريخ'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.transactions?.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '8px 8px', fontSize: 11, fontWeight: 600, color: colors.ink }}>{t.order_number}</td>
                    <td style={{ padding: '8px 8px', fontSize: 12 }}>{t.org_name}</td>
                    <td style={{ padding: '8px 8px' }}><Badge text={t.service} color="primary" small /></td>
                    <td style={{ padding: '8px 8px', fontSize: 12, fontWeight: 700 }}>{fmt(t.total)}</td>
                    <td style={{ padding: '8px 8px', fontSize: 11, color: colors.gray }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
        {tab === 1 && (
          data.consultants?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا يوجد مستشارون</div>
          ) : (
            <div>
              {data.consultants?.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.consultants.length - 1 ? `1px solid ${colors.grayLight}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: colors.gray }}>{c.reviews} مراجعة مكتملة</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: colors.amberText, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><IcStar width={13} height={13} /> {c.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 2 && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>الإيرادات الشهرية (آخر 12 شهر)</h4>
            {maxRev <= 1 ? (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات بعد</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
                {monthEntries.map(([key, val]) => {
                  const mIdx = parseInt(key.split('-')[1], 10) - 1;
                  const h = Math.max(4, Math.round((val / maxRev) * 140));
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div title={`${MONTH_LABELS[mIdx]}: ${fmt(val)} ريال`} style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${colors.primary}, ${colors.primary}80)`, borderRadius: '4px 4px 0 0' }} />
                      <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[mIdx].slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </GenericPage>
  );
};

export default AdminFinancePage;
