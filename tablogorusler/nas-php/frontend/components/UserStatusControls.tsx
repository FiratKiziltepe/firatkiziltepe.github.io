import React, { useEffect, useState } from 'react';
import type { Profile } from '../lib/apiClient';
import { manageUserStatus } from '../lib/userStatusApi';

export default function UserStatusControls({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const load = async () => {
    try {
      const result = await manageUserStatus('list');
      if (!result.statuses) throw new Error('Kullanıcı durumları alınamadı.');
      setStatuses(result.statuses); setReady(true); setMessage('');
      return true;
    } catch (error) {
      setReady(false);
      setMessage(error instanceof Error ? error.message : 'Hesap durumları alınamadı. Lütfen tekrar deneyin.');
      return false;
    }
  };
  useEffect(() => { void load(); }, [users]);
  const change = async (active: boolean, userId?: string) => {
    const label = userId ? users.find(u => u.id === userId)?.ad_soyad : 'Kendi hesabınız dışındaki tüm kullanıcılar';
    if (!window.confirm(`${label} ${active ? 'aktif' : 'pasif'} yapılacak. Devam edilsin mi?`)) return;
    setBusy(true); setMessage('');
    try {
      const result = await manageUserStatus('set', active, userId);
      if (await load()) setMessage(`${result.updated} hesap güncellendi.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'İşlem başarısız.'); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
    <h3 className="font-bold text-slate-700">Kullanıcı erişimi</h3>
    <div className="flex flex-wrap gap-2">
      <button disabled={busy || !ready} onClick={() => change(true)} className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40">Tüm kullanıcıları aktif yap</button>
      <button disabled={busy || !ready} onClick={() => change(false)} className="bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40">Tüm kullanıcıları pasif yap</button>
      <button disabled={busy} onClick={load} className="px-3 py-2 text-xs font-bold">Durumları yenile</button>
    </div>
    <p className="text-xs text-slate-500">Kendi hesabınız toplu işlemlerden hariç tutulur. Pasif hesaplar yeniden giriş yapamaz; açık oturumların erişimi bir sonraki sunucu isteğinde kesilir.</p>
    {message && <p role="status" className="text-sm text-amber-800">{message}</p>}
    {ready && <details><summary className="cursor-pointer text-sm font-bold">Kullanıcı durumları</summary>
      <input aria-label="Duruma göre kullanıcı listesinde ara" placeholder="Kullanıcı ara..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-xl p-2 my-2 text-sm w-full" />
      <div className="max-h-64 overflow-auto space-y-2">{users.filter(u => `${u.ad_soyad} ${u.kullanici_adi}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))).map(u => <div key={u.id} className="flex justify-between items-center gap-3 text-sm"><span>{u.ad_soyad} · {statuses[u.id] === undefined ? 'Bilinmiyor' : statuses[u.id] ? 'Aktif' : 'Pasif'}</span><button disabled={busy || u.id === currentUserId || statuses[u.id] === undefined} onClick={() => change(!statuses[u.id], u.id)} className="bg-slate-100 px-3 py-1 rounded-lg disabled:opacity-40">{statuses[u.id] ? 'Pasif yap' : 'Aktif yap'}</button></div>)}</div>
    </details>}
  </section>;
}
