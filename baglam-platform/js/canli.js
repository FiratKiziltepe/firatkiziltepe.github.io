/* Canlı Deney Laboratuvarı:
   1) Kontrol grubu için 6 modülün tamamında standart içerik (5 slayt + etkileşimli mikro-görev)
   2) Deney grubu için Claude / Gemini / Google TTS API'leri üzerinden canlı kişiselleştirilmiş üretim
   3) Üretilen görsellerin (images/) ve seslerin (audio/) IndexedDB önbelleğinde saklanması ve klasöre indirilebilmesi */
window.CanliDeney = (() => {
  'use strict';

  /* ---------- 1. Tüm Modüller (m1..m6) için Standart Kontrol Grubu İçerikleri ---------- */
  const KONTROL_ICERIK = {
    m1: {
      modulId: 'm1',
      modulAd: 'Bilimsel araştırmanın temelleri',
      kazanim: 'Bilimsel bilgiyi gündelik görüşten ayırır ve araştırmanın temel adımlarını sıralar.',
      slayt: {
        id: 'kontrol-m1', etiket: 'Kontrol grubu — Standart içerik', kisa: 'Standart (Kontrol)',
        altBaslik: 'Not tutma yöntemleri ve bilimsel soru', sureToplam: '75 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Gözlemden bilimsel soruya', altBaslik: 'Ders notu tutma alışkanlıkları',
            soru: 'Derste özet çıkararak not tutmak mı, sadece altını çizmek mi hatırlamayı daha çok artırır?',
            image_path: 'images/m1-standart-s1.png', audio_path: 'audio/m1-standart-s1.mp3',
            narration: 'Bir öğrenci, derste yalnızca metnin altını çizen arkadaşlarına göre kendi cümleleriyle özet çıkaranların sınavda daha çok bilgi hatırladığını gözlemlemiştir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Araştırma', ikon: 'izgara',
            ustBaslik: 'Üç not tutma koşulu sınanıyor', altBaslik: 'Aynı ders metni, üç farklı grup',
            kosullar: [
              { ad: 'Altını çizme', deger: '61 puan', diyagram: 'saat1' },
              { ad: 'Özet çıkarma', deger: '78 puan', diyagram: 'saat2' },
              { ad: 'Kavram haritası', deger: '82 puan', diyagram: 'saat3' },
            ],
            dipnot: 'Örnek amaçlı kurgusal hatırlama testi puanları',
            audio_path: 'audio/m1-standart-s2.mp3',
            narration: 'Kişisel bir görüş yerine sınanabilir bir araştırma yürütülerek üç grubun aynı hatırlama testinden aldığı ortalama puanlar karşılaştırılmıştır.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Sınanabilirlik', ikon: 'dal',
            ustBaslik: 'Görüş değil, sınanabilir iddia', altBaslik: 'Bilimsel bilginin ayırt edici özelliği',
            degisken: 'Ölçüme açık karşılaştırma',
            seviyeler: ['Gözlem & Soru', 'Veri Toplama', 'Kanıta Dayalı Sonuç'],
            digerRef: 'Gündelik görüş: "Özet çıkarmak her zaman daha iyidir" (Sınanmamış)',
            audio_path: 'audio/m1-standart-s3.mp3',
            narration: 'Bilimsel bilgi; gözleme, sistemli veri toplamaya ve kanıtlara dayanır. Bu sayede herkes tarafından yeniden sınanabilir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Bulgular', ikon: 'grafik',
            ustBaslik: 'Kanıtların karşılaştırılması', altBaslik: 'Hatırlama testi ortalamaları',
            degisken: '1 hafta sonraki hatırlama puanı',
            oncekiRef: 'Karşılaştırılan yöntemler: Altını çizme, Özet, Kavram haritası',
            veri: [{ etiket: 'Altını çizme', deger: 61 }, { etiket: 'Özet', deger: 78 }, { etiket: 'Harita', deger: 82 }],
            audio_path: 'audio/m1-standart-s4.mp3',
            narration: 'Elde edilen puanlar kavram haritası ve özet çıkarma gruplarının altını çizme grubundan daha yüksek ortalama aldığını göstermektedir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Bilimsel araştırma döngüsü', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Sınanabilir soru & yöntem', bagimli: 'Kanıta dayalı rapor',
            ozetNot: 'Bilimsel araştırma bir gözlemi açık, ölçülebilir ve etik kurallara uygun biçimde sınar.',
            audio_path: 'audio/m1-standart-s5.mp3',
            narration: 'Özetle bilimsel araştırma; gözlemden sınanabilir soruya, sistemli veriden sınırlılıklarıyla raporlanan bulguya ilerler.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m1', eyebrow: 'MODÜL 01 · MİKRO-GÖREV', altYazi: 'Araştırma senaryosunu incele ve bilimsel ilkeleri belirle.',
        baslik: 'Okuma ortamı dikkati etkiler mi?',
        metin: 'Bir eğitim araştırmacısı, öğrencilerin sessiz kütüphane ortamında ve kafeterya ortamında okudukları metinleri hatırlama düzeylerini karşılaştırmıştır. Katılımcıların izni alınarak uygulanan testte kütüphane grubu 81, kafeterya grubu 65 ortalama almıştır.',
        temaTip: 'standart',
        kosullar: [
          { ad: 'Sessiz kütüphane', deger: '81 puan', diyagram: 'saat2' },
          { ad: 'Kafeterya', deger: '65 puan', diyagram: 'saat1' },
          { ad: 'Karma grup', deger: '73 puan', diyagram: 'saat3' },
        ],
        soruBaslik: 'Bilimsel soruyu ve yöntemi ayırt et', soruAlt: 'Bilimsel bilginin temelleri',
        soru1: 'Bu çalışmada aşağıdakilerden hangisi bilimsel olarak sınanabilir bir araştırma sorusudur?',
        bagimsizSecenekler: [
          'Çalışma ortamının gürültü düzeyi üniversite öğrencilerinin okuduğunu hatırlama puanını etkiler mi?',
          'Kütüphaneler her zaman kafeteryalardan daha güzel yerlerdir.',
          'Öğrenciler neden ders çalışmayı sevmez?',
          'Sessizlik iyi midir?',
        ],
        bagimsizDogru: 0,
        soru2: 'Bu araştırmada veri toplama öncesi katılımcılardan izin alınması hangi ilkenin gereğidir?',
        bagimliSecenekler: ['Rastgele atama', 'Bilgilendirilmiş onam ve bilimsel etik', 'Tabakalı örnekleme', 'İçerik analizi'],
        bagimliDogru: 1,
        ipucuBagimsiz: 'Sınanabilir soru; neyin karşılaştırıldığını ve hangi ölçümün yapılacağını açıkça belirtmelidir.',
        ipucuBagimli: 'Katılımcıların çalışmadan haberdar edilip gönüllü onay vermesi etik ilkeyle ilgilidir.',
        feedback1Yanlis: 'İkinci seçimin doğru; ilk soruda ölçülebilir ve sınanabilir olan araştırma sorusunu seçmelisin.',
        feedback2Yanlis: 'İlk seçimin doğru; ikinci soruda katılımcı izni ve haklarını koruyan etik ilkeyi belirlemelisin.',
        aciklamaDogru: 'Doğru! İlk soru ölçülebilir değişkenleri tanımladığı için sınanabilirdir; katılımcı izni alınması ise bilimsel etik ve bilgilendirilmiş onam ilkesinin gereğidir.',
      },
    },
    m2: {
      modulId: 'm2',
      modulAd: 'Araştırma problemi ve sorusu',
      kazanim: 'Verilen araştırma senaryosunda bağımsız ve bağımlı değişkenleri belirler.',
      slayt: null, // SlaytSunum.PROFILLER[0] ile eşleştirilecek
      gorev: null, // GorevPrototip.SENARYOLAR[0] ile eşleştirilecek
    },
    m3: {
      modulId: 'm3',
      modulAd: 'Araştırma desenleri',
      kazanim: 'Araştırma sorusuna göre nicel (deneysel/ilişkisel), nitel ve karma desenleri ayırt eder.',
      slayt: {
        id: 'kontrol-m3', etiket: 'Kontrol grubu — Standart içerik', kisa: 'Standart (Kontrol)',
        altBaslik: 'Aynı konuya üç farklı araştırma deseni', sureToplam: '76 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Sorunun türü deseni belirler', altBaslik: 'Uzaktan eğitimde ders katılımı',
            soru: 'Aynı konu nicel, nitel ve karma desenlerle nasıl araştırılır?',
            image_path: 'images/m3-standart-s1.png', audio_path: 'audio/m3-standart-s1.mp3',
            narration: 'Bir araştırmacı üniversite öğrencilerinin çevrim içi derslere katılımını incelemek istemektedir. Sorduğu sorunun türü, kullanacağı araştırma desenini belirler.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Desenler', ikon: 'izgara',
            ustBaslik: 'Üç temel desen yaklaşımı', altBaslik: 'Sayılar, deneyimler ve bütünleştirme',
            kosullar: [
              { ad: 'İlişkisel (Nicel)', deger: 'r = 0,62', diyagram: 'saat1' },
              { ad: 'Olgubilim (Nitel)', deger: '10 görüşme', diyagram: 'saat2' },
              { ad: 'Açıklayıcı Karma', deger: 'Nicel + Nitel', diyagram: 'saat3' },
            ],
            dipnot: 'Örnek amaçlı araştırma tasarımı karşılaştırması',
            audio_path: 'audio/m3-standart-s2.mp3',
            narration: 'İlişki ölçülüyorsa nicel ilişkisel desen, yaşanmış deneyimler derinlemesine anlaşılacaksa nitel olgubilim, ikisi birleştirilecekse karma desen seçilir.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Müdahale', ikon: 'dal',
            ustBaslik: 'Deneysel ve ilişkisel ayrımı', altBaslik: 'Değişkene müdahale var mı?',
            degisken: 'Araştırmacının rolü',
            seviyeler: ['Müdahale var → Deneysel', 'Müdahale yok → İlişkisel', 'Anlam arayışı → Nitel'],
            digerRef: 'Sadece mevcut durumu ölçmek ilişkisel; grup atayıp yöntem uygulamak deneyseldir.',
            audio_path: 'audio/m3-standart-s3.mp3',
            narration: 'Araştırmacı değişkenlere müdahale etmeden mevcut ilişkiye bakıyorsa ilişkisel, gruplara farklı koşul uyguluyorsa deneysel desen kullanmış olur.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Veri türü', ikon: 'grafik',
            ustBaslik: 'Desene göre toplanan veri', altBaslik: 'Nicel ölçümler ve nitel anlatımlar',
            degisken: 'Örneklem genişliği (katılımcı)',
            oncekiRef: 'Nicel taramada geniş örneklem, nitelde derinlemesine az katılımcı',
            veri: [{ etiket: 'Nitel', deger: 10 }, { etiket: 'Deneysel', deger: 60 }, { etiket: 'Tarama', deger: 240 }],
            audio_path: 'audio/m3-standart-s4.mp3',
            narration: 'Nitel çalışmalarda az sayıda katılımcıyla derinlemesine görüşme yapılırken, nicel tarama çalışmalarında daha geniş örneklemden sayısal veri toplanır.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Sorudan uygun desene', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Araştırma sorusunun amacı', bagimli: 'Nicel / Nitel / Karma desen',
            ozetNot: 'Ne öğrenmek istediğimiz, veriyi nasıl toplayacağımızı belirler.',
            audio_path: 'audio/m3-standart-s5.mp3',
            narration: 'Özetle desen seçimi araştırma sorusunun doğasına göre yapılır: ilişki veya etki için nicel, deneyim için nitel, her ikisi için karma yöntem seçilir.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m3', eyebrow: 'MODÜL 03 · MİKRO-GÖREV', altYazi: 'Araştırma senaryosunu incele ve uygun deseni belirle.',
        baslik: 'Hangi araştırma deseni kullanılmıştır?',
        metin: 'Bir araştırmacı, üniversite öğrencilerinin haftalık kütüphane kullanım süreleri ile dönem sonu not ortalamaları arasındaki ilişkiyi incelemiştir. Mevcut kullanım ve not verilerini toplamış, öğrencilerin çalışma düzenine herhangi bir müdahalede bulunmamıştır.',
        temaTip: 'standart',
        kosullar: [
          { ad: '0–2 saat', deger: '2,45 GNO', diyagram: 'saat1' },
          { ad: '3–6 saat', deger: '2,95 GNO', diyagram: 'saat2' },
          { ad: '7+ saat', deger: '3,35 GNO', diyagram: 'saat3' },
        ],
        soruBaslik: 'Araştırmanın desenini ve gerekçesini belirle', soruAlt: 'Deneysel ve ilişkisel desen ayrımı',
        soru1: 'Bu araştırmanın deseni aşağıdakilerden hangisidir?',
        bagimsizSecenekler: ['İlişkisel araştırma deseni', 'Deneysel araştırma deseni', 'Olgubilim (Nitel) deseni', 'Durum çalışması'],
        bagimsizDogru: 0,
        soru2: 'Bu seçimin temel gerekçesi nedir?',
        bagimliSecenekler: [
          'Katılımcılar rastgele gruplara atanıp müdahale edildiği için',
          'Değişkenlere müdahale edilmeden mevcut durumlar arasındaki ilişki incelendiği için',
          'Yalnızca 3 öğrenciyle görüşme yapıldığı için',
          'Açık uçlu günlükler toplandığı için',
        ],
        bagimliDogru: 1,
        ipucuBagimsiz: 'Araştırmacının öğrencilerin çalışma süresini değiştirip değiştirmediğine dikkat et.',
        ipucuBagimli: 'Müdahale (manipülasyon) olmaması ile değişkenler arası ilişkiye bakılması arasındaki bağlantıyı düşün.',
        feedback1Yanlis: 'Gerekçen doğru; ilk soruda müdahale olmadan sayısal ilişkiyi inceleyen deseni seç.',
        feedback2Yanlis: 'Desen seçimin doğru; ikinci soruda bunun neden ilişkisel desen olduğunu açıklayan ifadeyi seç.',
        aciklamaDogru: 'Doğru! Araştırmacı değişkenlere müdahale etmeden mevcut kütüphane süresi ile not ortalaması arasındaki ilişkiyi incelediği için desen ilişkiseldir.',
      },
    },
    m4: {
      modulId: 'm4',
      modulAd: 'Evren ve örneklem',
      kazanim: 'Araştırmada evren, örneklem ve tabakalı örnekleme mantığını ayırt eder.',
      slayt: {
        id: 'kontrol-m4', etiket: 'Kontrol grubu — Standart içerik', kisa: 'Standart (Kontrol)',
        altBaslik: 'Fakülte öğrencilerinden örneklem seçimi', sureToplam: '75 sn', temaTip: 'calisma',
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
            slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Tabakalar', ikon: 'izgara',
            ustBaslik: 'Evrendeki alt gruplar', altBaslik: 'Üç bölümden eşit temsil',
            kosullar: [
              { ad: 'Mühendislik', deger: '400 öğrenci', diyagram: 'saat1' },
              { ad: 'Eğitim', deger: '400 öğrenci', diyagram: 'saat2' },
              { ad: 'Fen-Edebiyat', deger: '400 öğrenci', diyagram: 'saat3' },
            ],
            dipnot: 'Toplam evren: 1.200 lisans öğrencisi',
            audio_path: 'audio/m4-standart-s2.mp3',
            narration: 'Evrende üç farklı bölüm bulunmaktadır. Sadece tek bir bölümden veya gönüllülerden seçim yapılırsa örneklem evreni temsil etmez.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Evren', ikon: 'dal',
            ustBaslik: 'Evren ve örneklem ayrımı', altBaslik: 'Genellenmek istenen bütün grup',
            degisken: 'Evren: Fakültedeki 1.200 öğrenci',
            seviyeler: ['Evren = Bütün grup (1.200)', 'Örneklem = Seçilen alt grup (120)', 'Birim = Öğrenci'],
            digerRef: 'Örneklem büyüklüğü bu örnekte n = 120 öğrencidir.',
            audio_path: 'audio/m4-standart-s3.mp3',
            narration: 'Sonuçların genellenmek istendiği bin iki yüz kişilik bütün grup evreni, arasından seçilip veri toplanan yüz yirmi öğrenci ise örneklemi oluşturur.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Tabakalı seçim', ikon: 'grafik',
            ustBaslik: 'Tabakalı örnekleme dağılımı', altBaslik: 'Her bölümden 40 öğrenci',
            degisken: 'Örnekleme alınan öğrenci sayısı',
            oncekiRef: 'Bölümler tabaka olarak belirlenip her birinden rastgele 40 öğrenci seçildi',
            veri: [{ etiket: 'Mühendislik', deger: 40 }, { etiket: 'Eğitim', deger: 40 }, { etiket: 'Fen-Edb.', deger: 40 }],
            audio_path: 'audio/m4-standart-s4.mp3',
            narration: 'Tabakalı örnekleme sayesinde her bölümden kırk öğrenci seçilerek toplam yüz yirmi kişilik dengeli bir örneklem elde edilir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Temsil gücü yüksek örneklem', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Evren (1.200 öğrenci)', bagimli: 'Tabakalı örneklem (120 öğrenci)',
            ozetNot: 'Doğru örnekleme yöntemi, az kişiyle evreni güvenilir biçimde temsil etmeyi sağlar.',
            audio_path: 'audio/m4-standart-s5.mp3',
            narration: 'Özetle evren bütün hedef grubu ifade eder; tabakalı örnekleme ise tüm alt grupların örneklemde adil biçimde temsil edilmesini güvence altına alır.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m4', eyebrow: 'MODÜL 04 · MİKRO-GÖREV', altYazi: 'Araştırma senaryosunu incele ve evren ile örneklemi belirle.',
        baslik: 'Evren ve örneklem hangileridir?',
        metin: 'Bir araştırmacı, bir üniversitedeki 300 hazırlık sınıfı öğrencisinin haftalık kütüphane kullanım alışkanlıklarını incelemek istemektedir. Bu öğrenciler arasından rastgele seçtiği 60 öğrenciye anket uygulamıştır.',
        temaTip: 'standart',
        kosullar: [
          { ad: 'Toplam evren', deger: '300 öğrenci', diyagram: 'saat1' },
          { ad: 'Seçilen örneklem', deger: '60 öğrenci', diyagram: 'saat2' },
          { ad: 'Örneklem oranı', deger: '%20 temsil', diyagram: 'saat3' },
        ],
        soruBaslik: 'Evren ve örneklem kavramlarını belirle', soruAlt: 'Evren, örneklem ve örneklem büyüklüğü',
        soru1: 'Bu araştırmanın evreni aşağıdakilerden hangisidir?',
        bagimsizSecenekler: ['Üniversitedeki 300 hazırlık öğrencisi', 'Anket uygulanan 60 öğrenci', 'Türkiye’deki tüm üniversiteliler', 'Kütüphane görevlileri'],
        bagimsizDogru: 0,
        soru2: 'Bu araştırmanın örneklemi ve örneklem büyüklüğü nedir?',
        bagimliSecenekler: ['300 öğrenci', 'Rastgele seçilen 60 öğrenci (n = 60)', '240 öğrenci', 'Tek bir sınıf'],
        bagimliDogru: 1,
        ipucuBagimsiz: 'Evren, araştırmacının sonuçlarını genellemek istediği 300 kişilik grubun tamamıdır.',
        ipucuBagimli: 'Örneklem, evrenden seçilip doğrudan anket uygulanan alt gruptur.',
        feedback1Yanlis: 'Örneklem seçimin doğru; evren sorusunda bu çalışmadaki hedef grubun tamamına odaklan.',
        feedback2Yanlis: 'Evren seçimin doğru; örneklem sorusunda veri toplanan alt gruba odaklan.',
        aciklamaDogru: 'Doğru! Araştırmanın evreni üniversitedeki 300 hazırlık öğrencisi, örneklemi ise rastgele seçilip anket uygulanan 60 öğrencidir.',
      },
    },
    m5: {
      modulId: 'm5',
      modulAd: 'Veri toplama',
      kazanim: 'Ölçme aracında geçerlik ve güvenirlik kavramlarını ayırt eder.',
      slayt: {
        id: 'kontrol-m5', etiket: 'Kontrol grubu — Standart içerik', kisa: 'Standart (Kontrol)',
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
            slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Ölçüm', ikon: 'izgara',
            ustBaslik: 'İki temel ölçüm ölçütü', altBaslik: 'Tutarlılık ve amaca uygunluk',
            kosullar: [
              { ad: 'Güvenirlik', deger: 'Tutarlılık', diyagram: 'saat1' },
              { ad: 'Geçerlik', deger: 'Doğru hedef', diyagram: 'saat2' },
              { ad: 'Etik onam', deger: 'Gizlilik', diyagram: 'saat3' },
            ],
            dipnot: 'Nitelikli veri toplama sürecinin üç ayağı',
            audio_path: 'audio/m5-standart-s2.mp3',
            narration: 'Güvenirlik aynı koşulda tekrarlanan ölçümlerin tutarlılığını, geçerlik ise aracın gerçekten ölçmek istenen özelliği ölçmesini ifade eder.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Güvenirlik', ikon: 'dal',
            ustBaslik: 'Güvenirlik nedir?', altBaslik: 'Ölçümlerde kararlılık ve tutarlılık',
            degisken: 'Tekrarlı ölçümlerde benzer sonuç',
            seviyeler: ['Test–tekrar test tutarlılığı', 'Puanlayıcılar arası uyum', 'Düşük rastgele hata'],
            digerRef: 'Güvenilir ama geçersiz bir test tutarlı biçimde yanlış şeyi ölçebilir.',
            audio_path: 'audio/m5-standart-s3.mp3',
            narration: 'Bir terazi her ölçümde 2 kilogram fazla gösteriyorsa tutarlı olduğu için güvenilirdir; ancak doğru ağırlığı vermediği için geçerli değildir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Geçerlik', ikon: 'grafik',
            ustBaslik: 'Geçerlik neden önce gelir?', altBaslik: 'Ölçülmek istenen yapıyı yakalama',
            degisken: 'Hedef kavramı ölçme isabeti (%)',
            oncekiRef: 'Okuduğunu anlama testinde yalnızca hızlı yazmayı ölçmek geçerliği düşürür',
            veri: [{ etiket: 'Hatalı araç', deger: 35 }, { etiket: 'Sadece tutarlı', deger: 60 }, { etiket: 'Geçerli+Güvenilir', deger: 95 }],
            audio_path: 'audio/m5-standart-s4.mp3',
            narration: 'Okuduğunu anlama yerine sadece yazma hızını ölçen bir testin geçerliği düşüktür. Geçerli bir araç doğrudan hedeflenen beceriyi ölçer.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Geçerlik ve güvenirlik dengesi', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Güvenirlik (Tutarlılık)', bagimli: 'Geçerlik (Doğru şeyi ölçme)',
            ozetNot: 'Bilimsel bir ölçme aracı hem tutarlı sonuç vermeli hem de doğru kavramı ölçmelidir.',
            audio_path: 'audio/m5-standart-s5.mp3',
            narration: 'Özetle güvenirlik tutarlılığı, geçerlik ise doğru hedefi ölçmeyi sağlar; nitelikli veri için ikisi birlikte gereklidir.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m5', eyebrow: 'MODÜL 05 · MİKRO-GÖREV', altYazi: 'Ölçme senaryosunu incele ve geçerlik ile güvenirlik sorunlarını belirle.',
        baslik: 'Geçerlik mi, güvenirlik mi?',
        metin: 'Bir araştırmacı, öğrencilerin stres düzeyini ölçmek için bir anket uygulamaktadır. Anketin 1. bölümünde öğrencilerin yalnızca uyku süresini soran sorular vardır; ayrıca aynı öğrencilere iki gün arayla uygulandığında çok farklı puanlar çıkmaktadır.',
        temaTip: 'standart',
        kosullar: [
          { ad: '1. Ölçüm (Pzt)', deger: '78 puan', diyagram: 'saat1' },
          { ad: '2. Ölçüm (Çar)', deger: '42 puan', diyagram: 'saat2' },
          { ad: 'Kapsam', deger: 'Sadece uyku', diyagram: 'saat3' },
        ],
        soruBaslik: 'Ölçüm sorunlarını sınıflandır', soruAlt: 'Geçerlik ve güvenirlik ayrımı',
        soru1: 'Stres düzeyi yerine yalnızca uyku süresinin sorulması hangi özelliği zedeler?',
        bagimsizSecenekler: ['Geçerlik (ölçülmek istenen özelliği ölçmeme)', 'Güvenirlik', 'Örneklem büyüklüğü', 'Gizlilik ilkesi'],
        bagimsizDogru: 0,
        soru2: 'Aynı gruba iki gün arayla uygulandığında çok farklı puanlar çıkması hangi sorunu gösterir?',
        bagimliSecenekler: ['Tabakalı örnekleme', 'Güvenirlik sorunu (tutarlılık eksikliği)', 'İçerik geçerliği', 'Rastgele atama'],
        bagimliDogru: 1,
        ipucuBagimsiz: 'Ölçmek istediğin kavram yerine başka bir şeyi ölçmek hangi kavramın ihlalidir?',
        ipucuBagimli: 'Tekrarlanan ölçümler arasında tutarsızlık bulunması hangi kavramla ilgilidir?',
        feedback1Yanlis: 'İkinci seçimin doğru; ilk soruda hedef kavramı ölçememe sorununa odaklan.',
        feedback2Yanlis: 'İlk seçimin doğru; ikinci soruda tekrarlı ölçümlerde tutarsızlık sorununa odaklan.',
        aciklamaDogru: 'Doğru! Stres yerine yalnızca uyku süresini ölçmek geçerliği, iki gün arayla tutarsız puanlar almak ise güvenirliği zedeler.',
      },
    },
    m6: {
      modulId: 'm6',
      modulAd: 'Analiz ve raporlama',
      kazanim: 'Tablo/grafik verilerini doğru yorumlar ve ilişki ile nedenselliği ayırır.',
      slayt: {
        id: 'kontrol-m6', etiket: 'Kontrol grubu — Standart içerik', kisa: 'Standart (Kontrol)',
        altBaslik: 'Veriden bulguya ve sınırlılık raporuna', sureToplam: '76 sn', temaTip: 'calisma',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
            ustBaslik: 'Ham veriden bulguya', altBaslik: 'Haftalık tekrar ve dönem sonu notu',
            soru: 'Grafikte gördüğümüz farktan hangi bilimsel ifadeler çıkarılabilir?',
            image_path: 'images/m6-standart-s1.png', audio_path: 'audio/m6-standart-s1.mp3',
            narration: 'Bir araştırmacı 180 lisans öğrencisinin haftalık ders tekrar sıklığı ile dönem sonu sınav ortalamalarını incelemiş ve grupların ortalamalarını hesaplamıştır.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Veri tablosu', ikon: 'izgara',
            ustBaslik: 'Gruplara göre sınav ortalamaları', altBaslik: 'Ham verilerin özetlenmesi',
            kosullar: [
              { ad: 'Tekrar yok', deger: '58 puan', diyagram: 'saat1' },
              { ad: 'Haftada 1 kez', deger: '71 puan', diyagram: 'saat2' },
              { ad: 'Haftada 3+ kez', deger: '83 puan', diyagram: 'saat3' },
            ],
            dipnot: 'Örnek amaçlı dönem sonu ortalamaları (n = 180)',
            audio_path: 'audio/m6-standart-s2.mp3',
            narration: 'Veriler temizlenip gruplandırıldığında haftada üç ve üzeri tekrar yapan öğrencilerin ortalamasının seksen üç puan olduğu görülmektedir.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Bulgu yazımı', ikon: 'dal',
            ustBaslik: 'Nesnel bulgu cümlesi', altBaslik: 'Abartısız ve veriye sadık raporlama',
            degisken: 'Veriyi olduğu gibi aktarmak',
            seviyeler: ['Sayıları doğru ver', 'Örneklemi belirt', 'Kesin nedensellikten kaçın'],
            digerRef: 'Rastgele atama yoksa "kesin olarak neden olur" demek yerine ilişki bildirilir.',
            audio_path: 'audio/m6-standart-s3.mp3',
            narration: 'Araştırmada gruplar rastgele atanmadığı için tek başına nedensellik kurulamaz; bulgu cümlesi yalnızca gözlenen farkı nesnel biçimde aktarır.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Grafik okuma', ikon: 'grafik',
            ustBaslik: 'Gruplar arası dağılım', altBaslik: 'Dönem sonu sınav ortalamaları',
            degisken: 'Dönem sonu sınav puanı',
            oncekiRef: 'Grup 1: 58 · Grup 2: 71 · Grup 3: 83',
            veri: [{ etiket: 'Tekrar yok', deger: 58 }, { etiket: 'Haftada 1', deger: 71 }, { etiket: 'Haftada 3+', deger: 83 }],
            audio_path: 'audio/m6-standart-s4.mp3',
            narration: 'Çubuk grafik haftalık tekrar sıklığı arttıkça sınav ortalamasının da yükseldiğini açıkça göstermektedir.',
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
            ustBaslik: 'Şeffaf raporlama ve sınırlılıklar', altBaslik: 'Çözümün özeti',
            bagimsiz: 'Nesnel bulgu cümlesi', bagimli: 'Sınırlılıklarla birlikte paylaşım',
            ozetNot: 'İyi bir rapor hem verideki örüntüyü gösterir hem de çalışmanın sınırlarını açıkça yazar.',
            audio_path: 'audio/m6-standart-s5.mp3',
            narration: 'Özetle veriyi grafiğe dökmek örüntüyü görünür kılar; raporda ise yalnızca verinin desteklediği bulgular ve sınırlılıklar paylaşılır.',
            estimated_duration_seconds: 14,
          },
        ],
      },
      gorev: {
        id: 'kontrol-m6', eyebrow: 'MODÜL 06 · MİKRO-GÖREV', altYazi: 'Verileri incele, doğru bulgu cümlesini ve sınırlılığı belirle.',
        baslik: 'Grafikten hangi sonuca ulaşılabilir?',
        metin: 'Bir fakültede 150 öğrencinin ders çalışma süresi ile proje puanı arasındaki ilişki incelenmiştir. Günde 3 saat ve üzeri çalışanların ortalaması 86, 1 saatten az çalışanların ortalaması ise 64 olarak bulunmuştur. Gruplar rastgele atanmamıştır.',
        temaTip: 'standart',
        kosullar: [
          { ad: '1 saatten az', deger: '64 puan', diyagram: 'saat1' },
          { ad: '1–3 saat', deger: '76 puan', diyagram: 'saat2' },
          { ad: '3+ saat', deger: '86 puan', diyagram: 'saat3' },
        ],
        soruBaslik: 'Bulguyu ve sınırlılığı yorumla', soruAlt: 'Analiz ve raporlama',
        soru1: 'Bu verilere dayanarak aşağıdaki ifadelerden hangisi doğrudan söylenebilir?',
        bagimsizSecenekler: [
          'Bu örneklemde günde 3+ saat çalışanların ortalama proje puanı 86, 1 saatten az çalışanların 64’tür.',
          'Ders çalışma süresi bütün insanlarda başarıyı kesin olarak belirleyen tek nedendir.',
          'Bu sonuç ilkokul öğrencileri için de tamamen geçerlidir.',
          '1 saatten az çalışanların hepsi dersten kalmıştır.',
        ],
        bagimsizDogru: 0,
        soru2: 'Bu çalışmanın raporunun “Sınırlılıklar” bölümünde aşağıdakilerden hangisi belirtilmelidir?',
        bagimliSecenekler: [
          'Grafik çubuklarının rengi turuncudur.',
          'Gruplar rastgele atanmadığı için neden–sonuç ilişkisi kurulamaz ve bulgu yalnızca bu fakülteyle sınırlıdır.',
          'Tüm fakülte öğrencileri aynı yaşta değildir.',
          'Rapor 5 sayfadan kısadır.',
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
    if (modulId === 'm2') {
      return {
        modulId: 'm2',
        modulAd: 'Araştırma problemi ve sorusu',
        kazanim: 'Verilen araştırma senaryosunda bağımsız ve bağımlı değişkenleri belirler.',
        slayt: window.SlaytSunum ? window.SlaytSunum.PROFILLER[0] : null,
        gorev: window.GorevPrototip ? window.GorevPrototip.SENARYOLAR[0] : null,
      };
    }
    return KONTROL_ICERIK[modulId] || KONTROL_ICERIK.m2;
  }

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

  /* ---------- 4. 4 Aşamalı Canlı Deney Üretim Hattı ---------- */
  async function uretDeneyIcerigi({ modul, profil, uretim, zorla }, onAdim) {
    const cacheKey = `${modul.id}::${profil.id}`;
    if (!zorla) {
      const mevcut = await cacheGet(cacheKey);
      if (mevcut) {
        onAdim && onAdim({ adim: 4, durum: 'onbellek', mesaj: 'Önbellekten yüklendi (images/ & audio/)' });
        return { ...mevcut, onbellekten: true };
      }
    }

    const kontrol = getKontrol(modul.id);
    const pSlug = slug(profil.kisaEtiket || profil.id);
    const keys = { claudeKey: uretim.claudeKey, geminiKey: uretim.geminiKey, ttsKey: uretim.ttsKey };

    /* ADIM 1: Senaryo ve yapılandırılmış slayt + mikro-görev üretimi */
    onAdim && onAdim({ adim: 1, durum: 'calisiyor', mesaj: `${uretim.senaryoModel} ile senaryo üretiliyor...` });
    const sys1 = `Sen eğitim teknolojileri ve araştırma yöntemleri alanında uzman bir öğretim tasarımcısısın.
Görevin: Kontrol grubunun standart içeriğiyle PEDAGOJİK VE BİLİŞSEL OLARAK BİREBİR EŞDEĞER, ancak öğrencinin ilgi profiline göre bağlamsallaştırılmış 5 slaytlık çözümlü örnek + 1 transfer mikro-görev üretmek.
Kurallar:
- Yalnızca geçerli JSON döndür, başka açıklama yazma.
- Öğrenme kazanımı, bilişsel talep, soru sayısı ve adım yapısı kontrol grubuyla aynı kalmalı; yalnızca senaryo bağlamı kişiselleştirilmeli.
- Çözümlü örnek ile mikro-görev AYNI ilgi alanı içinde ama FARKLI bir araştırma senaryosu (transfer) olmalı (ör. basketbolda çözümlü örnek hücum stratejisi ise mikro-görev paslaşma düzeni).
- Tüm metinler doğal, akıcı Türkçe olmalı; sayılar kurgusal ve gerçekçi olmalı.`;

    const usr1 = `MODÜL: ${modul.id.toUpperCase()} — ${modul.ad}
KAZANIM: ${kontrol.kazanim}

ÖĞRENCİ İLGİ PROFİLİ:
- Kategori / Alt alan: ${profil.kategori || ''} / ${profil.altKategori || ''}
- Etkileşim biçimleri: ${(profil.etkilesimler || []).join(', ')}
- Özgül ilgi: ${profil.ozgulKisa || ''} — ${profil.aciklama || ''}

KONTROL GRUBU REFERANS ŞABLONU (Eşdeğerlik için bunu örnek al):
Çözümlü örnek başlığı: ${kontrol.slayt.altBaslik}
Slayt 1 soru: ${kontrol.slayt.slaytlar[0].soru}
Slayt 2 koşullar (3 adet): ${JSON.stringify(kontrol.slayt.slaytlar[1].kosullar)}
Slayt 3 odak: ${kontrol.slayt.slaytlar[2].ustBaslik}
Slayt 4 odak: ${kontrol.slayt.slaytlar[3].ustBaslik}
Mikro-görev soru 1: ${kontrol.gorev.soru1 || 'Bağımsız değişken hangisidir?'}
Mikro-görev soru 2: ${kontrol.gorev.soru2 || 'Bağımlı değişken hangisidir?'}

AŞAĞIDAKİ TAM JSON ŞEMASINI ÜRET:
{
  "altBaslik": "Çözümlü örnek kısa başlığı (3-6 kelime)",
  "slaytlar": [
    {
      "ustBaslik": "Bir araştırma senaryosu",
      "altBaslik": "Kısa bağlam alt başlığı",
      "soru": "Net, sınanabilir araştırma sorusu?",
      "narration": "Slayt 1 için 15-20 sn konuşma metni (2 cümle)",
      "estimated_duration_seconds": 16
    },
    {
      "ustBaslik": "Araştırma nasıl yürütülüyor?",
      "altBaslik": "3 koşulun kısa başlığı",
      "kosullar": [
        { "ad": "Koşul 1", "deger": "72 birim" },
        { "ad": "Koşul 2", "deger": "64 birim" },
        { "ad": "Koşul 3", "deger": "80 birim" }
      ],
      "dipnot": "Örnek amaçlı kurgusal araştırma verileri",
      "narration": "Slayt 2 için 15-20 sn konuşma metni",
      "estimated_duration_seconds": 17
    },
    {
      "ustBaslik": "${kontrol.slayt.slaytlar[2].ustBaslik}",
      "altBaslik": "${kontrol.slayt.slaytlar[2].altBaslik}",
      "degisken": "Vurgulanan ana kavram / değişken",
      "seviyeler": ["Seviye/İlke 1", "Seviye/İlke 2", "Seviye/İlke 3"],
      "digerRef": "Referans notu (tek satır)",
      "narration": "Slayt 3 için 15 sn konuşma metni",
      "estimated_duration_seconds": 15
    },
    {
      "ustBaslik": "${kontrol.slayt.slaytlar[3].ustBaslik}",
      "altBaslik": "${kontrol.slayt.slaytlar[3].altBaslik}",
      "degisken": "Ölçülen sonuç / kavram",
      "oncekiRef": "Önceki adıma referans (tek satır)",
      "veri": [
        { "etiket": "Kısa 1", "deger": 72 },
        { "etiket": "Kısa 2", "deger": 64 },
        { "etiket": "Kısa 3", "deger": 80 }
      ],
      "narration": "Slayt 4 için 15 sn konuşma metni",
      "estimated_duration_seconds": 16
    },
    {
      "ustBaslik": "${kontrol.slayt.slaytlar[4].ustBaslik}",
      "altBaslik": "Çözümün özeti",
      "bagimsiz": "Sol özet kavram",
      "bagimli": "Sağ özet kavram",
      "ozetNot": "Tek cümlelik özet",
      "narration": "Slayt 5 için 14 sn özet konuşma metni",
      "estimated_duration_seconds": 14
    }
  ],
  "gorev": {
    "baslik": "Transfer mikro-görev sorusu (örn. Paslaşma düzeni asisti etkiler mi?)",
    "metin": "Transfer senaryosunun 2-3 cümlelik açıklaması",
    "kosullar": [
      { "ad": "Koşul A", "deger": "14" },
      { "ad": "Koşul B", "deger": "21" },
      { "ad": "Koşul C", "deger": "18" }
    ],
    "soru1": ${JSON.stringify(kontrol.gorev.soru1 || 'Bağımsız değişken hangisidir?')},
    "bagimsizSecenekler": ["Doğru cevap", "Çeldirici 1", "Çeldirici 2", "Çeldirici 3"],
    "bagimsizDogru": 0,
    "soru2": ${JSON.stringify(kontrol.gorev.soru2 || 'Bağımlı değişken hangisidir?')},
    "bagimliSecenekler": ["Çeldirici 1", "Doğru cevap", "Çeldirici 2", "Çeldirici 3"],
    "bagimliDogru": 1,
    "ipucuBagimsiz": "1. soru için açıklayıcı ipucu",
    "ipucuBagimli": "2. soru için açıklayıcı ipucu",
    "aciklamaDogru": "Her iki cevap doğru olduğunda gösterilecek açıklayıcı geri bildirim"
  }
}`;

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
    onAdim && onAdim({ adim: 1, durum: 'bitti', mesaj: `${uretim.senaryoModel} tamamlandı` });

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
      id: `deney-${modul.id}-${pSlug}`,
      eyebrow: `${modul.id.replace('m', 'MODÜL 0')} · MİKRO-GÖREV (CANLI API)`,
      altYazi: kontrol.gorev.altYazi,
      baslik: g.baslik,
      metin: g.metin,
      temaTip: temaTip === 'calisma' ? 'standart' : temaTip,
      image_path: `images/${modul.id}-${pSlug}-gorev.png`,
      image_data_url: gorevImg || undefined,
      audio_path: `audio/${modul.id}-${pSlug}-gorev.${sesExt(gorevAudioUrl)}`,
      audio_data_url: gorevAudioUrl || undefined,
      kosullar: (g.kosullar || []).map((k, idx) => ({
        ad: k.ad,
        deger: k.deger,
        diyagram: temaTip === 'basketbol' ? `saha${idx + 1}` : temaTip === 'kahve' ? `kahve${idx + 1}` : `saat${idx + 1}`,
      })),
      soru1: g.soru1 || kontrol.gorev.soru1,
      bagimsizSecenekler: g.bagimsizSecenekler || kontrol.gorev.bagimsizSecenekler,
      bagimsizDogru: Number.isInteger(g.bagimsizDogru) ? g.bagimsizDogru : 0,
      soru2: g.soru2 || kontrol.gorev.soru2,
      bagimliSecenekler: g.bagimliSecenekler || kontrol.gorev.bagimliSecenekler,
      bagimliDogru: Number.isInteger(g.bagimliDogru) ? g.bagimliDogru : 1,
      ipucuBagimsiz: g.ipucuBagimsiz || kontrol.gorev.ipucuBagimsiz,
      ipucuBagimli: g.ipucuBagimli || kontrol.gorev.ipucuBagimli,
      aciklamaDogru: g.aciklamaDogru || kontrol.gorev.aciklamaDogru,
    };

    const sonuc = {
      cacheKey,
      modulId: modul.id,
      profil,
      slayt: slaytObj,
      gorev: gorevObj,
      prompts: { slayt: gorselPromptSlayt, gorev: gorselPromptGorev },
      meta: {
        senaryoModel: uretim.senaryoModel,
        scriptModel: uretim.scriptModel,
        promptModel: uretim.promptModel,
        gorselModel: uretim.gorselModel,
        sesModel: ttsSay > 0 ? uretim.sesModel : 'Tarayıcı TTS',
        gorselNot,
        ttsNot,
        tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    };
    await cacheSet(cacheKey, sonuc);
    return sonuc;
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

  return { getKontrol, cacheGet, cacheDel, uretDeneyIcerigi, dosyalaraKaydet };
})();
