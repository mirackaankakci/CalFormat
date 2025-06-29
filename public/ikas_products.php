<?php
// Tüm hatalar için error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS ve CSP headers - EN BAŞA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token, Authorization, Accept, X-Requested-With, Cache-Control, Pragma');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');

// Content-Type
header('Content-Type: application/json; charset=UTF-8');

// Cache control
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Pragma: no-cache');

// OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // cURL mevcut değilse direkt fallback data döndür
    if (!function_exists('curl_init')) {
        throw new Exception('cURL mevcut değil, fallback data kullanılıyor');
    }

    // 1. TOKEN AL - cURL ile
    $tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
    $clientId = '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
    $clientSecret = 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';

    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);

    $tokenResponse = null;
    $httpCode = 0;

    // cURL ile token al
    if (true) {
        // cURL ile (canlı sunucu için)
        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $tokenData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: CalFormat-API/1.0'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $tokenResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_error($ch)) {
            throw new Exception('CURL Error: ' . curl_error($ch));
        }
          curl_close($ch);
    }

    if ($httpCode !== 200) {
        throw new Exception("Token alınamadı. HTTP Code: $httpCode");
    }

    $tokenJson = json_decode($tokenResponse, true);
    $accessToken = $tokenJson['access_token'] ?? null;

    if (!$accessToken) {
        throw new Exception('Access token bulunamadı: ' . $tokenResponse);
    }

    // 2. GRAPHQL SORGUSU - aynı hibrit yaklaşım
    $graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
    
    $query = <<<'GRAPHQL'
query ListProducts($pagination: PaginationInput) {
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
}
GRAPHQL;

    $variables = [
        "pagination" => [
            "page" => 1,
            "limit" => 6
        ]
    ];

    $payload = [
        'query' => $query,
        'variables' => $variables
    ];    $response = null;

    // cURL ile GraphQL sorgusu
    $ch = curl_init($graphqlUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'User-Agent: CalFormat-API/1.0'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_error($ch)) {
            throw new Exception('CURL Error: ' . curl_error($ch));
        }
        
        curl_close($ch);        if ($httpCode !== 200) {
            throw new Exception("GraphQL isteği başarısız. HTTP Code: $httpCode, Response: $response");
        }

    // JSON validation
    $jsonData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON parse hatası: ' . json_last_error_msg());    }
    
    // Response'u döndür
    echo $response;

} catch (Exception $e) {
    // Detaylı hata logging
    error_log("CalFormat API Error: " . $e->getMessage());
    
    // Fallback test data döndür
    $fallbackData = [
        'data' => [
            'listProduct' => [
                'data' => [
                    [
                        'id' => '1',
                        'name' => 'CalFormat Premium (Test)',
                        'description' => 'Test ortamı için örnek ürün. Gerçek veriler cURL ile alınacak.',
                        'totalStock' => 100,
                        'weight' => 0.5,
                        'createdAt' => '2024-01-01T00:00:00Z',
                        'updatedAt' => '2024-01-01T00:00:00Z',
                        'brand' => [
                            'id' => '1',
                            'name' => 'CalFormat'
                        ],
                        'categories' => [
                            [
                                'id' => '1',
                                'name' => 'Dijital Ürünler'
                            ]
                        ],
                        'variants' => [
                            [
                                'id' => '1',
                                'sku' => 'CALFORMAT-PREMIUM',
                                'prices' => [
                                    'sellPrice' => 299.00
                                ]
                            ]
                        ]
                    ],
                    [
                        'id' => '2',
                        'name' => 'CalFormat Basic (Test)',
                        'description' => 'Test ortamı için başka bir örnek ürün.',
                        'totalStock' => 50,
                        'weight' => 0.3,
                        'createdAt' => '2024-01-01T00:00:00Z',
                        'updatedAt' => '2024-01-01T00:00:00Z',
                        'brand' => [
                            'id' => '1',
                            'name' => 'CalFormat'
                        ],
                        'categories' => [
                            [
                                'id' => '1',
                                'name' => 'Dijital Ürünler'
                            ]
                        ],
                        'variants' => [
                            [
                                'id' => '2',
                                'sku' => 'CALFORMAT-BASIC',
                                'prices' => [
                                    'sellPrice' => 199.00
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'debug' => [
            'curl_available' => function_exists('curl_init'),
            'error_message' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s'),
            'environment' => 'local_test'
        ]
    ];
    
    // HTTP status kodu 200 yap çünkü fallback data döndürüyoruz
    http_response_code(200);
    echo json_encode($fallbackData);
}
?>