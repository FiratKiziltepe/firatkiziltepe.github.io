/**
 * Fitness Program Oluşturucu - Ana Uygulama
 * Tüm uygulama mantığı ve etkileşimler
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
    }
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
    initializeFilters();
    renderExercises();
    updateProgramSummary();
    updateDynamicWarmup();

    // Event listener'ları ekle
    setupEventListeners();

    // Kullanıcı bilgilerini formda göster
    populateUserInfoForm();

    showToast('Uygulama hazır! Egzersizleri seçebilirsiniz.', 'success');
}

// ==================== LOCALSTORAGE İŞLEMLERİ ====================

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);

            // Kullanıcı bilgilerini yükle
            if (parsed.userInfo) {
                appState.userInfo = { ...appState.userInfo, ...parsed.userInfo };
            }

            // Seçili egzersizleri yükle
            if (parsed.selectedExercises) {
                appState.selectedExercises = parsed.selectedExercises;
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
    // Bölge filtrelerini oluştur
    const regionFiltersContainer = document.getElementById('regionFilters');

    // Benzersiz bölgeleri al
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
    // Seviye filtreleri
    const levelCheckboxes = document.querySelectorAll('#levelFilters input[type="checkbox"]:checked');
    const levels = Array.from(levelCheckboxes).map(cb => cb.value);

    // Bölge filtreleri
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
    // Tüm seviye filtrelerini işaretle
    document.querySelectorAll('#levelFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });

    // Tüm bölge filtrelerini temizle
    document.querySelectorAll('#regionFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    applyFilters();
}

// ==================== EGZERSİZ RENDER ====================

function renderExercises() {
    const container = document.getElementById('exerciseCards');
    const filters = appState.filters;

    // Filtrelere göre egzersizleri süz
    let filteredExercises = EXERCISES_DATA.filter(exercise => {
        // Seviye filtresi
        const levelMatch = filters.levels.length === 0 || filters.levels.includes(exercise.level);

        // Bölge filtresi
        const regionMatch = filters.regions.length === 0 ||
            exercise.region.some(r => filters.regions.includes(r));

        return levelMatch && regionMatch;
    });

    // Egzersiz sayısını güncelle
    document.getElementById('exerciseCount').textContent = filteredExercises.length;

    // Kartları oluştur
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

    // Seçili durumu kontrol et
    const isSelected = appState.selectedExercises[exercise.id]?.selected || false;
    if (isSelected) {
        card.classList.add('selected');
    }

    // Kaydedilmiş değerleri al veya varsayılanları kullan
    const savedData = appState.selectedExercises[exercise.id] || {};
    const sets = savedData.sets || exercise.defaultSets;
    const reps = savedData.reps || exercise.defaultReps;
    const timeSec = savedData.timeSec || exercise.defaultTimeSec;
    const weightKg = savedData.weightKg !== undefined ? savedData.weightKg : exercise.defaultWeightKg;

    card.innerHTML = `
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
            <a href="${exercise.imageUrl}" class="media-link" target="_blank">
                📷 Görsel
            </a>
            <a href="${exercise.videoUrl}" class="media-link" target="_blank">
                🎥 Video
            </a>
        </div>

        ${exercise.notes ? `<div class="exercise-notes">💡 ${exercise.notes}</div>` : ''}
    `;

    // Event listener'lar
    const checkbox = card.querySelector('.exercise-checkbox');
    checkbox.addEventListener('change', (e) => handleExerciseSelection(exercise.id, card));

    // Input değişikliklerini dinle
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
        // Egzersizi seç
        cardElement.classList.add('selected');

        // Veriyi kaydet
        if (!appState.selectedExercises[exerciseId]) {
            appState.selectedExercises[exerciseId] = {};
        }
        appState.selectedExercises[exerciseId].selected = true;

        // Değerleri güncelle
        updateExerciseData(exerciseId, cardElement);
    } else {
        // Egzersizi kaldır
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
    // Seçili egzersizleri say
    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => EXERCISES_DATA.find(ex => ex.id === id))
        .filter(ex => ex !== undefined);

    const selectedCount = selectedExercises.length;
    document.getElementById('selectedCount').textContent = selectedCount;

    // Çalışılan bölgeleri belirle
    const regionsSet = new Set();
    selectedExercises.forEach(exercise => {
        exercise.region.forEach(r => regionsSet.add(r));
    });
    const regionsText = regionsSet.size > 0 ? Array.from(regionsSet).join(', ') : '-';
    document.getElementById('selectedRegions').textContent = regionsText;

    // Tahmini süreyi hesapla
    let totalTime = 0;

    // Isınma süresi
    totalTime += 10; // 10 dakika genel ısınma

    selectedExercises.forEach(exercise => {
        const data = appState.selectedExercises[exercise.id];
        const sets = data.sets || exercise.defaultSets;

        if (exercise.type === 'reps') {
            const reps = data.reps || exercise.defaultReps;
            // Her tekrar ~2 saniye + dinlenme
            totalTime += sets * ((reps * 2) / 60 + (exercise.restSec / 60));
        } else {
            const timeSec = data.timeSec || exercise.defaultTimeSec;
            // Süre + dinlenme
            totalTime += sets * ((timeSec / 60) + (exercise.restSec / 60));
        }
    });

    document.getElementById('estimatedTime').textContent = Math.round(totalTime) + ' dk';
}

// ==================== DİNAMİK ISINMA ====================

function updateDynamicWarmup() {
    const container = document.getElementById('dynamicWarmup');

    // Seçili egzersizlerden bölgeleri al
    const selectedExercises = Object.entries(appState.selectedExercises)
        .filter(([id, data]) => data.selected)
        .map(([id]) => EXERCISES_DATA.find(ex => ex.id === id))
        .filter(ex => ex !== undefined);

    const regionsSet = new Set();
    selectedExercises.forEach(exercise => {
        exercise.region.forEach(r => regionsSet.add(r));
    });

    // Bölgelere göre ısınma önerileri
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

    // HTML oluştur
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
    // En az bir egzersiz seçili mi kontrol et
    const selectedCount = Object.values(appState.selectedExercises)
        .filter(data => data.selected).length;

    if (selectedCount === 0) {
        showToast('Lütfen en az bir egzersiz seçin!', 'error');
        return;
    }

    if (saveToLocalStorage()) {
        showToast(`Program kaydedildi! ${selectedCount} egzersiz seçildi.`, 'success');
    }
}

function clearProgram() {
    if (confirm('Programı temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        // State'i sıfırla
        appState.selectedExercises = {};

        // LocalStorage'ı temizle
        clearLocalStorage();

        // UI'ı güncelle
        renderExercises();
        updateProgramSummary();
        updateDynamicWarmup();

        showToast('Program temizlendi.', 'info');
    }
}

// ==================== PDF OLUŞTURMA ====================

function generatePDF() {
    // En az bir egzersiz seçili mi kontrol et
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

        // jsPDF örneği oluştur
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.height;
        const marginBottom = 20;

        // Başlık
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Kişisel Fitness Programım', 105, yPos, { align: 'center' });
        yPos += 10;

        // Kullanıcı Bilgileri
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        if (appState.userInfo.name) {
            doc.text(`Ad: ${appState.userInfo.name}`, 20, yPos);
            yPos += lineHeight;
        }

        doc.text(`Hedef: ${appState.userInfo.goal}`, 20, yPos);
        yPos += lineHeight;
        doc.text(`Haftalık Antrenman: ${appState.userInfo.daysPerWeek} gün`, 20, yPos);
        yPos += lineHeight;
        doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
        yPos += 10;

        // Isınma Bölümü
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Isınma', 20, yPos);
        yPos += lineHeight;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Genel: 5-10 dakika hafif tempo yürüyüş veya koşu', 20, yPos);
        yPos += lineHeight;

        // Dinamik ısınma önerileri
        const regionsSet = new Set();
        selectedExercises.forEach(exercise => {
            exercise.region.forEach(r => regionsSet.add(r));
        });

        if (Array.from(regionsSet).some(r => ['Karın', 'Göbek', 'Bel', 'Core'].includes(r))) {
            const text = doc.splitTextToSize(GENERAL_WARMUP.abs, 170);
            doc.text(text, 20, yPos);
            yPos += text.length * lineHeight;
        }

        if (Array.from(regionsSet).some(r => ['Göğüs', 'Omuz', 'Kol'].includes(r))) {
            const text = doc.splitTextToSize(GENERAL_WARMUP.chest, 170);
            doc.text(text, 20, yPos);
            yPos += text.length * lineHeight;
        }

        if (Array.from(regionsSet).some(r => ['Sırt', 'Lats'].includes(r))) {
            const text = doc.splitTextToSize(GENERAL_WARMUP.back, 170);
            doc.text(text, 20, yPos);
            yPos += text.length * lineHeight;
        }

        if (Array.from(regionsSet).some(r => ['Bacak', 'Kalça', 'Ayak', 'Baldır'].includes(r))) {
            const text = doc.splitTextToSize(GENERAL_WARMUP.legs, 170);
            doc.text(text, 20, yPos);
            yPos += text.length * lineHeight;
        }

        yPos += 5;

        // Bölgelere göre grupla
        const groupedByRegion = {};
        selectedExercises.forEach(exercise => {
            const mainRegion = exercise.region[0];
            if (!groupedByRegion[mainRegion]) {
                groupedByRegion[mainRegion] = [];
            }
            groupedByRegion[mainRegion].push(exercise);
        });

        // Her bölge için egzersizleri listele
        Object.entries(groupedByRegion).forEach(([region, exercises]) => {
            // Sayfa kontrolü
            if (yPos > pageHeight - marginBottom) {
                doc.addPage();
                yPos = 20;
            }

            // Bölge başlığı
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(region, 20, yPos);
            yPos += lineHeight;

            // Egzersizler
            exercises.forEach((exercise, index) => {
                // Sayfa kontrolü
                if (yPos > pageHeight - marginBottom - 30) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${exercise.name} (${exercise.level})`, 25, yPos);
                yPos += lineHeight;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const sets = exercise.sets || exercise.defaultSets;
                const reps = exercise.reps || exercise.defaultReps;
                const timeSec = exercise.timeSec || exercise.defaultTimeSec;
                const weightKg = exercise.weightKg !== undefined ? exercise.weightKg : exercise.defaultWeightKg;

                if (exercise.type === 'reps') {
                    doc.text(`   Set: ${sets} | Tekrar: ${reps} | Ağırlık: ${weightKg} kg | Dinlenme: ${exercise.restSec} sn`, 25, yPos);
                } else {
                    doc.text(`   Set: ${sets} | Süre: ${timeSec} sn | Ağırlık: ${weightKg} kg | Dinlenme: ${exercise.restSec} sn`, 25, yPos);
                }
                yPos += lineHeight;

                if (exercise.notes) {
                    const notesText = doc.splitTextToSize(`   Not: ${exercise.notes}`, 160);
                    doc.text(notesText, 25, yPos);
                    yPos += notesText.length * lineHeight;
                }

                yPos += 2;
            });

            yPos += 3;
        });

        // Alt bilgi (son sayfada)
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        const footerY = pageHeight - 10;
        doc.text('Bu program eğitim amaçlıdır. Sağlık durumunuz için profesyonel görüş alınız.', 105, footerY, { align: 'center' });

        // PDF'i indir
        const fileName = `fitness-program-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showToast('PDF başarıyla indirildi!', 'success');
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        showToast('PDF oluşturulurken hata oluştu.', 'error');
    }
}

// ==================== TOAST BİLDİRİMLERİ ====================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Göster
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Gizle
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Kullanıcı bilgileri kaydet
    document.getElementById('saveUserInfo').addEventListener('click', saveUserInfo);

    // Filtreler
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Program işlemleri
    document.getElementById('saveProgram').addEventListener('click', saveProgram);
    document.getElementById('downloadPDF').addEventListener('click', generatePDF);
    document.getElementById('clearProgram').addEventListener('click', clearProgram);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

// LocalStorage desteğini kontrol et
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

// Sayfa yüklendiğinde localStorage desteğini kontrol et
checkLocalStorageSupport();
