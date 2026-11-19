// AdminNotificationsPage — صفحة تُحمَّل عند الحاجة (كانت مضمّنة في App.jsx)
import { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/notifications';
import { Badge, Btn, Card, GenericPage, Tab } from '../../components/ui/kit';
import { IcMail } from '../../utils/icons';
import { colors } from '../../theme/tokens';

const AdminNotificationsPage = () => {
  const [activeTab,     setActiveTab]     = useState(0);
  const [notifTarget,   setNotifTarget]   = useState('all');
  const [notifUserId,   setNotifUserId]   = useState('');
  const [notifTitle,    setNotifTitle]    = useState('');
  const [notifBody,     setNotifBody]     = useState('');
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [log,           setLog]           = useState(null);
  const [logLoading,    setLogLoading]    = useState(false);
  const [users,         setUsers]         = useState([]);
  const [usersLoading,  setUsersLoading]  = useState(false);
  const [usersLoaded,   setUsersLoaded]   = useState(false);

  // Load log when tab 1 is active
  useEffect(() => {
    if (activeTab !== 1) return;
    setLogLoading(true);
    notificationsApi.adminLog()
      .then(r => setLog(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLog([]))
      .finally(() => setLogLoading(false));
  }, [activeTab]);

  // Load users list when "user" target selected
  useEffect(() => {
    if (notifTarget !== 'user' || usersLoaded) return;
    setUsersLoading(true);
    notificationsApi.adminUsers()
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => { setUsersLoading(false); setUsersLoaded(true); });
  }, [notifTarget, usersLoaded]);

  const handleSend = async () => {
    if (!notifTitle.trim()) { setResult({ type: 'error', msg: 'يرجى إدخال عنوان الإشعار' }); return; }
    if (notifTarget === 'user' && !notifUserId) { setResult({ type: 'error', msg: 'يرجى اختيار المستخدم' }); return; }
    setSending(true); setResult(null);
    try {
      const res = await notificationsApi.adminSend({
        target:  notifTarget,
        user_id: notifTarget === 'user' ? notifUserId : undefined,
        title:   notifTitle,
        body:    notifBody || undefined,
      });
      setResult({ type: 'success', msg: `تم الإرسال بنجاح إلى ${res.data.sent} مستخدم` });
      setNotifTitle('');
      setNotifBody('');
    } catch (e) {
      setResult({ type: 'error', msg: e.response?.data?.message || 'حدث خطأ في الإرسال' });
    } finally { setSending(false); }
  };

  const TARGET_OPTIONS = [
    { value: 'all',         label: 'جميع المستخدمين' },
    { value: 'clients',     label: 'العملاء فقط' },
    { value: 'consultants', label: 'المستشارين فقط' },
    { value: 'user',        label: 'مستخدم محدد' },
  ];
  const TARGET_COLORS = { all: 'blue', clients: 'primary', consultants: 'orange', user: 'gray' };

  return (
    <GenericPage title="إدارة الإشعارات">
      <Tab tabs={["إرسال إشعار", "سجل الإشعارات"]} active={activeTab} onChange={v => { setActiveTab(v); setResult(null); }} />
      <Card style={{ marginTop: 16 }}>

        {/* ── Tab 0: إرسال إشعار ── */}
        {activeTab === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* الجمهور */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 10 }}>إرسال إلى:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TARGET_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${notifTarget === opt.value ? colors.primary : colors.grayBorder}`, background: notifTarget === opt.value ? colors.primary + "10" : colors.white, cursor: "pointer", fontSize: 13, fontWeight: notifTarget === opt.value ? 700 : 400, color: notifTarget === opt.value ? colors.primary : colors.gray, transition: "all .15s" }}>
                    <input type="radio" name="notifTo" value={opt.value} checked={notifTarget === opt.value} onChange={() => { setNotifTarget(opt.value); setResult(null); setNotifUserId(''); }} style={{ accentColor: colors.primary }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* اختيار مستخدم محدد */}
            {notifTarget === 'user' && (() => {
              const selectedUser = users.find(u => String(u.id) === String(notifUserId));
              return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>اختر المستخدم</label>
                {usersLoading ? (
                  <div style={{ fontSize: 12, color: colors.gray, padding: "8px 0" }}>جارٍ تحميل المستخدمين...</div>
                ) : usersLoaded && users.length === 0 ? (
                  <div style={{ fontSize: 12, color: colors.red, padding: "8px 0" }}>لا يوجد مستخدمون متاحون في قاعدة البيانات</div>
                ) : (
                  <>
                    <select
                      value={notifUserId}
                      onChange={e => setNotifUserId(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${notifUserId ? colors.primary : colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", color: notifUserId ? colors.ink : colors.gray, outline: "none", background: colors.white }}
                    >
                      <option value="">— اختر مستخدماً —</option>
                      <optgroup label="المستشارون">
                        {users.filter(u => u.role === 'consultant').map(u => (
                          <option key={u.id} value={u.id}>
                            {u.display_name} — {u.email}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="العملاء">
                        {users.filter(u => u.role === 'client').map(u => (
                          <option key={u.id} value={u.id}>
                            {u.display_name} — {u.email}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    {/* بطاقة معلومات المستخدم المختار */}
                    {selectedUser && (
                      <div style={{ padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${selectedUser.role === 'consultant' ? colors.amberLine : colors.primary}`, background: selectedUser.role === 'consultant' ? `${colors.amber}08` : `${colors.primary}08`, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: selectedUser.role === 'consultant' ? colors.amber : colors.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#0E2A3D", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                          {selectedUser.display_name?.[0] || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{selectedUser.display_name}</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: selectedUser.role === 'consultant' ? `${colors.amber}20` : `${colors.primary}20`, color: selectedUser.role === 'consultant' ? colors.amberText : colors.primary }}>
                              {selectedUser.role === 'consultant' ? 'مستشار' : 'عميل'}
                            </span>
                            {!selectedUser.is_active && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: `${colors.red}20`, color: colors.red }}>غير نشط</span>}
                          </div>
                          <div style={{ fontSize: 12, color: colors.gray, display: "flex", flexDirection: "column", gap: 2 }}>
                            <span>{selectedUser.email}</span>
                            {selectedUser.phone   && <span>{selectedUser.phone}</span>}
                            {selectedUser.role === 'client' && selectedUser.rep_name  && <span>ممثل المنظمة: {selectedUser.rep_name}</span>}
                            {selectedUser.role === 'client' && selectedUser.org_type  && <span>نوع المنظمة: {selectedUser.org_type}</span>}
                            {selectedUser.role === 'client' && selectedUser.sector    && <span>القطاع: {selectedUser.sector}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              );
            })()}

            {/* العنوان */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.ink, display: "block", marginBottom: 6 }}>عنوان الإشعار <span style={{ color: colors.red }}>*</span></label>
              <input
                value={notifTitle}
                onChange={e => { setNotifTitle(e.target.value); setResult(null); }}
                placeholder="عنوان واضح ومختصر..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* النص */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.ink, display: "block", marginBottom: 6 }}>نص الإشعار <span style={{ fontSize: 11, color: colors.gray, fontWeight: 400 }}>(اختياري)</span></label>
              <textarea
                value={notifBody}
                onChange={e => setNotifBody(e.target.value)}
                placeholder="محتوى الإشعار..."
                rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* نتيجة الإرسال */}
            {result && (
              <div style={{ padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: result.type === 'success' ? colors.greenLight : colors.redLight, color: result.type === 'success' ? colors.green : colors.red }}>
                {result.msg}
              </div>
            )}

            {/* زر الإرسال */}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleSend} disabled={sending}>
                {sending ? "جارٍ الإرسال..." : "إرسال الآن"}
              </Btn>
            </div>

            {/* ملاحظة */}
            <div style={{ padding: "10px 14px", borderRadius: 8, background: colors.grayLight, fontSize: 12, color: colors.gray, lineHeight: 1.8 }}>
              <strong style={{ color: colors.ink }}>ملاحظة:</strong> سيصل الإشعار فوراً إلى المستخدمين المحددين ويظهر في قائمة إشعاراتهم.
            </div>
          </div>
        )}

        {/* ── Tab 1: سجل الإشعارات ── */}
        {activeTab === 1 && (
          logLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.gray, fontSize: 13 }}>جارٍ تحميل السجل...</div>
          ) : !log || log.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.gray }}>
              <div style={{ marginBottom: 10, color: colors.gray }}><IcMail width={36} height={36}/></div>
              <div style={{ fontSize: 13 }}>لم يتم إرسال أي إشعارات بعد</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["العنوان", "الجمهور", "المرسِل", "المستلمون", "التاريخ"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", background: colors.grayLight, fontSize: 11, fontWeight: 700, color: colors.gray, textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.map((row, i) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}`, background: i % 2 === 0 ? colors.white : "#FBF9F5" }}>
                      <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: colors.ink, maxWidth: 260 }}>
                        <div>{row.title}</div>
                        {row.body && <div style={{ fontSize: 11, color: colors.gray, fontWeight: 400, marginTop: 2 }}>{row.body.length > 60 ? row.body.slice(0, 60) + '…' : row.body}</div>}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <Badge text={row.target_user ?? row.target_label} color={TARGET_COLORS[row.target_type] || 'gray'} small />
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: colors.ink }}>{row.sent_by}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 12, background: colors.blueLight, color: colors.blue, fontWeight: 700, fontSize: 12 }}>{row.recipient_count}</span>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 11, color: colors.gray, whiteSpace: "nowrap" }}>
                        <div>{row.created_at}</div>
                        <div style={{ fontSize: 10, marginTop: 2 }}>{row.time}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </GenericPage>
  );
};

export default AdminNotificationsPage;
