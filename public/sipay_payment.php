<?php
// Sipay Ödeme Entegrasyonu - 2D ve 3D Ödeme Sistemi
error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da 0

// JSON response için header'lar
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. SIPAY KONFİGÜRASYON BİLGİLERİ (Dokümantasyon Uyumlu)
    $sipayConfig = [
        'base_url' => 'https://provisioning.sipay.com.tr/ccpayment',
        'token_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/token',
        'payment_2d_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/paySmart2D',
        'payment_3d_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/paySmart3D',
        'complete_payment_url' => 'https://provisioning.sipay.com.tr/ccpayment/api/completePayment',
        'app_id' => '6d4a7e9374a76c15260fcc75e315b0b9',
        'app_secret' => 'b46a67571aa1e7ef5641dc3fa6f1712a',
        'merchant_key' => '$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO',
        'merchant_id' => '18309'
    ];

    // 2. TOKEN ALMA İŞLEMİ
    function getSipayToken($config) {
        $tokenData = [
            'app_id' => $config['app_id'],
            'app_secret' => $config['app_secret']
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $config['token_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($tokenData));
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

    // 3. SIPAY RESMİ HASH KEY OLUŞTURMA FONKSİYONU (Dokümantasyon Uyumlu)
    function generateHashKey($total, $installment, $currency_code, $merchant_key, $invoice_id, $app_secret) {
        // Sipay resmi örneğine göre hash key oluşturma
        $data = $total . '|' . $installment . '|' . $currency_code . '|' . $merchant_key . '|' . $invoice_id;

        // Rastgele IV ve salt oluştur
        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($app_secret);
        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);

        // AES-256-CBC ile şifrele (PHP 8+ uyumlu)
        $encrypted = openssl_encrypt($data, 'aes-256-cbc', $saltWithPassword, 0, $iv);

        // Hash key formatı: iv:salt:encrypted_data
        $msg_encrypted_bundle = $iv . ':' . $salt . ':' . $encrypted;
        
        // URL güvenliği için '/' karakterini '__' ile değiştir
        $msg_encrypted_bundle = str_replace('/', '__', $msg_encrypted_bundle);

        return $msg_encrypted_bundle;
    }

    // 4. SIPAY RESMİ HASH VALİDASYON FONKSİYONU (Dokümantasyon Uyumlu)
    function validateHashKey($hashKey, $secretKey) {
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            // URL güvenliği için '__' karakterini '/' ile değiştir
            $hashKey = str_replace('__', '/', $hashKey);
            $password = sha1($secretKey);

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

        return [$status, $total, $invoiceId, $orderId, $currencyCode];
    }

    // 5. 2D ÖDEME İŞLEMİ
    function process2DPayment($paymentData, $token, $config) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $config['payment_2d_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
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

        return [
            'success' => ($httpCode === 200),
            'http_code' => $httpCode,
            'response' => json_decode($response, true),
            'raw_response' => $response
        ];
    }

    // 6. 3D ÖDEME İŞLEMİ (HTML Form Return - Dokümantasyon Uyumlu)
    function process3DPayment($paymentData, $token, $config) {
        // 3D ödeme için hash key oluştur
        $hashKey = generateHashKey(
            $paymentData['total'],
            $paymentData['installments_number'],
            $paymentData['currency_code'],
            $paymentData['merchant_key'],
            $paymentData['invoice_id'],
            $config['app_secret']
        );

        // 3D ödeme için gerekli parametreleri hazırla
        $paymentData['hash_key'] = $hashKey;
        $paymentData['response_method'] = 'POST';
        
        // Önemli: payment_completed_by parametresi 
        // "merchant" = kart doğrulaması sonrası completePayment API çağrısı gerekli
        // "app" = kart doğrulaması sonrası otomatik ödeme (önerilen)
        $paymentData['payment_completed_by'] = $paymentData['payment_completed_by'] ?? 'app';

        // 3D ödeme için HTML form döndür
        $formHtml = generate3DForm($paymentData, $config, $token);

        return [
            'success' => true,
            'payment_type' => '3D',
            'form_html' => $formHtml,
            'redirect_needed' => true,
            'hash_key' => $hashKey,
            'payment_completed_by' => $paymentData['payment_completed_by']
        ];
    }

    // 7. 3D ÖDEME HTML FORM OLUŞTURMA (Dokümantasyon Uyumlu)
    function generate3DForm($paymentData, $config, $token) {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>3D Güvenli Ödeme Yönlendiriliyor...</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 50px; background: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .loading { font-size: 18px; margin: 20px; color: #333; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; color: #1565c0; }
        .security { display: flex; justify-content: center; align-items: center; margin: 20px 0; }
        .security-icon { font-size: 24px; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="security">
            <div class="security-icon">🔒</div>
            <h2>3D Güvenli Ödeme</h2>
        </div>
        
        <div class="loading">Banka güvenli ödeme sayfasına yönlendiriliyorsunuz...</div>
        <div class="spinner"></div>
        
        <div class="info">
            <strong>Güvenlik Bildirimi:</strong><br>
            • SMS ile doğrulama yapılacaktır<br>
            • Kart bilgileriniz güvenli şekilde işlenmektedir<br>
            • İşlem tutarı: ' . number_format($paymentData['total'], 2) . ' ' . $paymentData['currency_code'] . '<br>
            • Sipariş No: ' . htmlspecialchars($paymentData['invoice_id']) . '
        </div>
    </div>
    
    <form id="sipay3DForm" method="POST" action="' . $config['payment_3d_url'] . '">
        <input type="hidden" name="cc_holder_name" value="' . htmlspecialchars($paymentData['cc_holder_name']) . '">
        <input type="hidden" name="cc_no" value="' . htmlspecialchars($paymentData['cc_no']) . '">
        <input type="hidden" name="expiry_month" value="' . htmlspecialchars($paymentData['expiry_month']) . '">
        <input type="hidden" name="expiry_year" value="' . htmlspecialchars($paymentData['expiry_year']) . '">
        <input type="hidden" name="cvv" value="' . htmlspecialchars($paymentData['cvv']) . '">
        <input type="hidden" name="currency_code" value="' . htmlspecialchars($paymentData['currency_code']) . '">
        <input type="hidden" name="installments_number" value="' . htmlspecialchars($paymentData['installments_number']) . '">
        <input type="hidden" name="invoice_id" value="' . htmlspecialchars($paymentData['invoice_id']) . '">
        <input type="hidden" name="invoice_description" value="' . htmlspecialchars($paymentData['invoice_description']) . '">
        <input type="hidden" name="name" value="' . htmlspecialchars($paymentData['name']) . '">
        <input type="hidden" name="surname" value="' . htmlspecialchars($paymentData['surname']) . '">
        <input type="hidden" name="total" value="' . htmlspecialchars($paymentData['total']) . '">
        <input type="hidden" name="merchant_key" value="' . htmlspecialchars($paymentData['merchant_key']) . '">
        <input type="hidden" name="items" value="' . htmlspecialchars(json_encode($paymentData['items'])) . '">
        <input type="hidden" name="cancel_url" value="' . htmlspecialchars($paymentData['cancel_url']) . '">
        <input type="hidden" name="return_url" value="' . htmlspecialchars($paymentData['return_url']) . '">
        <input type="hidden" name="bill_address1" value="' . htmlspecialchars($paymentData['bill_address1']) . '">
        <input type="hidden" name="bill_city" value="' . htmlspecialchars($paymentData['bill_city']) . '">
        <input type="hidden" name="bill_state" value="' . htmlspecialchars($paymentData['bill_state']) . '">
        <input type="hidden" name="bill_postcode" value="' . htmlspecialchars($paymentData['bill_postcode']) . '">
        <input type="hidden" name="bill_country" value="' . htmlspecialchars($paymentData['bill_country']) . '">
        <input type="hidden" name="bill_email" value="' . htmlspecialchars($paymentData['bill_email']) . '">
        <input type="hidden" name="bill_phone" value="' . htmlspecialchars($paymentData['bill_phone']) . '">
        <input type="hidden" name="ip" value="' . htmlspecialchars($paymentData['ip']) . '">
        <input type="hidden" name="hash_key" value="' . htmlspecialchars($paymentData['hash_key']) . '">
        <input type="hidden" name="response_method" value="POST">
        <input type="hidden" name="payment_completed_by" value="' . htmlspecialchars($paymentData['payment_completed_by']) . '">
        <input type="hidden" name="transaction_type" value="' . htmlspecialchars($paymentData['transaction_type']) . '">';
        
        // İsteğe bağlı parametreler
        if (!empty($paymentData['card_program'])) {
            $html .= '<input type="hidden" name="card_program" value="' . htmlspecialchars($paymentData['card_program']) . '">';
        }
        
        if (!empty($paymentData['sale_web_hook_key'])) {
            $html .= '<input type="hidden" name="sale_web_hook_key" value="' . htmlspecialchars($paymentData['sale_web_hook_key']) . '">';
        }
        
        if (!empty($paymentData['recurring_web_hook_key'])) {
            $html .= '<input type="hidden" name="recurring_web_hook_key" value="' . htmlspecialchars($paymentData['recurring_web_hook_key']) . '">';
        }
        
        $html .= '</form>

    <script>
        // Otomatik form gönderimi (3 saniye sonra)
        setTimeout(function() {
            document.getElementById("sipay3DForm").submit();
        }, 3000);
        
        // Sayaç gösterimi
        let countdown = 3;
        const countdownElement = document.querySelector(".loading");
        const interval = setInterval(function() {
            countdown--;
            if (countdown > 0) {
                countdownElement.innerHTML = "Banka güvenli ödeme sayfasına yönlendiriliyorsunuz... (" + countdown + ")";
            } else {
                clearInterval(interval);
                countdownElement.innerHTML = "Yönlendiriliyor...";
            }
        }, 1000);
    </script>
</body>
</html>';

        return $html;
    }

    // 8. 3D RETURN HANDLER
    function handle3DReturn($postData, $config) {
        // Hash validation - 3D return için status kontrolü
        if (isset($postData['hash_key'])) {
            list($status, $total, $invoiceId, $orderId, $currencyCode) = validateHashKey($postData['hash_key'], $config['app_secret']);
            
            return [
                'success' => true,
                'payment_type' => '3D_RETURN',
                'payment_status' => $status,
                'payment_successful' => ($status == '1' || $status === 1),
                'transaction_id' => $postData['order_no'] ?? $postData['order_id'] ?? '',
                'invoice_id' => $invoiceId,
                'total' => $total,
                'currency_code' => $currencyCode,
                'order_id' => $orderId,
                'status_description' => $postData['status_description'] ?? '',
                'transaction_type' => $postData['transaction_type'] ?? '',
                'hash_validated' => true,
                'md_status' => $postData['md_status'] ?? '',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }

        return [
            'success' => false,
            'error' => 'Hash key not provided in 3D return',
            'payment_type' => '3D_RETURN'
        ];
    }

    // 9. WEBHOOK HANDLER
    function handleWebhook($postData, $config) {
        if (isset($postData['hash_key'])) {
            list($status, $total, $invoiceId, $orderId, $currencyCode) = validateHashKey($postData['hash_key'], $config['app_secret']);
            
            // Webhook için status: COMPLETED = başarılı, FAIL = başarısız
            $isSuccessful = ($status === 'COMPLETED');
            
            return [
                'success' => true,
                'event_type' => 'webhook',
                'payment_status' => $status,
                'payment_successful' => $isSuccessful,
                'invoice_id' => $invoiceId,
                'total' => $total,
                'currency_code' => $currencyCode,
                'order_id' => $orderId,
                'hash_validated' => true,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }

        return [
            'success' => false,
            'error' => 'Hash key not provided in webhook',
            'event_type' => 'webhook'
        ];
    }

    // 10. ANA İSTEK İŞLEYİCİ
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    
    if ($requestMethod === 'POST') {
        // Endpoint tespiti
        if (strpos($requestUri, '3d-return') !== false) {
            // 3D Return endpoint
            $result = handle3DReturn($_POST, $sipayConfig);
            echo json_encode($result);
            exit();
            
        } elseif (strpos($requestUri, 'webhook') !== false) {
            // Webhook endpoint
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $result = handleWebhook($input, $sipayConfig);
            echo json_encode($result);
            exit();
            
        } else {
            // Normal ödeme işlemi
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Geçersiz JSON verisi');
            }

            // Token al
            $token = getSipayToken($sipayConfig);
            if (!$token) {
                throw new Exception('Sipay token alınamadı');
            }

            // Ödeme tipini belirle (2D veya 3D)
            $paymentType = $input['payment_type'] ?? '2D'; // Default 2D
            
            // Ödeme verilerini hazırla
            $items = is_array($input['items'] ?? []) ? $input['items'] : json_decode($input['items'] ?? '[]', true);
            if (!is_array($items)) $items = [];
            
            $paymentData = [
                'cc_holder_name' => $input['cc_holder_name'] ?? '',
                'cc_no' => $input['cc_no'] ?? '',
                'expiry_month' => $input['expiry_month'] ?? '',
                'expiry_year' => $input['expiry_year'] ?? '',
                'cvv' => $input['cvv'] ?? '',
                'currency_code' => $input['currency_code'] ?? 'TRY',
                'installments_number' => intval($input['installments_number'] ?? 1),
                'invoice_id' => $input['invoice_id'] ?? 'ORDER-' . time(),
                'invoice_description' => $input['invoice_description'] ?? 'CalFormat Sipariş Ödemesi',
                'name' => $input['name'] ?? '',
                'surname' => $input['surname'] ?? '',
                'total' => floatval($input['total'] ?? 0),
                'merchant_key' => $sipayConfig['merchant_key'],
                'items' => $items,
                'cancel_url' => $input['cancel_url'] ?? 'https://www.calformat.com.tr/checkout?status=cancel',
                'return_url' => $input['return_url'] ?? 'https://www.calformat.com.tr/checkout?status=success',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                'bill_address1' => $input['bill_address1'] ?? '',
                'bill_city' => $input['bill_city'] ?? '',
                'bill_state' => $input['bill_state'] ?? '',
                'bill_postcode' => $input['bill_postcode'] ?? '',
                'bill_country' => $input['bill_country'] ?? 'TR',
                'bill_email' => $input['bill_email'] ?? '',
                'bill_phone' => $input['bill_phone'] ?? '',
                // 3D ödeme için önemli parametreler
                'payment_completed_by' => $input['payment_completed_by'] ?? 'app', // "merchant" veya "app"
                'transaction_type' => $input['transaction_type'] ?? 'Auth', // "Auth" veya "PreAuth"
                'card_program' => $input['card_program'] ?? '', // Kart programı (isteğe bağlı)
                'sale_web_hook_key' => $input['sale_web_hook_key'] ?? '', // Webhook anahtarı (isteğe bağlı)
                'recurring_web_hook_key' => $input['recurring_web_hook_key'] ?? '' // Tekrarlayan ödeme webhook (isteğe bağlı)
            ];

            // Ödeme tipine göre işlem
            if (strtoupper($paymentType) === '3D') {
                // 3D Ödeme
                $result = process3DPayment($paymentData, $token, $sipayConfig);
                
                // 3D ödeme için HTML döndür
                if ($result['success'] && isset($result['form_html'])) {
                    header('Content-Type: text/html; charset=utf-8');
                    echo $result['form_html'];
                    exit();
                }
                
            } else {
                // 2D Ödeme
                $result = process2DPayment($paymentData, $token, $sipayConfig);
            }

            // Sonucu döndür
            echo json_encode([
                'success' => $result['success'],
                'payment_type' => $paymentType,
                'data' => $result['response'] ?? $result,
                'invoice_id' => $paymentData['invoice_id'],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit();
        }

    } elseif ($requestMethod === 'GET') {
        // API Bilgileri
        echo json_encode([
            'success' => true,
            'service' => 'Sipay Payment Gateway',
            'version' => '2.0',
            'supported_payment_types' => ['2D', '3D'],
            'endpoints' => [
                'payment_2d' => 'POST /sipay_payment.php (payment_type: "2D")',
                'payment_3d' => 'POST /sipay_payment.php (payment_type: "3D")',
                '3d_return' => 'POST /sipay_payment.php/3d-return',
                'webhook' => 'POST /sipay_payment.php/webhook',
                'info' => 'GET /sipay_payment.php'
            ],
            'payment_selection' => [
                'description' => 'Müşteri 2D veya 3D ödeme seçebilir',
                '2D' => 'Hızlı ödeme - Direkt kart işlemi',
                '3D' => 'Güvenli ödeme - SMS doğrulama ile'
            ],
            'hash_validation' => [
                '3d_payment' => 'Required - Sipay resmi algoritması',
                '3d_return' => 'Active - AES-256-CBC şifreleme',
                'webhook' => 'Active - Hash doğrulama'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

} catch (Exception $e) {
    error_log('Sipay API error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
