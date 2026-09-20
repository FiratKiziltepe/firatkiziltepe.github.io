-- =====================================================
-- TÜM ROLLERDEN KULLANICI OLUŞTUR
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Önce mevcut test kullanıcılarını temizle
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- 2. Admin profili (zaten auth.users'da var)
INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
SELECT id, 'ADMIN00001', 'Admin Kullanıcı', email, 'admin', NULL
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET rol = 'admin', ad_soyad = 'Admin Kullanıcı';

-- 3. Chairman (Komisyon Başkanı) - Dashboard'dan oluşturun: chairman@test.com / chairman123
-- 4. Editor - Dashboard'dan oluşturun: editor@test.com / editor123  
-- 5. Viewer - Dashboard'dan oluşturun: viewer@test.com / viewer123

-- Profil kayıtlarını ekle (auth.users'da oluşturduktan sonra)
INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
SELECT id, 'CHAIR00001', 'Fizik Komisyon Başkanı', email, 'chairman', 'Fizik'
FROM auth.users WHERE email = 'chairman@test.com'
ON CONFLICT (id) DO UPDATE SET rol = 'chairman', ad_soyad = 'Fizik Komisyon Başkanı', ders_alani = 'Fizik';

INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
SELECT id, 'EDIT000001', 'Fizik Editör', email, 'editor', 'Fizik'
FROM auth.users WHERE email = 'editor@test.com'
ON CONFLICT (id) DO UPDATE SET rol = 'editor', ad_soyad = 'Fizik Editör', ders_alani = 'Fizik';

INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
SELECT id, 'VIEW000001', 'Test Görüntüleyici', email, 'viewer', NULL
FROM auth.users WHERE email = 'viewer@test.com'
ON CONFLICT (id) DO UPDATE SET rol = 'viewer', ad_soyad = 'Test Görüntüleyici';

-- Kontrol
SELECT 
    p.email,
    p.ad_soyad,
    p.rol,
    p.ders_alani
FROM profiles p
ORDER BY 
    CASE p.rol 
        WHEN 'admin' THEN 1 
        WHEN 'chairman' THEN 2 
        WHEN 'editor' THEN 3 
        ELSE 4 
    END;

-- =====================================================
-- KULLANICI OLUŞTURMA TALİMATLARI:
-- 
-- Supabase Dashboard > Authentication > Users > Add User
-- 
-- 1. Admin (zaten var):
--    Email: admin@test.com
--    Password: admin123
--
-- 2. Chairman (Komisyon Başkanı):
--    Email: chairman@test.com  
--    Password: chairman123
--    [x] Auto Confirm User
--
-- 3. Editor:
--    Email: editor@test.com
--    Password: editor123
--    [x] Auto Confirm User
--
-- 4. Viewer:
--    Email: viewer@test.com
--    Password: viewer123
--    [x] Auto Confirm User
--
-- Kullanıcıları Dashboard'dan ekledikten sonra
-- bu SQL'i tekrar çalıştırın!
-- =====================================================
