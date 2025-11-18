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
        document.getElementById('htmlFileInput').addEventListener('change', (e) => {
            this.handleHTMLFile(e.target.files[0]);
        });

        document.getElementById('filesInput').addEventListener('change', (e) => {
            this.handleResourceFiles(Array.from(e.target.files));
        });

        document.getElementById('convertBtn').addEventListener('click', () => {
            this.convert();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.download();
        });
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'));
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = [...dt.files];
            
            const htmlFile = files.find(f => f.type === 'text/html' || f.name.endsWith('.html'));
            const resources = files.filter(f => f !== htmlFile);

            if (htmlFile) this.handleHTMLFile(htmlFile);
            if (resources.length > 0) this.handleResourceFiles(resources);
        });
    }

    handleHTMLFile(file) {
        if (file) {
            this.htmlFile = file;
            this.updateFileList();
            this.checkReady();
            this.log('info', `HTML dosyası seçildi: ${file.name}`);
        }
    }

    handleResourceFiles(files) {
        if (files.length > 0) {
            this.resourceFiles = [...this.resourceFiles, ...files];
            this.updateFileList();
            this.log('info', `${files.length} kaynak dosyası eklendi`);
        }
    }

    updateFileList() {
        const list = document.getElementById('fileList');
        list.innerHTML = '';
        
        if (this.htmlFile) {
            list.innerHTML += `<div class="file-item html-file">📄 ${this.htmlFile.name}</div>`;
        }
        
        if (this.resourceFiles.length > 0) {
            list.innerHTML += `<div class="file-item resource-file">📦 ${this.resourceFiles.length} kaynak dosyası</div>`;
        }
    }

    checkReady() {
        const btn = document.getElementById('convertBtn');
        btn.disabled = !this.htmlFile;
    }

    // Türkçe Karakter Dostu Base64 İşlemleri
    b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    }

    b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    // V10 Final Yaması (Script İçeriği)
    getInjectionScript() {
        return `
        <script>
        (function() {
            console.log("🌍 V11: Universal Fix (Web-PreInject) Aktif");

            const styles = \`
                /* HER ŞEYE UYGULANACAK KURAL */
                * {
                    max-width: 100vw !important;
                    box-sizing: border-box !important;
                }
                /* Scrollbar'ı çizimden kaldır */
                ::-webkit-scrollbar { width: 0px !important; height: 0px !important; display: none !important; }
                html, body {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                    overflow-x: hidden !important;
                    width: 100% !important;
                    position: relative !important;
                }
                /* İçerik genişliği */
                .main-content, main, mat-card, .notebook-content {
                    width: 100% !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                }
                /* BUTON GİZLEME */
                button[aria-label*="Açıkla"], 
                button[mattooltip*="Açıkla"],
                button:has(span:contains("Açıkla")) {
                    display: none !important;
                }
            \`;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);

            function constrainElements(root) {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                while(walker.nextNode()) {
                    const node = walker.currentNode;
                    
                    // Buton Gizleme
                    if (node.tagName === 'BUTTON') {
                        const txt = (node.textContent || "").toLowerCase();
                        const aria = (node.getAttribute('aria-label') || "").toLowerCase();
                        if ((txt.includes("açıkla") || aria.includes("açıkla")) && 
                            !(txt.includes("önceki") || txt.includes("sonraki"))) {
                            node.style.display = 'none';
                        }
                    }
                    // Shadow DOM Aşılaması
                    if (node.shadowRoot) {
                        if (!node.shadowRoot.querySelector('style[data-v11]')) {
                            const s = document.createElement('style');
                            s.textContent = styles;
                            s.setAttribute('data-v11', 'true');
                            node.shadowRoot.appendChild(s);
                        }
                        constrainElements(node.shadowRoot);
                    }
                }
            }

            const observer = new MutationObserver(() => constrainElements(document.body));
            observer.observe(document.body, { childList: true, subtree: true });
            
            window.addEventListener('resize', () => constrainElements(document.body));
            setTimeout(() => constrainElements(document.body), 500);
        })();
        <\/script>
        `;
    }

    async convert() {
        if (!this.htmlFile) return;

        this.showProgress(true);
        this.updateProgress(0, 'Dosya okunuyor...');
        this.log('process', '🚀 İşlem başlatıldı...');

        try {
            let content = await this.readFile(this.htmlFile);
            
            // 1. Kaynak Dosyaları Göm + HTML Olanları Anında Yamala
            this.updateProgress(30, 'Kaynak dosyalar işleniyor ve yamalanıyor...');
            content = await this.embedAndPatchResources(content);

            // 2. Halen Yamalanmamış Base64 Iframe Varsa (Yedek Plan)
            this.updateProgress(70, 'Son kontroller yapılıyor...');
            content = this.patchExistingIframes(content);

            this.convertedHTML = content;
            this.updateProgress(100, 'Tamamlandı!');
            this.log('success', '✅ Dönüştürme başarıyla tamamlandı!');
            this.showDownload(true);

        } catch (error) {
            console.error(error);
            this.log('error', `❌ Hata: ${error.message}`);
        }
    }

    async embedAndPatchResources(html) {
        let processed = html;
        
        for (const file of this.resourceFiles) {
            const fileName = file.name;
            let replacementData = "";

            // HTML Dosyaları için ÖZEL MUAMELE (Ön-Enjeksiyon)
            if (fileName.toLowerCase().endsWith('.html')) {
                try {
                    this.log('process', `🛠️ HTML Yamalanıyor: ${fileName}`);
                    // 1. Metin olarak oku
                    let textContent = await this.readFile(file);
                    
                    // 2. V10 Scriptini içine zerk et
                    const script = this.getInjectionScript();
                    if (textContent.includes('</body>')) {
                        textContent = textContent.replace('</body>', script + '</body>');
                    } else {
                        textContent += script;
                    }

                    // 3. Elle Base64'e çevir (UTF-8 destekli)
                    const b64 = this.b64EncodeUnicode(textContent);
                    replacementData = `data:text/html;base64,${b64}`;
                    
                } catch (e) {
                    this.log('error', `HTML işleme hatası (${fileName}): ${e.message}`);
                    // Hata olursa normal oku
                    replacementData = await this.readFileAsDataURL(file);
                }
            } else {
                // Diğer dosyalar (Resim, CSS, JS)
                replacementData = await this.readFileAsDataURL(file);
            }
            
            // Değiştirme işlemi
            // Regex: Dosya ismini tırnaklar içinde veya yolun sonunda arar
            const regex = new RegExp(`["'](?:[^"']*\\/)?${this.escapeRegExp(fileName)}["']`, 'g');
            
            // CSS/JS özel tag değişimi
            if (fileName.endsWith('.css')) {
                processed = processed.replace(
                    new RegExp(`<link[^>]*href=["'](?:[^"']*\\/)?${this.escapeRegExp(fileName)}["'][^>]*>`, 'g'),
                    `<style>/* ${fileName} */ @import url('${replacementData}');</style>`
                );
            } else if (fileName.endsWith('.js')) {
                processed = processed.replace(
                    new RegExp(`<script[^>]*src=["'](?:[^"']*\\/)?${this.escapeRegExp(fileName)}["'][^>]*>.*?<\/script>`, 'g'),
                    `<script src="${replacementData}"></script>`
                );
            } else {
                // HTML iframe src değişimi veya resim src değişimi
                processed = processed.replace(regex, `"${replacementData}"`);
            }
            
            this.log('info', `→ Gömüldü: ${fileName}`);
        }
        return processed;
    }

    // Bu fonksiyon sadece önceden gömülü iframe varsa çalışır (Fallback)
    patchExistingIframes(content) {
        // Regex'i gevşettik: data:text/html olmak zorunda değil, herhangi bir data:base64 olabilir.
        const pattern = /(src="data:[^;]*;base64,)([^"]+)"/g;
        let matchFound = false;
        const script = this.getInjectionScript();

        return content.replace(pattern, (match, prefix, b64Data) => {
            try {
                // Zaten yamalandıysa atla (Script kontrolü)
                let decoded = this.b64DecodeUnicode(b64Data);
                if (decoded.includes('V11: Universal Fix')) {
                    return match; 
                }

                matchFound = true;
                this.log('process', '⚠️ Önceden gömülü iframe bulundu, yamalanıyor...');
                
                if (decoded.includes('</body>')) {
                    decoded = decoded.replace('</body>', script + '</body>');
                } else {
                    decoded += script;
                }

                const reEncoded = this.b64EncodeUnicode(decoded);
                return `${prefix}${reEncoded}"`;
            } catch (e) {
                return match;
            }
        });
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    download() {
        if (!this.convertedHTML) return;
        const blob = new Blob([this.convertedHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const originalName = this.htmlFile.name.replace('.html', '');
        a.href = url;
        a.download = `${originalName}_Tek_Dosya_V11.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showProgress(show) {
        const s = document.getElementById('progressSection');
        if(s) s.style.display = show ? 'block' : 'none';
    }

    updateProgress(percent, text) {
        const fill = document.getElementById('progressFill');
        const txt = document.getElementById('progressText');
        if(fill) fill.style.width = percent + '%';
        if(txt) txt.textContent = text;
    }

    showDownload(show) {
        const s = document.getElementById('downloadSection');
        if(s) s.style.display = show ? 'block' : 'none';
    }

    log(type, message) {
        const content = document.getElementById('logContent');
        if (!content) return;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> ${message}`;
        content.appendChild(entry);
        content.scrollTop = content.scrollHeight;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NotebookLMConverter();
});