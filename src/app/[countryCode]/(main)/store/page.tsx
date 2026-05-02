import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  try {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { sortBy, page } = searchParams

    return (
      <StoreTemplate
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    )
  } catch (error: any) {
    console.error('[StorePage] Error loading store page:', {
      message: error.message,
      stack: error.stack,
    })
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <h1 className="text-2xl font-semibold mb-4">Unable to Load Store</h1>
        <p className="text-gray-600 mb-4">
          We're having trouble loading the store page. Please try again later.
        </p>
        <p className="text-sm text-gray-500">
          Error: {error.message}
        </p>
      </div>
    )
  }
}
