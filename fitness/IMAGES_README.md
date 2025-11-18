# Egzersiz Görselleri ve Videoları

Bu klasörler, egzersizlerin görsel ve video dosyalarını içerir.

## 📁 Klasör Yapısı

```
fitness-program/
├── images/          # Egzersiz görselleri (.jpg formatında)
└── video/           # Egzersiz videoları (.gif formatında)
```

## 🖼️ Görsel Ekleme

Görselleri eklerken egzersizin **tam adını** kullanın:

### Örnekler:

```
images/Klasik Mekik (Crunch).jpg
images/Diz Çekme (Lying Knee Tucks).jpg
images/Plank (Diz Destekli).jpg
images/Dead Bug.jpg
images/Duvara Şınav.jpg
```

### Video Ekleme:

```
video/Klasik Mekik (Crunch).gif
video/Diz Çekme (Lying Knee Tucks).gif
video/Plank (Diz Destekli).gif
video/Dead Bug.gif
video/Duvara Şınav.gif
```

## 📝 İsimlendirme Kuralları

1. **Dosya adı** = Egzersizin `exercises-data.js` dosyasındaki `name` alanı
2. **Görsel formatı** = `.jpg`
3. **Video formatı** = `.gif`
4. **Büyük/küçük harf** ve **parantezler** önemlidir!

## 🔍 Egzersiz Adlarını Bulma

`exercises-data.js` dosyasında tüm egzersiz adlarını bulabilirsiniz:

```javascript
{
  id: "abs_crunch_basic",
  name: "Klasik Mekik (Crunch)",  // ← Bu adı kullanın
  // ...
}
```

## ✅ Otomatik Yükleme

Görseller ve videolar otomatik olarak yüklenir:

- Dosya varsa → Görsel/video gösterilir
- Dosya yoksa → Placeholder icon gösterilir

## 📋 Tüm Egzersiz Adları Listesi

Kolaylık için tüm egzersiz adlarını burada bulabilirsiniz:

### Karın / Göbek / Bel
- Klasik Mekik (Crunch).jpg
- Diz Çekme (Lying Knee Tucks).jpg
- Plank (Diz Destekli).jpg
- Dead Bug.jpg
- Side Plank (Diz Destekli).jpg
- Tam Plank.jpg
- Bicycle Crunch.jpg
- Leg Raise (Bacak Kaldırma).jpg
- Russian Twist.jpg
- Mountain Climber.jpg
- Hanging Leg Raise.jpg
- V-Sit Up.jpg
- Plank with Leg Lift.jpg
- Ab Wheel Rollout.jpg
- Dragon Flag.jpg

### Göğüs
- Duvara Şınav.jpg
- Dizler Yerde Şınav.jpg
- Dumbbell Floor Press.jpg
- Klasik Şınav.jpg
- Incline Push-Up.jpg
- Dumbbell Bench Press.jpg
- Dumbbell Fly.jpg
- Decline Push-Up.jpg
- Explosive Push-Up.jpg
- Weighted Push-Up.jpg
- Archer Push-Up.jpg

### Sırt
- Superman.jpg
- Resistance Band Row.jpg
- Yere Yüzüstü T Row.jpg
- Bent-Over Row (Dumbbell).jpg
- One-Arm Dumbbell Row.jpg
- Reverse Fly.jpg
- Pull-Up.jpg
- Chin-Up.jpg
- Weighted Pull-Up.jpg
- Inverted Row.jpg

### Omuz
- Front Shoulder Raise.jpg
- Lateral Raise.jpg
- Shoulder Circles.jpg
- Dumbbell Shoulder Press.jpg
- Arnold Press.jpg
- Upright Row.jpg
- Handstand Hold (Duvar Destekli).jpg
- Handstand Push-Up.jpg
- Push Press.jpg

### Kol
- Biceps Curl.jpg
- Triceps Dips (Sandalye Destekli).jpg
- Hammer Curl.jpg
- Concentration Curl.jpg
- Triceps Overhead Extension.jpg
- Close-Grip Push-Up.jpg
- Weighted Dips.jpg
- 21s Biceps Curl.jpg
- Diamond Push-Up.jpg

### Kalça / Bacak / Ayak
- Squat (Vücut Ağırlığı).jpg
- Glute Bridge.jpg
- Standing Calf Raise.jpg
- Walking Lunges (Kısa Adım).jpg
- Bulgarian Split Squat.jpg
- Dumbbell Squat.jpg
- Reverse Lunge.jpg
- Step-Up.jpg
- Barbell Back Squat.jpg
- Jump Squat.jpg
- Pistol Squat (Yardımlı).jpg
- Walking Lunges (Ağırlıklı).jpg

### Tüm Vücut
- Burpee.jpg
- Jumping Jacks.jpg
- High Knees.jpg
- Plank to Push-Up.jpg

## 💡 İpuçları

1. **Toplu İsimlendirme**: Görsellerinizi toplu olarak yeniden adlandırmak için:
   - Windows: PowerShell veya batch script
   - Mac/Linux: `mv` komutu veya bash script
   - Her platformda: Dosya yöneticisi toplu yeniden adlandırma özelliği

2. **Format Dönüştürme**:
   - PNG → JPG: Online araçlar veya Adobe Photoshop
   - MP4 → GIF: Online dönüştürücüler veya FFmpeg

3. **Boyutlandırma**:
   - Görsel boyutu: 800x600px önerilir
   - GIF boyutu: 480x360px ve <5MB önerilir

## 🚀 Hızlı Başlangıç

1. Egzersiz görsellerinizi hazırlayın
2. Yukarıdaki isimlendirmeye göre yeniden adlandırın
3. `images/` klasörüne kopyalayın
4. GIF'leri `video/` klasörüne kopyalayın
5. Sayfayı yenileyin - otomatik yüklenecektir!

## ❓ Sık Sorulan Sorular

**S: Tüm egzersizler için görsel eklemek zorunda mıyım?**
C: Hayır! Sadece eklediğiniz görseller gösterilir, geri kalanlar için placeholder icon gösterilir.

**S: Farklı format kullanabilir miyim?**
C: Şu an sadece .jpg ve .gif destekleniyor. Başka format kullanmak için `app.js` dosyasında düzenleme yapmanız gerekir.

**S: Dosya adında Türkçe karakter olabilir mi?**
C: Evet! Dosya sistemleri Türkçe karakterleri destekler. Ancak bazı sistemlerde sorun olursa İngilizce karakter kullanabilirsiniz.

---

**Not**: Görseller ve videolar repository'de saklanmaz (çok yer kaplarlar). Lokal olarak ekleyin veya CDN kullanın.
