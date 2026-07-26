import type {
  ItemFilters,
  ItemsResponse,
  SavedItem,
  SavedItemInput,
  SavedItemUpdate,
} from './types'

const functionName = 'telegram-webhook'

function functionUrl(): string {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ??
    'https://knqfsmpglknckrojwefo.supabase.co'

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL ayarlı değil.')
  }

  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`
}

async function requestJson<T>(
  accessToken: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  params: URLSearchParams,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${functionUrl()}?${params.toString()}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : 'İstek tamamlanamadı.'
    throw new Error(message)
  }

  return payload as T
}

export function fetchItems(
  accessToken: string,
  filters: ItemFilters,
): Promise<ItemsResponse> {
  const params = new URLSearchParams({ action: 'list' })

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.source) {
    params.set('source', filters.source)
  }

  if (filters.favoritesOnly) {
    params.set('favorites', 'true')
  }

  return requestJson<ItemsResponse>(accessToken, 'GET', params)
}

export function createItem(
  accessToken: string,
  item: SavedItemInput,
): Promise<{ item: SavedItem }> {
  return requestJson<{ item: SavedItem }>(
    accessToken,
    'POST',
    new URLSearchParams({ action: 'create' }),
    item,
  )
}

export function updateItem(
  accessToken: string,
  id: string,
  item: SavedItemUpdate,
): Promise<{ item: SavedItem }> {
  return requestJson<{ item: SavedItem }>(
    accessToken,
    'PATCH',
    new URLSearchParams({ action: 'update', id }),
    item,
  )
}

export function deleteItem(
  accessToken: string,
  id: string,
): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(
    accessToken,
    'DELETE',
    new URLSearchParams({ action: 'delete', id }),
  )
}
