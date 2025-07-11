<?php
/**
 * SiPay Debug Test Sayfası
 * Test kartı ile ödeme testi ve detaylı hata analizi
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

// Konfigürasyonu yükle
define('INTERNAL_ACCESS', true);
$config = require_once __DIR__ . '/config.php';
$sipayConfig = $config['sipay'];

// SiPay API URL'lerini oluştur
$sipayConfig['token_url'] = $sipayConfig['base_url'] . $sipayConfig['token_url'];
$sipayConfig['payment_2d_url'] = $sipayConfig['base_url'] . $sipayConfig['payment_2d_url'];

echo "<h1>🔧 SiPay Debug Test</h1>";

echo "<h2>📋 Konfigürasyon</h2>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Parametre</th><th>Değer</th></tr>";
echo "<tr><td>Test Mode</td><td>" . ($sipayConfig['test_mode'] ? '✅ Aktif' : '❌ Kapalı') . "</td></tr>";
echo "<tr><td>Base URL</td><td>" . htmlspecialchars($sipayConfig['base_url']) . "</td></tr>";
echo "<tr><td>App ID</td><td>" . htmlspecialchars($sipayConfig['app_id']) . "</td></tr>";
echo "<tr><td>App Secret</td><td>" . substr($sipayConfig['app_secret'], 0, 10) . "...</td></tr>";
echo "<tr><td>Merchant ID</td><td>" . htmlspecialchars($sipayConfig['merchant_id']) . "</td></tr>";
echo "<tr><td>Token URL</td><td>" . htmlspecialchars($sipayConfig['token_url']) . "</td></tr>";
echo "<tr><td>Payment 2D URL</td><td>" . htmlspecialchars($sipayConfig['payment_2d_url']) . "</td></tr>";
echo "</table>";

// Token alma testi
echo "<h2>🔑 Token Alma Testi</h2>";

try {
    $tokenData = [
        'app_id' => $sipayConfig['app_id'],
        'app_secret' => $sipayConfig['app_secret']
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $sipayConfig['token_url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($tokenData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'User-Agent: CalFormat-SiPay-Debug/1.0'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    echo "<p><strong>HTTP Code:</strong> " . $httpCode . "</p>";
    
    if ($error) {
        echo "<p style='color: red;'><strong>cURL Error:</strong> " . htmlspecialchars($error) . "</p>";
    }

    echo "<p><strong>Response:</strong></p>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
    echo htmlspecialchars($response);
    echo "</pre>";

    $responseData = json_decode($response, true);
    
    if ($responseData && isset($responseData['data']['token'])) {
        echo "<p style='color: green;'>✅ <strong>Token başarıyla alındı!</strong></p>";
        echo "<p><strong>Token:</strong> " . substr($responseData['data']['token'], 0, 20) . "...</p>";
        echo "<p><strong>3D Support:</strong> " . ($responseData['data']['is_3d'] ?? 'Belirtilmemiş') . "</p>";
        
        $token = $responseData['data']['token'];
        
        // Test ödeme verisi hazırla
        echo "<h2>💳 Test Ödeme Denemesi</h2>";
        
        $testPaymentData = [
            // SiPay resmi test kartı bilgileri
            'cc_holder_name' => 'TEST USER',
            'cc_no' => '4508034508034509', // SiPay resmi test kartı
            'expiry_month' => '12',
            'expiry_year' => '26', // 2026
            'cvv' => '000', // SiPay test kartı için CVV
            
            // Ödeme bilgileri
            'currency_code' => 'TRY',
            'installments_number' => 1,
            'invoice_id' => 'TEST-' . time(),
            'invoice_description' => 'Test ödemesi - SiPay Debug',
            'name' => 'Test',
            'surname' => 'User',
            'total' => 1.00, // 1 TL test
            'merchant_key' => $sipayConfig['merchant_key'],
            
            // Test items
            'items' => [
                [
                    'name' => 'Test Ürün',
                    'price' => 1.00,
                    'quantity' => 1,
                    'description' => 'Test ürün açıklaması'
                ]
            ],
            
            // URL'ler
            'cancel_url' => 'http://89.252.132.90/payment_success.php?status=cancel',
            'return_url' => 'http://89.252.132.90/payment_success.php?status=success',
            
            // Fatura bilgileri
            'bill_address1' => 'Test Adres',
            'bill_city' => 'İstanbul',
            'bill_state' => 'İstanbul',
            'bill_postcode' => '34000',
            'bill_country' => 'TR',
            'bill_email' => 'test@calformat.com.tr',
            'bill_phone' => '05551234567',
            
            // IP
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ];
        
        // Hash key oluştur
        $data = $testPaymentData['total'] . '|' . $testPaymentData['installments_number'] . '|' . $testPaymentData['currency_code'] . '|' . $testPaymentData['merchant_key'] . '|' . $testPaymentData['invoice_id'];
        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($sipayConfig['app_secret']);
        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);
        $encrypted = openssl_encrypt($data, 'aes-256-cbc', $saltWithPassword, 0, $iv);
        $msg_encrypted_bundle = "$iv:$salt:$encrypted";
        $testPaymentData['hash_key'] = str_replace('/', '__', $msg_encrypted_bundle);
        
        echo "<p><strong>Test Payment Data:</strong></p>";
        echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
        $displayData = $testPaymentData;
        $displayData['cc_no'] = '****' . substr($testPaymentData['cc_no'], -4);
        $displayData['cvv'] = '***';
        echo htmlspecialchars(json_encode($displayData, JSON_PRETTY_PRINT));
        echo "</pre>";
        
        // 2D ödeme testi
        $ch2 = curl_init();
        curl_setopt_array($ch2, [
            CURLOPT_URL => $sipayConfig['payment_2d_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($testPaymentData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay-Debug/1.0'
            ]
        ]);

        $paymentResponse = curl_exec($ch2);
        $paymentHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        $paymentError = curl_error($ch2);
        curl_close($ch2);

        echo "<p><strong>Payment HTTP Code:</strong> " . $paymentHttpCode . "</p>";
        
        if ($paymentError) {
            echo "<p style='color: red;'><strong>Payment cURL Error:</strong> " . htmlspecialchars($paymentError) . "</p>";
        }

        echo "<p><strong>Payment Response:</strong></p>";
        echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
        echo htmlspecialchars($paymentResponse);
        echo "</pre>";

        $paymentData = json_decode($paymentResponse, true);
        
        if ($paymentData) {
            echo "<h3>📊 Payment Response Analizi</h3>";
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>Parametre</th><th>Değer</th></tr>";
            
            // Ana parametreler
            echo "<tr><td>Status Code</td><td>" . ($paymentData['status_code'] ?? 'Yok') . "</td></tr>";
            echo "<tr><td>SiPay Status</td><td>" . ($paymentData['data']['sipay_status'] ?? $paymentData['sipay_status'] ?? 'Yok') . "</td></tr>";
            echo "<tr><td>Message</td><td>" . htmlspecialchars($paymentData['message'] ?? $paymentData['data']['message'] ?? 'Yok') . "</td></tr>";
            
            // Hata kodları
            if (isset($paymentData['error_code'])) {
                echo "<tr><td>Error Code</td><td style='color: red;'>" . htmlspecialchars($paymentData['error_code']) . "</td></tr>";
            }
            
            // Data içeriği
            if (isset($paymentData['data'])) {
                foreach ($paymentData['data'] as $key => $value) {
                    if (!is_array($value)) {
                        echo "<tr><td>Data.$key</td><td>" . htmlspecialchars($value) . "</td></tr>";
                    }
                }
            }
            
            echo "</table>";
            
            // Başarı durumu
            $isSuccess = ($paymentHttpCode === 200 && $paymentData && (
                (isset($paymentData['status_code']) && $paymentData['status_code'] == 100) ||
                (isset($paymentData['data']['sipay_status']) && $paymentData['data']['sipay_status'] == 1) ||
                (isset($paymentData['sipay_status']) && $paymentData['sipay_status'] == 1)
            ));
            
            if ($isSuccess) {
                echo "<p style='color: green; font-size: 18px; font-weight: bold;'>✅ ÖDEME BAŞARILI!</p>";
            } else {
                echo "<p style='color: red; font-size: 18px; font-weight: bold;'>❌ ÖDEME BAŞARISIZ!</p>";
                
                // Olası nedenler
                echo "<h3>🔍 Olası Başarısızlık Nedenleri</h3>";
                echo "<ul>";
                echo "<li>Merchant bilgileri hatalı olabilir</li>";
                echo "<li>Test kartı SiPay test ortamında geçerli olmayabilir</li>";
                echo "<li>Hash key algoritması hatalı olabilir</li>";
                echo "<li>API URL'leri yanlış olabilir</li>";
                echo "<li>İstek formatı SiPay beklentilerine uygun olmayabilir</li>";
                echo "</ul>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>❌ <strong>Token alınamadı!</strong></p>";
        echo "<p>Merchant bilgilerinizi kontrol edin.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color: red;'><strong>Hata:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<p><small>Debug Test - " . date('Y-m-d H:i:s') . "</small></p>";
?>
