<?php
/**
 * Güvenlik Modülü - CalFormat
 * Modern, güvenli ve kapsamlı güvenlik kontrolleri
 */

// Güvenlik katmanının aktif olduğunu belirt
if (!defined('SECURITY_LAYER_ACTIVE')) {
    define('SECURITY_LAYER_ACTIVE', true);
}

// Dahili erişim kontrolü
if (!defined('INTERNAL_ACCESS')) {
    define('INTERNAL_ACCESS', true);
}

// Hata raporlamayı kapat (production için)
error_reporting(0);
ini_set('display_errors', 0);

// Session güvenliği
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Strict');
    session_start();
}

/**
 * İstemci IP adresini güvenli şekilde al
 */
function getClientIP(): string {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = $_SERVER[$key];
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Rate limiting kontrolü
 */
function checkRateLimit(string $identifier, int $maxRequests = 100, int $timeWindow = 60): bool {
    $key = "rate_limit_" . md5($identifier);
    $current = $_SESSION[$key] ?? ['count' => 0, 'start' => time()];
    
    // Zaman penceresi dolmuşsa sıfırla
    if (time() - $current['start'] > $timeWindow) {
        $current = ['count' => 0, 'start' => time()];
    }
    
    $current['count']++;
    $_SESSION[$key] = $current;
    
    if ($current['count'] > $maxRequests) {
        securityLog("Rate limit exceeded", 'WARNING', [
            'identifier' => $identifier,
            'count' => $current['count'],
            'max' => $maxRequests
        ]);
        return false;
    }
    
    return true;
}

/**
 * CORS başlıklarını ayarla
 */
function setCORSHeaders(): void {
    $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://calformat.com.tr',
        'https://www.calformat.com.tr'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    // Preflight requests için
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Güvenlik başlıklarını ayarla
 */
function setSecurityHeaders(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';');
    
    // HTTPS yönlendirmesi (production için)
    if (!isset($_SERVER['HTTPS']) && !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1'])) {
        $redirectURL = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header("Location: $redirectURL");
        exit;
    }
}

/**
 * Giriş verilerini sanitize et
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    
    if (is_string($input)) {
        // SQL injection koruması
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        
        // Tehlikeli karakterleri kaldır
        $input = preg_replace('/[<>"\'\%\(\);]/', '', $input);
        
        return $input;
    }
    
    return $input;
}

/**
 * JSON girişi güvenli şekilde al ve doğrula
 */
function getSecureJSONInput(): ?array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') === false) {
        return null;
    }
    
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        return null;
    }
    
    // Request size kontrolü
    if (strlen($input) > 1048576) { // 1MB limit
        securityLog('Request size too large', 'WARNING', ['size' => strlen($input)]);
        return null;
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        securityLog('JSON parse error', 'ERROR', ['error' => json_last_error_msg()]);
        return null;
    }
    
    return sanitizeInput($data);
}

/**
 * Güvenlik loglaması
 */
function securityLog(string $message, string $level = 'INFO', array $context = []): void {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $ip = getClientIP();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $requestUri = $_SERVER['REQUEST_URI'] ?? 'unknown';
    
    $logEntry = [
        'timestamp' => $timestamp,
        'level' => $level,
        'message' => $message,
        'ip' => $ip,
        'user_agent' => $userAgent,
        'request_uri' => $requestUri,
        'context' => $context
    ];
    
    $logFile = $logDir . '/security_' . date('Y-m-d') . '.log';
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    
    // Kritik seviye logları için email gönder (isteğe bağlı)
    if ($level === 'CRITICAL') {
        // Mail gönderme kodu buraya eklenebilir
    }
}

/**
 * Hash güvenliği için güçlü hash oluştur
 */
function generateSecureHash(array $data, string $secretKey): string {
    ksort($data); // Parametreleri sırala
    $dataString = '';
    
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $value = json_encode($value);
        }
        $dataString .= $key . '=' . $value . '&';
    }
    
    $dataString = rtrim($dataString, '&');
    
    return hash_hmac('sha256', $dataString, $secretKey);
}

/**
 * Hash doğrulaması
 */
function verifySecureHash(array $data, string $providedHash, string $secretKey): bool {
    $expectedHash = generateSecureHash($data, $secretKey);
    return hash_equals($expectedHash, $providedHash);
}

/**
 * SQL Injection koruması için prepared statement helper
 */
function executeSecureQuery(PDO $pdo, string $query, array $params = []): PDOStatement {
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        securityLog('Database error', 'ERROR', [
            'query' => $query,
            'error' => $e->getMessage()
        ]);
        throw new Exception('Database operation failed');
    }
}

/**
 * Dosya upload güvenliği
 */
function validateFileUpload(array $file): bool {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        return false;
    }
    
    if ($file['size'] > $maxSize) {
        securityLog('File too large', 'WARNING', ['size' => $file['size']]);
        return false;
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        securityLog('Invalid file type', 'WARNING', ['type' => $mimeType]);
        return false;
    }
    
    return true;
}

/**
 * Token oluşturma ve doğrulama
 */
function generateCSRFToken(): string {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCSRFToken(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Başlangıç güvenlik kontrolleri
setCORSHeaders();
setSecurityHeaders();

// Rate limiting kontrolü
$clientIP = getClientIP();
if (!checkRateLimit($clientIP)) {
    http_response_code(429);
    header('Retry-After: 60');
    exit(json_encode(['error' => 'Too many requests']));
}

// Güvenlik loglaması
securityLog('Security module loaded', 'INFO', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri' => $_SERVER['REQUEST_URI'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
]);

?>
