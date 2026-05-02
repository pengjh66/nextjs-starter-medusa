"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    console.log('[getRegion] Called with countryCode:', countryCode)
    
    if (regionMap.has(countryCode)) {
      console.log('[getRegion] Found in cache')
      return regionMap.get(countryCode)
    }

    console.log('[getRegion] Not in cache, fetching regions...')
    const regions = await listRegions()

    if (!regions) {
      console.error('[getRegion] No regions returned from listRegions()')
      return null
    }

    console.log('[getRegion] Regions fetched:', regions.length)

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("us")

    console.log('[getRegion] Region found:', region ? { id: region.id, name: region.name } : 'null')
    return region
  } catch (e: any) {
    console.error('[getRegion] Error:', e.message, e.stack)
    return null
  }
}
