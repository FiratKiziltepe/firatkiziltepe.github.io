-- =====================================================
-- SCHEMA HATASINI DÜZELTME
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Sorunlu fonksiyonları sil (CASCADE ile bağımlı politikaları da siler)
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_ders_alani() CASCADE;
DROP FUNCTION IF EXISTS get_pending_count(TEXT) CASCADE;

-- 2. Handle new user trigger'ı sil (sorun çıkarıyor olabilir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Log trigger'larını sil
DROP TRIGGER IF EXISTS log_e_icerik_changes ON e_icerikler;
DROP FUNCTION IF EXISTS log_e_icerik_change();

-- 4. Onay trigger'larını sil
DROP TRIGGER IF EXISTS apply_change_on_approval ON degisiklik_onerileri;
DROP TRIGGER IF EXISTS apply_new_row_on_approval ON yeni_satir_onerileri;
DROP FUNCTION IF EXISTS apply_approved_change();
DROP FUNCTION IF EXISTS apply_approved_new_row();

-- 5. Update trigger'ları sil
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_e_icerikler_updated_at ON e_icerikler;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 6. RLS'i kapat
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE yeni_satir_onerileri DISABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_loglari DISABLE ROW LEVEL SECURITY;

-- 7. Tüm politikaları sil
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 8. Şimdi kontrol et
SELECT 'Fonksiyonlar temizlendi' as status;

-- 9. Kullanıcıları kontrol et
SELECT 
    u.email,
    p.tc_kimlik,
    p.ad_soyad,
    p.rol
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- =====================================================
-- ŞİMDİ TEKRAR GİRİŞ DENEYİN
-- TC: 11111111111, Şifre: admin
-- =====================================================
