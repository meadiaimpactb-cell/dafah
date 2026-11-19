import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// التطوير المحلي: تمرير طلبات API والملفات المرفوعة إلى خادم Laravel
const apiTarget = process.env.DAFFA_API_TARGET || 'http://127.0.0.1:8000'
const proxy = {
  '/api': { target: apiTarget, changeOrigin: true },
  '/storage': { target: apiTarget, changeOrigin: true },
}

// رقم البناء: يُضمَّن في الحزمة ويُكتب في version.json حتى يكتشف المتصفح أي نشر جديد (انظر utils/updateWatcher.js)
const BUILD_ID = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const versionFile = () => ({
  name: 'daffa-version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
  },
})

export default defineConfig({
  plugins: [react(), versionFile()],
  base: '/',
  define: { __DAFFA_BUILD__: JSON.stringify(BUILD_ID) },
  server: {
    port: 3000,
    open: 'http://localhost:3000',
    cors: true,
    proxy,
  },
  preview: { port: 4173, proxy },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // مكتبات React في حزمة مستقلة تبقى في ذاكرة المتصفح بين الإصدارات
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          return /node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'vendor-react' : 'vendor'
        },
      },
    },
  },
})
