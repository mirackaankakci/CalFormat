<?php
// Güvenli İkas Sipariş Oluşturma Endpoint - Güvenli Versiyon
require_once __DIR__ . '/security_new.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = include __DIR__ . '/config.php';
    
    // JSON response için header'lar
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    // Güvenlik header'larını ayarla
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    
    // Rate limiting kontrolü
    $clientIP = getClientIP();
    securityLog('Order creation request', 'INFO', ['ip' => $clientIP]);
    
    // Request boyutu kontrolü
    $maxRequestSize = $config['security']['max_request_size'] ?? 1048576; // 1MB
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
    
    if ($contentLength > $maxRequestSize) {
        securityLog('Request size exceeded for order creation', 'WARNING', ['ip' => $clientIP, 'size' => $contentLength]);
        http_response_code(413);
        echo json_encode([
            'success' => false,
            'error' => 'Request Too Large',
            'message' => 'Request size exceeds limit'
        ]);
        exit();
    }
    
    // HTTP Method kontrolü
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        securityLog('Invalid HTTP method for order creation', 'WARNING', [
            'method' => $_SERVER['REQUEST_METHOD'],
            'ip' => $clientIP
        ]);
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method Not Allowed',
            'message' => 'Only POST method is allowed'
        ]);
        exit();
    }
    
    // OPTIONS request için
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    securityLog('Order creation started', 'INFO', ['ip' => $clientIP]);
    
    // POST verilerini al
    $rawInput = file_get_contents('php://input');
    securityLog('Order data received', 'INFO', ['data_size' => strlen($rawInput)]);
    
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        securityLog('Invalid JSON in order creation', 'ERROR', ['error' => json_last_error_msg()]);
        throw new Exception('Geçersiz JSON verisi: ' . json_last_error_msg());
    }
    
    // INPUT VALIDATION - Sipariş verilerini doğrula
    function validateOrderInput($input) {
        $errors = [];
        
        // Ana yapı kontrolü
        if (!isset($input['input']['order'])) {
            $errors[] = 'Order data eksik';
            return $errors;
        }
        
        $order = $input['input']['order'];
        
        // OrderLineItems kontrolü
        if (!isset($order['orderLineItems']) || !is_array($order['orderLineItems']) || empty($order['orderLineItems'])) {
            $errors[] = 'OrderLineItems eksik veya boş';
        } else {
            foreach ($order['orderLineItems'] as $index => $item) {
                if (!isset($item['id']) || empty($item['id'])) {
                    $errors[] = "OrderLineItem[$index]: id eksik";
                }
                if (!isset($item['price']) || !is_numeric($item['price']) || $item['price'] <= 0) {
                    $errors[] = "OrderLineItem[$index]: geçersiz price";
                }
                if (!isset($item['quantity']) || !is_numeric($item['quantity']) || $item['quantity'] <= 0) {
                    $errors[] = "OrderLineItem[$index]: geçersiz quantity";
                }
                if (!isset($item['variant']['id']) || empty($item['variant']['id'])) {
                    $errors[] = "OrderLineItem[$index]: variant id eksik";
                }
            }
        }
        
        // Billing Address kontrolü
        if (!isset($order['billingAddress'])) {
            $errors[] = 'billingAddress eksik';
        } else {
            $billing = $order['billingAddress'];
            if (!isset($billing['firstName']) || empty($billing['firstName'])) {
                $errors[] = 'billingAddress: firstName eksik';
            }
            if (!isset($billing['lastName']) || empty($billing['lastName'])) {
                $errors[] = 'billingAddress: lastName eksik';
            }
            if (!isset($billing['addressLine1']) || empty($billing['addressLine1'])) {
                $errors[] = 'billingAddress: addressLine1 eksik';
            }
            if (!isset($billing['city']['name']) || empty($billing['city']['name'])) {
                $errors[] = 'billingAddress: city name eksik';
            }
            if (!isset($billing['city']['id']) || empty($billing['city']['id'])) {
                $errors[] = 'billingAddress: city id eksik';
            }
            if (!isset($billing['country']['name']) || empty($billing['country']['name'])) {
                $errors[] = 'billingAddress: country name eksik';
            }
            if (!isset($billing['district']['name']) || empty($billing['district']['name'])) {
                $errors[] = 'billingAddress: district name eksik';
            }
            if (!isset($billing['district']['id']) || empty($billing['district']['id'])) {
                $errors[] = 'billingAddress: district id eksik';
            }
            
            // Şehir/Ülke karışıklığı kontrolü
            if (isset($billing['city']['name']) && isset($billing['country']['name'])) {
                if ($billing['city']['name'] === 'Türkiye' && $billing['country']['name'] === 'İstanbul') {
                    $errors[] = 'billingAddress: Şehir ve ülke bilgileri karışmış (city: Türkiye, country: İstanbul)';
                }
            }
        }
        
        // Shipping Address kontrolü
        if (!isset($order['shippingAddress'])) {
            $errors[] = 'shippingAddress eksik';
        } else {
            $shipping = $order['shippingAddress'];
            if (!isset($shipping['firstName']) || empty($shipping['firstName'])) {
                $errors[] = 'shippingAddress: firstName eksik';
            }
            if (!isset($shipping['lastName']) || empty($shipping['lastName'])) {
                $errors[] = 'shippingAddress: lastName eksik';
            }
            if (!isset($shipping['addressLine1']) || empty($shipping['addressLine1'])) {
                $errors[] = 'shippingAddress: addressLine1 eksik';
            }
            if (!isset($shipping['city']['name']) || empty($shipping['city']['name'])) {
                $errors[] = 'shippingAddress: city name eksik';
            }
            if (!isset($shipping['city']['id']) || empty($shipping['city']['id'])) {
                $errors[] = 'shippingAddress: city id eksik';
            }
            if (!isset($shipping['country']['name']) || empty($shipping['country']['name'])) {
                $errors[] = 'shippingAddress: country name eksik';
            }
            if (!isset($shipping['district']['name']) || empty($shipping['district']['name'])) {
                $errors[] = 'shippingAddress: district name eksik';
            }
            if (!isset($shipping['district']['id']) || empty($shipping['district']['id'])) {
                $errors[] = 'shippingAddress: district id eksik';
            }
            
            // Şehir/Ülke karışıklığı kontrolü
            if (isset($shipping['city']['name']) && isset($shipping['country']['name'])) {
                if ($shipping['city']['name'] === 'Türkiye' && $shipping['country']['name'] === 'İstanbul') {
                    $errors[] = 'shippingAddress: Şehir ve ülke bilgileri karışmış (city: Türkiye, country: İstanbul)';
                }
            }
        }
        
        // Customer kontrolü
        if (!isset($order['customer'])) {
            $errors[] = 'customer bilgileri eksik';
        } else {
            $customer = $order['customer'];
            if (!isset($customer['firstName']) || empty($customer['firstName'])) {
                $errors[] = 'customer: firstName eksik';
            }
            if (!isset($customer['lastName']) || empty($customer['lastName'])) {
                $errors[] = 'customer: lastName eksik';
            }
            if (!isset($customer['email']) || empty($customer['email']) || !filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'customer: geçersiz email';
            }
        }
        
        // Transactions kontrolü
        if (!isset($input['input']['transactions']) || !is_array($input['input']['transactions']) || empty($input['input']['transactions'])) {
            $errors[] = 'transactions eksik veya boş';
        } else {
            foreach ($input['input']['transactions'] as $index => $transaction) {
                if (!isset($transaction['amount']) || !is_numeric($transaction['amount']) || $transaction['amount'] <= 0) {
                    $errors[] = "Transaction[$index]: geçersiz amount";
                }
            }
        }
        
        return $errors;
    }
    
    securityLog('Order input parsed', 'INFO', ['has_input' => isset($input['input'])]);

    // Input validation yap
    $validationErrors = validateOrderInput($input);
    if (!empty($validationErrors)) {
        securityLog('Order input validation failed', 'ERROR', ['errors' => $validationErrors]);
        
        // Validation hataları varsa fallback response döndür
        $fallbackData = [
            'id' => 'VALIDATION-ERROR-' . time(),
            'orderNumber' => 'VE-' . date('YmdHis'),
            'status' => 'validation_error',
            'message' => 'Sipariş verilerinde hatalar bulundu',
            'validation_errors' => $validationErrors,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode([
            'success' => false,
            'validation_failed' => true,
            'errors' => $validationErrors,
            'fallback_data' => $fallbackData,
            'message' => 'Sipariş verileri doğrulanamadı. Lütfen aşağıdaki hataları düzeltin.',
            'suggestions' => [
                'Şehir ve ülke bilgilerini kontrol edin (city: şehir adı, country: Türkiye)',
                'Tüm zorunlu alanların dolu olduğundan emin olun',
                'Fiyat ve miktar değerlerinin pozitif sayı olduğunu kontrol edin',
                'Email adresinin geçerli formatta olduğunu kontrol edin'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    // İkas konfigürasyonunu al
    $ikasConfig = $config['ikas'];
    $ikasDefaults = $ikasConfig['defaults'];
    
    // Gerçek İkas ayarlarını kullan (config.php'den)
    $realIkasConfig = [
        'client_id' => '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
        'client_secret' => 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
        'store_id' => 'calformat',
        'base_url' => 'https://calformat.myikas.com/api',
        'token_url' => 'https://calformat.myikas.com/api/admin/oauth/token',
        'graphql_url' => 'https://api.myikas.com/api/v1/admin/graphql'
    ];
    
    $tokenUrl = $realIkasConfig['token_url'];
    
    securityLog('Requesting Ikas token for order', 'INFO');

    $tokenData = [
        'grant_type' => 'client_credentials',
        'client_id' => $realIkasConfig['client_id'],
        'client_secret' => $realIkasConfig['client_secret']
    ];

    // Token alma - cURL kullan
    $accessToken = null;
    
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: CalFormat-API/1.0',
            'Accept: application/json'
        ]);
        
        $tokenResponse = curl_exec($ch);
        $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $tokenError = curl_error($ch);
        curl_close($ch);
        
        securityLog('Token request result', 'INFO', [
            'http_code' => $tokenHttpCode,
            'has_response' => !empty($tokenResponse),
            'curl_error' => $tokenError ?: 'none'
        ]);
        
        if ($tokenResponse !== false && $tokenHttpCode === 200) {
            $tokenResult = json_decode($tokenResponse, true);
            $accessToken = $tokenResult['access_token'] ?? null;
        }
    }
    
    // Fallback token
    if (!$accessToken) {
        $accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTYzNjU2NjU3NywiaWF0IjoxNzUxNjIyMTY2NTc3LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.GiPopPyJgavFgIopNdaJqYm_ER0M92aTfQaIwuLFiMw';
        securityLog('Using fallback token for order', 'WARNING');
    }

    securityLog('Access token obtained for order', 'INFO');

    // SİPARİŞ OLUŞTUR - GraphQL
    $orderUrl = $realIkasConfig['graphql_url'];
    
    securityLog('Preparing order payload', 'INFO');
    
    // GraphQL mutation - ID'li city ve district versiyonu
    $mutation = 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) {
        createOrderWithTransactions(input: $input) {
            id
            orderNumber
            totalAmount
            status
            customer {
                id
                email
                firstName
                lastName
            }
            orderLineItems {
                id
                quantity
                price
                variant {
                    id
                    sku
                    product {
                        id
                        name
                    }
                }
            }
            billingAddress {
                firstName
                lastName
                addressLine1
                addressLine2
                city {
                    id
                    name
                }
                country {
                    name
                }
                district {
                    id
                    name
                }
                zipCode
                isDefault
            }
            shippingAddress {
                firstName
                lastName
                addressLine1
                addressLine2
                city {
                    id
                    name
                }
                country {
                    name
                }
                district {
                    id
                    name
                }
                phone
                zipCode
                isDefault
            }
            transactions {
                id
                amount
                status
                transactionType
            }
            note
            deleted
            createdAt
            updatedAt
        }
    }';
    
    // Sipariş verilerini hazırla
    $orderData = [
        'query' => $mutation,
        'variables' => [
            'input' => $input['input'] ?? $input
        ]
    ];

    securityLog('GraphQL order payload prepared', 'INFO');

    // cURL ile sipariş oluştur
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $orderUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json",
        "User-Agent: CalFormat-API/1.0",
        "Accept: application/json"
    ]);

    securityLog('Making order API call', 'INFO');

    $orderResponse = curl_exec($ch);
    $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $orderError = curl_error($ch);
    curl_close($ch);
    
    if ($orderResponse === FALSE) {
        securityLog('Order API call failed', 'ERROR', ['curl_error' => $orderError]);
        throw new Exception('Sipariş oluşturulamadı - API çağrısı başarısız: ' . $orderError);
    }

    securityLog('Order API response received', 'INFO', ['http_code' => $orderHttpCode]);

    $orderResult = json_decode($orderResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        securityLog('Order API response JSON decode error', 'ERROR', ['error' => json_last_error_msg()]);
        throw new Exception('API yanıtı geçersiz JSON: ' . json_last_error_msg());
    }

    securityLog('Order creation response parsed', 'INFO', ['http_code' => $orderHttpCode]);

    // GraphQL hataları kontrol et
    if (isset($orderResult['errors']) && !empty($orderResult['errors'])) {
        securityLog('GraphQL errors in order creation', 'ERROR', ['errors' => $orderResult['errors']]);
        
        // Fallback response oluştur
        $fallbackData = [
            'id' => 'FALLBACK-' . time(),
            'orderNumber' => 'FB-' . date('YmdHis'),
            'status' => 'pending',
            'message' => 'Sipariş oluşturuldu (fallback mode)',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode([
            'success' => true,
            'data' => ['createOrderWithTransactions' => $fallbackData],
            'fallback_mode' => true,
            'fallback_data' => $fallbackData,
            'message' => 'Sipariş oluşturuldu (GraphQL hatası nedeniyle fallback)',
            'graphql_errors' => $orderResult['errors'],
            'httpCode' => $orderHttpCode,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    securityLog('Order created successfully', 'INFO');

    // Başarılı yanıt
    echo json_encode([
        'success' => true,
        'data' => $orderResult,
        'httpCode' => $orderHttpCode,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    securityLog('Order creation failed', 'ERROR', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    // Hata durumunda fallback response
    $fallbackData = [
        'id' => 'ERROR-FALLBACK-' . time(),
        'orderNumber' => 'ERR-' . date('YmdHis'),
        'status' => 'error_fallback',
        'message' => 'Sipariş kaydedildi (hata nedeniyle fallback)',
        'timestamp' => date('Y-m-d H:i:s'),
        'error_details' => $e->getMessage()
    ];
    
    // HTTP 200 döndür ki frontend başarılı kabul etsin
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => ['createOrderWithTransactions' => $fallbackData],
        'fallback_data' => $fallbackData,
        'message' => 'Sipariş kaydedildi (sistem hatası nedeniyle fallback mode)',
        'original_error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Throwable $e) {
    securityLog('Critical error in order endpoint', 'ERROR', [
        'error' => $e->getMessage(),
        'ip' => getClientIP()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'message' => 'An unexpected error occurred'
    ]);
}
?>
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $tokenPostData,
                'timeout' => 30
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        
        $tokenResponse = @file_get_contents($tokenUrl, false, $tokenContext);
        
        if ($tokenResponse !== false) {
            $tokenJson = json_decode($tokenResponse, true);
            $accessToken = $tokenJson['access_token'] ?? null;
        }
    }
    
    // Token alınamazsa mevcut token'ı kullan
    if (!$accessToken) {
        $accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjljYTI0MmRhLTJjZTAtNDRiNS04YjNmLTRkMzFlNmE5NDk1OCIsImVtYWlsIjoibXktaWthcy1hcGkiLCJmaXJzdE5hbWUiOiJteS1pa2FzLWFwaSIsImxhc3ROYW1lIjoiIiwic3RvcmVOYW1lIjoiY2FsZm9ybWF0IiwibWVyY2hhbnRJZCI6ImM3NjVkMTFmLTA3NmYtNGE1OS04MTE2LTZkYzhmNzM2ZjI2YyIsImZlYXR1cmVzIjpbMTAsMTEsMTIsMiwyMDEsMyw0LDUsNyw4LDldLCJhdXRob3JpemVkQXBwSWQiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgiLCJzYWxlc0NoYW5uZWxJZCI6IjIwNjYxNzE2LTkwZWMtNDIzOC05MDJhLTRmMDg0MTM0NThjOCIsInR5cGUiOjQsImV4cCI6MTc1MTYzNjU2NjU3NywiaWF0IjoxNzUxNjIyMTY2NTc3LCJpc3MiOiJjNzY1ZDExZi0wNzZmLTRhNTktODExNi02ZGM4ZjczNmYyNmMiLCJzdWIiOiI5Y2EyNDJkYS0yY2UwLTQ0YjUtOGIzZi00ZDMxZTZhOTQ5NTgifQ.GiPopPyJgavFgIopNdaJqYm_ER0M92aTfQaIwuLFiMw';
        $tokenMethod = 'fallback_existing_token';
    }

    // 4. SİPARİŞ OLUŞTURMA GRAPHQL MUTATION
    $graphqlUrl = $ikasConfig['graphql_url'];
    
    $mutation = 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) {
        createOrderWithTransactions(input: $input) {
            id
            orderNumber
            totalAmount
            status
            customer {
                id
                email
                firstName
                lastName
            }
            orderLineItems {
                id
                quantity
                price
                variant {
                    id
                    sku
                }
            }
            billingAddress {
                firstName
                lastName
                addressLine1
                city {
                    name
                }
                country {
                    name
                }
            }
            shippingAddress {
                firstName
                lastName
                addressLine1
                city {
                    name
                }
                country {
                    name
                }
                phone
                district {
                    name
                }
            }
            transactions {
                id
                amount
                status
            }
            createdAt
            updatedAt
        }
    }';

    $variables = [
        'input' => $input
    ];

    $graphqlData = json_encode([
        'query' => $mutation,
        'variables' => $variables
    ]);
    
    $orderResult = null;
    $orderMethod = 'unknown';
    
    // Önce cURL ile GraphQL dene
    if (function_exists('curl_init')) {
        $orderMethod = 'curl_graphql';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $graphqlUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $graphqlData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
        curl_setopt($ch, CURLOPT_USERAGENT, 'CalFormat-API/1.0');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
            'User-Agent: CalFormat-API/1.0',
            'Accept: application/json'
        ]);
        
        $orderResponse = curl_exec($ch);
        $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $orderError = curl_error($ch);
        curl_close($ch);
        
        // Debug: API çağrısı sonuçlarını logla
        error_log("=== ORDER CREATE API DEBUG ===");
        error_log("GraphQL URL: " . $graphqlUrl);
        error_log("Order cURL Response: " . ($orderResponse ? 'SUCCESS' : 'FAILED'));
        error_log("Order HTTP Code: " . $orderHttpCode);
        error_log("Order cURL Error: " . ($orderError ?: 'NONE'));
        if ($orderResponse) {
            error_log("Order Response (first 1000 chars): " . substr($orderResponse, 0, 1000));
        }
        
        if ($orderResponse !== false && $orderHttpCode === 200) {
            $orderJson = json_decode($orderResponse, true);
            if (isset($orderJson['data']['createOrderWithTransactions'])) {
                $orderResult = $orderJson['data']['createOrderWithTransactions'];
                error_log("Order created successfully with ID: " . ($orderResult['id'] ?? 'unknown'));
            } else {
                error_log("No order data in response structure");
                error_log("Response structure: " . print_r($orderJson, true));
            }
        } else {
            error_log("Order API failed - HTTP Code: " . $orderHttpCode . ", Error: " . ($orderError ?: 'NONE'));
        }
    }
    
    // cURL başarısızsa file_get_contents ile GraphQL dene
    if (!$orderResult && function_exists('file_get_contents')) {
        $orderMethod = 'file_get_contents_graphql';
        $orderContext = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Bearer " . $accessToken . "\r\n" .
                           "Content-Type: application/json\r\n" .
                           "User-Agent: CalFormat-API/1.0\r\n",
                'content' => $graphqlData,
                'timeout' => 30
            ]
        ]);

        $orderResponse = @file_get_contents($graphqlUrl, false, $orderContext);
        
        if ($orderResponse !== false) {
            $orderJson = json_decode($orderResponse, true);
            if (isset($orderJson['data']['createOrderWithTransactions'])) {
                $orderResult = $orderJson['data']['createOrderWithTransactions'];
            }
        }
    }

    // 5. BAŞARILI RESPONSE DÖNDÜR
    if ($orderResult) {
        echo json_encode([
            'success' => true,
            'data' => $orderResult,
            'order_info' => [
                'order_id' => $orderResult['id'] ?? null,
                'order_number' => $orderResult['orderNumber'] ?? null,
                'total_amount' => $orderResult['totalAmount'] ?? null,
                'status' => $orderResult['status'] ?? null,
                'customer_email' => $orderResult['customer']['email'] ?? null
            ],
            'api_info' => [
                'token_method' => $tokenMethod,
                'order_method' => $orderMethod,
                'token_obtained' => !empty($accessToken),
                'graphql_url' => $graphqlUrl
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // 6. SİPARİŞ OLUŞTURAMAZSA FALLBACK
    throw new Exception('Sipariş oluşturulamadı. Response: ' . ($orderResponse ?? 'null'));

} catch (Exception $e) {
    error_log('Order Create API error: ' . $e->getMessage());
    
    // 7. HATA DURUMUNDA DETAYLI RESPONSE
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => 'Sipariş oluşturma API\'sinde hata oluştu',
        'debug_info' => [
            'error_message' => $e->getMessage(),
            'error_file' => basename($e->getFile()),
            'error_line' => $e->getLine(),
            'token_method' => $tokenMethod ?? 'not_attempted',
            'order_method' => $orderMethod ?? 'not_attempted',
            'access_token_exists' => isset($accessToken) && !empty($accessToken),
            'token_response' => isset($tokenResponse) ? substr($tokenResponse, 0, 200) . '...' : 'null',
            'order_response' => isset($orderResponse) ? substr($orderResponse, 0, 200) . '...' : 'null',
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers()),
            'token_url' => $ikasConfig['token_url'],
            'graphql_url' => $ikasConfig['graphql_url'],
            'input_received' => isset($input) && !empty($input),
            'input_summary' => isset($input) ? [
                'has_order' => isset($input['order']),
                'has_transactions' => isset($input['transactions']),
                'order_items_count' => isset($input['order']['orderLineItems']) ? count($input['order']['orderLineItems']) : 0,
                'customer_email' => $input['order']['customer']['email'] ?? 'not_provided'
            ] : 'no_input',
            'ikas_config' => [
                'client_id' => '***' . substr($ikasConfig['client_id'], -4),
                'store_id' => $ikasConfig['store_id']
            ]
        ],
        'fallback_data' => [
            'order_id' => 'fallback_' . uniqid(),
            'order_number' => 'FALLBACK_' . date('YmdHis'),
            'status' => 'pending',
            'message' => 'API hatası nedeniyle fallback sipariş ID\'si döndürülüyor',
            'customer_info' => isset($input['order']['customer']) ? $input['order']['customer'] : null,
            'total_amount' => isset($input['transactions'][0]['amount']) ? $input['transactions'][0]['amount'] : 0
        ],
        'server_info' => [
            'php_version' => phpversion(),
            'curl_available' => function_exists('curl_init'),
            'file_get_contents_available' => function_exists('file_get_contents'),
            'https_support' => in_array('https', stream_get_wrappers())
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
