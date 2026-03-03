<?php
/**
 * Toplu İşlem Handler
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

// CSRF kontrolü
if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
    setFlashError('Geçersiz istek. Lütfen tekrar deneyin.');
    header('Location: records.php');
    exit;
}

$action = $_POST['action'] ?? '';
$ids = $_POST['ids'] ?? [];

if (empty($ids) || !is_array($ids)) {
    setFlashError('Hiçbir kayıt seçilmedi.');
    header('Location: records.php');
    exit;
}

// ID'leri integer'a çevir ve filtrele
$ids = array_filter(array_map('intval', $ids), fn($id) => $id > 0);

if (empty($ids)) {
    setFlashError('Geçersiz kayıt seçimi.');
    header('Location: records.php');
    exit;
}

switch ($action) {
    case 'delete':
        $deleted = bulkDeleteRecords($ids);
        if ($deleted > 0) {
            setFlashSuccess("$deleted kayıt başarıyla silindi.");
        } else {
            setFlashError('Kayıtlar silinirken bir hata oluştu.');
        }
        break;
        
    default:
        setFlashError('Geçersiz işlem.');
}

header('Location: records.php');
exit;

