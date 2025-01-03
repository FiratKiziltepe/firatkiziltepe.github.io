// Canvas ve context ayarları
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Canvas boyutlarını ayarla
canvas.width = 600;
canvas.height = 400;

// Sabitler ve başlangıç değerleri
const WATER_BASE_DENSITY = 1.0; // g/cm³
let currentWaterDensity = WATER_BASE_DENSITY;
const OBJECTS = {
    tahta: { name: 'Tahta', density: 0.7, color: '#8B4513' },
    demir: { name: 'Demir', density: 7.8, color: '#808080' },
    plastik: { name: 'Plastik', density: 0.9, color: '#87CEEB' }
};

let selectedObject = null;
let objectY = canvas.height * 0.3; // Başlangıç pozisyonu
let objectVelocity = 0;
const OBJECT_SIZE = 50;
const GRAVITY = 0.2;
const DAMPING = 0.98; // Sönümleme faktörü
const WATER_LEVEL = canvas.height * 0.6;
const WATER_RESISTANCE = 0.05; // Su direnci

// Tuz kontrolü
const saltRange = document.getElementById('saltRange');
const saltValue = document.getElementById('saltValue');
const waterDensitySpan = document.getElementById('waterDensity');

// Dalga parametreleri ekle (global değişkenler bölümüne)
let waveOffset = 0;
const WAVE_SPEED = 0.05;
const WAVE_AMPLITUDE = 3;
let splashEffect = 0;
const SPLASH_DECAY = 0.95;

// Cisim seçimi fonksiyonu
function selectObject(objectType) {
    selectedObject = OBJECTS[objectType];
    objectY = canvas.height * 0.3; // Cismi suyun üstünde başlat
    objectVelocity = 0;
    updateInfoPanel();
}

// Bilgi panelini güncelle
function updateInfoPanel() {
    const objectInfo = document.getElementById('objectInfo');
    const stateInfo = document.getElementById('stateInfo');
    
    if (selectedObject) {
        objectInfo.textContent = `Cisim: ${selectedObject.name}, Yoğunluk: ${selectedObject.density.toFixed(2)} g/cm³`;
        
        const state = selectedObject.density < currentWaterDensity ? 'Yüzer' :
                     selectedObject.density > currentWaterDensity ? 'Batar' : 'Askıda Kalır';
        
        stateInfo.textContent = `Durum: ${state} (Su Yoğunluğu: ${currentWaterDensity.toFixed(2)} g/cm³)`;
    }
}

// Tuz oranı değişimi
saltRange.addEventListener('input', (e) => {
    const saltPercent = parseInt(e.target.value);
    saltValue.textContent = saltPercent;
    
    // Tuz oranına göre su yoğunluğunu güncelle (max 1.3 g/cm³)
    currentWaterDensity = WATER_BASE_DENSITY + (saltPercent / 100) * 0.3;
    waterDensitySpan.textContent = currentWaterDensity.toFixed(2);
    
    updateInfoPanel();
});

// Kuvvet vektörlerini çiz
function drawForceVectors(x, y) {
    if (!selectedObject) return;

    const submergedRatio = Math.min(Math.max((y + OBJECT_SIZE - WATER_LEVEL) / OBJECT_SIZE, 0), 1);
    const weightForce = selectedObject.density * GRAVITY * 20;
    const buoyancyForce = currentWaterDensity * GRAVITY * 20 * submergedRatio;
    
    // Ağırlık kuvveti (kırmızı)
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + weightForce);
    ctx.stroke();
    
    // Kaldırma kuvveti (yeşil)
    if (submergedRatio > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - buoyancyForce);
        ctx.stroke();
    }
}

// Fizik hesaplamaları
function updatePhysics() {
    if (!selectedObject) return;

    const prevY = objectY;
    const submergedRatio = Math.min(Math.max((objectY + OBJECT_SIZE - WATER_LEVEL) / OBJECT_SIZE, 0), 1);
    
    const weightForce = selectedObject.density * GRAVITY;
    const buoyancyForce = currentWaterDensity * GRAVITY * submergedRatio;
    
    let netForce = weightForce - buoyancyForce;
    
    if (submergedRatio > 0) {
        netForce -= objectVelocity * WATER_RESISTANCE * submergedRatio;
    }
    
    objectVelocity += netForce;
    objectVelocity *= DAMPING;
    objectY += objectVelocity;
    
    // Su ile temas durumunda splash efekti oluştur
    if (objectY + OBJECT_SIZE >= WATER_LEVEL && prevY + OBJECT_SIZE < WATER_LEVEL) {
        splashEffect = Math.abs(objectVelocity) * 5;
    }
    
    if (objectY + OBJECT_SIZE > canvas.height) {
        objectY = canvas.height - OBJECT_SIZE;
        objectVelocity *= -0.5;
    }
    if (objectY < 0) {
        objectY = 0;
        objectVelocity = 0;
    }
}

// Ana çizim fonksiyonu
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dalgalı su çizimi
    ctx.beginPath();
    ctx.moveTo(0, WATER_LEVEL);
    
    // Su dalgalarını çiz
    for (let x = 0; x <= canvas.width; x += 5) {
        const waveHeight = Math.sin(x * 0.02 + waveOffset) * WAVE_AMPLITUDE;
        // Splash efektini merkeze ekle
        const splashHeight = splashEffect * Math.exp(-(Math.pow(x - canvas.width/2, 2)) / 5000);
        ctx.lineTo(x, WATER_LEVEL + waveHeight + splashHeight);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    ctx.fillStyle = `rgba(0, 100, 255, ${0.3 + (currentWaterDensity - WATER_BASE_DENSITY)})`;
    ctx.fill();
    
    // Dalga offsetini güncelle
    waveOffset += WAVE_SPEED;
    
    // Splash efektini azalt
    splashEffect *= SPLASH_DECAY;

    if (selectedObject) {
        updatePhysics();
        
        // Cismi çiz
        ctx.fillStyle = selectedObject.color;
        ctx.fillRect(canvas.width/2 - OBJECT_SIZE/2, objectY, OBJECT_SIZE, OBJECT_SIZE);
        
        drawForceVectors(canvas.width/2, objectY);
    }
    
    requestAnimationFrame(draw);
}

// Animasyonu başlat
draw();

// İlk cismi seç
selectObject('tahta'); 