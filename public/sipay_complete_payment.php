<?php
/**
 * SiPay 3D Ödeme Tamamlama API
 * 3D ödeme sonrası complete/cancel işlemleri
 * 
 * Bu endpoint 3D ödemeler sonrasında kullanılır:
 * - Complete: Ödemeyi onaylayarak tamamla
 * - Cancel: Ödemeyi iptal et
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da 0

// CORS ve JSON headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];
    
    // SiPay API URL'lerini oluştur
    $sipayConfig['complete_payment_url'] = $sipayConfig['base_url'] . $sipayConfig['complete_payment_url'];

    /**
     * SiPay Token Alma
     */
    function getSipayToken($config) {
        $tokenData = [
            'app_id' => $config['app_id'],
            'app_secret' => $config['app_secret']
        ];

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

        return $data['data']['token'];
    }

    /**
     * 3D Ödeme Tamamlama/İptal İşlemi
     */
    function completePayment($action, $invoice_id, $hash_key, $token, $config) {
        $postData = [
            'invoice_id' => $invoice_id,
            'hash_key' => $hash_key
        ];

        // Action'a göre endpoint belirle
        $url = $config['complete_payment_url'];
        if ($action === 'cancel') {
            $url = str_replace('/complete', '/cancel', $url);
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('Complete payment cURL hatası: ' . $error);
        }

        $responseData = json_decode($response, true);
        
        return [
            'success' => ($httpCode === 200),
            'http_code' => $httpCode,
            'action' => $action,
            'invoice_id' => $invoice_id,
            'response' => $responseData,
            'raw_response' => $response
        ];
    }

    // Sadece POST isteği kabul et
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Sadece POST metodu desteklenir');
    }

    // Güvenli JSON girişi al
    $input = getSecureJSONInput();
    
    if (!$input) {
        throw new Exception('Geçersiz JSON verisi');
    }

    // Gerekli parametreleri kontrol et
    $requiredFields = ['action', 'invoice_id', 'hash_key'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Eksik parametre: {$field}");
        }
    }

    $action = strtolower($input['action']); // complete veya cancel
    $invoice_id = $input['invoice_id'];
    $hash_key = $input['hash_key'];

    // Action kontrolü
    if (!in_array($action, ['complete', 'cancel'])) {
        throw new Exception('Geçersiz action. Sadece "complete" veya "cancel" kabul edilir.');
    }

    securityLog('Complete payment request', 'INFO', [
        'action' => $action,
        'invoice_id' => $invoice_id,
        'hash_key_length' => strlen($hash_key)
    ]);

    // Token al
    $token = getSipayToken($sipayConfig);
    if (!$token) {
        throw new Exception('SiPay token alınamadı');
    }

    // Ödeme işlemini tamamla/iptal et
    $result = completePayment($action, $invoice_id, $hash_key, $token, $sipayConfig);

    // Başarılı sonuç
    echo json_encode([
        'success' => $result['success'],
        'action' => $action,
        'invoice_id' => $invoice_id,
        'data' => $result['response'],
        'http_code' => $result['http_code'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log('SiPay Complete Payment Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => 'COMPLETE_PAYMENT_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
