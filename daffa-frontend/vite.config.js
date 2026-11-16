import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: 'http://localhost:3000',
    cors: true,
    // Local development: forward API and uploaded files to `php artisan serve`.
    proxy: {
      '/api': { target: process.env.DAFFA_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
      '/storage': { target: process.env.DAFFA_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
