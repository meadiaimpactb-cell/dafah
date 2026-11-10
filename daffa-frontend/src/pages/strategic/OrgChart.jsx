import React from 'react';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };
const norm = s => (s || '').replace(/\s+/g, ' ').trim();

/**
 * يبني شجرة التبعية من الجدول: كل وظيفة تحت مسؤولها المباشر في «يتبع لـ» عبر جميع المستويات.
 * - «—» أو فراغ: لا مسؤول أعلى داخل الخريطة.
 * - مسؤول غير موجود كصف (مثل «مجلس الإدارة»): يُعرض جهةً عليا مرة واحدة.
 * - المسمى المكرر، والتبعية الذاتية أو الدائرية: تنبيه عند الصف بدل رسم تبعية غير صحيحة.
 */
export function buildOrgTree(positions) {
  const NONE = new Set(['', '—', '-', '–', 'لا يوجد', 'لا أحد']);
  const rows = positions.map((p, i) => ({ i, title: norm(p.title), dept: norm(p.dept), manager: NONE.has(norm(p.reports_to)) ? '' : norm(p.reports_to) }));
  const issues = {};
  const byTitle = {};
  rows.forEach(r => { if (r.title) (byTitle[r.title] = byTitle[r.title] || []).push(r); });

  const valid = rows.filter(r => r.title);
  // المسميات المكررة: تُرسم الأولى فقط
  Object.values(byTitle).forEach(list => {
    if (list.length > 1) list.slice(1).forEach(r => { issues[r.i] = `المسمى «${r.title}» مكرر؛ ميّز المسميات حتى تُحدَّد التبعية بدقة.`; });
  });
  valid.forEach(r => {
    if (issues[r.i]) return;
    if (r.manager && r.manager === r.title) issues[r.i] = 'لا يمكن أن تتبع الوظيفة نفسها؛ صحّح «يتبع لـ».';
    else if (r.manager && byTitle[r.manager]?.length > 1) issues[r.i] = `المسؤول «${r.manager}» مكرر في الجدول، فلا يمكن تحديد التبعية؛ ميّز المسميات.`;
  });

  // التبعية الدائرية
  const parentOf = r => (r.manager && byTitle[r.manager]?.length === 1 ? byTitle[r.manager][0] : null);
  valid.forEach(r => {
    if (issues[r.i]) return;
    const seen = [r];
    let cur = parentOf(r);
    while (cur && !issues[cur.i]) {
      if (cur === r) {
        const chain = seen.map(x => x.title).concat(r.title).join(' ← ');
        seen.forEach(x => { issues[x.i] = `تبعية دائرية: ${chain}. صحّح «يتبع لـ» لإحدى هذه الوظائف.`; });
        break;
      }
      if (seen.includes(cur)) break;
      seen.push(cur);
      cur = parentOf(cur);
    }
  });

  const drawable = valid.filter(r => !issues[r.i] && !(r.manager && parentOf(r) && issues[parentOf(r).i]));
  const node = r => ({ key: `r${r.i}`, title: r.title, dept: r.dept, children: [] });
  const nodes = new Map(drawable.map(r => [r, node(r)]));
  const tops = new Map();
  const roots = [];
  drawable.forEach(r => {
    const n = nodes.get(r);
    if (!r.manager) { roots.push(n); return; }
    const parent = parentOf(r);
    if (parent) { nodes.get(parent)?.children.push(n); return; }
    // جهة عليا ترد في «يتبع لـ» دون صف مستقل
    if (!tops.has(r.manager)) {
      const t = { key: `top-${r.manager}`, title: r.manager, dept: '', top: true, children: [] };
      tops.set(r.manager, t);
      roots.unshift(t);
    }
    tops.get(r.manager).children.push(n);
  });
  return { roots, issues };
}

const ORG_LEVEL_COLORS = [colors.tealDark, colors.teal, '#2b8798', '#4ea3b2', '#6fb6c2'];

export function OrgNode({ node, depth = 0 }) {
  const bg = ORG_LEVEL_COLORS[Math.min(depth, ORG_LEVEL_COLORS.length - 1)];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px' }}>
      <div style={{
        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center', minWidth: 110, maxWidth: 190,
        background: node.top ? '#fff' : bg, color: node.top ? colors.tealDark : '#fff',
        border: node.top ? `2px solid ${colors.orange}` : 'none', lineHeight: 1.5,
      }}>
        {node.title}
        {node.dept && <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>{node.dept}</div>}
      </div>
      {node.children.length > 0 && (
        <>
          <div style={{ width: 2, height: 14, background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderTop: node.children.length > 1 ? '2px solid #cbd5e1' : 'none', paddingTop: node.children.length > 1 ? 0 : 0 }}>
            {node.children.map(c => (
              <div key={c.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {node.children.length > 1 && <div style={{ width: 2, height: 12, background: '#cbd5e1' }} />}
                <OrgNode node={c} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


/** خريطة كاملة من صفوف الجدول (تُستخدم في النموذج وفي المثال) */
export function OrgChartView({ positions }) {
  const { roots } = buildOrgTree(positions);
  return (
    <div style={{ background: '#f8fafb', borderRadius: 10, padding: '16px 8px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 18, minWidth: 'fit-content', margin: '0 auto' }}>
        {roots.map(r => <OrgNode key={r.key} node={r} />)}
      </div>
    </div>
  );
}
