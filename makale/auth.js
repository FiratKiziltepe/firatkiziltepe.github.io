// ============================================================
// Authentication & Role Management
// ============================================================

let currentUser = null;
let currentProfile = null;

// =====================================================
// PAGE SWITCHING
// =====================================================

function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('app').classList.remove('flex');
}

function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('app').classList.add('flex');
}

// =====================================================
// AUTH OPERATIONS
// =====================================================

async function login(email, password) {
  // #region agent log
  console.log('[DEBUG] login() start', { email });
  // #endregion
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  // #region agent log
  console.log('[DEBUG] signInWithPassword done', { ok: !!data?.user, err: error?.message });
  // #endregion
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error('E-posta veya şifre hatalı');
    throw error;
  }
  currentUser = data.user;
  await loadProfile();
  // #region agent log
  console.log('[DEBUG] login complete', { role: currentProfile?.role });
  // #endregion
  return { user: currentUser, profile: currentProfile };
}

async function checkSession() {
  // #region agent log
  console.log('[DEBUG] checkSession start');
  // #endregion
  try {
    const client = getSupabase();
    if (!client) return false;
    const { data: { session } } = await client.auth.getSession();
    // #region agent log
    console.log('[DEBUG] checkSession result', { hasSession: !!session });
    // #endregion
    if (session) {
      currentUser = session.user;
      await loadProfile();
      return true;
    }
    return false;
  } catch (e) {
    console.error('[DEBUG] checkSession error:', e);
    return false;
  }
}

async function loadProfile() {
  if (!currentUser) return null;
  // #region agent log
  console.log('[DEBUG] loadProfile start', { userId: currentUser.id });
  // #endregion
  try {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    // #region agent log
    console.log('[DEBUG] loadProfile done', { hasData: !!data, err: error?.message, role: data?.role });
    // #endregion
    if (error || !data) {
      currentProfile = {
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.email.split('@')[0],
        role: 'viewer'
      };
    } else {
      currentProfile = data;
    }
  } catch (e) {
    console.error('[DEBUG] loadProfile exception:', e);
    currentProfile = {
      id: currentUser.id,
      email: currentUser.email,
      display_name: currentUser.email.split('@')[0],
      role: 'viewer'
    };
  }
  return currentProfile;
}

// =====================================================
// ROLE HELPERS
// =====================================================

function getUserRole() { return currentProfile?.role || 'viewer'; }
function isAdmin() { return getUserRole() === 'admin'; }
function isAdvisor() { return getUserRole() === 'advisor'; }
function isLoggedIn() { return currentUser !== null; }
function canWrite() { return isAdmin(); }
function canAddNote() { return isAdmin() || isAdvisor(); }

// =====================================================
// AUTH UI
// =====================================================

function updateAuthUI() {
  const adminEls = document.querySelectorAll('.admin-only');
  const advisorEls = document.querySelectorAll('.advisor-only');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');

  if (isLoggedIn() && currentProfile) {
    if (userName) userName.textContent = currentProfile.display_name;
    if (userRole) {
      const roleMap = { admin: 'Yönetici', advisor: 'Danışman', viewer: 'Görüntüleyici' };
      userRole.textContent = roleMap[currentProfile.role] || 'Görüntüleyici';
      const roleColorMap = { admin: 'bg-red-100 text-red-700', advisor: 'bg-amber-100 text-amber-700', viewer: 'bg-blue-100 text-blue-700' };
      userRole.className = `text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColorMap[currentProfile.role] || roleColorMap.viewer}`;
    }
    adminEls.forEach(el => {
      if (isAdmin()) { el.classList.remove('hidden'); el.classList.add('flex'); }
      else { el.classList.add('hidden'); el.classList.remove('flex'); }
    });
    advisorEls.forEach(el => {
      if (canAddNote()) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
  } else {
    adminEls.forEach(el => { el.classList.add('hidden'); el.classList.remove('flex'); });
    advisorEls.forEach(el => el.classList.add('hidden'));
  }

  if (typeof onAuthChange === 'function') onAuthChange();
}

// =====================================================
// SETUP AUTH LISTENERS
// =====================================================

function setupAuthListeners() {
  const client = getSupabase();
  if (!client) { console.error('Supabase client yok'); return; }

  // onAuthStateChange: SADECE dahili state güncelle, AĞIR İŞLEM YOK
  client.auth.onAuthStateChange((event, session) => {
    // #region agent log
    console.log('[DEBUG] onAuthStateChange', { event });
    // #endregion
    if (event === 'TOKEN_REFRESHED' && session) {
      currentUser = session.user;
    }
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginSubmitBtn');

    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Giriş yapılıyor...';

    try {
      await login(email, password);
      updateAuthUI();
      showApp();
      showLoading();
      await loadData();
      // #region agent log
      console.log('[DEBUG] login flow complete, app shown');
      // #endregion
    } catch (err) {
      console.error('[DEBUG] login error:', err);
      errorEl.textContent = err.message || 'Giriş yapılamadı';
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Giriş Yap';
    }
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // #region agent log
    console.log('[DEBUG] logout clicked');
    // #endregion
    currentUser = null;
    currentProfile = null;
    showLoginPage();
    showNotification('Çıkış yapıldı', 'info');
    try {
      await getSupabase().auth.signOut();
    } catch (err) {
      console.error('Logout hatası:', err);
    }
  });

}

// =====================================================
// NOTIFICATION
// =====================================================

function showNotification(msg, type = 'info') {
  const wrap = document.getElementById('notification');
  const text = document.getElementById('notificationText');
  const inner = wrap.querySelector('div');
  text.textContent = msg;
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  inner.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium max-w-sm ${colors[type] || colors.info}`;
  wrap.classList.remove('hidden');
  document.getElementById('notificationClose').onclick = () => wrap.classList.add('hidden');
  setTimeout(() => wrap.classList.add('hidden'), 4000);
}
