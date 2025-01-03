// DOM elementlerini seçme
const carSpeedInput = document.getElementById('carSpeed');
const trainSpeedInput = document.getElementById('trainSpeed');
const trainLengthInput = document.getElementById('trainLength');
const initialDistanceInput = document.getElementById('initialDistance');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const car = document.getElementById('car');
const train = document.getElementById('train');
const overtakeTimeSpan = document.getElementById('overtakeTime');
const totalDistanceSpan = document.getElementById('totalDistance');
const animationArea = document.querySelector('.animation-area');
const animationContainer = document.querySelector('.animation-container');

// Yeşil alan için element oluştur
const distanceDifference = document.createElement('div');
distanceDifference.className = 'distance-difference';
animationArea.appendChild(distanceDifference);

// Değer göstergeleri
const carSpeedValue = document.getElementById('carSpeedValue');
const trainSpeedValue = document.getElementById('trainSpeedValue');
const trainLengthValue = document.getElementById('trainLengthValue');
const initialDistanceValue = document.getElementById('initialDistanceValue');

// Simülasyon değişkenleri
let isSimulationRunning = false;
let animationFrameId = null;
let startTime = null;
let carPosition = 0;
let trainPosition = 100;
let dataPoints = [];

// Grafik oluşturma
const ctx = document.getElementById('distanceTimeGraph').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Araba Pozisyonu',
                data: [],
                borderColor: '#3498db',
                fill: false
            },
            {
                label: 'Tren Pozisyonu',
                data: [],
                borderColor: '#e74c3c',
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Zaman (saniye)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Mesafe (metre)'
                }
            }
        }
    }
});

// Input değer güncellemeleri
carSpeedInput.addEventListener('input', () => {
    carSpeedValue.textContent = carSpeedInput.value;
    updateCalculations();
});

trainSpeedInput.addEventListener('input', () => {
    trainSpeedValue.textContent = trainSpeedInput.value;
    updateCalculations();
});

trainLengthInput.addEventListener('input', () => {
    trainLengthValue.textContent = trainLengthInput.value;
    train.style.width = `${trainLengthInput.value / 5}px`;
    updateCalculations();
});

initialDistanceInput.addEventListener('input', () => {
    initialDistanceValue.textContent = initialDistanceInput.value;
    updateCalculations();
});

// Hesaplamaları güncelleme
function updateCalculations() {
    const carSpeed = parseInt(carSpeedInput.value);
    const trainSpeed = parseInt(trainSpeedInput.value);
    const trainLength = parseInt(trainLengthInput.value);
    const initialDistance = parseInt(initialDistanceInput.value);

    if (carSpeed <= trainSpeed) {
        overtakeTimeSpan.textContent = "Sollama mümkün değil!";
        totalDistanceSpan.textContent = "---";
        return;
    }

    const relativeSpeed = (carSpeed - trainSpeed) * 1000 / 3600; // m/s cinsinden göreceli hız
    const overtakeTime = (trainLength + initialDistance) / relativeSpeed;
    const totalDistance = carSpeed * overtakeTime * 1000 / 3600;

    overtakeTimeSpan.textContent = overtakeTime.toFixed(2);
    totalDistanceSpan.textContent = totalDistance.toFixed(2);
}

// Animasyon fonksiyonu
function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;

    const carSpeed = parseInt(carSpeedInput.value);
    const trainSpeed = parseInt(trainSpeedInput.value);
    const trainLength = parseInt(trainLengthInput.value);
    const initialDistance = parseInt(initialDistanceInput.value);

    // Pozisyonları güncelle (piksel cinsinden)
    carPosition = (carSpeed * progress / 1000) * (1000 / 3600) * 5;
    trainPosition = initialDistance * 5 + (trainSpeed * progress / 1000) * (1000 / 3600) * 5;

    // Araçların gerçek mesafelerini hesapla (metre cinsinden)
    const carDistance = (carSpeed * progress / 1000) * (1000 / 3600);
    const trainDistance = initialDistance + (trainSpeed * progress / 1000) * (1000 / 3600);

    // Mesafe göstergelerini güncelle
    car.setAttribute('data-distance', `${carDistance.toFixed(1)}m`);
    train.setAttribute('data-distance', `${trainDistance.toFixed(1)}m`);

    // Araçları ekranda tut
    const areaWidth = animationArea.offsetWidth;
    const containerOffset = Math.max(0, Math.min(carPosition, trainPosition) - areaWidth / 4);
    animationContainer.style.transform = `translateX(-${containerOffset}px)`;

    // Yeşil alanı güncelle (container offset'i dikkate alarak)
    const startX = Math.min(carPosition, trainPosition);
    const endX = Math.max(carPosition, trainPosition);
    distanceDifference.style.left = `${startX}px`;
    distanceDifference.style.width = `${endX - startX}px`;
    distanceDifference.style.transform = `translateX(-${containerOffset}px)`;

    car.style.left = `${carPosition}px`;
    train.style.left = `${trainPosition}px`;
    train.style.width = `${trainLength / 5}px`;

    // Grafik verilerini güncelle
    const timeInSeconds = progress / 1000;
    dataPoints.push({
        time: timeInSeconds,
        carPos: carDistance,
        trainPos: trainDistance
    });

    if (timeInSeconds % 0.5 < 0.1) {
        updateGraph();
    }

    // Sollama tamamlandı mı kontrol et
    if (carPosition > trainPosition + trainLength / 5) {
        stopSimulation();
        return;
    }

    if (isSimulationRunning) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Grafik güncelleme
function updateGraph() {
    const times = dataPoints.map(point => point.time.toFixed(1));
    const carPositions = dataPoints.map(point => point.carPos);
    const trainPositions = dataPoints.map(point => point.trainPos);

    chart.data.labels = times;
    chart.data.datasets[0].data = carPositions;
    chart.data.datasets[1].data = trainPositions;
    chart.update();
}

// Simülasyon kontrolü
function startSimulation() {
    if (!isSimulationRunning) {
        isSimulationRunning = true;
        startTime = null;
        dataPoints = [];
        
        // Başlangıç konumlarını ayarla
        const initialDistance = parseInt(initialDistanceInput.value);
        carPosition = 0;
        trainPosition = initialDistance * 5; // Piksel ölçeğine dönüştürme
        car.style.left = `${carPosition}px`;
        train.style.left = `${trainPosition}px`;
        
        animationFrameId = requestAnimationFrame(animate);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
}

function pauseSimulation() {
    isSimulationRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function stopSimulation() {
    isSimulationRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetSimulation() {
    stopSimulation();
    const initialDistance = parseInt(initialDistanceInput.value);
    carPosition = 0;
    trainPosition = initialDistance * 5;
    car.style.left = '0px';
    train.style.left = `${trainPosition}px`;
    car.setAttribute('data-distance', '0m');
    train.setAttribute('data-distance', '0m');
    distanceDifference.style.width = '0';
    distanceDifference.style.transform = 'translateX(0)';
    animationContainer.style.transform = 'translateX(0)';
    dataPoints = [];
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];
    chart.update();
    startTime = null;
}

// Event listeners
startBtn.addEventListener('click', startSimulation);
pauseBtn.addEventListener('click', pauseSimulation);
resetBtn.addEventListener('click', resetSimulation);

// Başlangıç durumu
updateCalculations();
pauseBtn.disabled = true; 