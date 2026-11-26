/* Etkileşimli mikro-görev prototipi ve 6 alternatif etkileşim şablonu */
window.GorevPrototip = (() => {
  'use strict';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Transfer senaryoları: Çözümlü örnekten (hücum/su sıcaklığı/çalışma süresi) bağımsız yeni problem çözmeye geçiş */
  const SENARYOLAR = [
    {
      id: 'standart',
      etiket: 'Kontrol grubu — Standart içerik',
      kisa: 'Standart (Kontrol)',
      baslik: 'Problem çözme yöntemi başarıyı etkiler mi?',
      metin: 'Bir araştırmacı, farklı problem çözme yöntemlerinin öğrencilerin doğru çözdükleri problem sayısına etkisini incelemektedir. Öğrenciler rastgele üç gruba ayrılmış, her grupta farklı bir problem çözme yöntemi uygulanmış ve sonunda doğru çözülen problem sayıları kaydedilmiştir.',
      temaTip: 'standart',
      kosullar: [
        { ad: 'Örnekli çözüm', deger: '12 problem', diyagram: 'saat1' },
        { ad: 'Grup tartışması', deger: '17 problem', diyagram: 'saat2' },
        { ad: 'Bireysel çalışma', deger: '14 problem', diyagram: 'saat3' },
      ],
      bagimsizSecenekler: ['Problem çözme yöntemi', 'Doğru çözülen problem sayısı', 'Öğrenci sayısı', 'Soru sayısı'],
      bagimsizDogru: 0,
      bagimliSecenekler: ['Soru sayısı', 'Doğru çözülen problem sayısı', 'Öğrenci sayısı', 'Problem çözme yöntemi'],
      bagimliDogru: 1,
      ipucuBagimsiz: 'Bağımsız değişken için araştırmacının üç grupta bilerek farklılaştırdığı yönteme odaklan.',
      ipucuBagimli: 'Bağımlı değişken için uygulama sonunda her gruptan ölçülen sonuca odaklan.',
      aciklamaDogru: 'Harika! Araştırmacı gruplar arasında problem çözme yöntemini değiştirdiği için bağımsız değişken "Problem çözme yöntemi", sonunda ölçtüğü sonuç ise "Doğru çözülen problem sayısı" olduğu için bağımlı değişken budur.',
    },
    {
      id: 'basketbol',
      etiket: 'Deney grubu — Basketbol (Öğrenci 1)',
      kisa: 'Basketbol (Paslaşma)',
      baslik: 'Paslaşma düzeni takım performansını etkiler mi?',
      metin: 'Bir basketbol analisti, farklı paslaşma düzenlerinin takımın başarılı asist sayısı üzerindeki etkisini araştırmaktadır. Analist aynı oyuncularla, eşit süreli üç deneme maçı düzenlemiş ve her maçta farklı bir paslaşma düzeni uygulamıştır. Maçların sonunda başarılı asist sayılarını kaydetmiştir.',
      temaTip: 'basketbol',
      kosullar: [
        { ad: 'Kısa pas düzeni', deger: '14 asist', diyagram: 'saha1' },
        { ad: 'Çapraz pas düzeni', deger: '21 asist', diyagram: 'saha2' },
        { ad: 'Hızlı geçiş pası', deger: '18 asist', diyagram: 'saha3' },
      ],
      bagimsizSecenekler: ['Paslaşma düzeni', 'Başarılı asist sayısı', 'Oyuncu sayısı', 'Maç süresi'],
      bagimsizDogru: 0,
      bagimliSecenekler: ['Maç süresi', 'Başarılı asist sayısı', 'Oyuncu sayısı', 'Paslaşma düzeni'],
      bagimliDogru: 1,
      ipucuBagimsiz: 'Bağımsız değişken için araştırmacının üç maçta farklılaştırdığı koşula odaklan.',
      ipucuBagimli: 'Bağımlı değişken için maçların sonunda ölçülen performans çıktısına odaklan.',
      aciklamaDogru: 'Doğru! Analist maçlar arasında paslaşma düzenini değiştirdiği için bağımsız değişken "Paslaşma düzeni", bunun sonucunda ölçtüğü çıktı ise "Başarılı asist sayısı" olduğu için bağımlı değişken budur.',
    },
    {
      id: 'kahve',
      etiket: 'Deney grubu — V60 Kahve (Öğrenci 5)',
      kisa: 'Kahve (Demleme Süresi)',
      baslik: 'Demleme süresi aromatik yoğunluğu etkiler mi?',
      metin: 'Bir gıda araştırmacısı, aynı kahve çekirdeği ve aynı su sıcaklığıyla V60 demlerken uygulanan farklı demleme sürelerinin kahvenin aromatik yoğunluk puanı üzerindeki etkisini incelemektedir. Katılımcılar üç farklı sürede demlenen kahveleri tatmış ve aromatik yoğunluk puanları kaydedilmiştir.',
      temaTip: 'kahve',
      kosullar: [
        { ad: '2 dakika', deger: '68 puan', diyagram: 'kahve1' },
        { ad: '3 dakika', deger: '85 puan', diyagram: 'kahve2' },
        { ad: '4 dakika', deger: '74 puan', diyagram: 'kahve3' },
      ],
      bagimsizSecenekler: ['Demleme süresi', 'Aromatik yoğunluk puanı', 'Çekirdek miktarı', 'Su sıcaklığı'],
      bagimsizDogru: 0,
      bagimliSecenekler: ['Su sıcaklığı', 'Aromatik yoğunluk puanı', 'Çekirdek miktarı', 'Demleme süresi'],
      bagimliDogru: 1,
      ipucuBagimsiz: 'Bağımsız değişken için diğer koşullar sabit tutulurken araştırmacının değiştirdiği süreye odaklan.',
      ipucuBagimli: 'Bağımlı değişken için tadım sonunda katılımcılardan ölçülen puana odaklan.',
      aciklamaDogru: 'Doğru! Araştırmacı demleme süresini değiştirdiği için bağımsız değişken "Demleme süresi", tadım sonucunda ölçülen değer ise "Aromatik yoğunluk puanı" olduğu için bağımlı değişken budur.',
    },
  ];

  /* 6 Alternatif Etkileşim Şablonu */
  const SABLONLAR = [
    { id: 'eslestirme', ad: 'Eşleştirme', kazanim: 'Değişkenler, kavramlar ve tanımlar' },
    { id: 'siniflandirma', ad: 'Sınıflandırma', kazanim: 'Evren, örneklem, veri türleri' },
    { id: 'sirala', ad: 'Sıralama', kazanim: 'Araştırma sürecinin aşamaları' },
    { id: 'gorsel_veri', ad: 'Görsel veri yorumlama', kazanim: 'Grafikler, tablolar ve bulgular' },
    { id: 'bosluk', ad: 'Boşluk doldurma', kazanim: 'Kavramların hatırlanması ve uygulanması' },
    { id: 'acik_uclu', ad: 'Açık uçlu uygulama', kazanim: 'Araştırma sorusu ve hipotez oluşturma' },
  ];

  const TABLO_KARS = [
    ['Sesli anlatım', 'Temel sunum biçimi', 'İsteğe bağlı'],
    ['Görseller', 'Var', 'Var'],
    ['Grafik ve tablolar', 'Gerektiğinde', 'Gerektiğinde'],
    ['Adım adım çözüm', 'Var', 'Yanıt sonrasında'],
    ['Öğrenci etkileşimi', 'İlerleme ve gezinme', 'Aktif problem çözme'],
    ['İpucu', 'Gerekli değil', 'İsteğe bağlı'],
    ['Açıklayıcı geri bildirim', 'Çözümün parçası', 'Yanıt sonrasında'],
    ['Tahmini süre', '1–2 dakika', '1–3 dakika'],
  ];

  const IKON = {
    ses: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    metin: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>',
    ampul: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    bilgi: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    yukari: '<polyline points="18 15 12 9 6 15"/>',
    asagi: '<polyline points="6 9 12 15 18 9"/>',
    sag: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  const ic = k => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IKON[k] || ''}</svg>`;

  function senaryoSVG(tip) {
    if (tip === 'basketbol') {
      return `<svg viewBox="0 0 420 240" aria-hidden="true">
        <rect width="420" height="240" fill="#13332D"/>
        <g stroke="#9FD8CC" stroke-width="1.8" fill="none" opacity=".25">
          <rect x="24" y="22" width="372" height="196" rx="10"/>
          <line x1="210" y1="22" x2="210" y2="218"/>
          <circle cx="210" cy="120" r="36"/>
          <path d="M24 72h64a48 48 0 0 1 0 96H24M396 72h-64a48 48 0 0 0 0 96h64"/>
        </g>
        <path d="M96 158 L184 92 L286 146 L342 88" stroke="#EE6C2B" stroke-width="3" stroke-dasharray="6 5" fill="none" stroke-linecap="round"/>
        <circle cx="96" cy="158" r="11" fill="#0E8C7F" stroke="#fff" stroke-width="2"/>
        <circle cx="184" cy="92" r="11" fill="#0E8C7F" stroke="#fff" stroke-width="2"/>
        <circle cx="286" cy="146" r="11" fill="#0E8C7F" stroke="#fff" stroke-width="2"/>
        <circle cx="342" cy="88" r="13" fill="#EE6C2B" stroke="#fff" stroke-width="2.5"/>
        <rect x="24" y="24" width="150" height="30" rx="8" fill="#0D221E" stroke="#2D5E55"/>
        <text x="99" y="43" fill="#9FD8CC" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">PASLAŞMA &amp; ASİST</text>
      </svg>`;
    }
    if (tip === 'kahve') {
      return `<svg viewBox="0 0 420 240" aria-hidden="true">
        <rect width="420" height="240" fill="#F5ECE3"/>
        <rect x="44" y="192" width="332" height="10" rx="5" fill="#DCCBBC"/>
        <g transform="translate(88 66)">
          <polygon points="10,0 74,0 54,48 30,48" fill="#fff" stroke="#0E8C7F" stroke-width="2.5"/>
          <path d="M24 48 h36 l12 58 a10 10 0 0 1 -10 12 H22 a10 10 0 0 1 -10 -12 Z" fill="#fff" stroke="#5C6C68" stroke-width="2"/>
          <path d="M18 86 h48 l4 22 a8 8 0 0 1 -8 8 H22 a8 8 0 0 1 -8 -8 Z" fill="#8A4B24"/>
        </g>
        <g transform="translate(222 64)">
          <rect width="144" height="34" rx="10" fill="#fff" stroke="#DFE7E5" stroke-width="1.8"/>
          <text x="16" y="22" fill="#11211E" font-family="Figtree,sans-serif" font-size="13" font-weight="700">2 dk · Hafif gövde</text>
          <rect y="44" width="144" height="34" rx="10" fill="#E1F3F0" stroke="#0E8C7F" stroke-width="2"/>
          <text x="16" y="66" fill="#0A6A60" font-family="Figtree,sans-serif" font-size="13" font-weight="700">3 dk · En yüksek aroma</text>
          <rect y="88" width="144" height="34" rx="10" fill="#FFEDE2" stroke="#EE6C2B" stroke-width="1.8"/>
          <text x="16" y="110" fill="#B84A12" font-family="Figtree,sans-serif" font-size="13" font-weight="700">4 dk · Yoğun acılık</text>
        </g>
      </svg>`;
    }
    return `<svg viewBox="0 0 420 240" aria-hidden="true">
      <rect width="420" height="240" fill="#E8F2EF"/>
      <g transform="translate(38 48)">
        <rect width="102" height="140" rx="14" fill="#fff" stroke="#CBE0DA" stroke-width="2"/>
        <text x="51" y="48" fill="#0E8C7F" font-family="Bricolage Grotesque,sans-serif" font-size="24" font-weight="700" text-anchor="middle">12</text>
        <text x="51" y="76" fill="#11211E" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">Örnekli çözüm</text>
        <text x="51" y="98" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle">Grup 1</text>
      </g>
      <g transform="translate(159 48)">
        <rect width="102" height="140" rx="14" fill="#fff" stroke="#0E8C7F" stroke-width="2.5"/>
        <text x="51" y="48" fill="#0E8C7F" font-family="Bricolage Grotesque,sans-serif" font-size="24" font-weight="700" text-anchor="middle">17</text>
        <text x="51" y="76" fill="#11211E" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">Grup tartışması</text>
        <text x="51" y="98" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle">Grup 2</text>
      </g>
      <g transform="translate(280 48)">
        <rect width="102" height="140" rx="14" fill="#fff" stroke="#EE6C2B" stroke-width="2"/>
        <text x="51" y="48" fill="#EE6C2B" font-family="Bricolage Grotesque,sans-serif" font-size="24" font-weight="700" text-anchor="middle">14</text>
        <text x="51" y="76" fill="#11211E" font-family="Figtree,sans-serif" font-size="12" font-weight="700" text-anchor="middle">Bireysel çalışma</text>
        <text x="51" y="98" fill="#5C6C68" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle">Grup 3</text>
      </g>
    </svg>`;
  }

  function kosulSVG(kod, idx) {
    if (kod.startsWith('saha')) {
      const pts = [[[34, 22], [74, 48], [116, 28]], [[30, 58], [76, 30], [122, 62]], [[28, 42], [82, 22], [126, 44]]][idx % 3];
      return `<svg viewBox="0 0 164 84" aria-hidden="true">
        <rect x="6" y="6" width="152" height="72" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.5"/>
        <line x1="82" y1="6" x2="82" y2="78" stroke="#8EB3A8" stroke-width="1.3"/>
        <circle cx="82" cy="42" r="14" fill="none" stroke="#8EB3A8" stroke-width="1.3"/>
        <path d="M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]} L${pts[2][0]} ${pts[2][1]}" stroke="#EE6C2B" stroke-width="2.2" stroke-dasharray="4 3" fill="none"/>
        ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#0E8C7F"/>`).join('')}
      </svg>`;
    }
    if (kod.startsWith('kahve')) {
      const aci = [120, 180, 240][idx % 3];
      return `<svg viewBox="0 0 164 84" aria-hidden="true">
        <rect x="6" y="6" width="152" height="72" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.4"/>
        <circle cx="82" cy="42" r="22" fill="#fff" stroke="#0E8C7F" stroke-width="2"/>
        <line x1="82" y1="42" x2="${82 + Math.sin(aci * Math.PI / 180) * 14}" y2="${42 - Math.cos(aci * Math.PI / 180) * 14}" stroke="#EE6C2B" stroke-width="2.8" stroke-linecap="round"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 164 84" aria-hidden="true">
      <rect x="6" y="6" width="152" height="72" rx="8" fill="#E8F1EE" stroke="#8EB3A8" stroke-width="1.4"/>
      <rect x="34" y="${54 - idx * 12}" width="24" height="${16 + idx * 12}" rx="4" fill="#9FD8CC"/>
      <rect x="70" y="${44 - idx * 10}" width="24" height="${26 + idx * 10}" rx="4" fill="#0E8C7F"/>
      <rect x="106" y="${38 - idx * 8}" width="24" height="${32 + idx * 8}" rx="4" fill="#EE6C2B"/>
    </svg>`;
  }

  function baglamdanSenaryo(b) {
    if (b.alt && b.alt.id === 'spor.basketbol') return SENARYOLAR[1];
    if (b.alt && b.alt.id === 'yemek.kahve') return SENARYOLAR[2];
    const c = b.c, et = c.veri.etiket, dg = c.veri.deger;
    return {
      id: b.alt ? b.alt.id : 'genel',
      etiket: b.alt ? b.alt.ad : 'Seçili bağlam',
      baslik: c.soru,
      metin: c.gozlem,
      temaTip: b.ilgi && b.ilgi.id === 'spor' ? 'basketbol' : b.ilgi && b.ilgi.id === 'yemek' ? 'kahve' : 'standart',
      kosullar: et.map((ad, i) => ({ ad, deger: String(dg[i]), diyagram: `genel${i + 1}` })),
      bagimsizSecenekler: [c.bagimsiz, c.bagimli, c.kontrol[0] || 'Katılımcı sayısı', c.kontrol[1] || 'Uygulama süresi'],
      bagimsizDogru: 0,
      bagimliSecenekler: [c.kontrol[1] || 'Uygulama süresi', c.bagimli, c.kontrol[0] || 'Katılımcı sayısı', c.bagimsiz],
      bagimliDogru: 1,
      ipucuBagimsiz: 'Bağımsız değişken için araştırmacının gruplar arasında değiştirdiği koşula odaklan.',
      ipucuBagimli: 'Bağımlı değişken için çalışma sonunda ölçülen sonuca odaklan.',
      aciklamaDogru: `Doğru! Araştırmacı "${c.bagimsiz}" koşulunu değiştirdiği için bağımsız değişken budur; sonunda ölçtüğü "${c.bagimli}" ise bağımlı değişkendir.`,
    };
  }

  /* Etkileşimli Ana Mikro-Görev Oynatıcı */
  function createTaskPlayer(host, senaryo, opts = {}) {
    if (!host) return { destroy() {} };
    let sec1 = null, sec2 = null, kontrol = false, ipucu = false, metin = false, caliyor = false, audioEl = null, destroyed = false;

    const durdurSes = () => {
      caliyor = false;
      if (audioEl) { try { audioEl.pause(); audioEl.currentTime = 0; } catch (e) { /* yoksay */ } audioEl = null; }
      if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (e) { /* yoksay */ }
    };

    const guncelleSesBtn = () => {
      const b = host.querySelector('[data-mg="ses"]');
      if (b) {
        b.classList.toggle('on', caliyor);
        b.innerHTML = `${ic('ses')} ${caliyor ? 'Seslendirmeyi durdur' : 'Senaryoyu dinle'}`;
      }
    };

    function draw() {
      const d1 = sec1 === senaryo.bagimsizDogru, d2 = sec2 === senaryo.bagimliDogru;
      const tam = kontrol && d1 && d2;
      const secili = sec1 != null && sec2 != null;
      let geriBildirim = '';
      if (kontrol) {
        if (tam) {
          geriBildirim = `<div class="gb d">${ic('bilgi')}<div><b>Tebrikler, her iki soruyu da doğru yanıtladın!</b><br>${esc(senaryo.aciklamaDogru)}</div></div>`;
        } else if (d1 && !d2) {
          geriBildirim = `<div class="gb y">${ic('bilgi')}<div><b>Kısmen doğru, bir kez daha düşün.</b><br>${esc(senaryo.feedback2Yanlis || 'İlk seçimin doğru; ikinci soruda ise araştırma sonunda ölçülen sonuca veya çıktısına odaklan.')}</div></div>`;
        } else if (!d1 && d2) {
          geriBildirim = `<div class="gb y">${ic('bilgi')}<div><b>Kısmen doğru, bir kez daha düşün.</b><br>${esc(senaryo.feedback1Yanlis || ('İkinci seçimin doğru; ilk soru için ' + senaryo.ipucuBagimsiz))}</div></div>`;
        } else {
          geriBildirim = `<div class="gb y">${ic('bilgi')}<div><b>Tekrar deneyelim.</b><br>${esc(senaryo.ipucuBagimsiz)} ${esc(senaryo.ipucuBagimli)}</div></div>`;
        }
      }

      const tamamBtn = opts.onCompleteHash
        ? `<a class="btn lg" href="#${esc(opts.onCompleteHash)}" data-act="${esc(opts.onCompleteAct || '')}" data-m="${esc(opts.moduleId || '')}">${esc(opts.completeLabel || 'Mikro-görevi tamamla')} ${ic('sag')}</a>`
        : '';

      host.innerHTML = `<div class="mg-kart">
        <div class="mg-ust">
          <div>
            <span class="mg-eyebrow">${esc(senaryo.eyebrow || 'MODÜL 02 · MİKRO-GÖREV')}</span>
            <h2>Şimdi sıra sende!</h2>
            <p>${esc(senaryo.altYazi || 'Araştırma senaryosunu incele ve değişkenleri belirle.')}</p>
          </div>
          <span class="mg-sure">Yaklaşık 2 dk.</span>
        </div>

        <div class="mg-senaryo-kutu">
          <div class="mg-gorsel">${senaryo.image_data_url ? `<img class="mg-uretilen-img" src="${senaryo.image_data_url}" alt="${esc(senaryo.baslik)}">` : senaryoSVG(senaryo.temaTip)}</div>
          <div class="mg-senaryo-metin">
            <span class="mg-senaryo-etiket">Araştırma senaryosu</span>
            <h3>${esc(senaryo.baslik)}</h3>
            <p>${esc(senaryo.metin)}</p>
            <div class="mg-ses-satir">
              <button type="button" class="mg-ses-dugme${caliyor ? ' on' : ''}" data-mg="ses">${ic('ses')} ${caliyor ? 'Seslendirmeyi durdur' : 'Senaryoyu dinle'}</button>
              <button type="button" class="mg-ses-dugme${metin ? ' on' : ''}" data-mg="metin">${ic('metin')} ${metin ? 'Anlatım metnini gizle' : 'Anlatım metnini göster'}</button>
            </div>
            ${metin ? `<div class="mg-anlatim-kutu"><b>Seslendirme özeti:</b> ${esc(senaryo.metin)}</div>` : ''}
          </div>
        </div>

        <div class="mg-veri-bolum">
          <div class="mg-bolum-bas">
            <b>Araştırma sonuçları</b>
            <small>Temsili şemalar ve kurgusal araştırma verileri</small>
          </div>
          <div class="slayt-kosul-izgara">
            ${senaryo.kosullar.map((k, idx) => `<div class="slayt-kosul">${kosulSVG(k.diyagram || 'genel', idx)}<small>${esc(k.ad)}</small><b>${esc(k.deger)}</b></div>`).join('')}
          </div>
        </div>

        <div class="mg-veri-bolum">
          <div class="mg-bolum-bas">
            <b>${esc(senaryo.soruBaslik || 'Araştırmanın değişkenlerini belirle')}</b>
            <small>${esc(senaryo.soruAlt || 'Bağımlı ve bağımsız değişkenler')}</small>
          </div>
          <div class="mg-sorular">
            <div class="mg-soru-kart">
              <div class="mg-soru-bas"><span class="mg-soru-no">1</span><b>${esc(senaryo.soru1 || 'Bağımsız değişken hangisidir?')}</b></div>
              <div class="mg-secenek-grid" role="radiogroup" aria-label="${esc(senaryo.soru1 || 'Bağımsız değişken hangisidir?')}">
                ${senaryo.bagimsizSecenekler.map((s, i) => {
                  const on = sec1 === i;
                  const cls = on ? (kontrol ? (i === senaryo.bagimsizDogru ? ' dogru' : ' yanlis') : ' sec') : '';
                  return `<button type="button" class="mg-sec-btn${cls}" data-mg-sec="1" data-i="${i}" aria-pressed="${on}">${esc(s)}</button>`;
                }).join('')}
              </div>
            </div>
            <div class="mg-soru-kart">
              <div class="mg-soru-bas"><span class="mg-soru-no">2</span><b>${esc(senaryo.soru2 || 'Bağımlı değişken hangisidir?')}</b></div>
              <div class="mg-secenek-grid" role="radiogroup" aria-label="${esc(senaryo.soru2 || 'Bağımlı değişken hangisidir?')}">
                ${senaryo.bagimliSecenekler.map((s, i) => {
                  const on = sec2 === i;
                  const cls = on ? (kontrol ? (i === senaryo.bagimliDogru ? ' dogru' : ' yanlis') : ' sec') : '';
                  return `<button type="button" class="mg-sec-btn${cls}" data-mg-sec="2" data-i="${i}" aria-pressed="${on}">${esc(s)}</button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        ${ipucu ? `<div class="mg-ipucu-kutu">${ic('ampul')}<div><b>İpucu:</b> ${esc(senaryo.ipucuBagimsiz)} ${esc(senaryo.ipucuBagimli)}</div></div>` : ''}
        ${geriBildirim}

        <div class="mg-aksiyon">
          <div class="mg-aksiyon-sol">
            <button type="button" class="btn ghost" data-mg="ipucu">${ic('ampul')} ${ipucu ? 'İpucunu gizle' : 'İpucuna ihtiyacım var'}</button>
            <button type="button" class="btn" data-mg="kontrol"${secili ? '' : ' disabled'}>${kontrol && !tam ? 'Cevaplarımı tekrar kontrol et' : 'Cevapları kontrol et'}</button>
            ${tam ? tamamBtn : ''}
          </div>
          <span class="mg-durum">${tam ? 'Mikro-görev tamamlandı' : 'Mikro-görev devam ediyor'}</span>
        </div>
      </div>`;
    }

    const onClick = ev => {
      const sec = ev.target.closest('[data-mg-sec]');
      if (sec) {
        if (sec.dataset.mgSec === '1') sec1 = +sec.dataset.i;
        else sec2 = +sec.dataset.i;
        kontrol = false;
        draw();
        return;
      }
      const act = ev.target.closest('[data-mg]');
      if (!act || act.disabled) return;
      const tur = act.dataset.mg;
      if (tur === 'ipucu') { ipucu = !ipucu; draw(); }
      else if (tur === 'metin') { metin = !metin; draw(); }
      else if (tur === 'kontrol') { kontrol = true; draw(); }
      else if (tur === 'ses') {
        if (caliyor) { durdurSes(); guncelleSesBtn(); return; }
        durdurSes();
        caliyor = true;
        guncelleSesBtn();
        const speechYedek = () => {
          if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
            try {
              if (window.speechSynthesis.paused) window.speechSynthesis.resume();
              const u = new SpeechSynthesisUtterance(senaryo.metin);
              u.lang = 'tr-TR';
              const tr = (window.speechSynthesis.getVoices() || []).find(v => /^tr/i.test(v.lang));
              if (tr) u.voice = tr;
              u.onend = () => { if (!destroyed) { caliyor = false; guncelleSesBtn(); } };
              u.onerror = () => { if (!destroyed) { caliyor = false; guncelleSesBtn(); } };
              window.speechSynthesis.speak(u);
              return;
            } catch (e) { /* yoksay */ }
          }
          caliyor = false;
          guncelleSesBtn();
        };
        if (senaryo.audio_data_url) {
          try {
            audioEl = new Audio(senaryo.audio_data_url);
            audioEl.onended = () => { if (!destroyed) { caliyor = false; audioEl = null; guncelleSesBtn(); } };
            audioEl.onerror = () => { if (!destroyed && caliyor) { audioEl = null; speechYedek(); } };
            const pr = audioEl.play();
            if (pr && pr.catch) pr.catch(() => { if (!destroyed && caliyor) { audioEl = null; speechYedek(); } });
            return;
          } catch (e) { audioEl = null; }
        }
        speechYedek();
      }
    };

    host.addEventListener('click', onClick);
    draw();
    return {
      destroy() { destroyed = true; durdurSes(); host.removeEventListener('click', onClick); },
    };
  }

  /* 6 Alternatif Etkileşim Şablonu Kütüphanesi (Jüri Sunumu için etkileşimli gösterim) */
  function createTemplateShowcase(host) {
    if (!host) return { destroy() {} };
    let aktifSablon = 'eslestirme';
    let baglam = 'basketbol'; // 'standart' | 'basketbol' | 'kahve'
    const st = {
      esSec: null, esYer: {}, esKontrol: false,
      snSec: null, snYer: {}, snKontrol: false,
      srSira: [1, 3, 0, 2], srKontrol: false,
      gvSec: null, gvKontrol: false,
      bd1: '', bd2: '', bdKontrol: false,
      auMetin: '', auOrnek: false,
    };

    function baglamVerisi() {
      if (baglam === 'standart') {
        return {
          etiket: 'Standart (Kontrol)',
          esOgeler: ['Problem çözme yöntemi', 'Doğru çözülen problem sayısı', 'Aynı sınıf düzeyi'],
          snOgeler: [['Fakültedeki 300 öğrenci', 0], ['Rastgele seçilen 60 öğrenci', 1], ['Üniversitedeki 1.400 öğrenci', 0], ['Anket uygulanan 140 öğrenci', 1]],
          srAdimlar: ['Araştırma problemini belirle', 'Çalışma gruplarını planla', 'Test verilerini topla', 'Doğru problem sayılarını analiz et'],
          gvBaslik: 'Problem çözme yöntemine göre ortalama doğru sayısı',
          gvVeri: [['Örnekli', 12], ['Tartışma', 17], ['Bireysel', 14]],
          gvSecenekler: [
            ['Grup tartışması yapan öğrenciler ortalama 17 problemle en yüksek başarıyı göstermiştir.', true, 'Doğrudan grafikteki değerleri aktarıyor.'],
            ['Bireysel çalışma bütün öğrencilerin başarısını kesin olarak düşürür.', false, 'Aşırı genelleme içeriyor.'],
            ['Örnekli çözüm her yaş grubunda etkisizdir.', false, 'Evren dışı genelleme yapılamaz.'],
          ],
          auSoru: 'Farklı problem çözme yöntemleri ve başarı testi için bir hipotez yaz.',
          auOrnek: 'Grup tartışması yöntemini kullanan öğrencilerin doğru çözdükleri problem sayısı, bireysel çalışanlardan anlamlı düzeyde yüksek olacaktır.',
        };
      }
      if (baglam === 'kahve') {
        return {
          etiket: 'Kahve (V60 Demleme)',
          esOgeler: ['Demleme süresi', 'Aromatik yoğunluk puanı', 'Sabit 92°C su sıcaklığı'],
          snOgeler: [['Şehirdeki 300 nitelikli kahve tüketicisi', 0], ['Anket uygulanan 60 tüketici', 1], ['Tadım etkinliğindeki 200 kişi', 0], ['Puanları kaydedilen 40 katılımcı', 1]],
          srAdimlar: ['Demleme problemini belirle', 'Süre koşullarını planla', 'Tadım puanlarını topla', 'Aromatik yoğunlukları analiz et'],
          gvBaslik: 'V60 demleme süresine göre aromatik yoğunluk puanı',
          gvVeri: [['2 dk', 68], ['3 dk', 85], ['4 dk', 74]],
          gvSecenekler: [
            ['3 dakika demlenen kahve 85 puanla en yüksek aromatik yoğunluk puanını almıştır.', true, 'Doğrudan grafikteki ölçüme dayanıyor.'],
            ['4 dakika demlenen kahve her zaman içilemez olur.', false, 'Grafikten çıkarılamayacak öznel bir yargı.'],
            ['Kahve çekirdeğinin türü aromayı hiç etkilemez.', false, 'Sabit tutulan değişken hakkında sonuç çıkarılamaz.'],
          ],
          auSoru: 'V60 demleme süresi ve aromatik yoğunluk için bir hipotez yaz.',
          auOrnek: '3 dakikalık demleme süresiyle hazırlanan V60 kahvenin aromatik yoğunluk puanı, 2 dakikalık demlemeye göre daha yüksek olacaktır.',
        };
      }
      return {
        etiket: 'Basketbol (Paslaşma)',
        esOgeler: ['Paslaşma düzeni', 'Başarılı asist sayısı', 'Eşit maç süresi'],
        snOgeler: [["EuroLeague'deki 300 maç", 0], ['Rastgele seçilen 60 maç', 1], ['Turnuvadaki 200 oyuncu', 0], ['Verisi incelenen 40 oyuncu', 1]],
        srAdimlar: ['Araştırma problemini belirle', 'Deneme maçı düzenini planla', 'Asist verilerini topla', 'Paslaşma sonuçlarını analiz et'],
        gvBaslik: 'Paslaşma düzenine göre maç başına başarılı asist sayısı',
        gvVeri: [['Kısa pas', 14], ['Çapraz pas', 21], ['Hızlı geçiş', 18]],
        gvSecenekler: [
          ['Çapraz pas düzeninde takım maç başına 21 asistle en yüksek değere ulaşmıştır.', true, 'Bu ifade doğrudan grafikteki değerleri aktarıyor.'],
          ['Kısa pas düzeni bütün basketbol liglerinde yasaklanmalıdır.', false, 'Veriye dayalı bilimsel bir sonuç değildir.'],
          ['Oyuncuların boy uzunluğu asist sayısını belirlemiştir.', false, 'Araştırmada incelenen değişken bu değildir.'],
        ],
        auSoru: 'Paslaşma düzeni ve asist performansı için bir hipotez yaz.',
        auOrnek: 'Çapraz pas düzeninin uygulandığı maçlarda takımın başarılı asist sayısı, kısa pas düzenine göre daha yüksek olacaktır.',
      };
    }

    function sablonIcerik() {
      const b = baglamVerisi();
      if (aktifSablon === 'eslestirme') {
        const roller = ['Bağımsız değişken', 'Bağımlı değişken', 'Kontrol değişkeni'];
        const dogru = Object.keys(st.esYer).filter(k => +st.esYer[k] === +k).length;
        return `<div class="sablon-sahne-ust"><b>Eşleştirme · Kavramları rolleriyle eşleştir</b><span>${esc(b.etiket)}</span></div>
          <div class="havuz" data-tb="es-havuz">${b.esOgeler.map((ad, i) => Object.values(st.esYer).includes(i) ? '' : `<button type="button" class="cip${st.esSec === i ? ' sec' : ''}" data-tb="es-cip" data-i="${i}">${esc(ad)}</button>`).join('')}</div>
          <div class="es-izgara">${roller.map((r, ri) => {
            const oi = st.esYer[ri];
            const cls = oi != null ? (st.esKontrol ? (oi === ri ? ' dogru' : ' yanlis') : ' dolu') : '';
            return `<button type="button" class="es-slot${cls}" data-tb="es-slot" data-r="${ri}"><small>${esc(r)}</small>${oi != null ? `<b>${esc(b.esOgeler[oi])}</b>` : '<span>Bir kavram seçip buraya dokun</span>'}</button>`;
          }).join('')}</div>
          ${st.esKontrol ? `<div class="gb ${dogru === 3 ? 'd' : 'y'}">${ic('bilgi')}${dogru === 3 ? 'Tüm kavramlar doğru rolle eşleşti.' : `${dogru}/3 doğru eşleşme.`}</div>` : ''}
          <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="es-kontrol">Kontrol et</button><button type="button" class="btn ghost" data-tb="es-sifirla">Sıfırla</button></div>`;
      }
      if (aktifSablon === 'siniflandirma') {
        const dogru = b.snOgeler.filter((o, i) => st.snYer[i] === o[1]).length;
        const yerlesen = Object.keys(st.snYer).length;
        return `<div class="sablon-sahne-ust"><b>Sınıflandırma · Evren mi, örneklem mi?</b><span>${esc(b.etiket)}</span></div>
          <div class="havuz" data-tb="sn-havuz">${b.snOgeler.map(([ad], i) => st.snYer[i] == null ? `<button type="button" class="cip${st.snSec === i ? ' sec' : ''}" data-tb="sn-cip" data-i="${i}">${esc(ad)}</button>` : '').join('')}</div>
          <div class="kutular">${['Evren', 'Örneklem'].map((kt, ki) => `<div class="kutu" role="button" tabindex="0" data-tb="sn-kutu" data-k="${ki}"><h4>${kt}</h4>${b.snOgeler.map(([ad, d], i) => st.snYer[i] === ki ? `<button type="button" class="cip${st.snKontrol ? (d === ki ? ' d' : ' y') : ''}" data-tb="sn-cip" data-i="${i}">${esc(ad)}</button>` : '').join('')}</div>`).join('')}</div>
          ${st.snKontrol ? `<div class="gb ${yerlesen === 4 && dogru === 4 ? 'd' : 'y'}">${ic('bilgi')}${yerlesen < 4 ? 'Önce tüm ifadeleri yerleştir.' : dogru === 4 ? 'Evren ve örneklem ayrımı tamamen doğru!' : `${dogru}/4 doğru sınıflandırma.`}</div>` : ''}
          <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="sn-kontrol">Kontrol et</button><button type="button" class="btn ghost" data-tb="sn-sifirla">Sıfırla</button></div>`;
      }
      if (aktifSablon === 'sirala') {
        const dogru = st.srSira.filter((oi, pos) => oi === pos).length;
        return `<div class="sablon-sahne-ust"><b>Sıralama · Araştırma aşamalarını sıraya koy</b><span>${esc(b.etiket)}</span></div>
          <ol class="sr">${st.srSira.map((oi, pos) => `<li class="${st.srKontrol ? (oi === pos ? 'd' : 'y') : ''}"><span class="no">${pos + 1}</span><span></span><span class="sr-t"><b>${esc(b.srAdimlar[oi])}</b></span><span class="sr-ok"><button type="button" data-tb="sr-tasi" data-pos="${pos}" data-yon="-1"${pos ? '' : ' disabled'}>${ic('yukari')}</button><button type="button" data-tb="sr-tasi" data-pos="${pos}" data-yon="1"${pos < 3 ? '' : ' disabled'}>${ic('asagi')}</button></span></li>`).join('')}</ol>
          ${st.srKontrol ? `<div class="gb ${dogru === 4 ? 'd' : 'y'}">${ic('bilgi')}${dogru === 4 ? 'Araştırma süreci doğru sıralandı.' : `${dogru}/4 adım doğru sırada.`}</div>` : ''}
          <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="sr-kontrol">Kontrol et</button></div>`;
      }
      if (aktifSablon === 'gorsel_veri') {
        const max = Math.max(...b.gvVeri.map(v => v[1]), 1);
        return `<div class="sablon-sahne-ust"><b>Görsel veri yorumlama · Grafikten hangi sonuca ulaşılabilir?</b><span>${esc(b.etiket)}</span></div>
          <div class="slayt-vurgu-kutu turuncu">
            <b class="slayt-vurgu-ad">${esc(b.gvBaslik)}</b>
            <div class="slayt-barlar">${b.gvVeri.map(([et, dg]) => `<div class="slayt-bar-satir"><span>${esc(et)}</span><div class="slayt-bar-yol"><i style="width:${Math.max(18, (dg / max) * 92).toFixed(1)}%"></i></div><b>${dg}</b></div>`).join('')}</div>
          </div>
          <div class="secenekler">${b.gvSecenekler.map(([m, d], i) => `<button type="button" class="secenek${st.gvSec === i ? (st.gvKontrol ? (d ? ' d' : ' y') : ' sec') : ''}" data-tb="gv-sec" data-i="${i}"><i></i><span>${esc(m)}</span></button>`).join('')}</div>
          ${st.gvKontrol && st.gvSec != null ? `<div class="gb ${b.gvSecenekler[st.gvSec][1] ? 'd' : 'y'}">${ic('bilgi')}${esc(b.gvSecenekler[st.gvSec][2])}</div>` : ''}
          <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="gv-kontrol"${st.gvSec == null ? ' disabled' : ''}>Kontrol et</button></div>`;
      }
      if (aktifSablon === 'bosluk') {
        const d1 = st.bd1.trim().toLocaleLowerCase('tr') === 'bağımsız';
        const d2 = st.bd2.trim().toLocaleLowerCase('tr') === 'bağımlı';
        return `<div class="sablon-sahne-ust"><b>Boşluk doldurma · Kavramları cümleye yerleştir</b><span>${esc(b.etiket)}</span></div>
          <div class="bd-cumle">Araştırmacının gruplar arasında bilerek değiştirdiği unsur <span class="bd-bosluk${st.bd1 ? (st.bdKontrol ? (d1 ? ' dogru' : ' yanlis') : '') : ' bos'}">${esc(st.bd1 || '1. boşluk')}</span> değişkendir; bu değişime bağlı olarak ölçtüğü sonuç ise <span class="bd-bosluk${st.bd2 ? (st.bdKontrol ? (d2 ? ' dogru' : ' yanlis') : '') : ' bos'}">${esc(st.bd2 || '2. boşluk')}</span> değişkendir.</div>
          <div class="yon-hat-izgara">
            <div class="yon-alan"><label>1. boşluk</label><div class="yon-girdi-satir"><input class="girdi" data-tb-inp="bd1" value="${esc(st.bd1)}" placeholder="Kavramı yaz (ör. bağımsız)"></div></div>
            <div class="yon-alan"><label>2. boşluk</label><div class="yon-girdi-satir"><input class="girdi" data-tb-inp="bd2" value="${esc(st.bd2)}" placeholder="Kavramı yaz (ör. bağımlı)"></div></div>
          </div>
          <div class="mg-ses-satir">
            <button type="button" class="mg-ses-dugme" data-tb="bd-cip" data-kelime="bağımsız">bağımsız</button>
            <button type="button" class="mg-ses-dugme" data-tb="bd-cip" data-kelime="bağımlı">bağımlı</button>
            <button type="button" class="mg-ses-dugme" data-tb="bd-cip" data-kelime="kontrol">kontrol</button>
          </div>
          ${st.bdKontrol ? `<div class="gb ${d1 && d2 ? 'd' : 'y'}">${ic('bilgi')}${d1 && d2 ? 'İki boşluk da doğru tamamlandı!' : 'İpucu: Değiştirilen unsur bağımsız, ölçülen sonuç bağımlı değişkendir.'}</div>` : ''}
          <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="bd-kontrol">Kontrol et</button></div>`;
      }
      return `<div class="sablon-sahne-ust"><b>Açık uçlu uygulama · Hipotez oluşturma</b><span>${esc(b.etiket)}</span></div>
        <p class="gorev-soru">${esc(b.auSoru)}</p>
        <div class="acik-duzen">
          <div><textarea data-tb-inp="auMetin" placeholder="Hipotezini yaz...">${esc(st.auMetin)}</textarea><span class="sayac">${(st.auMetin.trim().match(/\S+/g) || []).length} kelime</span></div>
          <aside class="ipucu"><h4>Kontrol listesi</h4><ul><li>Bağımsız değişken yer alıyor mu?</li><li>Bağımlı değişken ölçülebilir mi?</li><li>Beklenen yön veya fark belirtilmiş mi?</li></ul></aside>
        </div>
        <div class="gorev-alt"><button type="button" class="btn ghost" data-tb="au-ornek">${st.auOrnek ? 'Örnek yanıtı gizle' : 'Örnek kontrol yanıtını gör'}</button></div>
        ${st.auOrnek ? `<div class="gb d">${ic('bilgi')}<div><b>Örnek hipotez:</b> ${esc(b.auOrnek)}</div></div>` : ''}`;
    }

    function draw() {
      host.innerHTML = `<div class="slayt-sarici">
        <div class="juri-slayt-seciciler" role="group" aria-label="Şablon bağlamını seç">
          ${[['basketbol', 'Deney: Basketbol (Paslaşma)'], ['kahve', 'Deney: V60 Kahve'], ['standart', 'Kontrol: Standart']].map(([id, ad]) => `<button type="button" class="juri-slayt-tab${baglam === id ? ' on' : ''}" data-tb="baglam" data-id="${id}">${ad}</button>`).join('')}
        </div>
        <div class="sablon-sekmeler" role="tablist" aria-label="Mikro-görev etkileşim şablonları">
          ${SABLONLAR.map(s => `<button type="button" class="sablon-tab${aktifSablon === s.id ? ' on' : ''}" data-tb="sablon" data-id="${s.id}" role="tab" aria-selected="${aktifSablon === s.id}"><b>${esc(s.ad)}</b><small>${esc(s.kazanim)}</small></button>`).join('')}
        </div>
        <div class="sablon-sahne">${sablonIcerik()}</div>
      </div>`;
    }

    const onClick = ev => {
      const el = ev.target.closest('[data-tb]');
      if (!el || el.disabled) return;
      const a = el.dataset.tb;
      if (a === 'sablon') { aktifSablon = el.dataset.id; draw(); }
      else if (a === 'baglam') { baglam = el.dataset.id; draw(); }
      else if (a === 'es-cip') { const i = +el.dataset.i; st.esSec = st.esSec === i ? null : i; draw(); }
      else if (a === 'es-slot') { if (st.esSec == null) delete st.esYer[+el.dataset.r]; else { Object.keys(st.esYer).forEach(k => { if (st.esYer[k] === st.esSec) delete st.esYer[k]; }); st.esYer[+el.dataset.r] = st.esSec; st.esSec = null; } st.esKontrol = false; draw(); }
      else if (a === 'es-havuz') { if (st.esSec != null) { Object.keys(st.esYer).forEach(k => { if (st.esYer[k] === st.esSec) delete st.esYer[k]; }); st.esSec = null; draw(); } }
      else if (a === 'es-kontrol') { st.esKontrol = true; draw(); }
      else if (a === 'es-sifirla') { st.esSec = null; st.esYer = {}; st.esKontrol = false; draw(); }
      else if (a === 'sn-cip') { const i = +el.dataset.i; st.snSec = st.snSec === i ? null : i; draw(); }
      else if (a === 'sn-kutu') { if (st.snSec == null) return; st.snYer[st.snSec] = +el.dataset.k; st.snSec = null; st.snKontrol = false; draw(); }
      else if (a === 'sn-havuz') { if (st.snSec == null) return; delete st.snYer[st.snSec]; st.snSec = null; st.snKontrol = false; draw(); }
      else if (a === 'sn-kontrol') { st.snKontrol = true; draw(); }
      else if (a === 'sn-sifirla') { st.snSec = null; st.snYer = {}; st.snKontrol = false; draw(); }
      else if (a === 'sr-tasi') { const p = +el.dataset.pos, y = p + +el.dataset.yon; if (y >= 0 && y < 4) { [st.srSira[p], st.srSira[y]] = [st.srSira[y], st.srSira[p]]; st.srKontrol = false; draw(); } }
      else if (a === 'sr-kontrol') { st.srKontrol = true; draw(); }
      else if (a === 'gv-sec') { st.gvSec = +el.dataset.i; st.gvKontrol = false; draw(); }
      else if (a === 'gv-kontrol') { st.gvKontrol = true; draw(); }
      else if (a === 'bd-cip') { if (!st.bd1) st.bd1 = el.dataset.kelime; else if (!st.bd2) st.bd2 = el.dataset.kelime; else st.bd1 = el.dataset.kelime; st.bdKontrol = false; draw(); }
      else if (a === 'bd-kontrol') { st.bdKontrol = true; draw(); }
      else if (a === 'au-ornek') { st.auOrnek = !st.auOrnek; draw(); }
    };
    const onInput = ev => {
      const t = ev.target;
      if (t.dataset && t.dataset.tbInp) {
        st[t.dataset.tbInp] = t.value;
        if (t.dataset.tbInp === 'auMetin') {
          const s = host.querySelector('.sayac');
          if (s) s.textContent = (t.value.trim().match(/\S+/g) || []).length + ' kelime';
        }
      }
    };

    host.addEventListener('click', onClick);
    host.addEventListener('input', onInput);
    draw();
    return {
      destroy() { host.removeEventListener('click', onClick); host.removeEventListener('input', onInput); },
    };
  }

  return { SENARYOLAR, SABLONLAR, TABLO_KARS, baglamdanSenaryo, createTaskPlayer, createTemplateShowcase };
})();
