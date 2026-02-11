import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import type { EIcerik, DegisiklikOnerisi, YeniSatirOnerisi, SilmeTalebi, DegisiklikLogu, Profile } from './lib/supabase';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ContentTable from './components/ContentTable';
import AdminPanel from './components/AdminPanel';
import ChangeHistory from './components/ChangeHistory';
import ReportPanel from './components/ReportPanel';

/** Eşzamanlı kullanım için retry mekanizması (70+ kullanıcı desteği) */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 500): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err?.code === '40001' || err?.code === 'PGRST116' || err?.message?.includes('deadlock') || err?.message?.includes('could not serialize') || err?.message?.includes('Too Many');
      if (isRetryable && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1) + Math.random() * 300));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

const App: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [data, setData] = useState<EIcerik[]>([]);
  const [proposals, setProposals] = useState<DegisiklikOnerisi[]>([]);
  const [newRowProposals, setNewRowProposals] = useState<YeniSatirOnerisi[]>([]);
  const [deleteProposals, setDeleteProposals] = useState<SilmeTalebi[]>([]);
  const [logs, setLogs] = useState<DegisiklikLogu[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'admin' | 'history' | 'report'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Supabase varsayılan 1000 satır limiti olduğu için tüm veriyi çeken yardımcı fonksiyon
  const fetchAllRows = useCallback(async (table: string, orderCol: string, ascending: boolean, filterCol?: string, filterVals?: string[]) => {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      let query = supabase.from(table).select('*').order(orderCol, { ascending }).range(from, from + PAGE_SIZE - 1);
      if (filterCol && filterVals && filterVals.length > 0) {
        query = query.in(filterCol, filterVals);
      }
      const { data: rows } = await query;
      if (rows && rows.length > 0) {
        allRows = allRows.concat(rows);
        from += PAGE_SIZE;
        if (rows.length < PAGE_SIZE) hasMore = false;
      } else {
        hasMore = false;
      }
    }
    return allRows;
  }, []);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setDataLoading(true);

    // Tüm sorguları paralel çalıştır (çok daha hızlı)
    const filterCol = (profile.rol !== 'admin' && profile.atanan_dersler.length > 0) ? 'ders_adi' : undefined;
    const filterVals = filterCol ? profile.atanan_dersler : undefined;

    const [eIcerikler, degOnerileri, yeniSatirlar, silmeTalepleri, loglar, kullanicilar] = await Promise.all([
      fetchAllRows('e_icerikler', 'sira_no', true, filterCol, filterVals),
      supabase.from('degisiklik_onerileri').select('*').order('created_at', { ascending: false }).limit(5000).then(r => r.data),
      supabase.from('yeni_satir_onerileri').select('*').order('created_at', { ascending: false }).limit(5000).then(r => r.data),
      supabase.from('silme_talepleri').select('*').order('created_at', { ascending: false }).limit(5000).then(r => r.data),
      supabase.from('degisiklik_loglari').select('*').order('created_at', { ascending: false }).limit(100).then(r => r.data),
      supabase.from('profiles').select('*').order('created_at', { ascending: true }).then(r => r.data),
    ]);

    // Başlık satırlarını filtrele (Excel'den gelen header row'lar)
    const HEADER_VALUES = ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA', 'KAZANIM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'PROGRAM TÜRÜ',
      'sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu',
      'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'KAZANIM/ÇIKTI', 'Program Türü'];
    const cleanData = eIcerikler ? eIcerikler.filter((row: any) => !HEADER_VALUES.includes(row.ders_adi)) : [];
    setData(cleanData);
    if (degOnerileri) setProposals(degOnerileri);
    if (yeniSatirlar) setNewRowProposals(yeniSatirlar);
    if (silmeTalepleri) setDeleteProposals(silmeTalepleri);
    if (loglar) setLogs(loglar);
    if (kullanicilar) setUsers(kullanicilar);

    setDataLoading(false);
  }, [profile, fetchAllRows]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  const addLog = useCallback(async (islemTipi: string, aciklama: string, eIcerikId?: number) => {
    if (!user) return;
    const logEntry = {
      user_id: user.id,
      islem_tipi: islemTipi,
      aciklama,
      e_icerik_id: eIcerikId || null,
    };
    const { data: newLog } = await supabase.from('degisiklik_loglari').insert(logEntry).select().single();
    if (newLog) setLogs(prev => [newLog, ...prev]);
  }, [user]);

  // Degisiklik onerisi (alan bazli) - retry ile
  const handleProposeChange = useCallback(async (eIcerikId: number, alan: string, eskiDeger: string, yeniDeger: string, gerekce?: string) => {
    if (!user) return;
    const { data: newProposal } = await withRetry(() =>
      supabase.from('degisiklik_onerileri').insert({
        e_icerik_id: eIcerikId,
        user_id: user.id,
        alan,
        eski_deger: eskiDeger,
        yeni_deger: yeniDeger,
        gerekce: gerekce || null,
      }).select().single().then(r => { if (r.error) throw r.error; return r; })
    );
    if (newProposal) {
      setProposals(prev => [newProposal, ...prev]);
      await addLog('degisiklik_onerisi', `${alan} alanı için düzenleme önerisi`, eIcerikId);
    }
  }, [user, addLog]);

  // Yeni satir onerisi - retry ile
  const handleProposeNewRow = useCallback(async (satir: Partial<YeniSatirOnerisi>) => {
    if (!user) return;
    const { data: newProposal } = await withRetry(() =>
      supabase.from('yeni_satir_onerileri').insert({
        user_id: user.id,
        ders_adi: satir.ders_adi,
        unite_tema: satir.unite_tema,
        kazanim: satir.kazanim,
        e_icerik_turu: satir.e_icerik_turu,
        aciklama: satir.aciklama,
        program_turu: satir.program_turu,
        gerekce: satir.gerekce || null,
      }).select().single().then(r => { if (r.error) throw r.error; return r; })
    );
    if (newProposal) {
      setNewRowProposals(prev => [newProposal, ...prev]);
      await addLog('yeni_satir_onerisi', `${satir.ders_adi} için yeni satır ekleme önerisi`);
    }
  }, [user, addLog]);

  // Silme talebi - retry ile
  const handleProposeDelete = useCallback(async (eIcerikId: number, aciklama: string) => {
    if (!user) return;
    const { data: newDel } = await withRetry(() =>
      supabase.from('silme_talepleri').insert({
        e_icerik_id: eIcerikId,
        user_id: user.id,
        aciklama,
      }).select().single().then(r => { if (r.error) throw r.error; return r; })
    );
    if (newDel) {
      setDeleteProposals(prev => [newDel, ...prev]);
      await addLog('silme_talebi', `Satır silme talebi`, eIcerikId);
    }
  }, [user, addLog]);

  // Onaylama/Reddetme - retry ile
  const handleResolveProposal = useCallback(async (
    type: 'degisiklik' | 'yeni_satir' | 'silme',
    proposalId: number,
    durum: 'approved' | 'rejected',
    redNedeni?: string
  ) => {
    if (!user) return;
    const table = type === 'degisiklik' ? 'degisiklik_onerileri' : type === 'yeni_satir' ? 'yeni_satir_onerileri' : 'silme_talepleri';

    await withRetry(() =>
      supabase.from(table).update({
        durum,
        onaylayan_id: user.id,
        onay_tarihi: new Date().toISOString(),
        red_nedeni: redNedeni || null,
      }).eq('id', proposalId).then(r => { if (r.error) throw r.error; return r; })
    );

    if (durum === 'approved') {
      if (type === 'degisiklik') {
        const proposal = proposals.find(p => p.id === proposalId);
        if (proposal) {
          // Veriyi güncelle (hata kontrolü ile)
          const { error: updateErr } = await supabase.from('e_icerikler').update({
            [proposal.alan]: proposal.yeni_deger,
            updated_at: new Date().toISOString(),
          }).eq('id', proposal.e_icerik_id);
          if (updateErr) {
            console.error('e_icerikler güncelleme hatası:', updateErr);
            alert('Veri güncellenirken hata oluştu: ' + updateErr.message);
          }

          // Aynı satır+alan için diğer bekleyen önerileri otomatik reddet
          const otherProposals = proposals.filter(
            p => p.id !== proposalId &&
              p.e_icerik_id === proposal.e_icerik_id &&
              p.alan === proposal.alan &&
              p.durum === 'pending'
          );
          for (const op of otherProposals) {
            await supabase.from('degisiklik_onerileri').update({
              durum: 'rejected',
              onaylayan_id: user.id,
              onay_tarihi: new Date().toISOString(),
              red_nedeni: 'Aynı alan için başka bir öneri onaylandı',
            }).eq('id', op.id);
          }
        }
      } else if (type === 'yeni_satir') {
        const proposal = newRowProposals.find(p => p.id === proposalId);
        if (proposal) {
          const maxSiraNo = data.length > 0 ? Math.max(...data.map(d => d.sira_no)) : 0;
          const { error: insertErr } = await supabase.from('e_icerikler').insert({
            sira_no: maxSiraNo + 1,
            ders_adi: proposal.ders_adi,
            unite_tema: proposal.unite_tema,
            kazanim: proposal.kazanim,
            e_icerik_turu: proposal.e_icerik_turu,
            aciklama: proposal.aciklama,
            program_turu: proposal.program_turu,
          });
          if (insertErr) {
            console.error('e_icerikler ekleme hatası:', insertErr);
            alert('Yeni satır eklenirken hata oluştu: ' + insertErr.message);
          }
        }
      } else if (type === 'silme') {
        const proposal = deleteProposals.find(p => p.id === proposalId);
        if (proposal) {
          // Satırı sil
          const { error: deleteErr } = await supabase.from('e_icerikler').delete().eq('id', proposal.e_icerik_id);
          if (deleteErr) {
            console.error('e_icerikler silme hatası:', deleteErr);
            alert('Satır silinirken hata oluştu: ' + deleteErr.message);
          }

          // Aynı satır için diğer bekleyen silme taleplerini otomatik reddet
          const otherDelProposals = deleteProposals.filter(
            p => p.id !== proposalId &&
              p.e_icerik_id === proposal.e_icerik_id &&
              p.durum === 'pending'
          );
          for (const op of otherDelProposals) {
            await supabase.from('silme_talepleri').update({
              durum: 'rejected',
              onaylayan_id: user.id,
              onay_tarihi: new Date().toISOString(),
              red_nedeni: 'Satır başka bir talep ile silindi',
            }).eq('id', op.id);
          }

          // Aynı satır için bekleyen düzenleme önerilerini de otomatik reddet
          const relatedProposals = proposals.filter(
            p => p.e_icerik_id === proposal.e_icerik_id && p.durum === 'pending'
          );
          for (const rp of relatedProposals) {
            await supabase.from('degisiklik_onerileri').update({
              durum: 'rejected',
              onaylayan_id: user.id,
              onay_tarihi: new Date().toISOString(),
              red_nedeni: 'Satır silme talebi onaylandığı için reddedildi',
            }).eq('id', rp.id);
          }
        }
      }
    }

    await addLog(
      durum === 'approved' ? 'onaylandi' : 'reddedildi',
      `${type} talebi ${durum === 'approved' ? 'onaylandı' : 'reddedildi'}`
    );
    await fetchData();
  }, [user, proposals, newRowProposals, deleteProposals, data, addLog, fetchData]);

  // Talep geri cekme - retry ile
  const handleWithdrawProposal = useCallback(async (type: 'degisiklik' | 'yeni_satir' | 'silme', proposalId: number) => {
    const table = type === 'degisiklik' ? 'degisiklik_onerileri' : type === 'yeni_satir' ? 'yeni_satir_onerileri' : 'silme_talepleri';
    try {
      await withRetry(() =>
        supabase.from(table).delete().eq('id', proposalId).then(r => { if (r.error) throw r.error; return r; })
      );
    } catch (error: any) {
      console.error('Withdraw error:', error);
      alert('Talep iptal edilemedi: ' + error.message);
      return;
    }
    await addLog('talep_geri_cekildi', `${type} talebi geri çekildi`);
    await fetchData();
  }, [addLog, fetchData]);

  // Öneriyi düzenleme (moderatör veya öğretmen kendi önerisini) - retry ile
  const handleUpdateProposal = useCallback(async (
    type: 'degisiklik' | 'yeni_satir',
    proposalId: number,
    updatedData: Record<string, string>
  ) => {
    const table = type === 'degisiklik' ? 'degisiklik_onerileri' : 'yeni_satir_onerileri';
    try {
      await withRetry(() =>
        supabase.from(table).update(updatedData).eq('id', proposalId).then(r => { if (r.error) throw r.error; return r; })
      );
    } catch (error: any) {
      console.error('Update proposal error:', error);
      alert('Öneri güncellenemedi: ' + error.message);
      return;
    }
    await addLog('oneri_duzenlendi', `${type} önerisi düzenlendi`);
    await fetchData();
  }, [addLog, fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={profile.rol} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  profile={profile}
                  dataCount={data.length}
                  pendingCount={
                    proposals.filter(p => p.durum === 'pending').length +
                    newRowProposals.filter(p => p.durum === 'pending').length +
                    deleteProposals.filter(p => p.durum === 'pending').length
                  }
                  logs={logs.slice(0, 10)}
                  users={users}
                />
              )}
          {activeTab === 'table' && (
            <ContentTable 
                  data={data}
                  profile={profile}
                  proposals={proposals}
                  newRowProposals={newRowProposals}
                  deleteProposals={deleteProposals}
                  onProposeChange={handleProposeChange}
                  onProposeNewRow={handleProposeNewRow}
                  onProposeDelete={handleProposeDelete}
              onResolve={handleResolveProposal}
              onWithdraw={handleWithdrawProposal}
                  onUpdateProposal={handleUpdateProposal}
                  users={users}
                />
              )}
              {activeTab === 'history' && (
                <ChangeHistory
                  data={data}
                  proposals={proposals}
                  newRowProposals={newRowProposals}
                  deleteProposals={deleteProposals}
                  users={users}
                  profile={profile}
                />
              )}
              {activeTab === 'report' && profile.rol === 'admin' && (
                <ReportPanel data={data} />
              )}
              {activeTab === 'admin' && profile.rol === 'admin' && (
            <AdminPanel 
              users={users} 
              logs={logs} 
              data={data} 
                  onRefresh={fetchData}
                  profile={profile}
            />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
