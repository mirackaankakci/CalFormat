<?php
// Güvenli Ikas Ürünler Endpoint - Token + Ürün Çekme Tek Dosyada
error_reporting(E_ALL);
ini_set('display_errors', 1); // Debug için açık

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
        
        // Debug: Token API çağrısı sonuçlarını logla
        error_log("Token cURL Response: " . ($tokenResponse ? 'SUCCESS' : 'FAILED'));
        error_log("Token HTTP Code: " . $tokenHttpCode);
        error_log("Token cURL Error: " . ($tokenError ?: 'NONE'));
        
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

    // 3. ÜRÜNLER API ÇAĞRISI - GRAPHQL İLE
    $graphqlUrl = $ikasConfig['graphql_url'];
    
    $query = 'query ListProducts($pagination: PaginationInput) {
        listProduct(pagination: $pagination) {
            data {
                id
                name
                description
                totalStock
                weight
                createdAt
                updatedAt
                brand {
                    id
                    name
                }
                categories {
                    id
                    name
                }
                variants {
                    id
                    sku
                    prices {
                        sellPrice
                    }
                }
            }
        }
    }';

    $variables = [
        'pagination' => [
            'page' => 1
        ]
    ];

    $graphqlData = json_encode([
        'query' => $query,
        'variables' => $variables
    ]);
    
    $products = [];
    $productMethod = 'unknown';
    
    // Önce cURL ile GraphQL dene
    if (function_exists('curl_init')) {
        $productMethod = 'curl_graphql';
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
        
        $productResponse = curl_exec($ch);
        $productHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $productError = curl_error($ch);
        curl_close($ch);
        
        // Debug: API çağrısı sonuçlarını logla
        error_log("GraphQL cURL Response: " . ($productResponse ? 'SUCCESS' : 'FAILED'));
        error_log("GraphQL HTTP Code: " . $productHttpCode);
        error_log("GraphQL cURL Error: " . ($productError ?: 'NONE'));
        
        if ($productResponse !== false && $productHttpCode === 200) {
            $productJson = json_decode($productResponse, true);
            if (isset($productJson['data']['listProduct']['data'])) {
                $products = $productJson['data']['listProduct']['data'];
            }
        }
    }
    
    // cURL başarısızsa file_get_contents ile GraphQL dene
    if (empty($products) && function_exists('file_get_contents')) {
        $productMethod = 'file_get_contents_graphql';
        $productContext = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer " . $accessToken . "\r\n" .
                           "Content-Type: application/json\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $graphqlData,
                'timeout' => 30
            ]
        ]);

        $productResponse = @file_get_contents($graphqlUrl, false, $productContext);
        
        if ($productResponse !== false) {
            $productJson = json_decode($productResponse, true);
            if (isset($productJson['data']['listProduct']['data'])) {
                $products = $productJson['data']['listProduct']['data'];
            }
        }
    }

    // 4. BAŞARILI RESPONSE DÖNDÜR
    if (!empty($products)) {
        echo json_encode([
            'success' => true,
            'data' => $products,
            'count' => count($products),
            'api_info' => [
                'token_method' => $tokenMethod,
                'product_method' => $productMethod,
                'token_obtained' => !empty($accessToken),
                'graphql_url' => $graphqlUrl
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // 5. ÜRÜN BULUNAMAZSA FALLBACK
    throw new Exception('Ürün verisi alınamadı. Response: ' . ($productResponse ?? 'null'));

} catch (Exception $e) {
    error_log('Products API error: ' . $e->getMessage());
    
    // 6. HATA DURUMUNDA DETAYLI RESPONSE
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Ürünler API\'sinde hata oluştu',
        'debug_info' => [
            'error_message' => $e->getMessage(),
            'error_file' => basename($e->getFile()),
            'error_line' => $e->getLine(),
            'token_method' => $tokenMethod ?? 'not_attempted',
            'product_method' => $productMethod ?? 'not_attempted',
            'access_token_exists' => isset($accessToken) && !empty($accessToken),
            'token_response' => isset($tokenResponse) ? substr($tokenResponse, 0, 200) . '...' : 'null',
            'product_response' => isset($productResponse) ? substr($productResponse, 0, 200) . '...' : 'null',
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers()),
            'token_url' => $ikasConfig['token_url'],
            'graphql_url' => $ikasConfig['graphql_url'],
            'ikas_config' => [
                'client_id' => '***' . substr($ikasConfig['client_id'], -4),
                'store_id' => $ikasConfig['store_id']
            ]
        ],
        'fallback_data' => [
            [
                'id' => '1',
                'name' => 'CalFormat Premium (Fallback)',
                'description' => 'API hatası nedeniyle fallback veri döndürülüyor',
                'totalStock' => 100,
                'weight' => 0.5,
                'brand' => ['id' => '1', 'name' => 'CalFormat'],
                'categories' => [['id' => '1', 'name' => 'Dijital Ürünler']],
                'variants' => [['id' => '1', 'sku' => 'CALFORMAT-PREMIUM', 'prices' => ['sellPrice' => 299.00]]]
            ],
            [
                'id' => '2',
                'name' => 'CalFormat Basic (Fallback)',
                'description' => 'API hatası nedeniyle fallback veri döndürülüyor',
                'totalStock' => 50,
                'weight' => 0.3,
                'brand' => ['id' => '1', 'name' => 'CalFormat'],
                'categories' => [['id' => '1', 'name' => 'Dijital Ürünler']],
                'variants' => [['id' => '2', 'sku' => 'CALFORMAT-BASIC', 'prices' => ['sellPrice' => 199.00]]]
            ]
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