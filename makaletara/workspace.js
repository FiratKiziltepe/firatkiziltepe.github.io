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
  compactAbs: false,
  docTypes: new Set(),
  themeSel: new Set(),     // theme filter (any of), NO_THEME = records without a theme
  statsScope: 'all',
  focusRid: null,
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
  // members work with the same rights as the admin (final decisions, duplicates,
  // re-analysis, settings); creating/deleting projects and members stay admin-only
  get canCurate() { return this.source === 'local' || !!(this.isCloud && Cloud.user); },
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

/**
 * opts.advance: 'scroll' (keyboard) | 'focus' (click) | false
 * With a filter such as "karar vermediklerim" the voted row leaves the
 * table immediately and the next row takes the focus — no full re-render.
 */
async function setMyVote(rid, patch, opts = {}) {
  const rec = WS.recByRid(rid);
  if (!rec) return;
  const prev = myVote(rid);
  const next = Object.assign({ decision: null, labels: [], note: '', reasons: [] }, prev || {}, patch);
  // exclusion reasons only belong to an Exclude vote
  if (next.decision !== 'Exclude') next.reasons = [];
  if (!WS.isCloud) {
    run.human = run.human || {};
    run.human[rid] = { decision: next.decision, labels: next.labels, note: next.note, reasons: next.reasons };
    scheduleSave();
    afterVoteView(rid, opts.advance);
    return;
  }
  let m = WS.votes.get(rid);
  if (!m) { m = new Map(); WS.votes.set(rid, m); }
  m.set(WS.meId, next);
  afterVoteView(rid, opts.advance);
  try {
    await Cloud.upsertVote({ record_id: rec.dbId, decision: next.decision, labels: next.labels, note: next.note, reasons: next.reasons });
  } catch (e) {
    if (prev) m.set(WS.meId, prev); else m.delete(WS.meId);
    renderWorkspace();
    showError('Karar kaydedilemedi, geri alındı: ' + e.message);
  }
}

function afterVoteView(rid, advance) {
  const rec = WS.recByRid(rid);
  const tr = el.resultsBody.querySelector(`tr[data-rid="${rid}"]`);
  updateWsStats();
  if (!tr || !rec) return;
  if (matchesWs(rec, wsFilterState())) {
    tr.replaceWith(buildWsRow(rec));
    if (advance) moveFocusFrom(rid, advance === 'scroll');
    return;
  }
  // leaves the current filter
  const nextTr = tr.nextElementSibling || tr.previousElementSibling;
  if (WS._lastFiltered) WS._lastFiltered = WS._lastFiltered.filter(r => r.rid !== rid);
  tr.classList.add('row-leaving');
  setTimeout(() => {
    tr.remove();
    const left = (WS._lastFiltered || []).length;
    el.filterCount.textContent = `${left.toLocaleString('tr-TR')} eşleşen · ${WS.records.length.toLocaleString('tr-TR')} toplam`;
    updateSelectionBar();
    if (!el.resultsBody.querySelector('tr[data-rid]')) { renderWorkspace(); return; }
    if (nextTr && nextTr.dataset.rid) setFocusRow(nextTr.dataset.rid, true);
  }, 160);
}

function moveFocusFrom(rid, scroll) {
  const rows = [...el.resultsBody.querySelectorAll('tr[data-rid]')];
  const i = rows.findIndex(t => t.dataset.rid === rid);
  if (i !== -1 && rows[i + 1]) setFocusRow(rows[i + 1].dataset.rid, scroll);
}

async function setFinalDecision(rid, decision) {
  const rec = WS.recByRid(rid);
  const prev = rec.finalDecision;
  rec.finalDecision = decision || '';
  afterVoteView(rid, false);
  try {
    await Cloud.patchRecords(WS.project.id, [{ rid, final_decision: decision || null, final_by: decision ? Cloud.user.id : null }]);
  } catch (e) {
    rec.finalDecision = prev;
    renderWorkspace();
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
    people: WS.isCloud ? el.filterPeople.value : '',
    docTypes: WS.docTypes,
    themes: WS.themeSel,
    yearFrom: parseInt(el.yearFrom.value, 10),
    yearTo: parseInt(el.yearTo.value, 10),
    sort: el.sortBy.value
  };
}

const NO_DOCTYPE = '(belge türü yok)';
const docTypeOf = rec => String(rec.DocType || '').trim() || NO_DOCTYPE;

function matchesWs(rec, f) {
  const ai = WS.ai.get(rec.rid);
  if (f.status === 'removed') { if (!rec.removed) return false; }
  else if (f.status === 'dups') { if (!isPendingDup(rec)) return false; }
  else if (f.status === 'archived') { if (!rec.archived || rec.removed) return false; }
  else if (rec.removed || isPendingDup(rec) || rec.archived) return false;

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
  if (f.status === 'vdiff' && !versionsDisagree(rec.rid)) return false;
  if (f.status.startsWith('ver:') && versionOf(ai) !== f.status.slice(4)) return false;
  if (f.status === 'flags' && !(ai && aiFlags(ai).length)) return false;
  if (f.status.startsWith('incons')) {
    const said = ai ? inconsistencies(ai) : [];
    if (!said.length) return false;
    if (f.status !== 'incons' && !said.includes(f.status.slice(7))) return false;
  }
  if (f.people) {
    const [kind, who, want] = f.people.split('|');
    if (kind === 'f') {
      if (want === 'none' ? !!rec.finalDecision : rec.finalDecision !== want) return false;
    } else {
      const v = who === WS.meId ? myVote(rec.rid) : ((WS.votes.get(rec.rid) || new Map()).get(who) || null);
      const d = v && v.decision;
      if (want === 'none' ? !!d : want === 'any' ? !d : d !== want) return false;
    }
  }

  if (f.docTypes.size && !f.docTypes.has(docTypeOf(rec))) return false;
  if (f.themes.size) {
    const ts = Assist.effectiveThemes(rec);
    if (!(ts.length ? ts.some(t => f.themes.has(t)) : f.themes.has(NO_THEME))) return false;
  }
  if (isFinite(f.yearFrom) || isFinite(f.yearTo)) {
    const y = parseInt(rec.Year, 10);
    if (!isFinite(y)) return false;
    if (isFinite(f.yearFrom) && y < f.yearFrom) return false;
    if (isFinite(f.yearTo) && y > f.yearTo) return false;
  }
  if (f.label) {
    const [kind, term] = f.label.startsWith('r:') ? ['reasons', f.label.slice(2)] : ['labels', f.label.replace(/^l:/, '')];
    const terms = [...((mv && mv[kind]) || []), ...otherVotes(rec.rid).flatMap(v => v[kind] || [])];
    if (!terms.includes(term)) return false;
  }
  if (f.q) {
    const hay = `${rec.rid} ${rec.ID} ${rec.Title} ${rec.Authors} ${rec.DOI} ${rec.Abstract} ${ai ? C.splitRationale(ai).text : ''} ${(mv && mv.note) || ''}`.toLowerCase();
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
  else if (f.sort.startsWith('year_')) {
    const dir = f.sort === 'year_asc' ? 1 : -1;
    const y = r => parseInt(r.Year, 10);
    // records without a year always go last
    list.sort((a, b) => (isFinite(y(a)) ? 0 : 1) - (isFinite(y(b)) ? 0 : 1) || dir * ((y(a) || 0) - (y(b) || 0)) || a.order - b.order);
  } else if (f.sort.startsWith('title_') || f.sort.startsWith('author_')) {
    const dir = f.sort.endsWith('_desc') ? -1 : 1;
    const key = f.sort.startsWith('title_')
      ? r => String(r.Title || '').replace(/^[^\p{L}\p{N}]+/u, '')
      : r => String(r.Authors || '').split(/\s*;\s*/)[0];
    list.sort((a, b) => {
      const ka = key(a), kb = key(b);
      if (!ka !== !kb) return ka ? -1 : 1;
      return dir * ka.localeCompare(kb, 'tr', { sensitivity: 'base' }) || a.order - b.order;
    });
  } else list.sort((a, b) => a.order - b.order);
  return list;
}

// ---------- document type filter (multi-select) ----------
function renderDocTypeFilter() {
  const counts = new Map();
  WS.records.forEach(r => { if (!r.removed && !r.archived) counts.set(docTypeOf(r), (counts.get(docTypeOf(r)) || 0) + 1); });
  // drop selections that no longer exist (e.g. after switching project)
  [...WS.docTypes].forEach(t => { if (!counts.has(t)) WS.docTypes.delete(t); });
  const types = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));
  const sig = types.map(t => t.join('=')).join('|') + '#' + [...WS.docTypes].join('|');
  el.docTypeSummary.textContent = !WS.docTypes.size ? 'Tümü'
    : WS.docTypes.size === 1 ? [...WS.docTypes][0] : `${WS.docTypes.size} tür seçili`;
  el.docTypeFilter.classList.toggle('dd-active', WS.docTypes.size > 0);
  if (el.docTypeList.dataset.sig === sig) return;
  el.docTypeList.dataset.sig = sig;
  el.docTypeList.textContent = '';
  types.forEach(([t, n]) => {
    const lab = document.createElement('label');
    lab.className = 'dd-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = WS.docTypes.has(t);
    cb.addEventListener('change', () => {
      if (cb.checked) WS.docTypes.add(t); else WS.docTypes.delete(t);
      WS.page = 1; renderWorkspace();
    });
    lab.append(cb, text('span', t, 'dd-name'), text('span', n.toLocaleString('tr-TR'), 'dd-count'));
    el.docTypeList.appendChild(lab);
  });
}

// ---------- sticky search bar ----------
/**
 * The search bar sticks under the tabs while the list scrolls. The filter fields
 * live in their own card below it; while the bar is stuck, "Filtreler" moves
 * them into the bar and back. The home card keeps its height meanwhile, so the
 * page never jumps. --ws-sticky-top tells the table what is already stuck.
 */
function setupStickyFilters() {
  const root = document.documentElement;
  const bar = el.filtersCard, home = el.filtersHome, grid = el.filtersGrid;
  const top = () => { const t = document.querySelector('.tabs'); return t ? Math.round(t.getBoundingClientRect().height) + 16 : 8; };
  const measure = () => {
    const t = top();
    root.style.setProperty('--ws-tabs-h', `${t}px`);
    root.style.setProperty('--ws-sticky-top', `${t + (bar.classList.contains('is-stuck') ? bar.offsetHeight + 8 : 0)}px`);
  };
  const dock = open => {
    if (open === bar.classList.contains('expanded')) return;
    if (open) { home.style.minHeight = `${home.offsetHeight}px`; el.filtersPanel.appendChild(grid); }
    else { home.appendChild(grid); home.style.minHeight = ''; }
    bar.classList.toggle('expanded', open);
    el.filtersToggleBtn.setAttribute('aria-expanded', String(open));
    measure();
  };
  const check = () => {
    if (!bar.offsetParent) return;   // another tab is open
    const stuck = el.filtersSentinel.getBoundingClientRect().top < top();
    if (stuck === bar.classList.contains('is-stuck')) return;
    bar.classList.toggle('is-stuck', stuck);
    if (!stuck) dock(false);
    measure();
  };
  el.filtersToggleBtn.addEventListener('click', () => dock(!bar.classList.contains('expanded')));
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', () => { measure(); check(); });
  if (window.ResizeObserver) new ResizeObserver(measure).observe(bar);
  measure();
}

// ---------- theme filter (multi-select: confirmed themes, else the AI suggestion) ----------
const NO_THEME = '(tema yok)';
function renderThemeFilterDd() {
  const counts = new Map(Assist.themeConfig().all.map(g => [g, 0]));
  let none = 0;
  WS.records.forEach(r => {
    if (!isActive(r)) return;
    const ts = Assist.effectiveThemes(r);
    if (!ts.length) none++;
    ts.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
  });
  const items = [...counts.entries()];
  if (none) items.push([NO_THEME, none]);
  [...WS.themeSel].forEach(t => { if (!counts.has(t) && t !== NO_THEME) WS.themeSel.delete(t); });
  el.themeFilterSummary.textContent = !WS.themeSel.size ? 'Tümü' : WS.themeSel.size === 1 ? [...WS.themeSel][0] : `${WS.themeSel.size} tema seçili`;
  el.themeFilterDd.classList.toggle('dd-active', WS.themeSel.size > 0);
  const sig = items.map(t => t.join('=')).join('|') + '#' + [...WS.themeSel].join('|');
  if (el.themeFilterList.dataset.sig === sig) return;
  el.themeFilterList.dataset.sig = sig;
  el.themeFilterList.textContent = '';
  if (!items.length) { el.themeFilterList.appendChild(text('div', 'Henüz tema yok. Tematik sekmesinden analiz edin.', 'dd-empty')); return; }
  items.forEach(([t, n]) => {
    const lab = document.createElement('label');
    lab.className = 'dd-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = WS.themeSel.has(t);
    cb.addEventListener('change', () => {
      if (cb.checked) WS.themeSel.add(t); else WS.themeSel.delete(t);
      WS.page = 1; renderWorkspace();
    });
    lab.append(cb, text('span', t, 'dd-name'), text('span', n.toLocaleString('tr-TR'), 'dd-count'));
    el.themeFilterList.appendChild(lab);
  });
}

// ---------- sortable column headers ----------
const SORT_FIRST = { title: 'asc', author: 'asc', year: 'desc', conf: 'asc' };
function onHeaderSort(key) {
  const cur = el.sortBy.value;
  const next = cur === `${key}_${SORT_FIRST[key]}` ? `${key}_${SORT_FIRST[key] === 'asc' ? 'desc' : 'asc'}` : `${key}_${SORT_FIRST[key]}`;
  el.sortBy.value = next;
  WS.page = 1;
  renderWorkspace();
}
function renderHeaderSort() {
  const [key, dir] = el.sortBy.value.split('_');
  document.querySelectorAll('.th-sort').forEach(b => {
    const on = b.dataset.sort === key;
    b.classList.toggle('active', on);
    b.dataset.dir = on ? dir : '';
  });
}

function clearFilters() {
  el.filterSearch.value = '';
  ['filterAi', 'filterMine', 'filterStatus'].forEach(id => { el[id].value = 'all'; });
  el.filterPeople.value = '';
  el.filterLabel.value = '';
  WS.docTypes.clear();
  WS.themeSel.clear();
  el.themeFilterDd.open = false;
  el.yearFrom.value = '';
  el.yearTo.value = '';
  el.sortBy.value = 'order';
  el.docTypeFilter.open = false;
  WS.page = 1;
  renderWorkspace();
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
  Assist.onWorkspaceChange();
  Report.onWorkspaceChange();
  if (!has) return;
  renderSourceBar();
  renderLabelFilter();
  renderPeopleFilter();
  renderDocTypeFilter();
  renderThemeFilterDd();
  renderVersionFilter();
  renderHeaderSort();
  const list = filteredRecords();
  const ps = pageSize();
  const pages = Math.max(1, Math.ceil(list.length / ps));
  if (WS.page > pages) WS.page = pages;
  const slice = list.slice((WS.page - 1) * ps, WS.page * ps);
  const frag = document.createDocumentFragment();
  slice.forEach(rec => frag.appendChild(buildWsRow(rec)));
  el.resultsBody.textContent = '';
  el.resultsBody.appendChild(frag);
  el.resultsTable.classList.toggle('compact-abs', WS.compactAbs);
  el.filterCount.textContent = `${list.length.toLocaleString('tr-TR')} eşleşen · ${WS.records.length.toLocaleString('tr-TR')} toplam`;
  renderPager(el.pagerTop, list.length, pages);
  renderPager(el.pagerBottom, list.length, pages);
  el.selectPage.checked = slice.length > 0 && slice.every(r => WS.selected.has(r.rid));
  WS._lastFiltered = list;
  renderActiveFilters();
  updateSelectionBar();
  updateWsStats();
  refreshIcons();
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
  const kind = document.createElement('span');
  kind.className = 'source-kind';
  const name = document.createElement('div');
  name.className = 'source-name';
  const meta = document.createElement('div');
  meta.className = 'source-meta';
  if (WS.isCloud) {
    const p = WS.project;
    kind.append(uiIcon('folder-kanban'), document.createTextNode('Ekip projesi'));
    name.appendChild(text('strong', p.name));
    meta.append(
      badge(p.blind ? 'eye-off' : 'eye', p.blind ? 'Kör mod açık' : 'Kör mod kapalı', p.blind ? 'warn' : ''),
      badge(Cloud.isAdmin ? 'shield' : 'user', Cloud.isAdmin ? 'Yönetici' : 'Hakem'));
    if (p.hide_ai) meta.append(badge('bot-off', 'AI kararları hakemlerden gizli'));
    const mix = new Map();
    WS.records.forEach(r => { if (isActive(r)) { const v = versionOf(WS.ai.get(r.rid)); if (v) mix.set(v, (mix.get(v) || 0) + 1); } });
    if (mix.size > 1) {
      const b = badge('git-branch', `AI sonuçları ${mix.size} sürümden`, 'warn');
      b.title = `Etkin AI sonuçları farklı protokol sürümleriyle üretilmiş: ${[...mix].map(([v, n]) => `v${v}: ${n}`).join(' · ')}. Proje → Yönet → AI sürümleri.`;
      meta.append(b);
    }
    const live = text('span', '', 'live-status');
    live.id = 'liveStatus';
    meta.appendChild(live);
    if (Cloud.isAdmin && p.blind) {
      const lab = document.createElement('label');
      lab.className = 'ui-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = WS.showAllVotes;
      cb.addEventListener('change', () => { WS.showAllVotes = cb.checked; renderWorkspace(); });
      lab.append(cb, document.createTextNode('Tüm hakem kararlarını göster (yalnızca siz)'));
      meta.appendChild(lab);
    }
    const back = uiButton('monitor', 'Yerel sonuçlara dön', 'ui-btn ui-btn-ghost ui-btn-sm', () => { closeCloudProject(); });
    back.disabled = !(run && run.records && run.records.length);
    right.append(uiButton('refresh-cw', 'Yenile', 'ui-btn ui-btn-outline ui-btn-sm', () => openCloudProject(p.id)), back);
  } else {
    kind.append(uiIcon('monitor'), document.createTextNode('Yerel analiz'));
    name.appendChild(text('strong', run ? run.fileName : ''));
    if (run && run.cloudProjectId) meta.append(badge('cloud-check', 'Veritabanına kaydedildi', 'ok'));
    meta.append(text('span', 'Kararlarınız bu tarayıcıda saklanır.', 'source-note'));
  }
  left.append(kind, name, meta);
  bar.append(left, right);
  el.saveToCloudBtn.style.display = !WS.isCloud && Cloud.available && canCreateProjects() ? 'inline-flex' : 'none';
  el.loadProtocolBtn.style.display = WS.isCloud && WS.canCurate ? 'inline-flex' : 'none';
  el.filterPeopleField.style.display = WS.isCloud ? '' : 'none';
  el.bulkFinalGroup.style.display = WS.isCloud ? 'inline-flex' : 'none';
  renderLiveStatus();
  el.costPanel.style.display = WS.isCloud ? 'none' : '';
  el.statConflictCard.style.display = WS.isCloud && !WS.blindForMe ? '' : 'none';
  el.filterStatus.querySelectorAll('.cloud-only').forEach(o => { o.hidden = !WS.isCloud; });
}

// ---------- active filter chips (also written to the export metadata) ----------
function selectedText(sel) { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; }

/** Every filter that currently narrows the list: { label, value, clear } */
function activeFilterList() {
  const out = [];
  const q = el.filterSearch.value.trim();
  if (q) out.push({ label: 'Arama', value: `"${q}"`, clear: () => { el.filterSearch.value = ''; } });
  [['filterAi', 'AI kararı'], ['filterMine', 'Benim kararım'], ['filterStatus', 'Durum']].forEach(([id, label]) => {
    if (el[id].value !== 'all') out.push({ label, value: selectedText(el[id]), clear: () => { el[id].value = 'all'; } });
  });
  if (WS.isCloud && el.filterPeople.value) out.push({ label: 'Hakem / nihai', value: selectedText(el.filterPeople), clear: () => { el.filterPeople.value = ''; } });
  if (el.filterLabel.value) {
    out.push({ label: el.filterLabel.value.startsWith('r:') ? 'Hariç gerekçesi' : 'Etiket', value: el.filterLabel.value.replace(/^[lr]:/, ''), clear: () => { el.filterLabel.value = ''; } });
  }
  if (WS.docTypes.size) out.push({ label: 'Belge türü', value: [...WS.docTypes].join(', '), clear: () => { WS.docTypes.clear(); } });
  if (WS.themeSel.size) out.push({ label: 'Tema', value: [...WS.themeSel].join(' ya da '), clear: () => { WS.themeSel.clear(); } });
  const yf = el.yearFrom.value.trim(), yt = el.yearTo.value.trim();
  if (yf || yt) {
    out.push({ label: 'Yıl', value: yf && yt ? `${yf}–${yt}` : yf ? `≥ ${yf}` : `≤ ${yt}`, clear: () => { el.yearFrom.value = ''; el.yearTo.value = ''; } });
  }
  return out;
}

function renderActiveFilters() {
  const list = activeFilterList();
  ['filterAi', 'filterMine', 'filterStatus'].forEach(id => el[id].classList.toggle('is-set', el[id].value !== 'all'));
  ['filterPeople', 'filterLabel', 'yearFrom', 'yearTo'].forEach(id => el[id].classList.toggle('is-set', !!el[id].value));
  el.docTypeSummary.classList.toggle('is-set', WS.docTypes.size > 0);
  el.themeFilterSummary.classList.toggle('is-set', WS.themeSel.size > 0);
  el.activeFiltersRow.hidden = !list.length;
  el.activeFilters.textContent = '';
  list.forEach(f => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ws-chip';
    chip.title = 'Bu filtreyi kaldır';
    chip.append(text('span', f.label, 'ws-chip-k'), text('span', f.value, 'ws-chip-v'), uiIcon('x'));
    chip.addEventListener('click', () => { f.clear(); WS.page = 1; renderWorkspace(); });
    el.activeFilters.appendChild(chip);
  });
}

// audit notes of the consensus row and of every model
function aiFlags(ai) {
  const out = new Set(C.splitRationale(ai).flags);
  Object.values(ai.modelDecisions || {}).forEach(m => (m.flags || []).forEach(f => out.add(f)));
  return [...out];
}

/** Decisions a model gave that contradicted its own criterion verdicts, e.g. ["Include"]. */
function inconsistencies(ai) {
  const said = new Set();
  aiFlags(ai).forEach(f => { const m = f.match(/tutarsızlık: model "(\w+)" dedi/); if (m) said.add(m[1]); });
  Object.values(ai.modelDecisions || {}).forEach(m => { if (m.inconsistent && m.model_decision) said.add(m.model_decision); });
  return [...said];
}

/** Reviewer / final-decision filter (cloud): one option group per visible reviewer. */
function renderPeopleFilter() {
  if (!WS.isCloud) return;
  const people = new Map();
  people.set(WS.meId, `${Cloud.displayName} (siz)`);
  if (!WS.blindForMe) {
    (WS.members || []).forEach(uid => { if (!people.has(uid)) people.set(uid, personName(uid)); });
    WS.votes.forEach(m => m.forEach((v, uid) => { if (!people.has(uid)) people.set(uid, personName(uid)); }));
  }
  const sig = [...people.entries()].map(e => e.join(':')).join('|') + WS.blindForMe;
  if (el.filterPeople.dataset.sig === sig) return;
  el.filterPeople.dataset.sig = sig;
  const cur = el.filterPeople.value;
  el.filterPeople.textContent = '';
  const opt = (parent, value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; parent.appendChild(o); };
  opt(el.filterPeople, '', 'Tümü');
  const fg = document.createElement('optgroup');
  fg.label = 'Nihai karar';
  [['Include', 'Dahil'], ['Uncertain', 'Belirsiz'], ['Exclude', 'Hariç'], ['none', 'verilmemiş']].forEach(([v, t]) => opt(fg, `f||${v}`, `Nihai: ${t}`));
  el.filterPeople.appendChild(fg);
  people.forEach((name, uid) => {
    const g = document.createElement('optgroup');
    g.label = name;
    [['Include', 'Dahil dedikleri'], ['Uncertain', 'Belirsiz dedikleri'], ['Exclude', 'Hariç dedikleri'], ['any', 'oy verdikleri'], ['none', 'oy vermedikleri']]
      .forEach(([v, t]) => opt(g, `u|${uid}|${v}`, `${name}: ${t}`));
    el.filterPeople.appendChild(g);
  });
  el.filterPeople.value = [...el.filterPeople.options].some(o => o.value === cur) ? cur : '';
}

/** Terms used on visible votes: { labels: Map(term→count), reasons: Map(term→count) } */
function usedTerms() {
  const out = { labels: new Map(), reasons: new Map() };
  const add = (kind, list) => (list || []).forEach(t => out[kind].set(t, (out[kind].get(t) || 0) + 1));
  WS.records.forEach(r => {
    const mv = myVote(r.rid);
    if (mv) { add('labels', mv.labels); add('reasons', mv.reasons); }
    otherVotes(r.rid).forEach(v => { add('labels', v.labels); add('reasons', v.reasons); });
  });
  return out;
}

function renderLabelFilter() {
  const used = usedTerms();
  const byCount = m => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));
  const labels = byCount(used.labels), reasons = byCount(used.reasons);
  const cur = el.filterLabel.value;
  const sig = labels.map(x => x.join('=')).join('|') + '#' + reasons.map(x => x.join('=')).join('|');
  if (el.filterLabel.dataset.sig === sig) return;
  el.filterLabel.dataset.sig = sig;
  el.filterLabel.textContent = '';
  const opt = (parent, value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; parent.appendChild(o); };
  opt(el.filterLabel, '', 'Tümü');
  if (labels.length) {
    const g = document.createElement('optgroup'); g.label = 'Etiketler';
    labels.forEach(([t, n]) => opt(g, `l:${t}`, `${t} (${n})`));
    el.filterLabel.appendChild(g);
  }
  if (reasons.length) {
    const g = document.createElement('optgroup'); g.label = 'Hariç tutma gerekçeleri';
    reasons.forEach(([t, n]) => opt(g, `r:${t}`, `${t} (${n})`));
    el.filterLabel.appendChild(g);
  }
  el.filterLabel.value = [...el.filterLabel.options].some(o => o.value === cur) ? cur : '';
}

// ------------------------------------------------------------
// Vocabulary: labels and exclusion reasons (Rayyan-style picker)
// ------------------------------------------------------------
const DEFAULT_REASONS = [
  'Konu dışı',
  'Yanlış popülasyon / katılımcılar',
  'Yanlış çalışma deseni',
  'Yanlış yayın türü',
  'Birincil çalışma değil (derleme, kavramsal)',
  'Ampirik veri yok',
  'Yanlış sonuç / değişken',
  'Arka plan makalesi',
  'Yabancı dil',
  'Tam metne erişilemiyor',
  'Tekrar kayıt'
];

function criteriaReasons() {
  const crit = WS.criteria || { inclusion: [], exclusion: [] };
  const short = t => (t.length > 70 ? t.slice(0, 67) + '…' : t);
  return [
    ...(crit.exclusion || []).map(c => `${c.code}: ${short(c.text)}`),
    ...(crit.inclusion || []).map(c => `${c.code} karşılanmıyor`)
  ];
}

function projectTerms(kind) {
  if (!WS.isCloud) return ((run && run.terms) || {})[kind] || [];
  return (WS.terms && WS.terms[kind]) || [];
}

async function addTerm(kind, term) {
  term = String(term || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!term) return '';
  if (!WS.isCloud) {
    if (!run) return term;
    run.terms = run.terms || { label: [], reason: [] };
    if (!run.terms[kind].includes(term)) { run.terms[kind].push(term); scheduleSave(); }
    return term;
  }
  WS.terms = WS.terms || { label: [], reason: [] };
  if (!WS.terms[kind].includes(term)) WS.terms[kind].push(term);
  try { await Cloud.addTerm(WS.project.id, kind, term); } catch (e) { showError('Terim kaydedilemedi: ' + e.message); }
  return term;
}

/** Groups offered by the picker: [[title, [terms]], …] */
function termGroups(kind) {
  const used = usedTerms()[kind === 'label' ? 'labels' : 'reasons'];
  const custom = [...new Set([...projectTerms(kind), ...used.keys()])];
  if (kind === 'label') return [['Projedeki etiketler', custom.sort((a, b) => (used.get(b) || 0) - (used.get(a) || 0) || a.localeCompare(b, 'tr'))]];
  const fixed = new Set([...DEFAULT_REASONS, ...criteriaReasons()]);
  const hidden = new Set(reasonConfig().hidden);
  return [
    ['Protokol ölçütleri', criteriaReasons().filter(t => !hidden.has(t))],
    ['Sık kullanılan gerekçeler', DEFAULT_REASONS.filter(t => !hidden.has(t))],
    ['Projeye eklenen gerekçeler', custom.filter(t => !fixed.has(t) && !hidden.has(t)).sort((a, b) => a.localeCompare(b, 'tr'))]
  ];
}

// ---------- editable exclusion reasons (per project) ----------
/** { hidden: [terms] } — built-in or criteria reasons a project does not offer. */
function reasonConfig() {
  const src = WS.isCloud ? (WS.project.protocol || {}).reasonConfig : run && run.reasonConfig;
  return { hidden: [...((src && src.hidden) || [])] };
}

async function saveReasonConfig(cfg) {
  if (!WS.isCloud) { run.reasonConfig = cfg; scheduleSave(); return true; }
  const p = Object.assign({}, WS.project.protocol, { reasonConfig: cfg });
  try { await Cloud.updateProject(WS.project.id, { protocol: p }); WS.project.protocol = p; return true; }
  catch (e) { showError('Kaydedilemedi: ' + e.message); return false; }
}

async function removeTerm(kind, term) {
  if (!WS.isCloud) {
    if (run && run.terms && run.terms[kind]) { run.terms[kind] = run.terms[kind].filter(t => t !== term); scheduleSave(); }
    return;
  }
  if (WS.terms && WS.terms[kind]) WS.terms[kind] = WS.terms[kind].filter(t => t !== term);
  try { await Cloud.removeTerm(WS.project.id, kind, term); } catch (e) { showError('Silinemedi: ' + e.message); }
}

/** Renames a reason in the vocabulary and in my own votes (others' votes keep their wording). */
async function renameReason(oldT, newT, builtIn) {
  newT = await addTerm('reason', newT);
  if (!newT || newT === oldT) return;
  if (builtIn) { const cfg = reasonConfig(); cfg.hidden = [...new Set([...cfg.hidden, oldT])]; await saveReasonConfig(cfg); }
  else await removeTerm('reason', oldT);
  const recs = WS.records.filter(r => ((myVote(r.rid) || {}).reasons || []).includes(oldT));
  if (recs.length) await writeMyVotes(recs, prev => ({ reasons: [...new Set(prev.reasons.map(t => (t === oldT ? newT : t)))] }));
  return recs.length;
}

function openReasonManager() {
  if (!WS.hasData()) return showError('Önce bir analiz yükleyin ya da proje açın.');
  closeTermPicker();
  renderReasonManager();
  el.reasonsModal.style.display = 'flex';
}

function renderReasonManager() {
  const box = el.reasonsBody;
  box.textContent = '';
  el.reasonsTitle.textContent = `Hariç tutma gerekçeleri${WS.isCloud ? ` · ${WS.project.name}` : ''}`;
  const used = usedTerms().reasons;
  const hidden = new Set(reasonConfig().hidden);
  const fixed = new Set([...DEFAULT_REASONS, ...criteriaReasons()]);
  const custom = [...new Set([...projectTerms('reason'), ...used.keys()])].filter(t => !fixed.has(t)).sort((a, b) => a.localeCompare(b, 'tr'));
  const count = t => (used.get(t) ? text('span', `${used.get(t)} oy`, 'rm-count') : text('span', '', 'rm-count'));
  const group = (title, hint) => {
    const s = document.createElement('section');
    s.className = 'rm-group';
    s.append(text('h3', title, 'ui-card-title'), text('p', hint, 'admin-hint'));
    box.appendChild(s);
    return s;
  };
  const toggleRow = (parent, t) => {
    const row = document.createElement('div');
    row.className = 'rm-row' + (hidden.has(t) ? ' off' : '');
    const lab = document.createElement('label');
    lab.className = 'ui-check rm-text';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !hidden.has(t);
    cb.addEventListener('change', async () => {
      const cfg = reasonConfig();
      cfg.hidden = cb.checked ? cfg.hidden.filter(x => x !== t) : [...new Set([...cfg.hidden, t])];
      if (await saveReasonConfig(cfg)) renderReasonManager();
    });
    lab.append(cb, document.createTextNode(t));
    row.append(lab, count(t), button('Yeniden adlandır', 'ui-btn ui-btn-ghost ui-btn-xs', async () => {
      const n = prompt('Yeni ad (eski ad bu projede gizlenir, sizin oylarınızdaki gerekçe de güncellenir):', t);
      if (n && n.trim() && n.trim() !== t) { const k = await renameReason(t, n, true); showSuccess(`Gerekçe güncellendi${k ? ` · oylarınızdan ${k} kayıt` : ''}.`); renderReasonManager(); renderWorkspace(); }
    }));
    parent.appendChild(row);
  };
  const gc = group('Protokol ölçütlerinden', 'Projenin EC ölçütlerinden ve karşılanmayan IC\'lerden otomatik üretilir. İşareti kaldırılan gerekçe seçim listesinde görünmez; verilmiş oylar değişmez.');
  criteriaReasons().forEach(t => toggleRow(gc, t));
  if (!criteriaReasons().length) gc.appendChild(text('p', 'Protokolde ölçüt yok.', 'admin-hint'));
  const gd = group('Sık kullanılan gerekçeler', 'Hazır liste; bu projede kullanmadıklarınızın işaretini kaldırın.');
  DEFAULT_REASONS.forEach(t => toggleRow(gd, t));
  const gp = group('Projeye eklenen gerekçeler', 'Yeniden adlandırma sizin oylarınızdaki gerekçeyi de günceller; diğer hakemlerin oyları kendi metinleriyle kalır.');
  custom.forEach(t => {
    const row = document.createElement('div');
    row.className = 'rm-row';
    row.append(text('span', t, 'rm-text'), count(t),
      button('Yeniden adlandır', 'ui-btn ui-btn-ghost ui-btn-xs', async () => {
        const n = prompt('Yeni ad:', t);
        if (n && n.trim() && n.trim() !== t) { const k = await renameReason(t, n, false); showSuccess(`Gerekçe güncellendi${k ? ` · oylarınızdan ${k} kayıt` : ''}.`); renderReasonManager(); renderWorkspace(); }
      }),
      button('Sil', 'ui-btn ui-btn-ghost ui-btn-xs is-danger', async () => {
        if (!confirm(`"${t}" listeden silinsin mi?${used.get(t) ? `\nBu gerekçe ${used.get(t)} oyda kullanılmış; o oylar değişmez.` : ''}`)) return;
        await removeTerm('reason', t); renderReasonManager();
      }));
    gp.appendChild(row);
  });
  if (!custom.length) gp.appendChild(text('p', 'Henüz eklenmiş gerekçe yok.', 'admin-hint'));
  const add = document.createElement('div');
  add.className = 'admin-actions';
  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'ui-input admin-email'; inp.placeholder = 'Yeni gerekçe (ör. Yetişkin eğitimi)'; inp.maxLength = 80;
  const doAdd = async () => { if (!inp.value.trim()) return; await addTerm('reason', inp.value); renderReasonManager(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
  add.append(inp, uiButton('plus', 'Ekle', 'ui-btn ui-btn-default ui-btn-sm', doAdd));
  gp.appendChild(add);
  refreshIcons();
}

let openPicker = null;
function closeTermPicker() { if (openPicker) { openPicker.remove(); openPicker = null; } }

/**
 * Floating checklist with search/add. kind: 'label' | 'reason'.
 * onApply(selectedTerms) runs on the apply button (or Ctrl+Enter).
 */
function openTermPicker({ kind, anchor, selected, title, hint, applyLabel, onApply }) {
  closeTermPicker();
  const chosen = new Set(selected || []);
  const pop = document.createElement('div');
  pop.className = `term-pop term-pop-${kind}`;
  pop.setAttribute('role', 'dialog');
  const head = document.createElement('div');
  head.className = 'term-head';
  const ht = document.createElement('div');
  ht.append(text('div', title, 'term-title'), text('div', hint || '', 'term-hint'));
  const tools = document.createElement('div');
  tools.className = 'term-tools';
  if (kind === 'reason') tools.appendChild(button('Düzenle', 'ui-btn ui-btn-ghost ui-btn-xs', openReasonManager, 'Bu projenin gerekçe listesini düzenle'));
  tools.appendChild(button('×', 'term-close', closeTermPicker, 'Kapat (Esc)'));
  head.append(ht, tools);
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'term-input';
  input.placeholder = kind === 'label' ? 'Etiket ara ya da yeni etiket yazıp Enter…' : 'Gerekçe ara ya da kendi gerekçenizi yazıp Enter…';
  const list = document.createElement('div');
  list.className = 'term-list';
  const foot = document.createElement('div');
  foot.className = 'term-foot';
  const count = text('span', '', 'term-count');
  const apply = button(applyLabel, `term-apply term-apply-${kind}`, () => { const v = [...chosen]; closeTermPicker(); onApply(v); });
  foot.append(count, apply);

  const draw = () => {
    const q = input.value.trim().toLocaleLowerCase('tr');
    list.textContent = '';
    let shown = 0;
    termGroups(kind).forEach(([gt, terms]) => {
      const items = terms.filter(t => !q || t.toLocaleLowerCase('tr').includes(q));
      if (!items.length) return;
      list.appendChild(text('div', gt, 'term-group'));
      items.forEach(t => {
        const lab = document.createElement('label');
        lab.className = 'term-item' + (chosen.has(t) ? ' on' : '');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = chosen.has(t);
        cb.addEventListener('change', () => { if (cb.checked) chosen.add(t); else chosen.delete(t); lab.classList.toggle('on', cb.checked); drawCount(); });
        lab.append(cb, text('span', t, 'term-text'));
        list.appendChild(lab);
        shown++;
      });
    });
    // chosen terms that are not in any group (e.g. typed just now)
    [...chosen].filter(t => !termGroups(kind).some(([, ts]) => ts.includes(t))).forEach(t => {
      const lab = document.createElement('label');
      lab.className = 'term-item on';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = true;
      cb.addEventListener('change', () => { chosen.delete(t); draw(); });
      lab.append(cb, text('span', t, 'term-text'));
      list.appendChild(lab);
    });
    const exact = q && termGroups(kind).some(([, ts]) => ts.some(t => t.toLocaleLowerCase('tr') === q));
    if (q && !exact) {
      const add = button(`＋ "${input.value.trim()}" ${kind === 'label' ? 'etiketini' : 'gerekçesini'} ekle`, 'term-add', addTyped);
      list.appendChild(add);
    } else if (!shown) list.appendChild(text('div', 'Henüz kayıtlı terim yok. Yazıp Enter\'a basın.', 'term-empty'));
    drawCount();
  };
  const drawCount = () => { count.textContent = chosen.size ? `${chosen.size} seçili` : (kind === 'reason' ? 'Gerekçesiz de hariç tutabilirsiniz' : 'Seçim yok'); };
  async function addTyped() {
    const t = await addTerm(kind, input.value);
    if (t) chosen.add(t);
    input.value = '';
    draw();
    input.focus({ preventScroll: true });
  }
  input.addEventListener('input', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply.click(); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (input.value.trim()) addTyped(); else apply.click(); }
    if (e.key === 'Escape') { e.preventDefault(); closeTermPicker(); }
  });
  pop.append(head, input, list, foot);
  document.body.appendChild(pop);
  openPicker = pop;
  draw();
  // place next to the anchor, inside the viewport
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w));
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 6);
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  input.focus({ preventScroll: true });
}

document.addEventListener('mousedown', e => { if (openPicker && !openPicker.contains(e.target)) closeTermPicker(); });
window.addEventListener('scroll', () => closeTermPicker(), { passive: true });

function openReasonPicker(rec, anchor) {
  const mv = myVote(rec.rid) || {};
  openTermPicker({
    kind: 'reason', anchor,
    selected: mv.decision === 'Exclude' ? mv.reasons || [] : [],
    title: 'Gerekçeyle hariç tut',
    hint: 'Gerekçe seçmek oyu "Hariç" yapar. Gerekçesiz hariç için ✕ düğmesini kullanın.',
    applyLabel: '✕ Hariç tut',
    onApply: reasons => setMyVote(rec.rid, { decision: 'Exclude', reasons }, { advance: 'focus' })
  });
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

// ---------- shadcn-style building blocks (Lucide icons) ----------
/** Placeholder that refreshIcons() turns into a Lucide SVG. */
function uiIcon(name) { const i = document.createElement('i'); i.dataset.lucide = name; return i; }
function refreshIcons() {
  if (!window.lucide || !document.querySelector('i[data-lucide]')) return;
  try { window.lucide.createIcons({ attrs: { 'stroke-width': 2, 'aria-hidden': 'true' } }); } catch (e) { /* icons are decorative */ }
}
function uiButton(iconName, label, cls, onClick, title) {
  const b = button('', cls, onClick, title);
  b.append(uiIcon(iconName), text('span', label));
  return b;
}
function badge(iconName, label, tone) {
  const s = document.createElement('span');
  s.className = `ui-badge${tone ? ` ui-badge-${tone}` : ''}`;
  if (iconName) s.appendChild(uiIcon(iconName));
  s.appendChild(document.createTextNode(label));
  return s;
}
/** Change a button's label without wiping its icon. */
function setBtnText(b, value) { (b.querySelector('.btn-text') || b).textContent = value; }
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
  if (WS.isCloud && rec.finalDecision) return { decision: rec.finalDecision, source: 'final' };
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
/** ev = { quotes: {code: quote}, kind: {code: 'inc'|'exc'|'may'} } — see evidenceFor() */
function appendHighlighted(parent, value, ev, criteria) {
  const src = String(value || '');
  const ranges = C.evidenceRanges(src, ev.quotes);
  const KIND_TR = { inc: 'dahil etme kanıtı', exc: 'hariç tutma kanıtı', may: 'belirsiz' };
  // a passage behind several criteria takes the most decisive colour
  const kindOf = codes => ['exc', 'inc', 'may'].find(k => codes.some(c => ev.kind[c] === k)) || 'may';
  const textOf = code => {
    const c = [...(criteria.inclusion || []), ...(criteria.exclusion || [])].find(x => x.code === code);
    return c ? `${code}: ${c.text}` : code;
  };
  let pos = 0;
  ranges.forEach(r => {
    if (r.start > pos) parent.appendChild(document.createTextNode(src.slice(pos, r.start)));
    const m = document.createElement('mark');
    const kind = kindOf(r.codes);
    m.className = `ev-mark ev-${kind}`;
    m.textContent = src.slice(r.start, r.end);
    m.title = `${KIND_TR[kind]}\n` + r.codes.map(textOf).join('\n');
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

/**
 * Quotes to highlight and their colour, matching the criterion chips:
 *   IC met → green (inc) · IC not met or EC met → red (exc) · unclear → yellow (may)
 * An EC that does not apply is not highlighted (it would flood the abstract).
 */
function evidenceFor(ai) {
  const out = { quotes: {}, kind: {} };
  if (!ai || WS.aiHidden) return out;
  Object.entries(ai.evidence || {}).forEach(([code, q]) => {
    if (!q) return;
    const v = (ai.assessment || {})[code] || 'unclear';
    let kind = null;
    if (v === 'unclear') kind = 'may';
    else if (code.startsWith('IC')) kind = v === 'yes' ? 'inc' : 'exc';
    else if (v === 'yes') kind = 'exc';
    if (kind) { out.quotes[code] = q; out.kind[code] = kind; }
  });
  return out;
}

// ---------- row ----------
// Five bands, read left to right in the order a reviewer decides:
// [select] · publication · abstract with evidence · criteria + short rationale · decision panel
const DEC_TR = { Include: 'Dahil', Uncertain: 'Belirsiz', Exclude: 'Hariç' };
const DEC_ICON = { Include: '✓', Uncertain: '?', Exclude: '✕' };

function sourceIdLink(id) {
  const v = String(id || '').trim();
  if (/^WOS:/i.test(v)) return { label: 'WoS', value: v.replace(/^WOS:/i, ''), href: `https://www.webofscience.com/wos/woscc/full-record/${encodeURIComponent(v)}` };
  if (/^2-s2\.0-/i.test(v)) return { label: 'Scopus', value: v, href: `https://www.scopus.com/record/display.uri?eid=${encodeURIComponent(v)}&origin=resultslist` };
  if (/^\d+$/.test(v)) return null;
  return { label: 'ID', value: v, href: '' };
}

function linkChip(label, value, href, title) {
  const a = document.createElement(href ? 'a' : 'span');
  a.className = 'id-chip' + (href ? ' id-chip-link' : '');
  if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  a.title = title || '';
  a.append(text('span', label, 'id-chip-k'), text('span', value, 'id-chip-v'));
  return a;
}

/** What the team currently has for this record (drives the status line of the panel). */
function consensusInfo(rec, ai) {
  const aiDec = ai && !ai.error && !WS.aiHidden ? ai.ai_decision || ai.decision : null;
  const mine = (myVote(rec.rid) || {}).decision || null;
  if (WS.isCloud) {
    if (rec.finalDecision) return { kind: 'final', decision: rec.finalDecision, text: 'Nihai karar' };
    const ds = allVisibleDecisions(rec.rid);
    if (new Set(ds).size > 1) {
      const c = ds.reduce((a, d) => (a[d] = (a[d] || 0) + 1, a), {});
      return { kind: 'conflict', decision: null, text: `Çatışma · ${Object.entries(c).map(([d, n]) => `${n} ${DEC_TR[d]}`).join(' / ')}` };
    }
    if (ds.length >= 2) return { kind: 'agree', decision: ds[0], text: `Uzlaşı · ${ds.length} hakem` };
    if (mine) return { kind: 'mine', decision: mine, text: WS.blindForMe ? 'Oyunuz kaydedildi · kör mod' : 'Yalnızca siz oy verdiniz' };
    if (ds.length === 1) return { kind: 'pending', decision: ds[0], text: '1 hakem oy verdi · sizi bekliyor' };
  } else if (mine) {
    return { kind: 'mine', decision: mine, text: !aiDec ? 'Sizin kararınız' : mine === aiDec ? 'Sizin kararınız · AI ile aynı' : `Sizin kararınız · AI ${DEC_TR[aiDec]} demişti` };
  }
  if (aiDec) return { kind: 'ai', decision: aiDec, text: 'AI önerisi · oyunuzu verin' };
  if (ai && ai.error && !WS.aiHidden) return { kind: 'error', decision: null, text: 'AI hatası · yeniden analiz edin' };
  return { kind: 'none', decision: null, text: ai ? 'Henüz karar yok' : 'Analiz edilmedi' };
}

/**
 * Themes under the source ids: the confirmed themes when a person set them,
 * otherwise the AI suggestion (marked as such). Only the themes given to this
 * record are shown, never the whole theme list.
 */
function themeChips(rec) {
  const box = document.createElement('div');
  box.className = 'row-themes';
  const fin = Assist.finalThemesOf(rec);
  const t = Assist.themeOf(rec);
  const list = fin.length ? fin : t ? t.themes : [];
  if (!list.length) return box;
  const ic = icon(fin.length ? 'person' : 'ai');
  ic.setAttribute('aria-label', fin.length ? 'Onaylı tema' : 'YZ önerisi');
  box.appendChild(ic);
  list.forEach((g, i) => {
    const c = text('span', g, `row-theme ${fin.length ? 'ok' : 'ai'}${i ? ' sec' : ''}`);
    c.title = fin.length
      ? `Onaylı tema${t && t.themes.join('|') !== fin.join('|') ? ` (YZ önerisi: ${t.themes.join(', ')})` : ''}`
      : `YZ önerisi, henüz onaylanmadı${t && typeof t.relevance === 'number' ? ` · yakınlık ${t.relevance}/100` : ''}${t && t.reason ? ` · ${t.reason}` : ''}`;
    box.appendChild(c);
  });
  return box;
}

function buildWsRow(rec) {
  const ai = WS.ai.get(rec.rid);
  const crit = WS.criteria;
  const ev = evidenceFor(ai);
  const mv = myVote(rec.rid);
  const tr = document.createElement('tr');
  tr.dataset.rid = rec.rid;
  if (mv && mv.decision) tr.classList.add('row-voted', `row-voted-${mv.decision.toLowerCase()}`);
  if (ai && ai.error) tr.classList.add('row-error');
  if (WS.selected.has(rec.rid)) tr.classList.add('row-selected');
  if (WS.focusRid === rec.rid) tr.classList.add('row-focus');
  const td = cls => { const c = document.createElement('td'); if (cls) c.className = cls; tr.appendChild(c); return c; };

  // 0. selection
  const cS = td('cell-sel');
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
  cS.append(cb, text('div', `#${rec.order + 1}`, 'row-no'));
  const fin = WS.isCloud && rec.finalDecision ? rec.finalDecision : null;
  const shown = fin || (mv && mv.decision) || null;
  const mark = text('div', shown ? DEC_ICON[shown] : '○',
    `row-mark ${shown ? `row-mark-${shown.toLowerCase()}` : 'row-mark-wait'}${fin ? ' row-mark-final' : ''}`);
  mark.title = fin ? `Nihai karar: ${DEC_TR[fin]}` : shown ? `Oyunuz: ${DEC_TR[shown]}` : 'Oyunuzu bekliyor';
  cS.appendChild(mark);

  // 1. publication: title · authors · year/type/row · DOI + source id
  const cP = td('cell-pub');
  const tt = document.createElement('div');
  tt.className = 'title-text';
  appendHighlighted(tt, rec.Title || '[başlık yok]', ev, crit);
  cP.appendChild(tt);
  if (rec.Authors) {
    const au = text('div', shortAuthors(rec.Authors), 'au-names');
    au.title = rec.Authors;
    cP.appendChild(au);
  }
  cP.appendChild(text('div', [rec.Year, rec.DocType, rec.SourceRow ? `Excel satırı ${rec.SourceRow}` : ''].filter(Boolean).join(' · '), 'pub-meta'));
  const links = document.createElement('div');
  links.className = 'pub-links';
  const doi = C.normalizeDoi(rec.DOI);
  if (doi) links.appendChild(linkChip('DOI', doi, `https://doi.org/${doi}`, 'Yayıncı sayfasını yeni sekmede aç'));
  const sid = sourceIdLink(rec.ID);
  if (sid) links.appendChild(linkChip(sid.label, sid.value, sid.href, sid.href ? 'Veritabanındaki kaydı yeni sekmede aç' : 'Kaynak kimliği'));
  if (!doi) links.appendChild(text('span', 'DOI yok', 'muted-small'));
  cP.appendChild(links);
  cP.appendChild(themeChips(rec));
  const flagsRow = document.createElement('div');
  flagsRow.className = 'title-flags';
  if (!ai) flagsRow.appendChild(pill('Analiz edilmedi', 'pill-muted'));
  if (rec.noAbstract) flagsRow.appendChild(pill('Özet yok', 'pill-warn'));
  if (isPendingDup(rec)) flagsRow.appendChild(pill(`♻️ Tekrar adayı: ${rec.duplicateOf}`, 'pill-warn'));
  if (rec.removed) flagsRow.appendChild(pill(`🗑️ Kaldırıldı${rec.removedReason ? ': ' + rec.removedReason : ''}`, 'pill-muted'));
  if (ai && ai.needs_human_review && !WS.aiHidden) flagsRow.appendChild(pill(ai.agreement === 'split' ? '👁️ Modeller ayrıştı' : '👁️ İnceleme önerilir', 'pill-info'));
  if (flagsRow.childNodes.length) cP.appendChild(flagsRow);

  // 2. full abstract with evidence (no "show more")
  const cAb = td('cell-abstract');
  const box = document.createElement('div');
  box.className = 'abs-box';
  if (rec.Abstract) appendHighlighted(box, rec.Abstract, ev, crit);
  else box.appendChild(text('span', 'Özet yok.', 'muted-inline'));
  cAb.appendChild(box);
  if (rec.Keywords) cAb.appendChild(text('div', `🔑 ${rec.Keywords}`, 'muted-small kw-line'));

  // 3. criteria + short rationale, right next to the abstract
  const cR = td('cell-reason');
  const codes = [...(crit.inclusion || []), ...(crit.exclusion || [])];
  if (ai && !WS.aiHidden) {
    if (ai.assessment && Object.keys(ai.assessment).length) {
      const chips = document.createElement('div');
      chips.className = 'crit-row';
      codes.forEach(c => {
        const v = ai.assessment[c.code] || 'unclear';
        const chip = document.createElement('span');
        chip.className = `crit-chip crit-${v} ${c.code.startsWith('EC') ? 'crit-ec' : 'crit-ic'}`;
        chip.textContent = `${c.code}${v === 'yes' ? '✓' : v === 'no' ? '✗' : '?'}`;
        chip.title = `${c.code}: ${c.text}\nDeğerlendirme: ${v === 'yes' ? 'karşılandı' : v === 'no' ? 'karşılanmadı' : 'belirsiz'}${ai.evidence && ai.evidence[c.code] ? `\n"${ai.evidence[c.code]}"` : ''}`;
        chips.appendChild(chip);
      });
      cR.appendChild(chips);
    }
    const sr = C.splitRationale(ai);
    cR.appendChild(text('div', sr.text || '—', 'rationale-text'));
    if (ai.error) cR.appendChild(text('div', `API hatası: ${ai.error}`, 'danger-text small-text'));
    if (sr.flags.length) {
      const d = document.createElement('details');
      d.className = 'audit-flags';
      d.open = true;
      d.appendChild(text('summary', `⚠️ Sistem denetimi (${sr.flags.length})`));
      const ul = document.createElement('ul');
      sr.flags.forEach(f => ul.appendChild(text('li', f)));
      d.appendChild(ul);
      cR.appendChild(d);
    }
    if (typeof ai.relevance_score === 'number') {
      const pctR = Math.round(ai.relevance_score * 100);
      const c = document.createElement('div');
      c.className = 'relevance-container';
      c.title = ai.relevance_rationale || '';
      const bg = document.createElement('div'); bg.className = 'relevance-bar-bg';
      const fill = document.createElement('div'); fill.className = 'relevance-bar-fill'; fill.style.width = `${pctR}%`;
      bg.appendChild(fill); c.append(text('span', `Konu ilgisi ${pctR}%`, 'relevance-text'), bg);
      cR.appendChild(c);
    }
  } else cR.appendChild(text('span', WS.aiHidden ? 'AI değerlendirmesi hakemlerden gizli' : 'Henüz analiz edilmedi', 'muted-inline'));

  // 4. decision panel
  td('cell-decision').appendChild(decisionPanel(rec, ai, mv));
  return tr;
}

function decisionPanel(rec, ai, mv) {
  const panel = document.createElement('div');
  const mine = (mv && mv.decision) || null;
  panel.className = `dp ${mine ? `dp-voted dp-voted-${mine.toLowerCase()}` : 'dp-waiting'}`;

  // ① my task: have I voted, and what?
  const st = document.createElement('div');
  st.className = 'dp-my';
  if (mine) {
    const b = text('span', '', `my-badge my-${mine.toLowerCase()}`);
    b.append(text('span', { Include: '✓', Uncertain: '?', Exclude: '✕' }[mine], 'my-ico'), document.createTextNode(`Oyunuz: ${DEC_TR[mine]}`));
    st.append(b, text('span', 'kaydedildi', 'my-saved'));
  } else {
    const b = text('span', '', 'my-badge my-pending');
    b.append(text('span', '○', 'my-ico'), document.createTextNode('Oyunuz bekleniyor'));
    st.appendChild(b);
  }
  if (WS.isCloud) st.appendChild(text('span', Cloud.displayName, 'my-who'));
  panel.appendChild(st);

  const vb = document.createElement('div');
  vb.className = `vote-buttons${mine ? ' has-vote' : ''}`;
  VOTE_BUTTONS.forEach((b, i) => {
    const on = mine === b.d;
    const btn = button('', `vote-btn ${b.cls}${on ? ' active' : ''}`,
      () => setMyVote(rec.rid, { decision: on ? null : b.d }, { advance: on ? false : 'focus' }),
      `${b.title} — kısayol ${i + 1}${on ? ' (tekrar tıklayınca oyunuz kaldırılır)' : ''}`);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.append(text('span', b.icon, 'vb-ico'), text('span', DEC_TR[b.d], 'vb-txt'), text('span', String(i + 1), 'vb-key'));
    vb.appendChild(btn);
  });
  panel.appendChild(vb);

  // exclusion reasons (Rayyan-style): picking a reason makes the vote Exclude
  const rs = mine === 'Exclude' ? (mv.reasons || []) : [];
  const rrow = document.createElement('div');
  rrow.className = 'dp-reasons';
  rs.forEach(t => {
    const chip = text('span', t, 'reason-chip');
    chip.title = t;
    chip.appendChild(button('×', 'chip-x', () => setMyVote(rec.rid, { reasons: rs.filter(x => x !== t) }), 'Gerekçeyi kaldır'));
    rrow.appendChild(chip);
  });
  const rb = button(rs.length ? '✎ Gerekçe' : '✕ Gerekçeyle hariç…', 'btn-ghost btn-ghost-sm reason-btn', e => openReasonPicker(rec, e.currentTarget),
    'Hariç tutma gerekçesi seç ya da ekle (kısayol R)');
  rrow.appendChild(rb);
  panel.appendChild(rrow);

  // ② the team (cloud only)
  if (WS.isCloud) {
    const sec = document.createElement('div');
    sec.className = 'dp-sec';
    const head = document.createElement('div');
    head.className = 'dp-sec-head';
    head.appendChild(text('span', 'Ekip', 'dp-sec-title'));
    const info = consensusInfo(rec, ai);
    if (info.kind === 'conflict') head.appendChild(pill('⚡ Çatışma', 'pill-danger'));
    else if (info.kind === 'agree') head.appendChild(pill(`✓ Uzlaşı: ${DEC_TR[info.decision]}`, 'pill-ok'));
    else if (info.kind === 'final') head.appendChild(pill(`⚖ Nihai: ${DEC_TR[info.decision]}`, 'pill-info'));
    sec.appendChild(head);
    if (WS.blindForMe) {
      sec.appendChild(text('div', '🙈 Kör mod: diğer hakemlerin oyları gizli, bağımsız oy veriyorsunuz.', 'dp-note'));
    } else {
      const others = otherVotes(rec.rid).filter(v => v.decision);
      if (!others.length) sec.appendChild(text('div', 'Diğer hakemler henüz oy vermedi.', 'dp-note'));
      others.forEach(v => {
        const row = document.createElement('div');
        row.className = 'dp-src';
        const who = document.createElement('span');
        who.className = 'dp-src-who';
        who.append(icon('person'), document.createTextNode(personName(v.user_id)));
        row.append(who, decisionBadge(v.decision, true));
        sec.appendChild(row);
        if (v.decision === 'Exclude' && v.reasons && v.reasons.length) sec.appendChild(text('div', `gerekçe: ${v.reasons.join(', ')}`, 'dp-other-reasons'));
      });
    }
    panel.appendChild(sec);
  }

  // ③ AI suggestion — reference only, below my own decision
  const mds = Object.entries((ai && ai.modelDecisions) || {});
  if (ai && !WS.aiHidden && (mds.length || ai.error)) {
    const sec = document.createElement('div');
    sec.className = 'dp-sec dp-sec-ai';
    const head = document.createElement('div');
    head.className = 'dp-sec-head';
    const aiTitle = text('span', 'Yapay zekâ önerisi', 'dp-sec-title');
    aiTitle.prepend(icon('ai'));
    head.appendChild(aiTitle);
    const aiDec = ai.error ? null : ai.ai_decision || ai.decision;
    if (mine && aiDec && !(WS.isCloud && hasConflict(rec.rid))) head.appendChild(text('span', mine === aiDec ? 'sizinle aynı' : 'sizden farklı', `dp-agree-tag ${mine === aiDec ? 'same' : 'diff'}`));
    sec.appendChild(head);
    const thr = WS.isCloud ? ((WS.project.protocol.options || {}).reviewThreshold) : (run && run.options.reviewThreshold);
    mds.forEach(([mId, m]) => {
      const row = document.createElement('div');
      row.className = 'dp-src dp-src-ai';
      row.title = m.error || C.splitRationale(m).text;
      const who = document.createElement('span');
      who.className = 'dp-src-who';
      who.append(icon('ai'), document.createTextNode(modelName(mId)));
      const right = document.createElement('span');
      right.className = 'dp-src-right';
      if (!m.error && typeof m.confidence === 'number') {
        const c = text('span', `%${Math.round(m.confidence * 100)}`, 'dp-conf');
        if (typeof thr === 'number' && m.confidence < thr) c.classList.add('conf-low');
        c.title = 'Modelin güveni';
        right.appendChild(c);
      }
      right.appendChild(decisionBadge(m.error ? 'Hata' : m.decision, true));
      row.append(who, right);
      sec.appendChild(row);
    });
    const valid = mds.filter(([, m]) => !m.error);
    if (valid.length > 1) sec.appendChild(text('div', `Model uyumu ${valid.filter(([, m]) => m.decision === ai.decision).length}/${valid.length} · ortak öneri: ${DEC_TR[ai.decision] || ai.decision}`, 'dp-note'));
    panel.appendChild(sec);
  }

  // ④ final decision (any project member)
  if (WS.isCloud) {
    const sec = document.createElement('div');
    sec.className = 'dp-sec dp-sec-final';
    const lab = text('span', 'Nihai karar', 'dp-sec-title');
    const group = document.createElement('div');
    group.className = 'final-btns';
    VOTE_BUTTONS.forEach(b => {
      const on = rec.finalDecision === b.d;
      const fb = button(DEC_ICON[b.d], `final-btn ${b.cls}${on ? ' active' : ''}`,
        () => setFinalDecision(rec.rid, on ? '' : b.d),
        on ? `Nihai: ${DEC_TR[b.d]} (kaldırmak için tekrar tıklayın)` : `Nihai kararı ${DEC_TR[b.d]} yap`);
      fb.setAttribute('aria-pressed', on ? 'true' : 'false');
      group.appendChild(fb);
    });
    sec.append(lab, group);
    panel.appendChild(sec);
  }

  // ⑤ labels & note
  const tools = document.createElement('div');
  tools.className = 'dp-tools';
  cellLabels(tools, rec, mv);
  if (WS.canCurate && !rec.removed) {
    const row = tools.querySelector('.label-chips');
    row.appendChild(button(rec.archived ? '↩ Arşivden çıkar' : '🗄️ Arşiv', 'btn-ghost btn-ghost-sm dp-archive',
      () => setArchived([rec], !rec.archived), rec.archived ? 'Kaydı çalışma listesine geri al' : 'Listeden ve sayılardan çıkar (silinmez, geri alınabilir)'));
  }
  panel.appendChild(tools);
  return panel;
}

function cellLabels(cell, rec, mv) {
  const labels = (mv && mv.labels) || [];
  const note = (mv && mv.note) || '';
  const row = document.createElement('div');
  row.className = 'label-chips';
  labels.forEach(l => {
    const chip = text('span', l, 'label-chip');
    chip.appendChild(button('×', 'chip-x', () => setMyVote(rec.rid, { labels: labels.filter(y => y !== l) }), 'Etiketi kaldır'));
    row.appendChild(chip);
  });
  const addBtn = button('+ Etiket', 'btn-ghost btn-ghost-sm', e => {
    openTermPicker({
      kind: 'label', anchor: e.currentTarget, selected: labels,
      title: 'Etiketler', hint: 'Projedeki tüm etiketler; yeni etiket yazıp Enter ile ekleyin.',
      applyLabel: 'Kaydet',
      onApply: next => setMyVote(rec.rid, { labels: next })
    });
  });
  row.appendChild(addBtn);
  const noteBox = document.createElement('div');
  noteBox.className = 'note-box-cell';
  const openEditor = () => {
    const ta = document.createElement('textarea');
    ta.className = 'note-input';
    ta.rows = 3;
    ta.value = note;
    ta.placeholder = 'Notunuz… (Ctrl+Enter kaydeder)';
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
  if (!note) row.appendChild(button('+ Not', 'btn-ghost btn-ghost-sm', openEditor));
  cell.appendChild(row);
  if (note) {
    const n = text('div', note, 'note-text');
    n.title = 'Düzenlemek için tıklayın';
    n.addEventListener('click', openEditor);
    noteBox.appendChild(n);
    cell.appendChild(noteBox);
  } else cell.appendChild(noteBox);

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

// ---------- keyboard screening (J/K move, 1/2/3 vote) ----------
function setFocusRow(rid, scroll) {
  WS.focusRid = rid;
  el.resultsBody.querySelectorAll('tr.row-focus').forEach(t => t.classList.remove('row-focus'));
  const tr = rid && el.resultsBody.querySelector(`tr[data-rid="${rid}"]`);
  if (!tr) return;
  tr.classList.add('row-focus');
  if (scroll) {
    const y = tr.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

function moveFocus(step) {
  const rows = [...el.resultsBody.querySelectorAll('tr[data-rid]')];
  if (!rows.length) return;
  const i = rows.findIndex(t => t.dataset.rid === WS.focusRid);
  const next = rows[Math.max(0, Math.min(rows.length - 1, i === -1 ? 0 : i + step))];
  setFocusRow(next.dataset.rid, true);
}

function onScreenKey(e) {
  if (el['tab-screen'].hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const k = e.key.toLowerCase();
  if (k === 'j' || e.key === 'ArrowDown' && e.shiftKey) { e.preventDefault(); moveFocus(1); return; }
  if (k === 'k' || e.key === 'ArrowUp' && e.shiftKey) { e.preventDefault(); moveFocus(-1); return; }
  if (k === 'r' && WS.focusRid) {
    const btn = el.resultsBody.querySelector(`tr[data-rid="${WS.focusRid}"] .reason-btn`);
    if (btn) { e.preventDefault(); openReasonPicker(WS.recByRid(WS.focusRid), btn); }
    return;
  }
  const vote = { 1: 'Include', 2: 'Uncertain', 3: 'Exclude' }[e.key];
  if (vote && WS.focusRid) {
    e.preventDefault();
    const rid = WS.focusRid;
    const cur = (myVote(rid) || {}).decision;
    setMyVote(rid, { decision: cur === vote ? null : vote }, { advance: cur === vote ? false : 'scroll' });
  }
}

// ------------------------------------------------------------
// Stats, selection, tab badges
// ------------------------------------------------------------
function isActive(rec) { return !rec.removed && !rec.archived && !isPendingDup(rec); }

/**
 * Dashboard. Each decision card shows the decision that currently counts
 * (final decision, or my vote locally; otherwise the AI decision) and below
 * it how many of those come from the final/my vote and how many the AI said.
 * Scope: all active records, or the current filter result.
 */
function updateWsStats() {
  const scope = WS.statsScope === 'filter' && WS._lastFiltered ? WS._lastFiltered : WS.records.filter(isActive);
  const c = { Include: 0, Exclude: 0, Uncertain: 0 };
  const human = { Include: 0, Exclude: 0, Uncertain: 0 };
  const aiC = { Include: 0, Exclude: 0, Uncertain: 0 };
  let rev = 0, err = 0, mine = 0, conflict = 0, fin = 0;
  scope.forEach(rec => {
    const ai = WS.ai.get(rec.rid);
    const aiDec = ai && !ai.error ? ai.ai_decision || ai.decision : null;
    const h = WS.isCloud ? rec.finalDecision : ((myVote(rec.rid) || {}).decision || '');
    const d = h || (WS.aiHidden ? null : aiDec);
    if (c[d] !== undefined) c[d]++;
    if (h && human[h] !== undefined) human[h]++;
    if (aiDec && aiC[aiDec] !== undefined && !WS.aiHidden) aiC[aiDec]++;
    if (ai && ai.error) err++;
    if (ai && ai.needs_human_review) rev++;
    const mv = myVote(rec.rid);
    if (mv && mv.decision) mine++;
    if (rec.finalDecision) fin++;
    if (WS.isCloud && hasConflict(rec.rid)) conflict++;
  });
  const n = scope.length;
  const who = WS.isCloud ? 'nihai' : 'oyunuz';
  [['Include', 'include'], ['Exclude', 'exclude'], ['Uncertain', 'uncertain']].forEach(([d, k]) => {
    el[`${k}Count`].textContent = c[d].toLocaleString('tr-TR');
    el[`${k}Sub`].textContent = WS.aiHidden ? `${who} ${human[d]}` : `${who} ${human[d]} · AI ${aiC[d]}`;
    el[`${k}Sub`].title = WS.isCloud
      ? `Nihai kararı ${DEC_TR[d]} olan ${human[d]} kayıt + nihai kararı olmayıp AI'nın ${d} dediği ${c[d] - human[d]} kayıt. AI toplamda ${aiC[d]} kayda ${d} dedi.`
      : `Sizin ${DEC_TR[d]} dediğiniz ${human[d]} kayıt + oy vermediğiniz ve AI'nın ${d} dediği ${c[d] - human[d]} kayıt.`;
  });
  const decided = c.Include + c.Uncertain + c.Exclude;
  [['distBarInc', 'Include'], ['distBarMay', 'Uncertain'], ['distBarExc', 'Exclude']].forEach(([id, d]) => {
    el[id].style.width = decided ? `${c[d] / decided * 100}%` : '0%';
    el[id].title = `${DECISION_LABEL[d]}: ${c[d].toLocaleString('tr-TR')} (%${decided ? Math.round(c[d] / decided * 100) : 0})`;
  });
  const fmt = v => v.toLocaleString('tr-TR');
  const pct = v => (n ? `%${Math.round(v / n * 100)}` : '%0');
  el.reviewCount.textContent = fmt(rev);
  el.duplicateCount.textContent = fmt(WS.records.filter(r => r.removed || isPendingDup(r)).length);
  el.archiveCount.textContent = fmt(WS.records.filter(r => r.archived && !r.removed).length);
  el.totalCount.textContent = fmt(n);
  el.myProgressCount.textContent = `${fmt(mine)} / ${fmt(n)} · ${pct(mine)}`;
  el.myProgressBar.style.width = n ? `${mine / n * 100}%` : '0%';
  el.statFinalCard.style.display = WS.isCloud ? '' : 'none';
  el.finalProgressCount.textContent = `${fmt(fin)} / ${fmt(n)} · ${pct(fin)}`;
  el.finalProgressBar.style.width = n ? `${fin / n * 100}%` : '0%';
  el.conflictCount.textContent = fmt(conflict);
  el.statsScopeInfo.textContent = WS.statsScope === 'filter'
    ? `Sayılar geçerli filtredeki ${n.toLocaleString('tr-TR')} kayda göre.`
    : `Sayılar tüm aktif kayıtlara göre (tekrar ve arşiv hariç). ${WS.isCloud ? 'Nihai karar varsa o, yoksa AI kararı sayılır.' : 'Oyunuz varsa o, yoksa AI kararı sayılır.'}`;
  el.retryErrorsBtn.style.display = err && WS.canCurate ? 'inline-flex' : 'none';
  setBtnText(el.retryErrorsBtn, `Hatalı ${err} kaydı yeniden tara`);
  el.relevanceReportBtn.style.display = !WS.aiHidden && [...WS.ai.values()].some(r => typeof r.relevance_score === 'number') ? 'inline-flex' : 'none';
  if (!WS.isCloud && typeof updateAgreement === 'function') updateAgreement();
  updateTabBadges();
}

function selectedRecords() {
  return [...WS.selected].map(rid => WS.recByRid(rid)).filter(r => r && !r.removed);
}

/** Archive = out of the working list and every count, but kept and restorable. */
async function setArchived(recs, archived) {
  if (!recs.length) return showError('Önce kayıt seçin.');
  recs = recs.filter(r => !!r.archived !== archived);
  if (!recs.length) return showSuccess(archived ? 'Seçili kayıtlar zaten arşivde.' : 'Seçili kayıtlar arşivde değil.');
  if (recs.length > 1 && !confirm(`${recs.length} kayıt ${archived ? 'arşive kaldırılacak (listeden ve sayılardan çıkar, silinmez)' : 'arşivden çıkarılıp listeye geri alınacak'}. Devam edilsin mi?`)) return;
  const backup = recs.map(r => [r, r.archived]);
  recs.forEach(r => { r.archived = archived; });
  if (WS.isCloud) {
    try {
      await Cloud.patchRecords(WS.project.id, recs.map(r => ({
        rid: r.rid, archived, archived_at: archived ? new Date().toISOString() : null, archived_by: archived ? Cloud.user.id : null
      })));
    } catch (e) {
      backup.forEach(([r, v]) => { r.archived = v; });
      renderWorkspace();
      return showError('Arşiv kaydedilemedi, geri alındı: ' + e.message);
    }
  } else scheduleSave();
  recs.forEach(r => WS.selected.delete(r.rid));
  renderWorkspace();
  showSuccess(archived
    ? `${recs.length} kayıt arşive kaldırıldı. Görmek ya da geri almak için Durum → "🗄️ Arşivdekiler".`
    : `${recs.length} kayıt arşivden çıkarıldı.`);
}

/** My vote on every selected record (decision null removes it). Labels and notes are kept. */
async function bulkVote(decision, reasons) {
  const recs = selectedRecords();
  if (!recs.length) return;
  const what = decision ? `"${DEC_TR[decision]}" oyunuz${reasons && reasons.length ? ` (gerekçe: ${reasons.join(', ')})` : ''}` : 'oyunuz kaldırılacak';
  if (!confirm(`${recs.length} seçili kayıt için ${decision ? `${what} işlenecek` : what}. Devam edilsin mi?`)) return;
  const ok = await writeMyVotes(recs, prev => ({
    decision, labels: prev.labels || [], note: prev.note || '', reasons: decision !== 'Exclude' ? [] : reasons || prev.reasons || []
  }));
  if (!ok) return;
  WS.selected.clear();
  renderWorkspace();
  showSuccess(`${recs.length} kayda ${decision ? `"${DEC_TR[decision]}" oyunuz işlendi` : 'ait oyunuz kaldırıldı'}.`);
}

/**
 * Writes my vote on many records at once; next(prevVote) returns the new vote.
 * Cloud writes are optimistic and rolled back on error. Returns true on success.
 */
async function writeMyVotes(recs, next) {
  const rows = recs.map(rec => {
    const prev = myVote(rec.rid) || {};
    const v = Object.assign({ decision: prev.decision || null, labels: prev.labels || [], note: prev.note || '', reasons: prev.reasons || [] }, next(prev));
    if (v.decision !== 'Exclude') v.reasons = [];
    return { rec, next: v };
  });
  if (!WS.isCloud) {
    run.human = run.human || {};
    rows.forEach(({ rec, next: v }) => { run.human[rec.rid] = v; });
    scheduleSave();
    return true;
  }
  const backup = rows.map(({ rec }) => [rec.rid, myVote(rec.rid)]);
  rows.forEach(({ rec, next: v }) => {
    let m = WS.votes.get(rec.rid);
    if (!m) { m = new Map(); WS.votes.set(rec.rid, m); }
    m.set(WS.meId, v);
  });
  try {
    await Cloud.upsertVotes(rows.map(({ rec, next: v }) => ({ record_id: rec.dbId, decision: v.decision, labels: v.labels, note: v.note, reasons: v.reasons })));
    return true;
  } catch (e) {
    backup.forEach(([rid, v]) => { const m = WS.votes.get(rid); if (v) m.set(WS.meId, v); else m.delete(WS.meId); });
    renderWorkspace();
    showError('Kaydedilemedi, geri alındı: ' + e.message);
    return false;
  }
}

/** Adds labels to every selected record; existing labels stay. */
async function bulkLabels(labels) {
  const recs = selectedRecords();
  if (!recs.length || !labels.length) return;
  const ok = await writeMyVotes(recs, prev => ({ labels: [...new Set([...(prev.labels || []), ...labels])] }));
  if (!ok) return;
  renderWorkspace();
  showSuccess(`${recs.length} kayda etiket eklendi: ${labels.join(', ')}. Seçim korundu.`);
}

/** Adds (or replaces) a note on every selected record. */
async function bulkNote(note, replace) {
  const recs = selectedRecords();
  note = String(note || '').trim().slice(0, 2000);
  if (!recs.length || (!note && !replace)) return;
  const ok = await writeMyVotes(recs, prev => ({
    note: replace || !prev.note ? note : `${prev.note}\n${note}`.slice(0, 2000)
  }));
  if (!ok) return;
  renderWorkspace();
  showSuccess(`${recs.length} kaydın notu ${replace ? 'değiştirildi' : 'güncellendi'}. Seçim korundu.`);
}

/** Small popover with a textarea for the bulk note. */
function openNotePopover(anchor) {
  closeTermPicker();
  const n = WS.selected.size;
  const pop = document.createElement('div');
  pop.className = 'term-pop note-pop';
  pop.setAttribute('role', 'dialog');
  const head = document.createElement('div');
  head.className = 'term-head';
  const ht = document.createElement('div');
  ht.append(text('div', `Seçili ${n} kayda not`, 'term-title'), text('div', 'Not her kayıttaki sizin notunuza eklenir.', 'term-hint'));
  head.append(ht, button('×', 'term-close', closeTermPicker, 'Kapat (Esc)'));
  const ta = document.createElement('textarea');
  ta.className = 'term-input note-pop-input';
  ta.rows = 4;
  ta.placeholder = 'ör. Tezimle doğrudan ilgili';
  const lab = document.createElement('label');
  lab.className = 'ui-check note-pop-mode';
  const rep = document.createElement('input');
  rep.type = 'checkbox';
  lab.append(rep, document.createTextNode('Mevcut notların yerine yaz (işaretsizse sonuna eklenir)'));
  const foot = document.createElement('div');
  foot.className = 'term-foot';
  const apply = button('Kaydet', 'term-apply', () => { const v = ta.value; const r = rep.checked; closeTermPicker(); bulkNote(v, r); });
  foot.append(lab, apply);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply.click(); }
    if (e.key === 'Escape') { e.preventDefault(); closeTermPicker(); }
  });
  pop.append(head, ta, foot);
  document.body.appendChild(pop);
  openPicker = pop;
  const r = anchor.getBoundingClientRect();
  pop.style.left = `${Math.min(window.innerWidth - pop.offsetWidth - 12, Math.max(12, r.left))}px`;
  let top = r.bottom + 6;
  if (top + pop.offsetHeight > window.innerHeight - 12) top = Math.max(12, r.top - pop.offsetHeight - 6);
  pop.style.top = `${top}px`;
  ta.focus({ preventScroll: true });
}

/** Final decision on every selected record (cloud; decision '' removes it). */
async function bulkFinal(decision) {
  const recs = selectedRecords();
  if (!recs.length || !WS.isCloud) return;
  if (!confirm(`${recs.length} seçili kaydın nihai kararı ${decision ? `"${DEC_TR[decision]}" yapılacak` : 'kaldırılacak'}. Devam edilsin mi?`)) return;
  const backup = recs.map(r => [r, r.finalDecision]);
  recs.forEach(r => { r.finalDecision = decision || ''; });
  try {
    await Cloud.patchRecords(WS.project.id, recs.map(r => ({ rid: r.rid, final_decision: decision || null, final_by: decision ? Cloud.user.id : null })));
  } catch (e) {
    backup.forEach(([r, v]) => { r.finalDecision = v; });
    renderWorkspace();
    return showError('Toplu nihai karar kaydedilemedi, geri alındı: ' + e.message);
  }
  WS.selected.clear();
  renderWorkspace();
  showSuccess(`${recs.length} kaydın nihai kararı ${decision ? `"${DEC_TR[decision]}" olarak işlendi` : 'kaldırıldı'}.`);
}

function updateSelectionBar() {
  const n = WS.selected.size;
  const canRun = WS.canCurate;
  el.selectionBar.style.display = canRun ? 'flex' : 'none';
  el.selCount.textContent = n ? `${n.toLocaleString('tr-TR')} kayıt seçili` : 'Seçim yok';
  el.selectionBar.classList.toggle('has-selection', n > 0);
  el.reanalyzeSelectedBtn.disabled = !n;
  el.clearSelectionBtn.disabled = !n;
  document.querySelectorAll('.bulk-btn').forEach(b => { b.disabled = !n; });
  el.archiveSelectedBtn.style.display = el.filterStatus.value === 'archived' ? 'none' : '';
  el.unarchiveSelectedBtn.style.display = el.filterStatus.value === 'archived' ? '' : 'none';
  const nf = (WS._lastFiltered || []).length;
  setBtnText(el.selectFilteredBtn, `Filtredekilerin tümünü seç (${nf.toLocaleString('tr-TR')})`);
  el.selectFilteredBtn.disabled = !nf || (WS._lastFiltered || []).every(r => WS.selected.has(r.rid));
  const total = (WS._lastFiltered || []).length;
  setBtnText(el.reanalyzeAllBtn, `Filtredekileri yeniden analiz et (${total.toLocaleString('tr-TR')})`);
  el.reanalyzeAllBtn.disabled = !total;
}

function updateTabBadges() {
  const pend = WS.records.filter(isPendingDup).length;
  el.tabBadgeDups.textContent = pend ? String(pend) : '';
  el.tabBadgeDups.style.display = pend ? 'inline-block' : 'none';
  const active = WS.records.filter(isActive).length;
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
    // every result is also kept under its protocol version
    const versioned = rows.filter(r => r.promptHash);
    if (Cloud.v15 && versioned.length) {
      await Cloud.upsertAiVersions(WS.project.id, versioned.map(r => ({ rid: r.rid, version: r.promptHash, ai: Cloud.stripAi(r), ai_decision: r.ai_decision || r.decision })));
      versioned.forEach(r => noteVersion(r.rid, r.promptHash, r.ai_decision || r.decision));
    }
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
  return WS.records.filter(r => isPendingDup(r) && !r.archived).map(b => ({ a: WS.recByRid(b.duplicateOf), b })).filter(p => p.a);
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

/**
 * What an export contains. 'filter': the records of the current filter in the
 * current sort order (what the table shows). 'all': every record in file order,
 * including duplicates, removed and archived ones (marked in the Durum column).
 */
function wsExportScope() {
  const r = document.querySelector('input[name="exportScope"]:checked');
  return r ? r.value : 'filter';
}
function wsExportRecords(scope) {
  return scope === 'all' ? [...WS.records].sort((a, b) => a.order - b.order) : filteredRecords();
}
/** Metadata rows describing the scope, so a filtered file stays reproducible. */
function wsScopeMetaRows(scope, n) {
  const filters = activeFilterList();
  return [
    ['Dışa aktarım kapsamı', scope === 'all'
      ? `Tüm kayıtlar (${n}; tekrar, kaldırılan ve arşivdekiler dahil)`
      : `Geçerli filtre (${n} / ${WS.records.length} kayıt)`],
    ['Uygulanan filtreler', scope === 'all' ? '—' : filters.length ? filters.map(f => `${f.label}: ${f.value}`).join('; ') : 'yok (tüm aktif kayıtlar)'],
    ['Sıralama', scope === 'all' ? 'Dosya sırası' : selectedText(el.sortBy)]
  ];
}
function updateExportMenu() {
  const nf = filteredRecords().length, na = WS.records.length;
  el.exportScopeFilterInfo.textContent = `${nf.toLocaleString('tr-TR')} kayıt${activeFilterList().length ? ' · filtreler uygulanmış' : ' · tüm aktif kayıtlar'}`;
  el.exportScopeAllInfo.textContent = `${na.toLocaleString('tr-TR')} kayıt · tekrar ve arşiv dahil`;
}

function wsExportRows(recs) {
  const runLike = wsRunLike();
  const rows = C.buildExportRows(runLike, recs.map(mergedRow), modelShort);
  const reviewers = new Map();
  if (WS.isCloud) {
    WS.votes.forEach(m => m.forEach((v, uid) => { if (!reviewers.has(uid)) reviewers.set(uid, personName(uid)); }));
  }
  // combined view over AI versions: every version's decision + a liberal combined decision
  // (Include if any version says Include; at title/abstract stage doubt favours inclusion)
  const versions = WS.isCloud && WS.versions ? versionSummary().map(v => v.version) : [];
  const hasSources = WS.records.some(r => r.sourceLabel);
  const hasThemes = WS.records.some(r => Assist.themeOf(r) || Assist.finalThemesOf(r).length);
  rows.forEach((row, i) => {
    const rec = recs[i];
    row['Durum'] = rec.removed ? `Kaldırıldı (${rec.removedReason})` : isPendingDup(rec) ? `Tekrar adayı (${rec.duplicateOf})` : rec.archived ? 'Arşivde' : '';
    if (hasSources) row['Kaynak'] = rec.sourceLabel || '';
    if (hasThemes) {
      const t = Assist.themeOf(rec);
      row['Tema (AI)'] = t ? t.themes.join('; ') : '';
      row['Tema yakınlığı (0–100)'] = t && typeof t.relevance === 'number' ? t.relevance : '';
      row['Tema gerekçesi'] = t ? t.reason : '';
      row['Tema kanıtı'] = t ? t.evidence : '';
      row['Tema (onaylı)'] = Assist.finalThemesOf(rec).join('; ');
    }
    if (versions.length > 1) {
      const m = WS.versions.byRid.get(rec.rid) || new Map();
      row['AI sürümü (etkin)'] = versionOf(WS.ai.get(rec.rid));
      versions.forEach(v => { row[`AI v${v}`] = m.get(v) ? DECISION_LABEL[m.get(v)] || m.get(v) : ''; });
      const ds = [...m.values()].filter(Boolean);
      row['Sürüm uyumu'] = !ds.length ? '' : new Set(ds).size === 1 ? `aynı (${ds.length})` : 'farklı';
      row['Birleşik AI (liberal)'] = ds.includes('Include') ? 'Include' : ds.includes('Uncertain') ? 'Maybe' : ds.length ? 'Exclude' : '';
    }
    if (WS.isCloud) {
      const m = WS.votes.get(rec.rid) || new Map();
      reviewers.forEach((name, uid) => {
        const v = m.get(uid);
        row[`Hakem: ${name}`] = v && v.decision ? DECISION_LABEL[v.decision] : '';
        row[`Gerekçe: ${name}`] = v ? (v.reasons || []).join('; ') : '';
        row[`Etiket/Not: ${name}`] = v ? [(v.labels || []).join(', '), v.note].filter(Boolean).join(' · ') : '';
      });
      const ds = [...m.values()].map(v => v.decision).filter(Boolean);
      row['Hakem Uyumu'] = !ds.length ? '' : new Set(ds).size === 1 ? `oybirliği (${ds.length})` : 'çatışma';
      row['Nihai (yönetici)'] = rec.finalDecision || '';
    } else {
      const v = myVote(rec.rid) || {};
      row['Hariç Gerekçeleri'] = (v.reasons || []).join('; ');
      row['Etiketler'] = (v.labels || []).join(', ');
      row['Not'] = v.note || '';
    }
  });
  return rows;
}

/** YYYY-MM-DD in the user's time zone (file names). */
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function wsExportName(ext, scope, n) {
  const rl = wsRunLike();
  const base = WS.isCloud ? WS.project.name.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40) : 'screening';
  const tag = scope === 'filter' ? `_filtre-${n}kayit` : '';
  return `${base}_${localDate()}_v${rl.promptHash || 'x'}${tag}.${ext}`;
}

/** Records to export for the chosen scope, or null (with a message) when there are none. */
function wsExportSelection() {
  if (!WS.hasData()) { showError('İndirilecek sonuç yok.'); return null; }
  const scope = wsExportScope();
  const recs = wsExportRecords(scope);
  if (!recs.length) { showError('Geçerli filtrede kayıt yok; filtreleri değiştirin ya da "Tüm kayıtlar"ı seçin.'); return null; }
  el.exportMenu.open = false;
  return { scope, recs };
}

function wsDownloadCsv() {
  const sel = wsExportSelection();
  if (!sel) return;
  const rows = wsExportRows(sel.recs);
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`;
  const metaRows = C.buildMetadataRows(wsRunLike(), WS.records.map(mergedRow)).slice(1).filter(([k]) => k !== 'Sistem talimatı (tam metin)');
  metaRows.splice(2, 0, ...wsScopeMetaRows(sel.scope, rows.length));
  const meta = metaRows.map(([k, v]) => `# ${String(k).replace(/[\r\n]+/g, ' ')}: ${String(v).replace(/[\r\n]+/g, ' ')}`).join('\n');
  const csv = [headers.map(esc).join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  triggerDownload(new Blob(['﻿' + meta + '\n' + csv], { type: 'text/csv;charset=utf-8' }), wsExportName('csv', sel.scope, rows.length));
}

function wsDownloadExcel() {
  const sel = wsExportSelection();
  if (!sel) return;
  const rows = wsExportRows(sel.recs);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map(h => ({ wch: /Abstract|Gerekçe|Kanıt|Başlık|Denetim|Not/.test(h) ? 50 : 14 }));
  ws['!autofilter'] = { ref: ws['!ref'] };
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  // PRISMA counts stay computed over every record, whatever the export scope
  const metaRows = C.buildMetadataRows(wsRunLike(), WS.records.map(mergedRow));
  if (WS.isCloud) metaRows.splice(4, 0, ['Proje', `${WS.project.name} (${WS.project.id})`], ['Kör mod', WS.project.blind ? 'Açık' : 'Kapalı']);
  metaRows.splice(3, 0, ...wsScopeMetaRows(sel.scope, rows.length));
  const meta = XLSX.utils.aoa_to_sheet(metaRows.map(([k, v]) => [k, typeof v === 'string' && v.length > 32000 ? v.slice(0, 32000) + ' …[kısaltıldı]' : v]));
  meta['!cols'] = [{ wch: 40 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, meta, 'Metadata');
  const log = XLSX.utils.aoa_to_sheet([['Olay'], ...((wsRunLike().log) || []).map(l => [l])]);
  XLSX.utils.book_append_sheet(wb, log, 'Log');
  XLSX.writeFile(wb, wsExportName('xlsx', sel.scope, rows.length));
}

function wsRelevanceReport() {
  const list = el.relList;
  list.textContent = '';
  const top = WS.records.filter(isActive).map(r => ({ r, a: WS.ai.get(r.rid) }))
    .filter(x => x.a && typeof x.a.relevance_score === 'number')
    .sort((x, y) => y.a.relevance_score - x.a.relevance_score);
  const n = el.relTopN.value === 'all' ? top.length : parseInt(el.relTopN.value, 10);
  el.relTitle.textContent = `🔍 Konunuza En Yakın Çalışmalar (${Math.min(n, top.length)} / ${top.length})`;
  top.slice(0, n).forEach(({ r, a }, i) => {
    const card = document.createElement('article');
    card.className = 'rel-card';
    const side = document.createElement('div');
    side.className = 'rel-side';
    const pct = Math.round(a.relevance_score * 100);
    side.append(text('div', `#${i + 1}`, 'rel-rank'), text('div', `%${pct}`, 'rel-score'));
    const bar = document.createElement('div'); bar.className = 'relevance-bar-bg';
    const fill = document.createElement('div'); fill.className = 'relevance-bar-fill'; fill.style.width = `${pct}%`;
    bar.appendChild(fill); side.appendChild(bar);

    const body = document.createElement('div');
    body.className = 'rel-body';
    const doi = C.normalizeDoi(r.DOI);
    const title = document.createElement(doi ? 'a' : 'div');
    title.className = 'rel-title';
    title.textContent = r.Title || '[başlık yok]';
    if (doi) { title.href = `https://doi.org/${doi}`; title.target = '_blank'; title.rel = 'noopener noreferrer'; title.title = 'Çalışmanın sayfasını yeni sekmede aç'; }
    body.appendChild(title);
    body.appendChild(text('div', [shortAuthors(r.Authors), r.Year, r.DocType].filter(Boolean).join(' · '), 'rel-meta'));
    const links = document.createElement('div');
    links.className = 'pub-links';
    if (doi) links.appendChild(linkChip('DOI', doi, `https://doi.org/${doi}`, 'Yayıncı sayfası'));
    const sid = sourceIdLink(r.ID);
    if (sid) links.appendChild(linkChip(sid.label, sid.value, sid.href, 'Kaynak kaydı'));
    const eff = effectiveDecision(r);
    if (eff.decision) links.appendChild(decisionBadge(eff.decision, true, eff.source === 'ai' ? 'ai' : 'person'));
    body.appendChild(links);
    if (a.relevance_rationale) body.appendChild(text('div', `İlişki: ${a.relevance_rationale}`, 'rel-why'));
    const abs = document.createElement('details');
    abs.className = 'rel-abs';
    abs.appendChild(text('summary', 'Özet'));
    abs.appendChild(text('div', r.Abstract || 'Özet yok.', 'rel-abs-text'));
    body.appendChild(abs);
    card.append(side, body);
    list.appendChild(card);
  });
  if (!top.length) list.appendChild(text('div', 'Konu ilgisi puanı olan kayıt yok. Analiz sekmesinde "Kendi çalışma konunuz" alanını doldurup analiz edin.', 'empty-note'));
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
    const terms = await Cloud.fetchTerms(id).catch(() => []);
    WS.terms = { label: terms.filter(t => t.kind === 'label').map(t => t.term), reason: terms.filter(t => t.kind === 'reason').map(t => t.term) };
    const members = await Cloud.listMembers(id).catch(() => []);
    WS.members = members.map(m => m.user_id);
    members.forEach(m => { if (m.profiles && !WS.profiles.has(m.user_id)) WS.profiles.set(m.user_id, m.profiles); });
    startLiveSync(id, rows, votes);
    WS.versions = null;
    renderWorkspace(); renderDuplicates();
    loadVersionIndex(id);
    showSuccess(`"${project.name}" açıldı: ${rows.length} kayıt, ${votes.length} karar.`);
  } catch (e) {
    showError('Proje açılamadı: ' + e.message);
  } finally {
    el.wsLoading.style.display = 'none';
  }
}

function addVote(v) {
  // (remote or initial load)
  const rid = WS.byDbId.get(v.record_id);
  if (!rid) return;
  let m = WS.votes.get(rid);
  if (!m) { m = new Map(); WS.votes.set(rid, m); }
  m.set(v.user_id, { decision: v.decision, labels: v.labels || [], note: v.note || '', reasons: v.reasons || [], updated_at: v.updated_at });
}

// ------------------------------------------------------------
// Live sync between reviewers
//  1. Supabase Realtime pushes votes and record changes (final decisions,
//     duplicates, AI results) the moment they are written.
//  2. A light delta poll every 15 s ("rows changed since t") repairs anything
//     a sleeping laptop or a dropped websocket missed; it also runs when the
//     tab becomes visible again or the network comes back.
// RLS applies to both: in blind mode other reviewers' votes never arrive.
// ------------------------------------------------------------
const SYNC_MS = 15000;

function startLiveSync(pid, rows, votes) {
  stopLiveSync();
  const maxTs = list => list.reduce((m, r) => (r.updated_at && r.updated_at > m ? r.updated_at : m), '1970-01-01T00:00:00Z');
  WS.sync = { pid, voteTs: maxTs(votes), recTs: maxTs(rows), status: 'connecting', last: Date.now(), busy: false };
  WS.unsubscribe = Cloud.subscribeProject(pid, {
    onVote: v => { applyRemoteVote(v); },
    onRecord: row => { applyRemoteRecord(row); },
    onTerm: t => { WS.terms = WS.terms || { label: [], reason: [] }; if (!WS.terms[t.kind].includes(t.term)) WS.terms[t.kind].push(t.term); },
    onStatus: st => {
      if (!WS.sync) return;
      WS.sync.status = st === 'SUBSCRIBED' ? 'live' : (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') ? 'poll' : WS.sync.status;
      if (st === 'SUBSCRIBED') pollChanges();   // catch up on anything written while connecting
      renderLiveStatus();
    }
  });
  WS.sync.timer = setInterval(() => { if (!document.hidden) pollChanges(); }, SYNC_MS);
  WS.sync.tick = setInterval(renderLiveStatus, 5000);
}

function stopLiveSync() {
  if (WS.unsubscribe) { WS.unsubscribe(); WS.unsubscribe = null; }
  if (WS.sync) { clearInterval(WS.sync.timer); clearInterval(WS.sync.tick); }
  WS.sync = null;
}

// 5 s overlap: now() is the transaction start, a slow commit can carry an older timestamp
const sinceWithOverlap = ts => new Date(new Date(ts).getTime() - 5000).toISOString();

async function pollChanges() {
  const sy = WS.sync;
  if (!sy || sy.busy || !WS.isCloud || WS.project.id !== sy.pid) return;
  sy.busy = true;
  try {
    const [votes, rows] = await Promise.all([
      Cloud.fetchVotesSince(sy.pid, sinceWithOverlap(sy.voteTs)),
      Cloud.fetchRecordsSince(sy.pid, sinceWithOverlap(sy.recTs))
    ]);
    votes.forEach(applyRemoteVote);
    rows.forEach(applyRemoteRecord);
    sy.last = Date.now();
    if (sy.status !== 'live') sy.status = 'poll';
  } catch (e) {
    sy.status = 'offline';
  } finally {
    sy.busy = false;
    renderLiveStatus();
  }
}

let remoteStatsTimer = null;
function afterRemoteChange(rid) {
  const tr = rid && el.resultsBody.querySelector(`tr[data-rid="${rid}"]`);
  // never rebuild a row the user is typing in
  if (tr && !tr.contains(document.activeElement)) tr.replaceWith(buildWsRow(WS.recByRid(rid)));
  if (!remoteStatsTimer) remoteStatsTimer = setTimeout(() => { remoteStatsTimer = null; updateWsStats(); renderPeopleFilter(); }, 400);
}

function applyRemoteVote(v) {
  const sy = WS.sync;
  if (sy && v.updated_at > sy.voteTs) sy.voteTs = v.updated_at;
  if (v.user_id === WS.meId) return;          // my own echo; the local state is already newer
  const rid = WS.byDbId.get(v.record_id);
  if (!rid) return;
  const prev = (WS.votes.get(rid) || new Map()).get(v.user_id);
  if (prev && prev.updated_at && v.updated_at && prev.updated_at >= v.updated_at) return;
  addVote(v);
  afterRemoteChange(rid);
}

function applyRemoteRecord(row) {
  const sy = WS.sync;
  if (sy && row.updated_at > sy.recTs) sy.recTs = row.updated_at;
  const rec = WS.recByRid(row.rid);
  if (!rec) return;
  if (rec.updatedAt && row.updated_at && rec.updatedAt >= row.updated_at) return;
  const fresh = Cloud.rowToRecord(row);
  ['finalDecision', 'finalBy', 'removed', 'removedReason', 'duplicateOf', 'dupKind', 'dupScore', 'notDupOf', 'archived',
    'sourceLabel', 'importId', 'theme', 'themeFinal', 'themeBy'].forEach(k => { if (k in fresh) rec[k] = fresh[k]; });
  rec.updatedAt = row.updated_at;
  if ('ai' in row) {
    const ai = Cloud.aiFromRow(row, rec);
    if (ai) WS.cloudAi.set(rec.rid, ai); else WS.cloudAi.delete(rec.rid);
  }
  afterRemoteChange(rec.rid);
  if (!el['tab-dups'].hidden) renderDuplicates();
}

function renderLiveStatus() {
  const n = document.getElementById('liveStatus');
  if (!n || !WS.sync) return;
  const secs = Math.round((Date.now() - WS.sync.last) / 1000);
  const map = {
    live: ['● Canlı', 'live-on', 'Diğer hakemlerin kararları anında görünür.'],
    connecting: ['◌ Bağlanıyor…', 'live-wait', 'Canlı kanal açılıyor.'],
    poll: ['◐ Eşitleniyor', 'live-wait', `Canlı kanal yok; değişiklikler ${SYNC_MS / 1000} sn'de bir alınıyor.`],
    offline: ['○ Bağlantı yok', 'live-off', 'Sunucuya ulaşılamıyor; bağlantı gelince otomatik eşitlenir.']
  };
  const [label, cls, tip] = map[WS.sync.status] || map.poll;
  n.className = `live-status ${cls}`;
  n.textContent = label;
  n.title = `${tip} Son eşitleme: ${secs} sn önce.`;
}

function closeCloudProject() {
  flushCloudAi();
  stopLiveSync();
  WS.source = 'local';
  WS.project = null;
  WS.cloudRecords = []; WS.cloudAi = new Map(); WS.votes = new Map(); WS.terms = null; WS.versions = null;
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
  if (!canCreateProjects()) return showError('Veritabanına kaydetmek için giriş yapın. (Yönetici olmayan kullanıcılar için veritabanı güncellemesi gerekiyor.)');
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
      // keep the project's history (earlier versions, added sources)
      const prev = (await Cloud.getProject(run.cloudProjectId)).protocol || {};
      if (prev.versions) protocol.versions = prev.versions;
      if (prev.imports) protocol.imports = prev.imports;
      if (prev.reasonConfig) protocol.reasonConfig = prev.reasonConfig;
      registerVersion(protocol, run);
      project = await Cloud.updateProject(run.cloudProjectId, { protocol, file_name: run.fileName });
    } else {
      registerVersion(protocol, run);
      if (run.reasonConfig) protocol.reasonConfig = run.reasonConfig;
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
    const versioned = items.filter(x => x.ai && !x.ai.preset).map(({ rec, ai }) => ({
      rid: rec.rid, version: ai.promptHash || run.promptHash, ai: Cloud.stripAi(ai), ai_decision: ai.ai_decision || ai.decision
    }));
    if (Cloud.v15 && versioned.length) {
      el.saveProgress.textContent = `AI sonuçları sürüm geçmişine yazılıyor (${versioned.length})…`;
      await Cloud.upsertAiVersions(project.id, versioned);
    }
    const myVotes = Object.entries(run.human || {})
      .filter(([rid, h]) => idOf.has(rid) && (h.decision || (h.labels && h.labels.length) || h.note))
      .map(([rid, h]) => ({ record_id: idOf.get(rid), decision: h.decision || null, labels: h.labels || [], note: h.note || '', reasons: h.reasons || [] }));
    // project vocabulary (labels / custom reasons created locally)
    for (const kind of ['label', 'reason']) {
      for (const t of ((run.terms || {})[kind] || [])) await Cloud.addTerm(project.id, kind, t).catch(() => {});
    }
    if (myVotes.length) {
      el.saveProgress.textContent = `Kararlarınız yükleniyor (${myVotes.length})…`;
      await Cloud.upsertVotes(myVotes);
    }
    // thematic analysis done locally travels with the project
    if (Cloud.v15 && (run.themeConfig || run.themes || run.themeFinal)) {
      el.saveProgress.textContent = 'Tematik analiz sonuçları yükleniyor…';
      if (run.themeConfig) await Cloud.updateProject(project.id, { themes: run.themeConfig });
      const rids = [...new Set([...Object.keys(run.themes || {}), ...Object.keys(run.themeFinal || {})])].filter(r => idOf.has(r));
      await Cloud.patchRecords(project.id, rids.map(rid => ({
        rid, theme: (run.themes || {})[rid] || null, theme_final: (run.themeFinal || {})[rid] || [], theme_by: (run.themeFinal || {})[rid] ? Cloud.user.id : null
      })));
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
let projectsSeq = 0;

async function refreshProjects() {
  // Several callers (start-up, auth events, saves) can overlap; only the newest
  // call may draw, otherwise each one appends its own copy of the list.
  const seq = ++projectsSeq;
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
    ? 'Yönetici olarak tüm projeleri görürsünüz. Yerel bir analizi Tarama sekmesindeki "Veritabanına kaydet" ile ya da "Excel\'den yeni proje" ile proje yapabilir, "Yönet" ile hakem ekleyebilirsiniz.'
    : Cloud.v15
      ? 'Kendi projeleriniz ve sizinle paylaşılan projeler. Kendi projenizi "Excel\'den yeni proje" ya da Tarama sekmesindeki "Veritabanına kaydet" ile açıp "Yönet"ten e-postayla hakem ekleyebilirsiniz.'
      : 'Sizinle paylaşılan projeler. Açıp Include / Maybe / Exclude kararlarınızı verebilirsiniz.';
  el.newProjectBtn.style.display = canCreateProjects() ? 'inline-flex' : 'none';
  let list;
  try {
    list = await Cloud.listProjects();
  } catch (e) { if (seq === projectsSeq) showError('Projeler alınamadı: ' + e.message); return; }
  if (seq !== projectsSeq) return;   // a newer refresh owns the list
  projectsCache = list;
  el.projectList.textContent = '';
  if (!projectsCache.length) {
    el.projectList.appendChild(text('div', Cloud.isAdmin ? 'Henüz proje yok.'
      : canCreateProjects() ? 'Henüz projeniz yok. "Excel\'den yeni proje" ile başlayabilir ya da bir yöneticiden sizi projesine eklemesini isteyebilirsiniz.'
      : 'Sizinle paylaşılmış proje yok. Yöneticiden sizi projeye eklemesini isteyin (kayıt olduğunuz e-posta ile).', 'empty-note'));
    refreshIcons();
    return;
  }
  projectsCache.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card ui-card' + (WS.isCloud && WS.project.id === p.id ? ' project-open' : '');
    const info = document.createElement('div');
    info.className = 'project-info';
    info.appendChild(text('div', p.name, 'project-name'));
    if (p.description) info.appendChild(text('div', p.description, 'project-desc'));
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    const own = p.is_owner ? badge('crown', 'Sahibi sizsiniz', 'ok') : p.owner_name ? badge('user', `Sahibi: ${p.owner_name}`) : null;
    meta.append(
      badge(p.blind ? 'eye-off' : 'eye', p.blind ? 'Kör mod' : 'Açık mod', p.blind ? 'warn' : ''),
      ...(own ? [own] : []),
      text('span', `${p.total.toLocaleString('tr-TR')} kayıt`, 'project-stat'),
      text('span', `${p.removed} tekrar kaldırıldı`, 'project-stat'),
      text('span', `${p.archived || 0} arşivde`, 'project-stat'),
      text('span', `${p.members} hakem`, 'project-stat'),
      text('span', `güncelleme ${new Date(p.updated_at).toLocaleString('tr-TR')}`, 'project-stat')
    );
    info.appendChild(meta);
    const prog = document.createElement('div');
    prog.className = 'mini-progress ui-progress';
    const pct = p.total ? Math.round(p.my_votes / p.total * 100) : 0;
    const bar = document.createElement('div'); bar.className = 'mini-progress-fill'; bar.style.width = `${pct}%`;
    prog.appendChild(bar);
    info.append(prog, text('div', `Sizin ilerlemeniz: ${p.my_votes.toLocaleString('tr-TR')} / ${p.total.toLocaleString('tr-TR')} (%${pct})`, 'project-stat'));
    const act = document.createElement('div');
    act.className = 'project-actions';
    act.appendChild(uiButton('folder-open', 'Aç', 'ui-btn ui-btn-default ui-btn-sm', () => openCloudProject(p.id)));
    act.appendChild(uiButton('settings-2', Cloud.isAdmin || p.is_owner ? 'Yönet' : 'Ayarlar', 'ui-btn ui-btn-outline ui-btn-sm', () => showProjectAdmin(p.id)));
    card.append(info, act);
    el.projectList.appendChild(card);
  });
  refreshIcons();
}

/** Project creation: admins always; everyone else once the v15 schema (owners) is live. */
function canCreateProjects() { return !!(Cloud.user && (Cloud.isAdmin || Cloud.v15)); }
/** Owner or admin of a project row ({owner_id}). */
function canManageProject(p) { return !!(Cloud.user && p && (Cloud.isAdmin || p.owner_id === Cloud.user.id)); }

// ------------------------------------------------------------
// AI result versions
//  records.ai is the active result; record_ai_versions keeps every result per
//  protocol version (prompt hash), so criteria can change without losing the
//  earlier screening. protocol.versions describes what produced each version.
// ------------------------------------------------------------
/** Registers the protocol that produced a version (criteria, logic, prompt, models). */
function registerVersion(protocol, p) {
  if (!p || !p.promptHash) return;
  protocol.versions = protocol.versions || {};
  const prev = protocol.versions[p.promptHash] || {};
  protocol.versions[p.promptHash] = Object.assign({ createdAt: new Date().toISOString(), label: '' }, prev, {
    icText: p.icText || '', ecText: p.ecText || '', guidance: p.guidance || '', criteria: p.criteria,
    options: p.options || {}, system: p.system || '', models: (p.models || []).map(m => m.id || m), batchSize: p.batchSize
  });
}

function versionOf(ai) { return (ai && ai.promptHash) || ''; }

/** Light index of every stored version: WS.versions = { byRid: Map(rid → Map(version → decision)), list } */
async function loadVersionIndex(pid) {
  WS.versions = null;
  if (!Cloud.v15) return;
  try {
    const rows = await Cloud.fetchAiVersionIndex(pid);
    if (!WS.isCloud || WS.project.id !== pid) return;
    WS.versions = { byRid: new Map() };
    rows.forEach(r => noteVersion(r.rid, r.version, r.ai_decision));
    renderWorkspace();
  } catch (e) { console.warn('AI sürümleri alınamadı', e); }
}

function noteVersion(rid, version, decision) {
  if (!WS.versions || !version) return;
  let m = WS.versions.byRid.get(rid);
  if (!m) { m = new Map(); WS.versions.byRid.set(rid, m); }
  m.set(version, decision || '');
}

/** [{ version, total, active, Include, Uncertain, Exclude }] newest registry entries first */
function versionSummary() {
  const out = new Map();
  const get = v => { if (!out.has(v)) out.set(v, { version: v, total: 0, active: 0, Include: 0, Uncertain: 0, Exclude: 0 }); return out.get(v); };
  if (WS.versions) {
    WS.versions.byRid.forEach((m, rid) => {
      const rec = WS.recByRid(rid);
      if (!rec || !isActive(rec)) return;
      m.forEach((d, v) => { const s = get(v); s.total++; if (s[d] !== undefined) s[d]++; });
    });
  }
  WS.records.forEach(rec => {
    if (!isActive(rec)) return;
    const v = versionOf(WS.ai.get(rec.rid));
    if (v) get(v).active++;
  });
  const reg = (WS.project && WS.project.protocol && WS.project.protocol.versions) || {};
  return [...out.values()].sort((a, b) => String((reg[b.version] || {}).createdAt || '').localeCompare(String((reg[a.version] || {}).createdAt || '')) || b.total - a.total);
}

/** True when the stored versions of a record disagree on the decision. */
function versionsDisagree(rid) {
  const m = WS.versions && WS.versions.byRid.get(rid);
  if (!m || m.size < 2) return false;
  return new Set([...m.values()].filter(Boolean)).size > 1;
}

/** Status filter options for versions (only when a project has more than one). */
function renderVersionFilter() {
  const list = WS.isCloud && WS.versions ? versionSummary() : [];
  const sig = list.map(v => `${v.version}:${v.active}`).join('|');
  if (el.filterStatus.dataset.vsig === sig) return;
  el.filterStatus.dataset.vsig = sig;
  const cur = el.filterStatus.value;
  const old = el.filterStatus.querySelector('optgroup[data-versions]');
  if (old) old.remove();
  if (list.length > 1) {
    const g = document.createElement('optgroup');
    g.label = 'AI sürümleri';
    g.dataset.versions = '1';
    const add = (value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; g.appendChild(o); };
    add('vdiff', 'Sürümler farklı karar vermiş');
    list.forEach(v => add(`ver:${v.version}`, `Etkin sonuç v${v.version} (${v.active.toLocaleString('tr-TR')})`));
    el.filterStatus.appendChild(g);
  }
  el.filterStatus.value = [...el.filterStatus.options].some(o => o.value === cur) ? cur : 'all';
}

function icLogicText(criteria, o) {
  const f = C.icFormula(criteria || { inclusion: [] }, (o || {}).icLogic, (o || {}).icExpr);
  return f ? `Formül: ${C.formatIcExpression(f.ast, 'tr')}` : (o || {}).icLogic === 'any' ? 'En az biri yeterli (VEYA)' : 'Tümü karşılanmalı (VE)';
}

/** One version: its criteria, its results, how it differs from what is active, and a way back. */
function versionCard(v, r, pid) {
  r = r || {};
  const card = document.createElement('article');
  card.className = 'ver-card' + (v.active ? ' is-active' : '');
  const head = document.createElement('div');
  head.className = 'ver-head';
  const title = document.createElement('div');
  title.className = 'ver-title';
  title.append(text('span', `v${v.version}`, 'ver-hash'), text('strong', r.label || 'Adsız sürüm'));
  if (v.active) title.appendChild(badge('check', v.active === v.total ? 'Etkin' : `Etkin: ${v.active.toLocaleString('tr-TR')} kayıt`, 'ok'));
  if (r.createdAt) title.appendChild(text('span', new Date(r.createdAt).toLocaleString('tr-TR'), 'ver-date'));
  const acts = document.createElement('div');
  acts.className = 'admin-row-actions';
  if (v.active < v.total) acts.appendChild(uiButton('undo-2', 'Bu taramaya geri dön', 'ui-btn ui-btn-default ui-btn-xs', () => activateVersion(v.version),
    'Bu sürümün AI kararlarını etkin yapar; hakem oyları ve nihai kararlar değişmez'));
  acts.appendChild(button('Adlandır', 'ui-btn ui-btn-ghost ui-btn-xs', async () => {
    const name = prompt('Bu sürüm için kısa bir ad (ör. "Ölçüt seti A — geniş"):', r.label || '');
    if (name === null) return;
    const p = Object.assign({}, WS.project.protocol);
    p.versions = Object.assign({}, p.versions);
    p.versions[v.version] = Object.assign({ createdAt: '' }, p.versions[v.version], { label: name.trim() });
    try { await Cloud.updateProject(pid, { protocol: p }); WS.project.protocol = p; showProjectAdmin(pid); } catch (e) { showError(e.message); }
  }));
  if (r.criteria) {
    acts.appendChild(button('Forma yükle', 'ui-btn ui-btn-ghost ui-btn-xs', () => {
      loadProtocolIntoForm(Object.assign({}, r, { promptHash: v.version, activeModels: r.models })); switchTab('analysis');
    }, 'Bu sürümün ölçütlerini Analiz formuna yükler (ör. yeni kayıtları aynı ölçütle analiz etmek için)'));
    acts.appendChild(button('TXT', 'ui-btn ui-btn-ghost ui-btn-xs', () => downloadProtocolText(WS.project, v.version), 'Bu sürümün ölçüt ve promptlarını indir'));
  }
  head.append(title, acts);
  card.appendChild(head);

  // results: distribution + difference from the active result
  const m = WS.versions ? WS.versions.byRid : new Map();
  let differ = 0;
  if (v.active < v.total) {
    m.forEach((vm, rid) => {
      const d = vm.get(v.version);
      const rec = WS.recByRid(rid);
      if (!d || !rec || !isActive(rec)) return;
      const a = WS.ai.get(rid);
      const cur = a ? a.ai_decision || a.decision : '';
      if (versionOf(a) !== v.version && cur && cur !== d) differ++;
    });
  }
  const stats = document.createElement('div');
  stats.className = 'ver-stats';
  const bar = document.createElement('div');
  bar.className = 'ws-dist-bar ver-bar';
  const sum = v.Include + v.Uncertain + v.Exclude || 1;
  [['Include', 'inc'], ['Uncertain', 'may'], ['Exclude', 'exc']].forEach(([d, c]) => { const s = document.createElement('span'); s.className = c; s.style.width = `${v[d] / sum * 100}%`; bar.appendChild(s); });
  stats.append(bar, text('div', [
    `${v.total.toLocaleString('tr-TR')} sonuç`,
    `Include ${v.Include.toLocaleString('tr-TR')}`, `Maybe ${v.Uncertain.toLocaleString('tr-TR')}`, `Exclude ${v.Exclude.toLocaleString('tr-TR')}`,
    v.active < v.total ? `etkin sonuçtan farklı karar: ${differ.toLocaleString('tr-TR')}` : ''
  ].filter(Boolean).join(' · '), 'ver-nums'));
  card.appendChild(stats);

  // criteria of this version
  const det = document.createElement('details');
  det.className = 'ver-crit';
  if (r.criteria) {
    const ic = r.criteria.inclusion || [], ec = r.criteria.exclusion || [];
    det.appendChild(text('summary', `Ölçütler · ${ic.length} IC · ${ec.length} EC · ${icLogicText(r.criteria, r.options)}`));
    const ul = (items, cls) => { const u = document.createElement('ul'); u.className = `ver-list ${cls}`; items.forEach(c => u.appendChild(text('li', `${c.code}: ${c.text}`))); return u; };
    det.append(ul(ic, 'ic'), ul(ec, 'ec'));
    if ((r.models || []).length) det.appendChild(text('p', `Modeller: ${r.models.map(x => modelShort(x)).join(', ')}`, 'admin-hint'));
  } else {
    det.appendChild(text('summary', 'Ölçütler kayıtlı değil'));
    det.appendChild(text('p', 'Bu sürüm, sürüm takibi başlamadan (30.09.2026 öncesi) üretildi; hangi ölçüt metniyle üretildiği veritabanında yok. Sonuçları yine de etkin yapabilirsiniz.', 'admin-hint'));
  }
  card.appendChild(det);
  return card;
}

/** Plain-text record of a protocol: criteria, decision logic, options, guidance and the full system prompt. */
function protocolText(p, meta) {
  const o = p.options || {};
  const crit = p.criteria || { inclusion: [], exclusion: [] };
  const hr = '='.repeat(72);
  const sec = t => ['', hr, t, hr];
  const out = [
    `TARAMA PROTOKOLÜ${meta.label ? ` — ${meta.label}` : ''}`,
    `Proje: ${meta.project || '-'}`,
    `Sürüm (sistem talimatının SHA-256 özetinin ilk 8 hanesi): v${meta.version || p.promptHash || '?'}`,
    meta.createdAt ? `Sürüm tarihi: ${new Date(meta.createdAt).toLocaleString('tr-TR')}` : '',
    `Modeller: ${(p.activeModels || p.models || []).map(x => modelShort(x.id || x)).join(', ') || '-'}`,
    `Dışa aktarma: ${new Date().toLocaleString('tr-TR')}`,
    ...sec('DAHİL ETME ÖLÇÜTLERİ (IC)'),
    ...(crit.inclusion.length ? crit.inclusion.map(c => `${c.code}: ${c.text}`) : ['(yok)']),
    ...sec('HARİÇ TUTMA ÖLÇÜTLERİ (EC)'),
    ...(crit.exclusion.length ? crit.exclusion.map(c => `${c.code}: ${c.text}`) : ['(yok)']),
    ...sec('KARAR MANTIĞI'),
    `IC birleşimi: ${icLogicText(crit, o)}`,
    'EC birleşimi: herhangi biri karşılanırsa Exclude',
    `İnsan incelemesi eşiği (güven <): ${o.reviewThreshold ?? '-'}`,
    `Çoklu model uzlaşısı: ${o.consensus || '-'}`,
    `Kanıt doğrulaması: ${o.verifyEvidence === false ? 'kapalı' : 'açık'}`,
    `Özeti olmayan kayıtlar: ${o.noAbstractMode === 'skip' ? 'taranmadı (Uncertain)' : 'başlık/anahtar kelimeyle tarandı'}`,
    `Gerekçe dili: ${o.summaryLanguage || '-'}`,
    `Temperature: ${o.temperature === null || o.temperature === undefined ? 'otomatik' : o.temperature}`,
    o.userTopic ? `Kendi çalışma konusu (yakınlık skoru): ${o.userTopic}` : '',
    ...sec('İNCELEMEYE ÖZGÜ YÖNERGE (sistem promptu)'),
    p.guidance || '(boş)',
    ...sec('MODELE GÖNDERİLEN TAM SİSTEM TALİMATI (yönerge + otomatik protokol)'),
    p.system || '(kayıtlı değil)'
  ];
  return out.filter(x => x !== '').join('\n');
}

/** Downloads the protocol(s) of a project (all versions) or of one version, as UTF-8 text. */
function downloadProtocolText(project, onlyVersion) {
  const proto = (project && project.protocol) || (run ? run : {});
  const name = project ? project.name : (run && run.fileName) || 'yerel analiz';
  const reg = proto.versions || {};
  const parts = [];
  if (onlyVersion) {
    parts.push(protocolText(Object.assign({}, reg[onlyVersion] || proto, { activeModels: (reg[onlyVersion] || {}).models }), { project: name, version: onlyVersion, label: (reg[onlyVersion] || {}).label, createdAt: (reg[onlyVersion] || {}).createdAt }));
  } else {
    parts.push(protocolText(proto, { project: name, version: proto.promptHash, label: 'ETKİN PROTOKOL', createdAt: proto.createdAt }));
    Object.entries(reg).filter(([h]) => h !== proto.promptHash)
      .sort((a, b) => String(b[1].createdAt || '').localeCompare(String(a[1].createdAt || '')))
      .forEach(([h, r]) => parts.push(protocolText(Object.assign({}, r, { activeModels: r.models }), { project: name, version: h, label: r.label || 'önceki sürüm', createdAt: r.createdAt })));
    const th = project ? project.themes : run && run.themeConfig;
    if (th && (th.groups || []).length) {
      parts.push(['TEMATİK ANALİZ AYARLARI', '='.repeat(72), `Araştırma amacı: ${th.goal || '-'}`, `Yakın referans: ${th.reference || '-'}`,
        'Temalar:', ...th.groups.map(g => `  - ${g}`),
        ...(th.proposed && th.proposed.length ? ['YZ\'nin önerdiği yeni temalar:', ...th.proposed.map(g => `  - ${g}`)] : []),
        `Yeni tema önerisi: ${th.allowNew ? `açık (en fazla ${th.maxNew || 3})` : 'kapalı'}`,
        '', 'Tematik analiz promptu:', th.prompt || '(varsayılan)'].join('\n'));
    }
  }
  const safe = String(name).replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40);
  triggerDownload(new Blob(['﻿' + parts.join('\n\n\n')], { type: 'text/plain;charset=utf-8' }),
    `${safe}_protokol${onlyVersion ? `_v${onlyVersion}` : ''}_${localDate()}.txt`);
}

/** Makes the stored results of one version the active AI result of the records that have it. */
async function activateVersion(version) {
  if (!WS.isCloud) return;
  const pid = WS.project.id;
  const reg = ((WS.project.protocol || {}).versions || {})[version];
  let rows;
  try { rows = await Cloud.fetchAiVersion(pid, version); } catch (e) { return showError('Sürüm alınamadı: ' + e.message); }
  rows = rows.filter(r => WS.recByRid(r.rid) && r.ai);
  if (!rows.length) return showError('Bu sürümde etkinleştirilecek sonuç yok.');
  if (!confirm(`v${version} sürümündeki AI sonuçları ${rows.length.toLocaleString('tr-TR')} kayıtta etkin sonuç olacak.\n\nBu sürümde sonucu olmayan kayıtlar değişmez. Hakem kararları, etiketler ve notlar etkilenmez; şu anki sonuçlar kendi sürümlerinde saklı kalır.${reg ? '\nProjenin protokolü de bu sürümün ölçütlerine döner.' : ''}\n\nDevam edilsin mi?`)) return;
  try {
    await Cloud.patchRecords(pid, rows.map(r => ({ rid: r.rid, ai: r.ai, ai_decision: r.ai_decision })));
    if (reg) {
      const p = Object.assign({}, WS.project.protocol, {
        criteria: reg.criteria, options: reg.options, guidance: reg.guidance, icText: reg.icText, ecText: reg.ecText,
        system: reg.system || WS.project.protocol.system, promptHash: version
      });
      await Cloud.updateProject(pid, { protocol: p });
    }
    showSuccess(`v${version} etkin sürüm yapıldı (${rows.length} kayıt).`);
    await openCloudProject(pid);
    showProjectAdmin(pid);
  } catch (e) { showError('Sürüm etkinleştirilemedi: ' + e.message); }
}

// ------------------------------------------------------------
// Import: a new project from an export, or more records into the open project
//  (another database or a later search); duplicates against the records that
//  are already there are detected before anything is analysed.
// ------------------------------------------------------------
const IMPORT = { mode: 'add', plan: null, fileName: '', busy: false };

function openImportDialog(mode) {
  if (!Cloud.user) return showError('Önce giriş yapın.');
  if (mode === 'new' && !canCreateProjects()) return showError('Proje oluşturma yetkiniz yok.');
  if (mode === 'add' && !WS.isCloud) return showError('Önce projeyi açın.');
  if (isScreeningRunning()) return showError('Analiz sürerken kayıt eklenemez.');
  Object.assign(IMPORT, { mode, plan: null, fileName: '' });
  el.importFile.value = '';
  el.importLabel.value = '';
  el.importSummary.hidden = true;
  el.importConfirmBtn.disabled = true;
  el.importNewGroup.style.display = mode === 'new' ? 'block' : 'none';
  if (mode === 'new') {
    el.importTitle.textContent = 'Excel\'den yeni proje';
    el.importName.value = '';
    el.importDescription.value = '';
    el.importIntro.textContent = 'Kayıtlar yüklenir, analiz henüz yapılmaz. Projenin protokolü olarak Analiz sekmesindeki ölçütler, karar mantığı ve yönerge kaydedilir; analizi proje açılınca "Filtredekileri yeniden analiz et" ile başlatırsınız.';
  } else {
    const p = WS.project.protocol || {};
    el.importTitle.textContent = `Kayıt ekle · ${WS.project.name}`;
    el.importIntro.textContent = `Yeni dosyadaki kayıtlar projedeki ${WS.records.length.toLocaleString('tr-TR')} kayıtla karşılaştırılır; tekrarlar ayıklanır. Yeni kayıtları ardından projenin kayıtlı protokolüyle${p.promptHash ? ` (v${p.promptHash})` : ''} analiz edebilirsiniz; sonuçlar mevcut kayıtlarla aynı sürümde olur.`;
  }
  el.importModal.style.display = 'flex';
}

async function planImportFromDialog() {
  const f = el.importFile.files[0];
  el.importConfirmBtn.disabled = true;
  if (!f) { el.importSummary.hidden = true; return; }
  try {
    const rows = await readSpreadsheet(f);
    const prepared = C.prepareRecords(rows, { dedupe: true });
    if (!prepared.records.length) throw new Error('Dosyada kayıt bulunamadı.');
    IMPORT.fileName = f.name;
    if (!el.importLabel.value.trim()) el.importLabel.value = f.name.replace(/\.[^.]+$/, '').slice(0, 60);
    if (IMPORT.mode === 'new' && !el.importName.value.trim()) el.importName.value = f.name.replace(/\.[^.]+$/, '').slice(0, 120);
    const existing = IMPORT.mode === 'add' ? WS.records : [];
    IMPORT.plan = C.planImport(existing, prepared.records, {
      label: el.importLabel.value.trim(), importId: `imp-${Date.now().toString(36)}`,
      autoRemove: el.importAutoRemove.checked, fuzzy: el.importFuzzy.checked
    });
    const s = IMPORT.plan.stats;
    const c = prepared.columns;
    const box = el.importSummary;
    box.textContent = '';
    const line = (label, value, cls) => { const d = document.createElement('div'); d.className = `imp-row ${cls || ''}`; d.append(text('span', label), text('strong', value)); box.appendChild(d); };
    line('Dosyadaki kayıt', s.total.toLocaleString('tr-TR'));
    if (IMPORT.mode === 'add') line('Projede zaten olan (DOI / başlık + yıl)', s.dupExisting.toLocaleString('tr-TR'), s.dupExisting ? 'warn' : '');
    line('Dosyanın kendi içindeki tekrar', s.dupWithin.toLocaleString('tr-TR'), s.dupWithin ? 'warn' : '');
    if (el.importFuzzy.checked) line('Benzer başlık (sizin kararınıza bırakılır)', s.fuzzy.toLocaleString('tr-TR'), s.fuzzy ? 'warn' : '');
    line(el.importAutoRemove.checked ? 'Otomatik kaldırılacak kesin tekrar' : 'Tekrar adayı olarak işaretlenecek', (el.importAutoRemove.checked ? s.removed : s.dupExisting + s.dupWithin).toLocaleString('tr-TR'));
    line('Yeni (analiz edilecek) kayıt', s.fresh.toLocaleString('tr-TR'), 'ok');
    box.appendChild(text('div', `Sütunlar → ID: ${c.id || '(sıra no)'} · Başlık: ${c.title || '-'} · Özet: ${c.abstract || '-'} · Yıl: ${c.year || '-'} · DOI: ${c.doi || '-'} · Belge türü: ${c.doctype || '-'}`, 'muted-small'));
    if (!Cloud.v15) box.appendChild(text('div', 'Not: veritabanı güncellenmediği için kaynak adı kayıtlara yazılamaz (yalnızca proje geçmişine yazılır).', 'muted-small'));
    box.hidden = false;
    el.importConfirmBtn.disabled = false;
    el.importConfirmBtn.textContent = IMPORT.mode === 'new' ? `Projeyi oluştur (${s.total.toLocaleString('tr-TR')} kayıt)` : `${s.total.toLocaleString('tr-TR')} kaydı ekle`;
  } catch (e) {
    IMPORT.plan = null;
    el.importSummary.hidden = false;
    el.importSummary.textContent = '✗ ' + e.message;
  }
}

async function runImport() {
  if (!IMPORT.plan || IMPORT.busy) return;
  IMPORT.busy = true;
  const btn = el.importConfirmBtn;
  btn.disabled = true;
  const { records, stats } = IMPORT.plan;
  const label = el.importLabel.value.trim();
  const entry = { importId: records.length ? records[0].importId : '', label, fileName: IMPORT.fileName, date: new Date().toISOString(), ...stats };
  const extra = Cloud.v15 ? rec => ({ source_label: rec.sourceLabel || label, import_id: rec.importId || '' }) : null;
  const progress = (done, total) => { btn.textContent = `Yükleniyor ${done.toLocaleString('tr-TR')} / ${total.toLocaleString('tr-TR')}`; };
  try {
    let pid;
    if (IMPORT.mode === 'new') {
      const name = el.importName.value.trim();
      if (!name) throw new Error('Proje adı girin.');
      const cfg = currentProtocolConfig();
      const models = resolveModels(settings.activeModels);
      const protocol = {
        version: C.VERSION, criteria: cfg.criteria, options: cfg.options, guidance: cfg.guidance,
        icText: el.inclusionCriteria.value, ecText: el.exclusionCriteria.value, system: cfg.system,
        promptHash: await hashString(cfg.system), models, activeModels: models.map(m => m.id),
        batchSize: Math.max(1, parseInt(el.batchSize.value, 10) || 5), mode: 'sync', fileName: IMPORT.fileName,
        usage: { input: 0, output: 0, cost: 0, perModel: {} }, createdAt: new Date().toISOString(),
        imports: [entry]
      };
      const project = await Cloud.createProject({ name, description: el.importDescription.value.trim(), blind: el.importBlind.checked, hide_ai: false, protocol, file_name: IMPORT.fileName });
      pid = project.id;
      await Cloud.upsertRecords(pid, records.map(rec => ({ rec, ai: null })), progress, extra);
    } else {
      pid = WS.project.id;
      await Cloud.upsertRecords(pid, records.map(rec => ({ rec, ai: null })), progress, extra);
      const p = Object.assign({}, WS.project.protocol);
      const imports = (p.imports || []).slice();
      if (!imports.length) {
        const first = WS.records.filter(r => !r.importId).length;
        imports.push({ importId: '', label: WS.project.file_name || 'İlk dosya', fileName: WS.project.file_name || '', date: WS.project.created_at, total: first });
      }
      imports.push(entry);
      p.imports = imports;
      await Cloud.updateProject(pid, { protocol: p });
    }
    el.importModal.style.display = 'none';
    showSuccess(`${records.length.toLocaleString('tr-TR')} kayıt eklendi · ${stats.fresh.toLocaleString('tr-TR')} yeni · ${(stats.dupExisting + stats.dupWithin).toLocaleString('tr-TR')} kesin tekrar${stats.fuzzy ? ` · ${stats.fuzzy} benzer başlık Tekrarlar sekmesinde` : ''}.`);
    refreshProjects();
    await openCloudProject(pid);
    const fresh = records.filter(r => !r.duplicateOf).map(r => WS.recByRid(r.rid)).filter(Boolean);
    if (IMPORT.mode === 'add' && fresh.length && WS.project.protocol && WS.project.protocol.system &&
        confirm(`${fresh.length.toLocaleString('tr-TR')} yeni kayıt projenin kayıtlı protokolüyle (v${WS.project.protocol.promptHash || '?'}) şimdi analiz edilsin mi?\n\nAnaliz sekmesindeki API anahtarları kullanılır. Daha sonra Durum → "Analiz edilmemiş" filtresiyle de başlatabilirsiniz.`)) {
      await reanalyzeRecords(fresh, { protocol: WS.project.protocol, resume: true });
    }
  } catch (e) {
    showError('İçe aktarılamadı: ' + e.message);
  } finally {
    IMPORT.busy = false;
    btn.disabled = false;
    btn.textContent = 'İçe aktar';
  }
}

// ------------------------------------------------------------
// Project management card
// ------------------------------------------------------------
async function showProjectAdmin(pid) {
  const card = el.projectAdminCard;
  card.style.display = 'block';
  card.textContent = '';
  card.appendChild(text('div', 'Yükleniyor…', 'muted-inline'));
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  let project, members, people, votes;
  try {
    [project, members, people, votes] = await Promise.all([
      Cloud.getProject(pid), Cloud.listMembers(pid), Cloud.listProfiles().catch(() => []), Cloud.fetchVotes(pid)
    ]);
  } catch (e) { card.textContent = 'Yüklenemedi: ' + e.message; return; }
  const manage = canManageProject(project);
  const isOpen = WS.isCloud && WS.project.id === pid;
  card.textContent = '';
  card.classList.add('ws-admin');
  const head = document.createElement('div');
  head.className = 'admin-head';
  head.append(text('h2', project.name, 'ws-title'));
  const who = pid && project.owner_id === (Cloud.user && Cloud.user.id) ? badge('crown', 'Sahibi sizsiniz', 'ok') : null;
  if (who) head.appendChild(who);
  card.appendChild(head);

  // --- settings
  const section = (title, hint) => {
    const s = document.createElement('section');
    s.className = 'admin-sec';
    s.appendChild(text('h3', title, 'ui-card-title'));
    if (hint) s.appendChild(text('p', hint, 'admin-hint'));
    card.appendChild(s);
    return s;
  };
  const sSet = section('Ayarlar');
  const grid = document.createElement('div');
  grid.className = 'admin-grid';
  const field = (label, input) => { const l = document.createElement('label'); l.className = 'ui-field'; l.append(text('span', label, 'ui-label'), input); return l; };
  const nameI = document.createElement('input'); nameI.type = 'text'; nameI.value = project.name; nameI.className = 'ui-input';
  const descI = document.createElement('input'); descI.type = 'text'; descI.value = project.description; descI.className = 'ui-input';
  grid.append(field('Proje adı', nameI), field('Açıklama', descI));
  sSet.appendChild(grid);
  const check = (checked, label) => { const l = document.createElement('label'); l.className = 'ui-check admin-check'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = checked; l.append(c, document.createTextNode(label)); return [l, c]; };
  const [blindL, blindC] = check(project.blind, 'Kör mod: hakemler yalnızca kendi kararlarını görür (veritabanı kuralıyla uygulanır)');
  const [aiL, aiC] = check(project.hide_ai, 'AI kararlarını, güveni ve gerekçeyi hakemlerden gizle (kanıt vurguları görünür kalır)');
  sSet.append(blindL, aiL);
  const acts = document.createElement('div');
  acts.className = 'admin-actions';
  acts.appendChild(uiButton('save', 'Ayarları kaydet', 'ui-btn ui-btn-default ui-btn-sm', async () => {
    try {
      const upd = await Cloud.updateProject(pid, { name: nameI.value.trim() || project.name, description: descI.value.trim(), blind: blindC.checked, hide_ai: aiC.checked });
      if (isOpen) { WS.project = Object.assign(WS.project, upd); renderWorkspace(); }
      showSuccess('Proje ayarları kaydedildi.');
      refreshProjects().then(() => showProjectAdmin(pid));
    } catch (e) { showError(e.message); }
  }));
  acts.appendChild(uiButton('clipboard-list', 'Protokolü Analiz formuna yükle', 'ui-btn ui-btn-outline ui-btn-sm', () => { loadProtocolIntoForm(project.protocol); switchTab('analysis'); }));
  acts.appendChild(uiButton('file-plus-2', 'Yeni Excel ekle', 'ui-btn ui-btn-outline ui-btn-sm', async () => {
    if (!isOpen) await openCloudProject(pid);
    if (WS.isCloud && WS.project.id === pid) openImportDialog('add');
  }, 'Başka bir veritabanından ya da yeni bir aramadan kayıt ekler; tekrarlar ayıklanır'));
  acts.appendChild(uiButton('list-x', 'Gerekçeleri düzenle', 'ui-btn ui-btn-outline ui-btn-sm', async () => {
    if (!isOpen) await openCloudProject(pid);
    if (WS.isCloud && WS.project.id === pid) openReasonManager();
  }, 'Bu projede kullanılan hariç tutma gerekçeleri'));
  acts.appendChild(uiButton('file-down', 'Promptları indir (.txt)', 'ui-btn ui-btn-outline ui-btn-sm', () => downloadProtocolText(project),
    'Ölçütler, karar mantığı, yönerge ve modele giden tam sistem talimatı; tüm sürümlerle'));
  if (manage) acts.appendChild(uiButton('trash-2', 'Projeyi sil', 'ui-btn ui-btn-outline ui-btn-sm is-danger', async () => {
    const typed = prompt(`"${project.name}" projesi, tüm kayıtları ve hakem kararlarıyla birlikte kalıcı olarak silinecek.\nOnaylamak için proje adını yazın:`);
    if (typed !== project.name) { if (typed !== null) showError('Proje adı eşleşmedi, silinmedi.'); return; }
    try {
      await Cloud.deleteProject(pid);
      if (WS.isCloud && WS.project.id === pid) closeCloudProject();
      showSuccess('Proje silindi.');
      refreshProjects();
    } catch (e) { showError(e.message); }
  }));
  sSet.appendChild(acts);

  // --- sources (imports)
  const imports = (project.protocol && project.protocol.imports) || [];
  if (imports.length) {
    const sSrc = section('Kaynaklar', 'Her yükleme ayrı kaynak olarak tutulur (PRISMA: veritabanlarından tanımlanan kayıtlar).');
    const t = miniTable(['Kaynak', 'Dosya', 'Tarih', 'Kayıt', 'Tekrar', 'Yeni']);
    imports.forEach(im => t.row([im.label || '—', im.fileName || '', im.date ? new Date(im.date).toLocaleDateString('tr-TR') : '',
      (im.total || 0).toLocaleString('tr-TR'), im.importId ? ((im.dupExisting || 0) + (im.dupWithin || 0)).toLocaleString('tr-TR') : '—',
      im.importId ? (im.fresh || 0).toLocaleString('tr-TR') : '—']));
    sSrc.appendChild(t.wrap);
  }

  // --- AI versions: which criteria gave which results; go back to any of them
  const sVer = section('AI sürümleri', 'Ölçütleri ya da yönergeyi değiştirip yeniden analiz ettiğinizde yeni bir sürüm oluşur; öncekiler silinmez. "Bu taramaya geri dön" yalnızca AI kararlarını değiştirir: hakem oyları, nihai kararlar, etiket, not ve gerekçeler olduğu gibi kalır.');
  if (!Cloud.v15) {
    sVer.appendChild(text('p', 'Sürüm takibi için veritabanı güncellemesi gerekiyor.', 'admin-hint warn'));
  } else if (!isOpen) {
    sVer.appendChild(uiButton('folder-open', 'Sürümleri görmek için projeyi açın', 'ui-btn ui-btn-outline ui-btn-sm', async () => { await openCloudProject(pid); showProjectAdmin(pid); }));
  } else {
    // the protocol in use is always described in the registry
    const cur = WS.project.protocol || {};
    if (cur.promptHash && cur.criteria && !(cur.versions || {})[cur.promptHash]) {
      const p = Object.assign({}, cur, { versions: Object.assign({}, cur.versions) });
      registerVersion(p, cur);
      Cloud.updateProject(pid, { protocol: p }).then(() => { WS.project.protocol = p; }).catch(e => console.warn(e));
      project.protocol = p;
    }
    const list = versionSummary();
    const reg = (project.protocol && project.protocol.versions) || {};
    if (!list.length) sVer.appendChild(text('p', 'Henüz AI sonucu yok.', 'admin-hint'));
    list.forEach(v => sVer.appendChild(versionCard(v, reg[v.version], pid)));
    if (list.length > 1) {
      const diff = WS.records.filter(r => isActive(r) && versionsDisagree(r.rid)).length;
      const note = document.createElement('p');
      note.className = 'admin-hint';
      note.textContent = `${diff.toLocaleString('tr-TR')} aktif kayıtta sürümler farklı karar vermiş. `;
      note.appendChild(button('Bu kayıtları listele', 'ui-btn ui-btn-ghost ui-btn-xs', () => { switchTab('screen'); el.filterStatus.value = 'vdiff'; WS.page = 1; renderWorkspace(); }));
      note.appendChild(document.createTextNode(' Excel/CSV dışa aktarımı her sürümün kararını ve birleşik (liberal) kararı ayrı sütunlarda verir.'));
      sVer.appendChild(note);
    }
  }

  // --- members
  const sMem = section('Hakemler');
  const memberIds = new Set(members.map(m => m.user_id));
  const stats = new Map();
  votes.forEach(v => {
    if (!v.decision) return;
    const s = stats.get(v.user_id) || { Include: 0, Uncertain: 0, Exclude: 0 };
    s[v.decision]++; stats.set(v.user_id, s);
  });
  const pById = new Map(people.map(p => [p.id, p]));
  members.forEach(m => { if (m.profiles && !pById.has(m.user_id)) pById.set(m.user_id, m.profiles); });
  const rowsFor = [...new Set([...members.map(m => m.user_id), ...stats.keys()])];
  const mt = miniTable(['Ad', 'E-posta', 'Include', 'Maybe', 'Exclude', 'Toplam', '']);
  rowsFor.forEach(uid => {
    const p = pById.get(uid) || { display_name: '?', email: '', role: '' };
    const s = stats.get(uid) || { Include: 0, Uncertain: 0, Exclude: 0 };
    const tag = uid === project.owner_id ? ' (sahip)' : p.role === 'admin' ? ' (yönetici)' : '';
    let act = '';
    if (memberIds.has(uid) && manage) act = button('Çıkar', 'ui-btn ui-btn-ghost ui-btn-xs', async () => {
      if (!confirm(`${p.display_name} projeden çıkarılsın mı? (Verdiği kararlar silinmez.)`)) return;
      try { await Cloud.removeMember(pid, uid); showProjectAdmin(pid); refreshProjects(); } catch (e) { showError(e.message); }
    });
    mt.row([`${p.display_name}${tag}`, p.email, s.Include, s.Uncertain, s.Exclude, s.Include + s.Uncertain + s.Exclude, act]);
  });
  if (!rowsFor.length) mt.row(['Henüz hakem yok.', '', '', '', '', '', '']);
  sMem.appendChild(mt.wrap);

  if (manage) {
    const add = document.createElement('div');
    add.className = 'admin-actions';
    if (Cloud.v15) {
      const email = document.createElement('input');
      email.type = 'email'; email.className = 'ui-input admin-email'; email.placeholder = 'hakem@ornek.edu.tr';
      const doAdd = async () => {
        const v = email.value.trim();
        if (!v) return;
        try { const p = await Cloud.addMemberByEmail(pid, v); showSuccess(`${p.display_name || p.email} projeye eklendi.`); showProjectAdmin(pid); refreshProjects(); }
        catch (e) { showError(e.message); }
      };
      email.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
      add.append(email, uiButton('user-plus', 'E-postayla ekle', 'ui-btn ui-btn-default ui-btn-sm', doAdd));
    } else if (Cloud.isAdmin) {
      const candidates = people.filter(p => !memberIds.has(p.id) && p.role !== 'admin');
      const sel = document.createElement('select');
      sel.className = 'ui-select admin-email';
      const o0 = document.createElement('option'); o0.value = ''; o0.textContent = candidates.length ? 'Kayıtlı kullanıcı seçin…' : 'Eklenebilecek kayıtlı kullanıcı yok'; sel.appendChild(o0);
      candidates.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.display_name} <${p.email}>`; sel.appendChild(o); });
      add.append(sel, uiButton('user-plus', 'Projeye ekle', 'ui-btn ui-btn-default ui-btn-sm', async () => {
        if (!sel.value) return;
        try { await Cloud.addMember(pid, sel.value); showSuccess('Hakem eklendi.'); showProjectAdmin(pid); refreshProjects(); } catch (e) { showError(e.message); }
      }));
    }
    sMem.appendChild(add);
    sMem.appendChild(text('p', 'Hakemler önce bu sayfadan "Kayıt ol" ile hesap açmalıdır; kayıtlı e-postalarıyla eklenirler. Hakemler yalnızca eklendikleri projeleri görür ve yalnızca kendi kararlarını, etiketlerini ve notlarını değiştirebilir.', 'admin-hint'));
  }

  const byRec = new Map();
  votes.forEach(v => { if (v.decision) { const s = byRec.get(v.record_id) || new Set(); s.add(v.decision); byRec.set(v.record_id, s); } });
  const conflicts = [...byRec.values()].filter(s => s.size > 1).length;
  sMem.appendChild(text('p', `Hakemler arası çatışan kayıt: ${conflicts} · En az bir karar almış kayıt: ${byRec.size}`, 'admin-hint'));
  refreshIcons();
}

/** Small shadcn-style table: miniTable(headers).row(cells) — cells may be nodes. */
function miniTable(headers) {
  const tbl = document.createElement('table');
  tbl.className = 'ui-table';
  const hr = document.createElement('tr');
  headers.forEach(h => hr.appendChild(text('th', h)));
  const thead = document.createElement('thead'); thead.appendChild(hr); tbl.appendChild(thead);
  const tb = document.createElement('tbody'); tbl.appendChild(tb);
  const wrap = document.createElement('div'); wrap.className = 'ui-table-wrap'; wrap.appendChild(tbl);
  return {
    wrap,
    row(cells) {
      const tr = document.createElement('tr');
      cells.forEach(c => { const td = document.createElement('td'); if (c instanceof Node) td.appendChild(c); else td.textContent = String(c); tr.appendChild(td); });
      tb.appendChild(tr);
    }
  };
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
  if (name === 'themes') Assist.renderThemes();
  if (name === 'chat') Assist.renderChat();
  if (name === 'report') Report.render();
  try { sessionStorage.setItem('gls_tab', name); } catch (e) { /* ignore */ }
}

function initWorkspace() {
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  const rerender = () => { WS.page = 1; renderWorkspace(); };
  ['filterAi', 'filterMine', 'filterStatus', 'filterLabel', 'sortBy', 'pageSize'].forEach(id => el[id].addEventListener('change', rerender));
  el.filterSearch.addEventListener('input', debounce(rerender, 250));
  el.toggleAllAbstractsBtn.addEventListener('click', () => {
    WS.compactAbs = !WS.compactAbs;
    setBtnText(el.toggleAllAbstractsBtn, WS.compactAbs ? 'Özetleri tam göster' : 'Özetleri daralt');
    el.resultsTable.classList.toggle('compact-abs', WS.compactAbs);
  });
  // click a row to make it the keyboard target
  el.resultsBody.addEventListener('click', e => {
    if (e.target.closest('button, a, input, select, textarea, summary')) return;
    const tr = e.target.closest('tr[data-rid]');
    if (tr) setFocusRow(tr.dataset.rid, false);
  });
  document.addEventListener('keydown', onScreenKey);
  el.selectPage.addEventListener('change', () => {
    el.resultsBody.querySelectorAll('tr[data-rid]').forEach(tr => {
      if (el.selectPage.checked) WS.selected.add(tr.dataset.rid); else WS.selected.delete(tr.dataset.rid);
    });
    renderWorkspace();
  });
  el.clearSelectionBtn.addEventListener('click', () => { WS.selected.clear(); renderWorkspace(); });
  el.selectFilteredBtn.addEventListener('click', () => { (WS._lastFiltered || []).forEach(r => WS.selected.add(r.rid)); renderWorkspace(); });
  document.querySelectorAll('.bulk-btn[data-target]').forEach(b => b.addEventListener('click', () => {
    const d = b.dataset.decision === 'none' ? null : b.dataset.decision;
    if (b.dataset.target === 'final') bulkFinal(d || ''); else bulkVote(d);
  }));
  el.bulkReasonBtn.addEventListener('click', e => {
    if (!WS.selected.size) return;
    openTermPicker({
      kind: 'reason', anchor: e.currentTarget, selected: [],
      title: `Seçili ${WS.selected.size} kayda gerekçeyle hariç`,
      hint: 'Seçtiğiniz gerekçeler her kayıttaki oyunuzun yerine geçer.',
      applyLabel: '✕ Hepsini hariç tut',
      onApply: reasons => bulkVote('Exclude', reasons)
    });
  });
  el.bulkLabelBtn.addEventListener('click', e => {
    if (!WS.selected.size) return;
    openTermPicker({
      kind: 'label', anchor: e.currentTarget, selected: [],
      title: `Seçili ${WS.selected.size} kayda etiket`,
      hint: 'Seçtiğiniz etiketler her kayda eklenir; mevcut etiketler silinmez. Yeni etiket yazıp Enter ile ekleyin.',
      applyLabel: 'Etiketleri ekle',
      onApply: labels => bulkLabels(labels)
    });
  });
  el.bulkNoteBtn.addEventListener('click', e => { if (WS.selected.size) openNotePopover(e.currentTarget); });
  el.themeFilterNone.addEventListener('click', () => { WS.themeSel.clear(); WS.page = 1; renderWorkspace(); });
  setupStickyFilters();
  el.filterPeople.addEventListener('change', () => { WS.page = 1; renderWorkspace(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollChanges(); });
  window.addEventListener('online', () => pollChanges());
  el.reanalyzeSelectedBtn.addEventListener('click', () => reanalyzeRids([...WS.selected]));
  el.reanalyzeAllBtn.addEventListener('click', () => reanalyzeRids((WS._lastFiltered || []).map(r => r.rid)));
  el.retryErrorsBtn.addEventListener('click', () => reanalyzeRids(WS.records.filter(r => { const a = WS.ai.get(r.rid); return a && a.error && !r.removed; }).map(r => r.rid)));
  el.downloadCsvBtn.addEventListener('click', wsDownloadCsv);
  el.downloadExcelBtn.addEventListener('click', wsDownloadExcel);
  el.exportMenu.addEventListener('toggle', () => { if (el.exportMenu.open) updateExportMenu(); });
  el.downloadProtocolBtn.addEventListener('click', () => { el.exportMenu.open = false; downloadProtocolText(WS.isCloud ? WS.project : null); });
  el.openReportBtn.addEventListener('click', () => { el.exportMenu.open = false; switchTab('report'); });
  // dashboard rows open the matching list (duplicates live in their own tab)
  document.querySelectorAll('.ws-queue-row[data-jump]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.jump === 'dups') { switchTab('dups'); return; }
    el.filterStatus.value = b.dataset.jump;
    WS.page = 1;
    renderWorkspace();
    el.filterStatus.closest('.ws-filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  el.relevanceReportBtn.addEventListener('click', wsRelevanceReport);
  el.relTopN.addEventListener('change', wsRelevanceReport);
  el.clearFiltersBtn.addEventListener('click', clearFilters);
  el.archiveSelectedBtn.addEventListener('click', () => setArchived(selectedRecords(), true));
  el.unarchiveSelectedBtn.addEventListener('click', () => setArchived(selectedRecords(), false));
  document.querySelectorAll('.seg-btn[data-scope]').forEach(b => b.addEventListener('click', () => {
    WS.statsScope = b.dataset.scope;
    document.querySelectorAll('.seg-btn[data-scope]').forEach(x => x.classList.toggle('active', x === b));
    try { localStorage.setItem('gls_stats_scope', WS.statsScope); } catch (e) { /* ignore */ }
    updateWsStats();
  }));
  try {
    const sc = localStorage.getItem('gls_stats_scope');
    if (sc) { WS.statsScope = sc; document.querySelectorAll('.seg-btn[data-scope]').forEach(x => x.classList.toggle('active', x.dataset.scope === sc)); }
  } catch (e) { /* ignore */ }
  el.docTypeAll.addEventListener('click', () => {
    WS.records.forEach(r => { if (!r.removed) WS.docTypes.add(docTypeOf(r)); });
    WS.page = 1; renderWorkspace();
  });
  el.docTypeNone.addEventListener('click', () => { WS.docTypes.clear(); WS.page = 1; renderWorkspace(); });
  ['yearFrom', 'yearTo'].forEach(id => el[id].addEventListener('input', debounce(() => { WS.page = 1; renderWorkspace(); }, 300)));
  document.querySelectorAll('.th-sort').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); onHeaderSort(b.dataset.sort); }));
  // close the document type panel when clicking elsewhere
  document.addEventListener('click', e => {
    if (el.docTypeFilter.open && !el.docTypeFilter.contains(e.target)) el.docTypeFilter.open = false;
    if (el.exportMenu.open && !el.exportMenu.contains(e.target)) el.exportMenu.open = false;
    if (el.themeFilterDd.open && !el.themeFilterDd.contains(e.target)) el.themeFilterDd.open = false;
  });
  // multi-select lists open to the left when they would leave the screen on the right
  document.addEventListener('toggle', e => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('dd-filter')) return;
    d.classList.remove('dd-right');
    if (!d.open) return;
    const panel = d.querySelector('.dd-panel');
    if (panel && panel.getBoundingClientRect().right > document.documentElement.clientWidth - 8) d.classList.add('dd-right');
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { el.exportMenu.open = false; el.docTypeFilter.open = false; el.themeFilterDd.open = false; } });
  el.saveToCloudBtn.addEventListener('click', openSaveDialog);
  el.newProjectBtn.addEventListener('click', () => openImportDialog('new'));
  el.importFile.addEventListener('change', planImportFromDialog);
  ['importAutoRemove', 'importFuzzy'].forEach(id => el[id].addEventListener('change', planImportFromDialog));
  el.importLabel.addEventListener('change', planImportFromDialog);
  el.importConfirmBtn.addEventListener('click', runImport);
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

  Assist.init();
  Report.init();
  let tab = 'analysis';
  try { tab = sessionStorage.getItem('gls_tab') || 'analysis'; } catch (e) { /* ignore */ }
  switchTab(tab);
  refreshIcons();
  renderAuthArea();
  if (Cloud.available) {
    Cloud.onChange(onAuthChanged);
    Cloud.init().then(() => { renderAuthArea(); refreshProjects(); renderWorkspace(); }).catch(e => console.warn(e));
  } else refreshProjects();
}
