let allQuestions = [];
let allExpanded = true; // default: all open

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    allQuestions = await fetchQuestions();
    loadCategoryOptions();
    renderQuestions(allQuestions);
  } catch (err) {
    console.error(err);
    document.getElementById('questionsContainer').innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Sorular yüklenemedi</div></div>';
  }
}

function loadCategoryOptions() {
  const cats = [...new Set(allQuestions.map(q => q.category))].sort();
  const select = document.getElementById('categoryFilter');
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function filterQuestions() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const category = document.getElementById('categoryFilter').value;

  let filtered = allQuestions;

  if (category !== 'all') {
    filtered = filtered.filter(q => q.category === category);
  }

  if (search) {
    filtered = filtered.filter(q =>
      q.question.toLowerCase().includes(search) ||
      q.model_answer.toLowerCase().includes(search)
    );
  }

  renderQuestions(filtered);
}

function renderQuestions(questions) {
  const container = document.getElementById('questionsContainer');
  document.getElementById('questionCount').textContent = `${questions.length} soru`;

  if (questions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Soru bulunamadı</div></div>';
    return;
  }

  // Cards default open, vocab default open
  const openClass = allExpanded ? 'open' : '';

  container.innerHTML = questions.map((q, i) => `
    <div class="question-card">
      <div class="question-card-header" onclick="toggleCard(this)">
        <div>
          <div class="question-number">Soru ${i + 1}</div>
          <div class="question-text">${escapeHtml(q.question)}</div>
        </div>
        <span class="badge question-category">${escapeHtml(q.category)}</span>
      </div>
      <div class="question-card-body ${openClass}">
        <div class="answer-section">
          <div class="answer-label">Model Cevap</div>
          <div class="answer-text">${escapeHtml(q.model_answer)}</div>
        </div>
        ${renderVocab(q.vocabulary_hints)}
      </div>
    </div>
  `).join('');

  updateToggleBtn();
}

function renderVocab(hints) {
  if (!hints || hints.length === 0) return '';
  const openClass = allExpanded ? 'open' : '';
  return `
    <div class="vocab-section">
      <button class="vocab-toggle" onclick="event.stopPropagation(); this.nextElementSibling.classList.toggle('open')">
        📚 Vocabulary & Collocations (${hints.length})
      </button>
      <div class="vocab-list ${openClass}">
        ${hints.map(h => `
          <div class="vocab-item">
            <span class="vocab-word">${escapeHtml(h.word)}</span>
            <span class="vocab-meaning">${escapeHtml(h.meaning)}</span>
            ${h.example ? `<span class="vocab-example">"${escapeHtml(h.example)}"</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function toggleCard(header) {
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

function toggleAll() {
  allExpanded = !allExpanded;

  // Toggle all card bodies
  document.querySelectorAll('.question-card-body').forEach(body => {
    if (allExpanded) body.classList.add('open');
    else body.classList.remove('open');
  });

  // Toggle all vocab lists
  document.querySelectorAll('.vocab-list').forEach(list => {
    if (allExpanded) list.classList.add('open');
    else list.classList.remove('open');
  });

  updateToggleBtn();
}

function updateToggleBtn() {
  const btn = document.getElementById('toggleAllBtn');
  if (allExpanded) {
    btn.innerHTML = '🔼 Tümünü Kapat';
  } else {
    btn.innerHTML = '🔽 Tümünü Aç';
  }
}

function exportExcel() {
  if (allQuestions.length === 0) {
    showToast('İndirilecek soru yok');
    return;
  }

  const rows = allQuestions.map((q, i) => ({
    'Sıra': i + 1,
    'Kategori': q.category || '',
    'Soru': q.question || '',
    'Model Cevap': q.model_answer || '',
    'Vocabulary Hints': (q.vocabulary_hints || []).map(v => {
      let s = v.word || '';
      if (v.meaning) s += ' - ' + v.meaning;
      if (v.example) s += ' (' + v.example + ')';
      return s;
    }).join(', ')
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // Sıra
    { wch: 20 },  // Kategori
    { wch: 50 },  // Soru
    { wch: 80 },  // Model Cevap
    { wch: 50 }   // Vocabulary
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sorular');
  XLSX.writeFile(wb, 'mulakat_sorulari.xlsx');
  showToast('Excel indirildi');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
