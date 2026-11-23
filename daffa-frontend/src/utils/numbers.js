// قراءة المبالغ والأعداد كما يكتبها المستخدم: أرقام عربية أو غربية، فواصل الآلاف، الفاصلة العشرية العربية

export const normalizeDigits = (v) => String(v ?? '')
  .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/٫/g, '.')
  .replace(/٬/g, ',')
  .replace(/[−–—]/g, '-');

/**
 * يحوّل النص إلى رقم.
 *  - '' أو فراغ → null (لم يُدخل شيء)
 *  - نص غير رقمي أو أكثر من فاصلة عشرية → NaN (قيمة غير صالحة)
 */
export function parseAmount(v) {
  const t = normalizeDigits(v).trim().replace(/[,\s]/g, '').replace(/ريال|ر\.س|SAR/gi, '');
  if (!t) return null;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  return parseFloat(t);
}

/** القيمة فارغة أو رقم صالح يساوي صفرًا أو أكثر */
export const isNonNegativeAmount = (v) => {
  const n = parseAmount(v);
  return n === null || (Number.isFinite(n) && n >= 0);
};

/** رقم صالح ≥ 0 أو 0 عند الفراغ؛ NaN للنص غير الصالح */
export const amountOrZero = (v) => { const n = parseAmount(v); return n === null ? 0 : n; };

export const AMOUNT_MSG = 'أدخل مبلغًا بالريال يساوي صفرًا أو أكثر';
export const NUMBER_MSG = 'أدخل رقمًا يساوي صفرًا أو أكبر';
