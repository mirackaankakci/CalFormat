<?php
// Temiz Districts API
require_once __DIR__ . '/security.php';

if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

try {
    $config = getSecureConfig();
    setSecurityHeaders($config);
    
    if (!checkRateLimit($config)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
        exit();
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    $cityId = $_GET['cityId'] ?? null;
    if (!$cityId) {
        throw new Exception('cityId parametresi gerekli');
    }

    $cityId = sanitizeInput($cityId);

    // Test modu kontrolü - düzeltildi
    $testMode = filter_var($config['ikas']['test_mode'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
    
    if ($testMode === true) {
        securityLog('Test mode active - returning mock districts', 'INFO');
        
        echo json_encode([
            'success' => true,
            'data' => [
                ['id' => '1', 'name' => 'Kadıköy'],
                ['id' => '2', 'name' => 'Beşiktaş'],
                ['id' => '3', 'name' => 'Şişli'],
                ['id' => '4', 'name' => 'Beyoğlu'],
                ['id' => '5', 'name' => 'Üsküdar']
            ],
            'count' => 5,
            'test_mode' => true,
            'message' => 'Test modu aktif - Mock veri döndürülüyor',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    // 1. TOKEN AL
    $ikasConfig = $config['ikas'];
    $tokenUrl = $ikasConfig['base_url'] . '/admin/oauth/token';

    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $ikasConfig['client_id'],
        'client_secret' => $ikasConfig['client_secret']
    ]);

    $tokenContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $tokenData,
            'timeout' => 30
        ]
    ]);
    
    $tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);
    
    if ($tokenResponse === FALSE) {
        throw new Exception('Token alınamadı');
    }

    $tokenJson = json_decode($tokenResponse, true);
    $accessToken = $tokenJson['access_token'] ?? null;

    if (!$accessToken) {
        throw new Exception('Access token bulunamadı');
    }

    // 2. GRAPHQL SORGUSU
    $graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
    
    $query = <<<'GRAPHQL'
query ExampleQuery($cityId: StringFilterInput!) {
  listDistrict(cityId: $cityId) {
    name
    id
  }
}
GRAPHQL;

    $variables = [
        'cityId' => [
            'eq' => $cityId
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
                       "Content-Type: application/json\r\n",
            'content' => $graphqlData,
            'timeout' => 30
        ]
    ]);

    $response = @file_get_contents($graphqlUrl, false, $context);
    
    if ($response === FALSE) {
        throw new Exception('GraphQL API Error');
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['data']['listDistrict'])) {
        $districts = $data['data']['listDistrict'];
        echo json_encode([
            'success' => true,
            'data' => $districts,
            'cityId' => $cityId,
            'count' => count($districts),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception('GraphQL response format error');
    }

} catch (Exception $e) {
    // Fallback data
    $fallbackDistricts = [
        ['id' => '1', 'name' => 'Kadıköy (Fallback)'],
        ['id' => '2', 'name' => 'Beşiktaş (Fallback)'],
        ['id' => '3', 'name' => 'Şişli (Fallback)'],
        ['id' => '4', 'name' => 'Bakırköy (Fallback)'],
        ['id' => '5', 'name' => 'Üsküdar (Fallback)']
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $fallbackDistricts,
        'fallback' => true,
        'error' => $e->getMessage(),
        'cityId' => $_GET['cityId'] ?? null,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
