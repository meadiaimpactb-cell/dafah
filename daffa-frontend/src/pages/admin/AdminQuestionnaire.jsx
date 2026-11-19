// AdminQuestionnaire — محرّر استبيانات السياسات (كان مضمّنًا في App.jsx؛ يُحمَّل عند الحاجة)
import React from 'react';
import api from '../../api/axios';
import { Badge, Card } from '../../components/ui/kit';
import { IcBars, IcPencil, IcPlus, IcTrash } from '../../utils/icons';
import { colors } from '../../theme/tokens';

const AdminQuestionnaire = () => {
  // أنواع السياسات من الكتالوج (حزمة الإصدار 3.0 + الإصدار السابق للطلبات القديمة)
  const [policyTypes,    setPolicyTypes]    = React.useState([]);
  const [activePolicyId, setActivePolicyId] = React.useState(null);
  const [sections,      setSections]      = React.useState([]);
  const [activeId,      setActiveId]      = React.useState(null);
  const [questions,     setQuestions]     = React.useState([]);
  const [loadingQ,      setLoadingQ]      = React.useState(false);
  const [toast,         setToast]         = React.useState(null);

  // section modal
  const [secModal,      setSecModal]      = React.useState(false);
  const [secEdit,       setSecEdit]       = React.useState(null); // null=new, obj=edit
  const [secName,       setSecName]       = React.useState("");
  const [secSaving,     setSecSaving]     = React.useState(false);

  // question modal
  const [qModal,        setQModal]        = React.useState(false);
  const [qEdit,         setQEdit]         = React.useState(null);
  const [qForm,         setQForm]         = React.useState({ question: "", type: "single", required: false, hint: "", display_condition: "", optionsText: "", metaText: "" });
  const [qSaving,       setQSaving]       = React.useState(false);

  const TYPE_LABELS = { single: "اختيار واحد", multiple: "اختيار متعدد", yesno: "نعم/لا", text: "نص حر", scale: "مقياس" };
  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // load sections for the active policy
  const loadSections = (policyId) => {
    api.get(`/admin/questionnaire?policy_type_id=${policyId}`).then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setSections(list);
      setActiveId(list.length > 0 ? list[0].id : null);
      setQuestions([]);
    });
  };
  React.useEffect(() => {
    api.get('/admin/content/policies').then(r => {
      setPolicyTypes(Array.isArray(r.data) ? r.data : []);
      const first = r.data.find(p => p.active !== false) || r.data[0];
      if (first) setActivePolicyId(first.id);
    }).catch(() => {});
  }, []);
  React.useEffect(() => { if (activePolicyId) loadSections(activePolicyId); }, [activePolicyId]);
  const activePolicy = policyTypes.find(p => p.id === activePolicyId);
  const policyGroups = policyTypes.reduce((acc, p) => {
    const g = p.active === false ? 'الإصدار السابق (غير متاح للشراء)' : (p.group_name || 'السياسات');
    (acc[g] = acc[g] || []).push(p);
    return acc;
  }, {});

  // load questions when section changes
  React.useEffect(() => {
    if (!activeId) return;
    setLoadingQ(true);
    api.get(`/admin/questionnaire/sections/${activeId}/questions`)
      .then(r => setQuestions(Array.isArray(r.data?.questions) ? r.data.questions : []))
      .finally(() => setLoadingQ(false));
  }, [activeId]);

  // ── Section CRUD ──────────────────────────────────────────────────────────
  const openAddSection  = () => { setSecEdit(null); setSecName(""); setSecModal(true); };
  const openEditSection = (s) => { setSecEdit(s); setSecName(s.name); setSecModal(true); };
  const saveSection = () => {
    if (!secName.trim()) return;
    setSecSaving(true);
    const req = secEdit
      ? api.put(`/admin/questionnaire/sections/${secEdit.id}`, { name: secName })
      : api.post("/admin/questionnaire/sections", { name: secName, policy_type_id: activePolicyId });
    req.then(r => {
      if (secEdit) {
        setSections(prev => prev.map(s => s.id === secEdit.id ? { ...r.data, questions_count: s.questions_count } : s));
      } else {
        setSections(prev => [...prev, r.data]);
        setActiveId(r.data.id);
      }
      setSecModal(false);
      showToast(secEdit ? "تم تعديل القسم" : "تم إضافة القسم");
    }).catch(() => showToast("حدث خطأ", false)).finally(() => setSecSaving(false));
  };
  const deleteSection = (s) => {
    if (!window.confirm(`حذف قسم "${s.name}"؟`)) return;
    api.delete(`/admin/questionnaire/sections/${s.id}`).then(() => {
      const remaining = sections.filter(x => x.id !== s.id);
      setSections(remaining);
      if (activeId === s.id) setActiveId(remaining[0]?.id ?? null);
      showToast("تم حذف القسم");
    }).catch(() => showToast("حدث خطأ", false));
  };

  // ── Question CRUD ─────────────────────────────────────────────────────────
  const openAddQ  = () => { setQEdit(null); setQForm({ question: "", type: "single", required: false, hint: "", display_condition: "", optionsText: "", metaText: "" }); setQModal(true); };
  const openEditQ = (q) => { setQEdit(q); setQForm({ question: q.question, type: q.type, required: q.required, hint: q.hint || "", display_condition: q.display_condition || "", optionsText: q.options ? q.options.join("\n") : "", metaText: q.meta ? JSON.stringify(q.meta, null, 2) : "" }); setQModal(true); };
  const saveQuestion = () => {
    if (!qForm.question.trim()) return;
    setQSaving(true);
    const options = ["single","multiple"].includes(qForm.type)
      ? qForm.optionsText.split("\n").map(s => s.trim()).filter(Boolean)
      : null;
    let meta = null;
    if (qForm.metaText.trim()) {
      try { meta = JSON.parse(qForm.metaText); } catch { showToast("إعدادات JSON غير صالحة", false); setQSaving(false); return; }
    }
    const payload = { question: qForm.question, type: qForm.type, required: qForm.required, hint: qForm.hint || null, display_condition: qForm.display_condition || null, options, meta };
    const req = qEdit
      ? api.put(`/admin/questionnaire/questions/${qEdit.id}`, payload)
      : api.post(`/admin/questionnaire/sections/${activeId}/questions`, payload);
    req.then(r => {
      if (qEdit) {
        setQuestions(prev => prev.map(q => q.id === qEdit.id ? r.data : q));
      } else {
        setQuestions(prev => [...prev, r.data]);
        setSections(prev => prev.map(s => s.id === activeId ? { ...s, questions_count: (s.questions_count || 0) + 1 } : s));
      }
      setQModal(false);
      showToast(qEdit ? "تم تعديل السؤال" : "تم إضافة السؤال");
    }).catch(() => showToast("حدث خطأ", false)).finally(() => setQSaving(false));
  };
  const deleteQuestion = (q) => {
    if (!window.confirm(`حذف السؤال؟`)) return;
    api.delete(`/admin/questionnaire/questions/${q.id}`).then(() => {
      setQuestions(prev => prev.filter(x => x.id !== q.id));
      setSections(prev => prev.map(s => s.id === activeId ? { ...s, questions_count: Math.max(0, (s.questions_count || 1) - 1) } : s));
      showToast("تم حذف السؤال");
    }).catch(() => showToast("حدث خطأ", false));
  };

  const activeSection = sections.find(s => s.id === activeId);
  const inputS = { width: "100%", padding: "9px 12px", border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", direction: "rtl", boxSizing: "border-box" };

  return (
    <div className="animate-in">
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? colors.primary : colors.red, color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(14,42,61,0.2)" }}>{toast.msg}</div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>بناء الاستبيانات</h2>

      {/* Policy Type Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>السياسة:</label>
        <select value={activePolicyId || ""} onChange={e => setActivePolicyId(Number(e.target.value))}
          style={{ minWidth: 320, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
          {Object.entries(policyGroups).map(([g, items]) => (
            <optgroup key={g} label={g}>
              {items.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} — ` : ""}{p.name}</option>)}
            </optgroup>
          ))}
        </select>
        {activePolicy?.active === false && <Badge text="إصدار سابق" color="orange" small />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "var(--g-240-main)", gap: 16 }}>
        {/* Sections sidebar */}
        <Card style={{ padding: 12 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>أقسام {activePolicy?.name}</h4>
          {sections.map(s => (
            <div key={s.id} onClick={() => setActiveId(s.id)} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: activeId === s.id ? `${colors.primary}10` : "transparent", borderRight: activeId === s.id ? `3px solid ${colors.primary}` : "3px solid transparent", fontSize: 12, fontWeight: activeId === s.id ? 600 : 400, cursor: "pointer", color: activeId === s.id ? colors.primary : colors.gray, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcBars width={12} height={12}/> {s.name}</span>
              <span style={{ display: "flex", gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); openEditSection(s); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray, padding: 2, display: "flex" }}><IcPencil width={11} height={11}/></button>
                <button onClick={e => { e.stopPropagation(); deleteSection(s); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, padding: 2, display: "flex" }}><IcTrash width={11} height={11}/></button>
              </span>
            </div>
          ))}
          <button onClick={openAddSection} style={{ marginTop: 8, width: "100%", padding: "7px 0", background: "none", border: `1.5px dashed ${colors.primary}`, borderRadius: 8, color: colors.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ إضافة قسم</button>
        </Card>

        {/* Questions */}
        <Card>
          {!activeSection ? (
            <div style={{ padding: 40, textAlign: "center", color: colors.gray, fontSize: 13 }}>اختر قسماً أو أضف قسماً جديداً</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{activeSection.name} ({questions.length} أسئلة)</h3>
                <button onClick={openAddQ} style={{ padding: "7px 16px", background: colors.amber, color: "#0E2A3D", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}><IcPlus width={13} height={13}/> إضافة سؤال</button>
              </div>

              {loadingQ ? (
                <div style={{ padding: 30, textAlign: "center", color: colors.gray, fontSize: 12 }}>جارٍ التحميل…</div>
              ) : questions.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: colors.gray, fontSize: 13 }}>لا توجد أسئلة في هذا القسم بعد</div>
              ) : (
                questions.map(q => (
                  <div key={q.id} style={{ padding: 16, border: `1.5px solid ${colors.grayBorder}`, borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: colors.gray }}><IcBars width={14} height={14}/></span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{q.question}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge text={TYPE_LABELS[q.type] || q.type} color="primary" small />
                        {q.required && <Badge text="مطلوب" color="red" small />}
                        <button onClick={() => openEditQ(q)} title="تعديل" style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray, padding: 4, display: "flex", alignItems: "center", borderRadius: 6, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = colors.grayLight} onMouseLeave={e => e.currentTarget.style.background = "none"}><IcPencil width={15} height={15}/></button>
                        <button onClick={() => deleteQuestion(q)} title="حذف" style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, padding: 4, display: "flex", alignItems: "center", borderRadius: 6, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = colors.redLight} onMouseLeave={e => e.currentTarget.style.background = "none"}><IcTrash width={15} height={15}/></button>
                      </div>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {q.options.map((o, i) => <span key={i} style={{ fontSize: 11, background: colors.grayLight, borderRadius: 4, padding: "2px 7px", color: colors.gray }}>{o}</span>)}
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 11, color: colors.gray }}>
                      {q.meta?.show_if ? `يظهر بشرط إجابة السؤال ${q.meta.show_if.q}` : q.display_condition ? `شرط: ${q.display_condition}` : "يظهر دائماً"}{q.meta?.input ? ` | إدخال: ${q.meta.input}` : ""}{q.meta?.fields ? ` | ${q.meta.fields.length} خانات` : ""}{q.hint ? ` | تلميح: ${q.hint}` : ""}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </Card>
      </div>

      {/* Section Modal */}
      {secModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(14,42,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 380, direction: "rtl", boxShadow: "0 20px 60px rgba(14,42,61,0.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>{secEdit ? "تعديل القسم" : "إضافة قسم جديد"}</h3>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>اسم القسم</label>
            <input value={secName} onChange={e => setSecName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveSection()} placeholder="مثال: التوظيف" style={{ ...inputS, marginBottom: 20 }} autoFocus />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setSecModal(false)} style={{ padding: "9px 20px", background: "#F3EFE8", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
              <button onClick={saveSection} disabled={secSaving || !secName.trim()} style={{ padding: "9px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{secSaving ? "جارٍ الحفظ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {qModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(14,42,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 480, direction: "rtl", boxShadow: "0 20px 60px rgba(14,42,61,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 20 }}>{qEdit ? "تعديل السؤال" : "إضافة سؤال جديد"}</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>نص السؤال *</label>
              <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} rows={2} placeholder="اكتب السؤال هنا…" style={{ ...inputS, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>نوع السؤال *</label>
                <select value={qForm.type} onChange={e => setQForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputS }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={qForm.required} onChange={e => setQForm(f => ({ ...f, required: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  <span>سؤال مطلوب</span>
                </label>
              </div>
            </div>

            {["single","multiple"].includes(qForm.type) && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>الخيارات (سطر لكل خيار) *</label>
                <textarea value={qForm.optionsText} onChange={e => setQForm(f => ({ ...f, optionsText: e.target.value }))} rows={4} placeholder={"خيار 1\nخيار 2\nخيار 3"} style={{ ...inputS, resize: "vertical" }} />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>تلميح (اختياري)</label>
              <input value={qForm.hint} onChange={e => setQForm(f => ({ ...f, hint: e.target.value }))} placeholder="نص مساعد يظهر للمستخدم" style={{ ...inputS }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>شرط العرض (اختياري)</label>
              <input value={qForm.display_condition} onChange={e => setQForm(f => ({ ...f, display_condition: e.target.value }))} placeholder="مثال: إذا كانت إجابة السؤال السابق نعم" style={{ ...inputS }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334452", display: "block", marginBottom: 6 }}>إعدادات متقدمة (JSON — اختياري)</label>
              <textarea value={qForm.metaText} onChange={e => setQForm(f => ({ ...f, metaText: e.target.value }))} rows={4} dir="ltr" placeholder={'{"input":"number","min":0,"unit":"ريال"} / {"show_if":{"q":501,"in":["نعم"]}} / {"other":{"options":["أخرى (حدّدها أدناه)"],"label":"اذكر الجهة"}}'} style={{ ...inputS, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
              <div style={{ fontSize: 11, color: "#8C97A3", marginTop: 4 }}>المفاتيح: input (date/number) min max integer unit · exclusive · other · show_if · fields · checks · force · info</div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setQModal(false)} style={{ padding: "9px 20px", background: "#F3EFE8", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
              <button onClick={saveQuestion} disabled={qSaving || !qForm.question.trim()} style={{ padding: "9px 20px", background: colors.amber, color: "#0E2A3D", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{qSaving ? "جارٍ الحفظ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionnaire;
