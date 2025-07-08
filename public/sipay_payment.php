<?php
/**
 * SiPay Ödeme Sistemi - Ana API
 * Modern, güvenli ve modüler ödeme entegrasyonu
 * 
 * Desteklenen özellikler:
 * - Token yönetimi (2 saat geçerlilik)
 * - 2D Ödeme (Non-Secure)
 * - 3D Ödeme (Secure)
 * - Hash key doğrulama
 * - Webhook desteği
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da 0

// CORS ve JSON headers
header('Content-Type: application/json; charset=utf-8');

// Güvenli JSON girişi al
$input = getSecureJSONInput();

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];
    
    // SiPay API URL'lerini oluştur
    $sipayConfig['token_url'] = $sipayConfig['base_url'] . $sipayConfig['token_url'];
    $sipayConfig['payment_2d_url'] = $sipayConfig['base_url'] . $sipayConfig['payment_2d_url'];
    $sipayConfig['payment_3d_url'] = $sipayConfig['base_url'] . $sipayConfig['payment_3d_url'];
    $sipayConfig['complete_payment_url'] = $sipayConfig['base_url'] . $sipayConfig['complete_payment_url'];
    $sipayConfig['check_status_url'] = $sipayConfig['base_url'] . $sipayConfig['check_status_url'];

    /**
     * SiPay Token Alma - 2 saat geçerlilik
     * Her token 2 saat geçerli olduğu için cache mekanizması kullanılabilir
     */
    function getSipayToken($config) {
        $tokenData = [
            'app_id' => $config['app_id'],
            'app_secret' => $config['app_secret']
        ];

        if (!function_exists('curl_init')) {
            throw new Exception('cURL extension gerekli');
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['token_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($tokenData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('Token alma hatası: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('Token HTTP hatası: ' . $httpCode);
        }

        $data = json_decode($response, true);
        if (!$data || !isset($data['data']['token'])) {
            throw new Exception('Token response formatı hatalı');
        }

        return [
            'token' => $data['data']['token'],
            'is_3d' => $data['data']['is_3d'] ?? 1, // 0=Sadece 2D, 1=2D+3D, 2=Sadece 3D, 4=Markalı
            'expires_at' => time() + (2 * 60 * 60) // 2 saat sonra
        ];
    }

    /**
     * SiPay Resmi Hash Key Oluşturma Algoritması
     * 3D ödeme ve güvenlik doğrulaması için gerekli
     */
    function generateHashKey($total, $installment, $currency_code, $merchant_key, $invoice_id, $app_secret) {
        $data = $total . '|' . $installment . '|' . $currency_code . '|' . $merchant_key . '|' . $invoice_id;

        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($app_secret);

        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);

        $encrypted = openssl_encrypt($data, 'aes-256-cbc', $saltWithPassword, 0, $iv);
        
        if ($encrypted === false) {
            throw new Exception('Hash key şifreleme hatası');
        }

        $msg_encrypted_bundle = "$iv:$salt:$encrypted";
        $msg_encrypted_bundle = str_replace('/', '__', $msg_encrypted_bundle);

        return $msg_encrypted_bundle;
    }

    /**
     * SiPay Resmi Hash Key Doğrulama Algoritması
     * 3D return ve webhook doğrulaması için
     */
    function validateHashKey($hashKey, $secretKey) {
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            $hashKey = str_replace('__', '/', $hashKey);
            $password = sha1($secretKey);

            $components = explode(':', $hashKey);
            if (count($components) > 2) {
                $iv = $components[0] ?? "";
                $salt = $components[1] ?? "";
                $salt = hash('sha256', $password . $salt);
                $encryptedMsg = $components[2] ?? "";

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, 0, $iv);

                if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
                    $array = explode('|', $decryptedMsg);
                    $status = $array[0] ?? 0;
                    $total = $array[1] ?? 0;
                    $invoiceId = $array[2] ?? '0';
                    $orderId = $array[3] ?? 0;
                    $currencyCode = $array[4] ?? '';
                }
            }
        }

        return [$status, $total, $invoiceId, $orderId, $currencyCode];
    }

    /**
     * 2D (Non-Secure) Ödeme İşlemi
     * Hızlı ödeme - Direkt kart işlemi
     */
    function process2DPayment($paymentData, $token, $config) {
        // Items'i doğru formatta hazırla - Sipay ARRAY bekliyor!
        if (is_string($paymentData['items'])) {
            // Eğer string ise array'e çevir
            $paymentData['items'] = json_decode($paymentData['items'], true) ?: [];
        }
        
        // Items'in array olduğundan emin ol
        if (!is_array($paymentData['items'])) {
            $paymentData['items'] = [];
        }

        $paymentData['ip'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // Debug: Ödeme verilerini logla (hassas bilgiler hariç)
        securityLog('2D Payment data prepared', 'INFO', [
            'invoice_id' => $paymentData['invoice_id'],
            'total' => $paymentData['total'],
            'currency_code' => $paymentData['currency_code'],
            'installments_number' => $paymentData['installments_number'],
            'has_hash_key' => !empty($paymentData['hash_key']),
            'hash_key_length' => strlen($paymentData['hash_key']),
            'ip' => $paymentData['ip'],
            'items_format' => is_string($paymentData['items']) ? 'JSON_STRING' : 'ARRAY'
        ]);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['payment_2d_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($paymentData), // JSON olarak gönder
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json', // JSON content type
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Debug: Response'u logla
        securityLog('2D Payment API response', 'INFO', [
            'http_code' => $httpCode,
            'has_curl_error' => !empty($error),
            'curl_error' => $error,
            'response_length' => strlen($response),
            'response_preview' => substr($response, 0, 200)
        ]);

        if ($error) {
            throw new Exception('2D Ödeme cURL hatası: ' . $error);
        }

        $responseData = json_decode($response, true);
        
        // JSON decode hatası kontrolü
        if (json_last_error() !== JSON_ERROR_NONE) {
            securityLog('2D Payment JSON decode error', 'ERROR', [
                'json_error' => json_last_error_msg(),
                'raw_response' => substr($response, 0, 500)
            ]);
        }
        
        // Sipay response format kontrolü
        // status_code: 100 = başarılı, sipay_status: 1 = başarılı
        $isSuccess = ($httpCode === 200 && $responseData && (
            (isset($responseData['status_code']) && $responseData['status_code'] == 100) ||
            (isset($responseData['data']['sipay_status']) && $responseData['data']['sipay_status'] == 1) ||
            (isset($responseData['sipay_status']) && $responseData['sipay_status'] == 1)
        ));
        
        return [
            'success' => $isSuccess,
            'http_code' => $httpCode,
            'payment_type' => '2D',
            'hash_key' => $paymentData['hash_key'],
            'response' => $responseData,
            'raw_response' => $response
        ];
    }

    /**
     * 3D (Secure) Ödeme İşlemi - HTML Form Döndürür
     * Güvenli ödeme - SMS doğrulama ile banka sayfasına yönlendirme
     */
    function process3DPayment($paymentData, $token, $config) {
        // Items'i doğru formatta hazırla - Sipay ARRAY bekliyor!
        if (is_string($paymentData['items'])) {
            // Eğer string ise array'e çevir
            $paymentData['items'] = json_decode($paymentData['items'], true) ?: [];
        }
        
        // Items'in array olduğundan emin ol
        if (!is_array($paymentData['items'])) {
            $paymentData['items'] = [];
        }

        // 3D ödeme için IP ekle
        $paymentData['ip'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // 3D ödeme HTML formu oluştur
        $formHtml = generate3DPaymentForm($paymentData, $config, $token);

        return [
            'success' => true,
            'payment_type' => '3D',
            'form_html' => $formHtml,
            'redirect_needed' => true,
            'hash_key' => $paymentData['hash_key'],
            'invoice_id' => $paymentData['invoice_id']
        ];
    }

    /**
     * 3D Ödeme HTML Form Oluşturucu
     * Otomatik submit ile banka sayfasına yönlendirme
     */
    function generate3DPaymentForm($paymentData, $config, $token) {
        $formFields = '';
        
        // Tüm ödeme verilerini hidden input olarak ekle
        foreach ($paymentData as $key => $value) {
            if ($key === 'items' && is_array($value)) {
                // Items array'ini JSON string'e çevir (sadece form için)
                $value = json_encode($value);
            } elseif (is_array($value)) {
                $value = json_encode($value);
            }
            $formFields .= '<input type="hidden" name="' . htmlspecialchars($key) . '" value="' . htmlspecialchars($value) . '">' . "\n";
        }

        $html = '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Güvenli Ödeme - CalFormat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #333;
        }
        .payment-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #4f46e5;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            width: 0%;
            animation: progress 3s ease-in-out;
        }
        .security-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #166534;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="logo">🛡️</div>
        <h1 class="title">3D Güvenli Ödeme</h1>
        <p class="subtitle">Bankanızın güvenli ödeme sayfasına yönlendiriliyorsunuz...</p>
        
        <div class="spinner"></div>
        
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        
        <div class="security-info">
            <strong>🔒 Güvenli Ödeme</strong><br>
            Bu işlem 256-bit SSL şifreleme ile korunmaktadır
        </div>
        
        <form id="sipay3DForm" method="POST" action="' . $config['payment_3d_url'] . '">
            ' . $formFields . '
            <input type="hidden" name="Authorization" value="Bearer ' . htmlspecialchars($token) . '">
        </form>
    </div>

    <script>
        // Progress animation tamamlandıktan sonra formu gönder
        setTimeout(function() {
            document.getElementById("sipay3DForm").submit();
        }, 3000);
        
        // Backup - 5 saniye sonra kesin gönder
        setTimeout(function() {
            if (document.getElementById("sipay3DForm")) {
                document.getElementById("sipay3DForm").submit();
            }
        }, 5000);
    </script>
</body>
</html>';

        return $html;
    }

    /**
     * Items array'ini doğrula ve total ile eşleştir
     * Sipay API'si items toplamı ile invoice total'in eşit olmasını bekliyor
     */
    function validateAndFixItems($itemsArray, $total, $input) {
        // Eğer items boşsa default item oluştur
        if (empty($itemsArray)) {
            return [
                [
                    'name' => $input['invoice_description'] ?? 'CalFormat Ürün',
                    'price' => number_format($total, 4, '.', ''),
                    'quantity' => 1,
                    'description' => $input['invoice_description'] ?? 'CalFormat sipariş'
                ]
            ];
        }
        
        // Mevcut items'lerin toplam fiyatını hesapla
        $itemsTotal = 0;
        $processedItems = [];
        
        foreach ($itemsArray as $item) {
            $price = floatval($item['price'] ?? 0);
            $quantity = intval($item['quantity'] ?? 1);
            $itemTotal = $price * $quantity;
            $itemsTotal += $itemTotal;
            
            $processedItems[] = [
                'name' => $item['name'] ?? 'Ürün',
                'price' => number_format($price, 4, '.', ''),
                'quantity' => $quantity,
                'description' => $item['description'] ?? ($item['name'] ?? 'Ürün')
            ];
        }
        
        // Eğer toplam fiyat farklıysa düzelt
        if (abs($itemsTotal - $total) > 0.001) { // 0.001 toleransı
            // Farkı hesapla
            $difference = $total - $itemsTotal;
            
            // Eğer tek item varsa, fiyatını düzelt
            if (count($processedItems) === 1) {
                $processedItems[0]['price'] = number_format($total, 4, '.', '');
            } else {
                // Çoklu item varsa, fark için ayrı item ekle
                if (abs($difference) > 0.001) {
                    $processedItems[] = [
                        'name' => $difference > 0 ? 'Kargo/Ek Ücret' : 'İndirim',
                        'price' => number_format($difference, 4, '.', ''),
                        'quantity' => 1,
                        'description' => $difference > 0 ? 'Kargo ve ek ücretler' : 'İndirim uygulaması'
                    ];
                }
            }
        }
        
        return $processedItems;
    }

    /**
     * İstek işleyici - Ana endpoint router
     */
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    
    if ($requestMethod === 'GET') {
        // API bilgi endpoint'i
        echo json_encode([
            'success' => true,
            'service' => 'CalFormat SiPay Payment Gateway',
            'version' => '2.0',
            'supported_payment_types' => ['2D', '3D'],
            'endpoints' => [
                'payment' => 'POST /sipay_payment.php',
                'token_info' => 'GET /sipay_payment.php',
                'webhook' => 'POST /sipay_webhook.php',
                '3d_return' => 'POST /sipay_3d_return.php'
            ],
            'payment_methods' => [
                '2D' => [
                    'name' => 'Hızlı Ödeme',
                    'description' => 'Direkt kart işlemi - Anında sonuç',
                    'security' => 'Standard'
                ],
                '3D' => [
                    'name' => 'Güvenli Ödeme', 
                    'description' => 'SMS doğrulama ile bankadan onay',
                    'security' => '3D Secure'
                ]
            ],
            'features' => [
                'hash_validation' => 'AES-256-CBC şifreleme',
                'token_cache' => '2 saat geçerlilik',
                'webhook_support' => true,
                'installment_support' => true,
                'multi_currency' => ['TRY', 'USD', 'EUR']
            ],
            'test_cards' => [
                'visa' => '4111111111111111',
                'mastercard' => '5555555555554444',
                'note' => 'Test kartları için CVV: 123, Tarih: 12/25'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } elseif ($requestMethod === 'POST') {
        // Ödeme işlemi
        $input = getSecureJSONInput();
        
        if (!$input) {
            throw new Exception('Geçersiz JSON verisi');
        }

        securityLog('SiPay payment request', 'INFO', [
            'payment_type' => $input['payment_type'] ?? 'unknown',
            'total' => $input['total'] ?? 0,
            'invoice_id' => $input['invoice_id'] ?? '',
            'merchant_key' => substr($sipayConfig['merchant_key'], 0, 10) . '...' // Güvenlik için sadece ilk 10 karakter
        ]);

        // Token al
        $tokenData = getSipayToken($sipayConfig);
        if (!$tokenData['token']) {
            throw new Exception('SiPay token alınamadı');
        }

        securityLog('SiPay token obtained', 'INFO', [
            'token_length' => strlen($tokenData['token']),
            'is_3d' => $tokenData['is_3d'],
            'expires_at' => $tokenData['expires_at']
        ]);

        // Ödeme tipini belirle
        $paymentType = strtoupper($input['payment_type'] ?? '2D');
        
        // Ödeme verilerini hazırla - Sipay dokümantasyonuna göre
        $items = $input['items'] ?? [];
        
        // Items'i array olarak hazırla (JSON string değil!)
        if (is_string($items)) {
            $items = json_decode($items, true) ?: [];
        }
        
        $itemsArray = is_array($items) ? $items : [];
        $total = floatval($input['total'] ?? 0);
        
        // Items'i Sipay formatına göre hazırla ve total ile eşleştir
        $itemsForSipay = validateAndFixItems($itemsArray, $total, $input);
        
        $paymentData = [
            // Temel kart bilgileri (zorunlu)
            'cc_holder_name' => $input['cc_holder_name'] ?? '',
            'cc_no' => $input['cc_no'] ?? '',
            'expiry_month' => $input['expiry_month'] ?? '',
            'expiry_year' => $input['expiry_year'] ?? '',
            'cvv' => $input['cvv'] ?? '',
            
            // Ödeme bilgileri (zorunlu)
            'currency_code' => $input['currency_code'] ?? 'TRY',
            'installments_number' => intval($input['installments_number'] ?? 1),
            'invoice_id' => $input['invoice_id'] ?? 'CF-' . time() . '-' . rand(1000, 9999),
            'invoice_description' => $input['invoice_description'] ?? 'CalFormat Sipariş Ödemesi',
            'name' => $input['name'] ?? '',
            'surname' => $input['surname'] ?? '',
            'total' => $total,
            'merchant_key' => $sipayConfig['merchant_key'],
            
            // Items ARRAY olarak gönder (JSON string değil!)
            'items' => $itemsForSipay,
            
            // URL'ler (zorunlu)
            'cancel_url' => $input['cancel_url'] ?? 'https://calformat.com.tr/sipay_3d_return.php',
            'return_url' => $input['return_url'] ?? 'https://calformat.com.tr/sipay_3d_return.php',
            
            // Fatura bilgileri 
            'bill_address1' => $input['bill_address1'] ?? '',
            'bill_address2' => $input['bill_address2'] ?? '',
            'bill_city' => $input['bill_city'] ?? '',
            'bill_state' => $input['bill_state'] ?? '',
            'bill_postcode' => $input['bill_postcode'] ?? '',
            'bill_country' => $input['bill_country'] ?? 'TR',
            'bill_email' => $input['bill_email'] ?? 'customer@calformat.com.tr',
            'bill_phone' => $input['bill_phone'] ?? '',
            
            // İsteğe bağlı parametreler
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            'card_program' => $input['card_program'] ?? '',
            'transaction_type' => $input['transaction_type'] ?? 'Auth',
            'sale_web_hook_key' => $input['sale_web_hook_key'] ?? '',
            
            // Komisyon parametreleri (isteğe bağlı)
            'is_commission_from_user' => $input['is_commission_from_user'] ?? '',
            'commission_by' => $input['commission_by'] ?? '',
            
            // Yinelenen ödeme parametreleri (isteğe bağlı)
            'order_type' => $input['order_type'] ?? '',
            'recurring_payment_number' => $input['recurring_payment_number'] ?? '',
            'recurring_payment_cycle' => $input['recurring_payment_cycle'] ?? '',
            'recurring_payment_interval' => $input['recurring_payment_interval'] ?? '',
            'recurring_web_hook_key' => $input['recurring_web_hook_key'] ?? '',
            
            // Tarım kartları için (isteğe bağlı)
            'maturity_period' => $input['maturity_period'] ?? '',
            'payment_frequency' => $input['payment_frequency'] ?? '',
            
            // Sigorta ödemeleri için (isteğe bağlı)
            'vpos_type' => $input['vpos_type'] ?? '',
            'identity_number' => $input['identity_number'] ?? ''
        ];

        // Ödeme tipine göre işlem
        if ($paymentType === '3D') {
            // 3D ödemeler için ek parametreler
            $paymentData['response_method'] = 'POST';
            $paymentData['payment_completed_by'] = $input['payment_completed_by'] ?? 'app';
            
            // Hash key oluştur (3D için zorunlu)
            $paymentData['hash_key'] = generateHashKey(
                $paymentData['total'],
                $paymentData['installments_number'],
                $paymentData['currency_code'],
                $paymentData['merchant_key'],
                $paymentData['invoice_id'],
                $sipayConfig['app_secret']
            );
            
            $result = process3DPayment($paymentData, $tokenData['token'], $sipayConfig);
            
            // 3D ödeme için HTML döndür
            if ($result['success'] && isset($result['form_html'])) {
                header('Content-Type: text/html; charset=utf-8');
                echo $result['form_html'];
                exit();
            }
        } else {
            // 2D ödemeler için hash key oluştur (zorunlu)
            $paymentData['hash_key'] = generateHashKey(
                $paymentData['total'],
                $paymentData['installments_number'],
                $paymentData['currency_code'],
                $paymentData['merchant_key'],
                $paymentData['invoice_id'],
                $sipayConfig['app_secret']
            );
            
            $result = process2DPayment($paymentData, $tokenData['token'], $sipayConfig);
        }

        // Sonucu döndür
        echo json_encode([
            'success' => $result['success'],
            'payment_type' => $paymentType,
            'data' => $result['response'] ?? $result,
            'invoice_id' => $paymentData['invoice_id'],
            'token_info' => [
                'is_3d_enabled' => $tokenData['is_3d'],
                'expires_at' => $tokenData['expires_at']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // Desteklenmeyen HTTP metodu
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ]);
    }
    
} catch (Exception $e) {
    error_log('SiPay API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => 'SIPAY_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
