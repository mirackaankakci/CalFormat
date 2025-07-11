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
     * Hash key doğrulama fonksiyonu - Geliştirilmiş debugging ile
     */
    function validateHashKey($hashKey, $secretKey) {
        // Debug için hash validation adımlarını logla
        securityLog('Hash validation debug start', 'INFO', [
            'hash_key_length' => strlen($hashKey ?? ''),
            'secret_key_length' => strlen($secretKey ?? ''),
            'hash_key_preview' => substr($hashKey ?? '', 0, 50) . '...',
            'secret_key_preview' => substr($secretKey ?? '', 0, 10) . '...'
        ]);
        
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            // Hash key'deki __ karakterlerini / ile değiştir
            $originalHashKey = $hashKey;
            $hashKey = str_replace('__', '/', $hashKey);
            
            if ($originalHashKey !== $hashKey) {
                securityLog('Hash key character replacement', 'INFO', [
                    'original_length' => strlen($originalHashKey),
                    'modified_length' => strlen($hashKey),
                    'replacement_count' => substr_count($originalHashKey, '__')
                ]);
            }
            
            $password = sha1($secretKey);
            
            securityLog('Hash validation password generation', 'INFO', [
                'password_length' => strlen($password),
                'password_preview' => substr($password, 0, 10) . '...'
            ]);

            $components = explode(':', $hashKey);
            securityLog('Hash key components analysis', 'INFO', [
                'components_count' => count($components),
                'iv_length' => strlen($components[0] ?? ''),
                'salt_length' => strlen($components[1] ?? ''),
                'encrypted_msg_length' => strlen($components[2] ?? ''),
                'component_0' => $components[0] ?? 'missing',
                'component_1' => $components[1] ?? 'missing',
                'component_2_preview' => substr($components[2] ?? '', 0, 20) . '...'
            ]);
            
            if (count($components) > 2) {
                $iv = $components[0] ?? "";
                $salt = $components[1] ?? "";
                
                securityLog('Hash validation before salt processing', 'INFO', [
                    'original_salt' => $salt,
                    'password_for_salt' => substr($password, 0, 10) . '...'
                ]);
                
                $salt = hash('sha256', $password . $salt);
                $encryptedMsg = $components[2] ?? "";

                securityLog('Hash validation prepared for decryption', 'INFO', [
                    'iv' => $iv,
                    'processed_salt_preview' => substr($salt, 0, 10) . '...',
                    'encrypted_msg_preview' => substr($encryptedMsg, 0, 20) . '...'
                ]);

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, 0, $iv);

                securityLog('Hash decryption attempt', 'INFO', [
                    'decryption_success' => $decryptedMsg !== false,
                    'decrypted_length' => strlen($decryptedMsg ?: ''),
                    'contains_delimiter' => $decryptedMsg ? (strpos($decryptedMsg, '|') !== false) : false,
                    'decrypted_content' => $decryptedMsg ?: 'decryption_failed'
                ]);

                if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
                    $array = explode('|', $decryptedMsg);
                    $status = $array[0] ?? 0;
                    $total = $array[1] ?? 0;
                    $invoiceId = $array[2] ?? "";
                    $orderId = $array[3] ?? "";
                    $currencyCode = $array[4] ?? "TRY";

                    securityLog('Hash validation SUCCESS', 'INFO', [
                        'status' => $status,
                        'total' => $total,
                        'invoice_id' => $invoiceId,
                        'order_id' => $orderId,
                        'currency_code' => $currencyCode
                    ]);

                    return [
                        'status' => (int)$status,
                        'total' => (float)$total,
                        'invoice_id' => $invoiceId,
                        'order_id' => $orderId,
                        'currency_code' => $currencyCode
                    ];
                } else {
                    securityLog('Hash validation - decryption failed or wrong format', 'WARNING', [
                        'decrypted_msg' => $decryptedMsg ?: 'null',
                        'has_delimiter' => $decryptedMsg ? (strpos($decryptedMsg, '|') !== false) : false
                    ]);
                }
            } else {
                securityLog('Hash validation - insufficient components', 'WARNING', [
                    'components_count' => count($components),
                    'required_components' => 3
                ]);
            }
        } else {
            securityLog('Hash validation - empty hash key', 'WARNING', [
                'hash_key_provided' => !empty($hashKey)
            ]);
        }

        securityLog('Hash validation FAILED', 'ERROR', [
            'reason' => 'validation_process_failed'
        ]);
        return false;
    }

    // Frontend URL belirleme - config'ten direkt al
    $frontendUrl = $config['frontend_url'];
    
    // Debug için log
    securityLog('Frontend URL determined', 'INFO', [
        'frontend_url' => $frontendUrl,
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown'
    ]);

    // POST verilerini al
    $postData = $_POST;
    $getData = $_GET;
    
    securityLog('3D Return request received', 'INFO', [
        'post_data_keys' => array_keys($postData),
        'post_data' => $postData, // Tam veriyi logla
        'get_data' => $getData, // GET verilerini de logla
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'frontend_url' => $frontendUrl
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
    $validationResult = validateHashKey($hashKey, $sipayConfig['app_secret']);
    
    // Debug için hash key bilgilerini logla
    securityLog('Hash key validation attempt', 'INFO', [
        'hash_key_exists' => !empty($hashKey),
        'secret_key_exists' => !empty($sipayConfig['app_secret']),
        'sipay_status' => $sipayStatus,
        'invoice_id' => $invoiceId,
        'validation_result' => $validationResult !== false ? 'success' : 'failed'
    ]);
    
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
            $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']);
            
            securityLog('3D Payment SUCCESS - Redirecting', 'INFO', [
                'redirect_url' => $redirectUrl,
                'invoice_id' => $transactionData['invoice_id'],
                'sipay_status' => $sipayStatus
            ]);
        } else {
            $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']);
            
            securityLog('3D Payment FAILED - Redirecting', 'WARNING', [
                'redirect_url' => $redirectUrl,
                'invoice_id' => $transactionData['invoice_id'],
                'sipay_status' => $sipayStatus,
                'validation_status' => $validationResult['status']
            ]);
        }
        
        // Direkt yönlendirme - ara ekran yok
        header('Location: ' . $redirectUrl);
        exit();
    } else {
        // Hash key doğrulama başarısız - production modunda sıkı kontrol
        securityLog('Hash key validation failed - PRODUCTION MODE', 'ERROR', [
            'provided_hash' => $hashKey ?? 'missing',
            'secret_key_configured' => !empty($sipayConfig['app_secret']),
            'sipay_status' => $sipayStatus,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'test_mode' => $sipayConfig['test_mode'] ?? 'unknown'
        ]);
        
        // Production modunda hash validation zorunlu
        if (!$sipayConfig['test_mode']) {
            $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=hash_validation_failed_production';
            
            securityLog('Production hash validation failed - payment rejected', 'ERROR', [
                'sipay_status' => $sipayStatus,
                'invoice_id' => $invoiceId,
                'reason' => 'production_mode_hash_validation_required'
            ]);
        } else {
            // Test modunda SiPay status'u başarılıysa hash doğrulama başarısız olsa bile işleme devam et
            if ($sipayStatus == '1') {
                securityLog('Processing payment despite hash validation failure - TEST MODE', 'WARNING', [
                    'sipay_status' => $sipayStatus,
                    'invoice_id' => $invoiceId,
                    'reason' => 'test_mode_sipay_status_successful'
                ]);
                
                $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&hash_bypass=1';
            } else {
                $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=hash_validation_failed';
            }
        }
        
        header('Location: ' . $redirectUrl);
        exit();
    }

} catch (Exception $e) {
    error_log('3D Return Error: ' . $e->getMessage());
    
    // Hata durumunda da yönlendirme yap
    $redirectUrl = '/payment_success.php?status=failed&error=system_error';
    header('Location: ' . $redirectUrl);
    exit();
}
?>
