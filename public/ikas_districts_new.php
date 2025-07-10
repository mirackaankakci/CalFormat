<?php
// Güvenli Ikas İlçeler Endpoint - Token + İlçe Çekme Tek Dosyada
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
    // CityId parametresi zorunlu
    $cityId = $_GET['cityId'] ?? null;
    if (!$cityId) {
        throw new Exception('cityId parametresi gerekli');
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
            'User-Agent: CalFormat-API/1.0',
            'Accept: application/json'
        ]);
        
        $tokenResponse = curl_exec($ch);
        $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $tokenError = curl_error($ch);
        curl_close($ch);
        
        if ($tokenResponse !== false && $tokenHttpCode === 200) {
            $tokenResult = json_decode($tokenResponse, true);
            $accessToken = $tokenResult['access_token'] ?? null;
        }
    }
    
    // Fallback token
    if (!$accessToken) {
        $accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTYzNjU2NjU3NywiaWF0IjoxNzUxNjIyMTY2NTc3LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.GiPopPyJgavFgIopNdaJqYm_ER0M92aTfQaIwuLFiMw';
        $tokenMethod = 'fallback';
    }

    // 3. İLÇELER API ÇAĞRISI - GRAPHQL İLE
    $graphqlUrl = $ikasConfig['graphql_url'];
    
    $query = 'query ExampleQuery($cityId: StringFilterInput!) {
        listDistrict(cityId: $cityId) {
            name
            id
        }
    }';

    $variables = [
        'cityId' => [
            'eq' => $cityId
        ]
    ];

    $graphqlData = json_encode([
        'query' => $query,
        'variables' => $variables
    ]);
    
    $districts = [];
    $districtMethod = 'unknown';
    
    // Önce cURL ile GraphQL dene
    if (function_exists('curl_init')) {
        $districtMethod = 'curl_graphql';
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
        
        $districtResponse = curl_exec($ch);
        $districtHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $districtError = curl_error($ch);
        curl_close($ch);
        
        if ($districtResponse !== false && $districtHttpCode === 200) {
            $districtJson = json_decode($districtResponse, true);
            
            if (isset($districtJson['data']['listDistrict']) && is_array($districtJson['data']['listDistrict'])) {
                $districts = $districtJson['data']['listDistrict'];
            } else {
                // API'den hata geldi ama response var
                $districtMethod = 'curl_graphql_error';
            }
        } else {
            // HTTP hatası
            $districtMethod = 'curl_http_error';
        }
    }
    
    // Eğer GraphQL çalışmadıysa fallback data kullan
    if (empty($districts)) {
        $districts = [
            ['id' => 'fb123456-7890-abcd-ef12-345678901234', 'name' => 'Kadıköy'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901235', 'name' => 'Beşiktaş'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901236', 'name' => 'Şişli'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901237', 'name' => 'Üsküdar'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901238', 'name' => 'Fatih'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901239', 'name' => 'Bakırköy'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901240', 'name' => 'Beyoğlu'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901241', 'name' => 'Ataşehir'],
            ['id' => 'fb123456-7890-abcd-ef12-345678901242', 'name' => 'Beykoz']
        ];
        $districtMethod = 'fallback';
    }
    
    // 4. RESPONSE HAZIRLAMA
    $response = [
        'success' => true,
        'data' => $districts,
        'count' => count($districts),
        'api_info' => [
            'token_method' => $tokenMethod,
            'district_method' => $districtMethod,
            'token_obtained' => !empty($accessToken),
            'graphql_url' => $graphqlUrl,
            'city_id' => $cityId
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Hata durumunda fallback_data ekle
    if ($districtMethod === 'fallback') {
        $response['fallback_data'] = $districts;
        $response['message'] = 'İKAS API\'ye ulaşılamadı, fallback data kullanıldı';
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Hata durumunda fallback response
    $fallbackDistricts = [
        ['id' => 'fb123456-7890-abcd-ef12-345678901234', 'name' => 'Kadıköy'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901235', 'name' => 'Beşiktaş'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901236', 'name' => 'Şişli'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901237', 'name' => 'Üsküdar'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901238', 'name' => 'Fatih'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901239', 'name' => 'Bakırköy'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901240', 'name' => 'Beyoğlu'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901241', 'name' => 'Ataşehir'],
        ['id' => 'fb123456-7890-abcd-ef12-345678901242', 'name' => 'Beykoz']
    ];
    
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage(),
        'fallback_data' => $fallbackDistricts,
        'count' => count($fallbackDistricts),
        'debug_info' => [
            'error_message' => $e->getMessage(),
            'error_line' => $e->getLine(),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>
