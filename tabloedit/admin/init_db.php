<?php
/**
 * Veritabanı Başlatma ve Migration Script
 * İlk kurulumda bir kez çalıştırılır
 * 
 * Kullanım: php init_db.php
 */

require_once __DIR__ . '/config.php';

echo "=== E-İçerik Admin Platform - Veritabanı Kurulumu ===\n\n";

// Data klasörü kontrolü
$dataDir = dirname(DB_PATH);
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
    echo "[OK] Data klasörü oluşturuldu: $dataDir\n";
}

// .htaccess oluştur (Apache için)
$htaccessPath = $dataDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "Deny from all\n");
    echo "[OK] .htaccess oluşturuldu (DB koruma)\n";
}

try {
    $pdo = getDB();
    echo "[OK] SQLite veritabanı bağlantısı başarılı\n";
    
    // Tablo: records
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sira_no INTEGER,
            ders_adi TEXT NOT NULL,
            unite_tema TEXT,
            kazanim TEXT,
            eicerik_turu TEXT,
            aciklama TEXT,
            program_turu TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "[OK] 'records' tablosu oluşturuldu\n";
    
    // Tablo: users
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "[OK] 'users' tablosu oluşturuldu\n";
    
    // Tablo: audit_log (FK constraint yok - user silinse bile log kalmalı)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            record_id INTEGER,
            old_data TEXT,
            new_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "[OK] 'audit_log' tablosu oluşturuldu\n";
    
    // Tablo: settings
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ");
    echo "[OK] 'settings' tablosu oluşturuldu\n";
    
    // Index'ler
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_records_ders ON records(ders_adi)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_records_program ON records(program_turu)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)");
    echo "[OK] Index'ler oluşturuldu\n";
    
    // Varsayılan admin kullanıcısı kontrol et
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    
    if ($userCount == 0) {
        // Varsayılan admin: admin / admin123 (İLK GİRİŞTE DEĞİŞTİRİN!)
        $defaultPassword = 'admin123';
        $hash = password_hash($defaultPassword, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->execute(['admin', $hash]);
        
        echo "\n[!] Varsayılan admin kullanıcısı oluşturuldu:\n";
        echo "    Kullanıcı: admin\n";
        echo "    Şifre: $defaultPassword\n";
        echo "    ⚠️  İLK GİRİŞTE ŞİFRENİZİ DEĞİŞTİRİN!\n";
    } else {
        echo "[OK] Kullanıcı zaten mevcut ($userCount kullanıcı)\n";
    }
    
    // version.txt oluştur
    if (!file_exists(VERSION_FILE_PATH)) {
        file_put_contents(VERSION_FILE_PATH, time());
        echo "[OK] version.txt oluşturuldu\n";
    }
    
    echo "\n=== Kurulum tamamlandı! ===\n";
    echo "Şimdi 'import.php' ile mevcut data.json'ı içe aktarabilirsiniz.\n";
    
} catch (PDOException $e) {
    echo "[HATA] Veritabanı hatası: " . $e->getMessage() . "\n";
    exit(1);
}

