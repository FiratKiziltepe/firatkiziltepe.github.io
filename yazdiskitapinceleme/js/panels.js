/* Sol navigasyon (İçerik · TYMM · Medya · Ekler) ve sağ değerlendirme paneli (Tespitler · YZ · Diğerleri) */
"use strict";

const LEFT_TABS = [
  { id: "content", label: "İçerik", icon: "book" },
  { id: "program", label: "Program", icon: "cap" },
  { id: "tymm", label: "TYMM", icon: "target" },
  { id: "media", label: "Medya", icon: "media" },
  { id: "attach", label: "Ekler", icon: "clip" },
];

/* ================================================================== SOL PANEL */
const Left = {
  playing: null,

  render() { this.renderRail(); this.renderPanel(); },

  renderRail() {
    const expanded = App.leftExpanded();
    $("#rail").innerHTML = LEFT_TABS.map((t) => `<button class="rail-btn${UI.leftTab === t.id && (expanded || UI.flyout || UI.drawer) ? " is-active" : ""}" data-ltab="${t.id}" aria-label="${t.label}" title="${t.label}">${icon(t.icon)}<span>${t.label}</span>${t.id === "tymm" ? this.tymmBadge() : ""}</button>`).join("")
      + `<div class="rail-spacer"></div><button class="rail-btn rail-pin" data-act="pin-left" title="${expanded ? "Paneli daralt" : "Paneli sabitle"}" aria-label="${expanded ? "Paneli daralt" : "Paneli sabitle"}">${icon(expanded ? "left" : "panelLeft")}</button>`;
  },
  tymmBadge() {
    const c = Q.tymm().filter((t) => t.verificationStatus === "candidate").length;
    return c ? `<i class="rail-dot" title="${c} YZ adayı doğrulama bekliyor">${c}</i>` : "";
  },

  renderPanel() {
    const el = $("#leftPanel");
    const tab = LEFT_TABS.find((t) => t.id === UI.leftTab);
    const expanded = App.leftExpanded();
    const st = el.querySelector(".lp-body") ? el.querySelector(".lp-body").scrollTop : 0;
    let body = "";
    if (UI.leftTab === "content") body = this.contentHTML();
    else if (UI.leftTab === "tymm") body = this.tymmHTML();
    else if (UI.leftTab === "media") body = this.mediaHTML();
    else if (UI.leftTab === "program") body = this.programHTML();
    else body = this.attachHTML();
    el.innerHTML = `<div class="lp-head"><div class="lp-title">${icon(tab.icon)}${tab.id === "tymm" ? "TYMM Program Haritası" : tab.id === "program" ? "Öğretim Programı" : tab.label}</div>${UI.layout === "desktop" ? `<button class="icon-btn sm" data-act="pin-left" title="${expanded ? "Daralt" : "Sabitle"}" aria-label="${expanded ? "Paneli daralt" : "Paneli sabitle"}">${icon(expanded ? "left" : "pin")}</button>` : `<button class="icon-btn sm" data-act="close-left" aria-label="Kapat">${icon("x")}</button>`}</div><div class="lp-body">${body}</div>`;
    el.querySelector(".lp-body").scrollTop = st;
  },

  /* ---------- İçerik */
  progressHTML() {
    const done = Q.reviewedCount(), total = Doc.pageCount, pct = Math.round((done / total) * 100);
    const days = Math.max(0, Math.ceil((new Date(D.DEADLINE) - new Date(new Date().toDateString())) / 86400000));
    return `<div class="prog"><div class="prog-top"><span class="prog-pct">%${pct}</span><span class="prog-txt">${done} / ${total} sayfa incelendi</span></div><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="prog-sub"><span>${total - done} sayfa kaldı</span>${Doc.isDemo ? `<span>${icon("calendar")}Bitiş 13 Eki${days ? ` · ${days} gün` : ""}</span>` : ""}</div></div>`;
  },
  pageRow(n, fc, yc) {
    const rev = Q.reviewed(n);
    let main;
    if (fc) main = `<span class="pg-f">${fc} tespit</span>${yc ? `<span class="pg-y">${yc} YZ</span>` : ""}`;
    else if (yc) main = `<span class="pg-y">${yc} YZ önerisi</span>`;
    else main = `<span class="pg-plain">${rev ? "İncelendi" : "İncelenmedi"}</span>`;
    return `<button class="pg-row${n === UI.page ? " is-current" : ""}" data-page="${n}"><span class="pg-no">${n}</span><span class="pg-ic ${rev ? "ok" : ""}" title="${rev ? "İncelendi" : "İncelenmedi"}">${rev ? icon("check") : "○"}</span><span class="pg-main">${main}</span></button>`;
  },
  contentHTML() {
    const fBy = {}, yBy = {};
    Q.findings().forEach((f) => { if (f.page) fBy[f.page] = (fBy[f.page] || 0) + 1; });
    Q.yazdis().forEach((y) => { if (Q.yzPending(y)) yBy[y.page] = (yBy[y.page] || 0) + 1; });
    const flt = UI.pageFilter;
    const keep = (n) => flt === "all" || (flt === "todo" && !Q.reviewed(n)) || (flt === "marked" && (fBy[n] || yBy[n]));
    const cur = Doc.unitOf(UI.page);
    let html = this.progressHTML();
    html += `<div class="seg seg-sm lp-seg" role="radiogroup" aria-label="Sayfa filtresi">${[["all", "Tümü"], ["todo", "İncelenmedi"], ["marked", "Tespitli"]].map(([k, l]) => `<button role="radio" aria-checked="${flt === k}" class="${flt === k ? "is-active" : ""}" data-pfilter="${k}">${l}</button>`).join("")}</div>`;
    html += `<div class="tree">`;
    Doc.units.forEach((u) => {
      const pages = []; for (let n = u.start; n <= u.end; n++) pages.push(n);
      const doneU = pages.filter((n) => Q.reviewed(n)).length;
      const matches = pages.filter(keep);
      if (flt !== "all" && !matches.length) return;
      const open = UI.expandedUnits.has(u.id) || flt !== "all" && matches.length <= 12;
      const isCur = cur && cur.id === u.id;
      const fu = pages.reduce((a, n) => a + (fBy[n] || 0), 0);
      html += `<div class="tu${open ? " open" : ""}${isCur ? " is-current" : ""}"><button class="tu-head" data-unit="${u.id}" aria-expanded="${open}">${icon("right", "chev")}<span class="tu-title">${esc(u.label)}</span><span class="tu-range">${u.start}–${u.end}</span></button>`;
      html += `<div class="tu-meta"><span class="mini-bar"><i style="width:${Math.round(doneU / pages.length * 100)}%"></i></span><span>${doneU}/${pages.length}</span>${fu ? `<span class="pg-f">${fu} tespit</span>` : ""}</div>`;
      if (open) {
        const secs = u.sections && u.sections.length > 1 ? u.sections : null;
        if (secs) {
          secs.forEach((s) => {
            const sp = []; for (let n = s.start; n <= s.end; n++) if (keep(n)) sp.push(n);
            if (!sp.length) return;
            const sk = `${u.id}:${s.start}`;
            const sOpen = UI.expandedSections.has(sk) || flt !== "all";
            html += `<div class="ts${sOpen ? " open" : ""}"><button class="ts-head" data-sec="${sk}" aria-expanded="${sOpen}">${icon("right", "chev")}<span>${esc(s.title)}</span><span class="tu-range">${s.start}–${s.end}</span></button>`;
            if (sOpen) html += `<div class="pg-list">${sp.map((n) => this.pageRow(n, fBy[n], yBy[n])).join("")}</div>`;
            html += `</div>`;
          });
        } else {
          html += `<div class="pg-list">${matches.map((n) => this.pageRow(n, fBy[n], yBy[n])).join("")}</div>`;
        }
      }
      html += `</div>`;
    });
    return html + `</div>`;
  },

  /* ---------- TYMM */
  tymmHTML() {
    if (!Doc.isDemo && !Q.tymm().length) {
      return `<div class="empty">${icon("target", "big")}<p><b>Bu belge için YAZDİS TYMM analizi bulunmuyor.</b></p><p>PDF üzerinde metin veya alan seçip <b>TYMM eşleşmesi</b> ile kendi kanıtlarınızı ekleyebilirsiniz.</p></div>`;
    }
    const mode = UI.tymmMode;
    let html = `<div class="seg seg-sm lp-seg" role="radiogroup">${[["list", "Liste", "list"], ["map", "Kapsam Haritası", "grid"]].map(([k, l, ic]) => `<button role="radio" aria-checked="${mode === k}" class="${mode === k ? "is-active" : ""}" data-tmode="${k}">${icon(ic)}${l}</button>`).join("")}</div>`;
    html += mode === "map" ? this.tymmMapHTML() : this.tymmListHTML();
    html += `<div class="tymm-flow">${icon("info")}<span>TYMM eşleşmesi bir hata kaydı değildir. Kapsam yetersizse kapsam özetinden <b>tespit</b> oluşturulabilir.</span></div>`;
    return html;
  },
  tymmListHTML() {
    let html = "";
    [["deger", "Değerler"], ["egilim", "Eğilimler"]].forEach(([type, title]) => {
      html += `<div class="tg-h">${title.toLocaleUpperCase("tr-TR")}</div>`;
      D.TYMM_COMPONENTS.filter((c) => c.type === type).forEach((c) => {
        const k = Q.tymmCounts(c.code);
        const open = UI.expandedTymm.has(c.code);
        const sel = UI.view.type === "tcomp" && UI.view.code === c.code;
        html += `<div class="tc${open ? " open" : ""}"><button class="tc-head${sel ? " is-selected" : ""}" data-tcomp="${c.code}" aria-expanded="${open}"><span class="tymm-code">${c.code}</span><span class="tc-name">${esc(c.name)}</span><span class="tc-counts"><span class="c-ok" title="Doğrulanmış">${icon("check")}${k.verified}</span>${k.candidate ? `<span class="c-yz" title="YZ adayı">◌ ${k.candidate}</span>` : ""}${k.insufficient ? `<span class="c-ins" title="Yetersiz">△ ${k.insufficient}</span>` : ""}</span>${icon("down", "chev")}</button>`;
        if (open) {
          html += `<div class="tc-body">`;
          const units = Doc.units.filter((u) => u.no > 0);
          units.forEach((u) => {
            const evs = k.list.filter((t) => t.verificationStatus !== "rejected" && Doc.unitOf(t.page) && Doc.unitOf(t.page).id === u.id).sort((a, b) => a.page - b.page);
            const req = c.required.includes(u.id);
            if (!evs.length && !req) return;
            html += `<div class="tc-unit"><span>Ünite ${u.no} · ${esc(u.title)}</span>${!evs.length ? `<button class="tc-miss" data-tcell="${c.code}:${u.id}">${icon("alert")}Kanıt yok</button>` : ""}</div>`;
            evs.forEach((t) => {
              const st = STATUS_TYMM[t.verificationStatus];
              html += `<button class="tc-ev${UI.selected === "t:" + t.id ? " is-selected" : ""}" data-key="t:${t.id}"><span class="ev-page">S.${t.page}</span><span class="ev-act">${esc(t.activityName || "—")}</span><span class="ev-st ${st.cls}">${COVERAGE[t.coverageType]} işlenmiş <b>${st.sym}</b></span></button>`;
            });
          });
          html += `<button class="link tc-open" data-tcomp-open="${c.code}">Kapsam özetini aç ${icon("right")}</button></div>`;
        }
        html += `</div>`;
      });
    });
    return html;
  },
  tymmMapHTML() {
    const units = Doc.units.filter((u) => u.no > 0);
    const sym = { verified: "✓", candidate: "○", insufficient: "△", none: "—" };
    const lbl = { verified: "İnsan tarafından doğrulanmış", candidate: "YAZDİS adayı / doğrulama bekliyor", insufficient: "Yetersiz / tartışmalı", none: "Kanıt bulunamadı" };
    let html = `<div class="tmap-wrap"><table class="tmap"><thead><tr><th class="tm-h">TYMM</th>${units.map((u) => `<th title="${esc(u.label)}">${u.short}</th>`).join("")}</tr></thead><tbody>`;
    [["deger", "Değerler"], ["egilim", "Eğilimler"]].forEach(([type, title]) => {
      html += `<tr class="tm-group"><td colspan="${units.length + 1}">${title}</td></tr>`;
      D.TYMM_COMPONENTS.filter((c) => c.type === type).forEach((c) => {
        html += `<tr><th class="tm-row" scope="row"><button data-tcomp-open="${c.code}" title="${c.code} · ${esc(c.name)}"><span class="tymm-code">${c.code}</span><span class="tm-name">${esc(c.name)}</span></button></th>`;
        units.forEach((u) => {
          const cell = Q.tymmCell(c.code, u.id);
          const s = cell.sym;
          const sel = UI.view.type === "tcomp" && UI.view.code === c.code && UI.view.unitId === u.id;
          const miss = s === "none" && cell.required;
          html += `<td><button class="tm-cell s-${s}${miss ? " miss" : ""}${!cell.required && s === "none" ? " na" : ""}${sel ? " is-selected" : ""}" data-tcell="${c.code}:${u.id}" title="${c.code} · ${u.label}: ${!cell.required && s === "none" ? "Programda beklenmiyor" : lbl[s]}">${!cell.required && s === "none" ? "·" : sym[s]}</button></td>`;
        });
        html += `</tr>`;
      });
    });
    html += `</tbody></table></div><div class="tmap-legend"><span><b class="s-verified">✓</b> Doğrulanmış</span><span><b class="s-candidate">○</b> YZ adayı</span><span><b class="s-insufficient">△</b> Yetersiz</span><span><b class="s-none miss">—</b> Kanıt yok</span><span><b class="na">·</b> Beklenmiyor</span></div>`;
    return html;
  },

  /* ---------- Medya ve Ekler */
  mediaHTML() {
    if (Doc.type !== "mock") return `<div class="empty">${icon("media", "big")}<p>Bu belge için tanımlı medya içeriği bulunmuyor.</p></div>`;
    const p = this.playing;
    const media = Pub.data.media;
    const typeLbl = (m) => m.type === "audio" ? "Ses" : m.type === "video" ? "Video" : "Etkileşimli";
    let html = `<p class="muted small lp-note">Yayınevinin yüklediği medya ve eşleştirdiği sayfalar. YAZDİS yalnızca altyazı, transkript veya açıklama metni olan içerikleri analiz edebilir.</p>`;
    if (p) {
      const m = media.find((x) => x.id === p.id);
      if (m) html += `<div class="player"><div class="pl-top">${icon(m.type === "audio" ? "audio" : "video")}<div class="pl-title">${esc(m.title)}</div><button class="icon-btn sm" data-act="media-stop" aria-label="Kapat">${icon("x")}</button></div>${m.type === "video" ? `<div class="pl-screen">${figSVG("landscape", "#1f6fb2", 5)}<span>Video önizlemesi (prototip)</span></div>` : ""}<div class="pl-ctrl"><button class="icon-btn sm" data-act="media-toggle" aria-label="${p.on ? "Duraklat" : "Oynat"}">${icon(p.on ? "pause" : "play")}</button><div class="pl-bar"><i style="width:${p.pct}%"></i></div><span class="pl-time">${m.duration}</span></div></div>`;
    }
    html += `<div class="md-list">`;
    media.forEach((m) => {
      const rev = !!S.mediaStatus[m.id];
      const pages = m.pages.length ? m.pages.map((n) => `<button class="link" data-mpage="${n}">S.${n}</button>`).join(" ") : `<span class="md-warn">${icon("alert")}Sayfa eşleşmesi yok</span>`;
      const yz = m.transcript ? `<span class="md-yz ok" title="${esc(m.transcript)}">${icon("sparkle")}YAZDİS analiz etti</span>` : `<span class="md-yz no" title="Altyazı/transkript yüklenmemiş">${icon("alert")}Transkript yok · YAZDİS analiz edemedi</span>`;
      html += `<div class="md-item${p && p.id === m.id ? " is-playing" : ""}${!m.pages.length ? " is-unlinked" : ""}"><button class="md-play" data-media-play="${m.id}" aria-label="Oynat">${icon(m.type === "audio" ? "audio" : m.type === "video" ? "play" : "touch")}</button><div class="md-body"><div class="md-title">${esc(m.title)}</div><div class="md-meta">${typeLbl(m)} · ${esc(m.duration)} · ${pages}</div><div class="md-meta md-row">${m.outcome ? `<button class="oc-code sm" data-outcome-open="${m.outcome}" title="${esc((Pub.outcome(m.outcome) || {}).title || "")}">${m.outcome}</button>` : ""}${yz}</div><div class="md-acts"><label class="chk"><input type="checkbox" data-media-rev="${m.id}"${rev ? " checked" : ""}> İncelendi</label><button class="link" data-media-finding="${m.id}">${icon("plus")}Tespit</button></div></div></div>`;
    });
    return html + `</div>`;
  },
  attachHTML() {
    if (Doc.type !== "mock") return `<div class="empty">${icon("clip", "big")}<p>Bu belge için ek kaynak bulunmuyor.</p></div>`;
    const rel = ["main", "guide", "workbook"].filter((k) => k !== Doc.bookKey).map((k) => {
      const b = D.BOOKS[k];
      const desc = k === "main" ? "İncelenen ders kitabı" : k === "guide" ? "Öğrenme çıktısı bazında ders kitabıyla ilişkili" : "Çalışmalar ders kitabı sayfalarına bağlı";
      return `<button class="at-item rel" data-book-open="${k}:">${icon(k === "main" ? "book" : k)}<span><span class="at-title">${esc(b.short)}</span><span class="at-meta">${b.pageCount} sayfa · ${desc}</span></span><span class="at-open">Aç${icon("right")}</span></button>`;
    }).join("");
    return `<div class="tg-h">İLİŞKİLİ KİTAPLAR</div><div class="at-list">${rel}</div><div class="tg-h">DİĞER EKLER</div><div class="at-list">${D.ATTACHMENTS.map((a) => `<button class="at-item" data-attach="${a.id}">${icon("file")}<span><span class="at-title">${esc(a.title)}</span><span class="at-meta">${esc(a.meta)}</span></span></button>`).join("")}</div><p class="muted small pad">İlişkili kitaplar PDF alanının üstündeki sekmelerden de açılabilir.</p>`;
  },

  /* ---------- Öğretim programı: öğrenme çıktıları ve süreç bileşenleri */
  programHTML() {
    if (Doc.type !== "mock") return `<div class="empty">${icon("cap", "big")}<p>Yüklenen PDF için yayınevi program eşleştirmesi bulunmuyor.</p></div>`;
    UI.expandedOutcomes = UI.expandedOutcomes || new Set();
    const flt = UI.ocFilter || "all";
    const cur = Doc.bookKey === "main" ? Pub.page(UI.page).outcomes.map((l) => l.code) : ((Doc.book.pages[UI.page] || {}).outcome ? [Doc.book.pages[UI.page].outcome] : []);
    let total = 0, mapped = 0;
    D.OUTCOMES.forEach((o) => o.comps.forEach((c) => { total++; if (Pub.compPages(o.code, c.k).length) mapped++; }));
    let html = `<div class="prog"><div class="prog-top"><span class="prog-pct">${mapped}/${total}</span><span class="prog-txt">süreç bileşeni sayfalarla eşleştirildi</span></div><div class="bar"><i style="width:${Math.round(mapped / total * 100)}%"></i></div><div class="prog-sub"><span>${D.OUTCOMES.length} öğrenme çıktısı · yayınevi beyanı</span>${total - mapped ? `<span class="c-miss">${icon("alert")}${total - mapped} eşleşmesiz</span>` : ""}</div></div>`;
    html += `<div class="seg seg-sm lp-seg" role="radiogroup">${[["all", "Tümü"], ["page", "Bu sayfa"], ["gap", "Eşleşmesiz"]].map(([k, l]) => `<button role="radio" aria-checked="${flt === k}" class="${flt === k ? "is-active" : ""}" data-ocfilter="${k}">${l}${k === "page" ? ` (${cur.length})` : ""}</button>`).join("")}</div>`;
    let any = false;
    D.CONTENT_UNITS.forEach((u) => {
      const ocs = D.OUTCOMES.filter((o) => o.unitId === u.id).filter((o) => flt === "all" || (flt === "page" && cur.includes(o.code)) || (flt === "gap" && o.comps.some((c) => !Pub.compPages(o.code, c.k).length)));
      if (!ocs.length) return;
      any = true;
      html += `<div class="tg-h">${esc(u.label.toLocaleUpperCase("tr-TR"))}</div>`;
      ocs.forEach((o) => {
        const open = UI.expandedOutcomes.has(o.code) || flt !== "all";
        const cov = o.comps.filter((c) => Pub.compPages(o.code, c.k).length).length;
        const sel = UI.view.type === "outcome" && UI.view.code === o.code;
        html += `<div class="oc${open ? " open" : ""}${cur.includes(o.code) ? " is-current" : ""}"><button class="oc-head${sel ? " is-selected" : ""}" data-oc-toggle="${o.code}" aria-expanded="${open}"><span class="oc-code">${o.code}</span><span class="oc-title">${esc(o.title)}</span><span class="oc-cov${cov < o.comps.length ? " miss" : ""}" title="Sayfayla eşleştirilen süreç bileşeni">${cov}/${o.comps.length}</span>${icon("down", "chev")}</button>`;
        if (open) {
          html += `<div class="oc-body">`;
          o.comps.forEach((c) => {
            const pg = Pub.compPages(o.code, c.k);
            const here = Doc.bookKey === "main" && pg.includes(UI.page);
            html += `<div class="oc-comp${here ? " is-here" : ""}"><span class="oc-k">${c.k})</span><div><div class="oc-ct">${esc(c.text)}</div><div class="oc-pages">${pg.length ? pg.map((n) => `<button class="pg-chip${Doc.bookKey === "main" && n === UI.page ? " is-cur" : ""}" data-mpage="${n}">S.${n}</button>`).join("") : `<button class="tc-miss" data-oc-gap="${o.code}|${c.k}" title="Eksiklik tespiti oluştur">${icon("alert")}Eşleşme yok · tespit</button>`}</div></div></div>`;
          });
          html += `<button class="link tc-open" data-outcome-open="${o.code}">Tam metin ve öğretme-öğrenme uygulamaları ${icon("right")}</button></div>`;
        }
        html += `</div>`;
      });
    });
    if (!any) html += `<div class="empty"><p>${flt === "page" ? "Bu sayfa bir öğrenme çıktısıyla eşleştirilmemiş." : "Eşleşmesiz süreç bileşeni yok."}</p></div>`;
    return html;
  },

  /* ---------- olaylar */
  bind() {
    const rail = $("#rail"), panel = $("#leftPanel"), left = $("#left");
    let hoverT = 0, leaveT = 0;
    rail.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.act === "pin-left") return App.toggleLeft();
      if (b.dataset.ltab) {
        const same = UI.leftTab === b.dataset.ltab;
        UI.leftTab = b.dataset.ltab;
        if (!App.leftExpanded() && UI.layout !== "mobile") { UI.flyout = !(same && UI.flyout); App.applyLayout(); }
        this.render();
      }
    });
    rail.addEventListener("mouseover", (e) => {
      if (App.leftExpanded() || isCoarse()) return;
      const b = e.target.closest("[data-ltab]"); if (!b) return;
      clearTimeout(leaveT); clearTimeout(hoverT);
      hoverT = setTimeout(() => { UI.leftTab = b.dataset.ltab; UI.flyout = true; App.applyLayout(); this.render(); }, UI.flyout ? 60 : 160);
    });
    left.addEventListener("mouseleave", () => {
      clearTimeout(hoverT);
      if (App.leftExpanded() || isCoarse() || !UI.flyout) return;
      leaveT = setTimeout(() => { if (Pop.el && panel.contains(Pop.anchor)) return; if (panel.contains(document.activeElement) && document.activeElement.matches("input,select,textarea")) return; UI.flyout = false; App.applyLayout(); this.renderRail(); }, 380);
    });
    left.addEventListener("mouseenter", () => clearTimeout(leaveT));

    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button, [data-page]"); if (!b) return;
      const d = b.dataset;
      if (d.act === "pin-left") return App.toggleLeft();
      if (d.act === "close-left") { UI.flyout = false; UI.drawer = false; App.applyLayout(); this.renderRail(); return; }
      if (d.pfilter) { UI.pageFilter = d.pfilter; return this.renderPanel(); }
      if (d.unit) { UI.expandedUnits.has(d.unit) ? UI.expandedUnits.delete(d.unit) : UI.expandedUnits.add(d.unit); return this.renderPanel(); }
      if (d.sec) { UI.expandedSections.has(d.sec) ? UI.expandedSections.delete(d.sec) : UI.expandedSections.add(d.sec); return this.renderPanel(); }
      if (d.page) { Viewer.goTo(+d.page); App.afterLeftNav(); return; }
      if (d.mpage) { if (UI.leftTab === "program") App.showProgBar(); App.gotoMainPage(+d.mpage); App.afterLeftNav(); return; }
      if (d.ocfilter) { UI.ocFilter = d.ocfilter; return this.renderPanel(); }
      if (d.ocToggle) { UI.expandedOutcomes = UI.expandedOutcomes || new Set(); if (UI.expandedOutcomes.has(d.ocToggle)) UI.expandedOutcomes.delete(d.ocToggle); else { UI.expandedOutcomes.add(d.ocToggle); App.showProgBar(); } return this.renderPanel(); }
      if (d.outcomeOpen) { App.openOutcome(d.outcomeOpen, { fromLeft: true }); return; }
      if (d.ocGap) { const [c, k] = d.ocGap.split("|"); App.outcomeFinding(c, k, "gap"); App.afterLeftNav(true); return; }
      if (d.bookOpen) { const [k, pg] = d.bookOpen.split(":"); App.openBook(k, +pg || null); App.afterLeftNav(); return; }
      if (d.tmode) { UI.tymmMode = d.tmode; return this.renderPanel(); }
      if (d.tcomp) {
        const c = d.tcomp;
        if (UI.expandedTymm.has(c)) UI.expandedTymm.delete(c); else UI.expandedTymm.add(c);
        App.openTymmComp(c, null, { fromLeft: true });
        return;
      }
      if (d.tcompOpen) { App.openTymmComp(d.tcompOpen, null); App.afterLeftNav(true); return; }
      if (d.tcell) { const [c, u] = d.tcell.split(":"); App.openTymmComp(c, u); App.afterLeftNav(true); return; }
      if (d.key) { App.select(d.key, { from: "left" }); App.afterLeftNav(true); return; }
      if (d.mediaPlay) return this.play(d.mediaPlay);
      if (d.act === "media-stop") { this.stop(); return; }
      if (d.act === "media-toggle") { this.playing.on = !this.playing.on; this.renderPanel(); return; }
      if (d.mediaFinding) {
        const m = Pub.data.media.find((x) => x.id === d.mediaFinding);
        const mp = m.pages[0] || UI.page;
        App.gotoMainPage(mp);
        App.startFinding({ scope: "page", page: mp, evidence: { page: mp, selectionType: "region", selectedText: `${m.type === "audio" ? "Ses" : m.type === "video" ? "Video" : "Etkileşimli içerik"}: ${m.title} (${m.duration})`, anchor: "page" } });
        App.afterLeftNav(true);
        return;
      }
      if (d.attach) { toast("Prototipte ek belge önizlemesi bulunmuyor.", { icon: "info" }); }
    });
    panel.addEventListener("change", (e) => {
      const id = e.target.dataset.mediaRev;
      if (id) { S.mediaStatus[id] = e.target.checked; Store.changed(); }
    });
  },
  play(id) {
    const m = Pub.data.media.find((x) => x.id === id);
    if (this.playing && this.playing.id === id) { this.playing.on = !this.playing.on; this.renderPanel(); return; }
    this.playing = { id, on: true, pct: 0 };
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.playing || !this.playing.on) return;
      this.playing.pct = Math.min(100, this.playing.pct + 1.5);
      const bar = $("#leftPanel .pl-bar i"); if (bar) bar.style.width = this.playing.pct + "%";
      if (this.playing.pct >= 100) { this.playing.on = false; S.mediaStatus[id] = true; Store.changed(); this.renderPanel(); }
    }, 400);
    Viewer.goTo(m.page);
    this.renderPanel();
  },
  stop() { this.playing = null; clearInterval(this.timer); this.renderPanel(); },
};

/* ================================================================== SAĞ PANEL */
const Right = {
  render(opts) {
    opts = opts || {};
    const root = $("#rightInner");
    const prevBody = root.querySelector(".rp-body");
    const st = prevBody ? prevBody.scrollTop : 0;
    const sig = UI.view.type + "|" + UI.rightTab + "|" + UI.scope;
    if (UI.rightCollapsed && UI.layout === "desktop") { root.innerHTML = this.stripHTML(); return; }
    const v = UI.view;
    if (v.type === "form") root.innerHTML = this.formHTML();
    else if (v.type === "tymm") root.innerHTML = this.tymmHTML(v.id);
    else if (v.type === "tcomp") root.innerHTML = this.tcompHTML(v.code, v.unitId);
    else if (v.type === "tnew") root.innerHTML = this.tnewHTML();
    else if (v.type === "outcome") root.innerHTML = this.outcomeHTML(v.code);
    else root.innerHTML = this.listViewHTML();
    $$("textarea[data-autosize]", root).forEach(autosize);
    const body = root.querySelector(".rp-body");
    if (body && opts.keepScroll && this._sig === sig) body.scrollTop = st;
    this._sig = sig;
    if (opts.scrollToSelected) this.scrollToSelected();
  },
  scrollToSelected() {
    const card = $("#rightInner .card.is-selected");
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  },

  stripHTML() {
    const om = Q.othersMode();
    const c = this.counts();
    const b = (tab, ic, label, n, locked) => `<button class="strip-btn${UI.rightTab === tab ? " is-active" : ""}" data-strip="${tab}" title="${label}" aria-label="${label}">${icon(locked ? "lock" : ic)}<span>${label}</span>${n != null ? `<b>${n}</b>` : ""}</button>`;
    return `<div class="strip"><button class="strip-btn" data-act="expand-right" title="Paneli genişlet" aria-label="Paneli genişlet">${icon("left")}</button>${b("findings", "pencil", "Tespitler", c.findings)}${b("yz", "sparkle", "YZ", c.yz)}${om !== "hidden" ? b("others", "users", "Diğerleri", om === "locked" ? null : c.others, om === "locked") : ""}</div>`;
  },

  /* ---------- liste verisi */
  baseList(tab) {
    if (tab === "findings") return Q.findings();
    if (tab === "yz") return Q.yazdis();
    return Q.others();
  },
  matchesFilters(it, tab) {
    const f = UI.filters;
    if (f.main && it.main !== f.main) return false;
    if (f.sub && it.sub !== f.sub) return false;
    if (f.unit) { const u = it.page ? Doc.unitOf(it.page) : Q.unitById(it.unitId); if (!u || u.id !== f.unit) return false; }
    if (f.page && it.page !== +f.page) return false;
    if (f.source && tab === "findings" && (it.origin || "human") !== f.source) return false;
    if (f.reviewer && tab === "others" && it.reviewerId !== f.reviewer) return false;
    if (f.status) {
      if (tab === "yz") { const d = Q.decision(it.id); const s = d ? (d.status === "rejected" ? "rejected" : "approved") : "pending"; if (s !== f.status) return false; }
      if (tab === "others") { const a = S.agreements[it.id]; const s = a ? a.value : "open"; if (s !== f.status) return false; }
    }
    return true;
  },
  list(tab, scope) {
    let arr = this.baseList(tab).filter((it) => this.matchesFilters(it, tab));
    if (scope === "page") arr = arr.filter((it) => it.page === UI.page);
    const yOf = (it) => { const g = it.page === UI.page ? Viewer.geomOf(it) : null; return g ? g.bbox.y : (it.page ? 0 : -1); };
    arr = arr.slice().sort((a, b) => {
      if (tab === "yz" && scope === "page") { const pa = Q.yzPending(a) ? 0 : 1, pb = Q.yzPending(b) ? 0 : 1; if (pa !== pb) return pa - pb; }
      const ap = a.page || 0, bp = b.page || 0;
      if (ap !== bp) return ap - bp;
      if (scope === "page") return yOf(a) - yOf(b);
      return (a.no || 0) - (b.no || 0);
    });
    return arr;
  },
  counts() {
    const sc = UI.scope;
    const inScope = (it) => sc === "book" || it.page === UI.page;
    return {
      findings: Q.findings().filter(inScope).length,
      yz: Q.yazdis().filter((y) => inScope(y) && Q.yzPending(y)).length,
      others: Q.others().filter(inScope).length,
    };
  },

  /* ---------- liste görünümü */
  headHTML(inner) { return `<div class="rp-head">${inner}${UI.layout === "desktop" ? `<button class="icon-btn sm" data-act="collapse-right" title="Paneli küçült ( ] )" aria-label="Paneli küçült">${icon("right")}</button>` : ""}</div>`; },
  listViewHTML() {
    const om = Q.othersMode();
    if (UI.rightTab === "others" && om === "hidden") UI.rightTab = "findings";
    const c = this.counts();
    const tab = (id, label, ic, n, extra) => `<button role="tab" aria-selected="${UI.rightTab === id}" class="rt${UI.rightTab === id ? " is-active" : ""}${extra || ""}" data-rtab="${id}">${ic ? icon(ic) : ""}${label}${n != null ? `<span class="cnt">${n}</span>` : ""}</button>`;
    let tabs = tab("findings", "Tespitler", null, c.findings) + tab("yz", "YZ", "sparkle", c.yz, " rt-yz");
    if (om === "locked") tabs += `<button role="tab" aria-selected="${UI.rightTab === "others"}" aria-disabled="true" class="rt is-locked${UI.rightTab === "others" ? " is-active" : ""}" data-rtab="others" title="Bağımsız inceleme tamamlandıktan sonra açılır">${icon("lock")}Diğerleri</button>`;
    else if (om !== "hidden") tabs += tab("others", "Diğerleri", null, c.others);
    let html = this.headHTML(`<div class="rp-tabs" role="tablist">${tabs}</div>`);

    if (UI.rightTab === "others" && om === "locked") {
      return html + `<div class="rp-body"><div class="locked">${icon("lock", "big")}<h4>Diğer panelistlerin tespitleri kilitli</h4><p>Diğer panelistlerin tespitleri bağımsız inceleme süreci tamamlandıktan sonra görüntülenecektir.</p><p class="muted">Aşama 2 · Panel Öncesi Değerlendirme: 14 Ekim 2026</p></div></div>`;
    }

    const tabNow = UI.rightTab;
    const nPage = this.list(tabNow, "page").length, nBook = this.list(tabNow, "book").length;
    html += `<div class="rp-sub"><div class="seg" role="radiogroup" aria-label="Kapsam"><button role="radio" aria-checked="${UI.scope === "page"}" class="${UI.scope === "page" ? "is-active" : ""}" data-scope="page">Bu Sayfa <span>(${nPage})</span></button><button role="radio" aria-checked="${UI.scope === "book"}" class="${UI.scope === "book" ? "is-active" : ""}" data-scope="book">Tüm Kitap <span>(${nBook})</span></button></div><button class="btn-ghost sm${Object.keys(UI.filters).length ? " is-on" : ""}" data-act="filter" aria-haspopup="dialog">${icon("filter")}<span>Filtre</span></button>${tabNow === "findings" ? `<button class="btn-ghost sm" data-act="new-menu" title="Seçim olmadan tespit ekle" aria-label="Yeni tespit">${icon("plus")}<span>Yeni</span></button>` : ""}</div>`;
    const chips = this.chipsHTML(tabNow);
    if (chips) html += `<div class="chips">${chips}</div>`;

    let body = "";
    if (S.draft && S.draft.docId === Doc.id) {
      body += `<div class="draft-banner">${icon("pencil")}<span><b>Kaydedilmemiş taslak</b> · ${S.draft.page ? "S." + S.draft.page : scopeLabel(S.draft.scope)}${S.draft.main ? " · " + esc(S.draft.main) : ""}</span><button class="link" data-act="resume-draft">Devam et</button></div>`;
    }
    if (tabNow === "others" && om === "evaluate") {
      const all = Q.others(); const done = all.filter((o) => S.agreements[o.id]).length;
      body += `<div class="eval-progress"><span>${done} / ${all.length} tespit değerlendirildi</span><span class="mini-bar"><i style="width:${Math.round(done / all.length * 100)}%"></i></span></div>`;
    }
    if (tabNow === "others" && om === "readonly") body += `<div class="note">${icon("info")}Komisyon modunda diğer incelemecilerin tespitleri yalnızca okunur.</div>`;

    const items = this.list(tabNow, UI.scope);
    if (!items.length) body += this.emptyHTML(tabNow);
    else if (UI.scope === "book") {
      let lastGroup = null;
      items.forEach((it) => {
        const g = it.page ? `S.${it.page}` : "kapsam";
        if (g !== lastGroup) {
          lastGroup = g;
          const u = it.page ? Doc.unitOf(it.page) : null;
          body += `<div class="grp-h">${it.page ? `<button class="link" data-page="${it.page}">Sayfa ${it.page}</button><span>${u ? esc(u.short === u.title ? u.title : u.label) : ""}</span>` : `<span>Ünite / kitap kapsamındaki kayıtlar</span>`}</div>`;
        }
        body += this.cardHTML(it, tabNow);
      });
    } else body += items.map((it) => this.cardHTML(it, tabNow)).join("");
    html += `<div class="rp-body" role="tabpanel">${body}</div>`;
    return html;
  },
  chipsHTML(tab) {
    const f = UI.filters;
    const names = {
      source: { human: "İnsan", yazdis: "YAZDİS kökenli" },
      status: tab === "yz" ? { pending: "Bekleyen", approved: "Onaylanan", rejected: "Reddedilen" } : { open: "Değerlendirilmedi", agree: "Katılıyorum", disagree: "Katılmıyorum" },
    };
    const out = [];
    Object.keys(f).forEach((k) => {
      let v = f[k];
      if (k === "unit") v = (Q.unitById(v) || {}).short || v;
      if (k === "page") v = "S." + v;
      if (k === "reviewer") v = D.REVIEWERS[v].role;
      if (names[k] && names[k][f[k]]) v = names[k][f[k]];
      out.push(`<button class="chip" data-unfilter="${k}" aria-label="${esc(v)} filtresini kaldır">${esc(v)}${icon("x")}</button>`);
    });
    if (out.length > 1) out.push(`<button class="link sm" data-act="clear-filters">Temizle</button>`);
    return out.join("");
  },
  emptyHTML(tab) {
    const filtered = Object.keys(UI.filters).length;
    if (filtered) return `<div class="empty">${icon("filter", "big")}<p>Filtrelerle eşleşen kayıt yok.</p><button class="btn-ghost sm" data-act="clear-filters">Filtreleri temizle</button></div>`;
    if (tab === "findings" && UI.scope === "page") return `<div class="empty">${icon("textCursor", "big")}<p><b>Sayfa ${UI.page}'de tespit yok.</b></p><p>PDF'de metin seçin veya <b>Alan</b> aracıyla bölge işaretleyin; açılan araç çubuğundan <b>Tespit oluştur</b>.</p><button class="btn-ghost sm" data-act="new-page-finding">${icon("plus")}Sayfa tespiti ekle</button></div>`;
    if (tab === "yz") return `<div class="empty">${icon("sparkle", "big")}<p>${Doc.isDemo ? (UI.scope === "page" ? `Sayfa ${UI.page} için YAZDİS önerisi yok.` : "YAZDİS önerisi yok.") : "Bu belge için YAZDİS analizi henüz çalıştırılmadı."}</p></div>`;
    if (tab === "others") return `<div class="empty">${icon("users", "big")}<p>${UI.scope === "page" ? `Sayfa ${UI.page}'de diğer panelistlerin tespiti yok.` : "Kayıt yok."}</p></div>`;
    return `<div class="empty"><p>Kayıt yok.</p></div>`;
  },

  /* ---------- kartlar */
  textBlock(it, key) {
    const long = it.text.length > 170;
    const open = UI.expandedCards.has(key) || UI.selected === key;
    return `<p class="c-text${long && !open ? " clamp" : ""}">${esc(it.text)}</p>${long ? `<button class="c-more" data-act="expand">${open ? "Daha az göster" : "Devamını göster"}</button>` : ""}`;
  },
  selQuote(it) {
    const e = it.evidence;
    if (!e || !e.selectedText) return "";
    return `<div class="c-sel"><div class="lbl">Seçilen alan · ${SEL_TYPE[e.selectionType] || "Seçim"}</div><blockquote>“${esc(e.selectedText)}”</blockquote></div>`;
  },
  locLabel(it) {
    if (it.page) return `<button class="link" data-act="locate">S.${it.page}</button>`;
    if (it.scope === "unit") { const u = Q.unitById(it.unitId); return `<span>${u ? esc(u.label) : "Ünite"}</span>`; }
    return `<span>Kitap geneli</span>`;
  },
  cardHTML(it, tab) {
    if (tab === "yz") return this.yzCardHTML(it);
    if (tab === "others") return this.otherCardHTML(it);
    const key = "f:" + it.id;
    const sel = UI.selected === key;
    const rv = D.REVIEWERS[it.reviewerId] || D.REVIEWERS.me;
    const y = it.yazdisId ? S.yazdis.find((x) => x.id === it.yazdisId) : null;
    return `<article class="card c-f${sel ? " is-selected" : ""}${UI.hover === key ? " is-hover" : ""}" data-key="${key}" tabindex="0" aria-label="Tespit ${it.no}">
      <div class="c-top"><span class="num n-h${it.origin === "yazdis" ? " yz-origin" : ""}">${it.no}</span><div class="c-crit"><div class="c-main">${esc(it.main)}</div><div class="c-sub">${esc(it.sub)}</div></div><span class="c-scope">${scopeLabel(it.scope)}</span></div>
      ${this.textBlock(it, key)}
      ${sel ? this.selQuote(it) : ""}
      ${it.outcomeRef ? `<div class="c-tymm"><button class="oc-code sm" data-outcome-open="${it.outcomeRef.code}">${it.outcomeRef.code}${it.outcomeRef.comp ? ` (${it.outcomeRef.comp})` : ""}</button><span class="c-oc-t">${esc(((Pub.outcome(it.outcomeRef.code) || {}).comps || []).filter((c) => c.k === it.outcomeRef.comp).map((c) => c.text)[0] || (Pub.outcome(it.outcomeRef.code) || {}).title || "")}</span></div>` : ""}
      ${it.tymmCode ? `<div class="c-tymm"><span class="tymm-code">${it.tymmCode}</span>${esc((Q.comp(it.tymmCode) || {}).name || "")} ${it.scope === "unit" ? "· " + esc((Q.unitById(it.unitId) || {}).label || "") : ""}</div>` : ""}
      <div class="c-meta">${this.locLabel(it)}${it.activityName ? `<span>${esc(it.activityName)}</span>` : ""}<span>${esc(rv.short)}</span><span>${fmtTime(it.updatedAt)}</span>${it.origin === "yazdis" ? `<span class="tag-yz">${icon("sparkle")}YAZDİS kökenli${y ? " · YZ " + y.no : ""}</span>` : ""}${it.criteriaSource && it.criteriaSource !== "manual" ? `<span class="tag-yz" title="Kriterler YAZDİS tarafından önerildi">${icon("sparkle")}${it.criteriaSource === "yazdis-accepted" ? "Kriter: YAZDİS önerisi" : "Kriter: YAZDİS önerisi düzeltildi"}</span>` : ""}</div>
      ${sel ? `<div class="c-actions"><button class="btn-ghost sm" data-act="edit">${icon("pencil")}Düzenle</button>${it.page ? `<button class="btn-ghost sm" data-act="locate">${icon("locate")}PDF'de göster</button>` : ""}<button class="btn-ghost sm danger" data-act="delete">${icon("trash")}Sil</button></div>` : ""}
    </article>`;
  },
  yzCardHTML(y) {
    const key = "y:" + y.id;
    const sel = UI.selected === key;
    const d = Q.decision(y.id);
    const pct = Math.round(y.confidence * 100);
    let status = `<span class="st st-pending">Bekliyor</span>`, decision = "", actions = "";
    if (d) {
      const f = d.findingId ? S.findings.find((x) => x.id === d.findingId) : null;
      if (d.status === "rejected") {
        status = `<span class="st st-rejected">${icon("x")}Reddedildi</span>`;
        decision = `<div class="c-decision no">${icon("x")}<span>Reddedildi · <b>${esc(d.reason)}</b>${d.note ? ` — ${esc(d.note)}` : ""}</span><button class="link" data-act="yz-undo">Kararı geri al</button></div>`;
      } else {
        status = `<span class="st st-approved">${icon("check")}${d.status === "edited" ? "Düzenlenip onaylandı" : "Onaylandı"}</span>`;
        decision = `<div class="c-decision ok">${icon("check")}<span>${f ? `<button class="link" data-open-key="f:${f.id}">Tespit ${f.no}</button> olarak kaydedildi` : "Onaylandı"}</span><button class="link" data-act="yz-undo">Kararı geri al</button></div>`;
      }
    } else if (UI.rejectOpen === y.id) {
      const r = UI.rejectDraft || {};
      actions = `<div class="reject-box"><div class="lbl">Ret nedeni <span class="muted">· model geliştirme için saklanır</span></div><div class="radio-list" role="radiogroup">${D.REJECT_REASONS.map((rs) => `<label class="radio"><input type="radio" name="rj-${y.id}" value="${esc(rs)}"${r.reason === rs ? " checked" : ""}><span>${esc(rs)}</span></label>`).join("")}</div>${r.reason === "Diğer" ? `<textarea class="input" data-rj-note rows="2" placeholder="Kısa açıklama…" data-autosize>${esc(r.note || "")}</textarea>` : ""}<div class="row-btns"><button class="btn danger sm" data-act="yz-reject-confirm"${r.reason ? "" : " disabled"}>Reddi kaydet</button><button class="btn-ghost sm" data-act="yz-reject-cancel">Vazgeç</button></div></div>`;
    } else {
      actions = `<div class="c-actions yz"><button class="btn ok sm" data-act="yz-approve">${icon("check")}Onayla</button><button class="btn-ghost sm" data-act="yz-edit">${icon("pencil")}Düzenle ve Onayla</button><button class="btn-ghost sm danger" data-act="yz-reject">${icon("x")}Reddet</button></div>`;
    }
    const open = UI.expandedCards.has(key) || sel;
    return `<article class="card c-y${sel ? " is-selected" : ""}${d ? " is-decided" : ""}${UI.hover === key ? " is-hover" : ""}" data-key="${key}" tabindex="0" aria-label="YAZDİS önerisi ${y.no}">
      <div class="c-yzhead"><span class="yz-brand">${icon("sparkle")}YAZDİS Analizi</span><span class="num n-y"><i>YZ</i>${y.no}</span>${status}</div>
      <div class="c-crit"><div class="c-main">${esc(y.main)}</div><div class="c-sub">${esc(y.sub)}</div></div>
      ${this.textBlock(y, key)}
      ${open ? `<div class="c-reason"><div class="lbl">Gerekçe</div><p>${esc(y.rationale)}</p></div>${this.selQuote(y)}` : `<button class="c-more" data-act="expand">Gerekçeyi göster</button>`}
      <div class="c-meta">${this.locLabel(y)}<span class="conf" title="Model güveni">Model güveni %${pct}</span></div>
      ${decision}${actions}
    </article>`;
  },
  otherCardHTML(o) {
    const key = "o:" + o.id;
    const sel = UI.selected === key;
    const rv = D.REVIEWERS[o.reviewerId];
    const om = Q.othersMode();
    const a = S.agreements[o.id];
    let agree = "";
    if (om === "evaluate") {
      if (UI.disagreeOpen === o.id) {
        agree = `<div class="reject-box"><div class="lbl">Katılmama gerekçesi <span class="muted">(kısa, isteğe bağlı)</span></div><textarea class="input" data-dis-note rows="2" placeholder="Örn. ifade bağlam içinde doğru…" data-autosize>${esc((UI.disDraft || {}).reason || (a && a.reason) || "")}</textarea><div class="row-btns"><button class="btn sm" data-act="disagree-save">Kaydet</button><button class="btn-ghost sm" data-act="disagree-cancel">Vazgeç</button></div></div>`;
      } else if (a) {
        agree = `<div class="c-decision ${a.value === "agree" ? "ok" : "no"}">${icon(a.value === "agree" ? "thumbUp" : "thumbDown")}<span>${a.value === "agree" ? "Katılıyorum" : "Katılmıyorum"}${a.reason ? ` — ${esc(a.reason)}` : ""}</span><button class="link" data-act="agree-reset">Değiştir</button></div>`;
      } else {
        agree = `<div class="c-actions"><button class="btn-ghost sm agree" data-act="agree">${icon("thumbUp")}Katılıyorum</button><button class="btn-ghost sm disagree" data-act="disagree">${icon("thumbDown")}Katılmıyorum</button></div>`;
      }
    }
    const sim = o.similarTo ? S.findings.find((f) => f.id === o.similarTo) : null;
    return `<article class="card c-o${sel ? " is-selected" : ""}${UI.hover === key ? " is-hover" : ""}" data-key="${key}" tabindex="0">
      <div class="c-top"><span class="num n-o">${rv.tag}${o.no}</span><div class="c-crit"><div class="c-main">${esc(o.main)}</div><div class="c-sub">${esc(o.sub)}</div></div><span class="c-scope">${scopeLabel(o.scope)}</span></div>
      ${this.textBlock(o, key)}
      ${sel ? this.selQuote(o) : ""}
      ${sim ? `<div class="c-similar">${icon("users")}Sizin <button class="link" data-open-key="f:${sim.id}">Tespit ${sim.no}</button> ile benzer</div>` : ""}
      <div class="c-meta">${this.locLabel(o)}<span>${esc(rv.role)} · ${esc(rv.short)}</span></div>
      ${agree}
    </article>`;
  },

  /* ---------- tespit formu */
  formHTML() {
    const d = S.draft;
    if (!d) { UI.view = { type: "list" }; return this.listViewHTML(); }
    const title = d.mode === "edit" ? `Tespit ${(S.findings.find((f) => f.id === d.findingId) || {}).no || ""} · Düzenle` : d.mode === "yz" ? "Düzenle ve Onayla" : "Yeni Tespit";
    const e = d.evidence;
    const hasSel = e && (e.rects || e.boundingBox || e.anchor === "text");
    let sel = "";
    if (e && (e.selectedText || e.boundingBox)) {
      const isText = e.selectionType === "text";
      sel = `<section class="f-sec sel-area"><div class="f-lbl">Seçilen Alan<span class="f-hint">Salt okunur · ${e.page || d.page ? "S." + (e.page || d.page) + " · " : ""}${SEL_TYPE[e.selectionType] || ""}</span></div>`;
      if (!isText && e.boundingBox && (e.page || d.page)) sel += `<div class="crop-wrap">${Viewer.cropHTML(e.page || d.page, e.boundingBox, 300)}<div class="crop-cap">Sayfa ${e.page || d.page} üzerinde seçilen ${e.selectionType === "image" ? "görsel" : "bölge"}</div></div>`;
      if (e.selectedText) {
        const long = e.selectedText.length > 220;
        sel += `<blockquote class="sel-quote${long && !UI.quoteOpen ? " clamp" : ""}">“${esc(e.selectedText)}”</blockquote>${long ? `<button class="link sm" data-act="toggle-quote">${UI.quoteOpen ? "Daralt" : "Tamamını göster"}</button>` : ""}`;
      }
      if (e.contextBefore || e.contextAfter) sel += `<details class="ctx"><summary>Bağlam</summary><p>…${esc(e.contextBefore)} <mark>${esc(e.selectedText)}</mark> ${esc(e.contextAfter)}…</p></details>`;
      if (e.boundingBox) sel += `<button class="link sm" data-act="locate-draft">${icon("locate")}PDF'de göster</button>`;
      sel += `</section>`;
    }
    const scopeBtns = SCOPES.map((s) => {
      const dis = s.id === "selection" && !hasSel;
      return `<button role="radio" aria-checked="${d.scope === s.id}" class="${d.scope === s.id ? "is-active" : ""}" data-fscope="${s.id}"${dis ? " disabled title='Önce PDF üzerinde seçim yapın'" : ""}>${s.label}</button>`;
    }).join("");
    let scopeDetail = "";
    if (d.scope === "selection" || d.scope === "page") scopeDetail = `<label class="inline">Sayfa <input class="input num-in" type="number" min="1" max="${Doc.pageCount}" value="${d.page || UI.page}" data-fpage${d.scope === "selection" ? " disabled" : ""}></label>`;
    if (d.scope === "activity") scopeDetail = `<label class="inline grow">Etkinlik <input class="input" value="${esc(d.activityName || "")}" placeholder="Örn. Etkinlik 2.1 · Bilgiyi Değerlendirelim" data-factivity></label><label class="inline">S. <input class="input num-in" type="number" min="1" max="${Doc.pageCount}" value="${d.page || UI.page}" data-fpage></label>`;
    if (d.scope === "unit") scopeDetail = `<select class="input grow" data-funit>${Doc.units.filter((u) => u.no > 0).map((u) => `<option value="${u.id}"${d.unitId === u.id ? " selected" : ""}>${esc(u.label)} (${u.start}–${u.end})</option>`).join("")}</select>`;
    if (d.scope === "book") scopeDetail = `<span class="muted">Kitap genelini kapsayan tespit · PDF koordinatına bağlı değildir.</span>`;

    const err = UI.formErrors || {};
    const assist = d.critMode === "assist";
    const modeSw = d.mode === "new" ? `<section class="f-sec crit-mode"><div class="f-lbl">Kriter belirleme</div><div class="seg seg-wrap" role="radiogroup" aria-label="Kriter belirleme yöntemi"><button role="radio" aria-checked="${!assist}" class="${!assist ? "is-active" : ""}" data-critmode="manual">${icon("list")}Kriteri ben seçeyim</button><button role="radio" aria-checked="${assist}" class="${assist ? "is-active" : ""}" data-critmode="assist">${icon("sparkle")}YAZDİS önersin</button></div></section>` : "";
    const textSec = `<section class="f-sec${err.text ? " has-err" : ""}"><div class="f-lbl">${assist ? "Sorunu yazın" : "Tespit"} <span class="req">*</span><span class="f-hint" data-fcount>${(d.text || "").length} karakter</span></div>${assist ? `<div class="hint-line">${icon("sparkle")}<span>Sorunu kendi cümlelerinizle yazın; YAZDİS ana ve alt kriteri önerir. Örn. <i>“burada reklam unsuru var”</i>.</span></div>` : ""}<textarea class="input" rows="4" data-ftext data-autosize placeholder="${assist ? "Gördüğünüz sorunu kısaca yazınız…" : "Tespiti ve gerekiyorsa düzeltme önerisini yazınız…"}">${esc(d.text || "")}</textarea>${err.text ? `<div class="err">${err.text}</div>` : ""}</section>`;
    const critBlock = `<div id="critBlock" class="crit-block">${this.critBlockHTML(d)}</div>`;

    const body = `<div class="form">
      ${d.origin === "yazdis" ? `<div class="origin-yz">${icon("sparkle")}<div><b>YAZDİS önerisinden oluşturuluyor</b><span>Alanlar YAZDİS çıktısından dolduruldu; kayıtta YAZDİS kökeni korunur.</span></div></div>` : ""}
      ${sel}
      <section class="f-sec"><div class="f-lbl">Kapsam</div><div class="seg seg-wrap" role="radiogroup">${scopeBtns}</div><div class="scope-detail">${scopeDetail}</div></section>
      ${modeSw}
      ${assist ? textSec + critBlock : critBlock + textSec}
    </div>`;
    return `<div class="rp-head detail"><button class="icon-btn sm" data-act="back" title="Listeye dön (taslak korunur)" aria-label="Listeye dön">${icon("back")}</button><div class="rp-title">${title}</div><span class="autosave">${UI.saveState === "saving" ? "Kaydediliyor…" : "Taslak kaydedildi"}</span></div>
      <div class="rp-body">${body}</div>
      <div class="rp-foot"><button class="btn primary" data-act="save-draft">${icon("check")}${d.mode === "yz" ? "Kaydet ve Onayla" : "Kaydet"}</button><button class="btn-ghost" data-act="discard-draft">Vazgeç</button>${d.mode === "edit" ? `<button class="btn-ghost danger push" data-act="delete-editing">${icon("trash")}Sil</button>` : `<span class="kbd-hint push">Ctrl + Enter</span>`}</div>`;
  },

  /* ---------- kriter bloğu: aranabilir combobox'lar + YAZDİS kriter önerisi */
  critBlockHTML(d) {
    const err = UI.formErrors || {};
    const tymmSel = d.main === D.TYMM_MAIN || d.tymmCode ? `<section class="f-sec"><div class="f-lbl">İlgili TYMM bileşeni <span class="f-hint">isteğe bağlı</span></div><select class="input" data-ftymm><option value="">—</option>${D.TYMM_COMPONENTS.map((c) => `<option value="${c.code}"${d.tymmCode === c.code ? " selected" : ""}>${c.code} · ${esc(c.name)}</option>`).join("")}</select></section>` : "";
    const combos = this.comboFieldHTML("main", d, err) + this.comboFieldHTML("sub", d, err);
    const ocSel = this.outcomeSelectHTML(d);
    if (d.critMode !== "assist") return combos + ocSel + tymmSel;

    const st = d.sugState || "idle";
    const sg = d.suggestion;
    const rows = (main, sub) => {
      const c = D.CRITERIA.find((x) => x.name === main), s = D.SUBS.find((x) => x.label === sub);
      return `<div class="sug-row"><span class="sug-k">Ana kriter</span><div class="sug-v"><span class="cb-code">${c ? c.code : ""}</span><span>${esc(main)}</span></div></div><div class="sug-row"><span class="sug-k">Alt kriter</span><div class="sug-v"><span class="cb-code">${s ? s.code : ""}</span><span>${esc(s ? s.text : sub)}</span></div></div>`;
    };
    const stale = d.sugStale ? `<button class="link sm" data-act="sug-rerun">${icon("undo")}Metin değişti · yeniden öner</button>` : "";
    if (st === "idle") return `<div class="sug-wait">${icon("sparkle")}<span>Sorunu yazdığınızda YAZDİS ana ve alt kriteri önerecek.</span><button class="link sm" data-act="sug-manual">Kriteri kendim seçeyim</button></div>${err.main ? `<div class="err">${err.main}</div>` : ""}`;
    if (st === "analyzing") return `<div class="sug-wait is-busy"><span class="spinner" aria-hidden="true"></span><span>YAZDİS metni analiz ediyor…</span></div>`;
    if (st === "shown" && sg) {
      return `<div class="sug-card" role="region" aria-label="YAZDİS kriter önerisi">
        <div class="sug-h">${icon("sparkle")}<span>YAZDİS kriter önerisi</span><span class="conf">Güven %${Math.round(sg.confidence * 100)}</span></div>
        ${rows(sg.main, sg.sub)}
        <p class="sug-why">${icon("info")}<span>${esc(sg.reason)}</span></p>
        ${sg.alts.length ? `<div class="sug-alts"><span>Diğer olasılıklar:</span>${sg.alts.map((a, i) => `<button class="chip-alt" data-sug-alt="${i}" title="${esc(a.sub)}">${a.code} · ${esc(a.main)}</button>`).join("")}</div>` : ""}
        ${sg.statement ? `<div class="sug-stmt"><div class="lbl">Önerilen tespit ifadesi</div><p>${esc(sg.statement)}</p><button class="link sm" data-act="sug-use-text">${icon("pencil")}Bu ifadeyi tespit metni olarak kullan</button></div>` : ""}
        ${err.main ? `<div class="err">YAZDİS önerisini onaylayın veya düzeltin.</div>` : ""}
        <div class="row-btns"><button class="btn ok sm" data-act="sug-accept">${icon("check")}Öneriyi onayla</button><button class="btn-ghost sm" data-act="sug-edit">${icon("pencil")}Düzelt</button></div>
      </div>`;
    }
    if (st === "accepted") {
      return `<div class="sug-card is-done"><div class="sug-h ok">${icon("checkCircle")}<span>${d.sugPick === "alt" ? "YAZDİS alternatif önerisi seçildi" : "YAZDİS önerisi onaylandı"}</span><button class="link sm push" data-act="sug-edit">Düzelt</button></div>${rows(d.main, d.sub)}${stale}</div>${ocSel}${tymmSel}`;
    }
    // "edit" veya "none": combobox'larla düzeltme / elle seçim
    const head = st === "none"
      ? `<div class="sug-wait warn">${icon("info")}<span>YAZDİS bu metin için kriter öneremedi; lütfen kriteri seçin.</span></div>`
      : sg ? `<div class="sug-wait">${icon("sparkle")}<span>YAZDİS önerisi: <b>${sg.code}</b> · düzeltiyorsunuz.</span><button class="link sm" data-act="sug-back">Öneriye dön</button></div>` : "";
    return head + combos + stale + ocSel + tymmSel;
  },
  outcomeSelectHTML(d) {
    if (!(d.main === D.TYMM_MAIN || d.outcomeRef)) return "";
    const pageOcs = Doc.isDemo && d.page ? Pub.page(d.page).outcomes : [];
    const val = d.outcomeRef ? `${d.outcomeRef.code}|${d.outcomeRef.comp || ""}` : "";
    const opt = (v, l) => `<option value="${esc(v)}"${v === val ? " selected" : ""}>${esc(l)}</option>`;
    const short = (t) => (t.length > 64 ? t.slice(0, 62) + "…" : t);
    let html = `<section class="f-sec"><div class="f-lbl">İlgili öğrenme çıktısı / süreç bileşeni <span class="f-hint">isteğe bağlı</span></div><select class="input" data-foutcome>${opt("", "—")}`;
    if (pageOcs.length) {
      html += `<optgroup label="Bu sayfayla eşleştirilenler (yayınevi)">`;
      pageOcs.forEach((l) => { const o = Pub.outcome(l.code); html += opt(`${o.code}|`, `${o.code} · ${short(o.title)}`); l.comps.forEach((k) => { const c = o.comps.find((x) => x.k === k); html += opt(`${o.code}|${k}`, `   ${o.code} (${k}) ${short(c.text)}`); }); });
      html += `</optgroup>`;
    }
    D.OUTCOMES.forEach((o) => {
      html += `<optgroup label="${esc(o.code + " " + short(o.title))}">${opt(`${o.code}|`, `${o.code} (tümü)`)}${o.comps.map((c) => opt(`${o.code}|${c.k}`, `${o.code} (${c.k}) ${short(c.text)}`)).join("")}</optgroup>`;
    });
    html += `</select>`;
    if (d.outcomeRef) { const o = Pub.outcome(d.outcomeRef.code); const c = o && o.comps.find((x) => x.k === d.outcomeRef.comp); html += `<div class="oc-ref-text">${esc(c ? `${c.k}) ${c.text}` : o ? o.title : "")} <button class="link sm" data-outcome-open="${d.outcomeRef.code}">Çıktıyı aç</button></div>`; }
    return html + `</section>`;
  },
  comboFieldHTML(kind, d, err) {
    const open = UI.combo && UI.combo.kind === kind;
    const label = kind === "main" ? "Ana Kriter" : "Alt Kriter";
    let cur = null;
    if (kind === "main") { const c = D.CRITERIA.find((x) => x.name === d.main); if (c) cur = { code: c.code, text: c.name }; }
    else { const s = D.SUBS.find((x) => x.label === d.sub); if (s) cur = { code: s.code, text: s.text }; }
    const n = kind === "sub" && d.main ? D.SUBS.filter((s) => s.main === d.main).length : 0;
    const ph = kind === "main" ? "Ana kriter seçin veya arayın…" : d.main ? "Alt kriter seçin veya arayın…" : "Önce ana kriter seçin ya da tüm alt kriterlerde arayın…";
    let html = `<section class="f-sec${err[kind] ? " has-err" : ""}"><div class="f-lbl">${label} <span class="req">*</span>${n ? `<span class="f-hint">${n} seçenek</span>` : ""}</div>`;
    if (!open) {
      html += `<button type="button" class="combo-field${cur ? "" : " is-empty"}" data-combo-open="${kind}" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}${cur ? ": " + esc(cur.code + " " + cur.text) : ""}">${cur ? `<span class="cb-code">${cur.code}</span><span class="cb-text">${esc(cur.text)}</span>` : `<span class="cb-ph">${ph}</span>`}${icon("down", "cb-chev")}</button>`;
    } else {
      html += `<div class="combo" data-combo="${kind}"><div class="combo-search">${icon("search")}<input class="combo-input" data-combo-input="${kind}" role="combobox" aria-expanded="true" aria-controls="cbList-${kind}" aria-autocomplete="list" placeholder="${kind === "main" ? "Ana kriter ara…" : "Alt kriterlerde ara (kod veya kelime)…"}" value="${esc(UI.combo.q)}" autocomplete="off" spellcheck="false"><button type="button" class="icon-btn sm" data-combo-close aria-label="Listeyi kapat">${icon("x")}</button></div><div class="combo-list" id="cbList-${kind}" role="listbox">${this.comboItemsHTML(kind, d)}</div></div>`;
    }
    return html + `${err[kind] ? `<div class="err">${err[kind]}</div>` : ""}</section>`;
  },
  comboItems(kind, d) {
    const q = trLower((UI.combo && UI.combo.q) || "").trim();
    const m = (s) => !q || trLower(s).includes(q);
    if (kind === "main") {
      return D.CRITERIA.map((c) => {
        const subHits = q ? D.SUBS.filter((s) => s.main === c.name && trLower(s.text).includes(q)).length : 0;
        return { value: c.name, code: c.code, text: c.name, extra: q && !m(c.code + " " + c.name) && subHits ? `${subHits} alt kriterde eşleşme` : `${c.subs.length} alt kriter`, ok: m(c.code + " " + c.name) || subHits > 0 };
      }).filter((x) => x.ok);
    }
    const all = !d.main || (UI.combo && UI.combo.all);
    let list = D.SUBS.filter((s) => (all || s.main === d.main) && m(s.label));
    let widened = false;
    if (!list.length && !all && q) { list = D.SUBS.filter((s) => m(s.label)); widened = list.length > 0; }
    this._comboWidened = widened;
    return list.map((s) => ({ value: s.label, code: s.code, text: s.text, group: all || widened ? `${s.mainCode} ${s.main}` : null }));
  },
  comboItemsHTML(kind, d) {
    const items = this.comboItems(kind, d);
    this._comboItems = items;
    const q = (UI.combo && UI.combo.q || "").trim();
    const hi = (t) => { if (!q) return esc(t); const i = trLower(t).indexOf(trLower(q)); return i < 0 ? esc(t) : esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length)); };
    const curVal = kind === "main" ? d.main : d.sub;
    let html = kind === "sub" && this._comboWidened ? `<div class="cb-note">Seçili ana kriterde eşleşme yok; tüm alt kriterlerde gösteriliyor.</div>` : "", lastG = null;
    items.forEach((it, i) => {
      if (it.group && it.group !== lastG) { lastG = it.group; html += `<div class="cb-group">${esc(it.group)}</div>`; }
      const sel = it.value === curVal;
      html += `<button type="button" role="option" aria-selected="${sel}" class="cb-opt${i === UI.combo.active ? " is-active" : ""}${sel ? " is-selected" : ""}" data-combo-pick="${i}"><span class="cb-code">${hi(it.code)}</span><span class="cb-text"><span>${hi(it.text)}</span>${it.extra ? `<small>${esc(it.extra)}</small>` : ""}</span>${sel ? icon("check", "cb-check") : ""}</button>`;
    });
    if (!items.length) html += `<div class="cb-empty">“${esc(q)}” ile eşleşen kriter yok.</div>`;
    if (kind === "sub" && d.main && !(UI.combo && UI.combo.all)) html += `<button type="button" class="cb-all" data-combo-all>${icon("search")}Diğer ana kriterlerin alt kriterlerinde ara</button>`;
    return html;
  },
  renderCritBlock(focusCombo) {
    const el = $("#critBlock");
    if (!el || !S.draft) { this.render({ keepScroll: true }); return; }
    el.innerHTML = this.critBlockHTML(S.draft);
    if (UI.combo) {
      const inp = el.querySelector(".combo-input");
      if (inp && focusCombo !== false && !isCoarse()) { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); }
      const c = el.querySelector(".combo"); c && c.scrollIntoView({ block: "nearest" });
    }
  },
  comboMoveActive(dir) {
    const n = (this._comboItems || []).length; if (!n) return;
    UI.combo.active = UI.combo.active < 0 ? (dir > 0 ? 0 : n - 1) : (UI.combo.active + dir + n) % n;
    $$("#critBlock .cb-opt").forEach((b) => b.classList.toggle("is-active", +b.dataset.comboPick === UI.combo.active));
    const a = $("#critBlock .cb-opt.is-active"); a && a.scrollIntoView({ block: "nearest" });
  },

  /* ---------- Öğrenme çıktısı: süreç bileşenleri, yayınevi eşleştirmesi, öğretme-öğrenme uygulamaları */
  outcomeHTML(code) {
    const o = Pub.outcome(code);
    if (!o) { UI.view = { type: "list" }; return this.listViewHTML(); }
    const u = D.UNITS.find((x) => x.id === o.unitId);
    const onMain = Doc.isDemo;
    const link = onMain ? Pub.page(UI.page).outcomes.find((l) => l.code === code) : null;
    const idx = D.OUTCOMES.indexOf(o);
    const prev = D.OUTCOMES[(idx - 1 + D.OUTCOMES.length) % D.OUTCOMES.length], next = D.OUTCOMES[(idx + 1) % D.OUTCOMES.length];
    const media = Pub.data.media.filter((m) => m.outcome === code);
    const bp = Pub.outcomePages(code);
    let html = `<div class="rp-head detail"><button class="icon-btn sm" data-act="back" aria-label="Geri">${icon("back")}</button><div class="rp-title">Öğrenme Çıktısı</div><div class="pager"><button class="icon-btn sm" data-outcome-nav="${prev.code}" aria-label="Önceki öğrenme çıktısı">${icon("left")}</button><span>${idx + 1}/${D.OUTCOMES.length}</span><button class="icon-btn sm" data-outcome-nav="${next.code}" aria-label="Sonraki öğrenme çıktısı">${icon("right")}</button></div></div>`;
    html += `<div class="rp-body"><div class="tv">
      <div class="tv-head"><span class="oc-code lg">${o.code}</span><div><div class="tv-sub">Sosyal Bilgiler 7 · ${esc(u ? u.label : "")}</div><div class="ov-title">${esc(o.title)}</div></div></div>
      ${link ? `<div class="st-chip st-pub">${icon("book")}<span>Yayınevi <b>Sayfa ${UI.page}</b>'yi bu çıktının <b>${link.comps.join(", ")}</b> süreç ${link.comps.length > 1 ? "bileşenleriyle" : "bileşeniyle"} eşleştirdi.</span></div>` : ""}
      <section class="f-sec"><div class="f-lbl">Süreç Bileşenleri<span class="f-hint">yayınevinin eşleştirdiği ders kitabı sayfalarıyla</span></div><div class="ov-comps">`;
    o.comps.forEach((c) => {
      const pg = Pub.compPages(code, c.k);
      const here = link && link.comps.includes(c.k);
      html += `<div class="ov-comp${here ? " is-here" : ""}${pg.length ? "" : " is-gap"}"><span class="oc-k">${c.k})</span><div class="ov-cbody"><div class="ov-ct">${esc(c.text)}${here ? `<span class="here-badge">Bu sayfa</span>` : ""}</div><div class="oc-pages">${pg.length ? pg.map((n) => `<button class="pg-chip${onMain && n === UI.page ? " is-cur" : ""}" data-mpage="${n}">S.${n}</button>`).join("") : `<span class="md-warn">${icon("alert")}Hiçbir sayfayla eşleştirilmemiş</span><button class="link sm" data-oc-gap="${code}|${c.k}">${icon("plus")}Eksiklik tespiti</button>`}</div></div></div>`;
    });
    html += `</div></section>
      <section class="f-sec"><div class="f-lbl">Öğretme-Öğrenme Uygulamaları<span class="f-hint">kodların üzerine gelerek açıklamasını görün</span></div><div class="ov-practice">${codeChips(o.practice)}</div></section>
      ${o.values.length ? `<section class="f-sec"><div class="f-lbl">İlişkili değer ve eğilimler</div><div class="ov-vals">${o.values.map((c) => `<button class="tymm-code" data-tcomp-open="${c}" title="${esc(codeLabel(c))}">${c}</button><span>${esc((Q.comp(c) || {}).name || "")}</span>`).join("")}</div></section>` : ""}
      <section class="f-sec"><div class="f-lbl">İlişkili kaynaklar</div><div class="ov-links">
        <button class="pb-link" data-book-open="main:${bp[0] || ""}">${icon("book")}Ders kitabı ${D.rangeLabel(bp)}</button>
        ${o.guidePages ? `<button class="pb-link" data-book-open="guide:${o.guidePages[0]}">${icon("guide")}Öğretmen kılavuzu S.${o.guidePages[0]}–${o.guidePages[1]}</button>` : ""}
        ${o.workbookPages ? `<button class="pb-link" data-book-open="workbook:${o.workbookPages[0]}">${icon("workbook")}Çalışma kitabı S.${o.workbookPages[0]}–${o.workbookPages[1]}</button>` : ""}
        ${media.map((m) => `<button class="pb-link" data-mpage="${m.pages[0] || ""}"${m.pages.length ? "" : " disabled"}>${icon(m.type === "audio" ? "audio" : "media")}${esc(m.title)}${m.transcript ? "" : ` <span class="md-warn">· transkript yok</span>`}</button>`).join("")}
      </div></section>
      <div class="note">${icon("sparkle")}<span>YAZDİS, yayınevinin bu eşleştirmelerini kullanarak sayfa içeriğinin süreç bileşenlerini karşılayıp karşılamadığını analiz eder.</span></div>
    </div></div>`;
    html += `<div class="rp-foot wrap">${link ? `<button class="btn-ghost" data-oc-finding="${code}|${link.comps[0]}">${icon("plus")}Program uyumu tespiti (S.${UI.page})</button>` : `<button class="btn-ghost" data-oc-finding="${code}|">${icon("plus")}Program uyumu tespiti</button>`}</div>`;
    return html;
  },

  /* ---------- TYMM kanıt değerlendirmesi */
  tymmHTML(id) {
    const t = S.tymm.find((x) => x.id === id);
    if (!t) { UI.view = { type: "list" }; return this.listViewHTML(); }
    const c = Q.comp(t.code);
    const st = STATUS_TYMM[t.verificationStatus];
    const dr = (S.tymmDraft && S.tymmDraft.id === id) ? S.tymmDraft : null;
    const cov = dr && dr.coverageType ? dr.coverageType : t.coverageType;
    const editing = UI.tymmEdit === id;
    const u = Doc.unitOf(t.page);
    const sibs = Q.tymm().filter((x) => x.code === t.code && x.verificationStatus !== "rejected").sort((a, b) => a.page - b.page);
    const idx = sibs.findIndex((x) => x.id === id);
    const stText = t.verificationStatus === "candidate" ? "İncelemeci doğrulaması bekliyor" : t.verificationStatus === "verified" ? `${D.REVIEWERS[t.verifiedBy || "me"].short} doğruladı · ${fmtTime(t.verifiedAt)}` : t.verificationStatus === "insufficient" ? "Yetersiz / tartışmalı olarak işaretlendi" : "Eşleşme değil olarak işaretlendi";
    let html = `<div class="rp-head detail"><button class="icon-btn sm" data-act="back" aria-label="Geri">${icon("back")}</button><div class="rp-title">TYMM Eşleşmesi</div>${sibs.length > 1 && idx >= 0 ? `<div class="pager"><button class="icon-btn sm" data-tnav="${sibs[(idx - 1 + sibs.length) % sibs.length].id}" aria-label="Önceki kanıt">${icon("left")}</button><span>${idx + 1}/${sibs.length}</span><button class="icon-btn sm" data-tnav="${sibs[(idx + 1) % sibs.length].id}" aria-label="Sonraki kanıt">${icon("right")}</button></div>` : ""}</div>`;
    html += `<div class="rp-body"><div class="tv">
      <div class="tv-head"><span class="tymm-code lg">${t.code}</span><div><div class="tv-name">${t.code} · ${esc(c.name.toLocaleUpperCase("tr-TR"))}</div><div class="tv-sub">${c.type === "deger" ? "Değer" : "Eğilim"} · <button class="link" data-act="locate-tymm">Sayfa ${t.page}</button>${t.activityName ? " · " + esc(t.activityName) : ""}${u ? `<br>${esc(u.label)}` : ""}</div></div></div>
      <div class="st-chip ${st.cls}">${icon(st.icon)}<span><b>${st.label}</b> · ${stText}</span></div>
      <section class="f-sec"><div class="f-lbl">Seçilen Alan<span class="f-hint">${t.source === "YAZDİS" ? "YAZDİS tarafından işaretlendi" : "İncelemeci tarafından seçildi"}</span></div><blockquote class="sel-quote">“${esc(t.evidence.selectedText)}”</blockquote><button class="link sm" data-act="locate-tymm">${icon("locate")}PDF'de göster</button></section>
      ${t.source === "YAZDİS" && t.rationale ? `<section class="f-sec yz-block"><div class="f-lbl">${icon("sparkle")}YAZDİS Değerlendirmesi</div><p>${esc(t.rationale)}</p><div class="conf">Öneri: ${COVERAGE[t.coverageType]} biçimde işlenmiş${t.confidence ? ` · Model güveni %${Math.round(t.confidence * 100)}` : ""}</div></section>` : ""}
      <section class="f-sec"><div class="f-lbl">İşlenme Biçimi</div><div class="cov-opts" role="radiogroup">
        <label class="cov${cov === "explicit" ? " is-active" : ""}"><input type="radio" name="cov" value="explicit"${cov === "explicit" ? " checked" : ""} data-tcov><span><b>Açık</b><small>Değer/eğilim doğrudan ifade ediliyor</small></span></label>
        <label class="cov${cov === "implicit" ? " is-active" : ""}"><input type="radio" name="cov" value="implicit"${cov === "implicit" ? " checked" : ""} data-tcov><span><b>Örtük</b><small>Davranış, olay veya bağlam üzerinden işleniyor</small></span></label>
      </div></section>
      ${editing ? `<section class="f-sec"><div class="f-lbl">Eşleşmeyi düzenle</div><label class="stack">TYMM bileşeni<select class="input" data-tcode>${D.TYMM_COMPONENTS.map((x) => `<option value="${x.code}"${(dr && dr.code ? dr.code : t.code) === x.code ? " selected" : ""}>${x.code} · ${esc(x.name)}</option>`).join("")}</select></label><label class="stack">Etkinlik / bölüm<input class="input" data-tact value="${esc(dr && dr.activityName != null ? dr.activityName : t.activityName || "")}"></label></section>` : ""}
      <section class="f-sec"><div class="f-lbl">İncelemeci notu <span class="f-hint">isteğe bağlı</span></div><textarea class="input" rows="2" data-tnote data-autosize placeholder="Kısa not…">${esc(dr && dr.note != null ? dr.note : t.note || "")}</textarea></section>
      <div class="tv-hist"><div>${t.source === "YAZDİS" ? `${icon("sparkle")}YAZDİS tarafından önerildi · ${fmtTime(t.createdAt)}` : `${icon("user")}İncelemeci tarafından eklendi · ${fmtTime(t.createdAt)}`}</div>${t.verifiedAt ? `<div>${icon("check")}${esc(D.REVIEWERS[t.verifiedBy || "me"].short)} · ${STATUS_TYMM[t.verificationStatus].label} · ${fmtTime(t.verifiedAt)}</div>` : ""}</div>
      <button class="link" data-tcomp-open="${t.code}">${icon("grid")}${t.code} ${esc(c.name)} kapsam özetini aç</button>
    </div></div>`;
    let foot;
    if (t.verificationStatus === "candidate" || editing) {
      foot = `<button class="btn ok" data-act="t-verify">${icon("check")}İşlenmiş Olarak Doğrula</button>${editing ? "" : `<button class="btn-ghost" data-act="t-edit">${icon("pencil")}Düzenle</button>`}<button class="btn-ghost danger" data-act="t-reject">${icon("x")}Eşleşme Değil</button><button class="btn-ghost sm" data-act="t-insufficient" title="Yetersiz / tartışmalı">△ Yetersiz</button>`;
    } else {
      foot = `<span class="foot-st ${st.cls}">${icon(st.icon)}${st.label}</span><button class="btn-ghost sm push" data-act="t-reopen">${icon("undo")}Kararı değiştir</button>${t.verificationStatus === "insufficient" ? `<button class="btn-ghost sm" data-act="t-finding">${icon("plus")}Tespit oluştur</button>` : ""}`;
    }
    return html + `<div class="rp-foot wrap">${foot}</div>`;
  },

  /* ---------- TYMM bileşen kapsam özeti (ünite × bileşen) */
  tcompHTML(code, unitId) {
    const c = Q.comp(code);
    const units = Doc.units.filter((u) => u.no > 0);
    const unit = unitId ? Q.unitById(unitId) : null;
    const k = Q.tymmCounts(code, unitId);
    const sym = { verified: "✓", candidate: "○", insufficient: "△", none: "—" };
    let html = `<div class="rp-head detail"><button class="icon-btn sm" data-act="back" aria-label="Geri">${icon("back")}</button><div class="rp-title">TYMM Kapsamı</div></div><div class="rp-body"><div class="tv">
      <div class="tv-head"><span class="tymm-code lg">${c.code}</span><div><div class="tv-name">${c.code} · ${esc(c.name)}</div><div class="tv-sub">${c.type === "deger" ? "Değer" : "Eğilim"} · ${esc(c.desc)}</div></div></div>
      <div class="cov-strip" role="tablist"><button class="cs${!unitId ? " is-active" : ""}" data-tcell="${code}:">Tümü</button>${units.map((u) => { const cell = Q.tymmCell(code, u.id); const na = !cell.required && cell.sym === "none"; return `<button class="cs s-${cell.sym}${cell.sym === "none" && cell.required ? " miss" : ""}${na ? " na" : ""}${unitId === u.id ? " is-active" : ""}" data-tcell="${code}:${u.id}" title="${esc(u.label)}"><span>${u.short}</span><b>${na ? "·" : sym[cell.sym]}</b></button>`; }).join("")}</div>
      <div class="scope-title">${unit ? `${esc(unit.label)} <span class="muted">· S.${unit.start}–${unit.end}</span>` : "Kitap geneli"}</div>
      <div class="kpis"><div><b>${k.verified}</b><span>Doğrulanmış kanıt</span></div><div><b>${k.candidate}</b><span>YZ adayı</span></div><div><b>${k.insufficient}</b><span>Yetersiz</span></div></div>`;
    if (!k.verified) {
      const req = unit ? c.required.includes(unit.id) : true;
      html += `<div class="gap-box">${icon("alert")}<div><p>Bu kapsamda <b>${c.code} ${esc(c.name)}</b> için doğrulanmış bir içerik bulunmamaktadır.${!req ? " (Bu ünite için program beklentisi tanımlı değildir.)" : ""}</p>${k.candidate ? `<p class="muted">Doğrulama bekleyen ${k.candidate} YZ adayı var; tespit oluşturmadan önce adayları inceleyin.</p>` : ""}<button class="btn primary sm" data-act="gap-finding">${icon("plus")}Tespit Oluştur</button></div></div>`;
    }
    const list = k.list.filter((t) => t.verificationStatus !== "rejected").sort((a, b) => a.page - b.page);
    if (list.length) {
      html += `<div class="f-lbl">Kanıtlar</div><div class="ev-list">`;
      let last = null;
      list.forEach((t) => {
        const u = Doc.unitOf(t.page);
        if (!unitId && u && u.id !== last) { last = u.id; html += `<div class="ev-unit">${esc(u.label)}</div>`; }
        const st = STATUS_TYMM[t.verificationStatus];
        html += `<button class="ev-card${UI.selected === "t:" + t.id ? " is-selected" : ""}" data-key="t:${t.id}"><span class="ev-page">S.${t.page}</span><span class="ev-main"><span class="ev-act">${esc(t.activityName || "—")}</span><span class="ev-quote">“${esc(t.evidence.selectedText)}”</span></span><span class="ev-st ${st.cls}">${COVERAGE[t.coverageType]}<b>${st.sym}</b>${t.source === "YAZDİS" && t.verificationStatus === "candidate" ? "<i>YZ</i>" : ""}</span></button>`;
      });
      html += `</div>`;
    }
    const rel = D.OUTCOMES.filter((o) => o.values.includes(code));
    if (rel.length) html += `<div class="f-lbl">Programda bu ${c.type === "deger" ? "değeri" : "eğilimi"} hedefleyen öğrenme çıktıları</div><div class="ov-links">${rel.map((o) => `<button class="pb-link" data-outcome-open="${o.code}" title="${esc(o.title)}"><b>${o.code}</b> ${esc(o.title.length > 48 ? o.title.slice(0, 46) + "…" : o.title)}</button>`).join("")}</div>`;
    const rk = Q.tymmCounts(code).rejected;
    if (rk) html += `<p class="muted small">${rk} kayıt “Eşleşme değil” olarak işaretlendi ve listelenmiyor.</p>`;
    html += `<p class="muted small">PDF'de metin/alan seçip <b>TYMM eşleşmesi</b> ile yeni kanıt ekleyebilirsiniz.</p></div></div>`;
    return html;
  },

  /* ---------- seçimden insan kaynaklı TYMM kanıtı */
  tnewHTML() {
    const d = UI.tnew;
    if (!d) { UI.view = { type: "list" }; return this.listViewHTML(); }
    const e = d.evidence;
    return `<div class="rp-head detail"><button class="icon-btn sm" data-act="back" aria-label="Geri">${icon("back")}</button><div class="rp-title">Yeni TYMM Eşleşmesi</div></div>
      <div class="rp-body"><div class="form">
        <div class="note">${icon("info")}TYMM eşleşmesi bir hata kaydı değildir; program bileşeninin kitapta nerede işlendiğini gösterir.</div>
        <section class="f-sec sel-area"><div class="f-lbl">Seçilen Alan<span class="f-hint">Salt okunur · S.${e.page} · ${SEL_TYPE[e.selectionType]}</span></div>${e.selectionType !== "text" ? `<div class="crop-wrap">${Viewer.cropHTML(e.page, e.boundingBox, 300)}</div>` : ""}${e.selectedText ? `<blockquote class="sel-quote clamp">“${esc(e.selectedText)}”</blockquote>` : ""}</section>
        <section class="f-sec${UI.formErrors && UI.formErrors.code ? " has-err" : ""}"><div class="f-lbl">TYMM bileşeni <span class="req">*</span></div><select class="input" data-ncode><option value="">Seçiniz…</option><optgroup label="Değerler">${D.TYMM_COMPONENTS.filter((c) => c.type === "deger").map((c) => `<option value="${c.code}"${d.code === c.code ? " selected" : ""}>${c.code} · ${esc(c.name)}</option>`).join("")}</optgroup><optgroup label="Eğilimler">${D.TYMM_COMPONENTS.filter((c) => c.type === "egilim").map((c) => `<option value="${c.code}"${d.code === c.code ? " selected" : ""}>${c.code} · ${esc(c.name)}</option>`).join("")}</optgroup></select>${UI.formErrors && UI.formErrors.code ? `<div class="err">${UI.formErrors.code}</div>` : ""}</section>
        <section class="f-sec"><div class="f-lbl">İşlenme Biçimi</div><div class="cov-opts" role="radiogroup"><label class="cov${d.coverageType === "explicit" ? " is-active" : ""}"><input type="radio" name="ncov" value="explicit"${d.coverageType === "explicit" ? " checked" : ""} data-ncov><span><b>Açık</b><small>Doğrudan ifade ediliyor</small></span></label><label class="cov${d.coverageType === "implicit" ? " is-active" : ""}"><input type="radio" name="ncov" value="implicit"${d.coverageType === "implicit" ? " checked" : ""} data-ncov><span><b>Örtük</b><small>Davranış/bağlam üzerinden</small></span></label></div></section>
        <section class="f-sec"><div class="f-lbl">Etkinlik / bölüm</div><input class="input" data-nact value="${esc(d.activityName || "")}" placeholder="Örn. Etkinlik 2.1 · Bilgiyi Değerlendirelim"></section>
        <section class="f-sec"><div class="f-lbl">Not <span class="f-hint">isteğe bağlı</span></div><textarea class="input" rows="2" data-nnote data-autosize>${esc(d.note || "")}</textarea></section>
      </div></div>
      <div class="rp-foot"><button class="btn ok" data-act="tnew-save">${icon("check")}Doğrulanmış kanıt olarak kaydet</button><button class="btn-ghost" data-act="tnew-cancel">Vazgeç</button></div>`;
  },

  /* ---------- olaylar */
  bind() {
    const root = $("#rightInner");
    root.addEventListener("click", (e) => this.onClick(e));
    root.addEventListener("input", (e) => this.onInput(e));
    root.addEventListener("change", (e) => this.onChange(e));
    root.addEventListener("keydown", (e) => {
      if (e.target.hasAttribute && e.target.hasAttribute("data-combo-input")) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); this.comboMoveActive(e.key === "ArrowDown" ? 1 : -1); return; }
        if (e.key === "Enter") { e.preventDefault(); const it = (this._comboItems || [])[Math.max(0, UI.combo.active)]; if (it) App.pickCriterion(UI.combo.kind, it.value); return; }
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const k = UI.combo.kind; UI.combo = null; this.renderCritBlock(); const f = $(`#critBlock [data-combo-open="${k}"]`); f && f.focus(); return; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (UI.view.type === "form") { e.preventDefault(); App.saveDraft(); }
        else if (UI.view.type === "tnew") { e.preventDefault(); App.saveTymmNew(); }
      }
      if (e.key === "Enter" && e.target.classList.contains("card") && e.target === document.activeElement) App.select(e.target.dataset.key, { from: "list" });
    });
    root.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".card, .ev-card");
      const key = card && card.dataset.key;
      if (key === this._hk) return;
      if (this._hk) App.hover(this._hk, false);
      this._hk = key || null;
      if (key) App.hover(key, true);
    });
    root.addEventListener("mouseleave", () => { if (this._hk) { App.hover(this._hk, false); this._hk = null; } });
    document.addEventListener("pointerdown", (e) => {
      if (!UI.combo || e.target.closest(".combo, [data-combo-open]")) return;
      UI.combo = null;
      if (UI.view.type === "form") this.renderCritBlock(false);
    }, true);
  },
  onClick(e) {
    const t = e.target;
    const btn = t.closest("button, [data-act]");
    const card = t.closest(".card");
    const key = card ? card.dataset.key : null;
    const r = key ? Q.byKey(key) : null;
    if (btn) {
      const d = btn.dataset;
      if (d.rtab) { App.setRightTab(d.rtab); return; }
      if (d.strip) { UI.rightCollapsed = false; App.applyLayout(); App.setRightTab(d.strip); return; }
      if (d.scope) { App.setScope(d.scope); return; }
      if (d.unfilter) { delete UI.filters[d.unfilter]; if (d.unfilter === "main") delete UI.filters.sub; this.render(); return; }
      if (d.openKey) { App.select(d.openKey, { from: "list" }); return; }
      if (d.page && !d.act) { Viewer.goTo(+d.page); return; }
      if (d.tnav) { App.openTymm(d.tnav); return; }
      if (d.mpage) { App.gotoMainPage(+d.mpage); return; }
      if (d.bookOpen) { const [k, pg] = d.bookOpen.split(":"); App.openBook(k, +pg || null); return; }
      if (d.outcomeNav) { App.openOutcome(d.outcomeNav); return; }
      if (d.outcomeOpen) { App.openOutcome(d.outcomeOpen); return; }
      if (d.ocGap) { const [c, k] = d.ocGap.split("|"); App.outcomeFinding(c, k, "gap"); return; }
      if (d.ocFinding) { const [c, k] = d.ocFinding.split("|"); App.outcomeFinding(c, k, "page"); return; }
      if (d.tcompOpen) { if (!Doc.isDemo) App.openBook("main"); App.openTymmComp(d.tcompOpen, null); return; }
      if (d.tcell != null && d.tcell !== undefined && btn.hasAttribute("data-tcell")) { const [c, u] = d.tcell.split(":"); App.openTymmComp(c, u || null, { replace: true }); return; }
      if (btn.classList.contains("ev-card")) { App.select(d.key, { from: "list" }); return; }
      if (d.fscope) { App.updateDraft({ scope: d.fscope }, true); return; }
      if (d.critmode) return App.setCritMode(d.critmode);
      if (d.comboOpen) { UI.combo = { kind: d.comboOpen, q: "", active: -1, all: false }; this.renderCritBlock(); return; }
      if (btn.hasAttribute("data-combo-close")) { UI.combo = null; this.renderCritBlock(); return; }
      if (btn.hasAttribute("data-combo-all")) { UI.combo.all = true; UI.combo.active = -1; $("#critBlock .combo-list").innerHTML = this.comboItemsHTML(UI.combo.kind, S.draft); const i = $("#critBlock .combo-input"); i && !isCoarse() && i.focus(); return; }
      if (d.comboPick != null) { const it = this._comboItems[+d.comboPick]; if (it) App.pickCriterion(UI.combo.kind, it.value); return; }
      if (d.sugAlt != null) return App.suggestionAlt(+d.sugAlt);
      const act = d.act;
      if (!act) { if (card && !t.closest("input,textarea,label,select")) App.select(key, { from: "list" }); return; }
      switch (act) {
        case "collapse-right": UI.rightCollapsed = true; App.applyLayout(); this.render(); return;
        case "expand-right": UI.rightCollapsed = false; App.applyLayout(); this.render(); return;
        case "filter": return App.openFilter(btn);
        case "clear-filters": UI.filters = {}; this.render(); return;
        case "new-menu": return App.openNewMenu(btn);
        case "new-page-finding": return App.startFinding({ scope: "page", page: UI.page });
        case "resume-draft": UI.view = { type: "form" }; UI.pending = S.draft.evidence && S.draft.evidence.boundingBox ? Object.assign({ page: S.draft.page }, S.draft.evidence) : null; Viewer.refreshOverlays(); this.render(); return;
        case "expand": UI.expandedCards.has(key) ? UI.expandedCards.delete(key) : UI.expandedCards.add(key); if (UI.selected === key && !UI.expandedCards.has(key)) UI.selected = null; this.render({ keepScroll: true }); return;
        case "locate": if (key) App.select(key, { from: "list" }); return;
        case "edit": return App.editFinding(r.item.id);
        case "delete": return App.deleteFinding(r.item.id);
        case "yz-approve": return App.yzApprove(r.item.id);
        case "yz-edit": return App.yzEdit(r.item.id);
        case "yz-reject": UI.rejectOpen = r.item.id; UI.rejectDraft = {}; this.render({ keepScroll: true }); return;
        case "yz-reject-cancel": UI.rejectOpen = null; this.render({ keepScroll: true }); return;
        case "yz-reject-confirm": return App.yzReject(r.item.id, UI.rejectDraft.reason, UI.rejectDraft.note || "");
        case "yz-undo": return App.yzUndo(r.item.id);
        case "agree": return App.agree(r.item.id, "agree");
        case "disagree": UI.disagreeOpen = r.item.id; UI.disDraft = {}; this.render({ keepScroll: true }); setTimeout(() => { const ta = $("#rightInner [data-dis-note]"); ta && ta.focus(); }, 0); return;
        case "disagree-cancel": UI.disagreeOpen = null; this.render({ keepScroll: true }); return;
        case "disagree-save": return App.agree(r.item.id, "disagree", (UI.disDraft || {}).reason || "");
        case "agree-reset": delete S.agreements[r.item.id]; Store.changed(); this.render({ keepScroll: true }); return;
        case "back": return App.back();
        case "save-draft": return App.saveDraft();
        case "discard-draft": return App.discardDraft();
        case "delete-editing": return App.deleteFinding(S.draft.findingId, true);
        case "toggle-quote": UI.quoteOpen = !UI.quoteOpen; this.render({ keepScroll: true }); return;
        case "locate-draft": { const ev = S.draft.evidence; Viewer.goTo(S.draft.page || ev.page, { bbox: ev.boundingBox }); return; }
        case "locate-tymm": return Viewer.goToItem("t:" + UI.view.id);
        case "t-verify": return App.tymmSetStatus(UI.view.id, "verified");
        case "t-reject": return App.tymmSetStatus(UI.view.id, "rejected");
        case "t-insufficient": return App.tymmSetStatus(UI.view.id, "insufficient");
        case "t-edit": UI.tymmEdit = UI.view.id; this.render({ keepScroll: true }); return;
        case "t-reopen": return App.tymmReopen(UI.view.id);
        case "t-finding": { const tt = S.tymm.find((x) => x.id === UI.view.id); return App.gapFinding(tt.code, (Doc.unitOf(tt.page) || {}).id, tt); }
        case "gap-finding": return App.gapFinding(UI.view.code, UI.view.unitId);
        case "sug-accept": return App.suggestionAccept();
        case "sug-edit": return App.suggestionEdit();
        case "sug-back": S.draft.sugState = "shown"; S.draft.main = ""; S.draft.sub = ""; UI.combo = null; Store.changed(); this.renderCritBlock(); return;
        case "sug-manual": S.draft.sugState = "edit"; UI.combo = { kind: "main", q: "", active: -1 }; this.renderCritBlock(); return;
        case "sug-rerun": return App.runSuggestion(true);
        case "sug-use-text": return App.suggestionUseText();
        case "tnew-save": return App.saveTymmNew();
        case "tnew-cancel": UI.tnew = null; App.clearPending(); App.back(); return;
      }
      return;
    }
    if (card && !t.closest("input,textarea,label,select,a")) App.select(key, { from: "list" });
  },
  onInput(e) {
    const t = e.target;
    if (t.matches("textarea[data-autosize]")) autosize(t);
    if (t.hasAttribute("data-combo-input")) { UI.combo.q = t.value; UI.combo.active = t.value.trim() ? 0 : -1; $("#critBlock .combo-list").innerHTML = this.comboItemsHTML(UI.combo.kind, S.draft); return; }
    if (t.hasAttribute("data-ftext")) { App.updateDraft({ text: t.value }); const c = $("#rightInner [data-fcount]"); if (c) c.textContent = t.value.length + " karakter"; if (UI.formErrors && UI.formErrors.text) { UI.formErrors.text = null; } if (S.draft.critMode === "assist") App.scheduleSuggestion(); }
    else if (t.hasAttribute("data-factivity")) App.updateDraft({ activityName: t.value });
    else if (t.hasAttribute("data-rj-note")) UI.rejectDraft.note = t.value;
    else if (t.hasAttribute("data-dis-note")) UI.disDraft = { reason: t.value };
    else if (t.hasAttribute("data-tnote")) App.updateTymmDraft({ note: t.value });
    else if (t.hasAttribute("data-tact")) App.updateTymmDraft({ activityName: t.value });
    else if (t.hasAttribute("data-nact")) UI.tnew.activityName = t.value;
    else if (t.hasAttribute("data-nnote")) UI.tnew.note = t.value;
  },
  onChange(e) {
    const t = e.target;
    if (t.name && t.name.startsWith("rj-")) { UI.rejectDraft.reason = t.value; this.render({ keepScroll: true }); return; }
    if (t.hasAttribute("data-fpage")) { const n = clamp(+t.value || 1, 1, Doc.pageCount); App.updateDraft({ page: n }); return; }
    if (t.hasAttribute("data-funit")) { App.updateDraft({ unitId: t.value }); return; }
    if (t.hasAttribute("data-ftymm")) { App.updateDraft({ tymmCode: t.value }); return; }
    if (t.hasAttribute("data-foutcome")) { const [code, comp] = t.value.split("|"); App.updateDraft({ outcomeRef: code ? { code, comp: comp || "" } : null }); this.renderCritBlock(false); return; }
    if (t.hasAttribute("data-tcov")) { App.updateTymmDraft({ coverageType: t.value }); this.render({ keepScroll: true }); return; }
    if (t.hasAttribute("data-tcode")) { App.updateTymmDraft({ code: t.value }); return; }
    if (t.hasAttribute("data-ncode")) { UI.tnew.code = t.value; if (UI.formErrors) UI.formErrors.code = null; this.render({ keepScroll: true }); return; }
    if (t.hasAttribute("data-ncov")) { UI.tnew.coverageType = t.value; this.render({ keepScroll: true }); return; }
  },
};

function autosize(ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 420) + "px"; }
