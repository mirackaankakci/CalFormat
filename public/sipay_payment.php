<?php
/**
 * SiPay Ödeme Sistemi - Temiz ve Düzenli Entegrasyon
 * 2D ve 3D Güvenli Ödeme Desteği
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS ve JSON headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Güvenli JSON girişi al
$input = getSecureJSONInput();

// Debug bilgileri ekle
securityLog('Request debug info', 'INFO', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'raw_input' => file_get_contents('php://input'),
    'parsed_input' => $input
]);

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];
    
    securityLog('SiPay Payment API called', 'INFO', [
        'action' => $input['action'] ?? 'unknown',
        'amount' => $input['total'] ?? $input['amount'] ?? 0,
        'payment_type' => $input['payment_type'] ?? 'unknown',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);

    /**
     * SiPay Token Alma Fonksiyonu
     */
    function getSipayToken($sipayConfig) {
        $tokenData = [
            'app_id' => $sipayConfig['app_id'],
            'app_secret' => $sipayConfig['app_secret']
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $sipayConfig['base_url'] . '/api/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        securityLog('SiPay token request', 'INFO', [
            'http_code' => $httpCode,
            'response_length' => strlen($response),
            'app_id' => $sipayConfig['app_id']
        ]);
        
        if ($httpCode === 200) {
            $result = json_decode($response, true);
            if (isset($result['data']['token'])) {
                return $result['data']['token'];
            }
        }
        
        throw new Exception('SiPay token alınamadı: HTTP ' . $httpCode);
    }

    /**
     * SiPay Hash Key oluşturma fonksiyonu
     */
    function generateSipayHashKey($total, $installment, $currency_code, $merchant_key, $invoice_id, $app_secret) {
        $data = $total . '|' . $installment . '|' . $currency_code . '|' . $merchant_key . '|' . $invoice_id;
        
        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($app_secret);
        
        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);
        
        $encrypted = openssl_encrypt("$data", 'aes-256-cbc', "$saltWithPassword", null, $iv);
        
        $msg_encrypted_bundle = "$iv:$salt:$encrypted";
        $msg_encrypted_bundle = str_replace('/', '__', $msg_encrypted_bundle);
        
        return $msg_encrypted_bundle;
    }
    
    /**
     * Hash key doğrulama fonksiyonu
     */
    function validateHashKey($hashKey, $secretKey) {
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            $hashKey = str_replace('__', '/', $hashKey);
            $password = sha1($secretKey);

            $components = explode(':', $hashKey);
            if (count($components) > 2) {
                $iv = isset($components[0]) ? $components[0] : "";
                $salt = isset($components[1]) ? $components[1] : "";
                $salt = hash('sha256', $password . $salt);
                $encryptedMsg = isset($components[2]) ? $components[2] : "";

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, null, $iv);

                if (strpos($decryptedMsg, '|') !== false) {
                    $array = explode('|', $decryptedMsg);
                    $status = isset($array[0]) ? $array[0] : 0;
                    $total = isset($array[1]) ? $array[1] : 0;
                    $invoiceId = isset($array[2]) ? $array[2] : '0';
                    $orderId = isset($array[3]) ? $array[3] : 0;
                    $currencyCode = isset($array[4]) ? $array[4] : '';
                }
            }
        }

        return [$status, $total, $invoiceId, $orderId, $currencyCode];
    }

    /**
     * İkas Sipariş Oluşturma Fonksiyonu
     */
    function createIkasOrder($orderData, $config) {
        securityLog('Creating Ikas order', 'INFO', [
            'invoice_id' => $orderData['invoice_id'] ?? 'unknown',
            'total' => $orderData['total'] ?? 0,
            'customer_name' => $orderData['name'] ?? 'unknown'
        ]);
        
        try {
            $ikasConfig = $config['ikas'];
            
            // Token al
            $tokenData = [
                'grant_type' => 'client_credentials',
                'client_id' => $ikasConfig['client_id'],
                'client_secret' => $ikasConfig['client_secret']
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $ikasConfig['token_url']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json'
            ]);
            
            $tokenResponse = curl_exec($ch);
            $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($tokenHttpCode !== 200) {
                throw new Exception('İkas token alınamadı: HTTP ' . $tokenHttpCode);
            }
            
            $tokenResult = json_decode($tokenResponse, true);
            $accessToken = $tokenResult['access_token'] ?? null;
            
            if (!$accessToken) {
                throw new Exception('İkas access token bulunamadı');
            }
            
            // Sipariş oluştur
            $mutation = 'mutation CreateOrderWithTransactions($input: CreateOrderWithTransactionsInput!) {
                createOrderWithTransactions(input: $input) {
                    id
                    orderNumber
                }
            }';
            
            $orderPayload = [
                'query' => $mutation,
                'variables' => [
                    'input' => [
                        'order' => [
                            'orderLineItems' => [
                                [
                                    'id' => $ikasConfig['defaults']['fallback_product_id'],
                                    'price' => intval($orderData['total'] ?? 100),
                                    'variant' => [
                                        'id' => $ikasConfig['defaults']['fallback_variant_id']
                                    ],
                                    'quantity' => 1
                                ]
                            ],
                            'billingAddress' => [
                                'firstName' => $orderData['name'] ?? 'Ödeme',
                                'lastName' => $orderData['surname'] ?? 'Müşterisi',
                                'addressLine1' => $orderData['bill_address1'] ?? 'Sipariş Adresi',
                                'addressLine2' => $orderData['bill_address2'] ?? '',
                                'city' => [
                                    'id' => $ikasConfig['defaults']['default_city_id'],
                                    'name' => $orderData['bill_city'] ?? $ikasConfig['defaults']['default_city']
                                ],
                                'country' => [
                                    'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861',
                                    'name' => 'Türkiye'
                                ],
                                'district' => [
                                    'id' => $ikasConfig['defaults']['default_district_id'],
                                    'name' => $orderData['bill_state'] ?? $ikasConfig['defaults']['default_district']
                                ],
                                'state' => [
                                    'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861'
                                ],
                                'phone' => $orderData['bill_phone'] ?? '05551234567',
                                'company' => null,
                                'isDefault' => false
                            ],
                            'shippingAddress' => [
                                'firstName' => $orderData['name'] ?? 'Ödeme',
                                'lastName' => $orderData['surname'] ?? 'Müşterisi',
                                'addressLine1' => $orderData['bill_address1'] ?? 'Sipariş Adresi',
                                'addressLine2' => $orderData['bill_address2'] ?? '',
                                'city' => [
                                    'id' => $ikasConfig['defaults']['default_city_id'],
                                    'name' => $orderData['bill_city'] ?? $ikasConfig['defaults']['default_city']
                                ],
                                'country' => [
                                    'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861',
                                    'name' => 'Türkiye'
                                ],
                                'district' => [
                                    'id' => $ikasConfig['defaults']['default_district_id'],
                                    'name' => $orderData['bill_state'] ?? $ikasConfig['defaults']['default_district']
                                ],
                                'state' => [
                                    'id' => 'da8c5f2a-8d37-48a8-beff-6ab3793a1861'
                                ],
                                'phone' => $orderData['bill_phone'] ?? '05551234567',
                                'company' => null,
                                'isDefault' => false
                            ],
                            'note' => 'Başarılı ödeme sonrası oluşturulan sipariş - ' . ($orderData['invoice_id'] ?? date('Y-m-d H:i:s')),
                            'deleted' => false,
                            'customer' => [
                                'lastName' => $orderData['surname'] ?? 'Müşterisi',
                                'firstName' => $orderData['name'] ?? 'Ödeme',
                                'email' => $orderData['bill_email'] ?? 'odeme@calformat.com'
                            ]
                        ],
                        'transactions' => [
                            [
                                'amount' => intval($orderData['total'] ?? 100)
                            ]
                        ]
                    ]
                ]
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $ikasConfig['graphql_url']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderPayload));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $accessToken",
                "Content-Type: application/json",
                "Accept: application/json"
            ]);
            
            $orderResponse = curl_exec($ch);
            $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $orderResult = json_decode($orderResponse, true);
            
            if (isset($orderResult['data']['createOrderWithTransactions'])) {
                securityLog('Ikas order created successfully', 'SUCCESS', [
                    'order_id' => $orderResult['data']['createOrderWithTransactions']['id'],
                    'order_number' => $orderResult['data']['createOrderWithTransactions']['orderNumber']
                ]);
                
                return [
                    'success' => true,
                    'order_id' => $orderResult['data']['createOrderWithTransactions']['id'],
                    'order_number' => $orderResult['data']['createOrderWithTransactions']['orderNumber']
                ];
            } else {
                securityLog('Ikas order creation failed', 'ERROR', [
                    'response' => $orderResult,
                    'errors' => $orderResult['errors'] ?? 'no errors field'
                ]);
                
                return [
                    'success' => false,
                    'error' => 'İkas sipariş oluşturulamadı',
                    'details' => $orderResult['errors'] ?? []
                ];
            }
            
        } catch (Exception $e) {
            securityLog('Exception in Ikas order creation', 'ERROR', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => 'Sipariş oluşturma hatası: ' . $e->getMessage()
            ];
        }
    }

    // Action işleme
    $action = $input['action'] ?? '';
    
    securityLog('Action processing', 'INFO', [
        'action' => $action,
        'input_keys' => array_keys($input ?: []),
        'input_null' => is_null($input)
    ]);
    
    if (empty($action)) {
        throw new Exception('Action parametresi boş veya eksik. Input: ' . json_encode($input));
    }
    
    switch ($action) {
        case 'start_2d_payment':
            // 2D Ödeme başlat
            $invoiceId = 'INV' . time() . rand(100, 999);
            $amount = floatval($input['amount'] ?? 0);
            
            if ($amount <= 0) {
                throw new Exception('Geçersiz ödeme tutarı');
            }
            
            // Müşteri bilgilerini session'a kaydet
            session_start();
            $sessionKey = 'payment_' . $invoiceId;
            $_SESSION[$sessionKey] = [
                'name' => $input['customer']['name'] ?? '',
                'surname' => $input['customer']['surname'] ?? '',
                'bill_email' => $input['customer']['email'] ?? '',
                'bill_phone' => $input['customer']['phone'] ?? '',
                'bill_address1' => $input['customer']['address1'] ?? '',
                'bill_address2' => $input['customer']['address2'] ?? '',
                'bill_city' => $input['customer']['city'] ?? '',
                'bill_state' => $input['customer']['state'] ?? '',
                'bill_country' => $input['customer']['country'] ?? 'TR',
            ];
            
            $token = getSipayToken($sipayConfig);
            
            // Hash key oluştur
            $hashKey = generateSipayHashKey(
                $amount,
                1, // 2D payment için taksit sayısı 1
                'TRY',
                $sipayConfig['merchant_key'],
                $invoiceId,
                $sipayConfig['app_secret']
            );
            
            $paymentData = [
                'merchant_key' => $sipayConfig['merchant_key'],
                'hash_key' => $hashKey,
                'invoice_id' => $invoiceId,
                'currency_code' => 'TRY',
                'total' => $amount,
                'cancel_url' => $sipayConfig['cancel_url'],
                'items' => [
                    [
                        'name' => 'CalFormat Ürün',
                        'price' => $amount,
                        'quantity' => 1,
                        'description' => 'Ödeme'
                    ]
                ],
                'bill_address1' => $input['customer']['address1'] ?? 'Sipariş Adresi',
                'bill_city' => $input['customer']['city'] ?? 'İstanbul',
                'bill_country' => 'TR',
                'bill_email' => $input['customer']['email'] ?? 'odeme@calformat.com',
                'bill_fname' => $input['customer']['name'] ?? 'Ödeme',
                'bill_lname' => $input['customer']['surname'] ?? 'Müşterisi',
                'bill_phone' => $input['customer']['phone'] ?? '05551234567',
                'bill_state' => $input['customer']['state'] ?? 'İstanbul',
                'cc_holder_name' => $input['card']['holder_name'] ?? '',
                'cc_no' => $input['card']['number'] ?? '',
                'expiry_month' => $input['card']['expiry_month'] ?? '',
                'expiry_year' => $input['card']['expiry_year'] ?? '',
                'cvv' => $input['card']['cvv'] ?? '',
                'installments_number' => $input['installments'] ?? 1
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $sipayConfig['base_url'] . $sipayConfig['payment_2d_url']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $token",
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $result = json_decode($response, true);
            
            if ($httpCode === 200 && isset($result['data']['status']) && $result['data']['status'] == 1) {
                // 2D Ödeme başarılı - İkas sipariş oluştur
                $orderData = [
                    'invoice_id' => $invoiceId,
                    'total' => $amount,
                    'name' => $input['customer']['name'] ?? 'Ödeme',
                    'surname' => $input['customer']['surname'] ?? 'Müşterisi',
                    'bill_email' => $input['customer']['email'] ?? 'odeme@calformat.com',
                    'bill_phone' => $input['customer']['phone'] ?? '05551234567',
                    'bill_address1' => $input['customer']['address1'] ?? 'Sipariş Adresi',
                    'bill_address2' => $input['customer']['address2'] ?? '',
                    'bill_city' => $input['customer']['city'] ?? 'İstanbul',
                    'bill_state' => $input['customer']['state'] ?? 'İstanbul',
                    'bill_country' => 'TR',
                    'payment_type' => '2D'
                ];
                
                $ikasResult = createIkasOrder($orderData, $config);
                
                echo json_encode([
                    'success' => true,
                    'payment_type' => '2D',
                    'invoice_id' => $invoiceId,
                    'sipay_response' => $result['data'],
                    'ikas_order' => $ikasResult
                ], JSON_UNESCAPED_UNICODE);
            } else {
                securityLog('2D Payment failed', 'ERROR', [
                    'http_code' => $httpCode,
                    'response' => $result
                ]);
                
                echo json_encode([
                    'success' => false,
                    'error' => 'Ödeme başarısız',
                    'details' => $result['data']['error_message'] ?? 'Bilinmeyen hata'
                ], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'start_3d_payment':
            // 3D Ödeme başlat
            $invoiceId = $input['invoice_id'] ?? ('INV' . time() . rand(100, 999));
            $amount = floatval($input['total'] ?? $input['amount'] ?? 0);
            
            if ($amount <= 0) {
                throw new Exception('Geçersiz ödeme tutarı');
            }
            
            // Müşteri bilgilerini session'a kaydet ve URL'e de ekle
            session_start();
            $sessionKey = 'payment_' . $invoiceId;
            $_SESSION[$sessionKey] = [
                'name' => $input['name'] ?? $input['customer']['name'] ?? '',
                'surname' => $input['surname'] ?? $input['customer']['surname'] ?? '',
                'bill_email' => $input['bill_email'] ?? $input['customer']['email'] ?? '',
                'bill_phone' => $input['bill_phone'] ?? $input['customer']['phone'] ?? '',
                'bill_address1' => $input['bill_address1'] ?? $input['customer']['address1'] ?? '',
                'bill_address2' => $input['bill_address2'] ?? $input['customer']['address2'] ?? '',
                'bill_city' => $input['bill_city'] ?? $input['customer']['city'] ?? '',
                'bill_state' => $input['bill_state'] ?? $input['customer']['state'] ?? '',
                'bill_country' => $input['bill_country'] ?? $input['customer']['country'] ?? 'TR',
            ];
            
            $token = getSipayToken($sipayConfig);
            
            // Return URL'yi temizle ve hazırla
            $baseReturnUrl = str_replace(['www.', '@', 'w'], '', $sipayConfig['return_url']);
            $baseReturnUrl = preg_replace('/^https?:\/\//', '', $baseReturnUrl);
            $baseReturnUrl = 'https://' . $baseReturnUrl;

            // Return URL'e müşteri bilgilerini de ekle
            $returnUrl = $baseReturnUrl . 
                '?customer_name=' . urlencode($input['name'] ?? $input['customer']['name'] ?? '') .
                '&customer_surname=' . urlencode($input['surname'] ?? $input['customer']['surname'] ?? '') .
                '&customer_email=' . urlencode($input['bill_email'] ?? $input['customer']['email'] ?? '') .
                '&customer_phone=' . urlencode($input['bill_phone'] ?? $input['customer']['phone'] ?? '') .
                '&customer_address1=' . urlencode($input['bill_address1'] ?? $input['customer']['address1'] ?? '') .
                '&customer_city=' . urlencode($input['bill_city'] ?? $input['customer']['city'] ?? '') .
                '&customer_state=' . urlencode($input['bill_state'] ?? $input['customer']['state'] ?? '');
            
            // Hash key oluştur
            $hashKey = generateSipayHashKey(
                $amount,
                $input['installments_number'] ?? 1,
                $input['currency_code'] ?? 'TRY',
                $sipayConfig['merchant_key'],
                $invoiceId,
                $sipayConfig['app_secret']
            );
            
            $paymentData = [
                'merchant_key' => $sipayConfig['merchant_key'],
                'hash_key' => $hashKey,
                'invoice_id' => $invoiceId,
                'currency_code' => $input['currency_code'] ?? 'TRY',
                'total' => $amount,
                'return_url' => $returnUrl,
                'cancel_url' => $sipayConfig['cancel_url'],
                'items' => $input['items'] ?? [
                    [
                        'name' => 'CalFormat Ürün',
                        'price' => $amount,
                        'quantity' => 1,
                        'description' => 'Ödeme'
                    ]
                ],
                'bill_address1' => $input['bill_address1'] ?? $input['customer']['address1'] ?? 'Sipariş Adresi',
                'bill_city' => $input['bill_city'] ?? $input['customer']['city'] ?? 'İstanbul',
                'bill_country' => $input['bill_country'] ?? 'TR',
                'bill_email' => $input['bill_email'] ?? $input['customer']['email'] ?? 'odeme@calformat.com',
                'bill_fname' => $input['name'] ?? $input['customer']['name'] ?? 'Ödeme',
                'bill_lname' => $input['surname'] ?? $input['customer']['surname'] ?? 'Müşterisi',
                'bill_phone' => $input['bill_phone'] ?? $input['customer']['phone'] ?? '05551234567',
                'bill_state' => $input['bill_state'] ?? $input['customer']['state'] ?? 'İstanbul',
                'cc_holder_name' => $input['cc_holder_name'] ?? $input['card']['holder_name'] ?? '',
                'cc_no' => $input['cc_no'] ?? $input['card']['number'] ?? '',
                'expiry_month' => $input['expiry_month'] ?? $input['card']['expiry_month'] ?? '',
                'expiry_year' => $input['expiry_year'] ?? $input['card']['expiry_year'] ?? '',
                'cvv' => $input['cvv'] ?? $input['card']['cvv'] ?? '',
                'installments_number' => $input['installments_number'] ?? $input['installments'] ?? 1,
                'name' => $input['name'] ?? $input['customer']['name'] ?? '',
                'surname' => $input['surname'] ?? $input['customer']['surname'] ?? '',
                'invoice_description' => $input['invoice_description'] ?? 'CalFormat Ödeme',
                'response_method' => 'POST'
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $sipayConfig['base_url'] . $sipayConfig['payment_3d_url']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $token",
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            
            // 3D ödeme için HTML form response kontrolü
            if ($httpCode === 200 && !empty($response)) {
                // HTML form response'u kontrol et
                if (strpos($response, '<form') !== false && strpos($response, 'the-form') !== false) {
                    // 3D Form HTML'i döndür
                    echo json_encode([
                        'success' => true,
                        'payment_type' => '3D',
                        'invoice_id' => $invoiceId,
                        'redirect_form' => $response,
                        'message' => '3D ödeme formu hazırlandı'
                    ], JSON_UNESCAPED_UNICODE);
                    return;
                }
                
                // JSON response deneme (fallback)
                $result = json_decode($response, true);
                if (isset($result['data']['status']) && $result['data']['status'] == 1) {
                    // 3D Form HTML'i döndür
                    echo json_encode([
                        'success' => true,
                        'payment_type' => '3D',
                        'invoice_id' => $invoiceId,
                        'redirect_form' => $response,
                        'message' => '3D ödeme formu hazırlandı'
                    ], JSON_UNESCAPED_UNICODE);
                    return;
                }
            }
            
            // Hata durumu
            securityLog('3D Payment initialization failed', 'ERROR', [
                    'http_code' => $httpCode,
                    'response' => $result,
                    'raw_response' => $response,
                    'curl_error' => $curlError,
                    'payment_data' => [
                        'invoice_id' => $invoiceId,
                        'total' => $amount,
                        'items_count' => count($paymentData['items'] ?? [])
                    ]
                ]);
                
                $errorMessage = '3D ödeme başlatılamadı. ';
                if ($httpCode === 404) {
                    $errorMessage .= 'API endpoint bulunamadı.';
                } elseif (isset($result['error'])) {
                    $errorMessage .= $result['error'];
                } elseif (isset($result['message'])) {
                    $errorMessage .= $result['message'];
                } else {
                    $errorMessage .= 'HTTP ' . $httpCode . ' hatası.';
                }
                
                echo json_encode([
                    'success' => false,
                    'error' => $errorMessage,
                    'details' => [
                        'http_code' => $httpCode,
                        'api_response' => $result
                    ]
                ], JSON_UNESCAPED_UNICODE);
            
            break;
            
        default:
            throw new Exception('Geçersiz action: ' . $action);
    }

} catch (Exception $e) {
    securityLog('SiPay Payment API Error', 'ERROR', [
        'error' => $e->getMessage(),
        'action' => $input['action'] ?? 'unknown'
    ]);
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
