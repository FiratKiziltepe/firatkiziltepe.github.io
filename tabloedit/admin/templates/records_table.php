<?php
/**
 * Kayıt Tablosu Template (AJAX için ayrı)
 */
?>
<?php if (empty($records)): ?>
    <p class="text-muted text-center">Kayıt bulunamadı.</p>
<?php else: ?>
    <div class="table-container">
        <table class="data-table records-table" id="recordsTable">
            <thead>
                <tr>
                    <th class="col-checkbox">
                        <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                    </th>
                    <th class="col-sira">SIRA NO</th>
                    <th class="col-ders">DERS ADI</th>
                    <th class="col-unite">ÜNİTE/TEMA/ ÖĞRENME ALANI</th>
                    <th class="col-kazanim">KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM</th>
                    <th class="col-eicerik">E-İÇERİK TÜRÜ</th>
                    <th class="col-aciklama">AÇIKLAMA</th>
                    <th class="col-program">Program Türü</th>
                    <th class="col-islem">İŞLEMLER</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($records as $record): ?>
                <tr>
                    <td class="col-checkbox">
                        <input type="checkbox" name="ids[]" value="<?= $record['id'] ?>" 
                               class="row-checkbox" onchange="updateBulkActions()">
                    </td>
                    <td class="col-sira"><?= e($record['sira_no'] ?? '') ?></td>
                    <td class="col-ders"><?= e($record['ders_adi']) ?></td>
                    <td class="col-unite"><?= e($record['unite_tema'] ?? '') ?></td>
                    <td class="col-kazanim"><?= e($record['kazanim'] ?? '') ?></td>
                    <td class="col-eicerik"><?= e($record['eicerik_turu'] ?? '') ?></td>
                    <td class="col-aciklama"><?= e($record['aciklama'] ?? '') ?></td>
                    <td class="col-program">
                        <span class="badge badge-<?= $record['program_turu'] === 'TYMM' ? 'primary' : 'secondary' ?>">
                            <?= e($record['program_turu'] ?: '-') ?>
                        </span>
                    </td>
                    <td class="col-islem">
                        <a href="record_form.php?id=<?= $record['id'] ?>" class="btn btn-sm btn-secondary" title="Düzenle">✏️</a>
                        <a href="record_delete.php?id=<?= $record['id'] ?>&csrf=<?= e(generateCSRFToken()) ?>" 
                           class="btn btn-sm btn-danger btn-delete" title="Sil">🗑️</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>
