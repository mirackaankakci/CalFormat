# .env Dosyası Güvenlik Rehberi

## .env Dosyasını Nasıl Koruyabilirim?

### 1. Web Sunucusunda Koruma
✅ `.htaccess` kuralları eklendi:
```apache
<Files ".env">
    Order Allow,Deny
    Deny from all
</Files>
```

### 2. Git'te Koruma
✅ `.gitignore` dosyasına eklendi:
```
.env*
!.env.example
```

### 3. Dosya İzinleri (Linux/Unix)
```bash
chmod 600 .env          # Sadece owner okuyabilir
chown www-data:www-data .env  # Web server'ın sahipliğinde
```

### 4. Windows IIS için
`web.config` dosyasına ekleyin:
```xml
<configuration>
  <system.webServer>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment=".env" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### 5. Nginx için
```nginx
location ~ /\.env {
    deny all;
    return 404;
}
```

## Güvenlik Kontrolü

### Tarayıcıdan Test Edin:
1. `https://yourdomain.com/.env` - 403/404 döndürmeli
2. `https://yourdomain.com/public/.env` - 403/404 döndürmeli

### Test Endpoint:
- Debug modunda: `https://yourdomain.com/public/security_test.php`

## Üretim Ortamında Ek Önlemler

### 1. Environment Variables Kullanın
```bash
export SIPAY_APP_ID="real_value"
export IKAS_CLIENT_ID="real_value"
```

### 2. Docker Secrets
```yaml
secrets:
  - sipay_secret
  - ikas_secret
```

### 3. Encrypted Storage
- AWS Parameter Store
- Azure Key Vault
- HashiCorp Vault

## Acil Durum Checklist

❌ .env dosyası web'den erişilebilir mi?
❌ .env dosyası git'te commit edildi mi?
❌ Hardcoded credentials var mı?
❌ Log dosyalarında credential gösterildi mi?
❌ Error message'larda credential gösterildi mi?

## Güvenlik Uyarıları

🔴 **KRİTİK**: .env dosyası web erişiminden korunmalı
🟡 **UYARI**: Test credential'ları production'da kullanılmamalı
🟡 **UYARI**: Debug mode production'da kapalı olmalı
🔵 **BİLGİ**: Güvenlik logları düzenli kontrol edilmeli

## İletişim

Güvenlik sorunu tespit ederseniz:
1. Logları kontrol edin: `security.log`
2. Test endpoint'ini çalıştırın
3. .htaccess kurallarını kontrol edin
