<?php
// Güvenli Configuration Endpoint
require_once __DIR__ . '/security.php';

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

// SiPay ve Ikas Mağaza Ayarları
// Bu dosyayı güvenli bir yerde tutun ve gerçek production değerleri ile güncelleyin

return [
    // SiPay Ayarları
    'sipay' => [
        'app_id' => getenv('SIPAY_APP_ID') ?: '6d4a7e9374a76c15260fcc75e315b0b9',
        'app_secret' => getenv('SIPAY_APP_SECRET') ?: 'b46a67571aa1e7ef5641dc3fa6f1712a',
        'merchant_key' => getenv('SIPAY_MERCHANT_KEY') ?: 'test_merchant_key',
        'base_url' => getenv('SIPAY_BASE_URL') ?: 'https://provisioning.sipay.com.tr/ccpayment',
        'test_mode' => getenv('SIPAY_TEST_MODE') === 'false' ? false : true,
        
        // Test kartları
        'test_cards' => [
            'visa' => [
                'card_number' => '4508034508034509',
                'expiry_month' => '12',
                'expiry_year' => '2026',
                'cvv' => '000'
            ],
            'mastercard' => [
                'card_number' => '5406675406675403',
                'expiry_month' => '12',
                'expiry_year' => '2026',
                'cvv' => '000'
            ]
        ]
    ],
    
    // Ikas Ayarları
    'ikas' => [
        'base_url' => getenv('IKAS_BASE_URL') ?: 'https://api.myikas.com',
        'store_id' => getenv('IKAS_STORE_ID') ?: 'calformat-demo',
        'client_id' => getenv('IKAS_CLIENT_ID') ?: 'your_client_id',
        'client_secret' => getenv('IKAS_CLIENT_SECRET') ?: 'your_client_secret',
        'api_token' => getenv('IKAS_API_TOKEN') ?: 'your_ikas_api_token',
        'test_mode' => true // Geçici olarak true yapıldı
    ],
    
    // Genel Ayarlar
    'general' => [
        'currency' => 'TRY',
        'default_shipping_cost' => 29.90,
        'free_shipping_threshold' => 150.00,
        'timezone' => 'Europe/Istanbul',
        'debug_mode' => getenv('DEBUG_MODE') === 'true'
    ],
    
    // Frontend URL
    'frontend_url' => getenv('FRONTEND_URL') ?: 'http://localhost:5173/checkout',
    
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
