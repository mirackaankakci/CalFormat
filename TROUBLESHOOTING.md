# 🚨 CalFormat Hata Çözüm Kılavuzu

## Mevcut Hatalar ve Çözümleri

### 1. **CSP (Content Security Policy) Hataları**

**Semptom**: Console'da "Refused to connect" ve CSP violation hataları

**Sebep**: 
- `index.html`'deki CSP ile `.htaccess`'teki CSP çakışıyor
- CSP çok kısıtlayıcı, API çağrılarını engelliyor

**✅ Çözüm** (YAPILDI):
```html
<!-- index.html'den CSP kaldırıldı -->
<!-- CSP artık sadece .htaccess'te yönetiliyor -->
```

---

### 2. **API Fetch Hataları**

**Semptom**: "Failed to fetch" ve network hataları

**Sebep**:
- PHP API sadece test mesajı döndürüyordu
- Yanlış URL'ler deneniyor
- CORS headers eksik

**✅ Çözüm** (YAPILDI):
```typescript
// Basitleştirilmiş fetch
const response = await fetch('/public/ikas_products.php', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  mode: 'cors'
});
```

---

### 3. **PHP API Boş Yanıt**

**Sebep**: PHP dosyası sadece test mesajı döndürüyordu

**✅ Çözüm** (YAPILDI):
```php
// Artık gerçek Ikas API çağrısı yapıyor
// Hata durumunda fallback ürünler döndürüyor
```

---

## 🔧 Test Adımları

### 1. **Geliştirme Ortamı Testi**
```bash
# 1. Doğru .htaccess kullandığınızdan emin olun
cp .htaccess.dev .htaccess

# 2. Development server başlatın
npm run dev

# 3. Test sayfasını açın
http://localhost:3000/api-test.html
```

### 2. **API Test**
```bash
# Direkt PHP test
curl http://localhost:3000/public/ikas_products.php

# React app üzerinden test
# Browser'da F12 > Console > Network tab
```

### 3. **CSP Test**
```bash
# Browser'da F12 > Console
# CSP violation hatası olmamalı
```

---

## 🛠️ Dosya Değişiklikleri

### ✅ **Düzeltilen Dosyalar:**

1. **`index.html`**
   - CSP meta tag kaldırıldı
   - Artık .htaccess CSP'si kullanılıyor

2. **`public/ikas_products.php`**
   - Gerçek API çağrısı eklendi
   - Hata durumunda fallback ürünler
   - CORS headers düzeltildi

3. **`src/components/sections/CTASection.tsx`**
   - Basitleştirilmiş fetch logic
   - Tek endpoint kullanımı
   - Gelişmiş error handling

4. **`.htaccess.dev`**
   - CSP güncellendi (Ikas API için)
   - PHP routing düzeltildi

5. **`.env`**
   - Vite uyumlu değişkenler eklendi
   - VITE_ prefix kullanımı

6. **`src/services/githubImageService.ts`**
   - Environment variables kullanımı
   - Hard-coded token kaldırıldı

---

## 📊 Beklenen Sonuçlar

### ✅ **Başarılı Durum:**
- Console'da CSP hatası yok
- API çağrısı başarılı (200 OK)
- Ürünler anasayfada görünüyor
- Network tab'da CORS hataları yok

### ❌ **Hala Hata Varsa:**

#### **CSP Hataları Devam Ediyorsa:**
```bash
# .htaccess'i kontrol edin
cat .htaccess | grep "Content-Security-Policy"

# Gerekirse daha gevşek CSP kullanın
# .htaccess.dev'deki CSP'yi kopyalayın
```

#### **API Hataları Devam Ediyorsa:**
```bash
# PHP logs kontrol edin
tail -f /var/log/apache2/error.log

# PHP test edin
php -l public/ikas_products.php

# Direkt access test edin
curl -v http://localhost:3000/public/ikas_products.php
```

#### **GitHub Image Upload Hataları:**
```bash
# .env dosyasını kontrol edin
cat .env | grep VITE_GITHUB

# Token'ın geçerli olduğunu kontrol edin
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
```

---

## 🚀 Son Kontrol Listesi

### Development:
- [ ] `.htaccess.dev` aktif
- [ ] `npm run dev` çalışıyor
- [ ] `/api-test.html` açılıyor
- [ ] Console'da CSP hatası yok
- [ ] API yanıt veriyor

### Production:
- [ ] Ana `.htaccess` aktif  
- [ ] PHP files upload edildi
- [ ] CORS headers çalışıyor
- [ ] SSL sertifikası aktif
- [ ] CDN cache temizlendi

---

## 📞 Acil Durum

Eğer hala sorun yaşıyorsanız:

1. **Tüm cache'i temizleyin:**
   ```bash
   # Browser cache
   Ctrl + Shift + R (hard refresh)
   
   # Vite cache
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Minimal test yapın:**
   ```bash
   # Sadece PHP'yi test edin
   echo '<?php phpinfo(); ?>' > test.php
   ```

3. **Logs kontrol edin:**
   ```bash
   # Browser console
   # Network tab
   # Server error logs
   ```

Bu adımları takip ederek tüm hatalar çözülmeli. Sorun devam ederse, console'dan gelen yeni hata mesajlarını paylaşın.
