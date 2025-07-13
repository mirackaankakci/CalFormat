<?php
require_once __DIR__ . '/security_new.php';

// URL parametrelerini al
$status = $_GET['status'] ?? 'unknown';
$sipayStatus = $_GET['sipay_status'] ?? '0';
$invoiceId = $_GET['invoice_id'] ?? '';
$orderNo = $_GET['order_no'] ?? '';

$isSuccess = ($status === 'success' && $sipayStatus === '1') || $sipayStatus === '1';

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $isSuccess ? 'Ödeme Başarılı - CalFormat' : 'Ödeme Başarısız - CalFormat'; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: <?php echo $isSuccess ? 'linear-gradient(90deg, #4CAF50, #45a049)' : 'linear-gradient(90deg, #f44336, #d32f2f)'; ?>;
        }

        .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 40px;
            color: white;
            background: <?php echo $isSuccess ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #f44336, #d32f2f)'; ?>;
            animation: bounce 0.6s ease-in-out;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.2em;
            font-weight: 600;
        }

        .subtitle {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .order-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid <?php echo $isSuccess ? '#4CAF50' : '#f44336'; ?>;
        }

        .order-info h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: 600;
            color: #555;
        }

        .info-value {
            color: #333;
            font-family: monospace;
            background: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }

        .buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #ee7f1a, #d62d27);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(238, 127, 26, 0.3);
        }

        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 2px solid #dee2e6;
        }

        .btn-secondary:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }

        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 20px;
            background: <?php echo $isSuccess ? '#d4edda' : '#f8d7da'; ?>;
            color: <?php echo $isSuccess ? '#155724' : '#721c24'; ?>;
            border: 1px solid <?php echo $isSuccess ? '#c3e6cb' : '#f5c6cb'; ?>;
        }

        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 1.8em;
            }
            
            .buttons {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <?php echo $isSuccess ? '✓' : '✗'; ?>
        </div>

        <div class="status-badge">
            <?php echo $isSuccess ? '✅ ÖDEME BAŞARILI' : '❌ ÖDEME BAŞARISIZ'; ?>
        </div>

        <h1><?php echo $isSuccess ? '🎉 Siparişiniz Tamamlandı!' : '😔 Ödeme İşlemi Başarısız'; ?></h1>
        
        <p class="subtitle">
            <?php if ($isSuccess): ?>
                Ödemeniz başarıyla alındı ve siparişiniz hazırlanmaya başladı. 
                Sipariş detayları e-posta adresinize gönderilecektir.
            <?php else: ?>
                Ödeme işlemi sırasında bir hata oluştu. 
                Lütfen kart bilgilerinizi kontrol edip tekrar deneyiniz.
            <?php endif; ?>
        </p>

        <div class="order-info">
            <h3><?php echo $isSuccess ? '📦 Sipariş Bilgileri' : '⚠️ İşlem Detayları'; ?></h3>
            
            <?php if (!empty($invoiceId)): ?>
            <div class="info-row">
                <span class="info-label">Fatura No:</span>
                <span class="info-value"><?php echo htmlspecialchars($invoiceId); ?></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($orderNo)): ?>
            <div class="info-row">
                <span class="info-label">Sipariş No:</span>
                <span class="info-value"><?php echo htmlspecialchars($orderNo); ?></span>
            </div>
            <?php endif; ?>
            
            <div class="info-row">
                <span class="info-label">İşlem Durumu:</span>
                <span class="info-value"><?php echo $isSuccess ? 'Başarılı' : 'Başarısız'; ?></span>
            </div>
            
            <div class="info-row">
                <span class="info-label">İşlem Zamanı:</span>
                <span class="info-value"><?php echo date('d.m.Y H:i:s'); ?></span>
            </div>
        </div>

        <div class="buttons">
            <?php if ($isSuccess): ?>
                <a href="mailto:info@calformat.com?subject=Sipariş Hakkında - <?php echo htmlspecialchars($invoiceId); ?>" class="btn btn-secondary">
                    📧 İletişim
                </a>
                <a href="/" class="btn btn-primary">
                    🏠 Ana Sayfaya Dön
                </a>
            <?php else: ?>
                <a href="/checkout" class="btn btn-secondary">
                    🔄 Tekrar Dene
                </a>
                <a href="/" class="btn btn-primary">
                    🏠 Ana Sayfaya Dön
                </a>
            <?php endif; ?>
        </div>

        <?php if ($isSuccess): ?>
        <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fff3cd, #ffeaa7); border-radius: 12px; border-left: 4px solid #856404;">
            <h4 style="color: #856404; margin-bottom: 10px;">💚 CalFormat Ailesine Hoş Geldiniz!</h4>
            <p style="color: #856404; margin: 0;">
                Doğal ve sağlıklı beslenme yolculuğunuzda yanınızdayız. 
                Siparişiniz 1-2 iş günü içinde kargoya verilecektir.
            </p>
        </div>
        <?php endif; ?>
    </div>

    <script>
        // 5 saniye sonra ana sayfaya yönlendir (sadece başarısız işlemler için)
        <?php if (!$isSuccess): ?>
        setTimeout(function() {
            if (confirm('Ana sayfaya dönmek istiyor musunuz?')) {
                window.location.href = '/';
            }
        }, 5000);
        <?php endif; ?>
    </script>
</body>
</html>
