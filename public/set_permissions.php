<?php
// GEÇİCİ - Dosya izinlerini ayarlamak için
// KULLANDIKTAN SONRA BU DOSYAYI SİLİN!

echo "<h3>Dosya İzinleri Ayarlanıyor...</h3>";

// public klasörü için 755
if (chmod(__DIR__, 0755)) {
    echo "✅ public/ klasörü: 755 (başarılı)<br>";
} else {
    echo "❌ public/ klasörü: 755 (başarısız)<br>";
}

// .env dosyası için 600
if (file_exists(__DIR__ . '/.env')) {
    if (chmod(__DIR__ . '/.env', 0600)) {
        echo "✅ .env dosyası: 600 (başarılı)<br>";
    } else {
        echo "❌ .env dosyası: 600 (başarısız)<br>";
    }
} else {
    echo "⚠️ .env dosyası bulunamadı<br>";
}

// PHP dosyaları için 644
$phpFiles = glob(__DIR__ . '/*.php');
$success = 0;
$total = count($phpFiles);

foreach ($phpFiles as $file) {
    if (chmod($file, 0644)) {
        $success++;
    }
}

echo "✅ PHP dosyaları: {$success}/{$total} dosya 644 izni verildi<br>";

echo "<br><strong style='color: red;'>ÖNEMLİ: Bu dosyayı (set_permissions.php) şimdi silin!</strong>";

// Otomatik silme (isteğe bağlı)
// unlink(__FILE__);
?>
