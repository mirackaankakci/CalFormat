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
        'store_id' => getenv('IKAS_STORE_ID') ?: 'calformat-demo',
        'client_id' => getenv('IKAS_CLIENT_ID') ?: 'your_client_id',
        'client_secret' => getenv('IKAS_CLIENT_SECRET') ?: 'your_client_secret',
        'api_token' => getenv('IKAS_API_TOKEN') ?: 'your_ikas_api_token',
        'test_mode' => true // Geçici olarak true yapıldı
    ],
    
    // SiPay Ödeme Sistemi
    'sipay' => [
        'test_mode' => getenv('SIPAY_TEST_MODE') !== 'false', // Test modunda
        'base_url' => getenv('SIPAY_BASE_URL') ?: 'https://app.sipay.com.tr/ccpayment',
        
        // Test Üye İşyeri Bilgileri
        'app_id' => getenv('SIPAY_APP_ID') ?: 'e19759a62999b8df7d52eccfb4ef84ee',
        'app_secret' => getenv('SIPAY_APP_SECRET') ?: 'd5b0fcc23409624afda95346573fe45e',
        'merchant_key' => getenv('SIPAY_MERCHANT_KEY') ?: '$2y$10$FF.kEML08eIwoWrSBRNB6.k1LOnX6yekGmB3wjDTe6c22Aaent8US',
        'merchant_id' => getenv('SIPAY_MERCHANT_ID') ?: '27386930',
        
        // API URL'leri
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
        
        // Webhook URL'leri
        'webhook_url' => getenv('SIPAY_WEBHOOK_URL') ?: 'https://calformat.com.tr/sipay_webhook.php',
        'return_url' => getenv('SIPAY_RETURN_URL') ?: 'https://calformat.com.tr/sipay_3d_return.php',
        
        // Test kartları (sadece test modunda kullanılır)
        'test_cards' => [
            'visa' => '4111111111111111',
            'mastercard' => '5555555555554444',
            'amex' => '378282246310005'
        ]
    ],
    
    // Genel Ayarlar
    'general' => [
        'currency' => 'TRY',
        'default_shipping_cost' => 29.90,
        'free_shipping_threshold' => 150.00, // ✅ Düzeltildi: 150₺ üzeri ücretsiz kargo
        'timezone' => 'Europe/Istanbul',
        'debug_mode' => getenv('DEBUG_MODE') === 'true'
    ],
    
    // Frontend URL
    'frontend_url' => getenv('FRONTEND_URL') ?: 'http://localhost:5173',
    
    // Güvenlik Ayarları
    'security' => [
        'allowed_origins' => explode(',', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://localhost:3000,https://calformat.com.tr,https://www.calformat.com.tr'),
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
