// تسميات الأحداث والأدوار المشتركة بين صفحتَي الإشعارات وسجل النشاط (الأدمن)
export const ACTION_LABELS = {
  'تسجيل دخول':                 { color: 'primary',   label: 'تسجيل دخول' },
  'تسجيل خروج':                 { color: 'gray',   label: 'تسجيل خروج' },
  'تسجيل حساب جديد':            { color: 'blue',   label: 'تسجيل جديد' },
  'بدء التخطيط الاستراتيجي':   { color: 'primary',   label: 'بدء استراتيجي' },
  'بدء التخطيط التشغيلي':       { color: 'primary',   label: 'بدء تشغيلي' },
  'اختيار مستشار — استراتيجي': { color: 'blue',   label: 'اختيار مستشار' },
  'دفع — استراتيجي':            { color: 'green',  label: 'دفع ناجح' },
  'دفع — تشغيلي':               { color: 'green',  label: 'دفع ناجح' },
  'دفع — سياسات':               { color: 'green',  label: 'دفع ناجح' },
  'إرسال وحدة للمراجعة — استراتيجي': { color: 'orange', label: 'إرسال للمراجعة' },
  'إرسال وحدة للمراجعة — تشغيلي':    { color: 'orange', label: 'إرسال للمراجعة' },
  'إرسال سياسة للمراجعة':       { color: 'orange', label: 'إرسال للمراجعة' },
  'اعتماد وحدة — استراتيجي':   { color: 'green',  label: 'اعتماد' },
  'اعتماد وحدة — تشغيلي':      { color: 'green',  label: 'اعتماد' },
  'اعتماد سياسة':               { color: 'green',  label: 'اعتماد' },
  'طلب تعديل — استراتيجي':     { color: 'orange', label: 'طلب تعديل' },
  'طلب تعديل — تشغيلي':        { color: 'orange', label: 'طلب تعديل' },
  'طلب تعديل — سياسة':         { color: 'orange', label: 'طلب تعديل' },
  'إرسال إشعار جماعي':          { color: 'blue',   label: 'إشعار جماعي' },
};
export const ROLE_COLORS = { admin: 'red', consultant: 'primary', client: 'gray', system: 'blue' };
export const CATEGORY_OPTIONS = [
  { value: '', label: 'جميع الفئات' },
  { value: 'auth',     label: 'المصادقة' },
  { value: 'workflow', label: 'سير العمل' },
  { value: 'payment',  label: 'المدفوعات' },
  { value: 'review',   label: 'المراجعات' },
  { value: 'admin',    label: 'الإدارة' },
  { value: 'policy',   label: 'السياسات' },
  { value: 'consultant', label: 'المستشار' },
];
export const ROLE_OPTIONS = [
  { value: '', label: 'جميع الأدوار' },
  { value: 'admin',      label: 'مدير' },
  { value: 'consultant', label: 'مستشار' },
  { value: 'client',     label: 'عميل' },
  { value: 'system',     label: 'النظام' },
];
