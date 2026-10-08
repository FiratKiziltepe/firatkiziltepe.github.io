/* TTKB Ders Kitabı İnceleme Sistemi — prototip demo verisi.
   Veritabanı yoktur; tüm kayıtlar bu dosyadan üretilir ve tarayıcıda (localStorage) saklanır. */
(function () {
  "use strict";

  const DOC_ID = "demo-sb7-2026";

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const BOOK = {
    id: DOC_ID,
    title: "7. Sınıf Sosyal Bilgiler Ders Kitabı",
    shortTitle: "Sosyal Bilgiler 7",
    subject: "Sosyal Bilgiler",
    grade: "7. Sınıf",
    publisher: "Örnek Yayınevi",
    pageCount: 276,
    pageSize: { w: 760, h: 1072 },
  };

  const REVIEWERS = {
    me: { id: "me", name: "Dr. Elif Arslan", short: "E. Arslan", initials: "EA", role: "Panelist A", tag: "A" },
    b: { id: "b", name: "Doç. Dr. Murat Kaya", short: "M. Kaya", initials: "MK", role: "Panelist B", tag: "B" },
    c: { id: "c", name: "Dr. Zeynep Aksoy", short: "Z. Aksoy", initials: "ZA", role: "Panelist C", tag: "C" },
  };

  const PHASES = {
    1: { label: "Aşama 1 · Bağımsız İnceleme", short: "Aşama 1", info: "Bağımsız inceleme 13 Ekim 2026'da sona erer." },
    2: { label: "Aşama 2 · Panel Öncesi Değerlendirme", short: "Aşama 2", info: "Panel toplantısı: 21 Ekim 2026, 10.00" },
  };
  const DEADLINE = "2026-10-13";

  /* İnceleme ölçütleri: Ana kriter (1.x) → Alt kriter (1.x.y). Alt kriterler uzun metinlidir; arayüzde aranabilir combobox ile seçilir. */
  const CRITERIA_RAW = [
    ["1.1", "Anayasa ve Mevzuata Uygunluk", [
      ["1.1.1", "İçerikte Anayasa, taraf olduğumuz milletlerarası anlaşmalar, kanunlar ve diğer mevzuata aykırı bir husus bulunmamalıdır."],
      ["1.1.2", "Türkiye Cumhuriyeti'ni uluslararası alanlarda zor duruma düşürecek veya millî menfaatlere zarar verecek içerik bulunmamalıdır."],
      ["1.1.3", "İçerikte tarafsızlık ilkesi gözetilerek kişileri ve toplulukları aşağılayıcı, dışlayıcı, etiketleyici veya aşırı yüceltici ifadeler bulunmamalıdır."],
      ["1.1.4", "İçerikte kullanılan ögeler haksız rekabete yol açabilecek lehte veya aleyhte reklam yahut manipülasyon unsuru taşımamalı, ticari bir tercih ve yönlendirme içermemeli, çağrışımda bulunmamalıdır."],
      ["1.1.5", "İçerikte kullanılan metin, görsel ve diğer ögelerde fikrî ve sınai haklara ilişkin mevzuata uyulmalıdır."],
      ["1.1.6", "İçerik millî birlik ve beraberliği zedeleyici, şiddeti veya bağımlılık yapıcı alışkanlıkları özendirici ögeler içermemelidir."],
    ]],
    ["1.2", "Bilimsel İçerik", [
      ["1.2.1", "İçerikte yer alan bilgiler bilimsel olarak doğru olmalı, bilgi hatası içermemelidir."],
      ["1.2.2", "Kavramlar doğru ve tutarlı kullanılmalı, kavram yanılgısına yol açacak ifadelere yer verilmemelidir."],
      ["1.2.3", "Verilen istatistiki bilgiler ve veriler güncel olmalı, resmî ve güvenilir kaynaklara dayanmalıdır."],
      ["1.2.4", "Alıntılar ve yararlanılan kaynaklar usulüne uygun biçimde gösterilmelidir."],
      ["1.2.5", "Genellemeler ve yargılar bilimsel kanıtlara dayanmalı, aşırı genelleme içermemelidir."],
    ]],
    ["1.3", "Dil ve Anlatım", [
      ["1.3.1", "Türkçe; Türk Dil Kurumunun Yazım Kılavuzu ve Güncel Türkçe Sözlük esas alınarak yazım ve noktalama kurallarına uygun kullanılmalıdır."],
      ["1.3.2", "Cümleler anlatım bozukluğu içermemeli, açık ve anlaşılır olmalıdır."],
      ["1.3.3", "Terimler ilk geçtiği yerde açıklanmalı ve kitap genelinde tutarlı kullanılmalıdır."],
      ["1.3.4", "Dil ve anlatım öğrencilerin yaş ve gelişim düzeyine uygun olmalıdır."],
    ]],
    ["1.4", "Öğretim Programına (TYMM) Uygunluk", [
      ["1.4.1", "İçerik, öğretim programında yer alan öğrenme çıktıları ve süreç bileşenleriyle uyumlu olmalıdır."],
      ["1.4.2", "Öğretim programında yer alan değerler ve eğilimler içerikte açık veya örtük biçimde yeterli düzeyde işlenmelidir."],
      ["1.4.3", "Etkinlikler alan becerilerini ve kavramsal becerileri geliştirecek nitelikte olmalıdır."],
      ["1.4.4", "Ünite ve konu sıralaması öğretim programıyla uyumlu olmalıdır."],
    ]],
    ["1.5", "Görsel Tasarım", [
      ["1.5.1", "Görseller metinle uyumlu olmalı, içeriği desteklemeli ve görsel altı yazıları doğru olmalıdır."],
      ["1.5.2", "Görseller baskıya uygun çözünürlükte, net ve anlaşılır olmalıdır."],
      ["1.5.3", "Sayfa düzeni okunabilirliği desteklemeli, ögeler arasında yeterli boşluk bulunmalıdır."],
      ["1.5.4", "Harita, grafik ve tablolar doğru olmalı; ölçek, lejant ve kaynak bilgisi içermelidir."],
      ["1.5.5", "Kullanılan görsellerin kaynakları görsel kaynakçada eksiksiz gösterilmelidir."],
    ]],
    ["1.6", "Ölçme ve Değerlendirme", [
      ["1.6.1", "Sorular bilimsel olarak doğru olmalı, tek ve kesin doğru cevaba sahip olmalıdır."],
      ["1.6.2", "Cevap anahtarı doğru ve güncel olmalıdır."],
      ["1.6.3", "Sorular farklı bilişsel düzeyleri ölçecek çeşitlilikte olmalıdır."],
    ]],
    ["1.7", "Etkinlikler", [
      ["1.7.1", "Etkinlik yönergeleri açık ve anlaşılır olmalıdır."],
      ["1.7.2", "Etkinlikler sınıf ortamında uygulanabilir olmalıdır."],
      ["1.7.3", "Etkinlik için gerekli materyal ve süre belirtilmeli, materyaller kitapta sağlanmalıdır."],
    ]],
  ];
  const SUBS = [];
  const CRITERIA = CRITERIA_RAW.map(([code, name, subs]) => {
    const c = { id: code, code, name, subs: [] };
    subs.forEach(([sc, text]) => { const label = `${sc} ${text}`; SUBS.push({ code: sc, text, label, main: name, mainCode: code }); c.subs.push(label); });
    return c;
  });
  const subLabel = (code) => (SUBS.find((s) => s.code === code) || {}).label || code;
  const TYMM_MAIN = "Öğretim Programına (TYMM) Uygunluk";
  const TYMM_SUB = subLabel("1.4.2");

  /* Eski kısa kriter adlarından yeni koda eşleme (demo kayıtları için) */
  const LEGACY = {
    "Bilimsel doğruluk": "1.2.1", "Kavram yanılgısı": "1.2.2", "Güncellik": "1.2.3", "Kaynak gösterimi": "1.2.4",
    "Yazım ve noktalama": "1.3.1", "Anlatım bozukluğu": "1.3.2", "Terim kullanımı": "1.3.3", "Seviyeye uygunluk": "1.3.4",
    "Öğrenme çıktılarıyla uyum": "1.4.1", "Değer ve Eğilimlerin İşlenmesi": "1.4.2",
    "Görsel-metin uyumu": "1.5.1", "Görsel kalitesi": "1.5.2", "Sayfa düzeni": "1.5.3", "Harita/grafik doğruluğu": "1.5.4",
    "Soru doğruluğu": "1.6.1", "Cevap anahtarı": "1.6.2", "Soru seviyesi": "1.6.3", "Süre ve materyal": "1.7.3",
    "Ticari unsur": "1.1.4", "Ayrımcılık ve önyargı": "1.1.3",
  };
  function mapLegacy(rec) {
    const code = LEGACY[rec.sub];
    if (!code) return;
    const s = SUBS.find((x) => x.code === code);
    rec.main = s.main; rec.sub = s.label;
  }

  /* YAZDİS kriter önerisi (prototip): API yerine önceden tanımlı anahtar kelime kuralları */
  const SUGGEST_RULES = [
    { sub: "1.1.4", kw: ["reklam", "marka", "ticari", "firma", "şirket", "ürün tanıt", "satın al", "yönlendir", "uygulamasından", "kırtasiye", "sponsor", "logo"], why: "ticari yönlendirme / reklam unsuru", stmt: "İçerikte belirli bir ürün, hizmet veya markaya yönelik reklam unsuru bulunmaktadır. Ticari tercihe yönlendiren ifade çıkarılmalı veya marka içermeyecek şekilde düzenlenmelidir." },
    { sub: "1.1.1", kw: ["anayasa", "kanun", "mevzuat", "yasa", "hukuka aykırı", "yönetmelik"], why: "mevzuata aykırılık", stmt: "İçerikteki ifade ilgili mevzuat hükümleriyle çelişmektedir; mevzuata uygun hâle getirilmelidir." },
    { sub: "1.1.2", kw: ["millî menfaat", "milli menfaat", "uluslararası", "ülkemiz", "sınır", "devletin itibar", "zor duruma"], why: "millî menfaat / uluslararası temsil", stmt: "İçerik Türkiye Cumhuriyeti'ni uluslararası alanda zor duruma düşürebilecek nitelikte olduğundan düzenlenmelidir." },
    { sub: "1.1.3", kw: ["aşağıla", "dışla", "etiket", "ayrımcı", "önyargı", "kalıp yargı", "klişe", "cinsiyet", "yücelt", "küçümse", "ırk", "taraflı"], why: "tarafsızlık / ayrımcı ifade", stmt: "İçerikte kişi veya toplulukları etiketleyici / dışlayıcı bir ifade bulunmaktadır; tarafsızlık ilkesine uygun biçimde düzenlenmelidir." },
    { sub: "1.1.5", kw: ["telif", "izinsiz", "lisans", "kopyala"], why: "telif hakkı", stmt: "Kullanılan ögeye ilişkin telif izni bulunmamaktadır; telif belgesi sunulmalı veya öge değiştirilmelidir." },
    { sub: "1.1.6", kw: ["şiddet", "bağımlılık", "sigara", "alkol", "kumar"], why: "zararlı alışkanlık / şiddet", stmt: "İçerikte zararlı alışkanlıkları veya şiddeti özendirebilecek bir öge bulunmaktadır; çıkarılmalıdır." },
    { sub: "1.2.1", kw: ["yanlış", "hatalı", "hata", "doğru değil", "yanlış bilgi", "tarih yanlış", "yanlış yazılmış", "aslında"], why: "bilgi hatası", stmt: "İfadede bilgi hatası bulunmaktadır; bilgi güvenilir kaynaklara göre düzeltilmelidir." },
    { sub: "1.2.2", kw: ["kavram", "karıştır", "yanılgı", "eş anlamlı değil"], why: "kavram yanılgısı", stmt: "Kavram hatalı kullanılmıştır; kavram yanılgısına yol açmayacak şekilde düzeltilmelidir." },
    { sub: "1.2.3", kw: ["güncel değil", "eski veri", "istatistik", "güncellen", "veri eski", "rakam", "oran"], why: "güncel olmayan veri", stmt: "Verilen istatistiki bilgi güncel değildir; resmî kaynaklardan güncel veri ve kaynak yılı eklenmelidir." },
    { sub: "1.2.4", kw: ["kaynak", "alıntı", "atıf", "kaynakça"], why: "kaynak gösterimi", stmt: "Alıntının kaynağı belirtilmemiştir; kaynak usulüne uygun gösterilmelidir." },
    { sub: "1.2.5", kw: ["genelle", "tüm ", "hepsi", "her zaman", "kesin yargı", "yalnızca"], why: "aşırı genelleme", stmt: "İfadede aşırı genelleme bulunmaktadır; yargı bilimsel kanıtlara uygun şekilde sınırlandırılmalıdır." },
    { sub: "1.3.1", kw: ["yazım", "imla", "noktalama", "bitişik", "ayrı yazıl", "büyük harf", "virgül", "tdk"], why: "yazım / noktalama", stmt: "İfadede yazım/noktalama hatası bulunmaktadır; TDK Yazım Kılavuzu'na göre düzeltilmelidir." },
    { sub: "1.3.2", kw: ["anlatım bozukluğu", "cümle", "çatı", "anlam belirsiz", "özne", "yüklem", "devrik"], why: "anlatım bozukluğu", stmt: "Cümlede anlatım bozukluğu bulunmaktadır; açık ve anlaşılır biçimde yeniden düzenlenmelidir." },
    { sub: "1.3.3", kw: ["terim", "tutarsız", "açıklanmamış"], why: "terim kullanımı", stmt: "Terim ilk geçtiği yerde açıklanmamış/tutarsız kullanılmıştır." },
    { sub: "1.3.4", kw: ["seviye", "ağır", "anlaşılmaz", "zor kelime", "düzeyin üzerinde", "akademik"], why: "seviyeye uygunluk", stmt: "İfade öğrencilerin gelişim düzeyinin üzerindedir; sadeleştirilmelidir." },
    { sub: "1.4.1", kw: ["öğrenme çıktı", "kazanım", "programla uyum", "program dışı"], why: "öğrenme çıktısıyla uyum", stmt: "İçerik ilgili öğrenme çıktısıyla uyumlu değildir." },
    { sub: "1.4.2", kw: ["değer", "eğilim", "tymm", "merak", "doğruluk değeri"], why: "değer / eğilim işlenişi", stmt: "İlgili değer/eğilim yeterli düzeyde işlenmemiştir." },
    { sub: "1.5.1", kw: ["görsel", "resim", "fotoğraf", "altyazı", "görsel altı"], why: "görsel-metin uyumu", stmt: "Görsel ile metin arasında uyumsuzluk bulunmaktadır; görsel veya görsel altı yazısı düzeltilmelidir." },
    { sub: "1.5.2", kw: ["çözünürl", "bulanık", "net değil", "piksel", "okunmuyor", "kalitesi düşük", "silik"], why: "görsel kalitesi", stmt: "Görselin çözünürlüğü baskı için yetersizdir; yüksek çözünürlüklü görsel kullanılmalıdır." },
    { sub: "1.5.3", kw: ["boşluk", "sayfa düzeni", "tasarım", "punto", "sıkışık", "taşmış"], why: "sayfa düzeni", stmt: "Sayfa düzeni okunabilirliği olumsuz etkilemektedir; ögeler arasında yeterli boşluk bırakılmalıdır." },
    { sub: "1.5.4", kw: ["harita", "grafik", "tablo", "lejant", "ölçek"], why: "harita / grafik", stmt: "Harita/grafikte hata bulunmaktadır; lejant, ölçek ve kaynak bilgisi düzeltilmelidir." },
    { sub: "1.6.1", kw: ["soru", "şık", "seçenek", "iki doğru", "birden fazla doğru"], why: "soru doğruluğu", stmt: "Soruda birden fazla doğru cevap bulunmakta/ayırt edicilik zayıftır; soru düzenlenmelidir." },
    { sub: "1.6.2", kw: ["cevap anahtarı"], why: "cevap anahtarı", stmt: "Cevap anahtarındaki yanıt hatalıdır; düzeltilmelidir." },
    { sub: "1.7.1", kw: ["yönerge", "anlaşılmıyor", "ne yapılacağı"], why: "yönerge açıklığı", stmt: "Etkinlik yönergesi açık değildir; öğrencinin ne yapacağı net biçimde ifade edilmelidir." },
    { sub: "1.7.2", kw: ["uygulanamaz", "uygulanabilir değil", "sınıfta yapılamaz"], why: "uygulanabilirlik", stmt: "Etkinlik sınıf ortamında uygulanabilir değildir." },
    { sub: "1.7.3", kw: ["materyal", "süre", "malzeme", "verilmemiş"], why: "materyal / süre", stmt: "Etkinlik için gerekli materyal/süre belirtilmemiştir." },
  ];
  function suggestCriteria(text) {
    const t = String(text || "").toLocaleLowerCase("tr-TR");
    const scored = SUGGEST_RULES.map((r) => {
      const hits = r.kw.filter((k) => t.includes(k));
      return { r, hits, score: hits.length + (hits.some((h) => h.length > 7) ? 0.5 : 0) };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    if (!scored.length) return null;
    const best = scored[0];
    const s = SUBS.find((x) => x.code === best.r.sub);
    const second = scored[1] ? scored[1].score : 0;
    const confidence = Math.min(0.95, 0.58 + best.hits.length * 0.12 + (best.score - second) * 0.06);
    return {
      main: s.main, sub: s.label, code: s.code, confidence: +confidence.toFixed(2),
      reason: `Metindeki “${best.hits.slice(0, 3).join("”, “")}” ifadeleri ${best.r.why} ile ilişkilendirildi.`,
      statement: best.r.stmt,
      alts: scored.slice(1, 3).map((x) => { const a = SUBS.find((y) => y.code === x.r.sub); return { main: a.main, sub: a.label, code: a.code }; }),
    };
  }

  const REJECT_REASONS = ["Hata değil", "Yanlış kriter", "Bağlam yanlış yorumlanmış", "Tekrarlı tespit", "Diğer"];

  /* ------------------------------------------------------------------ Üniteler */
  const UNITS = [
    { id: "on", no: 0, title: "Ön Sayfalar", start: 1, end: 9, color: "#334155", matter: true,
      sections: [["Kapak", 1], ["İstiklal Marşı", 2], ["Gençliğe Hitabe", 3], ["İçindekiler", 4], ["Kitabın Tanıtımı", 7]] },
    { id: "u1", no: 1, title: "Birey ve Toplum", start: 10, end: 41, color: "#1f6fb2",
      sections: [["Ben ve Gruplarım", 10], ["Bilgiye Ulaşma ve Medya", 18], ["İletişim ve İlişkiler", 26], ["Farklılıklarla Birlikte Yaşam", 34]],
      subheads: ["Gruplar ve Roller", "Etkili İletişim", "Medyayı Tanıyalım", "Birlikte Yaşamak"],
      paras: [
        "İnsan, doğduğu andan itibaren bir topluluğun içinde yaşar. Aile, okul ve arkadaş grupları bireyin kişiliğinin şekillenmesinde önemli rol oynar. Bu gruplar içinde edindiğimiz roller zamanla değişebilir.",
        "Toplumsal roller, bireyin içinde bulunduğu gruplarda üstlendiği görev ve sorumluluklardır. Bir öğrenci okulda sınıf başkanı, evde abla ya da ağabey, spor kulübünde takım kaptanı olabilir.",
        "İletişim, bireyler arasındaki ilişkilerin temelini oluşturur. Etkili iletişim kurabilen kişiler duygu ve düşüncelerini açıkça ifade eder, karşısındakini dikkatle dinler.",
        "Medya, günümüzde bilgiye ulaşmanın en hızlı yollarından biridir. Ancak her bilginin doğru olmadığı unutulmamalıdır. Haber kaynaklarını karşılaştırmak, bilinçli bir medya kullanıcısı olmanın ilk adımıdır.",
        "Toplumu oluşturan bireylerin farklı ilgi, yetenek ve düşüncelere sahip olması bir zenginlik olarak görülmelidir. Ortak kurallar, bu farklılıkların bir arada uyum içinde yaşamasını kolaylaştırır.",
      ],
      figs: [["people", "Aile üyeleriyle birlikte vakit geçiren bir öğrenci"], ["people", "Okul kulübü toplantısında görüşlerini paylaşan öğrenciler"], ["chart", "Gençlerin en çok kullandığı haber kaynakları"]],
      acts: [["Rollerim", "Aile, okul ve arkadaş grubunuzda üstlendiğiniz rolleri bir tabloda gösteriniz."], ["Dinliyorum", "Bir arkadaşınızla eşleşerek sırayla birbirinizi iki dakika boyunca sözünü kesmeden dinleyiniz."]],
      questions: [["Aşağıdakilerden hangisi bir toplumsal roldür?", ["Boy uzunluğu", "Sınıf başkanlığı", "Göz rengi", "Doğum yeri"]], ["Etkili iletişimin temel unsuru aşağıdakilerden hangisidir?", ["Sözü kesmek", "Yalnızca konuşmak", "Dikkatle dinlemek", "Konuyu değiştirmek"]]] },
    { id: "u2", no: 2, title: "Kültür ve Miras", start: 42, end: 75, color: "#b45309",
      sections: [["Türklerde Devlet Anlayışı", 42], ["Dede Korkut ve Sözlü Kültür", 50], ["Selçuklu ve Osmanlı'da Kültürel Miras", 58], ["Kültürel Mirası Korumak", 66], ["Ünite Değerlendirme", 72]],
      subheads: ["İlk Türk Devletleri", "Sözlü Kültür Ürünleri", "Kervansaraylar ve Ticaret", "Somut Olmayan Kültürel Miras"],
      paras: [
        "Orta Asya'da kurulan Türk devletlerinde hükümdarlık yetkisinin Gök Tanrı tarafından verildiğine inanılırdı. Hükümdar, ülkeyi töreye uygun biçimde yönetmekle yükümlüydü.",
        "Dede Korkut Hikâyeleri, Oğuz Türklerinin yaşayışını, inançlarını ve değerlerini yansıtan önemli bir sözlü kültür ürünüdür. Hikâyelerde misafirperverlik, cesaret ve adalet gibi değerler öne çıkar.",
        "Kervansaraylar, ticaret yolları üzerinde yolcuların ve tüccarların güvenle konaklayabilmesi için yapılmış yapılardır. Selçuklu döneminde Anadolu'da çok sayıda kervansaray inşa edilmiştir.",
        "Somut olmayan kültürel miras; gelenekler, sözlü anlatımlar, el sanatları ve festivaller gibi kuşaktan kuşağa aktarılan kültürel unsurları kapsar. Ebru sanatı bu mirasın örnekleri arasındadır.",
        "Ahilik teşkilatı, Anadolu'da esnaf ve zanaatkârları bir araya getiren bir dayanışma kurumudur. Ahilikte mesleki bilgi, ahlaki değerlerle birlikte usta-çırak ilişkisi içinde aktarılırdı.",
      ],
      figs: [["landscape", "Orta Asya bozkırlarında konar-göçer yaşam"], ["building", "Selçuklu dönemine ait bir medrese kapısı"], ["people", "Ebru sanatı uygulaması"]],
      acts: [["Mirasımızı Tanıyalım", "Yaşadığınız ilde bulunan tarihî bir yapıyı araştırarak tanıtım kartı hazırlayınız."], ["Hikâye Dairesi", "Dede Korkut hikâyelerinden birini arkadaşlarınıza kendi cümlelerinizle anlatınız."]],
      questions: [["Kervansarayların yapılış amacı aşağıdakilerden hangisidir?", ["Askerî eğitim vermek", "Ticareti güvenli hâle getirmek", "Vergi toplamak", "Hastaları tedavi etmek"]], ["Aşağıdakilerden hangisi somut olmayan kültürel mirasa örnektir?", ["Kervansaray", "Ebru sanatı", "Orhun Yazıtları", "Köprü"]]] },
    { id: "u3", no: 3, title: "İnsanlar, Yerler ve Çevreler", start: 76, end: 113, color: "#047857",
      sections: [["Nüfus ve Yerleşme", 76], ["Türkiye'de Nüfusun Dağılışı", 84], ["Haritalarla Çalışma", 94], ["Göç ve Etkileri", 102], ["Ünite Değerlendirme", 110]],
      subheads: ["Nüfusu Etkileyen Faktörler", "Yerleşmelerin Kuruluşu", "Harita Unsurları", "Göçün Nedenleri"],
      paras: [
        "Nüfusun dağılışını etkileyen faktörler doğal ve beşerî faktörler olarak iki grupta incelenir. İklim, yer şekilleri ve su kaynakları doğal faktörler arasında yer alır.",
        "Türkiye'de nüfus, kıyı bölgelerinde ve sanayinin geliştiği şehirlerde yoğunlaşmaktadır. İç kesimlerde ise engebeli arazi ve sert iklim koşulları nüfusun seyrek olmasına yol açar.",
        "Göç, insanların ekonomik, sosyal veya siyasi nedenlerle yaşadıkları yeri değiştirmesidir. Göçler hem göç veren hem de göç alan yerlerde önemli değişikliklere neden olur.",
        "Harita okurken lejant, ölçek ve yön oku gibi harita unsurlarına dikkat edilmelidir. Bu unsurlar haritadaki bilgilerin doğru yorumlanmasını sağlar.",
        "Yerleşmelerin kuruluşunda su kaynaklarına yakınlık, verimli topraklar ve güvenlik gibi etkenler belirleyici olmuştur.",
      ],
      figs: [["map", "Türkiye fiziki haritası"], ["landscape", "Akarsu kenarında kurulmuş bir yerleşme"], ["chart", "Türkiye'de şehir ve köy nüfusunun yıllara göre değişimi"]],
      acts: [["Haritada Bulalım", "Atlasınızdaki Türkiye fiziki haritasında en yüksek ve en alçak yerleri işaretleyiniz."], ["Nüfus Grafiği", "Yaşadığınız ilin son on yıllık nüfus verilerini çizgi grafiğe dönüştürünüz."]],
      questions: [["Aşağıdakilerden hangisi nüfusun dağılışını etkileyen doğal faktörlerdendir?", ["Sanayi", "Ulaşım", "İklim", "Turizm"]], ["Haritadaki bilgilerin anlamını açıklayan unsur hangisidir?", ["Lejant", "Başlık", "Kenar çizgisi", "Ölçek"]]] },
    { id: "u4", no: 4, title: "Bilim, Teknoloji ve Toplum", start: 114, end: 149, color: "#be185d",
      sections: [["İslam Medeniyetinde Bilim", 114], ["Bilim Merkezleri ve Bilginler", 122], ["Matbaa ve Bilginin Yayılması", 132], ["Teknoloji ve Gündelik Hayat", 140], ["Ünite Değerlendirme", 146]],
      subheads: ["Tercüme Faaliyetleri", "Gözlemevleri", "Bilginin Yayılması", "Teknolojinin Etkileri"],
      paras: [
        "İslam medeniyetinde Beytülhikme gibi kurumlar, farklı dillerdeki bilimsel eserlerin tercüme edilmesini sağlamıştır. Bu çalışmalar bilimin gelişmesine büyük katkı sunmuştur.",
        "Uluğ Bey'in kurduğu gözlemevinde yapılan çalışmalar, yıldızların konumlarını büyük bir doğrulukla belirlemiştir. Hazırlanan yıldız katalogları yüzyıllar boyunca kullanılmıştır.",
        "Matbaanın yaygınlaşması, bilginin çok daha hızlı ve geniş kitlelere yayılmasını sağlamıştır. Kitapların çoğaltılması okuryazarlığın artmasına katkıda bulunmuştur.",
        "Bilimsel bilgi; gözlem, deney ve sorgulama yoluyla elde edilir. Bilim insanları ulaştıkları sonuçları başka araştırmacıların denetimine açar.",
        "Teknolojik gelişmeler günlük yaşamı kolaylaştırırken bazı sorunları da beraberinde getirebilir. Teknolojiyi bilinçli ve sorumlu kullanmak her bireyin görevidir.",
      ],
      figs: [["building", "Semerkant'taki gözlemevinin kalıntıları"], ["doc", "El yazması bir astronomi eserinden sayfa"], ["chart", "Türkiye'de internet kullanım oranları"]],
      acts: [["Bilginler Zaman Çizelgesi", "Ünitede adı geçen bilginleri yaşadıkları yüzyıla göre bir zaman çizelgesinde gösteriniz."], ["Teknoloji Günlüğü", "Bir gün boyunca kullandığınız teknolojik araçları ve kullanım sürelerini not ediniz."]],
      questions: [["Matbaanın yaygınlaşmasının sonuçlarından biri aşağıdakilerden hangisidir?", ["Okuryazarlığın azalması", "Kitapların pahalanması", "Bilginin hızla yayılması", "El yazmalarının artması"]], ["Bilimsel bilgiye ulaşma yollarından biri değildir?", ["Gözlem", "Deney", "Sorgulama", "Söylenti"]]] },
    { id: "u5", no: 5, title: "Üretim, Dağıtım ve Tüketim", start: 150, end: 189, color: "#0e7490",
      sections: [["Tarihî Ticaret Yolları", 150], ["Lonca ve Ahilik", 160], ["Ekonomik Faaliyetler", 168], ["Bilinçli Tüketici", 176], ["Ünite Değerlendirme", 186]],
      subheads: ["İpek Yolu", "Esnaf Teşkilatları", "Sektörler", "Tüketici Hakları"],
      paras: [
        "Tarihî İpek Yolu, Çin'den başlayarak Anadolu üzerinden Avrupa'ya uzanan önemli bir ticaret yoludur. Bu yol yalnızca malların değil, fikirlerin ve kültürlerin de taşınmasını sağlamıştır.",
        "Osmanlı Devleti'nde lonca teşkilatı, üretimin kalitesini ve fiyatların dengesini korumaya çalışmıştır.",
        "Bilinçli tüketici, ihtiyaçlarını önceliklendirir ve satın aldığı ürünün etiket bilgilerini dikkatle okur.",
        "Ekonomik faaliyetler tarım, sanayi, ticaret ve hizmet sektörleri olarak sınıflandırılır. Bir ülkenin gelişmişlik düzeyi bu sektörlerin payına göre değerlendirilebilir.",
        "Kaynakları verimli kullanmak, gelecek kuşakların da bu kaynaklardan yararlanabilmesi için gereklidir.",
      ],
      figs: [["map", "Tarihî İpek Yolu güzergâhı"], ["people", "Pazar yerinde alışveriş yapan bir aile"], ["chart", "Türkiye'de sektörlere göre çalışan nüfus"]],
      acts: [["Etiket Okuyorum", "Evinizdeki üç ürünün etiketini inceleyerek üretim ve son kullanma tarihlerini karşılaştırınız."], ["Bütçe Planı", "Bir aylık harçlığınız için ihtiyaç ve isteklerinizi ayıran bir bütçe planı hazırlayınız."]],
      questions: [["İpek Yolu'nun önemini açıklayan ifade hangisidir?", ["Yalnızca askerî amaçla kullanılmıştır", "Kültürlerin etkileşimini sağlamıştır", "Sadece Avrupa'da kullanılmıştır", "Deniz yoludur"]], ["Bilinçli tüketici davranışı hangisidir?", ["Etiket okumamak", "İhtiyaç dışı alışveriş", "Fiş almak", "Reklama güvenmek"]]] },
    { id: "u6", no: 6, title: "Etkin Vatandaşlık", start: 190, end: 229, color: "#b91c1c",
      sections: [["Demokrasi ve Katılım", 190], ["Anayasa ve Temel Haklar", 196], ["Sivil Toplum", 206], ["Hak ve Sorumluluklar", 214], ["Ünite Değerlendirme", 226]],
      subheads: ["Seçimler", "Temel Hak ve Özgürlükler", "Gönüllü Kuruluşlar", "Okul Meclisi"],
      paras: [
        "Demokrasi, halkın yönetime katıldığı ve egemenliğin millete ait olduğu bir yönetim biçimidir. Seçimler, vatandaşların yönetime katılmasının en temel yoludur.",
        "Anayasa, devletin temel yapısını, yasama, yürütme ve yargı organlarının görevlerini ve vatandaşların temel hak ve özgürlüklerini düzenler.",
        "Sivil toplum kuruluşları, toplumsal sorunlara çözüm üretmek amacıyla gönüllülük esasına göre çalışan kuruluşlardır.",
        "Her hak beraberinde bir sorumluluk getirir. Hak ve sorumluluklar arasındaki denge, toplumsal düzenin korunmasını sağlar.",
        "Okul meclisleri, öğrencilerin karar alma süreçlerine katılmasını ve demokratik kültürü deneyimlemesini sağlar.",
      ],
      figs: [["building", "Türkiye Büyük Millet Meclisi binası"], ["people", "Okul meclisi toplantısı"], ["chart", "Seçimlere katılım oranları"]],
      acts: [["Sınıf Anayasası", "Sınıfınız için beş maddelik bir sınıf anayasası hazırlayınız."], ["STK Haritası", "Yaşadığınız yerdeki sivil toplum kuruluşlarını ve çalışma alanlarını listeleyiniz."]],
      questions: [["Aşağıdakilerden hangisi yargı organıdır?", ["TBMM", "Cumhurbaşkanlığı", "Anayasa Mahkemesi", "Bakanlıklar"]], ["Demokrasinin temel ilkelerinden biri hangisidir?", ["Tek kişinin yönetimi", "Millî egemenlik", "Seçimsiz yönetim", "Basın sansürü"]]] },
    { id: "u7", no: 7, title: "Küresel Bağlantılar", start: 230, end: 263, color: "#4d7c0f",
      sections: [["Türkiye'nin Konumu", 230], ["Uluslararası Kuruluşlar", 236], ["Küresel Sorunlar", 244], ["Kültürel Etkileşim ve Yardımlaşma", 252], ["Ünite Değerlendirme", 260]],
      subheads: ["Jeopolitik Konum", "İş Birliği", "İklim ve Çevre", "Kültürlerarası İletişim"],
      paras: [
        "Uluslararası kuruluşlar, ülkeler arasındaki iş birliğini güçlendirmek ve ortak sorunlara çözüm bulmak amacıyla kurulur.",
        "Küresel iklim değişikliği, tüm insanlığı ilgilendiren ortak bir sorundur. Bu soruna çözüm bulmak için ülkelerin birlikte hareket etmesi gerekir.",
        "Kültürel etkileşim; ticaret, turizm, göç ve iletişim araçları yoluyla gerçekleşir.",
        "Türkiye, sahip olduğu konum nedeniyle enerji ve ulaşım hatlarının kesiştiği önemli bir bölgede yer alır.",
        "Ortak sorunların çözümünde ülkelerin bilgi ve deneyimlerini paylaşması büyük önem taşır.",
      ],
      figs: [["map", "Türkiye ve çevresindeki ülkeler"], ["landscape", "Kuraklıktan etkilenen bir göl yatağı"], ["chart", "Küresel sıcaklık değişimi"]],
      acts: [["Ortak Çözüm", "Küresel bir sorunu seçerek ülkelerin birlikte uygulayabileceği üç çözüm önerisi geliştiriniz."], ["Kültür Elçisi", "Başka bir ülkeden yaşıtınıza Türkiye'yi tanıtan kısa bir mektup yazınız."]],
      questions: [["Aşağıdakilerden hangisi küresel bir sorundur?", ["Mahalle parkının bakımı", "İklim değişikliği", "Okul servis saati", "Sınıf düzeni"]], ["Uluslararası kuruluşların kuruluş amacı hangisidir?", ["Rekabeti artırmak", "İş birliğini güçlendirmek", "Ticareti durdurmak", "Sınırları kapatmak"]]] },
    { id: "son", no: 0, title: "Son Sayfalar", start: 264, end: 276, color: "#334155", matter: true,
      sections: [["Sözlük", 264], ["Kaynakça", 270], ["Görsel Kaynakça", 273], ["Cevap Anahtarı", 275]] },
  ];
  UNITS.forEach((u) => {
    u.label = u.no ? `${u.no}. Ünite: ${u.title}` : u.title;
    u.short = u.no ? `Ü${u.no}` : u.title;
    u.sections = u.sections.map(([title, start], i, arr) => ({ title, start, end: i < arr.length - 1 ? arr[i + 1][1] - 1 : u.end }));
  });
  const CONTENT_UNITS = UNITS.filter((u) => u.no > 0);
  function unitOf(n) { return UNITS.find((u) => n >= u.start && n <= u.end) || null; }
  function sectionOf(n) { const u = unitOf(n); if (!u) return null; let s = u.sections[0]; for (const sec of u.sections) if (n >= sec.start) s = sec; return s; }

  /* ------------------------------------------------------------------ Medya ve ekler */
  const MEDIA = [
    { id: "m6", type: "audio", title: "İstiklal Marşı (okunuş)", duration: "1:50", page: 2, reviewed: true },
    { id: "m1", type: "video", title: "Orhun Yazıtlarının Hikâyesi", duration: "3:24", page: 43, reviewed: true },
    { id: "m2", type: "audio", title: "Dede Korkut · Boğaç Han Hikâyesi", duration: "6:10", page: 51, reviewed: false },
    { id: "m3", type: "video", title: "Kervansaraylar: Yolların Hanları", duration: "4:05", page: 60, reviewed: false },
    { id: "m4", type: "interactive", title: "Nüfus Piramidi Uygulaması", duration: "Etkileşimli", page: 84, reviewed: false },
    { id: "m5", type: "video", title: "Uluğ Bey ve Semerkant Gözlemevi", duration: "2:48", page: 127, reviewed: false },
    { id: "m7", type: "video", title: "TBMM'nin Açılışı", duration: "5:12", page: 194, reviewed: false },
  ];
  const ATTACHMENTS = [
    { id: "a2", title: "Cevap Anahtarı", meta: "PDF · 12 sayfa · 0,8 MB" },
    { id: "a3", title: "TTKB İnceleme Ölçütleri 2026", meta: "PDF · 22 sayfa" },
    { id: "a4", title: "Yayınevi Taahhütnamesi", meta: "PDF · 2 sayfa" },
    { id: "a5", title: "Görsel Telif Belgeleri", meta: "ZIP · 46 dosya" },
  ];
  const NOTIFICATIONS = [
    { id: "n1", text: "Bağımsız inceleme süresinin bitmesine 6 gün kaldı (13 Ekim 2026).", time: "Bugün 09.00", unread: true },
    { id: "n2", text: "YAZDİS analizi tamamlandı: 20 tespit önerisi, 15 TYMM adayı.", time: "3 Eki 2026", unread: true },
    { id: "n3", text: "Panel toplantısı 21 Ekim 2026, 10.00'da çevrim içi yapılacaktır.", time: "1 Eki 2026", unread: false },
  ];

  /* ------------------------------------------------------------------ TYMM */
  const TYMM_COMPONENTS = [
    { code: "D1", name: "Doğruluk", type: "deger", desc: "Bilgiyi, sözü ve davranışı gerçeğe uygun kılma; yanlışı fark edip düzeltme.", required: ["u1", "u2", "u3", "u4", "u5", "u6"] },
    { code: "D2", name: "Adalet", type: "deger", desc: "Hak ve sorumlulukların gözetilmesi, eşit ve hakkaniyetli davranma.", required: ["u2", "u5", "u6"] },
    { code: "D3", name: "Sorumluluk", type: "deger", desc: "Üstlenilen görevleri yerine getirme, kaynakları özenle kullanma.", required: ["u1", "u5", "u6", "u7"] },
    { code: "D4", name: "Saygı", type: "deger", desc: "Farklılıkları, kültürel mirası ve başkalarının haklarını gözetme.", required: ["u1", "u2", "u7"] },
    { code: "D5", name: "Vatanseverlik", type: "deger", desc: "Vatanına, milletine ve ortak değerlere bağlılık; mirası koruma.", required: ["u2", "u6"] },
    { code: "D6", name: "Yardımseverlik", type: "deger", desc: "Başkalarının ihtiyaçlarına duyarlı olma ve dayanışma.", required: ["u2", "u6", "u7"] },
    { code: "E1", name: "Merak", type: "egilim", desc: "Yeni bilgi ve deneyimlere ilgi duyma, soru sorma isteği.", required: ["u1", "u2", "u3", "u4", "u5", "u7"] },
    { code: "E2", name: "Sorgulama", type: "egilim", desc: "Bilgi ve iddiaları gerekçe ve kanıt arayarak değerlendirme.", required: ["u1", "u3", "u4"] },
    { code: "E3", name: "Empati", type: "egilim", desc: "Başkalarının duygu ve düşüncelerini anlamaya çalışma.", required: ["u1", "u6"] },
    { code: "E4", name: "Özgüven", type: "egilim", desc: "Kendini ifade etme ve yeteneklerine güvenme.", required: ["u1", "u6"] },
  ];

  /* ------------------------------------------------------------------ Elle yazılmış sayfalar */
  const CUSTOM = {
    18: () => [
      { t: "h2", text: "Bilgiye Ulaşma ve Medya" },
      { t: "p", text: "Bilgiye ulaşmak hiç bu kadar kolay olmamıştı. Bir arama motoruna yazdığımız birkaç kelimeyle binlerce sonuca ulaşabiliyoruz. Ancak ulaştığımız her bilgi doğru ve güvenilir olmayabilir." },
      { t: "fig", kind: "people", caption: "Görsel 1.4 Haber kaynaklarını karşılaştıran öğrenciler", h: 210 },
      { t: "box", variant: "activity", label: "Etkinlik 1.2", title: "Haberi Doğrula", text: "Aşağıdaki haber başlığını inceleyiniz: “Şehrimizdeki tüm parklar gelecek ay kapatılacak!” Haberin doğruluğunu en az iki farklı güvenilir kaynaktan kontrol ediniz. Ulaştığınız sonucu ve kullandığınız kaynakları defterinize yazınız." },
      { t: "p", text: "Güvenilir bir haber kaynağı; haberin kaynağını, tarihini ve yazarını açıkça belirtir. Aynı haberi farklı kaynaklarda karşılaştırmak, yanlış bilginin yayılmasını önler." },
    ],
    27: () => [
      { t: "h3", text: "Etkili İletişim" },
      { t: "p", text: "İletişimde dürüstlük, karşılıklı güvenin temelidir. Hatalarımızı kabul etmek ilişkilerimizi zayıflatmaz, aksine güçlendirir." },
      { t: "box", variant: "reading", label: "Okuma Metni", title: "Mektuptaki Yanlışlık", text: "Elif, köydeki okula kitap bağışı için bir mektup yazmıştı. Mektubu postaya verdikten sonra kütüphanenin açılış tarihini yanlış yazdığını fark etti. Kimsenin bu hatayı fark etmeyeceğini düşünse de içi rahat etmedi. Hemen öğretmenini arayarak hatasını anlattı ve doğru tarihi içeren yeni bir mektup gönderdi. Öğretmeni, Elif'in bu davranışının bağıştan bile değerli olduğunu söyledi." },
      { t: "box", variant: "think", label: "Düşünelim", title: "Siz Olsaydınız", text: "Elif'in yerinde olsaydınız ne yapardınız? Düşüncelerinizi gerekçeleriyle açıklayınız." },
      { t: "p", text: "İletişim, bireyler arasındaki ilişkilerin temelini oluşturur. Etkili iletişim kurabilen kişiler duygu ve düşüncelerini açıkça ifade eder, karşısındakini dikkatle dinler." },
    ],
    42: () => [
      { t: "unitband", text: "2. ÜNİTE · KÜLTÜR VE MİRAS" },
      { t: "h2", text: "Türklerde Devlet Anlayışı" },
      { t: "p", text: "Orta Asya'da kurulan ilk Türk devletlerinde hükümdarın yönetme yetkisini Gök Tanrı'dan aldığına inanılırdı. Bu yetkiye kut adı verilirdi. Kut'un kan yoluyla babadan oğula geçtiğine inanılması, hükümdar ailesinin tüm erkek üyelerinin tahtta hak sahibi olduğu düşüncesini doğurmuştur. Bu durum zaman zaman taht kavgalarına neden olmuştur." },
      { t: "p", text: "Tüm göçebe topluluklar, yaz aylarında yaylalara, kış aylarında ise kışlaklara göç ederdi. Hayvancılığa dayalı bu yaşam biçimi, Türklerin atçılıkta ve demircilikte ustalaşmasını sağlamıştır." },
      { t: "fig", kind: "stele", caption: "Görsel 2.1 Orhun Yazıtları (Bilge Kağan Yazıtı), Moğolistan, 732", h: 200 },
      { t: "p", text: "Göktürkler, Orhun Yazıtları'nı kendi alfabeleriyle yazmışlardır ve bu yazıtlar Türk tarihinin ilk yazılı belgeleri kabul edilir." },
      { t: "box", variant: "activity", label: "Etkinlik 2.1", title: "Bilgiyi Değerlendirelim", text: "Orhun Yazıtları hakkında farklı kaynaklardan bilgi toplayınız. Elde ettiğiniz bilgilerin doğruluğunu farklı kaynaklardan kontrol ediniz. Ulaştığınız bilgileri sınıfta arkadaşlarınızla paylaşınız." },
    ],
    43: () => [
      { t: "h3", text: "Kurultay ve Töre" },
      { t: "p", text: "Türk devletlerinde ki yönetim anlayışında kurultay önemli bir yer tutardı. Kurultayda savaş, barış ve devlet işleri görüşülür; alınan kararlar hükümdar tarafından uygulanırdı." },
      { t: "p", text: "Töre, Türk toplumunda yazılı olmayan hukuk kurallarının bütünüdür. Töre; adalet, eşitlik ve iyilik gibi ilkelere dayanır. Hükümdar da töreye uymak zorundaydı." },
      { t: "box", variant: "info", label: "Bilgi Kutusu", title: "Kurultaya Kimler Katılırdı?", text: "Kurultaya hükümdar, hatun, boy beyleri ve devletin ileri gelenleri katılırdı. Hatunun kurultaya katılması, kadının toplumdaki saygın yerini gösterir." },
      { t: "fig", kind: "landscape", caption: "Görsel 2.2 Kurultay toplantısını canlandıran bir çizim", h: 190 },
    ],
    45: () => [
      { t: "h3", text: "Asya Hun Devleti" },
      { t: "p", text: "Asya Hun Devleti'nin kurucusu Mete Han'dır. Mete Han, orduyu onlu sisteme göre düzenleyerek güçlü bir askerî yapı oluşturmuştur. Bu sistem daha sonra kurulan pek çok Türk devleti tarafından da kullanılmıştır." },
      { t: "p", text: "Hunlar, Çin ile yaptıkları mücadeleler sonucunda İpek Yolu'nun önemli bir bölümünü denetim altına almıştır. Çinliler, Hun akınlarından korunmak amacıyla Çin Seddi'ni yapmışlardır." },
      { t: "q", no: 1, text: "Aşağıdakilerden hangisi kurultayın görevlerinden biri değildir?", options: ["Savaş ve barış kararı almak", "Devlet işlerini görüşmek", "Hükümdarın yerine ülkeyi yönetmek", "Önemli konularda danışmak"] },
      { t: "box", variant: "think", label: "Düşünelim", title: "Onlu Sistem", text: "Onlu sistemin bir orduya hangi avantajları sağlamış olabileceğini tartışınız." },
    ],
    96: () => [
      { t: "h3", text: "Harita Unsurları" },
      { t: "p", text: "Harita okurken lejant, ölçek ve yön oku gibi harita unsurlarına dikkat edilmelidir. Bu unsurlar haritadaki bilgilerin doğru yorumlanmasını sağlar." },
      { t: "fig", kind: "map", caption: "Görsel 3.6 Farklı projeksiyonlarla çizilmiş dünya haritaları", h: 220 },
      { t: "box", variant: "discuss", label: "Tartışma Etkinliği", title: "Haritalar Yanıltır mı?", text: "Farklı projeksiyonlarla çizilmiş iki dünya haritasını karşılaştırınız. Hangi haritanın daha doğru bilgi verdiğini gerekçeleriyle tartışınız." },
      { t: "p", text: "Küre biçimindeki Dünya'nın düz bir yüzeye aktarılması sırasında alan, şekil veya uzaklıklarda bazı bozulmalar ortaya çıkar." },
    ],
  };

  /* ------------------------------------------------------------------ Sayfalara eklenen bloklar (tespit / TYMM kanıtı içeren metinler) */
  const INJECT = {
    12: [{ t: "p", text: "Toplumsal roller doğuştan kazanılır ve hayat boyunca değişmez. Bu nedenle her bireyin rolü, ailesindeki konumuna göre belirlenir." }],
    13: [{ t: "p", text: "Farklılıklara saygı, birlikte yaşamanın temel koşuludur. Birbirimizin düşüncelerini dinlemek ve anlamaya çalışmak, toplumsal uyumu güçlendirir." }],
    15: [{ t: "p", text: "Ailemizde, okulumuzda ve çevremizde üstlendiğimiz her rol, beraberinde yerine getirmemiz gereken sorumluluklar getirir." }],
    20: [{ t: "box", variant: "activity", label: "Etkinlik 1.3", title: "Merak Ettiklerim", text: "Medyada gördüğünüz ve merak ettiğiniz bir konuyu seçiniz. Bu konuyla ilgili aklınıza gelen üç soruyu yazarak cevaplarını araştırınız." }],
    23: [{ t: "q", no: 2, text: "Aşağıdakilerden hangisi birincil gruplara örnek değildir?", options: ["Aile", "Yakın arkadaş grubu", "Okul sınıfı", "Siyasi parti"] }],
    29: [{ t: "box", variant: "activity", label: "Etkinlik 1.5", title: "Kendimi Onun Yerine Koyuyorum", text: "Yeni bir okula başlayan bir arkadaşınızın neler hissedebileceğini düşünerek ona bir mektup yazınız." }],
    31: [{ t: "p", text: "Sosyalizasyon süreci, bireyin toplumsal normları içselleştirerek kimlik inşasını gerçekleştirdiği diyalektik bir süreçtir." }],
    33: [{ t: "box", variant: "info", label: "Medya Okuryazarlığı Köşesi", title: "Paylaşmadan Önce", text: "Bir haberi paylaşmadan önce kaynağını, tarihini ve doğruluğunu mutlaka kontrol ediniz." }],
    36: [{ t: "p", text: "Medya okur yazarlığı, medya iletilerini eleştirel bir bakışla değerlendirebilme becerisidir." }],
    37: [{ t: "box", variant: "activity", label: "Etkinlik 1.6", title: "Haberi Sorgula", text: "Bir haberin başlığı ile içeriği arasındaki farkları sorgulayınız. Başlık sizi yanıltıyor mu?" }],
    38: [{ t: "p", text: "Güncel haberleri en hızlı şekilde HaberNet uygulamasından takip edebilirsiniz." }],
    40: [{ t: "box", variant: "activity", label: "Etkinlik 1.7", title: "Kendimi İfade Ediyorum", text: "Sınıf arkadaşlarınızın önünde, ilgi duyduğunuz bir konuyu iki dakikalık bir sunumla anlatınız." }],
    44: [{ t: "p", text: "Uygurlar, yerleşik hayata geçen ilk Türk topluluğudur. Uygurlar döneminde tarım, ticaret ve mimaride önemli gelişmeler yaşanmıştır." }, { t: "box", variant: "info", label: "Bilgi Kutusu", title: "Daha Fazlası İçin", text: "Konuyla ilgili haritaları incelemek için Bilgin Kırtasiye'nin hazırladığı Altın Tarih Atlası'nı edinebilirsiniz." }],
    50: [{ t: "quote", text: "Gelimli gidimli dünya, son ucu ölümlü dünya." }],
    52: [{ t: "p", text: "Hikâyede Bayındır Han, verdiği kararlarda herkese eşit davranarak adaletin önemini gösterir." }],
    58: [{ t: "p", text: "Ahi esnafı, malının kusurunu müşteriden saklamaz, doğru ölçü ve tartıyla satış yapardı." }, { t: "fig", kind: "building", caption: "Görsel 2.6 Sultanhanı Kervansarayı taç kapısı, Aksaray", h: 210, lowres: true }],
    63: [{ t: "p", text: "Ahiler, hem mesleki bilgiyi hem de ahlaki değerleri genç kuşaklara aktarılmıştır." }],
    64: [{ t: "p", text: "Ahiler, kazançlarının bir bölümünü yoksullara ve yolda kalmışlara ayırarak toplumsal dayanışmayı güçlendirmiştir." }],
    66: [{ t: "p", text: "Tarihî eserlere zarar vermemek, geçmiş kuşakların emeğine duyduğumuz saygının bir göstergesidir." }],
    67: [{ t: "p", text: "Nevruz, her yıl 21 Mart'ta kutlanan ve yalnızca Türkiye'ye özgü bir bayramdır." }],
    70: [{ t: "box", variant: "activity", label: "Etkinlik 2.6", title: "Kültür Dedektifi", text: "Yaşadığınız yerdeki bir geleneğin nereden geldiğini araştırınız." }],
    74: [{ t: "p", text: "Kültürel mirasımızı korumak ve gelecek kuşaklara aktarmak, vatanımıza karşı en önemli görevlerimizdendir." }],
    83: [{ t: "p", text: "Türkiye'nin en kalabalık ikinci şehri Ankara'dır." }],
    88: [{ t: "fig", kind: "map", caption: "Görsel 3.3 Türkiye nüfus yoğunluğu haritası (2023)", h: 230, legend: true }],
    100: [{ t: "box", variant: "activity", label: "Etkinlik 3.2", title: "Haritada Keşif", text: "Haritada daha önce hiç duymadığınız üç yer adı seçiniz. Bu yerler hakkında merak ettiklerinizi soru hâline getirerek araştırınız." }],
    101: [{ t: "p", text: "Ölçek büyüdükçe haritadaki ayrıntı azalır." }],
    108: [{ t: "box", variant: "activity", label: "Etkinlik 3.4", title: "Göç Haritası", text: "Ailenizin veya tanıdıklarınızın yaşadığı göç hikâyelerinden birini dinleyiniz. Dinlediğiniz hikâyeyi bir paragrafla özetleyiniz." }],
    121: [{ t: "p", text: "Günümüzde dünya nüfusunun yaklaşık yarısı internet kullanmaktadır." }],
    125: [{ t: "p", text: "Bilim insanları, ulaştıkları sonuçları sorgulayarak ve yeniden deneyerek bilgiyi geliştirir." }],
    127: [{ t: "p", text: "Uluğ Bey Gözlemevi 15. yüzyılda İstanbul'da kurulmuştur." }],
    131: [{ t: "box", variant: "activity", label: "Etkinlik 4.3", title: "Bilim İnsanı Gibi Düşünelim", text: "Bir iddiayı kabul etmeden önce kanıtlarını araştırınız ve elde ettiğiniz bilgilerin doğruluğunu sınayınız." }],
    133: [{ t: "p", text: "Matbaa, 1450'li yıllarda Johannes Gutenberg tarafından icat edilmiştir." }],
    142: [{ t: "p", text: "Yapay zeka uygulamaları günlük hayatımızın birçok alanında kullanılmaktadır." }],
    158: [{ t: "p", text: "İpek Yolu'nun adı, bu yol üzerinden yalnızca ipek taşınmasından gelir." }],
    163: [{ t: "box", variant: "activity", label: "Etkinlik 5.2", title: "Bir Ürünün Yolculuğu", text: "Sofranızdaki bir ürünün tarladan sofraya nasıl ulaştığını merak ediyor musunuz? Ürünün yolculuğunu araştırarak bir akış şeması hazırlayınız." }],
    165: [{ t: "q", no: 3, text: "2023 yılında Türkiye'de en fazla istihdam sağlayan sektör aşağıdakilerden hangisidir?", options: ["Tarım", "Sanayi", "Hizmet", "İnşaat"] }],
    168: [{ t: "p", text: "Loncalar, ürünlerin fiyatını belirleyerek hem üreticiyi hem de tüketiciyi korumaya çalışırdı." }],
    184: [{ t: "box", variant: "activity", label: "Etkinlik 5.5", title: "Tasarruf Yapıyorum", text: "Evinizde bir hafta boyunca su ve elektrik tüketimini azaltmak için uygulayabileceğiniz üç öneri belirleyiniz." }],
    193: [{ t: "p", text: "Millî egemenlik, Türk milletinin bağımsızlık mücadelesinin en değerli kazanımlarından biridir." }],
    194: [{ t: "p", text: "Türkiye Büyük Millet Meclisi 23 Nisan 1921'de açılmıştır." }],
    196: [{ t: "p", text: "Anayasamıza göre herkes, dil, ırk, renk, cinsiyet, din ve mezhep ayrımı gözetilmeksizin kanun önünde eşittir." }],
    199: [{ t: "p", text: "Anayasa Mahkemesi, yasama organının bir parçasıdır." }],
    201: [{ t: "p", text: "Bilgi edinme hakkı, vatandaşların kamu kurumlarından doğru ve eksiksiz bilgi talep edebilmesini sağlar." }],
    205: [{ t: "box", variant: "activity", label: "Etkinlik 6.3", title: "Sivil Toplumda Ben", text: "Bir sivil toplum kuruluşunda görev alsaydınız hangi sorumluluğu üstlenmek isterdiniz?" }],
    210: [{ t: "box", variant: "discuss", label: "Örnek Olay", title: "Sınıf Kuralları", text: "Sınıf kurallarını belirlerken her öğrencinin görüşünü almak neden önemlidir? Tartışınız." }],
    214: [{ t: "fig", kind: "people", caption: "Görsel 6.5 Okul meclisi seçiminde oy kullanan öğrenciler", h: 210 }],
    215: [{ t: "box", variant: "discuss", label: "Örnek Olay", title: "Engelsiz Okul", text: "Okulunuzda tekerlekli sandalye kullanan bir öğrencinin karşılaşabileceği zorlukları düşününüz." }],
    219: [{ t: "p", text: "Haklarını bilen ve sorumluluklarını yerine getiren vatandaşlar, demokrasinin güçlenmesine katkı sağlar." }],
    222: [{ t: "p", text: "Gönüllü çalışmalar, toplumsal sorunların çözümünde bireylerin katkısını artırır." }],
    231: [{ t: "p", text: "Türkiye, Asya ile Avrupa arasında köprü konumunda bulunması nedeniyle tarih boyunca önemli bir kavşak noktası olmuştur." }],
    233: [{ t: "box", variant: "activity", label: "Etkinlik 7.1", title: "Dünyayı Tanıyalım", text: "Görmek istediğiniz bir ülkeyi seçiniz ve o ülkenin kültürü hakkında merak ettiğiniz soruları listeleyiniz." }],
    236: [{ t: "p", text: "Birleşmiş Milletlerin merkezi Cenevre'dedir." }],
    240: [{ t: "p", text: "Farklı kültürlerden insanların gelenek ve inançlarına anlayışla yaklaşmak, barış içinde bir dünyanın temelidir." }],
    247: [{ t: "p", text: "Küresel ısınma ve iklim değişikliği aynı anlama gelir." }],
    248: [{ t: "box", variant: "activity", label: "Etkinlik 7.4", title: "İklim İçin Harekete Geç", text: "Okulunuzda iklim değişikliğiyle mücadele için yapılabilecek bir proje tasarlayınız ve görev dağılımı yapınız." }],
    258: [{ t: "p", text: "Türkiye'nin insani yardım faaliyetleri, dünyanın farklı bölgelerindeki ihtiyaç sahiplerine ulaşmaktadır." }],
  };

  /* ------------------------------------------------------------------ Sayfa modeli üretimi */
  function est(b) {
    const lines = (s, cpl) => Math.ceil(String(s || "").length / cpl);
    switch (b.t) {
      case "h2": return 62;
      case "h3": return 44;
      case "unitband": return 46;
      case "p": return lines(b.text, 70) * 27 + 16;
      case "quote": return lines(b.text, 62) * 27 + 54;
      case "fig": return (b.h || 220) + 52;
      case "box": return 70 + lines(b.text, 64) * 25;
      case "q": return 52 + lines(b.text, 66) * 26 + b.options.length * 28;
      case "media": return 92;
      default: return 40;
    }
  }

  const SPECIAL = {
    1: () => ({ kind: "cover", blocks: [] }),
    2: () => ({ kind: "matter", blocks: [
      { t: "h2", text: "İSTİKLAL MARŞI" },
      { t: "verse", lines: ["Korkma, sönmez bu şafaklarda yüzen al sancak;", "Sönmeden yurdumun üstünde tüten en son ocak.", "O benim milletimin yıldızıdır, parlayacak;", "O benimdir, o benim milletimindir ancak."] },
      { t: "verse", lines: ["Çatma, kurban olayım, çehreni ey nazlı hilâl!", "Kahraman ırkıma bir gül! Ne bu şiddet, bu celâl?", "Sana olmaz dökülen kanlarımız sonra helâl.", "Hakkıdır Hakk'a tapan milletimin istiklâl."] },
      { t: "p", text: "Mehmet Âkif Ersoy", cls: "right" },
    ] }),
    3: () => ({ kind: "matter", blocks: [
      { t: "h2", text: "GENÇLİĞE HİTABE" },
      { t: "p", text: "Ey Türk gençliği! Birinci vazifen, Türk istiklâlini, Türk Cumhuriyetini, ilelebet muhafaza ve müdafaa etmektir." },
      { t: "p", text: "Mevcudiyetinin ve istikbalinin yegâne temeli budur. Bu temel, senin en kıymetli hazinendir." },
      { t: "p", text: "Mustafa Kemal Atatürk", cls: "right" },
    ] }),
  };

  function tocBlocks(part) {
    const units = part === 0 ? CONTENT_UNITS.slice(0, 4) : CONTENT_UNITS.slice(4);
    const blocks = part === 0 ? [{ t: "h2", text: "İÇİNDEKİLER" }] : [];
    units.forEach((u) => {
      blocks.push({ t: "tocunit", text: `${u.no}. ÜNİTE · ${u.title.toLocaleUpperCase("tr-TR")}`, page: u.start, color: u.color });
      u.sections.forEach((s) => blocks.push({ t: "tocrow", text: s.title, page: s.start }));
    });
    if (part === 1) {
      blocks.push({ t: "tocunit", text: "SON SAYFALAR", page: 264, color: "#334155" });
      UNITS[UNITS.length - 1].sections.forEach((s) => blocks.push({ t: "tocrow", text: s.title, page: s.start }));
    }
    return blocks;
  }

  function makePage(n) {
    const u = unitOf(n);
    const sec = sectionOf(n);
    const base = { n, unitId: u.id, section: sec.title, kind: "content", blocks: [] };
    if (SPECIAL[n]) return Object.assign(base, SPECIAL[n]());
    if (n === 4 || n === 5) return Object.assign(base, { kind: "matter", blocks: tocBlocks(n - 4) });
    if (u.matter) return Object.assign(base, { kind: "matter", blocks: matterBlocks(n, u, sec) });
    if (CUSTOM[n]) return Object.assign(base, { blocks: withMedia(n, CUSTOM[n]()) });
    if (n === u.start) return Object.assign(base, { kind: "opener", blocks: [] });

    const r = rng(n * 7919 + 13);
    const blocks = [];
    let budget = 845;
    const push = (b) => { blocks.push(b); budget -= est(b); };
    if (sec.start === n) push({ t: "h2", text: sec.title });
    else push({ t: "h3", text: u.subheads[n % u.subheads.length] });

    (INJECT[n] || []).forEach(push);
    MEDIA.filter((m) => m.page === n).forEach((m) => push({ t: "media", media: m.id }));

    if (sec.title === "Ünite Değerlendirme") {
      let qn = (n - sec.start) * 2 + 1;
      for (const [text, options] of u.questions.concat(u.questions)) {
        const b = { t: "q", no: qn, text, options };
        if (est(b) > budget) break;
        push(b); qn++;
      }
      return Object.assign(base, { blocks });
    }

    let pi = n % u.paras.length;
    const nextPara = () => ({ t: "p", text: u.paras[pi++ % u.paras.length] });
    const plan = ["p", r() < 0.5 ? "fig" : "p", "p", r() < 0.45 ? "box" : "p", "p", "p"];
    const used = new Set(blocks.map((b) => b.text));
    for (const step of plan) {
      let b;
      if (step === "p") { b = nextPara(); if (used.has(b.text)) b = nextPara(); }
      else if (step === "fig") { const f = u.figs[n % u.figs.length]; b = { t: "fig", kind: f[0], caption: `Görsel ${u.no}.${((n - u.start) % 11) + 2} ${f[1]}`, h: 180 + Math.round(r() * 50) }; }
      else { const a = u.acts[n % u.acts.length]; b = { t: "box", variant: "activity", label: `Etkinlik ${u.no}.${((n - u.start) % 7) + 1}`, title: a[0], text: a[1] }; }
      if (est(b) > budget) continue;
      used.add(b.text);
      push(b);
    }
    return Object.assign(base, { blocks });
  }

  function withMedia(n, blocks) {
    MEDIA.filter((m) => m.page === n).forEach((m) => blocks.push({ t: "media", media: m.id }));
    return blocks;
  }

  function matterBlocks(n, u, sec) {
    if (sec.title === "Kitabın Tanıtımı") return [
      { t: "h2", text: n === 7 ? "KİTABIMIZI TANIYALIM" : "SİMGELER" },
      { t: "box", variant: "activity", label: "Etkinlik", title: "Etkinlik kutuları", text: "Öğrendiklerinizi uygulamanız için hazırlanmış bireysel ve grup çalışmalarıdır." },
      { t: "box", variant: "info", label: "Bilgi Kutusu", title: "Ek bilgiler", text: "Konuyla ilgili ilgi çekici ek bilgiler sunar." },
      { t: "box", variant: "think", label: "Düşünelim", title: "Düşünme soruları", text: "Konu hakkında düşünmenizi ve görüş oluşturmanızı sağlayan sorulardır." },
      { t: "box", variant: "reading", label: "Okuma Metni", title: "Okuma metinleri", text: "Konuyu destekleyen hikâye, anı ve mektup gibi metinlerdir." },
    ];
    if (sec.title === "Sözlük") {
      const terms = [["ahilik", "Anadolu'da esnaf ve zanaatkârları bir araya getiren dayanışma kurumu."], ["anayasa", "Devletin temel yapısını ve vatandaşların temel haklarını düzenleyen en üst hukuk metni."], ["göç", "İnsanların yaşadıkları yeri sürekli ya da geçici olarak değiştirmesi."], ["kervansaray", "Ticaret yolları üzerinde yolcuların konakladığı yapı."], ["kurultay", "Eski Türk devletlerinde devlet işlerinin görüşüldüğü meclis."], ["kut", "Hükümdarlık yetkisinin Gök Tanrı tarafından verildiğine inanılan güç."], ["lejant", "Haritada kullanılan işaret ve renklerin açıklandığı bölüm."], ["töre", "Yazılı olmayan hukuk kuralları."]];
      const off = ((n - 264) * 3) % terms.length;
      return [{ t: "h2", text: "SÖZLÜK" }].concat(terms.slice(off).concat(terms.slice(0, off)).slice(0, 6).map(([k, v]) => ({ t: "term", term: k, text: v })));
    }
    if (sec.title === "Kaynakça" || sec.title === "Görsel Kaynakça") return [
      { t: "h2", text: sec.title.toLocaleUpperCase("tr-TR") },
      { t: "ref", text: "Ergin, M. (2019). Orhun Abideleri. İstanbul: Boğaziçi Yayınları." },
      { t: "ref", text: "Ögel, B. (2014). Türk Kültür Tarihine Giriş. Ankara: Kültür Bakanlığı Yayınları." },
      { t: "ref", text: "TÜİK (2024). Adrese Dayalı Nüfus Kayıt Sistemi Sonuçları. Ankara." },
      { t: "ref", text: "MEB (2024). Sosyal Bilgiler Dersi Öğretim Programı. Ankara: TTKB." },
      { t: "ref", text: "Kafesoğlu, İ. (2017). Türk Millî Kültürü. İstanbul: Ötüken Neşriyat." },
    ];
    if (sec.title === "Cevap Anahtarı") return [
      { t: "h2", text: "CEVAP ANAHTARI" },
      { t: "p", text: "1. Ünite: 1-B, 2-C, 3-D · 2. Ünite: 1-B, 2-B, 3-C · 3. Ünite: 1-C, 2-A · 4. Ünite: 1-C, 2-D · 5. Ünite: 1-B, 2-C, 3-A · 6. Ünite: 1-C, 2-B · 7. Ünite: 1-B, 2-B" },
    ];
    return [{ t: "h2", text: sec.title.toLocaleUpperCase("tr-TR") }, { t: "p", text: "Bu sayfa bilinçli olarak boş bırakılmıştır." }];
  }

  const PAGES = [null];
  for (let n = 1; n <= BOOK.pageCount; n++) PAGES.push(makePage(n));

  function blockText(b) {
    if (b.t === "q") return `${b.text} ${b.options.join(" ")}`;
    if (b.t === "box") return `${b.label} ${b.title} ${b.text}`;
    if (b.t === "fig") return b.caption;
    if (b.t === "verse") return b.lines.join(" ");
    if (b.t === "term") return `${b.term} ${b.text}`;
    if (b.t === "list") return b.items.join(" ");
    if (b.t === "media") { const m = MEDIA.find((x) => x.id === b.media); return m ? m.title : ""; }
    return b.text || "";
  }
  function pageText(n) {
    const p = PAGES[n];
    if (!p) return "";
    if (p.kind === "opener") { const u = unitOf(n); return `${u.no}. ÜNİTE ${u.title} ${u.sections.map((s) => s.title).join(" ")}`; }
    if (p.kind === "cover") return BOOK.title;
    return p.blocks.map(blockText).join(" ");
  }

  /* ------------------------------------------------------------------ Öğretim programı: öğrenme çıktıları, süreç bileşenleri, öğretme-öğrenme uygulamaları
     (Demo içerik; yapı TYMM öğretim programı biçimini izler. pages: yayınevinin süreç bileşeni ↔ ders kitabı sayfası eşleştirmesi) */
  const OC = (code, unitId, title, comps, practice, pages, values) => ({
    code, unitId, title, practice, values: values || [],
    comps: comps.map((text, i) => ({ k: ["a", "b", "c", "ç", "d", "e"][i], text })),
    pages: pages || {},
  });
  const OUTCOMES = [
    OC("SB.7.1.1", "u1", "Bireyin toplumsal gruplar içindeki rollerinin zaman içinde değişebileceğini çözümleyebilme",
      ["İçinde bulunduğu grupları ve bu gruplardaki rollerini belirler.", "Rollerin kazanılma biçimlerini (doğuştan/sonradan) sınıflandırır.", "Rollerin zaman içindeki değişimini örnekler üzerinden karşılaştırır.", "Rollerin getirdiği sorumluluklar hakkında çıkarım yapar."],
      "Öğrencilerden aile, okul ve arkadaş gruplarında üstlendikleri rolleri bir kavram haritası üzerinde göstermeleri istenir (OB1, KB2.4). Rollerin doğuştan mı sonradan mı kazanıldığı sınıf içi tartışmayla belirlenir (SDB2.1). Farklı kuşaklardan aile büyükleriyle yapılan kısa görüşmeler aracılığıyla rollerin zaman içindeki değişimi karşılaştırılır (E2, KB2.8). Rollerin beraberinde getirdiği sorumluluklar üzerinde durularak sorumluluk ve saygı değerlerinin önemi vurgulanır (D3, D4). Süreç, öz değerlendirme formu kullanılarak değerlendirilebilir.",
      { a: [10, 11, 12], b: [12, 13], c: [14, 16], "ç": [15, 17] }, ["D3", "D4"]),
    OC("SB.7.1.2", "u1", "Bilgiye ulaşma sürecinde medya kaynaklarındaki bilgilerin doğruluğunu sorgulayabilme",
      ["Medyada karşılaştığı ve merak ettiği konuları tanımlar.", "Merak ettiği konular hakkında sorular sorar.", "Farklı medya kaynaklarından bilgi toplar.", "Toplanan bilgilerin doğruluğunu farklı kaynaklarla karşılaştırarak değerlendirir.", "Toplanan bilgiler üzerinden çıkarım yapar."],
      "Öğrencilere yazılı, görsel ve dijital medyadan seçilmiş haber örnekleri sunulur (OB1, OB2, OB4). Örnekler güvenilir haber kaynaklarından ve resmî kurumların bilgilendirme materyallerinden seçilir. Öğrencilerden inceledikleri haberlerde dikkatlerini çeken ve merak uyandıran konuları listelemeleri istenir (E1). Listelenen konular hakkında “5N1K” tekniği kullanılarak sorular hazırlanır ve cevaplar farklı kaynaklardan araştırılır (E2, KB2.8). Aynı habere ait farklı kaynaklardaki bilgiler karşılaştırılarak doğruluk değerlendirmesi yapılır; bu süreçte doğruluk değerinin önemi vurgulanır (D1). Süreç sonunda öğrencilerin doğru bilginin toplum hayatındaki önemine ilişkin çıkarımlar yapmaları sağlanır (KB2.10). Süreç, kontrol listesi kullanılarak değerlendirilebilir.",
      { a: [18, 20], b: [20, 21], c: [18, 19, 33], "ç": [18, 33, 36, 37] }, ["D1", "E1", "E2"]),
    OC("SB.7.2.1", "u2", "Türklerde devlet anlayışının temel unsurlarını tarihî kaynaklardan yararlanarak açıklayabilme",
      ["Türklerde devlet anlayışına ilişkin temel kavramları (kut, töre, kurultay) tanımlar.", "Devlet anlayışına ilişkin bilgileri tarihî kaynaklardan toplar.", "Toplanan bilgilerin doğruluğunu farklı kaynaklardan kontrol eder.", "Devlet anlayışının toplumsal hayata etkileri hakkında çıkarım yapar."],
      "Öğrencilere Orhun Yazıtları'ndan seçilmiş bölümler ve görseller sunulur (OB1, OB4). Kut, töre ve kurultay kavramları kavram kartları kullanılarak tanımlanır (KB2.4). Öğrencilerden tarihî kaynaklardan elde ettikleri bilgileri farklı kaynaklarla karşılaştırarak doğrulamaları istenir (D1, E2). Kurultay canlandırması yapılarak ortak karar alma süreci deneyimlenir (SDB2.1). Canlandırma sonunda töre ile adalet arasındaki ilişki tartışılır (D2). Süreç, dereceli puanlama anahtarı ile değerlendirilebilir.",
      { a: [42, 43], b: [42, 44, 45], c: [42], "ç": [43, 46] }, ["D1", "D2", "E2"]),
    OC("SB.7.2.2", "u2", "Kültürel mirasın korunması ve gelecek kuşaklara aktarılmasına yönelik öneriler geliştirebilme",
      ["Yaşadığı çevredeki somut ve somut olmayan kültürel miras ögelerini belirler.", "Kültürel mirasın korunmasının önemini gerekçeleriyle açıklar.", "Kültürel mirası korumaya yönelik özgün öneriler geliştirir."],
      "Öğrencilerden yaşadıkları yerdeki kültürel miras ögelerini fotoğraf ve kısa notlarla belgelemeleri istenir (OB4, E1). Dede Korkut hikâyelerinden seçilen bölümler dinlenerek sözlü kültürün aktarımı tartışılır (OB1). Ahilik teşkilatındaki dayanışma ve dürüst ticaret örnekleri üzerinden değerler vurgulanır (D1, D6). Öğrenciler grup çalışmasıyla mirası korumaya yönelik proje önerileri hazırlar ve sunar (SDB2.1, KB3.2). Süreç, proje değerlendirme ölçeği ile değerlendirilebilir.",
      { a: [50, 52, 58, 60], b: [64, 66], c: [70, 74] }, ["D4", "D5", "D6"]),
    OC("SB.7.3.1", "u3", "Türkiye'de nüfusun dağılışını etkileyen faktörleri harita ve grafikler üzerinden yorumlayabilme",
      ["Nüfusun dağılışını etkileyen doğal ve beşerî faktörleri sınıflandırır.", "Nüfus yoğunluğu haritalarını ve grafiklerini okur.", "Harita ve grafiklerden elde ettiği bilgilerle çıkarım yapar."],
      "Öğrencilere Türkiye nüfus yoğunluğu haritası ve nüfus grafikleri sunulur (OB4). Harita unsurları (lejant, ölçek, yön) üzerinde durularak harita okuma becerisi geliştirilir (SBAB4). Farklı projeksiyonlarla çizilmiş haritalar karşılaştırılarak bilginin doğruluğu tartışılır (D1, E2). Öğrencilerden kendi illerinin nüfus verilerini grafiğe dönüştürüp yorumlamaları istenir (KB2.10). Süreç, performans görevi ile değerlendirilebilir.",
      { a: [76, 78, 80], b: [84, 88, 94, 96], c: [88, 90, 100] }, ["D1", "E1", "E2"]),
    OC("SB.7.3.2", "u3", "Göçün nedenlerini ve sonuçlarını farklı bakış açılarıyla karşılaştırabilme",
      ["Göçün ekonomik, sosyal ve siyasi nedenlerini açıklar.", "Göçün göç veren ve göç alan yerlere etkilerini karşılaştırır.", "Göç hikâyeleri üzerinden farklı bakış açılarını ve duyguları anlamaya çalışır."],
      "Öğrencilerden ailelerinden veya çevrelerinden dinledikleri göç hikâyelerini paylaşmaları istenir (SDB1.2, E3). Göçün nedenleri sınıf içinde kavram haritası ile gruplandırılır (KB2.4). Göç veren ve göç alan yerlere ait veriler tablo üzerinde karşılaştırılır (OB4, KB2.10). Süreç, öz ve akran değerlendirme formu ile değerlendirilebilir.",
      { a: [102, 104], b: [106], c: [108] }, ["E3"]),
    OC("SB.7.4.1", "u4", "İslam medeniyetinde bilimin gelişimine katkı sağlayan kurum ve kişileri tanıyabilme",
      ["Bilimin gelişiminde etkili olan kurumları (Beytülhikme, gözlemevleri) tanır.", "Bilginlerin çalışmalarını zaman çizelgesi üzerinde gösterir.", "Bilginlerin bilimsel yöntemlerini günümüz bilimsel yöntemleriyle karşılaştırır."],
      "Öğrencilere bilim tarihine ait görseller ve kısa biyografiler sunulur (OB1, OB4). Bilginler bir zaman çizelgesinde gösterilir (KB2.6). Bilim insanlarının sorgulama ve doğrulama yöntemleri tartışılarak bilimsel tutumun önemi vurgulanır (E2, D1). Öğrencilerin merak ettikleri bir bilim insanını araştırıp sunmaları istenir (E1). Süreç, sunum değerlendirme formu ile değerlendirilebilir.",
      { a: [114, 116, 122], b: [124, 127], c: [125, 131] }, ["D1", "E1", "E2"]),
    OC("SB.7.4.2", "u4", "Teknolojinin bireysel ve toplumsal hayata etkilerini sorumluluk bilinciyle değerlendirebilme",
      ["Teknolojik gelişmelerin günlük hayata etkilerini örneklendirir.", "Teknoloji kullanımına ilişkin olumlu ve olumsuz durumları karşılaştırır.", "Bilinçli ve sorumlu teknoloji kullanımına yönelik öneriler geliştirir."],
      "Öğrencilerden bir gün boyunca kullandıkları teknolojik araçları günlük tutarak kaydetmeleri istenir (OB2). Teknoloji kullanımının olumlu ve olumsuz etkileri münazara ile tartışılır (SDB2.1, E2). Dijital ortamda doğru bilgiye ulaşma ve paylaşma sorumluluğu vurgulanır (D1, D3). Süreç, kontrol listesi ile değerlendirilebilir.",
      { a: [140, 142], b: [121, 144] }, ["D1", "D3"]),
    OC("SB.7.5.1", "u5", "Tarihî ticaret yollarının kültürler arası etkileşime katkısını açıklayabilme",
      ["Tarihî ticaret yollarını harita üzerinde gösterir.", "Ticaret yolları üzerindeki yapıların işlevlerini açıklar.", "Ticaretin kültürel etkileşime katkısına ilişkin çıkarım yapar."],
      "Öğrencilere İpek Yolu güzergâhını gösteren tarihî haritalar sunulur (OB4, SBAB4). Kervansaray ve han gibi yapıların işlevleri görseller üzerinden incelenir (OB1). Ticaret yoluyla taşınan ürün ve fikirler bir etkileşim şemasında gösterilir (KB2.10). Süreç, kavram haritası değerlendirme ölçütleri ile değerlendirilebilir.",
      { a: [150, 152], b: [154, 156], c: [158] }, ["E1"]),
    OC("SB.7.5.2", "u5", "Bilinçli tüketici davranışlarını günlük hayatla ilişkilendirebilme",
      ["Tüketici hak ve sorumluluklarını açıklar.", "Ürün etiketlerindeki bilgileri yorumlar.", "Bütçe planı hazırlayarak ihtiyaç ve istekleri ayırt eder."],
      "Öğrencilerden evlerindeki ürünlerin etiketlerini incelemeleri istenir (OB1, KB2.4). Tüketici hakları örnek olaylar üzerinden tartışılır (SDB2.1, D2). Öğrenciler bir aylık bütçe planı hazırlayarak kaynakları verimli kullanmanın önemini fark eder (D3). Süreç, performans görevi ile değerlendirilebilir.",
      { a: [176, 178], b: [180], c: [184] }, ["D2", "D3"]),
    OC("SB.7.6.1", "u6", "Demokrasinin temel ilkelerini millî egemenlik bağlamında açıklayabilme",
      ["Demokrasinin temel ilkelerini tanımlar.", "Millî egemenliğin önemini tarihî süreçle ilişkilendirir.", "Seçimlerin demokrasideki yerini açıklar."],
      "Öğrencilere TBMM'nin açılışına ilişkin belgeler ve görseller sunulur (OB1, OB4). Okul meclisi seçimi canlandırılarak demokratik katılım deneyimlenir (SDB2.1). Millî egemenlik kavramı tarihî süreçle ilişkilendirilerek vatanseverlik değeri vurgulanır (D5). Süreç, gözlem formu ile değerlendirilebilir.",
      { a: [190, 191], b: [193, 194], c: [192] }, ["D2", "D5"]),
    OC("SB.7.6.2", "u6", "Temel hak ve özgürlükleri sorumluluklarla ilişkilendirebilme",
      ["Anayasada yer alan temel hak ve özgürlükleri sınıflandırır.", "Hak ve sorumluluk arasındaki dengeyi örneklerle açıklar.", "Sivil toplum kuruluşlarının toplumsal sorunların çözümüne katkısını değerlendirir."],
      "Öğrencilere Anayasa'dan seçilmiş maddeler sunulur (OB1). Hak ve sorumluluklar örnek olaylar üzerinden eşleştirilir (KB2.4, D3). Bir sivil toplum kuruluşunun çalışmaları araştırılarak gönüllülük ve yardımseverlik değerleri vurgulanır (D6, E3). Süreç, dereceli puanlama anahtarı ile değerlendirilebilir.",
      { a: [196, 199, 201], b: [214, 219], c: [206, 208] }, ["D2", "D3", "D6"]),
    OC("SB.7.7.1", "u7", "Türkiye'nin konumunun küresel ilişkilerdeki önemini değerlendirebilme",
      ["Türkiye'nin coğrafi konumunun özelliklerini açıklar.", "Uluslararası kuruluşların amaçlarını açıklar.", "Türkiye'nin uluslararası kuruluşlardaki rolünü örneklendirir."],
      "Öğrencilere Türkiye ve çevresini gösteren haritalar sunulur (OB4, SBAB4). Uluslararası kuruluşların amaçları kavram kartlarıyla eşleştirilir (KB2.4). Farklı kültürlere saygı ve barış değerleri vurgulanır (D4). Süreç, kontrol listesi ile değerlendirilebilir.",
      { a: [230, 231, 233], b: [236, 238], c: [240] }, ["D4", "E1"]),
    OC("SB.7.7.2", "u7", "Küresel sorunlara yönelik ortak çözüm önerileri geliştirebilme",
      ["Küresel sorunları belirler.", "Küresel sorunların nedenlerini ve sonuçlarını ilişkilendirir.", "Küresel sorunlara yönelik ortak çözüm önerileri geliştirir.", "İnsani yardım faaliyetlerinin önemini açıklar."],
      "Öğrencilere iklim değişikliği ve insani krizlere ilişkin güncel veriler sunulur (OB1, OB2). Sorunların neden-sonuç ilişkileri balık kılçığı diyagramıyla incelenir (KB2.10). Grup çalışmasıyla ortak çözüm önerileri geliştirilir (KB3.2, SDB2.1). İnsani yardım faaliyetleri üzerinden yardımseverlik ve sorumluluk değerleri vurgulanır (D3, D6). Süreç, proje değerlendirme ölçeği ile değerlendirilebilir.",
      { a: [244, 246], b: [247], c: [248] }, ["D3", "D6"]),
  ];
  const CODE_GLOSSARY = {
    OB1: "Bilgi okuryazarlığı", OB2: "Dijital okuryazarlık", OB4: "Görsel okuryazarlık",
    "KB2.4": "Kavramsallaştırma", "KB2.6": "Sıralama", "KB2.8": "Sorgulama", "KB2.10": "Çıkarım yapma", "KB3.2": "Problem çözme",
    "SDB1.2": "Öz farkındalık", "SDB2.1": "İletişim", "SDB3.3": "Uyum", "SBAB4": "Harita okuryazarlığı (alan becerisi)",
  };

  /* ------------------------------------------------------------------ İlişkili kitaplar: Öğretmen Kılavuz Kitabı ve Öğrenci Çalışma Kitabı (demo sayfaları) */
  function finalizeUnits(units) {
    units.forEach((u) => {
      u.label = u.no ? `${u.no}. Ünite: ${u.title}` : u.title;
      u.short = u.no ? `Ü${u.no}` : u.title;
      u.sections = u.sections.map((s, i, arr) => ({ title: s.title, start: s.start, end: i < arr.length - 1 ? arr[i + 1].start - 1 : u.end }));
    });
    return units;
  }
  function rangeLabel(list) {
    const p = [...new Set(list)].sort((a, b) => a - b);
    if (!p.length) return "—";
    return p.length > 1 ? `S.${p[0]}–${p[p.length - 1]}` : `S.${p[0]}`;
  }
  function outcomeBookPages(o) { return [].concat(...Object.values(o.pages)); }
  function makeBook(key, id, title, short, pages, units, cover) {
    const unitOfB = (n) => units.find((u) => n >= u.start && n <= u.end) || units[0];
    return {
      key, id, title, short, cover, pages, units, pageCount: pages.length - 1,
      unitOf: unitOfB,
      sectionOf(n) { const u = unitOfB(n); let s = u.sections[0]; for (const sec of u.sections) if (n >= sec.start) s = sec; return s; },
      pageText(n) { const p = pages[n]; if (!p) return ""; if (p.kind === "cover") return title; return p.blocks.map(blockText).join(" "); },
    };
  }
  function buildCompanion(kind) {
    const guide = kind === "guide";
    const pages = [null];
    const units = [];
    const add = (p) => { pages.push(Object.assign({ n: pages.length, kind: "content" }, p)); return pages.length - 1; };
    const frontId = guide ? "gon" : "won";
    add({ kind: "cover", unitId: frontId, section: "Kapak", blocks: [] });
    if (guide) {
      add({ kind: "matter", unitId: frontId, section: "Kılavuzun Kullanımı", blocks: [
        { t: "h2", text: "KILAVUZUN KULLANIMI" },
        { t: "p", text: "Bu kılavuz, 7. Sınıf Sosyal Bilgiler ders kitabının öğretim programıyla uyumlu biçimde kullanılmasına yardımcı olmak amacıyla hazırlanmıştır. Her öğrenme çıktısı için süreç bileşenleri, öğretme-öğrenme uygulamaları ve ders kitabındaki ilgili sayfalar birlikte verilmiştir." },
        { t: "box", variant: "info", label: "Bilgi Kutusu", title: "Kodların anlamı", text: Object.entries(CODE_GLOSSARY).map(([k, v]) => `${k}: ${v}`).join(" · ") + " · D: Değerler · E: Eğilimler" },
      ] });
      add({ kind: "matter", unitId: frontId, section: "Ölçme ve Değerlendirme Yaklaşımı", blocks: [
        { t: "h2", text: "ÖLÇME VE DEĞERLENDİRME YAKLAŞIMI" },
        { t: "p", text: "Öğretim programında süreç odaklı değerlendirme esas alınmıştır. Kontrol listeleri, dereceli puanlama anahtarları, öz ve akran değerlendirme formları her öğrenme çıktısının sonunda önerilmiştir." },
        { t: "p", text: "Öğretmenler, öğrencilerin hazırbulunuşluk düzeylerine göre uygulamaları farklılaştırabilir; önerilen süreler esnek olarak kullanılabilir." },
      ] });
    } else {
      add({ kind: "matter", unitId: frontId, section: "Çalışma Kitabını Tanıyalım", blocks: [
        { t: "h2", text: "ÇALIŞMA KİTABINI TANIYALIM" },
        { t: "p", text: "Bu çalışma kitabı, ders kitabında öğrendiklerinizi pekiştirmeniz için hazırlanmıştır. Her çalışma, ders kitabındaki bir öğrenme çıktısıyla ilişkilidir ve sayfanın üst kısmında ilgili ders kitabı sayfaları belirtilmiştir." },
      ] });
    }
    units.push({ id: frontId, no: 0, title: "Ön Sayfalar", start: 1, end: pages.length - 1, color: "#334155", matter: true, sections: [{ title: "Ön Sayfalar", start: 1 }] });
    CONTENT_UNITS.forEach((u) => {
      const start = pages.length;
      const sections = [];
      const ocs = OUTCOMES.filter((o) => o.unitId === u.id);
      const uid2 = (guide ? "g" : "w") + u.no;
      sections.push({ title: "Ünite Girişi", start });
      add({ unitId: uid2, section: "Ünite Girişi", blocks: [
        { t: "unitband", text: `${u.no}. ÜNİTE · ${u.title.toLocaleUpperCase("tr-TR")}` },
        { t: "h2", text: guide ? "Ünitenin Öğrenme Çıktıları" : "Bu Ünitede Neler Çalışacağız?" },
        { t: "list", items: ocs.map((o) => `${o.code} ${o.title}`) },
        { t: "box", variant: "info", label: "Ders Kitabı", title: "İlgili sayfalar", text: `${u.label}: S.${u.start}–${u.end}` },
      ] });
      ocs.forEach((o, i) => {
        const s = pages.length;
        sections.push({ title: o.code, start: s });
        const bp = outcomeBookPages(o);
        if (guide) {
          add({ unitId: uid2, section: o.code, outcome: o.code, blocks: [
            { t: "h2", text: o.code },
            { t: "p", text: o.title, cls: "lead" },
            { t: "h3", text: "Süreç Bileşenleri" },
            { t: "list", items: o.comps.map((c) => `${c.k}) ${c.text}`) },
            { t: "box", variant: "info", label: "Ders Kitabı", title: "Kitaptaki yeri", text: `Ders kitabı ${rangeLabel(bp)} · İlişkili değer ve eğilimler: ${o.values.join(", ") || "—"}` },
          ] });
          add({ unitId: uid2, section: o.code, outcome: o.code, blocks: [
            { t: "h3", text: "Öğretme-Öğrenme Uygulamaları" },
            { t: "p", text: o.practice },
            { t: "box", variant: "think", label: "Öğretmene Not", title: "Farklılaştırma", text: "Öğrenme güçlüğü yaşayan öğrenciler için görsel destekli kavram kartları kullanılabilir; ileri düzeydeki öğrencilerden araştırmalarını sınıfa sunmaları istenebilir." },
            { t: "box", variant: "activity", label: "Ölçme", title: "Değerlendirme önerisi", text: `Süreç bileşenlerinin (${o.comps.map((c) => c.k).join(", ")}) her biri için gözlenebilir davranışları içeren bir kontrol listesi hazırlanması önerilir.` },
          ] });
          o.guidePages = [s, s + 1];
        } else {
          const q = (u.questions && u.questions[i % u.questions.length]) || ["", []];
          add({ unitId: uid2, section: o.code, outcome: o.code, blocks: [
            { t: "h2", text: `Çalışma ${u.no}.${i + 1}` },
            { t: "box", variant: "info", label: o.code, title: "Öğrenme çıktısı", text: `${o.title} · Ders kitabı ${rangeLabel(bp)}` },
            { t: "box", variant: "activity", label: "Etkinlik", title: "Adım adım çalışalım", text: o.comps.map((c, j) => `${j + 1}. ${c.text}`).join(" ") },
            { t: "p", text: "Çalışmanızı tamamladıktan sonra bulgularınızı sınıfta arkadaşlarınızla paylaşınız." },
          ] });
          add({ unitId: uid2, section: o.code, outcome: o.code, blocks: [
            { t: "h3", text: "Kendimi Sınıyorum" },
            { t: "q", no: 1, text: q[0], options: q[1] },
            { t: "box", variant: "think", label: "Öz Değerlendirme", title: "Neler öğrendim?", text: o.comps.map((c) => `☐ ${c.text.replace(/\.$/, "")}`).join("  ") },
          ] });
          o.workbookPages = [s, s + 1];
        }
      });
      units.push({ id: uid2, no: u.no, title: u.title, start, end: pages.length - 1, color: u.color, sections });
    });
    if (guide) {
      const s = pages.length;
      add({ kind: "matter", unitId: "gson", section: "Cevap Anahtarı", blocks: [{ t: "h2", text: "DERS KİTABI CEVAP ANAHTARI" }, { t: "p", text: "1. Ünite: 1-B, 2-C, 3-D · 2. Ünite: 1-B, 2-B, 3-C · 3. Ünite: 1-C, 2-A · 4. Ünite: 1-C, 2-D · 5. Ünite: 1-B, 2-C, 3-A · 6. Ünite: 1-C, 2-B · 7. Ünite: 1-B, 2-B" }] });
      units.push({ id: "gson", no: 0, title: "Son Sayfalar", start: s, end: pages.length - 1, color: "#334155", matter: true, sections: [{ title: "Cevap Anahtarı", start: s }] });
    }
    finalizeUnits(units);
    return guide
      ? makeBook("guide", DOC_ID + "-ogretmen", "7. Sınıf Sosyal Bilgiler Öğretmen Kılavuz Kitabı", "Öğretmen Kılavuz Kitabı", pages, units, { title: "SOSYAL BİLGİLER", sub: "7. SINIF · ÖĞRETMEN KILAVUZ KİTABI", color: "#0e7490" })
      : makeBook("workbook", DOC_ID + "-calisma", "7. Sınıf Sosyal Bilgiler Öğrenci Çalışma Kitabı", "Öğrenci Çalışma Kitabı", pages, units, { title: "SOSYAL BİLGİLER", sub: "7. SINIF · ÖĞRENCİ ÇALIŞMA KİTABI", color: "#b45309" });
  }
  const BOOKS = {
    main: Object.assign(makeBook("main", DOC_ID, BOOK.title, "Ders Kitabı", PAGES, UNITS, { title: "SOSYAL BİLGİLER", sub: "7. SINIF · DERS KİTABI", color: "#1f6fb2" }), { pageText }),
    guide: buildCompanion("guide"),
    workbook: buildCompanion("workbook"),
  };

  /* ------------------------------------------------------------------ Yayınevi beyanı (tohum): sayfa ↔ öğrenme çıktısı/süreç bileşeni, sayfa ↔ değer/eğilim, medya ↔ sayfa */
  function seedPublisher() {
    const pages = {};
    const ensure = (n) => (pages[n] = pages[n] || { outcomes: [], tymm: [] });
    OUTCOMES.forEach((o) => Object.entries(o.pages).forEach(([k, list]) => list.forEach((n) => {
      const pg = ensure(n);
      let l = pg.outcomes.find((x) => x.code === o.code);
      if (!l) { l = { code: o.code, comps: [] }; pg.outcomes.push(l); }
      if (!l.comps.includes(k)) l.comps.push(k);
    })));
    // Açıkça tanımlanmamış içerik sayfaları: bölümüne göre ünitenin öğrenme çıktısıyla eşleştirilir.
    // Ünite değerlendirme sayfaları ve bazı sayfalar bilinçli olarak eşleşmesiz bırakılır (kontrol adımında uyarı olarak görünür).
    const GAPS = { "SB.7.1.2": "d", "SB.7.4.2": "c", "SB.7.7.2": "ç" };
    CONTENT_UNITS.forEach((u) => {
      const ocs = OUTCOMES.filter((o) => o.unitId === u.id);
      for (let n = u.start; n <= u.end; n++) {
        if (pages[n] && pages[n].outcomes.length) continue;
        const sec = sectionOf(n);
        if (sec.title === "Ünite Değerlendirme" || n % 9 === 0) continue;
        const si = u.sections.indexOf(sec);
        const o = ocs[si < 2 ? 0 : 1] || ocs[0];
        const comps = o.comps.filter((c) => GAPS[o.code] !== c.k);
        const pg = ensure(n);
        pg.outcomes.push({ code: o.code, comps: [comps[n % comps.length].k] });
      }
    });
    TYMM.forEach((t, i) => { if (i % 4 !== 3) { const pg = ensure(t.page); if (!pg.tymm.includes(t.code)) pg.tymm.push(t.code); } });
    const MO = { m1: "SB.7.2.1", m2: "SB.7.2.2", m3: "SB.7.2.2", m4: "SB.7.3.1", m5: "SB.7.4.1", m6: "", m7: "SB.7.6.1" };
    const TR = { m1: "orhun-yazitlari.vtt", m2: "bogac-han-transkript.txt", m3: null, m4: "nufus-piramidi-aciklama.txt", m5: "ulug-bey.vtt", m6: "istiklal-marsi.txt", m7: null };
    const media = MEDIA.map((m) => ({ id: m.id, type: m.type, title: m.title, duration: m.duration, file: m.title.toLocaleLowerCase("tr-TR").replace(/[âàá]/g, "a").replace(/[îı]/g, "i").replace(/ğ/g, "g").replace(/[üû]/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + (m.type === "audio" ? ".mp3" : m.type === "video" ? ".mp4" : ".zip"), pages: [m.page], outcome: MO[m.id], transcript: TR[m.id] }));
    media.push({ id: "m8", type: "video", title: "Göç Hikâyeleri Belgeseli", duration: "7:40", file: "goc-hikayeleri.mp4", pages: [], outcome: "", transcript: null });
    return {
      files: {
        main: { name: "sosyal-bilgiler-7-ders-kitabi.pdf", size: "84,2 MB", pages: BOOK.pageCount, at: "2026-10-01T14:20" },
        guide: { name: "sosyal-bilgiler-7-ogretmen-kilavuz.pdf", size: "31,5 MB", pages: BOOKS.guide.pageCount, at: "2026-10-01T14:32" },
        workbook: { name: "sosyal-bilgiler-7-calisma-kitabi.pdf", size: "18,9 MB", pages: BOOKS.workbook.pageCount, at: "2026-10-01T14:40" },
      },
      pages, media, submitted: null,
    };
  }

  /* ------------------------------------------------------------------ Tohum kayıtlar */
  const T = (d) => `2026-10-0${d}`;
  const ev = (selectedText, extra) => Object.assign({ selectionType: "text", selectedText, anchor: "text" }, extra || {});

  const FINDINGS = [
    { id: "f1", page: 42, scope: "selection", main: "Bilimsel İçerik", sub: "Kavram yanılgısı", evidence: ev("Kut'un kan yoluyla babadan oğula geçtiğine inanılması"), text: "Kut anlayışı yalnızca babadan oğula geçen bir yetki olarak sunulmuş. Kaynaklarda kutun hanedan soyunun tüm erkek üyelerine geçtiğine inanıldığı belirtilir; bu nedenle ifade eksik ve yanıltıcıdır. “Kutun hükümdar soyundan gelen erkek üyelere geçtiğine inanılması” şeklinde düzeltilmesi önerilir.", at: T(6) + "T10:12" },
    { id: "f2", page: 42, scope: "selection", main: "Bilimsel İçerik", sub: "Bilimsel doğruluk", evidence: ev("Tüm göçebe topluluklar, yaz aylarında yaylalara, kış aylarında ise kışlaklara göç ederdi."), text: "Bu ifadede kavramsal bir genelleme bulunmaktadır. “Tüm göçebe topluluklar” yerine “çoğu göçebe topluluk” ifadesinin kullanılması daha uygundur.", at: T(6) + "T10:20" },
    { id: "f3", page: 42, scope: "selection", main: "Bilimsel İçerik", sub: "Bilimsel doğruluk", evidence: ev("bu yazıtlar Türk tarihinin ilk yazılı belgeleri kabul edilir"), text: "Orhun Yazıtları, “Türk” adının geçtiği ilk Türkçe yazılı belgeler arasında kabul edilir; daha eski tarihli Yenisey Yazıtları bulunmaktadır. İfadenin “Türk adının geçtiği ilk Türkçe yazılı belgelerdendir” şeklinde düzeltilmesi önerilir.", at: T(6) + "T10:31" },
    { id: "f4", page: 43, scope: "selection", main: "Dil ve Anlatım", sub: "Yazım ve noktalama", evidence: ev("Türk devletlerinde ki yönetim anlayışında"), text: "“devletlerinde ki” ifadesindeki “-ki” sıfat yapan ek olduğundan bitişik yazılmalıdır: “devletlerindeki”.", at: T(6) + "T11:02" },
    { id: "f5", page: 18, scope: "page", main: "Görsel Tasarım", sub: "Sayfa düzeni", evidence: { selectionType: "region", anchor: "page" }, text: "Etkinlik kutusu ile Görsel 1.4 arasındaki boşluk yetersiz; etkinlik başlığı görselle bitişik algılanıyor. Sayfa düzeninde bloklar arasına yeterli boşluk bırakılmalıdır.", at: T(5) + "T14:40" },
    { id: "f6", page: 23, scope: "selection", main: "Ölçme ve Değerlendirme", sub: "Soru doğruluğu", evidence: ev("Aşağıdakilerden hangisi birincil gruplara örnek değildir?", { selectionType: "region", anchor: "box" }), text: "“Okul sınıfı” seçeneği bazı kaynaklarda ikincil grup olarak sınıflandırıldığından soruda birden fazla doğru cevap oluşabilmektedir. Seçeneğin değiştirilmesi önerilir.", at: T(5) + "T15:05" },
    { id: "f7", page: 31, scope: "selection", main: "Dil ve Anlatım", sub: "Seviyeye uygunluk", evidence: ev("Sosyalizasyon süreci, bireyin toplumsal normları içselleştirerek kimlik inşasını gerçekleştirdiği diyalektik bir süreçtir."), text: "İfade 7. sınıf öğrencilerinin dil düzeyinin üzerindedir. “Sosyalizasyon”, “içselleştirme” ve “diyalektik” kavramları açıklanmadan kullanılmıştır; daha sade bir anlatım önerilir.", at: T(5) + "T16:10" },
    { id: "f8", page: 38, scope: "selection", main: "Genel İlkeler ve Mevzuat", sub: "Ticari unsur", evidence: ev("Güncel haberleri en hızlı şekilde HaberNet uygulamasından takip edebilirsiniz."), text: "Metinde belirli bir ticari uygulamaya yönlendirme yapılmaktadır. Ders kitaplarında ticari ürün, marka veya hizmet tanıtımına yer verilmemelidir.", at: T(5) + "T16:44" },
    { id: "f9", page: 50, scope: "selection", main: "Bilimsel İçerik", sub: "Kaynak gösterimi", evidence: ev("Gelimli gidimli dünya, son ucu ölümlü dünya."), text: "Dede Korkut Kitabı'ndan yapılan alıntının kaynağı (hikâye adı ve kullanılan baskı) belirtilmemiştir.", at: T(6) + "T12:15" },
    { id: "f10", page: 58, scope: "selection", main: "Görsel Tasarım", sub: "Görsel kalitesi", evidence: ev("Görsel 2.6 Sultanhanı Kervansarayı taç kapısı, Aksaray", { selectionType: "image", anchor: "fig" }), text: "Görsel 2.6'nın çözünürlüğü düşüktür; taç kapıdaki taş işçiliği ayrıntıları baskıda seçilemeyecektir. Yüksek çözünürlüklü görsel kullanılmalıdır.", at: T(6) + "T13:02" },
    { id: "f11", page: 63, scope: "selection", main: "Dil ve Anlatım", sub: "Anlatım bozukluğu", evidence: ev("Ahiler, hem mesleki bilgiyi hem de ahlaki değerleri genç kuşaklara aktarılmıştır."), text: "Cümlede çatı uyuşmazlığı vardır. Özne “Ahiler” olduğundan yüklem etken olmalıdır: “…genç kuşaklara aktarmıştır.”", at: T(6) + "T13:30" },
    { id: "f12", page: 88, scope: "selection", main: "Görsel Tasarım", sub: "Harita/grafik doğruluğu", evidence: ev("Görsel 3.3 Türkiye nüfus yoğunluğu haritası (2023)", { selectionType: "image", anchor: "fig" }), text: "Nüfus yoğunluğu haritasında lejanttaki renk tonları ile haritada kullanılan renkler uyuşmamaktadır; en yoğun kategori haritada farklı tonla gösterilmiştir.", at: T(6) + "T15:48" },
    { id: "f13", page: 108, scope: "activity", activityName: "Etkinlik 3.4 · Göç Haritası", main: "TYMM / Program Uyumu", sub: "Öğrenme çıktılarıyla uyum", evidence: ev("Ailenizin veya tanıdıklarınızın yaşadığı göç hikâyelerinden birini dinleyiniz.", { selectionType: "region", anchor: "box" }), text: "Etkinlik, ilgili öğrenme çıktısında yer alan göçün nedenlerini ve sonuçlarını karşılaştırma becerisini desteklememektedir; yalnızca özetleme çalışmasına dayanmaktadır.", at: T(6) + "T16:20" },
    { id: "f14", page: 121, scope: "selection", main: "Bilimsel İçerik", sub: "Güncellik", evidence: ev("Günümüzde dünya nüfusunun yaklaşık yarısı internet kullanmaktadır."), text: "Veri güncel değildir. Uluslararası Telekomünikasyon Birliği verilerine göre bu oran 2024 itibarıyla yaklaşık %68'dir. Verinin ve kaynak yılının güncellenmesi gerekir.", at: T(7) + "T09:05" },
    { id: "f15", page: null, scope: "book", main: "Bilimsel İçerik", sub: "Kaynak gösterimi", evidence: null, text: "Kitap genelinde birçok görselin kaynağı görsel kaynakçada yer almamaktadır (ör. Görsel 2.1, 2.6, 3.3). Tüm görseller için kaynak bilgisi eksiksiz verilmelidir.", at: T(7) + "T09:30" },
    { id: "f16", page: 142, scope: "selection", main: "Dil ve Anlatım", sub: "Terim kullanımı", evidence: ev("Yapay zeka uygulamaları"), text: "“Yapay zeka” ifadesi TDK yazımına göre “yapay zekâ” şeklinde yazılmalıdır; ünite içinde terim tutarlı kullanılmalıdır.", at: T(7) + "T09:48" },
    { id: "f17", page: 12, scope: "selection", main: "Bilimsel İçerik", sub: "Bilimsel doğruluk", origin: "yazdis", yazdisId: "y6", evidence: ev("Toplumsal roller doğuştan kazanılır ve hayat boyunca değişmez."), text: "Toplumsal rollerin bir kısmı doğuştan kazanılsa da çoğu sonradan kazanılır ve yaşam boyunca değişebilir. İfade yanlış genelleme içermektedir.", at: T(5) + "T13:10" },
  ];
  FINDINGS.forEach((f, i) => { mapLegacy(f); f.no = i + 1; f.docId = DOC_ID; f.reviewerId = "me"; f.origin = f.origin || "human"; f.createdAt = f.at; f.updatedAt = f.at; delete f.at; });

  const Y = (id, page, main, sub, selectedText, text, rationale, confidence, extra) =>
    Object.assign({ id, page, main, sub, evidence: ev(selectedText), text, rationale, confidence, docId: DOC_ID, createdAt: T(3) + "T22:14" }, extra || {});
  const YAZDIS = [
    Y("y1", 42, "Dil ve Anlatım", "Anlatım bozukluğu", "Bu durum zaman zaman taht kavgalarına neden olmuştur.", "“Bu durum” ifadesinin göndergesi belirsizdir; önceki cümlede birden fazla yargı bulunduğundan neyin taht kavgalarına yol açtığı açık değildir.", "Cümle başındaki işaret zamiri, önceki cümledeki iki ayrı yargıdan (kutun kan yoluyla geçmesi ve tüm erkek üyelerin hak sahibi olması) hangisine gönderme yaptığını netleştirmemektedir.", 0.64),
    Y("y2", 42, "Görsel Tasarım", "Görsel-metin uyumu", "Görsel 2.1 Orhun Yazıtları (Bilge Kağan Yazıtı), Moğolistan, 732", "Görsel altı yazısında Bilge Kağan Yazıtı için 732 tarihi verilmiştir. 732 tarihi Kül Tigin Yazıtı'na aittir; Bilge Kağan Yazıtı 735 tarihlidir.", "Altyazıdaki yazıt adı ile tarih bilgisi, yaygın kabul gören tarih kaynaklarındaki bilgilerle çelişmektedir.", 0.88),
    Y("y3", 45, "Bilimsel İçerik", "Bilimsel doğruluk", "Asya Hun Devleti'nin kurucusu Mete Han'dır.", "Kaynaklarda adı bilinen ilk Asya Hun hükümdarı Teoman'dır. Mete Han devleti en güçlü dönemine ulaştıran hükümdardır; “kurucusu” ifadesi tartışmalıdır.", "Metindeki bilgi, yaygın olarak kullanılan “Teoman zamanında güçlenen, Mete Han döneminde en parlak dönemini yaşayan” anlatımıyla çelişmektedir.", 0.71),
    Y("y4", 45, "Ölçme ve Değerlendirme", "Soru doğruluğu", "Aşağıdakilerden hangisi kurultayın görevlerinden biri değildir?", "“Savaş ve barış kararı almak” ile “Devlet işlerini görüşmek” seçenekleri birbirini kapsamaktadır; seçenekler arasında ayırt edicilik zayıftır.", "Seçeneklerin anlamsal benzerliği yüksek bulunmuştur (kapsama ilişkisi).", 0.58, { evidence: ev("Aşağıdakilerden hangisi kurultayın görevlerinden biri değildir?", { selectionType: "region", anchor: "box" }) }),
    Y("y5", 43, "Dil ve Anlatım", "Yazım ve noktalama", "Türk devletlerinde ki yönetim anlayışında", "“-ki” eki bitişik yazılmalıdır: “devletlerindeki”.", "Sıfat yapan “-ki” ekinin ayrı yazıldığı tespit edilmiştir (TDK Yazım Kılavuzu).", 0.93),
    Y("y6", 12, "Bilimsel İçerik", "Bilimsel doğruluk", "Toplumsal roller doğuştan kazanılır ve hayat boyunca değişmez.", "Toplumsal rollerin bir kısmı doğuştan kazanılsa da çoğu sonradan kazanılır ve yaşam boyunca değişebilir. İfade yanlış genelleme içermektedir.", "İfade, programdaki “roller zamanla değişebilir” kazanımıyla çelişmektedir.", 0.82),
    Y("y7", 36, "Dil ve Anlatım", "Yazım ve noktalama", "Medya okur yazarlığı", "“Okur yazarlığı” sözcüğü TDK Yazım Kılavuzu'na göre bitişik yazılmalıdır: “okuryazarlığı”.", "Birleşik kelime yazımı sözlükle karşılaştırılmıştır.", 0.95),
    Y("y8", 67, "Bilimsel İçerik", "Bilimsel doğruluk", "Nevruz, her yıl 21 Mart'ta kutlanan ve yalnızca Türkiye'ye özgü bir bayramdır.", "Nevruz, Türkiye dışında Orta Asya, Kafkasya ve Orta Doğu'daki pek çok ülkede kutlanmaktadır ve UNESCO listesinde çok uluslu olarak kayıtlıdır.", "“Yalnızca” ifadesi kesin bir genelleme içermektedir ve kaynaklarla çelişmektedir.", 0.9),
    Y("y9", 83, "Bilimsel İçerik", "Bilimsel doğruluk", "Türkiye'nin en kalabalık ikinci şehri Ankara'dır.", "Şehir nüfus sıralamasının güncel TÜİK verileriyle doğrulanması önerilir.", "Nüfus verisi içeren cümlelerde kaynak yılı belirtilmemiştir.", 0.55),
    Y("y10", 101, "Bilimsel İçerik", "Bilimsel doğruluk", "Ölçek büyüdükçe haritadaki ayrıntı azalır.", "İfade hatalıdır. Ölçek büyüdükçe haritada gösterilen alan küçülür, ayrıntı artar.", "Ölçek ile ayrıntı arasındaki ilişki ters ifade edilmiştir.", 0.91),
    Y("y11", 127, "Bilimsel İçerik", "Bilimsel doğruluk", "Uluğ Bey Gözlemevi 15. yüzyılda İstanbul'da kurulmuştur.", "Uluğ Bey Gözlemevi Semerkant'ta kurulmuştur.", "Yer bilgisi tarihî kaynaklarla çelişmektedir.", 0.96),
    Y("y12", 133, "Bilimsel İçerik", "Kavram yanılgısı", "Matbaa, 1450'li yıllarda Johannes Gutenberg tarafından icat edilmiştir.", "Baskı tekniklerinin daha önce Çin ve Kore'de kullanıldığı bilinmektedir. Gutenberg'in katkısı hareketli metal harflerle baskı tekniğidir; ifade buna göre düzenlenmelidir.", "“İcat” kavramı kapsamı bakımından tartışmalı bulunmuştur.", 0.52),
    Y("y13", 158, "Bilimsel İçerik", "Bilimsel doğruluk", "İpek Yolu'nun adı, bu yol üzerinden yalnızca ipek taşınmasından gelir.", "İpek Yolu'nda ipeğin yanı sıra baharat, porselen ve kâğıt gibi pek çok ürün taşınmıştır; “yalnızca” ifadesi yanıltıcıdır.", "Kesin genelleme ifadesi tespit edilmiştir.", 0.77),
    Y("y14", 165, "Ölçme ve Değerlendirme", "Cevap anahtarı", "2023 yılında Türkiye'de en fazla istihdam sağlayan sektör aşağıdakilerden hangisidir?", "Cevap anahtarında “Tarım” olarak verilen yanıt güncel TÜİK verileriyle uyumlu değildir; en fazla istihdam hizmet sektöründedir.", "Cevap anahtarı ile güncel istatistikler karşılaştırılmıştır.", 0.6, { evidence: ev("2023 yılında Türkiye'de en fazla istihdam sağlayan sektör aşağıdakilerden hangisidir?", { selectionType: "region", anchor: "box" }) }),
    Y("y15", 194, "Bilimsel İçerik", "Bilimsel doğruluk", "Türkiye Büyük Millet Meclisi 23 Nisan 1921'de açılmıştır.", "TBMM 23 Nisan 1920'de açılmıştır.", "Tarih bilgisi kaynaklarla çelişmektedir.", 0.97),
    Y("y16", 199, "Bilimsel İçerik", "Bilimsel doğruluk", "Anayasa Mahkemesi, yasama organının bir parçasıdır.", "Anayasa Mahkemesi yargı organlarındandır.", "Kurum ile erk eşleştirmesi Anayasa metniyle çelişmektedir.", 0.93),
    Y("y17", 214, "Genel İlkeler ve Mevzuat", "Ayrımcılık ve önyargı", "Görsel 6.5 Okul meclisi seçiminde oy kullanan öğrenciler", "Görseldeki öğrenci grubunda çeşitlilik sınırlıdır; tüm öğrencilerin kendini temsil edilmiş hissedebileceği bir görsel tercih edilebilir.", "Görsel içerik analizi sonucunda temsil çeşitliliği düşük bulunmuştur.", 0.48, { evidence: ev("Görsel 6.5 Okul meclisi seçiminde oy kullanan öğrenciler", { selectionType: "image", anchor: "fig" }) }),
    Y("y18", 236, "Bilimsel İçerik", "Bilimsel doğruluk", "Birleşmiş Milletlerin merkezi Cenevre'dedir.", "BM'nin genel merkezi New York'tadır; Cenevre'de BM Avrupa Ofisi bulunmaktadır.", "Yer bilgisi kaynaklarla çelişmektedir.", 0.94),
    Y("y19", 247, "Bilimsel İçerik", "Kavram yanılgısı", "Küresel ısınma ve iklim değişikliği aynı anlama gelir.", "Küresel ısınma, iklim değişikliğinin bir boyutudur; iki kavram eş anlamlı değildir.", "Kavramların kapsam ilişkisi hatalı kurulmuştur.", 0.69),
    Y("y20", 44, "Bilimsel İçerik", "Bilimsel doğruluk", "Uygurlar, yerleşik hayata geçen ilk Türk topluluğudur.", "Kaynaklarda Uygurlar “yerleşik hayata geçen ilk Türk devleti” olarak anılır; “topluluk” ifadesi tartışmaya açıktır.", "Kavram kapsamı kaynaklarla karşılaştırılmıştır.", 0.61),
  ];
  YAZDIS.forEach((y, i) => { mapLegacy(y); y.no = i + 1; });
  const YAZDIS_DECISIONS = {
    y6: { status: "approved", findingId: "f17", at: T(5) + "T13:10", by: "me" },
    y9: { status: "rejected", reason: "Hata değil", note: "", at: T(6) + "T09:40", by: "me" },
  };

  const O = (id, reviewerId, page, main, sub, selectedText, text, extra) =>
    Object.assign({ id, reviewerId, page, scope: page ? "selection" : "book", main, sub, evidence: selectedText ? ev(selectedText) : null, text, docId: DOC_ID, createdAt: T(5) + "T11:00" }, extra || {});
  const OTHERS = [
    O("o1", "b", 42, "Bilimsel İçerik", "Bilimsel doğruluk", "Tüm göçebe topluluklar, yaz aylarında yaylalara, kış aylarında ise kışlaklara göç ederdi.", "Göçebe topluluklar için kesin bir genelleme yapılmıştır. Yerleşik ya da yarı göçebe gruplar da bulunduğundan ifade yumuşatılmalıdır.", { similarTo: "f2" }),
    O("o2", "c", 42, "Görsel Tasarım", "Görsel-metin uyumu", "Görsel 2.1 Orhun Yazıtları (Bilge Kağan Yazıtı), Moğolistan, 732", "Altyazıdaki tarih hatalıdır; Bilge Kağan Yazıtı 735 tarihlidir.", { evidence: ev("Görsel 2.1 Orhun Yazıtları (Bilge Kağan Yazıtı), Moğolistan, 732", { selectionType: "image", anchor: "fig" }) }),
    O("o3", "c", 43, "Dil ve Anlatım", "Yazım ve noktalama", "Türk devletlerinde ki yönetim anlayışında", "“devletlerinde ki” bitişik yazılmalıdır.", { similarTo: "f4" }),
    O("o4", "b", 44, "Bilimsel İçerik", "Bilimsel doğruluk", "Uygurlar, yerleşik hayata geçen ilk Türk topluluğudur.", "İfade tartışmalıdır; “yerleşik hayata geçen ilk Türk devleti” ifadesi daha uygundur."),
    O("o5", "c", 45, "Bilimsel İçerik", "Bilimsel doğruluk", "Asya Hun Devleti'nin kurucusu Mete Han'dır.", "Teoman bilinen ilk hükümdardır; “kurucu” ifadesi yerine “en güçlü hükümdarı” denmelidir."),
    O("o6", "b", 50, "Bilimsel İçerik", "Kaynak gösterimi", "Gelimli gidimli dünya, son ucu ölümlü dünya.", "Alıntının kaynağı gösterilmemiştir.", { similarTo: "f9" }),
    O("o7", "c", 63, "Dil ve Anlatım", "Anlatım bozukluğu", "Ahiler, hem mesleki bilgiyi hem de ahlaki değerleri genç kuşaklara aktarılmıştır.", "Çatı uyuşmazlığı: “aktarmıştır” olmalıdır.", { similarTo: "f11" }),
    O("o8", "b", 96, "Etkinlikler", "Süre ve materyal", "Farklı projeksiyonlarla çizilmiş iki dünya haritasını karşılaştırınız.", "Etkinlikte karşılaştırılacak haritalar verilmemiştir; öğrencinin etkinliği tamamlaması için gerekli materyal eksiktir.", { evidence: ev("Farklı projeksiyonlarla çizilmiş iki dünya haritasını karşılaştırınız.", { selectionType: "region", anchor: "box" }) }),
    O("o9", "c", 127, "Bilimsel İçerik", "Bilimsel doğruluk", "Uluğ Bey Gözlemevi 15. yüzyılda İstanbul'da kurulmuştur.", "Gözlemevi Semerkant'ta kurulmuştur."),
    O("o10", "b", 194, "Bilimsel İçerik", "Bilimsel doğruluk", "Türkiye Büyük Millet Meclisi 23 Nisan 1921'de açılmıştır.", "TBMM'nin açılış tarihi 23 Nisan 1920'dir."),
    O("o11", "c", null, "Ölçme ve Değerlendirme", "Soru seviyesi", null, "Ünite değerlendirme sorularının büyük bölümü hatırlama düzeyindedir; üst düzey düşünme becerilerini ölçen sorular yetersizdir."),
    O("o12", "b", 121, "Bilimsel İçerik", "Güncellik", "Günümüzde dünya nüfusunun yaklaşık yarısı internet kullanmaktadır.", "Veri eskidir, güncel ITU verisi kullanılmalıdır.", { similarTo: "f14" }),
    O("o13", "c", 88, "Görsel Tasarım", "Harita/grafik doğruluğu", "Görsel 3.3 Türkiye nüfus yoğunluğu haritası (2023)", "Lejant ile harita renkleri uyumsuz.", { similarTo: "f12", evidence: ev("Görsel 3.3 Türkiye nüfus yoğunluğu haritası (2023)", { selectionType: "image", anchor: "fig" }) }),
    O("o14", "b", 23, "Ölçme ve Değerlendirme", "Soru doğruluğu", "Aşağıdakilerden hangisi birincil gruplara örnek değildir?", "Sorunun birden fazla doğru cevabı olabilir.", { similarTo: "f6", evidence: ev("Aşağıdakilerden hangisi birincil gruplara örnek değildir?", { selectionType: "region", anchor: "box" }) }),
  ];
  const otherCounters = {};
  OTHERS.forEach((o) => { mapLegacy(o); otherCounters[o.reviewerId] = (otherCounters[o.reviewerId] || 0) + 1; o.no = otherCounters[o.reviewerId]; });

  const TM = (id, code, page, activityName, selectedText, coverageType, source, status, extra) =>
    Object.assign({ id, code, page, activityName, coverageType, source, verificationStatus: status, evidence: ev(selectedText, { anchor: "text" }), docId: DOC_ID, createdAt: T(3) + "T22:14" }, extra || {});
  const V = (by, d) => ({ verifiedBy: by || "me", verifiedAt: T(d || 6) + "T10:00" });
  const TYMM = [
    TM("t1", "D1", 18, "Etkinlik 1.2 · Haberi Doğrula", "Haberin doğruluğunu en az iki farklı güvenilir kaynaktan kontrol ediniz.", "explicit", "human", "verified", V("me", 5)),
    TM("t2", "D1", 27, "Okuma Metni · Mektuptaki Yanlışlık", "Hemen öğretmenini arayarak hatasını anlattı ve doğru tarihi içeren yeni bir mektup gönderdi.", "implicit", "YAZDİS", "verified", Object.assign(V("me", 5), { rationale: "Karakterin hatasını kendiliğinden düzeltmesi, doğruluk değerinin davranış üzerinden işlendiğini göstermektedir.", confidence: 0.81 })),
    TM("t3", "D1", 33, "Medya Okuryazarlığı Köşesi", "Bir haberi paylaşmadan önce kaynağını, tarihini ve doğruluğunu mutlaka kontrol ediniz.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 5), { rationale: "Doğruluk kavramı doğrudan anılarak öğrenciden bir davranış istenmektedir.", confidence: 0.9 })),
    TM("t4", "D1", 58, "Ahilik ve Dürüst Ticaret", "Ahi esnafı, malının kusurunu müşteriden saklamaz, doğru ölçü ve tartıyla satış yapardı.", "implicit", "human", "verified", V("me", 6)),
    TM("t5", "D1", 131, "Etkinlik 4.3 · Bilim İnsanı Gibi Düşünelim", "Bir iddiayı kabul etmeden önce kanıtlarını araştırınız ve elde ettiğiniz bilgilerin doğruluğunu sınayınız.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Öğrenciden bilgilerin doğruluğunu sınaması açıkça istenmektedir.", confidence: 0.89 })),
    TM("t6", "D1", 201, "Haklarımızı Öğrenelim", "Bilgi edinme hakkı, vatandaşların kamu kurumlarından doğru ve eksiksiz bilgi talep edebilmesini sağlar.", "implicit", "human", "verified", V("me", 7)),
    TM("t7", "D1", 42, "Etkinlik 2.1 · Bilgiyi Değerlendirelim", "Elde ettiğiniz bilgilerin doğruluğunu farklı kaynaklardan kontrol ediniz.", "explicit", "YAZDİS", "candidate", { rationale: "Öğrenciden bilginin doğruluğunu doğrudan sorgulaması istendiği için D1 açık biçimde işlenmektedir.", confidence: 0.92 }),
    TM("t8", "D1", 96, "Tartışma Etkinliği · Haritalar Yanıltır mı?", "Hangi haritanın daha doğru bilgi verdiğini gerekçeleriyle tartışınız.", "implicit", "YAZDİS", "candidate", { rationale: "Etkinlik, öğrencilerin farklı haritalardaki bilgilerin doğruluğunu karşılaştırmasını gerektirdiğinden doğruluk değeri örtük olarak işlenmektedir.", confidence: 0.67 }),
    TM("t9", "D2", 52, "Dede Korkut'tan Değerler", "Hikâyede Bayındır Han, verdiği kararlarda herkese eşit davranarak adaletin önemini gösterir.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 6), { rationale: "Adalet değeri adıyla anılarak bir karakter davranışıyla örneklenmektedir.", confidence: 0.86 })),
    TM("t10", "D2", 196, "Anayasa ve Eşitlik", "Anayasamıza göre herkes, dil, ırk, renk, cinsiyet, din ve mezhep ayrımı gözetilmeksizin kanun önünde eşittir.", "explicit", "human", "verified", V("me", 7)),
    TM("t11", "D2", 210, "Örnek Olay · Sınıf Kuralları", "Sınıf kurallarını belirlerken her öğrencinin görüşünü almak neden önemlidir?", "implicit", "YAZDİS", "candidate", { rationale: "Karar süreçlerinde herkesin görüşünün alınması hakkaniyet ilkesiyle ilişkilidir.", confidence: 0.62 }),
    TM("t12", "D2", 168, "Lonca Kuralları", "Loncalar, ürünlerin fiyatını belirleyerek hem üreticiyi hem de tüketiciyi korumaya çalışırdı.", "implicit", "YAZDİS", "insufficient", Object.assign(V("me", 7), { rationale: "Üretici ve tüketicinin birlikte korunması adalet değeriyle ilişkilendirilebilir.", confidence: 0.55, note: "İfade adalet değerini yalnızca dolaylı ve yüzeysel biçimde yansıtıyor." })),
    TM("t13", "D3", 15, "Rollerimiz ve Sorumluluklarımız", "Ailemizde, okulumuzda ve çevremizde üstlendiğimiz her rol, beraberinde yerine getirmemiz gereken sorumluluklar getirir.", "explicit", "human", "verified", V("me", 5)),
    TM("t14", "D3", 184, "Etkinlik 5.5 · Tasarruf Yapıyorum", "Evinizde bir hafta boyunca su ve elektrik tüketimini azaltmak için uygulayabileceğiniz üç öneri belirleyiniz.", "implicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Kaynakların özenle kullanılmasına yönelik davranış istenmektedir.", confidence: 0.78 })),
    TM("t15", "D3", 219, "Hak ve Sorumluluklar", "Haklarını bilen ve sorumluluklarını yerine getiren vatandaşlar, demokrasinin güçlenmesine katkı sağlar.", "explicit", "YAZDİS", "candidate", { rationale: "Sorumluluk kavramı doğrudan anılmaktadır.", confidence: 0.84 }),
    TM("t16", "D3", 248, "Etkinlik 7.4 · İklim İçin Harekete Geç", "Okulunuzda iklim değişikliğiyle mücadele için yapılabilecek bir proje tasarlayınız ve görev dağılımı yapınız.", "implicit", "human", "verified", V("me", 7)),
    TM("t17", "D4", 13, "Farklılıklarla Birlikte Yaşam", "Farklılıklara saygı, birlikte yaşamanın temel koşuludur.", "explicit", "human", "verified", V("me", 5)),
    TM("t18", "D4", 66, "Kültürel Mirasa Saygı", "Tarihî eserlere zarar vermemek, geçmiş kuşakların emeğine duyduğumuz saygının bir göstergesidir.", "explicit", "YAZDİS", "candidate", { rationale: "Saygı değeri kültürel miras bağlamında doğrudan anılmaktadır.", confidence: 0.79 }),
    TM("t19", "D4", 240, "Farklı Kültürler", "Farklı kültürlerden insanların gelenek ve inançlarına anlayışla yaklaşmak, barış içinde bir dünyanın temelidir.", "implicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Farklı kültürlere anlayışla yaklaşma, saygı değerinin örtük göstergesidir.", confidence: 0.74 })),
    TM("t20", "D5", 74, "Ünite Değerlendirme", "Kültürel mirasımızı korumak ve gelecek kuşaklara aktarmak, vatanımıza karşı en önemli görevlerimizdendir.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 6), { rationale: "Vatana karşı görev ifadesi doğrudan yer almaktadır.", confidence: 0.83 })),
    TM("t21", "D5", 193, "Millî Egemenlik", "Millî egemenlik, Türk milletinin bağımsızlık mücadelesinin en değerli kazanımlarından biridir.", "explicit", "human", "verified", V("me", 7)),
    TM("t22", "D5", 231, "Türkiye'nin Konumu", "Türkiye, Asya ile Avrupa arasında köprü konumunda bulunması nedeniyle tarih boyunca önemli bir kavşak noktası olmuştur.", "implicit", "YAZDİS", "candidate", { rationale: "Ülkenin konumunun önemine vurgu, vatanseverlik değeriyle zayıf biçimde ilişkilendirilebilir.", confidence: 0.41 }),
    TM("t23", "D6", 64, "Ahilik ve Dayanışma", "Ahiler, kazançlarının bir bölümünü yoksullara ve yolda kalmışlara ayırarak toplumsal dayanışmayı güçlendirmiştir.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 6), { rationale: "Yardımlaşma davranışı açık biçimde anlatılmaktadır.", confidence: 0.88 })),
    TM("t24", "D6", 258, "İnsani Yardım", "Türkiye'nin insani yardım faaliyetleri, dünyanın farklı bölgelerindeki ihtiyaç sahiplerine ulaşmaktadır.", "explicit", "YAZDİS", "candidate", { rationale: "Yardım kavramı doğrudan anılmaktadır.", confidence: 0.88 }),
    TM("t25", "D6", 222, "Gönüllülük", "Gönüllü çalışmalar, toplumsal sorunların çözümünde bireylerin katkısını artırır.", "implicit", "YAZDİS", "insufficient", Object.assign(V("me", 7), { rationale: "Gönüllülük, yardımseverlik değerinin örtük göstergesi olabilir.", confidence: 0.57, note: "Genel bir ifade; öğrenciye yönelik bir davranış veya örnek içermiyor." })),
    TM("t26", "E1", 20, "Etkinlik 1.3 · Merak Ettiklerim", "Medyada gördüğünüz ve merak ettiğiniz bir konuyu seçiniz.", "explicit", "human", "verified", V("me", 5)),
    TM("t27", "E1", 100, "Etkinlik 3.2 · Haritada Keşif", "Bu yerler hakkında merak ettiklerinizi soru hâline getirerek araştırınız.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Öğrencinin merak ettiklerini soru hâline getirmesi istenmektedir.", confidence: 0.87 })),
    TM("t28", "E1", 163, "Etkinlik 5.2 · Bir Ürünün Yolculuğu", "Sofranızdaki bir ürünün tarladan sofraya nasıl ulaştığını merak ediyor musunuz?", "explicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Merak duygusu doğrudan uyarılmaktadır.", confidence: 0.85 })),
    TM("t29", "E1", 233, "Etkinlik 7.1 · Dünyayı Tanıyalım", "Görmek istediğiniz bir ülkeyi seçiniz ve o ülkenin kültürü hakkında merak ettiğiniz soruları listeleyiniz.", "explicit", "human", "verified", V("me", 7)),
    TM("t30", "E1", 70, "Etkinlik 2.6 · Kültür Dedektifi", "Yaşadığınız yerdeki bir geleneğin nereden geldiğini araştırınız.", "implicit", "YAZDİS", "candidate", { rationale: "Bir geleneğin kökenini araştırma, merak eğilimini örtük olarak destekler.", confidence: 0.58 }),
    TM("t31", "E2", 96, "Tartışma Etkinliği · Haritalar Yanıltır mı?", "Farklı projeksiyonlarla çizilmiş iki dünya haritasını karşılaştırınız.", "explicit", "YAZDİS", "candidate", { rationale: "Kaynakların karşılaştırılması ve gerekçelendirme istenmektedir.", confidence: 0.74 }),
    TM("t32", "E2", 125, "Bilginlerin Yöntemleri", "Bilim insanları, ulaştıkları sonuçları sorgulayarak ve yeniden deneyerek bilgiyi geliştirir.", "explicit", "YAZDİS", "verified", Object.assign(V("me", 7), { rationale: "Sorgulama kavramı doğrudan anılmaktadır.", confidence: 0.9 })),
    TM("t33", "E2", 37, "Etkinlik 1.6 · Haberi Sorgula", "Bir haberin başlığı ile içeriği arasındaki farkları sorgulayınız.", "explicit", "human", "verified", V("me", 5)),
    TM("t34", "E3", 29, "Etkinlik 1.5 · Kendimi Onun Yerine Koyuyorum", "Yeni bir okula başlayan bir arkadaşınızın neler hissedebileceğini düşünerek ona bir mektup yazınız.", "explicit", "human", "verified", V("me", 5)),
    TM("t35", "E3", 215, "Örnek Olay · Engelsiz Okul", "Okulunuzda tekerlekli sandalye kullanan bir öğrencinin karşılaşabileceği zorlukları düşününüz.", "implicit", "YAZDİS", "candidate", { rationale: "Başkasının yaşadığı zorlukları düşünme, empati eğilimini destekler.", confidence: 0.71 }),
    TM("t36", "E4", 40, "Etkinlik 1.7 · Kendimi İfade Ediyorum", "Sınıf arkadaşlarınızın önünde, ilgi duyduğunuz bir konuyu iki dakikalık bir sunumla anlatınız.", "implicit", "YAZDİS", "candidate", { rationale: "Topluluk önünde konuşma, özgüven eğilimini örtük olarak destekler.", confidence: 0.63 }),
    TM("t37", "E4", 205, "Etkinlik 6.3 · Sivil Toplumda Ben", "Bir sivil toplum kuruluşunda görev alsaydınız hangi sorumluluğu üstlenmek isterdiniz?", "implicit", "YAZDİS", "insufficient", Object.assign(V("me", 7), { rationale: "Kendini bir rolde düşünme, özgüven eğilimiyle ilişkilendirilebilir.", confidence: 0.52, note: "Özgüvenle ilişkisi zayıf; daha çok sorumluluk değerine yönelik." })),
  ];

  const REVIEWED = [];
  for (let n = 1; n <= 41; n++) REVIEWED.push(n);
  REVIEWED.push(43);
  for (let n = 46; n <= 127; n++) REVIEWED.push(n);

  window.APP_DATA = {
    DOC_ID, BOOK, REVIEWERS, PHASES, DEADLINE, CRITERIA, SUBS, subLabel, TYMM_MAIN, TYMM_SUB, suggestCriteria, REJECT_REASONS,
    UNITS, CONTENT_UNITS, unitOf, sectionOf, PAGES, pageText, blockText,
    MEDIA, ATTACHMENTS, NOTIFICATIONS, TYMM_COMPONENTS,
    BOOKS, OUTCOMES, CODE_GLOSSARY, seedPublisher, rangeLabel,
    seed: () => JSON.parse(JSON.stringify({ findings: FINDINGS, yazdis: YAZDIS, yazdisDecisions: YAZDIS_DECISIONS, others: OTHERS, tymm: TYMM, reviewed: REVIEWED })),
  };
})();
