import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { startUpdateWatcher } from './utils/updateWatcher'
import './index.css'

// شاشة انتظار موجزة أثناء تحميل أجزاء الواجهة المؤجَّلة (صفحتا الدخول والتسجيل مثلًا)
const Splash = () => (
  <div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF9F5', color: '#235D7F', fontWeight: 700, fontSize: 15 }}>
    جارٍ التحميل…
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Splash />}>
      <App />
    </Suspense>
  </React.StrictMode>,
)

// بعد النشر: يُنبَّه المستخدم المفتوح لديه التطبيق بأن نسخة أحدث صدرت بدل بقائه على القديمة
startUpdateWatcher()
