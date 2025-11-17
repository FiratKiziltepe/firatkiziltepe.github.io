// Global değişkenler
let uploadedFiles = [];
let scormPackage = null;

// DOM elemanları
const htmlFileInput = document.getElementById('htmlFile');
const folderInput = document.getElementById('folderUpload');
const htmlFileName = document.getElementById('htmlFileName');
const folderName = document.getElementById('folderName');
const fileList = document.getElementById('fileList');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressBar = document.getElementById('progressBar');
const statusDiv = document.getElementById('status');
const previewSection = document.getElementById('previewSection');
const packageInfo = document.getElementById('packageInfo');

// Form elemanları
const courseTitle = document.getElementById('courseTitle');
const courseId = document.getElementById('courseId');
const scoTitle = document.getElementById('scoTitle');
const scoId = document.getElementById('scoId');
const launchFile = document.getElementById('launchFile');
const description = document.getElementById('description');
const includeApi = document.getElementById('includeApi');

// Event listeners
htmlFileInput.addEventListener('change', handleSingleFileUpload);
folderInput.addEventListener('change', handleFolderUpload);
convertBtn.addEventListener('click', createSCORMPackage);
downloadBtn.addEventListener('click', downloadPackage);

// Form alanlarını izle
[courseTitle, courseId, scoTitle, scoId, launchFile].forEach(input => {
    input.addEventListener('input', validateForm);
});

/**
 * Tek HTML dosyası yükleme
 */
function handleSingleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        uploadedFiles = [file];
        htmlFileName.textContent = file.name;
        folderName.textContent = '';
        folderInput.value = '';
        displayFileList();
        validateForm();

        // Dosya adını launch file olarak ayarla
        launchFile.value = file.name;
    }
}

/**
 * Klasör yükleme
 */
function handleFolderUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        uploadedFiles = files;
        const folderPath = files[0].webkitRelativePath.split('/')[0];
        folderName.textContent = `${folderPath} (${files.length} dosya)`;
        htmlFileName.textContent = '';
        htmlFileInput.value = '';
        displayFileList();
        validateForm();

        // index.html varsa launch file olarak ayarla
        const indexFile = files.find(f => f.name === 'index.html');
        if (indexFile) {
            launchFile.value = indexFile.webkitRelativePath.split('/').slice(1).join('/');
        }
    }
}

/**
 * Yüklenen dosyaları listele
 */
function displayFileList() {
    fileList.innerHTML = '';

    if (uploadedFiles.length === 0) return;

    const title = document.createElement('h4');
    title.textContent = 'Yüklenen Dosyalar:';
    title.style.marginBottom = '10px';
    title.style.color = '#667eea';
    fileList.appendChild(title);

    uploadedFiles.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';

        const path = file.webkitRelativePath || file.name;
        const size = formatFileSize(file.size);

        div.innerHTML = `
            <strong>${path}</strong>
            <span style="float: right; color: #999;">${size}</span>
        `;

        fileList.appendChild(div);
    });
}

/**
 * Dosya boyutunu formatla
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Form validasyonu
 */
function validateForm() {
    const isValid = uploadedFiles.length > 0 &&
                   courseTitle.value.trim() !== '' &&
                   courseId.value.trim() !== '' &&
                   scoTitle.value.trim() !== '' &&
                   scoId.value.trim() !== '' &&
                   launchFile.value.trim() !== '';

    convertBtn.disabled = !isValid;
}

/**
 * SCORM manifest dosyası oluştur
 */
function generateManifest() {
    const timestamp = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseId.value}" version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                        http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                        http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
        <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd">
            <general>
                <title>
                    <langstring xml:lang="tr">${escapeXml(courseTitle.value)}</langstring>
                </title>
                ${description.value ? `<description>
                    <langstring xml:lang="tr">${escapeXml(description.value)}</langstring>
                </description>` : ''}
            </general>
            <metametadata>
                <contribute>
                    <date>
                        <datetime>${timestamp}</datetime>
                    </date>
                </contribute>
            </metametadata>
        </lom>
    </metadata>

    <organizations default="${courseId.value}_org">
        <organization identifier="${courseId.value}_org">
            <title>${escapeXml(courseTitle.value)}</title>
            <item identifier="${scoId.value}" identifierref="${scoId.value}_resource" isvisible="true">
                <title>${escapeXml(scoTitle.value)}</title>
            </item>
        </organization>
    </organizations>

    <resources>
        <resource identifier="${scoId.value}_resource" type="webcontent" adlcp:scormtype="sco" href="${escapeXml(launchFile.value)}">
            ${generateResourceFiles()}
        </resource>
    </resources>

</manifest>`;
}

/**
 * Resource dosyalarını oluştur
 */
function generateResourceFiles() {
    let filesXml = '';

    uploadedFiles.forEach(file => {
        const path = file.webkitRelativePath || file.name;
        // Klasör yapısını koru
        const relativePath = file.webkitRelativePath ?
            file.webkitRelativePath.split('/').slice(1).join('/') :
            file.name;

        filesXml += `            <file href="${escapeXml(relativePath)}" />\n`;
    });

    // SCORM API wrapper dahilse ekle
    if (includeApi.checked) {
        filesXml += `            <file href="scorm-api-wrapper.js" />\n`;
    }

    return filesXml;
}

/**
 * XML için escape
 */
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

/**
 * SCORM paketi oluştur
 */
async function createSCORMPackage() {
    try {
        showStatus('info', 'SCORM paketi oluşturuluyor...');
        progressBar.style.display = 'block';
        convertBtn.disabled = true;

        // JSZip instance oluştur
        const zip = new JSZip();

        // Manifest dosyasını ekle
        const manifestContent = generateManifest();
        zip.file('imsmanifest.xml', manifestContent);

        // Yüklenen dosyaları ekle
        for (const file of uploadedFiles) {
            const content = await readFileAsArrayBuffer(file);
            const relativePath = file.webkitRelativePath ?
                file.webkitRelativePath.split('/').slice(1).join('/') :
                file.name;

            zip.file(relativePath, content);
        }

        // SCORM API wrapper ekle
        if (includeApi.checked) {
            const apiResponse = await fetch('scorm-api-wrapper.js');
            const apiContent = await apiResponse.text();
            zip.file('scorm-api-wrapper.js', apiContent);

            // Ana HTML dosyasına API wrapper'ı ekle
            await injectAPIWrapper(zip);
        }

        // Zip oluştur
        scormPackage = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        showStatus('success', 'SCORM paketi başarıyla oluşturuldu!');
        progressBar.style.display = 'none';
        showPreview();

    } catch (error) {
        console.error('Hata:', error);
        showStatus('error', 'Paket oluşturulurken hata oluştu: ' + error.message);
        progressBar.style.display = 'none';
        convertBtn.disabled = false;
    }
}

/**
 * Dosyayı ArrayBuffer olarak oku
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Dosyayı text olarak oku
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * HTML dosyasına SCORM API wrapper'ı enjekte et
 */
async function injectAPIWrapper(zip) {
    const launchFileName = launchFile.value;

    // Launch dosyasını zip'ten al
    const launchFileContent = await zip.file(launchFileName).async('string');

    // Eğer zaten script tag'i varsa ekleme
    if (launchFileContent.includes('scorm-api-wrapper.js')) {
        return;
    }

    // Script tag'ini head veya body'nin başına ekle
    let modifiedContent = launchFileContent;

    const scriptTag = '<script src="scorm-api-wrapper.js"></script>';

    if (modifiedContent.includes('</head>')) {
        modifiedContent = modifiedContent.replace('</head>', `  ${scriptTag}\n</head>`);
    } else if (modifiedContent.includes('<body>')) {
        modifiedContent = modifiedContent.replace('<body>', `<body>\n  ${scriptTag}`);
    } else {
        // HTML yapısı bulunamazsa başa ekle
        modifiedContent = scriptTag + '\n' + modifiedContent;
    }

    // Değiştirilmiş dosyayı zip'e ekle
    zip.file(launchFileName, modifiedContent);
}

/**
 * Önizleme göster
 */
function showPreview() {
    previewSection.style.display = 'block';

    const fileCount = uploadedFiles.length + (includeApi.checked ? 2 : 1); // +1 manifest, +1 api wrapper
    const packageSize = formatFileSize(scormPackage.size);

    packageInfo.innerHTML = `
        <h3>Paket Bilgileri</h3>
        <ul>
            <li><strong>Kurs Başlığı:</strong> ${courseTitle.value}</li>
            <li><strong>Kurs ID:</strong> ${courseId.value}</li>
            <li><strong>SCO Başlığı:</strong> ${scoTitle.value}</li>
            <li><strong>SCO ID:</strong> ${scoId.value}</li>
            <li><strong>Başlangıç Dosyası:</strong> ${launchFile.value}</li>
            <li><strong>Toplam Dosya:</strong> ${fileCount}</li>
            <li><strong>Paket Boyutu:</strong> ${packageSize}</li>
            <li><strong>SCORM Versiyonu:</strong> 1.2</li>
            <li><strong>API Wrapper:</strong> ${includeApi.checked ? 'Dahil' : 'Dahil değil'}</li>
        </ul>
    `;

    previewSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Paketi indir
 */
function downloadPackage() {
    if (!scormPackage) {
        showStatus('error', 'İndirilecek paket bulunamadı!');
        return;
    }

    const fileName = `${courseId.value}_scorm12.zip`;
    const url = URL.createObjectURL(scormPackage);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('success', `Paket indirildi: ${fileName}`);
}

/**
 * Durum mesajı göster
 */
function showStatus(type, message) {
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    // 5 saniye sonra gizle (error hariç)
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Sayfa yüklendiğinde form validasyonu
validateForm();
