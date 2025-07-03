# Ikas API Token Yenileme Rehberi

## 1. Ikas Admin Paneline Giriş
- https://calformat.myikas.com/admin/login
- Admin hesabınızla giriş yapın

## 2. API Token Oluşturma
- Settings > Integrations > API Keys
- "Create New API Key" butonuna tıklayın
- İsim: "CalFormat Production API"

## 3. Yetkileri Aktif Edin
✅ Products (Read/Write)
✅ Orders (Read/Write) 
✅ Customers (Read/Write)
✅ GraphQL API Access
✅ Webhook Access
✅ Inventory Management
✅ Shipping Methods
✅ Payment Methods

## 4. Token'ı Kopyalayın
- Oluşturulan token'ı .env dosyasına ekleyin
- IKAS_API_TOKEN=yeni_token_buraya

## 5. Test Edin
- php ikas_products.php
- Cities ve districts endpointlerini test edin
