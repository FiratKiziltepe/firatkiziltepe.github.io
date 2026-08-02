import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Coffee, Eye, EyeOff, KeyRound, LockKeyhole, ReceiptText, ShieldCheck, Users } from 'lucide-react'
import { Button, Field } from '../components/ui'
import type { AppRole } from '../types'

export function LoginScreen({
  onSubmit,
  loading,
  error,
  demoUsers,
}: {
  onSubmit: (username: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
  demoUsers?: Array<{ username: string; password: string; role: AppRole }>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit(username, password)
  }

  const useDemo = async (user: { username: string; password: string }) => {
    setUsername(user.username)
    setPassword(user.password)
    await onSubmit(user.username, user.password)
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="auth-story__inner">
          <div className="brand brand--auth"><div className="brand__mark"><Coffee size={24} /></div><div><strong>Kantin</strong><span>Şeffaf hesap defteri</span></div></div>
          <div className="auth-story__message">
            <span className="eyebrow eyebrow--light">Herkes hesabını bilir</span>
            <h1>Ne aldıysan,<br />hesabında o var.</h1>
            <p>İş yeri kantininiz için sade, güvenli ve iki tarafın da görebildiği haftalık tüketim takibi.</p>
          </div>
          <div className="auth-proof">
            <div><ReceiptText size={20} /><span><strong>Değişiklik geçmişi</strong><small>Her düzeltme gerekçesiyle kayıtlı</small></span></div>
            <div><ShieldCheck size={20} /><span><strong>Kişisel görünüm</strong><small>Herkes yalnızca kendi hesabını görür</small></span></div>
          </div>
        </div>
      </section>

      <section className="auth-form-area">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card__heading">
            <span className="auth-card__icon"><KeyRound size={22} /></span>
            <h2>Hesabına giriş yap</h2>
            <p>Kantincinin verdiği kullanıcı adı ve parolayı kullan.</p>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <Field label="Kullanıcı adı">
            <input autoComplete="username" autoCapitalize="none" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ör. ayse.yilmaz" required />
          </Field>
          <Field label="Parola">
            <div className="password-input">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Parolanı gir" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
          </Field>

          <Button type="submit" size="lg" loading={loading} className="auth-submit">Giriş yap <ArrowRight size={19} /></Button>

          {demoUsers && (
            <div className="demo-login">
              <span>Yerel demo hesapları</span>
              <div>
                {demoUsers.map((user) => (
                  <button key={user.username} type="button" onClick={() => useDemo(user)} disabled={loading}>
                    {user.role === 'canteen' ? <ShieldCheck size={16} /> : <Users size={16} />}
                    {user.role === 'canteen' ? 'Kantinci demosu' : 'Müşteri demosu'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="auth-help"><LockKeyhole size={15} /> Parolanı unuttuysan kantinci yeni parola verebilir.</p>
        </form>
      </section>
    </div>
  )
}

export function ForcePasswordScreen({
  displayName,
  onSubmit,
  loading,
  error,
}: {
  displayName: string
  onSubmit: (password: string) => Promise<void>
  loading: boolean
  error: string | null
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const valid = password.length >= 8 && password === confirm

  return (
    <div className="password-page">
      <form className="password-card" onSubmit={async (event) => { event.preventDefault(); if (valid) await onSubmit(password) }}>
        <div className="password-card__icon"><KeyRound size={28} /></div>
        <span className="eyebrow">İlk giriş</span>
        <h1>Merhaba {displayName.split(' ')[0]}</h1>
        <p>Kantincinin verdiği geçici parola yerine yalnızca senin bileceğin yeni bir parola belirle.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field label="Yeni parola" hint="En az 8 karakter">
          <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </Field>
        <Field label="Yeni parolayı doğrula">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={8} required />
        </Field>
        <ul className="password-checks">
          <li className={password.length >= 8 ? 'is-valid' : ''}><Check size={16} /> En az 8 karakter</li>
          <li className={password && password === confirm ? 'is-valid' : ''}><Check size={16} /> Parolalar aynı</li>
        </ul>
        <Button type="submit" size="lg" loading={loading} disabled={!valid}>Parolayı kaydet ve devam et</Button>
      </form>
    </div>
  )
}

export function SetupScreen() {
  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="brand brand--setup"><div className="brand__mark"><Coffee size={23} /></div><strong>Kantin</strong></div>
        <span className="setup-card__icon"><LockKeyhole size={28} /></span>
        <h1>Bağlantı ayarları bekleniyor</h1>
        <p>Uygulama hazır. Supabase proje adresini ve publishable key değerini GitHub Actions ortamına ekleyip yeniden derleyin.</p>
        <code>VITE_SUPABASE_URL<br />VITE_SUPABASE_PUBLISHABLE_KEY</code>
        <small>Yerel arayüzü örnek verilerle açmak için <strong>VITE_DEMO_MODE=true</strong> kullanabilirsiniz.</small>
      </div>
    </div>
  )
}
