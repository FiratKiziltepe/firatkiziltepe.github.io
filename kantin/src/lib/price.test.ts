import { describe, expect, it } from 'vitest'
import { effectivePriceFor } from './price'

const prices = [
  { productId: 1, price: 15, effectiveOn: '2026-07-01' },
  { productId: 1, price: 20, effectiveOn: '2026-08-02' },
  { productId: 2, price: 30, effectiveOn: '2026-07-01' },
]

describe('effectivePriceFor', () => {
  it('seçilen gün için en son geçerli fiyatı döndürür', () => {
    expect(effectivePriceFor(prices, 1, '2026-07-31')).toBe(15)
    expect(effectivePriceFor(prices, 1, '2026-08-02')).toBe(20)
  })

  it('ürünün o tarihte fiyatı yoksa null döndürür', () => {
    expect(effectivePriceFor(prices, 1, '2026-06-30')).toBeNull()
  })
})
