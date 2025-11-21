# 🚀 Hızlı Başlangıç Kılavuzu

## Adım 1: Gemini API Key Alın

1. [Google AI Studio](https://aistudio.google.com/app/apikey) sayfasına gidin
2. Google hesabınızla giriş yapın
3. **"Create API Key"** butonuna tıklayın
4. Oluşturulan API key'i kopyalayın (örn: `AIzaSyA...`)

## Adım 2: Sistemi Açın

Tarayıcınızda `index.html` dosyasını açın veya GitHub Pages üzerinden erişin.

## Adım 3: API Anahtarını Kaydedin

1. Sayfanın üst kısmında **"API Anahtarı"** bölümüne gidin
2. Kopyaladığınız API key'i yapıştırın
3. **"Kaydet"** butonuna tıklayın
4. Sistem API key'inizi test edecek ve başarılı olursa onay verecek

> ⚠️ API anahtarınız sadece tarayıcınızda (localStorage) saklanır. Güvenlidir.

## Adım 4: Excel Dosyanızı Hazırlayın

Excel dosyanızın şu kolonları içermesi önerilir:

| Entry Id | Görüş, tespit veya önerilerinizi buraya yazabilirsiniz. | DERS | SINIF |
|----------|-------------------------------------------------------|------|-------|
| 1 | Ders kitabı içeriği güncel değil ve güncellenmelidir. | Matematik | 5 |
| 2 | Etkinlikler öğrenci seviyesine göre çok zor. | Fen Bilgisi | 6 |
| 3 | Öğretmen kılavuzu yeterli açıklama içermiyor. | Türkçe | 7 |

**Zorunlu kolonlar:**
- Entry ID (veya benzeri benzersiz tanımlayıcı)
- Görüş/Öneri metni

**Opsiyonel kolonlar:**
- Ders
- Sınıf

## Adım 5: Excel Dosyasını Yükleyin

İki yöntemden birini kullanın:

### Yöntem 1: Sürükle-Bırak
1. Excel dosyanızı sürükleyin
2. Yükleme alanının üzerine bırakın

### Yöntem 2: Dosya Seç
1. **"Dosya Seç"** butonuna tıklayın
2. Bilgisayarınızdan Excel dosyasını seçin
3. Açın

## Adım 6: Kolonları Seçin

1. Sistem otomatik olarak kolonları tanımaya çalışacak
2. Eğer yanlış seçildiyse, dropdown'lardan doğru kolonları seçin:
   - **Entry ID Kolonu**: Benzersiz tanımlayıcı içeren kolon
   - **Görüş/Öneri Kolonu**: Analiz edilecek metin içeren kolon
   - **Ders Kolonu**: (Opsiyonel) Ders adı
   - **Sınıf Kolonu**: (Opsiyonel) Sınıf seviyesi

3. **Batch Boyutu** ayarlayın (Önerilen: 10-15)
   - Küçük batch = Daha yavaş ama güvenli
   - Büyük batch = Daha hızlı ama rate limit riski

## Adım 7: Analizi Başlatın

1. **"Analizi Başlat"** butonuna tıklayın
2. Sistem otomatik olarak:
   - Verileri batch'lere böler
   - Her batch'i Gemini API'ye gönderir
   - İlerlemeyi gösterir
   - Sonuçları toplar

⏱️ **Süre**: 100 satır için yaklaşık 2-5 dakika

## Adım 8: Sonuçları İnceleyin

Analiz tamamlandığında göreceğiniz bilgiler:

### 📊 İstatistikler
- Toplam analiz sayısı
- Pozitif/Negatif/Nötr duygu dağılımı
- Aksiyona dönük öneri sayısı

### 📈 Kategori Dağılımı
En çok tekrar eden kategoriler grafik olarak gösterilir:
- Ders Kitabı İçeriği
- Müfredat
- Ölçme Değerlendirme
- Fiziki Koşullar
- Öğretmen Kılavuzu
- Diğer

### 📋 Detaylı Tablo
Her satır için:
- Entry ID
- Ana Kategori
- Alt Tema
- Duygu (Pozitif/Negatif/Nötr)
- Aksiyona Dönük mü?

### 📝 Yönetici Özeti
Sistem otomatik olarak:
1. Genel durum değerlendirmesi
2. Kritik sorun alanları
3. Stratejik iyileştirme önerileri

oluşturur.

## Adım 9: Sonuçları İndirin

İki format seçeneği:

### 📥 Excel İndir
- Detaylı sonuçlar tablosu
- İstatistikler sayfası
- Microsoft Excel'de açılabilir

### 📥 JSON İndir
- Metadata ile tam veri seti
- Programatik kullanım için
- Yedekleme için ideal

## 💡 İpuçları

### Performans
- **Büyük dosyalar** (1000+ satır): Batch size'ı 10-12 tutun
- **Küçük dosyalar** (100-500 satır): Batch size 15-20 olabilir
- İnternet bağlantınız yavaşsa batch size'ı düşürün

### Hata Durumunda
Eğer analiz sırasında hata alırsanız:
1. API key'inizi kontrol edin
2. İnternet bağlantınızı kontrol edin
3. Batch size'ı düşürün ve tekrar deneyin
4. Bir süre bekleyip tekrar deneyin (rate limit)

### Veri Kalitesi
Daha iyi sonuçlar için:
- Görüş metinlerinin anlamlı ve açık olması
- Çok kısa metinlerden kaçınma (min 10-15 kelime ideal)
- Boş satırları temizleme

## 🔒 Güvenlik ve Gizlilik

- ✅ Tüm işlemler tarayıcınızda gerçekleşir
- ✅ Veriler sadece Google Gemini API'ye gönderilir
- ✅ API key'iniz sadece bilgisayarınızda saklanır
- ✅ Sunucuya hiçbir veri gönderilmez
- ✅ Offline çalışmaz (API iletişimi gerekir)

## 📞 Destek

Sorun yaşarsanız:
1. Tarayıcı konsolunu açın (F12)
2. Hata mesajlarını kontrol edin
3. README.md dosyasındaki "Sorun Giderme" bölümüne bakın

## 🎯 Örnek Kullanım Senaryosu

**Senaryo**: 500 öğretmen görüşünü analiz etmek

1. API key'i kaydet (30 saniye)
2. Excel dosyasını yükle (5 saniye)
3. Kolonları kontrol et (15 saniye)
4. Batch size = 15 ayarla
5. Analizi başlat
6. Bekle: ~3-4 dakika
7. Sonuçları incele
8. Excel'e aktar

**Toplam Süre**: ~5 dakika

## ✅ Başarı!

Artık tematik analiz sisteminizi kullanmaya hazırsınız! 🎉

Kolay gelsin! 🚀

