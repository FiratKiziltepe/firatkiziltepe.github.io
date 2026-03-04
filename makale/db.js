// ============================================================
// Supabase Client & Database Operations
// ============================================================

const SUPABASE_URL = 'https://vaqgsxkuwbxnoxhxlbqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWdzeGt1d2J4bm94aHhsYnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzIyNTIsImV4cCI6MjA4ODA0ODI1Mn0.obnbrKM7aOrSvpT4vJABOMwEA3x2AfaV4ZWrYQJBC98';

let sb = null;

function isLockAbortError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  const details = String(err?.details || '').toLowerCase();
  return msg.includes('lock broken by another request') || details.includes('lock broken by another request');
}

async function withLockRetry(opName, fn, maxRetries = 2) {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isLockAbortError(err) || i === maxRetries) throw err;
      console.warn(`[${opName}] lock abort, retry ${i + 1}/${maxRetries}`);
    }
  }
  throw lastErr;
}

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
  const client = getSupabase();
  if (!client) throw new Error('Supabase bağlantısı yok');
  return withLockRetry('fetchColumns', async () => {
    const { data, error } = await client
      .from('columns_config')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  });
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
  const client = getSupabase();
  if (!client) throw new Error('Supabase bağlantısı yok');
  return withLockRetry('fetchArticles', async () => {
    const { data, error } = await client
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  });
}

async function createArticle(articleData, rating = 0) {
  return withLockRetry('createArticle', async () => {
    const { data, error } = await getSupabase()
      .from('articles')
      .insert({ data: articleData, rating })
      .select()
      .single();
    if (error) throw error;
    return data;
  });
}

async function updateArticle(id, articleData, rating) {
  const updates = {};
  if (articleData !== undefined) updates.data = articleData;
  if (rating !== undefined) updates.rating = rating;

  return withLockRetry('updateArticle', async () => {
    const { data, error } = await getSupabase()
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      const e = new Error('Güncelleme yetkisi yok veya kayıt bulunamadı');
      e.code = 'PGRST116';
      throw e;
    }
    return data[0];
  });
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
