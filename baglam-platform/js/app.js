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
    ekran: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
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
  const ilgi = id => D.ilgiler.find(k => k.id === id);
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
  const bos = () => ({ kul: null, secilen: [], altSec: {}, ozel: {}, puan: {}, detay: {}, ilerleme: {}, baglamSec: {}, cevap: {} });
  let S = (() => { try { const x = JSON.parse(localStorage.getItem(ANAHTAR)); if (x && typeof x === 'object') return { ...bos(), ...x }; } catch (e) { /* depo yok */ } return bos(); })();
  const kaydet = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(S)); } catch (e) { /* depo yok */ } };
  const UI = { aktif: null, ornekAcik: {}, gs: {}, drag: null, video: null, notlar: (() => { try { return localStorage.getItem('baglam-notlar') === '1'; } catch (e) { return false; } })() };
  const OZEL_SORU = 'Bu alanda en çok neyle ilgileniyorsun?';
  const OZEL_ORNEK = { spor: 'Bisiklet', muzik: 'Caz', oyun: 'Bulmaca oyunları', sinema: 'Kore dizileri', teknoloji: 'Drone', seyahat: 'Bisiklet turları', yemek: 'Vegan mutfak', doga: 'Akvaryum' };
  const altlarOf = k => [...k.altlar, ...(S.ozel[k.id] || []).map(o => ({ ...o, soru: OZEL_SORU, ozel: true }))];
  const seciliMi = a => !!(a.ozel || S.altSec[a.id]);
  const seciliAltlar = k => altlarOf(k).filter(seciliMi);

  function ornekProfil() {
    S.kul = S.kul || { ad: 'Deniz Aydın' };
    S.secilen = ['spor', 'muzik', 'oyun'];
    S.altSec = { 'spor.futbol': true, 'spor.fitness': true, 'muzik.rock': true, 'muzik.enstruman': true, 'oyun.strateji': true, 'oyun.rpg': true };
    S.ozel = { spor: [{ id: 'spor.ozel1', ad: 'Bisiklet' }] };
    S.puan = { 'spor.futbol': 5, 'spor.fitness': 4, 'spor.ozel1': 3, 'muzik.rock': 5, 'muzik.enstruman': 3, 'oyun.strateji': 4, 'oyun.rpg': 4 };
    S.detay = { 'spor.futbol': 'Trabzonspor, maçları kaçırmam', 'spor.fitness': 'Haftada üç gün sahilde koşuyorum', 'spor.ozel1': 'Hafta sonu sahil yolunda sürüyorum', 'muzik.rock': 'Duman ve Arctic Monkeys', 'muzik.enstruman': 'Gitar öğreniyorum', 'oyun.strateji': 'Age of Empires II', 'oyun.rpg': 'The Witcher 3' };
    S.baglamSec = {};
    S.ilerleme = {
      m1: { v: [true, true, true], ornek: true, gorev: true, duygu: { 0: 4, 1: 3, 2: 4, 3: 2, 4: 1, 5: 1, 6: 2 }, ilgi: { 0: 4, 1: 3, 2: 5, 3: 4, 4: 4, 5: 3, 6: 4 }, duyguOk: true, ilgiOk: true },
      m2: { v: [true, true, false], ornek: false, gorev: false, duygu: {}, ilgi: {}, duyguOk: false, ilgiOk: false },
    };
  }
  const il = mid => (S.ilerleme[mid] = S.ilerleme[mid] || { v: [false, false, false], ornek: false, gorev: false, duygu: {}, ilgi: {}, duyguOk: false, ilgiOk: false });
  function adimlar(m) {
    const p = il(m.id);
    return [
      ...m.videolar.map((v, i) => ({ k: 'v' + (i + 1), ad: v.ad, ek: v.sure, t: !!p.v[i], grup: 'Konu anlatımı' })),
      { k: 'ornek', ad: 'Örnek uygulama', ek: '3 adım', t: !!p.ornek, grup: 'Uygulama' },
      { k: 'gorev', ad: 'Mikro görev', t: !!p.gorev, grup: 'Uygulama' },
      { k: 'duygu', ad: 'Neler hissettin?', ek: '7 soru', t: !!p.duyguOk, grup: 'Modül sonu' },
      { k: 'ilgi', ad: 'Modülü değerlendir', ek: '7 soru', t: !!p.ilgiOk, grup: 'Modül sonu' },
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
    const l = [];
    S.secilen.map(ilgi).filter(Boolean).forEach((k, ki) => seciliAltlar(k).forEach((a, ai) => l.push({ k, a, p: S.puan[a.id] || 0, sira: ki * 20 + ai })));
    return l.sort((x, y) => y.p - x.p || (x.a.ozel ? 1 : 0) - (y.a.ozel ? 1 : 0) || x.sira - y.sira);
  }
  function baglamHavuzu() {
    const l = siraliAltlar(), aday = l.filter(x => x.p >= 3), taban = aday.length ? aday : l;
    const once = [], sonra = [], gorulen = new Set();
    taban.forEach(x => { if (gorulen.has(x.k.id)) sonra.push(x); else { gorulen.add(x.k.id); once.push(x); } });
    return [...once, ...sonra];
  }
  const paket = (k, a, p, neden) => ({ ilgi: k, alt: a, p, neden, c: D.baglam[a.id] || D.baglam[k.id], duzey: D.baglam[a.id] ? 'alt' : 'kategori', detay: (S.detay[a.id] || '').trim() });
  function baglamAl(m) {
    const l = siraliAltlar();
    if (!l.length) { const k = D.ilgiler[0]; return paket(k, k.altlar[0], 0, 'varsayilan'); }
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
    return `<div class="lp">
      <header class="wrap lp-nav">${logo()}
        <nav><button data-act="kaydir" data-hedef="nasil">Nasıl çalışır</button><button data-act="kaydir" data-hedef="lp-moduller">Modüller</button></nav>
        <div class="lp-nav-btn"><a class="btn ghost" href="#giris">Giriş yap</a><a class="btn" href="#kayit">Kayıt ol</a></div></header>
      ${window.ResearchJourney.render()}
      <div class="wrap research-transition"><span>${ic('katman')} Bir soru. Altı adım. Bilimsel bir bakış.</span><span>Gözlemle başlayan, bilgiye uzanan bir yolculuk.</span></div>
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
  const secimMetni = () => S.secilen.length ? `${S.secilen.length} alan seçildi` : 'En az bir alan seç';
  function sIlgi() {
    return `<div class="kur">${kurUst(1)}<main class="wrap kur-govde">
      <h1>Nelerle ilgileniyorsun?</h1><p>Sana yakın gelen alanları seç. Örnekler ve görevler bu alanlardan kurulacak.</p>
      <div class="ilgi-izgara">${D.ilgiler.map(k => { const on = S.secilen.includes(k.id); return `<button class="ik${on ? ' on' : ''}" data-act="ilgiSec" data-id="${k.id}" aria-pressed="${on}"><span class="ik-tik">${ic('check')}</span>${obj(k.obj)}<b>${k.ad}</b><small>${k.alt}</small></button>`; }).join('')}</div>
      </main>
      <div class="kur-alt"><div class="wrap"><span id="ilgiSay">${secimMetni()}</span><div class="sag-grup"><a class="btn lg" id="ilgiDevam" href="#alt-ilgi"${S.secilen.length ? '' : ' hidden'}>Devam ${ic('sag')}</a><button class="btn lg" disabled${S.secilen.length ? ' hidden' : ''} id="ilgiPasif">Devam ${ic('sag')}</button></div></div></div></div>`;
  }
  function altSatir(a) {
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
  function ozelEkle(k) {
    const n = (S.ozel[k.id] || []).length;
    if (n >= 3) return '<p class="ozel-not">Bu alana ekleyebileceğin 3 alt alanın hepsini ekledin.</p>';
    return `<form class="ozel-ekle" id="ozelForm" data-k="${k.id}" novalidate><label for="ozelAd">Listede yok mu? Kendi alt alanını ekle</label>
      <div><input class="girdi" id="ozelAd" maxlength="40" placeholder="Örneğin: ${OZEL_ORNEK[k.id] || ''}" autocomplete="off"><button class="btn ghost" type="submit">${ic('arti')}Ekle</button></div>
      <small id="ozelBilgi">${n ? `${n}/3 eklendi` : 'En fazla 3 alt alan ekleyebilirsin.'}</small></form>`;
  }
  function sAlt() {
    const sec = S.secilen.map(ilgi).filter(Boolean);
    const aktif = sec.find(k => k.id === UI.aktif) || sec[0]; UI.aktif = aktif.id;
    const durum = k => { const s = seciliAltlar(k); return { n: s.length, eksik: s.filter(a => !S.puan[a.id]).length }; };
    const tamamMi = k => { const d = durum(k); return d.n > 0 && d.eksik === 0; };
    const topN = sec.reduce((t, k) => t + durum(k).n, 0), bekleyen = sec.reduce((t, k) => t + durum(k).eksik, 0);
    const bos = sec.filter(k => !durum(k).n).length;
    const siradaki = sec.find(k => k !== aktif && !tamamMi(k));
    const ozet = !topN ? 'Her ilgi alanından en az bir alt alan seç'
      : [`${topN} alt alan seçildi`, bekleyen ? `${bekleyen} puan bekliyor` : '', bos ? `${bos} alanda seçim yok` : ''].filter(Boolean).join(' · ');
    return `<div class="kur">${kurUst(2)}<main class="wrap kur-govde"><div class="alt-duzen">
      <aside class="alt-yan">${sec.map(k => { const d = durum(k); return `<button class="ay${k === aktif ? ' on' : ''}" data-act="altAktif" data-id="${k.id}">${obj(k.obj)}<span><b>${k.ad}</b><small>${d.n ? `${d.n} alt alan seçildi` : 'Henüz seçim yok'}</small></span>${tamamMi(k) ? ic('check') : ''}</button>`; }).join('')}
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
      ${[['panel', 'ev', 'Ana sayfa'], ['moduller', 'katman', 'Modüller'], ['profil', 'kalp', 'İlgi profilim']].map(([r, i, a]) => `<a href="#${r}" class="${aktif === r ? 'on' : ''}">${ic(i)}<span>${a}</span></a>`).join('')}</nav>
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
          <ul class="ip">${tum.map(x => `<li>${obj(x.k.obj)}<span><b>${esc(x.a.ad)}</b><small>${esc(S.detay[x.a.id] || x.k.ad)}</small></span>${noktalar(x.p)}</li>`).join('')}</ul>
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
          <div class="kapak vk-kapak${ac(m)}" style="${stil(m)}"><time>${v.sure}</time>${p.v[j] ? `<span class="vk-tik">${ic('check')}İzlendi</span>` : ''}${obj(m.obj, j * 0.9 - 0.6)}<span class="vk-oynat">${ic('play')}</span></div>
          <h3>${j + 1}. ${v.ad}</h3><p>${v.ozet}</p></a>`).join('')}</div></section>
      <section><h2 class="bb">Uygulama</h2><div class="ikili">
        <a class="uk" href="#ders-${m.id}-ornek"><small>Örnek uygulama · ${esc(b.alt.ad)}</small><h3>${m.ornek.ad}</h3><p>${b.c.tema}</p><span class="durum${p.ornek ? ' t' : ''}">${p.ornek ? ic('check') + 'Tamamlandı' : '3 adım ' + ic('sag')}</span>${obj(b.ilgi.obj, 0.2)}</a>
        <a class="uk" href="#ders-${m.id}-gorev"><small>Mikro görev · ${m.gorev.tur}</small><h3>${m.gorev.ad}</h3><p>${b.c.tema}</p><span class="durum${p.gorev ? ' t' : ''}">${p.gorev ? ic('check') + 'Tamamlandı' : 'Göreve git ' + ic('sag')}</span>${obj(m.obj, -0.5)}</a>
      </div></section>
      <section><h2 class="bb">Modül sonu</h2><div class="son-liste">
        <a class="sl" href="#ders-${m.id}-duygu">${ic('kalp')}<div><b>Neler hissettin?</b><small>7 duygu · yaklaşık 1 dakika</small></div>${sonDurum(p.duyguOk)}</a>
        <a class="sl" href="#ders-${m.id}-ilgi">${ic('liste')}<div><b>Modülü değerlendir</b><small>7 ifade · yaklaşık 1 dakika</small></div>${sonDurum(p.ilgiOk)}</a>
      </div></section></div>`);
  }

  function sProfil() {
    return kabuk('profil', `<div class="sayfa"><div class="sb"><div><h1>İlgi profilin</h1><p>Örnek uygulamalar ve mikro görevler bu puanlara göre seçiliyor.</p></div><a class="btn ghost" href="#ilgi">${ic('duzenle')}Düzenle</a></div>
      <div class="pr-izgara">${S.secilen.map(ilgi).filter(Boolean).map(k => `<section class="kart"><div class="pr-bas">${obj(k.obj)}<h2>${k.ad}</h2></div>
        <ul class="pr">${seciliAltlar(k).sort((a, b) => (S.puan[b.id] || 0) - (S.puan[a.id] || 0)).map(a => `<li><span><b>${esc(a.ad)}</b>${S.detay[a.id] ? `<small>${esc(S.detay[a.id])}</small>` : ''}</span>${noktalar(S.puan[a.id] || 0)}</li>`).join('')}</ul></section>`).join('')}</div></div>`);
  }

  /* ---------- Ders ekranı ---------- */
  function akis(m, k) {
    const gr = {};
    adimlar(m).forEach(a => (gr[a.grup] = gr[a.grup] || []).push(a));
    return `<aside class="akis"><h2>Bu modülde</h2>${Object.entries(gr).map(([g, l]) => `<h3>${g}</h3><div class="akis-grup">${l.map(a => `<a class="ad${a.t ? ' t' : ''}${a.k === k ? ' on' : ''}" data-adim="${a.k}" href="#ders-${m.id}-${a.k}"><span class="ad-n">${a.t ? ic('check') : ''}</span><span class="ad-t">${a.ad}</span>${a.ek ? `<time>${a.ek}</time>` : ''}</a>`).join('')}</div>`).join('')}</aside>`;
  }
  const ileri = (m, k, act, metin = 'Devam et') => { const s = sonrakiAdim(m, k); return `<div class="adim-alt"><span>Sıradaki: ${adimAdi(m, s)}</span><a class="btn lg" href="#ders-${m.id}-${s}" data-act="${act}" data-m="${m.id}" data-k="${k}">${metin} ${ic('sag')}</a></div>`; };

  function dVideo(m, j) {
    const v = m.videolar[j], no = D.moduller.indexOf(m) + 1;
    return `<div class="vp" id="vp" data-sure="${sn(v.sure)}" data-m="${m.id}" data-j="${j}">
        <video id="vid" src="assets/video/m${no}.mp4" preload="metadata" playsinline></video>
        <button class="vp-kapak kapak${ac(m)}" id="vpKapak" aria-label="Videoyu oynat"><span class="vp-buyuk">${ic('play')}</span><small>Video ${j + 1}/${m.videolar.length}</small><h2>${v.ad}</h2>${obj(m.obj, j * 0.9 - 0.6)}</button>
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
    const l = siraliAltlar();
    if (l.length < 2) return '';
    const gruplar = S.secilen.map(ilgi).filter(Boolean).map(k => ({ k, l: l.filter(x => x.k === k) })).filter(g => g.l.length);
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

  function dOrnek(m) {
    const p = il(m.id), b = baglamAl(m), c = b.c, adim = D.ornekler[m.id](c);
    const acik = UI.ornekAcik[m.id] || (p.ornek ? adim.length : 1);
    return `<div class="ic-bas"><div><h1>${m.ornek.ad}</h1><p>Konuyu adım adım, ${b.ilgi.ad.toLocaleLowerCase('tr')} dünyasından bir örnekle uygula.</p></div>${bagSecici(m, b)}</div>
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
    return `<div class="ic-bas"><div><h1>${m.gorev.ad}</h1><p>${b.c.tema} örneği üzerinden.</p></div>${bagSecici(m, b)}</div>
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
    const p = il(m.id), n = Object.keys(p.ilgi).length;
    return `<div class="ic-bas"><div><h1>Bu modül hakkında ne düşünüyorsun?</h1><p>Her ifadeye ne kadar katıldığını seç. 1 hiç katılmıyorum, 5 tamamen katılıyorum.</p></div></div>
      <div class="olcek"><div class="ol-ust"><span></span><div><span>Hiç katılmıyorum</span><span>Tamamen katılıyorum</span></div></div>
        ${D.ilgiMaddeleri.map((d, i) => `<div class="li"><p>${d}</p><div class="li-sec" role="radiogroup" aria-label="${esc(d)}">${[1, 2, 3, 4, 5].map(v => `<button class="${p.ilgi[i] === v ? 'on' : ''}" role="radio" aria-checked="${p.ilgi[i] === v}" data-act="olcek" data-tur="ilgi" data-m="${m.id}" data-i="${i}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}</div>
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
      const p = v.duration ? v.currentTime / v.duration : 0;
      $('#vpIlerle').style.width = p * 100 + '%';
      $('#vpCubuk').setAttribute('aria-valuenow', Math.round(p * 100));
      $('#vpZaman').textContent = fmt(p * ilan) + ' / ' + fmt(ilan);
      $('#vpOyna').innerHTML = ic(v.paused ? 'play' : 'pause');
    };
    const oynat = () => { vp.classList.add('basladi'); const pr = v.play(); if (pr) pr.catch(() => {}); };
    const degistir = () => (v.paused ? oynat() : v.pause());
    UI.oynat = oynat;
    $('#vpKapak').onclick = oynat; $('#vpOyna').onclick = degistir; v.onclick = degistir;
    v.ontimeupdate = guncelle; v.onplay = guncelle; v.onpause = guncelle;
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
    const a = $(`.akis .ad[data-adim="${k}"]`);
    if (a && !a.classList.contains('t')) { a.classList.add('t'); a.querySelector('.ad-n').innerHTML = ic('check'); }
    const t = tamamSay(m);
    if ($('#dersCubuk')) { $('#dersCubuk').style.width = t / ADIM * 100 + '%'; $('#dersSay').textContent = t + '/' + ADIM; }
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
    return { ad: ['giris', 'kayit', 'ilgi', 'alt-ilgi', 'panel', 'moduller', 'profil'].includes(h) ? h : 'acilis' };
  }
  function render(kaydirma = true) {
    if (journey) { journey.destroy(); journey = null; }
    if (UI.video) { UI.video.pause(); UI.video = null; }
    const r = rota();
    if (['panel', 'moduller', 'profil', 'modul', 'ders'].includes(r.ad)) {
      if (!S.kul) S.kul = { ad: 'Deniz Aydın' };
      if (!S.secilen.length || !siraliAltlar().length) ornekProfil();
      kaydet();
    }
    if (r.ad === 'alt-ilgi' && !S.secilen.length) { location.hash = 'ilgi'; return; }
    const sayfalar = {
      acilis: sAcilis, giris: () => sAuth('giris'), kayit: () => sAuth('kayit'), ilgi: sIlgi, 'alt-ilgi': sAlt,
      panel: sPanel, moduller: sModuller, profil: sProfil, modul: () => sModul(r.m), ders: () => sDers(r.m, r.k),
    };
    app.innerHTML = sayfalar[r.ad]();
    document.body.dataset.ekran = ['ilgi', 'alt-ilgi'].includes(r.ad) ? 'kur' : ['panel', 'moduller', 'profil', 'modul'].includes(r.ad) ? 'uyg' : r.ad;
    const anahtar = location.hash;
    if (kaydirma && anahtar !== sonRota) window.scrollTo(0, 0);
    sonRota = anahtar;
    document.title = r.ad === 'ders' ? `${adimAdi(r.m, r.k)} · Bağlam` : r.ad === 'modul' ? `${r.m.ad} · Bağlam` : 'Bağlam';
    if (r.ad === 'acilis') journey = window.ResearchJourney.mount($('.research-hero'));
    kurVideo();
  }
  const yenile = () => render(false);
  const odakla = sel => { const e = $(sel); if (e) e.focus({ preventScroll: true }); };
  const notDugme = () => { const d = $('#notDugme'); if (d) d.textContent = UI.notlar ? 'Kişiselleştirme notlarını gizle' : 'Kişiselleştirme notlarını göster'; };

  /* ---------- Etkileşimler ---------- */
  const eylem = {
    kaydir: el => { const h = document.getElementById(el.dataset.hedef); if (h) h.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); },
    ilgiSec: el => {
      const id = el.dataset.id, i = S.secilen.indexOf(id);
      if (i < 0) S.secilen.push(id); else S.secilen.splice(i, 1);
      kaydet();
      const on = i < 0; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
      $('#ilgiSay').textContent = secimMetni(); $('#ilgiDevam').hidden = !S.secilen.length; $('#ilgiPasif').hidden = !!S.secilen.length;
    },
    altAktif: el => { UI.aktif = el.dataset.id; yenile(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    puan: el => { S.puan[el.dataset.alt] = +el.dataset.n; kaydet(); yenile(); odakla(`[data-act="puan"][data-alt="${el.dataset.alt}"][data-n="${el.dataset.n}"]`); },
    altSec: el => {
      const id = el.dataset.id;
      if (S.altSec[id]) { delete S.altSec[id]; delete S.puan[id]; } else S.altSec[id] = true;
      kaydet(); yenile(); odakla(`[data-act="altSec"][data-id="${id}"]`);
    },
    ozelSil: el => {
      const id = el.dataset.id, k = id.split('.')[0];
      S.ozel[k] = (S.ozel[k] || []).filter(o => o.id !== id); delete S.puan[id]; delete S.detay[id];
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
      const top = tur === 'duygu' ? D.duygular.length : D.ilgiMaddeleri.length, n = Object.keys(p[tur]).length;
      $('#olSay').textContent = `${n}/${top} yanıtlandı`; $('#olDevam').disabled = n < top;
    },
    olcekBitir: el => { adimIsaretle(el.dataset.m, el.dataset.tur); location.hash = el.dataset.r; },
    ekAc: el => { const p = $('#ekPanel'); p.hidden = !p.hidden; el.setAttribute('aria-expanded', !p.hidden); },
    sifirla: () => { S = bos(); UI.gs = {}; UI.ornekAcik = {}; kaydet(); $('#ekPanel').hidden = true; if (location.hash === '#acilis') render(); else location.hash = 'acilis'; },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && eylem[el.dataset.act] && !el.disabled) eylem[el.dataset.act](el, e);
    const panel = $('#ekPanel');
    if (panel && !panel.hidden && !e.target.closest('.proto')) panel.hidden = true;
    if (e.target.closest('.proto-panel a')) panel.hidden = true;
  });
  document.addEventListener('keydown', e => {
    const el = e.target.closest && e.target.closest('[role="button"][data-act]');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.detay) { S.detay[t.dataset.detay] = t.value; kaydet(); }
    if (t.dataset.cevap) { S.cevap[t.dataset.cevap] = t.value; kaydet(); const s = document.getElementById('say-' + t.dataset.cevap); if (s) s.textContent = kelime(t.value) + ' kelime · otomatik kaydedilir'; }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'bagSec') { S.baglamSec[e.target.dataset.m] = e.target.value; kaydet(); yenile(); }
  });
  document.addEventListener('submit', e => {
    if (e.target.id === 'ozelForm') {
      e.preventDefault();
      const k = e.target.dataset.k, inp = $('#ozelAd'), ad = inp.value.trim().replace(/\s+/g, ' ');
      const liste = S.ozel[k] = S.ozel[k] || [], bilgi = $('#ozelBilgi');
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
      S = bos(); S.kul = { ad }; UI.gs = {}; kaydet(); location.hash = 'ilgi';
    } else {
      if (!S.kul) S.kul = { ad: 'Deniz Aydın' };
      if (!S.secilen.length) ornekProfil();
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

  /* Prototip ekran listesi: araştırmacının ekranlar arasında hızlı gezinmesi için */
  const ek = document.createElement('div');
  ek.className = 'proto';
  ek.innerHTML = `<div class="proto-panel" id="ekPanel" hidden>${[
    ['acilis', 'Açılış sayfası'], ['giris', 'Giriş'], ['kayit', 'Kayıt'], ['ilgi', 'İlgi alanları'], ['alt-ilgi', 'Alt alanlar ve puanlama'],
    ['panel', 'Öğrenci ana sayfası'], ['moduller', 'Modüller'], ['modul-m2', 'Modül sayfası'], ['ders-m2-v1', 'Konu anlatım videosu'],
    ['ders-m2-ornek', 'Örnek uygulama'], ['ders-m2-gorev', 'Mikro görev'], ['ders-m4-gorev', 'Mikro görev (etkileşimli)'],
    ['ders-m2-duygu', 'Epistemik duygular'], ['ders-m2-ilgi', 'Durumsal ilgi'], ['ders-m2-son', 'Modül sonu'], ['profil', 'İlgi profili'],
  ].map(([r, a]) => `<a href="#${r}">${a}</a>`).join('')}<button class="proto-not" id="notDugme" data-act="notlar"></button><button data-act="sifirla">Verileri sıfırla</button></div>
  <button class="proto-dugme" data-act="ekAc" aria-expanded="false">${ic('ekran')}Ekranlar</button>`;
  document.body.appendChild(ek);
  notDugme();

  window.addEventListener('hashchange', () => render());
  render();
})();
