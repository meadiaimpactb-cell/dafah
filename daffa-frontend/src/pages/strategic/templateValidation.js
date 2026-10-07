const notEmpty = v => (v || '').trim().length > 0;

/**
 * Returns { valid: bool, errors: string[] } for a given template + formData.
 * `unit` is passed so we can read dynamic table_rows from the DB.
 */
export function validateTemplate(templateType, formData, unit) {
  const errors = [];

  switch (templateType) {
    case 'swot': {
      const matrix = formData.matrix || {};
      if (!notEmpty(matrix.strengths))     errors.push('نقاط القوة (S)');
      if (!notEmpty(matrix.weaknesses))    errors.push('نقاط الضعف (W)');
      if (!notEmpty(matrix.opportunities)) errors.push('الفرص (O)');
      if (!notEmpty(matrix.threats))       errors.push('التهديدات (T)');
      break;
    }

    case 'pestel': {
      const rows = unit?.table_rows || ['سياسي', 'اقتصادي', 'اجتماعي', 'تقني', 'بيئي', 'قانوني'];
      const factors = formData.factors || {};
      rows.forEach(row => {
        if (!notEmpty(factors[`${row}__desc`]))
          errors.push(`${row}: وصف العامل`);
      });
      break;
    }

    case 'needs': {
      if (!notEmpty(formData.target_community)) errors.push('تعريف المجتمع المستهدف');
      if (!notEmpty(formData.gap_analysis))     errors.push('تحليل الفجوات');
      const rows = unit?.table_rows || ['الدعم التعليمي', 'التأهيل المهني', 'الدعم النفسي', 'الرعاية الصحية', 'الإسكان'];
      const tbl = formData.needs_table || {};
      rows.forEach(row => {
        if (!notEmpty(tbl[`${row}__desc`]))
          errors.push(`${row}: وصف الاحتياج`);
      });
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
      if (init.length === 0) {
        errors.push('يجب إضافة مبادرة واحدة على الأقل');
      } else {
        init.forEach((row, i) => {
          if (!notEmpty(row.name))        errors.push(`مبادرة ${i + 1}: اسم المبادرة`);
          if (!notEmpty(row.description)) errors.push(`مبادرة ${i + 1}: وصف المبادرة`);
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
        ['value_proposition', 'القيم المقترحة'],
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
      if (kpis.length === 0) {
        errors.push('يجب إضافة مؤشر أداء واحد على الأقل');
      } else {
        kpis.forEach((row, i) => {
          if (!notEmpty(row.name))   errors.push(`مؤشر ${i + 1}: اسم المؤشر`);
          if (!notEmpty(row.target)) errors.push(`مؤشر ${i + 1}: المستهدف`);
        });
      }
      break;
    }

    case 'orgchart': {
      const positions = formData.positions || [];
      if (!positions.some(p => notEmpty(p.title)))
        errors.push('يجب إضافة منصب وظيفي واحد على الأقل');
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

  return { valid: errors.length === 0, errors };
}
