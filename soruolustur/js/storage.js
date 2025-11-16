/**
 * Storage Module
 * Manages localStorage operations with encryption for sensitive data
 */

const STORAGE_KEYS = {
    API_KEY: 'pdf_qgen_api_key',
    CUSTOM_TYPES: 'pdf_qgen_custom_types',
    SETTINGS: 'pdf_qgen_settings',
    RESULTS_HISTORY: 'pdf_qgen_results_history',
    WELCOME_DISMISSED: 'pdf_qgen_welcome_dismissed'
};

// Encryption key (in production, this should be more secure)
const ENCRYPTION_KEY = 'pdf-question-generator-2024-secure-key';

/**
 * Encrypts data using CryptoJS AES
 */
function encrypt(data) {
    try {
        return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

/**
 * Decrypts data using CryptoJS AES
 */
function decrypt(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

/**
 * Storage Manager Class
 */
export class StorageManager {
    /**
     * Save API Key (encrypted)
     */
    static saveApiKey(apiKey) {
        if (!apiKey) {
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            return true;
        }

        const encrypted = encrypt(apiKey);
        if (encrypted) {
            localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
            return true;
        }
        return false;
    }

    /**
     * Load API Key (decrypted)
     */
    static loadApiKey() {
        const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
        if (!encrypted) return null;

        return decrypt(encrypted);
    }

    /**
     * Clear API Key
     */
    static clearApiKey() {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }

    /**
     * Save Custom Question Types
     */
    static saveCustomTypes(types) {
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_TYPES, JSON.stringify(types));
            return true;
        } catch (error) {
            console.error('Error saving custom types:', error);
            return false;
        }
    }

    /**
     * Load Custom Question Types
     */
    static loadCustomTypes() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TYPES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading custom types:', error);
            return [];
        }
    }

    /**
     * Save Application Settings
     */
    static saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Load Application Settings
     */
    static loadSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                model: 'gemini-2.0-flash-exp',
                questionsPerPage: 5,
                batchStrategy: 'page-by-page',
                batchSize: 5,
                selectedTypes: [] // Empty means all selected
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return null;
        }
    }

    /**
     * Save Results History
     */
    static saveResultsHistory(results, maxHistory = 5) {
        try {
            let history = this.loadResultsHistory();

            // Add new results with timestamp
            const newEntry = {
                timestamp: new Date().toISOString(),
                results: results,
                count: results.length
            };

            history.unshift(newEntry);

            // Keep only last N entries
            history = history.slice(0, maxHistory);

            localStorage.setItem(STORAGE_KEYS.RESULTS_HISTORY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error saving results history:', error);
            return false;
        }
    }

    /**
     * Load Results History
     */
    static loadResultsHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.RESULTS_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading results history:', error);
            return [];
        }
    }

    /**
     * Clear Results History
     */
    static clearResultsHistory() {
        localStorage.removeItem(STORAGE_KEYS.RESULTS_HISTORY);
    }

    /**
     * Set Welcome Dismissed
     */
    static setWelcomeDismissed() {
        localStorage.setItem(STORAGE_KEYS.WELCOME_DISMISSED, 'true');
    }

    /**
     * Check if Welcome was Dismissed
     */
    static isWelcomeDismissed() {
        return localStorage.getItem(STORAGE_KEYS.WELCOME_DISMISSED) === 'true';
    }

    /**
     * Clear All Settings (except API key)
     */
    static clearSettings() {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_TYPES);
    }

    /**
     * Clear Everything
     */
    static clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    /**
     * Get Storage Usage Info
     */
    static getStorageInfo() {
        let totalSize = 0;
        const items = {};

        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            items[name] = {
                size: size,
                sizeKB: (size / 1024).toFixed(2)
            };
            totalSize += size;
        });

        return {
            items,
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * Export All Data (for backup)
     */
    static exportData() {
        const data = {};
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            if (item) {
                // Don't include encrypted API key in export
                if (key !== STORAGE_KEYS.API_KEY) {
                    data[name] = item;
                }
            }
        });

        return JSON.stringify(data, null, 2);
    }

    /**
     * Import Data (from backup)
     */
    static importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            Object.entries(data).forEach(([name, value]) => {
                const key = STORAGE_KEYS[name];
                if (key && key !== STORAGE_KEYS.API_KEY) {
                    localStorage.setItem(key, value);
                }
            });

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export for use in other modules
export default StorageManager;
