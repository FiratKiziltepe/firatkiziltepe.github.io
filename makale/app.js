// ============================================================
// Main Application - Article Management System
// ============================================================

let columns = [];
let articles = [];
let density = 'md';
let sortKey = null;
let sortDir = 'asc';
let searchQuery = '';
let editingArticleId = null;
let viewingArticle = null;
let formRating = 0;

// Local visibility overrides (browser-only, not saved to DB unless admin)
let localVisibility = {};

// =====================================================
// INIT
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H1',location:'app.js:DOMContentLoaded',message:'DOMContentLoaded started',data:{readyState:document.readyState},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    initSupabase();
  } catch (e) {
    console.error('Supabase init hatası:', e);
  }

  try {
    setupUIListeners();
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H1',location:'app.js:setupUIListeners',message:'setupUIListeners threw',data:{error:String(e&&e.message||e)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw e;
  }

  try {
    setupAuthListeners();
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H3',location:'app.js:authBootstrap',message:'before checkSession',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    await checkSession();
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H3',location:'app.js:authBootstrap',message:'auth bootstrap failed',data:{error:String(e&&e.message||e)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Auth hatası:', e);
  }

  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H4',location:'app.js:beforeLoadData',message:'calling loadData',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  await loadData();
});

async function loadData() {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H4',location:'app.js:loadData:start',message:'loadData started',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      columns = await fetchColumns();
    } catch (err) {
      console.error('Sütun yükleme hatası:', err);
      columns = [];
    }

    try {
      articles = await fetchArticles();
    } catch (err) {
      console.error('Makale yükleme hatası:', err);
      articles = [];
    }
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'post-fix',hypothesisId:'H4',location:'app.js:loadData:results',message:'loadData sequential done',data:{columnsCount:columns.length,articlesCount:articles.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    columns.forEach(c => {
      if (localVisibility[c.column_key] === undefined) {
        localVisibility[c.column_key] = c.visible;
      }
    });

    renderTable();

    if (columns.length === 0) {
      showNotification('Veritabanı tabloları bulunamadı. schema.sql çalıştırıldığından emin olun.', 'error');
    }
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H4',location:'app.js:loadData:catch',message:'loadData catch',data:{error:String(err&&err.message||err)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Veri yükleme hatası:', err);
    showNotification('Veri yüklenirken hata: ' + (err.message || err), 'error');
  } finally {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H4',location:'app.js:loadData:finally',message:'loadData finally -> hideLoading',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    hideLoading();
  }
}

function hideLoading() {
  const el = document.getElementById('loadingState');
  if (el) el.classList.add('hidden');
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/b023c46a-511c-4c17-9776-da716466e988',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c9bb1'},body:JSON.stringify({sessionId:'6c9bb1',runId:'run1',hypothesisId:'H4',location:'app.js:hideLoading',message:'hideLoading invoked',data:{hasElement:!!el,isHidden:!!(el&&el.classList.contains('hidden'))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

function onAuthChange() {
  renderTable();
}

// =====================================================
// DENSITY
// =====================================================

function getDensityClasses() {
  switch (density) {
    case 'sm': return 'px-2.5 py-1.5 text-xs';
    case 'lg': return 'px-4 py-3.5 text-sm';
    default: return 'px-3 py-2 text-xs';
  }
}

// =====================================================
// SORTING & FILTERING
// =====================================================

function getProcessedArticles() {
  let result = [...articles];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(a => {
      const dataStr = Object.values(a.data || {}).join(' ').toLowerCase();
      return dataStr.includes(q);
    });
  }

  if (sortKey) {
    result.sort((a, b) => {
      let va, vb;
      if (sortKey === 'rating') {
        va = a.rating || 0;
        vb = b.rating || 0;
      } else {
        va = (a.data && a.data[sortKey]) || '';
        vb = (b.data && b.data[sortKey]) || '';
      }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
}

function handleSort(key) {
  if (sortKey === key) {
    if (sortDir === 'asc') { sortDir = 'desc'; }
    else { sortKey = null; sortDir = 'asc'; }
  } else {
    sortKey = key;
    sortDir = 'asc';
  }
  renderTable();
}

// =====================================================
// RENDER TABLE
// =====================================================

function renderTable() {
  const processed = getProcessedArticles();
  const visibleCols = columns.filter(c => localVisibility[c.column_key] !== false).sort((a, b) => a.sort_order - b.sort_order);

  const rowCountEl = document.getElementById('rowCount');
  if (rowCountEl) rowCountEl.textContent = `${processed.length} / ${articles.length} kayıt`;
  const footerEl = document.getElementById('footerCount');
  if (footerEl) footerEl.textContent = `Toplam ${articles.length} makale listeleniyor`;

  const table = document.getElementById('mainTable');
  const empty = document.getElementById('emptyState');

  if (!table || !empty) return;

  if (processed.length === 0) {
    table.classList.add('hidden');
    empty.classList.remove('hidden');
    empty.classList.add('flex');
    return;
  }

  table.classList.remove('hidden');
  empty.classList.add('hidden');
  empty.classList.remove('flex');

  // HEAD
  const thead = document.getElementById('tableHead');
  const dc = getDensityClasses();
  let headHTML = '<tr>';

  // Rating column
  headHTML += `<th class="${dc} border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none text-center w-16" onclick="handleSort('rating')">
    <div class="flex items-center justify-center gap-0.5">
      <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"/></svg>
      ${sortKey === 'rating' ? `<span class="text-[9px] text-blue-500">${sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>` : ''}
    </div>
  </th>`;

  visibleCols.forEach(col => {
    const sortIcon = sortKey === col.column_key ? `<span class="text-[9px] text-blue-500 ml-0.5">${sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>` : '';
    headHTML += `<th class="${dc} border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none" onclick="handleSort('${col.column_key}')">
      <div class="flex items-center">${escapeHTML(col.name)}${sortIcon}</div>
    </th>`;
  });

  if (isAdmin()) {
    headHTML += `<th class="${dc} border-b border-slate-200 text-center w-24">İşlemler</th>`;
  }
  headHTML += '</tr>';
  thead.innerHTML = headHTML;

  // BODY
  const tbody = document.getElementById('tableBody');
  let bodyHTML = '';

  processed.forEach(article => {
    bodyHTML += `<tr class="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100" onclick="openViewDrawer(${article.id})">`;

    // Rating cell
    bodyHTML += `<td class="${dc} cell-rating align-middle text-center">${renderStarsCompact(article.rating || 0, article.id)}</td>`;

    visibleCols.forEach(col => {
      const val = article.data ? article.data[col.column_key] : '';
      const cellClass = getCellClass(col);
      bodyHTML += `<td class="${dc} ${cellClass} align-middle">${renderCellContent(col, val)}</td>`;
    });

    if (isAdmin()) {
      bodyHTML += `<td class="${dc} cell-action align-middle text-center">
        <div class="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="event.stopPropagation(); openViewDrawer(${article.id})" class="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Görüntüle">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
          </button>
          <button onclick="event.stopPropagation(); openEditModal(${article.id})" class="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Düzenle">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
          </button>
          <button onclick="event.stopPropagation(); duplicateArticle(${article.id})" class="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors" title="Kopyala">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"/></svg>
          </button>
          <button onclick="event.stopPropagation(); openDeleteModal(${article.id})" class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Sil">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
          </button>
        </div>
      </td>`;
    }

    bodyHTML += '</tr>';
  });

  tbody.innerHTML = bodyHTML;

  if (processed.length === 0 && articles.length > 0) {
    table.classList.add('hidden');
    empty.classList.remove('hidden');
    empty.classList.add('flex');
  }
}

function getCellClass(col) {
  switch (col.type) {
    case 'longtext': return 'cell-long';
    case 'multiselect': return 'cell-tag';
    case 'select': return 'cell-badge';
    default: return col.column_key === 'title' ? 'cell-title font-medium text-slate-800' : '';
  }
}

function renderStarsCompact(rating, articleId) {
  let html = '<div class="flex gap-px justify-center">';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    html += `<button onclick="event.stopPropagation(); setRating(${articleId}, ${i})" class="focus:outline-none">
      <svg class="w-3 h-3 ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
      </svg>
    </button>`;
  }
  html += '</div>';
  return html;
}

async function duplicateArticle(articleId) {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;
  try {
    const newData = { ...article.data, title: (article.data.title || '') + ' (Kopya)' };
    const created = await createArticle(newData, article.rating || 0);
    articles.unshift(created);
    renderTable();
    showNotification('Kayıt kopyalandı', 'success');
  } catch (err) {
    showNotification('Kopyalama hatası: ' + err.message, 'error');
  }
}

// =====================================================
// CELL RENDERERS
// =====================================================

function renderCellContent(col, value) {
  if (value === undefined || value === null || value === '') return '<span class="text-slate-300">-</span>';

  switch (col.type) {
    case 'url':
      return `<a href="${escapeHTML(value)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()" class="text-blue-600 hover:underline text-xs truncate block max-w-[120px]" title="${escapeHTML(value)}">
        ${escapeHTML(value).replace(/^https?:\/\/(www\.)?/, '').substring(0, 25)}...
      </a>`;

    case 'select': {
      const colorMap = {
        'Okunacak': 'bg-slate-100 text-slate-600',
        'Okunuyor': 'bg-blue-100 text-blue-700',
        'Reading': 'bg-blue-100 text-blue-700',
        'Okundu': 'bg-emerald-100 text-emerald-700',
        'Özetlendi': 'bg-purple-100 text-purple-700',
        'Bırakıldı': 'bg-gray-100 text-gray-400',
        'Temel Kaynak': 'bg-rose-100 text-rose-700',
        'Doğrudan': 'bg-orange-100 text-orange-700',
        'Kısmen': 'bg-yellow-100 text-yellow-700',
        'İlişkisiz': 'bg-slate-100 text-slate-500',
        'Not related': 'bg-slate-100 text-slate-500',
      };
      const cls = colorMap[value] || 'bg-gray-100 text-gray-600';
      return `<span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}">${escapeHTML(value)}</span>`;
    }

    case 'multiselect': {
      const tags = typeof value === 'string' ? value.split(',') : (Array.isArray(value) ? value : [value]);
      return `<div class="flex flex-wrap gap-1">${tags.map(t => {
        const tag = t.trim();
        if (!tag) return '';
        return `<span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-medium">${escapeHTML(tag)}</span>`;
      }).join('')}</div>`;
    }

    case 'longtext':
      return `<span class="text-slate-500" title="${escapeHTML(value)}">${escapeHTML(value)}</span>`;

    case 'boolean':
      return value ? '<span class="text-emerald-600">Evet</span>' : '<span class="text-slate-300">-</span>';

    default:
      return `<span class="text-slate-700">${escapeHTML(value)}</span>`;
  }
}

// =====================================================
// STARS (5-star rating)
// =====================================================

function renderStars(rating, articleId, inTable = false) {
  let html = '<div class="flex gap-0.5 justify-center">';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    const size = inTable ? 'w-4 h-4' : 'w-5 h-5';
    const clickHandler = inTable
      ? `event.stopPropagation(); setRating(${articleId}, ${i})`
      : `setFormRating(${i})`;
    html += `<button onclick="${clickHandler}" class="p-0.5 hover:scale-110 transition-transform focus:outline-none">
      <svg class="${size} ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-300'}" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
      </svg>
    </button>`;
  }
  html += '</div>';
  return html;
}

async function setRating(articleId, rating) {
  if (!isAdmin()) return;
  try {
    await updateArticleRating(articleId, rating);
    const idx = articles.findIndex(a => a.id === articleId);
    if (idx !== -1) articles[idx].rating = rating;
    renderTable();
    if (viewingArticle && viewingArticle.id === articleId) {
      viewingArticle.rating = rating;
      renderViewRating();
    }
  } catch (err) {
    showNotification('Değerlendirme kaydedilemedi', 'error');
  }
}

function setFormRating(r) {
  formRating = (formRating === r) ? 0 : r;
  renderFormRatingStars();
}

function renderFormRatingStars() {
  const el = document.getElementById('formRating');
  if (!el) return;
  let html = '<div class="flex gap-0.5">';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= formRating;
    html += `<button type="button" onclick="setFormRating(${i})" class="focus:outline-none hover:scale-110 transition-transform">
      <svg class="w-5 h-5 ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-300'}" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
      </svg>
    </button>`;
  }
  html += '</div>';
  el.innerHTML = html;
}

function renderViewRating() {
  if (!viewingArticle) return;
  const container = document.getElementById('viewRating');
  container.innerHTML = renderStars(viewingArticle.rating || 0, viewingArticle.id, false)
    .replace(/setFormRating\((\d)\)/g, `setRating(${viewingArticle.id}, $1)`);
}

// =====================================================
// VIEW DRAWER
// =====================================================

async function openViewDrawer(articleId) {
  viewingArticle = articles.find(a => a.id === articleId);
  if (!viewingArticle) return;

  renderViewRating();
  renderViewContent();
  await loadAdvisorNotes(articleId);

  // Show/hide advisor note form based on role
  const noteForm = document.getElementById('advisorNoteForm');
  if (canAddNote()) {
    noteForm.classList.remove('hidden');
  } else {
    noteForm.classList.add('hidden');
  }

  // Show admin buttons
  if (isAdmin()) {
    document.getElementById('viewEditBtn').classList.remove('hidden');
    document.getElementById('viewEditBtn').classList.add('flex');
    document.getElementById('viewDeleteBtn').classList.remove('hidden');
  } else {
    document.getElementById('viewEditBtn').classList.add('hidden');
    document.getElementById('viewDeleteBtn').classList.add('hidden');
  }

  document.getElementById('viewOverlay').classList.remove('hidden');
  document.getElementById('viewDrawer').classList.remove('hidden');
  document.getElementById('viewDrawer').classList.add('flex');
}

function closeViewDrawer() {
  document.getElementById('viewOverlay').classList.add('hidden');
  document.getElementById('viewDrawer').classList.add('hidden');
  document.getElementById('viewDrawer').classList.remove('flex');
  viewingArticle = null;
}

function renderViewContent() {
  if (!viewingArticle) return;
  const data = viewingArticle.data || {};
  const content = document.getElementById('viewContent');

  const sortedCols = [...columns].sort((a, b) => a.sort_order - b.sort_order);

  // Title + URL header
  let html = '<div class="pb-4 border-b border-slate-100">';
  html += `<h2 class="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">${escapeHTML(data.title || 'İsimsiz Makale')}</h2>`;
  if (data.url) {
    html += `<a href="${escapeHTML(data.url)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium text-sm bg-blue-50 px-3 py-1.5 rounded-md">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
      Orijinal Kaynağa Git
    </a>`;
  }
  html += '</div>';

  // Metadata grid (short fields)
  const metaKeys = ['author', 'year', 'status', 'relation', 'section', 'method'];
  const metaCols = sortedCols.filter(c => metaKeys.includes(c.column_key));
  if (metaCols.length > 0) {
    html += '<div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">';
    metaCols.forEach(col => {
      const val = data[col.column_key];
      if (!val) return;
      html += `<div class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${escapeHTML(col.name)}</span>
        <div class="text-sm font-medium text-slate-800">${renderCellContent(col, val)}</div>
      </div>`;
    });
    html += '</div>';
  }

  // Long text fields + others
  const skipKeys = ['title', 'url', ...metaKeys];
  const otherCols = sortedCols.filter(c => !skipKeys.includes(c.column_key));

  html += '<div class="space-y-5 pt-2">';
  otherCols.forEach(col => {
    const val = data[col.column_key];
    if (!val) return;
    const isNotes = col.column_key === 'notes';
    const wrapClass = isNotes ? 'bg-amber-50/50 p-4 rounded-xl border border-amber-100' : '';
    const titleClass = isNotes ? 'text-amber-800' : 'text-slate-800';
    const textClass = isNotes ? 'text-amber-900' : 'text-slate-600';

    html += `<div class="${wrapClass}">
      <h4 class="text-sm font-bold ${titleClass} mb-2">${escapeHTML(col.name)}</h4>
      <div class="text-sm leading-relaxed ${textClass}">${col.type === 'multiselect' ? renderCellContent(col, val) : escapeHTML(val)}</div>
    </div>`;
  });
  html += '</div>';

  content.innerHTML = html;
}

// =====================================================
// ADVISOR NOTES
// =====================================================

async function loadAdvisorNotes(articleId) {
  const list = document.getElementById('advisorNotesList');
  try {
    const notes = await fetchAdvisorNotes(articleId);
    if (notes.length === 0) {
      list.innerHTML = '<p class="text-xs text-amber-600 italic">Henüz danışman görüşü eklenmemiş.</p>';
      return;
    }
    list.innerHTML = notes.map(n => `
      <div class="bg-white border border-amber-100 rounded-lg p-3 text-sm">
        <div class="flex justify-between items-start mb-1">
          <span class="font-semibold text-amber-800 text-xs">${escapeHTML(n.profiles?.display_name || 'Danışman')}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-amber-500">${new Date(n.created_at).toLocaleDateString('tr-TR')}</span>
            ${(isAdmin() || (currentProfile && n.advisor_id === currentProfile.id)) ? `<button onclick="deleteNote(${n.id}, ${articleId})" class="text-red-400 hover:text-red-600 text-xs">&times;</button>` : ''}
          </div>
        </div>
        <p class="text-slate-700 leading-relaxed">${escapeHTML(n.note)}</p>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-xs text-red-500">Notlar yüklenemedi.</p>';
  }
}

async function saveAdvisorNote() {
  if (!viewingArticle || !canAddNote()) return;
  const input = document.getElementById('advisorNoteInput');
  const note = input.value.trim();
  if (!note) return;

  try {
    await createAdvisorNote(viewingArticle.id, currentProfile.id, note);
    input.value = '';
    await loadAdvisorNotes(viewingArticle.id);
    showNotification('Not eklendi', 'success');
  } catch (err) {
    showNotification('Not eklenemedi: ' + err.message, 'error');
  }
}

async function deleteNote(noteId, articleId) {
  try {
    await deleteAdvisorNote(noteId);
    await loadAdvisorNotes(articleId);
  } catch (err) {
    showNotification('Not silinemedi', 'error');
  }
}

// =====================================================
// ADD / EDIT MODAL
// =====================================================

function openAddModal() {
  editingArticleId = null;
  formRating = 0;
  document.getElementById('formTitle').textContent = 'Yeni Kayıt Oluştur';
  document.getElementById('formSubmitText').textContent = 'Kaydet';
  renderFormFields({});
  renderFormRatingStars();
  showFormModal();
}

function openEditModal(articleId) {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;
  editingArticleId = articleId;
  formRating = article.rating || 0;
  document.getElementById('formTitle').textContent = 'Kaydı Düzenle';
  document.getElementById('formSubmitText').textContent = 'Değişiklikleri Kaydet';
  renderFormFields(article.data || {});
  renderFormRatingStars();
  closeViewDrawer();
  showFormModal();
}

function showFormModal() {
  document.getElementById('formModal').classList.remove('hidden');
  document.getElementById('formModal').classList.add('flex');
  document.getElementById('pasteArea').classList.add('hidden');
}

function closeFormModal() {
  document.getElementById('formModal').classList.add('hidden');
  document.getElementById('formModal').classList.remove('flex');
  editingArticleId = null;
}

function renderFormFields(data) {
  const grid = document.getElementById('formGrid');
  const sortedCols = [...columns].sort((a, b) => a.sort_order - b.sort_order);

  const shortCols = sortedCols.filter(c => c.type !== 'longtext');
  const longCols = sortedCols.filter(c => c.type === 'longtext');

  let html = '';

  // Rating row
  html += `<div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
    <span class="text-xs font-semibold text-slate-500">Değerlendirme</span>
    <div id="formRating" class="flex gap-0.5"></div>
  </div>`;

  // Short fields: 2-column grid
  if (shortCols.length > 0) {
    html += '<div class="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">';
    shortCols.forEach(col => {
      const isTitle = col.column_key === 'title';
      html += `<div${isTitle ? ' class="col-span-2 sm:col-span-1"' : ''}>
        <label class="block text-xs font-semibold text-slate-500 mb-1">${escapeHTML(col.name)}${isTitle ? ' *' : ''}</label>
        ${renderFormInput(col, data[col.column_key])}
      </div>`;
    });
    html += '</div>';
  }

  // Long text fields: single column
  longCols.forEach(col => {
    html += `<div class="mb-3">
      <label class="block text-xs font-semibold text-slate-500 mb-1">${escapeHTML(col.name)}</label>
      <textarea data-key="${col.column_key}" rows="3" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-white" placeholder="${escapeHTML(col.name)} girin...">${escapeHTML(data[col.column_key] || '')}</textarea>
    </div>`;
  });

  grid.innerHTML = html;
  renderFormRatingStars();
}

function renderFormInput(col, value) {
  const base = 'w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white';
  const v = value || '';

  switch (col.type) {
    case 'select': {
      let opts = col.options || [];
      if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch { opts = []; } }
      if (!Array.isArray(opts)) opts = [];
      let html = `<select data-key="${col.column_key}" class="${base}"><option value="">Seçiniz...</option>`;
      opts.forEach(o => { html += `<option value="${escapeHTML(o)}" ${o === v ? 'selected' : ''}>${escapeHTML(o)}</option>`; });
      return html + '</select>';
    }
    case 'multiselect':
      return `<input data-key="${col.column_key}" type="text" value="${escapeHTML(v)}" class="${base}" placeholder="Virgülle ayırın..." />`;
    case 'url':
      return `<input data-key="${col.column_key}" type="text" value="${escapeHTML(v)}" class="${base}" placeholder="https://..." />`;
    case 'boolean':
      return `<label class="flex items-center gap-2 cursor-pointer">
        <input data-key="${col.column_key}" type="checkbox" ${v ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
        <span class="text-sm text-slate-600">Evet</span>
      </label>`;
    case 'date':
      return `<input data-key="${col.column_key}" type="date" value="${escapeHTML(v)}" class="${base}" />`;
    default:
      return `<input data-key="${col.column_key}" type="text" value="${escapeHTML(v)}" class="${base}" placeholder="" />`;
  }
}

function collectFormData() {
  const data = {};
  document.querySelectorAll('#formGrid [data-key]').forEach(el => {
    const key = el.dataset.key;
    if (el.type === 'checkbox') {
      data[key] = el.checked;
    } else {
      data[key] = el.value;
    }
  });
  return data;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const data = collectFormData();
  const submitBtn = e.target.querySelector('[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Kaydediliyor...';
  }

  try {
    if (editingArticleId) {
      const updated = await updateArticle(editingArticleId, data, formRating);
      const idx = articles.findIndex(a => a.id === editingArticleId);
      if (idx !== -1) articles[idx] = updated;
      showNotification('Kayıt güncellendi', 'success');
    } else {
      const created = await createArticle(data, formRating);
      articles.unshift(created);
      showNotification('Yeni kayıt eklendi', 'success');
    }
    closeFormModal();
    renderTable();
  } catch (err) {
    console.error('Form submit error:', err);
    showNotification('Kayıt hatası: ' + (err.message || 'Bilinmeyen hata'), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      const textEl = submitBtn.querySelector('span');
      if (textEl) textEl.textContent = editingArticleId ? 'Değişiklikleri Kaydet' : 'Kaydet';
    }
  }
}

// =====================================================
// EXCEL PASTE
// =====================================================

function togglePasteArea() {
  const area = document.getElementById('pasteArea');
  area.classList.toggle('hidden');
  if (!area.classList.contains('hidden')) {
    document.getElementById('pasteInput').focus();
  }
}

function applyPaste() {
  const raw = document.getElementById('pasteInput').value.trim();
  if (!raw) return;

  const lines = raw.split('\n').map(line => line.split('\t'));
  if (lines.length === 0) return;

  const sortedCols = [...columns].sort((a, b) => a.sort_order - b.sort_order);

  // Check if first row is header
  const firstRow = lines[0];
  const headerMatch = matchHeaders(firstRow, sortedCols);

  if (headerMatch.matchRate > 0.4 && lines.length > 1) {
    // First row is header, use mapping
    const dataLines = lines.slice(1);
    if (dataLines.length === 1) {
      fillFormFromRow(dataLines[0], headerMatch.mapping);
    } else {
      batchInsertFromPaste(dataLines, headerMatch.mapping);
    }
  } else {
    // No header, use column order
    const mapping = {};
    sortedCols.forEach((col, i) => { mapping[i] = col.column_key; });
    if (lines.length === 1) {
      fillFormFromRow(lines[0], mapping);
    } else {
      batchInsertFromPaste(lines, mapping);
    }
  }

  document.getElementById('pasteInput').value = '';
  document.getElementById('pasteArea').classList.add('hidden');
}

function matchHeaders(headerRow, sortedCols) {
  const mapping = {};
  let matched = 0;

  headerRow.forEach((header, idx) => {
    const h = header.trim().toLowerCase();
    if (!h) return;

    let bestCol = null;
    let bestScore = 0;

    sortedCols.forEach(col => {
      const name = col.name.toLowerCase();
      const key = col.column_key.toLowerCase();

      // Exact match
      if (h === name || h === key) {
        bestCol = col;
        bestScore = 1;
        return;
      }

      // Partial match
      if (name.includes(h) || h.includes(name) || key.includes(h) || h.includes(key)) {
        const score = Math.max(
          h.length / Math.max(name.length, h.length),
          h.length / Math.max(key.length, h.length)
        );
        if (score > bestScore) {
          bestCol = col;
          bestScore = score;
        }
      }
    });

    if (bestCol && bestScore > 0.3) {
      mapping[idx] = bestCol.column_key;
      matched++;
    }
  });

  return { mapping, matchRate: matched / Math.max(headerRow.length, 1) };
}

function fillFormFromRow(row, mapping) {
  Object.entries(mapping).forEach(([idx, key]) => {
    const val = row[parseInt(idx)];
    if (val === undefined) return;
    const el = document.querySelector(`#formGrid [data-key="${key}"]`);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = val.trim().toLowerCase() === 'evet' || val.trim() === '1' || val.trim().toLowerCase() === 'true';
      } else {
        el.value = val.trim();
      }
    }
  });
  showNotification('Veriler forma dolduruldu', 'success');
}

async function batchInsertFromPaste(dataLines, mapping) {
  const batch = dataLines.map(row => {
    const data = {};
    Object.entries(mapping).forEach(([idx, key]) => {
      const val = row[parseInt(idx)];
      if (val !== undefined) data[key] = val.trim();
    });
    return { data, rating: 0 };
  }).filter(item => Object.keys(item.data).length > 0);

  if (batch.length === 0) return;

  try {
    const created = await createArticlesBatch(batch);
    articles = [...created, ...articles];
    closeFormModal();
    renderTable();
    showNotification(`${created.length} kayıt toplu eklendi`, 'success');
  } catch (err) {
    showNotification('Toplu ekleme hatası: ' + err.message, 'error');
  }
}

// =====================================================
// DELETE
// =====================================================

let articleToDelete = null;

function openDeleteModal(articleId) {
  articleToDelete = articles.find(a => a.id === articleId);
  if (!articleToDelete) return;
  document.getElementById('deleteMessage').innerHTML =
    `<strong class="text-slate-800">${escapeHTML(articleToDelete.data?.title || 'İsimsiz')}</strong> isimli makaleyi silmek üzeresiniz. Bu işlem geri alınamaz.`;
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('deleteModal').classList.add('flex');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.add('hidden');
  document.getElementById('deleteModal').classList.remove('flex');
  articleToDelete = null;
}

async function handleDelete() {
  if (!articleToDelete) return;
  try {
    await deleteArticle(articleToDelete.id);
    articles = articles.filter(a => a.id !== articleToDelete.id);
    closeDeleteModal();
    closeViewDrawer();
    renderTable();
    showNotification('Kayıt silindi', 'success');
  } catch (err) {
    showNotification('Silme hatası: ' + err.message, 'error');
  }
}

// =====================================================
// COLUMN MANAGER
// =====================================================

function openColumnManager() {
  renderColumnList();
  document.getElementById('columnManagerOverlay').classList.remove('hidden');
  document.getElementById('columnManagerDrawer').classList.remove('hidden');
  document.getElementById('columnManagerDrawer').classList.add('flex');
}

function closeColumnManager() {
  document.getElementById('columnManagerOverlay').classList.add('hidden');
  document.getElementById('columnManagerDrawer').classList.add('hidden');
  document.getElementById('columnManagerDrawer').classList.remove('flex');
}

function renderColumnList() {
  const list = document.getElementById('columnList');
  const sorted = [...columns].sort((a, b) => a.sort_order - b.sort_order);

  list.innerHTML = sorted.map((col, idx) => {
    const vis = localVisibility[col.column_key] !== false;
    const editingThis = editingColumnId === col.id;
    return `<li class="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg group transition-all">
      <div class="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity">
        <button onclick="moveColumnOrder(${col.id}, 'up')" ${idx === 0 ? 'disabled' : ''} class="hover:text-blue-600 disabled:opacity-0 p-0.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m4.5 15.75 7.5-7.5 7.5 7.5"/></svg>
        </button>
        <button onclick="moveColumnOrder(${col.id}, 'down')" ${idx === sorted.length - 1 ? 'disabled' : ''} class="hover:text-blue-600 disabled:opacity-0 p-0.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </button>
      </div>
      <div class="flex-1 min-w-0">
        ${editingThis
          ? `<input id="colRenameInput" type="text" value="${escapeHTML(col.name)}" class="text-sm font-medium text-slate-700 border border-blue-400 rounded px-1.5 py-0.5 w-full focus:ring-2 focus:ring-blue-500 outline-none" onkeydown="if(event.key==='Enter'){event.preventDefault();saveColumnRename(${col.id});}if(event.key==='Escape'){cancelColumnRename();}" />`
          : `<p class="text-sm font-medium text-slate-700 truncate ${isAdmin() ? 'cursor-pointer hover:text-blue-600' : ''}" ${isAdmin() ? `ondblclick="startColumnRename(${col.id})"` : ''}>${escapeHTML(col.name)}</p>`
        }
        <p class="text-[10px] text-slate-400 uppercase tracking-wider">${escapeHTML(col.type)}</p>
      </div>
      ${isAdmin() && !editingThis ? `<button onclick="startColumnRename(${col.id})" class="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" title="Adı Düzenle">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
      </button>` : ''}
      ${isAdmin() && editingThis ? `<button onclick="saveColumnRename(${col.id})" class="p-1 text-emerald-500 hover:text-emerald-700 transition-all" title="Kaydet">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m4.5 12.75 6 6 9-13.5"/></svg>
      </button>` : ''}
      ${isAdmin() ? `<button onclick="handleDeleteColumn(${col.id}, '${escapeHTML(col.name)}')" class="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Sütunu Sil">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
      </button>` : ''}
      <button onclick="toggleColumnVis('${col.column_key}')"
        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vis ? 'bg-blue-600' : 'bg-slate-300'}" role="switch">
        <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vis ? 'translate-x-4' : 'translate-x-0'}"></span>
      </button>
    </li>`;
  }).join('');
}

function toggleColumnVis(colKey) {
  localVisibility[colKey] = !(localVisibility[colKey] !== false);

  if (isAdmin()) {
    const col = columns.find(c => c.column_key === colKey);
    if (col) {
      updateColumn(col.id, { visible: localVisibility[colKey] }).catch(() => {});
      col.visible = localVisibility[colKey];
    }
  }

  renderColumnList();
  renderTable();
}

async function moveColumnOrder(colId, direction) {
  const sorted = [...columns].sort((a, b) => a.sort_order - b.sort_order);
  const idx = sorted.findIndex(c => c.id === colId);
  if (idx === -1) return;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;

  const tempOrder = sorted[idx].sort_order;
  sorted[idx].sort_order = sorted[swapIdx].sort_order;
  sorted[swapIdx].sort_order = tempOrder;

  columns = sorted;

  if (isAdmin()) {
    try {
      await Promise.all([
        updateColumn(sorted[idx].id, { sort_order: sorted[idx].sort_order }),
        updateColumn(sorted[swapIdx].id, { sort_order: sorted[swapIdx].sort_order })
      ]);
    } catch (err) {
      showNotification('Sıralama kaydedilemedi', 'error');
    }
  }

  renderColumnList();
  renderTable();
}

// Column rename state
let editingColumnId = null;

function startColumnRename(colId) {
  editingColumnId = colId;
  renderColumnList();
  setTimeout(() => {
    const input = document.getElementById('colRenameInput');
    if (input) { input.focus(); input.select(); }
  }, 50);
}

function cancelColumnRename() {
  editingColumnId = null;
  renderColumnList();
}

async function saveColumnRename(colId) {
  const input = document.getElementById('colRenameInput');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) return;

  try {
    await updateColumn(colId, { name: newName });
    const col = columns.find(c => c.id === colId);
    if (col) col.name = newName;
    editingColumnId = null;
    renderColumnList();
    renderTable();
    showNotification('Sütun adı güncellendi', 'success');
  } catch (err) {
    showNotification('Sütun adı güncellenemedi: ' + err.message, 'error');
  }
}

async function handleDeleteColumn(colId, colName) {
  if (!confirm(`"${colName}" sütununu silmek istediğinizden emin misiniz?`)) return;
  try {
    await deleteColumn(colId);
    columns = columns.filter(c => c.id !== colId);
    renderColumnList();
    renderTable();
    showNotification(`"${colName}" sütunu silindi`, 'success');
  } catch (err) {
    showNotification('Sütun silinemedi: ' + err.message, 'error');
  }
}

async function handleAddColumn(e) {
  e.preventDefault();
  const name = document.getElementById('newColName').value.trim();
  const key = document.getElementById('newColKey').value.trim();
  const type = document.getElementById('newColType').value;
  const optionsRaw = document.getElementById('newColOptions').value.trim();

  if (!name || !key) return;

  let options = [];
  if ((type === 'select' || type === 'multiselect') && optionsRaw) {
    options = optionsRaw.split(',').map(o => o.trim()).filter(Boolean);
  }

  const maxOrder = columns.reduce((max, c) => Math.max(max, c.sort_order), 0);

  try {
    const created = await createColumn({
      column_key: key,
      name,
      type,
      visible: true,
      sort_order: maxOrder + 1,
      options
    });
    columns.push(created);
    localVisibility[key] = true;

    document.getElementById('newColName').value = '';
    document.getElementById('newColKey').value = '';
    document.getElementById('newColOptions').value = '';
    document.getElementById('addColumnForm').classList.add('hidden');
    document.getElementById('btnShowAddColumn').classList.remove('hidden');

    renderColumnList();
    renderTable();
    showNotification(`"${name}" sütunu eklendi`, 'success');
  } catch (err) {
    showNotification('Sütun eklenemedi: ' + err.message, 'error');
  }
}

// =====================================================
// UI LISTENERS
// =====================================================

function setupUIListeners() {
  // Search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderTable();
    }, 300);
  });

  // Density
  document.getElementById('densityGroup').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-density]');
    if (!btn) return;
    density = btn.dataset.density;
    document.querySelectorAll('#densityGroup button').forEach(b => {
      b.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
      b.classList.add('text-slate-600');
    });
    btn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
    btn.classList.remove('text-slate-600');
    renderTable();
  });

  // Column Manager
  document.getElementById('btnColumnManager').addEventListener('click', openColumnManager);
  document.getElementById('columnManagerClose').addEventListener('click', closeColumnManager);
  document.getElementById('columnManagerOverlay').addEventListener('click', closeColumnManager);

  // New Record
  document.getElementById('btnNewRecord').addEventListener('click', openAddModal);

  // Form modal
  document.getElementById('formModalClose').addEventListener('click', closeFormModal);
  document.getElementById('formCancelBtn').addEventListener('click', closeFormModal);
  document.getElementById('recordForm').addEventListener('submit', handleFormSubmit);

  // Excel paste
  document.getElementById('btnPasteMode').addEventListener('click', togglePasteArea);
  document.getElementById('btnCancelPaste').addEventListener('click', () => document.getElementById('pasteArea').classList.add('hidden'));
  document.getElementById('btnApplyPaste').addEventListener('click', applyPaste);

  // View drawer
  document.getElementById('viewClose').addEventListener('click', closeViewDrawer);
  document.getElementById('viewOverlay').addEventListener('click', closeViewDrawer);
  document.getElementById('viewEditBtn').addEventListener('click', () => {
    if (viewingArticle) openEditModal(viewingArticle.id);
  });
  document.getElementById('viewDeleteBtn').addEventListener('click', () => {
    if (viewingArticle) openDeleteModal(viewingArticle.id);
  });

  // Advisor note
  document.getElementById('btnSaveAdvisorNote').addEventListener('click', saveAdvisorNote);

  // Delete modal
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', handleDelete);

  // Add column
  document.getElementById('btnShowAddColumn').addEventListener('click', () => {
    document.getElementById('addColumnForm').classList.remove('hidden');
    document.getElementById('btnShowAddColumn').classList.add('hidden');
  });
  document.getElementById('btnCancelAddColumn').addEventListener('click', () => {
    document.getElementById('addColumnForm').classList.add('hidden');
    document.getElementById('btnShowAddColumn').classList.remove('hidden');
  });
  document.getElementById('newColumnForm').addEventListener('submit', handleAddColumn);

  // New col type change => show/hide options
  document.getElementById('newColType').addEventListener('change', (e) => {
    const wrap = document.getElementById('newColOptionsWrap');
    if (e.target.value === 'select' || e.target.value === 'multiselect') {
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  });

  // ESC to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFormModal();
      closeViewDrawer();
      closeColumnManager();
      closeDeleteModal();
    }
  });
}

// =====================================================
// UTILS
// =====================================================

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
