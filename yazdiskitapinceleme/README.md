# TTKB Ders Kitabı İnceleme Sistemi: Arayüz Prototipi

`prd.md` dokümanına göre hazırlanmış, veritabanı ve backend kullanmayan bir arayüz prototipidir. Build adımı gerekmez.

## Çalıştırma

`index.html` dosyasını Chrome, Edge, Safari veya Firefox ile açmanız yeterlidir. İsterseniz yerel bir sunucu da kullanabilirsiniz:

```bash
python -m http.server 8000   # ardından http://localhost:8000
```

- Tablette denemek için aynı ağdaki bir bilgisayarda yukarıdaki sunucuyu başlatın, ardından tabletten `http://<bilgisayar-ip>:8000` adresini açın.
- Fontlar Google Fonts'tan, PDF.js ise yalnızca **Yerel PDF aç** kullanıldığında cdnjs'ten yüklenir. Bu yüzden internet bağlantısı gerekir. Bağlantı yoksa demo kitap sistem fontlarıyla açılır.
- Veriler yalnızca tarayıcının `localStorage` alanında tutulur. Sayfayı yenilediğinizde kayıtlar korunur. Demo veriyi sıfırlamak için: sağ üstteki kullanıcı menüsü → **Demo verisini sıfırla**.

## Prototipte neler var

| Alan | İçerik |
|---|---|
| Demo kitap | 7. Sınıf Sosyal Bilgiler, 276 sayfa, 7 ünite. Sayfalar PDF görünümünde çizilir; metin seçilebilir. |
| Gerçek PDF | **⋯ → Yerel PDF aç** veya PDF'i görüntüleyiciye sürükleyip bırakın. PDF.js metin katmanı sayesinde seçim yapılabilir, tespit oluşturulabilir ve işaretçiler PDF üzerinde görünür. |
| Tespit akışı | Metin veya alan seçilir, bağlamsal araç çubuğundan **Tespit oluştur** seçilir. Form; seçilen alan, kapsam (seçim/sayfa/etkinlik/ünite/kitap), ana kriter, alt kriter ve tespit metninden oluşur. Önem derecesi alanı yoktur. |
| Kriterler | Ölçütler numaralıdır (1.1 Anayasa ve Mevzuata Uygunluk → 1.1.1 … 1.1.6 gibi). Ana ve alt kriter **aranabilir combobox** ile seçilir; kod (`1.1.4`) veya kelime (`reklam`) ile aranabilir. Ana kriter değişince alt kriter listesi o kritere göre daralır. Ana kriter seçmeden de tüm alt kriterlerde arama yapılabilir; seçilen alt kriter ana kriteri otomatik doldurur. |
| İki kriter belirleme modu | Formun üstündeki **Kriter belirleme** anahtarıyla geçilir. **Kriteri ben seçeyim** klasik akıştır. **YAZDİS önersin** modunda panelist sorunu kendi cümleleriyle yazar (ör. “burada reklam unsuru var”); YAZDİS ana ve alt kriteri, güven oranını, gerekçeyi ve resmî bir tespit ifadesini önerir. Panelist **Öneriyi onayla** veya **Düzelt** seçer. Kayıtta kriterin kaynağı (`manual`, `yazdis-accepted`, `yazdis-edited`) ve YAZDİS önerisi model geliştirme verisi olarak saklanır. Prototipte API yoktur; öneriler `js/data.js` içindeki `SUGGEST_RULES` anahtar kelime kurallarından üretilir. |
| İşaretçiler | İnsan tespiti mavi ve numaralıdır. YAZDİS önerisi mor çerçeveli `YZ` etiketi taşır. TYMM işaretçisi köşeli `D1`/`E1` etiketidir: aday kesikli çizgiyle, doğrulanmış dolu gösterilir. Diğer panelistlerin işaretçisi kesikli `B1`/`C1` etiketidir. İşaretçiler metni kapatmamak için sayfa kenar boşluğuna yerleşir. PDF ile kart arasında hover ve tıklama iki yönlü çalışır. |
| YAZDİS | Her öneri için **Onayla**, **Düzenle ve Onayla** ve **Reddet** seçenekleri vardır. Reddederken 5 ret nedeninden biri seçilir; **Diğer** için açıklama yazılabilir. Oluşan tespitte YAZDİS kökeni korunur. |
| Panel / Komisyon | Üst bardaki aşama rozetine tıklayıp **Prototip · Admin simülasyonu** bölümünden ayarlanır. Panel Aşama 1'de Diğerleri sekmesi kilitlidir. Aşama 2'de Katılıyorum/Katılmıyorum seçilir ve gerekçe yazılabilir. Komisyon modunda `showOtherReviewerFindings` ayarı ile sekme gizlenir ya da salt okunur gösterilir. |
| TYMM | Sol panelde iki görünüm bulunur: değer/eğilim listesi ve ünite × bileşen kapsam haritası. Sağ panelde doğrulama yapılır: **İşlenmiş Olarak Doğrula**, **Düzenle**, **Eşleşme Değil** veya **Yetersiz** (Açık/Örtük seçimiyle). Kanıtı olmayan hücreden doğrudan **Tespit Oluştur** açılabilir. PDF üzerindeki TYMM katmanı açılıp kapatılabilir. |
| Diğer | Global arama (sayfa no, D1/E1, kriter, tespit, PDF metni), **Bu Sayfa / Tüm Kitap**, filtre çipleri, otomatik kaydetme ve taslak koruma, Geri al, odak modu, tam ekran, koyu tema, sepya/gece sayfa tonu. |

## Öğretim programı, ilişkili kitaplar ve yayınevi paneli

**İnceleme ekranı (`index.html`)**

- **Program bağlamı şeridi** (PDF araç çubuğunun altında): o sayfayı yayınevinin hangi öğrenme çıktısı ve süreç bileşenleriyle (`SB.7.2.1 · a b c`) ve hangi değer/eğilimlerle (`D1`) eşleştirdiğini gösterir. Şeritte ayrıca ilgili kılavuz ve çalışma kitabı sayfaları ile medya bağlantıları bulunur. Eşleştirilmemiş içerik sayfalarında uyarı çıkar.
- **Detay** sağ panelde öğrenme çıktısının tamamını açar:
  - süreç bileşenleri ve her birinin eşleştiği sayfalar (bu sayfaya ait olanlar vurgulanır, eşleşmeyenler kırmızı)
  - öğretme-öğrenme uygulamaları: OB1, KB2.10, D1 gibi kodlar açıklamalı çiplerle gösterilir; D/E kodları TYMM kapsamını açar
  - ilişkili kaynaklar
  - **Program uyumu tespiti** kısayolu: kriter 1.4.1 ve öğrenme çıktısı referansı dolu bir tespit formu açar
- Sol paneldeki **Program** sekmesi tüm öğrenme çıktılarını listeler. Süreç bileşeni kapsamını, sayfa bağlantılarını ve eşleşmeyen bileşenleri gösterir; buradan doğrudan eksiklik tespiti oluşturulabilir.
- PDF alanının üstündeki **belge sekmeleri** (Ders Kitabı | Öğretmen Kılavuz Kitabı | Öğrenci Çalışma Kitabı) ve **Ekler → İlişkili kitaplar** ile kitaplar arasında geçilir. İlişkili kitaplarda da tespit oluşturulabilir. Kitaplar arası bağlantılar öğrenme çıktısı üzerinden kurulur.
- **Medya** sekmesi yayınevinin eşleştirdiği sayfaları ve öğrenme çıktısını gösterir. Altyazısı veya transkripti olmayan medya için "YAZDİS analiz edemedi" uyarısı çıkar.
- Tespit formunda kriter 1.4 seçildiğinde **ilgili öğrenme çıktısı / süreç bileşeni** de seçilebilir; bu sayfayla eşleştirilenler listenin başında yer alır.

**Yayınevi paneli (`publisher.html`)**: kullanıcı menüsünden veya **⋯** menüsünden açılır. 4 adımdan oluşur:

1. **Kitap ve dosyalar:** ders kitabı, öğretmen kılavuz kitabı ve öğrenci çalışma kitabı yükleme alanları ile kitaplar arası ilişki tablosu.
2. **Sayfa eşleştirme:** sayfa listesi, sayfa önizlemesi ve eşleştirme düzenleyicisinden oluşur.
   - Öğrenme çıktısı aranarak eklenir, süreç bileşenleri tek tek işaretlenir.
   - YAZDİS eşleştirme önerileri, değer/eğilim beyanı ve sayfa türü aynı panelde düzenlenir.
   - Shift + tıklama ile aralık seçilip **toplu eşleştirme** yapılabilir; **Önceki sayfadan kopyala** ve **Sonraki eşleşmemiş** kısayolları vardır.
   - **Kapsam tablosu** her süreç bileşeninin hangi sayfalarda karşılandığını ve eksik kalanları gösterir.
3. **Medya eşleştirme:** video, ses ve etkileşimli içerik sürükle-bırakla yüklenir. Her medya için sayfalar (karekodun yer aldığı sayfalar), öğrenme çıktısı ve YAZDİS'in inceleyebilmesi için altyazı/transkript ya da açıklama metni girilir.
4. **Kontrol ve gönderim:** eksik eşleştirmeleri, kapsanmayan süreç bileşenlerini ve transkripti eksik medyayı listeler. Her maddenin yanında **Düzelt** bağlantısı, ardından beyan ve **İncelemeye gönder** adımı gelir.

Yayınevi panelinde yapılan eşleştirmeler aynı tarayıcıda inceleme ekranına anında yansır (iki sekme açıkken bile). Öğrenme çıktıları, süreç bileşenleri ve öğretme-öğrenme uygulamaları TYMM program biçiminde hazırlanmış **demo içeriktir** (`js/data.js` → `OUTCOMES`); gerçek program metni buraya aktarılabilir.

## Sunum senaryosu: iki kriter belirleme yöntemi

1. Sayfa 44'e gidin. **Bilgi Kutusu · Daha Fazlası İçin** içindeki “Bilgin Kırtasiye'nin hazırladığı Altın Tarih Atlası'nı edinebilirsiniz.” cümlesini seçin ve **Tespit oluştur**'a tıklayın.
2. **Klasik yöntem:** Ana kriter alanında `anayasa` yazıp Enter'a basın. Alt kriter listesi kendiliğinden açılır; `reklam` yazıp 1.1.4'ü seçin, tespiti yazıp kaydedin.
3. **YAZDİS destekli yöntem:** Aynı cümleyi yeniden seçin, **YAZDİS önersin** anahtarını açın ve `burada reklam unsuru var` yazın. YAZDİS 1.1 › 1.1.4'ü önerir; **Bu ifadeyi tespit metni olarak kullan** ve ardından **Öneriyi onayla**'ya tıklayıp kaydedin.
4. **Düzeltme örneği:** `görselin çözünürlüğü düşük` yazın; öneri 1.5.2 olur. **Düzelt**'e tıklayıp alt kriteri değiştirin. Kayıt, kartta “Kriter: YAZDİS önerisi düzeltildi” olarak görünür.

Örnek ifadeler ve önerilen kriterler: `yazım hatası, bitişik yazılmalı` → 1.3.1 · `soruda iki doğru cevap var` → 1.6.1 · `kişileri aşağılayıcı ifade` → 1.1.3 · `harita lejantı yanlış` → 1.5.4 · `bu bilgi yanlış` → 1.2.1

## Responsive davranış

- **Masaüstü (≥ 1440 px):** üç panel birlikte açık. Sol panel daraltılabilir; daraltıldığında yalnızca ikonlar kalır ve üzerine gelince açılan flyout kullanılır. Sağ panelin kenarı sürüklenerek genişliği 360–650 px arasında ayarlanabilir.
- **Laptop / yatay tablet (960–1439 px):** sol panel varsayılan olarak daraltılmış ikon çubuğu olarak gelir. PDF genişliğe sığdırılır.
- **Dikey tablet (600–959 px):** sol panel dokunmayla açılan flyout olarak çalışır. Sağ panel alttan açılan bir sayfaya dönüşür; tutamağı sürükleyerek veya dokunarak min / yarım / tam boy arasında geçiş yapılır.
- **Mobil (< 600 px):** sol panel hamburger menüden çekmece olarak açılır. Alt sayfada kayıtlar görüntülenip onaylanabilir.
- **Dokunmatik ekran:** iki parmakla yakınlaştırma desteklenir. Uzun basarak metin seçildiğinde araç çubuğu, sistem menüsüyle çakışmaması için seçimin altında açılır. **Alan** aracında parmakla dikdörtgen çizilebilir. Dokunma hedefleri büyütülmüştür.

## Klavye kısayolları

`←/→` sayfa · `+/−` zoom · `0` genişliğe sığdır · `P` sayfaya sığdır · `V/R` metin/alan aracı · `T` TYMM katmanı · `I` sayfa incelendi · `J/K` kartlar arasında gezinme · `[ / ]` paneller · `F` odak modu · `Ctrl+K` arama · `Ctrl+Enter` formu kaydet · `Esc` kapat/geri

## Dosya yapısı

```
index.html
css/app.css        tasarım tokenları (açık/koyu), yerleşim, responsive kurallar
js/data.js         demo kitap, kriterler, TYMM bileşenleri, tohum kayıtlar
js/core.js         durum, localStorage kalıcılığı, sorgular, ikonlar, toast/popover
js/viewer.js       PDF çalışma alanı: sayfa çizimi, zoom, işaretçiler, seçim, PDF.js
js/panels.js       sol navigasyon ve sağ değerlendirme paneli
js/main.js         üst bar, araç çubuğu, belge sekmeleri, program şeridi, akışlar, arama, yerleşim, kısayollar
publisher.html     yayınevi paneli (kitap yükleme ve eşleştirme)
js/publisher.js    yayınevi paneli: dosyalar, sayfa ↔ öğrenme çıktısı/değer, medya, kontrol ve gönderim
css/publisher.css  yayınevi paneli stilleri
```

Veri nesneleri PRD §46'daki ayrımı izler: `Finding`/`FindingEvidence`, `YazdisFinding`/`YazdisDecision`, `TYMMEvidence` (doğrulama alanlarıyla), `ReviewerAgreement`, `ReviewConfiguration`. `Finding` ile `TYMMEvidence` ayrı tutulur; TYMM eksikliği gerektiğinde `Finding` oluşturur. Seçim kanıtı `selectedText`, `contextBefore/After` ve normalize edilmiş `boundingBox` ile saklanır.

## Bilinen sınırlar

- Kitap içeriği, YAZDİS çıktıları ve panelist kayıtları kurgusal demo verisidir. TYMM kodları PRD'deki örneklere göre seçilmiştir (D1 Doğruluk, E1 Merak vb.).
- Yüklenen PDF'lerde YAZDİS ve diğer panelist verisi bulunmaz. Yalnızca incelemecinin kendi tespitleri ve TYMM kanıtları çalışır.
- Medya oynatıcı ve ek belge önizlemeleri temsilidir.
