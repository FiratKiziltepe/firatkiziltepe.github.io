# Kantin Defteri

Kantin Defteri; müşterilerin yalnızca kendi yiyip içtiklerini, kantincilerin ise tüm müşteri hesaplarını görebildiği şeffaf bir haftalık hesap uygulamasıdır. Sipariş veya ödeme almaz. Haftalar pazartesi-cuma olarak izlenir ve hesap yalnızca **Ödendi / Ödenmedi** durumundadır.

## Özellikler

- Kullanıcı adı ve parola ile giriş; e-posta ekranı veya doğrulaması yoktur.
- Kantinci uygulama içinden müşteri oluşturur ve geçici parola verir.
- Birden fazla kantinci desteklenir; yalnızca yönetici kantinci başka kantinci/yönetici oluşturabilir.
- Müşteri yalnızca kendi kayıtlarını görür, en fazla iki gün geriye kayıt ekleyebilir.
- Müşteri son iki gündeki kaydı zorunlu gerekçeyle düzeltebilir; eski ve yeni değer revizyon geçmişinde saklanır.
- Kantinci tüm kayıtları ekleyebilir/düzeltebilir, kategori ve ürün/fiyat listesini yönetebilir.
- Fiyat değişikliği eski hesapları etkilemez; tüketim anındaki birim fiyat kayda sabitlenir.
- Ödendi yapılan hafta kilitlenir; kantinci gerekirse yeniden açabilir.
- Mobil, tablet ve masaüstüne uyumlu React arayüzü.
- Supabase Row Level Security (RLS), veritabanı doğrulamaları ve denetim kayıtları.

## Teknoloji

- React 19 + TypeScript + Vite
- Supabase Auth, PostgreSQL, Row Level Security ve Edge Functions
- GitHub Pages

## Yerel arayüz önizlemesi

Supabase kurmadan tasarımı ve akışları görmek için:

```powershell
npm ci
Copy-Item .env.example .env.local
```

`.env.local` içinde `VITE_DEMO_MODE=true` yapın, ardından:

```powershell
npm run dev
```

Demo hesapları:

| Rol | Kullanıcı adı | Parola |
| --- | --- | --- |
| Yönetici kantinci | `yonetici` | `Kantin123` |
| Müşteri | `ayse` | `Kantin123` |

Demo modu yalnızca tarayıcı belleğini kullanır; üretimde açık bırakılmamalıdır.

## Supabase kurulumu

### 1. Projeyi bağlayın ve şemayı yükleyin

Supabase Dashboard'dan bir proje oluşturduktan sonra:

```powershell
npx supabase login
npx supabase link --project-ref PROJE_REF
npx supabase db push
```

Migration; tabloları, indeksleri, tetikleyicileri, kısıtları ve RLS politikalarını birlikte oluşturur. Auth ayarlarında kullanıcıların kendi kendine kaydolmasını kapalı tutun. E-posta sağlayıcısı açık kalabilir; hesaplar yönetici API'siyle doğrulanmış olarak oluşturulduğundan kullanıcıya e-posta gönderilmez.

### 2. Kullanıcı yönetimi fonksiyonunu yayınlayın

Arayüzdeki kullanıcı oluşturma ve parola sıfırlama işlemleri, gizli yönetici anahtarını tarayıcıya vermeyen Edge Function üzerinden çalışır:

```powershell
npx supabase secrets set AUTH_EMAIL_DOMAIN=kantin.invalid
npx supabase functions deploy manage-user
```

`AUTH_EMAIL_DOMAIN` ile aşağıdaki web değişkenindeki alan adı aynı olmalıdır. Kullanıcı adı, arka planda `kullaniciadi@kantin.invalid` biçimine çevrilir; kullanıcı bunu görmez.

### 3. İlk yönetici kantinciyi oluşturun

İlk hesap bir defaya mahsus komut satırından oluşturulur. Supabase Dashboard > Project Settings > API bölümündeki secret/service-role anahtarını yalnızca yerel ortam değişkenine koyun; hiçbir zaman `VITE_` değişkenine veya repoya eklemeyin.

```powershell
$env:SUPABASE_URL = "https://PROJE_REF.supabase.co"
$env:SUPABASE_SECRET_KEY = "SECRET_KEY"
$env:AUTH_EMAIL_DOMAIN = "kantin.invalid"
npm run bootstrap-manager -- yonetici "Yönetici Adı" "Güçlü-Geçici-Parola"
```

Yönetici ilk girişte geçici parolasını değiştirmek zorundadır.

### 4. Web yapılandırması

Yerelde `.env.local` dosyasını doldurun:

```dotenv
VITE_SUPABASE_URL=https://PROJE_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_AUTH_EMAIL_DOMAIN=kantin.invalid
VITE_DEMO_MODE=false
```

Publishable key tarayıcıda kullanılmak için tasarlanmıştır; veri yetkisini RLS belirler. Secret/service-role anahtarı web uygulamasına kesinlikle eklenmemelidir.

## GitHub Pages yayını

Repository **Settings > Secrets and variables > Actions > Variables** bölümüne şunları ekleyin:

| Değişken | Değer |
| --- | --- |
| `KANTIN_SUPABASE_URL` | Supabase proje URL'si |
| `KANTIN_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `KANTIN_AUTH_EMAIL_DOMAIN` | `kantin.invalid` |

Repository **Settings > Pages > Build and deployment** kaynağını **GitHub Actions** seçin. Ana daldaki `kantin/**` değişiklikleri mevcut siteyle birlikte test edilir, derlenir ve `/kantin/` yoluna yayınlanır.

## Komutlar

```powershell
npm run dev       # geliştirme sunucusu
npm test          # birim testleri
npm run build     # tip kontrolü ve üretim derlemesi
npm run preview   # üretim çıktısını yerelde açar
```

Supabase şemasını yerelde doğrulamak için Docker Desktop çalışırken:

```powershell
npx supabase start
npx supabase db reset --local
npx supabase db lint --local
npx supabase db advisors --local --type all --level warn --fail-on error
```

## Yetki özeti

| İşlem | Müşteri | Kantinci | Yönetici kantinci |
| --- | --- | --- | --- |
| Kendi hesabını görme | Evet | Evet | Evet |
| Başka müşterinin hesabını görme | Hayır | Evet | Evet |
| Tüketim ekleme/düzeltme | Kendi hesabı, son 2 gün | Tüm müşteriler | Tüm müşteriler |
| Haftayı ödendi/açık yapma | Hayır | Evet | Evet |
| Kategori, ürün, fiyat yönetimi | Hayır | Evet | Evet |
| Müşteri oluşturma | Hayır | Evet | Evet |
| Kantinci oluşturma | Hayır | Hayır | Evet |

Ön yüz kontrolleri kullanım kolaylığı içindir; asıl yetkilendirme PostgreSQL RLS politikaları, tetikleyiciler ve Edge Function kontrolleriyle sunucu tarafında uygulanır.
