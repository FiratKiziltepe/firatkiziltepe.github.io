// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global değişkenler
let pdfFiles = [];

// DOM elementleri
const pdfFilesInput = document.getElementById('pdfFiles');
const dropZone = document.getElementById('dropZone');
const pdfListSection = document.getElementById('pdfListSection');
const pdfList = document.getElementById('pdfList');
const loadingDiv = document.getElementById('loading');

// Event listeners
pdfFilesInput.addEventListener('change', handleFilesSelect);

// Drag & Drop event listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
        addFiles(files);
    } else {
        alert('Lütfen sadece PDF dosyaları sürükleyin!');
    }
});

// Dosya seçimi
function handleFilesSelect(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
    // Input'u temizle (aynı dosya tekrar eklenebilsin)
    event.target.value = '';
}

// Dosyaları ekle
async function addFiles(files) {
    loadingDiv.classList.add('active');

    for (const file of files) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            pdfFiles.push({
                id: Date.now() + Math.random(),
                name: file.name,
                file: file,
                bytes: arrayBuffer,
                pageCount: pdfDoc.numPages,
                size: file.size
            });
        } catch (error) {
            console.error(`${file.name} yüklenemedi:`, error);
            alert(`${file.name} dosyası yüklenemedi!`);
        }
    }

    loadingDiv.classList.remove('active');
    updatePdfList();
}

// PDF listesini güncelle
function updatePdfList() {
    if (pdfFiles.length === 0) {
        pdfListSection.style.display = 'none';
        return;
    }

    pdfListSection.style.display = 'block';
    pdfList.innerHTML = '';

    // İstatistikleri güncelle
    const totalPages = pdfFiles.reduce((sum, pdf) => sum + pdf.pageCount, 0);
    const totalSize = pdfFiles.reduce((sum, pdf) => sum + pdf.size, 0);

    document.getElementById('fileCount').textContent = pdfFiles.length;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('totalSize').textContent = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';

    // PDF listesini oluştur
    pdfFiles.forEach((pdf, index) => {
        const pdfItem = createPdfItem(pdf, index);
        pdfList.appendChild(pdfItem);
    });
}

// PDF item oluştur
function createPdfItem(pdf, index) {
    const item = document.createElement('div');
    item.className = 'pdf-item';

    item.innerHTML = `
        <div class="order-badge">${index + 1}</div>
        <div class="pdf-info">
            <i class="fas fa-file-pdf pdf-icon"></i>
            <div class="pdf-details">
                <div class="pdf-name">${pdf.name}</div>
                <div class="pdf-meta">
                    ${pdf.pageCount} sayfa • ${(pdf.size / 1024).toFixed(2)} KB
                </div>
            </div>
        </div>
        <div class="pdf-controls">
            <button class="btn btn-small" onclick="movePdf(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                <i class="fas fa-arrow-up"></i>
            </button>
            <button class="btn btn-small" onclick="movePdf(${index}, 1)" ${index === pdfFiles.length - 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-down"></i>
            </button>
            <button class="btn btn-small" style="background: #dc3545;" onclick="removePdf(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return item;
}

// PDF sırasını değiştir
function movePdf(index, direction) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= pdfFiles.length) return;

    // Swap
    [pdfFiles[index], pdfFiles[newIndex]] = [pdfFiles[newIndex], pdfFiles[index]];

    updatePdfList();
}

// PDF çıkar
function removePdf(index) {
    pdfFiles.splice(index, 1);
    updatePdfList();
}

// Tümünü temizle
function clearAll() {
    if (pdfFiles.length === 0) return;

    const confirm = window.confirm('Tüm PDF\'ler listeden çıkarılacak. Emin misiniz?');
    if (confirm) {
        pdfFiles = [];
        updatePdfList();
    }
}

// PDF'leri birleştir
async function mergePDFs() {
    if (pdfFiles.length < 2) {
        alert('En az 2 PDF dosyası eklemelisiniz!');
        return;
    }

    loadingDiv.classList.add('active');

    try {
        // Yeni PDF oluştur
        const mergedPdf = await PDFLib.PDFDocument.create();

        // Her PDF'i sırayla ekle
        for (const pdf of pdfFiles) {
            const pdfDoc = await PDFLib.PDFDocument.load(pdf.bytes);
            const pageIndices = pdfDoc.getPageIndices();

            // Tüm sayfaları kopyala
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);

            copiedPages.forEach(page => {
                mergedPdf.addPage(page);
            });
        }

        // PDF'i kaydet
        const mergedPdfBytes = await mergedPdf.save();

        // İndir
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `birlesmis_pdf_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`✅ ${pdfFiles.length} PDF dosyası başarıyla birleştirildi!`);

    } catch (error) {
        console.error('PDF birleştirme hatası:', error);
        alert('PDF\'ler birleştirilirken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}
