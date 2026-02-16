-- =====================================================
-- RLS SORUNUNU DÜZELTME - FİNAL
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Tüm mevcut politikaları sil
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Herkes profilleri okuyabilir" ON profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profilini güncelleyebilir" ON profiles;
DROP POLICY IF EXISTS "Profile ekleme" ON profiles;

DROP POLICY IF EXISTS "e_icerikler_select" ON e_icerikler;
DROP POLICY IF EXISTS "e_icerikler_insert" ON e_icerikler;
DROP POLICY IF EXISTS "e_icerikler_update" ON e_icerikler;
DROP POLICY IF EXISTS "Herkes e-içerikleri okuyabilir" ON e_icerikler;
DROP POLICY IF EXISTS "E-icerik ekleme" ON e_icerikler;
DROP POLICY IF EXISTS "Admin ve chairman güncelleyebilir" ON e_icerikler;

-- 2. RLS'i tamamen kapat (test için)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE yeni_satir_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_loglari DISABLE ROW LEVEL SECURITY;

-- 3. Profiles tablosunu kontrol et
SELECT * FROM profiles;

-- 4. Auth users ile profiles eşleşmesini kontrol et
SELECT 
    u.id as auth_id,
    u.email,
    p.id as profile_id,
    p.tc_kimlik,
    p.ad_soyad,
    p.rol
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- =====================================================
-- ŞİMDİ GİRİŞ YAPIN VE TEST EDİN
-- Eğer çalışırsa, RLS'i geri açabiliriz
-- =====================================================

-- TC: 11111111111, Şifre: admin
-- TC: 22222222222, Şifre: fizik  
-- TC: 99999999999, Şifre: testk
