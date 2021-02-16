import { useMemo } from 'react'
import { HookHandler } from '@commerce/utils/types'
import useWishlist, { UseWishlist } from '@commerce/wishlist/use-wishlist'
import type { Wishlist } from '../api/wishlist'
import useCustomer from '../customer/use-customer'
import type { BigcommerceProvider } from '..'

export default useWishlist as UseWishlist<BigcommerceProvider>

export const handler: HookHandler<
  Wishlist | null,
  { includeProducts?: boolean },
  { customerId?: number; includeProducts: boolean },
  { isEmpty?: boolean }
> = {
  fetchOptions: {
    url: '/api/bigcommerce/wishlist',
    method: 'GET',
  },
  fetcher({ input: { customerId, includeProducts }, options, fetch }) {
    if (!customerId) return null

    // Use a dummy base as we only care about the relative path
    const url = new URL(options.url!, 'http://a')

    if (includeProducts) url.searchParams.set('products', '1')

    return fetch({
      url: url.pathname + url.search,
      method: options.method,
    })
  },
  useHook({ input, useData }) {
    const { data: customer } = useCustomer()
    const response = useData({
      input: [
        ['customerId', (customer as any)?.id],
        ['includeProducts', input.includeProducts],
      ],
      swrOptions: {
        revalidateOnFocus: false,
        ...input.swrOptions,
      },
    })

    return useMemo(
      () =>
        Object.create(response, {
          isEmpty: {
            get() {
              return (response.data?.items?.length || 0) <= 0
            },
            enumerable: true,
          },
        }),
      [response]
    )
  },
}
