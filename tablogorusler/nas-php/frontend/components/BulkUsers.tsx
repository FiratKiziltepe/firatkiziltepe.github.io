import React, { useMemo, useState } from 'react';
import type { Profile } from '../lib/apiClient';
import { prepareBulkUsers } from '../lib/bulkUsers';
import { callAdminFunction } from '../lib/adminApi';

type Props = { users: Profile[]; onClose: () => void; onRefresh: () => Promise<void> };

export default function BulkUsers({ users, onClose, onRefresh }: Props) {
  const [names, setNames] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState('teacher');
  const [busy, setBusy] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<ReturnType<typeof prepareBulkUsers>>([]);
  const preview = useMemo(() => prepareBulkUsers(names, users.map(user => user.kullanici_adi)), [names, users]);
  const rows = started ? batch : preview;

  const submit = async () => {
    const pending = started ? batch : preview;
    if (!pending.length || pending.some(row => !row.valid) || password.length < 6) return;
    if (!started) { setBatch(pending); setStarted(true); }
    setBusy(true);
    for (const row of pending) {
      if (completed.has(row.kullanici_adi)) continue;
      try {
        await callAdminFunction('create-user', { ...row, sifre: password, brans: branch, rol: role, atanan_dersler: [] });
        setCompleted(prev => new Set([...prev, row.kullanici_adi]));
        setResults(prev => ({ ...prev, [row.kullanici_adi]: 'Oluşturuldu' }));
      } catch (error) {
        setResults(prev => ({ ...prev, [row.kullanici_adi]: error instanceof Error ? error.message : 'İşlem başarısız' }));
      }
    }
    try { await onRefresh(); }
    catch { setRefreshError('Kullanıcı listesi yenilenemedi. Sonuçları kontrol edip sayfayı yenileyin.'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="bulk-title" className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
      <h3 id="bulk-title" className="text-xl font-black">Toplu kişi ekle</h3>
      <p className="text-sm text-slate-600">Her satıra bir ad soyad yazın. Kullanıcı adları ad_soyad biçiminde oluşturulur; aynı kullanıcı adı varsa sonuna sayı eklenir. Herkes için ortak başlangıç şifresi belirleyin.</p>
      <label className="block text-sm font-bold">Kişi listesi<textarea disabled={started} rows={6} value={names} onChange={e => setNames(e.target.value)} placeholder={'Ayşe Yılmaz\nMehmet Demir'} className="block w-full border rounded-xl p-3 mt-1 disabled:bg-slate-100" /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-bold">Ortak başlangıç şifresi<input type="password" autoComplete="new-password" minLength={6} disabled={started} value={password} onChange={e => setPassword(e.target.value)} className="block border rounded-xl p-2 w-full" /><span className="text-xs font-normal">En az 6 karakter</span></label>
        <label className="text-sm font-bold">Branş<input disabled={started} value={branch} onChange={e => setBranch(e.target.value)} className="block border rounded-xl p-2 w-full" /></label>
        <label className="text-sm font-bold">Rol<select disabled={started} value={role} onChange={e => setRole(e.target.value)} className="block border rounded-xl p-2 w-full"><option value="teacher">Öğretmen</option><option value="moderator">Moderatör</option></select></label>
      </div>
      <p className="text-xs text-slate-500">Dersleri, hesaplar oluşturulduktan sonra Ders Atama ekranından seçebilirsiniz.</p>
      {rows.length > 0 && <div className="max-h-56 overflow-auto border rounded-xl"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Ad soyad</th><th className="p-2">Kullanıcı adı</th><th className="p-2">Durum</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td className="p-2">{row.ad_soyad}</td><td className="p-2">{row.kullanici_adi}</td><td className="p-2">{!row.valid ? 'Geçerli bir ad soyad girin' : results[row.kullanici_adi] || 'Hazır'}</td></tr>)}</tbody></table></div>}
      <p role="status" className="text-sm text-amber-700">{refreshError}</p>
      <p role="status" className="text-sm">{rows.length} kişi · {completed.size} oluşturuldu{busy && ' · İşleniyor...'}</p>
      <div className="flex gap-3"><button disabled={busy || !rows.length || rows.some(row => !row.valid) || password.length < 6 || (started && completed.size === rows.length)} onClick={submit} className="bg-blue-600 text-white rounded-xl px-4 py-2 font-bold disabled:opacity-40">{started ? 'Başarısızları tekrar dene' : 'Kullanıcıları oluştur'}</button><button disabled={busy} onClick={onClose} className="bg-slate-100 rounded-xl px-4 py-2 disabled:opacity-40">Kapat</button></div>
    </section>
  </div>;
}
