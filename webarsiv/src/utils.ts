import type { ItemDraft, SavedItem, SavedItemInput } from './types'

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  other: 'Diğer',
  web: 'Web',
  x: 'X/Twitter',
}

export function parseTagInput(value: string): string[] {
  const seen = new Set<string>()

  return value
    .split(/[,;\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase('tr-TR')
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

export function formatSource(source: string): string {
  return sourceLabels[source] ?? source
}

export function draftFromItem(item: SavedItem): ItemDraft {
  return {
    title: item.title,
    url: item.url,
    original_text: item.original_text,
    personal_note: item.personal_note,
    summary: item.summary,
    category: item.category,
    tags: item.tags.join(', '),
    source: item.source,
  }
}

export function inputFromDraft(
  draft: ItemDraft,
  options: { isFavorite?: boolean } = {},
): SavedItemInput {
  return {
    title: draft.title.trim(),
    url: draft.url.trim(),
    original_text: draft.original_text.trim(),
    personal_note: draft.personal_note.trim(),
    summary: draft.summary.trim(),
    category: draft.category.trim() || 'Genel',
    tags: parseTagInput(draft.tags),
    source: draft.source.trim() || 'web',
    is_favorite: options.isFavorite ?? false,
  }
}

export function emptyDraft(): ItemDraft {
  return {
    title: '',
    url: '',
    original_text: '',
    personal_note: '',
    summary: '',
    category: 'Genel',
    tags: '',
    source: 'web',
  }
}
