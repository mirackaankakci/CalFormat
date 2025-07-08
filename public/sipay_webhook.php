<?php
/**
 * SiPay Webhook Handler
 * Yinelenen ödemeler ve ödeme durumu bildirimleri için
 * 
 * SiPay tarafından ödeme durumu değişikliklerinde çağrılır
 * Hash key doğrulaması ile güvenli webhook işlemi
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
     * Webhook işleyici
     */
    function handleWebhook($webhookData, $config) {
        // Webhook için hash key doğrulaması
        if (!isset($webhookData['hash_key'])) {
            throw new Exception('Webhook hash key bulunamadı');
        }

        list($status, $total, $invoiceId, $orderId, $currencyCode) = validateHashKey(
            $webhookData['hash_key'], 
            $config['app_secret']
        );
        
        // Webhook için özel status kontrolü
        // Webhook'ta status: COMPLETED = başarılı, FAIL = başarısız
        $isSuccessful = ($status === 'COMPLETED');
        
        $result = [
            'success' => true,
            'event_type' => 'webhook',
            'webhook_processed' => true,
            'payment_status' => $status,
            'payment_successful' => $isSuccessful,
            'hash_validated' => !empty($status),
            'webhook_data' => [
                'invoice_id' => $invoiceId,
                'order_id' => $orderId,
                'total' => $total,
                'currency_code' => $currencyCode,
                'status' => $status,
                'raw_data' => $webhookData
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Duruma göre işlemler
        if ($isSuccessful) {
            $result['action'] = 'payment_completed';
            $result['message'] = 'Ödeme başarıyla tamamlandı - Webhook onaylandı';
            
            // Burada siparişi tamamlama, stok güncelleme vb. işlemler yapılabilir
            $result['next_steps'] = [
                'update_order_status' => 'completed',
                'send_confirmation_email' => true,
                'update_inventory' => true,
                'generate_invoice' => true
            ];
            
        } else {
            $result['action'] = 'payment_failed';
            $result['message'] = 'Ödeme başarısız - Webhook bildirimi';
            
            $result['next_steps'] = [
                'update_order_status' => 'failed',
                'send_failure_email' => true,
                'restore_inventory' => true,
                'log_failure_reason' => true
            ];
        }

        // Yinelenen ödeme kontrolü
        if (isset($webhookData['recurring_payment_id'])) {
            $result['recurring_payment'] = [
                'is_recurring' => true,
                'recurring_id' => $webhookData['recurring_payment_id'],
                'cycle_number' => $webhookData['cycle_number'] ?? 1,
                'next_payment_date' => $webhookData['next_payment_date'] ?? null
            ];
        }

        return $result;
    }

    /**
     * Webhook log kaydetme
     */
    function logWebhook($webhookData, $result) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'webhook_data' => $webhookData,
            'processing_result' => $result,
            'hash' => md5(json_encode($webhookData))
        ];

        // Log dosyasına yaz (production'da database'e kaydedilebilir)
        $logFile = __DIR__ . '/logs/sipay_webhook_' . date('Y-m-d') . '.log';
        if (!is_dir(dirname($logFile))) {
            mkdir(dirname($logFile), 0755, true);
        }
        
        file_put_contents(
            $logFile, 
            json_encode($logEntry) . "\n", 
            FILE_APPEND | LOCK_EX
        );
        
        return $logEntry['hash'];
    }

    // İstek işleme
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Webhook verilerini güvenli şekilde al
        $webhookData = getSecureJSONInput();
        
        // JSON yoksa form data'yı dene
        if (!$webhookData) {
            $webhookData = sanitizeInput($_POST);
        }

        if (empty($webhookData)) {
            throw new Exception('Webhook verisi bulunamadı');
        }

        securityLog('SiPay webhook received', 'INFO', [
            'invoice_id' => $webhookData['invoice_id'] ?? '',
            'order_id' => $webhookData['order_id'] ?? '',
            'status' => $webhookData['status'] ?? ''
        ]);

        // Webhook'u işle
        $result = handleWebhook($webhookData, $sipayConfig);
        
        // Log kaydet
        $logHash = logWebhook($webhookData, $result);
        $result['log_hash'] = $logHash;
        
        // SiPay'e başarılı işlem döndür
        http_response_code(200);
        echo json_encode($result);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Webhook endpoint bilgisi
        echo json_encode([
            'success' => true,
            'service' => 'SiPay Webhook Handler',
            'description' => 'Yinelenen ödemeler ve ödeme durumu bildirimleri',
            'webhook_url' => 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'],
            'supported_methods' => ['POST'],
            'security' => [
                'hash_validation' => 'AES-256-CBC',
                'ip_whitelist' => 'SiPay sunucuları',
                'logging' => 'Tam webhook logları'
            ],
            'webhook_status_codes' => [
                'COMPLETED' => 'Ödeme başarılı',
                'FAIL' => 'Ödeme başarısız',
                'PENDING' => 'Ödeme beklemede',
                'CANCELLED' => 'Ödeme iptal edildi'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);

    } else {
        throw new Exception('Desteklenmeyen HTTP method');
    }

} catch (Exception $e) {
    error_log('Webhook Error: ' . $e->getMessage());
    
    // Webhook hatalarında da 200 döndür (SiPay tekrar denemesin)
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => 'WEBHOOK_ERROR',
        'webhook_processed' => false,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
