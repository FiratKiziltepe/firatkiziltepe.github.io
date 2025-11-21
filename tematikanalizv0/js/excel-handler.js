/**
 * Excel Handler Module
 * Handles Excel file reading and writing using SheetJS (xlsx)
 */

const ExcelHandler = {
    workbook: null,
    worksheet: null,
    headers: [],
    rawData: [],

    /**
     * Read Excel file from File object
     * @param {File} file - The Excel file to read
     * @returns {Promise<Object>} - Returns headers and data
     */
    readFile: async function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const sheetName = this.workbook.SheetNames[0];
                    this.worksheet = this.workbook.Sheets[sheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(this.worksheet, { 
                        header: 1,
                        defval: '' 
                    });
                    
                    if (jsonData.length === 0) {
                        reject(new Error('Excel dosyası boş'));
                        return;
                    }
                    
                    // First row is headers
                    this.headers = jsonData[0];
                    
                    // Convert remaining rows to objects
                    this.rawData = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = {};
                        for (let j = 0; j < this.headers.length; j++) {
                            row[this.headers[j]] = jsonData[i][j] || '';
                        }
                        this.rawData.push(row);
                    }
                    
                    resolve({
                        headers: this.headers,
                        data: this.rawData,
                        rowCount: this.rawData.length
                    });
                } catch (error) {
                    reject(new Error('Excel dosyası okunamadı: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Dosya okunamadı'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Get column headers from the loaded Excel file
     * @returns {Array<string>} - Array of column names
     */
    getHeaders: function() {
        return this.headers;
    },

    /**
     * Get raw data from the loaded Excel file
     * @returns {Array<Object>} - Array of row objects
     */
    getData: function() {
        return this.rawData;
    },

    /**
     * Get specific columns from data
     * @param {Object} columnMap - Map of {outputKey: columnName}
     * @returns {Array<Object>} - Filtered data with only specified columns
     */
    getColumns: function(columnMap) {
        return this.rawData.map(row => {
            const filtered = {};
            for (let [key, colName] of Object.entries(columnMap)) {
                filtered[key] = row[colName] || '';
            }
            return filtered;
        });
    },

    /**
     * Export analysis results to Excel
     * @param {Array<Object>} results - Analysis results to export
     * @param {string} filename - Output filename
     */
    exportToExcel: function(results, filename = 'analiz-sonuclari.xlsx') {
        try {
            // Create worksheet from results
            const ws = XLSX.utils.json_to_sheet(results);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Analiz Sonuçları');
            
            // Add statistics sheet
            const stats = this.calculateStats(results);
            const statsWs = XLSX.utils.json_to_sheet([stats]);
            XLSX.utils.book_append_sheet(wb, statsWs, 'İstatistikler');
            
            // Save file
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Excel export error:', error);
            throw new Error('Excel dosyası oluşturulamadı: ' + error.message);
        }
    },

    /**
     * Calculate statistics from results
     * @param {Array<Object>} results - Analysis results
     * @returns {Object} - Statistics object
     */
    calculateStats: function(results) {
        const stats = {
            'Toplam Analiz': results.length,
            'Pozitif': 0,
            'Negatif': 0,
            'Nötr': 0,
            'Aksiyona Dönük': 0
        };

        const categories = {};
        const subThemes = {};

        results.forEach(item => {
            // Sentiment counts
            if (item.sentiment === 'Pozitif') stats['Pozitif']++;
            else if (item.sentiment === 'Negatif') stats['Negatif']++;
            else if (item.sentiment === 'Nötr') stats['Nötr']++;

            // Actionable count
            if (item.actionable === true || item.actionable === 'Evet') {
                stats['Aksiyona Dönük']++;
            }

            // Category counts
            categories[item.mainCategory] = (categories[item.mainCategory] || 0) + 1;

            // SubTheme counts
            const themeKey = `${item.mainCategory}: ${item.subTheme}`;
            subThemes[themeKey] = (subThemes[themeKey] || 0) + 1;
        });

        return {
            ...stats,
            'En Çok Kategori': Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
            'Kategori Sayısı': Object.keys(categories).length,
            'Farklı Alt Tema Sayısı': Object.keys(subThemes).length
        };
    },

    /**
     * Export results to JSON file
     * @param {Array<Object>} results - Analysis results
     * @param {string} filename - Output filename
     */
    exportToJSON: function(results, filename = 'analiz-sonuclari.json') {
        try {
            const stats = this.calculateStats(results);
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalRecords: results.length
                },
                statistics: stats,
                results: results
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('JSON export error:', error);
            throw new Error('JSON dosyası oluşturulamadı: ' + error.message);
        }
    },

    /**
     * Validate column selection
     * @param {Object} columns - Selected columns
     * @returns {Object} - Validation result
     */
    validateColumns: function(columns) {
        const errors = [];
        
        if (!columns.entryId) {
            errors.push('Entry ID kolonu seçilmeli');
        }
        
        if (!columns.opinion) {
            errors.push('Görüş/Öneri kolonu seçilmeli');
        }
        
        // Check if columns exist in headers
        for (let [key, value] of Object.entries(columns)) {
            if (value && !this.headers.includes(value)) {
                errors.push(`"${value}" kolonu bulunamadı`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Prepare data for analysis based on column mapping
     * @param {Object} columnMap - Column mapping
     * @returns {Array<Object>} - Prepared data for analysis
     */
    prepareForAnalysis: function(columnMap) {
        return this.rawData.map((row, index) => {
            return {
                'Entry Id': row[columnMap.entryId] || `ROW_${index + 1}`,
                'Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.': row[columnMap.opinion] || '',
                'DERS': row[columnMap.course] || 'Belirtilmemiş',
                'SINIF': row[columnMap.grade] || 'Belirtilmemiş'
            };
        });
    },

    /**
     * Prepare original data with all fields for display and export
     * @param {Object} columnMap - Column mapping
     * @returns {Array<Object>} - Original data with all fields
     */
    prepareOriginalData: function(columnMap) {
        return this.rawData.map((row, index) => {
            return {
                entryId: row[columnMap.entryId] || `ROW_${index + 1}`,
                opinion: row[columnMap.opinion] || '',
                branch: row[columnMap.branch] || 'Belirtilmemiş',
                course: row[columnMap.course] || 'Belirtilmemiş',
                grade: row[columnMap.grade] || 'Belirtilmemiş'
            };
        });
    }
};

// Make it available globally
window.ExcelHandler = ExcelHandler;

