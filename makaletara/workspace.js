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
  const next = Object.assign({ decision: null, labels: [], note: '' }, prev || {}, patch);
  if (!WS.isCloud) {
    run.human = run.human || {};
    run.human[rid] = { decision: next.decision, labels: next.labels, note: next.note };
    scheduleSave();
    afterVoteView(rid, opts.advance);
    return;
  }
  let m = WS.votes.get(rid);
  if (!m) { m = new Map(); WS.votes.set(rid, m); }
  m.set(WS.meId, next);
  afterVoteView(rid, opts.advance);
  try {
    await Cloud.upsertVote({ record_id: rec.dbId, decision: next.decision, labels: next.labels, note: next.note });
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
  if (isFinite(f.yearFrom) || isFinite(f.yearTo)) {
    const y = parseInt(rec.Year, 10);
    if (!isFinite(y)) return false;
    if (isFinite(f.yearFrom) && y < f.yearFrom) return false;
    if (isFinite(f.yearTo) && y > f.yearTo) return false;
  }
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
  WS.records.forEach(r => { if (!r.removed) counts.set(docTypeOf(r), (counts.get(docTypeOf(r)) || 0) + 1); });
  // drop selections that no longer exist (e.g. after switching project)
  [...WS.docTypes].forEach(t => { if (!counts.has(t)) WS.docTypes.delete(t); });
  const types = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));
  const sig = types.map(t => t.join('=')).join('|') + '#' + [...WS.docTypes].join('|');
  el.docTypeSummary.textContent = !WS.docTypes.size ? '📄 Belge türü: tümü'
    : WS.docTypes.size === 1 ? `📄 ${[...WS.docTypes][0]}` : `📄 Belge türü: ${WS.docTypes.size} tür`;
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
  if (!has) return;
  renderSourceBar();
  renderLabelFilter();
  renderPeopleFilter();
  renderDocTypeFilter();
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
    const live = text('span', '', 'live-status');
    live.id = 'liveStatus';
    left.appendChild(live);
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
  el.loadProtocolBtn.style.display = WS.isCloud && WS.canCurate ? 'inline-flex' : 'none';
  el.filterPeople.style.display = WS.isCloud ? '' : 'none';
  el.bulkFinalGroup.style.display = WS.isCloud ? 'inline-flex' : 'none';
  renderLiveStatus();
  el.costPanel.style.display = WS.isCloud ? 'none' : 'grid';
  el.statConflictCard.style.display = WS.isCloud && !WS.blindForMe ? 'block' : 'none';
  el.filterStatus.querySelectorAll('.cloud-only').forEach(o => { o.hidden = !WS.isCloud; });
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
  opt(el.filterPeople, '', '👥 Hakem / nihai: tümü');
  const fg = document.createElement('optgroup');
  fg.label = '⚖ Nihai karar';
  [['Include', 'Dahil'], ['Uncertain', 'Belirsiz'], ['Exclude', 'Hariç'], ['none', 'verilmemiş']].forEach(([v, t]) => opt(fg, `f||${v}`, `Nihai: ${t}`));
  el.filterPeople.appendChild(fg);
  people.forEach((name, uid) => {
    const g = document.createElement('optgroup');
    g.label = `👤 ${name}`;
    [['Include', 'Dahil dedikleri'], ['Uncertain', 'Belirsiz dedikleri'], ['Exclude', 'Hariç dedikleri'], ['any', 'oy verdikleri'], ['none', 'oy vermedikleri']]
      .forEach(([v, t]) => opt(g, `u|${uid}|${v}`, `${name}: ${t}`));
    el.filterPeople.appendChild(g);
  });
  el.filterPeople.value = [...el.filterPeople.options].some(o => o.value === cur) ? cur : '';
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
    head.appendChild(text('span', 'Yapay zekâ önerisi', 'dp-sec-title'));
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
  const addBtn = button('+ Etiket', 'btn-ghost btn-ghost-sm', () => {
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

function selectedRecords() {
  return [...WS.selected].map(rid => WS.recByRid(rid)).filter(r => r && !r.removed);
}

/** My vote on every selected record (decision null removes it). Labels and notes are kept. */
async function bulkVote(decision) {
  const recs = selectedRecords();
  if (!recs.length) return;
  const what = decision ? `"${DEC_TR[decision]}" oyunuz` : 'oyunuz kaldırılacak';
  if (!confirm(`${recs.length} seçili kayıt için ${decision ? `${what} işlenecek` : what}. Devam edilsin mi?`)) return;
  const rows = recs.map(rec => {
    const prev = myVote(rec.rid) || {};
    return { rec, next: { decision, labels: prev.labels || [], note: prev.note || '' } };
  });
  if (!WS.isCloud) {
    run.human = run.human || {};
    rows.forEach(({ rec, next }) => { run.human[rec.rid] = next; });
    scheduleSave();
  } else {
    const backup = rows.map(({ rec }) => [rec.rid, myVote(rec.rid)]);
    rows.forEach(({ rec, next }) => {
      let m = WS.votes.get(rec.rid);
      if (!m) { m = new Map(); WS.votes.set(rec.rid, m); }
      m.set(WS.meId, next);
    });
    try {
      await Cloud.upsertVotes(rows.map(({ rec, next }) => ({ record_id: rec.dbId, decision: next.decision, labels: next.labels, note: next.note })));
    } catch (e) {
      backup.forEach(([rid, v]) => { const m = WS.votes.get(rid); if (v) m.set(WS.meId, v); else m.delete(WS.meId); });
      renderWorkspace();
      return showError('Toplu oy kaydedilemedi, geri alındı: ' + e.message);
    }
  }
  WS.selected.clear();
  renderWorkspace();
  showSuccess(`${rows.length} kayda ${decision ? `"${DEC_TR[decision]}" oyunuz işlendi` : 'ait oyunuz kaldırıldı'}.`);
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
  el.selCount.textContent = n ? `${n} kayıt seçili` : 'Seçim yok';
  el.reanalyzeSelectedBtn.disabled = !n;
  el.clearSelectionBtn.disabled = !n;
  document.querySelectorAll('.bulk-btn').forEach(b => { b.disabled = !n; });
  const nf = (WS._lastFiltered || []).length;
  el.selectFilteredBtn.textContent = `☑ Filtredekilerin tümünü seç (${nf.toLocaleString('tr-TR')})`;
  el.selectFilteredBtn.disabled = !nf || (WS._lastFiltered || []).every(r => WS.selected.has(r.rid));
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
    .sort((x, y) => y.a.relevance_score - x.a.relevance_score);
  const n = el.relTopN.value === 'all' ? top.length : parseInt(el.relTopN.value, 10);
  el.relTitle.textContent = `🔍 Konunuza En Yakın Çalışmalar (${Math.min(n, top.length)} / ${top.length})`;
  top.slice(0, n).forEach(({ r, a }, i) => {
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
    const members = await Cloud.listMembers(id).catch(() => []);
    WS.members = members.map(m => m.user_id);
    members.forEach(m => { if (m.profiles && !WS.profiles.has(m.user_id)) WS.profiles.set(m.user_id, m.profiles); });
    startLiveSync(id, rows, votes);
    renderWorkspace(); renderDuplicates();
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
  m.set(v.user_id, { decision: v.decision, labels: v.labels || [], note: v.note || '', updated_at: v.updated_at });
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
  ['finalDecision', 'finalBy', 'removed', 'removedReason', 'duplicateOf', 'dupKind', 'dupScore', 'notDupOf'].forEach(k => { rec[k] = fresh[k]; });
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
    act.appendChild(button(Cloud.isAdmin ? '⚙️ Yönet' : '⚙️ Ayarlar', 'btn-tertiary btn-compact', () => showProjectAdmin(p.id)));
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
  if (Cloud.isAdmin) saveRow.appendChild(button('🗑️ Projeyi sil', 'btn-danger btn-compact', async () => {
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
    if (memberIds.has(uid) && Cloud.isAdmin) tdA.appendChild(button('Çıkar', 'btn-ghost', async () => {
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
  if (Cloud.isAdmin) card.appendChild(add);
  if (Cloud.isAdmin) card.appendChild(text('p', 'Hakemler önce bu sayfadan "Kayıt ol" ile hesap açmalıdır; ardından listede görünürler. Hakemler yalnızca eklendikleri projeleri görür, yalnızca kendi kararlarını, etiketlerini ve notlarını değiştirebilir.', 'muted-small'));

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
    WS.compactAbs = !WS.compactAbs;
    el.toggleAllAbstractsBtn.textContent = WS.compactAbs ? '↕️ Özetleri tam göster' : '↕️ Özetleri daralt';
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
  document.querySelectorAll('.bulk-btn').forEach(b => b.addEventListener('click', () => {
    const d = b.dataset.decision === 'none' ? null : b.dataset.decision;
    if (b.dataset.target === 'final') bulkFinal(d || ''); else bulkVote(d);
  }));
  el.filterPeople.addEventListener('change', () => { WS.page = 1; renderWorkspace(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollChanges(); });
  window.addEventListener('online', () => pollChanges());
  el.reanalyzeSelectedBtn.addEventListener('click', () => reanalyzeRids([...WS.selected]));
  el.reanalyzeAllBtn.addEventListener('click', () => reanalyzeRids((WS._lastFiltered || []).map(r => r.rid)));
  el.retryErrorsBtn.addEventListener('click', () => reanalyzeRids(WS.records.filter(r => { const a = WS.ai.get(r.rid); return a && a.error && !r.removed; }).map(r => r.rid)));
  el.downloadCsvBtn.addEventListener('click', wsDownloadCsv);
  el.downloadExcelBtn.addEventListener('click', wsDownloadExcel);
  el.relevanceReportBtn.addEventListener('click', wsRelevanceReport);
  el.relTopN.addEventListener('change', wsRelevanceReport);
  el.clearFiltersBtn.addEventListener('click', clearFilters);
  el.docTypeAll.addEventListener('click', () => {
    WS.records.forEach(r => { if (!r.removed) WS.docTypes.add(docTypeOf(r)); });
    WS.page = 1; renderWorkspace();
  });
  el.docTypeNone.addEventListener('click', () => { WS.docTypes.clear(); WS.page = 1; renderWorkspace(); });
  ['yearFrom', 'yearTo'].forEach(id => el[id].addEventListener('input', debounce(() => { WS.page = 1; renderWorkspace(); }, 300)));
  document.querySelectorAll('.th-sort').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); onHeaderSort(b.dataset.sort); }));
  // close the document type panel when clicking elsewhere
  document.addEventListener('click', e => { if (el.docTypeFilter.open && !el.docTypeFilter.contains(e.target)) el.docTypeFilter.open = false; });
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
