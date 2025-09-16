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
        this.setupMultiselect();
        document.getElementById('searchInput').addEventListener('input', () => this.debouncedSearch());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('exportPdf').addEventListener('click', () => this.exportToPdf());
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

            this.headers = Object.keys(jsonData[0]);
            this.data = jsonData.map((row, index) => ({ ...row, id: index }));

            this.setupFilters();
            this.filteredData = [...this.data];
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
        // Ders filtresi için benzersiz değerleri bul
        const dersColumn = this.findDersColumn();
        if (dersColumn) {
            const uniqueValues = [...new Set(this.data.map(row => row[dersColumn]).filter(val => val))];
            this.allOptions = uniqueValues.sort();
            this.populateMultiselect(this.allOptions);
        }
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
        const options = document.querySelectorAll('.multiselect-option');
        const term = searchTerm.toLowerCase();

        options.forEach(option => {
            const text = option.querySelector('.option-text').textContent.toLowerCase();
            if (text.includes(term)) {
                option.classList.remove('hidden');
            } else {
                option.classList.add('hidden');
            }
        });

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
        
        if (this.selectedValues.size === 0) {
            tagsContainer.innerHTML = '<span class="placeholder-text">Ders seçin veya arayın...</span>';
        } else {
            Array.from(this.selectedValues).forEach(value => {
                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.innerHTML = `
                    <span class="tag-text">${value}</span>
                    <button class="tag-remove" onclick="tableManager.removeTag('${value}')">&times;</button>
                `;
                tagsContainer.appendChild(tag);
            });
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

    renderTable() {
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        // Performance optimization - sadece değişiklik varsa başlıkları yeniden oluştur
        if (thead.children.length === 0) {
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

        // Sıralama durumunu güncelle
        thead.querySelectorAll('th').forEach((th, index) => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (this.sortColumn === this.headers[index]) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });

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

    async exportToPdf() {
        if (this.filteredData.length === 0) {
            alert('PDF olarak dışa aktarılacak veri yok.');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');

            // PDF başlığı
            doc.setFontSize(16);
            doc.text('E-İçerik Tablo Raporu', 20, 20);
            
            // Tarih
            doc.setFontSize(10);
            doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
            doc.text(`Kayıt Sayısı: ${this.filteredData.length}`, 20, 35);

            // Tablo verilerini hazırla
            const tableData = this.filteredData.map(row => 
                this.headers.map(header => row[header] || '')
            );

            // Tablo oluştur
            doc.autoTable({
                head: [this.headers],
                body: tableData,
                startY: 45,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [102, 126, 234],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    // Sütun genişliklerini otomatik ayarla
                },
                margin: { top: 45 },
                didDrawPage: function (data) {
                    // Sayfa numarası
                    doc.setFontSize(8);
                    doc.text(`Sayfa ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });

            // PDF'i indir
            const fileName = `e-icerik-tablo-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            alert('PDF oluşturulurken bir hata oluştu.');
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
