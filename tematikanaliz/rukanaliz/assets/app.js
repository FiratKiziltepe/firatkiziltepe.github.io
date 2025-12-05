import { GoogleGenerativeAI } from '@google/generative-ai';

// Protected keywords that cannot be removed from prompt
// Only keywords that actually appear in the prompt examples
const PROTECTED_KEYWORDS = ['mainCategory', 'subTheme', 'sentiment', 'direction'];

// Default system prompt template
const DEFAULT_SYSTEM_PROMPT = `Sen bir tematik analiz uzmanısın. Verilen serbest metin cevaplarını analiz et ve kategorize et.

SORU/BAĞLAM: "{{COLUMN_NAME}}"

GÖREV:
Her cevap için:
1. 1-3 ana tema/konu belirle (cevap birden fazla konuya değiniyorsa ayır)
2. Her tema için:
   - mainCategory: Temayı en iyi tanımlayan kategori adı (kısa, öz, Türkçe)
   - subTheme: Daha spesifik alt tema (kısa, öz, Türkçe)
   - sentiment: Pozitif/Negatif/Nötr/Yapıcı Eleştiri
   - direction: İfadenin yönelimi (Talep/İstek, Şikayet/Sorun, Memnuniyet, Tespit)
3. actionable: Somut aksiyon gerektiriyor mu?

YÖNELİM (direction) AÇIKLAMALARI:
- Talep/İstek: Bir şey isteniyor, öneri sunuluyor, değişiklik talep ediliyor
- Şikayet/Sorun: Bir problemden, eksiklikten bahsediliyor, memnuniyetsizlik bildiriliyor
- Memnuniyet: Olumlu görüş, memnuniyet, beğeni ifade ediliyor
- Tespit: Sadece bir durum tespiti yapılıyor, nötr bir gözlem

KURALLAR:
- Kategorileri verilerden organik olarak çıkar
- Benzer konuları aynı kategori altında topla
- Kısa, kurumsal, Türkçe isimler kullan
- Aynı kişinin farklı konulara değiniyorsa ayır (max 3 topic)
- Boş/anlamsız cevaplar için tek bir "Yanıt Yok" kategorisi kullan

ÖRNEKLER:

Cevap: "Etkinlikler çocukların düzeyine uygun fakat çeşitlendirilmeli, okuma metinleri arttırılmalı."
→ 3 topic:
  1. mainCategory: "İçerik Kalitesi", subTheme: "Etkinlikler düzeye uygun", sentiment: "Pozitif", direction: "Memnuniyet"
  2. mainCategory: "İçerik Zenginleştirme", subTheme: "Etkinlik çeşitliliği talebi", sentiment: "Yapıcı Eleştiri", direction: "Talep/İstek"
  3. mainCategory: "İçerik Zenginleştirme", subTheme: "Okuma metni artış talebi", sentiment: "Yapıcı Eleştiri", direction: "Talep/İstek"

Cevap: "Görseller konuyu anlatmada yetersiz kalıyor ancak renkler canlı seçilmiş."
→ 2 topic:
  1. mainCategory: "Görsel Tasarım", subTheme: "Görsellerin öğreticiliği yetersiz", sentiment: "Negatif", direction: "Şikayet/Sorun"
  2. mainCategory: "Görsel Tasarım", subTheme: "Renk seçimi başarılı", sentiment: "Pozitif", direction: "Memnuniyet"

Cevap: "Sorun yok"
→ 1 topic:
  mainCategory: "Genel Değerlendirme", subTheme: "Memnuniyet", sentiment: "Pozitif", direction: "Memnuniyet"

Cevap: ""
→ 1 topic:
  mainCategory: "Yanıt Yok", subTheme: "Cevap verilmedi", sentiment: "Nötr", direction: "Tespit"`;

// Load saved API keys from localStorage
function loadApiKeys() {
    const saved = localStorage.getItem('gemini_api_keys');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
    // Migrate from old single key
    const oldKey = localStorage.getItem('gemini_api_key_dynamic');
    if (oldKey) {
        return [oldKey];
    }
    return [];
}

// Global state
const state = {
    apiKeys: loadApiKeys(),
    currentApiKeyIndex: 0,
    selectedModel: localStorage.getItem('gemini_model_dynamic') || 'gemini-2.5-flash',
    batchSize: parseInt(localStorage.getItem('batch_size_dynamic')) || 10,
    customPrompt: localStorage.getItem('custom_prompt') || DEFAULT_SYSTEM_PROMPT,
    rawData: [],
    columns: [],
    selectedIdColumn: null,
    selectedAnalysisColumns: [],
    analysisResults: {}, // { columnName: [results] }
    enrichedData: [],
    stats: {}, // { columnName: stats }
    globalStats: null,
    executiveSummary: '',
    currentPage: 1,
    itemsPerPage: 20,
    searchTerm: '',
    columnFilter: 'all',
    sentimentFilter: 'all',
    categoryFilter: 'all',
    themeFilter: 'all',
    directionFilter: 'all',
    charts: {},
    currentAnalysisId: null, // For tracking current/loaded analysis
    isHistoryMode: false, // Whether viewing from history
    failedRows: [], // Track failed rows for retry
    currentBatchSize: 10, // Adaptive batch size
    // Analysis control
    isAnalyzing: false,
    isPaused: false,
    shouldStop: false,
    // Parallel processing
    parallelProcessing: localStorage.getItem('parallel_processing') === 'true',
    // Partial save tracking
    completedColumns: [], // Track which columns are completed
    partialAnalysisId: null // ID for partial saves
};

// Backward compatibility getter
Object.defineProperty(state, 'apiKey', {
    get: function() {
        return this.apiKeys[this.currentApiKeyIndex] || '';
    },
    set: function(value) {
        if (this.apiKeys.length === 0) {
            this.apiKeys.push(value);
        } else {
            this.apiKeys[this.currentApiKeyIndex] = value;
        }
    }
});

// Model Definitions
const AVAILABLE_MODELS = [
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        limitInfo: 'BGBG: 2, TPM: 125.000, RPD: 50'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        limitInfo: 'BGBG: 10, TPM: 250.000, RPD: 250'
    },
    {
        id: 'gemini-2.5-flash-preview',
        name: 'Gemini 2.5 Flash Önizlemesi',
        limitInfo: 'BGBG: 10, TPM: 250.000, RPD: 250'
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        limitInfo: 'BGBG: 15, TPM: 250.000, RPD: 1.000'
    }
];

const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
const DELAY_BETWEEN_COLUMNS = 3000; // 3 seconds between columns
const AVG_API_RESPONSE_TIME = 3000; // Average API response time in ms

// Progress tracking
let analysisStartTime = null;
let processedRowsCount = 0;
let totalRowsToProcess = 0;

// Calculate estimated time
function calculateEstimatedTime(rowCount, columnCount, batchSize) {
    if (!rowCount || !columnCount || !batchSize) return null;
    
    const batchesPerColumn = Math.ceil(rowCount / batchSize);
    const totalBatches = batchesPerColumn * columnCount;
    
    // Time per batch = API response time + delay
    const timePerBatch = AVG_API_RESPONSE_TIME + DELAY_BETWEEN_BATCHES;
    const columnDelayTime = (columnCount - 1) * DELAY_BETWEEN_COLUMNS;
    
    let totalTimeMs = (totalBatches * timePerBatch) + columnDelayTime;
    
    // If parallel processing is enabled, divide by number of API keys
    const validApiKeys = state.apiKeys.filter(k => k && k.trim().length > 0);
    if (state.parallelProcessing && validApiKeys.length > 1) {
        const parallelFactor = Math.min(validApiKeys.length, columnCount);
        totalTimeMs = totalTimeMs / parallelFactor;
    }
    
    return {
        totalMs: totalTimeMs,
        formatted: formatDuration(totalTimeMs),
        batches: totalBatches,
        batchesPerColumn,
        isParallel: state.parallelProcessing && validApiKeys.length > 1
    };
}

// Format duration to human readable
function formatDuration(ms) {
    if (!ms || ms < 0) return '--:--';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}s ${minutes % 60}dk`;
    } else if (minutes > 0) {
        return `${minutes}dk ${seconds % 60}sn`;
    } else {
        return `${seconds}sn`;
    }
}

// Update estimated time display
function updateEstimatedTimeDisplay() {
    const rowCount = state.rawData.length;
    const columnCheckboxes = document.querySelectorAll('#analysisColumnsContainer input[type="checkbox"]:checked');
    const columnCount = columnCheckboxes.length || 1;
    const batchSize = state.batchSize;
    
    const estimate = calculateEstimatedTime(rowCount, columnCount, batchSize);
    
    const displayEl = document.getElementById('estimatedTimeDisplay');
    const detailsEl = document.getElementById('estimatedTimeDetails');
    
    if (displayEl) {
        if (estimate) {
            displayEl.textContent = estimate.formatted;
        } else {
            displayEl.textContent = '-';
        }
    }
    
    if (detailsEl && estimate) {
        let details = `${estimate.batches} batch × ${columnCount} sütun`;
        if (estimate.isParallel) {
            const validApiKeys = state.apiKeys.filter(k => k && k.trim().length > 0);
            details += ` (${validApiKeys.length}x paralel)`;
        }
        detailsEl.textContent = details;
    }
}

// Start progress tracking
function startProgressTracking() {
    analysisStartTime = Date.now();
    processedRowsCount = 0;
    
    // Start elapsed time updater
    updateElapsedTime();
}

// Update elapsed time display
function updateElapsedTime() {
    if (!analysisStartTime) return;
    
    const elapsed = Date.now() - analysisStartTime;
    const elapsedEl = document.getElementById('elapsedTimeDisplay');
    if (elapsedEl) {
        elapsedEl.textContent = formatDuration(elapsed);
    }
    
    // Update remaining time estimate
    if (processedRowsCount > 0 && totalRowsToProcess > 0) {
        const avgTimePerRow = elapsed / processedRowsCount;
        const remainingRows = totalRowsToProcess - processedRowsCount;
        const remainingTime = remainingRows * avgTimePerRow;
        
        const remainingEl = document.getElementById('remainingTimeDisplay');
        if (remainingEl) {
            remainingEl.textContent = formatDuration(remainingTime);
        }
    }
    
    // Continue updating if analysis is running
    if (document.getElementById('progressSection') && !document.getElementById('progressSection').classList.contains('hidden')) {
        setTimeout(updateElapsedTime, 1000);
    }
}

// Update processed rows count
function updateProcessedRows(count) {
    processedRowsCount = count;
    const displayEl = document.getElementById('processedRowsDisplay');
    if (displayEl) {
        displayEl.textContent = `${count} / ${totalRowsToProcess}`;
    }
}

// Update active API key display
function updateActiveApiKeyDisplay() {
    const displayEl = document.getElementById('activeApiKeyDisplay');
    if (displayEl) {
        const validKeys = state.apiKeys.filter(k => k && k.trim().length > 0);
        
        // If parallel processing is active, show parallel count
        if (state.parallelProcessing && validKeys.length > 1) {
            displayEl.textContent = `${validKeys.length}x paralel`;
        } else {
            displayEl.textContent = `${state.currentApiKeyIndex + 1} / ${validKeys.length}`;
        }
    }
}

// Show API status (rate limit, waiting, etc.)
function showApiStatus(message, type = 'info') {
    const section = document.getElementById('apiStatusSection');
    const text = document.getElementById('apiStatusText');
    
    if (!section || !text) return;
    
    section.classList.remove('hidden', 'bg-yellow-100', 'bg-red-100', 'bg-blue-100');
    
    if (type === 'warning') {
        section.classList.add('bg-yellow-100');
        text.className = 'text-sm text-center text-yellow-800';
    } else if (type === 'error') {
        section.classList.add('bg-red-100');
        text.className = 'text-sm text-center text-red-800';
    } else {
        section.classList.add('bg-blue-100');
        text.className = 'text-sm text-center text-blue-800';
    }
    
    text.textContent = message;
}

function hideApiStatus() {
    const section = document.getElementById('apiStatusSection');
    if (section) {
        section.classList.add('hidden');
    }
}

// Pause/Resume Analysis
function togglePauseResume() {
    state.isPaused = !state.isPaused;
    
    const pauseIcon = document.getElementById('pauseIcon');
    const playIcon = document.getElementById('playIcon');
    const pauseResumeText = document.getElementById('pauseResumeText');
    const pausedIndicator = document.getElementById('pausedIndicator');
    const spinner = document.getElementById('spinnerContainer');
    
    if (state.isPaused) {
        // Show paused state
        pauseIcon?.classList.add('hidden');
        playIcon?.classList.remove('hidden');
        pauseResumeText.textContent = 'Devam Et';
        pausedIndicator?.classList.remove('hidden');
        spinner?.classList.add('hidden');
    } else {
        // Show running state
        pauseIcon?.classList.remove('hidden');
        playIcon?.classList.add('hidden');
        pauseResumeText.textContent = 'Duraklat';
        pausedIndicator?.classList.add('hidden');
        spinner?.classList.remove('hidden');
    }
}

function stopAnalysis() {
    if (confirm('Analizi durdurmak istediğinizden emin misiniz? Tamamlanan sütunların sonuçları kaydedilecek.')) {
        state.shouldStop = true;
        state.isPaused = false;
        
        // Disable stop button and show stopping state
        const stopBtn = document.getElementById('stopAnalysisBtn');
        const pauseBtn = document.getElementById('pauseResumeBtn');
        if (stopBtn) {
            stopBtn.disabled = true;
            stopBtn.innerHTML = `
                <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>Durduruluyor...</span>
            `;
            stopBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            stopBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        showApiStatus('Analiz durduruluyor, lütfen bekleyin...', 'warning');
    }
}

// Wait while paused
async function waitWhilePaused() {
    while (state.isPaused && !state.shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Partial save after column completion
function partialSaveAfterColumn(columnName) {
    if (!state.partialAnalysisId) {
        state.partialAnalysisId = 'partial_' + Date.now();
    }
    
    state.completedColumns.push(columnName);
    
    const partialData = {
        id: state.partialAnalysisId,
        timestamp: Date.now(),
        rawData: state.rawData,
        columns: state.columns,
        selectedIdColumn: state.selectedIdColumn,
        selectedAnalysisColumns: state.selectedAnalysisColumns,
        completedColumns: state.completedColumns,
        analysisResults: state.analysisResults,
        isPartial: true
    };
    
    // Save to localStorage
    localStorage.setItem('partial_analysis', JSON.stringify(partialData));
    
    console.log(`Partial save completed for column: ${columnName}`);
    showApiStatus(`"${columnName}" sütunu kaydedildi`, 'info');
    setTimeout(hideApiStatus, 2000);
}

// Check for partial analysis to resume
function checkForPartialAnalysis() {
    const partial = localStorage.getItem('partial_analysis');
    if (partial) {
        try {
            return JSON.parse(partial);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Clear partial analysis
function clearPartialAnalysis() {
    localStorage.removeItem('partial_analysis');
    state.partialAnalysisId = null;
    state.completedColumns = [];
}

// Initialize parallel processing checkbox
function initializeParallelProcessing() {
    const checkbox = document.getElementById('parallelProcessingCheckbox');
    if (checkbox) {
        checkbox.checked = state.parallelProcessing;
        checkbox.addEventListener('change', (e) => {
            state.parallelProcessing = e.target.checked;
            localStorage.setItem('parallel_processing', e.target.checked.toString());
            
            // Update estimated time
            updateEstimatedTimeDisplay();
        });
    }
}

// Dynamic schema for analysis (no predefined categories)
const analysisSchema = {
    type: 'object',
    properties: {
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    entryId: { type: 'string', description: 'The Entry Id provided in the input' },
                    topics: {
                        type: 'array',
                        description: 'Bir cevap birden fazla konuya değiniyorsa, bunları ayrı topic objeleri olarak böl',
                        items: {
                            type: 'object',
                            properties: {
                                mainCategory: { 
                                    type: 'string', 
                                    description: 'Verilerden organik olarak çıkarılan ana kategori. Benzer konuları aynı kategori altında topla. Kısa, öz, Türkçe.' 
                                },
                                subTheme: { 
                                    type: 'string', 
                                    description: 'Daha spesifik alt tema. Kısa, öz, Türkçe.' 
                                },
                                sentiment: { 
                                    type: 'string', 
                                    enum: ['Pozitif', 'Negatif', 'Nötr', 'Yapıcı Eleştiri'],
                                    description: 'Duygu durumu' 
                                },
                                direction: {
                                    type: 'string',
                                    enum: ['Talep/İstek', 'Şikayet/Sorun', 'Memnuniyet', 'Tespit'],
                                    description: 'İfadenin yönelimi: bir şey isteniyor mu, şikayet mi ediliyor, memnuniyet mi bildiriliyor, yoksa sadece tespit mi'
                                }
                            },
                            required: ['mainCategory', 'subTheme', 'sentiment', 'direction']
                        }
                    },
                    actionable: { type: 'boolean', description: 'Somut bir öneri veya aksiyon içeriyor mu?' }
                },
                required: ['entryId', 'topics', 'actionable']
            }
        }
    }
};

// Calculate overall sentiment based on directions (ornek.html logic)
function calculateOverallSentiment(topics) {
    if (!topics || topics.length === 0) return 'Nötr';
    
    const directions = topics.map(t => t.direction);
    const hasComplaint = directions.includes('Şikayet/Sorun');
    const hasRequest = directions.includes('Talep/İstek');
    const hasSatisfaction = directions.includes('Memnuniyet');
    
    if (hasRequest) return 'Yapıcı Eleştiri';
    if (hasComplaint && hasSatisfaction) return 'Yapıcı Eleştiri';
    if (hasComplaint) return 'Olumsuz';
    if (hasSatisfaction) return 'Olumlu';
    return 'Nötr';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DİNAMİK TEMATİK ANALİZ SİSTEMİ BAŞLATILIYOR ===');
    
    try {
        initializeModelSelect();
        initializeBatchSize();
        initializeApiKeys();
        initializePromptCustomization();
        initializeParallelProcessing();
        initializeEventListeners();
        
        // Check for saved analyses and update history button
        updateHistoryButtonState();
        
        // Check for partial analysis
        const partialAnalysis = checkForPartialAnalysis();
        if (partialAnalysis) {
            showPartialAnalysisPrompt(partialAnalysis);
        }
        
        console.log('=== SİSTEM BAŞARILI ŞEKİLDE BAŞLATILDI ===');
    } catch (error) {
        console.error('=== SİSTEM BAŞLATMA HATASI ===', error);
    }
});

// Initialize API Keys UI
function initializeApiKeys() {
    renderApiKeysList();
}

function renderApiKeysList() {
    const container = document.getElementById('apiKeysContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.apiKeys.forEach((key, index) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = 'flex items-center space-x-2 mb-2';
        keyDiv.innerHTML = `
            <div class="flex-1 relative">
                <input type="password" value="${key}" 
                    class="api-key-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="AIza... ile başlayan API anahtarı"
                    data-index="${index}">
                ${index === state.currentApiKeyIndex ? '<span class="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full" title="Aktif"></span>' : ''}
            </div>
            <button type="button" class="delete-api-key px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" data-index="${index}" ${state.apiKeys.length === 1 ? 'disabled' : ''}>
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        `;
        container.appendChild(keyDiv);
    });
    
    // Add "Add new key" button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'addApiKeyBtn';
    addBtn.className = 'w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2';
    addBtn.innerHTML = `
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Yeni API Anahtarı Ekle</span>
    `;
    container.appendChild(addBtn);
    
    // Event listeners
    container.querySelectorAll('.api-key-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.apiKeys[index] = e.target.value;
            saveApiKeys();
        });
    });
    
    container.querySelectorAll('.delete-api-key').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            if (state.apiKeys.length > 1) {
                state.apiKeys.splice(index, 1);
                if (state.currentApiKeyIndex >= state.apiKeys.length) {
                    state.currentApiKeyIndex = state.apiKeys.length - 1;
                }
                saveApiKeys();
                renderApiKeysList();
            }
        });
    });
    
    addBtn.addEventListener('click', () => {
        state.apiKeys.push('');
        saveApiKeys();
        renderApiKeysList();
        // Focus on the new input
        const inputs = container.querySelectorAll('.api-key-input');
        inputs[inputs.length - 1]?.focus();
    });
}

function saveApiKeys() {
    localStorage.setItem('gemini_api_keys', JSON.stringify(state.apiKeys));
}

function rotateApiKey() {
    if (state.apiKeys.length <= 1) return false;
    
    state.currentApiKeyIndex = (state.currentApiKeyIndex + 1) % state.apiKeys.length;
    console.log(`API key rotated to index ${state.currentApiKeyIndex}`);
    renderApiKeysList();
    return true;
}

// Initialize Prompt Customization
function initializePromptCustomization() {
    const promptTextarea = document.getElementById('customPromptTextarea');
    if (promptTextarea) {
        promptTextarea.value = state.customPrompt;
    }
}

function validatePrompt(prompt) {
    const missingKeywords = PROTECTED_KEYWORDS.filter(kw => !prompt.includes(kw));
    return {
        valid: missingKeywords.length === 0,
        missingKeywords
    };
}

function saveCustomPrompt() {
    const promptTextarea = document.getElementById('customPromptTextarea');
    if (!promptTextarea) return;
    
    const newPrompt = promptTextarea.value;
    const validation = validatePrompt(newPrompt);
    
    if (!validation.valid) {
        alert(`Prompt'ta şu zorunlu anahtar kelimeler eksik: ${validation.missingKeywords.join(', ')}\n\nBu kelimeler analiz sonuçları için gereklidir ve kaldırılamaz.`);
        return false;
    }
    
    state.customPrompt = newPrompt;
    localStorage.setItem('custom_prompt', newPrompt);
    
    // Close modal
    document.getElementById('promptModal').classList.add('hidden');
    
    // Show success message
    showSaveIndicator();
    return true;
}

function resetPromptToDefault() {
    if (confirm('Prompt varsayılan haline döndürülecek. Emin misiniz?')) {
        state.customPrompt = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem('custom_prompt', DEFAULT_SYSTEM_PROMPT);
        
        const promptTextarea = document.getElementById('customPromptTextarea');
        if (promptTextarea) {
            promptTextarea.value = DEFAULT_SYSTEM_PROMPT;
        }
    }
}

function initializeBatchSize() {
    const batchSizeInput = document.getElementById('batchSizeInput');
    if (!batchSizeInput) return;
    
    batchSizeInput.value = state.batchSize;
    
    batchSizeInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        e.target.value = value;
        state.batchSize = value;
        localStorage.setItem('batch_size_dynamic', value.toString());
        
        // Update estimated time when batch size changes
        updateEstimatedTimeDisplay();
    });
}

function initializeModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;

    modelSelect.innerHTML = '';

    AVAILABLE_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });

    modelSelect.value = state.selectedModel || AVAILABLE_MODELS[0].id;
    updateLimitInfo(modelSelect.value);

    modelSelect.addEventListener('change', (e) => {
        state.selectedModel = e.target.value;
        localStorage.setItem('gemini_model_dynamic', e.target.value);
        updateLimitInfo(e.target.value);
    });
}

function updateLimitInfo(modelId) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    const limitInfoEl = document.getElementById('modelLimitInfo');
    
    if (!limitInfoEl) return;
    
    if (model) {
        limitInfoEl.textContent = `Limitler: ${model.limitInfo}`;
    } else {
        limitInfoEl.textContent = 'Model bilgisi bulunamadı';
    }
}

function initializeEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const cancelColumnBtn = document.getElementById('cancelColumnBtn');
    const startAnalysisBtn = document.getElementById('startAnalysisBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const exportBtn = document.getElementById('exportBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const searchInput = document.getElementById('searchInput');
    const sentimentFilterSelect = document.getElementById('sentimentFilterSelect');
    const categoryFilterSelect = document.getElementById('categoryFilterSelect');
    const themeFilterSelect = document.getElementById('themeFilterSelect');
    const directionFilterSelect = document.getElementById('directionFilterSelect');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const historyBtn = document.getElementById('historyBtn');
    const historyBtnTop = document.getElementById('historyBtnTop');
    const saveAnalysisBtn = document.getElementById('saveAnalysisBtn');
    const customPromptBtn = document.getElementById('customPromptBtn');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const resetPromptBtn = document.getElementById('resetPromptBtn');

    // Prompt Customization
    if (customPromptBtn) {
        customPromptBtn.addEventListener('click', () => {
            const promptTextarea = document.getElementById('customPromptTextarea');
            if (promptTextarea) {
                promptTextarea.value = state.customPrompt;
            }
            document.getElementById('promptModal').classList.remove('hidden');
        });
    }
    
    if (savePromptBtn) {
        savePromptBtn.addEventListener('click', saveCustomPrompt);
    }
    
    if (resetPromptBtn) {
        resetPromptBtn.addEventListener('click', resetPromptToDefault);
    }

    // File upload
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Column selection
    cancelColumnBtn.addEventListener('click', resetApp);
    startAnalysisBtn.addEventListener('click', startAnalysis);

    // Results
    newAnalysisBtn.addEventListener('click', resetApp);
    exportBtn.addEventListener('click', exportToExcel);
    exportPdfBtn.addEventListener('click', exportToPDF);
    historyBtn.addEventListener('click', showHistoryModal);
    historyBtnTop.addEventListener('click', showHistoryModal);
    saveAnalysisBtn.addEventListener('click', saveCurrentAnalysis);

    // Filters - all update dashboard
    searchInput.addEventListener('input', () => {
        state.searchTerm = searchInput.value;
        state.currentPage = 1;
        updateDashboard();
    });
    
    sentimentFilterSelect.addEventListener('change', () => {
        state.sentimentFilter = sentimentFilterSelect.value;
        state.currentPage = 1;
        updateDashboard();
    });
    
    categoryFilterSelect.addEventListener('change', () => {
        state.categoryFilter = categoryFilterSelect.value;
        state.currentPage = 1;
        updateDashboard();
    });
    
    themeFilterSelect.addEventListener('change', () => {
        state.themeFilter = themeFilterSelect.value;
        state.currentPage = 1;
        updateDashboard();
    });
    
    directionFilterSelect.addEventListener('change', () => {
        state.directionFilter = directionFilterSelect.value;
        state.currentPage = 1;
        updateDashboard();
    });
    
    // Reset filters
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Pagination
    prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    });
    nextBtn.addEventListener('click', () => {
        const filteredData = getFilteredData();
        const totalPages = Math.ceil(filteredData.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    });
    
    // Pause/Resume and Stop buttons
    const pauseResumeBtn = document.getElementById('pauseResumeBtn');
    const stopAnalysisBtn = document.getElementById('stopAnalysisBtn');
    
    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', togglePauseResume);
    }
    
    if (stopAnalysisBtn) {
        stopAnalysisBtn.addEventListener('click', stopAnalysis);
    }
}

// Show prompt for partial analysis recovery
function showPartialAnalysisPrompt(partialData) {
    const completedCount = partialData.completedColumns?.length || 0;
    const totalCount = partialData.selectedAnalysisColumns?.length || 0;
    const date = new Date(partialData.timestamp).toLocaleString('tr-TR');
    
    if (completedCount > 0 && completedCount < totalCount) {
        const resumeConfirm = confirm(
            `Yarım kalmış bir analiz bulundu!\n\n` +
            `Tarih: ${date}\n` +
            `Tamamlanan: ${completedCount}/${totalCount} sütun\n` +
            `Satır sayısı: ${partialData.rawData?.length || 0}\n\n` +
            `Devam etmek ister misiniz?`
        );
        
        if (resumeConfirm) {
            resumePartialAnalysis(partialData);
        } else {
            clearPartialAnalysis();
        }
    } else {
        // Partial data is complete or empty, clear it
        clearPartialAnalysis();
    }
}

// Resume partial analysis
async function resumePartialAnalysis(partialData) {
    // Load partial state
    state.rawData = partialData.rawData;
    state.columns = partialData.columns;
    state.selectedIdColumn = partialData.selectedIdColumn;
    state.selectedAnalysisColumns = partialData.selectedAnalysisColumns;
    state.completedColumns = partialData.completedColumns || [];
    state.analysisResults = partialData.analysisResults || {};
    state.partialAnalysisId = partialData.id;
    
    // Show progress section
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('columnSection').classList.add('hidden');
    document.getElementById('progressSection').classList.remove('hidden');
    
    // Continue analysis from where it left off
    await continueAnalysis();
}

function resetFilters() {
    state.sentimentFilter = 'all';
    state.categoryFilter = 'all';
    state.themeFilter = 'all';
    state.directionFilter = 'all';
    state.searchTerm = '';
    state.currentPage = 1;
    
    // Reset UI elements
    document.getElementById('sentimentFilterSelect').value = 'all';
    document.getElementById('categoryFilterSelect').value = 'all';
    document.getElementById('themeFilterSelect').value = 'all';
    document.getElementById('directionFilterSelect').value = 'all';
    document.getElementById('searchInput').value = '';
    
    updateDashboard();
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-500', 'bg-purple-50');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showError('Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) seçin.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showError('Excel dosyası boş veya geçersiz.');
                return;
            }

            // Get all column names
            const columns = Object.keys(jsonData[0]);
            
            state.rawData = jsonData;
            state.columns = columns;
            
            document.getElementById('fileNameDisplay').innerHTML = `<span class="text-green-600">Seçilen dosya: ${file.name}</span>`;
            document.getElementById('rowCountDisplay').textContent = jsonData.length;
            
            // Populate column selections
            populateColumnSelections(columns);
            
            document.getElementById('uploadSection').classList.add('hidden');
            document.getElementById('columnSection').classList.remove('hidden');
            hideError();
        } catch (error) {
            showError('Dosya okuma hatası: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function populateColumnSelections(columns) {
    // Populate ID column dropdown
    const idColumnSelect = document.getElementById('idColumnSelect');
    idColumnSelect.innerHTML = '<option value="">ID sütunu seçin...</option>';
    columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        idColumnSelect.appendChild(option);
    });

    // Populate analysis columns checkboxes
    const container = document.getElementById('analysisColumnsContainer');
    container.innerHTML = '';
    columns.forEach(col => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 p-2 rounded checkbox-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col_${col}`;
        checkbox.value = col;
        checkbox.className = 'h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded';
        
        // Add change listener for estimated time update
        checkbox.addEventListener('change', updateEstimatedTimeDisplay);
        
        const label = document.createElement('label');
        label.htmlFor = `col_${col}`;
        label.textContent = col;
        label.className = 'text-sm text-gray-700 cursor-pointer flex-1';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
    
    // Initial estimated time calculation
    updateEstimatedTimeDisplay();
}

async function startAnalysis() {
    // Check if at least one API key is provided
    const validApiKeys = state.apiKeys.filter(k => k && k.trim().length > 0);
    if (validApiKeys.length === 0) {
        showError('Lütfen en az bir Gemini API anahtarı girin.');
        return;
    }
    
    // Use first valid key
    state.currentApiKeyIndex = state.apiKeys.findIndex(k => k && k.trim().length > 0);

    // Get selected columns
    const idColumnSelect = document.getElementById('idColumnSelect');
    state.selectedIdColumn = idColumnSelect.value;
    
    if (!state.selectedIdColumn) {
        showError('Lütfen bir ID sütunu seçin.');
        return;
    }

    const checkboxes = document.querySelectorAll('#analysisColumnsContainer input[type="checkbox"]:checked');
    state.selectedAnalysisColumns = Array.from(checkboxes).map(cb => cb.value);
    
    if (state.selectedAnalysisColumns.length === 0) {
        showError('Lütfen en az bir analiz sütunu seçin.');
        return;
    }

    try {
        hideError();
        document.getElementById('columnSection').classList.add('hidden');
        document.getElementById('progressSection').classList.remove('hidden');

        // Reset control flags
        state.isAnalyzing = true;
        state.isPaused = false;
        state.shouldStop = false;
        state.failedRows = [];
        state.completedColumns = [];
        
        // Initialize progress tracking
        totalRowsToProcess = state.rawData.length * state.selectedAnalysisColumns.length;
        startProgressTracking();
        updateActiveApiKeyDisplay();
        updateProcessedRows(0);
        
        // Clear any previous partial analysis
        clearPartialAnalysis();
        
        state.analysisResults = {};

        // Check if parallel processing is enabled and we have multiple API keys
        if (state.parallelProcessing && validApiKeys.length > 1) {
            await runParallelAnalysis(validApiKeys);
        } else {
            await runSequentialAnalysis();
        }
        
        // Check if analysis was stopped
        if (state.shouldStop && state.completedColumns.length === 0) {
            // No columns completed, just reset
            state.isAnalyzing = false;
            document.getElementById('progressSection').classList.add('hidden');
            document.getElementById('columnSection').classList.remove('hidden');
            showError('Analiz durduruldu. Hiçbir sütun tamamlanmadı.');
            clearPartialAnalysis();
            return;
        }

        // Calculate statistics
        calculateAllStats();

        // Enrich data
        enrichData();

        // Generate executive summary (only if we have results)
        if (Object.keys(state.analysisResults).length > 0) {
            const genAI = new GoogleGenerativeAI(state.apiKey);
            state.executiveSummary = await generateExecutiveSummary(genAI);
        } else {
            state.executiveSummary = 'Analiz sonuçları yetersiz, özet oluşturulamadı.';
        }
        
        // Clear partial analysis on successful completion
        clearPartialAnalysis();

        // Show results
        state.isAnalyzing = false;
        document.getElementById('progressSection').classList.add('hidden');
        showResults();
        
        if (state.shouldStop) {
            showApiStatus(`Analiz durduruldu. ${state.completedColumns.length} sütun tamamlandı.`, 'warning');
        }
    } catch (error) {
        state.isAnalyzing = false;
        showError('Analiz sırasında bir hata oluştu: ' + error.message);
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('columnSection').classList.remove('hidden');
    }
}

// Sequential analysis (default)
async function runSequentialAnalysis() {
    const genAI = new GoogleGenerativeAI(state.apiKey);
    
    for (let colIndex = 0; colIndex < state.selectedAnalysisColumns.length; colIndex++) {
        // Check for stop signal
        if (state.shouldStop) {
            console.log('Sequential analysis stopped');
            break;
        }
        
        const columnName = state.selectedAnalysisColumns[colIndex];
        
        document.getElementById('currentColumnProgress').textContent = `İşlenen Sütun: ${columnName}`;
        document.getElementById('columnProgressCount').textContent = `${colIndex + 1} / ${state.selectedAnalysisColumns.length} sütun`;
        
        const columnResults = await analyzeColumn(genAI, columnName);
        state.analysisResults[columnName] = columnResults;
        
        // Partial save after column completion
        partialSaveAfterColumn(columnName);

        // Delay between columns
        if (colIndex < state.selectedAnalysisColumns.length - 1 && !state.shouldStop) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COLUMNS));
        }
    }
}

// Parallel analysis using multiple API keys - processes batches in parallel
async function runParallelAnalysis(validApiKeys) {
    const concurrency = validApiKeys.length;
    
    showApiStatus(`Paralel işleme: ${concurrency} API anahtarı ile çalışılıyor`, 'info');
    
    // Create GenAI instances for each API key
    const genAIInstances = validApiKeys.map(key => new GoogleGenerativeAI(key));
    
    for (let colIndex = 0; colIndex < state.selectedAnalysisColumns.length; colIndex++) {
        if (state.shouldStop) break;
        
        const columnName = state.selectedAnalysisColumns[colIndex];
        
        document.getElementById('currentColumnProgress').textContent = `İşlenen Sütun: ${columnName}`;
        document.getElementById('columnProgressCount').textContent = `${colIndex + 1} / ${state.selectedAnalysisColumns.length} sütun`;
        
        // Process this column with parallel batches
        const columnResults = await analyzeColumnParallel(genAIInstances, columnName, colIndex);
        state.analysisResults[columnName] = columnResults;
        
        // Partial save after column completion
        partialSaveAfterColumn(columnName);
        
        // Delay between columns
        if (colIndex < state.selectedAnalysisColumns.length - 1 && !state.shouldStop) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COLUMNS));
        }
    }
    
    hideApiStatus();
}

// Analyze a single column using multiple API keys in parallel
async function analyzeColumnParallel(genAIInstances, columnName, columnIndex) {
    const results = [];
    const concurrency = genAIInstances.length;
    
    // Calculate adaptive batch size
    state.currentBatchSize = calculateAdaptiveBatchSize(state.rawData, columnName, state.batchSize);
    const totalBatches = Math.ceil(state.rawData.length / state.currentBatchSize);
    
    // Create batch queue
    const batchQueue = [];
    for (let i = 0; i < state.rawData.length; i += state.currentBatchSize) {
        batchQueue.push({
            startIndex: i,
            data: state.rawData.slice(i, i + state.currentBatchSize),
            batchNum: Math.floor(i / state.currentBatchSize) + 1
        });
    }
    
    // Results array with slots for each batch (to maintain order)
    const batchResults = new Array(batchQueue.length).fill(null);
    let completedBatches = 0;
    let currentBatchIndex = 0;
    
    // Worker function for each API key
    async function worker(apiIndex) {
        const genAI = genAIInstances[apiIndex];
        
        while (currentBatchIndex < batchQueue.length && !state.shouldStop) {
            // Get next batch atomically
            const batchIdx = currentBatchIndex++;
            if (batchIdx >= batchQueue.length) break;
            
            const batch = batchQueue[batchIdx];
            
            // Wait while paused
            await waitWhilePaused();
            if (state.shouldStop) break;
            
            // Update UI
            const totalProgress = ((columnIndex * state.rawData.length) + batch.startIndex + batch.data.length) / 
                                  (state.selectedAnalysisColumns.length * state.rawData.length);
            updateProgress(totalProgress * 100, `${columnName}: Batch ${batch.batchNum}/${totalBatches} (API ${apiIndex + 1})`);
            
            // Update active API display to show all active
            document.getElementById('activeApiKeyDisplay').textContent = `${concurrency}x paralel`;
            
            // Update processed rows
            const currentProcessed = (columnIndex * state.rawData.length) + batch.startIndex + batch.data.length;
            updateProcessedRows(currentProcessed);
            
            try {
                const batchResult = await analyzeBatchWithSpecificApi(genAI, batch.data, columnName);
                if (batchResult && batchResult.items) {
                    batchResults[batchIdx] = batchResult.items;
                }
                completedBatches++;
            } catch (error) {
                console.error(`API ${apiIndex + 1} error on batch ${batch.batchNum}:`, error);
                batchResults[batchIdx] = batch.data.map(r => ({
                    entryId: String(r[state.selectedIdColumn]),
                    topics: [{
                        mainCategory: 'Analiz Hatası',
                        subTheme: 'İşlenemedi',
                        sentiment: 'Nötr',
                        direction: 'Tespit'
                    }],
                    actionable: false
                }));
            }
            
            // Small delay to prevent hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Start all workers in parallel
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker(i));
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    // Flatten results in order
    for (const batchResult of batchResults) {
        if (batchResult) {
            results.push(...batchResult);
        }
    }
    
    return results;
}

// Analyze batch with a specific API instance (for parallel processing)
async function analyzeBatchWithSpecificApi(genAI, rows, columnName) {
    const promptData = rows.map(r => ({
        id: String(r[state.selectedIdColumn]),
        text: truncateText(String(r[columnName] || ''))
    }));

    const systemInstruction = state.customPrompt.replace(/\{\{COLUMN_NAME\}\}/g, columnName);

    const prompt = `
${systemInstruction}

ANALİZ EDİLECEK VERİLER (${rows.length} adet):
${JSON.stringify(promptData, null, 2)}
`;

    const model = genAI.getGenerativeModel({
        model: state.selectedModel,
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
        },
    });

    let retries = 3;
    let retryDelay = 3000;

    while (retries > 0) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text) throw new Error('Empty response');
            return JSON.parse(text);
        } catch (error) {
            const errorMsg = error.message || '';
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Quota');
            
            if (isRateLimit && retries > 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
                retries--;
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

// Continue analysis from partial state
async function continueAnalysis() {
    state.isAnalyzing = true;
    state.isPaused = false;
    state.shouldStop = false;
    state.failedRows = [];
    
    // Calculate remaining columns
    const remainingColumns = state.selectedAnalysisColumns.filter(
        col => !state.completedColumns.includes(col)
    );
    
    if (remainingColumns.length === 0) {
        // All columns already completed
        calculateAllStats();
        enrichData();
        const genAI = new GoogleGenerativeAI(state.apiKey);
        state.executiveSummary = await generateExecutiveSummary(genAI);
        clearPartialAnalysis();
        state.isAnalyzing = false;
        document.getElementById('progressSection').classList.add('hidden');
        showResults();
        return;
    }
    
    // Initialize progress tracking
    totalRowsToProcess = state.rawData.length * remainingColumns.length;
    startProgressTracking();
    updateActiveApiKeyDisplay();
    
    const genAI = new GoogleGenerativeAI(state.apiKey);
    
    for (const columnName of remainingColumns) {
        if (state.shouldStop) break;
        
        document.getElementById('currentColumnProgress').textContent = `İşlenen Sütun: ${columnName}`;
        document.getElementById('columnProgressCount').textContent = 
            `${state.completedColumns.length + 1} / ${state.selectedAnalysisColumns.length} sütun`;
        
        const columnResults = await analyzeColumn(genAI, columnName);
        state.analysisResults[columnName] = columnResults;
        
        partialSaveAfterColumn(columnName);
        
        if (!state.shouldStop) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COLUMNS));
        }
    }
    
    // Finalize
    calculateAllStats();
    enrichData();
    state.executiveSummary = await generateExecutiveSummary(genAI);
    clearPartialAnalysis();
    state.isAnalyzing = false;
    document.getElementById('progressSection').classList.add('hidden');
    showResults();
}

async function analyzeColumn(genAI, columnName) {
    const results = [];
    
    // Calculate adaptive batch size based on content
    state.currentBatchSize = calculateAdaptiveBatchSize(state.rawData, columnName, state.batchSize);
    const totalBatches = Math.ceil(state.rawData.length / state.currentBatchSize);
    
    const columnIndex = state.selectedAnalysisColumns.indexOf(columnName);
    let i = 0;
    let batchNum = 0;
    
    while (i < state.rawData.length) {
        // Check for stop signal
        if (state.shouldStop) {
            console.log(`Analysis stopped at column ${columnName}, batch ${batchNum}`);
            break;
        }
        
        // Wait while paused
        await waitWhilePaused();
        
        // Check again after pause (might have been stopped while paused)
        if (state.shouldStop) {
            break;
        }
        
        const batch = state.rawData.slice(i, i + state.currentBatchSize);
        batchNum++;

        const totalProgress = ((columnIndex * state.rawData.length) + i + batch.length) / 
                              (state.selectedAnalysisColumns.length * state.rawData.length);
        
        updateProgress(totalProgress * 100, `${columnName}: Batch ${batchNum}/${totalBatches} (${batch.length} satır)`);
        
        // Update processed rows count
        const currentProcessed = (columnIndex * state.rawData.length) + i + batch.length;
        updateProcessedRows(currentProcessed);
        
        // Update active API key display
        updateActiveApiKeyDisplay();

        try {
            const batchResult = await analyzeBatch(genAI, batch, columnName);
            if (batchResult && batchResult.items) {
                results.push(...batchResult.items);
            }
            hideApiStatus();
        } catch (error) {
            console.error(`Batch ${batchNum} failed for column ${columnName}:`, error);
            // Continue with next batch even if this one fails
        }

        i += state.currentBatchSize;
        
        if (i < state.rawData.length && !state.shouldStop) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    // Log summary of failed rows if any
    const columnFailedRows = state.failedRows.filter(r => r.column === columnName);
    if (columnFailedRows.length > 0) {
        console.warn(`Column "${columnName}": ${columnFailedRows.length} rows failed to process`);
    }

    return results;
}

// Constants for error handling
const MAX_TEXT_LENGTH = 2000; // Max characters per text entry
const MAX_TOKENS_PER_REQUEST = 30000; // Approximate token limit
const CHARS_PER_TOKEN = 4; // Rough estimate

// Estimate token count for a string
function estimateTokens(text) {
    return Math.ceil((text || '').length / CHARS_PER_TOKEN);
}

// Truncate text if too long
function truncateText(text, maxLength = MAX_TEXT_LENGTH) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '... [metin kısaltıldı]';
}

// Calculate adaptive batch size based on content
function calculateAdaptiveBatchSize(rows, columnName, baseBatchSize) {
    if (rows.length === 0) return baseBatchSize;
    
    // Sample first few rows to estimate average text length
    const sampleSize = Math.min(10, rows.length);
    let totalChars = 0;
    
    for (let i = 0; i < sampleSize; i++) {
        const text = String(rows[i][columnName] || '');
        totalChars += Math.min(text.length, MAX_TEXT_LENGTH);
    }
    
    const avgChars = totalChars / sampleSize;
    const avgTokensPerRow = estimateTokens(avgChars.toString()) + 100; // +100 for JSON overhead
    
    // Calculate how many rows we can fit in token limit
    const promptOverhead = estimateTokens(state.customPrompt) + 500;
    const availableTokens = MAX_TOKENS_PER_REQUEST - promptOverhead;
    const maxRowsForTokens = Math.floor(availableTokens / avgTokensPerRow);
    
    // Use the smaller of base batch size and calculated max
    const adaptiveBatch = Math.max(1, Math.min(baseBatchSize, maxRowsForTokens));
    
    if (adaptiveBatch < baseBatchSize) {
        console.log(`Adaptive batch size: ${adaptiveBatch} (reduced from ${baseBatchSize} due to content length)`);
    }
    
    return adaptiveBatch;
}

async function analyzeBatch(genAI, rows, columnName, retryWithSmallerBatch = true) {
    // Truncate long texts and prepare data
    const promptData = rows.map(r => ({
        id: String(r[state.selectedIdColumn]),
        text: truncateText(String(r[columnName] || ''))
    }));

    // Use custom prompt with column name placeholder
    const systemInstruction = state.customPrompt.replace(/\{\{COLUMN_NAME\}\}/g, columnName);

    const prompt = `
${systemInstruction}

ANALİZ EDİLECEK VERİLER (${rows.length} adet):
${JSON.stringify(promptData, null, 2)}
`;

    // Check estimated tokens
    const estimatedTokens = estimateTokens(prompt);
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST && rows.length > 1 && retryWithSmallerBatch) {
        console.warn(`Estimated tokens (${estimatedTokens}) exceeds limit. Splitting batch...`);
        // Split batch in half and process separately
        const mid = Math.ceil(rows.length / 2);
        const firstHalf = await analyzeBatch(genAI, rows.slice(0, mid), columnName, true);
        const secondHalf = await analyzeBatch(genAI, rows.slice(mid), columnName, true);
        return { items: [...(firstHalf.items || []), ...(secondHalf.items || [])] };
    }

    const model = genAI.getGenerativeModel({
        model: state.selectedModel,
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
        },
    });

    let retries = 5;
    let retryDelay = 5000;
    let apiKeysTriedCount = 0;
    const maxApiKeyRotations = state.apiKeys.length;

    while (retries > 0) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (!text) throw new Error('Empty response from Gemini');

            const parsed = JSON.parse(text);
            return parsed;
        } catch (error) {
            const errorMsg = error.message || '';
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Quota exceeded') || errorMsg.includes('RESOURCE_EXHAUSTED');
            const isTokenLimit = errorMsg.includes('token') || errorMsg.includes('too long') || errorMsg.includes('context length');
            const isNetworkError = errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('ENOTFOUND');
            
            console.warn(`Batch error (retries: ${retries}):`, errorMsg);
            
            // Token limit exceeded - try smaller batch
            if (isTokenLimit && rows.length > 1 && retryWithSmallerBatch) {
                console.warn('Token limit hit, splitting batch...');
                updateProgress(null, `Token limiti aşıldı, batch küçültülüyor...`);
                const mid = Math.ceil(rows.length / 2);
                const firstHalf = await analyzeBatch(genAI, rows.slice(0, mid), columnName, true);
                const secondHalf = await analyzeBatch(genAI, rows.slice(mid), columnName, true);
                return { items: [...(firstHalf.items || []), ...(secondHalf.items || [])] };
            }
            
            // Rate limit - try rotating API key first
            if (isRateLimit) {
                apiKeysTriedCount++;
                
                // Try rotating to next API key
                if (apiKeysTriedCount < maxApiKeyRotations && rotateApiKey()) {
                    console.log('Rate limit hit, rotated to next API key');
                    showApiStatus(`Rate limit - API anahtarı değiştirildi (${state.currentApiKeyIndex + 1}/${state.apiKeys.length})`, 'warning');
                    updateActiveApiKeyDisplay();
                    // Get new model with new API key
                    const newGenAI = new GoogleGenerativeAI(state.apiKey);
                    return analyzeBatch(newGenAI, rows, columnName, retryWithSmallerBatch);
                }
                
                // All keys exhausted or only one key - wait and retry
                if (retries > 1) {
                    console.warn(`Rate limit hit, waiting ${retryDelay}ms before retry...`);
                    updateProgress(null, `Rate limit - ${Math.round(retryDelay/1000)}s bekleniyor...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay = Math.min(retryDelay * 1.5, 60000); // Max 60s
                    retries--;
                    apiKeysTriedCount = 0; // Reset for next retry round
                    continue;
                }
            }
            
            // Network error - simple retry
            if (isNetworkError && retries > 1) {
                console.warn(`Network error, retrying in ${retryDelay}ms...`);
                updateProgress(null, `Ağ hatası - yeniden deneniyor...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries--;
                continue;
            }
            
            // Other errors or final retry - log failed rows and return empty
            console.error('Batch analysis failed:', error);
            rows.forEach(r => {
                state.failedRows.push({
                    id: r[state.selectedIdColumn],
                    column: columnName,
                    error: errorMsg
                });
            });
            
            // Return empty result for this batch, analysis continues
            return { items: rows.map(r => ({
                entryId: String(r[state.selectedIdColumn]),
                topics: [{
                    mainCategory: 'Analiz Hatası',
                    subTheme: 'İşlenemedi',
                    sentiment: 'Nötr',
                    direction: 'Tespit'
                }],
                actionable: false
            })) };
        }
        retries--;
    }
    
    return { items: [] };
}

function calculateAllStats() {
    state.stats = {};
    
    let allCategories = new Set();
    let allThemes = new Set();
    let allDirections = new Set();
    
    // Global aggregated stats
    let globalCategoryCounts = {};
    let globalThemeCounts = {};
    let globalDirectionCounts = {};
    
    for (const columnName in state.analysisResults) {
        const results = state.analysisResults[columnName];
        const categoryCounts = {};
        const themeCounts = {};
        const sentimentCounts = {};
        const directionCounts = {};
        // For stacked bar chart: category -> direction -> count
        const categoryDirectionMatrix = {};
        let actionableCount = 0;

        results.forEach(result => {
            if (result.topics && Array.isArray(result.topics)) {
                result.topics.forEach(topic => {
                    const category = topic.mainCategory;
                    const theme = topic.subTheme;
                    const direction = topic.direction || 'Tespit';
                    
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
                    sentimentCounts[topic.sentiment] = (sentimentCounts[topic.sentiment] || 0) + 1;
                    directionCounts[direction] = (directionCounts[direction] || 0) + 1;
                    
                    // Matrix for stacked chart
                    if (!categoryDirectionMatrix[category]) {
                        categoryDirectionMatrix[category] = { 'Talep/İstek': 0, 'Şikayet/Sorun': 0, 'Memnuniyet': 0, 'Tespit': 0 };
                    }
                    if (categoryDirectionMatrix[category][direction] !== undefined) {
                        categoryDirectionMatrix[category][direction]++;
                    } else {
                        categoryDirectionMatrix[category]['Tespit']++;
                    }
                    
                    allCategories.add(category);
                    allThemes.add(theme);
                    allDirections.add(direction);
                    
                    // Global aggregates
                    globalCategoryCounts[category] = (globalCategoryCounts[category] || 0) + 1;
                    globalThemeCounts[theme] = { 
                        count: (globalThemeCounts[theme]?.count || 0) + 1,
                        direction: direction
                    };
                    globalDirectionCounts[direction] = (globalDirectionCounts[direction] || 0) + 1;
                });
            }
            if (result.actionable) actionableCount++;
        });

        state.stats[columnName] = {
            totalRows: results.length,
            categoryCounts,
            themeCounts,
            sentimentCounts,
            directionCounts,
            categoryDirectionMatrix,
            actionableCount,
            nonActionableCount: results.length - actionableCount
        };
    }
    
    // Calculate global stats
    state.globalStats = {
        totalRows: state.rawData.length,
        totalColumns: state.selectedAnalysisColumns.length,
        totalCategories: allCategories.size,
        totalThemes: allThemes.size,
        allCategories: Array.from(allCategories).sort(),
        allThemes: Array.from(allThemes).sort(),
        allDirections: Array.from(allDirections),
        globalCategoryCounts,
        globalThemeCounts,
        globalDirectionCounts
    };
}

function enrichData() {
    state.enrichedData = state.rawData.map(row => {
        const enrichedRow = { ...row };
        let allTopicsForRow = [];
        
        // Add analysis for each column
        state.selectedAnalysisColumns.forEach(columnName => {
            const results = state.analysisResults[columnName];
            const rowId = String(row[state.selectedIdColumn]);
            const analysis = results.find(r => r.entryId === rowId);
            
            if (analysis && analysis.topics && analysis.topics.length > 0) {
                const firstTopic = analysis.topics[0];
                enrichedRow[`${columnName}_category`] = firstTopic.mainCategory;
                enrichedRow[`${columnName}_theme`] = firstTopic.subTheme;
                enrichedRow[`${columnName}_sentiment`] = firstTopic.sentiment;
                enrichedRow[`${columnName}_direction`] = firstTopic.direction || 'Tespit';
                enrichedRow[`${columnName}_actionable`] = analysis.actionable;
                enrichedRow[`${columnName}_allTopics`] = analysis.topics;
                allTopicsForRow = allTopicsForRow.concat(analysis.topics);
            } else {
                enrichedRow[`${columnName}_category`] = 'İşlenmedi';
                enrichedRow[`${columnName}_theme`] = 'İşlenmedi';
                enrichedRow[`${columnName}_sentiment`] = 'Nötr';
                enrichedRow[`${columnName}_direction`] = 'Tespit';
                enrichedRow[`${columnName}_actionable`] = false;
                enrichedRow[`${columnName}_allTopics`] = [];
            }
        });
        
        // Calculate overall sentiment for the row based on all topics
        enrichedRow._allTopics = allTopicsForRow;
        enrichedRow._overallSentiment = calculateOverallSentiment(allTopicsForRow);
        
        return enrichedRow;
    });
}

async function generateExecutiveSummary(genAI) {
    let summaryContext = `
Toplam ${state.globalStats.totalRows} satır veri, ${state.globalStats.totalColumns} farklı sütun analiz edildi.
Toplam ${state.globalStats.totalCategories} benzersiz kategori ve ${state.globalStats.totalThemes} benzersiz tema bulundu.

SÜTUN BAZLI İSTATİSTİKLER:
`;

    for (const columnName in state.stats) {
        const stats = state.stats[columnName];
        const topCategories = Object.entries(stats.categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, count]) => `${cat} (${count})`)
            .join(', ');
        
        const topThemes = Object.entries(stats.themeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([theme, count]) => `${theme} (${count})`)
            .join(', ');
        
        summaryContext += `
"${columnName}":
- Top Kategoriler: ${topCategories}
- Top Temalar: ${topThemes}
- Duygu Dağılımı: ${JSON.stringify(stats.sentimentCounts)}
- Eyleme Dönüştürülebilir: ${stats.actionableCount} (${((stats.actionableCount / stats.totalRows) * 100).toFixed(1)}%)
`;
    }

    const prompt = `
Sen kıdemli bir veri analistisin. Aşağıdaki çoklu-sütun tematik analiz sonuçlarını incele ve üst düzey bir yönetici özeti yaz.

${summaryContext}

Başlıklar:
1. Genel Durum Değerlendirmesi
2. Sütunlar Arası Karşılaştırma ve İlişkiler
3. Kritik Bulgular
4. Öncelikli Aksiyon Önerileri

Türkçe, resmi ve öz bir dil kullan. Markdown formatında yaz.
`;

    const model = genAI.getGenerativeModel({
        model: state.selectedModel,
        generationConfig: {
            temperature: 0.3,
        },
    });

    let retries = 5;
    let retryDelay = 5000;

    while (retries > 0) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text() || 'Özet oluşturulamadı.';
        } catch (e) {
            const isRateLimit = e.message.includes('429') || e.message.includes('Quota exceeded');
            if (isRateLimit && retries > 1) {
                console.warn(`Rate limit hit (Summary), retrying in ${retryDelay}ms...`, e);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 1.5;
                retries--;
                continue;
            }
            console.error('Summary generation error:', e);
            if (retries === 1 || !isRateLimit) return 'Özet oluşturulurken bir hata oluştu.';
        }
    }
    return 'Özet oluşturulurken bir hata oluştu.';
}

function updateProgress(percentage, text) {
    if (percentage !== null && percentage !== undefined) {
        document.getElementById('progressBar').style.width = percentage + '%';
    }
    if (text) {
        document.getElementById('progressText').textContent = text;
    }
}

function showResults() {
    document.getElementById('resultsSection').classList.remove('hidden');

    // Update global stats
    document.getElementById('totalRowsDisplay').textContent = state.globalStats.totalRows;
    document.getElementById('totalColumnsDisplay').textContent = state.globalStats.totalColumns;
    document.getElementById('statTotal').textContent = state.globalStats.totalRows;
    document.getElementById('statColumns').textContent = state.globalStats.totalColumns;
    document.getElementById('statCategories').textContent = state.globalStats.totalCategories;
    document.getElementById('statThemes').textContent = state.globalStats.totalThemes;

    // Show executive summary
    document.getElementById('executiveSummary').innerHTML = formatMarkdown(state.executiveSummary);

    // Show failed rows report if any
    renderFailedRowsReport();

    // Populate filter dropdowns
    populateFilterDropdowns();

    // Initial dashboard update (charts + table + stats)
    updateDashboard();
    
    // Auto-save if not in history mode
    if (!state.isHistoryMode && !state.currentAnalysisId) {
        state.currentAnalysisId = 'analysis_' + Date.now();
        autoSaveAnalysis();
    }
}

// Render failed rows report
function renderFailedRowsReport() {
    const section = document.getElementById('failedRowsSection');
    const countEl = document.getElementById('failedRowsCount');
    const listEl = document.getElementById('failedRowsList');
    
    if (!section || !countEl || !listEl) return;
    
    if (state.failedRows.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');
    countEl.textContent = state.failedRows.length;
    
    // Group failed rows by error
    const groupedByError = {};
    state.failedRows.forEach(row => {
        const errorKey = row.error || 'Bilinmeyen hata';
        if (!groupedByError[errorKey]) {
            groupedByError[errorKey] = [];
        }
        groupedByError[errorKey].push(row);
    });
    
    listEl.innerHTML = Object.entries(groupedByError).map(([error, rows]) => `
        <div class="bg-white rounded p-3 border border-red-200">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-red-700 uppercase">${escapeHtml(error.substring(0, 100))}${error.length > 100 ? '...' : ''}</span>
                <span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">${rows.length} satır</span>
            </div>
            <div class="text-xs text-gray-600">
                ID'ler: ${rows.slice(0, 10).map(r => r.id).join(', ')}${rows.length > 10 ? ` ve ${rows.length - 10} daha...` : ''}
            </div>
        </div>
    `).join('');
}

function populateFilterDropdowns() {
    // Category filter
    const categorySelect = document.getElementById('categoryFilterSelect');
    categorySelect.innerHTML = '<option value="all">Tüm Temalar</option>';
    state.globalStats.allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Theme filter
    const themeSelect = document.getElementById('themeFilterSelect');
    themeSelect.innerHTML = '<option value="all">Tüm Alt Kategoriler</option>';
    state.globalStats.allThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelect.appendChild(option);
    });
}

function updateDashboard() {
    const filteredData = getFilteredData();
    
    // Calculate sentiment stats from filtered data
    let stats = { 'Olumlu': 0, 'Olumsuz': 0, 'Yapıcı Eleştiri': 0, 'Nötr': 0 };
    filteredData.forEach(row => {
        const sentiment = row._overallSentiment || 'Nötr';
        if (stats[sentiment] !== undefined) {
            stats[sentiment]++;
        }
    });
    
    // Update stats cards
    document.getElementById('totalRowsHeader').textContent = filteredData.length;
    document.getElementById('statPositive').textContent = stats['Olumlu'];
    document.getElementById('statNegative').textContent = stats['Olumsuz'];
    document.getElementById('statConstructive').textContent = stats['Yapıcı Eleştiri'];
    document.getElementById('statNeutral').textContent = stats['Nötr'];

    // Update charts
    updateCharts(filteredData);
    
    // Update table
    renderTable();
}

// Register ChartDataLabels plugin
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

function updateCharts(filteredData) {
    // Calculate stats from filtered data
    let categoryStats = {};
    let themeCounts = {};
    let sentimentCounts = { 'Olumlu': 0, 'Olumsuz': 0, 'Yapıcı Eleştiri': 0, 'Nötr': 0 };
    
    const catFilter = state.categoryFilter;
    const themeFilter = state.themeFilter;
    const dirFilter = state.directionFilter;
    
    let totalTopicsFiltered = 0;

    filteredData.forEach(row => {
        // Count overall sentiment
        const overallSent = row._overallSentiment || 'Nötr';
        if (sentimentCounts[overallSent] !== undefined) {
            sentimentCounts[overallSent]++;
        }

        // Process all topics
        const allTopics = row._allTopics || [];
        allTopics.forEach(t => {
            const category = t.mainCategory;
            const theme = t.subTheme;
            const direction = t.direction || 'Tespit';
            
            const isRelevant = (catFilter === 'all' || category === catFilter) && 
                               (themeFilter === 'all' || theme === themeFilter) &&
                               (dirFilter === 'all' || direction === dirFilter);
            
            if (isRelevant) {
                totalTopicsFiltered++;
                
                // Category Stats with direction breakdown
                if (!categoryStats[category]) {
                    categoryStats[category] = { 'Talep/İstek': 0, 'Şikayet/Sorun': 0, 'Memnuniyet': 0, 'Tespit': 0 };
                }
                if (categoryStats[category][direction] !== undefined) {
                    categoryStats[category][direction]++;
                } else {
                    categoryStats[category]['Tespit']++;
                }
                
                // Theme Stats
                if (!themeCounts[theme]) themeCounts[theme] = { count: 0, direction: direction };
                themeCounts[theme].count++;
            }
        });
    });

    // Destroy existing charts
    if (state.charts.categoryChart) state.charts.categoryChart.destroy();
    if (state.charts.themeChart) state.charts.themeChart.destroy();
    if (state.charts.sentimentChart) state.charts.sentimentChart.destroy();

    // 1. ANA TEMALAR (Horizontal Stacked Bar)
    const categories = Object.keys(categoryStats).sort((a, b) => {
        const sumA = Object.values(categoryStats[a]).reduce((acc, v) => acc + v, 0);
        const sumB = Object.values(categoryStats[b]).reduce((acc, v) => acc + v, 0);
        return sumB - sumA;
    }).slice(0, 10);
    
    const dsRequest = categories.map(c => categoryStats[c]['Talep/İstek']);
    const dsComplaint = categories.map(c => categoryStats[c]['Şikayet/Sorun']);
    const dsSatisfaction = categories.map(c => categoryStats[c]['Memnuniyet']);
    const dsDetection = categories.map(c => categoryStats[c]['Tespit']);

    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        state.charts.categoryChart = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    { label: 'Talep/İstek', data: dsRequest, backgroundColor: '#3B82F6', stack: 'Stack 0' },
                    { label: 'Şikayet/Sorun', data: dsComplaint, backgroundColor: '#EF4444', stack: 'Stack 0' },
                    { label: 'Memnuniyet', data: dsSatisfaction, backgroundColor: '#10B981', stack: 'Stack 0' },
                    { label: 'Tespit', data: dsDetection, backgroundColor: '#9CA3AF', stack: 'Stack 0' }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    x: { stacked: true, beginAtZero: true, grace: '10%' }, 
                    y: { stacked: true } 
                },
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } },
                    datalabels: {
                        color: 'white', 
                        font: { size: 10, weight: 'bold' },
                        formatter: (value, ctx) => {
                            if (value === 0) return '';
                            let idx = ctx.dataIndex;
                            let sum = 0;
                            ctx.chart.data.datasets.forEach(ds => { sum += ds.data[idx]; });
                            let percentage = (value * 100 / sum).toFixed(0) + "%";
                            return `${percentage} (${value})`;
                        }
                    }
                }
            }
        });
    }

    // 2. ALT KATEGORİ DAĞILIMI (Horizontal Bar)
    const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
    const getDirectionColor = (dir) => {
        if (dir === 'Şikayet/Sorun') return '#EF4444';
        if (dir === 'Talep/İstek') return '#3B82F6';
        if (dir === 'Memnuniyet') return '#10B981';
        return '#9CA3AF';
    };

    const themeCtx = document.getElementById('themeChart');
    if (themeCtx) {
        state.charts.themeChart = new Chart(themeCtx, {
            type: 'bar',
            data: {
                labels: sortedThemes.map(t => t[0]),
                datasets: [{
                    label: 'Frekans',
                    data: sortedThemes.map(t => t[1].count),
                    backgroundColor: sortedThemes.map(t => getDirectionColor(t[1].direction)),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 40 } },
                scales: { x: { beginAtZero: true, grace: '10%' } },
                plugins: { 
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#4B5563',
                        font: { size: 10, weight: 'bold' },
                        formatter: (value) => {
                            const percentage = totalTopicsFiltered > 0 
                                ? (value * 100 / totalTopicsFiltered).toFixed(0) + "%"
                                : "0%";
                            return `${percentage} (${value})`;
                        }
                    }
                }
            }
        });
    }

    // 3. SENTIMENT (Pie)
    const sentimentLabels = Object.keys(sentimentCounts);
    const sentimentValues = Object.values(sentimentCounts);
    const colorMap = {
        'Olumlu': '#10B981',
        'Olumsuz': '#EF4444',
        'Yapıcı Eleştiri': '#F59E0B',
        'Nötr': '#9CA3AF'
    };
    const bgColors = sentimentLabels.map(l => colorMap[l]);

    const sentimentCtx = document.getElementById('sentimentChart');
    if (sentimentCtx) {
        state.charts.sentimentChart = new Chart(sentimentCtx, {
            type: 'pie',
            data: {
                labels: sentimentLabels,
                datasets: [{
                    data: sentimentValues,
                    backgroundColor: bgColors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10 } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, ctx) => {
                            if (value === 0) return '';
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.forEach(data => { sum += data; });
                            let percentage = (value * 100 / sum).toFixed(1) + "%";
                            return percentage;
                        }
                    }
                }
            }
        });
    }
}

// Legacy functions for backward compatibility
function createComparisonMode() {
    // Now handled by updateCharts
}

function createComparisonCharts() {
    // Now handled by updateCharts
}

function createColumnCharts() {
    // Now handled by updateCharts
}

function renderTableHeader() {
    // Table header is now static in HTML - no dynamic headers needed
    // The new design uses: ID, Orijinal Görüş, Duygu, Analiz Detayı
}

function getFilteredData() {
    return state.enrichedData.filter(row => {
        const idValue = String(row[state.selectedIdColumn] || '');
        
        // 1. Search filter
        let matchesSearch = !state.searchTerm;
        if (state.searchTerm) {
            const searchLower = state.searchTerm.toLowerCase();
            matchesSearch = idValue.toLowerCase().includes(searchLower);
            if (!matchesSearch) {
                // Search in any selected column
                for (const col of state.selectedAnalysisColumns) {
                    const colValue = String(row[col] || '');
                    if (colValue.toLowerCase().includes(searchLower)) {
                        matchesSearch = true;
                        break;
                    }
                }
            }
        }
        
        // 2. Sentiment filter (overall sentiment)
        let matchesSentiment = state.sentimentFilter === 'all';
        if (!matchesSentiment) {
            const overallSent = row._overallSentiment || 'Nötr';
            matchesSentiment = overallSent === state.sentimentFilter;
        }
        
        // 3. Topic-level filters (category, theme, direction)
        const allTopics = row._allTopics || [];
        
        // If no topic filters are set, pass through
        if (state.categoryFilter === 'all' && state.themeFilter === 'all' && state.directionFilter === 'all') {
            return matchesSearch && matchesSentiment;
        }
        
        // Check if any topic matches the filters
        const matchingTopics = allTopics.filter(t => {
            const catMatch = (state.categoryFilter === 'all' || t.mainCategory === state.categoryFilter);
            const themeMatch = (state.themeFilter === 'all' || t.subTheme === state.themeFilter);
            const dirMatch = (state.directionFilter === 'all' || (t.direction || 'Tespit') === state.directionFilter);
            return catMatch && themeMatch && dirMatch;
        });
        
        const matchesTopicFilters = matchingTopics.length > 0;
        
        return matchesSearch && matchesSentiment && matchesTopicFilters;
    });
}

function renderTable() {
    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    // Update filter info
    document.getElementById('filterInfo').textContent =
        `Gösterilen: ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} / Toplam: ${filteredData.length}`;

    const tbody = document.getElementById('resultsTableBody');
    const noDataMsg = document.getElementById('noDataMessage');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '';
        noDataMsg.classList.remove('hidden');
        return;
    } else {
        noDataMsg.classList.add('hidden');
    }

    // Get filter values for relevance checking
    const catFilter = state.categoryFilter;
    const themeFilter = state.themeFilter;
    const dirFilter = state.directionFilter;

    // Render table rows with assertion tags
    tbody.innerHTML = currentData.map((row) => {
        const idValue = escapeHtml(String(row[state.selectedIdColumn] || '-'));
        const overallSentiment = row._overallSentiment || 'Nötr';
        
        // Get all topics and original text
        const allTopics = row._allTopics || [];
        
        // Combine text from all analysis columns
        let combinedText = state.selectedAnalysisColumns
            .map(col => row[col])
            .filter(t => t && String(t).trim())
            .join(' | ');
        
        if (!combinedText) combinedText = '-';
        
        // Build assertion tags HTML
        let topicsHtml = '<div class="flex flex-col gap-1">';
        allTopics.forEach(t => {
            const category = t.mainCategory;
            const theme = t.subTheme;
            const direction = t.direction || 'Tespit';
            
            // Check relevance for opacity
            const isRelevant = (catFilter === 'all' || category === catFilter) && 
                               (themeFilter === 'all' || theme === themeFilter) &&
                               (dirFilter === 'all' || direction === dirFilter);
            
            const isAnyFilterActive = (catFilter !== 'all' || themeFilter !== 'all' || dirFilter !== 'all');
            const opacityClass = !isAnyFilterActive ? '' : (isRelevant ? '' : 'opacity-25 grayscale');
            
            // Direction dot class
            let dotClass = 'dot-detection';
            if (direction === 'Şikayet/Sorun') dotClass = 'dot-complaint';
            else if (direction === 'Talep/İstek') dotClass = 'dot-request';
            else if (direction === 'Memnuniyet') dotClass = 'dot-satisfaction';
            
            topicsHtml += `
                <span class="assertion-tag ${opacityClass}">
                    <div class="flex items-center">
                        <span class="dot ${dotClass}"></span>
                        <span class="font-semibold text-gray-700 mr-1 text-[10px]">${escapeHtml(direction)}:</span> 
                        <span class="truncate max-w-[200px]" title="${escapeHtml(theme)}">${escapeHtml(theme)}</span>
                    </div>
                    <span class="cat-label">${escapeHtml(category)}</span>
                </span>`;
        });
        topicsHtml += '</div>';

        return `
            <tr class="bg-white border-b hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-mono text-xs text-gray-400 align-top">${idValue}</td>
                <td class="px-6 py-4 text-gray-800 align-top leading-relaxed text-xs">${escapeHtml(combinedText)}</td>
                <td class="px-6 py-4 text-center align-top">
                    <span class="sentiment-badge ${getOverallSentimentClass(overallSentiment)}">
                        ${escapeHtml(overallSentiment)}
                    </span>
                </td>
                <td class="px-6 py-4 align-top">
                    ${topicsHtml}
                </td>
            </tr>
        `;
    }).join('');

    // Update pagination
    document.getElementById('pageInfo').textContent = `Sayfa ${state.currentPage} / ${totalPages || 1}`;
    document.getElementById('prevBtn').disabled = state.currentPage === 1;
    document.getElementById('nextBtn').disabled = state.currentPage >= totalPages;
}

function getOverallSentimentClass(sentiment) {
    switch(sentiment) {
        case 'Olumlu': return 'sent-positive';
        case 'Olumsuz': return 'sent-negative';
        case 'Yapıcı Eleştiri': return 'sent-constructive';
        default: return 'sent-neutral';
    }
}

// Global function for cell editing
window.handleCellEdit = function(element) {
    const rowIndex = parseInt(element.dataset.row);
    const field = element.dataset.field;
    const newValue = element.textContent.trim();
    
    // Get filtered data to find actual row
    const filteredData = getFilteredData();
    if (rowIndex < filteredData.length) {
        filteredData[rowIndex][field] = newValue;
        
        // Update the original enrichedData
        const idColumn = state.selectedIdColumn;
        const rowId = filteredData[rowIndex][idColumn];
        const originalRow = state.enrichedData.find(r => r[idColumn] === rowId);
        if (originalRow) {
            originalRow[field] = newValue;
        }
        
        // Auto-save
        autoSaveAnalysis();
        
        // Show save indicator
        showSaveIndicator();
    }
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 2000);
    }
}

function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'Pozitif': return 'bg-green-100 text-green-800';
        case 'Negatif': return 'bg-red-100 text-red-800';
        case 'Nötr': return 'bg-gray-100 text-gray-800';
        case 'Yapıcı Eleştiri': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-blue-100 text-blue-800';
    }
}

function exportToExcel() {
    const exportData = state.enrichedData.map(row => {
        const exportRow = {
            'ID': row[state.selectedIdColumn],
            'Genel Duygu': row._overallSentiment || 'Nötr'
        };
        
        state.selectedAnalysisColumns.forEach(col => {
            exportRow[`${col} - Metin`] = row[col];
            exportRow[`${col} - Kategori`] = row[`${col}_category`];
            exportRow[`${col} - Tema`] = row[`${col}_theme`];
            exportRow[`${col} - Sentiment`] = row[`${col}_sentiment`];
            exportRow[`${col} - Yönelim`] = row[`${col}_direction`] || 'Tespit';
            exportRow[`${col} - Eyleme Dönüştürülebilir`] = row[`${col}_actionable`] ? 'Evet' : 'Hayır';
        });
        
        // Add all topics as JSON for detailed analysis
        const allTopics = row._allTopics || [];
        exportRow['Tüm Konular (JSON)'] = JSON.stringify(allTopics);
        
        return exportRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analiz Sonuçları');

    XLSX.writeFile(wb, `dinamik_analiz_sonuclari_${new Date().getTime()}.xlsx`);
}

async function exportToPDF() {
    try {
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const originalText = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = '<span class="animate-pulse">PDF Oluşturuluyor...</span>';
        exportPdfBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 20;

        const checkPageBreak = (neededSpace) => {
            if (yPosition + neededSpace > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
                return true;
            }
            return false;
        };

        // Title
        pdf.setFontSize(22);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Dinamik Tematik Analiz Raporu', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text('Gemini AI ile Guclendirilmis Coklu-Sutun Analizi', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        pdf.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Global Stats
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Genel Istatistikler', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        const stats = [
            `Toplam Satir: ${state.globalStats.totalRows}`,
            `Analiz Edilen Sutun: ${state.globalStats.totalColumns}`,
            `Toplam Kategori: ${state.globalStats.totalCategories}`,
            `Toplam Tema: ${state.globalStats.totalThemes}`
        ];

        stats.forEach(stat => {
            pdf.text(stat, 20, yPosition);
            yPosition += 6;
        });
        yPosition += 10;

        // Executive Summary
        checkPageBreak(40);
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Yonetici Ozeti', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        
        const summaryText = state.executiveSummary
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/<[^>]*>/g, '');

        const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - 30);
        summaryLines.forEach(line => {
            checkPageBreak(5);
            pdf.text(line, 15, yPosition);
            yPosition += 5;
        });

        // Per-column stats
        for (const columnName in state.stats) {
            checkPageBreak(60);
            pdf.addPage();
            yPosition = 20;
            
            pdf.setFontSize(14);
            pdf.setTextColor(31, 41, 55);
            pdf.text(`Sutun: ${columnName}`, 15, yPosition);
            yPosition += 10;

            const columnStats = state.stats[columnName];
            const topCategories = Object.entries(columnStats.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            pdf.setFontSize(9);
            pdf.text('En Sik Kategoriler:', 15, yPosition);
            yPosition += 5;
            
            topCategories.forEach(([cat, count]) => {
                pdf.text(`  - ${cat}: ${count}`, 20, yPosition);
                yPosition += 4;
            });
        }

        pdf.save(`dinamik_tematik_analiz_${new Date().getTime()}.pdf`);

        exportPdfBtn.innerHTML = originalText;
        exportPdfBtn.disabled = false;

    } catch (error) {
        console.error('PDF export error:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        exportPdfBtn.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg><span>PDF Rapor Indir</span>';
        exportPdfBtn.disabled = false;
    }
}

function autoSaveAnalysis() {
    if (!state.currentAnalysisId) return;
    
    const analysis = {
        id: state.currentAnalysisId,
        timestamp: Date.now(),
        rawData: state.rawData,
        columns: state.columns,
        selectedIdColumn: state.selectedIdColumn,
        selectedAnalysisColumns: state.selectedAnalysisColumns,
        analysisResults: state.analysisResults,
        enrichedData: state.enrichedData,
        stats: state.stats,
        globalStats: state.globalStats,
        executiveSummary: state.executiveSummary
    };
    
    // Get existing analyses
    let analyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
    
    // Update or add current analysis
    const existingIndex = analyses.findIndex(a => a.id === state.currentAnalysisId);
    if (existingIndex >= 0) {
        analyses[existingIndex] = analysis;
    } else {
        analyses.unshift(analysis); // Add to beginning
    }
    
    // Keep only last 10 analyses
    analyses = analyses.slice(0, 10);
    
    localStorage.setItem('saved_analyses', JSON.stringify(analyses));
    
    // Update history button state
    updateHistoryButtonState();
}

function updateHistoryButtonState() {
    const analyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
    const historyCount = document.getElementById('historyCount');
    
    if (analyses.length > 0) {
        historyCount.textContent = analyses.length;
        historyCount.classList.remove('hidden');
    } else {
        historyCount.classList.add('hidden');
    }
}

function saveCurrentAnalysis() {
    if (!state.currentAnalysisId) {
        state.currentAnalysisId = 'analysis_' + Date.now();
    }
    autoSaveAnalysis();
    alert('Analiz başarıyla kaydedildi!');
}

function loadAnalysis(analysisId) {
    const analyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
    const analysis = analyses.find(a => a.id === analysisId);
    
    if (!analysis) {
        alert('Analiz bulunamadı!');
        return;
    }
    
    // Destroy existing charts
    Object.values(state.charts).forEach(chart => chart?.destroy());
    state.charts = {};
    
    // Load into state
    state.rawData = analysis.rawData;
    state.columns = analysis.columns;
    state.selectedIdColumn = analysis.selectedIdColumn;
    state.selectedAnalysisColumns = analysis.selectedAnalysisColumns;
    state.analysisResults = analysis.analysisResults;
    state.enrichedData = analysis.enrichedData;
    state.stats = analysis.stats;
    state.globalStats = analysis.globalStats;
    state.executiveSummary = analysis.executiveSummary;
    state.currentAnalysisId = analysisId;
    state.isHistoryMode = true;
    
    // Reset filters and pagination
    state.currentPage = 1;
    state.searchTerm = '';
    state.columnFilter = 'all';
    state.sentimentFilter = 'all';
    state.categoryFilter = 'all';
    state.themeFilter = 'all';
    state.directionFilter = 'all';
    
    // Hide all sections except results
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('columnSection').classList.add('hidden');
    document.getElementById('progressSection').classList.add('hidden');
    
    // Close history modal
    document.getElementById('historyModal').classList.add('hidden');
    
    // Show results
    showResults();
}

function deleteAnalysis(analysisId) {
    if (!confirm('Bu analizi silmek istediğinizden emin misiniz?')) return;
    
    let analyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
    analyses = analyses.filter(a => a.id !== analysisId);
    localStorage.setItem('saved_analyses', JSON.stringify(analyses));
    
    // Update history button state
    updateHistoryButtonState();
    
    // Refresh history modal
    renderHistoryModal();
}

function showHistoryModal() {
    document.getElementById('historyModal').classList.remove('hidden');
    renderHistoryModal();
}

function renderHistoryModal() {
    const analyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
    const container = document.getElementById('historyList');
    
    if (analyses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-500 mt-4">Henüz kaydedilmiş analiz yok.</p>
                <p class="text-gray-400 text-sm mt-2">Bir analiz tamamladığınızda otomatik olarak buraya kaydedilecek.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = analyses.map((analysis, index) => {
        const date = new Date(analysis.timestamp).toLocaleString('tr-TR');
        const columns = analysis.selectedAnalysisColumns.join(', ');
        const isLatest = index === 0;
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 ${isLatest ? 'border-purple-300 bg-purple-50' : ''}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h4 class="font-semibold text-gray-800">${date}</h4>
                            ${isLatest ? '<span class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">En Son</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 mt-1">📊 Sütunlar: ${columns}</p>
                        <p class="text-sm text-gray-600">📝 Satırlar: ${analysis.rawData.length}</p>
                        <p class="text-sm text-gray-600">🏷️ Kategoriler: ${analysis.globalStats.totalCategories} • Temalar: ${analysis.globalStats.totalThemes}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="loadAnalysis('${analysis.id}')" 
                                class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center space-x-1">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            <span>Görüntüle</span>
                        </button>
                        <button onclick="deleteAnalysis('${analysis.id}')" 
                                class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Make functions global for onclick handlers
window.loadAnalysis = loadAnalysis;
window.deleteAnalysis = deleteAnalysis;

function resetApp() {
    state.rawData = [];
    state.columns = [];
    state.selectedIdColumn = null;
    state.selectedAnalysisColumns = [];
    state.analysisResults = {};
    state.enrichedData = [];
    state.stats = {};
    state.globalStats = null;
    state.executiveSummary = '';
    state.currentPage = 1;
    state.searchTerm = '';
    state.columnFilter = 'all';
    state.sentimentFilter = 'all';
    state.categoryFilter = 'all';
    state.themeFilter = 'all';
    state.directionFilter = 'all';
    state.currentAnalysisId = null;
    state.isHistoryMode = false;
    state.failedRows = [];
    state.currentBatchSize = state.batchSize;
    state.currentApiKeyIndex = 0;
    // Reset analysis control
    state.isAnalyzing = false;
    state.isPaused = false;
    state.shouldStop = false;
    state.completedColumns = [];
    state.partialAnalysisId = null;

    // Destroy charts
    Object.values(state.charts).forEach(chart => chart?.destroy());
    state.charts = {};

    document.getElementById('fileInput').value = '';
    document.getElementById('fileNameDisplay').innerHTML = 'Excel dosyasını buraya sürükleyin veya <span class="text-purple-600 hover:text-purple-700">seçmek için tıklayın</span>';
    document.getElementById('searchInput').value = '';

    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('columnSection').classList.add('hidden');
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    hideError();
    
    // Reset pause button state
    const pauseIcon = document.getElementById('pauseIcon');
    const playIcon = document.getElementById('playIcon');
    const pauseResumeText = document.getElementById('pauseResumeText');
    const pausedIndicator = document.getElementById('pausedIndicator');
    
    if (pauseIcon) pauseIcon.classList.remove('hidden');
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseResumeText) pauseResumeText.textContent = 'Duraklat';
    if (pausedIndicator) pausedIndicator.classList.add('hidden');
    
    // Re-render API keys to reset active indicator
    renderApiKeysList();
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorSection').classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorSection').classList.add('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMarkdown(text) {
    return text
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-800">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5 text-gray-900">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/\n\n/g, '<br><br>');
}

