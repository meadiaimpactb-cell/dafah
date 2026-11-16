import { useEffect, useState } from 'react';

const get = () => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
  return { width: w, isPhone: w <= 640, isTablet: w > 640 && w <= 1024, isDesktop: w > 1024 };
};

/** حجم الشاشة الحالي: جوال (حتى 640) / لوحي (حتى 1024) / مكتبي */
export default function useViewport() {
  const [vp, setVp] = useState(get);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setVp((prev) => { const n = get(); return (n.isPhone === prev.isPhone && n.isTablet === prev.isTablet && Math.abs(n.width - prev.width) < 40) ? prev : n; })); };
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return vp;
}
