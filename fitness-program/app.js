/**
 * Fitness Program Oluşturucu - Ana Uygulama
 * Tab sistemi, hazır programlar, özel program oluşturma, lightbox ve tüm etkileşimler
 */

// ==================== GLOBAL DEĞİŞKENLER ====================

const STORAGE_KEY = 'fitnessProgram_v1';

// Uygulama durumu
const appState = {
    userInfo: {
        name: '',
        goal: 'Kilo verme',
        daysPerWeek: 3,
        sessionDurationMin: 45
    },
    selectedExercises: {}, // { exerciseId: { selected, sets, reps, timeSec, weightKg } }
    filters: {
        levels: ['Başlangıç', 'Orta', 'İleri'],
        regions: []
    },
    currentTab: 'preset', // 'preset', 'exercises', 'myprogram'
    currentPresetProgram: null // Seçili hazır program ID'si
};

// ==================== BAŞLATMA ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Fitness Program Oluşturucu başlatılıyor...');
    initializeApp();
});

function initializeApp() {
    // LocalStorage'dan veri yükle
    loadFromLocalStorage();

    // UI bileşenlerini başlat
    initializeTabs();
    initializeFilters();
    renderPresetPrograms();
    renderExercises();
    updateProgramSummary();
    updateDynamicWarmup();
    updateMyProgramView();

    // Event listener'ları ekle
    setupEventListeners();

    // Kullanıcı bilgilerini formda göster
    populateUserInfoForm();

    // Lightbox'ı başlat
    initializeLightbox();

    showToast('Uygulama hazır! Hazır programları inceleyin veya kendi programınızı oluşturun.', 'success');
}

// ==================== TAB SİSTEMİ ====================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    appState.currentTab = tabId;

    // Tüm tab butonlarını ve içerikleri pasif yap
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Seçili olanı aktif yap
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-${tabId}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    // Kendi programım sekmesine geçildiğinde view'i güncelle
    if (tabId === 'myprogram') {
        updateMyProgramView();
    }
}

// ==================== HAZIR PROGRAMLAR ====================

function renderPresetPrograms() {
    const container = document.getElementById('presetProgramsGrid');
    if (!container) return;

    container.innerHTML = '';

    PRESET_PROGRAMS.forEach(program => {
        const card = createPresetProgramCard(program);
        container.appendChild(card);
    });
}

function createPresetProgramCard(program) {
    const card = document.createElement('div');
    card.className = 'preset-program-card';

    // Gradient renkleri seviyeye göre değiştir
    let gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (program.level === 'Başlangıç') {
        gradient = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (program.level === 'İleri') {
        gradient = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    }

    card.style.background = gradient;

    card.innerHTML = `
        <div class="preset-program-header">
            <h3 class="preset-program-name">${program.name}</h3>
            <div class="preset-program-badges">
                <span class="preset-badge">${program.level}</span>
                <span class="preset-badge">${program.goal}</span>
            </div>
            <p class="preset-program-description">${program.description}</p>
        </div>

        <div class="preset-program-details">
            <div class="preset-detail">
                <span class="preset-detail-value">${program.daysPerWeek}</span>
                <span class="preset-detail-label">Gün/Hafta</span>
            </div>
            <div class="preset-detail">
                <span class="preset-detail-value">${program.estimatedDuration}</span>
                <span class="preset-detail-label">Dakika/Gün</span>
            </div>
        </div>

        <div class="preset-program-days">
            <div class="preset-day-item">📅 Gün 1: ${program.days[1].name}</div>
            <div class="preset-day-item">📅 Gün 2: ${program.days[2].name}</div>
            <div class="preset-day-item">📅 Gün 3: ${program.days[3].name}</div>
        </div>

        <div class="preset-program-action">
            <button class="btn" onclick="loadPresetProgram('${program.id}')">
                🚀 Bu Programı Seç
            </button>
        </div>
    `;

    return card;
}

// Global fonksiyon - HTML'den çağrılabilmesi için
window.loadPresetProgram = function(programId) {
    const program = PRESET_PROGRAMS.find(p => p.id === programId);
    if (!program) {
        showToast('Program bulunamadı!', 'error');
        return;
    }

    // Önce tüm seçimleri temizle
    appState.selectedExercises = {};

    // Programdaki tüm egzersizleri seç
    Object.values(program.days).forEach(day => {
        day.exercises.forEach(exerciseId => {
            const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
            if (exercise) {
                appState.selectedExercises[exerciseId] = {
                    selected: true,
                    sets: exercise.defaultSets,
                    reps: exercise.defaultReps,
                    timeSec: exercise.defaultTimeSec,
                    weightKg: exercise.defaultWeightKg
                };
            }
        });
    });

    // Kullanıcı bilgilerini güncelle
    appState.userInfo.goal = program.goal;
    appState.userInfo.daysPerWeek = program.daysPerWeek;
    appState.userInfo.sessionDurationMin = program.estimatedDuration;
    populateUserInfoForm();

    // Mevcut programı kaydet
    appState.currentPresetProgram = programId;

    // Kaydet
    saveToLocalStorage();

    // UI'ı güncelle
    updateProgramSummary();
    updateDynamicWarmup();
    updateMyProgramView();

    // Egzersiz listesi sekmesinde de seçimleri göster
    renderExercises();

    showToast(`"${program.name}" yüklendi! ${Object.keys(appState.selectedExercises).length} egzersiz seçildi.`, 'success');

    // Kendi programım sekmesine geç
    switchTab('myprogram');
};

// ==================== KENDİ PROGRAMIM GÖRÜNÜMÜ ====================

function updateMyProgramView() {
    const container = document.getElementById('myProgramContent');
    if (!container) return;

    // Seçili egzersizleri al
    const selectedExerciseIds = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => id);

    if (selectedExerciseIds.length === 0) {
        // Boş durum
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏋️</div>
                <h3>Henüz bir program oluşturmadınız</h3>
                <p>"Egzersiz Listesi" sekmesinden egzersizleri seçin ve "Kendi Programımı Oluştur" butonuna tıklayın.</p>
                <p>veya</p>
                <p>"Hazır Programlar" sekmesinden hazır bir program seçin.</p>
            </div>
        `;
        return;
    }

    // Egzersizleri al
    const selectedExercises = selectedExerciseIds.map(id => {
        const exercise = EXERCISES_DATA.find(ex => ex.id === id);
        const data = appState.selectedExercises[id];
        return { ...exercise, ...data };
    }).filter(ex => ex !== undefined);

    // Hazır programsa günlere göre göster
    if (appState.currentPresetProgram) {
        const program = PRESET_PROGRAMS.find(p => p.id === appState.currentPresetProgram);
        if (program) {
            renderPresetProgramView(container, program);
            return;
        }
    }

    // Özel program - bölgelere göre grupla
    renderCustomProgramView(container, selectedExercises);
}

function renderPresetProgramView(container, program) {
    let html = `
        <div class="my-program-preset-info">
            <h3 style="text-align:center; margin-bottom:2rem; color: var(--primary-color);">
                📦 ${program.name}
            </h3>
        </div>
    `;

    // Her gün için
    [1, 2, 3].forEach(dayNum => {
        const day = program.days[dayNum];
        html += `
            <div class="my-program-day-section">
                <div class="my-program-day-header">
                    <h3 class="my-program-day-title">${day.name}</h3>
                    <span style="color: var(--text-secondary);">${day.exercises.length} egzersiz</span>
                </div>
                <div class="my-program-exercises-grid">
        `;

        day.exercises.forEach(exerciseId => {
            const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
            if (exercise) {
                const data = appState.selectedExercises[exerciseId] || {};
                html += createMyProgramExerciseCard(exercise, data);
            }
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderCustomProgramView(container, exercises) {
    // Bölgelere göre grupla
    const groupedByRegion = {};
    exercises.forEach(exercise => {
        const mainRegion = exercise.region[0];
        if (!groupedByRegion[mainRegion]) {
            groupedByRegion[mainRegion] = [];
        }
        groupedByRegion[mainRegion].push(exercise);
    });

    let html = `
        <div class="my-program-custom-info">
            <h3 style="text-align:center; margin-bottom:2rem; color: var(--primary-color);">
                ⭐ Özel Programınız
            </h3>
        </div>
    `;

    Object.entries(groupedByRegion).forEach(([region, exList]) => {
        html += `
            <div class="my-program-day-section">
                <div class="my-program-day-header">
                    <h3 class="my-program-day-title">${region}</h3>
                    <span style="color: var(--text-secondary);">${exList.length} egzersiz</span>
                </div>
                <div class="my-program-exercises-grid">
        `;

        exList.forEach(exercise => {
            html += createMyProgramExerciseCard(exercise, appState.selectedExercises[exercise.id]);
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function createMyProgramExerciseCard(exercise, data) {
    const sets = data.sets || exercise.defaultSets;
    const reps = data.reps || exercise.defaultReps;
    const timeSec = data.timeSec || exercise.defaultTimeSec;
    const weightKg = data.weightKg !== undefined ? data.weightKg : exercise.defaultWeightKg;

    return `
        <div class="exercise-card selected">
            ${createExerciseImageHTML(exercise)}
            <div class="exercise-card-title">
                <h3>${exercise.name}</h3>
                <span class="exercise-badge badge-level-${exercise.level}">${exercise.level}</span>
            </div>
            <div class="exercise-regions">
                ${exercise.region.map(r => `<span class="region-tag">${r}</span>`).join('')}
            </div>
            <div class="exercise-details" style="grid-template-columns: repeat(2, 1fr);">
                <div class="detail-item">
                    <strong>Set:</strong> ${sets}
                </div>
                ${exercise.type === 'reps' ? `
                    <div class="detail-item">
                        <strong>Tekrar:</strong> ${reps}
                    </div>
                ` : `
                    <div class="detail-item">
                        <strong>Süre:</strong> ${timeSec}sn
                    </div>
                `}
                <div class="detail-item">
                    <strong>Ağırlık:</strong> ${weightKg}kg
                </div>
                <div class="detail-item">
                    <strong>Dinlenme:</strong> ${exercise.restSec}sn
                </div>
            </div>
            ${exercise.notes ? `<div class="exercise-notes">💡 ${exercise.notes}</div>` : ''}
        </div>
    `;
}

// ==================== PLACEHOLDER GÖRSEL SİSTEMİ ====================

/**
 * Her egzersiz için placeholder görsel icon'u belirle
 */
function getExerciseIcon(exercise) {
    // Bölgeye göre emoji icon'ları
    const regionIcons = {
        'Karın': '🦴',
        'Göbek': '🦴',
        'Bel': '🦴',
        'Core': '🦴',
        'Göğüs': '💪',
        'Sırt': '🏋️',
        'Omuz': '🤸',
        'Kol': '💪',
        'Biceps': '💪',
        'Triceps': '💪',
        'Bacak': '🦵',
        'Kalça': '🍑',
        'Ayak': '👟',
        'Tüm Vücut': '🏃'
    };

    const mainRegion = exercise.region[0];
    return regionIcons[mainRegion] || '🏋️';
}

function createExerciseImageHTML(exercise) {
    const icon = getExerciseIcon(exercise);

    // Egzersiz adından otomatik görsel yolu oluştur
    const imagePath = `images/${exercise.name}.jpg`;
    const videoPath = `video/${exercise.name}.gif`;

    // Önce gerçek görsel yolunu dene
    return `
        <div class="exercise-image-container">
            <img src="${imagePath}"
                 alt="${exercise.name}"
                 class="exercise-image"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 onclick="openLightbox('${imagePath}', '${exercise.name}')">
            <div class="exercise-image-placeholder" style="display:none;">
                ${icon}
                <div class="exercise-image-placeholder-text">Resim Eklenecek</div>
            </div>
        </div>
    `;
}

// ==================== LIGHTBOX (GÖRSEL BÜYÜTME) ====================

function initializeLightbox() {
    const modal = document.getElementById('lightboxModal');
    const closeBtn = document.querySelector('.lightbox-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLightbox();
            }
        });
    }

    // ESC tuşuyla kapatma
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}

function openLightbox(imageUrl, caption) {
    if (!imageUrl || imageUrl === '#') {
        showToast('Görsel bulunamadı', 'error');
        return;
    }

    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImage');
    const captionText = document.getElementById('lightboxCaption');

    if (modal && img) {
        modal.classList.add('active');
        img.src = imageUrl;
        if (captionText) {
            captionText.textContent = caption;
        }
    }
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==================== LOCALSTORAGE İŞLEMLERİ ====================

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);

            if (parsed.userInfo) {
                appState.userInfo = { ...appState.userInfo, ...parsed.userInfo };
            }

            if (parsed.selectedExercises) {
                appState.selectedExercises = parsed.selectedExercises;
            }

            if (parsed.currentPresetProgram) {
                appState.currentPresetProgram = parsed.currentPresetProgram;
            }

            console.log('LocalStorage\'dan veri yüklendi:', parsed);
        }
    } catch (error) {
        console.error('LocalStorage okuma hatası:', error);
        showToast('Kaydedilmiş program yüklenemedi.', 'error');
    }
}

function saveToLocalStorage() {
    try {
        const dataToSave = {
            userInfo: appState.userInfo,
            selectedExercises: appState.selectedExercises,
            currentPresetProgram: appState.currentPresetProgram,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('LocalStorage\'a kaydedildi:', dataToSave);
        return true;
    } catch (error) {
        console.error('LocalStorage yazma hatası:', error);
        showToast('Program kaydedilemedi.', 'error');
        return false;
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('LocalStorage temizlendi');
        return true;
    } catch (error) {
        console.error('LocalStorage temizleme hatası:', error);
        return false;
    }
}

// ==================== FİLTRELER ====================

function initializeFilters() {
    const regionFiltersContainer = document.getElementById('regionFilters');
    if (!regionFiltersContainer) return;

    const uniqueRegions = [...new Set(REGIONS)].sort();

    uniqueRegions.forEach(region => {
        const label = document.createElement('label');
        label.className = 'filter-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = region;

        const span = document.createElement('span');
        span.textContent = region;

        label.appendChild(checkbox);
        label.appendChild(span);
        regionFiltersContainer.appendChild(label);
    });
}

function getActiveFilters() {
    const levelCheckboxes = document.querySelectorAll('#levelFilters input[type="checkbox"]:checked');
    const levels = Array.from(levelCheckboxes).map(cb => cb.value);

    const regionCheckboxes = document.querySelectorAll('#regionFilters input[type="checkbox"]:checked');
    const regions = Array.from(regionCheckboxes).map(cb => cb.value);

    return { levels, regions };
}

function applyFilters() {
    const filters = getActiveFilters();
    appState.filters = filters;

    console.log('Filtreler uygulanıyor:', filters);
    renderExercises();
    showToast('Filtreler uygulandı', 'info');
}

function resetFilters() {
    document.querySelectorAll('#levelFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });

    document.querySelectorAll('#regionFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    applyFilters();
}

// ==================== EGZERSİZ RENDER ====================

function renderExercises() {
    const container = document.getElementById('exerciseCards');
    if (!container) return;

    const filters = appState.filters;

    let filteredExercises = EXERCISES_DATA.filter(exercise => {
        const levelMatch = filters.levels.length === 0 || filters.levels.includes(exercise.level);
        const regionMatch = filters.regions.length === 0 ||
            exercise.region.some(r => filters.regions.includes(r));

        return levelMatch && regionMatch;
    });

    document.getElementById('exerciseCount').textContent = filteredExercises.length;

    container.innerHTML = '';

    if (filteredExercises.length === 0) {
        container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 2rem; color: var(--text-secondary);">Seçilen filtrelere uygun egzersiz bulunamadı.</p>';
        return;
    }

    filteredExercises.forEach(exercise => {
        const card = createExerciseCard(exercise);
        container.appendChild(card);
    });
}

function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = exercise.id;

    const isSelected = appState.selectedExercises[exercise.id]?.selected || false;
    if (isSelected) {
        card.classList.add('selected');
    }

    const savedData = appState.selectedExercises[exercise.id] || {};
    const sets = savedData.sets || exercise.defaultSets;
    const reps = savedData.reps || exercise.defaultReps;
    const timeSec = savedData.timeSec || exercise.defaultTimeSec;
    const weightKg = savedData.weightKg !== undefined ? savedData.weightKg : exercise.defaultWeightKg;

    card.innerHTML = `
        ${createExerciseImageHTML(exercise)}

        <div class="exercise-card-header">
            <div class="exercise-card-title">
                <h3>${exercise.name}</h3>
                <div>
                    <span class="exercise-badge badge-level-${exercise.level}">${exercise.level}</span>
                </div>
            </div>
            <input type="checkbox" class="exercise-checkbox" ${isSelected ? 'checked' : ''}>
        </div>

        <div class="exercise-regions">
            ${exercise.region.map(r => `<span class="region-tag">${r}</span>`).join('')}
        </div>

        <div class="exercise-details">
            <div class="detail-item">
                <label>Set:</label>
                <input type="number" class="input-sets" min="1" max="10" value="${sets}">
            </div>
            ${exercise.type === 'reps' ? `
                <div class="detail-item">
                    <label>Tekrar:</label>
                    <input type="number" class="input-reps" min="1" max="100" value="${reps || 10}">
                </div>
            ` : `
                <div class="detail-item">
                    <label>Süre (sn):</label>
                    <input type="number" class="input-time" min="5" max="300" value="${timeSec || 30}">
                </div>
            `}
            <div class="detail-item">
                <label>Ağırlık (kg):</label>
                <input type="number" class="input-weight" min="0" max="200" step="0.5" value="${weightKg}">
            </div>
            <div class="detail-item">
                <label>Dinlenme (sn):</label>
                <input type="number" class="input-rest" min="0" max="300" value="${exercise.restSec}">
            </div>
        </div>

        <div class="exercise-media">
            <a href="images/${exercise.name}.jpg" class="media-link" target="_blank">
                📷 Görsel
            </a>
            <a href="video/${exercise.name}.gif" class="media-link" target="_blank">
                🎥 Video
            </a>
        </div>

        ${exercise.notes ? `<div class="exercise-notes">💡 ${exercise.notes}</div>` : ''}
    `;

    const checkbox = card.querySelector('.exercise-checkbox');
    checkbox.addEventListener('change', (e) => handleExerciseSelection(exercise.id, card));

    card.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', () => updateExerciseData(exercise.id, card));
    });

    return card;
}

// ==================== EGZERSİZ SEÇİMİ ====================

function handleExerciseSelection(exerciseId, cardElement) {
    const checkbox = cardElement.querySelector('.exercise-checkbox');
    const isSelected = checkbox.checked;

    if (isSelected) {
        cardElement.classList.add('selected');

        if (!appState.selectedExercises[exerciseId]) {
            appState.selectedExercises[exerciseId] = {};
        }
        appState.selectedExercises[exerciseId].selected = true;

        updateExerciseData(exerciseId, cardElement);
    } else {
        cardElement.classList.remove('selected');
        if (appState.selectedExercises[exerciseId]) {
            appState.selectedExercises[exerciseId].selected = false;
        }
    }

    updateProgramSummary();
    updateDynamicWarmup();
}

function updateExerciseData(exerciseId, cardElement) {
    const sets = parseInt(cardElement.querySelector('.input-sets')?.value) || 3;
    const reps = parseInt(cardElement.querySelector('.input-reps')?.value) || null;
    const timeSec = parseInt(cardElement.querySelector('.input-time')?.value) || null;
    const weightKg = parseFloat(cardElement.querySelector('.input-weight')?.value) || 0;

    if (!appState.selectedExercises[exerciseId]) {
        appState.selectedExercises[exerciseId] = {};
    }

    appState.selectedExercises[exerciseId] = {
        ...appState.selectedExercises[exerciseId],
        sets,
        reps,
        timeSec,
        weightKg
    };

    updateProgramSummary();
}

// ==================== PROGRAM ÖZETİ ====================

function updateProgramSummary() {
    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => EXERCISES_DATA.find(ex => ex.id === id))
        .filter(ex => ex !== undefined);

    const selectedCount = selectedExercises.length;
    document.getElementById('selectedCount').textContent = selectedCount;

    const regionsSet = new Set();
    selectedExercises.forEach(exercise => {
        exercise.region.forEach(r => regionsSet.add(r));
    });
    const regionsText = regionsSet.size > 0 ? Array.from(regionsSet).join(', ') : '-';
    document.getElementById('selectedRegions').textContent = regionsText;

    let totalTime = 10;

    selectedExercises.forEach(exercise => {
        const data = appState.selectedExercises[exercise.id];
        const sets = data.sets || exercise.defaultSets;

        if (exercise.type === 'reps') {
            const reps = data.reps || exercise.defaultReps;
            totalTime += sets * ((reps * 2) / 60 + (exercise.restSec / 60));
        } else {
            const timeSec = data.timeSec || exercise.defaultTimeSec;
            totalTime += sets * ((timeSec / 60) + (exercise.restSec / 60));
        }
    });

    document.getElementById('estimatedTime').textContent = Math.round(totalTime) + ' dk';
}

// ==================== DİNAMİK ISINMA ====================

function updateDynamicWarmup() {
    const container = document.getElementById('dynamicWarmup');
    if (!container) return;

    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => EXERCISES_DATA.find(ex => ex.id === id))
        .filter(ex => ex !== undefined);

    const regionsSet = new Set();
    selectedExercises.forEach(exercise => {
        exercise.region.forEach(r => regionsSet.add(r));
    });

    const warmupSuggestions = [];

    if (Array.from(regionsSet).some(r => ['Karın', 'Göbek', 'Bel', 'Core'].includes(r))) {
        warmupSuggestions.push(GENERAL_WARMUP.abs);
    }

    if (Array.from(regionsSet).some(r => ['Göğüs', 'Omuz', 'Kol'].includes(r))) {
        warmupSuggestions.push(GENERAL_WARMUP.chest);
    }

    if (Array.from(regionsSet).some(r => ['Sırt', 'Lats'].includes(r))) {
        warmupSuggestions.push(GENERAL_WARMUP.back);
    }

    if (Array.from(regionsSet).some(r => ['Bacak', 'Kalça', 'Ayak', 'Baldır'].includes(r))) {
        warmupSuggestions.push(GENERAL_WARMUP.legs);
    }

    container.innerHTML = '';
    if (warmupSuggestions.length > 0) {
        warmupSuggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'warmup-item';
            div.innerHTML = `<p>${suggestion}</p>`;
            container.appendChild(div);
        });
    }
}

// ==================== KULLANICI BİLGİLERİ ====================

function populateUserInfoForm() {
    document.getElementById('userName').value = appState.userInfo.name || '';
    document.getElementById('userGoal').value = appState.userInfo.goal || 'Kilo verme';
    document.getElementById('daysPerWeek').value = appState.userInfo.daysPerWeek || 3;
    document.getElementById('sessionDuration').value = appState.userInfo.sessionDurationMin || 45;
}

function saveUserInfo() {
    appState.userInfo = {
        name: document.getElementById('userName').value,
        goal: document.getElementById('userGoal').value,
        daysPerWeek: parseInt(document.getElementById('daysPerWeek').value),
        sessionDurationMin: parseInt(document.getElementById('sessionDuration').value)
    };

    if (saveToLocalStorage()) {
        showToast('Bilgileriniz kaydedildi!', 'success');
    }
}

// ==================== PROGRAM KAYDETME ====================

function saveProgram() {
    const selectedCount = Object.values(appState.selectedExercises)
        .filter(data => data.selected).length;

    if (selectedCount === 0) {
        showToast('Lütfen en az bir egzersiz seçin!', 'error');
        return;
    }

    if (saveToLocalStorage()) {
        showToast(`Program kaydedildi! ${selectedCount} egzersiz seçildi.`, 'success');
        updateMyProgramView();
        switchTab('myprogram');
    }
}

function clearProgram() {
    if (confirm('Programı temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        appState.selectedExercises = {};
        appState.currentPresetProgram = null;

        clearLocalStorage();

        renderExercises();
        updateProgramSummary();
        updateDynamicWarmup();
        updateMyProgramView();

        showToast('Program temizlendi.', 'info');
    }
}

// ==================== PDF OLUŞTURMA ====================

function generatePDF() {
    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => {
            const exercise = EXERCISES_DATA.find(ex => ex.id === id);
            const data = appState.selectedExercises[id];
            return { ...exercise, ...data };
        })
        .filter(ex => ex !== undefined);

    if (selectedExercises.length === 0) {
        showToast('Lütfen en az bir egzersiz seçin!', 'error');
        return;
    }

    try {
        showToast('PDF oluşturuluyor...', 'info');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = margin;
        let pageNumber = 1;

        // Sayfa numarası ekleme fonksiyonu
        function addPageNumber() {
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Sayfa ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.setTextColor(0, 0, 0);
        }

        // Yeni sayfa ekleme fonksiyonu
        function checkAndAddPage(requiredSpace) {
            if (yPos + requiredSpace > pageHeight - 25) {
                addPageNumber();
                doc.addPage();
                pageNumber++;
                yPos = margin;
                return true;
            }
            return false;
        }

        // === BAŞLIK ===
        doc.setFillColor(102, 126, 234); // Mor gradient rengi
        doc.rect(margin, yPos, contentWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('KISISEL FITNESS PROGRAMIM', pageWidth / 2, yPos + 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 20;

        // === KULLANICI BİLGİLERİ ===
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos, contentWidth, 25, 'F');
        yPos += 5;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        if (appState.userInfo.name) {
            doc.setFont(undefined, 'bold');
            doc.text('Ad:', margin + 5, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(appState.userInfo.name, margin + 40, yPos);
            yPos += 6;
        }

        doc.setFont(undefined, 'bold');
        doc.text('Hedef:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(appState.userInfo.goal, margin + 40, yPos);

        doc.setFont(undefined, 'bold');
        doc.text('Haftalik:', margin + 105, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(`${appState.userInfo.daysPerWeek} gun/hafta`, margin + 135, yPos);
        yPos += 6;

        doc.setFont(undefined, 'bold');
        doc.text('Tarih:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString('tr-TR'), margin + 40, yPos);
        yPos += 10;

        // === ISINMA ===
        checkAndAddPage(40);
        doc.setFillColor(254, 243, 199); // Sarı arka plan
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('ISINMA', margin + 3, yPos + 6);
        yPos += 12;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Genel: 5-10 dakika hafif tempo yuruyus veya kosu', margin + 3, yPos);
        yPos += 6;

        const regionsSet = new Set();
        selectedExercises.forEach(exercise => {
            exercise.region.forEach(r => regionsSet.add(r));
        });

        const warmupTexts = [];
        if (Array.from(regionsSet).some(r => ['Karın', 'Göbek', 'Bel', 'Core'].includes(r))) {
            warmupTexts.push(GENERAL_WARMUP.abs);
        }
        if (Array.from(regionsSet).some(r => ['Göğüs', 'Omuz', 'Kol'].includes(r))) {
            warmupTexts.push(GENERAL_WARMUP.chest);
        }
        if (Array.from(regionsSet).some(r => ['Sırt', 'Lats'].includes(r))) {
            warmupTexts.push(GENERAL_WARMUP.back);
        }
        if (Array.from(regionsSet).some(r => ['Bacak', 'Kalça', 'Ayak', 'Baldır'].includes(r))) {
            warmupTexts.push(GENERAL_WARMUP.legs);
        }

        warmupTexts.forEach(text => {
            const lines = doc.splitTextToSize(text, contentWidth - 6);
            checkAndAddPage(lines.length * 5);
            doc.text(lines, margin + 3, yPos);
            yPos += lines.length * 5;
        });

        yPos += 5;

        // === EGZERSİZLER ===
        const groupedByRegion = {};
        selectedExercises.forEach(exercise => {
            const mainRegion = exercise.region[0];
            if (!groupedByRegion[mainRegion]) {
                groupedByRegion[mainRegion] = [];
            }
            groupedByRegion[mainRegion].push(exercise);
        });

        Object.entries(groupedByRegion).forEach(([region, exercises]) => {
            checkAndAddPage(15);

            // Bölge başlığı
            doc.setFillColor(236, 254, 255); // Açık mavi
            doc.rect(margin, yPos, contentWidth, 8, 'F');
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(region.toUpperCase(), margin + 3, yPos + 6);
            yPos += 12;

            exercises.forEach((exercise, index) => {
                checkAndAddPage(35);

                // Egzersiz kartı arka planı
                doc.setFillColor(250, 250, 250);
                doc.rect(margin + 2, yPos, contentWidth - 4, 28, 'F');

                // Egzersiz adı
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${exercise.name}`, margin + 5, yPos + 6);

                // Seviye badge
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(`[${exercise.level}]`, margin + 5 + doc.getTextWidth(`${index + 1}. ${exercise.name}`) + 2, yPos + 6);
                doc.setTextColor(0, 0, 0);
                yPos += 10;

                // Detaylar
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const sets = exercise.sets || exercise.defaultSets;
                const reps = exercise.reps || exercise.defaultReps;
                const timeSec = exercise.timeSec || exercise.defaultTimeSec;
                const weightKg = exercise.weightKg !== undefined ? exercise.weightKg : exercise.defaultWeightKg;

                doc.setFont(undefined, 'bold');
                doc.text('Set:', margin + 5, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(`${sets}`, margin + 20, yPos);

                if (exercise.type === 'reps') {
                    doc.setFont(undefined, 'bold');
                    doc.text('Tekrar:', margin + 35, yPos);
                    doc.setFont(undefined, 'normal');
                    doc.text(`${reps}`, margin + 55, yPos);
                } else {
                    doc.setFont(undefined, 'bold');
                    doc.text('Sure:', margin + 35, yPos);
                    doc.setFont(undefined, 'normal');
                    doc.text(`${timeSec}sn`, margin + 55, yPos);
                }

                doc.setFont(undefined, 'bold');
                doc.text('Agirlik:', margin + 75, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(`${weightKg}kg`, margin + 95, yPos);

                doc.setFont(undefined, 'bold');
                doc.text('Dinlenme:', margin + 115, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(`${exercise.restSec}sn`, margin + 140, yPos);
                yPos += 7;

                // Notlar
                if (exercise.notes) {
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'italic');
                    doc.setTextColor(80, 80, 80);
                    const notesLines = doc.splitTextToSize(`Not: ${exercise.notes}`, contentWidth - 14);
                    doc.text(notesLines, margin + 5, yPos);
                    yPos += notesLines.length * 4;
                    doc.setTextColor(0, 0, 0);
                }

                yPos += 5;
            });

            yPos += 3;
        });

        // Son sayfa numarası ve footer
        addPageNumber();
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Bu program egitim amaclidir. Saglik durumunuz icin profesyonel gorus aliniz.',
                 pageWidth / 2, pageHeight - 5, { align: 'center' });

        const fileName = `fitness-program-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showToast('PDF basariyla indirildi!', 'success');
    } catch (error) {
        console.error('PDF olusturma hatasi:', error);
        showToast('PDF olusturulurken hata olustu.', 'error');
    }
}

// ==================== TOAST BİLDİRİMLERİ ====================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    document.getElementById('saveUserInfo').addEventListener('click', saveUserInfo);

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    document.getElementById('saveProgram').addEventListener('click', saveProgram);
    document.getElementById('downloadPDF').addEventListener('click', generatePDF);
    document.getElementById('clearProgram').addEventListener('click', clearProgram);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function checkLocalStorageSupport() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        showToast('LocalStorage desteklenmiyor. Programınız kaydedilemeyecek.', 'error');
        return false;
    }
}

checkLocalStorageSupport();
