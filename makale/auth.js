// ============================================================
// Authentication & Role Management
// ============================================================

let currentUser = null;
let currentProfile = null;

async function login(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error('E-posta veya şifre hatalı');
    throw error;
  }
  currentUser = data.user;
  await loadProfile();
  updateAuthUI();
  return { user: currentUser, profile: currentProfile };
}

async function logout() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
  currentUser = null;
  currentProfile = null;
  updateAuthUI();
}

async function checkSession() {
  try {
    const client = getSupabase();
    if (!client) return false;
    const { data: { session } } = await withLockRetry('checkSession', () => client.auth.getSession());
    if (session) {
      currentUser = session.user;
      await loadProfile();
      updateAuthUI();
      return true;
    }
    updateAuthUI();
    return false;
  } catch (e) {
    console.error('Oturum kontrol hatası:', e);
    updateAuthUI();
    return false;
  }
}

async function loadProfile() {
  if (!currentUser) return null;
  const { data, error } = await withLockRetry('loadProfile', async () => getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single());

  if (error || !data) {
    currentProfile = {
      id: currentUser.id,
      email: currentUser.email,
      display_name: currentUser.email.split('@')[0],
      role: 'viewer'
    };
    return currentProfile;
  }
  currentProfile = data;
  return currentProfile;
}

function getUserRole() {
  return currentProfile?.role || 'viewer';
}

function isAdmin() {
  return getUserRole() === 'admin';
}

function isAdvisor() {
  return getUserRole() === 'advisor';
}

function isLoggedIn() {
  return currentUser !== null;
}

function canWrite() {
  return isAdmin();
}

function canAddNote() {
  return isAdmin() || isAdvisor();
}

// =====================================================
// UI
// =====================================================

function updateAuthUI() {
  const btnLogin = document.getElementById('btnLogin');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');

  if (!btnLogin || !userInfo) return;

  const adminEls = document.querySelectorAll('.admin-only');
  const advisorEls = document.querySelectorAll('.advisor-only');

  if (isLoggedIn() && currentProfile) {
    btnLogin.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userInfo.classList.add('flex');
    userName.textContent = currentProfile.display_name;

    const roleMap = { admin: 'Yönetici', advisor: 'Danışman', viewer: 'Görüntüleyici' };
    userRole.textContent = roleMap[currentProfile.role] || 'Görüntüleyici';

    const roleColorMap = {
      admin: 'bg-red-100 text-red-700',
      advisor: 'bg-amber-100 text-amber-700',
      viewer: 'bg-blue-100 text-blue-700'
    };
    userRole.className = `text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColorMap[currentProfile.role] || roleColorMap.viewer}`;

    adminEls.forEach(el => {
      if (isAdmin()) {
        el.classList.remove('hidden');
        el.classList.add('flex');
      } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
      }
    });

    advisorEls.forEach(el => {
      if (canAddNote()) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  } else {
    btnLogin.classList.remove('hidden');
    userInfo.classList.add('hidden');
    userInfo.classList.remove('flex');
    adminEls.forEach(el => { el.classList.add('hidden'); el.classList.remove('flex'); });
    advisorEls.forEach(el => el.classList.add('hidden'));
  }

  if (typeof onAuthChange === 'function') onAuthChange();
}

function setupAuthListeners() {
  const client = getSupabase();
  if (!client) { console.error('Supabase client yok, auth listener kurulamadı'); return; }

  client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      await loadProfile();
      updateAuthUI();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      updateAuthUI();
    }
  });

  document.getElementById('btnLogin').addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('flex');
    document.getElementById('loginEmail').focus();
  });

  document.getElementById('loginModalClose').addEventListener('click', closeLoginModal);

  document.getElementById('loginModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('loginModal')) closeLoginModal();
  });

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
      closeLoginModal();
      showNotification('Giriş başarılı!', 'success');
    } catch (err) {
      errorEl.textContent = err.message || 'Giriş yapılamadı';
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Giriş Yap';
    }
  });

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await logout();
    showNotification('Çıkış yapıldı', 'info');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLoginModal();
  });
}

function closeLoginModal() {
  const m = document.getElementById('loginModal');
  m.classList.add('hidden');
  m.classList.remove('flex');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
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
