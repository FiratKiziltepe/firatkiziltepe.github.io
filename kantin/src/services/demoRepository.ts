import {
  addDays,
  getWeekEnd,
  getWeekStart,
  isWithinCustomerEditWindow,
  isWeekday,
  todayInIstanbul,
} from '../lib/date'
import type {
  AddConsumptionInput,
  Category,
  ConsumptionEntry,
  ConsumptionRevision,
  CreateUserInput,
  Product,
  Profile,
  UpdateConsumptionInput,
  WeeklyAccount,
  WeekData,
} from '../types'
import type { KantinRepository } from './repository'

const now = new Date().toISOString()
const currentWeek = getWeekStart()

const profiles: Profile[] = [
  { id: 'u-manager', username: 'yonetici', displayName: 'Selin Demir', role: 'canteen', isManager: true, isActive: true, mustChangePassword: false },
  { id: 'u-canteen', username: 'kantinci', displayName: 'Murat Kaya', role: 'canteen', isManager: false, isActive: true, mustChangePassword: false },
  { id: 'u-ayse', username: 'ayse', displayName: 'Ayşe Yılmaz', role: 'customer', isManager: false, isActive: true, mustChangePassword: false },
  { id: 'u-emre', username: 'emre', displayName: 'Emre Aksoy', role: 'customer', isManager: false, isActive: true, mustChangePassword: false },
  { id: 'u-elif', username: 'elif', displayName: 'Elif Şahin', role: 'customer', isManager: false, isActive: true, mustChangePassword: false },
  { id: 'u-can', username: 'can', displayName: 'Can Aydın', role: 'customer', isManager: false, isActive: true, mustChangePassword: true },
]

const categories: Category[] = [
  { id: 1, name: 'Sıcak İçecek', sortOrder: 1, isActive: true },
  { id: 2, name: 'Soğuk İçecek', sortOrder: 2, isActive: true },
  { id: 3, name: 'Atıştırmalık', sortOrder: 3, isActive: true },
  { id: 4, name: 'Yiyecek', sortOrder: 4, isActive: true },
]

const products: Product[] = [
  { id: 1, categoryId: 1, name: 'Çay', currentPrice: 10, isActive: true },
  { id: 2, categoryId: 1, name: 'Türk Kahvesi', currentPrice: 35, isActive: true },
  { id: 3, categoryId: 1, name: 'Nescafe', currentPrice: 25, isActive: true },
  { id: 4, categoryId: 2, name: 'Kutu Kola', currentPrice: 45, isActive: true },
  { id: 5, categoryId: 2, name: 'Ayran', currentPrice: 20, isActive: true },
  { id: 6, categoryId: 3, name: 'Biskrem', currentPrice: 25, isActive: true },
  { id: 7, categoryId: 3, name: 'Çikolata', currentPrice: 30, isActive: true },
  { id: 8, categoryId: 3, name: 'Kraker', currentPrice: 18, isActive: true },
  { id: 9, categoryId: 4, name: 'Kaşarlı Tost', currentPrice: 70, isActive: true },
  { id: 10, categoryId: 4, name: 'Karışık Tost', currentPrice: 85, isActive: true },
]

let entries: ConsumptionEntry[] = []
let revisions: ConsumptionRevision[] = []
let weeklyAccounts: WeeklyAccount[] = []
let nextEntryId = 1
let nextRevisionId = 1

function seedEntry(customerId: string, productId: number, quantity: number, dayOffset: number, creatorId = customerId) {
  const product = products.find((item) => item.id === productId)!
  const category = categories.find((item) => item.id === product.categoryId)!
  const consumedOn = addDays(currentWeek, dayOffset)
  entries.push({
    id: nextEntryId++, customerId, productId, productName: product.name, categoryName: category.name,
    quantity, unitPrice: product.currentPrice, totalPrice: product.currentPrice * quantity,
    consumedOn, createdBy: creatorId, createdAt: `${consumedOn}T09:30:00+03:00`,
    updatedBy: null, updatedAt: `${consumedOn}T09:30:00+03:00`, editReason: null,
    revisionCount: 0, isCancelled: false,
  })
}

seedEntry('u-ayse', 1, 3, 0)
seedEntry('u-ayse', 6, 1, 0)
seedEntry('u-ayse', 9, 1, 2, 'u-canteen')
seedEntry('u-ayse', 1, 2, 4)
seedEntry('u-emre', 2, 1, 1)
seedEntry('u-emre', 10, 1, 3, 'u-canteen')
seedEntry('u-elif', 5, 1, 0)
seedEntry('u-elif', 7, 2, 2)
seedEntry('u-can', 3, 1, 4)

weeklyAccounts = [
  { customerId: 'u-emre', weekStart: currentWeek, isPaid: true, totalSnapshot: 120, markedPaidBy: 'u-manager', markedPaidAt: now },
]

function clone<T>(value: T): T {
  return structuredClone(value)
}

function error(message: string): never {
  throw new Error(message)
}

export class DemoRepository implements KantinRepository {
  isDemo = true
  demoUsers = [
    { username: 'yonetici', password: 'Kantin123', role: 'canteen' as const },
    { username: 'ayse', password: 'Kantin123', role: 'customer' as const },
  ]
  private currentUser: Profile | null = null

  async getCurrentProfile() {
    return this.currentUser ? clone(this.currentUser) : null
  }

  async signIn(username: string, password: string) {
    if (password !== 'Kantin123') error('Demo parolası hatalı.')
    const user = profiles.find((item) => item.username === username && item.isActive)
    if (!user) error('Demo kullanıcısı bulunamadı.')
    this.currentUser = user
    return clone(user)
  }

  async signOut() {
    this.currentUser = null
  }

  async loadWeek(weekStart: string): Promise<WeekData> {
    if (!this.currentUser) error('Oturum bulunamadı.')
    const weekEnd = getWeekEnd(weekStart)
    const isCanteen = this.currentUser.role === 'canteen'
    const visibleProfiles = isCanteen
      ? profiles
      : profiles.filter((item) => item.id === this.currentUser?.id || item.role === 'canteen')
    const visibleEntries = entries.filter((item) =>
      item.consumedOn >= weekStart && item.consumedOn <= weekEnd && (isCanteen || item.customerId === this.currentUser?.id),
    )
    const visibleRevisions = revisions.filter((item) => isCanteen || item.customerId === this.currentUser?.id)
    const visibleAccounts = weeklyAccounts.filter((item) => item.weekStart === weekStart && (isCanteen || item.customerId === this.currentUser?.id))
    return clone({ profiles: visibleProfiles, categories, products, entries: visibleEntries, revisions: visibleRevisions, weeklyAccounts: visibleAccounts })
  }

  async addConsumption(input: AddConsumptionInput) {
    const actor = this.currentUser ?? error('Oturum bulunamadı.')
    if (actor.role === 'customer' && actor.id !== input.customerId) error('Yalnızca kendi hesabınıza kayıt ekleyebilirsiniz.')
    if (!isWeekday(input.consumedOn) || input.consumedOn > todayInIstanbul()) error('Geçerli bir iş günü seçin.')
    if (actor.role === 'customer' && !isWithinCustomerEditWindow(input.consumedOn)) error('En fazla iki gün geriye kayıt ekleyebilirsiniz.')
    if (weeklyAccounts.some((item) => item.customerId === input.customerId && item.weekStart === getWeekStart(input.consumedOn) && item.isPaid)) error('Ödenmiş hafta değiştirilemez.')
    const customer = profiles.find((item) => item.id === input.customerId && item.role === 'customer' && item.isActive)
    const product = products.find((item) => item.id === input.productId && item.isActive)
    if (!customer || !product) error('Müşteri veya ürün bulunamadı.')
    const category = categories.find((item) => item.id === product.categoryId)!
    entries.unshift({
      id: nextEntryId++, customerId: customer.id, productId: product.id, productName: product.name,
      categoryName: category.name, quantity: input.quantity, unitPrice: product.currentPrice,
      totalPrice: product.currentPrice * input.quantity, consumedOn: input.consumedOn,
      createdBy: actor.id, createdAt: now, updatedBy: null, updatedAt: now,
      editReason: null, revisionCount: 0, isCancelled: false,
    })
  }

  async updateConsumption(entryId: number, input: UpdateConsumptionInput) {
    const actor = this.currentUser ?? error('Oturum bulunamadı.')
    const entry = entries.find((item) => item.id === entryId) ?? error('Kayıt bulunamadı.')
    if (actor.role === 'customer' && entry.customerId !== actor.id) error('Bu kaydı değiştiremezsiniz.')
    if (actor.role === 'customer' && !isWithinCustomerEditWindow(entry.consumedOn)) error('İki günlük düzenleme süresi dolmuş.')
    if (weeklyAccounts.some((item) => item.customerId === entry.customerId && item.weekStart === getWeekStart(entry.consumedOn) && item.isPaid)) error('Ödenmiş hafta değiştirilemez.')
    if (input.reason.trim().length < 3) error('Değişiklik gerekçesi gereklidir.')
    const product = products.find((item) => item.id === input.productId) ?? error('Ürün bulunamadı.')
    const category = categories.find((item) => item.id === product.categoryId)!
    const oldData = { product_name: entry.productName, quantity: entry.quantity, total_price: entry.totalPrice, consumed_on: entry.consumedOn, is_cancelled: entry.isCancelled }
    Object.assign(entry, {
      productId: product.id, productName: product.name, categoryName: category.name,
      quantity: input.quantity, unitPrice: product.currentPrice, totalPrice: product.currentPrice * input.quantity,
      consumedOn: input.consumedOn, isCancelled: input.isCancelled, editReason: input.reason.trim(),
      updatedBy: actor.id, updatedAt: new Date().toISOString(), revisionCount: entry.revisionCount + 1,
    })
    revisions.unshift({
      id: nextRevisionId++, entryId: entry.id, customerId: entry.customerId, changedBy: actor.id,
      reason: input.reason.trim(), oldData,
      newData: { product_name: entry.productName, quantity: entry.quantity, total_price: entry.totalPrice, consumed_on: entry.consumedOn, is_cancelled: entry.isCancelled },
      changedAt: new Date().toISOString(),
    })
  }

  async setWeekPaid(customerId: string, weekStart: string, isPaid: boolean) {
    if (this.currentUser?.role !== 'canteen') error('Kantinci yetkisi gerekir.')
    const existing = weeklyAccounts.find((item) => item.customerId === customerId && item.weekStart === weekStart)
    const total = entries.filter((item) => item.customerId === customerId && item.consumedOn >= weekStart && item.consumedOn <= getWeekEnd(weekStart) && !item.isCancelled).reduce((sum, item) => sum + item.totalPrice, 0)
    const value: WeeklyAccount = { customerId, weekStart, isPaid, totalSnapshot: isPaid ? total : null, markedPaidBy: isPaid ? this.currentUser.id : null, markedPaidAt: isPaid ? new Date().toISOString() : null }
    if (existing) Object.assign(existing, value)
    else weeklyAccounts.push(value)
  }

  async saveCategory(category: Pick<Category, 'name' | 'sortOrder' | 'isActive'> & { id?: number }) {
    if (this.currentUser?.role !== 'canteen') error('Kantinci yetkisi gerekir.')
    if (category.id) Object.assign(categories.find((item) => item.id === category.id) ?? error('Kategori bulunamadı.'), category)
    else categories.push({ id: Math.max(0, ...categories.map((item) => item.id)) + 1, ...category })
  }

  async saveProduct(product: Pick<Product, 'categoryId' | 'name' | 'currentPrice' | 'isActive'> & { id?: number }) {
    if (this.currentUser?.role !== 'canteen') error('Kantinci yetkisi gerekir.')
    if (product.id) Object.assign(products.find((item) => item.id === product.id) ?? error('Ürün bulunamadı.'), product)
    else products.push({ id: Math.max(0, ...products.map((item) => item.id)) + 1, ...product })
  }

  async createUser(input: CreateUserInput) {
    const actor = this.currentUser ?? error('Oturum bulunamadı.')
    if (actor.role !== 'canteen') error('Kantinci yetkisi gerekir.')
    if (input.role === 'canteen' && !actor.isManager) error('Yönetici yetkisi gerekir.')
    profiles.push({ id: `u-${Date.now()}`, username: input.username, displayName: input.displayName, role: input.role, isManager: input.role === 'canteen' && input.isManager, isActive: true, mustChangePassword: true })
  }

  async resetPassword() {
    if (this.currentUser?.role !== 'canteen') error('Kantinci yetkisi gerekir.')
  }

  async setUserActive(userId: string, isActive: boolean) {
    if (this.currentUser?.role !== 'canteen') error('Kantinci yetkisi gerekir.')
    const user = profiles.find((item) => item.id === userId) ?? error('Kullanıcı bulunamadı.')
    user.isActive = isActive
  }

  async updateProfile(userId: string, displayName: string) {
    const user = profiles.find((item) => item.id === userId) ?? error('Kullanıcı bulunamadı.')
    user.displayName = displayName
  }

  async changeOwnPassword() {
    if (!this.currentUser) error('Oturum bulunamadı.')
    this.currentUser.mustChangePassword = false
  }
}
