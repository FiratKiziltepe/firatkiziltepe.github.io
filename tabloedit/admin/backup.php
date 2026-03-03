<?php
/**
 * Veritabanı Yedekleme Sistemi
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'Yedekleme';

// Yedek klasörü
$backupDir = __DIR__ . '/../data/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    
    // .htaccess ekle
    file_put_contents($backupDir . '/.htaccess', "Deny from all\n");
}

$result = null;
$error = null;

// Yedekleme işlemi
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Geçersiz istek.';
    } else {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'create':
                $result = createBackup($backupDir);
                if ($result['success']) {
                    logAction('BACKUP_CREATE', null, null, ['filename' => $result['filename']]);
                }
                break;
                
            case 'restore':
                $filename = $_POST['filename'] ?? '';
                $result = restoreBackup($backupDir, $filename);
                if ($result['success']) {
                    logAction('BACKUP_RESTORE', null, null, ['filename' => $filename]);
                }
                break;
                
            case 'delete':
                $filename = $_POST['filename'] ?? '';
                $result = deleteBackup($backupDir, $filename);
                break;
                
            case 'download':
                $filename = $_POST['filename'] ?? '';
                downloadBackup($backupDir, $filename);
                exit;
        }
    }
}

/**
 * Yedek oluştur
 */
function createBackup($backupDir) {
    $timestamp = date('Y-m-d_His');
    $filename = "backup_{$timestamp}.sqlite";
    $filepath = $backupDir . '/' . $filename;
    
    // SQLite dosyasını kopyala
    if (!file_exists(DB_PATH)) {
        return ['success' => false, 'error' => 'Veritabanı dosyası bulunamadı.'];
    }
    
    // Veritabanı bağlantısını kapat ve dosyayı kopyala
    $pdo = getDB();
    $pdo->exec('PRAGMA wal_checkpoint(FULL)');
    
    if (!copy(DB_PATH, $filepath)) {
        return ['success' => false, 'error' => 'Yedek oluşturulurken hata.'];
    }
    
    // Eski yedekleri temizle (10'dan fazlaysa)
    cleanOldBackups($backupDir, 10);
    
    return [
        'success' => true,
        'filename' => $filename,
        'size' => formatFileSize(filesize($filepath))
    ];
}

/**
 * Yedekten geri yükle
 */
function restoreBackup($backupDir, $filename) {
    if (empty($filename) || !preg_match('/^backup_[\d_-]+\.sqlite$/', $filename)) {
        return ['success' => false, 'error' => 'Geçersiz dosya adı.'];
    }
    
    $filepath = $backupDir . '/' . $filename;
    if (!file_exists($filepath)) {
        return ['success' => false, 'error' => 'Yedek dosyası bulunamadı.'];
    }
    
    // Mevcut DB'yi yedekle (güvenlik için)
    $tempBackup = $backupDir . '/pre_restore_' . date('Y-m-d_His') . '.sqlite';
    copy(DB_PATH, $tempBackup);
    
    // Yedeği geri yükle
    if (!copy($filepath, DB_PATH)) {
        return ['success' => false, 'error' => 'Geri yükleme sırasında hata.'];
    }
    
    return ['success' => true, 'message' => 'Yedek başarıyla geri yüklendi.'];
}

/**
 * Yedek sil
 */
function deleteBackup($backupDir, $filename) {
    if (empty($filename) || !preg_match('/^backup_[\d_-]+\.sqlite$/', $filename)) {
        return ['success' => false, 'error' => 'Geçersiz dosya adı.'];
    }
    
    $filepath = $backupDir . '/' . $filename;
    if (!file_exists($filepath)) {
        return ['success' => false, 'error' => 'Dosya bulunamadı.'];
    }
    
    unlink($filepath);
    return ['success' => true, 'message' => 'Yedek silindi.'];
}

/**
 * Yedek indir
 */
function downloadBackup($backupDir, $filename) {
    if (empty($filename) || !preg_match('/^backup_[\d_-]+\.sqlite$/', $filename)) {
        die('Geçersiz dosya.');
    }
    
    $filepath = $backupDir . '/' . $filename;
    if (!file_exists($filepath)) {
        die('Dosya bulunamadı.');
    }
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
}

/**
 * Eski yedekleri temizle
 */
function cleanOldBackups($backupDir, $keepCount) {
    $files = glob($backupDir . '/backup_*.sqlite');
    if (count($files) <= $keepCount) {
        return;
    }
    
    // Tarihe göre sırala (eski önce)
    usort($files, function($a, $b) {
        return filemtime($a) - filemtime($b);
    });
    
    // Fazla olanları sil
    $toDelete = array_slice($files, 0, count($files) - $keepCount);
    foreach ($toDelete as $file) {
        unlink($file);
    }
}

/**
 * Dosya boyutu formatla
 */
function formatFileSize($bytes) {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    }
    return $bytes . ' bytes';
}

// Mevcut yedekleri listele
$backups = [];
$files = glob($backupDir . '/backup_*.sqlite');
if ($files) {
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    foreach ($files as $file) {
        $backups[] = [
            'filename' => basename($file),
            'size' => formatFileSize(filesize($file)),
            'date' => date('d.m.Y H:i:s', filemtime($file))
        ];
    }
}

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2>Yedekleme</h2>
    </div>
    <div class="card-body">
        <?php if ($result && !$result['success']): ?>
            <div class="alert alert-error"><?= e($result['error']) ?></div>
        <?php elseif ($result && $result['success']): ?>
            <div class="alert alert-success">
                <?= e($result['message'] ?? 'İşlem başarılı!') ?>
                <?php if (isset($result['filename'])): ?>
                    <br>Dosya: <?= e($result['filename']) ?> (<?= $result['size'] ?>)
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="backup-actions">
            <form method="POST" style="display: inline;">
                <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
                <input type="hidden" name="action" value="create">
                <button type="submit" class="btn btn-primary btn-lg">
                    💾 Yeni Yedek Oluştur
                </button>
            </form>
        </div>
        
        <div class="backup-info">
            <p><strong>Veritabanı Boyutu:</strong> <?= formatFileSize(filesize(DB_PATH)) ?></p>
            <p><strong>Kayıtlı Yedek Sayısı:</strong> <?= count($backups) ?></p>
            <p><em>Not: En fazla 10 yedek saklanır, eski yedekler otomatik silinir.</em></p>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h2>Mevcut Yedekler</h2>
    </div>
    <div class="card-body">
        <?php if (empty($backups)): ?>
            <p class="text-muted text-center">Henüz yedek oluşturulmamış.</p>
        <?php else: ?>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Dosya Adı</th>
                            <th>Tarih</th>
                            <th>Boyut</th>
                            <th width="200">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($backups as $backup): ?>
                        <tr>
                            <td><?= e($backup['filename']) ?></td>
                            <td><?= e($backup['date']) ?></td>
                            <td><?= e($backup['size']) ?></td>
                            <td class="actions-cell">
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
                                    <input type="hidden" name="filename" value="<?= e($backup['filename']) ?>">
                                    <input type="hidden" name="action" value="download">
                                    <button type="submit" class="btn btn-sm btn-secondary" title="İndir">📥</button>
                                </form>
                                
                                <form method="POST" style="display: inline;" 
                                      onsubmit="return confirm('Bu yedek geri yüklenecek. Mevcut veriler kaybolacak. Emin misiniz?')">
                                    <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
                                    <input type="hidden" name="filename" value="<?= e($backup['filename']) ?>">
                                    <input type="hidden" name="action" value="restore">
                                    <button type="submit" class="btn btn-sm btn-primary" title="Geri Yükle">🔄</button>
                                </form>
                                
                                <form method="POST" style="display: inline;"
                                      onsubmit="return confirm('Bu yedek silinecek. Emin misiniz?')">
                                    <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
                                    <input type="hidden" name="filename" value="<?= e($backup['filename']) ?>">
                                    <input type="hidden" name="action" value="delete">
                                    <button type="submit" class="btn btn-sm btn-danger" title="Sil">🗑️</button>
                                </form>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

