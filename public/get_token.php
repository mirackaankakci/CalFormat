<?php
// Güvenli Ikas Token Endpoint
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
        securityLog('Rate limit exceeded', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Request size exceeded', 'WARNING', ['ip' => getClientIP()]);
        http_response_code(413);
        echo json_encode([
            'success' => false,
            'error' => 'Request Too Large',
            'message' => 'Request size exceeds limit'
        ]);
        exit();
    }
    
    // OPTIONS preflight isteği
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    // Sadece POST isteklerine izin ver
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method Not Allowed',
            'message' => 'Only POST requests are allowed'
        ]);
        exit();
    }
    
    // Ikas config'i al
    $ikasConfig = $config['ikas'];
    
    // Token endpoint URL'i
    $tokenUrl = $ikasConfig['base_url'] . '/admin/oauth/token';
    
    // OAuth credentials
    $clientId = $ikasConfig['client_id'];
    $clientSecret = $ikasConfig['client_secret'];
    
    // POST verilerini hazırla
    $postData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);
    
    securityLog('Ikas token request initiated', 'INFO', [
        'client_id' => substr($clientId, 0, 8) . '...',
        'endpoint' => $tokenUrl
    ]);
    
    // cURL ile güvenli istek
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $tokenUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_MAXREDIRS => 0,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'User-Agent: CalFormat/1.0'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    // cURL hata kontrolü
    if ($response === false) {
        securityLog('Ikas token request failed: ' . $curlError, 'ERROR');
        throw new Exception('Network request failed');
    }
    
    // HTTP durum kodu kontrolü
    if ($httpCode !== 200) {
        securityLog('Ikas token request HTTP error', 'ERROR', [
            'http_code' => $httpCode,
            'response' => substr($response, 0, 500)
        ]);
        
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'error' => 'Upstream Error',
            'message' => 'Authentication service temporarily unavailable'
        ]);
        exit();
    }
    
    // JSON response'u decode et
    $responseData = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        securityLog('Ikas token response JSON error', 'ERROR', [
            'json_error' => json_last_error_msg()
        ]);
        throw new Exception('Invalid response format');
    }
    
    // Access token kontrolü
    if (!isset($responseData['access_token'])) {
        securityLog('Ikas token missing in response', 'ERROR', [
            'response_keys' => array_keys($responseData)
        ]);
        
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication Failed',
            'message' => 'Could not retrieve access token'
        ]);
        exit();
    }
    
    // Başarılı yanıt
    securityLog('Ikas token retrieved successfully', 'INFO');
    
    echo json_encode([
        'success' => true,
        'access_token' => $responseData['access_token'],
        'token_type' => $responseData['token_type'] ?? 'Bearer',
        'expires_in' => $responseData['expires_in'] ?? 3600,
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    securityLog('Ikas token endpoint error: ' . $e->getMessage(), 'ERROR');
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'message' => 'An error occurred while processing your request'
    ]);
}
?>
