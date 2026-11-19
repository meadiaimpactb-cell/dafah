// AdminDashboardPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Card, MetricCard } from '../../components/ui/kit';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const AdminDashboardPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(asObject(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const catColor = (cat) => {
    const m = { auth:'#0E9F74', workflow:'#1F74C4', payment:'#A33F12', review:'#235D7F', admin:'#DC4A4A', policy:'#0E9F74', consultant:'#A33F12', general:'#5E6B78' };
    return m[cat] || '#5E6B78';
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#5E6B78', fontSize: 13 }}>جارٍ تحميل لوحة التحكم…</div>
  );

  if (!data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#DC4A4A', fontSize: 13 }}>تعذّر تحميل البيانات. حاول مجدداً.</div>
  );

  const monthEntries = Object.entries(data.monthly_revenue);
  const maxRev = Math.max(...monthEntries.map(([, v]) => v), 1);

  const { strategic = 0, operational = 0, policy = 0, total: distTotal = 1 } = data.service_dist;
  const stPct  = Math.round(strategic   / distTotal * 100);
  const opPct  = Math.round(operational / distTotal * 100);
  const polPct = Math.round(policy      / distTotal * 100);
  const conicBg = `conic-gradient(${colors.primary} 0% ${stPct}%, ${colors.amberText} ${stPct}% ${stPct + polPct}%, #A33F12 ${stPct + polPct}% 100%)`;

  const roleLabel = { admin: 'أدمين', consultant: 'مستشار', client: 'عميل', system: 'نظام' };

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 24 }}>لوحة تحكم الإدارة</h2>

      {/* Row 1 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 14 }}>
        <MetricCard title="إجمالي المنظمات" value={fmt(data.total_orgs)} icon={Icons.users} />
        <MetricCard title="اشتراكات نشطة" value={fmt(data.active_workflows)} icon={Icons.services} color={colors.green} />
        <MetricCard title="الإيرادات (ريال)" value={fmt(data.total_revenue)} icon={Icons.payments} color={colors.amberText} />
      </div>
      {/* Row 2 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 24 }}>
        <MetricCard title="معدل الإكمال" value={data.completion_rate + '%'} icon={Icons.chart} />
        <MetricCard title="المستشارين النشطين" value={fmt(data.active_consultants)} icon={Icons.users} color={colors.primary} />
        <MetricCard title="عمليات مكتملة" value={fmt(data.total_completed ?? 0)} icon={Icons.star} color={colors.amberText} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 16 }}>
        {/* Monthly Revenue Chart */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>الإيرادات الشهرية (ريال)</h3>
          {maxRev === 1 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات إيرادات بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
              {monthEntries.map(([key, val]) => {
                const monthIdx = parseInt(key.split('-')[1], 10) - 1;
                const barH = maxRev > 0 ? Math.max(4, Math.round((val / maxRev) * 140)) : 4;
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${MONTH_LABELS[monthIdx]}: ${fmt(val)} ريال`}
                      style={{ width: '100%', height: barH, background: `linear-gradient(180deg, ${colors.primary}, ${colors.primary}80)`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s', cursor: 'default' }}
                    />
                    <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[monthIdx].slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Service Distribution */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>توزيع الخدمات</h3>
          {distTotal <= 0 || (strategic + operational + policy === 0) ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد طلبات مدفوعة بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: conicBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white' }} />
              </div>
              <div>
                {[
                  { label: 'تخطيط استراتيجي', color: colors.primary,   pct: stPct,  cnt: strategic   },
                  { label: 'سياسات ولوائح',    color: colors.amberText, pct: polPct, cnt: policy      },
                  { label: 'تخطيط تشغيلي',     color: '#A33F12',    pct: opPct,  cnt: operational },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: colors.gray }}>{l.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.ink, marginRight: 'auto' }}>{l.pct}%</span>
                    <span style={{ fontSize: 11, color: colors.gray }}>({l.cnt})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>آخر العمليات</h3>
        {!data.recent_activity || data.recent_activity.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد عمليات مسجّلة بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['العملية', 'المستخدم', 'الدور', 'الفئة', 'التاريخ'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', background: colors.grayLight, fontSize: 12, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_activity.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{row.action}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: colors.ink }}>{row.user_name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${catColor(row.category)}18`, color: catColor(row.category), fontWeight: 600 }}>
                      {roleLabel[row.role] || row.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${catColor(row.category)}18`, color: catColor(row.category) }}>
                      {row.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: colors.gray }}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
