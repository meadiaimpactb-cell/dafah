// AdminReportsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Badge, BarChart, Card, DonutChart, GenericPage, LineChart, MetricCard, ProgressBar, Tab } from '../../components/ui/kit';
import { IcStar } from '../../utils/icons';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const AdminReportsPage = () => {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab]         = React.useState(0);

  React.useEffect(() => {
    api.get('/admin/reports')
      .then(r => setData(asObject(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data)   return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل بيانات التقارير</div>;

  const m = data.metrics || {};
  const donutSegs = (data.service_dist || []).map(s => ({
    label:   s.label,
    color:   s.color,
    percent: data.service_dist_total > 0 ? Math.round(s.value / data.service_dist_total * 100) : 0,
  }));

  return (
    <GenericPage title="التقارير والتحليلات">
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-4)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="معدل الإكمال"         value={`${m.completion_rate ?? 0}%`}           icon={Icons.chart} />
        <MetricCard title="متوسط مدة الإنجاز"    value={m.avg_days ? `${m.avg_days} يوم` : '—'} icon={Icons.log}      color={colors.blue} />
        <MetricCard title="متوسط تقييم المستشارين" value={`${m.avg_rating ?? 0}/5`}             icon={Icons.star}     color={colors.amberText} />
        <MetricCard title="إجمالي الإيرادات (ريال)" value={fmt(m.total_revenue)}                icon={Icons.payments} color={colors.green} />
      </div>

      <Tab tabs={['نظرة عامة', 'تقدم المنظمات', 'أداء المستشارين', 'تحليل الخدمات']} active={tab} onChange={setTab} />

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginTop: 16 }}>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>التسجيلات الشهرية (منظمات)</h4>
            <LineChart data={data.monthly_orgs || []} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>الإيرادات الشهرية (ألف ريال)</h4>
            <BarChart data={data.monthly_revenue || []} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>توزيع الخدمات</h4>
            {data.service_dist_total > 0 ? (
              <DonutChart size={130} label={String(data.service_dist_total)} segments={donutSegs} />
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد بيانات بعد</div>
            )}
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>معدل الإكمال حسب الخدمة</h4>
            <BarChart height={160} data={data.completion_by_service || []} colorFn={i => [colors.primary, colors.amberText, '#A33F12'][i] || colors.primary} />
          </Card>
        </div>
      )}

      {tab === 1 && (
        <Card style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>تقدم المنظمات</h4>
          {!data.org_progress?.length ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد مسارات نشطة</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['المنظمة', 'الخدمة', 'الوحدة الحالية', 'التقدم', 'أيام منذ البدء'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.org_progress.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600 }}>{r.org}</td>
                    <td style={{ padding: '10px 8px' }}><Badge text={r.service} color={r.service === 'استراتيجي' ? 'primary' : r.service === 'تشغيلي' ? 'orange' : 'blue'} small /></td>
                    <td style={{ padding: '10px 8px', fontSize: 12 }}>{r.step}</td>
                    <td style={{ padding: '10px 8px', width: 130 }}>
                      <ProgressBar percent={r.progress} />
                      <span style={{ fontSize: 10, color: colors.gray }}>{r.progress}%</span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 12, color: r.days > 30 ? colors.amberText : colors.gray }}>{r.days} يوم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 2 && (
        <div style={{ marginTop: 16 }}>
          <Card style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>نسبة الاعتماد</h4>
            {data.approval_stats && (
              <DonutChart size={120}
                label={`${data.approval_stats.first_time}%`}
                segments={[
                  { label: 'معتمد من المرة الأولى', color: colors.green,  percent: data.approval_stats.first_time },
                  { label: 'معتمد بعد تعديل',       color: colors.amberText, percent: data.approval_stats.after_revision },
                  { label: 'قيد التعديل',            color: colors.amberText, percent: data.approval_stats.revision },
                ]}
              />
            )}
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>ترتيب المستشارين</h4>
            {!data.consultants?.length ? (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا يوجد مستشارون</div>
            ) : (
              data.consultants.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < data.consultants.length - 1 ? `1px solid ${colors.grayLight}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : colors.grayLight, color: i < 3 ? 'white' : colors.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{i + 1}</div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: colors.gray }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcStar width={12} height={12}/> {c.rating}</span>
                    <span>{c.reviews} مراجعة</span>
                    {c.avg_hours != null && <span>{c.avg_hours} ساعة</span>}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginTop: 16 }}>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>الطلب على الخدمات</h4>
            <BarChart height={160} data={(data.service_dist || []).map(s => ({ label: s.label, value: s.value }))} colorFn={i => [colors.primary, colors.amberText, '#A33F12'][i] || colors.primary} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>معدل الإكمال حسب الخدمة</h4>
            <BarChart height={160} data={data.completion_by_service || []} colorFn={i => [colors.primary, colors.amberText, '#A33F12'][i] || colors.primary} />
          </Card>
        </div>
      )}
    </GenericPage>
  );
};

export default AdminReportsPage;
