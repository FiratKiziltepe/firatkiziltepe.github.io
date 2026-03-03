<?php
/**
 * Excel/CSV Import - Dosyadan kayıt aktarımı
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'Excel İçe Aktarma';

$result = null;
$error = null;

// Form gönderildi mi?
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF kontrolü
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Geçersiz istek. Lütfen tekrar deneyin.';
    } elseif (empty($_FILES['import_file']['name'])) {
        $error = 'Lütfen bir dosya seçin.';
    } else {
        $file = $_FILES['import_file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($ext, ['xlsx', 'csv'])) {
            $error = 'Sadece XLSX ve CSV dosyaları desteklenir.';
        } elseif ($file['error'] !== UPLOAD_ERR_OK) {
            $error = 'Dosya yüklenirken bir hata oluştu.';
        } else {
            try {
                if ($ext === 'csv') {
                    $data = parseCSV($file['tmp_name']);
                } else {
                    $data = parseXLSX($file['tmp_name']);
                }
                
                if (empty($data)) {
                    $error = 'Dosyada geçerli veri bulunamadı.';
                } else {
                    $imported = importRecords($data, !empty($_POST['skip_existing']));
                    $result = $imported;
                    
                    logAction('EXCEL_IMPORT', null, null, [
                        'imported' => $imported['added'],
                        'skipped' => $imported['skipped'],
                        'filename' => $file['name']
                    ]);
                }
            } catch (Exception $e) {
                $error = 'İçe aktarma hatası: ' . $e->getMessage();
            }
        }
    }
}

/**
 * CSV dosyasını parse et
 */
function parseCSV($filepath) {
    $data = [];
    $handle = fopen($filepath, 'r');
    
    // BOM karakterini atla
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") {
        rewind($handle);
    }
    
    $headers = null;
    while (($row = fgetcsv($handle, 0, ';')) !== false) {
        // Virgül ile de dene
        if (count($row) <= 1) {
            rewind($handle);
            if ($bom !== "\xEF\xBB\xBF") {
                fread($handle, 0);
            }
            $row = fgetcsv($handle, 0, ',');
        }
        
        if ($headers === null) {
            $headers = array_map('trim', $row);
            continue;
        }
        
        if (count($row) !== count($headers)) {
            continue;
        }
        
        $record = array_combine($headers, array_map('trim', $row));
        $data[] = normalizeRecord($record);
    }
    
    fclose($handle);
    return $data;
}

/**
 * XLSX dosyasını parse et (basit implementasyon)
 */
function parseXLSX($filepath) {
    $data = [];
    
    $zip = new ZipArchive();
    if ($zip->open($filepath) !== true) {
        throw new Exception('XLSX dosyası açılamadı.');
    }
    
    // Shared strings
    $sharedStrings = [];
    $ssXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ssXml) {
        $ssDoc = new DOMDocument();
        $ssDoc->loadXML($ssXml);
        foreach ($ssDoc->getElementsByTagName('t') as $t) {
            $sharedStrings[] = $t->textContent;
        }
    }
    
    // Sheet1
    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    if (!$sheetXml) {
        $zip->close();
        throw new Exception('Çalışma sayfası bulunamadı.');
    }
    
    $doc = new DOMDocument();
    $doc->loadXML($sheetXml);
    
    $rows = [];
    foreach ($doc->getElementsByTagName('row') as $row) {
        $rowData = [];
        foreach ($row->getElementsByTagName('c') as $cell) {
            $value = '';
            $v = $cell->getElementsByTagName('v')->item(0);
            if ($v) {
                if ($cell->getAttribute('t') === 's') {
                    // Shared string
                    $value = $sharedStrings[(int)$v->textContent] ?? '';
                } else {
                    $value = $v->textContent;
                }
            }
            $rowData[] = $value;
        }
        $rows[] = $rowData;
    }
    
    $zip->close();
    
    if (empty($rows)) {
        return [];
    }
    
    // İlk satır header
    $headers = array_shift($rows);
    
    foreach ($rows as $row) {
        if (count($row) < count($headers)) {
            $row = array_pad($row, count($headers), '');
        }
        $record = array_combine($headers, array_slice($row, 0, count($headers)));
        $normalized = normalizeRecord($record);
        if (!empty($normalized['ders_adi'])) {
            $data[] = $normalized;
        }
    }
    
    return $data;
}

/**
 * Kayıt alanlarını normalize et
 */
function normalizeRecord($record) {
    // Olası sütun isimlerini eşle
    $mapping = [
        'sira_no' => ['SIRA NO', 'Sıra No', 'sira_no', 'SIRANO', 'Sıra'],
        'ders_adi' => ['DERS ADI', 'Ders Adı', 'ders_adi', 'DERSADI', 'Ders'],
        'unite_tema' => ['ÜNİTE/TEMA/ ÖĞRENME ALANI', 'Ünite/Tema', 'unite_tema', 'UNITE', 'Ünite'],
        'kazanim' => ['KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'Kazanım', 'kazanim', 'KAZANIM'],
        'eicerik_turu' => ['E-İÇERİK TÜRÜ', 'E-İçerik Türü', 'eicerik_turu', 'EICERIK'],
        'aciklama' => ['AÇIKLAMA', 'Açıklama', 'aciklama', 'ACIKLAMA'],
        'program_turu' => ['Program Türü', 'program_turu', 'PROGRAM', 'Program']
    ];
    
    $normalized = [];
    foreach ($mapping as $key => $possibleNames) {
        $normalized[$key] = '';
        foreach ($possibleNames as $name) {
            if (isset($record[$name]) && $record[$name] !== '') {
                $normalized[$key] = trim($record[$name]);
                break;
            }
        }
    }
    
    return $normalized;
}

/**
 * Kayıtları veritabanına ekle
 */
function importRecords($data, $skipExisting = false) {
    $pdo = getDB();
    $added = 0;
    $skipped = 0;
    
    foreach ($data as $record) {
        if (empty($record['ders_adi']) || $record['ders_adi'] === 'DERS ADI') {
            $skipped++;
            continue;
        }
        
        // Mevcut kayıt kontrolü (isteğe bağlı)
        if ($skipExisting) {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM records 
                WHERE ders_adi = ? AND kazanim = ?
            ");
            $stmt->execute([$record['ders_adi'], $record['kazanim']]);
            if ($stmt->fetchColumn() > 0) {
                $skipped++;
                continue;
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO records (sira_no, ders_adi, unite_tema, kazanim, eicerik_turu, aciklama, program_turu)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            is_numeric($record['sira_no']) ? (int)$record['sira_no'] : null,
            $record['ders_adi'],
            $record['unite_tema'],
            $record['kazanim'],
            $record['eicerik_turu'],
            $record['aciklama'],
            $record['program_turu']
        ]);
        
        $added++;
    }
    
    return ['added' => $added, 'skipped' => $skipped];
}

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2>Excel/CSV İçe Aktarma</h2>
    </div>
    <div class="card-body">
        <?php if ($error): ?>
            <div class="alert alert-error"><?= e($error) ?></div>
        <?php endif; ?>
        
        <?php if ($result): ?>
            <div class="alert alert-success">
                <strong>İçe aktarma tamamlandı!</strong><br>
                Eklenen: <?= $result['added'] ?> kayıt<br>
                Atlanan: <?= $result['skipped'] ?> kayıt
            </div>
        <?php endif; ?>
        
        <div class="import-info">
            <h3>📋 Desteklenen Formatlar</h3>
            <ul>
                <li><strong>XLSX</strong> - Microsoft Excel 2007+ formatı</li>
                <li><strong>CSV</strong> - Virgül veya noktalı virgül ile ayrılmış</li>
            </ul>
            
            <h3>📌 Beklenen Sütunlar</h3>
            <p>Dosyanızda aşağıdaki sütun başlıkları olmalıdır:</p>
            <code>SIRA NO, DERS ADI, ÜNİTE/TEMA/ ÖĞRENME ALANI, KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM, E-İÇERİK TÜRÜ, AÇIKLAMA, Program Türü</code>
            
            <p class="mt-2"><em>Not: Sütun isimleri tam eşleşmese de benzer isimler otomatik eşleştirilir.</em></p>
        </div>
        
        <form method="POST" enctype="multipart/form-data" class="import-form">
            <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
            
            <div class="form-group">
                <label for="import_file">Dosya Seç (XLSX veya CSV)</label>
                <input type="file" id="import_file" name="import_file" 
                       accept=".xlsx,.csv" required>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="skip_existing" value="1">
                    Mevcut kayıtları atla (aynı ders adı ve kazanım varsa ekleme)
                </label>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">📥 İçe Aktar</button>
                <a href="records.php" class="btn btn-secondary">İptal</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

