<?php
/**
 * Basit SiPay Token Test
 * En basit yöntemle token alma testi
 */

// Güvenlik
require_once __DIR__ . '/security_new.php';

// Konfigürasyon
define('INTERNAL_ACCESS', true);
$config = require_once __DIR__ . '/config.php';
$sipayConfig = $config['sipay'];

echo "<h2>🔧 SiPay Token Test - Basit Yöntem</h2>";
echo "<hr>";

// Token URL'ini oluştur
$sipayConfig['token_url'] = $sipayConfig['base_url'] . $sipayConfig['token_url'];

echo "<h3>📋 Yapılandırma:</h3>";
echo "<table border='1' style='border-collapse: collapse; padding: 5px;'>";
echo "<tr><td><strong>Token URL</strong></td><td>" . htmlspecialchars($sipayConfig['token_url']) . "</td></tr>";
echo "<tr><td><strong>App ID</strong></td><td>" . htmlspecialchars($sipayConfig['app_id']) . "</td></tr>";
echo "<tr><td><strong>App Secret</strong></td><td>" . htmlspecialchars(substr($sipayConfig['app_secret'], 0, 10)) . "...</td></tr>";
echo "<tr><td><strong>Test Mode</strong></td><td>" . ($sipayConfig['test_mode'] ? 'YES' : 'NO') . "</td></tr>";
echo "</table>";

echo "<h3>🚀 Token Alma Testi:</h3>";

try {
    // Basit token request
    $tokenData = [
        'app_id' => $sipayConfig['app_id'],
        'app_secret' => $sipayConfig['app_secret']
    ];

    echo "<p><strong>Request Data:</strong><br>";
    echo "<pre>" . json_encode($tokenData, JSON_PRETTY_PRINT) . "</pre>";

    // cURL isteği
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $sipayConfig['token_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($tokenData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    echo "<p><strong>HTTP Code:</strong> " . $httpCode . "</p>";
    
    if ($error) {
        echo "<p style='color: red;'><strong>cURL Error:</strong> " . $error . "</p>";
    } else {
        echo "<p style='color: green;'><strong>cURL:</strong> OK</p>";
    }

    echo "<p><strong>Raw Response:</strong><br>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        
        echo "<p><strong>Parsed JSON:</strong><br>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";

        // Token kontrolü
        if (isset($data['data']['token'])) {
            echo "<p style='color: green; font-size: 18px;'><strong>✅ TOKEN BAŞARILI!</strong></p>";
            echo "<p><strong>Token:</strong> " . substr($data['data']['token'], 0, 50) . "...</p>";
        } elseif (isset($data['token'])) {
            echo "<p style='color: green; font-size: 18px;'><strong>✅ TOKEN BAŞARILI!</strong></p>";
            echo "<p><strong>Token:</strong> " . substr($data['token'], 0, 50) . "...</p>";
        } elseif (isset($data['access_token'])) {
            echo "<p style='color: green; font-size: 18px;'><strong>✅ TOKEN BAŞARILI!</strong></p>";
            echo "<p><strong>Token:</strong> " . substr($data['access_token'], 0, 50) . "...</p>";
        } else {
            echo "<p style='color: red; font-size: 18px;'><strong>❌ TOKEN FORMATINDA SORUN!</strong></p>";
            echo "<p>Expected keys: data.token, token, or access_token</p>";
        }
    } else {
        echo "<p style='color: red; font-size: 18px;'><strong>❌ HTTP HATASI!</strong></p>";
    }

} catch (Exception $e) {
    echo "<p style='color: red; font-size: 18px;'><strong>❌ HATA:</strong> " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><small>Test Time: " . date('Y-m-d H:i:s') . "</small></p>";
?>
