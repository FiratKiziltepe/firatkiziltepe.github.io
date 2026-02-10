document.addEventListener('DOMContentLoaded', loadHistory);

async function loadHistory() {
  const container = document.getElementById('historyContainer');

  try {
    const sessions = await fetchPracticeHistory();

    if (sessions.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Henüz pratik geçmişi yok</div><a href="practice.html" class="btn btn-primary mt-16">Pratik Yapmaya Başla</a></div>';
      return;
    }

    container.innerHTML = sessions.map((session, idx) => {
      const date = new Date(session.session_date || session.created_at);
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const answers = session.answers || [];

      return `
        <div class="history-card">
          <div class="history-header" onclick="toggleHistory(this)">
            <div>
              <div class="history-date">${dateStr}</div>
              <div class="history-meta">${session.answered_count || answers.length} / ${session.total_questions || '?'} soru cevaplandı</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); deleteSession('${session.id}')" title="Sil">🗑️</button>
              <span style="color:var(--text-muted);">▼</span>
            </div>
          </div>
          <div class="history-body" id="history-${idx}">
            ${answers.map((a, i) => `
              <div class="history-qa">
                <div class="history-qa-question">Soru ${i + 1}: ${escapeHtml(a.question)}</div>
                <div class="history-qa-label">Konuşmanız</div>
                <div class="history-qa-text">${escapeHtml(a.user_speech)}</div>
                <div class="history-qa-label">Model Cevap</div>
                <div class="history-qa-text" style="color:var(--text-secondary);">${escapeHtml(a.model_answer)}</div>
              </div>
            `).join('')}

            ${session.feedback ? `
              <div class="history-feedback">
                <div class="history-feedback-title">🤖 Gemini Geri Bildirimi</div>
                <div style="font-size:0.9rem;line-height:1.7;">${markdownToHtml(session.feedback)}</div>
              </div>
            ` : '<div class="text-muted" style="font-size:0.85rem;padding:8px 0;">Geri bildirim alınmamış</div>'}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Geçmiş yüklenemedi</div></div>';
  }
}

function toggleHistory(header) {
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

async function deleteSession(id) {
  if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
  try {
    await deletePracticeSession(id);
    showToast('Kayıt silindi');
    loadHistory();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
