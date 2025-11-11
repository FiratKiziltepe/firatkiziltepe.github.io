# Excel to JSON Dönüştürücü 📊

Tarayıcıda çalışan, Excel dosyalarını JSON formatına dönüştüren web uygulaması.

## Özellikler ✨

- ✅ **Tarayıcıda Çalışır**: Herhangi bir kurulum gerektirmez
- ✅ **Sürükle & Bırak**: Excel dosyanızı sürükleyip bırakın
- ✅ **Canlı Önizleme**: Dönüştürme sonucunu anında görün
- ✅ **Otomatik İndirme**: JSON dosyasını tek tıkla indirin
- ✅ **Format Desteği**: .xlsx ve .xls dosyalarını destekler
- ✅ **Türkçe Karakter Desteği**: UTF-8 kodlaması ile tam destek
- ✅ **Responsive Tasarım**: Mobil ve masaüstünde çalışır

## Kullanım 🚀

### 1. Dosyaları Açın

Tarayıcınızda `index.html` dosyasını açın:

```bash
# Doğrudan tarayıcıda açmak için
open dosyadonusum/index.html

# Veya bir web sunucusu kullanarak
cd dosyadonusum
python -m http.server 8000
# Tarayıcıda http://localhost:8000 adresine gidin
```

### 2. Excel Dosyasını Yükleyin

İki yöntemden biriyle Excel dosyanızı yükleyin:

- **Yöntem 1**: Yükleme alanına tıklayın ve dosya seçin
- **Yöntem 2**: Excel dosyanızı sürükleyip yükleme alanına bırakın

### 3. JSON'u İndirin

- Dönüştürme otomatik olarak yapılır
- Önizleme alanında ilk 3 satırı görürsünüz
- "JSON İndir" butonuna tıklayarak dosyayı indirin

## Desteklenen Format 📋

Çıktı JSON formatı, Excel'deki sütun başlıklarını anahtar olarak kullanır:

```json
[
  {
    "SIRA NO": 1,
    "DERS ADI": "Hayat Bilgisi 1",
    "ÜNİTE/TEMA/ ÖĞRENME ALANI": "1. BEN VE OKULUM",
    "KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM": "HB.1.1.1. Öğretmeni ve arkadaşlarıyla tanışabilme",
    "E-İÇERİK TÜRÜ": "Video/Etkileşimli İçerik",
    "AÇIKLAMA": "Öğrencilerin tanışma süreçlerini canlandıran animasyon veya etkileşimli video hazırlanır.",
    "Program Türü": "TYMM"
  },
  ...
]
```

## Excel Formatı Gereksinimleri 📝

- İlk satır **sütun başlıkları** olmalıdır
- Boş satırlar boş string ("") olarak dönüştürülür
- Tüm sütun başlıkları JSON anahtarı olarak kullanılır
- Türkçe karakterler desteklenir

## Teknik Detaylar 🔧

### Kullanılan Teknolojiler

- **HTML5**: Kullanıcı arayüzü
- **CSS3**: Modern ve responsive tasarım
- **JavaScript (ES6+)**: Dönüştürme mantığı
- **SheetJS (xlsx)**: Excel okuma kütüphanesi

### Tarayıcı Uyumluluğu

- ✅ Chrome (önerilen)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE11 (desteklenmez)

### Dosya Yapısı

```
dosyadonusum/
├── index.html      # Ana HTML sayfa
├── converter.js    # JavaScript dönüştürme kodu
└── README.md       # Bu dosya
```

## Özellik Listesi 🎯

### Dosya İşleme
- ✅ Excel dosyası yükleme
- ✅ Sürükle & bırak desteği
- ✅ Dosya boyutu ve detay bilgileri
- ✅ Otomatik format doğrulama

### Dönüştürme
- ✅ .xlsx formatı desteği
- ✅ .xls formatı desteği
- ✅ Otomatik karakter kodlaması (UTF-8)
- ✅ Boş hücre yönetimi
- ✅ Tüm sütunları koruma

### Kullanıcı Deneyimi
- ✅ Canlı önizleme
- ✅ Başarı/hata mesajları
- ✅ İndirme butonu
- ✅ Sıfırlama özelliği
- ✅ Responsive tasarım

## Güvenlik 🔒

- ✅ Tüm işlemler tarayıcıda yapılır
- ✅ Hiçbir veri sunucuya gönderilmez
- ✅ Dosyalar yerel olarak işlenir
- ✅ Gizlilik tamamen korunur

## Sık Sorulan Sorular ❓

### Dosya boyutu limiti var mı?
Hayır, ancak çok büyük dosyalar (>50MB) tarayıcıyı yavaşlatabilir.

### Hangi Excel formatlarını destekliyor?
.xlsx (Excel 2007+) ve .xls (Excel 97-2003) formatları desteklenir.

### Türkçe karakterler düzgün çalışıyor mu?
Evet, UTF-8 kodlaması kullanıldığı için tüm Türkçe karakterler desteklenir.

### Birden fazla sayfa varsa ne olur?
Sadece ilk sayfa (sheet) dönüştürülür.

### Verilerim güvende mi?
Evet, tüm işlemler tarayıcınızda yapılır. Hiçbir veri internete gönderilmez.

## Lisans 📄

Bu proje açık kaynaklıdır ve özgürce kullanılabilir.

## Katkıda Bulunma 🤝

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

---

**Not**: Bu uygulama tamamen çevrimdışı (offline) çalışır. SheetJS kütüphanesi CDN üzerinden yüklenir, ancak gerekirse yerel olarak da eklenebilir.
