document.addEventListener('DOMContentLoaded', () => {
    const toolsContainer = document.getElementById('tools-container');
    const searchInput = document.getElementById('search-input');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const loadingMessage = document.querySelector('.loading-message');

    let allToolsData = []; // Tüm araç verilerini tutacak
    let flatToolsList = []; // Filtreleme için düzleştirilmiş araç listesi
    let categories = new Set(); // Benzersiz kategorileri tutacak

    let currentFilters = {
        category: 'All',
        searchTerm: ''
    };

    async function loadTools() {
        try {
            const response = await fetch('ai_tools.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allToolsData = await response.json();
            processToolsData();
            if (loadingMessage) loadingMessage.remove();
            renderTools();
        } catch (error) {
            console.error("Araçlar yüklenirken hata oluştu:", error);
            if (loadingMessage) loadingMessage.remove();
            toolsContainer.innerHTML = '<p class="no-results-message">Araçlar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }

    function processToolsData() {
        flatToolsList = [];
        categories.add('All'); // 'Tüm Kategoriler' için temel kategori

        allToolsData.forEach(categoryObj => {
            categories.add(categoryObj.kategori);
            categoryObj.araclar.forEach(tool => {
                flatToolsList.push({ ...tool, kategoriOriginal: categoryObj.kategori });
            });
        });
        populateCategoryFilters();
    }

    function populateCategoryFilters() {
        categories.forEach(category => {
            if (category === 'All') return; // Zaten HTML'de var
            const button = document.createElement('button');
            button.classList.add('category-btn');
            button.dataset.category = category;
            button.textContent = category;
            button.addEventListener('click', handleCategoryFilter);
            categoryFiltersContainer.appendChild(button);
        });
    }

    function renderTools() {
        toolsContainer.innerHTML = ''; // Önceki araçları temizle

        let filteredTools = [...flatToolsList];

        // Kategoriye göre filtrele
        if (currentFilters.category !== 'All') {
            filteredTools = filteredTools.filter(tool => tool.kategoriOriginal === currentFilters.category);
        }

        // Arama terimine göre filtrele (isim veya açıklama)
        if (currentFilters.searchTerm) {
            const searchTermLower = currentFilters.searchTerm.toLowerCase();
            filteredTools = filteredTools.filter(tool =>
                tool.isim.toLowerCase().includes(searchTermLower) ||
                tool.aciklama.toLowerCase().includes(searchTermLower)
            );
        }

        if (filteredTools.length === 0) {
            toolsContainer.innerHTML = '<p class="no-results-message">Filtrelerinize uygun araç bulunamadı.</p>';
            return;
        }

        filteredTools.forEach(tool => {
            const card = document.createElement('article');
            card.classList.add('tool-card');

            const categoryTag = document.createElement('span');
            categoryTag.classList.add('category-tag');
            categoryTag.textContent = tool.kategoriOriginal;

            const name = document.createElement('h3');
            name.textContent = tool.isim;

            const description = document.createElement('p');
            description.textContent = tool.aciklama;

            const link = document.createElement('a');
            link.classList.add('tool-link');
            if (tool.url && tool.url !== 'URL_NOT_FOUND') {
                link.href = tool.url;
                link.target = '_blank'; // Yeni sekmede aç
                link.rel = 'noopener noreferrer';
                link.textContent = 'Web Sitesini Ziyaret Et';
            } else {
                link.classList.add('disabled');
                link.href = '#';
                link.textContent = 'Web Sitesi Yok';
                link.onclick = (e) => e.preventDefault(); // Tıklamayı engelle
            }

            card.appendChild(name);
            card.appendChild(categoryTag);
            card.appendChild(description);
            card.appendChild(link);
            toolsContainer.appendChild(card);
        });
    }

    function handleCategoryFilter(event) {
        const selectedCategory = event.target.dataset.category;
        currentFilters.category = selectedCategory;

        document.querySelectorAll('#category-filters .category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        renderTools();
    }

    searchInput.addEventListener('input', (event) => {
        currentFilters.searchTerm = event.target.value.trim();
        renderTools();
    });
    
    // 'Tüm Kategoriler' butonu için event listener
    document.querySelector('.category-btn[data-category="All"]').addEventListener('click', handleCategoryFilter);

    clearFiltersBtn.addEventListener('click', () => {
        currentFilters.category = 'All';
        currentFilters.searchTerm = '';
        searchInput.value = '';
        document.querySelectorAll('#category-filters .category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.category-btn[data-category="All"]').classList.add('active');
        renderTools();
    });

    // Başlangıçta araçları yükle
    loadTools();
});