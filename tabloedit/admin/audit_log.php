<?php
/**
 * Audit Log - Değişiklik Geçmişi
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'Değişiklik Geçmişi';

// Filtreleri al
$action = $_GET['action'] ?? '';
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 50;

// Audit logları getir
$pdo = getDB();

$where = [];
$params = [];

if ($action) {
    $where[] = "action = ?";
    $params[] = $action;
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Toplam sayı
$countSql = "SELECT COUNT(*) FROM audit_log $whereClause";
$stmt = $pdo->prepare($countSql);
$stmt->execute($params);
$total = (int) $stmt->fetchColumn();
$totalPages = ceil($total / $perPage);

// Kayıtları getir
$offset = ($page - 1) * $perPage;
$sql = "SELECT * FROM audit_log $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?";
$params[] = $perPage;
$params[] = $offset;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll();

// Sayfalama URL'si
$baseUrl = 'audit_log.php?' . ($action ? "action=$action" : '');

include __DIR__ . '/templates/header.php';
?>

<div class="card">
    <div class="card-header">
        <h2>Filtrele</h2>
    </div>
    <div class="card-body">
        <form method="GET" class="filter-form inline-form">
            <div class="filter-group">
                <label for="action">İşlem Türü</label>
                <select id="action" name="action">
                    <option value="">Tümü</option>
                    <option value="CREATE" <?= $action === 'CREATE' ? 'selected' : '' ?>>CREATE</option>
                    <option value="UPDATE" <?= $action === 'UPDATE' ? 'selected' : '' ?>>UPDATE</option>
                    <option value="DELETE" <?= $action === 'DELETE' ? 'selected' : '' ?>>DELETE</option>
                    <option value="EXPORT" <?= $action === 'EXPORT' ? 'selected' : '' ?>>EXPORT</option>
                    <option value="LOGIN" <?= $action === 'LOGIN' ? 'selected' : '' ?>>LOGIN</option>
                    <option value="LOGOUT" <?= $action === 'LOGOUT' ? 'selected' : '' ?>>LOGOUT</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Filtrele</button>
            <a href="audit_log.php" class="btn btn-secondary">Temizle</a>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h2>Değişiklik Geçmişi</h2>
        <span class="record-count"><?= number_format($total) ?> kayıt</span>
    </div>
    <div class="card-body">
        <?php if (empty($logs)): ?>
            <p class="text-muted text-center">Kayıt bulunamadı.</p>
        <?php else: ?>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th width="150">Tarih</th>
                            <th width="100">Kullanıcı</th>
                            <th width="100">İşlem</th>
                            <th width="80">Kayıt ID</th>
                            <th>Detaylar</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logs as $log): ?>
                        <tr>
                            <td><?= date('d.m.Y H:i:s', strtotime($log['created_at'])) ?></td>
                            <td><?= e($log['username'] ?? '-') ?></td>
                            <td>
                                <span class="badge badge-<?= strtolower($log['action']) ?>">
                                    <?= e($log['action']) ?>
                                </span>
                            </td>
                            <td>
                                <?php if ($log['record_id']): ?>
                                    #<?= $log['record_id'] ?>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php
                                $details = '';
                                
                                if ($log['action'] === 'DELETE' && $log['old_data']) {
                                    $oldData = json_decode($log['old_data'], true);
                                    if ($oldData) {
                                        $details = 'Silinen: ' . ($oldData['ders_adi'] ?? '-');
                                    }
                                } elseif ($log['action'] === 'CREATE' && $log['new_data']) {
                                    $newData = json_decode($log['new_data'], true);
                                    if ($newData) {
                                        $details = 'Oluşturulan: ' . ($newData['ders_adi'] ?? '-');
                                    }
                                } elseif ($log['action'] === 'UPDATE' && $log['new_data']) {
                                    $newData = json_decode($log['new_data'], true);
                                    if ($newData) {
                                        $details = 'Güncellenen: ' . ($newData['ders_adi'] ?? '-');
                                    }
                                } elseif ($log['action'] === 'EXPORT' && $log['new_data']) {
                                    $newData = json_decode($log['new_data'], true);
                                    if ($newData) {
                                        $details = $newData['record_count'] . ' kayıt, v' . ($newData['version'] ?? '-');
                                    }
                                }
                                
                                echo e($details);
                                ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
            <?= renderPagination($page, $totalPages, $baseUrl) ?>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

