<?php
// Test için request debug
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'headers' => getallheaders(),
    'raw_input' => file_get_contents('php://input'),
    'post_data' => $_POST,
    'get_data' => $_GET
];

$rawInput = file_get_contents('php://input');
if ($rawInput) {
    $jsonData = json_decode($rawInput, true);
    $debug['parsed_json'] = $jsonData;
    $debug['json_error'] = json_last_error_msg();
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
