// NotebookLM to HTML Converter - Surgical Mode V10

// Web-based converter with base64 iframe injection

 

class NotebookLMConverter {

    constructor() {

        this.htmlFile = null;

        this.resourceFiles = [];

        this.convertedHTML = null;

        this.init();

    }

 

    init() {

        this.setupEventListeners();

        this.setupDragAndDrop();

    }

 

    setupEventListeners() {

        // HTML file input

        document.getElementById('htmlFileInput').addEventListener('change', (e) => {

            this.handleHTMLFile(e.target.files[0]);

        });

 

        // Resources folder input

        document.getElementById('filesInput').addEventListener('change', (e) => {

            this.handleResourceFiles(Array.from(e.target.files));

        });

 

        // Convert button

        document.getElementById('convertBtn').addEventListener('click', () => {

            this.convert();

        });

 

        // Download button

        document.getElementById('downloadBtn').addEventListener('click', () => {

            this.download();

        });

    }

 

    setupDragAndDrop() {

        const htmlZone = document.getElementById('htmlDropZone');

        const filesZone = document.getElementById('filesDropZone');

 

        // HTML drop zone

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {

            htmlZone.addEventListener(eventName, (e) => {

                e.preventDefault();

                e.stopPropagation();

            });

        });

 

        ['dragenter', 'dragover'].forEach(eventName => {

            htmlZone.addEventListener(eventName, () => {

                htmlZone.classList.add('drag-over');

            });

        });

 

        ['dragleave', 'drop'].forEach(eventName => {

            htmlZone.addEventListener(eventName, () => {

                htmlZone.classList.remove('drag-over');

            });

        });

 

        htmlZone.addEventListener('drop', (e) => {

            const files = e.dataTransfer.files;

            if (files.length > 0) {

                this.handleHTMLFile(files[0]);

            }

        });

 

        // Resources drop zone

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {

            filesZone.addEventListener(eventName, (e) => {

                e.preventDefault();

                e.stopPropagation();

            });

        });

 

        ['dragenter', 'dragover'].forEach(eventName => {

            filesZone.addEventListener(eventName, () => {

                filesZone.classList.add('drag-over');

            });

        });

 

        ['dragleave', 'drop'].forEach(eventName => {

            filesZone.addEventListener(eventName, () => {

                filesZone.classList.remove('drag-over');

            });

        });

 

        filesZone.addEventListener('drop', (e) => {

            const files = Array.from(e.dataTransfer.files);

            this.handleResourceFiles(files);

        });

    }

 

    handleHTMLFile(file) {

        if (!file || !file.name.endsWith('.html')) {

            this.log('error', '❌ Lütfen geçerli bir HTML dosyası seçin');

            return;

        }

 

        this.htmlFile = file;

        const htmlZone = document.getElementById('htmlDropZone');

        const htmlInfo = document.getElementById('htmlFileInfo');

 

        htmlZone.classList.add('has-file');

        htmlInfo.textContent = `✓ ${file.name} (${this.formatBytes(file.size)})`;

 

        this.log('success', `✓ HTML dosyası yüklendi: ${file.name}`);

        this.checkReady();

    }

 

    handleResourceFiles(files) {

        if (!files || files.length === 0) {

            this.log('warning', '⚠️ Klasör boş veya dosya bulunamadı');

            return;

        }

 

        this.resourceFiles = files;

        const filesZone = document.getElementById('filesDropZone');

        const filesInfo = document.getElementById('filesInfo');

 

        filesZone.classList.add('has-file');

        filesInfo.textContent = `✓ ${files.length} dosya yüklendi`;

 

        this.log('success', `✓ ${files.length} kaynak dosya yüklendi`);

        this.checkReady();

    }

 

    checkReady() {

        const convertBtn = document.getElementById('convertBtn');

        if (this.htmlFile) {

            convertBtn.disabled = false;

        }

    }

 

    async convert() {

        try {

            this.log('info', '🚀 Dönüştürme başlatıldı...');

            this.showProgress(true);

            this.updateProgress(10, 'HTML dosyası okunuyor...');

 

            // Read HTML file

            const htmlContent = await this.readFileAsText(this.htmlFile);

            this.updateProgress(20, 'HTML içeriği işleniyor...');

 

            let processedHTML = htmlContent;

 

            // Embed resources if available

            if (this.resourceFiles.length > 0) {

                this.updateProgress(30, 'Kaynak dosyalar gömülüyor...');

                processedHTML = await this.embedResources(processedHTML);

            } else {

                this.log('warning', '⚠️ Kaynak klasörü yok, sadece HTML işleniyor');

            }

 

            // Inject Surgical Mode V10

            this.updateProgress(70, 'Surgical Mode V10 enjekte ediliyor...');

            processedHTML = this.injectSurgicalMode(processedHTML);

 

            // Add clean CSS to main HTML

            this.updateProgress(90, 'Temizlik CSS\'i ekleniyor...');

            processedHTML = this.addCleanCSS(processedHTML);

 

            this.convertedHTML = processedHTML;

            this.updateProgress(100, 'Tamamlandı! ✅');

 

            setTimeout(() => {

                this.showProgress(false);

                this.showDownload(true);

                this.log('success', '✅ Dönüştürme başarıyla tamamlandı!');

            }, 500);

 

        } catch (error) {

            this.log('error', `❌ Hata: ${error.message}`);

            this.showProgress(false);

        }

    }

 

    async embedResources(htmlContent) {

        const embedCount = { count: 0 };

        this.log('info', `📦 ${this.resourceFiles.length} dosya işlenecek...`);

 

        for (const file of this.resourceFiles) {

            try {

                const fileName = file.name;

                const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

 

                // Check if file is used in HTML

                if (!htmlContent.includes(fileName)) {

                    continue;

                }

 

                this.log('info', `  → ${fileName} gömülüyor...`);

 

                if (fileExt === '.css') {

                    // Embed CSS inline

                    const cssContent = await this.readFileAsText(file);

                    const styleTag = `<style data-embedded-from="${fileName}">\n${cssContent}\n</style>`;

 

                    // Replace link tag with style tag

                    const linkPattern = new RegExp(`<link[^>]*href=["'][^"']*${fileName}["'][^>]*>`, 'gi');

                    htmlContent = htmlContent.replace(linkPattern, styleTag);

                    embedCount.count++;

 

                } else if (fileExt === '.js') {

                    // Embed JS inline

                    const jsContent = await this.readFileAsText(file);

                    const scriptTag = `<script data-embedded-from="${fileName}">\n${jsContent}\n</script>`;

 

                    // Replace script tag

                    const scriptPattern = new RegExp(`<script[^>]*src=["'][^"']*${fileName}["'][^>]*></script>`, 'gi');

                    htmlContent = htmlContent.replace(scriptPattern, scriptTag);

                    embedCount.count++;

 

                } else {

                    // Embed as base64 (images, fonts, etc.)

                    const base64Data = await this.readFileAsBase64(file);

                    const mimeType = this.getMimeType(fileExt);

                    const dataUrl = `data:${mimeType};base64,${base64Data}`;

 

                    // Replace all occurrences of the file path

                    const patterns = [

                        new RegExp(`src=["'][^"']*${fileName}["']`, 'gi'),

                        new RegExp(`href=["'][^"']*${fileName}["']`, 'gi')

                    ];

 

                    patterns.forEach(pattern => {

                        htmlContent = htmlContent.replace(pattern, (match) => {

                            return match.replace(/["'][^"']*["']/, `"${dataUrl}"`);

                        });

                    });

                    embedCount.count++;

                }

 

            } catch (error) {

                this.log('error', `  ✗ ${file.name}: ${error.message}`);

            }

        }

 

        this.log('success', `✓ ${embedCount.count} dosya başarıyla gömüldü`);

        return htmlContent;

    }

 

    injectSurgicalMode(htmlContent) {

        this.log('info', '💉 Base64 iframe\'ler aranıyor...');

 

        const pattern = /(src="data:text\/html;base64,)([^"]+)"/g;

        let injectionCount = 0;

 

        htmlContent = htmlContent.replace(pattern, (match, prefix, base64Data) => {

            try {

                // Decode base64

                const decodedHTML = atob(base64Data);

 

                // Get Surgical Mode script

                const surgicalScript = this.getSurgicalModeScript();

 

                // Inject after <html> tag or at the beginning

                let newHTML;

                if (decodedHTML.includes('<html')) {

                    newHTML = decodedHTML.replace(/(<html[^>]*>)/i, `$1${surgicalScript}`);

                } else {

                    newHTML = surgicalScript + decodedHTML;

                }

 

                // Encode back to base64

                const newBase64 = btoa(unescape(encodeURIComponent(newHTML)));

                injectionCount++;

 

                return `${prefix}${newBase64}"`;

 

            } catch (error) {

                this.log('error', `  ✗ Iframe enjeksiyon hatası: ${error.message}`);

                return match;

            }

        });

 

        if (injectionCount > 0) {

            this.log('success', `✓ ${injectionCount} iframe'e Surgical Mode enjekte edildi`);

        } else {

            this.log('warning', '! Base64 iframe bulunamadı (normal HTML olabilir)');

        }

 

        return htmlContent;

    }

 

    getSurgicalModeScript() {

        return `

<script>

(function() {

    console.log("⚕️ SURGICAL MODE V10: Hassas Temizlik + Ekrana Sığma Aktif ⚕️");

 

    // 1. EVRENSEL CSS (Ekrana Sığma + Buton Gizleme)

    const universalCSS = \`

        /* HER ŞEYE UYGULANACAK KURAL - Ekrana Sığma */

        * {

            max-width: 100vw !important;

            box-sizing: border-box !important;

        }

 

        /* Scrollbar'ı tamamen gizle */

        ::-webkit-scrollbar {

            width: 0px !important;

            height: 0px !important;

            background: transparent !important;

            display: none !important;

        }

 

        ::-webkit-scrollbar-track {

            background: transparent !important;

        }

 

        ::-webkit-scrollbar-thumb {

            background: transparent !important;

            display: none !important;

        }

 

        /* Firefox ve diğer tarayıcılar için */

        html, body {

            scrollbar-width: none !important;

            -ms-overflow-style: none !important;

            overflow-x: hidden !important;

            width: 100% !important;

            position: relative !important;

        }

 

        /* İçerik tam genişlik */

        .main-content, main, mat-card {

            width: 100% !important;

            margin-left: 0 !important;

            margin-right: 0 !important;

        }

 

        /* AÇIKLA BUTONUNU GİZLE */

        button[aria-label*="Açıkla"],

        button[mattooltip*="Açıkla"],

        button[mattooltip*="açıkla"],

        mat-icon[data-mat-icon-name="spark"],

        mat-icon:contains("spark"),

        mat-icon:contains("auto_awesome") {

            display: none !important;

            visibility: hidden !important;

            opacity: 0 !important;

            pointer-events: none !important;

            position: absolute !important;

        }

    \`;

 

    const styleSheet = document.createElement('style');

    styleSheet.textContent = universalCSS;

    document.head.appendChild(styleSheet);

 

    // 2. HASSAS HEDEFLEME + EKRANA SIĞDIRMA FONKSİYONU

    function constrainAndClean(node) {

        if (node.nodeType !== 1) return;

 

        // A. AÇIKLA BUTONU GİZLEME

        if (node.tagName === 'BUTTON') {

            const text = (node.textContent || "").toLowerCase().trim();

            const aria = (node.getAttribute('aria-label') || "").toLowerCase();

            const tooltip = (node.getAttribute('mattooltip') || "").toLowerCase();

 

            const isTarget = text.includes("açıkla") || aria.includes("açıkla") || tooltip.includes("açıkla");

            const isSafe = text.includes("önceki") || text.includes("sonraki") ||

                           text.includes("previous") || text.includes("next") ||

                           aria.includes("previous") || aria.includes("next");

 

            if (isTarget && !isSafe) {

                node.style.display = 'none';

                node.style.visibility = 'hidden';

                node.setAttribute('hidden', 'true');

            }

        }

 

        // B. EKRANA SIĞDIRMA (Taşan elementleri daralt)

        if (node.scrollWidth > window.innerWidth) {

            node.style.setProperty('max-width', '100%', 'important');

            node.style.setProperty('overflow-x', 'hidden', 'important');

        }

    }

 

    // 3. TARAMA DÖNGÜSÜ (Shadow DOM + CSS Enjeksiyonu)

    function scan(root) {

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

        while(walker.nextNode()) {

            const node = walker.currentNode;

            constrainAndClean(node);

 

            // Shadow DOM içine CSS enjekte et

            if (node.shadowRoot) {

                if (!node.shadowRoot.querySelector('style[data-surgical-v10]')) {

                    const s = document.createElement('style');

                    s.textContent = universalCSS;

                    s.setAttribute('data-surgical-v10', 'true');

                    node.shadowRoot.appendChild(s);

                }

                scan(node.shadowRoot);

            }

        }

    }

 

    // 4. TIKLAMA TAKİBİ

    document.addEventListener('click', (e) => {

        let count = 0;

        const int = setInterval(() => {

            scan(document.body);

            count++;

            if(count > 20) clearInterval(int);

        }, 50);

    }, true);

 

    // 5. SÜREKLİ GÖZLEM (MutationObserver)

    const observer = new MutationObserver((mutations) => {

        scan(document.body);

    });

    observer.observe(document.body, { childList: true, subtree: true });

 

    // 6. PENCERE BOYUTU DEĞİŞİNCE TEKRAR KONTROL

    window.addEventListener('resize', () => {

        scan(document.body);

    });

 

    // 7. BAŞLANGIÇ TARAMA

    scan(document.body);

 

    // 8. SAYFA TAM YÜKLENDİKTEN SONRA SON VURUŞ

    setTimeout(() => {

        document.body.style.overflowX = 'hidden';

        document.documentElement.style.overflowX = 'hidden';

        scan(document.body);

        console.log("✅ Surgical Mode V10 tamamlandı - Ekran sığma garantili");

    }, 1000);

 

})();

</script>

`;

    }

 

    addCleanCSS(htmlContent) {

        // Add minimal clean CSS to main HTML

        const cleanCSS = `

<style id="main-clean-style">

/* Scrollbar gizle */

::-webkit-scrollbar {

    display: none !important;

}

 

* {

    scrollbar-width: none !important;

    -ms-overflow-style: none !important;

}

</style>`;

 

        // Inject before </head> or </body>

        if (htmlContent.includes('</head>')) {

            htmlContent = htmlContent.replace('</head>', cleanCSS + '\n</head>');

        } else if (htmlContent.includes('</body>')) {

            htmlContent = htmlContent.replace('</body>', cleanCSS + '\n</body>');

        } else {

            htmlContent += cleanCSS;

        }

 

        return htmlContent;

    }

 

    download() {

        if (!this.convertedHTML) {

            this.log('error', '❌ Dönüştürülmüş HTML bulunamadı');

            return;

        }

 

        const originalName = this.htmlFile.name.replace('.html', '');

        const newFileName = `${originalName}_Tek_Dosya.html`;

 

        const blob = new Blob([this.convertedHTML], { type: 'text/html;charset=utf-8' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = newFileName;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

 

        this.log('success', `✅ Dosya indirildi: ${newFileName}`);

    }

 

    // Utility functions

    async readFileAsText(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);

            reader.onerror = (e) => reject(new Error('Dosya okunamadı'));

            reader.readAsText(file);

        });

    }

 

    async readFileAsBase64(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = (e) => {

                const base64 = e.target.result.split(',')[1];

                resolve(base64);

            };

            reader.onerror = (e) => reject(new Error('Dosya okunamadı'));

            reader.readAsDataURL(file);

        });

    }

 

    getMimeType(ext) {

        const mimeTypes = {

            '.svg': 'image/svg+xml',

            '.jpg': 'image/jpeg',

            '.jpeg': 'image/jpeg',

            '.png': 'image/png',

            '.gif': 'image/gif',

            '.webp': 'image/webp',

            '.woff': 'font/woff',

            '.woff2': 'font/woff2',

            '.ttf': 'font/ttf',

            '.eot': 'application/vnd.ms-fontobject',

            '.otf': 'font/otf',

            '.mp4': 'video/mp4',

            '.webm': 'video/webm',

            '.mp3': 'audio/mpeg',

            '.wav': 'audio/wav',

            '.pdf': 'application/pdf',

            '.json': 'application/json',

            '.xml': 'application/xml'

        };

        return mimeTypes[ext] || 'application/octet-stream';

    }

 

    formatBytes(bytes) {

        if (bytes === 0) return '0 Bytes';

        const k = 1024;

        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];

    }

 

    showProgress(show) {

        document.getElementById('progressSection').style.display = show ? 'block' : 'none';

        document.getElementById('logSection').style.display = show ? 'block' : 'none';

    }

 

    updateProgress(percent, text) {

        document.getElementById('progressFill').style.width = percent + '%';

        document.getElementById('progressText').textContent = text;

    }

 

    showDownload(show) {

        document.getElementById('downloadSection').style.display = show ? 'block' : 'none';

    }

 

    log(type, message) {

        const logSection = document.getElementById('logSection');

        const logContent = document.getElementById('logContent');

 

        logSection.style.display = 'block';

 

        const entry = document.createElement('div');

        entry.className = `log-entry ${type}`;

        entry.textContent = message;

        logContent.appendChild(entry);

 

        // Auto scroll to bottom

        logContent.scrollTop = logContent.scrollHeight;

    }

}

 

// Initialize when DOM is ready

document.addEventListener('DOMContentLoaded', () => {

    new NotebookLMConverter();

});