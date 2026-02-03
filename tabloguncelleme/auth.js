/**
 * Authentication ve Yetkilendirme İşlemleri
 * 
 * Kullanıcı Rolleri:
 * - viewer: Sadece görüntüleme (login olmadan da)
 * - editor: Değişiklik önerisi oluşturabilir
 * - chairman: Kendi ders alanında önerileri onaylar/reddeder
 * - admin: Tam yetki
 */

// Mevcut kullanıcı bilgileri (cache)
let currentUser = null;
let currentProfile = null;

// =====================================================
// KİMLİK DOĞRULAMA İŞLEMLERİ
// =====================================================

/**
 * Email ve şifre ile giriş
 */
async function login(email, password) {
    const sb = getSupabase();
    
    try {
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Hata mesajlarını Türkçeleştir
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Email veya şifre hatalı');
            }
            throw error;
        }
        
        currentUser = data.user;
        
        // Profil bilgilerini yükle
        await loadUserProfile();
        
        // UI'ı güncelle
        updateAuthUI();
        
        return { user: currentUser, profile: currentProfile };
        
    } catch (error) {
        console.error('Giriş hatası:', error);
        throw error;
    }
}

/**
 * Çıkış yap
 */
async function logout() {
    const sb = getSupabase();
    
    try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        currentProfile = null;
        
        // UI'ı güncelle
        updateAuthUI();
        
        // Sayfayı yenile
        window.location.reload();
        
    } catch (error) {
        console.error('Çıkış hatası:', error);
        throw error;
    }
}

/**
 * Mevcut oturumu kontrol et
 */
async function checkSession() {
    const sb = getSupabase();
    
    try {
        const { data: { session }, error } = await sb.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            updateAuthUI();
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Oturum kontrol hatası:', error);
        return false;
    }
}

/**
 * Kullanıcı profil bilgilerini yükle
 */
async function loadUserProfile() {
    if (!currentUser) return null;
    
    const sb = getSupabase();
    
    try {
        const { data, error } = await sb
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        currentProfile = data;
        return currentProfile;
        
    } catch (error) {
        console.error('Profil yükleme hatası:', error);
        return null;
    }
}

/**
 * Mevcut kullanıcıyı getir
 */
async function getCurrentUser() {
    if (!currentUser) {
        await checkSession();
    }
    return currentUser;
}

/**
 * Mevcut profili getir
 */
async function getCurrentProfile() {
    if (!currentProfile && currentUser) {
        await loadUserProfile();
    }
    return currentProfile;
}

/**
 * Kullanıcı rolünü getir
 */
function getUserRole() {
    if (!currentProfile) return 'viewer';
    return currentProfile.rol || 'viewer';
}

/**
 * Kullanıcı ders alanını getir
 */
function getUserDersAlani() {
    if (!currentProfile) return null;
    return currentProfile.ders_alani;
}

// =====================================================
// YETKİ KONTROL FONKSİYONLARI
// =====================================================

/**
 * Kullanıcı giriş yapmış mı?
 */
function isLoggedIn() {
    return currentUser !== null;
}

/**
 * Kullanıcı editor mi veya üstü mü?
 */
function canEdit() {
    const role = getUserRole();
    return ['editor', 'chairman', 'admin'].includes(role);
}

/**
 * Kullanıcı chairman mı veya admin mi?
 */
function canApprove() {
    const role = getUserRole();
    return ['chairman', 'admin'].includes(role);
}

/**
 * Kullanıcı admin mi?
 */
function isAdmin() {
    return getUserRole() === 'admin';
}

/**
 * Belirli bir ders için yetki var mı?
 */
function hasAccessToDers(dersAdi) {
    const role = getUserRole();
    
    // Admin her derse erişebilir
    if (role === 'admin') return true;
    
    // Editor ve chairman kendi ders alanına erişebilir
    const dersAlani = getUserDersAlani();
    if (!dersAlani) return false;
    
    // Ders adı, ders alanını içeriyor mu kontrol et
    return dersAdi.toLowerCase().includes(dersAlani.toLowerCase());
}

// =====================================================
// UI GÜNCELLEME FONKSİYONLARI
// =====================================================

/**
 * Auth durumuna göre UI'ı güncelle
 */
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const userRoleSpan = document.getElementById('userRole');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Rol bazlı elementler
    const editorElements = document.querySelectorAll('.editor-only');
    const chairmanElements = document.querySelectorAll('.chairman-only');
    const adminElements = document.querySelectorAll('.admin-only');
    
    if (isLoggedIn() && currentProfile) {
        // Giriş yapılmış
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = currentProfile.ad_soyad;
        if (userRoleSpan) {
            const roleNames = {
                'viewer': 'Görüntüleyici',
                'editor': 'Editör',
                'chairman': 'Komisyon Başkanı',
                'admin': 'Yönetici'
            };
            userRoleSpan.textContent = roleNames[currentProfile.rol] || 'Görüntüleyici';
            userRoleSpan.className = `user-role role-${currentProfile.rol}`;
        }
        
        // Rol bazlı element görünürlüğü
        editorElements.forEach(el => {
            el.style.display = canEdit() ? '' : 'none';
        });
        
        chairmanElements.forEach(el => {
            el.style.display = canApprove() ? '' : 'none';
        });
        
        adminElements.forEach(el => {
            el.style.display = isAdmin() ? '' : 'none';
        });
        
    } else {
        // Giriş yapılmamış
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (userInfo) userInfo.style.display = 'none';
        
        // Tüm rol bazlı elementleri gizle
        editorElements.forEach(el => el.style.display = 'none');
        chairmanElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// =====================================================
// LOGIN MODAL İŞLEMLERİ
// =====================================================

/**
 * Login modalını göster
 */
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('tcKimlik')?.focus();
    }
}

/**
 * Login modalını gizle
 */
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        // Form alanlarını temizle
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (errorDiv) errorDiv.textContent = '';
    }
}

/**
 * Login form submit
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    // Validasyon
    if (!email || !email.includes('@')) {
        errorDiv.textContent = 'Geçerli bir email adresi girin';
        return;
    }
    
    if (!password || password.length < 5) {
        errorDiv.textContent = 'Şifre en az 5 karakter olmalıdır';
        return;
    }
    
    // Loading durumu
    submitBtn.disabled = true;
    submitBtn.textContent = 'Giriş yapılıyor...';
    errorDiv.textContent = '';
    
    try {
        await login(email, password);
        hideLoginModal();
        
        // Başarılı giriş mesajı
        showNotification('Giriş başarılı!', 'success');
        
    } catch (error) {
        errorDiv.textContent = error.message || 'Giriş yapılamadı';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Giriş Yap';
    }
}

// =====================================================
// KULLANICI OLUŞTURMA (Admin için)
// =====================================================

/**
 * Yeni kullanıcı oluştur (Admin paneli için)
 */
async function createUser(tcKimlik, adSoyad, rol, dersAlani = null, email = null) {
    const sb = getSupabase();
    
    // Şifre: Ad soyadın ilk 5 harfi küçük harf
    const password = adSoyad.toLowerCase().replace(/\s/g, '').substring(0, 5);
    
    // E-posta formatı
    const userEmail = email || `${tcKimlik}@eicerik.local`;
    
    try {
        // Supabase Auth ile kullanıcı oluştur
        const { data: authData, error: authError } = await sb.auth.admin.createUser({
            email: userEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                tc_kimlik: tcKimlik,
                ad_soyad: adSoyad,
                rol: rol
            }
        });
        
        if (authError) throw authError;
        
        // Profile güncelle (ders alanı için)
        if (dersAlani) {
            const { error: profileError } = await sb
                .from('profiles')
                .update({ ders_alani: dersAlani })
                .eq('id', authData.user.id);
            
            if (profileError) throw profileError;
        }
        
        return {
            user: authData.user,
            credentials: {
                tcKimlik: tcKimlik,
                password: password
            }
        };
        
    } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        throw error;
    }
}

// =====================================================
// BİLDİRİM FONKSİYONU
// =====================================================

/**
 * Bildirim göster
 */
function showNotification(message, type = 'info') {
    // Mevcut bildirimi kaldır
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Kapat butonu
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
    
    // Otomatik kapat
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// =====================================================
// OTURUM DEĞİŞİKLİĞİ DİNLEYİCİSİ
// =====================================================

/**
 * Auth state değişikliklerini dinle
 */
function setupAuthListener() {
    const sb = getSupabase();
    
    sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            await loadUserProfile();
            updateAuthUI();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            currentProfile = null;
            updateAuthUI();
        }
    });
}

// =====================================================
// SAYFA YÜKLENDİĞİNDE
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Supabase başlat
    initSupabase();
    
    // Auth listener kur
    setupAuthListener();
    
    // Mevcut oturumu kontrol et
    await checkSession();
    
    // Login butonu
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // Logout butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Modal kapat
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', hideLoginModal);
    }
    
    // Modal dışına tıklama
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                hideLoginModal();
            }
        });
    }
    
    // ESC tuşu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideLoginModal();
        }
    });
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        login,
        logout,
        checkSession,
        getCurrentUser,
        getCurrentProfile,
        getUserRole,
        getUserDersAlani,
        isLoggedIn,
        canEdit,
        canApprove,
        isAdmin,
        hasAccessToDers,
        showLoginModal,
        hideLoginModal,
        createUser,
        showNotification
    };
}
