<?php
// Düzgün Ikas Products Endpoint
require_once 'ikas_functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (getRequestMethod() === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Test modu kontrolü
    if (isTestMode()) {
        echo json_encode([
            'success' => true,
            'data' => [
                [
                    'id' => '1',
                    'title' => 'CalFormat Premium (Test)',
                    'description' => 'Test mode - mock data',
                    'price' => 299.00,
                    'stock' => 100
                ],
                [
                    'id' => '2',
                    'title' => 'CalFormat Basic (Test)',
                    'description' => 'Test mode - mock data',
                    'price' => 199.00,
                    'stock' => 50
                ]
            ],
            'test_mode' => true,
            'message' => 'Test mode - Mock data'
        ]);
        exit;
    }
    
    // Önce /products REST endpoint'ini dene
    $result = callIkasAPI('/products', 'GET', null, true);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'data' => $result,
            'message' => 'Products loaded via REST API',
            'method' => 'rest_api'
        ]);
        exit;
    }
    
    // GraphQL endpoint'ini dene
    $token = getStaticToken();
    if ($token) {
        $graphql_query = [
            'query' => '{ products(first: 10) { edges { node { id title description handle } } } }'
        ];
        
        $headers = [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        
        // cURL ile GraphQL çağrısı
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://calformat.myikas.com/api/graphql');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($graphql_query));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($response && $httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['data']['products']['edges'])) {
                    echo json_encode([
                        'success' => true,
                        'data' => $data['data']['products']['edges'],
                        'message' => 'Products loaded via GraphQL',
                        'method' => 'graphql'
                    ]);
                    exit;
                }
            }
        }
    }
    
    // Fallback data
    echo json_encode([
        'success' => true,
        'data' => [
            [
                'id' => '1',
                'title' => 'CalFormat Premium',
                'description' => 'Doğal meyve sebze temizleme tozu - Premium kalite',
                'price' => 299.00,
                'stock' => 100,
                'handle' => 'calformat-premium'
            ],
            [
                'id' => '2',
                'title' => 'CalFormat Basic',
                'description' => 'Temel temizlik paketi - Ekonomik seçenek',
                'price' => 199.00,
                'stock' => 50,
                'handle' => 'calformat-basic'
            ]
        ],
        'message' => 'API failed, fallback data returned',
        'method' => 'fallback',
        'test_mode' => false
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'data' => []
    ]);
}
?>
