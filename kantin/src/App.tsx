import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { appConfig, hasSupabaseConfig } from './lib/config'
import { getWeekStart } from './lib/date'
import type { Profile, WeekData } from './types'
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

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const refresh = useCallback(async () => {
    if (!profile) return
    const nextData = await repository.loadWeek(weekStart)
    setData(nextData)
  }, [profile, repository, weekStart])

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
