import { useMemo, useState, type FormEvent } from 'react'
import {
  Activity, Archive, Boxes, CheckCircle2, CircleDollarSign, Coffee, Edit3, History,
  Home, KeyRound, PackagePlus, Plus, Search, ShieldCheck, ShoppingBasket, ToggleLeft,
  ToggleRight, UserPlus, Users, WalletCards,
} from 'lucide-react'
import { AppShell, type NavItem } from '../components/AppShell'
import { Badge, Button, EmptyState, Field, Modal, PageIntro, WeekPicker } from '../components/ui'
import { defaultConsumptionDate, formatMoney, getWeekEnd, getWeekStart } from '../lib/date'
import { normalizeUsername } from '../lib/config'
import type { Category, ConsumptionEntry, CreateUserInput, Product, Profile, WeekData } from '../types'
import type { KantinRepository } from '../services/repository'
import { ActivityList, ConsumptionModal, EntryList, SummaryCard, toUpdateInput } from './Consumption'

const navItems: NavItem[] = [
  { id: 'overview', label: 'Genel', icon: Home },
  { id: 'customers', label: 'Hesaplar', icon: Users },
  { id: 'activity', label: 'Düzeltmeler', icon: Activity },
  { id: 'catalog', label: 'Ürünler', icon: Boxes },
  { id: 'users', label: 'Kullanıcılar', icon: ShieldCheck },
]

type CatalogForm = { kind: 'category'; item?: Category } | { kind: 'product'; item?: Product }

export function CanteenApp({
  profile,
  data,
  weekStart,
  onWeekChange,
  repository,
  onRefresh,
  onSignOut,
  notify,
}: {
  profile: Profile
  data: WeekData
  weekStart: string
  onWeekChange: (value: string) => void
  repository: KantinRepository
  onRefresh: () => Promise<void>
  onSignOut: () => void
  notify: (message: string, tone?: 'success' | 'error') => void
}) {
  const [active, setActive] = useState('overview')
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [consumptionOpen, setConsumptionOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ConsumptionEntry | null>(null)
  const [catalogForm, setCatalogForm] = useState<CatalogForm | null>(null)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [resetUser, setResetUser] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  const customers = data.profiles.filter((item) => item.role === 'customer')
  const canteens = data.profiles.filter((item) => item.role === 'canteen')
  const validEntries = data.entries.filter((entry) => !entry.isCancelled)
  const total = validEntries.reduce((sum, entry) => sum + entry.totalPrice, 0)
  const selectedCustomer = customers.find((item) => item.id === selectedCustomerId) ?? null
  const selectedEntries = data.entries.filter((item) => item.customerId === selectedCustomerId)
  const currentWeek = weekStart === getWeekStart()

  const accountFor = (customerId: string) => data.weeklyAccounts.find((item) => item.customerId === customerId)
  const totalFor = (customerId: string) => validEntries.filter((entry) => entry.customerId === customerId).reduce((sum, entry) => sum + entry.totalPrice, 0)
  const filteredCustomers = useMemo(() => customers.filter((customer) => `${customer.displayName} ${customer.username}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))), [customers, search])
  const paidCount = customers.filter((customer) => accountFor(customer.id)?.isPaid).length

  const run = async (action: () => Promise<void>, success: string) => {
    setSaving(true)
    try {
      await action()
      notify(success)
      await onRefresh()
      return true
    } catch (error) {
      notify(error instanceof Error ? error.message : 'İşlem tamamlanamadı.', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  const openAdd = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setEditingEntry(null)
    setConsumptionOpen(true)
  }

  const submitConsumption = async (input: { customerId: string; productId: number; quantity: number; consumedOn: string; reason?: string; isCancelled?: boolean }) => {
    const ok = editingEntry
      ? await run(() => repository.updateConsumption(editingEntry.id, toUpdateInput(input)), 'Düzeltme kaydedildi ve geçmişe eklendi.')
      : await run(() => repository.addConsumption(input), 'Ürün müşteri hesabına eklendi.')
    if (ok) {
      setConsumptionOpen(false)
      setEditingEntry(null)
    }
  }

  const togglePaid = async (customer: Profile) => {
    const paid = Boolean(accountFor(customer.id)?.isPaid)
    await run(() => repository.setWeekPaid(customer.id, weekStart, !paid), paid ? 'Hafta yeniden açıldı.' : 'Hafta ödendi olarak kapatıldı.')
  }

  return (
    <AppShell profile={profile} items={navItems} activeItem={active} onNavigate={setActive} onSignOut={onSignOut} topbar={<WeekPicker weekStart={weekStart} onChange={onWeekChange} />}>
      {active === 'overview' && (
        <>
          <PageIntro eyebrow="Kantinci paneli" title="Haftanın görünümü" description="Tüm hesapların güncel durumu, toplamı ve düzeltme hareketleri." action={<Button onClick={() => setActive('customers')}><Plus size={18} /> Müşteriye ürün ekle</Button>} />
          <section className="summary-grid summary-grid--four">
            <SummaryCard icon={<CircleDollarSign size={22} />} label="Haftalık toplam" value={formatMoney(total)} detail={`${validEntries.length} geçerli hareket`} tone="accent" />
            <SummaryCard icon={<Users size={22} />} label="Aktif müşteri" value={`${customers.filter((item) => item.isActive).length}`} detail={`${customers.length} toplam hesap`} />
            <SummaryCard icon={<WalletCards size={22} />} label="Ödenmeyen" value={`${customers.length - paidCount}`} detail={`${paidCount} hesap kapatıldı`} tone="warning" />
            <SummaryCard icon={<History size={22} />} label="Düzeltme" value={`${data.revisions.length}`} detail="Seçili haftadaki hareket" />
          </section>

          <div className="overview-columns">
            <section className="panel">
              <div className="section-heading"><div><span className="eyebrow">Hesap takibi</span><h2>Ödenmemiş hesaplar</h2></div><button className="text-button" type="button" onClick={() => setActive('customers')}>Tüm hesaplar</button></div>
              <div className="account-mini-list">
                {customers.filter((customer) => !accountFor(customer.id)?.isPaid).slice(0, 6).map((customer) => (
                  <div key={customer.id}>
                    <span className="avatar avatar--small">{customer.displayName[0]}</span>
                    <span><strong>{customer.displayName}</strong><small>{data.entries.filter((item) => item.customerId === customer.id).length} hareket</small></span>
                    <b>{formatMoney(totalFor(customer.id))}</b>
                    <Button size="sm" variant="secondary" onClick={() => openAdd(customer.id)}>Ürün ekle</Button>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="section-heading"><div><span className="eyebrow">Son hareketler</span><h2>Düzeltme akışı</h2></div><button className="text-button" type="button" onClick={() => setActive('activity')}>Tümünü gör</button></div>
              <ActivityList revisions={data.revisions.slice(0, 4)} profiles={data.profiles} />
            </section>
          </div>
        </>
      )}

      {active === 'customers' && (
        <>
          <PageIntro eyebrow="Haftalık hesaplar" title="Müşteri hesapları" description="Bir müşteriyi aç, ürün ekle veya haftayı ödendi olarak kapat." />
          <div className="toolbar"><div className="search-input"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad veya kullanıcı adı ara..." /></div><div className="toolbar__meta">{filteredCustomers.length} müşteri</div></div>
          <section className="customer-table panel">
            <div className="customer-table__head"><span>Müşteri</span><span>Hareket</span><span>Toplam</span><span>Durum</span><span>İşlem</span></div>
            {filteredCustomers.map((customer) => {
              const customerEntries = data.entries.filter((item) => item.customerId === customer.id)
              const paid = Boolean(accountFor(customer.id)?.isPaid)
              return (
                <div className="customer-table__row" key={customer.id}>
                  <button type="button" className="customer-identity" onClick={() => setSelectedCustomerId(customer.id)}><span className="avatar avatar--small">{customer.displayName[0]}</span><span><strong>{customer.displayName}</strong><small>@{customer.username}</small></span></button>
                  <span>{customerEntries.length}</span>
                  <strong>{formatMoney(totalFor(customer.id))}</strong>
                  <span>{paid ? <Badge tone="success">Ödendi</Badge> : <Badge tone="warning">Ödenmedi</Badge>}</span>
                  <div className="row-actions"><Button size="sm" onClick={() => openAdd(customer.id)} disabled={paid}><Plus size={16} /> Ürün</Button><Button size="sm" variant="secondary" onClick={() => setSelectedCustomerId(customer.id)}>Hesabı aç</Button></div>
                </div>
              )
            })}
          </section>

          {selectedCustomer && (
            <section className="customer-detail panel">
              <div className="customer-detail__header">
                <div><span className="avatar">{selectedCustomer.displayName[0]}</span><span><h2>{selectedCustomer.displayName}</h2><p>@{selectedCustomer.username} · {selectedEntries.length} hareket</p></span></div>
                <div><strong>{formatMoney(totalFor(selectedCustomer.id))}</strong><span>{accountFor(selectedCustomer.id)?.isPaid ? 'Kapatılmış hesap' : 'Açık hesap'}</span></div>
                <div className="row-actions"><Button variant="secondary" onClick={() => togglePaid(selectedCustomer)} loading={saving}>{accountFor(selectedCustomer.id)?.isPaid ? <><ToggleLeft size={18} /> Haftayı aç</> : <><CheckCircle2 size={18} /> Ödendi yap</>}</Button><Button onClick={() => openAdd(selectedCustomer.id)} disabled={accountFor(selectedCustomer.id)?.isPaid}><Plus size={18} /> Ürün ekle</Button></div>
              </div>
              <EntryList entries={selectedEntries} profiles={data.profiles} onEdit={(entry) => { setEditingEntry(entry); setConsumptionOpen(true) }} canEdit={() => !accountFor(selectedCustomer.id)?.isPaid} />
            </section>
          )}
        </>
      )}

      {active === 'activity' && (
        <>
          <PageIntro eyebrow="Değişiklik kaydı" title="Düzeltme hareketleri" description="Müşterilerin ve kantincilerin yaptığı tüm değişiklikler eski ve yeni haliyle burada." />
          <section className="panel"><ActivityList revisions={data.revisions} profiles={data.profiles} /></section>
        </>
      )}

      {active === 'catalog' && (
        <CatalogView categories={data.categories} products={data.products} onOpenForm={setCatalogForm} />
      )}

      {active === 'users' && (
        <UserManagement profile={profile} customers={customers} canteens={canteens} onCreate={() => setUserFormOpen(true)} onReset={setResetUser} onToggle={async (user) => { await run(() => repository.setUserActive(user.id, !user.isActive), user.isActive ? 'Kullanıcı devre dışı bırakıldı.' : 'Kullanıcı etkinleştirildi.') }} saving={saving} />
      )}

      <ConsumptionModal
        key={`${consumptionOpen}-${editingEntry?.id ?? 'new'}-${selectedCustomerId}`}
        open={consumptionOpen}
        onClose={() => { setConsumptionOpen(false); setEditingEntry(null) }}
        products={data.products}
        categories={data.categories}
        customers={customers}
        currentProfile={profile}
        defaultCustomerId={editingEntry?.customerId ?? selectedCustomerId ?? customers[0]?.id ?? ''}
        initialConsumedOn={currentWeek ? defaultConsumptionDate() : getWeekEnd(weekStart)}
        entry={editingEntry}
        onSubmit={submitConsumption}
        loading={saving}
      />

      <CatalogModal key={catalogForm ? `${catalogForm.kind}-${catalogForm.item?.id ?? 'new'}` : 'closed'} form={catalogForm} categories={data.categories} loading={saving} onClose={() => setCatalogForm(null)} onSave={async (value) => {
        const ok = value.kind === 'category'
          ? await run(() => repository.saveCategory(value.item), 'Kategori kaydedildi.')
          : await run(() => repository.saveProduct(value.item), 'Ürün ve fiyatı kaydedildi.')
        if (ok) setCatalogForm(null)
      }} />

      <CreateUserModal key={userFormOpen ? 'open' : 'closed'} open={userFormOpen} isManager={profile.isManager} loading={saving} onClose={() => setUserFormOpen(false)} onSave={async (value) => { const ok = await run(() => repository.createUser(value), 'Kullanıcı geçici parolayla oluşturuldu.'); if (ok) setUserFormOpen(false) }} />
      <ResetPasswordModal key={resetUser?.id ?? 'closed'} user={resetUser} loading={saving} onClose={() => setResetUser(null)} onSave={async (password) => { if (!resetUser) return; const ok = await run(() => repository.resetPassword(resetUser.id, password), 'Geçici parola tanımlandı.'); if (ok) setResetUser(null) }} />
    </AppShell>
  )
}

function CatalogView({ categories, products, onOpenForm }: { categories: Category[]; products: Product[]; onOpenForm: (value: CatalogForm) => void }) {
  const [query, setQuery] = useState('')
  const filtered = products.filter((item) => item.name.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')))
  return (
    <>
      <PageIntro eyebrow="Menü yönetimi" title="Ürünler ve kategoriler" description="Fiyat değişiklikleri eski tüketimleri etkilemeden aynı gün itibarıyla uygulanır." action={<div className="row-actions"><Button variant="secondary" onClick={() => onOpenForm({ kind: 'category' })}><PackagePlus size={18} /> Kategori</Button><Button onClick={() => onOpenForm({ kind: 'product' })}><Plus size={18} /> Yeni ürün</Button></div>} />
      <section className="catalog-layout">
        <aside className="panel category-manager"><div className="section-heading"><div><span className="eyebrow">Gruplar</span><h2>Kategoriler</h2></div></div>{categories.map((category) => <button type="button" key={category.id} onClick={() => onOpenForm({ kind: 'category', item: category })}><span><Coffee size={18} /><strong>{category.name}</strong></span><Badge tone={category.isActive ? 'success' : 'neutral'}>{products.filter((item) => item.categoryId === category.id).length} ürün</Badge></button>)}</aside>
        <div className="panel product-manager">
          <div className="toolbar"><div className="search-input"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ürün ara..." /></div><div className="toolbar__meta">{filtered.length} ürün</div></div>
          <div className="product-table__head"><span>Ürün</span><span>Kategori</span><span>Fiyat</span><span>Durum</span><span /></div>
          {filtered.map((product) => {
            const category = categories.find((item) => item.id === product.categoryId)
            return <div className="product-table__row" key={product.id}><span className="product-name"><i><ShoppingBasket size={18} /></i><strong>{product.name}</strong></span><span>{category?.name}</span><strong>{formatMoney(product.currentPrice)}</strong><span><Badge tone={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Satışta' : 'Pasif'}</Badge></span><button className="icon-button" type="button" aria-label={`${product.name} ürününü düzenle`} onClick={() => onOpenForm({ kind: 'product', item: product })}><Edit3 size={17} /></button></div>
          })}
        </div>
      </section>
    </>
  )
}

function CatalogModal({ form, categories, loading, onClose, onSave }: { form: CatalogForm | null; categories: Category[]; loading: boolean; onClose: () => void; onSave: (value: { kind: 'category'; item: Pick<Category, 'name' | 'sortOrder' | 'isActive'> & { id?: number } } | { kind: 'product'; item: Pick<Product, 'name' | 'categoryId' | 'currentPrice' | 'isActive'> & { id?: number } }) => Promise<void> }) {
  const isProduct = form?.kind === 'product'
  const [name, setName] = useState(form?.item?.name ?? '')
  const [active, setActive] = useState(form?.item?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(form?.kind === 'category' ? form.item?.sortOrder ?? 0 : 0)
  const [categoryId, setCategoryId] = useState(form?.kind === 'product' ? form.item?.categoryId ?? categories[0]?.id ?? 0 : categories[0]?.id ?? 0)
  const [price, setPrice] = useState(form?.kind === 'product' ? form.item?.currentPrice ?? 0 : 0)
  if (!form) return null
  const submit = async (event: FormEvent) => { event.preventDefault(); if (form.kind === 'category') await onSave({ kind: 'category', item: { id: form.item?.id, name, sortOrder, isActive: active } }); else await onSave({ kind: 'product', item: { id: form.item?.id, name, categoryId, currentPrice: price, isActive: active } }) }
  return <Modal open title={isProduct ? (form.item ? 'Ürünü düzenle' : 'Yeni ürün') : (form.item ? 'Kategoriyi düzenle' : 'Yeni kategori')} onClose={onClose}><form className="stack-form" onSubmit={submit}><Field label={isProduct ? 'Ürün adı' : 'Kategori adı'}><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></Field>{isProduct ? <><Field label="Kategori"><select value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>{categories.filter((item) => item.isActive || item.id === categoryId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Fiyat (₺)" hint="Geçmiş tüketimlerin fiyatı değişmez."><input type="number" min="0.01" step="0.01" value={price || ''} onChange={(event) => setPrice(Number(event.target.value))} required /></Field></> : <Field label="Sıralama"><input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} /></Field>}<label className="switch-row"><span><strong>Aktif</strong><small>{isProduct ? 'Müşteriler ürün listesinde görebilsin.' : 'Kategori ve ürünleri listede görünsün.'}</small></span><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />{active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}</label><footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Vazgeç</Button><Button type="submit" loading={loading}>Kaydet</Button></footer></form></Modal>
}

function UserManagement({ profile, customers, canteens, onCreate, onReset, onToggle, saving }: { profile: Profile; customers: Profile[]; canteens: Profile[]; onCreate: () => void; onReset: (user: Profile) => void; onToggle: (user: Profile) => void; saving: boolean }) {
  return <><PageIntro eyebrow="Erişim yönetimi" title="Kullanıcılar" description="Müşteri oluştur, geçici parola ver veya erişimi kapat. Kantinci hesabını yalnızca yöneticiler oluşturur." action={<Button onClick={onCreate}><UserPlus size={18} /> Kullanıcı oluştur</Button>} /><section className="panel user-section"><div className="section-heading"><div><span className="eyebrow">Ekip</span><h2>Kantinciler</h2></div><Badge tone="info">{canteens.length} hesap</Badge></div><UserRows users={canteens} current={profile} onReset={onReset} onToggle={onToggle} saving={saving} /></section><section className="panel user-section"><div className="section-heading"><div><span className="eyebrow">Hesap sahipleri</span><h2>Müşteriler</h2></div><Badge tone="info">{customers.length} hesap</Badge></div><UserRows users={customers} current={profile} onReset={onReset} onToggle={onToggle} saving={saving} /></section></>
}

function UserRows({ users, current, onReset, onToggle, saving }: { users: Profile[]; current: Profile; onReset: (user: Profile) => void; onToggle: (user: Profile) => void; saving: boolean }) {
  if (!users.length) return <EmptyState icon={<Users size={24} />} title="Kullanıcı yok" description="Yeni hesap oluşturduğunuzda burada görünecek." />
  return <div className="user-list">{users.map((user) => {
    const canManage = user.role === 'customer' || current.isManager
    return <div key={user.id}><span className="avatar avatar--small">{user.displayName[0]}</span><span className="user-list__identity"><strong>{user.displayName}</strong><small>@{user.username}</small></span><span>{user.isManager ? <Badge tone="info">Yönetici</Badge> : user.role === 'canteen' ? <Badge>Kantinci</Badge> : user.mustChangePassword ? <Badge tone="warning">İlk giriş bekliyor</Badge> : <Badge>Müşteri</Badge>}</span><span>{user.isActive ? <Badge tone="success">Aktif</Badge> : <Badge tone="danger">Kapalı</Badge>}</span><div className="row-actions"><Button size="sm" variant="secondary" onClick={() => onReset(user)} disabled={saving || !canManage}><KeyRound size={15} /> Parola</Button><Button size="sm" variant="ghost" onClick={() => onToggle(user)} disabled={saving || !canManage || user.id === current.id}>{user.isActive ? <Archive size={15} /> : <ToggleRight size={15} />}{user.isActive ? 'Kapat' : 'Aç'}</Button></div></div>
  })}</div>
}

function CreateUserModal({ open, isManager, loading, onClose, onSave }: { open: boolean; isManager: boolean; loading: boolean; onClose: () => void; onSave: (value: CreateUserInput) => Promise<void> }) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'canteen'>('customer')
  const [manager, setManager] = useState(false)
  return <Modal open={open} title="Yeni kullanıcı" description="Kullanıcı ilk girişte geçici parolasını değiştirmek zorunda olacak." onClose={onClose}><form className="stack-form" onSubmit={async (event) => { event.preventDefault(); await onSave({ displayName, username, password, role, isManager: role === 'canteen' && manager }) }}><Field label="Ad soyad"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} required /></Field><Field label="Kullanıcı adı" hint="Küçük harf, rakam, nokta, tire veya alt çizgi"><input value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value).replace(/[^a-z0-9._-]/g, ''))} pattern="[a-z0-9][a-z0-9._-]{2,31}" required /></Field><Field label="Geçici parola" hint="En az 8 karakter"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required /></Field>{isManager && <Field label="Rol"><select value={role} onChange={(event) => { setRole(event.target.value as 'customer' | 'canteen'); setManager(false) }}><option value="customer">Müşteri</option><option value="canteen">Kantinci</option></select></Field>}{role === 'canteen' && isManager && <label className="switch-row"><span><strong>Yönetici kantinci</strong><small>Başka kantinci hesapları oluşturabilir.</small></span><input type="checkbox" checked={manager} onChange={(event) => setManager(event.target.checked)} />{manager ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}</label>}<footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Vazgeç</Button><Button type="submit" loading={loading}>Kullanıcı oluştur</Button></footer></form></Modal>
}

function ResetPasswordModal({ user, loading, onClose, onSave }: { user: Profile | null; loading: boolean; onClose: () => void; onSave: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  return <Modal open={Boolean(user)} title="Geçici parola ver" description={`${user?.displayName ?? 'Kullanıcı'} sonraki girişinde bu parolayı değiştirecek.`} onClose={onClose}><form className="stack-form" onSubmit={async (event) => { event.preventDefault(); await onSave(password) }}><Field label="Yeni geçici parola" hint="En az 8 karakter"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required /></Field><footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Vazgeç</Button><Button type="submit" loading={loading}>Parolayı sıfırla</Button></footer></form></Modal>
}
