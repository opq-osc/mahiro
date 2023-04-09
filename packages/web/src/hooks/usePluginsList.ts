import { getPluginsList } from '@/services/plugins'
import { useQuery } from '@tanstack/react-query'

export const usePluginsList = (
  opts: {
    cache?: boolean
  } = {},
) => {
  const { cache = false } = opts

  return useQuery({
    queryFn: async () => {
      const data = await getPluginsList()
      return data
    },
    queryKey: ['usePluginsList'],
    keepPreviousData: true,
    ...(cache
      ? {
          cacheTime: 30 * 1e3,
          staleTime: 30 * 1e3,
        }
      : {}),
  })
}
