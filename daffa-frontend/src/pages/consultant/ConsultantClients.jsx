import DfIcon from '../../components/ui/DfIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { consultantApi } from '../../api/consultant';

const C = {
  primary: '#5546D6', ink: '#1B1746',
  orange: '#F5A524', amberText: '#9A5B07', amberSoft: '#FFF8EA',
  green: '#0B7F5D', greenLight: '#C9EFE1',
  blue: '#2E8FE6', blueLight: '#CFE5FA',
  red: '#D03F2A', redLight: '#FAD4CE',
  yellow: '#F5A524', yellowLight: '#FEEDC6',
  gray: '#67637A', grayLight: '#F3EFE8', grayBorder: '#E8E3DA',
};

const SERVICE_CFG = {
  strategic:   { label: 'استراتيجي', icon: <DfIcon name="target" size={20} />, color: C.primary,    bg: '#E7E5FD'   },
  operational: { label: 'تشغيلي',    icon: <DfIcon name="gear" size={20} />, color: '#5546D6', bg: '#E7E5FD'   },
  policies:    { label: 'سياسات',    icon: <DfIcon name="clipboard" size={20} />, color: C.blue,    bg: C.blueLight },
};

const STATUS_MAP = {
  active:              { label: 'نشط',          color: C.primary,   bg: '#E7E5FD' },
  review:              { label: 'قيد المراجعة',  color: '#5546D6', bg: '#E7E5FD' },
  completed:           { label: 'مكتمل',         color: C.green,  bg: C.greenLight },
  pending:             { label: 'معلق',          color: C.gray,   bg: C.grayLight },
  design_in_progress:  { label: 'قيد التصميم',  color: C.amberText, bg: C.amberSoft },
};

function MiniProgress({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#E8E3DA', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: value >= 100 ? C.green : color, width: `${Math.min(value, 100)}%`, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: value >= 100 ? C.green : color, minWidth: 28 }}>{value}%</span>
    </div>
  );
}

function ServiceCard({ type, data, navigate, userId, orgName }) {
  if (!data) return null;
  const cfg         = SERVICE_CFG[type];
  const sts         = STATUS_MAP[data.status] || STATUS_MAP.pending;
  const hasPending  = data.pending  > 0;
  const hasRevision = data.revision > 0;
  const needsWork   = hasPending || hasRevision;
  const isCompleted = data.status === 'completed';

  const goTo = (dest) => {
    if (!navigate) return;
    sessionStorage.setItem('pending_reviews_tab', type);
    window.dispatchEvent(new CustomEvent('dafah:reviews-tab', {
      detail: { tab: type, userId, orgName }
    }));
    navigate(dest);
  };

  return (
    <div
      onClick={() => goTo(needsWork ? 'con-pending' : 'con-completed')}
      style={{
        border: `1.5px solid ${needsWork ? cfg.color + '60' : isCompleted ? C.green + '40' : C.grayBorder}`,
        borderRadius: 10,
        padding: '10px 14px',
        background: needsWork ? cfg.bg + '80' : isCompleted ? C.greenLight + '60' : '#FBF9F5',
        transition: 'all 0.18s',
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 3px 12px ${cfg.color}22`; e.currentTarget.style.borderColor = cfg.color + '80'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = needsWork ? cfg.color + '60' : isCompleted ? C.green + '40' : C.grayBorder; }}
    >
      {/* Badge معلقة */}
      {hasPending > 0 && (
        <div style={{ position: 'absolute', top: -8, left: 10, background: C.amber, color: '#1B1746', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
          {data.pending} معلقة
        </div>
      )}
      {hasRevision > 0 && !hasPending && (
        <div style={{ position: 'absolute', top: -8, left: 10, background: C.amber, color: '#1B1746', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
          {data.revision} تعديل
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>{cfg.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: sts.bg, color: sts.color }}>{sts.label}</span>
      </div>

      <MiniProgress value={data.progress} color={cfg.color} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: C.gray, flexWrap: 'wrap', gap: 4 }}>
        <span>معتمد: <strong style={{ color: C.green }}>{data.approved}</strong></span>
        <span>الإجمالي: <strong>{data.total}</strong></span>
        {data.plans_count > 1 && <span style={{ color: cfg.color, fontWeight: 600 }}>{data.plans_count} خطط</span>}
        {data.started_at && <span>{data.started_at}</span>}
      </div>

      {/* زر الإجراء — يظهر دائماً */}
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        {needsWork ? (
          <button
            onClick={e => { e.stopPropagation(); goTo('con-pending'); }}
            style={{ flex: 1, padding: '5px 0', background: cfg.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}>
            مراجعة الآن ←
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); goTo('con-completed'); }}
            style={{ flex: 1, padding: '5px 0', background: 'transparent', color: isCompleted ? C.green : cfg.color, border: `1px solid ${isCompleted ? C.green + '60' : cfg.color + '60'}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit" }}>
            {isCompleted ? 'عرض المعتمدة ←' : 'عرض التفاصيل ←'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConsultantClients({ navigate }) {
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastSync,  setLastSync]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterSvc, setFilterSvc] = useState('all'); // all | strategic | operational | policies | pending

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await consultantApi.clients();
      setClients(r.data);
      setLastSync(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 60_000); // auto-refresh every minute
    return () => clearInterval(iv);
  }, [load]);

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.org_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.org_type?.toLowerCase().includes(search.toLowerCase()) ||
      c.rep_name?.toLowerCase().includes(search.toLowerCase());

    const matchSvc =
      filterSvc === 'all'         ? true :
      filterSvc === 'pending'     ? c.total_pending > 0 :
      filterSvc === 'strategic'   ? !!c.strategic :
      filterSvc === 'operational' ? !!c.operational :
      filterSvc === 'policies'    ? !!c.policies : true;

    return matchSearch && matchSvc;
  });

  const totalPendingAll = clients.reduce((s, c) => s + (c.total_pending || 0), 0);

  // تحديد البطاقات المرئية بناءً على الفلتر المفعّل
  const getVisibleData = (client) => {
    if (filterSvc === 'all') {
      return { strategic: client.strategic, operational: client.operational, policies: client.policies };
    }
    if (filterSvc === 'pending') {
      const hasPend = d => d && (d.pending > 0 || d.revision > 0);
      return {
        strategic:   hasPend(client.strategic)   ? client.strategic   : null,
        operational: hasPend(client.operational) ? client.operational : null,
        policies:    hasPend(client.policies)    ? client.policies    : null,
      };
    }
    // فلتر خدمة محددة — أظهر بطاقة تلك الخدمة فقط
    return {
      strategic:   filterSvc === 'strategic'   ? client.strategic   : null,
      operational: filterSvc === 'operational' ? client.operational : null,
      policies:    filterSvc === 'policies'    ? client.policies    : null,
    };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: C.gray }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}><DfIcon name="hourglass" size={32} /></div>
        <div style={{ fontSize: 14 }}>جارٍ التحميل…</div>
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>العملاء والمهام</h2>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>
            {clients.length} عميل
            {totalPendingAll > 0 && <span style={{ marginRight: 8, color: C.amberText, fontWeight: 700 }}>• {totalPendingAll} مهمة معلقة</span>}
            {lastSync && <span style={{ marginRight: 8 }}>• آخر تحديث: {lastSync.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث عن منظمة…"
            style={{ padding: '7px 12px', borderRadius: 10, border: `1px solid ${C.grayBorder}`, fontFamily: "inherit", fontSize: 12, width: 180, outline: 'none' }}
          />
          <button onClick={() => load(false)} style={{ padding: '7px 14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: "inherit" }}>
            ↻ تحديث
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all',         label: `الكل (${clients.length})` },
          { key: 'pending',     label: `معلقة (${clients.filter(c => c.total_pending > 0).length})`, urgent: true },
          { key: 'strategic',   label: `استراتيجي (${clients.filter(c => c.strategic).length})` },
          { key: 'operational', label: `تشغيلي (${clients.filter(c => c.operational).length})` },
          { key: 'policies',    label: `سياسات (${clients.filter(c => c.policies).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterSvc(f.key)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: filterSvc === f.key ? 700 : 500, fontFamily: "inherit", cursor: 'pointer', background: filterSvc === f.key ? (f.urgent ? C.amber : C.primary) : '#fff', color: filterSvc === f.key ? '#1B1746' : C.gray, border: `1.5px solid ${filterSvc === f.key ? (f.urgent ? C.amberLine : C.primary) : C.grayBorder}` }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', color: C.gray, boxShadow: '0 1px 4px rgba(27,23,70,0.07)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}><DfIcon name="users" size={32} /></div>
          <div style={{ fontSize: 14 }}>{search ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء مُسنَدون إليك بعد'}</div>
        </div>
      )}

      {/* Client cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(client => {
          const hasPending = client.total_pending > 0;
          const vis        = getVisibleData(client);
          const visCount   = [vis.strategic, vis.operational, vis.policies].filter(Boolean).length;

          return (
            <div key={client.user_id}
              style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(27,23,70,0.07)', border: `2px solid ${hasPending ? C.amberLine + '40' : 'transparent'}`, transition: 'border 0.2s' }}>

              {/* Top row: client identity */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: hasPending ? C.amber : C.primary, color: '#1B1746', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {client.avatar}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{client.org_name}</span>
                      {client.org_type && <span style={{ fontSize: 10, color: C.gray, background: C.grayLight, padding: '1px 8px', borderRadius: 20 }}>{client.org_type}</span>}
                      {client.rep_name && <span style={{ fontSize: 11, color: C.gray }}>{client.rep_name}</span>}
                    </div>
                    {/* شارات الخدمات — تُبرز الخدمة المفلترة */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {client.strategic   && (
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: vis.strategic ? 700 : 400, background: vis.strategic ? '#E7E5FD' : C.grayLight, color: vis.strategic ? C.primary : C.gray }}><DfIcon name="target" size={14} style={{ marginInlineEnd: 6 }} />استراتيجي</span>
                      )}
                      {client.operational && (
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: vis.operational ? 700 : 400, background: vis.operational ? '#E7E5FD' : C.grayLight, color: vis.operational ? '#5546D6' : C.gray }}><DfIcon name="gear" size={14} style={{ marginInlineEnd: 6 }} />تشغيلي</span>
                      )}
                      {client.policies    && (
                        <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: vis.policies ? 700 : 400, background: vis.policies ? C.blueLight : C.grayLight, color: vis.policies ? C.blue : C.gray }}><DfIcon name="clipboard" size={14} style={{ marginInlineEnd: 6 }} />سياسات</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total pending badge */}
                {hasPending ? (
                  <div style={{ textAlign: 'center', background: C.amber, color: '#1B1746', borderRadius: 10, padding: '6px 14px', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{client.total_pending}</div>
                    <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>مهمة معلقة</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', background: C.greenLight, color: C.green, borderRadius: 10, padding: '6px 14px', flexShrink: 0 }}>
                    <div style={{ fontSize: 16 }}><DfIcon name="check" size={16} /></div>
                    <div style={{ fontSize: 9, marginTop: 2 }}>لا مهام</div>
                  </div>
                )}
              </div>

              {/* Services grid — يعرض فقط البطاقات المرئية حسب الفلتر */}
              {visCount > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visCount}, 1fr)`, gap: 10 }}>
                  {vis.strategic   && <ServiceCard type="strategic"   data={vis.strategic}   navigate={navigate} userId={client.user_id} orgName={client.org_name} />}
                  {vis.operational && <ServiceCard type="operational" data={vis.operational} navigate={navigate} userId={client.user_id} orgName={client.org_name} />}
                  {vis.policies    && <ServiceCard type="policies"    data={vis.policies}    navigate={navigate} userId={client.user_id} orgName={client.org_name} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
