-- =====================================================
-- E-İÇERİK TABLO YÖNETİM SİSTEMİ - SUPABASE ŞEMASI
-- =====================================================

-- 1. KULLANICILAR TABLOSU (Supabase Auth ile entegre)
-- profiles tablosu - auth.users ile ilişkili
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tc_kimlik VARCHAR(11) UNIQUE NOT NULL,
    ad_soyad VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    rol VARCHAR(20) DEFAULT 'viewer' CHECK (rol IN ('viewer', 'editor', 'chairman', 'admin')),
    ders_alani VARCHAR(100), -- Fizik, Matematik, Biyoloji vb.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. E-İÇERİKLER ANA TABLOSU
CREATE TABLE IF NOT EXISTS e_icerikler (
    id SERIAL PRIMARY KEY,
    sira_no INTEGER,
    ders_adi VARCHAR(200) NOT NULL,
    unite_tema TEXT,
    kazanim TEXT,
    e_icerik_turu VARCHAR(200),
    aciklama TEXT,
    program_turu VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DEĞİŞİKLİK ÖNERİLERİ TABLOSU
CREATE TABLE IF NOT EXISTS degisiklik_onerileri (
    id SERIAL PRIMARY KEY,
    e_icerik_id INTEGER REFERENCES e_icerikler(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    alan VARCHAR(50) NOT NULL, -- aciklama, e_icerik_turu, kazanim vb.
    eski_deger TEXT,
    yeni_deger TEXT NOT NULL,
    durum VARCHAR(20) DEFAULT 'pending' CHECK (durum IN ('pending', 'approved', 'rejected')),
    onaylayan_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    red_nedeni TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onay_tarihi TIMESTAMP WITH TIME ZONE
);

-- 4. YENİ SATIR ÖNERİLERİ TABLOSU
CREATE TABLE IF NOT EXISTS yeni_satir_onerileri (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ders_adi VARCHAR(200) NOT NULL,
    unite_tema TEXT,
    kazanim TEXT,
    e_icerik_turu VARCHAR(200),
    aciklama TEXT,
    program_turu VARCHAR(50),
    durum VARCHAR(20) DEFAULT 'pending' CHECK (durum IN ('pending', 'approved', 'rejected')),
    onaylayan_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    red_nedeni TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onay_tarihi TIMESTAMP WITH TIME ZONE
);

-- 5. DEĞİŞİKLİK LOGları TABLOSU (Admin için)
CREATE TABLE IF NOT EXISTS degisiklik_loglari (
    id SERIAL PRIMARY KEY,
    e_icerik_id INTEGER REFERENCES e_icerikler(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    islem_tipi VARCHAR(50) NOT NULL, -- create, update, delete, approve, reject
    alan VARCHAR(50),
    eski_deger TEXT,
    yeni_deger TEXT,
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- İNDEKSLER
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_e_icerikler_ders_adi ON e_icerikler(ders_adi);
CREATE INDEX IF NOT EXISTS idx_degisiklik_onerileri_durum ON degisiklik_onerileri(durum);
CREATE INDEX IF NOT EXISTS idx_degisiklik_onerileri_e_icerik ON degisiklik_onerileri(e_icerik_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tc_kimlik ON profiles(tc_kimlik);
CREATE INDEX IF NOT EXISTS idx_profiles_ders_alani ON profiles(ders_alani);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =====================================================

-- Önce rol kontrolü için güvenli fonksiyon oluştur (sonsuz döngüyü önler)
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT rol INTO user_role 
    FROM profiles 
    WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS'i etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_icerikler ENABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_onerileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE yeni_satir_onerileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE degisiklik_loglari ENABLE ROW LEVEL SECURITY;

-- PROFILES POLİTİKALARI
-- Herkes tüm profilleri okuyabilir (basit ve güvenli)
CREATE POLICY "Herkes profilleri okuyabilir" ON profiles
    FOR SELECT USING (true);

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Profile ekleme (sadece trigger ile)
CREATE POLICY "Profile ekleme" ON profiles
    FOR INSERT WITH CHECK (true);

-- E_ICERIKLER POLİTİKALARI
-- Herkes okuyabilir (login olmadan da)
CREATE POLICY "Herkes e-içerikleri okuyabilir" ON e_icerikler
    FOR SELECT USING (true);

-- Herkes ekleyebilir (migration için - sonra kısıtlanabilir)
CREATE POLICY "E-icerik ekleme" ON e_icerikler
    FOR INSERT WITH CHECK (true);

-- Sadece admin ve chairman güncelleyebilir
CREATE POLICY "Admin ve chairman güncelleyebilir" ON e_icerikler
    FOR UPDATE USING (
        auth_user_role() IN ('admin', 'chairman')
    );

-- DEĞİŞİKLİK_ÖNERİLERİ POLİTİKALARI
-- Login olan herkes görebilir
CREATE POLICY "Login olanlar önerileri görebilir" ON degisiklik_onerileri
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Editor ve üstü öneri oluşturabilir
CREATE POLICY "Editor öneri oluşturabilir" ON degisiklik_onerileri
    FOR INSERT WITH CHECK (
        auth_user_role() IN ('editor', 'chairman', 'admin')
    );

-- Chairman ve admin güncelleyebilir (onay/red)
CREATE POLICY "Chairman öneriyi güncelleyebilir" ON degisiklik_onerileri
    FOR UPDATE USING (
        auth_user_role() IN ('chairman', 'admin')
    );

-- YENİ_SATIR_ÖNERİLERİ POLİTİKALARI
CREATE POLICY "Login olanlar yeni satır önerilerini görebilir" ON yeni_satir_onerileri
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editor yeni satır önerebilir" ON yeni_satir_onerileri
    FOR INSERT WITH CHECK (
        auth_user_role() IN ('editor', 'chairman', 'admin')
    );

CREATE POLICY "Chairman yeni satır önerisini güncelleyebilir" ON yeni_satir_onerileri
    FOR UPDATE USING (
        auth_user_role() IN ('chairman', 'admin')
    );

-- DEĞİŞİKLİK_LOGLARI POLİTİKALARI
-- Sadece admin görebilir
CREATE POLICY "Sadece admin logları görebilir" ON degisiklik_loglari
    FOR SELECT USING (
        auth_user_role() = 'admin'
    );

-- Sistem log ekleyebilir (trigger ile)
CREATE POLICY "Sistem log ekleyebilir" ON degisiklik_loglari
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGER FONKSİYONLARI
-- =====================================================

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Değişiklik log fonksiyonu
CREATE OR REPLACE FUNCTION log_e_icerik_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, alan, eski_deger, yeni_deger)
        VALUES (NEW.id, auth.uid(), 'update', 'tum_satir', 
                row_to_json(OLD)::text, row_to_json(NEW)::text);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, yeni_deger)
        VALUES (NEW.id, auth.uid(), 'create', row_to_json(NEW)::text);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, eski_deger)
        VALUES (OLD.id, auth.uid(), 'delete', row_to_json(OLD)::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Öneri onaylandığında e_icerikler tablosunu güncelle
CREATE OR REPLACE FUNCTION apply_approved_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.durum = 'approved' AND OLD.durum = 'pending' THEN
        -- Alan adına göre güncelleme yap
        EXECUTE format(
            'UPDATE e_icerikler SET %I = $1, updated_at = NOW() WHERE id = $2',
            NEW.alan
        ) USING NEW.yeni_deger, NEW.e_icerik_id;
        
        -- Log kaydet
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, alan, eski_deger, yeni_deger, aciklama)
        VALUES (NEW.e_icerik_id, NEW.onaylayan_id, 'approve', NEW.alan, NEW.eski_deger, NEW.yeni_deger, 
                'Öneri onaylandı');
    ELSIF NEW.durum = 'rejected' AND OLD.durum = 'pending' THEN
        -- Reddetme logu
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, alan, aciklama)
        VALUES (NEW.e_icerik_id, NEW.onaylayan_id, 'reject', NEW.alan, 
                COALESCE(NEW.red_nedeni, 'Öneri reddedildi'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni satır önerisi onaylandığında e_icerikler'e ekle
CREATE OR REPLACE FUNCTION apply_approved_new_row()
RETURNS TRIGGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    IF NEW.durum = 'approved' AND OLD.durum = 'pending' THEN
        INSERT INTO e_icerikler (ders_adi, unite_tema, kazanim, e_icerik_turu, aciklama, program_turu)
        VALUES (NEW.ders_adi, NEW.unite_tema, NEW.kazanim, NEW.e_icerik_turu, NEW.aciklama, NEW.program_turu)
        RETURNING id INTO new_id;
        
        -- Log kaydet
        INSERT INTO degisiklik_loglari (e_icerik_id, user_id, islem_tipi, aciklama)
        VALUES (new_id, NEW.onaylayan_id, 'create', 'Yeni satır önerisi onaylandı');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRİGGERLAR
-- =====================================================

-- Updated_at triggerları
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_e_icerikler_updated_at
    BEFORE UPDATE ON e_icerikler
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Değişiklik log triggeri
CREATE TRIGGER log_e_icerik_changes
    AFTER INSERT OR UPDATE OR DELETE ON e_icerikler
    FOR EACH ROW EXECUTE FUNCTION log_e_icerik_change();

-- Öneri onaylandığında uygula
CREATE TRIGGER apply_change_on_approval
    AFTER UPDATE ON degisiklik_onerileri
    FOR EACH ROW EXECUTE FUNCTION apply_approved_change();

-- Yeni satır onaylandığında ekle
CREATE TRIGGER apply_new_row_on_approval
    AFTER UPDATE ON yeni_satir_onerileri
    FOR EACH ROW EXECUTE FUNCTION apply_approved_new_row();

-- =====================================================
-- YARDIMCI FONKSİYONLAR
-- =====================================================

-- Kullanıcı rolünü getir
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT rol INTO user_role FROM profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı ders alanını getir
CREATE OR REPLACE FUNCTION get_user_ders_alani()
RETURNS TEXT AS $$
DECLARE
    ders TEXT;
BEGIN
    SELECT ders_alani INTO ders FROM profiles WHERE id = auth.uid();
    RETURN ders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bekleyen öneri sayısını getir (chairman için)
CREATE OR REPLACE FUNCTION get_pending_count(p_ders_alani TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    count_val INTEGER;
BEGIN
    IF p_ders_alani IS NULL THEN
        SELECT COUNT(*) INTO count_val FROM degisiklik_onerileri WHERE durum = 'pending';
    ELSE
        SELECT COUNT(*) INTO count_val 
        FROM degisiklik_onerileri deg
        JOIN e_icerikler e ON deg.e_icerik_id = e.id
        WHERE deg.durum = 'pending' 
        AND e.ders_adi LIKE '%' || p_ders_alani || '%';
    END IF;
    RETURN count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- YENİ KULLANICI OLUŞTURMA FONKSİYONU
-- (Supabase Auth trigger için)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, tc_kimlik, ad_soyad, email, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'tc_kimlik', ''),
        COALESCE(NEW.raw_user_meta_data->>'ad_soyad', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'rol', 'viewer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth trigger (yeni kullanıcı kaydında profile oluştur)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
