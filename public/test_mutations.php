<?php
// Yeni GraphQL Mutation Test ve Düzeltme Endpoint
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // POST verilerini al
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        throw new Exception('Geçersiz JSON verisi');
    }

    // İkas Config
    $ikasConfig = [
        'client_id' => '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
        'client_secret' => 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
        'store_id' => 'calformat',
        'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
        'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql'
    ];
    
    // Token al
    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $ikasConfig['client_id'],
        'client_secret' => $ikasConfig['client_secret']
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $ikasConfig['token_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $tokenData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: CalFormat-API/1.0',
        'Accept: application/json'
    ]);
    
    $tokenResponse = curl_exec($ch);
    $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $accessToken = null;
    if ($tokenResponse && $tokenHttpCode === 200) {
        $tokenResult = json_decode($tokenResponse, true);
        $accessToken = $tokenResult['access_token'] ?? null;
    }
    
    // Fallback token
    if (!$accessToken) {
        $accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTYzNjU2NjU3NywiaWF0IjoxNzUxNjIyMTY2NTc3LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.GiPopPyJgavFgIopNdaJqYm_ER0M92aTfQaIwuLFiMw';
    }

    // Farklı mutation'ları test et
    $mutations = [
        'createOrder' => 'mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
                id
                orderNumber
            }
        }',
        
        'createOrderWithTransactions' => 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) {
            createOrderWithTransactions(input: $input) {
                id
                orderNumber
            }
        }',
        
        'addOrder' => 'mutation AddOrder($input: OrderInput!) {
            addOrder(input: $input) {
                id
                orderNumber
            }
        }',
        
        'orderCreate' => 'mutation OrderCreate($input: OrderCreateInput!) {
            orderCreate(input: $input) {
                id
                orderNumber
            }
        }',
        
        'submitOrder' => 'mutation SubmitOrder($input: SubmitOrderInput!) {
            submitOrder(input: $input) {
                id
                orderNumber
            }
        }',
        
        // Sadece order kısmını gönder
        'createOrderSimple' => 'mutation CreateOrder($input: OrderInput!) {
            createOrder(input: $input) {
                id
                orderNumber
            }
        }'
    ];
    
    $results = [];
    
    foreach ($mutations as $name => $mutation) {
        // Input formatını mutation'a göre ayarla
        $inputData = $input['input'] ?? $input;
        
        if ($name === 'createOrderSimple') {
            // Sadece order kısmını gönder
            $inputData = $input['input']['order'] ?? $input['order'] ?? $input;
        }
        
        // GraphQL payload hazırla
        $orderData = [
            'query' => $mutation,
            'variables' => [
                'input' => $inputData
            ]
        ];
        
        // cURL ile GraphQL çağrısı
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $ikasConfig['graphql_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $accessToken",
            "Content-Type: application/json",
            "User-Agent: CalFormat-API/1.0",
            "Accept: application/json"
        ]);
        
        $orderResponse = curl_exec($ch);
        $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = null;
        if ($orderResponse) {
            $result = json_decode($orderResponse, true);
        }
        
        $results[$name] = [
            'http_code' => $orderHttpCode,
            'response' => $result,
            'has_errors' => isset($result['errors']),
            'error_count' => isset($result['errors']) ? count($result['errors']) : 0
        ];
        
        // Eğer başarılı ise döndür
        if ($orderHttpCode === 200 && isset($result['data']) && !isset($result['errors'])) {
            echo json_encode([
                'success' => true,
                'data' => $result,
                'used_mutation' => $name,
                'message' => "Başarılı mutation: $name",
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit();
        }
    }
    
    // Hiçbiri başarılı değilse tüm sonuçları döndür
    echo json_encode([
        'success' => false,
        'message' => 'Tüm mutation\'lar başarısız',
        'all_results' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
