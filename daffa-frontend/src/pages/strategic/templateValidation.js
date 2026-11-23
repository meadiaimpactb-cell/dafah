import { swotAutoPoints, needsItems, stakeholderRows, ORG_SUGGESTED_POSITIONS, initiativeIssues } from './TemplateRenderer';
import { buildOrgTree } from './OrgChart';

const notEmpty = v => (v || '').trim().length > 0;

export const DATE_ORDER_MSG = 'يجب أن يوافق تاريخ النهاية تاريخ البداية أو يأتي بعده';
export const ORG_SUGGESTED_MSG = 'راجع بيانات المدير التنفيذي، ثم احتفظ بالصف أو عدّله بما يناسب منظمتك.';
export const ORG_CYCLE_MSG = 'تعذّر إرسال الهيكل. صحّح علاقات التبعية الموضّحة في الجدول حتى تظهر جميع الوظائف في الخريطة.';
export const STAKEHOLDERS_EMPTY_MSG = 'اكتملت أوصاف العوامل الخارجية. خريطة أصحاب المصلحة ما زالت فارغة. يمكنك حفظ المسودة والعودة إلى الخريطة قبل الإرسال.';

/**
 * Returns { valid, errors, warnings } for a given template + formData.
 *  - errors   : تمنع «إرسال للمراجعة» فقط (حفظ المسودة متاح دائمًا)
 *  - warnings : تنبيهات إرشادية لا تمنع الإرسال
 * `unit` is passed so we can read dynamic table_rows from the DB.
 */
export function validateTemplate(templateType, formData, unit) {
  const errors = [];
  const warnings = [];

  switch (templateType) {
    case 'swot': {
      const matrix = formData.matrix || {};
      if (!swotAutoPoints(unit || {}, formData.table, 'strength').length) errors.push('نقاط القوة (سجّلها في جدول الموارد)');
      if (!swotAutoPoints(unit || {}, formData.table, 'weakness').length) errors.push('نقاط الضعف (سجّلها في جدول الموارد)');
      if (!notEmpty(matrix.opportunities)) errors.push('فرص التحسين');
      if (!notEmpty(matrix.threats))       errors.push('المخاطر الداخلية');
      break;
    }

    case 'pestel': {
      const rows = unit?.table_rows || ['سياسي', 'اقتصادي', 'اجتماعي', 'تقني', 'بيئي', 'قانوني'];
      const factors = formData.factors || {};
      rows.forEach(row => {
        if (!notEmpty(factors[`${row}__desc`])) { errors.push(`${row}: وصف العامل`); return; }
        // لا تُقبل قيم جاهزة لم يخترها العميل
        if (!notEmpty(factors[`${row}__impact`])) errors.push(`${row}: اختر التأثير`);
        if (!notEmpty(factors[`${row}__level`]))  errors.push(`${row}: اختر المستوى`);
      });
      const stakes = stakeholderRows(formData);
      const mapFilled = stakes.some(r => notEmpty(r.impact) || notEmpty(r.interest) || notEmpty(r.strategy));
      if (errors.length === 0 && !mapFilled) warnings.push(STAKEHOLDERS_EMPTY_MSG);
      break;
    }

    case 'needs': {
      if (!notEmpty(formData.target_community)) errors.push('تعريف المجتمع المستهدف');
      if (!notEmpty(formData.gap_analysis))     errors.push('تحليل الفجوات');
      const items = needsItems(formData, unit || {});
      if (!items.some(it => notEmpty(it.name) && notEmpty(it.desc)))
        errors.push('جدول الاحتياجات: احتياج واحد على الأقل مع وصفه');
      break;
    }

    case 'tows': {
      const tows = formData.tows || {};
      if (!notEmpty(tows.so)) errors.push('SO — استراتيجيات القوة والفرص');
      if (!notEmpty(tows.wo)) errors.push('WO — استراتيجيات الضعف والفرص');
      if (!notEmpty(tows.st)) errors.push('ST — استراتيجيات القوة والتهديدات');
      if (!notEmpty(tows.wt)) errors.push('WT — استراتيجيات الضعف والتهديدات');
      break;
    }

    case 'initiatives': {
      const init = formData.initiatives || [];
      const blank = row => !notEmpty(row.name) && !notEmpty(row.description) && !notEmpty(row.goal) && !notEmpty(row.outputs) && !notEmpty(row.budget) && !notEmpty(row.owner);
      if (init.length === 0 || (init.length === 1 && blank(init[0]))) {
        // البطاقة الأولى ظاهرة دائمًا: المطلوب تعبئتها لا إضافة بطاقة جديدة
        errors.push('اكتب اسم المبادرة ووصفها في البطاقة الحالية');
      } else {
        init.forEach((row, i) => {
          if (!notEmpty(row.name))        errors.push(`مبادرة ${i + 1}: اسم المبادرة`);
          if (!notEmpty(row.description)) errors.push(`مبادرة ${i + 1}: وصف المبادرة`);
          const issues = initiativeIssues(row);
          if (issues.end_date) errors.push(`مبادرة ${i + 1}: ${issues.end_date}`);
          if (issues.budget)   errors.push(`مبادرة ${i + 1}: ${issues.budget}`);
        });
      }
      break;
    }

    case 'directions': {
      const d = formData.directions || {};
      if (!notEmpty(d.vision))  errors.push('الرؤية');
      if (!notEmpty(d.mission)) errors.push('الرسالة');
      const goals = formData.goals_list || [];
      if (!goals.some(g => notEmpty(g)))
        errors.push('الأهداف الاستراتيجية (هدف واحد على الأقل)');
      break;
    }

    case 'toc': {
      const t = formData.toc || {};
      if (!notEmpty(t.inputs))     errors.push('المدخلات');
      if (!notEmpty(t.activities)) errors.push('الأنشطة');
      if (!notEmpty(t.outputs))    errors.push('المخرجات');
      if (!notEmpty(t.outcomes))   errors.push('النتائج');
      if (!notEmpty(t.impact))     errors.push('الأثر');
      break;
    }

    case 'bmc': {
      const b = formData.bmc || {};
      const fields = [
        ['customer_segments', 'شرائح المستفيدين'],
        ['relationships',     'العلاقة مع المستفيدين'],
        ['value_proposition', 'القيمة المقترحة للمستفيدين'],
        ['key_activities',    'الأنشطة الرئيسة'],
        ['partners',          'الشراكات الرئيسة'],
        ['channels',          'القنوات'],
        ['key_resources',     'الموارد الأساسية'],
        ['revenue_streams',   'مصادر الدخل'],
        ['cost_structure',    'هيكل التكاليف'],
      ];
      fields.forEach(([k, label]) => {
        if (!notEmpty(b[k])) errors.push(label);
      });
      break;
    }

    case 'kpis': {
      const kpis = formData.kpis || [];
      const blank = row => !notEmpty(row.name) && !notEmpty(row.target) && !notEmpty(row.goal) && !notEmpty(row.measurement);
      if (kpis.length === 0 || (kpis.length === 1 && blank(kpis[0]))) {
        errors.push('اكتب اسم المؤشر والمستهدف في الصف الحالي');
      } else {
        kpis.forEach((row, i) => {
          if (!notEmpty(row.name))   errors.push(`مؤشر ${i + 1}: اسم المؤشر`);
          if (!notEmpty(row.target)) errors.push(`مؤشر ${i + 1}: المستهدف`);
        });
      }
      break;
    }

    case 'orgchart': {
      // الصف الأول المقترح (المدير التنفيذي) يُعد منصبًا صالحًا بعد مراجعته
      const suggested = !Array.isArray(formData.positions);
      const positions = suggested ? ORG_SUGGESTED_POSITIONS : formData.positions;
      if (!positions.some(p => notEmpty(p.title))) {
        errors.push('أضف منصبًا وظيفيًا واحدًا على الأقل');
      } else {
        const { issues } = buildOrgTree(positions);
        if (Object.keys(issues).length > 0) errors.push(ORG_CYCLE_MSG);
      }
      if (suggested) warnings.push(ORG_SUGGESTED_MSG);
      break;
    }

    case 'document': {
      const doc = formData.document || {};
      if (!notEmpty(doc.executive_summary)) errors.push('الملخص التنفيذي');
      if (!notEmpty(doc.key_findings))      errors.push('أبرز النتائج والتحليلات');
      if (!notEmpty(doc.implementation))    errors.push('الخطة التنفيذية');
      if (!notEmpty(doc.monitoring))        errors.push('آلية المتابعة والتقييم');
      break;
    }

    default: {
      if (!notEmpty(formData.content)) errors.push('محتوى الوحدة');
      break;
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** هل أدخل العميل أي شيء في النموذج؟ (لتفعيل الحفظ التلقائي للمسودة) */
export function hasAnyInput(formData) {
  const walk = (v) => {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number' || typeof v === 'boolean') return true;
    if (Array.isArray(v)) return v.some(walk);
    if (typeof v === 'object') return Object.values(v).some(walk);
    return false;
  };
  return walk(formData);
}
