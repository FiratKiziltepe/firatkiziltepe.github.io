<?php
/**
 * Admin Platform Yapılandırma Dosyası
 * NAS üzerinde çalışacak PHP + SQLite CRUD sistemi
 */

// Hata raporlama (Production'da kapatın)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Zaman dilimi
date_default_timezone_set('Europe/Istanbul');

// Oturum ayarları
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);

// Veritabanı yolu (web root dışında tutulmalı)
define('DB_PATH', __DIR__ . '/../data/database.sqlite');

// JSON export yolları
define('JSON_EXPORT_PATH', __DIR__ . '/../data.json');
define('JSON_TEMP_PATH', __DIR__ . '/../data_temp.json');
define('VERSION_FILE_PATH', __DIR__ . '/../version.txt');

// Site ayarları
define('SITE_NAME', 'E-İçerik Yönetim Sistemi');
define('RECORDS_PER_PAGE', 25);

// CSRF token süresi (saniye)
define('CSRF_TOKEN_LIFETIME', 3600);

/**
 * Veritabanı bağlantısı
 */
function getDB(): PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO('sqlite:' . DB_PATH);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            // Foreign keys aktif
            $pdo->exec('PRAGMA foreign_keys = ON');
        } catch (PDOException $e) {
            die('Veritabanı bağlantı hatası: ' . $e->getMessage());
        }
    }
    
    return $pdo;
}

/**
 * Güvenli HTML çıktı
 */
function e(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

/**
 * CSRF token oluştur
 */
function generateCSRFToken(): string {
    if (empty($_SESSION['csrf_token']) || empty($_SESSION['csrf_token_time']) 
        || (time() - $_SESSION['csrf_token_time']) > CSRF_TOKEN_LIFETIME) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    return $_SESSION['csrf_token'];
}

/**
 * CSRF token doğrula
 */
function validateCSRFToken(string $token): bool {
    if (empty($_SESSION['csrf_token']) || empty($_SESSION['csrf_token_time'])) {
        return false;
    }
    if ((time() - $_SESSION['csrf_token_time']) > CSRF_TOKEN_LIFETIME) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Kullanıcı oturum kontrolü
 */
function requireAuth(): void {
    session_start();
    if (empty($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Yetkilendirme sonrası session regenerate
 */
function regenerateSession(): void {
    session_regenerate_id(true);
}

/**
 * Başarı mesajı set et
 */
function setFlashSuccess(string $message): void {
    $_SESSION['flash_success'] = $message;
}

/**
 * Hata mesajı set et
 */
function setFlashError(string $message): void {
    $_SESSION['flash_error'] = $message;
}

/**
 * Flash mesajları al ve temizle
 */
function getFlashMessages(): array {
    $messages = [
        'success' => $_SESSION['flash_success'] ?? null,
        'error' => $_SESSION['flash_error'] ?? null
    ];
    unset($_SESSION['flash_success'], $_SESSION['flash_error']);
    return $messages;
}

