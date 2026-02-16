let questions = [];
let currentIndex = 0;
let isShuffled = false;
let isRecording = false;
let recognition = null;
let finalTranscript = '';
let interimTranscript = '';

// Batch: stores user speech per question index
let answeredQuestions = {}; // { questionIndex: { question, model_answer, user_speech } }

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    questions = await fetchQuestions();

    document.getElementById('loadingState').classList.add('hidden');

    if (questions.length === 0) {
      document.getElementById('emptyState').classList.remove('hidden');
      return;
    }

    document.getElementById('practiceArea').classList.remove('hidden');
    document.getElementById('batchTotal').textContent = questions.length;
    initSpeechRecognition();
    showQuestion();
  } catch (err) {
    console.error(err);
    document.getElementById('loadingState').innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Sorular yüklenemedi</div></div>';
  }
}

// ===== Speech Recognition =====
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    document.getElementById('micBtn').textContent = '🎤 Desteklenmiyor';
    document.getElementById('micBtn').disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    updateSpeechDisplay();
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    if (event.error === 'no-speech') return;
    stopRecording();
    showToast('Mikrofon hatası: ' + event.error);
  };

  recognition.onend = () => {
    if (isRecording) {
      try { recognition.start(); } catch (e) {}
    }
  };
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  if (!recognition) {
    showToast('Konuşma tanıma bu tarayıcıda desteklenmiyor');
    return;
  }

  // If resuming, keep existing text
  if (!finalTranscript.trim()) {
    finalTranscript = '';
  }
  interimTranscript = '';
  isRecording = true;

  const btn = document.getElementById('micBtn');
  btn.innerHTML = '<span class="recording-indicator"><span class="recording-dot"></span> Dinleniyor...</span>';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-danger');

  // Disable editing while recording
  const speechEl = document.getElementById('speechText');
  speechEl.removeAttribute('contenteditable');
  document.getElementById('editHint').classList.add('hidden');
  document.getElementById('editableHint').classList.add('hidden');

  if (!finalTranscript.trim()) {
    speechEl.textContent = 'Dinleniyor...';
  }

  try {
    recognition.start();
  } catch (e) {
    console.error(e);
  }
}

function stopRecording() {
  isRecording = false;

  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }

  const btn = document.getElementById('micBtn');
  btn.innerHTML = '🎤 Konuşmaya Başla';
  btn.classList.remove('btn-danger');
  btn.classList.add('btn-primary');

  updateSpeechDisplay();

  // Enable editing if there is speech
  if (finalTranscript.trim()) {
    makeEditable();
    saveCurrentAnswer();
  }
}

function makeEditable() {
  const speechEl = document.getElementById('speechText');
  speechEl.setAttribute('contenteditable', 'true');
  document.getElementById('editHint').classList.remove('hidden');
  document.getElementById('editableHint').classList.remove('hidden');

  // Save edits on blur/input
  speechEl.addEventListener('input', onSpeechEdit);
}

function onSpeechEdit() {
  finalTranscript = document.getElementById('speechText').textContent;
  saveCurrentAnswer();
}

function updateSpeechDisplay() {
  const el = document.getElementById('speechText');
  if (finalTranscript || interimTranscript) {
    el.innerHTML = escapeHtml(finalTranscript) +
      (interimTranscript ? `<span style="color:var(--text-muted);font-style:italic;">${escapeHtml(interimTranscript)}</span>` : '');
  } else if (isRecording) {
    el.textContent = 'Dinleniyor...';
  } else {
    el.textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';
  }
}

// ===== Answer Tracking =====
function saveCurrentAnswer() {
  const speech = finalTranscript.trim();
  if (!speech) return;

  const q = questions[currentIndex];
  answeredQuestions[currentIndex] = {
    question: q.question,
    model_answer: q.model_answer,
    user_speech: speech
  };

  updateBatchUI();
}

function updateBatchUI() {
  const count = Object.keys(answeredQuestions).length;
  document.getElementById('batchCount').textContent = count;
  document.getElementById('batchFeedbackBtn').disabled = count === 0;

  const badge = document.getElementById('answeredBadge');
  if (count > 0) {
    badge.classList.remove('hidden');
    document.getElementById('answeredCount').textContent = count;
  } else {
    badge.classList.add('hidden');
  }
}

// ===== Question Display =====
function showQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  document.getElementById('counter').textContent = `${currentIndex + 1} / ${questions.length}`;
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('answerText').textContent = q.model_answer;

  // Hide answer
  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('showAnswerBtn').classList.remove('hidden');

  // Restore previous speech if exists
  const speechEl = document.getElementById('speechText');
  speechEl.removeAttribute('contenteditable');
  document.getElementById('editHint').classList.add('hidden');
  document.getElementById('editableHint').classList.add('hidden');

  if (isRecording) stopRecording();

  if (answeredQuestions[currentIndex]) {
    finalTranscript = answeredQuestions[currentIndex].user_speech;
    speechEl.textContent = finalTranscript;
    makeEditable();
  } else {
    finalTranscript = '';
    interimTranscript = '';
    speechEl.textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';
  }

  // Vocabulary
  renderVocabHints(q.vocabulary_hints);

  // Nav buttons
  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === questions.length - 1;

  updateBatchUI();
}

function renderVocabHints(hints) {
  const area = document.getElementById('vocabArea');
  const list = document.getElementById('vocabList');

  if (!hints || hints.length === 0) {
    area.classList.add('hidden');
    return;
  }

  area.classList.remove('hidden');
  document.getElementById('vocabCount').textContent = hints.length;
  list.classList.remove('open');

  list.innerHTML = hints.map(h => `
    <div class="vocab-item">
      <span class="vocab-word">${escapeHtml(h.word)}</span>
      <span class="vocab-meaning">${escapeHtml(h.meaning)}</span>
      ${h.example ? `<span class="vocab-example">"${escapeHtml(h.example)}"</span>` : ''}
    </div>
  `).join('');
}

// ===== Actions =====
function showModelAnswer() {
  document.getElementById('answerArea').classList.remove('hidden');
  document.getElementById('showAnswerBtn').classList.add('hidden');
  document.getElementById('answerArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function requestBatchFeedback() {
  const answered = Object.values(answeredQuestions);
  if (answered.length === 0) {
    showToast('Önce en az bir soruyu cevaplayın');
    return;
  }

  if (!getGeminiKey()) {
    showToast('Gemini API key ayarlanmamış. Ana sayfadan ayarlayın.');
    return;
  }

  const feedbackArea = document.getElementById('feedbackArea');
  const feedbackContent = document.getElementById('feedbackContent');
  const feedbackBtn = document.getElementById('batchFeedbackBtn');

  feedbackArea.classList.remove('hidden');
  feedbackContent.innerHTML = '<div class="feedback-loading"><div class="spinner"></div><br>Toplu geri bildirim hazırlanıyor...</div>';
  feedbackBtn.disabled = true;
  feedbackBtn.textContent = '⏳ Analiz ediliyor...';

  try {
    const feedback = await getBatchFeedback(answered);
    feedbackContent.innerHTML = markdownToHtml(feedback);

    // Save to Supabase
    try {
      await savePracticeSession({
        answers: answered,
        feedback: feedback,
        total_questions: questions.length,
        answered_count: answered.length
      });
      showToast('Geri bildirim kaydedildi');
    } catch (saveErr) {
      console.error('Save error:', saveErr);
    }
  } catch (err) {
    feedbackContent.innerHTML = `<div style="color:var(--danger);">Hata: ${escapeHtml(err.message)}</div>`;
  } finally {
    feedbackBtn.disabled = false;
    feedbackBtn.textContent = '🤖 Toplu Geri Bildirim Al';
  }

  feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Navigation =====
function nextQuestion() {
  // Save current speech before navigating
  if (finalTranscript.trim()) {
    saveCurrentAnswer();
  }

  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevQuestion() {
  if (finalTranscript.trim()) {
    saveCurrentAnswer();
  }

  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function resetCurrent() {
  finalTranscript = '';
  interimTranscript = '';
  if (isRecording) stopRecording();

  // Remove from answered
  delete answeredQuestions[currentIndex];

  const speechEl = document.getElementById('speechText');
  speechEl.textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';
  speechEl.removeAttribute('contenteditable');
  document.getElementById('editHint').classList.add('hidden');
  document.getElementById('editableHint').classList.add('hidden');

  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('showAnswerBtn').classList.remove('hidden');

  updateBatchUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleShuffle() {
  isShuffled = !isShuffled;
  const btn = document.getElementById('shuffleBtn');

  // Clear answered since indices change
  answeredQuestions = {};

  if (isShuffled) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    btn.style.background = 'var(--primary-light)';
    showToast('Sorular karıştırıldı');
  } else {
    questions.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    btn.style.background = '';
    showToast('Sıralama sıfırlandı');
  }

  currentIndex = 0;
  document.getElementById('feedbackArea').classList.add('hidden');
  showQuestion();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
