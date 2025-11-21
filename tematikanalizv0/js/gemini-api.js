/**
 * Gemini API Module
 * Handles communication with Google Gemini API for thematic analysis
 */

const GeminiAPI = {
    apiKey: null,
    modelName: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',

    /**
     * Set API key
     * @param {string} key - Gemini API key
     */
    setApiKey: function(key) {
        this.apiKey = key;
    },

    /**
     * Get API key from localStorage or current session
     * @returns {string|null} - API key
     */
    getApiKey: function() {
        if (this.apiKey) return this.apiKey;
        
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) {
            this.apiKey = stored;
            return stored;
        }
        
        return null;
    },

    /**
     * Save API key to localStorage
     * @param {string} key - API key to save
     */
    saveApiKey: function(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    },

    /**
     * Validate API key format
     * @param {string} key - API key to validate
     * @returns {boolean} - Whether key format is valid
     */
    validateKeyFormat: function(key) {
        // Gemini API keys typically start with "AIza" and are around 39 characters
        return key && key.trim().length > 30;
    },

    /**
     * Schema for structured output (same as TypeScript version)
     */
    getAnalysisSchema: function() {
        return {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            entryId: { 
                                type: "string", 
                                description: "The Entry Id provided in the input" 
                            },
                            mainCategory: { 
                                type: "string", 
                                description: "Ana kategori (Örn: Ders Kitabı İçeriği, Müfredat, Ölçme Değerlendirme, Fiziki Koşullar, Öğretmen Kılavuzu)" 
                            },
                            subTheme: { 
                                type: "string", 
                                description: "Spesifik alt tema (Örn: Etkinlik zorluğu, Kaynak yetersizliği, Kazanım uyumsuzluğu)" 
                            },
                            sentiment: { 
                                type: "string", 
                                enum: ["Pozitif", "Negatif", "Nötr"], 
                                description: "Görüşün duygu durumu" 
                            },
                            actionable: { 
                                type: "boolean", 
                                description: "Somut bir öneri veya aksiyon içeriyor mu?" 
                            }
                        },
                        required: ["entryId", "mainCategory", "subTheme", "sentiment", "actionable"]
                    }
                }
            }
        };
    },

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Analyze a batch of rows
     * @param {Array<Object>} rows - Batch of data rows to analyze
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>} - Analysis results
     */
    analyzeBatch: async function(rows, retryCount = 0) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key bulunamadı. Lütfen API anahtarınızı girin.');
        }

        // Prepare prompt data (same as TypeScript version)
        const promptData = rows.map(r => ({
            id: r["Entry Id"],
            text: r["Görüş, tespit veya önerilerinizi buraya yazabilirsiniz."] || "",
            context: `${r.DERS} - ${r.SINIF}`
        }));

        const prompt = `
Aşağıda öğretmenlerin eğitim materyalleri ve müfredat hakkındaki görüşleri bulunmaktadır.
Bu görüşleri analiz et ve JSON formatında yapılandır.
Eğer görüş boşsa veya anlamsızsa, kategori olarak "Diğer", sentiment olarak "Nötr" işaretle.

Veriler:
${JSON.stringify(promptData)}
        `;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: this.getAnalysisSchema()
            }
        };

        try {
            const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            // Extract text from response
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
                throw new Error('Gemini API\'den boş yanıt alındı');
            }

            return JSON.parse(text);

        } catch (error) {
            console.error('Batch analysis error:', error);
            
            // Retry logic for rate limits or temporary failures
            if (retryCount < 3) {
                const backoffTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
                console.warn(`Batch analysis failed (attempt ${retryCount + 1}). Retrying in ${backoffTime}ms...`);
                await this.delay(backoffTime);
                return this.analyzeBatch(rows, retryCount + 1);
            }

            console.error('Batch analysis permanently failed after retries:', error);
            // Return empty list on failure to allow process to continue
            return { items: [] };
        }
    },

    /**
     * Generate executive summary from analysis results
     * @param {Array<Object>} analysisResults - All analysis results
     * @returns {Promise<string>} - Executive summary text
     */
    generateExecutiveSummary: async function(analysisResults) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key bulunamadı');
        }

        // Summarize data to avoid token limits (same logic as TypeScript version)
        const categoryCounts = analysisResults.reduce((acc, item) => {
            acc[item.mainCategory] = (acc[item.mainCategory] || 0) + 1;
            return acc;
        }, {});

        const sentimentCounts = analysisResults.reduce((acc, item) => {
            acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
            return acc;
        }, {});

        // Get top 30 most frequent subthemes
        const subThemeCounts = {};
        analysisResults.forEach(item => {
            const key = `${item.mainCategory}: ${item.subTheme}`;
            subThemeCounts[key] = (subThemeCounts[key] || 0) + 1;
        });

        const topThemes = Object.entries(subThemeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([theme, count]) => `${theme} (${count} görüş)`)
            .join("; ");

        const prompt = `
Sen kıdemli bir eğitim analistisin. ${analysisResults.length} adet öğretmen görüşünün analiz sonuçlarını inceledin.
Aşağıdaki özet verilere dayanarak, Milli Eğitim Bakanlığı yetkilileri için üst düzey bir yönetici özeti (Executive Summary) yaz.

İstatistikler: 
- Kategori Dağılımı: ${JSON.stringify(categoryCounts)}
- Duygu Dağılımı: ${JSON.stringify(sentimentCounts)}

Öne Çıkan Sık Tekrar Eden Konular: 
${topThemes}

Lütfen şu başlıkları kullan:
1. Genel Durum Değerlendirmesi
2. Öne Çıkan Kritik Sorun Alanları (Verilerle destekle)
3. Stratejik İyileştirme Önerileri

Türkçe ve resmi bir dil kullan. Raporu somut verilerle temellendir.
        `;

        try {
            const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${apiKey}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            return text || 'Özet oluşturulamadı.';

        } catch (error) {
            console.error('Executive summary generation error:', error);
            return 'Özet oluşturulurken bir hata oluştu: ' + error.message;
        }
    },

    /**
     * Test API key by making a simple request
     * @param {string} key - API key to test
     * @returns {Promise<boolean>} - Whether key is valid
     */
    testApiKey: async function(key) {
        try {
            const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${key}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: "Merhaba, test mesajı"
                    }]
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            return response.ok;
        } catch (error) {
            console.error('API key test failed:', error);
            return false;
        }
    }
};

// Make it available globally
window.GeminiAPI = GeminiAPI;

