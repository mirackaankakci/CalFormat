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

// SiPay ortak fonksiyonları
require_once __DIR__ . '/sipay_functions.php';

try {
    sipay_debug_log('SiPay 2D ödeme işlemi başlatıldı', '2D_PAYMENT');
    
    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Geçersiz JSON verisi');
    }
    
    sipay_debug_log('Gelen ödeme verisi: ' . json_encode($input), '2D_PAYMENT');
    
    // Gerekli alanları kontrol et
    $required_fields = [
        'cc_holder_name', 'cc_no', 'expiry_month', 'expiry_year', 'cvv',
        'total', 'invoice_id', 'invoice_description', 'name', 'surname',
        'items', 'cancel_url', 'return_url', 'bill_email', 'bill_phone'
    ];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Gerekli alan eksik: {$field}");
        }
    }
    
    // Test modu aktif - gerçek API çağrısı yapmadan test sonucu döndür
    $is_test_mode = true;
    
    if ($is_test_mode) {
        sipay_debug_log('Test modu aktif - 2D ödeme simülasyonu', '2D_PAYMENT');
        
        // Test için başarılı sonuç simüle et
        $success_rate = rand(1, 100);
        $is_success = $success_rate > 15; // %85 başarı oranı
        
        sleep(2); // Gerçek API çağrısını simüle et
        
        if ($is_success) {
            $result = [
                'success' => true,
                'data' => [
                    'payment_status' => 1,
                    'transaction_type' => $input['transaction_type'] ?? 'Auth',
                    'order_id' => 'TEST_ORDER_' . time() . '_' . rand(1000, 9999),
                    'invoice_id' => $input['invoice_id'],
                    'total' => floatval($input['total']),
                    'currency_code' => $input['currency_code'] ?? 'TRY',
                    'hash_key' => hash('sha256', 'test_hash_' . time()),
                    'sipay_status' => 1,
                    'status_description' => 'İşlem başarılı - Test modunda simüle edilmiştir',
                    'merchant_commission' => 0,
                    'user_commission' => 0
                ],
                'test_mode' => true,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            sipay_debug_log('Test 2D ödeme başarılı: ' . json_encode($result), '2D_PAYMENT');
        } else {
            $error_messages = [
                'Kart limitiniz yetersiz',
                'Kart CVV bilgisi hatalı',
                'Kartınız bloke durumda',
                'İşlem reddedildi - Banka tarafından',
                'Geçersiz kart bilgileri'
            ];
            
            $result = [
                'success' => false,
                'data' => [
                    'payment_status' => 0,
                    'transaction_type' => $input['transaction_type'] ?? 'Auth', 
                    'order_id' => '',
                    'invoice_id' => $input['invoice_id'],
                    'total' => floatval($input['total']),
                    'currency_code' => $input['currency_code'] ?? 'TRY',
                    'hash_key' => '',
                    'sipay_status' => 0,
                    'status_description' => $error_messages[array_rand($error_messages)],
                    'merchant_commission' => 0,
                    'user_commission' => 0
                ],
                'test_mode' => true,
                'error' => 'Test ödeme başarısız',
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            sipay_debug_log('Test 2D ödeme başarısız: ' . json_encode($result), '2D_PAYMENT');
        }
        
        echo json_encode($result);
        exit();
    }
    
    // 2. Ödeme verilerini hazırla
    $merchant_key = 'b5dd4eef-e999-4dd3-bcd0-98d1aa4b1a91';
    $hash_key = 'SIPAY2023TEST';
    
    // IP adresini al
    $client_ip = sipay_get_client_ip();
    
    $payment_data = [
        // Kart bilgileri
        'cc_holder_name' => $input['cc_holder_name'],
        'cc_no' => $input['cc_no'],
        'expiry_month' => $input['expiry_month'],
        'expiry_year' => $input['expiry_year'],
        'cvv' => $input['cvv'],
        
        // Ödeme bilgileri
        'currency_code' => $input['currency_code'] ?? 'TRY',
        'installments_number' => $input['installments_number'] ?? 1,
        'invoice_id' => $input['invoice_id'],
        'invoice_description' => $input['invoice_description'],
        'total' => floatval($input['total']),
        'merchant_key' => $merchant_key,
        
        // Müşteri bilgileri
        'name' => $input['name'],
        'surname' => $input['surname'],
        'ip' => $client_ip,
        
        // Sepet
        'items' => $input['items'],
        
        // URL'ler
        'cancel_url' => $input['cancel_url'],
        'return_url' => $input['return_url'],
        
        // Fatura adresi
        'bill_address1' => $input['bill_address1'] ?? '',
        'bill_address2' => $input['bill_address2'] ?? '',
        'bill_city' => $input['bill_city'] ?? '',
        'bill_postcode' => $input['bill_postcode'] ?? '',
        'bill_state' => $input['bill_state'] ?? '',
        'bill_country' => $input['bill_country'] ?? 'TR',
        'bill_email' => $input['bill_email'],
        'bill_phone' => $input['bill_phone'],
        
        // İşlem tipi
        'transaction_type' => $input['transaction_type'] ?? 'Auth',
        
        // Opsiyonel alanlar
        'card_program' => $input['card_program'] ?? null,
        'is_commission_from_user' => $input['is_commission_from_user'] ?? null,
        'commission_by' => $input['commission_by'] ?? null,
        'sale_web_hook_key' => $input['sale_web_hook_key'] ?? null,
        
        // Yinelenen ödeme
        'order_type' => $input['order_type'] ?? null,
        'recurring_payment_number' => $input['recurring_payment_number'] ?? null,
        'recurring_payment_cycle' => $input['recurring_payment_cycle'] ?? null,
        'recurring_payment_interval' => $input['recurring_payment_interval'] ?? null,
        'recurring_web_hook_key' => $input['recurring_web_hook_key'] ?? null,
        
        // Sigorta
        'vpos_type' => $input['vpos_type'] ?? null,
        'identity_number' => $input['identity_number'] ?? null
    ];
    
    // Hash key oluştur
    $hash = sipay_create_hash($payment_data, $hash_key);
    if (!$hash) {
        throw new Exception('Hash key oluşturulamadı');
    }
    
    $payment_data['hash_key'] = $hash;
    
    // Boş değerleri temizle
    $payment_data = array_filter($payment_data, function($value) {
        return $value !== null && $value !== '';
    });
    
    sipay_debug_log('Final ödeme verisi: ' . json_encode($payment_data), '2D_PAYMENT');
    
    // 3. SiPay 2D API'sine istek gönder
    $api_result = sipay_send_request('/api/paySmart2D', $payment_data, $token);
    
    if (!$api_result['success']) {
        throw new Exception('2D API isteği başarısız: ' . $api_result['error']);
    }
    
    $api_response = $api_result['data'];
    
    sipay_debug_log('2D API yanıtı: ' . json_encode($api_response), '2D_PAYMENT');
    
    // 4. Yanıtı kontrol et ve döndür
    if (isset($api_response['status_code']) && $api_response['status_code'] === 100) {
        // Başarılı
        sipay_debug_log('2D ödeme başarılı', '2D_PAYMENT');
        
        echo json_encode([
            'success' => true,
            'data' => [
                'payment_status' => $api_response['payment_status'] ?? 0,
                'transaction_type' => $api_response['transaction_type'] ?? 'Auth',
                'order_id' => $api_response['order_id'] ?? $input['invoice_id'],
                'invoice_id' => $api_response['invoice_id'] ?? $input['invoice_id'],
                'total' => $api_response['total'] ?? $input['total'],
                'currency_code' => $api_response['currency_code'] ?? 'TRY',
                'hash_key' => $api_response['hash_key'] ?? '',
                'sipay_status' => $api_response['sipay_status'] ?? 0,
                'status_description' => $api_response['status_description'] ?? '',
                'merchant_commission' => $api_response['merchant_commission'] ?? null,
                'user_commission' => $api_response['user_commission'] ?? null
            ],
            'message' => 'Ödeme işlemi tamamlandı',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } else {
        // Başarısız
        throw new Exception($api_response['status_description'] ?? 'Ödeme işlemi başarısız');
    }
    
} catch (Exception $e) {
    sipay_debug_log('2D ödeme hatası: ' . $e->getMessage(), '2D_PAYMENT');
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Ödeme işlemi başarısız oldu',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
