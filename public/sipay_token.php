<?php
// CSP'yi tamamen kaldır
header_remove('Content-Security-Policy');
header_remove('X-Content-Security-Policy');
header_remove('X-WebKit-CSP');
header_remove('X-Frame-Options');
header_remove('Strict-Transport-Security');
header_remove('X-XSS-Protection');
header_remove('X-Content-Type-Options');

// CORS headers - daha geniş izinler
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
    
    // Log dosyasına yazma izni var mı kontrol et
    $log_file = __DIR__ . '/sipay_debug.log';
    
    try {
        file_put_contents($log_file, $log_message, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        // Log yazamıyorsa error_log kullan
        error_log("SiPay Debug: " . $log_message);
    }
}

try {
    debug_log('SiPay Token API çağrısı başlatıldı');
    
    // Config dosyasından ayarları al
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];
    
    // Test environment'ta hemen test token döndür
    $is_test_mode = $sipayConfig['test_mode']; // Config'den test modu al
    
    if ($is_test_mode) {
        debug_log('Test modu aktif - test token döndürülüyor');
        echo json_encode([
            'success' => true,
            'data' => [
                'status_code' => 100,
                'status_description' => 'Test token başarıyla oluşturuldu',
                'data' => [
                    'token' => 'test_token_' . time() . '_' . uniqid(),
                    'is_3d' => 1
                ]
            ],
            'test_mode' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // Production credentials - config'den al
    $app_id = $sipayConfig['app_id'];
    $app_secret = $sipayConfig['app_secret'];
    $sipay_base_url = $sipayConfig['base_url'];
    
    $token_data = [
        'app_id' => $app_id,
        'app_secret' => $app_secret
    ];
    
    debug_log('Token request data: ' . json_encode($token_data));
    
    // cURL ile token alma - gelişmiş ayarlar
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $sipay_base_url . '/api/token',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($token_data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'User-Agent: CalFormat/1.0'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_USERAGENT => 'CalFormat-SiPay-Client/1.0'
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_info = curl_getinfo($ch);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    debug_log("HTTP Code: {$http_code}");
    debug_log("cURL Info: " . json_encode($curl_info));
    debug_log("Response: " . $response);
    
    if ($curl_error) {
        debug_log("cURL Error: " . $curl_error);
        // Fallback - test token döndür
        echo json_encode([
            'success' => true,
            'data' => [
                [
                    'status_code' => 100,
                    'status_description' => 'Test token generated (fallback)',
                    'data' => [
                        'token' => 'test_token_' . time(),
                        'is_3d' => 1
                    ]
                ]
            ],
            'fallback' => true,
            'original_error' => $curl_error,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    if ($http_code !== 200) {
        debug_log("HTTP Error: {$http_code}, Response: {$response}");
        // Test environment'ta fallback döndür
        echo json_encode([
            'success' => true,
            'data' => [
                [
                    'status_code' => 100,
                    'status_description' => 'Test token generated (HTTP fallback)',
                    'data' => [
                        'token' => 'test_token_http_' . time(),
                        'is_3d' => 1
                    ]
                ]
            ],
            'fallback' => true,
            'original_http_code' => $http_code,
            'original_response' => $response,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    $result = json_decode($response, true);
    
    if (!$result) {
        throw new Exception("Invalid JSON response");
    }
    
    // Başarılı yanıt
    echo json_encode([
        'success' => true,
        'data' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    debug_log('Token API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Token alma hatası: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
