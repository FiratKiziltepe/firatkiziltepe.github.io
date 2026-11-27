/* Seslendirilmiş etkileşimli çözümlü örnek (Slides & Narration) bileşeni ve yapılandırılmış slayt verileri. */
window.SlaytSunum = (() => {
  'use strict';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Yapılandırılmış 5 adımlı çözümlü örnekler (Modül 2 — Bağımlı ve bağımsız değişkenler)
     Standart kontrol ve kişiselleştirilmiş deney profilleri birebir eşdeğer pedagojik şablonu paylaşır. */
  const PROFILLER = [
    {
      id: 'standart',
      etiket: 'Kontrol grubu — Standart içerik',
      kisa: 'Standart (Kontrol)',
      altBaslik: 'Ders çalışma süresi ve sınav başarısı',
      sureToplam: '78 sn',
      temaTip: 'calisma',
      slaytlar: [
        {
          slide_id: 1,
          slide_type: 'scenario_scene',
          kisaAd: '1. Senaryo',
          ikon: 'odul',
          ustBaslik: 'Bir araştırma senaryosu',
          altBaslik: 'Üniversitede ders çalışma süreleri',
          soru: 'Çalışma süresi öğrencilerin test başarısını etkiler mi?',
          image_path: 'images/m2-standart-s1.png',
          audio_path: 'audio/m2-standart-s1.mp3',
          narration: 'Bir araştırmacı, farklı çalışma sürelerinin üniversite öğrencilerinin test başarıları üzerindeki etkisini incelemek istemektedir. Öğrenciler rastgele üç gruba ayrılmıştır.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 2,
          slide_type: 'condition_cards',
          kisaAd: '2. Araştırma',
          ikon: 'izgara',
          ustBaslik: 'Araştırma nasıl yürütülüyor?',
          altBaslik: 'Üç farklı çalışma süresi',
          kosullar: [
            { ad: '15 dakika', deger: '68 puan', diyagram: 'saat1' },
            { ad: '30 dakika', deger: '76 puan', diyagram: 'saat2' },
            { ad: '45 dakika', deger: '84 puan', diyagram: 'saat3' },
          ],
          dipnot: 'Örnek amaçlı kurgusal test sonuçları',
          audio_path: 'audio/m2-standart-s2.mp3',
          narration: 'Gruplara sırasıyla on beş, otuz ve kırk beş dakika çalışma süresi verilmiş, ardından tüm öğrencilere aynı başarı testi uygulanmıştır.',
          estimated_duration_seconds: 17,
        },
        {
          slide_id: 3,
          slide_type: 'independent_var',
          kisaAd: '3. Bağımsız değişken',
          ikon: 'dal',
          ustBaslik: 'Bağımsız değişkeni belirleyelim',
          altBaslik: 'Araştırmacının değiştirdiği unsur',
          degisken: 'Çalışma süresi',
          seviyeler: ['15 dakika', '30 dakika', '45 dakika'],
          digerRef: 'Ölçülen sonuç: Başarı testinden alınan puan',
          audio_path: 'audio/m2-standart-s3.mp3',
          narration: 'Araştırmacının gruplar arasında bilerek değiştirdiği unsur çalışma süresidir. Bu nedenle çalışma süresi bağımsız değişkendir.',
          estimated_duration_seconds: 15,
        },
        {
          slide_id: 4,
          slide_type: 'dependent_var',
          kisaAd: '4. Bağımlı değişken',
          ikon: 'grafik',
          ustBaslik: 'Bağımlı değişkeni belirleyelim',
          altBaslik: 'Araştırmacının ölçtüğü sonuç',
          degisken: 'Başarı testinden alınan puan',
          oncekiRef: 'Değiştirilen unsur: Çalışma süresi',
          veri: [
            { etiket: '15 dk', deger: 68 },
            { etiket: '30 dk', deger: 76 },
            { etiket: '45 dk', deger: 84 },
          ],
          audio_path: 'audio/m2-standart-s4.mp3',
          narration: 'Çalışma süresindeki değişime bağlı olarak ölçülen sonuç ise başarı testinden alınan puandır. Dolayısıyla test puanı bağımlı değişkendir.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 5,
          slide_type: 'summary_relation',
          kisaAd: '5. Özet',
          ikon: 'tik',
          ustBaslik: 'Araştırmanın değişkenleri',
          altBaslik: 'Çözümün özeti',
          bagimsiz: 'Çalışma süresi',
          bagimli: 'Test puanı',
          ozetNot: 'Bir değişkeni değiştiriyor, diğerindeki sonucu ölçüyoruz.',
          audio_path: 'audio/m2-standart-s5.mp3',
          narration: 'Özetle araştırmacı bağımsız değişken olan çalışma süresini değiştirir ve bağımlı değişken olan test puanındaki sonucu ölçer.',
          estimated_duration_seconds: 14,
        },
      ],
    },
    {
      id: 'basketbol',
      etiket: 'Deney grubu — Basketbol / EuroLeague (Öğrenci 1)',
      kisa: 'Basketbol (EuroLeague)',
      altBaslik: "EuroLeague'de hücum performansı",
      sureToplam: '78 sn',
      temaTip: 'basketbol',
      slaytlar: [
        {
          slide_id: 1,
          slide_type: 'scenario_scene',
          kisaAd: '1. Senaryo',
          ikon: 'odul',
          ustBaslik: 'Bir araştırma senaryosu',
          altBaslik: "EuroLeague'de hücum performansı",
          soru: 'Hücum stratejisi takım performansını etkiler mi?',
          image_path: 'images/m2-basketbol-s1.png',
          audio_path: 'audio/m2-basketbol-s1.mp3',
          narration: 'Bir spor analisti, EuroLeague maçlarında uygulanan farklı hücum stratejilerinin basketbol takımlarının sayı üretimi üzerindeki etkisini incelemek istemektedir.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 2,
          slide_type: 'condition_cards',
          kisaAd: '2. Araştırma',
          ikon: 'izgara',
          ustBaslik: 'Araştırma nasıl yürütülüyor?',
          altBaslik: 'Üç farklı hücum stratejisi',
          kosullar: [
            { ad: 'Hızlı hücum', deger: '72 sayı', diyagram: 'saha1' },
            { ad: 'Set hücumu', deger: '64 sayı', diyagram: 'saha2' },
            { ad: 'Karma hücum', deger: '80 sayı', diyagram: 'saha3' },
          ],
          dipnot: 'Örnek amaçlı kurgusal maç sonuçları',
          audio_path: 'audio/m2-basketbol-s2.mp3',
          narration: 'Aynı oyuncularla eşit süreli ve kontrollü deneme maçlarında hızlı hücum, set hücumu ve karma hücum stratejileri uygulanarak toplam sayılar kaydedilmiştir.',
          estimated_duration_seconds: 17,
        },
        {
          slide_id: 3,
          slide_type: 'independent_var',
          kisaAd: '3. Bağımsız değişken',
          ikon: 'dal',
          ustBaslik: 'Bağımsız değişkeni belirleyelim',
          altBaslik: 'Araştırmacının değiştirdiği unsur',
          degisken: 'Hücum stratejisi',
          seviyeler: ['Hızlı hücum', 'Set hücumu', 'Karma hücum'],
          digerRef: 'Ölçülen sonuç: Atılan toplam sayı',
          audio_path: 'audio/m2-basketbol-s3.mp3',
          narration: 'Analistin deneme maçları arasında değiştirdiği unsur hücum stratejisidir. Bu nedenle uygulanan hücum stratejisi bağımsız değişkendir.',
          estimated_duration_seconds: 15,
        },
        {
          slide_id: 4,
          slide_type: 'dependent_var',
          kisaAd: '4. Bağımlı değişken',
          ikon: 'grafik',
          ustBaslik: 'Bağımlı değişkeni belirleyelim',
          altBaslik: 'Araştırmacının ölçtüğü sonuç',
          degisken: 'Atılan toplam sayı',
          oncekiRef: 'Değiştirilen unsur: Hücum stratejisi',
          veri: [
            { etiket: 'Hızlı', deger: 72 },
            { etiket: 'Set', deger: 64 },
            { etiket: 'Karma', deger: 80 },
          ],
          audio_path: 'audio/m2-basketbol-s4.mp3',
          narration: 'Farklı hücum stratejilerinin etkisini görmek için ölçülen çıktı atılan toplam sayıdır. Dolayısıyla atılan toplam sayı bağımlı değişkendir.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 5,
          slide_type: 'summary_relation',
          kisaAd: '5. Özet',
          ikon: 'tik',
          ustBaslik: 'Araştırmanın değişkenleri',
          altBaslik: 'Çözümün özeti',
          bagimsiz: 'Hücum stratejisi',
          bagimli: 'Atılan toplam sayı',
          ozetNot: 'Bir değişkeni değiştiriyor, diğerindeki sonucu ölçüyoruz.',
          audio_path: 'audio/m2-basketbol-s5.mp3',
          narration: 'Özetle araştırmacı bağımsız değişken olan hücum stratejisini değiştirir ve bağımlı değişken olan toplam sayı üzerindeki etkisini ölçer.',
          estimated_duration_seconds: 14,
        },
      ],
    },
    {
      id: 'kahve',
      etiket: 'Deney grubu — V60 Filtre Kahve (Öğrenci 5)',
      kisa: 'Kahve (V60 Demleme)',
      altBaslik: 'V60 demlemede su sıcaklığı ve lezzet',
      sureToplam: '78 sn',
      temaTip: 'kahve',
      slaytlar: [
        {
          slide_id: 1,
          slide_type: 'scenario_scene',
          kisaAd: '1. Senaryo',
          ikon: 'odul',
          ustBaslik: 'Bir araştırma senaryosu',
          altBaslik: 'V60 filtre kahve demleme',
          soru: 'Demleme suyu sıcaklığı kahvenin tadım beğenisini etkiler mi?',
          image_path: 'images/m2-kahve-s1.png',
          audio_path: 'audio/m2-kahve-s1.mp3',
          narration: 'Bir gıda araştırmacısı, V60 ile filtre kahve hazırlarken kullanılan farklı su sıcaklıklarının kahvenin tadım beğeni puanı üzerindeki etkisini incelemek istemektedir.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 2,
          slide_type: 'condition_cards',
          kisaAd: '2. Araştırma',
          ikon: 'izgara',
          ustBaslik: 'Araştırma nasıl yürütülüyor?',
          altBaslik: 'Üç farklı demleme sıcaklığı',
          kosullar: [
            { ad: '88°C su', deger: '74 puan', diyagram: 'kahve1' },
            { ad: '92°C su', deger: '86 puan', diyagram: 'kahve2' },
            { ad: '96°C su', deger: '79 puan', diyagram: 'kahve3' },
          ],
          dipnot: 'Örnek amaçlı kurgusal tadım puanları',
          audio_path: 'audio/m2-kahve-s2.mp3',
          narration: 'Aynı kahve çekirdeği ve demleme süresi sabit tutulup 88, 92 ve 96 derece su sıcaklıklarında demleme yapılarak katılımcıların beğeni puanları kaydedilmiştir.',
          estimated_duration_seconds: 17,
        },
        {
          slide_id: 3,
          slide_type: 'independent_var',
          kisaAd: '3. Bağımsız değişken',
          ikon: 'dal',
          ustBaslik: 'Bağımsız değişkeni belirleyelim',
          altBaslik: 'Araştırmacının değiştirdiği unsur',
          degisken: 'Demleme su sıcaklığı',
          seviyeler: ['88°C su', '92°C su', '96°C su'],
          digerRef: 'Ölçülen sonuç: Tadım beğeni puanı',
          audio_path: 'audio/m2-kahve-s3.mp3',
          narration: 'Araştırmacının demlemeler arasında bilerek değiştirdiği unsur su sıcaklığıdır. Bu nedenle demleme su sıcaklığı bağımsız değişkendir.',
          estimated_duration_seconds: 15,
        },
        {
          slide_id: 4,
          slide_type: 'dependent_var',
          kisaAd: '4. Bağımlı değişken',
          ikon: 'grafik',
          ustBaslik: 'Bağımlı değişkeni belirleyelim',
          altBaslik: 'Araştırmacının ölçtüğü sonuç',
          degisken: 'Tadım beğeni puanı',
          oncekiRef: 'Değiştirilen unsur: Demleme su sıcaklığı',
          veri: [
            { etiket: '88°C', deger: 74 },
            { etiket: '92°C', deger: 86 },
            { etiket: '96°C', deger: 79 },
          ],
          audio_path: 'audio/m2-kahve-s4.mp3',
          narration: 'Sıcaklık değişimine bağlı olarak katılımcılardan ölçülen sonuç tadım beğeni puanıdır. Dolayısıyla tadım beğeni puanı bağımlı değişkendir.',
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 5,
          slide_type: 'summary_relation',
          kisaAd: '5. Özet',
          ikon: 'tik',
          ustBaslik: 'Araştırmanın değişkenleri',
          altBaslik: 'Çözümün özeti',
          bagimsiz: 'Su sıcaklığı',
          bagimli: 'Tadım beğeni puanı',
          ozetNot: 'Bir değişkeni değiştiriyor, diğerindeki sonucu ölçüyoruz.',
          audio_path: 'audio/m2-kahve-s5.mp3',
          narration: 'Özetle araştırmacı bağımsız değişken olan su sıcaklığını değiştirir ve bağımlı değişken olan tadım beğeni puanını ölçer.',
          estimated_duration_seconds: 14,
        },
      ],
    },
  ];

  /* 6 Simüle Edilmiş Öğrenci İlgi Profili (o1..o6) için Tüm Modüllerde (m1..m6) Kullanılan Hazır Deneysel Bağlamlar */
  const JURI_DENEY_BAGLAMLAR = {
    o1: {
      id: 'o1',
      etiket: 'Öğrenci 1 — Basketbol (İzleyici · EuroLeague)',
      kisa: 'Basketbol (EuroLeague)',
      temaTip: 'basketbol',
      c: {
        tema: "EuroLeague'de hücum stratejileri ve sayı üretimi",
        gozlem: 'EuroLeague maçlarını izlerken hızlı hücum oynayan takımların set hücumuna göre daha yüksek sayı ürettiğini, ancak karma hücum kullanan takımların hücum verimliliğinin zirveye çıktığını gözlemliyorsun.',
        gorus: 'Hızlı hücum oynayan takım her maçı kesin kazanır.',
        zayif: 'Basketbolda hangi taktik daha iyidir?',
        soru: 'EuroLeague deneme maçlarında uygulanan hücum stratejisi (hızlı, set, karma), takımın maç başına attığı toplam sayıyı etkiler mi?',
        bagimsiz: 'Uygulanan hücum stratejisi',
        bagimli: 'Maç başına atılan toplam sayı',
        kontrol: ['Maç süresi (40 dk)', 'Oyuncu kadrosu', 'Rakip savunma sertliği'],
        evren: 'EuroLeague sezonunda oynanan 300 karşılaşma',
        birim: 'maç',
        tabakalar: ['Normal Sezon', 'Play-Off Serisi', 'Final Four'],
        arac: 'Resmî EuroLeague maç istatistik formu ve hücum dizilimi video kodlama çizelgesi',
        nitel: 'Başantrenörler maçın kritik anlarında hücum stratejisini değiştirme kararını nasıl deneyimliyor?',
        karma: 'Önce 300 maçın hücum stratejisi ve sayı verileri istatistiksel olarak karşılaştırılır, ardından 8 başantrenörle taktik kararları üzerine görüşülür.',
        etik: 'Takımların kamuya açık olmayan antrenman içi taktik analiz kayıtları kulüp izni olmadan paylaşılmaz.',
        gecersiz: 'Takımın hücum verimliliğini ölçmek için atılan sayı yerine yalnızca forma satış rakamlarına bakılması',
        guvenilmez: 'İki farklı maç analistinin aynı maçı izlediğinde hızlı hücum sayılarını birbirinden tamamen farklı kaydetmesi',
        veri: { etiket: ['Set hücumu', 'Hızlı hücum', 'Karma hücum'], deger: [64, 72, 80], olcu: 'Maç başına ortalama sayı' },
        bulgu: 'Karma hücum stratejisi uygulanan maçlarda ortalama sayı üretimi 80 iken, hızlı hücumda 72, yalnızca set hücumunda 64 sayıdır.',
      },
    },
    o2: {
      id: 'o2',
      etiket: 'Öğrenci 2 — Basketbol (Oyuncu · Şut Antrenmanı)',
      kisa: 'Basketbol (Oyuncu)',
      temaTip: 'basketbol_oyuncu',
      c: {
        tema: 'Üç sayılık şut antrenmanı süresi ve atış isabeti',
        gozlem: 'Üniversite takımı antrenmanlarından sonra 45 dakika ekstra üç sayılık şut çalışan oyuncuların maçlarda 15 dakika çalışanlara göre çok daha yüksek isabet bulduğunu fark ediyorsun.',
        gorus: 'Doğuştan şutör olmayan oyuncu ne kadar çalışsa da üçlük atamaz.',
        zayif: 'Çok antrenman yapmak şutu geliştirir mi?',
        soru: 'Üniversite basketbol oyuncularında günlük üç sayılık şut antrenmanı süresi (15, 30, 45 dk), 20 denemedeki başarılı atış sayısını etkiler mi?',
        bagimsiz: 'Üç sayılık şut antrenmanı süresi',
        bagimli: '20 denemedeki başarılı üç sayılık atış sayısı',
        kontrol: ['Atış mesafesi (6,75 m)', 'Kullanılan top', 'Antrenman salonu'],
        evren: 'Üniversite basketbol liginde mücadele eden 300 oyuncu',
        birim: 'oyuncu',
        tabakalar: ['Oyun Kurucu (Guard)', 'Kanat (Forvet)', 'Uzun (Pivot)'],
        arac: 'Standart 20 atışlık üç sayı performans testi ve haftalık antrenman süre çizelgesi',
        nitel: 'Oyuncular art arda kaçan şutlardan sonra atış özgüvenlerini ve odaklarını nasıl yeniden topluyor?',
        karma: 'Önce 90 oyuncunun antrenman süresi ve 20 atışlık test sonuçları karşılaştırılır, ardından isabeti en çok artan ve değişmeyen 8 oyuncuyla görüşülür.',
        etik: 'Oyuncuların şut testi ve yorgunluk verileri kadro seçimi için kullanılmaz; bilgilendirilmiş onam alınarak kodlarla raporlanır.',
        gecersiz: 'Üç sayılık şut isabetini ölçmek için 6,75 m çizgisi yerine yalnızca pota altı turnike atışlarının sayılması',
        guvenilmez: 'Aynı oyuncunun salon ışıkları ve pota yüksekliği standart olmadığı için sabah 16, akşam 5 isabet bulması',
        veri: { etiket: ['15 dk şut', '30 dk şut', '45 dk şut'], deger: [9, 13, 16], olcu: '20 atışta ortalama isabet' },
        bulgu: 'Günde 45 dakika üçlük çalışan grubun 20 atıştaki ortalama isabeti 16 iken, 30 dakika çalışanların 13, 15 dakika çalışanların 9’dur.',
      },
    },
    o3: {
      id: 'o3',
      etiket: 'Öğrenci 3 — Strateji Oyunları (Age of Empires IV)',
      kisa: 'Strateji (AoE IV)',
      temaTip: 'oyun',
      c: {
        tema: 'Age of Empires IV kaynak toplama stratejisi ve ekonomi hızı',
        gozlem: 'Age of Empires IV karşılaşmalarında işçileri başlangıçta dengeli dağıtan oyuncuların, yalnızca tek kaynağa yüklenen oyunculara göre 15. dakikada çok daha güçlü bir ekonomiye ulaştığını görüyorsun.',
        gorus: 'Strateji oyunlarında sadece hızlı tıklayan oyuncu her zaman kazanır.',
        zayif: 'Age of Empires IV’te en iyi taktik hangisidir?',
        soru: 'Age of Empires IV oyununda uygulanan başlangıç kaynak stratejisi (odun odaklı, altın odaklı, dengeli dağılım), ilk 15 dakikada toplanan toplam kaynak miktarını etkiler mi?',
        bagimsiz: 'Başlangıç kaynak toplama stratejisi',
        bagimli: 'İlk 15 dakikada toplanan toplam kaynak miktarı',
        kontrol: ['Oynanan harita (Dry Arabia)', 'Medeniyet seçimi', 'Oyuncu sıralama puanı (ELO)'],
        evren: 'Üniversite strateji oyunları topluluğundaki 300 Age of Empires IV karşılaşması',
        birim: 'karşılaşma',
        tabakalar: ['Bronz-Gümüş Lig', 'Altın-Platin Lig', 'Elmas+ Lig'],
        arac: 'Oyun sonu tekrar kaydı (replay) 15. dakika ekonomi sayacı ve kaynak dökümü tablosu',
        nitel: 'Strateji oyuncuları rakibin erken baskısı altında kaynak dağılımı kararlarını nasıl değiştiriyor?',
        karma: 'Önce 120 karşılaşmanın 15. dakika kaynak verileri analiz edilir, ardından farklı liglerden 9 oyuncuyla karar süreçleri üzerine görüşülür.',
        etik: 'Oyuncuların hesap adları ve oyun içi sohbet kayıtları gizlenir; yalnızca izin verilen maç tekrarlarının anonim kaynak sayıları kullanılır.',
        gecersiz: 'Oyuncunun ekonomik kaynak toplama başarısını ölçmek için toplanan kaynak yerine yalnızca harita yakınlaştırma sayısına bakılması',
        guvenilmez: 'Oyun içi kronometre farklı hız ayarlarında (1x vs 1.5x) çalıştırıldığı için aynı stratejide tutarsız kaynak puanları kaydedilmesi',
        veri: { etiket: ['Tek kaynak', 'Altın ağırlıklı', 'Dengeli dağılım'], deger: [8400, 10200, 12100], olcu: '15. dk ortalama toplam kaynak' },
        bulgu: 'Dengeli kaynak dağılımı stratejisinde 15. dakika ortalama kaynak miktarı 12.100 iken, altın ağırlıklıda 10.200, tek kaynak odaklıda 8.400’dür.',
      },
    },
    o4: {
      id: 'o4',
      etiket: 'Öğrenci 4 — Enstrüman Çalmak (Akustik Gitar)',
      kisa: 'Müzik (Akustik Gitar)',
      temaTip: 'muzik',
      c: {
        tema: 'Akustik gitarda çalışma yöntemi ve hatasız çalma başarısı',
        gozlem: 'Akustik gitarda yeni bir parçayı baştan sona hızlıca çalmaya çalışanlara göre, zor ölçüleri bölümlere ayırıp metronomla yavaş çalışanların parçayı çok daha az hatayla çaldığını fark ediyorsun.',
        gorus: 'Müzik kulağı olan kişi hiç pratik yapmadan da her parçayı hatasız çalar.',
        zayif: 'Gitar çalmayı öğrenmek neden zordur?',
        soru: 'Akustik gitar öğrencilerinde uygulanan pratik yöntemi (serbest tekrar, kayda eşlik, bölümlere ayırarak metronomla çalışma), yeni parçada doğru basılan nota sayısını etkiler mi?',
        bagimsiz: 'Uygulanan gitar pratik yöntemi',
        bagimli: 'Parçada doğru basılan nota sayısı (80 nota üzerinden)',
        kontrol: ['Çalışılan parça (Aynı etüt)', 'Toplam çalışma süresi (30 dk)', 'Gitar tel yüksekliği'],
        evren: 'Üniversite müzik kulübü ve konservatuvar hazırlık kursundaki 300 akustik gitar öğrencisi',
        birim: 'öğrenci',
        tabakalar: ['Başlangıç (0–6 ay)', 'Orta Düzey (6–18 ay)', 'İleri Düzey (18+ ay)'],
        arac: '80 notalık standart gitar etüdü performans kontrol listesi ve metronom ses kaydı analizi',
        nitel: 'Gitar öğrencileri zor bir bare akor geçişinde yaşadıkları fiziksel yorgunluk ve motivasyon kaybıyla nasıl başa çıkıyor?',
        karma: 'Önce 90 öğrencinin üç pratik yöntemindeki doğru nota sayıları karşılaştırılır, ardından 8 öğrenciyle pratik deneyimleri üzerine görüşülür.',
        etik: 'Öğrencilerin performans ses kayıtları izinleri olmadan paylaşılmaz ve değerlendirme sonuçları kulüp seçmelerini etkilemez.',
        gecersiz: 'Öğrencinin parçayı doğru çalma becerisini ölçmek için bastığı notalar yerine yalnızca gitarının ahşap kalitesine puan verilmesi',
        guvenilmez: 'İki farklı müzik eğitmeninin önceden belirlenmiş bir nota anahtarı olmadan aynı performansa 45 ve 76 gibi çelişkili puanlar vermesi',
        veri: { etiket: ['Serbest tekrar', 'Kayda eşlik', 'Bölümlü+Metronom'], deger: [56, 65, 74], olcu: '80 notada ortalama doğru nota' },
        bulgu: 'Parçayı bölümlere ayırarak metronomla çalışan grubun ortalaması 74 doğru nota iken, kayda eşlik edenlerin 65, serbest tekrar yapanların 56’dır.',
      },
    },
    o5: {
      id: 'o5',
      etiket: 'Öğrenci 5 — Kahve ve Çay (V60 Filtre Kahve)',
      kisa: 'Kahve (V60 Demleme)',
      temaTip: 'kahve',
      c: {
        tema: 'V60 demlemede su sıcaklığı ve tadım beğeni puanı',
        gozlem: 'Evde V60 ile filtre kahve demlerken kaynar suyu doğrudan döktüğünde kahvenin acılaştığını, 92°C civarında demlediğinde ise meyvemsi ve dengeli aromaların öne çıktığını gözlemliyorsun.',
        gorus: 'Pahalı kahve çekirdeği hangi sıcaklıkla demlenirse demlensin mükemmel tat verir.',
        zayif: 'En lezzetli kahve nasıl yapılır?',
        soru: 'V60 filtre kahve demlemede kullanılan su sıcaklığı (88°C, 92°C ve 96°C), katılımcıların 100 üzerinden verdiği tadım beğeni puanını etkiler mi?',
        bagimsiz: 'Demlemede kullanılan su sıcaklığı',
        bagimli: 'Kahvenin tadım beğeni puanı (100 üzerinden)',
        kontrol: ['Kahve çekirdeği (Aynı yöre)', 'Öğütme derecesi', 'Demleme süresi (3 dk)'],
        evren: 'Şehirdeki 3. nesil kahve atölyelerine katılan 300 nitelikli kahve tüketicisi',
        birim: 'katılımcı',
        tabakalar: ['Sade Filtre İçenler', 'Espresso Bazlı İçenler', 'Soğuk Demleme Sevenler'],
        arac: 'Kör tadım (blind cupping) duyusal değerlendirme formu ve dijital ısı ölçer kaydı',
        nitel: 'Kahve severler sabah ilk fincan V60 kahveyi hazırlama ritüelini günlük odaklanmaları açısından nasıl anlamlandırıyor?',
        karma: 'Önce 90 katılımcının üç farklı su sıcaklığındaki kör tadım puanları analiz edilir, ardından 9 katılımcıyla aroma algıları üzerine görüşülür.',
        etik: 'Katılımcıların kafein hassasiyeti ve alerji durumları tadım öncesinde sorulur, bilgilendirilmiş onam alınır ve kör tadım kodları gizli tutulur.',
        gecersiz: 'Kahvenin lezzet ve aroma kalitesini ölçmek için tadım puanı yerine yalnızca fincanın renginin sorulması',
        guvenilmez: 'Demleme suyu sıcaklığı kalibre edilmemiş bozuk bir termometreyle ölçüldüğü için aynı tarifte her seferinde farklı tat çıkması',
        veri: { etiket: ['88°C su', '92°C su', '96°C su'], deger: [74, 86, 79], olcu: 'Ortalama tadım beğeni puanı' },
        bulgu: '92°C suyla demlenen V60 kahvenin ortalama tadım beğeni puanı 86 iken, 96°C demlemenin 79, 88°C demlemenin ise 74 puandır.',
      },
    },
    o6: {
      id: 'o6',
      etiket: 'Öğrenci 6 — Resim ve Çizim (Dijital Portre)',
      kisa: 'Sanat (Dijital Çizim)',
      temaTip: 'sanat',
      c: {
        tema: 'Dijital portre çiziminde katman tekniği ve oran doğruluğu',
        gozlem: 'Grafik tabletle portre çizerken eskiz, ışık ve rengi ayrı katmanlarda (layer) kuran çizerlerin, tek katmanda çalışanlara göre yüz oranlarını çok daha doğru ve hızlı tamamladığını görüyorsun.',
        gorus: 'Dijital çizimde kullanılan tablet pahalıysa çizim kendiliğinden kusursuz olur.',
        zayif: 'Dijital çizim geleneksel çizimden daha mı kolaydır?',
        soru: 'Grafik tabletle dijital portre çizerken kullanılan katman tekniği (tek katman, üç aşamalı katman, referans ızgaralı katman), portre oran-orantı doğruluk puanını etkiler mi?',
        bagimsiz: 'Kullanılan dijital çizim katman tekniği',
        bagimli: 'Portre oran-orantı doğruluk puanı (100 üzerinden)',
        kontrol: ['Çizilen referans portre', 'Çizim süresi (45 dk)', 'Kullanılan fırça seti'],
        evren: 'Güzel sanatlar ve tasarım fakültelerinde grafik tablet kullanan 300 öğrenci',
        birim: 'öğrenci',
        tabakalar: ['İllüstrasyon', 'Görsel İletişim Tasarımı', 'Animasyon & Oyun Sanatı'],
        arac: 'Standart anatomik oran-orantı değerlendirme rubriği ve çizim yazılımı katman geçmişi kaydı',
        nitel: 'Dijital çizerler boş tuval karşısında ilk eskiz çizgilerini atarken yaşadıkları yaratıcı tıkanıklığı nasıl aşıyor?',
        karma: 'Önce 90 öğrencinin üç katman tekniğindeki doğruluk puanları karşılaştırılır, ardından 9 öğrenciyle çizim süreçleri üzerine görüşülür.',
        etik: 'Öğrencilerin ürettiği dijital portrelerin telif hakkı kendilerine aittir; yalnızca anonimleştirilmiş rubrik puanları araştırmada kullanılır.',
        gecersiz: 'Portredeki anatomik oran-orantı doğruluğunu ölçmek için yüz oranları yerine yalnızca dosya boyutuna (MB) bakılması',
        guvenilmez: 'Aynı dijital portreyi iki jüri üyesinin ortak bir rubrik kullanmadan tamamen kişisel zevklerine göre 50 ve 92 olarak puanlaması',
        veri: { etiket: ['Tek katman', '3 aşamalı katman', 'Izgaralı katman'], deger: [68, 82, 87], olcu: 'Ortalama oran-orantı puanı' },
        bulgu: 'Referans ızgaralı katman tekniğini kullanan grubun ortalama doğruluk puanı 87, üç aşamalı katman grubunun 82, tek katman grubunun 68’dir.',
      },
    },
  };

  function getDeneySlayt(modulId = 'm2', profilId = 'o1') {
    const p = JURI_DENEY_BAGLAMLAR[profilId] || JURI_DENEY_BAGLAMLAR.o1;
    const uret = baglamdanUret({
      ilgi: { id: p.temaTip, ad: p.kisa },
      alt: { id: profilId, ad: p.etiket },
      c: p.c,
    }, modulId);
    uret.id = `deney-${modulId}-${profilId}`;
    uret.etiket = p.etiket;
    uret.kisa = p.kisa;
    uret.temaTip = p.temaTip;
    return uret;
  }
  /* Öğrenci ders ekranında (#ders-mX-ornek) veya modül geçişlerinde
     modülün konusuna (m1..m6) ve öğrencinin ilgi bağlamına (b) özgü 5 slaytlık farklı şablonlar üretir. */
  function baglamdanUret(b, modulId = 'm2') {
    if (modulId === 'm2' && b.alt && b.alt.id === 'spor.basketbol') return PROFILLER[1];
    if (modulId === 'm2' && b.alt && b.alt.id === 'yemek.kahve') return PROFILLER[2];
    const c = b.c, et = c.veri.etiket, dg = c.veri.deger;
    const slugId = b.alt ? b.alt.id.replace(/\./g, '-') : 'genel';
    const temaTip = b.ilgi ? b.ilgi.id : 'genel';
    const baz = {
      id: `${modulId}-${slugId}`,
      modulId,
      etiket: b.alt ? `${b.alt.ad} (${modulId.toUpperCase()})` : 'Kişiselleştirilmiş bağlam',
      kisa: b.alt ? b.alt.ad : 'Seçili bağlam',
      altBaslik: c.tema,
      sureToplam: '78 sn',
      temaTip,
    };

    if (modulId === 'm1') {
      return {
        ...baz,
        sablonAd: 'Gözlemden Bilimsel Döngüye & Etiğe',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Gözlem', ikon: 'odul',
            ustBaslik: 'Günlük bir gözlemle başla', altBaslik: c.tema, soru: c.gozlem,
            image_path: `images/m1-${slugId}-s1.png`, audio_path: `audio/m1-${slugId}-s1.mp3`,
            narration: `Her bilimsel araştırma merak uyandıran bir gözlemle başlar: ${c.gozlem}`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'claim_vs_testable', kisaAd: '2. Sınanabilirlik', ikon: 'izgara',
            ustBaslik: 'Gündelik görüşten sınanabilir soruya', altBaslik: 'Bilimsel iddianın ölçütleri',
            gorusBaslik: 'Gündelik Görüş (Sınanamaz)',
            gorusMetin: c.gorus,
            gorusNeden: 'Öznel yargı içerir; kimin, hangi koşulda ve hangi ölçümle karşılaştırılacağı belirsizdir.',
            bilimselBaslik: 'Bilimsel Araştırma Sorusu (Sınanabilir)',
            bilimselMetin: c.soru,
            kriterler: [`Karşılaştırılan: ${c.bagimsiz}`, `Ölçülen çıktı: ${c.bagimli}`, `Hedef grup: ${c.evren}`],
            audio_path: `audio/m1-${slugId}-s2.mp3`,
            narration: `"${c.gorus}" ifadesi kişisel bir kanaattir. Oysa "${c.soru}" sorusu ölçülebilir değişkenler tanımladığı için bilimsel olarak sınanabilir.`,
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 3, slide_type: 'process_timeline', kisaAd: '3. Araştırma Döngüsü', ikon: 'dal',
            ustBaslik: 'Sistemli araştırma adımları', altBaslik: 'Gözlemden kanıta uzanan 4 aşama',
            adimlar: [
              { no: '01', baslik: 'Soru & Hipotez', aciklama: c.soru },
              { no: '02', baslik: 'Örneklem & Veri', aciklama: `${c.evren} içinden ${c.arac} ile veri toplanması` },
              { no: '03', baslik: 'Analiz & Bulgu', aciklama: `${et.join(', ')} gruplarının (${c.veri.olcu}) karşılaştırılması` },
              { no: '04', baslik: 'Açık Raporlama', aciklama: c.bulgu },
            ],
            audio_path: `audio/m1-${slugId}-s3.mp3`,
            narration: 'Soru netleştikten sonra araştırmacı sistemli biçimde veri toplar, grupları analiz eder ve bulguları şeffafça raporlar.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 4, slide_type: 'ethics_pillars', kisaAd: '4. Bilimsel Etik', ikon: 'grafik',
            ustBaslik: 'Bilimsel etik ve katılımcı hakları', altBaslik: 'Veri toplarken uyulması gereken ilkeler',
            etikSenaryo: c.etik,
            ilkeler: [
              { baslik: 'Bilgilendirilmiş Onam', aciklama: `Katılımcılara çalışmanın amacı (${c.tema}) açıklanır ve gönüllü onayları alınır.` },
              { baslik: 'Gizlilik & Anonimlik', aciklama: c.etik },
              { baslik: 'Dürüst & Açık Bilim', aciklama: 'Beklentiyi desteklemese bile tüm ölçümler çarpıtılmadan raporlanır.' },
            ],
            audio_path: `audio/m1-${slugId}-s4.mp3`,
            narration: `Bilimsel araştırmada doğruluk kadar etik sorumluluk da esastır. ${c.etik}`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Sentez', ikon: 'tik',
            ustBaslik: 'Bilimsel araştırmanın temeli', altBaslik: 'Çözümün özeti',
            solEtiket: 'Başlangıç Noktası', bagimsiz: 'Gözlem & Sınanabilir Soru',
            sagEtiket: 'Bilimsel Çıktı', bagimli: 'Etik & Kanıta Dayalı Bulgu',
            ozetNot: `Bilimsel bilgi; kişisel görüşleri sistemli veri (${c.arac}) ve etik kurallarla sınayarak güvenilir yanıtlara ulaşır.`,
            audio_path: `audio/m1-${slugId}-s5.mp3`,
            narration: 'Özetle bilimsel araştırma; merak edilen bir gözlemi sınanabilir soruya dönüştürür, etik kurallarla veri toplar ve kanıta dayalı sonuca ulaşır.',
            estimated_duration_seconds: 14,
          },
        ],
      };
    }

    if (modulId === 'm3') {
      return {
        ...baz,
        sablonAd: 'Aynı Konuya Üç Farklı Araştırma Deseni',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Konu & Amaç', ikon: 'odul',
            ustBaslik: 'Sorunun amacı araştırma desenini belirler', altBaslik: c.tema, soru: `“${c.tema}” konusunu farklı sorularla nasıl araştırabiliriz?`,
            image_path: `images/m3-${slugId}-s1.png`, audio_path: `audio/m3-${slugId}-s1.mp3`,
            narration: `Aynı ilgi alanı üzerinde sorduğumuz sorunun amacı değiştiğinde, kullanacağımız araştırma deseni de değişir.`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'design_matrix', kisaAd: '2. Üç Yaklaşım', ikon: 'izgara',
            ustBaslik: 'Nicel, Nitel ve Karma Desen Karşılaştırması', altBaslik: 'Aynı bağlamda üç farklı araştırma kurgusu',
            desenler: [
              { tur: 'Nicel Desen', rozet: 'Sayısal Ölçüm', soru: c.soru, yontem: `${c.arac} ile ${et.join(' / ')} gruplarından sayısal veri toplanır.` },
              { tur: 'Nitel Desen', rozet: 'Derinlemesine Anlam', soru: c.nitel, yontem: 'Az sayıda katılımcıyla yarı yapılandırılmış derinlemesine görüşmeler yapılır.' },
              { tur: 'Karma Desen', rozet: 'Sayı + Deneyim', soru: 'Sayısal farkın ardındaki kişisel deneyimler nelerdir?', yontem: c.karma },
            ],
            audio_path: `audio/m3-${slugId}-s2.mp3`,
            narration: 'Sayısal etki ve ilişki için nicel, yaşanmış deneyimi anlamak için nitel, her ikisini bütünleştirmek için karma desen kullanılır.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 3, slide_type: 'decision_tree', kisaAd: '3. Karar Ağacı', ikon: 'dal',
            ustBaslik: 'Deneysel mi, İlişkisel mi?', altBaslik: 'Araştırmacının değişkene müdahalesi var mı?',
            kokSoru: `Araştırmacı “${c.bagimsiz}” değişkenine kendisi müdahale edip gruplara rastgele atama yapıyor mu?`,
            dallar: [
              { kosul: 'EVET — Müdahale & Rastgele Atama Var', desen: 'Deneysel Desen', ornek: `Katılımcıları rastgele ${et.join(', ')} koşullarına atayıp "${c.bagimli}" sonucunu ölçmek.` },
              { kosul: 'HAYIR — Müdahale Yok, Mevcut Durum Ölçülüyor', desen: 'İlişkisel (Korelasyonel) Desen', ornek: `Katılımcıların hâlihazırdaki "${c.bagimsiz}" alışkanlıkları ile "${c.bagimli}" puanları arasındaki ilişkiyi incelemek.` },
            ],
            audio_path: `audio/m3-${slugId}-s3.mp3`,
            narration: 'Nicel araştırmalarda araştırmacı koşulları kendisi değiştirip gruplara müdahale ediyorsa deneysel, mevcut durumu müdahalesiz ölçüyorsa ilişkisel desen söz konusudur.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 4, slide_type: 'mixed_sequence', kisaAd: '4. Karma Akış', ikon: 'grafik',
            ustBaslik: 'Açıklayıcı Sıralı Karma Desen Nasıl İşler?', altBaslik: 'Önce nicel eğilim, sonra nitel derinlik',
            asama1: { baslik: '1. Aşama: Nicel Veri Toplama & Analiz', detay: `${c.arac} ile gruplar karşılaştırılır (${c.bulgu})` },
            asama2: { baslik: '2. Aşama: Nitel Görüşmelerle Açıklama', detay: `Neden bu farkın oluştuğunu anlamak için "${c.nitel}" sorusuyla uç gruplarla görüşülür.` },
            sentez: c.karma,
            audio_path: `audio/m3-${slugId}-s4.mp3`,
            narration: `Açıklayıcı sıralı karma desende önce nicel verilerle genel tablo ortaya konur, ardından yapılan görüşmelerle bu sayıların arkasındaki nedenler açıklanır.`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Desen Özeti', ikon: 'tik',
            ustBaslik: 'Sorudan uygun araştırma desenine', altBaslik: 'Çözümün özeti',
            solEtiket: 'Araştırma Sorusunun Doğası', bagimsiz: 'Etki / İlişki / Deneyim',
            sagEtiket: 'Seçilen Araştırma Deseni', bagimli: 'Deneysel · İlişkisel · Nitel · Karma',
            ozetNot: 'Yöntem seçiminde altın kural: Araştırma desenini araştırmacının alışkanlığı değil, araştırma sorusunun amacı belirler.',
            audio_path: `audio/m3-${slugId}-s5.mp3`,
            narration: 'Özetle araştırma sorusu müdahaleli etkiyi soruyorsa deneysel, doğal ilişkiyi soruyorsa ilişkisel, deneyimi soruyorsa nitel desen seçilir.',
            estimated_duration_seconds: 14,
          },
        ],
      };
    }

    if (modulId === 'm4') {
      return {
        ...baz,
        sablonAd: 'Evrenden Temsili ve Tabakalı Örnekleme',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Hedef Grup', ikon: 'odul',
            ustBaslik: 'Araştırmada kimlerden veri toplanacak?', altBaslik: c.tema, soru: `${c.evren} grubunun tamamına ulaşmadan güvenilir sonuç elde edebilir miyiz?`,
            image_path: `images/m4-${slugId}-s1.png`, audio_path: `audio/m4-${slugId}-s1.mp3`,
            narration: `Araştırmamızda hedef grubumuz: ${c.evren}. Zaman ve maliyet nedeniyle herkese ulaşmak yerine evreni temsil eden bir örneklem seçmeliyiz.`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'population_vs_sample', kisaAd: '2. Evren & Örneklem', ikon: 'izgara',
            ustBaslik: 'Evren, Örneklem ve Analiz Birimi', altBaslik: 'Bütünden temsil gücü yüksek alt kümeye geçiş',
            evrenTanim: c.evren,
            orneklemTanim: `Evrenden bilimsel yöntemle seçilen 120 ${c.birim} (n = 120)`,
            birimTanim: `Her bir ${c.birim}`,
            nedenOrneklem: 'Evrendeki tüm birimlere ulaşmak yerine, evrenin yapısını bozmayan küçük bir kesitle çalışıp sonuçları evrene genelleriz.',
            audio_path: `audio/m4-${slugId}-s2.mp3`,
            narration: `Sonuçları genellemek istediğimiz bütün gruba evren, veri topladığımız alt gruba örneklem, her bir katılımcıya ise analiz birimi denir.`,
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'sampling_bias_comparison', kisaAd: '3. Temsil Yanlılığı', ikon: 'dal',
            ustBaslik: 'Yanlı Seçim vs Seçkisiz (Rastgele) Seçim', altBaslik: 'Örneklem ne zaman evreni temsil etmez?',
            yanliBaslik: 'Olasılıksız / Yanlı Seçim Riski (✕)',
            yanliAciklama: `Yalnızca en kolay ulaşılan veya sadece "${(c.tabakalar && c.tabakalar[0]) || et[0]}" grubundaki ${c.birim}lerle çalışmak diğer alt grupları dışarıda bırakır.`,
            dogruBaslik: 'Olasılıklı & Tabakalı Seçim (✓)',
            dogruAciklama: `Evrendeki tüm alt grupların (${(c.tabakalar || et).join(', ')}) örneklemde kendi ağırlıklarıyla ve seçkisiz biçimde yer almasını sağlar.`,
            audio_path: `audio/m4-${slugId}-s3.mp3`,
            narration: 'Yalnızca elimizin altındaki tek bir alt gruptan veri toplarsak örneklem yanlı olur ve sonuçlar bütün evrene genellenemez.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 4, slide_type: 'stratified_grid', kisaAd: '4. Tabakalı Seçim', ikon: 'grafik',
            ustBaslik: 'Tabakalı Örnekleme Dağılımı', altBaslik: 'Alt grupların örneklemde dengeli temsili',
            birim: c.birim,
            tabakalar: (c.tabakalar || et).slice(0, 3).map((ad, i) => ({
              ad,
              evrenSayi: [400, 400, 400][i] || 300,
              orneklemSayi: [40, 40, 40][i] || 30,
              oran: '%10 seçkisiz seçim',
            })),
            toplamNot: `Toplam örneklem büyüklüğü: n = 120 ${c.birim} (3 tabakadan eşit ve rastgele seçildi)`,
            audio_path: `audio/m4-${slugId}-s4.mp3`,
            narration: `Tabakalı örneklemede evren önce ${(c.tabakalar || et).slice(0, 3).join(', ')} tabakalarına ayrılır ve her tabakadan rastgele seçim yapılır.`,
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Örnekleme Özeti', ikon: 'tik',
            ustBaslik: 'Evrenden temsili örnekleme', altBaslik: 'Çözümün özeti',
            solEtiket: 'Hedef Evren (Bütün)', bagimsiz: c.evren,
            sagEtiket: 'Temsili Örneklem (Alt Küme)', bagimli: `Tabakalı seçilen ${c.birim} grubu`,
            ozetNot: 'İyi bir örneklem sadece kalabalık olan değil, evrendeki alt grupları yansız biçimde temsil edendir.',
            audio_path: `audio/m4-${slugId}-s5.mp3`,
            narration: 'Özetle tabakalı ve seçkisiz örnekleme, tüm alt grupların araştırmada adil biçimde temsil edilmesini güvence altına alır.',
            estimated_duration_seconds: 14,
          },
        ],
      };
    }

    if (modulId === 'm5') {
      return {
        ...baz,
        sablonAd: 'Ölçme Aracı, Geçerlik & Güvenirlik Hedef Analizi',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Ölçme İhtiyacı', ikon: 'odul',
            ustBaslik: 'Değişkeni nasıl doğru ve tutarlı ölçeriz?', altBaslik: c.tema, soru: `“${c.bagimli}” özelliğini bilimsel olarak hangi araçla ve nasıl ölçmeliyiz?`,
            image_path: `images/m5-${slugId}-s1.png`, audio_path: `audio/m5-${slugId}-s1.mp3`,
            narration: `Araştırmamızda "${c.bagimli}" değişkenini ölçmek için "${c.arac}" kullanıyoruz. Ancak bu aracın hem geçerli hem de güvenilir olması gerekir.`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'instrument_blueprint', kisaAd: '2. Ölçme Aracı', ikon: 'izgara',
            ustBaslik: 'Ölçülecek Yapı ve Veri Toplama Aracı Uyumu', altBaslik: 'Hedef değişkene uygun ölçme aracının seçimi',
            olculenYapi: c.bagimli,
            secilenArac: c.arac,
            aracGerekce: `Bu araç, "${c.bagimli}" değişkenini dolaylı tahminler yerine doğrudan ve standartlaştırılmış biçimde kayıt altına alır.`,
            kontrolListesi: ['Standart uygulama yönergesi', 'Kapsam temsili', 'Nesnel puanlama anahtarı'],
            audio_path: `audio/m5-${slugId}-s2.mp3`,
            narration: `Veri toplama aracı, ölçmek istediğimiz "${c.bagimli}" yapısına doğrudan karşılık gelmeli ve standart bir yönergeyle uygulanmalıdır.`,
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'bullseye_targets', kisaAd: '3. Hedef Tahtası', ikon: 'dal',
            ustBaslik: 'Geçerlik ve Güvenirlik: Hedef Tahtası Analojisi', altBaslik: 'Tutarlılık (Güvenirlik) ve Doğru Hedef (Geçerlik)',
            hedefler: [
              { tip: 'daginik', baslik: 'Güvenilir Değil & Geçersiz', aciklama: 'Ölçümler her seferinde farklı ve hedeften uzak (Rastgele hata yüksek).' },
              { tip: 'kaymis', baslik: 'Güvenilir Ama Geçersiz', aciklama: `Her ölçümde aynı sonucu veriyor ama "${c.bagimli}" yerine başka bir özelliği ölçüyor.` },
              { tip: 'merkez', baslik: 'Hem Güvenilir Hem Geçerli', aciklama: `Doğrudan "${c.bagimli}" özelliğini her tekrarda tutarlı ve isabetli biçimde ölçüyor.` },
            ],
            audio_path: `audio/m5-${slugId}-s3.mp3`,
            narration: 'Bir ölçme aracı her seferinde aynı hatalı noktayı vuruyorsa güvenilirdir ama geçerli değildir. Bilimsel ölçüm tam merkezi tutarlı biçimde vurmalıdır.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 4, slide_type: 'threat_diagnosis', kisaAd: '4. Hata Teşhisi', ikon: 'grafik',
            ustBaslik: 'Bu Senaryoda Geçerlik ve Güvenirlik Tehditleri', altBaslik: 'Ölçmeye karışabilecek hata kaynakları',
            gecerlikTehdidi: c.gecersiz || `Ölçme aracının "${c.bagimli}" yerine katılımcının genel hızını veya ilgisiz bir becerisini ölçmesi.`,
            gecerlikOnlem: 'Maddelerin ve ölçüm kriterlerinin yalnızca hedef kazanımı/özelliği ölçtüğünden uzman görüşüyle emin olmak.',
            guvenirlikTehdidi: c.guvenilmez || 'Aynı koşulda kısa aralıkla tekrarlanan ölçümlerde veya farklı puanlayıcılar arasında çok farklı sonuçlar çıkması.',
            guvenirlikOnlem: 'Ortam koşullarını standartlaştırmak ve açık bir puanlama rubriği kullanmak.',
            audio_path: `audio/m5-${slugId}-s4.mp3`,
            narration: 'Başka bir özelliği ölçmek geçerliği zedelerken, aynı koşulda tutarsız puanlar elde etmek güvenirlik sorununa işaret eder.',
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Ölçme Özeti', ikon: 'tik',
            ustBaslik: 'Nitelikli veri toplamanın iki direği', altBaslik: 'Çözümün özeti',
            solEtiket: 'Güvenirlik (Tutarlılık)', bagimsiz: 'Kararlı & Hatasız Ölçüm',
            sagEtiket: 'Geçerlik (Amaca Uygunluk)', bagimli: `Doğrudan “${c.bagimli}” Ölçümü`,
            ozetNot: `Etik kural: ${c.etik}`,
            audio_path: `audio/m5-${slugId}-s5.mp3`,
            narration: 'Özetle güvenirlik ölçümlerin tutarlılığını, geçerlik ise gerçekten hedeflediğimiz özelliği ölçmeyi güvence altına alır.',
            estimated_duration_seconds: 14,
          },
        ],
      };
    }

    if (modulId === 'm6') {
      return {
        ...baz,
        sablonAd: 'Ham Veriden Grafiğe, Nesnel Bulguya ve Sınırlılıklara',
        slaytlar: [
          {
            slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Veri Seti', ikon: 'odul',
            ustBaslik: 'Toplanan verilerden bilimsel bulguya', altBaslik: c.tema, soru: `Toplanan “${c.veri.olcu}” verilerini nasıl analiz edip abartısız raporlamalıyız?`,
            image_path: `images/m6-${slugId}-s1.png`, audio_path: `audio/m6-${slugId}-s1.mp3`,
            narration: `Araştırmanın son aşamasında "${c.arac}" ile toplanan ham veriler temizlenir, grupların ortalamaları hesaplanır ve yorumlanır.`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 2, slide_type: 'data_cleaning_table', kisaAd: '2. Veri Tablosu', ikon: 'izgara',
            ustBaslik: 'Verilerin Hazırlanması ve Betimsel Tablo', altBaslik: `Ölçülen gösterge: ${c.veri.olcu}`,
            olcuBirimi: c.veri.olcu,
            satirlar: et.map((grup, i) => ({
              grup,
              n: '60',
              ortalama: String(dg[i]),
              not: i === 0 ? 'Alt grup' : i === et.length - 1 ? 'Üst grup' : 'Orta grup',
            })),
            temizlikNotu: 'Analiz öncesi eksik girişler ve hatalı uç değerler kontrol edilerek grup ortalamaları hesaplanmıştır.',
            audio_path: `audio/m6-${slugId}-s2.mp3`,
            narration: `Ham veriler kodlanıp temizlendikten sonra ${et.join(', ')} gruplarının ortalama değerleri tablo halinde özetlenir.`,
            estimated_duration_seconds: 16,
          },
          {
            slide_id: 3, slide_type: 'dependent_var', kisaAd: '3. Grafik Okuma', ikon: 'grafik',
            ustBaslik: 'Görselleştirme ve Örüntü Okuma', altBaslik: 'Gruplar arasındaki farkın grafikle gösterimi',
            degisken: c.veri.olcu,
            oncekiRef: `Karşılaştırılan gruplar (${c.bagimsiz}): ${et.join(' · ')}`,
            veri: et.map((etiket, idx) => ({ etiket, deger: dg[idx] })),
            audio_path: `audio/m6-${slugId}-s3.mp3`,
            narration: `Grafik incelendiğinde gruplar arasındaki dağılım açıkça görülür: ${c.bulgu}`,
            estimated_duration_seconds: 15,
          },
          {
            slide_id: 4, slide_type: 'correlation_vs_causation', kisaAd: '4. Bulgu Yazımı', ikon: 'dal',
            ustBaslik: 'İlişki vs Nedensellik: Doğru Bulgu Cümlesi', altBaslik: 'Verinin söylediğinden fazlasını iddia etmemek',
            yanlisBaslik: 'Hatalı / Aşırı Genellenmiş Yorum (✕)',
            yanlisMetin: `“${c.bagimsiz}, bütün insanlarda ${c.bagimli.toLocaleLowerCase('tr')} sonucunu kesin olarak belirleyen tek nedendir.”`,
            yanlisNeden: 'Kontrolsüz değişkenleri yok sayar, ilişkisel veriden kesin nedensellik çıkarır ve örneklem dışına aşırı genelleme yapar.',
            dogruBaslik: 'Nesnel ve Veriye Sadık Bulgu Cümlesi (✓)',
            dogruMetin: c.bulgu,
            dogruNeden: 'Yalnızca bu örneklemde ölçülen sayısal değerleri ve gözlenen farkı/ilişkiyi nesnel biçimde aktarır.',
            audio_path: `audio/m6-${slugId}-s4.mp3`,
            narration: 'Bilimsel raporda sayılar abartılmaz ve rastgele atama yoksa kesin neden-sonuç iddiasında bulunulmaz; yalnızca verinin desteklediği bulgu yazılır.',
            estimated_duration_seconds: 17,
          },
          {
            slide_id: 5, slide_type: 'limitations_report', kisaAd: '5. Sınırlılıklar', ikon: 'tik',
            ustBaslik: 'Şeffaf Raporlama ve Araştırmanın Sınırlılıkları', altBaslik: 'Çözümün özeti',
            bulguOzeti: c.bulgu,
            sinirliliklar: [
              `Örneklem Sınırı: Bulgular yalnızca "${c.evren}" kapsamındaki katılımcılarla sınırlıdır.`,
              `Kontrol Edilmeyen Etkenler: ${(c.kontrol || ['Ön deneyim', 'Ortam']).join(' ve ')} dışındaki bireysel farklılıklar sonucu etkilemiş olabilir.`,
              'Gelecek Önerisi: Farklı yaş ve deneyim gruplarında uzun süreli (boylamsal) ölçümler tekrarlanmalıdır.',
            ],
            audio_path: `audio/m6-${slugId}-s5.mp3`,
            narration: 'İyi bir araştırma raporu, ulaştığı bulguyu çalışmanın yöntemsel sınırlılıkları ve gelecek araştırmalar için önerilerle birlikte şeffafça paylaşır.',
            estimated_duration_seconds: 15,
          },
        ],
      };
    }

    // Varsayılan Modül 2 (m2): Araştırma Problemi, Sorusu ve Değişkenler (Soruyu Daraltma Hunisi + Bağımsız/Bağımlı/Kontrol)
    return {
      ...baz,
      sablonAd: 'Geniş Sorudan Değişkenlere ve Deneysel Kurgulaya',
      slaytlar: [
        {
          slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
          ustBaslik: 'Bir araştırma problemi ve senaryosu', altBaslik: c.tema, soru: c.soru,
          image_path: `images/m2-${slugId}-s1.png`,
          audio_path: `audio/m2-${slugId}-s1.mp3`,
          narration: `${c.gozlem} Bu gözlemden yola çıkarak araştırma sorumuz: ${c.soru}`,
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 2, slide_type: 'question_funnel', kisaAd: '2. Soruyu Daralt', ikon: 'izgara',
          ustBaslik: 'Geniş meraktan odaklanmış araştırma sorusuna', altBaslik: c.veri.olcu,
          zayifSoru: c.zayif || `${c.tema} iyi midir?`,
          gucluSoru: c.soru,
          kosullar: et.map((ad, idx) => ({ ad, deger: String(dg[idx]), diyagram: `genel${idx + 1}` })),
          dipnot: 'Örnek amaçlı kurgusal araştırma koşulları',
          audio_path: `audio/m2-${slugId}-s2.mp3`,
          narration: `Çok geniş bir soru yerine, ${et.join(', ')} koşullarını karşılaştırarak "${c.veri.olcu}" ölçümünü hedefleyen odaklanmış bir soru kuruyoruz.`,
          estimated_duration_seconds: 17,
        },
        {
          slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Bağımsız Değişken', ikon: 'dal',
          ustBaslik: 'Bağımsız değişkeni belirleyelim', altBaslik: 'Araştırmacının değiştirdiği / karşılaştırdığı unsur',
          degisken: c.bagimsiz, seviyeler: et, digerRef: `Ölçülen sonuç: ${c.bagimli}`,
          audio_path: `audio/m2-${slugId}-s3.mp3`,
          narration: `Araştırmacının karşılaştırdığı ve değiştirdiği unsur "${c.bagimsiz}" olduğu için bağımsız değişken budur.`,
          estimated_duration_seconds: 15,
        },
        {
          slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Bağımlı & Kontrol', ikon: 'grafik',
          ustBaslik: 'Bağımlı ve kontrol değişkenleri', altBaslik: 'Araştırmacının ölçtüğü sonuç ve sabit tutulanlar',
          degisken: c.bagimli, oncekiRef: `Değiştirilen unsur: ${c.bagimsiz}`,
          kontrolDegiskenleri: c.kontrol || ['Katılımcı düzeyi', 'Uygulama ortamı'],
          veri: et.map((etiket, idx) => ({ etiket, deger: dg[idx] })),
          audio_path: `audio/m2-${slugId}-s4.mp3`,
          narration: `Değişime bağlı olarak ölçülen sonuç "${c.bagimli}" bağımlı değişkendir; ${(c.kontrol || []).join(' ve ')} ise sonucu karıştırmaması için sabit tutulur.`,
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Değişken Özeti', ikon: 'tik',
          ustBaslik: 'Araştırmanın değişken mimarisi', altBaslik: 'Çözümün özeti',
          bagimsiz: c.bagimsiz, bagimli: c.bagimli,
          kontrolList: c.kontrol,
          ozetNot: 'Bağımsız değişkeni değiştiriyor, kontrol değişkenlerini sabit tutuyor ve bağımlı değişkendeki sonucu ölçüyoruz.',
          audio_path: `audio/m2-${slugId}-s5.mp3`,
          narration: `Özetle bağımsız değişken "${c.bagimsiz}", bağımlı değişken ise "${c.bagimli}" olarak belirlenir.`,
          estimated_duration_seconds: 14,
        },
      ],
    };
  }

  /* Yeniden kullanılabilir ikonlar ve vektörel sahne / şema bileşenleri */
  const IKON = {
    odul: '<path d="M6 9H4a2 2 0 0 1-2-2V5h4m12 4h2a2 2 0 0 0 2-2V5h-4M6 5h12v5a6 6 0 0 1-12 0V5Zm6 11v4m-4 0h8"/>',
    izgara: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    dal: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.2 7.2 15.6 8M7.2 8.2 10.8 15.8"/>',
    grafik: '<path d="M4 20h16"/><rect x="6" y="11" width="3.5" height="6" rx="1"/><rect x="11" y="7" width="3.5" height="10" rx="1"/><rect x="16" y="4" width="3.5" height="13" rx="1"/>',
    tik: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/>',
    geri: '<path d="M6 6v12"/><path d="m18 6-9 6 9 6V6Z"/>',
    ileri: '<path d="M18 6v12"/><path d="m6 6 9 6-9 6V6Z"/>',
    ses: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>',
    dur: '<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
    metin: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>',
    sag: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    sol: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  };
  const svgIc = k => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IKON[k] || ''}</svg>`;

  function sahneSVG(tip) {
    if (tip === 'basketbol') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <defs>
          <linearGradient id="bg-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#173832"/><stop offset="1" stop-color="#0B1F1B"/></linearGradient>
        </defs>
        <rect width="640" height="310" fill="url(#bg-b)"/>
        <g opacity=".18" stroke="#9FD8CC" stroke-width="2" fill="none">
          <rect x="40" y="34" width="560" height="242" rx="14"/>
          <line x1="320" y1="34" x2="320" y2="276"/>
          <circle cx="320" cy="155" r="46"/>
          <path d="M40 94h86a61 61 0 0 1 0 122H40M600 94h-86a61 61 0 0 0 0 122h86"/>
        </g>
        <rect x="216" y="24" width="208" height="44" rx="10" fill="#102723" stroke="#2D5E55"/>
        <text x="260" y="51" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="14" font-weight="700" text-anchor="middle">EV SAHİBİ</text>
        <text x="320" y="52" fill="#FFFFFF" font-family="Bricolage Grotesque,sans-serif" font-size="20" font-weight="700" text-anchor="middle">74 : 64</text>
        <text x="380" y="51" fill="#F4A278" font-family="Figtree,sans-serif" font-size="14" font-weight="700" text-anchor="middle">KONUK</text>
        <g stroke-width="2.5" stroke-linecap="round">
          <path d="M170 212 Q265 135 352 152" stroke="#EE6C2B" stroke-dasharray="6 6" fill="none"/>
          <path d="M352 152 Q430 165 496 116" stroke="#9FD8CC" stroke-dasharray="5 5" fill="none"/>
        </g>
        <circle cx="170" cy="212" r="14" fill="#0E8C7F" stroke="#fff" stroke-width="2.5"/>
        <circle cx="290" cy="182" r="14" fill="#0E8C7F" stroke="#fff" stroke-width="2.5"/>
        <circle cx="352" cy="152" r="14" fill="#0E8C7F" stroke="#fff" stroke-width="2.5"/>
        <circle cx="496" cy="116" r="15" fill="#EE6C2B" stroke="#fff" stroke-width="2.5"/>
        <circle cx="445" cy="145" r="11" fill="#E6EEF0" opacity=".8"/>
        <circle cx="242" cy="145" r="11" fill="#E6EEF0" opacity=".8"/>
        <g transform="translate(520 198)">
          <rect width="84" height="58" rx="12" fill="#102723" stroke="#2D5E55"/>
          <text x="14" y="24" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="11" font-weight="700">EUROLEAGUE</text>
          <text x="14" y="44" fill="#fff" font-family="Figtree,sans-serif" font-size="13" font-weight="600">Hücum Analizi</text>
        </g>
      </svg>`;
    }
    if (tip === 'kahve') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <defs>
          <linearGradient id="bg-k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7EFE7"/><stop offset="1" stop-color="#EFE4D7"/></linearGradient>
        </defs>
        <rect width="640" height="310" fill="url(#bg-k)"/>
        <rect x="70" y="244" width="500" height="14" rx="7" fill="#DCCBBC"/>
        <!-- V60 Sürahi ve Dripper -->
        <g transform="translate(275 82)">
          <polygon points="10,0 90,0 64,58 36,58" fill="#FFFFFF" stroke="#0E8C7F" stroke-width="3" stroke-linejoin="round"/>
          <rect x="26" y="58" width="48" height="8" rx="4" fill="#0E8C7F"/>
          <path d="M30 66 h40 l16 68 a14 14 0 0 1 -14 16 H28 a14 14 0 0 1 -14 -16 Z" fill="#FFFFFF" fill-opacity=".8" stroke="#5C6C68" stroke-width="2.5"/>
          <path d="M22 114 h56 l6 24 a10 10 0 0 1 -10 10 H26 a10 10 0 0 1 -10 -10 Z" fill="#8A4B24"/>
          <path d="M86 82 c18 0 18 34 0 34" fill="none" stroke="#5C6C68" stroke-width="3"/>
          <path d="M50 -24 Q42 -10 50 0" stroke="#EE6C2B" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
        <!-- Kuğu boyunlu kettle -->
        <g transform="translate(115 92)">
          <path d="M24 34 h64 l10 88 H14 Z" fill="#11211E" rx="10"/>
          <path d="M88 94 C122 88 124 22 152 16" fill="none" stroke="#11211E" stroke-width="7" stroke-linecap="round"/>
          <path d="M24 44 C0 44 0 98 18 106" fill="none" stroke="#5C6C68" stroke-width="6" stroke-linecap="round"/>
          <rect x="34" y="24" width="44" height="10" rx="5" fill="#5C6C68"/>
        </g>
        <!-- Sıcaklık kartları -->
        <g transform="translate(428 72)">
          <rect width="144" height="44" rx="12" fill="#FFFFFF" stroke="#DFE7E5" stroke-width="2"/>
          <circle cx="22" cy="22" r="8" fill="#9FD8CC"/><text x="40" y="27" fill="#11211E" font-family="Figtree,sans-serif" font-size="14" font-weight="700">88°C · Yumuşak</text>
          <rect y="56" width="144" height="44" rx="12" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="2.5"/>
          <circle cx="22" cy="78" r="8" fill="#0E8C7F"/><text x="40" y="83" fill="#0A6A60" font-family="Figtree,sans-serif" font-size="14" font-weight="700">92°C · Dengeli</text>
          <rect y="112" width="144" height="44" rx="12" fill="#FFEDE2" stroke="#EE6C2B" stroke-width="2"/>
          <circle cx="22" cy="134" r="8" fill="#EE6C2B"/><text x="40" y="139" fill="#B84A12" font-family="Figtree,sans-serif" font-size="14" font-weight="700">96°C · Yoğun</text>
        </g>
      </svg>`;
    }
    if (tip === 'basketbol_oyuncu') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <rect width="640" height="310" fill="#142C28"/>
        <path d="M90 270 A230 230 0 0 1 550 270" fill="none" stroke="#9FD8CC" stroke-width="3" stroke-dasharray="8 6" opacity=".45"/>
        <rect x="275" y="42" width="90" height="58" rx="8" fill="#1F423C" stroke="#9FD8CC" stroke-width="2.5"/>
        <circle cx="320" cy="88" r="14" fill="none" stroke="#EE6C2B" stroke-width="4"/>
        <path d="M160 232 Q240 60 316 90" fill="none" stroke="#EE6C2B" stroke-width="3.5" stroke-dasharray="6 5"/>
        <circle cx="160" cy="232" r="16" fill="#0E8C7F" stroke="#fff" stroke-width="2.5"/>
        <circle cx="252" cy="118" r="13" fill="#EE6C2B"/>
        <g transform="translate(420 158)">
          <rect width="176" height="94" rx="14" fill="#0D201D" stroke="#2D5E55"/>
          <text x="16" y="28" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="12" font-weight="700">3 SAYILIK ŞUT TESTİ</text>
          <text x="16" y="54" fill="#fff" font-family="Bricolage Grotesque,sans-serif" font-size="18" font-weight="700">15 · 30 · 45 dk</text>
          <text x="16" y="76" fill="#F4A278" font-family="Figtree,sans-serif" font-size="13" font-weight="600">20 Denemede İsabet</text>
        </g>
      </svg>`;
    }
    if (tip === 'oyun') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <rect width="640" height="310" fill="#19213A"/>
        <g opacity=".18" stroke="#8FA2E8" stroke-width="1.5" fill="none">
          <path d="M60 155 L320 42 L580 155 L320 268 Z"/>
          <path d="M190 98 L450 212 M450 98 L190 212"/>
        </g>
        <g transform="translate(82 72)">
          <rect width="142" height="158" rx="16" fill="#232E52" stroke="#5B6BE8" stroke-width="2"/>
          <text x="71" y="42" fill="#9FB0F5" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">ODUN ODAKLI</text>
          <text x="71" y="88" fill="#fff" font-family="Bricolage Grotesque,sans-serif" font-size="24" font-weight="700" text-anchor="middle">8.400</text>
          <text x="71" y="122" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="13" text-anchor="middle">15. dk Kaynak</text>
        </g>
        <g transform="translate(249 58)">
          <rect width="142" height="182" rx="16" fill="#283862" stroke="#17A594" stroke-width="3"/>
          <text x="71" y="44" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">DENGELİ DAĞILIM</text>
          <text x="71" y="96" fill="#F6C445" font-family="Bricolage Grotesque,sans-serif" font-size="26" font-weight="700" text-anchor="middle">12.100</text>
          <text x="71" y="134" fill="#fff" font-family="Figtree,sans-serif" font-size="13" text-anchor="middle">En Yüksek Ekonomi</text>
        </g>
        <g transform="translate(416 72)">
          <rect width="142" height="158" rx="16" fill="#232E52" stroke="#F6C445" stroke-width="2"/>
          <text x="71" y="42" fill="#F6C445" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">ALTIN ODAKLI</text>
          <text x="71" y="88" fill="#fff" font-family="Bricolage Grotesque,sans-serif" font-size="24" font-weight="700" text-anchor="middle">10.200</text>
          <text x="71" y="122" fill="#9FB0F5" font-family="Figtree,sans-serif" font-size="13" text-anchor="middle">15. dk Kaynak</text>
        </g>
      </svg>`;
    }
    if (tip === 'muzik') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <rect width="640" height="310" fill="#FBF5EA"/>
        <rect x="64" y="94" width="320" height="122" rx="14" fill="#5A3821" stroke="#3B2313" stroke-width="3"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="64" y1="${110 + i * 18}" x2="384" y2="${110 + i * 18}" stroke="#EAD7C3" stroke-width="${1.2 + i * 0.3}"/>`).join('')}
        ${[120, 180, 240, 300, 355].map(x => `<line x1="${x}" y1="94" x2="${x}" y2="216" stroke="#C9B29B" stroke-width="2"/>`).join('')}
        <circle cx="150" cy="128" r="9" fill="#0E8C7F"/><circle cx="210" cy="164" r="9" fill="#EE6C2B"/><circle cx="270" cy="146" r="9" fill="#0E8C7F"/>
        <g transform="translate(422 66)">
          <rect width="156" height="178" rx="18" fill="#FFFFFF" stroke="#E2D3BE" stroke-width="2"/>
          <polygon points="78,28 46,128 110,128" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="2.5"/>
          <line x1="78" y1="120" x2="102" y2="48" stroke="#EE6C2B" stroke-width="3.5" stroke-linecap="round"/>
          <text x="78" y="156" fill="#11211E" font-family="Figtree,sans-serif" font-size="13.5" font-weight="700" text-anchor="middle">Bölümlü + Metronom</text>
        </g>
      </svg>`;
    }
    if (tip === 'sanat') {
      return `<svg viewBox="0 0 640 310" aria-hidden="true">
        <rect width="640" height="310" fill="#EEF4F3"/>
        <rect x="74" y="46" width="286" height="218" rx="18" fill="#1B2A28" stroke="#0E8C7F" stroke-width="3"/>
        <rect x="92" y="64" width="250" height="182" rx="10" fill="#FFFFFF"/>
        <g stroke="#B8D8D2" stroke-width="1" stroke-dasharray="4 4">
          <line x1="175" y1="64" x2="175" y2="246"/><line x1="258" y1="64" x2="258" y2="246"/>
          <line x1="92" y1="124" x2="342" y2="124"/><line x1="92" y1="184" x2="342" y2="184"/>
        </g>
        <ellipse cx="217" cy="148" rx="44" ry="56" fill="#F7E4D4" stroke="#0E8C7F" stroke-width="2.5"/>
        <g transform="translate(394 64)">
          <rect width="172" height="50" rx="12" fill="#FFFFFF" stroke="#CBD8D4" stroke-width="2"/>
          <text x="18" y="30" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="13.5" font-weight="700">Katman 1 · Eskiz Izgarası</text>
          <rect y="64" width="172" height="50" rx="12" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="2.5"/>
          <text x="18" y="94" fill="#0A6A60" font-family="Figtree,sans-serif" font-size="13.5" font-weight="700">Katman 2 · Işık &amp; Gölge</text>
          <rect y="128" width="172" height="50" rx="12" fill="#FFEDE2" stroke="#EE6C2B" stroke-width="2"/>
          <text x="18" y="158" fill="#B84A12" font-family="Figtree,sans-serif" font-size="13.5" font-weight="700">Katman 3 · Renk &amp; Detay</text>
        </g>
      </svg>`;
    }
    return `<svg viewBox="0 0 640 310" aria-hidden="true">
      <defs>
        <linearGradient id="bg-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF3F1"/><stop offset="1" stop-color="#DCEAE6"/></linearGradient>
      </defs>
      <rect width="640" height="310" fill="url(#bg-s)"/>
      <g transform="translate(76 62)">
        <rect width="146" height="176" rx="18" fill="#FFFFFF" stroke="#CBE0DA" stroke-width="2"/>
        <circle cx="73" cy="64" r="28" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="3"/>
        <path d="M73 46v18l12 8" stroke="#0E8C7F" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="73" y="122" fill="#11211E" font-family="Bricolage Grotesque,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Grup 1</text>
        <text x="73" y="146" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="14" text-anchor="middle">15 dakika</text>
      </g>
      <g transform="translate(247 62)">
        <rect width="146" height="176" rx="18" fill="#FFFFFF" stroke="#0E8C7F" stroke-width="2.5"/>
        <circle cx="73" cy="64" r="28" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="3"/>
        <path d="M73 46v18h16" stroke="#0E8C7F" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="73" y="122" fill="#11211E" font-family="Bricolage Grotesque,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Grup 2</text>
        <text x="73" y="146" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="14" text-anchor="middle">30 dakika</text>
      </g>
      <g transform="translate(418 62)">
        <rect width="146" height="176" rx="18" fill="#FFFFFF" stroke="#EE6C2B" stroke-width="2.5"/>
        <circle cx="73" cy="64" r="28" fill="#FFEDE2" stroke="#EE6C2B" stroke-width="3"/>
        <path d="M73 46v18l-10 12" stroke="#EE6C2B" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="73" y="122" fill="#11211E" font-family="Bricolage Grotesque,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Grup 3</text>
        <text x="73" y="146" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="14" text-anchor="middle">45 dakika</text>
      </g>
    </svg>`;
  }

  function diyagramSVG(kod, idx) {
    if (kod.startsWith('saha')) {
      const pts = [
        [[46, 22], [86, 44], [116, 62]],
        [[36, 46], [76, 60], [112, 32]],
        [[42, 62], [74, 26], [118, 44]],
      ][idx % 3];
      return `<svg viewBox="0 0 164 90" aria-hidden="true">
        <rect x="6" y="6" width="152" height="78" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.6"/>
        <line x1="82" y1="6" x2="82" y2="84" stroke="#8EB3A8" stroke-width="1.4"/>
        <circle cx="82" cy="45" r="16" fill="none" stroke="#8EB3A8" stroke-width="1.4"/>
        <rect x="6" y="25" width="24" height="40" fill="none" stroke="#8EB3A8" stroke-width="1.4"/>
        <rect x="134" y="25" width="24" height="40" fill="none" stroke="#8EB3A8" stroke-width="1.4"/>
        ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#0E8C7F"/>`).join('')}
      </svg>`;
    }
    if (kod.startsWith('kahve')) {
      const fillH = [26, 40, 54][idx % 3];
      const renk = idx === 2 ? '#EE6C2B' : '#0E8C7F';
      return `<svg viewBox="0 0 164 90" aria-hidden="true">
        <rect x="6" y="6" width="152" height="78" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.4"/>
        <polygon points="44,22 92,22 76,56 60,56" fill="#fff" stroke="#0E8C7F" stroke-width="2"/>
        <rect x="52" y="56" width="32" height="18" rx="5" fill="#fff" stroke="#5C6C68" stroke-width="1.6"/>
        <rect x="114" y="16" width="14" height="58" rx="7" fill="#fff" stroke="#8EB3A8" stroke-width="1.5"/>
        <rect x="117" y="${72 - fillH}" width="8" height="${fillH}" rx="4" fill="${renk}"/>
      </svg>`;
    }
    const aci = [90, 180, 270][idx % 3];
    return `<svg viewBox="0 0 164 90" aria-hidden="true">
      <rect x="6" y="6" width="152" height="78" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.4"/>
      <circle cx="82" cy="45" r="24" fill="#fff" stroke="#0E8C7F" stroke-width="2.2"/>
      <line x1="82" y1="45" x2="${82 + Math.sin(aci * Math.PI / 180) * 16}" y2="${45 - Math.cos(aci * Math.PI / 180) * 16}" stroke="#EE6C2B" stroke-width="3" stroke-linecap="round"/>
      <circle cx="82" cy="45" r="3" fill="#11211E"/>
    </svg>`;
  }

  function hedefSVG(tip) {
    const pts = tip === 'daginik'
      ? [[24, 26], [76, 22], [28, 74], [78, 68], [52, 18]]
      : tip === 'kaymis'
        ? [[70, 25], [75, 29], [67, 30], [73, 22], [77, 26]]
        : [[49, 49], [52, 51], [48, 52], [51, 47], [50, 50]];
    const renk = tip === 'merkez' ? '#1F9D61' : tip === 'kaymis' ? '#EE6C2B' : '#C7472B';
    return `<svg viewBox="0 0 100 100" class="slayt-hedef-svg" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#fff" stroke="#CBD8D4" stroke-width="2"/>
      <circle cx="50" cy="50" r="29" fill="none" stroke="#CBD8D4" stroke-width="1.8"/>
      <circle cx="50" cy="50" r="15" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="1.8"/>
      <circle cx="50" cy="50" r="3.5" fill="#0E8C7F"/>
      ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${renk}" stroke="#fff" stroke-width="1.2"/>`).join('')}
    </svg>`;
  }

  function slaytGovde(profil, s) {
    if (s.slide_type === 'scenario_scene') {
      const gorsel = s.image_data_url
        ? `<img class="slayt-uretilen-img" src="${s.image_data_url}" alt="${esc(s.altBaslik || s.ustBaslik)}">`
        : sahneSVG(profil.temaTip, s.ustBaslik, s.altBaslik);
      return `<div class="slayt-gorsel-kutu">${gorsel}<span class="slayt-dosya-etiket">${esc(s.image_path || 'Sahne')}</span></div>
        <div class="slayt-soru-serit">${esc(s.soru)}</div>`;
    }

    /* MODÜL 1 ŞABLONLARI: claim_vs_testable, process_timeline, ethics_pillars */
    if (s.slide_type === 'claim_vs_testable') {
      return `<div class="slayt-ikili-kars">
          <div class="slayt-kars-kart yanlis">
            <span class="slayt-kars-etiket">✕ ${esc(s.gorusBaslik || 'Gündelik Görüş / Sınanamaz İddia')}</span>
            <b>“${esc(s.gorusMetin)}”</b>
            <p>${esc(s.gorusNeden || 'Ölçüt ve karşılaştırma grubu belirsiz olduğu için doğrudan veriyle yanlışlanamaz veya doğrulanamaz.')}</p>
          </div>
          <div class="slayt-kars-kart dogru">
            <span class="slayt-kars-etiket">✓ ${esc(s.bilimselBaslik || 'Bilimsel & Sınanabilir Araştırma Sorusu')}</span>
            <b>“${esc(s.bilimselMetin)}”</b>
            ${Array.isArray(s.kriterler) && s.kriterler.length ? `<div class="slayt-kriter-etiketler">${s.kriterler.map(k => `<span>${esc(k)}</span>`).join('')}</div>` : ''}
          </div>
        </div>`;
    }
    if (s.slide_type === 'process_timeline') {
      const adimlar = Array.isArray(s.adimlar) ? s.adimlar : [];
      return `<div class="slayt-dongu-izgara">
        ${adimlar.map((a, i) => `<div class="slayt-dongu-adim">
          <div class="slayt-dongu-ust"><span class="slayt-dongu-no">${esc(a.no || ('0' + (i + 1)))}</span><b>${esc(a.baslik)}</b></div>
          <p>${esc(a.aciklama)}</p>
        </div>`).join('')}
      </div>`;
    }
    if (s.slide_type === 'ethics_pillars') {
      const ilkeler = Array.isArray(s.ilkeler) ? s.ilkeler : [];
      return `<div class="slayt-etik-izgara">
        ${ilkeler.map((il, i) => `<div class="slayt-etik-kart">
          <span class="slayt-etik-ikon">${['🛡️', '🔒', '📊'][i % 3]}</span>
          <b>${esc(il.baslik)}</b>
          <p>${esc(il.aciklama)}</p>
        </div>`).join('')}
      </div>
      ${s.etikSenaryo ? `<div class="slayt-ref-serit"><b>Senaryo Etik Kuralı:</b> ${esc(s.etikSenaryo)}</div>` : ''}`;
    }

    /* MODÜL 2 ŞABLONLARI: question_funnel, condition_cards, independent_var, dependent_var */
    if (s.slide_type === 'question_funnel') {
      return `<div class="slayt-huni-kutu">
          <div class="slayt-huni-satir zayif">
            <small>1. Geniş / Belirsiz Merak</small>
            <span>“${esc(s.zayifSoru || 'Bu konu performansı etkiler mi?')}”</span>
          </div>
          <div class="slayt-huni-ok">↓ Odaklama: Bağlam + Değişken + Ölçülebilir Çıktı ↓</div>
          <div class="slayt-huni-satir guclu">
            <small>2. Odaklanmış &amp; Ölçülebilir Araştırma Sorusu</small>
            <b>“${esc(s.gucluSoru)}”</b>
          </div>
        </div>
        ${Array.isArray(s.kosullar) && s.kosullar.length ? `<div class="slayt-kosul-izgara">${s.kosullar.map((k, idx) => `<div class="slayt-kosul"><small>${esc(k.ad)}</small><b>${esc(k.deger)}</b></div>`).join('')}</div>` : ''}`;
    }
    if (s.slide_type === 'condition_cards') {
      return `<div class="slayt-kosul-izgara">${(s.kosullar || []).map((k, idx) => `<div class="slayt-kosul">${diyagramSVG(k.diyagram || 'genel', idx)}<small>${esc(k.ad)}</small><b>${esc(k.deger)}</b></div>`).join('')}</div>
        <p class="slayt-dipnot">${esc(s.dipnot || '')}</p>`;
    }
    if (s.slide_type === 'independent_var') {
      return `<div class="slayt-vurgu-kutu">
          <span class="slayt-vurgu-ust">${esc(s.vurguUst || 'Araştırmacının değiştirdiği / karşılaştırdığı')}</span>
          <b class="slayt-vurgu-ad">${esc(s.degisken)}</b>
          <div class="slayt-seviyeler">${(s.seviyeler || []).map(sv => `<div class="slayt-seviye">${esc(sv)}</div>`).join('')}</div>
          <span class="slayt-vurgu-alt">${esc(s.vurguAlt || 'Bağımsız değişken')}</span>
        </div>
        <div class="slayt-ref-serit">${esc(s.digerRef || '')}</div>`;
    }
    if (s.slide_type === 'dependent_var') {
      const veri = Array.isArray(s.veri) ? s.veri : [];
      const max = Math.max(...veri.map(v => Number(v.deger) || 0), 1);
      return `<div class="slayt-ref-serit">${esc(s.oncekiRef || '')}</div>
        <div class="slayt-vurgu-kutu turuncu">
          <span class="slayt-vurgu-ust">${esc(s.vurguUst || 'Araştırmacının ölçtüğü sonuç')}</span>
          <b class="slayt-vurgu-ad">${esc(s.degisken)}</b>
          <div class="slayt-barlar">${veri.map(v => `<div class="slayt-bar-satir"><span>${esc(v.etiket)}</span><div class="slayt-bar-yol"><i style="width:${Math.max(18, ((Number(v.deger) || 0) / max) * 92).toFixed(1)}%"></i></div><b>${esc(v.deger)}</b></div>`).join('')}</div>
          <span class="slayt-vurgu-alt">${esc(s.vurguAlt || 'Ölçülen gösterge / Bağımlı değişken')}</span>
        </div>
        ${Array.isArray(s.kontrolDegiskenleri) && s.kontrolDegiskenleri.length ? `<div class="slayt-kontrol-serit"><b>Sabit tutulan kontrol değişkenleri:</b> ${s.kontrolDegiskenleri.map(k => `<span>${esc(k)}</span>`).join('')}</div>` : ''}`;
    }

    /* MODÜL 3 ŞABLONLARI: design_matrix, decision_tree, mixed_sequence */
    if (s.slide_type === 'design_matrix') {
      const desenler = Array.isArray(s.desenler) ? s.desenler : [];
      return `<div class="slayt-desen-matris">
        ${desenler.map((d, i) => `<div class="slayt-desen-kart tip-${i}">
          <div class="slayt-desen-ust"><b>${esc(d.tur)}</b><span>${esc(d.rozet || '')}</span></div>
          <p class="slayt-desen-soru">“${esc(d.soru)}”</p>
          <small>${esc(d.yontem)}</small>
        </div>`).join('')}
      </div>`;
    }
    if (s.slide_type === 'decision_tree') {
      const dallar = Array.isArray(s.dallar) ? s.dallar : [];
      return `<div class="slayt-karar-agaci">
        <div class="slayt-karar-kok"><small>Karar Ölçütü</small><b>${esc(s.kokSoru)}</b></div>
        <div class="slayt-karar-dallar">
          ${dallar.map((d, i) => `<div class="slayt-karar-dal ${i === 0 ? 'evet' : 'hayir'}">
            <span class="dal-kosul">${esc(d.kosul)}</span>
            <b>→ ${esc(d.desen)}</b>
            <p>${esc(d.ornek)}</p>
          </div>`).join('')}
        </div>
      </div>`;
    }
    if (s.slide_type === 'mixed_sequence') {
      const a1 = s.asama1 || {}, a2 = s.asama2 || {};
      return `<div class="slayt-karma-akis">
        <div class="slayt-karma-kutu nicel">
          <span class="karma-etiket">AŞAMA 1 · NİCEL</span>
          <b>${esc(a1.baslik || 'Nicel Ölçüm')}</b>
          <p>${esc(a1.detay || '')}</p>
        </div>
        <div class="slayt-karma-ok">→<span>Neden?</span></div>
        <div class="slayt-karma-kutu nitel">
          <span class="karma-etiket">AŞAMA 2 · NİTEL</span>
          <b>${esc(a2.baslik || 'Nitel Görüşme')}</b>
          <p>${esc(a2.detay || '')}</p>
        </div>
      </div>
      ${s.sentez ? `<div class="slayt-ref-serit"><b>Karma Bütünleştirme:</b> ${esc(s.sentez)}</div>` : ''}`;
    }

    /* MODÜL 4 ŞABLONLARI: population_vs_sample, sampling_bias_comparison, stratified_grid */
    if (s.slide_type === 'population_vs_sample') {
      return `<div class="slayt-evren-kapsul">
        <div class="evren-halka dis">
          <span class="halka-etiket">HEDEF EVREN (N) — Genellenmek İstenen Bütün</span>
          <b>${esc(s.evrenTanim)}</b>
          <div class="evren-halka orta">
            <span class="halka-etiket">ÖRNEKLEM (n) — Veri Toplanan Alt Küme</span>
            <b>${esc(s.orneklemTanim)}</b>
            <div class="evren-birim-rozet">Analiz Birimi: <b>${esc(s.birimTanim || 'Katılımcı')}</b></div>
          </div>
        </div>
        ${s.nedenOrneklem ? `<p class="slayt-dipnot">${esc(s.nedenOrneklem)}</p>` : ''}
      </div>`;
    }
    if (s.slide_type === 'sampling_bias_comparison') {
      return `<div class="slayt-ikili-kars">
        <div class="slayt-kars-kart yanlis">
          <span class="slayt-kars-etiket">${esc(s.yanliBaslik || '✕ Yanlı / Uygun Örnekleme Riski')}</span>
          <p>${esc(s.yanliAciklama)}</p>
        </div>
        <div class="slayt-kars-kart dogru">
          <span class="slayt-kars-etiket">${esc(s.dogruBaslik || '✓ Seçkisiz & Temsili Örnekleme')}</span>
          <p>${esc(s.dogruAciklama)}</p>
        </div>
      </div>`;
    }
    if (s.slide_type === 'stratified_grid') {
      const tabakalar = Array.isArray(s.tabakalar) ? s.tabakalar : [];
      return `<div class="slayt-tabaka-izgara">
        ${tabakalar.map((t, ti) => `<div class="slayt-tabaka-kart t-${ti}">
          <div class="tabaka-ust"><b>${esc(t.ad)}</b><span>${esc(t.oran || 'Eşit temsil')}</span></div>
          <div class="tabaka-noktalar" aria-hidden="true">
            ${Array.from({ length: 15 }, (_, ni) => `<i class="${ni < 5 ? 'secili' : ''}"></i>`).join('')}
          </div>
          <div class="tabaka-sayilar">
            <span>Evren: <b>${esc(t.evrenSayi)}</b></span>
            <span>Örneklem: <b>${esc(t.orneklemSayi)}</b></span>
          </div>
        </div>`).join('')}
      </div>
      ${s.toplamNot ? `<div class="slayt-ref-serit">${esc(s.toplamNot)}</div>` : ''}`;
    }

    /* MODÜL 5 ŞABLONLARI: instrument_blueprint, bullseye_targets, threat_diagnosis */
    if (s.slide_type === 'instrument_blueprint') {
      return `<div class="slayt-arac-sema">
        <div class="arac-sol">
          <small>Ölçülmek İstenen Hedef Yapı</small>
          <b>${esc(s.olculenYapi)}</b>
        </div>
        <div class="arac-ok">→</div>
        <div class="arac-sag">
          <small>Seçilen Veri Toplama Aracı</small>
          <b>${esc(s.secilenArac)}</b>
          <p>${esc(s.aracGerekce || '')}</p>
        </div>
      </div>
      ${Array.isArray(s.kontrolListesi) ? `<div class="slayt-kontrol-serit"><b>Standardizasyon Kriterleri:</b> ${s.kontrolListesi.map(k => `<span>✓ ${esc(k)}</span>`).join('')}</div>` : ''}`;
    }
    if (s.slide_type === 'bullseye_targets') {
      const hedefler = Array.isArray(s.hedefler) ? s.hedefler : [];
      return `<div class="slayt-hedef-izgara">
        ${hedefler.map(h => `<div class="slayt-hedef-kart ${esc(h.tip || '')}">
          ${hedefSVG(h.tip || 'merkez')}
          <b>${esc(h.baslik)}</b>
          <p>${esc(h.aciklama)}</p>
        </div>`).join('')}
      </div>`;
    }
    if (s.slide_type === 'threat_diagnosis') {
      return `<div class="slayt-ikili-kars">
        <div class="slayt-kars-kart yanlis">
          <span class="slayt-kars-etiket">🎯 Geçerlik Tehdidi (Yanlış Özelliği Ölçme)</span>
          <p><b>Sorun:</b> ${esc(s.gecerlikTehdidi)}</p>
          <p class="onlem-satir"><b>Önlem:</b> ${esc(s.gecerlikOnlem)}</p>
        </div>
        <div class="slayt-kars-kart kismi">
          <span class="slayt-kars-etiket">⚖️ Güvenirlik Tehdidi (Tutarsız Ölçüm)</span>
          <p><b>Sorun:</b> ${esc(s.guvenirlikTehdidi)}</p>
          <p class="onlem-satir"><b>Önlem:</b> ${esc(s.guvenirlikOnlem)}</p>
        </div>
      </div>`;
    }

    /* MODÜL 6 ŞABLONLARI: data_cleaning_table, correlation_vs_causation, limitations_report */
    if (s.slide_type === 'data_cleaning_table') {
      const satirlar = Array.isArray(s.satirlar) ? s.satirlar : [];
      return `<div class="slayt-veri-tablo-sarici">
        <table class="slayt-veri-tablo">
          <thead>
            <tr><th>Karşılaştırma Grubu</th><th>Katılımcı (n)</th><th>${esc(s.olcuBirimi || 'Ortalama')}</th><th>Gözlenen Düzey</th></tr>
          </thead>
          <tbody>
            ${satirlar.map(st => `<tr>
              <td><b>${esc(st.grup)}</b></td>
              <td>${esc(st.n || '60')}</td>
              <td class="deger-hucre"><b>${esc(st.ortalama)}</b></td>
              <td><span>${esc(st.not || '')}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${s.temizlikNotu ? `<div class="slayt-ref-serit">${esc(s.temizlikNotu)}</div>` : ''}`;
    }
    if (s.slide_type === 'correlation_vs_causation') {
      return `<div class="slayt-ikili-kars">
        <div class="slayt-kars-kart yanlis">
          <span class="slayt-kars-etiket">${esc(s.yanlisBaslik || '✕ Aşırı Genelleme / Kanıtsız Nedensellik')}</span>
          <b>${esc(s.yanlisMetin)}</b>
          <p>${esc(s.yanlisNeden)}</p>
        </div>
        <div class="slayt-kars-kart dogru">
          <span class="slayt-kars-etiket">${esc(s.dogruBaslik || '✓ Nesnel & Veriye Sadık Bulgu Cümlesi')}</span>
          <b>“${esc(s.dogruMetin)}”</b>
          <p>${esc(s.dogruNeden)}</p>
        </div>
      </div>`;
    }
    if (s.slide_type === 'limitations_report') {
      const sinirliliklar = Array.isArray(s.sinirliliklar) ? s.sinirliliklar : [];
      return `<div class="slayt-rapor-kutu">
        <div class="rapor-bulgu-serit"><small>Raporlanan Temel Bulgu</small><b>${esc(s.bulguOzeti)}</b></div>
        <div class="rapor-sinirlilik-liste">
          <small>Araştırmanın Sınırlılıkları &amp; Şeffaflık Notları</small>
          <ul>${sinirliliklar.map(sn => `<li>${esc(sn)}</li>`).join('')}</ul>
        </div>
      </div>`;
    }

    /* Genel / Özet İlişki Şeması (summary_relation) */
    return `<div class="slayt-ozet-izgara">
        <div class="slayt-ozet-kutu"><small>${esc(s.solEtiket || 'Bağımsız değişken')}</small><b>${esc(s.bagimsiz)}</b><span>${esc(s.solAlt || 'Temel girdi / Değiştirilen')}</span></div>
        <div class="slayt-ozet-ok">${svgIc('sag')}</div>
        <div class="slayt-ozet-kutu turuncu"><small>${esc(s.sagEtiket || 'Bağımlı değişken')}</small><b>${esc(s.bagimli)}</b><span>${esc(s.sagAlt || 'Ölçülen çıktı / Sonuç')}</span></div>
      </div>
      ${Array.isArray(s.kontrolList) && s.kontrolList.length ? `<div class="slayt-kontrol-serit" style="justify-content:center"><b>Sabit tutulanlar:</b> ${s.kontrolList.map(k => `<span>${esc(k)}</span>`).join('')}</div>` : ''}
      <p class="slayt-ozet-not">${esc(s.ozetNot)}</p>`;
  }

  /* Etkileşimli sunum bileşeni (hem Ders ekranında hem Jüri sunumunda mount edilir) */
  function createPlayer(host, profil, opts = {}) {
    if (!host) return { destroy() {} };
    const slaytlar = profil.slaytlar;
    let idx = Math.max(0, Math.min(slaytlar.length - 1, opts.initialSlide || 0));
    let metinAcik = !!opts.metinAcik;
    let otomatik = opts.otomatik !== false;
    let hiz = 1;
    let caliyor = false;
    let ilerlemeOran = 0;
    let timer = null;
    let audioEl = null;
    let baslangic = 0;
    let destroyed = false;

    const durdurSes = () => {
      caliyor = false;
      clearInterval(timer);
      timer = null;
      if (audioEl) {
        try { audioEl.pause(); audioEl.currentTime = 0; } catch (e) { /* yoksay */ }
        audioEl = null;
      }
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* yoksay */ }
      }
    };

    const guncelleProgressDOM = () => {
      const segs = [...host.querySelectorAll('.slayt-seg')];
      segs.forEach((seg, i) => {
        const bar = seg.querySelector('i');
        seg.classList.toggle('bitti', i < idx);
        if (i < idx) bar.style.width = '100%';
        else if (i === idx) bar.style.width = (caliyor ? (ilerlemeOran * 100).toFixed(1) : '100') + '%';
        else bar.style.width = '0%';
      });
      const btn = host.querySelector('.slayt-oynat-btn');
      if (btn) {
        btn.classList.toggle('caliyor', caliyor);
        btn.innerHTML = svgIc(caliyor ? 'dur' : 'ses');
        btn.setAttribute('aria-label', caliyor ? 'Seslendirmeyi duraklat' : 'Adımı seslendir');
      }
    };

    const baslatSes = () => {
      durdurSes();
      const s = slaytlar[idx];
      caliyor = true;
      ilerlemeOran = 0;
      baslangic = performance.now();
      const sureMs = ((s.estimated_duration_seconds || 15) * 1000) / hiz;

      if (s.audio_data_url) {
        try {
          audioEl = new Audio(s.audio_data_url);
          audioEl.playbackRate = hiz;
          audioEl.ontimeupdate = () => {
            if (!audioEl || !audioEl.duration || destroyed || !caliyor) return;
            ilerlemeOran = Math.min(1, audioEl.currentTime / audioEl.duration);
            guncelleProgressDOM();
          };
          audioEl.onended = () => {
            if (destroyed || !caliyor) return;
            ilerlemeOran = 1;
            guncelleProgressDOM();
            if (otomatik && idx < slaytlar.length - 1) { idx++; draw(); baslatSes(); }
            else { durdurSes(); guncelleProgressDOM(); }
          };
          audioEl.onerror = () => {
            if (destroyed || !caliyor) return;
            audioEl = null;
            baslatSpeechFallback();
          };
          const pr = audioEl.play();
          if (pr && pr.catch) pr.catch(() => { if (!destroyed && caliyor) { audioEl = null; baslatSpeechFallback(); } });
          guncelleProgressDOM();
          return;
        } catch (e) { audioEl = null; }
      }

      function baslatSpeechFallback() {
        if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
          try {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            const u = new SpeechSynthesisUtterance(s.narration);
            u.lang = 'tr-TR';
            u.rate = hiz;
            const sesler = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
            const tr = sesler.find(v => /^tr/i.test(v.lang));
            if (tr) u.voice = tr;
            u.onend = () => {
              if (destroyed || !caliyor) return;
              ilerlemeOran = 1;
              guncelleProgressDOM();
              if (otomatik && idx < slaytlar.length - 1) { idx++; draw(); baslatSes(); }
              else { durdurSes(); guncelleProgressDOM(); }
            };
            u.onerror = () => { /* Görsel zamanlayıcı ile devam eder */ };
            window.speechSynthesis.speak(u);
          } catch (e) { /* TTS yedek zamanlayıcı ile devam eder */ }
        }
        if (!timer) {
          baslangic = performance.now();
          timer = setInterval(() => {
            if (destroyed || !caliyor) return;
            ilerlemeOran = Math.min(1, (performance.now() - baslangic) / sureMs);
            guncelleProgressDOM();
            if (ilerlemeOran >= 1 && !(window.speechSynthesis && window.speechSynthesis.speaking)) {
              if (otomatik && idx < slaytlar.length - 1) { idx++; draw(); baslatSes(); }
              else { durdurSes(); guncelleProgressDOM(); }
            }
          }, 120);
        }
        guncelleProgressDOM();
      }
      baslatSpeechFallback();
    };

    function draw() {
      const s = slaytlar[idx];
      const son = idx === slaytlar.length - 1;
      const altSag = son && opts.onCompleteHash
        ? `<a class="btn-koyu" href="#${esc(opts.onCompleteHash)}" data-act="${esc(opts.onCompleteAct || '')}" data-m="${esc(opts.moduleId || '')}">${esc(opts.completeLabel || 'Mikro-göreve geç')} ${svgIc('sag')}</a>`
        : `<button type="button" class="btn-koyu" data-slayt="ileri"${son ? ' disabled' : ''}>Sonraki adım ${svgIc('sag')}</button>`;

      host.innerHTML = `<div class="slayt-sarici">
        <div class="slayt-kart">
          <div class="slayt-ust">
            <div>
              <span class="slayt-adim-etiket">ADIM ${idx + 1} / ${slaytlar.length}</span>
              <h2>${esc(s.ustBaslik)}</h2>
              <p>${esc(s.altBaslik)}</p>
            </div>
            <span class="slayt-sure-rozet">${svgIc('ses')} ~${s.estimated_duration_seconds} sn · Toplam ${esc(profil.sureToplam)}</span>
          </div>
          <div class="slayt-sahne">${slaytGovde(profil, s)}</div>
          <div class="slayt-ilerleme" role="tablist" aria-label="Slayt adımları">
            ${slaytlar.map((sl, i) => `<button type="button" class="slayt-seg${i < idx ? ' bitti' : ''}" data-slayt-git="${i}" aria-label="${esc(sl.kisaAd)}"><i style="width:${i <= idx ? '100%' : '0%'}"></i></button>`).join('')}
          </div>
          <div class="slayt-kontroller">
            <div class="slayt-ses-sol">
              <button type="button" class="slayt-ses-btn" data-slayt="geri" aria-label="Önceki adım"${idx === 0 ? ' disabled' : ''}>${svgIc('geri')}</button>
              <button type="button" class="slayt-oynat-btn${caliyor ? ' caliyor' : ''}" data-slayt="oynat" aria-label="${caliyor ? 'Seslendirmeyi duraklat' : 'Adımı seslendir'}">${svgIc(caliyor ? 'dur' : 'ses')}</button>
              <button type="button" class="slayt-ses-btn" data-slayt="ileri" aria-label="Sonraki adım"${son ? ' disabled' : ''}>${svgIc('ileri')}</button>
              <span class="slayt-sayac">${idx + 1} / ${slaytlar.length}</span>
              <button type="button" class="slayt-pil" data-slayt="hiz" title="Seslendirme hızını değiştir">${String(hiz).replace('.', ',')}×</button>
              <button type="button" class="slayt-pil${otomatik ? ' on' : ''}" data-slayt="otomatik">${otomatik ? 'Otomatik: Açık' : 'Otomatik: Kapalı'}</button>
            </div>
            <button type="button" class="slayt-pil${metinAcik ? ' on' : ''}" data-slayt="metin">${svgIc('metin')} Metin</button>
          </div>
          ${metinAcik ? `<div class="slayt-metin-kutu">
            <div class="slayt-metin-ust"><span>Seslendirme metni · Google TTS önbellek yolu: <code>${esc(s.audio_path)}</code></span><span>~${s.estimated_duration_seconds} sn</span></div>
            <p>${esc(s.narration)}</p>
          </div>` : ''}
        </div>
        <div class="slayt-kucukler" role="tablist" aria-label="Slayt önizlemeleri">
          ${slaytlar.map((sl, i) => `<button type="button" class="slayt-kucuk${i === idx ? ' on' : ''}" data-slayt-git="${i}" aria-current="${i === idx ? 'step' : 'false'}">
            <span class="slayt-kucuk-on">${svgIc(sl.ikon)}</span>
            <span>${esc(sl.kisaAd)}</span>
          </button>`).join('')}
        </div>
        <div class="slayt-alt">
          <button type="button" class="btn ghost btn-pil" data-slayt="geri"${idx === 0 ? ' disabled' : ''}>${svgIc('sol')} Önceki</button>
          ${altSag}
        </div>
      </div>`;
      guncelleProgressDOM();
    }

    const onClick = ev => {
      const git = ev.target.closest('[data-slayt-git]');
      if (git) {
        const yeni = +git.dataset.slaytGit;
        const devam = caliyor;
        durdurSes();
        idx = yeni;
        draw();
        if (devam) baslatSes();
        return;
      }
      const act = ev.target.closest('[data-slayt]');
      if (!act || act.disabled) return;
      const tur = act.dataset.slayt;
      if (tur === 'geri' && idx > 0) { const d = caliyor; durdurSes(); idx--; draw(); if (d) baslatSes(); }
      else if (tur === 'ileri' && idx < slaytlar.length - 1) { const d = caliyor; durdurSes(); idx++; draw(); if (d) baslatSes(); }
      else if (tur === 'oynat') { if (caliyor) { durdurSes(); guncelleProgressDOM(); } else baslatSes(); }
      else if (tur === 'metin') { metinAcik = !metinAcik; draw(); }
      else if (tur === 'otomatik') { otomatik = !otomatik; draw(); }
      else if (tur === 'hiz') {
        const hizlar = [1, 1.25, 1.5, 0.75];
        hiz = hizlar[(hizlar.indexOf(hiz) + 1) % hizlar.length];
        if (caliyor) baslatSes();
        else draw();
      }
    };

    host.addEventListener('click', onClick);
    draw();

    return {
      destroy() {
        destroyed = true;
        durdurSes();
        host.removeEventListener('click', onClick);
      },
    };
  }

  return { PROFILLER, JURI_DENEY_BAGLAMLAR, getDeneySlayt, baglamdanUret, createPlayer };
})();
