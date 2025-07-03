<?php
// Güvenli Ikas Ürünler Endpoint
require_once __DIR__ . '/security.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

try {
    // Konfigürasyonu yükle
    $config = getSecureConfig();
    
    // Güvenlik header'larını ayarla
    setSecurityHeaders($config);
    
    // Rate limiting kontrolü
    if (!checkRateLimit($config)) {
        securityLog('Rate limit exceeded for products', 'WARNING', ['ip' => getClientIP()]);
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Please try again later.'
        ]);
        exit();
    }

    // OPTIONS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // Test modu kontrolü
    if (isset($config['ikas']['test_mode']) && $config['ikas']['test_mode'] === true) {
        securityLog('Test mode active - returning mock products', 'INFO');
        
        echo json_encode([
            'success' => true,
            'data' => [
                'listProduct' => [
                    'data' => [
                        [
                            'id' => '1',
                            'name' => 'CalFormat Premium (Test Mode)',
                            'description' => 'Test modu aktif - Mock veri döndürülüyor',
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
                            'name' => 'CalFormat Basic (Test Mode)',
                            'description' => 'Test modu aktif - Mock veri döndürülüyor',
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
            'test_mode' => true,
            'message' => 'Test modu aktif - Gerçek API çağrısı yapılmadı',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    // 1. TOKEN AL (güvenli config kullanarak)
    $ikasConfig = $config['ikas'];
    $tokenUrl = $ikasConfig['base_url'] . '/admin/oauth/token';

    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $ikasConfig['client_id'],
        'client_secret' => $ikasConfig['client_secret']
    ]);

    // Token isteği için context oluştur  
    $tokenContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                       "User-Agent: CalFormat-API/1.0\r\n",
            'content' => $tokenData,
            'timeout' => 30
        ]
    ]);
    
    $tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);
    
    if ($tokenResponse === FALSE) {
        throw new Exception('Token alınamadı - API erişim hatası');
    }

    $tokenJson = json_decode($tokenResponse, true);
    $accessToken = $tokenJson['access_token'] ?? null;

    if (!$accessToken) {
        throw new Exception('Access token bulunamadı: ' . $tokenResponse);
    }

    // 2. PRODUCTS API ÇAĞRISI - REST VE GRAPHQL DENEMELERİ
    $products = [];
    $apiMethod = 'fallback';
    
    // Önce REST API'yi dene
    $restUrl = $ikasConfig['base_url'] . '/products';
    $restHeaders = [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
        'User-Agent: CalFormat-API/1.0'
    ];
    
    $ch = curl_init($restUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $restHeaders);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $restResponse = curl_exec($ch);
    $restHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($restHttpCode === 200 && $restResponse) {
        $restData = json_decode($restResponse, true);
        if (isset($restData['data'])) {
            $products = $restData['data'];
            $apiMethod = 'rest_api';
        }
    }
    
    // REST başarısızsa GraphQL dene
    if (empty($products)) {
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
            'pagination' => [
                'page' => 1,
                'pageSize' => 20
            ]
        ];

        $graphqlData = json_encode([
            'query' => $query,
            'variables' => $variables
        ]);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer " . $accessToken . "\r\n" .
                           "Content-Type: application/json\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $graphqlData,
                'timeout' => 30
            ]
        ]);

        $graphqlResponse = @file_get_contents($graphqlUrl, false, $context);
        
        if ($graphqlResponse !== FALSE) {
            $graphqlData = json_decode($graphqlResponse, true);
            
            if (isset($graphqlData['data']['listProduct']['data'])) {
                $products = $graphqlData['data']['listProduct']['data'];
                $apiMethod = 'graphql';
            }
        }
    }

    // Başarılı response döndür
    if (!empty($products)) {
        securityLog('Products loaded successfully', 'INFO', ['method' => $apiMethod, 'count' => count($products)]);
        
        echo json_encode([
            'success' => true,
            'data' => $products,
            'method' => $apiMethod,
            'count' => count($products),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // Hiçbir API çalışmazsa fallback
    throw new Exception('Tüm API endpoint\'leri başarısız oldu');

} catch (Exception $e) {
    securityLog('Products API error: ' . $e->getMessage(), 'ERROR', ['ip' => getClientIP()]);
    
    // Gerçek API hatası - Fallback data döndür
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Ürünler API\'sinde hata oluştu: ' . $e->getMessage(),
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
        'debug' => [
            'curl_available' => function_exists('curl_init'),
            'error_message' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s'),
            'environment' => 'production_with_fallback'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>