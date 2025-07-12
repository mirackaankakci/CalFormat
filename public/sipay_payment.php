<?php
/**
 * SiPay Ödeme Sistemi - Ana API
 * Modern, güvenli ve modüler ödeme entegrasyonu
 * 
 * Desteklenen özellikler:
 * - Token yönetimi (2 saat geçerlilik)
 * - 2D Ödeme (Non-Secure)
 * - 3D Ödeme (Secure)
 * - Hash key doğrulama
 * - Webhook desteği
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

// Production error handling
error_reporting(E_ALL);
ini_set('display_errors', 0); // Production'da her zaman 0
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php_errors.log');

// CORS ve JSON headers
header('Content-Type: application/json; charset=utf-8');

// Güvenli JSON girişi al
$input = getSecureJSONInput();

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];
    
    // SiPay API URL'lerini oluştur
    $sipayConfig['token_url'] = $sipayConfig['base_url'] . $sipayConfig['token_url'];
    $sipayConfig['payment_2d_url'] = $sipayConfig['base_url'] . $sipayConfig['payment_2d_url'];
    $sipayConfig['payment_3d_url'] = $sipayConfig['base_url'] . $sipayConfig['payment_3d_url'];
    $sipayConfig['complete_payment_url'] = $sipayConfig['base_url'] . $sipayConfig['complete_payment_url'];
    $sipayConfig['check_status_url'] = $sipayConfig['base_url'] . $sipayConfig['check_status_url'];

    /**
     * İkas Sipariş Oluşturma Fonksiyonu - 2D ve 3D Ödeme Sonrası
     */
    function createIkasOrderFromPayment($orderData, $config) {
        securityLog('Creating Ikas order from payment success - FULL ORDER DATA', 'INFO', [
            'invoice_id' => $orderData['invoice_id'] ?? 'unknown',
            'total' => $orderData['total'] ?? 0,
            'payment_type' => $orderData['payment_type'] ?? 'unknown',
            'full_order_data' => $orderData // TÜM VERİLERİ LOGLA
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
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
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
            
            // Ödeme verilerinden sipariş payload'ı oluştur
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
                            'note' => 'Başarılı ' . ($orderData['payment_type'] ?? 'ÖDEME') . ' sonrası oluşturulan sipariş - ' . ($orderData['invoice_id'] ?? date('Y-m-d H:i:s')),
                            'deleted' => false,
                            'customer' => [
                                'lastName' => $orderData['surname'] ?? 'Müşterisi',
                                'firstName' => $orderData['name'] ?? 'Ödeme',
                                'email' => $orderData['bill_email'] ?? 'musteri@calformat.com.tr'
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
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $accessToken",
                "Content-Type: application/json",
                "Accept: application/json"
            ]);
            
            $orderResponse = curl_exec($ch);
            $orderHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            securityLog('Ikas order creation response from payment', 'INFO', [
                'http_code' => $orderHttpCode,
                'response_length' => strlen($orderResponse),
                'response_preview' => substr($orderResponse, 0, 200)
            ]);
            
            $orderResult = json_decode($orderResponse, true);
            
            if (isset($orderResult['data']['createOrderWithTransactions'])) {
                securityLog('Ikas order created successfully from payment', 'SUCCESS', [
                    'order_id' => $orderResult['data']['createOrderWithTransactions']['id'],
                    'order_number' => $orderResult['data']['createOrderWithTransactions']['orderNumber'],
                    'payment_type' => $orderData['payment_type'] ?? 'unknown'
                ]);
                
                return [
                    'success' => true,
                    'order_id' => $orderResult['data']['createOrderWithTransactions']['id'],
                    'order_number' => $orderResult['data']['createOrderWithTransactions']['orderNumber']
                ];
            } else {
                securityLog('Ikas order creation failed from payment', 'ERROR', [
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
            securityLog('Exception in Ikas order creation from payment', 'ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Sipariş oluşturma hatası: ' . $e->getMessage()
            ];
        }
    }

    /**
     * SiPay Token Alma - En Basit, Filtresiz Yöntem
     */
    function getSipayToken($config) {
        $tokenData = [
            'app_id' => $config['app_id'],
            'app_secret' => $config['app_secret']
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $config['token_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('HTTP: ' . $httpCode . ' - ' . $response);
        }

        $data = json_decode($response, true);
        if (!$data) {
            throw new Exception('JSON: ' . json_last_error_msg() . ' - RAW: ' . $response);
        }

        // Hiçbir filtreleme yapmadan direk döndür - ne gelirse kabul et
        return [
            'token' => $data['data']['token'] ?? $data['token'] ?? $data['access_token'] ?? 'NO_TOKEN_FOUND',
            'expires_in' => 7200,
            'is_3d' => $data['data']['is_3d'] ?? 1, // 3D desteği varsayılan olarak aktif
            'expires_at' => time() + 7200,
            'raw_data' => $data  // Ham veriyi de döndür debug için
        ];
    }

    /**
     * SiPay Resmi Hash Key Oluşturma Algoritması
     * 3D ödeme ve güvenlik doğrulaması için gerekli
     */
    function generateHashKey($total, $installment, $currency_code, $merchant_key, $invoice_id, $app_secret) {
        // Debug için hash generation adımlarını logla
        securityLog('Hash generation debug start', 'INFO', [
            'total' => $total,
            'installment' => $installment,
            'currency_code' => $currency_code,
            'merchant_key_preview' => substr($merchant_key, 0, 10) . '...',
            'invoice_id' => $invoice_id,
            'app_secret_preview' => substr($app_secret, 0, 10) . '...'
        ]);
        
        $data = $total . '|' . $installment . '|' . $currency_code . '|' . $merchant_key . '|' . $invoice_id;

        securityLog('Hash generation data prepared', 'INFO', [
            'data_string' => $data,
            'data_length' => strlen($data)
        ]);

        $iv = substr(sha1(mt_rand()), 0, 16);
        $password = sha1($app_secret);

        securityLog('Hash generation password created', 'INFO', [
            'iv' => $iv,
            'password_preview' => substr($password, 0, 10) . '...',
            'password_length' => strlen($password)
        ]);

        $salt = substr(sha1(mt_rand()), 0, 4);
        $saltWithPassword = hash('sha256', $password . $salt);

        securityLog('Hash generation salt processed', 'INFO', [
            'original_salt' => $salt,
            'processed_salt_preview' => substr($saltWithPassword, 0, 10) . '...'
        ]);

        $encrypted = openssl_encrypt($data, 'aes-256-cbc', $saltWithPassword, 0, $iv);
        
        if ($encrypted === false) {
            securityLog('Hash generation encryption failed', 'ERROR', [
                'openssl_error' => openssl_error_string()
            ]);
            throw new Exception('Hash key şifreleme hatası');
        }

        $msg_encrypted_bundle = "$iv:$salt:$encrypted";
        $msg_encrypted_bundle = str_replace('/', '__', $msg_encrypted_bundle);

        securityLog('Hash generation completed', 'INFO', [
            'original_bundle_length' => strlen("$iv:$salt:$encrypted"),
            'final_bundle_length' => strlen($msg_encrypted_bundle),
            'final_bundle_preview' => substr($msg_encrypted_bundle, 0, 50) . '...'
        ]);

        return $msg_encrypted_bundle;
    }

    /**
     * SiPay Resmi Hash Key Doğrulama Algoritması
     * 3D return ve webhook doğrulaması için
     */
    function validateHashKey($hashKey, $secretKey) {
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            $hashKey = str_replace('__', '/', $hashKey);
            $password = sha1($secretKey);

            $components = explode(':', $hashKey);
            if (count($components) > 2) {
                $iv = $components[0] ?? "";
                $salt = $components[1] ?? "";
                $salt = hash('sha256', $password . $salt);
                $encryptedMsg = $components[2] ?? "";

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, 0, $iv);

                if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
                    $array = explode('|', $decryptedMsg);
                    $status = $array[0] ?? 0;
                    $total = $array[1] ?? 0;
                    $invoiceId = $array[2] ?? '0';
                    $orderId = $array[3] ?? 0;
                    $currencyCode = $array[4] ?? '';
                }
            }
        }

        return [$status, $total, $invoiceId, $orderId, $currencyCode];
    }

    /**
     * 2D (Non-Secure) Ödeme İşlemi
     * Hızlı ödeme - Direkt kart işlemi
     */
    function process2DPayment($paymentData, $token, $config) {
        // Items'i doğru formatta hazırla - Sipay ARRAY bekliyor!
        if (is_string($paymentData['items'])) {
            // Eğer string ise array'e çevir
            $paymentData['items'] = json_decode($paymentData['items'], true) ?: [];
        }
        
        // Items'in array olduğundan emin ol
        if (!is_array($paymentData['items'])) {
            $paymentData['items'] = [];
        }

        $paymentData['ip'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // Debug: Ödeme verilerini logla (hassas bilgiler hariç)
        securityLog('2D Payment data prepared', 'INFO', [
            'invoice_id' => $paymentData['invoice_id'],
            'total' => $paymentData['total'],
            'currency_code' => $paymentData['currency_code'],
            'installments_number' => $paymentData['installments_number'],
            'has_hash_key' => !empty($paymentData['hash_key']),
            'hash_key_length' => strlen($paymentData['hash_key']),
            'ip' => $paymentData['ip'],
            'items_format' => is_string($paymentData['items']) ? 'JSON_STRING' : 'ARRAY'
        ]);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['payment_2d_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($paymentData), // JSON olarak gönder
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json', // JSON content type
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Debug: Response'u logla
        securityLog('2D Payment API response', 'INFO', [
            'http_code' => $httpCode,
            'has_curl_error' => !empty($error),
            'curl_error' => $error,
            'response_length' => strlen($response),
            'response_preview' => substr($response, 0, 200)
        ]);

        if ($error) {
            securityLog('2D Payment cURL error', 'ERROR', [
                'error' => $error,
                'url' => $config['payment_2d_url'],
                'invoice_id' => $paymentData['invoice_id']
            ]);
            throw new Exception('2D Ödeme cURL hatası: ' . $error);
        }

        if ($httpCode !== 200) {
            securityLog('2D Payment HTTP error', 'ERROR', [
                'http_code' => $httpCode,
                'response' => $response,
                'invoice_id' => $paymentData['invoice_id']
            ]);
        }

        $responseData = json_decode($response, true);
        
        // JSON decode hatası kontrolü
        if (json_last_error() !== JSON_ERROR_NONE) {
            securityLog('2D Payment JSON decode error', 'ERROR', [
                'json_error' => json_last_error_msg(),
                'raw_response' => substr($response, 0, 500),
                'invoice_id' => $paymentData['invoice_id']
            ]);
        }
        
        // Detaylı response analizi
        securityLog('2D Payment detailed response', 'INFO', [
            'response_data' => $responseData,
            'invoice_id' => $paymentData['invoice_id'],
            'status_code' => $responseData['status_code'] ?? 'not_set',
            'sipay_status' => $responseData['data']['sipay_status'] ?? $responseData['sipay_status'] ?? 'not_set',
            'message' => $responseData['message'] ?? $responseData['data']['message'] ?? 'no_message'
        ]);
        
        // Sipay response format kontrolü
        // status_code: 100 = başarılı, sipay_status: 1 = başarılı
        $isSuccess = ($httpCode === 200 && $responseData && (
            (isset($responseData['status_code']) && $responseData['status_code'] == 100) ||
            (isset($responseData['data']['sipay_status']) && $responseData['data']['sipay_status'] == 1) ||
            (isset($responseData['sipay_status']) && $responseData['sipay_status'] == 1)
        ));
        
        // Başarısızlık durumunu detaylı logla
        if (!$isSuccess) {
            securityLog('2D Payment failed', 'ERROR', [
                'http_code' => $httpCode,
                'status_code' => $responseData['status_code'] ?? 'not_set',
                'sipay_status' => $responseData['data']['sipay_status'] ?? $responseData['sipay_status'] ?? 'not_set',
                'error_message' => $responseData['message'] ?? $responseData['data']['message'] ?? 'no_message',
                'full_response' => $responseData,
                'invoice_id' => $paymentData['invoice_id']
            ]);
        }
        
        return [
            'success' => $isSuccess,
            'http_code' => $httpCode,
            'payment_type' => '2D',
            'hash_key' => $paymentData['hash_key'],
            'response' => $responseData,
            'raw_response' => $response
        ];
    }

    /**
     * 3D (Secure) Ödeme İşlemi - SiPay API'ye Request
     * SiPay API'sinden 3D form HTML'i alır ve döndürür
     */
    function process3DPayment($paymentData, $token, $config) {
        // Items'i doğru formatta hazırla
        if (is_string($paymentData['items'])) {
            $paymentData['items'] = json_decode($paymentData['items'], true) ?: [];
        }
        
        if (!is_array($paymentData['items'])) {
            $paymentData['items'] = [];
        }

        // 3D ödeme için IP ekle
        $paymentData['ip'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        
        // 3D ödeme için müşteri bilgilerini session'da sakla
        if (!session_id()) {
            session_start();
        }
        
        $sessionData = [
            'name' => $paymentData['name'] ?? '',
            'surname' => $paymentData['surname'] ?? '',
            'bill_email' => $paymentData['bill_email'] ?? '',
            'bill_phone' => $paymentData['bill_phone'] ?? '',
            'bill_address1' => $paymentData['bill_address1'] ?? '',
            'bill_address2' => $paymentData['bill_address2'] ?? '',
            'bill_city' => $paymentData['bill_city'] ?? '',
            'bill_state' => $paymentData['bill_state'] ?? '',
            'bill_country' => $paymentData['bill_country'] ?? '',
            'total' => $paymentData['total']
        ];
        
        $_SESSION['payment_' . $paymentData['invoice_id']] = $sessionData;
        
        securityLog('Customer data stored in session for 3D payment', 'INFO', [
            'invoice_id' => $paymentData['invoice_id'],
            'session_key' => 'payment_' . $paymentData['invoice_id'],
            'stored_data' => $sessionData,
            'input_data' => [
                'name' => $paymentData['name'] ?? 'MISSING',
                'surname' => $paymentData['surname'] ?? 'MISSING',
                'bill_email' => $paymentData['bill_email'] ?? 'MISSING',
                'bill_phone' => $paymentData['bill_phone'] ?? 'MISSING',
                'bill_address1' => $paymentData['bill_address1'] ?? 'MISSING'
            ]
        ]);

        // Debug: 3D ödeme verilerini logla
        securityLog('3D Payment data prepared', 'INFO', [
            'invoice_id' => $paymentData['invoice_id'],
            'total' => $paymentData['total'],
            'currency_code' => $paymentData['currency_code'],
            'installments_number' => $paymentData['installments_number'],
            'has_hash_key' => !empty($paymentData['hash_key']),
            'ip' => $paymentData['ip'],
            'payment_3d_url' => $config['payment_3d_url']
        ]);

        // SiPay 3D API'sine request at
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['payment_3d_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($paymentData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
                'Accept: application/json',
                'User-Agent: CalFormat-SiPay/1.0'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Debug: Response'u logla
        securityLog('3D Payment API response', 'INFO', [
            'http_code' => $httpCode,
            'has_curl_error' => !empty($error),
            'curl_error' => $error,
            'response_length' => strlen($response),
            'response_preview' => substr($response, 0, 500)
        ]);

        if ($error) {
            throw new Exception('3D Ödeme cURL hatası: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('3D Ödeme HTTP hatası: ' . $httpCode . ' - ' . $response);
        }

        $responseData = json_decode($response, true);
        
        // Eğer JSON decode başarısızsa, response HTML olabilir (3D form)
        if (!$responseData && $response) {
            // Direkt HTML response gelmiş (3D form)
            return [
                'success' => true,
                'payment_type' => '3D',
                'form_html' => $response,
                'redirect_needed' => true,
                'hash_key' => $paymentData['hash_key'],
                'invoice_id' => $paymentData['invoice_id']
            ];
        }

        // JSON response gelmiş
        if ($responseData) {
            securityLog('3D Payment JSON response', 'INFO', [
                'status_code' => $responseData['status_code'] ?? 'not_set',
                'sipay_status' => $responseData['data']['sipay_status'] ?? $responseData['sipay_status'] ?? 'not_set',
                'message' => $responseData['message'] ?? 'no_message',
                'has_redirect_url' => isset($responseData['data']['redirect_url']) || isset($responseData['redirect_url']),
                'full_response' => $responseData
            ]);

            // Başarılı 3D response kontrolü
            $isSuccess = ($httpCode === 200 && (
                (isset($responseData['status_code']) && $responseData['status_code'] == 100) ||
                (isset($responseData['data']['sipay_status']) && $responseData['data']['sipay_status'] == 1) ||
                (isset($responseData['sipay_status']) && $responseData['sipay_status'] == 1)
            ));

            if ($isSuccess) {
                // 3D redirect URL'i varsa kullan
                $redirectUrl = $responseData['data']['redirect_url'] ?? $responseData['redirect_url'] ?? null;
                
                if ($redirectUrl) {
                    // Redirect URL ile HTML oluştur
                    $html = generate3DRedirectHtml($redirectUrl, $paymentData);
                    return [
                        'success' => true,
                        'payment_type' => '3D',
                        'form_html' => $html,
                        'redirect_needed' => true,
                        'redirect_url' => $redirectUrl,
                        'hash_key' => $paymentData['hash_key'],
                        'invoice_id' => $paymentData['invoice_id']
                    ];
                }
            }
        }

        // Başarısız 3D response
        throw new Exception('3D Ödeme başarısız: ' . ($responseData['message'] ?? $response));
    }

    /**
     * 3D Redirect HTML Oluşturucu
     * SiPay'den gelen redirect URL'e yönlendirir
     */
    function generate3DRedirectHtml($redirectUrl, $paymentData) {
        $html = '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Güvenli Ödeme - CalFormat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #333;
        }
        .payment-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #4f46e5;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            width: 0%;
            animation: progress 2s ease-in-out;
        }
        .security-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #166534;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="logo">🛡️</div>
        <h1 class="title">3D Güvenli Ödeme</h1>
        <p class="subtitle">Bankanızın güvenli ödeme sayfasına yönlendiriliyorsunuz...</p>
        
        <div class="spinner"></div>
        
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        
        <div class="security-info">
            <strong>🔒 Güvenli Ödeme</strong><br>
            Bu işlem 256-bit SSL şifreleme ile korunmaktadır<br>
            <small>Sipariş No: ' . htmlspecialchars($paymentData['invoice_id']) . '</small>
        </div>
    </div>

    <script>
        // 2 saniye sonra redirect et
        setTimeout(function() {
            window.location.href = "' . htmlspecialchars($redirectUrl) . '";
        }, 2000);
        
        // Backup - 3 saniye sonra kesin redirect
        setTimeout(function() {
            if (window.location.href.indexOf("' . parse_url($redirectUrl, PHP_URL_HOST) . '") === -1) {
                window.location.href = "' . htmlspecialchars($redirectUrl) . '";
            }
        }, 3000);
    </script>
</body>
</html>';

        return $html;
    }

    /**
     * 3D Ödeme HTML Form Oluşturucu (Eski Yöntem - Fallback)
     * Otomatik submit ile banka sayfasına yönlendirme
     */
    function generate3DPaymentForm($paymentData, $config, $token) {
        $formFields = '';
        
        // Tüm ödeme verilerini hidden input olarak ekle
        foreach ($paymentData as $key => $value) {
            if ($key === 'items' && is_array($value)) {
                // Items array'ini JSON string'e çevir (sadece form için)
                $value = json_encode($value);
            } elseif (is_array($value)) {
                $value = json_encode($value);
            }
            $formFields .= '<input type="hidden" name="' . htmlspecialchars($key) . '" value="' . htmlspecialchars($value) . '">' . "\n";
        }

        $html = '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Güvenli Ödeme - CalFormat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #333;
        }
        .payment-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #4f46e5;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            width: 0%;
            animation: progress 3s ease-in-out;
        }
        .security-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #166534;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="logo">🛡️</div>
        <h1 class="title">3D Güvenli Ödeme</h1>
        <p class="subtitle">Bankanızın güvenli ödeme sayfasına yönlendiriliyorsunuz...</p>
        
        <div class="spinner"></div>
        
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        
        <div class="security-info">
            <strong>🔒 Güvenli Ödeme</strong><br>
            Bu işlem 256-bit SSL şifreleme ile korunmaktadır
        </div>
        
        <form id="sipay3DForm" method="POST" action="' . $config['payment_3d_url'] . '">
            ' . $formFields . '
            <input type="hidden" name="Authorization" value="Bearer ' . htmlspecialchars($token) . '">
        </form>
    </div>

    <script>
        // Progress animation tamamlandıktan sonra formu gönder
        setTimeout(function() {
            document.getElementById("sipay3DForm").submit();
        }, 3000);
        
        // Backup - 5 saniye sonra kesin gönder
        setTimeout(function() {
            if (document.getElementById("sipay3DForm")) {
                document.getElementById("sipay3DForm").submit();
            }
        }, 5000);
    </script>
</body>
</html>';

        return $html;
    }

    /**
     * Items array'ini doğrula ve total ile eşleştir
     * Sipay API'si items toplamı ile invoice total'in eşit olmasını bekliyor
     */
    function validateAndFixItems($itemsArray, $total, $input) {
        // Eğer items boşsa default item oluştur
        if (empty($itemsArray)) {
            return [
                [
                    'name' => $input['invoice_description'] ?? 'CalFormat Ürün',
                    'price' => number_format($total, 4, '.', ''),
                    'quantity' => 1,
                    'description' => $input['invoice_description'] ?? 'CalFormat sipariş'
                ]
            ];
        }
        
        // Mevcut items'lerin toplam fiyatını hesapla
        $itemsTotal = 0;
        $processedItems = [];
        
        foreach ($itemsArray as $item) {
            $price = floatval($item['price'] ?? 0);
            $quantity = intval($item['quantity'] ?? 1);
            $itemTotal = $price * $quantity;
            $itemsTotal += $itemTotal;
            
            $processedItems[] = [
                'name' => $item['name'] ?? 'Ürün',
                'price' => number_format($price, 4, '.', ''),
                'quantity' => $quantity,
                'description' => $item['description'] ?? ($item['name'] ?? 'Ürün')
            ];
        }
        
        // Eğer toplam fiyat farklıysa düzelt
        if (abs($itemsTotal - $total) > 0.001) { // 0.001 toleransı
            // Farkı hesapla
            $difference = $total - $itemsTotal;
            
            // Eğer tek item varsa, fiyatını düzelt
            if (count($processedItems) === 1) {
                $processedItems[0]['price'] = number_format($total, 4, '.', '');
            } else {
                // Çoklu item varsa, fark için ayrı item ekle
                if (abs($difference) > 0.001) {
                    $processedItems[] = [
                        'name' => $difference > 0 ? 'Kargo/Ek Ücret' : 'İndirim',
                        'price' => number_format($difference, 4, '.', ''),
                        'quantity' => 1,
                        'description' => $difference > 0 ? 'Kargo ve ek ücretler' : 'İndirim uygulaması'
                    ];
                }
            }
        }
        
        return $processedItems;
    }

    /**
     * İstek işleyici - Ana endpoint router
     */
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    
    if ($requestMethod === 'GET') {
        // API bilgi endpoint'i
        echo json_encode([
            'success' => true,
            'service' => 'CalFormat SiPay Payment Gateway',
            'version' => '2.0',
            'supported_payment_types' => ['2D', '3D'],
            'endpoints' => [
                'payment' => 'POST /sipay_payment.php',
                'token_info' => 'GET /sipay_payment.php',
                'webhook' => 'POST /sipay_webhook.php',
                '3d_return' => 'POST /sipay_3d_return.php'
            ],
            'payment_methods' => [
                '2D' => [
                    'name' => 'Hızlı Ödeme',
                    'description' => 'Direkt kart işlemi - Anında sonuç',
                    'security' => 'Standard'
                ],
                '3D' => [
                    'name' => 'Güvenli Ödeme', 
                    'description' => 'SMS doğrulama ile bankadan onay',
                    'security' => '3D Secure'
                ]
            ],
            'features' => [
                'hash_validation' => 'AES-256-CBC şifreleme',
                'token_cache' => '2 saat geçerlilik',
                'webhook_support' => true,
                'installment_support' => true,
                'multi_currency' => ['TRY', 'USD', 'EUR']
            ],
            'test_cards' => [
                'visa' => '4111111111111111',
                'mastercard' => '5555555555554444',
                'note' => 'Test kartları için CVV: 123, Tarih: 12/25'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } elseif ($requestMethod === 'POST') {
        // Ödeme işlemi
        $input = getSecureJSONInput();
        
        if (!$input) {
            throw new Exception('Geçersiz JSON verisi');
        }

        securityLog('SiPay payment request', 'INFO', [
            'payment_type' => $input['payment_type'] ?? 'unknown',
            'total' => $input['total'] ?? 0,
            'invoice_id' => $input['invoice_id'] ?? '',
            'merchant_key' => substr($sipayConfig['merchant_key'], 0, 10) . '...' // Güvenlik için sadece ilk 10 karakter
        ]);

        // Token al
        $tokenData = getSipayToken($sipayConfig);
        if (!$tokenData['token']) {
            throw new Exception('SiPay token alınamadı');
        }

        securityLog('SiPay token obtained', 'INFO', [
            'token_length' => strlen($tokenData['token']),
            'is_3d' => $tokenData['is_3d'],
            'expires_at' => $tokenData['expires_at']
        ]);

        // Ödeme tipini belirle
        $paymentType = strtoupper($input['payment_type'] ?? '2D');
        
        // Ödeme verilerini hazırla - Sipay dokümantasyonuna göre
        $items = $input['items'] ?? [];
        
        // Items'i array olarak hazırla (JSON string değil!)
        if (is_string($items)) {
            $items = json_decode($items, true) ?: [];
        }
        
        $itemsArray = is_array($items) ? $items : [];
        $total = floatval($input['total'] ?? 0);
        
        // Items'i Sipay formatına göre hazırla ve total ile eşleştir
        $itemsForSipay = validateAndFixItems($itemsArray, $total, $input);
        
        $paymentData = [
            // Temel kart bilgileri (zorunlu)
            'cc_holder_name' => $input['cc_holder_name'] ?? '',
            'cc_no' => $input['cc_no'] ?? '',
            'expiry_month' => $input['expiry_month'] ?? '',
            'expiry_year' => $input['expiry_year'] ?? '',
            'cvv' => $input['cvv'] ?? '',
            
            // Ödeme bilgileri (zorunlu)
            'currency_code' => $input['currency_code'] ?? 'TRY',
            'installments_number' => intval($input['installments_number'] ?? 1),
            'invoice_id' => $input['invoice_id'] ?? 'CF-' . time() . '-' . rand(1000, 9999),
            'invoice_description' => $input['invoice_description'] ?? 'CalFormat Sipariş Ödemesi',
            'name' => $input['name'] ?? '',
            'surname' => $input['surname'] ?? '',
            'total' => $total,
            'merchant_key' => $sipayConfig['merchant_key'],
            
            // Items ARRAY olarak gönder (JSON string değil!)
            'items' => $itemsForSipay,
            
            // URL'ler (zorunlu)
            'cancel_url' => $input['cancel_url'] ?? 'https://calformat.com.tr/sipay_3d_return.php',
            'return_url' => $input['return_url'] ?? 'https://calformat.com.tr/sipay_3d_return.php',
            
            // Fatura bilgileri 
            'bill_address1' => $input['bill_address1'] ?? '',
            'bill_address2' => $input['bill_address2'] ?? '',
            'bill_city' => $input['bill_city'] ?? '',
            'bill_state' => $input['bill_state'] ?? '',
            'bill_postcode' => $input['bill_postcode'] ?? '',
            'bill_country' => $input['bill_country'] ?? 'TR',
            'bill_email' => $input['bill_email'] ?? 'customer@calformat.com.tr',
            'bill_phone' => $input['bill_phone'] ?? '',
            
            // İsteğe bağlı parametreler
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            'card_program' => $input['card_program'] ?? '',
            'transaction_type' => $input['transaction_type'] ?? 'Auth',
            'sale_web_hook_key' => $input['sale_web_hook_key'] ?? '',
            
            // Komisyon parametreleri (isteğe bağlı)
            'is_commission_from_user' => $input['is_commission_from_user'] ?? '',
            'commission_by' => $input['commission_by'] ?? '',
            
            // Yinelenen ödeme parametreleri (isteğe bağlı)
            'order_type' => $input['order_type'] ?? '',
            'recurring_payment_number' => $input['recurring_payment_number'] ?? '',
            'recurring_payment_cycle' => $input['recurring_payment_cycle'] ?? '',
            'recurring_payment_interval' => $input['recurring_payment_interval'] ?? '',
            'recurring_web_hook_key' => $input['recurring_web_hook_key'] ?? '',
            
            // Tarım kartları için (isteğe bağlı)
            'maturity_period' => $input['maturity_period'] ?? '',
            'payment_frequency' => $input['payment_frequency'] ?? '',
            
            // Sigorta ödemeleri için (isteğe bağlı)
            'vpos_type' => $input['vpos_type'] ?? '',
            'identity_number' => $input['identity_number'] ?? ''
        ];

        // Ödeme tipine göre işlem
        if ($paymentType === '3D') {
            // 3D ödemeler için ek parametreler
            $paymentData['response_method'] = 'POST';
            $paymentData['payment_completed_by'] = $input['payment_completed_by'] ?? 'app';
            
            // Hash key oluştur (3D için zorunlu)
            $paymentData['hash_key'] = generateHashKey(
                $paymentData['total'],
                $paymentData['installments_number'],
                $paymentData['currency_code'],
                $paymentData['merchant_key'],
                $paymentData['invoice_id'],
                $sipayConfig['app_secret']
            );
            
            $result = process3DPayment($paymentData, $tokenData['token'], $sipayConfig);
            
            // 3D ödeme için HTML döndür
            if ($result['success'] && isset($result['form_html'])) {
                header('Content-Type: text/html; charset=utf-8');
                echo $result['form_html'];
                exit();
            }
        } else {
            // 2D ödemeler için hash key oluştur (zorunlu)
            $paymentData['hash_key'] = generateHashKey(
                $paymentData['total'],
                $paymentData['installments_number'],
                $paymentData['currency_code'],
                $paymentData['merchant_key'],
                $paymentData['invoice_id'],
                $sipayConfig['app_secret']
            );
            
            $result = process2DPayment($paymentData, $tokenData['token'], $sipayConfig);
            
            // 2D ödeme başarılıysa İkas'ta sipariş oluştur
            if ($result['success'] && $paymentType === '2D') {
                try {
                    // Payment verilerini sipariş için hazırla
                    $orderDataForIkas = array_merge($paymentData, [
                        'payment_type' => '2D'
                    ]);
                    
                    securityLog('2D Payment success - Order data being sent to Ikas', 'INFO', [
                        'invoice_id' => $paymentData['invoice_id'],
                        'full_payment_data' => $paymentData,
                        'order_data_for_ikas' => $orderDataForIkas
                    ]);
                    
                    $orderCreateResult = createIkasOrderFromPayment($orderDataForIkas, $config);
                    securityLog('2D Payment successful - Ikas order creation attempted', 'INFO', [
                        'invoice_id' => $paymentData['invoice_id'],
                        'order_creation_success' => $orderCreateResult['success'] ?? false,
                        'order_id' => $orderCreateResult['order_id'] ?? null
                    ]);
                    
                    // Sipariş oluşturma sonucunu result'a ekle
                    $result['order_creation'] = $orderCreateResult;
                } catch (Exception $e) {
                    securityLog('2D Payment successful but Ikas order creation failed', 'ERROR', [
                        'invoice_id' => $paymentData['invoice_id'],
                        'error' => $e->getMessage()
                    ]);
                    
                    $result['order_creation'] = [
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }
        }

        // Sonucu döndür
        echo json_encode([
            'success' => $result['success'],
            'payment_type' => $paymentType,
            'data' => $result['response'] ?? $result,
            'invoice_id' => $paymentData['invoice_id'],
            'token_info' => [
                'is_3d_enabled' => $tokenData['is_3d'],
                'expires_at' => $tokenData['expires_at']
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // Desteklenmeyen HTTP metodu
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ]);
    }
    
} catch (Exception $e) {
    error_log('SiPay API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => 'SIPAY_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
