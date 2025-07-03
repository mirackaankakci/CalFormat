<?php
// Basit Ikas Districts Endpoint
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
    $cityId = $_GET['cityId'] ?? null;
    if (!$cityId) {
        echo json_encode([
            'success' => false,
            'error' => 'cityId parametresi gerekli'
        ]);
        exit;
    }
    
    // Test modu kontrolü
    if (isTestMode()) {
        echo json_encode([
            'success' => true,
            'data' => [
                ['id' => '1', 'name' => 'Kadıköy (Test)', 'cityId' => $cityId],
                ['id' => '2', 'name' => 'Beşiktaş (Test)', 'cityId' => $cityId],
                ['id' => '3', 'name' => 'Şişli (Test)', 'cityId' => $cityId]
            ],
            'test_mode' => true,
            'message' => 'Test mode - Mock districts data',
            'cityId' => $cityId
        ]);
        exit;
    }
    
    // REST API'yi dene
    $result = callIkasAPI('/cities/' . $cityId . '/districts', 'GET', null, true);
    
    if ($result && isset($result['data'])) {
        echo json_encode([
            'success' => true,
            'data' => $result['data'],
            'message' => 'Districts loaded with REST API',
            'method' => 'rest_api',
            'cityId' => $cityId
        ]);
        exit;
    }
    
    // GraphQL'i dene
    $token = getStaticToken();
    if ($token) {
        $graphql_query = [
            'query' => 'query { city(id: "' . $cityId . '") { districts { id name } } }'
        ];
        
        $headers = [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ];
        
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://calformat.myikas.com/api/graphql');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($graphql_query));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($response && $httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['data']['city']['districts'])) {
                    echo json_encode([
                        'success' => true,
                        'data' => $data['data']['city']['districts'],
                        'message' => 'Districts loaded via GraphQL',
                        'method' => 'graphql',
                        'cityId' => $cityId
                    ]);
                    exit;
                }
            }
        }
    }
    
    // Fallback data (İstanbul örneği)
    $fallbackDistricts = [
        ['id' => 'kadikoy', 'name' => 'Kadıköy'],
        ['id' => 'besiktas', 'name' => 'Beşiktaş'],
        ['id' => 'sisli', 'name' => 'Şişli'],
        ['id' => 'uskudar', 'name' => 'Üsküdar'],
        ['id' => 'beyoglu', 'name' => 'Beyoğlu']
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $fallbackDistricts,
        'message' => 'API failed, fallback districts returned',
        'method' => 'fallback',
        'cityId' => $cityId,
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
