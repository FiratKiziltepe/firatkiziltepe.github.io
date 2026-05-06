# 📚 Gemini Literatür Tarama Aracı

Sistematik literatür taraması için Google Gemini API destekli otomatik tarama web uygulaması.

## 🌟 Özellikler

- ✅ Google Gemini API entegrasyonu
- 📊 CSV dosyası yükleme ve işleme
- 🎯 Include/Exclude/Maybe kararları
- 📝 Özelleştirilebilir screening talimatı
- ⚡ Batch processing (Rate limit koruması)
- 💾 Sonuçları CSV olarak indirme
- 📈 Gerçek zamanlı ilerleme takibi
- 📊 İstatistik gösterimi

## 🚀 Başlangıç

### 1. Gemini API Key Alma

Google AI Studio'dan ücretsiz API key alın:
1. [Google AI Studio](https://makersuite.google.com/app/apikey) sayfasına gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API key'inizi kopyalayın

### 2. Uygulamayı Kullanma

1. `index.html` dosyasını bir web tarayıcısında açın
2. Gemini API key'inizi girin (localStorage'da güvenli şekilde saklanır)
3. CSV dosyanızı yükleyin
4. Gerekirse screening talimatını düzenleyin
5. "Analizi Başlat" butonuna tıklayın
6. Sonuçları görüntüleyin ve CSV olarak indirin

## 📁 CSV Dosya Formatı

CSV dosyanız **tab-separated** (TSV) formatında olmalı ve şu sütunları içermelidir:

```
ID	Title	Abstract
1	Article Title Here	Article abstract text here...
2	Another Article	Another abstract...
```

**Gerekli sütunlar:**
- `Title`: Makalenin başlığı
- `Abstract`: Makalenin özeti

**Opsiyonel sütunlar:**
- `ID`: Makale ID'si (yoksa otomatik atanır)

## ⚙️ Ayarlar

### Batch Size (Parti Boyutu)
- Her seferde işlenecek makale sayısı
- **Önerilen:** 5-10 makale
- Rate limit sorunlarını önler

### Batch'ler Arası Bekleme
- Her batch arasında bekleme süresi (saniye)
- **Önerilen:** 2-5 saniye
- API rate limit'lerini yönetir

### Screening Talimatı
- Gemini'ye verilen analiz talimatı
- İhtiyacınıza göre özelleştirilebilir
- Dahil etme/hariç tutma kriterlerini içerir
- JSON çıktı formatını belirtir

## 📊 Çıktı Formatı

Sonuç tablosu şu bilgileri içerir:

| Sütun | Açıklama |
|-------|----------|
| ID | Makale ID'si |
| Yazar(lar) | Makale yazarları |
| Başlık | Makale başlığı |
| Yıl | Yayın yılı |
| Kısa Özet (TR) | Türkçe özet |
| Karar | Include/Exclude/Maybe |
| Gerekçe | Karar gerekçesi |

## 🎨 Özelleştirme

### Screening Kriterlerini Değiştirme

`index.html` içindeki `<textarea id="instructions">` bölümünden veya uygulamada arayüzden talimatı düzenleyebilirsiniz:

```
## ✅ Dahil Etme Ölçütleri
* Odak: ...
* Araştırma deseni: ...

## ❌ Hariç Tutma Ölçütleri
* ...
* ...
```

### Stil Değişiklikleri

`style.css` dosyasını düzenleyerek görünümü özelleştirebilirsiniz.

## 🔒 Güvenlik

- API key'iniz **sadece tarayıcınızda** (localStorage) saklanır
- API çağrıları doğrudan **tarayıcınızdan** Google'a gider
- Hiçbir veri üçüncü parti sunuculara gönderilmez

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler
- HTML5
- CSS3 (Grid, Flexbox, Gradients)
- Vanilla JavaScript (ES6+)
- Google Gemini API (gemini-3.1-flash-lite-preview)

### API Yapılandırması
- Model: `gemini-3.1-flash-lite-preview`
- Temperature: 0.2 (tutarlı sonuçlar için)
- Max Output Tokens: 2048

### Batch İşleme
1. CSV makaleleri batch'lere bölünür
2. Her batch sırayla işlenir
3. Batch'ler arası konfigurasyon edilebilir bekleme
4. Hata durumunda makale "Maybe" olarak işaretlenir

## ❓ Sık Sorulan Sorular

### API rate limit hatası alıyorum
- Batch size'ı küçültün (örn: 3-5)
- Batch'ler arası bekleme süresini artırın (örn: 5-10 saniye)

### JSON parse hatası alıyorum
- Bu normal, fallback mekanizması devreye girer
- Talimatınızın JSON formatını net belirttiğinden emin olun

### Sonuçlar beklediğim gibi değil
- Screening talimatınızı daha spesifik hale getirin
- Örnekler ekleyin
- Kriterleri daha net tanımlayın

## 📝 Lisans

Bu proje MIT lisansı altında sunulmaktadır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
