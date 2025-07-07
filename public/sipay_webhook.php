<?php
header('Content-Type: application/json; charset=utf-8');

try {
    // 1. RAW POST DATA AL
    $rawPostData = file_get_contents('php://input');
    $postData = json_decode($rawPostData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        // JSON decode başarısız, form data olarak dene
        $postData = $_POST;
    }

    // 2. SIPAY KONFIGÜRASYONU (Ana dosyayla uyumlu)
    $sipayConfig = [
        'app_id' => '6d4a7e9374a76c15260fcc75e315b0b9',
        'app_secret' => 'b46a67571aa1e7ef5641dc3fa6f1712a',
        'merchant_key' => '$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO',
        'merchant_id' => '18309'
    ];

    // 3. SIPAY HASH VALIDATION FONKSIYONU (Ana dosyayla uyumlu)
    function validateSipayHash($postData, $app_secret) {
        if (!isset($postData['hash_key'])) {
            return [
                'valid' => false,
                'error' => 'Hash key not found in data'
            ];
        }

        $hashKey = $postData['hash_key'];
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            // URL güvenliği için '__' karakterini '/' ile değiştir
            $hashKey = str_replace('__', '/', $hashKey);
            $password = sha1($app_secret);

            // Hash key parçalarını ayır: iv:salt:encrypted_data
            $components = explode(':', $hashKey);
            if (count($components) >= 3) {
                $iv = $components[0];
                $salt = $components[1];
                $saltWithPassword = hash('sha256', $password . $salt);
                $encryptedMsg = $components[2];

                // AES-256-CBC ile çöz (PHP 8+ uyumlu)
                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $saltWithPassword, 0, $iv);

                if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
                    // Çözülmüş veriyi parse et
                    $array = explode('|', $decryptedMsg);
                    $status = isset($array[0]) ? $array[0] : 0;
                    $total = isset($array[1]) ? $array[1] : 0;
                    $invoiceId = isset($array[2]) ? $array[2] : '0';
                    $orderId = isset($array[3]) ? $array[3] : 0;
                    $currencyCode = isset($array[4]) ? $array[4] : '';
                }
            }
        }

        return [
            'valid' => true,
            'status' => $status,
            'total' => $total,
            'invoice_id' => $invoiceId,
            'order_id' => $orderId,
            'currency_code' => $currencyCode
        ];
    }

    // 4. WEBHOOK HANDLER (Güncellenmiş hash doğrulama)
    function handleWebhook($postData, $sipayConfig) {
        // Hash validasyonu
        $hashValidation = validateSipayHash($postData, $sipayConfig['app_secret']);
        
        if (!$hashValidation['valid']) {
            return [
                'success' => false,
                'error' => 'Hash validation failed',
                'message' => 'Geçersiz hash key - güvenlik doğrulaması başarısız',
                'debug_info' => $hashValidation
            ];
        }

        // Webhook verilerini işle
        $webhookData = [
            'success' => true,
            'payment_status' => $hashValidation['status'],
            'transaction_id' => $postData['order_no'] ?? $postData['order_id'] ?? '',
            'invoice_id' => $hashValidation['invoice_id'],
            'total' => $hashValidation['total'],
            'currency_code' => $hashValidation['currency_code'],
            'order_id' => $hashValidation['order_id'],
            'payment_method' => $postData['payment_method'] ?? '1',
            'card_no' => $postData['credit_card_no'] ?? '',
            'status_description' => $postData['status_description'] ?? '',
            'transaction_type' => $postData['transaction_type'] ?? '',
            'hash_validated' => true,
            'validation_type' => 'WEBHOOK',
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Webhook için status kontrolü (Sipay dokümantasyonu: COMPLETED = başarılı, FAIL = başarısız)
        $status = $hashValidation['status'];
        if ($status === 'COMPLETED' || $status === 'completed') {
            $webhookData['message'] = 'Ödeme webhook: Başarıyla tamamlandı';
            $webhookData['payment_successful'] = true;
            // Burada sipariş durumunu kesin olarak güncelleyebilirsiniz
        } elseif ($status === 'FAIL' || $status === 'fail') {
            $webhookData['message'] = 'Ödeme webhook: Başarısız - ' . ($postData['status_description'] ?? 'Bilinmeyen hata');
            $webhookData['payment_successful'] = false;
        } else {
            $webhookData['message'] = 'Ödeme webhook: Bilinmeyen durum - ' . $status;
            $webhookData['payment_successful'] = false;
        }

        return $webhookData;
    }

    // 5. WEBHOOK İŞLEMİ
    $result = handleWebhook($postData, $sipayConfig);
    
    // Log webhook data for debugging
    error_log('Sipay Webhook: ' . json_encode([
        'received_data' => $postData,
        'result' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]));

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Webhook error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
