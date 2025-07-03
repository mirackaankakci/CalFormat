<?php
// SiPay API ortak fonksiyonları

// Debug logging fonksiyonu
function sipay_debug_log($message, $context = '') {
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] {$context}: " . (is_array($message) || is_object($message) ? json_encode($message) : $message) . PHP_EOL;
    
    try {
        file_put_contents(__DIR__ . '/sipay_debug.log', $log_message, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("SiPay Debug: " . $log_message);
    }
}

// SiPay token alma fonksiyonu
function sipay_get_token() {
    try {
        sipay_debug_log('Token alma işlemi başlatıldı', 'TOKEN');
        
        // SiPay API bilgileri
        $sipay_base_url = 'https://provisioning.sipay.com.tr/ccpayment';
        $merchant_key = 'b5dd4eef-e999-4dd3-bcd0-98d1aa4b1a91'; // Test merchant key
        $app_key = '4d32b32c-bc6e-41f2-ae3a-3b936e44cd4b';     // Test app key
        $app_secret = '6e54a3b2-3e08-4f72-b853-d4e8e00fb7c6';  // Test app secret
        
        // Authorization token oluştur (base64 encode)
        $auth_token = base64_encode($app_key . ':' . $app_secret);
        
        sipay_debug_log('Token isteği gönderiliyor', 'TOKEN');
        
        // Token API isteği
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $sipay_base_url . '/api/token',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false, // Test ortamı için
            CURLOPT_SSL_VERIFYHOST => false, // Test ortamı için
            CURLOPT_HTTPHEADER => [
                'Authorization: Basic ' . $auth_token,
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'merchant_key' => $merchant_key
            ])
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($curl_error) {
            throw new Exception('CURL Error: ' . $curl_error);
        }
        
        if ($http_code !== 200) {
            throw new Exception('HTTP Error: ' . $http_code . ' - ' . $response);
        }
        
        $result = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON Decode Error: ' . json_last_error_msg());
        }
        
        if (!$result || $result['status_code'] !== 100) {
            throw new Exception('API Error: ' . ($result['status_description'] ?? 'Unknown error'));
        }
        
        if (!isset($result['data']['token'])) {
            throw new Exception('Token not found in response');
        }
        
        sipay_debug_log('Token başarıyla alındı: ' . substr($result['data']['token'], 0, 20) . '...', 'TOKEN');
        
        return [
            'success' => true,
            'token' => $result['data']['token'],
            'is_3d' => $result['data']['is_3d'] ?? 1
        ];
        
    } catch (Exception $e) {
        sipay_debug_log('Token alma hatası: ' . $e->getMessage(), 'TOKEN');
        
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Hash key oluşturma fonksiyonu
function sipay_create_hash($data, $hash_key) {
    try {
        // SiPay hash algoritması
        $hash_string = '';
        
        // Gerekli alanları sırala ve birleştir
        $required_fields = [
            'merchant_key',
            'invoice_id', 
            'total',
            'currency_code',
            'installments_number'
        ];
        
        foreach ($required_fields as $field) {
            if (isset($data[$field])) {
                $hash_string .= $data[$field];
            }
        }
        
        $hash_string .= $hash_key;
        
        $hash = hash('sha256', $hash_string);
        
        sipay_debug_log('Hash oluşturuldu: ' . substr($hash, 0, 20) . '...', 'HASH');
        
        return $hash;
        
    } catch (Exception $e) {
        sipay_debug_log('Hash oluşturma hatası: ' . $e->getMessage(), 'HASH');
        return false;
    }
}

// IP adresi alma fonksiyonu
function sipay_get_client_ip() {
    $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    
    foreach ($ip_keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ips = explode(',', $_SERVER[$key]);
            $ip = trim($ips[0]);
            
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// SiPay API isteği gönderme fonksiyonu
function sipay_send_request($endpoint, $data, $token) {
    try {
        $sipay_base_url = 'https://provisioning.sipay.com.tr/ccpayment';
        
        sipay_debug_log('API isteği gönderiliyor: ' . $endpoint, 'API');
        sipay_debug_log('İstek verisi: ' . json_encode($data), 'API');
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $sipay_base_url . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode($data)
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($curl_error) {
            throw new Exception('CURL Error: ' . $curl_error);
        }
        
        sipay_debug_log('API yanıtı - HTTP Code: ' . $http_code, 'API');
        sipay_debug_log('API yanıtı - Response: ' . $response, 'API');
        
        if ($http_code !== 200) {
            throw new Exception('HTTP Error: ' . $http_code . ' - ' . $response);
        }
        
        $result = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON Decode Error: ' . json_last_error_msg());
        }
        
        return [
            'success' => true,
            'data' => $result,
            'http_code' => $http_code
        ];
        
    } catch (Exception $e) {
        sipay_debug_log('API isteği hatası: ' . $e->getMessage(), 'API');
        
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}
?>
