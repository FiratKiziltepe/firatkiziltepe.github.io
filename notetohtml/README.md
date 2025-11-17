# 📚 NotebookLM to HTML Converter

 

Google NotebookLM HTML dosyalarını tek dosyaya dönüştüren web tabanlı uygulama.

 

## ✨ Özellikler

 

- ✅ **Surgical Mode V10** - Açıkla butonu gizleme + Ekrana sığma garantisi

- ✅ **Base64 Iframe Enjeksiyonu** - Angular uygulamalarına erişim

- ✅ **Tam Offline Çalışma** - İnternet bağlantısı gerektirmez

- ✅ **Sürükle-Bırak Desteği** - Kolay dosya yükleme

- ✅ **Modern UI** - Responsive ve kullanıcı dostu arayüz

- ✅ **Shadow DOM Desteği** - Tüm bileşenlere erişim

 

## 🚀 Kullanım

 

1. [https://firatkiziltepe.github.io/notetohtml/](https://firatkiziltepe.github.io/notetohtml/) adresini ziyaret edin

2. Google NotebookLM'den sayfayı **"HTML olarak kaydet"**

3. İndirilen `.html` dosyasını ve `_files` klasörünü yükleyin

4. **"Dönüştür"** butonuna tıklayın

5. Tek HTML dosyasını indirin

 

## 📋 Nasıl Çalışır?

 

### 1. Dosya Okuma

- File API ile HTML ve kaynak dosyaları okunur

- FileReader ile text ve binary içerikler işlenir

 

### 2. Kaynak Gömme

- CSS/JS dosyaları inline olarak eklenir

- Resimler/fontlar base64 olarak encode edilir

- Tüm harici bağımlılıklar kaldırılır

 

### 3. Surgical Mode Enjeksiyonu

- Base64 iframe'ler bulunur ve decode edilir

- Surgical Mode V10 script'i enjekte edilir

- Tekrar encode edilerek yerleştirilir

 

### 4. İndirme

- Blob API ile yeni HTML oluşturulur

- URL.createObjectURL ile indirme linki yaratılır

- Kullanıcı tek dosyayı indirir

 

## 🛠️ Teknik Detaylar

 

### Surgical Mode V10

 

```javascript

// Özellikler:

- Evrensel CSS (* { max-width: 100vw !important; })

- Scrollbar gizleme (tüm tarayıcılar)

- Shadow DOM CSS enjeksiyonu

- Açıkla butonu hassas hedefleme

- Taşan elementleri otomatik daraltma

- MutationObserver ile dinamik kontrol

- Pencere boyutu değişiminde adapte olma

```

 

### Desteklenen Dosya Türleri

 

- **CSS**: Inline style tag olarak

- **JavaScript**: Inline script tag olarak

- **Resimler**: PNG, JPG, SVG, GIF, WebP (base64)

- **Fontlar**: WOFF, WOFF2, TTF, EOT, OTF (base64)

- **Medya**: MP4, WebM, MP3, WAV (base64)

- **Diğer**: PDF, JSON, XML (base64)

 

## 🌐 Tarayıcı Desteği

 

- ✅ Chrome/Edge (90+)

- ✅ Firefox (88+)

- ✅ Safari (14+)

- ✅ Opera (76+)

 

## 📱 Responsive Tasarım

 

- Desktop: 1200px+ (tam özellik)

- Tablet: 768px - 1199px (adapte)

- Mobile: < 768px (tek kolon)

 

## 🔒 Güvenlik

 

- Tüm işlemler tarayıcıda yapılır

- Hiçbir veri sunucuya gönderilmez

- %100 client-side işleme

- Kişisel verilere erişim yok

 

## 📝 Lisans

 

MIT License - Fırat Kızıltepe

 

## 🙏 Katkıda Bulunun

 

Pull request'ler hoş karşılanır!

 

1. Fork edin

2. Feature branch oluşturun (`git checkout -b feature/amazing`)

3. Commit yapın (`git commit -m 'feat: amazing feature'`)

4. Push edin (`git push origin feature/amazing`)

5. Pull Request açın

 

## 📧 İletişim

 

- GitHub: [@FiratKiziltepe](https://github.com/FiratKiziltepe)

- Website: [firatkiziltepe.github.io](https://firatkiziltepe.github.io)

 

---

 

Made with ❤️ by Fırat Kızıltepe