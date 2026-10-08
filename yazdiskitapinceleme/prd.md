# PRD — TTKB Ders Kitabı İnceleme Sistemi

**Doküman türü:** Product Requirements Document  
**Ürün:** TTKB Ders Kitabı İnceleme Sistemi  
**Kapsam:** Ders kitabı PDF inceleme, insan tespiti, YAZDİS tespitleri, TYMM değer/eğilim eşleştirmeleri, panel/komisyon değerlendirme süreçleri  
**Birincil kullanıcı:** İncelemeci / panelist  
**İkincil kullanıcılar:** Komisyon üyesi, yönetici/admin

\---

## 1\. Ürün Amacı

TTKB tarafından incelenen ders kitaplarının uzmanlar tarafından PDF üzerinden hızlı, sistematik, izlenebilir ve mümkün olduğunca az bağlam değiştirerek değerlendirilmesini sağlayan web tabanlı bir inceleme çalışma alanı oluşturulacaktır.

Ürünün temel amacı klasik bir yönetim paneli oluşturmak değil, bir incelemecinin **200–300 sayfalık bir kitabı saatler boyunca aktif olarak inceleyebileceği profesyonel bir belge inceleme ortamı** sağlamaktır.

Sistem dört ana ihtiyacı aynı ortamda karşılamalıdır:

1. İncelemecinin PDF üzerinde hata/uygunsuzluk tespit etmesi.
2. YAZDİS tarafından oluşturulan yapay zekâ tespitlerinin insan tarafından değerlendirilmesi.
3. TYMM kapsamında değer, eğilim ve diğer program bileşenlerinin kitap içerisinde nerede ve nasıl işlendiğinin incelenmesi.
4. Gerektiğinde panelistlerin bağımsız inceleme sonrasında diğer panelistlerin tespitlerini değerlendirerek panel öncesi görüş oluşturması.

PDF her zaman çalışma alanının merkezinde kalmalıdır.

\---

## 2\. Temel Tasarım İlkeleri

### 2.1. PDF merkezli çalışma

Ana içerik PDF'dir. Kullanıcının yaptığı tüm işlemler PDF ile doğrudan ilişkilendirilmelidir.

Tespit, TYMM eşleştirmesi veya YAZDİS önerisi seçildiğinde kullanıcı başka bir sayfaya yönlendirilmemeli; PDF ilgili sayfa ve konuma otomatik olarak gitmelidir.

### 2.2. Minimum bağlam değişimi

Modal pencereler mümkün olduğunca kullanılmamalıdır.

İşlemler ağırlıklı olarak:

* sol navigasyon,
* PDF üzerinde contextual toolbar,
* sağ değerlendirme paneli,
* popover,
* inline edit

üzerinden gerçekleştirilmelidir.

### 2.3. İnsan incelemesi önceliklidir

YAZDİS incelemeciyi destekleyen bir sistemdir; incelemenin yerini almaz.

Arayüz, insan tespiti ile YAZDİS önerisini görsel ve veri modeli açısından ayırmalıdır.

### 2.4. Bağımsız değerlendirme korunmalıdır

Panel tipi incelemelerde panelistler önce bağımsız olarak çalışmalıdır.

Diğer panelistlerin görüşleri bağımsız inceleme süreci tamamlanmadan gösterilmemelidir.

### 2.5. Uzun süreli kullanıma uygunluk

Yoğun renk, büyük kartlar, gereksiz grafikler ve dashboard görünümünden kaçınılmalıdır.

Arayüz:

* kompakt,
* yüksek bilgi yoğunluklu,
* profesyonel,
* göz yormayan

olmalıdır.

\---

## 3\. Ana Ekran Yapısı

Uygulamanın ana çalışma ekranı üç kolonlu olacaktır.

|Alan|Temel işlev|
|-|-|
|Sol panel|Kitap navigasyonu, içindekiler, TYMM haritası, Medya (video, ses) ve ek kaynaklar|
|Orta alan|PDF inceleme çalışma alanı|
|Sağ panel|Tespit, YAZDİS ve diğer incelemeci değerlendirmeleri|

Üstte tüm ekran boyunca ortak bir uygulama barı bulunacaktır.

\---

## 4\. Üst Uygulama Barı

Üst alanda aşağıdaki bilgiler bulunmalıdır.

### Sol bölüm

* TTKB Ders Kitabı İnceleme Sistemi
* Kitap adı
* Ders / sınıf bilgisi

### Orta bölüm

Global kitap araması.

Placeholder örneği:

> Kitap içinde ara, tespit bul veya sayfaya git...

Arama aşağıdaki öğeleri bulabilmelidir:

* PDF metni
* sayfa numarası
* ana kriter
* alt kriter
* tespit metni
* TYMM kodu
* değer/eğilim adı

Örneğin kullanıcı `D1` veya `Doğruluk` yazdığında TYMM kayıtları da bulunabilmelidir.

### Sağ bölüm

* Kaydetme durumu
* Bildirimler
* Kullanıcı
* İnceleme aşaması

Örneğin:

> Aşama 1 · Bağımsız İnceleme

veya

> Aşama 2 · Panel Öncesi Değerlendirme

Bu alan incelemeci tarafından rastgele değiştirilen bir seçim olmamalıdır. İnceleme aşaması sistem/admin konfigürasyonundan gelmelidir.

\---

## 5\. Sol Navigasyon

Sol panel kitabın yapısal navigasyonu ve TYMM kapsam analizi için kullanılacaktır.

Ana sekmeler:

**İçerik | TYMM | Medya | Ekler**

\---

## 5.1. Genişletilmiş ve Daraltılmış Sol Panel

Sol panel tamamen ortadan kaybolmamalıdır.

### Genişletilmiş durumda

Yaklaşık 280–320 px genişlikte içerik görüntülenir.

### Daraltılmış durumda

Yaklaşık 52–64 px genişliğinde yalnızca ana sekme ikonları görünür:

* İçerik
* TYMM
* Ses
* Ekler

Kullanıcı daraltılmış panelde bir ikonun üzerine geldiğinde ilgili içerik **flyout / açılır yan panel** şeklinde görünmelidir.

Örneğin kullanıcı TYMM ikonunun üzerine geldiğinde:

```text
┌────────┬──────────────────────────────┐
│  TYMM  │ TYMM Program Haritası       │
│        │                              │
│        │ D1 Doğruluk             6   │
│        │ E1 Merak                4   │
│        │ ...                          │
└────────┴──────────────────────────────┘
```

Kullanıcı flyout içerisindeki öğelerle normal şekilde etkileşebilmelidir.

Flyout yalnızca tooltip olmamalıdır.

Kullanıcı isterse paneli tekrar sabitleyerek genişletebilmelidir.

\---

## 6\. İçerik Navigasyonu

İçerik sekmesinde:

* üniteler
* bölümler
* sayfalar

gösterilecektir.

Ünite örneği:

> 2. Ünite: Kültür ve Miras  
> 42–75

Ünite genişletildiğinde sayfalar erişilebilir olmalıdır.

Sayfaların yalnızca numara grid'i olarak gösterilmesi yeterli değildir.

Sayfa durumları mümkün olduğunca görsel olarak ifade edilmelidir:

```text
42   3 tespit
43   İncelendi
44   İncelenmedi
45   2 YZ önerisi
```

Kompakt tasarım korunmalıdır.

\---

## 7\. İnceleme İlerlemesi

Sol panelde inceleme ilerlemesi görülebilir.

Örneğin:

> %45  
> 124 / 276 sayfa incelendi  
> 152 sayfa kaldı

İdari tarihler gösterilebilir ancak PDF çalışma alanından daha fazla görsel ağırlık almamalıdır.

\---

## 8\. PDF Çalışma Alanı

PDF ekranın en geniş bölümünü oluşturmalıdır.

PDF üzerinde aşağıdaki temel özellikler bulunmalıdır:

* Sayfa ileri / geri
* Sayfa numarasına git
* Zoom
* Sayfaya sığdır
* Genişliğe sığdır
* Metin seçimi
* Alan/bölge seçimi
* Tam ekran / odak modu

\---

## 9\. Tespit Oluşturma

Kullanıcı PDF üzerinde metin veya alan seçtiğinde contextual toolbar açılmalıdır.

Temel aksiyon:

> + Tespit oluştur

Yapay zekâya soru sorduran ayrıca bir chatbot işlemi gerekli değildir.

\---

## 9.1. Seçilen Alan

Tespit oluşturulduğunda sağ panelde formun en üstünde **Seçilen Alan** bölümü bulunmalıdır.

Örnek:

### Seçilen Alan

> “Kut'un kan yoluyla babadan oğula geçtiğine inanılması...”

Bu alan:

* salt okunur
* PDF'deki gerçek seçimden otomatik alınmış
* uzun metinlerde genişletilebilir
* veri modelinde kalıcı

olmalıdır.

Görsel veya bölge seçildiyse küçük selection preview kullanılabilir.

Örneğin:

> Sayfa 42 üzerinde seçilen bölge

ve küçük bir crop önizlemesi.

\---

## 10\. Tespit Bilgi Hiyerarşisi

Bir tespitin temel bilgi yapısı:

**Ana Kriter → Alt Kriter → Tespit**

olacaktır.

Örnek:

### Bilimsel İçerik

**Bilimsel doğruluk**

> Bu ifadede kavramsal bir genelleme bulunmaktadır. “Tüm göçebe topluluklar” yerine “çoğu göçebe topluluk” ifadesinin kullanılması daha uygundur.

Ana kriter en güçlü tipografik öğedir.

Alt kriter ikinci seviyededir.

Tespit/açıklama kartın ana içeriğidir.

Sayfa, incelemeci vb. bilgiler metadata olarak daha düşük görsel ağırlıkta gösterilir.

\---

## 11\. Önem Derecesi Kullanılmayacaktır

Tespitlerde:

* Düşük
* Orta
* Yüksek

gibi önem derecesi bulunmayacaktır.

Bu alanlar:

* tespit kartından
* tespit formundan
* filtrelerden
* YAZDİS önerilerinden

tamamen kaldırılmalıdır.

\---

## 12\. PDF Marker Sistemi

PDF üzerindeki marker'lar mevcut tespitlerin en önemli görsel bağlantısıdır.

Marker'lar küçük ve belirsiz ikonlar halinde bırakılmamalıdır.

### Marker gereksinimleri

Marker:

* kolay fark edilebilir
* metni mümkün olduğunca kapatmayan
* seçilebilir
* hover durumuna sahip
* seçili durumu güçlü

olmalıdır.

Numaralı marker yaklaşımı tercih edilebilir:

```text
①
②
③
```

Sağ paneldeki tespit ile PDF marker'ı aynı numarayı taşıyabilir.

### 12.1. Marker Durumları

#### Normal

Belirgin fakat PDF okumayı engellemeyen görünüm.

#### Hover

Marker genişler veya halo/pulse efekti oluşturur.

Aynı anda sağ taraftaki karşılık gelen kart vurgulanır.

#### Selected

Seçili marker daha güçlü görünmelidir.

Marker'ın ilişkili olduğu gerçek PDF alanı da highlight edilmelidir.

#### Sağ kart hover

Sağdaki tespit kartı üzerine gelindiğinde PDF üzerindeki marker ve ilişkili alan vurgulanmalıdır.

#### Sağ kart click

PDF otomatik olarak:

* ilgili sayfaya
* ilgili koordinata

gitmelidir.

#### PDF marker click

Sağ panel:

* ilgili karta scroll etmeli
* kartı selected state'e getirmelidir.

Bu ilişki çift yönlüdür.

\---

## 13\. İnsan Tespiti ve YAZDİS Marker Ayrımı

Kaynak görsel olarak anlaşılabilir olmalıdır.

Örneğin:

* İnsan tespiti: mavi marker
* YAZDİS önerisi: mor / AI işaretli marker

Ancak fark yalnızca renk üzerinden verilmemelidir.

YAZDİS marker'ında küçük `YZ` veya AI sembolü kullanılabilir.

TYMM eşleşmeleri ise ayrıca bir overlay katmanı olarak yönetilmelidir.

\---

## 14\. Sağ Değerlendirme Paneli

Sağ panel temel olarak üç değerlendirme kaynağını yönetir:

**Tespitler | YZ | Diğerleri**

YZ sekmesi YAZDİS çıktılarıdır.

Kullanıcıya dönük kart başlığında:

> YAZDİS Analizi

kullanılabilir.

\---

## 15\. “Bu Sayfa / Tüm Kitap”

Sağ panelde tüm ana listelerde ortak olarak:

**Bu Sayfa | Tüm Kitap**

segmented control bulunmalıdır.

Varsayılan:

> Bu Sayfa

olmalıdır.

Örneğin Sayfa 42'de:

> Bu Sayfa (3)

seçildiğinde yalnızca Sayfa 42 tespitleri gösterilir.

> Tüm Kitap (47)

seçildiğinde kitap genelindeki kayıtlar listelenir.

Bu yapı:

* insan tespitleri
* YAZDİS tespitleri
* uygun olduğunda diğer incelemecilerin tespitleri

için çalışmalıdır.

Bu kontrol uzun kitaplarda sağ panelin kullanılabilirliği açısından kritik önemdedir.

\---

## 16\. Sağ Panel Filtreleri

Filtreler:

* Ana kriter
* Alt kriter
* Sayfa
* Ünite
* Kaynak
* Durum
* İncelemeci

üzerinden çalışabilmelidir.

Aktif filtreler chip olarak gösterilebilir:

`Bilimsel İçerik ×`

`YAZDİS ×`

`Bekleyen ×`

\---

## 17\. YAZDİS

Yapay zekâ sisteminin ürün adı:

**YAZDİS**

olarak kullanılacaktır.

İnceleme ekranındaki kısa sekme etiketi:

**YZ**

olabilir.

Örnek:

> YZ 4

Kart içerisinde:

> YAZDİS Analizi

ifadesi kullanılabilir.

\---

## 18\. YAZDİS Tespit Kartı

YAZDİS kartında:

* Ana kriter
* Alt kriter
* Tespit
* Gerekçe
* Model güveni

gösterilebilir.

Güven skoru kartın ana öğesi olmamalıdır.

\---

## 19\. YAZDİS Kararları

Bir YAZDİS tespitinde üç ana aksiyon bulunmalıdır:

**Onayla**

**Düzenle ve Onayla**

**Reddet**

### 19.1. Düzenle ve Onayla

Normal tespit formu açılır.

Alanlar YAZDİS çıktısından otomatik doldurulur:

* Seçilen Alan
* Ana Kriter
* Alt Kriter
* Tespit

İncelemeci alanları değiştirebilir.

Kayıt onaylandığında YAZDİS kökeni kaybolmamalıdır.

\---

## 20\. YAZDİS Ret Nedenleri

“Reddet” seçildiğinde önce ret nedeni istenir.

Seçenekler:

* Hata değil
* Yanlış kriter
* Bağlam yanlış yorumlanmış
* Tekrarlı tespit
* Diğer

“Diğer” seçildiğinde kısa açıklama girilebilir.

Bu bilgiler model geliştirme amacıyla saklanmalıdır.

\---

## 21\. Seçim ve Bağlam Verisinin Saklanması

Her tespit yalnızca yazılan açıklamadan oluşmamalıdır.

Mümkün olduğunca aşağıdaki yapı saklanmalıdır:

```ts
interface FindingEvidence {
  documentId: string;
  pageNumber: number;

  selectionType: "text" | "region" | "image";

  selectedText?: string;

  contextBefore?: string;
  contextAfter?: string;

  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

Amaç ileride insan tarafından oluşturulan tespitleri YAZDİS eğitimi ve değerlendirmesinde kullanılabilecek kaliteli veri setine dönüştürmektir.

\---

## 22\. İnceleme Modları

Sistem farklı inceleme süreçlerine uyarlanabilir olmalıdır.

Temel olarak:

```ts
reviewMode = "panel" | "commission";
```

\---

## 23\. Panel İncelemesi

Panel süreci iki aşamalıdır.

### Aşama 1 — Bağımsız İnceleme

Panelist yalnızca:

* kendi tespitlerini
* YAZDİS önerilerini

görür.

Diğer panelistlerin tespitleri gösterilmemelidir.

Bu aşamada:

**Tespitler | YZ**

aktif olabilir.

**Diğerleri**

ya tamamen gizlenir ya da disabled durumda gösterilir.

Disabled ise:

> Diğer panelistlerin tespitleri bağımsız inceleme süreci tamamlandıktan sonra görüntülenecektir.

bilgisi verilir.

\---

## 24\. Aşama 2 — Panel Öncesi Değerlendirme

Admin tarafından belirlenen tarihten sonra panelistler diğer panelistlerin tespitlerini görebilir.

Bu aşamada:

**Tespitler | YZ | Diğerleri**

aktif olur.

Diğer panelistin tespitinde kullanıcı:

**Katılıyorum**

veya

**Katılmıyorum**

seçebilir.

Katılmıyorum seçildiğinde kısa gerekçe istenebilir.

Bu işlem panel toplantısı öncesinde yapılır.

\---

## 25\. Komisyon İncelemesi

Komisyon süreçlerinde diğer incelemecilerin görüşlerini değerlendirme gerekmeyebilir.

Varsayılan:

```ts
showOtherReviewerFindings = false
```

olmalıdır.

Admin isterse:

```ts
showOtherReviewerFindings = true
```

yapabilir.

Bu durumda **Diğerleri** sekmesi açılır ancak kayıtlar yalnızca okunur olur.

Katılıyorum / Katılmıyorum butonları gösterilmez.

\---

## 26\. TYMM Entegrasyonu

TYMM değerlendirmesi klasik hata tespitinden ayrı bir kavramdır.

Temel ayrım:

> \*\*TYMM bileşenleri kitapta bulunması / işlenmesi gereken unsurlardır.\*\*

> \*\*Tespit ise bir uygunsuzluk veya eksiklik kaydıdır.\*\*

Dolayısıyla TYMM sistemi doğrudan “tespit listesi” şeklinde modellenmemelidir.

\---

## 27\. TYMM Sol Navigasyon Sekmesi

Sol panelde bağımsız:

**TYMM**

sekmesi bulunmalıdır.

Burada kitabın program kapsam haritası gösterilir.

Örneğin:

```text
TYMM

DEĞERLER

D1 Doğruluk
  ✓ 6 doğrulanmış
  ◌ 2 YZ adayı

D2 ...

D3 ...


EĞİLİMLER

E1 Merak
  ✓ 4 doğrulanmış
  ◌ 1 YZ adayı

E2 ...
```

\---

## 28\. TYMM Kayıtlarının Konumu

D1 üzerine basıldığında kitabın hangi bölümlerinde işlendiği görülebilmelidir.

Örneğin:

```text
D1 · Doğruluk

Ünite 1

S.18
Etkinlik 1.2
Açık işlenmiş ✓

S.27
Okuma Metni
Örtük işlenmiş ✓


Ünite 3

S.96
Tartışma Etkinliği
YZ adayı ◌
```

Bir kayda tıklandığında PDF doğrudan ilgili konuma gitmelidir.

\---

## 29\. TYMM'de Açık / Örtük Ayrımı

TYMM değer/eğilim eşleşmesinin temel alanlarından biri:

```ts
coverageType = "explicit" | "implicit";
```

olmalıdır.

Örneğin:

### Açık

> “Elde ettiğiniz bilgilerin doğruluğunu farklı kaynaklardan kontrol ediniz.”

D1 Doğruluk doğrudan ifade edilmektedir.

### Örtük

Bir hikâyede karakter yanlış bilgi verdiğini fark ederek hatasını düzeltmektedir.

Doğruluk kavramı adıyla belirtilmese de davranış üzerinden işlenmektedir.

\---

## 30\. TYMM Kanıt Kaydı

Her TYMM eşleşmesi mümkün olduğunca gerçek kanıtla saklanmalıdır.

Örnek:

```ts
interface TYMMEvidence {
  code: "D1";
  name: "Doğruluk";

  pageNumber: 42;

  unitId?: string;
  activityId?: string;
  activityName?: string;

  selectedText?: string;

  contextBefore?: string;
  contextAfter?: string;

  boundingBox?: BoundingBox;

  coverageType: "explicit" | "implicit";

  source: "human" | "YAZDİS";

  verificationStatus:
    | "candidate"
    | "verified"
    | "rejected"
    | "insufficient";
}
```

\---

## 31\. TYMM PDF Katmanı

PDF toolbar üzerinde:

**TYMM Katmanı**

açılıp kapatılabilir olmalıdır.

Kapalı durumda normal belge incelemesi yapılır.

Açık durumda doğrulanmış veya aday TYMM eşleşmeleri görünür.

Marker örnekleri:

`D1`

`E1`

`D3`

\---

## 32\. TYMM Marker'ları

TYMM marker'ları normal hata marker'larından farklı görünmelidir.

Örneğin:

```text
\[D1]
\[E1]
```

Marker üzerine gelindiğinde:

```text
D1 · Doğruluk

Açık işlenmiş

Etkinlik:
Bilgiyi Sorguluyorum

Kaynak:
YAZDİS

Durum:
İncelemeci doğrulaması bekliyor
```

bilgisi gösterilebilir.

\---

## 33\. YAZDİS TYMM Adayları

YAZDİS kitap yüklendikten sonra potansiyel TYMM eşleşmeleri oluşturabilir.

Bunlar doğrudan doğrulanmış veri sayılmamalıdır.

Örneğin:

> D1 · Doğruluk  
> Sayfa 42  
> Bilgiyi Değerlendirelim

**Seçilen alan**

> “Bilginin doğruluğunu farklı kaynaklardan kontrol ediniz.”

**YAZDİS önerisi**

> Açık biçimde işlenmiş

İncelemeci:

**İşlenmiş Olarak Doğrula**

**Düzenle**

**Eşleşme Değil**

aksiyonlarını kullanabilmelidir.

\---

## 34\. TYMM Seçimi Sağ Panelde Açılmalıdır

Kullanıcı soldaki TYMM haritasından veya PDF'deki bir TYMM marker'ından kayıt seçtiğinde sağ panel ilgili TYMM değerlendirmesine dönüşebilir.

Örnek:

```text
D1 · DOĞRULUK

Sayfa 42
Bilgiyi Değerlendirelim


SEÇİLEN ALAN

“Bilginin doğruluğunu farklı
kaynaklardan kontrol ediniz.”


YAZDİS DEĞERLENDİRMESİ

Bu etkinlik öğrencinin bilginin
doğruluğunu sorgulamasını doğrudan
istemektedir.


İŞLENME BİÇİMİ

● Açık
○ Örtük


\[ İşlenmiş Olarak Doğrula ]

\[ Düzenle ]

\[ Eşleşme Değil ]
```

\---

## 35\. TYMM Kapsam Haritası

Sistem yalnızca kayıtların listesini değil kitabın genel TYMM kapsamını da gösterebilmelidir.

Örneğin:

|TYMM|Ü1|Ü2|Ü3|Ü4|Ü5|
|-|-|-|-|-|-|
|D1 Doğruluk|✓|✓|—|✓|○|
|D2 ...|✓|—|✓|—|✓|
|E1 Merak|✓|○|✓|—|✓|

Durumların anlamı:

* **✓** İnsan tarafından doğrulanmış
* **○** YAZDİS adayı / doğrulama bekliyor
* **△** Yetersiz / tartışmalı
* **—** Kanıt bulunamadı

Hücreye tıklanınca o ünite + TYMM bileşenine ait kanıtlar listelenmelidir.

\---

## 36\. TYMM Eksikliklerinin Tespitle İlişkilendirilmesi

TYMM eşleşmesi kendi başına bir hata değildir.

Ancak gerekli bir TYMM bileşeni yeterli şekilde işlenmemişse buradan tespit oluşturulabilir.

Örneğin:

```text
E1 · Merak

4. Ünite

Doğrulanmış kanıt: 0
YZ adayı: 0

Bu kapsamda E1 Merak için doğrulanmış
bir içerik bulunmamaktadır.

\[ + Tespit Oluştur ]
```

“Tespit Oluştur” seçildiğinde sistem uygun alanları otomatik hazırlayabilir.

Örneğin:

**Ana Kriter**

TYMM / Program Uyumu

**Alt Kriter**

Değer ve Eğilimlerin İşlenmesi

**İlgili bileşen**

E1 · Merak

**Kapsam**

4. Ünite

**Taslak tespit**

> 4. ünitede E1 Merak eğiliminin işlenmesine yönelik yeterli içeriğe rastlanmamıştır.

İncelemeci metni değiştirebilir.

\---

## 37\. Tespit Kapsamı

Her tespitin zorunlu olarak bir PDF koordinatına bağlı olması gerekmez.

Kapsam:

```ts
scope =
  | "selection"
  | "page"
  | "activity"
  | "unit"
  | "book";
```

olabilir.

Örneğin:

* Bilimsel hata: selection
* Sayfa tasarım problemi: page
* Etkinlik eksikliği: activity
* E1 Merak işlenmemiş: unit
* Kitabın genelinde belirli bir TYMM bileşeni bulunmuyor: book

Bu yapı özellikle TYMM denetimi için gereklidir.

\---

## 38\. TYMM + Tespit Arasındaki Kavramsal Ayrım

Sistem kullanıcıya şu mantığı açık şekilde yansıtmalıdır:

```text
TYMM Haritası
      │
      ▼
Program bileşeni kitapta nerede işlenmiş?
      │
      ▼
Kanıt
      │
      ├──── YAZDİS adayı
      │
      └──── İnsan tespiti
      │
      ▼
İnsan doğrulaması
      │
      ▼
Kapsam yeterli mi?
      │
      ├── Evet → Program eşleşmesi
      │
      └── Hayır → Tespit oluşturulabilir
```

\---

## 39\. Sağ Panel Boyutlandırma

Sağ panel sabit ve çok dar olmamalıdır.

Kullanıcı sağ kenarı sürükleyerek panel genişliğini değiştirebilmelidir.

Önerilen aralık:

**360–650 px**

PDF merkezi alan olmaya devam etmelidir.

\---

## 40\. Kartların Davranışı

Kartlar kompakt olmalıdır.

Uzun açıklama varsa ilk birkaç satır gösterilebilir:

> Bu ifadede kavramsal bir genelleme bulunmaktadır...

**Devamını göster**

Kart seçildiğinde detay genişleyebilir.

\---

## 41\. Otomatik Kaydetme

Tespit formunda veya TYMM değerlendirmesinde kullanıcı sayfa değiştirdiğinde veri kaybolmamalıdır.

Arayüzde:

> Kaydediliyor...

ardından:

> Kaydedildi ✓

durumu bulunmalıdır.

\---

## 42\. Odak Modu

Uzun süreli kitap incelemesi için kullanıcı sol paneli daraltabilmeli ve sağ paneli gerektiğinde küçültebilmelidir.

PDF daha geniş çalışma alanına kavuşmalıdır.

Sol panel daraltıldığında fonksiyonlara erişim kaybolmamalıdır; ikon + hover flyout sistemi devam etmelidir.

\---

## 43\. Responsive Davranış

### Büyük desktop

Üç panel aynı anda kullanılabilir.

### Küçük desktop / laptop

Sol panel daraltılabilir.

Sağ panel resize edilebilir.

PDF maksimum alanı korur.

### Tablet

Sol panel drawer/flyout davranışına geçebilir.

PDF + sağ değerlendirme ana ekranı oluşturur.

### Mobil

Mobil öncelikli bir inceleme sistemi hedeflenmemektedir.

Ancak temel kayıt görüntüleme ve onay işlemleri bozulmamalıdır.

\---

## 44\. Görsel Dil

Ürün kamu kurumu ve uzman inceleme ortamına uygun olmalıdır.

Tercih edilen özellikler:

* açık içerik alanları
* koyu veya kurumsal üst uygulama barı
* lacivert/mavi temel vurgu
* mor tonların yalnızca YAZDİS gibi özel anlamlarda kullanılması
* yeşilin doğrulanmış/onaylanmış durumlarda kullanılması
* kırmızının hata/reddetme gibi sınırlı semantik durumlarda kullanılması
* küçük radius
* kompakt spacing
* yüksek okunabilirlik

Renk tek başına durum göstergesi olmamalıdır.

İkon + metin + renk birlikte kullanılmalıdır.

\---

## 45\. Terminoloji

Ürün genelinde aşağıdaki terminoloji tutarlı kullanılmalıdır.

|Kavram|Kullanılacak ifade|
|-|-|
|Yapay zekâ sistemi|YAZDİS|
|Kısa yapay zekâ sekmesi|YZ|
|AI kart başlığı|YAZDİS Analizi|
|İnsan bulgusu|Tespit|
|Program eşleşmesi|TYMM Eşleşmesi|
|Model önerisi|YAZDİS Adayı|
|Diğer uzmanlar|Diğerleri|
|Açık değer işleme|Açık|
|Dolaylı değer işleme|Örtük|

\---

## 46\. Veri Modeli İçin Temel Nesneler

Frontend prototipi daha sonra gerçek backend'e dönüştürülebileceğinden veri yapıları birbirinden ayrılmalıdır.

```ts
Book
Page
Reviewer
ReviewAssignment

Finding
FindingEvidence

YazdisFinding
YazdisDecision

TYMMComponent
TYMMRequirement
TYMMEvidence
TYMMVerification

ReviewerAgreement

ReviewPhase
ReviewConfiguration
```

Özellikle:

**Finding**

ile

**TYMMEvidence**

aynı nesne yapılmamalıdır.

TYMM eksikliği gerektiğinde `Finding` oluşturabilir.

\---

## 47\. Örnek Durum

### Kitap

7. Sınıf Sosyal Bilgiler Ders Kitabı

### Sayfa

42

### PDF üzerindeki metin

> “Elde ettiğiniz bilgilerin doğruluğunu farklı kaynaklardan kontrol ediniz.”

### YAZDİS

D1 · Doğruluk eşleşmesi önerir.

`coverageType = explicit`

### Arayüz

PDF üzerinde:

`\[D1]`

marker'ı görünür.

Solda:

> D1 Doğruluk  
> S.42 · Bilgiyi Değerlendirelim  
> YZ adayı

Sağda:

> \*\*D1 · Doğruluk\*\*

> \*\*Seçilen Alan\*\*  
> “Elde ettiğiniz bilgilerin doğruluğunu farklı kaynaklardan kontrol ediniz.”

> \*\*YAZDİS değerlendirmesi\*\*  
> Öğrenciden bilginin doğruluğunu doğrudan sorgulaması istendiği için D1 açık biçimde işlenmektedir.

> Açık ●  
> Örtük ○

Aksiyonlar:

**İşlenmiş Olarak Doğrula**

**Düzenle**

**Eşleşme Değil**

\---

## 48\. Kritik Kabul Kriterleri

İlk çalışan prototip aşağıdaki senaryoları mutlaka desteklemelidir:

|#|Kabul kriteri|
|-|-|
|1|PDF üzerinde metin seçilip tespit oluşturulabilmeli|
|2|Seçilen metin tespit formunda “Seçilen Alan” olarak görünmeli|
|3|Ana kriter → alt kriter → tespit hiyerarşisi kullanılmalı|
|4|PDF marker ↔ sağ kart çift yönlü navigasyon çalışmalı|
|5|Marker'lar belirgin ve kolay seçilebilir olmalı|
|6|Kart hover olduğunda PDF marker ve alan vurgulanmalı|
|7|Bu Sayfa / Tüm Kitap geçişi çalışmalı|
|8|YAZDİS tespitinde Onayla / Düzenle ve Onayla / Reddet bulunmalı|
|9|YAZDİS reddinde neden kaydedilebilmeli|
|10|Panel Aşama 1'de diğer panelist görüşleri erişilemez olmalı|
|11|Panel Aşama 2'de diğer panelist tespitleri değerlendirilebilmeli|
|12|Komisyon modunda Diğerleri admin konfigürasyonuna bağlı olmalı|
|13|Sol panel daraltıldığında ana ikonlar görünmeye devam etmeli|
|14|Daraltılmış sol panel ikonlarının üzerine gelince kullanılabilir flyout açılmalı|
|15|TYMM sekmesinde değer ve eğilimler listelenmeli|
|16|D1/E1 gibi bileşenlerin hangi sayfalarda işlendiği görülebilmeli|
|17|TYMM kayıtları Açık / Örtük olarak sınıflandırılabilmeli|
|18|TYMM kaydına tıklanınca PDF ilgili kanıta gitmeli|
|19|PDF üzerinde TYMM overlay açılıp kapatılabilmeli|
|20|YAZDİS TYMM adayları insan tarafından doğrulanabilmeli/reddedilebilmeli|
|21|Ünitede/kitapta TYMM bileşeni eksikse buradan tespit oluşturulabilmeli|
|22|Tespit kapsamı selection/page/activity/unit/book olabilmeli|
|23|Önem seviyesi kullanılmamalı|
|24|Otomatik kaydetme çalışmalı|
|25|Sol ve sağ paneller PDF'nin kullanımını engellememeli|

\---

## 49\. MVP'nin Başarı Ölçütü

İlk prototip başarılı kabul edilmek için kullanıcının şu akışı **başka ekrana geçmeden** tamamlayabilmesini sağlamalıdır:

**Kitabı aç → sayfaya git → içeriği oku → metni seç → tespit oluştur → seçilen alanı gör → kriter seç → kaydet → başka tespiti aç → PDF'deki kanıta dön → YAZDİS önerisini değerlendir → TYMM D1/E1 kapsamını kontrol et → kanıtı doğrula → eksikse tespit oluştur.**

Ürünün tasarım kalitesi esas olarak bu akışın ne kadar hızlı ve kesintisiz gerçekleştiği üzerinden değerlendirilmelidir.

\---

## 50\. Mimari Ürün Kararı

TYMM sağ değerlendirme paneline yalnızca dördüncü bir kart sekmesi olarak eklenmemelidir.

D1 Doğruluk, E1 Merak ve ileride eklenecek diğer program bileşenleri kitabı başka bir perspektiften gezme biçimidir.

Bu nedenle TYMM için temel etkileşim modeli:

**Sol: TYMM haritası → Orta: PDF kanıtı → Sağ: doğrulama/değerlendirme**

şeklinde olmalıdır.

Bu yapı ileride değerlerin yanı sıra eğilim, beceri, öğrenme çıktısı ve diğer TYMM bileşenlerinin aynı mimaride eklenebilmesini sağlamalıdır.

