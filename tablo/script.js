class TableManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.headers = [];
        this.currentPage = 1;
        this.pageSize = 25;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTimeout = null;
        this.selectedValues = new Set();
        this.allOptions = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        document.getElementById('searchInput').addEventListener('input', () => this.debouncedSearch());
        document.getElementById('programTuru').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('exportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('pageSize').addEventListener('change', (e) => this.changePageSize(e));
    }

    async loadData() {
        this.updateStatus('Veriler yükleniyor...', 'loading');
        
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Veri dosyası bulunamadı');
            }
            
            const jsonData = await response.json();
            
            if (!Array.isArray(jsonData) || jsonData.length === 0) {
                throw new Error('Veri formatı geçersiz');
            }

            this.headers = Object.keys(jsonData[0]).filter(header => 
                !header.toLowerCase().includes('işlem') && 
                !header.toLowerCase().includes('action')
            );
            this.data = jsonData.map((row, index) => ({ ...row, id: index }));

            // Veri yüklendikten sonra filtreleri kur
            this.setupFilters();
            this.setupMultiselect();
            
            this.filteredData = [...this.data];
            this.renderTableHeader();
            this.renderTable();
            this.renderPagination();
            this.updateResultCount();
            this.showSections(true);
            
            this.updateStatus(`${this.data.length} kayıt yüklendi`, 'loaded');

        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.updateStatus('Veri yüklenemedi', 'error');
        }
    }

    updateStatus(message, type = '') {
        const statusElement = document.getElementById('dataStatus');
        const span = statusElement.querySelector('span');
        span.textContent = message;
        
        statusElement.className = 'data-status';
        if (type) {
            statusElement.classList.add(type);
        }
    }

    debouncedSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300); // 300ms gecikme ile arama
    }

    // Excel upload özelliği kaldırıldı - veriler JSON'dan otomatik yükleniyor

    setupFilters() {
        // Sabit ders listesi - alfabetik ve sınıf düzeyine göre sıralı
        this.allOptions = [
            'Arapça 2',
            'Arapça 5',
            'Arapça 9',
            'Biyoloji 9',
            'Biyoloji 10',
            'Biyoloji 11',
            'Biyoloji 12',
            'Coğrafya 9',
            'Coğrafya 10',
            'Coğrafya 11',
            'Coğrafya 12',
            'Çağdaş Türk ve Dünya Tarihi',
            'Din Kültürü ve Ahlak Bilgisi 4',
            'Din Kültürü ve Ahlak Bilgisi 5',
            'Din Kültürü ve Ahlak Bilgisi 6',
            'Din Kültürü ve Ahlak Bilgisi 7',
            'Din Kültürü ve Ahlak Bilgisi 8',
            'Din Kültürü ve Ahlak Bilgisi 9',
            'Din Kültürü ve Ahlak Bilgisi 10',
            'Din Kültürü ve Ahlak Bilgisi 11',
            'Din Kültürü ve Ahlak Bilgisi 12',
            'Felsefe 10',
            'Felsefe 11',
            'Fen Bilimleri 3',
            'Fen Bilimleri 4',
            'Fen Bilimleri 5',
            'Fen Bilimleri 6',
            'Fen Bilimleri 7',
            'Fen Bilimleri 8',
            'Fen Lisesi Biyoloji 11',
            'Fen Lisesi Biyoloji 12',
            'Fen Lisesi Fizik 11',
            'Fen Lisesi Fizik 12',
            'Fen Lisesi Kimya 11',
            'Fen Lisesi Kimya 12',
            'Fen Lisesi Matematik 11',
            'Fen Lisesi Matematik 12',
            'Fıkıh 10',
            'Fizik 9',
            'Fizik 10',
            'Fizik 11',
            'Fizik 12',
            'Hadis 10',
            'Hayat Bilgisi 1',
            'Hayat Bilgisi 2',
            'Hayat Bilgisi 3',
            'Hazırlık Sınıfı',
            'İngilizce 2',
            'İngilizce 3',
            'İngilizce 4',
            'İngilizce 5',
            'İngilizce 6',
            'İngilizce 7',
            'İngilizce 8',
            'İngilizce 9 (Normal Lise)',
            'İngilizce 10',
            'İngilizce 11',
            'İngilizce 12',
            'İnsan Hakları, Vatandaşlık ve Demokrasi 4',
            'İnsan Hakları, Yurttaşlık ve Demokrasi 4',
            'Kimya 9',
            'Kimya 10',
            'Kimya 11',
            'Kimya 12',
            'Kur\'an-ı Kerim 5',
            'Kur\'an-ı Kerim 6',
            'Kur\'an-ı Kerim 7',
            'Kur\'an-ı Kerim 8',
            'Kur\'an-ı Kerim 9',
            'Kur\'an-ı Kerim 10',
            'Kur\'an-ı Kerim 11',
            'Kur\'an-ı Kerim 12',
            'Matematik hazırlık',
            'Matematik 1',
            'Matematik 2',
            'Matematik 3',
            'Matematik 4',
            'Matematik 5',
            'Matematik 6',
            'Matematik 7',
            'Matematik 8',
            'Matematik 9',
            'Matematik 10',
            'Matematik 11',
            'Matematik 12',
            'Müzik 1',
            'Müzik 2',
            'Müzik 3',
            'Müzik 4',
            'Müzik 5',
            'Müzik 6',
            'Müzik 7',
            'Müzik 8',
            'Peygamberimizin Hayatı 5',
            'Peygamberimizin Hayatı 6',
            'Peygamberimizin Hayatı 7',
            'Peygamberimizin Hayatı 8',
            'Peygamberimizin Hayatı 9',
            'Peygamberimizin Hayatı 10',
            'Peygamberimizin Hayatı 11',
            'Peygamberimizin Hayatı 12',
            'Psikoloji 11',
            'Sağlık Bilgisi ve Trafik Kültürü 9',
            'Siyer 10',
            'Sosyal Bilgiler 4',
            'Sosyal Bilgiler 5',
            'Sosyal Bilgiler 6',
            'Sosyal Bilgiler 7',
            'T.C. İnkılap Tarihi ve Atatürkçülük 8',
            'T.C. İnkılap Tarihi ve Atatürkçülük 12',
            'Tarih 9',
            'Tarih 10',
            'Tarih 11',
            'Temel Dini Bilgiler (İslam 1) 5, 6, 7, 8. Sınıflar',
            'Temel Dini Bilgiler (İslam 1) Ortaöğretim Seviyesindeki Tüm Sınıflar',
            'Temel Dini Bilgiler (İslam 2) 5, 6, 7, 8. Sınıflar',
            'Temel Dini Bilgiler (İslam 2) Ortaöğretim Seviyesindeki Tüm Sınıflar',
            'Temel Dinî Bilgiler 9',
            'Temel Düzey Matematik 11',
            'Temel Düzey Matematik 12',
            'Trafik Güvenliği 4',
            'Türk Dili ve Edebiyatı Hazırlık',
            'Türk Dili ve Edebiyatı 9',
            'Türk Dili ve Edebiyatı 10',
            'Türk Dili ve Edebiyatı 11',
            'Türk Dili ve Edebiyatı 12',
            'Türkçe 1',
            'Türkçe 2',
            'Türkçe 3',
            'Türkçe 4',
            'Türkçe 5',
            'Türkçe 6',
            'Türkçe 7',
            'Türkçe 8'
        ];
        
        this.populateMultiselect(this.allOptions);
    }

    findDersColumn() {
        // "DERS" içeren sütunu bul
        return this.headers.find(header => 
            header && header.toString().toUpperCase().includes('DERS')
        );
    }

    setupMultiselect() {
        const input = document.getElementById('dersFilter');
        const container = input.closest('.multiselect-container');
        const inputContainer = container.querySelector('.multiselect-input-container');
        const dropdown = document.getElementById('dersDropdown');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');

        // Input events
        input.addEventListener('input', (e) => this.filterMultiselectOptions(e.target.value));
        input.addEventListener('focus', () => this.showMultiselectDropdown());
        
        // Container click
        inputContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                return; // Tag remove butonları için ayrı işlem
            }
            if (container.classList.contains('open')) {
                this.hideMultiselectDropdown();
            } else {
                this.showMultiselectDropdown();
                input.focus();
            }
        });

        // Options container events
        const optionsContainer = document.getElementById('multiselectOptions');
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.multiselect-option');
            if (option) {
                this.toggleMultiselectOption(option);
            }
        });

        // Control buttons
        selectAllBtn.addEventListener('click', () => this.selectAllOptions());
        clearAllBtn.addEventListener('click', () => this.clearAllOptions());

        // Escape key and outside click
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideMultiselectDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.hideMultiselectDropdown();
            }
        });
    }

    populateMultiselect(options) {
        const optionsContainer = document.getElementById('multiselectOptions');
        optionsContainer.innerHTML = '';
        
        // Tüm seçenekleri göster
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'multiselect-option';
            optionElement.setAttribute('data-value', option);
            
            optionElement.innerHTML = `
                <div class="option-checkbox"></div>
                <span class="option-text">${option}</span>
            `;
            
            optionsContainer.appendChild(optionElement);
        });
    }

    showMultiselectDropdown() {
        const container = document.querySelector('.multiselect-container');
        container.classList.add('open');
    }

    hideMultiselectDropdown() {
        const container = document.querySelector('.multiselect-container');
        container.classList.remove('open');
    }

    filterMultiselectOptions(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const optionsContainer = document.getElementById('multiselectOptions');
        
        if (!term) {
            // Arama terimi yoksa ilk 10 seçeneği göster
            this.populateMultiselect(this.allOptions);
        } else {
            // Arama terimine göre filtrele ve tüm eşleşenleri göster
            const filteredOptions = this.allOptions.filter(option => 
                option.toLowerCase().includes(term)
            );
            
            optionsContainer.innerHTML = '';
            
            filteredOptions.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'multiselect-option';
                optionElement.setAttribute('data-value', option);
                
                // Seçili olanları işaretle
                if (this.selectedValues.has(option)) {
                    optionElement.classList.add('selected');
                }
                
                optionElement.innerHTML = `
                    <div class="option-checkbox"></div>
                    <span class="option-text">${option}</span>
                `;
                
                optionsContainer.appendChild(optionElement);
            });
            
            if (filteredOptions.length === 0) {
                const noResultElement = document.createElement('div');
                noResultElement.className = 'multiselect-no-result';
                noResultElement.innerHTML = '<span>Sonuç bulunamadı</span>';
                optionsContainer.appendChild(noResultElement);
            }
        }
        
        this.showMultiselectDropdown();
    }

    toggleMultiselectOption(option) {
        const value = option.getAttribute('data-value');
        
        if (this.selectedValues.has(value)) {
            this.selectedValues.delete(value);
            option.classList.remove('selected');
        } else {
            this.selectedValues.add(value);
            option.classList.add('selected');
        }
        
        this.updateSelectedTags();
        this.applyFilters();
    }

    selectAllOptions() {
        const visibleOptions = document.querySelectorAll('.multiselect-option:not(.hidden)');
        
        visibleOptions.forEach(option => {
            const value = option.getAttribute('data-value');
            this.selectedValues.add(value);
            option.classList.add('selected');
        });
        
        this.updateSelectedTags();
        this.applyFilters();
    }

    clearAllOptions() {
        this.selectedValues.clear();
        
        document.querySelectorAll('.multiselect-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        this.updateSelectedTags();
        this.applyFilters();
    }

    updateSelectedTags() {
        const tagsContainer = document.getElementById('selectedTags');
        const input = document.getElementById('dersFilter');
        
        tagsContainer.innerHTML = '';
        
        if (this.selectedValues.size > 0) {
            Array.from(this.selectedValues).slice(0, 3).forEach(value => {
                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.innerHTML = `
                    <span class="tag-text">${value}</span>
                    <button class="tag-remove" onclick="tableManager.removeTag('${value}')">&times;</button>
                `;
                tagsContainer.appendChild(tag);
            });
            
            if (this.selectedValues.size > 3) {
                const moreTag = document.createElement('div');
                moreTag.className = 'tag more-tag';
                moreTag.innerHTML = `<span class="tag-text">+${this.selectedValues.size - 3} daha</span>`;
                tagsContainer.appendChild(moreTag);
            }
        }
        
        // Input değerini temizle
        input.value = '';
    }

    removeTag(value) {
        this.selectedValues.delete(value);
        
        // Option'ı unselect yap
        const option = document.querySelector(`.multiselect-option[data-value="${value}"]`);
        if (option) {
            option.classList.remove('selected');
        }
        
        this.updateSelectedTags();
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const programTuru = document.getElementById('programTuru').value;

        // Tablo başlığını yeniden oluştur (Program Türü sütunu görünürlüğü için)
        this.renderTableHeader();

        // Performans için önbellek oluştur
        const startTime = performance.now();

        this.filteredData = this.data.filter(row => {
            // Ders filtresi - çoklu seçim kontrolü
            const dersColumn = this.findDersColumn();
            if (this.selectedValues.size > 0 && dersColumn) {
                if (!this.selectedValues.has(row[dersColumn])) {
                    return false;
                }
            }

            // Program türü filtresi
            if (programTuru) {
                const programTuruValue = (row['Program Türü'] || '').toString().trim();
                if (programTuru === 'TYMM') {
                    // TYMM seçiliyse sadece TYMM olanları göster
                    if (programTuruValue !== 'TYMM') {
                        return false;
                    }
                } else if (programTuru === 'Diğer') {
                    // Diğer seçiliyse sadece Program Türü'nde "Diğer" yazanları göster
                    if (programTuruValue !== 'Diğer') {
                        return false;
                    }
                }
            }

            // Arama filtresi - optimized search
            if (searchTerm) {
                // Önce sık kullanılan alanlarda ara
                const quickFields = [row[dersColumn], row['KAZANIM ÖĞRENME ÇIKTISIBİLGİ'], row['AÇIKLAMA']];
                const quickMatch = quickFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchTerm)
                );
                
                if (quickMatch) return true;
                
                // Tam arama (gerekirse)
                const allText = Object.values(row).join(' ').toLowerCase();
                return allText.includes(searchTerm);
            }

            return true;
        });

        // Performance logging
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            console.log(`Filtreleme ${Math.round(endTime - startTime)}ms sürdü`);
        }

        // Sıralama uygula
        this.applySorting();
        
        // İlk sayfaya dön
        this.currentPage = 1;
        
        this.renderTable();
        this.renderPagination();
        this.updateResultCount();
    }

    clearFilters() {
        const dersInput = document.getElementById('dersFilter');
        dersInput.value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('programTuru').value = '';
        
        // Multiselect seçimlerini temizle
        this.clearAllOptions();
        
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.applySorting();
        this.renderTable();
        this.renderPagination();
        this.updateResultCount();
    }

    renderTableHeader() {
        const thead = document.getElementById('tableHead');
        
        // Başlığı temizle ve yeniden oluştur
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        const dersColumn = this.findDersColumn();
        
        this.headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            
            // Sadece ders sütununda sıralama
            if (header === dersColumn) {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.handleSort(header));
            }
            
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
    }

    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        // Sıralama durumunu güncelle
        this.updateSortingUI();

        // Sayfalama için veriyi hazırla
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // DOM manipulation optimization
        const fragment = document.createDocumentFragment();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            this.headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header] || '';
                
                // Arama terimi varsa highlight yap
                if (searchTerm && value.toString().toLowerCase().includes(searchTerm)) {
                    td.innerHTML = this.highlightText(value.toString(), searchTerm);
                } else {
                    td.textContent = value;
                }
                
                tr.appendChild(td);
            });
            fragment.appendChild(tr);
        });

        // Tek seferde DOM'a ekle
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }

    updateSortingUI() {
        const thead = document.getElementById('tableHead');
        
        thead.querySelectorAll('th').forEach((th, index) => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (this.sortColumn === this.headers[index]) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    updateResultCount() {
        const resultCount = document.getElementById('resultCount');
        const total = this.data.length;
        const filtered = this.filteredData.length;
        
        if (filtered === total) {
            resultCount.textContent = `Toplam ${total} kayıt gösteriliyor`;
        } else {
            resultCount.textContent = `${filtered} / ${total} kayıt gösteriliyor`;
        }
    }


    exportToExcel() {
        if (this.filteredData.length === 0) {
            alert('Excel olarak dışa aktarılacak veri yok.');
            return;
        }

        try {
            // Worksheet verileri hazırla
            const wsData = [];
            
            // Header satırını ekle
            wsData.push(this.headers);
            
            // Data satırlarını ekle
            this.filteredData.forEach(row => {
                const rowData = this.headers.map(header => row[header] || '');
                wsData.push(rowData);
            });

            // Worksheet oluştur
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Sütun genişliklerini ayarla
            const colWidths = this.headers.map((header, index) => {
                const maxLength = Math.max(
                    header.length,
                    ...this.filteredData.map(row => 
                        String(row[header] || '').length
                    ).slice(0, 100) // Performans için ilk 100 satırı kontrol et
                );
                return { wch: Math.min(Math.max(maxLength, 10), 50) };
            });
            ws['!cols'] = colWidths;

            // Workbook oluştur
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'E-İçerik Tablosu');

            // Header styling
            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            // Header hücrelerine stil uygula
            this.headers.forEach((header, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
                if (ws[cellRef]) {
                    ws[cellRef].s = headerStyle;
                }
            });

            // Dosya adı oluştur
            const fileName = `e-icerik-tablo-${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Excel dosyasını indir
            XLSX.writeFile(wb, fileName);
            
            console.log(`Excel dosyası indirildi: ${fileName}`);

        } catch (error) {
            console.error('Excel oluşturma hatası:', error);
            alert('Excel dosyası oluşturulurken bir hata oluştu.');
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.applySorting();
        this.currentPage = 1; // İlk sayfaya dön
        this.renderTable();
        this.renderPagination();
    }

    applySorting() {
        if (!this.sortColumn) return;

        this.filteredData.sort((a, b) => {
            let aVal = a[this.sortColumn] || '';
            let bVal = b[this.sortColumn] || '';

            // Sayısal değerleri kontrol et
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return this.sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // String karşılaştırması
            aVal = aVal.toString().toLowerCase();
            bVal = bVal.toString().toLowerCase();

            if (this.sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }

    changePageSize(event) {
        this.pageSize = parseInt(event.target.value);
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationButtons = document.getElementById('paginationButtons');

        // Sayfalama bilgisi
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, this.filteredData.length);
        paginationInfo.textContent = `${startItem}-${endItem} / ${this.filteredData.length} kayıt gösteriliyor`;

        // Sayfalama butonları
        paginationButtons.innerHTML = '';

        if (totalPages <= 1) return;

        // İlk sayfa butonu
        const firstBtn = this.createPageButton('««', 1, this.currentPage === 1);
        paginationButtons.appendChild(firstBtn);

        // Önceki sayfa butonu
        const prevBtn = this.createPageButton('‹', this.currentPage - 1, this.currentPage === 1);
        paginationButtons.appendChild(prevBtn);

        // Sayfa numaraları
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i.toString(), i, false, i === this.currentPage);
            paginationButtons.appendChild(pageBtn);
        }

        // Sonraki sayfa butonu
        const nextBtn = this.createPageButton('›', this.currentPage + 1, this.currentPage === totalPages);
        paginationButtons.appendChild(nextBtn);

        // Son sayfa butonu
        const lastBtn = this.createPageButton('»»', totalPages, this.currentPage === totalPages);
        paginationButtons.appendChild(lastBtn);
    }

    createPageButton(text, page, disabled = false, active = false) {
        const button = document.createElement('button');
        button.className = 'page-btn';
        button.textContent = text;
        button.disabled = disabled;
        
        if (active) {
            button.classList.add('active');
        }
        
        if (!disabled) {
            button.addEventListener('click', () => this.goToPage(page));
        }
        
        return button;
    }

    highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showSections(show) {
        const sections = ['filterSection', 'tableContainer', 'resultsInfo', 'paginationContainer'];
        sections.forEach(id => {
            document.getElementById(id).style.display = show ? 'block' : 'none';
        });
    }
}

// Global değişken (tag remove fonksiyonu için)
let tableManager;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
