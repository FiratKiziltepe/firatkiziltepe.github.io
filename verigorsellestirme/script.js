// Global değişkenler
let uploadedData = null;
let currentChart = null;
let selectedChartType = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
});

// Dosya yükleme sistemini başlat
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Sürükle-bırak olayları
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Dosya seçme
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });
}

// Dosyayı işle
function handleFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // Dosya türü kontrolü
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        alert('Lütfen geçerli bir CSV veya Excel dosyası yükleyin!');
        return;
    }

    // Dosya bilgisini göster
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('fileInfo').style.display = 'block';

    // Dosyayı oku
    const reader = new FileReader();

    if (fileExtension === 'csv') {
        reader.onload = (e) => {
            const csvData = e.target.result;
            uploadedData = parseCSV(csvData);
            displayData();
        };
        reader.readAsText(file);
    } else {
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            uploadedData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            displayData();
        };
        reader.readAsArrayBuffer(file);
    }
}

// CSV Parse fonksiyonu
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    return lines.map(line => {
        // CSV virgül ayrımı (tırnak içi virgülleri dikkate al)
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    });
}

// Veriyi görüntüle
function displayData() {
    if (!uploadedData || uploadedData.length === 0) return;

    // Veri önizleme tablosunu oluştur
    const table = document.getElementById('dataTable');
    table.innerHTML = '';

    // Başlıklar
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    uploadedData[0].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Veriler (ilk 10 satır)
    const tbody = document.createElement('tbody');
    const displayRows = uploadedData.slice(1, Math.min(11, uploadedData.length));
    displayRows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Bölümleri göster
    document.getElementById('dataPreview').style.display = 'block';
    document.getElementById('chartSelection').style.display = 'block';
}

// Dosyayı kaldır
function removeFile() {
    uploadedData = null;
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('dataPreview').style.display = 'none';
    document.getElementById('chartSelection').style.display = 'none';
    document.getElementById('columnSelection').style.display = 'none';
    document.getElementById('chartDisplay').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// Grafik türünü seç
function selectChartType(type) {
    selectedChartType = type;

    // Tüm kartların seçimini kaldır
    document.querySelectorAll('.chart-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Seçilen kartı işaretle
    event.currentTarget.classList.add('selected');

    // Sütun seçimi bölümünü göster
    showColumnSelection();
}

// Sütun seçimi bölümünü göster
function showColumnSelection() {
    if (!uploadedData || uploadedData.length < 2) return;

    const headers = uploadedData[0];
    const labelSelect = document.getElementById('labelColumn');
    const valueSelect = document.getElementById('valueColumns');

    // Seçenekleri temizle
    labelSelect.innerHTML = '';
    valueSelect.innerHTML = '';

    // Sütunları ekle
    headers.forEach((header, index) => {
        const option1 = document.createElement('option');
        option1.value = index;
        option1.textContent = header;
        labelSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = index;
        option2.textContent = header;
        valueSelect.appendChild(option2);
    });

    // Varsayılan seçimleri yap
    if (headers.length >= 2) {
        labelSelect.value = 0;
        valueSelect.options[1].selected = true;
    }

    document.getElementById('columnSelection').style.display = 'block';
}

// Grafik oluştur
function generateChart() {
    if (!uploadedData || !selectedChartType) return;

    const labelColumnIndex = parseInt(document.getElementById('labelColumn').value);
    const valueSelect = document.getElementById('valueColumns');
    const selectedValueIndices = Array.from(valueSelect.selectedOptions).map(opt => parseInt(opt.value));

    if (selectedValueIndices.length === 0) {
        alert('Lütfen en az bir değer sütunu seçin!');
        return;
    }

    // Veriyi hazırla
    const labels = [];
    const datasets = [];

    // Her değer sütunu için dataset oluştur
    selectedValueIndices.forEach(valueIndex => {
        const dataPoints = [];

        for (let i = 1; i < uploadedData.length; i++) {
            if (i === 1) {
                // İlk satırda etiketleri topla
            }
            const label = uploadedData[i][labelColumnIndex];
            const value = parseFloat(uploadedData[i][valueIndex]) || 0;

            if (i === 1 || labels.length < uploadedData.length - 1) {
                labels.push(label);
            }
            dataPoints.push(value);
        }

        // Renk oluştur
        const color = generateColor(selectedValueIndices.indexOf(valueIndex));

        datasets.push({
            label: uploadedData[0][valueIndex],
            data: dataPoints,
            backgroundColor: selectedChartType === 'line' ? 'transparent' : color,
            borderColor: color,
            borderWidth: 2,
            fill: selectedChartType === 'line' ? false : true,
            tension: 0.4,
            pointRadius: selectedChartType === 'scatter' || selectedChartType === 'bubble' ? 6 : 3,
            pointHoverRadius: selectedChartType === 'scatter' || selectedChartType === 'bubble' ? 8 : 5,
        });
    });

    // Benzersiz etiketler
    const uniqueLabels = [...new Set(labels)];

    // Grafik yapılandırması
    const config = {
        type: selectedChartType === 'scatter' || selectedChartType === 'bubble' ? selectedChartType : selectedChartType,
        data: {
            labels: uniqueLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                title: {
                    display: false,
                }
            },
            scales: selectedChartType !== 'pie' && selectedChartType !== 'doughnut' &&
                   selectedChartType !== 'polarArea' && selectedChartType !== 'radar' ? {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true
                    }
                },
                x: {
                    grid: {
                        display: true
                    }
                }
            } : {}
        }
    };

    // Önceki grafiği yok et
    if (currentChart) {
        currentChart.destroy();
    }

    // Yeni grafik oluştur
    const ctx = document.getElementById('myChart').getContext('2d');
    currentChart = new Chart(ctx, config);

    // Grafik görüntüleme bölümünü göster
    document.getElementById('chartDisplay').style.display = 'block';

    // Grafiğe kaydır
    document.getElementById('chartDisplay').scrollIntoView({ behavior: 'smooth' });
}

// Renk oluştur
function generateColor(index) {
    const colors = [
        'rgba(102, 126, 234, 0.7)',
        'rgba(237, 100, 166, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
    ];
    return colors[index % colors.length];
}

// Ayarları aç/kapat
function toggleOptions() {
    const panel = document.getElementById('optionsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Ayarları uygula
function applyOptions() {
    if (!currentChart) return;

    const title = document.getElementById('chartTitle').value;
    const showLegend = document.getElementById('showLegend').checked;
    const showGrid = document.getElementById('showGrid').checked;

    // Başlık
    currentChart.options.plugins.title.display = title.length > 0;
    currentChart.options.plugins.title.text = title;

    // Açıklama
    currentChart.options.plugins.legend.display = showLegend;

    // Izgara
    if (currentChart.options.scales.y) {
        currentChart.options.scales.y.grid.display = showGrid;
        currentChart.options.scales.x.grid.display = showGrid;
    }

    currentChart.update();
}

// Seçime geri dön
function backToSelection() {
    document.getElementById('chartDisplay').style.display = 'none';
    document.getElementById('chartSelection').scrollIntoView({ behavior: 'smooth' });
}

// Grafiği indir
function downloadChart(format) {
    if (!currentChart) return;

    const resolution = parseInt(document.getElementById('resolution').value);
    const canvas = document.getElementById('myChart');

    if (format === 'svg') {
        downloadAsSVG();
    } else {
        downloadAsImage(format, resolution);
    }
}

// Resim olarak indir (PNG/JPG)
function downloadAsImage(format, resolution) {
    const canvas = document.getElementById('myChart');

    // Yüksek çözünürlük için geçici canvas oluştur
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    tempCanvas.width = canvas.width * resolution;
    tempCanvas.height = canvas.height * resolution;

    // Beyaz arka plan (JPG için)
    if (format === 'jpg') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Grafiği çiz
    ctx.scale(resolution, resolution);
    ctx.drawImage(canvas, 0, 0);

    // İndir
    tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grafik-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }, `image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
}

// SVG olarak indir
function downloadAsSVG() {
    const canvas = document.getElementById('myChart');
    const ctx = canvas.getContext('2d');

    // Canvas'ı SVG'ye dönüştür
    const svgWidth = canvas.width;
    const svgHeight = canvas.height;

    // SVG string oluştur
    let svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    <image width="${svgWidth}" height="${svgHeight}"
           xlink:href="${canvas.toDataURL('image/png')}" />
</svg>`;

    // SVG'yi indir
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grafik-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}

// Yardımcı fonksiyon: Canvas'ı SVG path'lerine dönüştür (gelişmiş)
function canvasToSVGPaths() {
    // Not: Bu gelişmiş bir özellik olup, Chart.js ile tam entegrasyon için
    // chart.js-plugin-svg gibi eklentiler kullanılabilir
    // Şu an için canvas'ı image olarak embed ediyoruz
}
