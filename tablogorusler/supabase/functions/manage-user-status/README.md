# Kullanıcı durum yönetimi

Bu işlev mevcut `profiles` ve Supabase Auth hesaplarını kullanır; şema değişikliği gerektirmez.
Sunucuda doğrulanmış kullanıcının profil rolünü kontrol eder. Yalnızca aktif admin erişebilir.
Toplu işlem yalnızca `profiles` kaydı bulunan hesaplara uygulanır; çağıranın kendi hesabı korunur.
Başarısız kullanıcılar ayrı raporlanır. Hesap silinmez, şifre değiştirilmez.

Kurulum: projenin Supabase Edge Functions bölümünde `manage-user-status` adıyla
`index.ts` dosyasını dağıtın. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY Edge Runtime'da
sunucu ortam değişkenleridir; tarayıcıya aktarılmamalıdır.

Pasifleştirme Auth Admin API'nin `ban_duration` alanıyla yapılır. Bu yeni girişleri ve
oturum yenilemeyi engeller. Mevcut erişim JWT'leri süreleri dolana kadar geçerli kalabilir.
Anında veritabanı erişimi kesilmesi ayrıca mevcut RLS politikalarının incelenmesini gerektirir.

Canlı kurulum sonrası ayrı bir test hesabıyla admin listeleme, tek hesap pasif/aktif,
pasif hesapla giriş reddi, yeniden aktifleştirdikten sonra giriş ve öğretmenin 403 alması
kontrol edilmelidir. Gerçek kullanıcıları sırf test için topluca pasifleştirmeyin.

Bu çalışma sırasında Supabase yönetim bağlantısı proje erişimini reddetti;
işlev canlıya kurulmadı ve canlı hesap işlemleri doğrulanamadı.
