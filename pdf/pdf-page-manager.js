// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global değişkenler
let pdfDocument = null;
let pdfFile = null; // File nesnesini sakla, her kullanımda yeniden okuyacağız
let selectedPages = new Set();
let pageRotations = {}; // Sayfa dönüş açılarını sakla

// DOM elementleri
const pdfFileInput = document.getElementById('pdfFile');
const fileNameDiv = document.getElementById('fileName');
const loadingDiv = document.getElementById('loading');
const pdfControlsDiv = document.getElementById('pdfControls');
const pageGrid = document.getElementById('pageGrid');

// Event listeners
pdfFileInput.addEventListener('change', handleFileSelect);

// Dosya seçimi
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileNameDiv.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> Seçili dosya: <strong>${file.name}</strong>`;

    // Loading göster
    loadingDiv.classList.add('active');
    pdfControlsDiv.style.display = 'none';
    selectedPages.clear();
    pageRotations = {};

    try {
        // File nesnesini sakla (detached ArrayBuffer sorununu önler)
        pdfFile = file;
        const arrayBuffer = await file.arrayBuffer();

        // PDF.js ile yükle (önizleme için)
        pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // Sayfaları göster
        await renderAllPages();

        // Kontrolleri göster
        pdfControlsDiv.style.display = 'block';
        document.getElementById('pageCount').textContent = pdfDocument.numPages;

    } catch (error) {
        console.error('PDF yükleme hatası:', error);
        alert('PDF dosyası yüklenirken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Tüm sayfaları render et
async function renderAllPages() {
    pageGrid.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const pageItem = await createPageItem(pageNum);
        pageGrid.appendChild(pageItem);
    }
}

// Sayfa item'ı oluştur
async function createPageItem(pageNum) {
    const page = await pdfDocument.getPage(pageNum);

    // Viewport oluştur
    const scale = 0.5;
    const viewport = page.getViewport({ scale, rotation: pageRotations[pageNum] || 0 });

    // Canvas oluştur
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render et
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    // Container oluştur
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.dataset.pageNum = pageNum;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'page-checkbox';
    checkbox.onchange = (e) => {
        e.stopPropagation();
        togglePageSelection(pageNum);
    };

    // Döndür butonu
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'page-rotate';
    rotateBtn.innerHTML = '<i class="fas fa-redo"></i>';
    rotateBtn.onclick = (e) => {
        e.stopPropagation();
        rotatePage(pageNum);
    };

    // Sayfa numarası
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number';
    pageNumber.textContent = `Sayfa ${pageNum}`;

    // Tıklama ile seçim
    pageItem.onclick = () => togglePageSelection(pageNum);

    pageItem.appendChild(checkbox);
    pageItem.appendChild(rotateBtn);
    pageItem.appendChild(canvas);
    pageItem.appendChild(pageNumber);

    return pageItem;
}

// Sayfa seçimini değiştir
function togglePageSelection(pageNum) {
    const pageItem = document.querySelector(`[data-page-num="${pageNum}"]`);
    const checkbox = pageItem.querySelector('.page-checkbox');

    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
        pageItem.classList.remove('selected');
        checkbox.checked = false;
    } else {
        selectedPages.add(pageNum);
        pageItem.classList.add('selected');
        checkbox.checked = true;
    }

    updateSelectionInfo();
}

// Seçim bilgisini güncelle
function updateSelectionInfo() {
    const count = selectedPages.size;
    const total = pdfDocument.numPages;
    const infoText = count === 0
        ? 'Hiç sayfa seçilmedi'
        : `${count} sayfa seçildi (Toplam: ${total})`;

    document.getElementById('selectionInfo').textContent = infoText;
}

// Tümünü seç
function selectAll() {
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (!selectedPages.has(i)) {
            togglePageSelection(i);
        }
    }
}

// Seçimi temizle
function deselectAll() {
    const selected = Array.from(selectedPages);
    selected.forEach(pageNum => {
        togglePageSelection(pageNum);
    });
}

// Aralık seç
function selectRange() {
    const start = prompt('Başlangıç sayfası:', '1');
    const end = prompt('Bitiş sayfası:', pdfDocument.numPages);

    if (start && end) {
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (startNum > 0 && endNum <= pdfDocument.numPages && startNum <= endNum) {
            for (let i = startNum; i <= endNum; i++) {
                if (!selectedPages.has(i)) {
                    togglePageSelection(i);
                }
            }
        } else {
            alert('Geçersiz sayfa aralığı!');
        }
    }
}

// Tek sayfa döndür
async function rotatePage(pageNum) {
    pageRotations[pageNum] = ((pageRotations[pageNum] || 0) + 90) % 360;

    // Sayfa önizlemesini yeniden render et
    const pageItem = document.querySelector(`[data-page-num="${pageNum}"]`);
    const newPageItem = await createPageItem(pageNum);

    // Seçim durumunu koru
    if (selectedPages.has(pageNum)) {
        newPageItem.classList.add('selected');
        newPageItem.querySelector('.page-checkbox').checked = true;
    }

    pageItem.replaceWith(newPageItem);
}

// Seçili sayfaları döndür
async function rotateSelected() {
    if (selectedPages.size === 0) {
        alert('Lütfen döndürmek istediğiniz sayfaları seçin!');
        return;
    }

    loadingDiv.classList.add('active');

    try {
        for (const pageNum of selectedPages) {
            await rotatePage(pageNum);
        }
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Seçili sayfaları kaydet (extract)
async function extractPages() {
    if (selectedPages.size === 0) {
        alert('Lütfen kaydetmek istediğiniz sayfaları seçin!');
        return;
    }

    loadingDiv.classList.add('active');

    try {
        // Her seferinde File nesnesinden yeni ArrayBuffer oku (detached ArrayBuffer sorununu önler)
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdfDoc = await PDFLib.PDFDocument.create();

        // Seçili sayfaları sıraya göre kopyala
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);

        for (const pageNum of sortedPages) {
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);

            // Dönüş açısı varsa uygula
            if (pageRotations[pageNum]) {
                copiedPage.setRotation(PDFLib.degrees(pageRotations[pageNum]));
            }

            newPdfDoc.addPage(copiedPage);
        }

        const newPdfBytes = await newPdfDoc.save();
        downloadPDF(newPdfBytes, `secili_sayfalar_${sortedPages.join('-')}.pdf`);

    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Seçili sayfaları sil (kalanları kaydet)
async function deletePages() {
    if (selectedPages.size === 0) {
        alert('Lütfen silmek istediğiniz sayfaları seçin!');
        return;
    }

    const confirmDelete = confirm(
        `${selectedPages.size} sayfa silinecek ve kalan ${pdfDocument.numPages - selectedPages.size} sayfa yeni PDF olarak kaydedilecek. Onaylıyor musunuz?`
    );

    if (!confirmDelete) return;

    loadingDiv.classList.add('active');

    try {
        // Her seferinde File nesnesinden yeni ArrayBuffer oku (detached ArrayBuffer sorununu önler)
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdfDoc = await PDFLib.PDFDocument.create();

        // Seçilmeyen sayfaları kopyala
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            if (!selectedPages.has(pageNum)) {
                const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);

                // Dönüş açısı varsa uygula
                if (pageRotations[pageNum]) {
                    copiedPage.setRotation(PDFLib.degrees(pageRotations[pageNum]));
                }

                newPdfDoc.addPage(copiedPage);
            }
        }

        const newPdfBytes = await newPdfDoc.save();
        downloadPDF(newPdfBytes, 'sayfalar_silindi.pdf');

    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

// Tüm PDF'i indir (dönüşler uygulanmış halde)
async function downloadAll() {
    loadingDiv.classList.add('active');

    try {
        // Her seferinde File nesnesinden yeni ArrayBuffer oku (detached ArrayBuffer sorununu önler)
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        // Dönüş açıları varsa uygula
        if (Object.keys(pageRotations).length > 0) {
            const newPdfDoc = await PDFLib.PDFDocument.create();

            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);

                if (pageRotations[pageNum]) {
                    copiedPage.setRotation(PDFLib.degrees(pageRotations[pageNum]));
                }

                newPdfDoc.addPage(copiedPage);
            }

            const newPdfBytes = await newPdfDoc.save();
            downloadPDF(newPdfBytes, 'duzenlenmis_pdf.pdf');
        } else {
            // Hiç değişiklik yoksa orijinali indir
            const originalBytes = await pdfDoc.save();
            downloadPDF(originalBytes, 'pdf_kopyasi.pdf');
        }

    } catch (error) {
        console.error('PDF indirme hatası:', error);
        alert('PDF indirilirken bir hata oluştu: ' + error.message);
    } finally {
        loadingDiv.classList.remove('active');
    }
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
