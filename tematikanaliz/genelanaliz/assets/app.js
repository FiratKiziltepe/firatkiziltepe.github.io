import { GoogleGenerativeAI } from '@google/generative-ai';

// Global state
const state = {
    apiKey: localStorage.getItem('gemini_api_key_dynamic') || '',
    selectedModel: localStorage.getItem('gemini_model_dynamic') || 'gemini-2.5-flash',
    batchSize: parseInt(localStorage.getItem('batch_size_dynamic')) || 10,
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
    charts: {}
};

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
                                }
                            },
                            required: ['mainCategory', 'subTheme', 'sentiment']
                        }
                    },
                    actionable: { type: 'boolean', description: 'Somut bir öneri veya aksiyon içeriyor mu?' }
                },
                required: ['entryId', 'topics', 'actionable']
            }
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DİNAMİK TEMATİK ANALİZ SİSTEMİ BAŞLATILIYOR ===');
    
    try {
        initializeModelSelect();
        initializeBatchSize();
        initializeEventListeners();
        
        if (state.apiKey) {
            document.getElementById('apiKeyInput').value = state.apiKey;
        }
        
        console.log('=== SİSTEM BAŞARILI ŞEKİLDE BAŞLATILDI ===');
    } catch (error) {
        console.error('=== SİSTEM BAŞLATMA HATASI ===', error);
    }
});

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
    const apiKeyInput = document.getElementById('apiKeyInput');
    const cancelColumnBtn = document.getElementById('cancelColumnBtn');
    const startAnalysisBtn = document.getElementById('startAnalysisBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const exportBtn = document.getElementById('exportBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const searchInput = document.getElementById('searchInput');
    const columnFilterSelect = document.getElementById('columnFilterSelect');
    const sentimentFilterSelect = document.getElementById('sentimentFilterSelect');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // API Key
    apiKeyInput.addEventListener('input', (e) => {
        state.apiKey = e.target.value;
        localStorage.setItem('gemini_api_key_dynamic', e.target.value);
    });

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

    // Filters
    searchInput.addEventListener('input', () => {
        state.searchTerm = searchInput.value;
        state.currentPage = 1;
        renderTable();
    });
    columnFilterSelect.addEventListener('change', () => {
        state.columnFilter = columnFilterSelect.value;
        state.currentPage = 1;
        renderTable();
    });
    sentimentFilterSelect.addEventListener('change', () => {
        state.sentimentFilter = sentimentFilterSelect.value;
        state.currentPage = 1;
        renderTable();
    });

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
        
        const label = document.createElement('label');
        label.htmlFor = `col_${col}`;
        label.textContent = col;
        label.className = 'text-sm text-gray-700 cursor-pointer flex-1';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

async function startAnalysis() {
    if (!state.apiKey) {
        showError('Lütfen Gemini API anahtarınızı girin.');
        return;
    }

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

        const genAI = new GoogleGenerativeAI(state.apiKey);
        state.analysisResults = {};

        // Analyze each column independently
        for (let colIndex = 0; colIndex < state.selectedAnalysisColumns.length; colIndex++) {
            const columnName = state.selectedAnalysisColumns[colIndex];
            
            document.getElementById('currentColumnProgress').textContent = `İşlenen Sütun: ${columnName}`;
            document.getElementById('columnProgressCount').textContent = `${colIndex + 1} / ${state.selectedAnalysisColumns.length} sütun`;
            
            const columnResults = await analyzeColumn(genAI, columnName);
            state.analysisResults[columnName] = columnResults;

            // Delay between columns
            if (colIndex < state.selectedAnalysisColumns.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COLUMNS));
            }
        }

        // Calculate statistics
        calculateAllStats();

        // Enrich data
        enrichData();

        // Generate executive summary
        state.executiveSummary = await generateExecutiveSummary(genAI);

        // Show results
        document.getElementById('progressSection').classList.add('hidden');
        showResults();
    } catch (error) {
        showError('Analiz sırasında bir hata oluştu: ' + error.message);
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('columnSection').classList.remove('hidden');
    }
}

async function analyzeColumn(genAI, columnName) {
    const results = [];
    const totalBatches = Math.ceil(state.rawData.length / state.batchSize);

    for (let i = 0; i < state.rawData.length; i += state.batchSize) {
        const batch = state.rawData.slice(i, i + state.batchSize);
        const currentBatch = Math.floor(i / state.batchSize) + 1;

        const totalProgress = ((state.selectedAnalysisColumns.indexOf(columnName) * state.rawData.length) + i + batch.length) / 
                              (state.selectedAnalysisColumns.length * state.rawData.length);
        
        updateProgress(totalProgress * 100, `${columnName}: Batch ${currentBatch}/${totalBatches}`);

        const batchResult = await analyzeBatch(genAI, batch, columnName);
        results.push(...batchResult.items);

        if (i + state.batchSize < state.rawData.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    return results;
}

async function analyzeBatch(genAI, rows, columnName) {
    const promptData = rows.map(r => ({
        id: String(r[state.selectedIdColumn]),
        text: String(r[columnName] || '')
    }));

    const systemInstruction = `
Sen bir tematik analiz uzmanısın. Verilen serbest metin cevaplarını analiz et ve kategorize et.

SORU/BAĞLAM: "${columnName}"

GÖREV:
Her cevap için:
1. 1-3 ana tema/konu belirle (cevap birden fazla konuya değiniyorsa ayır)
2. Her tema için:
   - mainCategory: Temayı en iyi tanımlayan kategori adı (kısa, öz, Türkçe)
   - subTheme: Daha spesifik alt tema (kısa, öz, Türkçe)
   - sentiment: Pozitif/Negatif/Nötr/Yapıcı Eleştiri
3. actionable: Somut aksiyon gerektiriyor mu?

KURALLAR:
- Kategorileri verilerden organik olarak çıkar
- Benzer konuları aynı kategori altında topla
- Kısa, kurumsal, Türkçe isimler kullan
- Aynı kişinin farklı konulara değiniyorsa ayır (max 3 topic)
- Boş/anlamsız cevaplar için tek bir "Yanıt Yok" kategorisi kullan

ÖRNEKLER:

Cevap: "Dijital araçları çok kullanıyorum ama internet bağlantısı çok yavaş"
→ 2 topic:
  1. mainCategory: "Dijital Araç Kullanımı", subTheme: "Aktif kullanım", sentiment: "Pozitif"
  2. mainCategory: "Teknik Altyapı", subTheme: "İnternet hızı sorunu", sentiment: "Negatif"

Cevap: "Sorun yok"
→ 1 topic:
  mainCategory: "Genel Değerlendirme", subTheme: "Memnuniyet", sentiment: "Pozitif"

Cevap: ""
→ 1 topic:
  mainCategory: "Yanıt Yok", subTheme: "Cevap verilmedi", sentiment: "Nötr"
`;

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

    let retries = 5;
    let retryDelay = 5000;

    while (retries > 0) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (!text) throw new Error('Empty response from Gemini');

            return JSON.parse(text);
        } catch (error) {
            const isRateLimit = error.message.includes('429') || error.message.includes('Quota exceeded');
            if (isRateLimit && retries > 1) {
                console.warn(`Rate limit hit, retrying in ${retryDelay}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 1.5;
                retries--;
                continue;
            }
            console.error('Batch analysis error:', error);
            if (retries === 1) return { items: [] };
            if (!isRateLimit) return { items: [] };
        }
    }
    return { items: [] };
}

function calculateAllStats() {
    state.stats = {};
    
    let allCategories = new Set();
    let allThemes = new Set();
    
    for (const columnName in state.analysisResults) {
        const results = state.analysisResults[columnName];
        const categoryCounts = {};
        const themeCounts = {};
        const sentimentCounts = {};
        let actionableCount = 0;

        results.forEach(result => {
            if (result.topics && Array.isArray(result.topics)) {
                result.topics.forEach(topic => {
                    categoryCounts[topic.mainCategory] = (categoryCounts[topic.mainCategory] || 0) + 1;
                    themeCounts[topic.subTheme] = (themeCounts[topic.subTheme] || 0) + 1;
                    sentimentCounts[topic.sentiment] = (sentimentCounts[topic.sentiment] || 0) + 1;
                    
                    allCategories.add(topic.mainCategory);
                    allThemes.add(topic.subTheme);
                });
            }
            if (result.actionable) actionableCount++;
        });

        state.stats[columnName] = {
            totalRows: results.length,
            categoryCounts,
            themeCounts,
            sentimentCounts,
            actionableCount,
            nonActionableCount: results.length - actionableCount
        };
    }
    
    // Calculate global stats
    state.globalStats = {
        totalRows: state.rawData.length,
        totalColumns: state.selectedAnalysisColumns.length,
        totalCategories: allCategories.size,
        totalThemes: allThemes.size
    };
}

function enrichData() {
    state.enrichedData = state.rawData.map(row => {
        const enrichedRow = { ...row };
        
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
                enrichedRow[`${columnName}_actionable`] = analysis.actionable;
                enrichedRow[`${columnName}_allTopics`] = analysis.topics;
            } else {
                enrichedRow[`${columnName}_category`] = 'İşlenmedi';
                enrichedRow[`${columnName}_theme`] = 'İşlenmedi';
                enrichedRow[`${columnName}_sentiment`] = 'Nötr';
                enrichedRow[`${columnName}_actionable`] = false;
                enrichedRow[`${columnName}_allTopics`] = [];
            }
        });
        
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
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').textContent = text;
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

    // Create charts for each column
    createColumnCharts();

    // Populate column filter
    const columnFilterSelect = document.getElementById('columnFilterSelect');
    columnFilterSelect.innerHTML = '<option value="all">Tüm Sütunlar</option>';
    state.selectedAnalysisColumns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        columnFilterSelect.appendChild(option);
    });

    // Render table
    renderTableHeader();
    renderTable();
}

function createColumnCharts() {
    const container = document.getElementById('columnChartsContainer');
    container.innerHTML = '';
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

    state.selectedAnalysisColumns.forEach((columnName, index) => {
        const stats = state.stats[columnName];
        
        // Create section for this column
        const section = document.createElement('div');
        section.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
        section.innerHTML = `
            <h3 class="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Sütun: ${columnName}</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">Kategori Dağılımı</h4>
                    <div style="position: relative; height: 250px;">
                        <canvas id="categoryChart_${index}"></canvas>
                    </div>
                </div>
                <div>
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">En Sık 10 Tema</h4>
                    <div style="position: relative; height: 250px;">
                        <canvas id="themeChart_${index}"></canvas>
                    </div>
                </div>
                <div>
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">Sentiment Dağılımı</h4>
                    <div style="position: relative; height: 250px;">
                        <canvas id="sentimentChart_${index}"></canvas>
                    </div>
                </div>
                <div>
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">Eyleme Dönüştürülebilirlik</h4>
                    <div style="position: relative; height: 250px;">
                        <canvas id="actionableChart_${index}"></canvas>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(section);

        // Create charts
        setTimeout(() => {
            // Category Chart
            const categoryData = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1]);
            state.charts[`category_${index}`] = new Chart(document.getElementById(`categoryChart_${index}`), {
                type: 'bar',
                data: {
                    labels: categoryData.map(([name]) => name),
                    datasets: [{
                        label: 'Görüş Sayısı',
                        data: categoryData.map(([, value]) => value),
                        backgroundColor: colors
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true } }
                }
            });

            // Theme Chart
            const themeData = Object.entries(stats.themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
            state.charts[`theme_${index}`] = new Chart(document.getElementById(`themeChart_${index}`), {
                type: 'bar',
                data: {
                    labels: themeData.map(([name]) => name),
                    datasets: [{
                        label: 'Görüş Sayısı',
                        data: themeData.map(([, value]) => value),
                        backgroundColor: '#8B5CF6'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true } }
                }
            });

            // Sentiment Chart
            const sentimentColors = {
                'Pozitif': '#10B981',
                'Negatif': '#EF4444',
                'Nötr': '#6B7280',
                'Yapıcı Eleştiri': '#F59E0B'
            };
            const sentimentData = Object.entries(stats.sentimentCounts);
            state.charts[`sentiment_${index}`] = new Chart(document.getElementById(`sentimentChart_${index}`), {
                type: 'pie',
                data: {
                    labels: sentimentData.map(([name]) => name),
                    datasets: [{
                        data: sentimentData.map(([, value]) => value),
                        backgroundColor: sentimentData.map(([name]) => sentimentColors[name] || '#6B7280')
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });

            // Actionable Chart
            state.charts[`actionable_${index}`] = new Chart(document.getElementById(`actionableChart_${index}`), {
                type: 'pie',
                data: {
                    labels: ['Eyleme Dönüştürülebilir', 'Eyleme Dönüştürülemez'],
                    datasets: [{
                        data: [stats.actionableCount, stats.nonActionableCount],
                        backgroundColor: ['#10B981', '#6B7280']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }, 100);
    });
}

function renderTableHeader() {
    const thead = document.getElementById('tableHeader');
    let headerHTML = `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>`;
    
    state.selectedAnalysisColumns.forEach(col => {
        headerHTML += `
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${col}</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
        `;
    });
    
    thead.innerHTML = headerHTML;
}

function getFilteredData() {
    return state.enrichedData.filter(row => {
        const idValue = String(row[state.selectedIdColumn] || '');
        
        let matchesSearch = !state.searchTerm;
        if (state.searchTerm) {
            matchesSearch = idValue.toLowerCase().includes(state.searchTerm.toLowerCase());
            if (!matchesSearch) {
                // Search in any selected column
                for (const col of state.selectedAnalysisColumns) {
                    const colValue = String(row[col] || '');
                    if (colValue.toLowerCase().includes(state.searchTerm.toLowerCase())) {
                        matchesSearch = true;
                        break;
                    }
                }
            }
        }
        
        let matchesColumn = state.columnFilter === 'all';
        if (!matchesColumn && state.columnFilter !== 'all') {
            // Check if any text in the filtered column matches
            const colValue = String(row[state.columnFilter] || '');
            matchesColumn = colValue.length > 0;
        }
        
        let matchesSentiment = state.sentimentFilter === 'all';
        if (!matchesSentiment) {
            for (const col of state.selectedAnalysisColumns) {
                if (row[`${col}_sentiment`] === state.sentimentFilter) {
                    matchesSentiment = true;
                    break;
                }
            }
        }
        
        return matchesSearch && matchesColumn && matchesSentiment;
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

    // Render table rows
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = currentData.map(row => {
        const idValue = escapeHtml(String(row[state.selectedIdColumn] || '-'));
        let rowHTML = `<td class="px-4 py-4 text-sm text-gray-900">${idValue}</td>`;
        
        state.selectedAnalysisColumns.forEach(col => {
            const text = escapeHtml(String(row[col] || '-'));
            const category = escapeHtml(row[`${col}_category`] || 'İşlenmedi');
            const theme = escapeHtml(row[`${col}_theme`] || 'İşlenmedi');
            const sentiment = row[`${col}_sentiment`] || 'Nötr';
            
            rowHTML += `
                <td class="px-4 py-4 text-sm text-gray-600" style="max-width: 300px; word-wrap: break-word;">${text}</td>
                <td class="px-4 py-4 text-sm"><span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">${category}</span></td>
                <td class="px-4 py-4 text-sm text-gray-600">${theme}</td>
                <td class="px-4 py-4 text-sm"><span class="px-2 py-1 rounded-full text-xs ${getSentimentColor(sentiment)}">${escapeHtml(sentiment)}</span></td>
            `;
        });
        
        return `<tr class="hover:bg-gray-50">${rowHTML}</tr>`;
    }).join('');

    // Update pagination
    document.getElementById('pageInfo').textContent = `Sayfa ${state.currentPage} / ${totalPages || 1}`;
    document.getElementById('prevBtn').disabled = state.currentPage === 1;
    document.getElementById('nextBtn').disabled = state.currentPage >= totalPages;
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
            'ID': row[state.selectedIdColumn]
        };
        
        state.selectedAnalysisColumns.forEach(col => {
            exportRow[`${col} - Metin`] = row[col];
            exportRow[`${col} - Kategori`] = row[`${col}_category`];
            exportRow[`${col} - Tema`] = row[`${col}_theme`];
            exportRow[`${col} - Sentiment`] = row[`${col}_sentiment`];
            exportRow[`${col} - Eyleme Dönüştürülebilir`] = row[`${col}_actionable`] ? 'Evet' : 'Hayır';
        });
        
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

