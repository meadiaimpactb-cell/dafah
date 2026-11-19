// ConsultantStatsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import React from 'react';
import api from '../../api/axios';
import { Card, GenericPage, MetricCard } from '../../components/ui/kit';
import { colors } from '../../theme/tokens';
import { Icons } from '../../utils/navIcons';
import { asObject } from '../../utils/apiData';

const ConsultantStatsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/consultant/stats')
      .then(r => setData(asObject(r.data)))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل الإحصائيات</div>;

  const monthEntries = Object.entries(data.monthly_reviews || {});
  const maxVal = Math.max(...monthEntries.map(([, v]) => v), 1);
  const avgDays = data.avg_review_hours ? (data.avg_review_hours / 24).toFixed(1) : '—';

  return (
    <GenericPage title="إحصائياتي">
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-4)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي العملاء" value={data.total_clients} icon={Icons.users} />
        <MetricCard title="المراجعات المكتملة" value={data.total_completed} icon={Icons.content} color={colors.green} />
        <MetricCard title="متوسط وقت المراجعة" value={avgDays === '—' ? '—' : `${avgDays} يوم`} icon={Icons.log} color={colors.blue} />
        <MetricCard title="التقييم العام" value={data.rating != null ? `${data.rating}/5` : '—'} icon={Icons.star} color={colors.amberText} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>المراجعات الشهرية</h3>
          {maxVal <= 1 ? (
            <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {monthEntries.map(([key, val]) => {
                const mIdx = parseInt(key.split('-')[1], 10) - 1;
                const h = maxVal > 0 ? Math.max(4, Math.round((val / maxVal) * 110)) : 4;
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div title={`${MONTH_LABELS[mIdx]}: ${val}`} style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${colors.green}, ${colors.green}80)`, borderRadius: '4px 4px 0 0' }} />
                    <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[mIdx].slice(0,3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>توزيع المراجعات حسب الخدمة</h3>
          {[
            { label: 'استراتيجي', val: data.by_service?.strategic || 0, color: colors.primary },
            { label: 'تشغيلي',   val: data.by_service?.operational || 0, color: colors.amberText },
            { label: 'سياسات',   val: data.by_service?.policy || 0, color: colors.green },
          ].map((s, i) => {
            const pct = data.total_completed > 0 ? Math.round(s.val / data.total_completed * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: colors.ink }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val} ({pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: colors.grayLight }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: s.color, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </GenericPage>
  );
};

export default ConsultantStatsPage;
