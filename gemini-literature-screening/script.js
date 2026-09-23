// ============================================================
// GEMINI LITERATURE SCREENING — v12 (web UI)
// Parallel multi-key screening · multi-model consensus ·
// criterion-level decision rule · resumable (IndexedDB)
// Engine: screening-core.js (window.ScreeningCore)
// ============================================================
/* global ScreeningCore, XLSX */
const C = window.ScreeningCore;

// Model registry — prices (USD / 1M tokens) and free-tier limits are
// informational; override limits in the UI for paid tiers.
const MODELS = {
  'gemini-3.5-flash': {
    label: 'Gemini 3.5 Flash', provider: 'gemini', apiModelId: 'gemini-3.5-flash',
    standard: { inputPrice: 0.075, outputPrice: 0.30 }, batch: { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, rpm: 15, rpd: 1500, tpm: 1000000
  },
  'gemini-3.5-flash-lite': {
    label: 'Gemini 3.5 Flash Lite', provider: 'gemini', apiModelId: 'gemini-3.5-flash-lite',
    standard: { inputPrice: 0.05, outputPrice: 0.20 }, batch: { inputPrice: 0.025, outputPrice: 0.10 },
    freeTierAvailable: true, rpm: 15, rpd: 500, tpm: 250000
  },
  'gemini-3.1-flash-lite-preview': {
    label: 'Gemini 3.1 Flash Lite (Preview)', provider: 'gemini', apiModelId: 'gemini-3.1-flash-lite-preview',
    standard: { inputPrice: 0.25, outputPrice: 1.50 }, batch: { inputPrice: 0.125, outputPrice: 0.75 },
    freeTierAvailable: true, rpm: 15, rpd: 500, tpm: 250000
  },
  'gemini-3.1-pro-preview': {
    label: 'Gemini 3.1 Pro (Preview)', provider: 'gemini', apiModelId: 'gemini-3.1-pro-preview',
    standard: { inputPrice: 2.00, outputPrice: 12.00 }, batch: { inputPrice: 1.00, outputPrice: 6.00 },
    freeTierAvailable: false, rpm: 2, rpd: 50, tpm: 100000
  },
  'gemini-3-flash': {
    label: 'Gemini 3 Flash', provider: 'gemini', apiModelId: 'gemini-3-flash',
    standard: { inputPrice: 0.075, outputPrice: 0.30 }, batch: { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, rpm: 15, rpd: 500, tpm: 250000
  },
  'gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash', provider: 'gemini', apiModelId: 'gemini-2.5-flash',
    standard: { inputPrice: 0.30, outputPrice: 2.50 }, batch: { inputPrice: 0.15, outputPrice: 1.25 },
    freeTierAvailable: true, rpm: 5, rpd: 20, tpm: 250000
  },
  'gemini-2.5-flash-lite': {
    label: 'Gemini 2.5 Flash Lite', provider: 'gemini', apiModelId: 'gemini-2.5-flash-lite',
    standard: { inputPrice: 0.10, outputPrice: 0.40 }, batch: { inputPrice: 0.05, outputPrice: 0.20 },
    freeTierAvailable: true, rpm: 10, rpd: 20, tpm: 250000
  },
  'gpt-4o-mini': {
    label: 'GPT-4o Mini (OpenAI)', provider: 'openai', apiModelId: 'gpt-4o-mini',
    standard: { inputPrice: 0.15, outputPrice: 0.60 }, batch: { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, rpm: 200, rpd: 5000, tpm: 200000
  },
  'gpt-4o': {
    label: 'GPT-4o (OpenAI)', provider: 'openai', apiModelId: 'gpt-4o',
    standard: { inputPrice: 2.50, outputPrice: 10.00 }, batch: { inputPrice: 1.25, outputPrice: 5.00 },
    freeTierAvailable: false, rpm: 100, rpd: 2000, tpm: 100000
  },
  'deepseekv4pro': {
    label: 'DeepSeek v4 Pro', provider: 'deepseek', apiModelId: 'deepseek-v4-pro',
    standard: { inputPrice: 0.55, outputPrice: 2.19 }, batch: { inputPrice: 0.275, outputPrice: 1.10 },
    freeTierAvailable: false, rpm: 60, rpd: 1000, tpm: 150000
  },
  'custom': {
    label: 'Kendi Modeliniz', provider: 'custom', apiModelId: 'custom',
    standard: { inputPrice: 0.15, outputPrice: 0.60 }, batch: { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, rpm: 0, rpd: 0, tpm: 0
  }
};

const PROVIDER_BASE = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com'
};

const LS = {
  settings: 'gls_settings_v12',
  prompt: 'gls_system_prompt_v12',
  inclusion: 'gls_inclusion_v12',
  exclusion: 'gls_exclusion_v12',
  topic: 'gls_research_topic',
  theme: 'gls_theme',
  usage: 'gls_key_usage_v12'
};
const SS_KEYS = { gemini: 'gls_keys_gemini', openai: 'gls_keys_openai', deepseek: 'gls_keys_deepseek', custom: 'gls_keys_custom' };
const PAGE_SIZE = 200;

// ------------------------------------------------------------
// Tiny IndexedDB wrapper (large, persistent state)
// ------------------------------------------------------------
const idb = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open('gls-db', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction('kv', mode);
      const r = fn(t.objectStore('kv'));
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = () => reject(t.error);
    });
  };
  return {
    get: k => tx('readonly', s => s.get(k)),
    set: (k, v) => tx('readwrite', s => s.put(v, k)),
    del: k => tx('readwrite', s => s.delete(k))
  };
})();

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
const settings = {
  activeModels: ['gemini-3.5-flash'],
  mode: 'sync',
  customSpecs: { modelId: 'custom-model', provider: 'openai', baseUrl: '', inputPrice: 0.15, outputPrice: 0.60 }
};

let file = { name: '', hash: '', records: [], columns: {}, duplicates: 0 };
let run = null;            // current run (see newRun())
let results = new Map();   // rid -> row
let controller = null;     // AbortController of the running sync job
let pools = null;          // { gemini: KeyPool, ... } of current run
let pollTimer = null;
let renderTimer = null, saveTimer = null, keyTableTimer = null;
let pageLimit = PAGE_SIZE;
let allAbstractsExpanded = false;

const $ = id => document.getElementById(id);
const el = new Proxy({}, { get: (_, id) => $(id) });

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  loadSettings();
  initListeners();
  renderModelSlots();
  updateProviderVisibility();
  updateModelInfo();
  updateModeUI();
  updateConsistencyWarnings();
  await checkSavedSession();
});

function loadSettings() {
  try { Object.assign(settings, JSON.parse(localStorage.getItem(LS.settings) || '{}')); } catch (e) { /* defaults */ }
  settings.activeModels = (settings.activeModels || []).filter(m => MODELS[m]);
  if (!settings.activeModels.length) settings.activeModels = ['gemini-3.5-flash'];

  el.systemPrompt.value = localStorage.getItem(LS.prompt) || window.DEFAULT_SYSTEM_PROMPT;
  el.inclusionCriteria.value = localStorage.getItem(LS.inclusion) || window.DEFAULT_INCLUSION;
  el.exclusionCriteria.value = localStorage.getItem(LS.exclusion) || window.DEFAULT_EXCLUSION;
  el.userResearchTopic.value = localStorage.getItem(LS.topic) || '';

  Object.entries(SS_KEYS).forEach(([p, k]) => { const v = sessionStorage.getItem(k); if (v) el[`${p}Keys`].value = v; });
  // migrate single key from v8-v11
  const legacy = sessionStorage.getItem('gls_apikey_v8');
  if (legacy && !el.geminiKeys.value) el.geminiKeys.value = legacy;

  const f = settings.form || {};
  ['batchSize', 'concurrencyPerKey', 'minIntervalSec', 'rpmOverride', 'rpdOverride', 'reviewThreshold', 'temperature',
    'icLogic', 'consensusStrategy', 'noAbstractMode', 'summaryLanguage'].forEach(id => { if (f[id] !== undefined) el[id].value = f[id]; });
  ['enforceLimits', 'verifyEvidence', 'dedupe'].forEach(id => { if (f[id] !== undefined) el[id].checked = f[id]; });

  const cs = settings.customSpecs;
  el.customModelId.value = cs.modelId || '';
  el.customModelProvider.value = cs.provider || 'openai';
  el.customModelBaseUrl.value = cs.baseUrl || '';
  el.customModelInputPrice.value = cs.inputPrice;
  el.customModelOutputPrice.value = cs.outputPrice;
  applyCustomSpecs();

  const radio = document.querySelector(`input[name="mode"][value="${settings.mode}"]`);
  if (radio) radio.checked = true;

  if ((localStorage.getItem(LS.theme) || 'dark') === 'light') {
    document.body.classList.add('light-theme');
    el.themeToggleBtn.textContent = '☀️ Gündüz Modu';
  }
}

function saveSettings() {
  settings.form = {};
  ['batchSize', 'concurrencyPerKey', 'minIntervalSec', 'rpmOverride', 'rpdOverride', 'reviewThreshold', 'temperature',
    'icLogic', 'consensusStrategy', 'noAbstractMode', 'summaryLanguage'].forEach(id => { settings.form[id] = el[id].value; });
  ['enforceLimits', 'verifyEvidence', 'dedupe'].forEach(id => { settings.form[id] = el[id].checked; });
  localStorage.setItem(LS.settings, JSON.stringify(settings));
}

function applyCustomSpecs() {
  const cs = settings.customSpecs;
  MODELS.custom.label = `Kendi Modeliniz (${cs.modelId || 'belirtilmemiş'})`;
  MODELS.custom.standard = { inputPrice: +cs.inputPrice || 0, outputPrice: +cs.outputPrice || 0 };
  MODELS.custom.batch = { inputPrice: (+cs.inputPrice || 0) / 2, outputPrice: (+cs.outputPrice || 0) / 2 };
}

function initListeners() {
  Object.entries(SS_KEYS).forEach(([p, k]) => {
    el[`${p}Keys`].addEventListener('input', () => {
      sessionStorage.setItem(k, el[`${p}Keys`].value);
      updateKeySummary(); updateModelInfo(); updateCostEstimate();
    });
  });

  el.systemPrompt.addEventListener('input', debounce(() => {
    localStorage.setItem(LS.prompt, el.systemPrompt.value);
    updateConsistencyWarnings(); updateCostEstimate();
  }, 300));
  el.inclusionCriteria.addEventListener('input', debounce(() => {
    localStorage.setItem(LS.inclusion, el.inclusionCriteria.value);
    updateConsistencyWarnings(); updateCostEstimate();
  }, 300));
  el.exclusionCriteria.addEventListener('input', debounce(() => {
    localStorage.setItem(LS.exclusion, el.exclusionCriteria.value);
    updateConsistencyWarnings(); updateCostEstimate();
  }, 300));
  el.userResearchTopic.addEventListener('input', debounce(() => {
    localStorage.setItem(LS.topic, el.userResearchTopic.value);
    updateCostEstimate();
  }, 300));

  el.resetSystemPromptBtn.addEventListener('click', () => {
    if (!confirm('Yönerge, ölçütler varsayılan "kişisel ilgi alanları" incelemesine sıfırlansın mı?')) return;
    el.systemPrompt.value = window.DEFAULT_SYSTEM_PROMPT;
    el.inclusionCriteria.value = window.DEFAULT_INCLUSION;
    el.exclusionCriteria.value = window.DEFAULT_EXCLUSION;
    localStorage.setItem(LS.prompt, el.systemPrompt.value);
    localStorage.setItem(LS.inclusion, el.inclusionCriteria.value);
    localStorage.setItem(LS.exclusion, el.exclusionCriteria.value);
    updateConsistencyWarnings(); updateCostEstimate();
    showSuccess('Varsayılan yönerge ve ölçütler yüklendi.');
  });

  el.previewProtocolBtn.addEventListener('click', async () => {
    const cfg = currentProtocolConfig();
    el.protocolPreview.textContent = cfg.system;
    el.protocolMeta.textContent = `Prompt sürümü (SHA-256[0:8]): ${await hashString(cfg.system)} · ~${formatTokens(C.estimateTokens(cfg.system))} token · ${cfg.criteria.inclusion.length} IC, ${cfg.criteria.exclusion.length} EC`;
    el.protocolModal.style.display = 'flex';
  });

  document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', () => {
    settings.mode = document.querySelector('input[name="mode"]:checked').value;
    saveSettings(); updateModeUI(); updateCostEstimate();
  }));

  ['batchSize', 'concurrencyPerKey', 'minIntervalSec', 'rpmOverride', 'rpdOverride', 'reviewThreshold', 'temperature',
    'icLogic', 'consensusStrategy', 'noAbstractMode', 'summaryLanguage', 'enforceLimits', 'verifyEvidence', 'dedupe']
    .forEach(id => el[id].addEventListener('change', () => {
      saveSettings(); updateModelInfo(); updateCostEstimate();
      if (id === 'dedupe' && file.rows) prepareFile().catch(e => showError(e.message));
    }));

  const onCustom = () => {
    Object.assign(settings.customSpecs, {
      modelId: el.customModelId.value.trim() || 'custom-model',
      provider: el.customModelProvider.value,
      baseUrl: el.customModelBaseUrl.value.trim(),
      inputPrice: parseFloat(el.customModelInputPrice.value) || 0,
      outputPrice: parseFloat(el.customModelOutputPrice.value) || 0
    });
    applyCustomSpecs(); saveSettings();
    renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateCostEstimate();
  };
  ['customModelId', 'customModelProvider', 'customModelBaseUrl', 'customModelInputPrice', 'customModelOutputPrice']
    .forEach(id => el[id].addEventListener('change', onCustom));

  el.addModelSlotBtn.addEventListener('click', () => {
    if (settings.activeModels.length >= 3) return;
    const next = ['gemini-2.5-flash', 'gpt-4o-mini', 'deepseekv4pro', 'gemini-3.5-flash-lite'].find(m => !settings.activeModels.includes(m));
    settings.activeModels.push(next);
    saveSettings(); renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateCostEstimate();
  });

  el.testKeysBtn.addEventListener('click', testKeys);
  el.csvFile.addEventListener('change', onFileSelected);
  el.analyzeBtn.addEventListener('click', startNewAnalysis);
  el.pauseBtn.addEventListener('click', pauseRun);
  el.continueBtn.addEventListener('click', continueRun);
  el.retryErrorsBtn.addEventListener('click', retryErrors);

  el.filterDecision.addEventListener('change', () => { pageLimit = PAGE_SIZE; renderTable(); });
  el.filterSearch.addEventListener('input', debounce(() => { pageLimit = PAGE_SIZE; renderTable(); }, 250));
  el.showMoreBtn.addEventListener('click', () => { pageLimit += PAGE_SIZE; renderTable(); });
  el.toggleAllAbstractsBtn.addEventListener('click', () => {
    allAbstractsExpanded = !allAbstractsExpanded;
    el.toggleAllAbstractsBtn.textContent = allAbstractsExpanded ? '↕️ Tüm Özetleri Kapat' : '↕️ Tüm Özetleri Aç';
    renderTable();
  });

  el.relevanceReportBtn.addEventListener('click', showRelevanceReport);
  el.downloadCsvBtn.addEventListener('click', downloadCsv);
  el.downloadExcelBtn.addEventListener('click', downloadExcel);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).style.display = 'none'; }));

  el.themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem(LS.theme, isLight ? 'light' : 'dark');
    el.themeToggleBtn.textContent = isLight ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
  });

  window.addEventListener('beforeunload', e => {
    if (run && run.status === 'running') { saveStateNow(); e.preventDefault(); e.returnValue = ''; }
  });
}

// ------------------------------------------------------------
// Models & keys UI
// ------------------------------------------------------------
function renderModelSlots() {
  const container = el.modelSlotsContainer;
  container.textContent = '';
  settings.activeModels.forEach((modelId, idx) => {
    const row = document.createElement('div');
    row.className = 'model-slot-row';
    const label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = idx === 0 ? 'Model 1 (birincil):' : `Model ${idx + 1}:`;
    const select = document.createElement('select');
    select.className = 'model-select-control';
    Object.entries(MODELS).forEach(([mId, info]) => {
      const opt = document.createElement('option');
      opt.value = mId;
      opt.textContent = info.label;
      opt.selected = mId === modelId;
      opt.disabled = mId !== modelId && settings.activeModels.includes(mId);
      select.appendChild(opt);
    });
    select.addEventListener('change', e => {
      settings.activeModels[idx] = e.target.value;
      saveSettings(); renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateCostEstimate();
    });
    row.append(label, select);
    if (idx > 0) {
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-remove-slot';
      rm.textContent = '×';
      rm.title = 'Modeli kaldır';
      rm.addEventListener('click', () => {
        settings.activeModels.splice(idx, 1);
        saveSettings(); renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateCostEstimate();
      });
      row.appendChild(rm);
    }
    container.appendChild(row);
  });
  el.addModelSlotBtn.style.display = settings.activeModels.length >= 3 ? 'none' : 'inline-flex';
  el.consensusGroup.style.display = settings.activeModels.length > 1 ? 'block' : 'none';
}

function providerOf(slotId) {
  const m = MODELS[slotId];
  return m.provider === 'custom' ? settings.customSpecs.provider : m.provider;
}

function updateProviderVisibility() {
  const provs = new Set(settings.activeModels.map(providerOf));
  const hasCustom = settings.activeModels.includes('custom');
  el.geminiKeyGroup.style.display = provs.has('gemini') ? 'block' : 'none';
  el.openaiKeyGroup.style.display = settings.activeModels.some(m => MODELS[m].provider === 'openai') ? 'block' : 'none';
  el.deepseekKeyGroup.style.display = settings.activeModels.some(m => MODELS[m].provider === 'deepseek') ? 'block' : 'none';
  el.customKeyGroup.style.display = hasCustom ? 'block' : 'none';
  el.customModelConfig.style.display = hasCustom ? 'block' : 'none';

  const allGemini = settings.activeModels.every(m => providerOf(m) === 'gemini');
  const asyncRadio = document.querySelector('input[name="mode"][value="async"]');
  asyncRadio.disabled = !allGemini;
  if (!allGemini && settings.mode === 'async') {
    document.querySelector('input[name="mode"][value="sync"]').checked = true;
    settings.mode = 'sync';
    saveSettings(); updateModeUI();
  }
  updateKeySummary();
}

function parseKeys(text) {
  return String(text || '').split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split(/\s+/)[0]);
}

function keysFor(pool) {
  if (pool === 'custom') {
    const own = parseKeys(el.customKeys.value);
    return own.length ? own : parseKeys(el[`${settings.customSpecs.provider}Keys`].value);
  }
  return parseKeys(el[`${pool}Keys`].value);
}

function updateKeySummary() {
  const parts = [];
  const provs = new Set(settings.activeModels.map(m => MODELS[m].provider));
  provs.forEach(p => {
    const n = p === 'custom' ? keysFor('custom').length : keysFor(p).length;
    parts.push(`${p}: ${n} anahtar`);
  });
  el.keySummary.textContent = parts.join(' · ');
}

// Engine model specs from the UI selection
function resolveModels(slotIds) {
  return [...new Set(slotIds)].map(id => {
    const m = MODELS[id];
    if (m.provider === 'custom') {
      const cs = settings.customSpecs;
      const ownKeys = parseKeys(el.customKeys.value).length > 0;
      return { id, provider: cs.provider, apiModel: cs.modelId, baseUrl: cs.baseUrl || PROVIDER_BASE[cs.provider], pool: ownKeys ? 'custom' : cs.provider };
    }
    return { id, provider: m.provider, apiModel: m.apiModelId, baseUrl: PROVIDER_BASE[m.provider], pool: m.provider };
  });
}

function limitsFor(models) {
  const limits = {};
  const rpmO = parseInt(el.rpmOverride.value, 10);
  const rpdO = parseInt(el.rpdOverride.value, 10);
  models.forEach(m => {
    const reg = MODELS[m.id];
    limits[m.apiModel] = el.enforceLimits.checked
      ? { rpm: isFinite(rpmO) ? rpmO : reg.rpm, rpd: isFinite(rpdO) ? rpdO : reg.rpd }
      : { rpm: isFinite(rpmO) ? rpmO : 0, rpd: isFinite(rpdO) ? rpdO : 0 };
  });
  return limits;
}

function buildPools(models) {
  const out = {};
  const usage = loadUsage();
  const byPool = {};
  models.forEach(m => { (byPool[m.pool] = byPool[m.pool] || []).push(m); });
  Object.entries(byPool).forEach(([name, ms]) => {
    const pool = new C.KeyPool(name, keysFor(name), {
      concurrencyPerKey: Math.max(1, parseInt(el.concurrencyPerKey.value, 10) || 1),
      minIntervalMs: Math.max(0, parseFloat(el.minIntervalSec.value) || 0) * 1000,
      limits: limitsFor(ms)
    });
    pool.importUsage(usage[name]);
    pool.onChange(() => { scheduleKeyTable(); scheduleUsageSave(); });
    out[name] = pool;
  });
  return out;
}

function loadUsage() { try { return JSON.parse(localStorage.getItem(LS.usage) || '{}'); } catch (e) { return {}; } }
const scheduleUsageSave = debounce(() => {
  if (!pools) return;
  const u = loadUsage();
  Object.entries(pools).forEach(([name, p]) => { u[name] = Object.assign(u[name] || {}, p.exportUsage()); });
  localStorage.setItem(LS.usage, JSON.stringify(u));
}, 1000);

async function testKeys() {
  const models = resolveModels(settings.activeModels);
  const poolNames = [...new Set(models.map(m => m.pool))];
  el.progressSection.style.display = 'block';
  el.keyStatusTable.style.display = 'table';
  el.keyStatusBody.textContent = '';
  let ok = 0, bad = 0;
  for (const name of poolNames) {
    const spec = models.find(m => m.pool === name);
    for (const key of keysFor(name)) {
      const tr = document.createElement('tr');
      const td = t => { const c = document.createElement('td'); c.textContent = t; tr.appendChild(c); return c; };
      td(`${name} (${C.maskKey(key)})`);
      const st = td('test ediliyor…');
      [1, 2, 3, 4, 5].forEach(() => td('-'));
      el.keyStatusBody.appendChild(tr);
      try {
        const base = (spec.baseUrl || PROVIDER_BASE[spec.provider]).replace(/\/+$/, '');
        const resp = spec.provider === 'gemini'
          ? await fetch(`${base}/models?pageSize=1`, { headers: { 'x-goog-api-key': key } })
          : await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
        if (resp.ok) { st.textContent = '✓ geçerli'; st.className = 'ok-text'; ok++; }
        else {
          const b = await resp.json().catch(() => ({}));
          st.textContent = `✗ ${resp.status}: ${(b.error && b.error.message) || resp.statusText}`.slice(0, 140);
          st.className = 'danger-text'; bad++;
        }
      } catch (e) { st.textContent = `✗ ${e.message}`; st.className = 'danger-text'; bad++; }
    }
  }
  if (!ok && !bad) showError('Test edilecek anahtar yok. Anahtarları her satıra bir tane gelecek şekilde girin.');
  else (bad ? showError : showSuccess)(`${ok} anahtar geçerli, ${bad} anahtar hatalı.`);
}

function updateModelInfo() {
  const models = resolveModels(settings.activeModels);
  const primary = MODELS[settings.activeModels[0]];
  const lim = limitsFor(models)[models[0].apiModel];
  el.rpmLimit.textContent = lim.rpm > 0 ? lim.rpm : 'sınırsız / 429 ile';
  el.rpdLimit.textContent = lim.rpd > 0 ? lim.rpd.toLocaleString('tr-TR') : 'sınırsız / 429 ile';
  el.tpmLimit.textContent = primary.tpm > 0 ? `${primary.tpm / 1000}K` : '-';
  const nKeys = Math.max(1, keysFor(models[0].pool).length);
  const bs = parseInt(el.batchSize.value, 10) || 5;
  el.dailyCapacity.textContent = lim.rpd > 0
    ? `~${(lim.rpd * bs * nKeys).toLocaleString('tr-TR')} kayıt/gün (${nKeys} anahtar × ${lim.rpd} istek × ${bs})`
    : 'Limit yok';
}

function updateModeUI() {
  const isSync = settings.mode === 'sync';
  el.concurrencyGroup.style.display = isSync ? 'block' : 'none';
  el.delaySettingsGroup.style.display = isSync ? 'block' : 'none';
}

// ------------------------------------------------------------
// Protocol
// ------------------------------------------------------------
function currentOptions() {
  const thr = parseFloat(el.reviewThreshold.value);
  return {
    icLogic: el.icLogic.value,
    reviewThreshold: isFinite(thr) ? Math.max(0, Math.min(1, thr)) : 0.85,
    consensus: el.consensusStrategy.value,
    summaryLanguage: el.summaryLanguage.value,
    verifyEvidence: el.verifyEvidence.checked,
    requireEvidence: true,
    userTopic: el.userResearchTopic.value.trim(),
    noAbstractMode: el.noAbstractMode.value,
    dedupe: el.dedupe.checked,
    temperature: el.temperature.value === '' ? null : parseFloat(el.temperature.value)
  };
}

function currentProtocolConfig() {
  const criteria = C.parseCriteria(el.inclusionCriteria.value, el.exclusionCriteria.value);
  const options = currentOptions();
  const guidance = el.systemPrompt.value;
  return { criteria, options, guidance, system: C.buildSystemInstructions(guidance, criteria, options) };
}

function updateConsistencyWarnings() {
  const criteria = C.parseCriteria(el.inclusionCriteria.value, el.exclusionCriteria.value);
  const w = C.checkGuidanceConsistency(el.systemPrompt.value, criteria);
  el.consistencyWarnings.textContent = '';
  w.forEach(t => { const d = document.createElement('div'); d.textContent = '⚠️ ' + t; el.consistencyWarnings.appendChild(d); });
  el.consistencyWarnings.style.display = w.length ? 'block' : 'none';
}

// ------------------------------------------------------------
// File parsing
// ------------------------------------------------------------
function parseDelimited(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'));
  const counts = { '\t': (firstLine.match(/\t/g) || []).length, ',': (firstLine.match(/,/g) || []).length, ';': (firstLine.match(/;/g) || []).length };
  const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"' && cur === '') inQ = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

async function onFileSelected(e) {
  const f = e.target.files[0];
  if (!f) return;
  try {
    let rows;
    if (/\.(xlsx|xls)$/i.test(f.name)) {
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
    } else {
      rows = parseDelimited(await f.text());
    }
    file = { name: f.name, rows, hash: '', records: [], columns: {}, duplicates: 0 };
    await prepareFile();
  } catch (err) {
    showError(err.message);
    el.analyzeBtn.disabled = true;
  }
}

async function prepareFile() {
  const prepared = C.prepareRecords(file.rows, { dedupe: el.dedupe.checked });
  if (!prepared.records.length) throw new Error('Dosyada taranabilir kayıt bulunamadı.');
  Object.assign(file, prepared);
  file.hash = await hashString(prepared.records.map(r => r.ID + '|' + r.Title).join('\n'));
  const noAbs = prepared.records.filter(r => r.noAbstract && !r.duplicateOf).length;
  el.fileInfo.style.display = 'block';
  el.fileInfo.textContent = '';
  const lines = [
    `📄 ${file.name}: ${prepared.records.length} kayıt · ${prepared.duplicates} tekrar · ${noAbs} özeti olmayan/çok kısa kayıt`,
    `Sütun eşleşmesi → ID: ${prepared.columns.id || '(sıra no)'} · Başlık: ${prepared.columns.title || '-'} · Özet: ${prepared.columns.abstract || '-'} · Yıl: ${prepared.columns.year || '-'} · DOI: ${prepared.columns.doi || '-'} · Anahtar kelime: ${prepared.columns.keywords || '-'} · Belge türü: ${prepared.columns.doctype || '-'}`
  ];
  lines.forEach(t => { const d = document.createElement('div'); d.textContent = t; el.fileInfo.appendChild(d); });
  showSuccess(`${prepared.records.length} kayıt yüklendi.`);
  el.analyzeBtn.disabled = false;
  updateCostEstimate();
}

// ------------------------------------------------------------
// Cost / duration estimate
// ------------------------------------------------------------
function updateCostEstimate() {
  if (!file.records.length) { el.costEstimatePanel.style.display = 'none'; return; }
  const { system, criteria, options } = currentProtocolConfig();
  const toScreen = file.records.filter(r => !r.duplicateOf && !(r.noAbstract && options.noAbstractMode === 'skip'));
  const n = toScreen.length;
  const bs = parseInt(el.batchSize.value, 10) || 5;
  const requests = Math.ceil(n / bs);
  const sysT = C.estimateTokens(system);
  const recT = toScreen.reduce((s, r) => s + C.estimateTokens(C.recordText(r)), 0);
  const outPerRec = 120 + 30 * (criteria.inclusion.length + criteria.exclusion.length) + (options.userTopic ? 60 : 0);
  const models = resolveModels(settings.activeModels);
  let syncCost = 0, batchCost = 0;
  const inTok = requests * sysT + recT;
  const outTok = n * outPerRec;
  models.forEach(m => {
    const p = MODELS[m.id];
    syncCost += inTok / 1e6 * p.standard.inputPrice + outTok / 1e6 * p.standard.outputPrice;
    batchCost += inTok / 1e6 * p.batch.inputPrice + outTok / 1e6 * p.batch.outputPrice;
  });
  el.costEstimatePanel.style.display = 'block';
  el.estTotalArticles.textContent = `${n.toLocaleString('tr-TR')} (${file.records.length - n} taranmayacak)`;
  el.estInputTokens.textContent = `~${formatTokens(inTok * models.length)}`;
  el.estOutputTokens.textContent = `~${formatTokens(outTok * models.length)} (düşünme tokenları hariç)`;

  // Duration: slowest model's request stream over its pool
  const lim = limitsFor(models);
  let minutes = 0;
  models.forEach(m => {
    const keys = Math.max(1, keysFor(m.pool).length);
    const rpm = lim[m.apiModel].rpm;
    const conc = Math.max(1, parseInt(el.concurrencyPerKey.value, 10) || 1);
    const perMin = rpm > 0 ? Math.min(rpm, conc * 6) * keys : conc * 6 * keys; // ~10 s per request
    minutes = Math.max(minutes, requests / perMin);
    const rpd = lim[m.apiModel].rpd;
    if (rpd > 0 && requests > rpd * keys) minutes = Math.max(minutes, Math.ceil(requests / (rpd * keys)) * 1440);
  });
  el.estDuration.textContent = settings.mode === 'async' ? '1–24 saat (Batch API)' : formatDuration(minutes);
  el.estSyncCost.textContent = formatCost(syncCost) + (settings.mode === 'sync' ? ' (seçili)' : '');
  el.estBatchCost.textContent = formatCost(batchCost) + (settings.mode === 'async' ? ' (seçili)' : '');
  const paid = settings.activeModels.some(m => !MODELS[m].freeTierAvailable);
  el.freeTierNote.textContent = paid
    ? '⚠️ Seçili modellerden bazıları yalnızca ücretli katmanda. Düşünme (thinking) tokenları çıkış olarak faturalanır.'
    : '✓ Seçili modellerin ücretsiz katmanı var; kota içinde kaldığınız sürece maliyet $0 olur.';
}

// ------------------------------------------------------------
// Runs
// ------------------------------------------------------------
function newRun(cfg, models) {
  return {
    version: C.VERSION,
    runId: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'running',
    mode: settings.mode,
    fileName: file.name, fileHash: file.hash, columns: file.columns,
    activeModels: models.map(m => m.id),
    models,
    guidance: cfg.guidance,
    icText: el.inclusionCriteria.value, ecText: el.exclusionCriteria.value,
    criteria: cfg.criteria, options: cfg.options, system: cfg.system, promptHash: '',
    batchSize: Math.max(1, parseInt(el.batchSize.value, 10) || 5),
    records: file.records,
    usage: { input: 0, output: 0, cost: 0, perModel: {} },
    jobs: [], partial: {},
    log: []
  };
}

function validationFor(r) {
  return Object.assign({ criteria: r.criteria }, r.options);
}

async function startNewAnalysis() {
  if (!file.records.length) return showError('Lütfen önce dosya yükleyin.');
  if (run && run.status === 'running') return showError('Bir analiz zaten çalışıyor.');
  const cfg = currentProtocolConfig();
  if (!cfg.criteria.inclusion.length) return showError('En az bir dahil etme ölçütü (IC) girin.');
  const models = resolveModels(settings.activeModels);
  const missing = [...new Set(models.map(m => m.pool))].filter(p => !keysFor(p).length);
  if (missing.length) return showError(`API anahtarı eksik: ${missing.join(', ')}`);
  const warnings = C.checkGuidanceConsistency(cfg.guidance, cfg.criteria);
  if (warnings.length && !confirm(`Ölçütler ile yönerge arasında tutarsızlık var:\n\n• ${warnings.join('\n• ')}\n\nYine de başlatılsın mı?`)) return;
  if (results.size && [...results.values()].some(r => r.human_decision) &&
      !confirm('Mevcut sonuçlarda insan kararları var. Yeni analiz bunların yerini alacak. Önce dışa aktarmanız önerilir. Devam edilsin mi?')) return;

  run = newRun(cfg, models);
  run.promptHash = await hashString(run.system);
  results = new Map();

  // Records that are not sent to a model
  run.records.forEach(r => {
    if (r.duplicateOf) upsert(C.presetResult(r, 'Duplicate', `Tekrar kaydı: ${r.duplicateOf} ile aynı (DOI veya başlık+yıl).`));
    else if (r.noAbstract && run.options.noAbstractMode === 'skip') upsert(C.presetResult(r, 'Uncertain', 'Özet yok — tam metin/insan incelemesi gerekli.'));
  });

  showRunUI();
  logEvent(`Yeni analiz: ${run.records.length} kayıt, modeller: ${run.activeModels.join(', ')}, mod: ${run.mode}, prompt v${run.promptHash}`);
  await saveStateNow();
  if (run.mode === 'async') await startAsync();
  else await runSync();
}

function pendingRecords() {
  return run.records.filter(r => !results.has(r.rid));
}

async function runSync(recordsOverride) {
  const todo = recordsOverride || pendingRecords();
  if (!todo.length) { finishRun(); return; }
  run.status = 'running';
  controller = new AbortController();
  pools = buildPools(run.models);
  const capacity = Object.values(pools).reduce((s, p) => s + p.capacity, 0);
  logEvent(`${todo.length} kayıt taranıyor · ${Object.values(pools).reduce((s, p) => s + p.size, 0)} anahtar · toplam paralellik ${capacity}`);
  el.pauseBtn.style.display = 'inline-flex';
  el.continueBtn.style.display = 'none';
  el.analyzeBtn.disabled = true;
  el.keyStatusTable.style.display = 'table';
  renderKeyTable();
  const keyTicker = setInterval(renderKeyTable, 1000);
  const startDone = results.size;

  try {
    const res = await C.runScreening({
      records: todo,
      models: run.models,
      pools,
      system: run.system,
      batchSize: run.batchSize,
      temperature: run.options.temperature,
      validation: validationFor(run),
      signal: controller.signal,
      onRecord: row => {
        const prev = results.get(row.rid);
        if (prev && prev.human_decision) { row.human_decision = prev.human_decision; row.decision = prev.human_decision; }
        upsert(row);
        scheduleRender(); scheduleSave();
      },
      onUsage: (modelId, u) => { accumulateCost(modelId, u, 'standard'); },
      onProgress: p => {
        const done = results.size;
        el.progressBar.style.width = `${(done / run.records.length) * 100}%`;
        el.progressText.textContent = `${done.toLocaleString('tr-TR')} / ${run.records.length.toLocaleString('tr-TR')} kayıt · bu oturumda ${done - startDone} · uçuşta ${p.inflight} istek · kuyrukta ${p.queued} iş`;
      },
      onLog: logEvent,
      onFatal: err => { showError(err.message); logEvent(`⛔ ${err.message}`); }
    });
    if (res.completed) finishRun();
    else {
      run.status = 'paused';
      el.progressText.textContent = res.fatal
        ? `⛔ Durduruldu: ${res.fatal.message}`
        : `⏸️ Duraklatıldı: ${results.size}/${run.records.length} kayıt tamamlandı.`;
      el.pauseBtn.style.display = 'none';
      el.continueBtn.style.display = 'inline-flex';
    }
  } catch (err) {
    run.status = 'paused';
    showError('Beklenmeyen hata: ' + err.message);
    console.error(err);
    el.continueBtn.style.display = 'inline-flex';
    el.pauseBtn.style.display = 'none';
  } finally {
    clearInterval(keyTicker);
    renderKeyTable();
    controller = null;
    el.analyzeBtn.disabled = false;
    renderTable();
    await saveStateNow();
  }
}

function pauseRun() {
  if (controller) controller.abort();
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; run.status = 'paused'; el.continueBtn.style.display = 'inline-flex'; el.pauseBtn.style.display = 'none'; }
  logEvent('Kullanıcı duraklattı.');
}

async function continueRun() {
  if (!run) return;
  if (run.mode === 'async' && run.jobs.length) {
    el.continueBtn.style.display = 'none';
    el.pauseBtn.style.display = 'inline-flex';
    run.status = 'running';
    pollJobs();
    return;
  }
  await runSync();
}

async function retryErrors() {
  if (!run || (run.status === 'running')) return;
  const rids = [...results.values()].filter(r => r.error && !r.preset).map(r => r.rid);
  if (!rids.length) return showSuccess('Hatalı kayıt yok.');
  const set = new Set(rids);
  const todo = run.records.filter(r => set.has(r.rid));
  logEvent(`${todo.length} hatalı kayıt yeniden taranıyor (paralel mod).`);
  showRunUI();
  await runSync(todo);
}

function finishRun() {
  run.status = 'done';
  el.progressBar.style.width = '100%';
  const errs = [...results.values()].filter(r => r.error).length;
  el.progressText.textContent = `✅ Tamamlandı: ${results.size} kayıt${errs ? ` · ${errs} kayıtta API hatası (yeniden taranabilir)` : ''}.`;
  el.pauseBtn.style.display = 'none';
  el.continueBtn.style.display = 'none';
  logEvent('Analiz tamamlandı.');
  renderTable();
  saveStateNow();
}

function showRunUI() {
  el.resultsSection.style.display = 'block';
  el.progressSection.style.display = 'block';
  pageLimit = PAGE_SIZE;
  renderTable();
  updateLiveCost();
}

function upsert(row) {
  results.set(row.rid, row);
}

function accumulateCost(modelId, u, tier) {
  const p = (MODELS[modelId] || MODELS['gemini-3.5-flash'])[tier];
  const inT = u.promptTokens || 0, outT = u.completionTokens || 0;
  run.usage.input += inT;
  run.usage.output += outT;
  run.usage.cost += inT / 1e6 * p.inputPrice + outT / 1e6 * p.outputPrice;
  const pm = run.usage.perModel[modelId] = run.usage.perModel[modelId] || { input: 0, output: 0 };
  pm.input += inT; pm.output += outT;
  scheduleLiveCost();
}
const scheduleLiveCost = debounce(() => updateLiveCost(), 300);

// ------------------------------------------------------------
// Async (Gemini Batch API) — jobs split across keys
// ------------------------------------------------------------
function geminiBase(m) { return (m.baseUrl || PROVIDER_BASE.gemini).replace(/\/+$/, ''); }

async function startAsync() {
  pools = buildPools(run.models);
  const pool = pools[run.models[0].pool];
  const todo = pendingRecords();
  let jobs = C.planBatchJobs({
    records: todo, models: run.models, keyCount: pool.size, batchSize: run.batchSize,
    system: run.system, userTopic: run.options.userTopic, useSchema: true, temperature: run.options.temperature
  });
  logEvent(`${jobs.length} batch job, ${pool.size} anahtara dağıtılıyor…`);
  el.batchJobInfo.style.display = 'block';
  el.analyzeBtn.disabled = true;
  run.jobs = [];
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const k = pool.keys[j.keyIndex];
    const m = run.models.find(x => x.id === j.modelId);
    el.progressText.textContent = `Batch job ${i + 1}/${jobs.length} gönderiliyor (${k.label})…`;
    try {
      let resp = await submitBatch(m, k.key, j, i);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        const c = C.classifyHttpError(resp.status, body, resp.headers);
        if (c.type === 'schema') {
          j.requests.forEach(r => { delete r.request.generationConfig.responseSchema; });
          resp = await submitBatch(m, k.key, j, i);
          if (!resp.ok) throw new Error(`Batch gönderimi ${resp.status}`);
        } else throw new Error(`Batch gönderimi ${resp.status}: ${c.message}`);
      }
      const data = await resp.json();
      run.jobs.push({ name: data.name, keyFp: k.fp, keyLabel: k.label, modelId: j.modelId, rids: j.rids,
        requestKeys: j.requests.map(r => r.metadata.key), state: 'SUBMITTED', done: false, submittedAt: Date.now() });
      logEvent(`✓ ${data.name} gönderildi (${j.rids.length} kayıt, ${k.label})`);
    } catch (e) {
      logEvent(`✗ Job ${i + 1} gönderilemedi: ${e.message} — bu kayıtlar sonra paralel modda taranabilir.`);
      run.jobs.push({ name: '', keyFp: k.fp, keyLabel: k.label, modelId: j.modelId, rids: j.rids, state: 'SUBMIT_FAILED', done: true, error: e.message });
    }
    await saveStateNow();
  }
  el.pauseBtn.style.display = 'inline-flex';
  pollJobs();
}

function submitBatch(m, key, job, i) {
  return fetch(`${geminiBase(m)}/models/${encodeURIComponent(job.apiModel)}:batchGenerateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ batch: { display_name: `${run.runId}-${i + 1}`, input_config: { requests: { requests: job.requests } } } })
  });
}

function keyByFp(fp, poolName) {
  return keysFor(poolName).find(k => C.fingerprint(k) === fp);
}

async function pollJobs() {
  if (!run || run.mode !== 'async' || run.status === 'done') return;
  const m0 = run.models[0];
  renderJobInfo();
  let missingKeys = 0;
  for (const job of run.jobs.filter(j => !j.done)) {
    const key = keyByFp(job.keyFp, m0.pool);
    if (!key) { missingKeys++; continue; }
    try {
      const resp = await fetch(`${geminiBase(m0)}/${job.name}`, { headers: { 'x-goog-api-key': key } });
      if (!resp.ok) { logEvent(`${job.name}: durum sorgusu ${resp.status}`); continue; }
      const data = await resp.json();
      job.state = (data.metadata && data.metadata.state) || data.state || job.state;
      const st = C.batchJobState(data);
      if (st === 'succeeded') await collectJob(job, data, key);
      else if (st === 'failed') {
        job.done = true;
        job.rids.forEach(rid => storePartial(rid, job.modelId, C.errorModelRecord(`Batch job başarısız: ${job.state}`)));
        logEvent(`✗ ${job.name}: ${job.state}`);
      }
    } catch (e) { logEvent(`${job.name}: ${e.message}`); }
  }
  if (missingKeys) showError(`${missingKeys} job için gönderen API anahtarı bu oturumda girilmemiş. Aynı anahtarları girip "Devam Et"e basın.`);
  renderJobInfo();
  await saveStateNow();

  const doneJobs = run.jobs.filter(j => j.done).length;
  el.progressBar.style.width = `${run.jobs.length ? doneJobs / run.jobs.length * 100 : 100}%`;
  if (run.jobs.every(j => j.done)) { finalizeAsync(); return; }
  el.progressText.textContent = `Batch job'lar: ${doneJobs}/${run.jobs.length} tamamlandı · sonraki kontrol 30 sn içinde`;
  if (run.status === 'running') pollTimer = setTimeout(pollJobs, 30000);
}

async function collectJob(job, data, key) {
  let responses = C.parseBatchResponses(data);
  const fileName = C.batchResponsesFile(data);
  if (!responses.length && fileName) {
    const base = geminiBase(run.models[0]).replace(/\/v1beta$/, '');
    const resp = await fetch(`${base}/download/v1beta/${fileName}:download?alt=media`, { headers: { 'x-goog-api-key': key } });
    if (!resp.ok) throw new Error(`Sonuç dosyası indirilemedi (${resp.status})`);
    responses = C.parseBatchResponses(await resp.text());
  }
  const recMap = new Map(run.records.map(r => [r.rid, r]));
  const covered = new Set();
  responses.forEach(item => {
    const reqKey = item.key && String(item.key).includes('::') ? item.key : (job.requestKeys || [])[item.index];
    const [modelId, ridList] = String(reqKey || '').split('::');
    const rids = (ridList || '').split(',').filter(Boolean);
    if (!rids.length) return;
    rids.forEach(r => covered.add(r));
    if (item.error) { rids.forEach(rid => storePartial(rid, modelId, C.errorModelRecord(item.error))); return; }
    accumulateCost(modelId, item.usage || {}, 'batch');
    const parsed = C.parseModelResponse(item.text);
    const got = new Map(parsed.map(p => [String(p.id || '').trim(), p]));
    rids.forEach(rid => {
      const raw = got.get(rid) || (rids.length === 1 && parsed.length === 1 ? parsed[0] : null);
      storePartial(rid, modelId, raw
        ? C.validateModelRecord(raw, Object.assign({}, validationFor(run), { recordText: C.recordText(recMap.get(rid)) }))
        : C.errorModelRecord(item.truncated ? 'yanıt token sınırında kesildi' : 'kayıt yanıtta yok'));
    });
  });
  job.rids.filter(r => !covered.has(r)).forEach(rid => storePartial(rid, job.modelId, C.errorModelRecord('batch yanıtında yok')));
  job.done = true;
  logEvent(`✓ ${job.name}: ${responses.length} yanıt işlendi`);
}

function storePartial(rid, modelId, result) {
  (run.partial[rid] = run.partial[rid] || {})[modelId] = result;
}

function finalizeAsync() {
  const recMap = new Map(run.records.map(r => [r.rid, r]));
  const order = run.models.map(m => m.id);
  run.jobs.forEach(j => j.rids.forEach(rid => {
    if (!run.partial[rid]) run.partial[rid] = {};
    if (!run.partial[rid][j.modelId]) run.partial[rid][j.modelId] = C.errorModelRecord(j.error || 'job gönderilemedi');
  }));
  Object.entries(run.partial).forEach(([rid, mr]) => {
    order.forEach(mid => { if (!mr[mid]) mr[mid] = C.errorModelRecord('bu model için yanıt yok'); });
    upsert(C.finalizeRecord(recMap.get(rid), mr, order, validationFor(run)));
  });
  run.partial = {};
  pollTimer = null;
  finishRun();
  el.analyzeBtn.disabled = false;
}

function renderJobInfo() {
  if (!run || !run.jobs.length) { el.batchJobInfo.style.display = 'none'; return; }
  el.batchJobInfo.style.display = 'block';
  el.batchJobInfo.textContent = '';
  run.jobs.forEach(j => {
    const d = document.createElement('div');
    d.textContent = `${j.name || '(gönderilemedi)'} · ${j.modelId} · ${j.keyLabel} · ${j.rids.length} kayıt · ${j.state}${j.done ? ' ✓' : ''}`;
    el.batchJobInfo.appendChild(d);
  });
}

// ------------------------------------------------------------
// Key status table & log
// ------------------------------------------------------------
function scheduleKeyTable() { if (!keyTableTimer) keyTableTimer = setTimeout(() => { keyTableTimer = null; renderKeyTable(); }, 400); }

function renderKeyTable() {
  if (!pools) return;
  el.keyStatusBody.textContent = '';
  Object.values(pools).forEach(p => p.status().forEach(s => {
    const tr = document.createElement('tr');
    const today = Object.values(s.dailyUsed).reduce((a, b) => a + b, 0);
    [s.label, s.status + (s.disabledReason ? `: ${s.disabledReason.slice(0, 80)}` : ''), s.stats.requests, s.stats.ok, s.stats.rateLimited, s.stats.errors, today]
      .forEach((v, i) => {
        const td = document.createElement('td');
        td.textContent = v;
        if (i === 1) td.className = /devre|kota/.test(s.status) ? 'danger-text' : (/bekle/.test(s.status) ? 'warn-text' : 'ok-text');
        tr.appendChild(td);
      });
    el.keyStatusBody.appendChild(tr);
  }));
}

function logEvent(msg) {
  const t = new Date().toLocaleTimeString('tr-TR');
  if (run) { run.log.push(`${t} ${msg}`); if (run.log.length > 500) run.log.shift(); }
  const li = document.createElement('li');
  li.textContent = `${t} — ${msg}`;
  el.eventLog.prepend(li);
  while (el.eventLog.children.length > 300) el.eventLog.lastChild.remove();
}

// ------------------------------------------------------------
// Results table (paged, filtered, rebuilt on demand)
// ------------------------------------------------------------
function scheduleRender() { if (!renderTimer) renderTimer = setTimeout(() => { renderTimer = null; renderTable(); }, 700); }

function sortedResults() {
  return [...results.values()].sort((a, b) => a.order - b.order);
}

function matchesFilter(r, dec, q) {
  if (dec === 'review' && !r.needs_human_review) return false;
  if (dec === 'pending' && !(r.needs_human_review && !r.human_decision)) return false;
  if (dec === 'split' && r.agreement !== 'split') return false;
  if (dec === 'human' && !r.human_decision) return false;
  if (dec === 'error' && !r.error) return false;
  if (['Include', 'Exclude', 'Uncertain', 'Duplicate'].includes(dec) && r.decision !== dec) return false;
  if (q) {
    const hay = `${r.id} ${r.title} ${r.rationale} ${r.summary} ${r.abstract} ${r.authors}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderTable() {
  const dec = el.filterDecision.value;
  const q = el.filterSearch.value.toLowerCase().trim();
  const all = sortedResults();
  const filtered = all.filter(r => matchesFilter(r, dec, q));
  const frag = document.createDocumentFragment();
  filtered.slice(0, pageLimit).forEach(r => frag.appendChild(buildRow(r)));
  el.resultsBody.textContent = '';
  el.resultsBody.appendChild(frag);
  el.filterCount.textContent = `${Math.min(pageLimit, filtered.length)} gösteriliyor · ${filtered.length} eşleşen · ${all.length} toplam`;
  el.showMoreBtn.style.display = filtered.length > pageLimit ? 'inline-flex' : 'none';
  updateStats();
}

function collapsible(td, text) {
  if (!text) { td.textContent = '-'; return; }
  if (allAbstractsExpanded || text.length < 240) { td.textContent = text; return; }
  const wrap = document.createElement('div');
  wrap.className = 'collapsible-text-container collapsed';
  const preview = document.createElement('span');
  preview.textContent = text.slice(0, 200) + '… ';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-toggle-text';
  btn.textContent = '(devamını göster)';
  btn.addEventListener('click', () => {
    const collapsed = wrap.classList.toggle('collapsed');
    preview.textContent = collapsed ? text.slice(0, 200) + '… ' : text + ' ';
    btn.textContent = collapsed ? '(devamını göster)' : '(daha az göster)';
  });
  wrap.append(preview, btn);
  td.appendChild(wrap);
}

function badge(decision) {
  const s = document.createElement('span');
  s.className = `decision-badge decision-${String(decision || 'uncertain').toLowerCase()}`;
  s.lang = 'en'; // avoid Turkish dotted-İ in CSS uppercase
  s.textContent = decision;
  return s;
}

function modelShort(id) { return (MODELS[id] ? MODELS[id].label : id).split(' (')[0]; }

function buildRow(r) {
  const tr = document.createElement('tr');
  if (r.human_decision) tr.classList.add('row-human');
  if (r.error) tr.classList.add('row-error');
  const td = (text, cls) => { const c = document.createElement('td'); if (text !== undefined) c.textContent = text; if (cls) c.className = cls; tr.appendChild(c); return c; };

  td(r.id);
  td(r.authors || '-', 'cell-authors');
  td(r.title, 'cell-title');
  td(r.year || '-');
  collapsible(td(undefined, 'cell-abstract'), r.abstract);
  collapsible(td(), r.summary);

  const md = td();
  const entries = Object.entries(r.modelDecisions || {});
  if (entries.length) {
    entries.forEach(([mId, info]) => {
      const d = document.createElement('div');
      d.className = 'model-decision-item';
      const n = document.createElement('span');
      n.className = 'model-decision-name';
      n.textContent = modelShort(mId);
      d.append(n, badge(info.error ? 'Hata' : info.decision));
      d.title = info.error || info.rationale || '';
      md.appendChild(d);
    });
  } else md.textContent = '-';

  td().appendChild(badge(r.ai_decision));

  // Human final decision
  const tdF = td();
  const sel = document.createElement('select');
  sel.className = `final-decision-select select-${String(r.decision).toLowerCase()}`;
  [['', `✓ AI: ${r.ai_decision}`], ['Include', 'Include'], ['Exclude', 'Exclude'], ['Uncertain', 'Uncertain']]
    .forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = t; o.selected = (r.human_decision || '') === v;
      sel.appendChild(o);
    });
  sel.addEventListener('change', () => {
    r.human_decision = sel.value;
    r.decision = sel.value || r.ai_decision;
    sel.className = `final-decision-select select-${r.decision.toLowerCase()}`;
    tr.classList.toggle('row-human', !!r.human_decision);
    updateStats(); scheduleSave();
  });
  tdF.appendChild(sel);

  const tdC = td(typeof r.confidence === 'number' ? r.confidence.toFixed(2) : '-');
  if (typeof r.confidence === 'number' && run && r.confidence < run.options.reviewThreshold) tdC.className = 'danger-text';

  // Criterion chips
  const tdA = td(undefined, 'cell-criteria');
  const codes = run ? [...run.criteria.inclusion, ...run.criteria.exclusion].map(c => c.code) : Object.keys(r.assessment || {});
  if (r.assessment && Object.keys(r.assessment).length) {
    codes.forEach(code => {
      const v = r.assessment[code] || 'unclear';
      const chip = document.createElement('span');
      chip.className = `crit-chip crit-${v} ${code.startsWith('EC') ? 'crit-ec' : 'crit-ic'}`;
      chip.textContent = `${code}${v === 'yes' ? '✓' : v === 'no' ? '✗' : '?'}`;
      chip.title = `${code}: ${v}${r.evidence && r.evidence[code] ? `\n"${r.evidence[code]}"` : ''}`;
      tdA.appendChild(chip);
    });
  } else tdA.textContent = '-';

  td(r.exclusion_reason || '-');

  const tdRel = td();
  if (typeof r.relevance_score === 'number') {
    const pct = Math.round(r.relevance_score * 100);
    const c = document.createElement('div');
    c.className = 'relevance-container';
    c.title = r.relevance_rationale || '';
    const t = document.createElement('span'); t.className = 'relevance-text'; t.textContent = `${pct}%`;
    const bg = document.createElement('div'); bg.className = 'relevance-bar-bg';
    const fill = document.createElement('div'); fill.className = 'relevance-bar-fill'; fill.style.width = `${pct}%`;
    bg.appendChild(fill); c.append(t, bg); tdRel.appendChild(c);
  } else tdRel.textContent = '-';

  const tdR = td();
  if (r.needs_human_review) { const f = document.createElement('span'); f.className = 'review-flag'; f.textContent = r.agreement === 'split' ? '👁️ Ayrışma' : '👁️ Gerekli'; tdR.appendChild(f); }
  else tdR.textContent = '-';

  collapsible(td(), r.rationale);
  return tr;
}

function updateStats() {
  let inc = 0, exc = 0, unc = 0, rev = 0, dup = 0, err = 0;
  results.forEach(r => {
    if (r.decision === 'Include') inc++;
    else if (r.decision === 'Exclude') exc++;
    else if (r.decision === 'Duplicate') dup++;
    else unc++;
    if (r.needs_human_review && !r.human_decision) rev++;
    if (r.error) err++;
  });
  el.includeCount.textContent = inc;
  el.excludeCount.textContent = exc;
  el.uncertainCount.textContent = unc;
  el.reviewCount.textContent = rev;
  el.duplicateCount.textContent = dup;
  el.totalCount.textContent = results.size;
  el.retryErrorsBtn.style.display = err && run && run.status !== 'running' ? 'inline-flex' : 'none';
  el.retryErrorsBtn.textContent = `🔁 Hatalı ${err} kaydı yeniden tara`;
  el.relevanceReportBtn.style.display = [...results.values()].some(r => typeof r.relevance_score === 'number') ? 'inline-flex' : 'none';
  updateAgreement();
}

function updateAgreement() {
  if (!run || run.activeModels.length < 2) { el.livAgreement.textContent = 'tek model'; return; }
  const pairs = C.agreementStats([...results.values()], run.activeModels);
  el.livAgreement.textContent = pairs.length
    ? pairs.map(p => `${modelShort(p.a)}–${modelShort(p.b)}: κ=${p.kappa.toFixed(2)} (%${Math.round(p.observed * 100)})`).join(' · ')
    : '-';
}

function updateLiveCost() {
  if (!run) return;
  el.livMode.textContent = run.mode === 'async' ? 'Async Batch (-%50)' : 'Paralel (Standard)';
  el.livInputTokens.textContent = formatTokens(run.usage.input);
  el.livOutputTokens.textContent = formatTokens(run.usage.output);
  el.livCost.textContent = formatCost(run.usage.cost);
}

function showRelevanceReport() {
  const tbody = el.modalReportBody;
  tbody.textContent = '';
  const top = [...results.values()].filter(r => typeof r.relevance_score === 'number')
    .sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 10);
  top.forEach((r, i) => {
    const tr = document.createElement('tr');
    [String(i + 1), r.id, r.title, r.year || '-', `${Math.round(r.relevance_score * 100)}%`, r.decision, r.relevance_rationale || '-']
      .forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  el.reportModal.style.display = 'flex';
}

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------
function exportRows() { return C.buildExportRows(run, sortedResults(), modelShort); }
function metadataRows() { return C.buildMetadataRows(run, sortedResults()); }

function exportName(ext) {
  return `screening_${new Date().toISOString().slice(0, 10)}_v${run.promptHash}.${ext}`;
}

function downloadCsv() {
  if (!run || !results.size) return showError('İndirilecek sonuç yok.');
  const rows = exportRows();
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`;
  const meta = metadataRows().slice(1).filter(([k]) => k !== 'Sistem talimatı (tam metin)')
    .map(([k, v]) => `# ${String(k).replace(/[\r\n]+/g, ' ')}: ${String(v).replace(/[\r\n]+/g, ' ')}`).join('\n');
  const csv = [headers.map(esc).join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  triggerDownload(new Blob(['﻿' + meta + '\n' + csv], { type: 'text/csv;charset=utf-8' }), exportName('csv'));
}

function downloadExcel() {
  if (!run || !results.size) return showError('İndirilecek sonuç yok.');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows());
  ws['!cols'] = Object.keys(exportRows()[0] || {}).map(h => ({ wch: /Abstract|Gerekçe|Özet|Kanıt|Başlık/.test(h) ? 50 : 14 }));
  ws['!autofilter'] = { ref: ws['!ref'] };
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  const meta = XLSX.utils.aoa_to_sheet(metadataRows().map(([k, v]) => [k, typeof v === 'string' && v.length > 32000 ? v.slice(0, 32000) + ' …[kısaltıldı]' : v]));
  meta['!cols'] = [{ wch: 40 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, meta, 'Metadata');
  const log = XLSX.utils.aoa_to_sheet([['Olay'], ...run.log.map(l => [l])]);
  XLSX.utils.book_append_sheet(wb, log, 'Log');
  XLSX.writeFile(wb, exportName('xlsx'));
}

function triggerDownload(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ------------------------------------------------------------
// Persistence (IndexedDB)
// ------------------------------------------------------------
function scheduleSave() { if (!saveTimer) saveTimer = setTimeout(() => { saveTimer = null; saveStateNow(); }, 2000); }

async function saveStateNow() {
  if (!run) return;
  try {
    await idb.set('current', Object.assign({}, run, { results: [...results.values()], savedAt: Date.now() }));
  } catch (e) {
    console.warn('Durum kaydedilemedi', e);
  }
}

async function checkSavedSession() {
  let s = null;
  try { s = await idb.get('current'); } catch (e) { return; }
  // migrate notice for v11 sessionStorage state
  if (!s || !s.records) return;
  const done = (s.results || []).length;
  const human = (s.results || []).filter(r => r.human_decision).length;
  el.resumeBanner.style.display = 'block';
  el.resumeTitle.textContent = s.status === 'done' ? '💾 Kayıtlı tarama sonuçları bulundu' : '⚠️ Yarım kalan tarama bulundu';
  el.resumeText.textContent = `${s.fileName} · ${done}/${s.records.length} kayıt · ${human} insan kararı · modeller: ${s.activeModels.join(', ')} · ${s.mode === 'async' ? `${(s.jobs || []).length} batch job` : 'paralel'} · son kayıt: ${new Date(s.savedAt).toLocaleString('tr-TR')}`;
  el.resumeBtn.onclick = () => restoreSession(s);
  el.discardBtn.onclick = async () => {
    if (!confirm('Kayıtlı oturum silinsin mi? (İnsan kararları dahil tüm sonuçlar silinir.)')) return;
    await idb.del('current');
    el.resumeBanner.style.display = 'none';
  };
}

function restoreSession(s) {
  const { results: rows, ...rest } = s;
  run = rest;
  run.log = run.log || [];
  results = new Map((rows || []).map(r => [r.rid, r]));
  // Make the same records available for a new analysis without re-uploading
  file = { name: run.fileName, hash: run.fileHash, records: run.records, columns: run.columns || {},
    duplicates: run.records.filter(r => r.duplicateOf).length, rows: null };
  el.analyzeBtn.disabled = false;
  el.fileInfo.style.display = 'block';
  el.fileInfo.textContent = `📄 ${run.fileName}: ${run.records.length} kayıt (kayıtlı oturumdan yüklendi)`;
  // Restore the protocol that produced these results (reproducibility)
  el.systemPrompt.value = run.guidance || el.systemPrompt.value;
  el.inclusionCriteria.value = run.icText || el.inclusionCriteria.value;
  el.exclusionCriteria.value = run.ecText || el.exclusionCriteria.value;
  el.userResearchTopic.value = run.options.userTopic || '';
  el.icLogic.value = run.options.icLogic;
  el.reviewThreshold.value = run.options.reviewThreshold;
  el.consensusStrategy.value = run.options.consensus;
  settings.activeModels = run.activeModels.filter(m => MODELS[m]);
  settings.mode = run.mode;
  document.querySelector(`input[name="mode"][value="${run.mode}"]`).checked = true;
  renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateModeUI(); updateConsistencyWarnings();
  el.resumeBanner.style.display = 'none';
  showRunUI();
  renderJobInfo();
  const remaining = run.records.length - results.size;
  if (run.status === 'done' && !remaining) {
    el.progressBar.style.width = '100%';
    el.progressText.textContent = `✅ Kayıtlı sonuçlar yüklendi (${results.size} kayıt). İnsan kararlarını girmeye devam edebilirsiniz.`;
  } else {
    run.status = 'paused';
    el.progressBar.style.width = `${(results.size / run.records.length) * 100}%`;
    el.progressText.textContent = run.mode === 'async' && run.jobs.length
      ? `Kayıtlı ${run.jobs.length} batch job var. Gönderen anahtarları girip "Devam Et"e basın.`
      : `${remaining} kayıt kaldı. Anahtarları kontrol edip "Devam Et"e basın (aynı protokol ve prompt sürümü kullanılır: v${run.promptHash}).`;
    el.continueBtn.style.display = 'inline-flex';
  }
  updateCostEstimate();
  logEvent('Kayıtlı oturum yüklendi.');
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
async function hashString(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('');
}

function debounce(fn, ms) {
  let t = null;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function formatTokens(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function formatCost(usd) {
  if (!usd) return '$0.00';
  return usd < 0.01 ? '$' + usd.toFixed(4) : '$' + usd.toFixed(2);
}

function formatDuration(min) {
  if (!isFinite(min) || min <= 0) return '-';
  if (min < 1) return '< 1 dk';
  if (min < 90) return `~${Math.ceil(min)} dk`;
  if (min < 1440 * 1.5) return `~${(min / 60).toFixed(1)} saat`;
  return `~${Math.ceil(min / 1440)} gün (günlük kota nedeniyle)`;
}

function flash(msg, cls, ms) {
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = msg;
  const target = document.querySelector('.upload-section');
  target.insertBefore(div, target.firstChild);
  setTimeout(() => div.remove(), ms);
}
function showError(msg) { flash('❌ ' + msg, 'error-message', 10000); }
function showSuccess(msg) { flash('✅ ' + msg, 'success-message', 5000); }
