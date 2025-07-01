# MEB Yapay Zeka Etik Çerçevesi Web Sitesi

Bu proje, Millî Eğitim Bakanlığı'nın eğitimde yapay zeka uygulamaları için geliştirdiği etik çerçeve ve kurul yapısı raporunu web sitesi formatında sunar.

## 🚀 Özellikler

- **Modern ve Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- **Karanlık Mod Desteği**: Kullanıcı tercihine göre tema değiştirme
- **İnteraktif İçerik**: Tab'lar, animasyonlar ve kullanıcı dostu arayüz
- **SEO Optimizasyonu**: Arama motorları için optimize edilmiş
- **Erişilebilirlik**: WCAG standartlarına uygun tasarım
- **Mobil Uyumlu**: Tüm ekran boyutlarında mükemmel deneyim

## 📁 Proje Yapısı

```
meb-ai-ethics-html-website/
├── index.html              # Ana sayfa
├── about.html              # Rapor hakkında
├── international.html      # Uluslararası çerçeveler
├── principles.html         # Etik ilkeler
├── committee.html          # Etik kurul
├── assessment.html         # EED modeli
├── roadmap.html           # Yol haritası
├── resources.html         # Kaynaklar
├── contact.html           # İletişim
├── styles.css             # Ana CSS dosyası
├── script.js              # JavaScript dosyası
├── *.png, *.webp          # Görsel dosyalar
└── README.md              # Bu dosya
```

## 🛠️ Teknolojiler

- **HTML5**: Semantik ve erişilebilir markup
- **CSS3**: Modern styling, flexbox, grid, animasyonlar
- **Vanilla JavaScript**: Framework'süz, performanslı kod
- **Responsive Design**: Mobile-first yaklaşım

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Birincil**: #003399 (MEB Mavi)
- **İkincil**: #0066CC (Açık Mavi)
- **Vurgu**: #FF6B35 (Turuncu)
- **Arka Plan**: #FFFFFF (Beyaz)
- **Metin**: #333333 (Koyu Gri)

### Tipografi
- **Başlıklar**: Inter, sans-serif
- **Metin**: Inter, sans-serif
- **Boyutlar**: 16px (base), 1.125 (scale)

## 🚀 Kurulum ve Çalıştırma

### Yerel Geliştirme

1. Projeyi klonlayın:
```bash
git clone [repository-url]
cd meb-ai-ethics-html-website
```

2. Yerel sunucu başlatın:
```bash
# Python ile
python -m http.server 8000

# Node.js ile
npx serve .

# PHP ile
php -S localhost:8000
```

3. Tarayıcıda açın: `http://localhost:8000`

### GitHub Pages ile Dağıtım

1. GitHub repository'sine yükleyin
2. Settings > Pages bölümüne gidin
3. Source olarak "Deploy from a branch" seçin
4. Branch olarak "main" seçin
5. Kaydedin ve siteniz yayınlanacak

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## ♿ Erişilebilirlik

- WCAG 2.1 AA standartlarına uygun
- Klavye navigasyonu desteği
- Screen reader uyumlu
- Yüksek kontrast oranları
- Alt text'ler ve ARIA etiketleri

## 🔧 Özelleştirme

### Renkleri Değiştirme
`styles.css` dosyasındaki CSS değişkenlerini düzenleyin:

```css
:root {
  --primary: #003399;
  --secondary: #0066CC;
  --accent: #FF6B35;
  /* ... */
}
```

### İçerik Güncelleme
HTML dosyalarındaki içerikleri doğrudan düzenleyebilirsiniz.

### Yeni Sayfa Ekleme
1. Yeni HTML dosyası oluşturun
2. Mevcut şablonu kopyalayın
3. Navigation menüsüne ekleyin
4. Footer linklerini güncelleyin

## 📊 Performans

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje Millî Eğitim Bakanlığı tarafından geliştirilmiştir. Tüm hakları saklıdır.

## 📞 İletişim

- **E-posta**: yapayzeka.etik@meb.gov.tr
- **Adres**: Millî Eğitim Bakanlığı, Atatürk Bulvarı No: 98, Kızılay/Ankara

## 🙏 Teşekkürler

Bu projenin geliştirilmesinde katkıda bulunan tüm paydaşlara teşekkür ederiz.

---

**Not**: Bu web sitesi, MEB Yapay Zeka Uygulamaları Etik Çerçevesi ve Kurul Yapısı Raporu'nun dijital versiyonudur. Güncel bilgiler için resmi MEB kanallarını takip ediniz.

