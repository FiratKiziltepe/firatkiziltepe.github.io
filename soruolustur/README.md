# PDF Soru Oluşturucu

Google Gemini AI kullanarak PDF dosyalarından otomatik soru-cevap çiftleri üreten web tabanlı uygulama.

## 🎯 Özellikler

- ✨ **PDF İşleme**: Herhangi bir PDF dosyasından metin çıkarma
- 🤖 **AI Destekli**: Google Gemini API ile akıllı soru üretimi
- 📝 **11 Farklı Soru Tipi**: Olgusal, Kavramsal, Bağlamsal, Nedensel, Süreçsel, Analitik, Varsayımsal, Yansıtıcı, Spekülatif, Listeleme, Özetleme
- ⚙️ **Özelleştirilebilir**: Kendi soru tiplerinizi ekleyin
- 📊 **Toplu İşleme**: Sayfa sayfa veya grup halinde işleme seçenekleri
- 🚦 **Rate Limit Yönetimi**: Akıllı API istek yönetimi
- 📥 **Excel Dışa Aktarma**: Sorular, özet ve yapılandırmayı içeren kapsamlı Excel dosyası
- 💾 **Veri Saklama**: API anahtarı ve ayarların güvenli şekilde saklanması
- 🌐 **Tamamen İstemci Tarafı**: Backend gerektirmez, GitHub Pages'de çalışır

## 🚀 Hızlı Başlangıç

### 1. API Anahtarı Alın

Google AI Studio'dan ücretsiz API anahtarı alın:
👉 [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 2. Uygulamayı Kullanın

1. **API Anahtarını Girin**: Kurulum sekmesinde API anahtarınızı girin ve bağlantıyı test edin
2. **PDF Yükleyin**: PDF dosyanızı sürükleyin veya seçin
3. **Sayfaları Seçin**: İşlemek istediğiniz sayfaları belirleyin
4. **Yapılandırın**: Soru tiplerini ve işleme ayarlarını düzenleyin
5. **Üretin**: Soru üretmeye başlayın ve ilerlemesini takip edin
6. **Dışa Aktarın**: Sonuçları Excel formatında indirin

## 📖 Kullanım Kılavuzu

### Sayfa Seçimi

- **Tümünü Seç**: Tüm sayfaları işle
- **Özel Seçim**: Belirli sayfaları veya aralıkları seçin
  - Örnekler: `1-5`, `10`, `15-20`, `1-5, 10, 15-20`

### Gemini Modeli

| Model | RPM | Hız | Kalite | Önerilen Kullanım |
|-------|-----|-----|--------|-------------------|
| Gemini 3.1 Flash Lite (Preview) | 30 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Tüm kullanım senaryoları (Varsayılan) |

### İşleme Stratejileri

#### Sayfa Sayfa
- Her sayfa için ayrı API isteği
- Daha detaylı soru üretimi
- Daha fazla API kullanımı
- **Önerilen**: Küçük belgeler (< 20 sayfa)

#### Sayfa Grupları
- Birden fazla sayfayı birlikte işle
- Daha az API isteği
- Bağlamsal sorular
- **Önerilen**: Büyük belgeler (> 20 sayfa)

### Soru Tipleri

1. **Olgusal**: Doğrudan bilgi soruları (X nedir?)
2. **Kavramsal**: Kavram odaklı sorular (X neden önemlidir?)
3. **Bağlamsal**: Bağlam soruları (X hangi bağlamda belirtilmiştir?)
4. **Nedensel**: Sebep-sonuç soruları (X'in nedeni nedir?)
5. **Süreçsel**: Süreç soruları (X nasıl gerçekleşir?)
6. **Analitik**: Karşılaştırma soruları (X ile Y nasıl karşılaştırılır?)
7. **Varsayımsal**: Varsayım soruları (X olsaydı ne olurdu?)
8. **Yansıtıcı**: Sonuç soruları (X'in sonuçları nelerdir?)
9. **Spekülatif**: Görüş soruları (Birisi X konusunda neden farklı düşünebilir?)
10. **Listeleme**: Liste soruları (X'in temel unsurları nelerdir?)
11. **Özetleme**: Özet soruları (X'in ana çıkarımı nedir?)

### Özel Soru Tipleri

Kendi soru tiplerinizi oluşturabilirsiniz:

1. **Yapılandırma** sekmesine gidin
2. **"Özel Soru Tipi Ekle"** düğmesine tıklayın
3. Tip adı, açıklama ve örnek girin
4. Kaydedin ve kullanmaya başlayın

Özel tipler localStorage'da saklanır ve sonraki kullanımlarda otomatik yüklenir.

## 💡 İpuçları

### Performans Optimizasyonu

- **Hızlı işleme için**: Flash-Lite modelleri ve grup işleme kullanın
- **Kalite için**: Pro model ve sayfa sayfa işleme kullanın
- **Dengeli**: Flash model ve 5 sayfalık gruplar

### Rate Limit Yönetimi

Uygulama otomatik olarak rate limit'leri yönetir:
- API istekleri arasında uygun bekleme
- Limit aşılırsa otomatik yeniden deneme
- Gerçek zamanlı durum göstergesi

### Büyük PDF'ler

100+ sayfa için:
- Grup işleme kullanın (5-10 sayfa/grup)
- Flash veya Flash-Lite modeli seçin
- İşlemi duraklat/devam ettir özelliğini kullanın

### Veri Güvenliği

- API anahtarı AES-256 ile şifrelenir
- Tüm işlemler tarayıcınızda gerçekleşir
- Hiçbir veri sunucuya gönderilmez
- İstediğiniz zaman verileri temizleyebilirsiniz

## 📊 Excel Çıktısı

Dışa aktarılan Excel dosyası 3 sayfa içerir:

### Sayfa 1: Sorular
- Sıra numarası
- Sayfa numarası
- Soru metni
- Cevap metni
- Soru tipi
- Grup numarası
- Oluşturma zamanı

### Sayfa 2: Özet
- Toplam soru sayısı
- İşleme süresi
- Grup sayısı
- Soru tipi dağılımı
- Hata sayısı

### Sayfa 3: Yapılandırma
- PDF dosya adı
- Seçilen sayfalar
- Kullanılan model
- İşleme stratejisi
- Soru tipleri

## 🛠️ Teknik Detaylar

### Teknoloji Yığını

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **PDF İşleme**: PDF.js (Mozilla)
- **Excel**: SheetJS (xlsx.js)
- **Şifreleme**: CryptoJS
- **İkonlar**: Font Awesome
- **API**: Google Gemini API

### Tarayıcı Desteği

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dosya Boyutu Limitleri

- **PDF**: Pratik olarak sınırsız (tarayıcı belleğine bağlı)
- **Önerilen**: < 50 MB
- **localStorage**: ~5-10 MB (ayarlar ve özel tipler)

## 🔧 Geliştirme

### Proje Yapısı

```
soruolustur/
├── index.html              # Ana HTML dosyası
├── css/
│   └── styles.css          # Özel CSS stilleri
├── js/
│   ├── app.js              # Ana uygulama
│   ├── api-client.js       # Gemini API istemcisi
│   ├── batch-processor.js  # Toplu işleme
│   ├── excel-exporter.js   # Excel dışa aktarma
│   ├── pdf-handler.js      # PDF işleme
│   ├── question-types.js   # Soru tipi yönetimi
│   ├── rate-limiter.js     # Rate limit yönetimi
│   ├── storage.js          # LocalStorage yönetimi
│   └── ui-controller.js    # UI güncellemeleri
└── README.md
```

### Modüller

#### storage.js
LocalStorage yönetimi ve API anahtarı şifreleme

#### question-types.js
Varsayılan ve özel soru tiplerini yönetir

#### pdf-handler.js
PDF yükleme ve metin çıkarma

#### rate-limiter.js
API istek kuyruğu ve rate limit yönetimi

#### api-client.js
Gemini API ile iletişim

#### batch-processor.js
Toplu işleme mantığı ve ilerleme takibi

#### excel-exporter.js
SheetJS kullanarak Excel dosyası oluşturma

#### ui-controller.js
Tüm UI güncellemeleri

#### app.js
Ana uygulama orkestratörü

## 🐛 Sorun Giderme

### PDF Yüklenmiyor

- PDF'in şifre korumalı olmadığından emin olun
- Dosya boyutunu kontrol edin (çok büyük dosyalar yavaş olabilir)
- Tarayıcınızın güncel olduğundan emin olun

### API Bağlantı Hatası

- API anahtarının doğru olduğundan emin olun
- İnternet bağlantınızı kontrol edin
- API kotanızı kontrol edin

### Sorular Üretilmiyor

- Metin içermeyen (sadece resim) PDF'leri desteklenmez
- Sayfa seçiminin geçerli olduğundan emin olun
- En az bir soru tipi seçilmiş olmalıdır

### Rate Limit Hatası

- Uygulama otomatik olarak bekler
- Farklı bir model deneyin (daha yüksek RPM)
- Günlük limit aşıldıysa ertesi gün deneyin

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Fırat Kızıltepe**

- GitHub: [@FiratKiziltepe](https://github.com/FiratKiziltepe)
- Web: [firatkiziltepe.github.io](https://firatkiziltepe.github.io)

## 🙏 Teşekkürler

- Google Gemini API
- Mozilla PDF.js
- SheetJS
- Tailwind CSS
- Font Awesome

## 📮 Geri Bildirim

Sorular, öneriler veya hata raporları için GitHub Issues kullanabilirsiniz.

---

**Versiyon**: 1.0
**Son Güncelleme**: 2025-11-16
