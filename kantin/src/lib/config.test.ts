import { normalizeUsername } from './config'

describe('kullanıcı adı', () => {
  it('boşlukları temizler ve küçük harfe çevirir', () => {
    expect(normalizeUsername('  FIRAT.K  ')).toBe('firat.k')
  })
})
