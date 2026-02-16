let editingId = null;
let editingUserId = null;
let excelData = [];

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  loadQuestions();
  loadCategoryFilter();

  // Show users tab if admin
  if (isAdmin()) {
    document.getElementById('tabUsersBtn').classList.remove('hidden');
  }
});

// ===== Tabs =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tabAdd').classList.add('hidden');
  document.getElementById('tabList').classList.add('hidden');
  document.getElementById('tabExcel').classList.add('hidden');
  const tabUsers = document.getElementById('tabUsers');
  if (tabUsers) tabUsers.classList.add('hidden');

  if (tab === 'add') {
    document.querySelectorAll('.tab')[0].classList.add('active');
    document.getElementById('tabAdd').classList.remove('hidden');
  } else if (tab === 'list') {
    document.querySelectorAll('.tab')[1].classList.add('active');
    document.getElementById('tabList').classList.remove('hidden');
    loadQuestions();
  } else if (tab === 'excel') {
    document.querySelectorAll('.tab')[2].classList.add('active');
    document.getElementById('tabExcel').classList.remove('hidden');
  } else if (tab === 'users') {
    document.getElementById('tabUsersBtn').classList.add('active');
    tabUsers.classList.remove('hidden');
    loadUsers();
  }
}

// ===== Vocabulary Rows =====
function addVocabRow(word = '', meaning = '', example = '') {
  const container = document.getElementById('vocabContainer');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;align-items:center;';
  row.innerHTML = `
    <input type="text" class="form-input" placeholder="Kelime" value="${escapeHtml(word)}" style="flex:1;min-width:80px;">
    <input type="text" class="form-input" placeholder="Anlam" value="${escapeHtml(meaning)}" style="flex:1;min-width:80px;">
    <input type="text" class="form-input" placeholder="Örnek cümle (opsiyonel)" value="${escapeHtml(example)}" style="flex:2;min-width:120px;">
    <button class="btn btn-danger btn-sm btn-icon" onclick="this.parentElement.remove()" title="Sil">✕</button>
  `;
  container.appendChild(row);
}

function getVocabData() {
  const rows = document.getElementById('vocabContainer').children;
  const hints = [];
  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    const word = inputs[0].value.trim();
    const meaning = inputs[1].value.trim();
    const example = inputs[2].value.trim();
    if (word) {
      hints.push({ word, meaning, example });
    }
  }
  return hints;
}

function setVocabData(hints) {
  document.getElementById('vocabContainer').innerHTML = '';
  if (hints && hints.length > 0) {
    hints.forEach(h => addVocabRow(h.word || '', h.meaning || '', h.example || ''));
  }
}

// ===== Save Question =====
async function saveQuestion() {
  const category = document.getElementById('fCategory').value.trim() || 'General';
  const question = document.getElementById('fQuestion').value.trim();
  const model_answer = document.getElementById('fAnswer').value.trim();
  const vocabulary_hints = getVocabData();
  const display_order = parseInt(document.getElementById('fOrder').value) || 0;

  if (!question || !model_answer) {
    alert('Soru ve model cevap zorunludur!');
    return;
  }

  try {
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('saveBtn').textContent = 'Kaydediliyor...';

    if (editingId) {
      await updateQuestion(editingId, { category, question, model_answer, vocabulary_hints, display_order });
      showToast('Soru güncellendi');
    } else {
      await createQuestion({ category, question, model_answer, vocabulary_hints, display_order });
      showToast('Soru eklendi');
    }

    clearForm();
  } catch (err) {
    alert('Hata: ' + err.message);
  } finally {
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveBtn').textContent = 'Kaydet';
  }
}

function clearForm() {
  editingId = null;
  document.getElementById('fCategory').value = '';
  document.getElementById('fQuestion').value = '';
  document.getElementById('fAnswer').value = '';
  document.getElementById('fOrder').value = '0';
  document.getElementById('vocabContainer').innerHTML = '';
  document.getElementById('formTitle').textContent = 'Yeni Soru Ekle';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function cancelEdit() {
  clearForm();
}

// ===== Edit Question =====
async function editQuestion(id) {
  try {
    const q = await fetchQuestionById(id);
    editingId = q.id;
    document.getElementById('fCategory').value = q.category || '';
    document.getElementById('fQuestion').value = q.question || '';
    document.getElementById('fAnswer').value = q.model_answer || '';
    document.getElementById('fOrder').value = q.display_order || 0;
    setVocabData(q.vocabulary_hints || []);
    document.getElementById('formTitle').textContent = 'Soruyu Düzenle';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    switchTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

// ===== Delete Question =====
async function removeQuestion(id) {
  if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
  try {
    await deleteQuestion(id);
    showToast('Soru silindi');
    loadQuestions();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

// ===== Load Questions =====
async function loadQuestions() {
  const category = document.getElementById('filterCategory')?.value || 'all';
  try {
    const questions = await fetchQuestions({ category });
    const container = document.getElementById('questionsList');

    if (questions.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Henüz soru eklenmemiş</div></div>';
      return;
    }

    container.innerHTML = questions.map((q, i) => `
      <div class="question-list-item">
        <div class="question-list-text">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:2px;">#${i + 1} · ${escapeHtml(q.category)}</div>
          <div style="font-weight:600;">${escapeHtml(q.question)}</div>
        </div>
        <div class="question-list-actions">
          <button class="btn btn-ghost btn-sm" onclick="editQuestion('${q.id}')" title="Düzenle">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="removeQuestion('${q.id}')" title="Sil">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Sorular yüklenemedi');
  }
}

async function loadCategoryFilter() {
  try {
    const categories = await fetchCategories();
    const select = document.getElementById('filterCategory');
    select.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    categories.forEach(c => {
      select.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
}

// ===== Excel Upload =====
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      if (json.length === 0) {
        alert('Excel dosyası boş!');
        return;
      }

      excelData = json.map((row, i) => ({
        category: row.category || row.Category || row.kategori || 'General',
        question: row.question || row.Question || row.soru || '',
        model_answer: row.model_answer || row.answer || row.Answer || row.cevap || '',
        vocabulary_hints: parseVocabString(row.vocabulary_hints || row.vocabulary || row.kelimeler || ''),
        display_order: i + 1
      })).filter(r => r.question && r.model_answer);

      showPreview();
    } catch (err) {
      alert('Excel okunamadı: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseVocabString(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => {
    const parts = item.trim().split('-').map(s => s.trim());
    return {
      word: parts[0] || '',
      meaning: parts[1] || '',
      example: ''
    };
  }).filter(v => v.word);
}

function showPreview() {
  document.getElementById('previewSection').classList.remove('hidden');
  document.getElementById('previewCount').textContent = excelData.length;

  const tbody = document.querySelector('#previewTable tbody');
  tbody.innerHTML = excelData.map(q => `
    <tr>
      <td>${escapeHtml(q.category)}</td>
      <td>${escapeHtml(q.question)}</td>
      <td>${escapeHtml(q.model_answer.substring(0, 60))}...</td>
      <td>${q.vocabulary_hints.map(v => v.word).join(', ')}</td>
    </tr>
  `).join('');
}

function clearPreview() {
  excelData = [];
  document.getElementById('previewSection').classList.add('hidden');
  document.getElementById('excelFile').value = '';
}

async function uploadExcelData() {
  if (excelData.length === 0) return;

  try {
    await bulkInsertQuestions(excelData);
    showToast(`${excelData.length} soru başarıyla yüklendi!`);
    clearPreview();
    loadCategoryFilter();
  } catch (err) {
    alert('Yükleme hatası: ' + err.message);
  }
}

// ===== User Management (Admin Only) =====
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  document.getElementById('uSifre').value = pwd;
}

async function saveUser() {
  const ad = document.getElementById('uAd').value.trim();
  const soyad = document.getElementById('uSoyad').value.trim();
  const kullanici_adi = document.getElementById('uKullaniciAdi').value.trim();
  const sifre = document.getElementById('uSifre').value.trim();

  if (!ad || !soyad || !kullanici_adi) {
    alert('Ad, soyad ve kullanıcı adı zorunludur!');
    return;
  }

  if (!editingUserId && !sifre) {
    alert('Yeni kullanıcı için şifre zorunludur!');
    return;
  }

  try {
    document.getElementById('userSaveBtn').disabled = true;

    if (editingUserId) {
      await updateUser(editingUserId, { ad, soyad, kullanici_adi, sifre });
      showToast('Kullanıcı güncellendi');
    } else {
      await createUser({ ad, soyad, kullanici_adi, sifre, role: 'user' });
      showToast('Kullanıcı eklendi');
    }

    clearUserForm();
    loadUsers();
  } catch (err) {
    alert('Hata: ' + err.message);
  } finally {
    document.getElementById('userSaveBtn').disabled = false;
  }
}

function clearUserForm() {
  editingUserId = null;
  document.getElementById('uAd').value = '';
  document.getElementById('uSoyad').value = '';
  document.getElementById('uKullaniciAdi').value = '';
  document.getElementById('uSifre').value = '';
  document.getElementById('uSifre').placeholder = 'Şifre';
  document.getElementById('userFormTitle').textContent = 'Yeni Kullanıcı Ekle';
  document.getElementById('userSaveBtn').textContent = 'Kullanıcı Ekle';
  document.getElementById('cancelUserEditBtn').classList.add('hidden');
}

function cancelUserEdit() {
  clearUserForm();
}

function editUser(id, ad, soyad, kullanici_adi) {
  editingUserId = id;
  document.getElementById('uAd').value = ad;
  document.getElementById('uSoyad').value = soyad;
  document.getElementById('uKullaniciAdi').value = kullanici_adi;
  document.getElementById('uSifre').value = '';
  document.getElementById('uSifre').placeholder = 'Boş bırakılırsa değişmez';
  document.getElementById('userFormTitle').textContent = 'Kullanıcıyı Düzenle';
  document.getElementById('userSaveBtn').textContent = 'Güncelle';
  document.getElementById('cancelUserEditBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function removeUser(id, kullanici_adi) {
  if (kullanici_adi === 'admin') {
    alert('Admin hesabı silinemez!');
    return;
  }
  if (!confirm(`"${kullanici_adi}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
  try {
    await deleteUser(id);
    showToast('Kullanıcı silindi');
    loadUsers();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

async function loadUsers() {
  try {
    const users = await fetchUsers();
    const container = document.getElementById('usersList');

    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Henüz kullanıcı yok</div></div>';
      return;
    }

    container.innerHTML = users.map(u => `
      <div class="question-list-item">
        <div class="question-list-text">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:2px;">
            <span class="badge${u.role === 'admin' ? '' : '-success'}" style="font-size:0.7rem;">${u.role === 'admin' ? 'Admin' : 'Kullanıcı'}</span>
          </div>
          <div style="font-weight:600;">${escapeHtml(u.ad)} ${escapeHtml(u.soyad)}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);">@${escapeHtml(u.kullanici_adi)}</div>
        </div>
        <div class="question-list-actions">
          ${u.role !== 'admin' ? `
            <button class="btn btn-ghost btn-sm" onclick="editUser('${u.id}', '${escapeHtml(u.ad)}', '${escapeHtml(u.soyad)}', '${escapeHtml(u.kullanici_adi)}')" title="Düzenle">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="removeUser('${u.id}', '${escapeHtml(u.kullanici_adi)}')" title="Sil">🗑️</button>
          ` : '<span style="font-size:0.75rem;color:var(--text-muted);">Sistem</span>'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Kullanıcılar yüklenemedi');
  }
}

// ===== Utility =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
