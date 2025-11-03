import { getMe } from '@/features/users/queries'
import { useQuery } from '@tanstack/react-query'

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe
  })
}
