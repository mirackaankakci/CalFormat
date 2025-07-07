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
        ],
        
        'general' => [
            'currency' => 'TRY',
            'default_shipping_cost' => 29.90,
            'free_shipping_threshold' => 150.00,
            'timezone' => 'Europe/Istanbul'
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
    } elseif ($config['security']['debug_mode']) {
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
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    if (!$config['security']['debug_mode']) {
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    }
}

// Rate limiting kontrol
function checkRateLimit($config) {
    $clientIP = getClientIP();
    $rateLimit = $config['security']['rate_limit'];
    
    $cacheFile = __DIR__ . "/rate_limit_" . md5($clientIP) . ".tmp";
    $maxRequests = $rateLimit['max_requests'];
    $timeWindow = $rateLimit['time_window'];
    
    $currentTime = time();
    $requestCount = 1;
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data && ($currentTime - $data['start_time']) < $timeWindow) {
            $requestCount = $data['count'] + 1;
            if ($requestCount > $maxRequests) {
                return false;
            }
            $data['count'] = $requestCount;
        } else {
            $data = ['start_time' => $currentTime, 'count' => 1];
        }
    } else {
        $data = ['start_time' => $currentTime, 'count' => 1];
    }
    
    file_put_contents($cacheFile, json_encode($data));
    return true;
}

// Request boyutu kontrol
function checkRequestSize($config) {
    $maxSize = $config['security']['max_request_size'];
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
    return $contentLength <= $maxSize;
}

// HTTP method validation
function validateHttpMethod($allowedMethods) {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    return in_array($method, $allowedMethods);
}

// Input sanitization
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Client IP alma
function getClientIP() {
    $headers = [
        'HTTP_CF_CONNECTING_IP',     // Cloudflare
        'HTTP_X_FORWARDED_FOR',      // Proxy
        'HTTP_X_FORWARDED',          // Proxy
        'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
        'HTTP_FORWARDED_FOR',        // Proxy
        'HTTP_FORWARDED',            // Proxy
        'REMOTE_ADDR'                // Standard
    ];
    
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ips = explode(',', $_SERVER[$header]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// Güvenlik logları
function securityLog($message, $level = 'INFO', $context = []) {
    $config = getSecureConfig();
    $logLevel = $config['security']['log_level'];
    
    $levels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3];
    
    if ($levels[$level] < $levels[$logLevel]) {
        return; // Log seviyesi yeterli değil
    }
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'level' => $level,
        'message' => $message,
        'ip' => getClientIP(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'context' => $context
    ];
    
    $logFile = __DIR__ . '/security.log';
    $logLine = json_encode($logEntry) . "\n";
    
    // Log dosyasının boyutunu sınırla (5MB)
    if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
        rename($logFile, $logFile . '.old');
    }
    
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

// Session güvenlik ayarları
function initSecureSession($config) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Strict');
    
    session_name($_ENV['SESSION_NAME'] ?? 'CALFORMAT_SESSION');
    session_start();
    
    // Session fixation korunması
    if (!isset($_SESSION['initiated'])) {
        session_regenerate_id(true);
        $_SESSION['initiated'] = true;
    }
    
    // Session timeout
    $timeout = $_ENV['SESSION_LIFETIME'] ?? 3600;
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout)) {
        session_unset();
        session_destroy();
        session_start();
    }
    $_SESSION['last_activity'] = time();
}

// Token doğrulama
function validateToken($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    $validSignature = hash_hmac('sha256', $header . '.' . $payload, $secret, true);
    $validSignature = base64url_encode($validSignature);
    
    return hash_equals($signature, $validSignature);
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}
