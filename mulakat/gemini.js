// Gemini 3.1 Flash Lite (Preview) API Integration
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

function getGeminiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

async function getGeminiFeedback(userSpeech, modelAnswer, question) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key ayarlanmamış. Ana sayfadaki Ayarlar\'dan API key girin.');
  }

  const prompt = `You are an English interview coach helping a non-native English speaker prepare for an academic/professional interview.

**Interview Question:** ${question}

**Model Answer (ideal response):** ${modelAnswer}

**Candidate's Spoken Answer:** ${userSpeech}

Please analyze the candidate's answer and provide detailed feedback in the following format. Write your feedback in Turkish so the candidate can understand easily:

## 📊 Genel Değerlendirme
Give an overall score out of 10 and a brief summary.

## ✅ İyi Yönler
List what the candidate did well (content, structure, vocabulary).

## ⚠️ Geliştirilmesi Gerekenler
List areas for improvement.

## 📝 Gramer ve Dil Hataları
Point out specific grammar mistakes, pronunciation issues, or awkward phrasing. Show the wrong version and the correct version.

## 💡 Kelime ve İfade Önerileri
Suggest better vocabulary, collocations, or phrases the candidate could use. Give example sentences.

## 🎯 İçerik Karşılaştırması
Compare the key points in the model answer with what the candidate said. Note any missing important points.

Be encouraging but honest. The goal is to help the candidate improve their English speaking skills for interviews.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API hatası: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API boş yanıt döndürdü.');
  }

  return text;
}

// ===== Batch Feedback (multiple questions at once) =====
async function getBatchFeedback(answeredQuestions) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key ayarlanmamış. Ana sayfadaki Ayarlar\'dan API key girin.');
  }

  // Build Q&A pairs text
  let qaPairs = '';
  answeredQuestions.forEach((item, i) => {
    qaPairs += `
--- Soru ${i + 1} ---
**Interview Question:** ${item.question}
**Model Answer:** ${item.model_answer}
**Candidate's Answer:** ${item.user_speech}
`;
  });

  const prompt = `You are an English interview coach helping a non-native English speaker prepare for an academic/professional interview.

The candidate has answered ${answeredQuestions.length} interview questions. Here are all the question-answer pairs:

${qaPairs}

Please analyze ALL of the candidate's answers together and provide comprehensive feedback. Write your feedback in Turkish so the candidate can understand easily:

## 📊 Genel Değerlendirme
Give an overall score out of 10 across all questions. Summarize the candidate's general performance.

## 📋 Soru Bazlı Değerlendirme
For each question, give a brief assessment (2-3 sentences): what was good, what was missing compared to the model answer.

## ✅ Güçlü Yönler
List the candidate's strengths across all answers (content coverage, structure, vocabulary usage).

## ⚠️ Geliştirilmesi Gerekenler
List common weaknesses and areas for improvement across all answers.

## 📝 Gramer ve Dil Hataları
Point out specific grammar mistakes, awkward phrasing across all answers. Show wrong vs correct versions.

## 💡 Kelime ve İfade Önerileri
Suggest better vocabulary, collocations, or academic phrases the candidate should learn. Give example sentences for each.

## 🎯 Eksik Noktalar
List important points from model answers that the candidate missed.

## 🚀 Öneri ve Aksiyon Planı
Give 3-5 specific actionable tips for the candidate to improve their interview performance.

Be encouraging but honest. The goal is to help the candidate improve their English speaking skills for interviews.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16384
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API hatası: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API boş yanıt döndürdü.');
  }

  return text;
}

// Simple markdown to HTML converter for feedback display
function markdownToHtml(md) {
  if (!md) return '';
  return md
    // Headers
    .replace(/^## (.*$)/gm, '<h3 style="margin:16px 0 8px;font-size:1rem;">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 style="margin:16px 0 8px;font-size:1.1rem;">$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code style="background:var(--surface-hover);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
    // Unordered list
    .replace(/^- (.*$)/gm, '<li style="margin-left:16px;margin-bottom:4px;">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
