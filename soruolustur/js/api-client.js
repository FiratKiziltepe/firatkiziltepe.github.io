/**
 * API Client Module
 * Handles communication with Google Gemini API
 */

/**
 * Gemini API Client Class
 */
export class GeminiAPIClient {
    constructor(apiKey, model = 'gemini-2.0-flash-exp') {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    /**
     * Build system prompt for question generation
     */
    buildSystemPrompt(questionTypes, numQuestions, language = 'tr') {
        const typesList = questionTypes.map(t => `${t.name} (${t.nameEn})`).join(', ');

        return `Sen belge analizi ve soru üretimi konusunda uzman bir yapay zeka asistanısın.

Görevin, verilen belge metninden ${numQuestions} adet çeşitli ve yüksek kaliteli soru-cevap çifti üretmektir.

# Talimatlar:

## Dil Tutarlılığı:
- Sorular ve cevaplar, verilen metnin diliyle AYNI DİLDE olmalıdır
- Metin Türkçe ise sorular ve cevaplar Türkçe olmalı
- Metin İngilizce ise sorular ve cevaplar İngilizce olmalı

## Soru Çeşitliliği:
Şu soru tiplerini kullan: ${typesList}
- Her soru tipinden dengeli dağılım yap
- Farklı zorluk seviyelerinde sorular oluştur (basit, orta, karmaşık)

## Cevap Hassasiyeti:
- Cevaplar kısa, net ve doğru olmalı
- Cevaplar SADECE verilen metne dayanmalı
- Dışarıdan bilgi ekleme

## Bağlam Farkındalığı:
- Sorular metne DERİNDEN köklenmiş olmalı
- Yüzeysel sorular yerine anlam odaklı sorular sor
- Metnin ana fikirlerini ve detaylarını kapsayan sorular üret

## Tekrardan Kaçın:
- Tüm sorular birbirinden FARKLI olmalı
- Aynı bilgiyi farklı şekilde sorma
- Her soru benzersiz bir bakış açısı sunmalı

## Çıktı Formatı:
JSON array formatında, her eleman şu alanları içermeli:
- question: Soru metni
- answer: Cevap metni
- question_type: Soru tipi (yukarıdaki listeden)

Örnek:
[
  {
    "question": "Soru metni buraya",
    "answer": "Cevap metni buraya",
    "question_type": "Olgusal"
  }
]

ÖNEMLİ: Sadece JSON array döndür, başka açıklama veya metin ekleme!`;
    }

    /**
     * Generate questions from text
     */
    async generateQuestions(text, questionTypes, numQuestions = 5, pageNumber = null) {
        const systemPrompt = this.buildSystemPrompt(questionTypes, numQuestions);

        const userPrompt = pageNumber
            ? `Belge Sayfası ${pageNumber}:\n\n${text}\n\nBu sayfadan ${numQuestions} soru-cevap çifti üret.`
            : `Belge Metni:\n\n${text}\n\n${numQuestions} soru-cevap çifti üret.`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `${systemPrompt}\n\n${userPrompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        };

        try {
            const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(this.parseErrorMessage(response.status, errorData));
            }

            const data = await response.json();

            // Parse response
            const result = this.parseResponse(data, pageNumber);

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Parse API response
     */
    parseResponse(data, pageNumber = null) {
        try {
            // Extract text from response
            const candidates = data.candidates;

            if (!candidates || candidates.length === 0) {
                throw new Error('API yanıtında aday bulunamadı');
            }

            const content = candidates[0].content;

            if (!content || !content.parts || content.parts.length === 0) {
                throw new Error('API yanıtında içerik bulunamadı');
            }

            const text = content.parts[0].text;

            // Parse JSON
            let questions;
            try {
                questions = JSON.parse(text);
            } catch (e) {
                // Try to extract JSON from markdown code blocks
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[1]);
                } else {
                    throw new Error('JSON parse edilemedi');
                }
            }

            if (!Array.isArray(questions)) {
                throw new Error('Yanıt array formatında değil');
            }

            // Validate and enhance questions
            const validQuestions = questions
                .filter(q => q.question && q.answer && q.question_type)
                .map(q => ({
                    question: q.question.trim(),
                    answer: q.answer.trim(),
                    questionType: q.question_type.trim(),
                    pageNumber: pageNumber,
                    timestamp: new Date().toISOString()
                }));

            return {
                success: true,
                questions: validQuestions,
                count: validQuestions.length
            };
        } catch (error) {
            console.error('Parse error:', error);
            return {
                success: false,
                error: `Yanıt parse edilemedi: ${error.message}`,
                questions: []
            };
        }
    }

    /**
     * Parse error message
     */
    parseErrorMessage(status, errorData) {
        if (status === 400) {
            return 'Geçersiz istek (API key veya parametreler hatalı olabilir)';
        } else if (status === 401) {
            return 'Geçersiz API key';
        } else if (status === 403) {
            return 'API erişimi reddedildi (key geçersiz veya iptal edilmiş olabilir)';
        } else if (status === 429) {
            return 'Rate limit aşıldı (çok fazla istek)';
        } else if (status === 500) {
            return 'Gemini API sunucu hatası';
        } else if (status === 503) {
            return 'Gemini API şu anda kullanılamıyor';
        }

        const errorMessage = errorData?.error?.message;
        return errorMessage || `API hatası (${status})`;
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const testText = 'Bu bir test metnidir. Yapay zeka, insan zekasını taklit eden sistemlerdir.';
            const testTypes = [
                { name: 'Olgusal', nameEn: 'Factual' }
            ];

            const result = await this.generateQuestions(testText, testTypes, 1);

            if (result.success && result.questions.length > 0) {
                return {
                    success: true,
                    message: 'API bağlantısı başarılı'
                };
            } else {
                return {
                    success: false,
                    message: 'API yanıt verdi ama soru üretilemedi'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Estimate tokens for text
     */
    estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if text fits in context window
     */
    checkContextWindow(text, contextWindow = 1000000) {
        const tokens = this.estimateTokens(text);
        const systemPromptTokens = 1000; // Estimate
        const responseTokens = 2000; // Estimate
        const totalTokens = tokens + systemPromptTokens + responseTokens;

        return {
            fits: totalTokens < contextWindow,
            estimatedTokens: totalTokens,
            contextWindow: contextWindow,
            usage: Math.round((totalTokens / contextWindow) * 100)
        };
    }

    /**
     * Set new API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Set model
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            model: this.model,
            hasApiKey: !!this.apiKey,
            baseUrl: this.baseUrl
        };
    }
}

/**
 * Create API client
 */
export function createAPIClient(apiKey, model) {
    return new GeminiAPIClient(apiKey, model);
}

export default GeminiAPIClient;
