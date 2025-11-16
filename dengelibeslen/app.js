// ===== Global State =====
let currentImage = null;
let apiKey = localStorage.getItem('geminiApiKey') || '';

// ===== DOM Elements =====
const pages = {
    home: document.getElementById('homePage'),
    analysis: document.getElementById('analysisPage'),
    loading: document.getElementById('loadingPage'),
    results: document.getElementById('resultsPage'),
    error: document.getElementById('errorPage')
};

const elements = {
    cameraBtn: document.getElementById('cameraBtn'),
    galleryBtn: document.getElementById('galleryBtn'),
    cameraInput: document.getElementById('cameraInput'),
    fileInput: document.getElementById('fileInput'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    backBtn: document.getElementById('backBtn'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    previewImage: document.getElementById('previewImage'),
    loadingMessage: document.getElementById('loadingMessage'),
    backToHomeBtn: document.getElementById('backToHomeBtn'),
    newAnalysisBtn: document.getElementById('newAnalysisBtn'),
    shareBtn: document.getElementById('shareBtn'),
    retryBtn: document.getElementById('retryBtn'),
    riskBadge: document.getElementById('riskBadge'),
    summaryText: document.getElementById('summaryText'),
    ingredientsList: document.getElementById('ingredientsList'),
    errorMessage: document.getElementById('errorMessage')
};

// ===== Page Navigation =====
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    pages[pageName].classList.add('active');
}

// ===== API Key Management =====
function loadApiKey() {
    if (apiKey) {
        elements.apiKeyInput.value = apiKey;
    }
}

elements.saveApiKeyBtn.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('geminiApiKey', key);
        alert('✅ API anahtarı kaydedildi!');
    } else {
        alert('⚠️ Lütfen geçerli bir API anahtarı girin.');
    }
});

// ===== Image Upload Handlers =====
elements.cameraBtn.addEventListener('click', () => {
    if (!apiKey) {
        alert('⚠️ Lütfen önce API anahtarınızı girin!');
        return;
    }
    elements.cameraInput.click();
});

elements.galleryBtn.addEventListener('click', () => {
    if (!apiKey) {
        alert('⚠️ Lütfen önce API anahtarınızı girin!');
        return;
    }
    elements.fileInput.click();
});

elements.cameraInput.addEventListener('change', handleImageUpload);
elements.fileInput.addEventListener('change', handleImageUpload);

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Lütfen geçerli bir görsel dosyası seçin.');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Görsel boyutu 10MB\'dan küçük olmalıdır.');
        return;
    }

    try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        currentImage = base64;

        // Show preview
        elements.previewImage.src = base64;
        showPage('analysis');

        // Reset file inputs
        elements.cameraInput.value = '';
        elements.fileInput.value = '';
    } catch (error) {
        showError('Görsel yüklenirken bir hata oluştu: ' + error.message);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== Analysis =====
elements.analyzeBtn.addEventListener('click', analyzeImage);

async function analyzeImage() {
    if (!currentImage) {
        showError('Lütfen önce bir görsel yükleyin.');
        return;
    }

    if (!apiKey) {
        showError('Lütfen API anahtarınızı girin.');
        return;
    }

    showPage('loading');
    updateLoadingMessage('Etiket okunuyor...');

    try {
        // Extract base64 data
        const base64Data = currentImage.split(',')[1];

        // Prepare Gemini API request
        const prompt = `Bu gıda etiketindeki "İçindekiler" veya "Ingredients" bölümünü oku ve analiz et.

Lütfen her bileşeni listele ve aşağıdaki JSON formatında yanıt ver:

{
  "ingredients": [
    {
      "name": "Bileşen adı (Türkçe)",
      "e_code": "E kodu varsa (örn: E621), yoksa boş string",
      "risk_level": "low/medium/high",
      "explanation": "Bu bileşenin sağlık açısından kısa açıklaması (1-2 cümle, Türkçe)"
    }
  ],
  "overall_risk": "low/medium/high",
  "summary": "Genel değerlendirme (2-3 cümle, Türkçe)"
}

Kurallar:
- Risk seviyeleri: low (doğal, güvenli), medium (dikkatli tüketilmeli), high (potansiyel risk)
- Açıklamalar anlaşılır ve jargonsuz olmalı
- E kodları varsa belirt
- Yapay katkı maddeleri, koruyucular, renklendiriciler için özellikle dikkatli ol
- Sadece JSON formatında yanıt ver, başka metin ekleme`;

        updateLoadingMessage('İçerikler analiz ediliyor...');

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API isteği başarısız oldu');
        }

        const data = await response.json();

        // Extract text from response
        const generatedText = data.candidates[0].content.parts[0].text;

        // Parse JSON from response (handle markdown code blocks)
        let jsonText = generatedText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const analysisResult = JSON.parse(jsonText);

        // Display results
        displayResults(analysisResult);
        showPage('results');

    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Analiz sırasında bir hata oluştu: ${error.message}`);
    }
}

function updateLoadingMessage(message) {
    elements.loadingMessage.textContent = message;
}

// ===== Display Results =====
function displayResults(result) {
    // Display risk badge
    const riskLevel = result.overall_risk || 'medium';
    const riskConfig = {
        low: { icon: '🟢', text: 'Düşük Risk', class: 'low' },
        medium: { icon: '🟡', text: 'Orta Risk', class: 'medium' },
        high: { icon: '🔴', text: 'Yüksek Risk', class: 'high' }
    };

    const config = riskConfig[riskLevel] || riskConfig.medium;
    elements.riskBadge.className = `risk-badge ${config.class}`;
    elements.riskBadge.innerHTML = `
        <span class="risk-icon">${config.icon}</span>
        <span class="risk-text">${config.text}</span>
    `;

    // Display summary
    elements.summaryText.textContent = result.summary || 'Analiz tamamlandı.';

    // Display ingredients
    elements.ingredientsList.innerHTML = '';

    if (result.ingredients && result.ingredients.length > 0) {
        result.ingredients.forEach(ingredient => {
            const card = createIngredientCard(ingredient);
            elements.ingredientsList.appendChild(card);
        });
    } else {
        elements.ingredientsList.innerHTML = '<p style="text-align: center; color: #666;">İçerik bulunamadı.</p>';
    }
}

function createIngredientCard(ingredient) {
    const card = document.createElement('div');
    card.className = `ingredient-card risk-${ingredient.risk_level || 'medium'}`;

    const riskIcons = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    };

    const riskIcon = riskIcons[ingredient.risk_level] || '🟡';

    card.innerHTML = `
        <div class="ingredient-header">
            <span class="ingredient-risk-icon">${riskIcon}</span>
            <span class="ingredient-name">${ingredient.name || 'Bilinmeyen'}</span>
        </div>
        ${ingredient.e_code ? `<div class="ingredient-ecode">${ingredient.e_code}</div>` : ''}
        <div class="ingredient-explanation">${ingredient.explanation || 'Açıklama yok.'}</div>
    `;

    return card;
}

// ===== Error Handling =====
function showError(message) {
    elements.errorMessage.textContent = message;
    showPage('error');
}

// ===== Navigation Buttons =====
elements.backBtn.addEventListener('click', () => {
    showPage('home');
});

elements.backToHomeBtn.addEventListener('click', () => {
    currentImage = null;
    showPage('home');
});

elements.newAnalysisBtn.addEventListener('click', () => {
    currentImage = null;
    showPage('home');
});

elements.retryBtn.addEventListener('click', () => {
    if (currentImage) {
        showPage('analysis');
    } else {
        showPage('home');
    }
});

// ===== Share Functionality =====
elements.shareBtn.addEventListener('click', async () => {
    const shareText = `Dengeli Beslen ile gıda içeriğimi analiz ettim! 🥗\n\nSonuç: ${elements.riskBadge.querySelector('.risk-text').textContent}\n\nSen de dene: ${window.location.href}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Dengeli Beslen - Analiz Sonucu',
                text: shareText
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard(shareText);
            }
        }
    } else {
        copyToClipboard(shareText);
    }
});

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Sonuç panoya kopyalandı!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('✅ Sonuç panoya kopyalandı!');
    } catch (error) {
        alert('⚠️ Kopyalama başarısız oldu.');
    }
    document.body.removeChild(textarea);
}

// ===== Initialization =====
function init() {
    loadApiKey();
    showPage('home');
}

// Start the app
init();
