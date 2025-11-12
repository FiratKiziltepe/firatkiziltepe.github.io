// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State management
const state = {
    files: [],
    processing: false
};

// DOM elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const filesContainer = document.getElementById('filesContainer');
const ocrLanguage = document.getElementById('ocrLanguage');
const progressInfo = document.getElementById('progressInfo');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Event listeners
uploadBox.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

// Drag and drop handlers
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

// File handling
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
    fileInput.value = ''; // Reset input
}

function handleFiles(files) {
    const validFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/gif'];
        return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
        alert('Lütfen geçerli bir dosya formatı seçin (PDF, JPG, PNG, BMP, GIF)');
        return;
    }

    validFiles.forEach(file => {
        const fileId = Date.now() + Math.random();
        const fileObj = {
            id: fileId,
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            status: 'pending',
            progress: 0,
            result: null
        };
        state.files.push(fileObj);
        renderFileCard(fileObj);
    });

    // Start processing automatically
    processNextFile();
}

function renderFileCard(fileObj) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = `file-${fileObj.id}`;

    const icon = fileObj.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf';

    card.innerHTML = `
        <div class="file-header">
            <i class="fas ${icon} file-icon"></i>
            <div class="file-info">
                <h4>${fileObj.name}</h4>
                <p>${fileObj.size}</p>
            </div>
        </div>
        <canvas class="file-preview" id="preview-${fileObj.id}"></canvas>
        <div class="file-status status-pending" id="status-${fileObj.id}">
            <i class="fas fa-clock"></i> Beklemede
        </div>
        <div class="file-progress">
            <div class="file-progress-bar" id="progress-${fileObj.id}" style="width: 0%"></div>
        </div>
        <div class="file-actions">
            <button class="btn-download" id="download-${fileObj.id}" disabled>
                <i class="fas fa-download"></i> İndir
            </button>
            <button class="btn-remove" onclick="removeFile(${fileObj.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    filesContainer.appendChild(card);

    // Generate preview
    generatePreview(fileObj);
}

async function generatePreview(fileObj) {
    const canvas = document.getElementById(`preview-${fileObj.id}`);
    const ctx = canvas.getContext('2d');

    if (fileObj.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = URL.createObjectURL(fileObj.file);
    } else if (fileObj.type === 'application/pdf') {
        try {
            const arrayBuffer = await fileObj.file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        } catch (error) {
            console.error('Preview error:', error);
        }
    }
}

async function processNextFile() {
    if (state.processing) return;

    const nextFile = state.files.find(f => f.status === 'pending');
    if (!nextFile) return;

    state.processing = true;
    await processFile(nextFile);
    state.processing = false;

    // Process next file if any
    processNextFile();
}

async function processFile(fileObj) {
    updateFileStatus(fileObj.id, 'processing', '<i class="fas fa-spinner fa-spin"></i> İşleniyor...');

    try {
        const language = ocrLanguage.value;

        if (fileObj.type.startsWith('image/')) {
            await processImage(fileObj, language);
        } else if (fileObj.type === 'application/pdf') {
            await processPDF(fileObj, language);
        }

        updateFileStatus(fileObj.id, 'completed', '<i class="fas fa-check-circle"></i> Tamamlandı');
        fileObj.status = 'completed';

        // Enable download button
        const downloadBtn = document.getElementById(`download-${fileObj.id}`);
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => downloadFile(fileObj);
    } catch (error) {
        console.error('Processing error:', error);
        updateFileStatus(fileObj.id, 'error', '<i class="fas fa-exclamation-circle"></i> Hata oluştu');
        fileObj.status = 'error';
    }
}

async function processImage(fileObj, language) {
    updateProgress(fileObj.id, 10);

    // Read image
    const imageData = await fileObj.file.arrayBuffer();
    const blob = new Blob([imageData], { type: fileObj.type });

    updateProgress(fileObj.id, 20);

    // Perform OCR
    const { data: { text, hocr } } = await Tesseract.recognize(
        blob,
        language,
        {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = 20 + (m.progress * 60);
                    updateProgress(fileObj.id, progress);
                }
            }
        }
    );

    updateProgress(fileObj.id, 80);

    // Get image dimensions for proper scaling
    const img = await createImageBitmap(blob);

    // Create searchable PDF with HOCR positioning
    const pdfBytes = await createSearchablePDFWithHOCR([{
        blob,
        width: img.width,
        height: img.height,
        hocr: hocr,
        text: text
    }]);

    updateProgress(fileObj.id, 100);

    fileObj.result = pdfBytes;
}

async function processPDF(fileObj, language) {
    updateProgress(fileObj.id, 5);

    // Load PDF
    const arrayBuffer = await fileObj.file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    updateProgress(fileObj.id, 8);

    // Check if PDF already has searchable text
    let hasSearchableText = false;
    let totalTextLength = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        totalTextLength += pageText.trim().length;
    }

    // If PDF has significant text content (more than 50 chars), it's already searchable
    hasSearchableText = totalTextLength > 50;

    if (hasSearchableText) {
        // PDF is already searchable, return it as is
        updateProgress(fileObj.id, 100);
        fileObj.result = new Uint8Array(arrayBuffer);
        return;
    }

    updateProgress(fileObj.id, 15);

    // PDF needs OCR - process each page with HOCR for positioning
    const pagesData = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        // Render page to canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        // OCR the page with HOCR
        const baseProgress = 15 + ((pageNum - 1) / numPages) * 60;
        const result = await Tesseract.recognize(
            blob,
            language,
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = baseProgress + (m.progress * (60 / numPages));
                        updateProgress(fileObj.id, progress);
                    }
                }
            }
        );

        pagesData.push({
            blob,
            width: viewport.width,
            height: viewport.height,
            hocr: result.data.hocr,
            text: result.data.text
        });
    }

    updateProgress(fileObj.id, 80);

    // Create searchable PDF with proper text positioning
    const pdfBytes = await createSearchablePDFWithHOCR(pagesData);

    updateProgress(fileObj.id, 100);

    fileObj.result = pdfBytes;
}

async function createSearchablePDF(imageBlob, text, imageType) {
    const pdfDoc = await PDFLib.PDFDocument.create();

    // Get image dimensions
    const img = await createImageBitmap(imageBlob);
    const aspectRatio = img.width / img.height;
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = pageWidth / aspectRatio;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Embed image
    let image;
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
        image = await pdfDoc.embedJpg(uint8Array);
    } else {
        image = await pdfDoc.embedPng(uint8Array);
    }

    // Draw image
    page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
    });

    // Add invisible text layer for searchability
    const fontSize = 12;
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    // Split text into lines and add to PDF
    const lines = text.split('\n');
    let yPosition = pageHeight - 50;

    for (const line of lines) {
        if (line.trim()) {
            try {
                // Sanitize text to handle Turkish and special characters
                const sanitizedLine = sanitizeTextForPDF(line);
                page.drawText(sanitizedLine, {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font: font,
                    color: PDFLib.rgb(1, 1, 1), // White text (invisible on white background)
                    opacity: 0.01, // Nearly invisible
                });
            } catch (error) {
                // Skip lines that cannot be encoded
                console.warn('Skipping line due to encoding error:', error.message);
            }
            yPosition -= fontSize + 5;
            if (yPosition < 50) break; // Prevent overflow
        }
    }

    return await pdfDoc.save();
}

async function createSearchablePDFFromPages(images, texts) {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < images.length; i++) {
        const { blob, width, height } = images[i];
        const text = texts[i];

        const aspectRatio = width / height;
        const pageWidth = 595.28; // A4 width
        const pageHeight = pageWidth / aspectRatio;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Embed image
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const image = await pdfDoc.embedPng(uint8Array);

        // Draw image
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
        });

        // Add invisible text layer
        const fontSize = 12;
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const lines = text.split('\n');
        let yPosition = pageHeight - 50;

        for (const line of lines) {
            if (line.trim()) {
                try {
                    // Sanitize text to handle Turkish and special characters
                    const sanitizedLine = sanitizeTextForPDF(line);
                    page.drawText(sanitizedLine, {
                        x: 50,
                        y: yPosition,
                        size: fontSize,
                        font: font,
                        color: PDFLib.rgb(1, 1, 1),
                        opacity: 0.01,
                    });
                } catch (error) {
                    // Skip lines that cannot be encoded
                    console.warn('Skipping line due to encoding error:', error.message);
                }
                yPosition -= fontSize + 5;
                if (yPosition < 50) break;
            }
        }
    }

    return await pdfDoc.save();
}

async function createSearchablePDFWithHOCR(pagesData) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    for (let i = 0; i < pagesData.length; i++) {
        const { blob, width, height, hocr } = pagesData[i];

        // Calculate PDF page dimensions
        const aspectRatio = width / height;
        const pageWidth = 595.28; // A4 width in points
        const pageHeight = pageWidth / aspectRatio;
        const scale = pageWidth / width;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Embed and draw image
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const image = await pdfDoc.embedPng(uint8Array);

        page.drawImage(image, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
        });

        // Parse HOCR and add text with proper positioning
        const parser = new DOMParser();
        const hocrDoc = parser.parseFromString(hocr, 'text/html');
        const words = hocrDoc.querySelectorAll('.ocrx_word');

        words.forEach(wordElement => {
            const title = wordElement.getAttribute('title');
            const bboxMatch = title.match(/bbox (\d+) (\d+) (\d+) (\d+)/);

            if (bboxMatch) {
                const x1 = parseInt(bboxMatch[1]);
                const y1 = parseInt(bboxMatch[2]);
                const x2 = parseInt(bboxMatch[3]);
                const y2 = parseInt(bboxMatch[4]);

                const wordText = wordElement.textContent.trim();

                if (wordText) {
                    try {
                        const sanitizedText = sanitizeTextForPDF(wordText);

                        // Calculate position and size
                        const wordWidth = (x2 - x1) * scale;
                        const wordHeight = (y2 - y1) * scale;
                        const xPos = x1 * scale;
                        // PDF coordinates are from bottom, HOCR is from top
                        const yPos = pageHeight - (y2 * scale);

                        // Calculate font size to fit the bbox
                        const fontSize = Math.max(8, Math.min(wordHeight * 0.8, 20));

                        page.drawText(sanitizedText, {
                            x: xPos,
                            y: yPos,
                            size: fontSize,
                            font: font,
                            color: PDFLib.rgb(1, 1, 1),
                            opacity: 0.01,
                        });
                    } catch (error) {
                        // Skip words that cannot be encoded
                        console.warn('Skipping word due to encoding error:', wordText, error.message);
                    }
                }
            }
        });
    }

    return await pdfDoc.save();
}

function downloadFile(fileObj) {
    if (!fileObj.result) return;

    const blob = new Blob([fileObj.result], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.name.replace(/\.[^/.]+$/, '') + '_searchable.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function removeFile(fileId) {
    const index = state.files.findIndex(f => f.id === fileId);
    if (index > -1) {
        state.files.splice(index, 1);
    }

    const card = document.getElementById(`file-${fileId}`);
    if (card) {
        card.remove();
    }
}

function updateFileStatus(fileId, statusClass, statusText) {
    const statusElement = document.getElementById(`status-${fileId}`);
    if (statusElement) {
        statusElement.className = `file-status status-${statusClass}`;
        statusElement.innerHTML = statusText;
    }
}

function updateProgress(fileId, progress) {
    const progressBar = document.getElementById(`progress-${fileId}`);
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function sanitizeTextForPDF(text) {
    // Map Turkish and special characters to WinAnsi compatible alternatives
    const charMap = {
        '\u0131': 'i', '\u0130': 'I',  // ı, İ
        '\u011F': 'g', '\u011E': 'G',  // ğ, Ğ
        '\u00FC': 'u', '\u00DC': 'U',  // ü, Ü
        '\u015F': 's', '\u015E': 'S',  // ş, Ş
        '\u00F6': 'o', '\u00D6': 'O',  // ö, Ö
        '\u00E7': 'c', '\u00C7': 'C',  // ç, Ç
        '\u00E2': 'a', '\u00C2': 'A',  // â, Â
        '\u00EE': 'i', '\u00CE': 'I',  // î, Î
        '\u00FB': 'u', '\u00DB': 'U',  // û, Û
        '\u00E9': 'e', '\u00E8': 'e', '\u00EA': 'e', '\u00EB': 'e',  // é, è, ê, ë
        '\u00C9': 'E', '\u00C8': 'E', '\u00CA': 'E', '\u00CB': 'E',  // É, È, Ê, Ë
        '\u00E1': 'a', '\u00E0': 'a', '\u00E4': 'a', '\u00E5': 'a',  // á, à, ä, å
        '\u00C1': 'A', '\u00C0': 'A', '\u00C4': 'A', '\u00C5': 'A',  // Á, À, Ä, Å
        '\u00F3': 'o', '\u00F2': 'o', '\u00F4': 'o',  // ó, ò, ô
        '\u00D3': 'O', '\u00D2': 'O', '\u00D4': 'O',  // Ó, Ò, Ô
        '\u00FA': 'u', '\u00F9': 'u',  // ú, ù
        '\u00DA': 'U', '\u00D9': 'U',  // Ú, Ù
        '\u00F1': 'n', '\u00D1': 'N',  // ñ, Ñ
        '\u2013': '-', '\u2014': '-',  // –, —
        '\u2018': "'", '\u2019': "'",  // ', '
        '\u201C': '"', '\u201D': '"',  // ", "
        '\u2026': '...',  // …
        '\u20AC': 'EUR',  // €
        '\u00A3': 'GBP',  // £
        '\u00A5': 'YEN',  // ¥
        '\u00A9': '(c)',  // ©
        '\u00AE': '(r)',  // ®
        '\u2122': '(tm)'  // ™
    };

    let sanitized = text;
    for (const [char, replacement] of Object.entries(charMap)) {
        sanitized = sanitized.split(char).join(replacement);
    }

    // Remove any remaining non-ASCII characters that might cause issues
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');

    return sanitized;
}
