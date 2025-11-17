class NotebookLMConverter {
    constructor() {
        this.htmlFile = null;
        this.resourceFiles = [];
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
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

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

    // Türkçe Karakter Dostu Base64 Kodlama/Çözme Fonksiyonları
    b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    }

    async convert() {
        if (!this.htmlFile) return;

        this.showProgress(true);
        this.updateProgress(0, 'Dosya okunuyor...');
        this.log('process', 'Dönüştürme başlatıldı...');

        try {
            let content = await this.readFile(this.htmlFile);
            
            // 1. Kaynak Dosyaları Göm (Klasik İşlem)
            this.updateProgress(20, 'Kaynak dosyalar gömülüyor...');
            content = await this.embedResources(content);

            // 2. NOTEBOOKLM YAMASI (V10 Universal Constraint)
            this.updateProgress(60, 'NotebookLM V10 Yaması Uygulanıyor...');
            content = this.applyNotebookFixes(content);

            this.convertedHTML = content;
            this.updateProgress(100, 'Tamamlandı!');
            this.log('success', 'Dönüştürme ve yamalama başarıyla tamamlandı!');
            this.showDownload(true);

        } catch (error) {
            console.error(error);
            this.log('error', `Hata: ${error.message}`);
        }
    }

    // Python'daki V10 Logic'in JS Versiyonu
    applyNotebookFixes(content) {
        // Iframe Base64 pattern'i
        const pattern = /(src="data:text\/html;base64,)([^"]+)"/g;
        let matchFound = false;

        // V10 Final Payload (JS + CSS)
        const injectionScript = `
        <script>
        (function() {
            console.log("🌍 V10: Universal Constraint (Web) Aktif");

            const styles = \`
                /* HER ŞEYE UYGULANACAK KURAL */
                * {
                    max-width: 100vw !important;
                    box-sizing: border-box !important;
                }

                /* Scrollbar'ı çizimden kaldır */
                ::-webkit-scrollbar {
                    width: 0px !important;
                    height: 0px !important;
                    background: transparent !important;
                    display: none !important;
                }
                
                ::-webkit-scrollbar-track { background: transparent !important; }
                ::-webkit-scrollbar-thumb { background: transparent !important; display: none !important; }

                /* Firefox vb. için */
                html, body {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                    overflow-x: hidden !important;
                    width: 100% !important;
                    position: relative !important;
                }

                /* İçerik genişliği */
                .main-content, main, mat-card {
                    width: 100% !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                }
                
                /* BUTON GİZLEME (Cerrah Modu) */
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

                    // Taşma Kontrolü
                    if (node.scrollWidth > window.innerWidth) {
                        node.style.setProperty('max-width', '100%', 'important');
                        node.style.setProperty('overflow-x', 'hidden', 'important');
                    }

                    // Shadow DOM
                    if (node.shadowRoot) {
                        if (!node.shadowRoot.querySelector('style[data-v10]')) {
                            const s = document.createElement('style');
                            s.textContent = styles;
                            s.setAttribute('data-v10', 'true');
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

        // Replace işlemi
        const fixedContent = content.replace(pattern, (match, prefix, b64Data) => {
            try {
                matchFound = true;
                // 1. Kod Çöz (UTF-8 destekli)
                let decodedHtml = this.b64DecodeUnicode(b64Data);
                
                this.log('process', 'Base64 Iframe bulundu ve şifresi çözüldü.');

                // 2. Enjekte Et
                if (decodedHtml.includes('<html')) {
                    decodedHtml = decodedHtml.replace(/(<html[^>]*>)/, '$1' + injectionScript);
                } else {
                    decodedHtml = injectionScript + decodedHtml;
                }

                // 3. Tekrar Şifrele (UTF-8 destekli)
                const reEncoded = this.b64EncodeUnicode(decodedHtml);
                
                this.log('success', 'V10 yaması iframe içine başarıyla gömüldü.');
                return `${prefix}${reEncoded}"`;

            } catch (e) {
                this.log('error', 'Base64 işleme hatası: ' + e.message);
                return match; // Hata olursa orijinali döndür
            }
        });

        if (!matchFound) {
            this.log('warning', 'Uyarı: Base64 iframe yapısı bulunamadı. Dosya formatı farklı olabilir.');
        }

        return fixedContent;
    }

    async embedResources(html) {
        // Burası standart dosya gömme işlemleri (resim, css vs.)
        // Sizin önceki kodunuzdaki logic benzeri çalışır ama basitleştirilmiş hali:
        let processed = html;
        
        for (const file of this.resourceFiles) {
            const fileName = file.name;
            const dataUrl = await this.readFileAsDataURL(file);
            
            // Link/Script değişimleri
            if (fileName.endsWith('.css')) {
                processed = processed.replace(
                    new RegExp(`<link[^>]*href=["'](?:[^"']*\/)?${this.escapeRegExp(fileName)}["'][^>]*>`, 'g'),
                    `<style>/* Injected: ${fileName} */ @import url('${dataUrl}');</style>`
                );
            } else if (fileName.endsWith('.js')) {
                processed = processed.replace(
                    new RegExp(`<script[^>]*src=["'](?:[^"']*\/)?${this.escapeRegExp(fileName)}["'][^>]*>.*?<\/script>`, 'g'),
                    `<script src="${dataUrl}"></script>`
                );
            } else {
                // Resimler vb.
                processed = processed.replace(
                    new RegExp(`["'](?:[^"']*\/)?${this.escapeRegExp(fileName)}["']`, 'g'),
                    `"${dataUrl}"`
                );
            }
            this.log('info', `Gömüldü: ${fileName}`);
        }
        return processed;
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
        a.download = `${originalName}_Tek_Dosya_V10.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showProgress(show) {
        const section = document.getElementById('progressSection');
        if(section) section.style.display = show ? 'block' : 'none';
    }

    updateProgress(percent, text) {
        const fill = document.getElementById('progressFill');
        const txt = document.getElementById('progressText');
        if(fill) fill.style.width = percent + '%';
        if(txt) txt.textContent = text;
    }

    showDownload(show) {
        const section = document.getElementById('downloadSection');
        if(section) section.style.display = show ? 'block' : 'none';
    }

    log(type, message) {
        const content = document.getElementById('logContent');
        if (!content) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        
        content.appendChild(entry);
        content.scrollTop = content.scrollHeight;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new NotebookLMConverter();
});