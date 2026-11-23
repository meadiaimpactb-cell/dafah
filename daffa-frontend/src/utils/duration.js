// تسمية المدد كما يفهمها غير المتخصص: «12:30» ← «12 دقيقة و30 ثانية»
const DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
const latin = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => DIGITS[d]);

const plural = (n, one, two, many) => {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${n} ${many}`;
};

/** يحوّل «m:ss» أو «h:mm:ss» أو «12 دقيقة» إلى عبارة مقروءة؛ يعيد النص كما هو إن لم يُفهم */
export function humanDuration(value) {
  const raw = latin(value).trim();
  if (!raw) return '';
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return raw;
  let h = 0; let min = 0; let sec = 0;
  if (m[3] !== undefined) { h = +m[1]; min = +m[2]; sec = +m[3]; } else { min = +m[1]; sec = +m[2]; }
  const parts = [];
  if (h) parts.push(plural(h, 'ساعة', 'ساعتان', 'ساعات'));
  if (min) parts.push(plural(min, 'دقيقة', 'دقيقتان', min <= 10 ? 'دقائق' : 'دقيقة'));
  if (sec) parts.push(plural(sec, 'ثانية', 'ثانيتان', sec <= 10 ? 'ثوانٍ' : 'ثانية'));
  return parts.join(' و') || '0 دقيقة';
}

/** عبارة رأس الوحدة: الوقت المذكور في بيانات الوحدة هو تقدير لإنجازها (مدة الفيديو تظهر داخل المشغّل) */
export function unitTimeLabel(duration) {
  const text = humanDuration(duration);
  return text ? `الوقت التقديري لإكمال الوحدة: ${text}` : '';
}
