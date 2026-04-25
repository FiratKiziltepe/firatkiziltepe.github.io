-- Önce eski kayıtları temizle
DELETE FROM profiles WHERE tc_kimlik = '11111111111';
DELETE FROM profiles WHERE email = 'admin@test.com';

-- Admin kullanıcısının profile kaydını oluştur
INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol, ders_alani)
SELECT 
    id,
    'ADMIN00001',
    'Admin Kullanıcı',
    email,
    'admin',
    NULL
FROM auth.users 
WHERE email = 'admin@test.com';

-- Kontrol et
SELECT * FROM profiles;
