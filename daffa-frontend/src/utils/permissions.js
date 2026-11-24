import { useState, useEffect } from 'react';

// ── Permissions Definition (by role → modules → actions) ─────────────────────
export const PERMISSIONS_BY_ROLE = {
  admin: [
    {
      module: 'admin.consultants',
      label:  'إدارة المستشارين',
      icon:   'briefcase',
      actions: [
        { key: 'view',   label: 'عرض القائمة' },
        { key: 'add',    label: 'إضافة' },
        { key: 'edit',   label: 'تعديل' },
        { key: 'delete', label: 'حذف' },
        { key: 'toggle', label: 'تفعيل / إيقاف' },
      ],
    },
    {
      module: 'admin.seo',
      label:  'الظهور والقياس',
      icon:   'chart',
      actions: [
        { key: 'view',     label: 'عرض' },
        { key: 'edit',     label: 'العناوين والأوصاف والكلمات وخريطة الموقع' },
        { key: 'robots',   label: 'ملف robots.txt' },
        { key: 'tracking', label: 'أدوات القياس ورموز التوثيق' },
      ],
    },
    {
      module: 'admin.consultant_changes',
      label:  'تغيير المستشار',
      icon:   'briefcase',
      actions: [
        { key: 'view',     label: 'عرض الطلبات' },
        { key: 'decide',   label: 'اعتماد/رفض طلبات العملاء' },
        { key: 'reassign', label: 'تغيير مستشار خطة مباشرة' },
      ],
    },
    {
      module: 'admin.users',
      label:  'إدارة المستخدمين',
      icon:   'users',
      actions: [
        { key: 'view',        label: 'عرض القائمة' },
        { key: 'add',         label: 'إضافة' },
        { key: 'edit',        label: 'تعديل' },
        { key: 'delete',      label: 'حذف' },
        { key: 'toggle',      label: 'تفعيل / إيقاف' },
        { key: 'permissions', label: 'إدارة الصلاحيات' },
      ],
    },
    {
      module: 'admin.organizations',
      label:  'إدارة المنظمات',
      icon:   'building',
      actions: [
        { key: 'view',   label: 'عرض القائمة' },
        { key: 'add',    label: 'إضافة' },
        { key: 'edit',   label: 'تعديل' },
        { key: 'delete', label: 'حذف' },
        { key: 'toggle', label: 'تفعيل / إيقاف' },
      ],
    },
    {
      module: 'admin.finance',
      label:  'الإدارة المالية',
      icon:   'money',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'export', label: 'تصدير' },
      ],
    },
    {
      module: 'admin.reports',
      label:  'التقارير والإحصاءات',
      icon:   'chart',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'export', label: 'تصدير' },
        { key: 'print',  label: 'طباعة' },
      ],
    },
    {
      module: 'admin.content',
      label:  'إدارة المحتوى',
      icon:   'pencil',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'add',    label: 'إضافة' },
        { key: 'edit',   label: 'تعديل' },
        { key: 'delete', label: 'حذف' },
      ],
    },
    {
      module: 'admin.settings',
      label:  'إعدادات النظام',
      icon:   'wrench',
      actions: [
        { key: 'view', label: 'عرض' },
        { key: 'edit', label: 'تعديل' },
      ],
    },
  ],

  consultant: [
    {
      module: 'consultant.strategic',
      label:  'التخطيط الاستراتيجي',
      icon:   'target',
      actions: [
        { key: 'view',     label: 'عرض' },
        { key: 'approve',  label: 'اعتماد' },
        { key: 'revision', label: 'طلب مراجعة' },
      ],
    },
    {
      module: 'consultant.operational',
      label:  'التخطيط التشغيلي',
      icon:   'gear',
      actions: [
        { key: 'view',     label: 'عرض' },
        { key: 'approve',  label: 'اعتماد' },
        { key: 'revision', label: 'طلب مراجعة' },
      ],
    },
    {
      module: 'consultant.policies',
      label:  'السياسات والتشريعات',
      icon:   'clipboard',
      actions: [
        { key: 'view',     label: 'عرض' },
        { key: 'approve',  label: 'اعتماد' },
        { key: 'revision', label: 'طلب مراجعة' },
      ],
    },
    {
      module: 'consultant.design',
      label:  'تصميم السياسات',
      icon:   'file',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'upload', label: 'رفع تصميم' },
      ],
    },
  ],

  client: [
    {
      module: 'client.strategic',
      label:  'التخطيط الاستراتيجي',
      icon:   'target',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'start',  label: 'بدء الخدمة' },
        { key: 'submit', label: 'إرسال' },
        { key: 'pay',    label: 'الدفع' },
      ],
    },
    {
      module: 'client.operational',
      label:  'التخطيط التشغيلي',
      icon:   'gear',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'start',  label: 'بدء الخدمة' },
        { key: 'submit', label: 'إرسال' },
        { key: 'pay',    label: 'الدفع' },
      ],
    },
    {
      module: 'client.policies',
      label:  'السياسات والتشريعات',
      icon:   'clipboard',
      actions: [
        { key: 'view',   label: 'عرض' },
        { key: 'start',  label: 'بدء الخدمة' },
        { key: 'submit', label: 'إرسال' },
        { key: 'pay',    label: 'الدفع' },
      ],
    },
    {
      module: 'client.chat',
      label:  'المحادثات',
      icon:   'chat',
      actions: [
        { key: 'view', label: 'عرض' },
        { key: 'send', label: 'إرسال رسائل' },
      ],
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getAllPermKeys(role) {
  return (PERMISSIONS_BY_ROLE[role] || []).flatMap(
    m => m.actions.map(a => `${m.module}.${a.key}`)
  );
}

function readAuthUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

// Filters out old-format keys (e.g. 'admin.users') — new format requires 3 parts (e.g. 'admin.users.edit')
function filterNewFormat(perms) {
  if (!Array.isArray(perms)) return [];
  return perms.filter(k => typeof k === 'string' && k.split('.').length >= 3);
}

export function syncPermissionsToStorage(userId, permissions) {
  const user = readAuthUser();
  if (user.id === userId) {
    localStorage.setItem('user', JSON.stringify({ ...user, permissions: permissions || null }));
    window.dispatchEvent(new Event('permissionsChanged'));
  }
}

// Call once on app boot to clear any stale old-format permissions from localStorage
export function cleanupLegacyPermissions() {
  const user = readAuthUser();
  if (!user.id) return;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const isOldFormat = perms.length > 0 && perms.some(k => k.split('.').length < 3);
  if (isOldFormat) {
    localStorage.setItem('user', JSON.stringify({ ...user, permissions: null }));
    window.dispatchEvent(new Event('permissionsChanged'));
  }
}

// ── React Hook ────────────────────────────────────────────────────────────────
export function usePermissions() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('permissionsChanged', handler);
    return () => window.removeEventListener('permissionsChanged', handler);
  }, []);

  const user      = readAuthUser();
  const role      = user.role || 'client';
  const stored    = filterNewFormat(user.permissions); // ignores old-format keys automatically
  const allKeys   = getAllPermKeys(role);
  // Empty stored = full access (default for all users)
  const effective = stored.length === 0 ? allKeys : stored;

  const can    = (key) => effective.includes(key);
  const canAny = (...keys) => keys.some(k => can(k));

  return { can, canAny, user, role, effective };
}
