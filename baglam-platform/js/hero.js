/* Bağlam araştırma yolculuğu. Bağımlılıksız; render(), mount(), destroy(). */
window.ResearchJourney = (() => {
  'use strict';
  const icons = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
    design: '<path d="m4 16-1 5 5-1L21 7l-4-4Z M14 6l4 4 M3 8l5-5 4 4 M17 12l4 4-5 5"/>',
    data: '<rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 11 1 1 2-2m-3 7 1 1 2-2m3-5h2m-2 6h2"/>',
    chart: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
    flag: '<path d="M5 22V3m0 1c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    play: '<path d="m9 5 11 7-11 7Z"/>',
    pause: '<path d="M9 5v14m6-14v14"/>',
    replay: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    ice: '<path d="m7 13 5 9 5-9M6 13h12a3 3 0 0 0 0-6 6 6 0 0 0-12 0 3 3 0 0 0 0 6Z"/><path d="m9 14 5 5m-3-5 4 2"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" class="j-icon" aria-hidden="true">${icons[name]}</svg>`;
  const steps = [
    { title: 'Problem / Soru', brief: 'Problemi tanımla.', icon: 'search', x: 90, y: 315, label: 'HER ŞEY BİR SORUYLA BAŞLAR', message: 'Sıcaklık ile dondurma satışları arasında bir ilişki var mı?', note: 'Günlük bir gözlem, araştırılabilir bir soru.', bubble: 'ice' },
    { title: 'Alan Yazını', brief: 'Mevcut bilgiyi incele.', icon: 'book', x: 300, y: 315, label: 'ÖNCE BİLİNENLERE BAK', message: 'Önce bu konuda daha önce neler araştırılmış, inceleyelim.', note: 'Önceki çalışmaları ve bulguları incele.' },
    { title: 'Tasarım', brief: 'Yöntemi planla.', icon: 'design', x: 510, y: 315, label: 'SORUDAN BİR PLANA', message: 'Hangi verileri, nasıl ve ne zaman toplayacağımızı planlayalım.', note: 'Günlük ölçümleri, süreyi ve yöntemi belirle.' },
    { title: 'Veri Toplama', brief: 'Verileri topla.', icon: 'data', x: 510, y: 525, label: 'ŞİMDİ GÖZLEM ZAMANI', message: 'Günlük sıcaklıkları ve dondurma satışlarını kaydedelim.', note: 'Aynı döneme ait verileri düzenli topla.' },
    { title: 'Analiz', brief: 'Verileri çözümle.', icon: 'chart', x: 300, y: 525, label: 'VERİLER NE SÖYLÜYOR?', message: 'Topladığımız verileri karşılaştıralım. Aralarında bir ilişki var mı?', note: 'Grafik oluştur, ilişkinin yönünü incele.' },
    { title: 'Sonuç / Rapor', brief: 'Yorumla ve paylaş.', icon: 'flag', x: 90, y: 525, label: 'BİR SORUDAN BİLGİYE', message: 'Veriler ne söylüyor? Bulgularımızı yorumlayıp paylaşalım.', note: 'Birlikte değişim, tek başına neden–sonuç değildir.' },
  ];
  // Aynı yol hem SVG çizgiyi hem robotun konumunu belirler.
  const path = 'M55 270 C75 270 140 250 163 250 S248 270 271 270 S356 250 379 250 S464 270 487 270 S572 250 595 250';
  const robot = `<svg class="j-robot-art" viewBox="0 0 140 160" aria-hidden="true">
    <defs>
      <linearGradient id="jr-shell" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="#fffefa"/><stop offset=".5" stop-color="#f3f0e7"/><stop offset="1" stop-color="#c5d5cd"/></linearGradient>
      <linearGradient id="jr-teal" x2=".8" y2="1"><stop stop-color="#70d2bf"/><stop offset="1" stop-color="#158f81"/></linearGradient>
      <linearGradient id="jr-face" x2=".5" y2="1"><stop stop-color="#284b45"/><stop offset="1" stop-color="#102e2a"/></linearGradient>
      <linearGradient id="jr-orange" x2=".8" y2="1"><stop stop-color="#ffc283"/><stop offset="1" stop-color="#e58444"/></linearGradient>
    </defs>
    <ellipse cx="70" cy="150" rx="38" ry="7" fill="#164c3b" opacity=".12"/>
    <g class="j-robot-float">
      <path d="M70 26V14" stroke="#a6bab1" stroke-width="5"/><circle cx="70" cy="11" r="6" fill="url(#jr-orange)"/><circle cx="68" cy="9" r="2" fill="#ffe8cb"/>
      <rect x="39" y="126" width="24" height="18" rx="8" fill="url(#jr-teal)"/><rect x="78" y="126" width="24" height="18" rx="8" fill="url(#jr-teal)"/>
      <rect class="j-foot-left" x="42" y="133" width="22" height="12" rx="5" fill="url(#jr-shell)"/><rect class="j-foot-right" x="78" y="133" width="22" height="12" rx="5" fill="url(#jr-shell)"/>
      <rect x="35" y="87" width="72" height="47" rx="21" fill="url(#jr-shell)" stroke="#d4ded5"/>
      <path d="M40 101q30 15 61 0" stroke="#e5e8dc" fill="none"/>
      <rect x="56" y="104" width="29" height="17" rx="7" fill="url(#jr-teal)"/><circle cx="70" cy="112" r="3" fill="#f4fff9"/>
      <g class="j-arm"><rect x="17" y="92" width="16" height="34" rx="8" fill="url(#jr-shell)" transform="rotate(16 25 98)"/><circle cx="27" cy="96" r="6" fill="url(#jr-orange)"/></g>
      <g class="j-arm-right"><rect x="109" y="89" width="16" height="33" rx="8" fill="url(#jr-shell)" transform="rotate(-25 115 95)"/><circle cx="112" cy="95" r="6" fill="url(#jr-orange)"/></g>
      <rect x="15" y="47" width="13" height="25" rx="6" fill="url(#jr-orange)"/><rect x="113" y="47" width="13" height="25" rx="6" fill="url(#jr-orange)"/>
      <rect x="23" y="26" width="95" height="68" rx="25" fill="url(#jr-shell)" stroke="#d5ded3"/>
      <path d="M35 39q30-11 66-3" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>
      <rect x="34" y="44" width="73" height="38" rx="16" fill="url(#jr-face)"/>
      <path d="M43 49q26-8 53 0" stroke="#6c9486" stroke-width="2" opacity=".35" fill="none"/>
      <g class="j-eyes" fill="#9de9ce"><rect x="49" y="55" width="9" height="13" rx="4.5"/><rect x="83" y="55" width="9" height="13" rx="4.5"/></g>
      <path d="M65 71q6 5 12 0" stroke="#9de9ce" fill="none" stroke-width="2" stroke-linecap="round"/>
    </g>
  </svg>`;

  function render() {
    return `<section class="research-hero wrap" data-phase="intro" aria-labelledby="research-title">
      <div class="research-copy">
        <div class="research-eyebrow"><span></span> MERAKTAN BİLGİYE, ADIM ADIM</div>
        <h1 id="research-title">Araştırma<br>yöntemlerini<br><em>gerçek problemler</em><br>üzerinden öğren<span class="research-period">.</span></h1>
        <p>Günlük hayattan ilgi çekici problemleri araştırma adımlarıyla incele, veriye dayalı sonuçlara nasıl ulaşıldığını keşfet.</p>
        <div class="research-cta"><a class="btn lg" href="#kayit">Hemen başla ${icon('arrow')}</a><button class="btn lg ghost" data-act="kaydir" data-hedef="lp-moduller">Modülleri gör ${icon('book')}</button></div>
        <div class="research-footnote"><span>${icon('check')}</span> Gerçek problemler <i></i> Bilimsel düşünme</div>
      </div>
      <div class="journey" aria-label="Altı adımda bilimsel araştırma yolculuğu">
        <div class="journey-topline"><span>BİR SORUNUN YOLCULUĞU</span><span class="j-example">ÖRNEK ARAŞTIRMA</span></div>
        <div class="journey-viewport"><div class="journey-stage">
          <div class="journey-halo" aria-hidden="true"></div>
          <div class="j-bubble"><div class="j-bubble-icon">${icon('ice')}</div><div><span class="j-bubble-label">${steps[0].label}</span><p class="j-message">Sıcaklık arttıkça dondurma satışları da artar mı?</p><small class="j-note">${steps[0].note}</small></div></div>
          <svg class="j-road" viewBox="0 0 650 430" aria-hidden="true"><path class="j-road-bed" d="${path}"/><path class="j-road-dash" d="${path}"/><path class="j-road-progress" d="${path}"/></svg>
          <div class="j-stops" role="group" aria-label="Araştırma adımını seç" inert>${steps.map((s, i) => `<button class="j-stop${i === 0 ? ' is-active' : ''}" data-step="${i}" style="left:${s.x}px;top:${s.y}px" aria-label="${i + 1}. ${s.title}: ${s.brief}" aria-pressed="${i === 0}"><span class="j-stop-point"><span>${i + 1}</span></span><span class="j-stop-card"><span class="j-stop-icon">${icon(s.icon)}</span><span><strong>${s.title}</strong><small>${s.brief}</small></span></span></button>`).join('')}</div>
          <div class="j-traveler" >${robot}<span class="j-success">${icon('check')}</span></div>
        </div></div>
        <div class="journey-controls"><button class="j-toggle" type="button" aria-label="Animasyonu duraklat">${icon('pause')}</button><div class="j-dots" inert role="group" aria-label="Adıma git">${steps.map((s, i) => `<button data-step="${i}" class="j-dot${i === 0 ? ' is-active' : ''}" aria-label="${s.title} adımına git" aria-pressed="${i === 0}"><span></span></button>`).join('')}</div><span class="j-counter">Bir soruyla başla</span><button class="j-restart" type="button" aria-label="Yeniden izle">${icon('replay')}<span>Yeniden izle</span></button></div>
        <p class="j-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>
    </section>`;
  }

  function mount(root) {
    if (!root) return { destroy() {} };
    const $ = selector => root.querySelector(selector);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 520px)');
    const stage = $('.journey-stage'), viewport = $('.journey-viewport');
    const road = $('.j-road-progress'), traveler = $('.j-traveler'), bubble = $('.j-bubble');
    const stops = [...root.querySelectorAll('.j-stop')];
    const duration = { intro: 4400, reveal: 1900, hold: 4700, travel: 1350, celebrate: 1200 };
    let phase = 'intro', active = 0, playing = !motion.matches, automatic = true;
    let elapsed = 0, clock = 0, frame = 0, previousTime = null, visible = true, destroyed = false;
    let points = [], distances = [], length = 1, distance = 0, travel = null;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
    const ease = t => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;

    // Tek saat: duraklatma, görünmez sekme ve ekran dışına çıkma bütün hareketi dondurur.
    function controls() {
      $('.j-toggle').innerHTML = icon(phase === 'complete' ? 'replay' : playing ? 'pause' : 'play');
      $('.j-toggle').setAttribute('aria-label', phase === 'complete' ? 'Yeniden oynat' : playing ? 'Animasyonu duraklat' : 'Animasyonu oynat');
      root.classList.toggle('is-paused', !playing || !visible || document.hidden);
    }
    function setPhase(next) {
      phase = next; elapsed = 0; root.dataset.phase = next;
      const hidden = next === 'intro' || next === 'reveal';
      $('.j-stops').inert = hidden; $('.j-dots').inert = hidden;
      root.classList.toggle('is-complete', next === 'celebrate' || next === 'complete');
      controls();
    }
    function message(index, intro = false) {
      const s = steps[index];
      $('.j-bubble-label').textContent = intro ? 'HER ŞEY BİR SORUYLA BAŞLAR' : s.label;
      $('.j-message').textContent = intro ? 'Sıcaklık arttıkça dondurma satışları da artar mı?' : s.message;
      $('.j-note').textContent = s.note;
      $('.j-bubble-icon').innerHTML = icon(intro ? 'ice' : s.icon);
    }
    function activate(index, announce = false) {
      active = index; root.dataset.step = index;
      root.querySelectorAll('[data-step]').forEach(el => {
        const n = Number(el.dataset.step);
        el.classList.toggle('is-active', n === index);
        el.classList.toggle('is-done', n < index);
        el.setAttribute('aria-pressed', String(n === index));
      });
      $('.j-counter').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
      message(index);
      if (announce) $('.j-sr-only').textContent = `${index + 1} / 6. ${steps[index].title}. ${steps[index].message}`;
    }
    function position(d) {
      distance = d;
      return road.getPointAtLength(d);
    }
    function paint() {
      const compact = mobile.matches;
      const intro = phase === 'intro', reveal = phase === 'reveal';
      const t = reveal ? ease(clamp(elapsed / duration.reveal, 0, 1)) : intro ? 0 : 1;
      const small = compact ? .57 : .64;
      const introPos = { x: 172, y: compact ? 455 : 400, scale: compact ? 2.15 : 2.1 };
      const p = intro || reveal ? points[0] : position(distance);
      let x = lerp(introPos.x, p.x, t), y = lerp(introPos.y, p.y, t), scale = lerp(introPos.scale, small, t);
      const entry = intro && !motion.matches ? ease(clamp(elapsed / 850, 0, 1)) : 1;
      const turning = (1 - entry) * -18;
      traveler.style.opacity = entry;
      traveler.style.transform = `translate(${x - 70 * scale + (1 - entry) * 25}px, ${y - 153 * scale}px) scale(${scale}) perspective(700px) rotateY(${turning}deg)`;
      const walking = phase === 'travel';
      const bob = motion.matches ? 0 : walking ? Math.sin(clock / 85) * 2.2 : phase === 'celebrate' ? -Math.sin(elapsed / duration.celebrate * Math.PI) * 9 : Math.sin(clock / 650) * 1.4;
      $('.j-robot-float').setAttribute('transform', `translate(0 ${bob})`);
      const wave = motion.matches ? 0 : intro ? -55 + Math.sin(clock / 180) * 16 : walking ? Math.sin(clock / 100) * 16 : phase === 'celebrate' ? -65 + Math.sin(clock / 100) * 20 : 0;
      $('.j-arm-right').setAttribute('transform', `rotate(${wave} 112 95)`);
      $('.j-arm').setAttribute('transform', `rotate(${walking && !motion.matches ? -Math.sin(clock / 100) * 16 : 0} 27 96)`);
      $('.j-foot-left').setAttribute('transform', `translate(0 ${walking && !motion.matches ? Math.sin(clock / 100) * 3 : 0})`);
      $('.j-foot-right').setAttribute('transform', `translate(0 ${walking && !motion.matches ? -Math.sin(clock / 100) * 3 : 0})`);
      const blink = !motion.matches && clock % 4800 > 4580 ? .18 : 1;
      $('.j-eyes').setAttribute('transform', `translate(0 ${61 * (1 - blink)}) scale(1 ${blink})`);
      const revealAmount = intro ? 0 : reveal ? clamp((t - .1) / .8, 0, 1) : 1;
      $('.j-road').style.clipPath = `inset(0 ${(1 - revealAmount) * 100}% 0 0)`;
      $('.j-road').style.opacity = revealAmount;
      stops.forEach((stop, i) => {
        const amount = intro ? 0 : reveal ? clamp((t - .22 - i * .09) * 5, 0, 1) : 1;
        stop.style.opacity = amount;
        stop.style.transform = `translateY(${(1 - amount) * 8}px)`;
      });
      road.style.strokeDashoffset = length - distance;
      const bubbleWidth = intro || reveal ? 310 : compact ? 390 : 330;
      const bubbleX = intro || reveal ? 325 : clamp(x - bubbleWidth / 2, 8, 642 - bubbleWidth);
      bubble.style.width = `${bubbleWidth}px`;
      bubble.style.left = `${bubbleX}px`;
      bubble.style.top = `${intro || reveal ? 82 : 24}px`;
      bubble.style.setProperty('--tail-x', `${clamp(x - bubbleX, 24, bubbleWidth - 24)}px`);
      let opacity = intro ? clamp((elapsed - 650) / 550, 0, 1) : reveal ? 1 - clamp(elapsed / 450, 0, 1) : walking ? 0 : clamp(elapsed / 300, 0, 1);
      if (motion.matches || phase === 'complete') opacity = 1;
      bubble.style.opacity = opacity;
      bubble.style.transform = `translateY(${(1 - opacity) * 5}px)`;
      $('.j-dots').style.visibility = intro || reveal ? 'hidden' : 'visible';
    }
    function arrive(index, manual) {
      distance = distances[index]; travel = null; activate(index, manual); setPhase('hold');
      if (manual) { automatic = false; playing = false; elapsed = 400; }
      controls(); paint();
    }
    function begin(index, manual = false) {
      automatic = !manual;
      if (motion.matches) { arrive(index, manual); return; }
      travel = { from: distance / length, target: index, manual };
      playing = true; setPhase('travel'); controls(); schedule();
    }
    function finish() {
      setPhase('celebrate');
      $('.j-message').textContent = 'Bir sorudan bilimsel bilgiye! İşte araştırma böyle ilerler.';
      $('.j-bubble-label').textContent = 'YOLCULUK TAMAMLANDI';
      $('.j-sr-only').textContent = $('.j-message').textContent;
    }
    function tick(time) {
      frame = 0;
      if (!playing || !visible || document.hidden || destroyed) { previousTime = null; return; }
      const dt = previousTime === null ? 0 : Math.min(time - previousTime, 80);
      previousTime = time; elapsed += dt; clock += dt;
      if (phase === 'intro' && elapsed >= duration.intro) setPhase('reveal');
      else if (phase === 'reveal' && elapsed >= duration.reveal) { activate(0); setPhase('hold'); }
      else if (phase === 'travel') {
        const t = ease(clamp(elapsed / duration.travel, 0, 1));
        distance = lerp(travel.from * length, distances[travel.target], t);
        if (t === 1) arrive(travel.target, travel.manual);
      } else if (phase === 'hold' && automatic && elapsed >= duration.hold) {
        if (active === 5) finish(); else begin(active + 1);
      } else if (phase === 'celebrate' && elapsed >= duration.celebrate) { setPhase('complete'); playing = false; controls(); }
      paint(); schedule();
    }
    function schedule() { if (!frame && playing && visible && !document.hidden && !destroyed) frame = requestAnimationFrame(tick); }
    function restart() {
      travel = null; distance = 0; clock = 0; previousTime = null;
      automatic = true; playing = !motion.matches; activate(0); message(0, true); setPhase('intro');
      $('.j-counter').textContent = 'Bir soruyla başla'; paint(); schedule();
    }
    function toggle() {
      if (phase === 'complete') { restart(); return; }
      playing = !playing; previousTime = null;
      if (playing && phase === 'hold') automatic = true;
      if (playing && motion.matches && (phase === 'intro' || phase === 'reveal')) { activate(0); setPhase('hold'); }
      controls(); paint(); schedule();
    }
    function click(event) {
      const target = event.target.closest('[data-step], .j-toggle, .j-restart');
      if (!target) return;
      if (target.matches('.j-restart')) restart();
      else if (target.matches('.j-toggle')) toggle();
      else if (phase !== 'intro' && phase !== 'reveal') begin(Number(target.dataset.step), true);
    }
    function resize() {
      const fraction = distance / length, compact = mobile.matches;
      const height = compact ? 540 : 430;
      points = compact ? [{x:100,y:260},{x:325,y:260},{x:550,y:260},{x:550,y:440},{x:325,y:440},{x:100,y:440}] : [{x:55,y:270},{x:163,y:250},{x:271,y:270},{x:379,y:250},{x:487,y:270},{x:595,y:250}];
      const d = compact ? 'M100 260 C175 260 250 260 325 260 S475 260 550 260 C650 260 650 440 550 440 C475 440 400 440 325 440 S175 440 100 440' : path;
      root.querySelectorAll('.j-road path').forEach(el => el.setAttribute('d', d));
      $('.j-road').setAttribute('viewBox', `0 0 650 ${height}`);
      stage.style.height = `${height}px`;
      $('.j-road').style.height = `${height}px`;
      points.forEach((p, i) => { stops[i].style.left = `${p.x}px`; stops[i].style.top = `${p.y}px`; });
      length = road.getTotalLength();
      distances = points.map(p => {
        let best = 0, error = Infinity;
        for (let n = 0; n <= length; n++) { const q = road.getPointAtLength(n), e = (q.x-p.x)**2 + (q.y-p.y)**2; if (e < error) {error=e;best=n;} }
        return best;
      });
      distances[5] = length; distance = phase === 'hold' || phase === 'complete' || phase === 'celebrate' ? distances[active] : fraction * length;
      road.style.strokeDasharray = `${length} ${length}`;
      const style = getComputedStyle(root);
      const reserved = (document.querySelector('.lp-nav')?.offsetHeight || 0)
        + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
        + $('.journey-topline').offsetHeight + $('.journey-controls').offsetHeight + 12;
      const heightScale = innerWidth > 860 ? Math.max(260, innerHeight - reserved) / height : Infinity;
      const scale = Math.min(viewport.clientWidth / 650, heightScale, 1.08);
      stage.style.transform = `scale(${scale})`;
      stage.style.left = `${(viewport.clientWidth - 650 * scale) / 2}px`;
      viewport.style.height = `${height * scale}px`;
      paint();
    }
    function visibility() { previousTime = null; controls(); schedule(); }
    function motionChange() {
      if (motion.matches) {
        playing = false;
        if (phase === 'travel') arrive(travel.target, true);
        else if (phase === 'reveal') { activate(0); setPhase('hold'); }
        else if (phase === 'celebrate') setPhase('complete');
      }
      controls(); paint();
    }
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visibility(); }, { threshold: .15 });
    resizeObserver.observe(viewport); intersection.observe($('.journey'));
    root.addEventListener('click', click); document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', motionChange); mobile.addEventListener('change', resize);
    window.addEventListener('resize', resize);
    resize(); restart();
    return { destroy() {
      destroyed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
      root.removeEventListener('click', click); document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', motionChange); mobile.removeEventListener('change', resize);
      window.removeEventListener('resize', resize);
    } };
  }
  return { render, mount };
})();
