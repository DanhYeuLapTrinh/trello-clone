import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { toggleCompleteCard } from '../actions'
import { invalidateCardQueries } from '../utils'

export const useToggleCompleteCard = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const toggleCompleteCardAction = useAction(toggleCompleteCard, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi cập nhật thẻ.')
    }
  })

  return { toggleCompleteCardAction }
}
