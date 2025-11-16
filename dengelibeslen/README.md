# 🥗 Dengeli Beslen - Gıda İçerik Analiz Uygulaması

Yapay zeka destekli gıda etiket analizi ile sağlık risklerini değerlendirin.

## 📋 Özellikler

- **📷 Fotoğraf Çekme**: Cihaz kamerasından doğrudan etiket fotoğrafı çekme
- **🖼️ Galeri Yükleme**: Galeriden mevcut fotoğraf yükleme
- **🤖 AI Analiz**: Gemini Vision API ile otomatik içerik tanıma ve analiz
- **🎯 Risk Değerlendirmesi**: Düşük/Orta/Yüksek risk sınıflandırması
- **⚙️ Model Seçimi**: 5 farklı Gemini modelinden seçim yapabilme
- **👤 Kullanıcı Profili**: Alerji ve diyet tercihlerini kaydetme
- **💡 Kişiselleştirilmiş Analiz**: Profilinize göre özel uyarılar ve öneriler
- **📱 Mobil Uyumlu**: Responsive tasarım, her cihazda mükemmel çalışır
- **🔒 Gizlilik**: Görselleriniz tarayıcınızda kalır, sunucuda saklanmaz

## 🚀 Kullanım

1. **API Ayarlarını Yapın**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz Gemini API anahtarı alın
   - Uygulamada "Model Seçimi" dropdown'ından tercih ettiğiniz modeli seçin (varsayılan: Gemini 2.0 Flash)
   - API anahtarınızı girin ve "Kaydet" butonuna tıklayın

2. **Kullanıcı Profilinizi Oluşturun** (Opsiyonel ama Önerilir)
   - Alerjilerinizi seçin (Fıstık, Süt Ürünleri, Gluten, Soya, Yumurta, Kabuklu Deniz Ürünleri)
   - Diyet tercihlerinizi belirtin (Vegan, Vejetaryen, Helal, Koşer)
   - Sağlık durumlarınızı girin (Diyabet, hipertansiyon vb.)
   - "Profili Kaydet" butonuna tıklayın

3. **Fotoğraf Çekin veya Yükleyin**
   - "Fotoğraf Çek" butonu ile kameranızı kullanın
   - "Galeriden Yükle" ile mevcut fotoğrafı seçin
   - Gıda etiketinin "İçindekiler" bölümünü net çekin

4. **Analiz Edin**
   - "Analiz Et" butonuna tıklayın
   - Yapay zeka seçtiğiniz modelle etiketinizi okuyacak ve analiz edecek

5. **Sonuçları İnceleyin**
   - **Size Özel Özet**: Profilinize göre kişiselleştirilmiş uyarılar (varsa)
   - **Risk Seviyesi**: Düşük 🟢 / Orta 🟡 / Yüksek 🔴
   - **İçerik Analizi**: Her bileşenin detaylı açıklaması
   - **Sağlık Riskleri**: Potansiyel tehlikeler ve öneriler

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: Google Gemini 2.x (Vision Models)
- **Hosting**: GitHub Pages
- **Tasarım**: Mobile-first, Responsive

## 🤖 Desteklenen Gemini Modelleri

| Model | BGBG/Gün | Token/Dk | Açıklama |
|-------|----------|----------|----------|
| **Gemini 2.0 Flash** ⭐ | 15 | 1M | Önerilen - Hızlı ve dengeli |
| **Gemini 2.0 Flash-Lite** | 30 | 1M | En yüksek ücretsiz quota |
| **Gemini 2.5 Flash** | 10 | 250K | Gelişmiş performans |
| **Gemini 2.5 Flash-Lite** | 15 | 250K | İyi denge |
| **Gemini 2.5 Pro** | 2 | 125K | En gelişmiş, en doğru |

*BGBG: Bedava Günlük Başvuru Garantisi (Free Requests Per Day)*

## 📱 Canlı Demo

[https://firatkiziltepe.github.io/dengelibeslen](https://firatkiziltepe.github.io/dengelibeslen)

## 🔐 Gizlilik ve Güvenlik

- API anahtarınız yalnızca tarayıcınızın local storage'ında saklanır
- Yüklediğiniz görseller sunucuya gönderilmez, doğrudan Gemini API'ye iletilir
- Kişisel verileriniz toplanmaz veya saklanmaz

## ⚠️ Yasal Uyarı

Bu uygulama **eğitim ve bilgilendirme amaçlıdır**. Verilen bilgiler tıbbi tavsiye yerine geçmez. Sağlık durumunuzla ilgili kararlar için lütfen bir sağlık profesyoneline danışın.

## 📖 Risk Sınıflandırması

### 🟢 Düşük Risk
- Doğal içerikler (un, su, tuz, baharatlar)
- Temel besin maddeleri
- Yaygın kullanılan, kabul görmüş katkılar

### 🟡 Orta Risk
- E621 (MSG) - yüksek tüketimde dikkat
- Bazı koruyucular (E200-299)
- Yüksek şeker/tuz içeriği
- Aspartam gibi tatlandırıcılar

### 🔴 Yüksek Risk
- Yapay renklendiriciler
- Trans yağlar
- Nitrit/Nitrat (E249-252)
- Bilinen allerjenler

## 🤝 Katkıda Bulunma

Önerileriniz ve katkılarınız için GitHub Issues kullanabilirsiniz.

## 📄 Lisans

MIT License

## 👨‍💻 Geliştirici

**Fırat Kızıltepe**
- GitHub: [@firatkiziltepe](https://github.com/firatkiziltepe)

---

**Not**: Bu proje, sağlıklı beslenme bilincini artırmak amacıyla geliştirilmiştir. Yapay zeka analizleri %100 doğru olmayabilir, her zaman eleştirel düşünün ve profesyonel danışmanlık alın.
