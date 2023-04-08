import { getVersion } from '@/services/version'
import { useVersion } from '@/stores/global'
import { useQuery } from '@tanstack/react-query'

export const useVersionGet = () => {
  const [_, setVersion] = useVersion()
  return useQuery({
    queryFn: async () => {
      const data = await getVersion()
      return data
    },
    queryKey: ['useVersionGet'],
    keepPreviousData: true,
    // 30 minutes
    cacheTime: 30 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
    onSuccess(data) {
      setVersion(data)
    },
  })
}
