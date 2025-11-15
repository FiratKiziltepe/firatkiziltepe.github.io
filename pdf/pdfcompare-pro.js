// PDF.js worker'ını ayarla
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ==================== GLOBAL STATE ====================
const state = {
    pdf1: {
        file: null,
        document: null,
        currentPage: 1,
        totalPages: 0,
        text: [],
        canvases: []
    },
    pdf2: {
        file: null,
        document: null,
        currentPage: 1,
        totalPages: 0,
        text: [],
        canvases: []
    },
    comparison: {
        changes: [],
        textDiff: [],
        visualDiff: []
    },
    settings: {
        viewMode: 'side-by-side', // 'side-by-side', 'overlay', 'single'
        syncScroll: true,
        highlightChanges: true,
        ignoreWhitespace: true,
        ignoreCase: false,
        zoomLevel: 100,
        showThumbnails: true,
        showChangesPanel: true
    },
    ui: {
        isComparing: false,
        progressValue: 0
    }
};

// ==================== DOM ELEMENTS ====================
const elements = {
    // Upload
    uploadBox1: document.getElementById('uploadBox1'),
    uploadBox2: document.getElementById('uploadBox2'),
    fileInput1: document.getElementById('fileInput1'),
    fileInput2: document.getElementById('fileInput2'),
    fileName1: document.getElementById('fileName1'),
    fileName2: document.getElementById('fileName2'),

    // Toolbar
    compareBtn: document.getElementById('compareBtn'),

    // Control bar
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomFit: document.getElementById('zoomFit'),
    zoomLevel: document.getElementById('zoomLevel'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    currentPage: document.getElementById('currentPage'),
    totalPages: document.getElementById('totalPages'),
    syncScrollToggle: document.getElementById('syncScroll'),

    // View modes
    viewSideBySide: document.getElementById('viewSideBySide'),
    viewOverlay: document.getElementById('viewOverlay'),
    viewSingle: document.getElementById('viewSingle'),

    // Viewers
    viewer1: document.getElementById('viewer1'),
    viewer2: document.getElementById('viewer2'),
    pdfCanvas1: document.getElementById('pdfCanvas1'),
    pdfCanvas2: document.getElementById('pdfCanvas2'),

    // Panels
    thumbnailPanel: document.getElementById('thumbnailPanel'),
    changesPanel: document.getElementById('changesPanel'),
    thumbnailsList: document.getElementById('thumbnailsList'),
    changesList: document.getElementById('changesList'),

    // Changes summary
    addedCount: document.getElementById('addedCount'),
    deletedCount: document.getElementById('deletedCount'),
    modifiedCount: document.getElementById('modifiedCount'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    progressBar: document.getElementById('progressFill'),
    loadingText: document.getElementById('loadingText'),

    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    saveSettings: document.getElementById('saveSettings')
};

// ==================== INITIALIZATION ====================
function init() {
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    // File upload
    elements.uploadBox1.addEventListener('click', () => elements.fileInput1.click());
    elements.uploadBox2.addEventListener('click', () => elements.fileInput2.click());
    elements.fileInput1.addEventListener('change', (e) => handleFileSelect(e, 1));
    elements.fileInput2.addEventListener('change', (e) => handleFileSelect(e, 2));

    // Drag & drop
    setupDragAndDrop(elements.uploadBox1, 1);
    setupDragAndDrop(elements.uploadBox2, 2);

    // Compare button
    elements.compareBtn.addEventListener('click', comparePDFs);

    // Zoom controls
    elements.zoomIn.addEventListener('click', () => setZoom(state.settings.zoomLevel + 25));
    elements.zoomOut.addEventListener('click', () => setZoom(state.settings.zoomLevel - 25));
    elements.zoomFit.addEventListener('click', fitToWidth);

    // Page navigation
    elements.prevPage.addEventListener('click', () => navigatePage(-1));
    elements.nextPage.addEventListener('click', () => navigatePage(1));

    // Sync scroll
    elements.syncScrollToggle.addEventListener('change', (e) => {
        state.settings.syncScroll = e.target.checked;
    });

    // Synchronized scrolling
    elements.viewer1.addEventListener('scroll', () => {
        if (state.settings.syncScroll) {
            elements.viewer2.scrollTop = elements.viewer1.scrollTop;
            elements.viewer2.scrollLeft = elements.viewer1.scrollLeft;
        }
    });

    elements.viewer2.addEventListener('scroll', () => {
        if (state.settings.syncScroll) {
            elements.viewer1.scrollTop = elements.viewer2.scrollTop;
            elements.viewer1.scrollLeft = elements.viewer2.scrollLeft;
        }
    });

    // View mode toggles
    elements.viewSideBySide.addEventListener('click', () => setViewMode('side-by-side'));
    elements.viewOverlay.addEventListener('click', () => setViewMode('overlay'));
    elements.viewSingle.addEventListener('click', () => setViewMode('single'));

    // Settings modal
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.add('active');
        loadSettingsToModal();
    });
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
    });
    elements.saveSettings.addEventListener('click', saveSettingsFromModal);

    // Close modal on outside click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.remove('active');
        }
    });

    // Panel toggles
    document.getElementById('toggleThumbnails')?.addEventListener('click', toggleThumbnailsPanel);
    document.getElementById('toggleChanges')?.addEventListener('click', toggleChangesPanel);

    // Export
    document.getElementById('exportReport')?.addEventListener('click', exportReport);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ==================== FILE UPLOAD ====================
function setupDragAndDrop(element, pdfNumber) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            loadPDFFile(file, pdfNumber);
        } else {
            alert('Lütfen geçerli bir PDF dosyası seçin!');
        }
    });
}

function handleFileSelect(event, pdfNumber) {
    const file = event.target.files[0];
    if (file) {
        loadPDFFile(file, pdfNumber);
    }
}

async function loadPDFFile(file, pdfNumber) {
    const pdf = pdfNumber === 1 ? state.pdf1 : state.pdf2;
    const fileNameElement = pdfNumber === 1 ? elements.fileName1 : elements.fileName2;

    showLoading(true, `PDF ${pdfNumber} yükleniyor...`);

    try {
        pdf.file = file;
        const arrayBuffer = await file.arrayBuffer();
        pdf.document = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdf.totalPages = pdf.document.numPages;
        pdf.currentPage = 1;

        fileNameElement.innerHTML = `
            <i class="fas fa-check-circle" style="color: #28a745;"></i>
            <strong>${file.name}</strong>
            <span style="color: #666; margin-left: 10px;">(${pdf.totalPages} sayfa)</span>
        `;

        // Enable compare button if both PDFs loaded
        if (state.pdf1.document && state.pdf2.document) {
            elements.compareBtn.disabled = false;
        }

        // Render first page
        await renderPage(pdfNumber, 1);

    } catch (error) {
        console.error(`PDF ${pdfNumber} yükleme hatası:`, error);
        alert(`PDF ${pdfNumber} yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// ==================== PDF RENDERING ====================
async function renderPage(pdfNumber, pageNum) {
    const pdf = pdfNumber === 1 ? state.pdf1 : state.pdf2;
    const canvas = pdfNumber === 1 ? elements.pdfCanvas1 : elements.pdfCanvas2;

    if (!pdf.document || pageNum < 1 || pageNum > pdf.totalPages) return;

    try {
        const page = await pdf.document.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.settings.zoomLevel / 100 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };

        await page.render(renderContext).promise;

        pdf.currentPage = pageNum;
        updatePageInfo();

    } catch (error) {
        console.error(`Sayfa ${pageNum} render hatası:`, error);
    }
}

async function renderAllPages() {
    showLoading(true, 'Sayfalar render ediliyor...');

    try {
        const maxPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

        for (let i = 1; i <= maxPages; i++) {
            updateProgress((i / maxPages) * 100);

            if (i <= state.pdf1.totalPages) {
                await renderPage(1, i);
            }
            if (i <= state.pdf2.totalPages) {
                await renderPage(2, i);
            }
        }

    } finally {
        showLoading(false);
    }
}

// ==================== TEXT EXTRACTION ====================
async function extractTextFromPDF(pdf) {
    const fullText = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        let pageText = '';
        let lastY = null;
        let currentLine = '';

        textContent.items.forEach((item, index) => {
            const text = item.str;
            const y = item.transform[5];
            const nextItem = textContent.items[index + 1];

            // New line detection
            if (lastY !== null && Math.abs(y - lastY) > 5) {
                if (currentLine.trim()) {
                    pageText += currentLine.trim() + '\n';
                }
                currentLine = '';
            }

            if (text) {
                currentLine += text;
                // Add space between words
                if (nextItem && nextItem.transform[5] === y) {
                    const currentX = item.transform[4] + item.width;
                    const nextX = nextItem.transform[4];
                    if (nextX - currentX > 1) {
                        currentLine += ' ';
                    }
                }
            }

            lastY = y;
        });

        if (currentLine.trim()) {
            pageText += currentLine.trim() + '\n';
        }

        fullText.push({
            pageNum: pageNum,
            text: pageText.trim()
        });
    }

    return fullText;
}

function normalizeText(text) {
    let normalized = text.trim();

    if (state.settings.ignoreCase) {
        normalized = normalized.toLowerCase();
    }

    if (state.settings.ignoreWhitespace) {
        normalized = normalized.replace(/\s+/g, ' ').trim();
        normalized = normalized.replace(/^\s+|\s+$/gm, '');
    }

    return normalized;
}

// ==================== COMPARISON ====================
async function comparePDFs() {
    if (!state.pdf1.document || !state.pdf2.document) {
        alert('Lütfen iki PDF dosyası yükleyin!');
        return;
    }

    showLoading(true, 'PDF\'ler karşılaştırılıyor...');
    state.ui.isComparing = true;

    try {
        // Extract text from both PDFs
        updateProgress(10);
        elements.loadingText.textContent = 'Metinler çıkarılıyor...';
        state.pdf1.text = await extractTextFromPDF(state.pdf1.document);

        updateProgress(30);
        state.pdf2.text = await extractTextFromPDF(state.pdf2.document);

        // Perform text comparison
        updateProgress(50);
        elements.loadingText.textContent = 'Metin karşılaştırması yapılıyor...';
        await performTextComparison();

        // Generate thumbnails
        updateProgress(70);
        elements.loadingText.textContent = 'Thumbnail\'ler oluşturuluyor...';
        await generateThumbnails();

        // Highlight changes
        updateProgress(90);
        elements.loadingText.textContent = 'Değişiklikler vurgulanıyor...';
        await highlightChanges();

        // Update UI
        updateProgress(100);
        updateChangesPanel();
        updatePageInfo();

        // Show panels
        elements.thumbnailPanel.style.display = 'block';
        elements.changesPanel.style.display = 'block';

    } catch (error) {
        console.error('Karşılaştırma hatası:', error);
        alert('PDF karşılaştırma sırasında bir hata oluştu: ' + error.message);
    } finally {
        showLoading(false);
        state.ui.isComparing = false;
    }
}

async function performTextComparison() {
    const changes = {
        added: [],
        deleted: [],
        modified: []
    };

    const maxPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const text1 = state.pdf1.text.find(p => p.pageNum === pageNum);
        const text2 = state.pdf2.text.find(p => p.pageNum === pageNum);

        if (!text1 && text2) {
            // Page added in PDF2
            changes.added.push({
                pageNum: pageNum,
                type: 'page',
                content: text2.text
            });
        } else if (text1 && !text2) {
            // Page deleted from PDF1
            changes.deleted.push({
                pageNum: pageNum,
                type: 'page',
                content: text1.text
            });
        } else if (text1 && text2) {
            // Compare page content
            const normalized1 = normalizeText(text1.text);
            const normalized2 = normalizeText(text2.text);

            if (normalized1 !== normalized2) {
                // Page modified
                const lineDiff = computeLineDiff(
                    text1.text.split('\n'),
                    text2.text.split('\n')
                );

                changes.modified.push({
                    pageNum: pageNum,
                    type: 'content',
                    diff: lineDiff
                });
            }
        }
    }

    state.comparison.changes = changes;
    state.comparison.textDiff = computeTextDiff();
}

function computeLineDiff(lines1, lines2) {
    const normalizedLines1 = lines1.map(normalizeText).filter(l => l.length > 0);
    const normalizedLines2 = lines2.map(normalizeText).filter(l => l.length > 0);

    const filteredLines1 = lines1.filter(l => normalizeText(l).length > 0);
    const filteredLines2 = lines2.filter(l => normalizeText(l).length > 0);

    return computeDiff(normalizedLines1, normalizedLines2, filteredLines1, filteredLines2);
}

function computeDiff(normalized1, normalized2, original1, original2) {
    const m = normalized1.length;
    const n = normalized2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // LCS (Longest Common Subsequence)
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (normalized1[i - 1] === normalized2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Build diff
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

function computeTextDiff() {
    // Combine all text differences for export
    const allDiff = [];

    state.comparison.changes.modified.forEach(change => {
        allDiff.push({
            pageNum: change.pageNum,
            diff: change.diff
        });
    });

    return allDiff;
}

// ==================== THUMBNAILS ====================
async function generateThumbnails() {
    elements.thumbnailsList.innerHTML = '';

    const maxPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const thumbnail = await createThumbnail(pageNum);
        elements.thumbnailsList.appendChild(thumbnail);
    }
}

async function createThumbnail(pageNum) {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';
    if (pageNum === state.pdf1.currentPage) {
        item.classList.add('active');
    }

    item.onclick = () => navigateToPage(pageNum);

    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    const scale = 0.2;

    // Try to render from PDF1, fallback to PDF2
    try {
        let page = null;
        if (pageNum <= state.pdf1.totalPages) {
            page = await state.pdf1.document.getPage(pageNum);
        } else if (pageNum <= state.pdf2.totalPages) {
            page = await state.pdf2.document.getPage(pageNum);
        }

        if (page) {
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            }).promise;
        }
    } catch (error) {
        console.error(`Thumbnail ${pageNum} hatası:`, error);
    }

    // Add change indicator
    const hasChanges = state.comparison.changes.modified.some(c => c.pageNum === pageNum) ||
                      state.comparison.changes.added.some(c => c.pageNum === pageNum) ||
                      state.comparison.changes.deleted.some(c => c.pageNum === pageNum);

    if (hasChanges) {
        const indicator = document.createElement('div');
        indicator.className = 'change-indicator';
        item.appendChild(indicator);
    }

    const pageLabel = document.createElement('div');
    pageLabel.className = 'thumbnail-label';
    pageLabel.textContent = `Sayfa ${pageNum}`;

    item.appendChild(canvas);
    item.appendChild(pageLabel);

    return item;
}

// ==================== CHANGE HIGHLIGHTING ====================
async function highlightChanges() {
    if (!state.settings.highlightChanges) return;

    // This would overlay colored rectangles on the canvas
    // For now, we'll update the changes panel
    // Full implementation would require canvas manipulation
}

function updateChangesPanel() {
    const { added, deleted, modified } = state.comparison.changes;

    // Update counts
    elements.addedCount.textContent = added.length;
    elements.deletedCount.textContent = deleted.length;
    elements.modifiedCount.textContent = modified.length;

    // Build changes list
    let html = '';

    // Added changes
    added.forEach(change => {
        html += `
            <div class="change-item added" onclick="navigateToPage(${change.pageNum})">
                <div class="change-icon"><i class="fas fa-plus-circle"></i></div>
                <div class="change-content">
                    <div class="change-header">
                        <strong>Sayfa ${change.pageNum}</strong>
                        <span class="change-type added-badge">Eklendi</span>
                    </div>
                    <div class="change-preview">${escapeHtml(change.content.substring(0, 100))}...</div>
                </div>
            </div>
        `;
    });

    // Deleted changes
    deleted.forEach(change => {
        html += `
            <div class="change-item deleted" onclick="navigateToPage(${change.pageNum})">
                <div class="change-icon"><i class="fas fa-minus-circle"></i></div>
                <div class="change-content">
                    <div class="change-header">
                        <strong>Sayfa ${change.pageNum}</strong>
                        <span class="change-type deleted-badge">Silindi</span>
                    </div>
                    <div class="change-preview">${escapeHtml(change.content.substring(0, 100))}...</div>
                </div>
            </div>
        `;
    });

    // Modified changes
    modified.forEach(change => {
        const addedLines = change.diff.filter(d => d.type === 'added').length;
        const removedLines = change.diff.filter(d => d.type === 'removed').length;

        html += `
            <div class="change-item modified" onclick="navigateToPage(${change.pageNum})">
                <div class="change-icon"><i class="fas fa-edit"></i></div>
                <div class="change-content">
                    <div class="change-header">
                        <strong>Sayfa ${change.pageNum}</strong>
                        <span class="change-type modified-badge">Değiştirildi</span>
                    </div>
                    <div class="change-preview">
                        +${addedLines} satır eklendi, -${removedLines} satır silindi
                    </div>
                </div>
            </div>
        `;
    });

    if (html === '') {
        html = '<div style="padding: 2rem; text-align: center; color: #28a745;"><i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i><br><strong>Hiç fark bulunamadı!</strong><br>PDF\'ler aynı içeriğe sahip.</div>';
    }

    elements.changesList.innerHTML = html;
}

// ==================== NAVIGATION ====================
function navigatePage(delta) {
    const currentPage = state.pdf1.currentPage;
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);
    const newPage = Math.max(1, Math.min(totalPages, currentPage + delta));

    navigateToPage(newPage);
}

async function navigateToPage(pageNum) {
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

    if (pageNum < 1 || pageNum > totalPages) return;

    // Render both pages
    if (pageNum <= state.pdf1.totalPages) {
        await renderPage(1, pageNum);
    }
    if (pageNum <= state.pdf2.totalPages) {
        await renderPage(2, pageNum);
    }

    // Update thumbnail selection
    document.querySelectorAll('.thumbnail-item').forEach((item, index) => {
        item.classList.toggle('active', index + 1 === pageNum);
    });

    updatePageInfo();
}

function updatePageInfo() {
    const currentPage = Math.max(state.pdf1.currentPage, state.pdf2.currentPage);
    const totalPages = Math.max(state.pdf1.totalPages, state.pdf2.totalPages);

    elements.currentPage.textContent = currentPage;
    elements.totalPages.textContent = totalPages;

    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
}

// ==================== ZOOM ====================
function setZoom(level) {
    level = Math.max(50, Math.min(200, level));
    state.settings.zoomLevel = level;
    elements.zoomLevel.textContent = `${level}%`;

    // Re-render current pages
    const currentPage = Math.max(state.pdf1.currentPage, state.pdf2.currentPage);
    renderPage(1, currentPage);
    renderPage(2, currentPage);
}

async function fitToWidth() {
    const viewerWidth = elements.viewer1.clientWidth;
    const page = await state.pdf1.document.getPage(state.pdf1.currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const scale = (viewerWidth - 40) / viewport.width;

    setZoom(Math.round(scale * 100));
}

// ==================== VIEW MODES ====================
function setViewMode(mode) {
    state.settings.viewMode = mode;

    // Update button states
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.remove('active');
    });

    if (mode === 'side-by-side') {
        elements.viewSideBySide.classList.add('active');
        document.querySelector('.viewer-container').className = 'viewer-container side-by-side-mode';
    } else if (mode === 'overlay') {
        elements.viewOverlay.classList.add('active');
        document.querySelector('.viewer-container').className = 'viewer-container overlay-mode';
        elements.viewer2.style.opacity = '0.5';
    } else if (mode === 'single') {
        elements.viewSingle.classList.add('active');
        document.querySelector('.viewer-container').className = 'viewer-container single-mode';
    }
}

// ==================== PANELS ====================
function toggleThumbnailsPanel() {
    const panel = elements.thumbnailPanel;
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function toggleChangesPanel() {
    const panel = elements.changesPanel;
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// ==================== SETTINGS ====================
function loadSettingsToModal() {
    document.getElementById('settingIgnoreWhitespace').checked = state.settings.ignoreWhitespace;
    document.getElementById('settingIgnoreCase').checked = state.settings.ignoreCase;
    document.getElementById('settingHighlightChanges').checked = state.settings.highlightChanges;
}

function saveSettingsFromModal() {
    state.settings.ignoreWhitespace = document.getElementById('settingIgnoreWhitespace').checked;
    state.settings.ignoreCase = document.getElementById('settingIgnoreCase').checked;
    state.settings.highlightChanges = document.getElementById('settingHighlightChanges').checked;

    elements.settingsModal.classList.remove('active');

    // Re-compare if already compared
    if (state.comparison.textDiff.length > 0) {
        comparePDFs();
    }
}

// ==================== EXPORT ====================
function exportReport() {
    let report = '='.repeat(80) + '\n';
    report += 'PDF KARŞILAŞTIRMA RAPORU (PROFESYONEL)\n';
    report += '='.repeat(80) + '\n\n';

    report += 'DOSYA BİLGİLERİ:\n';
    report += '-'.repeat(80) + '\n';
    report += `PDF 1: ${state.pdf1.file ? state.pdf1.file.name : 'Yüklenmedi'} (${state.pdf1.totalPages} sayfa)\n`;
    report += `PDF 2: ${state.pdf2.file ? state.pdf2.file.name : 'Yüklenmedi'} (${state.pdf2.totalPages} sayfa)\n\n`;

    report += 'DEĞİŞİKLİK ÖZETİ:\n';
    report += '-'.repeat(80) + '\n';
    report += `Eklenen Sayfalar: ${state.comparison.changes.added.length}\n`;
    report += `Silinen Sayfalar: ${state.comparison.changes.deleted.length}\n`;
    report += `Değiştirilen Sayfalar: ${state.comparison.changes.modified.length}\n\n`;

    report += 'DETAYLI DEĞİŞİKLİKLER:\n';
    report += '-'.repeat(80) + '\n';

    // Added pages
    if (state.comparison.changes.added.length > 0) {
        report += '\n[EKLENMİŞ SAYFALAR]\n';
        state.comparison.changes.added.forEach(change => {
            report += `\nSayfa ${change.pageNum}:\n${change.content}\n`;
        });
    }

    // Deleted pages
    if (state.comparison.changes.deleted.length > 0) {
        report += '\n[SİLİNMİŞ SAYFALAR]\n';
        state.comparison.changes.deleted.forEach(change => {
            report += `\nSayfa ${change.pageNum}:\n${change.content}\n`;
        });
    }

    // Modified pages
    if (state.comparison.changes.modified.length > 0) {
        report += '\n[DEĞİŞTİRİLMİŞ SAYFALAR]\n';
        state.comparison.changes.modified.forEach(change => {
            report += `\nSayfa ${change.pageNum}:\n`;
            change.diff.forEach(item => {
                if (item.type === 'added') {
                    report += `+ ${item.line2}\n`;
                } else if (item.type === 'removed') {
                    report += `- ${item.line1}\n`;
                }
            });
        });
    }

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

// ==================== KEYBOARD SHORTCUTS ====================
function handleKeyboardShortcuts(e) {
    // Prevent default for our shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '=':
            case '+':
                e.preventDefault();
                setZoom(state.settings.zoomLevel + 25);
                break;
            case '-':
                e.preventDefault();
                setZoom(state.settings.zoomLevel - 25);
                break;
            case '0':
                e.preventDefault();
                setZoom(100);
                break;
        }
    }

    // Page navigation
    if (!e.ctrlKey && !e.metaKey) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                navigatePage(-1);
                break;
            case 'ArrowRight':
            case 'PageDown':
                e.preventDefault();
                navigatePage(1);
                break;
            case 'Home':
                e.preventDefault();
                navigateToPage(1);
                break;
            case 'End':
                e.preventDefault();
                navigateToPage(Math.max(state.pdf1.totalPages, state.pdf2.totalPages));
                break;
        }
    }
}

// ==================== UI HELPERS ====================
function showLoading(show, text = 'Yükleniyor...') {
    if (show) {
        elements.loadingOverlay.classList.add('active');
        elements.loadingText.textContent = text;
        updateProgress(0);
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

function updateProgress(percent) {
    state.ui.progressValue = percent;
    elements.progressBar.style.width = `${percent}%`;
}

function updateUI() {
    // Initial UI state
    elements.compareBtn.disabled = true;
    elements.syncScrollToggle.checked = state.settings.syncScroll;
    elements.zoomLevel.textContent = `${state.settings.zoomLevel}%`;
    setViewMode('side-by-side');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
