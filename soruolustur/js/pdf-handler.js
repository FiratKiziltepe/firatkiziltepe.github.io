/**
 * PDF Handler Module
 * Handles PDF loading, parsing, and text extraction using PDF.js
 */

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * PDF Handler Class
 */
export class PDFHandler {
    constructor() {
        this.pdfDocument = null;
        this.fileName = '';
        this.fileSize = 0;
        this.totalPages = 0;
        this.pageTexts = new Map(); // Cache for extracted text
    }

    /**
     * Load PDF from file
     */
    async loadPDF(file) {
        try {
            this.fileName = file.name;
            this.fileSize = file.size;

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                verbosity: 0 // Suppress console logs
            });

            this.pdfDocument = await loadingTask.promise;
            this.totalPages = this.pdfDocument.numPages;

            return {
                success: true,
                fileName: this.fileName,
                fileSize: this.formatFileSize(this.fileSize),
                totalPages: this.totalPages
            };
        } catch (error) {
            console.error('Error loading PDF:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Extract text from a specific page
     */
    async extractTextFromPage(pageNumber) {
        if (!this.pdfDocument) {
            throw new Error('PDF belge yüklü değil');
        }

        if (pageNumber < 1 || pageNumber > this.totalPages) {
            throw new Error(`Geçersiz sayfa numarası: ${pageNumber}`);
        }

        // Check cache first
        if (this.pageTexts.has(pageNumber)) {
            return this.pageTexts.get(pageNumber);
        }

        try {
            const page = await this.pdfDocument.getPage(pageNumber);
            const textContent = await page.getTextContent();

            // Extract text with proper spacing
            const text = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            // Cache the result
            this.pageTexts.set(pageNumber, text);

            return text;
        } catch (error) {
            console.error(`Error extracting text from page ${pageNumber}:`, error);
            throw new Error(`Sayfa ${pageNumber} metni çıkarılamadı: ${error.message}`);
        }
    }

    /**
     * Extract text from multiple pages
     */
    async extractTextFromPages(pageNumbers) {
        const results = [];

        for (const pageNum of pageNumbers) {
            try {
                const text = await this.extractTextFromPage(pageNum);
                results.push({
                    pageNumber: pageNum,
                    text: text,
                    success: true
                });
            } catch (error) {
                results.push({
                    pageNumber: pageNum,
                    text: '',
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Extract text from page range
     */
    async extractTextFromRange(startPage, endPage) {
        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return this.extractTextFromPages(pageNumbers);
    }

    /**
     * Extract text from all pages
     */
    async extractAllText() {
        const pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        return this.extractTextFromPages(pageNumbers);
    }

    /**
     * Parse page selection string (e.g., "1-5, 10, 15-20")
     */
    parsePageSelection(selectionString) {
        const pageNumbers = new Set();

        if (!selectionString || selectionString.trim() === '') {
            // Return all pages
            for (let i = 1; i <= this.totalPages; i++) {
                pageNumbers.add(i);
            }
            return Array.from(pageNumbers).sort((a, b) => a - b);
        }

        const parts = selectionString.split(',');

        for (const part of parts) {
            const trimmed = part.trim();

            if (trimmed.includes('-')) {
                // Range (e.g., "1-5")
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));

                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Geçersiz sayfa aralığı: ${part}`);
                }

                if (start > end) {
                    throw new Error(`Geçersiz aralık (başlangıç > bitiş): ${part}`);
                }

                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= this.totalPages) {
                        pageNumbers.add(i);
                    }
                }
            } else {
                // Single page
                const pageNum = parseInt(trimmed);

                if (isNaN(pageNum)) {
                    throw new Error(`Geçersiz sayfa numarası: ${part}`);
                }

                if (pageNum >= 1 && pageNum <= this.totalPages) {
                    pageNumbers.add(pageNum);
                }
            }
        }

        if (pageNumbers.size === 0) {
            throw new Error('Geçerli sayfa seçilmedi');
        }

        return Array.from(pageNumbers).sort((a, b) => a - b);
    }

    /**
     * Validate page selection
     */
    validatePageSelection(selectionString) {
        try {
            const pages = this.parsePageSelection(selectionString);
            return {
                valid: true,
                pages: pages,
                count: pages.length
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Check if PDF is likely scanned (image-only)
     */
    async isScannedPDF(sampleSize = 3) {
        try {
            const pagesToCheck = Math.min(sampleSize, this.totalPages);
            let totalTextLength = 0;

            for (let i = 1; i <= pagesToCheck; i++) {
                const text = await this.extractTextFromPage(i);
                totalTextLength += text.length;
            }

            // If average text per page is very low, likely scanned
            const averageTextLength = totalTextLength / pagesToCheck;
            return averageTextLength < 50; // Threshold: 50 chars per page
        } catch (error) {
            console.error('Error checking if scanned:', error);
            return false;
        }
    }

    /**
     * Get PDF metadata
     */
    async getMetadata() {
        if (!this.pdfDocument) {
            return null;
        }

        try {
            const metadata = await this.pdfDocument.getMetadata();
            return {
                info: metadata.info,
                metadata: metadata.metadata,
                contentDispositionFilename: metadata.contentDispositionFilename
            };
        } catch (error) {
            console.error('Error getting metadata:', error);
            return null;
        }
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        if (error.name === 'InvalidPDFException') {
            return 'Geçersiz PDF dosyası';
        } else if (error.name === 'MissingPDFException') {
            return 'PDF dosyası bulunamadı';
        } else if (error.name === 'UnexpectedResponseException') {
            return 'PDF yüklenirken beklenmeyen hata';
        } else if (error.name === 'PasswordException') {
            return 'PDF şifre korumalı (şifre korumalı PDF\'ler desteklenmiyor)';
        } else {
            return error.message || 'Bilinmeyen hata';
        }
    }

    /**
     * Clear cached data
     */
    clearCache() {
        this.pageTexts.clear();
    }

    /**
     * Dispose PDF document
     */
    dispose() {
        if (this.pdfDocument) {
            this.pdfDocument.destroy();
            this.pdfDocument = null;
        }
        this.clearCache();
        this.fileName = '';
        this.fileSize = 0;
        this.totalPages = 0;
    }

    /**
     * Get page text statistics
     */
    async getPageStatistics(pageNumber) {
        const text = await this.extractTextFromPage(pageNumber);

        return {
            pageNumber,
            charCount: text.length,
            wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
            lineCount: text.split('\n').length,
            hasContent: text.length > 0
        };
    }

    /**
     * Get document statistics
     */
    getDocumentInfo() {
        return {
            fileName: this.fileName,
            fileSize: this.formatFileSize(this.fileSize),
            fileSizeBytes: this.fileSize,
            totalPages: this.totalPages,
            isLoaded: this.pdfDocument !== null,
            cachedPages: this.pageTexts.size
        };
    }

    /**
     * Estimate token count for a page
     * (Rough estimate: 1 token ≈ 4 characters)
     */
    async estimateTokens(pageNumber) {
        const text = await this.extractTextFromPage(pageNumber);
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if page has enough content
     */
    async hasMinimumContent(pageNumber, minChars = 100) {
        const text = await this.extractTextFromPage(pageNumber);
        return text.length >= minChars;
    }
}

// Export singleton instance
export default new PDFHandler();
