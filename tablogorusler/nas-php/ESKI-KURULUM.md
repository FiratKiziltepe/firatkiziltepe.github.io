# Tablo Görüşler — PHP 8.3 / MariaDB NAS sürümü

Bu sürüm yalnızca `nas-php/` içinde hazırlanmıştır. Ana uygulama ve canlı Supabase projesi değiştirilmemiştir. Mevcut React ekranları kullanılır; NAS'ta PHP ve MariaDB çalışır. Python, Node.js, Supabase veya sürekli açık bir terminal NAS'ın çalışması için gerekli değildir.

## NAS'a kurulacak dosyalar

Hazır paket: `tablogorusler-nas.zip`. Arşivi NAS'ta açınca şu yapı bulunur:

```text
tablogorusler/
  public/                 ← Web sunucusunun belge kökü BU klasör olmalı
    index.html
    setup.php
    assets/
    fonts/
    api/index.php
  server/                 ← Web kökünün dışında
    config.example.php
    ...
  database/               ← Web kökünün dışında
    schema.sql
    initial-data.json
  KURULUM.md
```

NAS web portalının belge kökünü `tablogorusler/public` olarak ayarlayın ve PHP 8.3 profilini seçin. Apache veya Nginx kullanılabilir; URL yeniden yazma kuralı gerekmez. Kök alan adı veya alt klasör adresi kullanılabilir, derleme göreli yollar içerir.

**`server` ve `database` klasörlerini internetten/kurum ağından erişilen belge kökünün içine koymayın.** `.htaccess` dosyaları Apache için ek korumadır; Nginx bunları okumaz. Bu nedenle belge kökü ayarı her iki sunucuda da `public/` olmalıdır. NAS tüm `/web` klasörünü ayrıca yayımlıyorsa üst klasörün dışarıdan erişimini de kapatın veya projeyi yayımlanmayan bir konuma taşıyıp yalnızca `public/` için portal tanımlayın.

## 1. Veritabanını oluşturun

MariaDB'de `tablogorusler` adlı boş veritabanını `utf8mb4` karakter kümesiyle oluşturun. Ayrı bir uygulama kullanıcısı tanımlayın:

```sql
CREATE DATABASE IF NOT EXISTS tablogorusler
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tablogorusler_app'@'localhost' IDENTIFIED BY 'GUCLU_VERITABANI_SIFRESI';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, REFERENCES
  ON tablogorusler.* TO 'tablogorusler_app'@'localhost';
```

Veritabanını zaten oluşturduysanız ilk komut gerekmez. phpMyAdmin ile aynı işlemler yapılabilir. İlk kurulum tablo oluşturma yetkisi ister. Alternatif olarak `database/schema.sql` dosyasını phpMyAdmin'den içe aktarabilirsiniz; bu durumda uygulama kullanıcısına yalnızca SELECT/INSERT/UPDATE/DELETE verilebilir, ancak ilk kurulumdaki `CREATE TABLE IF NOT EXISTS` ifadeleri için kurulum sırasında CREATE yetkisi gerekebilir. Kurulum bittikten sonra CREATE/INDEX/REFERENCES yetkilerini kaldırabilirsiniz.

## 2. PHP bağlantı ayarını yapın

`server/config.example.php` dosyasını **aynı klasöre** `config.php` adıyla kopyalayın:

```php
<?php
declare(strict_types=1);
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'tablogorusler',
    'username' => 'tablogorusler_app',
    'password' => 'GUCLU_VERITABANI_SIFRESI',
    'session_seconds' => 28800,
    'secure_cookies' => false,
    'setup_token' => 'EN_AZ_24_KARAKTER_RASTGELE_KURULUM_ANAHTARI',
];
```

Gerçek MariaDB portunu yazın; bazı NAS cihazlarında MariaDB 10 portu **3307** olur. Veritabanına TCP ile bağlanacaksanız `host` alanını `127.0.0.1` yapabilirsiniz; `localhost` bazı Linux kurulumlarında Unix soketi kullanır. Kullanıcının bağlantı adresine uygun MariaDB yetkisi bulunmalıdır.

PHP profilinde **PDO MySQL (`pdo_mysql`)** ve **session** desteği etkin olmalıdır. `mysqli` gerekmiyor; API hazırlanmış PDO sorgularını kullanır. Bağlantı şifresi yalnızca PHP dosyasında tutulur.

HTTPS ile kullanıyorsanız `secure_cookies` değerini `true` yapın. NAS PHP ayarlarında önerilen değerler:

```ini
memory_limit = 256M
max_execution_time = 120
post_max_size = 16M
display_errors = Off
log_errors = On
```

PHP session klasörünün web sunucusu kullanıcısı tarafından yazılabildiğini kontrol edin. PHP API için bir önbellek/CDN/proxy önbelleği etkinleştirmeyin.

## 3. İlk yönetici hesabını oluşturun

Tarayıcıdan uygulama adresinin sonuna `/setup.php` ekleyin. Örneğin portal adresi `http://NAS-IP:8080/` ise kurulum adresi `http://NAS-IP:8080/setup.php` olur.

Formda:

1. `config.php` içine yazdığınız kurulum anahtarını girin.
2. Yönetici kullanıcı adı, ad soyad ve en az **12 karakterlik** şifre belirleyin.
3. İsterseniz **Projedeki başlangıç içeriklerini aktar** seçeneğini açık bırakın.
4. Kurulumu tamamlayın ve uygulamaya giriş yapın.

Başlangıç seçeneği, bu klasöre kopyalanan yerel `data.json` içeriğini aktarır. **Canlı Supabase'in güncel kayıtlarını, kullanıcılarını, önerilerini veya geçmişini otomatik aktarmaz.** Güncel içerikleri eski uygulamanın JSON/Excel dışa aktarımıyla alıp yeni uygulamanın yönetici panelinden yükleyebilirsiniz. Kullanıcıları aynı panelden tek tek veya toplu oluşturabilir, ders atamalarını yapabilirsiniz. Güncel öneri ve geçmiş kayıtlarının tam taşınması ayrıca bir yedek aktarımı gerektirir; mevcut sistemdeki veriler burada değiştirilmez.

İlk kullanıcı oluşturulduktan sonra aynı kurulum tekrar çalışmaz. Kurulum sonrasında `setup_token` değerini boş bırakın ve `public/setup.php` dosyasını kaldırın. `config.php` dosyasını paylaşmayın.

## Korunan ekran ve işlevler

- Giriş ve zorunlu ilk şifre değişikliği.
- Kontrol paneli, içerik tablosu, ders/program filtreleri ve sayfalama.
- Alan bazlı öneri, yeni satır önerisi, silme talebi ve gerekçeler.
- Öğretmenin kendi bekleyen önerisini düzenlemesi/geri çekmesi.
- Yönetici/moderatör onayı ve reddi, aynı alanın diğer önerilerinin otomatik reddi.
- Değişiklik geçmişi, raporlar, içerik türü analizi ve Excel çıktıları.
- Tekli/toplu kullanıcı oluşturma, ders atama, rol düzenleme.
- Kullanıcıyı aktif/pasif yapma, tekli/toplu parola sıfırlama.
- JSON/Excel içerik yükleme, ders bazlı silme ve talepleri sıfırlama.

Ekran bileşenleri ve görünüm mevcut uygulamadan alınmıştır. Tailwind stilleri ve Inter fontları paketin içindedir; çalışma sırasında harici CDN, Google Fonts veya Supabase isteği yapılmaz.

Parolalar hash olarak saklanır. Yönetici şifre değiştirme/sıfırlama ekranları korunur, ancak kayıtlı parolanın düz metin görüntülenmesi mümkün değildir. Ders atanmamış öğretmen/moderatör içerik göremez. Pasif hesaplar ve şifresi yönetici tarafından sıfırlanan hesaplar bir sonraki API isteğinde eski oturumlarını kaybeder.

## Güncelleme ve yedekleme

MariaDB veritabanını düzenli yedekleyin. Uygulama dosyaları güncellenirken `server/config.php` dosyanızı koruyun. Güncelleme için `setup.php` çalıştırmayın. Yeni NAS sürümü Supabase sürümünden bağımsızdır; birinde yapılan değişiklik diğerine otomatik yansımaz.

## Geliştirici komutları

Yalnızca geliştirme bilgisayarında, `nas-php` klasöründe:

```powershell
npm install
npm run typecheck
npm test
npm run build
node tools/release.mjs
Compress-Archive -Path release/tablogorusler -DestinationPath tablogorusler-nas.zip -Force
```

Font dosyaları projede hazırdır. Yeniden indirmek gerekirse `node tools/fetch-fonts.mjs` çalıştırın. `convert-copy.mjs` ve `finish-copy.mjs` yalnızca ilk taşıma araçlarıdır; yeniden çalıştırmayın.

Yerel geliştirme için bir terminalde `php -S 127.0.0.1:8083 -t public`, diğerinde `npm run dev` kullanılabilir. PHP'nin yerleşik sunucusu geliştirme içindir; NAS'ta Apache/Nginx/PHP-FPM kullanılmalıdır.

Uçtan uca testler yalnızca `.runtime/` altındaki ayrı MariaDB'de, **33083** portunda, ayrı `tablogorusler_nas_test_*` veritabanları oluşturarak çalışır. `tools/run-integration.ps1` gerçek NAS bağlantı ayarının üzerine yazmayı reddeder. Testler varsayılan `npm test` komutunda atlanır; canlı veritabanına karşı çalıştırmayın.

Doğrulama: PHP **8.3.35**, MariaDB **10.4.32**, 17 uçtan uca senaryo, 13 mevcut analiz/rapor/kullanıcı adı testi ve 2 arayüz/bağlantı koruma testi. İçerik tablosu tarayıcıda görsel olarak kontrol edildi. Bu doğrulama eşzamanlı ikinci onay engelini içerir; 70 kullanıcılık yük testi veya NAS'ın gerçek ortam testi yapılmamıştır.

Teknik başvuru: [PHP hazırlanmış sorgular](https://www.php.net/manual/en/pdo.prepared-statements.php), [PHP oturum ayarları](https://www.php.net/manual/en/session.security.ini.php).
