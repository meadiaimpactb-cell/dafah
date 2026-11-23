// ClientPaymentsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Badge, Card, GenericPage, MetricCard } from '../../components/ui/kit';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const ClientPaymentsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(null);

  React.useEffect(() => {
    api.get('/orders')
      .then(r => setData(asObject(r.data, { total_paid: 0, last_payment: 0, orders: [] })))
      .catch(() => setData({ total_paid: 0, last_payment: 0, orders: [] }))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const serviceMap = { strategic: 'التخطيط الاستراتيجي', operational: 'التخطيط التشغيلي', policies: 'السياسات واللوائح' };

  const downloadInvoice = async (order) => {
    setDownloading(order.id);
    const win = window.open('', '_blank');
    try {
      const res = await api.get(`/orders/${order.id}/invoice-link`);
      win.location.href = res.data.url;
    } catch {
      win.close();
      alert('تعذّر فتح الفاتورة. حاول مرة أخرى.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;

  return (
    <GenericPage title="المدفوعات والفواتير">
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي المدفوعات (ريال)" value={fmt(data.total_paid)} icon={Icons.payments} />
        <MetricCard title="مدفوعات معلقة" value={data.orders?.filter(o => o.payment_status === 'pending').length || 0} icon={Icons.payments} color={colors.green} />
        <MetricCard title="آخر دفعة (ريال)" value={fmt(data.last_payment)} icon={Icons.payments} color={colors.amberText} />
      </div>
      <Card>
        {!data.orders || data.orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد فواتير بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['رقم الفاتورة', 'التاريخ', 'الخدمة', 'المبلغ (ريال)', 'الحالة', ''].map(h => (
                <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.orders.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: colors.ink }}>{o.order_number}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12 }}>{o.date}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12 }}>{serviceMap[o.service_type] || o.service_type}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700 }}>{fmt(o.total)}</td>
                  <td style={{ padding: '10px 8px' }}><Badge text={o.payment_status === 'paid' ? 'مدفوعة' : o.payment_status === 'failed' ? 'فاشلة' : 'معلقة'} color={o.payment_status === 'paid' ? 'green' : o.payment_status === 'failed' ? 'red' : 'yellow'} small /></td>
                  <td style={{ padding: '10px 8px' }}>
                    {o.payment_status === 'paid' && (
                      <button
                        onClick={() => downloadInvoice(o)}
                        disabled={downloading === o.id}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          fontFamily: "inherit", cursor: downloading === o.id ? 'default' : 'pointer',
                          border: `1.5px solid ${colors.primary}`, background: 'white', color: colors.primary,
                          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                          opacity: downloading === o.id ? 0.6 : 1,
                        }}
                      >
                        {downloading === o.id ? '…' : '⬇ فاتورة PDF'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </GenericPage>
  );
};

export default ClientPaymentsPage;
