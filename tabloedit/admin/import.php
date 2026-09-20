<?php
/**
 * data.json İçe Aktarma Aracı
 * Mevcut data.json dosyasını SQLite veritabanına aktarır
 * 
 * Web arayüzü veya CLI olarak çalıştırılabilir:
 * - Web: http://localhost/admin/import.php
 * - CLI: php import.php
 */

require_once __DIR__ . '/config.php';

$isCli = php_sapi_name() === 'cli';

function output($message, $isCli = false) {
    if ($isCli) {
        echo $message . "\n";
    } else {
        echo "<p>" . htmlspecialchars($message) . "</p>";
    }
    if (!$isCli) {
        ob_flush();
        flush();
    }
}

// Web modunda auth kontrolü
if (!$isCli) {
    require_once __DIR__ . '/auth.php';
    session_start();
    
    // Eğer kullanıcı sayısı 0 ise (ilk kurulum), auth bypass
    $pdo = getDB();
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    
    if ($userCount > 0 && empty($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}

if (!$isCli) {
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Import</title>';
    echo '<link rel="stylesheet" href="assets/admin.css"></head><body>';
    echo '<div class="import-container"><h1>data.json İçe Aktarma</h1>';
}

// JSON dosya yolu
$jsonPath = __DIR__ . '/../data.json';

if (!file_exists($jsonPath)) {
    output("HATA: data.json dosyası bulunamadı: $jsonPath", $isCli);
    exit(1);
}

output("data.json dosyası bulundu.", $isCli);

// JSON oku
$jsonContent = file_get_contents($jsonPath);
$data = json_decode($jsonContent, true);

if ($data === null) {
    output("HATA: JSON parse hatası: " . json_last_error_msg(), $isCli);
    exit(1);
}

if (!is_array($data)) {
    output("HATA: JSON formatı geçersiz (array bekleniyor).", $isCli);
    exit(1);
}

output("JSON okundu: " . count($data) . " kayıt bulundu.", $isCli);

try {
    $pdo = getDB();
    
    // Mevcut kayıtları kontrol et
    $existingCount = $pdo->query("SELECT COUNT(*) FROM records")->fetchColumn();
    
    if ($existingCount > 0) {
        if ($isCli) {
            output("UYARI: Veritabanında zaten $existingCount kayıt var.", $isCli);
            output("Devam etmek için 'evet' yazın veya iptal için başka bir şey:", $isCli);
            $handle = fopen("php://stdin", "r");
            $line = fgets($handle);
            if (trim($line) !== 'evet') {
                output("İptal edildi.", $isCli);
                exit(0);
            }
            fclose($handle);
        } else {
            if (!isset($_POST['confirm_import'])) {
                echo "<form method='POST'>";
                echo "<p class='warning'>⚠️ Veritabanında zaten $existingCount kayıt var. Yeni kayıtlar eklenecek.</p>";
                echo "<input type='hidden' name='confirm_import' value='1'>";
                echo "<button type='submit' class='btn btn-primary'>Devam Et</button>";
                echo " <a href='index.php' class='btn btn-secondary'>İptal</a>";
                echo "</form></div></body></html>";
                exit;
            }
        }
    }
    
    // Transaction başlat
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("
        INSERT INTO records (sira_no, ders_adi, unite_tema, kazanim, eicerik_turu, aciklama, program_turu)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $imported = 0;
    $skipped = 0;
    
    foreach ($data as $index => $row) {
        // Ders adı kontrolü (boş olanları atla)
        $dersAdi = $row['DERS ADI'] ?? '';
        
        if (empty(trim($dersAdi)) || $dersAdi === 'DERS ADI') {
            $skipped++;
            continue;
        }
        
        $stmt->execute([
            $row['SIRA NO'] ?? null,
            $dersAdi,
            $row['ÜNİTE/TEMA/ ÖĞRENME ALANI'] ?? '',
            $row['KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM'] ?? '',
            $row['E-İÇERİK TÜRÜ'] ?? '',
            $row['AÇIKLAMA'] ?? '',
            $row['Program Türü'] ?? ''
        ]);
        
        $imported++;
        
        // Progress göster
        if ($imported % 500 === 0) {
            output("$imported kayıt aktarıldı...", $isCli);
        }
    }
    
    $pdo->commit();
    
    output("", $isCli);
    output("=== İçe Aktarma Tamamlandı ===", $isCli);
    output("Aktarılan: $imported kayıt", $isCli);
    output("Atlanan (boş/başlık): $skipped kayıt", $isCli);
    
    // Audit log
    if (!$isCli && !empty($_SESSION['user_id'])) {
        require_once __DIR__ . '/auth.php';
        logAction('IMPORT', null, null, [
            'imported' => $imported,
            'skipped' => $skipped,
            'source' => 'data.json'
        ]);
    }
    
    if (!$isCli) {
        echo "<p class='success'>✅ İçe aktarma başarılı!</p>";
        echo "<a href='records.php' class='btn btn-primary'>Kayıtları Görüntüle</a>";
    }
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    output("HATA: Veritabanı hatası: " . $e->getMessage(), $isCli);
    exit(1);
}

if (!$isCli) {
    echo '</div></body></html>';
}

