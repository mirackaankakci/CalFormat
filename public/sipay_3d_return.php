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

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, null, $iv);

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
        echo json_encode($result);

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
            echo json_encode($result);
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
