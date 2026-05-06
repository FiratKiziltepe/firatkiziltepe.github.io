import { GoogleGenerativeAI } from '@google/generative-ai';

// Global state
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    selectedModel: localStorage.getItem('gemini_model') || 'gemini-3.1-flash-lite-preview',
    batchSize: parseInt(localStorage.getItem('batch_size')) || 10,
    rawData: [],
    enrichedData: [],
    analysisResults: [],
    stats: null,
    executiveSummary: '',
    currentPage: 1,
    itemsPerPage: 20,
    searchTerm: '',
    categoryFilter: 'all',
    themeFilter: 'all',
    sentimentFilter: 'all',
    actionableFilter: 'all',
    charts: {}
};

// Model Definitions
const AVAILABLE_MODELS = [
    {
        id: 'gemini-3.1-flash-lite-preview',
        name: 'Gemini 3.1 Flash Lite (Preview)',
        limitInfo: 'En yeni, hızlı ve düşük maliyetli model'
    }
];

const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

// Schema for structured output (HİBRİT MOD - ESNEKLİK İLE)
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
                        description: 'Bir görüş birden fazla konuya değiniyorsa, bunları ayrı topic objeleri olarak böl',
                        items: {
                            type: 'object',
                            properties: {
                                mainCategory: { 
                                    type: 'string', 
                                    description: 'Standart listeden seçilmesi önerilir. Ancak görüş listedeki hiçbir kategoriye uymuyorsa, konuyu en iyi anlatan YENİ bir Ana Kategori ismi yazılabilir.' 
                                },
                                subTheme: { 
                                    type: 'string', 
                                    description: 'Standart listeden veya duruma özel üretilmiş spesifik alt tema.' 
                                },
                                sentiment: { 
                                    type: 'string', 
                                    enum: ['Pozitif', 'Negatif', 'Nötr', 'Yapıcı Eleştiri'],
                                    description: 'Görüşün duygu durumu' 
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
    console.log('=== TEMATIK ANALIZ SISTEMI BAŞLATILIYOR ===');
    
    try {
        console.log('1. Model seçimi başlatılıyor...');
        initializeModelSelect();
        console.log('2. Model seçimi tamamlandı');
        
        console.log('3. Batch size başlatılıyor...');
        initializeBatchSize();
        console.log('4. Batch size tamamlandı');
        
        console.log('5. Event listener\'lar başlatılıyor...');
        initializeEventListeners();
        console.log('6. Event listener\'lar tamamlandı');
        
        if (state.apiKey) {
            console.log('7. Kaydedilmiş API key bulundu, yükleniyor...');
            document.getElementById('apiKeyInput').value = state.apiKey;
        } else {
            console.log('7. Kaydedilmiş API key yok');
        }
        
        console.log('=== SİSTEM BAŞARILI ŞEKİLDE BAŞLATILDI ===');
    } catch (error) {
        console.error('=== SİSTEM BAŞLATMA HATASI ===', error);
    }
});

function initializeBatchSize() {
    const batchSizeInput = document.getElementById('batchSizeInput');
    
    if (!batchSizeInput) {
        console.error('batchSizeInput element not found!');
        return;
    }
    
    // Set initial value
    batchSizeInput.value = state.batchSize;
    
    // Listen for changes
    batchSizeInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        e.target.value = value;
        state.batchSize = value;
        localStorage.setItem('batch_size', value.toString());
        console.log(`Batch size değiştirildi: ${value}`);
    });
}

function initializeModelSelect() {
    console.log('Initializing model select...');
    const modelSelect = document.getElementById('modelSelect');
    
    if (!modelSelect) {
        console.error('modelSelect element not found!');
        return;
    }

    console.log('modelSelect found, populating options...');

    // Clear existing options first
    modelSelect.innerHTML = '';

    // Populate options
    AVAILABLE_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
        console.log(`Added model: ${model.name}`);
    });

    // Set initial value
    const selectedValue = state.selectedModel || AVAILABLE_MODELS[0].id;
    modelSelect.value = selectedValue;
    console.log(`Set selected model to: ${selectedValue}`);
    
    updateLimitInfo(selectedValue);

    // Listen for changes
    modelSelect.addEventListener('change', (e) => {
        console.log(`Model changed to: ${e.target.value}`);
        state.selectedModel = e.target.value;
        localStorage.setItem('gemini_model', e.target.value);
        updateLimitInfo(e.target.value);
    });
    
    console.log('Model select initialization complete');
}

function updateLimitInfo(modelId) {
    console.log(`Updating limit info for model: ${modelId}`);
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    const limitInfoEl = document.getElementById('modelLimitInfo');
    
    if (!limitInfoEl) {
        console.error('modelLimitInfo element not found!');
        return;
    }
    
    if (model) {
        limitInfoEl.textContent = `Limitler: ${model.limitInfo}`;
        console.log(`Limit info updated: ${model.limitInfo}`);
    } else {
        console.error(`Model not found: ${modelId}`);
        limitInfoEl.textContent = 'Model bilgisi bulunamadı';
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
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const themeFilter = document.getElementById('themeFilter');
    const sentimentFilter = document.getElementById('sentimentFilter');
    const actionableFilter = document.getElementById('actionableFilter');
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
    exportPdfBtn.addEventListener('click', exportToPDF);

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
    themeFilter.addEventListener('change', () => {
        state.themeFilter = themeFilter.value;
        state.currentPage = 1;
        renderTable();
    });
    sentimentFilter.addEventListener('change', () => {
        state.sentimentFilter = sentimentFilter.value;
        state.currentPage = 1;
        renderTable();
    });
    actionableFilter.addEventListener('change', () => {
        state.actionableFilter = actionableFilter.value;
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

        const totalBatches = Math.ceil(state.rawData.length / state.batchSize);

        for (let i = 0; i < state.rawData.length; i += state.batchSize) {
            const batch = state.rawData.slice(i, i + state.batchSize);
            const currentBatch = Math.floor(i / state.batchSize) + 1;

            console.log(`Processing batch ${currentBatch}/${totalBatches}`);
            updateProgress(i + batch.length, state.rawData.length);

            const batchResult = await analyzeBatch(genAI, batch);
            state.analysisResults.push(...batchResult.items);

            if (i + state.batchSize < state.rawData.length) {
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

    const systemInstruction = `
Sen Milli Eğitim Bakanlığı (MEB) ders materyallerini, müfredatını ve sahadaki uygulamaları analiz eden kıdemli bir eğitim veri bilimcisisin.
Görevin, öğretmenlerden gelen serbest metinli görüşleri analiz ederek etiketlemektir.

TEMEL KURALLAR:

1. **ÇOKLU ETİKETLEME (1-3 TOPIC):**
   - Her görüş için **EN AZ 1, EN FAZLA 3** topic objesi döndür
   - Sadece görüş **açıkça farklı konulara değiniyorsa** birden fazla topic oluştur
   - Aynı kategori-alt tema çiftini tekrar etme
   - Kısa/tek konulu görüşler için 1 topic yeterli
   - Uzun/çok yönlü görüşler için 2-3 topic kullan

2. **ÖNCELİK STANDART LİSTE:** 
   - Analiz yaparken *öncelikle* aşağıda verilen standart "Ana Kategori" ve "Alt Tema" listesini kullan

3. **ESNEKLİK VE YENİ KATEGORİ:** 
   - Eğer görüş, standart listedeki **hiçbir kategoriye uymuyorsa**, **YENİ BİR ANA KATEGORİ veya ALT TEMA İSMİ ÜRET**

4. **İSİMLENDİRME KURALI:** 
   - Yeni kategori üreteceksen, mevcutlar gibi kısa, öz ve kurumsal bir dil kullan (Örn: "Yapay Zeka Kullanımı", "Veli İletişimi")
   - Asla cümle kurma

5. **BAĞLAM:** 
   - Ders ve sınıf bilgisini kullanarak yorumu doğru kategorize et

6. **AYRIŞTIRMA ÖRNEKLERİ:**
   - "Etkinlikler zor VE sınıf kalabalık" → 2 topic (Etkinlikler + Fiziki Koşullar)
   - "Kitap güzel ama kılavuz eksik" → 2 topic (İçerik + Öğretmen Kılavuzu)
   - "Etkinlikler zor" → 1 topic (sadece Etkinlikler)
   - "Kazanımlar fazla, soyut ve sıralama yanlış" → 3 topic (3 farklı Müfredat sorunu)

---

## 📌 STANDART REFERANS LİSTESİ (Öncelikli Kullanılacaklar)

🟥 **1) İçerik ve Müfredat**
   - Kazanım uyumsuzluğu / eksikliği / fazlalığı
   - Seviyeye uygun olmaması (Ağır/Kolay)
   - Soyut kavramların fazlalığı / Somutlaştırma eksik
   - Konu sırasının yanlış olması / Bağlantı eksikliği
   - Metinlerin çok uzun/kısa olması
   - Metin seçiminde ideolojik/dil eleştirisi
   - Hassas/yanlı içerik / Bilimsel hata
   - Güncel değil / Hayatla ilişkilendirme zayıf

🟦 **2) Etkinlikler ve Öğrenme Süreçleri**
   - Etkinlik sayısının azlığı / çeşitliliği
   - Yönerge karmaşası / Uygulaması zor
   - Ölçme yerine yalnızca etkinlik
   - İşbirlikli öğrenme / Deney eksikliği
   - Üst düzey düşünme eksik
   - Süre yetersizliği
   - Öğrenci aktifliği düşük / Pasif öğrenme

🟨 **3) Ölçme ve Değerlendirme**
   - Soruların çok zor / kolay olması
   - Soru yönergesi anlaşılmıyor / Yetersiz soru sayısı
   - Üst düzey düşünme içermemesi
   - Tablo/rubrik kullanımı anlaşılmaz
   - Karekod sınav materyali çalışmıyor
   - Sınav sonrası geri bildirim eksik
   - Ölçme ile kazanım eşleşmiyor

🟩 **4) Görsel Tasarım ve Sayfa Düzeni**
   - Sayfa düzeni sıkışık / Renk uyumsuzluğu
   - Görseller çok küçük / kalitesiz / pedagojik değil
   - Yazı fontunun okunabilir olmaması
   - Metin–görsel oranı dengesiz
   - Sayfa numarası/dizin sorunları

🟪 **5) Öğretmen ve Öğrenci İhtiyaçları**
   - Öğretmen kılavuz kitabı eksik
   - Öğretmene zaman tüketici yük
   - Ek materyal ihtiyacı
   - Öğrenci zorlanıyor / Veli açıklaması eksik
   - Özel gereksinimli öğrenci uyarlaması yok

🟫 **6) Fiziki ve Teknik Koşullar**
   - Laboratuvar/malzeme eksikliği
   - Dijital araç yok / QR sorunları
   - Sınıf mevcudu fazla / Okul donanımı yetersiz
   - EBA/uygulama teknik sorunları

⚫ **7) Diğer (Referans)**
   - Dil kullanımında ideolojik vurgu / Kültürel hassasiyet
   - Telif sorunu / Gizlilik endişesi
   - Teşekkür / Genel Memnuniyet
`;

    const fewShotExamples = `
ÖRNEK ANALİZLER (REFERANS AL):

ÖRNEK 1 - TEK TOPIC (Kısa, tek konulu görüş):
GİRDİ: "Etkinliklerdeki yönergeler o kadar karışık ki çocuklar ne yapacağını anlamıyor."
ÇIKTI:
{
  "items": [{
    "entryId": "ex1",
    "topics": [
      { "mainCategory": "Etkinlikler ve Öğrenme Süreçleri", "subTheme": "Yönerge karmaşası", "sentiment": "Negatif" }
    ],
    "actionable": true
  }]
}

ÖRNEK 2 - İKİ TOPIC (İki farklı konu):
GİRDİ: "Kitaptaki örnekler çok güzel ama sınıfta materyal yok, etkinlikleri uygulayamıyoruz."
ÇIKTI:
{
  "items": [{
    "entryId": "ex2",
    "topics": [
      { "mainCategory": "İçerik ve Müfredat", "subTheme": "Örnekler kaliteli", "sentiment": "Pozitif" },
      { "mainCategory": "Fiziki ve Teknik Koşullar", "subTheme": "Materyal eksikliği", "sentiment": "Negatif" }
    ],
    "actionable": true
  }]
}

ÖRNEK 3 - ÜÇ TOPIC (Üç farklı sorun):
GİRDİ: "Kazanımlar çok fazla, konular soyut ve anlaşılmıyor, bir de sıralama yanlış yapılmış."
ÇIKTI:
{
  "items": [{
    "entryId": "ex3",
    "topics": [
      { "mainCategory": "İçerik ve Müfredat", "subTheme": "Kazanım fazlalığı", "sentiment": "Negatif" },
      { "mainCategory": "İçerik ve Müfredat", "subTheme": "Soyut kavramların fazlalığı", "sentiment": "Negatif" },
      { "mainCategory": "İçerik ve Müfredat", "subTheme": "Konu sırası yanlış", "sentiment": "Negatif" }
    ],
    "actionable": true
  }]
}

ÖRNEK 4 - YENİ KATEGORİ (Standart listede yok):
GİRDİ: "Yapay zeka ve kodlama ile ilgili hiçbir içerik yok, 21. yüzyıl becerileri eksik."
ÇIKTI:
{
  "items": [{
    "entryId": "ex4",
    "topics": [
      { "mainCategory": "Teknoloji ve Gelecek Becerileri", "subTheme": "Yapay zeka içeriği eksikliği", "sentiment": "Yapıcı Eleştiri" }
    ],
    "actionable": true
  }]
}
`;

    const prompt = `
${systemInstruction}

${fewShotExamples}

---

GÖREV:
Aşağıdaki ${rows.length} öğretmen görüşünü analiz et.

Her görüş için:
1. Görüşte tartışılan **EN FAZLA 3 FARKLI YÖNÜ** belirle
2. Her yön için:
   - Standart listeden EN UYGUN **Ana Kategori** ve **Alt Tema** seç
   - Uygun yoksa YENİ bir alt tema oluştur
   - O yön için **Sentiment** belirle (Pozitif, Negatif, Nötr, Yapıcı Eleştiri)
   - O yön **Aksiyon Gerektiriyor mu?** belirle

ÖNEMLİ:
- **EN AZ 1, EN FAZLA 3** topic döndür
- Sadece görüş **açıkça farklı konulara** değiniyorsa birden fazla topic oluştur
- Aynı kategori-alt tema çiftini TEKRAR ETME
- Kısa görüşler için 1 topic yeterli

VERİLER:
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
    // Flatten all topics for counting
    const allTopics = analysisResults.flatMap(item => item.topics || []);
    
    const categoryCounts = allTopics.reduce((acc, topic) => {
        acc[topic.mainCategory] = (acc[topic.mainCategory] || 0) + 1;
        return acc;
    }, {});

    const sentimentCounts = allTopics.reduce((acc, topic) => {
        acc[topic.sentiment] = (acc[topic.sentiment] || 0) + 1;
        return acc;
    }, {});

    const actionableCount = analysisResults.filter(i => i.actionable).length;
    
    const subThemeCounts = {};
    allTopics.forEach(topic => {
        const key = `${topic.mainCategory}: ${topic.subTheme}`;
        subThemeCounts[key] = (subThemeCounts[key] || 0) + 1;
    });
    
    const topThemes = Object.entries(subThemeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([theme, count]) => `${theme} (${count} adet)`)
        .join('; ');

    const prompt = `
Sen kıdemli bir eğitim analistisin. ${analysisResults.length} adet öğretmen görüşünün analiz sonuçlarını inceledin.

Aşağıdaki istatistiklere dayanarak, Milli Eğitim Bakanlığı yetkilileri için üst düzey bir yönetici özeti (Executive Summary) yaz.
Not: Listede olmayan "Yeni Kategoriler" türetilmiş olabilir, bunları da analize dahil et.

İstatistikler:
- Toplam Görüş: ${analysisResults.length}
- Kategori Dağılımı: ${JSON.stringify(categoryCounts, null, 2)}
- Duygu Dağılımı: ${JSON.stringify(sentimentCounts, null, 2)}
- Eyleme Dönüştürülebilir: ${actionableCount} (${((actionableCount / analysisResults.length) * 100).toFixed(1)}%)

Öne Çıkan Konular (Top 30):
${topThemes}

Başlıklar:
1. Genel Durum Değerlendirmesi
2. Kritik Sorun Alanları ve Yeni Beliren Temalar
3. İyileştirme Önerileri
4. Öncelikli Aksiyon Maddeleri

Türkçe ve resmi bir dil kullan. Markdown formatında yaz.
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

function enrichDataWithAnalysis(rawData, analysisResults) {
    const analysisMap = new Map();
    analysisResults.forEach(result => {
        analysisMap.set(result.entryId, result);
    });

    return rawData.map(row => {
        const analysis = analysisMap.get(row['Entry Id']);
        // topics array'den ilk topic'i al (birden fazla topic varsa ilkini kullan)
        const firstTopic = analysis?.topics && analysis.topics.length > 0 ? analysis.topics[0] : null;
        
        return {
            ...row,
            mainCategory: firstTopic?.mainCategory || 'İşlenmedi',
            subTheme: firstTopic?.subTheme || 'İşlenmedi',
            sentiment: firstTopic?.sentiment || 'Nötr',
            actionable: analysis?.actionable || false,
            allTopics: analysis?.topics || [] // Tüm topics'leri de sakla
        };
    });
}

function calculateStats(analysisResults) {
    const categoryCounts = {};
    const themeCounts = {};
    const sentimentCounts = {};
    let actionableCount = 0;

    analysisResults.forEach(result => {
        // Her result'ın topics array'ini işle
        if (result.topics && Array.isArray(result.topics)) {
            result.topics.forEach(topic => {
                categoryCounts[topic.mainCategory] = (categoryCounts[topic.mainCategory] || 0) + 1;
                themeCounts[topic.subTheme] = (themeCounts[topic.subTheme] || 0) + 1;
                sentimentCounts[topic.sentiment] = (sentimentCounts[topic.sentiment] || 0) + 1;
            });
        }
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

    // Populate category filter - SADECE İÇERİK OLAN KATEGORİLER
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    
    // Kategorileri sayılarıyla birlikte göster ve sırala
    Object.entries(state.stats.categoryCounts)
        .filter(([cat, count]) => count > 0 && cat !== 'İşlenmedi') // Boş ve işlenmemiş olanları filtrele
        .sort((a, b) => b[1] - a[1]) // Sayıya göre sırala (çoktan aza)
        .forEach(([cat, count]) => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `${cat} (${count})`;
            categoryFilter.appendChild(option);
        });

    // Populate theme filter - SADECE İÇERİK OLAN TEMALAR
    const themeFilter = document.getElementById('themeFilter');
    themeFilter.innerHTML = '<option value="all">Tüm Alt Temalar</option>';
    
    // Alt temaları sayılarıyla birlikte göster ve sırala
    Object.entries(state.stats.themeCounts)
        .filter(([theme, count]) => count > 0 && theme !== 'İşlenmedi') // Boş ve işlenmemiş olanları filtrele
        .sort((a, b) => b[1] - a[1]) // Sayıya göre sırala (çoktan aza)
        .forEach(([theme, count]) => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = `${theme} (${count})`;
            themeFilter.appendChild(option);
        });

    // Render table
    renderTable();
}

function createCharts() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

    // Category Chart (Horizontal Bar)
    const categoryData = Object.entries(state.stats.categoryCounts)
        .sort((a, b) => b[1] - a[1]);
    state.charts.category = new Chart(document.getElementById('categoryChart'), {
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
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
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
            labels: themeData.map(([name]) => name),
            datasets: [{
                label: 'Görüş Sayısı',
                data: themeData.map(([, value]) => value),
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.2,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.x + ' görüş';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        font: {
                            size: 11
                        }
                    }
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
            maintainAspectRatio: true,
            aspectRatio: 1.5,
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
            maintainAspectRatio: true,
            aspectRatio: 1.5,
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
        const matchesTheme = state.themeFilter === 'all' || row.subTheme === state.themeFilter;
        const matchesSentiment = state.sentimentFilter === 'all' || row.sentiment === state.sentimentFilter;
        const matchesActionable = state.actionableFilter === 'all' || 
            (state.actionableFilter === 'true' && row.actionable === true) ||
            (state.actionableFilter === 'false' && row.actionable === false);
        return matchesSearch && matchesCategory && matchesTheme && matchesSentiment && matchesActionable;
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
            <td class="px-4 py-4 text-sm text-gray-900" style="width: 100px;">${escapeHtml(row['Entry Id'])}</td>
            <td class="px-4 py-4 text-sm text-gray-600" style="width: 150px;">${escapeHtml(row['DERS'])} / ${escapeHtml(row['SINIF'])}</td>
            <td class="px-4 py-4 text-sm text-gray-600" style="width: 400px; word-wrap: break-word; white-space: normal;">${escapeHtml(row['Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.'] || '-')}</td>
            <td class="px-4 py-4 text-sm" style="width: 150px;"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs inline-block">${escapeHtml(row.mainCategory)}</span></td>
            <td class="px-4 py-4 text-sm text-gray-600" style="width: 200px; word-wrap: break-word; white-space: normal;">${escapeHtml(row.subTheme)}</td>
            <td class="px-4 py-4 text-sm" style="width: 100px;"><span class="px-2 py-1 rounded-full text-xs inline-block ${getSentimentColor(row.sentiment)}">${escapeHtml(row.sentiment)}</span></td>
            <td class="px-4 py-4 text-sm text-center" style="width: 80px;">${row.actionable ? '<span class="text-green-600 text-lg">✓</span>' : '<span class="text-gray-400">-</span>'}</td>
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

async function exportToPDF() {
    try {
        // Show loading message
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const originalText = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = '<span class="animate-pulse">PDF Oluşturuluyor...</span>';
        exportPdfBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 20;

        // Helper function to add new page if needed
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
        pdf.setTextColor(31, 41, 55); // gray-800
        pdf.text('Tematik Analiz Raporu', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text('Gemini AI ile Güçlendirilmiş Öğretmen Görüş Analizi', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        pdf.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Stats Overview
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Genel İstatistikler', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        const stats = [
            `Toplam Görüş: ${state.stats.totalRows}`,
            `Ana Kategori Sayısı: ${Object.keys(state.stats.categoryCounts).length}`,
            `Alt Tema Sayısı: ${Object.keys(state.stats.themeCounts).length}`,
            `Eyleme Dönüştürülebilir: ${Math.round((state.stats.actionableCount / state.stats.totalRows) * 100)}%`
        ];

        stats.forEach(stat => {
            pdf.text(stat, 20, yPosition);
            yPosition += 6;
        });
        yPosition += 10;

        // Charts - Convert to images
        checkPageBreak(80);
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Grafikler', 15, yPosition);
        yPosition += 10;

        // Category Chart
        const categoryCanvas = document.getElementById('categoryChart');
        if (categoryCanvas) {
            const categoryImg = categoryCanvas.toDataURL('image/png');
            pdf.addImage(categoryImg, 'PNG', 15, yPosition, 90, 60);
        }

        // Sentiment Chart
        const sentimentCanvas = document.getElementById('sentimentChart');
        if (sentimentCanvas) {
            const sentimentImg = sentimentCanvas.toDataURL('image/png');
            pdf.addImage(sentimentImg, 'PNG', 110, yPosition, 90, 60);
        }
        yPosition += 70;

        checkPageBreak(80);
        // Theme Chart
        const themeCanvas = document.getElementById('themeChart');
        if (themeCanvas) {
            const themeImg = themeCanvas.toDataURL('image/png');
            pdf.addImage(themeImg, 'PNG', 15, yPosition, 90, 60);
        }

        // Actionable Chart
        const actionableCanvas = document.getElementById('actionableChart');
        if (actionableCanvas) {
            const actionableImg = actionableCanvas.toDataURL('image/png');
            pdf.addImage(actionableImg, 'PNG', 110, yPosition, 90, 60);
        }
        yPosition += 70;

        // Category Distribution
        checkPageBreak(60);
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Kategori Dağılımı', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        const sortedCategories = Object.entries(state.stats.categoryCounts)
            .sort((a, b) => b[1] - a[1]);

        sortedCategories.forEach(([category, count]) => {
            checkPageBreak(6);
            const percentage = ((count / state.stats.totalRows) * 100).toFixed(1);
            pdf.text(`${category}: ${count} (${percentage}%)`, 20, yPosition);
            yPosition += 5;
        });
        yPosition += 10;

        // Top 10 Themes
        checkPageBreak(60);
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('En Sık Karşılaşılan 10 Alt Tema', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        const topThemes = Object.entries(state.stats.themeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        topThemes.forEach(([theme, count], index) => {
            checkPageBreak(6);
            const text = `${index + 1}. ${theme}: ${count}`;
            // Wrap text if too long
            const lines = pdf.splitTextToSize(text, pageWidth - 40);
            lines.forEach(line => {
                checkPageBreak(5);
                pdf.text(line, 20, yPosition);
                yPosition += 5;
            });
        });
        yPosition += 10;

        // Executive Summary
        checkPageBreak(40);
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Yönetici Özeti', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        
        // Convert markdown-like summary to plain text
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

        // Save PDF
        pdf.save(`tematik_analiz_raporu_${new Date().getTime()}.pdf`);

        // Reset button
        exportPdfBtn.innerHTML = originalText;
        exportPdfBtn.disabled = false;

    } catch (error) {
        console.error('PDF export error:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        exportPdfBtn.innerHTML = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg><span>PDF Rapor İndir</span>';
        exportPdfBtn.disabled = false;
    }
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
    state.themeFilter = 'all';
    state.sentimentFilter = 'all';
    state.actionableFilter = 'all';

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
