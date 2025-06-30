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
      // PHP dosyalarını proxy'le
      '/api/php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/php/, '')
      },
      // Public PHP dosyaları için
      '/public/*.php': {
        target: 'http://localhost:8080/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/public/, '')
      }
    }
  }
});
