// ============================================================
// GEMINI LITERATURE SCREENING — v13 (web UI)
// Parallel multi-key screening · multi-model consensus ·
// criterion-level decision rule · resumable (IndexedDB)
// Engine: screening-core.js (window.ScreeningCore)
// Screening table, duplicates, projects: workspace.js · Supabase: cloud.js
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
let saveTimer = null, keyTableTimer = null;
let resumeAction = null;   // what "Devam Et" continues (new analysis or a re-analysis)

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
  initWorkspace();
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
  if (settings.formVersion !== 13) delete f.summaryLanguage; // v13: Turkish short rationale by default
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
  settings.formVersion = 13;
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
  el.nextSampleBtn.addEventListener('click', runNextSample);
  ['sampleMode', 'sampleN', 'sampleFrom', 'sampleTo'].forEach(id => el[id].addEventListener('input', () => { updateSampleUI(); updateCostEstimate(); }));
  document.querySelectorAll('.sample-chip').forEach(b => b.addEventListener('click', () => {
    el.sampleMode.value = b.dataset.mode;
    if (b.dataset.n) el.sampleN.value = b.dataset.n;
    updateSampleUI(); updateCostEstimate();
  }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).style.display = 'none'; }));

  el.themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem(LS.theme, isLight ? 'light' : 'dark');
    el.themeToggleBtn.textContent = isLight ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
  });

  window.addEventListener('beforeunload', e => {
    if (isScreeningRunning()) { saveStateNow(); e.preventDefault(); e.returnValue = ''; }
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
  el.sampleGroup.style.display = 'block';
  el.sampleTo.value = Math.min(parseInt(el.sampleTo.value, 10) || 50, prepared.records.length);
  updateSampleUI();
  updateCostEstimate();
}

// ------------------------------------------------------------
// Sample selection (analyse the first N / a random N / a range first)
// ------------------------------------------------------------
function screenable(records, options) {
  return records.filter(r => !r.duplicateOf && !(r.noAbstract && options.noAbstractMode === 'skip'));
}

function sampleSpec() {
  const mode = el.sampleMode.value;
  const n = Math.max(1, parseInt(el.sampleN.value, 10) || 1);
  const from = Math.max(1, parseInt(el.sampleFrom.value, 10) || 1);
  const to = Math.max(from, parseInt(el.sampleTo.value, 10) || from);
  return { mode, n, from, to };
}

/** Applies the picker to candidate records (already free of duplicates/presets). */
function applySample(list, spec = sampleSpec()) {
  if (spec.mode === 'first') return list.slice(0, spec.n);
  if (spec.mode === 'random') {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, spec.n).sort((x, y) => x.order - y.order);
  }
  if (spec.mode === 'range') return list.filter(r => r.order + 1 >= spec.from && r.order + 1 <= spec.to);
  return list;
}

function updateSampleUI() {
  const { mode } = sampleSpec();
  el.sampleNField.style.display = mode === 'first' || mode === 'random' ? 'inline-flex' : 'none';
  el.sampleRangeField.style.display = mode === 'range' ? 'inline-flex' : 'none';
  document.querySelectorAll('.sample-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode && (!b.dataset.n || b.dataset.n === String(sampleSpec().n)));
  });
  if (!file.records.length) return;
  const cands = screenable(file.records, currentOptions());
  const n = applySample(cands).length;
  el.sampleInfo.textContent = `${n.toLocaleString('tr-TR')} / ${cands.length.toLocaleString('tr-TR')} kayıt analiz edilecek`;
  el.analyzeBtn.textContent = n < cands.length ? `🚀 Analizi Başlat (${n.toLocaleString('tr-TR')} kayıt)` : '🚀 Analizi Başlat';
}

// ------------------------------------------------------------
// Cost / duration estimate
// ------------------------------------------------------------
function updateCostEstimate() {
  if (!file.records.length) { el.costEstimatePanel.style.display = 'none'; return; }
  const { system, criteria, options } = currentProtocolConfig();
  const toScreen = applySample(screenable(file.records, options));
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
    human: {},              // rid -> { decision, labels, note } (local reviewer)
    cloudProjectId: null,
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
  if (isScreeningRunning()) return showError('Bir analiz zaten çalışıyor.');
  const cfg = currentProtocolConfig();
  if (!cfg.criteria.inclusion.length) return showError('En az bir dahil etme ölçütü (IC) girin.');
  const models = resolveModels(settings.activeModels);
  const missing = [...new Set(models.map(m => m.pool))].filter(p => !keysFor(p).length);
  if (missing.length) return showError(`API anahtarı eksik: ${missing.join(', ')}`);
  const warnings = C.checkGuidanceConsistency(cfg.guidance, cfg.criteria);
  if (warnings.length && !confirm(`Ölçütler ile yönerge arasında tutarsızlık var:\n\n• ${warnings.join('\n• ')}\n\nYine de başlatılsın mı?`)) return;
  if (run && run.human && Object.values(run.human).some(h => h.decision) &&
      !confirm('Mevcut yerel sonuçlarda sizin kararlarınız var. Yeni analiz bunların yerini alacak. Önce dışa aktarmanız ya da veritabanına kaydetmeniz önerilir. Devam edilsin mi?')) return;

  run = newRun(cfg, models);
  run.promptHash = await hashString(run.system);
  results = new Map();

  // Records that are not sent to a model
  run.records.forEach(r => {
    if (r.duplicateOf) upsert(C.presetResult(r, 'Duplicate', `Tekrar kaydı: ${r.duplicateOf} ile aynı (DOI veya başlık+yıl).`));
    else if (r.noAbstract && run.options.noAbstractMode === 'skip') upsert(C.presetResult(r, 'Uncertain', 'Özet yok — tam metin/insan incelemesi gerekli.'));
  });

  run.sample = sampleSpec();
  const todo = applySample(pendingRecords(), run.sample);
  showRunUI();
  logEvent(`Yeni analiz: ${run.records.length} kayıt, analiz edilecek ${todo.length}, modeller: ${run.activeModels.join(', ')}, mod: ${run.mode}, prompt v${run.promptHash}`);
  await saveStateNow();
  if (run.mode === 'async') await startAsync(todo);
  else await runSync(todo);
}

// After a sample: the next N (first/random) of the records that are still waiting
async function runNextSample() {
  if (!run || isScreeningRunning()) return;
  const spec = Object.assign({}, run.sample || sampleSpec());
  if (spec.mode === 'range') { spec.mode = 'first'; spec.n = spec.to - spec.from + 1; }
  if (spec.mode === 'all') { await runSync(); return; }
  el.nextSampleBtn.style.display = 'none';
  await runSync(applySample(pendingRecords(), spec));
}

function sampleSize(spec) {
  if (!spec || spec.mode === 'all') return 0;
  return spec.mode === 'range' ? spec.to - spec.from + 1 : spec.n;
}

function pendingRecords() {
  return run.records.filter(r => !results.has(r.rid));
}

/**
 * Shared parallel runner: new analyses, "continue", error retries and
 * re-analysis of selected records (local or cloud project).
 */
async function executeScreening(job) {
  controller = new AbortController();
  pools = buildPools(job.models);
  const capacity = Object.values(pools).reduce((s, p) => s + p.capacity, 0);
  logEvent(`${job.records.length} kayıt taranıyor · ${Object.values(pools).reduce((s, p) => s + p.size, 0)} anahtar · toplam paralellik ${capacity}`);
  el.progressSection.style.display = 'block';
  el.pauseBtn.style.display = 'inline-flex';
  el.continueBtn.style.display = 'none';
  el.nextSampleBtn.style.display = 'none';
  el.analyzeBtn.disabled = true;
  el.keyStatusTable.style.display = 'table';
  renderKeyTable();
  const keyTicker = setInterval(renderKeyTable, 1000);
  let got = 0;
  try {
    return await C.runScreening({
      records: job.records,
      models: job.models,
      pools,
      system: job.system,
      batchSize: job.batchSize,
      temperature: job.temperature,
      validation: job.validation,
      signal: controller.signal,
      onRecord: row => {
        got++;
        row.promptHash = job.promptHash;
        job.onRow(row);
        scheduleWsRender();
      },
      onUsage: job.onUsage,
      onProgress: p => {
        const st = job.progress(p, got);
        el.progressBar.style.width = `${Math.min(100, st.pct)}%`;
        el.progressText.textContent = st.text;
      },
      onLog: logEvent,
      onFatal: err => { showError(err.message); logEvent(`⛔ ${err.message}`); }
    });
  } catch (err) {
    showError('Beklenmeyen hata: ' + err.message);
    console.error(err);
    return { completed: false, fatal: null, error: err };
  } finally {
    clearInterval(keyTicker);
    renderKeyTable();
    controller = null;
    el.analyzeBtn.disabled = false;
  }
}

function isScreeningRunning() {
  return !!controller || !!(run && run.mode === 'async' && run.status === 'running' && pollTimer);
}

function showPaused(res, remaining) {
  el.continueBtn.textContent = '▶️ Devam Et';
  el.nextSampleBtn.style.display = 'none';
  el.progressText.textContent = res && res.fatal
    ? `⛔ Durduruldu: ${res.fatal.message}`
    : `⏸️ Duraklatıldı: ${remaining} kayıt kaldı. "Devam Et" ile sürdürebilirsiniz.`;
  el.pauseBtn.style.display = 'none';
  el.continueBtn.style.display = 'inline-flex';
}

async function runSync(recordsOverride) {
  const todo = recordsOverride || pendingRecords();
  if (!todo.length) { finishRun(); return; }
  run.status = 'running';
  resumeAction = () => runSync();
  const res = await executeScreening({
    records: todo,
    models: run.models,
    system: run.system,
    batchSize: run.batchSize,
    temperature: run.options.temperature,
    validation: validationFor(run),
    promptHash: run.promptHash,
    onRow: row => { upsert(row); scheduleSave(); },
    onUsage: (modelId, u) => accumulateCost(modelId, u, 'standard', run.usage),
    progress: (p, got) => ({
      pct: got / todo.length * 100,
      text: `${got.toLocaleString('tr-TR')} / ${todo.length.toLocaleString('tr-TR')} kayıt · toplam ${results.size.toLocaleString('tr-TR')} / ${run.records.length.toLocaleString('tr-TR')} · uçuşta ${p.inflight} istek · kuyrukta ${p.queued} iş`
    })
  });
  if (res.completed) finishRun();
  else {
    run.status = 'paused';
    showPaused(res, pendingRecords().length);
  }
  renderWorkspace();
  await saveStateNow();
}

/**
 * Re-screens the given records with the protocol, models and keys that are
 * currently set on the Analysis tab. Works on the local analysis and, for
 * the admin, on an open cloud project (results are written to Supabase).
 */
async function reanalyzeRecords(recs, opts = {}) {
  if (isScreeningRunning()) return showError('Bir analiz zaten çalışıyor.');
  const cloud = WS.isCloud;
  if (!cloud && !run) return showError('Önce bir analiz yükleyin.');
  const cfg = currentProtocolConfig();
  if (!cfg.criteria.inclusion.length) { switchTab('analysis'); return showError('Analiz sekmesinde en az bir dahil etme ölçütü (IC) olmalı.'); }
  const models = resolveModels(settings.activeModels);
  const missing = [...new Set(models.map(m => m.pool))].filter(p => !keysFor(p).length);
  if (missing.length) { switchTab('analysis'); return showError(`API anahtarı eksik (${missing.join(', ')}). Yeniden analiz için anahtarları Analiz sekmesinde girin.`); }
  const promptHash = await hashString(cfg.system);
  if (!opts.resume) {
    const prevHash = cloud ? (WS.project.protocol || {}).promptHash : run.promptHash;
    const msg = [
      `${recs.length.toLocaleString('tr-TR')} kayıt yapay zekâ ile yeniden analiz edilecek.`,
      `Modeller: ${models.map(m => modelShort(m.id)).join(', ')}`,
      `Protokol: Analiz sekmesindeki ölçütler ve yönerge (v${promptHash})${prevHash && prevHash !== promptHash ? ` — mevcut sonuçlar v${prevHash} ile üretilmişti` : ''}`,
      'Yeni AI kararları eskilerinin yerine yazılır; hakem kararları, etiketler ve notlar korunur.',
      settings.mode === 'async' ? 'Not: Yeniden analiz her zaman paralel (gerçek zamanlı) modda yapılır.' : ''
    ].filter(Boolean).join('\n\n');
    if (!confirm(msg + '\n\nDevam edilsin mi?')) return;
  }
  const batchSize = Math.max(1, parseInt(el.batchSize.value, 10) || 5);
  const adopted = {
    criteria: cfg.criteria, options: cfg.options, guidance: cfg.guidance,
    icText: el.inclusionCriteria.value, ecText: el.exclusionCriteria.value,
    system: cfg.system, promptHash, models, activeModels: models.map(m => m.id), batchSize
  };
  let usage;
  if (cloud) {
    const prev = WS.project.protocol || {};
    WS.project.protocol = Object.assign({}, prev, adopted, { usage: prev.usage || { input: 0, output: 0, cost: 0, perModel: {} } });
    try { await Cloud.updateProject(WS.project.id, { protocol: WS.project.protocol }); }
    catch (e) { return showError('Proje protokolü güncellenemedi: ' + e.message); }
    usage = WS.project.protocol.usage;
  } else {
    if (run.promptHash !== promptHash) logEvent(`Protokol güncellendi: v${run.promptHash} → v${promptHash}`);
    Object.assign(run, adopted);
    usage = run.usage;
  }

  const done = new Set();
  const deliver = row => {
    done.add(row.rid);
    if (cloud) applyCloudAiRow(row);
    else { upsert(row); scheduleSave(); }
  };
  const toScreen = [];
  recs.forEach(r => {
    if (r.noAbstract && cfg.options.noAbstractMode === 'skip') {
      const row = C.presetResult(r, 'Uncertain', 'Özet yok — tam metin/insan incelemesi gerekli.');
      row.promptHash = promptHash;
      deliver(row);
    } else toScreen.push(r);
  });
  resumeAction = () => reanalyzeRecords(recs.filter(r => !done.has(r.rid)), { resume: true });
  if (!cloud) run.status = 'running';
  logEvent(`Yeniden analiz: ${toScreen.length} kayıt · prompt v${promptHash}${cloud ? ` · proje "${WS.project.name}"` : ''}`);
  const total = toScreen.length;
  const res = await executeScreening({
    records: toScreen,
    models,
    system: cfg.system,
    batchSize,
    temperature: cfg.options.temperature,
    validation: Object.assign({ criteria: cfg.criteria }, cfg.options),
    promptHash,
    onRow: deliver,
    onUsage: (modelId, u) => accumulateCost(modelId, u, 'standard', usage),
    progress: (p, got) => ({
      pct: total ? got / total * 100 : 100,
      text: `🔁 Yeniden analiz: ${got.toLocaleString('tr-TR')} / ${total.toLocaleString('tr-TR')} kayıt · uçuşta ${p.inflight} istek · kuyrukta ${p.queued} iş`
    })
  });
  if (cloud) {
    await flushCloudAi();
    Cloud.updateProject(WS.project.id, { protocol: WS.project.protocol }).catch(e => console.warn(e));
  }
  if (res.completed) {
    resumeAction = null;
    el.progressBar.style.width = '100%';
    const errs = recs.filter(r => { const a = WS.ai.get(r.rid); return a && a.error; }).length;
    el.progressText.textContent = `✅ Yeniden analiz tamamlandı: ${recs.length} kayıt${errs ? ` · ${errs} kayıtta API hatası` : ''}.`;
    el.pauseBtn.style.display = 'none';
    el.continueBtn.style.display = 'none';
    if (!cloud) run.status = pendingRecords().length ? 'paused' : 'done';
    WS.selected.clear();
    logEvent('Yeniden analiz tamamlandı.');
  } else {
    if (!cloud) run.status = 'paused';
    showPaused(res, recs.length - done.size);
  }
  renderWorkspace();
  if (!cloud) await saveStateNow();
}

/** Puts a saved protocol (local run or cloud project) back into the Analysis form. */
function loadProtocolIntoForm(p) {
  if (!p || !p.criteria) return showError('Kayıtlı protokol bulunamadı.');
  el.systemPrompt.value = p.guidance || '';
  el.inclusionCriteria.value = p.icText || p.criteria.inclusion.map(c => c.text).join('\n');
  el.exclusionCriteria.value = p.ecText || p.criteria.exclusion.map(c => c.text).join('\n');
  const o = p.options || {};
  if (o.icLogic) el.icLogic.value = o.icLogic;
  if (typeof o.reviewThreshold === 'number') el.reviewThreshold.value = o.reviewThreshold;
  if (o.consensus) el.consensusStrategy.value = o.consensus;
  if (o.summaryLanguage) el.summaryLanguage.value = o.summaryLanguage;
  if (o.noAbstractMode) el.noAbstractMode.value = o.noAbstractMode;
  if (typeof o.verifyEvidence === 'boolean') el.verifyEvidence.checked = o.verifyEvidence;
  el.temperature.value = o.temperature === null || o.temperature === undefined ? '' : o.temperature;
  el.userResearchTopic.value = o.userTopic || '';
  const models = (p.activeModels || []).filter(m => MODELS[m]);
  if (models.length) settings.activeModels = models;
  if (p.batchSize) el.batchSize.value = p.batchSize;
  localStorage.setItem(LS.prompt, el.systemPrompt.value);
  localStorage.setItem(LS.inclusion, el.inclusionCriteria.value);
  localStorage.setItem(LS.exclusion, el.exclusionCriteria.value);
  localStorage.setItem(LS.topic, el.userResearchTopic.value);
  saveSettings(); renderModelSlots(); updateProviderVisibility(); updateModelInfo(); updateConsistencyWarnings(); updateCostEstimate();
  showSuccess(`Protokol (v${p.promptHash || '?'}) Analiz formuna yüklendi. API anahtarlarını girip yeniden analiz yapabilirsiniz.`);
}

function pauseRun() {
  if (controller) controller.abort();
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; run.status = 'paused'; el.continueBtn.style.display = 'inline-flex'; el.pauseBtn.style.display = 'none'; }
  logEvent('Kullanıcı duraklattı.');
}

async function continueRun() {
  if (resumeAction) { await resumeAction(); return; }
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

function finishRun() {
  const remaining = pendingRecords().length;
  run.status = remaining ? 'paused' : 'done';
  el.progressBar.style.width = '100%';
  const errs = [...results.values()].filter(r => r.error).length;
  const errTxt = errs ? ` · ${errs} kayıtta API hatası (yeniden taranabilir)` : '';
  el.pauseBtn.style.display = 'none';
  if (remaining) {
    const next = Math.min(sampleSize(run.sample) || remaining, remaining);
    el.progressText.textContent = `✅ ${results.size.toLocaleString('tr-TR')} kayıt analiz edildi${errTxt} · ${remaining.toLocaleString('tr-TR')} kayıt bekliyor.`;
    el.nextSampleBtn.textContent = `▶️ Sonraki ${next.toLocaleString('tr-TR')} kayıt`;
    el.nextSampleBtn.style.display = next < remaining ? 'inline-flex' : 'none';
    el.continueBtn.textContent = `⏩ Kalanların tümü (${remaining.toLocaleString('tr-TR')})`;
    el.continueBtn.style.display = 'inline-flex';
    resumeAction = () => runSync();
    // show what was analysed instead of hundreds of empty rows
    if (el.filterAi.value === 'all') { el.filterAi.value = 'analyzed'; WS.page = 1; }
    logEvent(`Örneklem tamamlandı; ${remaining} kayıt bekliyor.`);
  } else {
    el.progressText.textContent = `✅ Tamamlandı: ${results.size.toLocaleString('tr-TR')} kayıt${errTxt}.`;
    el.continueBtn.style.display = 'none';
    el.nextSampleBtn.style.display = 'none';
    resumeAction = null;
    if (el.filterAi.value === 'analyzed') el.filterAi.value = 'all';
    logEvent('Analiz tamamlandı.');
  }
  renderWorkspace();
  saveStateNow();
}

function showRunUI() {
  el.progressSection.style.display = 'block';
  showLocalWorkspace();
  switchTab('screen');
  updateLiveCost();
}

function upsert(row) {
  results.set(row.rid, row);
}

function accumulateCost(modelId, u, tier, usage = run.usage) {
  const p = (MODELS[modelId] || MODELS['gemini-3.5-flash'])[tier];
  const inT = u.promptTokens || 0, outT = u.completionTokens || 0;
  usage.input = (usage.input || 0) + inT;
  usage.output = (usage.output || 0) + outT;
  usage.cost = (usage.cost || 0) + inT / 1e6 * p.inputPrice + outT / 1e6 * p.outputPrice;
  usage.perModel = usage.perModel || {};
  const pm = usage.perModel[modelId] = usage.perModel[modelId] || { input: 0, output: 0 };
  pm.input += inT; pm.output += outT;
  scheduleLiveCost();
}
const scheduleLiveCost = debounce(() => updateLiveCost(), 300);

// ------------------------------------------------------------
// Async (Gemini Batch API) — jobs split across keys
// ------------------------------------------------------------
function geminiBase(m) { return (m.baseUrl || PROVIDER_BASE.gemini).replace(/\/+$/, ''); }

async function startAsync(todo = pendingRecords()) {
  pools = buildPools(run.models);
  const pool = pools[run.models[0].pool];
  let jobs = C.planBatchJobs({
    records: todo, models: run.models, keyCount: pool.size, batchSize: run.batchSize,
    system: run.system, userTopic: run.options.userTopic, useSchema: true, temperature: run.options.temperature,
    summaryLanguage: run.options.summaryLanguage
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
// Results summary helpers (table itself: workspace.js)
// ------------------------------------------------------------
function modelShort(id) { return (MODELS[id] ? MODELS[id].label : id).split(' (')[0]; }

function updateAgreement() {
  if (!run || run.activeModels.length < 2) { el.livAgreement.textContent = 'tek model'; return; }
  const pairs = C.agreementStats([...results.values()], run.activeModels);
  el.livAgreement.textContent = pairs.length
    ? pairs.map(p => `${modelShort(p.a)}–${modelShort(p.b)}: κ=${p.kappa.toFixed(2)} (%${Math.round(p.observed * 100)})`).join(' · ')
    : '-';
}

function updateLiveCost() {
  if (!run || WS.isCloud) return;
  el.livMode.textContent = run.mode === 'async' ? 'Async Batch (-%50)' : 'Paralel (Standard)';
  el.livInputTokens.textContent = formatTokens(run.usage.input);
  el.livOutputTokens.textContent = formatTokens(run.usage.output);
  el.livCost.textContent = formatCost(run.usage.cost);
}

// ------------------------------------------------------------
// Export helpers (row building: workspace.js)
// ------------------------------------------------------------
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
  const human = Object.values(s.human || {}).filter(h => h.decision).length || (s.results || []).filter(r => r.human_decision).length;
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
  run.human = run.human || {};
  results = new Map((rows || []).map(r => [r.rid, r]));
  // v12 kept the human decision on the AI row
  results.forEach(r => {
    if (r.human_decision && !run.human[r.rid]) run.human[r.rid] = { decision: r.human_decision, labels: [], note: '' };
    delete r.human_decision;
    r.decision = r.ai_decision || r.decision;
  });
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
  if (remaining && !(run.mode === 'async' && run.jobs.some(j => !j.done))) {
    finishRun();
  } else if (run.status === 'done' && !remaining) {
    el.progressBar.style.width = '100%';
    el.progressText.textContent = `✅ Kayıtlı sonuçlar yüklendi (${results.size} kayıt). Tarama sekmesinde kararlarınızı vermeye devam edebilirsiniz.`;
  } else {
    run.status = 'paused';
    if (run.mode !== 'async' || !run.jobs.length) resumeAction = () => runSync();
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
  div.title = 'Kapatmak için tıklayın';
  div.addEventListener('click', () => div.remove());
  el.toastHost.prepend(div);
  while (el.toastHost.children.length > 4) el.toastHost.lastChild.remove();
  setTimeout(() => div.remove(), ms);
}
function showError(msg) { flash('❌ ' + msg, 'error-message', 10000); }
function showSuccess(msg) { flash('✅ ' + msg, 'success-message', 5000); }
