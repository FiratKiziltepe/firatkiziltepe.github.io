import { usernameToEmail } from '../lib/config'
import { getWeekEnd } from '../lib/date'
import { supabase } from '../lib/supabase'
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

type Row = Record<string, unknown>

function client() {
  if (!supabase) throw new Error('Supabase bağlantı ayarları eksik.')
  return supabase
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

function entryFromRow(row: Row): ConsumptionEntry {
  return {
    id: Number(row.id),
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

  async getCurrentProfile() {
    const { data } = await client().auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return null

    const { data: profile, error } = await client()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error || !profile) return null
    return profileFromRow(profile as Row)
  }

  async signIn(username: string, password: string) {
    const { error } = await client().auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    requireNoError(error, 'Kullanıcı adı veya parola hatalı.')
    const profile = await this.getCurrentProfile()
    if (!profile || !profile.isActive) {
      await client().auth.signOut()
      throw new Error('Bu kullanıcı aktif değil veya profil kaydı bulunamadı.')
    }
    return profile
  }

  async signOut() {
    const { error } = await client().auth.signOut()
    requireNoError(error, 'Çıkış yapılamadı.')
  }

  async loadWeek(weekStart: string): Promise<WeekData> {
    const weekEnd = getWeekEnd(weekStart)
    const [profiles, categories, products, entries, revisions, weeklyAccounts] = await Promise.all([
      client().from('profiles').select('*').order('display_name'),
      client().from('categories').select('*').order('sort_order').order('name'),
      client().from('products').select('*').order('name'),
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

    for (const result of [profiles, categories, products, entries, revisions, weeklyAccounts]) {
      requireNoError(result.error, 'Veriler yüklenemedi.')
    }

    return {
      profiles: ((profiles.data ?? []) as Row[]).map(profileFromRow),
      categories: ((categories.data ?? []) as Row[]).map(categoryFromRow),
      products: ((products.data ?? []) as Row[]).map(productFromRow),
      entries: ((entries.data ?? []) as Row[]).map(entryFromRow),
      revisions: ((revisions.data ?? []) as Row[]).map(revisionFromRow),
      weeklyAccounts: ((weeklyAccounts.data ?? []) as Row[]).map(weeklyAccountFromRow),
    }
  }

  async addConsumption(input: AddConsumptionInput) {
    const { error } = await client().from('consumption_entries').insert({
      customer_id: input.customerId,
      product_id: input.productId,
      quantity: input.quantity,
      consumed_on: input.consumedOn,
    })
    requireNoError(error, 'Tüketim kaydı eklenemedi.')
  }

  async updateConsumption(entryId: number, input: UpdateConsumptionInput) {
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
