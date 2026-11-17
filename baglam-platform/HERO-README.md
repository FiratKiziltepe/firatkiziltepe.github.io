# Bağlam — araştırma yolculuğu

Yeni hero mevcut `index.html` açılışına entegredir. `baglam-hero.html`, aynı uygulamanın CSS ve JavaScript'i içine alınmış tek dosyalık sürümüdür; tarayıcıda doğrudan açılabilir.

## Çalıştırma

Proje klasöründe `python3 -m http.server 4173 --bind 127.0.0.1` çalıştırıp `http://127.0.0.1:4173` adresini açın. Alternatif olarak `baglam-hero.html` dosyasını tarayıcıya sürükleyin.

## Dosyalar

- `js/hero.js`: altı adımın metinleri, SVG robot/yol, animasyon ve yaşam döngüsü.
- `css/hero.css`: hero'ya özel renkler, yerleşim, responsive davranış ve azaltılmış hareket desteği.
- `js/app.js`: mevcut açılış, kayıt ve modül bağlantıları; sayfa geçişinde animasyonun temizlenmesi.
- `scripts/build-hero-prototype.py`: `python3 scripts/build-hero-prototype.py` ile tek HTML sürümünü yeniden üretir. Üretilen dosyayı doğrudan düzenlemeyin.

## Davranış

İlk sahnede yalnızca büyük robot ve soru görünür. Yaklaşık 4,4 saniyelik girişten sonra aynı SVG karakteri 1,9 saniyede küçülür; yol çizilir ve duraklar sırayla belirir. Her durakta 4,7 saniye beklenir, yürüyüş 1,35 saniyedir. Son açıklamadan sonra kısa bir kutlama ve “Bir sorudan bilimsel bilgiye!” mesajıyla akış durur.

Durak veya alt gösterge seçimi robotu seçilen noktaya yürütür, ardından otomatik ilerlemeyi duraklatır. Oynat düğmesi seçilen adımdan devam eder. “Yeniden izle” ilk büyük robot sahnesine döner. Giriş, küçülme, yürüyüş, göz kırpma, el hareketleri ve balon görünürlüğü aynı animasyon saatini kullanır; duraklatma hepsini dondurur.

Masaüstünde altı durak soldan sağa tek sıra halinde okunur. Mobilde üçer duraklı iki sıraya geçilir. Diyagram hem genişliğe hem kullanılabilir ekran yüksekliğine göre ölçeklenir; kısa masaüstü ekranlarında hero'nun dikey boşlukları azaltılır. Giriş ve yolculuk aynı sahne alanını kullanır; geçişlerde sayfa yüksekliği değişmez.

Sekme arka plandayken veya hero ekrandan çıkınca animasyon askıya alınır. `prefers-reduced-motion: reduce` etkinse otomatik oynatma kapalı başlar ve hareket efektleri uygulanmaz. Kontroller klavyeyle kullanılabilir; elle seçilen adımlar ekran okuyucuya bildirilir.

Robot ve yol SVG/CSS ile oluşturulur; hero WebGL, Three.js, görsel indirme veya bir API gerektirmez. Mevcut uygulamanın diğer 3B ikonları Three.js CDN'ini, fontları Google Fonts'u kullanmayı sürdürür; bağlantı yoksa hero sistem fontuyla çalışır. Tek HTML sürümü ders videolarını içine almaz; mevcut ders ekranları `assets/video` klasörünü kullanır.

Açılış metinleri iki araştırma grubuna uygun olarak genelleştirildi. Mevcut kayıt/ilgi profili akışı ve modül içerikleri korunur; bu değişiklik deney/kontrol grubu atama sistemi eklemez.
