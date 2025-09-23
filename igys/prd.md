Proje: TTKB E-İçerik İnceleme Sistemi (Prototip)
Teknoloji: Flask, SQLite
Kapsam: Admin paneli, komisyon yönetimi, inceleme formları, düzeltme akışı

1. Amaç ve Hedefler

Bu sistemin amacı, Talim ve Terbiye Kurulu Başkanlığı’na (TTKB) gönderilen e-içeriklerin komisyonlar aracılığıyla incelenmesi, hataların kaydedilmesi, düzeltmelerin takip edilmesi ve Yeğitek ile iteratif onay sürecinin yönetilmesini sağlamaktır.

Hedefler:

E-içeriklerin komisyonlara atanarak incelenmesini sağlamak

Komisyon üyeleri ve başkanlarının görevlerini netleştirmek

Hata tespit, düzeltme ve takip sürecini kayıt altına almak

Admin için süreç izleme, raporlama ve yeniden atama imkanları sunmak

2. Kullanıcı Rolleri ve Yetkiler
2.1. Admin

Yeni komisyon oluşturma ve üyeleri atama

İnceleme süresi tanımlama/değiştirme (varsayılan: 7 gün)

Admin Yetkileri için Gereken Öz…

İşlem süresi dolan görevler için bildirim/hatırlatma gönderebilme

Admin Yetkileri için Gereken Öz…

Komisyon raporlarını görüntüleme, arşivleme, indirme

Admin Yetkileri için Gereken Öz…

Yanlışlıkla kapatılan işleri tekrar açma ve atama hatalarını düzeltme

Admin Yetkileri için Gereken Öz…

İçeriği Yeğitek’e gönderme

Yeğitek’ten geri gelen içeriği eski veya yeni komisyona atama

2.2. Komisyon Başkanı

İnceleme sürecini yönetme

Tüm üyeler incelemesini tamamladığında raporları görüntüleme

Üyelerin girdiği hataları düzenleyebilme

Admin Yetkileri için Gereken Öz…

Tespitlerin CRUD işlemlerini yapabilme (ekleme, güncelleme, silme)

“Admin’e Gönder” butonu ile raporu admin paneline iletme

2.3. Komisyon Üyesi

İnceleme formunu doldurma ve hata girişleri yapma

“Bitir” butonuna basarak kendi görevini tamamlama

Tekrar gönderimlerde bildirim alma

Admin Yetkileri için Gereken Öz…

2.4. Yeğitek (sadece süreçte dış aktör, prototipte tasarlanmayacak)

İçerik üzerindeki düzeltmeleri geri gönderir

Düzeltme formu üzerinden hangi hataların neden düzeltilmediğini veya nasıl düzeltildiğini belirtir

3. İş Akışı

Yeni içerik gelir → Admin Paneli

Admin komisyon oluşturur ve içeriği atar.

Komisyon Üyeleri İnceleme

Üyeler hata tespit formunu doldurur ve “Bitir” butonuna basar.

Tüm üyeler tamamlayınca başkan raporu görür.

Komisyon Başkanı İşlemleri

Tüm tespitleri inceler, düzenler, CRUD yapar.

“Admin’e Gönder” butonu ile raporu iletir.

Admin Onayı ve Yönlendirme

Admin raporu görür.

“Yeğitek’e Gönder” butonu ile dışarıya iletir.

Yeğitek Düzeltme Süreci

İçerik düzeltilmiş veya açıklamalarla birlikte geri gelir.

Admin isterse önceki komisyona, isterse yeni komisyona atar.

Düzeltme İncelemesi

Aynı komisyon veya yeni komisyon incelemeyi yapar.

Düzeltme formu doldurularak süreç tekrar eder.

4. Modüller ve Ekranlar
4.1. Admin Paneli

Dashboard: işlerin aşama bazlı görünümü, renk kodlama

Admin Yetkileri için Gereken Öz…

Komisyon Yönetimi: oluşturma, üyeleri değiştirme, şablon çağırma

Admin Yetkileri için Gereken Öz…

Raporlama: PDF/Excel indirme, arşivleme

Admin Yetkileri için Gereken Öz…

Görev Takibi: filtreleme (kullanıcı, komisyon, içerik türü, durum)

Admin Yetkileri için Gereken Öz…

Yeğitek Gönderim & Geri Gelen İçerik Atama

4.2. Komisyon Üyesi Ekranı

İnceleme formu (tespit girişi, hata türleri, açıklama alanı)

“Bitir” butonu

4.3. Komisyon Başkanı Ekranı

Tüm üyelerin raporlarını görme

Tespitler üzerinde CRUD işlemleri

“Admin’e Gönder” butonu

4.4. Düzeltme Formu (Yeğitek)

Her tespit için açıklama alanı:

“Neden düzeltilmedi?”

“Nasıl düzeltildi?”

5. Veri Tabanı Tasarımı (SQLite)

Önerilen tablolar:

users (id, ad, rol, e-posta, şifre)

commissions (id, isim, başkan_id, oluşturma_tarihi, süre)

commission_members (id, commission_id, user_id)

contents (id, başlık, durum, admin_id, oluşturma_tarihi)

reviews (id, content_id, commission_id, user_id, durum, tarih)

findings (id, review_id, kategori, açıklama, durum)

corrections (id, finding_id, aciklama, yeğitek_aciklama, durum)

6. Teknik Gereksinimler

Backend: Flask (Python)

Database: SQLite (Flask-SQLAlchemy ile)

UI: Flask templates (Jinja2) + Bootstrap (veya Tailwind)

Auth: Rol bazlı oturum yönetimi (Flask-Login)

Bildirim: E-posta veya sistem içi uyarı (opsiyonel, mockup olabilir)

7. Süreç ve Zamanlama

Faz 1: Admin paneli + Komisyon oluşturma

Faz 2: İnceleme formu + Üye ve Başkan ekranları

Faz 3: CRUD işlemleri + Raporlama

Faz 4: Yeğitek entegrasyonu için placeholder (mockup)

Faz 5: Düzeltme formu + Tekrar atama iş akışı

8. Kabul Kriterleri

Admin yeni içerik için komisyon atayabilmeli

Komisyon üyeleri hata girişi yapıp bitirebilmeli

Başkan tüm raporları CRUD ile düzenleyebilmeli

Admin raporu Yeğitek’e gönderebilmeli

Yeğitek’ten gelen düzeltmeler önceki veya yeni komisyona atanabilmeli

Düzeltme formunda neden/nasıl açıklamaları görülebilmeli