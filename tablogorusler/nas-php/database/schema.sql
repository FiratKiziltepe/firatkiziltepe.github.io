-- phpMyAdmin'de tablogorusler veritabanını seçip bu dosyayı içe aktarın.
-- Mevcut tablolara dokunmaz; Supabase ile bağlantısı yoktur.
CREATE TABLE IF NOT EXISTS profiles (
 id CHAR(36) PRIMARY KEY,
 kullanici_adi VARCHAR(190) NOT NULL UNIQUE,
 ad_soyad VARCHAR(255) NOT NULL,
 brans VARCHAR(255) NOT NULL DEFAULT '',
 rol ENUM('admin','moderator','teacher') NOT NULL DEFAULT 'teacher',
 atanan_dersler LONGTEXT NOT NULL DEFAULT '[]' CHECK (JSON_VALID(atanan_dersler)),
 password_hash VARCHAR(255) NOT NULL,
 sifre_degistirildi TINYINT(1) NOT NULL DEFAULT 0,
 active TINYINT(1) NOT NULL DEFAULT 1,
 auth_version INT NOT NULL DEFAULT 1,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS e_icerikler (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 sira_no INT NOT NULL,
 ders_adi VARCHAR(255) NOT NULL,
 unite_tema TEXT NOT NULL,
 kazanim TEXT NOT NULL,
 e_icerik_turu TEXT NOT NULL,
 aciklama LONGTEXT NOT NULL,
 program_turu VARCHAR(255) NOT NULL DEFAULT 'TYMM',
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 INDEX idx_content_lesson (ders_adi), INDEX idx_content_order (sira_no,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS degisiklik_onerileri (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 e_icerik_id INT UNSIGNED NOT NULL,
 user_id CHAR(36) NOT NULL,
 alan VARCHAR(64) NOT NULL,
 eski_deger LONGTEXT NOT NULL,
 yeni_deger LONGTEXT NOT NULL,
 gerekce TEXT NULL,
 durum ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 onaylayan_id CHAR(36) NULL,
 red_nedeni TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 onay_tarihi DATETIME(6) NULL,
 INDEX idx_change_content (e_icerik_id, durum), INDEX idx_change_user (user_id),
 FOREIGN KEY (user_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS yeni_satir_onerileri (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 ders_adi VARCHAR(255) NOT NULL,
 unite_tema TEXT NOT NULL,
 kazanim TEXT NOT NULL,
 e_icerik_turu TEXT NOT NULL,
 aciklama LONGTEXT NOT NULL,
 program_turu VARCHAR(255) NOT NULL DEFAULT 'TYMM',
 gerekce TEXT NULL,
 durum ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 onaylayan_id CHAR(36) NULL,
 red_nedeni TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 onay_tarihi DATETIME(6) NULL,
 INDEX idx_new_user (user_id), INDEX idx_new_lesson (ders_adi),
 FOREIGN KEY (user_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS silme_talepleri (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 e_icerik_id INT UNSIGNED NOT NULL,
 user_id CHAR(36) NOT NULL,
 aciklama TEXT NULL,
 durum ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 onaylayan_id CHAR(36) NULL,
 red_nedeni TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 onay_tarihi DATETIME(6) NULL,
 INDEX idx_delete_content (e_icerik_id, durum), INDEX idx_delete_user (user_id),
 FOREIGN KEY (user_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS degisiklik_loglari (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 e_icerik_id INT UNSIGNED NULL,
 user_id CHAR(36) NOT NULL,
 islem_tipi VARCHAR(100) NOT NULL,
 alan VARCHAR(64) NULL,
 eski_deger LONGTEXT NULL,
 yeni_deger LONGTEXT NULL,
 aciklama TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 INDEX idx_log_created (created_at),
 FOREIGN KEY (user_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS app_locks (id INT PRIMARY KEY) ENGINE=InnoDB;
INSERT IGNORE INTO app_locks (id) VALUES (1);
CREATE TABLE IF NOT EXISTS login_attempts (
 attempt_key CHAR(64) PRIMARY KEY,
 attempts INT NOT NULL DEFAULT 0,
 window_started DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
