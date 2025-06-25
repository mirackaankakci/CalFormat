<?php
// Hata raporlamayı aç
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Önce basit test
echo json_encode([
    'status' => 'başlangıç',
    'message' => 'PHP dosyası başlatıldı'
]);

// Burada dur, API çağrısını şimdilik yapmayalım
exit;

// TOKEN AL (şimdilik comment)
/*
$tokenUrl = 'https://calformat.myikas.com/api/admin/oauth/token';
$clientId = '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
$clientSecret = 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';
*/
?>