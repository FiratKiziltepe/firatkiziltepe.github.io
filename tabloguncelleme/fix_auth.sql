-- =====================================================
-- AUTH VE RLS SORUNLARINI DÜZELTME
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Herkes profilleri okuyabilir" ON profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profilini güncelleyebilir" ON profiles;
DROP POLICY IF EXISTS "Profile ekleme" ON profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profilini görebilir" ON profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri görebilir" ON profiles;

-- 2. RLS'i geçici olarak kapat (migration için)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler DISABLE ROW LEVEL SECURITY;

-- 3. Auth trigger'ı düzelt
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'tc_kimlik', ''),
        COALESCE(NEW.raw_user_meta_data->>'ad_soyad', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'rol', 'viewer'),
        NEW.raw_user_meta_data->>'ders_alani'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Mevcut test kullanıcılarını temizle
DELETE FROM profiles WHERE tc_kimlik IN ('11111111111', '22222222222', '22222222223', '99999999999');
DELETE FROM auth.users WHERE email LIKE '%@eicerik.local';

-- 5. Basit test kullanıcısı oluştur
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Admin kullanıcı
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        '11111111111@eicerik.local',
        crypt('admin', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"tc_kimlik": "11111111111", "ad_soyad": "Admin Kullanıcı", "rol": "admin"}'::jsonb,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        ''
    );
    
    -- Profile manuel ekle
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '11111111111', 'Admin Kullanıcı', '11111111111@eicerik.local', 'admin', NULL)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Admin kullanıcı oluşturuldu: %', new_user_id;
END $$;

-- 6. Fizik editör oluştur
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        '22222222222@eicerik.local',
        crypt('fizik', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"tc_kimlik": "22222222222", "ad_soyad": "Fizik Başkan", "rol": "chairman", "ders_alani": "Fizik"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated', ''
    );
    
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '22222222222', 'Fizik Başkan', '22222222222@eicerik.local', 'chairman', 'Fizik')
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 7. Test viewer oluştur
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        '99999999999@eicerik.local',
        crypt('testk', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"tc_kimlik": "99999999999", "ad_soyad": "Test Kullanıcı", "rol": "viewer"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated', ''
    );
    
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '99999999999', 'Test Kullanıcı', '99999999999@eicerik.local', 'viewer', NULL)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 8. RLS'i basit şekilde aç
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler ENABLE ROW LEVEL SECURITY;

-- Basit politikalar - herkes okuyabilir
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "e_icerikler_select" ON e_icerikler FOR SELECT USING (true);
CREATE POLICY "e_icerikler_insert" ON e_icerikler FOR INSERT WITH CHECK (true);
CREATE POLICY "e_icerikler_update" ON e_icerikler FOR UPDATE USING (true);

-- 9. Kullanıcıları kontrol et
SELECT 
    u.email,
    p.tc_kimlik,
    p.ad_soyad,
    p.rol,
    p.ders_alani
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@eicerik.local';

-- =====================================================
-- TEST GİRİŞ BİLGİLERİ
-- =====================================================
/*
TC Kimlik: 11111111111, Şifre: admin (Admin)
TC Kimlik: 22222222222, Şifre: fizik (Fizik Başkan)
TC Kimlik: 99999999999, Şifre: testk (Viewer)
*/
