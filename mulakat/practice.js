let questions = [];
let currentIndex = 0;
let isShuffled = false;
let isRecording = false;
let recognition = null;
let finalTranscript = '';
let interimTranscript = '';

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
      // Auto-restart if still in recording mode
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

  finalTranscript = '';
  interimTranscript = '';
  isRecording = true;

  const btn = document.getElementById('micBtn');
  btn.innerHTML = '<span class="recording-indicator"><span class="recording-dot"></span> Dinleniyor...</span>';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-danger');

  document.getElementById('speechText').textContent = 'Dinleniyor...';

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

  // Show feedback button if there's speech
  if (finalTranscript.trim()) {
    document.getElementById('feedbackBtn').classList.remove('hidden');
  }
}

function updateSpeechDisplay() {
  const el = document.getElementById('speechText');
  if (finalTranscript || interimTranscript) {
    el.innerHTML = escapeHtml(finalTranscript) +
      (interimTranscript ? `<span class="interim" style="color:var(--text-muted);font-style:italic;">${escapeHtml(interimTranscript)}</span>` : '');
  } else if (isRecording) {
    el.textContent = 'Dinleniyor...';
  } else {
    el.textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';
  }
}

// ===== Question Display =====
function showQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  document.getElementById('counter').textContent = `${currentIndex + 1} / ${questions.length}`;
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('answerText').textContent = q.model_answer;

  // Hide answer and feedback
  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('feedbackArea').classList.add('hidden');
  document.getElementById('feedbackBtn').classList.add('hidden');
  document.getElementById('showAnswerBtn').classList.remove('hidden');

  // Reset speech
  finalTranscript = '';
  interimTranscript = '';
  if (isRecording) stopRecording();
  document.getElementById('speechText').textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';

  // Vocabulary
  renderVocabHints(q.vocabulary_hints);

  // Nav buttons
  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === questions.length - 1;
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

  // Smooth scroll to answer
  document.getElementById('answerArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function requestFeedback() {
  const speech = finalTranscript.trim();
  if (!speech) {
    showToast('Önce konuşmanız gerekiyor');
    return;
  }

  if (!getGeminiKey()) {
    showToast('Gemini API key ayarlanmamış. Ana sayfadan ayarlayın.');
    return;
  }

  const q = questions[currentIndex];
  const feedbackArea = document.getElementById('feedbackArea');
  const feedbackContent = document.getElementById('feedbackContent');

  feedbackArea.classList.remove('hidden');
  feedbackContent.innerHTML = '<div class="feedback-loading"><div class="spinner"></div><br>Geri bildirim hazırlanıyor...</div>';

  // Show answer too
  document.getElementById('answerArea').classList.remove('hidden');
  document.getElementById('showAnswerBtn').classList.add('hidden');

  try {
    const feedback = await getGeminiFeedback(speech, q.model_answer, q.question);
    feedbackContent.innerHTML = markdownToHtml(feedback);
  } catch (err) {
    feedbackContent.innerHTML = `<div style="color:var(--danger);">Hata: ${escapeHtml(err.message)}</div>`;
  }

  feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Navigation =====
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    showQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevQuestion() {
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
  document.getElementById('speechText').textContent = 'Konuşmaya başlamak için mikrofon butonuna basın...';
  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('feedbackArea').classList.add('hidden');
  document.getElementById('feedbackBtn').classList.add('hidden');
  document.getElementById('showAnswerBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleShuffle() {
  isShuffled = !isShuffled;
  const btn = document.getElementById('shuffleBtn');

  if (isShuffled) {
    // Fisher-Yates shuffle
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
  showQuestion();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
