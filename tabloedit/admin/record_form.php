<?php
/**
 * Kayıt Ekleme / Düzenleme Formu
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$id = (int) ($_GET['id'] ?? 0);
$isEdit = $id > 0;
$pageTitle = $isEdit ? 'Kayıt Düzenle' : 'Yeni Kayıt';

$record = [
    'sira_no' => '',
    'ders_adi' => '',
    'unite_tema' => '',
    'kazanim' => '',
    'eicerik_turu' => '',
    'aciklama' => '',
    'program_turu' => 'TYMM'
];

$errors = [];

// Düzenleme modunda mevcut kaydı al
if ($isEdit) {
    $existingRecord = getRecord($id);
    if (!$existingRecord) {
        setFlashError('Kayıt bulunamadı.');
        header('Location: records.php');
        exit;
    }
    $record = $existingRecord;
}

// Form gönderildi mi?
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF kontrolü
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Geçersiz istek. Lütfen tekrar deneyin.';
    } else {
        // Form verilerini al
        $record = [
            'sira_no' => trim($_POST['sira_no'] ?? ''),
            'ders_adi' => trim($_POST['ders_adi'] ?? ''),
            'unite_tema' => trim($_POST['unite_tema'] ?? ''),
            'kazanim' => trim($_POST['kazanim'] ?? ''),
            'eicerik_turu' => trim($_POST['eicerik_turu'] ?? ''),
            'aciklama' => trim($_POST['aciklama'] ?? ''),
            'program_turu' => trim($_POST['program_turu'] ?? '')
        ];
        
        // Validasyon
        if (empty($record['ders_adi'])) {
            $errors[] = 'Ders adı zorunludur.';
        }
        
        if ($record['sira_no'] !== '' && !is_numeric($record['sira_no'])) {
            $errors[] = 'Sıra numarası sayı olmalıdır.';
        }
        
        // Hata yoksa kaydet
        if (empty($errors)) {
            try {
                if ($isEdit) {
                    updateRecord($id, $record);
                    setFlashSuccess('Kayıt başarıyla güncellendi.');
                } else {
                    $newId = createRecord($record);
                    setFlashSuccess('Kayıt başarıyla oluşturuldu.');
                }
                header('Location: records.php');
                exit;
            } catch (Exception $e) {
                $errors[] = 'Kayıt sırasında bir hata oluştu: ' . $e->getMessage();
            }
        }
    }
}

// Ders listesi (autocomplete için)
$dersAdlari = getAllDersAdlari();

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2><?= $isEdit ? 'Kayıt Düzenle (#' . $id . ')' : 'Yeni Kayıt Ekle' ?></h2>
    </div>
    <div class="card-body">
        <?php if (!empty($errors)): ?>
            <div class="alert alert-error">
                <ul>
                    <?php foreach ($errors as $error): ?>
                        <li><?= e($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <form method="POST" class="record-form">
            <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
            
            <div class="form-row">
                <div class="form-group form-group-small">
                    <label for="sira_no">Sıra No</label>
                    <input type="number" id="sira_no" name="sira_no" 
                           value="<?= e($record['sira_no']) ?>">
                </div>
                
                <div class="form-group form-group-medium">
                    <label for="ders_adi">Ders Adı <span class="required">*</span></label>
                    <input type="text" id="ders_adi" name="ders_adi" 
                           value="<?= e($record['ders_adi']) ?>" 
                           list="ders_listesi" required>
                    <datalist id="ders_listesi">
                        <?php foreach ($dersAdlari as $ders): ?>
                            <option value="<?= e($ders) ?>">
                        <?php endforeach; ?>
                    </datalist>
                </div>
                
                <div class="form-group form-group-small">
                    <label for="program_turu">Program Türü</label>
                    <select id="program_turu" name="program_turu">
                        <option value="TYMM" <?= $record['program_turu'] === 'TYMM' ? 'selected' : '' ?>>TYMM</option>
                        <option value="Diğer" <?= $record['program_turu'] === 'Diğer' ? 'selected' : '' ?>>Diğer</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="unite_tema">Ünite / Tema / Öğrenme Alanı</label>
                <input type="text" id="unite_tema" name="unite_tema" 
                       value="<?= e($record['unite_tema']) ?>">
            </div>
            
            <div class="form-group">
                <label for="kazanim">Kazanım / Öğrenme Çıktısı / Bölüm</label>
                <textarea id="kazanim" name="kazanim" rows="3"><?= e($record['kazanim']) ?></textarea>
            </div>
            
            <div class="form-group">
                <label for="eicerik_turu">E-İçerik Türü</label>
                <input type="text" id="eicerik_turu" name="eicerik_turu" 
                       value="<?= e($record['eicerik_turu']) ?>"
                       placeholder="Örn: Video/Etkileşimli İçerik">
            </div>
            
            <div class="form-group">
                <label for="aciklama">Açıklama</label>
                <textarea id="aciklama" name="aciklama" rows="5"><?= e($record['aciklama']) ?></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <?= $isEdit ? 'Güncelle' : 'Kaydet' ?>
                </button>
                <a href="records.php" class="btn btn-secondary">İptal</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

