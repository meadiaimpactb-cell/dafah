import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const colors = {
  teal: "#1A6B7C", tealDark: "#145A68",
  orange: "#E8713A",
  white: "#FFFFFF",
  gray: "#6B7280", grayLight: "#F3F4F6", grayBorder: "#E5E7EB",
  green: "#10B981",
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
    <div style={{ padding: 60, textAlign: "center", color: colors.gray, fontFamily: "'Cairo',sans-serif" }}>
      جارٍ التحميل…
    </div>
  );

  const group     = TAB_GROUPS[active];
  const items     = group ? (grouped[group] || []) : [];
  const hasFields = items.length > 0;

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>

      {/* Tab bar — same visual as App.jsx Tab component */}
      <div style={{ display: "flex", gap: 2, background: colors.grayLight, borderRadius: 12, padding: 3, overflowX: "auto", marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setSaved(false); }}
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13,
              fontWeight: active === i ? 700 : 500, fontFamily: "'Cairo', sans-serif",
              background: active === i ? "white" : "transparent",
              color: active === i ? colors.teal : colors.gray,
              border: "none", cursor: "pointer", transition: "all 0.2s",
              boxShadow: active === i ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {hasFields ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {items.map(item => (
                <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark }}>
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={edits[item.key] ?? ""}
                    onChange={e => handleChange(item.key, e.target.value)}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      border: `1.5px solid ${colors.grayBorder}`,
                      fontSize: 13, fontFamily: "'Cairo', sans-serif",
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
                    fontFamily: "'Cairo', sans-serif", cursor: saving ? "default" : "pointer",
                    border: "none",
                    background: saved ? colors.green : colors.orange,
                    color: "white", transition: "background 0.3s",
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
