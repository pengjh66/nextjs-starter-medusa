"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  console.log('[listProducts] Called with:', { pageParam, countryCode, regionId, queryParams })
  
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    console.log('[listProducts] Getting region for countryCode:', countryCode)
    region = await getRegion(countryCode)
  } else {
    console.log('[listProducts] Retrieving region by ID:', regionId)
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    console.error('[listProducts] No region found, returning empty products')
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  console.log('[listProducts] Region obtained:', { id: region.id, name: region.name })

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  console.log('[listProducts] Fetching from API with query:', {
    limit,
    offset,
    region_id: region?.id,
  })

  try {
    const result = await sdk.client
      .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
        `/store/products`,
        {
          method: "GET",
          query: {
            limit,
            offset,
            region_id: region?.id,
            fields:
              "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
            ...queryParams,
          },
          headers,
          next,
          cache: "force-cache",
        }
      )
      .then(({ products, count }) => {
        console.log('[listProducts] API response received:', { count, productsLength: products?.length })
        
        const nextPage = count > offset + limit ? pageParam + 1 : null

        return {
          response: {
            products,
            count,
          },
          nextPage: nextPage,
          queryParams,
        }
      })
    
    console.log('[listProducts] Returning result with', result.response.products.length, 'products')
    return result
  } catch (error: any) {
    console.error('[listProducts] API fetch error:', {
      message: error.message,
      stack: error.stack,
      response: error.response,
    })
    
    // Return empty products array instead of crashing
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  console.log('[listProductsWithSort] Called with:', { page, sortBy, countryCode })
  
  const limit = queryParams?.limit || 12

  console.log('[listProductsWithSort] Calling listProducts...')
  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  console.log('[listProductsWithSort] Products received:', { count, productsLength: products.length })
  console.log('[listProductsWithSort] Sorting products by:', sortBy)
  
  const sortedProducts = sortProducts(products, sortBy)

  console.log('[listProductsWithSort] Products sorted successfully')

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  console.log('[listProductsWithSort] Returning paginated products:', paginatedProducts.length)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
