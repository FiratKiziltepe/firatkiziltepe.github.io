// Global değişkenler
let csvData = [];
let results = [];
let apiKey = '';

// DOM elementi referansları
const apiKeyInput = document.getElementById('apiKey');
const batchSizeInput = document.getElementById('batchSize');
const delayBetweenRequestsInput = document.getElementById('delayBetweenRequests');
const delayInput = document.getElementById('delayBetweenBatches');
const instructionsInput = document.getElementById('instructions');
const csvFileInput = document.getElementById('csvFile');
const analyzeBtn = document.getElementById('analyzeBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsBody = document.getElementById('resultsBody');

// API key'i localStorage'dan yükle
window.addEventListener('DOMContentLoaded', () => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
});

// API key değiştiğinde kaydet
apiKeyInput.addEventListener('change', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
    }
});

// Dosya seçildiğinde (CSV veya Excel)
csvFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

        if (isExcel) {
            // Excel dosyası - parseExcel otomatik olarak sadece ID, Title, Abstract alır
            const arrayBuffer = await file.arrayBuffer();
            csvData = parseExcel(arrayBuffer);
        } else {
            // CSV dosyası - parseCSV otomatik olarak sadece ID, Title, Abstract alır
            const text = await file.text();
            csvData = parseCSV(text);
        }

        if (csvData.length === 0) {
            showError('Dosya boş veya geçersiz!');
            analyzeBtn.disabled = true;
            return;
        }

        showSuccess(`${csvData.length} makale yüklendi. Analiz için hazır! (ID, Title, Abstract sütunları otomatik seçildi)`);
        analyzeBtn.disabled = false;
    } catch (error) {
        showError(error.message);
        analyzeBtn.disabled = true;
    }
});

// Analiz butonuna tıklandığında
analyzeBtn.addEventListener('click', async () => {
    apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        showError('Lütfen Gemini API key girin!');
        return;
    }

    if (csvData.length === 0) {
        showError('Lütfen önce bir dosya yükleyin!');
        return;
    }

    await startAnalysis();
});

// İndirme butonlarına tıklandığında
downloadCsvBtn.addEventListener('click', () => {
    downloadResultsAsCSV();
});

downloadExcelBtn.addEventListener('click', () => {
    downloadResultsAsExcel();
});

// CSV parsing fonksiyonu - sadece gerekli sütunları alır
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split('\t').map(h => h.trim());
    const data = [];

    // ID, Title, Abstract sütunlarının indekslerini bul
    const idIndex = headers.findIndex(h => h.toLowerCase() === 'id');
    const titleIndex = headers.findIndex(h => h.toLowerCase() === 'title');
    const abstractIndex = headers.findIndex(h => h.toLowerCase() === 'abstract');

    // Title ve Abstract zorunlu
    if (titleIndex === -1 || abstractIndex === -1) {
        throw new Error('CSV dosyası "Title" ve "Abstract" sütunlarını içermelidir!');
    }

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');

        // Sadece gerekli sütunları al
        const row = {
            ID: idIndex !== -1 ? (values[idIndex] ? values[idIndex].trim() : String(i)) : String(i),
            Title: values[titleIndex] ? values[titleIndex].trim() : '',
            Abstract: values[abstractIndex] ? values[abstractIndex].trim() : ''
        };

        // Boş satırları atla
        if (row.Title || row.Abstract) {
            data.push(row);
        }
    }

    return data;
}

// Excel parsing fonksiyonu - sadece gerekli sütunları alır
function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Excel'i JSON'a çevir
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) return [];

    // İlk satırdan sütun isimlerini al
    const headers = Object.keys(jsonData[0]);

    // ID, Title, Abstract sütunlarını bul (case-insensitive)
    const idKey = headers.find(h => h.toLowerCase() === 'id');
    const titleKey = headers.find(h => h.toLowerCase() === 'title');
    const abstractKey = headers.find(h => h.toLowerCase() === 'abstract');

    // Title ve Abstract zorunlu
    if (!titleKey || !abstractKey) {
        throw new Error('Excel dosyası "Title" ve "Abstract" sütunlarını içermelidir!');
    }

    // Sadece gerekli sütunları filtrele ve standart isimlere çevir
    const filteredData = jsonData.map((row, index) => ({
        ID: idKey ? String(row[idKey] || index + 1) : String(index + 1),
        Title: row[titleKey] ? String(row[titleKey]).trim() : '',
        Abstract: row[abstractKey] ? String(row[abstractKey]).trim() : ''
    })).filter(row => row.Title || row.Abstract); // Boş satırları atla

    return filteredData;
}

// Analizi başlat
async function startAnalysis() {
    // UI'ı hazırla
    analyzeBtn.disabled = true;
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    results = [];

    const batchSize = parseInt(batchSizeInput.value);
    const delayBetweenRequests = parseFloat(delayBetweenRequestsInput.value);
    const delaySeconds = parseInt(delayInput.value);
    const instructions = instructionsInput.value;

    // Batch'lere böl
    const batches = [];
    for (let i = 0; i < csvData.length; i += batchSize) {
        batches.push(csvData.slice(i, i + batchSize));
    }

    let processedCount = 0;
    const totalCount = csvData.length;

    try {
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];

            progressText.textContent = `Batch ${batchIndex + 1}/${batches.length} işleniyor... (${processedCount}/${totalCount} makale)`;

            // Batch'i işle
            const batchResults = await processBatch(batch, instructions, delayBetweenRequests);
            results.push(...batchResults);

            processedCount += batch.length;
            const progressPercent = (processedCount / totalCount) * 100;
            progressBar.style.width = progressPercent + '%';

            // Son batch değilse bekle
            if (batchIndex < batches.length - 1 && delaySeconds > 0) {
                progressText.textContent = `Batch ${batchIndex + 1}/${batches.length} tamamlandı. ${delaySeconds} saniye bekleniyor...`;
                await sleep(delaySeconds * 1000);
            }
        }

        // Sonuçları göster
        displayResults();
        progressText.textContent = 'Analiz tamamlandı! ✅';

    } catch (error) {
        showError('Analiz sırasında hata oluştu: ' + error.message);
        console.error('Analysis error:', error);
    } finally {
        analyzeBtn.disabled = false;
    }
}

// Batch işleme
async function processBatch(batch, instructions, delayBetweenRequests) {
    const batchResults = [];

    for (let i = 0; i < batch.length; i++) {
        const article = batch[i];

        try {
            const result = await analyzeArticle(article, instructions);
            batchResults.push({
                id: article.ID || '',
                ...result
            });

            // Son makale değilse ve delay varsa bekle
            if (i < batch.length - 1 && delayBetweenRequests > 0) {
                await sleep(delayBetweenRequests * 1000);
            }
        } catch (error) {
            console.error('Error processing article:', article, error);
            batchResults.push({
                id: article.ID || '',
                authors: 'Hata',
                title: article.Title || '',
                year: '',
                summary_tr: 'İşlenirken hata oluştu: ' + error.message,
                decision: 'Maybe',
                rationale: 'API hatası nedeniyle değerlendirilemedi'
            });

            // Hata durumunda da bekle (rate limit olabilir)
            if (i < batch.length - 1 && delayBetweenRequests > 0) {
                await sleep(delayBetweenRequests * 1000);
            }
        }
    }

    return batchResults;
}

// Gemini API ile makale analizi
async function analyzeArticle(article, instructions) {
    const prompt = `${instructions}

---

MAKALE:
Başlık: ${article.Title}
Özet: ${article.Abstract}

Lütfen bu makaleyi değerlendir ve yanıtını JSON formatında ver.`;

    const response = await callGeminiAPI(prompt);

    // JSON yanıtını parse et
    try {
        // JSON'u yanıttan çıkar
        let jsonText = response;

        // Markdown kod bloklarını temizle
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        // JSON parse et
        const parsed = JSON.parse(jsonText);

        // Eğer results array'i varsa ilk öğeyi al
        if (parsed.results && Array.isArray(parsed.results) && parsed.results.length > 0) {
            return parsed.results[0];
        }

        // Değilse direkt objeyi kullan
        return parsed;

    } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Response was:', response);

        // JSON parse edilemezse, basit bir metin analizi yap
        return {
            authors: extractField(response, 'author') || 'Belirtilmemiş',
            title: article.Title,
            year: extractField(response, 'year') || new Date().getFullYear().toString(),
            summary_tr: extractField(response, 'summary') || 'Özet çıkarılamadı',
            decision: extractDecision(response),
            rationale: extractField(response, 'rationale') || 'Gerekçe çıkarılamadı'
        };
    }
}

// Gemini API çağrısı (retry mekanizması ile)
async function callGeminiAPI(prompt, retryCount = 0, maxRetries = 5) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();

            // 429 (Rate Limit) hatası için retry yap
            if (response.status === 429 && retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 2; // Exponential backoff: 2, 4, 8, 16, 32 saniye
                console.log(`Rate limit hit. Retrying in ${waitTime} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);

                await sleep(waitTime * 1000);
                return callGeminiAPI(prompt, retryCount + 1, maxRetries);
            }

            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('API yanıtı boş');
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        // Network hatası veya diğer hatalar için de retry
        if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
            const waitTime = Math.pow(2, retryCount) * 2;
            console.log(`Network error. Retrying in ${waitTime} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);

            await sleep(waitTime * 1000);
            return callGeminiAPI(prompt, retryCount + 1, maxRetries);
        }

        throw error;
    }
}

// Yardımcı fonksiyonlar - metin içinden alan çıkarma
function extractField(text, fieldName) {
    const patterns = {
        'author': /(?:authors?|yazar)[:\s]*["']?([^"'\n]+)["']?/i,
        'year': /(?:year|yıl)[:\s]*["']?(\d{4})["']?/i,
        'summary': /(?:summary_tr|özet)[:\s]*["']?([^"'}]+)["']?/i,
        'rationale': /(?:rationale|gerekçe)[:\s]*["']?([^"'}]+)["']?/i
    };

    const pattern = patterns[fieldName.toLowerCase()];
    if (!pattern) return null;

    const match = text.match(pattern);
    return match ? match[1].trim() : null;
}

function extractDecision(text) {
    if (/include/i.test(text) && !/exclude/i.test(text)) return 'Include';
    if (/exclude/i.test(text)) return 'Exclude';
    if (/maybe/i.test(text)) return 'Maybe';
    return 'Maybe';
}

// Sonuçları göster
function displayResults() {
    resultsSection.style.display = 'block';
    resultsBody.innerHTML = '';

    let includeCount = 0;
    let excludeCount = 0;
    let maybeCount = 0;

    results.forEach(result => {
        const row = document.createElement('tr');

        const decision = result.decision || 'Maybe';
        const decisionClass = `decision-${decision.toLowerCase()}`;

        if (decision === 'Include') includeCount++;
        else if (decision === 'Exclude') excludeCount++;
        else maybeCount++;

        row.innerHTML = `
            <td>${result.id}</td>
            <td>${result.authors || 'Belirtilmemiş'}</td>
            <td>${result.title || ''}</td>
            <td>${result.year || ''}</td>
            <td>${result.summary_tr || ''}</td>
            <td><span class="${decisionClass}">${decision}</span></td>
            <td>${result.rationale || ''}</td>
        `;

        resultsBody.appendChild(row);
    });

    // İstatistikleri güncelle
    document.getElementById('includeCount').textContent = includeCount;
    document.getElementById('excludeCount').textContent = excludeCount;
    document.getElementById('maybeCount').textContent = maybeCount;
    document.getElementById('totalCount').textContent = results.length;
}

// CSV olarak indir
function downloadResultsAsCSV() {
    const headers = ['ID', 'Yazar(lar)', 'Başlık', 'Yıl', 'Kısa Özet (TR)', 'Karar', 'Gerekçe'];
    const rows = results.map(r => [
        r.id || '',
        r.authors || 'Belirtilmemiş',
        r.title || '',
        r.year || '',
        r.summary_tr || '',
        r.decision || 'Maybe',
        r.rationale || ''
    ]);

    let csvContent = headers.join('\t') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join('\t') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `screening_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Excel olarak indir
function downloadResultsAsExcel() {
    const data = results.map(r => ({
        'ID': r.id || '',
        'Yazar(lar)': r.authors || 'Belirtilmemiş',
        'Başlık': r.title || '',
        'Yıl': r.year || '',
        'Kısa Özet (TR)': r.summary_tr || '',
        'Karar': r.decision || 'Maybe',
        'Gerekçe': r.rationale || ''
    }));

    // Yeni workbook oluştur
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Screening Results');

    // Sütun genişliklerini ayarla
    const columnWidths = [
        { wch: 10 },  // ID
        { wch: 30 },  // Yazar(lar)
        { wch: 50 },  // Başlık
        { wch: 10 },  // Yıl
        { wch: 60 },  // Kısa Özet (TR)
        { wch: 12 },  // Karar
        { wch: 60 }   // Gerekçe
    ];
    worksheet['!cols'] = columnWidths;

    // Excel dosyasını indir
    const fileName = `screening_results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// Yardımcı fonksiyonlar
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = '❌ ' + message;

    const container = document.querySelector('.upload-section');
    container.insertBefore(errorDiv, container.firstChild);

    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✅ ' + message;

    const container = document.querySelector('.upload-section');
    container.insertBefore(successDiv, container.firstChild);

    setTimeout(() => successDiv.remove(), 5000);
}
