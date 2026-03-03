<?php
/**
 * Admin Dashboard
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

requireAuth();

$pageTitle = 'Dashboard';
$stats = getStats();
$recentChanges = getRecentChanges(10);

include __DIR__ . '/templates/header.php';
?>

<div class="dashboard-grid">
    <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
            <h3>Toplam Kayıt</h3>
            <p class="stat-number"><?= number_format($stats['total']) ?></p>
        </div>
    </div>
    
    <?php foreach ($stats['byProgram'] as $program): ?>
    <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
            <h3><?= e($program['program_turu'] ?: 'Belirsiz') ?></h3>
            <p class="stat-number"><?= number_format($program['count']) ?></p>
        </div>
    </div>
    <?php endforeach; ?>
    
    <div class="stat-card">
        <div class="stat-icon">📤</div>
        <div class="stat-content">
            <h3>Son Export</h3>
            <p class="stat-date">
                <?php if ($stats['lastExport']): ?>
                    <?= date('d.m.Y H:i', strtotime($stats['lastExport'])) ?>
                <?php else: ?>
                    Henüz yapılmadı
                <?php endif; ?>
            </p>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h2>Hızlı İşlemler</h2>
    </div>
    <div class="card-body">
        <div class="quick-actions">
            <a href="record_form.php" class="btn btn-primary">➕ Yeni Kayıt Ekle</a>
            <a href="records.php" class="btn btn-secondary">📋 Kayıtları Görüntüle</a>
            <a href="export.php" class="btn btn-success">📤 JSON Oluştur</a>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h2>Son Değişiklikler</h2>
    </div>
    <div class="card-body">
        <?php if (empty($recentChanges)): ?>
            <p class="text-muted">Henüz değişiklik yok.</p>
        <?php else: ?>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Kullanıcı</th>
                        <th>İşlem</th>
                        <th>Kayıt ID</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recentChanges as $change): ?>
                    <tr>
                        <td><?= date('d.m.Y H:i', strtotime($change['created_at'])) ?></td>
                        <td><?= e($change['username'] ?? '-') ?></td>
                        <td>
                            <span class="badge badge-<?= strtolower($change['action']) ?>">
                                <?= e($change['action']) ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($change['record_id']): ?>
                                <a href="record_form.php?id=<?= $change['record_id'] ?>">#<?= $change['record_id'] ?></a>
                            <?php else: ?>
                                -
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/templates/footer.php'; ?>

