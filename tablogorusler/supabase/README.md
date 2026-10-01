# Kullanıcı erişimi — SQL kurulumu

Supabase SQL Editor'da **postgres** rolüyle `install-user-status.sql` dosyasının
tamamını çalıştırın. Ardından sitede Ctrl+F5 yapıp Yönetim Paneli → Kullanıcı erişimi
→ Durumları yenile'yi seçin. Kurulum hesap durumlarını değiştirmez; tekrar çalıştırılabilir.
Edge Function dağıtımı veya secret eklemek gerekmez.

Arayüz `public.manage_user_status` RPC'sini çağırır. API sarmalayıcısı
`SECURITY INVOKER`, özel şemadaki uygulama işlevi `SECURITY DEFINER` kullanır.
Yetki yükseltme yalnızca Auth hesabının `banned_until` alanını yönetmek için gereklidir;
anon erişimi kapalıdır, `auth.uid()` ve aktif admin profili her çağrıda doğrulanır.
Kendi hesabı ve uygulamaya ait olmayan hesaplar toplu güncellemelerden hariçtir.
Sabit ve boş search_path ile tam şema adları kullanılır. Mevcut RLS politikaları değişmez.

Pasifleştirme Auth hesabının `banned_until` alanını günceller. Açık erişim JWT'leri
süreleri dolana kadar geçerli kalabilir. Bu işlev `auth.users` şemasındaki mevcut
alanlara bağlıdır; Supabase Auth şema değişikliklerinde yeniden kontrol edilmelidir.

Doğrulama: `node --experimental-strip-types --test tests/*.test.mjs`.
SQL testleri PGlite PostgreSQL üzerinde kurulumun tekrarını, yetki reddini,
kendi hesabını korumayı, hesap kapsamını ve aktif/pasif geçişlerini çalıştırır.
Canlı Supabase proje erişimi reddedildiği için canlı kurulum ve advisor sonuçları
doğrulanamadı. Kurulumdan sonra Security Advisor kontrol edilmelidir.

`functions/manage-user-status` önceki Edge Function seçeneğidir; güncel arayüz
bu işlevi çağırmaz. Mevcut `create-user` işlevi toplu kişi eklemede kullanılmaya devam eder.
