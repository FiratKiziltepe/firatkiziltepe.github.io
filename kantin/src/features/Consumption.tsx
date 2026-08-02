import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, CalendarDays, Check, Coffee, Edit3, History, Minus, PackageOpen, Plus, Search, ShoppingBasket, UserRound, XCircle } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Modal } from '../components/ui'
import { addDays, defaultConsumptionDate, formatDate, formatMoney, formatShortDate, todayInIstanbul } from '../lib/date'
import type { Category, ConsumptionEntry, Product, Profile, UpdateConsumptionInput } from '../types'

export function SummaryCard({ icon, label, value, detail, tone = 'default' }: { icon: ReactNode; label: string; value: string; detail: string; tone?: 'default' | 'accent' | 'warning' }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <div className="summary-card__icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  )
}

export function ConsumptionModal({
  open,
  onClose,
  products,
  categories,
  customers,
  currentProfile,
  defaultCustomerId,
  initialProductId,
  initialConsumedOn,
  entry,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  products: Product[]
  categories: Category[]
  customers: Profile[]
  currentProfile: Profile
  defaultCustomerId: string
  initialProductId?: number | null
  initialConsumedOn?: string
  entry?: ConsumptionEntry | null
  onSubmit: (input: { customerId: string; productId: number; quantity: number; consumedOn: string; reason?: string; isCancelled?: boolean }) => Promise<void>
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | 'all'>('all')
  const [productId, setProductId] = useState(entry?.productId ?? initialProductId ?? products.find((item) => item.isActive)?.id ?? 0)
  const [customerId, setCustomerId] = useState(entry?.customerId ?? defaultCustomerId)
  const [quantity, setQuantity] = useState(entry?.quantity ?? 1)
  const [consumedOn, setConsumedOn] = useState(entry?.consumedOn ?? initialConsumedOn ?? defaultConsumptionDate())
  const [reason, setReason] = useState('')
  const [isCancelled, setIsCancelled] = useState(entry?.isCancelled ?? false)
  const activeCategoryIds = new Set(categories.filter((item) => item.isActive).map((item) => item.id))
  const activeProducts = products.filter((item) => (item.isActive && activeCategoryIds.has(item.categoryId)) || item.id === entry?.productId)
  const filteredProducts = activeProducts.filter((product) => {
    const matchesCategory = categoryId === 'all' || product.categoryId === categoryId
    const matchesSearch = product.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))
    return matchesCategory && matchesSearch
  })
  const selectedProduct = products.find((item) => item.id === productId)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit({ customerId, productId, quantity, consumedOn, reason, isCancelled })
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Kaydı düzelt' : 'Tüketime ürün ekle'} description={entry ? 'Değişiklik gerekçen kayıt geçmişinde görünecek.' : 'Ürünü, adedi ve tüketim gününü seç.'} wide>
      <form onSubmit={submit} className="consumption-form">
        {currentProfile.role === 'canteen' && !entry && (
          <Field label="Müşteri">
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
              {customers.filter((item) => item.isActive).map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}
            </select>
          </Field>
        )}

        <div className="product-picker">
          <div className="product-picker__toolbar">
            <div className="search-input"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ürün ara..." /></div>
            <div className="category-pills">
              <button type="button" className={categoryId === 'all' ? 'is-active' : ''} onClick={() => setCategoryId('all')}>Tümü</button>
              {categories.filter((item) => item.isActive).map((category) => (
                <button key={category.id} type="button" className={categoryId === category.id ? 'is-active' : ''} onClick={() => setCategoryId(category.id)}>{category.name}</button>
              ))}
            </div>
          </div>
          <div className="product-grid product-grid--modal">
            {filteredProducts.map((product) => {
              const category = categories.find((item) => item.id === product.categoryId)
              return (
                <button key={product.id} type="button" className={productId === product.id ? 'product-option is-selected' : 'product-option'} onClick={() => setProductId(product.id)}>
                  <span className="product-option__icon">{product.categoryId === 1 ? <Coffee size={20} /> : <ShoppingBasket size={20} />}</span>
                  <span><strong>{product.name}</strong><small>{category?.name}</small></span>
                  <b>{formatMoney(product.currentPrice)}</b>
                  {productId === product.id && <i><Check size={14} /></i>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="consumption-form__details">
          <Field label="Adet">
            <div className="quantity-stepper">
              <button type="button" aria-label="Adedi azalt" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={18} /></button>
              <strong>{quantity}</strong>
              <button type="button" aria-label="Adedi artır" onClick={() => setQuantity((value) => Math.min(99, value + 1))}><Plus size={18} /></button>
            </div>
          </Field>
          <Field label="Tüketim günü" hint={currentProfile.role === 'customer' ? 'En fazla 2 gün geriye, yalnızca hafta içi' : 'Yalnızca pazartesi-cuma'}>
            <input type="date" value={consumedOn} min={currentProfile.role === 'customer' ? addDays(todayInIstanbul(), -2) : undefined} max={todayInIstanbul()} onChange={(event) => setConsumedOn(event.target.value)} required />
          </Field>
          <div className="selected-total">
            <span>Toplam</span>
            <strong>{formatMoney((selectedProduct?.currentPrice ?? 0) * quantity)}</strong>
          </div>
        </div>

        {entry && (
          <div className="edit-fields">
            <Field label="Değişiklik gerekçesi" hint="Kantinci bu açıklamayı ve önceki değerleri görecek.">
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} placeholder="Örn. Yanlış ürünü seçmişim." required />
            </Field>
            <label className="cancel-check">
              <input type="checkbox" checked={isCancelled} onChange={(event) => setIsCancelled(event.target.checked)} />
              <span><XCircle size={18} /><strong>Bu kaydı iptal et</strong><small>Kayıt silinmez, iptal edildi olarak görünür.</small></span>
            </label>
          </div>
        )}

        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Vazgeç</Button>
          <Button type="submit" loading={loading} disabled={!selectedProduct || !customerId}>{entry ? 'Değişikliği kaydet' : 'Hesaba ekle'}</Button>
        </footer>
      </form>
    </Modal>
  )
}

export function EntryList({
  entries,
  profiles,
  onEdit,
  canEdit,
  compact = false,
}: {
  entries: ConsumptionEntry[]
  profiles: Profile[]
  onEdit?: (entry: ConsumptionEntry) => void
  canEdit?: (entry: ConsumptionEntry) => boolean
  compact?: boolean
}) {
  if (!entries.length) return <EmptyState icon={<PackageOpen size={25} />} title="Bu haftada kayıt yok" description="Eklenen ürünler tarih sırasıyla burada görünecek." />

  return (
    <div className={`entry-list ${compact ? 'entry-list--compact' : ''}`}>
      {entries.map((entry) => {
        const creator = profiles.find((item) => item.id === entry.createdBy)
        return (
          <article className={`entry-row ${entry.isCancelled ? 'is-cancelled' : ''}`} key={entry.id}>
            <div className="entry-row__date"><CalendarDays size={17} /><span>{formatShortDate(entry.consumedOn)}</span></div>
            <div className="entry-row__main">
              <strong>{entry.productName}</strong>
              <span>{entry.categoryName} · {creator?.id === entry.customerId ? 'Kendisi ekledi' : `${creator?.displayName ?? 'Kantinci'} ekledi`}</span>
              {entry.editReason && <small><History size={13} /> Son gerekçe: {entry.editReason}</small>}
            </div>
            <div className="entry-row__quantity">{entry.quantity} adet</div>
            <div className="entry-row__price"><strong>{formatMoney(entry.totalPrice)}</strong><span>{formatMoney(entry.unitPrice)} / adet</span></div>
            <div className="entry-row__status">
              {entry.isCancelled ? <Badge tone="danger">İptal</Badge> : entry.revisionCount > 0 ? <Badge tone="warning">{entry.revisionCount} düzeltme</Badge> : <Badge tone="success">Geçerli</Badge>}
            </div>
            {onEdit && canEdit?.(entry) && <button className="icon-button entry-row__edit" type="button" onClick={() => onEdit(entry)} aria-label={`${entry.productName} kaydını düzenle`}><Edit3 size={17} /></button>}
          </article>
        )
      })}
    </div>
  )
}

export function ActivityList({ revisions, profiles }: { revisions: Array<{ id: number; customerId: string; changedBy: string; reason: string; oldData: Record<string, unknown>; newData: Record<string, unknown>; changedAt: string }>; profiles: Profile[] }) {
  if (!revisions.length) return <EmptyState icon={<History size={25} />} title="Düzeltme hareketi yok" description="Gerekçeli değişiklikler burada eski ve yeni değerleriyle görünecek." />

  return (
    <div className="activity-list">
      {revisions.map((revision) => {
        const customer = profiles.find((item) => item.id === revision.customerId)
        const actor = profiles.find((item) => item.id === revision.changedBy)
        const oldName = String(revision.oldData.product_name ?? 'Ürün')
        const newName = String(revision.newData.product_name ?? 'Ürün')
        const oldQty = Number(revision.oldData.quantity ?? 0)
        const newQty = Number(revision.newData.quantity ?? 0)
        const cancelled = Boolean(revision.newData.is_cancelled)
        return (
          <article key={revision.id} className="activity-item">
            <div className="activity-item__avatar">{customer?.displayName.slice(0, 1) ?? '?'}</div>
            <div className="activity-item__body">
              <div><strong>{customer?.displayName ?? 'Müşteri'}</strong><span>{actor?.displayName ?? 'Kullanıcı'} tarafından değiştirildi</span></div>
              <p>“{revision.reason}”</p>
              <div className="activity-diff">
                <span className="activity-diff__old">{oldName} · {oldQty} adet</span>
                <span>→</span>
                <span className={cancelled ? 'activity-diff__cancelled' : 'activity-diff__new'}>{cancelled ? 'İptal edildi' : `${newName} · ${newQty} adet`}</span>
              </div>
            </div>
            <time>{new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(revision.changedAt))}</time>
          </article>
        )
      })}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: ReactNode }) {
  return <div className={`notice notice--${tone}`}>{tone === 'warning' ? <AlertCircle size={19} /> : <UserRound size={19} />}<span>{children}</span></div>
}

export function toUpdateInput(input: { productId: number; quantity: number; consumedOn: string; reason?: string; isCancelled?: boolean }): UpdateConsumptionInput {
  return { productId: input.productId, quantity: input.quantity, consumedOn: input.consumedOn, reason: input.reason ?? '', isCancelled: Boolean(input.isCancelled) }
}
