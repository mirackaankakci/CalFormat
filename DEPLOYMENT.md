# 🚀 CalFormat Production Deployment Guide

## 📋 .env Dosyası Nasıl Oluşturulur?

### Adım 1: SiPay Production Credentials Alma

1. **SiPay Merchant Panel'e Giriş Yapın:**
   - https://merchant.sipay.com.tr adresine gidin
   - Üye işyeri hesabınızla giriş yapın

2. **Production API Keys Alın:**
   - Sol menüden "API Ayarları" veya "Integration" bölümüne gidin
   - **Production** environment'ı seçin (Test değil!)
   - Aşağıdaki bilgileri kopyalayın:
     - `APP_ID` (Uygulama ID)
     - `APP_SECRET` (Uygulamanızın gizli anahtarı)
     - `MERCHANT_KEY` (Merchant Anahtarı)
     - `MERCHANT_ID` (Merchant ID)
   
   ⚠️ **NOT**: Hash Key otomatik oluşturulur, manuel almaya gerek yok!

### Adım 2: Server'da .env Dosyası Oluşturma

**Web server'ınızda** (hosting/VPS/dedicated server) aşağıdaki adımları takip edin:

#### Yöntem 1: cPanel File Manager ile
1. cPanel'e giriş yapın
2. File Manager'ı açın
3. Public_html klasörüne gidin
4. "New File" butonuna tıklayın
5. Dosya adını `.env` yazın
6. Dosyayı açın ve aşağıdaki template'i yapıştırın

#### Yöntem 2: SSH ile
```bash
# SSH ile server'a bağlanın
ssh kullanici@sunucu-ip

# Website klasörüne gidin
cd /public_html  # veya sitenizin root klasörü

# .env dosyasını oluşturun
nano .env
```

### Adım 3: .env İçeriği (Template)

Aşağıdaki template'i `.env` dosyasına kopyalayın ve **YOUR_*** kısımlarını gerçek değerlerle değiştirin:

```bash
# === SiPay Production Credentials ===
# ⚠️ Hash Key otomatik oluşturulur, sadece aşağıdaki 4 değeri girin:
SIPAY_APP_ID=1234567890
SIPAY_APP_SECRET=abcd1234efgh5678ijkl9012mnop3456
SIPAY_MERCHANT_KEY=$2y$10$abcdefghijklmnopqrstuvwxyz1234567890
SIPAY_MERCHANT_ID=1234567890

# === URLs (Kendi domain'inizle değiştirin) ===
SIPAY_BASE_URL=https://provisioning.sipay.com.tr/ccpayment
SIPAY_WEBHOOK_URL=https://DOMAIN.com.tr/sipay_webhook.php
SIPAY_RETURN_URL=https://DOMAIN.com.tr/sipay_3d_return.php
FRONTEND_URL=https://DOMAIN.com.tr

# === Ikas Production Credentials ===
IKAS_BASE_URL=https://api.myikas.com
IKAS_STORE_ID=calformat
IKAS_CLIENT_ID=9ca242da-2ce0-44b5-8b3f-4d31e6a94958
IKAS_CLIENT_SECRET=s_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32
IKAS_API_TOKEN=PRODUCTION_IKAS_TOKEN

# === Security ===
ENCRYPTION_KEY=CalFormat2024ProductionSecureKey123!@#
ALLOWED_ORIGINS=https://DOMAIN.com.tr,https://www.DOMAIN.com.tr
DEBUG_MODE=false
LOG_LEVEL=ERROR

# === Production Deployment ===
DEPLOYMENT_ENV=production
SESSION_NAME=CALFORMAT_SESSION
SESSION_LIFETIME=3600
SESSION_SECURE=true
SESSION_HTTPONLY=true
```

### Adım 4: Dosya İzinleri

**.env dosyasının güvenliğini sağlayın:**

```bash
# Sadece owner okuyabilsin
chmod 600 .env

# veya cPanel'de File Manager > Properties > Permissions: 600
```

### Adım 5: Test Etme

1. **Küçük test ödeme yapın:**
   - 1₺ ile test edin
   - 3D Secure akışını kontrol edin

2. **Log dosyalarını kontrol edin:**
   ```bash
   tail -f logs/php_errors.log
   tail -f logs/security.log
   ```

## ⚠️ UYARILAR

1. **Asla .env dosyasını git'e commit etmeyin!**
2. **Backup alırken .env dosyasını güvenli yerde saklayın**
3. **Production credentials'ları test ortamında kullanmayın**
4. **Credentials'ları kimseyle paylaşmayın**

## 🆘 Sorun Giderme

### .env dosyası okunmuyor:
- Dosya izinlerini kontrol edin (600)
- Dosya yolunu kontrol edin (root klasörde olmalı)
- PHP cache'ini temizleyin

### SiPay credentials hatalı:
- SiPay merchant panel'den tekrar kontrol edin
- Test/Production environment'ını doğrulayın
- Hash key'in doğru olduğundan emin olun

### SSL/HTTPS sorunu:
- SSL certificate'in aktif olduğunu kontrol edin
- Mixed content hatalarını çözün
- Webhook URL'lerinin HTTPS olduğunu doğrulayın

## 📞 Go-Live Checklist

- [ ] .env dosyası server'da oluşturuldu
- [ ] SiPay production credentials doğru girildi
- [ ] Domain URL'leri düzenlendi
- [ ] SSL certificate aktif
- [ ] File permissions ayarlandı
- [ ] Test ödeme başarılı
- [ ] Error logs temiz
- [ ] 3D Secure akışı çalışıyor

**🎉 Artık production'da çalışıyorsunuz!**

## 📋 Pre-Deployment Checklist

### 1. SiPay Production Credentials
- [ ] Production App ID from SiPay
- [ ] Production App Secret from SiPay  
- [ ] Production Merchant Key from SiPay
- [ ] Production Merchant ID from SiPay
- [ ] Production Hash Key from SiPay

### 2. Environment Setup
- [ ] Create `.env` file from `.env.example`
- [ ] Update all production credentials in `.env`
- [ ] Verify SSL certificate is installed
- [ ] Configure DNS to point to production server

### 3. Security
- [ ] Change encryption keys
- [ ] Update allowed origins to production domains
- [ ] Verify HTTPS is working
- [ ] Test CORS settings

## 🚀 Deployment Steps

### Step 1: Build for Production
```bash
npm run deploy
```

### Step 2: Upload Files
Upload the following to your production server:
- All files from `dist/` folder
- All PHP files from `public/` folder
- `.htaccess` file

### Step 3: Server Configuration
1. Ensure PHP 7.4+ is installed
2. Enable required PHP extensions:
   - curl
   - json
   - openssl
   - mbstring
3. Set proper file permissions

### Step 4: Environment Variables
Create `.env` file on server with production values:
```bash
cp .env.example .env
# Edit .env with production values
```

### Step 5: Test Payment Flow
1. Test with small amount (1 TL)
2. Verify 3D Secure works
3. Check webhook responses
4. Test failed payment scenarios

## 🔧 Production Configuration

### Web Server (Apache/Nginx)
- Document root should point to your domain
- Enable HTTPS/SSL
- Configure proper redirects

### PHP Configuration
```ini
display_errors = Off
log_errors = On
error_log = /path/to/logs/php_errors.log
memory_limit = 256M
max_execution_time = 30
```

### File Structure on Server
```
/public_html/
├── index.html (built React app)
├── assets/ (JS/CSS files)
├── *.php (API files)
├── .htaccess
├── .env
└── logs/ (create this directory)
```

## 🔍 Testing in Production

### Payment Tests
1. **Small Amount Test**: 1 TL payment
2. **Card Verification**: Test with real cards
3. **3D Secure Flow**: Verify bank integration
4. **Failed Payments**: Test invalid cards
5. **Webhook Response**: Check callback handling

### Security Tests
1. **HTTPS Verification**: All pages load over HTTPS
2. **CORS Testing**: Cross-origin requests work
3. **Input Validation**: Form security
4. **Error Handling**: No sensitive data exposed

## 📞 Support Contacts

### SiPay Integration Support
- Email: [SiPay Support Email]
- Phone: [SiPay Support Phone]
- Documentation: https://sipay.com.tr/

### Ikas Integration Support  
- Email: [Ikas Support Email]
- Documentation: https://ikas.com/

## 🚨 Troubleshooting

### Common Issues

#### "Invalid Credentials" Error
- Verify production credentials in `.env`
- Check SiPay account status
- Ensure test_mode is set to false

#### Payment Not Processing
- Check PHP error logs
- Verify webhook URLs are accessible
- Test 3D Secure URLs

#### CORS Errors
- Update allowed origins in config
- Check .htaccess CORS headers
- Verify domain configuration

### Log Files to Check
- PHP Error Log: `/path/to/logs/php_errors.log`
- Security Log: Generated by security_new.php
- SiPay API Logs: Check payment request/response logs

## 📋 Post-Deployment Checklist

- [ ] Payment flow works end-to-end
- [ ] 3D Secure authentication working
- [ ] Webhooks receiving responses
- [ ] Error pages display correctly
- [ ] SSL certificate valid
- [ ] SEO meta tags loading
- [ ] Contact forms working
- [ ] Product catalog loading
- [ ] Cart functionality working
- [ ] User registration/login working
- [ ] Admin panel accessible

## 🔄 Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Test payment flow monthly
- Backup configuration files
- Monitor SSL certificate expiry

### Updates
```bash
# Pull latest changes
git pull origin main

# Build and deploy
npm run deploy

# Upload changed files to server
```

## 📊 Monitoring

Set up monitoring for:
- Payment success/failure rates
- API response times
- Error frequency
- Security log alerts
- SSL certificate expiry

---

**⚠️ IMPORTANT**: This is a production environment. All payments are real and will charge actual money. Test thoroughly before going live!
