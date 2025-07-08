import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      // Tüm PHP API istekleri için genel proxy
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/public')
      },
      // Direkt PHP dosyaları için
      '/*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      },
      // Sipay API'leri için özel routing
      '/sipay_*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      },
      // Ikas API'leri için özel routing
      '/ikas_*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      }
    }
  }
});
