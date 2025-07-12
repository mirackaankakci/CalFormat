<?php
/**
 * SiPay 3D Return Handler
 * 3D güvenli ödeme sonrası geri dönüş işleyicisi
 * 
 * Bu endpoint 3D ödeme tamamlandıktan sonra SiPay tarafından çağrılır
 * Hash key doğrulaması yaparak güvenli sonuç döndürür
 */

// Güvenlik modülünü yükle
require_once __DIR__ . '/security_new.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Konfigürasyonu yükle
    define('INTERNAL_ACCESS', true);
    $config = require_once __DIR__ . '/config.php';
    $sipayConfig = $config['sipay'];

    /**
     * İkas Sipariş Oluşturma Fonksiyonu
     */
    function createIkasOrder($orderData, $config) {
        securityLog('Creating Ikas order after successful payment - FULL ORDER DATA', 'INFO', [
            'invoice_id' => $orderData['invoice_id'] ?? 'unknown',
            'total' => $orderData['total'] ?? 0,
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
            
            // Basit sipariş payload'ı
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
            
            securityLog('Ikas order creation response', 'INFO', [
                'http_code' => $orderHttpCode,
                'response_length' => strlen($orderResponse),
                'response_preview' => substr($orderResponse, 0, 200)
            ]);
            
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
     * Hash key doğrulama fonksiyonu - Geliştirilmiş debugging ile
     */
    function validateHashKey($hashKey, $secretKey) {
        // Debug için hash validation adımlarını logla
        securityLog('Hash validation debug start', 'INFO', [
            'hash_key_length' => strlen($hashKey ?? ''),
            'secret_key_length' => strlen($secretKey ?? ''),
            'hash_key_preview' => substr($hashKey ?? '', 0, 50) . '...',
            'secret_key_preview' => substr($secretKey ?? '', 0, 10) . '...'
        ]);
        
        $status = $currencyCode = "";
        $total = $invoiceId = $orderId = 0;

        if (!empty($hashKey)) {
            // Hash key'deki __ karakterlerini / ile değiştir
            $originalHashKey = $hashKey;
            $hashKey = str_replace('__', '/', $hashKey);
            
            if ($originalHashKey !== $hashKey) {
                securityLog('Hash key character replacement', 'INFO', [
                    'original_length' => strlen($originalHashKey),
                    'modified_length' => strlen($hashKey),
                    'replacement_count' => substr_count($originalHashKey, '__')
                ]);
            }
            
            $password = sha1($secretKey);
            
            securityLog('Hash validation password generation', 'INFO', [
                'password_length' => strlen($password),
                'password_preview' => substr($password, 0, 10) . '...'
            ]);

            $components = explode(':', $hashKey);
            securityLog('Hash key components analysis', 'INFO', [
                'components_count' => count($components),
                'iv_length' => strlen($components[0] ?? ''),
                'salt_length' => strlen($components[1] ?? ''),
                'encrypted_msg_length' => strlen($components[2] ?? ''),
                'component_0' => $components[0] ?? 'missing',
                'component_1' => $components[1] ?? 'missing',
                'component_2_preview' => substr($components[2] ?? '', 0, 20) . '...'
            ]);
            
            if (count($components) > 2) {
                $iv = $components[0] ?? "";
                $salt = $components[1] ?? "";
                
                securityLog('Hash validation before salt processing', 'INFO', [
                    'original_salt' => $salt,
                    'password_for_salt' => substr($password, 0, 10) . '...'
                ]);
                
                $salt = hash('sha256', $password . $salt);
                $encryptedMsg = $components[2] ?? "";

                securityLog('Hash validation prepared for decryption', 'INFO', [
                    'iv' => $iv,
                    'processed_salt_preview' => substr($salt, 0, 10) . '...',
                    'encrypted_msg_preview' => substr($encryptedMsg, 0, 20) . '...'
                ]);

                $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, 0, $iv);

                securityLog('Hash decryption attempt', 'INFO', [
                    'decryption_success' => $decryptedMsg !== false,
                    'decrypted_length' => strlen($decryptedMsg ?: ''),
                    'contains_delimiter' => $decryptedMsg ? (strpos($decryptedMsg, '|') !== false) : false,
                    'decrypted_content' => $decryptedMsg ?: 'decryption_failed'
                ]);

                if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
                    $array = explode('|', $decryptedMsg);
                    $status = $array[0] ?? 0;
                    $total = $array[1] ?? 0;
                    $invoiceId = $array[2] ?? "";
                    $orderId = $array[3] ?? "";
                    $currencyCode = $array[4] ?? "TRY";

                    securityLog('Hash validation SUCCESS', 'INFO', [
                        'status' => $status,
                        'total' => $total,
                        'invoice_id' => $invoiceId,
                        'order_id' => $orderId,
                        'currency_code' => $currencyCode
                    ]);

                    return [
                        'status' => (int)$status,
                        'total' => (float)$total,
                        'invoice_id' => $invoiceId,
                        'order_id' => $orderId,
                        'currency_code' => $currencyCode
                    ];
                } else {
                    securityLog('Hash validation - decryption failed or wrong format', 'WARNING', [
                        'decrypted_msg' => $decryptedMsg ?: 'null',
                        'has_delimiter' => $decryptedMsg ? (strpos($decryptedMsg, '|') !== false) : false
                    ]);
                }
            } else {
                securityLog('Hash validation - insufficient components', 'WARNING', [
                    'components_count' => count($components),
                    'required_components' => 3
                ]);
            }
        } else {
            securityLog('Hash validation - empty hash key', 'WARNING', [
                'hash_key_provided' => !empty($hashKey)
            ]);
        }

        securityLog('Hash validation FAILED', 'ERROR', [
            'reason' => 'validation_process_failed'
        ]);
        return false;
    }

    // Frontend URL belirleme - config'ten direkt al
    $frontendUrl = $config['frontend_url'];
    
    // Debug için log
    securityLog('Frontend URL determined', 'INFO', [
        'frontend_url' => $frontendUrl,
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown'
    ]);

    // POST verilerini al
    $postData = $_POST;
    $getData = $_GET;
    
    securityLog('3D Return request received', 'INFO', [
        'post_data_keys' => array_keys($postData),
        'post_data' => $postData, // Tam veriyi logla
        'get_data' => $getData, // GET verilerini de logla
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'frontend_url' => $frontendUrl
    ]);

    // Gerekli parametreler var mı kontrol et
    $requiredParams = ['sipay_status', 'invoice_id', 'hash_key'];
    foreach ($requiredParams as $param) {
        if (!isset($postData[$param])) {
            throw new Exception("Required parameter missing: $param");
        }
    }

    $sipayStatus = $postData['sipay_status'];
    $invoiceId = $postData['invoice_id'];
    $hashKey = $postData['hash_key'];
    $orderNo = $postData['order_no'] ?? $invoiceId;

    // Hash key doğrulama
    $validationResult = validateHashKey($hashKey, $sipayConfig['app_secret']);
    
    // Debug için hash key bilgilerini logla
    securityLog('Hash key validation attempt', 'INFO', [
        'hash_key_exists' => !empty($hashKey),
        'secret_key_exists' => !empty($sipayConfig['app_secret']),
        'sipay_status' => $sipayStatus,
        'invoice_id' => $invoiceId,
        'validation_result' => $validationResult !== false ? 'success' : 'failed'
    ]);
    
    if ($validationResult !== false) {
        $transactionData = [
            'status' => $validationResult['status'],
            'total' => $validationResult['total'],
            'invoice_id' => $validationResult['invoice_id'],
            'order_no' => $orderNo,
            'currency_code' => $validationResult['currency_code'] ?? 'TRY'
        ];

        $isSuccessful = ($sipayStatus == '1' && $validationResult['status'] == 1);

        if ($isSuccessful) {
            // Ödeme başarılı - İkas sipariş oluştur
            securityLog('Payment successful - creating Ikas order', 'INFO', [
                'invoice_id' => $transactionData['invoice_id'],
                'total' => $transactionData['total']
            ]);
            
            // Sipariş verilerini hazırla
            // Müşteri bilgilerini session'dan al
            if (!session_id()) {
                session_start();
            }
            
            $sessionKey = 'payment_' . $transactionData['invoice_id'];
            $customerData = $_SESSION[$sessionKey] ?? [];
            
            securityLog('Retrieved customer data from session', 'INFO', [
                'invoice_id' => $transactionData['invoice_id'],
                'session_key' => $sessionKey,
                'has_customer_data' => !empty($customerData),
                'customer_data_keys' => array_keys($customerData)
            ]);
            
            $orderData = [
                'invoice_id' => $transactionData['invoice_id'],
                'total' => $transactionData['total'],
                'name' => $customerData['name'] ?? 'Ödeme',
                'surname' => $customerData['surname'] ?? 'Müşterisi', 
                'bill_email' => $customerData['bill_email'] ?? 'musteri@calformat.com.tr',
                'bill_phone' => $customerData['bill_phone'] ?? '05551234567',
                'bill_address1' => $customerData['bill_address1'] ?? 'Sipariş Adresi',
                'bill_address2' => $customerData['bill_address2'] ?? '',
                'bill_city' => $customerData['bill_city'] ?? 'İstanbul',
                'bill_state' => $customerData['bill_state'] ?? 'Beykoz',
                'bill_country' => $customerData['bill_country'] ?? 'TR',
                'payment_type' => '3D'
            ];
            
            // Session'dan veriyi temizle
            unset($_SESSION[$sessionKey]);
            
            // İkas sipariş oluştur
            $ikasOrderResult = createIkasOrder($orderData, $config);
            
            if ($ikasOrderResult['success']) {
                securityLog('Ikas order created after successful payment', 'SUCCESS', [
                    'ikas_order_id' => $ikasOrderResult['order_id'],
                    'ikas_order_number' => $ikasOrderResult['order_number'],
                    'invoice_id' => $transactionData['invoice_id']
                ]);
                
                $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']) . '&ikas_order_id=' . urlencode($ikasOrderResult['order_id']) . '&ikas_order_number=' . urlencode($ikasOrderResult['order_number']);
            } else {
                securityLog('Ikas order creation failed after successful payment', 'ERROR', [
                    'error' => $ikasOrderResult['error'],
                    'invoice_id' => $transactionData['invoice_id']
                ]);
                
                $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']) . '&ikas_order_error=' . urlencode($ikasOrderResult['error']);
            }
            
            securityLog('3D Payment SUCCESS - Redirecting with order info', 'INFO', [
                'redirect_url' => $redirectUrl,
                'invoice_id' => $transactionData['invoice_id'],
                'sipay_status' => $sipayStatus,
                'ikas_order_created' => $ikasOrderResult['success']
            ]);
        } else {
            $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($transactionData['invoice_id']) . '&order_no=' . urlencode($transactionData['order_no']);
            
            securityLog('3D Payment FAILED - Redirecting', 'WARNING', [
                'redirect_url' => $redirectUrl,
                'invoice_id' => $transactionData['invoice_id'],
                'sipay_status' => $sipayStatus,
                'validation_status' => $validationResult['status']
            ]);
        }
        
        // Direkt yönlendirme - ara ekran yok
        header('Location: ' . $redirectUrl);
        exit();
    } else {
        // Hash key doğrulama başarısız - production modunda sıkı kontrol
        securityLog('Hash key validation failed - PRODUCTION MODE', 'ERROR', [
            'provided_hash' => $hashKey ?? 'missing',
            'secret_key_configured' => !empty($sipayConfig['app_secret']),
            'sipay_status' => $sipayStatus,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'test_mode' => $sipayConfig['test_mode'] ?? 'unknown'
        ]);
        
        // Production modunda hash validation zorunlu
        if (!$sipayConfig['test_mode']) {
            $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=hash_validation_failed_production';
            
            securityLog('Production hash validation failed - payment rejected', 'ERROR', [
                'sipay_status' => $sipayStatus,
                'invoice_id' => $invoiceId,
                'reason' => 'production_mode_hash_validation_required'
            ]);
        } else {
            // Test modunda SiPay status'u başarılıysa hash doğrulama başarısız olsa bile işleme devam et
            if ($sipayStatus == '1') {
                securityLog('Processing payment despite hash validation failure - TEST MODE', 'WARNING', [
                    'sipay_status' => $sipayStatus,
                    'invoice_id' => $invoiceId,
                    'reason' => 'test_mode_sipay_status_successful'
                ]);
                
                // Test modunda da sipariş oluştur
                // Test modunda da session'dan müşteri bilgilerini al
                if (!session_id()) {
                    session_start();
                }
                
                $sessionKey = 'payment_' . $invoiceId;
                $customerData = $_SESSION[$sessionKey] ?? [];
                
                $orderData = [
                    'invoice_id' => $invoiceId,
                    'total' => $_POST['total'] ?? 100,
                    'name' => $customerData['name'] ?? 'Test',
                    'surname' => $customerData['surname'] ?? 'Müşteri',
                    'bill_email' => $customerData['bill_email'] ?? 'test@calformat.com.tr',
                    'bill_phone' => $customerData['bill_phone'] ?? '05551234567',
                    'bill_address1' => $customerData['bill_address1'] ?? 'Test Adresi',
                    'bill_address2' => $customerData['bill_address2'] ?? '',
                    'bill_city' => $customerData['bill_city'] ?? 'İstanbul',
                    'bill_state' => $customerData['bill_state'] ?? 'Beykoz',
                    'bill_country' => $customerData['bill_country'] ?? 'TR',
                    'payment_type' => '3D-TEST'
                ];
                
                // Session'dan veriyi temizle
                unset($_SESSION[$sessionKey]);
                
                $ikasOrderResult = createIkasOrder($orderData, $config);
                
                if ($ikasOrderResult['success']) {
                    $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&hash_bypass=1&ikas_order_id=' . urlencode($ikasOrderResult['order_id']) . '&ikas_order_number=' . urlencode($ikasOrderResult['order_number']);
                } else {
                    $redirectUrl = '/payment_success.php?status=success&sipay_status=1&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&hash_bypass=1&ikas_order_error=' . urlencode($ikasOrderResult['error']);
                }
            } else {
                $redirectUrl = '/payment_success.php?status=failed&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=hash_validation_failed';
            }
        }
        
        header('Location: ' . $redirectUrl);
        exit();
    }

} catch (Exception $e) {
    error_log('3D Return Error: ' . $e->getMessage());
    
    // Hata durumunda da yönlendirme yap
    $redirectUrl = '/payment_success.php?status=failed&error=system_error';
    header('Location: ' . $redirectUrl);
    exit();
}
?>
