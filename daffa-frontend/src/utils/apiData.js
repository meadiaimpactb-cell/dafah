// تطبيع استجابات API قبل تخزينها في الحالة: أي شكل غير متوقع (HTML من وسيط/بروكسي، نص فارغ، null)
// يتحول إلى القيمة الافتراضية بدل انهيار الصفحة عند أول .map أو .forEach.
export const asArray = (d) => (Array.isArray(d) ? d : []);

export const asObject = (d, fallback = null) => (d && typeof d === 'object' && !Array.isArray(d) ? d : fallback);
