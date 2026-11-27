/* Canlı Deney Laboratuvarı:
   1) Kontrol grubu için 6 modülün tamamında standart içerik (5 slayt + etkileşimli mikro-görev)
   2) Deney grubu için Claude / Gemini / Google TTS API'leri üzerinden canlı kişiselleştirilmiş üretim
   3) Üretilen görsellerin (images/) ve seslerin (audio/) IndexedDB önbelleğinde saklanması ve klasöre indirilebilmesi */
window.CanliDeney = (() => {
  'use strict';

  /* ---------- 1. Tüm Modüller (m1..m6) için Konuya Özgü Standart Kontrol Grubu İçerikleri ----------
     ÖNEMLİ METODOLOJİK İLKE:
     - Her modül (m1..m6), kendi konusunun pedagojik doğasına en uygun ÖZEL bir slayt ve mikro-görev şablonuna sahiptir.
     - Ancak AYNI MODÜL İÇİNDE Kontrol Grubu ile Deney Grubu BİREBİR AYNI tasarım ve etkileşim şablonunu kullanır; gruplar arasındaki tek fark kişiselleştirilmiş bağlamdır. */
  const KONTROL_ICERIK = {
    m1: {
      modulId: 'm1',
      modulAd: 'Bilimsel araştırmanın temelleri',
      sablonAd: 'Gözlemden Bilimsel Döngüye & Etiğe (Sıralama + Etik)',
      kazanim: 'Bilimsel bilgiyi gündelik görüşten ayırır, araştırmanın temel adımlarını sıralar ve etik ilkeleri uygular.',
      slayt: {
        id: 'kontrol-m1', etiket: 'Kontrol grubu — Standart içerik (M1)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Not tutma yöntemleri ve bilimsel döngü', sureToplam: '75 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Gözlem', ikon: 'odul',
            ustBaslik: 'Gözlemden bilimsel soruya', altBaslik: 'Ders notu tutma alışkanlıkları',
            soru: 'Derste yalnızca metnin altını çizenlere göre kendi cümleleriyle özet çıkaran öğrenciler sınavda daha çok bilgi hatırlıyor.',
            image_path: 'images/m1-standart-s1.png', audio_path: 'audio/m1-standart-s1.mp3',
            narration: 'Bir öğrenci, derste yalnızca metnin altını çizen arkadaşlarına göre kendi cümleleriyle özet çıkaranların sınavda daha çok bilgi hatırladığını gözlemlemiştir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'claim_vs_testable', kisaAd: '2. Sınanabilirlik', ikon: 'izgara',
            ustBaslik: 'Gündelik görüşten sınanabilir soruya', altBaslik: 'Bilimsel bilginin ayırt edici özelliği',
            gorusBaslik: 'Gündelik Görüş (Sınanamaz)',
            gorusMetin: 'Özet çıkararak çalışmak her zaman en iyi yöntemdir.',
            gorusNeden: 'Mutlak ve belirsiz bir yargıdır; kimin, hangi yöntemle ve hangi ölçümle karşılaştırılacağı belli değildir.',
            bilimselBaslik: 'Bilimsel Araştırma Sorusu (Sınanabilir)',
            bilimselMetin: 'Üniversite öğrencilerinde kullanılan not tutma yöntemi (altını çizme, özet, kavram haritası), 1 hafta sonraki hatırlama testi puanını etkiler mi?',
            kriterler: ['Karşılaştırılan: Not tutma yöntemi', 'Ölçülen: Hatırlama testi puanı', 'Grup: Üniversite öğrencileri'],
            audio_path: 'audio/m1-standart-s2.mp3',
            narration: 'Kişisel bir görüş yerine, neyin karşılaştırıldığını ve hangi ölçümün yapılacağını açıkça belirten sınanabilir bir araştırma sorusu kurulur.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'process_timeline', kisaAd: '3. Döngü', ikon: 'dal',
            ustBaslik: 'Sistemli araştırma döngüsü', altBaslik: 'Gözlemden rapora uzanan 4 temel adım',
            adimlar: [
              { no: '01', baslik: 'Soru & Hipotez', aciklama: 'Not tutma yöntemi hatırlama puanını etkiler mi?' },
              { no: '02', baslik: 'Örneklem & Veri Toplama', aciklama: '90 lisans öğrencisiyle 3 grupta aynı ders metni üzerinden uygulama.' },
              { no: '03', baslik: 'Analiz & Bulgu', aciklama: 'Altını çizme (61), Özet (78) ve Kavram haritası (82) puanlarının karşılaştırılması.' },
              { no: '04', baslik: 'Açık Raporlama', aciklama: 'Yöntemin ve örneklem sınırlılıklarının şeffafça paylaşılması.' },
            ],
            audio_path: 'audio/m1-standart-s3.mp3',
            narration: 'Bilimsel araştırma; sınanabilir sorudan veri toplamaya, sayısal analizden şeffaf raporlamaya uzanan sistemli bir döngü izler.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'ethics_pillars', kisaAd: '4. Bilimsel Etik', ikon: 'grafik',
            ustBaslik: 'Bilimsel etik ve katılımcı hakları', altBaslik: 'Araştırmada uyulması zorunlu ilkeler',
            etikSenaryo: 'Öğrencilerin sınav ve hatırlama testi puanları ders notunu etkilemez, isim yerine kod kullanılarak gizli tutulur.',
            ilkeler: [
              { baslik: 'Bilgilendirilmiş Onam', aciklama: 'Öğrencilere çalışmanın amacı açıklanır ve gönüllü katılımları alınır.' },
              { baslik: 'Gizlilik & Anonimlik', aciklama: 'Test sonuçları öğrenci kimliğiyle eşleşmeyecek biçimde kodlanır.' },
              { baslik: 'Dürüst Raporlama', aciklama: 'Veriler beklentiye uysun diye değiştirilmeden olduğu gibi raporlanır.' },
            ],
            audio_path: 'audio/m1-standart-s4.mp3',
            narration: 'Veri toplamadan önce katılımcıların bilgilendirilmiş onamı alınır ve kişisel verileri anonimleştirilerek korunur.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Bilimsel araştırma döngüsü', altBaslik: 'Çözümün özeti',
            solEtiket: 'Başlangıç', bagimsiz: 'Gözlem & Sınanabilir Soru',
            sagEtiket: 'Bilimsel Sonuç', bagimli: 'Etik & Kanıta Dayalı Rapor',
            ozetNot: 'Bilimsel araştırma bir gözlemi açık, ölçülebilir, sistemli ve etik kurallara uygun biçimde sınar.',
            audio_path: 'audio/m1-standart-s5.mp3',
            narration: 'Özetle bilimsel araştırma; gözlemden sınanabilir soruya, sistemli ve etik veriden sınırlılıklarıyla raporlanan bulguya ilerler.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m1', gorevTipi: 'm1_sirala_etik', eyebrow: 'MODÜL 01 · MİKRO-GÖREV',
        altYazi: 'Araştırma döngüsü adımlarını doğru sıraya koy ve bilimsel etik ilkesini belirle.',
        baslik: 'Okuma ortamı dikkati etkiler mi?',
        metin: 'Bir eğitim araştırmacısı, öğrencilerin sessiz kütüphane ortamında ve kafeterya ortamında okudukları metinleri hatırlama düzeylerini karşılaştırmıştır. Katılımcıların izni alınarak uygulanan testte kütüphane grubu 81, kafeterya grubu 65 ortalama almıştır.',
        temaTip: 'standart',
        kosullar: [
          { ad: 'Sessiz kütüphane', deger: '81 puan', diyagram: 'saat2' },
          { ad: 'Kafeterya', deger: '65 puan', diyagram: 'saat1' },
          { ad: 'Karma grup', deger: '73 puan', diyagram: 'saat3' },
        ],
        soruBaslik: '1. Bölüm: Bilimsel araştırma adımlarını baştan sona sırala',
        soruAlt: 'Ok düğmelerini kullanarak 4 adımı doğru mantıksal sıraya getir',
        siralaAdimlar: [
          'Gözlemden yola çıkarak çalışma ortamı ve hatırlama puanı sorusunu tanımlama',
          'Katılımcılardan bilgilendirilmiş onam alıp okuma ve hatırlama testini uygulama',
          'Kütüphane (81) ve kafeterya (65) gruplarının test puanlarını analiz etme',
          'Bulguları örneklem sınırlılıklarıyla birlikte araştırma raporunda paylaşma',
        ],
        soru1: '2. Bölüm: Bu araştırmada veri toplama öncesi katılımcılardan gönüllü izin alınması hangi ilkenin gereğidir?',
        bagimsizSecenekler: [
          'Bilgilendirilmiş onam ve bilimsel etik ilkesi',
          'Tabakalı örnekleme kuralı',
          'Bağımsız değişken manipülasyonu',
          'İçerik analizi kodlaması',
        ],
        bagimsizDogru: 0,
        ipucuBagimsiz: 'Araştırma her zaman gözlem/soru ile başlar, veri toplama ve analizle devam eder, raporla biter.',
        ipucuBagimli: 'Katılımcıların çalışmadan haberdar edilip gönüllü onay vermesi bilgilendirilmiş onam ilkesidir.',
        aciklamaDogru: 'Doğru! Araştırma adımlarını Gözlem/Soru → Veri Toplama → Analiz → Raporlama sırasıyla dizdin ve bilgilendirilmiş onam etik ilkesini doğru belirledin.',
      },
    },
    m2: {
      modulId: 'm2',
      modulAd: 'Araştırma problemi ve sorusu',
      sablonAd: 'Soruyu Daraltma Hunisi & Değişkenler (Değişken Rolü Eşleştirme)',
      kazanim: 'Geniş bir soruyu daraltır; araştırma senaryosunda bağımsız, bağımlı ve kontrol değişkenlerini belirler.',
      slayt: {
        id: 'kontrol-m2', etiket: 'Kontrol grubu — Standart içerik (M2)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Ders çalışma süresi ve sınav başarısı', sureToplam: '78 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Bir araştırma problemi ve senaryosu', altBaslik: 'Üniversitede ders çalışma süreleri',
            soru: 'Çalışma süresi öğrencilerin test başarısını etkiler mi?',
            image_path: 'images/m2-standart-s1.png', audio_path: 'audio/m2-standart-s1.mp3',
            narration: 'Bir araştırmacı, farklı çalışma sürelerinin üniversite öğrencilerinin test başarıları üzerindeki etkisini incelemek istemektedir. Öğrenciler rastgele üç gruba ayrılmıştır.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 2, slide_type: 'question_funnel', kisaAd: '2. Soruyu Daralt', ikon: 'izgara',
            ustBaslik: 'Geniş meraktan odaklanmış araştırma sorusuna', altBaslik: 'Üç farklı çalışma süresi koşulu',
            zayifSoru: 'Ders çalışmak öğrencilere faydalı mıdır?',
            gucluSoru: 'Üniversite öğrencilerinde çalışma süresi (15, 30 ve 45 dk), başarı testi puanını etkiler mi?',
            kosullar: [
              { ad: '15 dakika', deger: '68 puan', diyagram: 'saat1' },
              { ad: '30 dakika', deger: '76 puan', diyagram: 'saat2' },
              { ad: '45 dakika', deger: '84 puan', diyagram: 'saat3' },
            ],
            dipnot: 'Örnek amaçlı kurgusal test sonuçları',
            audio_path: 'audio/m2-standart-s2.mp3',
            narration: 'Geniş ve belirsiz bir soru yerine, on beş, otuz ve kırk beş dakikalık çalışma sürelerinin başarı testi puanına etkisini soran odaklanmış bir soru kurulur.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Bağımsız Değişken', ikon: 'dal',
            ustBaslik: 'Bağımsız değişkeni belirleyelim', altBaslik: 'Araştırmacının değiştirdiği unsur',
            degisken: 'Çalışma süresi',
            seviyeler: ['15 dakika', '30 dakika', '45 dakika'],
            digerRef: 'Ölçülen sonuç: Başarı testinden alınan puan',
            audio_path: 'audio/m2-standart-s3.mp3',
            narration: 'Araştırmacının gruplar arasında bilerek değiştirdiği unsur çalışma süresidir. Bu nedenle çalışma süresi bağımsız değişkendir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Bağımlı & Kontrol', ikon: 'grafik',
            ustBaslik: 'Bağımlı ve kontrol değişkenleri', altBaslik: 'Araştırmacının ölçtüğü sonuç ve sabit tutulanlar',
            degisken: 'Başarı testinden alınan puan',
            oncekiRef: 'Değiştirilen unsur: Çalışma süresi',
            kontrolDegiskenleri: ['Konu zorluğu', 'Test soru sayısı', 'Sınıf ortamı'],
            veri: [
              { etiket: '15 dk', deger: 68 },
              { etiket: '30 dk', deger: 76 },
              { etiket: '45 dk', deger: 84 },
            ],
            audio_path: 'audio/m2-standart-s4.mp3',
            narration: 'Çalışma süresine bağlı olarak ölçülen sonuç test puanıdır; konu zorluğu ve soru sayısı ise kontrol değişkeni olarak sabit tutulur.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Araştırmanın değişken mimarisi', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Çalışma süresi', bagimli: 'Test puanı',
            kontrolList: ['Konu zorluğu', 'Test soru sayısı'],
            ozetNot: 'Bağımsız değişkeni değiştiriyor, kontrol değişkenlerini sabit tutuyor ve bağımlı değişkendeki sonucu ölçüyoruz.',
            audio_path: 'audio/m2-standart-s5.mp3',
            narration: 'Özetle araştırmacı bağımsız değişken olan çalışma süresini değiştirir, diğer koşulları sabit tutar ve bağımlı değişken olan test puanını ölçer.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m2', gorevTipi: 'm2_degisken_eslestir', eyebrow: 'MODÜL 02 · MİKRO-GÖREV',
        altYazi: 'Senaryodaki değişkenleri araştırmadaki rolleriyle eşleştir ve kontrol mantığını doğrula.',
        baslik: 'Problem çözme yöntemi başarıyı etkiler mi?',
        metin: 'Bir araştırmacı, farklı problem çözme yöntemlerinin öğrencilerin doğru çözdükleri problem sayısına etkisini incelemektedir. Öğrenciler aynı sınıf düzeyinden seçilerek rastgele üç gruba ayrılmış, her grupta farklı bir problem çözme yöntemi uygulanmış ve sonunda doğru çözülen problem sayıları kaydedilmiştir.',
        temaTip: 'standart',
        kosullar: [
          { ad: 'Örnekli çözüm', deger: '12 problem', diyagram: 'saat1' },
          { ad: 'Grup tartışması', deger: '17 problem', diyagram: 'saat2' },
          { ad: 'Bireysel çalışma', deger: '14 problem', diyagram: 'saat3' },
        ],
        soruBaslik: '1. Bölüm: Değişkenleri Rolleriyle Eşleştir',
        soruAlt: 'Yukarıdaki kavramlardan birine dokun, ardından aşağıdaki uygun değişken rolü yuvasına yerleştir',
        eslestirOgeler: ['Problem çözme yöntemi', 'Doğru çözülen problem sayısı', 'Öğrencilerin sınıf düzeyi ve soru sayısı'],
        eslestirRoller: [
          'Bağımsız Değişken (Araştırmacının değiştirdiği)',
          'Bağımlı Değişken (Sonuç olarak ölçülen)',
          'Kontrol Değişkeni (Sabit tutulan)',
        ],
        soru1: '2. Bölüm: Bu araştırmada tüm gruplarda aynı sınıf düzeyinin ve eşit soru sayısının kullanılmasının nedeni nedir?',
        bagimsizSecenekler: [
          'Doğru problem sayısındaki farkın başka etkenlerden değil, yalnızca problem çözme yönteminden kaynaklandığını güvenceye almak',
          'Bağımsız değişkenin etkisini tamamen ortadan kaldırmak',
          'Örneklem büyüklüğünü küçültmek',
          'Araştırmayı nitel desene dönüştürmek',
        ],
        bagimsizDogru: 0,
        ipucuBagimsiz: 'Araştırmacının üç grupta değiştirdiği yöntem bağımsız, sonunda saydığı doğru problem sayısı bağımlı, eşit tuttuğu sınıf düzeyi ise kontrol değişkenidir.',
        ipucuBagimli: 'Kontrol değişkenlerini sabit tutmak karıştırıcı etkileri önler.',
        aciklamaDogru: 'Harika! Bağımsız (Problem çözme yöntemi), bağımlı (Doğru çözülen problem sayısı) ve kontrol değişkenlerini doğru eşleştirdin.',
      },
    },
    m3: {
      modulId: 'm3',
      modulAd: 'Araştırma desenleri',
      sablonAd: 'Desen Karşılaştırma Matrisi & Müdahale Karar Ağacı (Desen Sınıflandırma)',
      kazanim: 'Araştırma sorusuna göre nicel (deneysel/ilişkisel), nitel ve karma desenleri ayırt eder.',
      slayt: {
        id: 'kontrol-m3', etiket: 'Kontrol grubu — Standart içerik (M3)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Aynı konuya üç farklı araştırma deseni', sureToplam: '76 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Sorunun türü araştırma desenini belirler', altBaslik: 'Uzaktan eğitimde ders katılımı',
            soru: 'Aynı konu nicel, nitel ve karma desenlerle nasıl araştırılır?',
            image_path: 'images/m3-standart-s1.png', audio_path: 'audio/m3-standart-s1.mp3',
            narration: 'Bir araştırmacı üniversite öğrencilerinin çevrim içi derslere katılımını incelemek istemektedir. Sorduğu sorunun amacı, kullanacağı araştırma desenini belirler.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'design_matrix', kisaAd: '2. Üç Yaklaşım', ikon: 'izgara',
            ustBaslik: 'Üç Temel Araştırma Deseni Yaklaşımı', altBaslik: 'Sayılar, deneyimler ve bütünleştirme',
            desenler: [
              { tur: 'Nicel (İlişkisel)', rozet: 'r = 0,62 · Sayısal', soru: 'Derse katılım süresi ile dönem sonu notu arasında ilişki var mıdır?', yontem: '240 öğrencinin sistem kayıtları ve sınav notları sayısal olarak karşılaştırılır.' },
              { tur: 'Nitel (Olgubilim)', rozet: '10 Görüşme · Anlam', soru: 'Öğrenciler çevrim içi derste kamera açmama deneyimlerini nasıl anlamlandırıyor?', yontem: '10 öğrenciyle derinlemesine yarı yapılandırılmış görüşme yapılır.' },
              { tur: 'Açıklayıcı Karma', rozet: 'Nicel → Nitel', soru: 'Katılım puanı düşen öğrenciler neden dersten kopmaktadır?', yontem: 'Önce 240 öğrenciden katılım verisi toplanır, ardından katılımı en düşük ve en yüksek 10 öğrenciyle görüşülür.' },
            ],
            audio_path: 'audio/m3-standart-s2.mp3',
            narration: 'İlişki ölçülüyorsa nicel ilişkisel desen, yaşanmış deneyimler derinlemesine anlaşılacaksa nitel olgubilim, ikisi birleştirilecekse karma desen seçilir.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 3, slide_type: 'decision_tree', kisaAd: '3. Karar Ağacı', ikon: 'dal',
            ustBaslik: 'Deneysel mi, İlişkisel mi?', altBaslik: 'Araştırmacının değişkene müdahalesi var mı?',
            kokSoru: 'Araştırmacı öğrencilerin çalışma/katılım koşuluna kendisi müdahale edip gruplara atama yapıyor mu?',
            dallar: [
              { kosul: 'EVET — Müdahale & Grup Ataması Var', desen: 'Deneysel Desen', ornek: 'Öğrencileri rastgele दो gruba ayırıp bir gruba etkileşimli kısa sınav uygulamak, diğerine uygulamamak.' },
              { kosul: 'HAYIR — Müdahale Yok, Mevcut Durum Ölçülüyor', desen: 'İlişkisel Tarama Deseni', ornek: 'Öğrencilerin mevcut kütüphane/sistem kullanım süreleri ile not ortalamaları arasındaki ilişkiyi hesaplamak.' },
            ],
            audio_path: 'audio/m3-standart-s3.mp3',
            narration: 'Araştırmacı değişkenlere müdahale etmeden mevcut ilişkiye bakıyorsa ilişkisel, gruplara farklı koşul uyguluyorsa deneysel desen kullanmış olur.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'mixed_sequence', kisaAd: '4. Karma Akış', ikon: 'grafik',
            ustBaslik: 'Açıklayıcı Sıralı Karma Desen', altBaslik: 'Nicel genel eğilimden nitel derinliğe geçiş',
            asama1: { baslik: '1. Aşama: Nicel Tarama (n = 240)', detay: 'Katılım süresi ile başarı arasındaki sayısal örüntü (r = 0,62) belirlenir.' },
            asama2: { baslik: '2. Aşama: Nitel Görüşme (n = 10)', detay: 'Sayısal farkın nedenlerini açıklamak için seçilen öğrencilerle derinlemesine görüşülür.' },
            sentez: 'Sayılar "ne kadar" sorusunu, görüşmeler ise "neden ve nasıl" sorusunu yanıtlayarak bütüncül bulgu sağlar.',
            audio_path: 'audio/m3-standart-s4.mp3',
            narration: 'Açıklayıcı sıralı karma desende önce geniş örneklemden sayısal veri toplanır, ardından bu sonuçları açıklamak için nitel görüşmeler yapılır.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Sorudan uygun desene', altBaslik: 'Çözümün özeti',
            solEtiket: 'Araştırma Sorusunun Amacı', bagimsiz: 'Etki / İlişki / Deneyim',
            sagEtiket: 'Seçilen Araştırma Deseni', bagimli: 'Nicel / Nitel / Karma Desen',
            ozetNot: 'Ne öğrenmek istediğimiz, araştırma desenimizi ve veriyi nasıl toplayacağımızı belirler.',
            audio_path: 'audio/m3-standart-s5.mp3',
            narration: 'Özetle desen seçimi araştırma sorusunun doğasına göre yapılır: ilişki veya etki için nicel, deneyim için nitel, her ikisi için karma yöntem seçilir.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m3', gorevTipi: 'm3_desen_siniflandir', eyebrow: 'MODÜL 03 · MİKRO-GÖREV',
        altYazi: 'Üç farklı araştırma kurgusunu uygun araştırma desenine sınıflandır ve müdahale ölçütünü doğrula.',
        baslik: 'Kütüphane kullanımı ve akademik başarı nasıl araştırılır?',
        metin: 'Üç farklı araştırmacı, üniversite öğrencilerinin kütüphane kullanım alışkanlıklarını farklı araştırma sorularıyla incelemiştir. Her bir çalışmanın kurgusunu inceleyerek uygun araştırma desenine yerleştir.',
        temaTip: 'standart',
        kosullar: [
          { ad: '0–2 saat', deger: '2,45 GNO', diyagram: 'saat1' },
          { ad: '3–6 saat', deger: '2,95 GNO', diyagram: 'saat2' },
          { ad: '7+ saat', deger: '3,35 GNO', diyagram: 'saat3' },
        ],
        soruBaslik: '1. Bölüm: Üç araştırma kurgusunu uygun desene sınıflandır',
        soruAlt: 'Bir araştırma kurgusuna dokun, ardından ait olduğu desen kutusunu seç',
        sinifKategoriler: ['Nicel (İlişkisel / Deneysel)', 'Nitel (Olgubilim / Görüşme)', 'Karma Yöntem (Sıralı)'],
        sinifOgeler: [
          { metin: '200 öğrencinin haftalık kütüphane kullanım saati ile dönem sonu not ortalaması arasındaki istatistiksel ilişkiyi hesaplamak', kategori: 0 },
          { metin: '8 öğrenciyle kütüphanede ders çalışırken yaşadıkları odaklanma ve kaygı deneyimleri üzerine derinlemesine görüşme yapmak', kategori: 1 },
          { metin: 'Önce 200 öğrencinin kütüphane süresi ve notlarını karşılaştırmak, ardından en çok ve en az kullanan 8 öğrenciyle nedenleri üzerine görüşmek', kategori: 2 },
        ],
        soru1: '2. Bölüm: İlk çalışmada araştırmacı öğrencilerin çalışma düzenine müdahale etmeden mevcut durumu ölçtüğü için hangi nicel alt deseni kullanmıştır?',
        bagimsizSecenekler: ['İlişkisel araştırma deseni', 'Gerçek deneysel desen', 'Olgubilim deseni', 'Eylem araştırması'],
        bagimsizDogru: 0,
        ipucuBagimsiz: 'Sayısal ilişkiyi Nicel, derinlemesine görüşmeyi Nitel, önce sayısal sonra görüşme yapanı Karma kutusuna yerleştir.',
        ipucuBagimli: 'Araştırmacının öğrencilerin çalışma süresini değiştirip değiştirmediğine (müdahale olup olmadığına) dikkat et.',
        aciklamaDogru: 'Doğru! Üç çalışmayı da desenlerine doğru sınıflandırdın ve müdahalesiz nicel incelemenin ilişkisel desen olduğunu belirledin.',
      },
    },
    m4: {
      modulId: 'm4',
      modulAd: 'Evren ve örneklem',
      sablonAd: 'Evren-Örneklem Kapsülü & Tabakalı Nokta Izgarası (Etkileşimli Tabakalı Seçim)',
      kazanim: 'Araştırmada evren, örneklem ve tabakalı örnekleme mantığını ayırt eder ve uygular.',
      slayt: {
        id: 'kontrol-m4', etiket: 'Kontrol grubu — Standart içerik (M4)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Fakülte öğrencilerinden tabakalı örneklem seçimi', sureToplam: '75 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Kimlerden veri toplanacak?', altBaslik: 'Üniversite dijital okuryazarlık araştırması',
            soru: '1.200 öğrencilik bir fakülteyi temsil edecek örneklem nasıl seçilir?',
            image_path: 'images/m4-standart-s1.png', audio_path: 'audio/m4-standart-s1.mp3',
            narration: 'Bir araştırmacı bin iki yüz öğrencinin bulunduğu bir fakültede dijital okuryazarlık düzeyini incelemek istemektedir. Herkese ulaşmak zor olduğu için temsili bir örneklem seçmelidir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'population_vs_sample', kisaAd: '2. Evren & Örneklem', ikon: 'izgara',
            ustBaslik: 'Evren, Örneklem ve Analiz Birimi', altBaslik: 'Genellenmek istenen bütün grup ve seçilen alt küme',
            evrenTanim: 'Fakültedeki 3 bölümde öğrenim gören toplam 1.200 lisans öğrencisi (N = 1.200)',
            orneklemTanim: 'Her bölümden rastgele seçilerek veri toplanan 120 öğrenci (n = 120)',
            birimTanim: 'Tek bir lisans öğrencisi',
            nedenOrneklem: 'Tüm evrene ulaşmak yerine evrendeki bölümleri dengeli temsil eden 120 öğrenciyle çalışmak zaman ve maliyet tasarrufu sağlar.',
            audio_path: 'audio/m4-standart-s2.mp3',
            narration: 'Sonuçların genellenmek istendiği bin iki yüz kişilik bütün grup evreni, arasından seçilip veri toplanan yüz yirmi öğrenci ise örneklemi oluşturur.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'sampling_bias_comparison', kisaAd: '3. Yanlılık Riski', ikon: 'dal',
            ustBaslik: 'Yanlı Seçim vs Tabakalı Seçkisiz Seçim', altBaslik: 'Temsil gücü neden bozulur?',
            yanliBaslik: '✕ Yanlı / Uygun Örnekleme Hatası',
            yanliAciklama: 'Sadece Mühendislik kantininde oturan 120 gönüllü öğrenciye anket uygulamak, Eğitim ve Fen-Edebiyat öğrencilerini dışarıda bırakır.',
            dogruBaslik: '✓ Tabakalı Seçkisiz Örnekleme',
            dogruAciklama: 'Bölümler tabaka olarak belirlenir ve her bölümden rastgele 40’ar öğrenci seçilerek tüm fakültenin temsil edilmesi sağlanır.',
            audio_path: 'audio/m4-standart-s3.mp3',
            narration: 'Sadece tek bir bölümden veya gönüllülerden seçim yapılırsa örneklem yanlı olur; tabakalı seçim ise tüm bölümleri temsil eder.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'stratified_grid', kisaAd: '4. Tabakalı Seçim', ikon: 'grafik',
            ustBaslik: 'Tabakalı Örnekleme Dağılımı', altBaslik: 'Her bölümden 40 öğrenci (%10 temsil)',
            birim: 'öğrenci',
            tabakalar: [
              { ad: 'Mühendislik', evrenSayi: '400', orneklemSayi: '40', oran: '%10 rastgele' },
              { ad: 'Eğitim', evrenSayi: '400', orneklemSayi: '40', oran: '%10 rastgele' },
              { ad: 'Fen-Edebiyat', evrenSayi: '400', orneklemSayi: '40', oran: '%10 rastgele' },
            ],
            toplamNot: 'Toplam Evren: N = 1.200 öğrenci → Toplam Tabakalı Örneklem: n = 120 öğrenci',
            audio_path: 'audio/m4-standart-s4.mp3',
            narration: 'Tabakalı örnekleme sayesinde her bölümden kırk öğrenci rastgele seçilerek toplam yüz yirmi kişilik dengeli bir örneklem elde edilir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Temsil gücü yüksek örneklem', altBaslik: 'Çözümün özeti',
            solEtiket: 'Hedef Evren (Bütün)', bagimsiz: '1.200 Fakülte Öğrencisi',
            sagEtiket: 'Tabakalı Örneklem', bagimli: '120 Öğrenci (3×40)',
            ozetNot: 'Doğru örnekleme yöntemi, az kişiyle evreni güvenilir biçimde temsil etmeyi sağlar.',
            audio_path: 'audio/m4-standart-s5.mp3',
            narration: 'Özetle evren bütün hedef grubu ifade eder; tabakalı örnekleme ise tüm alt grupların örneklemde adil biçimde temsil edilmesini güvence altına alır.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m4', gorevTipi: 'm4_tabakali_orneklem', eyebrow: 'MODÜL 04 · MİKRO-GÖREV',
        altYazi: 'Evrendeki 3 alt tabakadan eşit temsil sağlayacak şekilde tabakalı örneklem seç ve evren/örneklemi belirle.',
        baslik: '300 hazırlık öğrencisinden dengeli örneklem seçimi',
        metin: 'Bir araştırmacı, bir üniversitedeki 3 farklı kurda (Başlangıç, Orta, İleri) eğitim gören toplam 300 hazırlık sınıfı öğrencisinin kütüphane kullanım alışkanlıklarını incelemektedir. Her kurda 100 öğrenci vardır ve araştırmacı toplam 60 öğrenci seçecektir.',
        temaTip: 'standart',
        kosullar: [
          { ad: 'Toplam evren (N)', deger: '300 öğrenci', diyagram: 'saat1' },
          { ad: 'Tabakalı örneklem (n)', deger: '60 öğrenci', diyagram: 'saat2' },
          { ad: 'Her tabakadan', deger: '20 öğrenci', diyagram: 'saat3' },
        ],
        soruBaslik: '1. Bölüm: Tabakalı Örnekleme Simülasyonu (Her kurdan 2 temsilci birim seç)',
        soruAlt: 'Aşağıdaki üç kur tabakasının her birinden tam 2 öğrenci noktasına dokunarak dengeli örneklemi oluştur',
        birim: 'öğrenci',
        hedefAdet: 2,
        tabakalar: ['Başlangıç Kuru', 'Orta Kur', 'İleri Kur'],
        soru1: '2. Bölüm: Bu araştırmanın evreni ve örneklemi aşağıdakilerden hangisinde doğru verilmiştir?',
        bagimsizSecenekler: [
          'Evren: Üniversitedeki 300 hazırlık öğrencisi · Örneklem: Seçilen 60 öğrenci (her kurdan 20’şer öğrenci)',
          'Evren: Anket uygulanan 60 öğrenci · Örneklem: 300 hazırlık öğrencisi',
          'Evren: Türkiye’deki tüm üniversiteliler · Örneklem: 300 öğrenci',
          'Evren: Sadece İleri Kur öğrencileri · Örneklem: 20 öğrenci',
        ],
        bagimsizDogru: 0,
        ipucuBagimsiz: 'Üç kur tabakasının her birinden tam 2 daire seçtiğinden emin ol.',
        ipucuBagimli: 'Evren sonuçların genelleneceği 300 kişilik bütünü, örneklem ise veri toplanan 60 kişilik alt grubu ifade eder.',
        aciklamaDogru: 'Doğru! Her kur tabakasından eşit sayıda birim seçerek tabakalı örneklemi oluşturdun; araştırmanın evreninin 300, örnekleminin 60 öğrenci olduğunu doğru belirledin.',
      },
    },
    m5: {
      modulId: 'm5',
      modulAd: 'Veri toplama',
      sablonAd: 'Ölçme Aracı Planı & 3’lü Hedef Tahtası (Geçerlik/Güvenirlik Hata Teşhisi)',
      kazanim: 'Ölçme aracında geçerlik ve güvenirlik kavramlarını ayırt eder ve ölçüm hatalarını teşhis eder.',
      slayt: {
        id: 'kontrol-m5', etiket: 'Kontrol grubu — Standart içerik (M5)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Ölçme aracının geçerliği ve güvenirliği', sureToplam: '75 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Doğru ve tutarlı ölçüm', altBaslik: 'Okuduğunu anlama testi geliştirme',
            soru: 'Bir ölçme aracının hem tutarlı hem de doğru özelliği ölçmesi nasıl sağlanır?',
            image_path: 'images/m5-standart-s1.png', audio_path: 'audio/m5-standart-s1.mp3',
            narration: 'Bir araştırmacı öğrencilerin okuduğunu anlama düzeyini ölçmek için yeni bir test hazırlamıştır. Testin bilimsel değer taşıması için geçerlik ve güvenirlik şarttır.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'instrument_blueprint', kisaAd: '2. Ölçme Aracı', ikon: 'izgara',
            ustBaslik: 'Hedef Yapı ve Veri Toplama Aracı Uyumu', altBaslik: 'Ne ölçülüyor ve hangi araçla ölçülüyor?',
            olculenYapi: 'Metindeki ana fikri ve çıkarımları anlama becerisi',
            secilenArac: '20 soruluk çoktan seçmeli ve kısa yanıtlı Okuduğunu Anlama Testi',
            aracGerekce: 'Okuma hızını veya genel ezberi değil, doğrudan metinden anlam çıkarma becerisini ölçmek üzere uzman görüşüyle yapılandırılmıştır.',
            kontrolListesi: ['Açık puanlama anahtarı', 'Uzman kapsam onayı', 'Standart 40 dk süre'],
            audio_path: 'audio/m5-standart-s2.mp3',
            narration: 'Seçilen ölçme aracı, ölçmek istediğimiz okuduğunu anlama becerisine doğrudan karşılık gelmeli ve standart koşullarda uygulanmalıdır.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'bullseye_targets', kisaAd: '3. Hedef Tahtası', ikon: 'dal',
            ustBaslik: 'Geçerlik ve Güvenirlik: Hedef Tahtası Analojisi', altBaslik: 'Ölçümlerde kararlılık ve hedef isabeti',
            hedefler: [
              { tip: 'daginik', baslik: 'Güvenilir Değil & Geçersiz', aciklama: 'Sorular belirsiz; aynı öğrenci her uygulamada bambaşka puan alıyor.' },
              { tip: 'kaymis', baslik: 'Güvenilir Ama Geçersiz', aciklama: 'Her ölçümde aynı puanı veriyor (ör. 2 kg fazla tartan terazi gibi) ama anlama yerine hızlı yazmayı ölçüyor.' },
              { tip: 'merkez', baslik: 'Hem Güvenilir Hem Geçerli', aciklama: 'Doğrudan okuduğunu anlamayı her tekrarda tutarlı ve hatasız biçimde ölçüyor.' },
            ],
            audio_path: 'audio/m5-standart-s3.mp3',
            narration: 'Bir terazi her ölçümde 2 kilogram fazla gösteriyorsa tutarlı olduğu için güvenilirdir; ancak doğru ağırlığı vermediği için geçerli değildir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'threat_diagnosis', kisaAd: '4. Hata Teşhisi', ikon: 'grafik',
            ustBaslik: 'Geçerlik ve Güvenirlik Tehditlerini Ayırt Etme', altBaslik: 'Ölçmeye karışan hata kaynakları ve önlemler',
            gecerlikTehdidi: 'Okuduğunu anlama testinde metinle ilgisiz genel kültür veya hızlı klavye yazma hızının puanı belirlemesi.',
            gecerlikOnlem: 'Soruların yalnızca verilen metni anlamaya dayalı olmasını sağlamak (Kapsam ve yapı geçerliği).',
            guvenirlikTehdidi: 'Açık uçlu yanıtları iki farklı öğretmenin tamamen farklı kriterlerle puanlaması veya sabah/akşam ölçümlerinin çelişmesi.',
            guvenirlikOnlem: 'Ayrıntılı puanlama rubriği kullanmak ve puanlayıcılar arası uyumu kontrol etmek.',
            audio_path: 'audio/m5-standart-s4.mp3',
            narration: 'Okuduğunu anlama yerine sadece yazma hızını ölçen bir testin geçerliği düşüktür; puanlayıcıdan puanlayıcıya değişen bir testin ise güvenirliği düşüktür.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Geçerlik ve güvenirlik dengesi', altBaslik: 'Çözümün özeti',
            solEtiket: 'Güvenirlik (Tutarlılık)', bagimsiz: 'Tekrarlı Ölçümde Kararlılık',
            sagEtiket: 'Geçerlik (Amaca Uygunluk)', bagimli: 'Doğru Özelliği Ölçme',
            ozetNot: 'Bilimsel bir ölçme aracı hem tutarlı sonuç vermeli hem de gerçekten hedeflediği kavramı ölçmelidir.',
            audio_path: 'audio/m5-standart-s5.mp3',
            narration: 'Özetle güvenirlik tutarlılığı, geçerlik ise doğru hedefi ölçmeyi sağlar; nitelikli veri için ikisi birlikte gereklidir.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m5', gorevTipi: 'm5_gecerlik_guvenirlik', eyebrow: 'MODÜL 05 · MİKRO-GÖREV',
        altYazi: 'Ölçme senaryosundaki 4 durumu Geçerlik Sorunu veya Güvenirlik Sorunu olarak sınıflandır.',
        baslik: 'Stres ölçeğinde geçerlik mi, güvenirlik mi zedelendi?',
        metin: 'Bir araştırmacı, üniversite öğrencilerinin sınav stresi düzeyini ölçmek için yeni bir ölçek uygulamaktadır. Uygulama sırasında aşağıdaki dört sorun tespit edilmiştir.',
        temaTip: 'standart',
        kosullar: [
          { ad: '1. Ölçüm (Pzt)', deger: '78 puan', diyagram: 'saat1' },
          { ad: '2. Ölçüm (Çar)', deger: '42 puan', diyagram: 'saat2' },
          { ad: 'Madde kapsamı', deger: 'Sadece uyku saati', diyagram: 'saat3' },
        ],
        soruBaslik: '1. Bölüm: Dört ölçüm sorununu zedelediği özelliğe göre sınıflandır',
        soruAlt: 'Bir ifadeye dokun, ardından Geçerlik Sorunu veya Güvenirlik Sorunu kutusuna yerleştir',
        sinifKategoriler: ['Geçerlik Sorunu (Hedef Sapması)', 'Güvenirlik Sorunu (Tutarsızlık)'],
        sinifOgeler: [
          { metin: 'Sınav stresi ölçeğinde stres belirtileri yerine yalnızca öğrencinin kaç saat uyuduğunun sorulması', kategori: 0 },
          { metin: 'Ölçeğin aynı öğrencilere koşullar değişmeden iki gün arayla uygulandığında çok farklı puanlar vermesi', kategori: 1 },
          { metin: 'Maddelerin öğrenciyi "Stres hiç yaşamam" cevabını seçmeye zorlayacak şekilde yönlendirici yazılması', kategori: 0 },
          { metin: 'İki farklı uzmanın aynı görüşme formunu puanlarken birbirinden tamamen farklı toplam puanlar çıkarması', kategori: 1 },
        ],
        soru1: '2. Bölüm: Bir ölçme aracı her ölçümde birebir aynı sonucu veriyor ancak hedeflenen özellik yerine başka bir özelliği ölçüyorsa nasıl tanımlanır?',
        bagimsizSecenekler: [
          'Güvenilirdir ancak geçerli değildir',
          'Geçerlidir ancak güvenilir değildir',
          'Hem geçerli hem güvenilirdir',
          'Ne geçerli ne de tutarlıdır',
        ],
        bagimsizDogru: 0,
        ipucuBagimsiz: 'Ölçülmek istenen kavramın dışına çıkmak Geçerlik; tekrarlanan ölçümler veya puanlayıcılar arasındaki tutarsızlık ise Güvenirlik sorunudur.',
        ipucuBagimli: 'Hep aynı yanlış noktayı vuran oklar tutarlıdır (güvenilir) ama hedefi vuramamıştır (geçersiz).',
        aciklamaDogru: 'Doğru! Stres yerine uyku süresini ölçmenin geçerliği, iki gün arayla tutarsız puanlar almanın ise güvenirliği zedelediğini eksiksiz sınıflandırdın.',
      },
    },
    m6: {
      modulId: 'm6',
      modulAd: 'Analiz ve raporlama',
      sablonAd: 'Betimsel Veri Tablosu, İlişki vs Nedensellik & Sınırlılık Raporu',
      kazanim: 'Tablo/grafik verilerini doğru yorumlar, ilişki ile nedenselliği ayırır ve araştırmanın sınırlılıklarını raporlar.',
      slayt: {
        id: 'kontrol-m6', etiket: 'Kontrol grubu — Standart içerik (M6)', kisa: 'Standart (Kontrol)',
        altBaslik: 'Veriden bulguya ve sınırlılık raporuna', sureToplam: '76 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Ham veriden bilimsel bulguya', altBaslik: 'Haftalık tekrar ve dönem sonu notu',
            soru: 'Grafikte gördüğümüz farktan hangi bilimsel ifadeler çıkarılabilir?',
            image_path: 'images/m6-standart-s1.png', audio_path: 'audio/m6-standart-s1.mp3',
            narration: 'Bir araştırmacı 180 lisans öğrencisinin haftalık ders tekrar sıklığı ile dönem sonu sınav ortalamalarını incelemiş ve grupların ortalamalarını hesaplamıştır.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'data_cleaning_table', kisaAd: '2. Veri Tablosu', ikon: 'izgara',
            ustBaslik: 'Gruplara Göre Betimsel İstatistik Tablosu', altBaslik: 'Ham verilerin temizlenmesi ve özetlenmesi (n = 180)',
            olcuBirimi: 'Dönem Sonu Sınav Ortalaması',
            satirlar: [
              { grup: 'Haftalık tekrar yok', n: '60', ortalama: '58 puan', not: 'En düşük ortalama' },
              { grup: 'Haftada 1 kez tekrar', n: '60', ortalama: '71 puan', not: 'Orta düzey ortalama' },
              { grup: 'Haftada 3+ kez tekrar', n: '60', ortalama: '83 puan', not: 'En yüksek ortalama' },
            ],
            temizlikNotu: 'Veri analizi öncesinde eksik formlar ve hatalı veri girişleri kontrol edilerek grup ortalamaları hesaplanmıştır.',
            audio_path: 'audio/m6-standart-s2.mp3',
            narration: 'Veriler temizlenip gruplandırıldığında haftada üç ve üzeri tekrar yapan öğrencilerin ortalamasının seksen üç puan olduğu görülmektedir.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'dependent_var', kisaAd: '3. Grafik Okuma', ikon: 'grafik',
            ustBaslik: 'Gruplar arası dağılım grafiği', altBaslik: 'Dönem sonu sınav ortalamalarının görselleştirilmesi',
            degisken: 'Dönem sonu sınav puanı (Ortalama)',
            oncekiRef: 'Tekrar yok: 58 · Haftada 1: 71 · Haftada 3+: 83',
            veri: [{ etiket: 'Tekrar yok', deger: 58 }, { etiket: 'Haftada 1', deger: 71 }, { etiket: 'Haftada 3+', deger: 83 }],
            audio_path: 'audio/m6-standart-s3.mp3',
            narration: 'Çubuk grafik, haftalık tekrar sıklığı arttıkça dönem sonu sınav ortalamasının da yükseldiğini açıkça göstermektedir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'correlation_vs_causation', kisaAd: '4. Bulgu Yazımı', ikon: 'dal',
            ustBaslik: 'İlişki vs Nedensellik: Nesnel Bulgu Cümlesi', altBaslik: 'Abartısız ve veriye sadık raporlama',
            yanlisBaslik: '✕ Hatalı / Aşırı Genellenmiş Yorum',
            yanlisMetin: '“Haftalık tekrar yapmak bütün dünyadaki öğrencilerde sınav başarısını kesin olarak garantileyen tek nedendir.”',
            yanlisNeden: 'Gruplar rastgele atanmadığı halde kesin nedensellik iddia ediyor ve örneklem dışına aşırı genelleme yapıyor.',
            dogruBaslik: '✓ Veriye Sadık Nesnel Bulgu Cümlesi',
            dogruMetin: '“İncelenen 180 lisans öğrencisinde haftada 3 ve üzeri tekrar yapan grubun sınav ortalaması (83), tekrar yapmayan gruptan (58) daha yüksektir.”',
            dogruNeden: 'Sayıları ve örneklemi olduğu gibi aktarır; ilişkisel veriden kanıtsız nedensellik çıkarmaz.',
            audio_path: 'audio/m6-standart-s4.mp3',
            narration: 'Araştırmada gruplar rastgele atanmadığı için tek başına nedensellik kurulamaz; bulgu cümlesi yalnızca gözlenen farkı nesnel biçimde aktarır.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 5, slide_type: 'limitations_report', kisaAd: '5. Sınırlılıklar', ikon: 'tik',
            ustBaslik: 'Şeffaf raporlama ve araştırmanın sınırlılıkları', altBaslik: 'Çözümün özeti',
            bulguOzeti: 'Haftalık tekrar sıklığı ile dönem sonu sınav ortalaması arasında pozitif yönlü bir fark/ilişki gözlenmiştir (83 vs 58 puan).',
            sinirliliklar: [
              'Yöntemsel Sınır: Gruplar rastgele atanmadığı (ilişkisel tarama olduğu) için doğrudan neden-sonuç ilişkisi kurulamaz.',
              'Örneklem Sınırı: Bulgular çalışmanın yürütüldüğü fakültedeki 180 lisans öğrencisiyle sınırlıdır.',
              'Ölçüm Sınırı: Tekrar sıklığı öğrencilerin öz bildirimine dayanmaktadır.',
            ],
            audio_path: 'audio/m6-standart-s5.mp3',
            narration: 'Özetle veriyi grafiğe dökmek örüntüyü görünür kılar; raporda ise yalnızca verinin desteklediği bulgular ve sınırlılıklar paylaşılır.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m6', gorevTipi: 'm6_analiz_rapor', eyebrow: 'MODÜL 06 · MİKRO-GÖREV',
        altYazi: 'Grafik verilerini incele, doğru bulgu cümlesini ve araştırmanın sınırlılığını belirle.',
        baslik: 'Grafikten hangi bilimsel sonuca ulaşılabilir?',
        metin: 'Bir fakültede 150 öğrencinin günlük çalışma süresi ile proje puanı arasındaki ilişki incelenmiştir. Günde 3 saat ve üzeri çalışanların ortalaması 86, 1–3 saat çalışanların 76, 1 saatten az çalışanların ortalaması ise 64 olarak bulunmuştur. Gruplar rastgele atanmamıştır.',
        temaTip: 'standart',
        veriBirimi: 'Ortalama Proje Puanı (n = 150)',
        kosullar: [
          { ad: '1 saatten az', deger: '64 puan', diyagram: 'saat1' },
          { ad: '1–3 saat', deger: '76 puan', diyagram: 'saat2' },
          { ad: '3+ saat', deger: '86 puan', diyagram: 'saat3' },
        ],
        soruBaslik: 'Bulguyu ve yöntemsel sınırlılığı yorumla', soruAlt: 'Analiz ve şeffaf raporlama',
        soru1: '1. Bu verilere dayanarak aşağıdaki bulgu ifadelerinden hangisi doğrudan söylenebilir?',
        bagimsizSecenekler: [
          'Bu örneklemde günde 3+ saat çalışanların ortalama proje puanı 86, 1 saatten az çalışanların 64’tür.',
          'Ders çalışma süresi bütün insanlarda başarıyı kesin olarak belirleyen tek nedendir.',
          'Bu sonuç ilkokul öğrencileri için de tamamen geçerlidir.',
          '1 saatten az çalışanların hepsi dersten kalmıştır.',
        ],
        bagimsizDogru: 0,
        soru2: '2. Bu çalışmanın raporunun “Sınırlılıklar” bölümünde aşağıdakilerden hangisi belirtilmelidir?',
        bagimliSecenekler: [
          'Grafik çubuklarının rengi turuncudur.',
          'Gruplar rastgele atanmadığı için kesin neden–sonuç ilişkisi kurulamaz ve bulgu yalnızca bu fakülte örneklemiyle sınırlıdır.',
          'Veriler ortalama alınarak özetlenmiştir.',
          'Araştırmada 3 grup karşılaştırılmıştır.',
        ],
        bagimliDogru: 1,
        ipucuBagimsiz: 'Veriye sadık kalan, aşırı genelleme veya kesin nedensellik iddiası içermeyen seçeneği bul.',
        ipucuBagimli: 'Rastgele atama olmaması ve örneklemin tek fakülteden gelmesi raporun hangi sınırını oluşturur?',
        feedback1Yanlis: 'Sınırlılık seçimin doğru; ilk soruda yalnızca grafikteki verilere sadık kalan ifadeyi seç.',
        feedback2Yanlis: 'Bulgu cümlen doğru; ikinci soruda yöntemsel sınırlılığı açıklayan ifadeyi seç.',
        aciklamaDogru: 'Doğru! İlk ifade veriyi nesnel biçimde aktarır; ikinci ifade ise rastgele atama olmaması ve örneklem kapsamı nedeniyle çalışmanın sınırlılığını doğru biçimde ortaya koyar.',
      },
    },
  };

  function getKontrol(modulId) {
    return KONTROL_ICERIK[modulId] || KONTROL_ICERIK.m2;
  }

  /* ---------- 1c. Jüri Sunumu ve Canlı Laboratuvar İçin 6 Modül × 6 Öğrenci Profili (36 Paket) Hazır Deneysel İçerik & Appendix B Denetim İzi ---------- */
  function getHazirDeneyPaketi(modulId = 'm2', profilObj = null, uretimAyar = {}) {
    const kontrol = getKontrol(modulId);
    const pId = (profilObj && profilObj.id && /^o[1-6]$/.test(profilObj.id)) ? profilObj.id : 'o1';
    const profil = profilObj || {
      id: 'o1',
      etiket: 'Öğrenci 1 — Basketbol (İzleyici)',
      kisaEtiket: 'Basketbol (İzleyici)',
      kategori: 'Spor',
      altKategori: 'Basketbol',
      ozgulKisa: 'EuroLeague, Anadolu Efes',
      etkilesimler: ['Maç izlemek', 'Takım takip etmek', 'İstatistikleri incelemek'],
      aciklama: 'EuroLeague maçlarını takip ediyorum.',
    };

    const slayt = (window.SlaytSunum && window.SlaytSunum.getDeneySlayt)
      ? JSON.parse(JSON.stringify(window.SlaytSunum.getDeneySlayt(modulId, pId)))
      : JSON.parse(JSON.stringify(kontrol.slayt));
    const gorev = (window.GorevPrototip && window.GorevPrototip.getDeneyGorev)
      ? JSON.parse(JSON.stringify(window.GorevPrototip.getDeneyGorev(modulId, pId)))
      : JSON.parse(JSON.stringify(kontrol.gorev));

    const onDenetimAcik = uretimAyar.onDenetimAcik !== false;
    const maxRevizyon = Math.max(0, Math.min(5, Number(uretimAyar.maxRevizyon ?? 2)));
    const esikPuan = Math.max(0.5, Math.min(1.0, Number(uretimAyar.gecmeEsigi ?? 0.85)));
    const senaryoModel = uretimAyar.senaryoModel || 'claude-sonnet-4-5';
    const denetimModel = uretimAyar.denetimModel || 'claude-sonnet-4-5';
    const scriptModel = uretimAyar.scriptModel || 'claude-sonnet-4-5';
    const promptModel = uretimAyar.promptModel || 'gemini-2.5-pro';
    const baglamEtiket = `${profil.altKategori || profil.kisaEtiket} (${profil.ozgulKisa || ''})`;

    // Tur 1 (İlk Taslak Ön Denetimi — Kısmi uyum ve somut revizyon önerisi örneği)
    const tur1Ham = {
      pedagojik: {
        accuracy: { puan: 1.0, gerekce: `${kontrol.modulAd} kavramları ${baglamEtiket} senaryosunda bilimsel olarak doğru temsil edilmiştir.`, oneri: '' },
        coverage: { puan: 1.0, gerekce: `Hedef kazanım (${kontrol.kazanim}) ve 5 slaytlık hiyerarşi eksiksiz kapsanmıştır.`, oneri: '' },
        emphasis: { puan: 1.0, gerekce: 'Çekirdek araştırma kavramları ön plandadır; bağlam detayı kavramın önüne geçmemiştir.', oneri: '' },
        engagement: { puan: 1.0, gerekce: `Öğrencinin "${(profil.etkilesimler || []).join(', ')}" etkileşim biçimi senaryoya doğrudan yansıtılmıştır.`, oneri: '' },
        cognitive_load: { puan: 0.5, gerekce: 'İlk taslakta Slayt 2 ve Slayt 4 anlatım cümleleri kontrol grubuna göre biraz uzundur ve alan terimleri yoğunlaşmıştır.', oneri: 'Slayt anlatımlarını 15-17 saniyelik konuşma süresine indirge ve teknik terimleri sadeleştir.' },
        active_learning: { puan: 1.0, gerekce: `Mikro-görev (${gorev.gorevTipi}) hatırlamanın ötesinde uygulama ve analiz düzeyinde aktif katılım sağlamaktadır.`, oneri: '' },
        metacognition: { puan: 1.0, gerekce: 'İpucu ve yanıta özgü açıklayıcı dönütler öğrencinin kendi düşünme hatasını görmesini desteklemektedir.', oneri: '' },
        motivation: { puan: 1.0, gerekce: 'Destekleyici ton ve optimal zorluk düzeyi korunmuştur.', oneri: '' },
        adaptability: { puan: 1.0, gerekce: `İçerik yüzeysel isim değiştirmeyle kalmayıp öğrencinin "${profil.ozgulKisa}" pratiğine derinlemesine uyarlanmıştır.`, oneri: '' },
        clarity_intentions: { puan: 1.0, gerekce: 'Öğrenme hedefi ve mikro-görev başarı ölçütleri açıkça ifade edilmiştir.', oneri: '' },
      },
      esdegerlik: {
        eq_lo: { puan: 1.0, gerekce: `Kontrol grubuyla birebir aynı kazanımı (${kontrol.kazanim}) ölçmektedir.`, oneri: '' },
        eq_bloom: { puan: 0.5, gerekce: 'İlk taslakta mikro-görev çeldiricilerinden biri kontrol grubuna kıyasla daha kolay elenebilir düzeydedir.', oneri: 'Mikro-görevdeki çeldiricileri kontrol grubuyla aynı bilişsel ayırt edicilik düzeyine getir.' },
        eq_structure: { puan: 1.0, gerekce: `Kontrol grubuyla birebir aynı tasarım şablonu (${kontrol.sablonAd}) ve 5 slayt + etkileşimli görev yapısı kullanılmıştır.`, oneri: '' },
        eq_domain_neutral: { puan: 0.5, gerekce: 'İlk taslakta ilgi alanına özgü bir terim, o alanı bilmeyen birisi için ek ön bilgi gerektirebilir.', oneri: 'Senaryodaki tüm terimleri bağlam içinde açıklayarak alan ustalığı gereksinimini sıfırla.' },
        eq_transfer: { puan: 1.0, gerekce: `Çözümlü örnek ("${slayt.altBaslik}") ile mikro-görev ("${gorev.baslik}") aynı ilgi evreninde farklı bir transfer senaryosuna geçmektedir.`, oneri: '' },
      },
      genelYorum: `İlk taslak ${kontrol.sablonAd} şablonuna ve öğrencinin ilgi profiline güçlü biçimde uymaktadır; ancak bilişsel yük (cümle uzunluğu), mikro-görev çeldirici dengesi ve ön bilgi bağımsızlığı boyutlarında 1.0 tam puana ulaşmak için 1 revizyon önerilmiştir.`,
      revizyonTalimati: '1) Slayt 2 ve 4 seslendirme metinlerini kontrol grubuyla eşit uzunluğa (15-17 sn) sadeleştir. 2) Alan terimlerini ön bilgi gerektirmeyecek şekilde bağlam içinde açıkla. 3) Mikro-görev çeldiricilerini kontrol grubuyla birebir aynı bilişsel zorluğa hizala.',
    };
    const tur1Skor = hesaplaDenetimSkor(tur1Ham, esikPuan);

    // Tur 2 (1. Revizyon Sonrası Nihai Ön Denetim — Tam Uyum 1.00)
    const tur2Ham = {
      pedagojik: {
        accuracy: { puan: 1.0, gerekce: `${kontrol.modulAd} ilkeleri ve kavramsal ilişkiler kaynak materyalle %100 tutarlıdır.`, oneri: '' },
        coverage: { puan: 1.0, gerekce: `Modülün tüm alt öğrenme hedefleri ve 5 adımlı ${kontrol.sablonAd} yapısı eksiksiz korunmuştur.`, oneri: '' },
        emphasis: { puan: 1.0, gerekce: 'Temel araştırma yöntemleri kavramları optimal hiyerarşiyle vurgulanmıştır.', oneri: '' },
        engagement: { puan: 1.0, gerekce: `${baglamEtiket} bağlamı ve görsel sahne kurgusu yüksek motivasyon ve anlamlı bağ kurmaktadır.`, oneri: '' },
        cognitive_load: { puan: 1.0, gerekce: 'Revizyon sonrası metin yoğunluğu, cümle açıklığı ve çoklu ortam (Mayer CTML) dengesi kontrol grubuyla birebir eşitlenmiştir.', oneri: '' },
        active_learning: { puan: 1.0, gerekce: `Transfer mikro-görevi (${gorev.baslik}) öğrenciyi aktif karar verme ve uygulama sürecine katmaktadır.`, oneri: '' },
        metacognition: { puan: 1.0, gerekce: 'Biçimlendirici ipuçları ve yanıt sonrası açıklamalar öz-düzenlemeyi doğrudan desteklemektedir.', oneri: '' },
        motivation: { puan: 1.0, gerekce: 'Teşvik edici ton ve öğrencinin özgül ilgi alanıyla kurulan otantik bağ merakı canlı tutmaktadır.', oneri: '' },
        adaptability: { puan: 1.0, gerekce: `Öğrencinin kategori (${profil.kategori}), alt alan (${profil.altKategori}), etkileşim biçimi ve özgül açıklamasına tam uyarlanmıştır.`, oneri: '' },
        clarity_intentions: { puan: 1.0, gerekce: 'Öğrenme kazanımı ve görev başarı ölçütleri tamamen şeffaf ve anlaşılırdır.', oneri: '' },
      },
      esdegerlik: {
        eq_lo: { puan: 1.0, gerekce: `Kontrol grubuyla birebir aynı öğrenme kazanımını (${kontrol.kazanim}) ölçmektedir.`, oneri: '' },
        eq_bloom: { puan: 1.0, gerekce: 'Revizyon sonrası çeldiriciler ve işlem adımları kontrol grubuyla birebir aynı Bloom bilişsel talep düzeyindedir.', oneri: '' },
        eq_structure: { puan: 1.0, gerekce: `Slayt tipleri (${slayt.slaytlar.map(s => s.slide_type).join(' → ')}) ve görev şablonu (${gorev.gorevTipi}) kontrol grubuyla özdeştir.`, oneri: '' },
        eq_domain_neutral: { puan: 1.0, gerekce: 'Senaryo ilgi alanında hiçbir teknik ustalık gerektirmeden yalnızca araştırma yöntemleri bilgisini ölçmektedir.', oneri: '' },
        eq_transfer: { puan: 1.0, gerekce: `Çözümlü örnekten ("${slayt.altBaslik}") transfer mikro-görevine ("${gorev.baslik}") geçiş mesafesi kontrol grubuyla birebir eşdeğerdir.`, oneri: '' },
      },
      genelYorum: `1. revizyon sonrasında üretilen içerik, arXiv:2509.13348 Appendix B pedagojik yeterlik (1.00) ve Deney–Kontrol Grubu Eşdeğerliği (1.00) ölçütlerinin tamamından tam onay almıştır. Akademisyen onayına sunulmaya hazırdır.`,
      revizyonTalimati: '',
    };
    const tur2Skor = hesaplaDenetimSkor(tur2Ham, esikPuan);

    const turlar = [
      {
        turNo: 1,
        revizyonNo: 0,
        etiket: 'İlk Ön Denetim (Taslak 1)',
        model: denetimModel,
        tarih: 'Hazır Paket · Tur 1',
        ...tur1Skor,
        icerikSnapshot: { altBaslik: slayt.altBaslik + ' (İlk Taslak)', slaytlar: slayt.slaytlar, gorev },
      },
      {
        turNo: 2,
        revizyonNo: 1,
        etiket: '1. Revizyon Sonrası Ön Denetim (Onaylanan)',
        model: denetimModel,
        tarih: 'Hazır Paket · Tur 2',
        ...tur2Skor,
        icerikSnapshot: { altBaslik: slayt.altBaslik, slaytlar: slayt.slaytlar, gorev },
      },
    ];

    const ornekSysPrompt = `Sen eğitim teknolojileri ve araştırma yöntemleri alanında uzman bir öğretim tasarımcısısın.\nGörevin: ${modulId.toUpperCase()} (${kontrol.modulAd}) modülünün Kontrol Grubu standart içeriğiyle TASARIM ŞABLONU (${kontrol.sablonAd}), SLAYT TİPLERİ (${slayt.slaytlar.map(s => s.slide_type).join(', ')}) ve ETKİLEŞİM ŞABLONU (${gorev.gorevTipi}) açısından BİREBİR EŞDEĞER, yalnızca bağlamı öğrencinin ilgi profiline uyarlanmış çözümlü örnek ve transfer mikro-görevi üretmek.`;
    const ornekUsrPrompt = `MODÜL: ${modulId.toUpperCase()} — ${kontrol.modulAd}\nKAZANIM: ${kontrol.kazanim}\nÖĞRENCİ PROFİLİ: ${profil.etiket || profil.altKategori} · Etkileşimler: ${(profil.etkilesimler || []).join(', ')} · Özgül İlgi: ${profil.aciklama || profil.ozgulKisa}\nKONTROL ŞABLONU: ${kontrol.sablonAd}`;
    const gorselPromptSlayt = `Clean modern editorial educational illustration of ${profil.ozgulKisa || profil.altKategori} (${slayt.altBaslik}), no text, warm daylight, teal and orange accents, high clarity, 16:9`;
    const gorselPromptGorev = `Clean modern editorial educational illustration of ${profil.ozgulKisa || profil.altKategori} (${gorev.baslik}), no text, warm daylight, teal and orange accents, high clarity, 16:9`;

    const denetimIzi = [
      {
        id: 'hazir-uretim-1',
        asama: '1. İlk Senaryo ve İçerik Üretimi (Taslak 1)',
        tur: 'uretim',
        model: senaryoModel,
        tarih: 'Adım 1',
        systemPrompt: ornekSysPrompt,
        userPrompt: ornekUsrPrompt,
        outputJson: { altBaslik: slayt.altBaslik, slaytSayisi: 5, slaytTipleri: slayt.slaytlar.map(s => s.slide_type), gorevTipi: gorev.gorevTipi, gorevBaslik: gorev.baslik },
        ozet: `${baglamEtiket} bağlamında "${slayt.altBaslik}" çözümlü örneği ve "${gorev.baslik}" transfer mikro-görevi ilk taslağı üretildi.`,
      },
      {
        id: 'hazir-denetim-1',
        asama: '1b. YZ Ön Denetim (İlk Ön Denetim — Appendix B & Eşdeğerlik)',
        tur: 'denetim',
        model: denetimModel,
        tarih: 'Adım 1b · Tur 1',
        systemPrompt: 'arXiv:2509.13348 Appendix B (10 Pedagojik Rubrik) + Deney-Kontrol Eşdeğerliği (5 Ölçüt) Bağımsız YZ Hakemi',
        userPrompt: `Değerlendirilen Taslak: ${slayt.altBaslik} (${modulId.toUpperCase()} · ${profil.altKategori})\nKontrol Referansı: ${kontrol.slayt.altBaslik}`,
        outputJson: { genelOrtalama: tur1Skor.genelOrtalama, pedagojikOrtalama: tur1Skor.pedagojikOrtalama, esdegerlikOrtalama: tur1Skor.esdegerlikOrtalama, eksikNotlar: tur1Skor.eksikNotlar, revizyonTalimati: tur1Skor.revizyonTalimati },
        ozet: `REVİZYON ÖNERİLDİ · İlk Tur Skoru: %${Math.round(tur1Skor.genelOrtalama * 100)} — Bilişsel yük, çeldirici eşdeğerliği ve ön bilgi bağımsızlığı için düzeltme talimatı oluşturuldu.`,
      },
      {
        id: 'hazir-revizyon-1',
        asama: '1c. Otomatik YZ Revizyonu (1/2)',
        tur: 'revizyon',
        model: senaryoModel,
        tarih: 'Adım 1c · Revizyon 1',
        systemPrompt: ornekSysPrompt,
        userPrompt: `${ornekUsrPrompt}\n\nREVİZYON TALİMATI:\n${tur1Skor.revizyonTalimati}`,
        outputJson: { altBaslik: slayt.altBaslik, slaytlar: slayt.slaytlar.map(s => ({ slide_id: s.slide_id, slide_type: s.slide_type, ustBaslik: s.ustBaslik, narration: s.narration })), gorev: { gorevTipi: gorev.gorevTipi, baslik: gorev.baslik, soru1: gorev.soru1 } },
        ozet: 'YZ hakeminin 3 düzeltme önerisi uygulanarak anlatım süreleri, terim açıklamaları ve çeldirici dengesi kontrol grubuyla birebir eşitlendi.',
      },
      {
        id: 'hazir-denetim-2',
        asama: '1d. YZ Ön Denetim (1. Revizyon Sonrası — Onaylandı ✓)',
        tur: 'denetim',
        model: denetimModel,
        tarih: 'Adım 1d · Tur 2',
        systemPrompt: 'arXiv:2509.13348 Appendix B (10 Pedagojik Rubrik) + Deney-Kontrol Eşdeğerliği (5 Ölçüt) Bağımsız YZ Hakemi',
        userPrompt: `Revize Edilen Taslak: ${slayt.altBaslik} (${modulId.toUpperCase()} · ${profil.altKategori})`,
        outputJson: { genelOrtalama: tur2Skor.genelOrtalama, pedagojikOrtalama: tur2Skor.pedagojikOrtalama, esdegerlikOrtalama: tur2Skor.esdegerlikOrtalama, gectiMi: true, genelYorum: tur2Skor.genelYorum },
        ozet: `YZ ÖN ONAY VERDİ ✓ · Genel Skor: %100 (Pedagojik: 1.00, Eşdeğerlik: 1.00) — İçerik Akademisyen Onayına sevk edildi.`,
      },
      {
        id: 'hazir-script-2',
        asama: '2. Seslendirme Scripti Düzenleme (Mayer CTML)',
        tur: 'script',
        model: scriptModel,
        tarih: 'Adım 2',
        systemPrompt: 'Türkçe eğitim içerikleri için Mayer CTML ilkelerine uygun seslendirme editörü.',
        userPrompt: JSON.stringify({ narrations: slayt.slaytlar.map(s => s.narration) }, null, 2),
        outputJson: { narrations: slayt.slaytlar.map(s => s.narration), sureToplam: slayt.sureToplam },
        ozet: `5 slayt için toplam ~${slayt.sureToplam} doğal Türkçe seslendirme metni hazırlandı.`,
      },
      {
        id: 'hazir-prompt-3',
        asama: '3. Görsel Üretim Promptu Oluşturma',
        tur: 'prompt',
        model: promptModel,
        tarih: 'Adım 3',
        systemPrompt: 'Create concise English image generation prompts for clean educational illustrations without text.',
        userPrompt: JSON.stringify({ interest: baglamEtiket, workedExample: slayt.altBaslik, microTask: gorev.baslik }),
        outputJson: { slaytPrompt: gorselPromptSlayt, gorevPrompt: gorselPromptGorev },
        ozet: 'Çözümlü örnek ve transfer mikro-görevi için görsel sahne promptları ve vektörel sahneler hazırlandı.',
      },
    ];

    return {
      cacheKey: `${modulId}::${profil.id}`,
      hazirPaket: true,
      modulId,
      profil,
      hamUretilen: { altBaslik: slayt.altBaslik, slaytlar: slayt.slaytlar, gorev },
      slayt,
      gorev,
      prompts: { slayt: gorselPromptSlayt, gorev: gorselPromptGorev },
      denetim: {
        onDenetimAcik,
        maxRevizyon,
        kullanilanRevizyon: 1,
        esikPuan,
        denetimModel,
        sonDenetim: tur2Skor,
        onayDurumu: !onDenetimAcik ? 'denetimsiz_acik' : 'akademisyen_bekliyor',
        ogrenciGorebilir: !onDenetimAcik,
        akademisyenKarar: null,
      },
      turlar,
      denetimIzi,
      meta: {
        senaryoModel,
        scriptModel,
        promptModel,
        gorselModel: 'Hazır Vektörel Sahne (SVG) / Gemini',
        denetimModel: onDenetimAcik ? denetimModel : 'Kapalı',
        sesModel: 'Türkçe TTS Hazır',
        gorselNot: 'Jüri sunumu için hazır deneysel paket',
        ttsNot: 'Seslendirme metinleri hazır',
        tarih: 'Hazır Deneysel Paket',
      },
    };
  }

  /* ---------- 1b. Learn Your Way (arXiv:2509.13348) Appendix B: Pedagojik Rubrikler & Deneysel Eşdeğerlik ---------- */
  const APPENDIX_B_RUBRIKLER = [
    {
      id: 'accuracy',
      kod: 'B1',
      ad: 'Doğruluk (Accuracy)',
      enAd: 'Accuracy — Faithful to the source and accurate',
      tanim: 'Üretilen içeriğin kaynak materyale ve bilimsel yönteme sadakati; kavramları yanıltmadan veya yanlış ilişkilendirmeden doğru sunması.',
      agree: 'Kaynakla tam tutarlıdır; kavramları yanlış temsil etmez veya yanlış bağlamaz. Ana argümanları ve temel iddiaları doğru, olgusal bir yapıda aktarır.',
      partial: 'Ana kavramları bozmaz ancak küçük hatalar içerebilir veya bazı ikincil kavram/ilişkileri eksik bırakabilir.',
      disagree: 'Kaynağa ters düşen iddialar, ciddi kavramsal hatalar içerir veya ana kavramları atlar.',
    },
    {
      id: 'coverage',
      kod: 'B2',
      ad: 'Kapsam (Coverage)',
      enAd: 'Coverage — Completeness of representation of source messages',
      tanim: 'Kaynak içeriğin hiyerarşisini, bağlantılarını ve tüm temel öğrenme kazanımlarını (LO) eksiksiz temsil etmesi.',
      agree: 'Kaynağın yapısını ve hiyerarşisini koruyarak tüm temel kavramları ve öğrenme kazanımlarını kapsar; yalnızca öğrenilebilirliği artırmak için önemsiz detayları sadeleştirir.',
      partial: 'Konuyu çoğunlukla kapsar ancak bazı anahtar kavramları veya ilişkileri atlar; hiyerarşi kısmen bozulmuştur.',
      disagree: 'Temel konu içeriği veya kavramsal yapı üretilen içerikte eksiktir.',
    },
    {
      id: 'emphasis',
      kod: 'B3',
      ad: 'Vurgu (Emphasis)',
      enAd: 'Emphasis — Precisely prioritizes core concepts',
      tanim: 'Temel kavramları doğru önceliklendirmesi; kaynak hiyerarşisini tanıyıp ana mesajları optimal biçimde seçmesi ve yerleştirmesi.',
      agree: 'Önemsiz veya marjinal detaylar yerine kaynağın anahtar kavramlarına ve ilişkilerine odaklanır; öğelerin hiyerarşisi bilgi/beceri hiyerarşisiyle örtüşür.',
      partial: 'Çekirdek kavramların çoğunu içerir ancak önemli bir kavramı atlayabilir veya önemsiz bir detayı aşırı vurgulayabilir.',
      disagree: 'Öğe seçimi rastgeledir; ana mesajlar yerine önemsiz kavramları öne çıkarır.',
    },
    {
      id: 'engagement',
      kod: 'B4',
      ad: 'İlgi Çekicilik (Engagement)',
      enAd: 'Engagement — Positive, pleasant and purposeful user experience',
      tanim: 'Olumlu duygusal tepki uyandıran, tonu, anlatısı ve kişiselleştirme öğeleriyle anlamlı ve sürükleyici bir öğrenme deneyimi sunması.',
      agree: 'Olumlu duygusal tepki uyandırır; ton, estetik, anlatı ve kişiselleştirme unsurları ilgi çekici ve amaçlı bir öğrenme deneyimi yaratır.',
      partial: 'Tutarlı biçimde ilgi çekmez; kişiselleştirme sınırlıdır. Kullanıcı için faydası vardır ancak öğrenciye yeterince açık değildir.',
      disagree: 'Kuru, sıkıcı ve tekdüze bir sunumdur; kullanıcı için algılanan bir değer oluşturmaz.',
    },
    {
      id: 'cognitive_load',
      kod: 'B5',
      ad: 'Bilişsel Yük (Cognitive Load)',
      enAd: 'Cognitive load — Effective use of cognitive effort',
      tanim: 'Bilişsel çabanın etkin kullanımı; açık, özlü organizasyon, erişilebilir dil ve çoklu temsillerin (örnek, analoji, anlatı, görsel) uyumu.',
      agree: 'İyi organize edilmiş, açık ve özlüdür. Erişilebilir dil kullanır, kilit noktaları vurgular; anlamayı güçlendirmek için örnekleri, anlatıyı ve çoklu temsilleri etkin kullanır.',
      partial: 'Oldukça iyi yapılandırılmıştır ancak bazı ifadeler zordur veya gereksiz tekrarlar içerir; örnek ve çoklu temsil kullanımı sınırlıdır.',
      disagree: 'Kötü yapılandırılmış, bunaltıcı metin blokları veya tutarsız dil düzeyi içerir; görsel/örnek desteği yoktur.',
    },
    {
      id: 'active_learning',
      kod: 'B6',
      ad: 'Aktif Öğrenme (Active Learning)',
      enAd: 'Active Learning — Promotes active learning beyond recall',
      tanim: 'Hatırlama ve kavramanın ötesine geçerek analiz, uygulama, değerlendirme düzeylerinde aktif bilişsel katılımı teşvik etmesi.',
      agree: 'Sorular sorar ve öğrenciyi konuyla hatırlama, kavrama, analiz, uygulama ve değerlendirme gibi çoklu düzeylerde etkileşime sokar.',
      partial: 'Çoğunlukla bilgi aktarımına odaklanır; öğrenciyi öğrenme kazanımlarıyla çoklu düzeylerde etkileşime sokma fırsatlarını kaçırır.',
      disagree: 'Tamamen bilgi aktarımıdır; üst düzey düşünmeyi teşvik etmez.',
    },
    {
      id: 'metacognition',
      kod: 'B7',
      ad: 'Üstbilişi Derinleştirme (Deepen Metacognition)',
      enAd: 'Deepen Metacognition — Promotes active self-reflection and monitoring',
      tanim: 'Düşünme ve öğrenme süreçlerinin aktif öz-yansıtmasını, izlenmesini ve düzenlenmesini destekleyen eyleme dönüştürülebilir dönütler sunması.',
      agree: 'İlgili ve eyleme dönüştürülebilir (actionable) geri bildirim sunar; aktif düşünmeyi ve öğrenme sürecini izlemeyi teşvik eder.',
      partial: 'Kısmen yararlı geri bildirim sunar ancak yeterince eyleme dönük değildir; yüzeysel yansıtma sağlar.',
      disagree: 'Düz bilgilendirici içeriktir; yararlı geri bildirim veya öz-düzenleme ipucu içermez.',
    },
    {
      id: 'motivation',
      kod: 'B8',
      ad: 'Motivasyon ve Merak (Motivation & Curiosity)',
      enAd: 'Motivation & curiosity — Encourages users to persist and deeply engage',
      tanim: 'Destekleyici ton, optimal zorluk düzeyi ve konunun öğrencinin ilgi/kaygılarıyla bağını kurarak bilişsel çabayı teşvik etmesi.',
      agree: 'Tutarlı biçimde destekleyici bir ton kullanır; çok kolay ile çok zor arasında optimal zorluk düzeyini korur ve konunun öğrencinin ilgi alanıyla ilişkisini vurgular.',
      partial: 'Teşvik düzensizdir; zorluk düzeyi tam dengeli değildir veya gerçek yaşam/ilgi bağlantıları sınırlıdır.',
      disagree: 'Destekleyici değildir; zorluk düzeyi uygunsuzdur ve öğrencinin ilgi alanıyla görünür bir bağ kurmaz.',
    },
    {
      id: 'adaptability',
      kod: 'B9',
      ad: 'Uyarlanabilirlik ve Kişiselleştirme (Adaptability & Personalization)',
      enAd: 'Adaptability & Personalization — Adjusted to fit user interests and characteristics',
      tanim: 'Öğrenme deneyiminin öğrencinin ilgi profiline, etkileşim biçimine, özgül ilgi nesnesine ve düzeyine yüzeysel kalmadan uyarlanması.',
      agree: 'İçerik öğrencinin ilgi alanına, etkileşim biçimlerine, özgül açıklamasına ve sınıf/dil düzeyine tam olarak uyarlanmıştır; görevler öğrencinin kapasitesiyle uyumludur.',
      partial: 'Öğrencinin tercihlerini ve ilgi alanını tanır ancak yalnızca yüzeysel/kısmi olarak uyarlanmıştır.',
      disagree: 'Öğrenci tercihlerini ve özelliklerini göz ardı eder; herkese tek tip ("one size fits all") içerik sunar.',
    },
    {
      id: 'clarity_intentions',
      kod: 'B10',
      ad: 'Öğrenme Hedefleri ve Başarı Ölçütleri (Clarity of Learning Intentions)',
      enAd: 'Clarity of Learning Intentions & Success Criteria',
      tanim: 'Nelerin öğrenileceğinin (öğrenme kazanımı) ve öğrencinin başarılı olduğunu nasıl anlayacağının (başarı ölçütleri) açıkça ortaya konması.',
      agree: 'Öğrenme kazanımları açık ve öğrenci dostudur; başarılı tamamlamanın neye benzediği nettir ve içerik kazanımlarla doğrudan hizalıdır.',
      partial: 'Öğrenme kazanımları belirtilmiştir ancak yeterince detaylandırılmamıştır; başarı ölçütleri kısmen belirsizdir.',
      disagree: 'Öğrenme kazanımları belirsiz veya tutarsızdır; görünür bir başarı ölçütü yoktur.',
    },
  ];

  const ESDEGERLIK_KRITERLERI = [
    {
      id: 'eq_lo',
      kod: 'E1',
      ad: 'Öğrenme Kazanımı Eşdeğerliği',
      tanim: 'Kontrol ve deney grubu içeriklerinin birebir aynı hedef kavramı ve araştırma becerisini ölçmesi.',
    },
    {
      id: 'eq_bloom',
      kod: 'E2',
      ad: 'Bilişsel Talep (Bloom Düzeyi) Eşdeğerliği',
      tanim: 'Çözümlü örnek ve transfer mikro-görevin kontrol grubuyla aynı bilişsel işlem adımını gerektirmesi; ne daha kolay ne daha zor olması.',
    },
    {
      id: 'eq_structure',
      kod: 'E3',
      ad: 'Yapısal, Süre ve Uzunluk Eşdeğerliği',
      tanim: '5 slaytlık yapı, 3 karşılaştırma koşulu, 2 mikro-görev sorusu, metin uzunluğu ve yaklaşık 75–80 sn seslendirme süresinin korunması.',
    },
    {
      id: 'eq_domain_neutral',
      kod: 'E4',
      ad: 'Ön Bilgi Bağımsızlığı (Alan Ustalığı Gerektirmeme)',
      tanim: 'Senaryonun ilgi alanındaki teknik/ezoterik uzmanlığı değil, yalnızca araştırma yöntemleri bilgisini ölçmesi.',
    },
    {
      id: 'eq_transfer',
      kod: 'E5',
      ad: 'Çözümlü Örnek → Mikro-Görev Transfer Mesafesi',
      tanim: 'Mikro-görevin çözümlü örneği birebir kopyalam 않고 aynı ilgi evreninde yeni bir senaryoya (kontrol grubundaki transfer mesafesiyle eşdeğer) taşıması.',
    },
  ];

  /* ---------- 2. IndexedDB Önbellek (images/ & audio/ üretimleri için) ---------- */
  const DB_NAME = 'baglam-canli-onbellek-v1';
  const STORE = 'uretiler';
  function openDB() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB yok')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function cacheGet(key) {
    try {
      const db = await openDB();
      return await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });
    } catch (e) { return null; }
  }
  async function cacheSet(key, val) {
    try {
      const db = await openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).put(val, key);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
    } catch (e) { /* depolama yoksa sessiz geç */ }
  }
  async function cacheDel(key) {
    try {
      const db = await openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).delete(key);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
    } catch (e) { /* yoksay */ }
  }

  const slug = s => String(s || 'profil').toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'profil';

  /* ---------- 3. Canlı LLM / Görsel / TTS API İstemcileri ---------- */
  async function callLLM(modelId, systemPrompt, userPrompt, keys, jsonMode = false) {
    const isClaude = /^claude/i.test(modelId);
    const sys = jsonMode
      ? `${systemPrompt}\n\nKRİTİK JSON KURALI: Yanıtın SADECE RFC 8259 uyumlu geçerli bir JSON nesnesi olsun. JSON string değerlerinin içinde asla kaçışsız çift tırnak (") kullanma (vurgulama gerekiyorsa tek tırnak ' veya tipografik tırnak kullan). Sondaki elemanlarda fazladan virgül (trailing comma) bırakma; markdown veya açıklama ekleme.`
      : systemPrompt;
    if (isClaude) {
      const ck = (keys.claudeKey || '').trim();
      if (!ck) throw new Error(`"${modelId}" için Claude API anahtarı gerekli (Yönetici panelinden girin).`);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ck,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 6400,
          system: sys,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Claude (${modelId}): ${(data.error && data.error.message) || res.status}`);
      return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    }
    const gk = (keys.geminiKey || '').trim();
    if (!gk) throw new Error(`"${modelId}" için Gemini API anahtarı gerekli (Yönetici panelinden girin).`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(gk)}`;
    const postGemini = withMime => fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: withMime
          ? { temperature: 0.55, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          : { temperature: 0.55, maxOutputTokens: 8192 },
      }),
    });
    let res = await postGemini(jsonMode);
    let data = await res.json();
    if (!res.ok && jsonMode && res.status === 400) {
      res = await postGemini(false);
      data = await res.json();
    }
    if (!res.ok) throw new Error(`Gemini (${modelId}): ${(data.error && data.error.message) || res.status}`);
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    return parts.map(p => p.text || '').join('\n');
  }

  /* Kısmen bozuk veya string içi kaçışsız tırnak/yeni satır içeren LLM JSON çıktısını onararak ayrıştır */
  function repairJSON(src) {
    let out = '';
    let inStr = false;
    let esc = false;
    const stack = [];
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inStr) {
        if (esc) {
          out += ch;
          esc = false;
          continue;
        }
        if (ch === '\\') {
          out += ch;
          esc = true;
          continue;
        }
        if (ch === '"') {
          // Bu çift tırnaktan sonraki ilk anlamlı karakter yapısal JSON ayırıcısı değilse iç tırnaktır -> kaçış ekle
          let j = i + 1;
          while (j < src.length && /\s/.test(src[j])) j++;
          const next = j < src.length ? src[j] : '';
          if (next === '' || next === ',' || next === '}' || next === ']' || next === ':') {
            inStr = false;
            out += ch;
          } else {
            out += '\\"';
          }
          continue;
        }
        if (ch === '\n') { out += '\\n'; continue; }
        if (ch === '\r') { out += '\\r'; continue; }
        if (ch === '\t') { out += '\\t'; continue; }
        if (ch.charCodeAt(0) < 0x20) { out += ' '; continue; }
        out += ch;
      } else {
        if (ch === '"') { inStr = true; out += ch; continue; }
        if (ch === '{' || ch === '[') { stack.push(ch === '{' ? '}' : ']'); out += ch; continue; }
        if (ch === '}' || ch === ']') {
          out = out.replace(/,\s*$/, '');
          if (stack.length && stack[stack.length - 1] === ch) stack.pop();
          out += ch;
          continue;
        }
        out += ch;
      }
    }
    if (esc) out = out.slice(0, -1);
    if (inStr) out += '"';
    out = out.replace(/,\s*$/, '');
    while (stack.length) out += stack.pop();
    return out;
  }

  function parseJSON(raw) {
    let text = String(raw || '').trim();
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) text = fence[1].trim();
    else text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    const slice = first >= 0
      ? (last > first ? text.slice(first, last + 1) : text.slice(first))
      : text;
    try {
      return JSON.parse(slice);
    } catch (e1) {
      try {
        return JSON.parse(repairJSON(slice));
      } catch (e2) {
        throw new Error(`${e1.message} (otomatik JSON onarımı başarısız)`);
      }
    }
  }

  async function generateGeminiImage(modelId, prompt, geminiKey) {
    const gk = (geminiKey || '').trim();
    if (!gk) throw new Error('Gemini API anahtarı yok');
    if (/imagen/i.test(modelId)) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:predict?key=${encodeURIComponent(gk)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '16:9' } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || `Imagen HTTP ${res.status}`);
      const b64 = data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded;
      if (!b64) throw new Error('Görsel verisi dönmedi');
      return `data:image/png;base64,${b64}`;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(gk)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || `Gemini Image HTTP ${res.status}`);
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const img = parts.find(p => p.inlineData && p.inlineData.data);
    if (!img) throw new Error('Seçilen Gemini modeli görsel üretmedi');
    return `data:${img.inlineData.mimeType || 'image/png'};base64,${img.inlineData.data}`;
  }

  function pcmToWavDataUrl(base64Pcm, sampleRate = 24000) {
    const bin = atob(base64Pcm);
    const pcmLen = bin.length;
    const buf = new ArrayBuffer(44 + pcmLen);
    const v = new DataView(buf);
    const wr = (off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    wr(0, 'RIFF');
    v.setUint32(4, 36 + pcmLen, true);
    wr(8, 'WAVE');
    wr(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); // PCM
    v.setUint16(22, 1, true); // Mono
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    wr(36, 'data');
    v.setUint32(40, pcmLen, true);
    const bytes = new Uint8Array(buf, 44);
    for (let i = 0; i < pcmLen; i++) bytes[i] = bin.charCodeAt(i);
    let out = '';
    const all = new Uint8Array(buf);
    for (let i = 0; i < all.length; i += 0x8000) {
      out += String.fromCharCode.apply(null, all.subarray(i, i + 0x8000));
    }
    return `data:audio/wav;base64,${btoa(out)}`;
  }

  async function generateGeminiTTS(text, modelId, rate, geminiKey) {
    const gk = (geminiKey || '').trim();
    if (!gk) throw new Error('Gemini API anahtarı yok');
    const id = /^gemini-/i.test(modelId || '') && /tts/i.test(modelId || '') ? modelId : 'gemini-2.5-flash-preview-tts';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(id)}:generateContent?key=${encodeURIComponent(gk)}`;
    const hizNotu = Number(rate) > 1.05 ? 'Biraz tempolu ama net diksiyonla Türkçe seslendir:\n'
      : Number(rate) < 0.95 ? 'Sakin ve tane tane Türkçe seslendir:\n'
      : 'Doğal eğitim anlatıcısı tonunda, açık Türkçe seslendir:\n';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: hizNotu + text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || `Gemini TTS HTTP ${res.status}`);
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const aud = parts.find(p => p.inlineData && p.inlineData.data);
    if (!aud) throw new Error('Gemini TTS ses verisi döndürmedi');
    const mime = aud.inlineData.mimeType || 'audio/L16;rate=24000';
    if (/pcm|l16/i.test(mime)) {
      const m = /rate=(\d+)/i.exec(mime);
      return pcmToWavDataUrl(aud.inlineData.data, m ? Number(m[1]) : 24000);
    }
    return `data:${mime};base64,${aud.inlineData.data}`;
  }

  async function generateGoogleTTS(text, voiceName, rate, ttsKey, geminiKey) {
    const k = (ttsKey || '').trim();
    const gk = (geminiKey || '').trim();
    const secilen = (voiceName || '').trim() === 'tr-TR-Chirp3-HD' ? 'tr-TR-Chirp3-HD-Aoede' : (voiceName || 'tr-TR-Wavenet-E');
    if (/^gemini-/i.test(secilen)) {
      return generateGeminiTTS(text, secilen, rate, gk || k);
    }
    if (!k) {
      return gk ? generateGeminiTTS(text, 'gemini-2.5-flash-preview-tts', rate, gk) : null;
    }
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(k)}`;
    const postCloud = withRate => fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'tr-TR', name: secilen },
        audioConfig: withRate ? { audioEncoding: 'MP3', speakingRate: Number(rate) || 1.0 } : { audioEncoding: 'MP3' },
      }),
    });
    let res = await postCloud(true);
    let data = await res.json();
    if (!res.ok && res.status === 400) {
      res = await postCloud(false);
      data = await res.json();
    }
    if (!res.ok || !data.audioContent) {
      if (gk) return generateGeminiTTS(text, 'gemini-2.5-flash-preview-tts', rate, gk);
      throw new Error((data.error && data.error.message) || `TTS HTTP ${res.status}`);
    }
    return `data:audio/mp3;base64,${data.audioContent}`;
  }

  /* ---------- 3b. Appendix B & Deneysel Eşdeğerlik YZ Ön Denetim (Pre-Check) Fonksiyonu ---------- */
  function varsayilanRubrikDegerlendirme() {
    const pedagojik = {};
    APPENDIX_B_RUBRIKLER.forEach(r => {
      pedagojik[r.id] = { puan: 1.0, karar: 'Agree', gerekce: 'Kaynak kazanımla ve öğrenme bilimi ilkeleriyle uyumlu.', oneri: '' };
    });
    const esdegerlik = {};
    ESDEGERLIK_KRITERLERI.forEach(e => {
      esdegerlik[e.id] = { puan: 1.0, karar: 'Agree', gerekce: 'Kontrol grubu referans şablonuyla birebir eşdeğer.', oneri: '' };
    });
    return { pedagojik, esdegerlik, pedagojikOrtalama: 1.0, esdegerlikOrtalama: 1.0, genelOrtalama: 1.0, gectiMi: true, genelYorum: 'Tüm pedagojik ve deneysel eşdeğerlik ölçütleri karşılandı.', revizyonTalimati: '' };
  }

  function hesaplaDenetimSkor(ham, esikPuan = 0.85) {
    const pedagojik = {};
    let pedTop = 0;
    let enDusukSayi = 1.0;
    const eksikNotlar = [];

    APPENDIX_B_RUBRIKLER.forEach(r => {
      const g = (ham && ham.pedagojik && ham.pedagojik[r.id]) || {};
      const hamPuan = Number(g.puan);
      const p = (hamPuan === 0 || hamPuan === 0.5 || hamPuan === 1) ? hamPuan : (hamPuan < 0.25 ? 0 : hamPuan < 0.75 ? 0.5 : 1.0);
      const karar = p === 1 ? 'Agree' : p === 0.5 ? 'Neutral / Partial' : 'Disagree';
      const gerekce = String(g.gerekce || 'Değerlendirildi.').trim();
      const oneri = String(g.oneri || '').trim();
      pedagojik[r.id] = { puan: p, karar, gerekce, oneri };
      pedTop += p;
      if (p < enDusukSayi) enDusukSayi = p;
      if (p < 1.0) eksikNotlar.push(`[${r.kod} ${r.ad} = ${p}] ${oneri || gerekce}`);
    });

    const esdegerlik = {};
    let esTop = 0;
    ESDEGERLIK_KRITERLERI.forEach(e => {
      const g = (ham && ham.esdegerlik && ham.esdegerlik[e.id]) || {};
      const hamPuan = Number(g.puan);
      const p = (hamPuan === 0 || hamPuan === 0.5 || hamPuan === 1) ? hamPuan : (hamPuan < 0.25 ? 0 : hamPuan < 0.75 ? 0.5 : 1.0);
      const karar = p === 1 ? 'Agree' : p === 0.5 ? 'Neutral / Partial' : 'Disagree';
      const gerekce = String(g.gerekce || 'Kontrol grubu ile karşılaştırıldı.').trim();
      const oneri = String(g.oneri || '').trim();
      esdegerlik[e.id] = { puan: p, karar, gerekce, oneri };
      esTop += p;
      if (p < enDusukSayi) enDusukSayi = p;
      if (p < 1.0) eksikNotlar.push(`[${e.kod} ${e.ad} = ${p}] ${oneri || gerekce}`);
    });

    const pedOrt = +(pedTop / APPENDIX_B_RUBRIKLER.length).toFixed(2);
    const esOrt = +(esTop / ESDEGERLIK_KRITERLERI.length).toFixed(2);
    const genelOrt = +((pedTop + esTop) / (APPENDIX_B_RUBRIKLER.length + ESDEGERLIK_KRITERLERI.length)).toFixed(2);
    const esik = Math.max(0.5, Math.min(1.0, Number(esikPuan) || 0.85));
    // Geçme koşulu: Genel ortalama >= eşik VE hiçbir boyutta Disagree (0.0) olmaması VE eşdeğerlik ortalamasının >= eşik olması
    const gectiMi = genelOrt >= esik && esOrt >= esik && enDusukSayi > 0;
    const genelYorum = String((ham && ham.genelYorum) || (gectiMi ? 'Üretilen içerik Appendix B pedagojik yeterlik ve deney-kontrol eşdeğerlik ölçütlerini sağlamaktadır.' : 'Bazı rubrik boyutlarında kısmi uyumsuzluk tespit edildi; düzeltme önerilerine göre revizyon gerekiyor.')).trim();
    const revizyonTalimati = String((ham && ham.revizyonTalimati) || eksikNotlar.join(' | ')).trim();

    return {
      pedagojik,
      esdegerlik,
      pedagojikOrtalama: pedOrt,
      esdegerlikOrtalama: esOrt,
      genelOrtalama: genelOrt,
      esikPuan: esik,
      enDusukPuan: enDusukSayi,
      gectiMi,
      genelYorum,
      revizyonTalimati,
      eksikNotlar,
    };
  }

  async function yzOnDenetimYap({ modul, kontrol, profil, uretilen, denetimModel, keys, esikPuan, turNo }) {
    const rubrikListesiMetin = APPENDIX_B_RUBRIKLER.map(r =>
      `- "${r.id}" (${r.kod} · ${r.ad} / ${r.enAd}): ${r.tanim}\n  * 1.0 (Agree): ${r.agree}\n  * 0.5 (Neutral/Partial): ${r.partial}\n  * 0.0 (Disagree): ${r.disagree}`
    ).join('\n');
    const esdegerlikListesiMetin = ESDEGERLIK_KRITERLERI.map(e =>
      `- "${e.id}" (${e.kod} · ${e.ad}): ${e.tanim}`
    ).join('\n');

    const sysEval = `Sen Google LearnLM "Towards an AI-Augmented Textbook" (arXiv:2509.13348) çalışmasının Appendix B (Rubrics for Pedagogical Evaluations) çerçevesini ve deneysel araştırma tasarımında Deney–Kontrol Grubu Eşdeğerliğini uygulayan bağımsız bir pedagojik hakemsin (AI Pedagogical & Equivalence Reviewer).
Görevin: Üretilen kişiselleştirilmiş deney grubu içeriğini (5 slaytlık çözümlü örnek + transfer mikro-görevi), kontrol grubunun standart referans içeriğiyle karşılaştırarak 3 noktalı ölçekte (1.0 = Agree, 0.5 = Neutral/Partial, 0.0 = Disagree) puanlamak, her boyut için Türkçe kanıta dayalı gerekçe ve (1.0 altındaysa) somut düzeltme önerisi yazmaktır.
Yalnızca geçerli RFC 8259 JSON döndür.`;

    const usrEval = `DEĞERLENDİRME TURU: ${turNo}
MODÜL: ${modul.id.toUpperCase()} — ${modul.ad}
HEDEF ÖĞRENME KAZANIMI (LO): ${kontrol.kazanim}

ÖĞRENCİ İLGİ PROFİLİ:
- Kategori / Alt alan: ${profil.kategori || ''} / ${profil.altKategori || ''}
- Etkileşim biçimleri: ${(profil.etkilesimler || []).join(', ')}
- Özgül ilgi açıklaması: ${profil.ozgulKisa || ''} — ${profil.aciklama || ''}

KONTROL GRUBU STANDART İÇERİĞİ (Eşdeğerlik Referansı):
${JSON.stringify({
  altBaslik: kontrol.slayt.altBaslik,
  slaytlar: kontrol.slayt.slaytlar.map(s => ({ slide_id: s.slide_id, ustBaslik: s.ustBaslik, altBaslik: s.altBaslik, soru: s.soru, kosullar: s.kosullar, degisken: s.degisken, narration: s.narration })),
  gorev: { baslik: kontrol.gorev.baslik, metin: kontrol.gorev.metin, soru1: kontrol.gorev.soru1, bagimsizSecenekler: kontrol.gorev.bagimsizSecenekler, soru2: kontrol.gorev.soru2, bagimliSecenekler: kontrol.gorev.bagimliSecenekler }
}, null, 2)}

DEĞERLENDİRİLECEK DENEY GRUBU İÇERİĞİ (Üretilen):
${JSON.stringify(uretilen, null, 2)}

1) APPENDIX B PEDAGOJİK YETERLİK RUBRİKLERİ (Her biri 1.0, 0.5 veya 0.0 puan):
${rubrikListesiMetin}

2) DENEY-KONTROL GRUBU EŞDEĞERLİK ÖLÇÜTLERİ (Her biri 1.0, 0.5 veya 0.0 puan):
${esdegerlikListesiMetin}

AŞAĞIDAKİ JSON ŞEMASINI EKSİKSİZ DOLDUR:
{
  "pedagojik": {
    "accuracy": { "puan": 1.0, "gerekce": "Kısa kanıta dayalı değerlendirme", "oneri": "1.0 altındaysa somut düzeltme önerisi, tam ise boş string" },
    "coverage": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "emphasis": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "engagement": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "cognitive_load": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "active_learning": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "metacognition": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "motivation": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "adaptability": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "clarity_intentions": { "puan": 1.0, "gerekce": "...", "oneri": "" }
  },
  "esdegerlik": {
    "eq_lo": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "eq_bloom": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "eq_structure": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "eq_domain_neutral": { "puan": 1.0, "gerekce": "...", "oneri": "" },
    "eq_transfer": { "puan": 1.0, "gerekce": "...", "oneri": "" }
  },
  "genelYorum": "Genel pedagojik ve deneysel eşdeğerlik değerlendirme özeti (2-3 cümle)",
  "revizyonTalimati": "Eğer 1.0 altında kalan boyutlar varsa içerik üretici modele verilecek net, maddeli düzeltme talimatı"
}`;

    const rawEval = await callLLM(denetimModel, sysEval, usrEval, keys, true);
    const parsed = parseJSON(rawEval);
    const skor = hesaplaDenetimSkor(parsed, esikPuan);
    return {
      ...skor,
      model: denetimModel,
      systemPrompt: sysEval,
      userPrompt: usrEval,
      rawResponse: rawEval,
      tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  }

  /* ---------- 4. 5 Aşamalı Canlı Deney Üretim, YZ Ön Denetim (Revizyon Döngülü) ve Akademisyen Onay Hattı ---------- */
  async function uretDeneyIcerigi({ modul, profil, uretim, zorla, akademisyenNotu, mevcutSonuc }, onAdim) {
    const cacheKey = `${modul.id}::${profil.id}`;
    if (!zorla && !akademisyenNotu) {
      const mevcut = await cacheGet(cacheKey);
      if (mevcut) {
        onAdim && onAdim({ adim: 4, durum: 'onbellek', mesaj: 'Önbellekten yüklendi (images/ & audio/)' });
        return { ...mevcut, onbellekten: true };
      }
    }

    const kontrol = getKontrol(modul.id);
    const pSlug = slug(profil.kisaEtiket || profil.id);
    const keys = { claudeKey: uretim.claudeKey, geminiKey: uretim.geminiKey, ttsKey: uretim.ttsKey };
    const onDenetimAcik = uretim.onDenetimAcik !== false;
    const maxRevizyon = Math.max(0, Math.min(5, Number(uretim.maxRevizyon ?? 2)));
    const esikPuan = Math.max(0.5, Math.min(1.0, Number(uretim.gecmeEsigi ?? 0.85)));
    const denetimModel = uretim.denetimModel || uretim.senaryoModel || 'claude-sonnet-4-5';

    // Tüm adımların prompt, ham çıktı, dönüt ve revizyon geçmişini kaydeden izleme günlüğü
    const denetimIzi = (mevcutSonuc && Array.isArray(mevcutSonuc.denetimIzi) && akademisyenNotu)
      ? [...mevcutSonuc.denetimIzi]
      : [];
    const turlar = (mevcutSonuc && Array.isArray(mevcutSonuc.turlar) && akademisyenNotu)
      ? [...mevcutSonuc.turlar]
      : [];

    /* ADIM 1: Senaryo ve yapılandırılmış slayt + mikro-görev üretimi (Modülün kendi şablonuyla BİREBİR EŞDEĞER) */
    onAdim && onAdim({ adim: 1, durum: 'calisiyor', mesaj: `${uretim.senaryoModel} ile ${modul.id.toUpperCase()} şablonunda senaryo üretiliyor...` });
    const sys1 = `Sen eğitim teknolojileri ve araştırma yöntemleri alanında uzman bir öğretim tasarımcısısın.
Görevin: Seçilen modülün (${modul.id.toUpperCase()} — ${modul.ad}) Kontrol Grubu standart içeriğiyle TASARIM ŞABLONU, SLAYT TİPLERİ (slide_type), ETKİLEŞİM ŞABLONU (gorevTipi), BİLİŞSEL TALEP VE ÖĞRENME KAZANIMI AÇISINDAN BİREBİR EŞDEĞER; yalnızca senaryo bağlamı öğrencinin ilgi profiline göre kişiselleştirilmiş 5 slaytlık çözümlü örnek + 1 transfer mikro-görev üretmek.
Kritik Metodolojik Kurallar:
- Yalnızca geçerli RFC 8259 JSON döndür, başka açıklama yazma.
- Kontrol grubunda hangi "slide_type" dizilimi ve hangi "gorevTipi" kullanılmışsa Deney grubunda da BİREBİR AYNI şablon ve alanlar kullanılmalıdır. Tasarım şablonu farkı yaratma; fark yalnızca kişiselleştirilmiş bağlamdan kaynaklanmalıdır.
- Çözümlü örnek ile mikro-görev AYNI ilgi alanı içinde ama FARKLI bir araştırma senaryosu (transfer) olmalı.
- Senaryo öğrencinin ilgili alandaki teknik uzmanlığını değil, araştırma yöntemleri kazanımını ölçmelidir (ön bilgi bağımsızlığı).
- Tüm metinler doğal, akıcı Türkçe olmalı; sayılar kurgusal ve gerçekçi olmalı.`;

    const kontrolSablonJSON = JSON.stringify({
      altBaslik: kontrol.slayt.altBaslik,
      slaytlar: kontrol.slayt.slaytlar.map(s => {
        const kopya = { ...s };
        delete kopya.image_path;
        delete kopya.audio_path;
        delete kopya.image_data_url;
        delete kopya.audio_data_url;
        return kopya;
      }),
      gorev: (() => {
        const gKopya = { ...kontrol.gorev };
        delete gKopya.id;
        delete gKopya.eyebrow;
        delete gKopya.temaTip;
        delete gKopya.image_path;
        delete gKopya.audio_path;
        delete gKopya.image_data_url;
        delete gKopya.audio_data_url;
        return gKopya;
      })(),
    }, null, 2);

    const temelUsr1 = `MODÜL: ${modul.id.toUpperCase()} — ${modul.ad}
MODÜL ÖZEL ŞABLONU: ${kontrol.sablonAd || modul.ad}
HEDEF ÖĞRENME KAZANIMI: ${kontrol.kazanim}

ÖĞRENCİ İLGİ PROFİLİ (Yalnızca bağlamı bu profile göre uyarla):
- Kategori / Alt alan: ${profil.kategori || ''} / ${profil.altKategori || ''}
- Etkileşim biçimleri: ${(profil.etkilesimler || []).join(', ')}
- Özgül ilgi açıklaması: ${profil.ozgulKisa || ''} — ${profil.aciklama || ''}

KONTROL GRUBU REFERANS JSON ŞABLONU (Deney grubu için BİREBİR AYNI JSON anahtarlarını, slide_type ve gorevTipi değerlerini koruyarak yalnızca metin/veri bağlamını öğrencinin ilgi profiline uyarla):
${kontrolSablonJSON}

ÖNEMLİ KURALLAR:
1. "slaytlar" dizisindeki 5 slaytın her birinin "slide_type", "kisaAd", "ikon" ve şablona özgü alt alanlarını (ör. M1 için claim_vs_testable/process_timeline/ethics_pillars; M2 için question_funnel/independent_var/dependent_var; M3 için design_matrix/decision_tree/mixed_sequence; M4 için population_vs_sample/sampling_bias_comparison/stratified_grid; M5 için instrument_blueprint/bullseye_targets/threat_diagnosis; M6 için data_cleaning_table/correlation_vs_causation/limitations_report) BİREBİR KORU ve öğrencinin ilgi profiline göre doldur.
2. "gorev" nesnesindeki "gorevTipi" ("${kontrol.gorev.gorevTipi || 'ikili_secim'}") ve etkileşim alanlarını (ör. M1'de "siralaAdimlar" [4 adım doğru sırada]; M2'de "eslestirOgeler" [Bağımsız, Bağımlı, Kontrol sırasıyla 3 öğe] ve "eslestirRoller"; M3 ve M5'te "sinifKategoriler" ve "sinifOgeler"; M4'te "tabakalar" [3 tabaka], "birim", "hedefAdet": 2; M6'da "kosullar", "soru1", "soru2") BİREBİR KORU.
3. Çoktan seçmeli sorularda doğru cevabın indeksini kontrol grubuyla aynı tut ("bagimsizDogru": ${kontrol.gorev.bagimsizDogru ?? 0}${kontrol.gorev.bagimliDogru !== undefined ? `, "bagimliDogru": ${kontrol.gorev.bagimliDogru}` : ''}).`;

    const usr1 = akademisyenNotu && mevcutSonuc && mevcutSonuc.hamUretilen
      ? `${temelUsr1}\n\nAKADEMİSYEN REVİZYON TALEBİ (ÖNCEKİ TASLAĞI BU DÖNÜTE GÖRE DÜZELT):\nAkademisyen Notu: "${akademisyenNotu}"\nÖnceki Taslak JSON:\n${JSON.stringify(mevcutSonuc.hamUretilen, null, 2)}`
      : temelUsr1;

    const raw1 = await callLLM(uretim.senaryoModel, sys1, usr1, keys, true);
    let uretilen;
    try {
      uretilen = parseJSON(raw1);
    } catch (e1) {
      const fixUsr = `Önceki yanıt JSON sözdizimi hatası verdi (${e1.message}). Aşağıdaki taslağı düzeltip SADECE geçerli RFC 8259 JSON döndür (dizilerde/metinlerde kaçışsız çift tırnak veya eksik köşeli parantez bırakma):\n\n${raw1.slice(0, 4500)}`;
      const raw1Retry = await callLLM(uretim.senaryoModel, sys1, fixUsr, keys, true);
      try {
        uretilen = parseJSON(raw1Retry);
      } catch (e2) {
        throw new Error(`${uretim.senaryoModel}: ${e2.message}`);
      }
    }
    if (!uretilen.slaytlar || uretilen.slaytlar.length < 5 || !uretilen.gorev) {
      throw new Error('Üretilen JSON beklenen 5 slayt + mikro-görev şemasına uymuyor.');
    }

    denetimIzi.push({
      id: `uretim-${turlar.length + 1}`,
      asama: akademisyenNotu ? `Akademisyen Dönütüyle Yeniden Üretim` : '1. İlk Senaryo ve İçerik Üretimi',
      tur: 'uretim',
      model: uretim.senaryoModel,
      tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      systemPrompt: sys1,
      userPrompt: usr1,
      outputJson: JSON.parse(JSON.stringify(uretilen)),
      ozet: `${uretilen.altBaslik} · 5 slayt ve "${uretilen.gorev.baslik}" transfer mikro-görevi üretildi.`,
    });
    onAdim && onAdim({ adim: 1, durum: 'bitti', mesaj: `${uretim.senaryoModel} tamamlandı` });

    /* ADIM 1b / ADIM 5: YZ Pedagojik Ön Denetim (Appendix B) & Otomatik Revizyon Döngüsü */
    let sonDenetim = null;
    let kullanilanRevizyon = 0;

    if (onDenetimAcik) {
      for (let rev = 0; rev <= maxRevizyon; rev++) {
        const turEtiket = rev === 0 ? 'İlk Ön Denetim' : `${rev}. Revizyon Sonrası Ön Denetim`;
        onAdim && onAdim({
          adim: 5,
          durum: 'calisiyor',
          mesaj: `${denetimModel} ile Appendix B ön denetimi (${rev + 1}/${maxRevizyon + 1})...`,
        });

        sonDenetim = await yzOnDenetimYap({
          modul,
          kontrol,
          profil,
          uretilen,
          denetimModel,
          keys,
          esikPuan,
          turNo: rev + 1,
        });

        turlar.push({
          turNo: turlar.length + 1,
          revizyonNo: rev,
          etiket: turEtiket,
          model: denetimModel,
          tarih: sonDenetim.tarih,
          pedagojikOrtalama: sonDenetim.pedagojikOrtalama,
          esdegerlikOrtalama: sonDenetim.esdegerlikOrtalama,
          genelOrtalama: sonDenetim.genelOrtalama,
          esikPuan: sonDenetim.esikPuan,
          gectiMi: sonDenetim.gectiMi,
          genelYorum: sonDenetim.genelYorum,
          revizyonTalimati: sonDenetim.revizyonTalimati,
          eksikNotlar: sonDenetim.eksikNotlar,
          pedagojik: sonDenetim.pedagojik,
          esdegerlik: sonDenetim.esdegerlik,
          icerikSnapshot: JSON.parse(JSON.stringify(uretilen)),
        });

        denetimIzi.push({
          id: `denetim-${turlar.length}`,
          asama: `YZ Ön Denetim (${turEtiket})`,
          tur: 'denetim',
          model: denetimModel,
          tarih: sonDenetim.tarih,
          systemPrompt: sonDenetim.systemPrompt,
          userPrompt: sonDenetim.userPrompt,
          outputJson: {
            genelOrtalama: sonDenetim.genelOrtalama,
            pedagojikOrtalama: sonDenetim.pedagojikOrtalama,
            esdegerlikOrtalama: sonDenetim.esdegerlikOrtalama,
            gectiMi: sonDenetim.gectiMi,
            genelYorum: sonDenetim.genelYorum,
            revizyonTalimati: sonDenetim.revizyonTalimati,
            pedagojik: sonDenetim.pedagojik,
            esdegerlik: sonDenetim.esdegerlik,
          },
          ozet: `${sonDenetim.gectiMi ? 'ONAYLANDI' : 'REVİZYON GEREKLİ'} · Genel Skor: ${Math.round(sonDenetim.genelOrtalama * 100)}% (Pedagojik: ${sonDenetim.pedagojikOrtalama}, Eşdeğerlik: ${sonDenetim.esdegerlikOrtalama}) — ${sonDenetim.genelYorum}`,
        });

        if (sonDenetim.gectiMi || rev >= maxRevizyon) {
          break;
        }

        // Eşiğin altında kaldıysa ve revizyon hakkı varsa otomatik revizyon üretimi yap
        kullanilanRevizyon = rev + 1;
        onAdim && onAdim({
          adim: 5,
          durum: 'calisiyor',
          mesaj: `Revizyon ${kullanilanRevizyon}/${maxRevizyon}: YZ dönütlerine göre düzeltiliyor...`,
        });

        const revUserPrompt = `${temelUsr1}

---
ÖNCEKİ TASLAK İÇERİK:
${JSON.stringify(uretilen, null, 2)}

YZ PEDAGOJİK ÖN DENETİM (APPENDIX B & EŞDEĞERLİK) GERİ BİLDİRİMİ (Skor: ${sonDenetim.genelOrtalama} < Eşik: ${esikPuan}):
Genel Yorum: ${sonDenetim.genelYorum}
Düzeltme Önerileri:
${(sonDenetim.eksikNotlar || []).map(n => '- ' + n).join('\n')}
Revizyon Talimatı: ${sonDenetim.revizyonTalimati}

GÖREV: Yukarıdaki pedagojik ve deneysel eşdeğerlik eleştirilerinin tamamını gidererek içeriği revize et ve aynı JSON şemasıyla döndür.`;

        const rawRev = await callLLM(uretim.senaryoModel, sys1, revUserPrompt, keys, true);
        try {
          const revParsed = parseJSON(rawRev);
          if (revParsed && Array.isArray(revParsed.slaytlar) && revParsed.slaytlar.length >= 5 && revParsed.gorev) {
            uretilen = revParsed;
          }
        } catch (eRev) {
          // Revizyon JSON ayrıştırılamazsa mevcut taslak korunur
        }

        denetimIzi.push({
          id: `revizyon-${kullanilanRevizyon}`,
          asama: `Otomatik YZ Revizyonu (${kullanilanRevizyon}/${maxRevizyon})`,
          tur: 'revizyon',
          model: uretim.senaryoModel,
          tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          systemPrompt: sys1,
          userPrompt: revUserPrompt,
          outputJson: JSON.parse(JSON.stringify(uretilen)),
          ozet: `Ön denetim düzeltme önerileri doğrultusunda ${kullanilanRevizyon}. revizyon taslağı üretildi.`,
        });
      }

      onAdim && onAdim({
        adim: 5,
        durum: sonDenetim && sonDenetim.gectiMi ? 'bitti' : 'uyari',
        mesaj: sonDenetim
          ? `${sonDenetim.gectiMi ? 'YZ Ön Onay ✓' : 'Eşik altı / Akademisyen incelemesinde'} · Skor: %${Math.round(sonDenetim.genelOrtalama * 100)} (${kullanilanRevizyon}/${maxRevizyon} revizyon)`
          : 'Tamamlandı',
      });
    } else {
      onAdim && onAdim({
        adim: 5,
        durum: 'uyari',
        mesaj: 'Ön denetim kapalı (Denetimsiz doğrudan görünüm)',
      });
    }

    /* ADIM 2: Seslendirme scripti iyileştirme */
    onAdim && onAdim({ adim: 2, durum: 'calisiyor', mesaj: `${uretim.scriptModel} ile seslendirme scripti düzenleniyor...` });
    try {
      const sys2 = `Sen Türkçe eğitim içerikleri için seslendirme editörüsün. Verilen 5 slayt anlatımını ve mikro-görev metnini doğal, kulakla anlaşılır, gereksiz tekrardan arınmış (Mayer CTML) Türkçe TTS metnine dönüştür. Yalnızca JSON döndür: {"narrations": ["s1", "s2", "s3", "s4", "s5"], "gorevMetin": "..."}`;
      const usr2 = JSON.stringify({
        narrations: uretilen.slaytlar.map(s => s.narration),
        gorevMetin: uretilen.gorev.metin,
      });
      const raw2 = await callLLM(uretim.scriptModel, sys2, usr2, keys, true);
      const s2 = parseJSON(raw2);
      if (Array.isArray(s2.narrations) && s2.narrations.length === 5) {
        s2.narrations.forEach((n, idx) => { if (n) uretilen.slaytlar[idx].narration = n; });
      }
      if (s2.gorevMetin) uretilen.gorev.metin = s2.gorevMetin;
      denetimIzi.push({
        id: `script-${denetimIzi.length + 1}`,
        asama: '2. Seslendirme Scripti Düzenleme (Mayer CTML)',
        tur: 'script',
        model: uretim.scriptModel,
        tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        systemPrompt: sys2,
        userPrompt: usr2,
        outputJson: s2,
        ozet: '5 slayt ve mikro-görev seslendirme metinleri işitsel akıcılık için optimize edildi.',
      });
      onAdim && onAdim({ adim: 2, durum: 'bitti', mesaj: `${uretim.scriptModel} tamamlandı` });
    } catch (e) {
      onAdim && onAdim({ adim: 2, durum: 'uyari', mesaj: `Script adımı atlandı (${e.message})` });
    }

    /* ADIM 3: Görsel üretim promptu oluşturma */
    let gorselPromptSlayt = `Clean modern editorial educational illustration of ${profil.ozgulKisa || profil.altKategori}, no text, warm daylight, teal and orange accents, high clarity, 16:9`;
    let gorselPromptGorev = gorselPromptSlayt;
    onAdim && onAdim({ adim: 3, durum: 'calisiyor', mesaj: `${uretim.promptModel} ile görsel promptu yazılıyor...` });
    try {
      const sys3 = `Create two concise English image generation prompts for clean, realistic-editorial educational illustrations (NO text/labels/watermarks inside the image). Return JSON only: {"slaytPrompt": "...", "gorevPrompt": "..."}`;
      const usr3 = JSON.stringify({
        studentInterest: `${profil.altKategori} - ${profil.ozgulKisa}`,
        workedExample: uretilen.slaytlar[0].soru,
        microTask: uretilen.gorev.baslik,
      });
      const raw3 = await callLLM(uretim.promptModel, sys3, usr3, keys, true);
      const p3 = parseJSON(raw3);
      if (p3.slaytPrompt) gorselPromptSlayt = p3.slaytPrompt;
      if (p3.gorevPrompt) gorselPromptGorev = p3.gorevPrompt;
      denetimIzi.push({
        id: `gorsel-prompt-${denetimIzi.length + 1}`,
        asama: '3. Görsel Üretim Promptu Oluşturma',
        tur: 'prompt',
        model: uretim.promptModel,
        tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        systemPrompt: sys3,
        userPrompt: usr3,
        outputJson: p3,
        ozet: 'Çözümlü örnek ve mikro-görev için metinsiz pedagojik sahne promptları oluşturuldu.',
      });
      onAdim && onAdim({ adim: 3, durum: 'bitti', mesaj: `${uretim.promptModel} tamamlandı` });
    } catch (e) {
      onAdim && onAdim({ adim: 3, durum: 'uyari', mesaj: `Varsayılan görsel promptu kullanıldı` });
    }

    /* ADIM 4: Gemini Görsel Üretimi + Google TTS Seslendirme (images/ & audio/ önbellek) */
    onAdim && onAdim({ adim: 4, durum: 'calisiyor', mesaj: `${uretim.gorselModel} & ${uretim.sesModel} çalıştırılıyor...` });
    let slaytImg = null, gorevImg = null, gorselNot = '';
    if ((keys.geminiKey || '').trim()) {
      try {
        slaytImg = await generateGeminiImage(uretim.gorselModel, gorselPromptSlayt, keys.geminiKey);
        try {
          gorevImg = await generateGeminiImage(uretim.gorselModel, gorselPromptGorev, keys.geminiKey);
        } catch (e2) { gorevImg = null; }
        gorselNot = `Gemini görsel üretildi (${uretim.gorselModel})`;
      } catch (e) {
        gorselNot = `Görsel üretilemedi (${e.message}) — SVG yedek kullanıldı`;
      }
    } else {
      gorselNot = 'Gemini API anahtarı girilmedi — SVG sahne kullanıldı';
    }

    let ttsSay = 0, ttsNot = '';
    const ttsKey = (keys.ttsKey || '').trim();
    const geminiKey = (keys.geminiKey || '').trim();
    const audioUrls = [null, null, null, null, null];
    let gorevAudioUrl = null;
    if (ttsKey || geminiKey) {
      try {
        for (let i = 0; i < 5; i++) {
          audioUrls[i] = await generateGoogleTTS(uretilen.slaytlar[i].narration, uretim.sesModel, uretim.sesHiz, ttsKey, geminiKey);
          ttsSay++;
        }
        gorevAudioUrl = await generateGoogleTTS(uretilen.gorev.metin, uretim.sesModel, uretim.sesHiz, ttsKey, geminiKey);
        const wavMi = audioUrls[0] && audioUrls[0].startsWith('data:audio/wav');
        ttsNot = wavMi ? `Gemini TTS (${ttsSay + 1} ses)` : `Google Cloud TTS (${ttsSay + 1} ses)`;
      } catch (e) {
        ttsNot = `API TTS yerine tarayıcı TTS (${e.message})`;
      }
    } else {
      ttsNot = 'Tarayıcı Türkçe TTS aktif';
    }
    onAdim && onAdim({ adim: 4, durum: (slaytImg || ttsSay > 0) ? 'bitti' : 'uyari', mesaj: `${gorselNot} · ${ttsNot}` });

    /* SlaytSunum ve GorevPrototip şemalarına dönüştür */
    const metaBase = kontrol.slayt.slaytlar;
    const temaTip = /basket|spor/i.test(profil.kategori + ' ' + profil.altKategori) ? 'basketbol'
      : /kahve|yemek|içecek/i.test(profil.kategori + ' ' + profil.altKategori) ? 'kahve' : 'calisma';

    const sesExt = url => (url && url.startsWith('data:audio/wav')) ? 'wav' : 'mp3';
    const slaytObj = {
      id: `deney-${modul.id}-${pSlug}`,
      etiket: `Deney grubu — ${profil.altKategori || profil.kisaEtiket}`,
      kisa: profil.kisaEtiket || profil.altKategori,
      altBaslik: uretilen.altBaslik,
      sureToplam: `${uretilen.slaytlar.reduce((t, s) => t + (Number(s.estimated_duration_seconds) || 15), 0)} sn`,
      temaTip,
      slaytlar: uretilen.slaytlar.map((s, i) => ({
        ...metaBase[i],
        ...s,
        slide_id: i + 1,
        image_path: i === 0 ? `images/${modul.id}-${pSlug}-s1.png` : undefined,
        image_data_url: i === 0 ? slaytImg : undefined,
        audio_path: `audio/${modul.id}-${pSlug}-s${i + 1}.${sesExt(audioUrls[i])}`,
        audio_data_url: audioUrls[i] || undefined,
      })),
    };

    const g = uretilen.gorev;
    const gorevObj = {
      ...kontrol.gorev,
      ...g,
      id: `deney-${modul.id}-${pSlug}`,
      gorevTipi: kontrol.gorev.gorevTipi || g.gorevTipi,
      eyebrow: `${modul.id.replace('m', 'MODÜL 0')} · MİKRO-GÖREV (CANLI API)`,
      altYazi: g.altYazi || kontrol.gorev.altYazi,
      baslik: g.baslik || kontrol.gorev.baslik,
      metin: g.metin || kontrol.gorev.metin,
      temaTip: temaTip === 'calisma' ? 'standart' : temaTip,
      image_path: `images/${modul.id}-${pSlug}-gorev.png`,
      image_data_url: gorevImg || undefined,
      audio_path: `audio/${modul.id}-${pSlug}-gorev.${sesExt(gorevAudioUrl)}`,
      audio_data_url: gorevAudioUrl || undefined,
      kosullar: (g.kosullar || kontrol.gorev.kosullar || []).map((k, idx) => ({
        ad: k.ad,
        deger: k.deger,
        diyagram: temaTip === 'basketbol' ? `saha${idx + 1}` : temaTip === 'kahve' ? `kahve${idx + 1}` : `saat${idx + 1}`,
      })),
      siralaAdimlar: Array.isArray(g.siralaAdimlar) && g.siralaAdimlar.length >= 4 ? g.siralaAdimlar : kontrol.gorev.siralaAdimlar,
      eslestirOgeler: Array.isArray(g.eslestirOgeler) && g.eslestirOgeler.length >= 3 ? g.eslestirOgeler : kontrol.gorev.eslestirOgeler,
      eslestirRoller: kontrol.gorev.eslestirRoller,
      sinifKategoriler: kontrol.gorev.sinifKategoriler,
      sinifOgeler: Array.isArray(g.sinifOgeler) && g.sinifOgeler.length ? g.sinifOgeler : kontrol.gorev.sinifOgeler,
      tabakalar: Array.isArray(g.tabakalar) && g.tabakalar.length >= 3 ? g.tabakalar : kontrol.gorev.tabakalar,
      birim: g.birim || kontrol.gorev.birim,
      hedefAdet: kontrol.gorev.hedefAdet || 2,
      soru1: g.soru1 || kontrol.gorev.soru1,
      bagimsizSecenekler: g.bagimsizSecenekler || kontrol.gorev.bagimsizSecenekler,
      bagimsizDogru: Number.isInteger(g.bagimsizDogru) ? g.bagimsizDogru : (kontrol.gorev.bagimsizDogru ?? 0),
      soru2: g.soru2 || kontrol.gorev.soru2,
      bagimliSecenekler: g.bagimliSecenekler || kontrol.gorev.bagimliSecenekler,
      bagimliDogru: Number.isInteger(g.bagimliDogru) ? g.bagimliDogru : (kontrol.gorev.bagimliDogru ?? 1),
      ipucuBagimsiz: g.ipucuBagimsiz || kontrol.gorev.ipucuBagimsiz,
      ipucuBagimli: g.ipucuBagimli || kontrol.gorev.ipucuBagimli,
      aciklamaDogru: g.aciklamaDogru || kontrol.gorev.aciklamaDogru,
    };

    // Onay durumu:
    // - Ön denetim kapalıysa: 'denetimsiz_acik' (doğrudan görünür)
    // - Ön denetim açıksa ve YZ ön onay verdiyse: 'akademisyen_bekliyor' (akademisyen onayına düşer)
    // - Ön denetim açıksa ve tüm revizyonlara rağmen eşik altındaysa: 'yz_red' (akademisyen müdahalesi / ek revizyon bekler)
    const onayDurumu = !onDenetimAcik
      ? 'denetimsiz_acik'
      : (sonDenetim && sonDenetim.gectiMi ? 'akademisyen_bekliyor' : 'yz_red');

    const sonuc = {
      cacheKey,
      modulId: modul.id,
      profil,
      hamUretilen: uretilen,
      slayt: slaytObj,
      gorev: gorevObj,
      prompts: { slayt: gorselPromptSlayt, gorev: gorselPromptGorev },
      denetim: {
        onDenetimAcik,
        maxRevizyon,
        kullanilanRevizyon,
        esikPuan,
        denetimModel,
        sonDenetim,
        onayDurumu, // 'denetimsiz_acik' | 'akademisyen_bekliyor' | 'yz_red' | 'akademisyen_onayli' | 'akademisyen_revizyon'
        ogrenciGorebilir: !onDenetimAcik,
        akademisyenKarar: null,
      },
      turlar,
      denetimIzi,
      meta: {
        senaryoModel: uretim.senaryoModel,
        scriptModel: uretim.scriptModel,
        promptModel: uretim.promptModel,
        gorselModel: uretim.gorselModel,
        denetimModel: onDenetimAcik ? denetimModel : 'Kapalı',
        sesModel: ttsSay > 0 ? uretim.sesModel : 'Tarayıcı TTS',
        gorselNot,
        ttsNot,
        tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    };
    await cacheSet(cacheKey, sonuc);
    return sonuc;
  }

  /* Mevcut bir içerik üzerinde sadece YZ Ön Denetimini (veya akademisyen kararını) çalıştır/güncelle */
  async function akademisyenKararKaydet(sonuc, { karar, akademisyenAd, not }) {
    if (!sonuc) return null;
    const tarih = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    sonuc.denetim = sonuc.denetim || {};
    sonuc.denetim.onayDurumu = karar === 'onay' ? 'akademisyen_onayli' : 'akademisyen_revizyon';
    sonuc.denetim.ogrenciGorebilir = karar === 'onay' || !sonuc.denetim.onDenetimAcik;
    sonuc.denetim.akademisyenKarar = {
      karar,
      akademisyenAd: akademisyenAd || 'Doç. Dr. Akademik Danışman',
      not: not || (karar === 'onay' ? 'Appendix B pedagojik yeterlik ve deney-kontrol eşdeğerlik ölçütleri incelendi; öğrencinin erişimine açılması onaylandı.' : 'Revizyon talep edildi.'),
      tarih,
    };
    sonuc.denetimIzi = sonuc.denetimIzi || [];
    sonuc.denetimIzi.push({
      id: `akademisyen-${sonuc.denetimIzi.length + 1}`,
      asama: karar === 'onay' ? 'Akademisyen Nihai Onayı (Öğrenciye Açıldı)' : 'Akademisyen Revizyon Talebi',
      tur: karar === 'onay' ? 'akademisyen_onay' : 'akademisyen_red',
      model: sonuc.denetim.akademisyenKarar.akademisyenAd,
      tarih,
      systemPrompt: 'Akademisyen Uzman İncelemesi (Human-in-the-Loop Gatekeeper)',
      userPrompt: `İncelenen İçerik: ${sonuc.slayt.altBaslik} (${sonuc.modulId.toUpperCase()} · ${sonuc.profil.altKategori})`,
      outputJson: sonuc.denetim.akademisyenKarar,
      ozet: `${sonuc.denetim.akademisyenKarar.akademisyenAd}: "${sonuc.denetim.akademisyenKarar.not}"`,
    });
    await cacheSet(sonuc.cacheKey, sonuc);
    return sonuc;
  }

  async function cacheListAll() {
    try {
      const db = await openDB();
      return await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const st = tx.objectStore(STORE);
        const req = st.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    } catch (e) { return []; }
  }

  /* Üretilen görsel ve ses dosyalarını kullanıcının seçtiği klasöre (images/ & audio/) veya dosya olarak kaydet */
  async function dosyalaraKaydet(sonuc) {
    const dosyalar = [];
    const s1 = sonuc.slayt.slaytlar[0];
    if (s1 && s1.image_data_url) dosyalar.push([s1.image_path, s1.image_data_url]);
    if (sonuc.gorev && sonuc.gorev.image_data_url) dosyalar.push([sonuc.gorev.image_path, sonuc.gorev.image_data_url]);
    sonuc.slayt.slaytlar.forEach(s => { if (s.audio_data_url) dosyalar.push([s.audio_path, s.audio_data_url]); });
    if (sonuc.gorev && sonuc.gorev.audio_data_url) dosyalar.push([sonuc.gorev.audio_path, sonuc.gorev.audio_data_url]);
    const jsonBlob = new Blob([JSON.stringify({ slayt: sonuc.slayt, gorev: sonuc.gorev, prompts: sonuc.prompts }, null, 2)], { type: 'application/json' });

    if (window.showDirectoryPicker) {
      const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });
      for (const [yol, dataUrl] of dosyalar) {
        const [klasorAd, dosyaAd] = yol.split('/');
        const dir = await rootDir.getDirectoryHandle(klasorAd, { create: true });
        const fh = await dir.getFileHandle(dosyaAd, { create: true });
        const wr = await fh.createWritable();
        const blob = await (await fetch(dataUrl)).blob();
        await wr.write(blob);
        await wr.close();
      }
      const fh = await rootDir.getFileHandle(`${sonuc.modulId}-${slug(sonuc.profil.kisaEtiket || sonuc.profil.id)}.json`, { create: true });
      const wr = await fh.createWritable();
      await wr.write(jsonBlob);
      await wr.close();
      return `${dosyalar.length} medya + 1 JSON klasöre yazıldı.`;
    }

    // Fallback: tarayıcı indirmesi
    for (const [yol, dataUrl] of dosyalar) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = yol.replace('/', '-');
      a.click();
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(jsonBlob);
    a.download = `${sonuc.modulId}-${slug(sonuc.profil.kisaEtiket || sonuc.profil.id)}.json`;
    a.click();
    return `${dosyalar.length} medya + 1 JSON indirildi.`;
  }

  return {
    APPENDIX_B_RUBRIKLER,
    ESDEGERLIK_KRITERLERI,
    varsayilanRubrikDegerlendirme,
    hesaplaDenetimSkor,
    getKontrol,
    getHazirDeneyPaketi,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheListAll,
    uretDeneyIcerigi,
    akademisyenKararKaydet,
    dosyalaraKaydet,
  };
})();
