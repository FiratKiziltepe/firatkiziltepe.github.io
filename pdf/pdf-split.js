// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global değişkenler
let pdfDocument = null;
let pdfBytes = null;
let selectedMethod = null;
let rangeCounter = 0;

// DOM elementleri
const pdfFileInput = document.getElementById('pdfFile');
const fileNameDiv = document.getElementById('fileName');
const pdfInfoDiv = document.getElementById('pdfInfo');
const splitOptionsDiv = document.getElementById('splitOptions');
const loadingDiv = document.getElementById('loading');
const splitBtn = document.getElementById('splitBtn');
const resultsDiv = document.getElementById('results');

// Event listeners
pdfFileInput.addEventListener('change', handleFileSelect);
document.getElementById('pageInterval')?.addEventListener('input', updateIntervalPreview);
document.getElementById('customPages')?.addEventListener('input', updateCustomPreview);

// Dosya seçimi
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileNameDiv.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> Seçili dosya: <strong>${file.name}</strong>`;

    loadingDiv.classList.add('active');
    splitOptionsDiv.style.display = 'none';
    resultsDiv.style.display = 'none';

    try {
        pdfBytes = await file.arrayBuffer();
        pdfDocument = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

        pdfInfoDiv.innerHTML = `📄 ${pdfDocument.numPages} sayfa`;

        // Seçenekleri göster
        splitOptionsDiv.style.display = 'block';

        // Aralık inputlarını başlat
        initRangeInputs();

    } catch (error) {
        console.error('PDF yükleme hatası:', error);
        alert('PDF dosyası yüklenirken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Seçenek seç
function selectOption(method) {
    selectedMethod = method;

    // Radio butonları güncelle
    document.querySelectorAll('.split-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('.split-config').forEach(cfg => cfg.classList.remove('active'));

    const selectedOption = document.querySelector(`.split-option:has(#${method}Radio)`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        document.getElementById(`${method}Radio`).checked = true;
    }

    // İlgili konfigürasyonu göster
    const configMap = {
        'range': 'rangeConfig',
        'interval': 'intervalConfig',
        'custom': 'customConfig'
    };

    if (configMap[method]) {
        document.getElementById(configMap[method]).classList.add('active');
    }

    // Butonu aktif et
    splitBtn.disabled = false;
}

// Aralık inputlarını başlat
function initRangeInputs() {
    const container = document.getElementById('rangeInputs');
    container.innerHTML = '';
    rangeCounter = 0;
    addRangeInput();
}

// Yeni aralık input ekle
function addRangeInput() {
    const container = document.getElementById('rangeInputs');
    const id = ++rangeCounter;

    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'input-group';
    rangeDiv.id = `range-${id}`;

    rangeDiv.innerHTML = `
        <label>Aralık ${id}</label>
        <div class="range-input">
            <input type="number" min="1" max="${pdfDocument.numPages}" placeholder="Başlangıç" id="start-${id}">
            <input type="number" min="1" max="${pdfDocument.numPages}" placeholder="Bitiş" id="end-${id}">
        </div>
        ${id > 1 ? `<button class="btn btn-small" style="background: #dc3545; margin-top: 0.5rem;" onclick="removeRangeInput(${id})">
            <i class="fas fa-trash"></i> Kaldır
        </button>` : ''}
    `;

    container.appendChild(rangeDiv);
}

// Aralık input kaldır
function removeRangeInput(id) {
    const rangeDiv = document.getElementById(`range-${id}`);
    if (rangeDiv) {
        rangeDiv.remove();
    }
}

// Interval önizlemesini güncelle
function updateIntervalPreview() {
    const interval = parseInt(document.getElementById('pageInterval').value);
    const preview = document.getElementById('intervalPreview');

    if (!interval || interval < 1) {
        preview.innerHTML = '';
        return;
    }

    const totalPages = pdfDocument.numPages;
    const pdfCount = Math.ceil(totalPages / interval);

    preview.innerHTML = `
        <strong>Önizleme:</strong><br>
        ${pdfCount} adet PDF oluşturulacak (Her biri maksimum ${interval} sayfa)
    `;
}

// Custom önizlemesini güncelle
function updateCustomPreview() {
    const input = document.getElementById('customPages').value;
    const preview = document.getElementById('customPreview');

    if (!input.trim()) {
        preview.innerHTML = '';
        return;
    }

    const pages = input.split(',').map(p => parseInt(p.trim())).filter(p => p > 0 && p <= pdfDocument.numPages);
    const sortedPages = [...new Set(pages)].sort((a, b) => a - b);

    if (sortedPages.length === 0) {
        preview.innerHTML = '<span style="color: #dc3545;">Geçersiz sayfa numaraları!</span>';
        return;
    }

    const ranges = [];
    let start = 1;

    sortedPages.forEach(page => {
        ranges.push(`Sayfa ${start}-${page - 1}`);
        start = page;
    });

    ranges.push(`Sayfa ${start}-${pdfDocument.numPages}`);

    preview.innerHTML = `
        <strong>Önizleme:</strong><br>
        ${ranges.length} adet PDF oluşturulacak:<br>
        ${ranges.map((r, i) => `${i + 1}. ${r}`).join('<br>')}
    `;
}

// PDF'i böl
async function splitPDF() {
    if (!selectedMethod) {
        alert('Lütfen bir bölme yöntemi seçin!');
        return;
    }

    loadingDiv.classList.add('active');
    resultsDiv.style.display = 'none';

    try {
        let splitCount = 0;

        switch (selectedMethod) {
            case 'single':
                splitCount = await splitIntoSinglePages();
                break;
            case 'range':
                splitCount = await splitByRanges();
                break;
            case 'interval':
                splitCount = await splitByInterval();
                break;
            case 'custom':
                splitCount = await splitByCustomPages();
                break;
        }

        // Sonuçları göster
        resultsDiv.style.display = 'block';
        document.getElementById('resultsText').innerHTML = `
            ✅ PDF başarıyla bölündü!<br>
            <strong>${splitCount}</strong> adet PDF dosyası oluşturuldu ve indirildi.
        `;

    } catch (error) {
        console.error('PDF bölme hatası:', error);
        alert('PDF bölünürken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Her sayfayı ayrı PDF olarak böl
async function splitIntoSinglePages() {
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFLib.PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `sayfa_${i + 1}.pdf`);

        // Kısa bir bekleme (tarayıcı çökmesin)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return totalPages;
}

// Aralıklara göre böl
async function splitByRanges() {
    const ranges = [];
    for (let i = 1; i <= rangeCounter; i++) {
        const startInput = document.getElementById(`start-${i}`);
        const endInput = document.getElementById(`end-${i}`);

        if (startInput && endInput) {
            const start = parseInt(startInput.value);
            const end = parseInt(endInput.value);

            if (start && end && start > 0 && end <= pdfDocument.numPages && start <= end) {
                ranges.push({ start, end });
            }
        }
    }

    if (ranges.length === 0) {
        alert('Lütfen en az bir geçerli sayfa aralığı girin!');
        throw new Error('No valid ranges');
    }

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

    for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const newPdf = await PDFLib.PDFDocument.create();

        for (let pageNum = start - 1; pageNum < end; pageNum++) {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum]);
            newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `sayfa_${start}-${end}.pdf`);

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return ranges.length;
}

// Belirli sayfa aralığında böl
async function splitByInterval() {
    const interval = parseInt(document.getElementById('pageInterval').value);

    if (!interval || interval < 1) {
        alert('Lütfen geçerli bir sayfa sayısı girin!');
        throw new Error('Invalid interval');
    }

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    let splitCount = 0;

    for (let start = 0; start < totalPages; start += interval) {
        const end = Math.min(start + interval, totalPages);
        const newPdf = await PDFLib.PDFDocument.create();

        for (let i = start; i < end; i++) {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `parca_${splitCount + 1}_sayfa_${start + 1}-${end}.pdf`);

        splitCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return splitCount;
}

// Özel sayfalara göre böl
async function splitByCustomPages() {
    const input = document.getElementById('customPages').value;

    if (!input.trim()) {
        alert('Lütfen bölme noktalarını girin!');
        throw new Error('No split points');
    }

    const pages = input.split(',').map(p => parseInt(p.trim())).filter(p => p > 0 && p <= pdfDocument.numPages);
    const splitPoints = [0, ...new Set(pages)].sort((a, b) => a - b);
    splitPoints.push(pdfDocument.numPages + 1);

    if (splitPoints.length < 2) {
        alert('Lütfen geçerli sayfa numaraları girin!');
        throw new Error('Invalid split points');
    }

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    let splitCount = 0;

    for (let i = 0; i < splitPoints.length - 1; i++) {
        const start = splitPoints[i];
        const end = splitPoints[i + 1] - 1;

        if (start >= end) continue;

        const newPdf = await PDFLib.PDFDocument.create();

        for (let pageNum = start; pageNum < end; pageNum++) {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum]);
            newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `parca_${splitCount + 1}_sayfa_${start + 1}-${end}.pdf`);

        splitCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return splitCount;
}

// PDF'i indir
function downloadPDF(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
