import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { asObject } from '../../utils/apiData';

const colors = {
  primary: "#235D7F", ink: "#0E2A3D",
  orange: "#EF6A2C", amber: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F',
  white: "#FFFFFF",
  gray: "#5E6B78", grayLight: "#F3EFE8", grayBorder: "#E8E3DA",
  green: "#0E9F74",
};

const TABS = ["الإعدادات العامة", "البريد الإلكتروني", "الدفع", "الأمان", "النسخ الاحتياطي", "API"];

// which DB group maps to which tab index
const TAB_GROUPS = ["system", "email", "payment", "security", null, null];

export default function AdminSettings() {
  const [grouped, setGrouped]     = useState({});
  const [edits, setEdits]         = useState({});
  const [active, setActive]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/site-content")
      .then(r => {
        r.data = asObject(r.data, {});
        setGrouped(r.data);
        const init = {};
        ["system", "email", "payment", "security"].forEach(g => {
          (r.data[g] || []).forEach(item => { init[item.key] = item.value ?? ""; });
        });
        setEdits(init);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => {
    setEdits(e => ({ ...e, [key]: val }));
    setSaved(false);
  };

  const saveGroup = async () => {
    const group = TAB_GROUPS[active];
    if (!group) return;
    const items = (grouped[group] || []).map(item => ({
      key: item.key, value: edits[item.key] ?? "",
    }));
    setSaving(true);
    try {
      await api.post("/admin/site-content/bulk", { items });
      // update local baseline so isDirty resets
      setGrouped(prev => ({
        ...prev,
        [group]: (prev[group] || []).map(item => ({
          ...item, value: edits[item.key] ?? item.value,
        })),
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: colors.gray, fontFamily: "inherit" }}>
      جارٍ التحميل…
    </div>
  );

  const group     = TAB_GROUPS[active];
  const items     = group ? (grouped[group] || []) : [];
  const hasFields = items.length > 0;

  return (
    <div style={{ fontFamily: "inherit", direction: "rtl" }}>

      {/* Tab bar — same visual as App.jsx Tab component */}
      <div style={{ display: "flex", gap: 2, background: colors.grayLight, borderRadius: 12, padding: 3, overflowX: "auto", marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setSaved(false); }}
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13,
              fontWeight: active === i ? 700 : 500, fontFamily: "inherit",
              background: active === i ? "white" : "transparent",
              color: active === i ? colors.primary : colors.gray,
              border: "none", cursor: "pointer", transition: "all 0.2s",
              boxShadow: active === i ? "0 1px 3px rgba(14,42,61,0.08)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(14,42,61,0.06)" }}>
        {hasFields ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 16 }}>
              {items.map(item => item.type === "toggle" ? (
                <label key={item.key} data-setting={item.key} style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, cursor: "pointer" }}>
                  <span>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: colors.ink }}>{item.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: colors.gray, marginTop: 4, lineHeight: 1.7 }}>
                      {edits[item.key] === "0" ? "مخفي عن جميع المستخدمين." : "ظاهر للمستخدمين."}{item.key === "demo_fill_enabled" ? " يملأ النموذج ببيانات تجريبية للاختبار؛ أوقفه عندما تصبح المنصة جاهزة للعملاء الفعليين. يسري على الاستراتيجي والتشغيلي والسياسات." : ""}
                    </span>
                  </span>
                  <span style={{ position: "relative", width: 46, height: 26, flexShrink: 0 }}>
                    <input type="checkbox" role="switch" aria-label={item.label} checked={edits[item.key] !== "0"} onChange={e => handleChange(item.key, e.target.checked ? "1" : "0")}
                      style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }} />
                    <span aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0, borderRadius: 999, background: edits[item.key] !== "0" ? colors.green : colors.grayBorder, transition: "background 0.2s" }} />
                    <span aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", top: 3, right: edits[item.key] !== "0" ? 3 : 23, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "right 0.2s" }} />
                  </span>
                </label>
              ) : (
                <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={edits[item.key] ?? ""}
                    onChange={e => handleChange(item.key, e.target.value)}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      border: `1.5px solid ${colors.grayBorder}`,
                      fontSize: 13, fontFamily: "inherit",
                      direction: "rtl", outline: "none",
                      background: colors.white,
                    }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  onClick={saveGroup}
                  disabled={saving}
                  style={{
                    padding: "11px 32px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    fontFamily: "inherit", cursor: saving ? "default" : "pointer",
                    border: "none",
                    background: saved ? colors.green : colors.amber,
                    color: "#0E2A3D", transition: "background 0.3s",
                  }}
                >
                  {saving ? "جارٍ الحفظ…" : saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", color: colors.gray, fontSize: 13 }}>
            هذا القسم غير متاح حالياً
          </div>
        )}
      </div>
    </div>
  );
}
