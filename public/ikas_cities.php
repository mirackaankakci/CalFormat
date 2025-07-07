<?php
// Güvenli Ikas Şehirler Endpoint - Token + Şehir Çekme Tek Dosyada
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

    // 3. ŞEHİRLER API ÇAĞRISI - GRAPHQL İLE
    $graphqlUrl = $ikasConfig['graphql_url'];
    
    // stateId parametresi - Türkiye için varsayılan değer
    $stateId = $_GET['stateId'] ?? 'dcb9135c-4b84-4c06-9a42-f359317a9b78';
    
    $query = 'query ExampleQuery($stateId: StringFilterInput!) {
        listCity(stateId: $stateId) {
            name
            id
        }
    }';

    $variables = [
        'stateId' => [
            'eq' => $stateId
        ]
    ];

    $graphqlData = json_encode([
        'query' => $query,
        'variables' => $variables
    ]);
    
    $cities = [];
    $cityMethod = 'unknown';
    
    // Önce cURL ile GraphQL dene
    if (function_exists('curl_init')) {
        $cityMethod = 'curl_graphql';
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
        
        $cityResponse = curl_exec($ch);
        $cityHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cityError = curl_error($ch);
        curl_close($ch);
        
        if ($cityResponse !== false && $cityHttpCode === 200) {
            $cityJson = json_decode($cityResponse, true);
            if (isset($cityJson['data']['listCity'])) {
                $cities = $cityJson['data']['listCity'];
            }
        }
    }
    
    // cURL başarısızsa file_get_contents ile GraphQL dene
    if (empty($cities) && function_exists('file_get_contents')) {
        $cityMethod = 'file_get_contents_graphql';
        $cityContext = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer " . $accessToken . "\r\n" .
                           "Content-Type: application/json\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $graphqlData,
                'timeout' => 30
            ]
        ]);

        $cityResponse = @file_get_contents($graphqlUrl, false, $cityContext);
        
        if ($cityResponse !== false) {
            $cityJson = json_decode($cityResponse, true);
            if (isset($cityJson['data']['listCity'])) {
                $cities = $cityJson['data']['listCity'];
            }
        }
    }

    // 4. BAŞARILI RESPONSE DÖNDÜR
    if (!empty($cities)) {
        echo json_encode([
            'success' => true,
            'data' => $cities,
            'count' => count($cities),
            'api_info' => [
                'token_method' => $tokenMethod,
                'city_method' => $cityMethod,
                'token_obtained' => !empty($accessToken),
                'graphql_url' => $graphqlUrl,
                'stateId' => $stateId
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // 5. ŞEHİR BULUNAMAZSA FALLBACK
    throw new Exception('Şehir verisi alınamadı. stateId: ' . $stateId . ', Response: ' . ($cityResponse ?? 'null') . ' | HTTP Code: ' . ($cityHttpCode ?? 'unknown'));

} catch (Exception $e) {
    error_log('Cities API error: ' . $e->getMessage());
    
    // 6. HATA DURUMUNDA DETAYLI RESPONSE
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Şehirler API\'sinde hata oluştu',
        'debug_info' => [
            'error_message' => $e->getMessage(),
            'error_file' => basename($e->getFile()),
            'error_line' => $e->getLine(),
            'token_method' => $tokenMethod ?? 'not_attempted',
            'city_method' => $cityMethod ?? 'not_attempted',
            'access_token_exists' => isset($accessToken) && !empty($accessToken),
            'token_response' => isset($tokenResponse) ? substr($tokenResponse, 0, 200) . '...' : 'null',
            'city_response' => isset($cityResponse) ? substr($cityResponse, 0, 200) . '...' : 'null',
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers()),
            'token_url' => $ikasConfig['token_url'],
            'graphql_url' => $ikasConfig['graphql_url'],
            'stateId' => $stateId ?? 'not_provided',
            'ikas_config' => [
                'client_id' => '***' . substr($ikasConfig['client_id'], -4),
                'store_id' => $ikasConfig['store_id']
            ]
        ],
        'fallback_data' => [
            ['id' => '1', 'name' => 'İstanbul', 'plateNumber' => '34'],
            ['id' => '6', 'name' => 'Ankara', 'plateNumber' => '06'],
            ['id' => '35', 'name' => 'İzmir', 'plateNumber' => '35'],
            ['id' => '16', 'name' => 'Bursa', 'plateNumber' => '16'],
            ['id' => '7', 'name' => 'Antalya', 'plateNumber' => '07'],
            ['id' => '41', 'name' => 'Kocaeli', 'plateNumber' => '41'],
            ['id' => '42', 'name' => 'Konya', 'plateNumber' => '42'],
            ['id' => '61', 'name' => 'Trabzon', 'plateNumber' => '61']
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
