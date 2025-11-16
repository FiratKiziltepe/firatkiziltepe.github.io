/*
 * DRAFTABLE-STYLE PDF COMPARISON
 * Simple, Clean Implementation
 * Using: PDF.js + diff_match_patch
 */

// ==================== PDF.js Setup ====================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ==================== Global State ====================
const state = {
    pdf1: {
        file: null,
        document: null,
        currentPage: 1,
        totalPages: 0,
        text: [] // Array of {pageNum, text}
    },
    pdf2: {
        file: null,
        document: null,
        currentPage: 1,
        totalPages: 0,
        text: []
    },
    comparison: {
        diffs: [], // diff_match_patch results
        changes: [], // Processed changes with page info
        highlights: { pdf1: {}, pdf2: {} } // Page-wise highlights
    },
    settings: {
        zoomLevel: 1.0,
        syncScroll: true,
        showHighlights: true
    },
    ui: {
        currentPage: 1,
        isComparing: false
    }
};

// ==================== DOM Elements ====================
const el = {
    // Upload
    uploadBtn1: document.getElementById('uploadBtn1'),
    uploadBtn2: document.getElementById('uploadBtn2'),
    fileInput1: document.getElementById('fileInput1'),
    fileInput2: document.getElementById('fileInput2'),
    fileName1: document.getElementById('fileName1'),
    fileName2: document.getElementById('fileName2'),

    // Canvas
    canvas1: document.getElementById('canvas1'),
    canvas2: document.getElementById('canvas2'),
    leftCanvasContainer: document.getElementById('leftCanvasContainer'),
    rightCanvasContainer: document.getElementById('rightCanvasContainer'),
    textLayer1: document.getElementById('textLayer1'),
    textLayer2: document.getElementById('textLayer2'),
    highlightOverlay1: document.getElementById('highlightOverlay1'),
    highlightOverlay2: document.getElementById('highlightOverlay2'),

    // Controls
    compareBtn: document.getElementById('compareBtn'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomSelect: document.getElementById('zoomSelect'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    syncScrollBtn: document.getElementById('syncScrollBtn'),
    toggleHighlights: document.getElementById('toggleHighlights'),
    prevChange: document.getElementById('prevChange'),
    nextChange: document.getElementById('nextChange'),

    // Sidebar
    changesSidebar: document.getElementById('changesSidebar'),
    changesList: document.getElementById('changesList'),
    addedCount: document.getElementById('addedCount'),
    deletedCount: document.getElementById('deletedCount'),
    modifiedCount: document.getElementById('modifiedCount'),
    movedCount: document.getElementById('movedCount'),
    totalAdded: document.getElementById('totalAdded'),
    totalDeleted: document.getElementById('totalDeleted'),
    totalModified: document.getElementById('totalModified'),
    totalMoved: document.getElementById('totalMoved'),
    totalAddedWords: document.getElementById('totalAddedWords'),
    totalDeletedWords: document.getElementById('totalDeletedWords'),
    exportBtn: document.getElementById('exportBtn'),

    // Content panels
    leftContent: document.getElementById('leftContent'),
    rightContent: document.getElementById('rightContent'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    progressFill: document.getElementById('progressFill')
};

// ==================== Initialization ====================
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // File upload
    el.uploadBtn1.addEventListener('click', () => el.fileInput1.click());
    el.uploadBtn2.addEventListener('click', () => el.fileInput2.click());
    el.fileInput1.addEventListener('change', (e) => handleFileSelect(e, 1));
    el.fileInput2.addEventListener('change', (e) => handleFileSelect(e, 2));

    // Compare button
    el.compareBtn.addEventListener('click', startComparison);

    // Zoom controls
    el.zoomIn.addEventListener('click', () => changeZoom(0.25));
    el.zoomOut.addEventListener('click', () => changeZoom(-0.25));
    el.zoomSelect.addEventListener('change', (e) => {
        state.settings.zoomLevel = parseFloat(e.target.value);
        renderCurrentPage();
    });

    // Page navigation
    el.prevPage.addEventListener('click', () => navigatePage(-1));
    el.nextPage.addEventListener('click', () => navigatePage(1));

    // Sync scroll toggle
    el.syncScrollBtn.addEventListener('click', toggleSyncScroll);

    // Highlights toggle
    el.toggleHighlights.addEventListener('click', toggleHighlights);

    // Change navigation
    el.prevChange.addEventListener('click', () => navigateChange(-1));
    el.nextChange.addEventListener('click', () => navigateChange(1));

    // Export
    el.exportBtn.addEventListener('click', exportReport);

    // Synchronized scrolling
    el.leftContent.addEventListener('scroll', () => {
        if (state.settings.syncScroll) {
            el.rightContent.scrollTop = el.leftContent.scrollTop;
            el.rightContent.scrollLeft = el.leftContent.scrollLeft;
        }
    });

    el.rightContent.addEventListener('scroll', () => {
        if (state.settings.syncScroll) {
            el.leftContent.scrollTop = el.rightContent.scrollTop;
            el.leftContent.scrollLeft = el.rightContent.scrollLeft;
        }
    });
}

// ==================== File Upload ====================
async function handleFileSelect(event, pdfNum) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('Lütfen geçerli bir PDF dosyası seçin!');
        return;
    }

    showLoading(true, `PDF ${pdfNum} yükleniyor...`);

    try {
        const pdf = pdfNum === 1 ? state.pdf1 : state.pdf2;
        pdf.file = file;

        const arrayBuffer = await file.arrayBuffer();
        pdf.document = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdf.totalPages = pdf.document.numPages;
        pdf.currentPage = 1;

        // Update UI
        const fileName = pdfNum === 1 ? el.fileName1 : el.fileName2;
        fileName.textContent = `${file.name} (${pdf.totalPages} sayfa)`;

        // Hide welcome, show canvas
        const container = pdfNum === 1 ? el.leftCanvasContainer : el.rightCanvasContainer;
        container.style.display = 'block';
        container.previousElementSibling.style.display = 'none'; // Hide welcome message

        // Render first page
        await renderPage(pdfNum, 1);

        // Show compare button if both PDFs loaded
        if (state.pdf1.document && state.pdf2.document) {
            el.compareBtn.style.display = 'flex';
        }

    } catch (error) {
        console.error(`PDF ${pdfNum} yükleme hatası:`, error);
        alert(`PDF ${pdfNum} yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// ==================== PDF Rendering ====================
async function renderPage(pdfNum, pageNum) {
    const pdf = pdfNum === 1 ? state.pdf1 : state.pdf2;
    const canvas = pdfNum === 1 ? el.canvas1 : el.canvas2;

    if (!pdf.document || pageNum < 1 || pageNum > pdf.totalPages) return;

    try {
        const page = await pdf.document.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.settings.zoomLevel });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };

        await page.render(renderContext).promise;

        pdf.currentPage = pageNum;

        // Render text layer for selection
        await renderTextLayer(pdfNum, page, viewport);

        // Render highlights if comparison done
        if (state.comparison.changes.length > 0) {
            renderHighlights(pdfNum, pageNum);
        }

        updatePageInfo();

    } catch (error) {
        console.error(`Sayfa ${pageNum} render hatası:`, error);
    }
}

async function renderTextLayer(pdfNum, page, viewport) {
    const textLayer = pdfNum === 1 ? el.textLayer1 : el.textLayer2;

    // Clear existing
    textLayer.innerHTML = '';
    textLayer.style.width = viewport.width + 'px';
    textLayer.style.height = viewport.height + 'px';

    try {
        const textContent = await page.getTextContent();

        textContent.items.forEach(item => {
            if (!item.str || item.str.trim() === '') return;

            const tx = item.transform;
            const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

            const span = document.createElement('span');
            span.textContent = item.str;
            span.style.left = tx[4] + 'px';
            span.style.top = (tx[5] - fontHeight) + 'px';
            span.style.fontSize = fontHeight + 'px';
            span.style.fontFamily = item.fontName;

            // Store text for matching
            span.dataset.text = item.str;
            span.dataset.x = tx[4];
            span.dataset.y = tx[5];

            textLayer.appendChild(span);
        });

    } catch (error) {
        console.error('Text layer error:', error);
    }
}

async function renderCurrentPage() {
    const pageNum = state.ui.currentPage;

    if (pageNum <= state.pdf1.totalPages) {
        await renderPage(1, pageNum);
    }
    if (pageNum <= state.pdf2.totalPages) {
        await renderPage(2, pageNum);
    }
}

// ==================== Text Extraction ====================
async function extractAllText(pdf) {
    const allText = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        let pageText = '';
        textContent.items.forEach(item => {
            if (item.str) {
                pageText += item.str + ' ';
            }
        });

        allText.push({
            pageNum: pageNum,
            text: pageText.trim()
        });
    }

    return allText;
}

// ==================== Comparison (diff_match_patch) ====================
async function startComparison() {
    if (!state.pdf1.document || !state.pdf2.document) {
        alert('Lütfen iki PDF dosyası yükleyin!');
        return;
    }

    showLoading(true, 'PDF\'ler karşılaştırılıyor...');
    state.ui.isComparing = true;

    try {
        // Extract text from both PDFs
        updateProgress(20);
        el.loadingText.textContent = 'Metinler çıkarılıyor...';
        state.pdf1.text = await extractAllText(state.pdf1.document);

        updateProgress(40);
        state.pdf2.text = await extractAllText(state.pdf2.document);

        // Perform comparison
        updateProgress(60);
        el.loadingText.textContent = 'Karşılaştırma yapılıyor...';
        performComparison();

        // Extract text positions for highlighting
        updateProgress(80);
        el.loadingText.textContent = 'Vurgulama hazırlanıyor...';
        await prepareHighlights();

        // Update UI
        updateProgress(100);
        updateChangesPanel();
        renderCurrentPage();

        // Show changes sidebar
        el.changesSidebar.style.display = 'flex';

    } catch (error) {
        console.error('Karşılaştırma hatası:', error);
        alert('Karşılaştırma sırasında hata oluştu: ' + error.message);
    } finally {
        showLoading(false);
        state.ui.isComparing = false;
    }
}

function performComparison() {
    const dmp = new diff_match_patch();
    state.comparison.changes = [];

    const maxPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page1 = state.pdf1.text.find(p => p.pageNum === pageNum);
        const page2 = state.pdf2.text.find(p => p.pageNum === pageNum);

        if (!page1 && page2) {
            // Page added
            state.comparison.changes.push({
                pageNum: pageNum,
                type: 'added',
                addedText: page2.text,
                deletedText: '',
                wordCount: page2.text.split(/\s+/).length
            });
        } else if (page1 && !page2) {
            // Page deleted
            state.comparison.changes.push({
                pageNum: pageNum,
                type: 'deleted',
                addedText: '',
                deletedText: page1.text,
                wordCount: page1.text.split(/\s+/).length
            });
        } else if (page1 && page2) {
            // Compare page text
            if (page1.text !== page2.text) {
                // Run diff
                const diffs = dmp.diff_main(page1.text, page2.text);
                dmp.diff_cleanupSemantic(diffs); // Cleanup for better readability

                // Count changes
                let addedWords = 0;
                let deletedWords = 0;
                let addedChars = 0;
                let deletedChars = 0;

                diffs.forEach(([operation, text]) => {
                    const words = text.split(/\s+/).filter(w => w.length > 0).length;
                    if (operation === 1) { // DIFF_INSERT
                        addedWords += words;
                        addedChars += text.length;
                    } else if (operation === -1) { // DIFF_DELETE
                        deletedWords += words;
                        deletedChars += text.length;
                    }
                });

                if (addedWords > 0 || deletedWords > 0) {
                    state.comparison.changes.push({
                        pageNum: pageNum,
                        type: 'modified',
                        diffs: diffs,
                        addedWords: addedWords,
                        deletedWords: deletedWords,
                        addedChars: addedChars,
                        deletedChars: deletedChars
                    });
                }
            }
        }
    }

    console.log('Comparison complete:', state.comparison.changes);
}

// ==================== Highlight Preparation ====================
async function prepareHighlights() {
    state.comparison.highlights = { pdf1: {}, pdf2: {} };

    for (const change of state.comparison.changes) {
        const pageNum = change.pageNum;

        if (change.type === 'added') {
            // Highlight entire page 2
            state.comparison.highlights.pdf2[pageNum] = [{
                type: 'added',
                text: change.addedText,
                fullPage: true
            }];
        } else if (change.type === 'deleted') {
            // Highlight entire page 1
            state.comparison.highlights.pdf1[pageNum] = [{
                type: 'deleted',
                text: change.deletedText,
                fullPage: true
            }];
        } else if (change.type === 'modified') {
            // Process diffs to find specific text locations
            await processModifiedPage(pageNum, change.diffs);
        }
    }
}

async function processModifiedPage(pageNum, diffs) {
    if (!state.comparison.highlights.pdf1[pageNum]) {
        state.comparison.highlights.pdf1[pageNum] = [];
    }
    if (!state.comparison.highlights.pdf2[pageNum]) {
        state.comparison.highlights.pdf2[pageNum] = [];
    }

    // Extract deleted and added texts
    diffs.forEach(([operation, text]) => {
        if (operation === -1) { // DIFF_DELETE
            state.comparison.highlights.pdf1[pageNum].push({
                type: 'deleted',
                text: text.trim()
            });
        } else if (operation === 1) { // DIFF_INSERT
            state.comparison.highlights.pdf2[pageNum].push({
                type: 'added',
                text: text.trim()
            });
        }
    });
}

// ==================== Highlight Rendering ====================
function renderHighlights(pdfNum, pageNum) {
    if (!state.settings.showHighlights) return;

    const highlights = state.comparison.highlights[`pdf${pdfNum}`][pageNum];
    if (!highlights || highlights.length === 0) return;

    const textLayer = pdfNum === 1 ? el.textLayer1 : el.textLayer2;
    const overlay = pdfNum === 1 ? el.highlightOverlay1 : el.highlightOverlay2;

    // Clear existing highlights
    textLayer.querySelectorAll('span').forEach(span => {
        span.classList.remove('highlight-added', 'highlight-deleted', 'highlight-modified');
    });
    overlay.innerHTML = '';

    // Set overlay size to match canvas
    const canvas = pdfNum === 1 ? el.canvas1 : el.canvas2;
    overlay.setAttribute('width', canvas.width);
    overlay.setAttribute('height', canvas.height);
    overlay.style.width = canvas.width + 'px';
    overlay.style.height = canvas.height + 'px';

    // Apply highlights
    highlights.forEach(highlight => {
        if (highlight.fullPage) {
            // Highlight entire page
            highlightEntirePage(overlay, highlight.type);
        } else {
            // Highlight specific text
            highlightText(textLayer, highlight.text, highlight.type);
        }
    });
}

function highlightEntirePage(overlay, type) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('class', `highlight-rect-${type}`);
    overlay.appendChild(rect);
}

function highlightText(textLayer, searchText, type) {
    if (!searchText || searchText.length < 3) return;

    const spans = Array.from(textLayer.querySelectorAll('span'));
    const fullText = spans.map(s => s.textContent).join(' ');
    const normalizedSearch = normalizeText(searchText);
    const normalizedFull = normalizeText(fullText);

    // Find position in full text
    const index = normalizedFull.indexOf(normalizedSearch);
    if (index === -1) {
        // Try word-by-word matching
        const words = normalizedSearch.split(/\s+/).filter(w => w.length >= 5);
        words.forEach(word => {
            spans.forEach(span => {
                const spanText = normalizeText(span.textContent);
                if (spanText.includes(word)) {
                    span.classList.add(`highlight-${type}`);
                }
            });
        });
        return;
    }

    // Calculate which spans contain this text
    let currentPos = 0;
    const matchStart = index;
    const matchEnd = index + normalizedSearch.length;

    spans.forEach(span => {
        const spanText = normalizeText(span.textContent);
        const spanStart = currentPos;
        const spanEnd = currentPos + spanText.length;

        // Check if span overlaps with match
        if (spanStart < matchEnd && spanEnd > matchStart) {
            span.classList.add(`highlight-${type}`);
        }

        currentPos = spanEnd + 1; // +1 for space
    });
}

function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ==================== Changes Panel ====================
function updateChangesPanel() {
    let totalAdded = 0;
    let totalDeleted = 0;
    let totalModified = 0;
    let totalMoved = 0;
    let totalAddedWords = 0;
    let totalDeletedWords = 0;

    let changesHTML = '';

    state.comparison.changes.forEach(change => {
        const { pageNum, type } = change;

        if (type === 'added') {
            totalAdded++;
            totalAddedWords += change.wordCount || 0;
            changesHTML += `
                <div class="change-item" onclick="navigateToPage(${pageNum})">
                    <div class="change-item-header">
                        <span class="change-item-page">Sayfa ${pageNum}</span>
                        <span class="change-badge added">Eklenen</span>
                    </div>
                    <div class="change-item-preview">Sayfa eklendi</div>
                    <div class="change-item-stats">+${change.wordCount || 0} kelime</div>
                </div>
            `;
        } else if (type === 'deleted') {
            totalDeleted++;
            totalDeletedWords += change.wordCount || 0;
            changesHTML += `
                <div class="change-item" onclick="navigateToPage(${pageNum})">
                    <div class="change-item-header">
                        <span class="change-item-page">Sayfa ${pageNum}</span>
                        <span class="change-badge deleted">Silinen</span>
                    </div>
                    <div class="change-item-preview">Sayfa silindi</div>
                    <div class="change-item-stats">-${change.wordCount || 0} kelime</div>
                </div>
            `;
        } else if (type === 'modified') {
            totalModified++;
            totalAddedWords += change.addedWords || 0;
            totalDeletedWords += change.deletedWords || 0;
            changesHTML += `
                <div class="change-item" onclick="navigateToPage(${pageNum})">
                    <div class="change-item-header">
                        <span class="change-item-page">Sayfa ${pageNum}</span>
                        <span class="change-badge modified">Değişen</span>
                    </div>
                    <div class="change-item-stats">
                        +${change.addedWords || 0} kelime eklendi, -${change.deletedWords || 0} kelime silindi
                    </div>
                </div>
            `;
        }
    });

    // Update counts
    el.addedCount.textContent = totalAdded;
    el.deletedCount.textContent = totalDeleted;
    el.modifiedCount.textContent = totalModified;
    el.movedCount.textContent = totalMoved;

    el.totalAdded.textContent = totalAdded + totalModified;
    el.totalDeleted.textContent = totalDeleted + totalModified;
    el.totalModified.textContent = totalModified;
    el.totalMoved.textContent = totalMoved;
    el.totalAddedWords.textContent = totalAddedWords;
    el.totalDeletedWords.textContent = totalDeletedWords;

    // Update list
    if (changesHTML === '') {
        changesHTML = '<div style="padding: 40px; text-align: center; color: #999;">Hiç fark bulunamadı! PDF\'ler aynı.</div>';
    }
    el.changesList.innerHTML = changesHTML;
}

// ==================== Navigation ====================
function navigatePage(delta) {
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);
    const newPage = Math.max(1, Math.min(totalPages, state.ui.currentPage + delta));
    navigateToPage(newPage);
}

function navigateToPage(pageNum) {
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);
    if (pageNum < 1 || pageNum > totalPages) return;

    state.ui.currentPage = pageNum;
    renderCurrentPage();
}

function navigateChange(delta) {
    const currentPage = state.ui.currentPage;
    const changes = state.comparison.changes;

    if (changes.length === 0) return;

    // Find current change index
    let currentIndex = changes.findIndex(c => c.pageNum >= currentPage);
    if (currentIndex === -1) currentIndex = 0;

    // Navigate
    const newIndex = currentIndex + delta;
    if (newIndex >= 0 && newIndex < changes.length) {
        navigateToPage(changes[newIndex].pageNum);
    }
}

function updatePageInfo() {
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);
    el.pageInfo.textContent = `Sayfa ${state.ui.currentPage} / ${totalPages}`;

    el.prevPage.disabled = state.ui.currentPage <= 1;
    el.nextPage.disabled = state.ui.currentPage >= totalPages;
}

// ==================== Controls ====================
function changeZoom(delta) {
    state.settings.zoomLevel = Math.max(0.5, Math.min(2, state.settings.zoomLevel + delta));
    el.zoomSelect.value = state.settings.zoomLevel;
    renderCurrentPage();
}

function toggleSyncScroll() {
    state.settings.syncScroll = !state.settings.syncScroll;
    el.syncScrollBtn.setAttribute('data-active', state.settings.syncScroll);
    el.syncScrollBtn.title = state.settings.syncScroll ? 'Scroll Kilidi ON' : 'Scroll Kilidi OFF';
}

function toggleHighlights() {
    state.settings.showHighlights = !state.settings.showHighlights;
    el.toggleHighlights.setAttribute('data-active', state.settings.showHighlights);
    renderCurrentPage();
}

// ==================== Export ====================
function exportReport() {
    let report = '='.repeat(80) + '\n';
    report += 'PDF KARŞILAŞTIRMA RAPORU\n';
    report += '='.repeat(80) + '\n\n';

    report += 'DOSYALAR:\n';
    report += `PDF 1: ${state.pdf1.file ? state.pdf1.file.name : 'N/A'} (${state.pdf1.totalPages} sayfa)\n`;
    report += `PDF 2: ${state.pdf2.file ? state.pdf2.file.name : 'N/A'} (${state.pdf2.totalPages} sayfa)\n\n`;

    report += 'ÖZET:\n';
    const stats = calculateStats();
    report += `Eklenen Sayfalar: ${stats.addedPages}\n`;
    report += `Silinen Sayfalar: ${stats.deletedPages}\n`;
    report += `Değiştirilen Sayfalar: ${stats.modifiedPages}\n`;
    report += `Toplam Eklenen Kelime: ${stats.totalAddedWords}\n`;
    report += `Toplam Silinen Kelime: ${stats.totalDeletedWords}\n\n`;

    report += 'DETAYLI DEĞİŞİKLİKLER:\n';
    report += '-'.repeat(80) + '\n';

    state.comparison.changes.forEach(change => {
        report += `\nSayfa ${change.pageNum} - ${change.type.toUpperCase()}\n`;
        if (change.type === 'modified') {
            report += `  +${change.addedWords} kelime eklendi\n`;
            report += `  -${change.deletedWords} kelime silindi\n`;
        }
    });

    report += '\n' + '='.repeat(80) + '\n';
    report += `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}\n`;

    // Download
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf_karsilastirma_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function calculateStats() {
    let addedPages = 0;
    let deletedPages = 0;
    let modifiedPages = 0;
    let totalAddedWords = 0;
    let totalDeletedWords = 0;

    state.comparison.changes.forEach(change => {
        if (change.type === 'added') {
            addedPages++;
            totalAddedWords += change.wordCount || 0;
        } else if (change.type === 'deleted') {
            deletedPages++;
            totalDeletedWords += change.wordCount || 0;
        } else if (change.type === 'modified') {
            modifiedPages++;
            totalAddedWords += change.addedWords || 0;
            totalDeletedWords += change.deletedWords || 0;
        }
    });

    return { addedPages, deletedPages, modifiedPages, totalAddedWords, totalDeletedWords };
}

// ==================== UI Helpers ====================
function showLoading(show, text = 'Yükleniyor...') {
    el.loadingOverlay.style.display = show ? 'flex' : 'none';
    if (show) {
        el.loadingText.textContent = text;
        updateProgress(0);
    }
}

function updateProgress(percent) {
    el.progressFill.style.width = `${percent}%`;
}

// ==================== Start ====================
document.addEventListener('DOMContentLoaded', init);
