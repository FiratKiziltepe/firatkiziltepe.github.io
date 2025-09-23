# TTKB E-İçerik İnceleme Sistemi

Bu proje, Talim ve Terbiye Kurulu Başkanlığı'na gönderilen e-içeriklerin komisyonlar aracılığıyla incelenmesi için geliştirilmiş bir Flask web uygulamasıdır.

## Özellikler

### Admin Paneli
- ✅ Yeni içerik ekleme
- ✅ Komisyon oluşturma ve yönetimi
- ✅ Dashboard ile genel görünüm
- ✅ İçerik durumu takibi

### Komisyon Başkanı
- ✅ İnceleme raporlarını görüntüleme
- ✅ Tespit CRUD işlemleri (ekleme, düzenleme, silme)
- ✅ Admin'e rapor gönderme

### Komisyon Üyesi
- ✅ İnceleme görevleri
- ✅ Hata tespit formu
- ✅ İnceleme tamamlama

## Teknoloji Stack

- **Backend:** Flask (Python)
- **Veritabanı:** SQLite
- **Frontend:** Bootstrap 5, HTML/CSS/JavaScript
- **Kimlik Doğrulama:** Flask-Login
- **ORM:** SQLAlchemy

## Kurulum

1. **Gereksinimleri yükleyin:**
```bash
pip install -r requirements.txt
```

2. **Uygulamayı çalıştırın:**
```bash
python app.py
```

3. **Tarayıcıda açın:**
```
http://localhost:5000
```

## Demo Hesaplar

Sistem otomatik olarak demo veriler oluşturur:

| Rol | E-posta | Şifre | Yetki |
|-----|---------|-------|-------|
| Admin | admin@ttkb.gov.tr | admin123 | Sistem yönetimi |
| Başkan | baskan@ttkb.gov.tr | baskan123 | Komisyon başkanlığı |
| Üye | uye@ttkb.gov.tr | uye123 | İnceleme yapma |

## Kullanım

### 1. Admin Olarak
- Giriş yapın ve "Yeni İçerik" butonuyla içerik ekleyin
- "Yeni Komisyon" ile komisyon oluşturun
- İçerikleri komisyonlara atayın

### 2. Komisyon Üyesi Olarak
- Size atanan görevleri "İncelemeye Başla" ile açın
- Tespit ettiğiniz hataları kategorize edin
- "İncelemeyi Bitir" ile tamamlayın

### 3. Komisyon Başkanı Olarak
- Tüm üyeler tamamladıktan sonra "Raporu Görüntüle"
- Tespitleri düzenleyin, ekleyin veya silin
- "Admin'e Gönder" ile süreci ilerletin

## Proje Yapısı

```
igys/
├── app.py                 # Ana Flask uygulaması
├── requirements.txt       # Python bağımlılıkları
├── templates/            # HTML şablonları
│   ├── base.html         # Ana şablon
│   ├── login.html        # Giriş sayfası
│   ├── admin/            # Admin şablonları
│   ├── baskan/           # Başkan şablonları
│   └── uye/              # Üye şablonları
├── static/               # CSS/JS dosyaları
└── igys.db              # SQLite veritabanı (otomatik oluşur)
```

## Veritabanı Modeli

- **users:** Kullanıcılar (admin, başkan, üye)
- **commissions:** Komisyonlar
- **commission_members:** Komisyon üyelikleri
- **contents:** İnceleme içerikleri
- **reviews:** İnceleme görevleri
- **findings:** Tespit edilen hatalar
- **corrections:** Düzeltme bilgileri

## Özellik Durumu

| Özellik | Durum |
|---------|-------|
| Kullanıcı rolleri | ✅ Tamamlandı |
| Admin paneli | ✅ Tamamlandı |
| Komisyon yönetimi | ✅ Tamamlandı |
| İnceleme formları | ✅ Tamamlandı |
| CRUD işlemleri | ✅ Tamamlandı |
| Yeğitek workflow | 🚧 Geliştirme aşamasında |
| E-posta bildirimleri | 📋 Planlanan |
| PDF raporlama | 📋 Planlanan |

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
