// اكتشاف نشر نسخة جديدة من الواجهة أثناء عمل المستخدم.
// المشكلة التي يعالجها: تطبيق صفحة واحدة يبقى محمَّلًا في المتصفح لساعات، فبعد أي نشر يستمر المستخدم
// على النسخة القديمة (ولا يرى التصحيحات) حتى يعيد التحميل يدويًا. هنا نقارن رقم البناء المضمّن في الحزمة
// برقم البناء على الخادم (version.json يُولَّد عند كل بناء) ونعرض شريطًا صغيرًا بزر «تحديث».
const BUILD = typeof __DAFFA_BUILD__ !== 'undefined' ? __DAFFA_BUILD__ : 'dev';
const CHECK_EVERY_MS = 5 * 60 * 1000;
const RELOAD_FLAG = 'df_chunk_reload';
let notified = false;

async function fetchServerBuild() {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.build === 'string' ? j.build : null;
  } catch {
    return null;
  }
}

function showUpdateBar() {
  if (notified || document.getElementById('df-update-bar')) return;
  notified = true;
  const bar = document.createElement('div');
  bar.id = 'df-update-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('dir', 'rtl');
  bar.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:10000;background:#0E2A3D;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 14px 40px rgba(6,20,30,.35);display:flex;align-items:center;gap:12px;font:600 14px/1.6 "IBM Plex Sans Arabic",system-ui,sans-serif;max-width:calc(100vw - 32px)';
  const txt = document.createElement('span');
  txt.textContent = 'صدرت نسخة محدّثة من المنصة.';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'تحديث الآن';
  btn.style.cssText = 'background:#EF6A2C;color:#0E2A3D;border:none;border-radius:10px;padding:8px 14px;font:700 14px "IBM Plex Sans Arabic",system-ui,sans-serif;cursor:pointer;white-space:nowrap';
  btn.onclick = () => window.location.reload();
  const later = document.createElement('button');
  later.type = 'button';
  later.textContent = 'لاحقًا';
  later.setAttribute('aria-label', 'إغلاق التنبيه');
  later.style.cssText = 'background:none;color:#D6E4EE;border:none;font:600 13px "IBM Plex Sans Arabic",system-ui,sans-serif;cursor:pointer';
  later.onclick = () => { bar.remove(); notified = false; };
  bar.append(txt, btn, later);
  document.body.appendChild(bar);
}

async function check() {
  if (document.visibilityState === 'hidden') return;
  const server = await fetchServerBuild();
  if (server && server !== BUILD) showUpdateBar();
}

/** يبدأ المراقبة الدورية (كل 5 دقائق وعند العودة إلى التبويب). لا يعمل في وضع التطوير. */
export function startUpdateWatcher() {
  if (BUILD === 'dev' || typeof window === 'undefined') return;
  setTimeout(check, 60 * 1000);
  setInterval(check, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  window.addEventListener('focus', check);
}

/**
 * عند فشل تحميل جزء مؤجَّل (عادةً لأن أسماء الملفات تغيّرت بعد نشر جديد) يُعاد تحميل الصفحة مرة واحدة
 * بدل شاشة خطأ؛ وإن تكرر الفشل بعد التحميل يُرمى الخطأ كالمعتاد.
 */
export function withChunkReload(importer) {
  return () => importer().then((m) => { sessionStorage.removeItem(RELOAD_FLAG); return m; }).catch((err) => {
    const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically imported module/i.test(String(err?.message || err));
    if (isChunkError && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
      return new Promise(() => {}); // تبقى الصفحة في حالة التحميل حتى تكتمل إعادة التحميل
    }
    throw err;
  });
}
