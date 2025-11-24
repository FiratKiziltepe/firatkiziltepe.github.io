/*
 * ProCompare - Logic Script
 * Handles file parsing (PDF, DOCX, XLSX) and comparison
 */

// ==================== Global State ====================
const state = {
    file1: { text: null, name: null },
    file2: { text: null, name: null },
    diffs: [],
    changes: [], // Processed changes for sidebar
    settings: {
        ignoreCase: false,
        ignoreWhitespace: true
    }
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
    themeSwitch: document.getElementById('themeSwitch'),
    exportHtmlBtn: document.getElementById('exportHtmlBtn'),

    // New Elements
    navHistory: document.getElementById('navHistory'),
    navSettings: document.getElementById('navSettings'),
    changesList: document.getElementById('changesList'),
    changeSearch: document.getElementById('changeSearch'),
    filterChips: document.querySelectorAll('.filter-chip'),
    toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    changesSidebar: document.getElementById('changesSidebar'),
    historyList: document.getElementById('historyList')
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupTheme();
    loadSettings();

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

    // Navigation
    el.navHistory.addEventListener('click', showHistory);
    el.navSettings.addEventListener('click', showSettings);

    // Sidebar & Filters
    el.toggleSidebarBtn.addEventListener('click', () => el.changesSidebar.classList.toggle('closed'));
    el.closeSidebarBtn.addEventListener('click', () => el.changesSidebar.classList.add('closed'));
    el.changeSearch.addEventListener('input', filterChanges);
    el.filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            el.filterChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            filterChanges();
        });
    });

    // View Toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            switchView(e.currentTarget.dataset.view);
        });
    });

    // Scroll Sync
    setupScrollSync();
    htmlOriginal += `<del>${escapedText}</del>`;
    state.changes.push({ type: 'deleted', text: text });
} else if (op === 2) { // Moved To (New Location)
    htmlUnified += `<span class="moved-text" title="Taşınan Metin">${escapedText}</span>`;
    htmlModified += `<span class="moved-text">${escapedText}</span>`;
    state.changes.push({ type: 'moved', text: text });
} else if (op === -2) { // Moved From (Old Location)
    htmlUnified += `<span class="moved-text" style="text-decoration: line-through; opacity: 0.5;">${escapedText}</span>`;
    htmlOriginal += `<span class="moved-text">${escapedText}</span>`;
} else { // Equal
    htmlUnified += escapedText;
    htmlOriginal += escapedText;
    htmlModified += escapedText;
}
    });

el.unifiedView.innerHTML = htmlUnified;
el.splitOriginal.innerHTML = htmlOriginal;
el.splitModified.innerHTML = htmlModified;

populateSidebar();
}

function populateSidebar() {
    el.changesList.innerHTML = '';
    state.changes.forEach(change => {
        const div = document.createElement('div');
        div.className = `change-card ${change.type}`;
        div.innerHTML = `
            <div class="change-header">
                <span>${getChangeLabel(change.type)}</span>
            </div>
            <div class="change-preview">${escapeHtml(change.text)}</div>
        `;
        div.addEventListener('click', () => {
            // Scroll to text (Implementation would require mapping spans to changes)
        });
        el.changesList.appendChild(div);
    });
}

function getChangeLabel(type) {
    if (type === 'added') return 'Eklendi';
    if (type === 'deleted') return 'Silindi';
    if (type === 'moved') return 'Taşındı';
    return '';
}

function filterChanges() {
    const query = el.changeSearch.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;

    const cards = el.changesList.querySelectorAll('.change-card');
    cards.forEach(card => {
        const type = card.classList.contains('added') ? 'added' :
            card.classList.contains('deleted') ? 'deleted' : 'moved';
        const text = card.querySelector('.change-preview').textContent.toLowerCase();

        const matchesType = activeFilter === 'all' || activeFilter === type;
        const matchesQuery = text.includes(query);

        card.style.display = matchesType && matchesQuery ? 'block' : 'none';
    });
}

// ==================== History & Settings ====================
function saveToHistory(name1, name2) {
    const history = JSON.parse(localStorage.getItem('compareHistory') || '[]');
    history.unshift({
        date: new Date().toLocaleString(),
        file1: name1,
        file2: name2
    });
    if (history.length > 10) history.pop();
    localStorage.setItem('compareHistory', JSON.stringify(history));
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem('compareHistory') || '[]');
    el.historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <h4>${item.file1} vs ${item.file2}</h4>
                <span class="history-date">${item.date}</span>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; color:#666;">Geçmiş bulunamadı.</p>';

    toggleModal('historyModal', true);
}

function clearHistory() {
    localStorage.removeItem('compareHistory');
    showHistory();
}

function showSettings() {
    document.getElementById('settingIgnoreCase').checked = state.settings.ignoreCase;
    document.getElementById('settingIgnoreWhitespace').checked = state.settings.ignoreWhitespace;
    toggleModal('settingsModal', true);
}

function saveSettings() {
    state.settings.ignoreCase = document.getElementById('settingIgnoreCase').checked;
    state.settings.ignoreWhitespace = document.getElementById('settingIgnoreWhitespace').checked;
    localStorage.setItem('compareSettings', JSON.stringify(state.settings));
    toggleModal('settingsModal', false);
}

function loadSettings() {
    const saved = localStorage.getItem('compareSettings');
    if (saved) state.settings = JSON.parse(saved);
}

function toggleModal(id, show) {
    document.getElementById(id).style.display = show ? 'flex' : 'none';
}

// ==================== Utilities ====================
function switchView(view) {
    if (view === 'unified') {
        el.unifiedView.style.display = 'block';
        document.getElementById('splitView').style.display = 'none';
    } else {
        el.unifiedView.style.display = 'none';
        document.getElementById('splitView').style.display = 'flex';
    }
}

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
            .moved-text { background-color: rgba(79, 70, 229, 0.1); border: 1px dashed #4f46e5; padding: 2px; }
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
