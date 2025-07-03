<?php
// Güvenli SiPay Status Check Endpoint
require_once __DIR__ . '/security.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

try {
    // Konfigürasyonu yükle
    $config = getSecureConfig();
    
    // Güvenlik header'larını ayarla
    setSecurityHeaders($config);
    
    // Rate limiting kontrolü
    if (!checkRateLimit($config)) {
        securityLog('Rate limit exceeded for status check', 'WARNING', ['ip' => getClientIP()]);
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Please try again later.'
        ]);
        exit();
    }
    
    // Request boyutu kontrolü
    if (!checkRequestSize($config)) {
        securityLog('Request size exceeded for status check', 'WARNING', ['ip' => getClientIP()]);
        http_response_code(413);
        echo json_encode([
            'success' => false,
            'error' => 'Request Too Large',
            'message' => 'Request size exceeds limit'
        ]);
        exit();
    }
    
    // HTTP Method kontrolü  
    if (!validateHttpMethod(['POST'])) {
        securityLog('Invalid HTTP method for status check', 'WARNING', [
            'method' => $_SERVER['REQUEST_METHOD'],
            'ip' => getClientIP()
        ]);
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method Not Allowed',
            'message' => 'Only POST method is allowed'
        ]);
        exit();
    }

    // OPTIONS preflight isteği için
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    securityLog('SiPay status check started', 'INFO', ['ip' => getClientIP()]);

    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['invoice_id'])) {
        throw new Exception('Invoice ID gerekli');
    }
    
    $invoice_id = sanitizeInput($input['invoice_id']);
    
    // SiPay konfigürasyonu
    $siPayConfig = $config['sipay'];
    
    // Token al
    $token_url = $siPayConfig['base_url'] . '/api/token';
    $token_data = [
        'app_id' => $siPayConfig['app_id'],
        'app_secret' => $siPayConfig['app_secret']
    ];
    
    // cURL kullanarak token al
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($token_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $token_response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // cURL fallback
    if ($token_response === FALSE || !empty($curl_error)) {
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
    }
    
    $token_result = json_decode($token_response, true);
    
    if (!isset($token_result['data']['token'])) {
        throw new Exception('Token alınamadı');
    }
    
    $access_token = $token_result['data']['token'];
    
    // Check status verilerini hazırla
    $check_data = [
        'merchant_key' => $siPayConfig['merchant_key'],
        'invoice_id' => $invoice_id
    ];
    
    // SiPay Check Status API'sine istek gönder
    $check_url = $siPayConfig['base_url'] . '/api/checkstatus';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $check_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($check_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $access_token
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $check_response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // cURL fallback
    if ($check_response === FALSE || !empty($curl_error)) {
        $check_context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                    'Authorization: Bearer ' . $access_token
                ],
                'content' => json_encode($check_data),
                'timeout' => 60
            ]
        ]);
        
        $check_response = file_get_contents($check_url, false, $check_context);
        
        if ($check_response === FALSE) {
            $error = error_get_last();
            throw new Exception('Check Status API isteği başarısız: ' . $error['message']);
        }
    }
    
    $check_result = json_decode($check_response, true);
    
    // Yanıtı döndür
    echo json_encode([
        'success' => true,
        'data' => $check_result
    ]);
    
} catch (Exception $e) {
    securityLog('Status check error: ' . $e->getMessage(), 'ERROR', ['ip' => getClientIP()]);
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'check_status_failed',
        'message' => $e->getMessage()
    ]);
}
?>
