// ============================================================
// Authentication & Role Management
// ============================================================

let currentUser = null;
let currentProfile = null;

async function login(email, password) {
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:login-start',message:'login() called',data:{email},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  const client = getSupabase();
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:login-client',message:'getSupabase result',data:{hasClient:!!client},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:login-after-signin',message:'signInWithPassword result',data:{hasData:!!data,hasUser:!!data?.user,errorMsg:error?.message||null},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error('E-posta veya şifre hatalı');
    throw error;
  }
  currentUser = data.user;
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:login-before-profile',message:'about to loadProfile',data:{userId:currentUser?.id},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  await loadProfile();
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:login-after-profile',message:'loadProfile done',data:{profile:currentProfile?.role},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:loadProfile-start',message:'loadProfile query start',data:{userId:currentUser.id},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  let data, error;
  try {
    const result = await withLockRetry('loadProfile', async () => getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single());
    data = result.data;
    error = result.error;
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:loadProfile-exception',message:'loadProfile threw exception',data:{error:e?.message||String(e)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    error = e;
    data = null;
  }
  // #region agent log
  fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:loadProfile-result',message:'loadProfile query done',data:{hasData:!!data,errorMsg:error?.message||null,role:data?.role},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:onAuthStateChange',message:'auth state changed',data:{event,hasSession:!!session},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      // #region agent log
      fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:onAuth-SIGNED_IN-beforeProfile',message:'SIGNED_IN: about to loadProfile',data:{userId:session.user?.id},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      await loadProfile();
      // #region agent log
      fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:onAuth-SIGNED_IN-afterProfile',message:'SIGNED_IN: loadProfile done, about to loadData',data:{profile:currentProfile?.role},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      updateAuthUI();
      if (typeof loadData === 'function') {
        const ls = document.getElementById('loadingState');
        if (ls) ls.classList.remove('hidden');
        await loadData();
      }
      // #region agent log
      fetch('http://127.0.0.1:7920/ingest/49da3808-6d89-4221-81e0-7d70b67e2148',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'93f0e9'},body:JSON.stringify({sessionId:'93f0e9',location:'auth.js:onAuth-SIGNED_IN-done',message:'SIGNED_IN: all done',data:{},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      updateAuthUI();
      if (typeof loadData === 'function') {
        await loadData();
      }
    }
  });

  document.getElementById('btnLogin').addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('flex');
    document.getElementById('loginEmail').focus();
  });

  document.getElementById('loginModalClose').addEventListener('click', closeLoginModal);

  let loginModalMouseDownTarget = null;
  document.getElementById('loginModal').addEventListener('mousedown', (e) => {
    loginModalMouseDownTarget = e.target;
  });
  document.getElementById('loginModal').addEventListener('click', (e) => {
    const modal = document.getElementById('loginModal');
    if (e.target === modal && loginModalMouseDownTarget === modal) {
      closeLoginModal();
    }
    loginModalMouseDownTarget = null;
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

  document.getElementById('btnLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentUser = null;
    currentProfile = null;
    updateAuthUI();
    renderTable();
    showNotification('Çıkış yapıldı', 'info');
    try {
      await getSupabase().auth.signOut();
    } catch (err) {
      console.error('Logout hatası:', err);
    }
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
