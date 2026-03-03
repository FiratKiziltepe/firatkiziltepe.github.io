<?php
/**
 * Ortak Fonksiyonlar
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

/**
 * Kayıt listesi getir (sayfalama ve filtreleme ile)
 */
function getRecords(int $page = 1, int $perPage = RECORDS_PER_PAGE, array $filters = []): array {
    $pdo = getDB();
    
    $where = [];
    $params = [];
    
    // Ders adı filtresi
    if (!empty($filters['ders_adi'])) {
        $where[] = "ders_adi LIKE ?";
        $params[] = '%' . $filters['ders_adi'] . '%';
    }
    
    // Program türü filtresi
    if (!empty($filters['program_turu'])) {
        $where[] = "program_turu = ?";
        $params[] = $filters['program_turu'];
    }
    
    // Genel arama
    if (!empty($filters['search'])) {
        $searchTerm = '%' . $filters['search'] . '%';
        $where[] = "(ders_adi LIKE ? OR unite_tema LIKE ? OR kazanim LIKE ? OR aciklama LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Toplam kayıt sayısı
    $countSql = "SELECT COUNT(*) FROM records $whereClause";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();
    
    // Sayfalama
    $offset = ($page - 1) * $perPage;
    $totalPages = ceil($total / $perPage);
    
    // Kayıtları getir
    $sql = "SELECT * FROM records $whereClause ORDER BY sira_no ASC, id ASC LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();
    
    return [
        'records' => $records,
        'total' => $total,
        'page' => $page,
        'perPage' => $perPage,
        'totalPages' => $totalPages
    ];
}

/**
 * Gelişmiş kayıt listesi (çoklu ders seçimi destekli)
 */
function getRecordsAdvanced(int $page = 1, int $perPage = 50, array $filters = []): array {
    $pdo = getDB();
    
    $where = [];
    $params = [];
    
    // Çoklu ders adı filtresi
    if (!empty($filters['ders_adi']) && is_array($filters['ders_adi'])) {
        $placeholders = implode(',', array_fill(0, count($filters['ders_adi']), '?'));
        $where[] = "ders_adi IN ($placeholders)";
        $params = array_merge($params, $filters['ders_adi']);
    }
    
    // Program türü filtresi
    if (!empty($filters['program_turu'])) {
        $where[] = "program_turu = ?";
        $params[] = $filters['program_turu'];
    }
    
    // Genel arama (3+ karakter)
    if (!empty($filters['search']) && mb_strlen($filters['search']) >= 3) {
        $searchTerm = '%' . $filters['search'] . '%';
        $where[] = "(ders_adi LIKE ? OR unite_tema LIKE ? OR kazanim LIKE ? OR aciklama LIKE ? OR eicerik_turu LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Toplam kayıt sayısı
    $countSql = "SELECT COUNT(*) FROM records $whereClause";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();
    
    // Sayfalama
    $offset = ($page - 1) * $perPage;
    $totalPages = (int) ceil($total / $perPage);
    
    // Kayıtları getir
    $sql = "SELECT * FROM records $whereClause ORDER BY ders_adi ASC, sira_no ASC, id ASC LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();
    
    return [
        'records' => $records,
        'total' => $total,
        'page' => $page,
        'perPage' => $perPage,
        'totalPages' => $totalPages
    ];
}

/**
 * Sayfalama butonları HTML
 */
function renderPaginationButtons(int $currentPage, int $totalPages): string {
    if ($totalPages <= 1) return '';
    
    $html = '';
    
    if ($currentPage > 1) {
        $html .= '<button onclick="applyFilters(1)">««</button>';
        $html .= '<button onclick="applyFilters(' . ($currentPage - 1) . ')">‹</button>';
    }
    
    $start = max(1, $currentPage - 2);
    $end = min($totalPages, $currentPage + 2);
    
    for ($i = $start; $i <= $end; $i++) {
        $active = $i === $currentPage ? ' class="active"' : '';
        $html .= '<button' . $active . ' onclick="applyFilters(' . $i . ')">' . $i . '</button>';
    }
    
    if ($currentPage < $totalPages) {
        $html .= '<button onclick="applyFilters(' . ($currentPage + 1) . ')">›</button>';
        $html .= '<button onclick="applyFilters(' . $totalPages . ')">»»</button>';
    }
    
    return $html;
}

/**
 * Tek kayıt getir
 */
function getRecord(int $id): ?array {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM records WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

/**
 * Yeni kayıt ekle
 */
function createRecord(array $data): int {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        INSERT INTO records (sira_no, ders_adi, unite_tema, kazanim, eicerik_turu, aciklama, program_turu)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['sira_no'] ?: null,
        $data['ders_adi'],
        $data['unite_tema'] ?? '',
        $data['kazanim'] ?? '',
        $data['eicerik_turu'] ?? '',
        $data['aciklama'] ?? '',
        $data['program_turu'] ?? ''
    ]);
    
    $id = (int) $pdo->lastInsertId();
    
    logAction('CREATE', $id, null, $data);
    
    return $id;
}

/**
 * Kayıt güncelle
 */
function updateRecord(int $id, array $data): bool {
    $pdo = getDB();
    
    // Eski veriyi al (audit log için)
    $oldRecord = getRecord($id);
    if (!$oldRecord) {
        return false;
    }
    
    $stmt = $pdo->prepare("
        UPDATE records SET
            sira_no = ?,
            ders_adi = ?,
            unite_tema = ?,
            kazanim = ?,
            eicerik_turu = ?,
            aciklama = ?,
            program_turu = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    
    $stmt->execute([
        $data['sira_no'] ?: null,
        $data['ders_adi'],
        $data['unite_tema'] ?? '',
        $data['kazanim'] ?? '',
        $data['eicerik_turu'] ?? '',
        $data['aciklama'] ?? '',
        $data['program_turu'] ?? '',
        $id
    ]);
    
    logAction('UPDATE', $id, $oldRecord, $data);
    
    return true;
}

/**
 * Kayıt sil
 */
function deleteRecord(int $id): bool {
    $pdo = getDB();
    
    // Eski veriyi al (audit log için)
    $oldRecord = getRecord($id);
    if (!$oldRecord) {
        return false;
    }
    
    $stmt = $pdo->prepare("DELETE FROM records WHERE id = ?");
    $stmt->execute([$id]);
    
    logAction('DELETE', $id, $oldRecord, null);
    
    return $stmt->rowCount() > 0;
}

/**
 * Toplu kayıt sil
 */
function bulkDeleteRecords(array $ids): int {
    $pdo = getDB();
    $deleted = 0;
    
    foreach ($ids as $id) {
        $oldRecord = getRecord($id);
        if ($oldRecord) {
            $stmt = $pdo->prepare("DELETE FROM records WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                logAction('DELETE', $id, $oldRecord, null);
                $deleted++;
            }
        }
    }
    
    return $deleted;
}

/**
 * Filtrelenmiş kayıtları getir (sayfalama olmadan - export için)
 */
function getFilteredRecords(array $filters = []): array {
    $pdo = getDB();
    
    $where = [];
    $params = [];
    
    if (!empty($filters['ders_adi'])) {
        $where[] = "ders_adi LIKE ?";
        $params[] = '%' . $filters['ders_adi'] . '%';
    }
    
    if (!empty($filters['program_turu'])) {
        $where[] = "program_turu = ?";
        $params[] = $filters['program_turu'];
    }
    
    if (!empty($filters['search'])) {
        $searchTerm = '%' . $filters['search'] . '%';
        $where[] = "(ders_adi LIKE ? OR unite_tema LIKE ? OR kazanim LIKE ? OR aciklama LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $sql = "SELECT * FROM records $whereClause ORDER BY sira_no ASC, id ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return $stmt->fetchAll();
}

/**
 * Tüm ders adlarını getir (filtreleme için)
 */
function getAllDersAdlari(): array {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT DISTINCT ders_adi FROM records WHERE ders_adi IS NOT NULL AND ders_adi != '' ORDER BY ders_adi");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * Toplam kayıt sayısı
 */
function getTotalRecordCount(): int {
    $pdo = getDB();
    return (int) $pdo->query("SELECT COUNT(*) FROM records")->fetchColumn();
}

/**
 * Son değişiklikler (dashboard için)
 */
function getRecentChanges(int $limit = 10): array {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT * FROM audit_log 
        WHERE action IN ('CREATE', 'UPDATE', 'DELETE')
        ORDER BY created_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

/**
 * İstatistikler
 */
function getStats(): array {
    $pdo = getDB();
    
    $total = (int) $pdo->query("SELECT COUNT(*) FROM records")->fetchColumn();
    
    $byProgram = $pdo->query("
        SELECT program_turu, COUNT(*) as count 
        FROM records 
        GROUP BY program_turu
    ")->fetchAll();
    
    $lastExport = null;
    $stmt = $pdo->query("
        SELECT created_at FROM audit_log 
        WHERE action = 'EXPORT' 
        ORDER BY created_at DESC 
        LIMIT 1
    ");
    $row = $stmt->fetch();
    if ($row) {
        $lastExport = $row['created_at'];
    }
    
    return [
        'total' => $total,
        'byProgram' => $byProgram,
        'lastExport' => $lastExport
    ];
}

/**
 * Sayfalama HTML oluştur
 */
function renderPagination(int $currentPage, int $totalPages, string $baseUrl): string {
    if ($totalPages <= 1) {
        return '';
    }
    
    $html = '<div class="pagination">';
    
    // Önceki
    if ($currentPage > 1) {
        $html .= '<a href="' . $baseUrl . '&page=' . ($currentPage - 1) . '" class="page-link">&laquo; Önceki</a>';
    }
    
    // Sayfa numaraları
    $start = max(1, $currentPage - 2);
    $end = min($totalPages, $currentPage + 2);
    
    for ($i = $start; $i <= $end; $i++) {
        $active = $i === $currentPage ? ' active' : '';
        $html .= '<a href="' . $baseUrl . '&page=' . $i . '" class="page-link' . $active . '">' . $i . '</a>';
    }
    
    // Sonraki
    if ($currentPage < $totalPages) {
        $html .= '<a href="' . $baseUrl . '&page=' . ($currentPage + 1) . '" class="page-link">Sonraki &raquo;</a>';
    }
    
    $html .= '</div>';
    
    return $html;
}

