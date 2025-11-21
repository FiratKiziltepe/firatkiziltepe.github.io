/**
 * Main Application Logic
 * Coordinates UI interactions and analysis workflow
 */

// Application State
const AppState = {
    excelData: null,
    analysisResults: [],
    originalData: [], // Store original data with opinions
    isAnalyzing: false,
    currentBatch: 0,
    totalBatches: 0,
    pagination: {
        currentPage: 1,
        itemsPerPage: 50,
        totalPages: 1
    }
};

// DOM Elements
const elements = {
    // API Section
    apiKeyInput: null,
    toggleKeyBtn: null,
    saveKeyBtn: null,
    
    // Upload Section
    uploadArea: null,
    fileInput: null,
    selectFileBtn: null,
    fileInfo: null,
    fileName: null,
    rowCount: null,
    
    // Column Section
    columnSection: null,
    colEntryId: null,
    colOpinion: null,
    colBranch: null,
    colCourse: null,
    colGrade: null,
    batchSize: null,
    startAnalysisBtn: null,
    
    // Progress Section
    progressSection: null,
    progressFill: null,
    progressCurrent: null,
    progressTotal: null,
    progressPercent: null,
    progressStatus: null,
    
    // Results Section
    resultsSection: null,
    statTotal: null,
    statPositive: null,
    statNegative: null,
    statNeutral: null,
    statActionable: null,
    categoryChart: null,
    downloadExcelBtn: null,
    downloadJsonBtn: null,
    resultsTbody: null,
    
    // Summary Section
    summarySection: null,
    summaryLoading: null,
    summaryContent: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadSavedApiKey();
});

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    if (AppState.analysisResults.length > 0) {
        const stats = calculateStatistics(AppState.analysisResults);
        displayCategoryBarChart(stats.categories);
        displaySentimentPieChart(stats);
    }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    // API Section
    elements.apiKeyInput = document.getElementById('api-key');
    elements.toggleKeyBtn = document.getElementById('toggle-key-btn');
    elements.saveKeyBtn = document.getElementById('save-key-btn');
    
    // Upload Section
    elements.uploadArea = document.getElementById('upload-area');
    elements.fileInput = document.getElementById('file-input');
    elements.selectFileBtn = document.getElementById('select-file-btn');
    elements.fileInfo = document.getElementById('file-info');
    elements.fileName = document.getElementById('file-name');
    elements.rowCount = document.getElementById('row-count');
    
    // Column Section
    elements.columnSection = document.getElementById('column-section');
    elements.colEntryId = document.getElementById('col-entry-id');
    elements.colOpinion = document.getElementById('col-opinion');
    elements.colBranch = document.getElementById('col-branch');
    elements.colCourse = document.getElementById('col-course');
    elements.colGrade = document.getElementById('col-grade');
    elements.batchSize = document.getElementById('batch-size');
    elements.startAnalysisBtn = document.getElementById('start-analysis-btn');
    
    // Progress Section
    elements.progressSection = document.getElementById('progress-section');
    elements.progressFill = document.getElementById('progress-fill');
    elements.progressCurrent = document.getElementById('progress-current');
    elements.progressTotal = document.getElementById('progress-total');
    elements.progressPercent = document.getElementById('progress-percent');
    elements.progressStatus = document.getElementById('progress-status');
    
    // Results Section
    elements.resultsSection = document.getElementById('results-section');
    elements.statTotal = document.getElementById('stat-total');
    elements.statPositive = document.getElementById('stat-positive');
    elements.statNegative = document.getElementById('stat-negative');
    elements.statNeutral = document.getElementById('stat-neutral');
    elements.statActionable = document.getElementById('stat-actionable');
    elements.categoryChart = document.getElementById('category-chart');
    elements.downloadExcelBtn = document.getElementById('download-excel-btn');
    elements.downloadJsonBtn = document.getElementById('download-json-btn');
    elements.resultsTbody = document.getElementById('results-tbody');
    
    // Summary Section
    elements.summarySection = document.getElementById('summary-section');
    elements.summaryLoading = document.getElementById('summary-loading');
    elements.summaryContent = document.getElementById('summary-content');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // API Key Events
    elements.toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    elements.saveKeyBtn.addEventListener('click', saveApiKey);
    
    // File Upload Events
    elements.selectFileBtn.addEventListener('click', () => elements.fileInput.click());
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleFileDrop);
    
    // Analysis Start
    elements.startAnalysisBtn.addEventListener('click', startAnalysis);
    
    // Download Events
    elements.downloadExcelBtn.addEventListener('click', downloadExcel);
    elements.downloadJsonBtn.addEventListener('click', downloadJSON);
}

/**
 * Load saved API key from localStorage
 */
function loadSavedApiKey() {
    const savedKey = GeminiAPI.getApiKey();
    if (savedKey) {
        elements.apiKeyInput.value = savedKey;
        showNotification('API anahtarı yüklendi', 'success');
    }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
    const type = elements.apiKeyInput.type;
    elements.apiKeyInput.type = type === 'password' ? 'text' : 'password';
    elements.toggleKeyBtn.textContent = type === 'password' ? '🙈' : '👁️';
}

/**
 * Save API key
 */
async function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    
    if (!key) {
        showNotification('Lütfen bir API anahtarı girin', 'error');
        return;
    }
    
    if (!GeminiAPI.validateKeyFormat(key)) {
        showNotification('API anahtarı formatı geçersiz görünüyor', 'warning');
        return;
    }
    
    // Test the API key
    showNotification('API anahtarı test ediliyor...', 'info');
    const isValid = await GeminiAPI.testApiKey(key);
    
    if (isValid) {
        GeminiAPI.saveApiKey(key);
        showNotification('API anahtarı kaydedildi ve doğrulandı!', 'success');
    } else {
        showNotification('API anahtarı geçersiz. Lütfen kontrol edin.', 'error');
    }
}

/**
 * Handle file selection
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        await processFile(file);
    }
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

/**
 * Handle drag leave
 */
function handleDragLeave(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

/**
 * Handle file drop
 */
async function handleFileDrop(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        await processFile(file);
    }
}

/**
 * Process uploaded Excel file
 */
async function processFile(file) {
    try {
        showNotification('Excel dosyası okunuyor...', 'info');
        
        const result = await ExcelHandler.readFile(file);
        AppState.excelData = result;
        
        // Update UI
        elements.fileName.textContent = file.name;
        elements.rowCount.textContent = result.rowCount;
        elements.fileInfo.classList.remove('hidden');
        
        // Populate column dropdowns
        populateColumnDropdowns(result.headers);
        elements.columnSection.classList.remove('hidden');
        
        showNotification(`Dosya başarıyla yüklendi! ${result.rowCount} satır bulundu.`, 'success');
    } catch (error) {
        showNotification('Hata: ' + error.message, 'error');
        console.error('File processing error:', error);
    }
}

/**
 * Populate column selection dropdowns
 */
function populateColumnDropdowns(headers) {
    const dropdowns = [
        elements.colEntryId,
        elements.colOpinion,
        elements.colBranch,
        elements.colCourse,
        elements.colGrade
    ];
    
    dropdowns.forEach(dropdown => {
        // Clear existing options except first
        dropdown.innerHTML = '<option value="">Seçiniz...</option>';
        
        // Add headers as options
        headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            dropdown.appendChild(option);
        });
    });
    
    // Auto-select common column names
    autoSelectColumns(headers);
}

/**
 * Auto-select common column names
 */
function autoSelectColumns(headers) {
    // Entry ID
    const entryIdPatterns = ['entry id', 'id', 'no', 'sıra'];
    autoSelectColumn(elements.colEntryId, headers, entryIdPatterns);
    
    // Opinion
    const opinionPatterns = ['görüş', 'öneri', 'tespit', 'yorum', 'opinion'];
    autoSelectColumn(elements.colOpinion, headers, opinionPatterns);
    
    // Branch
    const branchPatterns = ['branş', 'branch'];
    autoSelectColumn(elements.colBranch, headers, branchPatterns);
    
    // Course
    const coursePatterns = ['ders', 'course', 'subject'];
    autoSelectColumn(elements.colCourse, headers, coursePatterns);
    
    // Grade
    const gradePatterns = ['sınıf', 'grade', 'class'];
    autoSelectColumn(elements.colGrade, headers, gradePatterns);
}

/**
 * Auto-select column based on patterns
 */
function autoSelectColumn(dropdown, headers, patterns) {
    for (let header of headers) {
        const headerLower = header.toLowerCase();
        for (let pattern of patterns) {
            if (headerLower.includes(pattern)) {
                dropdown.value = header;
                return;
            }
        }
    }
}

/**
 * Start analysis process
 */
async function startAnalysis() {
    // Validate API key
    const apiKey = GeminiAPI.getApiKey();
    if (!apiKey) {
        showNotification('Lütfen önce API anahtarınızı girin ve kaydedin', 'error');
        elements.apiKeyInput.focus();
        return;
    }
    
    // Validate column selection
    const columnMap = {
        entryId: elements.colEntryId.value,
        opinion: elements.colOpinion.value,
        branch: elements.colBranch.value,
        course: elements.colCourse.value,
        grade: elements.colGrade.value
    };
    
    const validation = ExcelHandler.validateColumns(columnMap);
    if (!validation.valid) {
        showNotification('Kolon Seçim Hatası: ' + validation.errors.join(', '), 'error');
        return;
    }
    
    // Prepare data
    const preparedData = ExcelHandler.prepareForAnalysis(columnMap);
    
    // Store original data with full information for later display
    AppState.originalData = ExcelHandler.prepareOriginalData(columnMap);
    
    const batchSize = parseInt(elements.batchSize.value) || 10;
    
    // Create batches
    const batches = [];
    for (let i = 0; i < preparedData.length; i += batchSize) {
        batches.push(preparedData.slice(i, i + batchSize));
    }
    
    AppState.totalBatches = batches.length;
    AppState.currentBatch = 0;
    AppState.analysisResults = [];
    AppState.isAnalyzing = true;
    
    // Show progress section
    elements.progressSection.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.summarySection.classList.add('hidden');
    elements.startAnalysisBtn.disabled = true;
    
    // Update progress
    updateProgress(0, preparedData.length, 'Analiz başlatılıyor...');
    
    // Process batches
    let processedRows = 0;
    for (let i = 0; i < batches.length; i++) {
        AppState.currentBatch = i + 1;
        updateProgress(processedRows, preparedData.length, `Batch ${i + 1}/${batches.length} işleniyor...`);
        
        try {
            const result = await GeminiAPI.analyzeBatch(batches[i]);
            
            if (result.items && result.items.length > 0) {
                AppState.analysisResults.push(...result.items);
            }
            
            processedRows += batches[i].length;
            updateProgress(processedRows, preparedData.length, `Batch ${i + 1}/${batches.length} tamamlandı`);
            
            // Delay between batches to avoid rate limiting
            if (i < batches.length - 1) {
                await GeminiAPI.delay(1500);
            }
        } catch (error) {
            console.error(`Batch ${i + 1} failed:`, error);
            showNotification(`Batch ${i + 1} hatası: ${error.message}`, 'warning');
            processedRows += batches[i].length;
        }
    }
    
    // Analysis complete
    AppState.isAnalyzing = false;
    elements.startAnalysisBtn.disabled = false;
    updateProgress(preparedData.length, preparedData.length, 'Analiz tamamlandı!');
    
    showNotification(`Analiz tamamlandı! ${AppState.analysisResults.length} sonuç elde edildi.`, 'success');
    
    // Display results
    displayResults();
    
    // Generate summary
    await generateSummary();
}

/**
 * Update progress bar
 */
function updateProgress(current, total, status) {
    const percent = Math.round((current / total) * 100);
    
    elements.progressFill.style.width = percent + '%';
    elements.progressCurrent.textContent = current;
    elements.progressTotal.textContent = total;
    elements.progressPercent.textContent = percent;
    elements.progressStatus.textContent = status;
}

/**
 * Display analysis results
 */
function displayResults() {
    const results = AppState.analysisResults;
    
    if (results.length === 0) {
        showNotification('Analiz sonucu bulunamadı', 'warning');
        return;
    }
    
    // Show results section
    elements.resultsSection.classList.remove('hidden');
    
    // Calculate statistics
    const stats = calculateStatistics(results);
    
    // Update stat cards
    elements.statTotal.textContent = stats.total;
    elements.statPositive.textContent = stats.positive;
    elements.statNegative.textContent = stats.negative;
    elements.statNeutral.textContent = stats.neutral;
    elements.statActionable.textContent = stats.actionable;
    
    // Display category bar chart
    displayCategoryBarChart(stats.categories);
    
    // Display sentiment pie chart
    displaySentimentPieChart(stats);
    
    // Display prominent themes
    displayProminentThemes(AppState.analysisResults);
    
    // Display results table
    displayResultsTable(results);
}

/**
 * Display prominent sub-themes (top sub-themes with counts)
 */
function displayProminentThemes(results) {
    const themeContainer = document.getElementById('prominent-themes');
    if (!themeContainer) return;
    
    // Count sub-themes (mainCategory + subTheme combinations)
    const themeCounts = {};
    results.forEach(item => {
        const themeKey = `${item.mainCategory} > ${item.subTheme}`;
        themeCounts[themeKey] = (themeCounts[themeKey] || 0) + 1;
    });
    
    // Sort and get top 10
    const sortedThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    // Clear container
    themeContainer.innerHTML = '';
    
    if (sortedThemes.length === 0) {
        themeContainer.innerHTML = '<p class="no-data">Tema bulunamadı</p>';
        return;
    }
    
    // Create theme list
    const themeList = document.createElement('div');
    themeList.className = 'theme-list';
    
    sortedThemes.forEach(([theme, count]) => {
        const themeItem = document.createElement('div');
        themeItem.className = 'theme-item';
        
        const themeText = document.createElement('div');
        themeText.className = 'theme-text';
        themeText.textContent = theme;
        
        const themeCount = document.createElement('div');
        themeCount.className = 'theme-count';
        themeCount.textContent = count;
        
        themeItem.appendChild(themeText);
        themeItem.appendChild(themeCount);
        themeList.appendChild(themeItem);
    });
    
    themeContainer.appendChild(themeList);
}

/**
 * Calculate statistics from results
 */
function calculateStatistics(results) {
    const stats = {
        total: results.length,
        positive: 0,
        negative: 0,
        neutral: 0,
        actionable: 0,
        categories: {}
    };
    
    results.forEach(item => {
        // Sentiment counts
        if (item.sentiment === 'Pozitif') stats.positive++;
        else if (item.sentiment === 'Negatif') stats.negative++;
        else if (item.sentiment === 'Nötr') stats.neutral++;
        
        // Actionable count
        if (item.actionable === true) stats.actionable++;
        
        // Category counts
        stats.categories[item.mainCategory] = (stats.categories[item.mainCategory] || 0) + 1;
    });
    
    return stats;
}

/**
 * Display category chart
 */
function displayCategoryChart(categories) {
    elements.categoryChart.innerHTML = '';
    
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);
    
    const maxCount = sortedCategories[0]?.[1] || 1;
    
    sortedCategories.forEach(([category, count]) => {
        const barDiv = document.createElement('div');
        barDiv.className = 'chart-bar';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'chart-label';
        labelDiv.textContent = category;
        
        const containerDiv = document.createElement('div');
        containerDiv.className = 'chart-bar-container';
        
        const fillDiv = document.createElement('div');
        fillDiv.className = 'chart-bar-fill';
        fillDiv.style.width = ((count / maxCount) * 100) + '%';
        fillDiv.textContent = count;
        
        containerDiv.appendChild(fillDiv);
        barDiv.appendChild(labelDiv);
        barDiv.appendChild(containerDiv);
        elements.categoryChart.appendChild(barDiv);
    });
}

/**
 * Display category distribution as horizontal bar chart
 */
function displayCategoryBarChart(categories) {
    const canvas = document.getElementById('category-bar-chart');
    if (!canvas) return;
    
    // Get container width for responsive sizing
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // Account for padding
    
    // Sort categories by count
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedCategories.length === 0) return;
    
    // Category colors
    const categoryColors = [
        { main: '#4285f4', gradient: '#5a9cf8' }, // Blue
        { main: '#00c853', gradient: '#00e676' }, // Green
        { main: '#ff9800', gradient: '#ffb74d' }, // Orange
        { main: '#f44336', gradient: '#ef5350' }, // Red
        { main: '#9c27b0', gradient: '#ba68c8' }, // Purple
        { main: '#00bcd4', gradient: '#4dd0e1' }, // Cyan
        { main: '#ffc107', gradient: '#ffca28' }, // Amber
        { main: '#e91e63', gradient: '#f06292' }  // Pink
    ];
    
    // Set canvas size with higher resolution - responsive
    const displayWidth = Math.min(containerWidth, 700);
    const barHeight = 45;
    const barSpacing = 18;
    const leftMargin = 220;
    const rightMargin = 70;
    const topMargin = 25;
    const bottomMargin = 25;
    const displayHeight = topMargin + (sortedCategories.length * (barHeight + barSpacing)) + bottomMargin;
    
    const pixelRatio = window.devicePixelRatio || 3;
    canvas.width = displayWidth * pixelRatio;
    canvas.height = displayHeight * pixelRatio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.scale(pixelRatio, pixelRatio);
    
    // Enable high quality text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRendering = 'geometricPrecision';
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    const maxValue = sortedCategories[0][1];
    const barMaxWidth = displayWidth - leftMargin - rightMargin;
    
    // Store bar positions for hover detection
    const barPositions = [];
    
    // Draw bars
    sortedCategories.forEach(([category, count], index) => {
        const y = topMargin + index * (barHeight + barSpacing);
        const barWidth = (count / maxValue) * barMaxWidth;
        const colors = categoryColors[index % categoryColors.length];
        
        // Store position for hover
        barPositions.push({
            x: leftMargin,
            y: y,
            width: barWidth,
            height: barHeight,
            category: category,
            count: count
        });
        
        // Draw category label with better font
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#455a64';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Truncate long category names
        let displayLabel = category;
        if (ctx.measureText(displayLabel).width > leftMargin - 20) {
            while (ctx.measureText(displayLabel + '...').width > leftMargin - 20 && displayLabel.length > 0) {
                displayLabel = displayLabel.slice(0, -1);
            }
            displayLabel += '...';
        }
        
        ctx.fillText(displayLabel, leftMargin - 12, y + barHeight / 2);
        
        // Draw bar with gradient
        if (barWidth > 0) {
            const gradient = ctx.createLinearGradient(leftMargin, 0, leftMargin + barMaxWidth, 0);
            gradient.addColorStop(0, colors.main);
            gradient.addColorStop(1, colors.gradient);
            ctx.fillStyle = gradient;
            roundRect(ctx, leftMargin, y, barWidth, barHeight, 10);
        }
        
        // Draw count label
        ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        
        if (barWidth > 60) {
            // White text inside bar
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 2;
            ctx.fillText(`Görüş Sayısı: ${count}`, leftMargin + 15, y + barHeight / 2);
            ctx.shadowBlur = 0;
        } else if (barWidth > 0) {
            // Dark text outside bar
            ctx.fillStyle = colors.main;
            ctx.fillText(count, leftMargin + barWidth + 8, y + barHeight / 2);
        }
    });
    
    // Add hover effect
    canvas.style.cursor = 'pointer';
    
    // Tooltip element
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.className = 'chart-tooltip';
        document.body.appendChild(tooltip);
    }
    
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let found = false;
        for (const bar of barPositions) {
            if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
                tooltip.innerHTML = `<strong>${bar.category}</strong><br>Görüş Sayısı: ${bar.count}`;
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
                found = true;
                break;
            }
        }
        
        if (!found) {
            tooltip.style.display = 'none';
        }
    };
    
    canvas.onmouseleave = () => {
        tooltip.style.display = 'none';
    };
}

/**
 * Helper function to draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

/**
 * Display sentiment distribution as pie chart with high quality text
 */
function displaySentimentPieChart(stats) {
    const canvas = document.getElementById('sentiment-pie-chart');
    if (!canvas) return;
    
    // Get container width for responsive sizing
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50;
    
    // Set high resolution - responsive
    const displaySize = Math.min(containerWidth, 400);
    const pixelRatio = window.devicePixelRatio || 3;
    canvas.width = displaySize * pixelRatio;
    canvas.height = displaySize * pixelRatio;
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.scale(pixelRatio, pixelRatio);
    
    // Enable high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRendering = 'geometricPrecision';
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displaySize, displaySize);
    
    const total = stats.total;
    if (total === 0) return;
    
    // Sentiment data - order: Pozitif, Negatif, Nötr
    const data = [
        { label: 'Pozitif', value: stats.positive, color: '#4caf50', lightColor: '#66bb6a' },
        { label: 'Negatif', value: stats.negative, color: '#ef5350', lightColor: '#ff6f60' },
        { label: 'Nötr', value: stats.neutral, color: '#9e9e9e', lightColor: '#bdbdbd' }
    ].filter(item => item.value > 0);
    
    // Calculate percentages
    const dataWithPercentages = data.map(item => ({
        ...item,
        percentage: ((item.value / total) * 100).toFixed(1)
    }));
    
    // Chart position and size
    const centerX = displaySize / 2;
    const centerY = displaySize / 2 - 15;
    const radius = 130;
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    // Draw pie slices
    dataWithPercentages.forEach((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // Draw slice with gradient
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, item.lightColor);
        gradient.addColorStop(1, item.color);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw white borders
    currentAngle = -Math.PI / 2;
    dataWithPercentages.forEach((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
    
    // Draw labels on slices with high quality font
    currentAngle = -Math.PI / 2;
    dataWithPercentages.forEach((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const middleAngle = currentAngle + sliceAngle / 2;
        
        // Only draw text if slice is large enough
        if (parseFloat(item.percentage) >= 8) {
            const textRadius = radius * 0.62;
            const textX = centerX + Math.cos(middleAngle) * textRadius;
            const textY = centerY + Math.sin(middleAngle) * textRadius;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = '#ffffff';
            
            // Draw percentage
            ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`${item.percentage}%`, textX, textY - 12);
            
            // Draw count
            ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`(${item.value})`, textX, textY + 14);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        currentAngle += sliceAngle;
    });
    
    // Draw legend at bottom
    const legendY = displaySize - 45;
    const legendItemWidth = displaySize / dataWithPercentages.length;
    
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    dataWithPercentages.forEach((item, index) => {
        const legendX = (index + 0.5) * legendItemWidth;
        
        // Draw colored circle with border
        ctx.beginPath();
        ctx.arc(legendX - 35, legendY, 9, 0, 2 * Math.PI);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, legendX - 22, legendY);
    });
}

/**
 * Display results table with pagination
 */
function displayResultsTable(results) {
    // Merge analysis results with original data
    const mergedData = results.map(result => {
        const originalItem = AppState.originalData.find(item => item.entryId === result.entryId);
        return {
            ...result,
            originalOpinion: originalItem?.opinion || '',
            course: originalItem?.course || '',
            grade: originalItem?.grade || '',
            branch: originalItem?.branch || ''
        };
    });
    
    // Calculate pagination
    AppState.pagination.totalPages = Math.ceil(mergedData.length / AppState.pagination.itemsPerPage);
    
    // Get current page data
    const startIndex = (AppState.pagination.currentPage - 1) * AppState.pagination.itemsPerPage;
    const endIndex = startIndex + AppState.pagination.itemsPerPage;
    const pageData = mergedData.slice(startIndex, endIndex);
    
    // Clear table
    elements.resultsTbody.innerHTML = '';
    
    // Populate table
    pageData.forEach(item => {
        const row = document.createElement('tr');
        
        const sentimentClass = `sentiment-${item.sentiment?.toLowerCase() || 'notr'}`;
        const actionableText = item.actionable ? 'Evet' : 'Hayır';
        
        row.innerHTML = `
            <td>${escapeHtml(item.entryId)}</td>
            <td class="opinion-cell" title="${escapeHtml(item.originalOpinion)}">${escapeHtml(item.originalOpinion)}</td>
            <td>${escapeHtml(item.branch)}</td>
            <td>${escapeHtml(item.grade)}</td>
            <td>${escapeHtml(item.course)}</td>
            <td>${escapeHtml(item.mainCategory)}</td>
            <td>${escapeHtml(item.subTheme)}</td>
            <td class="${sentimentClass}">${escapeHtml(item.sentiment)}</td>
            <td>${actionableText}</td>
        `;
        
        elements.resultsTbody.appendChild(row);
    });
    
    // Update pagination controls
    updatePaginationControls();
}

/**
 * Truncate text for display
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
    const paginationDiv = document.getElementById('pagination-controls');
    if (!paginationDiv) return;
    
    const { currentPage, totalPages, itemsPerPage } = AppState.pagination;
    const totalItems = AppState.analysisResults.length;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    paginationDiv.innerHTML = `
        <div class="pagination-info">
            Gösterilen: ${startItem}-${endItem} / Toplam: ${totalItems}
        </div>
        <div class="pagination-buttons">
            <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>İlk</button>
            <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Önceki</button>
            <span class="page-numbers">
                ${generatePageNumbers(currentPage, totalPages)}
            </span>
            <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Sonraki</button>
            <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Son</button>
        </div>
        <div class="items-per-page">
            <label>Sayfa başına:</label>
            <select onchange="changeItemsPerPage(this.value)">
                <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                <option value="150" ${itemsPerPage === 150 ? 'selected' : ''}>150</option>
                <option value="200" ${itemsPerPage === 200 ? 'selected' : ''}>200</option>
            </select>
        </div>
    `;
}

/**
 * Generate page numbers for pagination
 */
function generatePageNumbers(currentPage, totalPages) {
    let pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            pages.push(`<button class="page-btn active" disabled>${i}</button>`);
        } else {
            pages.push(`<button class="page-btn" onclick="goToPage(${i})">${i}</button>`);
        }
    }
    
    return pages.join('');
}

/**
 * Go to specific page
 */
function goToPage(page) {
    AppState.pagination.currentPage = page;
    displayResultsTable(AppState.analysisResults);
}

/**
 * Change items per page
 */
function changeItemsPerPage(value) {
    AppState.pagination.itemsPerPage = parseInt(value);
    AppState.pagination.currentPage = 1; // Reset to first page
    displayResultsTable(AppState.analysisResults);
}

/**
 * Generate executive summary
 */
async function generateSummary() {
    elements.summarySection.classList.remove('hidden');
    elements.summaryLoading.classList.remove('hidden');
    elements.summaryContent.textContent = '';
    
    try {
        const summary = await GeminiAPI.generateExecutiveSummary(AppState.analysisResults);
        elements.summaryLoading.classList.add('hidden');
        elements.summaryContent.textContent = summary;
    } catch (error) {
        elements.summaryLoading.classList.add('hidden');
        
        // Check if it's a service overload error
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            elements.summaryContent.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Gemini API Geçici Olarak Aşırı Yüklü</h3>
                    <p>Yönetici özeti şu anda oluşturulamıyor. API servisi yoğun. Lütfen:</p>
                    <ul>
                        <li>Birkaç dakika sonra tekrar deneyin</li>
                        <li>Veya analiz sonuçlarını Excel olarak indirip inceleyebilirsiniz</li>
                    </ul>
                    <p><em>Not: Analiz sonuçları başarıyla tamamlandı, sadece özet oluşturulamadı.</em></p>
                </div>
            `;
        } else {
            elements.summaryContent.textContent = 'Özet oluşturulurken hata oluştu: ' + error.message;
        }
        console.error('Summary generation error:', error);
    }
}

/**
 * Download results as Excel with complete data
 */
function downloadExcel() {
    try {
        // Merge analysis results with original data
        const exportData = AppState.analysisResults.map(result => {
            const originalItem = AppState.originalData.find(item => item.entryId === result.entryId);
            return {
                'Entry Id': result.entryId,
                'Orijinal Görüş': originalItem?.opinion || '',
                'Branş': originalItem?.branch || '',
                'Sınıf': originalItem?.grade || '',
                'Ders': originalItem?.course || '',
                'Ana Kategori': result.mainCategory,
                'Alt Tema': result.subTheme,
                'Duygu Durumu': result.sentiment,
                'Aksiyon Gerektirir': result.actionable ? 'Evet' : 'Hayır'
            };
        });
        
        ExcelHandler.exportToExcel(exportData);
        showNotification('Excel dosyası indirildi', 'success');
    } catch (error) {
        showNotification('Excel indirme hatası: ' + error.message, 'error');
        console.error('Excel download error:', error);
    }
}

/**
 * Download results as JSON
 */
function downloadJSON() {
    try {
        ExcelHandler.exportToJSON(AppState.analysisResults);
        showNotification('JSON dosyası indirildi', 'success');
    } catch (error) {
        showNotification('JSON indirme hatası: ' + error.message, 'error');
        console.error('JSON download error:', error);
    }
}

/**
 * Show notification to user with toast
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make pagination functions globally accessible
window.goToPage = goToPage;
window.changeItemsPerPage = changeItemsPerPage;

