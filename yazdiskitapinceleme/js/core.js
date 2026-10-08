/* Çekirdek: durum, kalıcılık (localStorage), yardımcılar, ikonlar */
"use strict";

const D = window.APP_DATA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const trLower = (s) => String(s || "").toLocaleLowerCase("tr-TR");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Bugün ${hm}`;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Dün ${hm}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hm}`;
}
const nowIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

/* ------------------------------------------------------------------ İkonlar */
const ICONS = {
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
  media: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  clip: '<path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10.2 17.7a1.7 1.7 0 0 1-2.4-2.4L15.5 7.6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
  sparkle: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
  fitWidth: '<path d="M3 12h18"/><path d="m7 8-4 4 4 4"/><path d="m17 8 4 4-4 4"/>',
  fitPage: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M12 7v10M9.5 9.5 12 7l2.5 2.5M9.5 14.5 12 17l2.5-2.5"/>',
  textCursor: '<path d="M8 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8M16 4h-3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3M9 12h6"/>',
  region: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="8" height="8" rx="1" stroke-dasharray="2 2"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  focus: '<circle cx="12" cy="12" r="3"/><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
  panelLeft: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  panelRight: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 4 4H6l4-4z"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9.5a4.3 4.3 0 0 1-1 8.5z"/><path d="m9.5 13 2 2 3.5-3.5"/>',
  cloudSync: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9.5a4.3 4.3 0 0 1-1 8.5z"/><path d="M12 10v5M9.5 12.5 12 10l2.5 2.5"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  thumbUp: '<path d="M7 10v11H3V10z"/><path d="M7 10l4-7a2.5 2.5 0 0 1 3 3l-1 4h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7"/>',
  thumbDown: '<path d="M7 14V3H3v11z"/><path d="M7 14l4 7a2.5 2.5 0 0 0 3-3l-1-4h6a2 2 0 0 0 2-2.3l-1.4-7A2 2 0 0 0 17.6 3H7"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".8" fill="currentColor"/><circle cx="3.5" cy="12" r=".8" fill="currentColor"/><circle cx="3.5" cy="18" r=".8" fill="currentColor"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  circleDash: '<circle cx="12" cy="12" r="9" stroke-dasharray="3.5 3"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  play: '<path d="m7 4 13 8-13 8z"/>', pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
  audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
  touch: '<path d="M9 11V5a2 2 0 0 1 4 0v5"/><path d="M13 10a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L5.3 15a2 2 0 0 1 3.4-2l.3.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  undo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  pageCheck: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 15 2 2 4-4"/>',
  triangle: '<path d="M12 4 3 20h18z"/>',
  dash: '<path d="M6 12h12"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  paper: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v5"/>',
  guide: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><circle cx="11.5" cy="10" r="2.5"/><path d="M8 16.5a3.5 3.5 0 0 1 7 0"/>',
  workbook: '<path d="M5 3h11l3 3v15H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
function icon(name, cls) { return `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`; }

/* ------------------------------------------------------------------ Durum */
const LS_KEY = "ttkb-inceleme-prototip-v2";

const S = {
  // kalıcı veri (backend'e taşınacak nesneler ayrı tutulur)
  config: { reviewMode: "panel", phase: 1, showOtherReviewerFindings: false },
  findings: [], yazdis: [], yazdisDecisions: {}, others: [], agreements: {}, tymm: [],
  pageStatus: {}, mediaStatus: {}, draft: null, tymmDraft: null,
  prefs: { leftExpanded: true, rightWidth: 400, theme: "light", paper: "white", tymmLayer: false, layers: { findings: true, yazdis: true }, zoom: null, fitMode: "width" },
  lastPage: 42,
  docs: {},
};

const UI = {
  page: 42, zoom: 1, fitMode: "width", tool: "text",
  leftTab: "content", tymmMode: "list", expandedUnits: new Set(), expandedSections: new Set(), expandedTymm: new Set(), pageFilter: "all",
  rightTab: "findings", scope: "page", filters: {}, view: { type: "list" }, viewStack: [],
  selected: null, hover: null, pending: null, expandedCards: new Set(), rejectOpen: null, disagreeOpen: null,
  flyout: false, rightCollapsed: false, focus: false, sheet: "half", layout: "desktop", drawer: false,
  saveState: "saved", savedAt: null,
};

const Store = {
  load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { saved = null; }
    if (saved && saved.version === 1) {
      Object.assign(S, saved.data);
      S.prefs = Object.assign({}, Store.defaultPrefs(), saved.data.prefs || {});
      UI.savedAt = saved.savedAt;
    } else {
      Store.reset(false);
    }
  },
  defaultPrefs() { return { leftExpanded: window.innerWidth >= 1440, rightWidth: 400, theme: "light", paper: "white", tymmLayer: false, layers: { findings: true, yazdis: true }, zoom: null, fitMode: "width" }; },
  reset(persist) {
    const seed = D.seed();
    S.config = { reviewMode: "panel", phase: 1, showOtherReviewerFindings: false };
    S.findings = seed.findings; S.yazdis = seed.yazdis; S.yazdisDecisions = seed.yazdisDecisions;
    S.others = seed.others; S.agreements = {}; S.tymm = seed.tymm;
    S.pageStatus = {}; S.pageStatus[D.DOC_ID] = {}; seed.reviewed.forEach((n) => (S.pageStatus[D.DOC_ID][n] = "reviewed"));
    S.mediaStatus = {}; D.MEDIA.forEach((m) => (S.mediaStatus[m.id] = m.reviewed));
    S.draft = null; S.tymmDraft = null; S.lastPage = 42; S.docs = {}; S.bookPages = { main: 42 };
    S.prefs = Store.defaultPrefs();
    if (persist) Store.persistNow();
  },
  persistNow() {
    const data = Object.assign({}, S);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ version: 1, savedAt: nowIso(), data }));
    } catch (e) { /* depolama kapalı olabilir: prototip yine çalışır */ }
    UI.saveState = "saved"; UI.savedAt = nowIso();
    if (window.App) App.renderSave();
  },
  _t: null,
  changed() {
    UI.saveState = "saving";
    if (window.App) App.renderSave();
    clearTimeout(Store._t);
    Store._t = setTimeout(Store.persistNow, 650);
  },
  prefsChanged() { clearTimeout(Store._p); Store._p = setTimeout(() => { try { const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null"); if (raw) { raw.data.prefs = S.prefs; raw.data.lastPage = S.lastPage; localStorage.setItem(LS_KEY, JSON.stringify(raw)); } else Store.persistNow(); } catch (e) {} }, 400); },
  snapshot() { return JSON.stringify({ findings: S.findings, yazdisDecisions: S.yazdisDecisions, agreements: S.agreements, tymm: S.tymm, pageStatus: S.pageStatus, draft: S.draft }); },
  restore(snap) { Object.assign(S, JSON.parse(snap)); Store.changed(); },
};

/* ------------------------------------------------------------------ Belge (demo kitap veya yüklenen PDF) */
const Doc = {
  type: "mock", bookKey: "main", book: D.BOOKS.main, id: D.DOC_ID, title: D.BOOK.title, subtitle: `${D.BOOK.subject} · ${D.BOOK.grade} · ${D.BOOK.publisher}`,
  pageCount: D.BOOK.pageCount, units: D.UNITS, pdf: null, sizes: null, texts: null,
  pageSize(n) { return this.sizes && this.sizes[n] ? this.sizes[n] : D.BOOK.pageSize; },
  unitOf(n) { return n ? this.units.find((u) => n >= u.start && n <= u.end) || null : null; },
  sectionOf(n) { const u = this.unitOf(n); if (!u || !u.sections) return null; let s = u.sections[0]; for (const sec of u.sections) if (n >= sec.start) s = sec; return s; },
  text(n) { return this.type === "mock" ? this.book.pageText(n) : (this.texts && this.texts[n]) || ""; },
  // isDemo: tohum kayıtları (tespit, YAZDİS, TYMM, diğer panelistler) olan ana ders kitabı
  get isDemo() { return this.type === "mock" && this.bookKey === "main"; },
  setBook(key) {
    const b = D.BOOKS[key];
    Object.assign(this, { type: "mock", bookKey: key, book: b, id: b.id, pdf: null, sizes: null, texts: null, pageCount: b.pageCount, units: b.units });
    this.title = b.title;
    this.subtitle = key === "main" ? `${D.BOOK.subject} · ${D.BOOK.grade} · ${D.BOOK.publisher}` : `${b.short} · ${D.BOOK.publisher}`;
  },
};

/* ------------------------------------------------------------------ Yayınevi beyanı: sayfa ↔ öğrenme çıktısı / değer-eğilim, medya ↔ sayfa
   Yayınevi panelinde (publisher.html) yapılan eşleştirmeler aynı tarayıcıda inceleme ekranına yansır. */
const PUB_KEY = "ttkb-yayinevi-prototip-v1";
const Pub = {
  data: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(PUB_KEY) || "null"); } catch (e) { raw = null; }
    this.data = raw && raw.version === 1 ? raw.data : D.seedPublisher();
    return this.data;
  },
  save() { try { localStorage.setItem(PUB_KEY, JSON.stringify({ version: 1, savedAt: nowIso(), data: this.data })); } catch (e) {} },
  reset() { this.data = D.seedPublisher(); this.save(); },
  page(n) { return (this.data.pages && this.data.pages[n]) || { outcomes: [], tymm: [] }; },
  outcome(code) { return D.OUTCOMES.find((o) => o.code === code) || null; },
  // süreç bileşeni → yayınevinin eşleştirdiği ders kitabı sayfaları
  compPages(code, k) {
    const out = [];
    Object.keys(this.data.pages).forEach((n) => { const l = this.data.pages[n].outcomes.find((x) => x.code === code); if (l && l.comps.includes(k)) out.push(+n); });
    return out.sort((a, b) => a - b);
  },
  outcomePages(code) {
    const out = [];
    Object.keys(this.data.pages).forEach((n) => { if (this.data.pages[n].outcomes.some((x) => x.code === code)) out.push(+n); });
    return out.sort((a, b) => a - b);
  },
  mediaForPage(n) { return this.data.media.filter((m) => m.pages.includes(n)); },
};
const codeLabel = (c) => { if (D.CODE_GLOSSARY[c]) return D.CODE_GLOSSARY[c]; const t = D.TYMM_COMPONENTS.find((x) => x.code === c); return t ? `${t.type === "deger" ? "Değer" : "Eğilim"}: ${t.name}` : ""; };
// Öğretme-öğrenme uygulaması metnindeki (OB1, D1, KB2.10 …) kodları etiketlenmiş çiplere dönüştürür
function codeChips(text) {
  return esc(text).replace(/\b(OB\d+|KB\d+\.\d+|SDB\d+\.\d+|SBAB\d+|D\d+|E\d+)\b/g, (m) => {
    const lbl = codeLabel(m);
    const tymm = D.TYMM_COMPONENTS.some((x) => x.code === m);
    return `<button type="button" class="code-chip${tymm ? " is-tymm" : ""}" ${tymm ? `data-tcomp-open="${m}"` : ""} title="${esc(lbl)}">${m}</button>`;
  });
}

/* ------------------------------------------------------------------ Sorgular */
const Q = {
  cfg() { return S.config; },
  phase() { return S.config.reviewMode === "panel" ? S.config.phase : null; },
  othersMode() {
    // "hidden" | "locked" | "evaluate" | "readonly"
    if (!Doc.isDemo) return "hidden";
    if (S.config.reviewMode === "panel") return S.config.phase === 1 ? "locked" : "evaluate";
    return S.config.showOtherReviewerFindings ? "readonly" : "hidden";
  },
  findings() { return S.findings.filter((f) => f.docId === Doc.id); },
  yazdis() { return S.yazdis.filter((y) => y.docId === Doc.id); },
  others() { return S.others.filter((o) => o.docId === Doc.id); },
  tymm() { return S.tymm.filter((t) => t.docId === Doc.id); },
  decision(yId) { return S.yazdisDecisions[yId] || null; },
  yzPending(y) { return !S.yazdisDecisions[y.id]; },
  reviewed(n) { return !!(S.pageStatus[Doc.id] && S.pageStatus[Doc.id][n] === "reviewed"); },
  reviewedCount() { const m = S.pageStatus[Doc.id] || {}; return Object.keys(m).filter((k) => m[k] === "reviewed" && +k <= Doc.pageCount).length; },
  comp(code) { return D.TYMM_COMPONENTS.find((c) => c.code === code); },
  unitById(id) { return Doc.units.find((u) => u.id === id); },
  byKey(key) {
    if (!key) return null;
    const [k, id] = key.split(":");
    const src = k === "f" ? S.findings : k === "y" ? S.yazdis : k === "o" ? S.others : k === "t" ? S.tymm : [];
    const item = src.find((x) => x.id === id);
    return item ? { kind: k, item } : null;
  },
  tymmCell(code, unitId) {
    const list = Q.tymm().filter((t) => t.code === code && Doc.unitOf(t.page) && Doc.unitOf(t.page).id === unitId && t.verificationStatus !== "rejected");
    const comp = Q.comp(code);
    const required = comp && comp.required.includes(unitId);
    let sym = "none";
    if (list.some((t) => t.verificationStatus === "verified")) sym = "verified";
    else if (list.some((t) => t.verificationStatus === "insufficient")) sym = "insufficient";
    else if (list.some((t) => t.verificationStatus === "candidate")) sym = "candidate";
    return { list, required, sym };
  },
  tymmCounts(code, unitId) {
    const list = Q.tymm().filter((t) => t.code === code && (!unitId || (Doc.unitOf(t.page) || {}).id === unitId));
    return {
      verified: list.filter((t) => t.verificationStatus === "verified").length,
      candidate: list.filter((t) => t.verificationStatus === "candidate").length,
      insufficient: list.filter((t) => t.verificationStatus === "insufficient").length,
      rejected: list.filter((t) => t.verificationStatus === "rejected").length,
      list,
    };
  },
  nextFindingNo() { return Q.findings().reduce((m, f) => Math.max(m, f.no || 0), 0) + 1; },
};

const STATUS_TYMM = {
  candidate: { label: "YZ adayı", short: "YZ adayı", sym: "◌", cls: "st-candidate", icon: "circleDash" },
  verified: { label: "Doğrulandı", short: "Doğrulanmış", sym: "✓", cls: "st-verified", icon: "checkCircle" },
  insufficient: { label: "Yetersiz / tartışmalı", short: "Yetersiz", sym: "△", cls: "st-insufficient", icon: "triangle" },
  rejected: { label: "Eşleşme değil", short: "Eşleşme değil", sym: "✕", cls: "st-rejected", icon: "x" },
};
const COVERAGE = { explicit: "Açık", implicit: "Örtük" };
const SCOPES = [
  { id: "selection", label: "Seçim" }, { id: "page", label: "Sayfa" }, { id: "activity", label: "Etkinlik" }, { id: "unit", label: "Ünite" }, { id: "book", label: "Kitap" },
];
const scopeLabel = (id) => (SCOPES.find((s) => s.id === id) || {}).label || id;
const SEL_TYPE = { text: "Metin seçimi", region: "Alan seçimi", image: "Görsel seçimi" };

/* ------------------------------------------------------------------ Bildirim (toast) */
function toast(msg, opts) {
  opts = opts || {};
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast" + (opts.kind ? " toast-" + opts.kind : "");
  el.innerHTML = `${opts.icon ? icon(opts.icon) : ""}<span>${esc(msg)}</span>${opts.action ? `<button class="toast-act">${esc(opts.action)}</button>` : ""}<button class="toast-x" aria-label="Kapat">${icon("x")}</button>`;
  box.appendChild(el);
  const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
  el.querySelector(".toast-x").onclick = close;
  if (opts.action) el.querySelector(".toast-act").onclick = () => { close(); opts.onAction && opts.onAction(); };
  setTimeout(close, opts.timeout || (opts.action ? 6500 : 3200));
  while (box.children.length > 3) box.firstChild.remove();
}
function withUndo(label, fn) {
  const snap = Store.snapshot();
  fn();
  Store.changed();
  toast(label, { action: "Geri al", icon: "check", onAction: () => { Store.restore(snap); App.refreshAll(); toast("İşlem geri alındı", { icon: "undo" }); } });
}

/* ------------------------------------------------------------------ Popover */
const Pop = {
  el: null, anchor: null, onClose: null,
  open(anchor, html, opts) {
    opts = opts || {};
    if (Pop.el && Pop.anchor === anchor && !opts.keep) { Pop.close(); return null; }
    Pop.close();
    const el = document.createElement("div");
    el.className = "popover " + (opts.cls || "");
    el.setAttribute("role", "dialog");
    el.innerHTML = html;
    document.body.appendChild(el);
    Pop.el = el; Pop.anchor = anchor; Pop.onClose = opts.onClose || null;
    anchor && anchor.setAttribute("aria-expanded", "true");
    Pop.position(opts.align || "start");
    opts.onMount && opts.onMount(el);
    return el;
  },
  position(align) {
    const el = Pop.el, a = Pop.anchor;
    if (!el || !a) return;
    const r = a.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let left = align === "end" ? r.right - w : r.left;
    left = clamp(left, 8, vw - w - 8);
    let top = r.bottom + 6;
    if (top + h > vh - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    top = clamp(top, 8, Math.max(8, vh - h - 8));
    el.style.left = left + "px"; el.style.top = top + "px";
  },
  close() {
    if (!Pop.el) return;
    Pop.anchor && Pop.anchor.setAttribute("aria-expanded", "false");
    Pop.el.remove();
    const cb = Pop.onClose;
    Pop.el = null; Pop.anchor = null; Pop.onClose = null;
    cb && cb();
  },
};
document.addEventListener("pointerdown", (e) => {
  if (!Pop.el) return;
  if (Pop.el.contains(e.target) || (Pop.anchor && Pop.anchor.contains(e.target))) return;
  Pop.close();
}, true);
