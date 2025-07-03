<?php
// CSP'yi tamamen kaldır
header_remove('Content-Security-Policy');
header_remove('X-Content-Security-Policy');
header_remove('X-WebKit-CSP');
header_remove('X-Frame-Options');
header_remove('Strict-Transport-Security');
header_remove('X-XSS-Protection');
header_remove('X-Content-Type-Options');
header_remove('Referrer-Policy');

// Çok esnek CSP ayarla (eğer kaldırma çalışmazsa)
header('Content-Security-Policy: default-src * data: blob: \'unsafe-inline\' \'unsafe-eval\'; script-src * \'unsafe-inline\' \'unsafe-eval\'; style-src * \'unsafe-inline\'; img-src * data: blob:; connect-src *; form-action *; frame-src *; object-src \'none\';');

header('Content-Type: text/html; charset=utf-8');
header('X-Frame-Options: ALLOWALL');

// Debug logging fonksiyonu
function debug_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] " . (is_array($message) || is_object($message) ? json_encode($message) : $message) . PHP_EOL;
    
    try {
        file_put_contents(__DIR__ . '/sipay_debug.log', $log_message, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        error_log("SiPay Debug: " . $log_message);
    }
}

try {
    debug_log('SiPay form redirect başlatıldı');
    
    // POST verilerini al
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['form_data']) || !isset($input['payment_url'])) {
        throw new Exception('Geçersiz form data');
    }
    
    $form_data = $input['form_data'];
    $payment_url = $input['payment_url'];
    
    debug_log('Form data: ' . json_encode($form_data));
    debug_log('Payment URL: ' . $payment_url);
    
    // HTML form ile SiPay'e yönlendirme
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ödeme İşleniyor...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #ee7f1a, #d62d27);
            color: white;
        }
        .loading { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 20px; 
        }
        .spinner { 
            border: 4px solid #ffffff33; 
            border-radius: 50%; 
            border-top: 4px solid #ffffff; 
            width: 40px; 
            height: 40px; 
            animation: spin 2s linear infinite; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>Ödeme sayfasına yönlendiriliyorsunuz...</h2>
        <p>Lütfen bekleyiniz.</p>
    </div>
    
    <form id="sipay_form" method="POST" action="' . htmlspecialchars($payment_url) . '">';
    
    // Form alanlarını ekle
    foreach ($form_data as $key => $value) {
        $html .= '<input type="hidden" name="' . htmlspecialchars($key) . '" value="' . htmlspecialchars($value) . '">';
    }
    
    $html .= '</form>
    
    <script>
        // 2 saniye sonra formu submit et
        setTimeout(function() {
            document.getElementById("sipay_form").submit();
        }, 2000);
    </script>
</body>
</html>';
    
    echo $html;
    
} catch (Exception $e) {
    debug_log('Form redirect error: ' . $e->getMessage());
    
    echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hata</title>
</head>
<body>
    <h1>Ödeme Hatası</h1>
    <p>Ödeme sayfasına yönlendirme sırasında bir hata oluştu.</p>
    <p>Hata: ' . htmlspecialchars($e->getMessage()) . '</p>
    <a href="/checkout">Geri Dön</a>
</body>
</html>';
}
?>
