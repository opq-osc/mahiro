import { getQQsList } from '@/services/qqs'
import { useQuery } from '@tanstack/react-query'

export const useQQsList = () => {
  return useQuery({
    queryFn: async () => {
      const data = await getQQsList()
      return data
    },
    queryKey: ['useQQsList'],
    keepPreviousData: true,
    cacheTime: 30 * 1e3,
    staleTime: 30 * 1e3,
  })
}
