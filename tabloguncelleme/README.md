# E-İçerik Tablo Sistemi

3000+ satırlık Excel verisiyle hızlı çalışan dinamik tablo sistemi.

## Kurulum

### 1. Excel'i JSON'a Çevirme

**Windows kullanıcıları:**
```bash
# Kolay yöntem - Bat dosyası ile
convert.bat dosya.xlsx

# Manuel yöntem
pip install -r requirements.txt
python excel_to_json.py dosya.xlsx
```

**Linux/Mac kullanıcıları:**
```bash
pip install -r requirements.txt
python excel_to_json.py dosya.xlsx
```

### 2. Web Sunucusuna Yükleme
1. Oluşan `data.json` dosyasını web projesi dizinine kopyalayın
2. Tüm dosyaları web sunucusuna yükleyin
3. `index.html` dosyasını açın

## Performans Özellikleri

- **Otomatik Veri Yükleme**: JSON'dan hızlı veri okuma
- **Debounced Search**: 300ms gecikme ile arama optimizasyonu  
- **Smart Filtering**: Önce önemli alanlarda arama
- **DOM Optimization**: Fragment kullanımı ile hızlı render
- **Memory Efficient**: Sayfalama ile bellek kullanımı

## Özellikler

- ✅ Otomatik veri yükleme
- ✅ Ders bazlı filtreleme
- ✅ Hızlı arama
- ✅ Sıralama (↑↓)
- ✅ Sayfalama (10/25/50/100)
- ✅ PDF export
- ✅ Responsive tasarım
- ✅ 3000+ satır desteği

## Veri Formatı

JSON dosyası şu formatta olmalı:
\`\`\`json
[
  {
    "SIRA NO": "1",
    "DERS ADI": "Matematik",
    "ÜNITE TEMA ÖĞRENME ALANI": "Sayılar",
    "KAZANIM ÖĞRENME ÇIKTISIBİLGİ": "...",
    "E-İÇERİK TÜRÜ": "Video",
    "AÇIKLAMA": "..."
  }
]
\`\`\`
