<?php
// Güvenli SiPay 2D Ödeme Endpoint
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
        securityLog('Rate limit exceeded for 2D payment', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Request size exceeded for 2D payment', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Invalid HTTP method for 2D payment', 'WARNING', [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
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
    if (($_SERVER['REQUEST_METHOD'] ?? 'POST') === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    securityLog('2D payment process started', 'INFO', ['ip' => getClientIP()]);

    // Test modu kontrolü
    $testMode = filter_var($siPayConfig['test_mode'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
    
    if ($testMode === true) {
        securityLog('Test mode active - returning mock payment response', 'INFO');
        
        echo json_encode([
            'success' => true,
            'payment_url' => 'https://test.sipay.com.tr/ccpayment/api/payment',
            'payment_id' => 'TEST_' . uniqid(),
            'test_mode' => true,
            'message' => 'Test modu aktif - Gerçek ödeme yapılmadı',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    // POST verilerini al ve sanitize et
    $rawInput = file_get_contents('php://input');
    
    if (empty($rawInput)) {
        throw new Exception('Request body boş');
    }
    
    $input = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Geçersiz JSON: ' . json_last_error_msg());
    }
    
    // Input sanitization
    $input = sanitizeInput($input);
    
    securityLog('2D payment data received', 'INFO', ['data_size' => strlen($rawInput)]);
    
    // Gerekli alanları kontrol et
    $required_fields = [
        'cc_holder_name', 'cc_no', 'expiry_month', 'expiry_year', 'cvv',
        'total', 'invoice_id', 'name', 'surname', 'bill_email', 'bill_phone'
    ];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Gerekli alan eksik: {$field}");
        }
    }
    
    // SiPay 2D ödeme verilerini hazırla
    $merchant_key = $siPayConfig['merchant_key'];
    $app_id = $siPayConfig['app_id'];
    $app_secret = $siPayConfig['app_secret'];
    $base_url = $siPayConfig['base_url'];
    
    // Benzersiz invoice_id oluştur (eğer yoksa)
    if (empty($input['invoice_id'])) {
        $input['invoice_id'] = 'CAL2D' . time() . rand(1000, 9999);
    }
    
    // Hash key oluştur
    $hash_string = $merchant_key . $input['invoice_id'] . $input['total'];
    $hash_key = hash('sha256', $hash_string);
    
    // IP adresini al
    $client_ip = getClientIP();
    
    // SiPay 2D ödeme verilerini hazırla
    $payment_data = [
        // Kart bilgileri
        'cc_holder_name' => $input['cc_holder_name'],
        'cc_no' => str_replace(' ', '', $input['cc_no']),
        'expiry_month' => str_pad($input['expiry_month'], 2, '0', STR_PAD_LEFT),
        'expiry_year' => $input['expiry_year'],
        'cvv' => $input['cvv'],
        
        // Ödeme bilgileri
        'currency_code' => 'TRY',
        'installments_number' => $input['installments_number'] ?? 1,
        'invoice_id' => $input['invoice_id'],
        'invoice_description' => $input['invoice_description'] ?? 'CalFormat 2D Ödeme',
        'total' => $input['total'],
        
        // Müşteri bilgileri
        'name' => $input['name'],
        'surname' => $input['surname'],
        
        // Merchant bilgileri
        'merchant_key' => $merchant_key,
        'app_id' => $app_id,
        'app_secret' => $app_secret,
        
        // Fatura bilgileri
        'bill_address1' => $input['bill_address1'] ?? '',
        'bill_address2' => $input['bill_address2'] ?? '',
        'bill_city' => $input['bill_city'] ?? '',
        'bill_postcode' => $input['bill_postcode'] ?? '',
        'bill_state' => $input['bill_state'] ?? '',
        'bill_country' => $input['bill_country'] ?? 'Türkiye',
        'bill_email' => $input['bill_email'],
        'bill_phone' => $input['bill_phone'],
        
        // Güvenlik
        'hash_key' => $hash_key,
        'ip' => $client_ip,
        
        // İşlem tipi
        'transaction_type' => $input['transaction_type'] ?? 'Auth'
    ];
    
    securityLog('2D payment data prepared', 'INFO', ['invoice_id' => $input['invoice_id']]);
    
    // SiPay 2D API'ye istek gönder
    $api_url = $base_url . '/api/paySmart2D';
    
    // file_get_contents kullan (cURL yerine)
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                       "User-Agent: CalFormat-API/1.0\r\n",
            'content' => http_build_query($payment_data),
            'timeout' => 30
        ]
    ]);
    
    securityLog('Making 2D payment API call', 'INFO', ['url' => $api_url]);
    
    $response = @file_get_contents($api_url, false, $context);
    
    if ($response === FALSE) {
        throw new Exception('SiPay API isteği başarısız');
    }
    
    $result = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        securityLog('2D payment API response parse error', 'ERROR', [
            'error' => json_last_error_msg(),
            'response' => substr($response, 0, 500)
        ]);
        throw new Exception('API yanıtı parse edilemedi: ' . json_last_error_msg());
    }
    
    securityLog('2D payment API response received', 'INFO', [
        'status' => $result['payment_status'] ?? 'unknown'
    ]);
    
    // Başarılı yanıt
    echo json_encode([
        'success' => true,
        'data' => $result,
        'invoice_id' => $input['invoice_id'],
        'test_mode' => $siPayConfig['test_mode'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    securityLog('2D payment error', 'ERROR', [
        'error' => $e->getMessage(),
        'ip' => getClientIP()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    securityLog('Critical error in 2D payment endpoint', 'ERROR', [
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
