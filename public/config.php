<?php
// Güvenli Configuration Endpoint
require_once __DIR__ . '/security_new.php';

// Load environment variables
$envFile = __DIR__ . '/.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    if ($lines === false) {
        error_log("ENV dosyası okunamadı: " . $envFile);
    } else {
        foreach ($lines as $line) {
            if (empty(trim($line)) || strpos(trim($line), '#') === 0) {
                continue;
            }
            
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }
            
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            
            if (!empty($key)) {
                putenv(sprintf('%s=%s', $key, $value));
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
} else {
    error_log("ENV dosyası bulunamadı: " . $envFile);
}

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
return [
    // Ikas Ayarları
    'ikas' => [
        'base_url' => getenv('IKAS_BASE_URL'),
        'store_id' => getenv('IKAS_STORE_ID'),
        'client_id' => getenv('IKAS_CLIENT_ID'),
        'client_secret' => getenv('IKAS_CLIENT_SECRET'),
        'api_token' => getenv('IKAS_API_TOKEN'),
        'test_mode' => false,
        
        // API URL'leri
        'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
        'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql',
        'store_api_url' => 'https://calformat.myikas.com/api',
        
        // Sabit değerler - İkas siparişi için
        'defaults' => [
            'country' => 'Türkiye',
            'default_city' => 'İstanbul',
            'default_city_id' => 'fb123456-7890-abcd-ef12-345678901001',
            'default_district' => 'Beykoz',
            'default_district_id' => 'fb123456-7890-abcd-ef12-345678901242',
            'default_note' => 'test siparişi',
            'deleted' => false,
            'isDefault' => false,
            'fallback_product_id' => '8c64cc8a-7950-49e3-8739-36bcfc1db7fa',
            'fallback_variant_id' => '7868c357-4726-432a-ad5d-49619e6a508b'
        ]
    ],
    
    // SiPay Ödeme Sistemi
    'sipay' => [
        'test_mode' => filter_var(getenv('SIPAY_TEST_MODE'), FILTER_VALIDATE_BOOLEAN),
        'base_url' => getenv('SIPAY_BASE_URL'),
        'app_id' => getenv('SIPAY_APP_ID'),
        'app_secret' => getenv('SIPAY_APP_SECRET'),
        'merchant_key' => getenv('SIPAY_MERCHANT_KEY'),
        'merchant_id' => getenv('SIPAY_MERCHANT_ID'),
        
        // API URL'leri
        'token_url' => '/api/token',
        'payment_2d_url' => '/api/paySmart2D',
        'payment_3d_url' => '/api/paySmart3D',
        'complete_payment_url' => '/payment/complete',
        'check_status_url' => '/api/checkstatus',
        
        // Güvenlik ve Diğer Ayarlar
        'timeout' => 30,
        'currency' => 'TRY',
        'payment_methods' => ['2D', '3D'],
        'max_installments' => 12,
        
        // Webhook URL'leri
        'webhook_url' => getenv('SIPAY_WEBHOOK_URL'),
        'return_url' => getenv('SIPAY_RETURN_URL'),
        'cancel_url' => getenv('SIPAY_CANCEL_URL'),
        
        // Test kartları
        'test_cards' => [
            'visa_primary' => '4508034508034509',
            'visa_secondary' => '4111111111111111',
            'mastercard' => '5406675406675403',
            'amex' => '378282246310005'
        ]
    ],
    
    // Genel Ayarlar
    'general' => [
        'currency' => 'TRY',
        'default_shipping_cost' => 0.00,
        'free_shipping_threshold' => 150.00,
        'timezone' => getenv('TIMEZONE') ?: 'Europe/Istanbul',
        'debug_mode' => filter_var(getenv('DEBUG_MODE'), FILTER_VALIDATE_BOOLEAN)
    ],
    
    // Frontend URL
    'frontend_url' => getenv('FRONTEND_URL'),
    
    // Güvenlik Ayarları
    'security' => [
        'allowed_origins' => explode(',', getenv('ALLOWED_ORIGINS')),
        'hash_algorithm' => 'sha256',
        'encryption_key' => getenv('ENCRYPTION_KEY'),
        'rate_limit' => [
            'max_requests' => 100,
            'time_window' => 60
        ],
        'max_request_size' => 1048576
    ]
];
?>
