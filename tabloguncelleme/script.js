/**
 * E-İçerik Tablo Yönetim Sistemi
 * Supabase entegrasyonlu versiyon
 */

class TableManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.headers = ['sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu'];
        this.headerLabels = {
            'sira_no': 'SIRA NO',
            'ders_adi': 'DERS ADI',
            'unite_tema': 'ÜNİTE/TEMA/ÖĞRENME ALANI',
            'kazanim': 'KAZANIM/ÖĞRENME ÇIKTISI',
            'e_icerik_turu': 'E-İÇERİK TÜRÜ',
            'aciklama': 'AÇIKLAMA',
            'program_turu': 'Program Türü'
        };
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalCount = 0;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTimeout = null;
        this.selectedValues = new Set();
        this.allOptions = [];
        this.pendingChanges = new Map(); // e_icerik_id -> array of changes
        this.useSupabase = false; // Supabase aktif mi?
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkSupabaseConnection();
        await this.loadData();
    }

    /**
     * Supabase bağlantısını kontrol et
     */
    async checkSupabaseConnection() {
        try {
            // Supabase konfigürasyonu kontrol et
            if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
                console.log('Supabase yapılandırılmamış, JSON modunda çalışılıyor');
                this.useSupabase = false;
                return;
            }
            
            initSupabase();
            const sb = getSupabase();
            
            // Basit bir sorgu ile bağlantıyı test et
            const { error } = await sb.from('e_icerikler').select('id').limit(1);
            
            if (error) {
                console.warn('Supabase bağlantı hatası, JSON moduna geçiliyor:', error.message);
                this.useSupabase = false;
            } else {
                console.log('Supabase bağlantısı başarılı');
                this.useSupabase = true;
            }
        } catch (e) {
            console.warn('Supabase kullanılamıyor, JSON moduna geçiliyor:', e.message);
            this.useSupabase = false;
        }
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
            if (this.useSupabase) {
                await this.loadFromSupabase();
            } else {
                await this.loadFromJSON();
            }

            this.setupFilters();
            this.setupMultiselect();
            this.renderTableHeader();
            this.renderTable();
            this.renderPagination();
            this.updateResultCount();
            this.showSections(true);
            
            // Yeni satır ekleme butonu (editor ve üstü için)
            this.renderAddRowButton();
            
            this.updateStatus(`${this.totalCount} kayıt yüklendi`, 'loaded');

        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.updateStatus('Veri yüklenemedi: ' + error.message, 'error');
        }
    }

    /**
     * Supabase'den veri yükle
     */
    async loadFromSupabase() {
        const options = {
            page: this.currentPage,
            pageSize: this.pageSize,
            dersAdi: this.selectedValues.size > 0 ? Array.from(this.selectedValues) : null,
            searchTerm: document.getElementById('searchInput')?.value?.trim() || null,
            programTuru: document.getElementById('programTuru')?.value || null
        };

        const { data, count } = await fetchEIcerikler(options);
        
        this.filteredData = data || [];
        this.totalCount = count || 0;
        
        // Tüm ders adlarını yükle (filtre için)
        if (this.allOptions.length === 0) {
            this.allOptions = await fetchDersAdlari();
        }
        
        // Bekleyen önerileri yükle (login ise)
        if (isLoggedIn()) {
            await this.loadPendingChanges();
        }
    }

    /**
     * JSON'dan veri yükle (fallback)
     */
    async loadFromJSON() {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Veri dosyası bulunamadı');
        }
        
        const jsonData = await response.json();
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            throw new Error('Veri formatı geçersiz');
        }

        // JSON formatını Supabase formatına dönüştür
        this.data = jsonData
            .filter(row => row['DERS ADI'] !== 'DERS ADI')
            .map((row, index) => ({
                id: index + 1,
                sira_no: row['SIRA NO'],
                ders_adi: row['DERS ADI'],
                unite_tema: row['ÜNİTE/TEMA/ ÖĞRENME ALANI'],
                kazanim: row['KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM'],
                e_icerik_turu: row['E-İÇERİK TÜRÜ'],
                aciklama: row['AÇIKLAMA'],
                program_turu: row['Program Türü']
            }));

        this.filteredData = [...this.data];
        this.totalCount = this.data.length;
        
        // Benzersiz ders adlarını çıkar
        this.allOptions = [...new Set(this.data.map(d => d.ders_adi))].filter(d => d).sort();
    }

    /**
     * Bekleyen değişiklikleri yükle
     */
    async loadPendingChanges() {
        if (!this.useSupabase || !isLoggedIn()) return;
        
        try {
            const changes = await fetchBekleyenOneriler();
            this.pendingChanges.clear();
            
            changes.forEach(change => {
                const id = change.e_icerik_id;
                if (!this.pendingChanges.has(id)) {
                    this.pendingChanges.set(id, []);
                }
                this.pendingChanges.get(id).push(change);
            });
        } catch (e) {
            console.error('Bekleyen öneriler yüklenemedi:', e);
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
        }, 300);
    }

    setupFilters() {
        // Ders listesi allOptions'dan alınır
        this.populateMultiselect(this.allOptions);
    }

    setupMultiselect() {
        const input = document.getElementById('dersFilter');
        const container = input.closest('.multiselect-container');
        const inputContainer = container.querySelector('.multiselect-input-container');
        const dropdown = document.getElementById('dersDropdown');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');

        input.addEventListener('input', (e) => this.filterMultiselectOptions(e.target.value));
        input.addEventListener('focus', () => this.showMultiselectDropdown());
        
        inputContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                return;
            }
            if (container.classList.contains('open')) {
                this.hideMultiselectDropdown();
            } else {
                this.showMultiselectDropdown();
                input.focus();
            }
        });

        const optionsContainer = document.getElementById('multiselectOptions');
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.multiselect-option');
            if (option) {
                this.toggleMultiselectOption(option);
            }
        });

        selectAllBtn.addEventListener('click', () => this.selectAllOptions());
        clearAllBtn.addEventListener('click', () => this.clearAllOptions());

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
            
            if (this.selectedValues.has(option)) {
                optionElement.classList.add('selected');
            }
            
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
            this.populateMultiselect(this.allOptions);
            this.updateMultiselectSelectedState();
        } else {
            const filteredOptions = this.allOptions.filter(option => 
                option.toLowerCase().includes(term)
            );
            
            optionsContainer.innerHTML = '';
            
            filteredOptions.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'multiselect-option';
                optionElement.setAttribute('data-value', option);
                
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

    updateMultiselectSelectedState() {
        const options = document.querySelectorAll('.multiselect-option');
        options.forEach(option => {
            const value = option.getAttribute('data-value');
            if (this.selectedValues.has(value)) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
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
                
                const tagText = document.createElement('span');
                tagText.className = 'tag-text';
                tagText.textContent = value;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'tag-remove';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => this.removeTag(value);
                
                tag.appendChild(tagText);
                tag.appendChild(removeBtn);
                tagsContainer.appendChild(tag);
            });
            
            if (this.selectedValues.size > 3) {
                const moreTag = document.createElement('div');
                moreTag.className = 'tag more-tag';
                moreTag.innerHTML = `<span class="tag-text">+${this.selectedValues.size - 3} daha</span>`;
                tagsContainer.appendChild(moreTag);
            }
        }
        
        input.value = '';
    }

    removeTag(value) {
        this.selectedValues.delete(value);
        
        const options = document.querySelectorAll('.multiselect-option');
        options.forEach(option => {
            if (option.getAttribute('data-value') === value) {
                option.classList.remove('selected');
            }
        });
        
        this.updateSelectedTags();
        
        const input = document.getElementById('dersFilter');
        input.value = '';
        this.populateMultiselect(this.allOptions);
        this.updateMultiselectSelectedState();
        
        this.applyFilters();
    }

    async applyFilters() {
        if (this.useSupabase) {
            // Supabase'den filtrelenmiş veri çek
            this.currentPage = 1;
            await this.loadFromSupabase();
            this.renderTableHeader();
            this.renderTable();
            this.renderPagination();
            this.updateResultCount();
        } else {
            // JSON modunda client-side filtreleme
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const programTuru = document.getElementById('programTuru').value;

            this.filteredData = this.data.filter(row => {
                // Ders filtresi
                if (this.selectedValues.size > 0) {
                    if (!this.selectedValues.has(row.ders_adi)) {
                        return false;
                    }
                }

                // Program türü filtresi
                if (programTuru) {
                    if (row.program_turu !== programTuru) {
                        return false;
                    }
                }

                // Arama filtresi
                if (searchTerm) {
                    const allText = Object.values(row).join(' ').toLowerCase();
                    if (!allText.includes(searchTerm)) {
                        return false;
                    }
                }

                return true;
            });

            this.totalCount = this.filteredData.length;
            this.currentPage = 1;
            
            this.renderTableHeader();
            this.renderTable();
            this.renderPagination();
            this.updateResultCount();
        }
    }

    clearFilters() {
        document.getElementById('dersFilter').value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('programTuru').value = '';
        
        this.clearAllOptions();
        
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentPage = 1;
        
        this.applyFilters();
    }

    renderTableHeader() {
        const thead = document.getElementById('tableHead');
        thead.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        
        this.headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = this.headerLabels[header] || header;
            
            if (header === 'ders_adi') {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.handleSort(header));
            }
            
            headerRow.appendChild(th);
        });
        
        // Düzenleme yetkisi varsa işlem sütunu ekle
        if (canEdit()) {
            const actionTh = document.createElement('th');
            actionTh.textContent = 'İŞLEM';
            actionTh.style.width = '80px';
            headerRow.appendChild(actionTh);
        }
        
        thead.appendChild(headerRow);
    }

    renderTable() {
        const tbody = document.getElementById('tableBody');
        this.updateSortingUI();

        // Sayfalama (Supabase kullanılmıyorsa client-side)
        let pageData;
        if (this.useSupabase) {
            pageData = this.filteredData;
        } else {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            pageData = this.filteredData.slice(startIndex, endIndex);
        }

        const fragment = document.createDocumentFragment();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const userCanEdit = canEdit();
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', row.id);
            
            this.headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header] || '';
                
                // Bekleyen öneri var mı kontrol et
                const hasPending = this.pendingChanges.has(row.id) && 
                    this.pendingChanges.get(row.id).some(c => c.alan === header);
                
                if (hasPending) {
                    td.classList.add('cell-pending');
                    const pendingChange = this.pendingChanges.get(row.id).find(c => c.alan === header);
                    td.innerHTML = this.renderCellWithPending(value, pendingChange, searchTerm);
                } else if (searchTerm && value.toString().toLowerCase().includes(searchTerm)) {
                    td.innerHTML = this.highlightText(value.toString(), searchTerm);
                } else {
                    td.textContent = value;
                }
                
                // Düzenlenebilir alanlar
                if (userCanEdit && ['aciklama', 'e_icerik_turu'].includes(header)) {
                    td.classList.add('editable-cell');
                    td.addEventListener('click', () => this.openSuggestionModal(row, header));
                }
                
                tr.appendChild(td);
            });
            
            // İşlem sütunu
            if (userCanEdit) {
                const actionTd = document.createElement('td');
                actionTd.innerHTML = `
                    <button class="btn btn-sm btn-primary" onclick="tableManager.openSuggestionModal(${JSON.stringify(row).replace(/"/g, '&quot;')}, 'aciklama')" title="Düzenle">
                        ✏️
                    </button>
                `;
                tr.appendChild(actionTd);
            }
            
            fragment.appendChild(tr);
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }

    /**
     * Bekleyen öneri ile birlikte hücre render
     */
    renderCellWithPending(currentValue, pendingChange, searchTerm) {
        let html = searchTerm ? this.highlightText(currentValue.toString(), searchTerm) : currentValue;
        
        html += `
            <div class="pending-change">
                <div class="pending-change-label">Bekleyen Öneri:</div>
                <div>${pendingChange.yeni_deger}</div>
            </div>
        `;
        
        return html;
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
        const filtered = this.useSupabase ? this.totalCount : this.filteredData.length;
        const total = this.useSupabase ? this.totalCount : this.data.length;
        
        if (this.selectedValues.size === 0 && !document.getElementById('searchInput').value && !document.getElementById('programTuru').value) {
            resultCount.textContent = `Toplam ${total} kayıt gösteriliyor`;
        } else {
            resultCount.textContent = `${filtered} kayıt gösteriliyor`;
        }
    }

    exportToExcel() {
        const exportData = this.useSupabase ? this.filteredData : this.filteredData;
        
        if (exportData.length === 0) {
            alert('Excel olarak dışa aktarılacak veri yok.');
            return;
        }

        try {
            const wsData = [];
            wsData.push(this.headers.map(h => this.headerLabels[h] || h));
            
            exportData.forEach(row => {
                const rowData = this.headers.map(header => row[header] || '');
                wsData.push(rowData);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            const colWidths = this.headers.map((header, index) => {
                const maxLength = Math.max(
                    (this.headerLabels[header] || header).length,
                    ...exportData.slice(0, 100).map(row => 
                        String(row[header] || '').length
                    )
                );
                return { wch: Math.min(Math.max(maxLength, 10), 50) };
            });
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'E-İçerik Tablosu');

            const fileName = `e-icerik-tablo-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error('Excel oluşturma hatası:', error);
            alert('Excel dosyası oluşturulurken bir hata oluştu.');
        }
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        if (!this.useSupabase) {
            this.applySorting();
        }
        
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    applySorting() {
        if (!this.sortColumn) return;

        this.filteredData.sort((a, b) => {
            let aVal = a[this.sortColumn] || '';
            let bVal = b[this.sortColumn] || '';

            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return this.sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

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
        
        if (this.useSupabase) {
            this.loadFromSupabase().then(() => {
                this.renderTable();
                this.renderPagination();
            });
        } else {
            this.renderTable();
            this.renderPagination();
        }
    }

    async goToPage(page) {
        this.currentPage = page;
        
        if (this.useSupabase) {
            await this.loadFromSupabase();
        }
        
        this.renderTable();
        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationButtons = document.getElementById('paginationButtons');

        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, this.totalCount);
        paginationInfo.textContent = `${startItem}-${endItem} / ${this.totalCount} kayıt gösteriliyor`;

        paginationButtons.innerHTML = '';

        if (totalPages <= 1) return;

        const firstBtn = this.createPageButton('««', 1, this.currentPage === 1);
        paginationButtons.appendChild(firstBtn);

        const prevBtn = this.createPageButton('‹', this.currentPage - 1, this.currentPage === 1);
        paginationButtons.appendChild(prevBtn);

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i.toString(), i, false, i === this.currentPage);
            paginationButtons.appendChild(pageBtn);
        }

        const nextBtn = this.createPageButton('›', this.currentPage + 1, this.currentPage === totalPages);
        paginationButtons.appendChild(nextBtn);

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

    // =====================================================
    // ÖNERİ SİSTEMİ
    // =====================================================

    /**
     * Değişiklik önerisi modalını aç
     */
    openSuggestionModal(row, field) {
        if (!canEdit()) {
            showNotification('Bu işlem için giriş yapmalısınız', 'warning');
            return;
        }
        
        // Ders alanı kontrolü (chairman ve editor için)
        if (!isAdmin() && !hasAccessToDers(row.ders_adi)) {
            showNotification('Bu ders için düzenleme yetkiniz yok', 'warning');
            return;
        }
        
        document.getElementById('suggestionDers').textContent = row.ders_adi;
        document.getElementById('suggestionKazanim').textContent = row.kazanim || '-';
        document.getElementById('suggestionAlan').textContent = this.headerLabels[field] || field;
        document.getElementById('suggestionEskiDeger').textContent = row[field] || '(boş)';
        document.getElementById('suggestionYeniDeger').value = row[field] || '';
        document.getElementById('suggestionEIcerikId').value = row.id;
        document.getElementById('suggestionAlanKey').value = field;
        document.getElementById('suggestionError').textContent = '';
        
        document.getElementById('suggestionModal').classList.add('active');
    }

    /**
     * Yeni satır ekleme butonu render
     */
    renderAddRowButton() {
        // Mevcut butonu kaldır
        const existing = document.querySelector('.add-row-btn');
        if (existing) existing.remove();
        
        if (!canEdit()) return;
        
        const btn = document.createElement('button');
        btn.className = 'add-row-btn editor-only';
        btn.innerHTML = '+';
        btn.title = 'Yeni Satır Öner';
        btn.onclick = () => this.openNewRowModal();
        
        document.body.appendChild(btn);
    }

    /**
     * Yeni satır modalını aç
     */
    openNewRowModal() {
        if (!canEdit()) {
            showNotification('Bu işlem için giriş yapmalısınız', 'warning');
            return;
        }
        
        // Ders seçeneklerini doldur
        const dersSelect = document.getElementById('newDersAdi');
        dersSelect.innerHTML = '<option value="">Seçiniz...</option>';
        
        this.allOptions.forEach(ders => {
            const option = document.createElement('option');
            option.value = ders;
            option.textContent = ders;
            dersSelect.appendChild(option);
        });
        
        // Formu temizle
        document.getElementById('newRowForm').reset();
        document.getElementById('newRowError').textContent = '';
        
        document.getElementById('newRowModal').classList.add('active');
    }
}

// =====================================================
// GLOBAL FONKSİYONLAR
// =====================================================

let tableManager;

/**
 * Değişiklik önerisi modalını kapat
 */
function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('active');
}

/**
 * Değişiklik önerisi gönder
 */
async function submitSuggestion() {
    const eIcerikId = parseInt(document.getElementById('suggestionEIcerikId').value);
    const alan = document.getElementById('suggestionAlanKey').value;
    const eskiDeger = document.getElementById('suggestionEskiDeger').textContent;
    const yeniDeger = document.getElementById('suggestionYeniDeger').value.trim();
    const errorDiv = document.getElementById('suggestionError');
    
    if (!yeniDeger) {
        errorDiv.textContent = 'Yeni değer boş olamaz';
        return;
    }
    
    if (yeniDeger === eskiDeger || yeniDeger === '(boş)' && !eskiDeger) {
        errorDiv.textContent = 'Değişiklik yapılmadı';
        return;
    }
    
    try {
        if (tableManager.useSupabase) {
            await createDegisiklikOnerisi(eIcerikId, alan, eskiDeger === '(boş)' ? '' : eskiDeger, yeniDeger);
            showNotification('Değişiklik öneriniz gönderildi', 'success');
        } else {
            showNotification('Supabase bağlantısı gerekli', 'warning');
        }
        
        closeSuggestionModal();
        
        // Bekleyen önerileri yenile
        await tableManager.loadPendingChanges();
        tableManager.renderTable();
        
    } catch (error) {
        errorDiv.textContent = error.message || 'Öneri gönderilemedi';
    }
}

/**
 * Yeni satır modalını kapat
 */
function closeNewRowModal() {
    document.getElementById('newRowModal').classList.remove('active');
}

/**
 * Yeni satır önerisi gönder
 */
async function submitNewRow() {
    const dersAdi = document.getElementById('newDersAdi').value;
    const uniteTema = document.getElementById('newUniteTema').value.trim();
    const kazanim = document.getElementById('newKazanim').value.trim();
    const eIcerikTuru = document.getElementById('newEIcerikTuru').value.trim();
    const aciklama = document.getElementById('newAciklama').value.trim();
    const programTuru = document.getElementById('newProgramTuru').value;
    const errorDiv = document.getElementById('newRowError');
    
    if (!dersAdi || !kazanim || !aciklama) {
        errorDiv.textContent = 'Ders adı, kazanım ve açıklama zorunludur';
        return;
    }
    
    // Ders alanı kontrolü
    if (!isAdmin() && !hasAccessToDers(dersAdi)) {
        errorDiv.textContent = 'Bu ders için ekleme yetkiniz yok';
        return;
    }
    
    try {
        if (tableManager.useSupabase) {
            await createYeniSatirOnerisi({
                ders_adi: dersAdi,
                unite_tema: uniteTema,
                kazanim: kazanim,
                e_icerik_turu: eIcerikTuru,
                aciklama: aciklama,
                program_turu: programTuru
            });
            showNotification('Yeni satır öneriniz gönderildi', 'success');
        } else {
            showNotification('Supabase bağlantısı gerekli', 'warning');
        }
        
        closeNewRowModal();
        
    } catch (error) {
        errorDiv.textContent = error.message || 'Öneri gönderilemedi';
    }
}

/**
 * Onay panelini aç/kapat
 */
function toggleApprovalPanel() {
    const panel = document.getElementById('approvalPanel');
    panel.classList.toggle('collapsed');
}

/**
 * Admin panelini aç/kapat
 */
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('collapsed');
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    tableManager = new TableManager();
});
