# 🥗 Dengeli Beslen - Gıda İçerik Analiz Uygulaması

Yapay zeka destekli gıda etiket analizi ile sağlık risklerini değerlendirin.

## 📋 Özellikler

- **📷 Fotoğraf Çekme**: Cihaz kamerasından doğrudan etiket fotoğrafı çekme
- **🖼️ Galeri Yükleme**: Galeriden mevcut fotoğraf yükleme
- **🤖 AI Analiz**: Gemini Vision API ile otomatik içerik tanıma ve analiz
- **🎯 Risk Değerlendirmesi**: Düşük/Orta/Yüksek risk sınıflandırması
- **📱 Mobil Uyumlu**: Responsive tasarım, her cihazda mükemmel çalışır
- **🔒 Gizlilik**: Görselleriniz tarayıcınızda kalır, sunucuda saklanmaz

## 🚀 Kullanım

1. **API Anahtarı Alın**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz Gemini API anahtarı alın
   - Anahtarınızı uygulamada "API Anahtarı" bölümüne girin ve kaydedin

2. **Fotoğraf Çekin veya Yükleyin**
   - "Fotoğraf Çek" butonu ile kameranızı kullanın
   - "Galeriden Yükle" ile mevcut fotoğrafı seçin
   - Gıda etiketinin "İçindekiler" bölümünü net çekin

3. **Analiz Edin**
   - "Analiz Et" butonuna tıklayın
   - Yapay zeka etiketinizi okuyacak ve analiz edecek

4. **Sonuçları İnceleyin**
   - Risk seviyesini görün (🟢 Düşük / 🟡 Orta / 🔴 Yüksek)
   - Her bileşenin detaylı açıklamasını okuyun
   - Sağlık risklerini öğrenin

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: Google Gemini 2.0 Flash (Vision)
- **Hosting**: GitHub Pages
- **Tasarım**: Mobile-first, Responsive

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
