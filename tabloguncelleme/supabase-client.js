/**
 * Supabase Client Konfigürasyonu
 * 
 * KURULUM:
 * 1. Supabase projenizi oluşturun: https://supabase.com
 * 2. Aşağıdaki değerleri kendi projenizden alın
 * 3. supabase-schema.sql dosyasını SQL Editor'da çalıştırın
 */

// Supabase Konfigürasyonu - KENDİ DEĞERLERİNİZLE DEĞİŞTİRİN
const SUPABASE_URL = 'https://prtogxfwngpkgmyzeirg.supabase.co'; // Örn: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_JYoKPSYwVis9oM8j6tA7Og_d9t2EHgB'; // Anon/Public key

// Supabase Client (CDN üzerinden yüklenen supabase-js kullanır)
let supabaseClient = null;

/**
 * Supabase client'ı başlat
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase JS kütüphanesi yüklenmedi!');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    return supabaseClient;
}

/**
 * Supabase client'ı getir
 */
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// =====================================================
// VERİTABANI İŞLEMLERİ
// =====================================================

/**
 * E-içerikleri getir (sayfalama ve filtreleme ile)
 */
async function fetchEIcerikler(options = {}) {
    const sb = getSupabase();
    const {
        page = 1,
        pageSize = 25,
        dersAdi = null,
        searchTerm = null,
        programTuru = null
    } = options;
    
    let query = sb
        .from('e_icerikler')
        .select('*', { count: 'exact' });
    
    // Filtreleme
    if (dersAdi && dersAdi.length > 0) {
        query = query.in('ders_adi', dersAdi);
    }
    
    if (programTuru) {
        query = query.eq('program_turu', programTuru);
    }
    
    if (searchTerm) {
        query = query.or(`ders_adi.ilike.%${searchTerm}%,kazanim.ilike.%${searchTerm}%,aciklama.ilike.%${searchTerm}%`);
    }
    
    // Sayfalama
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query
        .order('id', { ascending: true })
        .range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
        console.error('Veri çekme hatası:', error);
        throw error;
    }
    
    return { data, count };
}

/**
 * Tek bir e-içerik getir
 */
async function fetchEIcerikById(id) {
    const sb = getSupabase();
    
    const { data, error } = await sb
        .from('e_icerikler')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Benzersiz ders adlarını getir
 */
async function fetchDersAdlari() {
    const sb = getSupabase();
    
    const { data, error } = await sb
        .from('e_icerikler')
        .select('ders_adi')
        .order('ders_adi');
    
    if (error) throw error;
    
    // Benzersiz değerleri al
    const unique = [...new Set(data.map(d => d.ders_adi))].filter(d => d);
    return unique;
}

// =====================================================
// DEĞİŞİKLİK ÖNERİSİ İŞLEMLERİ
// =====================================================

/**
 * Değişiklik önerisi oluştur
 */
async function createDegisiklikOnerisi(eIcerikId, alan, eskiDeger, yeniDeger) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) {
        throw new Error('Öneri oluşturmak için giriş yapmalısınız');
    }
    
    const { data, error } = await sb
        .from('degisiklik_onerileri')
        .insert({
            e_icerik_id: eIcerikId,
            user_id: user.id,
            alan: alan,
            eski_deger: eskiDeger,
            yeni_deger: yeniDeger,
            durum: 'pending'
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Bekleyen önerileri getir
 */
async function fetchBekleyenOneriler(dersAlani = null) {
    const sb = getSupabase();
    
    let query = sb
        .from('degisiklik_onerileri')
        .select(`
            *,
            e_icerikler (id, ders_adi, kazanim),
            profiles!degisiklik_onerileri_user_id_fkey (ad_soyad)
        `)
        .eq('durum', 'pending')
        .order('created_at', { ascending: false });
    
    // Ders alanına göre filtrele (chairman için)
    if (dersAlani) {
        query = query.ilike('e_icerikler.ders_adi', `%${dersAlani}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
}

/**
 * Bir e-içerik için bekleyen önerileri getir
 */
async function fetchOneriByEIcerik(eIcerikId) {
    const sb = getSupabase();
    
    const { data, error } = await sb
        .from('degisiklik_onerileri')
        .select(`
            *,
            profiles!degisiklik_onerileri_user_id_fkey (ad_soyad)
        `)
        .eq('e_icerik_id', eIcerikId)
        .eq('durum', 'pending');
    
    if (error) throw error;
    return data;
}

/**
 * Öneriyi onayla
 */
async function approveOneri(oneriId) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    const { data, error } = await sb
        .from('degisiklik_onerileri')
        .update({
            durum: 'approved',
            onaylayan_id: user.id,
            onay_tarihi: new Date().toISOString()
        })
        .eq('id', oneriId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Öneriyi reddet
 */
async function rejectOneri(oneriId, redNedeni = null) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    const { data, error } = await sb
        .from('degisiklik_onerileri')
        .update({
            durum: 'rejected',
            onaylayan_id: user.id,
            onay_tarihi: new Date().toISOString(),
            red_nedeni: redNedeni
        })
        .eq('id', oneriId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// =====================================================
// YENİ SATIR ÖNERİSİ İŞLEMLERİ
// =====================================================

/**
 * Yeni satır önerisi oluştur
 */
async function createYeniSatirOnerisi(satir) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) {
        throw new Error('Öneri oluşturmak için giriş yapmalısınız');
    }
    
    const { data, error } = await sb
        .from('yeni_satir_onerileri')
        .insert({
            user_id: user.id,
            ders_adi: satir.ders_adi,
            unite_tema: satir.unite_tema,
            kazanim: satir.kazanim,
            e_icerik_turu: satir.e_icerik_turu,
            aciklama: satir.aciklama,
            program_turu: satir.program_turu,
            durum: 'pending'
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Yeni satır önerilerini getir
 */
async function fetchYeniSatirOnerileri(dersAlani = null) {
    const sb = getSupabase();
    
    let query = sb
        .from('yeni_satir_onerileri')
        .select(`
            *,
            profiles!yeni_satir_onerileri_user_id_fkey (ad_soyad)
        `)
        .eq('durum', 'pending')
        .order('created_at', { ascending: false });
    
    if (dersAlani) {
        query = query.ilike('ders_adi', `%${dersAlani}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
}

/**
 * Yeni satır önerisini onayla
 */
async function approveYeniSatir(oneriId) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    const { data, error } = await sb
        .from('yeni_satir_onerileri')
        .update({
            durum: 'approved',
            onaylayan_id: user.id,
            onay_tarihi: new Date().toISOString()
        })
        .eq('id', oneriId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Yeni satır önerisini reddet
 */
async function rejectYeniSatir(oneriId, redNedeni = null) {
    const sb = getSupabase();
    const user = await getCurrentUser();
    
    const { data, error } = await sb
        .from('yeni_satir_onerileri')
        .update({
            durum: 'rejected',
            onaylayan_id: user.id,
            onay_tarihi: new Date().toISOString(),
            red_nedeni: redNedeni
        })
        .eq('id', oneriId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// =====================================================
// ADMIN LOG İŞLEMLERİ
// =====================================================

/**
 * Değişiklik loglarını getir (Admin için)
 */
async function fetchDegisiklikLoglari(limit = 100) {
    const sb = getSupabase();
    
    const { data, error } = await sb
        .from('degisiklik_loglari')
        .select(`
            *,
            profiles!degisiklik_loglari_user_id_fkey (ad_soyad),
            e_icerikler (ders_adi, kazanim)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) throw error;
    return data;
}

// =====================================================
// CHAIRMAN İÇİN DOĞRUDAN DÜZENLEME
// =====================================================

/**
 * E-içeriği doğrudan güncelle (Chairman/Admin)
 */
async function updateEIcerik(id, updates) {
    const sb = getSupabase();
    
    const { data, error } = await sb
        .from('e_icerikler')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        getSupabase,
        fetchEIcerikler,
        fetchEIcerikById,
        fetchDersAdlari,
        createDegisiklikOnerisi,
        fetchBekleyenOneriler,
        fetchOneriByEIcerik,
        approveOneri,
        rejectOneri,
        createYeniSatirOnerisi,
        fetchYeniSatirOnerileri,
        approveYeniSatir,
        rejectYeniSatir,
        fetchDegisiklikLoglari,
        updateEIcerik
    };
}
