<?php
// Güvenli SiPay 3D Ödeme Hazırlama Endpoint
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
        securityLog('Rate limit exceeded for 3D payment preparation', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Request size exceeded for 3D payment preparation', 'WARNING', ['ip' => getClientIP()]);
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
        securityLog('Invalid HTTP method for 3D payment preparation', 'WARNING', [
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

    securityLog('3D payment preparation started', 'INFO', ['ip' => getClientIP()]);

    // SiPay konfigürasyonu
    $siPayConfig = $config['sipay'];

    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Geçersiz request data');
    }
    
    // Gerekli alanları kontrol et
    $required_fields = [
        'cc_holder_name', 'cc_no', 'expiry_month', 'expiry_year', 'cvv',
        'total', 'invoice_description', 'name', 'surname',
        'items', 'cancel_url', 'return_url', 'bill_email', 'bill_phone'
    ];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Gerekli alan eksik: {$field}");
        }
    }
    
    // SiPay ayarlarını config'den al
    $merchant_key = $siPayConfig['merchant_key'];
    $sipay_base_url = $siPayConfig['base_url'];
    $client_ip = getClientIP();
    
    // Benzersiz invoice_id oluştur
    $invoice_id = 'CAL' . time() . rand(1000, 9999);
    
    // Hash key oluştur
    $hash_string = $merchant_key . $invoice_id . $input['total'];
    $hash_key = hash('sha256', $hash_string);
    
    // SiPay için form verilerini hazırla
    $payment_data = [
        // Kart bilgileri
        'cc_holder_name' => sanitizeInput($input['cc_holder_name']),
        'cc_no' => preg_replace('/\s+/', '', sanitizeInput($input['cc_no'])),
        'expiry_month' => sanitizeInput($input['expiry_month']),
        'expiry_year' => sanitizeInput($input['expiry_year']),
        'cvv' => sanitizeInput($input['cvv']),
        
        // Ödeme bilgileri
        'currency_code' => 'TRY',
        'installments_number' => $input['installments_number'] ?? 1,
        'invoice_id' => $invoice_id,
        'invoice_description' => sanitizeInput($input['invoice_description']),
        'total' => floatval($input['total']),
        
        // Müşteri bilgileri
        'name' => sanitizeInput($input['name']),
        'surname' => sanitizeInput($input['surname']),
        
        // Merchant bilgileri
        'merchant_key' => $merchant_key,
        
        // Sepet ürünleri
        'items' => is_array($input['items']) ? json_encode($input['items']) : $input['items'],
        
        // URL'ler
        'cancel_url' => filter_var($input['cancel_url'], FILTER_VALIDATE_URL),
        'return_url' => filter_var($input['return_url'], FILTER_VALIDATE_URL),
        
        // Fatura adresi
        'bill_address1' => sanitizeInput($input['bill_address1'] ?? ''),
        'bill_address2' => sanitizeInput($input['bill_address2'] ?? ''),
        'bill_city' => sanitizeInput($input['bill_city'] ?? ''),
        'bill_postcode' => sanitizeInput($input['bill_postcode'] ?? ''),
        'bill_state' => sanitizeInput($input['bill_state'] ?? ''),
        'bill_country' => sanitizeInput($input['bill_country'] ?? 'Türkiye'),
        'bill_email' => filter_var($input['bill_email'], FILTER_VALIDATE_EMAIL),
        'bill_phone' => sanitizeInput($input['bill_phone']),
        
        // Güvenlik
        'hash_key' => $hash_key,
        'response_method' => 'POST',
        'ip' => $client_ip,
        
        // İşlem tipi
        'transaction_type' => $input['transaction_type'] ?? 'Auth',
        'payment_completed_by' => 'app'
    ];
    
    // HTML form oluştur (SiPay 3D için gerekli)
    $form_html = '<html><body>';
    $form_html .= '<form id="sipay_form" method="POST" action="' . $sipay_base_url . '/api/paySmart3D">';
    
    foreach ($payment_data as $key => $value) {
        $form_html .= '<input type="hidden" name="' . htmlspecialchars($key) . '" value="' . htmlspecialchars($value) . '">';
    }
    
    $form_html .= '</form>';
    $form_html .= '<script>document.getElementById("sipay_form").submit();</script>';
    $form_html .= '</body></html>';
    
    // Başarılı yanıt - HTML form döndür
    echo json_encode([
        'success' => true,
        'payment_form' => $form_html,
        'invoice_id' => $invoice_id,
        'payment_url' => $sipay_base_url . '/api/paySmart3D',
        'form_data' => $payment_data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    securityLog('3D payment preparation error: ' . $e->getMessage(), 'ERROR', ['ip' => getClientIP()]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Ödeme hazırlama hatası: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
