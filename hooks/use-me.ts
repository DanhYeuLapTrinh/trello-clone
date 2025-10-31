import { getMe } from '@/features/users/actions'
import { useQuery } from '@tanstack/react-query'

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe
  })
}
