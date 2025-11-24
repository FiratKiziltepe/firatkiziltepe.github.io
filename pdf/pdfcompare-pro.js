/*
 * ProCompare - Logic Script
 * Handles file parsing (PDF, DOCX, XLSX) and comparison
 */

// ==================== Global State ====================
const state = {
    file1: { text: null, name: null },
    file2: { text: null, name: null },
    diffs: []
};

// ==================== DOM Elements ====================
const el = {
    dropZone1: document.getElementById('dropZone1'),
    dropZone2: document.getElementById('dropZone2'),
    fileInput1: document.getElementById('fileInput1'),
    fileInput2: document.getElementById('fileInput2'),
    textInput1: document.getElementById('textInput1'),
    textInput2: document.getElementById('textInput2'),
    fileInfo1: document.getElementById('fileInfo1'),
    fileInfo2: document.getElementById('fileInfo2'),
    compareBtn: document.getElementById('compareBtn'),
    clearBtn: document.getElementById('clearBtn'),
    resultsSection: document.getElementById('resultsSection'),
    uploadSection: document.getElementById('uploadSection'),
    unifiedView: document.getElementById('unifiedView'),
    splitOriginal: document.getElementById('splitOriginal'),
    splitModified: document.getElementById('splitModified'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    statAdded: document.getElementById('statAdded'),
    statDeleted: document.getElementById('statDeleted'),
    themeSwitch: document.getElementById('themeSwitch'),
    exportHtmlBtn: document.getElementById('exportHtmlBtn')
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupTheme();
    
    // PDF.js Worker Setup
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
});

function setupEventListeners() {
    // File Inputs
    el.fileInput1.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 1));
    el.fileInput2.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 2));

    // Drag & Drop
    setupDragDrop(el.dropZone1, 1);
    setupDragDrop(el.dropZone2, 2);

    // Text Inputs
    el.textInput1.addEventListener('input', (e) => {
        state.file1.text = e.target.value;
        checkReady();
    });
    el.textInput2.addEventListener('input', (e) => {
        state.file2.text = e.target.value;
        checkReady();
    });

    // Actions
    el.compareBtn.addEventListener('click', startComparison);
    el.clearBtn.addEventListener('click', clearAll);
    el.themeSwitch.addEventListener('change', toggleTheme);
    el.exportHtmlBtn.addEventListener('click', exportHtmlReport);

    // View Toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            switchView(e.currentTarget.dataset.view);
        });
    });
}

function setupDragDrop(zone, fileNum) {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0], fileNum);
        }
    });
}

// ==================== File Handling ====================
async function handleFileSelect(file, fileNum) {
    if (!file) return;

    showLoading(true);
    try {
        const text = await extractText(file);
        
        if (fileNum === 1) {
            state.file1.text = text;
            state.file1.name = file.name;
            updateFileInfo(1, file.name);
            el.textInput1.value = text; // Show extracted text
        } else {
            state.file2.text = text;
            state.file2.name = file.name;
            updateFileInfo(2, file.name);
            el.textInput2.value = text;
        }
        
        checkReady();
    } catch (error) {
        console.error('Extraction error:', error);
        alert(`Dosya okuma hatası: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function extractText(file) {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return await extractPdfText(file);
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
        return await extractDocxText(file);
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || name.endsWith('.xlsx')) {
        return await extractExcelText(file);
    } else if (type === 'text/plain' || name.endsWith('.txt')) {
        return await extractPlainText(file);
    } else {
        throw new Error('Desteklenmeyen dosya formatı. Lütfen PDF, DOCX, XLSX veya TXT kullanın.');
    }
}

// --- Extractors ---

async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    return fullText.trim();
}

async function extractDocxText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value.trim();
}

async function extractExcelText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    let fullText = '';
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        fullText += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
    });
    return fullText.trim();
}

async function extractPlainText(file) {
    return await file.text();
}

// ==================== UI Updates ====================
function updateFileInfo(num, name) {
    const info = num === 1 ? el.fileInfo1 : el.fileInfo2;
    const input = num === 1 ? el.textInput1 : el.textInput2;
    
    info.style.display = 'flex';
    info.querySelector('.filename').textContent = name;
    input.style.display = 'none'; // Hide text area when file is loaded
}

function removeFile(num) {
    if (num === 1) {
        state.file1 = { text: null, name: null };
        el.fileInfo1.style.display = 'none';
        el.textInput1.style.display = 'block';
        el.textInput1.value = '';
        el.fileInput1.value = '';
    } else {
        state.file2 = { text: null, name: null };
        el.fileInfo2.style.display = 'none';
        el.textInput2.style.display = 'block';
        el.textInput2.value = '';
        el.fileInput2.value = '';
    }
    checkReady();
}

function checkReady() {
    // Enable compare button if both sides have text
    const hasText1 = state.file1.text && state.file1.text.trim().length > 0;
    const hasText2 = state.file2.text && state.file2.text.trim().length > 0;
    el.compareBtn.disabled = !(hasText1 && hasText2);
}

function showLoading(show) {
    if (show) el.loadingOverlay.classList.add('active');
    else el.loadingOverlay.classList.remove('active');
}

function clearAll() {
    removeFile(1);
    removeFile(2);
    el.resultsSection.style.display = 'none';
    el.uploadSection.style.display = 'flex';
}

// ==================== Comparison Logic ====================
function startComparison() {
    showLoading(true);
    
    // Small timeout to allow UI to update
    setTimeout(() => {
        try {
            const dmp = new diff_match_patch();
            const text1 = state.file1.text || '';
            const text2 = state.file2.text || '';

            const diffs = dmp.diff_main(text1, text2);
            dmp.diff_cleanupSemantic(diffs);
            state.diffs = diffs;

            renderResults(diffs);
            
            el.uploadSection.style.display = 'none';
            el.resultsSection.style.display = 'flex';
        } catch (error) {
            console.error(error);
            alert('Karşılaştırma sırasında bir hata oluştu.');
        } finally {
            showLoading(false);
        }
    }, 100);
}

function renderResults(diffs) {
    let htmlUnified = '';
    let htmlOriginal = '';
    let htmlModified = '';
    
    let addedCount = 0;
    let deletedCount = 0;

    diffs.forEach(([op, text]) => {
        const escapedText = escapeHtml(text);
        
        if (op === 1) { // Insert
            htmlUnified += `<ins>${escapedText}</ins>`;
            htmlModified += `<ins>${escapedText}</ins>`;
            addedCount++;
        } else if (op === -1) { // Delete
            htmlUnified += `<del>${escapedText}</del>`;
            htmlOriginal += `<del>${escapedText}</del>`;
            deletedCount++;
        } else { // Equal
            htmlUnified += escapedText;
            htmlOriginal += escapedText;
            htmlModified += escapedText;
        }
    });

    el.unifiedView.innerHTML = htmlUnified;
    el.splitOriginal.innerHTML = htmlOriginal;
    el.splitModified.innerHTML = htmlModified;

    el.statAdded.textContent = addedCount;
    el.statDeleted.textContent = deletedCount;
}

function switchView(view) {
    if (view === 'unified') {
        el.unifiedView.style.display = 'block';
        document.getElementById('splitView').style.display = 'none';
    } else {
        el.unifiedView.style.display = 'none';
        document.getElementById('splitView').style.display = 'flex';
    }
}

// ==================== Utilities ====================
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

function toggleTheme() {
    if (el.themeSwitch.checked) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function setupTheme() {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        el.themeSwitch.checked = true;
        document.body.setAttribute('data-theme', 'dark');
    }
}

function exportHtmlReport() {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Karşılaştırma Raporu</title>
        <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            ins { background: #dcfce7; color: #166534; text-decoration: none; border-bottom: 2px solid #10b981; }
            del { background: #fee2e2; color: #991b1b; text-decoration: line-through; }
            .header { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Karşılaştırma Raporu</h1>
            <p>Tarih: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
            ${el.unifiedView.innerHTML}
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karsilastirma-raporu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
