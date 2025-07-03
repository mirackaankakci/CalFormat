<?php
// CSP'yi tamamen kaldır
header_remove('Content-Security-Policy');
header_remove('X-Content-Security-Policy');
header_remove('X-WebKit-CSP');
header_remove('X-Frame-Options');
header_remove('Strict-Transport-Security');
header_remove('X-XSS-Protection');
header_remove('X-Content-Type-Options');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS preflight isteği için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debug logging fonksiyonu
function debug_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] " . (is_array($message) || is_object($message) ? json_encode($message) : $message) . PHP_EOL;
    
    try {
        file_put_contents(__DIR__ . '/sipay_confirm_debug.log', $log_message, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("SiPay Confirm Debug: " . $log_message);
    }
}

try {
    debug_log('SiPay Pre-Auth ödeme onay işlemi başlatıldı');
    
    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['invoice_id'])) {
        throw new Exception('Invoice ID gerekli');
    }
    
    $invoice_id = $input['invoice_id'];
    debug_log('Onaylanacak invoice ID: ' . $invoice_id);
    
    // SiPay API ayarları
    $sipay_config = [
        'merchant_key' => 'YOUR_MERCHANT_KEY', // Buraya gerçek merchant key'inizi girin
        'app_id' => 'YOUR_APP_ID',
        'app_secret' => 'YOUR_APP_SECRET',
        'base_url' => 'https://provisioning.sipay.com.tr/ccpayment'
    ];
    
    // Token al
    $token_url = $sipay_config['base_url'] . '/api/token';
    $token_data = [
        'app_id' => $sipay_config['app_id'],
        'app_secret' => $sipay_config['app_secret']
    ];
    
    $token_context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($token_data),
            'timeout' => 30
        ]
    ]);
    
    $token_response = file_get_contents($token_url, false, $token_context);
    
    if ($token_response === FALSE) {
        throw new Exception('Token alma başarısız');
    }
    
    $token_result = json_decode($token_response, true);
    
    if (!isset($token_result['data']['token'])) {
        throw new Exception('Token alınamadı');
    }
    
    $access_token = $token_result['data']['token'];
    debug_log('Access token alındı');
    
    // Confirm payment verilerini hazırla
    $confirm_data = [
        'merchant_key' => $sipay_config['merchant_key'],
        'invoice_id' => $invoice_id
    ];
    
    debug_log('Confirm payment verisi: ' . json_encode($confirm_data));
    
    // SiPay Confirm Payment API'sine istek gönder
    $confirm_url = $sipay_config['base_url'] . '/api/confirmPayment';
    
    $confirm_context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $access_token
            ],
            'content' => json_encode($confirm_data),
            'timeout' => 60
        ]
    ]);
    
    debug_log('Confirm Payment API\'sine istek gönderiliyor: ' . $confirm_url);
    
    $confirm_response = file_get_contents($confirm_url, false, $confirm_context);
    
    if ($confirm_response === FALSE) {
        $error = error_get_last();
        throw new Exception('Confirm Payment API isteği başarısız: ' . $error['message']);
    }
    
    $confirm_result = json_decode($confirm_response, true);
    debug_log('Confirm Payment API yanıtı: ' . json_encode($confirm_result));
    
    // Yanıtı döndür
    echo json_encode([
        'success' => true,
        'data' => $confirm_result
    ]);
    
} catch (Exception $e) {
    debug_log('❌ Confirm Payment hatası: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'confirm_payment_failed',
        'message' => $e->getMessage()
    ]);
}
?>
