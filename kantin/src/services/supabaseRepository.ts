import { usernameToEmail } from '../lib/config'
import { getWeekEnd, getWeekStart } from '../lib/date'
import {
  buildWeekFromCachedReference,
  cacheWeek,
  deleteOfflineMutation,
  getCachedActiveProfile,
  getCachedWeek,
  getOfflineMutations,
  putOfflineMutation,
  setCachedActiveProfile,
  type OfflineConsumptionMutation,
} from '../lib/offlineStore'
import { effectivePriceFor } from '../lib/price'
import { supabase } from '../lib/supabase'
import type {
  AddConsumptionInput,
  AddConsumptionResult,
  Category,
  ConsumptionEntry,
  ConsumptionRevision,
  CreateUserInput,
  OfflineSyncState,
  Product,
  ProductPrice,
  Profile,
  UpdateConsumptionInput,
  WeeklyAccount,
  WeekData,
} from '../types'
import type { KantinRepository } from './repository'

type Row = Record<string, unknown>

function client() {
  if (!supabase) throw new Error('Supabase bağlantı ayarları eksik.')
  return supabase
}

function browserIsOnline() {
  return typeof navigator === 'undefined' || navigator.onLine
}

function errorMessage(error: unknown, fallback = 'İşlem tamamlanamadı.') {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message || fallback)
  return fallback
}

function isConnectivityError(error: unknown) {
  if (!browserIsOnline()) return true
  const message = errorMessage(error, '').toLocaleLowerCase('tr-TR')
  const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0
  return [408, 502, 503, 504, 520, 522, 523, 524].includes(status)
    || /failed to fetch|fetch failed|network|çevrimdışı|offline|load failed|connection|zaman aşımı|timeout/.test(message)
}

function profileFromRow(row: Row): Profile {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    role: row.role === 'canteen' ? 'canteen' : 'customer',
    isManager: Boolean(row.is_manager),
    isActive: Boolean(row.is_active),
    mustChangePassword: Boolean(row.must_change_password),
  }
}

function categoryFromRow(row: Row): Category {
  return {
    id: Number(row.id),
    name: String(row.name),
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
  }
}

function productFromRow(row: Row): Product {
  return {
    id: Number(row.id),
    categoryId: Number(row.category_id),
    name: String(row.name),
    currentPrice: Number(row.current_price),
    isActive: Boolean(row.is_active),
  }
}

function productPriceFromRow(row: Row): ProductPrice {
  return {
    productId: Number(row.product_id),
    price: Number(row.price),
    effectiveOn: String(row.effective_on),
  }
}

function entryFromRow(row: Row): ConsumptionEntry {
  return {
    id: Number(row.id),
    clientMutationId: row.client_mutation_id ? String(row.client_mutation_id) : undefined,
    customerId: String(row.customer_id),
    productId: Number(row.product_id),
    productName: String(row.product_name_snapshot),
    categoryName: String(row.category_name_snapshot),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    consumedOn: String(row.consumed_on),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    updatedAt: String(row.updated_at),
    editReason: row.last_edit_reason ? String(row.last_edit_reason) : null,
    revisionCount: Number(row.revision_count),
    isCancelled: Boolean(row.is_cancelled),
  }
}

function revisionFromRow(row: Row): ConsumptionRevision {
  return {
    id: Number(row.id),
    entryId: Number(row.entry_id),
    customerId: String(row.customer_id),
    changedBy: String(row.changed_by),
    reason: String(row.reason),
    oldData: (row.old_data ?? {}) as Record<string, unknown>,
    newData: (row.new_data ?? {}) as Record<string, unknown>,
    changedAt: String(row.changed_at),
  }
}

function weeklyAccountFromRow(row: Row): WeeklyAccount {
  return {
    customerId: String(row.customer_id),
    weekStart: String(row.week_start),
    isPaid: Boolean(row.is_paid),
    totalSnapshot: row.total_snapshot === null ? null : Number(row.total_snapshot),
    markedPaidBy: row.marked_paid_by ? String(row.marked_paid_by) : null,
    markedPaidAt: row.marked_paid_at ? String(row.marked_paid_at) : null,
  }
}

function requireNoError(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback)
}

async function invokeManageUser(body: Record<string, unknown>) {
  const { data, error } = await client().functions.invoke('manage-user', { body })
  if (error) {
    const context = 'context' in error ? (error as { context?: Response }).context : undefined
    if (context) {
      try {
        const payload = await context.clone().json() as { error?: string; message?: string }
        throw new Error(payload.error || payload.message || error.message)
      } catch (contextError) {
        if (contextError instanceof Error && contextError.message !== 'Unexpected end of JSON input') throw contextError
      }
    }
    throw new Error(error.message || 'Kullanıcı işlemi tamamlanamadı.')
  }
  if (data?.error) throw new Error(String(data.error))
}

export class SupabaseRepository implements KantinRepository {
  isDemo = false
  private currentProfile: Profile | null = null
  private lastWeekData: WeekData | null = null
  private listeners = new Set<(state: OfflineSyncState) => void>()
  private syncPromise: Promise<void> | null = null
  private syncState: OfflineSyncState = {
    isOnline: browserIsOnline(),
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: null,
    lastError: null,
  }

  constructor() {
    if (typeof window === 'undefined') return
    window.addEventListener('online', () => {
      this.patchSyncState({ isOnline: true, lastError: null })
      void this.syncPendingConsumptions()
    })
    window.addEventListener('offline', () => this.patchSyncState({ isOnline: false }))
  }

  getOfflineSyncState() {
    return { ...this.syncState }
  }

  subscribeOfflineSync(listener: (state: OfflineSyncState) => void) {
    this.listeners.add(listener)
    listener(this.getOfflineSyncState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private patchSyncState(next: Partial<OfflineSyncState>) {
    this.syncState = { ...this.syncState, ...next }
    const snapshot = this.getOfflineSyncState()
    this.listeners.forEach((listener) => listener(snapshot))
  }

  private async setCurrentProfile(profile: Profile | null) {
    this.currentProfile = profile
    await setCachedActiveProfile(profile)
    await this.refreshMutationCounts()
  }

  private async refreshMutationCounts() {
    if (!this.currentProfile) {
      this.patchSyncState({ pendingCount: 0, failedCount: 0 })
      return
    }
    const mutations = await getOfflineMutations(this.currentProfile.id)
    this.patchSyncState({
      pendingCount: mutations.length,
      failedCount: mutations.filter((item) => item.status === 'failed').length,
    })
  }

  async getCurrentProfile() {
    let userId: string | null = null
    try {
      const { data, error } = await client().auth.getSession()
      if (error) throw error
      userId = data.session?.user.id ?? null
    } catch (error) {
      if (!isConnectivityError(error)) throw error
      this.patchSyncState({ isOnline: false, lastError: errorMessage(error) })
    }

    if (!userId && (!browserIsOnline() || !this.syncState.isOnline)) {
      const cached = await getCachedActiveProfile()
      if (cached?.isActive) {
        await this.setCurrentProfile(cached)
        return cached
      }
    }
    if (!userId) {
      await this.setCurrentProfile(null)
      return null
    }

    try {
      const { data: profile, error } = await client()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      if (!profile) return null
      const mapped = profileFromRow(profile as Row)
      await this.setCurrentProfile(mapped)
      this.patchSyncState({ isOnline: true, lastError: null })
      return mapped
    } catch (error) {
      if (!isConnectivityError(error)) return null
      this.patchSyncState({ isOnline: false, lastError: errorMessage(error) })
      const cached = await getCachedActiveProfile()
      if (cached?.id === userId && cached.isActive) {
        await this.setCurrentProfile(cached)
        return cached
      }
      throw new Error('Çevrimdışı kullanım için bu cihazda önceden başarılı bir giriş yapılmalı.')
    }
  }

  async signIn(username: string, password: string) {
    if (!browserIsOnline()) throw new Error('Giriş yapmak için internet bağlantısı gerekiyor.')
    const { error } = await client().auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    requireNoError(error, 'Kullanıcı adı veya parola hatalı.')
    const profile = await this.getCurrentProfile()
    if (!profile || !profile.isActive) {
      await client().auth.signOut({ scope: 'local' })
      throw new Error('Bu kullanıcı aktif değil veya profil kaydı bulunamadı.')
    }
    await this.setCurrentProfile(profile)
    return profile
  }

  async signOut() {
    await this.setCurrentProfile(null)
    this.lastWeekData = null
    const { error } = await client().auth.signOut({ scope: 'local' })
    requireNoError(error, 'Çıkış yapılamadı.')
  }

  async loadWeek(weekStart: string): Promise<WeekData> {
    const actor = this.currentProfile ?? await this.getCurrentProfile()
    if (!actor) throw new Error('Oturum bulunamadı.')

    if (!browserIsOnline() || !this.syncState.isOnline) {
      this.patchSyncState({ isOnline: false })
      const cached = await getCachedWeek(actor.id, weekStart)
        ?? await buildWeekFromCachedReference(actor.id)
      if (!cached) {
        throw new Error('Bu cihazda çevrimdışı kullanılabilecek kayıt bulunamadı. İnternete bağlanıp haftayı bir kez açın.')
      }
      const merged = await this.mergeOfflineEntries(cached, actor.id, weekStart)
      this.lastWeekData = merged
      return merged
    }

    await this.syncPendingConsumptions()

    try {
      const weekEnd = getWeekEnd(weekStart)
      const [profiles, categories, products, productPrices, entries, revisions, weeklyAccounts] = await Promise.all([
        client().from('profiles').select('*').order('display_name'),
        client().from('categories').select('*').order('sort_order').order('name'),
        client().from('products').select('*').order('name'),
        client().from('product_price_history').select('product_id,price,effective_on').order('effective_on'),
        client()
          .from('consumption_entries')
          .select('*')
          .gte('consumed_on', weekStart)
          .lte('consumed_on', weekEnd)
          .order('consumed_on', { ascending: false })
          .order('created_at', { ascending: false }),
        client()
          .from('consumption_revisions')
          .select('*')
          .gte('changed_at', `${weekStart}T00:00:00+03:00`)
          .lte('changed_at', `${weekEnd}T23:59:59.999+03:00`)
          .order('changed_at', { ascending: false })
          .limit(100),
        client().from('weekly_accounts').select('*').eq('week_start', weekStart),
      ])

      for (const result of [profiles, categories, products, productPrices, entries, revisions, weeklyAccounts]) {
        if (result.error) throw result.error
      }

      const serverData: WeekData = {
        profiles: ((profiles.data ?? []) as Row[]).map(profileFromRow),
        categories: ((categories.data ?? []) as Row[]).map(categoryFromRow),
        products: ((products.data ?? []) as Row[]).map(productFromRow),
        productPrices: ((productPrices.data ?? []) as Row[]).map(productPriceFromRow),
        entries: ((entries.data ?? []) as Row[]).map(entryFromRow),
        revisions: ((revisions.data ?? []) as Row[]).map(revisionFromRow),
        weeklyAccounts: ((weeklyAccounts.data ?? []) as Row[]).map(weeklyAccountFromRow),
      }
      await cacheWeek(actor.id, weekStart, serverData)
      const merged = await this.mergeOfflineEntries(serverData, actor.id, weekStart)
      this.lastWeekData = merged
      this.patchSyncState({ isOnline: true, lastError: null })
      return merged
    } catch (error) {
      if (!isConnectivityError(error)) throw new Error(errorMessage(error, 'Veriler yüklenemedi.'))
      this.patchSyncState({ isOnline: false, lastError: errorMessage(error) })
      const cached = await getCachedWeek(actor.id, weekStart)
        ?? await buildWeekFromCachedReference(actor.id)
      if (!cached) {
        throw new Error('Bu cihazda çevrimdışı kullanılabilecek kayıt bulunamadı. İnternete bağlanıp haftayı bir kez açın.')
      }
      const merged = await this.mergeOfflineEntries(cached, actor.id, weekStart)
      this.lastWeekData = merged
      return merged
    }
  }

  private async mergeOfflineEntries(data: WeekData, actorId: string, weekStart: string) {
    const mutations = (await getOfflineMutations(actorId))
      .filter((item) => getWeekStart(item.input.consumedOn) === weekStart)
    const mutationIds = new Set(mutations.map((item) => item.id))
    const localEntries = mutations.map((item) => ({
      ...item.localEntry,
      syncStatus: item.status,
      syncError: item.error,
    } satisfies ConsumptionEntry))
    const serverEntries = data.entries.filter((entry) => !entry.clientMutationId || !mutationIds.has(entry.clientMutationId))
    return {
      ...data,
      entries: [...localEntries, ...serverEntries].sort((a, b) =>
        b.consumedOn.localeCompare(a.consumedOn) || b.createdAt.localeCompare(a.createdAt),
      ),
    }
  }

  private createOfflineMutation(input: AddConsumptionInput): OfflineConsumptionMutation {
    const actor = this.currentProfile
    const data = this.lastWeekData
    if (!actor || !data) throw new Error('Çevrimdışı kayıt için önce ilgili haftayı açın.')
    if (actor.role === 'customer' && input.customerId !== actor.id) {
      throw new Error('Yalnızca kendi hesabınıza kayıt ekleyebilirsiniz.')
    }
    const customer = data.profiles.find((item) => item.id === input.customerId && item.role === 'customer' && item.isActive)
    const product = data.products.find((item) => item.id === input.productId && item.isActive)
    const category = product && data.categories.find((item) => item.id === product.categoryId && item.isActive)
    const unitPrice = effectivePriceFor(data.productPrices, input.productId, input.consumedOn)
    if (!customer) throw new Error('Aktif müşteri bulunamadı.')
    if (!product || !category) throw new Error('Aktif ürün bulunamadı.')
    if (unitPrice === null) throw new Error('Bu tarih için aktif ürün fiyatı bulunamadı.')

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const localId = -Math.max(1, Number.parseInt(id.replaceAll('-', '').slice(0, 12), 16))
    return {
      id,
      actorId: actor.id,
      input,
      status: 'pending',
      error: null,
      createdAt,
      localEntry: {
        id: localId,
        clientMutationId: id,
        customerId: input.customerId,
        productId: input.productId,
        productName: product.name,
        categoryName: category.name,
        quantity: input.quantity,
        unitPrice,
        totalPrice: unitPrice * input.quantity,
        consumedOn: input.consumedOn,
        createdBy: actor.id,
        createdAt,
        updatedBy: null,
        updatedAt: createdAt,
        editReason: null,
        revisionCount: 0,
        isCancelled: false,
        syncStatus: 'pending',
        syncError: null,
      },
    }
  }

  private async sendMutation(mutation: OfflineConsumptionMutation) {
    const { error } = await client().rpc('add_consumption_idempotent', {
      p_client_mutation_id: mutation.id,
      p_customer_id: mutation.input.customerId,
      p_product_id: mutation.input.productId,
      p_quantity: mutation.input.quantity,
      p_consumed_on: mutation.input.consumedOn,
    })
    if (error) throw error
  }

  async addConsumption(input: AddConsumptionInput): Promise<AddConsumptionResult> {
    const mutation = this.createOfflineMutation(input)
    await putOfflineMutation(mutation)
    await this.refreshMutationCounts()

    if (!browserIsOnline() || !this.syncState.isOnline) {
      this.patchSyncState({ isOnline: false })
      return { queued: true }
    }

    try {
      await this.sendMutation(mutation)
      await deleteOfflineMutation(mutation.id)
      await this.refreshMutationCounts()
      this.patchSyncState({ isOnline: true, lastSyncedAt: new Date().toISOString(), lastError: null })
      return { queued: false }
    } catch (error) {
      if (isConnectivityError(error)) {
        this.patchSyncState({ isOnline: false, lastError: errorMessage(error) })
        return { queued: true }
      }
      await deleteOfflineMutation(mutation.id)
      await this.refreshMutationCounts()
      throw new Error(errorMessage(error, 'Tüketim kaydı eklenemedi.'))
    }
  }

  async syncPendingConsumptions() {
    if (this.syncPromise) return this.syncPromise
    this.syncPromise = this.performPendingSync().finally(() => {
      this.syncPromise = null
    })
    return this.syncPromise
  }

  private async performPendingSync() {
    const actor = this.currentProfile
    if (!actor) return
    if (!browserIsOnline()) {
      this.patchSyncState({ isOnline: false })
      return
    }

    this.patchSyncState({ isSyncing: true, isOnline: true })
    try {
      const mutations = await getOfflineMutations(actor.id)
      for (const mutation of mutations) {
        try {
          await this.sendMutation(mutation)
          await deleteOfflineMutation(mutation.id)
          this.patchSyncState({ lastSyncedAt: new Date().toISOString(), lastError: null })
        } catch (error) {
          if (isConnectivityError(error)) {
            this.patchSyncState({ isOnline: false, lastError: errorMessage(error) })
            break
          }
          const message = errorMessage(error, 'Kayıt sunucu tarafından reddedildi.')
          await putOfflineMutation({ ...mutation, status: 'failed', error: message, localEntry: { ...mutation.localEntry, syncStatus: 'failed', syncError: message } })
          this.patchSyncState({ lastError: message })
        }
      }
    } finally {
      await this.refreshMutationCounts()
      this.patchSyncState({ isSyncing: false })
    }
  }

  async updateConsumption(entryId: number, input: UpdateConsumptionInput) {
    if (entryId < 0) throw new Error('Bekleyen çevrimdışı kayıt, senkronize edilmeden düzenlenemez.')
    const { error } = await client()
      .from('consumption_entries')
      .update({
        product_id: input.productId,
        quantity: input.quantity,
        consumed_on: input.consumedOn,
        is_cancelled: input.isCancelled,
        last_edit_reason: input.reason,
      })
      .eq('id', entryId)
    requireNoError(error, 'Tüketim kaydı değiştirilemedi.')
  }

  async setWeekPaid(customerId: string, weekStart: string, isPaid: boolean) {
    const { error } = await client().from('weekly_accounts').upsert(
      { customer_id: customerId, week_start: weekStart, is_paid: isPaid },
      { onConflict: 'customer_id,week_start' },
    )
    requireNoError(error, 'Hafta durumu değiştirilemedi.')
  }

  async saveCategory(category: Pick<Category, 'name' | 'sortOrder' | 'isActive'> & { id?: number }) {
    const payload = {
      name: category.name,
      sort_order: category.sortOrder,
      is_active: category.isActive,
    }
    const result = category.id
      ? await client().from('categories').update(payload).eq('id', category.id)
      : await client().from('categories').insert(payload)
    requireNoError(result.error, 'Kategori kaydedilemedi.')
  }

  async saveProduct(product: Pick<Product, 'categoryId' | 'name' | 'currentPrice' | 'isActive'> & { id?: number }) {
    const payload = {
      category_id: product.categoryId,
      name: product.name,
      current_price: product.currentPrice,
      is_active: product.isActive,
    }
    const result = product.id
      ? await client().from('products').update(payload).eq('id', product.id)
      : await client().from('products').insert(payload)
    requireNoError(result.error, 'Ürün kaydedilemedi.')
  }

  async createUser(input: CreateUserInput) {
    await invokeManageUser({ action: 'create', ...input })
  }

  async resetPassword(userId: string, password: string) {
    await invokeManageUser({ action: 'reset_password', userId, password })
  }

  async setUserActive(userId: string, isActive: boolean) {
    await invokeManageUser({ action: 'set_active', userId, isActive })
  }

  async updateProfile(userId: string, displayName: string) {
    await invokeManageUser({ action: 'update_profile', userId, displayName })
  }

  async changeOwnPassword(password: string) {
    await invokeManageUser({ action: 'change_own_password', password })
  }
}
