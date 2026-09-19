// ============================================================
// GEMINI LITERATURE SCREENING — v8
// Multi-model parallel screening · ChatGPT & DeepSeek & Custom Models
// User Research Topic Relevance Mapping · Scientific Database Column Matching
// ============================================================

// Model registry containing properties & estimated USD prices per 1M tokens
const MODELS = {
  "gemini-3.5-flash": {
    label: "Gemini 3.5 Flash",
    apiModelId: "gemini-3.5-flash",
    standard: { inputPrice: 0.075, outputPrice: 0.30 },
    batch:    { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 1500, tpm: 1000000
  },
  "gemini-3.1-flash-lite-preview": {
    label: "Gemini 3.1 Flash Lite (Preview)",
    apiModelId: "gemini-3.1-flash-lite-preview",
    standard: { inputPrice: 0.25, outputPrice: 1.50 },
    batch:    { inputPrice: 0.125, outputPrice: 0.75 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 500, tpm: 250000
  },
  "gemini-3.1-pro-preview": {
    label: "Gemini 3.1 Pro (Preview)",
    apiModelId: "gemini-3.1-pro-preview",
    standard: { inputPrice: 2.00, outputPrice: 12.00 },
    batch:    { inputPrice: 1.00, outputPrice: 6.00 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 2, rpd: 50, tpm: 100000
  },
  "gemini-3-flash": {
    label: "Gemini 3 Flash",
    apiModelId: "gemini-3-flash",
    standard: { inputPrice: 0.075, outputPrice: 0.30 },
    batch:    { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 500, tpm: 250000
  },
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    apiModelId: "gemini-2.5-flash",
    standard: { inputPrice: 0.30, outputPrice: 2.50 },
    batch:    { inputPrice: 0.15, outputPrice: 1.25 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 5, rpd: 20, tpm: 250000
  },
  "gemini-2.5-flash-lite": {
    label: "Gemini 2.5 Flash Lite",
    apiModelId: "gemini-2.5-flash-lite",
    standard: { inputPrice: 0.10, outputPrice: 0.40 },
    batch:    { inputPrice: 0.05, outputPrice: 0.20 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 10, rpd: 20, tpm: 250000
  },
  "gpt-4o-mini": {
    label: "GPT-4o Mini (OpenAI)",
    apiModelId: "gpt-4o-mini",
    standard: { inputPrice: 0.15, outputPrice: 0.60 },
    batch:    { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 200, rpd: 5000, tpm: 200000
  },
  "gpt-4o": {
    label: "GPT-4o (OpenAI)",
    apiModelId: "gpt-4o",
    standard: { inputPrice: 2.50, outputPrice: 10.00 },
    batch:    { inputPrice: 1.25, outputPrice: 5.00 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 100, rpd: 2000, tpm: 100000
  },
  "deepseekv4pro": {
    label: "DeepSeek v4 Pro",
    apiModelId: "deepseek-v4-pro",
    standard: { inputPrice: 0.55, outputPrice: 2.19 },
    batch:    { inputPrice: 0.275, outputPrice: 1.10 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 60, rpd: 1000, tpm: 150000
  },
  "custom": {
    label: "Kendi Modeliniz",
    apiModelId: "custom",
    standard: { inputPrice: 0.15, outputPrice: 0.60 },
    batch:    { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 0, rpd: 0, tpm: 0
  }
};

const STATE_KEY = 'gls_state_v8';
const KEY_KEY = 'gls_apikey_v8';
const OPENAI_KEY_KEY = 'gls_openai_apikey_v8';
const DEEPSEEK_KEY_KEY = 'gls_deepseek_apikey_v8';
const CUSTOM_KEY_KEY = 'gls_custom_apikey_v8';

// Database specific column aliases (fuzzy matching registry)
const ALIASES = {
  id: ['id', 'ut', 'eid', 'no', 'sıra no', 'sira no', 'index', 'number', 'sıra', 'unique id', 'wos id', 'scopus id', 'artno'],
  title: ['title', 'ti', 'document title', 'article title', 'başlık', 'baslik', 'paper title', 'makale adı', 'makale adi', 'name'],
  abstract: ['abstract', 'ab', 'özet', 'ozet', 'summary', 'details', 'özet metin', 'abstract text'],
  authors: ['authors', 'author', 'au', 'yazar', 'yazarlar', 'author(s)', 'yazar(lar)', 'authors/yazarlar', 'creator'],
  year: ['year', 'py', 'publication year', 'yıl', 'yil', 'date of publication', 'date', 'yayın yılı', 'yayin yili']
};

// Global state
let state = {
  csvData: [],
  results: [],
  apiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
  customApiKey: '',
  activeModels: ['gemini-3.5-flash'],
  mode: 'sync',
  fileHash: '',
  totalCount: 0,
  lastProcessedBatchIndex: -1,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCostUSD: 0,
  customModelSpecs: {
    modelId: 'custom-model',
    provider: 'openai',
    baseUrl: '',
    inputPrice: 0.15,
    outputPrice: 0.60
  },
  userResearchTopic: '',
  // async-only (Gemini native)
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
  openaiApiKey: document.getElementById('openaiApiKey'),
  deepseekApiKey: document.getElementById('deepseekApiKey'),
  customApiKey: document.getElementById('customApiKey'),
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
  totalCount: document.getElementById('totalCount'),
  userResearchTopic: document.getElementById('userResearchTopic'),
  relevanceReportBtn: document.getElementById('relevanceReportBtn'),
  reportModal: document.getElementById('reportModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  closeModalBtn2: document.getElementById('closeModalBtn2'),
  modalReportBody: document.getElementById('modalReportBody'),
  customModelConfig: document.getElementById('customModelConfig'),
  customModelId: document.getElementById('customModelId'),
  customModelProvider: document.getElementById('customModelProvider'),
  customModelBaseUrl: document.getElementById('customModelBaseUrl'),
  customModelInputPrice: document.getElementById('customModelInputPrice'),
  customModelOutputPrice: document.getElementById('customModelOutputPrice'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toggleAllAbstractsBtn: document.getElementById('toggleAllAbstractsBtn')
};

// ============================================================
// FUZZY COLUMN MATCHING UTILITIES
// ============================================================
function findMatchedHeader(headers, aliases) {
  const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const cleanAliases = aliases.map(normalize);
  
  // Exact or normalized contains match
  for (let i = 0; i < headers.length; i++) {
    const hNorm = normalize(headers[i]);
    if (cleanAliases.includes(hNorm)) return i;
  }
  // Substring matching as secondary fallback
  for (let i = 0; i < headers.length; i++) {
    const hLow = headers[i].toLowerCase().trim();
    if (aliases.some(alias => hLow.includes(alias) || alias.includes(hLow))) {
      return i;
    }
  }
  return -1;
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Load Session Keys
  const savedKey = sessionStorage.getItem(KEY_KEY);
  if (savedKey) el.apiKey.value = savedKey;
  const savedOaiKey = sessionStorage.getItem(OPENAI_KEY_KEY);
  if (savedOaiKey) el.openaiApiKey.value = savedOaiKey;
  const savedDsKey = sessionStorage.getItem(DEEPSEEK_KEY_KEY);
  if (savedDsKey) el.deepseekApiKey.value = savedDsKey;
  const savedCustomKey = sessionStorage.getItem(CUSTOM_KEY_KEY);
  if (savedCustomKey) el.customApiKey.value = savedCustomKey;

  // Load Criteria
  const savedInc = localStorage.getItem('gls_inclusion');
  if (savedInc) el.inclusion.value = savedInc;
  const savedExc = localStorage.getItem('gls_exclusion');
  if (savedExc) el.exclusion.value = savedExc;
  
  const savedTopic = localStorage.getItem('gls_research_topic');
  if (savedTopic) el.userResearchTopic.value = savedTopic;

  // Restore Custom Model Config Specs
  const savedCustomSpecs = localStorage.getItem('gls_custom_specs');
  if (savedCustomSpecs) {
    try {
      state.customModelSpecs = JSON.parse(savedCustomSpecs);
      MODELS['custom'].label = `Kendi Modeliniz (${state.customModelSpecs.modelId || 'Belirtilmemiş'})`;
      MODELS['custom'].standard = { inputPrice: state.customModelSpecs.inputPrice, outputPrice: state.customModelSpecs.outputPrice };
      MODELS['custom'].batch = { inputPrice: state.customModelSpecs.inputPrice / 2, outputPrice: state.customModelSpecs.outputPrice / 2 };
      
      el.customModelId.value = state.customModelSpecs.modelId || '';
      el.customModelProvider.value = state.customModelSpecs.provider || 'openai';
      el.customModelBaseUrl.value = state.customModelSpecs.baseUrl || '';
      el.customModelInputPrice.value = state.customModelSpecs.inputPrice || 0.15;
      el.customModelOutputPrice.value = state.customModelSpecs.outputPrice || 0.60;
    } catch (e) {
      console.warn("Could not restore custom model specs", e);
    }
  }

  // Restore Active Models
  const savedActiveModels = localStorage.getItem('gls_active_models');
  if (savedActiveModels) {
    try {
      state.activeModels = JSON.parse(savedActiveModels);
    } catch(e) {
      state.activeModels = ['gemini-3.5-flash'];
    }
  }

  // Restore Mode
  const savedMode = localStorage.getItem('gls_mode');
  if (savedMode) {
    const radio = document.querySelector(`input[name="mode"][value="${savedMode}"]`);
    if (radio) radio.checked = true;
    state.mode = savedMode;
  }

  // Load Theme
  const savedTheme = localStorage.getItem('gls_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (el.themeToggleBtn) el.themeToggleBtn.textContent = '☀️ Gündüz Modu';
  } else {
    document.body.classList.remove('light-theme');
    if (el.themeToggleBtn) el.themeToggleBtn.textContent = '🌙 Gece Modu';
  }

  renderModelSlots();
  initListeners();
  updateApiKeyInputsVisibility();
  updateModelInfo();
  updateModeUI();
  loadResumeState();
});

// Setup dynamic listeners
function initListeners() {
  el.apiKey.addEventListener('change', () => sessionStorage.setItem(KEY_KEY, el.apiKey.value.trim()));
  el.openaiApiKey.addEventListener('change', () => sessionStorage.setItem(OPENAI_KEY_KEY, el.openaiApiKey.value.trim()));
  el.deepseekApiKey.addEventListener('change', () => sessionStorage.setItem(DEEPSEEK_KEY_KEY, el.deepseekApiKey.value.trim()));
  el.customApiKey.addEventListener('change', () => sessionStorage.setItem(CUSTOM_KEY_KEY, el.customApiKey.value.trim()));
  
  el.inclusion.addEventListener('change', () => localStorage.setItem('gls_inclusion', el.inclusion.value));
  el.exclusion.addEventListener('change', () => localStorage.setItem('gls_exclusion', el.exclusion.value));
  el.userResearchTopic.addEventListener('change', () => {
    localStorage.setItem('gls_research_topic', el.userResearchTopic.value);
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

  // Custom model specs updates
  const updateCustomSpecs = () => {
    state.customModelSpecs.modelId = el.customModelId.value.trim() || 'custom-model';
    state.customModelSpecs.provider = el.customModelProvider.value;
    state.customModelSpecs.baseUrl = el.customModelBaseUrl.value.trim();
    state.customModelSpecs.inputPrice = parseFloat(el.customModelInputPrice.value) || 0;
    state.customModelSpecs.outputPrice = parseFloat(el.customModelOutputPrice.value) || 0;
    
    localStorage.setItem('gls_custom_specs', JSON.stringify(state.customModelSpecs));
    
    // Update local registry
    MODELS['custom'].label = `Kendi Modeliniz (${state.customModelSpecs.modelId})`;
    MODELS['custom'].standard = { inputPrice: state.customModelSpecs.inputPrice, outputPrice: state.customModelSpecs.outputPrice };
    MODELS['custom'].batch = { inputPrice: state.customModelSpecs.inputPrice / 2, outputPrice: state.customModelSpecs.outputPrice / 2 };
    
    // Update dropdown layouts
    const currentActive = [...state.activeModels];
    renderModelSlots();
    state.activeModels = currentActive;
    updateApiKeyInputsVisibility();
    updateModelInfo();
    updateCostEstimate();
  };

  [el.customModelId, el.customModelProvider, el.customModelBaseUrl, el.customModelInputPrice, el.customModelOutputPrice].forEach(input => {
    input.addEventListener('input', updateCustomSpecs);
  });

  // Modal Closures
  [el.closeModalBtn, el.closeModalBtn2].forEach(btn => {
    btn.addEventListener('click', () => el.reportModal.style.display = 'none');
  });

  el.relevanceReportBtn.addEventListener('click', showRelevanceReport);

  // Theme Toggle
  if (el.themeToggleBtn) {
    el.themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('gls_theme', isLight ? 'light' : 'dark');
      el.themeToggleBtn.textContent = isLight ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
    });
  }

  // Global Toggle All Abstracts
  let allAbstractsExpanded = false;
  if (el.toggleAllAbstractsBtn) {
    el.toggleAllAbstractsBtn.addEventListener('click', () => {
      allAbstractsExpanded = !allAbstractsExpanded;
      const containers = document.querySelectorAll('.collapsible-text-container');
      containers.forEach(container => {
        const previewSpan = container.querySelector('.text-preview');
        const fullSpan = container.querySelector('.text-full');
        const toggleBtn = container.querySelector('.btn-toggle-text');
        
        if (allAbstractsExpanded) {
          container.classList.remove('collapsed');
          if (previewSpan) previewSpan.style.display = 'none';
          if (fullSpan) fullSpan.style.display = 'inline';
          if (toggleBtn) toggleBtn.textContent = ' (daha az göster)';
        } else {
          container.classList.add('collapsed');
          if (previewSpan) previewSpan.style.display = 'inline';
          if (fullSpan) fullSpan.style.display = 'none';
          if (toggleBtn) toggleBtn.textContent = ' (devamını göster)';
        }
      });
      el.toggleAllAbstractsBtn.textContent = allAbstractsExpanded ? '↕️ Tüm Özetleri Kapat' : '↕️ Tüm Özetleri Aç';
    });
  }
}

// Render dynamic model drop-downs
function renderModelSlots() {
  const container = document.getElementById('modelSlotsContainer');
  container.innerHTML = '';
  
  state.activeModels.forEach((modelId, idx) => {
    const row = document.createElement('div');
    row.className = 'model-slot-row';
    row.style.marginBottom = '12px';
    
    const label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = idx === 0 ? 'Model 1 (Zorunlu / Birincil):' : `Model ${idx + 1} (Opsiyonel):`;
    
    const select = document.createElement('select');
    select.className = 'model-select-control';
    select.id = `modelSelect${idx + 1}`;
    select.style.padding = '10px';
    select.style.width = '100%';
    select.style.borderRadius = '8px';
    
    Object.entries(MODELS).forEach(([mId, mInfo]) => {
      const opt = document.createElement('option');
      opt.value = mId;
      opt.textContent = mInfo.label;
      if (mId === modelId) opt.selected = true;
      select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
      state.activeModels[idx] = e.target.value;
      localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
      updateApiKeyInputsVisibility();
      updateModelInfo();
      updateCostEstimate();
    });
    
    row.appendChild(label);
    row.appendChild(select);
    
    if (idx > 0) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove-slot';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        state.activeModels.splice(idx, 1);
        localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
        renderModelSlots();
        updateApiKeyInputsVisibility();
        updateModelInfo();
        updateCostEstimate();
      });
      row.appendChild(removeBtn);
    }
    
    container.appendChild(row);
  });
  
  const addBtn = document.getElementById('addModelSlotBtn');
  if (state.activeModels.length >= 3) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = 'inline-flex';
  }
}

document.getElementById('addModelSlotBtn').addEventListener('click', () => {
  if (state.activeModels.length < 3) {
    // Select first Gemini/available model that is not already chosen
    const defaults = ['gpt-4o-mini', 'gemini-2.5-flash', 'deepseekv4pro'];
    const chosen = defaults.find(d => !state.activeModels.includes(d)) || 'gemini-3.5-flash';
    state.activeModels.push(chosen);
    localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
    renderModelSlots();
    updateApiKeyInputsVisibility();
    updateModelInfo();
    updateCostEstimate();
  }
});

// Toggle Dynamic API Key fields
function updateApiKeyInputsVisibility() {
  const hasGemini = state.activeModels.some(m => m.startsWith('gemini') || (m === 'custom' && state.customModelSpecs.provider === 'gemini'));
  const hasOpenai = state.activeModels.some(m => m.startsWith('gpt') || (m === 'custom' && state.customModelSpecs.provider === 'openai'));
  const hasDeepseek = state.activeModels.some(m => m === 'deepseekv4pro' || (m === 'custom' && state.customModelSpecs.provider === 'deepseek'));
  const hasCustom = state.activeModels.includes('custom');
  
  document.getElementById('geminiKeyGroup').style.display = hasGemini ? 'block' : 'none';
  document.getElementById('openaiKeyGroup').style.display = hasOpenai ? 'block' : 'none';
  document.getElementById('deepseekKeyGroup').style.display = hasDeepseek ? 'block' : 'none';
  document.getElementById('customKeyGroup').style.display = (hasCustom && !['openai', 'gemini', 'deepseek'].includes(state.customModelSpecs.provider)) ? 'block' : 'none';
  
  el.customModelConfig.style.display = hasCustom ? 'block' : 'none';
  
  // Enforce Sync mode if non-Gemini is selected
  const allGemini = state.activeModels.every(m => m.startsWith('gemini'));
  const asyncRadio = document.querySelector('input[name="mode"][value="async"]');
  const syncRadio = document.querySelector('input[name="mode"][value="sync"]');
  if (!allGemini) {
    asyncRadio.disabled = true;
    if (state.mode === 'async') {
      syncRadio.checked = true;
      state.mode = 'sync';
      updateModeUI();
    }
  } else {
    asyncRadio.disabled = false;
  }
}

// ============================================================
// MODEL INFO & COST UI
// ============================================================
function updateModelInfo() {
  // Model limits reflect the first (primary) selected model
  const primaryId = state.activeModels[0] || 'gemini-3.5-flash';
  const m = MODELS[primaryId] || MODELS['gemini-3.5-flash'];
  
  el.rpmLimit.textContent = m.rpm > 0 ? m.rpm : 'Paid / Sınırsız';
  el.rpdLimit.textContent = m.rpd > 0 ? m.rpd.toLocaleString() : 'Paid / Sınırsız';
  el.tpmLimit.textContent = m.tpm === Infinity ? 'Sınırsız' : (m.tpm > 0 ? (m.tpm/1000) + 'K' : '-');

  const batchSize = parseInt(el.batchSize.value) || 5;
  if (m.rpd > 0) {
    const dailyCap = m.rpd * batchSize;
    el.dailyCapacity.textContent = `~${dailyCap.toLocaleString()} makale/gün (sync)`;
  } else {
    el.dailyCapacity.textContent = 'Limit yok / Dynamic API';
  }
}

function updateModeUI() {
  const isSync = state.mode === 'sync';
  el.batchSizeGroup.style.display = isSync ? 'block' : 'none';
  el.delaySettingsGroup.style.display = isSync ? 'block' : 'none';
}

// ============================================================
// PROMPT BUILDING
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
  const userTopic = el.userResearchTopic.value.trim();

  let txt = sys + '\n\n---\n\n## ✅ Dahil Etme Ölçütleri (IC):\n';
  inclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });

  txt += '\n## ❌ Hariç Tutma Ölçütleri (EC):\n';
  exclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });

  // Add mandatory verification steps
  txt += `\n---\n\n## 🔍 DOĞRULAMA ADIMLARI (Her makale için dahili olarak uygula):
Her makale için KARAR VERMEDEN ÖNCE şu adımları sırayla uygula:

**ADIM 1 — KRİTER AYRIŞTIRILMASI**: Her IC kriterini alt-koşullarına ayır. Örneğin bir kriter hem bağlam (ör: eğitim) hem de konu (ör: öneri sistemi) koşulu içeriyorsa, bunları ayrı ayrı kontrol et.

**ADIM 2 — METİNSEL KANIT TARAMASI**: Her alt-koşul için özette AÇIK ve DOĞRUDAN kanıt ara. Dolaylı çıkarım yapma. Genel alanda çalışma (ör: genel amaçlı öneri sistemi) spesifik bir bağlamda (ör: eğitim) çalışma demek DEĞİLDİR.

**ADIM 3 — EC KONTROLÜ**: Herhangi bir EC kriteri eşleşiyor mu kontrol et. Bir tane bile eşleşen varsa → Exclude.

**ADIM 4 — IC TAMAMLILIK KONTROLÜ**: TÜM IC kriterleri (her birinin TÜM alt-koşulları dahil) karşılanıyor mu? Bir tane bile eksik varsa → Include YAPILAMAZ.

**ADIM 5 — NİHAİ KARAR**: Sadece tüm adımlar olumlu ise Include, aksi halde Exclude veya Uncertain.`;

  if (userTopic) {
    txt += `\n---\n\n## 🎯 KULLANICININ ARAŞTIRMA KONUSU & KAPSAMI (ZORUNLU KIYAS):
Konu/Özet: ${userTopic}

Kritik Görev: Makaleyi kullanıcının araştırma konusuyla karşılaştırarak yakınlık skorunu (relevance_score: 0.0 ile 1.0 arası) ve gerekçesini (relevance_rationale) hesapla.

BENZERLİK VE İLGİ PUANLAMA KURALLARI:
1. ANA ODAK ESASLI PUANLAMA: Puanlamayı yaparken makalenin dolaylı veya yan çıkarımlarına değil, doğrudan ANA ODAĞINA (core focus) bakmalısın. Sadece makalede araç olarak kullanılan veya arka planda değinilen dolaylı kelimelere yüksek puan verme.
2. PUANLAMA ÖLÇEĞİ:
   - 0.8 - 1.0 (Çok Yüksek İlgi): Çalışmanın temel amacı, yöntemi veya ana katkısı doğrudan kullanıcının konusuyla çakışıyorsa.
   - 0.5 - 0.7 (Orta İlgi): Çalışmanın ana odağı farklı olsa da önemli bir bölümü veya uygulanan yöntemi kullanıcının konusuyla doğrudan ilgiliyse.
   - 0.1 - 0.4 (Düşük/Dolaylı İlgi): Konu sadece dolaylı olarak geçiyorsa, yan bir araç olarak kullanılıyorsa ya da sadece arka planda/güvenlik/düzenleme boyutunda tartışılıyorsa. (Örneğin: Üretken yapay zeka ile içerik üretimi konusu için deepfake kullanımının yasal regülasyonu/engellenmesi çalışması doğrudan içerik üretimine odaklanmadığından en fazla 0.2 - 0.3 puan almalıdır).
   - 0.0 (Alakasız): Makalenin konuyla doğrudan ya da dolaylı hiçbir ilgisi yoksa.
3. KARAR TUTARLILIĞI: Genellikle dahil etme/hariç tutma kararlarıyla ilgi puanları tutarlı olmalıdır. Bir makale Exclude edilmişse, kullanıcının araştırma konusuna olan ilgi skoru da genellikle düşük (0.0 - 0.4 arası) olmalıdır. Çelişkili yüksek skorlar verme.`;
  } else {
    txt += `\n---\n\n## 🎯 KULLANICI KONUSU:
Konu belirtilmedi. Lütfen 'relevance_score' için null ve 'relevance_rationale' için null döndür.`;
  }

  const allICCodes = inclusion.map(c => `"${c.code}"`).join(', ');

  txt += `\n---\n\n## ÇIKTI FORMATI (JSON)

Sadece şu JSON'u döndür (başka açıklama yok, markdown tagı içermesin veya sadece json kod bloğu içinde):

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
      "rationale": "<her IC/EC kriteri için ayrı ayrı neden eşleştiğini veya eşleşmediğini açıkla>",
      "relevance_score": 0.85, // (veya null)
      "relevance_rationale": "<çalışmanın kullanıcının konusuyla ilişkisi>" // (veya null)
    }
  ]
}
\`\`\`

ZORUNLU KURALLAR:
- "Maybe" YOK, "Uncertain" kullan
- confidence < 0.7 veya karar Uncertain ise veya modeller arası çelişki riski varsa needs_human_review=true
- Title, Abstract, Authors, Year alanlarını ASLA tekrarlama
- decision="Include" ise → matched_inclusion_criteria TÜM IC kodlarını [${allICCodes}] içermelidir, matched_exclusion_criteria BOŞ olmalıdır. Aksi halde Include kararı HATALIDIR.
- decision="Exclude" ise → matched_exclusion_criteria en az bir EC kodu içermeli VEYA rationale'de hangi IC'nin neden karşılanmadığı açıklanmalıdır.
- rationale alanında HER IC için ayrı ayrı kanıt durumunu belirt (ör: "IC1: Özette eğitim bağlamı açıkça belirtilmemiş, genel amaçlı öneri sistemi → karşılanmadı.")`;

  return txt;
}

function buildBatchPrompt(articles, instructions) {
  let p = instructions + '\n\n---\n\n## DEĞERLENDİRİLECEK MAKALELER:\n\n';
  articles.forEach(a => {
    p += `### id: ${a.ID}\n`;
    p += `Başlık: ${a.Title}\n`;
    if (a.Year) p += `Yıl: ${a.Year}\n`;
    if (a.Authors) p += `Yazar(lar): ${a.Authors}\n`;
    p += `Özet: ${a.Abstract}\n\n`;
  });
  p += `\nLütfen yukarıdaki ${articles.length} makale için JSON array döndür.`;
  return p;
}

// ============================================================
// FILE PARSING (CSV / TSV / Excel)
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
  
  // Fuzzy matched mapping
  const idx = {
    id: findMatchedHeader(headers, ALIASES.id),
    title: findMatchedHeader(headers, ALIASES.title),
    abstract: findMatchedHeader(headers, ALIASES.abstract),
    authors: findMatchedHeader(headers, ALIASES.authors),
    year: findMatchedHeader(headers, ALIASES.year)
  };

  if (idx.title === -1 || idx.abstract === -1) {
    throw new Error('Dosyada Title ve Abstract sütunları algılanamadı! Başlık isimlerinin TI, AB veya Başlık, Özet içerdiğinden emin olun.');
  }

  const data = [];
  for (let i = 1; i < rawRows.length; i++) {
    const v = parseCSVLine(rawRows[i], delimiter);
    const row = {
      ID: idx.id !== -1 && v[idx.id] ? v[idx.id].trim() : String(i),
      Title: idx.title !== -1 && v[idx.title] ? v[idx.title].trim() : '',
      Abstract: idx.abstract !== -1 && v[idx.abstract] ? v[idx.abstract].trim() : '',
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
  
  const idCol = headers[findMatchedHeader(headers, ALIASES.id)];
  const tiCol = headers[findMatchedHeader(headers, ALIASES.title)];
  const abCol = headers[findMatchedHeader(headers, ALIASES.abstract)];
  const auCol = headers[findMatchedHeader(headers, ALIASES.authors)];
  const yrCol = headers[findMatchedHeader(headers, ALIASES.year)];

  if (!tiCol || !abCol) {
    throw new Error(`Excel dosyasında Title ve Abstract sütunları algılanamadı!\nAlgılanan sütunlar: ${headers.slice(0, 10).join(', ')}`);
  }

  return json.map((row, i) => ({
    ID: idCol ? String(row[idCol] || (i + 1)) : String(i + 1),
    Title: String(row[tiCol] || '').trim(),
    Abstract: String(row[abCol] || '').trim(),
    Authors: auCol ? String(row[auCol] || '').trim() : '',
    Year: yrCol ? String(row[yrCol] || '').trim() : ''
  })).filter(r => r.Title || r.Abstract);
}

// File Input trigger
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
    if (!state.csvData.length) throw new Error('Dosya boş veya uyumsuz!');

    state.totalCount = state.csvData.length;
    state.fileHash = await hashString(JSON.stringify(state.csvData.map(a => a.ID + a.Title)));

    showSuccess(`${state.csvData.length} makale başarıyla yüklendi.`);
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
  return Math.ceil(text.length / 4);
}

function updateCostEstimate() {
  if (!state.csvData.length) {
    el.costEstimatePanel.style.display = 'none';
    return;
  }
  
  const instructions = buildSystemInstructions();
  const instructionTokens = estimateTokens(instructions);
  const batchSize = parseInt(el.batchSize.value) || 5;
  const numBatches = Math.ceil(state.csvData.length / batchSize);
  
  const avgArticleTokens = state.csvData.reduce((s, a) =>
    s + estimateTokens(a.Title + a.Abstract + a.Year), 0) / state.csvData.length;
    
  const totalArticles = state.csvData.length;
  const avgOutputPerArticle = 250; 
  
  let totalSyncCost = 0;
  let totalBatchCost = 0;
  
  let syncInputTokensSum = 0;
  let batchInputTokensSum = 0;
  let totalOutputTokensSum = totalArticles * avgOutputPerArticle * state.activeModels.length;

  state.activeModels.forEach(modelId => {
    const m = MODELS[modelId] || MODELS['gemini-3.5-flash'];
    
    // Sync tokens for this model
    const syncInputTokens = numBatches * instructionTokens + totalArticles * avgArticleTokens;
    syncInputTokensSum += syncInputTokens;
    totalSyncCost += (syncInputTokens/1e6)*m.standard.inputPrice + (totalArticles*avgOutputPerArticle/1e6)*m.standard.outputPrice;
    
    // Async tokens (Gemini only)
    const asyncInputTokens = totalArticles * (instructionTokens + avgArticleTokens);
    batchInputTokensSum += asyncInputTokens;
    totalBatchCost += (asyncInputTokens/1e6)*m.batch.inputPrice + (totalArticles*avgOutputPerArticle/1e6)*m.batch.outputPrice;
  });

  el.costEstimatePanel.style.display = 'block';
  el.estTotalArticles.textContent = totalArticles.toLocaleString();
  el.estInputTokens.textContent = `~${formatTokens(state.mode === 'async' ? batchInputTokensSum : syncInputTokensSum)}`;
  el.estOutputTokens.textContent = `~${formatTokens(totalOutputTokensSum)}`;

  el.estSyncCost.textContent = formatCost(totalSyncCost) + (state.mode === 'sync' ? ' (Seçili)' : '');
  el.estBatchCost.textContent = formatCost(totalBatchCost) + (state.mode === 'async' ? ' (Seçili)' : '');

  const hasPaid = state.activeModels.some(m => !MODELS[m]?.freeTierAvailable);
  if (hasPaid) {
    el.freeTierNote.textContent = '⚠️ Seçili modellerden bazıları ücretlidir. Kotanız aşılırsa faturalandırılırsınız.';
  } else {
    el.freeTierNote.textContent = '✓ Seçili modeller ücretsiz limitlere sahiptir.';
  }
}

function formatTokens(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function formatCost(usd) {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return '$' + usd.toFixed(4);
  return '$' + usd.toFixed(2);
}

// ============================================================
// LIVE COST PANEL
// ============================================================
function updateLiveCost() {
  const isFree = state.activeModels.every(m => MODELS[m]?.freeTierAvailable);
  el.livMode.textContent = state.mode === 'async' ? 'Async (Batch -50%)' : 'Sync (Standard)';
  el.livInputTokens.textContent = formatTokens(state.totalInputTokens);
  el.livOutputTokens.textContent = formatTokens(state.totalOutputTokens);
  el.livCost.textContent = formatCost(state.totalCostUSD);
  el.livFreeTier.textContent = isFree ? '✓ Evet (Ücretsiz limitler)' : '✗ Bazı modeller ücretli';
}

function accumulateCost(inputTokens, outputTokens, tier, modelId) {
  const m = MODELS[modelId] || MODELS['gemini-3.5-flash'];
  const p = m[tier] || m.standard;
  state.totalInputTokens += inputTokens;
  state.totalOutputTokens += outputTokens;
  state.totalCostUSD += (inputTokens/1e6)*p.inputPrice + (outputTokens/1e6)*p.outputPrice;
}

// ============================================================
// UNIVERSAL API CALL ROUTER
// ============================================================
async function callModelAPI(prompt, modelId) {
  const isGemini = modelId.startsWith('gemini') || (modelId === 'custom' && state.customModelSpecs.provider === 'gemini');
  const isDeepseek = modelId === 'deepseekv4pro' || (modelId === 'custom' && state.customModelSpecs.provider === 'deepseek');
  const isOpenai = modelId.startsWith('gpt') || (modelId === 'custom' && state.customModelSpecs.provider === 'openai');
  
  if (isGemini) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callGeminiAPI(prompt, apiModelId);
  } else if (isDeepseek) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callDeepseekAPI(prompt, apiModelId);
  } else if (isOpenai) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callOpenaiAPI(prompt, apiModelId);
  } else {
    throw new Error(`Bilinmeyen API Sağlayıcısı: ${modelId}`);
  }
}

async function callGeminiAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(KEY_KEY) || el.apiKey.value.trim();
  if (!key) throw new Error('Gemini API Key eksik!');

  let baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'gemini' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/models/${apiModelId}:generateContent?key=${key}`;
  
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
        await sleep(wait * 1000);
        return callGeminiAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`Gemini API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const inT = data.usageMetadata?.promptTokenCount || 0;
    const outT = data.usageMetadata?.candidatesTokenCount || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callGeminiAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

async function callOpenaiAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(OPENAI_KEY_KEY) || el.openaiApiKey.value.trim() || sessionStorage.getItem(CUSTOM_KEY_KEY) || el.customApiKey.value.trim();
  if (!key) throw new Error('OpenAI API Key eksik!');
  
  let baseUrl = 'https://api.openai.com/v1';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'openai' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: apiModelId,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        await sleep(wait * 1000);
        return callOpenaiAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`OpenAI API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inT = data.usage?.prompt_tokens || 0;
    const outT = data.usage?.completion_tokens || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callOpenaiAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

async function callDeepseekAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(DEEPSEEK_KEY_KEY) || el.deepseekApiKey.value.trim() || sessionStorage.getItem(CUSTOM_KEY_KEY) || el.customApiKey.value.trim();
  if (!key) throw new Error('DeepSeek API Key eksik!');
  
  let baseUrl = 'https://api.deepseek.com';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'deepseek' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: apiModelId,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        await sleep(wait * 1000);
        return callDeepseekAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`DeepSeek API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inT = data.usage?.prompt_tokens || 0;
    const outT = data.usage?.completion_tokens || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callDeepseekAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

// ============================================================
// ANALYSIS HANDLER
// ============================================================
el.analyzeBtn.addEventListener('click', async () => {
  // Check API keys
  state.apiKey = el.apiKey.value.trim();
  state.openaiApiKey = el.openaiApiKey.value.trim();
  state.deepseekApiKey = el.deepseekApiKey.value.trim();
  state.customApiKey = el.customApiKey.value.trim();
  
  if (!state.csvData.length) { showError('Lütfen önce dosya yükleyin!'); return; }

  // Verify that needed keys are populated
  const hasGemini = state.activeModels.some(m => m.startsWith('gemini') || (m === 'custom' && state.customModelSpecs.provider === 'gemini'));
  const hasOpenai = state.activeModels.some(m => m.startsWith('gpt') || (m === 'custom' && state.customModelSpecs.provider === 'openai'));
  const hasDeepseek = state.activeModels.some(m => m === 'deepseekv4pro' || (m === 'custom' && state.customModelSpecs.provider === 'deepseek'));
  
  if (hasGemini && !state.apiKey && !sessionStorage.getItem(KEY_KEY)) { showError('Lütfen Gemini API key girin!'); return; }
  if (hasOpenai && !state.openaiApiKey && !sessionStorage.getItem(OPENAI_KEY_KEY)) { showError('Lütfen OpenAI API key girin!'); return; }
  if (hasDeepseek && !state.deepseekApiKey && !sessionStorage.getItem(DEEPSEEK_KEY_KEY)) { showError('Lütfen DeepSeek API key girin!'); return; }

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
// SYNC MODE: Parallel calls for selected models
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

      // Query active models in parallel for this batch
      const modelPromises = state.activeModels.map(async (modelId) => {
        try {
          const prompt = buildBatchPrompt(batch, instructions);
          const response = await callModelAPI(prompt, modelId);
          
          accumulateCost(response.usage.promptTokens, response.usage.completionTokens, 'standard', modelId);
          const parsed = parseModelResponse(response.text);
          return { modelId, results: parsed, error: null };
        } catch (e) {
          console.error(`Model ${modelId} execution error:`, e);
          return { modelId, results: [], error: e.message };
        }
      });

      const modelBatchResults = await Promise.all(modelPromises);

      const hasTopic = el.userResearchTopic.value.trim().length > 0;
      const { inclusion, exclusion } = getCriteriaCodes();

      // Merge results
      const merged = batch.map(article => {
        const modelDecisions = {};
        let primaryResult = null;

        modelBatchResults.forEach(({ modelId, results, error }) => {
          const apiR = results.find(r => String(r.id) === String(article.ID)) || {
            summary_tr: error ? `API Hatası: ${error}` : 'API yanıtında makale bulunamadı',
            decision: 'Uncertain',
            confidence: 0,
            matched_inclusion_criteria: [],
            matched_exclusion_criteria: [],
            needs_human_review: true,
            rationale: error ? `Model hatası: ${error}` : 'Yanıt ayrıştırılamadı',
            relevance_score: null,
            relevance_rationale: ''
          };

          // Client-side IC/EC validation guard
          const validatedDecision = apiR.decision || 'Uncertain';
          const matchedIC = apiR.matched_inclusion_criteria || [];
          const matchedEC = apiR.matched_exclusion_criteria || [];
          let finalDecision = validatedDecision;
          let finalConfidence = typeof apiR.confidence === 'number' ? apiR.confidence : 0;
          let finalNeedsReview = false;
          let rationale = apiR.rationale || '';

          if (finalDecision === 'Include') {
            // GUARD 1: Include requires ALL IC codes to be matched
            const allICCodes = inclusion.map(c => c.code);
            const missingICs = allICCodes.filter(ic => !matchedIC.includes(ic));
            if (missingICs.length > 0) {
              finalDecision = 'Uncertain';
              finalNeedsReview = true;
              rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${missingICs.join(', ')} kriterleri karşılanmamış → otomatik Uncertain'a düşürüldü]`;
            }
            // GUARD 2: Include cannot have any EC matches
            if (matchedEC.length > 0) {
              finalDecision = 'Exclude';
              finalNeedsReview = true;
              rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${matchedEC.join(', ')} hariç tutma kriterleri eşleşmiş → otomatik Exclude'a düşürüldü]`;
            }
          }

          modelDecisions[modelId] = {
            decision: finalDecision,
            confidence: finalConfidence,
            matched_inclusion_criteria: matchedIC,
            matched_exclusion_criteria: matchedEC,
            rationale: rationale,
            summary_tr: apiR.summary_tr || '',
            relevance_score: (hasTopic && typeof apiR.relevance_score === 'number') ? apiR.relevance_score : null,
            relevance_rationale: hasTopic ? (apiR.relevance_rationale || '') : '',
            needs_human_review: finalNeedsReview || (typeof apiR.needs_human_review === 'boolean' ? apiR.needs_human_review : false)
          };

          if (modelId === state.activeModels[0]) {
            primaryResult = apiR;
          }
        });

        if (!primaryResult) {
          primaryResult = Object.values(modelDecisions)[0];
        }

        // Consensus logic
        const decisions = Object.values(modelDecisions).map(d => d.decision);
        const uniqueDecisions = [...new Set(decisions)];
        
        let consensusDecision = 'Uncertain';
        let needsHuman = false;

        if (uniqueDecisions.length === 1) {
          consensusDecision = uniqueDecisions[0];
          needsHuman = Object.values(modelDecisions).some(d => d.confidence < 0.7);
        } else {
          consensusDecision = 'Uncertain';
          needsHuman = true; // Disagreement defaults to uncertain & review
        }

        // Avg relevance score
        const relScores = Object.values(modelDecisions)
          .map(d => d.relevance_score)
          .filter(v => typeof v === 'number' && v !== null);
        const avgRelevance = (hasTopic && relScores.length > 0)
          ? relScores.reduce((sum, v) => sum + v, 0) / relScores.length
          : null;

        return {
          id: article.ID,
          authors: article.Authors || '',
          title: article.Title,
          year: article.Year || '',
          abstract: article.Abstract,
          summary_tr: primaryResult.summary_tr || '',
          decision: consensusDecision, // Pre-filled default decision
          confidence: primaryResult.confidence,
          matched_inclusion_criteria: primaryResult.matched_inclusion_criteria || [],
          matched_exclusion_criteria: primaryResult.matched_exclusion_criteria || [],
          needs_human_review: needsHuman,
          rationale: primaryResult.rationale || '',
          relevance_score: avgRelevance,
          relevance_rationale: hasTopic ? (primaryResult.relevance_rationale || '') : '',
          modelDecisions: modelDecisions
        };
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
    showError('Hata: ' + err.message + ' — Sonuçlar yarıda kalmış olabilir.');
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

function parseModelResponse(text) {
  let jsonText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const m = jsonText.match(/\{[\s\S]*\}/);
  if (m) jsonText = m[0];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.results)) return parsed.results;
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch (e) {
    console.error('Response structure extraction error:', e, text);
    return [];
  }
}

// ============================================================
// GEMINI NATIVE ASYNC BATCH API
// ============================================================
async function runAsyncBatch() {
  analyzing = true;
  el.analyzeBtn.disabled = true;
  el.batchJobInfo.style.display = 'block';

  try {
    const instructions = buildSystemInstructions();
    const primaryModel = state.activeModels[0] || 'gemini-3.5-flash';

    el.progressText.textContent = 'Async Batch hazırlanıyor...';
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:batchGenerateContent?key=${state.apiKey}`;
    const body = {
      batch: {
        display_name: `screening-${Date.now()}`,
        input_config: { requests: { requests } }
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
    const jobName = data.name;

    state.batchJobName = jobName;
    state.batchSubmittedAt = Date.now();
    el.batchJobName.textContent = jobName;
    el.batchJobState.textContent = 'GÖNDERİLDİ';
    saveState();

    el.progressText.textContent = `✓ Job ${jobName} başlatıldı. Durum sorgulanıyor...`;
    await pollAndProcessBatchJob();
  } catch (err) {
    showError('Async Batch API hatası: ' + err.message);
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

async function pollAndProcessBatchJob() {
  pollAbortController = new AbortController();
  const startTime = state.batchSubmittedAt || Date.now();

  while (true) {
    if (pollAbortController.signal.aborted) {
      el.progressText.textContent = 'Polling iptal edildi.';
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${state.batchJobName}?key=${state.apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(`Job status fetch error ${resp.status}`);
    }
    const job = await resp.json();
    
    state.batchLastState = job.metadata?.state || 'UNKNOWN';
    el.batchJobState.textContent = state.batchLastState;
    saveState();

    const elapsedMin = Math.round((Date.now() - startTime) / 60000);
    el.progressText.textContent = `Job: ${state.batchLastState} (${elapsedMin} dk)`;

    if (state.batchLastState === 'JOB_STATE_SUCCEEDED' || state.batchLastState === 'SUCCEEDED') {
      await processBatchJobResults(job);
      return;
    }
    if (['JOB_STATE_FAILED', 'FAILED', 'JOB_STATE_CANCELLED', 'CANCELLED'].includes(state.batchLastState)) {
      throw new Error(`Job sonlandı: ${state.batchLastState}.`);
    }

    await sleep(45000); 
  }
}

async function processBatchJobResults(job) {
  el.progressText.textContent = 'Sonuçlar işleniyor...';
  const inlined = job.response?.inlinedResponses?.inlinedResponses || [];

  if (!inlined.length && job.response?.responsesFile) {
    await fetchAndProcessFile(job.response.responsesFile);
    return;
  }

  inlined.forEach(item => {
    const key = item.key;
    const article = state.batchKeyMap[key];
    if (!article) return;

    let apiResult;
    const modelId = state.activeModels[0] || 'gemini-3.5-flash';
    if (item.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = item.response.candidates[0].content.parts[0].text;
      const parsed = parseModelResponse(text);
      apiResult = parsed[0] || getFallbackResult(null);
      
      if (item.response.usageMetadata) {
        accumulateCost(item.response.usageMetadata.promptTokenCount || 0,
                       item.response.usageMetadata.candidatesTokenCount || 0, 'batch', modelId);
      }
    } else {
      apiResult = getFallbackResult(item.error?.message);
    }

    const merged = mergeResultSingleModel(article, apiResult, modelId);
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
  if (!resp.ok) throw new Error(`Output file download failed.`);
  const text = await resp.text();
  const lines = text.split('\n').filter(Boolean);
  const modelId = state.activeModels[0] || 'gemini-3.5-flash';

  lines.forEach(line => {
    try {
      const item = JSON.parse(line);
      const key = item.key;
      const article = state.batchKeyMap[key];
      if (!article) return;
      const respText = item.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseModelResponse(respText);
      const apiResult = parsed[0] || getFallbackResult(null);
      
      if (item.response?.usageMetadata) {
        accumulateCost(item.response.usageMetadata.promptTokenCount || 0,
                       item.response.usageMetadata.candidatesTokenCount || 0, 'batch', modelId);
      }
      const merged = mergeResultSingleModel(article, apiResult, modelId);
      state.results.push(merged);
      appendRowToTable(merged);
    } catch (e) {
      console.error('Line response parsing error:', e);
    }
  });
  el.progressBar.style.width = '100%';
  el.progressText.textContent = '✅ Async batch tamamlandı!';
  updateStats();
  updateLiveCost();
  clearStateOnComplete();
}

function getFallbackResult(errorMsg) {
  return {
    summary_tr: 'Ayrıştırma hatası / Yanıt alınamadı',
    decision: 'Uncertain', confidence: 0,
    matched_inclusion_criteria: [], matched_exclusion_criteria: [],
    needs_human_review: true, rationale: errorMsg || 'Yanıt boş veya şablon dışı.',
    relevance_score: null, relevance_rationale: ''
  };
}

function mergeResultSingleModel(article, apiResult, modelId) {
  const hasTopic = el.userResearchTopic.value.trim().length > 0;
  const { inclusion } = getCriteriaCodes();

  // Client-side IC/EC validation guard
  const matchedIC = apiResult.matched_inclusion_criteria || [];
  const matchedEC = apiResult.matched_exclusion_criteria || [];
  let finalDecision = apiResult.decision || 'Uncertain';
  let finalConfidence = typeof apiResult.confidence === 'number' ? apiResult.confidence : 0;
  let finalNeedsReview = apiResult.needs_human_review === true;
  let rationale = apiResult.rationale || '';

  if (finalDecision === 'Include') {
    const allICCodes = inclusion.map(c => c.code);
    const missingICs = allICCodes.filter(ic => !matchedIC.includes(ic));
    if (missingICs.length > 0) {
      finalDecision = 'Uncertain';
      finalNeedsReview = true;
      rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${missingICs.join(', ')} kriterleri karşılanmamış → otomatik Uncertain'a düşürüldü]`;
    }
    if (matchedEC.length > 0) {
      finalDecision = 'Exclude';
      finalNeedsReview = true;
      rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${matchedEC.join(', ')} hariç tutma kriterleri eşleşmiş → otomatik Exclude'a düşürüldü]`;
    }
  }

  const decisions = {};
  decisions[modelId] = {
    decision: finalDecision,
    confidence: finalConfidence,
    matched_inclusion_criteria: matchedIC,
    matched_exclusion_criteria: matchedEC,
    rationale: rationale,
    summary_tr: apiResult.summary_tr || '',
    relevance_score: (hasTopic && typeof apiResult.relevance_score === 'number') ? apiResult.relevance_score : null,
    relevance_rationale: hasTopic ? (apiResult.relevance_rationale || '') : '',
    needs_human_review: finalNeedsReview
  };

  return {
    id: article.ID,
    authors: article.Authors || '',
    title: article.Title,
    year: article.Year || '',
    abstract: article.Abstract,
    summary_tr: apiResult.summary_tr || '',
    decision: finalDecision,
    confidence: finalConfidence,
    matched_inclusion_criteria: matchedIC,
    matched_exclusion_criteria: matchedEC,
    needs_human_review: finalNeedsReview,
    rationale: rationale,
    relevance_score: (hasTopic && typeof apiResult.relevance_score === 'number') ? apiResult.relevance_score : null,
    relevance_rationale: hasTopic ? (apiResult.relevance_rationale || '') : '',
    modelDecisions: decisions
  };
}

// ============================================================
// ROW RENDERING & USER INTERACTIVE CONTROLS
// ============================================================
function renderCollapsibleCell(td, text) {
  td.textContent = '';
  if (!text) {
    td.textContent = '-';
    return;
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  if (sentences.length <= 2 && text.length < 220) {
    td.textContent = text;
    return;
  }
  const container = document.createElement('div');
  container.className = 'collapsible-text-container collapsed';
  
  const previewSpan = document.createElement('span');
  previewSpan.className = 'text-preview';
  let previewText = sentences.slice(0, 2).join('');
  if (previewText.length > 220) {
    previewText = text.substring(0, 180) + '...';
  }
  previewSpan.textContent = previewText;
  
  const fullSpan = document.createElement('span');
  fullSpan.className = 'text-full';
  fullSpan.textContent = text;
  fullSpan.style.display = 'none';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn-toggle-text';
  toggleBtn.textContent = ' (devamını göster)';
  
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isCollapsed = container.classList.contains('collapsed');
    if (isCollapsed) {
      container.classList.remove('collapsed');
      previewSpan.style.display = 'none';
      fullSpan.style.display = 'inline';
      toggleBtn.textContent = ' (daha az göster)';
    } else {
      container.classList.add('collapsed');
      previewSpan.style.display = 'inline';
      fullSpan.style.display = 'none';
      toggleBtn.textContent = ' (devamını göster)';
    }
  });
  
  container.appendChild(previewSpan);
  container.appendChild(fullSpan);
  container.appendChild(toggleBtn);
  td.appendChild(container);
}

function appendRowToTable(r) {
  const row = document.createElement('tr');
  row.dataset.decision = r.decision;
  row.dataset.review = r.needs_human_review ? '1' : '0';

  const cellData = [
    { text: r.id, collapsible: false },
    { text: r.authors || 'Belirtilmemiş', collapsible: false },
    { text: r.title, collapsible: false },
    { text: r.year, collapsible: false },
    { text: r.abstract, collapsible: true },
    { text: r.summary_tr, collapsible: true }
  ];
  
  cellData.forEach(c => {
    const td = document.createElement('td');
    if (c.collapsible) {
      renderCollapsibleCell(td, c.text);
    } else {
      td.textContent = c.text;
    }
    row.appendChild(td);
  });

  // Model Decisions column
  const tdMD = document.createElement('td');
  if (r.modelDecisions && Object.keys(r.modelDecisions).length > 0) {
    Object.entries(r.modelDecisions).forEach(([mId, info]) => {
      const div = document.createElement('div');
      div.className = 'model-decision-item';
      
      const label = document.createElement('span');
      label.className = 'model-decision-name';
      label.textContent = MODELS[mId]?.label.split(' (')[0] || mId;
      
      const badge = document.createElement('span');
      badge.className = `decision-badge decision-${info.decision.toLowerCase()}`;
      badge.textContent = info.decision;
      
      div.appendChild(label);
      div.appendChild(badge);
      tdMD.appendChild(div);
    });
  } else {
    const badge = document.createElement('span');
    badge.className = `decision-badge decision-${(r.decision || 'uncertain').toLowerCase()}`;
    badge.textContent = r.decision;
    tdMD.appendChild(badge);
  }
  row.appendChild(tdMD);

  // Interactive Nihai Karar Dropdown
  const tdFinal = document.createElement('td');
  const select = document.createElement('select');
  select.className = `final-decision-select select-${r.decision.toLowerCase()}`;
  
  ['Include', 'Exclude', 'Uncertain'].forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    if (r.decision === opt) o.selected = true;
    select.appendChild(o);
  });
  
  select.addEventListener('change', () => {
    r.decision = select.value;
    select.className = `final-decision-select select-${r.decision.toLowerCase()}`;
    row.dataset.decision = r.decision;
    updateStats();
    applyFilters();
    saveState();
  });
  tdFinal.appendChild(select);
  row.appendChild(tdFinal);

  // Confidence
  const tdC = document.createElement('td');
  tdC.textContent = r.confidence !== null ? r.confidence.toFixed(2) : '-';
  if (r.confidence !== null && r.confidence < 0.7) tdC.style.color = 'var(--danger)';
  row.appendChild(tdC);

  // IC
  const tdIC = document.createElement('td');
  tdIC.textContent = r.matched_inclusion_criteria.join(', ');
  row.appendChild(tdIC);

  // EC
  const tdEC = document.createElement('td');
  tdEC.textContent = r.matched_exclusion_criteria.join(', ');
  row.appendChild(tdEC);

  // Relevance Score progress bar
  const tdRel = document.createElement('td');
  if (typeof r.relevance_score === 'number') {
    const container = document.createElement('div');
    container.className = 'relevance-container';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'relevance-text';
    textSpan.textContent = `${Math.round(r.relevance_score * 100)}%`;
    if (r.relevance_rationale) {
      textSpan.title = r.relevance_rationale;
    }
    
    const bgBar = document.createElement('div');
    bgBar.className = 'relevance-bar-bg';
    
    const fillBar = document.createElement('div');
    fillBar.className = 'relevance-bar-fill';
    fillBar.style.width = `${Math.round(r.relevance_score * 100)}%`;
    
    bgBar.appendChild(fillBar);
    container.appendChild(textSpan);
    container.appendChild(bgBar);
    tdRel.appendChild(container);
  } else {
    tdRel.textContent = '-';
  }
  row.appendChild(tdRel);

  // Needs review
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

  // Toggle dynamic report button
  const userTopic = el.userResearchTopic.value.trim();
  if (state.results.length > 0 && userTopic) {
    el.relevanceReportBtn.style.display = 'inline-flex';
  } else {
    el.relevanceReportBtn.style.display = 'none';
  }

  // Toggle global toggle all abstracts button
  const hasCollapsible = document.querySelector('.collapsible-text-container') !== null;
  el.toggleAllAbstractsBtn.style.display = hasCollapsible ? 'inline-flex' : 'none';
}

// ============================================================
// FILTERING
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
// CLOSEST PAPERS (RELEVANCE) REPORT
// ============================================================
function showRelevanceReport() {
  const tbody = el.modalReportBody;
  tbody.innerHTML = '';

  // Filter out invalid relevance scores, then sort desc
  const sorted = [...state.results]
    .filter(r => typeof r.relevance_score === 'number')
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 10);

  if (sorted.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.textContent = 'Henüz benzerlik skorlaması yapılmış makale bulunamadı.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    sorted.forEach((r, index) => {
      const tr = document.createElement('tr');

      const tdIndex = document.createElement('td');
      tdIndex.textContent = String(index + 1);
      tr.appendChild(tdIndex);

      const tdId = document.createElement('td');
      tdId.textContent = r.id;
      tr.appendChild(tdId);

      const tdTitle = document.createElement('td');
      tdTitle.textContent = r.title;
      tr.appendChild(tdTitle);

      const tdYear = document.createElement('td');
      tdYear.textContent = r.year || '-';
      tr.appendChild(tdYear);

      const tdScore = document.createElement('td');
      tdScore.textContent = `${Math.round(r.relevance_score * 100)}%`;
      tdScore.style.fontWeight = '700';
      tdScore.style.color = 'var(--accent-teal)';
      tr.appendChild(tdScore);

      const tdDec = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `decision-${r.decision.toLowerCase()}`;
      badge.textContent = r.decision;
      tdDec.appendChild(badge);
      tr.appendChild(tdDec);

      const tdRat = document.createElement('td');
      tdRat.textContent = r.relevance_rationale || 'İlişki gerekçesi yazılmamış.';
      tr.appendChild(tdRat);

      tbody.appendChild(tr);
    });
  }

  el.reportModal.style.display = 'flex';
}

// ============================================================
// EXPORT EXCEL / CSV
// ============================================================
async function getPromptVersion() {
  const instr = buildSystemInstructions();
  const hash = await hashString(instr);
  return { hash, instructions: instr };
}

function buildMetadataRows(promptInfo) {
  const m = MODELS[state.activeModels[0]];
  const tier = state.mode === 'async' ? 'batch' : 'standard';
  const { inclusion, exclusion } = getCriteriaCodes();
  return [
    ['Anahtar', 'Değer'],
    ['Tarih (UTC)', new Date().toISOString()],
    ['Aktif Modeller', state.activeModels.join(', ')],
    ['Model 1 (Birincil)', state.activeModels[0]],
    ['Mod', state.mode],
    ['Tier', tier],
    ['Prompt Versiyon Hash (sha256[0:8])', promptInfo.hash],
    ['Toplam Makale Sayısı', state.totalCount],
    ['Değerlendirilen Makale Sayısı', state.results.length],
    ['Toplam Input Token', state.totalInputTokens],
    ['Toplam Output Token', state.totalOutputTokens],
    ['Toplam Tahmini Maliyet (USD)', state.totalCostUSD.toFixed(6)],
    ['', ''],
    ['Dahil Etme Kriterleri (IC):', ''],
    ...inclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Hariç Tutma Kriterleri (EC):', ''],
    ...exclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Yapay Zeka Çalışma Konusu:', ''],
    ['Konu & Özet', el.userResearchTopic.value.trim() || 'Girilmedi'],
    ['', ''],
    ['Sistem Promptu (Tam Metin):', ''],
    ['Prompt', promptInfo.instructions]
  ];
}

el.downloadCsvBtn.addEventListener('click', async () => {
  if (!state.results.length) { showError('Henüz indirilecek sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();
  const meta = buildMetadataRows(promptInfo);
  const metaCsv = meta.map(([k,v]) =>
    `# ${String(k).replace(/[\r\n]/g,' ')}\t${String(v).replace(/[\r\n]/g,' ')}`
  ).join('\n');

  const headers = [
    'ID', 'Yazar(lar)', 'Başlık', 'Yıl', 'Abstract (Orijinal)', 'Türkçe Özet',
    'Model Kararları', 'Nihai Karar', 'Güven', 'IC', 'EC', 'Konu İlgisi (Skor)', 'İlişki Gerekçesi', 'İnceleme', 'Gerekçe'
  ];
  
  const rows = state.results.map(r => {
    let modelDecsStr = '';
    if (r.modelDecisions) {
      modelDecsStr = Object.entries(r.modelDecisions)
        .map(([mId, info]) => `${MODELS[mId]?.label.split(' (')[0] || mId}: ${info.decision}`)
        .join('; ');
    } else {
      modelDecsStr = r.decision;
    }
    
    return [
      r.id, r.authors, r.title, r.year, r.abstract, r.summary_tr,
      modelDecsStr, r.decision,
      r.confidence !== null ? r.confidence.toFixed(2) : '',
      r.matched_inclusion_criteria.join(';'),
      r.matched_exclusion_criteria.join(';'),
      typeof r.relevance_score === 'number' ? `${Math.round(r.relevance_score * 100)}%` : '',
      r.relevance_rationale || '',
      r.needs_human_review ? 'Yes' : 'No',
      r.rationale
    ];
  });
  
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
  if (!state.results.length) { showError('Henüz indirilecek sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();

  const data = state.results.map(r => {
    let modelDecsStr = '';
    if (r.modelDecisions) {
      modelDecsStr = Object.entries(r.modelDecisions)
        .map(([mId, info]) => `${MODELS[mId]?.label.split(' (')[0] || mId}: ${info.decision}`)
        .join('; ');
    } else {
      modelDecsStr = r.decision;
    }
    
    return {
      'ID': r.id,
      'Yazar(lar)': r.authors,
      'Başlık': r.title,
      'Yıl': r.year,
      'Abstract (Orijinal)': r.abstract,
      'Türkçe Özet': r.summary_tr,
      'Model Kararları': modelDecsStr,
      'Nihai Karar': r.decision,
      'Güven': r.confidence !== null ? r.confidence.toFixed(2) : '',
      'IC': r.matched_inclusion_criteria.join(';'),
      'EC': r.matched_exclusion_criteria.join(';'),
      'Konu İlgisi (Skor)': typeof r.relevance_score === 'number' ? `${Math.round(r.relevance_score * 100)}%` : '',
      'İlişki Gerekçesi': r.relevance_rationale || '',
      'İnceleme Gerekli': r.needs_human_review ? 'Yes' : 'No',
      'Gerekçe': r.rationale,
      'Prompt Versiyon': promptInfo.hash
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 }, { wch: 25 }, { wch: 50 }, { wch: 8 }, { wch: 60 },
    { wch: 50 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 15 },
    { wch: 15 }, { wch: 18 }, { wch: 40 }, { wch: 12 }, { wch: 50 }, { wch: 12 }
  ];

  const metaWs = XLSX.utils.aoa_to_sheet(buildMetadataRows(promptInfo));
  metaWs['!cols'] = [{ wch: 35 }, { wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
  XLSX.writeFile(wb, `screening_results_${new Date().toISOString().split('T')[0]}_v${promptInfo.hash}.xlsx`);
});

// ============================================================
// STATE SAVING & RELOADING
// ============================================================
function saveState() {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      mode: state.mode,
      activeModels: state.activeModels,
      customModelSpecs: state.customModelSpecs,
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
  } catch (e) {
    console.warn('Oturum durumu kaydedilemedi:', e);
  }
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
      el.resumeText.textContent = `Yarım kalan Async Batch: ${s.batchJobName} | Model: ${s.activeModels[0]} | Gönderim: ${elapsedMin} dk önce.`;
    } else {
      el.resumeText.textContent = `Yarım kalan Sync analiz: ${s.results.length}/${s.totalCount} makale işlendi.`;
    }

    el.resumeBtn.onclick = async () => {
      Object.assign(state, s);
      localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
      
      renderModelSlots();
      updateApiKeyInputsVisibility();
      updateModelInfo();
      updateModeUI();
      
      el.resumeBanner.style.display = 'none';
      el.resultsSection.style.display = 'block';
      el.progressSection.style.display = 'block';
      el.resultsBody.textContent = '';
      
      state.results.forEach(r => appendRowToTable(r));
      updateStats();
      updateLiveCost();

      if (isAsync) {
        el.batchJobInfo.style.display = 'block';
        el.batchJobName.textContent = s.batchJobName;
        el.batchJobState.textContent = s.batchLastState;
        analyzing = true;
        try {
          await pollAndProcessBatchJob();
        } catch (err) {
          showError('Polling hatası: ' + err.message);
        } finally {
          analyzing = false;
        }
      } else {
        await runSyncBatch();
      }
    };

    el.discardBtn.onclick = () => {
      sessionStorage.removeItem(STATE_KEY);
      el.resumeBanner.style.display = 'none';
    };
  } catch (e) {
    console.warn('Oturum kurtarılamadı:', e);
  }
}

function clearStateOnComplete() {
  sessionStorage.removeItem(STATE_KEY);
}

// ============================================================
// HELPERS
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showError(msg) {
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = '❌ ' + msg;
  const target = document.querySelector('.upload-section');
  target.insertBefore(div, target.firstChild);
  setTimeout(() => div.remove(), 9000);
}

function showSuccess(msg) {
  const div = document.createElement('div');
  div.className = 'success-message';
  div.textContent = '✅ ' + msg;
  const target = document.querySelector('.upload-section');
  target.insertBefore(div, target.firstChild);
  setTimeout(() => div.remove(), 5000);
}
