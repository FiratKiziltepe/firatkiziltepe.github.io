/* PDF çalışma alanı: sayfa çizimi, yakınlaştırma, işaretçiler, metin/alan seçimi, PDF.js ile gerçek PDF açma */
"use strict";

/* ------------------------------------------------------------------ Demo sayfa çizimi (PDF benzeri) */
function tint(hex, t) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const m = (c) => Math.round(c + (255 - c) * t);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function shade(hex, t) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const m = (c) => Math.round(c * (1 - t));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function figSVG(kind, color, seed, opts) {
  opts = opts || {};
  const c1 = tint(color, 0.82), c2 = tint(color, 0.55), c3 = tint(color, 0.3), c4 = color, dk = shade(color, 0.35);
  const s = (seed % 7) * 18;
  const open = '<svg viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">';
  switch (kind) {
    case "landscape":
      return `${open}<rect width="600" height="220" fill="${tint(color, 0.9)}"/><circle cx="${470 - s}" cy="56" r="26" fill="#f5c76b"/><path d="M0 170 L${90 + s} 70 L${200 + s} 150 L${300 + s} 60 L${430} 160 L520 95 L600 140 V220 H0Z" fill="${c2}"/><path d="M0 190 L140 130 L260 180 L380 120 L520 185 L600 160 V220 H0Z" fill="${c3}"/><rect y="196" width="600" height="24" fill="${tint(color, 0.15)}"/></svg>`;
    case "map": {
      const lg = opts.legend ? [tint(color, 0.75), tint(color, 0.5), tint(color, 0.25), "#e6b422"] : [c1, c2, c3, c4];
      return `${open}<rect width="600" height="220" fill="#dbeaf5"/><path d="M60 80 C120 40 220 50 300 62 C380 70 470 48 540 78 C560 110 530 150 470 160 C380 176 300 168 220 172 C150 176 80 160 60 130Z" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><path d="M220 60 C260 90 250 140 220 172 C300 168 330 120 300 62Z" fill="${c2}"/><path d="M380 70 C400 100 390 150 380 170 C430 168 500 158 530 140 C540 110 520 80 470 60Z" fill="${opts.legend ? "#9a3412" : c3}"/><path d="M60 80 C90 110 100 140 80 158 C120 172 150 170 180 168 C170 130 150 90 120 56Z" fill="${c4}" opacity=".85"/><g font-family="sans-serif" font-size="10" fill="#334155"><rect x="14" y="160" width="118" height="52" fill="#fff" stroke="#94a3b8"/>${lg.map((c, i) => `<rect x="20" y="${166 + i * 11}" width="14" height="8" fill="${c}"/><text x="40" y="${173 + i * 11}">${["0–50", "51–100", "101–200", "200+"][i]} kişi/km²</text>`).join("")}</g><path d="M560 24 l8 22 -8 -6 -8 6z" fill="#334155"/><text x="556" y="20" font-size="11" font-family="sans-serif" fill="#334155">K</text></svg>`;
    }
    case "building":
      return `${open}<rect width="600" height="220" fill="${tint(color, 0.88)}"/><rect x="150" y="40" width="300" height="170" fill="${c2}"/><path d="M230 210 V120 a70 70 0 0 1 140 0 V210Z" fill="${dk}" opacity=".85"/><path d="M250 210 V126 a50 50 0 0 1 100 0 V210Z" fill="${tint(color, 0.1)}" opacity=".7"/>${[60, 80, 100, 140, 160, 180].map((y) => `<path d="M150 ${y} H230 M370 ${y} H450" stroke="${c1}" stroke-width="2"/>`).join("")}<rect x="140" y="30" width="320" height="14" fill="${c3}"/><rect y="208" width="600" height="12" fill="${c3}"/></svg>`;
    case "people": {
      const fig = (x, h, col) => `<circle cx="${x}" cy="${206 - h - 18}" r="17" fill="#e8c4a0"/><path d="M${x - 26} 206 C${x - 26} ${206 - h + 20} ${x + 26} ${206 - h + 20} ${x + 26} 206Z" fill="${col}"/>`;
      return `${open}<rect width="600" height="220" fill="${tint(color, 0.9)}"/><rect x="60" y="40" width="480" height="96" rx="6" fill="#fff" opacity=".7"/>${fig(140, 96, c4)}${fig(240, 110, c3)}${fig(340, 90, "#64748b")}${fig(440, 104, c2)}<rect y="204" width="600" height="16" fill="${c2}"/></svg>`;
    }
    case "chart":
      return `${open}<rect width="600" height="220" fill="#fff"/><path d="M70 20 V190 H570" stroke="#64748b" stroke-width="2" fill="none"/>${[0, 1, 2, 3, 4, 5].map((i) => { const h = 40 + ((seed * (i + 3) * 37) % 120); return `<rect x="${100 + i * 75}" y="${190 - h}" width="42" height="${h}" fill="${i % 2 ? c3 : c4}"/>`; }).join("")}<g font-family="sans-serif" font-size="11" fill="#475569">${[0, 1, 2, 3, 4, 5].map((i) => `<text x="${104 + i * 75}" y="206">${2019 + i}</text>`).join("")}</g></svg>`;
    case "doc":
      return `${open}<rect width="600" height="220" fill="${tint("#b45309", 0.85)}"/><rect x="170" y="14" width="260" height="196" fill="#f6ead2" stroke="#c8a165"/>${Array.from({ length: 11 }, (_, i) => `<path d="M190 ${36 + i * 16} H${400 - ((i * 23) % 60)}" stroke="#8a6a3a" stroke-width="3" stroke-dasharray="${6 + (i % 3) * 3} 4"/>`).join("")}<circle cx="300" cy="120" r="34" fill="none" stroke="${c4}" stroke-width="2"/></svg>`;
    case "stele":
      return `${open}<rect width="600" height="220" fill="#e7e2d6"/><path d="M0 200 H600 V220 H0Z" fill="#c9bfa8"/><path d="M230 200 V40 Q300 6 370 40 V200Z" fill="#9c9483"/><path d="M240 196 V48 Q300 18 360 48 V196Z" fill="#aaa290"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${252 + i * 12} 60 v${120 - (i % 3) * 8}" stroke="#5d564a" stroke-width="2.4" stroke-dasharray="7 3 2 3"/>`).join("")}</svg>`;
    default:
      return `${open}<rect width="600" height="220" fill="${c1}"/></svg>`;
  }
}

function qrSVG(seed) {
  let cells = "";
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    const corner = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    if (corner) continue;
    if (((x * 7 + y * 13 + seed) % 5) < 2) cells += `<rect x="${x * 4}" y="${y * 4}" width="4" height="4"/>`;
  }
  const fin = (x, y) => `<rect x="${x}" y="${y}" width="12" height="12" fill="none" stroke="#111" stroke-width="2"/><rect x="${x + 4}" y="${y + 4}" width="4" height="4"/>`;
  return `<svg viewBox="-1 -1 38 38" width="64" height="64" fill="#111">${fin(0, 0)}${fin(24, 0)}${fin(0, 24)}${cells}</svg>`;
}

function blockHTML(b, n, color) {
  switch (b.t) {
    case "unitband": return `<div class="b-band">${esc(b.text)}</div>`;
    case "h2": return `<h2 class="b-h2">${esc(b.text)}</h2>`;
    case "h3": return `<h3 class="b-h3">${esc(b.text)}</h3>`;
    case "p": return `<p class="b-p${b.cls ? " " + b.cls : ""}">${esc(b.text)}</p>`;
    case "quote": return `<blockquote class="b-quote">${esc(b.text)}</blockquote>`;
    case "verse": return `<div class="b-verse">${b.lines.map((l) => `<div>${esc(l)}</div>`).join("")}</div>`;
    case "fig": return `<figure class="b-fig${b.lowres ? " lowres" : ""}"><div class="fig-img" style="height:${b.h || 220}px">${figSVG(b.kind, color, n, b)}</div><figcaption>${esc(b.caption)}</figcaption></figure>`;
    case "box": return `<div class="b-box box-${b.variant}"><div class="box-head"><span class="box-tag">${esc(b.label)}</span><span class="box-title">${esc(b.title)}</span></div><div class="box-text">${esc(b.text)}</div></div>`;
    case "q": return `<div class="b-q"><div class="q-stem"><b>${b.no}.</b> ${esc(b.text)}</div><div class="q-opts">${b.options.map((o, i) => `<div><b>${"ABCD"[i]})</b> ${esc(o)}</div>`).join("")}</div></div>`;
    case "media": { const m = D.MEDIA.find((x) => x.id === b.media); return m ? `<div class="b-media"><div class="qr">${qrSVG(n)}</div><div><div class="m-kind">${m.type === "audio" ? "Ses" : m.type === "video" ? "Video" : "Etkileşimli içerik"} · ${esc(m.duration)}</div><div class="m-title">${esc(m.title)}</div><div class="m-hint">Karekodu okutarak içeriğe ulaşabilirsiniz.</div></div></div>` : ""; }
    case "tocunit": return `<div class="b-tocunit" style="--uc:${b.color}"><span>${esc(b.text)}</span><span>${b.page}</span></div>`;
    case "tocrow": return `<div class="b-tocrow"><span>${esc(b.text)}</span><i></i><span>${b.page}</span></div>`;
    case "term": return `<p class="b-term"><b>${esc(b.term)}:</b> ${esc(b.text)}</p>`;
    case "ref": return `<p class="b-ref">${esc(b.text)}</p>`;
    case "list": return `<ul class="b-list">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    default: return "";
  }
}

function paperHTML(n, book) {
  book = book || (typeof Doc !== "undefined" && Doc.book) || D.BOOKS.main;
  const p = book.pages[n];
  const u = book.unitOf(n);
  const color = u.color;
  let inner = "";
  if (p.kind === "cover") {
    inner = `<div class="cover"><div class="cover-top">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div><div class="cover-art">${figSVG("landscape", book.cover.color, 3)}</div><div class="cover-grade">ORTAOKUL VE İMAM HATİP ORTAOKULU</div><div class="cover-title">${esc(book.cover.title)}</div><div class="cover-sub" style="color:${book.cover.color}">${esc(book.cover.sub)}</div><div class="cover-pub">${esc(D.BOOK.publisher)}</div></div>`;
  } else if (p.kind === "opener") {
    inner = `<div class="opener"><div class="op-no">${u.no}. ÜNİTE</div><div class="op-title">${esc(u.title)}</div><div class="op-art">${figSVG(u.no % 2 ? "landscape" : "building", color, n)}</div><div class="op-box"><div class="op-h">Bu ünitede neler öğreneceğiz?</div>${u.sections.map((s) => `<div class="op-li">${esc(s.title)}</div>`).join("")}</div></div>`;
  } else {
    const head = p.kind === "matter" ? "" : `<div class="rhead"><span class="rh-u">${u.no}. ÜNİTE · ${esc(u.title.toLocaleUpperCase("tr-TR"))}</span><span class="rh-s">${esc(p.section)}</span></div>`;
    inner = `${head}<div class="pbody">${p.blocks.map((b) => blockHTML(b, n, color)).join("")}</div>`;
  }
  return `<div class="paper k-${p.kind}" style="--uc:${color}">${inner}<div class="pfoot ${n % 2 ? "r" : "l"}"><span>${n}</span></div></div>`;
}

/* ------------------------------------------------------------------ Geometri yardımcıları */
const GeoCache = new Map();
function unionRect(rs) {
  if (!rs || !rs.length) return null;
  let x1 = 1, y1 = 1, x2 = 0, y2 = 0;
  rs.forEach((r) => { x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h); });
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
function mergeRects(list) {
  list.sort((a, b) => a.y - b.y || a.x - b.x);
  const out = [];
  for (const r of list) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.y - r.y) < 0.006 && r.x <= last.x + last.w + 0.012) {
      const right = Math.max(last.x + last.w, r.x + r.w);
      last.x = Math.min(last.x, r.x); last.w = right - last.x; last.h = Math.max(last.h, r.h);
    } else out.push(Object.assign({}, r));
  }
  return out;
}
function normRects(clientRects, base) {
  const out = [];
  for (const r of clientRects) {
    if (r.width < 1 || r.height < 1) continue;
    out.push({ x: (r.left - base.left) / base.width, y: (r.top - base.top) / base.height, w: r.width / base.width, h: r.height / base.height });
  }
  return mergeRects(out).map((r) => ({ x: +r.x.toFixed(4), y: +r.y.toFixed(4), w: +r.w.toFixed(4), h: +r.h.toFixed(4) }));
}
function findTextRange(root, needle) {
  if (!root || !needle) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; let full = "";
  while (walker.nextNode()) { const t = walker.currentNode; nodes.push({ node: t, start: full.length }); full += t.nodeValue; }
  let idx = full.indexOf(needle);
  if (idx < 0) { idx = trLower(full).indexOf(trLower(needle)); }
  if (idx < 0) return null;
  const end = idx + needle.length;
  const range = document.createRange();
  let started = false;
  for (let i = 0; i < nodes.length; i++) {
    const { node, start } = nodes[i];
    const len = node.nodeValue.length;
    if (!started && idx < start + len) { range.setStart(node, idx - start); started = true; }
    if (started && end <= start + len) { range.setEnd(node, end - start); return range; }
  }
  return null;
}

/* ------------------------------------------------------------------ Görüntüleyici */
const Viewer = {
  el: null, pagesEl: null, shells: [], wraps: [], io: null, tops: null, visible: new Set(),

  init() {
    this.el = $("#viewer");
    this.pagesEl = $("#pages");
    this.selbar = document.createElement("div");
    this.selbar.className = "selbar";
    this.selbar.addEventListener("pointerdown", (e) => e.preventDefault());
    this.tip = document.createElement("div");
    this.tip.className = "mk-tip";
    document.body.appendChild(this.tip);
    this.bindScroll();
    this.bindPointer();
    this.bindSelection();
    this.bindZoomGestures();
    new ResizeObserver(debounce(() => { if (UI.fitMode !== "custom") this.fit(UI.fitMode, true); else this.invalidate(); }, 120)).observe(this.el);
    // Web fontları yüklenince metin yeniden akar; tohum kayıtların konumlarını yeniden hesapla
    if (document.fonts) {
      const relayout = () => { GeoCache.clear(); this.invalidate(); this.refreshOverlays(); this.repositionSelbar(); };
      document.fonts.ready.then(relayout);
      document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", debounce(relayout, 60));
    }
  },

  build() {
    const parts = [];
    for (let n = 1; n <= Doc.pageCount; n++) {
      const sz = Doc.pageSize(n);
      parts.push(`<div class="page-wrap" data-page="${n}"><div class="page-label"><span>Sayfa ${n}</span><span class="pl-st"></span></div><div class="page-shell" data-page="${n}" style="--pw:${sz.w};--ph:${sz.h}"><div class="page-content"></div><div class="ov"></div><div class="region-cap"></div></div></div>`);
    }
    this.pagesEl.innerHTML = parts.join("");
    this.wraps = $$(".page-wrap", this.pagesEl);
    this.shells = $$(".page-shell", this.pagesEl);
    this.pagesEl.classList.toggle("is-pdf", Doc.type === "pdf");
    GeoCache.clear();
    this.visible.clear();
    if (this.io) this.io.disconnect();
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const n = +en.target.dataset.page;
        if (en.isIntersecting) { this.visible.add(n); this.renderPage(n); }
        else { this.visible.delete(n); if (Doc.type === "pdf") this.maybeRelease(n); }
      });
    }, { root: this.el, rootMargin: "900px 0px" });
    this.shells.forEach((s) => this.io.observe(s));
    this.applyZoomVar();
    this.updateAllLabels();
  },

  shell(n) { return this.shells[n - 1] || null; },
  invalidate() { this.tops = null; },

  /* ---------- sayfa çizimi */
  renderPage(n, force) {
    const shell = this.shell(n);
    if (!shell) return;
    if (Doc.type === "mock") {
      if (shell.dataset.rendered && !force) return;
      shell.querySelector(".page-content").innerHTML = paperHTML(n);
      shell.dataset.rendered = "1";
      this.renderOverlay(n);
    } else {
      if (shell.dataset.rendered === String(UI.zoom) && !force) return;
      this.renderPdfPage(n, shell);
    }
  },
  ensureRendered(n) { const sh = this.shell(n); if (sh && !sh.dataset.rendered) this.renderPage(n); },

  async renderPdfPage(n, shell) {
    const token = Symbol("r"); shell._token = token;
    const zoom = UI.zoom;
    shell.dataset.rendered = String(zoom);
    try {
      const page = await Doc.pdf.getPage(n);
      if (shell._token !== token) return;
      const scale = zoom * 96 / 72;
      const vp = page.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width * dpr); canvas.height = Math.floor(vp.height * dpr);
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
      if (shell._token !== token) return;
      const tl = document.createElement("div");
      tl.className = "textLayer";
      tl.style.setProperty("--scale-factor", scale);
      const tc = await page.getTextContent();
      Doc.texts[n] = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ");
      const content = shell.querySelector(".page-content");
      content.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "pdf-page";
      wrap.appendChild(canvas); wrap.appendChild(tl);
      content.appendChild(wrap);
      const task = pdfjsLib.renderTextLayer({ textContentSource: tc, container: tl, viewport: vp, textDivs: [] });
      if (task && task.promise) await task.promise;
      this.renderOverlay(n);
    } catch (e) {
      shell.dataset.rendered = "";
      console.warn("Sayfa çizilemedi", n, e);
    }
  },
  maybeRelease(n) {
    if (Math.abs(n - UI.page) < 6) return;
    const shell = this.shell(n);
    if (!shell || !shell.dataset.rendered) return;
    shell._token = null; shell.dataset.rendered = "";
    shell.querySelector(".page-content").innerHTML = "";
  },

  /* ---------- yakınlaştırma */
  applyZoomVar() { this.pagesEl.style.setProperty("--z", UI.zoom); this.invalidate(); },
  availWidth() { return this.el.clientWidth - (UI.layout === "mobile" ? 16 : 48); },
  visibleHeight() {
    let h = this.el.clientHeight;
    if (UI.layout !== "desktop") { const r = $("#right"); if (r) h -= Math.max(0, r.getBoundingClientRect().height - 8); }
    return Math.max(160, h);
  },
  fitZoom(mode) {
    const sz = Doc.pageSize(UI.page || 1);
    const zw = this.availWidth() / sz.w;
    if (mode === "page") return clamp(Math.min(zw, (this.visibleHeight() - 44) / sz.h), 0.2, 4);
    return clamp(zw, 0.2, 4);
  },
  fit(mode, silent) {
    UI.fitMode = mode;
    this.setZoom(this.fitZoom(mode), null, true);
    S.prefs.fitMode = mode; Store.prefsChanged();
    if (!silent) App.renderToolbar();
  },
  setZoom(z, point, keepFit) {
    z = clamp(+z.toFixed(3), 0.2, 4);
    if (!keepFit) { UI.fitMode = "custom"; S.prefs.fitMode = "custom"; S.prefs.zoom = z; Store.prefsChanged(); }
    if (Math.abs(z - UI.zoom) < 0.001) { App.renderToolbar(); return; }
    const vr = this.el.getBoundingClientRect();
    const px = point ? point.clientX : vr.left + this.el.clientWidth / 2;
    const py = point ? point.clientY : vr.top + Math.min(this.el.clientHeight * 0.3, 200);
    const shell = this.shellAtY(py) || this.shell(UI.page);
    let fx = 0.5, fy = 0;
    if (shell) { const sr = shell.getBoundingClientRect(); fx = (px - sr.left) / sr.width; fy = (py - sr.top) / sr.height; }
    UI.zoom = z;
    this.applyZoomVar();
    if (shell) {
      const sr2 = shell.getBoundingClientRect();
      this.el.scrollTop += sr2.top + fy * sr2.height - py;
      this.el.scrollLeft += sr2.left + fx * sr2.width - px;
    }
    this.afterZoom();
    App.renderToolbar();
  },
  afterZoom: debounce(function () {
    Viewer.invalidate();
    if (Doc.type === "pdf") Viewer.visible.forEach((n) => Viewer.renderPage(n));
    Viewer.refreshOverlays();
    Viewer.repositionSelbar();
  }, 140),
  zoomStep(dir) {
    const steps = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
    const z = UI.zoom;
    const next = dir > 0 ? steps.find((s) => s > z + 0.01) || 4 : [...steps].reverse().find((s) => s < z - 0.01) || 0.25;
    this.setZoom(next);
  },
  shellAtY(clientY) {
    const lo = Math.max(1, UI.page - 3), hi = Math.min(Doc.pageCount, UI.page + 3);
    for (let n = lo; n <= hi; n++) { const r = this.shell(n).getBoundingClientRect(); if (clientY >= r.top - 20 && clientY <= r.bottom + 20) return this.shell(n); }
    return null;
  },

  bindZoomGestures() {
    let raf = 0, acc = 1, pt = null;
    this.el.addEventListener("wheel", (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      acc *= Math.exp(-e.deltaY * 0.0075); pt = { clientX: e.clientX, clientY: e.clientY };
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; const z = UI.zoom * acc; acc = 1; this.setZoom(z, pt); });
    }, { passive: false });

    let pinch = null;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    this.el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
        const pr = this.pagesEl.getBoundingClientRect();
        pinch = { d0: dist(a, b), z0: UI.zoom, s: 1, cx, cy };
        this.pagesEl.style.transformOrigin = `${cx - pr.left}px ${cy - pr.top}px`;
      }
    }, { passive: true });
    this.el.addEventListener("touchmove", (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const [a, b] = e.touches;
      const target = clamp(pinch.z0 * (dist(a, b) / pinch.d0), 0.25, 4);
      pinch.s = target / pinch.z0;
      this.pagesEl.style.transform = `scale(${pinch.s})`;
    }, { passive: false });
    const end = () => {
      if (!pinch) return;
      const p = pinch; pinch = null;
      this.pagesEl.style.transform = ""; this.pagesEl.style.transformOrigin = "";
      if (Math.abs(p.s - 1) > 0.02) this.setZoom(p.z0 * p.s, { clientX: p.cx, clientY: p.cy });
    };
    this.el.addEventListener("touchend", (e) => { if (e.touches.length < 2) end(); });
    this.el.addEventListener("touchcancel", end);
  },

  /* ---------- kaydırma ve geçerli sayfa */
  computeTops() { this.tops = this.wraps.map((w) => w.offsetTop); },
  pageAtScroll() {
    if (!this.tops) this.computeTops();
    const y = this.el.scrollTop + Math.min(this.el.clientHeight * 0.3, 260);
    let lo = 0, hi = this.tops.length - 1, ans = 0;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (this.tops[mid] <= y) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans + 1;
  },
  bindScroll() {
    let raf = 0;
    this.el.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const n = this.pageAtScroll();
        if (n !== UI.page) { UI.page = n; S.lastPage = n; Store.prefsChanged(); App.onPageChange(); }
        this.tip.classList.remove("show");
      });
    }, { passive: true });
  },
  goTo(n, opts) {
    opts = opts || {};
    n = clamp(Math.round(n) || 1, 1, Doc.pageCount);
    this.ensureRendered(n);
    const shell = this.shell(n);
    if (!shell) return;
    const sr = shell.getBoundingClientRect(), vr = this.el.getBoundingClientRect();
    let dy, dx = 0;
    if (opts.bbox) {
      const b = opts.bbox;
      dy = sr.top + b.y * sr.height - vr.top - this.visibleHeight() * 0.3;
      if (sr.width > this.el.clientWidth) dx = sr.left + (b.x + b.w / 2) * sr.width - vr.left - this.el.clientWidth / 2;
    } else {
      dy = sr.top - vr.top - 26;
      if (sr.width > this.el.clientWidth) dx = sr.left - vr.left - 8;
    }
    const far = Math.abs(dy) > this.el.clientHeight * 2.5;
    this.el.scrollTo({ top: this.el.scrollTop + dy, left: this.el.scrollLeft + dx, behavior: opts.instant || far ? "auto" : "smooth" });
    if (UI.page !== n) { UI.page = n; S.lastPage = n; App.onPageChange(); }
  },
  goToItem(key, opts) {
    const r = Q.byKey(key);
    if (!r) return;
    const it = r.item;
    if (!it.page) {
      if (it.scope === "unit" && it.unitId) { const u = Q.unitById(it.unitId); if (u) this.goTo(u.start); }
      return;
    }
    this.ensureRendered(it.page);
    const g = this.geomOf(it);
    this.goTo(it.page, { bbox: g ? g.bbox : null });
    setTimeout(() => this.pulse(key), opts && opts.noPulse ? 0 : 420);
  },
  pulse(key) {
    $$(`.mk[data-key="${key}"]`, this.pagesEl).forEach((m) => { m.classList.remove("pulse"); void m.offsetWidth; m.classList.add("pulse"); });
  },
  flashText(n, text) {
    this.goTo(n, { instant: true });
    requestAnimationFrame(() => {
      const shell = this.shell(n);
      const root = shell && shell.querySelector(Doc.type === "mock" ? ".paper" : ".textLayer");
      const range = findTextRange(root, text);
      if (!range) return;
      const rects = normRects(range.getClientRects(), shell.getBoundingClientRect());
      const bb = unionRect(rects);
      if (bb) this.goTo(n, { bbox: bb });
      const ov = shell.querySelector(".ov");
      rects.forEach((r) => {
        const d = document.createElement("div");
        d.className = "flash";
        Object.assign(d.style, { left: r.x * 100 + "%", top: r.y * 100 + "%", width: r.w * 100 + "%", height: r.h * 100 + "%" });
        ov.appendChild(d);
        setTimeout(() => d.remove(), 2600);
      });
    });
  },

  /* ---------- geometri */
  geomOf(item) {
    const e = item.evidence;
    if (!item.page || !e) return null;
    if (e.rects && e.rects.length) return { rects: e.rects, bbox: e.boundingBox || unionRect(e.rects), region: e.selectionType !== "text" };
    if (e.boundingBox) return { rects: [e.boundingBox], bbox: e.boundingBox, region: true };
    if (e.anchor === "page" || !e.selectedText) return null;
    if (GeoCache.has(item.id)) return GeoCache.get(item.id);
    const shell = this.shell(item.page);
    if (!shell || !shell.dataset.rendered || Doc.type !== "mock") return null;
    const paper = shell.querySelector(".paper");
    const range = findTextRange(paper, e.selectedText);
    let g = null;
    if (range) {
      const base = paper.getBoundingClientRect();
      if (e.anchor === "box" || e.anchor === "fig") {
        let el = range.startContainer.parentElement;
        el = el && el.closest(e.anchor === "fig" ? "figure" : ".b-box, .b-q");
        if (el) { const r = normRects([el.getBoundingClientRect()], base); g = { rects: r, bbox: r[0], region: true }; }
      }
      if (!g) { const r = normRects(range.getClientRects(), base); if (r.length) g = { rects: r, bbox: unionRect(r), region: false }; }
    }
    GeoCache.set(item.id, g);
    return g;
  },

  /* ---------- işaretçiler ve vurgular */
  overlayItems(n) {
    const items = [];
    const sel = UI.selected;
    const L = S.prefs.layers;
    Q.findings().forEach((f) => { if (f.page === n && (L.findings || sel === "f:" + f.id)) items.push({ key: "f:" + f.id, kind: "human", label: String(f.no), item: f, title: `Tespit ${f.no} · ${f.main} › ${f.sub}`, yz: f.origin === "yazdis" }); });
    Q.yazdis().forEach((y) => { if (y.page === n && ((L.yazdis && Q.yzPending(y)) || sel === "y:" + y.id)) items.push({ key: "y:" + y.id, kind: "ai", label: String(y.no), item: y, title: `YAZDİS önerisi ${y.no} · ${y.main} › ${y.sub}` }); });
    const om = Q.othersMode();
    if (om === "evaluate" || om === "readonly") Q.others().forEach((o) => { if (o.page === n && (UI.rightTab === "others" || sel === "o:" + o.id)) { const rv = D.REVIEWERS[o.reviewerId]; items.push({ key: "o:" + o.id, kind: "other", label: rv.tag + o.no, item: o, title: `${rv.role} · ${o.main} › ${o.sub}` }); } });
    Q.tymm().forEach((t) => { if (t.page === n && t.verificationStatus !== "rejected" && (S.prefs.tymmLayer || sel === "t:" + t.id)) items.push({ key: "t:" + t.id, kind: "tymm", label: t.code, item: t, title: `${t.code} · ${(Q.comp(t.code) || {}).name}` }); });
    if (UI.pending && UI.pending.page === n) items.push({ key: "pending", kind: "pending", label: "", item: { page: n, evidence: UI.pending }, title: "Seçilen alan" });
    return items;
  },
  renderOverlay(n) {
    const shell = this.shell(n);
    if (!shell || !shell.dataset.rendered) return;
    const ov = shell.querySelector(".ov");
    const sz = Doc.pageSize(n);
    const W = sz.w * UI.zoom, H = sz.h * UI.zoom;
    const items = this.overlayItems(n);
    let hl = "", mk = "";
    const placed = { left: [], right: [], top: [] };
    const coarse = isCoarse();
    const mh = coarse ? 28 : 24;
    const widthOf = (it) => it.kind === "human" ? mh : it.kind === "ai" ? 26 + it.label.length * 7 : it.kind === "other" ? 18 + it.label.length * 7 : it.kind === "tymm" ? 30 + it.label.length * 7 : 0;
    const topRow = [];
    items.forEach((it) => {
      const g = it.kind === "pending" ? { rects: it.item.evidence.rects || [it.item.evidence.boundingBox], bbox: it.item.evidence.boundingBox, region: it.item.evidence.selectionType !== "text" } : this.geomOf(it.item);
      const isSel = UI.selected === it.key;
      const cls = `${isSel ? " is-selected" : ""}${UI.hover === it.key ? " is-hover" : ""}`;
      if (g && g.rects) {
        g.rects.forEach((r) => {
          if (!r) return;
          hl += `<div class="hl hl-${it.kind}${g.region ? " hl-region" : ""}${it.kind === "tymm" ? " " + STATUS_TYMM[it.item.verificationStatus].cls : ""}${cls}" data-key="${it.key}" style="left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%"></div>`;
        });
      }
      if (it.kind === "pending") return;
      const w = widthOf(it);
      if (!g) { topRow.push({ it, w, cls }); return; }
      // İşaretçiler metni kapatmamak için sayfa kenar boşluğuna yerleştirilir (insan/diğer: sol, YAZDİS/TYMM: sağ)
      const side = it.kind === "human" || it.kind === "other" ? "left" : "right";
      const M = this.margins(n);
      let x = side === "left" ? Math.min(g.bbox.x, M.l) * W - w - 6 : Math.max(g.bbox.x + g.bbox.w, M.r) * W + 6;
      x = clamp(x, 2, W - w - 2);
      let y = g.bbox.y * H + Math.min(g.bbox.h * H, 22) / 2 - mh / 2;
      const col = placed[side];
      for (let k = 0; k < 14; k++) {
        const hit = col.find((p) => y < p.y + p.h + 3 && y + mh > p.y - 3 && x < p.x + p.w + 3 && x + w > p.x - 3);
        if (!hit) break;
        const nx = side === "left" ? hit.x - w - 4 : hit.x + hit.w + 4;
        if (nx >= 2 && nx + w <= W - 2) x = nx; else y = hit.y + hit.h + 4;
      }
      col.push({ x, y, w, h: mh });
      mk += this.markerHTML(it, x / W * 100, y / H * 100, cls);
    });
    let tx = W - 10;
    topRow.forEach(({ it, w, cls }) => { tx -= w; mk += this.markerHTML(it, tx / W * 100, 10 / H * 100, cls + " mk-pagelevel"); tx -= 6; });
    ov.innerHTML = `<div class="hl-layer">${hl}</div>${mk}`;
  },
  margins(n) {
    if (Doc.type === "mock") return { l: 72 / 760, r: 688 / 760 };
    const shell = this.shell(n);
    if (shell && shell._margins) return shell._margins;
    const spans = shell ? $$(".textLayer span", shell) : [];
    if (!spans.length) return { l: 0.07, r: 0.93 };
    const base = shell.getBoundingClientRect();
    let l = 1, r = 0;
    spans.forEach((s) => { const b = s.getBoundingClientRect(); if (b.width < 2) return; l = Math.min(l, (b.left - base.left) / base.width); r = Math.max(r, (b.right - base.left) / base.width); });
    shell._margins = { l: clamp(l, 0.02, 0.5), r: clamp(r, 0.5, 0.98) };
    return shell._margins;
  },
  markerHTML(it, xp, yp, cls) {
    const pos = `left:${xp}%;top:${yp}%`;
    if (it.kind === "human") return `<button class="mk mk-human${it.yz ? " yz-origin" : ""}${cls}" data-key="${it.key}" style="${pos}" aria-label="${esc(it.title)}">${esc(it.label)}</button>`;
    if (it.kind === "ai") return `<button class="mk mk-ai${cls}" data-key="${it.key}" style="${pos}" aria-label="${esc(it.title)}"><span class="mk-yz">YZ</span>${esc(it.label)}</button>`;
    if (it.kind === "other") return `<button class="mk mk-other${cls}" data-key="${it.key}" style="${pos}" aria-label="${esc(it.title)}">${esc(it.label)}</button>`;
    if (it.kind === "tymm") { const st = STATUS_TYMM[it.item.verificationStatus]; return `<button class="mk mk-tymm ${st.cls}${cls}" data-key="${it.key}" style="${pos}" aria-label="${esc(it.title)} · ${st.label}"><span class="mk-sym">${st.sym}</span>${esc(it.label)}</button>`; }
    return "";
  },
  refreshOverlays() { this.shells.forEach((s, i) => { if (s.dataset.rendered) this.renderOverlay(i + 1); }); },
  setHover(key, on) {
    UI.hover = on ? key : null;
    $$(".is-hover", this.pagesEl).forEach((e) => e.classList.remove("is-hover"));
    if (on && key) $$(`[data-key="${key}"]`, this.pagesEl).forEach((e) => e.classList.add("is-hover"));
  },
  updateAllLabels() { for (let n = 1; n <= Doc.pageCount; n++) this.updateLabel(n); },
  updateLabel(n) {
    const w = this.wraps[n - 1]; if (!w) return;
    const st = w.querySelector(".pl-st");
    st.innerHTML = Q.reviewed(n) ? `${icon("check")}İncelendi` : "";
  },

  /* ---------- işaretçi etkileşimleri */
  bindPointer() {
    this.pagesEl.addEventListener("click", (e) => {
      const mk = e.target.closest(".mk");
      if (mk) { e.stopPropagation(); App.select(mk.dataset.key, { from: "pdf" }); }
    });
    this.pagesEl.addEventListener("mouseover", (e) => {
      const mk = e.target.closest(".mk");
      if (!mk || mk === this._hoverMk) return;
      this._hoverMk = mk;
      App.hover(mk.dataset.key, true);
      this.showTip(mk);
    });
    this.pagesEl.addEventListener("mouseout", (e) => {
      const mk = e.target.closest(".mk");
      if (!mk || (e.relatedTarget && mk.contains(e.relatedTarget))) return;
      this._hoverMk = null;
      App.hover(mk.dataset.key, false);
      this.tip.classList.remove("show");
    });

    /* alan seçimi */
    let drag = null;
    this.pagesEl.addEventListener("pointerdown", (e) => {
      if (UI.tool !== "region") return;
      const cap = e.target.closest(".region-cap");
      if (!cap) return;
      e.preventDefault();
      const shell = cap.parentElement;
      const r = shell.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const box = document.createElement("div");
      box.className = "region-draw";
      cap.appendChild(box);
      drag = { shell, r, x, y, box, id: e.pointerId };
      cap.setPointerCapture(e.pointerId);
      this.hideSelbar();
    });
    this.pagesEl.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const x2 = clamp((e.clientX - drag.r.left) / drag.r.width, 0, 1), y2 = clamp((e.clientY - drag.r.top) / drag.r.height, 0, 1);
      const b = { x: Math.min(drag.x, x2), y: Math.min(drag.y, y2), w: Math.abs(x2 - drag.x), h: Math.abs(y2 - drag.y) };
      drag.b = b;
      Object.assign(drag.box.style, { left: b.x * 100 + "%", top: b.y * 100 + "%", width: b.w * 100 + "%", height: b.h * 100 + "%" });
    });
    const finish = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag; drag = null;
      d.box.remove();
      if (!d.b || d.b.w * d.r.width < 14 || d.b.h * d.r.height < 14) return;
      const n = +d.shell.dataset.page;
      const bb = { x: +d.b.x.toFixed(4), y: +d.b.y.toFixed(4), w: +d.b.w.toFixed(4), h: +d.b.h.toFixed(4) };
      const info = this.regionInfo(n, bb);
      UI.selDraft = { page: n, selectionType: info.image ? "image" : "region", selectedText: info.text, activityName: info.activityName, rects: [bb], boundingBox: bb, contextBefore: "", contextAfter: "" };
      UI.pending = UI.selDraft;
      this.renderOverlay(n);
      this.showSelbar(d.shell, bb);
    };
    this.pagesEl.addEventListener("pointerup", finish);
    this.pagesEl.addEventListener("pointercancel", finish);
  },
  regionInfo(n, bb) {
    const shell = this.shell(n);
    const base = shell.getBoundingClientRect();
    const toN = (r) => ({ x: (r.left - base.left) / base.width, y: (r.top - base.top) / base.height, w: r.width / base.width, h: r.height / base.height });
    const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    let image = false, activityName = ""; const texts = [];
    if (Doc.type === "mock") {
      $$("figure", shell).forEach((f) => { const r = toN(f.getBoundingClientRect()); if (inter(r, bb) > 0.5 * r.w * r.h || inter(r, bb) > 0.5 * bb.w * bb.h) image = true; });
      $$(".b-box", shell).forEach((el) => { const r = toN(el.getBoundingClientRect()); if (!activityName && inter(r, bb) > 0.4 * r.w * r.h) activityName = `${el.querySelector(".box-tag").textContent} · ${el.querySelector(".box-title").textContent}`; });
      $$(".b-p, .box-text, .q-stem, figcaption, .b-h2, .b-h3, .b-quote", shell).forEach((el) => { const r = toN(el.getBoundingClientRect()); if (inter(r, bb) > 0.35 * r.w * r.h) texts.push(el.textContent.trim()); });
    } else {
      $$(".textLayer span", shell).forEach((el) => { const r = toN(el.getBoundingClientRect()); if (r.w && inter(r, bb) > 0.5 * r.w * r.h) texts.push(el.textContent); });
    }
    const text = texts.join(" ").replace(/\s+/g, " ").trim();
    return { image, activityName, text: text.length > 400 ? text.slice(0, 400) + "…" : text };
  },

  /* ---------- metin seçimi ve bağlamsal araç çubuğu */
  bindSelection() {
    let t = 0;
    document.addEventListener("selectionchange", () => {
      clearTimeout(t);
      t = setTimeout(() => this.checkSelection(), isCoarse() ? 380 : 140);
    });
  },
  checkSelection() {
    if (UI.tool !== "text") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      if (UI.selDraft && UI.selDraft.selectionType === "text" && !UI.pending) { UI.selDraft = null; this.hideSelbar(); }
      return;
    }
    let range = sel.getRangeAt(0);
    const node = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const shell = node && node.closest && node.closest(".page-shell");
    if (!shell || !this.pagesEl.contains(shell)) return;
    const endNode = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
    if (!shell.contains(endNode)) {
      const root = shell.querySelector(".page-content");
      range = range.cloneRange();
      range.setEnd(root, root.childNodes.length);
    }
    const text = range.toString().replace(/\s+/g, " ").trim();
    if (text.length < 2) return;
    const n = +shell.dataset.page;
    const rects = normRects(range.getClientRects(), shell.getBoundingClientRect()).filter((r) => r.w > 0.002 && r.y >= -0.01 && r.y <= 1);
    if (!rects.length) return;
    const bbox = unionRect(rects);
    const full = Doc.text(n).replace(/\s+/g, " ");
    const idx = full.indexOf(text);
    const box = node.closest(".b-box");
    UI.selDraft = {
      page: n, selectionType: "text", selectedText: text, rects, boundingBox: bbox,
      activityName: box ? `${box.querySelector(".box-tag").textContent} · ${box.querySelector(".box-title").textContent}` : "",
      contextBefore: idx >= 0 ? full.slice(Math.max(0, idx - 160), idx).trim() : "",
      contextAfter: idx >= 0 ? full.slice(idx + text.length, idx + text.length + 160).trim() : "",
    };
    this.showSelbar(shell, bbox);
  },
  showSelbar(shell, bbox) {
    const sb = this.selbar;
    const region = UI.selDraft && UI.selDraft.selectionType !== "text";
    sb.innerHTML = `<button class="sb-main" data-sb="finding">${icon("plus")}Tespit oluştur</button><button data-sb="tymm" title="Bu alanı bir TYMM değer/eğilimiyle eşleştir">${icon("target")}TYMM eşleşmesi</button>${region ? "" : `<button class="sb-icon" data-sb="copy" title="Metni kopyala" aria-label="Metni kopyala">${icon("copy")}</button>`}<button class="sb-icon" data-sb="cancel" title="Vazgeç" aria-label="Vazgeç">${icon("x")}</button>`;
    sb.onclick = (e) => {
      const b = e.target.closest("[data-sb]"); if (!b) return;
      const act = b.dataset.sb;
      const draft = UI.selDraft;
      if (act === "copy") { try { navigator.clipboard.writeText(draft.selectedText); toast("Metin kopyalandı", { icon: "copy" }); } catch (err) {} return; }
      this.hideSelbar();
      window.getSelection().removeAllRanges();
      if (act === "cancel") { UI.selDraft = null; App.clearPending(); return; }
      if (act === "finding") App.startFinding({ evidence: draft });
      if (act === "tymm") App.startTymmFromSelection(draft);
    };
    shell.appendChild(sb);
    sb._shell = shell; sb._bbox = bbox;
    sb.classList.add("show");
    this.repositionSelbar();
  },
  repositionSelbar() {
    const sb = this.selbar;
    if (!sb.classList.contains("show") || !sb._shell) return;
    const shell = sb._shell, bbox = sb._bbox;
    const W = shell.clientWidth, H = shell.clientHeight;
    const sw = sb.offsetWidth, sh = sb.offsetHeight;
    let left = clamp((bbox.x + bbox.w / 2) * W - sw / 2, 4, Math.max(4, W - sw - 4));
    const below = isCoarse() || bbox.y * H < sh + 14;
    let top = below ? (bbox.y + bbox.h) * H + 10 : bbox.y * H - sh - 10;
    if (top + sh > H - 4 && !below) top = Math.max(4, bbox.y * H - sh - 10);
    sb.style.left = left + "px"; sb.style.top = top + "px";
  },
  hideSelbar() { this.selbar.classList.remove("show"); if (this.selbar.parentNode) this.selbar.remove(); },

  showTip(mk) {
    if (isCoarse()) return;
    const r = Q.byKey(mk.dataset.key);
    if (!r) return;
    const it = r.item;
    let html = "";
    if (r.kind === "t") {
      const c = Q.comp(it.code), st = STATUS_TYMM[it.verificationStatus];
      html = `<div class="tip-h">${esc(it.code)} · ${esc(c.name)}</div><div>${COVERAGE[it.coverageType]} işlenmiş</div><div class="tip-k">Etkinlik</div><div>${esc(it.activityName || "—")}</div><div class="tip-k">Kaynak</div><div>${it.source === "YAZDİS" ? "YAZDİS" : "İncelemeci"}</div><div class="tip-k">Durum</div><div>${it.verificationStatus === "candidate" ? "İncelemeci doğrulaması bekliyor" : st.label}</div>`;
    } else {
      const who = r.kind === "y" ? "YAZDİS Analizi" : r.kind === "o" ? D.REVIEWERS[it.reviewerId].role : `Tespit ${it.no}`;
      html = `<div class="tip-h">${esc(who)}</div><div class="tip-crit">${esc(it.main)} › ${esc(it.sub.length > 90 ? it.sub.slice(0, 88) + "…" : it.sub)}</div><div class="tip-txt">${esc(it.text.length > 120 ? it.text.slice(0, 120) + "…" : it.text)}</div>`;
    }
    this.tip.innerHTML = html;
    const mr = mk.getBoundingClientRect();
    this.tip.classList.add("show");
    const tw = this.tip.offsetWidth, th = this.tip.offsetHeight;
    let left = mr.right + 8; if (left + tw > window.innerWidth - 8) left = mr.left - tw - 8;
    let top = clamp(mr.top - 4, 8, window.innerHeight - th - 8);
    this.tip.style.left = left + "px"; this.tip.style.top = top + "px";
  },

  /* ---------- seçili alan önizlemesi (alan/görsel seçimlerinde) */
  cropHTML(page, bb, maxW) {
    if (!bb) return "";
    const sz = Doc.pageSize(page);
    const pad = 0.012;
    const b = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - pad), w: Math.min(1, bb.w + pad * 2), h: Math.min(1, bb.h + pad * 2) };
    const s = Math.min(maxW / (b.w * sz.w), 220 / (b.h * sz.h), 1.2);
    const w = Math.round(b.w * sz.w * s), h = Math.round(b.h * sz.h * s);
    if (Doc.type === "mock") {
      return `<div class="crop" style="width:${w}px;height:${h}px"><div class="crop-inner" style="transform:translate(${-b.x * sz.w * s}px,${-b.y * sz.h * s}px) scale(${s})">${paperHTML(page)}</div></div>`;
    }
    const shell = this.shell(page);
    const cv = shell && shell.querySelector("canvas");
    if (!cv) return "";
    const out = document.createElement("canvas");
    out.width = w * 2; out.height = h * 2;
    out.getContext("2d").drawImage(cv, b.x * cv.width, b.y * cv.height, b.w * cv.width, b.h * cv.height, 0, 0, out.width, out.height);
    return `<div class="crop" style="width:${w}px;height:${h}px"><img src="${out.toDataURL("image/jpeg", 0.8)}" alt="Seçilen bölge" width="${w}" height="${h}"></div>`;
  },

  /* ---------- gerçek PDF açma (PDF.js) */
  async loadPdfJs() {
    if (window.pdfjsLib) return;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = res; s.onerror = () => rej(new Error("PDF.js yüklenemedi (internet bağlantısı gerekli)."));
      document.head.appendChild(s);
    });
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  },
  async openPdf(file) {
    try {
      toast("PDF açılıyor…", { icon: "file" });
      await this.loadPdfJs();
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const first = await pdf.getPage(1);
      const vp = first.getViewport({ scale: 96 / 72 });
      const base = { w: Math.round(vp.width), h: Math.round(vp.height) };
      Doc.type = "pdf"; Doc.pdf = pdf; Doc.bookKey = null; Doc.book = null;
      Doc.id = `pdf:${file.name}:${file.size}`;
      Doc.title = file.name.replace(/\.pdf$/i, "");
      Doc.subtitle = `Yüklenen PDF · ${pdf.numPages} sayfa`;
      Doc.pageCount = pdf.numPages;
      Doc.sizes = Array(pdf.numPages + 1).fill(base);
      Doc.texts = {};
      Doc.units = await this.pdfUnits(pdf);
      S.pageStatus[Doc.id] = S.pageStatus[Doc.id] || {};
      App.onDocChange(1);
      this.indexPdfText(pdf);
    } catch (e) {
      console.error(e);
      toast(e.message || "PDF açılamadı", { kind: "error", icon: "alert" });
    }
  },
  async pdfUnits(pdf) {
    const total = pdf.numPages;
    let units = [];
    try {
      const outline = await pdf.getOutline();
      if (outline && outline.length) {
        for (const it of outline) {
          let dest = it.dest;
          if (typeof dest === "string") dest = await pdf.getDestination(dest);
          if (!Array.isArray(dest)) continue;
          const idx = await pdf.getPageIndex(dest[0]);
          units.push({ title: it.title, start: idx + 1 });
        }
        units.sort((a, b) => a.start - b.start);
        units = units.filter((u, i) => i === 0 || u.start !== units[i - 1].start);
      }
    } catch (e) { units = []; }
    if (!units.length) for (let s = 1; s <= total; s += 20) units.push({ title: `Sayfa ${s}–${Math.min(total, s + 19)}`, start: s });
    if (units[0].start > 1) units.unshift({ title: "Başlangıç", start: 1 });
    return units.map((u, i) => {
      const end = i < units.length - 1 ? units[i + 1].start - 1 : total;
      return { id: "pu" + i, no: i + 1, title: u.title, label: u.title, short: `B${i + 1}`, start: u.start, end, color: "#1f5fd1", sections: [{ title: u.title, start: u.start, end }] };
    });
  },
  async indexPdfText(pdf) {
    for (let n = 1; n <= pdf.numPages; n++) {
      if (Doc.pdf !== pdf) return;
      if (Doc.texts[n]) continue;
      try {
        const page = await pdf.getPage(n);
        const tc = await page.getTextContent();
        Doc.texts[n] = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ");
        const vp = page.getViewport({ scale: 96 / 72 });
        const sz = Doc.sizes[n];
        if (Math.abs(vp.width - sz.w) > 2 || Math.abs(vp.height - sz.h) > 2) {
          Doc.sizes[n] = { w: Math.round(vp.width), h: Math.round(vp.height) };
          const sh = this.shell(n); if (sh) { sh.style.setProperty("--pw", Doc.sizes[n].w); sh.style.setProperty("--ph", Doc.sizes[n].h); this.invalidate(); }
        }
      } catch (e) { /* devam */ }
      if (n % 10 === 0) await new Promise((r) => setTimeout(r, 30));
    }
  },
};
