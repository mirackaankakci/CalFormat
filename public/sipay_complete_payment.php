<?php
// Sipay 3D Ödeme Tamamlama API'si
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Sipay Config
    $sipayConfig = [
        'complete_payment_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/completePayment',
        'token_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/token',
        'app_id' => '6d4a7e9374a76c15260fcc75e315b0b9',
        'app_secret' => 'b46a67571aa1e7ef5641dc3fa6f1712a',
        'merchant_key' => '$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO',
        'merchant_id' => '18309'
    ];

    // Token alma fonksiyonu
    function getSipayToken($config) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $config['token_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'app_id' => $config['app_id'],
            'app_secret' => $config['app_secret']
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $data = json_decode($response, true);
            return $data['data']['token'] ?? $data['token'] ?? null;
        }

        return null;
    }

    // Hash key oluşturma (completePayment için)
    function generateCompletePaymentHashKey($merchant_key, $invoice_id, $order_id, $status, $app_secret) {
        $data = $merchant_key . '|' . $invoice_id . '|' . $order_id . '|' . $status;

        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($app_secret);

        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);

        $encrypted = openssl_encrypt("$data", 'aes-256-cbc', "$saltWithPassword", 0, $iv);

        $msg_encrypted_bundle = "$iv:$salt:$encrypted";
        $msg_encrypted_bundle = str_replace('/', '__', $msg_encrypted_bundle);

        return $msg_encrypted_bundle;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Geçersiz JSON verisi');
        }

        // Token al
        $token = getSipayToken($sipayConfig);
        if (!$token) {
            throw new Exception('Sipay token alınamadı');
        }

        // Gerekli parametreler
        $merchant_key = $input['merchant_key'] ?? $sipayConfig['merchant_key'];
        $invoice_id = $input['invoice_id'] ?? '';
        $order_id = $input['order_id'] ?? '';
        $status = $input['status'] ?? 'complete'; // "complete" veya "cancel"

        if (empty($invoice_id) || empty($order_id)) {
            throw new Exception('invoice_id ve order_id gerekli');
        }

        // Hash key oluştur
        $hash_key = generateCompletePaymentHashKey(
            $merchant_key,
            $invoice_id,
            $order_id,
            $status,
            $sipayConfig['app_secret']
        );

        // CompletePayment API çağrısı
        $requestData = [
            'merchant_key' => $merchant_key,
            'invoice_id' => $invoice_id,
            'order_id' => $order_id,
            'status' => $status,
            'hash_key' => $hash_key
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $sipayConfig['complete_payment_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $responseData = json_decode($response, true);

        echo json_encode([
            'success' => ($httpCode === 200),
            'http_code' => $httpCode,
            'action' => $status,
            'invoice_id' => $invoice_id,
            'order_id' => $order_id,
            'data' => $responseData,
            'request_data' => $requestData,
            'timestamp' => date('Y-m-d H:i:s')
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // API Bilgileri
        echo json_encode([
            'service' => 'Sipay 3D Complete Payment API',
            'description' => 'payment_completed_by: merchant gönderilen 3D ödemeler için',
            'usage' => [
                'complete' => 'POST {"invoice_id": "...", "order_id": "...", "status": "complete"}',
                'cancel' => 'POST {"invoice_id": "...", "order_id": "...", "status": "cancel"}'
            ],
            'note' => '3D ödeme doğrulandıktan sonra 15 dakika içinde çağrılmalı',
            'md_status' => [
                '1' => 'Kart doğrulandı - completePayment çağrılabilir',
                '0' => 'Kart doğrulanmadı - işlem başarısız'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

} catch (Exception $e) {
    error_log('Sipay CompletePayment API error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
