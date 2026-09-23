// ============================================================
// WORKSPACE — screening table, duplicates, projects (v13)
// One view over two sources:
//   local : the analysis in this browser (run / results in script.js),
//           decisions stored in run.human, persisted in IndexedDB
//   cloud : a Supabase project shared by the admin; every reviewer
//           has one vote per record (decision, labels, note)
// ============================================================
/* global Cloud, C, MODELS, run, results, el, $, showError, showSuccess, debounce, scheduleSave, saveStateNow,
          formatCost, formatTokens, triggerDownload, modelShort, reanalyzeRecords, isScreeningRunning,
          loadProtocolIntoForm, currentProtocolConfig, hashString, updateLiveCost, updateAgreement, XLSX */

const DECISION_LABEL = { Include: 'Include', Exclude: 'Exclude', Uncertain: 'Maybe', Duplicate: 'Duplicate' };
const VOTE_BUTTONS = [
  { d: 'Include', icon: '✓', cls: 'inc', title: 'Include — dahil et' },
  { d: 'Uncertain', icon: '?', cls: 'may', title: 'Maybe — kararsız' },
  { d: 'Exclude', icon: '✕', cls: 'exc', title: 'Exclude — hariç tut' }
];

const WS = {
  source: 'local',
  project: null,
  cloudRecords: [],
  cloudAi: new Map(),
  votes: new Map(),        // rid -> Map(userId -> vote)
  profiles: new Map(),     // userId -> profile
  unsubscribe: null,
  page: 1,
  dupPage: 1,
  selected: new Set(),
  showAllVotes: false,
  expandAll: false,
  aiQueue: [],
  aiFlushTimer: null,

  // ---------------- source accessors ----------------
  get records() { return this.source === 'local' ? (run ? run.records : []) : this.cloudRecords; },
  get ai() { return this.source === 'local' ? results : this.cloudAi; },
  get criteria() {
    if (this.source === 'local') return run ? run.criteria : { inclusion: [], exclusion: [] };
    return (this.project && this.project.protocol && this.project.protocol.criteria) || { inclusion: [], exclusion: [] };
  },
  get isCloud() { return this.source === 'cloud'; },
  get canCurate() { return this.source === 'local' || Cloud.isAdmin; },
  get meId() { return this.isCloud ? Cloud.user.id : 'local'; },
  get blindForMe() {
    return this.isCloud && this.project.blind && !(Cloud.isAdmin && this.showAllVotes);
  },
  get aiHidden() { return this.isCloud && this.project.hide_ai && !Cloud.isAdmin; },
  hasData() { return this.records.length > 0; },
  recByRid(rid) {
    if (!this._idx || this._idxSrc !== this.records) {
      this._idxSrc = this.records;
      this._idx = new Map(this.records.map(r => [r.rid, r]));
    }
    return this._idx.get(rid);
  },
  invalidateIndex() { this._idx = null; }
};

// ------------------------------------------------------------
// Votes
// ------------------------------------------------------------
function myVote(rid) {
  if (!WS.isCloud) {
    const h = run && run.human && run.human[rid];
    return h || null;
  }
  const m = WS.votes.get(rid);
  return (m && m.get(WS.meId)) || null;
}

function otherVotes(rid) {
  if (!WS.isCloud || WS.blindForMe) return [];
  const m = WS.votes.get(rid);
  if (!m) return [];
  return [...m.entries()].filter(([uid]) => uid !== WS.meId).map(([uid, v]) => Object.assign({ user_id: uid }, v));
}

function allVisibleDecisions(rid) {
  const out = [];
  const mine = myVote(rid);
  if (mine && mine.decision) out.push(mine.decision);
  otherVotes(rid).forEach(v => { if (v.decision) out.push(v.decision); });
  return out;
}

function hasConflict(rid) {
  return new Set(allVisibleDecisions(rid)).size > 1;
}

function personName(uid) {
  if (uid === 'local') return 'Siz';
  const p = WS.profiles.get(uid);
  return p ? (p.display_name || p.email) : 'Kullanıcı';
}

async function setMyVote(rid, patch) {
  const rec = WS.recByRid(rid);
  if (!rec) return;
  const prev = myVote(rid);
  const next = Object.assign({ decision: null, labels: [], note: '' }, prev || {}, patch);
  if (!WS.isCloud) {
    run.human = run.human || {};
    run.human[rid] = { decision: next.decision, labels: next.labels, note: next.note };
    scheduleSave();
    refreshRow(rid); updateWsStats();
    return;
  }
  let m = WS.votes.get(rid);
  if (!m) { m = new Map(); WS.votes.set(rid, m); }
  m.set(WS.meId, next);
  refreshRow(rid); updateWsStats();
  try {
    await Cloud.upsertVote({ record_id: rec.dbId, decision: next.decision, labels: next.labels, note: next.note });
  } catch (e) {
    if (prev) m.set(WS.meId, prev); else m.delete(WS.meId);
    refreshRow(rid); updateWsStats();
    showError('Karar kaydedilemedi: ' + e.message);
  }
}

async function setFinalDecision(rid, decision) {
  const rec = WS.recByRid(rid);
  const prev = rec.finalDecision;
  rec.finalDecision = decision || '';
  refreshRow(rid); updateWsStats();
  try {
    await Cloud.patchRecords(WS.project.id, [{ rid, final_decision: decision || null, final_by: decision ? Cloud.user.id : null }]);
  } catch (e) {
    rec.finalDecision = prev;
    refreshRow(rid);
    showError('Nihai karar kaydedilemedi: ' + e.message);
  }
}

// ------------------------------------------------------------
// Filtering, sorting, paging
// ------------------------------------------------------------
function isPendingDup(rec) { return !!rec.duplicateOf && !rec.removed; }

function wsFilterState() {
  return {
    q: el.filterSearch.value.toLowerCase().trim(),
    ai: el.filterAi.value,
    mine: el.filterMine.value,
    status: el.filterStatus.value,
    label: el.filterLabel.value,
    sort: el.sortBy.value
  };
}

function matchesWs(rec, f) {
  const ai = WS.ai.get(rec.rid);
  if (f.status === 'removed') { if (!rec.removed) return false; }
  else if (f.status === 'dups') { if (!isPendingDup(rec)) return false; }
  else if (rec.removed || isPendingDup(rec)) return false;

  const aiDec = ai ? ai.ai_decision || ai.decision : '';
  if (f.ai === 'none' && ai) return false;
  if (f.ai === 'analyzed' && !ai) return false;
  if (f.ai === 'error' && !(ai && ai.error)) return false;
  if (['Include', 'Exclude', 'Uncertain'].includes(f.ai) && aiDec !== f.ai) return false;

  const mv = myVote(rec.rid);
  const md = mv && mv.decision;
  if (f.mine === 'undecided' && md) return false;
  if (f.mine === 'decided' && !md) return false;
  if (['Include', 'Exclude', 'Uncertain'].includes(f.mine) && md !== f.mine) return false;
  if (f.mine === 'disagree_ai' && !(md && aiDec && md !== aiDec)) return false;

  if (f.status === 'review' && !(ai && ai.needs_human_review)) return false;
  if (f.status === 'split' && !(ai && ai.agreement === 'split')) return false;
  if (f.status === 'conflict' && !hasConflict(rec.rid)) return false;
  if (f.status === 'nofinal' && rec.finalDecision) return false;
  if (f.status === 'final' && !rec.finalDecision) return false;
  if (f.status === 'noabstract' && !rec.noAbstract) return false;

  if (f.label) {
    const labs = [...((mv && mv.labels) || []), ...otherVotes(rec.rid).flatMap(v => v.labels || [])];
    if (!labs.includes(f.label)) return false;
  }
  if (f.q) {
    const hay = `${rec.ID} ${rec.Title} ${rec.Authors} ${rec.DOI} ${rec.Abstract} ${ai ? C.splitRationale(ai).text : ''} ${(mv && mv.note) || ''}`.toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function filteredRecords() {
  const f = wsFilterState();
  const list = WS.records.filter(r => matchesWs(r, f));
  const conf = r => { const a = WS.ai.get(r.rid); return a && typeof a.confidence === 'number' ? a.confidence : -1; };
  const rel = r => { const a = WS.ai.get(r.rid); return a && typeof a.relevance_score === 'number' ? a.relevance_score : -1; };
  if (f.sort === 'conf_asc') list.sort((a, b) => conf(a) - conf(b) || a.order - b.order);
  else if (f.sort === 'conf_desc') list.sort((a, b) => conf(b) - conf(a) || a.order - b.order);
  else if (f.sort === 'rel_desc') list.sort((a, b) => rel(b) - rel(a) || a.order - b.order);
  else if (f.sort === 'year_desc') list.sort((a, b) => (parseInt(b.Year, 10) || 0) - (parseInt(a.Year, 10) || 0) || a.order - b.order);
  else list.sort((a, b) => a.order - b.order);
  return list;
}

function pageSize() { return parseInt(el.pageSize.value, 10) || 50; }

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------
let wsRenderTimer = null;
function scheduleWsRender() { if (!wsRenderTimer) wsRenderTimer = setTimeout(() => { wsRenderTimer = null; renderWorkspace(); }, 600); }

function renderWorkspace() {
  const has = WS.hasData();
  el.wsEmpty.style.display = has ? 'none' : 'block';
  el.resultsSection.style.display = has ? 'block' : 'none';
  updateTabBadges();
  if (!has) return;
  renderSourceBar();
  renderLabelFilter();
  const list = filteredRecords();
  const ps = pageSize();
  const pages = Math.max(1, Math.ceil(list.length / ps));
  if (WS.page > pages) WS.page = pages;
  const slice = list.slice((WS.page - 1) * ps, WS.page * ps);
  const frag = document.createDocumentFragment();
  slice.forEach(rec => frag.appendChild(buildWsRow(rec)));
  el.resultsBody.textContent = '';
  el.resultsBody.appendChild(frag);
  el.resultsTable.classList.toggle('expand-all', WS.expandAll);
  el.filterCount.textContent = `${list.length.toLocaleString('tr-TR')} eşleşen · ${WS.records.length.toLocaleString('tr-TR')} toplam`;
  renderPager(el.pagerTop, list.length, pages);
  renderPager(el.pagerBottom, list.length, pages);
  el.selectPage.checked = slice.length > 0 && slice.every(r => WS.selected.has(r.rid));
  WS._lastFiltered = list;
  updateSelectionBar();
  updateWsStats();
}

function renderPager(host, total, pages) {
  host.textContent = '';
  const ps = pageSize();
  const info = document.createElement('span');
  info.className = 'pager-info';
  const from = total ? (WS.page - 1) * ps + 1 : 0;
  info.textContent = `${from.toLocaleString('tr-TR')}–${Math.min(total, WS.page * ps).toLocaleString('tr-TR')} / ${total.toLocaleString('tr-TR')}`;
  const nav = document.createElement('div');
  nav.className = 'pager-nav';
  const btn = (label, page, opts = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pager-btn' + (opts.active ? ' active' : '');
    b.textContent = label;
    b.disabled = !!opts.disabled;
    if (opts.title) b.title = opts.title;
    b.addEventListener('click', () => { WS.page = page; renderWorkspace(); el.resultsTable.scrollIntoView({ block: 'start' }); });
    nav.appendChild(b);
  };
  btn('«', 1, { disabled: WS.page === 1, title: 'İlk sayfa' });
  btn('‹', WS.page - 1, { disabled: WS.page === 1, title: 'Önceki' });
  const shown = new Set([1, pages, WS.page - 2, WS.page - 1, WS.page, WS.page + 1, WS.page + 2].filter(p => p >= 1 && p <= pages));
  let last = 0;
  [...shown].sort((a, b) => a - b).forEach(p => {
    if (p - last > 1) { const s = document.createElement('span'); s.className = 'pager-gap'; s.textContent = '…'; nav.appendChild(s); }
    btn(String(p), p, { active: p === WS.page });
    last = p;
  });
  btn('›', WS.page + 1, { disabled: WS.page === pages, title: 'Sonraki' });
  btn('»', pages, { disabled: WS.page === pages, title: 'Son sayfa' });
  host.append(info, nav);
}

function renderSourceBar() {
  const bar = el.wsSourceBar;
  bar.textContent = '';
  const left = document.createElement('div');
  left.className = 'source-info';
  const right = document.createElement('div');
  right.className = 'source-actions';
  if (WS.isCloud) {
    const p = WS.project;
    left.append(pill('☁️ Proje', 'pill-cloud'), text('strong', p.name));
    left.append(pill(p.blind ? '🙈 Kör mod açık' : '👁️ Kör mod kapalı', p.blind ? 'pill-warn' : 'pill-ok'));
    if (p.hide_ai) left.append(pill('🤖 AI kararları hakemlerden gizli', 'pill-muted'));
    left.append(pill(Cloud.isAdmin ? '🛡️ Yönetici' : '🧑‍⚖️ Hakem', 'pill-muted'));
    if (Cloud.isAdmin && p.blind) {
      const lab = document.createElement('label');
      lab.className = 'checkbox-label inline-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = WS.showAllVotes;
      cb.addEventListener('change', () => { WS.showAllVotes = cb.checked; renderWorkspace(); });
      lab.append(cb, document.createTextNode(' Tüm hakem kararlarını göster (yalnızca siz)'));
      left.appendChild(lab);
    }
    const back = button('💻 Yerel sonuçlara dön', 'btn-tertiary btn-compact', () => { closeCloudProject(); });
    back.disabled = !(run && run.records && run.records.length);
    right.append(button('↻ Yenile', 'btn-tertiary btn-compact', () => openCloudProject(p.id)), back);
  } else {
    left.append(pill('💻 Yerel analiz', 'pill-muted'), text('strong', run ? run.fileName : ''));
    if (run && run.cloudProjectId) left.append(pill('☁️ Veritabanına kaydedildi', 'pill-ok'));
    left.append(text('span', 'Kararlarınız bu tarayıcıda saklanır.', 'muted-inline'));
  }
  bar.append(left, right);
  el.saveToCloudBtn.style.display = !WS.isCloud && Cloud.available && Cloud.isAdmin ? 'inline-flex' : 'none';
  el.loadProtocolBtn.style.display = WS.isCloud && Cloud.isAdmin ? 'inline-flex' : 'none';
  el.costPanel.style.display = WS.isCloud ? 'none' : 'grid';
  el.statConflictCard.style.display = WS.isCloud && !WS.blindForMe ? 'block' : 'none';
  el.filterStatus.querySelectorAll('.cloud-only').forEach(o => { o.hidden = !WS.isCloud; });
}

function renderLabelFilter() {
  const labels = new Set();
  WS.records.forEach(r => {
    const mv = myVote(r.rid);
    ((mv && mv.labels) || []).forEach(l => labels.add(l));
    otherVotes(r.rid).forEach(v => (v.labels || []).forEach(l => labels.add(l)));
  });
  const cur = el.filterLabel.value;
  const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'tr'));
  const sig = sorted.join('\u0001');
  if (el.filterLabel.dataset.sig === sig) return;
  el.filterLabel.dataset.sig = sig;
  el.filterLabel.textContent = '';
  const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Tüm etiketler'; el.filterLabel.appendChild(o0);
  sorted.forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = `🏷️ ${l}`; el.filterLabel.appendChild(o); });
  el.filterLabel.value = sorted.includes(cur) ? cur : '';
  el.labelSuggestions.textContent = '';
  sorted.forEach(l => { const o = document.createElement('option'); o.value = l; el.labelSuggestions.appendChild(o); });
}

function refreshRow(rid) {
  const tr = el.resultsBody.querySelector(`tr[data-rid="${rid}"]`);
  const rec = WS.recByRid(rid);
  if (tr && rec) tr.replaceWith(buildWsRow(rec));
}

// ---------- DOM helpers ----------
function text(tag, value, cls) { const n = document.createElement(tag); n.textContent = value; if (cls) n.className = cls; return n; }
function pill(value, cls) { return text('span', value, `pill ${cls || ''}`); }
function button(label, cls, onClick, title) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = cls; b.textContent = label;
  if (title) b.title = title;
  b.addEventListener('click', onClick);
  return b;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
// Small line icons (robot = machine decision, person = human decision)
function icon(kind) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', `ico ico-${kind}`);
  svg.setAttribute('aria-hidden', 'true');
  const add = (tag, attrs) => { const n = document.createElementNS(SVG_NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); svg.appendChild(n); };
  if (kind === 'ai') {
    add('rect', { x: '2.2', y: '4.6', width: '11.6', height: '9', rx: '3', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6' });
    add('path', { d: 'M8 1.8v2.8', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round' });
    add('circle', { cx: '5.9', cy: '9.1', r: '1.1', fill: 'currentColor' });
    add('circle', { cx: '10.1', cy: '9.1', r: '1.1', fill: 'currentColor' });
  } else {
    add('circle', { cx: '8', cy: '5.2', r: '2.9', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6' });
    add('path', { d: 'M2.6 14.2c.6-3 2.8-4.6 5.4-4.6s4.8 1.6 5.4 4.6', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round' });
  }
  return svg;
}

function decisionBadge(decision, small, source) {
  const s = document.createElement('span');
  const key = String(decision || 'uncertain').toLowerCase();
  s.className = `decision-badge decision-${key}${small ? ' badge-sm' : ''}`;
  s.lang = 'en';
  if (source) s.appendChild(icon(source));
  s.appendChild(document.createTextNode(DECISION_LABEL[decision] || decision));
  return s;
}

/**
 * The decision that currently counts for this viewer:
 * admin's final decision (cloud) > my vote > AI decision.
 */
function effectiveDecision(rec) {
  const ai = WS.ai.get(rec.rid);
  if (WS.isCloud && rec.finalDecision && !WS.blindForMe) return { decision: rec.finalDecision, source: 'final' };
  const mv = myVote(rec.rid);
  if (mv && mv.decision) return { decision: mv.decision, source: 'me' };
  if (ai && !ai.error && !WS.aiHidden) return { decision: ai.ai_decision || ai.decision, source: 'ai' };
  return { decision: ai && ai.error && !WS.aiHidden ? 'Hata' : null, source: 'ai' };
}

function modelName(id) {
  if (id === 'custom') return (typeof settings !== 'undefined' && settings.customSpecs && settings.customSpecs.modelId) || 'custom';
  return MODELS[id] ? MODELS[id].apiModelId : id;
}

/** Appends text to parent, wrapping evidence ranges in <mark>. */
function appendHighlighted(parent, value, evidence, criteria) {
  const src = String(value || '');
  const ranges = C.evidenceRanges(src, evidence);
  const ecCodes = new Set((criteria.exclusion || []).map(c => c.code));
  const textOf = code => {
    const c = [...(criteria.inclusion || []), ...(criteria.exclusion || [])].find(x => x.code === code);
    return c ? `${code}: ${c.text}` : code;
  };
  let pos = 0;
  ranges.forEach(r => {
    if (r.start > pos) parent.appendChild(document.createTextNode(src.slice(pos, r.start)));
    const m = document.createElement('mark');
    m.className = r.codes.every(c => ecCodes.has(c)) ? 'ev-mark ev-ec' : 'ev-mark';
    m.textContent = src.slice(r.start, r.end);
    m.title = r.codes.map(textOf).join('\n');
    parent.appendChild(m);
    pos = r.end;
  });
  if (pos < src.length) parent.appendChild(document.createTextNode(src.slice(pos)));
  return ranges.length;
}

function shortAuthors(authors) {
  const list = String(authors || '').split(/\s*;\s*/).filter(Boolean);
  if (list.length <= 4) return list.join('; ');
  return `${list.slice(0, 4).join('; ')} +${list.length - 4}`;
}

function doiHref(doi) {
  const d = C.normalizeDoi(doi);
  return d ? `https://doi.org/${d}` : '';
}

function evidenceFor(ai) {
  if (!ai) return {};
  // Only quotes behind a positive IC or a met EC are highlighted
  const out = {};
  Object.entries(ai.evidence || {}).forEach(([code, q]) => {
    const v = (ai.assessment || {})[code];
    if (v === 'yes' || (code.startsWith('IC') && v !== 'no')) out[code] = q;
  });
  return out;
}

// ---------- row ----------
function buildWsRow(rec) {
  const ai = WS.ai.get(rec.rid);
  const crit = WS.criteria;
  const ev = evidenceFor(ai);
  const tr = document.createElement('tr');
  tr.dataset.rid = rec.rid;
  const mv = myVote(rec.rid);
  if (mv && mv.decision) tr.classList.add('row-voted');
  if (ai && ai.error) tr.classList.add('row-error');
  if (WS.selected.has(rec.rid)) tr.classList.add('row-selected');
  const td = cls => { const c = document.createElement('td'); if (cls) c.className = cls; tr.appendChild(c); return c; };

  // 1. authors / year / DOI
  const cA = td('cell-authors');
  cA.appendChild(text('div', shortAuthors(rec.Authors) || '—', 'au-names'));
  if (rec.Authors) cA.lastChild.title = rec.Authors;
  if (rec.Year) cA.appendChild(text('div', rec.Year, 'muted-small'));
  const href = doiHref(rec.DOI);
  if (href) {
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'doi-link'; a.textContent = C.normalizeDoi(rec.DOI);
    a.title = 'Çalışmanın sayfasını yeni sekmede aç';
    cA.appendChild(a);
  }
  if (rec.ID && !/^\d+$/.test(rec.ID)) cA.appendChild(text('div', rec.ID, 'muted-small mono'));

  // 2. title + selection
  const cT = td('cell-title');
  const head = document.createElement('div');
  head.className = 'title-head';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'row-select';
  cb.checked = WS.selected.has(rec.rid);
  cb.title = 'Yeniden analiz için seç';
  cb.addEventListener('change', () => {
    if (cb.checked) WS.selected.add(rec.rid); else WS.selected.delete(rec.rid);
    tr.classList.toggle('row-selected', cb.checked);
    updateSelectionBar();
  });
  const tt = document.createElement('div');
  tt.className = 'title-text';
  appendHighlighted(tt, rec.Title || '[başlık yok]', ev, crit);
  head.append(cb, tt);
  cT.appendChild(head);
  const meta = document.createElement('div');
  meta.className = 'title-meta';
  if (rec.SourceRow) meta.appendChild(text('span', `Excel satırı ${rec.SourceRow}`, 'muted-small'));
  if (rec.DocType) meta.appendChild(text('span', rec.DocType, 'muted-small'));
  cT.appendChild(meta);
  const flagsRow = document.createElement('div');
  flagsRow.className = 'title-flags';
  if (!ai) flagsRow.appendChild(pill('Analiz edilmedi', 'pill-muted'));
  if (rec.noAbstract) flagsRow.appendChild(pill('Özet yok', 'pill-warn'));
  if (isPendingDup(rec)) flagsRow.appendChild(pill(`♻️ Tekrar adayı: ${rec.duplicateOf}`, 'pill-warn'));
  if (rec.removed) flagsRow.appendChild(pill(`🗑️ Kaldırıldı${rec.removedReason ? ': ' + rec.removedReason : ''}`, 'pill-muted'));
  if (ai && ai.needs_human_review && !WS.aiHidden) flagsRow.appendChild(pill(ai.agreement === 'split' ? '👁️ Modeller ayrıştı' : '👁️ İnceleme önerilir', 'pill-info'));
  if (flagsRow.childNodes.length) cT.appendChild(flagsRow);

  // 3. abstract with evidence
  const cAb = td('cell-abstract');
  const box = document.createElement('div');
  box.className = 'abs-box';
  if (rec.Abstract) appendHighlighted(box, rec.Abstract, ev, crit);
  else box.appendChild(text('span', 'Özet yok.', 'muted-inline'));
  cAb.appendChild(box);
  if (rec.Keywords) cAb.appendChild(text('div', `🔑 ${rec.Keywords}`, 'muted-small kw-line'));

  // 4. decision
  const cD = td('cell-decision');
  const eff = effectiveDecision(rec);
  const top = document.createElement('div');
  top.className = 'decision-top';
  if (eff.decision) {
    const b = decisionBadge(eff.decision, false, eff.source === 'ai' ? 'ai' : 'person');
    const aiDec = ai && !ai.error ? DECISION_LABEL[ai.ai_decision || ai.decision] : '';
    b.title = eff.source === 'ai' ? 'Karar yapay zekâ tarafından verildi'
      : eff.source === 'final' ? `Yöneticinin nihai kararı${aiDec && !WS.aiHidden ? ` (AI: ${aiDec})` : ''}`
      : `Sizin kararınız${aiDec && !WS.aiHidden ? ` (AI: ${aiDec})` : ''}`;
    top.appendChild(b);
    if (eff.source === 'final') top.appendChild(text('span', 'nihai', 'muted-small'));
  } else top.appendChild(text('span', ai ? '—' : 'analiz edilmedi', 'muted-inline'));
  cD.appendChild(top);
  cD.appendChild(text('div', WS.isCloud ? Cloud.displayName : 'Kararınız', 'vote-label'));
  const vb = document.createElement('div');
  vb.className = 'vote-buttons';
  VOTE_BUTTONS.forEach(b => {
    const on = mv && mv.decision === b.d;
    vb.appendChild(button(b.icon, `vote-btn ${b.cls}${on ? ' active' : ''}`,
      () => setMyVote(rec.rid, { decision: on ? null : b.d }), b.title + (on ? ' (tekrar tıklayınca kaldırılır)' : '')));
  });
  cD.appendChild(vb);
  if (WS.isCloud) {
    const others = otherVotes(rec.rid).filter(v => v.decision);
    const box2 = document.createElement('div');
    box2.className = 'team-votes';
    if (WS.blindForMe) box2.appendChild(text('div', '🙈 Kör mod: diğer kararlar gizli', 'muted-small'));
    else if (!others.length) box2.appendChild(text('div', 'Diğer hakemler henüz karar vermedi', 'muted-small'));
    else others.forEach(v => {
      const row = document.createElement('div');
      row.className = 'team-vote';
      row.append(text('span', personName(v.user_id), 'tv-name'), decisionBadge(v.decision, true));
      box2.appendChild(row);
    });
    if (hasConflict(rec.rid)) box2.appendChild(pill('⚡ Çatışma', 'pill-danger'));
    cD.appendChild(box2);
    if (Cloud.isAdmin) {
      const fin = document.createElement('div');
      fin.className = 'final-line';
      fin.appendChild(text('span', 'Nihai', 'mini-label'));
      const sel = document.createElement('select');
      sel.className = `final-decision-select select-${String(rec.finalDecision || 'none').toLowerCase()}`;
      [['', '— belirlenmedi'], ['Include', 'Include'], ['Uncertain', 'Maybe'], ['Exclude', 'Exclude']].forEach(([v, t]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = t; o.selected = (rec.finalDecision || '') === v; sel.appendChild(o);
      });
      sel.addEventListener('change', () => setFinalDecision(rec.rid, sel.value));
      fin.appendChild(sel);
      cD.appendChild(fin);
    } else if (rec.finalDecision && !WS.blindForMe) {
      const fin = document.createElement('div');
      fin.className = 'final-line';
      fin.append(text('span', 'Nihai', 'mini-label'), decisionBadge(rec.finalDecision, true));
      cD.appendChild(fin);
    }
  }
  const mds = Object.entries((ai && ai.modelDecisions) || {});
  if (mds.length && !WS.aiHidden) {
    const list = document.createElement('div');
    list.className = 'model-list';
    mds.forEach(([mId, info]) => {
      const row = document.createElement('div');
      row.className = 'model-row';
      row.append(text('span', modelName(mId), 'model-name'), decisionBadge(info.error ? 'Hata' : info.decision, true, 'ai'));
      row.title = info.error || C.splitRationale(info).text;
      list.appendChild(row);
    });
    cD.appendChild(list);
  }

  // 5. confidence
  const cC = td('cell-conf');
  if (ai && typeof ai.confidence === 'number' && !WS.aiHidden) {
    const pct = text('div', `${Math.round(ai.confidence * 100)}%`, 'conf-big');
    const thr = WS.isCloud ? ((WS.project.protocol.options || {}).reviewThreshold) : (run && run.options.reviewThreshold);
    if (typeof thr === 'number' && ai.confidence < thr) pct.classList.add('conf-low');
    cC.appendChild(pct);
    const valid = mds.filter(([, i]) => !i.error);
    if (valid.length) {
      const agree = valid.filter(([, i]) => i.decision === ai.decision).length;
      cC.appendChild(text('div', `Uyum ${agree}/${valid.length}`, 'muted-small'));
      valid.forEach(([mId, i]) => cC.appendChild(text('div', `${modelName(mId)}: ${Math.round((i.confidence || 0) * 100)}%`, 'muted-small conf-model')));
    }
  } else cC.appendChild(text('span', '—', 'muted-inline'));

  // 6. criteria chips
  const cK = td('cell-criteria');
  const codes = [...(crit.inclusion || []), ...(crit.exclusion || [])];
  if (ai && ai.assessment && Object.keys(ai.assessment).length && !WS.aiHidden) {
    codes.forEach(c => {
      const v = ai.assessment[c.code] || 'unclear';
      const chip = document.createElement('span');
      chip.className = `crit-chip crit-${v} ${c.code.startsWith('EC') ? 'crit-ec' : 'crit-ic'}`;
      chip.textContent = `${c.code}${v === 'yes' ? '✓' : v === 'no' ? '✗' : '?'}`;
      chip.title = `${c.code}: ${c.text}\nDeğerlendirme: ${v === 'yes' ? 'karşılandı' : v === 'no' ? 'karşılanmadı' : 'belirsiz'}${ai.evidence && ai.evidence[c.code] ? `\n"${ai.evidence[c.code]}"` : ''}`;
      cK.appendChild(chip);
    });
    if (typeof ai.relevance_score === 'number') {
      const pctR = Math.round(ai.relevance_score * 100);
      const c = document.createElement('div');
      c.className = 'relevance-container';
      c.title = ai.relevance_rationale || '';
      const t = text('span', `Konu ilgisi ${pctR}%`, 'relevance-text');
      const bg = document.createElement('div'); bg.className = 'relevance-bar-bg';
      const fill = document.createElement('div'); fill.className = 'relevance-bar-fill'; fill.style.width = `${pctR}%`;
      bg.appendChild(fill); c.append(t, bg); cK.appendChild(c);
    }
  } else cK.appendChild(text('span', '—', 'muted-inline'));

  // 7. short rationale (summary + justification)
  const cR = td('cell-rationale');
  if (ai && !WS.aiHidden) {
    const sr = C.splitRationale(ai);
    cR.appendChild(text('div', sr.text || '—', 'rationale-text'));
    if (ai.error) cR.appendChild(text('div', `API hatası: ${ai.error}`, 'danger-text small-text'));
    if (sr.flags.length) {
      const d = document.createElement('details');
      d.className = 'audit-flags';
      d.appendChild(text('summary', `⚠️ Sistem denetimi (${sr.flags.length})`));
      const ul = document.createElement('ul');
      sr.flags.forEach(f => ul.appendChild(text('li', f)));
      d.appendChild(ul);
      cR.appendChild(d);
    }
  } else cR.appendChild(text('span', WS.aiHidden ? 'AI gerekçesi gizli' : '—', 'muted-inline'));

  // 8. labels & note
  cellLabels(td('cell-labels'), rec, mv);
  return tr;
}

function cellLabels(cell, rec, mv) {
  const labels = (mv && mv.labels) || [];
  const chips = document.createElement('div');
  chips.className = 'label-chips';
  labels.forEach(l => {
    const chip = text('span', l, 'label-chip');
    const x = button('×', 'chip-x', () => setMyVote(rec.rid, { labels: labels.filter(y => y !== l) }), 'Etiketi kaldır');
    chip.appendChild(x);
    chips.appendChild(chip);
  });
  cell.appendChild(chips);

  const addBtn = button('+ Etiket', 'btn-ghost', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'label-input';
    input.placeholder = 'etiket, Enter';
    input.setAttribute('list', 'labelSuggestions');
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = input.value.trim().replace(/\s+/g, ' ').slice(0, 40);
      if (v && !labels.includes(v)) setMyVote(rec.rid, { labels: [...labels, v] });
      else refreshRow(rec.rid);
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { done = true; refreshRow(rec.rid); }
    });
    input.addEventListener('blur', commit);
    addBtn.replaceWith(input);
    input.focus();
  });
  cell.appendChild(addBtn);

  const note = (mv && mv.note) || '';
  const noteBox = document.createElement('div');
  noteBox.className = 'note-box-cell';
  const openEditor = () => {
    const ta = document.createElement('textarea');
    ta.className = 'note-input';
    ta.rows = 3;
    ta.value = note;
    ta.placeholder = 'Notunuz…';
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = ta.value.trim().slice(0, 2000);
      if (v !== note) setMyVote(rec.rid, { note: v }); else refreshRow(rec.rid);
    };
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { done = true; refreshRow(rec.rid); }
    });
    ta.addEventListener('blur', commit);
    noteBox.textContent = '';
    noteBox.appendChild(ta);
    ta.focus();
  };
  if (note) {
    const n = text('div', note, 'note-text');
    n.title = 'Düzenlemek için tıklayın';
    n.addEventListener('click', openEditor);
    noteBox.appendChild(n);
  } else noteBox.appendChild(button('+ Not', 'btn-ghost btn-ghost-sm', openEditor));
  cell.appendChild(noteBox);

  // other reviewers' labels / notes (hidden in blind mode)
  otherVotes(rec.rid).filter(v => (v.labels && v.labels.length) || v.note).forEach(v => {
    const o = document.createElement('div');
    o.className = 'other-note';
    o.appendChild(text('strong', `${personName(v.user_id)}: `));
    (v.labels || []).forEach(l => o.appendChild(text('span', l, 'label-chip label-chip-other')));
    if (v.note) o.appendChild(text('span', ` ${v.note}`));
    cell.appendChild(o);
  });
}

// ------------------------------------------------------------
// Stats, selection, tab badges
// ------------------------------------------------------------
function updateWsStats() {
  let inc = 0, exc = 0, unc = 0, rev = 0, dup = 0, none = 0, err = 0, mine = 0, active = 0, conflict = 0;
  WS.records.forEach(rec => {
    if (rec.removed || isPendingDup(rec)) { dup++; return; }
    active++;
    const ai = WS.ai.get(rec.rid);
    const d = effectiveDecision(rec).decision;
    if (!ai && !d) none++;
    else if (d === 'Include') inc++;
    else if (d === 'Exclude') exc++;
    else if (d) unc++;
    if (ai && ai.error) err++;
    if (ai && ai.needs_human_review) rev++;
    const mv = myVote(rec.rid);
    if (mv && mv.decision) mine++;
    if (WS.isCloud && hasConflict(rec.rid)) conflict++;
  });
  el.includeCount.textContent = inc;
  el.excludeCount.textContent = exc;
  el.uncertainCount.textContent = unc;
  el.reviewCount.textContent = rev;
  el.duplicateCount.textContent = dup;
  el.totalCount.textContent = active;
  el.myProgressCount.textContent = `${mine}/${active}`;
  el.conflictCount.textContent = conflict;
  el.myProgressBar.style.width = active ? `${mine / active * 100}%` : '0%';
  el.retryErrorsBtn.style.display = err && WS.canCurate ? 'inline-flex' : 'none';
  el.retryErrorsBtn.textContent = `🔁 Hatalı ${err} kaydı yeniden tara`;
  el.relevanceReportBtn.style.display = !WS.aiHidden && [...WS.ai.values()].some(r => typeof r.relevance_score === 'number') ? 'inline-flex' : 'none';
  if (!WS.isCloud && typeof updateAgreement === 'function') updateAgreement();
  updateTabBadges();
}

function updateSelectionBar() {
  const n = WS.selected.size;
  const canRun = WS.canCurate;
  el.selectionBar.style.display = canRun ? 'flex' : 'none';
  el.selCount.textContent = n ? `${n} kayıt seçili` : 'Seçim yok';
  el.reanalyzeSelectedBtn.disabled = !n;
  el.clearSelectionBtn.disabled = !n;
  const total = (WS._lastFiltered || []).length;
  el.reanalyzeAllBtn.textContent = `🔁 Filtredeki tümünü yeniden analiz et (${total.toLocaleString('tr-TR')})`;
  el.reanalyzeAllBtn.disabled = !total;
}

function updateTabBadges() {
  const pend = WS.records.filter(isPendingDup).length;
  el.tabBadgeDups.textContent = pend ? String(pend) : '';
  el.tabBadgeDups.style.display = pend ? 'inline-block' : 'none';
  const active = WS.records.filter(r => !r.removed && !isPendingDup(r)).length;
  el.tabBadgeScreen.textContent = active ? active.toLocaleString('tr-TR') : '';
  el.tabBadgeScreen.style.display = active ? 'inline-block' : 'none';
}

// ------------------------------------------------------------
// Re-analysis (admin in cloud, anyone locally)
// ------------------------------------------------------------
async function reanalyzeRids(rids) {
  if (!WS.canCurate) return showError('Yeniden analiz yalnızca yönetici tarafından yapılabilir.');
  const recs = rids.map(r => WS.recByRid(r)).filter(r => r && !r.removed);
  if (!recs.length) return showError('Yeniden analiz edilecek kayıt yok.');
  await reanalyzeRecords(recs);
}

/** Called by script.js for every AI row produced by a re-analysis in cloud mode. */
function applyCloudAiRow(row) {
  WS.cloudAi.set(row.rid, row);
  WS.aiQueue.push(row);
  if (WS.aiQueue.length >= 50) flushCloudAi();
  else if (!WS.aiFlushTimer) WS.aiFlushTimer = setTimeout(flushCloudAi, 2000);
  scheduleWsRender();
}

async function flushCloudAi() {
  clearTimeout(WS.aiFlushTimer); WS.aiFlushTimer = null;
  if (!WS.aiQueue.length || !WS.isCloud) return;
  const rows = WS.aiQueue.splice(0);
  try {
    await Cloud.patchRecords(WS.project.id, rows.map(r => ({ rid: r.rid, ai: Cloud.stripAi(r), ai_decision: r.ai_decision || r.decision })));
  } catch (e) {
    WS.aiQueue.unshift(...rows);
    showError('AI sonuçları veritabanına yazılamadı, tekrar denenecek: ' + e.message);
    WS.aiFlushTimer = setTimeout(flushCloudAi, 10000);
  }
}

// ------------------------------------------------------------
// Duplicates (side by side)
// ------------------------------------------------------------
function dupPairs() {
  return WS.records.filter(isPendingDup).map(b => ({ a: WS.recByRid(b.duplicateOf), b })).filter(p => p.a);
}

const DUP_KIND = { doi: 'Aynı DOI', title: 'Aynı başlık + yıl', fuzzy: 'Benzer başlık' };

function renderDuplicates() {
  const pairs = dupPairs();
  const removed = WS.records.filter(r => r.removed);
  const canEdit = WS.canCurate && WS.hasData();
  el.dupScanBtn.style.display = canEdit ? 'inline-flex' : 'none';
  el.dupRemoveAllBtn.style.display = canEdit && pairs.length ? 'inline-flex' : 'none';
  el.dupSummary.textContent = !WS.hasData()
    ? 'Önce bir analiz yükleyin ya da proje açın.'
    : `${pairs.length} tekrar adayı çifti · ${removed.length} kayıt kaldırıldı${canEdit ? '' : ' · Tekrar kararlarını yalnızca yönetici verebilir.'}`;
  el.dupList.textContent = '';
  const per = 10;
  const pages = Math.max(1, Math.ceil(pairs.length / per));
  if (WS.dupPage > pages) WS.dupPage = pages;
  pairs.slice((WS.dupPage - 1) * per, WS.dupPage * per).forEach(p => el.dupList.appendChild(buildDupPair(p, canEdit)));
  el.dupPager.textContent = '';
  if (pages > 1) {
    const prev = button('‹ Önceki', 'pager-btn', () => { WS.dupPage--; renderDuplicates(); });
    prev.disabled = WS.dupPage === 1;
    const next = button('Sonraki ›', 'pager-btn', () => { WS.dupPage++; renderDuplicates(); });
    next.disabled = WS.dupPage === pages;
    el.dupPager.append(prev, text('span', ` ${WS.dupPage} / ${pages} `, 'pager-info'), next);
  }
  el.removedSummary.textContent = `🗑️ Kaldırılan kayıtlar (${removed.length})`;
  el.removedList.textContent = '';
  removed.slice(0, 500).forEach(r => {
    const row = document.createElement('div');
    row.className = 'removed-row';
    row.append(text('span', r.rid, 'mono muted-small'), text('span', r.Title, 'removed-title'), text('span', r.removedReason || '', 'muted-small'));
    if (canEdit) row.appendChild(button('↩ Geri al', 'btn-ghost', () => restoreRemoved(r)));
    el.removedList.appendChild(row);
  });
}

function buildDupPair({ a, b }, canEdit) {
  const card = document.createElement('div');
  card.className = 'dup-pair';
  const head = document.createElement('div');
  head.className = 'dup-head';
  head.append(pill(DUP_KIND[b.dupKind] || 'Tekrar', b.dupKind === 'fuzzy' ? 'pill-warn' : 'pill-info'));
  if (typeof b.dupScore === 'number' && b.dupKind === 'fuzzy') head.append(text('span', `başlık benzerliği %${Math.round(b.dupScore * 100)}`, 'muted-small'));
  card.appendChild(head);
  const grid = document.createElement('div');
  grid.className = 'dup-grid';
  const side = (rec, other, label) => {
    const col = document.createElement('div');
    col.className = 'dup-side';
    col.appendChild(text('div', label, 'mini-label'));
    const field = (name, value, cmp) => {
      const f = document.createElement('div');
      f.className = 'dup-field' + (cmp !== undefined && norm(value) !== norm(cmp) ? ' dup-diff' : '');
      f.appendChild(text('span', name, 'dup-fname'));
      f.appendChild(text('span', value || '—', 'dup-fval'));
      return f;
    };
    const norm = v => C.normText(v || '');
    const t = field('Başlık', rec.Title, other.Title); t.classList.add('dup-title'); col.appendChild(t);
    col.appendChild(field('Yazarlar', shortAuthors(rec.Authors), shortAuthors(other.Authors)));
    col.appendChild(field('Yıl', rec.Year, other.Year));
    const df = field('DOI', rec.DOI, other.DOI);
    const href = doiHref(rec.DOI);
    if (href) {
      const a2 = document.createElement('a'); a2.href = href; a2.target = '_blank'; a2.rel = 'noopener noreferrer';
      a2.className = 'doi-link'; a2.textContent = C.normalizeDoi(rec.DOI);
      df.lastChild.replaceWith(a2);
    }
    col.appendChild(df);
    col.appendChild(field('Kaynak ID', rec.ID));
    col.appendChild(field('Excel satırı', rec.SourceRow ? String(rec.SourceRow) : ''));
    const ai = WS.ai.get(rec.rid);
    const fa = field('AI kararı', '');
    fa.lastChild.replaceWith(ai && !ai.preset ? decisionBadge(ai.ai_decision || ai.decision, true) : text('span', 'analiz edilmedi', 'muted-inline'));
    col.appendChild(fa);
    const ab = document.createElement('div');
    ab.className = 'abs-box abs-box-sm';
    ab.textContent = rec.Abstract || 'Özet yok.';
    col.appendChild(ab);
    return col;
  };
  grid.append(side(a, b, `Kayıt A · ${a.rid}`), side(b, a, `Kayıt B · ${b.rid}`));
  card.appendChild(grid);
  if (canEdit) {
    const act = document.createElement('div');
    act.className = 'dup-actions';
    act.append(
      button('⬅ A\'yı kaldır, B kalsın', 'btn-tertiary btn-compact', () => resolveDup(a, b, 'remove_a')),
      button('Tekrar değil — ikisi de kalsın', 'btn-outline-small', () => resolveDup(a, b, 'keep_both')),
      button('B\'yi kaldır, A kalsın ➡', 'btn-secondary btn-compact', () => resolveDup(a, b, 'remove_b'))
    );
    card.appendChild(act);
  }
  return card;
}

// Returns the record patches that were changed
function applyDupDecision(a, b, action) {
  const changed = new Set();
  const clearPresetAi = rec => {
    const ai = WS.ai.get(rec.rid);
    if (ai && ai.preset && ai.decision === 'Duplicate') { WS.ai.delete(rec.rid); rec._aiCleared = true; }
  };
  if (action === 'remove_b') {
    b.removed = true; b.removedReason = `Tekrar: ${a.rid}`;
    changed.add(b);
  } else if (action === 'remove_a') {
    a.removed = true; a.removedReason = `Tekrar: ${b.rid}`;
    b.duplicateOf = ''; b.dupKind = ''; b.dupScore = null;
    clearPresetAi(b);
    // records that pointed to A now point to the kept one
    WS.records.forEach(r => { if (r.duplicateOf === a.rid && r !== b && !r.removed) { r.duplicateOf = b.rid; changed.add(r); } });
    changed.add(a); changed.add(b);
  } else {
    b.notDupOf = [...new Set([...(b.notDupOf || []), a.rid])];
    b.duplicateOf = ''; b.dupKind = ''; b.dupScore = null;
    clearPresetAi(b);
    changed.add(b);
  }
  return [...changed];
}

async function persistRecordCuration(recs) {
  if (!recs.length) return;
  if (!WS.isCloud) { scheduleSave(); return; }
  const patches = recs.map(r => ({
    rid: r.rid, duplicate_of: r.duplicateOf || null, dup_kind: r.dupKind || null,
    dup_score: typeof r.dupScore === 'number' ? r.dupScore : null, not_dup_of: r.notDupOf || [],
    removed: !!r.removed, removed_reason: r.removedReason || ''
  }));
  await Cloud.patchRecords(WS.project.id, patches);
  const cleared = recs.filter(r => r._aiCleared);
  if (cleared.length) await Cloud.patchRecords(WS.project.id, cleared.map(r => ({ rid: r.rid, ai: null, ai_decision: null })));
  recs.forEach(r => { delete r._aiCleared; });
}

async function resolveDup(a, b, action) {
  const changed = applyDupDecision(a, b, action);
  try { await persistRecordCuration(changed); }
  catch (e) { showError('Kaydedilemedi: ' + e.message + ' — sayfayı yenileyin.'); }
  const unanalyzed = changed.filter(r => !r.removed && !WS.ai.get(r.rid));
  if (unanalyzed.length) showSuccess(`${unanalyzed.map(r => r.rid).join(', ')} artık tekrar değil ve henüz analiz edilmedi. Tarama sekmesinde "Analiz edilmemiş" filtresiyle seçip yeniden analiz edebilirsiniz.`);
  renderDuplicates(); renderWorkspace();
}

async function removeAllRight() {
  const pairs = dupPairs();
  if (!pairs.length) return;
  if (!confirm(`${pairs.length} çiftin tamamında B (sonraki kayıt) kaldırılsın, A kalsın mı?`)) return;
  const changed = pairs.flatMap(p => applyDupDecision(p.a, p.b, 'remove_b'));
  try { await persistRecordCuration(changed); showSuccess(`${changed.length} kayıt tekrar olarak kaldırıldı.`); }
  catch (e) { showError('Kaydedilemedi: ' + e.message); }
  renderDuplicates(); renderWorkspace();
}

async function restoreRemoved(rec) {
  rec.removed = false; rec.removedReason = '';
  if (rec.duplicateOf) {
    // restored duplicates return to the review queue unless the original is gone
    const orig = WS.recByRid(rec.duplicateOf);
    if (!orig || orig.removed) { rec.duplicateOf = ''; rec.dupKind = ''; }
  }
  try { await persistRecordCuration([rec]); } catch (e) { showError('Kaydedilemedi: ' + e.message); }
  renderDuplicates(); renderWorkspace();
}

async function scanFuzzyDuplicates() {
  const t0 = performance.now();
  const pairs = C.findDuplicateCandidates(WS.records, { threshold: 0.85 });
  const changed = [];
  pairs.forEach(p => {
    const b = WS.recByRid(p.b);
    if (!b || b.duplicateOf) return;
    b.duplicateOf = p.a; b.dupKind = p.kind; b.dupScore = p.score;
    changed.push(b);
  });
  try { await persistRecordCuration(changed); } catch (e) { showError('Kaydedilemedi: ' + e.message); }
  showSuccess(`${WS.records.length} kayıt ${Math.round(performance.now() - t0)} ms'de tarandı: ${changed.length} yeni tekrar adayı bulundu.`);
  renderDuplicates(); renderWorkspace();
}

// ------------------------------------------------------------
// Export (both sources)
// ------------------------------------------------------------
function wsRunLike() {
  if (!WS.isCloud) return run;
  const p = WS.project.protocol || {};
  return Object.assign({
    activeModels: [], models: [], criteria: { inclusion: [], exclusion: [] }, options: {}, usage: { input: 0, output: 0, cost: 0 },
    log: [], promptHash: '', system: '', fileName: WS.project.file_name, fileHash: '', createdAt: WS.project.created_at, mode: 'sync', batchSize: ''
  }, p, { records: WS.records });
}

function mergedRow(rec) {
  const ai = WS.ai.get(rec.rid);
  const base = ai ? Object.assign({}, ai) : C.presetResult(rec, 'Uncertain', 'Analiz edilmedi');
  Object.assign(base, {
    rid: rec.rid, order: rec.order, id: rec.ID, authors: rec.Authors, title: rec.Title, year: rec.Year,
    doi: rec.DOI, abstract: rec.Abstract, source_row: rec.SourceRow || ''
  });
  const human = WS.isCloud ? rec.finalDecision || '' : ((myVote(rec.rid) || {}).decision || '');
  base.ai_decision = ai ? ai.ai_decision || ai.decision : 'Analiz edilmedi';
  base.human_decision = human;
  base.decision = rec.removed || isPendingDup(rec) ? 'Duplicate' : (human || base.ai_decision);
  return base;
}

function wsExportRows() {
  const runLike = wsRunLike();
  const recs = [...WS.records].sort((a, b) => a.order - b.order);
  const rows = C.buildExportRows(runLike, recs.map(mergedRow), modelShort);
  const reviewers = new Map();
  if (WS.isCloud) {
    WS.votes.forEach(m => m.forEach((v, uid) => { if (!reviewers.has(uid)) reviewers.set(uid, personName(uid)); }));
  }
  rows.forEach((row, i) => {
    const rec = recs[i];
    row['Durum'] = rec.removed ? `Kaldırıldı (${rec.removedReason})` : isPendingDup(rec) ? `Tekrar adayı (${rec.duplicateOf})` : '';
    if (WS.isCloud) {
      const m = WS.votes.get(rec.rid) || new Map();
      reviewers.forEach((name, uid) => {
        const v = m.get(uid);
        row[`Hakem: ${name}`] = v && v.decision ? DECISION_LABEL[v.decision] : '';
        row[`Etiket/Not: ${name}`] = v ? [(v.labels || []).join(', '), v.note].filter(Boolean).join(' · ') : '';
      });
      const ds = [...m.values()].map(v => v.decision).filter(Boolean);
      row['Hakem Uyumu'] = !ds.length ? '' : new Set(ds).size === 1 ? `oybirliği (${ds.length})` : 'çatışma';
      row['Nihai (yönetici)'] = rec.finalDecision || '';
    } else {
      const v = myVote(rec.rid) || {};
      row['Etiketler'] = (v.labels || []).join(', ');
      row['Not'] = v.note || '';
    }
  });
  return rows;
}

function wsExportName(ext) {
  const rl = wsRunLike();
  const base = WS.isCloud ? WS.project.name.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40) : 'screening';
  return `${base}_${new Date().toISOString().slice(0, 10)}_v${rl.promptHash || 'x'}.${ext}`;
}

function wsDownloadCsv() {
  if (!WS.hasData()) return showError('İndirilecek sonuç yok.');
  const rows = wsExportRows();
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`;
  const meta = C.buildMetadataRows(wsRunLike(), WS.records.map(mergedRow)).slice(1).filter(([k]) => k !== 'Sistem talimatı (tam metin)')
    .map(([k, v]) => `# ${String(k).replace(/[\r\n]+/g, ' ')}: ${String(v).replace(/[\r\n]+/g, ' ')}`).join('\n');
  const csv = [headers.map(esc).join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  triggerDownload(new Blob(['﻿' + meta + '\n' + csv], { type: 'text/csv;charset=utf-8' }), wsExportName('csv'));
}

function wsDownloadExcel() {
  if (!WS.hasData()) return showError('İndirilecek sonuç yok.');
  const rows = wsExportRows();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map(h => ({ wch: /Abstract|Gerekçe|Kanıt|Başlık|Denetim|Not/.test(h) ? 50 : 14 }));
  ws['!autofilter'] = { ref: ws['!ref'] };
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  const metaRows = C.buildMetadataRows(wsRunLike(), WS.records.map(mergedRow));
  if (WS.isCloud) metaRows.splice(4, 0, ['Proje', `${WS.project.name} (${WS.project.id})`], ['Kör mod', WS.project.blind ? 'Açık' : 'Kapalı']);
  const meta = XLSX.utils.aoa_to_sheet(metaRows.map(([k, v]) => [k, typeof v === 'string' && v.length > 32000 ? v.slice(0, 32000) + ' …[kısaltıldı]' : v]));
  meta['!cols'] = [{ wch: 40 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, meta, 'Metadata');
  const log = XLSX.utils.aoa_to_sheet([['Olay'], ...((wsRunLike().log) || []).map(l => [l])]);
  XLSX.utils.book_append_sheet(wb, log, 'Log');
  XLSX.writeFile(wb, wsExportName('xlsx'));
}

function wsRelevanceReport() {
  const tbody = el.modalReportBody;
  tbody.textContent = '';
  const top = WS.records.filter(r => !r.removed).map(r => ({ r, a: WS.ai.get(r.rid) }))
    .filter(x => x.a && typeof x.a.relevance_score === 'number')
    .sort((x, y) => y.a.relevance_score - x.a.relevance_score).slice(0, 10);
  top.forEach(({ r, a }, i) => {
    const tr = document.createElement('tr');
    [String(i + 1), r.ID, r.Title, r.Year || '-', `${Math.round(a.relevance_score * 100)}%`, DECISION_LABEL[a.decision] || a.decision, a.relevance_rationale || '-']
      .forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  el.reportModal.style.display = 'flex';
}

// ------------------------------------------------------------
// Cloud: open / close projects
// ------------------------------------------------------------
async function openCloudProject(id) {
  if (isScreeningRunning()) return showError('Analiz sürerken proje değiştirilemez. Önce duraklatın.');
  el.wsLoading.style.display = 'block';
  el.wsLoading.textContent = '☁️ Proje yükleniyor…';
  switchTab('screen');
  try {
    await flushCloudAi();
    const project = await Cloud.getProject(id);
    el.wsLoading.textContent = '☁️ Kayıtlar indiriliyor…';
    const rows = await Cloud.fetchRecords(id);
    el.wsLoading.textContent = `☁️ ${rows.length} kayıt alındı, kararlar indiriliyor…`;
    const votes = await Cloud.fetchVotes(id);
    const profiles = await Cloud.listProfiles().catch(() => []);
    if (WS.unsubscribe) { WS.unsubscribe(); WS.unsubscribe = null; }
    WS.source = 'cloud';
    WS.project = project;
    WS.cloudRecords = rows.map(Cloud.rowToRecord);
    WS.cloudAi = new Map();
    const byDbId = new Map();
    rows.forEach((row, i) => {
      const rec = WS.cloudRecords[i];
      byDbId.set(row.id, rec.rid);
      const ai = Cloud.aiFromRow(row, rec);
      if (ai) WS.cloudAi.set(rec.rid, ai);
    });
    WS.byDbId = byDbId;
    WS.votes = new Map();
    votes.forEach(v => addVote(v));
    WS.profiles = new Map(profiles.map(p => [p.id, p]));
    WS.selected.clear();
    WS.page = 1; WS.dupPage = 1; WS.showAllVotes = false;
    WS.invalidateIndex();
    WS.unsubscribe = Cloud.subscribeVotes(id, v => {
      if (v.user_id === WS.meId) return;
      addVote(v);
      const rid = WS.byDbId.get(v.record_id);
      if (rid) refreshRow(rid);
      updateWsStats();
    });
    renderWorkspace(); renderDuplicates();
    showSuccess(`"${project.name}" açıldı: ${rows.length} kayıt, ${votes.length} karar.`);
  } catch (e) {
    showError('Proje açılamadı: ' + e.message);
  } finally {
    el.wsLoading.style.display = 'none';
  }
}

function addVote(v) {
  const rid = WS.byDbId.get(v.record_id);
  if (!rid) return;
  let m = WS.votes.get(rid);
  if (!m) { m = new Map(); WS.votes.set(rid, m); }
  m.set(v.user_id, { decision: v.decision, labels: v.labels || [], note: v.note || '', updated_at: v.updated_at });
}

function closeCloudProject() {
  flushCloudAi();
  if (WS.unsubscribe) { WS.unsubscribe(); WS.unsubscribe = null; }
  WS.source = 'local';
  WS.project = null;
  WS.cloudRecords = []; WS.cloudAi = new Map(); WS.votes = new Map();
  WS.selected.clear(); WS.page = 1;
  WS.invalidateIndex();
  renderWorkspace(); renderDuplicates();
}

function showLocalWorkspace() {
  if (WS.isCloud) closeCloudProject();
  WS.invalidateIndex();
  renderWorkspace(); renderDuplicates();
}

// ------------------------------------------------------------
// Save local analysis to Supabase (admin)
// ------------------------------------------------------------
function openSaveDialog() {
  if (!Cloud.isAdmin) return showError('Veritabanına yalnızca yönetici kaydedebilir.');
  if (!run || !run.records.length) return showError('Kaydedilecek analiz yok.');
  if (isScreeningRunning()) return showError('Analiz sürerken kaydedilemez; bitmesini bekleyin veya duraklatın.');
  el.saveName.value = el.saveName.value || (run.fileName || 'Tarama').replace(/\.[^.]+$/, '');
  el.saveExistingGroup.style.display = run.cloudProjectId ? 'block' : 'none';
  el.saveModeUpdate.checked = !!run.cloudProjectId;
  el.saveModeNew.checked = !run.cloudProjectId;
  el.saveProgress.textContent = `${run.records.length} kayıt, ${results.size} AI sonucu ve ${Object.values(run.human || {}).filter(h => h.decision).length} kararınız kaydedilecek.`;
  el.saveCloudModal.style.display = 'flex';
}

async function saveToCloud() {
  const btn = el.saveCloudConfirmBtn;
  btn.disabled = true;
  try {
    const protocol = {
      version: C.VERSION, criteria: run.criteria, options: run.options, guidance: run.guidance, icText: run.icText, ecText: run.ecText,
      system: run.system, promptHash: run.promptHash, models: run.models, activeModels: run.activeModels, batchSize: run.batchSize,
      mode: run.mode, fileName: run.fileName, fileHash: run.fileHash, columns: run.columns, usage: run.usage, createdAt: run.createdAt,
      log: (run.log || []).slice(-200)
    };
    let project;
    const update = el.saveModeUpdate.checked && run.cloudProjectId;
    if (update) {
      el.saveProgress.textContent = 'Proje güncelleniyor…';
      project = await Cloud.updateProject(run.cloudProjectId, { protocol, file_name: run.fileName });
    } else {
      const name = el.saveName.value.trim();
      if (!name) throw new Error('Proje adı girin.');
      el.saveProgress.textContent = 'Proje oluşturuluyor…';
      project = await Cloud.createProject({
        name, description: el.saveDescription.value.trim(), blind: el.saveBlind.checked, hide_ai: el.saveHideAi.checked,
        protocol, file_name: run.fileName
      });
    }
    const items = run.records.map(rec => ({ rec, ai: results.get(rec.rid) || null }));
    const ids = await Cloud.upsertRecords(project.id, items, (done, total) => {
      el.saveProgress.textContent = `Kayıtlar yükleniyor: ${done.toLocaleString('tr-TR')} / ${total.toLocaleString('tr-TR')}`;
    });
    const idOf = new Map(ids.map(x => [x.rid, x.id]));
    const myVotes = Object.entries(run.human || {})
      .filter(([rid, h]) => idOf.has(rid) && (h.decision || (h.labels && h.labels.length) || h.note))
      .map(([rid, h]) => ({ record_id: idOf.get(rid), decision: h.decision || null, labels: h.labels || [], note: h.note || '' }));
    if (myVotes.length) {
      el.saveProgress.textContent = `Kararlarınız yükleniyor (${myVotes.length})…`;
      await Cloud.upsertVotes(myVotes);
    }
    run.cloudProjectId = project.id;
    await saveStateNow();
    el.saveCloudModal.style.display = 'none';
    showSuccess(`"${project.name}" veritabanına kaydedildi (${items.length} kayıt). Projeler sekmesinden hakemleri ekleyebilirsiniz.`);
    await refreshProjects();
    await openCloudProject(project.id);
  } catch (e) {
    el.saveProgress.textContent = '❌ ' + e.message;
    showError('Kaydedilemedi: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

// ------------------------------------------------------------
// Projects tab
// ------------------------------------------------------------
let projectsCache = [];

async function refreshProjects() {
  el.projectList.textContent = '';
  el.projectAdminCard.style.display = 'none';
  if (!Cloud.available) {
    el.projectsNote.textContent = 'Supabase bağlantısı kurulamadı (supabase-config.js / internet bağlantısı).';
    return;
  }
  if (!Cloud.user) {
    el.projectsNote.textContent = '';
    el.projectsNote.appendChild(text('span', 'Paylaşılan projeleri görmek ve karar vermek için giriş yapın. Giriş yapmadan yalnızca yerel analiz yapabilirsiniz. '));
    el.projectsNote.appendChild(button('🔐 Giriş yap / Kayıt ol', 'btn-outline-small', () => openAuth('signin')));
    return;
  }
  el.projectsNote.textContent = Cloud.isAdmin
    ? 'Yönetici olarak tüm projeleri görürsünüz. Yerel bir analizi Tarama sekmesindeki "☁️ Veritabanına kaydet" ile proje yapabilir, "Yönet" ile hakem ekleyebilirsiniz.'
    : 'Yöneticinin sizinle paylaştığı projeler. Açıp Include / Maybe / Exclude kararlarınızı verebilirsiniz.';
  try {
    projectsCache = await Cloud.listProjects();
  } catch (e) { showError('Projeler alınamadı: ' + e.message); return; }
  if (!projectsCache.length) {
    el.projectList.appendChild(text('div', Cloud.isAdmin ? 'Henüz proje yok.' : 'Sizinle paylaşılmış proje yok. Yöneticiden sizi projeye eklemesini isteyin (kayıt olduğunuz e-posta ile).', 'empty-note'));
    return;
  }
  projectsCache.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card' + (WS.isCloud && WS.project.id === p.id ? ' project-open' : '');
    const info = document.createElement('div');
    info.className = 'project-info';
    info.appendChild(text('div', p.name, 'project-name'));
    if (p.description) info.appendChild(text('div', p.description, 'muted-small'));
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    meta.append(
      pill(p.blind ? '🙈 Kör mod' : '👁️ Açık mod', p.blind ? 'pill-warn' : 'pill-ok'),
      text('span', `${p.total.toLocaleString('tr-TR')} kayıt`, 'muted-small'),
      text('span', `${p.removed} tekrar kaldırıldı`, 'muted-small'),
      text('span', `${p.members} hakem`, 'muted-small'),
      text('span', `güncelleme: ${new Date(p.updated_at).toLocaleString('tr-TR')}`, 'muted-small')
    );
    info.appendChild(meta);
    const prog = document.createElement('div');
    prog.className = 'mini-progress';
    const pct = p.total ? Math.round(p.my_votes / p.total * 100) : 0;
    const bar = document.createElement('div'); bar.className = 'mini-progress-fill'; bar.style.width = `${pct}%`;
    prog.appendChild(bar);
    info.append(prog, text('div', `Sizin ilerlemeniz: ${p.my_votes}/${p.total} (%${pct})`, 'muted-small'));
    const act = document.createElement('div');
    act.className = 'project-actions';
    act.appendChild(button('📂 Aç', 'btn-secondary btn-compact', () => openCloudProject(p.id)));
    if (Cloud.isAdmin) act.appendChild(button('⚙️ Yönet', 'btn-tertiary btn-compact', () => showProjectAdmin(p.id)));
    card.append(info, act);
    el.projectList.appendChild(card);
  });
}

async function showProjectAdmin(pid) {
  const card = el.projectAdminCard;
  card.style.display = 'block';
  card.textContent = '';
  card.appendChild(text('div', 'Yükleniyor…', 'muted-inline'));
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  let project, members, people, votes;
  try {
    [project, members, people, votes] = await Promise.all([
      Cloud.getProject(pid), Cloud.listMembers(pid), Cloud.listProfiles(), Cloud.fetchVotes(pid)
    ]);
  } catch (e) { card.textContent = 'Yüklenemedi: ' + e.message; return; }
  card.textContent = '';
  const h = text('h2', `⚙️ ${project.name}`);
  card.appendChild(h);

  // settings
  const grid = document.createElement('div');
  grid.className = 'settings-grid';
  const fg = (label, input) => { const g = document.createElement('div'); g.className = 'form-group'; const l = text('label', label); g.append(l, input); return g; };
  const nameI = document.createElement('input'); nameI.type = 'text'; nameI.value = project.name; nameI.className = 'text-input';
  const descI = document.createElement('input'); descI.type = 'text'; descI.value = project.description; descI.className = 'text-input';
  grid.append(fg('Proje adı', nameI), fg('Açıklama', descI));
  card.appendChild(grid);
  const blindL = document.createElement('label'); blindL.className = 'checkbox-label';
  const blindC = document.createElement('input'); blindC.type = 'checkbox'; blindC.checked = project.blind;
  blindL.append(blindC, document.createTextNode(' 🙈 Kör mod: hakemler yalnızca kendi kararlarını görür (veritabanı kuralıyla uygulanır)'));
  const aiL = document.createElement('label'); aiL.className = 'checkbox-label';
  const aiC = document.createElement('input'); aiC.type = 'checkbox'; aiC.checked = project.hide_ai;
  aiL.append(aiC, document.createTextNode(' 🤖 AI kararlarını, güveni ve gerekçeyi hakemlerden gizle (kanıt vurguları görünür kalır)'));
  card.append(blindL, aiL);
  const saveRow = document.createElement('div');
  saveRow.className = 'row-actions';
  saveRow.appendChild(button('💾 Ayarları kaydet', 'btn-secondary btn-compact', async () => {
    try {
      const upd = await Cloud.updateProject(pid, { name: nameI.value.trim() || project.name, description: descI.value.trim(), blind: blindC.checked, hide_ai: aiC.checked });
      if (WS.isCloud && WS.project.id === pid) { WS.project = Object.assign(WS.project, upd); renderWorkspace(); }
      showSuccess('Proje ayarları kaydedildi.');
      refreshProjects().then(() => showProjectAdmin(pid));
    } catch (e) { showError(e.message); }
  }));
  saveRow.appendChild(button('📋 Protokolü Analiz formuna yükle', 'btn-tertiary btn-compact', () => { loadProtocolIntoForm(project.protocol); switchTab('analysis'); }));
  saveRow.appendChild(button('🗑️ Projeyi sil', 'btn-danger btn-compact', async () => {
    const typed = prompt(`"${project.name}" projesi, tüm kayıtları ve hakem kararlarıyla birlikte kalıcı olarak silinecek.\nOnaylamak için proje adını yazın:`);
    if (typed !== project.name) { if (typed !== null) showError('Proje adı eşleşmedi, silinmedi.'); return; }
    try {
      await Cloud.deleteProject(pid);
      if (WS.isCloud && WS.project.id === pid) closeCloudProject();
      showSuccess('Proje silindi.');
      refreshProjects();
    } catch (e) { showError(e.message); }
  }));
  card.appendChild(saveRow);

  // members
  card.appendChild(text('h3', '👥 Hakemler', 'section-h3'));
  const memberIds = new Set(members.map(m => m.user_id));
  const tbl = document.createElement('table');
  tbl.className = 'compact-table';
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Ad', 'E-posta', 'Include', 'Maybe', 'Exclude', 'Toplam', ''].forEach(t => hr.appendChild(text('th', t)));
  thead.appendChild(hr); tbl.appendChild(thead);
  const tb = document.createElement('tbody');
  const stats = new Map();
  votes.forEach(v => {
    if (!v.decision) return;
    const s = stats.get(v.user_id) || { Include: 0, Uncertain: 0, Exclude: 0 };
    s[v.decision]++; stats.set(v.user_id, s);
  });
  const rowsFor = [...new Set([...members.map(m => m.user_id), ...stats.keys()])];
  const pById = new Map(people.map(p => [p.id, p]));
  rowsFor.forEach(uid => {
    const p = pById.get(uid) || { display_name: '?', email: '', role: '' };
    const s = stats.get(uid) || { Include: 0, Uncertain: 0, Exclude: 0 };
    const tr = document.createElement('tr');
    [`${p.display_name}${p.role === 'admin' ? ' (yönetici)' : ''}`, p.email, s.Include, s.Uncertain, s.Exclude, s.Include + s.Uncertain + s.Exclude]
      .forEach(v => tr.appendChild(text('td', String(v))));
    const tdA = document.createElement('td');
    if (memberIds.has(uid)) tdA.appendChild(button('Çıkar', 'btn-ghost', async () => {
      if (!confirm(`${p.display_name} projeden çıkarılsın mı? (Verdiği kararlar silinmez.)`)) return;
      try { await Cloud.removeMember(pid, uid); showProjectAdmin(pid); refreshProjects(); } catch (e) { showError(e.message); }
    }));
    tr.appendChild(tdA);
    tb.appendChild(tr);
  });
  if (!rowsFor.length) { const tr = document.createElement('tr'); const c = text('td', 'Henüz hakem yok.'); c.colSpan = 7; tr.appendChild(c); tb.appendChild(tr); }
  tbl.appendChild(tb);
  const wrap = document.createElement('div'); wrap.className = 'key-status-wrap'; wrap.appendChild(tbl);
  card.appendChild(wrap);

  const add = document.createElement('div');
  add.className = 'row-actions';
  const candidates = people.filter(p => !memberIds.has(p.id) && p.role !== 'admin');
  const sel = document.createElement('select');
  sel.className = 'text-input';
  const o0 = document.createElement('option'); o0.value = ''; o0.textContent = candidates.length ? 'Kayıtlı kullanıcı seçin…' : 'Eklenebilecek kayıtlı kullanıcı yok'; sel.appendChild(o0);
  candidates.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.display_name} <${p.email}>`; sel.appendChild(o); });
  add.append(sel, button('➕ Projeye ekle', 'btn-secondary btn-compact', async () => {
    if (!sel.value) return;
    try { await Cloud.addMember(pid, sel.value); showSuccess('Hakem eklendi.'); showProjectAdmin(pid); refreshProjects(); } catch (e) { showError(e.message); }
  }));
  card.appendChild(add);
  card.appendChild(text('p', 'Hakemler önce bu sayfadan "Kayıt ol" ile hesap açmalıdır; ardından listede görünürler. Hakemler yalnızca eklendikleri projeleri görür, yalnızca kendi kararlarını, etiketlerini ve notlarını değiştirebilir.', 'muted-small'));

  // conflicts summary
  const byRec = new Map();
  votes.forEach(v => { if (v.decision) { const s = byRec.get(v.record_id) || new Set(); s.add(v.decision); byRec.set(v.record_id, s); } });
  const conflicts = [...byRec.values()].filter(s => s.size > 1).length;
  card.appendChild(text('p', `⚡ Hakemler arası çatışan kayıt: ${conflicts} · En az bir karar almış kayıt: ${byRec.size}`, 'muted-inline'));
}

// ------------------------------------------------------------
// Auth UI
// ------------------------------------------------------------
let authMode = 'signin';
function openAuth(mode) {
  if (!Cloud.available) return showError('Supabase bağlantısı yok.');
  setAuthMode(mode || 'signin');
  el.authMessage.textContent = '';
  el.authModal.style.display = 'flex';
  setTimeout(() => el.authEmail.focus(), 50);
}
function setAuthMode(mode) {
  authMode = mode;
  el.authTabSignin.classList.toggle('active', mode === 'signin');
  el.authTabSignup.classList.toggle('active', mode === 'signup');
  el.authNameGroup.style.display = mode === 'signup' ? 'block' : 'none';
  el.authSubmitBtn.textContent = mode === 'signup' ? 'Kayıt ol' : 'Giriş yap';
  el.authPassword.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
}
async function submitAuth(e) {
  if (e) e.preventDefault();
  const email = el.authEmail.value.trim();
  const pw = el.authPassword.value;
  el.authMessage.className = 'auth-message';
  if (!email || !pw) { el.authMessage.textContent = 'E-posta ve şifre girin.'; return; }
  el.authSubmitBtn.disabled = true;
  try {
    if (authMode === 'signup') {
      if (pw.length < 6) throw new Error('Şifre en az 6 karakter olmalı.');
      const r = await Cloud.signUp(email, pw, el.authName.value.trim());
      if (r.needsConfirmation) {
        el.authMessage.className = 'auth-message ok';
        el.authMessage.textContent = '✅ Kayıt alındı. E-postanıza gelen onay bağlantısına tıklayın, ardından buradan giriş yapın.';
        setAuthMode('signin');
        return;
      }
    } else {
      await Cloud.signIn(email, pw);
    }
    el.authModal.style.display = 'none';
    el.authPassword.value = '';
  } catch (err) {
    el.authMessage.className = 'auth-message err';
    el.authMessage.textContent = /Invalid login/i.test(err.message) ? 'E-posta veya şifre hatalı.'
      : /Email not confirmed/i.test(err.message) ? 'E-posta henüz onaylanmadı. Gelen kutunuzdaki bağlantıya tıklayın.'
      : err.message;
  } finally {
    el.authSubmitBtn.disabled = false;
  }
}
async function forgotPassword() {
  const email = el.authEmail.value.trim();
  if (!email) { el.authMessage.textContent = 'Önce e-posta adresinizi yazın.'; return; }
  try {
    await Cloud.resetPassword(email);
    el.authMessage.className = 'auth-message ok';
    el.authMessage.textContent = 'Şifre sıfırlama bağlantısı gönderildi. Bağlantıyı açınca yeni şifre istenecek.';
  } catch (e) { el.authMessage.className = 'auth-message err'; el.authMessage.textContent = e.message; }
}

function renderAuthArea() {
  const a = el.authArea;
  a.textContent = '';
  if (!Cloud.available) { a.appendChild(text('span', 'Çevrimdışı mod', 'muted-small')); return; }
  if (!Cloud.user) { a.appendChild(button('🔐 Giriş yap', 'btn-outline-small', () => openAuth('signin'))); return; }
  const who = text('span', `👤 ${Cloud.displayName}`, 'auth-user');
  who.title = `${Cloud.user.email} — adınızı değiştirmek için tıklayın`;
  who.addEventListener('click', async () => {
    const n = prompt('Diğer hakemlerin göreceği adınız:', Cloud.displayName);
    if (n && n.trim()) { try { await Cloud.updateDisplayName(n.trim()); renderAuthArea(); } catch (e) { showError(e.message); } }
  });
  a.append(who, pill(Cloud.isAdmin ? 'Yönetici' : 'Hakem', Cloud.isAdmin ? 'pill-cloud' : 'pill-muted'),
    button('Çıkış', 'btn-ghost', async () => { await Cloud.signOut(); }));
}

async function onAuthChanged(event) {
  renderAuthArea();
  if (event === 'PASSWORD_RECOVERY') {
    const pw = prompt('Yeni şifrenizi girin (en az 6 karakter):');
    if (pw) { try { await Cloud.updatePassword(pw); showSuccess('Şifreniz güncellendi.'); } catch (e) { showError(e.message); } }
  }
  if (!Cloud.user && WS.isCloud) closeCloudProject();
  refreshProjects();
  renderWorkspace();
}

// ------------------------------------------------------------
// Tabs & init
// ------------------------------------------------------------
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== `tab-${name}`; });
  if (name === 'dups') renderDuplicates();
  if (name === 'screen') renderWorkspace();
  try { sessionStorage.setItem('gls_tab', name); } catch (e) { /* ignore */ }
}

function initWorkspace() {
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  const rerender = () => { WS.page = 1; renderWorkspace(); };
  ['filterAi', 'filterMine', 'filterStatus', 'filterLabel', 'sortBy', 'pageSize'].forEach(id => el[id].addEventListener('change', rerender));
  el.filterSearch.addEventListener('input', debounce(rerender, 250));
  el.toggleAllAbstractsBtn.addEventListener('click', () => {
    WS.expandAll = !WS.expandAll;
    el.toggleAllAbstractsBtn.textContent = WS.expandAll ? '↕️ Özetleri daralt' : '↕️ Özetleri genişlet';
    el.resultsTable.classList.toggle('expand-all', WS.expandAll);
  });
  el.selectPage.addEventListener('change', () => {
    el.resultsBody.querySelectorAll('tr[data-rid]').forEach(tr => {
      if (el.selectPage.checked) WS.selected.add(tr.dataset.rid); else WS.selected.delete(tr.dataset.rid);
    });
    renderWorkspace();
  });
  el.clearSelectionBtn.addEventListener('click', () => { WS.selected.clear(); renderWorkspace(); });
  el.reanalyzeSelectedBtn.addEventListener('click', () => reanalyzeRids([...WS.selected]));
  el.reanalyzeAllBtn.addEventListener('click', () => reanalyzeRids((WS._lastFiltered || []).map(r => r.rid)));
  el.retryErrorsBtn.addEventListener('click', () => reanalyzeRids(WS.records.filter(r => { const a = WS.ai.get(r.rid); return a && a.error && !r.removed; }).map(r => r.rid)));
  el.downloadCsvBtn.addEventListener('click', wsDownloadCsv);
  el.downloadExcelBtn.addEventListener('click', wsDownloadExcel);
  el.relevanceReportBtn.addEventListener('click', wsRelevanceReport);
  el.saveToCloudBtn.addEventListener('click', openSaveDialog);
  el.saveCloudConfirmBtn.addEventListener('click', saveToCloud);
  el.loadProtocolBtn.addEventListener('click', () => { loadProtocolIntoForm(WS.project.protocol); switchTab('analysis'); });
  el.dupScanBtn.addEventListener('click', scanFuzzyDuplicates);
  el.dupRemoveAllBtn.addEventListener('click', removeAllRight);
  el.refreshProjectsBtn.addEventListener('click', refreshProjects);
  el.authTabSignin.addEventListener('click', () => setAuthMode('signin'));
  el.authTabSignup.addEventListener('click', () => setAuthMode('signup'));
  el.authForm.addEventListener('submit', submitAuth);
  el.authForgotBtn.addEventListener('click', forgotPassword);
  window.addEventListener('beforeunload', () => { if (WS.aiQueue.length) flushCloudAi(); });

  let tab = 'analysis';
  try { tab = sessionStorage.getItem('gls_tab') || 'analysis'; } catch (e) { /* ignore */ }
  switchTab(tab);
  renderAuthArea();
  if (Cloud.available) {
    Cloud.onChange(onAuthChanged);
    Cloud.init().then(() => { renderAuthArea(); refreshProjects(); renderWorkspace(); }).catch(e => console.warn(e));
  } else refreshProjects();
}
