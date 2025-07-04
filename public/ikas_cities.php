<?php
// Güvenli Ikas Şehirler Endpoint
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
        securityLog('Rate limit exceeded for cities', 'WARNING', ['ip' => getClientIP()]);
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

    // Test modu kontrolü - .env'den oku
    $testMode = filter_var($config['ikas']['test_mode'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
    
    if ($testMode === true) {
        securityLog('Test mode active - returning mock cities', 'INFO');
        
        echo json_encode([
            'success' => true,
            'data' => [
                ['id' => '1', 'name' => 'İstanbul'],
                ['id' => '2', 'name' => 'Ankara'],
                ['id' => '3', 'name' => 'İzmir'],
                ['id' => '4', 'name' => 'Bursa'],
                ['id' => '5', 'name' => 'Antalya']
            ],
            'count' => 5,
            'test_mode' => true,
            'message' => 'Test modu aktif - Mock veri döndürülüyor',
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

    // 2. GRAPHQL SORGUSU - İLLER İÇİN
    $graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
    
    $stateId = $_GET['stateId'] ?? 'dcb9135c-4b84-4c06-9a42-f359317a9b78';
    
    $query = <<<'GRAPHQL'
query ExampleQuery($stateId: StringFilterInput!) {
  listCity(stateId: $stateId) {
    name
    id
  }
}
GRAPHQL;

    $variables = [
        "stateId" => [
            "eq" => $stateId
        ]
    ];

    $payload = [
        'query' => $query,
        'variables' => $variables
    ];

    // GraphQL isteği için context oluştur
    $graphqlContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n" .
                       "Authorization: Bearer " . $accessToken . "\r\n" .
                       "User-Agent: CalFormat-API/1.0\r\n",
            'content' => json_encode($payload),
            'timeout' => 30
        ]
    ]);

    $response = @file_get_contents($graphqlUrl, false, $graphqlContext);
    
    if ($response === FALSE) {
        throw new Exception("GraphQL isteği başarısız - API erişim hatası");
    }

    // JSON validation
    $jsonData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON parse hatası: ' . json_last_error_msg());
    }

    // İlleri çıkar ve düzenle
    $cities = $jsonData['data']['listCity'] ?? [];
    
    // Response'u frontend formatında döndür
    echo json_encode([
        'success' => true,
        'data' => $cities,
        'count' => count($cities),
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    // Detaylı hata logging
    error_log("CalFormat Cities API Error: " . $e->getMessage());
    
    // Fallback data ile JSON hata response
    $fallbackCities = [
        ['id' => '177cff26-7c82-477c-b03e-b71546d04bec', 'name' => 'İstanbul'],
        ['id' => 'ankara-city-id', 'name' => 'Ankara'],
        ['id' => 'izmir-city-id', 'name' => 'İzmir'],
        ['id' => 'bursa-city-id', 'name' => 'Bursa'],
        ['id' => 'antalya-city-id', 'name' => 'Antalya']
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $fallbackCities,
        'fallback' => true,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Fallback cities fonksiyonu
function getFallbackCities() {
    return [
        ['id' => 'dcb9135c-4b84-4c06-9a42-f359317a9b78', 'name' => 'İstanbul'],
        ['id' => 'ankara-uuid', 'name' => 'Ankara'],
        ['id' => 'izmir-uuid', 'name' => 'İzmir'],
        ['id' => 'bursa-uuid', 'name' => 'Bursa'],
        ['id' => 'antalya-uuid', 'name' => 'Antalya'],
        ['id' => 'adana-uuid', 'name' => 'Adana'],
        ['id' => 'konya-uuid', 'name' => 'Konya'],
        ['id' => 'gaziantep-uuid', 'name' => 'Gaziantep'],
        ['id' => 'kayseri-uuid', 'name' => 'Kayseri'],
        ['id' => 'mersin-uuid', 'name' => 'Mersin']
    ];
}
