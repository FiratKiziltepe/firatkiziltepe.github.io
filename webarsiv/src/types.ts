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
  screenshot_file_id: string
  screenshot_mime_type: string
  screenshot_path: string
  screenshot_url: string
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
  | 'screenshot_file_id'
  | 'screenshot_mime_type'
  | 'screenshot_path'
  | 'screenshot_url'
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
