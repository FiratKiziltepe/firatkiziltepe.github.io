import { describe, expect, it } from 'vitest'
import { formatSource, parseTagInput } from './utils'

describe('parseTagInput', () => {
  it('etiketleri temizler ve yinelenenleri kaldırır', () => {
    expect(parseTagInput('Yapay zeka, react; yapay zeka\nSupabase')).toEqual([
      'Yapay zeka',
      'react',
      'Supabase',
    ])
  })
})

describe('formatSource', () => {
  it('bilinen kaynak kodunu Türkçe etikete çevirir', () => {
    expect(formatSource('x')).toBe('X/Twitter')
  })
})
