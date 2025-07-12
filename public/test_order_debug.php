<?php
// Test Sipariş Oluşturma Debug Aracı
require_once __DIR__ . '/security_new.php';

// Güvenlik kontrollerini başlat
if (!defined('SECURITY_LAYER_ACTIVE')) {
    http_response_code(403);
    exit('Security layer not initialized');
}

// HTML Header
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛍️ Sipariş Oluşturma Test - CalFormat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border-color: #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border-color: #bee5eb; }
        .warning { background: #fff3cd; color: #856404; border-color: #ffeaa7; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .btn-test { background: #28a745; }
        .btn-test:hover { background: #1e7e34; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-success { background: #28a745; }
        .status-error { background: #dc3545; }
        .status-warning { background: #ffc107; }
        .status-info { background: #17a2b8; }
        input, select, textarea { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .form-group { margin: 10px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ Sipariş Oluşturma Test Paneli</h1>
        <p><strong>Tarih:</strong> <?= date('Y-m-d H:i:s') ?></p>

        <!-- Config Kontrolü -->
        <div class="test-section info">
            <h3><span class="status-indicator status-info"></span>Konfigürasyon Durumu</h3>
            <?php
            define('INTERNAL_ACCESS', true);
            $config = include __DIR__ . '/config.php';
            $ikasConfig = $config['ikas'];
            
            echo "<p><strong>İkas Test Mode:</strong> " . ($ikasConfig['test_mode'] ? '✅ Test' : '🔴 Production') . "</p>";
            echo "<p><strong>Store ID:</strong> " . $ikasConfig['store_id'] . "</p>";
            echo "<p><strong>Client ID:</strong> " . substr($ikasConfig['client_id'], 0, 20) . "...</p>";
            echo "<p><strong>GraphQL URL:</strong> " . $ikasConfig['graphql_url'] . "</p>";
            ?>
        </div>

        <!-- Manuel Sipariş Test Formu -->
        <div class="test-section">
            <h3><span class="status-indicator status-info"></span>Manuel Sipariş Testi</h3>
            <form id="orderTestForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="firstName">Ad:</label>
                        <input type="text" id="firstName" name="firstName" value="Test" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Soyad:</label>
                        <input type="text" id="lastName" name="lastName" value="Kullanıcı" required>
                    </div>
                    <div class="form-group">
                        <label for="email">E-posta:</label>
                        <input type="email" id="email" name="email" value="test@calformat.com.tr" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Telefon:</label>
                        <input type="tel" id="phone" name="phone" value="05551234567" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Adres:</label>
                        <input type="text" id="address" name="address" value="Test Mahallesi No:1" required>
                    </div>
                    <div class="form-group">
                        <label for="city">Şehir:</label>
                        <select id="city" name="city" required>
                            <option value="fb123456-7890-abcd-ef12-345678901001">İstanbul</option>
                            <option value="fb123456-7890-abcd-ef12-345678901002">Ankara</option>
                            <option value="fb123456-7890-abcd-ef12-345678901003">İzmir</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="district">İlçe:</label>
                        <select id="district" name="district" required>
                            <option value="fb123456-7890-abcd-ef12-345678901242">Beykoz</option>
                            <option value="fb123456-7890-abcd-ef12-345678901243">Kadıköy</option>
                            <option value="fb123456-7890-abcd-ef12-345678901244">Şişli</option>
                        </select>
                    </div>
                </div>
                <button type="button" class="btn-test" onclick="createTestOrder()">🛍️ Test Siparişi Oluştur</button>
            </form>
        </div>

        <!-- Test Sonuçları -->
        <div id="testResults" class="test-section" style="display: none;">
            <h3><span class="status-indicator status-success"></span>Test Sonuçları</h3>
            <div id="resultContent"></div>
        </div>

        <!-- Token Testi -->
        <div class="test-section">
            <h3><span class="status-indicator status-warning"></span>İkas Token Testi</h3>
            <button type="button" onclick="testIkasToken()">🔑 Token Al</button>
            <div id="tokenResult" style="margin-top: 10px;"></div>
        </div>

        <!-- API Endpoint Durumu -->
        <div class="test-section">
            <h3><span class="status-indicator status-info"></span>API Endpoint Test</h3>
            <button type="button" onclick="testEndpoint()">🌐 Endpoint Test Et</button>
            <div id="endpointResult" style="margin-top: 10px;"></div>
        </div>
    </div>

    <script>
        // Test siparişi oluşturma
        async function createTestOrder() {
            const form = document.getElementById('orderTestForm');
            const formData = new FormData(form);
            
            const orderPayload = {
                input: {
                    order: {
                        orderLineItems: [
                            {
                                id: "8c64cc8a-7950-49e3-8739-36bcfc1db7fa",
                                price: 100,
                                variant: {
                                    id: "7868c357-4726-432a-ad5d-49619e6a508b"
                                },
                                quantity: 1
                            }
                        ],
                        billingAddress: {
                            firstName: formData.get('firstName'),
                            lastName: formData.get('lastName'),
                            addressLine1: formData.get('address'),
                            addressLine2: "",
                            city: {
                                id: formData.get('city'),
                                name: document.getElementById('city').selectedOptions[0].text
                            },
                            country: {
                                id: "da8c5f2a-8d37-48a8-beff-6ab3793a1861",
                                name: "Türkiye"
                            },
                            district: {
                                id: formData.get('district'),
                                name: document.getElementById('district').selectedOptions[0].text
                            },
                            state: {
                                id: "da8c5f2a-8d37-48a8-beff-6ab3793a1861"
                            },
                            phone: formData.get('phone'),
                            company: null,
                            isDefault: false
                        },
                        shippingAddress: {
                            firstName: formData.get('firstName'),
                            lastName: formData.get('lastName'),
                            addressLine1: formData.get('address'),
                            addressLine2: "",
                            city: {
                                id: formData.get('city'),
                                name: document.getElementById('city').selectedOptions[0].text
                            },
                            country: {
                                id: "da8c5f2a-8d37-48a8-beff-6ab3793a1861",
                                name: "Türkiye"
                            },
                            district: {
                                id: formData.get('district'),
                                name: document.getElementById('district').selectedOptions[0].text
                            },
                            state: {
                                id: "da8c5f2a-8d37-48a8-beff-6ab3793a1861"
                            },
                            phone: formData.get('phone'),
                            company: null,
                            isDefault: false
                        },
                        note: "Test siparişi - " + new Date().toISOString(),
                        deleted: false,
                        customer: {
                            lastName: formData.get('lastName'),
                            firstName: formData.get('firstName'),
                            email: formData.get('email')
                        }
                    },
                    transactions: [
                        {
                            amount: 130 // 100 + 30 kargo
                        }
                    ]
                }
            };

            try {
                showResult('Test siparişi oluşturuluyor...', 'info');
                
                console.log('📦 Gönderilen payload:', orderPayload);
                
                const response = await fetch('/ikas_create_order_new.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(orderPayload)
                });

                const responseText = await response.text();
                let result;
                
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    result = { error: 'JSON Parse Error', raw: responseText };
                }

                showResult(`
                    <h4>📊 API Response (Status: ${response.status})</h4>
                    <h5>🔍 Parsed Result:</h5>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                    ${responseText.length > 1000 ? `<h5>📄 Raw Response (first 1000 chars):</h5><pre>${responseText.substring(0, 1000)}...</pre>` : `<h5>📄 Full Raw Response:</h5><pre>${responseText}</pre>`}
                `, result.success ? 'success' : 'error');

            } catch (error) {
                showResult(`
                    <h4>❌ Test Hatası</h4>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <pre>${error.stack}</pre>
                `, 'error');
            }
        }

        // İkas token testi
        async function testIkasToken() {
            try {
                document.getElementById('tokenResult').innerHTML = '<p>🔄 Token alınıyor...</p>';
                
                const response = await fetch('/test_token.php');
                const result = await response.text();
                
                document.getElementById('tokenResult').innerHTML = `
                    <h5>🔑 Token Test Sonucu:</h5>
                    <pre style="max-height: 300px; overflow-y: auto;">${result}</pre>
                `;
            } catch (error) {
                document.getElementById('tokenResult').innerHTML = `
                    <div class="error">
                        <h5>❌ Token Test Hatası:</h5>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }

        // Endpoint testi
        async function testEndpoint() {
            try {
                document.getElementById('endpointResult').innerHTML = '<p>🔄 Endpoint test ediliyor...</p>';
                
                const response = await fetch('/ikas_create_order_new.php', {
                    method: 'OPTIONS'
                });
                
                document.getElementById('endpointResult').innerHTML = `
                    <h5>🌐 Endpoint Test Sonucu:</h5>
                    <p><strong>Status:</strong> ${response.status}</p>
                    <p><strong>Headers:</strong></p>
                    <pre>${JSON.stringify([...response.headers.entries()], null, 2)}</pre>
                `;
            } catch (error) {
                document.getElementById('endpointResult').innerHTML = `
                    <div class="error">
                        <h5>❌ Endpoint Test Hatası:</h5>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }

        // Sonuç gösterme helper
        function showResult(content, type = 'info') {
            const resultDiv = document.getElementById('testResults');
            const contentDiv = document.getElementById('resultContent');
            
            resultDiv.style.display = 'block';
            resultDiv.className = `test-section ${type}`;
            contentDiv.innerHTML = content;
            
            // Sayfayı sonuca scroll et
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
