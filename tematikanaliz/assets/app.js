import { GoogleGenerativeAI } from '@google/generative-ai';

// Global state
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    selectedModel: localStorage.getItem('gemini_model') || 'gemini-2.5-flash',
    rawData: [],
    enrichedData: [],
    analysisResults: [],
    stats: null,
    executiveSummary: '',
    currentPage: 1,
    itemsPerPage: 20,
    searchTerm: '',
    categoryFilter: 'all',
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

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

// Schema for structured output
const analysisSchema = {
    type: 'object',
    properties: {
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    entryId: { type: 'string', description: 'The Entry Id provided in the input' },
                    mainCategory: { type: 'string', description: 'Ana kategori (Örn: Ders Kitabı İçeriği, Müfredat, Ölçme Değerlendirme, Fiziki Koşullar, Öğretmen Kılavuzu)' },
                    subTheme: { type: 'string', description: 'Spesifik alt tema (Örn: Etkinlik zorluğu, Kaynak yetersizliği, Kazanım uyumsuzluğu)' },
                    sentiment: { type: 'string', enum: ['Pozitif', 'Negatif', 'Nötr'], description: 'Görüşün duygu durumu' },
                    actionable: { type: 'boolean', description: 'Somut bir öneri veya aksiyon içeriyor mu?' }
                },
                required: ['entryId', 'mainCategory', 'subTheme', 'sentiment', 'actionable']
            }
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeModelSelect();
    if (state.apiKey) {
        document.getElementById('apiKeyInput').value = state.apiKey;
    }
});

function initializeModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    const modelLimitInfo = document.getElementById('modelLimitInfo');

    // Populate options
    AVAILABLE_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });

    // Set initial value
    modelSelect.value = state.selectedModel;
    updateLimitInfo(state.selectedModel);

    // Listen for changes
    modelSelect.addEventListener('change', (e) => {
        state.selectedModel = e.target.value;
        localStorage.setItem('gemini_model', e.target.value);
        updateLimitInfo(e.target.value);
    });
}

function updateLimitInfo(modelId) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
        document.getElementById('modelLimitInfo').textContent = `Limitler: ${model.limitInfo}`;
    }
}

function initializeEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const exportBtn = document.getElementById('exportBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sentimentFilter = document.getElementById('sentimentFilter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // API Key
    apiKeyInput.addEventListener('input', (e) => {
        state.apiKey = e.target.value;
        localStorage.setItem('gemini_api_key', e.target.value);
    });

    // File upload
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Analysis controls
    analyzeBtn.addEventListener('click', startAnalysis);
    resetBtn.addEventListener('click', resetApp);
    newAnalysisBtn.addEventListener('click', resetApp);
    exportBtn.addEventListener('click', exportToExcel);

    // Filters
    searchInput.addEventListener('input', () => {
        state.searchTerm = searchInput.value;
        state.currentPage = 1;
        renderTable();
    });
    categoryFilter.addEventListener('change', () => {
        state.categoryFilter = categoryFilter.value;
        state.currentPage = 1;
        renderTable();
    });
    sentimentFilter.addEventListener('change', () => {
        state.sentimentFilter = sentimentFilter.value;
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
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
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

            // Validate required columns
            if (jsonData.length > 0) {
                const firstRow = jsonData[0];
                const hasRequiredColumns =
                    'Entry Id' in firstRow &&
                    'DERS' in firstRow &&
                    'SINIF' in firstRow &&
                    'Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.' in firstRow;

                if (!hasRequiredColumns) {
                    showError('Excel dosyası gerekli sütunları içermiyor.');
                    return;
                }
            }

            state.rawData = jsonData;
            document.getElementById('fileNameDisplay').innerHTML = `<span class="text-green-600">Seçilen dosya: ${file.name}</span>`;
            document.getElementById('rowCount').textContent = jsonData.length;
            document.getElementById('uploadSection').classList.add('hidden');
            document.getElementById('controlsSection').classList.remove('hidden');
            hideError();
        } catch (error) {
            showError('Dosya okuma hatası: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

async function startAnalysis() {
    if (!state.apiKey) {
        showError('Lütfen Gemini API anahtarınızı girin.');
        return;
    }

    try {
        hideError();
        document.getElementById('controlsSection').classList.add('hidden');
        document.getElementById('progressSection').classList.remove('hidden');

        const genAI = new GoogleGenerativeAI(state.apiKey);
        state.analysisResults = [];

        const totalBatches = Math.ceil(state.rawData.length / BATCH_SIZE);

        for (let i = 0; i < state.rawData.length; i += BATCH_SIZE) {
            const batch = state.rawData.slice(i, i + BATCH_SIZE);
            const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`Processing batch ${currentBatch}/${totalBatches}`);
            updateProgress(i + batch.length, state.rawData.length);

            const batchResult = await analyzeBatch(genAI, batch);
            state.analysisResults.push(...batchResult.items);

            if (i + BATCH_SIZE < state.rawData.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        // Calculate stats
        state.stats = calculateStats(state.analysisResults);

        // Enrich data
        state.enrichedData = enrichDataWithAnalysis(state.rawData, state.analysisResults);

        // Generate executive summary
        state.executiveSummary = await generateExecutiveSummary(genAI, state.analysisResults);

        // Show results
        document.getElementById('progressSection').classList.add('hidden');
        showResults();
    } catch (error) {
        showError('Analiz sırasında bir hata oluştu: ' + error.message);
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('controlsSection').classList.remove('hidden');
    }
}

async function analyzeBatch(genAI, rows) {
    const promptData = rows.map(r => ({
        id: r['Entry Id'],
        text: r['Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.'] || '',
        context: `${r.DERS} - ${r.SINIF}`
    }));

    const prompt = `
Aşağıda öğretmenlerin eğitim materyalleri ve müfredat hakkındaki görüşleri bulunmaktadır.
Bu görüşleri analiz et ve JSON formatında yapılandır.
Eğer görüş boşsa veya anlamsızsa, kategori olarak "Diğer", sentiment olarak "Nötr" işaretle.

Ana Kategoriler (sadece bunları kullan):
- Ders Kitabı İçeriği
- Müfredat
- Ölçme Değerlendirme
- Fiziki Koşullar
- Öğretmen Kılavuzu
- Öğrenci Seviyesi
- Zaman Yönetimi
- Diğer

Veriler:
${JSON.stringify(promptData, null, 2)}
`;

    const model = genAI.getGenerativeModel({
        model: state.selectedModel,
        generationConfig: {
            temperature: 0.2,
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
                console.warn(`Rate limit hit (Batch), retrying in ${retryDelay}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 1.5;
                retries--;
                continue;
            }
            console.error('Batch analysis error:', error);
            // Only return empty if it's a non-recoverable error or we ran out of retries
            if (retries === 1) return { items: [] };
            // If it's not a rate limit error, fail immediately
            if (!isRateLimit) return { items: [] };
        }
    }
    return { items: [] };
}

async function generateExecutiveSummary(genAI, analysisResults) {
    const categoryCounts = analysisResults.reduce((acc, item) => {
        acc[item.mainCategory] = (acc[item.mainCategory] || 0) + 1;
        return acc;
    }, {});

    const sentimentCounts = analysisResults.reduce((acc, item) => {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        return acc;
    }, {});

    const actionableCount = analysisResults.filter(i => i.actionable).length;
    const topThemes = analysisResults
        .slice(0, 100)
        .map(i => `${i.mainCategory}: ${i.subTheme}`)
        .join('; ');

    const prompt = `
Sen kıdemli bir eğitim analistisin. Binlerce öğretmen görüşünün analiz sonuçlarını inceledin.
Aşağıdaki özet verilere dayanarak, Milli Eğitim Bakanlığı yetkilileri için üst düzey bir yönetici özeti (Executive Summary) yaz.

Toplam Görüş Sayısı: ${analysisResults.length}

Kategori Dağılımı: ${JSON.stringify(categoryCounts, null, 2)}

Sentiment Dağılımı: ${JSON.stringify(sentimentCounts, null, 2)}

Eyleme Dönüştürülebilir Görüş Sayısı: ${actionableCount} (${((actionableCount / analysisResults.length) * 100).toFixed(1)}%)

Örnek Temalar (ilk 100): ${topThemes}

Lütfen şu başlıkları kullan:
1. Genel Durum Değerlendirmesi
2. Öne Çıkan Sorun Alanları
3. En Sık Rastlanan Alt Temalar
4. İyileştirme Önerileri
5. Öncelikli Aksiyon Maddeleri

Türkçe ve resmi bir dil kullan. Markdown formatında yaz.
`;

    const model = genAI.getGenerativeModel({
        model: state.selectedModel,
        generationConfig: {
            temperature: 0.7,
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

function enrichDataWithAnalysis(rawData, analysisResults) {
    const analysisMap = new Map();
    analysisResults.forEach(result => {
        analysisMap.set(result.entryId, result);
    });

    return rawData.map(row => {
        const analysis = analysisMap.get(row['Entry Id']);
        return {
            ...row,
            mainCategory: analysis?.mainCategory || 'İşlenmedi',
            subTheme: analysis?.subTheme || 'İşlenmedi',
            sentiment: analysis?.sentiment || 'Nötr',
            actionable: analysis?.actionable || false,
        };
    });
}

function calculateStats(analysisResults) {
    const categoryCounts = {};
    const themeCounts = {};
    const sentimentCounts = {};
    let actionableCount = 0;

    analysisResults.forEach(result => {
        categoryCounts[result.mainCategory] = (categoryCounts[result.mainCategory] || 0) + 1;
        themeCounts[result.subTheme] = (themeCounts[result.subTheme] || 0) + 1;
        sentimentCounts[result.sentiment] = (sentimentCounts[result.sentiment] || 0) + 1;
        if (result.actionable) actionableCount++;
    });

    return {
        totalRows: analysisResults.length,
        categoryCounts,
        themeCounts,
        sentimentCounts,
        actionableCount,
        nonActionableCount: analysisResults.length - actionableCount
    };
}

function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${current} / ${total} satır işlendi (${Math.round(percentage)}%)`;
}

function showResults() {
    document.getElementById('resultsSection').classList.remove('hidden');

    // Update stats
    document.getElementById('totalRowsDisplay').textContent = state.stats.totalRows;
    document.getElementById('statTotal').textContent = state.stats.totalRows;
    document.getElementById('statCategories').textContent = Object.keys(state.stats.categoryCounts).length;
    document.getElementById('statThemes').textContent = Object.keys(state.stats.themeCounts).length;
    document.getElementById('statActionable').textContent = Math.round((state.stats.actionableCount / state.stats.totalRows) * 100) + '%';

    // Create charts
    createCharts();

    // Show executive summary
    document.getElementById('executiveSummary').innerHTML = formatMarkdown(state.executiveSummary);

    // Populate category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    Object.keys(state.stats.categoryCounts).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Render table
    renderTable();
}

function createCharts() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

    // Category Chart
    const categoryData = Object.entries(state.stats.categoryCounts);
    state.charts.category = new Chart(document.getElementById('categoryChart'), {
        type: 'pie',
        data: {
            labels: categoryData.map(([name]) => name),
            datasets: [{
                data: categoryData.map(([, value]) => value),
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Theme Chart (top 10)
    const themeData = Object.entries(state.stats.themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    state.charts.theme = new Chart(document.getElementById('themeChart'), {
        type: 'bar',
        data: {
            labels: themeData.map(([name]) => name.length > 30 ? name.substring(0, 30) + '...' : name),
            datasets: [{
                label: 'Görüş Sayısı',
                data: themeData.map(([, value]) => value),
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Sentiment Chart
    const sentimentColors = {
        'Pozitif': '#10B981',
        'Negatif': '#EF4444',
        'Nötr': '#6B7280'
    };
    const sentimentData = Object.entries(state.stats.sentimentCounts);
    state.charts.sentiment = new Chart(document.getElementById('sentimentChart'), {
        type: 'pie',
        data: {
            labels: sentimentData.map(([name]) => name),
            datasets: [{
                data: sentimentData.map(([, value]) => value),
                backgroundColor: sentimentData.map(([name]) => sentimentColors[name])
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Actionable Chart
    state.charts.actionable = new Chart(document.getElementById('actionableChart'), {
        type: 'pie',
        data: {
            labels: ['Eyleme Dönüştürülebilir', 'Eyleme Dönüştürülemez'],
            datasets: [{
                data: [state.stats.actionableCount, state.stats.nonActionableCount],
                backgroundColor: ['#10B981', '#6B7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function getFilteredData() {
    return state.enrichedData.filter(row => {
        const matchesSearch = !state.searchTerm ||
            row['Entry Id']?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            row['Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.']?.toLowerCase().includes(state.searchTerm.toLowerCase());
        const matchesCategory = state.categoryFilter === 'all' || row.mainCategory === state.categoryFilter;
        const matchesSentiment = state.sentimentFilter === 'all' || row.sentiment === state.sentimentFilter;
        return matchesSearch && matchesCategory && matchesSentiment;
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
    tbody.innerHTML = currentData.map(row => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escapeHtml(row['Entry Id'])}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHtml(row['DERS'])} / ${escapeHtml(row['SINIF'])}</td>
            <td class="px-6 py-4 text-sm text-gray-600 max-w-md"><div class="line-clamp-3">${escapeHtml(row['Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.'] || '-')}</div></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${escapeHtml(row.mainCategory)}</span></td>
            <td class="px-6 py-4 text-sm text-gray-600 max-w-xs"><div class="line-clamp-2">${escapeHtml(row.subTheme)}</div></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-full text-xs ${getSentimentColor(row.sentiment)}">${escapeHtml(row.sentiment)}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">${row.actionable ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-400">-</span>'}</td>
        </tr>
    `).join('');

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
        default: return 'bg-blue-100 text-blue-800';
    }
}

function exportToExcel() {
    const exportData = state.enrichedData.map(row => ({
        'Entry Id': row['Entry Id'],
        'Ders': row['DERS'],
        'Sınıf': row['SINIF'],
        'Görüş': row['Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.'],
        'Ana Kategori': row.mainCategory,
        'Alt Tema': row.subTheme,
        'Sentiment': row.sentiment,
        'Eyleme Dönüştürülebilir': row.actionable ? 'Evet' : 'Hayır',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analiz Sonuçları');

    // Auto-size columns
    const maxWidth = 50;
    ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: maxWidth },
        { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 20 }
    ];

    XLSX.writeFile(wb, 'analiz_sonuclari.xlsx');
}

function resetApp() {
    state.rawData = [];
    state.enrichedData = [];
    state.analysisResults = [];
    state.stats = null;
    state.executiveSummary = '';
    state.currentPage = 1;
    state.searchTerm = '';
    state.categoryFilter = 'all';
    state.sentimentFilter = 'all';

    // Destroy charts
    Object.values(state.charts).forEach(chart => chart?.destroy());
    state.charts = {};

    document.getElementById('fileInput').value = '';
    document.getElementById('fileNameDisplay').innerHTML = 'Excel dosyasını buraya sürükleyin veya <span class="text-blue-600 hover:text-blue-700">seçmek için tıklayın</span>';
    document.getElementById('searchInput').value = '';

    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('controlsSection').classList.add('hidden');
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
