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

  // Enhanced pre-request logging
  const requestUrl = `/store/products`
  const requestQuery = {
    limit,
    offset,
    region_id: region?.id,
    fields:
      "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
    ...queryParams,
  }
  
  console.log('[listProducts] === PRE-REQUEST DEBUG ===')
  console.log('[listProducts] Request URL:', requestUrl)
  console.log('[listProducts] Request Method:', 'GET')
  console.log('[listProducts] Request Headers:', JSON.stringify(headers, null, 2))
  console.log('[listProducts] Request Query Params:', JSON.stringify(requestQuery, null, 2))
  console.log('[listProducts] Cache Options:', JSON.stringify(next, null, 2))
  console.log('[listProducts] SDK Client Base URL:', sdk.client?.config?.baseUrl || 'unknown')
  console.log('[listProducts] ========================')

  try {
    const result = await sdk.client
      .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
        requestUrl,
        {
          method: "GET",
          query: requestQuery,
          headers,
          next,
          cache: "force-cache",
        }
      )
      .then(({ products, count }) => {
        // Enhanced success logging
        console.log('[listProducts] === SUCCESS RESPONSE ===')
        console.log('[listProducts] Response Status: SUCCESS')
        console.log('[listProducts] Products Count:', count)
        console.log('[listProducts] Products Returned:', products?.length || 0)
        
        if (products && products.length > 0) {
          console.log('[listProducts] First Product Sample:', {
            id: products[0].id,
            title: products[0].title,
            handle: products[0].handle,
            status: products[0].status,
            variants_count: products[0].variants?.length || 0,
          })
        }
        console.log('[listProducts] =======================')
        
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
    // Enhanced error logging - capture ALL available error details
    console.error('[listProducts] === API FETCH ERROR - FULL DETAILS ===')
    console.error('[listProducts] Error Type:', error?.constructor?.name || typeof error)
    console.error('[listProducts] Error Message:', error?.message)
    console.error('[listProducts] Error Name:', error?.name)
    console.error('[listProducts] Error Stack:', error?.stack)
    
    // HTTP Response details
    console.error('[listProducts] HTTP Status:', error?.status || error?.response?.status || 'undefined')
    console.error('[listProducts] HTTP Status Text:', error?.statusText || error?.response?.statusText || 'undefined')
    
    // Response data/body
    console.error('[listProducts] Response Data:', error?.response?.data || error?.data || 'undefined')
    console.error('[listProducts] Response Body:', error?.response?.body || error?.body || 'undefined')
    console.error('[listProducts] Response Text:', error?.response?.text || error?.text || 'undefined')
    
    // Request details from error
    console.error('[listProducts] Request URL from error:', error?.config?.url || error?.request?.url || 'undefined')
    console.error('[listProducts] Request Method from error:', error?.config?.method || error?.request?.method || 'undefined')
    console.error('[listProducts] Request Params from error:', error?.config?.params || error?.request?.params || 'undefined')
    console.error('[listProducts] Request Headers from error:', error?.config?.headers || error?.request?.headers || 'undefined')
    
    // Additional error properties
    console.error('[listProducts] Error Cause:', error?.cause || 'undefined')
    console.error('[listProducts] Error Code:', error?.code || 'undefined')
    console.error('[listProducts] Error Response Object:', error?.response || 'undefined')
    console.error('[listProducts] Error Request Object:', error?.request || 'undefined')
    
    // Full error object serialization
    console.error('[listProducts] Full Error Object (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Original request details for correlation
    console.error('[listProducts] Original Request URL:', requestUrl)
    console.error('[listProducts] Original Request Query:', JSON.stringify(requestQuery, null, 2))
    console.error('[listProducts] Original Request Headers:', JSON.stringify(headers, null, 2))
    
    console.error('[listProducts] =====================================')
    
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
