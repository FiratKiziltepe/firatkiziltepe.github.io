import { describe, expect, it } from 'vitest'
import type { Profile, WeekData } from '../types'
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
} from './offlineStore'

const actor: Profile = {
  id: 'actor-offline-test',
  username: 'offline-test',
  displayName: 'Offline Test',
  role: 'customer',
  isManager: false,
  isActive: true,
  mustChangePassword: false,
}

const weekData: WeekData = {
  profiles: [actor],
  categories: [{ id: 1, name: 'İçecek', sortOrder: 1, isActive: true }],
  products: [{ id: 1, categoryId: 1, name: 'Çay', currentPrice: 20, isActive: true }],
  productPrices: [{ productId: 1, price: 20, effectiveOn: '2026-07-31' }],
  entries: [],
  revisions: [],
  weeklyAccounts: [],
}

function mutation(id: string): OfflineConsumptionMutation {
  return {
    id,
    actorId: actor.id,
    input: { customerId: actor.id, productId: 1, quantity: 1, consumedOn: '2026-07-31' },
    status: 'pending',
    error: null,
    createdAt: '2026-08-02T12:00:00.000Z',
    localEntry: {
      id: -1,
      clientMutationId: id,
      customerId: actor.id,
      productId: 1,
      productName: 'Çay',
      categoryName: 'İçecek',
      quantity: 1,
      unitPrice: 20,
      totalPrice: 20,
      consumedOn: '2026-07-31',
      createdBy: actor.id,
      createdAt: '2026-08-02T12:00:00.000Z',
      updatedBy: null,
      updatedAt: '2026-08-02T12:00:00.000Z',
      editReason: null,
      revisionCount: 0,
      isCancelled: false,
      syncStatus: 'pending',
      syncError: null,
    },
  }
}

describe('offlineStore', () => {
  it('aktif profili ve haftalık önbelleği kalıcı saklar', async () => {
    await setCachedActiveProfile(actor)
    await cacheWeek(actor.id, '2026-07-27', weekData)

    await expect(getCachedActiveProfile()).resolves.toEqual(actor)
    await expect(getCachedWeek(actor.id, '2026-07-27')).resolves.toEqual(weekData)
    await expect(buildWeekFromCachedReference(actor.id)).resolves.toMatchObject({
      profiles: [actor],
      products: weekData.products,
      entries: [],
    })

    await setCachedActiveProfile(null)
    await expect(getCachedActiveProfile()).resolves.toBeNull()
  })

  it('bekleyen işlemleri kullanıcıya göre ayırır ve günceller', async () => {
    const item = mutation('00000000-0000-4000-8000-000000000001')
    await putOfflineMutation(item)
    await putOfflineMutation({ ...mutation('00000000-0000-4000-8000-000000000002'), actorId: 'other-actor' })

    await expect(getOfflineMutations(actor.id)).resolves.toEqual([item])

    await putOfflineMutation({ ...item, status: 'failed', error: 'Ödenmiş hafta değiştirilemez.' })
    await expect(getOfflineMutations(actor.id)).resolves.toMatchObject([
      { id: item.id, status: 'failed', error: 'Ödenmiş hafta değiştirilemez.' },
    ])

    await deleteOfflineMutation(item.id)
    await deleteOfflineMutation('00000000-0000-4000-8000-000000000002')
    await expect(getOfflineMutations(actor.id)).resolves.toEqual([])
  })
})
