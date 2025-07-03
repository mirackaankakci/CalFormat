<?php
// Düzgün Ikas Token ve API Sistemi

// .env dosyasını yükle
function loadEnv($filePath = __DIR__ . '/.env') {
    if (!file_exists($filePath)) {
        return false;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
        }
    }
    return true;
}

// .env yükle
loadEnv();

// Yeni token al
function getIkasToken() {
    $clientId = $_ENV['IKAS_CLIENT_ID'] ?? '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
    $clientSecret = $_ENV['IKAS_CLIENT_SECRET'] ?? 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';
    $tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
    
    $postData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);
    
    // cURL varsa kullan
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response && $httpCode === 200) {
            $data = json_decode($response, true);
            if (isset($data['access_token'])) {
                return $data['access_token'];
            }
        }
    }
    
    // file_get_contents fallback
    try {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => 30
            ]
        ]);
        
        $response = file_get_contents($tokenUrl, false, $context);
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['access_token'])) {
                return $data['access_token'];
            }
        }
    } catch (Exception $e) {
        // Fallback failed
    }
    
    return false;
}

// Statik token kullan (mevcut .env'den)
function getStaticToken() {
    return $_ENV['IKAS_API_TOKEN'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTU2MjczMzcyNywiaWF0IjoxNzUxNTQ4MzMzNzI4LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.wgPtG8BnvGaUgyvooitZnOkSiME-THT7ejBNU_R4F7E';
}

// Ikas API çağrısı yap
function callIkasAPI($endpoint, $method = 'GET', $data = null, $useStaticToken = true) {
    $token = $useStaticToken ? getStaticToken() : getIkasToken();
    
    if (!$token) {
        return false;
    }
    
    $url = 'https://calformat.myikas.com/api' . $endpoint;
    
    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    // cURL varsa kullan
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response && $httpCode === 200) {
            return json_decode($response, true);
        }
    }
    
    // file_get_contents fallback
    try {
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers) . "\r\n",
                'content' => ($method === 'POST' && $data) ? json_encode($data) : null,
                'timeout' => 30
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        if ($response) {
            return json_decode($response, true);
        }
    } catch (Exception $e) {
        // Fallback failed
    }
    
    return false;
}

// Test mode kontrolü
function isTestMode() {
    return filter_var($_ENV['IKAS_TEST_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
}

// Request method kontrolü (CLI uyumlu)
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}
?>
