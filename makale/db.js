// ============================================================
// Supabase Client & Database Operations
// ============================================================

const SUPABASE_URL = 'https://vaqgsxkuwbxnoxhxlbqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWdzeGt1d2J4bm94aHhsYnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzIyNTIsImV4cCI6MjA4ODA0ODI1Mn0.obnbrKM7aOrSvpT4vJABOMwEA3x2AfaV4ZWrYQJBC98';

let sb = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('Supabase JS kütüphanesi yüklenmedi!');
    return null;
  }
  if (!sb) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return sb;
}

function getSupabase() {
  return sb || initSupabase();
}

// =====================================================
// COLUMNS CONFIG
// =====================================================

async function fetchColumns() {
  const { data, error } = await getSupabase()
    .from('columns_config')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

async function createColumn(col) {
  const { data, error } = await getSupabase()
    .from('columns_config')
    .insert(col)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateColumn(id, updates) {
  const { data, error } = await getSupabase()
    .from('columns_config')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteColumn(id) {
  const { error } = await getSupabase()
    .from('columns_config')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// =====================================================
// ARTICLES
// =====================================================

async function fetchArticles() {
  const { data, error } = await getSupabase()
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createArticle(articleData, rating = 0) {
  const { data, error } = await getSupabase()
    .from('articles')
    .insert({ data: articleData, rating })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateArticle(id, articleData, rating) {
  const updates = {};
  if (articleData !== undefined) updates.data = articleData;
  if (rating !== undefined) updates.rating = rating;

  const { data, error } = await getSupabase()
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteArticle(id) {
  const { error } = await getSupabase()
    .from('articles')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function updateArticleRating(id, rating) {
  return updateArticle(id, undefined, rating);
}

// Toplu makale ekleme (Excel paste)
async function createArticlesBatch(articles) {
  const { data, error } = await getSupabase()
    .from('articles')
    .insert(articles)
    .select();
  if (error) throw error;
  return data;
}

// =====================================================
// ADVISOR NOTES
// =====================================================

async function fetchAdvisorNotes(articleId) {
  const { data, error } = await getSupabase()
    .from('advisor_notes')
    .select('*, profiles(display_name, role)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createAdvisorNote(articleId, advisorId, note) {
  const { data, error } = await getSupabase()
    .from('advisor_notes')
    .insert({ article_id: articleId, advisor_id: advisorId, note })
    .select('*, profiles(display_name, role)')
    .single();
  if (error) throw error;
  return data;
}

async function deleteAdvisorNote(noteId) {
  const { error } = await getSupabase()
    .from('advisor_notes')
    .delete()
    .eq('id', noteId);
  if (error) throw error;
}
