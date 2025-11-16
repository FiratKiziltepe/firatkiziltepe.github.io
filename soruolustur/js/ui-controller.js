/**
 * UI Controller Module
 * Manages all UI updates and interactions
 */

/**
 * UI Controller Class
 */
export class UIController {
    constructor() {
        this.currentTab = 'setup';
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.filteredResults = [];
    }

    /**
     * Initialize UI
     */
    initialize() {
        this.setupTabs();
        this.setupModals();
    }

    /**
     * Setup tab navigation
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;

                // Update buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                });

                const activeContent = document.getElementById(`${tabName}-tab`);
                if (activeContent) {
                    activeContent.classList.add('active');
                    activeContent.classList.remove('hidden');
                }

                this.currentTab = tabName;
            });
        });
    }

    /**
     * Setup modals
     */
    setupModals() {
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    /**
     * Switch to tab
     */
    switchToTab(tabName) {
        const button = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        if (button) {
            button.click();
        }
    }

    /**
     * Show/Hide elements
     */
    show(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    /**
     * Update PDF info display
     */
    updatePDFInfo(info) {
        document.getElementById('pdfFileName').textContent = info.fileName;
        document.getElementById('pdfPages').textContent = info.totalPages;
        document.getElementById('pdfSize').textContent = info.fileSize;

        this.show('pdfInfo');
        this.show('pageSelection');
    }

    /**
     * Update API status
     */
    updateAPIStatus(isConnected, message = '') {
        const statusIcon = document.getElementById('apiStatusIcon');
        const statusText = document.getElementById('apiStatusText');

        if (isConnected) {
            statusIcon.className = 'fas fa-circle text-xs text-green-400';
            statusText.textContent = message || 'API Bağlı';
        } else {
            statusIcon.className = 'fas fa-circle text-xs text-red-400';
            statusText.textContent = message || 'API Bağlantısı Yok';
        }
    }

    /**
     * Update estimation box
     */
    updateEstimation(estimation) {
        document.getElementById('estRequests').textContent = estimation.requests;
        document.getElementById('estQuestions').textContent = estimation.questions;
        document.getElementById('estTime').textContent = estimation.time;

        this.show('estimationBox');
    }

    /**
     * Update model info
     */
    updateModelInfo(modelInfo) {
        const infoDiv = document.getElementById('modelInfo');
        infoDiv.innerHTML = `
            <strong>RPM:</strong> ${modelInfo.rpm} &nbsp;|&nbsp;
            <strong>TPM:</strong> ${modelInfo.tpm.toLocaleString()} &nbsp;|&nbsp;
            <strong>Context:</strong> ${(modelInfo.contextWindow / 1000000).toFixed(1)}M tokens
        `;
    }

    /**
     * Update distribution preview
     */
    updateDistributionPreview(distribution) {
        const contentDiv = document.getElementById('distributionContent');

        if (distribution.types.length === 0) {
            contentDiv.innerHTML = '<p class="text-gray-600">Soru tipi seçilmedi</p>';
            return;
        }

        const html = distribution.types.map(type => `
            <div class="flex justify-between items-center">
                <span>${type.name}</span>
                <span class="font-semibold">${type.count} soru</span>
            </div>
        `).join('');

        contentDiv.innerHTML = html;
    }

    /**
     * Render question types list
     */
    renderQuestionTypes(types, selectedIds = []) {
        const container = document.getElementById('questionTypesList');

        container.innerHTML = types.map(type => `
            <label class="question-type-card ${selectedIds.includes(type.id) ? 'selected' : ''}">
                <div class="flex items-start gap-3">
                    <input type="checkbox"
                           class="question-type-checkbox"
                           data-type-id="${type.id}"
                           ${selectedIds.includes(type.id) ? 'checked' : ''}>
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${type.name}</div>
                        <div class="text-sm text-gray-600">${type.description}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-lightbulb mr-1"></i>${type.example}
                        </div>
                        ${type.isCustom ? '<span class="badge badge-primary mt-1">Özel</span>' : ''}
                    </div>
                    ${type.isCustom ? `
                        <button class="text-red-500 hover:text-red-700 delete-custom-type" data-type-id="${type.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </label>
        `).join('');
    }

    /**
     * Update progress
     */
    updateProgress(progress) {
        // Progress bar
        document.getElementById('progressBar').style.width = `${progress.percentage}%`;
        document.getElementById('progressPercent').textContent = `${progress.percentage}%`;

        // Statistics
        document.getElementById('currentBatch').textContent =
            `${progress.completedBatches}/${progress.totalBatches}`;
        document.getElementById('questionsGenerated').textContent = progress.totalQuestions;

        // Rate limit status
        const rateLimitEl = document.getElementById('rateLimitStatus');
        if (progress.rateLimiterStatus.remainingRPM > 0) {
            rateLimitEl.textContent = 'OK';
            rateLimitEl.className = 'stat-value text-green-600';
        } else {
            rateLimitEl.textContent = 'WAIT';
            rateLimitEl.className = 'stat-value text-yellow-600';
        }
    }

    /**
     * Update time remaining
     */
    updateTimeRemaining(timeMs) {
        const seconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        let timeStr;
        if (hours > 0) {
            timeStr = `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else if (minutes > 0) {
            timeStr = `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            timeStr = `0:${String(seconds).padStart(2, '0')}`;
        }

        document.getElementById('timeRemaining').textContent = timeStr;
    }

    /**
     * Add log entry
     */
    addLogEntry(message, type = 'info') {
        const logDiv = document.getElementById('activityLog');
        const timestamp = new Date().toLocaleTimeString('tr-TR');

        const icon = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle'
        }[type] || 'fa-info-circle';

        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `<i class="fas ${icon} mr-2"></i>[${timestamp}] ${message}`;

        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    /**
     * Clear activity log
     */
    clearActivityLog() {
        const logDiv = document.getElementById('activityLog');
        logDiv.innerHTML = '<div class="opacity-75">İşleme başlamayı bekliyor...</div>';
    }

    /**
     * Render results table
     */
    renderResultsTable(results, page = 1) {
        this.filteredResults = results;
        this.currentPage = page;

        const tbody = document.getElementById('resultsTableBody');
        const start = (page - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageResults = results.slice(start, end);

        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2 opacity-50"></i>
                        <p>Henüz soru üretilmedi</p>
                    </td>
                </tr>
            `;
            this.hide('pagination');
            return;
        }

        tbody.innerHTML = pageResults.map((result, index) => `
            <tr data-result-index="${start + index}">
                <td class="px-4 py-3 text-sm text-gray-900">${start + index + 1}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${result.pageNumber || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="truncate-2-lines">${result.question}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700">
                    <div class="truncate-2-lines">${result.answer}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="badge badge-primary">${result.questionType}</span>
                </td>
                <td class="px-4 py-3 text-sm">
                    <button class="text-blue-600 hover:text-blue-800 mr-2 copy-qa" data-index="${start + index}">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-qa" data-index="${start + index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update pagination
        this.updatePagination(results.length, page);

        // Update count
        document.getElementById('resultsCount').textContent = `(${results.length} soru)`;

        // Enable export/clear buttons
        document.getElementById('exportExcel').disabled = false;
        document.getElementById('clearResults').disabled = false;
    }

    /**
     * Add new result to table (real-time)
     */
    addResultToTable(result) {
        // This will be called when a new result arrives
        // For now, we'll just re-render the table
        // In a more optimized version, we'd append to the table
    }

    /**
     * Update pagination
     */
    updatePagination(totalItems, currentPage) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            this.hide('pagination');
            return;
        }

        this.show('pagination');

        const start = (currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(currentPage * this.itemsPerPage, totalItems);

        document.getElementById('paginationInfo').textContent = `${start}-${end} / ${totalItems}`;

        // Page numbers
        const pageNumbersDiv = document.getElementById('pageNumbers');
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        let html = '';
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="page-number ${i === currentPage ? 'active' : ''}"
                        data-page="${i}">${i}</button>
            `;
        }

        pageNumbersDiv.innerHTML = html;

        // Prev/Next buttons
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <i class="fas ${this.getToastIcon(type)} text-xl"></i>
                <div class="flex-1">
                    <p class="font-medium">${message}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Get toast icon
     */
    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Show loading state
     */
    showLoading(buttonId, text = 'İşleniyor...') {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<span class="spinner mr-2"></span>${text}`;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    /**
     * Update filter dropdown
     */
    updateFilterDropdown(questionTypes) {
        const select = document.getElementById('filterQuestionType');
        const currentValue = select.value;

        select.innerHTML = '<option value="">Tümü</option>' +
            questionTypes.map(type =>
                `<option value="${type}">${type}</option>`
            ).join('');

        select.value = currentValue;
    }

    /**
     * Show processing section
     */
    showProcessingSection() {
        this.show('progressSection');
        this.clearActivityLog();
    }

    /**
     * Hide processing section
     */
    hideProcessingSection() {
        this.hide('progressSection');
    }

    /**
     * Disable controls during processing
     */
    setProcessingState(isProcessing) {
        const button = document.getElementById('startProcessing');

        if (isProcessing) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>İşleniyor...';
            this.show('pauseProcessing');
            this.hide('resumeProcessing');
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-rocket mr-2"></i>Soru Üretmeye Başla';
            this.hide('pauseProcessing');
            this.hide('resumeProcessing');
        }
    }

    /**
     * Set paused state
     */
    setPausedState(isPaused) {
        if (isPaused) {
            this.hide('pauseProcessing');
            this.show('resumeProcessing');
        } else {
            this.show('pauseProcessing');
            this.hide('resumeProcessing');
        }
    }
}

// Export singleton instance
export default new UIController();
