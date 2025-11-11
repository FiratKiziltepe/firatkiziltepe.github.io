// Global değişkenler
let convertedData = null;
let fileName = '';

// DOM elementleri
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameEl = document.getElementById('fileName');
const fileStatsEl = document.getElementById('fileStats');
const previewArea = document.getElementById('previewArea');
const previewContent = document.getElementById('previewContent');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Event listeners
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', downloadJSON);
resetBtn.addEventListener('click', resetConverter);

// Drag & Drop event listeners
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Dosya seçimi
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Dosya işleme
function handleFile(file) {
    // Hata ve başarı mesajlarını temizle
    hideMessages();

    // Dosya türü kontrolü
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    const isValidExtension = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!validTypes.includes(file.type) && !isValidExtension) {
        showError('Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)');
        return;
    }

    fileName = file.name.replace(/\.[^/.]+$/, ''); // Uzantıyı kaldır

    // Dosyayı oku
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // İlk sayfayı al
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // JSON'a dönüştür
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                raw: false, // Tarihleri string olarak al
                defval: '' // Boş hücreleri boş string yap
            });

            if (jsonData.length === 0) {
                showError('Excel dosyası boş görünüyor. Lütfen veri içeren bir dosya seçin.');
                return;
            }

            // Verileri sakla
            convertedData = jsonData;

            // Bilgileri göster
            displayFileInfo(file, jsonData);
            displayPreview(jsonData);
            showSuccess(`✅ Başarılı! ${jsonData.length} satır veri dönüştürüldü.`);

            // İndirme butonunu aktif et
            downloadBtn.disabled = false;

        } catch (error) {
            showError('Dosya okunurken bir hata oluştu: ' + error.message);
            console.error('Conversion error:', error);
        }
    };

    reader.onerror = function() {
        showError('Dosya okunurken bir hata oluştu.');
    };

    reader.readAsArrayBuffer(file);
}

// Dosya bilgilerini göster
function displayFileInfo(file, data) {
    const sizeKB = (file.size / 1024).toFixed(2);
    const columns = Object.keys(data[0] || {});

    fileNameEl.textContent = `📄 ${file.name}`;
    fileStatsEl.innerHTML = `
        <div>📊 ${data.length} satır × ${columns.length} sütun</div>
        <div>💾 Boyut: ${sizeKB} KB</div>
        <div>📋 Sütunlar: ${columns.join(', ')}</div>
    `;

    fileInfo.classList.add('show');
}

// JSON önizlemesi göster
function displayPreview(data) {
    const preview = data.slice(0, 3); // İlk 3 satırı al
    const previewText = JSON.stringify(preview, null, 2);

    previewContent.textContent = previewText;
    previewArea.classList.add('show');
}

// JSON dosyasını indir
function downloadJSON() {
    if (!convertedData) {
        showError('Dönüştürülecek veri yok!');
        return;
    }

    try {
        // JSON string'e çevir
        const jsonString = JSON.stringify(convertedData, null, 2);

        // Blob oluştur
        const blob = new Blob([jsonString], { type: 'application/json' });

        // İndirme linki oluştur
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName || 'data'}.json`;

        // İndir
        document.body.appendChild(a);
        a.click();

        // Temizle
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('✅ JSON dosyası başarıyla indirildi!');

    } catch (error) {
        showError('İndirme sırasında bir hata oluştu: ' + error.message);
        console.error('Download error:', error);
    }
}

// Sıfırla
function resetConverter() {
    convertedData = null;
    fileName = '';
    fileInput.value = '';

    fileInfo.classList.remove('show');
    previewArea.classList.remove('show');
    downloadBtn.disabled = true;

    hideMessages();
}

// Hata mesajı göster
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

// Başarı mesajı göster
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

// Mesajları gizle
function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log('Excel to JSON Converter hazır! 🚀');
});
