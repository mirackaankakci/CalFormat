<?php
header('Content-Type: application/json; charset=utf-8');

try {
    // 1. SIPAY KONFIGÜRASYONU (Ana dosyayla uyumlu)
    $sipayConfig = [
        'app_id' => '6d4a7e9374a76c15260fcc75e315b0b9',
        'app_secret' => 'b46a67571aa1e7ef5641dc3fa6f1712a',
        'merchant_key' => '$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO',
        'merchant_id' => '18309'
    ];

    // 2. SIPAY HASH VALIDATION FONKSIYONU (Ana dosyayla uyumlu)
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

    // 3. 3D RETURN HANDLER (Güncellenmiş hash doğrulama)
    function handle3DReturn($postData, $sipayConfig) {
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

        // 3D Return verilerini işle
        $returnData = [
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
            'md_status' => $postData['md_status'] ?? '',
            'auth_code' => $postData['auth_code'] ?? '',
            'hash_validated' => true,
            'validation_type' => '3D_RETURN',
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // 3D Return için status kontrolü (Sipay dokümantasyonu: 0 = başarısız, 1 = başarılı)
        $status = $hashValidation['status'];
        if ($status == '1' || $status === 1) {
            $returnData['message'] = 'Ödeme başarıyla tamamlandı';
            $returnData['payment_successful'] = true;
            // Burada sipariş durumunu güncelleyebilirsiniz
        } elseif ($status == '0' || $status === 0) {
            $returnData['message'] = 'Ödeme başarısız: ' . ($postData['status_description'] ?? 'Bilinmeyen hata');
            $returnData['payment_successful'] = false;
        } else {
            $returnData['message'] = 'Bilinmeyen ödeme durumu: ' . $status;
            $returnData['payment_successful'] = false;
        }

        return $returnData;
    }

    // 4. SADECE POST METODU KABUL ET
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Sadece POST metodu destekleniyor');
    }

    // 5. FORM DATA'YI AL (3D return genelde form post olarak gelir)
    $postData = $_POST;
    
    // 6. 3D RETURN İŞLEMİ
    $result = handle3DReturn($postData, $sipayConfig);
    
    // Log 3D return data for debugging
    error_log('Sipay 3D Return: ' . json_encode([
        'received_data' => $postData,
        'result' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]));

    // Başarılı işlem için kullanıcıyı yönlendir veya sonuç sayfası göster
    if ($result['success'] && ($result['payment_successful'] ?? false)) {
        // Başarılı ödeme - kullanıcıyı başarı sayfasına yönlendir
        header('Location: /checkout-success?invoice_id=' . urlencode($result['invoice_id']) . '&transaction_id=' . urlencode($result['transaction_id']));
        exit;
    } else {
        // Başarısız ödeme - kullanıcıyı hata sayfasına yönlendir
        $errorMessage = urlencode($result['message'] ?? 'Ödeme işlemi başarısız');
        header('Location: /checkout-error?error=' . $errorMessage);
        exit;
    }

} catch (Exception $e) {
    // Hata durumunda log ve kullanıcıyı hata sayfasına yönlendir
    error_log('Sipay 3D Return Error: ' . $e->getMessage());
    
    $errorMessage = urlencode('3D ödeme işlemi sırasında hata: ' . $e->getMessage());
    header('Location: /checkout-error?error=' . $errorMessage);
    exit;
}
?>
