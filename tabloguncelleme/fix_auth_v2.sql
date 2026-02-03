-- =====================================================
-- AUTH SORUNLARINI DÜZELTME V2
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Trigger'ı devre dışı bırak (çakışmayı önlemek için)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Mevcut kullanıcıları tamamen temizle
DELETE FROM auth.identities;
DELETE FROM profiles;
DELETE FROM auth.users;

-- 3. RLS'i kapat
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Mevcut politikaları temizle
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

-- 4. Admin kullanıcı oluştur (identities dahil)
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Auth users
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        '11111111111@eicerik.local',
        crypt('admin', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"tc_kimlik": "11111111111", "ad_soyad": "Admin Kullanıcı", "rol": "admin"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated', ''
    );
    
    -- Auth identities (ÖNEMLİ!)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', '11111111111@eicerik.local'),
        'email',
        new_user_id::text,
        NOW(), NOW(), NOW()
    );
    
    -- Profile
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '11111111111', 'Admin Kullanıcı', '11111111111@eicerik.local', 'admin', NULL);
    
    RAISE NOTICE 'Admin oluşturuldu: %', new_user_id;
END $$;

-- 5. Fizik Başkan oluştur
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        '22222222222@eicerik.local',
        crypt('fizik', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"tc_kimlik": "22222222222", "ad_soyad": "Fizik Başkan", "rol": "chairman"}'::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated', ''
    );
    
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', '22222222222@eicerik.local'),
        'email',
        new_user_id::text,
        NOW(), NOW(), NOW()
    );
    
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '22222222222', 'Fizik Başkan', '22222222222@eicerik.local', 'chairman', 'Fizik');
END $$;

-- 6. Test Viewer oluştur
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, role, aud, confirmation_token
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
    
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', '99999999999@eicerik.local'),
        'email',
        new_user_id::text,
        NOW(), NOW(), NOW()
    );
    
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, '99999999999', 'Test Kullanıcı', '99999999999@eicerik.local', 'viewer', NULL);
END $$;

-- 7. RLS'i aç ve basit politikalar ekle
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Sonucu kontrol et
SELECT 
    u.email,
    u.id,
    p.tc_kimlik,
    p.ad_soyad,
    p.rol,
    i.provider
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email LIKE '%@eicerik.local';

-- =====================================================
-- GİRİŞ BİLGİLERİ:
-- TC: 11111111111, Şifre: admin (Admin)
-- TC: 22222222222, Şifre: fizik (Chairman)
-- TC: 99999999999, Şifre: testk (Viewer)
-- =====================================================
