/**
 * Main Application Module
 * Orchestrates all components and manages application state
 */

import StorageManager from './storage.js';
import QuestionTypesManager from './question-types.js';
import PDFHandler from './pdf-handler.js';
import { RateLimiter, MODEL_LIMITS } from './rate-limiter.js';
import GeminiAPIClient from './api-client.js';
import BatchProcessor from './batch-processor.js';
import ExcelExporter from './excel-exporter.js';
import UIController from './ui-controller.js';

/**
 * Application Class
 */
class Application {
    constructor() {
        // Managers
        this.storage = StorageManager;
        this.questionTypes = QuestionTypesManager;
        this.pdfHandler = PDFHandler;
        this.ui = UIController;
        this.excelExporter = ExcelExporter;

        // API components (will be initialized when API key is set)
        this.apiClient = null;
        this.rateLimiter = null;
        this.batchProcessor = null;

        // Application state
        this.state = {
            pdfLoaded: false,
            apiKeySet: false,
            processing: false,
            selectedPages: [],
            selectedTypes: [],
            results: []
        };

        // Configuration
        this.config = {
            model: 'gemini-2.0-flash-exp',
            questionsPerPage: 5,
            batchStrategy: 'page-by-page',
            batchSize: 5
        };
    }

    /**
     * Initialize application
     */
    async initialize() {
        console.log('Initializing PDF Question Generator...');

        // Initialize UI
        this.ui.initialize();

        // Load saved settings
        this.loadSettings();

        // Setup event listeners
        this.setupEventListeners();

        // Check welcome message
        this.checkWelcomeMessage();

        console.log('Application initialized successfully');
    }

    /**
     * Load saved settings
     */
    loadSettings() {
        // Load API key
        const apiKey = this.storage.loadApiKey();
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
            this.initializeAPIComponents(apiKey, this.config.model);
        }

        // Load settings
        const settings = this.storage.loadSettings();
        if (settings) {
            this.config = { ...this.config, ...settings };

            // Apply to UI
            document.getElementById('modelSelect').value = settings.model;
            document.getElementById('questionsPerPage').value = settings.questionsPerPage;

            if (settings.batchStrategy) {
                document.querySelector(`input[name="batchStrategy"][value="${settings.batchStrategy}"]`).checked = true;
            }

            if (settings.batchSize) {
                document.getElementById('batchSize').value = settings.batchSize;
            }
        }

        // Load question types
        this.renderQuestionTypes();
    }

    /**
     * Check welcome message
     */
    checkWelcomeMessage() {
        if (this.storage.isWelcomeDismissed()) {
            this.ui.hide('welcomeMessage');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // PDF Upload
        const pdfInput = document.getElementById('pdfInput');
        const dropZone = document.getElementById('dropZone');

        pdfInput.addEventListener('change', (e) => this.handlePDFUpload(e.target.files[0]));

        dropZone.addEventListener('click', () => pdfInput.click());

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

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.handlePDFUpload(files[0]);
            }
        });

        // Page Selection
        document.getElementById('selectAllPages').addEventListener('click', () => {
            this.ui.hide('pageRange');
            this.updateSelectedPages();
        });

        document.getElementById('customPages').addEventListener('click', () => {
            this.ui.show('pageRange');
            document.getElementById('pageRange').focus();
        });

        document.getElementById('pageRange').addEventListener('input', () => {
            this.updateSelectedPages();
        });

        // API Key
        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKey');
            const icon = document.querySelector('#toggleApiKey i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });

        document.getElementById('apiKey').addEventListener('change', (e) => {
            this.handleAPIKeyChange(e.target.value);
        });

        document.getElementById('testApiKey').addEventListener('click', () => {
            this.testAPIConnection();
        });

        document.getElementById('clearApiKey').addEventListener('click', () => {
            document.getElementById('apiKey').value = '';
            this.storage.clearApiKey();
            this.ui.updateAPIStatus(false, 'API Anahtarı Temizlendi');
            this.state.apiKeySet = false;
        });

        // Model Selection
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.handleModelChange(e.target.value);
        });

        // Question Types
        document.getElementById('selectAllTypes').addEventListener('click', () => {
            this.selectAllQuestionTypes();
        });

        document.getElementById('deselectAllTypes').addEventListener('click', () => {
            this.deselectAllQuestionTypes();
        });

        document.getElementById('addCustomType').addEventListener('click', () => {
            this.ui.showModal('customTypeModal');
        });

        document.getElementById('saveCustomType').addEventListener('click', () => {
            this.saveCustomQuestionType();
        });

        // Configuration
        document.getElementById('questionsPerPage').addEventListener('input', () => {
            this.updateDistributionPreview();
            this.updateEstimation();
        });

        document.querySelectorAll('input[name="batchStrategy"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleBatchStrategyChange(e.target.value);
            });
        });

        document.getElementById('batchSize').addEventListener('input', () => {
            this.updateEstimation();
        });

        // Processing
        document.getElementById('startProcessing').addEventListener('click', () => {
            this.startProcessing();
        });

        document.getElementById('pauseProcessing').addEventListener('click', () => {
            this.pauseProcessing();
        });

        document.getElementById('resumeProcessing').addEventListener('click', () => {
            this.resumeProcessing();
        });

        document.getElementById('cancelProcessing').addEventListener('click', () => {
            this.cancelProcessing();
        });

        // Results
        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('clearResults').addEventListener('click', () => {
            this.clearResults();
        });

        document.getElementById('filterQuestionType').addEventListener('change', () => {
            this.filterResults();
        });

        document.getElementById('searchResults').addEventListener('input', () => {
            this.filterResults();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('filterQuestionType').value = '';
            document.getElementById('searchResults').value = '';
            this.filterResults();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.ui.currentPage > 1) {
                this.ui.renderResultsTable(this.ui.filteredResults, this.ui.currentPage - 1);
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.ui.filteredResults.length / this.ui.itemsPerPage);
            if (this.ui.currentPage < totalPages) {
                this.ui.renderResultsTable(this.ui.filteredResults, this.ui.currentPage + 1);
            }
        });

        // Welcome message
        document.getElementById('closeWelcome').addEventListener('click', () => {
            this.ui.hide('welcomeMessage');
            this.storage.setWelcomeDismissed();
        });

        // Help
        document.getElementById('showHelp').addEventListener('click', () => {
            this.ui.showModal('helpModal');
        });

        // Delegate events for dynamic elements
        document.addEventListener('click', (e) => {
            // Question type checkboxes
            if (e.target.classList.contains('question-type-checkbox')) {
                this.handleQuestionTypeToggle(e.target);
            }

            // Delete custom type
            if (e.target.closest('.delete-custom-type')) {
                const button = e.target.closest('.delete-custom-type');
                this.deleteCustomQuestionType(button.dataset.typeId);
            }

            // Copy Q&A
            if (e.target.closest('.copy-qa')) {
                const button = e.target.closest('.copy-qa');
                this.copyQuestionAnswer(parseInt(button.dataset.index));
            }

            // Delete Q&A
            if (e.target.closest('.delete-qa')) {
                const button = e.target.closest('.delete-qa');
                this.deleteQuestionAnswer(parseInt(button.dataset.index));
            }

            // Pagination
            if (e.target.classList.contains('page-number')) {
                const page = parseInt(e.target.dataset.page);
                this.ui.renderResultsTable(this.ui.filteredResults, page);
            }
        });
    }

    /**
     * Handle PDF upload
     */
    async handlePDFUpload(file) {
        if (!file) return;

        this.ui.showLoading('startProcessing', 'PDF Yükleniyor...');

        const result = await this.pdfHandler.loadPDF(file);

        this.ui.hideLoading('startProcessing');

        if (result.success) {
            this.ui.updatePDFInfo(result);
            this.state.pdfLoaded = true;
            this.updateSelectedPages();
            this.ui.showToast('PDF başarıyla yüklendi', 'success');
        } else {
            this.ui.showToast(`PDF yükleme hatası: ${result.error}`, 'error');
        }
    }

    /**
     * Update selected pages
     */
    updateSelectedPages() {
        if (!this.state.pdfLoaded) return;

        const pageRangeInput = document.getElementById('pageRange');
        const selectionString = pageRangeInput.classList.contains('hidden')
            ? ''
            : pageRangeInput.value;

        const validation = this.pdfHandler.validatePageSelection(selectionString);

        if (validation.valid) {
            this.state.selectedPages = validation.pages;
            document.getElementById('selectedPagesInfo').textContent =
                `Seçili: ${validation.count} sayfa`;
            document.getElementById('selectedPagesInfo').className = 'text-sm text-green-600';
            this.updateEstimation();
        } else {
            document.getElementById('selectedPagesInfo').textContent =
                `Hata: ${validation.error}`;
            document.getElementById('selectedPagesInfo').className = 'text-sm text-red-600';
        }
    }

    /**
     * Handle API key change
     */
    handleAPIKeyChange(apiKey) {
        if (apiKey && apiKey.trim() !== '') {
            this.storage.saveApiKey(apiKey);
            this.initializeAPIComponents(apiKey, this.config.model);
            this.state.apiKeySet = true;
            this.ui.updateAPIStatus(true, 'API Anahtarı Kaydedildi');
        }
    }

    /**
     * Initialize API components
     */
    initializeAPIComponents(apiKey, model) {
        this.apiClient = new GeminiAPIClient(apiKey, model);
        this.rateLimiter = new RateLimiter(model);

        if (this.batchProcessor) {
            this.batchProcessor.apiClient = this.apiClient;
            this.batchProcessor.rateLimiter = this.rateLimiter;
        }

        this.ui.updateModelInfo(this.rateLimiter.getModelInfo());
    }

    /**
     * Test API connection
     */
    async testAPIConnection() {
        if (!this.apiClient) {
            this.ui.showToast('Lütfen önce API anahtarı girin', 'warning');
            return;
        }

        this.ui.showLoading('testApiKey', 'Test Ediliyor...');

        const result = await this.apiClient.testConnection();

        this.ui.hideLoading('testApiKey');

        if (result.success) {
            this.ui.updateAPIStatus(true, 'API Bağlantısı Başarılı');
            this.ui.showToast(result.message, 'success');
        } else {
            this.ui.updateAPIStatus(false, 'API Bağlantısı Başarısız');
            this.ui.showToast(result.message, 'error');
        }
    }

    /**
     * Handle model change
     */
    handleModelChange(model) {
        this.config.model = model;
        this.saveSettings();

        if (this.state.apiKeySet) {
            const apiKey = this.storage.loadApiKey();
            this.initializeAPIComponents(apiKey, model);
        }

        this.updateEstimation();
    }

    /**
     * Render question types
     */
    renderQuestionTypes() {
        const types = this.questionTypes.getAllTypes();
        this.ui.renderQuestionTypes(types, this.state.selectedTypes);
    }

    /**
     * Handle question type toggle
     */
    handleQuestionTypeToggle(checkbox) {
        const typeId = checkbox.dataset.typeId;
        const card = checkbox.closest('.question-type-card');

        if (checkbox.checked) {
            this.state.selectedTypes.push(typeId);
            card.classList.add('selected');
        } else {
            this.state.selectedTypes = this.state.selectedTypes.filter(id => id !== typeId);
            card.classList.remove('selected');
        }

        this.updateDistributionPreview();
        this.updateEstimation();
        this.saveSettings();
    }

    /**
     * Select all question types
     */
    selectAllQuestionTypes() {
        const checkboxes = document.querySelectorAll('.question-type-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.question-type-card').classList.add('selected');
        });

        this.state.selectedTypes = this.questionTypes.getAllTypes().map(t => t.id);
        this.updateDistributionPreview();
        this.updateEstimation();
    }

    /**
     * Deselect all question types
     */
    deselectAllQuestionTypes() {
        const checkboxes = document.querySelectorAll('.question-type-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.question-type-card').classList.remove('selected');
        });

        this.state.selectedTypes = [];
        this.updateDistributionPreview();
        this.updateEstimation();
    }

    /**
     * Save custom question type
     */
    saveCustomQuestionType() {
        const name = document.getElementById('customTypeName').value.trim();
        const nameEn = document.getElementById('customTypeNameEn').value.trim();
        const description = document.getElementById('customTypeDesc').value.trim();
        const example = document.getElementById('customTypeExample').value.trim();

        const validation = this.questionTypes.validateTypeData({ name, nameEn, description, example });

        if (!validation.isValid) {
            this.ui.showToast(validation.errors.join(', '), 'error');
            return;
        }

        this.questionTypes.addCustomType({ name, nameEn, description, example });
        this.renderQuestionTypes();

        // Clear form
        document.getElementById('customTypeName').value = '';
        document.getElementById('customTypeNameEn').value = '';
        document.getElementById('customTypeDesc').value = '';
        document.getElementById('customTypeExample').value = '';

        this.ui.hideModal('customTypeModal');
        this.ui.showToast('Özel soru tipi eklendi', 'success');
    }

    /**
     * Delete custom question type
     */
    deleteCustomQuestionType(typeId) {
        if (confirm('Bu özel soru tipini silmek istediğinizden emin misiniz?')) {
            this.questionTypes.deleteCustomType(typeId);
            this.state.selectedTypes = this.state.selectedTypes.filter(id => id !== typeId);
            this.renderQuestionTypes();
            this.ui.showToast('Özel soru tipi silindi', 'success');
        }
    }

    /**
     * Update distribution preview
     */
    updateDistributionPreview() {
        const questionsPerPage = parseInt(document.getElementById('questionsPerPage').value) || 5;
        const selectedTypes = this.state.selectedTypes.length > 0
            ? this.questionTypes.getAllTypes().filter(t => this.state.selectedTypes.includes(t.id))
            : this.questionTypes.getDefaultTypes();

        const questionsPerType = Math.floor(questionsPerPage / selectedTypes.length);
        const remainder = questionsPerPage % selectedTypes.length;

        const distribution = {
            types: selectedTypes.map((type, index) => ({
                name: type.name,
                count: questionsPerType + (index < remainder ? 1 : 0)
            }))
        };

        this.ui.updateDistributionPreview(distribution);
    }

    /**
     * Update estimation
     */
    updateEstimation() {
        if (!this.state.pdfLoaded || this.state.selectedPages.length === 0) {
            this.ui.hide('estimationBox');
            return;
        }

        const strategy = document.querySelector('input[name="batchStrategy"]:checked').value;
        const batchSize = parseInt(document.getElementById('batchSize').value) || 5;
        const questionsPerPage = parseInt(document.getElementById('questionsPerPage').value) || 5;

        const batches = strategy === 'page-by-page'
            ? this.state.selectedPages.length
            : Math.ceil(this.state.selectedPages.length / batchSize);

        const totalQuestions = this.state.selectedPages.length * questionsPerPage;

        let estimatedTime = 'Hesaplanıyor...';
        if (this.rateLimiter) {
            const estimation = this.batchProcessor
                ? this.batchProcessor.estimateProcessingTime(
                    this.state.selectedPages.length,
                    strategy,
                    batchSize,
                    this.config.model
                )
                : { estimatedFormatted: 'Hazırlanıyor...' };

            estimatedTime = estimation.estimatedFormatted;
        }

        this.ui.updateEstimation({
            requests: batches,
            questions: totalQuestions,
            time: estimatedTime
        });
    }

    /**
     * Handle batch strategy change
     */
    handleBatchStrategyChange(strategy) {
        this.config.batchStrategy = strategy;

        if (strategy === 'batch-by-pages') {
            this.ui.show('batchSizeContainer');
        } else {
            this.ui.hide('batchSizeContainer');
        }

        this.updateEstimation();
        this.saveSettings();
    }

    /**
     * Start processing
     */
    async startProcessing() {
        // Validation
        if (!this.state.pdfLoaded) {
            this.ui.showToast('Lütfen önce bir PDF yükleyin', 'warning');
            return;
        }

        if (!this.state.apiKeySet) {
            this.ui.showToast('Lütfen API anahtarı girin', 'warning');
            this.ui.switchToTab('setup');
            return;
        }

        if (this.state.selectedPages.length === 0) {
            this.ui.showToast('Lütfen işlenecek sayfaları seçin', 'warning');
            return;
        }

        // Initialize batch processor
        this.batchProcessor = new BatchProcessor(
            this.pdfHandler,
            this.apiClient,
            this.rateLimiter,
            this.questionTypes
        );

        // Set callbacks
        this.batchProcessor.setCallbacks({
            onProgress: (progress) => {
                this.ui.updateProgress(progress);
                const timeRemaining = this.rateLimiter.estimateCompletionTime();
                this.ui.updateTimeRemaining(timeRemaining);
            },
            onBatchComplete: (batch, questions) => {
                this.ui.addLogEntry(`Grup ${batch.id} tamamlandı: ${questions.length} soru`, 'success');
                this.state.results.push(...questions);
                this.ui.renderResultsTable(this.state.results);
                this.updateFilterDropdown();
            },
            onComplete: (summary) => {
                this.ui.addLogEntry(`İşleme tamamlandı! ${summary.totalQuestions} soru üretildi`, 'success');
                this.ui.setProcessingState(false);
                this.state.processing = false;
                this.ui.showToast('Soru üretimi tamamlandı!', 'success', 5000);
                this.ui.switchToTab('results');
            },
            onError: (error, batch) => {
                this.ui.addLogEntry(`Hata: ${error.message}`, 'error');
            }
        });

        // Prepare config
        const processingConfig = {
            pageNumbers: this.state.selectedPages,
            batchStrategy: this.config.batchStrategy,
            batchSize: parseInt(document.getElementById('batchSize').value) || 5,
            questionsPerPage: parseInt(document.getElementById('questionsPerPage').value) || 5,
            selectedTypes: this.state.selectedTypes,
            model: this.config.model
        };

        // Start processing
        this.state.processing = true;
        this.ui.setProcessingState(true);
        this.ui.showProcessingSection();
        this.ui.switchToTab('process');

        try {
            await this.batchProcessor.process(processingConfig);
        } catch (error) {
            this.ui.showToast(`İşleme hatası: ${error.message}`, 'error');
            this.ui.setProcessingState(false);
            this.state.processing = false;
        }
    }

    /**
     * Pause processing
     */
    pauseProcessing() {
        if (this.batchProcessor && this.batchProcessor.pause()) {
            this.ui.setPausedState(true);
            this.ui.showToast('İşleme duraklatıldı', 'warning');
        }
    }

    /**
     * Resume processing
     */
    resumeProcessing() {
        if (this.batchProcessor && this.batchProcessor.resume()) {
            this.ui.setPausedState(false);
            this.ui.showToast('İşleme devam ediyor', 'info');
        }
    }

    /**
     * Cancel processing
     */
    cancelProcessing() {
        if (confirm('İşlemi iptal etmek istediğinizden emin misiniz?')) {
            if (this.batchProcessor && this.batchProcessor.cancel()) {
                this.ui.addLogEntry('İşleme iptal edildi', 'warning');
                this.ui.setProcessingState(false);
                this.state.processing = false;
                this.ui.showToast('İşleme iptal edildi', 'warning');
            }
        }
    }

    /**
     * Filter results
     */
    filterResults() {
        const typeFilter = document.getElementById('filterQuestionType').value;
        const searchTerm = document.getElementById('searchResults').value.toLowerCase();

        let filtered = [...this.state.results];

        if (typeFilter) {
            filtered = filtered.filter(r => r.questionType === typeFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.question.toLowerCase().includes(searchTerm) ||
                r.answer.toLowerCase().includes(searchTerm)
            );
        }

        this.ui.renderResultsTable(filtered, 1);
    }

    /**
     * Update filter dropdown
     */
    updateFilterDropdown() {
        const uniqueTypes = [...new Set(this.state.results.map(r => r.questionType))];
        this.ui.updateFilterDropdown(uniqueTypes);
    }

    /**
     * Export results
     */
    exportResults() {
        if (this.state.results.length === 0) {
            this.ui.showToast('Dışa aktarılacak soru yok', 'warning');
            return;
        }

        const summary = this.batchProcessor ? this.batchProcessor.getSummary() : {
            totalBatches: 0,
            completedBatches: 0,
            totalQuestions: this.state.results.length,
            errorCount: 0,
            duration: 0,
            durationFormatted: '-',
            config: this.config
        };

        const result = this.excelExporter.exportToExcel(
            this.state.results,
            summary,
            this.pdfHandler.fileName
        );

        if (result.success) {
            this.ui.showToast(`Excel dosyası indirildi: ${result.filename}`, 'success');
        } else {
            this.ui.showToast(`Dışa aktarma hatası: ${result.error}`, 'error');
        }
    }

    /**
     * Clear results
     */
    clearResults() {
        if (confirm('Tüm sonuçları silmek istediğinizden emin misiniz?')) {
            this.state.results = [];
            this.ui.renderResultsTable([]);
            this.ui.showToast('Sonuçlar temizlendi', 'info');

            if (this.batchProcessor) {
                this.batchProcessor.clearResults();
            }
        }
    }

    /**
     * Copy question and answer
     */
    copyQuestionAnswer(index) {
        const result = this.state.results[index];
        if (result) {
            const text = `Soru: ${result.question}\n\nCevap: ${result.answer}`;

            navigator.clipboard.writeText(text).then(() => {
                this.ui.showToast('Soru ve cevap kopyalandı', 'success', 2000);
            }).catch(err => {
                this.ui.showToast('Kopyalama başarısız', 'error');
            });
        }
    }

    /**
     * Delete question and answer
     */
    deleteQuestionAnswer(index) {
        if (confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
            this.state.results.splice(index, 1);
            this.filterResults();
            this.ui.showToast('Soru silindi', 'info');
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {
            model: this.config.model,
            questionsPerPage: parseInt(document.getElementById('questionsPerPage').value),
            batchStrategy: this.config.batchStrategy,
            batchSize: parseInt(document.getElementById('batchSize').value),
            selectedTypes: this.state.selectedTypes
        };

        this.storage.saveSettings(settings);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.initialize();

    // Make app globally accessible for debugging
    window.app = app;
});
