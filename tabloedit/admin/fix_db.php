<?php
/**
 * Veritabanı Düzeltme Script
 * Foreign key constraint hatasını düzeltir
 * 
 * Kullanım: php fix_db.php
 */

require_once __DIR__ . '/config.php';

echo "=== Veritabanı Düzeltme ===\n\n";

try {
    $pdo = getDB();
    
    // Foreign keys'i geçici olarak kapat
    $pdo->exec('PRAGMA foreign_keys = OFF');
    
    // Mevcut audit_log tablosunu yedekle ve yeniden oluştur
    $pdo->beginTransaction();
    
    // Yeni tablo oluştur (FK olmadan)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS audit_log_new (
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
    
    // Eski verileri aktar
    $pdo->exec("
        INSERT INTO audit_log_new (id, user_id, username, action, record_id, old_data, new_data, created_at)
        SELECT id, user_id, username, action, record_id, old_data, new_data, created_at
        FROM audit_log
    ");
    
    // Eski tabloyu sil
    $pdo->exec("DROP TABLE audit_log");
    
    // Yeni tabloyu yeniden adlandır
    $pdo->exec("ALTER TABLE audit_log_new RENAME TO audit_log");
    
    // Index'i yeniden oluştur
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)");
    
    $pdo->commit();
    
    echo "[OK] audit_log tablosu düzeltildi (FK constraint kaldırıldı)\n";
    echo "\n=== Düzeltme tamamlandı! ===\n";
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "[HATA] " . $e->getMessage() . "\n";
    exit(1);
}

