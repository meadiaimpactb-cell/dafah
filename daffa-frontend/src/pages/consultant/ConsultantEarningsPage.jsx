// ConsultantEarningsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Badge, Card, GenericPage, MetricCard } from '../../components/ui/kit';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const ConsultantEarningsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/consultant/earnings')
      .then(r => setData(asObject(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray, fontSize: 13 }}>تعذّر تحميل الأرباح</div>;

  const months = Object.entries(data.monthly || {});
  const maxVal = Math.max(...months.map(([, v]) => v), 1);
  const MONTH_LABELS = { '01':'يناير','02':'فبراير','03':'مارس','04':'أبريل','05':'مايو','06':'يونيو','07':'يوليو','08':'أغسطس','09':'سبتمبر','10':'أكتوبر','11':'نوفمبر','12':'ديسمبر' };

  return (
    <GenericPage title="الأرباح">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-4)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي أرباحي (ريال)" value={fmt(data.total_earnings)} icon={Icons.payments} color={colors.green} />
        <MetricCard title="عدد الطلبات" value={data.orders_count} icon={Icons.content} />
        <MetricCard title="نسبتي من كل طلب" value={`${data.commission_rate}%`} icon={Icons.chart} color={colors.primary} />
        <MetricCard title="حصة المنصة" value={`${data.platform_rate}%`} icon={Icons.settings} color={colors.amberText} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 16 }}>
        {/* Monthly chart */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: colors.ink, marginBottom: 14 }}>الأرباح الشهرية (ريال)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {months.map(([key, val]) => (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: colors.primary, borderRadius: '4px 4px 0 0', height: `${Math.max((val / maxVal) * 100, val > 0 ? 4 : 2)}px`, minHeight: 2, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 9, color: colors.gray, transform: 'rotate(-40deg)', whiteSpace: 'nowrap' }}>{MONTH_LABELS[key.split('-')[1]]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Commission breakdown */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: colors.ink, marginBottom: 14 }}>توزيع الأرباح</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: colors.gray }}>حصتك كمستشار</span>
                <span style={{ fontWeight: 700, color: colors.green }}>{data.commission_rate}%</span>
              </div>
              <div style={{ height: 10, background: colors.grayLight, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${data.commission_rate}%`, height: '100%', background: colors.green, borderRadius: 6 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: colors.gray }}>حصة المنصة</span>
                <span style={{ fontWeight: 700, color: colors.amberText }}>{data.platform_rate}%</span>
              </div>
              <div style={{ height: 10, background: colors.grayLight, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${data.platform_rate}%`, height: '100%', background: colors.amber, borderRadius: 6 }} />
              </div>
            </div>
            <div style={{ marginTop: 8, padding: '10px 14px', background: colors.grayLight, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 2 }}>إجمالي أرباحك المستحقة</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.ink }}>{fmt(data.total_earnings)} <span style={{ fontSize: 12, fontWeight: 400 }}>ريال</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders table */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: colors.ink, marginBottom: 14 }}>تفاصيل الأرباح لكل طلب</div>
        {!data.orders || data.orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد طلبات بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['رقم الطلب', 'العميل', 'الخدمة', 'قيمة الطلب', 'حصتك (ريال)', 'التاريخ'].map(h => (
                <th key={h} style={{ padding: '9px 10px', background: colors.grayLight, fontWeight: 600, color: colors.gray, textAlign: 'right', fontSize: 11 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.orders.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: colors.ink }}>{o.order_number}</td>
                  <td style={{ padding: '10px' }}>{o.org_name || '—'}</td>
                  <td style={{ padding: '10px' }}><Badge text={o.service_label} color={o.service_type === 'strategic' ? 'primary' : o.service_type === 'operational' ? 'orange' : 'blue'} small /></td>
                  <td style={{ padding: '10px' }}>{fmt(o.total)} ريال</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: colors.green }}>{fmt(o.consultant_share)} ريال</td>
                  <td style={{ padding: '10px', color: colors.gray }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#E8F8F2' }}>
                <td colSpan={4} style={{ padding: '10px', fontWeight: 700, color: colors.ink }}>الإجمالي</td>
                <td style={{ padding: '10px', fontWeight: 800, color: colors.green, fontSize: 14 }}>{fmt(data.total_earnings)} ريال</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </GenericPage>
  );
};

export default ConsultantEarningsPage;
