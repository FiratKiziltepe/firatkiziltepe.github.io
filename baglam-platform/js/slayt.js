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

  /* Öğrenci ders ekranında (#ders-m2-ornek) başka bir ilgi alanı seçilmişse
     o bağlamın senaryo nesnesinden (c) dinamik 5 slaytlık yapı üretir. */
  function baglamdanUret(b) {
    if (b.alt && b.alt.id === 'spor.basketbol') return PROFILLER[1];
    if (b.alt && b.alt.id === 'yemek.kahve') return PROFILLER[2];
    const c = b.c, et = c.veri.etiket, dg = c.veri.deger;
    return {
      id: b.alt ? b.alt.id : 'genel',
      etiket: b.alt ? b.alt.ad : 'Kişiselleştirilmiş bağlam',
      kisa: b.alt ? b.alt.ad : 'Seçili bağlam',
      altBaslik: c.tema,
      sureToplam: '78 sn',
      temaTip: b.ilgi ? b.ilgi.id : 'genel',
      slaytlar: [
        {
          slide_id: 1, slide_type: 'scenario_scene', kisaAd: '1. Senaryo', ikon: 'odul',
          ustBaslik: 'Bir araştırma senaryosu', altBaslik: c.tema, soru: c.soru,
          image_path: `images/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s1.png`,
          audio_path: `audio/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s1.mp3`,
          narration: `${c.gozlem} Bu gözlemden yola çıkarak araştırma sorumuz: ${c.soru}`,
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 2, slide_type: 'condition_cards', kisaAd: '2. Araştırma', ikon: 'izgara',
          ustBaslik: 'Araştırma nasıl yürütülüyor?', altBaslik: c.veri.olcu,
          kosullar: et.map((ad, idx) => ({ ad, deger: String(dg[idx]), diyagram: `genel${idx + 1}` })),
          dipnot: 'Örnek amaçlı kurgusal araştırma verileri',
          audio_path: `audio/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s2.mp3`,
          narration: `Araştırmacı ${et.join(', ')} koşullarını karşılaştırarak "${c.veri.olcu}" ölçümünü kaydetmiştir.`,
          estimated_duration_seconds: 17,
        },
        {
          slide_id: 3, slide_type: 'independent_var', kisaAd: '3. Bağımsız değişken', ikon: 'dal',
          ustBaslik: 'Bağımsız değişkeni belirleyelim', altBaslik: 'Araştırmacının değiştirdiği unsur',
          degisken: c.bagimsiz, seviyeler: et, digerRef: `Ölçülen sonuç: ${c.bagimli}`,
          audio_path: `audio/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s3.mp3`,
          narration: `Araştırmacının karşılaştırdığı ve değiştirdiği unsur "${c.bagimsiz}" olduğu için bağımsız değişken budur.`,
          estimated_duration_seconds: 15,
        },
        {
          slide_id: 4, slide_type: 'dependent_var', kisaAd: '4. Bağımlı değişken', ikon: 'grafik',
          ustBaslik: 'Bağımlı değişkeni belirleyelim', altBaslik: 'Araştırmacının ölçtüğü sonuç',
          degisken: c.bagimli, oncekiRef: `Değiştirilen unsur: ${c.bagimsiz}`,
          veri: et.map((etiket, idx) => ({ etiket, deger: dg[idx] })),
          audio_path: `audio/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s4.mp3`,
          narration: `Değişime bağlı olarak ölçülen sonuç "${c.bagimli}" olduğundan bağımlı değişken budur.`,
          estimated_duration_seconds: 16,
        },
        {
          slide_id: 5, slide_type: 'summary_relation', kisaAd: '5. Özet', ikon: 'tik',
          ustBaslik: 'Araştırmanın değişkenleri', altBaslik: 'Çözümün özeti',
          bagimsiz: c.bagimsiz, bagimli: c.bagimli,
          ozetNot: 'Bir değişkeni değiştiriyor, diğerindeki sonucu ölçüyoruz.',
          audio_path: `audio/m2-${b.alt ? b.alt.id.replace(/\./g, '-') : 'genel'}-s5.mp3`,
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

  function slaytGovde(profil, s) {
    if (s.slide_type === 'scenario_scene') {
      const gorsel = s.image_data_url
        ? `<img class="slayt-uretilen-img" src="${s.image_data_url}" alt="${esc(s.altBaslik || s.ustBaslik)}">`
        : sahneSVG(profil.temaTip);
      return `<div class="slayt-gorsel-kutu">${gorsel}<span class="slayt-dosya-etiket">${esc(s.image_path)}</span></div>
        <div class="slayt-soru-serit">${esc(s.soru)}</div>`;
    }
    if (s.slide_type === 'condition_cards') {
      return `<div class="slayt-kosul-izgara">${s.kosullar.map((k, idx) => `<div class="slayt-kosul">${diyagramSVG(k.diyagram || 'genel', idx)}<small>${esc(k.ad)}</small><b>${esc(k.deger)}</b></div>`).join('')}</div>
        <p class="slayt-dipnot">${esc(s.dipnot)}</p>`;
    }
    if (s.slide_type === 'independent_var') {
      return `<div class="slayt-vurgu-kutu">
          <span class="slayt-vurgu-ust">Araştırmacının değiştirdiği</span>
          <b class="slayt-vurgu-ad">${esc(s.degisken)}</b>
          <div class="slayt-seviyeler">${s.seviyeler.map(sv => `<div class="slayt-seviye">${esc(sv)}</div>`).join('')}</div>
          <span class="slayt-vurgu-alt">Bağımsız değişken</span>
        </div>
        <div class="slayt-ref-serit">${esc(s.digerRef)}</div>`;
    }
    if (s.slide_type === 'dependent_var') {
      const max = Math.max(...s.veri.map(v => Number(v.deger) || 0), 1);
      return `<div class="slayt-ref-serit">${esc(s.oncekiRef)}</div>
        <div class="slayt-vurgu-kutu turuncu">
          <span class="slayt-vurgu-ust">Araştırmacının ölçtüğü</span>
          <b class="slayt-vurgu-ad">${esc(s.degisken)}</b>
          <div class="slayt-barlar">${s.veri.map(v => `<div class="slayt-bar-satir"><span>${esc(v.etiket)}</span><div class="slayt-bar-yol"><i style="width:${Math.max(18, (v.deger / max) * 92).toFixed(1)}%"></i></div><b>${esc(v.deger)}</b></div>`).join('')}</div>
          <span class="slayt-vurgu-alt">Bağımlı değişken</span>
        </div>`;
    }
    return `<div class="slayt-ozet-izgara">
        <div class="slayt-ozet-kutu"><small>Bağımsız değişken</small><b>${esc(s.bagimsiz)}</b><span>Değiştirilen</span></div>
        <div class="slayt-ozet-ok">${svgIc('sag')}</div>
        <div class="slayt-ozet-kutu turuncu"><small>Bağımlı değişken</small><b>${esc(s.bagimli)}</b><span>Ölçülen</span></div>
      </div>
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

  return { PROFILLER, baglamdanUret, createPlayer };
})();
