/* Bağlam açılış sahnesi: araştırma basamakları (three.js). API: render(), mount(root) -> { destroy() }.
   Önce büyük robot soruyu sorar. Sonra küçülür ve soldan sağa altı basamağı tek tek çıkar.
   Her basamakta konuşma balonu o adımın ürününü gösterir: plan, veri tablosu, saçılım grafiği, sonuç. */
window.ResearchJourneyV2 = (() => {
  'use strict';
  const T = window.THREE;

  // 14 günlük örnek veri: sıcaklık (°C) ve satılan dondurma (adet). r ≈ 0,96
  const SICAK = [15, 17, 18, 20, 21, 22, 24, 25, 26, 27, 29, 30, 32, 33];
  const GURULTU = [-11, 14, -5, 9, -16, 7, 12, -9, 17, -7, 10, -14, 5, 9];
  const SATIS = SICAK.map((t, i) => Math.round(40 + 6.2 * (t - 15) + GURULTU[i]));

  function sacilim() {
    const W = 168, H = 74, x = t => 10 + (t - 14) / 20 * (W - 18), y = s => H - 8 - (s - 20) / 150 * (H - 14);
    const mx = SICAK.reduce((a, b) => a + b) / 14, my = SATIS.reduce((a, b) => a + b) / 14;
    const b = SICAK.reduce((a, t, i) => a + (t - mx) * (SATIS[i] - my), 0) / SICAK.reduce((a, t) => a + (t - mx) ** 2, 0);
    const f = t => my + b * (t - mx);
    return `<svg class="j-mini" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="M8 4V${H - 6}H${W - 2}" class="j-mini-eksen"/>
      ${SICAK.map((t, i) => `<circle cx="${x(t).toFixed(1)}" cy="${y(SATIS[i]).toFixed(1)}" r="3" style="--g:${i}"/>`).join('')}
      <line x1="${x(14.5)}" y1="${y(f(14.5)).toFixed(1)}" x2="${x(33.5)}" y2="${y(f(33.5)).toFixed(1)}" class="j-mini-cizgi"/>
      <text x="${W - 2}" y="${H}" text-anchor="end">sıcaklık</text><text x="12" y="9">satış</text></svg>`;
  }

  const ADIMLAR = [
    { ad: 'Problem', kisa: 'Soruyu belirle', sure: 3800, etiket: 'Gözlemden soruya',
      metin: 'Sıcak günlerde dondurma kuyruğu uzuyor. Bu bir ilişki mi?',
      ek: '<div class="j-cipler"><span>Gözlem</span><i>→</i><span>Araştırılabilir soru</span></div>' },
    { ad: 'Alan yazını', kisa: 'Bilineni incele', sure: 3800, etiket: 'Önce bilinene bak',
      metin: 'Hava ile satış arasındaki ilişkiyi inceleyen çalışmalar var mı?',
      ek: '<ul class="j-liste"><li>Hava durumu ve perakende satış</li><li>Mevsimsellik ve tüketim</li></ul>' },
    { ad: 'Desen', kisa: 'Yöntemi planla', sure: 4200, etiket: 'Sorudan plana',
      metin: 'İlişkisel desen: hiçbir şeye müdahale etmeden ölçeceğiz.',
      ek: '<div class="j-cipler j-cipler-sar"><span><b>Değişken 1</b> sıcaklık (°C)</span><span><b>Değişken 2</b> satış (adet)</span><span><b>Süre</b> 14 gün, aynı saatte</span></div>' },
    { ad: 'Veri toplama', kisa: 'Ölç ve kaydet', sure: 4400, etiket: 'Ölçüm zamanı',
      metin: 'Her gün sıcaklığı ve satılan dondurmayı kaydediyoruz.',
      ek: `<table class="j-tablo"><tr><th>Gün</th><th>°C</th><th>Satış</th></tr>${[0, 1, 2].map(i => `<tr><td>${i + 1}</td><td>${SICAK[i]}</td><td>${SATIS[i]}</td></tr>`).join('')}<tr class="j-tablo-son"><td>…14</td><td>${SICAK[13]}</td><td>${SATIS[13]}</td></tr></table>` },
    { ad: 'Analiz', kisa: 'Örüntüyü bul', sure: 4600, etiket: 'Veriler ne söylüyor?',
      metin: 'Noktalar yukarı doğru diziliyor: güçlü, pozitif bir ilişki (r ≈ 0,96).',
      ek: sacilim() },
    { ad: 'Sonuç', kisa: 'Yorumla, paylaş', sure: 4600, etiket: 'Sorudan bilgiye',
      metin: 'Sıcaklık arttıkça satış artıyor. Ama ilişki, neden-sonuç demek değil.',
      ek: '<ul class="j-liste j-liste-sonuc"><li>Bulguyu raporla</li><li class="yeni">Yeni soru: tatil günlerinin payı ne?</li></ul>' },
  ];
  const GIRIS = { etiket: 'Her şey bir soruyla başlar', metin: 'Sıcak günlerde dondurma satışları artar mı?' };
  const SURE = { giris: 3600, acilis: 1700, yuru: 1250, kutlama: 2000 };

  const ikon = {
    oynat: '<path d="m9 5 11 7-11 7Z"/>', dur: '<path d="M9 5v14m6-14v14"/>',
    basa: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>', ok: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    kitap: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
    tik: '<path d="m5 12 4 4L19 6"/>',
  };
  const svg = ad => `<svg viewBox="0 0 24 24" class="j-icon" aria-hidden="true">${ikon[ad]}</svg>`;

  function render() {
    return `<section class="research-hero wrap" aria-labelledby="research-title">
      <div class="research-copy">
        <div class="research-eyebrow"><span></span> MERAKTAN BİLGİYE, ADIM ADIM</div>
        <h1 id="research-title">Araştırma yöntemlerini <em>gerçek problemler</em> üzerinden öğren<span class="research-period">.</span></h1>
        <p>Bir gözlemden yola çıkıp soruyu, planı, veriyi ve sonucu adım adım kur. Altı modül, kısa videolar ve kendi elinle yapacağın görevler.</p>
        <div class="research-cta"><a class="btn lg" href="#kayit">Hemen başla ${svg('ok')}</a><button class="btn lg ghost" data-act="kaydir" data-hedef="lp-moduller">Modülleri gör ${svg('kitap')}</button></div>
      </div>
      <div class="lab" data-faz="giris" aria-label="Bir araştırmanın altı basamağı: örnek araştırma">
        <div class="lab-ust" aria-hidden="true"><span>Bir sorunun yolculuğu</span></div>
        <div class="lab-sahne">
          <canvas class="lab-tuval" aria-hidden="true"></canvas>
          <div class="j-balon" aria-hidden="true"><span class="j-balon-etiket">${GIRIS.etiket}</span><p class="j-balon-metin">${GIRIS.metin}</p><div class="j-balon-ek"></div></div>
          <ol class="j-basamaklar">${ADIMLAR.map((a, i) => `<li><button class="j-kart" data-adim="${i}" aria-label="${i + 1}. adım: ${a.ad}, ${a.kisa}"><b><span>${i + 1}</span>${svg('tik')}</b><strong>${a.ad}</strong><small>${a.kisa}</small></button></li>`).join('')}</ol>
        </div>
        <div class="lab-ray">
          <button class="lab-oynat" type="button" aria-label="Animasyonu duraklat">${svg('dur')}</button>
          <span class="lab-sayac">Bir soruyla başla</span>
          <button class="lab-basa" type="button">${svg('basa')}<span>Yeniden izle</span></button>
        </div>
        <p class="j-sr-only" role="status" aria-live="polite"></p>
      </div>
    </section>`;
  }

  /* ---------- Yardımcılar ---------- */
  const kis = (v, a, b) => Math.max(a, Math.min(b, v));
  const yum = t => t * t * (3 - 2 * t);
  const cik = t => 1 - Math.pow(1 - t, 3);
  const yay = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 + Math.pow(2, -9 * t) * Math.sin((t * 9 - .75) * 2.1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const aci = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  // Basamak geometrisi (dünya birimi)
  const N = 6, BG = 1.28, BOS = .07, BD = 1.0;
  const bx = i => (i - (N - 1) / 2) * (BG + BOS);
  const bh = i => .34 + i * .4;

  function sahneKur(canvas) {
    if (T.ColorManagement && 'legacyMode' in T.ColorManagement) T.ColorManagement.legacyMode = false;
    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(24, 1, .1, 100);

    scene.add(new T.HemisphereLight(0xffffff, 0xCFC6AE, .8));
    const gunes = new T.DirectionalLight(0xfff6e8, 1.2); gunes.position.set(3, 8, 7); gunes.castShadow = true;
    gunes.shadow.mapSize.set(1024, 1024); gunes.shadow.radius = 5; gunes.shadow.bias = -.0006;
    Object.assign(gunes.shadow.camera, { left: -7, right: 7, top: 6, bottom: -4, near: 1, far: 30 });
    scene.add(gunes);
    const dolgu = new T.DirectionalLight(0xffffff, .35); dolgu.position.set(-6, 3, 4); scene.add(dolgu);

    const mats = {};
    const mat = (renk, o = {}) => { const k = renk + JSON.stringify(o); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: renk, roughness: .6, metalness: 0, ...o })); };
    const mesh = (geo, m, golge = true) => { const x = new T.Mesh(geo, m); x.castShadow = golge; x.receiveShadow = true; return x; };
    function kutuGeo(w, h, d, r) {
      r = Math.min(r, w / 2 - .001, h / 2 - .001);
      const b = Math.min(r * .5, d * .45), s = new T.Shape(), W = w - 2 * b, H = h - 2 * b, R = Math.max(.001, r - b), x = -W / 2, y = -H / 2;
      s.moveTo(x + R, y); s.lineTo(x + W - R, y); s.quadraticCurveTo(x + W, y, x + W, y + R); s.lineTo(x + W, y + H - R);
      s.quadraticCurveTo(x + W, y + H, x + W - R, y + H); s.lineTo(x + R, y + H); s.quadraticCurveTo(x, y + H, x, y + H - R);
      s.lineTo(x, y + R); s.quadraticCurveTo(x, y, x + R, y);
      const g = new T.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
      g.center(); return g;
    }
    const kutu = (w, h, d, r, m) => mesh(kutuGeo(w, h, d, r), m);
    const kure = (r, m) => mesh(new T.SphereGeometry(r, 24, 16), m);
    const silindir = (r1, r2, h, m, n = 24) => mesh(new T.CylinderGeometry(r1, r2, h, n), m);
    const C = { kabuk: '#F3F1EA', ana: '#0E8C7F', vurgu: '#EE6C2B', koyu: '#163A34' };

    // Gölgeyi alan görünmez zemin
    const zemin = new T.Mesh(new T.PlaneGeometry(30, 14), new T.ShadowMaterial({ opacity: .1 }));
    zemin.rotation.x = -Math.PI / 2; zemin.receiveShadow = true; scene.add(zemin);

    /* Basamaklar: tabanı y=0'da, yukarı doğru büyür. Üst plaka adımın durumunu renkle gösterir. */
    const tasMat = mat('#EEE8D9', { roughness: .85 });
    const UST = { sonra: mat('#E2DAC6', { roughness: .8 }), bitti: mat('#9FD8CC', { roughness: .7 }), simdi: mat(C.ana, { roughness: .55 }) };
    const basamak = [...Array(N)].map((_, i) => {
      const g = new T.Group(); g.position.set(bx(i), 0, 0); scene.add(g);
      const h = bh(i), tas = kutu(BG, h, BD, .08, tasMat); tas.position.y = h / 2; g.add(tas);
      const ust = kutu(BG - .06, .06, BD - .06, .03, UST.sonra); ust.position.y = h + .01; g.add(ust);
      return { g, ust };
    });

    /* Bayrak: son basamakta, kutlamada yükselir. */
    const bayrakG = new T.Group(); bayrakG.position.set(bx(N - 1) + .5, bh(N - 1), -.32); scene.add(bayrakG);
    const direk = silindir(.022, .022, 1.75, mat('#B7C6C0')); direk.position.y = .875; bayrakG.add(direk);
    const tepe = kure(.045, mat(C.vurgu)); tepe.position.y = 1.77; bayrakG.add(tepe);
    const bayrakGeo = new T.PlaneGeometry(.46, .28, 12, 4); bayrakGeo.translate(-.23, 0, 0);
    const bayrakTaban = bayrakGeo.attributes.position.array.slice();
    const bayrak = mesh(bayrakGeo, mat(C.vurgu, { side: T.DoubleSide, roughness: .7 })); bayrak.position.set(-.02, 1.58, 0); bayrakG.add(bayrak);

    /* Robot */
    const robot = new T.Group(); scene.add(robot);
    const govde = new T.Group(); robot.add(govde);
    const beyaz = mat(C.kabuk, { roughness: .45 }), ana = mat(C.ana, { roughness: .5 }), vurgu = mat(C.vurgu, { roughness: .45 });
    const bacak = [-1, 1].map(s => {
      const pivot = new T.Group(); pivot.position.set(s * .15, .36, 0); robot.add(pivot);
      const b = mesh(new T.CapsuleGeometry(.075, .16, 4, 12), ana); b.position.y = -.14; pivot.add(b);
      const ayak = kutu(.17, .09, .24, .04, beyaz); ayak.position.set(0, -.3, .03); pivot.add(ayak);
      return pivot;
    });
    const tors = kutu(.6, .46, .44, .17, beyaz); tors.position.y = .58; govde.add(tors);
    const gogus = kutu(.26, .14, .05, .05, ana); gogus.position.set(0, .58, .22); govde.add(gogus);
    const isik = kure(.03, mat('#ffffff', { emissive: '#CFFFF4', emissiveIntensity: .8 })); isik.position.set(0, .58, .25); govde.add(isik);
    const kol = [-1, 1].map(s => {
      const pivot = new T.Group(); pivot.position.set(s * .36, .74, 0); govde.add(pivot);
      const k = mesh(new T.CapsuleGeometry(.065, .2, 4, 12), beyaz); k.position.y = -.16; pivot.add(k);
      const el = kure(.075, vurgu); el.position.y = -.33; pivot.add(el);
      return pivot;
    });
    const kafa = new T.Group(); kafa.position.y = 1.08; govde.add(kafa);
    kafa.add(kutu(.8, .56, .6, .22, beyaz));
    const ekran = kutu(.62, .36, .06, .13, mat(C.koyu, { roughness: .3 })); ekran.position.z = .29; kafa.add(ekran);
    const gozMat = mat('#9DF0D6', { emissive: '#4FE0B9', emissiveIntensity: .9, roughness: .3 });
    const gozler = [-1, 1].map(s => { const g = mesh(new T.CapsuleGeometry(.04, .06, 4, 10), gozMat, false); g.position.set(s * .13, .02, .33); kafa.add(g); return g; });
    const gulus = mesh(new T.TorusGeometry(.06, .013, 6, 16, Math.PI), gozMat, false); gulus.rotation.z = Math.PI; gulus.position.set(0, -.08, .33); kafa.add(gulus);
    [-1, 1].forEach(s => { const k = silindir(.08, .08, .07, vurgu); k.rotation.z = Math.PI / 2; k.position.x = s * .42; kafa.add(k); });
    const anten = new T.Group(); anten.position.y = .28; kafa.add(anten);
    const ac = silindir(.016, .016, .2, mat('#B7C6C0')); ac.position.y = .1; anten.add(ac);
    const ab = kure(.06, vurgu); ab.position.y = .23; anten.add(ab);

    return { renderer, scene, camera, basamak, UST, bayrakG, bayrak, bayrakGeo, bayrakTaban, robot, govde, bacak, kol, kafa, gozler, anten };
  }

  function mount(root) {
    if (!root) return { destroy() {} };
    const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
    const hareket = matchMedia('(prefers-reduced-motion: reduce)');
    const lab = $('.lab'), sahneEl = $('.lab-sahne'), canvas = $('.lab-tuval'), balon = $('.j-balon');
    const kartlar = $$('.j-kart'), kartLi = $$('.j-basamaklar li');
    let S = null;
    try { if (T) S = sahneKur(canvas); } catch (e) { S = null; }
    if (!S) lab.classList.add('lab-duz');

    let faz = 'giris', aktif = 0, e = 0, saat = 0, oynuyor = !hareket.matches, otomatik = true;
    let yol = null, onceki = null, kare = 0, gorunur = true, bitti = false, kirli = true;
    let w = 1, h = 1, yuruAdim = 0, bakis = 0;
    const V = T ? new T.Vector3() : null;
    // Girişte büyük robotun yeri ve boyu (dünya birimi); boyut() ekran oranına göre ayarlar.
    let BUYUK = { x: -1.6, y: 0, z: 1.2, s: 2.2 };
    const KUCUK = .98;

    function balonYaz(etiket, metin, ek) {
      $('.j-balon-etiket').textContent = etiket; $('.j-balon-metin').textContent = metin; $('.j-balon-ek').innerHTML = ek || '';
    }
    function durum() {
      lab.dataset.faz = faz;
      const hedef = faz === 'yuru' ? yol.b : aktif, acik = faz !== 'giris' && faz !== 'acilis';
      const son = faz === 'kutlama' || faz === 'bitti';
      kartLi.forEach((li, i) => {
        li.classList.toggle('on', acik && !son && i === hedef);
        li.classList.toggle('tamam', acik && (i < hedef || son));
        kartlar[i].setAttribute('aria-current', acik && i === hedef ? 'step' : 'false');
      });
      $('.j-basamaklar').inert = !acik;
      if (S) S.basamak.forEach((b, i) => { b.ust.material = !acik ? S.UST.sonra : i < hedef || son ? S.UST.bitti : i === hedef ? S.UST.simdi : S.UST.sonra; });
      $('.lab-sayac').textContent = acik ? (son ? 'Yolculuk tamamlandı' : `${String(hedef + 1).padStart(2, '0')} / 06 · ${ADIMLAR[hedef].ad}`) : 'Bir soruyla başla';
      const kapali = !oynuyor || faz === 'bitti';
      $('.lab-oynat').innerHTML = svg(kapali ? 'oynat' : 'dur');
      $('.lab-oynat').setAttribute('aria-label', faz === 'bitti' ? 'Yeniden oynat' : kapali ? 'Animasyonu oynat' : 'Animasyonu duraklat');
    }
    function faziAyarla(f) { faz = f; e = 0; durum(); kirli = true; }
    function var_(i, elle) {
      aktif = i; yol = null; faziAyarla('bekle');
      const a = ADIMLAR[i]; balonYaz(a.etiket, a.metin, a.ek);
      if (elle) $('.j-sr-only').textContent = `${i + 1}. adım, ${a.ad}. ${a.metin}`;
    }
    function git(i, elle) {
      if (faz === 'giris' || faz === 'acilis') return;
      if (elle) otomatik = false;
      if (hareket.matches || !S) { var_(i, elle); if (elle) { e = ADIMLAR[i].sure; oynuyor = false; durum(); } return; }
      if (faz === 'bekle' && i === aktif) { if (elle) { e = 0; oynuyor = true; durum(); zamanla(); } return; }
      const a = faz === 'yuru' ? yolKonum() : aktif;
      yol = { a, b: i, sure: SURE.yuru * (1 + .35 * (Math.abs(i - a) - 1)), x0: S.robot.position.x, y0: S.robot.position.y };
      oynuyor = true; faziAyarla('yuru'); zamanla();
    }
    function yolKonum() { return Math.round(kis((S.robot.position.x - bx(0)) / (BG + BOS), 0, N - 1)); }
    function kutla() { faziAyarla('kutlama'); balonYaz('Yolculuk tamamlandı', 'Bir sorudan bilimsel bilgiye! Her sonuç yeni bir soru doğurur.', ''); $('.j-sr-only').textContent = 'Yolculuk tamamlandı.'; }
    function basla() {
      otomatik = true; aktif = 0; yol = null; saat = 0; oynuyor = !hareket.matches;
      balonYaz(GIRIS.etiket, GIRIS.metin, '');
      if (oynuyor) faziAyarla('giris'); else var_(0, false);
      zamanla();
    }

    /* ---------- Kare kare çizim ---------- */
    function robotPoz(dt) {
      const R = S.robot, hiz = dt / 1000;
      let x, y, z = .05, s = KUCUK, hedefAci = .35, yuru = false, havada = 0;
      const ust = i => ({ x: bx(i), y: bh(i) + .04 });
      if (faz === 'giris') {
        const g = hareket.matches ? 1 : yay(kis(e / 900, 0, 1));
        x = BUYUK.x; y = BUYUK.y; z = BUYUK.z; s = BUYUK.s * (.3 + .7 * g); hedefAci = .18;
      } else if (faz === 'acilis') {
        const t = yum(kis(e / SURE.acilis, 0, 1)), u = ust(0);
        x = lerp(BUYUK.x, u.x, t); y = lerp(BUYUK.y, u.y, t) + Math.sin(t * Math.PI) * .6; z = lerp(BUYUK.z, .05, t); s = lerp(BUYUK.s, KUCUK, t);
        hedefAci = lerp(.18, .35, t);
      } else if (faz === 'yuru') {
        const t = kis(e / yol.sure, 0, 1), tt = yum(t), b = ust(yol.b);
        x = lerp(yol.x0, b.x, tt); y = lerp(yol.y0, b.y, tt);
        havada = Math.sin(t * Math.PI); y += havada * (.32 + .12 * Math.abs(yol.b - yol.a));
        hedefAci = yol.b >= yol.a ? Math.PI / 2 : -Math.PI / 2; yuru = true;
      } else { const u = ust(aktif); x = u.x; y = u.y; if (faz === 'kutlama' || faz === 'bitti') hedefAci = 0; }
      R.position.set(x, y, z); R.scale.setScalar(s);
      bakis = hareket.matches ? hedefAci : bakis + aci(bakis, hedefAci) * Math.min(1, hiz * 9);
      R.rotation.y = bakis;

      const k0 = S.kol[0], k1 = S.kol[1];
      k0.rotation.set(0, 0, -.1); k1.rotation.set(0, 0, .1); S.kafa.rotation.set(0, 0, 0);
      S.bacak.forEach(b => b.rotation.set(0, 0, 0)); S.govde.position.y = 0;
      if (hareket.matches) return;
      const nefes = Math.sin(saat / 700) * .012;
      if (faz === 'giris') {
        // El sallar, başını yana eğer: "bir sorum var"
        const g = kis((e - 500) / 400, 0, 1);
        k1.rotation.z = .1 + g * (2.35 + Math.sin(saat / 150) * .35);
        S.kafa.rotation.z = Math.sin(saat / 900) * .08 * g; S.kafa.rotation.x = -.06 * g;
        S.govde.position.y = nefes;
      } else if (yuru) {
        yuruAdim += hiz * 11;
        const sl = Math.sin(yuruAdim) * (1 - havada * .7);
        S.bacak[0].rotation.x = sl * .6 - havada * .5; S.bacak[1].rotation.x = -sl * .6 - havada * .5;
        k0.rotation.x = -sl * .5; k1.rotation.x = sl * .5;
        k0.rotation.z = -.1 - havada * .7; k1.rotation.z = .1 + havada * .7;
        S.govde.position.y = Math.abs(Math.cos(yuruAdim)) * .04 * (1 - havada);
      } else if (faz === 'kutlama' || faz === 'bitti') {
        const g = faz === 'kutlama' ? Math.sin(kis(e / SURE.kutlama, 0, 1) * Math.PI) : 0;
        k0.rotation.z = -.1 - (faz === 'kutlama' ? 2.5 : .2); k1.rotation.z = .1 + (faz === 'kutlama' ? 2.5 : .2);
        S.govde.position.y = Math.abs(Math.sin(saat / 170)) * .14 * g + nefes;
      } else if (faz === 'bekle') {
        // Balonu gösterir gibi kolunu kaldırır, sonra indirir
        const q = kis(e / ADIMLAR[aktif].sure, 0, 1), isaret = Math.min(1, Math.sin(q * Math.PI) * 2.2);
        k0.rotation.z = -.1 - 1.5 * isaret; k0.rotation.x = -.4 * isaret;
        S.kafa.rotation.x = -.12 * isaret; S.govde.position.y = nefes;
      }
      S.anten.rotation.z = Math.sin(saat / 300) * (yuru ? .3 : .08);
      const kirp = saat % 4200 > 4060 ? .15 : 1; S.gozler.forEach(g => { g.scale.y = kirp; });
    }

    function sahne() {
      // Basamaklar açılışta sırayla yükselir
      const ac = faz === 'giris' ? 0 : faz === 'acilis' && !hareket.matches ? e / SURE.acilis : 1;
      S.basamak.forEach((b, i) => { const v = cik(kis(ac * 1.6 - i * .12, 0, 1)); b.g.scale.set(1, Math.max(.001, v), 1); b.g.visible = v > .002; });
      const bk = faz === 'kutlama' ? cik(kis(e / 700, 0, 1)) : faz === 'bitti' ? 1 : 0;
      S.bayrakG.visible = bk > 0; S.bayrakG.scale.set(1, Math.max(.001, bk), 1);
      if (bk > 0) {
        const arr = S.bayrakGeo.attributes.position.array, tb = S.bayrakTaban;
        for (let k = 0; k < arr.length; k += 3) { const x = -tb[k]; arr[k + 2] = Math.sin(x * 10 - saat / 150) * .04 * (x / .46); }
        S.bayrakGeo.attributes.position.needsUpdate = true;
      }
    }

    function ekran(x, y, z) { V.set(x, y, z).project(S.camera); return { x: (V.x * .5 + .5) * w, y: (-V.y * .5 + .5) * h }; }
    function yerlestir() {
      // Kartlar: her basamağın altına, basamak genişliğinde
      const zem = ekran(0, 0, BD / 2).y;
      kartLi.forEach((li, i) => {
        const a = ekran(bx(i) - BG / 2, 0, BD / 2), b = ekran(bx(i) + BG / 2, 0, BD / 2);
        li.style.left = `${a.x}px`; li.style.width = `${b.x - a.x}px`; li.style.top = `${zem + 12}px`;
      });
      // Balon: girişte robotun sağında; basamaklarda üstte, yer yoksa robotun soluna veya sağına (üstüne gelmeyecek biçimde)
      const R = S.robot, bas = ekran(R.position.x, R.position.y + 1.45 * R.scale.x, R.position.z);
      let left, top, kuyruk = 0;
      if (faz === 'giris') {
        balon.classList.add('j-balon-yan'); balon.classList.remove('j-balon-sol', 'j-balon-sag'); balon.style.width = '';
        const bw = balon.offsetWidth, bhh = balon.offsetHeight;
        const yan = ekran(R.position.x + .55 * R.scale.x, R.position.y + 1.1 * R.scale.x, R.position.z);
        left = Math.min(yan.x + 12, w - bw - 8); top = kis(yan.y - bhh / 2, 8, h - bhh - 8);
      } else {
        balon.classList.remove('j-balon-yan');
        const dar = w < 520;
        balon.style.width = dar ? `${w - 16}px` : '';
        let bw = balon.offsetWidth, bhh = balon.offsetHeight;
        const ustte = dar || bas.y - bhh - 16 >= 6;
        if (ustte) {
          balon.classList.remove('j-balon-sol', 'j-balon-sag');
          const f = .2 + .75 * (aktif / (N - 1));
          left = dar ? 8 : kis(bas.x - bw * f, 8, w - bw - 8); top = dar ? 6 : bas.y - bhh - 16;
          kuyruk = kis(bas.x - left, 22, bw - 22);
        } else {
          const solKenar = ekran(R.position.x - .52 * R.scale.x, R.position.y + 1.0 * R.scale.x, R.position.z);
          const sagKenar = ekran(R.position.x + .52 * R.scale.x, R.position.y + 1.0 * R.scale.x, R.position.z);
          const solAlan = solKenar.x - 14 - 8;
          const sagAlan = (w - 8) - (sagKenar.x + 14);
          if (solAlan >= sagAlan) {
            balon.classList.add('j-balon-sol'); balon.classList.remove('j-balon-sag');
            if (solAlan < bw) { balon.style.width = `${Math.max(200, solAlan)}px`; bw = balon.offsetWidth; bhh = balon.offsetHeight; }
            left = Math.max(8, solKenar.x - bw - 14); top = kis(solKenar.y - bhh / 2, 6, h - bhh - 6);
            kuyruk = kis(solKenar.y - top, 18, bhh - 18);
          } else {
            balon.classList.add('j-balon-sag'); balon.classList.remove('j-balon-sol');
            if (sagAlan < bw) { balon.style.width = `${Math.max(200, sagAlan)}px`; bw = balon.offsetWidth; bhh = balon.offsetHeight; }
            left = Math.min(w - bw - 8, sagKenar.x + 14); top = kis(sagKenar.y - bhh / 2, 6, h - bhh - 6);
            kuyruk = kis(sagKenar.y - top, 18, bhh - 18);
          }
        }
      }
      balon.style.transform = `translate(${left}px, ${top}px)`;
      balon.style.setProperty('--kuyruk', `${kuyruk}px`);
      let o = 1;
      if (faz === 'giris') o = hareket.matches ? 1 : kis((e - 650) / 400, 0, 1);
      else if (faz === 'acilis' || faz === 'yuru') o = 0;
      else if (faz === 'bekle') o = hareket.matches ? 1 : kis((e - 150) / 300, 0, 1);
      balon.style.opacity = o; balon.style.visibility = o > .01 ? 'visible' : 'hidden';
      const kart = faz === 'giris' ? 0 : faz === 'acilis' ? kis((e / SURE.acilis - .35) / .5, 0, 1) : 1;
      $('.j-basamaklar').style.opacity = hareket.matches ? 1 : kart;
      lab.classList.add('hazir');
    }

    function ciz(dt) { robotPoz(dt); sahne(); S.renderer.render(S.scene, S.camera); yerlestir(); kirli = false; }

    function ilerle(dt) {
      e += dt; saat += dt;
      if (faz === 'giris' && e >= SURE.giris) faziAyarla('acilis');
      else if (faz === 'acilis' && e >= SURE.acilis) var_(0, false);
      else if (faz === 'yuru' && e >= yol.sure) var_(yol.b, !otomatik);
      else if (faz === 'bekle' && e >= ADIMLAR[aktif].sure) {
        if (!otomatik) { e = ADIMLAR[aktif].sure; oynuyor = false; durum(); }
        else if (aktif === N - 1) kutla(); else git(aktif + 1, false);
      } else if (faz === 'kutlama' && e >= SURE.kutlama) { faziAyarla('bitti'); oynuyor = false; durum(); }
    }
    function tik(zaman) {
      kare = 0;
      if (bitti || !gorunur || document.hidden) { onceki = null; return; }
      const dt = onceki === null ? 16 : Math.min(zaman - onceki, 60); onceki = zaman;
      if (oynuyor) { ilerle(dt); kirli = true; }
      if (S && kirli) ciz(oynuyor ? dt : 0);
      zamanla();
    }
    function zamanla() { if (!kare && !bitti && gorunur && !document.hidden && (oynuyor || kirli)) kare = requestAnimationFrame(tik); }

    function boyut() {
      w = sahneEl.clientWidth; h = sahneEl.clientHeight;
      if (!S || !w || !h) return;
      const asp = w / h, cam = S.camera;
      S.renderer.setSize(w, h, false); cam.aspect = asp; cam.updateProjectionMatrix();
      // Basamakların tamamı yatayda sığsın; zemin sahnenin alt kısmında kart payı bıraksın.
      const genislik = N * (BG + BOS) + .5, yv = cam.fov * Math.PI / 360, yatay = Math.atan(Math.tan(yv) * asp);
      const uzak = genislik / 2 / Math.tan(yatay) + BD / 2;
      const yari = uzak * Math.tan(yv), dar = asp < 1.1;
      const merkezY = yari * (dar ? .64 : .54);
      cam.position.set(0, merkezY + uzak * .2, uzak); cam.lookAt(0, merkezY, 0);
      BUYUK = dar ? { x: -2.4, y: .1, z: 1.0, s: 2.6 } : { x: -2.2, y: 0, z: 1.2, s: 2.3 };
      ciz(0); zamanla();
    }
    function tikla(ev) {
      const b = ev.target.closest('[data-adim], .lab-oynat, .lab-basa'); if (!b) return;
      if (b.matches('.lab-basa')) { basla(); return; }
      if (b.matches('.lab-oynat')) {
        if (faz === 'bitti') { basla(); return; }
        oynuyor = !oynuyor; onceki = null;
        if (oynuyor) { otomatik = true; if (faz === 'bekle' && e >= ADIMLAR[aktif].sure) { if (aktif === N - 1) kutla(); else git(aktif + 1, false); } }
        durum(); zamanla(); return;
      }
      git(Number(b.dataset.adim), true);
    }
    function gorunurluk() { onceki = null; zamanla(); }
    const ro = new ResizeObserver(boyut); ro.observe(sahneEl);
    const io = new IntersectionObserver(es => { gorunur = es[0].isIntersecting; gorunurluk(); }, { threshold: .1 });
    io.observe(sahneEl);
    root.addEventListener('click', tikla);
    document.addEventListener('visibilitychange', gorunurluk);
    basla(); boyut();

    return { destroy() {
      bitti = true; cancelAnimationFrame(kare); ro.disconnect(); io.disconnect();
      root.removeEventListener('click', tikla); document.removeEventListener('visibilitychange', gorunurluk);
      if (S) { S.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); S.renderer.dispose(); S.renderer.forceContextLoss && S.renderer.forceContextLoss(); }
    } };
  }
  return { render, mount };
})();
