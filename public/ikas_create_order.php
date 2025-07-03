<?php
// Güvenli Ikas Sipariş Oluşturma Endpoint
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
        securityLog('Rate limit exceeded for order creation', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Request size exceeded for order creation', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Invalid HTTP method for order creation', 'WARNING', [
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
    
    // OPTIONS request için
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    securityLog('Order creation started', 'INFO', ['ip' => getClientIP()]);
    
    // POST verilerini al ve sanitize et
    $rawInput = file_get_contents('php://input');
    securityLog('Order data received', 'INFO', ['data_size' => strlen($rawInput)]);
    
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        securityLog('Invalid JSON in order creation', 'ERROR', ['error' => json_last_error_msg()]);
        throw new Exception('Geçersiz JSON verisi: ' . json_last_error_msg());
    }
    
    // Input sanitization
    $input = sanitizeInput($input);
    securityLog('Order input sanitized', 'INFO', ['keys' => array_keys($input)]);

    // TOKEN AL (güvenli config kullanarak)
    $ikasConfig = $config['ikas'];
    $tokenUrl = $ikasConfig['base_url'] . '/admin/oauth/token';
    
    securityLog('Requesting Ikas token for order', 'INFO');

    $tokenData = [
        'grant_type' => 'client_credentials',
        'client_id' => $ikasConfig['client_id'],
        'client_secret' => $ikasConfig['client_secret'],
        'scope' => 'admin'
    ];

    $tokenContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($tokenData),
            'timeout' => 10
        ]
    ]);

    $tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);
    
    if ($tokenResponse === FALSE) {
        securityLog('Failed to get Ikas token for order', 'ERROR');
        throw new Exception('Token alınamadı');
    }

    securityLog('Ikas token received for order', 'INFO');

    $tokenResult = json_decode($tokenResponse, true);
    
    if (!isset($tokenResult['access_token'])) {
        securityLog('Invalid token response for order', 'ERROR', ['response' => $tokenResult]);
        throw new Exception('Geçersiz token yanıtı');
    }

    $accessToken = $tokenResult['access_token'];
    securityLog('Access token obtained for order', 'INFO');

    // SİPARİŞ OLUŞTUR
    $orderUrl = $ikasConfig['base_url'] . '/v1/admin/graphql';
    
    securityLog('Preparing order payload', 'INFO');
    
    // Sipariş verilerini hazırla
    $orderData = [
        'query' => 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) { createOrderWithTransactions(input: $input) { id status } }',
        'variables' => [
            'input' => $input['input'] ?? $input
        ]
    ];

    securityLog('GraphQL order payload prepared', 'INFO');

    $orderContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Authorization: Bearer $accessToken\r\n" .
                       "Content-Type: application/json\r\n",
            'content' => json_encode($orderData),
            'timeout' => 30
        ]
    ]);

    securityLog('Making order API call', 'INFO');

    $orderResponse = @file_get_contents($orderUrl, false, $orderContext);
    
    if ($orderResponse === FALSE) {
        securityLog('Order API call failed', 'ERROR');
        throw new Exception('Sipariş oluşturulamadı - API çağrısı başarısız');
    }

    securityLog('Order API response received', 'INFO');

    $orderResult = json_decode($orderResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        securityLog('Order API response JSON decode error', 'ERROR', ['error' => json_last_error_msg()]);
        throw new Exception('API yanıtı geçersiz JSON: ' . json_last_error_msg());
    }
    
    // HTTP response code kontrolü
    $responseHeaders = $http_response_header ?? [];
    $httpCode = 200;
    
    foreach ($responseHeaders as $header) {
        if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
            $httpCode = (int)$matches[1];
        }
    }

    securityLog('Order creation response', 'INFO', ['http_code' => $httpCode]);

    // GraphQL hataları kontrol et
    if (isset($orderResult['errors'])) {
        securityLog('GraphQL errors in order creation', 'ERROR', ['errors' => $orderResult['errors']]);
        throw new Exception('GraphQL hatası: ' . json_encode($orderResult['errors']));
    }

    securityLog('Order created successfully', 'INFO');

    // Başarılı yanıt
    echo json_encode([
        'success' => true,
        'data' => $orderResult,
        'httpCode' => $httpCode,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    securityLog('Order creation failed', 'ERROR', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    // Hata durumunda
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    securityLog('Critical error in order endpoint', 'ERROR', [
        'error' => $e->getMessage(),
        'ip' => getClientIP()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'message' => 'An unexpected error occurred'
    ]);
}
?>
