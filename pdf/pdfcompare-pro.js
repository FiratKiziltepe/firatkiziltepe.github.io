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
        textPositions: [], // Text with coordinates for highlighting
        canvases: []
    },
    pdf2: {
        file: null,
        document: null,
        currentPage: 1,
        totalPages: 0,
        text: [],
        textPositions: [], // Text with coordinates for highlighting
        canvases: []
    },
    comparison: {
        changes: [],
        textDiff: [],
        visualDiff: [],
        highlights: { pdf1: [], pdf2: [] } // Mapped highlights with coordinates
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
    fileInfo1: document.getElementById('fileInfo1'),
    fileInfo2: document.getElementById('fileInfo2'),

    // Toolbar
    compareBtn: document.getElementById('compareBtn'),

    // Control bar
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomSelect: document.getElementById('zoomSelect'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    syncScrollToggle: document.getElementById('syncScroll'),
    controlBar: document.getElementById('controlBar'),

    // Viewers
    viewer1: document.getElementById('viewer1'),
    viewer2: document.getElementById('viewer2'),
    canvas1: document.getElementById('canvas1'),
    canvas2: document.getElementById('canvas2'),
    overlay1: document.getElementById('overlay1'),
    overlay2: document.getElementById('overlay2'),
    sideBySideView: document.getElementById('sideBySideView'),
    overlayView: document.getElementById('overlayView'),
    singleView: document.getElementById('singleView'),
    welcomeScreen: document.getElementById('welcomeScreen'),

    // Panels
    thumbnailsPanel: document.getElementById('thumbnailsPanel'),
    changesPanel: document.getElementById('changesPanel'),
    thumbnails1: document.getElementById('thumbnails1'),
    thumbnails2: document.getElementById('thumbnails2'),
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
    saveSettings: document.getElementById('saveSettings'),

    // Export
    exportReportBtn: document.getElementById('exportReportBtn'),

    // Toggle buttons
    toggleThumbnails: document.getElementById('toggleThumbnails'),
    toggleChanges: document.getElementById('toggleChanges')
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
    elements.zoomIn.addEventListener('click', () => {
        const currentZoom = parseFloat(elements.zoomSelect.value);
        const newZoom = Math.min(2, currentZoom + 0.25);
        elements.zoomSelect.value = newZoom;
        setZoom(newZoom * 100);
    });

    elements.zoomOut.addEventListener('click', () => {
        const currentZoom = parseFloat(elements.zoomSelect.value);
        const newZoom = Math.max(0.5, currentZoom - 0.25);
        elements.zoomSelect.value = newZoom;
        setZoom(newZoom * 100);
    });

    elements.zoomSelect.addEventListener('change', (e) => {
        setZoom(parseFloat(e.target.value) * 100);
    });

    // Page navigation
    elements.prevPage.addEventListener('click', () => navigatePage(-1));
    elements.nextPage.addEventListener('click', () => navigatePage(1));

    // Sync scroll
    elements.syncScrollToggle.addEventListener('change', (e) => {
        state.settings.syncScroll = e.target.checked;
    });

    // Synchronized scrolling
    if (elements.viewer1) {
        elements.viewer1.addEventListener('scroll', () => {
            if (state.settings.syncScroll && elements.viewer2) {
                elements.viewer2.scrollTop = elements.viewer1.scrollTop;
                elements.viewer2.scrollLeft = elements.viewer1.scrollLeft;
            }
        });
    }

    if (elements.viewer2) {
        elements.viewer2.addEventListener('scroll', () => {
            if (state.settings.syncScroll && elements.viewer1) {
                elements.viewer1.scrollTop = elements.viewer2.scrollTop;
                elements.viewer1.scrollLeft = elements.viewer2.scrollLeft;
            }
        });
    }

    // View mode toggles
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewMode = e.currentTarget.getAttribute('data-view');
            setViewMode(viewMode);
        });
    });

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
    if (elements.toggleThumbnails) {
        elements.toggleThumbnails.addEventListener('click', toggleThumbnailsPanel);
    }
    if (elements.toggleChanges) {
        elements.toggleChanges.addEventListener('click', toggleHighlights);
    }

    // Export
    if (elements.exportReportBtn) {
        elements.exportReportBtn.addEventListener('click', exportReport);
    }

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
    const uploadBox = pdfNumber === 1 ? elements.uploadBox1 : elements.uploadBox2;
    const fileInfo = pdfNumber === 1 ? elements.fileInfo1 : elements.fileInfo2;

    showLoading(true, `PDF ${pdfNumber} yükleniyor...`);

    try {
        pdf.file = file;
        const arrayBuffer = await file.arrayBuffer();
        pdf.document = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdf.totalPages = pdf.document.numPages;
        pdf.currentPage = 1;

        // Hide upload content, show file info
        const uploadContent = uploadBox.querySelector('.upload-content');
        if (uploadContent) uploadContent.style.display = 'none';

        fileInfo.style.display = 'flex';
        const fileNameSpan = fileInfo.querySelector('.file-name');
        if (fileNameSpan) {
            fileNameSpan.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745; margin-right: 5px;"></i>
                <strong>${file.name}</strong>
                <span style="color: #666; margin-left: 10px;">(${pdf.totalPages} sayfa)</span>
            `;
        }

        // Enable compare button if both PDFs loaded
        if (state.pdf1.document && state.pdf2.document) {
            elements.compareBtn.disabled = false;
        }

        // Render first page preview (optional)
        // await renderPage(pdfNumber, 1);

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
    const canvas = pdfNumber === 1 ? elements.canvas1 : elements.canvas2;

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

        // Render highlights after PDF page is rendered
        if (state.comparison.highlights) {
            renderPageHighlights(pdfNumber, pageNum);
        }

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

// ==================== TEXT POSITION EXTRACTION ====================
// Extract text with position information for highlighting
async function extractTextWithPositions(pdf) {
    const allTextPositions = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 }); // Use scale 1.0 as base
        const textContent = await page.getTextContent();

        const pagePositions = [];

        textContent.items.forEach(item => {
            if (!item.str || item.str.trim() === '') return;

            const tx = item.transform;
            // Transform coordinates to viewport space
            pagePositions.push({
                text: item.str,
                x: tx[4],
                y: viewport.height - tx[5], // Flip Y coordinate (PDF coords are bottom-up)
                width: item.width,
                height: item.height,
                transform: tx
            });
        });

        allTextPositions.push({
            pageNum: pageNum,
            positions: pagePositions
        });
    }

    return allTextPositions;
}

// Map comparison changes to PDF coordinates for highlighting
function mapChangesToCoordinates(changes, textPositions1, textPositions2) {
    const highlights = { pdf1: {}, pdf2: {} };

    // Initialize page arrays
    for (let i = 1; i <= Math.max(textPositions1.length, textPositions2.length); i++) {
        highlights.pdf1[i] = [];
        highlights.pdf2[i] = [];
    }

    // Process modified pages
    changes.modified.forEach(change => {
        const pageNum = change.pageNum;
        const page1Positions = textPositions1.find(p => p.pageNum === pageNum);
        const page2Positions = textPositions2.find(p => p.pageNum === pageNum);

        if (!page1Positions || !page2Positions) return;

        // Process each diff item
        change.diff.forEach(diffItem => {
            if (diffItem.type === 'removed' && diffItem.line1) {
                // Find text in PDF1
                const matches = findTextInPositions(diffItem.line1, page1Positions.positions);
                matches.forEach(match => {
                    highlights.pdf1[pageNum].push({
                        type: 'deleted',
                        x: match.x,
                        y: match.y,
                        width: match.width,
                        height: match.height,
                        text: diffItem.line1
                    });
                });
            } else if (diffItem.type === 'added' && diffItem.line2) {
                // Find text in PDF2
                const matches = findTextInPositions(diffItem.line2, page2Positions.positions);
                matches.forEach(match => {
                    highlights.pdf2[pageNum].push({
                        type: 'added',
                        x: match.x,
                        y: match.y,
                        width: match.width,
                        height: match.height,
                        text: diffItem.line2
                    });
                });
            }
        });
    });

    // Process added pages
    changes.added.forEach(change => {
        const pageNum = change.pageNum;
        const page2Positions = textPositions2.find(p => p.pageNum === pageNum);

        if (page2Positions) {
            // Highlight all text on added page
            page2Positions.positions.forEach(pos => {
                highlights.pdf2[pageNum].push({
                    type: 'added',
                    x: pos.x,
                    y: pos.y,
                    width: pos.width,
                    height: pos.height,
                    text: pos.text
                });
            });
        }
    });

    // Process deleted pages
    changes.deleted.forEach(change => {
        const pageNum = change.pageNum;
        const page1Positions = textPositions1.find(p => p.pageNum === pageNum);

        if (page1Positions) {
            // Highlight all text on deleted page
            page1Positions.positions.forEach(pos => {
                highlights.pdf1[pageNum].push({
                    type: 'deleted',
                    x: pos.x,
                    y: pos.y,
                    width: pos.width,
                    height: pos.height,
                    text: pos.text
                });
            });
        }
    });

    return highlights;
}

// Find text positions that match a given line of text
function findTextInPositions(searchText, positions) {
    const matches = [];
    const searchNormalized = normalizeText(searchText);

    if (!searchNormalized) return matches;

    // Build a continuous text from positions to find matches
    let fullText = '';
    const positionMap = [];

    positions.forEach((pos, idx) => {
        const startIdx = fullText.length;
        fullText += pos.text;
        positionMap.push({
            startIdx: startIdx,
            endIdx: fullText.length,
            position: pos
        });
        fullText += ' '; // Add space between text items
    });

    const fullTextNormalized = normalizeText(fullText);
    const searchIdx = fullTextNormalized.indexOf(searchNormalized);

    if (searchIdx !== -1) {
        const searchEndIdx = searchIdx + searchNormalized.length;

        // Find all positions that overlap with the search range
        positionMap.forEach(mapItem => {
            if (mapItem.startIdx < searchEndIdx && mapItem.endIdx > searchIdx) {
                matches.push(mapItem.position);
            }
        });
    }

    return matches;
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

        // Hide welcome screen, show viewers and panels
        if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'none';
        if (elements.sideBySideView) elements.sideBySideView.style.display = 'flex';
        if (elements.controlBar) elements.controlBar.style.display = 'flex';
        if (elements.thumbnailsPanel) elements.thumbnailsPanel.style.display = 'block';
        if (elements.changesPanel) elements.changesPanel.style.display = 'block';

        // Render first pages
        await renderPage(1, 1);
        await renderPage(2, 1);

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
    if (elements.thumbnails1) elements.thumbnails1.innerHTML = '';
    if (elements.thumbnails2) elements.thumbnails2.innerHTML = '';

    // Generate thumbnails for PDF1
    for (let pageNum = 1; pageNum <= state.pdf1.totalPages; pageNum++) {
        const thumbnail = await createThumbnail(pageNum, 1);
        if (elements.thumbnails1) elements.thumbnails1.appendChild(thumbnail);
    }

    // Generate thumbnails for PDF2
    for (let pageNum = 1; pageNum <= state.pdf2.totalPages; pageNum++) {
        const thumbnail = await createThumbnail(pageNum, 2);
        if (elements.thumbnails2) elements.thumbnails2.appendChild(thumbnail);
    }
}

async function createThumbnail(pageNum, pdfNumber) {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';

    const pdf = pdfNumber === 1 ? state.pdf1 : state.pdf2;

    if (pageNum === pdf.currentPage) {
        item.classList.add('active');
    }

    item.onclick = () => navigateToPage(pageNum);

    // Create canvas for thumbnail
    const canvas = document.createElement('canvas');
    const scale = 0.15;

    try {
        if (pdf.document && pageNum <= pdf.totalPages) {
            const page = await pdf.document.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            }).promise;
        }
    } catch (error) {
        console.error(`Thumbnail PDF${pdfNumber} sayfa ${pageNum} hatası:`, error);
    }

    // Add change indicator
    const hasChanges = state.comparison.changes.modified.some(c => c.pageNum === pageNum) ||
                      state.comparison.changes.added.some(c => c.pageNum === pageNum) ||
                      state.comparison.changes.deleted.some(c => c.pageNum === pageNum);

    if (hasChanges) {
        const indicator = document.createElement('div');
        indicator.className = 'change-indicator';
        indicator.style.cssText = 'position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; background: #ff4444; border-radius: 50%;';
        item.appendChild(indicator);
    }

    const pageLabel = document.createElement('div');
    pageLabel.className = 'thumbnail-label';
    pageLabel.textContent = `${pageNum}`;
    pageLabel.style.cssText = 'text-align: center; padding: 5px; font-size: 12px;';

    item.appendChild(canvas);
    item.appendChild(pageLabel);
    item.style.cssText = 'position: relative; cursor: pointer; margin: 5px; border: 2px solid #ddd; border-radius: 4px;';

    return item;
}

// ==================== CHANGE HIGHLIGHTING ====================
// Create highlight canvas overlay on top of PDF canvas
function createHighlightCanvas(pdfCanvas, overlayContainer) {
    // Clear any existing highlight canvas
    const existingCanvas = overlayContainer.querySelector('.highlight-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    const highlightCanvas = document.createElement('canvas');
    highlightCanvas.className = 'highlight-canvas';
    highlightCanvas.width = pdfCanvas.width;
    highlightCanvas.height = pdfCanvas.height;
    highlightCanvas.style.cssText = `
        display: block;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    `;

    overlayContainer.appendChild(highlightCanvas);
    return highlightCanvas;
}

// Create tooltip element
function createTooltip() {
    let tooltip = document.getElementById('highlight-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'highlight-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10000;
            display: none;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

// Add hover interaction to highlight canvas
function addHighlightInteraction(canvas, highlights, scale) {
    if (!canvas || !highlights) return;

    const tooltip = createTooltip();

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // Find highlight under cursor
        let foundHighlight = null;
        for (const highlight of highlights) {
            const padding = 2;
            if (x >= highlight.x - padding &&
                x <= highlight.x + highlight.width + padding &&
                y >= highlight.y - padding &&
                y <= highlight.y + highlight.height + padding) {
                foundHighlight = highlight;
                break;
            }
        }

        if (foundHighlight) {
            // Show tooltip
            const typeLabel = {
                'added': 'Eklendi',
                'deleted': 'Silindi',
                'modified': 'Değiştirildi'
            }[foundHighlight.type] || foundHighlight.type;

            const textPreview = foundHighlight.text.length > 100
                ? foundHighlight.text.substring(0, 100) + '...'
                : foundHighlight.text;

            tooltip.innerHTML = `
                <strong style="color: ${
                    foundHighlight.type === 'added' ? '#66b3ff' :
                    foundHighlight.type === 'deleted' ? '#ff6666' :
                    '#ffff66'
                };">${typeLabel}</strong><br>
                ${escapeHtml(textPreview)}
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        } else {
            tooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

// Draw highlights on canvas
function drawHighlights(canvas, highlights, scale = 1) {
    if (!canvas || !highlights) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    highlights.forEach(highlight => {
        // Set color based on change type
        switch(highlight.type) {
            case 'added':
                ctx.fillStyle = 'rgba(0, 120, 255, 0.3)'; // Blue
                ctx.strokeStyle = 'rgba(0, 120, 255, 0.6)';
                break;
            case 'deleted':
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Red
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
                break;
            case 'modified':
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
                break;
            default:
                ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
                ctx.strokeStyle = 'rgba(128, 128, 128, 0.6)';
        }

        // Draw rectangle
        const x = highlight.x * scale;
        const y = highlight.y * scale;
        const width = highlight.width * scale;
        const height = highlight.height * scale;

        // Add some padding to make highlights more visible
        const padding = 2;

        ctx.fillRect(
            x - padding,
            y - padding,
            width + padding * 2,
            height + padding * 2
        );

        // Draw border
        ctx.lineWidth = 1;
        ctx.strokeRect(
            x - padding,
            y - padding,
            width + padding * 2,
            height + padding * 2
        );
    });
}

// Main highlight function - extracts positions and draws highlights
async function highlightChanges() {
    if (!state.settings.highlightChanges) {
        // Clear highlights if disabled
        clearHighlights();
        return;
    }

    showLoading(true, 'Metin pozisyonları çıkarılıyor...');

    try {
        // Extract text positions from both PDFs
        state.pdf1.textPositions = await extractTextWithPositions(state.pdf1.document);
        state.pdf2.textPositions = await extractTextWithPositions(state.pdf2.document);

        // Map changes to coordinates
        state.comparison.highlights = mapChangesToCoordinates(
            state.comparison.changes,
            state.pdf1.textPositions,
            state.pdf2.textPositions
        );

        console.log('Highlights mapped:', state.comparison.highlights);

    } catch (error) {
        console.error('Highlighting error:', error);
    } finally {
        showLoading(false);
    }
}

// Render highlights for a specific page
function renderPageHighlights(pdfNumber, pageNum) {
    if (!state.settings.highlightChanges) return;

    const canvas = pdfNumber === 1 ? elements.canvas1 : elements.canvas2;
    const overlayContainer = pdfNumber === 1 ? elements.overlay1 : elements.overlay2;

    if (!canvas || !overlayContainer) return;

    const highlights = state.comparison.highlights[`pdf${pdfNumber}`][pageNum] || [];

    if (highlights.length === 0) {
        // Clear overlay if no highlights
        const existingCanvas = overlayContainer.querySelector('.highlight-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        return;
    }

    // Create highlight canvas
    const highlightCanvas = createHighlightCanvas(canvas, overlayContainer);

    // Get current scale
    const scale = state.settings.zoomLevel / 100;

    // Draw highlights
    drawHighlights(highlightCanvas, highlights, scale);

    // Add hover interaction
    addHighlightInteraction(highlightCanvas, highlights, scale);
}

// Clear all highlights
function clearHighlights() {
    [elements.overlay1, elements.overlay2].forEach(overlay => {
        if (overlay) {
            const existingCanvas = overlay.querySelector('.highlight-canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
        }
    });
}

// Toggle highlights on/off
function toggleHighlights() {
    state.settings.highlightChanges = !state.settings.highlightChanges;

    if (state.settings.highlightChanges) {
        // Re-render current page highlights
        const currentPage = Math.max(state.pdf1.currentPage, state.pdf2.currentPage);
        renderPageHighlights(1, currentPage);
        renderPageHighlights(2, currentPage);
    } else {
        // Clear all highlights
        clearHighlights();
    }

    // Update button appearance
    const toggleBtn = elements.toggleChanges;
    if (toggleBtn) {
        if (state.settings.highlightChanges) {
            toggleBtn.classList.add('active');
        } else {
            toggleBtn.classList.remove('active');
        }
    }
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

    if (elements.pageInfo) {
        elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
    }

    if (elements.prevPage) {
        elements.prevPage.disabled = currentPage <= 1;
    }
    if (elements.nextPage) {
        elements.nextPage.disabled = currentPage >= totalPages;
    }
}

// ==================== ZOOM ====================
function setZoom(level) {
    level = Math.max(50, Math.min(200, level));
    state.settings.zoomLevel = level;

    // Re-render current pages
    const currentPage = Math.max(state.pdf1.currentPage, state.pdf2.currentPage);
    if (state.pdf1.document && currentPage <= state.pdf1.totalPages) {
        renderPage(1, currentPage);
    }
    if (state.pdf2.document && currentPage <= state.pdf2.totalPages) {
        renderPage(2, currentPage);
    }
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
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === mode) {
            btn.classList.add('active');
        }
    });

    // Hide all views
    if (elements.sideBySideView) elements.sideBySideView.style.display = 'none';
    if (elements.overlayView) elements.overlayView.style.display = 'none';
    if (elements.singleView) elements.singleView.style.display = 'none';

    // Show selected view
    if (mode === 'sideBySide') {
        if (elements.sideBySideView) elements.sideBySideView.style.display = 'flex';
    } else if (mode === 'overlay') {
        if (elements.overlayView) elements.overlayView.style.display = 'flex';
    } else if (mode === 'single') {
        if (elements.singleView) elements.singleView.style.display = 'flex';
    }
}

// ==================== PANELS ====================
function toggleThumbnailsPanel() {
    const panel = elements.thumbnailsPanel;
    if (panel) {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
}

function toggleChangesPanel() {
    const panel = elements.changesPanel;
    if (panel) {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
}

// ==================== SETTINGS ====================
function loadSettingsToModal() {
    const ignoreWhitespace = document.getElementById('ignoreWhitespace');
    const ignoreCase = document.getElementById('ignoreCase');

    if (ignoreWhitespace) ignoreWhitespace.checked = state.settings.ignoreWhitespace;
    if (ignoreCase) ignoreCase.checked = state.settings.ignoreCase;
}

function saveSettingsFromModal() {
    const ignoreWhitespace = document.getElementById('ignoreWhitespace');
    const ignoreCase = document.getElementById('ignoreCase');

    if (ignoreWhitespace) state.settings.ignoreWhitespace = ignoreWhitespace.checked;
    if (ignoreCase) state.settings.ignoreCase = ignoreCase.checked;

    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
    }

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
    if (elements.compareBtn) elements.compareBtn.disabled = true;
    if (elements.syncScrollToggle) elements.syncScrollToggle.checked = state.settings.syncScroll;
    if (elements.zoomSelect) elements.zoomSelect.value = state.settings.zoomLevel / 100;

    // Set initial toggle button state for highlights
    if (elements.toggleChanges && state.settings.highlightChanges) {
        elements.toggleChanges.classList.add('active');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
