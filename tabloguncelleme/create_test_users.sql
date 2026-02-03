-- =====================================================
-- TEST KULLANICILARI OLUŞTURMA
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Önce pgcrypto extension'ı etkinleştir (şifre hash için)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- KULLANICI EKLEME FONKSİYONU
-- =====================================================
CREATE OR REPLACE FUNCTION create_test_user(
    p_tc_kimlik TEXT,
    p_ad_soyad TEXT,
    p_rol TEXT,
    p_ders_alani TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    user_email TEXT;
    user_password TEXT;
BEGIN
    -- Email formatı: TC@eicerik.local
    user_email := p_tc_kimlik || '@eicerik.local';
    
    -- Şifre: Ad soyadın ilk 5 harfi küçük harf (boşluksuz)
    user_password := LOWER(REPLACE(LEFT(p_ad_soyad, 5), ' ', ''));
    
    -- Auth.users tablosuna ekle
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
        aud
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'tc_kimlik', p_tc_kimlik,
            'ad_soyad', p_ad_soyad,
            'rol', p_rol
        ),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    )
    RETURNING id INTO new_user_id;
    
    -- Profiles tablosuna ekle (trigger çalışmazsa manuel)
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
    VALUES (new_user_id, p_tc_kimlik, p_ad_soyad, user_email, p_rol, p_ders_alani)
    ON CONFLICT (id) DO UPDATE SET
        tc_kimlik = EXCLUDED.tc_kimlik,
        ad_soyad = EXCLUDED.ad_soyad,
        rol = EXCLUDED.rol,
        ders_alani = EXCLUDED.ders_alani;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TEST KULLANICILARINI OLUŞTUR
-- =====================================================

-- 1. ADMIN KULLANICI
SELECT create_test_user('11111111111', 'Admin Kullanıcı', 'admin', NULL);

-- 2. FİZİK KOMİSYON BAŞKANI
SELECT create_test_user('22222222222', 'Fizik Başkan', 'chairman', 'Fizik');

-- 3. FİZİK EDİTÖRLERİ
SELECT create_test_user('22222222223', 'Fizik Editör Bir', 'editor', 'Fizik');
SELECT create_test_user('22222222224', 'Fizik Editör İki', 'editor', 'Fizik');
SELECT create_test_user('22222222225', 'Fizik Editör Üç', 'editor', 'Fizik');

-- 4. MATEMATİK KOMİSYON BAŞKANI
SELECT create_test_user('33333333333', 'Matematik Başkan', 'chairman', 'Matematik');

-- 5. MATEMATİK EDİTÖRLERİ
SELECT create_test_user('33333333334', 'Matematik Editör Bir', 'editor', 'Matematik');
SELECT create_test_user('33333333335', 'Matematik Editör İki', 'editor', 'Matematik');

-- 6. BİYOLOJİ KOMİSYON BAŞKANI
SELECT create_test_user('44444444444', 'Biyoloji Başkan', 'chairman', 'Biyoloji');

-- 7. BİYOLOJİ EDİTÖRLERİ
SELECT create_test_user('44444444445', 'Biyoloji Editör', 'editor', 'Biyoloji');

-- 8. KİMYA KOMİSYON BAŞKANI
SELECT create_test_user('55555555555', 'Kimya Başkan', 'chairman', 'Kimya');

-- 9. TÜRKÇE KOMİSYON BAŞKANI
SELECT create_test_user('66666666666', 'Türkçe Başkan', 'chairman', 'Türkçe');

-- 10. NORMAL GÖRÜNTÜLEYICI
SELECT create_test_user('99999999999', 'Test Kullanıcı', 'viewer', NULL);

-- =====================================================
-- OLUŞTURULAN KULLANICILARI GÖRÜNTÜLE
-- =====================================================
SELECT 
    p.tc_kimlik,
    p.ad_soyad,
    p.rol,
    p.ders_alani,
    LOWER(REPLACE(LEFT(p.ad_soyad, 5), ' ', '')) as sifre
FROM profiles p
ORDER BY 
    CASE p.rol 
        WHEN 'admin' THEN 1 
        WHEN 'chairman' THEN 2 
        WHEN 'editor' THEN 3 
        ELSE 4 
    END,
    p.ders_alani;

-- =====================================================
-- GİRİŞ BİLGİLERİ
-- =====================================================
/*
+---------------+----------------------+----------+-----------+-------+
| TC Kimlik     | Ad Soyad             | Rol      | Ders      | Şifre |
+---------------+----------------------+----------+-----------+-------+
| 11111111111   | Admin Kullanıcı      | admin    | -         | admin |
| 22222222222   | Fizik Başkan         | chairman | Fizik     | fizik |
| 22222222223   | Fizik Editör Bir     | editor   | Fizik     | fizik |
| 22222222224   | Fizik Editör İki     | editor   | Fizik     | fizik |
| 22222222225   | Fizik Editör Üç      | editor   | Fizik     | fizik |
| 33333333333   | Matematik Başkan     | chairman | Matematik | matem |
| 33333333334   | Matematik Editör Bir | editor   | Matematik | matem |
| 33333333335   | Matematik Editör İki | editor   | Matematik | matem |
| 44444444444   | Biyoloji Başkan      | chairman | Biyoloji  | biyol |
| 44444444445   | Biyoloji Editör      | editor   | Biyoloji  | biyol |
| 55555555555   | Kimya Başkan         | chairman | Kimya     | kimya |
| 66666666666   | Türkçe Başkan        | chairman | Türkçe    | türkç |
| 99999999999   | Test Kullanıcı       | viewer   | -         | testk |
+---------------+----------------------+----------+-----------+-------+
*/
