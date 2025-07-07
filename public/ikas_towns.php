<?php
// Güvenli Ikas Mahalleler Endpoint - Token + Mahalle Çekme Tek Dosyada
error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da 0

// JSON response için header'lar
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // districtId parametresi kontrolü
    $districtId = $_GET['districtId'] ?? null;
    if (!$districtId) {
        throw new Exception('districtId parametresi gerekli');
    }

    // 1. İKAS KONFİGÜRASYON BİLGİLERİ - STATİK
    $ikasConfig = [
        'client_id' => '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
        'client_secret' => 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
        'store_id' => 'calformat',
        'base_url' => 'https://calformat.myikas.com/api',
        'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
        'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql'
    ];
    
    // 2. TOKEN ALMA İŞLEMİ
    $tokenUrl = $ikasConfig['token_url'];
    
    $tokenData = [
        'grant_type' => 'client_credentials',
        'client_id' => $ikasConfig['client_id'],
        'client_secret' => $ikasConfig['client_secret']
    ];
    
    $tokenPostData = http_build_query($tokenData);
    
    $accessToken = null;
    $tokenMethod = 'unknown';
    $tokenResponse = '';
    
    // Önce cURL dene
    if (function_exists('curl_init')) {
        $tokenMethod = 'curl';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $tokenPostData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: CalFormat-API/1.0'
        ]);
        
        $tokenResponse = curl_exec($ch);
        $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $tokenError = curl_error($ch);
        curl_close($ch);
        
        if ($tokenResponse !== false && $tokenHttpCode === 200) {
            $tokenJson = json_decode($tokenResponse, true);
            $accessToken = $tokenJson['access_token'] ?? null;
        }
    }
    
    // cURL başarısızsa file_get_contents dene
    if (!$accessToken && function_exists('file_get_contents')) {
        $tokenMethod = 'file_get_contents';
        $tokenContext = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $tokenPostData,
                'timeout' => 30
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        
        $tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);
        
        if ($tokenResponse !== false) {
            $tokenJson = json_decode($tokenResponse, true);
            $accessToken = $tokenJson['access_token'] ?? null;
        }
    }
    
    // Token alınamazsa mevcut token'ı kullan
    if (!$accessToken) {
        $accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTYzNjU2NjU3NywiaWF0IjoxNzUxNjIyMTY2NTc3LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.GiPopPyJgavFgIopNdaJqYm_ER0M92aTfQaIwuLFiMw';
        $tokenMethod = 'fallback_existing_token';
    }

    // 3. MAHALLELER API ÇAĞRISI - GRAPHQL İLE
    $graphqlUrl = $ikasConfig['graphql_url'];
    
    $query = 'query ListTown($districtId: StringFilterInput!) {
        listTown(districtId: $districtId) {
            id
            name
        }
    }';

    $variables = [
        'districtId' => [
            'eq' => $districtId
        ]
    ];

    $graphqlData = json_encode([
        'query' => $query,
        'variables' => $variables
    ]);
    
    $towns = [];
    $townMethod = 'unknown';
    
    // Önce cURL ile GraphQL dene
    if (function_exists('curl_init')) {
        $townMethod = 'curl_graphql';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $graphqlUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $graphqlData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
            'User-Agent: CalFormat-API/1.0'
        ]);
        
        $townResponse = curl_exec($ch);
        $townHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $townError = curl_error($ch);
        curl_close($ch);
        
        if ($townResponse !== false && $townHttpCode === 200) {
            $townJson = json_decode($townResponse, true);
            if (isset($townJson['data']['listTown'])) {
                $towns = $townJson['data']['listTown'];
            }
        }
    }
    
    // cURL başarısızsa file_get_contents ile GraphQL dene
    if (empty($towns) && function_exists('file_get_contents')) {
        $townMethod = 'file_get_contents_graphql';
        $townContext = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer " . $accessToken . "\r\n" .
                           "Content-Type: application/json\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $graphqlData,
                'timeout' => 30
            ]
        ]);

        $townResponse = @file_get_contents($graphqlUrl, false, $townContext);
        
        if ($townResponse !== false) {
            $townJson = json_decode($townResponse, true);
            if (isset($townJson['data']['listTown'])) {
                $towns = $townJson['data']['listTown'];
            }
        }
    }

    // 4. BAŞARILI RESPONSE DÖNDÜR
    if (!empty($towns)) {
        echo json_encode([
            'success' => true,
            'data' => $towns,
            'count' => count($towns),
            'api_info' => [
                'token_method' => $tokenMethod,
                'town_method' => $townMethod,
                'token_obtained' => !empty($accessToken),
                'graphql_url' => $graphqlUrl,
                'districtId' => $districtId
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // 5. MAHALLE BULUNAMAZSA FALLBACK
    throw new Exception('Mahalle verisi alınamadı. districtId: ' . $districtId . ', Response: ' . ($townResponse ?? 'null') . ' | HTTP Code: ' . ($townHttpCode ?? 'unknown'));

} catch (Exception $e) {
    error_log('Towns API error: ' . $e->getMessage());
    
    // 6. HATA DURUMUNDA DETAYLI RESPONSE
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Mahalleler API\'sinde hata oluştu',
        'debug_info' => [
            'error_message' => $e->getMessage(),
            'error_file' => basename($e->getFile()),
            'error_line' => $e->getLine(),
            'token_method' => $tokenMethod ?? 'not_attempted',
            'town_method' => $townMethod ?? 'not_attempted',
            'access_token_exists' => isset($accessToken) && !empty($accessToken),
            'token_response' => isset($tokenResponse) ? substr($tokenResponse, 0, 200) . '...' : 'null',
            'town_response' => isset($townResponse) ? substr($townResponse, 0, 200) . '...' : 'null',
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers()),
            'token_url' => $ikasConfig['token_url'],
            'graphql_url' => $ikasConfig['graphql_url'],
            'districtId' => $districtId ?? 'not_provided',
            'ikas_config' => [
                'client_id' => '***' . substr($ikasConfig['client_id'], -4),
                'store_id' => $ikasConfig['store_id']
            ]
        ],
        'fallback_data' => [
            ['id' => '1', 'name' => 'Caferağa Mahallesi'],
            ['id' => '2', 'name' => 'Fenerbahçe Mahallesi'],
            ['id' => '3', 'name' => 'Kozyatağı Mahallesi'],
            ['id' => '4', 'name' => 'Bostancı Mahallesi'],
            ['id' => '5', 'name' => 'Göztepe Mahallesi'],
            ['id' => '6', 'name' => 'Acıbadem Mahallesi'],
            ['id' => '7', 'name' => 'Suadiye Mahallesi'],
            ['id' => '8', 'name' => 'Erenköy Mahallesi']
        ],
        'server_info' => [
            'php_version' => phpversion(),
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers())
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
