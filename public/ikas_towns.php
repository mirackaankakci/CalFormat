<?php
// Güvenli Ikas Mahalleler Endpoint
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
        securityLog('Rate limit exceeded for towns', 'WARNING', ['ip' => getClientIP()]);
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

    // districtId parametresini kontrol et
    $districtId = $_GET['districtId'] ?? null;
    if (!$districtId) {
        throw new Exception('districtId parametresi gerekli');
    }

    // 1. TOKEN AL
    $tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
    $clientId = '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
    $clientSecret = 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';

    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);

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

    if ($httpCode !== 200) {
        throw new Exception("Token alınamadı. HTTP Code: $httpCode");
    }

    $tokenJson = json_decode($tokenResponse, true);
    $accessToken = $tokenJson['access_token'] ?? null;

    if (!$accessToken) {
        throw new Exception('Access token bulunamadı: ' . $tokenResponse);
    }

    // 2. GRAPHQL SORGUSU - MAHALLELER İÇİN
    $graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
    
    $query = <<<'GRAPHQL'
query ListTown($districtId: StringFilterInput!) {
  listTown(districtId: $districtId) {
    id
    name
  }
}
GRAPHQL;

    $variables = [
        "districtId" => [
            "eq" => $districtId
        ]
    ];

    $payload = [
        'query' => $query,
        'variables' => $variables
    ];

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
    
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("GraphQL isteği başarısız. HTTP Code: $httpCode, Response: $response");
    }

    // JSON validation
    $jsonData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON parse hatası: ' . json_last_error_msg());
    }

    // Mahalleleri çıkar ve düzenle
    $towns = $jsonData['data']['listTown'] ?? [];
    
    // Response'u frontend formatında döndür
    echo json_encode([
        'success' => true,
        'data' => $towns,
        'count' => count($towns),
        'districtId' => $districtId,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    // Detaylı hata logging
    error_log("CalFormat Towns API Error: " . $e->getMessage());
    
    // Fallback data ile JSON hata response
    $fallbackTowns = [
        ['id' => 'caddebostan-town-id', 'name' => 'Caddebostan Mah.'],
        ['id' => 'fenerbahce-town-id', 'name' => 'Fenerbahçe Mah.'],
        ['id' => 'goztepe-town-id', 'name' => 'Göztepe Mah.'],
        ['id' => 'kozyatagi-town-id', 'name' => 'Kozyatağı Mah.'],
        ['id' => 'suadiye-town-id', 'name' => 'Suadiye Mah.']
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $fallbackTowns,
        'fallback' => true,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>

    // Token al
    $tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
    $clientId = '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
    $clientSecret = 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';

    $tokenData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);

    // cURL kullanımaya çalış, yoksa file_get_contents kullan
    $accessToken = null;
    
    if (function_exists('curl_init')) {
        debug_log('cURL ile token alınıyor...');
        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $tokenData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $tokenResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($tokenResponse && $httpCode === 200) {
            $tokenResult = json_decode($tokenResponse, true);
            if (isset($tokenResult['access_token'])) {
                $accessToken = $tokenResult['access_token'];
            }
        }
    }
    
    if (!$accessToken) {
        debug_log('file_get_contents ile token alınıyor...');
        $context = stream_context_create([
            'http' => [
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => $tokenData
            ]
        ]);
        
        $tokenResponse = file_get_contents($tokenUrl, false, $context);
        if ($tokenResponse) {
            $tokenResult = json_decode($tokenResponse, true);
            if (isset($tokenResult['access_token'])) {
                $accessToken = $tokenResult['access_token'];
            }
        }
    }

    if (!$accessToken) {
        throw new Exception('Token alınamadı');
    }

    debug_log('Token başarıyla alındı');

    // Mahalleleri çek
    $graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
    
    $query = [
        'query' => '
            query ListTown($districtId: StringFilterInput!) {
                listTown(districtId: $districtId) {
                    id
                    name
                }
            }
        ',
        'variables' => [
            'districtId' => [
                'eq' => $districtId
            ]
        ]
    ];

    debug_log('GraphQL sorgusu hazırlandı: ' . json_encode($query));

    // GraphQL isteği gönder
    $townResponse = null;
    
    if (function_exists('curl_init')) {
        debug_log('cURL ile GraphQL isteği gönderiliyor...');
        $ch = curl_init($graphqlUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($query));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $townResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }
    
    if (!$townResponse) {
        debug_log('file_get_contents ile GraphQL isteği gönderiliyor...');
        $context = stream_context_create([
            'http' => [
                'header' => "Authorization: Bearer $accessToken\r\n" .
                          "Content-Type: application/json\r\n",
                'method' => 'POST',
                'content' => json_encode($query)
            ]
        ]);
        
        $townResponse = file_get_contents($graphqlUrl, false, $context);
    }

    if (!$townResponse) {
        throw new Exception('Mahalleler API çağrısı başarısız');
    }

    debug_log('GraphQL yanıtı alındı: ' . substr($townResponse, 0, 200) . '...');

    $result = json_decode($townResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON decode hatası: ' . json_last_error_msg());
    }

    if (isset($result['errors'])) {
        debug_log('GraphQL hatası: ' . json_encode($result['errors']));
        throw new Exception('GraphQL hatası: ' . json_encode($result['errors']));
    }

    $towns = $result['data']['listTown'] ?? [];
    
    debug_log('Mahalleler başarıyla alındı. Toplam: ' . count($towns));

    // Başarılı yanıt
    echo json_encode([
        'success' => true,
        'data' => $towns,
        'count' => count($towns),
        'districtId' => $districtId,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    debug_log('HATA: ' . $e->getMessage());
    
    // Hata durumunda fallback data
    $fallbackTowns = [
        ['id' => 'caddebostan-town-id', 'name' => 'Caddebostan Mah.'],
        ['id' => 'fenerbahce-town-id', 'name' => 'Fenerbahçe Mah.'],
        ['id' => 'goztepe-town-id', 'name' => 'Göztepe Mah.'],
        ['id' => 'suadiye-town-id', 'name' => 'Suadiye Mah.'],
        ['id' => 'bostanci-town-id', 'name' => 'Bostancı Mah.']
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $fallbackTowns,
        'fallback' => true,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

debug_log('Mahalleler API çağrısı tamamlandı');
?>
