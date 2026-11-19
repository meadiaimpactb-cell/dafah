// AdminActivityLogPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card, GenericPage } from '../../components/ui/kit';
import { IcClipboard } from '../../utils/icons';
import { colors } from '../../theme/tokens';
import { ACTION_LABELS, ROLE_COLORS, CATEGORY_OPTIONS, ROLE_OPTIONS } from './activityMeta';

const AdminActivityLogPage = () => {
  const [logs,     setLogs]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [roleFilter,setRoleFilter]= useState('');

  const load = (cat, role, q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat)  params.set('category', cat);
    if (role) params.set('role', role);
    if (q)    params.set('search', q);
    api.get('/admin/activity-log?' + params.toString())
      .then(r => setLogs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(catFilter, roleFilter, ''); }, []);

  const handleFilter = (cat, role) => {
    setCatFilter(cat); setRoleFilter(role);
    load(cat, role, search);
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (q.length === 0 || q.length >= 2) load(catFilter, roleFilter, q);
  };

  const exportCSV = () => {
    if (!logs || logs.length === 0) return;
    const rows = [['التاريخ', 'المستخدم', 'الدور', 'الإجراء', 'التفاصيل', 'IP']];
    logs.forEach(l => rows.push([l.created_at, l.user_name, l.role, l.action, l.details || '', l.ip || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const actionMeta = (action) => ACTION_LABELS[action] || { color: 'gray', label: action };

  return (
    <GenericPage title="سجل العمليات">
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="بحث بالاسم أو التفاصيل..."
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <select value={catFilter} onChange={e => handleFilter(e.target.value, roleFilter)}
          style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 12, fontFamily: "inherit" }}>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={roleFilter} onChange={e => handleFilter(catFilter, e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 12, fontFamily: "inherit" }}>
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, background: colors.white, fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 600, color: colors.ink }}>
          تصدير CSV
        </button>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: colors.gray, fontSize: 13 }}>جارٍ تحميل السجل...</div>
        ) : !logs || logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: colors.gray }}><IcClipboard width={40} height={40} /></div>
            <div style={{ fontSize: 13, color: colors.gray }}>لا توجد عمليات مسجلة بعد</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: colors.gray, marginBottom: 10, textAlign: "left" }}>
              {logs.length} سجل
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["التاريخ والوقت", "المستخدم", "الدور", "الإجراء", "التفاصيل"].map(h => (
                      <th key={h} style={{ padding: "10px 10px", background: colors.grayLight, fontSize: 11, fontWeight: 700, color: colors.gray, textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row, i) => {
                    const meta = actionMeta(row.action);
                    const badgeColors = {
                      green: { bg: '#C9EFE1', color: '#086449' },
                      primary:  { bg: '#C9EFE1', color: '#0B7F5D' },
                      blue:  { bg: '#CFE5FA', color: '#1A65AD' },
                      orange:{ bg: '#FDE2D2', color: '#A33F12' },
                      red:   { bg: '#F8D3D3', color: '#C53A3A' },
                      gray:  { bg: '#F3EFE8', color: '#5E6B78' },
                    };
                    const actionStyle = badgeColors[meta.color] || badgeColors.gray;
                    const roleStyle   = badgeColors[ROLE_COLORS[row.role] || 'gray'] || badgeColors.gray;
                    return (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}`, background: i % 2 === 0 ? colors.white : "#FBF9F5" }}>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, color: colors.ink, fontWeight: 500 }}>{row.created_at}</div>
                          <div style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>{row.time}</div>
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: "nowrap" }}>{row.user_name}</td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleStyle.bg, color: roleStyle.color }}>
                            {row.role === 'admin' ? 'مدير' : row.role === 'consultant' ? 'مستشار' : row.role === 'client' ? 'عميل' : 'نظام'}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: actionStyle.bg, color: actionStyle.color }}>
                            {row.action}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: colors.gray, maxWidth: 280 }}>
                          {row.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </GenericPage>
  );
};

export default AdminActivityLogPage;
