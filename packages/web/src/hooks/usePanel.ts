import { getPanel } from '@/services/panel'
import { useQuery } from '@tanstack/react-query'

export const usePanel = () => {
  return useQuery({
    queryFn: async () => {
      const data = await getPanel()
      return data
    },
    queryKey: ['usePanel'],
    keepPreviousData: true,
  })
}
