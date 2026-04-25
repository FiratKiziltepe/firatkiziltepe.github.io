# Tematik Analiz Sistemi

Gemini AI ile güçlendirilmiş, öğretmen görüşlerini analiz eden profesyonel bir web uygulaması.

🔗 **Demo**: [https://firatkiziltepe.github.io/tematikanaliz/](https://firatkiziltepe.github.io/tematikanaliz/)

## Özellikler

- 📊 **10,000+ Satır Excel Desteği**: Büyük veri setlerini batch processing ile hızlıca analiz edin
- 🤖 **Gemini AI Entegrasyonu**: Google'ın en yeni Gemini 3.1 Flash Lite (Preview) modeli ile güçlendirilmiş
- 📈 **Gelişmiş Görselleştirmeler**: Chart.js ile interaktif grafikler ve istatistikler
- 🎯 **Tematik Analiz**: Otomatik kategorizasyon ve sentiment analizi
- 📥 **Excel Export**: Analiz sonuçlarını Excel formatında indirin
- 🔍 **Filtreleme ve Arama**: Sonuçları kolayca filtreleyin ve arayın
- 📝 **Yönetici Özeti**: AI tarafından oluşturulan kapsamlı raporlar
- 🔒 **Gizlilik**: Tüm işlemler tarayıcınızda gerçekleşir
- 🌐 **CDN Tabanlı**: Kurulum gerektirmez, doğrudan tarayıcıda çalışır

## Kullanım

1. **API Anahtarı**: Gemini API anahtarınızı girin ([buradan](https://aistudio.google.com/app/apikey) alabilirsiniz)
2. **Dosya Yükle**: Excel dosyanızı sürükleyip bırakın veya seçin
3. **Analiz**: "Analizi Başlat" butonuna tıklayın
4. **Sonuçlar**: Grafikler, tablolar ve yönetici özetini inceleyin
5. **Export**: İsterseniz sonuçları Excel olarak indirin

## Excel Dosya Formatı

Excel dosyanız şu sütunları içermelidir:

- `Entry Id`: Benzersiz tanımlayıcı
- `DERS`: Ders adı
- `SINIF`: Sınıf seviyesi
- `Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.`: Öğretmen görüşü

## Analiz Kategorileri

- Ders Kitabı İçeriği
- Müfredat
- Ölçme Değerlendirme
- Fiziki Koşullar
- Öğretmen Kılavuzu
- Öğrenci Seviyesi
- Zaman Yönetimi
- Diğer

## Teknolojiler

- Vanilla HTML/CSS/JavaScript (ES6 Modules)
- TailwindCSS (CDN)
- Chart.js (Grafikler)
- XLSX (Excel işlemleri)
- Google Generative AI (Gemini)

## Deployment

Bu uygulama statik bir web sayfasıdır ve herhangi bir web sunucusunda veya GitHub Pages'te barındırılabilir.

## Gizlilik ve Güvenlik

- API anahtarınız sadece tarayıcınızda (localStorage) saklanır
- Hiçbir veri sunucuya gönderilmez
- Tüm analiz işlemleri client-side gerçekleşir
- API anahtarı güvenli bir şekilde Gemini API'ye gönderilir

## Performans

- Batch processing (50 satır/batch)
- 1 saniye delay between batches (rate limiting için)
- Lazy loading ve pagination
- Optimized chart rendering
- Minimal dependencies (tamamı CDN'den)

## Lisans

MIT
