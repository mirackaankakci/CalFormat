<?php
// Güvenli Configuration Endpoint
require_once __DIR__ . '/security_new.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

// Bu dosya sadece dahili kullanım için
if (!defined('INTERNAL_ACCESS')) {
    securityLog('Unauthorized config access attempt', 'WARNING', ['ip' => getClientIP()]);
    http_response_code(403);
    exit('Access denied');
}

// Ikas Mağaza Ayarları ve SiPay Ödeme Sistemi
// Bu dosyayı güvenli bir yerde tutun ve gerçek production değerleri ile güncelleyin

return [
    // Ikas Ayarları
    'ikas' => [
        'base_url' => getenv('IKAS_BASE_URL') ?: 'https://api.myikas.com',
        'store_id' => getenv('IKAS_STORE_ID') ?: 'calformat',
        'client_id' => getenv('IKAS_CLIENT_ID') ?: '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
        'client_secret' => getenv('IKAS_CLIENT_SECRET') ?: 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
        'api_token' => getenv('IKAS_API_TOKEN') ?: 'your_ikas_api_token',
        'test_mode' => false, // PRODUCTION MODU
        
        // API URL'leri
        'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
        'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql',
        'store_api_url' => 'https://calformat.myikas.com/api',
        
        // Sabit değerler - İkas siparişi için
        'defaults' => [
            'country' => 'Türkiye',
            'default_city' => 'İstanbul',
            'default_city_id' => 'fb123456-7890-abcd-ef12-345678901001', // İkas UUID format
            'default_district' => 'Beykoz',
            'default_district_id' => 'fb123456-7890-abcd-ef12-345678901242', // İkas UUID format
            'default_note' => 'test siparişi',
            'deleted' => false,
            'isDefault' => false,
            // Fallback değerler - sadece acil durumlarda kullanılır
            'fallback_product_id' => '8c64cc8a-7950-49e3-8739-36bcfc1db7fa',
            'fallback_variant_id' => '7868c357-4726-432a-ad5d-49619e6a508b'
        ]
    ],
    
    // SiPay Ödeme Sistemi
    'sipay' => [
        'test_mode' => false, // PRODUCTION MODU
        'base_url' => getenv('SIPAY_BASE_URL') ?: 'https://app.sipay.com.tr/ccpayment',
        
        // PRODUCTION Üye İşyeri Bilgileri - SiPay'den alınacak
        'app_id' => getenv('SIPAY_APP_ID') ?: 'e19759a62999b8df7d52eccfb4ef84ee', // Production App ID
        'app_secret' => getenv('SIPAY_APP_SECRET') ?: 'd5b0fcc23409624afda95346573fe45e', // Production App Secret
        'merchant_key' => getenv('SIPAY_MERCHANT_KEY') ?: '$2y$10$FF.kEML08eIwoWrSBRNB6.k1LOnX6yekGmB3wjDTe6c22Aaent8US', // PRODUCTION MERCHANT KEY
        'merchant_id' => getenv('SIPAY_MERCHANT_ID') ?: '27386930', // Production Merchant ID
        
        // API URL'leriyyy
        'token_url' => '/api/token',
        'payment_2d_url' => '/api/paySmart2D',
        'payment_3d_url' => '/api/paySmart3D',
        'complete_payment_url' => '/payment/complete',
        'check_status_url' => '/api/checkstatus',
        
        // Güvenlik ve Diğer Ayarlar
        'timeout' => 30, // Saniye
        'currency' => 'TRY',
        'payment_methods' => ['2D', '3D'],
        'max_installments' => 12,
        
        // Webhook URL'leri - PRODUCTION
        'webhook_url' => getenv('SIPAY_WEBHOOK_URL') ?: 'https://calformat.com/sipay_webhook.php',
        'return_url' => getenv('SIPAY_RETURN_URL') ?: 'https://calformat.com/sipay_3d_return.php',
        'cancel_url' => getenv('SIPAY_CANCEL_URL') ?: 'https://calformat.com/sipay_3d_return.php?status=cancel',
        
        // Test kartları (sadece test modunda kullanılır) - SiPay resmi test kartları
        'test_cards' => [
            'visa_primary' => '4508034508034509', // SiPay resmi test kartı
            'visa_secondary' => '4111111111111111', // Alternatif test kartı
            'mastercard' => '5406675406675403', // SiPay Mastercard test kartı
            'amex' => '378282246310005'
        ]
    ],
    
    // Genel Ayarlar
    'general' => [
        'currency' => 'TRY',
        'default_shipping_cost' => 0.00, // ✅ Düzeltildi: Ücretsiz kargo için 0₺
        'free_shipping_threshold' => 150.00, // ✅ Düzeltildi: 150₺ üzeri ücretsiz kargo
        'timezone' => 'Europe/Istanbul',
        'debug_mode' => false // PRODUCTION - Debug kapalı
    ],
    
    // Frontend URL - PRODUCTION
    'frontend_url' => getenv('FRONTEND_URL') ?: 'https://calformat.com',
    
    // Güvenlik Ayarları
    'security' => [
        'allowed_origins' => explode(',', getenv('ALLOWED_ORIGINS') ?: 'https://calformat.com,https://www.calformat.com'),
        'hash_algorithm' => 'sha256',
        'encryption_key' => getenv('ENCRYPTION_KEY') ?: 'CalFormat2024!@#$',
        'rate_limit' => [
            'max_requests' => 100,
            'time_window' => 60
        ],
        'max_request_size' => 1048576 // 1MB
    ]
];
?>
