-- =====================================================
-- SİSTEMİ SIFIRLAMA VE YENİDEN KURMA (SADELEŞTİRİLMİŞ)
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Önceki tüm yapıları temizle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS degisiklik_loglari;
DROP TABLE IF EXISTS yeni_satir_onerileri;
DROP TABLE IF EXISTS degisiklik_onerileri;
DROP TABLE IF EXISTS e_icerikler;
DROP TABLE IF EXISTS profiles;

-- 2. Profiller Tablosu
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tc_kimlik TEXT,
    ad_soyad TEXT,
    email TEXT,
    rol TEXT DEFAULT 'viewer', -- viewer, editor, chairman, admin
    ders_alani TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. E-İçerikler Tablosu
CREATE TABLE e_icerikler (
    id SERIAL PRIMARY KEY,
    sira_no INTEGER,
    ders_adi TEXT,
    unite_tema TEXT,
    kazanim TEXT,
    e_icerik_turu TEXT,
    aciklama TEXT,
    program_turu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Değişiklik Önerileri
CREATE TABLE degisiklik_onerileri (
    id SERIAL PRIMARY KEY,
    e_icerik_id INTEGER REFERENCES e_icerikler(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    alan TEXT,
    eski_deger TEXT,
    yeni_deger TEXT,
    durum TEXT DEFAULT 'pending', -- pending, approved, rejected
    onaylayan_id UUID REFERENCES profiles(id),
    red_nedeni TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Yeni Satır Önerileri
CREATE TABLE yeni_satir_onerileri (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    ders_adi TEXT,
    unite_tema TEXT,
    kazanim TEXT,
    e_icerik_turu TEXT,
    aciklama TEXT,
    program_turu TEXT,
    durum TEXT DEFAULT 'pending',
    onaylayan_id UUID REFERENCES profiles(id),
    red_nedeni TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Log Tablosu
CREATE TABLE degisiklik_loglari (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    islem_tipi TEXT,
    detay TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RLS'i Devre Dışı Bırak (Sorunsuz Erişim İçin)
-- Proje canlıya geçene kadar RLS kapalı kalsın, uygulama seviyesinde kontrol ediyoruz
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE yeni_satir_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_loglari DISABLE ROW LEVEL SECURITY;

-- 8. Mevcut Auth Kullanıcılarını Profile'a Ekle (Senkronizasyon)
INSERT INTO profiles (id, email, rol, ad_soyad)
SELECT id, email, 
    CASE 
        WHEN email LIKE 'admin%' THEN 'admin'
        WHEN email LIKE 'fizik%' THEN 'chairman'
        ELSE 'viewer'
    END,
    split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Admin kullanıcısını güncelle (varsa)
UPDATE profiles SET rol = 'admin', ders_alani = NULL WHERE email LIKE 'admin%';
UPDATE profiles SET rol = 'chairman', ders_alani = 'Fizik' WHERE email LIKE 'fizik%';
