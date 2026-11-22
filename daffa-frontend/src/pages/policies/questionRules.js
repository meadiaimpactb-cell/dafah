// قواعد أسئلة استبيانات السياسات — نسخة الواجهة (مطابقة لـ App\Support\QuestionRules في الخادم)
// meta: input(date|number|phone) min max integer unit · no_negative · exclusive[] · other{options,label,input,placeholder,optional}
//       show_if{q,in|not_in|has|not_has} | {any:[..]} | {all:[..]}
//       fields[{key,label,input,min,max,integer,unit,options,required,show_if_opt}]
//       checks[{lte:[a,b]}|{eq_product:[a,b,c]}|{sum_eq:[[keys],total]}|{lte_q:[field,qid,qfield?]}] (+msg)
//       force{q?,in?,options} · require{all,or_any,msg} · conflicts[{q,in|has|not_has,self_in|self_has,msg}] · info{title,headers,rows}

const AR = '٠١٢٣٤٥٦٧٨٩';
const FA = '۰۱۲۳۴۵۶۷۸۹';
export const toLatinDigits = (s) => String(s ?? '')
  .replace(/[٠-٩]/g, d => AR.indexOf(d))
  .replace(/[۰-۹]/g, d => FA.indexOf(d))
  .replace(/٫/g, '.')
  .replace(/−/g, '-');

export const num = (v) => {
  if (v === null || v === undefined) return null;
  const s = toLatinDigits(v).replace(/[,٬\s%]|ريال/g, '').trim();
  if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
};

export const filled = (v) => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '';

const asArr = (v) => Array.isArray(v) ? v : (filled(v) ? [String(v)] : []);
const meta = (q) => (q && q.meta && typeof q.meta === 'object') ? q.meta : {};

/** نص حر يحوي رقمًا سالبًا (مثل «-100 ريال» أو «- 5 أيام») */
export const hasNegative = (raw) => /(^|[^\p{L}\p{N}])-\s*\d/u.test(toLatinDigits(raw));

/** شرط واحد {q, in|not_in|has|not_has} أو مركّب {any|all} */
export const cond = (c, answers) => {
  if (!c) return true;
  if (c.any) return c.any.some(s => cond(s, answers));
  if (c.all) return c.all.every(s => cond(s, answers));
  if (!c.q) return true;
  const v = answers?.[`q${c.q}`];
  if (c.in)      return !Array.isArray(v) && c.in.includes(String(v));
  if (c.not_in)  return !filled(v) || (!Array.isArray(v) && !c.not_in.includes(String(v)));
  const arr = asArr(v);
  if (c.has)     return arr.some(x => c.has.includes(x));
  if (c.not_has) return !arr.some(x => c.not_has.includes(x));
  return true;
};

/** هل يظهر السؤال بحسب إجابات الأسئلة الأخرى؟ */
export const isVisible = (q, answers) => cond(meta(q).show_if, answers);

/** الخيارات المثبّتة إلزاميًا */
export const forcedOptions = (q, answers) => {
  const f = meta(q).force;
  if (!f || !f.options?.length) return [];
  if (f.q) {
    const arr = asArr(answers?.[`q${f.q}`]);
    if (f.in && !arr.some(x => f.in.includes(x))) return [];
  }
  return f.options;
};

/** خانات السؤال المركّب الظاهرة حاليًا */
export const visibleFields = (q, answers) => (meta(q).fields || []).filter(f => {
  if (!f.show_if_opt) return true;
  const arr = asArr(answers?.[`q${f.show_if_opt.q}`]);
  return arr.some(x => (f.show_if_opt.has || []).includes(x));
});

const checkNumber = (raw, spec, label = '') => {
  const n = num(raw); const pfx = label ? `«${label}»: ` : '';
  const unit = spec.unit ? ` ${spec.unit}` : '';
  if (n === null) return `${pfx}أدخل رقمًا صحيحًا`;
  if (spec.min === 0 && n < 0) return `${pfx}لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة تساوي صفرًا أو أكثر`;
  if (spec.integer && !Number.isInteger(n)) return `${pfx}أدخل عددًا صحيحًا بلا كسور`;
  if (spec.min !== undefined && n < spec.min) return `${pfx}لا يمكن أن تقل القيمة عن ${spec.min}${unit}`;
  if (spec.max !== undefined && n > spec.max) return `${pfx}لا يمكن أن تزيد القيمة على ${spec.max}${unit}`;
  return null;
};
const checkDate = (raw) => {
  const s = toLatinDigits(raw).trim(); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 'أدخل تاريخًا صحيحًا';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return (d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]) ? null : 'أدخل تاريخًا صحيحًا';
};
const checkPhone = (raw, spec) => {
  const s = String(raw ?? '').trim().replace(/[٠-٩]/g, d => AR.indexOf(d));
  const digits = s.replace(/\D/g, '');
  if (!/^[\d\s+\-()]+$/.test(s) || digits.length < 3 || digits.length > 15) return spec.msg || 'أدخل رقم الاتصال أو رقم التحويلة بالأرقام';
  return null;
};

const otherNum = (answers, qid, field) => field
  ? num((answers?.[`q${qid}__parts`] || {})[field])
  : num(answers?.[`q${qid}`]);

const conflictMsg = (m, value, answers) => {
  const mine = asArr(value);
  for (const c of m.conflicts || []) {
    const selfHit = c.self_in ? (!Array.isArray(value) && c.self_in.includes(String(value)))
      : c.self_has ? mine.some(x => c.self_has.includes(x)) : true;
    if (!selfHit) continue;
    if (!filled(answers?.[`q${c.q}`])) continue;
    const { q, in: i, not_in, has, not_has } = c;
    if (cond({ q, in: i, not_in, has, not_has }, answers)) return c.msg || 'هذه الإجابة تتعارض مع إجابة سابقة';
  }
  return null;
};

/** يقيّم سؤالًا: {status:'ok'|'missing'|'invalid'|'hidden', msg} */
export const evaluate = (q, answers) => {
  const m = meta(q);
  if (!isVisible(q, answers)) return { status: 'hidden', msg: null };
  const key = `q${q.id}`; const value = answers?.[key]; const req = !!q.required;

  if (m.fields?.length) {
    const parts = (answers?.[`${key}__parts`] && typeof answers[`${key}__parts`] === 'object') ? answers[`${key}__parts`] : {};
    let missing = false; let any = false;
    for (const f of visibleFields(q, answers)) {
      const pv = parts[f.key];
      if (!filled(pv)) { if (f.required !== false) missing = true; continue; }
      any = true;
      const input = f.input || 'text';
      if (input === 'number') { const e = checkNumber(pv, f, f.label); if (e) return { status: 'invalid', msg: e }; }
      if (input === 'date')   { const e = checkDate(pv); if (e) return { status: 'invalid', msg: `${f.label}: ${e}` }; }
      if (input === 'phone')  { const e = checkPhone(pv, f); if (e) return { status: 'invalid', msg: `${f.label}: ${e}` }; }
      if (input === 'text' && hasNegative(pv)) return { status: 'invalid', msg: `«${f.label}»: لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة صحيحة` };
    }
    if (missing) {
      if (req) return { status: 'missing', msg: 'أكمل جميع الخانات المطلوبة' };
      if (any) return { status: 'invalid', msg: 'أكمل بقية خانات هذا السؤال أو اتركها كلها فارغة' };
      return { status: 'ok', msg: null };
    }
    // الفحوص المتقاطعة على الخانات الظاهرة فقط (خانة أُخفيت بتغيير إجابة سابقة لا تُحتسب)
    const vis = new Set(visibleFields(q, answers).map(f => f.key));
    const pv = k => (vis.has(k) ? num(parts[k]) : null);
    for (const c of m.checks || []) {
      if (c.lte) { const [a, b] = c.lte; const na = pv(a), nb = pv(b); if (na !== null && nb !== null && na > nb) return { status: 'invalid', msg: c.msg || 'القيم متعارضة' }; }
      if (c.eq_product) { const [a, b, cc] = c.eq_product; const na = pv(a), nb = pv(b), nc = pv(cc); if (na !== null && nb !== null && nc !== null && Math.abs(na - nb * nc) > 0.01) return { status: 'invalid', msg: c.msg || 'القيم غير متسقة' }; }
      if (c.sum_eq) {
        const [keys, total] = c.sum_eq; const vals = keys.map(pv);
        if (vals.every(x => x !== null) && Math.abs(vals.reduce((s, x) => s + x, 0) - total) > 0.01) return { status: 'invalid', msg: c.msg || `مجموع القيم يجب أن يساوي ${total}` };
      }
      if (c.lte_q) { const [a, qid, qf] = c.lte_q; const na = pv(a), nb = otherNum(answers, qid, qf); if (na !== null && nb !== null && na > nb) return { status: 'invalid', msg: c.msg || 'القيمة تتجاوز الحد المرتبط بها' }; }
    }
    return { status: 'ok', msg: null };
  }

  if (!filled(value)) return req ? { status: 'missing', msg: 'هذا السؤال مطلوب' } : { status: 'ok', msg: null };

  if (q.type === 'multiple') {
    const vals = Array.isArray(value) ? value : [];
    const ex = vals.filter(v => (m.exclusive || []).includes(v));
    if (ex.length && vals.length > 1) return { status: 'invalid', msg: `لا يمكن الجمع بين «${ex[0]}» وخيارات أخرى` };
    const forced = forcedOptions(q, answers);
    if (forced.length && forced.some(o => !vals.includes(o))) return { status: 'invalid', msg: `الخيارات الإلزامية يجب أن تبقى محددة: ${forced.join('، ')}` };
    const r = m.require;
    if (r?.all?.length) {
      const alt = vals.some(v => (r.or_any || []).includes(v));
      if (!alt && r.all.some(o => !vals.includes(o))) return { status: 'invalid', msg: r.msg || `يجب أن يشمل الاختيار: ${r.all.join('، ')}` };
    }
  }
  if (q.type === 'text') {
    const input = m.input || 'text';
    if (input === 'number') { const e = checkNumber(value, m); if (e) return { status: 'invalid', msg: e }; }
    if (input === 'date')   { const e = checkDate(value); if (e) return { status: 'invalid', msg: e }; }
    if (input === 'phone')  { const e = checkPhone(value, m); if (e) return { status: 'invalid', msg: e }; }
    if (input === 'text' && m.no_negative && hasNegative(value)) return { status: 'invalid', msg: 'لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة صحيحة' };
  }
  if (m.other?.options?.length) {
    const chosen = Array.isArray(value) ? value.some(v => m.other.options.includes(v)) : m.other.options.includes(String(value));
    if (chosen) {
      const ov = answers?.[`${key}__other`];
      if (!filled(ov)) {
        if (!m.other.optional) return { status: 'missing', msg: `${m.other.label || 'حدّد المقصود بـ«أخرى»'} — مطلوب` };
      } else {
        const oi = m.other.input || 'text';
        if (oi === 'date')   { const e = checkDate(ov); if (e) return { status: 'invalid', msg: e }; }
        if (oi === 'number') { const e = checkNumber(ov, m.other, m.other.label); if (e) return { status: 'invalid', msg: e }; }
        if (oi === 'text' && hasNegative(ov)) return { status: 'invalid', msg: `«${m.other.label}»: لا يمكن أن تكون هذه القيمة سالبة` };
      }
    }
  }
  const cm = conflictMsg(m, value, answers);
  if (cm) return { status: 'invalid', msg: cm };
  return { status: 'ok', msg: null };
};

/** تبديل خيار في الاختيار المتعدد مع احترام الخيارات الحصرية والإلزامية */
export const toggleMultiple = (q, answers, option) => {
  const m = meta(q); const vals = Array.isArray(answers?.[`q${q.id}`]) ? answers[`q${q.id}`] : [];
  const forced = forcedOptions(q, answers); const excl = m.exclusive || [];
  if (forced.includes(option)) return vals.includes(option) ? vals : [...vals, option];
  if (vals.includes(option)) return vals.filter(x => x !== option);
  if (excl.includes(option)) return [option];               // خيار النفي يُلغي البقية
  return [...vals.filter(x => !excl.includes(x)), option];   // أي اختيار يُلغي خيار النفي
};

/** النص المجمّع لسؤال مركّب (يُحفظ في q{id} ليُعرض في الوثيقة ولوحة المستشار) */
export const assembleParts = (q, answers, parts) => visibleFields(q, answers)
  .filter(f => filled(parts?.[f.key]))
  .map(f => `${f.label}: ${String(parts[f.key]).trim()}${f.unit && !/ريال|%/.test(f.label) ? ` ${f.unit}` : ''}`)
  .join('؛ ');

/** تنظيف الإجابات قبل الحفظ: حذف إجابات الأسئلة المخفية وتوضيحات «أخرى» غير المختارة */
export const pruneAnswers = (questions, answers) => {
  const out = { ...answers };
  for (const q of questions) {
    const key = `q${q.id}`; const m = meta(q);
    if (!isVisible(q, answers)) { delete out[key]; delete out[`${key}__other`]; delete out[`${key}__parts`]; continue; }
    if (m.other?.options?.length) {
      const v = answers[key];
      const chosen = Array.isArray(v) ? v.some(x => m.other.options.includes(x)) : m.other.options.includes(String(v ?? ''));
      if (!chosen) delete out[`${key}__other`];
    }
    if (m.fields?.length) {
      const vis = new Set(visibleFields(q, answers).map(f => f.key));
      const parts = Object.fromEntries(Object.entries(out[`${key}__parts`] || {}).filter(([k]) => vis.has(k)));
      out[`${key}__parts`] = parts;
      out[key] = assembleParts(q, answers, parts);
    }
  }
  return out;
};

/** ملخص الاكتمال: الأسئلة الظاهرة فقط */
export const summarize = (sections, answers) => {
  const qs = (sections || []).flatMap(s => s.questions || []).filter(q => isVisible(q, answers));
  const problems = [];
  let answered = 0;
  for (const q of qs) {
    const r = evaluate(q, answers);
    const has = meta(q).fields?.length ? r.status !== 'missing' : filled(answers?.[`q${q.id}`]);
    if (has && r.status === 'ok') answered++;
    if (r.status !== 'ok' && (q.required || r.status === 'invalid')) problems.push({ q: q.id, msg: r.msg });
  }
  return { total: qs.length, answered, problems };
};
