<?php
/**
 * Kayıt Listesi - Gelişmiş Filtreleme
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'Kayıtlar';

// AJAX isteği mi?
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

// Filtreleri al
$filters = [
    'search' => trim($_GET['search'] ?? ''),
    'ders_adi' => $_GET['ders_adi'] ?? [], // Artık dizi
    'program_turu' => trim($_GET['program_turu'] ?? '')
];

// Ders adı string olarak geldiyse diziye çevir
if (is_string($filters['ders_adi'])) {
    $filters['ders_adi'] = $filters['ders_adi'] ? [$filters['ders_adi']] : [];
}

$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = (int) ($_GET['per_page'] ?? 50); // Varsayılan 50

// Kayıtları getir
$result = getRecordsAdvanced($page, $perPage, $filters);
$records = $result['records'];
$total = $result['total'];
$totalPages = $result['totalPages'];

// Ders listesi (filtre için)
$dersAdlari = getAllDersAdlari();

// AJAX için sadece tablo HTML döndür
if ($isAjax) {
    header('Content-Type: application/json');
    
    ob_start();
    include __DIR__ . '/templates/records_table.php';
    $tableHtml = ob_get_clean();
    
    echo json_encode([
        'html' => $tableHtml,
        'total' => $total,
        'page' => $page,
        'totalPages' => $totalPages,
        'showing' => count($records)
    ]);
    exit;
}

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2>Filtreleme</h2>
    </div>
    <div class="card-body">
        <div class="filter-row">
            <div class="filter-group filter-group-large">
                <label>Ders Seçimi</label>
                <div class="multiselect-wrapper" id="dersMultiselect">
                    <div class="multiselect-trigger" onclick="toggleMultiselect()">
                        <div class="multiselect-tags" id="selectedDersTags">
                            <span class="placeholder">Ders seçin...</span>
                        </div>
                        <span class="multiselect-arrow">▼</span>
                    </div>
                    <div class="multiselect-dropdown" id="dersDropdown">
                        <div class="multiselect-search">
                            <input type="text" id="dersSearchInput" placeholder="Ders ara..." oninput="filterDersOptions()">
                        </div>
                        <div class="multiselect-controls">
                            <button type="button" onclick="selectAllDers()">Tümünü Seç</button>
                            <button type="button" onclick="clearAllDers()">Temizle</button>
                        </div>
                        <div class="multiselect-options" id="dersOptions">
                            <?php foreach ($dersAdlari as $ders): ?>
                            <label class="multiselect-option">
                                <input type="checkbox" value="<?= e($ders) ?>" 
                                       <?= in_array($ders, $filters['ders_adi']) ? 'checked' : '' ?>
                                       onchange="onDersChange()">
                                <span><?= e($ders) ?></span>
                            </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="filter-group">
                <label for="programTuru">Program Türü</label>
                <select id="programTuru" onchange="applyFilters()">
                    <option value="">Tümü</option>
                    <option value="TYMM" <?= $filters['program_turu'] === 'TYMM' ? 'selected' : '' ?>>TYMM</option>
                    <option value="Diğer" <?= $filters['program_turu'] === 'Diğer' ? 'selected' : '' ?>>Diğer</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="searchInput">Genel Arama</label>
                <div class="search-input-wrapper">
                    <input type="text" id="searchInput" placeholder="En az 3 karakter..." 
                           value="<?= e($filters['search']) ?>" oninput="onSearchInput()">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
            
            <div class="filter-group filter-actions-group">
                <label>&nbsp;</label>
                <button type="button" class="btn btn-secondary" onclick="clearFilters()">Temizle</button>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h2>Kayıt Listesi</h2>
        <div class="card-actions">
            <span class="record-count" id="recordCount"><?= number_format($total) ?> kayıt</span>
            <a href="excel_export.php?<?= http_build_query(['ders_adi' => $filters['ders_adi'], 'program_turu' => $filters['program_turu'], 'search' => $filters['search']]) ?>" 
               class="btn btn-success btn-sm" id="excelExportBtn">📥 Excel İndir</a>
            <a href="record_form.php" class="btn btn-primary btn-sm">➕ Yeni Kayıt</a>
        </div>
    </div>
    <div class="card-body">
        <!-- Toplu İşlem Toolbar -->
        <div class="bulk-actions" id="bulkActions" style="display: none;">
            <span class="selected-count"><span id="selectedCount">0</span> kayıt seçildi</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="bulkDelete()">🗑️ Seçilenleri Sil</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="clearSelection()">✖️ Seçimi Temizle</button>
        </div>
        
        <form id="bulkForm" method="POST" action="bulk_action.php">
            <input type="hidden" name="csrf_token" value="<?= e(generateCSRFToken()) ?>">
            <input type="hidden" name="action" id="bulkActionType" value="">
            
            <div id="tableWrapper">
                <?php include __DIR__ . '/templates/records_table.php'; ?>
            </div>
        </form>
        
        <!-- Sayfalama -->
        <div class="pagination-wrapper" id="paginationWrapper">
            <div class="pagination-info">
                <span id="paginationInfo">
                    <?php 
                    $start = ($page - 1) * $perPage + 1;
                    $end = min($page * $perPage, $total);
                    echo "$start-$end / $total kayıt gösteriliyor";
                    ?>
                </span>
            </div>
            <div class="pagination-controls">
                <label>Sayfa başına:
                    <select id="perPageSelect" onchange="changePerPage()">
                        <option value="25" <?= $perPage == 25 ? 'selected' : '' ?>>25</option>
                        <option value="50" <?= $perPage == 50 ? 'selected' : '' ?>>50</option>
                        <option value="100" <?= $perPage == 100 ? 'selected' : '' ?>>100</option>
                        <option value="150" <?= $perPage == 150 ? 'selected' : '' ?>>150</option>
                    </select>
                </label>
                <div class="pagination-buttons" id="paginationButtons">
                    <?= renderPaginationButtons($page, $totalPages) ?>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="loading-overlay" id="loadingOverlay" style="display: none;">
    <div class="loading-spinner"></div>
</div>

<script>
let searchTimeout = null;
let currentPage = <?= $page ?>;
let perPage = <?= $perPage ?>;
const csrfToken = '<?= e(generateCSRFToken()) ?>';

// Multiselect toggle
function toggleMultiselect() {
    const dropdown = document.getElementById('dersDropdown');
    dropdown.classList.toggle('open');
}

// Dışarı tıklayınca kapat
document.addEventListener('click', function(e) {
    const multiselect = document.getElementById('dersMultiselect');
    if (!multiselect.contains(e.target)) {
        document.getElementById('dersDropdown').classList.remove('open');
    }
});

// Ders ara
function filterDersOptions() {
    const search = document.getElementById('dersSearchInput').value.toLowerCase();
    const options = document.querySelectorAll('#dersOptions .multiselect-option');
    
    options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(search) ? '' : 'none';
    });
}

// Tümünü seç
function selectAllDers() {
    const visibleCheckboxes = document.querySelectorAll('#dersOptions .multiselect-option:not([style*="display: none"]) input[type="checkbox"]');
    visibleCheckboxes.forEach(cb => cb.checked = true);
    updateDersTags();
    applyFilters();
}

// Temizle
function clearAllDers() {
    document.querySelectorAll('#dersOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDersTags();
    applyFilters();
}

// Ders değiştiğinde
function onDersChange() {
    updateDersTags();
    applyFilters();
}

// Seçili dersleri güncelle
function updateDersTags() {
    const container = document.getElementById('selectedDersTags');
    const checked = document.querySelectorAll('#dersOptions input[type="checkbox"]:checked');
    
    if (checked.length === 0) {
        container.innerHTML = '<span class="placeholder">Ders seçin...</span>';
    } else if (checked.length <= 3) {
        container.innerHTML = Array.from(checked).map(cb => 
            `<span class="tag">${cb.value} <button type="button" onclick="removeDersTag('${cb.value}')">&times;</button></span>`
        ).join('');
    } else {
        container.innerHTML = `<span class="tag">${checked.length} ders seçili</span>`;
    }
}

function removeDersTag(value) {
    const cb = document.querySelector(`#dersOptions input[value="${value}"]`);
    if (cb) {
        cb.checked = false;
        updateDersTags();
        applyFilters();
    }
}

// Arama input
function onSearchInput() {
    const value = document.getElementById('searchInput').value;
    
    clearTimeout(searchTimeout);
    
    // 3+ karakter veya boşsa ara
    if (value.length >= 3 || value.length === 0) {
        searchTimeout = setTimeout(() => applyFilters(), 300);
    }
}

// Filtreleri uygula (AJAX)
function applyFilters(page = 1) {
    currentPage = page;
    
    const selectedDers = Array.from(document.querySelectorAll('#dersOptions input:checked')).map(cb => cb.value);
    const programTuru = document.getElementById('programTuru').value;
    const search = document.getElementById('searchInput').value;
    
    const params = new URLSearchParams();
    selectedDers.forEach(d => params.append('ders_adi[]', d));
    if (programTuru) params.set('program_turu', programTuru);
    if (search.length >= 3) params.set('search', search);
    params.set('page', page);
    params.set('per_page', perPage);
    
    // Loading göster
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    fetch('records.php?' + params.toString(), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('tableWrapper').innerHTML = data.html;
        document.getElementById('recordCount').textContent = data.total.toLocaleString() + ' kayıt';
        
        // Sayfalama güncelle
        updatePagination(data);
        
        // Arama vurgulama
        if (search.length >= 3) {
            highlightSearch(search);
        }
        
        // Excel export linkini güncelle
        updateExcelExportLink(params);
        
        document.getElementById('loadingOverlay').style.display = 'none';
    })
    .catch(err => {
        console.error(err);
        document.getElementById('loadingOverlay').style.display = 'none';
    });
}

// Arama sonuçlarını vurgula
function highlightSearch(term) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    const cells = document.querySelectorAll('#recordsTable td');
    
    cells.forEach(cell => {
        if (cell.classList.contains('actions-cell')) return;
        
        const text = cell.textContent;
        if (text.toLowerCase().includes(term.toLowerCase())) {
            cell.innerHTML = text.replace(regex, '<mark>$1</mark>');
        }
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sayfalama güncelle
function updatePagination(data) {
    const start = (data.page - 1) * perPage + 1;
    const end = start + data.showing - 1;
    document.getElementById('paginationInfo').textContent = `${start}-${end} / ${data.total} kayıt gösteriliyor`;
    
    // Butonları güncelle
    let buttons = '';
    if (data.totalPages > 1) {
        if (data.page > 1) {
            buttons += `<button onclick="applyFilters(1)">««</button>`;
            buttons += `<button onclick="applyFilters(${data.page - 1})">‹</button>`;
        }
        
        const start = Math.max(1, data.page - 2);
        const end = Math.min(data.totalPages, data.page + 2);
        
        for (let i = start; i <= end; i++) {
            const active = i === data.page ? ' class="active"' : '';
            buttons += `<button${active} onclick="applyFilters(${i})">${i}</button>`;
        }
        
        if (data.page < data.totalPages) {
            buttons += `<button onclick="applyFilters(${data.page + 1})">›</button>`;
            buttons += `<button onclick="applyFilters(${data.totalPages})">»»</button>`;
        }
    }
    document.getElementById('paginationButtons').innerHTML = buttons;
}

// Sayfa başına değiştir
function changePerPage() {
    perPage = parseInt(document.getElementById('perPageSelect').value);
    applyFilters(1);
}

// Filtreleri temizle
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('programTuru').value = '';
    document.querySelectorAll('#dersOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDersTags();
    applyFilters(1);
}

// Excel export linkini güncelle
function updateExcelExportLink(params) {
    const link = document.getElementById('excelExportBtn');
    link.href = 'excel_export.php?' + params.toString();
}

// Toplu işlemler
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = selectAll.checked);
    updateBulkActions();
}

function updateBulkActions() {
    const checked = document.querySelectorAll('.row-checkbox:checked').length;
    document.getElementById('selectedCount').textContent = checked;
    document.getElementById('bulkActions').style.display = checked > 0 ? 'flex' : 'none';
}

function clearSelection() {
    document.getElementById('selectAll').checked = false;
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    updateBulkActions();
}

function bulkDelete() {
    const count = document.querySelectorAll('.row-checkbox:checked').length;
    if (confirm(`${count} kayıt silinecek. Emin misiniz?`)) {
        document.getElementById('bulkActionType').value = 'delete';
        document.getElementById('bulkForm').submit();
    }
}

// Sayfa yüklendiğinde
updateDersTags();
</script>

<?php include __DIR__ . '/templates/footer.php'; ?>
