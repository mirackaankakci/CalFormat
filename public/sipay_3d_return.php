<?php
/**
 * SiPay 3D Return Handler - Temiz ve Düzenli
 * 3D güvenli ödeme sonrası geri dönüş işleyicisi
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

    // Frontend URL'yi al ve temizle
    $frontendUrl = $config['frontend_url'] ?? 'https://calformat.com';
    $frontendUrl = str_replace(['www.', '@', 'w'], '', $frontendUrl); // Yanlış karakterleri temizle
    $frontendUrl = preg_replace('/^https?:\/\//', '', $frontendUrl); // Protokolü kaldır
    $frontendUrl = 'https://' . $frontendUrl; // Doğru protokolü ekle

    securityLog('3D Return Handler Started', 'INFO', [
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'post_data_exists' => !empty($_POST),
        'get_data_exists' => !empty($_GET),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'frontend_url' => $frontendUrl,
        'config_frontend_url' => $config['frontend_url'] ?? 'not_set',
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    // Eğer hiç POST verisi yoksa, test için basit HTML göster
    if (empty($_POST) && empty($_GET)) {
        echo '<!DOCTYPE html>
<html>
<head>
    <title>3D Return Endpoint Test</title>
    <meta charset="utf-8">
</head>
<body>
    <h2>3D Return Endpoint Active</h2>
    <p>Timestamp: ' . date('Y-m-d H:i:s') . '</p>
    <p>This endpoint is working but no payment data received.</p>
</body>
</html>';
        exit();
    }

    /**
     * İkas Sipariş Oluşturma Fonksiyonu
     */
    function createIkasOrder($orderData, $config) {
        securityLog('Creating Ikas order', 'INFO', [
            'invoice_id' => $orderData['invoice_id'] ?? 'unknown',
            'total' => $orderData['total'] ?? 0
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
                    'response' => $orderResult
                ]);
                
                return [
                    'success' => false,
                    'error' => 'İkas sipariş oluşturulamadı'
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

    /**
     * Hash key doğrulama fonksiyonu
     */
    function validateHashKey($hashKey, $secretKey) {
        if (empty($hashKey) || empty($secretKey)) {
            return false;
        }

        // Hash key'deki __ karakterlerini / ile değiştir
        $hashKey = str_replace('__', '/', $hashKey);
        $password = sha1($secretKey);
        $components = explode(':', $hashKey);
        
        if (count($components) < 3) {
            return false;
        }
        
        $iv = $components[0] ?? "";
        $salt = $components[1] ?? "";
        $salt = hash('sha256', $password . $salt);
        $encryptedMsg = $components[2] ?? "";

        $decryptedMsg = openssl_decrypt($encryptedMsg, 'aes-256-cbc', $salt, 0, $iv);

        if ($decryptedMsg && strpos($decryptedMsg, '|') !== false) {
            $array = explode('|', $decryptedMsg);
            return [
                'status' => (int)($array[0] ?? 0),
                'total' => (float)($array[1] ?? 0),
                'invoice_id' => $array[2] ?? "",
                'order_id' => $array[3] ?? "",
                'currency_code' => $array[4] ?? "TRY"
            ];
        }

        return false;
    }

    // POST verilerini al
    $postData = $_POST;
    $getData = $_GET;
    
    securityLog('3D Return request received', 'INFO', [
        'post_keys' => array_keys($postData),
        'get_keys' => array_keys($getData),
        'sipay_status' => $postData['sipay_status'] ?? 'missing',
        'invoice_id' => $postData['invoice_id'] ?? 'missing'
    ]);

    // Gerekli parametreler kontrolü
    if (!isset($postData['sipay_status']) || !isset($postData['invoice_id'])) {
        throw new Exception("Gerekli parametreler eksik");
    }

    $sipayStatus = $postData['sipay_status'];
    $invoiceId = $postData['invoice_id'];
    $hashKey = $postData['hash_key'] ?? '';
    $orderNo = $postData['order_no'] ?? $invoiceId;

    // Hash key doğrulama
    $validationResult = false;
    if (!empty($hashKey)) {
        $validationResult = validateHashKey($hashKey, $sipayConfig['app_secret']);
    }
    
    // Test modunda hash key olmasa da devam et
    if (!$validationResult && $sipayConfig['test_mode'] && $sipayStatus == '1') {
        $validationResult = [
            'status' => 1,
            'total' => floatval($postData['amount'] ?? 1),
            'invoice_id' => $invoiceId,
            'order_id' => $orderNo,
            'currency_code' => 'TRY'
        ];
        
        securityLog('Using test mode bypass for hash validation', 'WARNING', [
            'sipay_status' => $sipayStatus,
            'invoice_id' => $invoiceId
        ]);
    }
    
    if ($validationResult !== false) {
        $isSuccessful = ($sipayStatus == '1' && $validationResult['status'] == 1);

        if ($isSuccessful) {
            // Ödeme başarılı - İkas sipariş oluştur
            securityLog('Payment successful - creating Ikas order', 'INFO', [
                'invoice_id' => $invoiceId,
                'total' => $validationResult['total']
            ]);
            
            // Müşteri bilgilerini session'dan veya GET parametrelerinden al
            session_start();
            $sessionKey = 'payment_' . $invoiceId;
            $customerData = $_SESSION[$sessionKey] ?? [];
            
            // Session'da yoksa GET parametrelerinden al
            if (empty($customerData)) {
                $customerData = [
                    'name' => $_GET['customer_name'] ?? 'Ödeme',
                    'surname' => $_GET['customer_surname'] ?? 'Müşterisi',
                    'bill_email' => $_GET['customer_email'] ?? 'odeme@calformat.com',
                    'bill_phone' => $_GET['customer_phone'] ?? '05551234567',
                    'bill_address1' => $_GET['customer_address1'] ?? 'Sipariş Adresi',
                    'bill_address2' => $_GET['customer_address2'] ?? '',
                    'bill_city' => $_GET['customer_city'] ?? 'İstanbul',
                    'bill_state' => $_GET['customer_state'] ?? 'İstanbul',
                    'bill_country' => $_GET['customer_country'] ?? 'TR',
                ];
            }
            
            $orderData = [
                'invoice_id' => $invoiceId,
                'total' => $validationResult['total'],
                'name' => $customerData['name'],
                'surname' => $customerData['surname'], 
                'bill_email' => $customerData['bill_email'],
                'bill_phone' => $customerData['bill_phone'],
                'bill_address1' => $customerData['bill_address1'],
                'bill_address2' => $customerData['bill_address2'],
                'bill_city' => $customerData['bill_city'],
                'bill_state' => $customerData['bill_state'],
                'bill_country' => $customerData['bill_country'],
                'payment_type' => '3D'
            ];
            
            // Session'dan veriyi temizle
            unset($_SESSION[$sessionKey]);
            
            // İkas sipariş oluştur
            $ikasOrderResult = createIkasOrder($orderData, $config);
            
            if ($ikasOrderResult['success']) {
                $redirectUrl = $frontendUrl . '/cart?payment_success=1&sipay_status=1&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&ikas_order_id=' . urlencode($ikasOrderResult['order_id']) . '&ikas_order_number=' . urlencode($ikasOrderResult['order_number']);
            } else {
                $redirectUrl = $frontendUrl . '/cart?payment_success=0&sipay_status=1&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=' . urlencode($ikasOrderResult['error']);
            }
            
            securityLog('3D Payment SUCCESS - Redirecting', 'INFO', [
                'redirect_url' => $redirectUrl,
                'invoice_id' => $invoiceId,
                'ikas_order_created' => $ikasOrderResult['success'],
                'frontend_url' => $frontendUrl
            ]);
        } else {
            $redirectUrl = $frontendUrl . '/cart?payment_success=0&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&order_no=' . urlencode($orderNo) . '&error=payment_failed';
            
            securityLog('3D Payment FAILED', 'WARNING', [
                'redirect_url' => $redirectUrl,
                'sipay_status' => $sipayStatus,
                'validation_status' => $validationResult['status']
            ]);
        }
        
        header('Location: ' . $redirectUrl);
        exit();
    } else {
        // Hash key doğrulama başarısız
        securityLog('Hash key validation failed', 'ERROR', [
            'sipay_status' => $sipayStatus,
            'hash_key_provided' => !empty($hashKey),
            'test_mode' => $sipayConfig['test_mode']
        ]);
        
        $redirectUrl = $frontendUrl . '/cart?payment_success=0&sipay_status=0&invoice_id=' . urlencode($invoiceId) . '&error=hash_validation_failed';
        
        header('Location: ' . $redirectUrl);
        exit();
    }

} catch (Exception $e) {
    securityLog('3D Return Critical Error', 'ERROR', [
        'error_message' => $e->getMessage(),
        'post_data' => $_POST ?? [],
        'get_data' => $_GET ?? [],
        'frontend_url' => $frontendUrl ?? 'not_set'
    ]);
    
    $redirectUrl = 'https://calformat.com/cart?payment_success=0&error=system_error';
    
    header('Location: ' . $redirectUrl);
    exit();
}
?>
