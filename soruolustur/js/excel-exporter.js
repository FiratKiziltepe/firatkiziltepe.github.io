/**
 * Excel Exporter Module
 * Exports results to Excel format using SheetJS
 */

/**
 * Excel Exporter Class
 */
export class ExcelExporter {
    constructor() {
        this.workbook = null;
    }

    /**
     * Export results to Excel
     */
    exportToExcel(results, summary, pdfFileName) {
        try {
            // Create workbook
            this.workbook = XLSX.utils.book_new();

            // Sheet 1: Questions & Answers
            this.addQuestionsSheet(results);

            // Sheet 2: Summary Statistics
            this.addSummarySheet(summary, results);

            // Sheet 3: Configuration
            this.addConfigSheet(summary.config, pdfFileName);

            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const cleanPdfName = pdfFileName.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `sorular_${cleanPdfName}_${timestamp}.xlsx`;

            // Write and download
            XLSX.writeFile(this.workbook, filename);

            return {
                success: true,
                filename: filename
            };
        } catch (error) {
            console.error('Excel export error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add Questions Sheet
     */
    addQuestionsSheet(results) {
        // Prepare data
        const data = results.map((result, index) => ({
            'Sıra No': index + 1,
            'Sayfa': result.pageNumber || '-',
            'Soru': result.question,
            'Cevap': result.answer,
            'Soru Tipi': result.questionType,
            'Grup': result.batchId || '-',
            'Oluşturma Zamanı': this.formatTimestamp(result.timestamp)
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 8 },  // Sıra No
            { wch: 8 },  // Sayfa
            { wch: 60 }, // Soru
            { wch: 60 }, // Cevap
            { wch: 15 }, // Soru Tipi
            { wch: 8 },  // Grup
            { wch: 20 }  // Zaman
        ];

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Sorular');
    }

    /**
     * Add Summary Sheet
     */
    addSummarySheet(summary, results) {
        // Count questions by type
        const typeCount = {};
        results.forEach(result => {
            const type = result.questionType;
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        // Prepare summary data
        const summaryData = [
            { 'Özellik': 'Toplam Soru Sayısı', 'Değer': summary.totalQuestions },
            { 'Özellik': 'Toplam Grup Sayısı', 'Değer': summary.totalBatches },
            { 'Özellik': 'Tamamlanan Grup', 'Değer': summary.completedBatches },
            { 'Özellik': 'Hata Sayısı', 'Değer': summary.errorCount },
            { 'Özellik': 'İşleme Süresi', 'Değer': summary.durationFormatted },
            { 'Özellik': 'Durum', 'Değer': summary.cancelled ? 'İptal Edildi' : 'Tamamlandı' },
            { 'Özellik': '', 'Değer': '' }, // Empty row
            { 'Özellik': 'Soru Tipi Dağılımı', 'Değer': '' }
        ];

        // Add type counts
        Object.entries(typeCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                summaryData.push({
                    'Özellik': `  ${type}`,
                    'Değer': count
                });
            });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(summaryData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Özellik
            { wch: 20 }  // Değer
        ];

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Özet');
    }

    /**
     * Add Configuration Sheet
     */
    addConfigSheet(config, pdfFileName) {
        const configData = [
            { 'Ayar': 'PDF Dosyası', 'Değer': pdfFileName },
            { 'Ayar': 'Seçilen Sayfalar', 'Değer': this.formatPageNumbers(config.pageNumbers) },
            { 'Ayar': 'Model', 'Değer': config.model },
            { 'Ayar': 'İşleme Stratejisi', 'Değer': this.formatStrategy(config.batchStrategy) },
            { 'Ayar': 'Grup Boyutu', 'Değer': config.batchSize || 1 },
            { 'Ayar': 'Sayfa/Grup Başına Soru', 'Değer': config.questionsPerPage },
            { 'Ayar': '', 'Değer': '' }, // Empty row
            { 'Ayar': 'Seçilen Soru Tipleri', 'Değer': '' }
        ];

        // Add selected types
        if (config.selectedTypes && config.selectedTypes.length > 0) {
            config.selectedTypes.forEach(type => {
                configData.push({
                    'Ayar': `  ${type}`,
                    'Değer': '✓'
                });
            });
        } else {
            configData.push({
                'Ayar': '  Tüm tipler',
                'Değer': '✓'
            });
        }

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(configData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Ayar
            { wch: 40 }  // Değer
        ];

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Yapılandırma');
    }

    /**
     * Export filtered results
     */
    exportFiltered(results, summary, pdfFileName, filter) {
        let filteredResults = results;

        if (filter.questionType && filter.questionType !== '') {
            filteredResults = filteredResults.filter(r => r.questionType === filter.questionType);
        }

        if (filter.searchTerm && filter.searchTerm !== '') {
            const term = filter.searchTerm.toLowerCase();
            filteredResults = filteredResults.filter(r =>
                r.question.toLowerCase().includes(term) ||
                r.answer.toLowerCase().includes(term)
            );
        }

        return this.exportToExcel(filteredResults, summary, pdfFileName);
    }

    /**
     * Export selected rows
     */
    exportSelected(selectedResults, summary, pdfFileName) {
        return this.exportToExcel(selectedResults, summary, pdfFileName);
    }

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '-';

        const date = new Date(timestamp);
        return date.toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Format page numbers
     */
    formatPageNumbers(pageNumbers) {
        if (!pageNumbers || pageNumbers.length === 0) {
            return 'Tümü';
        }

        if (pageNumbers.length <= 10) {
            return pageNumbers.join(', ');
        }

        // For large selections, show range
        const first = pageNumbers[0];
        const last = pageNumbers[pageNumbers.length - 1];
        return `${first}-${last} (${pageNumbers.length} sayfa)`;
    }

    /**
     * Format strategy
     */
    formatStrategy(strategy) {
        const strategies = {
            'page-by-page': 'Sayfa Sayfa',
            'batch-by-pages': 'Sayfa Grupları'
        };

        return strategies[strategy] || strategy;
    }

    /**
     * Create CSV export (alternative format)
     */
    exportToCSV(results, pdfFileName) {
        try {
            // Prepare data
            const data = results.map((result, index) => ({
                'Sıra No': index + 1,
                'Sayfa': result.pageNumber || '-',
                'Soru': result.question,
                'Cevap': result.answer,
                'Soru Tipi': result.questionType,
                'Grup': result.batchId || '-'
            }));

            // Convert to worksheet
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Convert to CSV
            const csv = XLSX.utils.sheet_to_csv(worksheet);

            // Create blob and download
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const cleanPdfName = pdfFileName.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `sorular_${cleanPdfName}_${timestamp}.csv`;

            this.downloadBlob(blob, filename);

            return {
                success: true,
                filename: filename
            };
        } catch (error) {
            console.error('CSV export error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download blob
     */
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Export to JSON (for backup/import)
     */
    exportToJSON(results, summary, config) {
        const data = {
            exportedAt: new Date().toISOString(),
            summary: summary,
            config: config,
            results: results
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sorular_yedek_${timestamp}.json`;

        this.downloadBlob(blob, filename);

        return {
            success: true,
            filename: filename
        };
    }

    /**
     * Import from JSON
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error('Geçersiz JSON formatı');
            }

            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export default new ExcelExporter();
