import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CloudUpload, LoaderCircle, RefreshCw, WifiOff, XCircle } from 'lucide-react'
import { appConfig, hasSupabaseConfig } from './lib/config'
import { getWeekStart } from './lib/date'
import type { OfflineSyncState, Profile, WeekData } from './types'
import type { KantinRepository } from './services/repository'
import { DemoRepository } from './services/demoRepository'
import { SupabaseRepository } from './services/supabaseRepository'
import { LoginScreen, ForcePasswordScreen, SetupScreen } from './features/AuthScreens'
import { CustomerApp } from './features/CustomerApp'
import { CanteenApp } from './features/CanteenApp'
import { Button } from './components/ui'

type Toast = { message: string; tone: 'success' | 'error' }

export default function App() {
  const repository = useMemo<KantinRepository>(() => appConfig.demoMode ? new DemoRepository() : new SupabaseRepository(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<WeekData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [booting, setBooting] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [syncState, setSyncState] = useState<OfflineSyncState>(() => repository.getOfflineSyncState())

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => repository.subscribeOfflineSync(setSyncState), [repository])

  const refresh = useCallback(async () => {
    if (!profile) return
    const nextData = await repository.loadWeek(weekStart)
    setData(nextData)
  }, [profile, repository, weekStart])

  useEffect(() => {
    if (!profile) return
    const syncWhenOnline = () => {
      void repository.syncPendingConsumptions()
        .then(refresh)
        .catch(() => undefined)
    }
    window.addEventListener('online', syncWhenOnline)
    return () => window.removeEventListener('online', syncWhenOnline)
  }, [profile, refresh, repository])

  const syncNow = async () => {
    try {
      await repository.syncPendingConsumptions()
      await refresh()
      const next = repository.getOfflineSyncState()
      notify(next.failedCount ? `${next.failedCount} kayıt sunucu kontrolünden geçemedi.` : 'Bekleyen kayıtlar senkronize edildi.', next.failedCount ? 'error' : 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Senkronizasyon tamamlanamadı.', 'error')
    }
  }

  useEffect(() => {
    if (!appConfig.demoMode && !hasSupabaseConfig) {
      setBooting(false)
      return
    }
    repository.getCurrentProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setBooting(false))
  }, [repository])

  useEffect(() => {
    if (!profile || profile.mustChangePassword) return
    setData(null)
    setDataError(null)
    repository.loadWeek(weekStart)
      .then(setData)
      .catch((error) => setDataError(error instanceof Error ? error.message : 'Veriler yüklenemedi.'))
  }, [profile, repository, weekStart, loadVersion])

  const signIn = async (username: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const nextProfile = await repository.signIn(username, password)
      setProfile(nextProfile)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Giriş yapılamadı.')
    } finally {
      setAuthLoading(false)
    }
  }

  const changePassword = async (password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await repository.changeOwnPassword(password)
      setProfile((current) => current ? { ...current, mustChangePassword: false } : current)
      notify('Parolan kaydedildi.')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Parola değiştirilemedi.')
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await repository.signOut()
    } finally {
      setProfile(null)
      setData(null)
      setDataError(null)
      setAuthError(null)
      setWeekStart(getWeekStart())
    }
  }

  if (!appConfig.demoMode && !hasSupabaseConfig) return <SetupScreen />

  if (booting) {
    return <div className="full-loader"><LoaderCircle className="spin" size={34} /><span>Kantin defteri açılıyor…</span></div>
  }

  if (!profile) {
    return <LoginScreen onSubmit={signIn} loading={authLoading} error={authError} demoUsers={repository.demoUsers} />
  }

  if (profile.mustChangePassword) {
    return <ForcePasswordScreen displayName={profile.displayName} onSubmit={changePassword} loading={authLoading} error={authError} />
  }

  if (!data) {
    if (dataError) {
      return <div className="full-loader"><XCircle size={34} /><span>{dataError}</span><Button onClick={() => setLoadVersion((value) => value + 1)}>Tekrar dene</Button><Button variant="ghost" onClick={signOut}>Çıkış yap</Button></div>
    }
    return <div className="full-loader"><LoaderCircle className="spin" size={34} /><span>Haftalık hesap hazırlanıyor…</span></div>
  }

  return (
    <>
      {profile.role === 'customer' ? (
        <CustomerApp profile={profile} data={data} weekStart={weekStart} onWeekChange={setWeekStart} repository={repository} onRefresh={refresh} onSignOut={signOut} notify={notify} />
      ) : (
        <CanteenApp profile={profile} data={data} weekStart={weekStart} onWeekChange={setWeekStart} repository={repository} onRefresh={refresh} onSignOut={signOut} notify={notify} />
      )}
      {(!syncState.isOnline || syncState.pendingCount > 0 || syncState.isSyncing) && (
        <div className={`offline-status ${!syncState.isOnline ? 'is-offline' : ''} ${syncState.failedCount ? 'has-error' : ''}`} role="status">
          <span className="offline-status__icon">{syncState.isOnline ? <CloudUpload size={19} /> : <WifiOff size={19} />}</span>
          <span className="offline-status__copy">
            <strong>{syncState.isSyncing ? 'Kayıtlar gönderiliyor…' : !syncState.isOnline ? 'Çevrimdışı çalışıyorsunuz' : syncState.failedCount ? 'Bazı kayıtlar gönderilemedi' : 'Senkronizasyon bekleniyor'}</strong>
            <small>{syncState.pendingCount ? `${syncState.pendingCount} kayıt bu cihazda bekliyor.` : 'Son indirilen veriler gösteriliyor.'}</small>
          </span>
          {syncState.pendingCount > 0 && (
            <button type="button" onClick={syncNow} disabled={syncState.isSyncing}><RefreshCw className={syncState.isSyncing ? 'spin' : ''} size={17} /> Şimdi gönder</button>
          )}
        </div>
      )}
      {toast && (
        <div className={`toast toast--${toast.tone}`} role="status">
          {toast.tone === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Bildirimi kapat">×</button>
        </div>
      )}
    </>
  )
}
