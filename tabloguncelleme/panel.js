/**
 * Komisyon Başkanı ve Admin Paneli İşlemleri
 */

// =====================================================
// KOMİSYON BAŞKANI PANELİ
// =====================================================

/**
 * Onay panelini başlat
 */
async function initApprovalPanel() {
    if (!canApprove()) return;
    
    const panel = document.getElementById('approvalPanel');
    if (!panel) return;
    
    panel.style.display = 'block';
    
    // Tab event'leri
    const tabs = panel.querySelectorAll('.panel-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            document.getElementById('pendingChangesList').style.display = tabName === 'changes' ? 'block' : 'none';
            document.getElementById('pendingNewRowsList').style.display = tabName === 'newrows' ? 'block' : 'none';
        });
    });
    
    // Önerileri yükle
    await loadPendingApprovals();
}

/**
 * Bekleyen onayları yükle
 */
async function loadPendingApprovals() {
    if (!canApprove()) return;
    
    const dersAlani = isAdmin() ? null : getUserDersAlani();
    
    try {
        // Değişiklik önerilerini yükle
        const changes = await fetchBekleyenOneriler(dersAlani);
        renderPendingChanges(changes);
        
        // Yeni satır önerilerini yükle
        const newRows = await fetchYeniSatirOnerileri(dersAlani);
        renderPendingNewRows(newRows);
        
    } catch (error) {
        console.error('Öneriler yüklenemedi:', error);
    }
}

/**
 * Değişiklik önerilerini render et
 */
function renderPendingChanges(changes) {
    const container = document.getElementById('pendingChangesList');
    container.innerHTML = '';
    
    if (!changes || changes.length === 0) {
        container.innerHTML = '<p class="no-items">Bekleyen öneri yok</p>';
        return;
    }
    
    const fieldLabels = {
        'aciklama': 'Açıklama',
        'e_icerik_turu': 'E-İçerik Türü',
        'kazanim': 'Kazanım',
        'unite_tema': 'Ünite/Tema'
    };
    
    changes.forEach(change => {
        const item = document.createElement('div');
        item.className = 'pending-item';
        item.innerHTML = `
            <div class="pending-item-header">
                <div class="pending-item-ders">${change.e_icerikler?.ders_adi || 'Bilinmeyen'}</div>
                <div class="pending-item-user">${change.profiles?.ad_soyad || 'Anonim'}</div>
            </div>
            <div class="pending-item-field">${fieldLabels[change.alan] || change.alan}</div>
            <div class="pending-item-old">
                <strong>Eski:</strong> ${change.eski_deger || '(boş)'}
            </div>
            <div class="pending-item-new">
                <strong>Yeni:</strong> ${change.yeni_deger}
            </div>
            <div class="pending-item-actions">
                <button class="btn-approve" onclick="handleApproveChange(${change.id})">
                    ✓ Onayla
                </button>
                <button class="btn-reject" onclick="handleRejectChange(${change.id})">
                    ✗ Reddet
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Yeni satır önerilerini render et
 */
function renderPendingNewRows(rows) {
    const container = document.getElementById('pendingNewRowsList');
    container.innerHTML = '';
    
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="no-items">Bekleyen yeni satır önerisi yok</p>';
        return;
    }
    
    rows.forEach(row => {
        const item = document.createElement('div');
        item.className = 'pending-item';
        item.innerHTML = `
            <div class="pending-item-header">
                <div class="pending-item-ders">${row.ders_adi}</div>
                <div class="pending-item-user">${row.profiles?.ad_soyad || 'Anonim'}</div>
            </div>
            <div class="pending-item-field">Yeni Satır Önerisi</div>
            <div class="pending-item-new">
                <strong>Kazanım:</strong> ${row.kazanim || '-'}<br>
                <strong>E-İçerik:</strong> ${row.e_icerik_turu || '-'}<br>
                <strong>Açıklama:</strong> ${row.aciklama || '-'}
            </div>
            <div class="pending-item-actions">
                <button class="btn-approve" onclick="handleApproveNewRow(${row.id})">
                    ✓ Onayla
                </button>
                <button class="btn-reject" onclick="handleRejectNewRow(${row.id})">
                    ✗ Reddet
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Değişiklik önerisini onayla
 */
async function handleApproveChange(id) {
    if (!canApprove()) return;
    
    try {
        await approveOneri(id);
        showNotification('Öneri onaylandı', 'success');
        await loadPendingApprovals();
        
        // Tabloyu yenile
        if (tableManager) {
            await tableManager.loadPendingChanges();
            tableManager.renderTable();
        }
        
    } catch (error) {
        showNotification('Onaylama hatası: ' + error.message, 'error');
    }
}

/**
 * Değişiklik önerisini reddet
 */
async function handleRejectChange(id) {
    if (!canApprove()) return;
    
    const reason = prompt('Red nedeni (opsiyonel):');
    
    try {
        await rejectOneri(id, reason);
        showNotification('Öneri reddedildi', 'info');
        await loadPendingApprovals();
        
        // Tabloyu yenile
        if (tableManager) {
            await tableManager.loadPendingChanges();
            tableManager.renderTable();
        }
        
    } catch (error) {
        showNotification('Reddetme hatası: ' + error.message, 'error');
    }
}

/**
 * Yeni satır önerisini onayla
 */
async function handleApproveNewRow(id) {
    if (!canApprove()) return;
    
    try {
        await approveYeniSatir(id);
        showNotification('Yeni satır önerisi onaylandı', 'success');
        await loadPendingApprovals();
        
        // Tabloyu yenile
        if (tableManager) {
            await tableManager.loadData();
        }
        
    } catch (error) {
        showNotification('Onaylama hatası: ' + error.message, 'error');
    }
}

/**
 * Yeni satır önerisini reddet
 */
async function handleRejectNewRow(id) {
    if (!canApprove()) return;
    
    const reason = prompt('Red nedeni (opsiyonel):');
    
    try {
        await rejectYeniSatir(id, reason);
        showNotification('Yeni satır önerisi reddedildi', 'info');
        await loadPendingApprovals();
        
    } catch (error) {
        showNotification('Reddetme hatası: ' + error.message, 'error');
    }
}

// =====================================================
// ADMİN PANELİ
// =====================================================

/**
 * Admin panelini başlat
 */
async function initAdminPanel() {
    if (!isAdmin()) return;
    
    const panel = document.getElementById('adminPanel');
    if (!panel) return;
    
    panel.style.display = 'block';
    
    // Logları yükle
    await loadChangeLogs();
}

/**
 * Değişiklik loglarını yükle
 */
async function loadChangeLogs() {
    if (!isAdmin()) return;
    
    try {
        const logs = await fetchDegisiklikLoglari(50);
        renderChangeLogs(logs);
        
    } catch (error) {
        console.error('Loglar yüklenemedi:', error);
    }
}

/**
 * Değişiklik loglarını render et
 */
function renderChangeLogs(logs) {
    const container = document.getElementById('changeLogList');
    container.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="no-items">Henüz değişiklik logu yok</p>';
        return;
    }
    
    const typeLabels = {
        'create': 'Oluşturma',
        'update': 'Güncelleme',
        'delete': 'Silme',
        'approve': 'Onay',
        'reject': 'Red'
    };
    
    logs.forEach(log => {
        const date = new Date(log.created_at);
        const formattedDate = date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerHTML = `
            <div class="log-item-header">
                <span class="log-item-type ${log.islem_tipi}">${typeLabels[log.islem_tipi] || log.islem_tipi}</span>
                <span class="log-item-time">${formattedDate}</span>
            </div>
            <div class="log-item-user">${log.profiles?.ad_soyad || 'Sistem'}</div>
            <div class="log-item-content">
                ${log.e_icerikler?.ders_adi || ''} 
                ${log.alan ? `- ${log.alan}` : ''}
                ${log.aciklama ? `<br><em>${log.aciklama}</em>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

// =====================================================
// CHAIRMAN DOĞRUDAN DÜZENLEME
// =====================================================

/**
 * Chairman için doğrudan düzenleme modalı
 */
function openChairmanEditModal(eIcerikId, field, currentValue) {
    if (!canApprove()) return;
    
    const newValue = prompt(`${field} için yeni değer:`, currentValue);
    
    if (newValue !== null && newValue !== currentValue) {
        updateEIcerikDirect(eIcerikId, field, newValue);
    }
}

/**
 * E-içeriği doğrudan güncelle (Chairman/Admin)
 */
async function updateEIcerikDirect(id, field, newValue) {
    if (!canApprove()) return;
    
    try {
        const updates = {};
        updates[field] = newValue;
        
        await updateEIcerik(id, updates);
        showNotification('Güncelleme başarılı', 'success');
        
        // Tabloyu yenile
        if (tableManager) {
            await tableManager.loadData();
        }
        
    } catch (error) {
        showNotification('Güncelleme hatası: ' + error.message, 'error');
    }
}

// =====================================================
// AUTH STATE DEĞİŞİKLİĞİNDE PANELLERİ GÜNCELLE
// =====================================================

// Auth durumu değiştiğinde panelleri başlat
document.addEventListener('DOMContentLoaded', () => {
    // Auth yüklendikten sonra panelleri kontrol et
    setTimeout(async () => {
        if (isLoggedIn()) {
            await initApprovalPanel();
            await initAdminPanel();
        }
    }, 1000);
});

// Supabase auth state listener
if (typeof getSupabase !== 'undefined') {
    try {
        const sb = getSupabase();
        if (sb) {
            sb.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN') {
                    setTimeout(async () => {
                        await initApprovalPanel();
                        await initAdminPanel();
                    }, 500);
                } else if (event === 'SIGNED_OUT') {
                    // Panelleri gizle
                    const approvalPanel = document.getElementById('approvalPanel');
                    const adminPanel = document.getElementById('adminPanel');
                    if (approvalPanel) approvalPanel.style.display = 'none';
                    if (adminPanel) adminPanel.style.display = 'none';
                }
            });
        }
    } catch (e) {
        // Supabase henüz yüklenmemiş olabilir
    }
}
