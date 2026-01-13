// Kriter Öneri Sistemi - Gemini AI + Lokal Hibrit

let criteria = [];
let allResults = [];
let displayedCount = 0;
const RESULTS_PER_PAGE = 3;

// Türkçe stop words
const stopWords = new Set([
    've', 'veya', 'ile', 'bir', 'bu', 'şu', 'o', 'için', 'de', 'da', 'den', 'dan',
    'ya', 'ki', 'ne', 'mi', 'mu', 'mü', 'mı', 'gibi', 'kadar', 'önce', 'sonra',
    'daha', 'en', 'çok', 'az', 'her', 'tüm', 'bütün', 'bazı', 'hiç', 'yok', 'var',
    'olarak', 'olan', 'olduğu', 'olmak', 'olmalı', 'olmalıdır', 'edilmeli'
]);

// Kelime kökü için suffix listesi
const suffixes = [
    'ler', 'lar', 'leri', 'ları', 'de', 'da', 'te', 'ta', 'den', 'dan',
    'e', 'a', 'ye', 'ya', 'i', 'ı', 'u', 'ü', 'in', 'ın', 'un', 'ün',
    'li', 'lı', 'lu', 'lü', 'siz', 'sız', 'suz', 'süz',
    'lık', 'lik', 'luk', 'lük', 'mış', 'miş', 'muş', 'müş'
];

// Eş anlamlı kelimeler
const synonyms = {
    'hata': ['yanlış', 'yanlışlık', 'eksik', 'eksiklik', 'hatalı'],
    'yanlış': ['hata', 'hatalı', 'eksik'],
    'görsel': ['resim', 'fotoğraf', 'şekil', 'figür', 'çizim', 'grafik', 'tablo'],
    'alt yazı': ['altyazı', 'açıklama'],
    'metin': ['yazı', 'içerik', 'paragraf'],
    'cevap': ['yanıt', 'çözüm'],
    'ses': ['seslendirme', 'audio', 'işitsel'],
    'video': ['görüntü', 'film', 'animasyon'],
    'yazım': ['imla', 'spelling'],
    'formül': ['denklem', 'matematiksel', 'hesaplama'],
    'bilgi': ['enformasyon', 'veri'],
    'kaynak': ['kaynakça', 'referans', 'atıf']
};

// DOM Elements
const apiHeader = document.getElementById('apiHeader');
const apiContent = document.getElementById('apiContent');
const apiToggle = document.getElementById('apiToggle');
const apiStatus = document.getElementById('apiStatus');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsList = document.getElementById('resultsList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const showMoreBtn = document.getElementById('showMoreBtn');
const moreCount = document.getElementById('moreCount');

// Kriterleri yükle
async function loadCriteria() {
    try {
        const response = await fetch('criteria.json');
        criteria = await response.json();
        console.log(`${criteria.length} kriter yüklendi.`);
    } catch (error) {
        console.error('Kriterler yüklenirken hata:', error);
        showError('Kriterler yüklenemedi. Lütfen sayfayı yenileyin.');
    }
}

// API Key yönetimi
function getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
}

function saveApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
    updateApiStatus();
    updateSearchButton();
}

function updateApiStatus() {
    const key = getApiKey();
    if (key) {
        apiStatus.textContent = 'Aktif';
        apiStatus.classList.add('active');
        apiKeyInput.value = key;
    } else {
        apiStatus.textContent = 'Ayarlanmadı';
        apiStatus.classList.remove('active');
    }
}

function updateSearchButton() {
    const hasInput = searchInput.value.trim().length >= 3;
    searchBtn.disabled = !hasInput;
}

function toggleApiSection() {
    apiContent.classList.toggle('show');
    apiToggle.classList.toggle('open');
}

// ============ LOKAL EŞLEŞTIRME ============

function processText(text) {
    if (!text) return [];
    let processed = text.toLowerCase().trim();
    processed = processed.replace(/[.,;:!?'"()\[\]{}<>\/\\@#$%^&*+=~`|_-]/g, ' ');
    let words = processed.split(/\s+/).filter(w => w.length > 1);
    words = words.filter(w => !stopWords.has(w));
    return words;
}

function getStem(word) {
    if (word.length < 4) return word;
    for (const suffix of suffixes) {
        if (word.endsWith(suffix) && word.length > suffix.length + 2) {
            return word.slice(0, -suffix.length);
        }
    }
    return word;
}

function wordsMatch(word1, word2) {
    if (word1 === word2) return true;
    const stem1 = getStem(word1);
    const stem2 = getStem(word2);
    if (stem1 === stem2) return true;
    if (stem1.startsWith(stem2) || stem2.startsWith(stem1)) return true;
    if (synonyms[word1] && synonyms[word1].includes(word2)) return true;
    if (synonyms[word2] && synonyms[word2].includes(word1)) return true;
    return false;
}

function getSearchableText(criterion) {
    let text = criterion.title || '';
    if (criterion.details && criterion.details.length > 0) {
        text += ' ' + criterion.details.join(' ');
    }
    return text;
}

function matchCriteriaLocal(userInput) {
    const userWords = processText(userInput);
    if (userWords.length === 0) return [];
    
    const scores = criteria.map(criterion => {
        const searchText = getSearchableText(criterion);
        const criterionWords = processText(searchText);
        
        let score = 0;
        let matchedWords = [];
        
        for (const userWord of userWords) {
            for (const criterionWord of criterionWords) {
                if (wordsMatch(userWord, criterionWord)) {
                    score++;
                    if (!matchedWords.includes(userWord)) {
                        matchedWords.push(userWord);
                    }
                    break;
                }
            }
        }
        
        // Başlıkta eşleşme bonus
        const titleWords = processText(criterion.title);
        for (const userWord of userWords) {
            for (const titleWord of titleWords) {
                if (wordsMatch(userWord, titleWord)) {
                    score += 0.5;
                }
            }
        }
        
        const normalizedScore = userWords.length > 0 ? score / userWords.length : 0;
        
        return {
            criterion,
            score: normalizedScore,
            matchedWords,
            reason: matchedWords.length > 0 ? 
                `Eşleşen kelimeler: ${matchedWords.join(', ')}` : null
        };
    });
    
    return scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s, index) => ({
            criterion: s.criterion,
            reason: s.reason,
            rank: index + 1
        }));
}

// ============ GEMİNİ API EŞLEŞTIRME ============

async function matchCriteriaWithGemini(userQuery) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null; // API yok, lokal kullan
    }

    // Kriterleri kısa özet haline getir
    const criteriaList = criteria.map(c => `${c.code}: ${c.title}`).join('\n');

    const prompt = `Ders kitabı inceleme uzmanısın. Kullanıcının bildirdiği hata için en uygun MEB kriterlerini bul.

HATA: "${userQuery}"

SADECE JSON formatında cevap ver (başka hiçbir şey yazma):
{"matches":[{"code":"X.X.X","reason":"kısa açıklama"}]}

En fazla 6 kriter öner, en uygunlar üstte olsun.

KRİTERLER:
${criteriaList}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096,
                }
            })
        });

        if (!response.ok) {
            console.warn(`Gemini API hatası: ${response.status}`);
            return null; // Lokal eşleştirmeye düş
        }

        const data = await response.json();
        console.log('Gemini raw response:', data);
        
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Gemini text response:', textResponse);
        
        // Markdown code block içindeki JSON'u çıkar
        let jsonText = textResponse;
        
        // ```json ... ``` formatını temizle
        const codeBlockMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
        }
        
        // JSON objesini bul
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('Gemini yanıtı parse edilemedi:', textResponse);
            return null;
        }

        let parsedResponse;
        let jsonStr = jsonMatch[0];
        
        // Kesik JSON'u tamamla
        try {
            parsedResponse = JSON.parse(jsonStr);
        } catch (parseError) {
            console.warn('JSON parse hatası, düzeltme deneniyor:', parseError.message);
            
            // Eksik kapanışları tamamla
            // Son tamamlanmamış objeyi kaldır ve array'i kapat
            const lastCompleteObj = jsonStr.lastIndexOf('}');
            if (lastCompleteObj > 0) {
                jsonStr = jsonStr.substring(0, lastCompleteObj + 1);
                
                // Eksik kapanışları say ve ekle
                const openBrackets = (jsonStr.match(/\[/g) || []).length;
                const closeBrackets = (jsonStr.match(/\]/g) || []).length;
                const openBraces = (jsonStr.match(/\{/g) || []).length;
                const closeBraces = (jsonStr.match(/\}/g) || []).length;
                
                jsonStr += ']'.repeat(openBrackets - closeBrackets);
                jsonStr += '}'.repeat(openBraces - closeBraces);
            }
            
            try {
                parsedResponse = JSON.parse(jsonStr);
                console.log('Kesik JSON düzeltildi');
            } catch (e) {
                console.warn('JSON düzeltilemedi:', e.message);
                return null;
            }
        }
        const matches = parsedResponse.matches || [];
        
        return matches.map((match, index) => {
            const criterion = criteria.find(c => c.code === match.code);
            if (criterion) {
                return {
                    criterion,
                    reason: match.reason,
                    rank: index + 1
                };
            }
            return null;
        }).filter(r => r !== null);
        
    } catch (error) {
        console.warn('Gemini API hatası:', error.message);
        return null; // Lokal eşleştirmeye düş
    }
}

// ============ ANAHTAR KELİME ARAMA FONKSİYONU ============

function keywordSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        resultsList.innerHTML = '';
        showMoreBtn.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';
    loadingState.style.display = 'none';
    
    allResults = matchCriteriaLocal(query);
    displayResults(allResults, false, 'local');
}

// ============ GEMİNİ AI ARAMA FONKSİYONU ============

async function geminiSearch() {
    const query = searchInput.value.trim();
    if (query.length < 3) return;

    const apiKey = getApiKey();
    if (!apiKey) {
        showError('Gemini API anahtarı gerekli. Lütfen ayarlardan ekleyin.');
        return;
    }

    emptyState.style.display = 'none';
    loadingState.style.display = 'flex';
    loadingState.querySelector('p').textContent = 'Gemini AI analiz ediyor...';
    resultsList.innerHTML = '';
    showMoreBtn.style.display = 'none';
    searchBtn.disabled = true;

    try {
        const geminiResults = await matchCriteriaWithGemini(query);
        
        if (geminiResults && geminiResults.length > 0) {
            allResults = geminiResults;
            loadingState.style.display = 'none';
            displayResults(allResults, false, 'gemini');
        } else {
            // Gemini sonuç döndüremezse lokal sonuçları göster
            loadingState.style.display = 'none';
            allResults = matchCriteriaLocal(query);
            displayResults(allResults, false, 'local');
        }
        
    } catch (error) {
        console.error('Gemini hatası:', error);
        loadingState.style.display = 'none';
        
        // Hata olsa bile lokal sonuçları göster
        allResults = matchCriteriaLocal(query);
        if (allResults.length > 0) {
            displayResults(allResults, false, 'local');
        } else {
            showError(error.message);
        }
    } finally {
        updateSearchButton();
    }
}

// ============ SONUÇ GÖSTERME ============

function displayResults(results, append = false, method = 'local') {
    if (!append) {
        resultsList.innerHTML = '';
        displayedCount = 0;
        
        // Kullanılan yöntemi göster
        const methodBadge = document.createElement('div');
        methodBadge.className = 'method-badge';
        methodBadge.innerHTML = method === 'gemini' 
            ? '🤖 <span>Gemini AI ile eşleştirildi</span>'
            : '🔍 <span>Anahtar kelime eşleştirmesi</span>';
        resultsList.appendChild(methodBadge);
    }

    if (results.length === 0 && !append) {
        resultsList.innerHTML += `
            <div class="no-results">
                <div class="no-results-icon">😕</div>
                <p>Eşleşen kriter bulunamadı. Farklı bir açıklama deneyin.</p>
            </div>
        `;
        showMoreBtn.style.display = 'none';
        return;
    }

    const toDisplay = results.slice(displayedCount, displayedCount + RESULTS_PER_PAGE);
    
    toDisplay.forEach((result, index) => {
        const c = result.criterion;
        
        let detailsHtml = '';
        if (c.details && c.details.length > 0) {
            detailsHtml = `
                <div class="card-details">
                    <div class="details-label">Açıklamalar</div>
                    <ul class="details-list">
                        ${c.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        const reasonHtml = result.reason ? `
            <div class="card-reason">
                💬 ${escapeHtml(result.reason)}
            </div>
        ` : '';
        
        const card = document.createElement('div');
        card.className = 'criterion-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-header">
                <span class="code-badge">${escapeHtml(c.code)}</span>
                <div class="card-meta">
                    <div class="section-label">${escapeHtml(c.section)} • ${escapeHtml(c.main_title)}</div>
                    <div class="card-title">${escapeHtml(c.title)}</div>
                </div>
                <span class="rank-badge">${result.rank}</span>
            </div>
            ${reasonHtml}
            ${detailsHtml}
        `;
        
        resultsList.appendChild(card);
    });

    displayedCount += toDisplay.length;

    const remaining = results.length - displayedCount;
    if (remaining > 0) {
        showMoreBtn.style.display = 'flex';
        moreCount.textContent = `+${remaining}`;
    } else {
        showMoreBtn.style.display = 'none';
    }
}

function showMore() {
    displayResults(allResults, true);
}

function showError(message) {
    resultsList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    showMoreBtn.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ DEBOUNCE UTILITY ============

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced keyword search
const debouncedKeywordSearch = debounce(keywordSearch, 300);

// ============ EVENT LISTENERS ============

document.addEventListener('DOMContentLoaded', async () => {
    await loadCriteria();
    updateApiStatus();
    updateSearchButton();

    apiHeader.addEventListener('click', toggleApiSection);

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            saveApiKey(key);
            toggleApiSection();
        }
    });

    // Yazarken anlık anahtar kelime araması
    searchInput.addEventListener('input', () => {
        updateSearchButton();
        debouncedKeywordSearch();
    });
    
    // Buton tıklamasında Gemini AI araması
    searchBtn.addEventListener('click', geminiSearch);

    // Enter tuşu ile Gemini araması
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !searchBtn.disabled) {
            e.preventDefault();
            geminiSearch();
        }
    });

    showMoreBtn.addEventListener('click', showMore);

    if (getApiKey()) {
        apiContent.classList.remove('show');
    } else {
        apiContent.classList.add('show');
        apiToggle.classList.add('open');
    }
});
