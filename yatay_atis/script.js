// Canvas ayarları
const canvas = document.getElementById('simulasyonCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Slider'ları oluştur
const aciSlider = document.getElementById('aciSlider');
noUiSlider.create(aciSlider, {
    start: 45,
    connect: true,
    range: {
        'min': 0,
        'max': 90
    }
});

const hizSlider = document.getElementById('hizSlider');
noUiSlider.create(hizSlider, {
    start: 15,
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
});

// Slider değer güncellemeleri
aciSlider.noUiSlider.on('update', function (values) {
    document.getElementById('aciDeger').textContent = Math.round(values[0]);
});

hizSlider.noUiSlider.on('update', function (values) {
    document.getElementById('hizDeger').textContent = Math.round(values[0]);
});

// Simülasyon değişkenleri
let animasyonId;
let baslangicZamani;
let mesafeler = [];
let maksYukseklikDegeri = 0;

// Simülasyon parametreleri
let simParams = {
    aci: 45,
    hiz: 15,
    yerCekimi: 9.81,
    havaDirenciAktif: false,
    havaDirenciKatsayisi: 0.1,
    cisimKutle: 1,
    sure: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    olcek: 5 // Piksel/metre oranı
};

// Histogram oluştur
Plotly.newPlot('mesafeHistogram', [{
    x: [],
    type: 'histogram',
    nbinsx: 30,
    marker: {
        color: 'rgba(13, 110, 253, 0.7)',
    }
}], {
    margin: { t: 10, r: 10, l: 40, b: 30 },
    xaxis: { title: 'Menzil (m)' },
    yaxis: { title: 'Frekans' }
});

// Ortam değişikliği
document.getElementById('ortamSecimi').addEventListener('change', function(e) {
    const ortam = e.target.value;
    switch(ortam) {
        case 'ay':
            simParams.yerCekimi = 1.62;
            break;
        case 'mars':
            simParams.yerCekimi = 3.72;
            break;
        default:
            simParams.yerCekimi = 9.81;
    }
});

// Hava direnci kontrolü
document.getElementById('havaDirenci').addEventListener('change', function(e) {
    simParams.havaDirenciAktif = e.target.checked;
});

// Simülasyonu başlat
function simulasyonuBaslat() {
    // Parametreleri al
    simParams.aci = Number(document.getElementById('aciDeger').textContent);
    simParams.hiz = Number(document.getElementById('hizDeger').textContent);
    
    // Başlangıç değerlerini ayarla
    const aciRadyan = simParams.aci * Math.PI / 180;
    simParams.sure = 0;
    simParams.x = 0;
    simParams.y = 0;
    simParams.vx = simParams.hiz * Math.cos(aciRadyan);
    simParams.vy = simParams.hiz * Math.sin(aciRadyan);
    
    maksYukseklikDegeri = 0;
    baslangicZamani = Date.now();
    
    if (animasyonId) {
        cancelAnimationFrame(animasyonId);
    }
    
    animate();
}

// Simülasyonu sıfırla
function simulasyonuSifirla() {
    if (animasyonId) {
        cancelAnimationFrame(animasyonId);
    }
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Değerleri sıfırla
    document.getElementById('sure').textContent = '0.00';
    document.getElementById('menzil').textContent = '0.00';
    document.getElementById('yukseklik').textContent = '0.00';
    document.getElementById('anlikHiz').textContent = '0.00';
    document.getElementById('maksYukseklik').textContent = '-';
    document.getElementById('toplamMenzil').textContent = '-';
    document.getElementById('ucusSuresi').textContent = '-';
    
    cizimYap();
}

// Histogram temizle
function temizleHistogram() {
    mesafeler = [];
    Plotly.update('mesafeHistogram', {
        x: [mesafeler]
    });
}

// Animasyon döngüsü
function animate() {
    const dt = 0.016; // 60 FPS için zaman adımı
    
    // Hava direnci hesaplamaları
    let ax = 0;
    let ay = -simParams.yerCekimi;
    
    if (simParams.havaDirenciAktif) {
        const hiz = Math.sqrt(simParams.vx * simParams.vx + simParams.vy * simParams.vy);
        const direnc = simParams.havaDirenciKatsayisi * hiz * hiz;
        ax -= (direnc * simParams.vx / hiz) / simParams.cisimKutle;
        ay -= (direnc * simParams.vy / hiz) / simParams.cisimKutle;
    }
    
    // Hareket denklemleri
    simParams.vx += ax * dt;
    simParams.vy += ay * dt;
    simParams.x += simParams.vx * dt;
    simParams.y += simParams.vy * dt;
    simParams.sure += dt;
    
    // Maksimum yüksekliği güncelle
    if (simParams.y > maksYukseklikDegeri) {
        maksYukseklikDegeri = simParams.y;
    }
    
    // Değerleri güncelle
    document.getElementById('sure').textContent = simParams.sure.toFixed(2);
    document.getElementById('menzil').textContent = simParams.x.toFixed(2);
    document.getElementById('yukseklik').textContent = simParams.y.toFixed(2);
    document.getElementById('anlikHiz').textContent = 
        Math.sqrt(simParams.vx * simParams.vx + simParams.vy * simParams.vy).toFixed(2);
    
    // Çizim yap
    cizimYap();
    
    // Yere çarptı mı kontrol et
    if (simParams.y <= 0) {
        // Son bir kez çizim yap
        simParams.y = 0;
        cizimYap();
        
        cancelAnimationFrame(animasyonId);
        sonuclariGoster();
        return;
    }
    
    animasyonId = requestAnimationFrame(animate);
}

// Çizim fonksiyonu
function cizimYap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Zemini çiz
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Cetveli çiz
    if (document.getElementById('cetvel').checked) {
        for (let i = 0; i <= canvas.width; i += simParams.olcek * 10) {
            ctx.beginPath();
            ctx.moveTo(i, canvas.height - 45);
            ctx.lineTo(i, canvas.height - 55);
            ctx.stroke();
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText((i / simParams.olcek).toFixed(0) + 'm', i - 10, canvas.height - 30);
        }
    }
    
    // Savaş topunu çiz
    ctx.save();
    ctx.translate(50, canvas.height - 50);
    ctx.rotate(-simParams.aci * Math.PI / 180);
    
    // Top namlusu
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-5, -8, 50, 16);
    
    // Top gövdesi
    ctx.beginPath();
    ctx.arc(-5, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Tekerlekler
    ctx.beginPath();
    ctx.arc(-15, 15, 8, 0, Math.PI * 2);
    ctx.arc(5, 15, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#666';
    ctx.fill();
    
    ctx.restore();
    
    // İzi çiz
    if (document.getElementById('izler').checked) {
        // Başlangıç noktasından yörüngeyi hesapla
        let yorungeNoktalari = [];
        let t = 0;
        let x = 0;
        let y = 0;
        let vx = simParams.hiz * Math.cos(simParams.aci * Math.PI / 180);
        let vy = simParams.hiz * Math.sin(simParams.aci * Math.PI / 180);
        
        // Tam yörüngeyi hesapla
        while (y >= 0 && x <= canvas.width / simParams.olcek) {
            x = vx * t;
            y = vy * t - 0.5 * simParams.yerCekimi * t * t;
            
            if (y >= 0) {
                yorungeNoktalari.push({
                    x: x * simParams.olcek + 50,
                    y: canvas.height - 50 - (y * simParams.olcek)
                });
            }
            t += 0.016;
        }
        
        // Tahmin yörüngesini çiz (soluk)
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 50);
        for (let nokta of yorungeNoktalari) {
            ctx.lineTo(nokta.x, nokta.y);
        }
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Gerçek yörüngeyi çiz (koyu)
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 50);
        let gercekX = simParams.x * simParams.olcek + 50;
        for (let nokta of yorungeNoktalari) {
            if (nokta.x <= gercekX) {
                ctx.lineTo(nokta.x, nokta.y);
            }
        }
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.stroke();
    }
    
    // Cismi çiz
    const cisimX = simParams.x * simParams.olcek + 50;
    const cisimY = canvas.height - 50 - (simParams.y * simParams.olcek);
    
    // Mermiyi çiz
    ctx.beginPath();
    ctx.arc(cisimX, cisimY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Kronometreyi çiz
    if (document.getElementById('kronometre').checked) {
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.fillText(simParams.sure.toFixed(2) + 's', 10, 30);
    }
}

// Sonuçları göster
function sonuclariGoster() {
    document.getElementById('maksYukseklik').textContent = maksYukseklikDegeri.toFixed(2);
    document.getElementById('toplamMenzil').textContent = simParams.x.toFixed(2);
    document.getElementById('ucusSuresi').textContent = simParams.sure.toFixed(2);
    
    // Histogramı güncelle
    mesafeler.push(simParams.x);
    Plotly.update('mesafeHistogram', {
        x: [mesafeler]
    });
}

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener('resize', () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    cizimYap();
}); 