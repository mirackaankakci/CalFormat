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
                    $invoiceId = $array[2] ?? "";
                    $orderId = $array[3] ?? "";
                    $currencyCode = $array[4] ?? "TRY";

                    return [
                        'status' => (int)$status,
                        'total' => (float)$total,
                        'invoice_id' => $invoiceId,
                        'order_id' => $orderId,
                        'currency_code' => $currencyCode
                    ];
                }
            }
        }

        return false;
    }

    // Frontend URL belirleme - dinamik
    $frontendUrl = 'http://localhost:5173'; // Varsayılan

    // Canlı ortamda dinamik URL tespiti
    if (isset($_SERVER['HTTP_HOST'])) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        
        // IP adresi kontrolü
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $frontendUrl = $protocol . '://' . $host . ':5173';
        } else {
            $frontendUrl = $protocol . '://' . $host;
        }
    }

    // POST verilerini al
    $postData = $_POST;
    
    securityLog('3D Return request received', 'INFO', [
        'post_data_keys' => array_keys($postData),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);

    // Gerekli parametreler var mı kontrol et
    $requiredParams = ['sipay_status', 'invoice_id', 'hash_key'];
    foreach ($requiredParams as $param) {
        if (!isset($postData[$param])) {
            throw new Exception("Required parameter missing: $param");
        }
    }

    $sipayStatus = $postData['sipay_status'];
    $invoiceId = $postData['invoice_id'];
    $hashKey = $postData['hash_key'];
    $orderNo = $postData['order_no'] ?? $invoiceId;

    // Hash key doğrulama
    $validationResult = validateHashKey($hashKey, $sipayConfig['hash_key']);
    
    if ($validationResult !== false) {
        $transactionData = [
            'status' => $validationResult['status'],
            'total' => $validationResult['total'],
            'invoice_id' => $validationResult['invoice_id'],
            'order_no' => $orderNo,
            'currency_code' => $validationResult['currency_code'] ?? 'TRY'
        ];

        $isSuccessful = ($sipayStatus == '1' && $validationResult['status'] == 1);

        if ($isSuccessful) {
            $redirectUrl = $frontendUrl . '/checkout?status=success&sipay_status=1&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']);
        } else {
            $redirectUrl = $frontendUrl . '/checkout?status=failed&sipay_status=0&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']);
        }
        
        // Direkt yönlendirme - ara ekran yok
        header('Location: ' . $redirectUrl);
        exit();
    } else {
        // Hash key doğrulama başarısız
        securityLog('Hash key validation failed', 'ERROR', [
            'provided_hash' => $hashKey ?? 'missing',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        $redirectUrl = $frontendUrl . '/checkout?status=failed&error=validation_failed';
        header('Location: ' . $redirectUrl);
        exit();
    }

} catch (Exception $e) {
    error_log('3D Return Error: ' . $e->getMessage());
    
    // Hata durumunda da yönlendirme yap
    $frontendUrl = 'http://localhost:5173';
    if (isset($_SERVER['HTTP_HOST'])) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $frontendUrl = $protocol . '://' . $host . ':5173';
        } else {
            $frontendUrl = $protocol . '://' . $host;
        }
    }
    
    $redirectUrl = $frontendUrl . '/checkout?status=failed&error=system_error';
    header('Location: ' . $redirectUrl);
    exit();
}
?>
