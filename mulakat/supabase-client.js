// Supabase Configuration
const SUPABASE_URL = 'https://hixpdivutqbkeovvjdhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHBkaXZ1dHFia2VvdnZqZGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE0MjEsImV4cCI6MjA4NjMyNzQyMX0.iL3UPA2AjG9Ex9DLSnPAFYj87XlOiGTxaKNRE8RcLi4';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

// ===== Auth =====
function getCurrentUser() {
  const raw = sessionStorage.getItem('current_user');
  return raw ? JSON.parse(raw) : null;
}

function getUserId() {
  const u = getCurrentUser();
  return u ? u.id : null;
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

function checkAuth() {
  if (sessionStorage.getItem('logged_in') !== 'true') {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ===== Login (hashed via RPC) =====
async function loginUser(kullanici_adi, sifre) {
  const { data, error } = await getSupabase()
    .rpc('login_user', { p_kullanici_adi: kullanici_adi, p_sifre: sifre });
  if (error) throw new Error('Kullanıcı adı veya şifre hatalı!');
  return data;
}

// ===== User CRUD (hashed via RPC) =====
async function fetchUsers() {
  const { data, error } = await getSupabase()
    .from('mulakat_users')
    .select('id, ad, soyad, kullanici_adi, role, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createUser({ ad, soyad, kullanici_adi, sifre, role = 'user' }) {
  const { data, error } = await getSupabase()
    .rpc('create_user_hashed', {
      p_ad: ad, p_soyad: soyad, p_kullanici_adi: kullanici_adi, p_sifre: sifre, p_role: role
    });
  if (error) throw error;
  return data;
}

async function updateUser(id, { ad, soyad, kullanici_adi, sifre }) {
  const { data, error } = await getSupabase()
    .rpc('update_user_hashed', {
      p_id: id, p_ad: ad, p_soyad: soyad, p_kullanici_adi: kullanici_adi, p_sifre: sifre || null
    });
  if (error) throw error;
  return data;
}

async function deleteUser(id) {
  const { error } = await getSupabase()
    .from('mulakat_users')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===== Questions CRUD (filtered by user_id) =====
async function fetchQuestions({ category = null, search = null, orderBy = 'display_order' } = {}) {
  const uid = getUserId();
  let query = getSupabase()
    .from('mulakat_questions')
    .select('*')
    .eq('user_id', uid)
    .order(orderBy, { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`question.ilike.%${search}%,model_answer.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchQuestionById(id) {
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createQuestion({ category, question, model_answer, vocabulary_hints = [], display_order = 0 }) {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .insert([{ category, question, model_answer, vocabulary_hints, display_order, user_id: uid }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateQuestion(id, updates) {
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteQuestion(id) {
  const { error } = await getSupabase()
    .from('mulakat_questions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function bulkInsertQuestions(questions) {
  const uid = getUserId();
  const withUser = questions.map(q => ({ ...q, user_id: uid }));
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .insert(withUser)
    .select();
  if (error) throw error;
  return data;
}

async function fetchCategories() {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .select('category')
    .eq('user_id', uid);
  if (error) throw error;
  const unique = [...new Set((data || []).map(d => d.category))];
  return unique.sort();
}

// ===== Practice History (filtered by user_id) =====
async function savePracticeSession({ answers, feedback, total_questions, answered_count }) {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('practice_history')
    .insert([{ answers, feedback, total_questions, answered_count, user_id: uid }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchPracticeHistory() {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('practice_history')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deletePracticeSession(id) {
  const { error } = await getSupabase()
    .from('practice_history')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===== AI Interview CRUD =====
async function createAIInterview(topic) {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('ai_interviews')
    .insert([{ user_id: uid, topic, conversation: [], status: 'active' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateAIInterview(id, updates) {
  const { data, error } = await getSupabase()
    .from('ai_interviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchAIInterviews() {
  const uid = getUserId();
  const { data, error } = await getSupabase()
    .from('ai_interviews')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteAIInterview(id) {
  const { error } = await getSupabase()
    .from('ai_interviews')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===== Toast Utility =====
function showToast(message, duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
