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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Production'da source map kapalı
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          icons: ['lucide-react']
        }
      }
    }
  },
  base: '/', // Production base path
  server: {
    proxy: {
      // Development proxy settings
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/public')
      },
      '/*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      },
      '/sipay_*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      },
      '/ikas_*.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => `/public${path}`
      }
    }
  }
});
