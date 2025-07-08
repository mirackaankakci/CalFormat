<?php
/**
 * SiPay 3D Return Handler
 * 3D güvenli ödeme sonrası geri dönüş işleyicisi
 * 
 * Bu endpoint 3D ödeme tamamlandıktan sonra SiPay tarafından çağrılır
 * Hash key doğrulaması yaparak güvenli sonuç döndürür
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];

    /**
     * Hash key doğrulama fonksiyonu
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
     * Kullanıcı dostu HTML dönüş sayfası göster
     */
    function displayReturnPage($result, $config) {
        // Header'ı HTML'e çevir
        header('Content-Type: text/html; charset=utf-8');
        
        $isSuccessful = $result['payment_successful'];
        $transactionData = $result['transaction_data'];
        
        // Frontend redirect URL'i hazırla
        $frontendUrl = $config['frontend_url'] ?? 'http://localhost:5173';
        
        if ($isSuccessful) {
            $redirectUrl = $frontendUrl . '/checkout?status=success&invoice_id=' . urlencode($transactionData['invoice_id']);
            $statusClass = 'success';
            $statusIcon = '✅';
            $statusMessage = 'Ödeme Başarılı!';
            $statusDescription = 'Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmaya başlanacak.';
            $bgColor = '#d4edda';
            $borderColor = '#c3e6cb';
            $textColor = '#155724';
        } else {
            $redirectUrl = $frontendUrl . '/checkout?status=failed&invoice_id=' . urlencode($transactionData['invoice_id']);
            $statusClass = 'error';
            $statusIcon = '❌';
            $statusMessage = 'Ödeme Başarısız!';
            $statusDescription = 'Ödemeniz tamamlanamadı. Lütfen tekrar deneyin.';
            $bgColor = '#f8d7da';
            $borderColor = '#f5c6cb';
            $textColor = '#721c24';
        }
        
        echo '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ödeme Sonucu - CalFormat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .header {
            background: ' . $bgColor . ';
            border-bottom: 3px solid ' . $borderColor . ';
            padding: 30px;
            color: ' . $textColor . ';
        }
        
        .status-icon {
            font-size: 60px;
            margin-bottom: 15px;
        }
        
        .status-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .status-description {
            font-size: 16px;
            line-height: 1.4;
            opacity: 0.8;
        }
        
        .content {
            padding: 30px;
        }
        
        .transaction-info {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: left;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .info-label {
            color: #6c757d;
            font-weight: 500;
        }
        
        .info-value {
            color: #495057;
            font-weight: 600;
        }
        
        .countdown {
            background: #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 16px;
            color: #495057;
        }
        
        .countdown-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        
        .btn-group {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #545b62;
            transform: translateY(-2px);
        }
        
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .content {
                padding: 20px;
            }
            
            .btn-group {
                flex-direction: column;
            }
            
            .status-icon {
                font-size: 48px;
            }
            
            .status-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status-icon">' . $statusIcon . '</div>
            <div class="status-title">' . $statusMessage . '</div>
            <div class="status-description">' . $statusDescription . '</div>
        </div>
        
        <div class="content">
            <div class="transaction-info">
                <div class="info-row">
                    <span class="info-label">Sipariş No:</span>
                    <span class="info-value">' . htmlspecialchars($transactionData['order_no']) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fatura ID:</span>
                    <span class="info-value">' . htmlspecialchars($transactionData['invoice_id']) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tutar:</span>
                    <span class="info-value">' . number_format($transactionData['total'], 2) . ' ' . $transactionData['currency_code'] . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ödeme Türü:</span>
                    <span class="info-value">3D Güvenli Ödeme</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tarih:</span>
                    <span class="info-value">' . date('d.m.Y H:i') . '</span>
                </div>
            </div>
            
            <div class="countdown">
                <div>Otomatik yönlendiriliyor...</div>
                <div class="countdown-number" id="countdown">5</div>
            </div>
            
            <div class="btn-group">
                <a href="' . $redirectUrl . '" class="btn btn-primary">
                    🏠 Ana Sayfaya Dön
                </a>
                <a href="' . $frontendUrl . '/contact" class="btn btn-secondary">
                    📞 Destek
                </a>
            </div>
        </div>
    </div>
    
    <script>
        let countdown = 5;
        const countdownElement = document.getElementById("countdown");
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = "' . $redirectUrl . '";
            }
        }, 1000);
        
        // Hemen yönlendir butonu
        document.addEventListener("keydown", function(event) {
            if (event.key === "Enter" || event.key === " ") {
                clearInterval(timer);
                window.location.href = "' . $redirectUrl . '";
            }
        });
    </script>
</body>
</html>';
    }

    /**
     * 3D Return işleyici
     */
    function handle3DReturn($postData, $config) {
        // Gerekli parametreler var mı kontrol et
        $requiredParams = ['sipay_status', 'invoice_id', 'hash_key'];
        foreach ($requiredParams as $param) {
            if (!isset($postData[$param])) {
                throw new Exception("Eksik parametre: $param");
            }
        }

        // Hash key doğrulaması
        list($status, $total, $invoiceId, $orderId, $currencyCode) = validateHashKey(
            $postData['hash_key'], 
            $config['app_secret']
        );
        
        // Ödeme durumu analizi
        $isSuccessful = ($postData['sipay_status'] == '1' && ($status == '1' || $status === 1));
        
        $result = [
            'success' => true,
            'payment_type' => '3D_RETURN',
            'payment_successful' => $isSuccessful,
            'payment_status' => $postData['sipay_status'],
            'hash_validated' => !empty($status),
            'transaction_data' => [
                'sipay_status' => $postData['sipay_status'],
                'order_no' => $postData['order_no'] ?? $postData['order_id'] ?? '',
                'invoice_id' => $postData['invoice_id'],
                'total' => $total,
                'currency_code' => $currencyCode,
                'status_description' => $postData['status_description'] ?? '',
                'transaction_type' => $postData['transaction_type'] ?? '',
                'payment_method' => $postData['payment_method'] ?? '',
                'md_status' => $postData['md_status'] ?? '',
                'auth_code' => $postData['auth_code'] ?? ''
            ],
            'validation' => [
                'hash_status' => $status,
                'hash_total' => $total,
                'hash_invoice_id' => $invoiceId,
                'hash_order_id' => $orderId,
                'hash_currency' => $currencyCode
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Başarı durumuna göre ekstra bilgiler
        if ($isSuccessful) {
            $result['message'] = 'Ödeme başarıyla tamamlandı';
            $result['next_action'] = 'redirect_success';
        } else {
            $result['message'] = 'Ödeme başarısız oldu';
            $result['next_action'] = 'redirect_cancel';
            $result['error_details'] = [
                'status_description' => $postData['status_description'] ?? 'Bilinmeyen hata',
                'error_code' => $postData['error_code'] ?? '',
                'original_bank_error' => $postData['original_bank_error_description'] ?? ''
            ];
        }

        return $result;
    }

    // İstek işleme
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // POST verilerini güvenli şekilde al
        $postData = sanitizeInput($_POST);
        
        if (empty($postData)) {
            $jsonData = getSecureJSONInput();
            if ($jsonData) {
                $postData = $jsonData;
            }
        }

        if (empty($postData)) {
            throw new Exception('3D Return verisi bulunamadı');
        }

        // URL'den gelen parametreleri de kontrol et
        $urlParams = sanitizeInput($_GET);
        $postData = array_merge($urlParams, $postData);

        securityLog('3D Return POST request', 'INFO', [
            'sipay_status' => $postData['sipay_status'] ?? '',
            'invoice_id' => $postData['invoice_id'] ?? ''
        ]);

        $result = handle3DReturn($postData, $sipayConfig);
        
        // JSON response istenip istenmediğini kontrol et
        $isJsonRequest = (
            isset($postData['format']) && $postData['format'] === 'json' ||
            isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false ||
            isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], 'curl') !== false ||
            isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest'
        );
        
        if ($isJsonRequest) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result);
        } else {
            // 3D ödeme sonrası kullanıcı dostu HTML sayfası göster
            displayReturnPage($result, $config);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // URL parametrelerinden 3D return verilerini işle
        $getParams = sanitizeInput($_GET);
        
        if (empty($getParams)) {
            // API bilgisi döndür
            echo json_encode([
                'success' => true,
                'service' => 'SiPay 3D Return Handler',
                'description' => '3D güvenli ödeme sonrası geri dönüş işleyicisi',
                'supported_methods' => ['GET', 'POST'],
                'required_params' => ['sipay_status', 'invoice_id', 'hash_key'],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            $result = handle3DReturn($getParams, $sipayConfig);
            
            // GET request için de aynı güzel HTML sayfasını göster
            displayReturnPage($result, $config);
        }
    }

} catch (Exception $e) {
    error_log('3D Return Error: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => '3D_RETURN_ERROR',
        'payment_type' => '3D_RETURN',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
