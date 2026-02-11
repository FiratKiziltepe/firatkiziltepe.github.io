import React, { useState, useMemo } from 'react';
import type { EIcerik, DegisiklikOnerisi, YeniSatirOnerisi, SilmeTalebi, Profile } from '../lib/supabase';
import { Check, X, Clock, Filter, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface ChangeHistoryProps {
  data: EIcerik[];
  proposals: DegisiklikOnerisi[];
  newRowProposals: YeniSatirOnerisi[];
  deleteProposals: SilmeTalebi[];
  users: Profile[];
  profile: Profile;
}

// Unified proposal item for display
type UnifiedProposal = {
  id: string; // unique key
  type: 'degisiklik' | 'yeni_satir' | 'silme';
  durum: 'pending' | 'approved' | 'rejected';
  user_id: string;
  onaylayan_id: string | null;
  created_at: string;
  onay_tarihi: string | null;
  red_nedeni: string | null;
  // Content
  ders_adi: string;
  sira_no: number | null;
  alan: string | null; // field name for degisiklik
  eski_deger: string | null;
  yeni_deger: string | null;
  aciklama: string | null;
  gerekce: string | null;
  // For new row
  unite_tema?: string;
  kazanim?: string;
  e_icerik_turu?: string;
  program_turu?: string;
};

/** LCS-based word diff */
const DiffSpan: React.FC<{ oldStr?: string; newStr?: string }> = ({ oldStr = "", newStr = "" }) => {
  if (oldStr === newStr) return <span>{oldStr}</span>;
  if (!oldStr && newStr) return <span className="bg-green-100 text-green-700 font-bold px-0.5 rounded">{newStr}</span>;
  if (oldStr && !newStr) return <span className="bg-red-100 text-red-600 line-through px-0.5 rounded">{oldStr}</span>;

  const oldWords = oldStr.split(/\s+/).filter(Boolean);
  const newWords = newStr.split(/\s+/).filter(Boolean);
  const m = oldWords.length, n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const ops: Array<{ type: 'same' | 'del' | 'add'; word: string }> = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      if (dp[i - 1][j] < dp[i][j] && dp[i][j - 1] < dp[i][j]) {
        ops.unshift({ type: 'same', word: oldWords[i - 1] }); i--; j--;
      } else if (dp[i][j - 1] >= dp[i - 1][j]) {
        ops.unshift({ type: 'add', word: newWords[j - 1] }); j--;
      } else {
        ops.unshift({ type: 'del', word: oldWords[i - 1] }); i--;
      }
    }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { ops.unshift({ type: 'add', word: newWords[j - 1] }); j--; }
    else { ops.unshift({ type: 'del', word: oldWords[i - 1] }); i--; }
  }

  const groups: Array<{ type: 'same' | 'del' | 'add'; words: string[] }> = [];
  for (const op of ops) {
    if (groups.length > 0 && groups[groups.length - 1].type === op.type) groups[groups.length - 1].words.push(op.word);
    else groups.push({ type: op.type, words: [op.word] });
  }

  return (
    <span className="leading-relaxed">
      {groups.map((g, idx) => {
        const text = g.words.join(' ');
        const prefix = idx > 0 ? ' ' : '';
        if (g.type === 'same') return <React.Fragment key={idx}>{prefix}{text}</React.Fragment>;
        if (g.type === 'del') return <React.Fragment key={idx}>{prefix}<span className="bg-red-100 text-red-600 line-through px-0.5 rounded">{text}</span></React.Fragment>;
        return <React.Fragment key={idx}>{prefix}<span className="bg-green-100 text-green-700 font-bold underline px-0.5 rounded">{text}</span></React.Fragment>;
      })}
    </span>
  );
};

const statusConfig = {
  pending: { label: 'Bekliyor', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: <Clock size={12} /> },
  approved: { label: 'Onaylandı', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: <Check size={12} /> },
  rejected: { label: 'Reddedildi', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <X size={12} /> },
};

const typeConfig = {
  degisiklik: { label: 'Düzenleme', bg: 'bg-blue-100', text: 'text-blue-800', icon: <Edit2 size={12} /> },
  yeni_satir: { label: 'Yeni Satır', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <Plus size={12} /> },
  silme: { label: 'Silme', bg: 'bg-red-100', text: 'text-red-800', icon: <Trash2 size={12} /> },
};

const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  data, proposals, newRowProposals, deleteProposals, users, profile
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'degisiklik' | 'yeni_satir' | 'silme'>('all');
  const [lessonFilter, setLessonFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getUserName = (userId: string | null) => {
    if (!userId) return '—';
    const u = users.find(u => u.id === userId);
    return u ? u.ad_soyad : 'Bilinmiyor';
  };

  const getUserRole = (userId: string | null) => {
    if (!userId) return '';
    const u = users.find(u => u.id === userId);
    if (!u) return '';
    return u.rol === 'admin' ? 'Admin' : u.rol === 'moderator' ? 'Moderatör' : 'Öğretmen';
  };

  const getRowInfo = (eIcerikId: number | null) => {
    if (!eIcerikId) return null;
    return data.find(d => d.id === eIcerikId) || null;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Unify all proposals
  const allProposals = useMemo((): UnifiedProposal[] => {
    const result: UnifiedProposal[] = [];

    for (const p of proposals) {
      const row = getRowInfo(p.e_icerik_id);
      result.push({
        id: `deg-${p.id}`,
        type: 'degisiklik',
        durum: p.durum,
        user_id: p.user_id,
        onaylayan_id: p.onaylayan_id,
        created_at: p.created_at,
        onay_tarihi: p.onay_tarihi,
        red_nedeni: p.red_nedeni,
        ders_adi: row?.ders_adi || '(Silinmiş satır)',
        sira_no: row?.sira_no || null,
        alan: p.alan,
        eski_deger: p.eski_deger,
        yeni_deger: p.yeni_deger,
        aciklama: null,
        gerekce: p.gerekce,
      });
    }

    for (const p of newRowProposals) {
      result.push({
        id: `yeni-${p.id}`,
        type: 'yeni_satir',
        durum: p.durum,
        user_id: p.user_id,
        onaylayan_id: p.onaylayan_id,
        created_at: p.created_at,
        onay_tarihi: p.onay_tarihi,
        red_nedeni: p.red_nedeni,
        ders_adi: p.ders_adi,
        sira_no: null,
        alan: null,
        eski_deger: null,
        yeni_deger: null,
        aciklama: p.aciklama,
        gerekce: p.gerekce,
        unite_tema: p.unite_tema,
        kazanim: p.kazanim,
        e_icerik_turu: p.e_icerik_turu,
        program_turu: p.program_turu,
      });
    }

    for (const p of deleteProposals) {
      const row = getRowInfo(p.e_icerik_id);
      result.push({
        id: `sil-${p.id}`,
        type: 'silme',
        durum: p.durum,
        user_id: p.user_id,
        onaylayan_id: p.onaylayan_id,
        created_at: p.created_at,
        onay_tarihi: p.onay_tarihi,
        red_nedeni: p.red_nedeni,
        ders_adi: row?.ders_adi || '(Silinmiş satır)',
        sira_no: row?.sira_no || null,
        alan: null,
        eski_deger: null,
        yeni_deger: null,
        aciklama: p.aciklama,
        gerekce: null,
      });
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [proposals, newRowProposals, deleteProposals, data]);

  // Get all unique lessons
  const allLessons = useMemo(() => {
    const lessons = new Set<string>();
    allProposals.forEach(p => { if (p.ders_adi) lessons.add(p.ders_adi); });
    return Array.from(lessons).sort();
  }, [allProposals]);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return allProposals.filter(p => {
      if (statusFilter !== 'all' && p.durum !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (lessonFilter && p.ders_adi !== lessonFilter) return false;
      // Teacher: sadece kendi önerilerini görsün
      if (profile.rol === 'teacher') {
        return p.user_id === profile.id;
      }
      // Moderator: atanan derslerle sınırlı
      if (profile.rol === 'moderator') {
        return profile.atanan_dersler.includes(p.ders_adi);
      }
      return true;
    });
  }, [allProposals, statusFilter, typeFilter, lessonFilter, profile]);

  // Stats
  const stats = useMemo(() => {
    const base = profile.rol === 'teacher'
      ? allProposals.filter(p => p.user_id === profile.id)
      : profile.rol === 'moderator'
        ? allProposals.filter(p => profile.atanan_dersler.includes(p.ders_adi))
        : allProposals;
    return {
      total: base.length,
      pending: base.filter(p => p.durum === 'pending').length,
      approved: base.filter(p => p.durum === 'approved').length,
      rejected: base.filter(p => p.durum === 'rejected').length,
    };
  }, [allProposals, profile]);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const alanLabel: Record<string, string> = {
    ders_adi: 'Ders Adı',
    unite_tema: 'Ünite/Tema',
    kazanim: 'Kazanım/Çıktı',
    e_icerik_turu: 'E-İçerik Türü',
    aciklama: 'Açıklama',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Değişiklik Geçmişi</h2>
          <p className="text-sm text-slate-400 mt-1">
            {profile.rol === 'teacher' ? 'Gönderdiğiniz önerilerin durumunu takip edin' : 'Tüm öneri, onay ve red işlemlerinin takibi'}
          </p>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setStatusFilter('all')} className={`p-5 rounded-2xl border-2 transition-all ${statusFilter === 'all' ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TOPLAM</p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </button>
        <button onClick={() => setStatusFilter('pending')} className={`p-5 rounded-2xl border-2 transition-all ${statusFilter === 'pending' ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">BEKLİYOR</p>
          <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`p-5 rounded-2xl border-2 transition-all ${statusFilter === 'approved' ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">ONAYLANDI</p>
          <p className="text-3xl font-black text-emerald-600">{stats.approved}</p>
        </button>
        <button onClick={() => setStatusFilter('rejected')} className={`p-5 rounded-2xl border-2 transition-all ${statusFilter === 'rejected' ? 'border-red-400 bg-red-50 shadow-lg shadow-red-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">REDDEDİLDİ</p>
          <p className="text-3xl font-black text-red-600">{stats.rejected}</p>
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block tracking-widest">İŞLEM TÜRÜ</label>
          <select className="border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
            <option value="all">Tümü</option>
            <option value="degisiklik">Düzenleme</option>
            <option value="yeni_satir">Yeni Satır</option>
            <option value="silme">Silme</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block tracking-widest">DERS</label>
          <select className="border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={lessonFilter} onChange={e => setLessonFilter(e.target.value)}>
            <option value="">Tüm Dersler</option>
            {allLessons.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setLessonFilter(''); }} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all uppercase tracking-wider flex items-center gap-1">
          <Filter size={12} /> Sıfırla
        </button>
        <div className="ml-auto text-sm text-slate-400 font-bold">
          {filteredProposals.length} kayıt gösteriliyor
        </div>
      </div>

      {/* Geçmiş Tablosu */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider w-10"></th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">TARİH</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">TÜR</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">DURUM</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">DERS</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">SIRA</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">ALAN</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">ÖNEREN</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">İŞLEM YAPAN</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">İŞLEM TARİHİ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProposals.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-8 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Eye size={40} className="text-slate-300" />
                      <p className="font-bold text-lg">Kayıt bulunamadı</p>
                      <p className="text-sm">Seçili filtrelere uygun değişiklik geçmişi bulunmuyor.</p>
                    </div>
                  </td>
                </tr>
              )}

              {filteredProposals.map(p => {
                const isExpanded = expandedRows.has(p.id);
                const sc = statusConfig[p.durum];
                const tc = typeConfig[p.type];

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`cursor-pointer transition-all hover:bg-slate-50/80 ${
                        p.durum === 'approved' ? 'border-l-4 border-l-emerald-400' :
                        p.durum === 'rejected' ? 'border-l-4 border-l-red-400' :
                        'border-l-4 border-l-amber-400'
                      }`}
                      onClick={() => toggleExpand(p.id)}
                    >
                      <td className="px-4 py-3 text-center">
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${tc.bg} ${tc.text}`}>
                          {tc.icon} {tc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${sc.bg} ${sc.text} ${sc.border}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{p.ders_adi}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500 text-center">{p.sira_no ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">{p.alan ? alanLabel[p.alan] || p.alan : (p.type === 'yeni_satir' ? 'Tüm alanlar' : 'Tüm satır')}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{getUserName(p.user_id)}</p>
                          <p className="text-[9px] text-slate-400">{getUserRole(p.user_id)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.onaylayan_id ? (
                          <div>
                            <p className="text-xs font-bold text-slate-800">{getUserName(p.onaylayan_id)}</p>
                            <p className="text-[9px] text-slate-400">{getUserRole(p.onaylayan_id)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">{formatDate(p.onay_tarihi)}</td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={10} className="px-8 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                            {p.type === 'degisiklik' && (
                              <>
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DEĞİŞİKLİK KARŞILAŞTIRMASI</p>
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm leading-relaxed">
                                    <DiffSpan oldStr={p.eski_deger || ''} newStr={p.yeni_deger || ''} />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">ESKİ DEĞER</p>
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-700">{p.eski_deger || '(Boş)'}</div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">YENİ DEĞER</p>
                                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-700">{p.yeni_deger || '(Boş)'}</div>
                                  </div>
                                </div>
                              </>
                            )}

                            {p.type === 'yeni_satir' && (
                              <div className="col-span-2 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">YENİ SATIR BİLGİLERİ</p>
                                <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <tbody className="divide-y divide-slate-100">
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50 w-36">Ders Adı</td><td className="px-4 py-2 text-slate-800 font-bold">{p.ders_adi}</td></tr>
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50">Ünite/Tema</td><td className="px-4 py-2 text-slate-800">{p.unite_tema}</td></tr>
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50">Kazanım</td><td className="px-4 py-2 text-slate-800">{p.kazanim}</td></tr>
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50">E-İçerik Türü</td><td className="px-4 py-2 text-slate-800">{p.e_icerik_turu}</td></tr>
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50">Açıklama</td><td className="px-4 py-2 text-slate-800 italic">{p.aciklama}</td></tr>
                                      <tr><td className="px-4 py-2 font-bold text-slate-500 bg-slate-50">Program Türü</td><td className="px-4 py-2 text-slate-800">{p.program_turu}</td></tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {p.type === 'silme' && (
                              <div className="col-span-2 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SİLME TALEBİ BİLGİLERİ</p>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                  <p className="text-sm text-red-700 font-bold mb-1">Satır #{p.sira_no} — {p.ders_adi}</p>
                                  {p.aciklama && <p className="text-xs text-red-600 italic mt-2">Gerekçe: {p.aciklama}</p>}
                                </div>
                              </div>
                            )}

                            {/* Gerekçe */}
                            {p.gerekce && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">DÜZELTME GEREKÇESİ</p>
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-700 italic">
                                  💬 {p.gerekce}
                                </div>
                              </div>
                            )}

                            {/* Red nedeni */}
                            {p.durum === 'rejected' && p.red_nedeni && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">RED NEDENİ</p>
                                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-700 italic">
                                  {p.red_nedeni}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChangeHistory;

