import { useMemo, useState } from 'react'
import { CalendarClock, CircleDollarSign, History, Home, ListChecks, Plus, ReceiptText, ShoppingBasket, WalletCards } from 'lucide-react'
import { AppShell, type NavItem } from '../components/AppShell'
import { Badge, Button, PageIntro, WeekPicker } from '../components/ui'
import { formatMoney, getWeekStart, isWithinCustomerEditWindow } from '../lib/date'
import type { ConsumptionEntry, Profile, WeekData } from '../types'
import type { KantinRepository } from '../services/repository'
import { ConsumptionModal, EntryList, Notice, SummaryCard, toUpdateInput } from './Consumption'

const navItems: NavItem[] = [
  { id: 'home', label: 'Özet', icon: Home },
  { id: 'add', label: 'Ürün ekle', icon: Plus },
  { id: 'history', label: 'Hareketler', icon: History },
]

export function CustomerApp({
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
  const [active, setActive] = useState('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ConsumptionEntry | null>(null)
  const [initialProductId, setInitialProductId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const entries = data.entries.filter((entry) => entry.customerId === profile.id)
  const validEntries = entries.filter((entry) => !entry.isCancelled && entry.syncStatus !== 'failed')
  const total = validEntries.reduce((sum, entry) => sum + entry.totalPrice, 0)
  const account = data.weeklyAccounts.find((item) => item.customerId === profile.id)
  const isPaid = Boolean(account?.isPaid)
  const currentWeek = weekStart === getWeekStart()
  const recentProducts = useMemo(() => {
    const usedIds = entries.map((entry) => entry.productId)
    return [...data.products]
      .filter((product) => product.isActive && data.categories.some((category) => category.id === product.categoryId && category.isActive))
      .sort((a, b) => Number(usedIds.includes(b.id)) - Number(usedIds.includes(a.id)))
      .slice(0, 6)
  }, [data.categories, data.products, entries])

  const openAdd = (productId?: number) => {
    setEditingEntry(null)
    setInitialProductId(productId ?? null)
    setModalOpen(true)
  }

  const navigate = (id: string) => {
    if (id === 'add') openAdd()
    else setActive(id)
  }

  const submit = async (input: { customerId: string; productId: number; quantity: number; consumedOn: string; reason?: string; isCancelled?: boolean }) => {
    setSaving(true)
    try {
      if (editingEntry) {
        await repository.updateConsumption(editingEntry.id, toUpdateInput(input))
        notify('Değişiklik gerekçesiyle kaydedildi.')
      } else {
        const result = await repository.addConsumption(input)
        notify(result.queued ? 'İnternet yok; ürün cihazda güvenle bekliyor.' : 'Ürün hesabına eklendi.')
      }
      setModalOpen(false)
      setEditingEntry(null)
      await onRefresh()
    } catch (error) {
      notify(error instanceof Error ? error.message : 'İşlem tamamlanamadı.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell profile={profile} items={navItems} activeItem={active} onNavigate={navigate} onSignOut={onSignOut} topbar={<WeekPicker weekStart={weekStart} onChange={onWeekChange} />}>
      {active === 'home' ? (
        <>
          <PageIntro eyebrow="Kişisel hesabın" title={`Merhaba, ${profile.displayName.split(' ')[0]}`} description="Bu haftaki tüm tüketimlerin ve hesabının güncel durumu burada." action={currentWeek && !isPaid ? <Button onClick={() => openAdd()}><Plus size={18} /> Ürün ekle</Button> : undefined} />

          <section className="summary-grid">
            <SummaryCard icon={<CircleDollarSign size={22} />} label="Haftalık toplam" value={formatMoney(total)} detail={`${validEntries.reduce((sum, item) => sum + item.quantity, 0)} ürün`} tone="accent" />
            <SummaryCard icon={<ReceiptText size={22} />} label="Hareket sayısı" value={`${entries.length}`} detail={entries.some((item) => item.revisionCount > 0) ? 'Düzeltilen kayıt var' : 'Tüm kayıtlar ilk halinde'} />
            <SummaryCard icon={<WalletCards size={22} />} label="Hesap durumu" value={isPaid ? 'Ödendi' : 'Ödenmedi'} detail={isPaid ? 'Bu hafta kilitlendi' : 'Kantinci henüz kapatmadı'} tone={isPaid ? 'default' : 'warning'} />
          </section>

          {isPaid ? <Notice>Bu hafta ödendi olarak kapatıldı. Kayıt ekleme ve düzeltme yapılamaz.</Notice> : <Notice tone="warning">Bir hata fark edersen son iki gün içindeki kaydı gerekçe yazarak düzeltebilirsin.</Notice>}

          <section className="dashboard-section">
            <div className="section-heading"><div><span className="eyebrow">Hızlı ekle</span><h2>Sık kullanılan ürünler</h2></div><button type="button" className="text-button" onClick={() => openAdd()}>Tüm ürünler <ShoppingBasket size={17} /></button></div>
            <div className="quick-products">
              {recentProducts.map((product) => (
                <button key={product.id} type="button" disabled={!currentWeek || isPaid} onClick={() => openAdd(product.id)}>
                  <span><ShoppingBasket size={20} /></span><strong>{product.name}</strong><small>{formatMoney(product.currentPrice)}</small><i><Plus size={16} /></i>
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading"><div><span className="eyebrow">Son hareketler</span><h2>Bu haftanın kayıtları</h2></div><button type="button" className="text-button" onClick={() => setActive('history')}>Tümünü gör <ListChecks size={17} /></button></div>
            <EntryList entries={entries.slice(0, 5)} profiles={data.profiles} compact onEdit={(entry) => { setEditingEntry(entry); setModalOpen(true) }} canEdit={(entry) => !isPaid && isWithinCustomerEditWindow(entry.consumedOn)} />
          </section>
        </>
      ) : (
        <>
          <PageIntro eyebrow="Şeffaf hareketler" title="Tüketim geçmişin" description="Ürün, adet, fiyat, ekleyen kişi ve varsa düzeltme bilgisi tek listede." />
          <div className="history-summary">
            <div><CalendarClock size={20} /><span>Seçili hafta</span><strong>{entries.length} hareket</strong></div>
            <div><CircleDollarSign size={20} /><span>Geçerli toplam</span><strong>{formatMoney(total)}</strong></div>
            <div>{isPaid ? <Badge tone="success">Ödendi ve kilitli</Badge> : <Badge tone="warning">Ödenmedi</Badge>}</div>
          </div>
          <section className="panel"><EntryList entries={entries} profiles={data.profiles} onEdit={(entry) => { setEditingEntry(entry); setModalOpen(true) }} canEdit={(entry) => !isPaid && isWithinCustomerEditWindow(entry.consumedOn)} /></section>
        </>
      )}

      <ConsumptionModal
        key={`${modalOpen}-${editingEntry?.id ?? 'new'}-${initialProductId ?? 'none'}`}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null) }}
        products={data.products}
        productPrices={data.productPrices}
        categories={data.categories}
        customers={[profile]}
        currentProfile={profile}
        defaultCustomerId={profile.id}
        initialProductId={initialProductId}
        entry={editingEntry}
        onSubmit={submit}
        loading={saving}
      />
    </AppShell>
  )
}
