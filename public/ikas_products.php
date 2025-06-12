<?php
// TOKEN AL
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
  'Content-Type: application/x-www-form-urlencoded'
]);
$tokenResponse = curl_exec($ch);
curl_close($ch);

$tokenJson = json_decode($tokenResponse, true);
$accessToken = $tokenJson['access_token'] ?? null;

if (!$accessToken) {
  http_response_code(401);
  echo json_encode(['error' => 'Token alınamadı']);
  exit;
}

// ÜRÜNLERİ ÇEK
$graphqlUrl = 'https://api.myikas.com/api/v1/admin/graphql';
$query = [
  "query" => "{ listProduct { data { id name createdAt } } }"
];

$ch = curl_init($graphqlUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($query));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'Authorization: Bearer ' . $accessToken
]);
$response = curl_exec($ch);
curl_close($ch);

header('Content-Type: application/json');
echo $response;
