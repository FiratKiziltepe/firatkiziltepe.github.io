# Literatür Tarama Çalışma Alanı (v13)

Sistematik literatür taramalarında **başlık/özet aşamasındaki dahil etme–hariç tutma kararlarını** destekleyen, yapay zekâ destekli bir tarama çalışma alanıdır. Araç nihai karar verici değildir; ölçüt bazlı, gerekçeli ve denetlenebilir **ön kararlar** üretir, insan incelemesi gereken kayıtları işaretler ve PRISMA raporlamasına uygun çıktı verir. v13 ile Rayyan benzeri **ekip taraması** eklendi.

- **Web arayüzü** (`index.html`): kurulum gerektirmez, tarayıcıda çalışır. Giriş yapmadan herkes analiz yapabilir.
- **Ekip taraması** (Supabase): yönetici analizi veritabanına kaydeder, hakemler Include / Maybe / Exclude kararı verir.
- **Komut satırı** (`cli.mjs`, Node ≥ 18): uzun süren (ör. 20.000+ kayıtlık) taramalar için.
- Hepsi aynı motoru (`screening-core.js`) kullanır; aynı girdi ve protokolle aynı karar mantığını uygular.

---

## v13'te neler değişti?

Arayüz dört sekmeye ayrıldı: **⚙️ Analiz · 📊 Tarama · ♻️ Tekrarlar · ☁️ Projeler**.

### Tarama tablosu
- Sütunlar: *Yazar / yıl* (DOI bağlantısı yazarların altında, yeni sekmede açılır) · *Başlık* (seçim kutusu, **Excel satırı**) · *Özet · sarı kanıtlar* · *Karar* · *Güven* · *Ölçütler* (IC/EC çipleri) · *Kısa gerekçe* · *Etiketler / not*.
- **Renkli kanıtlar:** modelin ölçüt başına verdiği birebir alıntılar özette ve başlıkta ölçüt çipleriyle aynı renkte işaretlenir: dahil etme kanıtı (IC karşılandı) yeşil, hariç tutma kanıtı (EC karşılandı ya da IC karşılanmadı) kırmızı, belirsiz sarı. Üzerine gelince ilgili ölçüt görünür. Büyük/küçük harf, tire ve "…" boşlukları tolere edilir.
- **Kısa gerekçe:** özet ve gerekçe tek bir Türkçe metinde birleşti (dil Analiz sekmesinden değiştirilebilir). Sistem denetimi notları gerekçeye karışmaz; ayrı bir "⚠️ Sistem denetimi" kutusunda durur.
- **Karar:** her kullanıcı ✓ / ? / ✕ (Include / Maybe / Exclude) düğmeleriyle kendi kararını verir; aynı düğmeye tekrar basınca karar kalkar. Altında AI kararı ve model bazında kararlar görünür.
- **Sayfalama:** sayfa başına 50 / 100 / 150 / 200 kayıt. Filtreler: AI kararı, kendi kararınız (karar vermediklerim, AI'dan farklı düşündüklerim…), durum (inceleme önerilen, modeller ayrıştı, çatışma, nihai karar…), etiket, arama. Sıralama: dosya sırası, güven, konu ilgisi, yıl.
- **Yeniden analiz:** seçili kayıtları ya da filtredeki tüm kayıtları, Analiz sekmesindeki model, anahtar ve protokolle yeniden tarayabilirsiniz. Hakem kararları, etiketler ve notlar korunur. Her AI sonucu, üretildiği prompt sürümünü saklar.

### Tekrarlar
- Tekrar adayları **yan yana** gösterilir; farklı alanlar vurgulanır. Seçenekler: *A'yı kaldır* · *Tekrar değil* · *B'yi kaldır*. Kaldırma geri alınabilir.
- DOI / başlık+yıl eşleşmesine ek olarak **🔍 Benzer başlıkları tara**, büyük harf, noktalama, alt başlık ve ±1 yıl farklarını da yakalar (sıralı komşuluk yöntemi, 20.000+ kayıtta hızlı). "Tekrar değil" dediğiniz çiftler bir daha önerilmez.

### Ekip taraması (Supabase)
| | Yönetici | Hakem |
|---|---|---|
| Analiz (giriş yapmadan da) | ✔ | ✔ |
| Analizi veritabanına kaydetme, proje oluşturma/silme | ✔ | – |
| Hakem ekleme/çıkarma | ✔ | – |
| Nihai karar, toplu işlem, tekrar kaldırma, yeniden analiz, proje ayarları | ✔ | ✔ (eklendiği projelerde) |
| Paylaşılan projeyi görme | tümü | yalnızca eklendiği projeler |
| Include / Maybe / Exclude, etiket, not | ✔ (kendi) | ✔ (yalnızca kendi) |

- **Toplu işlem:** "Filtredekilerin tümünü seç" ile (ör. AI Maybe dedikleri, model–kural tutarsızlıkları) seçip tek tıkla *oyunuzu* ya da *nihai kararı* işleyebilir veya kaldırabilirsiniz.
- **Hakem filtresi:** "👥 Hakem / nihai" menüsünden her hakemin Dahil / Belirsiz / Hariç dediği, oy verdiği ya da vermediği kayıtlar ve nihai karara göre süzme yapılır.
- **Canlı eşitleme:** Oylar, nihai kararlar, tekrar ve AI değişiklikleri Supabase Realtime ile anında gelir. Bağlantı koparsa 15 sn'de bir yalnızca değişen satırlar çekilir; sekmeye dönünce ve internet gelince hemen eşitlenir. Durum rozeti: ● Canlı / ◐ Eşitleniyor / ○ Bağlantı yok.
- **Kör mod (varsayılan açık):** hakemler yalnızca kendi kararlarını, etiketlerini ve notlarını görür. Kural veritabanında (RLS) uygulanır; API'den ya da canlı güncellemelerden başkasının oyu okunamaz. Yönetici tüm kararları görebilir ve isterse "Tüm hakem kararlarını göster" ile tabloda açabilir.
- Kör mod kapalıyken her satırda **kimin hangi kararı verdiği** görünür, çatışmalar "⚡" ile işaretlenir, yönetici **nihai kararı** verir. Kararlar diğer kullanıcılara sayfa yenilemeden (realtime) ulaşır.
- Excel/CSV dışa aktarımı her hakem için ayrı karar ve etiket/not sütunları, hakem uyumu ve nihai karar içerir.

**Kullanım:** Yönetici yerel analizi bitirir → Tarama sekmesinde **☁️ Veritabanına kaydet** → Projeler sekmesinde **⚙️ Yönet** ile kayıtlı kullanıcıları projeye ekler. Hakemler önce **🔐 Giriş yap → Kayıt ol** ile hesap açar; eklendikten sonra projeyi **📂 Aç** ile görür.

**Kurulum notları**
- Bağlantı ayarı `supabase-config.js` içindedir (yayımlanabilir anahtar; güvenlik RLS ile sağlanır). Şema `supabase/schema.sql` dosyasındadır.
- İlk yönetici `admin_emails` tablosundaki e-posta (şu an firatkiziltepe36@gmail.com) ile kayıt olan kişidir; şifreyi kayıt olurken siz belirlersiniz. Başka birini yönetici yapmak için Supabase SQL Editor'de:
  `update public.profiles set role = 'admin' where email = 'kisi@ornek.com';`
- Supabase panelinde **Authentication → URL Configuration → Site URL** alanına sitenin adresini (ör. `https://firatkiziltepe.github.io/makaletara/`) yazın. Böylece e-posta onay ve şifre sıfırlama bağlantıları doğru sayfaya döner.

---

## v12'de neler değişti?

### 1. Çoklu API anahtarıyla paralel tarama
- Her sağlayıcı (Gemini, OpenAI, DeepSeek, özel uç nokta) için **birden fazla anahtar** girilebilir (her satıra bir anahtar).
- Anahtar havuzu her anahtar ve model için **RPM (60 sn kayan pencere)** ve **RPD (Pasifik saatine göre gün)** sayaçlarını ayrı ayrı tutar. İstekleri o an kapasitesi olan anahtara yönlendirir.
- Toplam paralellik = *anahtar sayısı × anahtar başına eşzamanlı istek*.
- **429 (hız sınırı)** yanıtında anahtar, API'nin bildirdiği `retryDelay` süresi kadar beklemeye alınır; iş başka bir anahtara devredilir.
- **Günlük kota** dolduğunda o anahtar o gün için devre dışı kalır. Tüm anahtarların kotası dolarsa tarama hata üretmeden **duraklatılır** ve ertesi gün devam ettirilebilir.
- **Geçersiz anahtar** (400/401/403) otomatik olarak devre dışı bırakılır.
- Canlı **anahtar durum tablosu**: istek, başarılı, 429, hata ve günlük kullanım sayıları.
- Async **Batch API** modunda işler anahtarlara bölünür. Her anahtar kendi batch job'unu gönderir ve 20 MB satır içi (inline) sınırına göre otomatik parçalar.

> ⚠️ **Kota notu:** Gemini kotaları anahtar başına değil, **Google Cloud projesi başına** uygulanır. Aynı projeden alınan birden fazla anahtar aynı kotayı paylaşır. Paralel hız kazancı için anahtarlar farklı projelerden olmalıdır. Kota sınırlarını aşmak amacıyla çok sayıda hesap açmak sağlayıcının kullanım koşullarına aykırı olabilir. Önerilen kullanım: farklı projelerdeki ücretli anahtarlar ya da ekip üyelerinin kendi anahtarları.

### 2. Dahil etme / hariç tutma mantığının yeniden kurgulanması
Önceki sürümdeki metodolojik sorunlar ve çözümleri:

| Sorun (v11) | Çözüm (v12) |
|---|---|
| Sistem promptunda IC1–IC2 / EC1–EC5 sabit yazılıydı; ölçüt kutuları değişince prompt ile çelişiyordu. | Ölçüt listesi, karar kuralı ve JSON biçimi, ölçüt kutularından **otomatik üretilen protokol** olarak eklenir. Yönerge metnindeki kod atıfları ile ölçüt listesi karşılaştırılır ve tutarsızlıkta **uyarı** verilir. |
| Model yalnızca "eşleşen" kodları döndürüyordu. "Karşılanmadı" ile "bilgi yok" ayrımı yapılamıyordu. | Her ölçüt için **üç değerli değerlendirme**: `yes` / `no` / `unclear`. Özette bilginin bulunmaması "hayır" sayılmaz. |
| Karar yalnızca "Include" için denetleniyordu. | **Deterministik karar kuralı** tüm kararlara uygulanır (aşağıda). |
| Model "Include" deyip EC işaretlediğinde kayıt otomatik olarak "Exclude"a çevriliyordu (yanlış negatif riski). | Model kararı kendi ölçüt değerlendirmesiyle çelişirse kayıt **Uncertain + insan incelemesi** olarak işaretlenir. Otomatik dahil etme ya da dışlama yapılmaz. |
| Modelin verdiği gerekçe doğrulanmıyordu. | **Kanıt doğrulaması:** "karşılandı" denilen her ölçüt için özetten birebir alıntı istenir. Alıntı kayıt metninde bulunamazsa ölçüt "belirsiz" sayılır (sıfır çıkarım ilkesi). |
| IC'ler yalnızca VE ile birleşebiliyordu. | IC birleşimi seçilebilir: **tümü (VE)** / **en az biri (VEYA)**. EC'ler her zaman VEYA ile birleşir. |
| Çoklu modelde birincil modelin ham (doğrulanmamış) çıktısı gösteriliyordu. Hata veren model "Uncertain oyu" sayılıyordu. | Uzlaşı yalnızca doğrulanmış kararlar üzerinden yapılır: **oybirliği / çoğunluk / kapsayıcı**. Hata veren model oylamaya katılmaz, kayıt incelemeye işaretlenir. Modeller arası **Cohen κ** raporlanır. |
| Tekrar eden kayıtlar ayıklanmıyordu. | **DOI veya başlık+yıl** ile tekrar ayıklama yapılır (PRISMA'da "taramadan önce çıkarılan kayıtlar"). |
| İnsan kararı, AI kararının üzerine yazılıyordu. | **AI Kararı** ve **İnsan Kararı** ayrı tutulur. "AI kararı insan tarafından değiştirilen" sayısı raporlanır. |
| Yazar adları modele gönderiliyordu. | **Kör tarama:** modele yalnızca başlık, yıl, belge türü, anahtar kelimeler ve özet gönderilir (daha az yanlılık ve token). |

**Karar kuralı** (her model çıktısına istemci tarafında uygulanır):

```
1. Herhangi bir EC = yes                          → Exclude
2. IC koşulu başarısız (VE: herhangi IC = no;
                         VEYA: tüm IC = no)        → Exclude
3. IC koşulu sağlandı ve tüm EC = no               → Include
4. Diğer tüm durumlar (belirsiz IC ya da dışlanamayan EC) → Uncertain
+  Model kararı ≠ kural kararı                     → Uncertain + insan incelemesi
+  güven < eşik, Uncertain, model uyuşmazlığı, kanıt bulunamaması → insan incelemesi
```

### 3. Hata düzeltmeleri
- **ID eşleme hatası:** WoS dosyalarında ID sütunu yanlışlıkla `Authors` sütununa eşleniyordu (bulanık eşleştirmede "ut" → "A**ut**hors"). Artık `UT (Unique WOS ID)`, `EID`, `PMID` gibi sütunlar doğru eşlenir. Modele kısa iç kimlikler (`R00001`) gönderilir; kaynak ID dışa aktarımda korunur.
- **Async Batch API:** Durum kontrolü `JOB_STATE_*` ve `BATCH_STATE_*` değerlerinin hepsini tanır (önceki sürüm bazı durumlarda sonsuza kadar yokluyordu). Sonuç dosyası indirme adresi düzeltildi. Satır içi yanıtlar anahtar içermese de sıra üzerinden eşlenir. Sayfa yeniden yüklendikten sonra devam ederken anahtar kaybolma sorunu giderildi.
- **Ölçeklenebilirlik:** Durum `sessionStorage` (~5 MB) yerine **IndexedDB**'de tutulur; 20.000+ kayıt ve sekme kapansa bile devam etme desteklenir. Tablo sayfalı olarak çizilir (önceden her satırda tüm tablo yeniden filtreleniyordu).
- Kesilen (MAX_TOKENS) ya da eksik dönen yanıtlarda **eksik kayıtlar otomatik yeniden sorulur**, gerekirse istek ikiye bölünür.
- `responseSchema` desteklenmezse şemasız JSON moduna otomatik geçilir. Gemini 3 modellerinde sıcaklık model varsayılanında bırakılır.
- Düşünme (thinking) tokenları maliyete dahil edilir. API anahtarı URL yerine `x-goog-api-key` başlığıyla gönderilir.

---

## Web arayüzü kullanımı

1. `index.html` dosyasını tarayıcıda açın (GitHub Pages üzerinden de çalışır).
2. Modelleri seçin (en fazla 3). Her sağlayıcı için anahtarları **her satıra bir tane** olacak şekilde girin, ardından **🧪 Anahtarları Test Et** düğmesine basın.
3. Paralellik ayarları: *istek başına kayıt* (5–10 önerilir), *anahtar başına eşzamanlı istek*, RPM/RPD limitleri (ücretli katmanda kutuyu kaldırabilir ya da değer girebilirsiniz).
4. **Tarama Protokolü**: IC ve EC ölçütlerini her satıra bir tane yazın. Ardından karar mantığını ayarlayın: IC birleşimi, inceleme eşiği, uzlaşı stratejisi, özetsiz kayıtlar, kanıt doğrulaması, tekrar ayıklama.
5. *İncelemeye özgü yönerge* alanına kavram tanımlarını, operasyonel yorumları ve örnekleri yazın. **👁️ Modele gidecek tam metin** düğmesi, otomatik eklenen protokolle birlikte modele giden talimatın tamamını gösterir.
6. Dosyayı yükleyin (WoS `.xls`/`.txt`, Scopus/PubMed `.csv`, `.xlsx`). Algılanan sütunları, tekrarları ve maliyet/süre tahminini kontrol edin.
7. **🚀 Analizi Başlat**. Tarama sırasında **⏸️ Duraklat** ile durdurup **▶️ Devam Et** ile sürdürebilirsiniz. Tarayıcı kapansa da oturum kayıtlıdır.
8. Sonuçlarda filtreler: *insan kararı bekleyen*, *modeller ayrıştı*, *API hatası* vb. **Nihai Karar** sütunundan insan kararını girin. Ölçüt çiplerinin üzerine gelince model alıntısı görünür.
9. **🔁 Hatalı kayıtları yeniden tara** ile yalnızca API hatası alan kayıtlar yeniden taranır.
10. CSV/Excel olarak dışa aktarın. Excel dosyası `Screening`, `Metadata` (protokol, PRISMA sayıları, κ, prompt sürümü) ve `Log` sayfalarını içerir.

---

## Komut satırı (CLI)

```bash
cd gemini-literature-screening
npm install            # yalnızca .xlsx/.xls okuma-yazma için gerekli
node cli.mjs --help
```

Örnek — üç Gemini anahtarıyla paralel tarama:

```bash
# keys.txt: her satıra bir anahtar ("#" ile başlayan satırlar yok sayılır)
node cli.mjs -i savedrecs.xls -o sonuc.xlsx \
  --inclusion ic.txt --exclusion ec.txt --guidance yonerge.txt \
  --models gemini:gemini-2.5-flash \
  --gemini-keys keys.txt --batch-size 8 --concurrency 2 --rpm 10 --rpd 250
```

İki model ve uzlaşı:

```bash
export GEMINI_API_KEYS="AIza...,AIza..."
export OPENAI_API_KEYS="sk-..."
node cli.mjs -i kayitlar.csv -o sonuc.csv \
  --models gemini:gemini-2.5-flash,openai:gpt-4o-mini --consensus unanimous
```

- `Ctrl+C` ile durdurun; durum `<çıktı>.state.json` dosyasına yazılır. Devam etmek için aynı komutu `--resume` ile çalıştırın. Hatalı kayıtları yeniden taramak için `--resume --retry-errors` kullanın.
- Devam ederken **prompt sürümü ve girdi dosyası doğrulanır**; farklıysa çalışma reddedilir (tekrarlanabilirlik).
- `--estimate-only`: istek ve token tahmini verir.
- `--base-url openai=https://openrouter.ai/api/v1` gibi özel uç noktalar desteklenir.

---

## Girdi biçimi

| Rol | Tanınan sütun adları (örnekler) | Zorunlu |
|---|---|---|
| Başlık | `Article Title`, `Title`, `TI`, `Başlık` | ✔ (başlık veya özet) |
| Özet | `Abstract`, `AB`, `Özet` | ✔ |
| ID | `UT (Unique WOS ID)`, `UT`, `EID`, `PMID`, `ID` | – (yoksa sıra no) |
| Yazar | `Authors`, `AU`, `Yazar` | – (modele gönderilmez) |
| Yıl | `Publication Year`, `PY`, `Year` | – |
| DOI | `DOI`, `DI` | – (tekrar ayıklama) |
| Anahtar kelime | `Author Keywords`, `DE` | – |
| Belge türü | `Document Type`, `DT` | – (EC "derleme" vb. için yararlı) |

CSV/TSV ayırıcıları (virgül, sekme, noktalı virgül) otomatik algılanır. RFC 4180 tırnaklama ve çok satırlı hücreler desteklenir.

---

## Çıktı sütunları

`Sıra, ID, İç ID, DOI, Yazar(lar), Başlık, Yıl, Abstract, Özet`, her model için `Karar: <model>`, `AI Kararı, İnsan Kararı, Nihai Karar, Güven, Model Uyumu`, **her ölçüt için bir sütun** (`IC1 … ECn` = yes/no/unclear), `Karşılanan IC, Karşılanan EC, Hariç Tutma Gerekçesi, Kanıt Alıntıları, Konu İlgisi, İlişki Gerekçesi, İnceleme Gerekli, Gerekçe, Hata, Prompt Versiyon`.

**Metadata** sayfası: araç sürümü, modeller, mod, prompt özeti (SHA-256[0:8]), karar mantığı ayarları, PRISMA sayıları (tanımlanan, tekrar, taranan, Include/Exclude/Uncertain, insan incelemesi, insan tarafından değiştirilen), modeller arası Cohen κ, token ve maliyet, ölçütlerin tam metni ve modele gönderilen sistem talimatının tamamı.

---

## Akademik kullanım önerileri

- Aracı **ikinci/yardımcı değerlendirici** olarak konumlandırın. Include ve Uncertain kayıtlar tam metin aşamasına geçer; *insan incelemesi gerekli* kayıtlar mutlaka insan tarafından değerlendirilmelidir.
- Yöntem bölümünde şunları raporlayın: model adı ve sürümü, tarih, prompt sürüm özeti, karar kuralı, eşik değer ve uzlaşı stratejisi (hepsi Metadata sayfasındadır).
- Protokolü pilot bir alt örneklem (ör. 100 kayıt) üzerinde insan kararlarıyla karşılaştırın. Duyarlılığı (sensitivity) ve κ değerini raporlayın. Gerekirse yönergeyi iyileştirip **yeni bir prompt sürümü** ile tüm taramayı yeniden çalıştırın.
- Başlık/özet aşamasında yanlış negatifleri en aza indirmek için varsayılan ayarlar temkinlidir: oybirliği uzlaşısı, 0.85 inceleme eşiği ve açık kanıt doğrulaması.

---

## Proje yapısı

```
index.html          Web arayüzü (Analiz · Tarama · Tekrarlar · Projeler)
style.css           Stil (gece/gündüz teması)
script.js           Analiz mantığı (IndexedDB, anahtar tablosu, paralel çalıştırıcı, yeniden analiz)
workspace.js        Tarama tablosu, kanıt vurgulama, oylar, tekrarlar, projeler, dışa aktarım
cloud.js            Supabase veri katmanı (giriş, projeler, kayıtlar, oylar, realtime)
supabase-config.js  Supabase adresi ve yayımlanabilir anahtar
supabase/schema.sql Veritabanı şeması ve RLS kuralları
screening-core.js   Ortak motor: protokol, karar kuralı, doğrulama, uzlaşı,
                    anahtar havuzu, paralel zamanlayıcı, Batch API yardımcıları
default-prompt.js   Varsayılan yönerge ve ölçütler ("kişisel ilgi alanları" incelemesi)
cli.mjs             Node CLI
tests/              node:test birim ve uçtan uca testler (sahte API ile)
savedrecs.xls       Örnek WoS dışa aktarımı
```

Testler: `npm test` (Node ≥ 18).

## Güvenlik

- Anahtarlar yalnızca tarayıcı sekmesinin `sessionStorage` alanında tutulur. Kayıtlı oturuma ve dışa aktarılan dosyalara yazılmaz; günlük kullanım sayaçları anahtarın kendisi yerine parmak izine (hash) göre tutulur.
- İstekler doğrudan tarayıcıdan veya terminalden sağlayıcıya gider; üçüncü taraf sunucu kullanılmaz.
- Model çıktıları `textContent` ile görüntülenir (XSS'e karşı güvenli).

## Lisans

MIT
