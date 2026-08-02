import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Coffee, LogOut, ShieldCheck } from 'lucide-react'
import type { Profile } from '../types'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}

export function AppShell({
  profile,
  items,
  activeItem,
  onNavigate,
  onSignOut,
  topbar,
  children,
}: {
  profile: Profile
  items: NavItem[]
  activeItem: string
  onNavigate: (id: string) => void
  onSignOut: () => void
  topbar?: ReactNode
  children: ReactNode
}) {
  const initials = profile.displayName.split(' ').slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR')
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark"><Coffee size={23} /></div>
          <div><strong>Kantin</strong><span>Şeffaf hesap defteri</span></div>
        </div>

        <nav className="sidebar-nav" aria-label="Ana menü">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" className={activeItem === item.id ? 'is-active' : ''} onClick={() => onNavigate(item.id)}>
                <Icon size={20} /><span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          <div className="sidebar-profile__copy">
            <strong>{profile.displayName}</strong>
            <span>{profile.role === 'canteen' ? (profile.isManager ? 'Yönetici kantinci' : 'Kantinci') : 'Müşteri'}</span>
          </div>
          <button type="button" className="icon-button icon-button--dark" onClick={onSignOut} aria-label="Çıkış yap"><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <div className="brand brand--mobile"><div className="brand__mark"><Coffee size={21} /></div><strong>Kantin</strong></div>
          <div className="mobile-header__user"><span>{initials}</span>{profile.isManager && <ShieldCheck size={16} />}</div>
        </header>
        {topbar && <div className="content-topbar">{topbar}</div>}
        <main className="page-content">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobil menü">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} type="button" className={activeItem === item.id ? 'is-active' : ''} onClick={() => onNavigate(item.id)}>
              <Icon size={20} /><span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
