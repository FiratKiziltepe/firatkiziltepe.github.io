<?php
/**
 * Kayıt Silme İşlemi
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$id = (int) ($_GET['id'] ?? 0);
$csrf = $_GET['csrf'] ?? '';

// CSRF kontrolü
if (!validateCSRFToken($csrf)) {
    setFlashError('Geçersiz istek. Lütfen tekrar deneyin.');
    header('Location: records.php');
    exit;
}

// ID kontrolü
if ($id <= 0) {
    setFlashError('Geçersiz kayıt ID.');
    header('Location: records.php');
    exit;
}

// Kaydı sil
if (deleteRecord($id)) {
    setFlashSuccess('Kayıt başarıyla silindi.');
} else {
    setFlashError('Kayıt silinirken bir hata oluştu veya kayıt bulunamadı.');
}

header('Location: records.php');
exit;

