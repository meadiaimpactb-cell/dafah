// زر «تعبئة تجريبية» يظهر ما دام مفعّلًا من «إعدادات النظام ← الإعدادات العامة» (demo_fill_enabled).
// لا يظهر قبل تحميل الإعداد حتى لا يومض ثم يختفي عند إيقافه.
import { useSiteContent } from '../pages/auth/AuthShell';

export default function useDemoFill() {
  const sc = useSiteContent();
  return Object.keys(sc).length > 0 && String(sc.demo_fill_enabled ?? '1') !== '0';
}
