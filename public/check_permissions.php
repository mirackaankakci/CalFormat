<?php
// Dosya izinlerini kontrol et
// Kullandıktan sonra silin!

echo "<h3>Dosya İzinleri Kontrolü</h3>";

// public klasörü
$dirPerms = substr(sprintf('%o', fileperms(__DIR__)), -3);
echo "📁 public/ klasörü: {$dirPerms} " . ($dirPerms == '755' ? '✅' : '❌') . "<br>";

// .env dosyası
if (file_exists(__DIR__ . '/.env')) {
    $envPerms = substr(sprintf('%o', fileperms(__DIR__ . '/.env')), -3);
    echo "🔒 .env dosyası: {$envPerms} " . ($envPerms == '600' ? '✅' : '❌') . "<br>";
}

// PHP dosyaları
$phpFiles = glob(__DIR__ . '/*.php');
echo "<br><strong>PHP Dosyaları:</strong><br>";
foreach ($phpFiles as $file) {
    $filename = basename($file);
    $perms = substr(sprintf('%o', fileperms($file)), -3);
    $status = ($perms == '644') ? '✅' : '❌';
    echo "📄 {$filename}: {$perms} {$status}<br>";
}

echo "<br><strong style='color: red;'>Bu dosyayı kontrol ettikten sonra silin!</strong>";
?>
