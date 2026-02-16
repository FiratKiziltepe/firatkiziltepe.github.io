import React, { useState, useMemo, useCallback } from 'react';
import type { EIcerik, DegisiklikOnerisi, YeniSatirOnerisi, SilmeTalebi, Profile } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Search, RotateCcw, Clock, Check, Undo, MessageSquare, PenLine, FileEdit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff, CheckCircle2, XCircle, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import EIcerikTuruInput from './EIcerikTuruInput';
import * as XLSX from 'xlsx';

interface ContentTableProps {
  data: EIcerik[];
  profile: Profile;
  proposals: DegisiklikOnerisi[];
  newRowProposals: YeniSatirOnerisi[];
  deleteProposals: SilmeTalebi[];
  onProposeChange: (eIcerikId: number, alan: string, eskiDeger: string, yeniDeger: string, gerekce?: string) => Promise<void>;
  onProposeNewRow: (satir: Partial<YeniSatirOnerisi>) => Promise<void>;
  onProposeDelete: (eIcerikId: number, aciklama: string) => Promise<void>;
  onResolve: (type: 'degisiklik' | 'yeni_satir' | 'silme', proposalId: number, durum: 'approved' | 'rejected', redNedeni?: string) => Promise<void>;
  onWithdraw: (type: 'degisiklik' | 'yeni_satir' | 'silme', proposalId: number) => Promise<void>;
  onUpdateProposal?: (type: 'degisiklik' | 'yeni_satir', proposalId: number, updatedData: Record<string, string>) => Promise<void>;
  users: Profile[];
}

/**
 * LCS-based word diff for accurate change tracking.
 * Only deleted words are shown as red strikethrough, only added words as green underline.
 */
const DiffSpan: React.FC<{ oldStr?: string; newStr?: string }> = ({ oldStr = "", newStr = "" }) => {
  if (oldStr === newStr) return <span>{oldStr}</span>;

  const oldWords = oldStr.split(/\s+/).filter(Boolean);
  const newWords = newStr.split(/\s+/).filter(Boolean);

  // Build LCS table
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
    } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff ops (prefer earliest matches for duplicate words)
  const ops: Array<{ type: 'same' | 'del' | 'add'; word: string }> = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      // Only take diagonal match if it's strictly necessary
      if (dp[i - 1][j] < dp[i][j] && dp[i][j - 1] < dp[i][j]) {
        ops.unshift({ type: 'same', word: oldWords[i - 1] });
        i--; j--;
      } else if (dp[i][j - 1] >= dp[i - 1][j]) {
        ops.unshift({ type: 'add', word: newWords[j - 1] });
        j--;
      } else {
        ops.unshift({ type: 'del', word: oldWords[i - 1] });
        i--;
      }
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'add', word: newWords[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'del', word: oldWords[i - 1] });
      i--;
    }
  }

  // Group consecutive same-type operations
  const groups: Array<{ type: 'same' | 'del' | 'add'; words: string[] }> = [];
  for (const op of ops) {
    if (groups.length > 0 && groups[groups.length - 1].type === op.type) {
      groups[groups.length - 1].words.push(op.word);
    } else {
      groups.push({ type: op.type, words: [op.word] });
    }
  }

  return (
    <span className="leading-relaxed">
      {groups.map((group, idx) => {
        const text = group.words.join(' ');
        const prefix = idx > 0 ? ' ' : '';
        if (group.type === 'same') {
          return <React.Fragment key={idx}>{prefix}{text}</React.Fragment>;
        } else if (group.type === 'del') {
          return <React.Fragment key={idx}>{prefix}<span className="bg-red-100 text-red-600 line-through decoration-red-400 px-0.5 rounded">{text}</span></React.Fragment>;
        } else {
          return <React.Fragment key={idx}>{prefix}<span className="bg-green-100 text-green-700 font-bold underline decoration-green-400 px-0.5 rounded">{text}</span></React.Fragment>;
        }
      })}
    </span>
  );
};

/** Arama terimini sarı highlight ile gösterir – sadece tam arama terimi eşleşirse highlight eder */
const HighlightText: React.FC<{ text: string; term: string; className?: string }> = ({ text, term, className }) => {
  if (!term || !text || term.length < 3) return <span className={className}>{text}</span>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 font-bold">{part}</mark>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </span>
  );
};

const EDIT_FIELDS = ['ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama'] as const;

const ContentTable: React.FC<ContentTableProps> = ({
  data, profile, proposals, newRowProposals, deleteProposals,
  onProposeChange, onProposeNewRow, onProposeDelete, onResolve, onWithdraw, onUpdateProposal, users
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  // Track whether editing from an existing proposal (to update instead of create)
  const [editingFromProposal, setEditingFromProposal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [lessonFilter, setLessonFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const PAGE_SIZE_OPTIONS = [50, 100, 150, 500];
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleteNote, setDeleteNote] = useState('');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; type: string; id: number | null }>({ open: false, type: '', id: null });
  const [rejectNote, setRejectNote] = useState('');
  const [editNote, setEditNote] = useState('');
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; type: 'degisiklik' | 'yeni_satir' | 'silme'; id: number; alan?: string }>({ open: false, type: 'degisiklik', id: 0 });

  // Moderator edit modal state
  const [editProposalModal, setEditProposalModal] = useState<{
    open: boolean;
    type: 'degisiklik' | 'yeni_satir';
    proposal: DegisiklikOnerisi | YeniSatirOnerisi | null;
  }>({ open: false, type: 'degisiklik', proposal: null });
  const [editProposalForm, setEditProposalForm] = useState<Record<string, string>>({});
  const [showChanges, setShowChanges] = useState(false);
  const [onlyProposals, setOnlyProposals] = useState(false);
  
  // Sorting State: null = varsayılan sıralama (sira_no ASC)
  // Sadece ders_adi sütununda sıralama: null=varsayılan(sira_no), 'asc'=A-Z, 'desc'=Z-A
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (_key: string) => {
    if (sortConfig === null) {
      setSortConfig({ key: 'ders_adi', direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      setSortConfig({ key: 'ders_adi', direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  };


  const canModerate = profile.rol === 'admin' || profile.rol === 'moderator';

  const HEADER_VALUES = useMemo(() => ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA', 'KAZANIM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'PROGRAM TÜRÜ',
    'sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu', 'Program Türü',
    'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'KAZANIM/ÇIKTI'], []);
  const trLessonCollator = useMemo(() => new Intl.Collator('tr', { sensitivity: 'variant' }), []);
  const allLessons = useMemo(() =>
    Array.from(new Set(data.map(d => d.ders_adi)))
      .filter(name => name && !HEADER_VALUES.includes(name))
      .sort((a, b) => trLessonCollator.compare(a, b)),
    [data, HEADER_VALUES, trLessonCollator]);

  // Yeni satır düzenleme state
  const [editNewRowModal, setEditNewRowModal] = useState<{ open: boolean; proposal: YeniSatirOnerisi | null }>({ open: false, proposal: null });
  const [editNewRowForm, setEditNewRowForm] = useState<Record<string, string>>({});

  // Pending new row proposals (filtered) - ders atamasına göre de filtrele
  const pendingNewRows = useMemo(() => {
    return newRowProposals.filter(p => {
      if (p.durum !== 'pending') return false;
      // Öğretmenler sadece kendi atanmış derslerindeki önerileri görsün
      if (profile.rol !== 'admin' && profile.atanan_dersler.length > 0) {
        if (!profile.atanan_dersler.includes(p.ders_adi)) return false;
      }
      const matchLesson = !lessonFilter || p.ders_adi === lessonFilter;
      const matchProgram = programFilter === 'Tümü' || p.program_turu === programFilter;
      // Arama en az 3 karakter girildiğinde aktif olur
      const matchSearch = !searchTerm || searchTerm.length < 3 || [p.ders_adi, p.unite_tema, p.kazanim, p.aciklama, p.e_icerik_turu]
        .some(v => v && v.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchLesson && matchProgram && matchSearch;
    });
  }, [newRowProposals, lessonFilter, programFilter, searchTerm, profile]);

  // Öneri olan satır ID'leri seti (performans için)
  const rowsWithProposals = useMemo(() => {
    const ids = new Set<number>();
    proposals.forEach(p => ids.add(p.e_icerik_id));
    deleteProposals.forEach(p => ids.add(p.e_icerik_id));
    return ids;
  }, [proposals, deleteProposals]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchLesson = !lessonFilter || row.ders_adi === lessonFilter;
      const matchProgram = programFilter === 'Tümü' || row.program_turu === programFilter;
      // Arama en az 3 karakter girildiğinde aktif olur
      const matchSearch = !searchTerm || searchTerm.length < 3 || [row.ders_adi, row.unite_tema, row.kazanim, row.aciklama, row.e_icerik_turu]
        .some(v => v && v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchProposals = !onlyProposals || rowsWithProposals.has(row.id);
      return matchLesson && matchProgram && matchSearch && matchProposals;
    });
  }, [data, lessonFilter, programFilter, searchTerm, onlyProposals, rowsWithProposals]);

  // Türkçe sıralama için Intl.Collator (performanslı ve doğru Türkçe harf sıralaması)
  const trCollator = useMemo(() => new Intl.Collator('tr', { numeric: true, sensitivity: 'variant' }), []);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig === null) {
      // Varsayılan: önce ders_adi'na göre (Türkçe), sonra sira_no'ya göre sırala
      sortableItems.sort((a, b) => {
        const cmp = trCollator.compare(a.ders_adi || '', b.ders_adi || '');
        if (cmp !== 0) return cmp;
        return a.sira_no - b.sira_no;
      });
    } else {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key as keyof EIcerik;
        const aValue = a[key];
        const bValue = b[key];

        let result: number;
        if (key === 'sira_no' || key === 'id') {
          // Sayısal sıralama
          result = (Number(aValue) || 0) - (Number(bValue) || 0);
        } else {
          // Metin sıralama: boş/null değerleri sona at
          const aStr = (aValue ?? '') as string;
          const bStr = (bValue ?? '') as string;
          if (!aStr && !bStr) result = 0;
          else if (!aStr) result = 1;
          else if (!bStr) result = -1;
          else result = trCollator.compare(aStr, bStr);
        }

        if (sortConfig.direction === 'desc') result *= -1;

        // İkincil sıralama: sira_no
        if (result === 0 && sortConfig.key !== 'sira_no') {
          return a.sira_no - b.sira_no;
        }
        return result;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, trCollator]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const getRowProposals = (eIcerikId: number) => proposals.filter(p => p.e_icerik_id === eIcerikId && p.durum === 'pending');
  const getDeleteProposals = (eIcerikId: number) => deleteProposals.filter(p => p.e_icerik_id === eIcerikId && p.durum === 'pending');
  const getFieldProposals = (eIcerikId: number, alan: string) => proposals.filter(p => p.e_icerik_id === eIcerikId && p.alan === alan && p.durum === 'pending');

  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? u.ad_soyad : 'Kullanıcı';
  };

  // Normal edit (new proposal for a clean row)
  const startEdit = (row: EIcerik) => {
    setEditingId(row.id);
    setEditingFromProposal(false);
    setEditNote('');
    setEditForm({
      ders_adi: row.ders_adi,
      unite_tema: row.unite_tema || '',
      kazanim: row.kazanim || '',
      e_icerik_turu: row.e_icerik_turu || '',
      aciklama: row.aciklama || '',
      program_turu: row.program_turu || '',
    });
  };

  // Edit from existing proposals: pre-fill with proposed values
  const startEditFromProposal = (row: EIcerik) => {
      setEditingId(row.id);
    setEditingFromProposal(true);
    const myProposals = proposals.filter(
      p => p.e_icerik_id === row.id && p.user_id === profile.id && p.durum === 'pending'
    );
    // Mevcut gerekçeyi yükle (ilk öneriden al)
    const existingGerekce = myProposals.find(p => p.gerekce)?.gerekce || '';
    setEditNote(existingGerekce);
    const form: Record<string, string> = {
      ders_adi: row.ders_adi,
      unite_tema: row.unite_tema || '',
      kazanim: row.kazanim || '',
      e_icerik_turu: row.e_icerik_turu || '',
      aciklama: row.aciklama || '',
      program_turu: row.program_turu || '',
    };
    // Apply existing proposed values
    for (const p of myProposals) {
      form[p.alan] = p.yeni_deger;
    }
    setEditForm(form);
  };

  // Save: smart handling of existing vs new proposals
  const handleSaveEdit = async (row: EIcerik) => {
    const myProposals = editingFromProposal
      ? proposals.filter(p => p.e_icerik_id === row.id && p.user_id === profile.id && p.durum === 'pending')
      : [];

    for (const field of EDIT_FIELDS) {
      const oldVal = (row as any)[field] || '';
      const newVal = editForm[field] || '';
      const existingProposal = myProposals.find(p => p.alan === field);

      if (oldVal !== newVal) {
        if (existingProposal && onUpdateProposal) {
          // Update existing proposal
          if (existingProposal.yeni_deger !== newVal) {
            await onUpdateProposal('degisiklik', existingProposal.id, { yeni_deger: newVal });
          }
        } else if (!existingProposal) {
          // Create new proposal
          await onProposeChange(row.id, field, oldVal, newVal, editNote || undefined);
        }
      } else if (existingProposal) {
        // Value reverted to original → withdraw proposal
        await onWithdraw('degisiklik', existingProposal.id);
      }
    }
    setEditingId(null);
    setEditForm({});
    setEditingFromProposal(false);
  };

  const handleAddRow = async () => {
    if (!addForm.ders_adi || !addForm.unite_tema || !addForm.kazanim) {
      alert('Lütfen zorunlu alanları (Ders, Ünite, Kazanım) doldurunuz.');
      return;
    }
    await onProposeNewRow({
      ders_adi: addForm.ders_adi,
      unite_tema: addForm.unite_tema,
      kazanim: addForm.kazanim,
      e_icerik_turu: addForm.e_icerik_turu || '',
      aciklama: addForm.aciklama || '',
      program_turu: addForm.program_turu || 'TYMM',
      gerekce: addForm.gerekce || null,
    });
    setIsAdding(false);
    setAddForm({});
  };

  const confirmDelete = async () => {
    if (deleteModal.id !== null) {
      await onProposeDelete(deleteModal.id, deleteNote || 'Satır silme talebi');
      setDeleteModal({ open: false, id: null });
      setDeleteNote('');
    }
  };

  const confirmReject = async () => {
    if (rejectModal.id !== null) {
      await onResolve(rejectModal.type as any, rejectModal.id, 'rejected', rejectNote);
      setRejectModal({ open: false, type: '', id: null });
      setRejectNote('');
    }
  };

  // Moderator: open edit modal for a proposal before approving
  const openEditProposalModal = (type: 'degisiklik' | 'yeni_satir', proposal: DegisiklikOnerisi | YeniSatirOnerisi) => {
    if (type === 'degisiklik') {
      const p = proposal as DegisiklikOnerisi;
      setEditProposalForm({ yeni_deger: p.yeni_deger });
    } else {
      const p = proposal as YeniSatirOnerisi;
      setEditProposalForm({
        ders_adi: p.ders_adi || '',
        unite_tema: p.unite_tema || '',
        kazanim: p.kazanim || '',
        e_icerik_turu: p.e_icerik_turu || '',
        aciklama: p.aciklama || '',
        program_turu: p.program_turu || 'TYMM',
      });
    }
    setEditProposalModal({ open: true, type, proposal });
  };

  const handleEditProposalAndApprove = async () => {
    if (!editProposalModal.proposal || !onUpdateProposal) return;
    await onUpdateProposal(editProposalModal.type, editProposalModal.proposal.id, editProposalForm);
    await onResolve(editProposalModal.type, editProposalModal.proposal.id, 'approved');
    setEditProposalModal({ open: false, type: 'degisiklik', proposal: null });
    setEditProposalForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditingFromProposal(false);
    setEditNote('');
  };

  // Excel indirme fonksiyonu - filtrelenmiş veri + bekleyen öneriler ayrı sheet
  const handleExcelDownload = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ana veri
    const rows = sortedData.map(row => ({
      'SIRA NO': row.sira_no,
      'DERS ADI': row.ders_adi,
      'ÜNİTE/TEMA': row.unite_tema || '',
      'KAZANIM/ÇIKTI': row.kazanim || '',
      'E-İÇERİK TÜRÜ': row.e_icerik_turu || '',
      'AÇIKLAMA': row.aciklama || '',
      'PROGRAM TÜRÜ': row.program_turu || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 50 }, { wch: 20 }, { wch: 50 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'E-İçerikler');

    // Sheet 2: Bekleyen değişiklik önerileri
    const filteredIds = new Set(sortedData.map(r => r.id));
    const pendingChanges = proposals
      .filter(p => p.durum === 'pending' && filteredIds.has(p.e_icerik_id))
      .map(p => {
        const row = data.find(d => d.id === p.e_icerik_id);
        return {
          'SIRA NO': row?.sira_no ?? '',
          'DERS ADI': row?.ders_adi ?? '',
          'ALAN': p.alan,
          'ESKİ DEĞER': p.eski_deger,
          'YENİ DEĞER': p.yeni_deger,
          'GEREKÇE': p.gerekce || '',
          'ÖNEREN': getUserName(p.user_id),
          'TARİH': new Date(p.created_at).toLocaleString('tr-TR'),
        };
      });
    if (pendingChanges.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(pendingChanges);
      ws2['!cols'] = [
        { wch: 8 }, { wch: 30 }, { wch: 16 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 22 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Değişiklik Önerileri');
    }

    // Sheet 3: Bekleyen yeni satır önerileri
    const pendingNewRowsAll = newRowProposals.filter(p => p.durum === 'pending');
    if (pendingNewRowsAll.length > 0) {
      const newRowSheet = pendingNewRowsAll.map(p => ({
        'DERS ADI': p.ders_adi,
        'ÜNİTE/TEMA': p.unite_tema || '',
        'KAZANIM': p.kazanim || '',
        'E-İÇERİK TÜRÜ': p.e_icerik_turu || '',
        'AÇIKLAMA': p.aciklama || '',
        'PROGRAM TÜRÜ': p.program_turu || '',
        'GEREKÇE': p.gerekce || '',
        'ÖNEREN': getUserName(p.user_id),
        'TARİH': new Date(p.created_at).toLocaleString('tr-TR'),
      }));
      const ws3 = XLSX.utils.json_to_sheet(newRowSheet);
      ws3['!cols'] = [
        { wch: 30 }, { wch: 25 }, { wch: 50 }, { wch: 20 }, { wch: 50 }, { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Yeni Satır Önerileri');
    }

    // Sheet 4: Bekleyen silme talepleri
    const pendingDeletes = deleteProposals.filter(p => p.durum === 'pending');
    if (pendingDeletes.length > 0) {
      const delSheet = pendingDeletes.map(p => {
        const row = data.find(d => d.id === p.e_icerik_id);
        return {
          'SIRA NO': row?.sira_no ?? '',
          'DERS ADI': row?.ders_adi ?? '',
          'KAZANIM': row?.kazanim ?? '',
          'AÇIKLAMA': p.aciklama || '',
          'ÖNEREN': getUserName(p.user_id),
          'TARİH': new Date(p.created_at).toLocaleString('tr-TR'),
        };
      });
      const ws4 = XLSX.utils.json_to_sheet(delSheet);
      ws4['!cols'] = [
        { wch: 8 }, { wch: 30 }, { wch: 50 }, { wch: 40 }, { wch: 22 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws4, 'Silme Talepleri');
    }

    const suffix = lessonFilter ? `_${lessonFilter.replace(/\s+/g, '_')}` : '';
    XLSX.writeFile(wb, `e_icerikler${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [sortedData, lessonFilter, proposals, newRowProposals, deleteProposals, data, users]);

  return (
    <div className="space-y-6">
      {/* Filtre Paneli */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">DERS SEÇİMİ</label>
          <select className="w-full border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={lessonFilter} onChange={e => { setLessonFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">Tüm Dersler</option>
            {allLessons.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">PROGRAM TÜRÜ</label>
          <select className="w-full border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={programFilter} onChange={e => { setProgramFilter(e.target.value); setCurrentPage(1); }}>
            <option value="Tümü">Tümü</option>
            <option value="TYMM">TYMM</option>
            <option value="DİĞER">DİĞER</option>
          </select>
        </div>
        <div className="relative">
          <label className="text-[11px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">GENEL ARAMA</label>
          <input type="text" placeholder="Kazanım, ünite ara..." className="w-full border-2 border-slate-100 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          <Search className="absolute right-3 top-9 text-slate-400" size={18} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowChanges(!showChanges)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider ${
                showChanges ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {showChanges ? <EyeOff size={13} /> : <Eye size={13} />}
              {showChanges ? 'GİZLE' : 'DEĞİŞİKLİKLER'}
            </button>
            <button onClick={() => { setSearchTerm(''); setLessonFilter(''); setProgramFilter('Tümü'); setOnlyProposals(false); setCurrentPage(1); }} className="flex-1 bg-slate-100 text-slate-600 px-3 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all uppercase tracking-wider">
              <RotateCcw size={13} /> TEMİZLE
            </button>
            <button
              onClick={handleExcelDownload}
              className="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-wider border border-emerald-200"
              title="Tabloyu Excel olarak indir"
            >
              <Download size={13} /> EXCEL
            </button>
          </div>
          <button
            onClick={() => { setOnlyProposals(!onlyProposals); setCurrentPage(1); }}
            className={`w-full px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider ${
              onlyProposals ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <FileEdit size={13} />
            {onlyProposals ? 'TÜM SATIRLAR' : 'ÖNERİLİ SATIRLAR'}
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 w-12 text-center uppercase tracking-wider">
                  SIRA
                </th>
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 uppercase tracking-wider min-w-[120px] cursor-pointer hover:bg-slate-600 transition-colors select-none" onClick={() => handleSort('ders_adi')}>
                  <div className="flex items-center gap-1">
                    DERS ADI
                    {sortConfig?.key === 'ders_adi' ? (sortConfig.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} className="opacity-30" />}
                  </div>
                </th>
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 uppercase tracking-wider min-w-[130px]">
                  ÜNİTE/TEMA
                </th>
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 uppercase tracking-wider min-w-[200px]">
                  KAZANIM/ÇIKTI
                </th>
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 uppercase tracking-wider w-32">
                  E-İÇERİK TÜRÜ
                </th>
                <th className="px-3 py-4 text-[10px] font-bold border-r border-slate-600 uppercase tracking-wider min-w-[160px]">
                  AÇIKLAMA
                </th>
                <th className="px-3 py-4 text-[10px] font-bold text-center uppercase tracking-wider w-[180px] sticky right-0 bg-slate-700 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.1)]">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* YENİ SATIR EKLEME */}
              {isAdding && (
                <tr className="bg-blue-50/70 border-l-8 border-blue-500">
                  <td className="px-3 py-3 text-xs font-black text-blue-600 text-center italic">YENİ</td>
                  <td className="px-3 py-3">
                    <select className="w-full border-2 border-blue-300 p-1.5 rounded-lg text-xs font-bold bg-white" value={addForm.ders_adi || ''} onChange={e => setAddForm({ ...addForm, ders_adi: e.target.value })}>
                      <option value="">Ders Seç...</option>
                      {(profile.rol === 'admin' ? allLessons : profile.atanan_dersler).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3"><input className="w-full border-2 border-blue-300 p-1.5 rounded-lg text-xs font-bold bg-white" placeholder="Ünite / Tema" value={addForm.unite_tema || ''} onChange={e => setAddForm({ ...addForm, unite_tema: e.target.value })} /></td>
                  <td className="px-3 py-3"><textarea className="w-full border-2 border-blue-300 p-1.5 rounded-lg text-xs font-bold h-16 bg-white resize-none" placeholder="Kazanım" value={addForm.kazanim || ''} onChange={e => setAddForm({ ...addForm, kazanim: e.target.value })} /></td>
                  <td className="px-3 py-3"><EIcerikTuruInput value={addForm.e_icerik_turu || ''} onChange={v => setAddForm({ ...addForm, e_icerik_turu: v })} /></td>
                  <td className="px-3 py-3">
                    <textarea className="w-full border-2 border-blue-300 p-1.5 rounded-lg text-xs h-12 bg-white resize-none" placeholder="Açıklama" value={addForm.aciklama || ''} onChange={e => setAddForm({ ...addForm, aciklama: e.target.value })} />
                    <textarea className="w-full border border-dashed border-amber-300 bg-amber-50/50 p-1.5 rounded-lg text-xs h-8 resize-none mt-1 placeholder:text-amber-300" placeholder="Gerekçe (isteğe bağlı)" value={addForm.gerekce || ''} onChange={e => setAddForm({ ...addForm, gerekce: e.target.value })} />
                  </td>
                  <td className="px-3 py-3 text-center sticky right-0 bg-blue-50 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-1.5 w-full max-w-[120px] mx-auto">
                      <button onClick={handleAddRow} className="w-full flex items-center justify-center gap-1 bg-[#00966d] text-white px-2 py-1.5 rounded-lg text-[9px] font-black hover:brightness-110 transition-all uppercase tracking-widest"><Check size={12} /> EKLE</button>
                      <button onClick={() => setIsAdding(false)} className="w-full flex items-center justify-center gap-1 bg-[#e5e7eb] text-slate-600 px-2 py-1.5 rounded-lg text-[9px] font-black hover:bg-slate-300 transition-all uppercase tracking-widest"><X size={12} /> VAZGEÇ</button>
                    </div>
                  </td>
                </tr>
              )}

              {pagedData.map(row => {
                const rowProposals = getRowProposals(row.id);
                const delProposalsList = getDeleteProposals(row.id);
                const isEditing = editingId === row.id;
                const hasChanges = rowProposals.length > 0;
                const isDeleting = delProposalsList.length > 0;

                // Helper: render a field cell
                // showChanges OFF → bekleyen öneriler DiffSpan ile gösterilir
                // showChanges ON  → tüm öneriler (bekleyen+onaylanan+reddedilen) durum badge'li gösterilir
                const renderFieldCell = (fieldName: string, originalValue: string, cellClass?: string) => {
                  if (showChanges) {
                    // Tüm öneriler (bekleyen + onaylanan + reddedilen) durum badge'leriyle
                    const allFps = proposals.filter(p => p.e_icerik_id === row.id && p.alan === fieldName);
                    if (allFps.length === 0) return <HighlightText text={originalValue} term={searchTerm} className={cellClass} />;
                    return (
                      <div className="space-y-1.5">
                        {/* Güncel (son) değer */}
                        <div className="pb-1.5 mb-1 border-b border-slate-200">
                          <span className="text-[8px] font-bold text-emerald-600 uppercase block mb-0.5">📌 Son Hal:</span>
                          <HighlightText text={originalValue} term={searchTerm} className={cellClass} />
                        </div>
                        {/* Değişiklik geçmişi */}
                        {allFps.map(fp => (
                          <div key={fp.id} className={`border-l-2 pl-2 py-1 rounded-r-lg ${
                            fp.durum === 'approved' ? 'border-emerald-400 bg-emerald-50/50' :
                            fp.durum === 'rejected' ? 'border-red-300 bg-red-50/40' :
                            'border-amber-300 bg-amber-50/50'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              {fp.durum === 'approved' ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black whitespace-nowrap"><CheckCircle2 size={9} /> ONAYLANDI</span>
                              ) : fp.durum === 'rejected' ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] font-black whitespace-nowrap"><XCircle size={9} /> REDDEDİLDİ</span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black whitespace-nowrap"><Clock size={9} /> BEKLİYOR</span>
                              )}
                              <span className="text-[9px] text-slate-400 italic">— {getUserName(fp.user_id)}</span>
                            </div>
                            {fp.gerekce && <p className="text-[8px] text-amber-600 italic mt-0.5">💬 {fp.gerekce}</p>}
                            <div className="text-[9px] text-slate-400 mt-0.5">Orijinal → Öneri:</div>
                            <div className="text-xs"><DiffSpan oldStr={fp.eski_deger} newStr={fp.yeni_deger} /></div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  // Normal mod: sadece bekleyen öneriler DiffSpan ile gösterilir
                  const fps = getFieldProposals(row.id, fieldName);
                  if (fps.length === 0) return <HighlightText text={originalValue} term={searchTerm} className={cellClass} />;
                  if (fps.length === 1) {
                    return (
                      <div>
                        <DiffSpan oldStr={fps[0].eski_deger} newStr={fps[0].yeni_deger} />
                        <p className="text-[9px] text-slate-400 mt-1 italic">— {getUserName(fps[0].user_id)}</p>
                        {fps[0].gerekce && <p className="text-[8px] text-amber-600 italic mt-0.5">💬 {fps[0].gerekce}</p>}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <HighlightText text={originalValue} term={searchTerm} className={`${cellClass} block mb-1`} />
                      {fps.map(fp => (
                        <div key={fp.id} className="border-l-3 border-amber-300 pl-2 py-1 bg-amber-50/50 rounded-r-lg">
                          <p className="text-[9px] font-bold text-amber-700 mb-0.5">📝 {getUserName(fp.user_id)}</p>
                          {fp.gerekce && <p className="text-[8px] text-amber-600 italic mb-0.5">💬 {fp.gerekce}</p>}
                          <DiffSpan oldStr={fp.eski_deger} newStr={fp.yeni_deger} />
                        </div>
                      ))}
                    </div>
                  );
                };

                // Group proposals by field for the actions column
                const proposalsByField: Record<string, DegisiklikOnerisi[]> = {};
                for (const p of rowProposals) {
                  if (!proposalsByField[p.alan]) proposalsByField[p.alan] = [];
                  proposalsByField[p.alan].push(p);
                }

                const uniqueProposers = new Set(rowProposals.map(p => p.user_id)).size;

                // Çözülmüş öneriler (onaylanan/reddedilen) - showChanges modu için
                const resolvedChangeCount = showChanges ? proposals.filter(p => p.e_icerik_id === row.id && p.durum !== 'pending').length : 0;
                const resolvedDeleteCount = showChanges ? deleteProposals.filter(p => p.e_icerik_id === row.id && p.durum !== 'pending').length : 0;
                const hasResolvedProposals = resolvedChangeCount > 0 || resolvedDeleteCount > 0;

                return (
                  <tr key={row.id} className={`transition-all duration-300 ${
                    isDeleting ? 'bg-red-50/70 border-l-8 border-red-500' :
                    hasChanges ? 'bg-[#fefce8] border-l-8 border-[#facc15]' :
                    (showChanges && hasResolvedProposals) ? 'bg-blue-50/30 border-l-4 border-blue-200' :
                    'hover:bg-slate-50/50'
                  }`}>
                    <td className="px-3 py-3 text-xs font-black text-slate-500 text-center">
                      {isDeleting ? <span className="line-through text-red-400">{row.sira_no}</span> : row.sira_no}
                    </td>

                    {/* DERS ADI */}
                    <td className="px-3 py-3">
                      <span className={`text-xs font-extrabold ${isDeleting ? 'line-through text-red-300' : 'text-slate-800'}`}>
                        {renderFieldCell('ders_adi', row.ders_adi, `text-xs font-extrabold ${isDeleting ? 'line-through text-red-300' : 'text-slate-800'}`)}
                        </span>
                    </td>

                    {/* ÜNİTE */}
                    <td className="px-3 py-3">
                      <div className="text-xs font-black text-blue-600 uppercase">
                        {renderFieldCell('unite_tema', row.unite_tema || '', 'text-xs font-black text-blue-600 uppercase')}
                        </div>
                    </td>

                    {/* KAZANIM */}
                    <td className="px-3 py-3">
                      <div className="text-xs font-bold text-slate-700 leading-relaxed">
                        {renderFieldCell('kazanim', row.kazanim || '', 'text-xs font-bold text-slate-700 leading-relaxed')}
                        </div>
                    </td>

                    {/* E-İÇERİK TÜRÜ */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const cleanTags = (row.e_icerik_turu || '').split('/').filter(s => s.trim()).map((ec, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 rounded-md uppercase">
                              <HighlightText text={ec.trim()} term={searchTerm} />
                            </span>
                          ));

                          if (showChanges) {
                            // Tüm öneriler (bekleyen + onaylanan + reddedilen) durum badge'leriyle
                            const allFps = proposals.filter(p => p.e_icerik_id === row.id && p.alan === 'e_icerik_turu');
                            if (allFps.length === 0) return cleanTags;
                            return (
                              <div className="space-y-1.5 w-full">
                                {/* Güncel (son) değer */}
                                <div className="pb-1.5 mb-1 border-b border-slate-200">
                                  <span className="text-[8px] font-bold text-emerald-600 uppercase block mb-0.5">📌 Son Hal:</span>
                                  <div className="flex flex-wrap gap-1">{cleanTags}</div>
                                </div>
                                {/* Değişiklik geçmişi */}
                                {allFps.map(fp => (
                                  <div key={fp.id} className={`border-l-2 pl-2 py-1 rounded-r-lg ${
                                    fp.durum === 'approved' ? 'border-emerald-400 bg-emerald-50/50' :
                                    fp.durum === 'rejected' ? 'border-red-300 bg-red-50/40' :
                                    'border-amber-300 bg-amber-50/50'
                                  }`}>
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                      {fp.durum === 'approved' ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black whitespace-nowrap"><CheckCircle2 size={9} /> ONAYLANDI</span>
                                      ) : fp.durum === 'rejected' ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[8px] font-black whitespace-nowrap"><XCircle size={9} /> REDDEDİLDİ</span>
                                      ) : (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black whitespace-nowrap"><Clock size={9} /> BEKLİYOR</span>
                                      )}
                                      <span className="text-[9px] text-slate-400 italic">— {getUserName(fp.user_id)}</span>
                                    </div>
                                    {fp.gerekce && <p className="text-[8px] text-amber-600 italic mt-0.5">💬 {fp.gerekce}</p>}
                                    <div className="text-[9px] text-slate-400 mt-0.5">Orijinal → Öneri:</div>
                                    <div className="text-xs"><DiffSpan oldStr={fp.eski_deger} newStr={fp.yeni_deger} /></div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          // Normal mod: sadece bekleyen öneriler
                          const fps = getFieldProposals(row.id, 'e_icerik_turu');
                          if (fps.length === 0) return cleanTags;
                          if (fps.length === 1) {
                            return (
                              <div>
                                <DiffSpan oldStr={fps[0].eski_deger} newStr={fps[0].yeni_deger} />
                                <p className="text-[9px] text-slate-400 mt-1 italic">— {getUserName(fps[0].user_id)}</p>
                                {fps[0].gerekce && <p className="text-[8px] text-amber-600 italic mt-0.5">💬 {fps[0].gerekce}</p>}
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-2 w-full">
                              <div className="flex flex-wrap gap-1">{cleanTags}</div>
                              {fps.map(fp => (
                                <div key={fp.id} className="border-l-3 border-amber-300 pl-2 py-1 bg-amber-50/50 rounded-r-lg">
                                  <p className="text-[9px] font-bold text-amber-700 mb-0.5">📝 {getUserName(fp.user_id)}</p>
                                  {fp.gerekce && <p className="text-[8px] text-amber-600 italic mb-0.5">💬 {fp.gerekce}</p>}
                                  <DiffSpan oldStr={fp.eski_deger} newStr={fp.yeni_deger} />
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* AÇIKLAMA */}
                    <td className="px-3 py-3">
                      <div className="text-[11px] leading-relaxed italic text-slate-500 whitespace-pre-line">
                        {renderFieldCell('aciklama', row.aciklama || '', 'text-[11px] leading-relaxed italic text-slate-500 whitespace-pre-line')}
                        </div>
                    </td>

                    {/* İŞLEMLER */}
                    <td className={`px-3 py-3 text-center sticky right-0 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)] ${
                      isDeleting ? 'bg-red-50' : hasChanges ? 'bg-[#fefce8]' : (showChanges && hasResolvedProposals) ? 'bg-blue-50' : 'bg-white'
                    }`}>
                      <div className="flex flex-col items-center gap-2">
                        {isDeleting ? (
                          <div className="space-y-2 w-full max-w-[220px]">
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-200 rounded-full">
                              <Trash2 size={12} className="text-red-600" />
                              <span className="text-[10px] font-black text-red-700 uppercase">{delProposalsList.length} SİLME TALEBİ</span>
                            </div>
                            {delProposalsList.map(dp => (
                              <div key={dp.id} className="bg-white border border-red-200 rounded-xl p-2 space-y-1">
                                <p className="text-[9px] font-bold text-red-600">Öneren: {getUserName(dp.user_id)}</p>
                                {dp.aciklama && <p className="text-[10px] italic text-red-400">{dp.aciklama}</p>}
                                {canModerate && (
                                  <div className="flex gap-1 justify-center pt-1">
                                    <button onClick={() => onResolve('silme', dp.id, 'approved')} title="Onayla" className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"><Check size={12} /></button>
                                    <button onClick={() => { setRejectModal({ open: true, type: 'silme', id: dp.id }); setRejectNote(''); }} title="Reddet" className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-200"><X size={12} /></button>
                                  </div>
                                )}
                                {dp.user_id === profile.id && (
                                  <button onClick={() => setWithdrawModal({ open: true, type: 'silme', id: dp.id, alan: 'Silme Talebi' })} className="w-full flex items-center justify-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-slate-200 transition-all"><Undo size={10} /> İPTAL</button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : hasChanges ? (
                          <div className="space-y-2 w-full max-w-[220px]">
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-full">
                              <Clock size={12} className="text-amber-600 animate-pulse" />
                              <span className="text-[10px] font-black text-amber-700 uppercase">
                                {rowProposals.length} Öneri{uniqueProposers > 1 ? ` · ${uniqueProposers} Kişi` : ''}
                              </span>
                            </div>

                            {/* Proposals grouped by field */}
                            {Object.entries(proposalsByField).map(([alan, fieldProps]) => (
                              <div key={alan} className="bg-white border border-slate-200 rounded-xl p-2 space-y-1.5">
                                <p className="text-[9px] font-bold text-slate-500 uppercase border-b border-slate-100 pb-1">{alan}</p>
                                {fieldProps.map(p => (
                                  <div key={p.id} className={`rounded-lg p-1.5 relative ${fieldProps.length > 1 ? 'bg-slate-50 border border-slate-100' : ''}`}>
                                    <div className="flex items-start justify-between gap-1">
                                      <p className="text-[9px] text-slate-500 font-medium">
                                        <span className="font-bold text-slate-700">{getUserName(p.user_id)}</span>
                                      </p>
                                      <div className="flex gap-0.5 flex-shrink-0">
                                        {/* Moderatör: onayla/düzenle/reddet butonları alan köşesinde */}
                                        {canModerate && (
                                          <>
                                            <button onClick={(e) => { e.stopPropagation(); onResolve('degisiklik', p.id, 'approved'); }} title="Onayla" className="p-0.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"><Check size={10} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); openEditProposalModal('degisiklik', p); }} title="Düzenle & Onayla" className="p-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all border border-blue-200"><PenLine size={10} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, type: 'degisiklik', id: p.id }); setRejectNote(''); }} title="Reddet" className="p-0.5 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all border border-red-200"><X size={10} /></button>
                                          </>
                                        )}
                                        {/* Kendi önerisiyse geri al butonu alan köşesinde */}
                                        {!canModerate && p.user_id === profile.id && (
                                          <button onClick={(e) => { e.stopPropagation(); setWithdrawModal({ open: true, type: 'degisiklik', id: p.id, alan: p.alan }); }} title={`${p.alan} geri al`} className="p-0.5 bg-slate-100 text-slate-500 rounded hover:bg-red-100 hover:text-red-600 transition-all border border-slate-200">
                                            <Undo size={10} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {p.gerekce && (
                                      <p className="text-[9px] text-amber-600 italic mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded">💬 {p.gerekce}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}

                            {/* Teacher actions */}
                            {!canModerate && (
                              rowProposals.some(p => p.user_id === profile.id) ? (
                                /* Kendi önerileri varsa: Düzenle butonu (geri al butonları her alanın köşesinde) */
                                <div className="flex gap-1 justify-center pt-1">
                                  <button onClick={() => startEditFromProposal(row)} title="Satırı Düzenle" className="flex-1 flex items-center justify-center gap-1 p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all border border-blue-200 text-[9px] font-bold">
                                    <Edit2 size={11} /> Düzenle
                                  </button>
                                </div>
                              ) : (
                                /* Başka öğretmenlerin önerisi var ama bu öğretmenin yok: yeni öneri ekle butonları */
                                <div className="flex gap-1 justify-center pt-1 border-t border-slate-100 mt-1">
                                  <button onClick={() => startEdit(row)} title="Kendi Önerinizi Ekleyin" className="flex-1 flex items-center justify-center gap-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100 text-[9px] font-bold">
                                    <Edit2 size={11} /> Öneri Ekle
                                  </button>
                                  <button onClick={() => { setDeleteModal({ open: true, id: row.id }); setDeleteNote(''); }} title="Silme Talebi" className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => startEdit(row)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-100 shadow-sm transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => { setDeleteModal({ open: true, id: row.id }); setDeleteNote(''); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-100 shadow-sm transition-all"><Trash2 size={16} /></button>
                          </div>
                        )}

                        {/* Değişiklik göster modunda çözülmüş önerilerin özeti */}
                        {showChanges && hasResolvedProposals && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1 justify-center">
                            {(() => {
                              const resolved = proposals.filter(p => p.e_icerik_id === row.id && p.durum !== 'pending');
                              const resolvedDels = deleteProposals.filter(p => p.e_icerik_id === row.id && p.durum !== 'pending');
                              const approvedCount = resolved.filter(p => p.durum === 'approved').length + resolvedDels.filter(p => p.durum === 'approved').length;
                              const rejectedCount = resolved.filter(p => p.durum === 'rejected').length + resolvedDels.filter(p => p.durum === 'rejected').length;
                              return (
                                <>
                                  {approvedCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[8px] font-bold">
                                      <CheckCircle2 size={9} /> {approvedCount} onay
                                    </span>
                                  )}
                                  {rejectedCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-200 rounded-md text-[8px] font-bold">
                                      <XCircle size={9} /> {rejectedCount} ret
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* YENİ SATIR ÖNERİLERİ - tablonun içinde */}
              {pendingNewRows.map(proposal => (
                <tr key={`new-${proposal.id}`} className="bg-emerald-50/70 border-l-8 border-emerald-500 transition-all duration-300">
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-black text-emerald-600 italic">+</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-extrabold text-emerald-700">{proposal.ders_adi}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-black text-emerald-600 uppercase">{proposal.unite_tema}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-bold text-emerald-700 leading-relaxed">{proposal.kazanim}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(proposal.e_icerik_turu || '').split('/').map((ec, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-[9px] font-black text-emerald-600 rounded-md uppercase">{ec.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[11px] leading-relaxed italic text-emerald-600">{proposal.aciklama}</div>
                    {proposal.gerekce && (
                      <p className="text-[9px] text-amber-600 italic mt-1 bg-amber-50 px-1.5 py-0.5 rounded">💬 {proposal.gerekce}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center sticky right-0 bg-emerald-50 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col items-center gap-2 w-full max-w-[180px] mx-auto">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
                        <Plus size={11} className="text-emerald-600" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase">Yeni satır</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Öneren: {getUserName(proposal.user_id)}</p>

                      {canModerate && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => onResolve('yeni_satir', proposal.id, 'approved')} title="Onayla" className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"><Check size={14} /></button>
                          <button onClick={() => openEditProposalModal('yeni_satir', proposal)} title="Düzenle & Onayla" className="p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-200"><PenLine size={14} /></button>
                          <button onClick={() => { setRejectModal({ open: true, type: 'yeni_satir', id: proposal.id }); setRejectNote(''); }} title="Reddet" className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-200"><X size={14} /></button>
                        </div>
                      )}

                      {proposal.user_id === profile.id && !canModerate && (
                        <div className="flex gap-1 w-full">
                          <button onClick={() => {
                            setEditNewRowForm({
                              ders_adi: proposal.ders_adi || '',
                              unite_tema: proposal.unite_tema || '',
                              kazanim: proposal.kazanim || '',
                              e_icerik_turu: proposal.e_icerik_turu || '',
                              aciklama: proposal.aciklama || '',
                              program_turu: proposal.program_turu || 'TYMM',
                              gerekce: proposal.gerekce || '',
                            });
                            setEditNewRowModal({ open: true, proposal });
                          }} className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-blue-700 px-2 py-2 rounded-xl text-[9px] font-black hover:bg-blue-200 transition-all"><Edit2 size={11} /> DÜZENLE</button>
                          <button onClick={() => setWithdrawModal({ open: true, type: 'yeni_satir', id: proposal.id, alan: 'Yeni Satır' })} className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-600 px-2 py-2 rounded-xl text-[9px] font-black hover:bg-slate-200 transition-all"><Undo size={11} /> İPTAL</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Sol: Bilgi */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-bold">
            {filteredData.length > 0
              ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredData.length)} / ${filteredData.length} kayıt`
              : '0 kayıt'}
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sayfa başına:</span>
            {PAGE_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  pageSize === size
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Sağ: Sayfa navigasyonu */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="İlk sayfa"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Önceki"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Sayfa numaraları */}
            {(() => {
              const pages: number[] = [];
              const start = Math.max(1, safePage - 2);
              const end = Math.min(totalPages, safePage + 2);
              if (start > 1) pages.push(1);
              if (start > 2) pages.push(-1); // ellipsis
              for (let p = start; p <= end; p++) pages.push(p);
              if (end < totalPages - 1) pages.push(-2); // ellipsis
              if (end < totalPages) pages.push(totalPages);
              return pages.map((p, idx) =>
                p < 0 ? (
                  <span key={`e${idx}`} className="px-1 text-slate-300 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                      safePage === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Sonraki"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Son sayfa"
            >
              <ChevronsRight size={16} />
            </button>
        </div>
      )}
      </div>

      {/* YENİ İÇERİK EKLE BUTONU */}
      <div className="flex justify-start">
        <button 
          onClick={() => { setIsAdding(true); setAddForm({ ders_adi: profile.atanan_dersler[0] || '', program_turu: 'TYMM' }); }}
          className="flex items-center gap-5 bg-[#2563eb] hover:bg-blue-700 text-white px-10 py-5 rounded-[2.5rem] transition-all shadow-2xl shadow-blue-200 font-black text-sm uppercase tracking-widest active:scale-95 group"
        >
          <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform">
            <Plus size={24} />
          </div>
          YENİ İÇERİK SATIRI EKLE
        </button>
      </div>

      {/* Düzenleme Modalı */}
      {editingId !== null && (() => {
        const editRow = data.find(r => r.id === editingId);
        if (!editRow) return null;
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-slate-200">
              {/* Compact Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-black text-slate-700">#{editRow.sira_no} · <span className="text-blue-600">{editRow.ders_adi}</span></span>
                <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                {/* Row 1: Ders + Program + Ünite */}
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">DERS ADI</label>
                    <input
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      value={editForm.ders_adi || ''}
                      onChange={e => setEditForm({ ...editForm, ders_adi: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">PROGRAM</label>
                    <select
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                      value={editForm.program_turu || 'TYMM'}
                      onChange={e => setEditForm({ ...editForm, program_turu: e.target.value })}
                    >
                      <option value="TYMM">TYMM</option>
                      <option value="DİĞER">DİĞER</option>
                    </select>
                  </div>
                  <div className="col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">ÜNİTE / TEMA</label>
                    <input
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      value={editForm.unite_tema || ''}
                      onChange={e => setEditForm({ ...editForm, unite_tema: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 2: Kazanım + E-İçerik Türü */}
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-8">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">KAZANIM / ÇIKTI</label>
                    <textarea
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium leading-relaxed focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none h-20"
                      value={editForm.kazanim || ''}
                      onChange={e => setEditForm({ ...editForm, kazanim: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">E-İÇERİK TÜRÜ</label>
                    <EIcerikTuruInput
                      value={editForm.e_icerik_turu || ''}
                      onChange={v => setEditForm({ ...editForm, e_icerik_turu: v })}
                    />
                  </div>
                </div>

                {/* Row 3: Açıklama (full width) */}
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">AÇIKLAMA</label>
                  <textarea
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium leading-relaxed focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-y min-h-[100px]"
                    value={editForm.aciklama || ''}
                    onChange={e => setEditForm({ ...editForm, aciklama: e.target.value })}
                  />
                </div>

                {/* Diff preview + Düzeltme Gerekçesi (sadece değişiklik varsa görünür) */}
                {(() => {
                  const fieldLabels: Record<string, string> = {
                    ders_adi: 'Ders Adı', unite_tema: 'Ünite/Tema', kazanim: 'Kazanım',
                    e_icerik_turu: 'E-İçerik Türü', aciklama: 'Açıklama', program_turu: 'Program Türü',
                  };
                  const changedFields = EDIT_FIELDS.filter(f => ((editRow as any)[f] || '') !== (editForm[f] || ''));
                  if (changedFields.length === 0) return null;
                  return (
                    <>
                      <div className="mb-3 p-3 bg-amber-50/70 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Değişiklik Önizleme</p>
                        {changedFields.map(field => (
                          <div key={field} className="mb-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase mr-1">{fieldLabels[field] || field}:</span>
                            <span className="text-xs"><DiffSpan oldStr={(editRow as any)[field] || ''} newStr={editForm[field] || ''} /></span>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">DÜZELTME GEREKÇESİ <span className="text-slate-300 normal-case font-medium">(boş bırakılabilir)</span></label>
                        <textarea
                          className="w-full border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 rounded-lg text-sm font-medium leading-relaxed focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-white outline-none resize-none h-16 placeholder:text-slate-300"
                          placeholder="Neden bu düzeltmeyi öneriyorsunuz? (isteğe bağlı)"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                        />
                      </div>
                    </>
                  );
                })()}

                {/* Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleSaveEdit(editRow)}
                    className="flex-1 bg-[#00966d] hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> ÖNERİYİ GÖNDER
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
                  >
                    VAZGEÇ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Silme Onay Modalı */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-2 border-slate-100">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Satır Silme Talebi</h3>
              <textarea className="w-full border-2 border-slate-100 p-4 rounded-2xl text-sm font-medium mb-6 resize-none h-24" placeholder="Silme gerekçenizi yazınız (isteğe bağlı)..." value={deleteNote} onChange={e => setDeleteNote(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={confirmDelete} className="flex-1 bg-[#e63931] hover:brightness-110 text-white font-black py-4 rounded-[1.5rem] transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-xs">TALEBİ GÖNDER</button>
                <button onClick={() => setDeleteModal({ open: false, id: null })} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">VAZGEÇ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geri Alma Onay Modalı */}
      {withdrawModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border-2 border-slate-100">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-100">
                <Undo size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Öneriyi Geri Al</h3>
              <p className="text-sm text-slate-500 mb-6">
                {withdrawModal.alan && <><span className="font-bold text-slate-700">{withdrawModal.alan}</span> alanındaki </>}
                önerinizi geri almak istediğinize emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={async () => { await onWithdraw(withdrawModal.type, withdrawModal.id); setWithdrawModal({ open: false, type: 'degisiklik', id: 0 }); }} className="flex-1 bg-red-600 hover:brightness-110 text-white font-black py-3.5 rounded-[1.5rem] transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-xs">GERİ AL</button>
                <button onClick={() => setWithdrawModal({ open: false, type: 'degisiklik', id: 0 })} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3.5 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">VAZGEÇ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reddetme Modalı */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-2 border-slate-100">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-100">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Talebi Reddet</h3>
              <textarea className="w-full border-2 border-slate-100 p-4 rounded-2xl text-sm font-medium mb-6 resize-none h-24" placeholder="Red gerekçenizi yazınız..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={confirmReject} className="flex-1 bg-red-600 hover:brightness-110 text-white font-black py-4 rounded-[1.5rem] transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-xs">REDDET</button>
                <button onClick={() => setRejectModal({ open: false, type: '', id: null })} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">VAZGEÇ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Satır Düzenleme Modalı (öğretmen kendi önerisini düzenler) */}
      {editNewRowModal.open && editNewRowModal.proposal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black text-emerald-700">Yeni Satır Önerisini Düzenle</span>
              <button onClick={() => setEditNewRowModal({ open: false, proposal: null })} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">DERS ADI</label>
                  <select className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold" value={editNewRowForm.ders_adi || ''} onChange={e => setEditNewRowForm({ ...editNewRowForm, ders_adi: e.target.value })}>
                    <option value="">Ders Seç...</option>
                    {(profile.rol === 'admin' ? allLessons : profile.atanan_dersler).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">PROGRAM</label>
                  <select className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold" value={editNewRowForm.program_turu || 'TYMM'} onChange={e => setEditNewRowForm({ ...editNewRowForm, program_turu: e.target.value })}>
                    <option value="TYMM">TYMM</option>
                    <option value="DİĞER">DİĞER</option>
                  </select>
                </div>
                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">ÜNİTE / TEMA</label>
                  <input className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold" value={editNewRowForm.unite_tema || ''} onChange={e => setEditNewRowForm({ ...editNewRowForm, unite_tema: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">KAZANIM / ÇIKTI</label>
                  <textarea className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium resize-none h-20" value={editNewRowForm.kazanim || ''} onChange={e => setEditNewRowForm({ ...editNewRowForm, kazanim: e.target.value })} />
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">E-İÇERİK TÜRÜ</label>
                  <EIcerikTuruInput value={editNewRowForm.e_icerik_turu || ''} onChange={v => setEditNewRowForm({ ...editNewRowForm, e_icerik_turu: v })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">AÇIKLAMA</label>
                <textarea className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium resize-y min-h-[80px]" value={editNewRowForm.aciklama || ''} onChange={e => setEditNewRowForm({ ...editNewRowForm, aciklama: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">GEREKÇE <span className="text-slate-300 normal-case font-medium">(isteğe bağlı)</span></label>
                <textarea className="w-full border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 rounded-lg text-sm font-medium resize-none h-14 placeholder:text-slate-300" placeholder="Neden bu satırı ekliyorsunuz?" value={editNewRowForm.gerekce || ''} onChange={e => setEditNewRowForm({ ...editNewRowForm, gerekce: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={async () => {
                    if (onUpdateProposal && editNewRowModal.proposal) {
                      await onUpdateProposal('yeni_satir', editNewRowModal.proposal.id, editNewRowForm);
                      setEditNewRowModal({ open: false, proposal: null });
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:brightness-110 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <Save size={14} /> KAYDET
                </button>
                <button onClick={() => setEditNewRowModal({ open: false, proposal: null })} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs">VAZGEÇ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderator Edit + Approve Modal */}
      {editProposalModal.open && editProposalModal.proposal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-100">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-100">
                  <PenLine size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Öneriyi Düzenle & Onayla</h3>
                  <p className="text-sm text-slate-400 mt-1">Değerleri düzenleyip onaylayabilirsiniz</p>
                </div>
              </div>

              {editProposalModal.type === 'degisiklik' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                      Alan: {(editProposalModal.proposal as DegisiklikOnerisi).alan}
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Eski değer: <span className="font-bold text-red-500">{(editProposalModal.proposal as DegisiklikOnerisi).eski_deger}</span></p>
                    {(editProposalModal.proposal as DegisiklikOnerisi).alan === 'e_icerik_turu' ? (
                      <EIcerikTuruInput value={editProposalForm.yeni_deger || ''} onChange={v => setEditProposalForm({ ...editProposalForm, yeni_deger: v })} />
                    ) : (
                      <textarea
                        className="w-full border-2 border-blue-200 p-4 rounded-2xl text-sm font-medium resize-none h-32 focus:ring-2 focus:ring-blue-400 outline-none"
                        value={editProposalForm.yeni_deger || ''}
                        onChange={e => setEditProposalForm({ ...editProposalForm, yeni_deger: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">DERS ADI</label>
                    <input className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold" value={editProposalForm.ders_adi || ''} onChange={e => setEditProposalForm({ ...editProposalForm, ders_adi: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">ÜNİTE/TEMA</label>
                    <input className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold" value={editProposalForm.unite_tema || ''} onChange={e => setEditProposalForm({ ...editProposalForm, unite_tema: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">KAZANIM</label>
                    <textarea className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold h-20 resize-none" value={editProposalForm.kazanim || ''} onChange={e => setEditProposalForm({ ...editProposalForm, kazanim: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">E-İÇERİK TÜRÜ</label>
                    <EIcerikTuruInput value={editProposalForm.e_icerik_turu || ''} onChange={v => setEditProposalForm({ ...editProposalForm, e_icerik_turu: v })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">AÇIKLAMA</label>
                    <textarea className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm h-20 resize-none" value={editProposalForm.aciklama || ''} onChange={e => setEditProposalForm({ ...editProposalForm, aciklama: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button onClick={handleEditProposalAndApprove} className="flex-1 bg-emerald-600 hover:brightness-110 text-white font-black py-4 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <Check size={16} /> DÜZENLE & ONAYLA
                </button>
                <button onClick={() => setEditProposalModal({ open: false, type: 'degisiklik', proposal: null })} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">
                  VAZGEÇ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTable;
