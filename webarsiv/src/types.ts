export type SavedItem = {
  id: string
  telegram_user_id: number | null
  telegram_message_id: number | null
  title: string
  original_text: string
  personal_note: string
  url: string
  summary: string
  category: string
  tags: string[]
  source: string
  is_favorite: boolean
  created_at: string
  updated_at: string | null
}

export type ItemDraft = {
  title: string
  url: string
  original_text: string
  personal_note: string
  summary: string
  category: string
  tags: string
  source: string
}

export type SavedItemInput = Omit<
  SavedItem,
  | 'id'
  | 'telegram_user_id'
  | 'telegram_message_id'
  | 'tags'
  | 'created_at'
  | 'updated_at'
> & {
  tags: string[]
}

export type SavedItemUpdate = Partial<SavedItemInput>

export type ItemFilters = {
  search: string
  category: string
  source: string
  favoritesOnly: boolean
}

export type ItemsResponse = {
  items: SavedItem[]
  filters: {
    categories: string[]
    sources: string[]
  }
}
