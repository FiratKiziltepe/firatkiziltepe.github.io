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

// ===== CRUD Operations =====

async function fetchQuestions({ category = null, search = null, orderBy = 'display_order' } = {}) {
  let query = getSupabase()
    .from('mulakat_questions')
    .select('*')
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
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .insert([{ category, question, model_answer, vocabulary_hints, display_order }])
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
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .insert(questions)
    .select();
  if (error) throw error;
  return data;
}

async function fetchCategories() {
  const { data, error } = await getSupabase()
    .from('mulakat_questions')
    .select('category');
  if (error) throw error;
  const unique = [...new Set((data || []).map(d => d.category))];
  return unique.sort();
}

// ===== Auth Guard =====
function checkAuth() {
  if (sessionStorage.getItem('logged_in') !== 'true') {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ===== Practice History =====
async function savePracticeSession({ answers, feedback, total_questions, answered_count }) {
  const { data, error } = await getSupabase()
    .from('practice_history')
    .insert([{ answers, feedback, total_questions, answered_count }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchPracticeHistory() {
  const { data, error } = await getSupabase()
    .from('practice_history')
    .select('*')
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
