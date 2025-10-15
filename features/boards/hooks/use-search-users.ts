import { User } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const searchUsersForInvite = async (query: string, boardSlug: string) => {
  const { data } = await axios.get<User[]>(`http://localhost:3000/api/users/search?boardSlug=${boardSlug}&q=${query}`)
  return data
}

export const useSearchUsers = (query: string, boardSlug: string) => {
  return useQuery({
    queryKey: ['search-users', query, boardSlug],
    queryFn: () => searchUsersForInvite(query, boardSlug),
    enabled: !!query && !!boardSlug
  })
}
