import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Profile, DegisiklikLogu, EIcerik } from '../lib/supabase';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { Users, History, Database, X, Check, UserPlus, Edit2, Trash2, Save, BookOpen, AlertTriangle, Upload, Search, FileJson, FileSpreadsheet, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  users: Profile[];
  logs: DegisiklikLogu[];
  data: EIcerik[];
  onRefresh: () => Promise<void>;
  profile: Profile;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, logs, data, onRefresh, profile }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newUser, setNewUser] = useState({
    kullanici_adi: '', sifre: '', ad_soyad: '', brans: '', rol: 'teacher' as string, atanan_dersler: '' as string
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [allLessons, setAllLessons] = useState<string[]>([]);
  const [assignedLessons, setAssignedLessons] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<Partial<Profile>>({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Şifre yönetimi
  const [showPasswordModal, setShowPasswordModal] = useState<{ open: boolean; user: Profile | null }>({ open: false, user: null });
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [resetAllPwModal, setResetAllPwModal] = useState(false);
  const [resetAllPwLoading, setResetAllPwLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // DB CRUD states
  const [showDeleteLessonModal, setShowDeleteLessonModal] = useState(false);
  const [deleteLessonName, setDeleteLessonName] = useState('');
  const [deleteLessonProgram, setDeleteLessonProgram] = useState('Tümü');
  const [deletingLesson, setDeletingLesson] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Başlık satırı değerleri (header row values from Excel)
  const HEADER_ROW_VALUES = ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA', 'KAZANIM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'PROGRAM TÜRÜ', 'Program Türü',
    'sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu',
    'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'KAZANIM/ÇIKTI'];

  useEffect(() => {
    supabase.from('e_icerikler').select('ders_adi').then(({ data }) => {
      if (data) {
        const unique = Array.from(new Set(data.map((d: any) => d.ders_adi)))
          .filter(name => name && !HEADER_ROW_VALUES.includes(name))
          .sort((a, b) => a.localeCompare(b, 'tr')) as string[];
        setAllLessons(unique);
      }
    });
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.kullanici_adi || !newUser.sifre || !newUser.ad_soyad) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    if (newUser.sifre.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setCreating(true);
    setError('');

    try {
      // Önce session'ı yenilemeyi dene
      const { data: refreshData } = await supabase.auth.refreshSession();
      const token = refreshData?.session?.access_token;

      if (!token) {
        // Refresh başarısızsa mevcut session'ı dene
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Oturumunuz sona ermiş. Lütfen çıkış yapıp tekrar giriş yapın.');
          setCreating(false);
          return;
        }
      }

      const activeToken = token || (await supabase.auth.getSession()).data.session?.access_token;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          kullanici_adi: newUser.kullanici_adi,
          sifre: newUser.sifre,
          ad_soyad: newUser.ad_soyad,
          brans: newUser.brans,
          rol: newUser.rol,
          atanan_dersler: newUser.atanan_dersler.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('Oturumunuz sona ermiş. Lütfen çıkış yapıp tekrar giriş yapın.');
        } else {
          setError(result.error || 'Kullanıcı oluşturulamadı.');
        }
      } else {
        setShowModal(false);
        setNewUser({ kullanici_adi: '', sifre: '', ad_soyad: '', brans: '', rol: 'teacher', atanan_dersler: '' });
        await onRefresh();
      }
    } catch (err: any) {
      setError('Bağlantı hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
    setCreating(false);
  };

  const openAssignModal = (user: Profile) => {
    setSelectedUser(user);
    setAssignedLessons([...user.atanan_dersler]);
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedUser) return;
    await supabase.from('profiles').update({ atanan_dersler: assignedLessons }).eq('id', selectedUser.id);
    setShowAssignModal(false);
    await onRefresh();
  };

  const toggleLesson = (lesson: string) => {
    setAssignedLessons(prev => prev.includes(lesson) ? prev.filter(l => l !== lesson) : [...prev, lesson]);
  };

  const startEditUser = (user: Profile) => {
    setEditingUserId(user.id);
    setEditUser({ ad_soyad: user.ad_soyad, brans: user.brans, rol: user.rol });
  };

  const handleSaveUserEdit = async () => {
    if (!editingUserId) return;
    await supabase.from('profiles').update({
      ad_soyad: editUser.ad_soyad,
      brans: editUser.brans,
      rol: editUser.rol,
    }).eq('id', editingUserId);
    setEditingUserId(null);
    await onRefresh();
  };

  // Ders bazlı toplu silme
  const handleDeleteLesson = async () => {
    if (!deleteLessonName) return;
    setDeletingLesson(true);
    try {
      let query = supabase.from('e_icerikler').delete().eq('ders_adi', deleteLessonName);
      if (deleteLessonProgram !== 'Tümü') {
        query = query.eq('program_turu', deleteLessonProgram);
      }
      const { error } = await query;
      if (error) throw error;
      setShowDeleteLessonModal(false);
      setDeleteLessonName('');
      await onRefresh();
    } catch (err: any) {
      alert('Silme hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
    setDeletingLesson(false);
  };

  // JSON veya Excel dosyası yükleme
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress('Dosya okunuyor...');

    try {
      let jsonData: any[];
      const fileName = uploadFile.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.xlsm');

      if (isExcel) {
        // Excel dosyası parse
        try {
          const buffer = await uploadFile.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        } catch {
          alert('Geçersiz Excel dosyası! (.xlsx, .xls formatları desteklenir)');
          setUploading(false);
          return;
        }
      } else {
        // JSON dosyası parse
        try {
          const text = await uploadFile.text();
          const parsed = JSON.parse(text);
          jsonData = Array.isArray(parsed) ? parsed : (parsed.data || parsed.rows || parsed.items || [parsed]);
        } catch {
          alert('Geçersiz JSON dosyası!');
          setUploading(false);
          return;
        }
      }

      // Başlık satırlarını filtrele (Excel'den dönüştürülmüş JSON'da olabilir)
      const HEADER_VALUES = ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA', 'KAZANIM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'PROGRAM TÜRÜ', 'Program Türü',
        'sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu',
        'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'KAZANIM/ÇIKTI'];
      jsonData = jsonData.filter((row: any) => {
        // ders_adi veya DERS ADI değeri bir başlık ismiyse bu satır başlık satırıdır
        const dersAdi = row.ders_adi || row['DERS ADI'] || '';
        return !HEADER_VALUES.includes(dersAdi);
      });

      if (jsonData.length === 0) {
        alert('Dosyada veri bulunamadı! (Başlık satırları filtrelendi)');
        setUploading(false);
        return;
      }

      // Replace modunda önce tüm tabloyu sil
      if (uploadMode === 'replace') {
        setUploadProgress('Mevcut veriler siliniyor...');
        // Önce önerileri sil
        await Promise.all([
          supabase.from('degisiklik_onerileri').delete().neq('id', 0),
          supabase.from('yeni_satir_onerileri').delete().neq('id', 0),
          supabase.from('silme_talepleri').delete().neq('id', 0),
          supabase.from('degisiklik_loglari').delete().neq('id', 0),
        ]);
        await supabase.from('e_icerikler').delete().neq('id', 0);
      }

      // Batch insert (500'erli)
      const BATCH = 500;
      let inserted = 0;
      for (let i = 0; i < jsonData.length; i += BATCH) {
        const batch = jsonData.slice(i, i + BATCH).map((row: any, idx: number) => {
          // Sütun isimlerini esnek şekilde bul (Türkçe karakterler, büyük/küçük harf farkı)
          const getValue = (keys: string[]) => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return row[key];
              }
            }
            return null;
          };

          // sira_no: integer'a çevir
          const siraNoRaw = getValue(['sira_no', 'SIRA NO', 'SIRA_NO', 'siraNo', 'SiraNo']);
          const siraNo = siraNoRaw !== null ? (typeof siraNoRaw === 'number' ? siraNoRaw : parseInt(String(siraNoRaw), 10)) : (i + idx + 1);
          
          // unite_tema: farklı sütun isimlerini dene
          const uniteTema = getValue(['unite_tema', 'ÜNİTE/TEMA', 'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'uniteTema', 'UniteTema']) || '';
          
          // kazanim: farklı sütun isimlerini dene
          const kazanim = getValue(['kazanim', 'KAZANIM/ÇIKTI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'kazanimCikti', 'KazanimCikti']) || '';
          
          // program_turu: büyük/küçük harf farkını dikkate al
          const programTuru = getValue(['program_turu', 'PROGRAM TÜRÜ', 'Program Türü', 'programTuru', 'ProgramTuru']) || 'TYMM';

          return {
            sira_no: isNaN(siraNo) ? (i + idx + 1) : siraNo,
            ders_adi: getValue(['ders_adi', 'DERS ADI', 'dersAdi', 'DersAdi']) || '',
            unite_tema: uniteTema,
            kazanim: kazanim,
            e_icerik_turu: getValue(['e_icerik_turu', 'E-İÇERİK TÜRÜ', 'eIcerikTuru', 'EIcerikTuru']) || '',
            aciklama: getValue(['aciklama', 'AÇIKLAMA', 'Aciklama']) || '',
            program_turu: programTuru,
          };
        });
        const { error } = await supabase.from('e_icerikler').insert(batch);
        if (error) throw error;
        inserted += batch.length;
        setUploadProgress(`${inserted} / ${jsonData.length} satır yüklendi...`);
      }

      setUploadProgress('');
      setShowUploadModal(false);
      setUploadFile(null);
      await onRefresh();
      alert(`${inserted} satır başarıyla yüklendi!`);
    } catch (err: any) {
      alert('Yükleme hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
    setUploading(false);
    setUploadProgress('');
  };

  const handleResetAllProposals = async () => {
    setResetting(true);
    try {
      await Promise.all([
        supabase.from('degisiklik_onerileri').delete().neq('id', 0),
        supabase.from('yeni_satir_onerileri').delete().neq('id', 0),
        supabase.from('silme_talepleri').delete().neq('id', 0),
        supabase.from('degisiklik_loglari').delete().neq('id', 0),
      ]);
      setShowResetModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('Sıfırlama hatası: ' + (err.message || 'Bilinmeyen hata'));
    }
    setResetting(false);
  };

  const handleAdminChangePassword = async () => {
    if (!showPasswordModal.user || !newPasswordValue || newPasswordValue.length < 6) return;
    setPasswordSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'admin_change_password', user_id: showPasswordModal.user.id, new_password: newPasswordValue }),
      });
      const result = await res.json();
      if (!res.ok) { alert('Hata: ' + (result.error || 'Şifre değiştirilemedi')); }
      else {
        alert('Şifre başarıyla değiştirildi!');
        setShowPasswordModal({ open: false, user: null });
        setNewPasswordValue('');
        await onRefresh();
      }
    } catch (err: any) { alert('Bağlantı hatası: ' + err.message); }
    setPasswordSaving(false);
  };

  const handleResetAllPasswords = async () => {
    setResetAllPwLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'reset_all_passwords' }),
      });
      const result = await res.json();
      if (!res.ok) { alert('Hata: ' + (result.error || 'Sıfırlama başarısız')); }
      else {
        const msg = `${result.updated}/${result.total} kullanıcının şifresi sıfırlandı.${result.errors?.length > 0 ? '\n\nHatalar:\n' + result.errors.join('\n') : ''}`;
        alert(msg);
        setResetAllPwModal(false);
        await onRefresh();
      }
    } catch (err: any) { alert('Bağlantı hatası: ' + err.message); }
    setResetAllPwLoading(false);
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const term = userSearch.toLowerCase();
    return users.filter(u => u.ad_soyad.toLowerCase().includes(term) || u.kullanici_adi.toLowerCase().includes(term) || u.brans.toLowerCase().includes(term));
  }, [users, userSearch]);

  const rolLabels: Record<string, string> = { admin: 'ADMİN', moderator: 'MODERATÖR', teacher: 'ÖĞRETMEN' };
  const rolColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', moderator: 'bg-amber-100 text-amber-700', teacher: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sistem Yönetimi</h2>
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Users size={16} /></div>
            <span>{users.length} Kullanıcı</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Database size={16} /></div>
            <span>{data.length} İçerik Satırı</span>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm flex items-center gap-2 uppercase tracking-widest"
          >
            <Trash2 size={14} /> Tüm Önerileri Sıfırla
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Kullanıcı Yönetimi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 flex-wrap gap-2">
            <h3 className="text-lg font-black text-slate-700 flex items-center gap-3"><Users size={22} className="text-blue-600" /> Kullanıcı Yönetimi</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <input type="text" placeholder="Kullanıcı ara..." className="border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium w-44 focus:ring-2 focus:ring-blue-400 outline-none" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
              <button onClick={() => setShowPasswords(!showPasswords)} className={`px-3 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 transition-all ${showPasswords ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white'}`}>
                {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />} Şifreler
              </button>
              <button onClick={() => setResetAllPwModal(true)} className="px-3 py-2 bg-orange-50 text-orange-600 text-xs font-black rounded-xl hover:bg-orange-500 hover:text-white transition-all border border-orange-200 flex items-center gap-1.5">
                <RefreshCw size={13} /> Tüm Şifreleri Sıfırla
              </button>
              <button onClick={() => setShowModal(true)} className="px-3 py-2 bg-blue-50 text-blue-600 text-xs font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-1.5">
                <UserPlus size={13} /> Yeni Ekle
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı / Branş</th>
                  <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rol</th>
                  {showPasswords && <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Şifre</th>}
                  <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dersler</th>
                  <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {editingUserId === u.id ? (
                        <div className="space-y-1">
                          <input className="w-full border border-blue-300 p-1 rounded text-sm font-bold" value={editUser.ad_soyad || ''} onChange={e => setEditUser({ ...editUser, ad_soyad: e.target.value })} />
                          <input className="w-full border border-blue-300 p-1 rounded text-xs" value={editUser.brans || ''} onChange={e => setEditUser({ ...editUser, brans: e.target.value })} />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-extrabold text-slate-800">{u.ad_soyad}</p>
                          <p className="text-[11px] text-slate-400 font-bold">{u.kullanici_adi} · {u.brans}</p>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {editingUserId === u.id ? (
                        <select className="border border-blue-300 p-1 rounded text-xs font-bold" value={editUser.rol || 'teacher'} onChange={e => setEditUser({ ...editUser, rol: e.target.value as any })}>
                          <option value="teacher">Öğretmen</option>
                          <option value="moderator">Moderatör</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${rolColors[u.rol]}`}>{rolLabels[u.rol]}</span>
                      )}
                    </td>
                    {showPasswords && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{u.sifre || '—'}</code>
                          <button onClick={() => { setShowPasswordModal({ open: true, user: u }); setNewPasswordValue(''); }} className="p-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-500 hover:text-white transition-all" title="Şifre Değiştir"><Key size={11} /></button>
                        </div>
                        {u.sifre_degistirildi && <span className="text-[8px] text-emerald-500 font-bold">✓ Değiştirildi</span>}
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.atanan_dersler.length > 0 ? u.atanan_dersler.slice(0, 3).map(l => (
                          <span key={l} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded-md border border-slate-200 uppercase">{l}</span>
                        )) : <span className="text-[10px] text-slate-300 italic">—</span>}
                        {u.atanan_dersler.length > 3 && <span className="text-[9px] text-blue-500 font-bold">+{u.atanan_dersler.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {editingUserId === u.id ? (
                          <>
                            <button onClick={handleSaveUserEdit} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Save size={13} /></button>
                            <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditUser(u)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all" title="Düzenle"><Edit2 size={13} /></button>
                            <button onClick={() => openAssignModal(u)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all" title="Ders Ata"><BookOpen size={13} /></button>
                            <button onClick={() => { setShowPasswordModal({ open: true, user: u }); setNewPasswordValue(''); }} className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-500 hover:text-white transition-all" title="Şifre Değiştir"><Key size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sistem Logları */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-700 flex items-center gap-3 px-2"><History size={22} className="text-orange-500" /> Sistem Logları</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden h-[500px] flex flex-col">
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="p-4 text-xs flex items-start gap-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${
                    log.islem_tipi?.includes('onay') ? 'bg-emerald-500' :
                    log.islem_tipi?.includes('red') ? 'bg-red-500' :
                    log.islem_tipi?.includes('silme') ? 'bg-red-400' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-sm mb-1">{log.islem_tipi}</p>
                    <p className="text-slate-500 leading-relaxed mb-2 font-medium">{log.aciklama}</p>
                    <span className="text-slate-400 font-bold">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <History size={48} className="opacity-20" />
                  <p className="font-black uppercase tracking-widest text-xs">Henüz kayıt bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Veritabanı Yönetimi */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-700 flex items-center gap-3 px-2"><Database size={22} className="text-indigo-600" /> Veritabanı Yönetimi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setShowDeleteLessonModal(true)} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 hover:border-red-200 hover:shadow-red-100/30 transition-all group">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
              <Trash2 size={22} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Ders Bazlı Silme</p>
              <p className="text-[10px] text-slate-400 font-medium">Belirli bir dersi toplu sil</p>
            </div>
          </button>

          <button onClick={() => { setShowUploadModal(true); setUploadMode('append'); setUploadFile(null); }} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 hover:border-emerald-200 hover:shadow-emerald-100/30 transition-all group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Upload size={22} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Veri Yükle</p>
              <p className="text-[10px] text-slate-400 font-medium">JSON veya Excel ile yeni veri ekle</p>
            </div>
          </button>

          <button onClick={() => { setShowUploadModal(true); setUploadMode('replace'); setUploadFile(null); }} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 hover:border-amber-200 hover:shadow-amber-100/30 transition-all group">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <FileSpreadsheet size={22} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Tabloyu Sıfırla & Yükle</p>
              <p className="text-[10px] text-slate-400 font-medium">Tüm veriyi silip yeniden yükle</p>
            </div>
          </button>
        </div>
      </div>

      {/* Ders Silme Modalı */}
      {showDeleteLessonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Trash2 size={28} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Ders Bazlı Toplu Silme</h3>
                  <p className="text-xs text-slate-400 font-medium">Seçtiğiniz dersin tüm satırları silinecek</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">DERS ADI *</label>
                  <select className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-200 outline-none" value={deleteLessonName} onChange={e => setDeleteLessonName(e.target.value)}>
                    <option value="">Ders Seçin...</option>
                    {allLessons.map(l => {
                      const count = data.filter(d => d.ders_adi === l).length;
                      return <option key={l} value={l}>{l} ({count} satır)</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">PROGRAM TÜRÜ</label>
                  <select className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-200 outline-none" value={deleteLessonProgram} onChange={e => setDeleteLessonProgram(e.target.value)}>
                    <option value="Tümü">Tümü (Tüm program türleri)</option>
                    <option value="TYMM">TYMM</option>
                    <option value="DİĞER">DİĞER</option>
                  </select>
                </div>

                {deleteLessonName && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-700 font-bold">
                      ⚠️ {deleteLessonName} dersinden {deleteLessonProgram === 'Tümü'
                        ? data.filter(d => d.ders_adi === deleteLessonName).length
                        : data.filter(d => d.ders_adi === deleteLessonName && d.program_turu === deleteLessonProgram).length
                      } satır silinecek!
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={handleDeleteLesson} disabled={!deleteLessonName || deletingLesson} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  {deletingLesson ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={14} /> SİL</>}
                </button>
                <button onClick={() => setShowDeleteLessonModal(false)} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs">İPTAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Yükleme Modalı */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${uploadMode === 'replace' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  <Upload size={28} className={uploadMode === 'replace' ? 'text-amber-600' : 'text-emerald-600'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {uploadMode === 'replace' ? 'Tabloyu Sıfırla & Yükle' : 'Dosya Yükle'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {uploadMode === 'replace' ? 'Mevcut tüm veriler silinip yeni dosya yüklenecek' : 'JSON veya Excel dosyasından veri ekle'}
                  </p>
                </div>
              </div>

              {uploadMode === 'replace' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700 font-bold">⚠️ DİKKAT: Bu işlem mevcut tüm e-içerik verilerini, önerileri ve logları silecektir!</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">DOSYA SEÇ (JSON veya Excel)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.xlsx,.xls,.xlsm"
                    className="hidden"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    {uploadFile ? (
                      <div>
                        <p className="text-sm font-bold text-slate-800">{uploadFile.name}</p>
                        <p className="text-xs text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                        <p className="text-[9px] text-blue-500 font-bold mt-1">
                          {uploadFile.name.toLowerCase().endsWith('.json') ? '📄 JSON Dosyası' : '📊 Excel Dosyası'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <FileJson size={28} className="text-slate-300" />
                          <FileSpreadsheet size={28} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Dosya seçmek için tıklayın</p>
                        <p className="text-[10px] text-slate-400">.json, .xlsx, .xls formatları desteklenir</p>
                      </div>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Desteklenen Alanlar</p>
                  <p className="text-[10px] text-slate-400">sira_no, ders_adi, unite_tema, kazanim, e_icerik_turu, aciklama, program_turu</p>
                  <p className="text-[10px] text-slate-400 mt-1">Veya: SIRA NO, DERS ADI, ÜNİTE/TEMA, KAZANIM/ÇIKTI, E-İÇERİK TÜRÜ, AÇIKLAMA, PROGRAM TÜRÜ</p>
                  <p className="text-[10px] text-blue-500 font-bold mt-1">💡 Excel dosyasının ilk sayfası okunur. Sütun başlıkları otomatik eşleştirilir.</p>
                </div>
              </div>

              {uploadProgress && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs font-bold text-blue-700">{uploadProgress}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleUpload} disabled={!uploadFile || uploading} className={`flex-1 font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 ${
                  uploadMode === 'replace' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                }`}>
                  {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload size={14} /> YÜKLE</>}
                </button>
                <button onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadProgress(''); }} disabled={uploading} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs disabled:opacity-50">İPTAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kullanıcı Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleCreateUser}>
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200"><UserPlus size={24} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Kullanıcı</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Kullanıcı Tanımlama</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={24} /></button>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm font-bold">{error}</div>}

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Kullanıcı Adı *</label>
                      <input className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="kullanici_adi" value={newUser.kullanici_adi} onChange={e => setNewUser({ ...newUser, kullanici_adi: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Şifre *</label>
                      <input type="password" className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="••••••" value={newUser.sifre} onChange={e => setNewUser({ ...newUser, sifre: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Ad Soyad *</label>
                    <input className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Örn: Mehmet Özkan" value={newUser.ad_soyad} onChange={e => setNewUser({ ...newUser, ad_soyad: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Branş</label>
                      <input className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Örn: Matematik" value={newUser.brans} onChange={e => setNewUser({ ...newUser, brans: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Rol *</label>
                      <select className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-white" value={newUser.rol} onChange={e => setNewUser({ ...newUser, rol: e.target.value })}>
                        <option value="teacher">Öğretmen</option>
                        <option value="moderator">Moderatör</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Ders Atamaları (Virgülle ayırın)</label>
                    <input className="w-full border-2 border-slate-100 p-3 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Örn: Hayat Bilgisi 1, Matematik 1" value={newUser.atanan_dersler} onChange={e => setNewUser({ ...newUser, atanan_dersler: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-[1.5rem] transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} /> KULLANICIYI KAYDET</>}
                  </button>
                  <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">İPTAL</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tüm Önerileri Sıfırla Modalı */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Tüm Önerileri Sıfırla</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                Bu işlem tüm <strong>değişiklik önerilerini</strong>, <strong>yeni satır önerilerini</strong>, <strong>silme taleplerini</strong> ve <strong>sistem loglarını</strong> kalıcı olarak silecektir. Bu işlem geri alınamaz!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResetAllProposals}
                  disabled={resetting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {resetting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={14} /> EVET, SIFIRLA</>}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
                >
                  İPTAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Değiştirme Modalı */}
      {showPasswordModal.open && showPasswordModal.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Key size={28} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Şifre Değiştir</h3>
                  <p className="text-xs text-slate-400 font-bold">{showPasswordModal.user.ad_soyad} — {showPasswordModal.user.kullanici_adi}</p>
                </div>
              </div>
              {showPasswordModal.user.sifre && (
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mevcut Şifre</p>
                  <code className="text-sm font-mono font-bold text-slate-700">{showPasswordModal.user.sifre}</code>
                </div>
              )}
              <div className="mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Yeni Şifre (en az 6 karakter)</label>
                <input type="text" className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold text-sm focus:ring-2 focus:ring-amber-200 outline-none" placeholder="Yeni şifre..." value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleAdminChangePassword} disabled={!newPasswordValue || newPasswordValue.length < 6 || passwordSaving} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  {passwordSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Key size={14} /> DEĞİŞTİR</>}
                </button>
                <button onClick={() => setShowPasswordModal({ open: false, user: null })} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs">İPTAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tüm Şifreleri Sıfırla Modalı */}
      {resetAllPwModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={32} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Tüm Şifreleri Sıfırla</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                Tüm kullanıcıların şifreleri <strong>kullanıcı adlarıyla aynı</strong> olarak sıfırlanacak. Kullanıcılar bir sonraki girişte şifrelerini değiştirmeleri istenecektir.
              </p>
              <div className="flex gap-3">
                <button onClick={handleResetAllPasswords} disabled={resetAllPwLoading} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  {resetAllPwLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={14} /> SIFIRLA</>}
                </button>
                <button onClick={() => setResetAllPwModal(false)} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs">İPTAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ders Atama Modalı */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Ders Atama</h3>
                <p className="text-sm text-slate-500 font-bold">{selectedUser.ad_soyad} — {selectedUser.kullanici_adi}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <p className="text-xs text-slate-400 mb-4 font-bold uppercase tracking-wider">{assignedLessons.length} ders seçili</p>
              <div className="flex flex-wrap gap-2">
                {allLessons.map(lesson => (
                  <button
                    key={lesson}
                    onClick={() => toggleLesson(lesson)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      assignedLessons.includes(lesson)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {lesson}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-4">
              <button onClick={handleSaveAssignment} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2"><Save size={16} /> KAYDET</button>
              <button onClick={() => setShowAssignModal(false)} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">İPTAL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
