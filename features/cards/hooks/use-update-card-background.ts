import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { updateCardBackground } from '../actions'
import { invalidateCardQueries } from '../utils'

export const useUpdateCardBackground = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const updateCardBackgroundAction = useAction(updateCardBackground, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi cập nhật nền thẻ.')
    }
  })

  return { updateCardBackgroundAction }
}
