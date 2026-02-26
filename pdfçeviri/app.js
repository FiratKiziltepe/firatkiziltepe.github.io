(function () {
    'use strict';

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const FONT_URL_REGULAR = 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/full/ttf/NotoSans-Regular.ttf';
    const FONT_URL_BOLD = 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/full/ttf/NotoSans-Bold.ttf';
    let cachedFontRegular = null;
    let cachedFontBold = null;

    async function loadFonts() {
        if (cachedFontRegular && cachedFontBold) return;
        const [r, b] = await Promise.all([
            fetch(FONT_URL_REGULAR).then(r => r.arrayBuffer()),
            fetch(FONT_URL_BOLD).then(r => r.arrayBuffer())
        ]);
        cachedFontRegular = new Uint8Array(r);
        cachedFontBold = new Uint8Array(b);
    }

    const $ = (sel) => document.querySelector(sel);
    const apiKeyInput = $('#apiKey');
    const toggleApiKeyBtn = $('#toggleApiKey');
    const langSelect = $('#langDirection');
    const dropZone = $('#dropZone');
    const fileInput = $('#fileInput');
    const fileInfo = $('#fileInfo');
    const fileNameEl = $('#fileName');
    const fileSizeEl = $('#fileSize');
    const fileIconEl = $('#fileIcon');
    const removeFileBtn = $('#removeFile');
    const translateBtn = $('#translateBtn');
    const progressSection = $('#progressSection');
    const progressBar = $('#progressBar');
    const progressLabel = $('#progressLabel');
    const progressPercent = $('#progressPercent');
    const progressDetail = $('#progressDetail');
    const resultSection = $('#resultSection');
    const resultSummary = $('#resultSummary');
    const downloadBtn = $('#downloadBtn');
    const logSection = $('#logSection');
    const logContent = $('#logContent');

    const noteDetailSelect = $('#noteDetail');
    const noteLangSelect = $('#noteLang');
    const existingNotesSelect = $('#existingNotes');
    const notesEnabledCheck = $('#notesEnabled');
    const notesOptionsPanel = $('#notesOptionsPanel');
    const previewSection = $('#previewSection');
    const previewList = $('#previewList');
    const previewCount = $('#previewCount');
    const selectAllCheck = $('#selectAll');

    let currentFile = null;
    let translatedBlob = null;
    let translatedFileName = '';
    let previewItems = [];

    const FILE_ICONS = { pdf: '📕', pptx: '📙', docx: '📘', txt: '📄' };

    // --- API key persistence ---
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
        updateTranslateBtn();
    });

    toggleApiKeyBtn.addEventListener('click', () => {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    // --- Notes toggle ---
    notesEnabledCheck.addEventListener('change', () => {
        notesOptionsPanel.classList.toggle('hidden', !notesEnabledCheck.checked);
    });

    // --- File upload ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        previewSection.style.display = 'none';
        previewList.innerHTML = '';
        previewItems = [];
        dropZone.style.display = 'block';
        hideResults();
        updateTranslateBtn();
    });

    function handleFile(file) {
        const ext = getExtension(file.name);
        if (!['pdf', 'pptx', 'docx', 'txt'].includes(ext)) {
            alert('Desteklenmeyen dosya formatı. Lütfen PDF, PPTX, DOCX veya TXT yükleyin.');
            return;
        }
        currentFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatSize(file.size);
        fileIconEl.textContent = FILE_ICONS[ext] || '📄';
        fileInfo.style.display = 'block';
        dropZone.style.display = 'none';
        hideResults();
        updateTranslateBtn();
        loadPreview(file, ext);
    }

    // --- Preview / Page selection ---
    selectAllCheck.addEventListener('change', () => {
        const boxes = previewList.querySelectorAll('input[type="checkbox"]');
        boxes.forEach(cb => { cb.checked = selectAllCheck.checked; });
        updateSelectionCount();
    });

    function updateSelectionCount() {
        const boxes = previewList.querySelectorAll('input[type="checkbox"]');
        const checked = previewList.querySelectorAll('input[type="checkbox"]:checked').length;
        previewCount.textContent = `${checked} / ${boxes.length} seçili`;
        selectAllCheck.checked = checked === boxes.length;
        selectAllCheck.indeterminate = checked > 0 && checked < boxes.length;
    }

    function getSelectedIndices() {
        const boxes = previewList.querySelectorAll('input[type="checkbox"]');
        const indices = [];
        boxes.forEach((cb, i) => { if (cb.checked) indices.push(i); });
        return indices;
    }

    function renderPreviewItems(items, labelPrefix) {
        previewItems = items;
        previewList.innerHTML = '';
        items.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<input type="checkbox" checked data-idx="${i}">` +
                `<span class="preview-num">${labelPrefix} ${i + 1}</span>` +
                `<span class="preview-text">${escapeHtml(item.substring(0, 150)) || '(boş)'}</span>`;
            div.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const cb = div.querySelector('input');
                    cb.checked = !cb.checked;
                }
                updateSelectionCount();
            });
            previewList.appendChild(div);
        });
        selectAllCheck.checked = true;
        selectAllCheck.indeterminate = false;
        previewCount.textContent = `${items.length} / ${items.length} seçili`;
        previewSection.style.display = 'block';
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    async function loadPreview(file, ext) {
        previewList.innerHTML = '<div class="preview-loading">Dosya okunuyor...</div>';
        previewSection.style.display = 'block';

        try {
            const buf = await file.arrayBuffer();

            if (ext === 'pptx') {
                const zip = await JSZip.loadAsync(buf);
                const slides = Object.keys(zip.files)
                    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
                    .sort((a, b) => parseInt(a.match(/slide(\d+)/)[1]) - parseInt(b.match(/slide(\d+)/)[1]));
                const texts = [];
                for (const sf of slides) {
                    const xml = await zip.file(sf).async('string');
                    const doc = new DOMParser().parseFromString(xml, 'application/xml');
                    const t = Array.from(doc.querySelectorAll('t')).map(n => n.textContent).filter(s => s.trim()).join(' ');
                    texts.push(t);
                }
                renderPreviewItems(texts, 'Slayt');

            } else if (ext === 'pdf') {
                const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
                const texts = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    texts.push(content.items.map(it => it.str).join(' '));
                }
                renderPreviewItems(texts, 'Sayfa');

            } else if (ext === 'docx') {
                const zip = await JSZip.loadAsync(buf);
                const docFile = zip.file('word/document.xml');
                if (!docFile) { previewSection.style.display = 'none'; return; }
                const xml = await docFile.async('string');
                const doc = new DOMParser().parseFromString(xml, 'application/xml');
                const paras = [];
                doc.querySelectorAll('p').forEach(p => {
                    const t = Array.from(p.querySelectorAll('t')).map(n => n.textContent).join('');
                    if (t.trim()) paras.push(t);
                });
                renderPreviewItems(paras, 'Paragraf');

            } else if (ext === 'txt') {
                const text = await file.text();
                const paras = text.split(/\n\s*\n/).filter(p => p.trim());
                renderPreviewItems(paras, 'Paragraf');
            }
        } catch (e) {
            previewList.innerHTML = '<div class="preview-loading">Önizleme yüklenemedi.</div>';
        }
    }

    function getExtension(name) {
        return name.split('.').pop().toLowerCase();
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function updateTranslateBtn() {
        translateBtn.disabled = !(currentFile && apiKeyInput.value.trim());
    }

    function hideResults() {
        resultSection.style.display = 'none';
        progressSection.style.display = 'none';
        logSection.style.display = 'none';
        logContent.innerHTML = '';
        translatedBlob = null;
    }

    // --- Logging ---
    function log(msg, type = 'info') {
        logSection.style.display = 'block';
        const time = new Date().toLocaleTimeString('tr-TR');
        const cls = type === 'error' ? 'log-error' : type === 'success' ? 'log-success' : 'log-msg';
        logContent.innerHTML += `<div class="log-entry"><span class="log-time">${time}</span><span class="${cls}">${msg}</span></div>`;
        logContent.scrollTop = logContent.scrollHeight;
    }

    // --- Progress ---
    function showProgress(label, percent, detail) {
        progressSection.style.display = 'block';
        progressLabel.textContent = label;
        progressPercent.textContent = Math.round(percent) + '%';
        progressBar.style.width = percent + '%';
        if (detail !== undefined) progressDetail.textContent = detail;
    }

    // --- Gemini API ---
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    async function translateText(text, sourceLang, targetLang) {
        if (!text.trim()) return text;

        const apiKey = apiKeyInput.value.trim();
        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. ` +
            `Return ONLY the translated text, nothing else. Do not add explanations. ` +
            `Preserve any line breaks and formatting.\n\n${text}`;

        const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(`API Hatası (${resp.status}): ${err?.error?.message || 'Bilinmeyen hata'}`);
        }

        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    }

    async function translateBatch(texts, sourceLang, targetLang) {
        if (!texts.length) return [];
        const nonEmpty = texts.filter(t => t.trim());
        if (!nonEmpty.length) return texts;

        const combined = texts.map((t, i) => `[[[BLOCK_${i}]]]\n${t}`).join('\n');

        const apiKey = apiKeyInput.value.trim();
        const prompt = `Translate the following text blocks from ${sourceLang} to ${targetLang}. ` +
            `Each block starts with [[[BLOCK_N]]]. Keep these markers in your output. ` +
            `Return ONLY the translated text with markers, nothing else.\n\n${combined}`;

        const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
            })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(`API Hatası (${resp.status}): ${err?.error?.message || 'Bilinmeyen hata'}`);
        }

        const data = await resp.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const results = new Array(texts.length).fill('');
        const blocks = output.split(/\[\[\[BLOCK_(\d+)\]\]\]/);
        for (let i = 1; i < blocks.length; i += 2) {
            const idx = parseInt(blocks[i]);
            if (idx >= 0 && idx < texts.length) {
                results[idx] = blocks[i + 1]?.trim() || texts[idx];
            }
        }
        for (let i = 0; i < results.length; i++) {
            if (!results[i]) results[i] = texts[i];
        }
        return results;
    }

    function getLangs() {
        const dir = langSelect.value;
        return dir === 'en-tr'
            ? { source: 'English', target: 'Turkish', code: 'tr-TR' }
            : { source: 'Turkish', target: 'English', code: 'en-US' };
    }

    async function delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function escapeXml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function getNoteLang() {
        const { source, target } = getLangs();
        return noteLangSelect.value === 'source' ? source : target;
    }

    const DETAIL_PROMPTS = {
        short: 'Keep it to 2-3 sentences maximum. Be very concise.',
        medium: 'Keep it to 3-5 sentences. Cover the main points.',
        detailed: 'Write 5-8 sentences. Provide thorough explanations, examples, and context for each key point.'
    };

    async function generateNotes(content) {
        if (!content.trim()) return '';
        const lang = getNoteLang();
        const detail = noteDetailSelect.value || 'medium';
        const apiKey = apiKeyInput.value.trim();
        const prompt = `You are a presentation coach. Based on the following slide/page content, generate speaker notes in ${lang}. ` +
            `The notes should explain the key points and provide talking points for a presenter. ` +
            `${DETAIL_PROMPTS[detail]} Only return the notes text, nothing else.\n\n${content}`;

        const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: detail === 'detailed' ? 2048 : 1024 }
            })
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            log(`Not oluşturma hatası: ${err?.error?.message || resp.status}`, 'error');
            return '';
        }
        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    async function extractExistingNotes(zip, slideNum) {
        const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
        const file = zip.file(notesPath);
        if (!file) return '';
        const xml = await file.async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        const tNodes = doc.querySelectorAll('t');
        return Array.from(tNodes).map(n => n.textContent).filter(t => t.trim()).join('\n');
    }

    // --- PPTX Notes helpers ---
    function buildNotesSlideXml(notesText, langCode) {
        const paragraphs = notesText.split(/\n+/).filter(p => p.trim());
        const pElements = paragraphs.map(p =>
            `<a:p><a:r><a:rPr lang="${langCode}" dirty="0"/><a:t>${escapeXml(p)}</a:t></a:r></a:p>`
        ).join('');

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr/>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>
<p:txBody><a:bodyPr/><a:lstStyle/>${pElements}</p:txBody>
</p:sp>
</p:spTree></p:cSld></p:notes>`;
    }

    function buildNotesSlideRels(slideNum) {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNum}.xml"/>
</Relationships>`;
    }

    async function ensureSlideNotesRel(zip, slideNum) {
        const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        let relsXml = '';
        if (zip.file(relsPath)) {
            relsXml = await zip.file(relsPath).async('string');
            if (relsXml.includes('notesSlide')) return;
            const ids = (relsXml.match(/rId(\d+)/g) || []).map(r => parseInt(r.replace('rId', '')));
            const nextId = ids.length ? Math.max(...ids) + 1 : 1;
            const rel = `<Relationship Id="rId${nextId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${slideNum}.xml"/>`;
            relsXml = relsXml.replace('</Relationships>', rel + '</Relationships>');
        } else {
            relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${slideNum}.xml"/>
</Relationships>`;
        }
        zip.file(relsPath, relsXml);
    }

    async function ensureNotesContentType(zip, slideNum) {
        const ctPath = '[Content_Types].xml';
        let ctXml = await zip.file(ctPath).async('string');
        const partName = `/ppt/notesSlides/notesSlide${slideNum}.xml`;
        if (ctXml.includes(partName)) return;
        const override = `<Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`;
        ctXml = ctXml.replace('</Types>', override + '</Types>');
        zip.file(ctPath, ctXml);
    }

    // --- Main translate trigger ---
    translateBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        const ext = getExtension(currentFile.name);
        const { source, target } = getLangs();

        translateBtn.classList.add('processing');
        translateBtn.querySelector('.btn-text').textContent = 'Çevriliyor...';
        hideResults();
        logContent.innerHTML = '';

        try {
            log(`Dosya: ${currentFile.name} (${formatSize(currentFile.size)})`);
            log(`Çeviri yönü: ${source} → ${target}`);

            switch (ext) {
                case 'pptx': await handlePPTX(source, target); break;
                case 'docx': await handleDOCX(source, target); break;
                case 'pdf': await handlePDF(source, target); break;
                case 'txt': await handleTXT(source, target); break;
            }

            resultSection.style.display = 'block';
            log('Çeviri başarıyla tamamlandı!', 'success');
        } catch (err) {
            log(`Hata: ${err.message}`, 'error');
            alert('Çeviri sırasında hata oluştu: ' + err.message);
        } finally {
            translateBtn.classList.remove('processing');
            translateBtn.querySelector('.btn-text').textContent = 'Çeviriyi Başlat';
            progressSection.style.display = 'none';
        }
    });

    // --- Download ---
    downloadBtn.addEventListener('click', () => {
        if (!translatedBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(translatedBlob);
        a.download = translatedFileName;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // ========================
    // PPTX HANDLER
    // ========================
    async function handlePPTX(sourceLang, targetLang) {
        const { code: langCode } = getLangs();
        const wantNotes = notesEnabledCheck.checked;
        const selected = new Set(getSelectedIndices());

        log('PPTX dosyası açılıyor...');
        const arrayBuffer = await currentFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const slideFiles = Object.keys(zip.files)
            .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
            .sort((a, b) => parseInt(a.match(/slide(\d+)/)[1]) - parseInt(b.match(/slide(\d+)/)[1]));

        const selectedCount = selected.size || slideFiles.length;
        log(`${slideFiles.length} slayt bulundu, ${selectedCount} tanesi seçili.`);
        const totalSteps = selectedCount * (wantNotes ? 2 : 1);
        let stepsDone = 0;
        let totalTranslated = 0;
        const slideTranslatedTexts = [];

        for (let i = 0; i < slideFiles.length; i++) {
            if (selected.size && !selected.has(i)) {
                slideTranslatedTexts.push('');
                continue;
            }

            const slideFile = slideFiles[i];
            showProgress('Çevriliyor...', (stepsDone / totalSteps) * 100, `Slayt ${i + 1} / ${slideFiles.length} - Çeviri`);

            const xml = await zip.file(slideFile).async('string');
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'application/xml');

            const textNodes = doc.querySelectorAll('t');
            const texts = [];
            const nodes = [];
            textNodes.forEach(node => {
                if (node.textContent.trim()) { texts.push(node.textContent); nodes.push(node); }
            });

            if (texts.length > 0) {
                log(`Slayt ${i + 1}: ${texts.length} metin bloğu çevriliyor...`);
                if (texts.length <= 30 && texts.join('').length < 4000) {
                    const translated = await translateBatch(texts, sourceLang, targetLang);
                    translated.forEach((t, j) => { nodes[j].textContent = t; });
                    totalTranslated += texts.length;
                } else {
                    for (let j = 0; j < texts.length; j++) {
                        nodes[j].textContent = await translateText(texts[j], sourceLang, targetLang);
                        totalTranslated++;
                        if (j > 0 && j % 5 === 0) await delay(500);
                    }
                }
                const newXml = new XMLSerializer().serializeToString(doc);
                zip.file(slideFile, newXml);
                slideTranslatedTexts.push(Array.from(doc.querySelectorAll('t')).map(n => n.textContent).filter(t => t.trim()).join(' '));
            } else {
                log(`Slayt ${i + 1}: Metin bulunamadı, atlanıyor.`);
                slideTranslatedTexts.push('');
            }

            stepsDone++;
            showProgress('Çevriliyor...', (stepsDone / totalSteps) * 100, `Slayt ${i + 1} / ${slideFiles.length} - Çeviri`);
            await delay(300);
        }

        if (wantNotes) {
            const existingNotesMode = existingNotesSelect.value;
            log(`Konuşmacı notları oluşturuluyor... (${existingNotesMode === 'overwrite' ? 'Üzerine Yaz' : existingNotesMode === 'merge' ? 'Birleştir' : 'Koru'})`);

            for (let i = 0; i < slideFiles.length; i++) {
                if (selected.size && !selected.has(i)) continue;

                const slideNum = parseInt(slideFiles[i].match(/slide(\d+)/)[1]);
                const content = slideTranslatedTexts[i];
                showProgress('Notlar...', (stepsDone / totalSteps) * 100, `Slayt ${i + 1} / ${slideFiles.length} - Not`);

                if (!content.trim()) { stepsDone++; continue; }

                const existing = await extractExistingNotes(zip, slideNum);
                if (existing && existingNotesMode === 'keep') { log(`Slayt ${i + 1}: Mevcut not korunuyor.`); stepsDone++; continue; }

                const newNotes = await generateNotes(content);
                if (!newNotes) { stepsDone++; continue; }

                let finalNotes = newNotes;
                if (existing && existingNotesMode === 'merge') {
                    finalNotes = existing + '\n\n---\n\n' + newNotes;
                }

                zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`, buildNotesSlideXml(finalNotes, langCode));
                zip.file(`ppt/notesSlides/_rels/notesSlide${slideNum}.xml.rels`, buildNotesSlideRels(slideNum));
                await ensureSlideNotesRel(zip, slideNum);
                await ensureNotesContentType(zip, slideNum);

                log(`Slayt ${i + 1}: Not eklendi.`);
                stepsDone++;
                showProgress('Notlar...', (stepsDone / totalSteps) * 100, `Slayt ${i + 1} / ${slideFiles.length} - Not`);
                await delay(300);
            }
        }

        log('Yeni PPTX oluşturuluyor...');
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
        translatedBlob = blob;
        translatedFileName = currentFile.name.replace(/\.pptx$/i, '_translated.pptx');
        const noteInfo = wantNotes ? ' (notlar eklendi)' : '';
        resultSummary.textContent = `${selectedCount} slayt, ${totalTranslated} metin bloğu çevrildi${noteInfo}.`;
    }

    // ========================
    // DOCX HANDLER
    // ========================
    async function handleDOCX(sourceLang, targetLang) {
        const selected = new Set(getSelectedIndices());

        log('DOCX dosyası açılıyor...');
        const arrayBuffer = await currentFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) throw new Error('document.xml bulunamadı.');

        const xml = await docXmlFile.async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');

        const paragraphs = doc.querySelectorAll('p');
        const paraTexts = [];
        const paraTextNodes = [];

        paragraphs.forEach(p => {
            const tNodes = p.querySelectorAll('t');
            if (tNodes.length === 0) return;
            const fullText = Array.from(tNodes).map(t => t.textContent).join('');
            if (!fullText.trim()) return;
            paraTexts.push(fullText);
            paraTextNodes.push(Array.from(tNodes));
        });

        const selectedParas = selected.size ? paraTexts.filter((_, i) => selected.has(i)) : paraTexts;
        log(`${paraTexts.length} paragraf bulundu, ${selectedParas.length} tanesi seçili.`);
        showProgress('Çevriliyor...', 0, `0 / ${selectedParas.length} paragraf`);

        const BATCH_SIZE = 20;
        let translatedCount = 0;
        let globalIdx = 0;

        for (let i = 0; i < paraTexts.length; i += BATCH_SIZE) {
            const indices = [];
            const batch = [];
            const batchNodes = [];
            for (let j = i; j < Math.min(i + BATCH_SIZE, paraTexts.length); j++) {
                if (selected.size && !selected.has(j)) continue;
                indices.push(j);
                batch.push(paraTexts[j]);
                batchNodes.push(paraTextNodes[j]);
            }
            if (!batch.length) continue;

            let translated;
            if (batch.join('').length < 4000) {
                translated = await translateBatch(batch, sourceLang, targetLang);
            } else {
                translated = [];
                for (const text of batch) {
                    translated.push(await translateText(text, sourceLang, targetLang));
                    await delay(200);
                }
            }

            translated.forEach((t, j) => {
                const nodes = batchNodes[j];
                if (nodes.length === 1) {
                    nodes[0].textContent = t;
                } else {
                    nodes[0].textContent = t;
                    for (let k = 1; k < nodes.length; k++) nodes[k].textContent = '';
                }
            });

            translatedCount += batch.length;
            showProgress('Çevriliyor...', (translatedCount / selectedParas.length) * 100, `${translatedCount} / ${selectedParas.length} paragraf`);
            log(`${translatedCount} / ${selectedParas.length} paragraf çevrildi.`);
            await delay(300);
        }

        zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));

        log('Yeni DOCX oluşturuluyor...');
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        translatedBlob = blob;
        translatedFileName = currentFile.name.replace(/\.docx$/i, '_translated.docx');
        resultSummary.textContent = `${selectedParas.length} paragraf çevrildi.`;
    }

    // ========================
    // PDF HANDLER
    // ========================
    async function handlePDF(sourceLang, targetLang) {
        const wantNotes = notesEnabledCheck.checked;
        const selected = new Set(getSelectedIndices());

        log('PDF dosyası okunuyor...');
        const arrayBuffer = await currentFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        log(`${numPages} sayfa bulundu.`);

        const pageTexts = [];
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pageTexts.push(content.items.map(it => it.str).join(' '));
        }

        const selectedCount = selected.size || numPages;
        const totalSteps = selectedCount * (wantNotes ? 2 : 1);
        let stepsDone = 0;
        showProgress('Çevriliyor...', 0, `0 / ${numPages} sayfa`);

        const translatedPages = [];
        const pageNotes = [];

        for (let i = 0; i < pageTexts.length; i++) {
            if (selected.size && !selected.has(i)) {
                translatedPages.push(pageTexts[i]);
                pageNotes.push('');
                continue;
            }
            if (!pageTexts[i].trim()) { translatedPages.push(''); pageNotes.push(''); stepsDone++; continue; }

            translatedPages.push(await translateText(pageTexts[i], sourceLang, targetLang));
            stepsDone++;
            showProgress('Çevriliyor...', (stepsDone / totalSteps) * 100, `Sayfa ${i + 1} / ${numPages} - Çeviri`);
            log(`Sayfa ${i + 1} çevrildi.`);
            await delay(300);
        }

        if (wantNotes) {
            log('Konuşmacı notları oluşturuluyor...');
            for (let i = 0; i < translatedPages.length; i++) {
                if (selected.size && !selected.has(i)) continue;
                if (!translatedPages[i].trim()) { pageNotes.push(''); stepsDone++; continue; }

                showProgress('Notlar...', (stepsDone / totalSteps) * 100, `Sayfa ${i + 1} / ${numPages} - Not`);
                pageNotes[i] = await generateNotes(translatedPages[i]);
                stepsDone++;
                await delay(300);
            }
        } else {
            for (let i = 0; i < translatedPages.length; i++) {
                if (!pageNotes[i]) pageNotes[i] = '';
            }
        }

        log('Yeni PDF oluşturuluyor...');
        log('Fontlar yükleniyor...');
        await loadFonts();
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const font = await pdfDoc.embedFont(cachedFontRegular, { subset: true });
        const fontBold = await pdfDoc.embedFont(cachedFontBold, { subset: true });

        function wrapText(text, maxW, fnt, fSize) {
            const words = text.split(/\s+/);
            const lines = [];
            let cur = '';
            for (const w of words) {
                const test = cur ? cur + ' ' + w : w;
                if (fnt.widthOfTextAtSize(test, fSize) > maxW && cur) { lines.push(cur); cur = w; }
                else { cur = test; }
            }
            if (cur) lines.push(cur);
            return lines;
        }

        const noteLang = getNoteLang();
        const notesLabel = noteLang === 'Turkish' ? 'Konusmaci Notlari:' : 'Speaker Notes:';

        for (let i = 0; i < translatedPages.length; i++) {
            const page = pdfDoc.addPage([595.28, 841.89]);
            const text = translatedPages[i];
            const notes = pageNotes[i];
            const margin = 50;
            const maxWidth = page.getWidth() - margin * 2;
            let y = page.getHeight() - margin;

            if (text) {
                for (const line of wrapText(text, maxWidth, font, 11)) {
                    if (y < 200) break;
                    page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
                    y -= 15.4;
                }
            }

            if (notes) {
                y -= 20;
                if (y > 120) {
                    page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: page.getWidth() - margin, y: y + 10 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
                    page.drawText(notesLabel, { x: margin, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
                    y -= 14;
                    for (const line of wrapText(notes, maxWidth, font, 9)) {
                        if (y < 50) break;
                        page.drawText(line, { x: margin, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
                        y -= 12.6;
                    }
                }
            }

            const pn = `${i + 1}`;
            page.drawText(pn, { x: (page.getWidth() - font.widthOfTextAtSize(pn, 9)) / 2, y: 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
        }

        const pdfBytes = await pdfDoc.save();
        translatedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        translatedFileName = currentFile.name.replace(/\.pdf$/i, '_translated.pdf');
        const noteInfo = wantNotes ? ' (notlar eklendi)' : '';
        resultSummary.textContent = `${selectedCount} sayfa çevrildi${noteInfo}.`;
    }

    // ========================
    // TXT HANDLER
    // ========================
    async function handleTXT(sourceLang, targetLang) {
        const selected = new Set(getSelectedIndices());

        log('TXT dosyası okunuyor...');
        const text = await currentFile.text();
        if (!text.trim()) throw new Error('Dosya boş.');

        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        const selectedCount = selected.size || paragraphs.length;
        log(`${paragraphs.length} paragraf, ${selectedCount} seçili.`);
        showProgress('Çevriliyor...', 0, `0 / ${selectedCount} paragraf`);

        const translatedParagraphs = [];
        let done = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            if (selected.size && !selected.has(i)) {
                translatedParagraphs.push(paragraphs[i]);
                continue;
            }
            translatedParagraphs.push(await translateText(paragraphs[i], sourceLang, targetLang));
            done++;
            showProgress('Çevriliyor...', (done / selectedCount) * 100, `${done} / ${selectedCount} paragraf`);
            if (done < selectedCount) await delay(200);
        }

        translatedBlob = new Blob([translatedParagraphs.join('\n\n')], { type: 'text/plain;charset=utf-8' });
        translatedFileName = currentFile.name.replace(/\.txt$/i, '_translated.txt');
        resultSummary.textContent = `${selectedCount} paragraf çevrildi.`;
        log('Çeviri tamamlandı.', 'success');
    }
})();
