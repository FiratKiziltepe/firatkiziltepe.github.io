// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const clearSearchBtn = document.getElementById('clearSearch');
const navLinks = document.querySelectorAll('.nav-link');

// Search functionality
let searchData = [];
let currentSearchTerm = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeNavigation();
    initializeSmoothScrolling();
    addMobileMenuToggle();
    addBackToTop();
});

// Add mobile menu toggle
function addMobileMenuToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    });
    document.body.appendChild(toggleBtn);
}

// Initialize search functionality
function initializeSearch() {
    // Build search index
    buildSearchIndex();
    
    // Search input event listeners
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length >= 2) {
            showSearchResults();
        }
    });
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
    
    // Keyboard navigation for search results
    searchInput.addEventListener('keydown', handleSearchKeyboard);
}

// Build search index from content
function buildSearchIndex() {
    // Wait for content to be loaded
    setTimeout(() => {
        const sections = document.querySelectorAll('.content-section');
        searchData = [];
        
        sections.forEach(section => {
            const sectionId = section.id;
            const sectionTitle = section.querySelector('.section-title')?.textContent || '';
            
            // Add section title to search data
            if (sectionTitle) {
                searchData.push({
                    type: 'section',
                    title: sectionTitle,
                    content: sectionTitle,
                    element: section,
                    id: sectionId
                });
            }
            
            // Add subsections
            const subsections = section.querySelectorAll('.subsection-title');
            subsections.forEach(subsection => {
                searchData.push({
                    type: 'subsection',
                    title: `${sectionTitle} - ${subsection.textContent}`,
                    content: subsection.textContent,
                    element: subsection.closest('.subsection'),
                    id: sectionId
                });
            });
            
            // Add criteria
            const criteria = section.querySelectorAll('.criterion');
            criteria.forEach(criterion => {
                const criterionNumber = criterion.querySelector('.criterion-number')?.textContent || '';
                const criterionText = criterion.querySelector('.criterion-text')?.textContent || '';
                const listItems = Array.from(criterion.querySelectorAll('.criterion-details li')).map(li => li.textContent).join(' ');
                
                if (criterionNumber || criterionText) {
                    searchData.push({
                        type: 'criterion',
                        title: `${sectionTitle} - ${criterionNumber}`,
                        content: `${criterionText} ${listItems}`,
                        element: criterion,
                        id: sectionId
                    });
                }
            });
            
            // Add definitions
            const definitions = section.querySelectorAll('.definition-item');
            definitions.forEach(definition => {
                const defTitle = definition.querySelector('h3')?.textContent || '';
                const defContent = definition.querySelector('p')?.textContent || '';
                
                if (defTitle) {
                    searchData.push({
                        type: 'definition',
                        title: defTitle,
                        content: `${defTitle} ${defContent}`,
                        element: definition,
                        id: sectionId
                    });
                }
            });
        });
        
        console.log('Search index built with', searchData.length, 'items');
    }, 100);
}

// Handle search input
function handleSearch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    currentSearchTerm = searchTerm;
    
    // Clear button visibility
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    }
    
    if (searchTerm.length < 2) {
        hideSearchResults();
        clearHighlights();
        showAllContent();
        return;
    }
    
    // Hide dropdown search results
    hideSearchResults();
    
    // Perform real-time search
    performRealTimeSearch(searchTerm);
}

// Perform real-time search in content
function performRealTimeSearch(searchTerm) {
    clearHighlights();
    
    if (!searchTerm) {
        showAllContent();
        return;
    }
    
    const allSections = document.querySelectorAll('.content-section');
    const allSubsections = document.querySelectorAll('.subsection');
    const allCriteria = document.querySelectorAll('.criterion');
    const allDefinitions = document.querySelectorAll('.definition-item');
    
    let hasVisibleContent = false;
    
    // Hide all content initially
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    allSubsections.forEach(sub => sub.style.display = 'none');
    allCriteria.forEach(crit => crit.style.display = 'none');
    allDefinitions.forEach(def => def.style.display = 'none');
    
    // Search and highlight in all text content
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    
    // Search in criteria
    allCriteria.forEach(criterion => {
        const textElements = criterion.querySelectorAll('.criterion-text, .criterion-details li, .criterion-number');
        let hasMatch = false;
        
        textElements.forEach(element => {
            const originalText = element.textContent;
            if (originalText.toLowerCase().includes(searchTerm)) {
                hasMatch = true;
                // Highlight the search term
                const highlightedHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                element.innerHTML = highlightedHTML;
            }
        });
        
        if (hasMatch) {
            criterion.style.display = 'flex';
            const subsection = criterion.closest('.subsection');
            const section = criterion.closest('.content-section');
            if (subsection) subsection.style.display = 'block';
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in definitions
    allDefinitions.forEach(definition => {
        const title = definition.querySelector('h3');
        const content = definition.querySelector('p');
        let hasMatch = false;
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            hasMatch = true;
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        if (content && content.textContent.toLowerCase().includes(searchTerm)) {
            hasMatch = true;
            content.innerHTML = content.textContent.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        if (hasMatch) {
            definition.style.display = 'block';
            const section = definition.closest('.content-section');
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in section titles
    allSections.forEach(section => {
        const title = section.querySelector('.section-title');
        const intro = section.querySelector('.section-intro');
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            section.style.display = 'block';
            hasVisibleContent = true;
        }
        
        if (intro && intro.textContent.toLowerCase().includes(searchTerm)) {
            intro.innerHTML = intro.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in subsection titles
    allSubsections.forEach(subsection => {
        const title = subsection.querySelector('.subsection-title');
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            subsection.style.display = 'block';
            const section = subsection.closest('.content-section');
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // If no content is visible, show a message
    if (!hasVisibleContent) {
        showNoResultsMessage();
    }
}

// Clear all highlights
function clearHighlights() {
    const highlighted = document.querySelectorAll('.search-highlight');
    highlighted.forEach(element => {
        const parent = element.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(element.textContent), element);
            parent.normalize();
        }
    });
}

// Show all content
function showAllContent() {
    const allSections = document.querySelectorAll('.content-section');
    const allSubsections = document.querySelectorAll('.subsection');
    const allCriteria = document.querySelectorAll('.criterion');
    const allDefinitions = document.querySelectorAll('.definition-item');
    
    allSections.forEach(section => section.style.display = 'block');
    allSubsections.forEach(sub => sub.style.display = 'block');
    allCriteria.forEach(crit => crit.style.display = 'flex');
    allDefinitions.forEach(def => def.style.display = 'block');
    
    // Remove no results message if exists
    const noResultsMsg = document.querySelector('.no-results-message');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Show no results message
function showNoResultsMessage() {
    const content = document.querySelector('.content');
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 0.5rem;">Sonuç bulunamadı</h3>
                <p>"${currentSearchTerm}" için herhangi bir sonuç bulunamadı.</p>
            </div>
        `;
        content.appendChild(noResultsMsg);
    }
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Show search results
function showSearchResults() {
    if (searchResults && searchResults.innerHTML.trim()) {
        searchResults.style.display = 'block';
    }
}

// Hide search results
function hideSearchResults() {
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    currentSearchTerm = '';
    hideSearchResults();
    clearHighlights();
    showAllContent();
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Remove no results message if exists
    const noResultsMsg = document.querySelector('.no-results-message');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
    
    searchInput.focus();
}

// Handle keyboard navigation in search
function handleSearchKeyboard(e) {
    if (!searchResults) return;
    
    const items = searchResults.querySelectorAll('.search-result-item');
    const activeItem = searchResults.querySelector('.search-result-item.active');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!activeItem) {
            items[0]?.classList.add('active');
        } else {
            activeItem.classList.remove('active');
            const nextItem = activeItem.nextElementSibling || items[0];
            nextItem.classList.add('active');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!activeItem) {
            items[items.length - 1]?.classList.add('active');
        } else {
            activeItem.classList.remove('active');
            const prevItem = activeItem.previousElementSibling || items[items.length - 1];
            prevItem.classList.add('active');
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeItem) {
            activeItem.click();
        }
    } else if (e.key === 'Escape') {
        hideSearchResults();
    }
}

// Initialize navigation
function initializeNavigation() {
    // Add click listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            
            // Clear search when navigating
            clearSearch();
            
            navigateToSection(sectionId);
            updateActiveNavLink(this);
            
            // Close mobile menu if open
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.remove('open');
        });
    });
    
    // Update active navigation on scroll
    window.addEventListener('scroll', updateActiveNavOnScroll);
}

// Navigate to section
function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const offset = headerHeight + 20;
        
        const sectionTop = section.offsetTop - offset;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Update active navigation on scroll
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('.content-section');
    const headerHeight = document.querySelector('.header').offsetHeight;
    const offset = headerHeight + 100;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - offset;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.id;
        }
    });
    
    if (currentSection) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            navigateToSection(targetId);
        });
    });
}

// Add back to top functionality
function addBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide back to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    document.body.appendChild(backToTopBtn);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + P for print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        clearSearch();
    }
});

