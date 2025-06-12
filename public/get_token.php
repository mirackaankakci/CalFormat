<?php
// İkas Token URL (mağaza adına göre özelleştirilmiş)
$url = 'https://calformat.myikas.com/api/admin/oauth/token';

// Kimlik bilgilerini gir
$clientId = '9ca242da-2ce0-44b5-8b3f-4d31e6a94958';
$clientSecret = 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32';

// POST verileri (x-www-form-urlencoded)
$data = http_build_query([
    'grant_type' => 'client_credentials',
    'client_id' => $clientId,
    'client_secret' => $clientSecret
]);

// cURL başlat
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

// Header
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

// İsteği gönder
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Cevabı göster
echo "HTTP Durum Kodu: $httpcode\n\n";
echo "Yanıt:\n$response\n";

// Access token'ı ayıkla (isteğe bağlı)
$responseData = json_decode($response, true);
if (isset($responseData['access_token'])) {
    echo "\n\nAccess Token:\n" . $responseData['access_token'] . "\n";
} else {
    echo "\n\nAccess token alınamadı.\n";
}
?>
