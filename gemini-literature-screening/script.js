// ============================================================
// GEMINI LITERATURE SCREENING — v7
// Sync + Async Batch API · Multi-model · Cost panel · Resume
// ============================================================

// USD / 1M token (≤200k prompt, official ai.google.dev/gemini-api/docs/pricing)
const MODELS = {
  "gemini-3.1-pro-preview": {
    label: "Gemini 3.1 Pro (Preview)",
    standard: { inputPrice: 2.00, outputPrice: 12.00 },
    batch:    { inputPrice: 1.00, outputPrice: 6.00 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 0, rpd: 0, tpm: 0
  },
  "gemini-3.1-flash-lite-preview": {
    label: "Gemini 3.1 Flash Lite (Preview)",
    standard: { inputPrice: 0.25, outputPrice: 1.50 },
    batch:    { inputPrice: 0.125, outputPrice: 0.75 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 500, tpm: 250000
  },
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    standard: { inputPrice: 0.30, outputPrice: 2.50 },
    batch:    { inputPrice: 0.15, outputPrice: 1.25 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 5, rpd: 20, tpm: 250000
  },
  "gemini-2.5-flash-lite": {
    label: "Gemini 2.5 Flash Lite",
    standard: { inputPrice: 0.10, outputPrice: 0.40 },
    batch:    { inputPrice: 0.05, outputPrice: 0.20 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 10, rpd: 20, tpm: 250000
  }
};

const STATE_KEY = 'gls_state_v7';
const KEY_KEY = 'gls_apikey_v7';

// Global state
let state = {
  csvData: [],
  results: [],
  apiKey: '',
  modelId: 'gemini-3.1-flash-lite-preview',
  mode: 'sync',
  fileHash: '',
  totalCount: 0,
  lastProcessedBatchIndex: -1,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCostUSD: 0,
  // async-only
  batchJobName: '',
  batchSubmittedAt: 0,
  batchLastState: '',
  batchKeyMap: {} // key -> originalArticle
};

let analyzing = false;
let pollAbortController = null;

// ============================================================
// DOM REFERENCES
// ============================================================
const el = {
  apiKey: document.getElementById('apiKey'),
  modelSelect: document.getElementById('modelSelect'),
  batchSize: document.getElementById('batchSize'),
  batchSizeGroup: document.getElementById('batchSizeGroup'),
  delayBetweenBatches: document.getElementById('delayBetweenBatches'),
  delaySettingsGroup: document.getElementById('delaySettingsGroup'),
  inclusion: document.getElementById('inclusionCriteria'),
  exclusion: document.getElementById('exclusionCriteria'),
  csvFile: document.getElementById('csvFile'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  downloadCsvBtn: document.getElementById('downloadCsvBtn'),
  downloadExcelBtn: document.getElementById('downloadExcelBtn'),
  progressSection: document.getElementById('progressSection'),
  progressBar: document.getElementById('progressBar'),
  progressText: document.getElementById('progressText'),
  resultsSection: document.getElementById('resultsSection'),
  resultsBody: document.getElementById('resultsBody'),
  modelInfo: document.getElementById('modelInfo'),
  rpmLimit: document.getElementById('rpmLimit'),
  rpdLimit: document.getElementById('rpdLimit'),
  tpmLimit: document.getElementById('tpmLimit'),
  dailyCapacity: document.getElementById('dailyCapacity'),
  costEstimatePanel: document.getElementById('costEstimatePanel'),
  estTotalArticles: document.getElementById('estTotalArticles'),
  estInputTokens: document.getElementById('estInputTokens'),
  estOutputTokens: document.getElementById('estOutputTokens'),
  estSyncCost: document.getElementById('estSyncCost'),
  estBatchCost: document.getElementById('estBatchCost'),
  freeTierNote: document.getElementById('freeTierNote'),
  livMode: document.getElementById('livMode'),
  livInputTokens: document.getElementById('livInputTokens'),
  livOutputTokens: document.getElementById('livOutputTokens'),
  livCost: document.getElementById('livCost'),
  livFreeTier: document.getElementById('livFreeTier'),
  filterDecision: document.getElementById('filterDecision'),
  filterSearch: document.getElementById('filterSearch'),
  filterCount: document.getElementById('filterCount'),
  resumeBanner: document.getElementById('resumeBanner'),
  resumeText: document.getElementById('resumeText'),
  resumeBtn: document.getElementById('resumeBtn'),
  discardBtn: document.getElementById('discardBtn'),
  batchJobInfo: document.getElementById('batchJobInfo'),
  batchJobName: document.getElementById('batchJobName'),
  batchJobState: document.getElementById('batchJobState'),
  includeCount: document.getElementById('includeCount'),
  excludeCount: document.getElementById('excludeCount'),
  uncertainCount: document.getElementById('uncertainCount'),
  reviewCount: document.getElementById('reviewCount'),
  totalCount: document.getElementById('totalCount')
};

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // API key sadece sessionStorage
  const savedKey = sessionStorage.getItem(KEY_KEY);
  if (savedKey) el.apiKey.value = savedKey;

  // Kriterler localStorage'da kalabilir (hassas değil)
  const savedInc = localStorage.getItem('gls_inclusion');
  if (savedInc) el.inclusion.value = savedInc;
  const savedExc = localStorage.getItem('gls_exclusion');
  if (savedExc) el.exclusion.value = savedExc;

  const savedModel = localStorage.getItem('gls_model');
  if (savedModel && MODELS[savedModel]) el.modelSelect.value = savedModel;
  state.modelId = el.modelSelect.value;

  const savedMode = localStorage.getItem('gls_mode');
  if (savedMode) {
    const radio = document.querySelector(`input[name="mode"][value="${savedMode}"]`);
    if (radio) radio.checked = true;
    state.mode = savedMode;
  }

  updateModelInfo();
  updateModeUI();
  loadResumeState();
});

el.apiKey.addEventListener('change', () => {
  const k = el.apiKey.value.trim();
  if (k) sessionStorage.setItem(KEY_KEY, k);
});
el.inclusion.addEventListener('change', () => localStorage.setItem('gls_inclusion', el.inclusion.value));
el.exclusion.addEventListener('change', () => localStorage.setItem('gls_exclusion', el.exclusion.value));
el.modelSelect.addEventListener('change', () => {
  state.modelId = el.modelSelect.value;
  localStorage.setItem('gls_model', state.modelId);
  updateModelInfo();
  updateCostEstimate();
});
document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    state.mode = document.querySelector('input[name="mode"]:checked').value;
    localStorage.setItem('gls_mode', state.mode);
    updateModeUI();
    updateCostEstimate();
  });
});
el.batchSize.addEventListener('input', updateCostEstimate);

// ============================================================
// MODEL INFO + MODE UI
// ============================================================
function updateModelInfo() {
  const m = MODELS[state.modelId];
  el.rpmLimit.textContent = m.rpm > 0 ? m.rpm : 'Paid tier gerekli';
  el.rpdLimit.textContent = m.rpd > 0 ? m.rpd.toLocaleString() : 'Paid tier gerekli';
  el.tpmLimit.textContent = m.tpm === Infinity ? 'Sınırsız' : (m.tpm > 0 ? (m.tpm/1000) + 'K' : '-');

  const batchSize = parseInt(el.batchSize.value) || 5;
  if (m.rpd > 0) {
    const dailyCap = m.rpd * batchSize;
    el.dailyCapacity.textContent = `~${dailyCap.toLocaleString()} makale/gün (sync)`;
  } else {
    el.dailyCapacity.textContent = 'Async ile sınırsız';
  }

  const tierInfo = m.freeTierAvailable
    ? '✓ Free Tier mevcut (RPD limitine kadar ücretsiz)'
    : '⚠️ Sadece Paid tier — ücret uygulanır';
  el.modelInfo.textContent = tierInfo;
}

function updateModeUI() {
  const isSync = state.mode === 'sync';
  el.batchSizeGroup.style.display = isSync ? 'block' : 'none';
  el.delaySettingsGroup.style.display = isSync ? 'block' : 'none';
}

// ============================================================
// CRITERIA NUMBERING & PROMPT BUILDING
// ============================================================
function getCriteriaCodes() {
  const ic = el.inclusion.value.split('\n').map(s => s.trim()).filter(Boolean);
  const ec = el.exclusion.value.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    inclusion: ic.map((text, i) => ({ code: `IC${i+1}`, text })),
    exclusion: ec.map((text, i) => ({ code: `EC${i+1}`, text }))
  };
}

function buildSystemInstructions() {
  const { inclusion, exclusion } = getCriteriaCodes();
  const sys = document.getElementById('systemPrompt').value;

  let txt = sys + '\n\n---\n\n## ✅ Dahil Etme Ölçütleri (IC):\n';
  inclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });

  txt += '\n## ❌ Hariç Tutma Ölçütleri (EC):\n';
  exclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });

  txt += `\n---\n\n## ÇIKTI FORMATI

Sadece şu JSON'u döndür (başka açıklama yok):

\`\`\`json
{
  "results": [
    {
      "id": "<verilen id>",
      "summary_tr": "<Türkçe özet>",
      "decision": "Include | Exclude | Uncertain",
      "confidence": 0.85,
      "matched_inclusion_criteria": ["IC1"],
      "matched_exclusion_criteria": [],
      "needs_human_review": false,
      "rationale": "<gerekçe, IC/EC kodlarına atıf yap>"
    }
  ]
}
\`\`\`

KURALLAR:
- "Maybe" YOK, "Uncertain" kullan
- confidence < 0.7 ise needs_human_review=true
- Title, Abstract, Authors, Year alanlarını ASLA tekrarlama (token tasarrufu)
- decision="Exclude" ise matched_exclusion_criteria boş olamaz
- decision="Include" ise matched_inclusion_criteria boş olamaz`;

  return txt;
}

function buildBatchPrompt(articles, instructions) {
  let p = instructions + '\n\n---\n\n## DEĞERLENDİRİLECEK MAKALELER:\n\n';
  articles.forEach(a => {
    p += `### id: ${a.ID}\n`;
    p += `Başlık: ${a.Title}\n`;
    if (a.Year) p += `Yıl: ${a.Year}\n`;
    p += `Özet: ${a.Abstract}\n\n`;
  });
  p += `\nLütfen yukarıdaki ${articles.length} makale için JSON array döndür. Her makale için ayrı bir results öğesi olsun.`;
  return p;
}

// ============================================================
// CSV/TSV/Excel PARSING — RFC 4180 + auto-delimiter
// ============================================================
function detectDelimiter(text) {
  const firstLine = text.split('\n')[0] || '';
  const counts = {
    '\t': (firstLine.match(/\t/g) || []).length,
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length
  };
  let max = 0, best = '\t';
  for (const d in counts) {
    if (counts[d] > max) { max = counts[d]; best = d; }
  }
  return best;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const delimiter = detectDelimiter(text);

  // Multi-line aware splitter (handles quoted newlines)
  const rawRows = [];
  let buf = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    if (ch === '\n' && !inQ) {
      if (buf.trim()) rawRows.push(buf);
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) rawRows.push(buf);

  if (rawRows.length < 2) return [];

  const headers = parseCSVLine(rawRows[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const idx = {
    id: headers.findIndex(h => h.toLowerCase() === 'id'),
    title: headers.findIndex(h => h.toLowerCase() === 'title'),
    abstract: headers.findIndex(h => h.toLowerCase() === 'abstract'),
    authors: headers.findIndex(h => h.toLowerCase() === 'authors' || h.toLowerCase() === 'author'),
    year: headers.findIndex(h => h.toLowerCase().includes('year'))
  };

  if (idx.title === -1 || idx.abstract === -1) {
    throw new Error('Dosya "Title" ve "Abstract" sütunlarını içermelidir!');
  }

  const data = [];
  for (let i = 1; i < rawRows.length; i++) {
    const v = parseCSVLine(rawRows[i], delimiter);
    const row = {
      ID: idx.id !== -1 && v[idx.id] ? v[idx.id].trim() : String(i),
      Title: v[idx.title] ? v[idx.title].trim() : '',
      Abstract: v[idx.abstract] ? v[idx.abstract].trim() : '',
      Authors: idx.authors !== -1 && v[idx.authors] ? v[idx.authors].trim() : '',
      Year: idx.year !== -1 && v[idx.year] ? v[idx.year].trim() : ''
    };
    if (row.Title || row.Abstract) data.push(row);
  }
  return data;
}

function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);
  if (!json.length) return [];

  const headers = Object.keys(json[0]);
  const findKey = pred => headers.find(h => pred(h.toLowerCase().trim()));
  const idK = findKey(h => h === 'id');
  const tiK = findKey(h => h === 'title');
  const abK = findKey(h => h === 'abstract');
  const auK = findKey(h => h === 'authors' || h === 'author');
  const yrK = findKey(h => h.includes('year'));

  if (!tiK || !abK) {
    throw new Error(`Excel "Title" ve "Abstract" sütunlarını içermelidir!\nMevcut: ${headers.slice(0,10).join(', ')}`);
  }

  return json.map((row, i) => ({
    ID: idK ? String(row[idK] || (i+1)) : String(i+1),
    Title: String(row[tiK] || '').trim(),
    Abstract: String(row[abK] || '').trim(),
    Authors: auK ? String(row[auK] || '').trim() : '',
    Year: yrK ? String(row[yrK] || '').trim() : ''
  })).filter(r => r.Title || r.Abstract);
}

// ============================================================
// FILE UPLOAD HANDLER
// ============================================================
el.csvFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      state.csvData = parseExcel(await file.arrayBuffer());
    } else {
      state.csvData = parseCSV(await file.text());
    }
    if (!state.csvData.length) throw new Error('Dosya boş!');

    state.totalCount = state.csvData.length;
    state.fileHash = await hashString(JSON.stringify(state.csvData.map(a => a.ID + a.Title)));

    showSuccess(`${state.csvData.length} makale yüklendi.`);
    el.analyzeBtn.disabled = false;
    updateCostEstimate();
  } catch (err) {
    showError(err.message);
    el.analyzeBtn.disabled = true;
  }
});

async function hashString(s) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ============================================================
// COST ESTIMATION (PRE-ANALYSIS)
// ============================================================
function estimateTokens(text) {
  // ~4 chars/token rough estimate
  return Math.ceil(text.length / 4);
}

function updateCostEstimate() {
  if (!state.csvData.length) {
    el.costEstimatePanel.style.display = 'none';
    return;
  }
  const m = MODELS[state.modelId];
  const instructions = buildSystemInstructions();
  const instructionTokens = estimateTokens(instructions);

  // sync mode: instruction sent per batch (not per article); async: per request (per article in JSONL)
  const batchSize = parseInt(el.batchSize.value) || 5;
  const avgArticleTokens = state.csvData.reduce((s, a) =>
    s + estimateTokens(a.Title + a.Abstract + a.Year), 0) / state.csvData.length;

  const numBatches = Math.ceil(state.csvData.length / batchSize);

  // Sync: 1 instruction per batch + N articles
  const syncInputTokens = numBatches * instructionTokens + state.csvData.length * avgArticleTokens;
  // Async (inline): instruction + 1 article per request (we send each article as separate request in JSONL)
  const asyncInputTokens = state.csvData.length * (instructionTokens + avgArticleTokens);

  // Output: ~150 token/makale (summary + decision + IC/EC + rationale)
  const avgOutputPerArticle = 200;
  const totalOutputTokens = state.csvData.length * avgOutputPerArticle;

  const syncCost = (syncInputTokens/1e6)*m.standard.inputPrice + (totalOutputTokens/1e6)*m.standard.outputPrice;
  const batchCost = (asyncInputTokens/1e6)*m.batch.inputPrice + (totalOutputTokens/1e6)*m.batch.outputPrice;

  el.costEstimatePanel.style.display = 'block';
  el.estTotalArticles.textContent = state.csvData.length.toLocaleString();
  el.estInputTokens.textContent = `~${formatTokens(state.mode === 'async' ? asyncInputTokens : syncInputTokens)}`;
  el.estOutputTokens.textContent = `~${formatTokens(totalOutputTokens)}`;

  el.estSyncCost.textContent = formatCost(syncCost) + (state.mode === 'sync' ? ' ← seçili' : '');
  el.estBatchCost.textContent = formatCost(batchCost) + (state.mode === 'async' ? ' ← seçili' : '');

  if (m.freeTierAvailable) {
    el.freeTierNote.textContent = '✓ Free Tier kotanızdaysa: $0 (RPD limitine kadar ücretsiz)';
  } else {
    el.freeTierNote.textContent = '⚠️ Bu model sadece Paid Tier — gösterilen maliyet uygulanacak';
  }
}

function formatTokens(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function formatCost(usd) {
  if (usd === 0) return '$0.00 (Free / Gemma)';
  if (usd < 0.01) return '$' + usd.toFixed(4);
  if (usd < 1) return '$' + usd.toFixed(3);
  return '$' + usd.toFixed(2);
}

// ============================================================
// LIVE COST PANEL
// ============================================================
function updateLiveCost() {
  const m = MODELS[state.modelId];
  const tier = state.mode === 'async' ? 'batch' : 'standard';
  el.livMode.textContent = state.mode === 'async' ? 'Async (Batch -50%)' : 'Sync (Standard)';
  el.livInputTokens.textContent = formatTokens(state.totalInputTokens);
  el.livOutputTokens.textContent = formatTokens(state.totalOutputTokens);
  el.livCost.textContent = formatCost(state.totalCostUSD);
  el.livFreeTier.textContent = m.freeTierAvailable ? '✓ Mevcut ($0 olabilir)' : '✗ Yok';
}

// ============================================================
// ANALYZE BUTTON
// ============================================================
el.analyzeBtn.addEventListener('click', async () => {
  state.apiKey = el.apiKey.value.trim();
  if (!state.apiKey) { showError('Lütfen Gemini API key girin!'); return; }
  if (!state.csvData.length) { showError('Lütfen önce dosya yükleyin!'); return; }

  resetAnalysisState();
  saveState();

  if (state.mode === 'async') {
    await runAsyncBatch();
  } else {
    await runSyncBatch();
  }
});

function resetAnalysisState() {
  state.results = [];
  state.lastProcessedBatchIndex = -1;
  state.totalInputTokens = 0;
  state.totalOutputTokens = 0;
  state.totalCostUSD = 0;
  state.batchJobName = '';
  state.batchSubmittedAt = 0;
  state.batchLastState = '';
  state.batchKeyMap = {};
  el.resultsBody.textContent = '';
  el.resultsSection.style.display = 'block';
  el.progressSection.style.display = 'block';
  el.progressBar.style.width = '0%';
  updateStats();
  updateLiveCost();
}

// ============================================================
// SYNC MODE: Real batch (N articles per API call)
// ============================================================
async function runSyncBatch() {
  analyzing = true;
  el.analyzeBtn.disabled = true;
  el.batchJobInfo.style.display = 'none';

  const batchSize = parseInt(el.batchSize.value) || 5;
  const delaySec = parseInt(el.delayBetweenBatches.value) || 5;
  const instructions = buildSystemInstructions();

  const batches = [];
  for (let i = 0; i < state.csvData.length; i += batchSize) {
    batches.push(state.csvData.slice(i, i + batchSize));
  }

  try {
    for (let bi = state.lastProcessedBatchIndex + 1; bi < batches.length; bi++) {
      const batch = batches[bi];
      el.progressText.textContent = `Batch ${bi+1}/${batches.length} işleniyor... (${state.results.length}/${state.totalCount} makale)`;

      const batchResults = await analyzeBatchSync(batch, instructions);
      // Merge with original article data
      const merged = batch.map(article => {
        const apiR = batchResults.find(r => String(r.id) === String(article.ID)) || {
          summary_tr: 'API yanıtında bulunamadı',
          decision: 'Uncertain',
          confidence: 0,
          matched_inclusion_criteria: [],
          matched_exclusion_criteria: [],
          needs_human_review: true,
          rationale: 'Modelden yanıt alınamadı'
        };
        return mergeResult(article, apiR);
      });

      merged.forEach(r => {
        state.results.push(r);
        appendRowToTable(r);
      });

      state.lastProcessedBatchIndex = bi;
      const pct = ((bi+1) / batches.length) * 100;
      el.progressBar.style.width = pct + '%';
      updateStats();
      updateLiveCost();
      saveState();

      if (bi < batches.length - 1 && delaySec > 0) {
        el.progressText.textContent = `Batch ${bi+1} tamamlandı. ${delaySec}s bekleniyor...`;
        await sleep(delaySec * 1000);
      }
    }
    el.progressText.textContent = '✅ Analiz tamamlandı!';
    clearStateOnComplete();
  } catch (err) {
    showError('Hata: ' + err.message + ' — Mevcut sonuçlar tabloda kaldı, indirebilirsin.');
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

async function analyzeBatchSync(batch, instructions) {
  const prompt = buildBatchPrompt(batch, instructions);
  const data = await callGeminiAPI(prompt);

  // Track usage
  if (data.usageMetadata) {
    const inT = data.usageMetadata.promptTokenCount || 0;
    const outT = data.usageMetadata.candidatesTokenCount || 0;
    accumulateCost(inT, outT, 'standard');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseModelResponse(text);
}

function parseModelResponse(text) {
  let jsonText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Try to extract JSON object if wrapped in extra text
  const m = jsonText.match(/\{[\s\S]*\}/);
  if (m) jsonText = m[0];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.results)) return parsed.results;
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch (e) {
    console.error('JSON parse hatası:', e, text);
    return [];
  }
}

async function callGeminiAPI(prompt, retry = 0) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.modelId}:generateContent?key=${state.apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        console.log(`Rate limit. ${wait}s sonra tekrar... (${retry+1}/5)`);
        await sleep(wait * 1000);
        return callGeminiAPI(prompt, retry + 1);
      }
      throw new Error(`API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    return await resp.json();
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callGeminiAPI(prompt, retry + 1);
    }
    throw err;
  }
}

function accumulateCost(inputTokens, outputTokens, tier) {
  const m = MODELS[state.modelId];
  const p = m[tier];
  state.totalInputTokens += inputTokens;
  state.totalOutputTokens += outputTokens;
  state.totalCostUSD += (inputTokens/1e6)*p.inputPrice + (outputTokens/1e6)*p.outputPrice;
}

// ============================================================
// ASYNC MODE: Batch API (50% discount, async, up to 24h)
// ============================================================
async function runAsyncBatch() {
  analyzing = true;
  el.analyzeBtn.disabled = true;
  el.batchJobInfo.style.display = 'block';

  try {
    const instructions = buildSystemInstructions();

    // Build inline batch (recommended for <20MB)
    el.progressText.textContent = 'Batch job hazırlanıyor...';
    const requests = state.csvData.map(article => {
      const key = String(article.ID);
      state.batchKeyMap[key] = article;
      return {
        key,
        request: {
          contents: [{ parts: [{ text: buildBatchPrompt([article], instructions) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        }
      };
    });

    el.progressText.textContent = 'Batch job gönderiliyor...';
    const jobName = await submitInlineBatch(requests);
    state.batchJobName = jobName;
    state.batchSubmittedAt = Date.now();
    el.batchJobName.textContent = jobName;
    el.batchJobState.textContent = 'GÖNDERİLDİ';
    saveState();

    el.progressText.textContent = `✓ Job gönderildi: ${jobName}. Durum kontrol ediliyor...`;
    await pollAndProcessBatchJob();
  } catch (err) {
    showError('Async batch hatası: ' + err.message);
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

async function submitInlineBatch(requests) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.modelId}:batchGenerateContent?key=${state.apiKey}`;
  const body = {
    batch: {
      display_name: `screening-${Date.now()}`,
      input_config: {
        requests: { requests }
      }
    }
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(`Batch submit ${resp.status}: ${e.error?.message || resp.statusText}`);
  }
  const data = await resp.json();
  return data.name; // "batches/abc123"
}

async function pollAndProcessBatchJob() {
  pollAbortController = new AbortController();
  const startTime = state.batchSubmittedAt || Date.now();

  while (true) {
    if (pollAbortController.signal.aborted) {
      el.progressText.textContent = 'Polling iptal edildi.';
      return;
    }

    const job = await fetchBatchJobStatus();
    state.batchLastState = job.metadata?.state || 'UNKNOWN';
    el.batchJobState.textContent = state.batchLastState;
    saveState();

    const elapsedMin = Math.round((Date.now() - startTime) / 60000);
    el.progressText.textContent = `Job: ${state.batchLastState} (${elapsedMin} dk)`;

    if (state.batchLastState === 'JOB_STATE_SUCCEEDED' || state.batchLastState === 'SUCCEEDED') {
      await processBatchJobResults(job);
      return;
    }
    if (state.batchLastState === 'JOB_STATE_FAILED' || state.batchLastState === 'FAILED' ||
        state.batchLastState === 'JOB_STATE_CANCELLED' || state.batchLastState === 'CANCELLED') {
      throw new Error(`Batch job durdu: ${state.batchLastState}. ${job.error?.message || ''}`);
    }

    // Still running, poll again
    await sleep(60000); // 60s polling
  }
}

async function fetchBatchJobStatus() {
  const url = `https://generativelanguage.googleapis.com/v1beta/${state.batchJobName}?key=${state.apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(`Job status ${resp.status}: ${e.error?.message || resp.statusText}`);
  }
  return await resp.json();
}

async function processBatchJobResults(job) {
  el.progressText.textContent = 'Sonuçlar işleniyor...';
  const inlined = job.response?.inlinedResponses?.inlinedResponses || [];

  // If results are in a file, fetch them
  if (!inlined.length && job.response?.responsesFile) {
    await fetchAndProcessFile(job.response.responsesFile);
    return;
  }

  inlined.forEach(item => {
    const key = item.key;
    const article = state.batchKeyMap[key];
    if (!article) return;

    let apiResult;
    if (item.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = item.response.candidates[0].content.parts[0].text;
      const parsed = parseModelResponse(text);
      apiResult = parsed[0] || {
        summary_tr: 'Parse edilemedi',
        decision: 'Uncertain',
        confidence: 0,
        matched_inclusion_criteria: [],
        matched_exclusion_criteria: [],
        needs_human_review: true,
        rationale: 'Yanıt parse edilemedi'
      };
      if (item.response.usageMetadata) {
        const inT = item.response.usageMetadata.promptTokenCount || 0;
        const outT = item.response.usageMetadata.candidatesTokenCount || 0;
        accumulateCost(inT, outT, 'batch');
      }
    } else {
      apiResult = {
        summary_tr: 'Hata',
        decision: 'Uncertain',
        confidence: 0,
        matched_inclusion_criteria: [],
        matched_exclusion_criteria: [],
        needs_human_review: true,
        rationale: item.error?.message || 'API yanıtı boş'
      };
    }

    const merged = mergeResult(article, apiResult);
    state.results.push(merged);
    appendRowToTable(merged);
  });

  el.progressBar.style.width = '100%';
  el.progressText.textContent = '✅ Async batch tamamlandı!';
  updateStats();
  updateLiveCost();
  clearStateOnComplete();
}

async function fetchAndProcessFile(fileName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}:download?alt=media&key=${state.apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Output file fetch ${resp.status}`);
  const text = await resp.text();
  const lines = text.split('\n').filter(Boolean);
  lines.forEach(line => {
    try {
      const item = JSON.parse(line);
      const key = item.key;
      const article = state.batchKeyMap[key];
      if (!article) return;
      const respText = item.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseModelResponse(respText);
      const apiResult = parsed[0] || {
        summary_tr: 'Parse hatası',
        decision: 'Uncertain', confidence: 0,
        matched_inclusion_criteria: [], matched_exclusion_criteria: [],
        needs_human_review: true, rationale: 'Parse edilemedi'
      };
      if (item.response?.usageMetadata) {
        accumulateCost(item.response.usageMetadata.promptTokenCount || 0,
                       item.response.usageMetadata.candidatesTokenCount || 0, 'batch');
      }
      const merged = mergeResult(article, apiResult);
      state.results.push(merged);
      appendRowToTable(merged);
    } catch (e) { console.error('Line parse error:', e); }
  });
  el.progressBar.style.width = '100%';
  el.progressText.textContent = '✅ Async batch tamamlandı!';
  updateStats();
  updateLiveCost();
  clearStateOnComplete();
}

// ============================================================
// MERGE RESULT (Excel + API)
// ============================================================
function mergeResult(article, apiResult) {
  return {
    id: article.ID,
    authors: article.Authors || '',
    title: article.Title,
    year: article.Year || '',
    abstract: article.Abstract,                          // ORİJİNAL — dosyadan
    summary_tr: apiResult.summary_tr || '',              // API'den
    decision: apiResult.decision || 'Uncertain',
    confidence: typeof apiResult.confidence === 'number' ? apiResult.confidence : null,
    matched_inclusion_criteria: Array.isArray(apiResult.matched_inclusion_criteria) ? apiResult.matched_inclusion_criteria : [],
    matched_exclusion_criteria: Array.isArray(apiResult.matched_exclusion_criteria) ? apiResult.matched_exclusion_criteria : [],
    needs_human_review: apiResult.needs_human_review === true,
    rationale: apiResult.rationale || ''
  };
}

// ============================================================
// XSS-SAFE ROW RENDERING
// ============================================================
function appendRowToTable(r) {
  const row = document.createElement('tr');
  row.dataset.decision = r.decision;
  row.dataset.review = r.needs_human_review ? '1' : '0';

  const cells = [
    r.id,
    r.authors || 'Belirtilmemiş',
    r.title,
    r.year,
    r.abstract,
    r.summary_tr
  ];
  cells.forEach(text => {
    const td = document.createElement('td');
    td.textContent = text;
    row.appendChild(td);
  });

  // Decision (badge)
  const tdD = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = `decision-${(r.decision || 'uncertain').toLowerCase()}`;
  badge.textContent = r.decision;
  tdD.appendChild(badge);
  row.appendChild(tdD);

  // Confidence
  const tdC = document.createElement('td');
  tdC.textContent = r.confidence !== null ? r.confidence.toFixed(2) : '-';
  if (r.confidence !== null && r.confidence < 0.7) tdC.style.color = '#dc3545';
  row.appendChild(tdC);

  // IC
  const tdIC = document.createElement('td');
  tdIC.textContent = r.matched_inclusion_criteria.join(', ');
  row.appendChild(tdIC);

  // EC
  const tdEC = document.createElement('td');
  tdEC.textContent = r.matched_exclusion_criteria.join(', ');
  row.appendChild(tdEC);

  // Review
  const tdR = document.createElement('td');
  if (r.needs_human_review) {
    const flag = document.createElement('span');
    flag.className = 'review-flag';
    flag.textContent = '👁️ Gerekli';
    tdR.appendChild(flag);
  } else {
    tdR.textContent = '-';
  }
  row.appendChild(tdR);

  // Rationale
  const tdRat = document.createElement('td');
  tdRat.textContent = r.rationale;
  row.appendChild(tdRat);

  el.resultsBody.appendChild(row);
  applyFilters();
}

function updateStats() {
  let inc = 0, exc = 0, unc = 0, rev = 0;
  state.results.forEach(r => {
    if (r.decision === 'Include') inc++;
    else if (r.decision === 'Exclude') exc++;
    else unc++;
    if (r.needs_human_review) rev++;
  });
  el.includeCount.textContent = inc;
  el.excludeCount.textContent = exc;
  el.uncertainCount.textContent = unc;
  el.reviewCount.textContent = rev;
  el.totalCount.textContent = state.results.length;
}

// ============================================================
// FILTERS
// ============================================================
let filterTimer = null;
el.filterDecision.addEventListener('change', applyFilters);
el.filterSearch.addEventListener('input', () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(applyFilters, 200);
});

function applyFilters() {
  const dec = el.filterDecision.value;
  const search = el.filterSearch.value.toLowerCase().trim();
  let visible = 0;
  Array.from(el.resultsBody.children).forEach(row => {
    let show = true;
    if (dec === 'review' && row.dataset.review !== '1') show = false;
    else if (dec !== 'all' && dec !== 'review' && row.dataset.decision !== dec) show = false;

    if (show && search) {
      const text = row.textContent.toLowerCase();
      if (!text.includes(search)) show = false;
    }
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  el.filterCount.textContent = `${visible} / ${el.resultsBody.children.length} satır`;
}

// ============================================================
// DOWNLOAD
// ============================================================
// Prompt versioning: instructions hash for reproducibility
async function getPromptVersion() {
  const instr = buildSystemInstructions();
  const hash = await hashString(instr);
  return { hash, instructions: instr };
}

function buildMetadataRows(promptInfo) {
  const m = MODELS[state.modelId];
  const tier = state.mode === 'async' ? 'batch' : 'standard';
  const { inclusion, exclusion } = getCriteriaCodes();
  return [
    ['Anahtar', 'Değer'],
    ['Tarih (UTC)', new Date().toISOString()],
    ['Model', state.modelId],
    ['Model adı', m.label],
    ['Mod', state.mode],
    ['Tier', tier],
    ['Prompt versiyon (sha256[0:8])', promptInfo.hash],
    ['Toplam makale', state.totalCount],
    ['İşlenen makale', state.results.length],
    ['Toplam input token', state.totalInputTokens],
    ['Toplam output token', state.totalOutputTokens],
    ['Toplam maliyet (USD)', state.totalCostUSD.toFixed(6)],
    ['Free Tier mevcut', m.freeTierAvailable ? 'Evet' : 'Hayır'],
    ['', ''],
    ['Dahil etme kriterleri (IC):', ''],
    ...inclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Hariç tutma kriterleri (EC):', ''],
    ...exclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Sistem promptu (tam metin):', ''],
    ['', promptInfo.instructions]
  ];
}

el.downloadCsvBtn.addEventListener('click', async () => {
  if (!state.results.length) { showError('Henüz sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();
  const meta = buildMetadataRows(promptInfo);
  const metaCsv = meta.map(([k,v]) =>
    `# ${String(k).replace(/[\r\n]/g,' ')}\t${String(v).replace(/[\r\n]/g,' ')}`
  ).join('\n');

  const headers = ['ID','Yazar(lar)','Başlık','Yıl','Abstract (Orijinal)','Türkçe Özet','Karar','Güven','IC','EC','İnceleme','Gerekçe'];
  const rows = state.results.map(r => [
    r.id, r.authors, r.title, r.year, r.abstract, r.summary_tr,
    r.decision,
    r.confidence !== null ? r.confidence.toFixed(2) : '',
    r.matched_inclusion_criteria.join(';'),
    r.matched_exclusion_criteria.join(';'),
    r.needs_human_review ? 'Yes' : 'No',
    r.rationale
  ]);
  const csv = [headers, ...rows].map(row =>
    row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const fullCsv = metaCsv + '\n#\n' + csv;
  const blob = new Blob(['\ufeff' + fullCsv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `screening_results_${new Date().toISOString().split('T')[0]}_v${promptInfo.hash}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

el.downloadExcelBtn.addEventListener('click', async () => {
  if (!state.results.length) { showError('Henüz sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();

  const data = state.results.map(r => ({
    'ID': r.id,
    'Yazar(lar)': r.authors,
    'Başlık': r.title,
    'Yıl': r.year,
    'Abstract (Orijinal)': r.abstract,
    'Türkçe Özet': r.summary_tr,
    'Karar': r.decision,
    'Güven': r.confidence !== null ? r.confidence.toFixed(2) : '',
    'IC': r.matched_inclusion_criteria.join(';'),
    'EC': r.matched_exclusion_criteria.join(';'),
    'İnceleme Gerekli': r.needs_human_review ? 'Yes' : 'No',
    'Gerekçe': r.rationale,
    'Prompt Versiyon': promptInfo.hash
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 }, { wch: 25 }, { wch: 50 }, { wch: 8 }, { wch: 60 },
    { wch: 50 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 50 }, { wch: 12 }
  ];

  // Metadata sheet — reproducibility için
  const metaWs = XLSX.utils.aoa_to_sheet(buildMetadataRows(promptInfo));
  metaWs['!cols'] = [{ wch: 35 }, { wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
  XLSX.writeFile(wb, `screening_results_${new Date().toISOString().split('T')[0]}_v${promptInfo.hash}.xlsx`);
});

// ============================================================
// STATE PERSISTENCE & RESUME
// ============================================================
function saveState() {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      mode: state.mode,
      modelId: state.modelId,
      fileHash: state.fileHash,
      totalCount: state.totalCount,
      results: state.results,
      lastProcessedBatchIndex: state.lastProcessedBatchIndex,
      totalInputTokens: state.totalInputTokens,
      totalOutputTokens: state.totalOutputTokens,
      totalCostUSD: state.totalCostUSD,
      batchJobName: state.batchJobName,
      batchSubmittedAt: state.batchSubmittedAt,
      batchLastState: state.batchLastState,
      batchKeyMap: state.batchKeyMap,
      csvData: state.csvData
    }));
  } catch (e) { console.warn('State save failed:', e); }
}

function loadResumeState() {
  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (!s.results || !s.totalCount) return;

    const isAsync = s.mode === 'async' && s.batchJobName;
    const isSyncIncomplete = s.mode === 'sync' && s.results.length < s.totalCount;
    const isComplete = s.results.length >= s.totalCount && !isAsync;

    if (isComplete) return;
    if (!isAsync && !isSyncIncomplete) return;

    el.resumeBanner.style.display = 'block';
    if (isAsync) {
      const elapsedMin = Math.round((Date.now() - s.batchSubmittedAt) / 60000);
      el.resumeText.textContent = `Async Batch Job: ${s.batchJobName} | Model: ${MODELS[s.modelId]?.label || s.modelId} | Gönderim: ${elapsedMin} dk önce | Son durum: ${s.batchLastState || 'UNKNOWN'}`;
    } else {
      el.resumeText.textContent = `Sync analiz yarım kaldı: ${s.results.length}/${s.totalCount} makale işlendi. Model: ${MODELS[s.modelId]?.label || s.modelId}`;
    }

    el.resumeBtn.onclick = async () => {
      Object.assign(state, s);
      el.modelSelect.value = s.modelId;
      const modeRadio = document.querySelector(`input[name="mode"][value="${s.mode}"]`);
      if (modeRadio) modeRadio.checked = true;
      state.mode = s.mode;
      updateModelInfo();
      updateModeUI();
      el.resumeBanner.style.display = 'none';
      el.resultsSection.style.display = 'block';
      el.progressSection.style.display = 'block';
      el.resultsBody.textContent = '';
      state.results.forEach(r => appendRowToTable(r));
      updateStats();
      updateLiveCost();

      state.apiKey = el.apiKey.value.trim();
      if (!state.apiKey) { showError('API key gerekli!'); return; }

      if (isAsync) {
        el.batchJobInfo.style.display = 'block';
        el.batchJobName.textContent = s.batchJobName;
        el.batchJobState.textContent = s.batchLastState;
        analyzing = true;
        try { await pollAndProcessBatchJob(); }
        catch (err) { showError('Polling hatası: ' + err.message); }
        finally { analyzing = false; }
      } else {
        await runSyncBatch();
      }
    };

    el.discardBtn.onclick = () => {
      sessionStorage.removeItem(STATE_KEY);
      el.resumeBanner.style.display = 'none';
    };
  } catch (e) { console.warn('Resume load failed:', e); }
}

function clearStateOnComplete() {
  // Keep results for download, but mark complete
  sessionStorage.removeItem(STATE_KEY);
}

// ============================================================
// UTILS
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showError(msg) {
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = '❌ ' + msg;
  document.querySelector('.upload-section').insertBefore(div, document.querySelector('.upload-section').firstChild);
  setTimeout(() => div.remove(), 8000);
}

function showSuccess(msg) {
  const div = document.createElement('div');
  div.className = 'success-message';
  div.textContent = '✅ ' + msg;
  document.querySelector('.upload-section').insertBefore(div, document.querySelector('.upload-section').firstChild);
  setTimeout(() => div.remove(), 5000);
}
