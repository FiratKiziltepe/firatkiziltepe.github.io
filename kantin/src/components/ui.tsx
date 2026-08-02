import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react'
import { addDays, formatWeekRange, getWeekStart } from '../lib/date'

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  return (
    <button
      className={`button button--${variant} button--${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle size={18} className="spin" aria-hidden /> : children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('modal-open')
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-panel ${wide ? 'modal-panel--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat"><X size={20} /></button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}

export function WeekPicker({ weekStart, onChange }: { weekStart: string; onChange: (value: string) => void }) {
  const currentWeek = getWeekStart()
  return (
    <div className="week-picker" aria-label="Hafta seçimi">
      <button type="button" className="icon-button" onClick={() => onChange(addDays(weekStart, -7))} aria-label="Önceki hafta"><ChevronLeft size={20} /></button>
      <div>
        <span>Hesap haftası</span>
        <strong>{formatWeekRange(weekStart)}</strong>
      </div>
      <button type="button" className="icon-button" onClick={() => onChange(addDays(weekStart, 7))} disabled={weekStart >= currentWeek} aria-label="Sonraki hafta"><ChevronRight size={20} /></button>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon ?? <CheckCircle2 size={25} />}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-intro">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-intro__action">{action}</div>}
    </header>
  )
}
