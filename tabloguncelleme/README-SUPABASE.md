# E-İçerik Tablo Yönetim Sistemi - Supabase Kurulum Rehberi

## Genel Bakış

Bu sistem, e-içerik tablosunu Supabase veritabanı ile yönetmenizi sağlar. Kullanıcı rolleri ile değişiklik önerisi ve onay sistemi içerir.

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| **viewer** | Sadece tabloyu görüntüleme |
| **editor** | Görüntüleme + değişiklik önerisi oluşturma |
| **chairman** | Görüntüleme + kendi ders alanında onay/red |
| **admin** | Tüm yetkiler + log görüntüleme |

## Kurulum Adımları

### 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni bir proje oluşturun
3. Proje URL ve API anahtarlarını kaydedin

### 2. Veritabanı Şemasını Oluşturma

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. `supabase-schema.sql` dosyasının içeriğini yapıştırın
4. "Run" butonuna tıklayın

### 3. Supabase Ayarlarını Yapılandırma

`supabase-client.js` dosyasını açın ve şu değerleri kendi Supabase projenizden alarak güncelleyin:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 4. Verileri Migrate Etme

#### Python ile:

```bash
# Gereksinimleri yükle
pip install supabase

# Environment variable'ları ayarla (Windows)
set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
set SUPABASE_SERVICE_KEY=your-service-role-key

# Script'i çalıştır
python migrate_to_supabase.py
```

### 5. Kullanıcı Oluşturma

Supabase Dashboard > Authentication > Users bölümünden kullanıcı oluşturun:

**Email formatı:** `TC_KIMLIK@eicerik.local` (örn: `12345678901@eicerik.local`)

**Şifre:** Ad soyadın ilk 5 harfi küçük harf (örn: "Ahmet Yılmaz" için şifre: "ahmet")

**User Metadata (JSON):**
```json
{
  "tc_kimlik": "12345678901",
  "ad_soyad": "Ahmet Yılmaz",
  "rol": "editor"
}
```

### Örnek Kullanıcılar

| TC Kimlik | Ad Soyad | Şifre | Rol | Ders Alanı |
|-----------|----------|-------|-----|------------|
| 12345678901 | Admin User | admin | admin | - |
| 12345678902 | Fizik Başkan | fizik | chairman | Fizik |
| 12345678903 | Fizik Editor | fizik | editor | Fizik |

## Kullanım

### Giriş Yapılmadan
- Tablo salt okunur olarak görüntülenir
- Filtreleme ve arama yapılabilir
- Excel'e export edilebilir

### Editor Olarak Giriş
- Kendi ders alanındaki satırlarda değişiklik önerebilir
- Yeni satır önerebilir
- Öneriler sarı renk ile işaretlenir

### Chairman Olarak Giriş
- Kendi ders alanındaki önerileri görebilir
- Önerileri onaylayabilir veya reddedebilir
- Doğrudan düzenleme yapabilir

### Admin Olarak Giriş
- Tüm önerileri görebilir
- Tüm derslerde işlem yapabilir
- Değişiklik loglarını görüntüleyebilir

## Dosya Yapısı

```
tabloguncelleme/
├── index.html          # Ana sayfa
├── style.css           # Stiller
├── script.js           # Ana uygulama mantığı
├── supabase-client.js  # Supabase bağlantı ve CRUD
├── auth.js             # Kimlik doğrulama
├── panel.js            # Chairman/Admin panelleri
├── supabase-schema.sql # Veritabanı şeması
├── migrate_to_supabase.py  # Veri migration script
├── data.json           # Orijinal JSON veri (fallback)
└── README-SUPABASE.md  # Bu dosya
```

## Değişiklik İzleme (Word Tarzı)

- **Sarı arka plan:** Bekleyen öneri
- **Yeşil arka plan:** Onaylanmış ekleme
- **Kırmızı üstü çizili:** Silinen/değiştirilen metin

## Sorun Giderme

### Supabase bağlantı hatası
- URL ve API key'lerin doğru olduğundan emin olun
- RLS politikalarının aktif olduğunu kontrol edin

### Giriş yapılamıyor
- Email formatının doğru olduğundan emin olun (`TC@eicerik.local`)
- Şifrenin ad soyadın ilk 5 harfi olduğunu kontrol edin

### Veri görünmüyor
- `e_icerikler` tablosunda veri olduğunu kontrol edin
- RLS politikalarının SELECT için "true" olduğunu doğrulayın

## Güvenlik Notları

- Service Role Key'i asla frontend'de kullanmayın
- Anon Key frontend için güvenlidir (RLS ile korunur)
- TC Kimlik numaraları hassas veridir, HTTPS kullanın
