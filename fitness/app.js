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

    // Egzersiz ekleme modalını başlat
    initializeAddExerciseModal();

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
    if (!container) {
        console.error('presetProgramsGrid container bulunamadı!');
        return;
    }

    container.innerHTML = '';

    PRESET_PROGRAMS.forEach(program => {
        const card = createPresetProgramCard(program);
        container.appendChild(card);
    });

    console.log('Preset programlar render edildi, toplam:', PRESET_PROGRAMS.length);
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

    // Kartın tamamını tıklanabilir yap - onclick ile
    card.setAttribute('onclick', `selectPresetProgram('${program.id}')`);
    card.style.cursor = 'pointer';

    // HTML içeriğini oluştur
    const cardContent = `
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
            <button class="btn btn-preset-select">
                🚀 Bu Programı Seç
            </button>
        </div>
    `;

    card.innerHTML = cardContent;

    return card;
}

// GLOBAL fonksiyon - HTML onclick'ten çağrılabilir
window.selectPresetProgram = function(programId) {
    console.log('loadPresetProgram çağrıldı, programId:', programId);

    const program = PRESET_PROGRAMS.find(p => p.id === programId);
    if (!program) {
        console.error('Program bulunamadı:', programId);
        showToast('Program bulunamadı!', 'error');
        return;
    }

    console.log('Program bulundu:', program.name);

    // Önce tüm seçimleri temizle
    appState.selectedExercises = {};

    // Programdaki tüm egzersizleri seç
    let totalExercises = 0;
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
                totalExercises++;
            }
        });
    });

    console.log('Toplam egzersiz seçildi:', totalExercises);

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

    console.log('Toast gösteriliyor...');
    showToast(`"${program.name}" yüklendi! ${Object.keys(appState.selectedExercises).length} egzersiz seçildi.`, 'success');

    // Kendi programım sekmesine geç
    console.log('Sekme değiştiriliyor: myprogram');
    switchTab('myprogram');
};

// GLOBAL fonksiyon - Programdan egzersiz kaldır
window.removeExerciseFromProgram = function(exerciseId) {
    console.log('Egzersiz kaldırılıyor:', exerciseId);

    // Egzersizi seçili listeden kaldır
    if (appState.selectedExercises[exerciseId]) {
        delete appState.selectedExercises[exerciseId];

        // LocalStorage'a kaydet
        saveToLocalStorage();

        // UI'ı güncelle
        updateProgramSummary();
        updateDynamicWarmup();
        updateMyProgramView();
        renderExercises(); // Egzersiz listesindeki seçim durumunu güncelle

        showToast('Egzersiz programdan kaldırıldı', 'success');
    }
};

// GLOBAL fonksiyon - Yeni egzersiz ekleme modalını göster
window.showAddExerciseModal = function() {
    console.log('Egzersiz ekleme modalı açılıyor...');

    const modal = document.getElementById('addExerciseModal');
    if (!modal) {
        console.error('addExerciseModal bulunamadı!');
        return;
    }

    // Modal içeriğini oluştur - tüm egzersizleri listele
    const modalBody = modal.querySelector('.add-exercise-modal-body');
    if (!modalBody) {
        console.error('Modal body bulunamadı!');
        return;
    }

    // Egzersizleri filtrele - zaten seçili olanları işaretle
    let html = '<div class="add-exercise-grid">';

    EXERCISES_DATA.forEach(exercise => {
        const isSelected = appState.selectedExercises[exercise.id]?.selected;
        const cardClass = isSelected ? 'exercise-card-mini selected-already' : 'exercise-card-mini';

        html += `
            <div class="${cardClass}" data-exercise-id="${exercise.id}">
                <div class="exercise-card-mini-header">
                    <h4>${exercise.name}</h4>
                    <span class="exercise-badge badge-level-${exercise.level}">${exercise.level}</span>
                </div>
                <div class="exercise-regions-mini">
                    ${exercise.region.slice(0, 2).map(r => `<span class="region-tag-mini">${r}</span>`).join('')}
                </div>
                <div class="exercise-details-mini">
                    <span>${exercise.defaultSets} set</span>
                    ${exercise.type === 'reps' ? `<span>${exercise.defaultReps} tekrar</span>` : `<span>${exercise.defaultTimeSec}sn</span>`}
                </div>
                ${isSelected
                    ? '<div class="already-selected-badge">✓ Seçili</div>'
                    : `<button class="btn-add-exercise" onclick="addExerciseToProgram('${exercise.id}')">+ Ekle</button>`
                }
            </div>
        `;
    });

    html += '</div>';
    modalBody.innerHTML = html;

    // Modalı göster
    modal.style.display = 'block';
};

// GLOBAL fonksiyon - Programa yeni egzersiz ekle
window.addExerciseToProgram = function(exerciseId) {
    console.log('Egzersiz programa ekleniyor:', exerciseId);

    const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
    if (!exercise) {
        console.error('Egzersiz bulunamadı:', exerciseId);
        return;
    }

    // Egzersizi seçili listeye ekle
    appState.selectedExercises[exerciseId] = {
        selected: true,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        timeSec: exercise.defaultTimeSec,
        weightKg: exercise.defaultWeightKg
    };

    // LocalStorage'a kaydet
    saveToLocalStorage();

    // UI'ı güncelle
    updateProgramSummary();
    updateDynamicWarmup();
    updateMyProgramView();
    renderExercises();

    showToast(`"${exercise.name}" programa eklendi`, 'success');

    // Modalı kapat
    closeAddExerciseModal();
};

// GLOBAL fonksiyon - Egzersiz ekleme modalını kapat
window.closeAddExerciseModal = function() {
    const modal = document.getElementById('addExerciseModal');
    if (modal) {
        modal.style.display = 'none';
    }
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
            <h3 style="text-align:center; margin-bottom:1rem; color: var(--primary-color);">
                📦 ${program.name}
            </h3>
            <div style="text-align:center; margin-bottom:2rem;">
                <button class="btn btn-secondary" onclick="showAddExerciseModal()">
                    ➕ Yeni Egzersiz Ekle
                </button>
            </div>
        </div>
    `;

    // Ekstra egzersizleri bul (programda olmayan ama seçilmiş olanlar)
    const programExerciseIds = new Set();
    Object.values(program.days).forEach(day => {
        day.exercises.forEach(id => programExerciseIds.add(id));
    });

    const extraExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected && !programExerciseIds.has(id))
        .map(([id]) => {
            const exercise = EXERCISES_DATA.find(ex => ex.id === id);
            return { ...exercise, ...appState.selectedExercises[id] };
        });

    // Her gün için
    [1, 2, 3].forEach(dayNum => {
        const day = program.days[dayNum];

        // Bu günde gerçekten seçili olan egzersizleri filtrele
        const daySelectedExercises = day.exercises.filter(exerciseId => {
            const data = appState.selectedExercises[exerciseId];
            return data && data.selected;
        });

        html += `
            <div class="my-program-day-section">
                <div class="my-program-day-header">
                    <h3 class="my-program-day-title">${day.name}</h3>
                    <span style="color: var(--text-secondary);">${daySelectedExercises.length} egzersiz</span>
                </div>
                <div class="my-program-exercises-grid">
        `;

        day.exercises.forEach(exerciseId => {
            const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
            const data = appState.selectedExercises[exerciseId];

            // Sadece seçili olan egzersizleri göster
            if (exercise && data && data.selected) {
                html += createMyProgramExerciseCard(exercise, data, true); // true = göster kaldır butonu
            }
        });

        html += `
                </div>
            </div>
        `;
    });

    // Ekstra egzersizler varsa onları da göster
    if (extraExercises.length > 0) {
        html += `
            <div class="my-program-day-section">
                <div class="my-program-day-header">
                    <h3 class="my-program-day-title">⭐ Ekstra Egzersizler</h3>
                    <span style="color: var(--text-secondary);">${extraExercises.length} egzersiz</span>
                </div>
                <div class="my-program-exercises-grid">
        `;

        extraExercises.forEach(exercise => {
            html += createMyProgramExerciseCard(exercise, appState.selectedExercises[exercise.id], true);
        });

        html += `
                </div>
            </div>
        `;
    }

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
            <h3 style="text-align:center; margin-bottom:1rem; color: var(--primary-color);">
                ⭐ Özel Programınız
            </h3>
            <div style="text-align:center; margin-bottom:2rem;">
                <button class="btn btn-secondary" onclick="showAddExerciseModal()">
                    ➕ Yeni Egzersiz Ekle
                </button>
            </div>
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
            html += createMyProgramExerciseCard(exercise, appState.selectedExercises[exercise.id], true); // true = göster kaldır butonu
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function createMyProgramExerciseCard(exercise, data, showRemoveButton = false) {
    const sets = data.sets || exercise.defaultSets;
    const reps = data.reps || exercise.defaultReps;
    const timeSec = data.timeSec || exercise.defaultTimeSec;
    const weightKg = data.weightKg !== undefined ? data.weightKg : exercise.defaultWeightKg;

    return `
        <div class="exercise-card selected" style="position: relative;">
            ${showRemoveButton ? `
                <button class="remove-exercise-btn" onclick="removeExerciseFromProgram('${exercise.id}')" title="Bu egzersizi kaldır">
                    🗑️
                </button>
            ` : ''}
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

// ==================== EGZERSIZ EKLEME MODALI ====================

function initializeAddExerciseModal() {
    const modal = document.getElementById('addExerciseModal');

    if (!modal) return;

    // Modalın dışına tıklandığında kapat
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeAddExerciseModal();
        }
    });
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

// ==================== YAZDIRMA ====================

function printProgram() {
    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected);

    if (selectedExercises.length === 0) {
        showToast('Lütfen en az bir egzersiz seçin!', 'error');
        return;
    }

    // Browser'ın yazdır penceresini aç
    window.print();
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
        // Preset program varsa günlere göre, yoksa bölgelere göre yazdır
        if (appState.currentPresetProgram) {
            // Günlere göre PDF yazdır
            const program = PRESET_PROGRAMS.find(p => p.id === appState.currentPresetProgram);
            if (program) {
                // Program adını yazdır
                checkAndAddPage(15);
                doc.setFillColor(102, 126, 234);
                doc.rect(margin, yPos, contentWidth, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(program.name, pageWidth / 2, yPos + 7, { align: 'center' });
                doc.setTextColor(0, 0, 0);
                yPos += 15;

                // Her gün için
                [1, 2, 3].forEach(dayNum => {
                    const day = program.days[dayNum];

                    checkAndAddPage(15);

                    // Gün başlığı
                    doc.setFillColor(236, 254, 255);
                    doc.rect(margin, yPos, contentWidth, 10, 'F');
                    doc.setFontSize(13);
                    doc.setFont(undefined, 'bold');
                    doc.text(day.name, margin + 3, yPos + 7);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text(`${day.exercises.length} egzersiz`, contentWidth + margin - 30, yPos + 7);
                    doc.setTextColor(0, 0, 0);
                    yPos += 14;

                    // Günün egzersizleri
                    day.exercises.forEach((exerciseId, index) => {
                        const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
                        if (exercise) {
                            const data = appState.selectedExercises[exerciseId] || {};

                            checkAndAddPage(35);

                            // Egzersiz kartı
                            doc.setFillColor(250, 250, 250);
                            doc.rect(margin + 2, yPos, contentWidth - 4, 28, 'F');

                            // Egzersiz adı
                            doc.setFontSize(11);
                            doc.setFont(undefined, 'bold');
                            doc.text(`${index + 1}. ${exercise.name}`, margin + 5, yPos + 6);

                            // Seviye
                            doc.setFontSize(9);
                            doc.setFont(undefined, 'normal');
                            doc.setTextColor(100, 100, 100);
                            doc.text(`[${exercise.level}]`, margin + 5 + doc.getTextWidth(`${index + 1}. ${exercise.name}`) + 2, yPos + 6);
                            doc.setTextColor(0, 0, 0);
                            yPos += 10;

                            // Detaylar
                            doc.setFontSize(10);
                            const sets = data.sets || exercise.defaultSets;
                            const reps = data.reps || exercise.defaultReps;
                            const timeSec = data.timeSec || exercise.defaultTimeSec;
                            const weightKg = data.weightKg !== undefined ? data.weightKg : exercise.defaultWeightKg;

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
                        }
                    });

                    yPos += 3;
                });
            }
        } else {
            // Bölgelere göre PDF yazdır (custom program)
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
                doc.setFillColor(236, 254, 255);
                doc.rect(margin, yPos, contentWidth, 8, 'F');
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(region.toUpperCase(), margin + 3, yPos + 6);
                yPos += 12;

                exercises.forEach((exercise, index) => {
                    checkAndAddPage(35);

                    // Egzersiz kartı
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin + 2, yPos, contentWidth - 4, 28, 'F');

                    // Egzersiz adı
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${index + 1}. ${exercise.name}`, margin + 5, yPos + 6);

                    // Seviye
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text(`[${exercise.level}]`, margin + 5 + doc.getTextWidth(`${index + 1}. ${exercise.name}`) + 2, yPos + 6);
                    doc.setTextColor(0, 0, 0);
                    yPos += 10;

                    // Detaylar
                    doc.setFontSize(10);
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
        }

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
    document.getElementById('printProgram').addEventListener('click', printProgram);
    document.getElementById('clearProgram').addEventListener('click', clearProgram);

    // AI Asistan
    document.getElementById('saveApiSettings').addEventListener('click', saveApiSettings);
    document.getElementById('startAiConversation').addEventListener('click', startAiConversation);
    document.getElementById('acceptAiProgram').addEventListener('click', acceptAiProgram);
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

// ==================== AI ASISTAN ====================

let aiSuggestedExerciseIds = [];
let aiConversationHistory = [];
let aiQuestionsAsked = 0;
const MAX_AI_QUESTIONS = 3;

// API ayarlarını kaydet
function saveApiSettings() {
    const apiKey = document.getElementById('geminiApiKey').value.trim();
    const model = document.getElementById('geminiModel').value;

    if (!apiKey) {
        showToast('Lütfen API key girin!', 'error');
        return;
    }

    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', model);

    showToast('API ayarları kaydedildi!', 'success');
}

// API ayarlarını yükle
function loadApiSettings() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-3.1-flash-lite-preview';

    if (apiKey) {
        document.getElementById('geminiApiKey').value = apiKey;
    }
    document.getElementById('geminiModel').value = model;
}

// Sohbete başla
async function startAiConversation() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const userRequest = document.getElementById('aiUserRequest').value.trim();

    if (!apiKey) {
        showToast('Lütfen önce API ayarlarında API key girin!', 'error');
        return;
    }

    if (!userRequest) {
        showToast('Lütfen talebinizi yazın!', 'error');
        return;
    }

    // Reset
    aiConversationHistory = [];
    aiQuestionsAsked = 0;
    aiSuggestedExerciseIds = [];

    // İlk mesajı ekle
    aiConversationHistory.push({
        role: 'user',
        parts: [{ text: userRequest }]
    });

    // UI göster
    document.getElementById('aiConversationSection').style.display = 'block';
    document.getElementById('aiResponseSection').style.display = 'none';

    // Mesajı göster
    addMessageToUI('user', userRequest);

    // İlk soruyu sor
    await askNextQuestion();
}

// Sonraki soruyu sor
async function askNextQuestion() {
    if (aiQuestionsAsked >= MAX_AI_QUESTIONS) {
        // Yeterli bilgi toplandı, program oluştur
        await generateFinalProgram();
        return;
    }

    const apiKey = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-3.1-flash-lite-preview';

    document.getElementById('aiLoadingIndicator').style.display = 'flex';
    document.getElementById('aiQuestionSection').style.display = 'none';

    try {
        const prompt = `Sen bir fitness koçusun. Kullanıcıyla ${MAX_AI_QUESTIONS} soru-cevap yaparak detaylı bilgi toplayacaksın.

Şu ana kadar toplanan bilgiler:
${aiConversationHistory.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n')}

Soru ${aiQuestionsAsked + 1}/${MAX_AI_QUESTIONS}:

Lütfen kullanıcıya detay öğrenmek için BİR soru sor ve 3 seçenek sun. Şu formatta yanıt ver:

SORU: [Soru metni]
A) [Seçenek 1]
B) [Seçenek 2]
C) [Seçenek 3]

Sorular şunları kapsamalı:
1. Fiziksel durum (yaş, kilo, boy, sağlık sorunları)
2. Hedef ve motivasyon (kilo verme, kas yapma, dayanıklılık)
3. Antrenman tercihleri (süre, zorluk seviyesi, odak bölgeler)

Sadece yukarıdaki formatı kullan, başka açıklama yapma.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: aiConversationHistory.concat([{
                    role: 'user',
                    parts: [{ text: prompt }]
                }])
            })
        });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Soruyu parse et
        const questionMatch = aiResponse.match(/SORU:\s*(.+)/);
        const optionAMatch = aiResponse.match(/A\)\s*(.+)/);
        const optionBMatch = aiResponse.match(/B\)\s*(.+)/);
        const optionCMatch = aiResponse.match(/C\)\s*(.+)/);

        if (questionMatch && optionAMatch && optionBMatch && optionCMatch) {
            const question = questionMatch[1].trim();
            const options = [
                { key: 'A', text: optionAMatch[1].trim() },
                { key: 'B', text: optionBMatch[1].trim() },
                { key: 'C', text: optionCMatch[1].trim() }
            ];

            displayQuestion(question, options);
        } else {
            throw new Error('AI soruyu doğru formatta oluşturamadı');
        }

        document.getElementById('aiLoadingIndicator').style.display = 'none';

    } catch (error) {
        console.error('AI hatası:', error);
        document.getElementById('aiLoadingIndicator').style.display = 'none';
        showToast('Hata: ' + error.message, 'error');
    }
}

// Soruyu UI'da göster
function displayQuestion(question, options) {
    addMessageToUI('assistant', question);

    document.getElementById('aiCurrentQuestion').textContent = question;

    const optionsContainer = document.getElementById('aiAnswerOptions');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'ai-answer-btn';
        btn.textContent = `${option.key}) ${option.text}`;
        btn.onclick = () => handleAnswer(option.key, option.text, question);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('aiQuestionSection').style.display = 'block';
}

// Cevabı işle
async function handleAnswer(key, answerText, question) {
    const userAnswer = `${key}) ${answerText}`;

    // Kullanıcı cevabını ekle
    aiConversationHistory.push({
        role: 'user',
        parts: [{ text: userAnswer }]
    });

    addMessageToUI('user', userAnswer);

    document.getElementById('aiQuestionSection').style.display = 'none';

    aiQuestionsAsked++;

    // Sonraki soruya geç
    await askNextQuestion();
}

// Mesajı UI'a ekle
function addMessageToUI(role, text) {
    const historyContainer = document.getElementById('aiConversationHistory');

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}`;

    messageDiv.innerHTML = `
        <div class="ai-message-label">${role === 'user' ? 'Siz' : 'AI Koç'}</div>
        <div class="ai-message-text">${text}</div>
    `;

    historyContainer.appendChild(messageDiv);
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

// Final programı oluştur
async function generateFinalProgram() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-3.1-flash-lite-preview';

    document.getElementById('aiLoadingIndicator').style.display = 'flex';

    try {
        const exerciseList = EXERCISES_DATA.map(ex => ({
            id: ex.id,
            name: ex.name,
            regions: ex.region.join(', '),
            level: ex.level,
            type: ex.type === 'reps' ? 'tekrarlı' : 'zamanlı',
            sets: ex.defaultSets,
            reps: ex.defaultReps,
            timeSec: ex.defaultTimeSec
        }));

        const conversationSummary = aiConversationHistory.map(msg =>
            `${msg.role === 'user' ? 'Kullanıcı' : 'Koç'}: ${msg.parts[0].text}`
        ).join('\n');

        const prompt = `Sohbet özeti:
${conversationSummary}

Mevcut egzersizler:
${JSON.stringify(exerciseList, null, 2)}

Şimdi kullanıcı için uygun egzersizleri seç ve şu formatta yanıt ver:

AÇIKLAMA:
[Kullanıcının durumuna göre kısa açıklama]

SEÇİLEN_EGZERSİZ_IDS:
[id1, id2, id3, ...]

Önemli:
- Sadece yukarıdaki egzersiz listesinden seçim yap
- Kullanıcının şikayetlerini dikkate al
- 8-15 egzersiz öner
- SEÇİLEN_EGZERSİZ_IDS kısmında sadece ID'leri virgülle ayır`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Parse et
        const descriptionMatch = aiResponse.match(/AÇIKLAMA:\s*([\s\S]*?)(?=SEÇİLEN_EGZERSİZ_IDS:|$)/);
        const idsMatch = aiResponse.match(/SEÇİLEN_EGZERSİZ_IDS:\s*\[(.*?)\]/);

        let description = descriptionMatch ? descriptionMatch[1].trim() : aiResponse;
        let exerciseIds = [];

        if (idsMatch) {
            const idsString = idsMatch[1];
            exerciseIds = idsString.split(',').map(id => id.trim().replace(/['"]/g, '')).filter(id => id);
        } else {
            const allIds = EXERCISES_DATA.map(ex => ex.id);
            exerciseIds = allIds.filter(id => aiResponse.includes(id));
        }

        aiSuggestedExerciseIds = exerciseIds.filter(id =>
            EXERCISES_DATA.some(ex => ex.id === id)
        );

        if (aiSuggestedExerciseIds.length === 0) {
            throw new Error('AI uygun egzersiz öneremedi.');
        }

        // Sonuçları göster
        document.getElementById('aiResponseText').textContent = description;
        renderAiSuggestedExercises();

        document.getElementById('aiLoadingIndicator').style.display = 'none';
        document.getElementById('aiConversationSection').style.display = 'none';
        document.getElementById('aiResponseSection').style.display = 'block';

        showToast(`${aiSuggestedExerciseIds.length} egzersiz önerildi!`, 'success');

    } catch (error) {
        console.error('AI hatası:', error);
        document.getElementById('aiLoadingIndicator').style.display = 'none';
        showToast('Hata: ' + error.message, 'error');
    }
}

// Önerilen egzersizleri göster
function renderAiSuggestedExercises() {
    const container = document.getElementById('aiSuggestedExercises');
    container.innerHTML = '';

    aiSuggestedExerciseIds.forEach(exerciseId => {
        const exercise = EXERCISES_DATA.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        const card = document.createElement('div');
        card.className = 'ai-exercise-card';
        card.dataset.exerciseId = exerciseId;

        card.innerHTML = `
            ${createExerciseImageHTML(exercise)}
            <div class="ai-exercise-card-header">
                <h4>${exercise.name}</h4>
                <div class="ai-exercise-card-badges">
                    <span class="ai-exercise-badge">${exercise.level}</span>
                    <span class="ai-exercise-badge">${exercise.region.join(', ')}</span>
                </div>
            </div>
            <div class="ai-exercise-card-body">
                <div class="ai-exercise-detail">
                    <span class="ai-exercise-detail-label">Set:</span>
                    <span>${exercise.defaultSets}</span>
                </div>
                <div class="ai-exercise-detail">
                    <span class="ai-exercise-detail-label">${exercise.type === 'reps' ? 'Tekrar:' : 'Süre:'}</span>
                    <span>${exercise.type === 'reps' ? exercise.defaultReps : exercise.defaultTimeSec + ' sn'}</span>
                </div>
                <div class="ai-exercise-detail">
                    <span class="ai-exercise-detail-label">Dinlenme:</span>
                    <span>${exercise.restSec} sn</span>
                </div>
            </div>
            <div class="ai-exercise-card-actions">
                <button class="ai-remove-exercise-btn" onclick="removeAiExercise('${exerciseId}')">
                    ❌ Kaldır
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// AI egzersizi kaldır
window.removeAiExercise = function(exerciseId) {
    const card = document.querySelector(`.ai-exercise-card[data-exercise-id="${exerciseId}"]`);
    if (card) {
        card.classList.add('removed');
        const index = aiSuggestedExerciseIds.indexOf(exerciseId);
        if (index > -1) {
            aiSuggestedExerciseIds.splice(index, 1);
        }

        setTimeout(() => {
            card.remove();
            showToast('Egzersiz kaldırıldı', 'info');
        }, 300);
    }
};

// AI programını kabul et ve kaydet
function acceptAiProgram() {
    if (aiSuggestedExerciseIds.length === 0) {
        showToast('Kabul edilecek egzersiz kalmadı!', 'error');
        return;
    }

    // Önce tüm seçimleri temizle
    appState.selectedExercises = {};
    appState.currentPresetProgram = null;

    // AI önerilerini seçili egzersizlere ekle
    aiSuggestedExerciseIds.forEach(exerciseId => {
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

    // Kaydet
    saveToLocalStorage();

    // UI'ı güncelle
    updateProgramSummary();
    updateDynamicWarmup();
    updateMyProgramView();
    renderExercises();

    showToast(`${aiSuggestedExerciseIds.length} egzersiz programınıza eklendi!`, 'success');

    // Kendi Programım sekmesine geç
    switchTab('myprogram');
}

// Sayfa yüklendiğinde API ayarlarını yükle
window.addEventListener('DOMContentLoaded', () => {
    loadApiSettings();
});
