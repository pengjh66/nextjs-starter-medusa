import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  console.log('[PaginatedProducts] Starting with:', { sortBy, page, countryCode })
  
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  console.log('[PaginatedProducts] Fetching region for:', countryCode)
  const region = await getRegion(countryCode)

  if (!region) {
    console.error('[PaginatedProducts] No region found for countryCode:', countryCode)
    return null
  }

  console.log('[PaginatedProducts] Region found:', region.id, region.name)
  console.log('[PaginatedProducts] Fetching products with params:', queryParams)

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  console.log('[PaginatedProducts] Products fetched:', { count, productsLength: products.length })
  console.log('[PaginatedProducts] First product sample:', products[0] ? {
    id: products[0].id,
    title: products[0].title,
    variantsCount: products[0].variants?.length,
    firstVariantHasPrice: products[0].variants?.[0]?.calculated_price ? 'yes' : 'no'
  } : 'no products')

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
