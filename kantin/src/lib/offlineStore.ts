import type { AddConsumptionInput, ConsumptionEntry, Profile, WeekData } from '../types'

const DATABASE_NAME = 'kantin-defteri-offline'
const DATABASE_VERSION = 1
const RECORD_STORE = 'records'
const MUTATION_STORE = 'consumption-mutations'

type MutationStatus = 'pending' | 'failed'

export interface OfflineConsumptionMutation {
  id: string
  actorId: string
  input: AddConsumptionInput
  localEntry: ConsumptionEntry
  status: MutationStatus
  error: string | null
  createdAt: string
}

interface OfflineRecord<T> {
  key: string
  value: T
}

interface CachedReferenceData {
  profiles: WeekData['profiles']
  categories: WeekData['categories']
  products: WeekData['products']
  productPrices: WeekData['productPrices']
  cachedAt: string
}

let databasePromise: Promise<IDBDatabase> | null = null

function database() {
  if (!('indexedDB' in globalThis)) {
    return Promise.reject(new Error('Bu tarayıcı çevrimdışı veri saklamayı desteklemiyor.'))
  }
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(RECORD_STORE)) db.createObjectStore(RECORD_STORE, { keyPath: 'key' })
      if (!db.objectStoreNames.contains(MUTATION_STORE)) db.createObjectStore(MUTATION_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Çevrimdışı veritabanı açılamadı.'))
  })
  return databasePromise
}

async function readRecord<T>(key: string): Promise<T | null> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction(RECORD_STORE, 'readonly').objectStore(RECORD_STORE).get(key)
    request.onsuccess = () => resolve((request.result as OfflineRecord<T> | undefined)?.value ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function writeRecord<T>(key: string, value: T) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE, 'readwrite')
    transaction.objectStore(RECORD_STORE).put({ key, value } satisfies OfflineRecord<T>)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function deleteRecord(key: string) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(RECORD_STORE, 'readwrite')
    transaction.objectStore(RECORD_STORE).delete(key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export function setCachedActiveProfile(profile: Profile | null) {
  return profile ? writeRecord('active-profile', profile) : deleteRecord('active-profile')
}

export function getCachedActiveProfile() {
  return readRecord<Profile>('active-profile')
}

export async function cacheWeek(actorId: string, weekStart: string, data: WeekData) {
  await Promise.all([
    writeRecord(`week:${actorId}:${weekStart}`, data),
    writeRecord<CachedReferenceData>(`reference:${actorId}`, {
      profiles: data.profiles,
      categories: data.categories,
      products: data.products,
      productPrices: data.productPrices,
      cachedAt: new Date().toISOString(),
    }),
  ])
}

export function getCachedWeek(actorId: string, weekStart: string) {
  return readRecord<WeekData>(`week:${actorId}:${weekStart}`)
}

export async function buildWeekFromCachedReference(actorId: string): Promise<WeekData | null> {
  const reference = await readRecord<CachedReferenceData>(`reference:${actorId}`)
  if (!reference) return null
  return {
    profiles: reference.profiles,
    categories: reference.categories,
    products: reference.products,
    productPrices: reference.productPrices,
    entries: [],
    revisions: [],
    weeklyAccounts: [],
  }
}

export async function putOfflineMutation(mutation: OfflineConsumptionMutation) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MUTATION_STORE, 'readwrite')
    transaction.objectStore(MUTATION_STORE).put(mutation)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function getOfflineMutations(actorId: string) {
  const db = await database()
  return new Promise<OfflineConsumptionMutation[]>((resolve, reject) => {
    const request = db.transaction(MUTATION_STORE, 'readonly').objectStore(MUTATION_STORE).getAll()
    request.onsuccess = () => resolve(
      (request.result as OfflineConsumptionMutation[])
        .filter((item) => item.actorId === actorId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    )
    request.onerror = () => reject(request.error)
  })
}

export async function deleteOfflineMutation(id: string) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MUTATION_STORE, 'readwrite')
    transaction.objectStore(MUTATION_STORE).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
