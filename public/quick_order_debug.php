<?php
// Sipariş Debug Checker - Sadece sipariş oluşturma sorununu incele
require_once __DIR__ . '/security_new.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

header('Content-Type: text/plain; charset=utf-8');

echo "🔍 SİPARİŞ OLUŞTURMA DEBUG - " . date('Y-m-d H:i:s') . "\n";
echo "=" . str_repeat("=", 60) . "\n\n";

try {
    // Konfigürasyon kontrol et
    define('INTERNAL_ACCESS', true);
    $config = include __DIR__ . '/config.php';
    
    echo "📋 İKAS AYARLARI:\n";
    echo "Store ID: " . $config['ikas']['store_id'] . "\n";
    echo "Client ID: " . substr($config['ikas']['client_id'], 0, 20) . "...\n";
    echo "GraphQL URL: " . $config['ikas']['graphql_url'] . "\n";
    echo "Token URL: " . $config['ikas']['token_url'] . "\n\n";
    
    // Test sipariş payload'ı oluştur
    echo "📦 TEST SİPARİŞ PAYLOAD HAZIRLANIYOR...\n";
    
    $testOrderPayload = [
        'input' => [
            'order' => [
                'orderLineItems' => [
                    [
                        'id' => $config['ikas']['defaults']['fallback_product_id'],
                        'price' => 100,
                        'variant' => [
                            'id' => $config['ikas']['defaults']['fallback_variant_id']
                        ],
                        'quantity' => 1
                    ]
                ],
                'billingAddress' => [
                    'firstName' => 'Test',
                    'lastName' => 'Kullanıcı',
                    'addressLine1' => 'Test Adres 123',
                    'addressLine2' => '',
                    'city' => [
                        'id' => $config['ikas']['defaults']['default_city_id'],
                        'name' => $config['ikas']['defaults']['default_city']
                    ],
                    'country' => [
                        'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861',
                        'name' => 'Türkiye'
                    ],
                    'district' => [
                        'id' => $config['ikas']['defaults']['default_district_id'],
                        'name' => $config['ikas']['defaults']['default_district']
                    ],
                    'state' => [
                        'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861'
                    ],
                    'phone' => '05551234567',
                    'company' => null,
                    'isDefault' => false
                ],
                'shippingAddress' => [
                    'firstName' => 'Test',
                    'lastName' => 'Kullanıcı',
                    'addressLine1' => 'Test Adres 123',
                    'addressLine2' => '',
                    'city' => [
                        'id' => $config['ikas']['defaults']['default_city_id'],
                        'name' => $config['ikas']['defaults']['default_city']
                    ],
                    'country' => [
                        'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861',
                        'name' => 'Türkiye'
                    ],
                    'district' => [
                        'id' => $config['ikas']['defaults']['default_district_id'],
                        'name' => $config['ikas']['defaults']['default_district']
                    ],
                    'state' => [
                        'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861'
                    ],
                    'phone' => '05551234567',
                    'company' => null,
                    'isDefault' => false
                ],
                'note' => 'Debug test siparişi - ' . date('Y-m-d H:i:s'),
                'deleted' => false,
                'customer' => [
                    'lastName' => 'Kullanıcı',
                    'firstName' => 'Test',
                    'email' => 'test@calformat.com.tr'
                ]
            ],
            'transactions' => [
                [
                    'amount' => 130 // 100 ürün + 30 kargo
                ]
            ]
        ]
    ];
    
    echo "Payload hazırlandı.\n\n";
    
    // İkas token al
    echo "🔑 İKAS TOKEN ALIYOR...\n";
    
    $tokenData = [
        'grant_type' => 'client_credentials',
        'client_id' => $config['ikas']['client_id'],
        'client_secret' => $config['ikas']['client_secret']
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $config['ikas']['token_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json'
    ]);
    
    $tokenResponse = curl_exec($ch);
    $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Token HTTP Code: $tokenHttpCode\n";
    
    if ($tokenHttpCode !== 200) {
        echo "❌ TOKEN ALINAMADI!\n";
        echo "Response: $tokenResponse\n";
        exit;
    }
    
    $tokenResult = json_decode($tokenResponse, true);
    $accessToken = $tokenResult['access_token'] ?? null;
    
    if (!$accessToken) {
        echo "❌ TOKEN RESPONSE'DA ACCESS_TOKEN YOK!\n";
        echo "Response: $tokenResponse\n";
        exit;
    }
    
    echo "✅ Token alındı.\n\n";
    
    // Sipariş oluştur
    echo "📦 SİPARİŞ OLUŞTURULUYOR...\n";
    
    $mutation = 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) {
        createOrderWithTransactions(input: $input) {
            id
            orderNumber
        }
    }';
    
    $orderData = [
        'query' => $mutation,
        'variables' => $testOrderPayload
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $config['ikas']['graphql_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json",
        "Accept: application/json"
    ]);
    
    $orderResponse = curl_exec($ch);
    $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Sipariş HTTP Code: $orderHttpCode\n";
    echo "Response Length: " . strlen($orderResponse) . " chars\n\n";
    
    echo "📄 SİPARİŞ API RESPONSE:\n";
    echo $orderResponse . "\n\n";
    
    $orderResult = json_decode($orderResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "❌ JSON DECODE HATASI: " . json_last_error_msg() . "\n";
        exit;
    }
    
    echo "📊 PARSED RESPONSE:\n";
    echo json_encode($orderResult, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Sonuç analizi
    if (isset($orderResult['errors'])) {
        echo "❌ GRAPHQL HATALARI:\n";
        foreach ($orderResult['errors'] as $error) {
            echo "- " . $error['message'] . "\n";
        }
        echo "\n";
    }
    
    if (isset($orderResult['data']['createOrderWithTransactions'])) {
        echo "✅ SİPARİŞ BAŞARILI!\n";
        echo "Order ID: " . $orderResult['data']['createOrderWithTransactions']['id'] . "\n";
        echo "Order Number: " . $orderResult['data']['createOrderWithTransactions']['orderNumber'] . "\n";
    } else {
        echo "⚠️ SİPARİŞ OLUŞMADI - Data bölümü eksik\n";
    }
    
} catch (Exception $e) {
    echo "❌ HATA: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
