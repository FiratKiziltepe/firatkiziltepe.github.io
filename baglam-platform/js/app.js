/* Bağlam — prototip uygulaması. Veritabanı yok; durum bellekte ve tarayıcının yerel deposunda tutulur. */
(() => {
  'use strict';
  const D = window.DATA, M = window.Models;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- İkonlar ---------- */
  const IC = {
    play: '<polygon points="7 4 20 12 7 20 7 4"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    sag: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    sol: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    ev: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    katman: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    kalp: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    cikis: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    tam: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    yukari: '<polyline points="18 15 12 9 6 15"/>',
    asagi: '<polyline points="6 9 12 15 18 9"/>',
    tut: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    duzenle: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    liste: '<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    bilgi: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    hedef: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    ampul: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    arti: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    yildiz: '<polygon points="12 2 14.9 8.6 22 9.3 16.6 14 18.2 21 12 17.3 5.8 21 7.4 14 2 9.3 9.1 8.6 12 2"/>',
    indir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    ekran: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    ayar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
  const obj = (ad, donus = 0) => { const src = M.icon(ad, donus); return src ? `<img class="obj" src="${src}" alt="">` : '<span class="obj obj-yok"></span>'; };

  /* ---------- Yardımcılar ---------- */
  const acikMi = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) > 170; };
  const koyu = (hex, f = 0.8) => { const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join(''); };
  const stil = m => `--m:${m.renk};--mk:${m.koyu || koyu(m.renk)}`;
  const ac = r => acikMi(r.renk) ? ' acik' : '';
  const sn = t => { const [d, s] = t.split(':').map(Number); return d * 60 + s; };
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const sureTop = m => Math.round(m.videolar.reduce((t, v) => t + sn(v.sure), 0) / 60) + ' dk';
  const sayi = v => v.toLocaleString('tr-TR');
  const kelime = s => (s.trim().match(/\S+/g) || []).length;
  const modul = id => D.moduller.find(m => m.id === id);
  const noktalar = p => `<span class="nokta5" role="img" aria-label="5 üzerinden ${p}">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= p ? 'd' : ''}"></i>`).join('')}</span>`;
  function karistir(arr, tohum) {
    let h = 0; for (const ch of tohum) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    if (a.every((x, i) => x === arr[i])) a.reverse();
    return a;
  }

  /* ---------- Durum ---------- */
  const ANAHTAR = 'baglam-prototip-v1';
  const YONTEM_ANAHTAR = 'baglam-ilgi-yontemi';
  const ZENGIN_ANAHTAR = 'baglam-zengin-ilgi-v1';
  const HERO_ANAHTAR = 'baglam-hero-surum';
  const ORNEK_MOD_ANAHTAR = 'baglam-ornek-mod';
  const GOREV_MOD_ANAHTAR = 'baglam-gorev-mod';
  const URETIM_ANAHTAR = 'baglam-uretim-ayar';
  const VARSAYILAN_MODELLER = {
    claude: [
      ['claude-sonnet-4-5', 'Claude Sonnet 4.5 (Varsayılan)'],
      ['claude-opus-4-1', 'Claude Opus 4.1'],
      ['claude-haiku-4-5', 'Claude Haiku 4.5'],
    ],
    geminiText: [
      ['gemini-2.5-pro', 'Gemini 2.5 Pro (Varsayılan)'],
      ['gemini-2.5-flash', 'Gemini 2.5 Flash'],
    ],
    geminiImage: [
      ['imagen-3.0-generate-002', 'Gemini Imagen 3'],
      ['gemini-2.5-flash-image', 'Gemini 2.5 Flash Image'],
    ],
    tts: [
      ['gemini-2.5-flash-preview-tts', 'Gemini 2.5 Flash TTS (Gemini Key · Türkçe)'],
      ['gemini-2.5-pro-preview-tts', 'Gemini 2.5 Pro TTS (Gemini Key · Yüksek kalite)'],
      ['tr-TR-Wavenet-E', 'Google Cloud TTS · tr-TR-Wavenet-E'],
      ['tr-TR-Chirp3-HD-Aoede', 'Google Cloud TTS · tr-TR-Chirp3-HD-Aoede'],
      ['tr-TR-Standard-A', 'Google Cloud TTS · tr-TR-Standard-A'],
    ],
  };
  const varsayilanUretim = () => ({
    claudeKey: '',
    geminiKey: '',
    ttsKey: '',
    senaryoModel: 'claude-sonnet-4-5',
    scriptModel: 'claude-sonnet-4-5',
    promptModel: 'gemini-2.5-pro',
    gorselModel: 'imagen-3.0-generate-002',
    sesModel: 'gemini-2.5-flash-preview-tts',
    sesHiz: '1.0',
    onDenetimAcik: true,
    maxRevizyon: 2,
    gecmeEsigi: '0.85',
    denetimModel: 'claude-sonnet-4-5',
    akademisyenAd: 'Doç. Dr. Akademik Danışman',
    modeller: { claude: null, geminiText: null, geminiImage: null, tts: null },
  });
  const bos = () => ({ kul: null, secilen: [], altSec: {}, ozel: {}, puan: {}, detay: {}, ilerleme: {}, baglamSec: {}, cevap: {} });
  const bosZengin = () => ({ secilen: [], altSec: {}, ozel: {}, puan: {}, detay: {}, etkinlik: {}, ozelEtkinlik: {} });
  let S = (() => { try { const x = JSON.parse(localStorage.getItem(ANAHTAR)); if (x && typeof x === 'object') return { ...bos(), ...x }; } catch (e) { /* depo yok */ } return bos(); })();
  let SZ = (() => { try { const x = JSON.parse(localStorage.getItem(ZENGIN_ANAHTAR)); if (x && typeof x === 'object') return { ...bosZengin(), ...x }; } catch (e) { /* depo yok */ } return bosZengin(); })();
  const kaydet = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(S)); localStorage.setItem(ZENGIN_ANAHTAR, JSON.stringify(SZ)); } catch (e) { /* depo yok */ } };
  const UI = {
    aktif: null,
    zenginAktif: null,
    ornekAcik: {},
    gs: {},
    drag: null,
    video: null,
    slaytPlayer: null,
    gorevPlayer: null,
    sablonPlayer: null,
    canliKSlayt: null,
    canliKGorev: null,
    canliDSlayt: null,
    canliDGorev: null,
    canliModul: 'm2',
    canliProfil: 'o1',
    canliOzelKategori: 'Spor',
    canliOzelAlt: 'Tenis',
    canliOzelAciklama: 'Haftada 3 gün tenis antrenmanı yapıyorum, servis hızımı ve ilk servis isabet oranımı takip ediyorum.',
    canliKontrolGorunum: 'slayt',
    canliDeneyGorunum: 'slayt',
    canliBakModu: 'arastirmaci', // 'arastirmaci' | 'ogrenci'
    canliDenetimSekme: 'rubrik', // 'rubrik' | 'turlar' | 'iz' | 'akademisyen'
    canliSeciliTur: 0,
    canliAcikIz: {},
    canliAkademisyenNot: '',
    canliTumUretiler: [],
    canliSonuc: null,
    canliAdimlar: {},
    canliCalisiyor: false,
    canliHata: null,
    canliDetayAcik: false,
    juriProf: 0,
    juriEvrenProf: 0,
    juriSlaytProf: 1,
    juriGorevProf: 1,
    juriCozum: {},
    keyGorunur: {},
    modelYukleniyor: false,
    modelBilgi: null,
    yontem: (() => { try { return localStorage.getItem(YONTEM_ANAHTAR) === 'zengin' ? 'zengin' : 'standart'; } catch (e) { return 'standart'; } })(),
    hero: (() => {
      try {
        const q = new URLSearchParams(location.search).get('v');
        if (q === '3') return 'v3';
        if (q === '2') return 'v2';
        if (q === '1') return 'v1';
        const saved = localStorage.getItem(HERO_ANAHTAR);
        return (saved === 'v2' || saved === 'v3') ? saved : 'v1';
      } catch (e) { return 'v1'; }
    })(),
    ornekMod: (() => { try { return localStorage.getItem(ORNEK_MOD_ANAHTAR) === 'slayt' ? 'slayt' : 'metin'; } catch (e) { return 'metin'; } })(),
    gorevMod: (() => { try { return localStorage.getItem(GOREV_MOD_ANAHTAR) === 'etkilesimli' ? 'etkilesimli' : 'klasik'; } catch (e) { return 'klasik'; } })(),
    uretim: (() => { try { const x = JSON.parse(localStorage.getItem(URETIM_ANAHTAR)); return x && typeof x === 'object' ? { ...varsayilanUretim(), ...x } : varsayilanUretim(); } catch (e) { return varsayilanUretim(); } })(),
    notlar: (() => { try { return localStorage.getItem('baglam-notlar') === '1'; } catch (e) { return false; } })(),
  };
  const kaydetUretim = () => { try { localStorage.setItem(URETIM_ANAHTAR, JSON.stringify(UI.uretim)); } catch (e) { /* depo yok */ } };
  const heroMod = () => (UI.hero === 'v3' && window.ResearchJourneyV3) ? window.ResearchJourneyV3 : (UI.hero === 'v2' && window.ResearchJourneyV2) ? window.ResearchJourneyV2 : window.ResearchJourney;
  const zenginMi = () => UI.yontem === 'zengin';
  const ilgiListesi = () => zenginMi() ? D.zenginIlgiler : D.ilgiler;
  const ilgi = id => ilgiListesi().find(k => k.id === id);
  const P = () => zenginMi() ? SZ : S;
  const OZEL_SORU = 'Bu alanda en çok neyle ilgileniyorsun?';
  const ZENGIN_OZEL_SORU = 'Bu alanda özellikle ilgilendiğin konular, kişiler, eserler veya örnekler hangileri?';
  const OZEL_ORNEK = { spor: 'Bisiklet', muzik: 'Caz', oyun: 'Bulmaca oyunları', sinema: 'Kore dizileri', teknoloji: 'Drone', seyahat: 'Bisiklet turları', yemek: 'Vegan mutfak', doga: 'Akvaryum' };
  const altlarOf = k => {
    const p = P();
    return [...k.altlar, ...(p.ozel[k.id] || []).map(o => ({
      ...o,
      soru: zenginMi() ? ZENGIN_OZEL_SORU : OZEL_SORU,
      yer: zenginMi() ? `Örn. ${o.ad} ile ilgili sevdiğin örnekler, takımlar veya araçlar` : 'İstersen birkaç kelimeyle anlat',
      etkinlikler: k.ozelEtkinlikler || [],
      ozel: true,
    }))];
  };
  const seciliMi = a => !!(a.ozel || P().altSec[a.id]);
  const seciliAltlar = k => altlarOf(k).filter(seciliMi);

  function ornekProfil() {
    S.kul = S.kul || { ad: 'Deniz Aydın' };
    if (!S.secilen.length) {
      S.secilen = ['spor', 'muzik', 'oyun'];
      S.altSec = { 'spor.futbol': true, 'spor.fitness': true, 'muzik.rock': true, 'muzik.enstruman': true, 'oyun.strateji': true, 'oyun.rpg': true };
      S.ozel = { spor: [{ id: 'spor.ozel1', ad: 'Bisiklet' }] };
      S.puan = { 'spor.futbol': 5, 'spor.fitness': 4, 'spor.ozel1': 3, 'muzik.rock': 5, 'muzik.enstruman': 3, 'oyun.strateji': 4, 'oyun.rpg': 4 };
      S.detay = { 'spor.futbol': 'Trabzonspor, maçları kaçırmam', 'spor.fitness': 'Haftada üç gün sahilde koşuyorum', 'spor.ozel1': 'Hafta sonu sahil yolunda sürüyorum', 'muzik.rock': 'Duman ve Arctic Monkeys', 'muzik.enstruman': 'Gitar öğreniyorum', 'oyun.strateji': 'Age of Empires II', 'oyun.rpg': 'The Witcher 3' };
    }
    if (!SZ.secilen.length) {
      SZ.secilen = ['spor', 'muzik', 'oyun'];
      SZ.altSec = { 'spor.voleybol': true, 'spor.bisiklet': true, 'muzik.alternatif': true, 'muzik.filmmuzikleri': true, 'oyun.aksiyon': true };
      SZ.ozel = {};
      SZ.puan = { 'spor.voleybol': 5, 'spor.bisiklet': 4, 'muzik.alternatif': 5, 'muzik.filmmuzikleri': 4, 'oyun.aksiyon': 5 };
      SZ.etkinlik = {
        'spor.voleybol': ['Voleybol oynamak', 'Maç izlemek'],
        'spor.bisiklet': ['Bisiklet sürmek', 'Yeni rotalar keşfetmek'],
        'muzik.alternatif': ['Alternatif müzik dinlemek', 'Konserlere gitmek'],
        'muzik.filmmuzikleri': ['Film müzikleri dinlemek', 'Çalışırken müzik dinlemek'],
        'oyun.aksiyon': ['Görevleri tamamlamak'],
      };
      SZ.ozelEtkinlik = {};
      SZ.detay = { 'spor.voleybol': 'Filenin Sultanları, Sultanlar Ligi', 'spor.bisiklet': 'Sahil rotası, yol bisikleti', 'muzik.alternatif': 'Duman, Arctic Monkeys', 'muzik.filmmuzikleri': 'Hans Zimmer, Interstellar', 'oyun.aksiyon': 'GTA' };
    }
    S.baglamSec = {};
    if (!Object.keys(S.ilerleme || {}).length) {
      S.ilerleme = {
        m1: { v: [true, true, true], ornek: true, gorev: true, duygu: { 0: 4, 1: 3, 2: 4, 3: 2, 4: 1, 5: 1, 6: 2 }, ilgi: { 0: 4, 1: 4, 2: 5, 3: 4, 4: 4, 5: 2 }, duyguOk: true, ilgiOk: true },
        m2: { v: [true, true, false], ornek: false, gorev: false, duygu: {}, ilgi: {}, duyguOk: false, ilgiOk: false },
      };
    }
  }
  const il = mid => (S.ilerleme[mid] = S.ilerleme[mid] || { v: [false, false, false], ornek: false, gorev: false, duygu: {}, ilgi: {}, duyguOk: false, ilgiOk: false });
  function adimlar(m) {
    const p = il(m.id);
    return [
      ...m.videolar.map((v, i) => ({ k: 'v' + (i + 1), ad: v.ad, ek: v.sure, t: !!p.v[i], grup: 'Konu anlatımı' })),
      { k: 'ornek', ad: 'Örnek uygulama', ek: '3 adım', t: !!p.ornek, grup: 'Uygulama' },
      { k: 'gorev', ad: 'Mikro görev', t: !!p.gorev, grup: 'Uygulama' },
      { k: 'duygu', ad: 'Neler hissettin?', ek: `${D.duygular.length} soru`, t: !!p.duyguOk, grup: 'Modül sonu' },
      { k: 'ilgi', ad: 'Modülü değerlendir', ek: `${D.ilgiMaddeleri.length} soru`, t: !!p.ilgiOk, grup: 'Modül sonu' },
    ];
  }
  const ADIM = 7;
  const tamamSay = m => adimlar(m).filter(a => a.t).length;
  const siradaki = m => (adimlar(m).find(a => !a.t) || {}).k || null;
  const genelSiradaki = () => { for (const m of D.moduller) { const k = siradaki(m); if (k) return { m, k }; } return null; };
  const sonrakiAdim = (m, k) => { const l = adimlar(m).map(a => a.k), i = l.indexOf(k); return i < l.length - 1 ? l[i + 1] : 'son'; };
  const adimAdi = (m, k) => k === 'son' ? 'Modül sonu' : adimlar(m).find(a => a.k === k).ad;

  /* Bağlam seçimi: öğrencinin seçip puanladığı alt alanlar puana göre sıralanır.
     En az 3 puan alanlar, farklı ilgi alanlarına öncelik verilerek modüllere sırayla dağıtılır.
     Eşit puanda hazır senaryosu olan alt alan, öğrencinin eklediğinin önüne geçer. */
  function siraliAltlar() {
    const l = [], p = P();
    p.secilen.map(ilgi).filter(Boolean).forEach((k, ki) => seciliAltlar(k).forEach((a, ai) => l.push({ k, a, p: p.puan[a.id] || 0, sira: ki * 20 + ai })));
    return l.sort((x, y) => y.p - x.p || (x.a.ozel ? 1 : 0) - (y.a.ozel ? 1 : 0) || x.sira - y.sira);
  }
  function baglamHavuzu() {
    const l = siraliAltlar(), aday = l.filter(x => x.p >= 3), taban = aday.length ? aday : l;
    const once = [], sonra = [], gorulen = new Set();
    taban.forEach(x => { if (gorulen.has(x.k.id)) sonra.push(x); else { gorulen.add(x.k.id); once.push(x); } });
    return [...once, ...sonra];
  }
  const altDetayMetni = id => {
    const p = P(), d = (p.detay[id] || '').trim();
    if (!zenginMi()) return d;
    const etk = (p.etkinlik && p.etkinlik[id]) || [];
    return [etk.join(', '), d].filter(Boolean).join(' · ');
  };
  const paket = (k, a, p, neden) => ({ ilgi: k, alt: a, p, neden, c: D.baglam[a.id] || D.baglam[k.id] || D.baglam.spor, duzey: D.baglam[a.id] ? 'alt' : 'kategori', detay: altDetayMetni(a.id) });
  function baglamAl(m) {
    const l = siraliAltlar();
    if (!l.length) { const k = ilgiListesi()[0]; return paket(k, k.altlar[0], 0, 'varsayilan'); }
    const secim = S.baglamSec[m.id] && l.find(x => x.a.id === S.baglamSec[m.id]);
    if (secim) return paket(secim.k, secim.a, secim.p, 'secim');
    const h = baglamHavuzu(), x = h[D.moduller.indexOf(m) % Math.min(4, h.length)];
    return paket(x.k, x.a, x.p, 'otomatik');
  }

  /* ---------- Ortak parçalar ---------- */
  const logo = (href = '#acilis') => `<a class="logo" href="${href}"><i></i>Bağlam</a>`;
  function mkKart(m, ilerlemeli) {
    const i = D.moduller.indexOf(m), t = tamamSay(m), tag = ilerlemeli ? 'a' : 'div';
    return `<${tag} class="mk" ${ilerlemeli ? `href="#modul-${m.id}"` : ''} style="${stil(m)}">
      <div class="kapak mk-kapak${ac(m)}"><span>Modül ${i + 1}</span>${obj(m.obj)}</div>
      <div class="mk-govde"><h3>${m.ad}</h3>
        <ul class="mk-liste">${m.videolar.map(v => `<li>${ic('play')}<span>${v.ad}</span><time>${v.sure}</time></li>`).join('')}
          <li class="ek ayrac">${ic('ampul')}<span>Örnek uygulama</span></li>
          <li class="ek">${ic('hedef')}<span>Mikro görev</span></li></ul>
        ${ilerlemeli ? `<div class="mk-il"><div class="cubuk"><i style="width:${t / ADIM * 100}%"></i></div><div><span>${t === ADIM ? 'Tamamlandı' : t ? 'Devam ediyor' : 'Başlanmadı'}</span><b>${t}/${ADIM}</b></div></div>` : ''}
      </div></${tag}>`;
  }

  /* ---------- Açılış ---------- */
  function sAcilis() {
    const cls = (UI.hero === 'v3' && window.ResearchJourneyV3) ? 'lp-v3' : (UI.hero === 'v2' && window.ResearchJourneyV2) ? 'lp-v2' : 'lp-v1';
    return `<div class="lp ${cls}">
      <header class="wrap lp-nav">${logo()}
        <nav><button data-act="kaydir" data-hedef="nasil">Nasıl çalışır</button><button data-act="kaydir" data-hedef="lp-moduller">Modüller</button></nav>
        <div class="lp-nav-btn"><a class="btn ghost" href="#giris">Giriş yap</a><a class="btn" href="#kayit">Kayıt ol</a></div></header>
      ${heroMod().render()}
      <section class="lp-sec" id="nasil"><div class="wrap">
        <div class="sec-bas"><h2>Gözlemle, araştır, anlamlandır</h2><p>Günlük bir sorudan bilimsel bir açıklamaya, adım adım ilerle.</p></div>
        <div class="nasil">
          <div>${obj('buyutec', 0.4)}<b>1</b><h3>Bir problemle başla</h3><p>Günlük hayattan bir gözlemi açık ve araştırılabilir bir soruya dönüştür.</p></div>
          <div>${obj('pano', -0.2)}<b>2</b><h3>Konuyu videolarla öğren</h3><p>Her modülde konu, birkaç kısa anlatım videosuna bölünmüştür.</p></div>
          <div>${obj('ampul', 0.3)}<b>3</b><h3>Öğrendiklerini uygula</h3><p>Örnek uygulamalar ve mikro görevlerle araştırma adımlarını deneyimle.</p></div>
        </div></div></section>
      <section class="lp-sec lp-gri" id="lp-moduller"><div class="wrap">
        <div class="sec-bas"><h2>Altı modül, on sekiz video</h2><p>Her modül konu anlatım videolarıyla başlar, ardından örnek uygulama ve mikro görevle devam eder.</p></div>
        <div class="mod-izgara">${D.moduller.map(m => mkKart(m, false)).join('')}</div></div></section>
      <section class="lp-sec"><div class="wrap"><div class="cta">
        <div><h2>İlk sorudan ilk araştırmana</h2><p>Araştırma yöntemlerini keşfet, veriye dayalı düşünmeye ilk adımı at.</p><a class="btn lg beyaz" href="#kayit">Kayıt ol ${ic('sag')}</a></div>
        <div class="cta-obj">${obj('buyutec', 0.3)}${obj('pano', -0.3)}${obj('grafik', 0.4)}</div></div></div></section>
      <footer class="wrap lp-alt"><span>© 2026 Bağlam</span><span>Prototip sürüm</span></footer>
    </div>`;
  }

  /* ---------- Giriş / kayıt ---------- */
  function sAuth(tur) {
    const k = tur === 'kayit';
    return `<div class="auth"><div class="auth-form">${logo()}
      <form id="authForm" data-tur="${tur}" novalidate>
        <h1>${k ? 'Hesap oluştur' : 'Tekrar hoş geldin'}</h1>
        <p>${k ? 'Ardından ilgi alanlarını seçeceksin.' : 'Kaldığın modülden devam et.'}</p>
        ${k ? '<div class="alan"><label for="fAd">Ad soyad</label><input id="fAd" autocomplete="name" placeholder="Deniz Aydın"></div>' : ''}
        <div class="alan"><label for="fEposta">E-posta</label><input id="fEposta" type="email" autocomplete="email" placeholder="ornek@universite.edu.tr"></div>
        <div class="alan"><label for="fSifre">Şifre</label><input id="fSifre" type="password" autocomplete="${k ? 'new-password' : 'current-password'}" placeholder="${k ? 'En az 8 karakter' : ''}"></div>
        <button class="btn lg tam" type="submit">${k ? 'Kayıt ol' : 'Giriş yap'}</button>
        <p class="auth-alt">${k ? 'Hesabın var mı? <a href="#giris">Giriş yap</a>' : 'Hesabın yok mu? <a href="#kayit">Kayıt ol</a>'}</p>
      </form></div>
      <aside class="auth-yan">
        <div class="auth-objs">${['top', 'kulaklik', 'gamepad', 'donut'].map((o, i) => obj(o, i * 0.35 - 0.3)).join('')}</div>
        <h2>Futbol seven için örnekler maçtan, oyuncu için sıralama tablosundan gelir.</h2>
        <p>Seçtiğin ilgi alanları, her modüldeki örnek uygulamanın ve mikro görevin konusunu belirler.</p>
      </aside></div>`;
  }

  /* ---------- İlgi alanları ---------- */
  const kurUst = adim => `<header class="wrap kur-ust">${logo()}<ol class="adimlar">
      <li class="${adim === 1 ? 'on' : 'bitti'}">${adim > 1 ? ic('check') : ''}İlgi alanları</li><li class="${adim === 2 ? 'on' : ''}">Alt alanlar</li></ol></header>`;
  const secimMetni = () => { const n = P().secilen.length; return n ? `${n} alan seçildi` : 'En az bir alan seç'; };
  function sIlgi() {
    const p = P(), liste = ilgiListesi(), z = zenginMi();
    return `<div class="kur">${kurUst(1)}<main class="wrap kur-govde">
      <h1>Nelerle ilgileniyorsun?</h1><p>Sana yakın gelen alanları seç. Örnekler ve görevler bu alanlardan kurulacak.</p>
      <div class="ilgi-izgara${z ? ' ilgi-izgara-12' : ''}">${liste.map(k => { const on = p.secilen.includes(k.id); return `<button class="ik${on ? ' on' : ''}" data-act="ilgiSec" data-id="${k.id}" aria-pressed="${on}"><span class="ik-tik">${ic('check')}</span>${obj(k.obj)}<b>${k.ad}</b><small>${k.alt}</small></button>`; }).join('')}</div>
      </main>
      <div class="kur-alt"><div class="wrap"><span id="ilgiSay">${secimMetni()}</span><div class="sag-grup"><a class="btn lg" id="ilgiDevam" href="#alt-ilgi"${p.secilen.length ? '' : ' hidden'}>Devam ${ic('sag')}</a><button class="btn lg" disabled${p.secilen.length ? ' hidden' : ''} id="ilgiPasif">Devam ${ic('sag')}</button></div></div></div></div>`;
  }
  function altSatirStandart(a) {
    const on = seciliMi(a), p = S.puan[a.id] || 0, fid = 'd-' + a.id.replace(/\W/g, '-');
    const bas = a.ozel
      ? `<div class="as-bas as-ozel"><span class="as-kutu">${ic('check')}</span><b class="as-ad">${esc(a.ad)}</b><button class="as-sil" data-act="ozelSil" data-id="${a.id}" aria-label="${esc(a.ad)} alanını kaldır" title="Kaldır">${ic('x')}</button></div>`
      : `<button class="as-sec" data-act="altSec" data-id="${a.id}" aria-pressed="${on}"><span class="as-kutu">${ic('check')}</span><b>${a.ad}</b></button>`;
    return `<div class="as${on ? ' on' : ''}">${bas}
      ${on ? `<div class="as-ic">
        <div class="as-puan"><span class="et" id="pl-${fid}">Ne kadar ilgini çekiyor?</span>
          <div class="puan" role="radiogroup" aria-labelledby="pl-${fid}">${[1, 2, 3, 4, 5].map(n => `<button role="radio" aria-checked="${n === p}" class="${n <= p ? 'dolu' : ''}${n === p ? ' on' : ''}" data-act="puan" data-alt="${a.id}" data-n="${n}" aria-label="${n}">${n}</button>`).join('')}</div>
          <div class="puan-uc"><span>Biraz</span><span>Çok</span></div></div>
        <div class="as-detay"><label for="${fid}">${esc(a.soru)}</label><input class="girdi" id="${fid}" data-detay="${a.id}" value="${esc(S.detay[a.id] || '')}" placeholder="İstersen birkaç kelimeyle anlat" autocomplete="off"></div>
      </div>` : ''}</div>`;
  }
  function altSatirZengin(a) {
    const on = seciliMi(a), p = SZ.puan[a.id] || 0, fid = 'dz-' + a.id.replace(/\W/g, '-');
    const seciliEtkinlik = (SZ.etkinlik && SZ.etkinlik[a.id]) || [];
    const ozelEtkinlikler = (SZ.ozelEtkinlik && SZ.ozelEtkinlik[a.id]) || [];
    const tumEtkinlikler = [...(a.etkinlikler || []), ...ozelEtkinlikler.filter(x => !(a.etkinlikler || []).includes(x))];
    const bas = a.ozel
      ? `<div class="as-bas as-ozel as-zengin-bas"><span class="as-kutu as-daire">${ic('check')}</span><b class="as-ad">${esc(a.ad)}</b><button class="as-sil" data-act="ozelSil" data-id="${a.id}" aria-label="${esc(a.ad)} alanını kaldır" title="Kaldır">${ic('x')}</button></div>`
      : `<button class="as-sec as-zengin-sec" data-act="altSec" data-id="${a.id}" aria-pressed="${on}"><span class="as-kutu as-daire">${ic('check')}</span><b>${a.ad}</b></button>`;
    return `<div class="as as-zengin${on ? ' on' : ''}">${bas}
      ${on ? `<div class="as-ic as-zengin-ic">
        <div class="as-puan"><span class="et" id="pl-${fid}">Ne kadar ilgini çekiyor?</span>
          <div class="puan" role="radiogroup" aria-labelledby="pl-${fid}">${[1, 2, 3, 4, 5].map(n => `<button role="radio" aria-checked="${n === p}" class="${n <= p ? 'dolu' : ''}${n === p ? ' on' : ''}" data-act="puan" data-alt="${a.id}" data-n="${n}" aria-label="${n}">${n}</button>`).join('')}</div>
          <div class="puan-uc"><span>Çok düşük</span><span>Çok yüksek</span></div></div>
        <div class="as-etkinlik">
          <span class="et as-soru-baslik">Bu alanda neler yapmaktan hoşlanıyorsun?</span>
          <div class="etkinlik-etiketler" role="group" aria-label="Bu alanda neler yapmaktan hoşlanıyorsun?">
            ${tumEtkinlikler.map(etk => {
              const eOn = seciliEtkinlik.includes(etk);
              return `<button type="button" class="etk-cip${eOn ? ' on' : ''}" data-act="etkinlikSec" data-alt="${a.id}" data-etk="${esc(etk)}" aria-pressed="${eOn}">${eOn ? ic('check') : ''}<span>${esc(etk)}</span></button>`;
            }).join('')}
          </div>
          ${a.ozel ? `<div class="ozel-etk-ekle"><input class="girdi ozel-etk-girdi" id="oe-${fid}" data-ozel-etk-girdi="${a.id}" maxlength="48" placeholder="Kendi etkileşim biçimini yaz (isteğe bağlı)" autocomplete="off"><button type="button" class="btn ghost ozel-etk-btn" data-act="ozelEtkinlikEkle" data-alt="${a.id}">${ic('arti')}Ekle</button></div>` : ''}
        </div>
        <div class="as-detay as-zengin-detay">
          <label class="as-soru-baslik" for="${fid}">${esc(a.soru)}</label>
          <input class="girdi as-zengin-girdi" id="${fid}" data-detay="${a.id}" value="${esc(SZ.detay[a.id] || '')}" placeholder="${esc(a.yer || 'İstersen kendi ifadelerinle yaz')}" autocomplete="off">
          <small class="istege-bagli">İsteğe bağlı</small>
        </div>
      </div>` : ''}</div>`;
  }
  const altSatir = a => zenginMi() ? altSatirZengin(a) : altSatirStandart(a);
  function ozelEkle(k) {
    const p = P(), n = (p.ozel[k.id] || []).length;
    if (n >= 3) return '<p class="ozel-not">Bu alana ekleyebileceğin 3 alt alanın hepsini ekledin.</p>';
    const ornek = k.ozelOrnek || OZEL_ORNEK[k.id] || '';
    return `<form class="ozel-ekle" id="ozelForm" data-k="${k.id}" novalidate><label for="ozelAd">Listede yok mu? Kendi alt alanını ekle</label>
      <div><input class="girdi" id="ozelAd" maxlength="40" placeholder="Örneğin: ${esc(ornek)}" autocomplete="off"><button class="btn ghost" type="submit">${ic('arti')}Ekle</button></div>
      <small id="ozelBilgi">${n ? `${n}/3 eklendi` : 'En fazla 3 alt alan ekleyebilirsin.'}</small></form>`;
  }
  function sAlt() {
    const p = P(), z = zenginMi();
    const sec = p.secilen.map(ilgi).filter(Boolean);
    const aktifKey = z ? 'zenginAktif' : 'aktif';
    const aktif = sec.find(k => k.id === UI[aktifKey]) || sec[0]; UI[aktifKey] = aktif.id;
    const durum = k => { const s = seciliAltlar(k); return { n: s.length, eksik: s.filter(a => !p.puan[a.id]).length }; };
    const tamamMi = k => { const d = durum(k); return d.n > 0 && d.eksik === 0; };
    const topN = sec.reduce((t, k) => t + durum(k).n, 0), bekleyen = sec.reduce((t, k) => t + durum(k).eksik, 0);
    const bos = sec.filter(k => !durum(k).n).length;
    const siradaki = sec.find(k => k !== aktif && !tamamMi(k));
    const ozet = !topN ? 'Her ilgi alanından en az bir alt alan seç'
      : [`${topN} alt alan seçildi`, bekleyen ? `${bekleyen} puan bekliyor` : '', bos ? `${bos} alanda seçim yok` : ''].filter(Boolean).join(' · ');
    return `<div class="kur">${kurUst(2)}<main class="wrap kur-govde"><div class="alt-duzen">
      <aside class="alt-yan">${sec.map(k => { const d = durum(k); const yanAd = z && k.kisaAd ? k.kisaAd : k.ad; return `<button class="ay${k === aktif ? ' on' : ''}" data-act="altAktif" data-id="${k.id}">${obj(k.obj)}<span><b>${yanAd}</b><small>${d.n ? `${d.n} alt alan seçildi` : 'Henüz seçim yok'}</small></span>${tamamMi(k) ? ic('check') : ''}</button>`; }).join('')}
        <a class="geri alt-geri" href="#ilgi">${ic('sol')}Alanları değiştir</a></aside>
      <section class="alt-panel">
        <div class="alt-panel-bas">${obj(aktif.obj)}<div><h1>${aktif.ad}</h1><p>İlgilendiğin alt alanları seç. Seçtiğin her alanı 1 ile 5 arasında puanla.</p></div></div>
        ${altlarOf(aktif).map(altSatir).join('')}
        ${ozelEkle(aktif)}
      </section></div></main>
      <div class="kur-alt"><div class="wrap"><span>${ozet}</span><div class="sag-grup">
        ${siradaki ? `<button class="btn lg ghost" data-act="altAktif" data-id="${siradaki.id}">Sıradaki: ${siradaki.ad}</button>` : ''}
        <button class="btn lg" data-act="altBitir"${sec.every(tamamMi) ? '' : ' disabled'}>Profili kaydet ${ic('sag')}</button></div></div></div></div>`;
  }

  /* ---------- Uygulama kabuğu ---------- */
  const basHarf = ad => ad.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toLocaleUpperCase('tr')).join('');
  const kabuk = (aktif, govde) => `<div class="uyg"><aside class="yan">${logo('#panel')}<nav>
      ${[['panel', 'ev', 'Ana sayfa'], ['moduller', 'katman', 'Modüller'], ['profil', 'kalp', 'İlgi profilim'], ['juri', 'ampul', 'Jüri sunumu'], ['yonetici', 'ayar', 'Yönetici paneli']].map(([r, i, a]) => `<a href="#${r}" class="${aktif === r ? 'on' : ''}">${ic(i)}<span>${a}</span></a>`).join('')}</nav>
      <div class="yan-kul"><span class="avatar">${esc(basHarf(S.kul.ad))}</span><b>${esc(S.kul.ad)}</b><button data-act="cikis" title="Çıkış yap" aria-label="Çıkış yap">${ic('cikis')}</button></div>
    </aside><main class="ana-alan">${govde}</main></div>`;

  function sPanel() {
    const n = genelSiradaki(), ilk = esc(S.kul.ad.split(' ')[0]);
    let devam = '';
    if (n) {
      const { m, k } = n, a = adimlar(m).find(x => x.k === k), t = tamamSay(m), i = D.moduller.indexOf(m);
      devam = `<a class="devam kapak${ac(m)}" href="#ders-${m.id}-${k}" style="${stil(m)}">
        <div class="devam-ust">Modül ${i + 1} · ${m.ad}</div><h2>${a.ad}</h2>
        <p>${k.startsWith('v') ? `${ic('play')}Konu anlatımı · ${a.ek}` : a.grup}</p>
        <span class="btn beyaz">${t ? 'Devam et' : 'Başla'} ${ic('sag')}</span>${obj(m.obj, 0.5)}
        <div class="devam-cubuk"><i style="width:${t / ADIM * 100}%"></i></div></a>`;
    }
    const tum = siraliAltlar().filter(x => x.p > 0).slice(0, 4);
    const top = D.moduller.length * ADIM, bitti = D.moduller.reduce((t, m) => t + tamamSay(m), 0), yuzde = Math.round(bitti / top * 100);
    const vid = D.moduller.reduce((t, m) => t + il(m.id).v.filter(Boolean).length, 0);
    const gor = D.moduller.filter(m => il(m.id).gorev).length, mb = D.moduller.filter(m => tamamSay(m) === ADIM).length;
    return kabuk('panel', `<div class="sayfa iki"><div class="kol">
        <div class="sb"><div><h1>Merhaba, ${ilk}</h1><p>${n ? 'Kaldığın yerden devam et.' : 'Bütün modülleri tamamladın.'}</p></div></div>
        ${devam}
        <div class="sb"><h2 class="bb">Modüller</h2><a class="geri" href="#moduller">Tümünü gör ${ic('sag')}</a></div>
        <div class="mod-izgara">${D.moduller.map(m => mkKart(m, true)).join('')}</div>
      </div>
      <aside class="sag">
        <section class="kart"><div class="kart-bas"><h3>İlgi profilin</h3><a href="#profil">Tümü</a></div>
          <ul class="ip">${tum.map(x => `<li>${obj(x.k.obj)}<span><b>${esc(x.a.ad)}</b><small>${esc(altDetayMetni(x.a.id) || x.k.ad)}</small></span>${noktalar(x.p)}</li>`).join('')}</ul>
          <p class="kart-not">Örnekler ve görevler bu alanlardan seçiliyor.</p></section>
        <section class="kart"><div class="kart-bas"><h3>İlerleme</h3></div>
          <div class="halka"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--cizgi2)" stroke-width="4"/><circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--ana)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${yuzde} 100"${yuzde ? '' : ' opacity="0"'} transform="rotate(-90 18 18)"/></svg>
            <div><b>%${yuzde}</b><span>${bitti}/${top} adım tamamlandı</span></div></div>
          <div class="il-satir"><span>Konu anlatım videoları</span><span>${vid}/18</span></div>
          <div class="il-satir"><span>Mikro görevler</span><span>${gor}/6</span></div>
          <div class="il-satir"><span>Tamamlanan modüller</span><span>${mb}/6</span></div></section>
      </aside></div>`);
  }

  function sModuller() {
    return kabuk('moduller', `<div class="sayfa"><div class="sb"><div><h1>Modüller</h1><p>Altı modül, on sekiz konu anlatım videosu. Her modül bir örnek uygulama ve bir mikro görevle devam eder.</p></div></div>
      ${D.moduller.map((m, i) => { const p = il(m.id), t = tamamSay(m); return `<a class="mod-satir" href="#modul-${m.id}" style="${stil(m)}">
        <div class="kapak ms-kapak${ac(m)}"><span>Modül ${i + 1}</span>${obj(m.obj, -0.3)}</div>
        <div class="ms-orta"><h2>${m.ad}</h2><p>${m.ozet}</p><ul class="ms-vid">${m.videolar.map((v, j) => `<li class="${p.v[j] ? 't' : ''}">${ic(p.v[j] ? 'check' : 'play')}${v.ad}</li>`).join('')}</ul></div>
        <div class="ms-sag"><div class="cubuk"><i style="width:${t / ADIM * 100}%"></i></div><small>${t}/${ADIM} adım · ${sureTop(m)}</small><span class="btn${t ? '' : ' ghost'}">${t === ADIM ? 'Tekrar göz at' : t ? 'Devam et' : 'Başla'}</span></div></a>`; }).join('')}</div>`);
  }

  function sModul(m) {
    const i = D.moduller.indexOf(m), p = il(m.id), b = baglamAl(m), n = siradaki(m), t = tamamSay(m);
    const sonDurum = ok => ok ? `<span class="t">${ic('check')}</span>` : ic('sag');
    return kabuk('moduller', `<div class="sayfa"><a class="geri" href="#moduller">${ic('sol')}Modüller</a>
      <header class="mod-bas kapak${ac(m)}" style="${stil(m)}"><span class="no">Modül ${i + 1}</span><h1>${m.ad}</h1><p>${m.ozet}</p>
        <div class="mod-bas-alt"><a class="btn beyaz" href="#ders-${m.id}-${n || 'v1'}">${t === ADIM ? 'Baştan izle' : t ? 'Devam et' : 'Başla'} ${ic('sag')}</a><span>${m.videolar.length} video · ${sureTop(m)}</span><span>${t}/${ADIM} adım</span></div>
        ${obj(m.obj, 0.4)}</header>
      <section><h2 class="bb">Konu anlatımı</h2><div class="vid-izgara">${m.videolar.map((v, j) => `<a class="vk" href="#ders-${m.id}-v${j + 1}">
          ${v.video
            ? `<div class="kapak vk-kapak vk-has-video"><video class="vk-video" src="${encodeURI(v.video)}#t=0.05" preload="metadata" muted playsinline tabindex="-1" aria-hidden="true"></video><time>${v.sure}</time>${p.v[j] ? `<span class="vk-tik">${ic('check')}İzlendi</span>` : ''}<span class="vk-oynat">${ic('play')}</span></div>`
            : `<div class="kapak vk-kapak${ac(m)}" style="${stil(m)}"><time>${v.sure}</time>${p.v[j] ? `<span class="vk-tik">${ic('check')}İzlendi</span>` : ''}${obj(m.obj, j * 0.9 - 0.6)}<span class="vk-oynat">${ic('play')}</span></div>`}
          <h3>${j + 1}. ${v.ad}</h3><p>${v.ozet}</p></a>`).join('')}</div></section>
      <section><h2 class="bb">Uygulama</h2><div class="ikili">
        <a class="uk" href="#ders-${m.id}-ornek"><small>Örnek uygulama · ${esc(b.alt.ad)}</small><h3>${m.ornek.ad}</h3><p>${b.c.tema}</p><span class="durum${p.ornek ? ' t' : ''}">${p.ornek ? ic('check') + 'Tamamlandı' : '3 adım ' + ic('sag')}</span>${obj(b.ilgi.obj, 0.2)}</a>
        <a class="uk" href="#ders-${m.id}-gorev"><small>Mikro görev · ${m.gorev.tur}</small><h3>${m.gorev.ad}</h3><p>${b.c.tema}</p><span class="durum${p.gorev ? ' t' : ''}">${p.gorev ? ic('check') + 'Tamamlandı' : 'Göreve git ' + ic('sag')}</span>${obj(m.obj, -0.5)}</a>
      </div></section>
      <section><h2 class="bb">Modül sonu</h2><div class="son-liste">
        <a class="sl" href="#ders-${m.id}-duygu">${ic('kalp')}<div><b>Neler hissettin?</b><small>${D.duygular.length} duygu · yaklaşık 1 dakika</small></div>${sonDurum(p.duyguOk)}</a>
        <a class="sl" href="#ders-${m.id}-ilgi">${ic('liste')}<div><b>Modülü değerlendir</b><small>${D.ilgiMaddeleri.length} ifade · yaklaşık 1 dakika</small></div>${sonDurum(p.ilgiOk)}</a>
      </div></section></div>`);
  }

  function sProfil() {
    const p = P(), z = zenginMi();
    return kabuk('profil', `<div class="sayfa"><div class="sb"><div><h1>İlgi profilin</h1><p>Örnek uygulamalar ve mikro görevler bu puanlara göre seçiliyor.</p></div><a class="btn ghost" href="#ilgi">${ic('duzenle')}Düzenle</a></div>
      <div class="pr-izgara">${p.secilen.map(ilgi).filter(Boolean).map(k => `<section class="kart"><div class="pr-bas">${obj(k.obj)}<h2>${k.ad}</h2></div>
        <ul class="pr">${seciliAltlar(k).sort((a, b) => (p.puan[b.id] || 0) - (p.puan[a.id] || 0)).map(a => {
          const etk = z ? ((p.etkinlik && p.etkinlik[a.id]) || []) : [];
          const det = (p.detay[a.id] || '').trim();
          return `<li><span><b>${esc(a.ad)}</b>${etk.length ? `<span class="pr-etk">${etk.map(e => `<i>${esc(e)}</i>`).join('')}</span>` : ''}${det ? `<small>${esc(det)}</small>` : ''}</span>${noktalar(p.puan[a.id] || 0)}</li>`;
        }).join('')}</ul></section>`).join('')}</div></div>`);
  }

  function sYonetici() {
    const z = zenginMi();
    const sTop = S.secilen.map(id => D.ilgiler.find(k => k.id === id)).filter(Boolean);
    const zTop = SZ.secilen.map(id => D.zenginIlgiler.find(k => k.id === id)).filter(Boolean);
    const topAltZ = D.zenginIlgiler.reduce((t, k) => t + k.altlar.length, 0);
    const topAltS = D.ilgiler.reduce((t, k) => t + k.altlar.length, 0);
    return kabuk('yonetici', `<div class="sayfa">
      <div class="sb">
        <div>
          <h1>Yönetici paneli</h1>
          <p>Öğrenci ilgi toplama yöntemini seçin, yapılandırmayı inceleyin ve iki yöntem arasında geçiş yapın.</p>
        </div>
        <div class="yon-aksiyon">
          <a class="btn" href="#canli">${ic('yildiz')}Canlı API deneyi</a>
          <a class="btn ghost" href="#juri">${ic('ampul')}Jüri sunumu</a>
          <a class="btn ghost" href="#ilgi">1. Ekranı önizle</a>
          <a class="btn ghost" href="#alt-ilgi">2. Ekranı önizle ${ic('sag')}</a>
        </div>
      </div>

      <section class="kart yon-secim-kart">
        <div class="yon-bas">
          <div>
            <h2>Aktif ilgi toplama yöntemi</h2>
            <p>Buradan yapılan seçim kayıt sonrası, profil düzenleme ekranlarında ve prototip gezgininde anında geçerli olur. Mevcut yöntem ve verileri korunur.</p>
          </div>
          <span class="yon-rozet">${z ? 'Zenginleştirilmiş yöntem aktif' : 'Standart (mevcut) yöntem aktif'}</span>
        </div>
        <div class="yon-kartlar" role="radiogroup" aria-label="İlgi toplama yöntemi">
          <div class="yon-k${!z ? ' on' : ''}" role="radio" aria-checked="${!z}" tabindex="0" data-act="yontemSec" data-yontem="standart">
            <div class="yon-k-ust">
              <span class="yon-radio">${!z ? ic('check') : ''}</span>
              <div>
                <b>Mevcut İlgi Toplama (Standart)</b>
                <small>${D.ilgiler.length} ana kategori · ${topAltS} hazır alt alan</small>
              </div>
            </div>
            <p>Mevcut 8 ana kategori, alt kategori seçimi, 1–5 arası ilgi puanlaması ve tek satırlık kısa detay sorusundan oluşan standart yapı.</p>
            <ul class="yon-ozellik">
              <li>${ic('check')}<span>8 ana ilgi kategorisi ve 3B kategori ikonları</span></li>
              <li>${ic('check')}<span>Alt kategori başına 1–5 ilgi yoğunluğu ve açık uçlu soru</span></li>
              <li>${ic('check')}<span>Kategori başına en fazla 3 özel alt alan ekleme</span></li>
            </ul>
            <div class="yon-k-alt">
              <span>Kayıtlı seçim: <b>${sTop.length} ana alan</b></span>
              <button type="button" class="btn${!z ? '' : ' ghost'}" data-act="yontemSec" data-yontem="standart">${!z ? 'Seçili yöntem' : 'Bu yönteme geç'}</button>
            </div>
          </div>

          <div class="yon-k${z ? ' on' : ''}" role="radio" aria-checked="${z}" tabindex="0" data-act="yontemSec" data-yontem="zengin">
            <div class="yon-k-ust">
              <span class="yon-radio">${z ? ic('check') : ''}</span>
              <div>
                <b>Zenginleştirilmiş İlgi Toplama</b>
                <small>${D.zenginIlgiler.length} ana kategori · ${topAltZ} hazır alt alan</small>
              </div>
            </div>
            <p>12 genişletilmiş ana kategori; her alt kategori için zorunlu 1–5 ilgi yoğunluğu, çoklu seçilebilir etkileşim etiketleri (chips) ve alt alana özgü takip sorusu.</p>
            <ul class="yon-ozellik">
              <li>${ic('check')}<span>12 ana kategori, 3B ikonlar ve genişletilmiş ızgara düzeni</span></li>
              <li>${ic('check')}<span>Alt kategoriye özgü etkileşim biçimi etiketleri (selectable chips)</span></li>
              <li>${ic('check')}<span>Özgül takip sorusu, placeholder ve özel alt alanlarda özel etkileşim ekleme</span></li>
            </ul>
            <div class="yon-k-alt">
              <span>Kayıtlı seçim: <b>${zTop.length} ana alan</b></span>
              <button type="button" class="btn${z ? '' : ' ghost'}" data-act="yontemSec" data-yontem="zengin">${z ? 'Seçili yöntem' : 'Bu yönteme geç'}</button>
            </div>
          </div>
        </div>
      </section>

      <section class="kart yon-secim-kart">
        <div class="yon-bas">
          <div>
            <h2>Açılış sayfası (Ana index) versiyonu</h2>
            <p>Danışmanın karşılaştırmalı olarak inceleyebilmesi için üç farklı açılış sahnesi sunulmaktadır. İstediğiniz versiyonu seçip açılış ekranında önizleyebilirsiniz.</p>
          </div>
          <span class="yon-rozet">${UI.hero === 'v3' ? '3. Versiyon aktif (Adım Adım 3B)' : UI.hero === 'v2' ? '2. Versiyon aktif (3B Basamaklar)' : '1. Versiyon aktif (Yolculuk)'}</span>
        </div>
        <div class="yon-kartlar yon-kartlar-3" role="radiogroup" aria-label="Açılış sayfası versiyonu">
          <div class="yon-k${UI.hero === 'v1' ? ' on' : ''}" role="radio" aria-checked="${UI.hero === 'v1'}" tabindex="0" data-act="heroSec" data-hero="v1">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.hero === 'v1' ? ic('check') : ''}</span>
              <div>
                <b>1. Versiyon — Araştırma Yolculuğu (Mevcut)</b>
                <small>SVG yol diyagramı ve robot animasyonu</small>
              </div>
            </div>
            <p>Altı araştırma adımını kıvrımlı bir yol üzerinde gezen karakter, alt gösterge noktaları ve adım kartlarıyla sunan mevcut açılış sayfası.</p>
            <div class="yon-k-alt">
              <span>${UI.hero === 'v1' ? '<b>Seçili versiyon</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.hero === 'v1' ? '' : ' ghost'}" data-act="heroSec" data-hero="v1" data-git="acilis">Açılışta görüntüle ${ic('sag')}</button>
            </div>
          </div>

          <div class="yon-k${UI.hero === 'v2' ? ' on' : ''}" role="radio" aria-checked="${UI.hero === 'v2'}" tabindex="0" data-act="heroSec" data-hero="v2">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.hero === 'v2' ? ic('check') : ''}</span>
              <div>
                <b>2. Versiyon — 3B Araştırma Basamakları</b>
                <small>Three.js 3B sahne, veri tablosu ve saçılım grafiği</small>
              </div>
            </div>
            <p>Yükselen altı 3B basamak üzerinde ilerleyen robot, her adımda değişen konuşma balonu (veri tablosu, değişkenler, r ≈ 0,96 saçılım grafiği) ile ikinci gösterim.</p>
            <div class="yon-k-alt">
              <span>${UI.hero === 'v2' ? '<b>Seçili versiyon</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.hero === 'v2' ? '' : ' ghost'}" data-act="heroSec" data-hero="v2" data-git="acilis">Açılışta görüntüle ${ic('sag')}</button>
            </div>
          </div>

          <div class="yon-k${UI.hero === 'v3' ? ' on' : ''}" role="radio" aria-checked="${UI.hero === 'v3'}" tabindex="0" data-act="heroSec" data-hero="v3">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.hero === 'v3' ? ic('check') : ''}</span>
              <div>
                <b>3. Versiyon — Adım Adım Basamaklar</b>
                <small>Tek tek beliren 3B basamaklar ve basamak yüzeyi etiketleri</small>
              </div>
            </div>
            <p>Karakter ilerledikçe merdiven basamaklarının adım adım yükseldiği ve adım etiketlerinin doğrudan basamakların yan/ön yüzeyine yazıldığı gösterim.</p>
            <div class="yon-k-alt">
              <span>${UI.hero === 'v3' ? '<b>Seçili versiyon</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.hero === 'v3' ? '' : ' ghost'}" data-act="heroSec" data-hero="v3" data-git="acilis">Açılışta görüntüle ${ic('sag')}</button>
            </div>
          </div>
        </div>
      </section>

      <section class="kart yon-secim-kart">
        <div class="yon-bas">
          <div>
            <h2>Çözümlü örnek sunum biçimi</h2>
            <p>Konu anlatım videosundan sonra gelen çözümlü örneklerin mevcut metin tabanlı biçimi veya alternatif seslendirilmiş etkileşimli slayt biçimi arasında geçiş yapın. Nihai deneyde seçilen biçim hem kontrol hem deney grubunda sabit tutulur.</p>
          </div>
          <span class="yon-rozet">${UI.ornekMod === 'slayt' ? 'Alternatif: Seslendirilmiş slayt' : 'Mevcut: Metin tabanlı'}</span>
        </div>
        <div class="yon-kartlar" role="radiogroup" aria-label="Çözümlü örnek sunum biçimi">
          <div class="yon-k${UI.ornekMod !== 'slayt' ? ' on' : ''}" role="radio" aria-checked="${UI.ornekMod !== 'slayt'}" tabindex="0" data-act="ornekModSec" data-mod="metin">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.ornekMod !== 'slayt' ? ic('check') : ''}</span>
              <div>
                <b>Mevcut: Adım adım metin tabanlı çözümlü örnek</b>
                <small>3 pedagojik adım · Statik metin ve şema</small>
              </div>
            </div>
            <p>Mevcut öğrenci ekranlarındaki metin tabanlı çözümlü örnek akışı korunur.</p>
            <div class="yon-k-alt">
              <span>${UI.ornekMod !== 'slayt' ? '<b>Seçili biçim</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.ornekMod !== 'slayt' ? '' : ' ghost'}" data-act="ornekModSec" data-mod="metin" data-git="ders-m2-ornek">Modül 2'de önizle ${ic('sag')}</button>
            </div>
          </div>

          <div class="yon-k${UI.ornekMod === 'slayt' ? ' on' : ''}" role="radio" aria-checked="${UI.ornekMod === 'slayt'}" tabindex="0" data-act="ornekModSec" data-mod="slayt">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.ornekMod === 'slayt' ? ic('check') : ''}</span>
              <div>
                <b>Alternatif: Seslendirilmiş etkileşimli slayt (Slides &amp; Narration)</b>
                <small>5 adım · Görsel sahne + TTS anlatım + öğrenci kontrolü</small>
              </div>
            </div>
            <p>Google Learn Your Way ve Mayer'in Çoklu Ortam Öğrenme Kuramı ilkeleriyle hazırlanan, her adımı seslendirilen etkileşimli çözümlü örnek.</p>
            <div class="yon-k-alt">
              <span>${UI.ornekMod === 'slayt' ? '<b>Seçili biçim</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.ornekMod === 'slayt' ? '' : ' ghost'}" data-act="ornekModSec" data-mod="slayt" data-git="ders-m2-ornek">Modül 2'de önizle ${ic('sag')}</button>
            </div>
          </div>
        </div>
        <div class="yon-durum-satir">
          <span>Jüriye standart kontrol, Basketbol ve V60 Kahve örneklerini yan yana göstermek için:</span>
          <a class="btn ghost" href="#juri-slayt">${ic('ampul')}Jüri sunumunda Slayt &amp; Ses gösterimi</a>
        </div>
      </section>

      <section class="kart yon-secim-kart">
        <div class="yon-bas">
          <div>
            <h2>Mikro-görev sunum biçimi</h2>
            <p>Çözümlü örnekten mikro-göreve geçildiğinde öğrencinin senaryoyu görsel destek, isteğe bağlı seslendirme ve açıklayıcı geri bildirimle çözmesi için alternatif etkileşimli mikro-görev biçimini seçebilirsiniz.</p>
          </div>
          <span class="yon-rozet">${UI.gorevMod === 'etkilesimli' ? 'Alternatif: Etkileşimli mikro-görev' : 'Mevcut: Standart mikro-görev'}</span>
        </div>
        <div class="yon-kartlar" role="radiogroup" aria-label="Mikro-görev sunum biçimi">
          <div class="yon-k${UI.gorevMod !== 'etkilesimli' ? ' on' : ''}" role="radio" aria-checked="${UI.gorevMod !== 'etkilesimli'}" tabindex="0" data-act="gorevModSec" data-mod="klasik">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.gorevMod !== 'etkilesimli' ? ic('check') : ''}</span>
              <div>
                <b>Mevcut: Standart mikro-görev</b>
                <small>Mevcut eşleştirme ve açık uçlu soru düzeni</small>
              </div>
            </div>
            <p>Mevcut öğrenci modül ekranlarındaki mikro-görev bileşenleri korunur.</p>
            <div class="yon-k-alt">
              <span>${UI.gorevMod !== 'etkilesimli' ? '<b>Seçili biçim</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.gorevMod !== 'etkilesimli' ? '' : ' ghost'}" data-act="gorevModSec" data-mod="klasik" data-git="ders-m2-gorev">Modül 2'de önizle ${ic('sag')}</button>
            </div>
          </div>

          <div class="yon-k${UI.gorevMod === 'etkilesimli' ? ' on' : ''}" role="radio" aria-checked="${UI.gorevMod === 'etkilesimli'}" tabindex="0" data-act="gorevModSec" data-mod="etkilesimli">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.gorevMod === 'etkilesimli' ? ic('check') : ''}</span>
              <div>
                <b>Alternatif: Görsel &amp; ipucu destekli etkileşimli mikro-görev</b>
                <small>Senaryo görseli + isteğe bağlı ses + ipucu + açıklayıcı geri bildirim</small>
              </div>
            </div>
            <p>Çözümlü örnekten transfer senaryosuna geçen, 6 alternatif etkileşim şablonuyla (Eşleştirme, Sınıflandırma, Sıralama, Grafik, Boşluk, Açık uçlu) uyumlu yeni tasarım.</p>
            <div class="yon-k-alt">
              <span>${UI.gorevMod === 'etkilesimli' ? '<b>Seçili biçim</b>' : 'Alternatif'}</span>
              <button type="button" class="btn${UI.gorevMod === 'etkilesimli' ? '' : ' ghost'}" data-act="gorevModSec" data-mod="etkilesimli" data-git="ders-m2-gorev">Modül 2'de önizle ${ic('sag')}</button>
            </div>
          </div>
        </div>
        <div class="yon-durum-satir">
          <span>Jüriye mikro-görev prototipini ve 6 etkileşim şablonunu göstermek için:</span>
          <a class="btn ghost" href="#juri-gorev">${ic('hedef')}Jüri sunumunda Mikro-Görev Şablonları</a>
        </div>
      </section>

      <section class="kart yon-secim-kart">
        <div class="yon-bas">
          <div>
            <h2>Üretim hattı, API anahtarları ve model seçimi (Prototip)</h2>
            <p>API anahtarlarını girdikten sonra güncel modelleri doğrudan Anthropic (Claude) ve Google (Gemini / TTS) API'lerinden çekebilirsiniz.</p>
          </div>
          <span class="yon-rozet" id="yonUretimRozet">Yerel yapılandırma hazır</span>
        </div>

        <div class="yon-hat-izgara">
          <div class="yon-alt-kutu">
            <h3>API anahtarları</h3>
            <p>Anahtarlar yalnızca tarayıcının yerel deposunda saklanır; model listesini güncellemek için kullanılır.</p>
            ${[
              ['claudeKey', 'Claude API Key', 'Anthropic', 'sk-ant-api03-...'],
              ['geminiKey', 'Gemini API Key', 'Google AI (Metin & Görsel)', 'AIzaSy...'],
              ['ttsKey', 'Google Cloud TTS Key', 'Seslendirme (opsiyonel)', 'AIzaSy...'],
            ].map(([k, ad, alt, yer]) => {
              const goster = !!UI.keyGorunur[k];
              return `<div class="yon-alan">
                <label for="api-${k}"><span>${ad}</span><small>${alt}</small></label>
                <div class="yon-girdi-satir">
                  <input id="api-${k}" class="girdi" type="${goster ? 'text' : 'password'}" data-uretim="${k}" value="${esc(UI.uretim[k] || '')}" placeholder="${yer}" autocomplete="off">
                  <button type="button" class="yon-goz-btn" data-act="keyGoster" data-key="${k}">${goster ? 'Gizle' : 'Göster'}</button>
                </div>
              </div>`;
            }).join('')}
            <div class="yon-model-ust">
              <button type="button" class="yon-cek-btn" id="modelleriCekBtn" data-act="modelleriCek"${UI.modelYukleniyor ? ' disabled' : ''}>${UI.modelYukleniyor ? 'Modeller çekiliyor...' : 'Güncel modelleri API\'den çek'}</button>
              <button type="button" class="yon-goz-btn" data-act="modelleriSifirla">Listeyi sıfırla</button>
            </div>
            ${UI.modelBilgi ? `<div class="yon-model-bilgi ${UI.modelBilgi.tip}">${esc(UI.modelBilgi.mesaj)}</div>` : ''}
          </div>

          <div class="yon-alt-kutu">
            <h3>Adım bazlı model seçimi</h3>
            <p>API'den çekilen güncel modeller (ör. Sonnet, Gemini Hydrogen vb.) listelere otomatik eklenir.</p>
            <div class="yon-adim-liste">
              ${(() => {
                const m = UI.uretim.modeller || {};
                const cl = (m.claude && m.claude.length) ? m.claude : VARSAYILAN_MODELLER.claude;
                const gm = (m.geminiText && m.geminiText.length) ? m.geminiText : VARSAYILAN_MODELLER.geminiText;
                const gi = (m.geminiImage && m.geminiImage.length) ? m.geminiImage : VARSAYILAN_MODELLER.geminiImage;
                const ts = (m.tts && m.tts.length) ? m.tts : VARSAYILAN_MODELLER.tts;
                const birlesikMetin = [...cl, ...gm];
                const adimlar = [
                  ['senaryoModel', '1. Senaryo ve metin üretimi', 'Bağlama uygun araştırma senaryosu ve çözüm adımları', birlesikMetin],
                  ['denetimModel', '1b. Pedagojik ön denetim (Appendix B hakemi)', 'Deney-kontrol eşdeğerliği ve 10 boyutlu Learn Your Way rubrik denetimi', birlesikMetin],
                  ['scriptModel', '2. Seslendirme scripti yazımı', 'Doğal konuşma akışı ve zamanlama (70–100 sn)', birlesikMetin],
                  ['promptModel', '3. Görsel üretim promptu oluşturma', 'Pedagojik sahne tarifi ve görsel tutarlılık promptu', birlesikMetin],
                  ['gorselModel', '4a. Görsel üretimi (Gemini)', 'Senaryo görsellerinin üretilip images/ klasörüne kaydı', [...gi, ...gm]],
                  ['sesModel', '4b. Ses üretimi (Google TTS)', 'Türkçe seslendirme üretimi ve audio/ klasörüne kaydı', ts],
                ];
                return adimlar.map(([k, bas, aciklama, secenekler]) => {
                  const cur = UI.uretim[k];
                  const liste = secenekler.some(([v]) => v === cur) ? secenekler : [[cur, cur], ...secenekler];
                  return `<div class="yon-adim-satir">
                    <div><b>${bas}</b><small>${aciklama}</small></div>
                    <select data-uretim="${k}" aria-label="${bas}">
                      ${liste.map(([val, lbl]) => `<option value="${esc(val)}"${cur === val ? ' selected' : ''}>${esc(lbl)}</option>`).join('')}
                    </select>
                  </div>`;
                }).join('');
              })()}
            </div>
          </div>
        </div>

        <div class="yon-onbellek">
          <div class="yon-klasor">
            <code>images/&lt;modül&gt;-&lt;profil&gt;-s&lt;adım&gt;.png</code>
            <span>Üretilen görseller <b>images/</b> klasöründe önbelleklenir; aynı bağlam için tekrar üretilmez.</span>
          </div>
          <div class="yon-klasor">
            <code>audio/&lt;modül&gt;-&lt;profil&gt;-s&lt;adım&gt;.mp3</code>
            <span>Google TTS ses dosyaları <b>audio/</b> klasöründe önbelleklenir; tüm seslendirmeler aynı ses ve hızda (${esc(UI.uretim.sesHiz)}×) üretilir.</span>
          </div>
        </div>

        <div class="yon-durum-satir">
          <span>Yukarıdaki anahtarlar ve model seçimleriyle deney grubunu canlı çalıştırıp kontrol grubuyla yan yana karşılaştırın:</span>
          <a class="btn" href="#canli">${ic('yildiz')}Canlı Deney Laboratuvarını Aç (API) ${ic('sag')}</a>
        </div>

        <aside class="ar-not">
          <h3>Önbellek ve canlı API üretimi</h3>
          <p>Canlı Deney ekranında üretilen metin, Gemini görselleri ve Google TTS sesleri tarayıcının IndexedDB önbelleğinde saklanır; istenirse <b>images/</b> ve <b>audio/</b> klasörlerine indirilebilir.</p>
        </aside>
      </section>

      <section class="kart yon-secim-kart" id="yon-denetim">
        <div class="yon-bas">
          <div>
            <h2>Pedagojik Ön Denetim (Appendix B) &amp; Akademisyen Onay Süreci</h2>
            <p>Google LearnLM <em>"Towards an AI-Augmented Textbook"</em> (arXiv:2509.13348) çalışmasının <b>Appendix B: Rubrics for Pedagogical Evaluations</b> (10 boyut) ve <b>Deney–Kontrol Grubu Eşdeğerliği</b> (5 boyut) ölçütlerine göre iki aşamalı denetim mekanizması: YZ önce ürettiği içeriği denetler ve gerekirse revize eder; YZ ön onayından geçen içerikler <b>Akademisyen Onayına</b> düşer ve akademisyen onayladığında öğrenciye görünür olur.</p>
          </div>
          <span class="yon-rozet ${UI.uretim.onDenetimAcik !== false ? 'aktif-rozet' : 'kapali-rozet'}">${UI.uretim.onDenetimAcik !== false ? 'Denetimli Mod Aktif (YZ Ön Denetim + Akademisyen Onayı)' : 'Denetimsiz Mod (Doğrudan Öğrenciye Açık)'}</span>
        </div>

        <div class="yon-kartlar" role="radiogroup" aria-label="Pedagojik ön denetim durumu">
          <div class="yon-k${UI.uretim.onDenetimAcik !== false ? ' on' : ''}" role="radio" aria-checked="${UI.uretim.onDenetimAcik !== false}" tabindex="0" data-act="onDenetimSec" data-acik="1">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.uretim.onDenetimAcik !== false ? ic('check') : ''}</span>
              <div>
                <b>Ön Denetim Açık (YZ Ön Kontrol + Akademisyen Onayı)</b>
                <small>arXiv:2509.13348 Appendix B · Otomatik revizyon + uzman onayı</small>
              </div>
            </div>
            <p>Üretilen içerik önce YZ hakemi tarafından 10 pedagojik rubrik ve 5 deneysel eşdeğerlik boyutunda (1.0 Agree / 0.5 Partial / 0.0 Disagree) puanlanır. Eşik altındaysa belirlenen revizyon hakkı kadar düzeltme önerileriyle otomatik yeniden üretilir. YZ onayından geçen içerik akademisyen onayına düşer; akademisyen onaylayınca öğrenci görebilir.</p>
            <div class="yon-k-alt">
              <span>Öğrenci görünürlüğü: <b>Akademisyen onayından sonra</b></span>
              <button type="button" class="btn${UI.uretim.onDenetimAcik !== false ? '' : ' ghost'}" data-act="onDenetimSec" data-acik="1">${UI.uretim.onDenetimAcik !== false ? 'Aktif mod' : 'Denetimli moda geç'}</button>
            </div>
          </div>

          <div class="yon-k${UI.uretim.onDenetimAcik === false ? ' on' : ''}" role="radio" aria-checked="${UI.uretim.onDenetimAcik === false}" tabindex="0" data-act="onDenetimSec" data-acik="0">
            <div class="yon-k-ust">
              <span class="yon-radio">${UI.uretim.onDenetimAcik === false ? ic('check') : ''}</span>
              <div>
                <b>Ön Denetim Kapalı (Denetimsiz Doğrudan Sonuç)</b>
                <small>Hızlı prototipleme · Revizyon ve onay adımı atlanır</small>
              </div>
            </div>
            <p>YZ ön denetimi, otomatik revizyon döngüsü ve akademisyen onay kilidi devre dışı bırakılır. API'den üretilen kişiselleştirilmiş deney grubu içeriği herhangi bir denetim beklemeksizin doğrudan öğrenci görünümünde açılır.</p>
            <div class="yon-k-alt">
              <span>Öğrenci görünürlüğü: <b>Üretildiği anda doğrudan görünür</b></span>
              <button type="button" class="btn${UI.uretim.onDenetimAcik === false ? '' : ' ghost'}" data-act="onDenetimSec" data-acik="0">${UI.uretim.onDenetimAcik === false ? 'Aktif mod' : 'Denetimsiz moda geç'}</button>
            </div>
          </div>
        </div>

        <div class="yon-denetim-ayar-izgara">
          <div class="yon-alan">
            <label for="denetim-maxRevizyon"><span>Maksimum Otomatik YZ Revizyon Hakkı</span><small>Eşik altında kalırsa kaç kez revize edilsin?</small></label>
            <select id="denetim-maxRevizyon" class="girdi" data-uretim="maxRevizyon">
              ${[
                ['0', '0 revizyon (Sadece tek sefer değerlendir, revize etme)'],
                ['1', '1 revizyon hakkı (İlk üretim + en fazla 1 düzeltme turu)'],
                ['2', '2 revizyon hakkı (Önerilen · En fazla 2 düzeltme turu)'],
                ['3', '3 revizyon hakkı (Derin denetim · En fazla 3 düzeltme turu)'],
                ['4', '4 revizyon hakkı'],
              ].map(([v, lbl]) => `<option value="${v}"${String(UI.uretim.maxRevizyon ?? 2) === v ? ' selected' : ''}>${lbl}</option>`).join('')}
            </select>
          </div>

          <div class="yon-alan">
            <label for="denetim-gecmeEsigi"><span>YZ Ön Onay Geçme Eşiği (0.00 – 1.00)</span><small>Makaledeki referans eşik: ≥ 0.90 (veya ≥ 0.85)</small></label>
            <select id="denetim-gecmeEsigi" class="girdi" data-uretim="gecmeEsigi">
              ${[
                ['0.75', '%75 (0.75 · Esnek eşik)'],
                ['0.80', '%80 (0.80 · Orta eşik)'],
                ['0.85', '%85 (0.85 · Dengeli akademik eşik — Varsayılan)'],
                ['0.90', '%90 (0.90 · Learn Your Way makale referans eşiği)'],
                ['0.95', '%95 (0.95 · Çok sıkı eşik — Neredeyse tam puan)'],
              ].map(([v, lbl]) => `<option value="${v}"${String(UI.uretim.gecmeEsigi || '0.85') === v ? ' selected' : ''}>${lbl}</option>`).join('')}
            </select>
          </div>

          <div class="yon-alan">
            <label for="denetim-akademisyenAd"><span>Onaylayıcı Akademisyen / Uzman Unvanı</span><small>Onay kaydında ve denetim izinde görünür</small></label>
            <input id="denetim-akademisyenAd" class="girdi" type="text" data-uretim="akademisyenAd" value="${esc(UI.uretim.akademisyenAd || 'Doç. Dr. Akademik Danışman')}" placeholder="Örn. Prof. Dr. ...">
          </div>
        </div>

        <div class="yon-durum-satir">
          <span>Tüm adımların promptlarını, Appendix B rubrik puanlarını, düzeltme önerilerini ve akademisyen onay akışını incelemek için:</span>
          <a class="btn" href="#canli">${ic('hedef')}Canlı Deney &amp; Denetim İzleme Ekranına Git ${ic('sag')}</a>
        </div>
      </section>

      <section class="kart">
        <div class="kart-bas">
          <h3>Zenginleştirilmiş yöntem kategori yapısı (12 ana kategori · ${topAltZ} alt kategori)</h3>
        </div>
        <div class="yon-kat-izgara">
          ${D.zenginIlgiler.map((k, idx) => `<div class="yon-kat">
            <div class="yon-kat-bas">${obj(k.obj)}<div><b>${idx + 1}. ${k.ad}</b><small>${k.arastirma ? k.arastirma + ' · ' : ''}${k.altlar.length} alt kategori</small></div></div>
            <div class="yon-alt-etiketler">${k.altlar.map(a => `<span>${esc(a.ad)}</span>`).join('')}</div>
          </div>`).join('')}
        </div>
      </section>
    </div>`);
  }

  /* ---------- Jüri Sunumu: Kişiselleştirme Mekanizması ve Simüle Edilmiş Profiller ---------- */
  const yildiz5 = p => `<span class="juri-yildiz" aria-label="5 üzerinden ${p}">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= p ? 'd' : ''}">★</i>`).join('')}<b>${p}/5</b></span>`;
  function sJuri() {
    const J = D.juriSunum;
    const pIdx = Math.max(0, Math.min(J.profiller.length - 1, UI.juriProf || 0));
    const evIdx = Math.max(0, Math.min(J.profiller.length - 1, UI.juriEvrenProf || 0));
    const aktP = J.profiller[pIdx];
    const evP = J.profiller[evIdx];
    const dSt = J.degiskenler.standart;
    const dDn = J.degiskenler.deney[aktP.id];
    const ev = J.evrenOrneklem;
    const evDn = ev.deney[evP.id];
    const acikMiCozum = k => !!UI.juriCozum[k];

    return kabuk('juri', `<div class="sayfa juri-sayfa">
      <div class="sb">
        <div>
          <h1>Kişiselleştirme mekanizması · Jüri sunumu</h1>
          <p>Aynı öğrenme kazanımının farklı öğrenci ilgi profillerine göre nasıl kişiselleştirildiğini, çözümlü örnek ve mikro-görev bağlamlarının öğrencinin ilgi alanıyla kurduğu ilişkiye göre nasıl değiştiğini inceleyin.</p>
        </div>
        <div class="yon-aksiyon">
          <a class="btn ghost" href="#yonetici">${ic('ayar')}Yönetici paneli</a>
          <a class="btn" href="#alt-ilgi">İlgi toplama ekranı ${ic('sag')}</a>
        </div>
      </div>

      <!-- Temel tasarım ilkesi özeti -->
      <section class="kart juri-ilke-kart">
        <div class="juri-ilke-ust">
          <div>
            <span class="juri-ust-etiket">Temel tasarım ilkesi</span>
            <h2>Çok katmanlı ilgi verisinden öğrenme bağlamına geçiş</h2>
            <p>Ayrıntının yeri etkileşim etiketleri değil, öğrencinin kendi ifadeleriyle doldurduğu özgül ilgi alanıdır. Böylece hem arayüz sade kalır hem de kişiselleştirme için zengin veri elde edilir.</p>
          </div>
        </div>
        <div class="juri-ilke-izgara">
          <div class="juri-ilke-kutu">
            <small>Alt kategori — Öğrenci neye ilgi duyuyor?</small>
            <b>Kahve ve çay</b>
          </div>
          <div class="juri-ilke-kutu">
            <small>Etkileşim biçimi — İlgisiyle nasıl etkileşim kuruyor?</small>
            <div class="jp-etk-liste"><span>${ic('check')}Kahve hazırlamak</span><span>${ic('check')}Farklı kahveler tatmak</span></div>
          </div>
          <div class="juri-ilke-kutu">
            <small>Özgül ilgi — Tam olarak neyi seviyor?</small>
            <p>V60 ile filtre kahve demlemek, farklı yörelerin kahve çekirdeklerini denemek</p>
          </div>
          <div class="juri-ilke-kutu">
            <small>İlgi yoğunluğu — Ne kadar ilgileniyor?</small>
            <div class="puan juri-ilke-puan">${[1, 2, 3, 4, 5].map(n => `<span class="${n === 5 ? 'on' : 'dolu'}">${n}</span>`).join('')}</div>
          </div>
        </div>
      </section>

      <!-- 1. Simüle edilmiş öğrenci ilgi profilleri -->
      <section class="kart juri-bolum">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">1</span>
          <div>
            <h2>Simüle edilmiş öğrenci ilgi profilleri</h2>
            <p>Aşağıda altı simüle edilmiş öğrenci profili yer almaktadır. Özellikle <b>Öğrenci 1</b> ve <b>Öğrenci 2</b>’nin aynı alt ilgi kategorisini (Spor → Basketbol) seçmesine rağmen farklı etkileşim biçimleri ve açıklamalar girmesi, zenginleştirilmiş ilgi toplama yönteminin katkısını görünür kılar.</p>
          </div>
        </div>
        <div class="juri-profil-izgara">
          ${J.profiller.map((p, i) => `<article class="jp-kart${i === pIdx ? ' on' : ''}" data-act="juriProfSec" data-i="${i}" role="button" tabindex="0">
            <div class="jp-ust">
              ${obj(p.obj)}
              <div class="jp-baslik">
                <b>${esc(p.no)}</b>
                <small>${esc(p.kategori)}</small>
              </div>
            </div>
            <div class="jp-alt-satir">
              <h3 class="jp-alt-ad">${esc(p.altKategori)}</h3>
              ${yildiz5(p.puan)}
            </div>
            <div class="jp-etk-grup">
              <small>Etkileşim biçimleri</small>
              <div class="jp-etk-liste">${p.etkilesimler.map(e => `<span>${esc(e)}</span>`).join('')}</div>
            </div>
            <div class="jp-aciklama">
              <small>Öğrencinin kendi açıklaması</small>
              <p><em>${esc(p.aciklama)}</em></p>
            </div>
          </article>`).join('')}
        </div>
        <p class="juri-dipnot">${ic('bilgi')}<span>Öğrenci profilleri tamamen kurgusaldır. Gerçek öğrenci verisi veya pilot uygulama bulgusu değildir. İlgi puanları jüriye yöntemi açıklamak amacıyla gösterilmiştir.</span></p>
      </section>

      <!-- 2. Modül: Bağımlı ve bağımsız değişkenler -->
      <section class="kart juri-bolum" id="juri-mod2">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">2</span>
          <div>
            <h2>${esc(J.degiskenler.baslik)}</h2>
            <p class="juri-kazanim"><b>Öğrenme kazanımı:</b> ${esc(J.degiskenler.kazanim)}</p>
            <p class="juri-alt-aciklama">Bu kazanım için bir standart içerik (kontrol grubu) ve altı farklı kişiselleştirilmiş içerik (deney grubu) hazırlanmıştır. Konu anlatımı sabit tutulmuş; yalnızca çözümlü örnekler ve mikro-görevler kişiselleştirilmiştir.</p>
          </div>
        </div>

        <div class="juri-grup-kutu kontrol-kutu">
          <div class="juri-etiket-satir">
            <span class="juri-grup-etiket kontrol">Standart içerik — Kontrol grubu</span>
          </div>
          <div class="juri-iki-sutun">
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Çözümlü örnek</small>
              <p>${esc(dSt.ornekMetin)}</p>
              <div class="juri-cozum-kutu">
                <b>Çözüm</b>
                <dl>
                  <div><dt>Bağımsız değişken:</dt><dd>${esc(dSt.bagimsiz)}</dd></div>
                  <div><dt>Bağımlı değişken:</dt><dd>${esc(dSt.bagimli)}</dd></div>
                  <div><dt>Gerekçe:</dt><dd>${esc(dSt.gerekce)}</dd></div>
                </dl>
              </div>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Mikro-görev</small>
              <p>${esc(dSt.gorevMetin)}</p>
              <div class="juri-soru-listesi">
                <div class="juri-soru-alan"><label>Bağımsız değişken nedir?</label><input class="girdi" placeholder="Cevabını yaz..."></div>
                <div class="juri-soru-alan"><label>Bağımlı değişken nedir?</label><input class="girdi" placeholder="Cevabını yaz..."></div>
              </div>
              <button type="button" class="btn ghost tam juri-cozum-btn" data-act="juriCozumAc" data-key="deg-standart">${acikMiCozum('deg-standart') ? 'Cevabı gizle' : 'Cevabımı kontrol et'}</button>
              ${acikMiCozum('deg-standart') ? `<div class="juri-cozum-kutu acilir">
                <dl>
                  <div><dt>Bağımsız değişken:</dt><dd>${esc(dSt.gorevBagimsiz)}</dd></div>
                  <div><dt>Bağımlı değişken:</dt><dd>${esc(dSt.gorevBagimli)}</dd></div>
                  <div><dt>Gerekçe:</dt><dd>${esc(dSt.gorevGerekce)}</dd></div>
                </dl>
              </div>` : ''}
            </div>
          </div>
        </div>

        <div class="juri-grup-kutu deney-kutu">
          <div class="juri-deney-ust">
            <div>
              <span class="juri-grup-etiket deney">Kişiselleştirilmiş içerikler — Deney grubu</span>
              <p class="juri-deney-aciklama">Aşağıdaki etkileşimli alanda öğrenci profilini değiştirerek aynı kazanıma yönelik örnek ve mikro-görevlerin nasıl değiştiğini inceleyebilirsin.</p>
            </div>
            <label class="juri-secici-etiket">
              <small>Simüle edilmiş öğrenci profili seç</small>
              <select id="juriProfSelect" class="juri-select">
                ${J.profiller.map((p, i) => `<option value="${i}"${i === pIdx ? ' selected' : ''}>${esc(p.etiket)}</option>`).join('')}
              </select>
            </label>
          </div>

          <div class="juri-secili-serit">
            ${obj(aktP.obj)}
            <div class="juri-serit-bilgi">
              <b>${esc(aktP.altKategori)}</b>
              <span class="juri-serit-aciklama">${esc(aktP.ozgulKisa)}</span>
              <div class="juri-serit-etiketler">
                ${aktP.etkilesimler.map(e => `<span class="serit-etk">${esc(e)}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="juri-iki-sutun">
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Çözümlü örnek</small>
              <p>${esc(dDn.ornekMetin)}</p>
              <div class="juri-cozum-kutu">
                <b>Çözüm</b>
                <dl>
                  <div><dt>Bağımsız değişken:</dt><dd>${esc(dDn.bagimsiz)}</dd></div>
                  <div><dt>Bağımlı değişken:</dt><dd>${esc(dDn.bagimli)}</dd></div>
                  <div><dt>Gerekçe:</dt><dd>${esc(dDn.gerekce)}</dd></div>
                </dl>
              </div>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Mikro-görev</small>
              <p>${esc(dDn.gorevMetin)}</p>
              <div class="juri-soru-listesi">
                <div class="juri-soru-alan"><label>Bağımsız değişken nedir?</label><input class="girdi" placeholder="Cevabını yaz..."></div>
                <div class="juri-soru-alan"><label>Bağımlı değişken nedir?</label><input class="girdi" placeholder="Cevabını yaz..."></div>
              </div>
              <button type="button" class="btn ghost tam juri-cozum-btn" data-act="juriCozumAc" data-key="deg-${aktP.id}">${acikMiCozum('deg-' + aktP.id) ? 'Cevabı gizle' : 'Cevabımı kontrol et'}</button>
              ${acikMiCozum('deg-' + aktP.id) ? `<div class="juri-cozum-kutu acilir">
                <dl>
                  <div><dt>Bağımsız değişken:</dt><dd>${esc(dDn.gorevBagimsiz)}</dd></div>
                  <div><dt>Bağımlı değişken:</dt><dd>${esc(dDn.gorevBagimli)}</dd></div>
                  <div><dt>Gerekçe:</dt><dd>${esc(dDn.gorevGerekce)}</dd></div>
                </dl>
              </div>` : ''}
            </div>
          </div>

          <div class="juri-gezgin">
            <button type="button" class="btn ghost" data-act="juriProfAdim" data-yon="-1"${pIdx === 0 ? ' disabled' : ''}>${ic('sol')}Önceki öğrenci</button>
            <span><b>${pIdx + 1}/${J.profiller.length}</b></span>
            <button type="button" class="btn ghost" data-act="juriProfAdim" data-yon="1"${pIdx === J.profiller.length - 1 ? ' disabled' : ''}>Sonraki öğrenci${ic('sag')}</button>
          </div>
        </div>
      </section>

      <!-- 3. Modül: Evren ve örneklem -->
      <section class="kart juri-bolum">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">3</span>
          <div>
            <h2>${esc(ev.baslik)}</h2>
            <p class="juri-kazanim"><b>Öğrenme kazanımı:</b> ${esc(ev.kazanim)}</p>
            <p class="juri-alt-aciklama">Bu kez standart ve kişiselleştirilmiş içerikler yan yana gösterilmektedir. Jüriye kişiselleştirmenin sınırlarını anlatmak açısından bu gösterim daha işlevseldir.</p>
          </div>
        </div>

        <label class="juri-secici-etiket juri-tam-secici">
          <small>Kişiselleştirilmiş içeriğin öğrenci profili</small>
          <select id="juriEvrenSelect" class="juri-select">
            ${J.profiller.map((p, i) => `<option value="${i}"${i === evIdx ? ' selected' : ''}>${esc(ev.deney[p.id].seciciEtiket)}</option>`).join('')}
          </select>
        </label>

        <div class="juri-iki-sutun">
          <div class="juri-grup-kutu kontrol-kutu">
            <div class="juri-yan-bas">
              <small>${esc(ev.standart.grup)}</small>
              <h3>${esc(ev.standart.altBaslik)}</h3>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Çözümlü örnek</small>
              <p>${esc(ev.standart.ornekMetin)}</p>
              <div class="juri-cozum-kutu">
                <dl>
                  <div><dt>Evren:</dt><dd>${esc(ev.standart.evren)}</dd></div>
                  <div><dt>Örneklem:</dt><dd>${esc(ev.standart.orneklem)}</dd></div>
                  <div><dt>Örneklem büyüklüğü:</dt><dd>${esc(ev.standart.buyukluk)}</dd></div>
                </dl>
              </div>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Mikro-görev</small>
              <p>${esc(ev.standart.gorevMetin)}</p>
              <button type="button" class="btn ghost tam juri-cozum-btn" data-act="juriCozumAc" data-key="ev-standart">${acikMiCozum('ev-standart') ? 'Çözümü gizle' : 'Çözümü göster'}</button>
              ${acikMiCozum('ev-standart') ? `<div class="juri-cozum-kutu acilir">
                <dl>
                  <div><dt>Evren:</dt><dd>${esc(ev.standart.gorevEvren)}</dd></div>
                  <div><dt>Örneklem:</dt><dd>${esc(ev.standart.gorevOrneklem)}</dd></div>
                  <div><dt>Örneklem büyüklüğü:</dt><dd>${esc(ev.standart.gorevBuyukluk)}</dd></div>
                </dl>
              </div>` : ''}
            </div>
          </div>

          <div class="juri-grup-kutu deney-kutu">
            <div class="juri-yan-bas">
              <small>${esc(evDn.grup)}</small>
              <h3>${esc(evDn.altBaslik)}</h3>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Çözümlü örnek</small>
              <p>${esc(evDn.ornekMetin)}</p>
              <div class="juri-cozum-kutu">
                <dl>
                  <div><dt>Evren:</dt><dd>${esc(evDn.evren)}</dd></div>
                  <div><dt>Örneklem:</dt><dd>${esc(evDn.orneklem)}</dd></div>
                  <div><dt>Örneklem büyüklüğü:</dt><dd>${esc(evDn.buyukluk)}</dd></div>
                </dl>
              </div>
            </div>
            <div class="juri-icerik-kart">
              <small class="juri-kart-ust">Mikro-görev</small>
              <p>${esc(evDn.gorevMetin)}</p>
              <button type="button" class="btn ghost tam juri-cozum-btn" data-act="juriCozumAc" data-key="ev-deney-${evP.id}">${acikMiCozum('ev-deney-' + evP.id) ? 'Çözümü gizle' : 'Çözümü göster'}</button>
              ${acikMiCozum('ev-deney-' + evP.id) ? `<div class="juri-cozum-kutu acilir">
                <dl>
                  <div><dt>Evren:</dt><dd>${esc(evDn.gorevEvren)}</dd></div>
                  <div><dt>Örneklem:</dt><dd>${esc(evDn.gorevOrneklem)}</dd></div>
                  <div><dt>Örneklem büyüklüğü:</dt><dd>${esc(evDn.gorevBuyukluk)}</dd></div>
                </dl>
              </div>` : ''}
            </div>
          </div>
        </div>
        <p class="juri-dipnot">${ic('bilgi')}<span>${esc(ev.not)}</span></p>
      </section>

      <!-- 4. Modül: Araştırma desenleri -->
      <section class="kart juri-bolum">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">4</span>
          <div>
            <h2>${esc(J.desenler.baslik)}</h2>
            <p class="juri-kazanim"><b>Öğrenme kazanımı:</b> ${esc(J.desenler.kazanim)}</p>
          </div>
        </div>

        <div class="juri-desen-liste">
          ${J.desenler.kartlar.map(k => `<div class="juri-grup-kutu ${k.id === 'kontrol' ? 'kontrol-kutu' : 'deney-kutu'}">
            <div class="juri-desen-bas">
              ${k.obj ? obj(k.obj) : `<span class="juri-kitap-ikon">${ic('katman')}</span>`}
              <div>
                <b>${esc(k.ust)}</b>
                <small>${esc(k.grup)}</small>
              </div>
            </div>
            <div class="juri-iki-sutun">
              <div class="juri-icerik-kart">
                <small class="juri-kart-ust">Çözümlü örnek</small>
                <p>${esc(k.ornekMetin)}</p>
                <div class="juri-cozum-kutu">
                  <b>Araştırma deseni: ${esc(k.ornekDesen)}</b>
                  <p>${esc(k.ornekGerekce)}</p>
                </div>
              </div>
              <div class="juri-icerik-kart">
                <small class="juri-kart-ust">Mikro-görev</small>
                <p>${esc(k.gorevMetin)}</p>
                <button type="button" class="btn ghost juri-cozum-btn" data-act="juriCozumAc" data-key="desen-${k.id}">${acikMiCozum('desen-' + k.id) ? 'Beklenen cevabı gizle' : 'Beklenen cevabı göster'} ${ic('asagi')}</button>
                ${acikMiCozum('desen-' + k.id) ? `<div class="juri-cozum-kutu acilir">
                  <b>Araştırma deseni: ${esc(k.beklenenDesen)}</b>
                  <p>${esc(k.beklenenGerekce)}</p>
                </div>` : ''}
              </div>
            </div>
          </div>`).join('')}
        </div>
      </section>

      <!-- 5. Jüriye özellikle gösterilecek karşılaştırma (Ağaç diyagramı) -->
      <section class="kart juri-bolum juri-vurgu-kart">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">5</span>
          <div>
            <h2>Jüriye özellikle gösterilecek karşılaştırma</h2>
            <p>Sunumda en dikkat çekici örnek, iki öğrencinin de basketbol kategorisini seçmesine rağmen farklı içerikler almasıdır. Bu örnek, geliştirilen zenginleştirilmiş ilgi toplama yönteminin neden gerekli olduğunu doğrudan göstermektedir.</p>
          </div>
        </div>

        <div class="juri-agac">
          <div class="juri-agac-kok">
            ${obj('top')}
            <b>Spor → Basketbol</b>
            <span>Her iki öğrencinin ilgi yoğunluğu: 5/5</span>
          </div>
          <div class="juri-agac-dallanma" aria-hidden="true"><span>↓</span><span>↓</span></div>

          <div class="juri-iki-sutun">
            <div class="juri-dal-kol">
              <div class="juri-ab-kart">
                <div class="juri-ab-bas">
                  <b>Öğrenci A</b>
                  <span class="juri-ab-etiket">İzleyici ve İstatistik</span>
                </div>
                <dl class="juri-ab-profil">
                  <div><dt>Etkileşim biçimi</dt><dd>Maç izlemek, istatistik incelemek</dd></div>
                  <div><dt>Özgül ilgi</dt><dd>EuroLeague, Anadolu Efes</dd></div>
                </dl>
              </div>
              <div class="juri-dal-ok" aria-hidden="true">↓</div>
              <div class="juri-ab-baglam">
                <b>Kişiselleştirilmiş bağlam A</b>
                <p>Hücum stratejilerinin takımın sayı üretimine etkisi.</p>
                <div class="juri-deg-satir">
                  <div><small>Bağımsız değişken</small><b>Hücum stratejisi</b></div>
                  <div><small>Bağımlı değişken</small><b>Atılan toplam sayı</b></div>
                </div>
              </div>
            </div>

            <div class="juri-dal-kol">
              <div class="juri-ab-kart">
                <div class="juri-ab-bas">
                  <b>Öğrenci B</b>
                  <span class="juri-ab-etiket turuncu">Oyuncu ve Antrenman</span>
                </div>
                <dl class="juri-ab-profil">
                  <div><dt>Etkileşim biçimi</dt><dd>Basketbol oynamak, antrenman yapmak</dd></div>
                  <div><dt>Özgül ilgi</dt><dd>Üç sayılık atışlar</dd></div>
                </dl>
              </div>
              <div class="juri-dal-ok" aria-hidden="true">↓</div>
              <div class="juri-ab-baglam">
                <b>Kişiselleştirilmiş bağlam B</b>
                <p>Antrenman süresinin üç sayılık atış başarısına etkisi.</p>
                <div class="juri-deg-satir">
                  <div><small>Bağımsız değişken</small><b>Antrenman süresi</b></div>
                  <div><small>Bağımlı değişken</small><b>Başarılı atış sayısı</b></div>
                </div>
              </div>
            </div>
          </div>

          <div class="juri-agac-birlestir" aria-hidden="true"><span>↓</span><span>↓</span></div>
          <div class="juri-agac-hedef">
            <b>Aynı öğrenme kazanımı</b>
            <span>Araştırma senaryosunda bağımlı ve bağımsız değişkenleri belirleme</span>
          </div>
        </div>
      </section>

      <!-- 6. Kişiselleştirmede deneysel eşdeğerliğin korunması -->
      <section class="kart juri-bolum">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">6</span>
          <div>
            <h2>Kişiselleştirmede deneysel eşdeğerliğin korunması</h2>
            <p>Jüri üyelerinin özellikle sorabileceği bir konu, kişiselleştirilmiş içeriğin kontrol grubuna göre daha kolay veya zor olup olmadığıdır. Tez önerisinde de bu eşdeğerliğin korunacağı belirtilmiştir:</p>
          </div>
        </div>
        <div class="juri-tablo-sarici">
          <table class="juri-tablo">
            <thead>
              <tr><th>İçerik bileşeni</th><th>Standart</th><th>Kişiselleştirilmiş</th><th>Tasarım kararı</th></tr>
            </thead>
            <tbody>
              ${J.esdegerlik.map(([bilesen, st, dn, karar]) => `<tr>
                <td><b>${esc(bilesen)}</b></td>
                <td>${esc(st)}</td>
                <td>${esc(dn)}</td>
                <td><span class="karar-etiket ${karar === 'Sabit' ? 'sabit' : karar === 'Değişken' ? 'degisken' : 'kontrol'}">${esc(karar)}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p class="juri-dipnot">${ic('ampul')}<span><b>Burada son madde özellikle önemli:</b> Örneğin Age of Empires oynayan bir öğrenciye sunulan araştırma senaryosu, araştırma yöntemleri bilgisini ölçmeli; öğrencinin Age of Empires oyunundaki ustalığını değil.</span></p>
      </section>

      <!-- 7. Jüri sunumunda kullanılabilecek açıklama ve metodolojik not -->
      <section class="kart juri-bolum juri-aciklama-kart">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">7</span>
          <div>
            <h2>Jüri sunumunda kullanılabilecek açıklama</h2>
          </div>
        </div>
        <div class="juri-metin-blok">
          <p>Geliştirilen kişiselleştirme mekanizması, öğrencilerin yalnızca genel ilgi alanlarını değil, bu alanlara yönelik <b>ilgi yoğunluklarını</b>, <b>etkileşim biçimlerini</b> ve <b>özgül ilgi nesnelerini</b> de dikkate almaktadır. Böylece aynı ilgi kategorisini seçen öğrenciler için dahi farklı bağlamlarda öğrenme içerikleri oluşturulabilmektedir.</p>
          <p>Örneğin basketbola ilgi duyan ve basketbol maçlarını takip ederek oyuncu istatistiklerini incelemekten hoşlanan bir öğrenci için <em>takım performansı ve maç istatistikleri</em> üzerinden bir araştırma senaryosu oluşturulurken, basketbol oynamayı ve atış antrenmanı yapmayı seven bir öğrenci için <em>antrenman süresi ve atış başarısı</em> üzerinden bir senaryo oluşturulabilmektedir.</p>
          <p>Bu süreçte öğrenme kazanımları, görev yapısı ve değerlendirme ölçütleri korunmakta; yalnızca çözümlü örneklerin ve mikro-görevlerin bağlamı öğrencinin ilgi profiline göre uyarlanmaktadır. Böylece kişiselleştirme, belirli kişi veya nesne adlarının standart içeriğe yerleştirilmesiyle sınırlı kalmamakta, öğrencinin ilgi alanıyla kurduğu ilişkinin öğrenme görevinin bağlamına yansıtılması hedeflenmektedir.</p>
        </div>
        <aside class="ar-not">
          <h3>Metodolojik not</h3>
          <p>Burada hazırlanan içerikler jüriye kişiselleştirme mekanizmasını göstermek amacıyla üretilmiş simülasyonlardır. Öğrenme konuları tez önerisinde belirtilen kapsamdan seçilmiştir. Nihai uygulamadan önce standart ve kişiselleştirilmiş sürümlerin metin uzunluğu, bilişsel talep, alan bilgisi gereksinimi, görsel kullanımı ve pedagojik eşdeğerliği uzmanlar tarafından değerlendirilmelidir.</p>
        </aside>
      </section>
      <!-- 8. Alternatif sunum biçimi: Seslendirilmiş etkileşimli çözümlü örnek -->
      <section class="kart juri-bolum" id="juri-slayt">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">8</span>
          <div>
            <h2>Alternatif sunum biçimi: Çoklu ortam destekli, adım adım çözümlü örnek</h2>
            <p>Konu anlatım videosundan sonra statik metin yerine Google Learn Your Way'deki <em>Slides &amp; Narration</em> yaklaşımından esinlenen, seslendirilmiş ve öğrenci kontrollü etkileşimli çözümlü örnek sunumu. Aşağıdaki üç profil arasında geçiş yaparak eşdeğer yapıyı inceleyebilirsiniz.</p>
          </div>
        </div>

        <div class="juri-slayt-seciciler" role="tablist" aria-label="Çözümlü örnek profili seç">
          ${(window.SlaytSunum ? window.SlaytSunum.PROFILLER : []).map((pr, idx) => `<button type="button" class="juri-slayt-tab${idx === (UI.juriSlaytProf || 0) ? ' on' : ''}" data-act="juriSlaytProf" data-i="${idx}" role="tab" aria-selected="${idx === (UI.juriSlaytProf || 0)}">${esc(pr.etiket)}</button>`).join('')}
        </div>

        <div id="juriSlaytHost"></div>

        <div class="juri-ctml-izgara">
          <div class="juri-ctml-kutu">
            <b>Mayer CTML Tasarım İlkeleri</b>
            <p><b>Bölümlere ayırma:</b> Çözüm 5 kısa adıma bölünür. <b>İşaretleme:</b> Bağımsız değişken yeşil, bağımlı değişken turuncu vurgulanır. <b>Gereksiz tekrarın önlenmesi:</b> Seslendirme metni varsayılan olarak gizlidir, öğrenci isterse <em>Metin</em> düğmesiyle açar.</p>
          </div>
          <div class="juri-ctml-kutu">
            <b>Deneysel Eşdeğerliğin Korunması</b>
            <p>Kontrol grubuna <em>standart sesli sunum</em>, deney grubuna ise <em>kişiselleştirilmiş sesli sunum</em> verilir. Slayt sayısı (5), ses modeli, konuşma hızı, yaklaşık süre (~78 sn) ve bilişsel talep her iki grupta aynıdır; yalnızca bağlam değişir.</p>
          </div>
        </div>
      </section>

      <!-- 9. Etkileşimli Mikro-Görev Prototipi ve 6 Şablon Kütüphanesi -->
      <section class="kart juri-bolum" id="juri-gorev">
        <div class="juri-bolum-bas">
          <span class="juri-adim-no">9</span>
          <div>
            <h2>Etkileşimli mikro-görev prototipi ve şablon kütüphanesi</h2>
            <p>Çözümlü örnekten mikro-göreve geçildiğinde öğrenci izleyici konumundan uygulayıcı konumuna geçer. Klasik sınav ekranı yerine araştırma senaryosu, görsel veri, isteğe bağlı seslendirme, ipucu ve açıklayıcı geri bildirim sunulur.</p>
          </div>
        </div>

        <div class="butunluk-izgara">
          <div class="butunluk-adim"><small>1 · Konu anlatımı</small><b>Öğren</b><p>Video ile bağımlı ve bağımsız değişkenlerin açıklanması.</p></div>
          <div class="butunluk-adim"><small>2 · Çözümlü örnek</small><b>İncele</b><p>Hücum stratejisi ve atılan sayı üzerinden adım adım çözüm.</p></div>
          <div class="butunluk-adim"><small>3 · Mikro-görev</small><b>Uygula</b><p>Paslaşma düzeni ve asist sayısı gibi yeni bir senaryoya transfer.</p></div>
          <div class="butunluk-adim"><small>4 · Geri bildirim</small><b>Pekiştir</b><p>Yanıta özgü ipucu ve açıklayıcı biçimlendirici dönüt.</p></div>
        </div>

        <div class="juri-slayt-seciciler" role="tablist" aria-label="Mikro-görev senaryo profili seç">
          ${(window.GorevPrototip ? window.GorevPrototip.SENARYOLAR : []).map((sr, idx) => `<button type="button" class="juri-slayt-tab${idx === (UI.juriGorevProf || 0) ? ' on' : ''}" data-act="juriGorevProf" data-i="${idx}" role="tab" aria-selected="${idx === (UI.juriGorevProf || 0)}">${esc(sr.etiket)}</button>`).join('')}
        </div>

        <div id="juriGorevHost"></div>

        <div class="juri-bolum-bas" style="margin-top:8px">
          <div>
            <h3>Mikro-görevler için 6 alternatif etkileşim şablonu</h3>
            <p>Yapay zekâ her öğrenci için yeni arayüz üretmez; aşağıdaki sabit pedagojik şablonları öğrencinin ilgi profiline uygun içerikle doldurur.</p>
          </div>
        </div>

        <div id="juriSablonHost"></div>

        <div class="juri-tablo-sarici">
          <table class="juri-tablo">
            <thead>
              <tr><th>Bileşen</th><th>Çözümlü örnek</th><th>Mikro-görev (İsteğe bağlı ses)</th></tr>
            </thead>
            <tbody>
              ${(window.GorevPrototip ? window.GorevPrototip.TABLO_KARS : []).map(([b, c, m]) => `<tr><td><b>${esc(b)}</b></td><td>${esc(c)}</td><td>${esc(m)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>`);
  }

  /* ---------- Ders ekranı ---------- */
  function akis(m, k) {
    const gr = {};
    adimlar(m).forEach(a => (gr[a.grup] = gr[a.grup] || []).push(a));
    return `<aside class="akis"><h2>Bu modülde</h2>${Object.entries(gr).map(([g, l]) => `<h3>${g}</h3><div class="akis-grup">${l.map(a => `<a class="akis-adim${a.t ? ' t' : ''}${a.k === k ? ' on' : ''}" data-adim="${a.k}" href="#ders-${m.id}-${a.k}"><span class="akis-durum">${a.t ? ic('check') : ''}</span><span class="akis-baslik">${a.ad}</span>${a.ek ? `<time>${a.ek}</time>` : ''}</a>`).join('')}</div>`).join('')}</aside>`;
  }
  const ileri = (m, k, act, metin = 'Devam et') => { const s = sonrakiAdim(m, k); return `<div class="adim-alt"><span>Sıradaki: ${adimAdi(m, s)}</span><a class="btn lg" href="#ders-${m.id}-${s}" data-act="${act}" data-m="${m.id}" data-k="${k}">${metin} ${ic('sag')}</a></div>`; };

  function dVideo(m, j) {
    const v = m.videolar[j], no = D.moduller.indexOf(m) + 1;
    const videoSrc = v.video ? `${encodeURI(v.video)}#t=0.05` : `assets/video/m${no}.mp4`;
    const kapakBtn = v.video
      ? `<button class="vp-kapak vp-kapak-video" id="vpKapak" aria-label="Videoyu oynat"><span class="vp-buyuk">${ic('play')}</span><small>Video ${j + 1}/${m.videolar.length}</small><h2>${v.ad}</h2></button>`
      : `<button class="vp-kapak kapak${ac(m)}" id="vpKapak" aria-label="Videoyu oynat"><span class="vp-buyuk">${ic('play')}</span><small>Video ${j + 1}/${m.videolar.length}</small><h2>${v.ad}</h2>${obj(m.obj, j * 0.9 - 0.6)}</button>`;
    return `<div class="vp" id="vp" data-sure="${sn(v.sure)}" data-m="${m.id}" data-j="${j}">
        <video id="vid" src="${videoSrc}" preload="metadata" playsinline></video>
        ${kapakBtn}
        <div class="vp-kontrol"><button id="vpOyna" aria-label="Oynat / duraklat">${ic('play')}</button><span id="vpZaman">0:00 / ${v.sure}</span>
          <div class="vp-cubuk" id="vpCubuk" role="slider" aria-label="Video konumu" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span><i id="vpIlerle"></i></span></div>
          <button id="vpHiz" aria-label="Oynatma hızı">1×</button><button id="vpTam" aria-label="Tam ekran">${ic('tam')}</button></div></div>
      <div class="v-alt"><div class="v-bilgi"><h1>${v.ad}</h1><p>${v.ozet}</p></div>
        <div class="v-bolum"><h3>Bölümler</h3>${v.bolumler.map(([t, a]) => `<button data-act="bolum" data-t="${sn(t)}"><time>${t}</time>${a}</button>`).join('')}</div></div>
      ${ileri(m, 'v' + (j + 1), 'videoTamam')}`;
  }

  function gorsel(g, c) {
    switch (g.tip) {
      case 'alinti': return `<blockquote class="g-alinti${g.zayif ? ' zayif' : ''}">${esc(g.metin)}</blockquote>`;
      case 'karsilastir': return `<div class="g-kars"><div><small>${ic('x')}${g.a[0]}</small><p>${esc(g.a[1])}</p></div><div><small>${ic('check')}${g.b[0]}</small><p>${esc(g.b[1])}</p></div></div>`;
      case 'akis': return `<div class="g-akis">${g.adimlar.map(([b, s]) => `<div><b>${b}</b><span>${esc(s)}</span></div>`).join('')}</div>`;
      case 'degisken': return `<div class="deg"><div class="dk"><small>Bağımsız değişken</small><b>${c.bagimsiz}</b></div>${ic('sag')}<div class="dk b"><small>Bağımlı değişken</small><b>${c.bagimli}</b></div><div class="deg-k">Kontrol altında tutulanlar ${c.kontrol.map(x => `<span>${x}</span>`).join('')}</div></div>`;
      case 'desen': return `<div class="g-desen"><b>${g.ad}</b><p>${esc(g.soru)}</p><span>${g.nasil}</span></div>`;
      case 'nokta': {
        const sec = { evren: [[], [], []], rastgele: [[3, 8, 11, 15, 17], [2, 6, 13, 19], []], tabakali: [[2, 9, 16], [4, 11, 17], [1, 8, 14]] }[g.mod];
        return `<figure class="g-nokta">${c.tabakalar.map((t, ti) => `<div class="t${ti}"><label>${t}</label><div class="satir">${Array.from({ length: 20 }, (_, n) => `<i class="r${sec[ti].includes(n) ? ' s' : ''}"></i>`).join('')}</div></div>`).join('')}<figcaption>${esc(g.not)}</figcaption></figure>`;
      }
      case 'arac': return `<div class="g-arac"><small>Ölçülecek şey</small><b>${c.bagimli}</b><small class="g-arac-ara">Ölçme aracı</small><b>${c.arac}</b></div>`;
      case 'hedef': {
        const h = pts => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(--bg)" stroke="var(--cizgi)" stroke-width="2"/><circle cx="50" cy="50" r="31" fill="none" stroke="var(--cizgi)" stroke-width="2"/><circle cx="50" cy="50" r="16" fill="none" stroke="var(--cizgi)" stroke-width="2"/><circle cx="50" cy="50" r="4" fill="var(--cizgi)"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--vurgu)"/>`).join('')}</svg>`;
        return `<div class="g-hedef"><div>${h([[72, 26], [77, 31], [69, 32], [74, 22], [79, 25]])}<span>Tutarlı ama yanlış yeri ölçüyor</span></div><div>${h([[48, 49], [53, 52], [50, 45], [45, 53], [55, 47]])}<span>Tutarlı ve doğru yeri ölçüyor</span></div></div>`;
      }
      case 'tablo': return `<table class="g-tablo"><thead><tr><th>Grup</th><th>${c.veri.olcu}</th></tr></thead><tbody>${c.veri.etiket.map((e, i) => `<tr><td>${e}</td><td>${sayi(c.veri.deger[i])}</td></tr>`).join('')}</tbody></table>`;
      case 'grafik': return grafikHTML(c);
      default: return '';
    }
  }
  function grafikHTML(c) {
    const max = Math.max(...c.veri.deger) * 1.15;
    return `<figure class="g-grafik"><figcaption>${c.veri.olcu}</figcaption>
      <div class="alan-g">${c.veri.deger.map(v => `<div class="sutun"><b>${sayi(v)}</b><i style="height:${(v / max * 100).toFixed(1)}%"></i></div>`).join('')}</div>
      <div class="etk">${c.veri.etiket.map(e => `<span>${e}</span>`).join('')}</div></figure>`;
  }

  function bagSecici(m, b) {
    const l = siraliAltlar(), p = P();
    if (l.length < 2) return '';
    const gruplar = p.secilen.map(ilgi).filter(Boolean).map(k => ({ k, l: l.filter(x => x.k === k) })).filter(g => g.l.length);
    return `<label class="bag" for="bagSec"><small>Örneğin konusu</small><select id="bagSec" data-m="${m.id}">${gruplar.map(g => `<optgroup label="${g.k.ad}">${g.l.map(x => `<option value="${x.a.id}"${x.a.id === b.alt.id ? ' selected' : ''}>${esc(x.a.ad)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
  }
  function senaryo(b, c) {
    return `<div class="senaryo kapak${ac(b.ilgi)}" style="${stil(b.ilgi)}"><div><small>${esc(b.alt.ad)}</small><h2>${c.tema}</h2>${b.detay ? `<p class="sen-detay">Senin notun: “${esc(b.detay)}”</p>` : ''}</div>${obj(b.ilgi.obj, 0.3)}</div>`;
  }
  function arastirmaNotu(m, b) {
    if (!UI.notlar) return '';
    const kucuk = s => s.toLocaleLowerCase('tr');
    const neden = b.neden === 'secim' ? 'Bağlam, “Örneğin konusu” seçicisiyle elle değiştirildi. Asıl uygulamada bu seçici olmayacak.'
      : `En az 3 puan verilen alt alanlar, farklı ilgi alanlarına öncelik verilerek modüllere sırayla dağıtılır. Bu modüle düşen alt alan: ${esc(b.alt.ad)} (${b.p}/5).`;
    const tane = b.duzey === 'alt'
      ? `Alt alan düzeyi. Senaryo ${kucuk(b.ilgi.ad)} genelinden değil, doğrudan ${esc(kucuk(b.alt.ad))} için yazıldı.${b.detay ? ' Öğrencinin profilde yazdığı not başlıkta gösteriliyor; bu, bireysel düzeye yaklaşan bir adım.' : ''}`
      : `Kategori düzeyi. Öğrencinin eklediği “${esc(b.alt.ad)}” için hazır senaryo yok; ${kucuk(b.ilgi.ad)} kategorisinin genel senaryosu kullanılıyor. Asıl uygulamada bu alanlar için senaryo yazılması ya da üretilmesi gerekir.`;
    const derin = b.c.derinlik ? `Derin. ${b.c.derinlik} Değişkenler ve sayılar o alanın kendi uygulamasından geliyor; yalnızca isimler değiştirilmiyor.` : 'Yüzeye yakın. Kategori senaryosu öğrencinin eklediği alanın kendine özgü uygulamalarını yansıtmıyor.';
    const acikUclu = m.gorev.parcalar.some(p => ['soruYaz', 'gorusme', 'bulguYaz'].includes(p));
    return `<aside class="ar-not" aria-label="Araştırmacı notu"><h3>Kişiselleştirme notu <small>Öğrenci bu kutuyu görmez</small></h3><dl>
      <div><dt>Neden bu bağlam</dt><dd>${neden}</dd></div>
      <div><dt>Ayrıntı düzeyi (grain size)</dt><dd>${tane}</dd></div>
      <div><dt>Derinlik (depth)</dt><dd>${derin}</dd></div>
      <div><dt>Sahiplik (ownership)</dt><dd>Alt alanları öğrenci kendisi seçti ve puanladı${b.alt.ozel ? '; bu alt alanı listeye öğrenci ekledi' : ''}.${acikUclu ? ' Açık uçlu görevde öğrenci kendi metnini yazıyor.' : ''}</dd></div>
      <div><dt>Sabit tutulanlar</dt><dd>Konu anlatım videoları, adım sayısı, görev türü ve ölçekler bütün öğrencilerde aynı. Yalnızca örneğin bağlamı değişiyor.</dd></div>
    </dl></aside>`;
  }

  function dersDenetimDurumBanner(m) {
    if (!UI.canliSonuc || UI.canliSonuc.modulId !== m.id) return '';
    const s = UI.canliSonuc;
    const onDenetimAcik = UI.uretim.onDenetimAcik !== false;
    const goren = ogrenciGorebilirMi(s);
    if (!onDenetimAcik) {
      return `<div class="ders-denetim-serit acik">
        <div><b>Canlı API İçeriği (Ön Denetim Kapalı — Doğrudan Öğrenciye Açık):</b> <span>${esc(s.profil.altKategori)} bağlamında üretilen içerik denetimsiz modda doğrudan gösteriliyor.</span></div>
        <a class="btn ghost" href="#canli">Denetim Merkezini Aç</a>
      </div>`;
    }
    if (goren) {
      const ak = (s.denetim && s.denetim.akademisyenKarar) || {};
      return `<div class="ders-denetim-serit onayli">
        <div><b>✓ Akademisyen Onaylı YZ İçeriği:</b> <span>${esc(s.profil.altKategori)} bağlamında üretilen bu içerik Appendix B ön denetiminden ve <b>${esc(ak.akademisyenAd || 'Akademisyen')}</b> onayından geçerek öğrenciye açılmıştır.</span></div>
        <a class="btn ghost" href="#canli">Denetim Raporunu Gör</a>
      </div>`;
    }
    return `<div class="ders-denetim-serit kilitli">
      <div><b>🔒 YZ İçeriği Akademisyen Onayı Bekliyor:</b> <span>${esc(s.profil.altKategori)} için üretilen canlı YZ içeriği henüz akademisyen tarafından onaylanmadığı için öğrenciye gösterilmiyor (varsayılan içerik aktif).</span></div>
      <div class="ders-denetim-aks">
        <button type="button" class="btn onay-btn" data-act="akademisyenOnayla">${ic('check')}Akademisyen Olarak Onayla</button>
        <a class="btn ghost" href="#canli">Denetim Merkezine Git</a>
      </div>
    </div>`;
  }

  function dOrnek(m) {
    const p = il(m.id), b = baglamAl(m), c = b.c, adim = D.ornekler[m.id](c);
    const canliAktif = UI.canliSonuc && UI.canliSonuc.modulId === m.id && ogrenciGorebilirMi(UI.canliSonuc);
    if ((UI.ornekMod === 'slayt' || canliAktif) && window.SlaytSunum) {
      return `<div class="ic-bas"><div><h1>${m.ornek.ad}</h1><p>Seslendirilmiş ve adım adım ilerleyen etkileşimli çözümlü örnek · ${esc(canliAktif ? UI.canliSonuc.profil.altKategori : b.ilgi.ad)} bağlamı.</p></div>${bagSecici(m, b)}</div>
        ${dersDenetimDurumBanner(m)}
        ${arastirmaNotu(m, b)}
        <div id="dersSlaytHost"></div>`;
    }
    const acik = UI.ornekAcik[m.id] || (p.ornek ? adim.length : 1);
    return `<div class="ic-bas"><div><h1>${m.ornek.ad}</h1><p>Konuyu adım adım, ${b.ilgi.ad.toLocaleLowerCase('tr')} dünyasından bir örnekle uygula.</p></div>${bagSecici(m, b)}</div>
      ${dersDenetimDurumBanner(m)}
      ${senaryo(b, c)}
      ${arastirmaNotu(m, b)}
      <ol class="adm">${adim.map((a, i) => i < acik
        ? `<li id="adm-${i}"><span class="adm-no">${i + 1}</span><div class="adm-ic"><div><h3>${a.b}</h3><p>${a.t}</p></div><div>${gorsel(a.g, c)}</div></div></li>`
        : `<li class="kapali"><span class="adm-no">${i + 1}</span><h3>${a.b}</h3></li>`).join('')}</ol>
      ${acik < adim.length
        ? `<div class="adim-alt"><span>${acik}/${adim.length} adım</span><button class="btn lg" data-act="ornekAc" data-m="${m.id}">Sonraki adım ${ic('asagi')}</button></div>`
        : ileri(m, 'ornek', 'ornekTamam', 'Mikro göreve geç')}`;
  }

  /* ---------- Mikro görev ---------- */
  const TB_RENK = ['#17A594', '#5B6BE8', '#F07BA0'];
  function gorevDurum(key, ctx, ilk) {
    let st = UI.gs[key];
    if (!st || st.ctx !== ctx) st = UI.gs[key] = { ctx, kontrol: false, ...ilk() };
    return st;
  }
  function gorevHTML(m, pk) {
    const b = baglamAl(m), c = b.c, g = D.gorevler[pk](c), key = m.id + '-' + pk;
    const kont = `<div class="gorev-alt"><button class="btn ghost" data-act="kontrol" data-key="${key}">Kontrol et</button></div>`;
    if (g.tip === 'sirala') {
      const st = gorevDurum(key, b.ilgi.id, () => ({ sira: karistir(g.ogeler.map((_, i) => i), key) }));
      const dogru = st.sira.filter((oi, pos) => oi === pos).length;
      return `<p class="gorev-soru">${g.soru}</p><p class="gorev-yon">Sürükleyerek ya da oklarla yerini değiştir.</p>
        <ol class="sr">${st.sira.map((oi, pos) => { const o = g.ogeler[oi]; return `<li draggable="true" data-pos="${pos}" class="${st.kontrol ? (oi === pos ? 'd' : 'y') : ''}"><span class="no">${pos + 1}</span>${ic('tut', 'tut')}<span class="sr-t"><b>${o[0]}</b><small>${esc(o[1])}</small></span><span class="sr-ok"><button data-act="srTasi" data-key="${key}" data-pos="${pos}" data-yon="-1" aria-label="${o[0]}: yukarı taşı"${pos ? '' : ' disabled'}>${ic('yukari')}</button><button data-act="srTasi" data-key="${key}" data-pos="${pos}" data-yon="1" aria-label="${o[0]}: aşağı taşı"${pos < st.sira.length - 1 ? '' : ' disabled'}>${ic('asagi')}</button></span></li>`; }).join('')}</ol>
        ${st.kontrol ? `<div class="gb ${dogru === st.sira.length ? 'd' : 'y'}">${ic('bilgi')}${dogru === st.sira.length ? 'Sıralama doğru. Araştırma soruyla başlar, raporla biter.' : `${dogru}/${st.sira.length} adım doğru yerde. Kırmızı olanları yeniden düşün.`}</div>` : ''}${kont}`;
    }
    if (g.tip === 'siniflandir') {
      const st = gorevDurum(key, b.ilgi.id, () => ({ yer: {}, sec: null, sira: karistir(g.ogeler.map((_, i) => i), key) }));
      const cip = i => `<button class="cip${st.sec === i ? ' sec' : ''}${st.kontrol && st.yer[i] != null ? (st.yer[i] === g.ogeler[i][1] ? ' d' : ' y') : ''}" draggable="true" data-act="cipSec" data-key="${key}" data-i="${i}" aria-pressed="${st.sec === i}">${esc(g.ogeler[i][0])}</button>`;
      const yerlesen = Object.keys(st.yer).length, dogru = g.ogeler.filter((o, i) => st.yer[i] === o[1]).length;
      return `<p class="gorev-soru">${esc(g.soru)}</p><p class="gorev-yon">${g.yonerge} Bir ifadeye dokun, sonra kutusunu seç.</p>
        <div class="havuz" data-act="kutuSec" data-key="${key}" data-kutu="-1">${st.sira.filter(i => st.yer[i] == null).map(cip).join('')}</div>
        <div class="kutular">${g.kutular.map((kt, ki) => `<div class="kutu" role="button" tabindex="0" data-act="kutuSec" data-key="${key}" data-kutu="${ki}"><h4>${kt}</h4>${st.sira.filter(i => st.yer[i] === ki).map(cip).join('')}</div>`).join('')}</div>
        ${st.kontrol ? `<div class="gb ${yerlesen === g.ogeler.length && dogru === yerlesen ? 'd' : 'y'}">${ic('bilgi')}${yerlesen < g.ogeler.length ? 'Önce bütün ifadeleri bir kutuya yerleştir.' : dogru === yerlesen ? 'Hepsi doğru yerde.' : `${dogru}/${yerlesen} doğru. Kırmızı olanları başka bir kutuya taşı.`}</div>` : ''}${kont}`;
    }
    if (g.tip === 'acik') {
      const v = S.cevap[key] || '';
      return `<p class="gorev-soru">${esc(g.soru)}</p><div class="acik-duzen"><div><textarea id="ta-${key}" data-cevap="${key}" placeholder="${esc(g.yer)}" aria-label="Yanıtın">${esc(v)}</textarea><span class="sayac" id="say-${key}">${kelime(v)} kelime · otomatik kaydedilir</span></div>
        <aside class="ipucu"><h4>Yazarken kontrol et</h4><ul>${g.ipucu.map(x => `<li>${x}</li>`).join('')}</ul></aside></div>`;
    }
    if (g.tip === 'orneklem') {
      const st = gorevDurum(key, b.ilgi.id, () => ({ sec: [[], [], []] }));
      const tamam = st.sec.every(s => s.length === g.adet);
      return `<p class="gorev-soru">${esc(g.soru)}</p><p class="gorev-yon">Her nokta bir ${c.birim}. Seçmek için dokun.</p>
        <div class="tabakalar">${g.tabakalar.map((t, ti) => { const n = st.sec[ti].length; return `<div class="tb" style="--tc:${TB_RENK[ti]}"><div class="tb-bas"><b>${t}</b><span class="${n === g.adet ? 'tam' : n > g.adet ? 'fazla' : ''}">${n}/${g.adet}</span></div><div class="tb-n">${Array.from({ length: 12 }, (_, ni) => `<button class="${st.sec[ti].includes(ni) ? 's' : ''}" data-act="tbSec" data-key="${key}" data-t="${ti}" data-n="${ni}" aria-pressed="${st.sec[ti].includes(ni)}" aria-label="${t}, ${ni + 1}. ${c.birim}"></button>`).join('')}</div></div>`; }).join('')}</div>
        ${st.kontrol ? `<div class="gb ${tamam ? 'd' : 'y'}">${ic('bilgi')}${tamam ? `Her tabakadan ${g.adet} ${c.birim} seçtin. Örneklemde üç grup da eşit biçimde temsil ediliyor.` : `Her tabakadan tam ${g.adet} ${c.birim} seçmelisin. Sayısı tutmayan tabakaları düzelt.`}</div>` : ''}${kont}`;
    }
    if (g.tip === 'secim') {
      const st = gorevDurum(key, b.ilgi.id, () => ({ sec: null, sira: karistir([0, 1, 2], key) }));
      return `<div class="iki-kol"><div>${grafikHTML(c)}</div><div class="secim-kol"><p class="gorev-soru">${g.soru}</p>
        <div class="secenekler" role="radiogroup">${st.sira.map(i => { const s = g.secenekler[i], on = st.sec === i; return `<button role="radio" aria-checked="${on}" class="secenek${on ? (st.kontrol ? (s[1] ? ' d' : ' y') : ' sec') : ''}" data-act="secenek" data-key="${key}" data-i="${i}"><i></i><span>${esc(s[0])}</span></button>`; }).join('')}</div>
        ${st.kontrol && st.sec != null ? `<div class="gb ${g.secenekler[st.sec][1] ? 'd' : 'y'}">${ic('bilgi')}${esc(g.secenekler[st.sec][2])}</div>` : ''}${kont}</div></div>`;
    }
    return '';
  }
  function dGorev(m) {
    const b = baglamAl(m);
    const canliAktif = UI.canliSonuc && UI.canliSonuc.modulId === m.id && ogrenciGorebilirMi(UI.canliSonuc);
    if ((UI.gorevMod === 'etkilesimli' || canliAktif) && window.GorevPrototip) {
      return `<div class="ic-bas"><div><h1>${m.gorev.ad}</h1><p>${canliAktif ? esc(UI.canliSonuc.gorev.baslik) : b.c.tema} · görsel ve ipucu destekli etkileşimli mikro-görev.</p></div>${bagSecici(m, b)}</div>
        ${dersDenetimDurumBanner(m)}
        ${arastirmaNotu(m, b)}
        <div id="dersGorevHost"></div>`;
    }
    return `<div class="ic-bas"><div><h1>${m.gorev.ad}</h1><p>${b.c.tema} örneği üzerinden.</p></div>${bagSecici(m, b)}</div>
      ${dersDenetimDurumBanner(m)}
      ${arastirmaNotu(m, b)}
      ${m.gorev.parcalar.map(pk => `<section class="gorev" data-gm="${m.id}" data-pk="${pk}">${gorevHTML(m, pk)}</section>`).join('')}
      ${ileri(m, 'gorev', 'gorevTamam', 'Görevi tamamla')}`;
  }
  function gorevYenile(key) {
    const [mid, pk] = key.split('-'), sec = $(`section[data-gm="${mid}"][data-pk="${pk}"]`);
    if (sec) sec.innerHTML = gorevHTML(modul(mid), pk);
  }

  /* ---------- Ölçekler ---------- */
  function dDuygu(m) {
    const p = il(m.id), n = Object.keys(p.duygu).length;
    return `<div class="ic-bas"><div><h1>Bu modülde neler hissettin?</h1><p>Her duyguyu ne kadar yaşadığını seç. Küçük daire “hiç”, büyük daire “çok yoğun” demek.</p></div></div>
      <div class="olcek"><div class="ol-ust"><span></span><div><span>Hiç</span><span>Çok yoğun</span></div></div>
        ${D.duygular.map((d, i) => `<div class="du"><b>${d}</b><div class="du-sec" role="radiogroup" aria-label="${d}">${[1, 2, 3, 4, 5].map(v => `<button class="b${v}${p.duygu[i] === v ? ' on' : ''}" role="radio" aria-checked="${p.duygu[i] === v}" aria-label="${d}: ${v}" data-act="olcek" data-tur="duygu" data-m="${m.id}" data-i="${i}" data-v="${v}"></button>`).join('')}</div></div>`).join('')}</div>
      ${olcekAlt(m, 'duygu', n, D.duygular.length)}`;
  }
  function dIlgi(m) {
    const p = il(m.id), etiketler = ['Benim için kesinlikle doğru değil', 'Benim için doğru değil', 'Kararsızım', 'Benim için doğru', 'Benim için kesinlikle doğru'];
    const n = D.ilgiMaddeleri.filter((_, i) => p.ilgi[i] != null).length;
    return `<div class="ic-bas"><div><h1>Bu modül hakkında ne düşünüyorsun?</h1><p>Her ifadenin senin için ne kadar doğru olduğunu seç. 1 benim için kesinlikle doğru değil, 5 benim için kesinlikle doğru.</p></div></div>
      <div class="olcek"><div class="ol-ust"><span></span><div><span>Benim için kesinlikle doğru değil</span><span>Benim için kesinlikle doğru</span></div></div>
        ${D.ilgiMaddeleri.map((d, i) => `<div class="li"><p>${d}</p><div class="li-sec" role="radiogroup" aria-label="${esc(d)}">${[1, 2, 3, 4, 5].map(v => `<button class="${p.ilgi[i] === v ? 'on' : ''}" role="radio" aria-checked="${p.ilgi[i] === v}" aria-label="${esc(d)}: ${v} (${etiketler[v - 1]})" title="${etiketler[v - 1]}" data-act="olcek" data-tur="ilgi" data-m="${m.id}" data-i="${i}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}</div>
      ${olcekAlt(m, 'ilgi', n, D.ilgiMaddeleri.length)}`;
  }
  function olcekAlt(m, tur, n, top) {
    const s = sonrakiAdim(m, tur);
    return `<div class="adim-alt"><span id="olSay">${n}/${top} yanıtlandı</span><button class="btn lg" id="olDevam" data-act="olcekBitir" data-m="${m.id}" data-tur="${tur}" data-r="ders-${m.id}-${s}"${n < top ? ' disabled' : ''}>${s === 'son' ? 'Modülü bitir' : 'Devam et'} ${ic('sag')}</button></div>`;
  }

  function sDers(m, k) {
    const i = D.moduller.indexOf(m), t = tamamSay(m);
    let govde = '';
    if (/^v[1-3]$/.test(k)) govde = dVideo(m, +k[1] - 1);
    else if (k === 'ornek') govde = dOrnek(m);
    else if (k === 'gorev') govde = dGorev(m);
    else if (k === 'duygu') govde = dDuygu(m);
    else if (k === 'ilgi') govde = dIlgi(m);
    const sonraki = D.moduller[i + 1];
    const icerik = k === 'son'
      ? `<main class="son-ekran"><div class="son-ekran-obj">${obj(m.obj, 0.2)}</div><h1>Modül ${i + 1} tamamlandı</h1>
          <p>${sonraki ? `Sıradaki modül: ${sonraki.ad}. ${sonraki.videolar.length} video, bir örnek uygulama ve bir mikro görev.` : 'Bütün modülleri bitirdin. İstediğin modüle geri dönebilirsin.'}</p>
          <div class="son-ekran-btn">${sonraki ? `<a class="btn lg" href="#modul-${sonraki.id}">Sonraki modül ${ic('sag')}</a>` : ''}<a class="btn lg ghost" href="#panel">Ana sayfa</a></div></main>`
      : `<div class="ders-govde"><main class="ders-ana">${govde}</main>${akis(m, k)}</div>`;
    return `<div class="ders${acikMi(m.renk) ? ' kapak-acik' : ''}" style="${stil(m)}">
      <header class="ders-ust"><a class="ders-kapat" href="#modul-${m.id}" aria-label="Modül sayfasına dön">${ic('x')}</a>
        <div class="ders-ad"><small>Modül ${i + 1} · ${m.ad}</small><b>${adimAdi(m, k)}</b></div>
        <div class="ders-il"><div class="cubuk"><i id="dersCubuk" style="width:${t / ADIM * 100}%"></i></div><span id="dersSay">${t}/${ADIM}</span></div></header>
      ${icerik}</div>`;
  }

  /* ---------- Video oynatıcı ---------- */
  function kurVideo() {
    const vp = $('#vp'); if (!vp) return;
    const v = $('#vid'), ilan = +vp.dataset.sure; UI.video = v;
    const guncelle = () => {
      if (!vp.isConnected) return;
      const top = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : ilan;
      const cur = v.duration ? v.currentTime : 0;
      const p = top ? cur / top : 0;
      $('#vpIlerle').style.width = p * 100 + '%';
      $('#vpCubuk').setAttribute('aria-valuenow', Math.round(p * 100));
      $('#vpZaman').textContent = fmt(cur) + ' / ' + fmt(top);
      $('#vpOyna').innerHTML = ic(v.paused ? 'play' : 'pause');
    };
    const oynat = () => {
      vp.classList.add('basladi');
      if (v.currentTime > 0 && v.currentTime < 0.25 && v.readyState >= 1) {
        try { v.currentTime = 0; } catch (e) { /* yoksay */ }
      }
      const pr = v.play();
      if (pr) pr.catch(() => {});
    };
    const degistir = () => (v.paused ? oynat() : v.pause());
    UI.oynat = oynat;
    $('#vpKapak').onclick = oynat; $('#vpOyna').onclick = degistir; v.onclick = degistir;
    v.onloadedmetadata = guncelle; v.ontimeupdate = guncelle; v.onplay = guncelle; v.onpause = guncelle;
    v.onended = () => { guncelle(); adimIsaretle(vp.dataset.m, 'v' + (+vp.dataset.j + 1)); };
    const ara = oran => { if (v.duration) v.currentTime = Math.min(Math.max(oran, 0), 1) * v.duration; };
    $('#vpCubuk').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); ara((e.clientX - r.left) / r.width); };
    $('#vpCubuk').onkeydown = e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ara(v.currentTime / (v.duration || 1) + (e.key === 'ArrowRight' ? 0.05 : -0.05)); } };
    const hizlar = [1, 1.25, 1.5, 2, 0.75];
    $('#vpHiz').onclick = e => { const i = (hizlar.indexOf(v.playbackRate) + 1) % hizlar.length; v.playbackRate = hizlar[i]; e.currentTarget.textContent = String(hizlar[i]).replace('.', ',') + '×'; };
    $('#vpTam').onclick = () => { const f = vp.requestFullscreen || vp.webkitRequestFullscreen; if (f) { const pr = f.call(vp); if (pr) pr.catch(() => {}); } };
  }
  function adimIsaretle(mid, k) {
    const m = modul(mid), p = il(mid);
    if (/^v/.test(k)) p.v[+k[1] - 1] = true;
    else if (k === 'ornek') p.ornek = true;
    else if (k === 'gorev') p.gorev = true;
    else if (k === 'duygu') p.duyguOk = true;
    else if (k === 'ilgi') p.ilgiOk = true;
    kaydet();
    const a = $(`.akis .akis-adim[data-adim="${k}"]`);
    if (a && !a.classList.contains('t')) { a.classList.add('t'); a.querySelector('.akis-durum').innerHTML = ic('check'); }
    const t = tamamSay(m);
    if ($('#dersCubuk')) { $('#dersCubuk').style.width = t / ADIM * 100 + '%'; $('#dersSay').textContent = t + '/' + ADIM; }
  }

  /* ---------- Canlı Deney Laboratuvarı: Kontrol Grubu vs API Üretimi ---------- */
  function canliSeciliProfil() {
    if (UI.canliProfil === 'ozel') {
      const alt = (UI.canliOzelAlt || '').trim() || 'Özel ilgi';
      const kat = (UI.canliOzelKategori || '').trim() || 'İlgi alanı';
      const slugId = alt.toLocaleLowerCase('tr').replace(/[^a-z0-9]/g, '').slice(0, 14) || 'ilgi';
      return {
        id: 'ozel-' + slugId,
        etiket: `Özel öğrenci — ${alt}`,
        kisaEtiket: alt,
        kategori: kat,
        altKategori: alt,
        ozgulKisa: alt,
        etkilesimler: [],
        aciklama: (UI.canliOzelAciklama || '').trim() || `${kat} alanında ${alt} ile ilgileniyorum.`,
      };
    }
    if (UI.canliProfil === 'aktif') {
      const top = siraliAltlar()[0];
      if (top) {
        const det = (P().detay[top.a.id] || '').trim();
        const etk = zenginMi() ? ((P().etkinlik && P().etkinlik[top.a.id]) || []) : [];
        return {
          id: 'aktif-' + top.a.id,
          etiket: `Aktif öğrenci (${S.kul ? S.kul.ad : 'Deniz'}) — ${top.a.ad}`,
          kisaEtiket: top.a.ad,
          kategori: top.k.ad,
          altKategori: top.a.ad,
          ozgulKisa: det || top.a.ad,
          etkilesimler: etk,
          aciklama: det || `${top.k.ad} kategorisinde ${top.a.ad} (puan: ${top.p}/5).`,
        };
      }
    }
    return D.juriSunum.profiller.find(p => p.id === UI.canliProfil) || D.juriSunum.profiller[0];
  }

  let canliBakAnahtar = '';
  async function canliOnbellekBak() {
    if (!window.CanliDeney) return;
    const p = canliSeciliProfil();
    const key = `${UI.canliModul}::${p.id}`;
    if (canliBakAnahtar === key) return;
    canliBakAnahtar = key;
    const [cached, tum] = await Promise.all([
      window.CanliDeney.cacheGet(key),
      window.CanliDeney.cacheListAll ? window.CanliDeney.cacheListAll() : Promise.resolve([]),
    ]);
    canliBakAnahtar = '';
    UI.canliTumUretiler = Array.isArray(tum) ? tum : [];
    if (cached && rota().ad === 'canli') {
      const simdikiP = canliSeciliProfil();
      if (`${UI.canliModul}::${simdikiP.id}` === key) {
        UI.canliSonuc = cached;
        UI.canliSeciliTur = Math.max(0, ((cached.turlar && cached.turlar.length) || 1) - 1);
        yenile();
      }
    }
  }

  async function canliUretBaslat(zorla = false, akademisyenNotu = '') {
    if (!window.CanliDeney || UI.canliCalisiyor) return;
    const m = modul(UI.canliModul);
    const profil = canliSeciliProfil();
    const onDenetimAcik = UI.uretim.onDenetimAcik !== false;
    UI.canliCalisiyor = true;
    UI.canliHata = null;
    UI.canliAdimlar = {
      1: { adim: 1, durum: 'bekliyor', mesaj: 'Hazırlanıyor' },
      5: { adim: 5, durum: 'bekliyor', mesaj: onDenetimAcik ? `Appendix B denetimi (maks. ${UI.uretim.maxRevizyon ?? 2} revizyon)` : 'Ön denetim kapalı' },
      2: { adim: 2, durum: 'bekliyor', mesaj: 'Bekliyor' },
      3: { adim: 3, durum: 'bekliyor', mesaj: 'Bekliyor' },
      4: { adim: 4, durum: 'bekliyor', mesaj: 'Bekliyor' },
    };
    yenile();
    try {
      const sonuc = await window.CanliDeney.uretDeneyIcerigi(
        {
          modul: m,
          profil,
          uretim: UI.uretim,
          zorla: zorla || !!akademisyenNotu,
          akademisyenNotu: akademisyenNotu || undefined,
          mevcutSonuc: akademisyenNotu ? UI.canliSonuc : undefined,
        },
        bilgi => {
          UI.canliAdimlar[bilgi.adim] = bilgi;
          const kutu = document.querySelector(`[data-canli-adim="${bilgi.adim}"]`);
          if (kutu) {
            kutu.className = `canli-adim ${bilgi.durum || ''}`;
            const sp = kutu.querySelector('span');
            if (sp) sp.textContent = bilgi.mesaj;
          }
        }
      );
      UI.canliSonuc = sonuc;
      UI.canliSeciliTur = Math.max(0, ((sonuc.turlar && sonuc.turlar.length) || 1) - 1);
      UI.canliAkademisyenNot = '';
      if (window.CanliDeney.cacheListAll) {
        UI.canliTumUretiler = await window.CanliDeney.cacheListAll();
      }
    } catch (err) {
      UI.canliHata = err && err.message ? err.message : String(err);
    } finally {
      UI.canliCalisiyor = false;
      yenile();
    }
  }

  function durumRozetiHTML(sonuc, onDenetimAcikAyar) {
    if (!sonuc) return '<span class="denetim-durum-rozet bekliyor">Henüz üretilmedi</span>';
    const d = sonuc.denetim || {};
    if (!onDenetimAcikAyar || d.onayDurumu === 'denetimsiz_acik') {
      return '<span class="denetim-durum-rozet acik">Ön Denetim Kapalı · Doğrudan Öğrenciye Açık</span>';
    }
    if (d.onayDurumu === 'akademisyen_onayli') {
      return '<span class="denetim-durum-rozet onayli">✓ Akademisyen Onayladı · Öğrenciye Açık</span>';
    }
    if (d.onayDurumu === 'akademisyen_bekliyor') {
      return '<span class="denetim-durum-rozet akademisyen">⏳ YZ Ön Onay Verdi · Akademisyen Onayı Bekliyor (Öğrenciye Gizli)</span>';
    }
    if (d.onayDurumu === 'akademisyen_revizyon') {
      return '<span class="denetim-durum-rozet red">↺ Akademisyen Revizyon İstedi · Öğrenciye Gizli</span>';
    }
    return '<span class="denetim-durum-rozet red">⚠ YZ Ön Denetim Eşik Altı · Akademisyen İncelemesinde (Öğrenciye Gizli)</span>';
  }

  function ogrenciGorebilirMi(sonuc) {
    if (!sonuc) return false;
    if (UI.uretim.onDenetimAcik === false) return true;
    const d = sonuc.denetim;
    if (!d) return true;
    return d.onayDurumu === 'akademisyen_onayli' || d.onayDurumu === 'denetimsiz_acik';
  }

  function puanEtiketiHTML(puan) {
    const p = Number(puan);
    if (p >= 1) return '<span class="rubrik-puan tam">1.0 · Agree (Tam Uyum)</span>';
    if (p >= 0.5) return '<span class="rubrik-puan kismi">0.5 · Neutral / Partial (Kısmi)</span>';
    return '<span class="rubrik-puan zayif">0.0 · Disagree (Uyumsuz)</span>';
  }

  function renderDenetimMerkezi(aktifSonuc) {
    if (!aktifSonuc || !window.CanliDeney) return '';
    const d = aktifSonuc.denetim || {};
    const turlar = Array.isArray(aktifSonuc.turlar) ? aktifSonuc.turlar : [];
    const izler = Array.isArray(aktifSonuc.denetimIzi) ? aktifSonuc.denetimIzi : [];
    const turIdx = Math.max(0, Math.min(turlar.length - 1, UI.canliSeciliTur || 0));
    const seciliTur = turlar[turIdx] || (d.sonDenetim ? {
      turNo: 1,
      revizyonNo: 0,
      etiket: 'Son Ön Denetim',
      model: d.denetimModel,
      tarih: aktifSonuc.meta && aktifSonuc.meta.tarih,
      ...d.sonDenetim,
    } : null);

    const rubrikTanimlari = window.CanliDeney.APPENDIX_B_RUBRIKLER || [];
    const esdegerlikTanimlari = window.CanliDeney.ESDEGERLIK_KRITERLERI || [];
    const sekme = UI.canliDenetimSekme || 'rubrik';
    const onDenetimAcik = UI.uretim.onDenetimAcik !== false;
    const ogrenciAcik = ogrenciGorebilirMi(aktifSonuc);

    const genYuzde = seciliTur ? Math.round((seciliTur.genelOrtalama || 0) * 100) : null;
    const pedYuzde = seciliTur ? Math.round((seciliTur.pedagojikOrtalama || 0) * 100) : null;
    const esYuzde = seciliTur ? Math.round((seciliTur.esdegerlikOrtalama || 0) * 100) : null;

    return `<section class="canli-panel denetim-merkezi" id="denetimMerkezi">
      <div class="denetim-ust-bar">
        <div>
          <span class="juri-ust-etiket">arXiv:2509.13348 · Appendix B: Rubrics for Pedagogical Evaluations &amp; Deneysel Eşdeğerlik</span>
          <h2>YZ Ön Denetim, Otomatik Revizyon ve Akademisyen Onay Merkezi</h2>
          <p>Üretilen içerik önce YZ hakemi tarafından 10 pedagojik rubrik ve 5 deney-kontrol eşdeğerlik ölçütünde değerlendirilir. YZ ön onayından geçen içerikler akademisyen onayına düşer; <b>akademisyen onayladığında öğrenci ekranında görünür olur.</b></p>
        </div>
        <div class="denetim-ust-rozetler">
          ${durumRozetiHTML(aktifSonuc, onDenetimAcik)}
          <span class="denetim-gorunurluk-etiket ${ogrenciAcik ? 'acik' : 'kapali'}">
            Öğrenci Görünürlüğü: <b>${ogrenciAcik ? 'AÇIK (Öğrenci görebilir)' : 'KİLİTLİ (Onay bekliyor)'}</b>
          </span>
        </div>
      </div>

      ${seciliTur ? `<div class="denetim-skor-serit">
        <div class="denetim-skor-kart ${seciliTur.gectiMi ? 'gecti' : 'kaldi'}">
          <small>Genel Ön Denetim Skoru</small>
          <b>%${genYuzde} <span>(${seciliTur.genelOrtalama} / 1.00)</span></b>
          <span class="skor-alt">Geçme eşiği: %${Math.round((d.esikPuan || 0.85) * 100)} (${d.esikPuan || 0.85}) · ${seciliTur.gectiMi ? 'YZ Ön Onay Verdi ✓' : 'Eşik Altında Kaldı'}</span>
        </div>
        <div class="denetim-skor-kart">
          <small>Appendix B Pedagojik Yeterlik (10 Boyut)</small>
          <b>%${pedYuzde} <span>(${seciliTur.pedagojikOrtalama} / 1.00)</span></b>
          <span class="skor-alt">Accuracy, Coverage, Emphasis, Cognitive Load, Active Learning...</span>
        </div>
        <div class="denetim-skor-kart">
          <small>Deney–Kontrol Eşdeğerliği (5 Boyut)</small>
          <b>%${esYuzde} <span>(${seciliTur.esdegerlikOrtalama} / 1.00)</span></b>
          <span class="skor-alt">Kazanım, Bloom düzeyi, yapı/süre, alan bağımsızlığı, transfer</span>
        </div>
        <div class="denetim-skor-kart">
          <small>Revizyon Döngüsü &amp; Hakem Model</small>
          <b>${d.kullanilanRevizyon || 0} / ${d.maxRevizyon ?? UI.uretim.maxRevizyon ?? 2} <span>revizyon kullanıldı</span></b>
          <span class="skor-alt">Hakem: ${esc(seciliTur.model || d.denetimModel || UI.uretim.denetimModel)}</span>
        </div>
      </div>` : `<div class="denetim-kapali-bilgi">
        <div>
          <b>Bu içerik Ön Denetim Kapalı modda üretildi.</b>
          <p>Ön denetim kapalı olduğunda içerik denetimsiz olarak doğrudan öğrenciye açılır. İsterseniz ön denetimi açıp mevcut içeriği Appendix B rubriğiyle değerlendirebilirsiniz.</p>
        </div>
        <button type="button" class="btn" data-act="canliSimdiDenetle"${UI.canliCalisiyor ? ' disabled' : ''}>Ön Denetimi Aç &amp; Şimdi Denetle</button>
      </div>`}

      <div class="denetim-sekmeler" role="tablist" aria-label="Denetim merkezi sekmeleri">
        <button type="button" class="denetim-sekme${sekme === 'rubrik' ? ' on' : ''}" data-act="canliDenetimSekme" data-sekme="rubrik">
          1. Appendix B Rubrik &amp; Eşdeğerlik Tablosu (${rubrikTanimlari.length + esdegerlikTanimlari.length} Ölçüt)
        </button>
        <button type="button" class="denetim-sekme${sekme === 'turlar' ? ' on' : ''}" data-act="canliDenetimSekme" data-sekme="turlar">
          2. Revizyon Turları &amp; Düzeltme Önerileri (${turlar.length} Tur)
        </button>
        <button type="button" class="denetim-sekme${sekme === 'iz' ? ' on' : ''}" data-act="canliDenetimSekme" data-sekme="iz">
          3. Tüm Adımların Promptları &amp; Dönütleri (${izler.length} Adım)
        </button>
        <button type="button" class="denetim-sekme${sekme === 'akademisyen' ? ' on' : ''}" data-act="canliDenetimSekme" data-sekme="akademisyen">
          4. Akademisyen Onay Masası ${d.onayDurumu === 'akademisyen_bekliyor' ? '<span class="bekleyen-nokta">Onay Bekliyor</span>' : ''}
        </button>
      </div>

      ${sekme === 'rubrik' ? `<div class="denetim-sekme-icerik">
        ${turlar.length > 1 ? `<div class="tur-secici-serit">
          <span>İncelenen değerlendirme turu:</span>
          <div class="tur-dugmeler">
            ${turlar.map((tr, idx) => `<button type="button" class="tur-btn${idx === turIdx ? ' on' : ''}" data-act="canliTurSec" data-i="${idx}">
              Tur ${idx + 1}: ${esc(tr.etiket)} (%${Math.round((tr.genelOrtalama || 0) * 100)})
            </button>`).join('')}
          </div>
        </div>` : ''}

        ${seciliTur ? `<div class="denetim-genel-yorum">
          <div>
            <small>YZ Hakem Genel Değerlendirmesi (${esc(seciliTur.etiket)} · ${esc(seciliTur.tarih || '')})</small>
            <p>${esc(seciliTur.genelYorum)}</p>
          </div>
          ${seciliTur.revizyonTalimati && !seciliTur.gectiMi ? `<div class="denetim-revizyon-uyari">
            <b>Üretici Modele İletilen Düzeltme Talimatı:</b>
            <p>${esc(seciliTur.revizyonTalimati)}</p>
          </div>` : ''}
        </div>` : ''}

        <div class="rubrik-bolum-bas">
          <h3>A. Deney–Kontrol Grubu Eşdeğerlik Değerlendirmesi (5 Ölçüt)</h3>
          <p>Kişiselleştirilmiş deney içeriğinin kontrol grubuna göre daha kolay/zor olmamasını ve yalnızca bağlamın değişmesini denetler.</p>
        </div>
        <div class="rubrik-izgara">
          ${esdegerlikTanimlari.map(e => {
            const deger = (seciliTur && seciliTur.esdegerlik && seciliTur.esdegerlik[e.id]) || null;
            return `<article class="rubrik-kart ${deger ? (deger.puan >= 1 ? 'tam' : deger.puan >= 0.5 ? 'kismi' : 'zayif') : ''}">
              <div class="rubrik-kart-ust">
                <div>
                  <span class="rubrik-kod">${esc(e.kod)}</span>
                  <b>${esc(e.ad)}</b>
                </div>
                ${deger ? puanEtiketiHTML(deger.puan) : '<span class="rubrik-puan">Değerlendirilmedi</span>'}
              </div>
              <p class="rubrik-tanim">${esc(e.tanim)}</p>
              ${deger ? `<div class="rubrik-donut">
                <div><small>YZ Hakem Dönütü:</small><p>${esc(deger.gerekce)}</p></div>
                ${deger.oneri ? `<div class="rubrik-oneri"><small>Düzeltme Önerisi:</small><p>${esc(deger.oneri)}</p></div>` : ''}
              </div>` : ''}
            </article>`;
          }).join('')}
        </div>

        <div class="rubrik-bolum-bas" style="margin-top:10px">
          <h3>B. Google LearnLM (arXiv:2509.13348) Appendix B: Pedagojik Değerlendirme Rubriği (10 Ölçüt)</h3>
          <p>Makalenin ekindeki 3 noktalı ölçek: <b>Agree (1.0)</b> · <b>Neutral / Partial (0.5)</b> · <b>Disagree (0.0)</b></p>
        </div>
        <div class="rubrik-izgara">
          ${rubrikTanimlari.map(r => {
            const deger = (seciliTur && seciliTur.pedagojik && seciliTur.pedagojik[r.id]) || null;
            return `<article class="rubrik-kart ${deger ? (deger.puan >= 1 ? 'tam' : deger.puan >= 0.5 ? 'kismi' : 'zayif') : ''}">
              <div class="rubrik-kart-ust">
                <div>
                  <span class="rubrik-kod">${esc(r.kod)}</span>
                  <b>${esc(r.ad)}</b>
                </div>
                ${deger ? puanEtiketiHTML(deger.puan) : '<span class="rubrik-puan">Değerlendirilmedi</span>'}
              </div>
              <p class="rubrik-tanim">${esc(r.tanim)}</p>
              <details class="rubrik-kriter-detay">
                <summary>Makaledeki Orijinal Puanlama Ölçütleri (1.0 / 0.5 / 0.0)</summary>
                <ul>
                  <li><b>Agree (1.0):</b> ${esc(r.agree)}</li>
                  <li><b>Neutral / Partial (0.5):</b> ${esc(r.partial)}</li>
                  <li><b>Disagree (0.0):</b> ${esc(r.disagree)}</li>
                </ul>
              </details>
              ${deger ? `<div class="rubrik-donut">
                <div><small>YZ Hakem Dönütü:</small><p>${esc(deger.gerekce)}</p></div>
                ${deger.oneri ? `<div class="rubrik-oneri"><small>Düzeltme Önerisi:</small><p>${esc(deger.oneri)}</p></div>` : ''}
              </div>` : ''}
            </article>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${sekme === 'turlar' ? `<div class="denetim-sekme-icerik">
        ${turlar.length ? `<div class="revizyon-zaman-cizelgesi">
          ${turlar.map((tr, idx) => `<div class="revizyon-tur-kart ${tr.gectiMi ? 'gecti' : 'revizyon'}">
            <div class="revizyon-tur-ust">
              <div>
                <span class="rubrik-kod">TUR ${idx + 1}</span>
                <b>${esc(tr.etiket)}</b>
                <small>Model: ${esc(tr.model)} · Saat: ${esc(tr.tarih || '')}</small>
              </div>
              <div class="revizyon-tur-skorlar">
                <span>Pedagojik: <b>%${Math.round((tr.pedagojikOrtalama || 0) * 100)}</b></span>
                <span>Eşdeğerlik: <b>%${Math.round((tr.esdegerlikOrtalama || 0) * 100)}</b></span>
                <span class="genel ${tr.gectiMi ? 'iyi' : 'uyari'}">Genel: <b>%${Math.round((tr.genelOrtalama || 0) * 100)}</b> (${tr.gectiMi ? 'ONAY ✓' : 'REVİZYON ↺'})</span>
              </div>
            </div>
            <p class="revizyon-tur-yorum"><b>Hakem Özeti:</b> ${esc(tr.genelYorum)}</p>
            ${tr.eksikNotlar && tr.eksikNotlar.length ? `<div class="revizyon-eksik-liste">
              <b>Tespit Edilen Eksikler ve Düzeltme Önerileri (${tr.eksikNotlar.length} madde):</b>
              <ul>${tr.eksikNotlar.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
            </div>` : `<div class="revizyon-tam-not">✓ Bu turda tüm Appendix B ve deneysel eşdeğerlik boyutları tam uyum sağladı.</div>`}
            ${tr.revizyonTalimati && !tr.gectiMi ? `<div class="revizyon-talimat-kutu">
              <b>Bir Sonraki Üretim Turuna Gönderilen Revizyon Prompt Talimatı:</b>
              <p>${esc(tr.revizyonTalimati)}</p>
            </div>` : ''}
            ${tr.icerikSnapshot ? `<details class="revizyon-snapshot">
              <summary>Bu turda değerlendirilen içerik taslağını görüntüle (${esc(tr.icerikSnapshot.altBaslik || '')})</summary>
              <div class="snapshot-ic">
                <p><b>Slayt 1 Soru:</b> ${esc(tr.icerikSnapshot.slaytlar && tr.icerikSnapshot.slaytlar[0] && tr.icerikSnapshot.slaytlar[0].soru)}</p>
                <p><b>Mikro-görev:</b> ${esc(tr.icerikSnapshot.gorev && tr.icerikSnapshot.gorev.baslik)} — ${esc(tr.icerikSnapshot.gorev && tr.icerikSnapshot.gorev.metin)}</p>
              </div>
            </details>` : ''}
          </div>`).join('')}
        </div>` : '<p class="soluk-bilgi">Henüz ön denetim turu kaydı bulunmuyor.</p>'}
      </div>` : ''}

      ${sekme === 'iz' ? `<div class="denetim-sekme-icerik">
        <div class="iz-aciklama-ust">
          <p>Üretim hattındaki tüm adımların (1. İlk Senaryo Üretimi, YZ Ön Denetim Hakemi, Otomatik Revizyonlar, Seslendirme Scripti, Görsel Prompt ve Akademisyen Onayı) <b>Sistem Promptları</b>, <b>Kullanıcı Promptları</b> ve <b>Model Dönütleri / Çıktıları</b> aşağıda okunaklı biçimde listelenmektedir.</p>
          <div class="iz-toplu-btn">
            <button type="button" class="btn ghost" data-act="canliIzHepsi" data-ac="1">Tüm Adımları Aç</button>
            <button type="button" class="btn ghost" data-act="canliIzHepsi" data-ac="0">Tümünü Daralt</button>
          </div>
        </div>
        <div class="iz-listesi">
          ${izler.map((iz, idx) => {
            const acik = UI.canliAcikIz[iz.id] !== undefined ? UI.canliAcikIz[iz.id] : (idx === 0 || iz.tur === 'denetim' || iz.tur === 'revizyon');
            const turEtiket = iz.tur === 'uretim' ? 'İçerik Üretimi'
              : iz.tur === 'denetim' ? 'Appendix B Ön Denetim'
              : iz.tur === 'revizyon' ? 'Otomatik Revizyon'
              : iz.tur === 'script' ? 'TTS Script Editörü'
              : iz.tur === 'prompt' ? 'Görsel Prompt'
              : 'Akademisyen Kararı';
            return `<article class="iz-kart tur-${esc(iz.tur)}">
              <header class="iz-kart-bas" data-act="canliIzToggle" data-id="${esc(iz.id)}" role="button" tabindex="0">
                <div class="iz-bas-sol">
                  <span class="iz-sira">${idx + 1}</span>
                  <div>
                    <div class="iz-baslik-satir">
                      <b>${esc(iz.asama)}</b>
                      <span class="iz-tur-etiket">${turEtiket}</span>
                      <code class="iz-model-etiket">${esc(iz.model)}</code>
                      <time>${esc(iz.tarih || '')}</time>
                    </div>
                    <p class="iz-ozet">${esc(iz.ozet || '')}</p>
                  </div>
                </div>
                <span class="iz-ac-ikon">${acik ? 'Gizle ▲' : 'Prompt & Çıktıyı Gör ▼'}</span>
              </header>
              ${acik ? `<div class="iz-kart-govde">
                <div class="iz-iki-kolon">
                  <div class="iz-kod-kutu">
                    <div class="iz-kod-bas"><b>Sistem Promptu (System Instruction)</b><span>Role &amp; Kurallar</span></div>
                    <pre>${esc(iz.systemPrompt || '')}</pre>
                  </div>
                  <div class="iz-kod-kutu">
                    <div class="iz-kod-bas"><b>Kullanıcı Promptu (User Prompt &amp; Bağlam / Dönüt)</b><span>Girdi Verisi</span></div>
                    <pre>${esc(iz.userPrompt || '')}</pre>
                  </div>
                </div>
                <div class="iz-kod-kutu cikti">
                  <div class="iz-kod-bas"><b>Model Çıktısı / Yapılandırılmış Dönüt (JSON)</b><span>Üretilen Yanıt</span></div>
                  <pre>${esc(typeof iz.outputJson === 'string' ? iz.outputJson : JSON.stringify(iz.outputJson, null, 2))}</pre>
                </div>
              </div>` : ''}
            </article>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${sekme === 'akademisyen' ? `<div class="denetim-sekme-icerik">
        <div class="akademisyen-masa-izgara">
          <div class="akademisyen-karar-kutu">
            <div class="akademisyen-bas">
              <span class="juri-ust-etiket">İnsan-Döngüde (Human-in-the-Loop) Uzman Denetimi</span>
              <h3>Akademisyen Onay ve Revizyon Masası</h3>
              <p>YZ ön denetiminden geçen içerikler burada akademisyen onayına sunulur. Akademisyen içeriği onayladığında öğrenci modül ekranında kişiselleştirilmiş içeriği görebilir; revizyon isterse akademisyenin yazdığı düzeltme notuyla YZ içeriği yeniden üretir ve tekrar denetler.</p>
            </div>

            <div class="akademisyen-durum-panel">
              <div>
                <small>İncelenen İçerik</small>
                <b>${esc(aktifSonuc.modulId.toUpperCase())} · ${esc(aktifSonuc.profil.altKategori)} — ${esc(aktifSonuc.slayt.altBaslik)}</b>
              </div>
              <div>
                <small>Mevcut Onay Durumu</small>
                ${durumRozetiHTML(aktifSonuc, onDenetimAcik)}
              </div>
            </div>

            ${d.akademisyenKarar ? `<div class="akademisyen-kayitli-karar ${d.akademisyenKarar.karar === 'onay' ? 'onay' : 'red'}">
              <b>Son Akademisyen Kararı (${esc(d.akademisyenKarar.akademisyenAd)} · ${esc(d.akademisyenKarar.tarih)}):</b>
              <p>${esc(d.akademisyenKarar.not)}</p>
            </div>` : ''}

            <div class="canli-alan">
              <label for="canliAkademisyenNot">Akademisyen Değerlendirme Notu / Revizyon Talimatı</label>
              <textarea id="canliAkademisyenNot" rows="3" placeholder="Onay gerekçenizi veya YZ'nin düzeltmesini istediğiniz pedagojik/eşdeğerlik noktasını yazın (ör. 'Mikro-görevdeki çeldiricileri kontrol grubuna daha yakın zorlukta kurgula')...">${esc(UI.canliAkademisyenNot || '')}</textarea>
            </div>

            <div class="akademisyen-butonlar">
              <button type="button" class="btn onay-btn" data-act="akademisyenOnayla"${UI.canliCalisiyor ? ' disabled' : ''}>
                ${ic('check')} Akademisyen Olarak Onayla &amp; Öğrenciye Aç
              </button>
              <button type="button" class="btn ghost revizyon-btn" data-act="akademisyenRevizyonIste"${UI.canliCalisiyor ? ' disabled' : ''}>
                ↺ Akademisyen Notuyla YZ'ye Yeniden Revize Ettir
              </button>
              ${d.onayDurumu === 'akademisyen_onayli' ? `<button type="button" class="btn ghost" data-act="akademisyenOnayGeriAl">Onayı Geri Al (Öğrenciye Kapat)</button>` : ''}
            </div>
          </div>

          <div class="akademisyen-kuyruk-kutu">
            <h3>Önbellekteki Tüm Üretilen İçerikler &amp; Onay Kuyruğu</h3>
            <p>Farklı modül ve öğrenci profilleri için üretilen içeriklerin YZ ön denetim skorları ve akademisyen onay durumları:</p>
            ${UI.canliTumUretiler && UI.canliTumUretiler.length ? `<div class="kuyruk-liste">
              ${UI.canliTumUretiler.map(u => {
                const ud = u.denetim || {};
                const skor = ud.sonDenetim ? `%${Math.round((ud.sonDenetim.genelOrtalama || 0) * 100)}` : 'Denetimsiz';
                const seciliMiKuyruk = u.cacheKey === aktifSonuc.cacheKey;
                return `<div class="kuyruk-satir${seciliMiKuyruk ? ' on' : ''}">
                  <div>
                    <b>${esc((u.modulId || '').toUpperCase())} · ${esc((u.profil && (u.profil.kisaEtiket || u.profil.altKategori)) || u.cacheKey)}</b>
                    <small>${esc((u.slayt && u.slayt.altBaslik) || '')} · YZ Skoru: <b>${skor}</b></small>
                  </div>
                  <div class="kuyruk-sag">
                    ${durumRozetiHTML(u, onDenetimAcik)}
                    ${!seciliMiKuyruk ? `<button type="button" class="btn ghost kuyruk-ac-btn" data-act="kuyrukSec" data-m="${esc(u.modulId)}" data-p="${esc(u.profil && u.profil.id)}">İncele</button>` : ''}
                  </div>
                </div>`;
              }).join('')}
            </div>` : '<p class="soluk-bilgi">Henüz önbellekte kayıtlı üretim yok.</p>'}
          </div>
        </div>
      </div>` : ''}
    </section>`;
  }

  function sCanli() {
    const m = modul(UI.canliModul);
    const profil = canliSeciliProfil();
    const beklenenKey = `${m.id}::${profil.id}`;
    const aktifSonuc = (UI.canliSonuc && UI.canliSonuc.cacheKey === beklenenKey) ? UI.canliSonuc : null;
    const claudeOk = !!(UI.uretim.claudeKey || '').trim();
    const geminiOk = !!(UI.uretim.geminiKey || '').trim();
    const ttsOk = !!((UI.uretim.ttsKey || UI.uretim.geminiKey || '').trim());
    const onDenetimAcik = UI.uretim.onDenetimAcik !== false;
    const denetimModel = UI.uretim.denetimModel || UI.uretim.senaryoModel;
    const maxRev = UI.uretim.maxRevizyon ?? 2;
    const ogrenciGorebilir = ogrenciGorebilirMi(aktifSonuc);
    const ogrenciModu = UI.canliBakModu === 'ogrenci';

    const adimTanimlari = [
      [1, '1. Senaryo & İçerik', UI.uretim.senaryoModel],
      [5, `1b. YZ Ön Denetim (Maks. ${maxRev} Rev.)`, onDenetimAcik ? `${denetimModel} · Appendix B` : 'Kapalı (Denetimsiz)'],
      [2, '2. Seslendirme Scripti', UI.uretim.scriptModel],
      [3, '3. Görsel Prompt', UI.uretim.promptModel],
      [4, '4. Görsel & TTS Ses', `${UI.uretim.gorselModel} + ${UI.uretim.sesModel}`],
    ];
    return kabuk('yonetici', `<div class="sayfa canli-sayfa">
      <div class="sb">
        <div>
          <h1>Canlı Deney Laboratuvarı · Appendix B Ön Denetim &amp; Akademisyen Onayı</h1>
          <p>Kontrol grubu standart içeriği ile deney grubu canlı API üretimini karşılaştırın; <b>arXiv:2509.13348 Appendix B</b> rubriğiyle YZ ön kontrolünü, revizyon döngüsünü ve akademisyen onayına bağlı öğrenci görünürlüğünü yönetin.</p>
        </div>
        <div class="yon-aksiyon">
          <div class="canli-gorunum-sec rol-secici" role="group" aria-label="Görünüm modu">
            <button type="button" class="${!ogrenciModu ? 'on' : ''}" data-act="canliBakModu" data-mod="arastirmaci">Araştırmacı / Akademisyen</button>
            <button type="button" class="${ogrenciModu ? 'on' : ''}" data-act="canliBakModu" data-mod="ogrenci">Öğrenci Görünümü (${ogrenciGorebilir ? 'Açık ✓' : 'Kilitli 🔒'})</button>
          </div>
          <a class="btn ghost" href="#yonetici">${ic('ayar')}Yönetici &amp; Denetim Ayarları</a>
        </div>
      </div>

      <section class="canli-panel">
        <div class="canli-secim-izgara">
          <div class="canli-alan">
            <label for="canliModul">Modül seçimi (6 modül · hazır Kontrol içeriği)</label>
            <select id="canliModul">
              ${D.moduller.map((md, idx) => `<option value="${md.id}"${md.id === m.id ? ' selected' : ''}>Modül ${idx + 1} — ${esc(md.ad)}</option>`).join('')}
            </select>
          </div>
          <div class="canli-alan">
            <label for="canliProfil">Deney grubu öğrenci profili</label>
            <select id="canliProfil">
              ${D.juriSunum.profiller.map(pr => `<option value="${pr.id}"${UI.canliProfil === pr.id ? ' selected' : ''}>${esc(pr.etiket)} (${esc(pr.ozgulKisa)})</option>`).join('')}
              <option value="aktif"${UI.canliProfil === 'aktif' ? ' selected' : ''}>Aktif platform öğrencisi (${esc(S.kul ? S.kul.ad : 'Deniz Aydın')})</option>
              <option value="ozel"${UI.canliProfil === 'ozel' ? ' selected' : ''}>Özel profil (kendin yaz...)</option>
            </select>
          </div>
          <div class="canli-aksiyonlar">
            <button type="button" class="btn" data-act="canliUret"${UI.canliCalisiyor ? ' disabled' : ''}>
              ${UI.canliCalisiyor ? 'API & Ön Denetim Çalışıyor...' : aktifSonuc ? 'Önbellekten Yüklü · Yeniden Üret' : 'Deney Grubu Üret & Denetle'}
            </button>
          </div>
        </div>

        ${UI.canliProfil === 'ozel' ? `<div class="canli-ozel-profil">
          <div class="canli-alan">
            <label for="canliOzelKategori">Ana kategori</label>
            <input id="canliOzelKategori" type="text" value="${esc(UI.canliOzelKategori)}" placeholder="Örn. Spor, Teknoloji, Müzik">
          </div>
          <div class="canli-alan">
            <label for="canliOzelAlt">Alt ilgi alanı</label>
            <input id="canliOzelAlt" type="text" value="${esc(UI.canliOzelAlt)}" placeholder="Örn. Tenis, Robotik, Fotoğrafçılık">
          </div>
          <div class="canli-alan" style="grid-column:1/-1">
            <label for="canliOzelAciklama">Öğrencinin özgül açıklaması (kişiselleştirme bağlamı)</label>
            <textarea id="canliOzelAciklama" rows="2" placeholder="Öğrencinin günlük pratiğini veya takip ettiği konuyu yazın...">${esc(UI.canliOzelAciklama)}</textarea>
          </div>
        </div>` : ''}

        <!-- Hızlı Ön Denetim Aç/Kapat ve Revizyon Ayar Şeridi -->
        <div class="canli-denetim-ayar-serit">
          <div class="canli-denetim-sol">
            <button type="button" class="denetim-toggle-btn ${onDenetimAcik ? 'on' : 'off'}" data-act="onDenetimToggle" aria-pressed="${onDenetimAcik}">
              <span class="toggle-nokta"></span>
              <b>YZ Ön Denetim &amp; Akademisyen Onayı: ${onDenetimAcik ? 'AÇIK' : 'KAPALI (Denetimsiz)'}</b>
            </button>
            ${onDenetimAcik ? `<label class="mini-ayar">
              <span>Revizyon hakkı:</span>
              <select data-uretim="maxRevizyon" aria-label="Maksimum revizyon hakkı">
                ${[0, 1, 2, 3, 4].map(n => `<option value="${n}"${Number(maxRev) === n ? ' selected' : ''}>${n} revizyon</option>`).join('')}
              </select>
            </label>
            <label class="mini-ayar">
              <span>Geçme eşiği:</span>
              <select data-uretim="gecmeEsigi" aria-label="YZ ön onay geçme eşiği">
                ${[['0.75', '%75'], ['0.80', '%80'], ['0.85', '%85'], ['0.90', '%90 (Makale)'], ['0.95', '%95']].map(([v, l]) => `<option value="${v}"${String(UI.uretim.gecmeEsigi || '0.85') === v ? ' selected' : ''}>${l}</option>`).join('')}
              </select>
            </label>` : `<span class="denetimsiz-uyari-not">Ön denetim kapalı: Üretilen içerik revizyonsuz ve akademisyen onayı beklemeksizin doğrudan öğrenciye gösterilir.</span>`}
          </div>
          <div class="canli-model-etiketler">
            <span>Claude: ${claudeOk ? 'Hazır ✓' : 'Anahtar yok'}</span>
            <span>Gemini: ${geminiOk ? 'Hazır ✓' : 'Anahtar yok'}</span>
            <span>TTS: ${ttsOk ? 'Cloud TTS ✓' : 'Tarayıcı TTS'}</span>
          </div>
        </div>

        <div class="canli-akis canli-akis-5" id="canliAkis">
          ${adimTanimlari.map(([no, bas, modAd]) => {
            let varsayilanSt = { durum: '', mesaj: 'Bekliyor' };
            if (aktifSonuc) {
              if (no === 5) {
                const sd = aktifSonuc.denetim && aktifSonuc.denetim.sonDenetim;
                varsayilanSt = !onDenetimAcik
                  ? { durum: 'uyari', mesaj: 'Ön denetim kapalı' }
                  : sd
                    ? { durum: sd.gectiMi ? 'bitti' : 'uyari', mesaj: `${sd.gectiMi ? 'YZ Ön Onay ✓' : 'Eşik altı'} · %${Math.round(sd.genelOrtalama * 100)} (${aktifSonuc.denetim.kullanilanRevizyon || 0}/${aktifSonuc.denetim.maxRevizyon ?? maxRev} rev.)` }
                    : { durum: 'uyari', mesaj: 'Denetim kaydı yok' };
              } else {
                varsayilanSt = { durum: 'bitti', mesaj: aktifSonuc.onbellekten ? 'Önbellekten yüklendi' : 'Tamamlandı' };
              }
            }
            const st = UI.canliAdimlar[no] || varsayilanSt;
            return `<div class="canli-adim ${st.durum || ''}" data-canli-adim="${no}">
              <small>${bas}</small>
              <b>${esc(modAd)}</b>
              <span>${esc(st.mesaj || '')}</span>
            </div>`;
          }).join('')}
        </div>

        ${UI.canliHata ? `<div class="yon-model-bilgi hata"><b>Üretim hatası:</b> ${esc(UI.canliHata)} · <a href="#yonetici" style="text-decoration:underline;color:inherit">Yönetici panelinden anahtar ve modelleri kontrol et</a></div>` : ''}

        ${aktifSonuc ? `<div class="canli-aksiyonlar">
          <button type="button" class="btn ghost" data-act="canliYenidenUret"${UI.canliCalisiyor ? ' disabled' : ''}>Önbelleği yoksay &amp; Yeniden üret</button>
          ${onDenetimAcik && aktifSonuc.denetim && aktifSonuc.denetim.onayDurumu !== 'akademisyen_onayli' ? `<button type="button" class="btn onay-btn" data-act="akademisyenOnayla">${ic('check')}Akademisyen Olarak Onayla (Öğrenciye Aç)</button>` : ''}
          <button type="button" class="btn ghost" data-act="canliIndir">${ic('indir')}Klasöre Kaydet (images/ &amp; audio/)</button>
          <button type="button" class="btn ghost" data-act="canliOnbellekSil">Bu önbelleği temizle</button>
          <a class="btn ghost" href="#ders-${m.id}-ornek">Öğrenci Ders Ekranında Test Et ${ic('sag')}</a>
        </div>` : ''}
      </section>

      ${aktifSonuc ? renderDenetimMerkezi(aktifSonuc) : ''}

      <div class="canli-karsilastirma">
        <section class="canli-kolon">
          <div class="canli-kolon-ust">
            <div class="canli-kolon-bas">
              <small>Kontrol grubu · Deneysel eşdeğerlik tabanı</small>
              <h2>Standart içerik (${esc(m.id.toUpperCase())})</h2>
            </div>
            <div class="canli-gorunum-sec" role="group" aria-label="Kontrol görünümü">
              <button type="button" class="${UI.canliKontrolGorunum === 'slayt' ? 'on' : ''}" data-act="canliKGorunum" data-v="slayt">Çözümlü örnek</button>
              <button type="button" class="${UI.canliKontrolGorunum === 'gorev' ? 'on' : ''}" data-act="canliKGorunum" data-v="gorev">Mikro-görev</button>
            </div>
          </div>
          <div id="canliKontrolHost"></div>
        </section>

        <section class="canli-kolon deney">
          <div class="canli-kolon-ust">
            <div class="canli-kolon-bas">
              <small>Deney grubu · ${ogrenciModu ? 'Öğrenci Görünümü Önizlemesi' : 'Araştırmacı / Akademisyen Önizlemesi'}</small>
              <h2>${esc(profil.kisaEtiket || profil.altKategori)} (${esc(m.id.toUpperCase())})</h2>
            </div>
            <div class="canli-gorunum-sec" role="group" aria-label="Deney görünümü">
              <button type="button" class="${UI.canliDeneyGorunum === 'slayt' ? 'on' : ''}" data-act="canliDGorunum" data-v="slayt">Çözümlü örnek</button>
              <button type="button" class="${UI.canliDeneyGorunum === 'gorev' ? 'on' : ''}" data-act="canliDGorunum" data-v="gorev">Mikro-görev</button>
            </div>
          </div>
          ${!aktifSonuc ? `<div class="canli-bos">
            <h3>${UI.canliCalisiyor ? 'Deney grubu API ile üretiliyor ve Appendix B rubriğiyle denetleniyor...' : 'Canlı API üretimi bekliyor'}</h3>
            <p>${UI.canliCalisiyor ? 'Senaryo üretimi, YZ Appendix B pedagojik ön kontrolü (ve gerekirse otomatik revizyonu), seslendirme scripti, Gemini görsel ve Google TTS adımları sırayla çalıştırılıyor.' : `Sol tarafta Kontrol grubunun hazır standart içeriğini inceleyebilirsiniz. “Deney Grubu Üret & Denetle” düğmesine bastığınızda ${esc(profil.altKategori)} bağlamında kişiselleştirilmiş 5 slaytlık örnek ve mikro-görev üretilir, YZ ön kontrolünden geçer ve akademisyen onayına sunulur.`}</p>
            ${!UI.canliCalisiyor ? `<button type="button" class="btn" data-act="canliUret">${ic('yildiz')}Şimdi Canlı Üret &amp; Denetle (API)</button>` : ''}
          </div>` : (ogrenciModu && !ogrenciGorebilir) ? `<div class="canli-bos ogrenci-kilit-kutu">
            <span class="kilit-ikon">🔒</span>
            <h3>Bu İçerik Henüz Öğrenci Erişimine Açılmadı</h3>
            <p>Ön denetim açık modda üretilen YZ içerikleri, <b>YZ Ön Denetiminden (Appendix B)</b> geçtikten sonra <b>Akademisyen Onayına</b> düşer. Akademisyen onaylayana kadar öğrenci bu içeriği göremez.</p>
            <div class="kilit-durum-ozet">
              ${durumRozetiHTML(aktifSonuc, onDenetimAcik)}
            </div>
            <div class="canli-aksiyonlar" style="justify-content:center;margin-top:8px">
              <button type="button" class="btn onay-btn" data-act="akademisyenOnayla">${ic('check')}Akademisyen Olarak Şimdi Onayla &amp; Öğrenciye Aç</button>
              <button type="button" class="btn ghost" data-act="canliBakModu" data-mod="arastirmaci">Araştırmacı Görünümüne Dön</button>
              <button type="button" class="btn ghost" data-act="onDenetimToggle">Ön Denetimi Kapat (Denetimsiz Göster)</button>
            </div>
          </div>` : `<div id="canliDeneyHost"></div>`}
        </section>
      </div>
    </div>`);
  }

  /* ---------- Yönlendirme ---------- */
  let journey = null, sonRota = null;
  function rota() {
    const h = decodeURIComponent(location.hash.slice(1));
    let r = /^modul-(m[1-6])$/.exec(h);
    if (r) return { ad: 'modul', m: modul(r[1]) };
    r = /^ders-(m[1-6])-(v[1-3]|ornek|gorev|duygu|ilgi|son)$/.exec(h);
    if (r) return { ad: 'ders', m: modul(r[1]), k: r[2] };
    r = /^ders-(m[1-6])/.exec(h);
    if (r) return { ad: 'ders', m: modul(r[1]), k: 'v1' };
    if (h === 'acilis-1' || h === 'acilis-2' || h === 'acilis-3') {
      UI.hero = h === 'acilis-3' ? 'v3' : h === 'acilis-2' ? 'v2' : 'v1';
      try { localStorage.setItem(HERO_ANAHTAR, UI.hero); } catch (e) { /* depo yok */ }
      return { ad: 'acilis' };
    }
    if (h === 'juri-slayt') return { ad: 'juri', bolum: 'juri-slayt' };
    if (h === 'juri-gorev') return { ad: 'juri', bolum: 'juri-gorev' };
    return { ad: ['giris', 'kayit', 'ilgi', 'alt-ilgi', 'panel', 'moduller', 'profil', 'yonetici', 'juri', 'canli'].includes(h) ? h : 'acilis' };
  }
  function render(kaydirma = true) {
    if (journey) { journey.destroy(); journey = null; }
    if (UI.slaytPlayer) { UI.slaytPlayer.destroy(); UI.slaytPlayer = null; }
    if (UI.gorevPlayer) { UI.gorevPlayer.destroy(); UI.gorevPlayer = null; }
    if (UI.sablonPlayer) { UI.sablonPlayer.destroy(); UI.sablonPlayer = null; }
    if (UI.canliKSlayt) { UI.canliKSlayt.destroy(); UI.canliKSlayt = null; }
    if (UI.canliKGorev) { UI.canliKGorev.destroy(); UI.canliKGorev = null; }
    if (UI.canliDSlayt) { UI.canliDSlayt.destroy(); UI.canliDSlayt = null; }
    if (UI.canliDGorev) { UI.canliDGorev.destroy(); UI.canliDGorev = null; }
    if (UI.video) { UI.video.pause(); UI.video = null; }
    const r = rota();
    if (['panel', 'moduller', 'profil', 'yonetici', 'juri', 'canli', 'modul', 'ders'].includes(r.ad)) {
      if (!S.kul) S.kul = { ad: 'Deniz Aydın' };
      if (!P().secilen.length || !siraliAltlar().length) ornekProfil();
      kaydet();
    }
    if (r.ad === 'alt-ilgi' && !P().secilen.length) { location.hash = 'ilgi'; return; }
    const sayfalar = {
      acilis: sAcilis, giris: () => sAuth('giris'), kayit: () => sAuth('kayit'), ilgi: sIlgi, 'alt-ilgi': sAlt,
      panel: sPanel, moduller: sModuller, profil: sProfil, yonetici: sYonetici, juri: sJuri, canli: sCanli, modul: () => sModul(r.m), ders: () => sDers(r.m, r.k),
    };
    app.innerHTML = sayfalar[r.ad]();
    document.body.dataset.ekran = ['ilgi', 'alt-ilgi'].includes(r.ad) ? 'kur' : ['panel', 'moduller', 'profil', 'yonetici', 'juri', 'canli', 'modul'].includes(r.ad) ? 'uyg' : r.ad;
    const anahtar = location.hash;
    if (kaydirma && anahtar !== sonRota) window.scrollTo(0, 0);
    sonRota = anahtar;
    document.title = r.ad === 'ders' ? `${adimAdi(r.m, r.k)} · Bağlam` : r.ad === 'modul' ? `${r.m.ad} · Bağlam` : r.ad === 'yonetici' ? 'Yönetici paneli · Bağlam' : r.ad === 'juri' ? 'Jüri sunumu · Bağlam' : r.ad === 'canli' ? 'Canlı deney (Kontrol vs API) · Bağlam' : 'Bağlam';
    if (r.ad === 'acilis') journey = heroMod().mount($('.research-hero'));
    if (r.ad === 'canli' && window.CanliDeney) {
      const m = modul(UI.canliModul), p = canliSeciliProfil();
      const kontrol = window.CanliDeney.getKontrol(m.id);
      if (kontrol && $('#canliKontrolHost')) {
        if (UI.canliKontrolGorunum === 'gorev' && window.GorevPrototip) {
          UI.canliKGorev = window.GorevPrototip.createTaskPlayer($('#canliKontrolHost'), kontrol.gorev, {});
        } else if (window.SlaytSunum) {
          UI.canliKSlayt = window.SlaytSunum.createPlayer($('#canliKontrolHost'), kontrol.slayt, {});
        }
      }
      const beklenenKey = `${m.id}::${p.id}`;
      if (UI.canliSonuc && UI.canliSonuc.cacheKey === beklenenKey && $('#canliDeneyHost')) {
        if (UI.canliDeneyGorunum === 'gorev' && window.GorevPrototip) {
          UI.canliDGorev = window.GorevPrototip.createTaskPlayer($('#canliDeneyHost'), UI.canliSonuc.gorev, {});
        } else if (window.SlaytSunum) {
          UI.canliDSlayt = window.SlaytSunum.createPlayer($('#canliDeneyHost'), UI.canliSonuc.slayt, {});
        }
      } else {
        canliOnbellekBak();
      }
    }
    if (r.ad === 'juri') {
      if (window.SlaytSunum && $('#juriSlaytHost')) {
        const p = window.SlaytSunum.PROFILLER[UI.juriSlaytProf || 0] || window.SlaytSunum.PROFILLER[0];
        UI.slaytPlayer = window.SlaytSunum.createPlayer($('#juriSlaytHost'), p, {});
      }
      if (window.GorevPrototip && $('#juriGorevHost')) {
        const sr = window.GorevPrototip.SENARYOLAR[UI.juriGorevProf || 0] || window.GorevPrototip.SENARYOLAR[0];
        UI.gorevPlayer = window.GorevPrototip.createTaskPlayer($('#juriGorevHost'), sr, {});
      }
      if (window.GorevPrototip && $('#juriSablonHost')) {
        UI.sablonPlayer = window.GorevPrototip.createTemplateShowcase($('#juriSablonHost'));
      }
      if (r.bolum) {
        const bEl = document.getElementById(r.bolum);
        if (bEl) bEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (r.ad === 'ders' && r.k === 'ornek' && window.SlaytSunum && $('#dersSlaytHost')) {
      const b = baglamAl(r.m);
      const canliAktif = UI.canliSonuc && UI.canliSonuc.modulId === r.m.id && ogrenciGorebilirMi(UI.canliSonuc);
      const slaytVeri = canliAktif ? UI.canliSonuc.slayt : window.SlaytSunum.baglamdanUret(b, r.m.id);
      UI.slaytPlayer = window.SlaytSunum.createPlayer($('#dersSlaytHost'), slaytVeri, {
        moduleId: r.m.id,
        onCompleteHash: `ders-${r.m.id}-gorev`,
        onCompleteAct: 'ornekTamam',
        completeLabel: 'Mikro-göreve geç',
      });
    }
    if (r.ad === 'ders' && r.k === 'gorev' && window.GorevPrototip && $('#dersGorevHost')) {
      const b = baglamAl(r.m), s = sonrakiAdim(r.m, 'gorev');
      const canliAktif = UI.canliSonuc && UI.canliSonuc.modulId === r.m.id && ogrenciGorebilirMi(UI.canliSonuc);
      const gorevVeri = canliAktif ? UI.canliSonuc.gorev : window.GorevPrototip.baglamdanSenaryo(b, r.m.id);
      UI.gorevPlayer = window.GorevPrototip.createTaskPlayer($('#dersGorevHost'), gorevVeri, {
        moduleId: r.m.id,
        onCompleteHash: `ders-${r.m.id}-${s}`,
        onCompleteAct: 'gorevTamam',
        completeLabel: 'Mikro-görevi tamamla',
      });
    }
    yontemDugme();
    heroDugme();
    ornekModDugme();
    gorevModDugme();
    kurVideo();
  }
  const yenile = () => render(false);
  const odakla = sel => { const e = $(sel); if (e) e.focus({ preventScroll: true }); };
  const notDugme = () => { const d = $('#notDugme'); if (d) d.textContent = UI.notlar ? 'Kişiselleştirme notlarını gizle' : 'Kişiselleştirme notlarını göster'; };
  const yontemDugme = () => {
    const z = zenginMi();
    $$('[data-act="yontemSec"]').forEach(b => {
      if (b.classList.contains('proto-yontem-b')) b.classList.toggle('on', b.dataset.yontem === UI.yontem);
    });
    const et = $('#protoYontemEtiket');
    if (et) et.textContent = z ? 'Zenginleştirilmiş' : 'Standart (Mevcut)';
  };
  const heroDugme = () => {
    $$('[data-act="heroSec"]').forEach(b => {
      if (b.classList.contains('proto-yontem-b') || b.classList.contains('proto-hero-b')) {
        b.classList.toggle('on', b.dataset.hero === UI.hero);
        b.setAttribute('aria-pressed', b.dataset.hero === UI.hero);
      }
    });
    const et = $('#protoHeroEtiket');
    if (et) et.textContent = UI.hero === 'v3' ? '3. Adım Adım' : UI.hero === 'v2' ? '2. 3B Basamak' : '1. Yolculuk';
  };
  function yontemDegistir(y, gitHash) {
    if (y !== 'standart' && y !== 'zengin') return;
    UI.yontem = y;
    try { localStorage.setItem(YONTEM_ANAHTAR, y); } catch (e) { /* depo yok */ }
    yontemDugme();
    if (gitHash) {
      if (location.hash === '#' + gitHash) render();
      else location.hash = gitHash;
    } else {
      yenile();
    }
  }
  function heroDegistir(h, gitHash) {
    if (h !== 'v1' && h !== 'v2' && h !== 'v3') return;
    UI.hero = h;
    try { localStorage.setItem(HERO_ANAHTAR, h); } catch (e) { /* depo yok */ }
    heroDugme();
    if (gitHash) {
      if (location.hash === '#' + gitHash || (gitHash === 'acilis' && (!location.hash || location.hash === '#acilis-1' || location.hash === '#acilis-2' || location.hash === '#acilis-3'))) {
        if (location.hash && location.hash !== '#acilis') location.hash = 'acilis';
        else render(false);
      } else {
        location.hash = gitHash;
      }
    } else {
      yenile();
    }
  }

  const ornekModDugme = () => {
    $$('[data-act="ornekModSec"]').forEach(b => {
      if (b.classList.contains('proto-yontem-b')) b.classList.toggle('on', b.dataset.mod === UI.ornekMod);
    });
    const et = $('#protoOrnekEtiket');
    if (et) et.textContent = UI.ornekMod === 'slayt' ? 'Slayt + Ses' : 'Metin (Mevcut)';
  };
  function ornekModDegistir(mod, gitHash) {
    if (mod !== 'metin' && mod !== 'slayt') return;
    UI.ornekMod = mod;
    try { localStorage.setItem(ORNEK_MOD_ANAHTAR, mod); } catch (e) { /* depo yok */ }
    ornekModDugme();
    if (gitHash) {
      if (location.hash === '#' + gitHash) render();
      else location.hash = gitHash;
    } else {
      yenile();
    }
  }
  const gorevModDugme = () => {
    $$('[data-act="gorevModSec"]').forEach(b => {
      if (b.classList.contains('proto-yontem-b')) b.classList.toggle('on', b.dataset.mod === UI.gorevMod);
    });
    const et = $('#protoGorevEtiket');
    if (et) et.textContent = UI.gorevMod === 'etkilesimli' ? 'Etkileşimli' : 'Klasik (Mevcut)';
  };
  function gorevModDegistir(mod, gitHash) {
    if (mod !== 'klasik' && mod !== 'etkilesimli') return;
    UI.gorevMod = mod;
    try { localStorage.setItem(GOREV_MOD_ANAHTAR, mod); } catch (e) { /* depo yok */ }
    gorevModDugme();
    if (gitHash) {
      if (location.hash === '#' + gitHash) render();
      else location.hash = gitHash;
    } else {
      yenile();
    }
  }
  async function modelleriCek() {
    const ck = (UI.uretim.claudeKey || '').trim();
    const gk = (UI.uretim.geminiKey || '').trim();
    const tk = (UI.uretim.ttsKey || gk || '').trim();
    if (!ck && !gk && !tk) {
      UI.modelBilgi = { tip: 'hata', mesaj: 'Önce en az bir Claude veya Gemini API anahtarı girin.' };
      yenile();
      return;
    }
    UI.modelYukleniyor = true;
    UI.modelBilgi = null;
    yenile();
    const ozet = [];
    const hatalar = [];
    UI.uretim.modeller = UI.uretim.modeller || { claude: null, geminiText: null, geminiImage: null, tts: null };

    if (ck) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
          headers: {
            'x-api-key': ck,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.error && data.error.message) || `HTTP ${res.status}`);
        const list = (data.data || []).map(m => [m.id, `${m.display_name || m.id} (${m.id})`]);
        if (list.length) {
          UI.uretim.modeller.claude = list;
          ozet.push(`Claude: ${list.length} model`);
        }
      } catch (e) {
        hatalar.push(`Claude: ${e.message}`);
      }
    }

    if (gk) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(gk)}&pageSize=100`);
        const data = await res.json();
        if (!res.ok) throw new Error((data.error && data.error.message) || `HTTP ${res.status}`);
        const tum = data.models || [];
        const textModels = tum
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && !/tts|image/i.test(m.name || ''))
          .map(m => { const id = (m.name || '').replace(/^models\//, ''); return [id, `${m.displayName || id} (${id})`]; });
        const imgModels = tum
          .filter(m => /imagen|image/i.test(m.name || '') || (m.supportedGenerationMethods || []).includes('predict'))
          .map(m => { const id = (m.name || '').replace(/^models\//, ''); return [id, `${m.displayName || id} (${id})`]; });
        const geminiTtsModels = tum
          .filter(m => /tts/i.test(m.name || '') && (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => { const id = (m.name || '').replace(/^models\//, ''); return [id, `${m.displayName || id} (${id})`]; });
        if (textModels.length) UI.uretim.modeller.geminiText = textModels;
        if (imgModels.length) UI.uretim.modeller.geminiImage = imgModels;
        if (geminiTtsModels.length) {
          UI.uretim.modeller.tts = [...geminiTtsModels, ...VARSAYILAN_MODELLER.tts.filter(([v]) => !geminiTtsModels.some(([g]) => g === v))];
          ozet.push(`Gemini TTS: ${geminiTtsModels.length} model`);
        }
        ozet.push(`Gemini: ${textModels.length} metin / ${imgModels.length} görsel modeli`);
      } catch (e) {
        hatalar.push(`Gemini: ${e.message}`);
      }
    }

    if (tk) {
      try {
        const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=tr-TR&key=${encodeURIComponent(tk)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.voices) && data.voices.length) {
          const cloudVoices = data.voices.map(v => [v.name, `Google Cloud TTS · ${v.name}${v.ssmlGender ? ' (' + v.ssmlGender + ')' : ''}`]);
          const geminiOnes = (UI.uretim.modeller.tts || []).filter(([id]) => /^gemini-/i.test(id));
          UI.uretim.modeller.tts = [...(geminiOnes.length ? geminiOnes : VARSAYILAN_MODELLER.tts.filter(([id]) => /^gemini-/i.test(id))), ...cloudVoices];
          ozet.push(`Cloud TTS: ${data.voices.length} Türkçe ses`);
        }
      } catch (e) { /* TTS key opsiyonel; hata vermeden varsayılanlar korunur */ }
    }

    UI.modelYukleniyor = false;
    kaydetUretim();
    UI.modelBilgi = hatalar.length && !ozet.length
      ? { tip: 'hata', mesaj: `Model çekilemedi — ${hatalar.join(' · ')}` }
      : { tip: hatalar.length ? 'hata' : 'basari', mesaj: [...ozet, ...hatalar].join(' · ') };
    yenile();
  }

  /* ---------- Etkileşimler ---------- */
  const eylem = {
    kaydir: el => { const h = document.getElementById(el.dataset.hedef); if (h) h.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); },
    yontemSec: el => { yontemDegistir(el.dataset.yontem, el.dataset.git); },
    heroSec: el => { heroDegistir(el.dataset.hero, el.dataset.git); },
    ornekModSec: el => { ornekModDegistir(el.dataset.mod, el.dataset.git); },
    gorevModSec: el => { gorevModDegistir(el.dataset.mod, el.dataset.git); },
    modelleriCek: () => { modelleriCek(); },
    modelleriSifirla: () => { UI.uretim.modeller = { claude: null, geminiText: null, geminiImage: null, tts: null }; UI.modelBilgi = null; kaydetUretim(); yenile(); },
    canliUret: () => { canliUretBaslat(false); },
    canliYenidenUret: () => { canliUretBaslat(true); },
    onDenetimSec: el => {
      UI.uretim.onDenetimAcik = el.dataset.acik === '1';
      kaydetUretim();
      yenile();
    },
    onDenetimToggle: () => {
      UI.uretim.onDenetimAcik = !(UI.uretim.onDenetimAcik !== false);
      kaydetUretim();
      yenile();
    },
    canliSimdiDenetle: () => {
      UI.uretim.onDenetimAcik = true;
      kaydetUretim();
      canliUretBaslat(true);
    },
    canliBakModu: el => {
      UI.canliBakModu = el.dataset.mod === 'ogrenci' ? 'ogrenci' : 'arastirmaci';
      yenile();
    },
    canliDenetimSekme: el => {
      UI.canliDenetimSekme = el.dataset.sekme || 'rubrik';
      yenile();
    },
    canliTurSec: el => {
      UI.canliSeciliTur = +el.dataset.i || 0;
      yenile();
    },
    canliIzToggle: el => {
      const id = el.dataset.id;
      const cur = UI.canliAcikIz[id];
      UI.canliAcikIz[id] = cur === undefined ? false : !cur;
      yenile();
    },
    canliIzHepsi: el => {
      const ac = el.dataset.ac === '1';
      const izler = (UI.canliSonuc && UI.canliSonuc.denetimIzi) || [];
      izler.forEach(iz => { UI.canliAcikIz[iz.id] = ac; });
      yenile();
    },
    akademisyenOnayla: async () => {
      if (!window.CanliDeney || !UI.canliSonuc) return;
      const notEl = $('#canliAkademisyenNot');
      const not = (notEl ? notEl.value : UI.canliAkademisyenNot || '').trim();
      UI.canliSonuc = await window.CanliDeney.akademisyenKararKaydet(UI.canliSonuc, {
        karar: 'onay',
        akademisyenAd: UI.uretim.akademisyenAd || 'Doç. Dr. Akademik Danışman',
        not: not || 'Appendix B pedagojik yeterlik (10 boyut) ve deney-kontrol eşdeğerliği (5 boyut) incelendi; öğrenci erişimine açılması onaylandı.',
      });
      if (window.CanliDeney.cacheListAll) UI.canliTumUretiler = await window.CanliDeney.cacheListAll();
      yenile();
    },
    akademisyenOnayGeriAl: async () => {
      if (!window.CanliDeney || !UI.canliSonuc) return;
      UI.canliSonuc.denetim = UI.canliSonuc.denetim || {};
      UI.canliSonuc.denetim.onayDurumu = 'akademisyen_bekliyor';
      UI.canliSonuc.denetim.ogrenciGorebilir = false;
      await window.CanliDeney.cacheSet(UI.canliSonuc.cacheKey, UI.canliSonuc);
      if (window.CanliDeney.cacheListAll) UI.canliTumUretiler = await window.CanliDeney.cacheListAll();
      yenile();
    },
    akademisyenRevizyonIste: async () => {
      if (!window.CanliDeney || !UI.canliSonuc) return;
      const notEl = $('#canliAkademisyenNot');
      const not = (notEl ? notEl.value : UI.canliAkademisyenNot || '').trim() || 'Deney-kontrol eşdeğerliğini ve bilişsel yük uyumunu güçlendirerek senaryoyu yeniden kurgula.';
      UI.canliSonuc = await window.CanliDeney.akademisyenKararKaydet(UI.canliSonuc, {
        karar: 'revizyon',
        akademisyenAd: UI.uretim.akademisyenAd || 'Doç. Dr. Akademik Danışman',
        not,
      });
      await canliUretBaslat(true, not);
    },
    kuyrukSec: async el => {
      const mId = el.dataset.m;
      const pId = el.dataset.p;
      if (mId) UI.canliModul = mId;
      if (pId) {
        const bilinen = D.juriSunum.profiller.some(pr => pr.id === pId);
        UI.canliProfil = bilinen ? pId : (pId.startsWith('aktif-') ? 'aktif' : 'ozel');
      }
      UI.canliSonuc = null;
      await canliOnbellekBak();
      yenile();
    },
    canliOnbellekSil: async () => {
      if (!window.CanliDeney) return;
      const p = canliSeciliProfil();
      const key = `${UI.canliModul}::${p.id}`;
      await window.CanliDeney.cacheDel(key);
      if (UI.canliSonuc && UI.canliSonuc.cacheKey === key) UI.canliSonuc = null;
      UI.canliAdimlar = {};
      yenile();
    },
    canliIndir: async () => {
      if (!window.CanliDeney || !UI.canliSonuc) return;
      try {
        const msg = await window.CanliDeney.dosyalaraKaydet(UI.canliSonuc);
        UI.canliHata = null;
        UI.canliAdimlar[4] = { adim: 4, durum: 'bitti', mesaj: msg };
        yenile();
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        UI.canliHata = err && err.message ? err.message : String(err);
        yenile();
      }
    },
    canliKGorunum: el => { UI.canliKontrolGorunum = el.dataset.v === 'gorev' ? 'gorev' : 'slayt'; yenile(); },
    canliDGorunum: el => { UI.canliDeneyGorunum = el.dataset.v === 'gorev' ? 'gorev' : 'slayt'; yenile(); },
    canliDetay: () => { UI.canliDetayAcik = !UI.canliDetayAcik; yenile(); },
    juriSlaytProf: el => {
      UI.juriSlaytProf = +el.dataset.i;
      if (UI.slaytPlayer) { UI.slaytPlayer.destroy(); UI.slaytPlayer = null; }
      $$('[data-act="juriSlaytProf"]').forEach(b => { const on = +b.dataset.i === UI.juriSlaytProf; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      if (window.SlaytSunum && $('#juriSlaytHost')) {
        const p = window.SlaytSunum.PROFILLER[UI.juriSlaytProf] || window.SlaytSunum.PROFILLER[0];
        UI.slaytPlayer = window.SlaytSunum.createPlayer($('#juriSlaytHost'), p, {});
      }
    },
    juriGorevProf: el => {
      UI.juriGorevProf = +el.dataset.i;
      if (UI.gorevPlayer) { UI.gorevPlayer.destroy(); UI.gorevPlayer = null; }
      $$('[data-act="juriGorevProf"]').forEach(b => { const on = +b.dataset.i === UI.juriGorevProf; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      if (window.GorevPrototip && $('#juriGorevHost')) {
        const sr = window.GorevPrototip.SENARYOLAR[UI.juriGorevProf] || window.GorevPrototip.SENARYOLAR[0];
        UI.gorevPlayer = window.GorevPrototip.createTaskPlayer($('#juriGorevHost'), sr, {});
      }
    },
    keyGoster: el => {
      const k = el.dataset.key;
      UI.keyGorunur[k] = !UI.keyGorunur[k];
      const inp = $(`#api-${k}`);
      if (inp) { inp.type = UI.keyGorunur[k] ? 'text' : 'password'; el.textContent = UI.keyGorunur[k] ? 'Gizle' : 'Göster'; }
    },
    juriProfSec: el => { UI.juriProf = +el.dataset.i; yenile(); const m2 = document.getElementById('juri-mod2'); if (m2) m2.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); },
    juriProfAdim: el => { const n = D.juriSunum.profiller.length; UI.juriProf = Math.max(0, Math.min(n - 1, (UI.juriProf || 0) + +el.dataset.yon)); yenile(); },
    juriCozumAc: el => { const k = el.dataset.key; UI.juriCozum[k] = !UI.juriCozum[k]; yenile(); },
    ilgiSec: el => {
      const p = P(), id = el.dataset.id, i = p.secilen.indexOf(id);
      if (i < 0) p.secilen.push(id); else p.secilen.splice(i, 1);
      kaydet();
      const on = i < 0; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
      $('#ilgiSay').textContent = secimMetni(); $('#ilgiDevam').hidden = !p.secilen.length; $('#ilgiPasif').hidden = !!p.secilen.length;
    },
    altAktif: el => {
      if (zenginMi()) UI.zenginAktif = el.dataset.id; else UI.aktif = el.dataset.id;
      yenile(); window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    puan: el => { const p = P(); p.puan[el.dataset.alt] = +el.dataset.n; kaydet(); yenile(); odakla(`[data-act="puan"][data-alt="${el.dataset.alt}"][data-n="${el.dataset.n}"]`); },
    altSec: el => {
      const p = P(), id = el.dataset.id;
      if (p.altSec[id]) { delete p.altSec[id]; delete p.puan[id]; } else p.altSec[id] = true;
      kaydet(); yenile(); odakla(`[data-act="altSec"][data-id="${id}"]`);
    },
    etkinlikSec: el => {
      const alt = el.dataset.alt, etk = el.dataset.etk;
      if (!alt || !etk) return;
      const l = SZ.etkinlik[alt] = SZ.etkinlik[alt] || [];
      const i = l.indexOf(etk);
      if (i < 0) l.push(etk); else l.splice(i, 1);
      kaydet(); yenile();
    },
    ozelEtkinlikEkle: el => {
      const alt = el.dataset.alt, inp = $(`[data-ozel-etk-girdi="${alt}"]`);
      if (!inp) return;
      const val = inp.value.trim().replace(/\s+/g, ' ');
      if (!val) { inp.focus(); return; }
      const k = ilgi(alt.split('.')[0]);
      const hazir = (k && k.ozelEtkinlikler) || [];
      const ozelL = SZ.ozelEtkinlik[alt] = SZ.ozelEtkinlik[alt] || [];
      const tum = [...hazir, ...ozelL];
      const mevcut = tum.find(x => x.toLocaleLowerCase('tr') === val.toLocaleLowerCase('tr'));
      const hedef = mevcut || val;
      if (!mevcut) ozelL.push(val);
      const secL = SZ.etkinlik[alt] = SZ.etkinlik[alt] || [];
      if (!secL.includes(hedef)) secL.push(hedef);
      kaydet(); yenile(); odakla(`[data-ozel-etk-girdi="${alt}"]`);
    },
    ozelSil: el => {
      const p = P(), id = el.dataset.id, k = id.split('.')[0];
      p.ozel[k] = (p.ozel[k] || []).filter(o => o.id !== id); delete p.puan[id]; delete p.detay[id];
      if (p.etkinlik) delete p.etkinlik[id];
      if (p.ozelEtkinlik) delete p.ozelEtkinlik[id];
      Object.keys(S.baglamSec).forEach(m => { if (S.baglamSec[m] === id) delete S.baglamSec[m]; });
      kaydet(); yenile(); odakla('#ozelAd');
    },
    notlar: () => { UI.notlar = !UI.notlar; try { localStorage.setItem('baglam-notlar', UI.notlar ? '1' : '0'); } catch (e) { /* depo yok */ } notDugme(); if (/^#ders-/.test(location.hash)) yenile(); },
    altBitir: () => { if (!S.kul) S.kul = { ad: 'Deniz Aydın' }; kaydet(); location.hash = 'panel'; },
    cikis: () => { location.hash = 'acilis'; },
    bolum: el => { const v = UI.video, vp = $('#vp'); if (!v || !vp) return; const git = () => { v.currentTime = +el.dataset.t / +vp.dataset.sure * v.duration; UI.oynat(); }; if (v.duration) git(); else v.addEventListener('loadedmetadata', git, { once: true }); },
    videoTamam: el => adimIsaretle(el.dataset.m, el.dataset.k),
    ornekTamam: el => adimIsaretle(el.dataset.m, 'ornek'),
    gorevTamam: el => adimIsaretle(el.dataset.m, 'gorev'),
    ornekAc: el => {
      const m = modul(el.dataset.m), simdi = UI.ornekAcik[m.id] || (il(m.id).ornek ? 3 : 1);
      UI.ornekAcik[m.id] = simdi + 1; yenile();
      const yeni = document.getElementById('adm-' + simdi); if (yeni) yeni.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    kontrol: el => { UI.gs[el.dataset.key].kontrol = true; gorevYenile(el.dataset.key); },
    srTasi: el => { const st = UI.gs[el.dataset.key], a = +el.dataset.pos, b = a + +el.dataset.yon; if (b < 0 || b >= st.sira.length) return; [st.sira[a], st.sira[b]] = [st.sira[b], st.sira[a]]; st.kontrol = false; gorevYenile(el.dataset.key); const btn = $(`section [data-act="srTasi"][data-key="${el.dataset.key}"][data-pos="${b}"][data-yon="${el.dataset.yon}"]`); if (btn && !btn.disabled) btn.focus(); },
    cipSec: el => { const st = UI.gs[el.dataset.key], i = +el.dataset.i; st.sec = st.sec === i ? null : i; gorevYenile(el.dataset.key); },
    kutuSec: el => { const st = UI.gs[el.dataset.key]; if (st.sec == null) return; const k = +el.dataset.kutu; if (k < 0) delete st.yer[st.sec]; else st.yer[st.sec] = k; st.sec = null; st.kontrol = false; gorevYenile(el.dataset.key); },
    tbSec: el => { const st = UI.gs[el.dataset.key], s = st.sec[+el.dataset.t], n = +el.dataset.n, i = s.indexOf(n); if (i < 0) s.push(n); else s.splice(i, 1); st.kontrol = false; gorevYenile(el.dataset.key); },
    secenek: el => { const st = UI.gs[el.dataset.key]; st.sec = +el.dataset.i; st.kontrol = false; gorevYenile(el.dataset.key); },
    olcek: el => {
      const p = il(el.dataset.m), tur = el.dataset.tur; p[tur][el.dataset.i] = +el.dataset.v; kaydet();
      $$('button', el.parentElement).forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      const liste = tur === 'duygu' ? D.duygular : D.ilgiMaddeleri;
      const top = liste.length, n = liste.filter((_, i) => p[tur][i] != null).length;
      $('#olSay').textContent = `${n}/${top} yanıtlandı`; $('#olDevam').disabled = n < top;
    },
    olcekBitir: el => { adimIsaretle(el.dataset.m, el.dataset.tur); location.hash = el.dataset.r; },
    ekAc: el => { const p = $('#ekPanel'); p.hidden = !p.hidden; el.setAttribute('aria-expanded', !p.hidden); },
    sifirla: () => { S = bos(); SZ = bosZengin(); UI.gs = {}; UI.ornekAcik = {}; kaydet(); $('#ekPanel').hidden = true; if (location.hash === '#acilis') render(); else location.hash = 'acilis'; },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && eylem[el.dataset.act] && !el.disabled) eylem[el.dataset.act](el, e);
    const panel = $('#ekPanel');
    if (panel && !panel.hidden && !e.target.closest('.proto')) panel.hidden = true;
    if (e.target.closest('.proto-panel a')) panel.hidden = true;
  });
  document.addEventListener('keydown', e => {
    if (e.target.dataset && e.target.dataset.ozelEtkGirdi && e.key === 'Enter') {
      e.preventDefault();
      const btn = $(`[data-act="ozelEtkinlikEkle"][data-alt="${e.target.dataset.ozelEtkGirdi}"]`);
      if (btn) btn.click();
      return;
    }
    const el = e.target.closest && e.target.closest('[role="button"][data-act], [role="radio"][data-act]');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.detay) { P().detay[t.dataset.detay] = t.value; kaydet(); }
    if (t.dataset.cevap) { S.cevap[t.dataset.cevap] = t.value; kaydet(); const s = document.getElementById('say-' + t.dataset.cevap); if (s) s.textContent = kelime(t.value) + ' kelime · otomatik kaydedilir'; }
    if (t.dataset.uretim) { UI.uretim[t.dataset.uretim] = t.value; kaydetUretim(); const r = $('#yonUretimRozet'); if (r) r.textContent = 'Otomatik kaydedildi'; }
    if (t.id === 'canliOzelKategori') UI.canliOzelKategori = t.value;
    if (t.id === 'canliOzelAlt') UI.canliOzelAlt = t.value;
    if (t.id === 'canliOzelAciklama') UI.canliOzelAciklama = t.value;
    if (t.id === 'canliAkademisyenNot') UI.canliAkademisyenNot = t.value;
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'bagSec') { S.baglamSec[e.target.dataset.m] = e.target.value; kaydet(); yenile(); }
    if (e.target.id === 'juriProfSelect') { UI.juriProf = +e.target.value; yenile(); }
    if (e.target.id === 'juriEvrenSelect') { UI.juriEvrenProf = +e.target.value; yenile(); }
    if (e.target.id === 'canliModul') { UI.canliModul = e.target.value; UI.canliAdimlar = {}; UI.canliHata = null; yenile(); }
    if (e.target.id === 'canliProfil') { UI.canliProfil = e.target.value; UI.canliAdimlar = {}; UI.canliHata = null; yenile(); }
    if (e.target.dataset && e.target.dataset.uretim) { UI.uretim[e.target.dataset.uretim] = e.target.value; kaydetUretim(); const r = $('#yonUretimRozet'); if (r) r.textContent = 'Model güncellendi'; }
  });
  document.addEventListener('submit', e => {
    if (e.target.id === 'ozelForm') {
      e.preventDefault();
      const p = P(), k = e.target.dataset.k, inp = $('#ozelAd'), ad = inp.value.trim().replace(/\s+/g, ' ');
      const liste = p.ozel[k] = p.ozel[k] || [], bilgi = $('#ozelBilgi');
      const var_ = altlarOf(ilgi(k)).some(a => a.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
      if (!ad) { bilgi.textContent = 'Eklemek için bir alt alan adı yaz.'; bilgi.classList.add('ozel-hata'); inp.focus(); return; }
      if (var_) { bilgi.textContent = `“${ad}” zaten listede. Listeden işaretleyebilirsin.`; bilgi.classList.add('ozel-hata'); inp.focus(); return; }
      if (liste.length >= 3) return;
      liste.push({ id: k + '.ozel' + Date.now().toString(36), ad }); kaydet(); yenile(); odakla('#ozelAd');
      return;
    }
    if (e.target.id !== 'authForm') return;
    e.preventDefault();
    if (e.target.dataset.tur === 'kayit') {
      const ad = ($('#fAd').value || '').trim() || 'Deniz Aydın';
      S = bos(); SZ = bosZengin(); S.kul = { ad }; UI.gs = {}; kaydet(); location.hash = 'ilgi';
    } else {
      if (!S.kul) S.kul = { ad: 'Deniz Aydın' };
      if (!P().secilen.length) ornekProfil();
      kaydet(); location.hash = 'panel';
    }
  });

  /* Sürükle bırak: sıralama listesi ve ifade kartları */
  const temizle = () => $$('.ust, .hedef').forEach(x => x.classList.remove('ust', 'hedef'));
  document.addEventListener('dragstart', e => {
    const li = e.target.closest && e.target.closest('.sr li'), cip = e.target.closest && e.target.closest('.cip');
    const sec = e.target.closest && e.target.closest('section.gorev');
    if (!sec) return;
    const key = sec.dataset.gm + '-' + sec.dataset.pk;
    if (cip) UI.drag = { tip: 'cip', key, i: +cip.dataset.i };
    else if (li) { UI.drag = { tip: 'sr', key, pos: +li.dataset.pos }; li.classList.add('suruk'); }
    else return;
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '');
  });
  document.addEventListener('dragover', e => {
    const d = UI.drag; if (!d) return;
    const hedef = d.tip === 'sr' ? e.target.closest('.sr li') : e.target.closest('.kutu, .havuz');
    if (!hedef || hedef.closest('section.gorev').dataset.gm + '-' + hedef.closest('section.gorev').dataset.pk !== d.key) return;
    e.preventDefault(); temizle(); hedef.classList.add(d.tip === 'sr' ? 'ust' : 'hedef');
  });
  document.addEventListener('drop', e => {
    const d = UI.drag; if (!d) return;
    const st = UI.gs[d.key];
    if (d.tip === 'sr') {
      const li = e.target.closest('.sr li'); if (!li) return;
      e.preventDefault(); const [x] = st.sira.splice(d.pos, 1); st.sira.splice(+li.dataset.pos, 0, x);
    } else {
      const k = e.target.closest('.kutu, .havuz'); if (!k) return;
      e.preventDefault(); const ki = +k.dataset.kutu; if (ki < 0) delete st.yer[d.i]; else st.yer[d.i] = ki; st.sec = null;
    }
    st.kontrol = false; UI.drag = null; gorevYenile(d.key);
  });
  document.addEventListener('dragend', () => { UI.drag = null; temizle(); $$('.suruk').forEach(x => x.classList.remove('suruk')); });

  /* Prototip ekran listesi ve yönetici hızlı geçişi */
  const ek = document.createElement('div');
  ek.className = 'proto';
  ek.innerHTML = `<div class="proto-panel" id="ekPanel" hidden>
    <div class="proto-yontem">
      <div class="proto-yontem-bas"><span>İlgi toplama yöntemi</span><b id="protoYontemEtiket"></b></div>
      <div class="proto-yontem-sec">
        <button type="button" class="proto-yontem-b" data-act="yontemSec" data-yontem="standart">Mevcut (Standart)</button>
        <button type="button" class="proto-yontem-b" data-act="yontemSec" data-yontem="zengin">Zenginleştirilmiş</button>
      </div>
    </div>
    <div class="proto-yontem">
      <div class="proto-yontem-bas"><span>Açılış (Index)</span><b id="protoHeroEtiket"></b></div>
      <div class="proto-yontem-sec proto-yontem-sec-3">
        <button type="button" class="proto-yontem-b" data-act="heroSec" data-hero="v1" data-git="acilis">1. Yol</button>
        <button type="button" class="proto-yontem-b" data-act="heroSec" data-hero="v2" data-git="acilis">2. 3B</button>
        <button type="button" class="proto-yontem-b" data-act="heroSec" data-hero="v3" data-git="acilis">3. Adım</button>
      </div>
    </div>
    <div class="proto-yontem">
      <div class="proto-yontem-bas"><span>Çözümlü örnek</span><b id="protoOrnekEtiket"></b></div>
      <div class="proto-yontem-sec">
        <button type="button" class="proto-yontem-b" data-act="ornekModSec" data-mod="metin">Metin (Mevcut)</button>
        <button type="button" class="proto-yontem-b" data-act="ornekModSec" data-mod="slayt">Slayt + Ses</button>
      </div>
    </div>
    <div class="proto-yontem">
      <div class="proto-yontem-bas"><span>Mikro-görev</span><b id="protoGorevEtiket"></b></div>
      <div class="proto-yontem-sec">
        <button type="button" class="proto-yontem-b" data-act="gorevModSec" data-mod="klasik">Klasik (Mevcut)</button>
        <button type="button" class="proto-yontem-b" data-act="gorevModSec" data-mod="etkilesimli">Etkileşimli</button>
      </div>
    </div>
    ${[
    ['acilis-1', 'Açılış sayfası (1. versiyon)'], ['acilis-2', 'Açılış sayfası (2. versiyon · 3B)'], ['acilis-3', 'Açılış sayfası (3. versiyon · Adım adım)'], ['giris', 'Giriş'], ['kayit', 'Kayıt'], ['ilgi', 'İlgi alanları'], ['alt-ilgi', 'Alt alanlar ve puanlama'],
    ['panel', 'Öğrenci ana sayfası'], ['moduller', 'Modüller'], ['modul-m2', 'Modül sayfası'], ['ders-m2-v1', 'Konu anlatım videosu'],
    ['ders-m2-ornek', 'Örnek uygulama'], ['ders-m2-gorev', 'Mikro görev'], ['ders-m4-gorev', 'Mikro görev (etkileşimli)'],
    ['ders-m2-duygu', 'Epistemik duygular'], ['ders-m2-ilgi', 'Durumsal ilgi'], ['ders-m2-son', 'Modül sonu'], ['profil', 'İlgi profili'], ['juri', 'Jüri sunumu (Kişiselleştirme)'], ['juri-slayt', 'Jüri sunumu (Slayt + Ses)'], ['juri-gorev', 'Jüri sunumu (Mikro-görev)'], ['yonetici', 'Yönetici paneli'], ['canli', 'Canlı Deney (Kontrol vs API)'],
  ].map(([r, a]) => `<a href="#${r}">${a}</a>`).join('')}<button class="proto-not" id="notDugme" data-act="notlar"></button><button data-act="sifirla">Verileri sıfırla</button></div>
  <div class="proto-alt-satir">
    <div class="proto-hero-bar" role="group" aria-label="Açılış sayfası versiyonu">
      <button type="button" class="proto-hero-b" data-act="heroSec" data-hero="v1" data-git="acilis">1. Versiyon</button>
      <button type="button" class="proto-hero-b" data-act="heroSec" data-hero="v2" data-git="acilis">2. Versiyon</button>
      <button type="button" class="proto-hero-b" data-act="heroSec" data-hero="v3" data-git="acilis">3. Versiyon</button>
    </div>
    <button class="proto-dugme" data-act="ekAc" aria-expanded="false">${ic('ekran')}Ekranlar ve Yönetici</button>
  </div>`;
  document.body.appendChild(ek);
  notDugme();
  yontemDugme();
  heroDugme();
  ornekModDugme();
  gorevModDugme();

  window.addEventListener('hashchange', () => render());
  render();
})();
