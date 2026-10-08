/* Yayınevi paneli (prototip): kitap/dosya yükleme, sayfa ↔ öğrenme çıktısı / değer-eğilim eşleştirme,
   medya ↔ sayfa eşleştirme, kontrol ve incelemeye gönderim. Veriler Pub (core.js) üzerinden saklanır ve inceleme ekranına yansır. */
"use strict";

const BOOKM = D.BOOKS.main;
const STEPS = [
  { id: 1, title: "Kitap ve dosyalar", icon: "upload" },
  { id: 2, title: "Sayfa eşleştirme", icon: "link" },
  { id: 3, title: "Medya eşleştirme", icon: "media" },
  { id: 4, title: "Kontrol ve gönderim", icon: "checkCircle" },
];
const PAGE_KINDS = { opener: "Ünite girişi", content: "Konu anlatımı", activity: "Etkinlik", assess: "Ölçme-değerlendirme", matter: "Ön / son sayfa" };
const PU = { step: 1, sel: [42], anchor: 42, view: "page", listFilter: "all", unit: "", addOc: false, ocQ: "", mediaFilter: "all", descOpen: null, bulk: { code: "", comps: [], tymm: [] }, savedAt: null, declare: false };

/* ------------------------------------------------------------------ yardımcılar */
function autoKind(n) {
  const p = BOOKM.pages[n];
  if (!p) return "matter";
  if (p.kind === "cover" || p.kind === "matter") return "matter";
  if (p.kind === "opener") return "opener";
  if (p.section === "Ünite Değerlendirme" || p.blocks.filter((b) => b.t === "q").length >= 2) return "assess";
  if (p.blocks.some((b) => b.t === "box" && (b.variant === "activity" || b.variant === "discuss"))) return "activity";
  return "content";
}
const pageKind = (n) => (Pub.data.pages[n] && Pub.data.pages[n].kind) || autoKind(n);
const needsMapping = (n) => ["content", "activity", "assess"].includes(pageKind(n));
function ensurePage(n) { return (Pub.data.pages[n] = Pub.data.pages[n] || { outcomes: [], tymm: [] }); }
function save(msg) {
  Pub.save(); PU.savedAt = nowIso();
  renderTop(); renderStepper();
  if (msg) toast(msg, { icon: "check" });
}
function checks() {
  const content = []; for (let n = 1; n <= BOOKM.pageCount; n++) if (needsMapping(n)) content.push(n);
  const unmapped = content.filter((n) => !Pub.page(n).outcomes.length);
  const gaps = [];
  D.OUTCOMES.forEach((o) => o.comps.forEach((c) => { if (!Pub.compPages(o.code, c.k).length) gaps.push({ code: o.code, k: c.k, text: c.text }); }));
  const totalComps = D.OUTCOMES.reduce((a, o) => a + o.comps.length, 0);
  const withValues = Object.keys(Pub.data.pages).filter((n) => Pub.data.pages[n].tymm.length).length;
  const media = Pub.data.media;
  const noPage = media.filter((m) => !m.pages.length), noTr = media.filter((m) => !m.transcript), noOc = media.filter((m) => !m.outcome);
  const f = Pub.data.files;
  return { content, unmapped, gaps, totalComps, withValues, noPage, noTr, noOc, files: f, filesOk: !!(f.main && f.guide) };
}
const typeLbl = (t) => (t === "audio" ? "Ses" : t === "video" ? "Video" : "Etkileşimli içerik");
const typeIcon = (t) => (t === "audio" ? "audio" : t === "video" ? "video" : "touch");
const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

/* YAZDİS eşleştirme önerisi (prototip): sayfa metni ile süreç bileşeni metinleri arasındaki ortak kelime kökleri */
const STOP = new Set(["ilişkin", "hakkında", "arasındaki", "yönelik", "üzerinden", "farklı", "temel", "örnekler", "açıklar", "belirler", "toplar", "yapar"]);
const stems = (t) => new Set(trLower(t).replace(/[^a-zçğıöşü\s]/g, " ").split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w)).map((w) => w.slice(0, 6)));
function suggestFor(n) {
  const ps = stems(BOOKM.pageText(n));
  const cur = Pub.page(n);
  const out = [];
  D.OUTCOMES.forEach((o) => o.comps.forEach((c) => {
    const l = cur.outcomes.find((x) => x.code === o.code);
    if (l && l.comps.includes(c.k)) return;
    const cs = stems(c.text + " " + (c.k === "a" ? o.title : ""));
    const shared = [...cs].filter((s) => ps.has(s));
    const unitBonus = BOOKM.unitOf(n).id === o.unitId ? 1 : 0;
    const score = shared.length + unitBonus;
    if (shared.length >= 2 || (shared.length >= 1 && unitBonus)) out.push({ code: o.code, k: c.k, text: c.text, shared, score });
  }));
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}

/* ------------------------------------------------------------------ üst bar ve adım çubuğu */
function renderTop() {
  $("#pubTop").innerHTML = `
    <div class="tb-left"><div class="brand"><div class="logo" aria-hidden="true"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#2a4a7f"/><path d="M8 9h7a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H8z" fill="#e8eefa"/><path d="M24 9h-4a2 2 0 0 0-2 2v13a2.4 2.4 0 0 1 2.4-2.4H24z" fill="#9fc0f5"/></svg></div>
      <div class="brand-txt"><div class="brand-sys">TTKB Ders Kitabı Yükleme · Yayınevi Paneli</div><div class="brand-book"><span class="bk-title">${esc(D.BOOK.title)}</span><span class="bk-meta">${esc(D.BOOK.publisher)} · Başvuru TTKB-2026-SB7-0142</span></div></div></div></div>
    <div class="tb-right">
      <div class="save-state" aria-live="polite">${icon("cloud")}<span>${PU.savedAt ? `Kaydedildi ✓<i> ${fmtTime(PU.savedAt).replace("Bugün ", "")}</i>` : "Taslak otomatik kaydedilir"}</span></div>
      <a class="phase pub-link" href="index.html" title="İnceleme ekranında yayınevi eşleştirmelerini görün">${icon("eye")}<span class="ph-long">İnceleme ekranı (prototip)</span><span class="ph-short">İnceleme</span></a>
      <button class="avatar" title="Örnek Yayınevi · Editör" aria-label="Kullanıcı">ÖY</button>
    </div>`;
}
function renderStepper() {
  const c = checks();
  const pct = Math.round(((c.content.length - c.unmapped.length) / c.content.length) * 100);
  const sub = {
    1: c.filesOk ? `${Object.values(c.files).filter(Boolean).length} dosya yüklendi` : "Zorunlu dosya eksik",
    2: `%${pct} eşleşti · ${c.gaps.length} bileşen eksik`,
    3: c.noPage.length + c.noTr.length ? `${c.noPage.length + c.noTr.length} eksik` : `${Pub.data.media.length} medya hazır`,
    4: Pub.data.submitted ? "Gönderildi" : "Gönderilmedi",
  };
  const done = { 1: c.filesOk, 2: !c.unmapped.length && !c.gaps.length, 3: !c.noPage.length && !c.noTr.length, 4: !!Pub.data.submitted };
  $("#stepper").innerHTML = `<div class="st-wrap">${STEPS.map((s) => `<button class="st-item${PU.step === s.id ? " is-active" : ""}${done[s.id] ? " is-done" : ""}" data-step="${s.id}" aria-current="${PU.step === s.id ? "step" : "false"}"><span class="st-num">${done[s.id] ? icon("check") : s.id}</span><span class="st-txt"><b>${s.title}</b><small class="${done[s.id] ? "" : s.id < 4 ? "warn" : ""}">${sub[s.id]}</small></span></button>`).join(`<span class="st-line" aria-hidden="true"></span>`)}</div>`;
}

/* ------------------------------------------------------------------ Adım 1: Kitap ve dosyalar */
function step1() {
  const f = Pub.data.files;
  const slot = (key, title, desc, required) => {
    const x = f[key];
    return `<div class="file-slot${x ? " is-up" : ""}">
      <div class="fs-ic">${icon(key === "main" ? "book" : key === "guide" ? "guide" : "workbook")}</div>
      <div class="fs-body"><div class="fs-title">${title} ${required ? `<span class="req">*</span>` : `<span class="muted small">(isteğe bağlı)</span>`}</div><div class="fs-desc">${desc}</div>
        ${x ? `<div class="fs-file">${icon("file")}<b>${esc(x.name)}</b><span>${esc(x.size)}${x.pages ? ` · ${x.pages} sayfa` : ""} · ${fmtTime(x.at)}</span></div>` : `<div class="fs-drop">${icon("upload")}PDF dosyasını sürükleyin veya seçin</div>`}
      </div>
      <div class="fs-acts"><label class="btn-ghost sm">${x ? "Değiştir" : "Dosya seç"}<input type="file" accept="application/pdf" hidden data-file="${key}"></label>${x && !required ? `<button class="btn-ghost sm danger" data-file-rm="${key}">Kaldır</button>` : ""}${x ? `<a class="btn-ghost sm" href="index.html" title="İnceleme ekranında aç">${icon("eye")}</a>` : ""}</div>
    </div>`;
  };
  const rows = D.OUTCOMES.map((o) => `<tr><td><span class="oc-code">${o.code}</span></td><td class="t-title">${esc(o.title)}</td><td>${D.rangeLabel(Pub.outcomePages(o.code))}</td><td>${o.guidePages ? `S.${o.guidePages[0]}–${o.guidePages[1]}` : "—"}</td><td>${f.workbook && o.workbookPages ? `S.${o.workbookPages[0]}–${o.workbookPages[1]}` : "—"}</td></tr>`).join("");
  return `<div class="pub-grid">
    <section class="card-p"><h3>Kitap bilgileri</h3><div class="meta-grid">
      ${[["Ders", D.BOOK.subject], ["Sınıf", D.BOOK.grade], ["Kitap adı", D.BOOK.title], ["Öğretim programı", "Türkiye Yüzyılı Maarif Modeli · Sosyal Bilgiler Dersi Öğretim Programı"], ["Yayınevi", D.BOOK.publisher], ["Başvuru no", "TTKB-2026-SB7-0142"]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}
    </div></section>
    <section class="card-p"><h3>Kitap dosyaları</h3><p class="muted">Öğretmen kılavuz kitabı ve öğrenci çalışma kitabı, inceleme ekranında ders kitabıyla birlikte sekme olarak açılır.</p>
      ${slot("main", "Ders Kitabı", "İncelenecek ana kitap (PDF, metin katmanlı)", true)}
      ${slot("guide", "Öğretmen Kılavuz Kitabı", "Öğrenme çıktısı bazında ders kitabıyla ilişkilendirilir", true)}
      ${slot("workbook", "Öğrenci Çalışma Kitabı", "Çalışmalar ders kitabı sayfalarına bağlanır", false)}
    </section>
    <section class="card-p wide"><h3>Kitaplar arası ilişki</h3><p class="muted">Kılavuz ve çalışma kitabı sayfaları öğrenme çıktıları üzerinden ders kitabıyla ilişkilendirilir. İnceleme ekranında panelist bir ders kitabı sayfasındayken ilgili kılavuz ve çalışma kitabı sayfasına tek tıkla geçebilir.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kod</th><th>Öğrenme çıktısı</th><th>Ders kitabı</th><th>Kılavuz</th><th>Çalışma kitabı</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>
  </div>
  <div class="pub-foot"><span></span><button class="btn" data-goto="2">Sonraki: Sayfa eşleştirme ${icon("right")}</button></div>`;
}

/* ------------------------------------------------------------------ Adım 2: Sayfa eşleştirme */
function s2HeadHTML() {
  const c = checks();
  const pct = Math.round(((c.content.length - c.unmapped.length) / c.content.length) * 100);
  const head = `<div class="s2-head"><div class="seg" role="radiogroup"><button class="${PU.view === "page" ? "is-active" : ""}" data-view="page">${icon("paper")}Sayfa görünümü</button><button class="${PU.view === "matrix" ? "is-active" : ""}" data-view="matrix">${icon("grid")}Kapsam tablosu</button></div>
    <div class="s2-prog"><span class="mini-bar wide"><i style="width:${pct}%"></i></span><span><b>${c.content.length - c.unmapped.length}/${c.content.length}</b> içerik sayfası eşleştirildi</span><span class="${c.gaps.length ? "c-miss" : ""}">${c.totalComps - c.gaps.length}/${c.totalComps} süreç bileşeni sayfada karşılandı</span></div></div>`;
  return head;
}
function step2() {
  const head = s2HeadHTML();
  if (PU.view === "matrix") return head + matrixHTML() + `<div class="pub-foot"><button class="btn-ghost" data-goto="1">${icon("left")}Geri</button><button class="btn" data-goto="3">Sonraki: Medya eşleştirme ${icon("right")}</button></div>`;
  return head + `<div class="s2-grid">
      <aside class="pl-pane">${pageListHTML()}</aside>
      <section class="pv-pane" id="pvPane">${previewHTML()}</section>
      <aside class="ed-pane" id="edPane">${editorHTML()}</aside>
    </div>`;
}
function pageListHTML() {
  const units = BOOKM.units;
  let html = `<div class="pl-tools"><select class="input" data-unit-filter><option value="">Tüm üniteler</option>${units.map((u) => `<option value="${u.id}"${PU.unit === u.id ? " selected" : ""}>${esc(u.label)}</option>`).join("")}</select>
    <div class="seg seg-sm">${[["all", "Tümü"], ["todo", "Eşleşmemiş"], ["done", "Eşleşmiş"]].map(([k, l]) => `<button class="${PU.listFilter === k ? "is-active" : ""}" data-lfilter="${k}">${l}</button>`).join("")}</div>
    <div class="pl-hint">${icon("info")}<span>Shift + tıklama ile aralık, kutucuklarla çoklu seçim yapın.</span></div></div><div class="pl-list" id="plList">`;
  units.forEach((u) => {
    if (PU.unit && PU.unit !== u.id) return;
    let rows = "";
    for (let n = u.start; n <= u.end; n++) {
      const pg = Pub.page(n), need = needsMapping(n), mapped = pg.outcomes.length > 0;
      if (PU.listFilter === "todo" && (!need || mapped)) continue;
      if (PU.listFilter === "done" && !mapped) continue;
      const on = PU.sel.includes(n);
      rows += `<div class="pl-row${on ? " is-sel" : ""}${need && !mapped ? " is-todo" : ""}" data-row="${n}"><input type="checkbox" data-chk="${n}"${on ? " checked" : ""} aria-label="Sayfa ${n} seç"><button class="pl-main" data-pick="${n}"><span class="pl-no">${n}</span><span class="pl-info"><span class="pl-sec">${esc(BOOKM.sectionOf(n).title)}</span><span class="pl-badges">${pg.outcomes.map((l) => `<i class="b-oc" title="${l.code} (${l.comps.join(", ")})">${l.code.replace("SB.7.", "")} ${l.comps.join("")}</i>`).join("")}${pg.tymm.map((c) => `<i class="b-v">${c}</i>`).join("")}${need && !mapped ? `<i class="b-warn">Eşleşmemiş</i>` : ""}${!need ? `<i class="b-na">${PAGE_KINDS[pageKind(n)]}</i>` : ""}</span></span></button></div>`;
    }
    if (rows) html += `<div class="pl-unit">${esc(u.label)} <span>${u.start}–${u.end}</span></div>${rows}`;
  });
  return html + `</div>`;
}
function previewHTML() {
  const n = PU.sel[0];
  if (!n) return `<div class="empty">Sayfa seçin.</div>`;
  return `<div class="pv-head"><button class="icon-btn sm" data-pnav="-1" aria-label="Önceki sayfa">${icon("left")}</button><span><b>Sayfa ${n}</b> · ${esc(BOOKM.unitOf(n).label)}</span><button class="icon-btn sm" data-pnav="1" aria-label="Sonraki sayfa">${icon("right")}</button></div><div class="pv-frame" id="pvFrame"><div class="pv-page">${paperHTML(n, BOOKM)}</div></div>`;
}
function fitPreview() {
  const f = $("#pvFrame"); if (!f) return;
  const pg = f.querySelector(".pv-page");
  const s = Math.min((f.clientWidth - 2) / 760, 1.2);
  pg.style.setProperty("--z", s);
  pg.style.width = 760 * s + "px"; pg.style.height = 1072 * s + "px";
}
function editorHTML() {
  if (PU.sel.length > 1) return bulkEditorHTML();
  const n = PU.sel[0]; if (!n) return "";
  const pg = Pub.page(n);
  const unit = BOOKM.unitOf(n);
  let html = `<div class="ed-head"><div><b>Sayfa ${n}</b><span>${esc(unit.label)} · ${esc(BOOKM.sectionOf(n).title)}</span></div><span class="kind-pill">${PAGE_KINDS[pageKind(n)]}</span></div><div class="ed-body">`;
  html += `<section class="ed-sec"><h4>${icon("cap")}Öğrenme çıktıları ve süreç bileşenleri</h4>`;
  if (!pg.outcomes.length) html += `<div class="note">${needsMapping(n) ? `${icon("alert")}Bu içerik sayfası henüz bir öğrenme çıktısıyla eşleştirilmedi.` : `${icon("info")}Bu sayfa türü için eşleştirme zorunlu değildir.`}</div>`;
  pg.outcomes.forEach((l) => {
    const o = Pub.outcome(l.code);
    html += `<div class="lk"><div class="lk-h"><span class="oc-code">${o.code}</span><span class="lk-t">${esc(o.title)}</span><button class="icon-btn sm" data-rm-oc="${o.code}" aria-label="${o.code} eşleştirmesini kaldır">${icon("x")}</button></div>
      <div class="lk-comps">${o.comps.map((c) => `<button class="cp${l.comps.includes(c.k) ? " on" : ""}" data-tog-comp="${o.code}|${c.k}" aria-pressed="${l.comps.includes(c.k)}"><b>${c.k})</b><span>${esc(c.text)}</span></button>`).join("")}</div></div>`;
  });
  if (PU.addOc) {
    const q = trLower(PU.ocQ.trim());
    const list = D.OUTCOMES.filter((o) => !pg.outcomes.some((l) => l.code === o.code)).filter((o) => !q || trLower(o.code + " " + o.title + " " + o.comps.map((c) => c.text).join(" ")).includes(q)).sort((a, b) => (b.unitId === unit.id) - (a.unitId === unit.id));
    html += `<div class="oc-picker"><div class="combo-search">${icon("search")}<input class="combo-input" data-oc-q value="${esc(PU.ocQ)}" placeholder="Kod veya kelime ile öğrenme çıktısı ara…" autocomplete="off"><button class="icon-btn sm" data-add-oc-close aria-label="Kapat">${icon("x")}</button></div><div class="oc-plist">${list.map((o) => `<button class="cb-opt" data-pick-oc="${o.code}"><span class="cb-code">${o.code}</span><span class="cb-text"><span>${esc(o.title)}</span>${o.unitId === unit.id ? `<small>Bu sayfanın ünitesi</small>` : ""}</span></button>`).join("") || `<div class="cb-empty">Eşleşen öğrenme çıktısı yok.</div>`}</div></div>`;
  } else html += `<button class="btn-ghost sm" data-add-oc>${icon("plus")}Öğrenme çıktısı ekle</button>`;
  html += `</section>`;
  const sug = suggestFor(n);
  html += `<section class="ed-sec yz"><h4>${icon("sparkle")}YAZDİS eşleştirme önerileri</h4>${sug.length ? sug.map((s) => `<div class="sg-row"><div><span class="oc-code">${s.code} (${s.k})</span> <span class="sg-t">${esc(s.text)}</span><div class="sg-why">Sayfada eşleşen ifadeler: ${s.shared.slice(0, 4).map((w) => `<i>${esc(w)}…</i>`).join(" ") || "ünite bağlamı"}</div></div><button class="btn-ghost sm" data-sug-add="${s.code}|${s.k}">${icon("plus")}Ekle</button></div>`).join("") : `<p class="muted small">Bu sayfa için ek öneri yok.</p>`}</section>`;
  html += `<section class="ed-sec"><h4>${icon("target")}Değerler ve eğilimler <span class="muted small">(YAZDİS sayfada doğrular)</span></h4><div class="val-grid">${D.TYMM_COMPONENTS.map((c) => `<button class="vchip${pg.tymm.includes(c.code) ? " on" : ""}" data-tog-val="${c.code}" aria-pressed="${pg.tymm.includes(c.code)}"><span class="tymm-code">${c.code}</span>${esc(c.name)}</button>`).join("")}</div></section>`;
  html += `<section class="ed-sec"><h4>${icon("paper")}Sayfa türü</h4><select class="input" data-kind>${Object.entries(PAGE_KINDS).map(([k, v]) => `<option value="${k}"${pageKind(n) === k ? " selected" : ""}>${v}${k === autoKind(n) ? " (otomatik)" : ""}</option>`).join("")}</select></section>`;
  html += `</div><div class="ed-foot"><button class="btn-ghost sm" data-copy-prev${n <= 1 ? " disabled" : ""}>${icon("copy")}Önceki sayfadan kopyala</button><button class="btn sm push" data-next-todo>Sonraki eşleşmemiş ${icon("right")}</button></div>`;
  return html;
}
function bulkEditorHTML() {
  const b = PU.bulk;
  const o = b.code ? Pub.outcome(b.code) : null;
  const pages = PU.sel.slice().sort((x, y) => x - y);
  return `<div class="ed-head"><div><b>${pages.length} sayfa seçili</b><span>S.${pages.slice(0, 8).join(", ")}${pages.length > 8 ? "…" : ""}</span></div><button class="btn-ghost sm" data-clear-sel>Seçimi temizle</button></div><div class="ed-body">
    <section class="ed-sec"><h4>${icon("cap")}Toplu öğrenme çıktısı ekle</h4><select class="input" data-bulk-oc><option value="">Öğrenme çıktısı seçin…</option>${BOOKM.units.filter((u) => u.no).map((u) => `<optgroup label="${esc(u.label)}">${D.OUTCOMES.filter((x) => x.unitId === u.id).map((x) => `<option value="${x.code}"${b.code === x.code ? " selected" : ""}>${x.code} · ${esc(x.title.slice(0, 70))}</option>`).join("")}</optgroup>`).join("")}</select>
      ${o ? `<div class="lk-comps">${o.comps.map((c) => `<button class="cp${b.comps.includes(c.k) ? " on" : ""}" data-bulk-comp="${c.k}"><b>${c.k})</b><span>${esc(c.text)}</span></button>`).join("")}</div>` : ""}</section>
    <section class="ed-sec"><h4>${icon("target")}Değerler ve eğilimler</h4><div class="val-grid">${D.TYMM_COMPONENTS.map((c) => `<button class="vchip${b.tymm.includes(c.code) ? " on" : ""}" data-bulk-val="${c.code}"><span class="tymm-code">${c.code}</span>${esc(c.name)}</button>`).join("")}</div></section>
  </div><div class="ed-foot"><button class="btn-ghost sm danger" data-bulk-clear>${icon("trash")}Eşleştirmeleri temizle</button><button class="btn sm push" data-bulk-apply${b.code || b.tymm.length ? "" : " disabled"}>${icon("check")}${pages.length} sayfaya uygula</button></div>`;
}
function matrixHTML() {
  let html = `<div class="card-p wide"><div class="tbl-wrap"><table class="tbl mx"><thead><tr><th>Kod</th><th>Süreç bileşeni</th><th>Eşleştirilen ders kitabı sayfaları</th><th>Durum</th></tr></thead><tbody>`;
  BOOKM.units.filter((u) => u.no).forEach((u) => {
    html += `<tr class="mx-u"><td colspan="4">${esc(u.label)}</td></tr>`;
    D.OUTCOMES.filter((o) => o.unitId === u.id).forEach((o) => {
      o.comps.forEach((c, i) => {
        const pg = Pub.compPages(o.code, c.k);
        html += `<tr class="${pg.length ? "" : "is-gap"}">${i === 0 ? `<td rowspan="${o.comps.length}" class="mx-oc"><span class="oc-code">${o.code}</span><div class="mx-ot">${esc(o.title)}</div></td>` : ""}<td><b>${c.k})</b> ${esc(c.text)}</td><td><div class="oc-pages">${pg.map((n) => `<button class="pg-chip" data-jump="${n}">S.${n}</button>`).join("") || "—"}</div></td><td>${pg.length ? `<span class="ok-t">${icon("check")}${pg.length} sayfa</span>` : `<span class="warn-t">${icon("alert")}Eşleşme yok</span>`}</td></tr>`;
      });
    });
  });
  return html + `</tbody></table></div></div>`;
}

/* ------------------------------------------------------------------ Adım 3: Medya */
function step3() {
  const media = Pub.data.media.filter((m) => PU.mediaFilter === "all" || !m.pages.length || !m.transcript || !m.outcome);
  const ocOpts = (cur) => `<option value="">— seçiniz —</option>${D.OUTCOMES.map((o) => `<option value="${o.code}"${cur === o.code ? " selected" : ""}>${o.code} · ${esc(o.title.slice(0, 60))}</option>`).join("")}`;
  let html = `<div class="s3-top"><label class="dropzone" id="dropzone">${icon("upload", "big")}<div><b>Video, ses veya etkileşimli içerik yükleyin</b><span>MP4, MP3, WAV, ZIP/HTML · Dosyaları sürükleyin veya tıklayın. Altyazı (.vtt, .srt) ya da transkript (.txt) eklemeyi unutmayın; YAZDİS yalnızca metni olan medyayı inceleyebilir.</span></div><input type="file" multiple hidden data-media-up accept="video/*,audio/*,.zip,.html"></label>
    <div class="seg seg-sm">${[["all", `Tümü (${Pub.data.media.length})`], ["issues", "Eksik olanlar"]].map(([k, l]) => `<button class="${PU.mediaFilter === k ? "is-active" : ""}" data-mfilter="${k}">${l}</button>`).join("")}</div></div><div class="mc-list">`;
  media.forEach((m) => {
    const issues = [];
    if (!m.pages.length) issues.push("Sayfa eşleşmesi yok");
    if (!m.outcome) issues.push("Öğrenme çıktısı seçilmedi");
    if (!m.transcript) issues.push("Transkript/altyazı yok");
    html += `<div class="mc${issues.length ? " has-issue" : ""}">
      <div class="mc-ic">${icon(typeIcon(m.type))}</div>
      <div class="mc-body">
        <div class="mc-row1"><input class="input mc-title" data-m-title="${m.id}" value="${esc(m.title)}" aria-label="Başlık"><select class="input mc-type" data-m-type="${m.id}">${["video", "audio", "interactive"].map((t) => `<option value="${t}"${m.type === t ? " selected" : ""}>${typeLbl(t)}</option>`).join("")}</select><span class="mc-file">${icon("file")}${esc(m.file)} · ${esc(m.duration)}</span><button class="icon-btn sm" data-m-rm="${m.id}" aria-label="Medyayı sil">${icon("trash")}</button></div>
        <div class="mc-grid">
          <div class="mc-f"><label>İlişkili ders kitabı sayfaları <small>(karekod bu sayfalarda yer alır)</small></label><div class="pchips">${m.pages.map((p) => `<span class="pchip">S.${p}<button data-m-rmpage="${m.id}|${p}" aria-label="S.${p} kaldır">${icon("x")}</button></span>`).join("")}<input class="input num-in" type="number" min="1" max="${BOOKM.pageCount}" placeholder="+ sayfa" data-m-addpage="${m.id}" aria-label="Sayfa ekle"></div></div>
          <div class="mc-f"><label>Öğrenme çıktısı</label><select class="input" data-m-oc="${m.id}">${ocOpts(m.outcome)}</select></div>
          <div class="mc-f"><label>YAZDİS için metin</label>${m.transcript ? `<div class="tr-ok">${icon("checkCircle")}<span>${esc(m.transcript)}</span><button class="link sm" data-m-rmtr="${m.id}">Kaldır</button></div>` : `<div class="tr-no"><span class="warn-t">${icon("alert")}Altyazı/transkript yok</span><label class="btn-ghost sm">Dosya yükle<input type="file" hidden accept=".vtt,.srt,.txt,.pdf" data-m-tr="${m.id}"></label><button class="btn-ghost sm" data-m-desc="${m.id}">Açıklama yaz</button></div>${PU.descOpen === m.id ? `<textarea class="input" rows="3" data-m-desctext="${m.id}" placeholder="Etkileşimli içeriğin veya ses kaydının kısa açıklaması / transkripti…"></textarea><div class="row-btns"><button class="btn sm" data-m-descsave="${m.id}">Kaydet</button></div>` : ""}`}</div>
        </div>
        <div class="mc-status">${issues.length ? issues.map((i) => `<span class="pill warn">${icon("alert")}${i}</span>`).join("") : `<span class="pill ok">${icon("check")}YAZDİS incelemesine hazır</span>`}</div>
      </div></div>`;
  });
  if (!media.length) html += `<div class="empty"><p>Eksik bilgisi olan medya yok.</p></div>`;
  return html + `</div><div class="pub-foot"><button class="btn-ghost" data-goto="2">${icon("left")}Geri</button><button class="btn" data-goto="4">Sonraki: Kontrol ve gönderim ${icon("right")}</button></div>`;
}

/* ------------------------------------------------------------------ Adım 4: Kontrol ve gönderim */
function step4() {
  const c = checks();
  const row = (ok, title, detail, step, warnOnly) => `<div class="ck-row ${ok ? "ok" : warnOnly ? "warn" : "err"}"><span class="ck-ic">${icon(ok ? "checkCircle" : "alert")}</span><div class="ck-body"><b>${title}</b><span>${detail}</span></div>${!ok && step ? `<button class="btn-ghost sm" data-goto="${step}">Düzelt</button>` : ""}</div>`;
  const pct = Math.round(((c.content.length - c.unmapped.length) / c.content.length) * 100);
  if (Pub.data.submitted) {
    return `<div class="card-p submit-ok">${icon("checkCircle", "big")}<h3>Kitap incelemeye gönderildi</h3><p>Başvuru no <b>TTKB-2026-SB7-0142</b> · ${fmtTime(Pub.data.submitted.at)}</p><p class="muted">YAZDİS ön analizi kuyruğa alındı. Analiz, yaptığınız sayfa ↔ öğrenme çıktısı, değer/eğilim ve medya eşleştirmelerini kullanır.</p><div class="row-btns"><a class="btn" href="index.html">${icon("eye")}İnceleme ekranında görüntüle</a><button class="btn-ghost" data-unsubmit>Gönderimi geri çek (prototip)</button></div></div>`;
  }
  const warns = (c.unmapped.length ? 1 : 0) + (c.gaps.length ? 1 : 0) + (c.noPage.length ? 1 : 0) + (c.noTr.length ? 1 : 0) + (c.noOc.length ? 1 : 0);
  return `<div class="pub-grid">
    <section class="card-p wide"><h3>Gönderim öncesi kontrol</h3>
      ${row(!!c.files.main, "Ders kitabı PDF", c.files.main ? `${esc(c.files.main.name)} · ${c.files.main.pages} sayfa` : "Yüklenmedi", 1)}
      ${row(!!c.files.guide, "Öğretmen kılavuz kitabı", c.files.guide ? esc(c.files.guide.name) : "Yüklenmedi", 1)}
      ${row(!!c.files.workbook, "Öğrenci çalışma kitabı (isteğe bağlı)", c.files.workbook ? esc(c.files.workbook.name) : "Yüklenmedi", 1, true)}
      ${row(!c.unmapped.length, "İçerik sayfalarının öğrenme çıktısıyla eşleştirilmesi", `%${pct} · ${c.content.length - c.unmapped.length}/${c.content.length} sayfa${c.unmapped.length ? ` · eşleşmemiş: ${c.unmapped.slice(0, 10).map((n) => `<button class="pg-chip" data-jump="${n}">S.${n}</button>`).join("")}${c.unmapped.length > 10 ? ` +${c.unmapped.length - 10}` : ""}` : ""}`, 2, true)}
      ${row(!c.gaps.length, "Süreç bileşeni kapsamı", `${c.totalComps - c.gaps.length}/${c.totalComps} bileşen en az bir sayfada karşılandı${c.gaps.length ? ` · eksik: ${c.gaps.map((g) => `<span class="oc-code sm" title="${esc(g.text)}">${g.code} (${g.k})</span>`).join(" ")}` : ""}`, 2, true)}
      ${row(c.withValues > 0, "Değer ve eğilim beyanı", `${c.withValues} sayfada değer/eğilim beyan edildi`, 2, true)}
      ${row(!c.noPage.length, "Medya ↔ sayfa eşleştirmesi", c.noPage.length ? `Sayfası olmayan: ${c.noPage.map((m) => esc(m.title)).join(", ")}` : `${Pub.data.media.length} medyanın tümü sayfalarla eşleşti`, 3, true)}
      ${row(!c.noOc.length, "Medya ↔ öğrenme çıktısı", c.noOc.length ? `${c.noOc.length} medya için öğrenme çıktısı seçilmedi` : "Tamamlandı", 3, true)}
      ${row(!c.noTr.length, "YAZDİS için altyazı / transkript", c.noTr.length ? `Eksik: ${c.noTr.map((m) => esc(m.title)).join(", ")}` : "Tüm medya metinli", 3, true)}
    </section>
    <section class="card-p wide"><h3>Beyan ve gönderim</h3>
      ${warns ? `<div class="note warn">${icon("alert")}<span>${warns} kontrol maddesinde uyarı var. Uyarılarla gönderebilirsiniz; ancak eksik eşleştirmeler YAZDİS ön analizinin kapsamını daraltır ve panelist incelemesinde uyarı olarak görünür.</span></div>` : ""}
      <label class="chk decl"><input type="checkbox" data-declare${PU.declare ? " checked" : ""}><span>Sayfa, öğrenme çıktısı, değer/eğilim ve medya eşleştirmelerinin doğru olduğunu beyan ederim.</span></label>
      <div class="row-btns"><button class="btn" data-submit${PU.declare ? "" : " disabled"}>${icon("upload")}${warns ? "Uyarılarla incelemeye gönder" : "İncelemeye gönder"}</button></div>
    </section>
  </div><div class="pub-foot"><button class="btn-ghost" data-goto="3">${icon("left")}Geri</button><span></span></div>`;
}

/* ------------------------------------------------------------------ çizim ve olaylar */
function render(keep) {
  renderStepper();
  const main = $("#pubMain");
  const listSt = keep && $("#plList") ? $("#plList").scrollTop : null;
  const edSt = keep && $("#edPane") ? $("#edPane").scrollTop : null;
  main.dataset.step = PU.step;
  main.innerHTML = PU.step === 1 ? step1() : PU.step === 2 ? step2() : PU.step === 3 ? step3() : step4();
  if (listSt != null && $("#plList")) $("#plList").scrollTop = listSt;
  if (edSt != null && $("#edPane")) $("#edPane").scrollTop = edSt;
  if (listSt == null && $("#plList")) { const r = $(`.pl-row[data-row="${PU.sel[0]}"]`); if (r) $("#plList").scrollTop = r.offsetTop - 80; }
  fitPreview();
}
function renderEditorOnly() {
  const ed = $("#edPane"); if (!ed) return render(true);
  const st = ed.scrollTop;
  ed.innerHTML = editorHTML(); ed.scrollTop = st;
  const pv = $("#pvPane"); if (pv) { pv.innerHTML = previewHTML(); fitPreview(); }
  const ls = $("#plList"); const lst = ls ? ls.scrollTop : 0;
  const pl = $(".pl-pane"); if (pl) { pl.innerHTML = pageListHTML(); $("#plList").scrollTop = lst; }
  renderStepper();
  const s2 = $(".s2-head"); if (s2) { const tmp = document.createElement("div"); tmp.innerHTML = s2HeadHTML(); s2.replaceWith(tmp.firstElementChild); }
}
function selectPage(n, mode) {
  n = clamp(n, 1, BOOKM.pageCount);
  if (mode === "range" && PU.anchor) { const a = Math.min(PU.anchor, n), b = Math.max(PU.anchor, n); PU.sel = []; for (let i = a; i <= b; i++) PU.sel.push(i); }
  else if (mode === "toggle") { PU.sel = PU.sel.includes(n) ? PU.sel.filter((x) => x !== n) : PU.sel.concat(n); if (!PU.sel.length) PU.sel = [n]; PU.anchor = n; }
  else { PU.sel = [n]; PU.anchor = n; }
  PU.addOc = false; PU.ocQ = "";
  renderEditorOnly();
  const row = $(`.pl-row[data-row="${n}"]`); row && row.scrollIntoView({ block: "nearest" });
}
function toggleComp(n, code, k) {
  const pg = ensurePage(n);
  let l = pg.outcomes.find((x) => x.code === code);
  if (!l) { l = { code, comps: [] }; pg.outcomes.push(l); }
  l.comps = l.comps.includes(k) ? l.comps.filter((x) => x !== k) : l.comps.concat(k).sort((a, b) => "abcçde".indexOf(a) - "abcçde".indexOf(b));
}

document.addEventListener("DOMContentLoaded", () => {
  try { const t = JSON.parse(localStorage.getItem("ttkb-inceleme-prototip-v2") || "null"); if (t && t.data && t.data.prefs && t.data.prefs.theme === "dark") document.documentElement.dataset.theme = "dark"; } catch (e) {}
  Pub.load();
  const hash = +(location.hash.match(/step=(\d)/) || [])[1];
  if (hash) PU.step = hash;
  renderTop(); render();
  window.addEventListener("resize", debounce(fitPreview, 100));
  window.addEventListener("storage", (e) => { if (e.key === PUB_KEY) { Pub.load(); render(true); } });

  $("#stepper").addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b) { PU.step = +b.dataset.step; history.replaceState(null, "", "#step=" + PU.step); render(); window.scrollTo(0, 0); } });

  const main = $("#pubMain");
  main.addEventListener("click", (e) => {
    const b = e.target.closest("button, [data-row]");
    if (!b) return;
    const d = b.dataset;
    const n = PU.sel[0];
    if (d.goto) { PU.step = +d.goto; history.replaceState(null, "", "#step=" + PU.step); render(); $("#pubMain").scrollTop = 0; return; }
    if (d.view) { PU.view = d.view; return render(); }
    if (d.jump) { PU.step = 2; PU.view = "page"; PU.listFilter = "all"; PU.unit = ""; render(); selectPage(+d.jump); return; }
    if (d.lfilter) { PU.listFilter = d.lfilter; return renderEditorOnly(); }
    if (d.pick) { selectPage(+d.pick, e.shiftKey ? "range" : e.ctrlKey || e.metaKey ? "toggle" : null); return; }
    if (d.pnav) { selectPage(n + +d.pnav); return; }
    if (d.fileRm) { Pub.data.files[d.fileRm] = null; save("Dosya kaldırıldı"); return render(); }
    if (d.rmOc) { const pg = ensurePage(n); pg.outcomes = pg.outcomes.filter((l) => l.code !== d.rmOc); save(); return renderEditorOnly(); }
    if (d.togComp) { const [c, k] = d.togComp.split("|"); toggleComp(n, c, k); save(); return renderEditorOnly(); }
    if (b.hasAttribute("data-add-oc")) { PU.addOc = true; PU.ocQ = ""; renderEditorOnly(); const i = $("[data-oc-q]"); i && i.focus(); return; }
    if (b.hasAttribute("data-add-oc-close")) { PU.addOc = false; return renderEditorOnly(); }
    if (d.pickOc) { const pg = ensurePage(n); if (!pg.outcomes.some((l) => l.code === d.pickOc)) pg.outcomes.push({ code: d.pickOc, comps: [] }); PU.addOc = false; save(`${d.pickOc} eklendi · süreç bileşenlerini işaretleyin`); return renderEditorOnly(); }
    if (d.sugAdd) { const [c, k] = d.sugAdd.split("|"); const pg = ensurePage(n); let l = pg.outcomes.find((x) => x.code === c); if (!l) { l = { code: c, comps: [] }; pg.outcomes.push(l); } if (!l.comps.includes(k)) l.comps.push(k); save(`YAZDİS önerisi eklendi: ${c} (${k})`); return renderEditorOnly(); }
    if (d.togVal) { const pg = ensurePage(n); pg.tymm = pg.tymm.includes(d.togVal) ? pg.tymm.filter((x) => x !== d.togVal) : pg.tymm.concat(d.togVal); save(); return renderEditorOnly(); }
    if (b.hasAttribute("data-copy-prev")) { const prev = Pub.page(n - 1); const pg = ensurePage(n); pg.outcomes = JSON.parse(JSON.stringify(prev.outcomes)); pg.tymm = prev.tymm.slice(); save(`S.${n - 1} eşleştirmesi kopyalandı`); return renderEditorOnly(); }
    if (b.hasAttribute("data-next-todo")) { const c = checks(); const nx = c.unmapped.find((x) => x > n) || c.unmapped[0]; if (nx) selectPage(nx); else toast("Eşleşmemiş içerik sayfası kalmadı", { icon: "check" }); return; }
    if (b.hasAttribute("data-clear-sel")) { PU.sel = [PU.sel[0]]; return renderEditorOnly(); }
    if (d.bulkComp) { const bk = PU.bulk; bk.comps = bk.comps.includes(d.bulkComp) ? bk.comps.filter((x) => x !== d.bulkComp) : bk.comps.concat(d.bulkComp); return renderEditorOnly(); }
    if (d.bulkVal) { const bk = PU.bulk; bk.tymm = bk.tymm.includes(d.bulkVal) ? bk.tymm.filter((x) => x !== d.bulkVal) : bk.tymm.concat(d.bulkVal); return renderEditorOnly(); }
    if (b.hasAttribute("data-bulk-apply")) {
      const bk = PU.bulk;
      PU.sel.forEach((p) => {
        const pg = ensurePage(p);
        if (bk.code) { let l = pg.outcomes.find((x) => x.code === bk.code); if (!l) { l = { code: bk.code, comps: [] }; pg.outcomes.push(l); } bk.comps.forEach((k) => { if (!l.comps.includes(k)) l.comps.push(k); }); }
        bk.tymm.forEach((c) => { if (!pg.tymm.includes(c)) pg.tymm.push(c); });
      });
      save(`${PU.sel.length} sayfaya eşleştirme uygulandı`); PU.bulk = { code: "", comps: [], tymm: [] }; return renderEditorOnly();
    }
    if (b.hasAttribute("data-bulk-clear")) {
      const snap = JSON.stringify(Pub.data.pages);
      PU.sel.forEach((p) => { if (Pub.data.pages[p]) Pub.data.pages[p] = { outcomes: [], tymm: [], kind: Pub.data.pages[p].kind }; });
      save(); renderEditorOnly();
      toast(`${PU.sel.length} sayfanın eşleştirmesi temizlendi`, { icon: "trash", action: "Geri al", onAction: () => { Pub.data.pages = JSON.parse(snap); save(); renderEditorOnly(); } });
      return;
    }
    if (d.mfilter) { PU.mediaFilter = d.mfilter; return render(); }
    if (d.mRm) { const snap = JSON.stringify(Pub.data.media); Pub.data.media = Pub.data.media.filter((m) => m.id !== d.mRm); save(); render(true); toast("Medya silindi", { icon: "trash", action: "Geri al", onAction: () => { Pub.data.media = JSON.parse(snap); save(); render(true); } }); return; }
    if (d.mRmpage) { const [id, p] = d.mRmpage.split("|"); const m = Pub.data.media.find((x) => x.id === id); m.pages = m.pages.filter((x) => x !== +p); save(); return render(true); }
    if (d.mRmtr) { Pub.data.media.find((x) => x.id === d.mRmtr).transcript = null; save(); return render(true); }
    if (d.mDesc) { PU.descOpen = d.mDesc; render(true); const t = $(`[data-m-desctext="${d.mDesc}"]`); t && t.focus(); return; }
    if (d.mDescsave) { const t = $(`[data-m-desctext="${d.mDescsave}"]`); if (t && t.value.trim().length > 5) { Pub.data.media.find((x) => x.id === d.mDescsave).transcript = "açıklama metni (" + t.value.trim().length + " karakter)"; PU.descOpen = null; save("Açıklama metni kaydedildi"); render(true); } else toast("Açıklama çok kısa", { icon: "alert" }); return; }
    if (b.hasAttribute("data-submit")) { Pub.data.submitted = { at: nowIso() }; save(); render(); window.scrollTo(0, 0); toast("Kitap incelemeye gönderildi", { icon: "check", kind: "ok" }); return; }
    if (b.hasAttribute("data-unsubmit")) { Pub.data.submitted = null; save(); return render(); }
  });
  main.addEventListener("change", (e) => {
    const t = e.target, d = t.dataset;
    const n = PU.sel[0];
    if (d.chk) { selectPage(+d.chk, "toggle"); return; }
    if (t.hasAttribute("data-unit-filter")) { PU.unit = t.value; const u = BOOKM.units.find((x) => x.id === t.value); renderEditorOnly(); if (u) selectPage(u.start); return; }
    if (t.hasAttribute("data-kind")) { ensurePage(n).kind = t.value === autoKind(n) ? undefined : t.value; save(); return renderEditorOnly(); }
    if (t.hasAttribute("data-bulk-oc")) { PU.bulk.code = t.value; PU.bulk.comps = []; return renderEditorOnly(); }
    if (d.file) {
      const f = t.files[0]; if (!f) return;
      Pub.data.files[d.file] = { name: f.name, size: fmtSize(f.size), pages: d.file === "main" ? BOOKM.pageCount : D.BOOKS[d.file].pageCount, at: nowIso() };
      save(`${f.name} yüklendi`); return render();
    }
    if (t.hasAttribute("data-media-up")) { addMediaFiles(t.files); t.value = ""; return; }
    if (d.mTitle) { Pub.data.media.find((x) => x.id === d.mTitle).title = t.value; save(); return; }
    if (d.mType) { Pub.data.media.find((x) => x.id === d.mType).type = t.value; save(); return render(true); }
    if (d.mOc) { Pub.data.media.find((x) => x.id === d.mOc).outcome = t.value; save(); return render(true); }
    if (d.mAddpage) { const p = clamp(+t.value, 1, BOOKM.pageCount); const m = Pub.data.media.find((x) => x.id === d.mAddpage); if (t.value && !m.pages.includes(p)) { m.pages.push(p); m.pages.sort((a, b) => a - b); save(`S.${p} eklendi`); } return render(true); }
    if (d.mTr) { const f = t.files[0]; if (f) { Pub.data.media.find((x) => x.id === d.mTr).transcript = f.name; save(`${f.name} eklendi`); render(true); } return; }
    if (t.hasAttribute("data-declare")) { PU.declare = t.checked; return render(true); }
  });
  main.addEventListener("input", (e) => {
    const t = e.target;
    if (t.hasAttribute("data-oc-q")) {
      PU.ocQ = t.value;
      const pos = t.selectionStart;
      renderEditorOnly();
      const i = $("[data-oc-q]"); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
    }
  });
  main.addEventListener("keydown", (e) => {
    if (e.target.hasAttribute("data-m-addpage") && e.key === "Enter") { e.preventDefault(); e.target.blur(); }
    if (e.target.matches("input, textarea, select")) return;
    if (PU.step === 2 && PU.view === "page" && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); selectPage(PU.sel[0] + (e.key === "ArrowDown" ? 1 : -1)); }
  });
  // medya sürükle-bırak
  main.addEventListener("dragover", (e) => { const z = e.target.closest("#dropzone"); if (z) { e.preventDefault(); z.classList.add("over"); } });
  main.addEventListener("dragleave", (e) => { const z = e.target.closest("#dropzone"); if (z) z.classList.remove("over"); });
  main.addEventListener("drop", (e) => { const z = e.target.closest("#dropzone"); if (z) { e.preventDefault(); z.classList.remove("over"); addMediaFiles(e.dataTransfer.files); } });
});

function addMediaFiles(files) {
  const added = [];
  [...files].forEach((f) => {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (["vtt", "srt", "txt"].includes(ext)) {
      const base = f.name.replace(/\.[^.]+$/, "");
      const m = Pub.data.media.find((x) => x.file.replace(/\.[^.]+$/, "") === base);
      if (m) { m.transcript = f.name; added.push(f.name); }
      return;
    }
    const type = ["mp3", "wav", "m4a", "ogg"].includes(ext) || (f.type || "").startsWith("audio") ? "audio" : ["zip", "html", "h5p"].includes(ext) ? "interactive" : "video";
    Pub.data.media.push({ id: uid("m"), type, title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), file: f.name, duration: type === "interactive" ? "Etkileşimli" : "—", pages: [], outcome: "", transcript: null });
    added.push(f.name);
  });
  if (added.length) { save(`${added.length} dosya eklendi · sayfa ve öğrenme çıktısı eşleştirmesini yapın`); PU.mediaFilter = "all"; render(true); }
}
