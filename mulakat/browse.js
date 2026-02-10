let allQuestions = [];

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

  container.innerHTML = questions.map((q, i) => `
    <div class="question-card">
      <div class="question-card-header" onclick="toggleCard(this)">
        <div>
          <div class="question-number">Soru ${i + 1}</div>
          <div class="question-text">${escapeHtml(q.question)}</div>
        </div>
        <span class="badge question-category">${escapeHtml(q.category)}</span>
      </div>
      <div class="question-card-body">
        <div class="answer-section">
          <div class="answer-label">Model Cevap</div>
          <div class="answer-text">${escapeHtml(q.model_answer)}</div>
        </div>
        ${renderVocab(q.vocabulary_hints)}
      </div>
    </div>
  `).join('');
}

function renderVocab(hints) {
  if (!hints || hints.length === 0) return '';
  return `
    <div class="vocab-section">
      <button class="vocab-toggle" onclick="event.stopPropagation(); this.nextElementSibling.classList.toggle('open')">
        📚 Vocabulary & Collocations (${hints.length})
      </button>
      <div class="vocab-list">
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
