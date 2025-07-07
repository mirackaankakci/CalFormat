# Sipay Hash Key Entegrasyonu - Çözüm Rehberi

## 🎯 Problem
Sipay ödeme entegrasyonunda "Invalid hash key" hatası alınıyor. Hash key formatının Sipay API'sinin beklediği formatta gönderilmesi gerekiyor.

## 🔧 Yapılan İyileştirmeler

### 1. Güncellenen Dosyalar

#### `sipay_payment.php` - Ana Ödeme Dosyası
- **Hash key üretimi aktif hale getirildi**
- **Otomatik format deneme sistemi eklendi**
- **6 farklı hash formatını sırayla test ediyor**
- **Başarılı format bulunduğunda o formatı kullanıyor**

#### `sipay_hash_test_new.php` - Kapsamlı Test Aracı
- **15 farklı hash formatını test eder**
- **4 farklı hash algoritması (SHA256, SHA1, MD5, SHA512)**
- **Otomatik test modu**
- **Tek format test modu**

#### `sipay_hash_tester.html` - Web Arayüzü
- **Kullanıcı dostu test arayüzü**
- **Gerçek zamanlı test sonuçları**
- **Progress bar ile test durumu**
- **Başarılı format raporlama**

#### `sipay_hash_verify.php` - Basit Doğrulama Aracı
- **En yaygın 5 formatı test eder**
- **Minimal veri ile hızlı test**
- **API yanıtlarını analiz eder**

### 2. Hash Format Varyasyonları

```php
// Format 1: En yaygın format
$hashString = $invoice_id . $total_cents . $currency_code . $merchant_key;
$hashKey = hash('sha256', $hashString);

// Format 2: Merchant ID ile
$hashString = $merchant_id . $invoice_id . $total_cents . $currency_code;
$hashKey = hash('sha256', $hashString);

// Format 3: Decimal format
$hashString = $invoice_id . $total_decimal . $currency_code . $merchant_key;
$hashKey = hash('sha256', $hashString);

// Format 4: Pipe separated
$hashString = $invoice_id . '|' . $total_cents . '|' . $currency_code . '|' . $merchant_key;
$hashKey = hash('sha256', $hashString);

// Format 5: MD5 algoritması
$hashString = $invoice_id . $total_cents . $currency_code . $merchant_key;
$hashKey = md5($hashString);

// Format 6: Ters sıralama
$hashString = $merchant_key . $currency_code . $total_cents . $invoice_id;
$hashKey = hash('sha256', $hashString);
```

### 3. Otomatik Format Deneme Sistemi

Ana ödeme dosyasında (`sipay_payment.php`):

```php
// İlk format ile dene
$paymentData['hash_key'] = generatePaymentHashKey($paymentData, $merchantKey, $merchantId);

// Başarısız olursa alternatif formatları dene
if ($paymentHttpCode !== 200 || hash_error_detected) {
    foreach ($alternativeHashes as $hashName => $hashValue) {
        // Her formatı sırayla dene
        $paymentData['hash_key'] = $hashValue;
        // API çağrısı yap
        if (success) {
            break; // Çalışan format bulundu
        }
    }
}
```

## 🧪 Test Araçları Kullanımı

### 1. Web Arayüzü Testi
```
https://yourdomain.com/sipay_hash_tester.html
```
- Tarayıcıda açın
- "Tüm Formatları Test Et" butonuna tıklayın
- Başarılı formatı bekleyin

### 2. API Test Aracı
```
https://yourdomain.com/sipay_hash_test_new.php?action=auto_test
```
- Tüm formatları otomatik test eder
- JSON yanıt döner
- Başarılı formatı raporlar

### 3. Basit Doğrulama
```
https://yourdomain.com/sipay_hash_verify.php?action=test_all
```
- En yaygın 5 formatı test eder
- Hızlı sonuç verir

### 4. Tek Format Testi
```
https://yourdomain.com/sipay_hash_test_new.php?action=test&pattern=1&hash_type=sha256
```
- Belirli bir formatı test eder
- Pattern: 1-15 arası
- Hash type: sha256, sha1, md5, sha512

## 📋 Sonraki Adımlar

### 1. Test Çalıştırın
1. `sipay_hash_tester.html` dosyasını tarayıcıda açın
2. "Tüm Formatları Test Et" butonuna tıklayın
3. Sonucu bekleyin (1-2 dakika sürebilir)

### 2. Başarılı Format Bulunursa
1. Hangi formatın çalıştığını not alın
2. `sipay_payment.php` dosyasında `generatePaymentHashKey` fonksiyonunu o formata göre güncelleyin
3. Test ödemesi yapın

### 3. Hiçbir Format Çalışmazsa
1. Test sonuçlarını kontrol edin
2. Sipay teknik destek ile iletişime geçin
3. Test sonuçlarını Sipay'e gönderin
4. Doğru hash formatını isteyin

### 4. Prodüksiyon Hazırlığı
1. Çalışan formatı doğrulayın
2. Debug loglarını kaldırın
3. Error handling'i güçlendirin
4. Monitoring ekleyin

## 🔍 Debug Bilgileri

### Log Dosyaları
- PHP error log'ları kontrol edin
- `error_log()` fonksiyonları ile debug bilgileri eklendi

### API Yanıtları
- HTTP status kodları
- Sipay error mesajları
- Hash key detayları

### Test Verileri
```json
{
  "invoice_id": "TEST_1234567890",
  "total": 10050,  // 100.50 TL (cent cinsinden)
  "currency_code": "TRY",
  "merchant_key": "$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO",
  "merchant_id": "18309"
}
```

## 🚨 Önemli Notlar

### Güvenlik
- Hash key'ler loglanıyor (test amaçlı)
- Prodüksiyonda hassas bilgileri log'lamayın
- HTTPS kullanın

### Performance
- Otomatik format deneme sistemi ek API çağrıları yapıyor
- Başarılı format bulunduğunda bu sistemi devre dışı bırakın
- Rate limiting'e dikkat edin

### Sipay Test Kartları
```
Kart No: 4444444444444448
Son Kullanma: 12/25
CVV: 123
```

## 📞 Destek

### Test Başarısızsa
1. Sipay teknik destek: [support@sipay.com.tr]
2. Test sonuçlarını paylaşın
3. Doğru hash formatını isteyin

### Başarılı Format Bulunursa
1. Format bilgisini kaydedin
2. Prodüksiyon testleri yapın
3. Monitoring ekleyin

---

**Son Güncelleme:** $(date)
**Test Durumu:** Aktif
**Hash Format:** Otomatik deneme aktif
