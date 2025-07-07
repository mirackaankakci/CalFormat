# SiPay Ödeme Entegrasyonu - CalFormat

Modern, güvenli ve profesyonel SiPay ödeme sistemi entegrasyonu.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler
- **2D Ödeme (Non-Secure)**: Hızlı kart ödemesi
- **3D Ödeme (3D Secure)**: Güvenli SMS doğrulamalı ödeme
- **Token Yönetimi**: 2 saat geçerlilik süreli token önbellekleme
- **Hash Key Doğrulama**: Güvenli hash algoritması ile doğrulama
- **Webhook Desteği**: Ödeme durumu bildirimleri
- **3D Return Handler**: 3D ödeme sonrası güvenli geri dönüş
- **Test Kartları**: Geliştirme için hazır test kartları
- **Güvenlik Modülü**: Rate limiting, CORS, güvenlik başlıkları
- **Modern Frontend**: TypeScript ile tip güvenli servis
- **Loglama**: Güvenlik ve ödeme işlem logları

### 🔧 Teknik Özellikler
- **Backend**: PHP 8.0+ 
- **Frontend**: TypeScript/React
- **Güvenlik**: Güçlü hash doğrulama, input sanitization
- **API**: RESTful JSON API
- **Loglama**: Dosya tabanlı güvenlik logları
- **CORS**: Güvenli domain kontrolü

## 📁 Dosya Yapısı

### Backend (PHP)
```
public/
├── sipay_payment.php       # Ana ödeme API
├── sipay_3d_return.php     # 3D return handler  
├── sipay_webhook.php       # Webhook handler
├── security_new.php        # Güvenlik modülü
├── config.php             # Konfigürasyon
└── sipay_test.html        # Test sayfası
```

### Frontend (TypeScript)
```
src/
├── services/
│   └── siPayService.ts    # SiPay servis sınıfı
├── components/
│   ├── pages/
│   │   └── Checkout.tsx   # Ödeme sayfası
│   └── ui/
│       └── PaymentMethodSelector.tsx
└── contexts/
    └── CartContext.tsx    # Sepet yönetimi
```

## 🔑 SiPay Test Bilgileri

### Test Sunucusu
- **URL**: https://provisioning.sipay.com.tr/ccpayment
- **Merchant ID**: 18309
- **App ID**: 6d4a7e9374a76c15260fcc75e315b0b9

### Test Kartları
```javascript
// Visa
4111 1111 1111 1111
Tarih: 12/25, CVV: 123

// Mastercard  
5555 5555 5555 4444
Tarih: 12/25, CVV: 123

// American Express
3782 8224 6310 005
Tarih: 12/25, CVV: 1234
```

## 🛠️ Kurulum ve Kullanım

### 1. Backend Kurulumu
```bash
# Gerekli PHP uzantıları
- php-curl
- php-openssl
- php-json
- php-mbstring
```

### 2. Konfigürasyon
`public/config.php` dosyasında SiPay ayarlarını güncelleyin:
```php
'sipay' => [
    'test_mode' => true,
    'app_id' => 'your_app_id',
    'app_secret' => 'your_app_secret',
    'merchant_key' => 'your_merchant_key',
    // ...
]
```

### 3. Test Etme
1. `http://localhost/sipay_test.html` adresine gidin
2. Test kartlarından birini seçin
3. Müşteri bilgilerini doldurun
4. 2D veya 3D ödeme türünü seçin
5. "Ödemeyi Başlat" butonuna tıklayın

## 📋 API Endpoints

### POST /sipay_payment.php
Ana ödeme işlemi endpoint'i
```json
{
  "cc_holder_name": "Test Kullanici",
  "cc_no": "4111111111111111",
  "expiry_month": "12",
  "expiry_year": "2025",
  "cvv": "123",
  "currency_code": "TRY",
  "installments_number": 1,
  "total": 100.00,
  "payment_type": "3D",
  "name": "Test",
  "surname": "Kullanici",
  "bill_email": "test@example.com",
  "bill_phone": "05551234567",
  "items": "[{\"name\":\"Ürün\",\"price\":\"100\",\"quantity\":1}]",
  "cancel_url": "https://domain.com/cancel",
  "return_url": "https://domain.com/success"
}
```

### GET /sipay_payment.php
API durum kontrolü
```json
{
  "success": true,
  "service": "SiPay Ödeme API",
  "version": "1.0.0",
  "endpoints": ["token", "2D", "3D", "webhook"],
  "test_mode": true
}
```

### POST /sipay_3d_return.php
3D ödeme sonrası geri dönüş
```json
{
  "success": true,
  "payment_successful": true,
  "transaction_data": {
    "sipay_status": "1",
    "invoice_id": "TEST-123456",
    "total": 100.00,
    "hash_validated": true
  }
}
```

### POST /sipay_webhook.php
Webhook bildirimleri
```json
{
  "success": true,
  "webhook_processed": true,
  "payment_status": "COMPLETED",
  "action": "payment_completed"
}
```

## 🔒 Güvenlik Özellikleri

### Hash Key Doğrulama
```php
// Hash oluşturma (SiPay standart algoritması)
function generateHashKey($total, $installment, $currency_code, 
                        $merchant_key, $invoice_id, $app_secret) {
    $data = $total.'|'.$installment.'|'.$currency_code.'|'.$merchant_key.'|'.$invoice_id;
    // AES-256-CBC şifreleme ile hash oluştur
}

// Hash doğrulama
function validateHashKey($hashKey, $secretKey) {
    // Şifrelenmiş hash'i çöz ve doğrula
}
```

### Güvenlik Kontrolleri
- **Rate Limiting**: IP bazlı istek limiti
- **Input Sanitization**: XSS ve SQL injection koruması
- **CORS**: İzinli domain kontrolü
- **SSL/HTTPS**: Şifreli veri aktarımı
- **Güvenlik Başlıkları**: X-Frame-Options, CSP, vb.

## 📊 Loglama

### Güvenlik Logları
```
public/logs/security_YYYY-MM-DD.log
```
```json
{
  "timestamp": "2024-01-01 12:00:00",
  "level": "INFO",
  "message": "SiPay payment request",
  "ip": "192.168.1.1",
  "context": {
    "payment_type": "3D",
    "total": 100.00,
    "invoice_id": "TEST-123"
  }
}
```

### Webhook Logları
```
public/logs/sipay_webhook_YYYY-MM-DD.log
```

## 🔄 Ödeme Akışı

### 2D Ödeme (Non-Secure)
1. Frontend → `sipay_payment.php` (POST)
2. Token alma (`/api/token`)
3. Ödeme işlemi (`/api/paySmart2D`)
4. Anında sonuç döndürme

### 3D Ödeme (Secure)
1. Frontend → `sipay_payment.php` (POST)
2. Token alma (`/api/token`)
3. 3D form oluşturma (`/api/paySmart3D`)
4. HTML form döndürme
5. Kullanıcı banka sayfasına yönlendirme
6. SMS doğrulama
7. `sipay_3d_return.php`'ye geri dönüş
8. Hash doğrulama ve sonuç

## 🧪 Test Senaryoları

### Başarılı Test
1. Test kartı: `4111111111111111`
2. CVV: `123`, Tarih: `12/25`
3. Tutar: `100.00 TRY`
4. Taksit: `1` (Tek çekim)

### Başarısız Test
1. Geçersiz kart: `1234567890123456`
2. Geçersiz CVV: `000`
3. Geçmiş tarih: `01/20`

## ⚡ Performans

### Token Önbellekleme
- Token geçerlilik: 2 saat
- Önbellek mekanizması ile tekrar kullanım
- Gereksiz API çağrılarını önleme

### Rate Limiting
- IP bazlı: 100 istek/dakika
- Güvenlik koruması
- DDoS önleme

## 🔧 Geliştirme Notları

### Production'a Geçiş
1. `config.php`'de `test_mode: false`
2. Gerçek SiPay bilgilerini girin
3. SSL sertifikası aktif edin
4. Debug modunu kapatın
5. Error reporting'i kapatın

### İzleme ve Bakım
- Log dosyalarını düzenli kontrol edin
- Rate limit ayarlarını ihtiyaca göre düzenleyin
- Güvenlik güncellemelerini takip edin
- Token önbellek süresini optimize edin

## 📞 Destek

### SiPay Resmi Dokümantasyon
- https://developer.sipay.com.tr/

### CalFormat Geliştirici
- Güvenlik sorunları için hemen bildirim yapın
- Test ortamında önce doğrulayın
- Log dosyalarını paylaşın

## 📄 Lisans

Bu kod CalFormat projesi için geliştirilmiştir.
SiPay entegrasyonu resmi dokümantasyona uygun olarak kodlanmıştır.
