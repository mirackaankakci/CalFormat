<?php
// Güvenlik Yapılandırması
// Bu dosya web erişiminden korunmalıdır (.htaccess ile)

// Güvenlik sabitini tanımla
define('SECURITY_LAYER_ACTIVE', true);

// Environment değişkenlerini yükle
function loadEnvironmentVariables() {
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue; // Yorum satırları
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '"\'');
        }
    }
}

// Config'i güvenli şekilde yükle
function getSecureConfig() {
    // Environment'ı yükle
    loadEnvironmentVariables();
    
    return [
        'sipay' => [
            'app_id' => $_ENV['SIPAY_APP_ID'] ?? '6d4a7e9374a76c15260fcc75e315b0b9',
            'app_secret' => $_ENV['SIPAY_APP_SECRET'] ?? 'b46a67571aa1e7ef5641dc3fa6f1712a',
            'merchant_key' => $_ENV['SIPAY_MERCHANT_KEY'] ?? 'test_merchant_key',
            'base_url' => 'https://provisioning.sipay.com.tr/ccpayment',
            'test_mode' => filter_var($_ENV['SIPAY_TEST_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
            'hash_secret' => $_ENV['SIPAY_HASH_SECRET'] ?? 'default_hash_secret_change_in_production',
        ],
        
        'ikas' => [
            'client_id' => $_ENV['IKAS_CLIENT_ID'] ?? '9ca242da-2ce0-44b5-8b3f-4d31e6a94958',
            'client_secret' => $_ENV['IKAS_CLIENT_SECRET'] ?? 's_TBvX9kDl7N8FPXlSHp1L3dHFbd1c286fbfb440aa9796a8b851994b32',
            'store_id' => $_ENV['IKAS_STORE_ID'] ?? 'calformat',
            'base_url' => $_ENV['IKAS_BASE_URL'] ?? 'https://calformat.myikas.com/api',
            'api_token' => $_ENV['IKAS_API_TOKEN'] ?? null,
            'test_mode' => filter_var($_ENV['IKAS_TEST_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
        ],
        
        'security' => [
            'allowed_origins' => [
                'https://calformat.com',
                'https://www.calformat.com',
                'https://calformat.vercel.app',
                'https://mirackaankakci.github.io',
                'http://localhost:3000',
                'http://localhost:5173'
            ],
            'rate_limit' => [
                'max_requests' => 200,
                'time_window' => 60
            ],
            'max_request_size' => 2048576, // 2MB
            'hash_algorithm' => 'sha256',
            'encryption_key' => $_ENV['ENCRYPTION_KEY'] ?? 'CalFormat2024SecureKey!@#$',
            'debug_mode' => filter_var($_ENV['DEBUG_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
            'log_level' => $_ENV['LOG_LEVEL'] ?? 'ERROR'
        ]
                'http://localhost:5173',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173'
            ],
            'rate_limit' => [
                'requests_per_minute' => 60,
                'requests_per_hour' => 1000,
                'burst_limit' => 10
            ],
            'hash_algorithm' => 'sha256',
            'encryption_key' => $_ENV['ENCRYPTION_KEY'] ?? 'default_key_change_in_production_32chars',
            'session_timeout' => 3600,
            'max_request_size' => 1024 * 1024, // 1MB
            'blocked_ips' => [],
            'trusted_proxies' => [
                '127.0.0.1',
                '::1'
            ]
        ],
        
        'frontend_url' => $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173/checkout',
        
        'general' => [
            'currency' => 'TRY',
            'default_shipping_cost' => 29.90,
            'free_shipping_threshold' => 150.00,
            'timezone' => 'Europe/Istanbul',
            'debug_mode' => filter_var($_ENV['DEBUG_MODE'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
            'log_level' => $_ENV['LOG_LEVEL'] ?? 'ERROR'
        ]
    ];
}

// Güvenlik header'larını ayarla
function setSecurityHeaders($config) {
    // CORS güvenlik
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = $config['security']['allowed_origins'];
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif ($config['general']['debug_mode']) {
        header('Access-Control-Allow-Origin: *'); // Sadece development
    } else {
        header('Access-Control-Allow-Origin: null');
    }
    
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    
    // Güvenlik headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    if (!$config['general']['debug_mode']) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
    
    // CSP - SiPay için özelleştirilmiş
    $csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://provisioning.sipay.com.tr",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://provisioning.sipay.com.tr https://*.myikas.com",
        "form-action 'self' https://provisioning.sipay.com.tr",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'"
    ];
    
    header('Content-Security-Policy: ' . implode('; ', $csp));
    
    // Content type
    header('Content-Type: application/json; charset=utf-8');
}

// Rate limiting kontrolü
function checkRateLimit($config, $identifier = null) {
    $identifier = $identifier ?: getClientIP();
    $limits = $config['security']['rate_limit'];
    
    $minute_file = sys_get_temp_dir() . '/rate_limit_minute_' . md5($identifier);
    $hour_file = sys_get_temp_dir() . '/rate_limit_hour_' . md5($identifier);
    
    $current_time = time();
    $minute_start = $current_time - ($current_time % 60);
    $hour_start = $current_time - ($current_time % 3600);
    
    // Dakika kontrolü
    $minute_data = ['start' => $minute_start, 'count' => 0];
    if (file_exists($minute_file)) {
        $stored = json_decode(file_get_contents($minute_file), true);
        if ($stored['start'] === $minute_start) {
            $minute_data = $stored;
        }
    }
    
    // Saat kontrolü
    $hour_data = ['start' => $hour_start, 'count' => 0];
    if (file_exists($hour_file)) {
        $stored = json_decode(file_get_contents($hour_file), true);
        if ($stored['start'] === $hour_start) {
            $hour_data = $stored;
        }
    }
    
    // Limit kontrolleri
    if ($minute_data['count'] >= $limits['requests_per_minute']) {
        return false;
    }
    
    if ($hour_data['count'] >= $limits['requests_per_hour']) {
        return false;
    }
    
    // Sayaçları artır
    $minute_data['count']++;
    $hour_data['count']++;
    
    file_put_contents($minute_file, json_encode($minute_data));
    file_put_contents($hour_file, json_encode($hour_data));
    
    return true;
}

// IP adresini güvenli şekilde al
function getClientIP() {
    $config = getSecureConfig();
    $trustedProxies = $config['security']['trusted_proxies'];
    
    $ipHeaders = [
        'HTTP_CF_CONNECTING_IP',     // Cloudflare
        'HTTP_X_FORWARDED_FOR',      // Standard proxy
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR'
    ];
    
    foreach ($ipHeaders as $header) {
        if (!empty($_SERVER[$header])) {
            $ips = array_map('trim', explode(',', $_SERVER[$header]));
            
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
                
                // Trusted proxy kontrolü
                if (in_array($ip, $trustedProxies)) {
                    continue;
                }
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// Request boyutu kontrolü
function checkRequestSize($config) {
    $maxSize = $config['security']['max_request_size'];
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
    
    return $contentLength <= $maxSize;
}

// Hash doğrulama
function verifySignature($data, $signature, $secret) {
    $calculated = hash_hmac('sha256', $data, $secret);
    return hash_equals($calculated, $signature);
}

// Güvenli logging
function securityLog($message, $level = 'INFO', $context = []) {
    $config = getSecureConfig();
    
    if (!$config['general']['debug_mode'] && $level === 'DEBUG') {
        return;
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $ip = getClientIP();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    $logEntry = [
        'timestamp' => $timestamp,
        'level' => $level,
        'ip' => $ip,
        'user_agent' => substr($userAgent, 0, 200),
        'message' => $message,
        'context' => $context
    ];
    
    $logFile = __DIR__ . '/security.log';
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    
    // Kritik durumlar için sistem log'una da yaz
    if (in_array($level, ['ERROR', 'CRITICAL', 'SECURITY'])) {
        error_log("SECURITY[$level]: $message - IP: $ip");
    }
}

// Input sanitization
function sanitizeInput($input, $type = 'string') {
    switch ($type) {
        case 'email':
            return filter_var($input, FILTER_SANITIZE_EMAIL);
        case 'url':
            return filter_var($input, FILTER_SANITIZE_URL);
        case 'int':
            return filter_var($input, FILTER_SANITIZE_NUMBER_INT);
        case 'float':
            return filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        case 'string':
        default:
            return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
}

// SQL injection korunması için parametreli sorgu yardımcısı
function secureQuery($pdo, $sql, $params = []) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        securityLog('SQL Error: ' . $e->getMessage(), 'ERROR');
        throw new Exception('Database error occurred');
    }
}

// Dosya upload güvenliği
function validateFileUpload($file, $allowedTypes = [], $maxSize = 1048576) {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    if ($file['size'] > $maxSize) {
        return false;
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        return false;
    }
    
    // Dosya adını güvenli hale getir
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = uniqid() . '.' . $extension;
    
    return $safeName;
}

// XSS korunması
function antiXSS($input) {
    return htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// CSRF token oluştur
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// CSRF token doğrula
function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// HTTP Method kontrolü
function validateHttpMethod($allowedMethods = ['GET', 'POST']) {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    return in_array($method, $allowedMethods);
}

// Environment dosyası güvenlik kontrolü
function validateEnvironmentSecurity() {
    $warnings = [];
    
    // .env dosyasının web erişimini kontrol et
    $envPath = __DIR__ . '/.env';
    if (file_exists($envPath)) {
        $envUrl = (isset($_SERVER['HTTPS']) ? 'https://' : 'http://') . 
                  $_SERVER['HTTP_HOST'] . 
                  dirname($_SERVER['REQUEST_URI']) . '/.env';
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 3,
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($envUrl, false, $context);
        if ($response !== false && strlen($response) > 0) {
            $warnings[] = 'CRITICAL: .env file is accessible via web! Check .htaccess rules.';
            securityLog('CRITICAL SECURITY ISSUE: .env file accessible via web', 'CRITICAL', [
                'url' => $envUrl,
                'ip' => getClientIP()
            ]);
        }
    }
    
    // Hardcoded credentials kontrolü
    $sensitiveFiles = [
        'get_token.php',
        'ikas_products.php',
        'ikas_create_order.php'
    ];
    
    foreach ($sensitiveFiles as $file) {
        $filePath = __DIR__ . '/' . $file;
        if (file_exists($filePath)) {
            $content = file_get_contents($filePath);
            if (preg_match('/[\'"](?:client_id|client_secret|app_id|app_secret)[\'\"]\s*=>\s*[\'"][^\'\"]+[\'"]/', $content)) {
                $warnings[] = "WARNING: Hardcoded credentials found in $file";
            }
        }
    }
    
    return $warnings;
}

// Güvenlik başlangıç kontrolü
function initializeSecurity($config) {
    // Environment güvenlik kontrolü
    $securityWarnings = validateEnvironmentSecurity();
    
    if (!empty($securityWarnings)) {
        foreach ($securityWarnings as $warning) {
            securityLog($warning, 'SECURITY', ['ip' => getClientIP()]);
        }
        
        // Production'da kritik hataları logla ve devam et
        if (!$config['general']['debug_mode']) {
            foreach ($securityWarnings as $warning) {
                if (strpos($warning, 'CRITICAL') !== false) {
                    error_log("SECURITY ALERT: $warning");
                }
            }
        }
    }
    
    return $securityWarnings;
}

// IP bloklama kontrolü
function checkIPBlock($config) {
    $clientIP = getClientIP();
    $blockedIPs = $config['security']['blocked_ips'];
    
    if (in_array($clientIP, $blockedIPs)) {
        securityLog('Blocked IP attempted access', 'SECURITY', ['ip' => $clientIP]);
        return false;
    }
    
    return true;
}

// Güvenli environment variable okuma
function getEnvVar($key, $default = null) {
    // Önce $_ENV'den oku
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    
    // Sonra getenv() ile
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    return $default;
}
?>
