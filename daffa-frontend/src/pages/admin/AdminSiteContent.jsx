import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const colors = {
  teal: "#1A6B7C", tealDark: "#145A68", tealCard: "#1E5E6E",
  orange: "#E8713A", orangeLight: "#FDF0E8",
  bg: "#F8FAFB", white: "#FFFFFF",
  gray: "#6B7280", grayLight: "#F3F4F6", grayBorder: "#E5E7EB",
  green: "#10B981", red: "#EF4444",
};

const GROUP_LABELS = {
  landing:  "الرئيسية",
  about:    "عن دفة",
  services: "الخدمات",
  pricing:  "الأسعار",
  contact:  "تواصل معنا",
  footer:   "الفوتر",
};

const GROUP_ORDER = ["landing", "about", "services", "pricing", "contact", "footer"];

export default function AdminSiteContent() {
  const [grouped, setGrouped]   = useState({});
  const [edits, setEdits]       = useState({});
  const [saving, setSaving]     = useState({});
  const [saved, setSaved]       = useState({});
  const [activeTab, setActiveTab] = useState("landing");
  const [loading, setLoading]   = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/site-content")
      .then(r => {
        setGrouped(r.data);
        const initEdits = {};
        Object.values(r.data).forEach(items =>
          items.forEach(item => { initEdits[item.key] = item.value ?? ""; })
        );
        setEdits(initEdits);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => {
    setEdits(e => ({ ...e, [key]: val }));
    setSaved(s => ({ ...s, [key]: false }));
  };

  const saveOne = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await api.put(`/admin/site-content/${key}`, { value: edits[key] });
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const saveGroup = async (group) => {
    const items = (grouped[group] || []).map(item => ({
      key: item.key,
      value: edits[item.key] ?? "",
    }));
    setBulkSaving(true);
    try {
      await api.post("/admin/site-content/bulk", { items });
      const newSaved = {};
      items.forEach(i => { newSaved[i.key] = true; });
      setSaved(s => ({ ...s, ...newSaved }));
      setTimeout(() => {
        setSaved(s => {
          const copy = { ...s };
          items.forEach(i => { delete copy[i.key]; });
          return copy;
        });
      }, 2000);
    } finally {
      setBulkSaving(false);
    }
  };

  const isDirty = (group) =>
    (grouped[group] || []).some(item => (edits[item.key] ?? "") !== (item.value ?? ""));

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: colors.gray }}>جارٍ التحميل…</div>
  );

  const currentItems = grouped[activeTab] || [];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.tealDark, marginBottom: 4 }}>محتوى موقع الزائر</h2>
        <p style={{ fontSize: 13, color: colors.gray }}>تحكم كامل في نصوص وبيانات جميع صفحات الموقع العامة</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {GROUP_ORDER.map(g => (
          <button
            key={g}
            onClick={() => setActiveTab(g)}
            style={{
              padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              fontFamily: "'Cairo', sans-serif", cursor: "pointer", border: "none",
              background: activeTab === g ? colors.teal : colors.grayLight,
              color: activeTab === g ? "white" : colors.tealDark,
              position: "relative",
            }}
          >
            {GROUP_LABELS[g] || g}
            {isDirty(g) && activeTab !== g && (
              <span style={{
                position: "absolute", top: 4, left: 4, width: 7, height: 7,
                borderRadius: "50%", background: colors.orange,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Save All button for current tab */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => saveGroup(activeTab)}
          disabled={bulkSaving || !isDirty(activeTab)}
          style={{
            padding: "10px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            fontFamily: "'Cairo', sans-serif", cursor: isDirty(activeTab) ? "pointer" : "default",
            border: "none", background: isDirty(activeTab) ? colors.orange : colors.grayBorder,
            color: isDirty(activeTab) ? "white" : colors.gray,
            transition: "all 0.2s",
          }}
        >
          {bulkSaving ? "جارٍ الحفظ…" : `حفظ جميع تعديلات ${GROUP_LABELS[activeTab] || activeTab}`}
        </button>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {currentItems.map(item => {
          const val = edits[item.key] ?? "";
          const isChanged = val !== (item.value ?? "");
          const isSaved   = saved[item.key];
          const isSaving  = saving[item.key];

          return (
            <div
              key={item.key}
              style={{
                background: "white", borderRadius: 12, padding: "16px 20px",
                border: `1.5px solid ${isSaved ? colors.green : isChanged ? colors.orange : colors.grayBorder}`,
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, display: "block" }}>
                    {item.label}
                  </label>
                </div>
                <button
                  onClick={() => saveOne(item.key)}
                  disabled={isSaving || !isChanged}
                  style={{
                    padding: "6px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    fontFamily: "'Cairo', sans-serif", cursor: isChanged ? "pointer" : "default",
                    border: "none",
                    background: isSaved ? colors.green : isChanged ? colors.teal : colors.grayBorder,
                    color: isChanged || isSaved ? "white" : colors.gray,
                    flexShrink: 0, marginRight: 12,
                    transition: "all 0.2s",
                  }}
                >
                  {isSaving ? "…" : isSaved ? "✓ تم" : "حفظ"}
                </button>
              </div>

              {item.type === "textarea" ? (
                <textarea
                  value={val}
                  onChange={e => handleChange(item.key, e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: `1.5px solid ${colors.grayBorder}`, fontSize: 13,
                    fontFamily: "'Cairo', sans-serif", direction: "rtl",
                    resize: "vertical", lineHeight: 1.8, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <input
                  type={item.type === "url" ? "url" : "text"}
                  value={val}
                  onChange={e => handleChange(item.key, e.target.value)}
                  dir={item.type === "url" ? "ltr" : "rtl"}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: `1.5px solid ${colors.grayBorder}`, fontSize: 13,
                    fontFamily: "'Cairo', sans-serif", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {currentItems.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: colors.gray, fontSize: 13 }}>
          لا توجد عناصر في هذه الصفحة
        </div>
      )}
    </div>
  );
}
