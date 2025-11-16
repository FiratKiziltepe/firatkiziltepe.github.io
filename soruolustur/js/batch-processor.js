/**
 * Batch Processor Module
 * Handles batch processing of PDF pages with progress tracking
 */

/**
 * Batch Processor Class
 */
export class BatchProcessor {
    constructor(pdfHandler, apiClient, rateLimiter, questionTypesManager) {
        this.pdfHandler = pdfHandler;
        this.apiClient = apiClient;
        this.rateLimiter = rateLimiter;
        this.questionTypesManager = questionTypesManager;

        // Processing state
        this.isProcessing = false;
        this.isPaused = false;
        this.isCancelled = false;

        // Results
        this.results = [];
        this.errors = [];

        // Progress tracking
        this.totalBatches = 0;
        this.completedBatches = 0;
        this.totalQuestions = 0;
        this.startTime = null;

        // Callbacks
        this.onProgress = null;
        this.onBatchComplete = null;
        this.onComplete = null;
        this.onError = null;
    }

    /**
     * Create batches from page numbers
     */
    createBatches(pageNumbers, strategy, batchSize = 5) {
        const batches = [];

        if (strategy === 'page-by-page') {
            // Each page is a separate batch
            pageNumbers.forEach(pageNum => {
                batches.push({
                    id: batches.length + 1,
                    pages: [pageNum],
                    pageRange: `${pageNum}`
                });
            });
        } else if (strategy === 'batch-by-pages') {
            // Group pages by batch size
            for (let i = 0; i < pageNumbers.length; i += batchSize) {
                const batchPages = pageNumbers.slice(i, i + batchSize);
                batches.push({
                    id: batches.length + 1,
                    pages: batchPages,
                    pageRange: this.formatPageRange(batchPages)
                });
            }
        }

        return batches;
    }

    /**
     * Format page range for display
     */
    formatPageRange(pages) {
        if (pages.length === 1) {
            return `${pages[0]}`;
        }

        // Check if consecutive
        const isConsecutive = pages.every((page, i) => {
            if (i === 0) return true;
            return page === pages[i - 1] + 1;
        });

        if (isConsecutive) {
            return `${pages[0]}-${pages[pages.length - 1]}`;
        }

        return pages.join(', ');
    }

    /**
     * Start processing
     */
    async process(config) {
        if (this.isProcessing) {
            throw new Error('İşleme zaten devam ediyor');
        }

        // Reset state
        this.reset();

        // Set config
        this.config = config;
        this.isProcessing = true;
        this.startTime = Date.now();

        // Create batches
        const batches = this.createBatches(
            config.pageNumbers,
            config.batchStrategy,
            config.batchSize
        );

        this.totalBatches = batches.length;

        this.log('İşleme başladı', 'info');
        this.log(`Toplam ${batches.length} grup işlenecek`, 'info');

        // Process each batch
        for (let i = 0; i < batches.length; i++) {
            if (this.isCancelled) {
                this.log('İşleme iptal edildi', 'warning');
                break;
            }

            // Wait if paused
            while (this.isPaused && !this.isCancelled) {
                await this.delay(500);
            }

            const batch = batches[i];

            try {
                await this.processBatch(batch, i + 1, batches.length);
            } catch (error) {
                this.log(`Grup ${batch.id} hatası: ${error.message}`, 'error');
                this.errors.push({
                    batch: batch.id,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                if (this.onError) {
                    this.onError(error, batch);
                }

                // Continue with next batch unless critical error
                if (!this.shouldContinueAfterError(error)) {
                    break;
                }
            }
        }

        this.isProcessing = false;

        const summary = this.getSummary();
        this.log(`İşleme tamamlandı: ${summary.totalQuestions} soru üretildi`, 'success');

        if (this.onComplete) {
            this.onComplete(summary);
        }

        return summary;
    }

    /**
     * Process a single batch
     */
    async processBatch(batch, batchNumber, totalBatches) {
        this.log(`Grup ${batchNumber}/${totalBatches} işleniyor (Sayfa: ${batch.pageRange})`, 'info');

        // Extract text from pages
        const texts = [];
        for (const pageNum of batch.pages) {
            const text = await this.pdfHandler.extractTextFromPage(pageNum);
            texts.push({ pageNum, text });
        }

        // Combine texts for batch
        const combinedText = texts
            .map(t => `[Sayfa ${t.pageNum}]\n${t.text}`)
            .join('\n\n');

        // Get question types
        const questionTypes = this.questionTypesManager.getTypesForPrompt(
            this.config.selectedTypes
        );

        // Calculate questions per batch
        const questionsPerBatch = this.config.questionsPerPage * batch.pages.length;

        // Generate questions via API (through rate limiter)
        const result = await this.rateLimiter.addRequest(
            () => this.apiClient.generateQuestions(
                combinedText,
                questionTypes,
                questionsPerBatch,
                batch.pages.length === 1 ? batch.pages[0] : null
            ),
            { batch: batch.id }
        );

        if (result.success) {
            // Add batch info to questions
            const questions = result.questions.map(q => ({
                ...q,
                batchId: batch.id,
                batchPages: batch.pageRange,
                // If multiple pages in batch, try to assign page number from text context
                pageNumber: q.pageNumber || batch.pages[0]
            }));

            this.results.push(...questions);
            this.totalQuestions += questions.length;

            this.log(`Grup ${batchNumber} tamamlandı: ${questions.length} soru üretildi`, 'success');

            if (this.onBatchComplete) {
                this.onBatchComplete(batch, questions);
            }
        } else {
            throw new Error(result.error);
        }

        this.completedBatches++;

        // Update progress
        if (this.onProgress) {
            this.onProgress({
                completedBatches: this.completedBatches,
                totalBatches: this.totalBatches,
                totalQuestions: this.totalQuestions,
                percentage: Math.round((this.completedBatches / this.totalBatches) * 100),
                rateLimiterStatus: this.rateLimiter.getStatus()
            });
        }
    }

    /**
     * Check if should continue after error
     */
    shouldContinueAfterError(error) {
        const message = error.message.toLowerCase();

        // Don't continue on critical errors
        if (message.includes('api key') ||
            message.includes('günlük') ||
            message.includes('daily')) {
            return false;
        }

        // Continue on rate limit or temporary errors
        return true;
    }

    /**
     * Pause processing
     */
    pause() {
        if (!this.isProcessing) {
            return false;
        }

        this.isPaused = true;
        this.rateLimiter.pause();
        this.log('İşleme duraklatıldı', 'warning');
        return true;
    }

    /**
     * Resume processing
     */
    resume() {
        if (!this.isPaused) {
            return false;
        }

        this.isPaused = false;
        this.rateLimiter.resume();
        this.log('İşleme devam ettiriliyor', 'info');
        return true;
    }

    /**
     * Cancel processing
     */
    cancel() {
        if (!this.isProcessing) {
            return false;
        }

        this.isCancelled = true;
        this.isPaused = false;
        this.rateLimiter.clearQueue();
        this.log('İşleme iptal ediliyor...', 'warning');
        return true;
    }

    /**
     * Get summary
     */
    getSummary() {
        const endTime = Date.now();
        const duration = this.startTime ? endTime - this.startTime : 0;

        return {
            totalBatches: this.totalBatches,
            completedBatches: this.completedBatches,
            totalQuestions: this.totalQuestions,
            errorCount: this.errors.length,
            duration: duration,
            durationFormatted: this.formatDuration(duration),
            results: this.results,
            errors: this.errors,
            cancelled: this.isCancelled,
            config: this.config
        };
    }

    /**
     * Get current results
     */
    getResults() {
        return this.results;
    }

    /**
     * Clear results
     */
    clearResults() {
        this.results = [];
        this.errors = [];
        this.totalQuestions = 0;
    }

    /**
     * Reset processor
     */
    reset() {
        this.isProcessing = false;
        this.isPaused = false;
        this.isCancelled = false;
        this.results = [];
        this.errors = [];
        this.totalBatches = 0;
        this.completedBatches = 0;
        this.totalQuestions = 0;
        this.startTime = null;
    }

    /**
     * Format duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}s ${minutes % 60}d ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}d ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log helper
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    }

    /**
     * Estimate processing time
     */
    estimateProcessingTime(pageCount, strategy, batchSize, model) {
        const batches = strategy === 'page-by-page'
            ? pageCount
            : Math.ceil(pageCount / batchSize);

        const rateLimiterStatus = this.rateLimiter.getStatus();
        const delayMs = rateLimiterStatus.delayMs;

        // Estimate: delay between requests + ~5s per request processing
        const estimatedMs = (batches * delayMs) + (batches * 5000);

        return {
            batches: batches,
            estimatedMs: estimatedMs,
            estimatedFormatted: this.formatDuration(estimatedMs)
        };
    }

    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        if (callbacks.onProgress) this.onProgress = callbacks.onProgress;
        if (callbacks.onBatchComplete) this.onBatchComplete = callbacks.onBatchComplete;
        if (callbacks.onComplete) this.onComplete = callbacks.onComplete;
        if (callbacks.onError) this.onError = callbacks.onError;
    }
}

export default BatchProcessor;
