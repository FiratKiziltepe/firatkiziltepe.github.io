// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Türkçe stop words listesi
const turkishStopWords = new Set([
    'acaba', 'ama', 'aslında', 'az', 'bazı', 'belki', 'biri', 'birkaç', 'birşey', 'biz', 'bu', 'çok', 'çünkü',
    'da', 'daha', 'de', 'defa', 'diye', 'eğer', 'en', 'gibi', 'hem', 'hep', 'hepsi', 'her', 'hiç', 'için',
    'ile', 'ise', 'kez', 'ki', 'kim', 'mı', 'mu', 'mü', 'nasıl', 'ne', 'neden', 'nerde', 'nerede', 'nereye',
    'niçin', 'niye', 'o', 'sanki', 'şey', 'siz', 'şu', 'tüm', 've', 'veya', 'ya', 'yani', 'bir', 'iki', 'üç',
    'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'ben', 'sen', 'biz', 'siz', 'onlar', 'bu', 'şu',
    'o', 'şey', 'var', 'yok', 'mi', 'mı', 'mu', 'mü', 'olan', 'olarak', 'ile', 'veya', 've', 'ama', 'fakat',
    'ancak', 'lakin', 'yahut', 'ya da', 'veyahut', 'hem', 'ya', 'ki', 'ise', 'eğer', 'şayet', 'madem',
    'çünkü', 'zira', 'nitekim', 'halbuki', 'oysa', 'ne', 'kadar', 'gibi', 'göre', 'dair', 'üzere', 'doğru',
    'karşı', 'rağmen', 'başka', 'ayrı', 'ile', 'birlikte', 'beraber', 'beri', 'dolayı', 'ötürü', 'önce',
    'sonra', 'evvel', 'dahi', 'keza', 'bile', 'sadece', 'yalnız'
]);

// İngilizce stop words listesi
const englishStopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could',
    'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
    'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
    'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'might', 'more', 'most', 'must', 'my', 'myself',
    'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
    'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
    'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// Tüm stop words
const allStopWords = new Set([...turkishStopWords, ...englishStopWords]);

// Global değişkenler
let pdfDocument = null;
let rawTextContent = '';
let processedTextContent = '';

// DOM elementleri
const pdfFileInput = document.getElementById('pdfFile');
const fileNameDiv = document.getElementById('fileName');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const rawTextDiv = document.getElementById('rawText');
const processedTextDiv = document.getElementById('processedText');

// Event listeners
pdfFileInput.addEventListener('change', handleFileSelect);
processBtn.addEventListener('click', processPDF);
downloadBtn.addEventListener('click', downloadText);

// Dosya seçimi
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        fileNameDiv.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> Seçili dosya: <strong>${file.name}</strong>`;
        processBtn.disabled = false;
        resultsDiv.style.display = 'none';
        downloadBtn.style.display = 'none';
    }
}

// PDF'i işle
async function processPDF() {
    const file = pdfFileInput.files[0];
    if (!file) {
        alert('Lütfen bir PDF dosyası seçin!');
        return;
    }

    // Loading göster
    loadingDiv.classList.add('active');
    resultsDiv.style.display = 'none';
    processBtn.disabled = true;

    try {
        // PDF'i yükle
        const arrayBuffer = await file.arrayBuffer();
        pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // PDF metnini çıkar
        rawTextContent = await extractTextFromPDF(pdfDocument);

        // Veri ön işleme
        processedTextContent = preprocessText(rawTextContent);

        // Sonuçları göster
        displayResults();

    } catch (error) {
        console.error('PDF işleme hatası:', error);
        alert('PDF dosyası işlenirken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
        processBtn.disabled = false;
    }
}

// PDF'den metin çıkarma
async function extractTextFromPDF(pdf) {
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Metni paragraf yapısını koruyarak birleştir
        let pageText = '';
        let lastY = null;
        let currentLine = '';

        textContent.items.forEach((item, index) => {
            const text = item.str;
            const y = item.transform[5];

            // Yeni satır kontrolü (y koordinatı değişimi)
            if (lastY !== null && Math.abs(y - lastY) > 5) {
                if (currentLine.trim()) {
                    pageText += currentLine.trim() + '\n';
                    currentLine = '';
                }
            }

            currentLine += text + ' ';
            lastY = y;
        });

        // Son satırı ekle
        if (currentLine.trim()) {
            pageText += currentLine.trim() + '\n';
        }

        fullText += pageText + '\n';
    }

    // Paragrafları temizle - ardışık satırları birleştir
    const lines = fullText.split('\n');
    let cleanedText = '';
    let currentParagraph = '';

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            // Cümle sonu kontrolü
            if (currentParagraph && (
                currentParagraph.endsWith('.') ||
                currentParagraph.endsWith('!') ||
                currentParagraph.endsWith('?') ||
                currentParagraph.endsWith(':')
            )) {
                cleanedText += currentParagraph + '\n\n';
                currentParagraph = trimmedLine;
            } else {
                currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
            }
        }
    });

    if (currentParagraph) {
        cleanedText += currentParagraph + '\n';
    }

    return cleanedText;
}

// Veri ön işleme
function preprocessText(text) {
    let processed = text;

    // Küçük harfe dönüştür
    if (document.getElementById('toLowerCase').checked) {
        processed = processed.toLowerCase();
    }

    // Noktalama işaretlerini kaldır
    if (document.getElementById('removePunctuation').checked) {
        processed = processed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        processed = processed.replace(/\s{2,}/g, ' ');
    }

    // Sayıları kaldır
    if (document.getElementById('removeNumbers').checked) {
        processed = processed.replace(/\d+/g, '');
    }

    // Stop words temizle
    if (document.getElementById('removeStopWords').checked) {
        const words = processed.split(/\s+/);
        const filteredWords = words.filter(word => {
            const cleanWord = word.trim().toLowerCase();
            return cleanWord.length > 0 && !allStopWords.has(cleanWord);
        });
        processed = filteredWords.join(' ');
    }

    // Fazla boşlukları temizle
    if (document.getElementById('removeExtraSpaces').checked) {
        processed = processed.replace(/\s+/g, ' ').trim();
        // Paragraf yapısını koru
        processed = processed.replace(/\n\s+/g, '\n');
    }

    return processed;
}

// Sonuçları göster
function displayResults() {
    // İstatistikleri hesapla
    const pageCount = pdfDocument.numPages;
    const wordCount = rawTextContent.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = rawTextContent.length;
    const paragraphCount = rawTextContent.split(/\n\n+/).filter(p => p.trim().length > 0).length;

    // İstatistikleri güncelle
    document.getElementById('pageCount').textContent = pageCount;
    document.getElementById('wordCount').textContent = wordCount.toLocaleString();
    document.getElementById('charCount').textContent = charCount.toLocaleString();
    document.getElementById('paragraphCount').textContent = paragraphCount;

    // Metinleri göster
    rawTextDiv.textContent = rawTextContent;
    processedTextDiv.textContent = processedTextContent;

    // Sonuçları göster
    resultsDiv.style.display = 'block';
    downloadBtn.style.display = 'inline-block';
}

// Metni indir
function downloadText() {
    const textToDownload = processedTextContent || rawTextContent;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
