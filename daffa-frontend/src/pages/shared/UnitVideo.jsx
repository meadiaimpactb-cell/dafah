import { useEffect, useState } from 'react';

/*
 * فيديو شرح الوحدة — مشترك بين التخطيط الاستراتيجي والتشغيلي والسياسات.
 * - ملف مرفوع على المنصة (mp4/webm) يُعرض بمشغّل المتصفح، ورابط يوتيوب/فيميو يُضمَّن كما هو.
 * - نسختان اختياريتان: الفصحى (url) واللهجة السعودية (altUrl) مع زر تبديل.
 * الروابط تُدار من لوحة التحكم (محتوى الوحدات / محتوى الموقع).
 */

const C = { primary: '#235D7F', ink: '#0E2A3D', soft: '#D9E8F1', gray: '#5E6B78', border: '#E8E3DA' };

export const isDirectVideo = url => /\.(mp4|webm|ogv|ogg|mov)(\?|#|$)/i.test(url || '');

export function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url, window.location.origin);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes('vimeo.com') && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video${u.pathname}`;
  } catch (_) { /* رابط نسبي أو غير صالح: يُستخدم كما هو */ }
  return url;
}

const VERSIONS = [
  { key: 'main', label: 'الفصحى' },
  { key: 'alt', label: 'اللهجة السعودية' },
];

/** يعيد null إن لم يوجد أي رابط، لتعرض الصفحة رسالتها «قيد الإعداد» */
export default function UnitVideo({ url, altUrl, title, radius = 12 }) {
  const available = VERSIONS.filter(v => (v.key === 'main' ? url : altUrl));
  const [version, setVersion] = useState(available[0]?.key || 'main');
  useEffect(() => { if (!available.some(v => v.key === version)) setVersion(available[0]?.key || 'main'); }, [url, altUrl]);
  if (!available.length) return null;

  const src = version === 'alt' ? altUrl : url;
  const frame = { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#0A1F2E' };

  return (
    <div>
      {available.length > 1 && (
        <div role="group" aria-label="لغة الشرح" style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#F3EFE8', borderRadius: 10, marginBottom: 12 }}>
          {available.map(v => (
            <button key={v.key} type="button" onClick={() => setVersion(v.key)} aria-pressed={version === v.key}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: version === v.key ? 700 : 500, background: version === v.key ? '#fff' : 'transparent', color: version === v.key ? C.primary : C.gray, boxShadow: version === v.key ? '0 1px 4px rgba(14,42,61,.12)' : 'none' }}>
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: radius, overflow: 'hidden', background: '#0A1F2E' }}>
        {isDirectVideo(src) ? (
          // key: إعادة تحميل المشغّل عند التبديل بين النسختين
          <video key={src} src={src} controls preload="metadata" playsInline controlsList="nodownload" style={frame} title={title}>
            المتصفح لا يدعم تشغيل الفيديو.
          </video>
        ) : (
          <iframe key={src} src={toEmbedUrl(src)} style={frame} allowFullScreen allow="autoplay; fullscreen; picture-in-picture" title={title} />
        )}
      </div>
    </div>
  );
}
