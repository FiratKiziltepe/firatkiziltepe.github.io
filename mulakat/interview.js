// ===== State =====
let currentInterview = null;
let conversation = []; // {role: 'ai'|'user', content: string}
let questionNum = 0;
let targetQuestionCount = 8;
let interviewTopic = '';
let interviewLang = 'en';
let isRecording = false;
let recognition = null;
let finalTranscript = '';
let interimTranscript = '';
let ttsEnabled = true;
let isSpeaking = false;

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadInterviewHistory();
  initSpeechRecognition();
});

// ===== Setup =====
async function startInterview() {
  const topic = document.getElementById('topicInput').value.trim();
  if (!topic) {
    alert('Lütfen bir mülakat konusu girin!');
    return;
  }

  if (!getGeminiKey()) {
    alert('Gemini API key ayarlanmamış. Ana sayfadaki Ayarlar\'dan API key girin.');
    return;
  }

  interviewTopic = topic;
  interviewLang = document.getElementById('langSelect').value;
  targetQuestionCount = parseInt(document.getElementById('questionCountSelect').value);
  conversation = [];
  questionNum = 0;

  // Create DB record
  try {
    currentInterview = await createAIInterview(topic);
  } catch (err) {
    alert('Mülakat oluşturulamadı: ' + err.message);
    return;
  }

  // Switch to interview screen
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('interviewScreen').classList.remove('hidden');
  document.getElementById('ttsToggleBtn').classList.remove('hidden');
  document.getElementById('chatContainer').innerHTML = '';

  // AI asks first question
  await askAI(getSystemPrompt() + '\n\nPlease introduce yourself briefly as the interviewer and ask the first interview question.');
}

function getSystemPrompt() {
  const langInstr = interviewLang === 'en'
    ? 'Conduct the entire interview in English. Ask questions in English.'
    : 'Mülakatı Türkçe olarak yürüt. Soruları Türkçe sor.';

  return `You are a professional interviewer conducting a realistic job/academic interview simulation.

**Interview Topic/Position:** ${interviewTopic}
**Target Questions:** approximately ${targetQuestionCount} questions
**Current Question Number:** ${questionNum + 1}

${langInstr}

Rules:
- Act as a real interviewer — be professional, natural, and slightly formal.
- Ask ONE question at a time. Wait for the candidate's answer before continuing.
- Based on the candidate's answer, decide whether to:
  a) Ask a follow-up question to dig deeper, OR
  b) Move on to a new topic/question
- Mix behavioral, technical, and situational questions appropriate for the role.
- Keep your responses concise (2-4 sentences max). The focus should be on the QUESTION.
- Do NOT provide feedback on answers during the interview. Save that for the end.
- Do NOT number your questions. Just ask naturally as a real interviewer would.
- If the candidate gives a very short or unclear answer, politely ask them to elaborate.`;
}

// ===== Gemini Multi-turn =====
async function askAI(prompt) {
  showTypingIndicator();
  disableInput();

  // Build messages for Gemini
  const contents = [];

  // System + conversation history
  if (conversation.length === 0) {
    // First message: system prompt is part of the first user message
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  } else {
    // Build multi-turn history
    // First: system context
    contents.push({
      role: 'user',
      parts: [{ text: getSystemPrompt() + '\n\nBegin the interview.' }]
    });

    // Then the conversation so far
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      if (i === 0) {
        // First AI response
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      } else {
        contents.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current instruction
    // The last message in conversation should be user's answer
    // Gemini needs alternating user/model, so if last was user, we don't add another user
    const lastRole = contents[contents.length - 1].role;
    if (lastRole === 'user') {
      // Already ends with user message, Gemini will respond as model
    } else {
      // Last was model (shouldn't happen normally), add prompt
      contents.push({
        role: 'user',
        parts: [{ text: 'Please continue the interview and ask the next question.' }]
      });
    }
  }

  try {
    const apiKey = getGeminiKey();
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API hatası: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Boş yanıt');

    removeTypingIndicator();
    questionNum++;

    // Add to conversation
    conversation.push({ role: 'ai', content: text });
    addChatBubble('ai', text);
    updateQuestionCounter();

    // Save to DB
    saveConversation();

    // TTS
    if (ttsEnabled) {
      speakText(text);
    }

    enableInput();
  } catch (err) {
    removeTypingIndicator();
    addChatBubble('ai', '⚠️ Hata: ' + err.message);
    enableInput();
  }
}

async function sendAnswer() {
  // Get the speech text
  const speechEl = document.getElementById('speechText');
  const text = speechEl.textContent.trim();

  if (!text || text === 'Mikrofon butonuna basarak konuşmaya başlayın veya yazın...') {
    alert('Lütfen önce cevabınızı konuşun veya yazın.');
    return;
  }

  // Stop recording if active
  if (isRecording) stopRecording();
  // Stop TTS if speaking
  if (isSpeaking) window.speechSynthesis.cancel();

  // Add user message
  conversation.push({ role: 'user', content: text });
  addChatBubble('user', text);

  // Reset speech area
  finalTranscript = '';
  interimTranscript = '';
  speechEl.textContent = 'Mikrofon butonuna basarak konuşmaya başlayın veya yazın...';
  speechEl.removeAttribute('contenteditable');
  document.getElementById('sendBtn').disabled = true;

  // Check if we should end
  if (questionNum >= targetQuestionCount) {
    await endInterview();
    return;
  }

  // Ask next question
  await askAI();
}

// ===== End Interview =====
async function endInterview() {
  if (conversation.length < 2) {
    backToSetup();
    return;
  }

  // Stop everything
  if (isRecording) stopRecording();
  if (isSpeaking) window.speechSynthesis.cancel();

  // Switch to feedback screen
  document.getElementById('interviewScreen').classList.add('hidden');
  document.getElementById('feedbackScreen').classList.remove('hidden');
  document.getElementById('feedbackSummary').textContent =
    `${interviewTopic} konusunda ${questionNum} soruluk mülakat tamamlandı.`;

  // Get feedback from Gemini
  try {
    const feedback = await getFinalFeedback();
    document.getElementById('feedbackContent').innerHTML = markdownToHtml(feedback);

    // Save to DB
    await updateAIInterview(currentInterview.id, {
      conversation: conversation,
      feedback: feedback,
      question_count: questionNum,
      status: 'completed'
    });
  } catch (err) {
    document.getElementById('feedbackContent').innerHTML =
      `<div style="color:var(--danger);">Geri bildirim alınamadı: ${escapeHtml(err.message)}</div>`;
    // Still save conversation
    try {
      await updateAIInterview(currentInterview.id, {
        conversation: conversation,
        question_count: questionNum,
        status: 'completed'
      });
    } catch (e) { console.error(e); }
  }
}

async function getFinalFeedback() {
  const apiKey = getGeminiKey();

  // Build conversation transcript
  let transcript = '';
  conversation.forEach((msg, i) => {
    const role = msg.role === 'ai' ? 'Interviewer' : 'Candidate';
    transcript += `**${role}:** ${msg.content}\n\n`;
  });

  const feedbackLang = interviewLang === 'en'
    ? 'Write your feedback in Turkish so the candidate can understand easily, but quote English examples from their answers.'
    : 'Geri bildirimi Türkçe yaz.';

  const prompt = `You are an expert interview coach. A candidate just completed a mock interview. Here is the full transcript:

**Interview Topic:** ${interviewTopic}
**Questions Asked:** ${questionNum}

--- TRANSCRIPT ---
${transcript}
--- END TRANSCRIPT ---

Please provide comprehensive feedback. ${feedbackLang}

## 📊 Genel Değerlendirme
Overall score out of 10 and brief summary.

## 📋 Soru Bazlı Analiz
For each question-answer exchange, provide brief feedback (2-3 sentences).

## ✅ Güçlü Yönler
What the candidate did well.

## ⚠️ Geliştirilmesi Gerekenler
Areas for improvement.

## 📝 Dil ve İfade Analizi
Grammar issues, vocabulary suggestions, better phrasings. Show wrong vs correct.

## 💡 İçerik ve Strateji Önerileri
Tips on content, structure (STAR method etc.), and interview strategy.

## 🚀 Aksiyon Planı
5 specific actionable tips for improvement.

Be encouraging but honest.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API hatası: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Boş yanıt';
}

// ===== Chat UI =====
function addChatBubble(role, text) {
  const container = document.getElementById('chatContainer');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-${role}`;

  const roleLabel = role === 'ai' ? '🤖 Mülakatçı' : '🗣️ Sen';

  bubble.innerHTML = `
    <div class="chat-role">${roleLabel} ${role === 'ai' ? '<button class="tts-btn chat-speak-btn" title="Seslendir">🔊</button>' : ''}</div>
    <div class="chat-msg-text">${escapeHtml(text)}</div>
  `;

  // Attach TTS click handler
  const speakBtn = bubble.querySelector('.chat-speak-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => speakText(text));
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chatContainer');
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'typingIndicator';
  typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function updateQuestionCounter() {
  document.getElementById('questionCounter').textContent = `Soru ${questionNum} / ~${targetQuestionCount}`;
}

function disableInput() {
  document.getElementById('inputArea').style.opacity = '0.5';
  document.getElementById('inputArea').style.pointerEvents = 'none';
}

function enableInput() {
  document.getElementById('inputArea').style.opacity = '1';
  document.getElementById('inputArea').style.pointerEvents = 'auto';
}

// ===== Speech Recognition =====
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    document.getElementById('micBtn').textContent = '🎤 Desteklenmiyor';
    document.getElementById('micBtn').disabled = true;
    // Allow text input instead
    const speechEl = document.getElementById('speechText');
    speechEl.setAttribute('contenteditable', 'true');
    speechEl.textContent = '';
    speechEl.setAttribute('placeholder', 'Cevabınızı buraya yazın...');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t + ' ';
      } else {
        interimTranscript += t;
      }
    }
    updateSpeechDisplay();
    document.getElementById('sendBtn').disabled = !finalTranscript.trim();
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) {
      try { recognition.start(); } catch (e) {}
    }
  };
}

function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

function startRecording() {
  if (!recognition) return;

  // Stop TTS if speaking
  if (isSpeaking) window.speechSynthesis.cancel();

  // Set language for recognition
  recognition.lang = interviewLang === 'en' ? 'en-US' : 'tr-TR';

  if (!finalTranscript.trim()) finalTranscript = '';
  interimTranscript = '';
  isRecording = true;

  const btn = document.getElementById('micBtn');
  btn.innerHTML = '<span class="recording-indicator"><span class="recording-dot"></span> Dinleniyor...</span>';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-danger');

  const speechEl = document.getElementById('speechText');
  speechEl.removeAttribute('contenteditable');
  if (!finalTranscript.trim()) speechEl.textContent = 'Dinleniyor...';

  try { recognition.start(); } catch (e) {}
}

function stopRecording() {
  isRecording = false;
  if (recognition) try { recognition.stop(); } catch (e) {}

  const btn = document.getElementById('micBtn');
  btn.innerHTML = '🎤 Konuş';
  btn.classList.remove('btn-danger');
  btn.classList.add('btn-primary');

  updateSpeechDisplay();

  // Enable editing
  if (finalTranscript.trim()) {
    const speechEl = document.getElementById('speechText');
    speechEl.setAttribute('contenteditable', 'true');
    speechEl.addEventListener('input', () => {
      finalTranscript = speechEl.textContent;
      document.getElementById('sendBtn').disabled = !finalTranscript.trim();
    });
    document.getElementById('sendBtn').disabled = false;
  }
}

function updateSpeechDisplay() {
  const el = document.getElementById('speechText');
  if (finalTranscript || interimTranscript) {
    el.innerHTML = escapeHtml(finalTranscript) +
      (interimTranscript ? `<span style="color:var(--text-muted);font-style:italic;">${escapeHtml(interimTranscript)}</span>` : '');
  } else if (isRecording) {
    el.textContent = 'Dinleniyor...';
  } else {
    el.textContent = 'Mikrofon butonuna basarak konuşmaya başlayın veya yazın...';
  }
}

// ===== Text-to-Speech =====
function speakText(text) {
  if (!ttsEnabled || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = interviewLang === 'en' ? 'en-US' : 'tr-TR';
  utterance.rate = 0.95;
  utterance.pitch = 1;

  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = interviewLang === 'en' ? 'en' : 'tr';
  const preferred = voices.find(v => v.lang.startsWith(langCode) && v.name.includes('Google'));
  const fallback = voices.find(v => v.lang.startsWith(langCode));
  if (preferred) utterance.voice = preferred;
  else if (fallback) utterance.voice = fallback;

  utterance.onstart = () => { isSpeaking = true; };
  utterance.onend = () => { isSpeaking = false; };
  utterance.onerror = () => { isSpeaking = false; };

  window.speechSynthesis.speak(utterance);
}

function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  const btn = document.getElementById('ttsToggleBtn');
  btn.textContent = ttsEnabled ? '🔊' : '🔇';
  btn.title = ttsEnabled ? 'Sesli yanıt açık' : 'Sesli yanıt kapalı';
  if (!ttsEnabled && isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
}

// Preload voices
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// ===== Save Conversation =====
async function saveConversation() {
  if (!currentInterview) return;
  try {
    await updateAIInterview(currentInterview.id, {
      conversation: conversation,
      question_count: questionNum
    });
  } catch (e) {
    console.error('Save error:', e);
  }
}

// ===== Navigation =====
function backToSetup() {
  document.getElementById('interviewScreen').classList.add('hidden');
  document.getElementById('feedbackScreen').classList.add('hidden');
  document.getElementById('setupScreen').classList.remove('hidden');
  document.getElementById('ttsToggleBtn').classList.add('hidden');
  document.getElementById('chatContainer').innerHTML = '';

  if (isSpeaking) window.speechSynthesis.cancel();
  if (isRecording) stopRecording();

  currentInterview = null;
  conversation = [];
  questionNum = 0;

  loadInterviewHistory();
}

// ===== History =====
async function loadInterviewHistory() {
  const container = document.getElementById('interviewHistory');
  try {
    const interviews = await fetchAIInterviews();
    if (interviews.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-state-icon">📭</div><div class="empty-state-text">Henüz AI mülakat yapılmamış</div></div>';
      return;
    }

    container.innerHTML = interviews.map(iv => {
      const date = new Date(iv.created_at).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const statusBadge = iv.status === 'completed'
        ? '<span class="badge badge-success">Tamamlandı</span>'
        : '<span class="badge badge-warning">Devam ediyor</span>';

      return `
        <div class="history-item">
          <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(iv.topic)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${date} · ${iv.question_count || 0} soru ${statusBadge}</div>
          </div>
          <div style="display:flex;gap:6px;">
            ${iv.status === 'completed' && iv.feedback ? `<button class="btn btn-ghost btn-sm" onclick="viewInterview('${iv.id}')" title="Görüntüle">👁️</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="removeInterview('${iv.id}')" title="Sil">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="text-muted">Yüklenemedi</div></div>';
  }
}

async function viewInterview(id) {
  try {
    const interviews = await fetchAIInterviews();
    const iv = interviews.find(i => i.id === id);
    if (!iv) return;

    // Show feedback screen with saved data
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('feedbackScreen').classList.remove('hidden');
    document.getElementById('feedbackSummary').textContent =
      `${iv.topic} konusunda ${iv.question_count} soruluk mülakat.`;
    document.getElementById('feedbackContent').innerHTML = markdownToHtml(iv.feedback || 'Geri bildirim yok.');
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

async function removeInterview(id) {
  if (!confirm('Bu mülakatı silmek istediğinize emin misiniz?')) return;
  try {
    await deleteAIInterview(id);
    showToast('Mülakat silindi');
    loadInterviewHistory();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

// ===== Utility =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
