import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  if (!products || products.length === 0) {
    return []
  }

  let sortedProducts = products as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        const validPrices = product.variants
          .map((v) => v?.calculated_price?.calculated_amount)
          .filter((price): price is number => typeof price === 'number' && !isNaN(price) && price > 0)
        
        product._minPrice = validPrices.length > 0 ? Math.min(...validPrices) : Infinity
      } else {
        product._minPrice = Infinity
      }
    })

    sortedProducts.sort((a, b) => {
      const diff = (a._minPrice ?? Infinity) - (b._minPrice ?? Infinity)
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
  }

  return sortedProducts
}
