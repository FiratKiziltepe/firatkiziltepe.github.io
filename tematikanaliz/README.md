# Tematik Analiz Sistemi

Gemini AI ile güçlendirilmiş, öğretmen görüşlerini analiz eden profesyonel bir web uygulaması.

## Özellikler

- 📊 **10,000+ Satır Excel Desteği**: Büyük veri setlerini batch processing ile hızlıca analiz edin
- 🤖 **Gemini AI Entegrasyonu**: Google'ın en yeni Gemini 2.0 Flash modeli ile güçlendirilmiş
- 📈 **Gelişmiş Görselleştirmeler**: İnteraktif grafikler ve istatistikler
- 🎯 **Tematik Analiz**: Otomatik kategorizasyon ve sentiment analizi
- 📥 **Excel Export**: Analiz sonuçlarını Excel formatında indirin
- 🔍 **Filtreleme ve Arama**: Sonuçları kolayca filtreleyin ve arayın
- 📝 **Yönetici Özeti**: AI tarafından oluşturulan kapsamlı raporlar
- 🔒 **Gizlilik**: Tüm işlemler tarayıcınızda gerçekleşir

## Kurulum

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Production build oluşturun
npm run build
```

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

- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- Recharts (Grafikler)
- XLSX (Excel işlemleri)
- Google Generative AI (Gemini)

## Lisans

MIT
