// تشغيل أدوات القياس بعد موافقة الزائر، وشريط الموافقة، واختيار الزائر من صفحة الخصوصية.
import { useEffect, useState } from 'react';
import { colors } from '../../theme/tokens';
import { hasTrackers } from '../../utils/seoRules';
import { CONSENT_EVENT, applyTracking, getMeasureConsent, setMeasureConsent, setTrackingActive, trackPageView, trackersLoaded } from '../../utils/tracking';

function useConsent() {
  const [choice, setChoice] = useState(getMeasureConsent);
  useEffect(() => {
    const on = () => setChoice(getMeasureConsent());
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);
  return choice;
}

/** لا يرسم شيئًا: يحمّل الأدوات في الصفحات العامة بعد الموافقة ويبلغها بتغيّر الصفحة */
export function Measurement({ settings, trackable, path, view }) {
  const consent = useConsent();
  useEffect(() => () => setTrackingActive(false), []);
  // أداة حُمّلت في صفحة عامة لا تُفرَّغ إلا بإعادة التحميل؛ دخول لوحة التحكم يبدأ صفحة جديدة بلا أدوات
  useEffect(() => {
    if (!trackable && trackersLoaded()) window.location.reload();
  }, [trackable]);
  const live = trackable && consent === 'yes' && hasTrackers(settings);
  useEffect(() => {
    if (!live) { setTrackingActive(false); return undefined; }
    setTrackingActive(applyTracking(settings));
    const id = setTimeout(() => trackPageView(path, document.title), 400);
    return () => clearTimeout(id);
  }, [live, path, view, settings]);
  return null;
}

/** شريط سفلي يسأل الزائر عن أدوات القياس — يظهر فقط إن ضبط المشرف أداة واحدة على الأقل ولم يختر الزائر بعد */
export function PrivacyConsent({ settings, trackable, onPrivacy }) {
  const consent = useConsent();
  if (!trackable || consent !== null || !hasTrackers(settings)) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="اختيار أدوات القياس" data-consent-banner style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 950, padding: 12, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', maxWidth: 860, margin: '0 auto', background: '#fff', border: `1px solid ${colors.grayBorder}`, borderRadius: 18, boxShadow: '0 12px 40px rgba(14,42,61,0.18)', padding: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <p style={{ flex: '1 1 320px', margin: 0, fontSize: 14, lineHeight: 1.9, color: colors.ink }}>
          نستخدم أدوات قياس لفهم زيارات الموقع العام وتحسينه، ولا تعمل داخل حسابك ولا تصلها بيانات منظمتك أو خططها.{' '}
          <a href="/privacy" onClick={(e) => { e.preventDefault(); onPrivacy?.(); }} style={{ color: colors.primary, fontWeight: 700 }}>سياسة الخصوصية</a>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMeasureConsent('yes')} style={{ height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: colors.primary, color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>موافق على الكل</button>
          <button type="button" onClick={() => setMeasureConsent('no')} style={{ height: 44, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, background: '#fff', color: colors.ink, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>الضروري فقط</button>
        </div>
      </div>
    </div>
  );
}

/** تغيير الاختيار لاحقًا من صفحة الخصوصية */
export function MeasureChoice({ settings }) {
  const consent = useConsent();
  if (!hasTrackers(settings)) return null;
  const pick = (v) => {
    setMeasureConsent(v);
    if (v === 'no' && consent === 'yes') window.location.reload();
  };
  const btn = (on) => ({ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${on ? colors.primary : colors.grayBorder}`, background: on ? colors.primaryTint : '#fff', color: colors.ink, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' });
  return (
    <div data-measure-choice style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '16px 0', padding: '12px 14px', borderRadius: 12, background: colors.sunken }}>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{consent === 'yes' ? 'أدوات القياس: مسموحة' : consent === 'no' ? 'أدوات القياس: غير مسموحة' : 'لم تختر بعد بشأن أدوات القياس'}</span>
      <button type="button" aria-pressed={consent === 'yes'} onClick={() => pick('yes')} style={btn(consent === 'yes')}>السماح</button>
      <button type="button" aria-pressed={consent === 'no'} onClick={() => pick('no')} style={btn(consent === 'no')}>الضروري فقط</button>
    </div>
  );
}
