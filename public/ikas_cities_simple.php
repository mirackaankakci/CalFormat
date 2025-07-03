<?php
// Düzgün Ikas Cities Endpoint
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
                ['id' => '1', 'name' => 'İstanbul (Test)'],
                ['id' => '2', 'name' => 'Ankara (Test)'],
                ['id' => '3', 'name' => 'İzmir (Test)'],
                ['id' => '4', 'name' => 'Bursa (Test)'],
                ['id' => '5', 'name' => 'Antalya (Test)']
            ],
            'test_mode' => true,
            'message' => 'Test mode - Mock data'
        ]);
        exit;
    }
    
    // Önce statik token ile dene
    $result = callIkasAPI('/cities', 'GET', null, true);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'data' => $result,
            'message' => 'Cities loaded with static token',
            'method' => 'static_token'
        ]);
        exit;
    }
    
    // Statik token başarısızsa, yeni token al
    $result = callIkasAPI('/cities', 'GET', null, false);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'data' => $result,
            'message' => 'Cities loaded with fresh token',
            'method' => 'fresh_token'
        ]);
        exit;
    }
    
    // Her iki yöntem de başarısızsa fallback
    echo json_encode([
        'success' => true,
        'data' => [
            ['id' => '5b7bea5d-bd22-422c-a90c-bb4033217fb5', 'name' => 'İstanbul'],
            ['id' => '6595eacc-e6e7-467c-b2b0-2d8ad2b70d8c', 'name' => 'Ankara'],
            ['id' => 'e4bbb490-425f-4a59-8116-6dc8f736f26c', 'name' => 'İzmir'],
            ['id' => '7f3c2d1e-8b9a-4c6e-9f0b-2a3d4e5f6789', 'name' => 'Bursa'],
            ['id' => '1a2b3c4d-5e6f-7890-abcd-ef1234567890', 'name' => 'Antalya']
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
