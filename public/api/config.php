<?php
/**
 * Config API - Frontend'e genel ayarları sağlar
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Güvenlik kontrolü
include_once '../security_new.php';

// Config dosyasını yükle
$config_file = '../config.php';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Config dosyası bulunamadı',
        'message' => 'config.php dosyası mevcut değil'
    ]);
    exit;
}

// Config dosyasına internal access izni ver
define('INTERNAL_ACCESS', true);

// Config değerlerini al
$config = include $config_file;

try {
    // GET: Config bilgilerini getir
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $response = [
            'general' => [
                'currency' => $config['general']['currency'] ?? 'TRY',
                'default_shipping_cost' => (float)($config['general']['default_shipping_cost'] ?? 29.90),
                'free_shipping_threshold' => (float)($config['general']['free_shipping_threshold'] ?? 150.00),
                'timezone' => $config['general']['timezone'] ?? 'Europe/Istanbul',
                'debug_mode' => (bool)($config['general']['debug_mode'] ?? false)
            ]
        ];
        
        echo json_encode($response);
        exit;
    }

    // POST: Config ayarlarını güncelle (admin yetkisi gerekli)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // TODO: Admin authentication kontrolü ekle
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['general'])) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Geçersiz veri',
                'message' => 'Config verileri eksik'
            ]);
            exit;
        }

        // Config dosyasını güncelle
        $new_config = $config;
        
        // Sadece belirtilen alanları güncelle
        if (isset($input['general']['default_shipping_cost'])) {
            $new_config['general']['default_shipping_cost'] = (float)$input['general']['default_shipping_cost'];
        }
        if (isset($input['general']['free_shipping_threshold'])) {
            $new_config['general']['free_shipping_threshold'] = (float)$input['general']['free_shipping_threshold'];
        }
        if (isset($input['general']['currency'])) {
            $new_config['general']['currency'] = $input['general']['currency'];
        }

        // Config dosyasını düzgün formatla yaz
        $config_content = "<?php\n";
        $config_content .= "// Güvenli Configuration Endpoint\n";
        $config_content .= "require_once __DIR__ . '/security_new.php';\n\n";
        $config_content .= "// Güvenlik kontrollerini başlat\n";
        $config_content .= "if (!defined('SECURITY_LAYER_ACTIVE')) {\n";
        $config_content .= "    http_response_code(403);\n";
        $config_content .= "    exit('Security layer not initialized');\n";
        $config_content .= "}\n\n";
        $config_content .= "// Bu dosya sadece dahili kullanım için\n";
        $config_content .= "if (!defined('INTERNAL_ACCESS')) {\n";
        $config_content .= "    securityLog('Unauthorized config access attempt', 'WARNING', ['ip' => getClientIP()]);\n";
        $config_content .= "    http_response_code(403);\n";
        $config_content .= "    exit('Access denied');\n";
        $config_content .= "}\n\n";
        $config_content .= "// Ikas Mağaza Ayarları ve SiPay Ödeme Sistemi\n";
        $config_content .= "// Bu dosyayı güvenli bir yerde tutun ve gerçek production değerleri ile güncelleyin\n\n";
        $config_content .= "return " . var_export($new_config, true) . ";\n";
        $config_content .= "?>\n";
        
        if (file_put_contents($config_file, $config_content, LOCK_EX)) {
            // Cache'i temizle (eğer varsa)
            if (function_exists('opcache_invalidate')) {
                opcache_invalidate($config_file, true);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Config başarıyla güncellendi',
                'data' => [
                    'general' => [
                        'currency' => $new_config['general']['currency'],
                        'default_shipping_cost' => (float)$new_config['general']['default_shipping_cost'],
                        'free_shipping_threshold' => (float)$new_config['general']['free_shipping_threshold'],
                        'timezone' => $new_config['general']['timezone'],
                        'debug_mode' => (bool)$new_config['general']['debug_mode']
                    ]
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'error' => 'Config dosyası yazılamadı',
                'message' => 'Dosya yazma hatası'
            ]);
        }
        exit;
    }

    // Desteklenmeyen method
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
        'message' => 'Sadece GET ve POST desteklenir'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Sunucu hatası',
        'message' => $e->getMessage()
    ]);
}
?>
