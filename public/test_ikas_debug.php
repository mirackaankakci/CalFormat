<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo "<h1>IKAS API Debug Test</h1>";

// Test 1: Basic PHP Functions
echo "<h2>1. PHP Functions Test</h2>";
echo "cURL Available: " . (function_exists('curl_init') ? 'YES' : 'NO') . "<br>";
echo "file_get_contents Available: " . (function_exists('file_get_contents') ? 'YES' : 'NO') . "<br>";
echo "HTTPS Support: " . (in_array('https', stream_get_wrappers()) ? 'YES' : 'NO') . "<br>";
echo "PHP Version: " . phpversion() . "<br>";

// Test 2: Simple HTTP Request
echo "<h2>2. Simple HTTP Test</h2>";
$testUrl = "https://httpbin.org/json";
echo "Testing URL: " . $testUrl . "<br>";

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $testUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "cURL Response: " . ($response ? 'SUCCESS' : 'FAILED') . "<br>";
    echo "HTTP Code: " . $httpCode . "<br>";
    echo "Error: " . ($error ?: 'NONE') . "<br>";
    if ($response) {
        echo "Response (first 200 chars): " . substr($response, 0, 200) . "<br>";
    }
}

// Test 3: IKAS Token Test
echo "<h2>3. IKAS Token Test</h2>";
$tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
$tokenData = [
    'grant_type' => 'client_credentials',
    'client_id' => '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
    'client_secret' => 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32'
];

$tokenPostData = http_build_query($tokenData);
echo "Token URL: " . $tokenUrl . "<br>";

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $tokenPostData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
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
    
    echo "Token cURL Response: " . ($tokenResponse ? 'SUCCESS' : 'FAILED') . "<br>";
    echo "Token HTTP Code: " . $tokenHttpCode . "<br>";
    echo "Token Error: " . ($tokenError ?: 'NONE') . "<br>";
    
    if ($tokenResponse) {
        echo "Token Response (first 500 chars): " . substr($tokenResponse, 0, 500) . "<br>";
        $tokenJson = json_decode($tokenResponse, true);
        if ($tokenJson) {
            echo "JSON Parse: SUCCESS<br>";
            echo "Access Token Available: " . (isset($tokenJson['access_token']) ? 'YES' : 'NO') . "<br>";
        } else {
            echo "JSON Parse: FAILED<br>";
        }
    }
}

// Test 4: Network Connectivity
echo "<h2>4. Network Connectivity Test</h2>";
$testHosts = [
    'google.com',
    'calformat.myikas.com',
    'api.myikas.com'
];

foreach ($testHosts as $host) {
    $result = @fsockopen($host, 80, $errno, $errstr, 5);
    if ($result) {
        echo "$host:80 - CONNECTED<br>";
        fclose($result);
    } else {
        echo "$host:80 - FAILED ($errno: $errstr)<br>";
    }
    
    $result = @fsockopen($host, 443, $errno, $errstr, 5);
    if ($result) {
        echo "$host:443 - CONNECTED<br>";
        fclose($result);
    } else {
        echo "$host:443 - FAILED ($errno: $errstr)<br>";
    }
}
