import type { ProductPrice } from '../types'

export function effectivePriceFor(productPrices: ProductPrice[], productId: number, consumedOn: string) {
  return productPrices
    .filter((item) => item.productId === productId && item.effectiveOn <= consumedOn)
    .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn))[0]?.price ?? null
}
