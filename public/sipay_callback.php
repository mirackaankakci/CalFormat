<?php
// Güvenli SiPay Callback Endpoint
require_once __DIR__ . '/security.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

try {
    // Konfigürasyonu yükle
    $config = getSecureConfig();
    
    // Güvenlik header'larını ayarla (callback için relaxed)
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Rate limiting kontrolü
    if (!checkRateLimit($config)) {
        securityLog('Rate limit exceeded for callback', 'WARNING', ['ip' => getClientIP()]);
        http_response_code(429);
        exit('Rate limit exceeded');
    }
    
    // HTTP Method kontrolü  
    if (!validateHttpMethod(['GET', 'POST'])) {
        securityLog('Invalid HTTP method for callback', 'WARNING', [
            'method' => $_SERVER['REQUEST_METHOD'],
            'ip' => getClientIP()
        ]);
        http_response_code(405);
        exit('Method Not Allowed');
    }

    securityLog('SiPay callback received', 'INFO', ['ip' => getClientIP()]);

    // Callback verilerini al ve sanitize et
    $sipay_status = sanitizeInput($_GET['sipay_status'] ?? $_POST['sipay_status'] ?? null);
    $order_id = sanitizeInput($_GET['order_id'] ?? $_POST['order_id'] ?? null);
    $invoice_id = sanitizeInput($_GET['invoice_id'] ?? $_POST['invoice_id'] ?? null);
    $payment_status = sanitizeInput($_GET['payment_status'] ?? $_POST['payment_status'] ?? null);

    // Callback verilerini logla
    securityLog('Callback data received', 'INFO', [
        'sipay_status' => $sipay_status,
        'order_id' => $order_id,
        'invoice_id' => $invoice_id,
        'payment_status' => $payment_status,
        'ip' => getClientIP()
    ]);

    // Frontend URL'ini config'den al
    $frontend_url = $config['frontend_url'] ?? 'http://localhost:5173/checkout';

    if ($sipay_status == '1' && $payment_status == '1') {
        // Başarılı ödeme
        $redirect_url = $frontend_url . "?payment=success&order_id=" . urlencode($order_id) . "&invoice_id=" . urlencode($invoice_id);
        securityLog('Payment successful, redirecting', 'INFO', [
            'order_id' => $order_id,
            'invoice_id' => $invoice_id,
            'ip' => getClientIP()
        ]);
    } else {
        // Başarısız ödeme
        $redirect_url = $frontend_url . "?payment=failed&order_id=" . urlencode($order_id) . "&invoice_id=" . urlencode($invoice_id);
        securityLog('Payment failed, redirecting', 'WARNING', [
            'order_id' => $order_id,
            'invoice_id' => $invoice_id,
            'sipay_status' => $sipay_status,
            'payment_status' => $payment_status,
            'ip' => getClientIP()
        ]);
    }

    // Güvenli yönlendirme
    if (filter_var($redirect_url, FILTER_VALIDATE_URL)) {
        header("Location: " . $redirect_url);
        exit();
    } else {
        throw new Exception('Invalid redirect URL');
    }

} catch (Exception $e) {
    securityLog('Callback error: ' . $e->getMessage(), 'ERROR', ['ip' => getClientIP()]);
    http_response_code(500);
    echo 'Callback processing error';
}
?>
