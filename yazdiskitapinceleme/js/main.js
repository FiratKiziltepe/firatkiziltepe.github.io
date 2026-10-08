/* Uygulama: üst bar, PDF araç çubuğu, arama, yerleşim (masaüstü/tablet/mobil), akışlar ve kısayollar */
"use strict";

const App = {
  /* ================================================================ başlatma */
  init() {
    Store.load();
    Pub.load();
    UI.page = clamp((S.bookPages && S.bookPages.main) || 42, 1, Doc.pageCount);
    UI.fitMode = S.prefs.fitMode || "width";
    UI.zoom = S.prefs.zoom || 1;
    this.applyTheme();
    this.computeLayout();
    this.renderTopbar();
    Viewer.init();
    Left.bind(); Right.bind();
    this.bindTopbar(); this.bindToolbar(); this.bindLayout(); this.bindKeys(); this.bindDocBars();
    this.onDocChange(UI.page, true);
    // yayınevi panelinde eşleştirme değişirse (başka sekmede) inceleme ekranını güncelle
    window.addEventListener("storage", (e) => { if (e.key === PUB_KEY) { Pub.load(); this.renderProgBar(); Left.render(); if (UI.view.type === "outcome") Right.render({ keepScroll: true }); toast("Yayınevi eşleştirmeleri güncellendi", { icon: "book" }); } });
    if (S.draft && S.draft.docId === Doc.id) setTimeout(() => toast("Kaydedilmemiş bir tespit taslağınız var.", { icon: "pencil", action: "Devam et", onAction: () => { UI.view = { type: "form" }; Right.render(); } }), 600);
    window.addEventListener("beforeunload", () => { if (UI.saveState === "saving") Store.persistNow(); });
  },

  onDocChange(page, first) {
    UI.selected = null; UI.pending = null; UI.view = { type: "list" }; UI.viewStack = []; UI.filters = {};
    UI.expandedUnits = new Set(); UI.expandedSections = new Set();
    UI.page = clamp(page || 1, 1, Doc.pageCount);
    this.openTreeFor(UI.page);
    Viewer.build();
    if (UI.fitMode !== "custom") UI.zoom = Viewer.fitZoom(UI.fitMode);
    Viewer.applyZoomVar();
    this.renderTopbar(); this.renderToolbar(); this.renderDocTabs(); this.renderProgBar();
    if (UI.leftTab === "program" && !Doc.isDemo && Doc.type === "pdf") UI.leftTab = "content";
    Left.render(); Right.render();
    requestAnimationFrame(() => Viewer.goTo(UI.page, { instant: true }));
    if (!first && !this._quietDoc) toast(Doc.type === "mock" ? `${Doc.book.short} açıldı` : `“${Doc.title}” açıldı · ${Doc.pageCount} sayfa`, { icon: "book" });
    this._quietDoc = false;
  },

  refreshAll() {
    GeoCache.clear();
    this.renderTopbar(); this.renderToolbar();
    Left.render(); Right.render({ keepScroll: true });
    Viewer.refreshOverlays(); Viewer.updateAllLabels();
  },

  /* ================================================================ yerleşim */
  computeLayout() {
    const w = window.innerWidth;
    const l = w >= 960 ? "desktop" : w >= 600 ? "tablet" : "mobile";
    const changed = l !== UI.layout;
    UI.layout = l;
    if (changed) { UI.flyout = false; UI.drawer = false; if (l !== "desktop") UI.sheet = UI.sheet || "half"; }
    return changed;
  },
  leftExpanded() { return UI.layout === "desktop" && S.prefs.leftExpanded && !UI.focus; },
  applyLayout() {
    const app = $("#app");
    const c = app.classList;
    ["layout-desktop", "layout-tablet", "layout-mobile"].forEach((k) => c.remove(k));
    c.add("layout-" + UI.layout);
    c.toggle("left-collapsed", !this.leftExpanded());
    c.toggle("flyout-open", !this.leftExpanded() && UI.flyout && UI.layout !== "mobile");
    c.toggle("drawer-open", UI.layout === "mobile" && UI.drawer);
    c.toggle("right-collapsed", UI.layout === "desktop" && UI.rightCollapsed);
    c.toggle("focus-mode", UI.focus);
    ["sheet-min", "sheet-half", "sheet-full"].forEach((k) => c.remove(k));
    if (UI.layout !== "desktop") c.add("sheet-" + UI.sheet);
    this.applyRightWidth();
  },
  applyRightWidth() {
    const ws = $("#workspace").clientWidth || window.innerWidth;
    const leftW = this.leftExpanded() ? 356 : 56;
    const max = Math.max(360, Math.min(650, ws - leftW - 420));
    const w = clamp(S.prefs.rightWidth || 400, 360, max);
    $("#app").style.setProperty("--right-w", w + "px");
  },
  toggleLeft() {
    if (UI.layout === "mobile") { UI.drawer = !UI.drawer; this.applyLayout(); Left.render(); return; }
    if (UI.layout === "tablet") { UI.flyout = !UI.flyout; this.applyLayout(); Left.render(); return; }
    if (UI.focus) this.toggleFocus();
    S.prefs.leftExpanded = !S.prefs.leftExpanded; UI.flyout = false; Store.prefsChanged();
    this.applyLayout(); Left.render();
  },
  toggleRight() {
    if (UI.layout !== "desktop") { this.setSheet(UI.sheet === "min" ? "half" : "min"); return; }
    UI.rightCollapsed = !UI.rightCollapsed; this.applyLayout(); Right.render();
  },
  afterLeftNav(openRight) {
    if (UI.layout === "mobile") { UI.drawer = false; this.applyLayout(); }
    else if (UI.layout === "tablet" && UI.flyout) { UI.flyout = false; this.applyLayout(); }
    if (openRight) this.revealRight();
    Left.renderRail();
  },
  revealRight() {
    if (UI.layout === "desktop") { if (UI.rightCollapsed) { UI.rightCollapsed = false; this.applyLayout(); } }
    else if (UI.sheet === "min") this.setSheet("half");
  },
  setSheet(s) {
    UI.sheet = s; $("#right").style.height = ""; this.applyLayout();
    if (UI.fitMode === "page") setTimeout(() => Viewer.fit("page", true), 220);
  },
  toggleFocus() {
    if (!UI.focus) {
      UI._preFocus = { rightCollapsed: UI.rightCollapsed, sheet: UI.sheet };
      UI.focus = true; UI.flyout = false;
      if (UI.layout === "desktop") UI.rightCollapsed = true; else UI.sheet = "min";
      toast("Odak modu · çıkmak için F veya Esc", { icon: "focus" });
    } else {
      UI.focus = false;
      const p = UI._preFocus || {};
      UI.rightCollapsed = !!p.rightCollapsed; UI.sheet = p.sheet || "half";
    }
    this.applyLayout(); Left.render(); Right.render(); this.renderToolbar();
  },
  bindLayout() {
    this.applyLayout();
    const onResize = debounce(() => {
      const changed = this.computeLayout();
      this.applyLayout();
      if (changed) { this.renderTopbar(); Left.render(); Right.render(); this.renderToolbar(); if (UI.fitMode !== "custom") Viewer.fit(UI.fitMode, true); }
    }, 100);
    window.addEventListener("resize", onResize);
    new ResizeObserver(onResize).observe(document.documentElement);

    /* sağ panel genişliği: sürükle (360–650 px) */
    const h = $("#resizeHandle");
    h.addEventListener("pointerdown", (e) => {
      if (UI.layout !== "desktop") return;
      e.preventDefault();
      h.setPointerCapture(e.pointerId);
      const startX = e.clientX, startW = $("#right").getBoundingClientRect().width;
      $("#app").classList.add("resizing");
      const move = (ev) => { S.prefs.rightWidth = Math.round(startW + (startX - ev.clientX)); this.applyRightWidth(); };
      const up = () => { h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", up); $("#app").classList.remove("resizing"); Store.prefsChanged(); Viewer.invalidate(); };
      h.addEventListener("pointermove", move); h.addEventListener("pointerup", up);
    });
    h.addEventListener("dblclick", () => { S.prefs.rightWidth = 400; this.applyRightWidth(); Store.prefsChanged(); });

    /* tablet/mobil alt panel (bottom sheet) */
    const grip = $("#sheetGrip");
    grip.addEventListener("pointerdown", (e) => {
      if (UI.layout === "desktop") return;
      const right = $("#right");
      const ws = $("#workspace").getBoundingClientRect();
      const startY = e.clientY, startH = right.getBoundingClientRect().height;
      let moved = false;
      grip.setPointerCapture(e.pointerId);
      $("#app").classList.add("resizing");
      const move = (ev) => { const dy = startY - ev.clientY; if (Math.abs(dy) > 4) moved = true; right.style.height = clamp(startH + dy, 56, ws.height - 8) + "px"; };
      const up = (ev) => {
        grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up);
        $("#app").classList.remove("resizing");
        if (!moved) { this.setSheet(UI.sheet === "min" ? "half" : UI.sheet === "half" ? "full" : "min"); return; }
        const h2 = right.getBoundingClientRect().height / ws.height;
        this.setSheet(h2 < 0.27 ? "min" : h2 < 0.7 ? "half" : "full");
      };
      grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up);
    });
    $("#leftScrim").addEventListener("click", () => { UI.drawer = false; UI.flyout = false; this.applyLayout(); Left.renderRail(); });
  },

  /* ================================================================ tema */
  applyTheme() {
    const r = document.documentElement;
    r.dataset.theme = S.prefs.theme === "dark" ? "dark" : "light";
    r.dataset.paper = S.prefs.paper || "white";
  },

  /* ================================================================ üst bar */
  renderTopbar() {
    const phase = Q.phase();
    const phaseLabel = S.config.reviewMode === "panel" ? D.PHASES[phase].label : "Komisyon İncelemesi";
    const phaseShort = S.config.reviewMode === "panel" ? D.PHASES[phase].short : "Komisyon";
    const unread = D.NOTIFICATIONS.filter((n) => n.unread && !UI.notifRead).length;
    const html = `
      <div class="tb-left">
        <button class="icon-btn tb-only-mobile" data-act="drawer" aria-label="Kitap navigasyonu">${icon("menu")}</button>
        <div class="brand"><div class="logo" aria-hidden="true"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#2a4a7f"/><path d="M8 9h7a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H8z" fill="#e8eefa"/><path d="M24 9h-4a2 2 0 0 0-2 2v13a2.4 2.4 0 0 1 2.4-2.4H24z" fill="#9fc0f5"/></svg></div>
          <div class="brand-txt"><div class="brand-sys">TTKB Ders Kitabı İnceleme Sistemi</div><div class="brand-book"><span class="bk-title" title="${esc(Doc.title)}">${esc(Doc.title)}</span><span class="bk-meta">${esc(Doc.subtitle)}</span></div></div>
        </div>
      </div>
      <div class="tb-center"><div class="search" id="searchBox"><span class="s-ic">${icon("search")}</span><input id="q" type="search" placeholder="Kitap içinde ara, tespit bul veya sayfaya git..." autocomplete="off" spellcheck="false" aria-label="Kitap içinde ara" aria-controls="searchResults" aria-expanded="false"><kbd>Ctrl K</kbd><button class="icon-btn sm s-close" data-act="search-close" aria-label="Aramayı kapat">${icon("x")}</button></div><div class="search-results" id="searchResults" role="listbox" hidden></div></div>
      <div class="tb-right">
        <button class="icon-btn tb-only-mobile" data-act="search-open" aria-label="Ara">${icon("search")}</button>
        <div class="save-state" id="saveState" aria-live="polite"></div>
        <button class="phase" data-act="phase" aria-haspopup="dialog" title="İnceleme aşaması (yönetici konfigürasyonu)">${icon(S.config.reviewMode === "panel" && phase === 1 ? "user" : "users")}<span class="ph-long">${esc(phaseLabel)}</span><span class="ph-short">${esc(phaseShort)}</span></button>
        <button class="icon-btn" data-act="notif" aria-label="Bildirimler">${icon("bell")}${unread ? `<span class="dot">${unread}</span>` : ""}</button>
        <button class="avatar" data-act="user" aria-label="Kullanıcı menüsü" title="${esc(D.REVIEWERS.me.name)}">${D.REVIEWERS.me.initials}</button>
      </div>`;
    const tb = $("#topbar");
    if (!$("#searchBox")) tb.innerHTML = html;
    else {
      // arama kutusu yerinde kalır (odak ve dinleyiciler korunur)
      const tmp = document.createElement("div"); tmp.innerHTML = html;
      tb.replaceChild(tmp.querySelector(".tb-left"), tb.querySelector(".tb-left"));
      tb.replaceChild(tmp.querySelector(".tb-right"), tb.querySelector(".tb-right"));
    }
    this.renderSave();
  },
  renderSave() {
    const el = $("#saveState");
    if (el) el.innerHTML = UI.saveState === "saving" ? `${icon("cloudSync")}<span>Kaydediliyor…</span>` : `${icon("cloud")}<span>Kaydedildi ✓${UI.savedAt ? `<i> ${fmtTime(UI.savedAt).replace("Bugün ", "")}</i>` : ""}</span>`;
    el && el.classList.toggle("is-saving", UI.saveState === "saving");
    const as = $("#rightInner .autosave");
    if (as) as.textContent = UI.saveState === "saving" ? "Kaydediliyor…" : "Taslak kaydedildi ✓";
  },
  bindTopbar() {
    const tb = $("#topbar");
    tb.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const a = b.dataset.act;
      if (a === "drawer") return this.toggleLeft();
      if (a === "phase") return this.openPhase(b);
      if (a === "notif") return this.openNotif(b);
      if (a === "user") return this.openUser(b);
      if (a === "search-open") { $("#app").classList.add("search-open"); setTimeout(() => $("#q").focus(), 30); return; }
      if (a === "search-close") { $("#app").classList.remove("search-open"); Search.close(); return; }
    });
    Search.bind();
  },
  openPhase(anchor) {
    const c = S.config;
    const ph = Q.phase();
    const html = `<div class="pp">
      <div class="pp-h">İnceleme aşaması</div>
      <div class="pp-phase">${S.config.reviewMode === "panel" ? esc(D.PHASES[ph].label) : "Komisyon İncelemesi"}</div>
      <p class="muted">Aşama yönetici konfigürasyonundan gelir; incelemeci tarafından değiştirilemez.</p>
      <dl class="pp-dl"><dt>İnceleme türü</dt><dd>${c.reviewMode === "panel" ? "Panel" : "Komisyon"}</dd>${c.reviewMode === "panel" ? `<dt>${ph === 1 ? "Bitiş" : "Panel toplantısı"}</dt><dd>${ph === 1 ? "13 Ekim 2026" : "21 Ekim 2026, 10.00"}</dd>` : `<dt>Diğer incelemeciler</dt><dd>${c.showOtherReviewerFindings ? "Görünür (salt okunur)" : "Gizli"}</dd>`}</dl>
      <div class="pp-demo"><div class="pp-demo-h">${icon("sliders")}Prototip · Admin simülasyonu</div>
        <div class="pp-row"><span>İnceleme türü</span><div class="seg seg-sm">${[["panel", "Panel"], ["commission", "Komisyon"]].map(([k, l]) => `<button class="${c.reviewMode === k ? "is-active" : ""}" data-cfg-mode="${k}">${l}</button>`).join("")}</div></div>
        ${c.reviewMode === "panel" ? `<div class="pp-row"><span>Aşama</span><div class="seg seg-sm">${[[1, "1 · Bağımsız"], [2, "2 · Panel öncesi"]].map(([k, l]) => `<button class="${c.phase === k ? "is-active" : ""}" data-cfg-phase="${k}">${l}</button>`).join("")}</div></div>` : `<label class="chk pp-row"><input type="checkbox" data-cfg-others${c.showOtherReviewerFindings ? " checked" : ""}> <span>showOtherReviewerFindings · Diğerleri sekmesi (salt okunur)</span></label>`}
      </div></div>`;
    Pop.open(anchor, html, { align: "end", cls: "pop-phase", onMount: (el) => {
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.cfgMode) { S.config.reviewMode = b.dataset.cfgMode; this.configChanged(anchor); }
        if (b.dataset.cfgPhase) { S.config.phase = +b.dataset.cfgPhase; this.configChanged(anchor); }
      });
      el.addEventListener("change", (e) => { if (e.target.hasAttribute("data-cfg-others")) { S.config.showOtherReviewerFindings = e.target.checked; this.configChanged(anchor); } });
    } });
  },
  configChanged() {
    Store.changed();
    if (Q.othersMode() === "hidden" && UI.rightTab === "others") UI.rightTab = "findings";
    if (UI.selected && UI.selected.startsWith("o:") && !["evaluate", "readonly"].includes(Q.othersMode())) UI.selected = null;
    Pop.close();
    this.renderTopbar(); Right.render(); Viewer.refreshOverlays();
    const m = Q.othersMode();
    toast(m === "locked" ? "Aşama 1: Diğer panelistlerin tespitleri kilitli" : m === "evaluate" ? "Aşama 2: Diğer panelistlerin tespitleri değerlendirilebilir" : m === "readonly" ? "Komisyon: Diğerleri salt okunur" : "Komisyon: Diğerleri sekmesi gizli", { icon: "sliders" });
    setTimeout(() => this.openPhase($("#topbar [data-act=phase]")), 10);
  },
  openNotif(anchor) {
    UI.notifRead = true;
    const html = `<div class="pp"><div class="pp-h">Bildirimler</div>${D.NOTIFICATIONS.map((n) => `<div class="notif${n.unread ? " unread" : ""}"><div>${esc(n.text)}</div><span>${esc(n.time)}</span></div>`).join("")}</div>`;
    Pop.open(anchor, html, { align: "end", cls: "pop-notif", onClose: () => this.renderTopbar() });
  },
  openUser(anchor) {
    const me = D.REVIEWERS.me;
    const html = `<div class="pp"><div class="user-h"><span class="avatar lg">${me.initials}</span><div><b>${esc(me.name)}</b><div class="muted">${esc(me.role)} · Sosyal Bilgiler</div></div></div>
      <div class="pp-row"><span>Tema</span><div class="seg seg-sm">${[["light", "Açık", "sun"], ["dark", "Koyu", "moon"]].map(([k, l, ic]) => `<button class="${S.prefs.theme === k ? "is-active" : ""}" data-theme-set="${k}">${icon(ic)}${l}</button>`).join("")}</div></div>
      <div class="pp-row"><span>Sayfa tonu</span><div class="seg seg-sm">${[["white", "Beyaz"], ["sepia", "Sepya"], ["night", "Gece"]].map(([k, l]) => `<button class="${S.prefs.paper === k ? "is-active" : ""}" data-paper-set="${k}">${l}</button>`).join("")}</div></div>
      <div class="menu-sep"></div>
      <a class="menu-item" href="publisher.html">${icon("upload")}Yayınevi paneli (prototip)</a>
      <button class="menu-item" data-act="shortcuts">${icon("keyboard")}Klavye kısayolları <kbd>?</kbd></button>
      <button class="menu-item" data-act="reset">${icon("undo")}Demo verisini sıfırla</button>
      <p class="muted small">Prototip: veriler yalnızca bu tarayıcıda saklanır.</p></div>`;
    Pop.open(anchor, html, { align: "end", cls: "pop-user", onMount: (el) => el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.themeSet) { S.prefs.theme = b.dataset.themeSet; this.applyTheme(); Store.prefsChanged(); Pop.close(); this.openUser(anchor); }
      if (b.dataset.paperSet) { S.prefs.paper = b.dataset.paperSet; this.applyTheme(); Store.prefsChanged(); Pop.close(); this.openUser(anchor); }
      if (b.dataset.act === "shortcuts") { Pop.close(); this.showShortcuts(anchor); }
      if (b.dataset.act === "reset") { Pop.close(); this.resetDemo(); }
    }) });
  },
  resetDemo() {
    const snap = localStorage.getItem(LS_KEY);
    Store.reset(true);
    Doc.setBook("main"); Pub.reset();
    this.applyTheme(); this.computeLayout(); this.applyLayout();
    UI.fitMode = "width";
    this.onDocChange(42, true);
    toast("Demo verisi sıfırlandı", { icon: "undo", action: "Geri al", onAction: () => { try { localStorage.setItem(LS_KEY, snap); location.reload(); } catch (e) {} } });
  },
  showShortcuts(anchor) {
    const rows = [["← / →", "Önceki / sonraki sayfa"], ["+ / −", "Yakınlaştır / uzaklaştır"], ["0", "Genişliğe sığdır"], ["P", "Sayfaya sığdır"], ["V / R", "Metin / alan seçimi aracı"], ["T", "TYMM katmanı"], ["I", "Sayfayı incelendi işaretle"], ["J / K", "Sonraki / önceki kart"], ["[ / ]", "Sol / sağ panel"], ["F", "Odak modu"], ["Ctrl + K  veya  /", "Arama"], ["Ctrl + Enter", "Formu kaydet"], ["Esc", "Kapat / geri"]];
    Pop.open(anchor || $("#topbar .avatar"), `<div class="pp"><div class="pp-h">Klavye kısayolları</div><table class="keys">${rows.map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join("")}</table><p class="muted small">Tablette iki parmakla yakınlaştırabilir, uzun basarak metin seçebilirsiniz.</p></div>`, { align: "end", cls: "pop-keys" });
  },

  /* ================================================================ PDF araç çubuğu */
  renderToolbar() {
    const n = UI.page, rev = Q.reviewed(n);
    const tg = (act, ic, label, on, extra) => `<button class="tbtn${on ? " is-on" : ""}${extra || ""}" data-act="${act}" title="${label}" aria-label="${label}"${on != null ? ` aria-pressed="${!!on}"` : ""}>${icon(ic)}</button>`;
    $("#pdfToolbar").innerHTML = `
      <div class="tg tg-nav">
        <button class="tbtn tb-leftbtn" data-act="left-panel" title="Kitap navigasyonu" aria-label="Kitap navigasyonu">${icon("panelLeft")}</button>
        ${tg("prev", "left", "Önceki sayfa (←)")}
        <div class="page-input"><input id="pageInput" inputmode="numeric" value="${n}" aria-label="Sayfa numarası"><span>/ ${Doc.pageCount}</span></div>
        ${tg("next", "right", "Sonraki sayfa (→)")}
      </div>
      <div class="tg tg-zoom">
        ${tg("zoom-out", "zoomOut", "Uzaklaştır (−)")}
        <button class="tbtn zoom-val" data-act="zoom-menu" aria-haspopup="menu" title="Yakınlaştırma">${Math.round(UI.zoom * 100)}%</button>
        ${tg("zoom-in", "zoomIn", "Yakınlaştır (+)")}
        <span class="tg-fit">${tg("fit-width", "fitWidth", "Genişliğe sığdır (0)", UI.fitMode === "width")}${tg("fit-page", "fitPage", "Sayfaya sığdır (P)", UI.fitMode === "page")}</span>
      </div>
      <div class="tg tg-tools seg" role="radiogroup" aria-label="Seçim aracı">
        <button class="${UI.tool === "text" ? "is-active" : ""}" data-act="tool-text" role="radio" aria-checked="${UI.tool === "text"}" title="Metin seçimi (V)">${icon("textCursor")}<span>Metin</span></button>
        <button class="${UI.tool === "region" ? "is-active" : ""}" data-act="tool-region" role="radio" aria-checked="${UI.tool === "region"}" title="Alan / bölge seçimi (R)">${icon("region")}<span>Alan</span></button>
      </div>
      <div class="tg tg-layer">
        <button class="tbtn tymm-toggle${S.prefs.tymmLayer ? " is-on" : ""}" data-act="tymm-layer" aria-pressed="${S.prefs.tymmLayer}" title="TYMM Katmanı (T)">${icon("target")}<span>TYMM Katmanı</span><i class="sw" aria-hidden="true"></i></button>
        ${tg("layers", "layers", "Katmanlar")}
        ${Doc.type === "mock" ? tg("prog-bar", "cap", S.prefs.progBarHidden ? "Program şeridini göster" : "Program şeridini gizle", !S.prefs.progBarHidden, " tb-prog") : ""}
      </div>
      <div class="tg-spacer"></div>
      <div class="tg tg-end">
        <button class="tbtn review-btn${rev ? " is-on" : ""}" data-act="toggle-reviewed" aria-pressed="${rev}" title="Sayfayı incelendi olarak işaretle (I)">${icon(rev ? "pageCheck" : "paper")}<span>${rev ? "İncelendi" : "İncelendi işaretle"}</span></button>
        ${tg("focus", "focus", UI.focus ? "Odak modundan çık (F)" : "Odak modu (F)", UI.focus, " tb-focus")}
        ${document.fullscreenEnabled || document.webkitFullscreenEnabled ? tg("fullscreen", "maximize", "Tam ekran", !!(document.fullscreenElement || document.webkitFullscreenElement), " tb-fs") : ""}
        ${tg("more", "more", "Diğer")}
      </div>`;
  },
  bindToolbar() {
    const tb = $("#pdfToolbar");
    tb.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const a = b.dataset.act;
      switch (a) {
        case "left-panel": return this.toggleLeft();
        case "prev": return Viewer.goTo(UI.page - 1);
        case "next": return Viewer.goTo(UI.page + 1);
        case "zoom-in": return Viewer.zoomStep(1);
        case "zoom-out": return Viewer.zoomStep(-1);
        case "zoom-menu": return this.openZoomMenu(b);
        case "fit-width": return Viewer.fit("width");
        case "fit-page": return Viewer.fit("page");
        case "tool-text": return this.setTool("text");
        case "tool-region": return this.setTool("region");
        case "tymm-layer": return this.toggleTymmLayer();
        case "layers": return this.openLayers(b);
        case "prog-bar": return this.setProgBar(!!S.prefs.progBarHidden);
        case "toggle-reviewed": return this.toggleReviewed(UI.page);
        case "focus": return this.toggleFocus();
        case "fullscreen": return this.toggleFullscreen();
        case "more": return this.openMore(b);
      }
    });
    tb.addEventListener("keydown", (e) => {
      if (e.target.id === "pageInput" && e.key === "Enter") { e.preventDefault(); Viewer.goTo(+e.target.value); e.target.blur(); }
    });
    tb.addEventListener("focusin", (e) => { if (e.target.id === "pageInput") e.target.select(); });
    tb.addEventListener("change", (e) => { if (e.target.id === "pageInput") Viewer.goTo(+e.target.value); });
    document.addEventListener("fullscreenchange", () => this.renderToolbar());
  },
  setTool(t) {
    UI.tool = t;
    $("#viewer").classList.toggle("tool-region", t === "region");
    Viewer.hideSelbar();
    window.getSelection().removeAllRanges();
    this.renderToolbar();
    if (t === "region") toast("Alan seçimi: PDF üzerinde sürükleyerek bölge işaretleyin", { icon: "region" });
  },
  toggleTymmLayer(force) {
    S.prefs.tymmLayer = force != null ? force : !S.prefs.tymmLayer;
    Store.prefsChanged();
    this.renderToolbar(); Viewer.refreshOverlays();
  },
  toggleFullscreen() {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  },
  openZoomMenu(anchor) {
    const opts = [50, 75, 100, 125, 150, 200, 300];
    Pop.open(anchor, `<div class="menu">${opts.map((z) => `<button class="menu-item${Math.round(UI.zoom * 100) === z ? " is-active" : ""}" data-z="${z}">${z}%</button>`).join("")}<div class="menu-sep"></div><button class="menu-item" data-fit="width">${icon("fitWidth")}Genişliğe sığdır</button><button class="menu-item" data-fit="page">${icon("fitPage")}Sayfaya sığdır</button></div>`, { onMount: (el) => el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      Pop.close();
      if (b.dataset.z) Viewer.setZoom(+b.dataset.z / 100);
      if (b.dataset.fit) Viewer.fit(b.dataset.fit);
    }) });
  },
  openLayers(anchor) {
    const L = S.prefs.layers, om = Q.othersMode();
    const html = `<div class="menu menu-layers"><div class="pp-h">PDF katmanları</div>
      <label class="menu-item chk"><input type="checkbox" data-layer="findings"${L.findings ? " checked" : ""}><span class="lg-mk mk-human">1</span>Tespitlerim</label>
      <label class="menu-item chk"><input type="checkbox" data-layer="yazdis"${L.yazdis ? " checked" : ""}><span class="lg-mk mk-ai"><i>YZ</i>1</span>YAZDİS önerileri (bekleyen)</label>
      <label class="menu-item chk"><input type="checkbox" data-layer="tymm"${S.prefs.tymmLayer ? " checked" : ""}><span class="lg-mk mk-tymm">D1</span>TYMM eşleşmeleri</label>
      ${om === "evaluate" || om === "readonly" ? `<div class="muted small pad">Diğer panelist işaretçileri “Diğerleri” sekmesi açıkken gösterilir.</div>` : ""}</div>`;
    Pop.open(anchor, html, { onMount: (el) => el.addEventListener("change", (e) => {
      const k = e.target.dataset.layer;
      if (k === "tymm") this.toggleTymmLayer(e.target.checked);
      else { S.prefs.layers[k] = e.target.checked; Store.prefsChanged(); Viewer.refreshOverlays(); }
    }) });
  },
  openMore(anchor) {
    const html = `<div class="menu">
      <div class="more-only"><button class="menu-item" data-m="fit-width">${icon("fitWidth")}Genişliğe sığdır</button><button class="menu-item" data-m="fit-page">${icon("fitPage")}Sayfaya sığdır</button>
      <button class="menu-item" data-m="tool-region">${icon("region")}${UI.tool === "region" ? "Metin seçimine dön" : "Alan seçimi"}</button><button class="menu-item" data-m="tymm">${icon("target")}TYMM katmanı ${S.prefs.tymmLayer ? "· açık" : "· kapalı"}</button><button class="menu-item" data-m="layers">${icon("layers")}Katmanlar…</button>
      <button class="menu-item" data-m="focus">${icon("focus")}Odak modu</button><div class="menu-sep"></div></div>
      <div class="pp-row pad"><span>Sayfa tonu</span><div class="seg seg-sm">${[["white", "Beyaz"], ["sepia", "Sepya"], ["night", "Gece"]].map(([k, l]) => `<button class="${S.prefs.paper === k ? "is-active" : ""}" data-paper-set="${k}">${l}</button>`).join("")}</div></div>
      <div class="menu-sep"></div>
      <button class="menu-item" data-m="open-pdf">${icon("upload")}Yerel PDF aç (deneme)…</button>
      <a class="menu-item" href="publisher.html">${icon("link")}Yayınevi eşleştirme paneli</a>
      ${Doc.isDemo ? "" : `<button class="menu-item" data-m="demo">${icon("book")}Demo kitaba dön</button>`}
      <button class="menu-item" data-m="keys">${icon("keyboard")}Klavye kısayolları</button></div>`;
    Pop.open(anchor, html, { align: "end", onMount: (el) => el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.paperSet) { S.prefs.paper = b.dataset.paperSet; this.applyTheme(); Store.prefsChanged(); Pop.close(); return; }
      const m = b.dataset.m; if (!m) return;
      Pop.close();
      if (m === "fit-width") Viewer.fit("width");
      if (m === "fit-page") Viewer.fit("page");
      if (m === "tool-region") this.setTool(UI.tool === "region" ? "text" : "region");
      if (m === "tymm") this.toggleTymmLayer();
      if (m === "layers") this.openLayers(anchor);
      if (m === "focus") this.toggleFocus();
      if (m === "open-pdf") $("#pdfFile").click();
      if (m === "demo") this.backToDemo();
      if (m === "keys") this.showShortcuts(anchor);
    }) });
  },
  backToDemo() { this.openBook("main"); },
  gotoMainPage(n) { if (!n) return; if (Doc.isDemo) Viewer.goTo(n); else this.openBook("main", n); },

  /* ================================================================ belge sekmeleri ve program bağlamı şeridi */
  renderDocTabs() {
    const el = $("#docTabs"); if (!el) return;
    const ic = { main: "book", guide: "guide", workbook: "workbook" };
    const sh = { main: "Ders Kitabı", guide: "Kılavuz", workbook: "Çalışma K." };
    let html = ["main", "guide", "workbook"].map((k) => {
      const b = D.BOOKS[k], on = Doc.type === "mock" && Doc.bookKey === k;
      return `<button role="tab" aria-selected="${on}" class="dt${on ? " is-active" : ""}" data-book="${k}" title="${esc(b.title)}">${icon(ic[k])}<span class="dt-long">${b.short}</span><span class="dt-short">${sh[k]}</span><i>${b.pageCount} s.</i></button>`;
    }).join("");
    if (Doc.type === "pdf") html += `<button role="tab" aria-selected="true" class="dt is-active" title="${esc(Doc.title)}">${icon("file")}<span>${esc(Doc.title)}</span><i>${Doc.pageCount} s.</i></button>`;
    if (Doc.type === "mock" && Doc.bookKey !== "main") html += `<span class="dt-note">${icon("info")}<span>İlişkili kitap · tespitler bu kitaba kaydedilir</span></span>`;
    el.innerHTML = html;
  },
  renderProgBar() {
    const el = $("#progBar"); if (!el) return;
    if (Doc.type !== "mock" || !Pub.data || S.prefs.progBarHidden) { el.hidden = true; return; }
    el.hidden = false;
    const n = UI.page;
    let html = `<span class="pb-lbl" title="Yayınevinin bu sayfa için beyan ettiği öğretim programı eşleştirmeleri">${icon("cap")}<span>Program</span></span>`;
    if (Doc.bookKey === "main") {
      const pg = Pub.page(n);
      const kind = (Doc.book.pages[n] || {}).kind;
      if (!pg.outcomes.length) html += `<span class="pb-empty${kind === "content" ? " warn" : ""}">${kind === "content" ? `${icon("alert")}Yayınevi bu sayfayı bir öğrenme çıktısıyla eşleştirmemiş` : "Öğrenme çıktısı eşleştirmesi yok"}</span>`;
      pg.outcomes.forEach((l) => {
        const o = Pub.outcome(l.code); if (!o) return;
        html += `<button class="pb-oc" data-outcome="${l.code}" title="${esc(l.code + " " + o.title)}"><b>${l.code}</b><span class="pb-title">${esc(o.title)}</span><span class="pb-comps" aria-label="Süreç bileşenleri">${l.comps.map((k) => `<i title="${esc((o.comps.find((c) => c.k === k) || {}).text || "")}">${k}</i>`).join("")}</span></button>`;
      });
      if (pg.tymm.length) html += `<span class="pb-vals">${pg.tymm.map((c) => `<button class="tymm-code" data-tcomp-open="${c}" title="${esc(codeLabel(c))} (yayınevi beyanı)">${c}</button>`).join("")}</span>`;
      const g = [], w = [];
      pg.outcomes.forEach((l) => { const o = Pub.outcome(l.code); if (o && o.guidePages) g.push(o.guidePages[0]); if (o && o.workbookPages) w.push(o.workbookPages[0]); });
      const med = Pub.mediaForPage(n);
      if (g.length || w.length || med.length) {
        html += `<span class="pb-links">`;
        if (g.length) html += `<button class="pb-link" data-book-open="guide:${g[0]}" title="Öğretmen Kılavuz Kitabı'nda aç">${icon("guide")}Kılavuz S.${g[0]}</button>`;
        if (w.length) html += `<button class="pb-link" data-book-open="workbook:${w[0]}" title="Öğrenci Çalışma Kitabı'nda aç">${icon("workbook")}Çalışma K. S.${w[0]}</button>`;
        if (med.length) html += `<button class="pb-link" data-media-open title="${esc(med.map((m) => m.title).join(", "))}">${icon("media")}${med.length} medya</button>`;
        html += `</span>`;
      }
      if (pg.outcomes.length) html += `<button class="pb-detail" data-outcome="${pg.outcomes[0].code}">Detay${icon("right")}</button>`;
    } else {
      const p = Doc.book.pages[n]; const o = p && p.outcome ? Pub.outcome(p.outcome) : null;
      if (o) {
        const bp = Pub.outcomePages(o.code);
        html += `<button class="pb-oc" data-outcome="${o.code}" title="${esc(o.title)}"><b>${o.code}</b><span class="pb-title">${esc(o.title)}</span></button><span class="pb-links"><button class="pb-link" data-book-open="main:${bp[0] || ""}">${icon("book")}Ders kitabı ${D.rangeLabel(bp)}</button></span><button class="pb-detail" data-outcome="${o.code}">Detay${icon("right")}</button>`;
      } else html += `<span class="pb-empty">Bu sayfa bir öğrenme çıktısına bağlı değil.</span>`;
    }
    el.innerHTML = `<div class="pb-inner">${html}</div><button class="pb-close" data-pb-close title="Program şeridini kapat (araç çubuğundaki Program düğmesiyle yeniden açılır)" aria-label="Program şeridini kapat">${icon("x")}</button>`;
  },
  // Program içeriğine tıklanınca şerit yeniden görünür (× ile kapatma geçicidir)
  showProgBar() {
    if (!S.prefs.progBarHidden) return;
    S.prefs.progBarHidden = false; Store.prefsChanged();
    this.renderProgBar(); this.renderToolbar();
  },
  setProgBar(show) {
    S.prefs.progBarHidden = !show; Store.prefsChanged();
    this.renderProgBar(); this.renderToolbar();
    if (UI.view.type === "outcome" && !show) this.back();
    if (!show) toast("Program şeridi gizlendi", { icon: "cap", action: "Geri al", onAction: () => this.setProgBar(true) });
  },
  bindDocBars() {
    $("#docTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-book]"); if (b) this.openBook(b.dataset.book); });
    $("#progBar").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const d = b.dataset;
      if (b.hasAttribute("data-pb-close")) return this.setProgBar(false);
      if (d.outcome) return this.openOutcome(d.outcome);
      if (d.tcompOpen) { if (!Doc.isDemo) this.openBook("main"); return this.openTymmComp(d.tcompOpen, null); }
      if (d.bookOpen) { const [k, p] = d.bookOpen.split(":"); return this.openBook(k, +p || null); }
      if (b.hasAttribute("data-media-open")) { UI.leftTab = "media"; if (UI.layout === "mobile") UI.drawer = true; else if (!this.leftExpanded()) UI.flyout = true; this.applyLayout(); Left.render(); }
    });
  },

  /* ================================================================ öğrenme çıktısı */
  openOutcome(code, opts) {
    if (!Pub.outcome(code)) return;
    this.showProgBar();
    UI.expandedOutcomes = UI.expandedOutcomes || new Set();
    UI.expandedOutcomes.add(code);
    const view = { type: "outcome", code };
    if (UI.view.type === "outcome") { UI.view = view; this.revealRight(); Right.render(); }
    else this.openView(view);
    if (UI.leftTab === "program") Left.renderPanel();
    if (opts && opts.fromLeft) this.afterLeftNav(true);
  },
  outcomeFinding(code, k, kind) {
    const o = Pub.outcome(code); if (!o) return;
    if (!Doc.isDemo) this.openBook("main");
    const u = Q.unitById(o.unitId);
    const ref = { code, comp: k || "" };
    const compTxt = k ? `${code} (${k})` : code;
    if (kind === "gap") {
      return this.startFinding({ scope: "unit", unitId: o.unitId, page: u ? u.start : UI.page, main: D.TYMM_MAIN, sub: D.subLabel("1.4.1"), outcomeRef: ref,
        text: `${compTxt} süreç bileşenine (“${(o.comps.find((c) => c.k === k) || {}).text || ""}”) yönelik ders kitabında içerik bulunmamaktadır; yayınevi bu bileşeni hiçbir sayfayla eşleştirmemiştir.` });
    }
    this.startFinding({ scope: "page", page: UI.page, main: D.TYMM_MAIN, sub: D.subLabel("1.4.1"), outcomeRef: ref,
      text: `S.${UI.page}, yayınevi tarafından ${compTxt} ile eşleştirilmiş ancak sayfa içeriği bu ${k ? "süreç bileşenini" : "öğrenme çıktısını"} yeterince karşılamamaktadır.` });
  },
  openBook(key, page) {
    if (Doc.type === "mock" && Doc.bookKey === key) { if (page) Viewer.goTo(page); return; }
    if (Doc.type === "mock") (S.bookPages = S.bookPages || {})[Doc.bookKey] = UI.page;
    Doc.setBook(key);
    const remembered = (S.bookPages || {})[key];
    this._quietDoc = false;
    this.onDocChange(page || remembered || (key === "main" ? 42 : 1));
  },

  /* ================================================================ sayfa değişimi */
  onPageChange: function () {
    if (Doc.type === "mock") (S.bookPages = S.bookPages || {})[Doc.bookKey] = UI.page;
    App.renderProgBar();
    const inp = $("#pageInput"); if (inp && document.activeElement !== inp) inp.value = UI.page;
    const rb = $("#pdfToolbar .review-btn");
    if (rb) { const rev = Q.reviewed(UI.page); rb.classList.toggle("is-on", rev); rb.setAttribute("aria-pressed", rev); rb.innerHTML = `${icon(rev ? "pageCheck" : "paper")}<span>${rev ? "İncelendi" : "İncelendi işaretle"}</span>`; }
    App._pageChangeLazy();
  },
  _pageChangeLazy: debounce(function () {
    App.openTreeFor(UI.page);
    if (UI.leftTab === "content") { Left.renderPanel(); const cur = $("#leftPanel .pg-row.is-current"); if (cur && (App.leftExpanded() || UI.flyout || UI.drawer)) cur.scrollIntoView({ block: "nearest" }); }
    if (UI.view.type === "list" && UI.scope === "page") Right.render();
    else if (UI.view.type === "list") Right.render({ keepScroll: true });
  }, 160),
  openTreeFor(n) {
    const u = Doc.unitOf(n); if (!u) return;
    UI.expandedUnits.add(u.id);
    const s = Doc.sectionOf(n); if (s) UI.expandedSections.add(`${u.id}:${s.start}`);
  },
  toggleReviewed(n) {
    const m = S.pageStatus[Doc.id] = S.pageStatus[Doc.id] || {};
    if (m[n]) delete m[n]; else m[n] = "reviewed";
    Store.changed();
    Viewer.updateLabel(n); this.onPageChange(); Left.render();
    if (m[n]) toast(`Sayfa ${n} incelendi · ${Q.reviewedCount()} / ${Doc.pageCount}`, { icon: "pageCheck", action: "Sonraki sayfa", onAction: () => Viewer.goTo(n + 1) });
  },

  /* ================================================================ seçim / vurgulama */
  select(key, opts) {
    opts = opts || {};
    const r = Q.byKey(key); if (!r) return;
    UI.selected = key;
    if (r.kind === "t") { this.openTymm(r.item.id, opts); return; }
    const tab = r.kind === "f" ? "findings" : r.kind === "y" ? "yz" : "others";
    if (UI.view.type !== "list") { UI.viewStack = []; UI.view = { type: "list" }; }
    UI.rightTab = tab;
    if (!r.item.page) UI.scope = "book";
    if (!Right.matchesFilters(r.item, tab)) { UI.filters = {}; toast("Kaydı göstermek için filtreler temizlendi", { icon: "filter" }); }
    this.revealRight();
    if (opts.from !== "pdf") Viewer.goToItem(key);
    Viewer.refreshOverlays();
    Right.render({ scrollToSelected: true, keepScroll: true });
  },
  hover(key, on) {
    Viewer.setHover(key, on);
    $$("#rightInner .is-hover, #leftPanel .is-hover").forEach((e) => e.classList.remove("is-hover"));
    if (on && key) $$(`#rightInner [data-key="${key}"], #leftPanel [data-key="${key}"]`).forEach((e) => e.classList.add("is-hover"));
  },
  setRightTab(tab) {
    UI.rightTab = tab; UI.view = { type: "list" }; UI.viewStack = [];
    if (UI.selected && !UI.selected.startsWith(tab === "findings" ? "f:" : tab === "yz" ? "y:" : "o:")) UI.selected = null;
    if (UI.filters.status || UI.filters.source || UI.filters.reviewer) { delete UI.filters.status; delete UI.filters.source; delete UI.filters.reviewer; }
    this.revealRight();
    Right.render(); Viewer.refreshOverlays();
  },
  setScope(s) { UI.scope = s; Right.render(); },
  openView(view, opts) {
    if (!(opts && opts.replace) && UI.view.type !== "form") UI.viewStack.push(UI.view);
    UI.view = view;
    this.revealRight();
    Right.render();
  },
  back() {
    if (UI.view.type === "form") { UI.pending = null; Viewer.refreshOverlays(); }
    if (UI.view.type === "tymm") { UI.tymmEdit = null; }
    if (UI.view.type === "tnew") { UI.tnew = null; this.clearPending(); }
    UI.view = UI.viewStack.pop() || { type: "list" };
    if (UI.view.type === "form" && !S.draft) UI.view = { type: "list" };
    UI.formErrors = null;
    Right.render(); Left.renderPanel();
  },
  clearPending() { const p = UI.pending; UI.pending = null; UI.selDraft = null; if (p) Viewer.renderOverlay(p.page); },

  /* ================================================================ tespit akışı */
  startFinding(opts) {
    opts = opts || {};
    const ev = opts.evidence ? Object.assign({}, opts.evidence) : null;
    const page = ev && ev.page ? ev.page : opts.page != null ? opts.page : UI.page;
    const prev = S.draft;
    S.draft = {
      docId: Doc.id, mode: opts.mode || "new", findingId: opts.findingId || null, yazdisId: opts.yazdisId || null, origin: opts.origin || "human",
      page, scope: opts.scope || (ev && ev.boundingBox ? "selection" : "page"),
      unitId: opts.unitId || (Doc.unitOf(page) || {}).id || null, activityName: opts.activityName || (ev && ev.activityName) || "",
      main: opts.main || "", sub: opts.sub || "", tymmCode: opts.tymmCode || "", text: opts.text || "",
      evidence: ev, createdAt: nowIso(),
      outcomeRef: opts.outcomeRef || null,
      critMode: (opts.mode || "new") === "new" && !opts.main ? (S.prefs.critMode || "manual") : "manual",
      sugState: "idle", suggestion: null, sugPick: null, sugStale: false,
    };
    UI.combo = null;
    UI.pending = ev && ev.boundingBox ? Object.assign({ page }, ev) : null;
    UI.selected = null; UI.formErrors = null; UI.quoteOpen = false; UI.selDraft = null;
    UI.viewStack = UI.view.type === "list" ? [UI.view] : UI.viewStack;
    UI.view = { type: "form" };
    Store.changed();
    if (UI.layout !== "desktop") this.setSheet("full"); else this.revealRight();
    Right.render(); Viewer.refreshOverlays();
    if (prev && prev.mode === "new" && (prev.text || prev.main) && !opts.silent) toast("Önceki taslak yerine yeni tespit başlatıldı", { icon: "pencil", action: "Önceki taslağı geri getir", onAction: () => { S.draft = prev; Store.changed(); Right.render(); } });
    setTimeout(() => {
      if (isCoarse() || !S.draft) return;
      const first = $("#rightInner [data-combo-open=main]");
      if (S.draft.critMode !== "assist" && first && !S.draft.main) first.focus({ preventScroll: true });
      else { const ta = $("#rightInner [data-ftext]"); ta && ta.focus({ preventScroll: true }); }
    }, 50);
  },

  /* ---------- kriter seçimi: combobox ve YAZDİS kriter önerisi */
  setCritMode(m) {
    const d = S.draft; if (!d) return;
    d.critMode = m; S.prefs.critMode = m; Store.prefsChanged();
    UI.combo = null; UI.formErrors = null;
    if (m === "assist") { d.main = ""; d.sub = ""; d.sugState = "idle"; d.suggestion = null; }
    Store.changed();
    Right.render({ keepScroll: true });
    if (m === "assist" && (d.text || "").trim().length >= 6) this.runSuggestion(true);
    setTimeout(() => { const ta = $("#rightInner [data-ftext]"); ta && !isCoarse() && ta.focus({ preventScroll: true }); }, 30);
  },
  pickCriterion(kind, value) {
    const d = S.draft; if (!d) return;
    if (kind === "main") {
      const keepSub = d.sub && (D.SUBS.find((s) => s.label === d.sub) || {}).main === value;
      this.updateDraft({ main: value, sub: keepSub ? d.sub : "" });
      UI.combo = keepSub ? null : { kind: "sub", q: "", active: -1, all: false };
    } else {
      const s = D.SUBS.find((x) => x.label === value);
      this.updateDraft({ main: s.main, sub: value });
      UI.combo = null;
    }
    if (d.critMode === "assist" && d.sugState !== "edit") d.sugState = "edit";
    Right.renderCritBlock();
    if (!UI.combo) { const f = $(`#critBlock [data-combo-open="${kind}"]`); f && !isCoarse() && f.focus({ preventScroll: true }); }
  },
  scheduleSuggestion: debounce(function () { App.runSuggestion(false); }, 750),
  runSuggestion(force) {
    const d = S.draft; if (!d || d.critMode !== "assist") return;
    const text = (d.text || "").trim();
    if (!force && (d.sugState === "accepted" || d.sugState === "edit")) {
      if (d.suggestion && text !== d.sugText && !d.sugStale) { d.sugStale = true; Right.renderCritBlock(false); }
      return;
    }
    if (text.length < 6) { d.sugState = "idle"; Right.renderCritBlock(false); return; }
    d.sugState = "analyzing"; d.sugStale = false; UI.combo = null;
    Right.renderCritBlock(false);
    const draft = d;
    setTimeout(() => {
      if (S.draft !== draft || draft.critMode !== "assist") return;
      let sg = D.suggestCriteria(draft.text);
      if (!sg && draft.evidence && draft.evidence.selectedText) { sg = D.suggestCriteria(draft.evidence.selectedText); if (sg) { sg.confidence = Math.max(0.4, +(sg.confidence - 0.25).toFixed(2)); sg.reason = "Yazdığınız metinde belirgin bir ipucu yok; öneri seçilen alandaki ifadelere dayanıyor. " + sg.reason; } }
      draft.suggestion = sg; draft.sugText = text; draft.sugPick = null;
      draft.main = ""; draft.sub = "";
      draft.sugState = sg ? "shown" : "none";
      Store.changed();
      if (UI.view.type === "form") { Right.renderCritBlock(false); const c = $("#critBlock .sug-card, #critBlock .sug-wait"); c && c.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    }, 650);
  },
  suggestionAccept() {
    const d = S.draft; if (!d || !d.suggestion) return;
    d.main = d.suggestion.main; d.sub = d.suggestion.sub; d.sugState = "accepted"; d.sugPick = "top";
    if (D.TYMM_MAIN === d.main && !d.tymmCode) d.tymmCode = "";
    UI.formErrors = null; Store.changed();
    Right.renderCritBlock();
  },
  suggestionEdit() {
    const d = S.draft; if (!d) return;
    if (!d.main && d.suggestion) { d.main = d.suggestion.main; d.sub = d.suggestion.sub; }
    d.sugState = "edit"; UI.formErrors = null;
    UI.combo = { kind: "sub", q: "", active: -1, all: false };
    Store.changed(); Right.renderCritBlock();
  },
  suggestionAlt(i) {
    const d = S.draft; if (!d || !d.suggestion) return;
    const a = d.suggestion.alts[i]; if (!a) return;
    d.main = a.main; d.sub = a.sub; d.sugState = "accepted"; d.sugPick = "alt";
    UI.formErrors = null; Store.changed(); Right.renderCritBlock();
  },
  suggestionUseText() {
    const d = S.draft; if (!d || !d.suggestion) return;
    const prev = d.text;
    d.text = d.suggestion.statement; d.sugText = d.text.trim();
    Store.changed();
    const ta = $("#rightInner [data-ftext]"); if (ta) { ta.value = d.text; autosize(ta); }
    const c = $("#rightInner [data-fcount]"); if (c) c.textContent = d.text.length + " karakter";
    toast("Önerilen ifade tespit metnine aktarıldı", { icon: "pencil", action: "Geri al", onAction: () => { d.text = prev; Store.changed(); Right.render({ keepScroll: true }); } });
  },
  updateDraft(patch, rerender) {
    if (!S.draft) return;
    Object.assign(S.draft, patch);
    if (patch.scope === "unit" && !S.draft.unitId) S.draft.unitId = (Doc.unitOf(UI.page) || Doc.units[1] || {}).id;
    if (UI.formErrors) Object.keys(patch).forEach((k) => { if (UI.formErrors[k]) UI.formErrors[k] = null; });
    Store.changed();
    if (rerender) Right.render({ keepScroll: true });
  },
  saveDraft() {
    const d = S.draft; if (!d) return;
    const err = {};
    if (!d.main) err.main = d.critMode === "assist" && d.sugState === "shown" ? "YAZDİS önerisini onaylayın veya düzeltin." : "Ana kriter seçiniz.";
    if (!d.sub && d.main) err.sub = "Alt kriter seçiniz.";
    if (!d.sub && !d.main && d.critMode !== "assist") err.sub = "Alt kriter seçiniz.";
    if (!d.text || d.text.trim().length < 3) err.text = "Tespit metnini yazınız.";
    if (Object.keys(err).length) {
      UI.formErrors = err; UI.combo = null;
      if (d.critMode === "assist" && !d.main && d.sugState === "idle" && d.text && d.text.trim().length >= 3) d.sugState = "edit";
      Right.render({ keepScroll: true }); const el = $("#rightInner .has-err, #rightInner .sug-card .err, #rightInner .crit-block .err"); el && el.scrollIntoView({ block: "center", behavior: "smooth" }); return;
    }
    const criteriaSource = d.critMode === "assist" && d.suggestion ? (d.sub === d.suggestion.sub ? "yazdis-accepted" : "yazdis-edited") : "manual";
    const criteriaSuggestion = d.critMode === "assist" && d.suggestion ? { main: d.suggestion.main, sub: d.suggestion.sub, confidence: d.suggestion.confidence, pick: d.sugPick || "edited", inputText: d.sugText || "" } : null;
    const scope = d.scope;
    let evidence = d.evidence ? Object.assign({ documentId: Doc.id, pageNumber: d.page }, d.evidence) : null;
    if (evidence) delete evidence.page;
    if (scope === "page" && evidence) { evidence = Object.assign({}, evidence, { anchor: "page" }); delete evidence.rects; delete evidence.boundingBox; }
    if (scope === "unit" || scope === "book") evidence = evidence ? Object.assign({}, evidence, { anchor: "none" }) : null;
    const page = scope === "unit" || scope === "book" ? null : d.page;
    const fields = { page, scope, unitId: scope === "unit" ? d.unitId : (page ? (Doc.unitOf(page) || {}).id : null), activityName: scope === "activity" ? d.activityName : (d.activityName || ""), main: d.main, sub: d.sub, tymmCode: d.tymmCode || "", outcomeRef: d.outcomeRef || null, text: d.text.trim(), evidence, updatedAt: nowIso() };
    if (d.mode !== "edit") Object.assign(fields, { criteriaSource, criteriaSuggestion });
    let f;
    if (d.mode === "edit") {
      f = S.findings.find((x) => x.id === d.findingId);
      Object.assign(f, fields);
      GeoCache.delete(f.id);
    } else {
      f = Object.assign({ id: uid("f"), no: Q.nextFindingNo(), docId: Doc.id, reviewerId: "me", origin: d.origin, yazdisId: d.yazdisId || null, createdAt: nowIso() }, fields);
      S.findings.push(f);
      if (d.yazdisId) S.yazdisDecisions[d.yazdisId] = { status: "edited", findingId: f.id, at: nowIso(), by: "me" };
    }
    S.draft = null; UI.pending = null; UI.formErrors = null;
    UI.view = { type: "list" }; UI.viewStack = []; UI.rightTab = "findings"; UI.selected = "f:" + f.id;
    if (!f.page) UI.scope = "book";
    else if (f.page !== UI.page && UI.scope === "page") Viewer.goTo(f.page);
    Store.changed();
    if (UI.layout !== "desktop") this.setSheet("half");
    Right.render({ scrollToSelected: true }); Viewer.refreshOverlays(); Left.render();
    toast(d.mode === "edit" ? `Tespit ${f.no} güncellendi` : d.yazdisId ? `YAZDİS önerisi düzenlenerek onaylandı → Tespit ${f.no}` : `Tespit ${f.no} kaydedildi`, { icon: "check", kind: "ok" });
    setTimeout(() => Viewer.pulse("f:" + f.id), 150);
  },
  discardDraft() {
    const snap = S.draft;
    S.draft = null; UI.pending = null; UI.formErrors = null;
    UI.view = { type: "list" }; UI.viewStack = [];
    Store.changed();
    if (UI.layout !== "desktop") this.setSheet("half");
    Right.render(); Viewer.refreshOverlays();
    if (snap && (snap.text || snap.main)) toast("Taslak silindi", { icon: "trash", action: "Geri al", onAction: () => { S.draft = snap; UI.view = { type: "form" }; UI.pending = snap.evidence && snap.evidence.boundingBox ? Object.assign({ page: snap.page }, snap.evidence) : null; Store.changed(); Right.render(); Viewer.refreshOverlays(); } });
  },
  editFinding(id) {
    const f = S.findings.find((x) => x.id === id); if (!f) return;
    const g = f.page ? Viewer.geomOf(f) : null;
    const ev = f.evidence ? Object.assign({ page: f.page }, f.evidence) : null;
    if (ev && g && !ev.boundingBox && f.scope !== "page") { ev.rects = g.rects; ev.boundingBox = g.bbox; }
    this.startFinding({ mode: "edit", findingId: id, origin: f.origin, yazdisId: f.yazdisId, evidence: ev, page: f.page || UI.page, scope: f.scope, unitId: f.unitId, activityName: f.activityName, main: f.main, sub: f.sub, tymmCode: f.tymmCode, text: f.text, silent: true });
  },
  deleteFinding(id, fromForm) {
    const f = S.findings.find((x) => x.id === id); if (!f) return;
    withUndo(`Tespit ${f.no} silindi`, () => {
      S.findings = S.findings.filter((x) => x.id !== id);
      if (f.yazdisId && S.yazdisDecisions[f.yazdisId] && S.yazdisDecisions[f.yazdisId].findingId === id) delete S.yazdisDecisions[f.yazdisId];
      if (fromForm) { S.draft = null; UI.pending = null; UI.view = { type: "list" }; }
      UI.selected = null;
    });
    Right.render({ keepScroll: true }); Viewer.refreshOverlays(); Left.render();
  },
  openNewMenu(anchor) {
    const u = Doc.unitOf(UI.page);
    Pop.open(anchor, `<div class="menu"><div class="pp-h">Seçim olmadan tespit</div><button class="menu-item" data-n="page">${icon("paper")}Sayfa ${UI.page} tespiti</button><button class="menu-item" data-n="activity">${icon("pencil")}Etkinlik tespiti</button>${u && u.no ? `<button class="menu-item" data-n="unit">${icon("book")}${esc(u.label)} kapsamında</button>` : ""}<button class="menu-item" data-n="book">${icon("book")}Kitap geneli</button><p class="muted small pad">Metin veya alan seçerek konuma bağlı tespit oluşturabilirsiniz.</p></div>`, { align: "end", onMount: (el) => el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-n]"); if (!b) return;
      Pop.close();
      this.startFinding({ scope: b.dataset.n, page: UI.page, unitId: u && u.id });
    }) });
  },
  openFilter(anchor) {
    const tab = UI.rightTab, f = UI.filters;
    const crit = D.CRITERIA.find((c) => c.name === f.main);
    const opt = (v, l, cur) => `<option value="${esc(v)}"${String(cur || "") === String(v) ? " selected" : ""}>${esc(l)}</option>`;
    const reviewers = Object.values(D.REVIEWERS).filter((r) => r.id !== "me");
    const html = `<div class="pp filter-pop"><div class="pp-h">Filtreler</div>
      <label class="stack">Ana kriter<select class="input" data-f="main">${opt("", "Tümü")}${D.CRITERIA.map((c) => opt(c.name, c.name, f.main)).join("")}</select></label>
      <label class="stack">Alt kriter<select class="input" data-f="sub"${crit ? "" : " disabled"}>${opt("", crit ? "Tümü" : "Önce ana kriter")}${crit ? crit.subs.map((s) => opt(s, s.length > 72 ? s.slice(0, 70) + "…" : s, f.sub)).join("") : ""}</select></label>
      <div class="two"><label class="stack">Ünite<select class="input" data-f="unit">${opt("", "Tümü")}${Doc.units.filter((u) => u.no > 0).map((u) => opt(u.id, u.short + " · " + u.title, f.unit)).join("")}</select></label>
      <label class="stack">Sayfa<input class="input" type="number" min="1" max="${Doc.pageCount}" data-f="page" value="${esc(f.page || "")}" placeholder="—"></label></div>
      ${tab === "findings" ? `<label class="stack">Kaynak<select class="input" data-f="source">${opt("", "Tümü")}${opt("human", "İnsan", f.source)}${opt("yazdis", "YAZDİS kökenli", f.source)}</select></label>` : ""}
      ${tab === "yz" ? `<label class="stack">Durum<select class="input" data-f="status">${opt("", "Tümü")}${opt("pending", "Bekleyen", f.status)}${opt("approved", "Onaylanan", f.status)}${opt("rejected", "Reddedilen", f.status)}</select></label>` : ""}
      ${tab === "others" ? `<label class="stack">İncelemeci<select class="input" data-f="reviewer">${opt("", "Tümü")}${reviewers.map((r) => opt(r.id, r.role + " · " + r.short, f.reviewer)).join("")}</select></label>${Q.othersMode() === "evaluate" ? `<label class="stack">Durum<select class="input" data-f="status">${opt("", "Tümü")}${opt("open", "Değerlendirilmedi", f.status)}${opt("agree", "Katılıyorum", f.status)}${opt("disagree", "Katılmıyorum", f.status)}</select></label>` : ""}` : ""}
      <div class="row-btns"><button class="btn-ghost sm" data-clear>Temizle</button><button class="btn sm push" data-done>Tamam</button></div></div>`;
    Pop.open(anchor, html, { cls: "pop-filter", onMount: (el) => {
      el.addEventListener("change", (e) => {
        const k = e.target.dataset.f; if (!k) return;
        const v = e.target.value;
        if (v) UI.filters[k] = v; else delete UI.filters[k];
        if (k === "main") delete UI.filters.sub;
        Right.render(); Pop.close(); this.openFilter($("#rightInner [data-act=filter]"));
      });
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-clear]")) { UI.filters = {}; Right.render(); Pop.close(); }
        if (e.target.closest("[data-done]")) Pop.close();
      });
    } });
  },

  /* ================================================================ YAZDİS kararları */
  yzEvidence(y) {
    const ev = Object.assign({ page: y.page }, y.evidence);
    const g = Viewer.geomOf(y);
    if (g) { ev.rects = g.rects; ev.boundingBox = g.bbox; }
    return ev;
  },
  yzApprove(id) {
    const y = S.yazdis.find((x) => x.id === id); if (!y) return;
    Viewer.ensureRendered(y.page);
    let f;
    withUndo(`YAZDİS önerisi onaylandı`, () => {
      const ev = this.yzEvidence(y); delete ev.page;
      f = { id: uid("f"), no: Q.nextFindingNo(), docId: Doc.id, reviewerId: "me", origin: "yazdis", yazdisId: id, page: y.page, scope: "selection", unitId: (Doc.unitOf(y.page) || {}).id, main: y.main, sub: y.sub, text: y.text, evidence: Object.assign({ documentId: Doc.id, pageNumber: y.page }, ev), createdAt: nowIso(), updatedAt: nowIso() };
      S.findings.push(f);
      S.yazdisDecisions[id] = { status: "approved", findingId: f.id, at: nowIso(), by: "me" };
    });
    Right.render({ keepScroll: true }); Viewer.refreshOverlays(); Left.render();
  },
  yzEdit(id) {
    const y = S.yazdis.find((x) => x.id === id); if (!y) return;
    Viewer.ensureRendered(y.page);
    this.startFinding({ mode: "yz", yazdisId: id, origin: "yazdis", evidence: this.yzEvidence(y), page: y.page, scope: "selection", main: y.main, sub: y.sub, text: y.text, silent: true });
  },
  yzReject(id, reason, note) {
    if (!reason) return;
    withUndo(`YAZDİS önerisi reddedildi · ${reason}`, () => {
      S.yazdisDecisions[id] = { status: "rejected", reason, note: reason === "Diğer" ? note : "", at: nowIso(), by: "me" };
    });
    UI.rejectOpen = null;
    if (UI.selected === "y:" + id) UI.selected = null;
    Right.render({ keepScroll: true }); Viewer.refreshOverlays(); Left.render();
  },
  yzUndo(id) {
    const d = S.yazdisDecisions[id]; if (!d) return;
    withUndo("YAZDİS kararı geri alındı", () => {
      if (d.findingId) S.findings = S.findings.filter((f) => f.id !== d.findingId);
      delete S.yazdisDecisions[id];
    });
    Right.render({ keepScroll: true }); Viewer.refreshOverlays(); Left.render();
  },

  /* ================================================================ diğer panelistler */
  agree(id, value, reason) {
    S.agreements[id] = { value, reason: reason || "", at: nowIso(), by: "me" };
    UI.disagreeOpen = null; UI.disDraft = null;
    Store.changed();
    Right.render({ keepScroll: true });
  },

  /* ================================================================ TYMM */
  openTymm(id, opts) {
    opts = opts || {};
    const t = S.tymm.find((x) => x.id === id); if (!t) return;
    UI.selected = "t:" + id; UI.tymmEdit = null;
    if (!S.prefs.tymmLayer) { this.toggleTymmLayer(true); toast("TYMM katmanı açıldı", { icon: "target" }); }
    if (S.tymmDraft && S.tymmDraft.id !== id) S.tymmDraft = null;
    UI.expandedTymm.add(t.code);
    if (UI.view.type === "tymm") UI.view = { type: "tymm", id };
    else this.openView({ type: "tymm", id });
    Right.render();
    if (UI.leftTab === "tymm") Left.renderPanel();
    if (opts.from !== "pdf") Viewer.goToItem("t:" + id);
    Viewer.refreshOverlays();
  },
  openTymmComp(code, unitId, opts) {
    opts = opts || {};
    const view = { type: "tcomp", code, unitId: unitId || null };
    if (UI.view.type === "tcomp" || opts.replace) { UI.view = view; this.revealRight(); Right.render(); }
    else this.openView(view);
    if (opts.fromLeft) { Left.renderPanel(); if (UI.layout !== "desktop") this.revealRight(); }
    else Left.renderPanel();
  },
  updateTymmDraft(patch) {
    const id = UI.view.id;
    if (!S.tymmDraft || S.tymmDraft.id !== id) S.tymmDraft = { id };
    Object.assign(S.tymmDraft, patch);
    Store.changed();
  },
  tymmSetStatus(id, status) {
    const t = S.tymm.find((x) => x.id === id); if (!t) return;
    const dr = S.tymmDraft && S.tymmDraft.id === id ? S.tymmDraft : {};
    const label = { verified: "İşlenmiş olarak doğrulandı", rejected: "Eşleşme değil olarak işaretlendi", insufficient: "Yetersiz / tartışmalı olarak işaretlendi" }[status];
    withUndo(`${t.code} · ${label}`, () => {
      if (dr.coverageType) t.coverageType = dr.coverageType;
      if (dr.code) t.code = dr.code;
      if (dr.activityName != null) t.activityName = dr.activityName;
      if (dr.note != null) t.note = dr.note;
      t.verificationStatus = status; t.verifiedBy = "me"; t.verifiedAt = nowIso();
      S.tymmDraft = null;
    });
    UI.tymmEdit = null;
    Right.render({ keepScroll: true }); Left.render(); Viewer.refreshOverlays();
  },
  tymmReopen(id) {
    const t = S.tymm.find((x) => x.id === id); if (!t) return;
    if (t.source === "YAZDİS") {
      withUndo(`${t.code} kararı geri alındı (YZ adayı)`, () => { t.verificationStatus = "candidate"; delete t.verifiedAt; delete t.verifiedBy; });
    } else { UI.tymmEdit = id; }
    Right.render({ keepScroll: true }); Left.render(); Viewer.refreshOverlays();
  },
  gapFinding(code, unitId, fromEvidence) {
    const c = Q.comp(code);
    const u = unitId ? Q.unitById(unitId) : null;
    const kind = c.type === "deger" ? "değerinin" : "eğiliminin";
    const text = fromEvidence
      ? `S.${fromEvidence.page}'deki “${fromEvidence.activityName || "içerik"}” ${c.code} ${c.name} ${kind} işlenmesi açısından yetersizdir.`
      : u ? `${u.no}. ünitede ${c.code} ${c.name} ${kind} işlenmesine yönelik yeterli içeriğe rastlanmamıştır.` : `Kitap genelinde ${c.code} ${c.name} ${kind} işlenmesine yönelik yeterli içeriğe rastlanmamıştır.`;
    if (fromEvidence) {
      Viewer.ensureRendered(fromEvidence.page);
      const g = Viewer.geomOf(fromEvidence);
      const ev = Object.assign({ page: fromEvidence.page }, fromEvidence.evidence, g ? { rects: g.rects, boundingBox: g.bbox } : {});
      this.startFinding({ scope: "activity", page: fromEvidence.page, activityName: fromEvidence.activityName, evidence: ev, main: D.TYMM_MAIN, sub: D.TYMM_SUB, tymmCode: code, text });
    } else {
      this.startFinding({ scope: u ? "unit" : "book", unitId: u ? u.id : null, page: u ? u.start : UI.page, main: D.TYMM_MAIN, sub: D.TYMM_SUB, tymmCode: code, text });
    }
  },
  startTymmFromSelection(sel) {
    UI.tnew = { evidence: Object.assign({}, sel), code: "", coverageType: "explicit", activityName: sel.activityName || "", note: "" };
    UI.pending = sel; UI.formErrors = null;
    if (UI.view.type !== "tnew") UI.viewStack.push(UI.view);
    UI.view = { type: "tnew" };
    if (UI.layout !== "desktop") this.setSheet("full"); else this.revealRight();
    Right.render(); Viewer.renderOverlay(sel.page);
    setTimeout(() => { const s = $("#rightInner [data-ncode]"); s && !isCoarse() && s.focus(); }, 40);
  },
  saveTymmNew() {
    const d = UI.tnew; if (!d) return;
    if (!d.code) { UI.formErrors = { code: "TYMM bileşeni seçiniz." }; Right.render({ keepScroll: true }); return; }
    const e = d.evidence;
    const t = { id: uid("t"), code: d.code, page: e.page, activityName: d.activityName, coverageType: d.coverageType, source: "human", verificationStatus: "verified", verifiedBy: "me", verifiedAt: nowIso(), note: d.note, docId: Doc.id, createdAt: nowIso(),
      evidence: { documentId: Doc.id, pageNumber: e.page, selectionType: e.selectionType, selectedText: e.selectedText, contextBefore: e.contextBefore, contextAfter: e.contextAfter, rects: e.rects, boundingBox: e.boundingBox } };
    S.tymm.push(t);
    UI.tnew = null; UI.pending = null; UI.formErrors = null;
    Store.changed();
    if (!S.prefs.tymmLayer) this.toggleTymmLayer(true);
    UI.viewStack = []; UI.view = { type: "list" };
    this.openTymm(t.id, { from: "pdf" });
    Left.render();
    toast(`${t.code} · ${Q.comp(t.code).name} kanıtı eklendi`, { icon: "check", kind: "ok" });
  },

  /* ================================================================ kısayollar */
  bindKeys() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#app").classList.add("search-open"); $("#q").focus(); $("#q").select(); return; }
      if (e.key === "Escape") {
        if (Pop.el) return Pop.close();
        if (UI.combo) { UI.combo = null; Right.renderCritBlock(false); return; }
        if (Search.isOpen()) return Search.close(true);
        if (Viewer.selbar.classList.contains("show")) { Viewer.hideSelbar(); window.getSelection().removeAllRanges(); this.clearPending(); return; }
        if (typing) { e.target.blur(); return; }
        if (UI.focus) return this.toggleFocus();
        if (UI.flyout || UI.drawer) { UI.flyout = false; UI.drawer = false; this.applyLayout(); Left.renderRail(); return; }
        if (UI.view.type !== "list") return this.back();
        if (UI.selected) { UI.selected = null; Right.render({ keepScroll: true }); Viewer.refreshOverlays(); }
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      const map = {
        ArrowLeft: () => Viewer.goTo(UI.page - 1), ArrowRight: () => Viewer.goTo(UI.page + 1),
        PageUp: () => Viewer.goTo(UI.page - 1), PageDown: () => Viewer.goTo(UI.page + 1),
        "+": () => Viewer.zoomStep(1), "=": () => Viewer.zoomStep(1), "-": () => Viewer.zoomStep(-1),
        "0": () => Viewer.fit("width"), p: () => Viewer.fit("page"),
        v: () => this.setTool("text"), r: () => this.setTool("region"), t: () => this.toggleTymmLayer(),
        i: () => this.toggleReviewed(UI.page), f: () => this.toggleFocus(),
        "[": () => this.toggleLeft(), "]": () => this.toggleRight(),
        "/": () => { $("#app").classList.add("search-open"); $("#q").focus(); },
        "?": () => this.showShortcuts(),
        j: () => this.stepCard(1), k: () => this.stepCard(-1),
      };
      const fn = map[k] || map[k.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
    });
  },
  stepCard(dir) {
    if (UI.view.type !== "list") return;
    const cards = $$("#rightInner .card");
    if (!cards.length) return;
    let i = cards.findIndex((c) => c.dataset.key === UI.selected);
    i = i < 0 ? (dir > 0 ? 0 : cards.length - 1) : clamp(i + dir, 0, cards.length - 1);
    this.select(cards[i].dataset.key, { from: "list" });
  },
};

/* ================================================================== Global arama */
const Search = {
  items: [], active: -1,
  isOpen() { return !$("#searchResults").hidden; },
  bind() {
    const q = $("#q"), box = $("#searchResults");
    q.addEventListener("input", debounce(() => this.run(q.value), 120));
    q.addEventListener("focus", () => { if (q.value.trim()) this.run(q.value); });
    q.addEventListener("keydown", (e) => {
      if (!this.isOpen()) return;
      if (e.key === "ArrowDown") { e.preventDefault(); this.move(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      if (e.key === "Enter") { e.preventDefault(); const it = this.items[this.active >= 0 ? this.active : 0]; if (it) this.pick(it); }
    });
    box.addEventListener("pointerdown", (e) => e.preventDefault());
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) this.pick(this.items[+b.dataset.i]); });
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#searchBox, #searchResults")) this.close(); });
  },
  close(blur) {
    $("#searchResults").hidden = true; $("#q").setAttribute("aria-expanded", "false");
    if (blur) { $("#q").blur(); $("#app").classList.remove("search-open"); }
  },
  move(d) {
    if (!this.items.length) return;
    this.active = (this.active + d + this.items.length) % this.items.length;
    $$("#searchResults .sr-item").forEach((el, i) => el.classList.toggle("is-active", i === this.active));
    const a = $("#searchResults .sr-item.is-active"); a && a.scrollIntoView({ block: "nearest" });
  },
  run(raw) {
    const q = raw.trim();
    const box = $("#searchResults");
    if (!q) { this.close(); return; }
    const lq = trLower(q);
    const groups = [];
    const mPage = q.match(/^(?:s\.?|sayfa)?\s*(\d{1,4})$/i);
    if (mPage) { const n = +mPage[1]; if (n >= 1 && n <= Doc.pageCount) groups.push({ title: "Sayfa", items: [{ type: "page", page: n, html: `<b>Sayfa ${n}'e git</b><span>${esc((Doc.unitOf(n) || {}).label || "")}</span>`, ic: "paper" }] }); }
    if (Doc.isDemo || Q.tymm().length) {
      const tm = D.TYMM_COMPONENTS.filter((c) => trLower(c.code).startsWith(lq) || trLower(c.name).includes(lq) || trLower(c.code + " " + c.name).includes(lq));
      if (tm.length) groups.push({ title: "TYMM", items: tm.map((c) => { const k = Q.tymmCounts(c.code); return { type: "tymm", code: c.code, ic: "target", html: `<b><span class="tymm-code">${c.code}</span> ${esc(c.name)}</b><span>${c.type === "deger" ? "Değer" : "Eğilim"} · ✓${k.verified} doğrulanmış · ◌${k.candidate} YZ adayı</span>` }; }) });
    }
    const ocr = [];
    D.OUTCOMES.forEach((o) => {
      if (trLower(o.code).includes(lq) || trLower(o.title).includes(lq)) ocr.push({ type: "outcome", code: o.code, ic: "cap", html: `<b>${o.code} · ${this.snip(o.title, lq)}</b><span>Öğrenme çıktısı · ${o.comps.length} süreç bileşeni · ders kitabı ${D.rangeLabel(Pub.outcomePages(o.code))}</span>` });
      else o.comps.forEach((c) => { if (trLower(c.text).includes(lq)) ocr.push({ type: "outcome", code: o.code, ic: "cap", html: `<b>${o.code} (${c.k})</b><span>Süreç bileşeni · ${this.snip(c.text, lq)}</span>` }); });
    });
    if (ocr.length) groups.push({ title: "Öğretim programı", items: ocr.slice(0, 5), more: ocr.length - 5 });
    const crit = [];
    D.CRITERIA.forEach((c) => {
      if (trLower(c.name).includes(lq)) crit.push({ type: "crit", main: c.name, ic: "filter", html: `<b>${esc(c.name)}</b><span>Ana kriter · ${Q.findings().filter((f) => f.main === c.name).length} tespit</span>` });
      c.subs.forEach((s) => { if (trLower(s).includes(lq)) crit.push({ type: "crit", main: c.name, sub: s, ic: "filter", html: `<b>${esc(s)}</b><span>Alt kriter · ${esc(c.name)} · ${Q.findings().filter((f) => f.sub === s).length} tespit</span>` }); });
    });
    if (crit.length) groups.push({ title: "Kriterler", items: crit.slice(0, 5) });
    const hit = (it) => trLower(`${it.text} ${it.main} ${it.sub} ${(it.evidence && it.evidence.selectedText) || ""}`).includes(lq);
    const fr = [];
    Q.findings().forEach((f) => { if (hit(f) || String(f.no) === q) fr.push({ type: "key", key: "f:" + f.id, ic: "pencil", html: `<b>Tespit ${f.no} · ${esc(f.main)} › ${esc(f.sub)}</b><span>${f.page ? "S." + f.page + " · " : ""}${this.snip(f.text, lq)}</span>` }); });
    Q.yazdis().forEach((y) => { if (hit(y)) fr.push({ type: "key", key: "y:" + y.id, ic: "sparkle", html: `<b>YZ ${y.no} · ${esc(y.main)} › ${esc(y.sub)}</b><span>S.${y.page} · ${this.snip(y.text, lq)}</span>` }); });
    if (["evaluate", "readonly"].includes(Q.othersMode())) Q.others().forEach((o) => { if (hit(o)) fr.push({ type: "key", key: "o:" + o.id, ic: "users", html: `<b>${D.REVIEWERS[o.reviewerId].tag}${o.no} · ${esc(o.main)}</b><span>${o.page ? "S." + o.page + " · " : ""}${this.snip(o.text, lq)}</span>` }); });
    if (fr.length) groups.push({ title: "Tespitler", items: fr.slice(0, 6), more: fr.length - 6 });
    if (q.length >= 3) {
      const pr = [];
      for (let n = 1; n <= Doc.pageCount && pr.length < 8; n++) {
        const txt = Doc.text(n); if (!txt) continue;
        const i = trLower(txt).indexOf(lq);
        if (i >= 0) pr.push({ type: "text", page: n, text: txt.substr(i, q.length), ic: "search", html: `<b>Sayfa ${n}</b><span>${this.snip(txt, lq)}</span>` });
      }
      if (pr.length) groups.push({ title: "PDF metni", items: pr });
    }
    this.items = []; let html = "";
    groups.forEach((g) => {
      html += `<div class="sr-h">${g.title}</div>`;
      g.items.forEach((it) => { html += `<button class="sr-item" role="option" data-i="${this.items.length}">${icon(it.ic)}<span class="sr-txt">${it.html}</span></button>`; this.items.push(it); });
      if (g.more > 0) html += `<div class="sr-more">+${g.more} sonuç daha · listeyi daraltmak için aramayı genişletin</div>`;
    });
    if (!this.items.length) html = `<div class="sr-empty">“${esc(q)}” için sonuç bulunamadı.<br><span>Sayfa numarası, D1/E1 gibi TYMM kodu, kriter adı veya metin arayabilirsiniz.</span></div>`;
    box.innerHTML = html; box.hidden = false; $("#q").setAttribute("aria-expanded", "true");
    this.active = this.items.length ? 0 : -1;
    this.move(0);
  },
  snip(text, lq) {
    const i = trLower(text).indexOf(lq);
    if (i < 0) return esc(text.slice(0, 90)) + (text.length > 90 ? "…" : "");
    const s = Math.max(0, i - 36), e = Math.min(text.length, i + lq.length + 56);
    return (s > 0 ? "…" : "") + esc(text.slice(s, i)) + "<mark>" + esc(text.slice(i, i + lq.length)) + "</mark>" + esc(text.slice(i + lq.length, e)) + (e < text.length ? "…" : "");
  },
  pick(it) {
    this.close(true);
    if (it.type === "page") Viewer.goTo(it.page);
    else if (it.type === "text") Viewer.flashText(it.page, it.text);
    else if (it.type === "key") App.select(it.key, { from: "search" });
    else if (it.type === "outcome") App.openOutcome(it.code);
    else if (it.type === "tymm") { UI.leftTab = "tymm"; UI.expandedTymm.add(it.code); if (UI.layout === "desktop" && !App.leftExpanded()) { UI.flyout = true; App.applyLayout(); } Left.render(); App.openTymmComp(it.code, null); }
    else if (it.type === "crit") { UI.filters = { main: it.main }; if (it.sub) UI.filters.sub = it.sub; UI.rightTab = "findings"; UI.scope = "book"; UI.view = { type: "list" }; App.revealRight(); Right.render(); }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
  $("#pdfFile").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) Viewer.openPdf(f); e.target.value = ""; });
  const viewer = $("#viewer");
  viewer.addEventListener("dragover", (e) => { if (e.dataTransfer && [...e.dataTransfer.items].some((i) => i.type === "application/pdf")) { e.preventDefault(); viewer.classList.add("drop"); } });
  viewer.addEventListener("dragleave", () => viewer.classList.remove("drop"));
  viewer.addEventListener("drop", (e) => { viewer.classList.remove("drop"); const f = e.dataTransfer.files[0]; if (f && f.type === "application/pdf") { e.preventDefault(); Viewer.openPdf(f); } });
});
