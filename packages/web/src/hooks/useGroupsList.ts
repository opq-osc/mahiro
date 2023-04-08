import { getGroupsList } from '@/services/groups'
import { useQuery } from '@tanstack/react-query'

export const useGroupsList = () => {
  return useQuery({
    queryFn: async () => {
      const data = await getGroupsList()
      return data
    },
    queryKey: ['useGroupsList'],
    keepPreviousData: true,
  })
}
