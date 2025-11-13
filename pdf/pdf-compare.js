// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global değişkenler
let pdf1Document = null;
let pdf2Document = null;
let pdf1Text = '';
let pdf2Text = '';

// DOM elementleri
const pdfFile1Input = document.getElementById('pdfFile1');
const pdfFile2Input = document.getElementById('pdfFile2');
const fileName1Div = document.getElementById('fileName1');
const fileName2Div = document.getElementById('fileName2');
const compareBtn = document.getElementById('compareBtn');
const exportBtn = document.getElementById('exportBtn');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');

// Event listeners
pdfFile1Input.addEventListener('change', (e) => handleFileSelect(e, 1));
pdfFile2Input.addEventListener('change', (e) => handleFileSelect(e, 2));
compareBtn.addEventListener('click', comparePDFs);
exportBtn.addEventListener('click', exportReport);

// Dosya seçimi
function handleFileSelect(event, fileNumber) {
    const file = event.target.files[0];
    const fileNameDiv = fileNumber === 1 ? fileName1Div : fileName2Div;

    if (file) {
        fileNameDiv.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> <strong>${file.name}</strong>`;

        // Her iki dosya da seçiliyse butonu aktif et
        if (pdfFile1Input.files[0] && pdfFile2Input.files[0]) {
            compareBtn.disabled = false;
        }
    }
}

// PDF'leri karşılaştır
async function comparePDFs() {
    const file1 = pdfFile1Input.files[0];
    const file2 = pdfFile2Input.files[0];

    if (!file1 || !file2) {
        alert('Lütfen iki PDF dosyası seçin!');
        return;
    }

    // Loading göster
    loadingDiv.classList.add('active');
    resultsDiv.style.display = 'none';
    compareBtn.disabled = true;

    try {
        // PDF'leri yükle ve metinleri çıkar
        const arrayBuffer1 = await file1.arrayBuffer();
        const arrayBuffer2 = await file2.arrayBuffer();

        pdf1Document = await pdfjsLib.getDocument({ data: arrayBuffer1 }).promise;
        pdf2Document = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;

        pdf1Text = await extractTextFromPDF(pdf1Document);
        pdf2Text = await extractTextFromPDF(pdf2Document);

        // Karşılaştırmayı yap
        performComparison();

    } catch (error) {
        console.error('PDF karşılaştırma hatası:', error);
        alert('PDF dosyaları karşılaştırılırken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
        compareBtn.disabled = false;
    }
}

// PDF'den metin çıkarma
async function extractTextFromPDF(pdf) {
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let pageText = '';
        textContent.items.forEach(item => {
            pageText += item.str + ' ';
        });

        fullText += pageText + '\n';
    }

    return fullText;
}

// Metni normalize et (karşılaştırma için)
function normalizeText(text) {
    let normalized = text;

    if (document.getElementById('ignoreCase').checked) {
        normalized = normalized.toLowerCase();
    }

    if (document.getElementById('ignoreWhitespace').checked) {
        normalized = normalized.replace(/\s+/g, ' ').trim();
    }

    if (document.getElementById('ignorePunctuation').checked) {
        normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    }

    return normalized;
}

// Karşılaştırma işlemi
function performComparison() {
    // Metinleri satırlara böl
    const lines1 = pdf1Text.split('\n').filter(line => line.trim());
    const lines2 = pdf2Text.split('\n').filter(line => line.trim());

    // Normalize edilmiş versiyonları
    const normalizedLines1 = lines1.map(normalizeText);
    const normalizedLines2 = lines2.map(normalizeText);

    // Diff hesapla
    const diff = computeDiff(normalizedLines1, normalizedLines2, lines1, lines2);

    // İstatistikleri hesapla
    const stats = calculateStats(diff, lines1, lines2);

    // Sonuçları göster
    displayComparisonResults(diff, stats, lines1, lines2);
}

// Basit diff algoritması (Longest Common Subsequence tabanlı)
function computeDiff(normalized1, normalized2, original1, original2) {
    const m = normalized1.length;
    const n = normalized2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // LCS hesapla
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (normalized1[i - 1] === normalized2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Diff oluştur
    const diff = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && normalized1[i - 1] === normalized2[j - 1]) {
            diff.unshift({
                type: 'equal',
                line1: original1[i - 1],
                line2: original2[j - 1],
                lineNum1: i,
                lineNum2: j
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({
                type: 'added',
                line2: original2[j - 1],
                lineNum2: j
            });
            j--;
        } else if (i > 0) {
            diff.unshift({
                type: 'removed',
                line1: original1[i - 1],
                lineNum1: i
            });
            i--;
        }
    }

    return diff;
}

// İstatistikleri hesapla
function calculateStats(diff, lines1, lines2) {
    let identical = 0;
    let different = 0;
    let added = 0;
    let removed = 0;

    diff.forEach(item => {
        if (item.type === 'equal') {
            identical++;
        } else if (item.type === 'added') {
            added++;
            different++;
        } else if (item.type === 'removed') {
            removed++;
            different++;
        }
    });

    const totalLines = Math.max(lines1.length, lines2.length);
    const similarity = totalLines > 0 ? ((identical / totalLines) * 100).toFixed(1) : 0;

    return {
        similarity,
        totalLines,
        identical,
        different,
        added,
        removed
    };
}

// Sonuçları göster
function displayComparisonResults(diff, stats, lines1, lines2) {
    // İstatistikleri güncelle
    document.getElementById('similarityScore').textContent = stats.similarity + '%';
    document.getElementById('totalLines').textContent = stats.totalLines;
    document.getElementById('differentLines').textContent = stats.different;
    document.getElementById('identicalLines').textContent = stats.identical;

    // PDF metinlerini göster
    const showLineNumbers = document.getElementById('showLineNumbers').checked;
    displayPDFText('pdf1Text', diff, 1, showLineNumbers);
    displayPDFText('pdf2Text', diff, 2, showLineNumbers);

    // Farklılıklar detayını göster
    displayDiffDetails(diff, showLineNumbers);

    // Sonuçları göster
    resultsDiv.style.display = 'block';
    exportBtn.style.display = 'inline-block';
}

// PDF metnini göster (diff ile renklendirilmiş)
function displayPDFText(elementId, diff, pdfNumber, showLineNumbers) {
    const element = document.getElementById(elementId);
    let html = '';

    diff.forEach(item => {
        const lineKey = pdfNumber === 1 ? 'line1' : 'line2';
        const lineNumKey = pdfNumber === 1 ? 'lineNum1' : 'lineNum2';
        const line = item[lineKey];

        if (line !== undefined) {
            const lineNum = showLineNumbers ? `<span style="color: #999; margin-right: 10px;">${item[lineNumKey]}:</span>` : '';

            if (item.type === 'equal') {
                html += `<div>${lineNum}${escapeHtml(line)}</div>`;
            } else if (item.type === 'added' && pdfNumber === 2) {
                html += `<div class="diff-added">${lineNum}${escapeHtml(line)}</div>`;
            } else if (item.type === 'removed' && pdfNumber === 1) {
                html += `<div class="diff-removed">${lineNum}${escapeHtml(line)}</div>`;
            }
        }
    });

    element.innerHTML = html;
}

// Farklılıklar detayını göster
function displayDiffDetails(diff, showLineNumbers) {
    const element = document.getElementById('diffDetails');
    let html = '<div style="font-family: monospace;">';

    diff.forEach(item => {
        if (item.type !== 'equal') {
            if (item.type === 'removed') {
                const lineNum = showLineNumbers ? `[Satır ${item.lineNum1}] ` : '';
                html += `<div class="diff-removed">- ${lineNum}PDF 1: ${escapeHtml(item.line1)}</div>`;
            } else if (item.type === 'added') {
                const lineNum = showLineNumbers ? `[Satır ${item.lineNum2}] ` : '';
                html += `<div class="diff-added">+ ${lineNum}PDF 2: ${escapeHtml(item.line2)}</div>`;
            }
        }
    });

    html += '</div>';
    element.innerHTML = html || '<p style="color: #666;">Hiç fark bulunamadı! PDF\'ler aynı içeriğe sahip.</p>';
}

// HTML escape
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Rapor indir
function exportReport() {
    const stats = {
        similarity: document.getElementById('similarityScore').textContent,
        totalLines: document.getElementById('totalLines').textContent,
        different: document.getElementById('differentLines').textContent,
        identical: document.getElementById('identicalLines').textContent
    };

    let report = '='.repeat(80) + '\n';
    report += 'PDF KARŞILAŞTIRMA RAPORU\n';
    report += '='.repeat(80) + '\n\n';

    report += 'İSTATİSTİKLER:\n';
    report += '-'.repeat(80) + '\n';
    report += `Benzerlik Oranı: ${stats.similarity}\n`;
    report += `Toplam Satır: ${stats.totalLines}\n`;
    report += `Aynı Satır: ${stats.identical}\n`;
    report += `Farklı Satır: ${stats.different}\n\n`;

    report += '='.repeat(80) + '\n';
    report += 'PDF 1 İÇERİĞİ:\n';
    report += '='.repeat(80) + '\n';
    report += pdf1Text + '\n\n';

    report += '='.repeat(80) + '\n';
    report += 'PDF 2 İÇERİĞİ:\n';
    report += '='.repeat(80) + '\n';
    report += pdf2Text + '\n\n';

    report += '='.repeat(80) + '\n';
    report += 'FARKLILIKLAR:\n';
    report += '='.repeat(80) + '\n';
    report += document.getElementById('diffDetails').textContent;

    // Dosyayı indir
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf_karsilastirma_raporu.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
