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
      },
      // Adres PHP dosyaları için (ana dizin)
      '/ikas_cities.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/ikas_cities.php'
      },
      '/ikas_districts.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/ikas_districts.php'
      },
      '/ikas_towns.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/ikas_towns.php'
      },
      // Diğer PHP dosyaları (ana dizin)
      '/get_token.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/get_token.php'
      },
      '/ikas_products.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/ikas_products.php'
      },
      '/ikas_create_order.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/ikas_create_order.php'
      },
      // SiPay endpoints
      '/sipay_token.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/sipay_token.php'
      },
      '/sipay_prepare_payment.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/sipay_prepare_payment.php'
      },
      '/sipay_form_redirect.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/sipay_form_redirect.php'
      },
      '/sipay_callback.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/sipay_callback.php'
      }
    }
  }
});
