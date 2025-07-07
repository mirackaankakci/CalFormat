<?php
// Ikas Yardımcı Fonksiyonlar - Statik Konfigürasyon
error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da 0

// 1. İKAS KONFİGÜRASYON BİLGİLERİ - STATİK
$ikasConfig = [
    'client_id' => '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
    'client_secret' => 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
    'store_id' => 'calformat',
    'base_url' => 'https://calformat.myikas.com/api',
    'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
    'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql',
    'fallback_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTU2MjczMzcyNywiaWF0IjoxNzUxNTQ4MzMzNzI4LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.wgPtG8BnvGaUgyvooitZnOkSiME-THT7ejBNU_R4F7E'
];

// Yeni token al
function getIkasToken() {
    global $ikasConfig;
    
    $tokenUrl = $ikasConfig['token_url'];
    $clientId = $ikasConfig['client_id'];
    $clientSecret = $ikasConfig['client_secret'];
    
    $postData = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);
    
    $accessToken = null;
    $tokenMethod = 'unknown';
    
    // Önce cURL dene
    if (function_exists('curl_init')) {
        $tokenMethod = 'curl';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
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
                $accessToken = $data['access_token'];
            }
        }
    }
    
    // cURL başarısızsa file_get_contents dene
    if (!$accessToken) {
        $tokenMethod = 'file_get_contents';
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
                    'content' => $postData,
                    'timeout' => 30
                ]
            ]);
            
            $response = file_get_contents($tokenUrl, false, $context);
            if ($response) {
                $data = json_decode($response, true);
                if (isset($data['access_token'])) {
                    $accessToken = $data['access_token'];
                }
            }
        } catch (Exception $e) {
            // Fallback token kullanılacak
        }
    }
    
    // Fallback token
    if (!$accessToken) {
        $tokenMethod = 'fallback';
        $accessToken = $ikasConfig['fallback_token'];
    }
    
    return $accessToken;
}

// Statik token kullan (fallback)
function getStaticToken() {
    global $ikasConfig;
    return $ikasConfig['fallback_token'];
}

// Ikas API çağrısı yap
function callIkasAPI($endpoint, $method = 'GET', $data = null, $useStaticToken = false) {
    global $ikasConfig;
    
    $token = $useStaticToken ? getStaticToken() : getIkasToken();
    
    if (!$token) {
        return false;
    }
    
    $url = $ikasConfig['base_url'] . $endpoint;
    
    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    $response = null;
    $httpCode = 0;
    
    // Önce cURL dene
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
    
    // cURL başarısızsa file_get_contents dene
    if (!$response || $httpCode !== 200) {
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
            // API çağrısı başarısız
        }
    }
    
    return false;
}

// Test mode kontrolü
function isTestMode() {
    return false; // Statik olarak false
}

// Request method kontrolü (CLI uyumlu)
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

// Güvenli hata mesajı
function getErrorResponse($message = 'API Error', $details = []) {
    return [
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s'),
        'details' => $details
    ];
}

// Başarılı response
function getSuccessResponse($data = [], $message = 'Success') {
    return [
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ];
}
?>
