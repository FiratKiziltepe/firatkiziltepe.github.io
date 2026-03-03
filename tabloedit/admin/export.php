<?php
/**
 * JSON Export İşlemi
 * Atomik yazma ve versiyon güncellemesi
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'JSON Export';

$exportResult = null;
$exportError = null;

// Export işlemi
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['do_export'])) {
    // CSRF kontrolü
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $exportError = 'Geçersiz istek. Lütfen tekrar deneyin.';
    } else {
        try {
            $result = exportToJSON();
            if ($result['success']) {
                $exportResult = $result;
                logAction('EXPORT', null, null, [
                    'record_count' => $result['count'],
                    'version' => $result['version'],
                    'file_size' => $result['size']
                ]);
                setFlashSuccess('JSON dosyası başarıyla oluşturuldu!');
            } else {
                $exportError = $result['error'];
            }
        } catch (Exception $e) {
            $exportError = 'Export hatası: ' . $e->getMessage();
        }
    }
}

/**
 * JSON Export Fonksiyonu
 */
function exportToJSON(): array {
    $pdo = getDB();
    
    // Tüm kayıtları al (sıralı)
    $stmt = $pdo->query("
        SELECT sira_no, ders_adi, unite_tema, kazanim, eicerik_turu, aciklama, program_turu
        FROM records
        ORDER BY sira_no ASC, id ASC
    ");
    $records = $stmt->fetchAll();
    
    if (empty($records)) {
        return ['success' => false, 'error' => 'Export edilecek kayıt bulunamadı.'];
    }
    
    // JSON formatına dönüştür
    $jsonData = [];
    foreach ($records as $record) {
        // Boş/geçersiz satırları atla
        if (empty(trim($record['ders_adi']))) {
            continue;
        }
        
        $jsonData[] = [
            'SIRA NO' => (int) $record['sira_no'],
            'DERS ADI' => $record['ders_adi'],
            'ÜNİTE/TEMA/ ÖĞRENME ALANI' => $record['unite_tema'] ?? '',
            'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM' => $record['kazanim'] ?? '',
            'E-İÇERİK TÜRÜ' => $record['eicerik_turu'] ?? '',
            'AÇIKLAMA' => $record['aciklama'] ?? '',
            'Program Türü' => $record['program_turu'] ?? ''
        ];
    }
    
    if (empty($jsonData)) {
        return ['success' => false, 'error' => 'Geçerli kayıt bulunamadı.'];
    }
    
    // JSON oluştur
    $jsonContent = json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
    if ($jsonContent === false) {
        return ['success' => false, 'error' => 'JSON oluşturma hatası: ' . json_last_error_msg()];
    }
    
    // JSON validasyonu
    $testDecode = json_decode($jsonContent, true);
    if ($testDecode === null) {
        return ['success' => false, 'error' => 'JSON validasyon hatası.'];
    }
    
    // Atomik yazma: önce temp dosyaya yaz
    $tempPath = JSON_TEMP_PATH;
    $finalPath = JSON_EXPORT_PATH;
    
    // Temp dosyaya yaz
    $writeResult = file_put_contents($tempPath, $jsonContent, LOCK_EX);
    if ($writeResult === false) {
        return ['success' => false, 'error' => 'Dosya yazma hatası.'];
    }
    
    // Dosya boyutu kontrolü
    $fileSize = filesize($tempPath);
    if ($fileSize < 100) {
        unlink($tempPath);
        return ['success' => false, 'error' => 'Oluşturulan dosya çok küçük, muhtemelen hatalı.'];
    }
    
    // Atomik rename
    if (!rename($tempPath, $finalPath)) {
        unlink($tempPath);
        return ['success' => false, 'error' => 'Dosya taşıma hatası.'];
    }
    
    // Version güncelle
    $version = time();
    file_put_contents(VERSION_FILE_PATH, $version, LOCK_EX);
    
    return [
        'success' => true,
        'count' => count($jsonData),
        'size' => formatFileSize($fileSize),
        'version' => $version,
        'path' => $finalPath
    ];
}

/**
 * Dosya boyutu formatla
 */
function formatFileSize(int $bytes): string {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    }
    return $bytes . ' bytes';
}

// Mevcut dosya bilgileri
$currentVersion = file_exists(VERSION_FILE_PATH) ? trim(file_get_contents(VERSION_FILE_PATH)) : null;
$currentFileExists = file_exists(JSON_EXPORT_PATH);
$currentFileSize = $currentFileExists ? formatFileSize(filesize(JSON_EXPORT_PATH)) : null;
$currentFileTime = $currentFileExists ? date('d.m.Y H:i:s', filemtime(JSON_EXPORT_PATH)) : null;

$totalRecords = getTotalRecordCount();

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2>Mevcut Durum</h2>
    </div>
    <div class="card-body">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Veritabanı Kayıt Sayısı:</span>
                <span class="info-value"><?= number_format($totalRecords) ?></span>
            </div>
            
            <?php if ($currentFileExists): ?>
            <div class="info-item">
                <span class="info-label">Mevcut data.json:</span>
                <span class="info-value">✅ Mevcut</span>
            </div>
            <div class="info-item">
                <span class="info-label">Dosya Boyutu:</span>
                <span class="info-value"><?= $currentFileSize ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Son Güncelleme:</span>
                <span class="info-value"><?= $currentFileTime ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Versiyon:</span>
                <span class="info-value"><?= $currentVersion ?></span>
            </div>
            <?php else: ?>
            <div class="info-item">
                <span class="info-label">Mevcut data.json:</span>
                <span class="info-value">❌ Bulunamadı</span>
            </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php if ($exportError): ?>
<div class="alert alert-error"><?= e($exportError) ?></div>
<?php endif; ?>

<?php if ($exportResult): ?>
<div class="card card-success">
    <div class="card-header">
        <h2>✅ Export Başarılı!</h2>
    </div>
    <div class="card-body">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Kayıt Sayısı:</span>
                <span class="info-value"><?= number_format($exportResult['count']) ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Dosya Boyutu:</span>
                <span class="info-value"><?= $exportResult['size'] ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Yeni Versiyon:</span>
                <span class="info-value"><?= $exportResult['version'] ?></span>
            </div>
        </div>
        
        <div class="export-instructions">
            <h3>📤 Sonraki Adımlar</h3>
            <ol>
                <li>Aşağıdaki dosyaları TTKB sunucusuna yükleyin:</li>
                <ul>
                    <li><code>data.json</code></li>
                    <li><code>version.txt</code></li>
                </ul>
                <li>Dosyaları FTP/SCP ile <code>https://ttkb.meb.gov.tr/tablo/</code> dizinine kopyalayın.</li>
                <li>Değişikliklerin yansıdığını kontrol edin.</li>
            </ol>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="card">
    <div class="card-header">
        <h2>JSON Oluştur</h2>
    </div>
    <div class="card-body">
        <div class="export-warning">
            <p><strong>⚠️ Dikkat:</strong> Bu işlem mevcut <code>data.json</code> dosyasının üzerine yazacaktır.</p>
            <p>İşlem atomik olarak gerçekleştirilir (önce temp dosyaya yazılır, sonra rename edilir).</p>
        </div>
        
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
            <input type="hidden" name="do_export" value="1">
            
            <button type="submit" class="btn btn-primary btn-lg" 
                    onclick="return confirm('JSON dosyası oluşturulacak. Devam etmek istiyor musunuz?')">
                📤 JSON Oluştur
            </button>
        </form>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

