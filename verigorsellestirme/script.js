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

    // Grafik önerilerini göster
    showChartSuggestions();
}

// Örnek veri yükle
function loadExampleData() {
    fetch('ornek_veri.csv')
        .then(response => response.text())
        .then(csvData => {
            uploadedData = parseCSV(csvData);
            document.getElementById('fileName').textContent = 'Örnek Veri (20 Öğrenci)';
            document.getElementById('fileInfo').style.display = 'block';
            displayData();
        })
        .catch(error => {
            console.error('Örnek veri yüklenirken hata:', error);
            alert('Örnek veri yüklenirken bir hata oluştu!');
        });
}

// Veriye göre grafik önerileri göster
function showChartSuggestions() {
    if (!uploadedData || uploadedData.length < 2) return;

    const headers = uploadedData[0];
    const suggestions = [];

    // Veri analizleri
    const numericColumns = [];
    const categoricalColumns = [];
    const dateColumns = [];

    headers.forEach((header, index) => {
        if (index === 0) return; // İlk sütunu (ID) atla

        const sampleValues = uploadedData.slice(1, 6).map(row => row[index]);

        // Sayısal mı kontrol et
        const numericCount = sampleValues.filter(v => !isNaN(parseFloat(v))).length;
        if (numericCount >= 3) {
            numericColumns.push({ index, header });
        } else {
            categoricalColumns.push({ index, header });
        }

        // Tarih mi kontrol et
        const dateCount = sampleValues.filter(v => !isNaN(Date.parse(v))).length;
        if (dateCount >= 3) {
            dateColumns.push({ index, header });
        }
    });

    // Öneri algoritması
    const uniqueCategories = new Set(uploadedData.slice(1).map(row => row[categoricalColumns[0]?.index])).size;

    // 1. Kategorik + Sayısal varsa
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
        if (uniqueCategories <= 5) {
            suggestions.push({ type: 'pie', name: 'Pasta Grafiği', reason: 'Kategorik dağılım görmek için', recommended: true });
            suggestions.push({ type: 'doughnut', name: 'Halka Grafiği', reason: 'Oranları görmek için' });
        }
        suggestions.push({ type: 'bar', name: 'Sütun Grafiği', reason: 'Kategorileri karşılaştırmak için', recommended: !suggestions.length });

        if (numericColumns.length >= 2) {
            suggestions.push({ type: 'barGrouped', name: 'Gruplu Sütun', reason: 'Çoklu karşılaştırma için' });
            suggestions.push({ type: 'barStacked', name: 'Yığılmış Sütun', reason: 'Alt kategorileri görmek için' });
        }
    }

    // 2. Çok sayısal değişken varsa
    if (numericColumns.length >= 2) {
        suggestions.push({ type: 'scatter', name: 'Dağılım Grafiği', reason: 'Korelasyon analizi için', recommended: !suggestions.length });
        suggestions.push({ type: 'line', name: 'Çizgi Grafiği', reason: 'Eğilimleri görmek için' });
    }

    // 3. Tek sayısal değişken varsa
    if (numericColumns.length === 1) {
        suggestions.push({ type: 'histogram', name: 'Histogram', reason: 'Dağılımı görmek için', recommended: true });
    }

    // 4. Kategorik değişken + sayısal varsa boxplot
    if (categoricalColumns.length > 0 && numericColumns.length >= 1 && uniqueCategories <= 8) {
        suggestions.push({ type: 'boxplot', name: 'Boxplot', reason: 'İstatistiksel analiz için' });
    }

    // 5. Çok boyutlu analiz
    if (numericColumns.length >= 3) {
        suggestions.push({ type: 'radar', name: 'Radar Grafiği', reason: 'Çok boyutlu karşılaştırma için' });
    }

    // 6. Tarih sütunları varsa
    if (dateColumns.length >= 2) {
        suggestions.push({ type: 'timeline', name: 'Zaman Çizelgesi', reason: 'Zaman aralıklarını görmek için' });
    }

    // Önerileri göster
    if (suggestions.length > 0) {
        const suggestionList = document.getElementById('suggestionList');
        suggestionList.innerHTML = '';

        suggestions.forEach(suggestion => {
            const badge = document.createElement('div');
            badge.className = 'suggestion-badge' + (suggestion.recommended ? ' recommended' : '');
            badge.textContent = `${suggestion.name}${suggestion.recommended ? ' ⭐' : ''} - ${suggestion.reason}`;
            badge.onclick = () => {
                // Grafik tipini otomatik seç
                document.querySelectorAll('.chart-type-card').forEach(card => {
                    card.classList.remove('selected');
                });

                const cardToSelect = Array.from(document.querySelectorAll('.chart-type-card'))
                    .find(card => card.getAttribute('onclick').includes(`'${suggestion.type}'`));

                if (cardToSelect) {
                    cardToSelect.classList.add('selected');
                    selectedChartType = suggestion.type;
                    showColumnSelection();

                    // Grafik kartına kaydır
                    cardToSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };
            suggestionList.appendChild(badge);
        });

        document.getElementById('chartSuggestions').style.display = 'block';
    }
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

    // Grafik türüne göre özel işlemler
    let config;
    if (selectedChartType === 'boxplot') {
        config = generateBoxplotChart(labelColumnIndex, selectedValueIndices);
    } else if (selectedChartType === 'histogram') {
        config = generateHistogramChart(selectedValueIndices[0]);
    } else if (selectedChartType === 'timeline') {
        config = generateTimelineChart(labelColumnIndex, selectedValueIndices);
    } else if (selectedChartType === 'barStacked') {
        config = generateStackedBarChart(labelColumnIndex, selectedValueIndices);
    } else if (selectedChartType === 'barGrouped') {
        config = generateGroupedBarChart(labelColumnIndex, selectedValueIndices);
    } else if (selectedChartType === 'pie' || selectedChartType === 'doughnut' || selectedChartType === 'polarArea') {
        config = generatePieChart(labelColumnIndex, selectedValueIndices[0]);
    } else {
        config = generateStandardChart(labelColumnIndex, selectedValueIndices);
    }

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

// Standart grafik oluştur (bar, line, pie, doughnut, radar, polarArea, scatter, bubble)
function generateStandardChart(labelColumnIndex, selectedValueIndices) {
    const labels = [];
    const datasets = [];

    // Her değer sütunu için dataset oluştur
    selectedValueIndices.forEach(valueIndex => {
        const dataPoints = [];

        for (let i = 1; i < uploadedData.length; i++) {
            const label = uploadedData[i][labelColumnIndex];
            const value = parseFloat(uploadedData[i][valueIndex]) || 0;

            if (i === 1 || labels.length < uploadedData.length - 1) {
                labels.push(label);
            }
            dataPoints.push(value);
        }

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

    const uniqueLabels = [...new Set(labels)];

    return {
        type: selectedChartType,
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
}

// Pasta/Halka/Polar grafik oluştur
function generatePieChart(labelColumnIndex, valueIndex) {
    const categoryCount = {};

    // Kategorilere göre değerleri topla
    for (let i = 1; i < uploadedData.length; i++) {
        const category = uploadedData[i][labelColumnIndex];
        const value = parseFloat(uploadedData[i][valueIndex]) || 1;

        if (categoryCount[category]) {
            categoryCount[category] += value;
        } else {
            categoryCount[category] = value;
        }
    }

    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);

    // Her kategori için farklı renk oluştur
    const backgroundColors = labels.map((_, index) => generateColor(index));

    return {
        type: selectedChartType,
        data: {
            labels: labels,
            datasets: [{
                label: uploadedData[0][valueIndex],
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(c => c.replace('0.7', '1')),
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                },
                title: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
}

// Yığılmış sütun grafiği
function generateStackedBarChart(labelColumnIndex, selectedValueIndices) {
    const labels = [];
    const datasets = [];

    selectedValueIndices.forEach(valueIndex => {
        const dataPoints = [];

        for (let i = 1; i < uploadedData.length; i++) {
            const label = uploadedData[i][labelColumnIndex];
            const value = parseFloat(uploadedData[i][valueIndex]) || 0;

            if (selectedValueIndices.indexOf(valueIndex) === 0) {
                labels.push(label);
            }
            dataPoints.push(value);
        }

        const color = generateColor(selectedValueIndices.indexOf(valueIndex));

        datasets.push({
            label: uploadedData[0][valueIndex],
            data: dataPoints,
            backgroundColor: color,
            borderColor: color.replace('0.7', '1'),
            borderWidth: 1,
        });
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
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
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: true
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        display: true
                    }
                }
            }
        }
    };
}

// Gruplu sütun grafiği
function generateGroupedBarChart(labelColumnIndex, selectedValueIndices) {
    const labels = [];
    const datasets = [];

    selectedValueIndices.forEach(valueIndex => {
        const dataPoints = [];

        for (let i = 1; i < uploadedData.length; i++) {
            const label = uploadedData[i][labelColumnIndex];
            const value = parseFloat(uploadedData[i][valueIndex]) || 0;

            if (selectedValueIndices.indexOf(valueIndex) === 0) {
                labels.push(label);
            }
            dataPoints.push(value);
        }

        const color = generateColor(selectedValueIndices.indexOf(valueIndex));

        datasets.push({
            label: uploadedData[0][valueIndex],
            data: dataPoints,
            backgroundColor: color,
            borderColor: color.replace('0.7', '1'),
            borderWidth: 1,
        });
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
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
            scales: {
                x: {
                    grid: {
                        display: true
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true
                    }
                }
            }
        }
    };
}

// Boxplot grafiği
function generateBoxplotChart(labelColumnIndex, selectedValueIndices) {
    const labels = [];
    const datasets = [];

    // Kategorilere göre verileri grupla
    const groupedData = {};

    for (let i = 1; i < uploadedData.length; i++) {
        const label = uploadedData[i][labelColumnIndex];
        if (!groupedData[label]) {
            groupedData[label] = [];
        }

        selectedValueIndices.forEach(valueIndex => {
            const value = parseFloat(uploadedData[i][valueIndex]);
            if (!isNaN(value)) {
                groupedData[label].push(value);
            }
        });
    }

    // Her kategori için boxplot verisi oluştur
    const boxplotData = Object.keys(groupedData).map(label => {
        const values = groupedData[label].sort((a, b) => a - b);
        labels.push(label);
        return values;
    });

    const color = generateColor(0);

    return {
        type: 'boxplot',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dağılım',
                data: boxplotData,
                backgroundColor: color,
                borderColor: color.replace('0.7', '1'),
                borderWidth: 1,
                outlierBackgroundColor: 'rgba(255, 99, 132, 0.7)',
                outlierBorderColor: 'rgba(255, 99, 132, 1)',
            }]
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
            }
        }
    };
}

// Histogram grafiği
function generateHistogramChart(valueIndex) {
    const values = [];

    for (let i = 1; i < uploadedData.length; i++) {
        const value = parseFloat(uploadedData[i][valueIndex]);
        if (!isNaN(value)) {
            values.push(value);
        }
    }

    // Histogram için sınıf aralıkları oluştur
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.ceil(Math.sqrt(values.length)); // Sturges kuralı
    const binWidth = (max - min) / binCount;

    const bins = [];
    const frequencies = [];

    for (let i = 0; i < binCount; i++) {
        const binStart = min + (i * binWidth);
        const binEnd = binStart + binWidth;
        const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
        bins.push(binLabel);

        const count = values.filter(v => v >= binStart && v < binEnd).length;
        frequencies.push(count);
    }

    const color = generateColor(0);

    return {
        type: 'bar',
        data: {
            labels: bins,
            datasets: [{
                label: uploadedData[0][valueIndex] + ' - Frekans',
                data: frequencies,
                backgroundColor: color,
                borderColor: color.replace('0.7', '1'),
                borderWidth: 1,
            }]
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
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frekans'
                    },
                    grid: {
                        display: true
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: uploadedData[0][valueIndex]
                    },
                    grid: {
                        display: true
                    }
                }
            }
        }
    };
}

// Timeline (Gantt) grafiği
function generateTimelineChart(labelColumnIndex, selectedValueIndices) {
    const labels = [];
    const datasets = [];

    // Timeline için başlangıç ve bitiş tarihleri gerekli (2 sütun)
    if (selectedValueIndices.length < 2) {
        alert('Timeline grafiği için en az 2 sütun seçin (başlangıç ve bitiş tarihleri)');
        return generateStandardChart(labelColumnIndex, selectedValueIndices);
    }

    const startIndex = selectedValueIndices[0];
    const endIndex = selectedValueIndices[1];

    const timelineData = [];

    for (let i = 1; i < uploadedData.length; i++) {
        const label = uploadedData[i][labelColumnIndex];
        const startDate = new Date(uploadedData[i][startIndex]);
        const endDate = new Date(uploadedData[i][endIndex]);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            labels.push(label);
            timelineData.push([startDate.getTime(), endDate.getTime()]);
        }
    }

    const color = generateColor(0);

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Zaman Aralığı',
                data: timelineData.map(t => t[1] - t[0]),
                backgroundColor: color,
                borderColor: color.replace('0.7', '1'),
                borderWidth: 1,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                title: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const days = Math.ceil(context.parsed.x / (1000 * 60 * 60 * 24));
                            return `Süre: ${days} gün`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Süre (ms)'
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    grid: {
                        display: true
                    }
                }
            }
        }
    };
}

// Renk oluştur
function generateColor(index) {
    const colors = [
        'rgba(102, 126, 234, 0.7)',  // Mor-mavi
        'rgba(237, 100, 166, 0.7)',  // Pembe
        'rgba(255, 159, 64, 0.7)',   // Turuncu
        'rgba(75, 192, 192, 0.7)',   // Turkuaz
        'rgba(153, 102, 255, 0.7)',  // Mor
        'rgba(255, 99, 132, 0.7)',   // Kırmızı-pembe
        'rgba(54, 162, 235, 0.7)',   // Mavi
        'rgba(255, 206, 86, 0.7)',   // Sarı
        'rgba(76, 175, 80, 0.7)',    // Yeşil
        'rgba(121, 85, 72, 0.7)',    // Kahverengi
        'rgba(156, 39, 176, 0.7)',   // Mor
        'rgba(0, 150, 136, 0.7)',    // Teal
        'rgba(233, 30, 99, 0.7)',    // Derin pembe
        'rgba(63, 81, 181, 0.7)',    // İndigo
        'rgba(255, 87, 34, 0.7)',    // Derin turuncu
        'rgba(96, 125, 139, 0.7)',   // Gri-mavi
        'rgba(205, 220, 57, 0.7)',   // Lime
        'rgba(255, 152, 0, 0.7)',    // Turuncu
        'rgba(103, 58, 183, 0.7)',   // Derin mor
        'rgba(0, 188, 212, 0.7)',    // Cyan
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
