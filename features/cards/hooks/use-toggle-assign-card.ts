import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { toggleAssignCard } from '../actions'
import { invalidateCardQueries } from '../utils'

export const useToggleAssignCard = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const toggleAssignCardAction = useAction(toggleAssignCard, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gán thành viên.')
    }
  })

  return { toggleAssignCardAction }
}
