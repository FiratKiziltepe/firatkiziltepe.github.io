# phpMyAdmin ve baglan.php ile kurulum

Yeni paket: **tablogorusler-nas-kolay.zip**. Bu paket için `setup.php`, `config.php`, yeni veritabanı kullanıcısı veya `public/` belge kökü ayarı gerekmez.

## 1. SQL dosyasını içe aktar

Arşivi bilgisayarında aç. phpMyAdmin'de oluşturduğun **tablogorusler** veritabanını seç. **İçe aktar** bölümünden paketteki **phpmyadmin-kurulum.sql.gz** dosyasını yükle. `.gz` dosyasını ayrıca açmana gerek yok; phpMyAdmin sıkıştırılmış SQL dosyasını okuyabilir. Sıkıştırma desteği kapalıysa paketteki `.sql` dosyasını seç.

Bu dosya tabloları, ilk yönetici hesabını ve 3488 yerel başlangıç içeriğini oluşturur. Mevcut kayıtları silmez; içerik tablosu doluysa başlangıç içeriğini eklemez. Kullanıcı tablosu doluysa yeni yönetici oluşturmaz ve mevcut şifreleri değiştirmez. Canlı Supabase kayıtlarına bağlanmaz.

## 2. baglan.php dosyasını düzenle

Paketteki `tablogorusler/baglan.php` dosyasında yalnızca şu dört satırı kendi çalışan bağlantınla aynı yap:

```php
$host = "localhost";
$user = "root";
$pass = "VERITABANI_SIFREN";
$db   = "tablogorusler";
```

Bağlantı senin kullandığın şekilde **mysqli** ile yapılır. Parolayı mesaja yazmana gerek yok. Çalışan bağlantında ayrıca bir port belirtiliyorsa aynı portu kullan:

```php
$conn = new mysqli($host, $user, $pass, $db, 3307);
```

## 3. Klasörü NAS'a koy ve aç

Sadece paketteki **tablogorusler** klasörünü NAS'ın mevcut PHP web klasörüne kopyala. `api`, `assets` ve `server` alt klasörleri aynı yerde kalmalı. PHP 8.3 ve mysqli etkin olmalı.

Örneğin NAS'ın mevcut web adresi `http://NAS-IP/` ise uygulamayı **http://NAS-IP/tablogorusler/** adresinden aç. Web sunucunda farklı port veya adres kullanıyorsan o adresin sonuna `/tablogorusler/` ekle. **setup.php açmayacaksın.**

İlk kullanıcı adı **admin**. Geçici şifre arşivdeki **ILK-GIRIS.txt** dosyasında. İlk girişte kendi şifreni belirle. Önceden oluşturulmuş kullanıcılar varsa mevcut giriş bilgilerini kullan.

**SQL, ILK-GIRIS.txt ve bu kılavuzu NAS web klasörüne yükleme.** Yalnızca `tablogorusler/` klasörü web'e konulur. Bağlantı dosyası PHP olarak çalışmalı; PHP kaynak kodu tarayıcıda görünüyorsa NAS'ın PHP hizmeti ayarlı değildir.

## Açılmıyorsa

- **404 / sayfa bulunamadı:** Dosya yolu veya web adresi yanlış; NAS'ın kullandığın web klasörünü ve adresini kontrol et.
- **PHP kodu görüntüleniyor veya indiriliyor:** NAS'ta bu web klasörü için PHP etkin değil.
- **Veritabanına bağlanılamadı:** `baglan.php` değerlerini çalışan bağlantınla karşılaştır.
- **Tablolar henüz oluşturulmamış:** phpMyAdmin'de doğru veritabanını seçip SQL dosyasını içe aktar.

Hata varsa ekrandaki hata metnini paylaş; veritabanı şifreni paylaşma.

Mevcut arayüz ve iş akışları korunur. Uygulamanın çalışması için Python, Node.js, Supabase veya açık terminal gerekmez. Eski Supabase uygulaması değiştirilmez.
