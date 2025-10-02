import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteCardDate } from '../actions'
import { invalidateCardQueries } from '../utils'

export const useDeleteCardDate = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteCardDateAction = useAction(deleteCardDate, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gỡ nhắc nhở.')
    }
  })

  return { deleteCardDateAction }
}
